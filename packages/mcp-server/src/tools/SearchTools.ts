/**
 * 搜索工具集合
 * 定义所有搜索相关的MCP工具
 */
import { ToolDefinition, ToolHandler, ToolResult } from './ToolManager.js';
import { projectSearchService } from '../services/ProjectSearchService.js';
import { apiEndpointSearchService } from '../services/ApiEndpointSearchService.js';
import { getPrismaClient } from '../database/index.js';
import { logger } from '../utils/logger.js';
import { DatabaseError, NotFoundError } from '../utils/errors.js';
import { config } from '../config/index.js';

/**
 * 格式化搜索结果为工具返回格式
 */
function formatSearchResult(data: any, type: string): ToolResult {
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        type,
        timestamp: new Date().toISOString(),
        ...data
      }, null, 2)
    }]
  };
}

/**
 * 搜索项目工具处理器
 */
const searchProjectsHandler: ToolHandler = async (context) => {
  const { query, limit, status, includeArchived } = context.validatedArgs;
  
  try {
    const results = await projectSearchService.search(query, {
      limit,
      filters: status ? { status } : undefined,
      includeArchived
    });

    const stats = await projectSearchService.getProjectStats();

    return formatSearchResult({
      query,
      total: results.length,
      results: results.map(result => ({
        ...result.item,
        score: result.score,
        matches: result.matches
      })),
      stats: {
        totalProjects: stats.total,
        statusDistribution: stats.byStatus
      }
    }, 'projects');
  } catch (error) {
    logger.error('搜索项目失败:', error);
    throw error;
  }
};

/**
 * 搜索API端点工具处理器
 */
const searchApiEndpointsHandler: ToolHandler = async (context) => {
  const { 
    query, 
    projectId, 
    groupId, 
    method, 
    status, 
    limit,
    includeDeprecated,
    publicOnly
  } = context.validatedArgs;
  
  try {
    const results = await apiEndpointSearchService.search(query, {
      projectId,
      groupId,
      methods: method ? [method] : undefined,
      statuses: status ? [status] : undefined,
      limit,
      includeDeprecated,
      publicOnly
    });

    const stats = await apiEndpointSearchService.getEndpointStats();

    return formatSearchResult({
      query,
      context: { projectId, groupId, method, status },
      total: results.length,
      results: results.map(result => ({
        ...result.item,
        score: result.score,
        matches: result.matches,
        highlights: result.highlights
      })),
      stats: {
        totalEndpoints: stats.total,
        methodDistribution: stats.byMethod,
        statusDistribution: stats.byStatus
      }
    }, 'api-endpoints');
  } catch (error) {
    logger.error('搜索API端点失败:', error);
    throw error;
  }
};

/**
 * 搜索标签工具处理器
 */
const searchTagsHandler: ToolHandler = async (context) => {
  const { query, projectId, limit } = context.validatedArgs;
  
  try {
    const prisma = getPrismaClient();
    
    const where: any = {};
    if (projectId) where.projectId = projectId;

    const tags = await prisma.tag.findMany({
      where: {
        ...where,
        OR: [
          { name: { contains: query } }
        ]
      },
      select: {
        id: true,
        name: true,
        color: true,
        projectId: true,
        createdAt: true,
        project: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            apiTags: true
          }
        }
      },
      take: limit,
      orderBy: {
        name: 'asc'
      }
    });

    // 计算相关性分数（简单的字符串匹配）
    const results = tags.map((tag: any) => {
      let score = 0;
      const lowerQuery = query.toLowerCase();
      const lowerName = tag.name.toLowerCase();
      
      if (lowerName === lowerQuery) {
        score = 1.0;
      } else if (lowerName.startsWith(lowerQuery)) {
        score = 0.8;
      } else if (lowerName.includes(lowerQuery)) {
        score = 0.6;
      } else {
        score = 0.3;
      }
      
      return {
        ...tag,
        score,
        apiCount: tag._count.apiTags
      };
    }).sort((a: any, b: any) => b.score - a.score);

    return formatSearchResult({
      query,
      projectId,
      total: results.length,
      results
    }, 'tags');
  } catch (error) {
    logger.error('搜索标签失败:', error);
    throw new DatabaseError('搜索标签失败', { originalError: error });
  }
};

/**
 * 搜索数据库表工具处理器
 */
