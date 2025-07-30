import express from 'express'
import cors from 'cors'
import { spawn } from 'child_process'
import path from 'path'

const app = express()
const PORT = process.env.MCP_BRIDGE_PORT || 3002

app.use(cors())
app.use(express.json())

// MCP服务器进程
let mcpProcess: any = null

// 启动MCP服务器
function startMCPServer() {
  const mcpServerPath = path.join(__dirname, '../mcp-server/dist/index.js')
  
  mcpProcess = spawn('node', [mcpServerPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: path.join(__dirname, '../mcp-server')
  })

  mcpProcess.on('error', (error: Error) => {
    console.error('MCP Server error:', error)
  })

  mcpProcess.on('close', (code: number) => {
    console.log(`MCP Server exited with code ${code}`)
    mcpProcess = null
  })

  console.log('MCP Server started')
}

// MCP工具调用代理
app.post('/mcp/tools/:toolName', async (req, res) => {
  try {
    if (!mcpProcess) {
      return res.status(503).json({ error: 'MCP Server not available' })
    }

    const { toolName } = req.params
    const { arguments: args } = req.body

    // 构造MCP请求
    const mcpRequest = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args || {}
      }
    }

    // 发送请求到MCP服务器
    const response = await sendMCPRequest(mcpRequest)
    
    if (response.error) {
      return res.status(400).json({ error: response.error })
    }

    res.json(response.result)
  } catch (error) {
    console.error('MCP bridge error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 发送请求到MCP服务器
function sendMCPRequest(request: any): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!mcpProcess) {
      reject(new Error('MCP Server not available'))
      return
    }

    const requestData = JSON.stringify(request) + '\n'
    let responseData = ''

    // 设置超时
    const timeout = setTimeout(() => {
      reject(new Error('MCP request timeout'))
    }, 10000)

    // 监听响应
    const onData = (data: Buffer) => {
      responseData += data.toString()
      
      try {
        const response = JSON.parse(responseData.trim())
        clearTimeout(timeout)
        mcpProcess.stdout.off('data', onData)
        resolve(response)
      } catch (error) {
        // 数据可能不完整，继续等待
      }
    }

    mcpProcess.stdout.on('data', onData)

    // 发送请求
    mcpProcess.stdin.write(requestData)
  })
}

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    mcpServer: mcpProcess ? 'running' : 'stopped',
    timestamp: new Date().toISOString()
  })
})

// 启动MCP服务器
app.post('/mcp/start', (req, res) => {
  if (mcpProcess) {
    return res.json({ message: 'MCP Server already running' })
  }

  startMCPServer()
  res.json({ message: 'MCP Server started' })
})

// 停止MCP服务器
app.post('/mcp/stop', (req, res) => {
  if (!mcpProcess) {
    return res.json({ message: 'MCP Server not running' })
  }

  mcpProcess.kill()
  mcpProcess = null
  res.json({ message: 'MCP Server stopped' })
})

// 重启MCP服务器
app.post('/mcp/restart', (req, res) => {
  if (mcpProcess) {
    mcpProcess.kill()
    mcpProcess = null
  }

  setTimeout(() => {
    startMCPServer()
    res.json({ message: 'MCP Server restarted' })
  }, 1000)
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`MCP Bridge Server running on port ${PORT}`)
  startMCPServer()
})

// 优雅关闭
process.on('SIGINT', () => {
  console.log('Shutting down MCP Bridge Server...')
  if (mcpProcess) {
    mcpProcess.kill()
  }
  process.exit(0)
})

export default app