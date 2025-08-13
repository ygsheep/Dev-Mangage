import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { config } from './config'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import { setupRoutes } from './routes'
import logger, { morganStream } from './utils/logger'
import { 
  requestLoggingMiddleware, 
  errorLoggingMiddleware, 
  performanceMiddleware,
  rateLimitLogger
} from './middleware/logging'

const app = express()

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}))

// CORS configuration
app.use(cors({
  origin: Array.isArray(config.corsOrigin) ? config.corsOrigin as string[] : config.corsOrigin as string,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}))

// Rate limiting with logging
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // onLimitReached 已在 v7 中废弃，改用 handler 或中间件处理
})
app.use(limiter)
app.use(rateLimitLogger)

// Body parsing middleware
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Performance monitoring middleware
app.use(performanceMiddleware)

// Logging middleware
if (config.nodeEnv !== 'test') {
  // Use Morgan with Winston stream
  app.use(morgan(
    config.nodeEnv === 'production' 
      ? ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms'
      : ':method :url :status :res[content-length] - :response-time ms',
    { stream: morganStream }
  ))
  
  // Express Winston request logging
  app.use(requestLoggingMiddleware)
}

// Root endpoint - redirect to API documentation
app.get('/', (req, res) => {
  res.redirect(config.apiPrefix)
})

// Health check endpoint
app.get('/health', (req, res) => {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '2.0.0',
    environment: config.nodeEnv,
  }
  
  logger.debug('Health check accessed', {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  })
  
  res.json(healthData)
})

// API routes
setupRoutes(app)

// Error handling middleware
app.use(notFoundHandler)
// Express Winston error logging (before final error handler)
if (config.nodeEnv !== 'test') {
  app.use(errorLoggingMiddleware)
}
app.use(errorHandler)

export { app }