/**
 * 数据库操作工具函数
 */
import { PrismaClient } from '@prisma/client';

/**
 * 数据库健康检查
 */
export async function healthCheck(prisma: PrismaClient): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * 断开数据库连接
 */
export async function disconnect(prisma: PrismaClient): Promise<void> {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error('Failed to disconnect from database:', error);
  }
}

/**
 * 连接到数据库
 */
export async function connect(prisma: PrismaClient): Promise<void> {
  try {
    await prisma.$connect();
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
}