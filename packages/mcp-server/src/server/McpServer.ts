/**
 * MCP服务器主类
 * 统一管理服务器生命周期、工具注册和请求处理
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { config, printConfigInfo } from '../config/index.js';
import { databaseService } from '../database/index.js';
import { logger } from '../utils/logger.js';
import { handleError, ErrorStats } from '../utils/errors.js';
import { toolManager, ToolManager } from '../tools/ToolManager.js';
import { searchTools } from '../tools/SearchTools.js';
import { projectSearchService } from '../services/ProjectSearchService.js';
import { apiEndpointSearchService } from '../services/ApiEndpointSearchService.js';

/**
 * MCP服务器配置接口
 */
export interface McpServerOptions {
  /** 服务器名称 */
  name?: string;
  /** 服务器版本 */
  version?: string;
  /** 是否启用向量搜索 */
  enableVectorSearch?: boolean;
  /** 是否启用RAG功能 */
  enableRAG?: boolean;
}

/**
 * 服务状态枚举
 */
export enum ServerStatus {
  STOPPED = 'stopped',
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  ERROR = 'error'
}

/**
 * MCP服务器主类
 */
export class McpServer {
  private server: Server;
  private status: ServerStatus = ServerStatus.STOPPED;
  private startTime?: Date;
  private shutdownHandlers: Array<() => Promise<void>> = [];

