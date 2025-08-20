/**
 * 错误处理模块
 * 定义统一的错误类型和处理机制
 */

/**
 * MCP服务器错误基类
 */
export abstract class McpError extends Error {
  public code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: Record<string, any>
  ) {
    super(message);
    
    // 设置正确的原型链
    Object.setPrototypeOf(this, new.target.prototype);
    
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    // 捕获堆栈跟踪
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * 转换为JSON格式
   */
  public toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 数据库相关错误
 */
export class DatabaseError extends McpError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'DATABASE_ERROR', 500, true, details);
  }
}

/**
 * 搜索相关错误
 */
export class SearchError extends McpError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'SEARCH_ERROR', 500, true, details);
  }
}

/**
 * 向量搜索错误
 */
export class VectorSearchError extends SearchError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, details);
    this.code = 'VECTOR_SEARCH_ERROR';
  }
}

/**
 * 配置错误
 */
export class ConfigError extends McpError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'CONFIG_ERROR', 500, false, details);
  }
}

/**
 * 验证错误
 */
export class ValidationError extends McpError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', 400, true, details);
  }
}

/**
 * 工具调用错误
 */
export class ToolCallError extends McpError {
  constructor(toolName: string, message: string, details?: Record<string, any>) {
    super(`工具调用失败 [${toolName}]: ${message}`, 'TOOL_CALL_ERROR', 400, true, {
      toolName,
      ...details
    });
  }
}

/**
 * 资源未找到错误
 */
export class NotFoundError extends McpError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} (ID: ${id}) 未找到` : `${resource} 未找到`;
    super(message, 'NOT_FOUND_ERROR', 404, true, { resource, id });
  }
}

/**
 * 资源冲突错误
 */
export class ConflictError extends McpError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'CONFLICT_ERROR', 409, true, details);
  }
}

/**
 * 限流错误
 */
export class RateLimitError extends McpError {
  constructor(limit: number, window: number) {
    super(
      `请求频率超限，最多每${window}秒${limit}次请求`,
      'RATE_LIMIT_ERROR',
      429,
      true,
      { limit, window }
    );
  }
}

/**
 * 服务不可用错误
 */
export class ServiceUnavailableError extends McpError {
  constructor(service: string, reason?: string) {
    const message = reason ? `${service}服务不可用: ${reason}` : `${service}服务不可用`;
    super(message, 'SERVICE_UNAVAILABLE_ERROR', 503, true, { service, reason });
  }
}

/**
 * 认证错误
 */
export class AuthenticationError extends McpError {
  constructor(message: string = '认证失败') {
    super(message, 'AUTHENTICATION_ERROR', 401, true);
  }
}

/**
 * 授权错误
 */
export class AuthorizationError extends McpError {
  constructor(message: string = '权限不足') {
    super(message, 'AUTHORIZATION_ERROR', 403, true);
  }
}

/**
 * 超时错误
 */
export class TimeoutError extends McpError {
  constructor(operation: string, timeout: number) {
    super(
      `操作超时: ${operation} (${timeout}ms)`,
      'TIMEOUT_ERROR',
      408,
      true,
      { operation, timeout }
    );
  }
}

/**
 * 错误处理器函数
 */
/**
 * 通用MCP错误类
 */
class GenericMcpError extends McpError {
  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: Record<string, any>
  ) {
    super(message, code, statusCode, isOperational, details);
  }
}

export function handleError(error: unknown): McpError {
  // 如果已经是MCP错误，直接返回
  if (error instanceof McpError) {
    return error;
  }

  // 如果是标准错误，转换为通用MCP错误
  if (error instanceof Error) {
    // 检查是否是已知的数据库错误
    if (error.message.includes('Database') || error.message.includes('Prisma')) {
      return new DatabaseError(error.message, { originalError: error.name });
    }

    // 检查是否是超时错误
    if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
      return new TimeoutError('操作超时', 30000);
    }

    // 通用错误
    return new GenericMcpError(
      error.message,
      'INTERNAL_ERROR',
      500,
      true,
      { originalError: error.name }
    );
  }

  // 未知错误类型
  return new GenericMcpError(
    '未知错误',
    'UNKNOWN_ERROR',
    500,
    false,
    { originalError: String(error) }
  );
}

/**
 * 异步错误处理包装器
 */
export function wrapAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw handleError(error);
    }
  };
}

/**
 * 错误分类器
 */
export class ErrorClassifier {
  /**
   * 判断错误是否为操作性错误（可恢复）
   */
  static isOperational(error: unknown): boolean {
    if (error instanceof McpError) {
      return error.isOperational;
    }
    return false;
  }

  /**
   * 判断错误是否为客户端错误（4xx）
   */
  static isClientError(error: unknown): boolean {
    if (error instanceof McpError) {
      return error.statusCode >= 400 && error.statusCode < 500;
    }
    return false;
  }

  /**
   * 判断错误是否为服务器错误（5xx）
   */
  static isServerError(error: unknown): boolean {
    if (error instanceof McpError) {
      return error.statusCode >= 500;
    }
    return true; // 未知错误默认为服务器错误
  }

  /**
   * 判断错误是否需要重试
   */
  static shouldRetry(error: unknown): boolean {
    if (error instanceof McpError) {
      // 超时、服务不可用、限流等可以重试
      return [
        'TIMEOUT_ERROR',
        'SERVICE_UNAVAILABLE_ERROR',
        'RATE_LIMIT_ERROR',
        'DATABASE_ERROR'
      ].includes(error.code);
    }
    return false;
  }

  /**
   * 获取重试延迟（毫秒）
   */
  static getRetryDelay(error: unknown, attempt: number): number {
    if (!this.shouldRetry(error)) {
      return 0;
    }

    // 指数退避，最大30秒
    const baseDelay = 1000; // 1秒
    const maxDelay = 30000; // 30秒
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    
    // 添加随机抖动（±25%）
    const jitter = delay * 0.25 * (Math.random() - 0.5) * 2;
    return Math.max(0, delay + jitter);
  }
}

/**
 * 错误统计器
 */
export class ErrorStats {
  private static errors: Map<string, number> = new Map();
  private static lastReset: Date = new Date();

  /**
   * 记录错误
   */
  static record(error: unknown): void {
    const errorCode = error instanceof McpError ? error.code : 'UNKNOWN_ERROR';
    const current = this.errors.get(errorCode) || 0;
    this.errors.set(errorCode, current + 1);
  }

  /**
   * 获取错误统计
   */
  static getStats(): Record<string, any> {
    return {
      errors: Object.fromEntries(this.errors.entries()),
      totalErrors: Array.from(this.errors.values()).reduce((sum, count) => sum + count, 0),
      lastReset: this.lastReset.toISOString(),
      uptime: Date.now() - this.lastReset.getTime()
    };
  }

  /**
   * 重置统计
   */
  static reset(): void {
    this.errors.clear();
    this.lastReset = new Date();
  }
}