const searchTablesHandler: ToolHandler = async (context) => {
  const { query, projectId, category, status, limit } = context.validatedArgs;
  
  try {
    const prisma = getPrismaClient();
    
    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (category) where.category = category;
    if (status) where.status = status;

    const tables = await prisma.databaseTable.findMany({
      where: {
        ...where,
        OR: [
          { name: { contains: query } },
          { displayName: { contains: query } },
          { comment: { contains: query } }
        ]
      },
      select: {
        id: true,
        projectId: true,
        name: true,
        displayName: true,
        comment: true,
        engine: true,
        status: true,
        category: true,
        version: true,
        createdAt: true,
        updatedAt: true,
        project: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            fields: true,
            indexes: true,
            fromRelations: true,
            toRelations: true
          }
        }
      },
      take: limit,
      orderBy: [
        { updatedAt: 'desc' }
      ]
    });

    // 计算相关性分数
    const results = tables.map((table: any) => {
      let score = 0;
      const lowerQuery = query.toLowerCase();
      
      // 名称匹配
      if (table.name.toLowerCase().includes(lowerQuery)) {
        score += 0.4;
      }
      
      // 显示名称匹配
      if (table.displayName && table.displayName.toLowerCase().includes(lowerQuery)) {
        score += 0.3;
      }
      
      // 注释匹配
      if (table.comment && table.comment.toLowerCase().includes(lowerQuery)) {
        score += 0.3;
      }
      
      return {
        ...table,
        score: Math.min(score, 1.0),
        fieldCount: table._count.fields,
        indexCount: table._count.indexes,
        relationCount: table._count.fromRelations + table._count.toRelations
      };
    }).sort((a: any, b: any) => b.score - a.score);

    return formatSearchResult({
      query,
      context: { projectId, category, status },
      total: results.length,
      results
    }, 'database-tables');
  } catch (error) {
    logger.error('搜索数据库表失败:', error);
    throw new DatabaseError('搜索数据库表失败', { originalError: error });
  }
};

/**
 * 搜索功能模块工具处理器
 */
const searchFeaturesHandler: ToolHandler = async (context) => {
  const { query, projectId, category, status, priority, limit } = context.validatedArgs;
  
  try {
    const prisma = getPrismaClient();
    
    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (category) where.category = category;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const features = await prisma.featureModule.findMany({
      where: {
        ...where,
        OR: [
          { name: { contains: query } },
          { displayName: { contains: query } },
          { description: { contains: query } }
        ]
      },
      select: {
        id: true,
        projectId: true,
        name: true,
        displayName: true,
        description: true,
        category: true,
        status: true,
        priority: true,
        progress: true,
        estimatedHours: true,
        actualHours: true,
        tags: true,
        assigneeId: true,
        assigneeName: true,
        startDate: true,
        dueDate: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
        project: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            endpoints: true,
            tables: true,
            tasks: true,
            documents: true
          }
        }
      },
      take: limit,
      orderBy: [
        { priority: 'desc' },
        { updatedAt: 'desc' }
      ]
    });

    // 计算相关性分数
    const results = features.map((feature: any) => {
      let score = 0;
      const lowerQuery = query.toLowerCase();
      
      // 名称匹配
      if (feature.name.toLowerCase().includes(lowerQuery)) {
        score += 0.4;
      }
      
      // 显示名称匹配
      if (feature.displayName && feature.displayName.toLowerCase().includes(lowerQuery)) {
        score += 0.3;
      }
      
      // 描述匹配
      if (feature.description && feature.description.toLowerCase().includes(lowerQuery)) {
        score += 0.3;
      }
      
      return {
        ...feature,
        score: Math.min(score, 1.0),
        endpointCount: feature._count.endpoints,
        tableCount: feature._count.tables,
        taskCount: feature._count.tasks,
        documentCount: feature._count.documents
      };
    }).sort((a: any, b: any) => b.score - a.score);

    return formatSearchResult({
      query,
      context: { projectId, category, status, priority },
      total: results.length,
      results
    }, 'feature-modules');
  } catch (error) {
    logger.error('搜索功能模块失败:', error);
    throw new DatabaseError('搜索功能模块失败', { originalError: error });
  }
};

/**
 * 搜索Issues工具处理器
 */
