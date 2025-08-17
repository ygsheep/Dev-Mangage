import express from 'express';
import cors from 'cors';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { prisma } from '@devapi/backend/prisma';
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
      },
    }),
  ]);

  // 创建搜索索引
  projectsIndex = new Fuse(projects, {
    keys: ['name', 'description'],
    threshold: 0.3,
    includeScore: true,
  });

  apisIndex = new Fuse(apis, {
    keys: ['name', 'method', 'path', 'description'],
    threshold: 0.3,
    includeScore: true,
  });

  tagsIndex = new Fuse(tags, {
    keys: ['name', 'description'],
    threshold: 0.3,
    includeScore: true,
  });

  lastIndexUpdate = now;
}

/**
 * HTTP MCP 服务器类
 * 提供基于 HTTP 的 MCP 工具访问接口
 */
class HTTPMCPServer {
  private app: express.Application;
  private server: any;
  private port: number;
  private mcpServer: Server;

  constructor(port: number = 3001) {
    this.port = port;
    this.app = express();
    this.mcpServer = new Server(
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
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupMCPTools();
  }

  private setupMiddleware(): void {
    // CORS 配置
    this.app.use(cors({
      origin: ['http://localhost:5173', 'http://localhost:3001'],
      credentials: true
    }));
    
    // JSON 解析
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // 请求日志
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // 健康检查
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'HTTP MCP Server',
        version: '2.0.0'
      });
    });

    // 列出可用工具
    this.app.get('/mcp/tools', async (req, res) => {
      try {
        const tools = [
          {
            name: 'search_projects',
            description: '搜索项目',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: '搜索查询' },
                limit: { type: 'number', description: '结果数量限制', default: 10 }
              },
              required: ['query']
            }
          },
          {
            name: 'search_apis',
            description: '搜索API接口',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: '搜索查询' },
                method: { type: 'string', description: 'HTTP方法过滤' },
                limit: { type: 'number', description: '结果数量限制', default: 10 }
              },
              required: ['query']
            }
          },
          {
            name: 'global_search',
            description: '全局搜索',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: '搜索查询' },
                types: { type: 'array', items: { type: 'string' }, description: '搜索类型' },
                limit: { type: 'number', description: '结果数量限制', default: 10 }
              },
              required: ['query']
            }
          },
          {
            name: 'vector_search',
            description: '向量语义搜索',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: '搜索查询' },
                limit: { type: 'number', description: '结果数量限制', default: 10 },
                threshold: { type: 'number', description: '相似度阈值', default: 0.3 }
              },
              required: ['query']
            }
          },
          {
            name: 'hybrid_search',
            description: '混合搜索',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: '搜索查询' },
                vectorWeight: { type: 'number', description: '向量搜索权重', default: 0.7 },
                fuzzyWeight: { type: 'number', description: '模糊搜索权重', default: 0.3 },
                limit: { type: 'number', description: '结果数量限制', default: 10 }
              },
              required: ['query']
            }
          },
          {
            name: 'rag_search_apis',
            description: 'RAG增强API搜索',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: '搜索查询' },
                includeRelated: { type: 'boolean', description: '包含相关API', default: true },
                limit: { type: 'number', description: '结果数量限制', default: 10 }
              },
              required: ['query']
            }
          }
        ];
        
        res.json({ tools });
      } catch (error) {
        res.status(500).json({
          error: 'Failed to list tools',
          message: error instanceof Error ? error.message : String(error)
        });
      }
    });

    // 调用工具
    this.app.post('/mcp/tools/:toolName', async (req, res) => {
      try {
        const { toolName } = req.params;
        const { arguments: args } = req.body;
        
        let result;
        
        switch (toolName) {
          case 'search_projects':
            result = await this.searchProjects(args);
            break;
          case 'search_apis':
            result = await this.searchAPIs(args);
            break;
          case 'global_search':
            result = await this.globalSearch(args);
            break;
          case 'vector_search':
            result = await this.vectorSearch(args);
            break;
          case 'hybrid_search':
            result = await this.hybridSearch(args);
            break;
          case 'rag_search_apis':
            result = await this.ragSearchAPIs(args);
            break;
          default:
            throw new Error(`Unknown tool: ${toolName}`);
        }
        
        res.json({
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        });
        
      } catch (error) {
        res.status(500).json({
          error: 'Tool execution failed',
          message: error instanceof Error ? error.message : String(error)
        });
      }
    });

    // WebSocket 支持 (未来扩展)
    this.app.get('/mcp/ws', (req, res) => {
      res.json({
        message: 'WebSocket support coming soon',
        endpoint: `ws://localhost:${this.port}/mcp/ws`
      });
    });
  }

  private setupMCPTools(): void {
    // 这里可以设置标准的 MCP 工具处理器
    // 目前通过 HTTP 路由处理
  }

  // 工具实现方法
  private async searchProjects(args: any) {
    await initializeSearchIndexes();
    
    if (!projectsIndex) {
      throw new Error('项目搜索索引未初始化');
    }
    
    const { query, limit = 10 } = args;
    const results = projectsIndex.search(query).slice(0, limit);
    
    return {
      tool: 'search_projects',
      query,
      results: results.map(result => ({
        ...result.item,
        score: result.score
      })),
      total: results.length
    };
  }

  private async searchAPIs(args: any) {
    await initializeSearchIndexes();
    
    if (!apisIndex) {
      throw new Error('API搜索索引未初始化');
    }
    
    const { query, method, limit = 10 } = args;
    let results = apisIndex.search(query);
    
    // 按HTTP方法过滤
    if (method) {
      results = results.filter(result => 
        result.item.method.toLowerCase() === method.toLowerCase()
      );
    }
    
    return {
      tool: 'search_apis',
      query,
      method,
      results: results.slice(0, limit).map(result => ({
        ...result.item,
        score: result.score
      })),
      total: results.length
    };
  }

  private async globalSearch(args: any) {
    await initializeSearchIndexes();
    
    const { query, types = ['projects', 'apis'], limit = 10 } = args;
    const results: any[] = [];
    
    if (types.includes('projects') && projectsIndex) {
      const projectResults = projectsIndex.search(query).slice(0, Math.ceil(limit / types.length));
      results.push(...projectResults.map(result => ({
        type: 'project',
        ...result.item,
        score: result.score
      })));
    }
    
    if (types.includes('apis') && apisIndex) {
      const apiResults = apisIndex.search(query).slice(0, Math.ceil(limit / types.length));
      results.push(...apiResults.map(result => ({
        type: 'api',
        ...result.item,
        score: result.score
      })));
    }
    
    // 按分数排序
    results.sort((a, b) => (a.score || 0) - (b.score || 0));
    
    return {
      tool: 'global_search',
      query,
      types,
      results: results.slice(0, limit),
      total: results.length
    };
  }

  private async vectorSearch(args: any) {
    const { query, limit = 10, threshold = 0.3 } = args;
    
    try {
      const results = await vectorSearchService.search(query, limit, threshold);
      return {
        tool: 'vector_search',
        query,
        threshold,
        results: results.map(result => ({
          document: result.document,
          score: result.score,
          metadata: result.document.metadata
        })),
        total: results.length,
        useFallback: vectorSearchService.getStats().useFallback
      };
    } catch (error) {
      throw new Error(`向量搜索失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async hybridSearch(args: any) {
    const { query, vectorWeight = 0.7, fuzzyWeight = 0.3, limit = 10 } = args;
    
    try {
      // 向量搜索
      const vectorResults = await vectorSearchService.search(query, limit * 2, 0.1);
      
      // 模糊搜索
      await initializeSearchIndexes();
      const fuzzyResults: any[] = [];
      
      if (apisIndex) {
        const apiResults = apisIndex.search(query);
        fuzzyResults.push(...apiResults.map(result => ({
          type: 'api',
          ...result.item,
          fuzzyScore: 1 - (result.score || 0)
        })));
      }
      
      if (projectsIndex) {
        const projectResults = projectsIndex.search(query);
        fuzzyResults.push(...projectResults.map(result => ({
          type: 'project',
          ...result.item,
          fuzzyScore: 1 - (result.score || 0)
        })));
      }
      
      // 合并和加权
      const combinedResults = [];
      
      // 处理向量搜索结果
      for (const vResult of vectorResults) {
        combinedResults.push({
          ...vResult.document.metadata,
          vectorScore: vResult.score,
          fuzzyScore: 0,
          combinedScore: vResult.score * vectorWeight,
          source: 'vector'
        });
      }
      
      // 处理模糊搜索结果
      for (const fResult of fuzzyResults) {
        const existing = combinedResults.find(r => r.id === fResult.id);
        if (existing) {
          existing.fuzzyScore = fResult.fuzzyScore;
          existing.combinedScore = existing.vectorScore * vectorWeight + fResult.fuzzyScore * fuzzyWeight;
          existing.source = 'hybrid';
        } else {
          combinedResults.push({
            ...fResult,
            vectorScore: 0,
            combinedScore: fResult.fuzzyScore * fuzzyWeight,
            source: 'fuzzy'
          });
        }
      }
      
      // 排序并限制结果
      combinedResults.sort((a, b) => b.combinedScore - a.combinedScore);
      
      return {
        tool: 'hybrid_search',
        query,
        vectorWeight,
        fuzzyWeight,
        results: combinedResults.slice(0, limit),
        total: combinedResults.length
      };
    } catch (error) {
      throw new Error(`混合搜索失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async ragSearchAPIs(args: any) {
    const { query, includeRelated = true, limit = 10 } = args;
    
    try {
      const results = await apiRAGService.searchAPIs(query, {
        includeRelated
      });
      
      return {
        tool: 'rag_search_apis',
        query,
        includeRelated,
        results: results.map(result => ({
          api: result.api,
          relevanceScore: result.relevanceScore,
          explanation: result.explanation,
          suggestions: result.suggestions || []
        })),
        total: results.length
      };
    } catch (error) {
      throw new Error(`RAG搜索失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async start(): Promise<void> {
    try {
      // 初始化搜索服务
      console.log('🔧 初始化搜索索引...');
      await initializeSearchIndexes();
      console.log('✅ 关键词搜索索引初始化完成');
      
      // 初始化向量搜索服务
      try {
        await vectorSearchService.initialize();
        console.log('✅ 向量搜索服务初始化完成');
        
        // 构建向量索引（后台异步执行）
        vectorSearchService.buildSearchIndex().then(() => {
          console.log('✅ 向量搜索索引构建完成');
        }).catch(error => {
          console.error('❌ 向量搜索索引构建失败:', error);
        });
      } catch (error) {
        console.error('⚠️  向量搜索服务初始化失败，将仅使用关键词搜索:', error);
      }

      // 初始化API RAG服务
      try {
        // 构建API上下文（后台异步执行）
        apiRAGService.buildAPIContext().then(() => {
          console.log('✅ API RAG上下文构建完成');
        }).catch(error => {
          console.error('❌ API RAG上下文构建失败:', error);
        });
      } catch (error) {
        console.error('⚠️  API RAG服务初始化失败:', error);
      }
      
      // 启动HTTP服务器
      this.server = this.app.listen(this.port, () => {
        console.log(`🚀 HTTP MCP Server 已启动`);
        console.log(`📡 服务地址: http://localhost:${this.port}`);
        console.log(`🔍 工具列表: http://localhost:${this.port}/mcp/tools`);
        console.log(`💊 健康检查: http://localhost:${this.port}/health`);
        console.log(`📖 API文档: http://localhost:${this.port}/mcp/tools`);
      });
      
    } catch (error) {
      console.error('❌ 启动HTTP MCP服务器时出错:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.server) {
      this.server.close();
      console.log('🛑 HTTP MCP Server 已关闭');
    }
  }
}

export { HTTPMCPServer };

// 如果直接运行此文件，启动服务器
// 直接启动检查
if (require.main === module) {
  const port = parseInt(process.env.HTTP_MCP_PORT || '3001');
  const server = new HTTPMCPServer(port);
  
  // 优雅关闭处理
  process.on('SIGINT', async () => {
    console.log('\n🔄 接收到关闭信号，正在关闭服务器...');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🔄 接收到终止信号，正在关闭服务器...');
    await server.stop();
    process.exit(0);
  });

  server.start().catch(async (error) => {
    console.error('❌ HTTP MCP服务器运行出错:', error);
    await server.stop();
    process.exit(1);
  });
}