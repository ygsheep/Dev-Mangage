import { app } from './app'
import { config } from './config'
import { prisma } from './database'

async function startServer(): Promise<void> {
  try {
    // Test database connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')

    // Start the server
    const server = app.listen(config.port, () => {
      console.log(`🚀 DevAPI Manager Backend running on port ${config.port}`)
      console.log(`📚 API Documentation: http://localhost:${config.port}${config.apiPrefix}`)
      console.log(`🏥 Health Check: http://localhost:${config.port}/health`)
      console.log(`🌍 Environment: ${config.nodeEnv}`)
    })

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      console.log(`\n${signal} received. Shutting down gracefully...`)
      
      server.close(async () => {
        console.log('HTTP server closed')
        
        try {
          await prisma.$disconnect()
          console.log('Database connection closed')
          process.exit(0)
        } catch (error) {
          console.error('Error during shutdown:', error)
          process.exit(1)
        }
      })
    }

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))

  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Start the server
startServer().catch((error) => {
  console.error('❌ Unhandled error during server startup:', error)
  process.exit(1)
})