const searchIssuesHandler: ToolHandler = async (context) => {
  const { query, projectId, status, priority, issueType, assigneeId, limit } = context.validatedArgs;
  
  try {
    const prisma = getPrismaClient();
    
    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (issueType) where.issueType = issueType;
    if (assigneeId) where.assigneeId = assigneeId;

    const issues = await prisma.issue.findMany({
      where: {
        ...where,
        OR: [
          { title: { contains: query } },
          { description: { contains: query } }
        ]
      },
      select: {
        id: true,
        projectId: true,
        githubId: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        severity: true,
        issueType: true,
        assigneeId: true,
        assigneeName: true,
        assigneeAvatar: true,
        reporterId: true,
        reporterName: true,
        reporterAvatar: true,
        createdAt: true,
        updatedAt: true,
        closedAt: true,
        dueDate: true,
        estimatedHours: true,
        actualHours: true,
        storyPoints: true,
        githubUrl: true,
        project: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            labels: true,
            comments: true,
            attachments: true,
            relatedAPIs: true,
            relatedTables: true
          }
        }
      },
      take: limit,
      orderBy: [
        { priority: 'desc' },
        { updatedAt: 'desc' }
      ]
    });

    // 计算相关性分数
    const results = issues.map((issue: any) => {
      let score = 0;
      const lowerQuery = query.toLowerCase();
      
      // 标题匹配
      if (issue.title.toLowerCase().includes(lowerQuery)) {
        score += 0.6;
      }
      
      // 描述匹配
      if (issue.description && issue.description.toLowerCase().includes(lowerQuery)) {
        score += 0.4;
      }
      
      return {
        ...issue,
        score: Math.min(score, 1.0),
        labelCount: issue._count.labels,
        commentCount: issue._count.comments,
        attachmentCount: issue._count.attachments,
        relationCount: issue._count.relatedAPIs + issue._count.relatedTables
      };
    }).sort((a: any, b: any) => b.score - a.score);

    return formatSearchResult({
      query,
      context: { projectId, status, priority, issueType, assigneeId },
      total: results.length,
      results
    }, 'issues');
  } catch (error) {
    logger.error('搜索Issues失败:', error);
    throw new DatabaseError('搜索Issues失败', { originalError: error });
  }
};

/**
 * 全局搜索工具处理器
 */
const globalSearchHandler: ToolHandler = async (context) => {
  const { query, types, limit, projectId } = context.validatedArgs;
  const limitPerType = Math.ceil((limit || config.search.defaultLimit) / types.length);
  
  try {
    const results: any = {};

    // 并行搜索所有类型
    const searchPromises = types.map(async (type: string) => {
      switch (type) {
        case 'projects':
          if (!projectId) { // 项目搜索不需要projectId过滤
            const projectResults = await projectSearchService.search(query, { limit: limitPerType });
            results.projects = projectResults.map(r => ({ ...r.item, score: r.score }));
          }
          break;
          
        case 'apis':
        case 'endpoints':
          const endpointResults = await apiEndpointSearchService.search(query, { 
            projectId, 
            limit: limitPerType 
          });
          results.endpoints = endpointResults.map(r => ({ ...r.item, score: r.score }));
          break;
          
        case 'tags':
          const tagContext = { validatedArgs: { query, projectId, limit: limitPerType } };
          const tagResult = await searchTagsHandler(tagContext as any);
          const tagData = JSON.parse(tagResult.content[0].text!);
          results.tags = tagData.results;
          break;
      }
    });

    await Promise.all(searchPromises);

    return formatSearchResult({
      query,
      types,
      projectId,
      results
    }, 'global-search');
  } catch (error) {
    logger.error('全局搜索失败:', error);
    throw error;
  }
};

/**
 * 获取搜索建议工具处理器
 */
const getSearchSuggestionsHandler: ToolHandler = async (context) => {
  const { query, limit, types } = context.validatedArgs;
  
  try {
    const suggestions = new Set<string>();

    // 从不同类型获取建议
    const suggestionPromises = types.map(async (type: string) => {
      switch (type) {
        case 'projects':
          const projectSuggestions = await projectSearchService.getSuggestions(query, limit);
          projectSuggestions.forEach(s => suggestions.add(s));
          break;
          
        case 'endpoints':
          const endpointSuggestions = await apiEndpointSearchService.getSuggestions(query, limit);
          endpointSuggestions.forEach(s => suggestions.add(s));
          break;
      }
    });

    await Promise.all(suggestionPromises);

    return formatSearchResult({
      query,
      types,
      suggestions: Array.from(suggestions).slice(0, limit)
    }, 'search-suggestions');
  } catch (error) {
    logger.error('获取搜索建议失败:', error);
    throw error;
  }
};

/**
 * 获取最近项目工具处理器
 */
