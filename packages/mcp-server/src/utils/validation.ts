/**
 * 验证工具模块
 * 提供参数验证、数据校验等功能
 */
import { z } from 'zod';
import { ValidationError } from './errors.js';
import { config } from '../config/index.js';

/**
 * 基础验证schemas
 */
export const BaseSchemas = {
  // UUID验证
  uuid: z.string().uuid('无效的UUID格式'),
  
  // 搜索查询验证
  searchQuery: z.string().min(1, '搜索查询不能为空').max(500, '搜索查询过长'),
  
  // 分页限制验证
  limit: z.number().int().min(1, '限制数量必须大于0').max(config.search.maxLimit, `限制数量不能超过${config.search.maxLimit}`).default(config.search.defaultLimit),
  
  // 偏移量验证
  offset: z.number().int().min(0, '偏移量不能为负数').default(0),
  
  // HTTP方法验证
  httpMethod: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'], {
    errorMap: () => ({ message: '无效的HTTP方法' })
  }),
  
  // 状态验证
  status: z.string().min(1, '状态不能为空'),
  
  // 阈值验证
  threshold: z.number().min(0, '阈值不能小于0').max(1, '阈值不能大于1'),
  
  // 权重验证
  weight: z.number().min(0, '权重不能小于0').max(1, '权重不能大于1'),
  
  // 搜索类型验证
  searchTypes: z.array(z.enum(['projects', 'apis', 'tags', 'endpoints', 'tables', 'features', 'issues']))
    .default(['projects', 'apis', 'tags']),
  
  // 标签数组验证
  tags: z.array(z.string()).optional(),
  
  // 布尔值验证
  boolean: z.boolean().default(false)
};

/**
 * 工具参数验证schemas
 */
export const ToolSchemas = {
  // 搜索项目参数
  searchProjects: z.object({
    query: BaseSchemas.searchQuery,
    limit: BaseSchemas.limit.optional(),
    status: BaseSchemas.status.optional(),
    includeArchived: BaseSchemas.boolean.optional()
  }),
  
  // 搜索API参数
  searchApis: z.object({
    query: BaseSchemas.searchQuery,
    projectId: BaseSchemas.uuid.optional(),
    method: BaseSchemas.httpMethod.optional(),
    status: BaseSchemas.status.optional(),
    limit: BaseSchemas.limit.optional()
  }),

  // 搜索API端点参数
  searchEndpoints: z.object({
    query: BaseSchemas.searchQuery,
    projectId: BaseSchemas.uuid.optional(),
    groupId: BaseSchemas.uuid.optional(),
    method: BaseSchemas.httpMethod.optional(),
    status: BaseSchemas.status.optional(),
    deprecated: BaseSchemas.boolean.optional(),
    limit: BaseSchemas.limit.optional()
  }),
  
  // 搜索标签参数
  searchTags: z.object({
    query: BaseSchemas.searchQuery,
    projectId: BaseSchemas.uuid.optional(),
    limit: BaseSchemas.limit.optional()
  }),

  // 搜索数据库表参数
  searchTables: z.object({
    query: BaseSchemas.searchQuery,
    projectId: BaseSchemas.uuid.optional(),
    category: z.string().optional(),
    status: BaseSchemas.status.optional(),
    limit: BaseSchemas.limit.optional()
  }),

  // 搜索功能模块参数
  searchFeatures: z.object({
    query: BaseSchemas.searchQuery,
    projectId: BaseSchemas.uuid.optional(),
    category: z.string().optional(),
    status: z.enum(['planned', 'in-progress', 'completed', 'deprecated']).optional(),
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
    limit: BaseSchemas.limit.optional()
  }),

  // 搜索Issues参数
  searchIssues: z.object({
    query: BaseSchemas.searchQuery,
    projectId: BaseSchemas.uuid.optional(),
    status: z.enum(['OPEN', 'CLOSED']).optional(),
    priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
    issueType: z.enum(['BUG', 'FEATURE', 'ENHANCEMENT', 'TASK', 'DOCUMENTATION']).optional(),
    assigneeId: z.string().optional(),
    limit: BaseSchemas.limit.optional()
  }),
  
  // 全局搜索参数
  globalSearch: z.object({
    query: BaseSchemas.searchQuery,
    types: BaseSchemas.searchTypes.optional(),
    limit: BaseSchemas.limit.optional(),
    projectId: BaseSchemas.uuid.optional()
  }),
  
  // 向量搜索参数
  vectorSearch: z.object({
    query: BaseSchemas.searchQuery,
    limit: BaseSchemas.limit.optional(),
    threshold: BaseSchemas.threshold.optional(),
    types: BaseSchemas.searchTypes.optional()
  }),
  
  // 混合搜索参数
  hybridSearch: z.object({
    query: BaseSchemas.searchQuery,
    types: BaseSchemas.searchTypes.optional(),
    limit: BaseSchemas.limit.optional(),
    vectorWeight: BaseSchemas.weight.default(0.6),
    fuzzyWeight: BaseSchemas.weight.default(0.4),
    threshold: BaseSchemas.threshold.optional()
  }),
  
  // RAG搜索API参数
  ragSearchApis: z.object({
    query: BaseSchemas.searchQuery,
    method: BaseSchemas.httpMethod.optional(),
    projectId: BaseSchemas.uuid.optional(),
    tags: BaseSchemas.tags,
    includeRelated: BaseSchemas.boolean.optional(),
    contextWindow: z.number().int().min(100).max(10000).optional()
  }),
  
  // 获取API推荐参数
  getApiRecommendations: z.object({
    apiId: BaseSchemas.uuid,
    limit: BaseSchemas.limit.optional(),
    similarityThreshold: BaseSchemas.threshold.optional()
  }),

  // 获取端点推荐参数
  getEndpointRecommendations: z.object({
    endpointId: BaseSchemas.uuid,
    limit: BaseSchemas.limit.optional(),
    includeRelatedTables: BaseSchemas.boolean.optional()
  }),
  
  // 搜索建议参数
  searchSuggestions: z.object({
    query: z.string().min(1).max(100),
    limit: z.number().int().min(1).max(20).default(5),
    types: BaseSchemas.searchTypes.optional()
  }),
  
  // 获取最近项目参数
  getRecentItems: z.object({
    limit: BaseSchemas.limit.optional(),
    types: BaseSchemas.searchTypes.optional(),
    days: z.number().int().min(1).max(365).default(30)
  }),
  
  // 刷新索引参数
  refreshIndex: z.object({
    force: BaseSchemas.boolean.optional(),
    types: BaseSchemas.searchTypes.optional()
  }),

  // 构建向量索引参数
  buildVectorIndex: z.object({
    forceRebuild: BaseSchemas.boolean.optional(),
    batchSize: z.number().int().min(10).max(1000).default(100)
  }),

  // 数据模型同步参数
  syncDataModel: z.object({
    projectId: BaseSchemas.uuid,
    force: BaseSchemas.boolean.optional(),
    includeRelationships: BaseSchemas.boolean.optional()
  }),

  // API端点同步参数
  syncApiEndpoints: z.object({
    projectId: BaseSchemas.uuid,
    groupId: BaseSchemas.uuid.optional(),
    force: BaseSchemas.boolean.optional()
  }),

  // 健康检查参数
  healthCheck: z.object({
    includeDetails: BaseSchemas.boolean.optional(),
    checkDependencies: BaseSchemas.boolean.optional()
  })
};

