/**
 * 搜索服务基类
 * 提供统一的搜索接口和缓存机制
 */
import { logger } from '../../utils/logger.js';
import { SearchError, handleError } from '../../utils/errors.js';
import { config } from '../../config/index.js';

/**
 * 搜索结果接口
 */
export interface SearchResult<T = any> {
  /** 匹配的文档 */
  item: T;
  /** 相关性评分 */
  score: number;
  /** 匹配的字段 */
  matches?: string[];
  /** 高亮信息 */
  highlights?: Record<string, string[]>;
}

/**
 * 搜索选项接口
 */
export interface SearchOptions {
  /** 结果数量限制 */
  limit?: number;
  /** 结果偏移量 */
  offset?: number;
  /** 相似度阈值 */
  threshold?: number;
  /** 排序字段 */
  sortBy?: string;
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
  /** 过滤条件 */
  filters?: Record<string, any>;
  /** 是否包含高亮 */
  includeHighlights?: boolean;
}

/**
 * 索引统计信息接口
 */
export interface IndexStats {
  /** 文档总数 */
  totalDocuments: number;
  /** 索引大小（字节） */
  indexSize: number;
  /** 最后更新时间 */
  lastUpdated: Date;
  /** 搜索统计 */
  searchStats: {
    totalSearches: number;
    averageLatency: number;
    errorRate: number;
  };
}

/**
 * 搜索服务抽象基类
 */
export abstract class SearchService<T = any> {
  protected indexCache = new Map<string, any>();
  protected lastIndexUpdate = 0;
  protected searchStats = {
    totalSearches: 0,
    totalLatency: 0,
    errorCount: 0
  };

  protected readonly serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  /**
   * 初始化搜索服务
   */
  abstract initialize(): Promise<void>;

  /**
   * 构建搜索索引
   */
  abstract buildIndex(): Promise<void>;

  /**
   * 执行搜索
   */
  abstract search(query: string, options?: SearchOptions): Promise<SearchResult<T>[]>;

  /**
   * 获取搜索建议
   */
  abstract getSuggestions(query: string, limit?: number): Promise<string[]>;

  /**
   * 检查索引是否需要更新
   */
  protected needsIndexUpdate(): boolean {
    const now = Date.now();
    return (now - this.lastIndexUpdate) > config.search.indexCacheTtl;
  }

  /**
   * 更新索引时间戳
   */
  protected updateIndexTimestamp(): void {
    this.lastIndexUpdate = Date.now();
  }

  /**
   * 记录搜索统计
   */
  protected recordSearch(latency: number, hasError: boolean = false): void {
    this.searchStats.totalSearches++;
    this.searchStats.totalLatency += latency;
    if (hasError) {
      this.searchStats.errorCount++;
    }
  }

  /**
   * 获取平均延迟
   */
  protected getAverageLatency(): number {
    return this.searchStats.totalSearches > 0 
      ? this.searchStats.totalLatency / this.searchStats.totalSearches 
      : 0;
  }

  /**
   * 获取错误率
   */
  protected getErrorRate(): number {
    return this.searchStats.totalSearches > 0 
      ? this.searchStats.errorCount / this.searchStats.totalSearches 
      : 0;
  }

  /**
   * 清理缓存
   */
  protected clearCache(): void {
    this.indexCache.clear();
    logger.debug(`${this.serviceName} 缓存已清理`);
  }

  /**
   * 设置缓存项
   */
  protected setCache(key: string, value: any, ttl?: number): void {
    const expiryTime = Date.now() + (ttl || config.search.indexCacheTtl);
    this.indexCache.set(key, {
      value,
      expiryTime
    });
  }

  /**
   * 获取缓存项
   */
  protected getCache(key: string): any | null {
    const cached = this.indexCache.get(key);
    if (!cached) {
      return null;
    }

    if (Date.now() > cached.expiryTime) {
      this.indexCache.delete(key);
      return null;
    }

    return cached.value;
  }

  /**
   * 验证搜索查询
   */
  protected validateQuery(query: string): void {
    if (!query || typeof query !== 'string') {
      throw new SearchError('搜索查询不能为空');
    }

    if (query.length > 500) {
      throw new SearchError('搜索查询过长，最多500字符');
    }

    // 检查潜在的恶意查询
    const dangerousPatterns = [
      /union\s+select/i,
      /insert\s+into/i,
      /delete\s+from/i,
      /update\s+set/i,
      /drop\s+table/i
    ];

    if (dangerousPatterns.some(pattern => pattern.test(query))) {
      throw new SearchError('检测到潜在恶意查询');
    }
  }

