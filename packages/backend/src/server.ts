import { app } from './app'
import { config } from './config'
import { prisma } from './database'
import { createServer } from 'net'
import logger, { loggerUtils } from './utils/logger'

// 检查端口是否可用
function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer()
    server.listen(port, () => {
      server.once('close', () => resolve(true))
      server.close()
    })
    server.on('error', () => resolve(false))
  })
}

// 找到可用端口
async function findAvailablePort(startPort: number): Promise<number> {
  let port = startPort
  while (!(await isPortAvailable(port))) {
    logger.warn(`端口 ${port} 已被占用，尝试使用 ${port + 1}...`)
    port++
    if (port > startPort + 100) {
      const error = new Error(`在范围 ${startPort}-${port} 内未找到可用端口`)
      logger.error('端口扫描失败', { startPort, endPort: port, error: error.message })
      throw error
    }
  }
  return port
}

async function startServer(): Promise<void> {
  try {
    // Test database connection
    const dbStartTime = Date.now()
    await prisma.$connect()
    const dbConnectTime = Date.now() - dbStartTime
    
    logger.info('数据库连接成功', { 
      connectionTime: `${dbConnectTime}ms`,
      database: 'postgresql'
    })
    loggerUtils.logSystemEvent('数据库连接成功', { connectionTime: dbConnectTime })

    // 找到可用端口
    const availablePort = await findAvailablePort(config.port)
    if (availablePort !== config.port) {
      logger.info(`使用端口 ${availablePort} 替代 ${config.port}`)
      loggerUtils.logSystemEvent('端口变更', { 
        originalPort: config.port, 
        newPort: availablePort 
      })
    }

    // Start the server
    const server = app.listen(availablePort, () => {
      logger.info('服务器启动成功', {
        port: availablePort,
        environment: config.nodeEnv,
        version: process.env.npm_package_version || '2.0.0',
        apiPrefix: config.apiPrefix,
      })
      
      // Log important URLs
      logger.info('服务器端点可用', {
        api: `http://localhost:${availablePort}${config.apiPrefix}`,
        health: `http://localhost:${availablePort}/health`,
        docs: `http://localhost:${availablePort}${config.apiPrefix}`,
      })
      
      loggerUtils.logSystemEvent('服务器启动', {
        port: availablePort,
        environment: config.nodeEnv,
      })
    })

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      logger.info(`收到 ${signal} 信号，开始优雅关闭服务器...`)
      loggerUtils.logSystemEvent('开始关闭服务器', { signal })
      
      server.close(async () => {
        logger.info('HTTP 服务器已关闭')
        
        try {
          await prisma.$disconnect()
          logger.info('数据库连接已关闭')
          loggerUtils.logSystemEvent('服务器关闭完成', { signal })
          process.exit(0)
        } catch (error) {
          logger.error('关闭服务器时发生错误', { 
            signal, 
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined 
          })
          process.exit(1)
        }
      })
    }

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))

  } catch (error) {
    logger.error('服务器启动失败', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    loggerUtils.logSystemEvent('服务器启动失败', { 
      error: error instanceof Error ? error.message : String(error) 
    })
    process.exit(1)
  }
}

// Start the server
startServer().catch((error) => {
  logger.error('服务器启动时发生未处理的错误', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  })
  loggerUtils.logSystemEvent('启动错误', { 
    error: error instanceof Error ? error.message : String(error) 
  })
  process.exit(1)
})