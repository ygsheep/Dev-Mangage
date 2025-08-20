/**
 * 工具管理器
 * 统一管理MCP工具的注册、验证和执行
 */
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool 
} from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../utils/logger.js';
import { ToolCallError, handleError, ValidationError } from '../utils/errors.js';
import { validateToolArgs, ToolSchemas } from '../utils/validation.js';
import { config } from '../config/index.js';

/**
 * 工具执行上下文接口
 */
export interface ToolContext {
  /** 工具名称 */
  toolName: string;
  /** 原始参数 */
  rawArgs: any;
  /** 验证后的参数 */
  validatedArgs: any;
  /** 请求ID（可选） */
  requestId?: string;
  /** 用户ID（可选） */
  userId?: string;
  /** 开始时间 */
  startTime: number;
}

/**
 * 工具执行结果接口
 */
export interface ToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    url?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
  _meta?: {
    executionTime: number;
    resultSize: number;
    cached?: boolean;
  };
}

/**
 * 工具处理函数类型
 */
export type ToolHandler<T = any> = (
  context: ToolContext
) => Promise<ToolResult>;

/**
 * 工具定义接口
 */
export interface ToolDefinition {
  /** 工具配置 */
  tool: Tool;
  /** 处理函数 */
  handler: ToolHandler;
  /** 是否启用缓存 */
  cacheable?: boolean;
  /** 缓存TTL（毫秒） */
  cacheTtl?: number;
  /** 是否需要认证 */
  requireAuth?: boolean;
  /** 速率限制（每分钟请求数） */
  rateLimit?: number;
  /** 工具分类 */
  category?: string;
  /** 工具版本 */
  version?: string;
}

/**
 * 工具执行统计
 */
interface ToolStats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
  lastCalled?: Date;
  lastError?: {
    message: string;
    timestamp: Date;
  };
}

/**
 * 工具管理器类
 */
export class ToolManager {
  private tools = new Map<string, ToolDefinition>();
  private toolStats = new Map<string, ToolStats>();
  private resultCache = new Map<string, { result: ToolResult; expiry: number }>();
  private rateLimiter = new Map<string, { count: number; resetTime: number }>();

  /**
   * 注册工具
   */
  public registerTool(name: string, definition: ToolDefinition): void {
    if (this.tools.has(name)) {
      logger.warn(`工具 ${name} 已存在，将被覆盖`);
    }

    // 验证工具定义
    this.validateToolDefinition(name, definition);

    this.tools.set(name, definition);
    this.toolStats.set(name, {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      totalExecutionTime: 0,
      averageExecutionTime: 0
    });

    logger.debug(`✅ 工具 ${name} 注册成功`);
  }

  /**
   * 批量注册工具
   */
  public registerTools(tools: Record<string, ToolDefinition>): void {
    Object.entries(tools).forEach(([name, definition]) => {
      this.registerTool(name, definition);
    });
  }

  /**
   * 获取所有工具定义
   */
  public getToolDefinitions(): Tool[] {
    return Array.from(this.tools.values()).map(def => def.tool);
  }