/**
 * 验证工具参数
 */
export function validateToolArgs<T extends keyof typeof ToolSchemas>(
  toolName: T,
  args: unknown
): z.infer<typeof ToolSchemas[T]> {
  try {
    const schema = ToolSchemas[toolName];
    if (!schema) {
      throw new ValidationError(`未知工具: ${toolName}`);
    }
    
    return schema.parse(args);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues
        .map(issue => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');
      
      throw new ValidationError(`参数验证失败 [${toolName}]: ${errorMessage}`, {
        tool: toolName,
        issues: error.issues
      });
    }
    
    throw error;
  }
}

/**
 * 自定义验证器
 */
export class CustomValidators {
  /**
   * 验证项目访问权限
   */
  static validateProjectAccess(projectId: string, userId?: string): boolean {
    // TODO: 实现项目访问权限验证逻辑
    // 暂时返回true，表示允许所有访问
    return true;
  }

  /**
   * 验证搜索查询安全性
   */
  static validateSearchQuerySecurity(query: string): boolean {
    // 检查潜在的恶意查询
    const dangerousPatterns = [
      /union\s+select/i,
      /insert\s+into/i,
      /delete\s+from/i,
      /update\s+set/i,
      /drop\s+table/i,
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi
    ];

    return !dangerousPatterns.some(pattern => pattern.test(query));
  }

  /**
   * 验证文件名安全性
   */
  static validateFileName(fileName: string): boolean {
    // 检查路径遍历和危险字符
    const dangerousPatterns = [
      /\.\./,
      /[<>:"|?*]/,
      /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i
    ];

    return !dangerousPatterns.some(pattern => pattern.test(fileName)) &&
           fileName.length > 0 &&
           fileName.length <= 255;
  }

  /**
   * 验证分页参数合理性
   */
  static validatePagination(limit: number, offset: number): boolean {
    // 检查分页参数是否合理
    const maxTotalItems = 10000;
    return offset + limit <= maxTotalItems;
  }

  /**
   * 验证数组参数长度
   */
  static validateArrayLength<T>(arr: T[], maxLength: number, fieldName: string): void {
    if (arr.length > maxLength) {
      throw new ValidationError(`${fieldName}数组长度不能超过${maxLength}`, {
        field: fieldName,
        actualLength: arr.length,
        maxLength
      });
    }
  }

  /**
   * 验证字符串长度
   */
  static validateStringLength(str: string, maxLength: number, fieldName: string): void {
    if (str.length > maxLength) {
      throw new ValidationError(`${fieldName}长度不能超过${maxLength}字符`, {
        field: fieldName,
        actualLength: str.length,
        maxLength
      });
    }
  }

  /**
   * 验证数值范围
   */
  static validateNumberRange(num: number, min: number, max: number, fieldName: string): void {
    if (num < min || num > max) {
      throw new ValidationError(`${fieldName}必须在${min}和${max}之间`, {
        field: fieldName,
        value: num,
        min,
        max
      });
    }
  }
}

/**
 * 批量验证辅助函数
 */
export function batchValidate<T>(
  items: unknown[],
  schema: z.ZodSchema<T>,
  maxBatchSize: number = 100
): T[] {
  if (items.length > maxBatchSize) {
    throw new ValidationError(`批量操作项目数不能超过${maxBatchSize}`, {
      actualCount: items.length,
      maxCount: maxBatchSize
    });
  }

  const results: T[] = [];
  const errors: string[] = [];

  items.forEach((item, index) => {
    try {
      results.push(schema.parse(item));
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.issues
          .map(issue => `${issue.path.join('.')}: ${issue.message}`)
          .join('; ');
        errors.push(`项目${index + 1}: ${errorMessage}`);
      } else {
        errors.push(`项目${index + 1}: 验证失败`);
      }
    }
  });

  if (errors.length > 0) {
    throw new ValidationError(`批量验证失败:\n${errors.join('\n')}`, {
      totalItems: items.length,
      errorCount: errors.length,
      errors
    });
  }

  return results;
}