  /**
   * 验证搜索选项
   */
  protected validateOptions(options: SearchOptions = {}): SearchOptions {
    const validated: SearchOptions = {
      limit: Math.min(options.limit || config.search.defaultLimit, config.search.maxLimit),
      offset: Math.max(options.offset || 0, 0),
      threshold: Math.max(0, Math.min(options.threshold || config.search.vectorThreshold, 1)),
      sortBy: options.sortBy || 'score',
      sortOrder: options.sortOrder || 'desc',
      filters: options.filters || {},
      includeHighlights: options.includeHighlights || false
    };

    // 验证分页合理性
    if (validated.offset! + validated.limit! > 10000) {
      throw new SearchError('分页参数超出合理范围');
    }

    return validated;
  }

  /**
   * 格式化搜索结果
   */
  protected formatResults(results: SearchResult<T>[], options: SearchOptions): SearchResult<T>[] {
    let formatted = results;

    // 应用阈值过滤
    if (options.threshold && options.threshold > 0) {
      formatted = formatted.filter(result => result.score >= options.threshold!);
    }

    // 排序
    if (options.sortBy === 'score') {
      formatted.sort((a, b) => 
        options.sortOrder === 'desc' ? b.score - a.score : a.score - b.score
      );
    }

    // 分页
    if (options.offset || options.limit) {
      const start = options.offset || 0;
      const end = start + (options.limit || config.search.defaultLimit);
      formatted = formatted.slice(start, end);
    }

    return formatted;
  }

  /**
   * 包装搜索执行，添加错误处理和统计
   */
  protected async executeSearch<R>(
    operation: () => Promise<R>,
    operationName: string
  ): Promise<R> {
    const startTime = Date.now();
    let hasError = false;

    try {
      logger.debug(`开始执行 ${this.serviceName}.${operationName}`);
      
      const result = await operation();
      
      const latency = Date.now() - startTime;
      this.recordSearch(latency, false);
      
      logger.debug(`${this.serviceName}.${operationName} 执行完成，耗时: ${latency}ms`);
      
      return result;
    } catch (error) {
      hasError = true;
      const latency = Date.now() - startTime;
      this.recordSearch(latency, true);
      
      logger.error(`${this.serviceName}.${operationName} 执行失败，耗时: ${latency}ms`, error);
      
      throw handleError(error);
    }
  }

  /**
   * 获取服务统计信息
   */
  public getStats(): IndexStats {
    return {
      totalDocuments: this.indexCache.size,
      indexSize: JSON.stringify(Object.fromEntries(this.indexCache.entries())).length,
      lastUpdated: new Date(this.lastIndexUpdate),
      searchStats: {
        totalSearches: this.searchStats.totalSearches,
        averageLatency: this.getAverageLatency(),
        errorRate: this.getErrorRate()
      }
    };
  }

  /**
   * 重置统计信息
   */
  public resetStats(): void {
    this.searchStats = {
      totalSearches: 0,
      totalLatency: 0,
      errorCount: 0
    };
    logger.info(`${this.serviceName} 统计信息已重置`);
  }

  /**
   * 健康检查
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    const stats = this.getStats();
    const errorRate = this.getErrorRate();
    const avgLatency = this.getAverageLatency();

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // 根据错误率和延迟判断健康状态
    if (errorRate > 0.1 || avgLatency > 5000) {
      status = 'unhealthy';
    } else if (errorRate > 0.05 || avgLatency > 2000) {
      status = 'degraded';
    }

    return {
      status,
      details: {
        serviceName: this.serviceName,
        indexAge: Date.now() - this.lastIndexUpdate,
        ...stats,
        thresholds: {
          errorRateWarning: 0.05,
          errorRateCritical: 0.1,
          latencyWarning: 2000,
          latencyCritical: 5000
        }
      }
    };
  }

  /**
   * 优雅关闭
   */
  public async shutdown(): Promise<void> {
    logger.info(`正在关闭 ${this.serviceName}...`);
    this.clearCache();
    logger.info(`${this.serviceName} 已关闭`);
  }
}