  constructor(private options: McpServerOptions = {}) {
    // 创建MCP服务器实例
    this.server = new Server(
      {
        name: options.name || config.server.name,
        version: options.version || config.server.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupErrorHandling();
    this.setupRequestHandlers();
  }

  /**
   * 启动服务器
   */
  public async start(): Promise<void> {
    if (this.status !== ServerStatus.STOPPED) {
      throw new Error(`服务器状态不正确: ${this.status}`);
    }

    this.status = ServerStatus.STARTING;
    logger.info('🚀 启动MCP服务器...');
    
    try {
      // 打印配置信息
      printConfigInfo();

      // 初始化数据库
      logger.info('📊 初始化数据库连接...');
      await databaseService.initialize();

      // 注册工具
      logger.info('🔧 注册MCP工具...');
      this.registerTools();

      // 初始化搜索服务
      logger.info('🔍 初始化搜索服务...');
      await this.initializeSearchServices();

      // 设置传输层并连接
      logger.info('🌐 启动MCP传输层...');
      const transport = new StdioServerTransport();
      await this.server.connect(transport);

      this.status = ServerStatus.RUNNING;
      this.startTime = new Date();

      // 启动后台任务
      this.startBackgroundTasks();

      logger.info('✅ MCP服务器启动成功');
      logger.info(`📈 服务状态: ${this.getServerInfo().status}`);

    } catch (error) {
      this.status = ServerStatus.ERROR;
      logger.error('❌ MCP服务器启动失败:', error);
      throw handleError(error);
    }
  }

  /**
   * 停止服务器
   */
  public async stop(): Promise<void> {
    if (this.status === ServerStatus.STOPPED || this.status === ServerStatus.STOPPING) {
      return;
    }

    this.status = ServerStatus.STOPPING;
    logger.info('🛑 正在停止MCP服务器...');

    try {
      // 执行关闭处理器
      await Promise.all(this.shutdownHandlers.map(handler => handler()));

      // 关闭搜索服务
      await projectSearchService.shutdown();
      await apiEndpointSearchService.shutdown();

      // 关闭数据库连接
      await databaseService.disconnect();

      // 关闭MCP服务器
      await this.server.close();

      this.status = ServerStatus.STOPPED;
      logger.info('✅ MCP服务器已停止');

    } catch (error) {
      this.status = ServerStatus.ERROR;
      logger.error('❌ 停止MCP服务器时出错:', error);
      throw handleError(error);
    }
  }

  /**
   * 获取服务器信息
   */
  public getServerInfo(): {
    name: string;
    version: string;
    status: ServerStatus;
    uptime?: number;
    startTime?: string;
    toolCount: number;
    toolStats: any;
    errorStats: any;
  } {
    return {
      name: config.server.name,
      version: config.server.version,
      status: this.status,
      uptime: this.startTime ? Date.now() - this.startTime.getTime() : undefined,
      startTime: this.startTime?.toISOString(),
      toolCount: toolManager.getToolDefinitions().length,
      toolStats: toolManager.getToolStats(),
      errorStats: ErrorStats.getStats()
    };
  }

  /**
   * 健康检查
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    try {
      // 检查各个组件的健康状态
      const [
        databaseHealth,
        toolManagerHealth,
        projectSearchHealth,
        endpointSearchHealth
      ] = await Promise.all([
        databaseService.healthCheck(),
        Promise.resolve(toolManager.getHealthStatus()),
        projectSearchService.healthCheck(),
        apiEndpointSearchService.healthCheck()
      ]);

      // 计算总体健康状态
      const components = [databaseHealth, toolManagerHealth, projectSearchHealth, endpointSearchHealth];
      const unhealthyCount = components.filter(c => c.status === 'unhealthy').length;
      const degradedCount = components.filter(c => c.status === 'degraded').length;

      let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (unhealthyCount > 0) {
        overallStatus = 'unhealthy';
      } else if (degradedCount > 0) {
        overallStatus = 'degraded';
      }

      return {
        status: overallStatus,
        details: {
          server: {
            status: this.status,
            uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0
          },
          database: databaseHealth,
          toolManager: toolManagerHealth,
          projectSearch: projectSearchHealth,
          endpointSearch: endpointSearchHealth,
          summary: {
            totalComponents: components.length,
            healthyComponents: components.filter(c => c.status === 'healthy').length,
            degradedComponents: degradedCount,
            unhealthyComponents: unhealthyCount
          }
        }
      };
    } catch (error) {
      logger.error('健康检查失败:', error);
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

  /**
   * 添加关闭处理器
   */
  public addShutdownHandler(handler: () => Promise<void>): void {
    this.shutdownHandlers.push(handler);
  }

  /**
   * 设置错误处理
   */
  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      logger.error('MCP服务器错误:', error);
      ErrorStats.record(error);
    };

    // 进程信号处理
    process.on('SIGINT', this.handleShutdownSignal.bind(this));
    process.on('SIGTERM', this.handleShutdownSignal.bind(this));
    
    // 未捕获异常处理
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('未处理的Promise拒绝:', { reason, promise });
      ErrorStats.record(reason);
    });

    process.on('uncaughtException', (error) => {
      logger.error('未捕获的异常:', error);
      ErrorStats.record(error);
      
      // 记录错误后优雅关闭
      this.handleShutdownSignal().then(() => {
        process.exit(1);
      });
    });
  }

  /**
   * 设置请求处理器
   */
  private setupRequestHandlers(): void {
    // 列举工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: toolManager.getToolDefinitions()
    }));

    // 调用工具
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const startTime = Date.now();
      
      try {
        const result = await toolManager.executeTool(
          request.params.name,
          request.params.arguments || {},
          {
            requestId: 'id' in request ? String((request as any).id) : undefined
          }
        );

        const executionTime = Date.now() - startTime;
        logger.debug(`工具 ${request.params.name} 执行完成，耗时: ${executionTime}ms`);

        return result;
      } catch (error) {
        const executionTime = Date.now() - startTime;
        logger.error(`工具 ${request.params.name} 执行失败，耗时: ${executionTime}ms:`, error);
        
        ErrorStats.record(error);
        throw handleError(error);
      }
    });
  }

  /**
   * 注册工具
   */
  private registerTools(): void {
    // 注册搜索工具
    toolManager.registerTools(searchTools);
    
    logger.info(`✅ 已注册 ${Object.keys(searchTools).length} 个搜索工具`);

    // TODO: 可以在这里注册其他工具集
    // toolManager.registerTools(vectorSearchTools);
    // toolManager.registerTools(ragTools);
  }

  /**
   * 初始化搜索服务
   */
  private async initializeSearchServices(): Promise<void> {
    const initPromises: Promise<void>[] = [];

    // 初始化项目搜索服务
    initPromises.push(
      projectSearchService.initialize().catch(error => {
        logger.warn('项目搜索服务初始化失败，将使用降级功能:', error);
      })
    );

    // 初始化API端点搜索服务
    initPromises.push(
      apiEndpointSearchService.initialize().catch(error => {
        logger.warn('API端点搜索服务初始化失败，将使用降级功能:', error);
      })
    );

    // TODO: 初始化向量搜索服务
    if (this.options.enableVectorSearch && config.search.enableVectorSearch) {
      // initPromises.push(vectorSearchService.initialize());
    }

    // TODO: 初始化RAG服务
    if (this.options.enableRAG && config.rag.enabled) {
      // initPromises.push(ragService.initialize());
    }

    await Promise.allSettled(initPromises);
  }

  /**
   * 启动后台任务
   */
  private startBackgroundTasks(): void {
    // 定期清理过期缓存
    setInterval(() => {
      try {
        toolManager.clearCache();
        logger.debug('定期缓存清理完成');
      } catch (error) {
        logger.error('定期缓存清理失败:', error);
      }
    }, 30 * 60 * 1000); // 30分钟

    // 定期清理错误统计
    setInterval(() => {
      try {
        const stats = ErrorStats.getStats();
        if (stats.totalErrors > 1000) {
          ErrorStats.reset();
          logger.info('错误统计已重置');
        }
      } catch (error) {
        logger.error('错误统计清理失败:', error);
      }
    }, 60 * 60 * 1000); // 1小时

    // 定期健康检查
    setInterval(async () => {
      try {
        const health = await this.healthCheck();
        if (health.status !== 'healthy') {
          logger.warn('健康检查发现问题:', health.details);
        }
      } catch (error) {
        logger.error('定期健康检查失败:', error);
      }
    }, 5 * 60 * 1000); // 5分钟

    logger.debug('✅ 后台任务已启动');
  }

  /**
   * 处理关闭信号
   */
  private async handleShutdownSignal(): Promise<void> {
    logger.info('📥 接收到关闭信号，正在优雅关闭服务器...');
    
    try {
      await this.stop();
      process.exit(0);
    } catch (error) {
      logger.error('优雅关闭失败:', error);
      process.exit(1);
    }
  }
}

/**
 * 创建并启动MCP服务器
 */
export async function createAndStartServer(options: McpServerOptions = {}): Promise<McpServer> {
  const server = new McpServer(options);
  await server.start();
  return server;
}