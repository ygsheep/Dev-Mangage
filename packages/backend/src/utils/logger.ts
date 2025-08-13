import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import path from 'path'
import { config } from '../config'

// 自定义颜色
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'cyan',
  http: 'magenta',
  debug: 'green',
}

// 添加颜色到 winston
winston.addColors(colors)

// 自定义格式化器
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
)

// 控制台格式化器
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : ''
    return `${timestamp} [${level}]: ${message}${metaString}`
  })
)

// 日志存储目录
const logsDir = path.join(process.cwd(), 'logs')

// 创建传输器数组
const transports: winston.transport[] = [
  // 控制台输出
  new winston.transports.Console({
    level: config.nodeEnv === 'production' ? 'info' : 'debug',
    format: consoleFormat,
  }),
]

// 在生产环境或开发环境中添加文件日志
if (config.nodeEnv !== 'test') {
  // 错误日志文件 (只记录 error 级别)
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: customFormat,
      maxSize: '20m',
      maxFiles: '30d', // 保留30天
      zippedArchive: true,
    })
  )

  // 组合日志文件 (记录所有级别)
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: customFormat,
      maxSize: '50m',
      maxFiles: '15d', // 保留15天
      zippedArchive: true,
    })
  )

  // HTTP 请求日志文件
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'http-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      format: customFormat,
      maxSize: '30m',
      maxFiles: '7d', // 保留7天
      zippedArchive: true,
    })
  )
}

// 创建 logger 实例
const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  levels: winston.config.npm.levels,
  format: customFormat,
  transports,
  // 避免在测试环境中退出进程
  exitOnError: config.nodeEnv !== 'test',
})

// 创建流对象供 Morgan 使用
export const morganStream = {
  write: (message: string) => {
    // 移除 Morgan 添加的换行符
    logger.http(message.trim())
  },
}

// 添加便捷方法
export const loggerUtils = {
  // 记录 API 请求
  logRequest: (method: string, url: string, statusCode: number, responseTime: number, userId?: string) => {
    logger.http('API Request', {
      method,
      url,
      statusCode,
      responseTime: `${responseTime}ms`,
      userId,
      timestamp: new Date().toISOString(),
    })
  },

  // 记录数据库操作
  logDatabase: (operation: string, table: string, duration?: number, error?: Error) => {
    if (error) {
      logger.error('Database Operation Failed', {
        operation,
        table,
        duration: duration ? `${duration}ms` : undefined,
        error: error.message,
        stack: error.stack,
      })
    } else {
      logger.debug('Database Operation', {
        operation,
        table,
        duration: duration ? `${duration}ms` : undefined,
      })
    }
  },

  // 记录用户操作
  logUserAction: (userId: string, action: string, resource?: string, metadata?: any) => {
    logger.info('User Action', {
      userId,
      action,
      resource,
      metadata,
      timestamp: new Date().toISOString(),
    })
  },

  // 记录系统事件
  logSystemEvent: (event: string, data?: any) => {
    logger.info('System Event', {
      event,
      data,
      timestamp: new Date().toISOString(),
    })
  },

  // 记录性能指标
  logPerformance: (operation: string, duration: number, metadata?: any) => {
    const level = duration > 1000 ? 'warn' : 'info'
    logger.log(level, 'Performance Metric', {
      operation,
      duration: `${duration}ms`,
      metadata,
      timestamp: new Date().toISOString(),
    })
  },

  // 记录安全事件
  logSecurity: (event: string, severity: 'low' | 'medium' | 'high', details?: any) => {
    const level = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info'
    logger.log(level, 'Security Event', {
      event,
      severity,
      details,
      timestamp: new Date().toISOString(),
    })
  },
}

export default logger