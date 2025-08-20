#!/usr/bin/env node

const { spawn, exec } = require('child_process')
const path = require('path')
const fs = require('fs')
const { promisify } = require('util')

const execAsync = promisify(exec)

console.log('🚀 DevAPI Manager Development Environment')
console.log('=========================================\n')

// Kill any existing processes on our ports
async function killProcessOnPort(port) {
  try {
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`)
    if (stdout) {
      const lines = stdout.split('\n').filter(line => line.includes('LISTENING'))
      for (const line of lines) {
        const parts = line.trim().split(/\s+/)
        const pid = parts[parts.length - 1]
        if (pid && pid !== '0') {
          console.log(`⚡ Killing process on port ${port} (PID: ${pid})`)
          await execAsync(`taskkill /F /PID ${pid}`)
        }
      }
    }
  } catch (error) {
    // Port is likely not in use, which is fine
  }
}

// Function to run command with colored output
const runCommand = (command, args, cwd, label, color = '\x1b[36m') => {
  return new Promise((resolve, reject) => {
    console.log(`${color}📦 Starting ${label}...\x1b[0m`)

    const child = spawn(command, args, {
      cwd,
      stdio: 'pipe',
      shell: true,
      env: { ...process.env, FORCE_COLOR: '1' },
    })

    child.stdout.on('data', data => {
      const output = data.toString()
      process.stdout.write(`${color}[${label}]\x1b[0m ${output}`)
    })

    child.stderr.on('data', data => {
      const output = data.toString()
      process.stderr.write(`${color}[${label}]\x1b[0m ${output}`)
    })

    child.on('error', error => {
      console.error(`❌ ${label} failed:`, error.message)
      reject(error)
    })

    child.on('close', code => {
      if (code === 0) {
        console.log(`✅ ${label} started successfully`)
        resolve(child)
      } else {
        console.error(`❌ ${label} failed with code ${code}`)
        reject(new Error(`Process exited with code ${code}`))
      }
    })

    // Return the child process so we can kill it later
    resolve(child)
  })
}

// Function to wait for a service to be ready
async function waitForService(url, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        return true
      }
    } catch (error) {
      // Service not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  return false
}

async function main() {
  const processes = []

  try {
    // Step 1: Clean up any existing processes
    console.log('🧹 Cleaning up existing processes...')
    await killProcessOnPort(3000) // Backend
    await killProcessOnPort(5173) // Frontend

    // Step 2: Build shared package
    console.log('📦 Building shared package...')
    await runCommand(
      'npm',
      ['run', 'build'],
      path.join(__dirname, 'packages/shared'),
      'Shared Build'
    )

    // Step 3: Setup database
    console.log('🗄️  Setting up database...')

    // Generate Prisma client
    await runCommand(
      'npx',
      ['prisma', 'generate'],
      path.join(__dirname, 'packages/backend'),
      'Prisma Generate'
    )

    // Push database schema
    await runCommand(
      'npx',
      ['prisma', 'db', 'push'],
      path.join(__dirname, 'packages/backend'),
      'Database Push'
    )

    // Seed database (only if empty)
    try {
      await runCommand(
        'npm',
        ['run', 'db:seed'],
        path.join(__dirname, 'packages/backend'),
        'Database Seed'
      )
    } catch (error) {
      console.log('⚠️  Database seeding skipped (might already have data)')
    }

    console.log('\n🚀 Starting development servers...\n')

    // Step 4: Start backend server
    const backendProcess = await runCommand(
      'npm',
      ['run', 'dev'],
      path.join(__dirname, 'packages/backend'),
      'Backend',
      '\x1b[32m' // Green
    )
    processes.push(backendProcess)

    // Wait for backend to be ready
    console.log('⏳ Waiting for backend to be ready...')
    const backendReady = await waitForService('http://localhost:3000/health')
    if (!backendReady) {
      throw new Error('Backend failed to start within timeout')
    }
    console.log('✅ Backend is ready!')

    // Step 5: Start frontend server
    const frontendProcess = await runCommand(
      'npm',
      ['run', 'dev'],
      path.join(__dirname, 'packages/frontend'),
      'Frontend',
      '\x1b[35m' // Magenta
    )
    processes.push(frontendProcess)

    // Step 6: Start MCP server (optional)
    try {
      const mcpProcess = await runCommand(
        'npm',
        ['run', 'dev'],
        path.join(__dirname, 'packages/mcp-server'),
        'MCP Server',
        '\x1b[33m' // Yellow
      )
      processes.push(mcpProcess)
    } catch (error) {
      console.log('⚠️  MCP Server failed to start (optional service)')
    }

    console.log('\n🎉 DevAPI Manager is running!')
    console.log('=====================================')
    console.log('📱 Frontend:  http://localhost:5173')
    console.log('🔧 Backend:   http://localhost:3000')
    console.log('📚 API Docs:  http://localhost:3000/api/v1')
    console.log('🏥 Health:    http://localhost:3000/health')
    console.log('\n💡 Press Ctrl+C to stop all services')

    // Handle graceful shutdown
    const gracefulShutdown = () => {
      console.log('\n🛑 Shutting down services...')
      processes.forEach(process => {
        if (process && process.kill) {
          process.kill('SIGTERM')
        }
      })

      setTimeout(() => {
        console.log('👋 All services stopped')
        process.exit(0)
      }, 2000)
    }

    process.on('SIGINT', gracefulShutdown)
    process.on('SIGTERM', gracefulShutdown)

    // Keep the process running
    await new Promise(() => {}) // Run forever until interrupted
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message)

    // Clean up any started processes
    processes.forEach(process => {
      if (process && process.kill) {
        process.kill('SIGTERM')
      }
    })

    process.exit(1)
  }
}

// Add fetch polyfill for older Node.js versions
if (!global.fetch) {
  global.fetch = async url => {
    const http = require('http')
    return new Promise((resolve, reject) => {
      const req = http.get(url, res => {
        resolve({ ok: res.statusCode === 200 })
      })
      req.on('error', reject)
      req.setTimeout(5000, () => reject(new Error('Timeout')))
    })
  }
}

main().catch(console.error)
