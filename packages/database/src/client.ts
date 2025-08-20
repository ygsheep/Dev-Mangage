/**
 * 共享数据库客户端
 * 提供统一的 Prisma 客户端实例，供后端和 MCP 服务器使用
 */
import { PrismaClient } from '@prisma/client';

/**
 * 全局 Prisma 客户端类型定义
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * 创建 Prisma 客户端实例
 */
function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

/**
 * 导出的 Prisma 客户端实例
 * 在开发环境中复用全局实例，在生产环境中创建新实例
 */
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

/**
 * 开发环境下将 Prisma 实例存储到全局对象
 */
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * 导出 Prisma 客户端类型
 */
export { PrismaClient };
export type { Prisma } from '@prisma/client';

/**
 * 获取 Prisma 客户端实例的函数
 */
export function getPrismaClient(): PrismaClient {
  return prisma;
}