import dotenv from 'dotenv'
import { API_CONFIG, CORS_CONFIG } from './config/api-endpoints'

// Load environment variables
dotenv.config({ path: '.env.development' })

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || String(API_CONFIG.SERVER.PORT), 10),
  
  // Database
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  
  // CORS - 使用统一配置
  corsOrigin: process.env.CORS_ORIGIN || CORS_CONFIG.ALLOWED_ORIGINS,
  
  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  
  // File upload
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
  
  // API - 使用统一配置
  apiPrefix: process.env.API_PREFIX || API_CONFIG.PREFIX,
  
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