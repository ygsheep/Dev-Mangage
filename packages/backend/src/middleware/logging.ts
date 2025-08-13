import { Request, Response, NextFunction } from 'express'
import expressWinston from 'express-winston'
import logger, { loggerUtils } from '../utils/logger'
import winston from 'winston'

// 请求日志中间件
export const requestLoggingMiddleware = expressWinston.logger({
  winstonInstance: logger,
  level: 'http',
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms',
  expressFormat: false,
  colorize: false,
  ignoreRoute: (req: Request, res: Response) => {
    // 忽略健康检查和静态资源请求的日志
    return req.url === '/health' || req.url.startsWith('/static')
  },
  requestWhitelist: ['method', 'url', 'headers', 'query', 'body'],
  responseWhitelist: ['statusCode'],
  bodyBlacklist: ['password', 'token', 'apiKey'], // 过滤敏感信息
  headerBlacklist: ['authorization', 'cookie'], // 过滤敏感头部
  dynamicMeta: (req: Request, res: Response) => {
    return {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.id, // 如果有用户认证
      requestId: req.headers['x-request-id'],
    }
  },
})

// 错误日志中间件
export const errorLoggingMiddleware = expressWinston.errorLogger({
  winstonInstance: logger,
  level: 'error',
  meta: true,
  msg: 'Error {{err.status}} {{req.method}} {{req.url}}',
  requestWhitelist: ['method', 'url', 'headers', 'query', 'body'],
  headerBlacklist: ['authorization', 'cookie'],
  dynamicMeta: (req: Request, res: Response, err: Error) => {
    return {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.id,
      requestId: req.headers['x-request-id'],
      errorType: err.constructor.name,
    }
  },
})

// 性能监控中间件
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now()
  
  // 添加请求 ID
  if (!req.headers['x-request-id']) {
    req.headers['x-request-id'] = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // 监听响应完成事件
  res.on('finish', () => {
    const duration = Date.now() - startTime
    const { method, originalUrl, ip } = req
    const { statusCode } = res
    const userId = (req as any).user?.id

    // 记录请求日志
    loggerUtils.logRequest(method, originalUrl, statusCode, duration, userId)

    // 如果响应时间过长，记录性能警告
    if (duration > 1000) {
      loggerUtils.logPerformance(`Slow ${method} request`, duration, {
        url: originalUrl,
        statusCode,
        ip,
        userId,
      })
    }

    // 如果是错误状态码，记录额外信息
    if (statusCode >= 400) {
      const level = statusCode >= 500 ? 'error' : 'warn'
      logger.log(level, 'HTTP Error Response', {
        method,
        url: originalUrl,
        statusCode,
        duration: `${duration}ms`,
        ip,
        userId,
        userAgent: req.get('User-Agent'),
      })
    }
  })

  next()
}

// 数据库操作日志装饰器
export function logDatabaseOperation(operation: string, table: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now()
      try {
        const result = await method.apply(this, args)
        const duration = Date.now() - startTime
        loggerUtils.logDatabase(operation, table, duration)
        return result
      } catch (error) {
        const duration = Date.now() - startTime
        loggerUtils.logDatabase(operation, table, duration, error as Error)
        throw error
      }
    }
  }
}

// 用户操作日志装饰器
export function logUserAction(action: string, resource?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (req: Request, ...args: any[]) {
      const userId = (req as any).user?.id || 'anonymous'
      const result = await method.apply(this, [req, ...args])
      
      loggerUtils.logUserAction(userId, action, resource, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        params: req.params,
        query: req.query,
      })
      
      return result
    }
  }
}

// API 限流日志中间件
export const rateLimitLogger = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send

  res.send = function (data) {
    if (res.statusCode === 429) {
      loggerUtils.logSecurity('Rate limit exceeded', 'medium', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        method: req.method,
      })
    }
    return originalSend.call(this, data)
  }

  next()
}

// 创建结构化日志
export const createStructuredLog = (level: string, message: string, metadata: any = {}) => {
  logger.log(level, message, {
    ...metadata,
    timestamp: new Date().toISOString(),
    service: 'devapi-backend',
    version: process.env.npm_package_version || '1.0.0',
  })
}