  /**
   * 检查工具是否存在
   */
  public hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * 获取工具定义
   */
  public getToolDefinition(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * 执行工具
   */
  public async executeTool(
    toolName: string,
    args: any,
    options: {
      requestId?: string;
      userId?: string;
      skipCache?: boolean;
      skipRateLimit?: boolean;
    } = {}
  ): Promise<ToolResult> {
    const startTime = Date.now();
    
    try {
      // 检查工具是否存在
      const toolDef = this.tools.get(toolName);
      if (!toolDef) {
        throw new ToolCallError(toolName, `工具 ${toolName} 不存在`);
      }

      // 速率限制检查
      if (!options.skipRateLimit && toolDef.rateLimit) {
        this.checkRateLimit(toolName, toolDef.rateLimit);
      }

      // 参数验证
      let validatedArgs: any;
      try {
        validatedArgs = this.validateToolArgs(toolName, args);
      } catch (error) {
        this.recordToolCall(toolName, startTime, false, error);
        throw error;
      }

      // 缓存检查
      if (!options.skipCache && toolDef.cacheable) {
        const cachedResult = this.getCachedResult(toolName, validatedArgs);
        if (cachedResult) {
          this.recordToolCall(toolName, startTime, true);
          return {
            ...cachedResult,
            _meta: {
              executionTime: Date.now() - startTime,
              resultSize: cachedResult._meta?.resultSize || 0,
              cached: true,
              ...cachedResult._meta
            }
          };
        }
      }

      // 构建执行上下文
      const context: ToolContext = {
        toolName,
        rawArgs: args,
        validatedArgs,
        requestId: options.requestId,
        userId: options.userId,
        startTime
      };

      // 执行工具
      logger.debug(`🚀 开始执行工具: ${toolName}`);
      const result = await toolDef.handler(context);

      // 添加执行元数据
      const executionTime = Date.now() - startTime;
      const finalResult: ToolResult = {
        ...result,
        _meta: {
          executionTime,
          resultSize: JSON.stringify(result.content).length,
          cached: false,
          ...result._meta
        }
      };

      // 缓存结果
      if (toolDef.cacheable && !result.isError) {
        this.setCachedResult(toolName, validatedArgs, finalResult, toolDef.cacheTtl);
      }

      // 记录统计
      this.recordToolCall(toolName, startTime, true);

      logger.debug(`✅ 工具 ${toolName} 执行完成，耗时: ${executionTime}ms`);
      return finalResult;

    } catch (error) {
      this.recordToolCall(toolName, startTime, false, error);
      
      if (error instanceof ToolCallError || error instanceof ValidationError) {
        throw error;
      }
      
      throw new ToolCallError(toolName, '工具执行失败', {
        originalError: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 获取工具统计信息
   */
  public getToolStats(toolName?: string): Record<string, ToolStats> | ToolStats | null {
    if (toolName) {
      return this.toolStats.get(toolName) || null;
    }
    
    return Object.fromEntries(this.toolStats.entries());
  }

  /**
   * 重置工具统计
   */
  public resetToolStats(toolName?: string): void {
    if (toolName) {
      const stats = this.toolStats.get(toolName);
      if (stats) {
        this.toolStats.set(toolName, {
          totalCalls: 0,
          successfulCalls: 0,
          failedCalls: 0,
          totalExecutionTime: 0,
          averageExecutionTime: 0
        });
      }
    } else {
      this.toolStats.clear();
      this.tools.forEach((_, name) => {
        this.toolStats.set(name, {
          totalCalls: 0,
          successfulCalls: 0,
          failedCalls: 0,
          totalExecutionTime: 0,
          averageExecutionTime: 0
        });
      });
    }
  }

  /**
   * 清理缓存
   */
  public clearCache(toolName?: string): void {
    if (toolName) {
      // 清理特定工具的缓存
      const keysToDelete = Array.from(this.resultCache.keys())
        .filter(key => key.startsWith(`${toolName}:`));
      
      keysToDelete.forEach(key => this.resultCache.delete(key));
      logger.debug(`已清理工具 ${toolName} 的缓存，删除 ${keysToDelete.length} 个条目`);
    } else {
      // 清理所有缓存
      const size = this.resultCache.size;
      this.resultCache.clear();
      logger.debug(`已清理所有工具缓存，删除 ${size} 个条目`);
    }
  }

  /**
   * 清理过期缓存
   */
  public cleanupExpiredCache(): void {
    const now = Date.now();
    let cleanedCount = 0;

    this.resultCache.forEach((value, key) => {
      if (now > value.expiry) {
        this.resultCache.delete(key);
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      logger.debug(`清理了 ${cleanedCount} 个过期缓存条目`);
    }
  }

  /**
   * 获取系统健康状态
   */
  public getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  } {
    const allStats = this.getToolStats() as Record<string, ToolStats>;
    const totalTools = Object.keys(allStats).length;
    let healthyTools = 0;
    let totalErrorRate = 0;
    let totalAvgLatency = 0;

    Object.entries(allStats).forEach(([name, stats]) => {
      const errorRate = stats.totalCalls > 0 ? 
        (stats.failedCalls / stats.totalCalls) : 0;
      
      totalErrorRate += errorRate;
      totalAvgLatency += stats.averageExecutionTime;
      
      // 工具被认为健康的条件：错误率 < 10% 且平均延迟 < 5秒
      if (errorRate < 0.1 && stats.averageExecutionTime < 5000) {
        healthyTools++;
      }
    });

    const avgErrorRate = totalTools > 0 ? totalErrorRate / totalTools : 0;
    const avgLatency = totalTools > 0 ? totalAvgLatency / totalTools : 0;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (avgErrorRate > 0.2 || avgLatency > 10000) {
      status = 'unhealthy';
    } else if (avgErrorRate > 0.1 || avgLatency > 5000) {
      status = 'degraded';
    }

    return {
      status,
      details: {
        totalTools,
        healthyTools,
        averageErrorRate: avgErrorRate,
        averageLatency: avgLatency,
        cacheSize: this.resultCache.size,
        registeredTools: Array.from(this.tools.keys())
      }
    };
  }

  /**
   * 验证工具定义
   */
  private validateToolDefinition(name: string, definition: ToolDefinition): void {
    if (!definition.tool) {
      throw new ValidationError(`工具 ${name} 缺少工具配置`);
    }

    if (!definition.handler) {
      throw new ValidationError(`工具 ${name} 缺少处理函数`);
    }

    if (typeof definition.handler !== 'function') {
      throw new ValidationError(`工具 ${name} 的处理函数必须是函数类型`);
    }

    if (definition.rateLimit && (definition.rateLimit < 1 || definition.rateLimit > 10000)) {
      throw new ValidationError(`工具 ${name} 的速率限制必须在1-10000之间`);
    }

    if (definition.cacheTtl && (definition.cacheTtl < 1000 || definition.cacheTtl > 86400000)) {
      throw new ValidationError(`工具 ${name} 的缓存TTL必须在1秒-1天之间`);
    }
  }

  /**
   * 验证工具参数
   */
  private validateToolArgs(toolName: string, args: any): any {
    // 如果工具在验证schema中定义，使用schema验证
    if (ToolSchemas.hasOwnProperty(toolName as keyof typeof ToolSchemas)) {
      return validateToolArgs(toolName as keyof typeof ToolSchemas, args);
    }

    // 否则进行基础验证
    if (args === null || args === undefined) {
      return {};
    }

    if (typeof args !== 'object') {
      throw new ValidationError(`工具 ${toolName} 的参数必须是对象类型`);
    }

    return args;
  }

  /**
   * 速率限制检查
   */
  private checkRateLimit(toolName: string, limit: number): void {
    const now = Date.now();
    const windowSize = 60 * 1000; // 1分钟窗口
    
    let limiterData = this.rateLimiter.get(toolName);
    
    if (!limiterData || now > limiterData.resetTime) {
      // 重置或初始化限制器
      limiterData = {
        count: 0,
        resetTime: now + windowSize
      };
      this.rateLimiter.set(toolName, limiterData);
    }

    if (limiterData.count >= limit) {
      throw new ToolCallError(
        toolName, 
        `工具调用频率超限，每分钟最多 ${limit} 次`,
        {
          currentCount: limiterData.count,
          limit,
          resetTime: new Date(limiterData.resetTime).toISOString()
        }
      );
    }

    limiterData.count++;
  }

  /**
   * 获取缓存结果
   */
  private getCachedResult(toolName: string, args: any): ToolResult | null {
    const cacheKey = this.generateCacheKey(toolName, args);
    const cached = this.resultCache.get(cacheKey);
    
    if (!cached) {
      return null;
    }

    if (Date.now() > cached.expiry) {
      this.resultCache.delete(cacheKey);
      return null;
    }

    return cached.result;
  }

  /**
   * 设置缓存结果
   */
  private setCachedResult(
    toolName: string, 
    args: any, 
    result: ToolResult, 
    ttl?: number
  ): void {
    const cacheKey = this.generateCacheKey(toolName, args);
    const expiry = Date.now() + (ttl || 5 * 60 * 1000); // 默认5分钟
    
    this.resultCache.set(cacheKey, {
      result: JSON.parse(JSON.stringify(result)), // 深拷贝避免引用问题
      expiry
    });
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(toolName: string, args: any): string {
    const argsStr = JSON.stringify(args, Object.keys(args).sort());
    return `${toolName}:${Buffer.from(argsStr).toString('base64')}`;
  }

  /**
   * 记录工具调用统计
   */
  private recordToolCall(
    toolName: string, 
    startTime: number, 
    success: boolean, 
    error?: any
  ): void {
    const stats = this.toolStats.get(toolName);
    if (!stats) return;

    const executionTime = Date.now() - startTime;
    
    stats.totalCalls++;
    stats.totalExecutionTime += executionTime;
    stats.averageExecutionTime = stats.totalExecutionTime / stats.totalCalls;
    stats.lastCalled = new Date();

    if (success) {
      stats.successfulCalls++;
    } else {
      stats.failedCalls++;
      stats.lastError = {
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      };
    }
  }
}

/**
 * 导出工具管理器单例
 */
export const toolManager = new ToolManager();