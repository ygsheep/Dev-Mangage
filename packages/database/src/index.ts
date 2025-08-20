/**
 * DevAPI Manager 共享数据库模块
 * 导出统一的数据库客户端和类型定义
 */

// 导出主要的数据库客户端和类型
export { prisma, PrismaClient, getPrismaClient } from './client.js';
export type { Prisma } from './client.js';

// 导出常用的数据库操作工具
export * as DatabaseUtils from './utils.js';