/**
 * 数据库服务模块
 * 封装Prisma客户端，提供统一的数据访问接口
 * 现在使用共享数据库包来确保与后端的数据模型一致性
 */
import { prisma as sharedPrisma, PrismaClient, type Prisma, getPrismaClient } from '@devapi/database';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

/**
 * 数据库服务类
 * 管理Prisma客户端实例和数据库连接
 */
export class DatabaseService {
  private static instance: DatabaseService | null = null;
  private prismaClient: PrismaClient | null = null;
  private isConnected = false;

  private constructor() {}

  /**
   * 获取数据库服务单例
   */
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * 初始化数据库连接
   */
  public async initialize(): Promise<void> {
    if (this.isConnected && this.prismaClient) {
      logger.debug('数据库已连接，跳过初始化');
      return;
    }

    try {
      // 使用共享的 Prisma 实例来确保与后端的一致性
      this.prismaClient = sharedPrisma;

      // 设置日志事件监听
      this.prismaClient.$on('query', (e: any) => {
        logger.debug(`数据库查询: ${e.query} | 参数: ${e.params} | 耗时: ${e.duration}ms`);
      });

      this.prismaClient.$on('error', (e: any) => {
        logger.error('数据库错误:', e);
      });

      this.prismaClient.$on('warn', (e: any) => {
        logger.warn('数据库警告:', e);
      });

      // 测试连接
      await this.prismaClient.$connect();
      this.isConnected = true;
      
      logger.info('✅ 数据库连接成功');
    } catch (error) {
      logger.error('❌ 数据库连接失败:', error);
      throw error;
    }
  }

  /**
   * 获取Prisma客户端实例
   */
  public getClient(): PrismaClient {
    if (!this.prismaClient || !this.isConnected) {
      throw new Error('数据库未初始化，请先调用 initialize() 方法');
    }
    return this.prismaClient;
  }

  /**
   * 检查连接状态
   */
  public isInitialized(): boolean {
    return this.isConnected && this.prismaClient !== null;
  }

  /**
   * 关闭数据库连接
   */
  public async disconnect(): Promise<void> {
    if (this.prismaClient && this.isConnected) {
      try {
        await this.prismaClient.$disconnect();
        this.isConnected = false;
        logger.info('🔌 数据库连接已关闭');
      } catch (error) {
        logger.error('关闭数据库连接时出错:', error);
        throw error;
      }
    }
  }

  /**
   * 执行事务
   */
  public async transaction<T>(
    fn: (client: PrismaClient) => Promise<T>,
    options?: {
      timeout?: number;
      isolationLevel?: any;
    }
  ): Promise<T> {
    const client = this.getClient();
    return await client.$transaction(fn, {
      timeout: options?.timeout || config.database.queryTimeout,
      isolationLevel: options?.isolationLevel
    });
  }

  /**
   * 执行原始SQL查询
   */
  public async executeRaw<T = any>(sql: string, ...values: any[]): Promise<T> {
    const client = this.getClient();
    return await client.$queryRawUnsafe(sql, ...values);
  }

  /**
   * 健康检查
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const client = this.getClient();
      await client.$queryRaw`SELECT 1`;
      const latency = Date.now() - startTime;
      
      return {
        status: 'healthy',
        latency
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      return {
        status: 'unhealthy',
        latency,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }
}

/**
 * 导出数据库服务单例
 */
export const databaseService = DatabaseService.getInstance();

/**
 * 导出Prisma客户端获取函数
 * 使用共享数据库包的实例
 */
export { getPrismaClient };