const getRecentItemsHandler: ToolHandler = async (context) => {
  const { limit, types, days } = context.validatedArgs;
  
  try {
    const results: any = {};
    const limitPerType = Math.ceil((limit || config.search.defaultLimit) / types.length);

    if (types.includes('projects')) {
      results.projects = await projectSearchService.getRecentProjects(limitPerType);
    }

    if (types.includes('endpoints')) {
      const prisma = getPrismaClient();
      const recentEndpoints = await prisma.aPIEndpoint.findMany({
        select: {
          id: true,
          name: true,
          method: true,
          path: true,
          status: true,
          updatedAt: true,
          project: {
            select: {
              name: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: limitPerType
      });
      results.endpoints = recentEndpoints;
    }

    return formatSearchResult({
      types,
      days,
      results
    }, 'recent-items');
  } catch (error) {
    logger.error('获取最近项目失败:', error);
    throw new DatabaseError('获取最近项目失败', { originalError: error });
  }
};

/**
 * 刷新搜索索引工具处理器
 */
const refreshIndexHandler: ToolHandler = async (context) => {
  const { force, types } = context.validatedArgs;
  
  try {
    const refreshPromises: Promise<void>[] = [];

    if (!types || types.includes('projects')) {
      refreshPromises.push(projectSearchService.buildIndex());
    }

    if (!types || types.includes('endpoints')) {
      refreshPromises.push(apiEndpointSearchService.buildIndex());
    }

    await Promise.all(refreshPromises);

    return formatSearchResult({
      force,
      types: types || ['projects', 'endpoints'],
      status: 'success',
      timestamp: new Date().toISOString()
    }, 'refresh-index');
  } catch (error) {
    logger.error('刷新搜索索引失败:', error);
    throw error;
  }
};

/**
 * 定义所有搜索工具
 */
export const searchTools: Record<string, ToolDefinition> = {
  searchProjects: {
    tool: {
      name: 'search_projects',
      description: '搜索项目 - 根据名称、描述等搜索项目',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: '搜索查询字符串'
          },
          limit: {
            type: 'number',
            description: '返回结果数量限制',
            default: config.search.defaultLimit
          },
          status: {
            type: 'string',
            description: '项目状态过滤'
          },
          includeArchived: {
            type: 'boolean',
            description: '是否包含已归档项目',
            default: false
          }
        },
        required: ['query']
      }
    },
    handler: searchProjectsHandler,
    cacheable: true,
    cacheTtl: 2 * 60 * 1000, // 2分钟缓存
    category: 'search'
  },

  searchApiEndpoints: {
    tool: {
      name: 'search_api_endpoints',
      description: '搜索API端点 - 根据名称、路径、方法等搜索API端点',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: '搜索查询字符串'
          },
          projectId: {
            type: 'string',
            description: '限制在特定项目内搜索'
          },
          groupId: {
            type: 'string',
            description: '限制在特定分组内搜索'
          },
          method: {
            type: 'string',
            description: 'HTTP方法过滤'
          },
          status: {
            type: 'string',
            description: '端点状态过滤'
          },
          limit: {
            type: 'number',
            description: '返回结果数量限制',
            default: config.search.defaultLimit
          },
          includeDeprecated: {
            type: 'boolean',
            description: '是否包含已弃用端点',
            default: false
          },
          publicOnly: {
            type: 'boolean',
            description: '是否只搜索公共端点',
            default: false
          }
        },
        required: ['query']
      }
    },
    handler: searchApiEndpointsHandler,
    cacheable: true,
    cacheTtl: 2 * 60 * 1000,
    category: 'search'
  },

  searchTags: {
    tool: {
      name: 'search_tags',
      description: '搜索标签 - 根据标签名称搜索',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: '搜索查询字符串'
          },
          projectId: {
            type: 'string',
            description: '限制在特定项目内搜索'
          },
          limit: {
            type: 'number',
            description: '返回结果数量限制',
            default: config.search.defaultLimit
          }
        },
        required: ['query']
      }
    },
    handler: searchTagsHandler,
    cacheable: true,
    cacheTtl: 5 * 60 * 1000, // 5分钟缓存
    category: 'search'
  },

  searchTables: {
    tool: {
      name: 'search_tables',
      description: '搜索数据库表 - 根据表名、注释等搜索数据库表',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: '搜索查询字符串'
          },
          projectId: {
            type: 'string',
            description: '限制在特定项目内搜索'
          },
          category: {
            type: 'string',
            description: '表分类过滤'
          },
          status: {
            type: 'string',
            description: '表状态过滤'
          },
          limit: {
            type: 'number',
            description: '返回结果数量限制',
            default: config.search.defaultLimit
          }
        },
        required: ['query']
      }
    },
    handler: searchTablesHandler,
    cacheable: true,
    cacheTtl: 3 * 60 * 1000,
    category: 'search'
  },

  searchFeatures: {
    tool: {
      name: 'search_features',
      description: '搜索功能模块 - 根据名称、描述等搜索功能模块',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: '搜索查询字符串'
          },
          projectId: {
            type: 'string',
            description: '限制在特定项目内搜索'
          },
          category: {
            type: 'string',
            description: '功能分类过滤'
          },
          status: {
            type: 'string',
            enum: ['planned', 'in-progress', 'completed', 'deprecated'],
            description: '功能状态过滤'
          },
          priority: {
            type: 'string',
            enum: ['HIGH', 'MEDIUM', 'LOW'],
            description: '优先级过滤'
          },
          limit: {
            type: 'number',
            description: '返回结果数量限制',
            default: config.search.defaultLimit
          }
        },
        required: ['query']
      }
    },
    handler: searchFeaturesHandler,
    cacheable: true,
    cacheTtl: 3 * 60 * 1000,
    category: 'search'
  },

  searchIssues: {
    tool: {
      name: 'search_issues',
      description: '搜索Issues - 根据标题、描述等搜索问题',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: '搜索查询字符串'
          },
          projectId: {
            type: 'string',
            description: '限制在特定项目内搜索'
          },
          status: {
            type: 'string',
            enum: ['OPEN', 'CLOSED'],
            description: 'Issue状态过滤'
          },
          priority: {
            type: 'string',
            enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
            description: '优先级过滤'
          },
          issueType: {
            type: 'string',
            enum: ['BUG', 'FEATURE', 'ENHANCEMENT', 'TASK', 'DOCUMENTATION'],
            description: 'Issue类型过滤'
          },
          assigneeId: {
            type: 'string',
            description: '指派人ID过滤'
          },
          limit: {
            type: 'number',
            description: '返回结果数量限制',
            default: config.search.defaultLimit
          }
        },
        required: ['query']
      }
    },
    handler: searchIssuesHandler,
    cacheable: true,
    cacheTtl: 1 * 60 * 1000, // 1分钟缓存（Issues变化较快）
    category: 'search'
  },

  globalSearch: {
    tool: {
      name: 'global_search',
      description: '全局搜索 - 跨所有类型的综合搜索',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: '搜索查询字符串'
          },
          types: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['projects', 'endpoints', 'tags', 'tables', 'features', 'issues']
            },
            description: '搜索类型',
            default: ['projects', 'endpoints', 'tags']
          },
          limit: {
            type: 'number',
            description: '总结果数量限制',
            default: config.search.defaultLimit
          },
          projectId: {
            type: 'string',
            description: '限制在特定项目内搜索（不适用于项目搜索）'
          }
        },
        required: ['query']
      }
    },
    handler: globalSearchHandler,
    cacheable: true,
    cacheTtl: 2 * 60 * 1000,
    category: 'search'
  },

  getSearchSuggestions: {
    tool: {
      name: 'get_search_suggestions',
      description: '获取搜索建议 - 根据查询前缀提供搜索建议',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: '搜索查询前缀'
          },
          limit: {
            type: 'number',
            description: '返回建议数量限制',
            default: 5
          },
          types: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['projects', 'endpoints', 'tags']
            },
            description: '建议来源类型',
            default: ['projects', 'endpoints']
          }
        },
        required: ['query']
      }
    },
    handler: getSearchSuggestionsHandler,
    cacheable: true,
    cacheTtl: 10 * 60 * 1000, // 10分钟缓存
    category: 'search'
  },

  getRecentItems: {
    tool: {
      name: 'get_recent_items',
      description: '获取最近项目 - 获取最近更新的项目、端点等',
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: '返回结果数量限制',
            default: config.search.defaultLimit
          },
          types: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['projects', 'endpoints', 'features', 'issues']
            },
            description: '获取类型',
            default: ['projects', 'endpoints']
          },
          days: {
            type: 'number',
            description: '时间范围（天数）',
            default: 30
          }
        }
      }
    },
    handler: getRecentItemsHandler,
    cacheable: true,
    cacheTtl: 5 * 60 * 1000,
    category: 'search'
  },

  refreshIndex: {
    tool: {
      name: 'refresh_search_index',
      description: '刷新搜索索引 - 重建搜索索引以获取最新数据',
      inputSchema: {
        type: 'object',
        properties: {
          force: {
            type: 'boolean',
            description: '强制刷新索引',
            default: false
          },
          types: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['projects', 'endpoints', 'tags', 'tables']
            },
            description: '要刷新的索引类型'
          }
        }
      }
    },
    handler: refreshIndexHandler,
    cacheable: false,
    rateLimit: 10, // 每分钟最多10次
    category: 'maintenance'
  }
};