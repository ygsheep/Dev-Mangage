/**
 * Prisma客户端实例管理模块
 * 负责创建和管理全局的Prisma数据库客户端实例，确保在开发环境中复用连接
 */

import { PrismaClient } from '@prisma/client'

/**
 * 全局Prisma客户端类型定义
 * 用于在globalThis对象上存储Prisma客户端实例，避免热重载时重复创建连接
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * 导出的Prisma客户端实例
 * 在开发环境中复用全局实例，在生产环境中创建新实例
 * 这种模式可以避免在Next.js等支持热重载的环境中创建过多数据库连接
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient()

/**
 * 开发环境下将Prisma实例存储到全局对象
 * 确保在代码热重载时能够复用现有的数据库连接，避免连接池耗尽
 */
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma