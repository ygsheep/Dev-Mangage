// 测试数据库连接
const { PrismaClient } = require('@prisma/client');
const path = require('path');

// 设置数据库路径
const dbPath = path.resolve(__dirname, '../backend/prisma/dev.db');
console.log('数据库路径:', dbPath);

// 创建Prisma客户端
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${dbPath}`
    }
  }
});

async function testConnection() {
  try {
    console.log('尝试连接数据库...');
    const projects = await prisma.project.findMany({
      take: 1
    });
    console.log('数据库连接成功!');
    console.log('项目数量:', projects.length);
    if (projects.length > 0) {
      console.log('示例项目:', projects[0].name);
    }
  } catch (error) {
    console.error('数据库连接失败:', error.message);
    console.error('错误详情:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();