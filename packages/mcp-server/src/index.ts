import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { PrismaClient } from '@prisma/client';

// 创建Prisma客户端实例
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:../backend/prisma/dev.db'
    }
  }
});
import Fuse from 'fuse.js';
import dotenv from 'dotenv';
import { vectorSearchService } from './vectorSearch.js';
import { apiRAGService } from './apiRAG.js';

// 加载环境变量
dotenv.config();

// 搜索索引缓存
let projectsIndex: Fuse<any> | null = null;
let apisIndex: Fuse<any> | null = null;
let tagsIndex: Fuse<any> | null = null;
let lastIndexUpdate = 0;
const INDEX_CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

async function initializeSearchIndexes() {
  const now = Date.now();
  if (now - lastIndexUpdate < INDEX_CACHE_TTL && projectsIndex && apisIndex && tagsIndex) {
    return; // 使用缓存的索引
  }

  const [projects, apis, tags] = await Promise.all([
    prisma.project.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        status: true,
      },
    }),
    prisma.aPI.findMany({
      select: {
        id: true,
        projectId: true,
        name: true,
        method: true,
        path: true,
        description: true,
        status: true,
      },
    }),
    prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        color: true,
        projectId: true,
      },
    }),
  ]);

  projectsIndex = new Fuse(projects, {
    keys: ['name', 'description'],
    threshold: 0.3,
  });

  apisIndex = new Fuse(apis, {
    keys: ['name', 'description', 'path', 'method'],
    threshold: 0.3,
  });

  tagsIndex = new Fuse(tags, {
    keys: ['name'],
    threshold: 0.3,
  });

  lastIndexUpdate = now;
}

class DevAPISearchServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'devapi-search-server',
        version: '2.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'search_projects',
          description: '搜索项目',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: '搜索查询字符串',
              },
              limit: {
                type: 'number',
                description: '返回结果数量限制',
                default: 10,
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'search_apis',
          description: '搜索API接口',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: '搜索查询字符串',
              },
              projectId: {
                type: 'string',
                description: '限制在特定项目内搜索',
              },
              method: {
                type: 'string',
                description: 'HTTP方法过滤',
              },
              status: {
                type: 'string',
                description: '状态过滤',
              },
              limit: {
                type: 'number',
                description: '返回结果数量限制',
                default: 10,
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'search_tags',
          description: '搜索标签',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: '搜索查询字符串',
              },
              projectId: {
                type: 'string',
                description: '限制在特定项目内搜索',
              },
              limit: {
                type: 'number',
                description: '返回结果数量限制',
                default: 10,
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'global_search',
          description: '全局搜索（包括项目、API、标签）',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: '搜索查询字符串',
              },
              types: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['projects', 'apis', 'tags'],
                },
                description: '搜索类型',
                default: ['projects', 'apis', 'tags'],
              },
              limit: {
                type: 'number',
                description: '每种类型的返回结果数量限制',
                default: 5,
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'get_search_suggestions',
          description: '获取搜索建议',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: '搜索查询前缀',
              },
              limit: {
                type: 'number',
                description: '返回建议数量限制',
                default: 5,
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'get_recent_items',
          description: '获取最近项目',
          inputSchema: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: '返回结果数量限制',
                default: 10,
              },
            },
          },
        },
        {
          name: 'refresh_search_index',
          description: '刷新搜索索引',
          inputSchema: {
            type: 'object',
            properties: {
              force: {
                type: 'boolean',
                description: '强制刷新索引',
                default: false,
              },
            },
          },
        },
        {
          name: 'vector_search',
          description: '向量语义搜索',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: '搜索查询字符串',
              },
              limit: {
                type: 'number',
                description: '返回结果数量限制',
                default: 10,
              },
              threshold: {
                type: 'number',
                description: '相似度阈值',
                default: 0.5,
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'hybrid_search',
          description: '混合搜索（关键词+语义搜索）',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: '搜索查询字符串',
              },
              types: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['projects', 'apis', 'tags'],
                },
                description: '搜索类型',
                default: ['projects', 'apis', 'tags'],
              },
              limit: {
                type: 'number',
                description: '返回结果数量限制',
                default: 10,
              },
              vectorWeight: {
                type: 'number',
                description: '向量搜索权重',
                default: 0.6,
              },
              fuzzyWeight: {
                type: 'number',
                description: '模糊搜索权重',
                default: 0.4,
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'build_vector_index',
          description: '构建向量搜索索引',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'rag_search_apis',
          description: 'RAG增强的智能API搜索',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: '搜索查询字符串',
              },
              method: {
                type: 'string',
                description: 'HTTP方法过滤',
              },
              projectId: {
                type: 'string',
                description: '项目ID过滤',
              },
              tags: {
                type: 'array',
                items: { type: 'string' },
                description: '标签过滤',
              },
              includeRelated: {
                type: 'boolean',
                description: '是否包含相关API推荐',
                default: true,
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'get_api_recommendations',
          description: '获取API推荐',
          inputSchema: {
            type: 'object',
            properties: {
              apiId: {
                type: 'string',
                description: 'API ID',
              },
              limit: {
                type: 'number',
                description: '推荐数量限制',
                default: 5,
              },
            },
            required: ['apiId'],
          },
        },
        {
          name: 'build_api_context',
          description: '构建API上下文索引',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'search_projects':
          return this.searchProjects(request.params.arguments);
        case 'search_apis':
          return this.searchAPIs(request.params.arguments);
        case 'search_tags':
          return this.searchTags(request.params.arguments);
        case 'global_search':
          return this.globalSearch(request.params.arguments);
        case 'get_search_suggestions':
          return this.getSearchSuggestions(request.params.arguments);
        case 'get_recent_items':
          return this.getRecentItems(request.params.arguments);
        case 'refresh_search_index':
          return this.refreshSearchIndex(request.params.arguments);
        case 'vector_search':
          return this.vectorSearch(request.params.arguments);
        case 'hybrid_search':
          return this.hybridSearch(request.params.arguments);
        case 'build_vector_index':
          return this.buildVectorIndex(request.params.arguments);
        case 'rag_search_apis':
          return this.ragSearchAPIs(request.params.arguments);
        case 'get_api_recommendations':
          return this.getAPIRecommendations(request.params.arguments);
        case 'build_api_context':
          return this.buildAPIContext(request.params.arguments);
        default:
          throw new Error(`未知工具: ${request.params.name}`);
      }
    });
  }

  private async searchProjects(args: any) {
    const { query, limit = 10 } = args;
    await initializeSearchIndexes();
    
    if (!projectsIndex) {
      throw new Error('项目搜索索引未初始化');
    }
    
    const results = projectsIndex.search(query, { limit });
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          type: 'projects',
          query,
          total: results.length,
          results: results.map(result => ({
            ...(result.item || {}),
            score: result.score
          }))
        }, null, 2)
      }]
    };
  }

  private async searchAPIs(args: any) {
    const { query, projectId, method, status, limit = 10 } = args;
    
    // 构建查询条件
    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (method) where.method = method;
    if (status) where.status = status;
    
    const apis = await prisma.aPI.findMany({
      where,
      select: {
        id: true,
        projectId: true,
        name: true,
        method: true,
        path: true,
        description: true,
        status: true,
        project: {
          select: {
            name: true,
          },
        },
      },
    });
    
    // 使用Fuse进行模糊搜索
    const fuseIndex = new Fuse(apis, {
      keys: ['name', 'description', 'path', 'method'],
      threshold: 0.3,
    });
    
    const results = fuseIndex.search(query, { limit });
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          type: 'apis',
          query,
          projectId,
          method,
          status,
          total: results.length,
          results: results.map(result => ({
            ...(result.item || {}),
            score: result.score
          }))
        }, null, 2)
      }]
    };
  }

  private async searchTags(args: any) {
    const { query, projectId, limit = 10 } = args;
    
    const where: any = {};
    if (projectId) where.projectId = projectId;
    
    const tags = await prisma.tag.findMany({
      where,
      select: {
        id: true,
        name: true,
        color: true,
        projectId: true,
        project: {
          select: {
            name: true,
          },
        },
      },
    });
    
    const fuseIndex = new Fuse(tags, {
      keys: ['name'],
      threshold: 0.3,
    });
    
    const results = fuseIndex.search(query, { limit });
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          type: 'tags',
          query,
          projectId,
          total: results.length,
          results: results.map(result => ({
            ...(result.item || {}),
            score: result.score
          }))
        }, null, 2)
      }]
    };
  }

  private async globalSearch(args: any) {
    const { query, types = ['projects', 'apis', 'tags'], limit = 5 } = args;
    await initializeSearchIndexes();
    const results: any = {};

    if (types.includes('projects') && projectsIndex) {
      const projectResults = projectsIndex.search(query, { limit });
      results.projects = projectResults.map(r => ({ ...r.item, score: r.score }));
    }

    if (types.includes('apis') && apisIndex) {
      const apiResults = apisIndex.search(query, { limit });
      results.apis = apiResults.map(r => ({ ...r.item, score: r.score }));
    }

    if (types.includes('tags') && tagsIndex) {
      const tagResults = tagsIndex.search(query, { limit });
      results.tags = tagResults.map(r => ({ ...r.item, score: r.score }));
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          type: 'global_search',
          query,
          types,
          results
        }, null, 2)
      }]
    };
  }

  private async getSearchSuggestions(args: any) {
    const { query, limit = 5 } = args;
    
    // 获取项目、API和标签名称作为搜索建议
    const [projects, apis, tags] = await Promise.all([
      prisma.project.findMany({
        select: { name: true },
        where: {
          name: {
            contains: query,
          },
        },
        take: limit,
      }),
      prisma.aPI.findMany({
        select: { name: true, path: true },
        where: {
          OR: [
            { name: { contains: query } },
            { path: { contains: query } },
          ],
        },
        take: limit,
      }),
      prisma.tag.findMany({
        select: { name: true },
        where: {
          name: {
            contains: query,
          },
        },
        take: limit,
      }),
    ]);

    const suggestions = [
      ...projects.map(p => ({ type: 'project', text: p.name })),
      ...apis.map(a => ({ type: 'api', text: a.name, path: a.path })),
      ...tags.map(t => ({ type: 'tag', text: t.name })),
    ].slice(0, limit);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          type: 'search_suggestions',
          query,
          suggestions
        }, null, 2)
      }]
    };
  }

  private async getRecentItems(args: any) {
    const { limit = 10 } = args;
    
    const [recentProjects, recentAPIs] = await Promise.all([
      prisma.project.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: Math.ceil(limit / 2),
      }),
      prisma.aPI.findMany({
        select: {
          id: true,
          name: true,
          method: true,
          path: true,
          updatedAt: true,
          project: {
            select: { name: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: Math.ceil(limit / 2),
      }),
    ]);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          type: 'recent_items',
          projects: recentProjects,
          apis: recentAPIs
        }, null, 2)
      }]
    };
  }

  private async refreshSearchIndex(args: any) {
    const { force = false } = args;
    
    if (force) {
      lastIndexUpdate = 0; // 强制刷新
    }
    
    await initializeSearchIndexes();
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          type: 'refresh_index',
          status: 'success',
          timestamp: new Date().toISOString()
        }, null, 2)
      }]
    };
  }

  private async vectorSearch(args: any) {
    const { query, limit = 10, threshold = 0.5 } = args;
    
    try {
      const results = await vectorSearchService.search(query, limit, threshold);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            type: 'vector_search',
            query,
            threshold,
            total: results.length,
            results: results.map(result => ({
              ...result.document.metadata,
              vectorScore: result.score
            }))
          }, null, 2)
        }]
      };
    } catch (error) {
      console.error('向量搜索失败:', error);
      throw new Error(`向量搜索失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  private async hybridSearch(args: any) {
    const { 
      query, 
      types = ['projects', 'apis', 'tags'], 
      limit = 10, 
      vectorWeight = 0.6, 
      fuzzyWeight = 0.4 
    } = args;
    
    try {
      // 执行传统模糊搜索获取基础结果
      await initializeSearchIndexes();
      const fuzzyResults: any[] = [];

      if (types.includes('projects') && projectsIndex) {
        const projectResults = projectsIndex.search(query, { limit: limit * 2 });
        fuzzyResults.push(...projectResults);
      }

      if (types.includes('apis') && apisIndex) {
        const apiResults = apisIndex.search(query, { limit: limit * 2 });
        fuzzyResults.push(...apiResults);
      }

      if (types.includes('tags') && tagsIndex) {
        const tagResults = tagsIndex.search(query, { limit: limit * 2 });
        fuzzyResults.push(...tagResults);
      }

      // 使用向量搜索服务进行混合搜索
      const hybridResults = await vectorSearchService.hybridSearch(
        query, 
        fuzzyResults, 
        limit, 
        vectorWeight, 
        fuzzyWeight
      );

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            type: 'hybrid_search',
            query,
            types,
            vectorWeight,
            fuzzyWeight,
            total: hybridResults.length,
            results: hybridResults
          }, null, 2)
        }]
      };
    } catch (error) {
      console.error('混合搜索失败:', error);
      throw new Error(`混合搜索失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  private async buildVectorIndex(args: any) {
    try {
      await vectorSearchService.initialize();
      await vectorSearchService.buildSearchIndex();
      
      const stats = vectorSearchService.getStats();
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            type: 'build_vector_index',
            status: 'success',
            stats,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      console.error('构建向量索引失败:', error);
      throw new Error(`构建向量索引失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  private async ragSearchAPIs(args: any) {
    const { query, method, projectId, tags, includeRelated = true } = args;
    
    try {
      const results = await apiRAGService.searchAPIs(query, {
        method,
        projectId,
        tags,
        includeRelated
      });
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            type: 'rag_search_apis',
            query,
            context: { method, projectId, tags, includeRelated },
            total: results.length,
            results: results.map(result => ({
              api: result.api,
              relevanceScore: result.relevanceScore,
              explanation: result.explanation,
              suggestions: result.suggestions
            }))
          }, null, 2)
        }]
      };
    } catch (error) {
      console.error('RAG API搜索失败:', error);
      throw new Error(`RAG API搜索失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  private async getAPIRecommendations(args: any) {
    const { apiId, limit = 5 } = args;
    
    try {
      const recommendations = await apiRAGService.getAPIRecommendations(apiId, limit);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            type: 'api_recommendations',
            apiId,
            total: recommendations.length,
            recommendations
          }, null, 2)
        }]
      };
    } catch (error) {
      console.error('获取API推荐失败:', error);
      throw new Error(`获取API推荐失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  private async buildAPIContext(args: any) {
    try {
      await apiRAGService.buildAPIContext();
      const stats = apiRAGService.getStats();
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            type: 'build_api_context',
            status: 'success',
            stats,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      console.error('构建API上下文失败:', error);
      throw new Error(`构建API上下文失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  async run(): Promise<void> {
    try {
      // 初始化搜索索引
      await initializeSearchIndexes();
      console.error('关键词搜索索引初始化完成');
      
      // 初始化向量搜索服务
      try {
        await vectorSearchService.initialize();
        console.error('向量搜索服务初始化完成');
        
        // 构建向量索引（后台异步执行）
        vectorSearchService.buildSearchIndex().then(() => {
          console.error('向量搜索索引构建完成');
        }).catch(error => {
          console.error('向量搜索索引构建失败:', error);
        });
      } catch (error) {
        console.error('向量搜索服务初始化失败，将仅使用关键词搜索:', error);
      }

      // 初始化API RAG服务
      try {
        // 构建API上下文（后台异步执行）
        apiRAGService.buildAPIContext().then(() => {
          console.error('API RAG上下文构建完成');
        }).catch(error => {
          console.error('API RAG上下文构建失败:', error);
        });
      } catch (error) {
        console.error('API RAG服务初始化失败:', error);
      }
      
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('DevAPI MCP搜索服务器已启动');
    } catch (error) {
      console.error('启动MCP服务器时出错:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    await this.server.close();
    console.error('DevAPI MCP搜索服务器已关闭');
  }
}

const server = new DevAPISearchServer();

// 优雅关闭处理
process.on('SIGINT', async () => {
  console.error('接收到关闭信号，正在关闭服务器...');
  await server.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('接收到终止信号，正在关闭服务器...');
  await server.shutdown();
  process.exit(0);
});

server.run().catch(async (error) => {
  console.error('MCP服务器运行出错:', error);
  await server.shutdown();
  process.exit(1);
});