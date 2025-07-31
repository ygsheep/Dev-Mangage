import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  
  // Database
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || ['http://localhost:5173', 'http://localhost:5174'],
  
  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  
  // File upload
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
  
  // API
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
} as const

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL']

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar] && config.nodeEnv === 'production') {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}