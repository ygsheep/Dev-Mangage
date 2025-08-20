/**
 * Prisma客户端实例管理模块
 * 现在使用共享的数据库包来保证后端和MCP服务器使用相同的客户端
 */

// 导出共享数据库包的实例和类型
export { prisma, PrismaClient, getPrismaClient } from '@devapi/database';
export type { Prisma } from '@devapi/database';