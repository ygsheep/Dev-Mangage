/**
 * 日志工具模块
 * 提供统一的日志记录功能，支持多种输出方式和格式化
 */
import fs from 'fs';
import path from 'path';
import { config } from '../config/index.js';

/**
 * 日志级别枚举
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

/**
 * 日志级别映射
 */
const LOG_LEVEL_MAP: Record<string, LogLevel> = {
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR
};

/**
 * 颜色常量
 */
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

/**
 * 日志级别颜色映射
 */
const LEVEL_COLORS = {
  [LogLevel.DEBUG]: COLORS.gray,
  [LogLevel.INFO]: COLORS.cyan,
  [LogLevel.WARN]: COLORS.yellow,
  [LogLevel.ERROR]: COLORS.red
};

/**
 * 日志级别名称映射
 */
const LEVEL_NAMES = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO ',
  [LogLevel.WARN]: 'WARN ',
  [LogLevel.ERROR]: 'ERROR'
};

/**
 * 日志记录器类
 */
class Logger {
  private currentLevel: LogLevel;
  private enableColors: boolean;
  private enableFileOutput: boolean;
  private filePath?: string;
  private fileStream?: fs.WriteStream;

  constructor() {
    this.currentLevel = LOG_LEVEL_MAP[config.log.level] || LogLevel.INFO;
    this.enableColors = config.log.enableColors && process.stdout.isTTY;
    this.enableFileOutput = config.log.enableFileOutput;
    this.filePath = config.log.filePath;

    if (this.enableFileOutput && this.filePath) {
      this.initializeFileOutput();
    }
  }

  /**
   * 初始化文件输出
   */
  private initializeFileOutput(): void {
    if (!this.filePath) return;

    try {
      // 确保日志目录存在
      const logDir = path.dirname(this.filePath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      // 创建写入流
      this.fileStream = fs.createWriteStream(this.filePath, { flags: 'a' });
      
      this.fileStream.on('error', (error) => {
        console.error('写入日志文件时出错:', error);
      });
    } catch (error) {
      console.error('初始化日志文件输出失败:', error);
    }
  }

  /**
   * 格式化时间戳
   */
  private formatTimestamp(): string {
    const now = new Date();
    return now.toISOString();
  }

  /**
   * 格式化日志消息
   */
  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const timestamp = this.formatTimestamp();
    const levelName = LEVEL_NAMES[level];
    const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ') : '';

    return `[${timestamp}] ${levelName} ${message}${formattedArgs}`;
  }

  /**
   * 添加颜色
   */
  private colorize(level: LogLevel, text: string): string {
    if (!this.enableColors) return text;
    
    const color = LEVEL_COLORS[level];
    return `${color}${text}${COLORS.reset}`;
  }

  /**
   * 写入日志
   */
  private write(level: LogLevel, message: string, ...args: any[]): void {
    if (level < this.currentLevel) return;

    const formattedMessage = this.formatMessage(level, message, ...args);
    
    // 控制台输出
    const coloredMessage = this.colorize(level, formattedMessage);
    if (level >= LogLevel.WARN) {
      console.error(coloredMessage);
    } else {
      console.log(coloredMessage);
    }

    // 文件输出
    if (this.enableFileOutput && this.fileStream) {
      this.fileStream.write(formattedMessage + '\n');
    }
  }

  /**
   * Debug级别日志
   */
  public debug(message: string, ...args: any[]): void {
    this.write(LogLevel.DEBUG, message, ...args);
  }

  /**
   * Info级别日志
   */
  public info(message: string, ...args: any[]): void {
    this.write(LogLevel.INFO, message, ...args);
  }

  /**
   * Warning级别日志
   */
  public warn(message: string, ...args: any[]): void {
    this.write(LogLevel.WARN, message, ...args);
  }

  /**
   * Error级别日志
   */
  public error(message: string, ...args: any[]): void {
    this.write(LogLevel.ERROR, message, ...args);
  }

  /**
   * 设置日志级别
   */
  public setLevel(level: string | LogLevel): void {
    if (typeof level === 'string') {
      this.currentLevel = LOG_LEVEL_MAP[level.toLowerCase()] || LogLevel.INFO;
    } else {
      this.currentLevel = level;
    }
  }

  /**
   * 关闭日志记录器
   */
  public close(): Promise<void> {
    return new Promise((resolve) => {
      if (this.fileStream) {
        this.fileStream.end(() => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * 创建子记录器（带前缀）
   */
  public child(prefix: string): Logger {
    const childLogger = new Logger();
    
    // 重写写入方法以添加前缀
    const originalWrite = childLogger.write.bind(childLogger);
    childLogger.write = (level: LogLevel, message: string, ...args: any[]) => {
      originalWrite(level, `[${prefix}] ${message}`, ...args);
    };

    return childLogger;
  }
}

/**
 * 导出默认日志记录器实例
 */
export const logger = new Logger();

/**
 * 性能监控装饰器
 */
export function logPerformance<T extends (...args: any[]) => Promise<any>>(
  target: any, 
  propertyName: string, 
  descriptor: TypedPropertyDescriptor<T>
): TypedPropertyDescriptor<T> {
  const method = descriptor.value;
  if (!method) return descriptor;

  descriptor.value = async function (this: any, ...args: any[]) {
    const startTime = Date.now();
    const methodName = `${target.constructor.name}.${propertyName}`;
    
    logger.debug(`🚀 开始执行: ${methodName}`);
    
    try {
      const result = await method.apply(this, args);
      const duration = Date.now() - startTime;
      logger.debug(`✅ 执行完成: ${methodName} (耗时: ${duration}ms)`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`❌ 执行失败: ${methodName} (耗时: ${duration}ms)`, error);
      throw error;
    }
  } as T;

  return descriptor;
}

/**
 * 错误日志记录辅助函数
 */
export function logError(error: unknown, context?: string): void {
  const contextStr = context ? `[${context}] ` : '';
  
  if (error instanceof Error) {
    logger.error(`${contextStr}${error.message}`, {
      stack: error.stack,
      name: error.name
    });
  } else {
    logger.error(`${contextStr}未知错误`, error);
  }
}

/**
 * 请求日志中间件辅助函数
 */
export function logRequest(method: string, path: string, duration: number, status: number): void {
  const statusColor = status >= 400 ? COLORS.red : status >= 300 ? COLORS.yellow : COLORS.green;
  const durationColor = duration > 1000 ? COLORS.red : duration > 500 ? COLORS.yellow : COLORS.green;
  
  const message = config.log.enableColors ? 
    `${COLORS.blue}${method}${COLORS.reset} ${path} ${statusColor}${status}${COLORS.reset} ${durationColor}${duration}ms${COLORS.reset}` :
    `${method} ${path} ${status} ${duration}ms`;
    
  logger.info(`🌐 HTTP请求: ${message}`);
}