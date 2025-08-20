/**
 * MCP服务器主入口文件
 * 启动DevAPI Manager MCP智能搜索服务器
 */
import { createAndStartServer } from './server/McpServer.js';
import { logger } from './utils/logger.js';
import { config } from './config/index.js';

/**
 * 主函数 - 启动MCP服务器
 */
async function main(): Promise<void> {
  try {
    logger.info('🌟 DevAPI Manager MCP服务器启动中...');
    
    // 创建并启动MCP服务器
    const server = await createAndStartServer({
      name: config.server.name,
      version: config.server.version,
      enableVectorSearch: config.search.enableVectorSearch,
      enableRAG: config.rag.enabled
    });
    
    logger.info('🎉 MCP服务器已成功启动并运行');
    
    // 定期输出服务器状态
    setInterval(() => {
      const info = server.getServerInfo();
      logger.debug(`📊 服务器状态: ${info.status}, 运行时间: ${Math.round((info.uptime || 0) / 1000)}秒`);
    }, 60 * 1000); // 每分钟输出一次
    
  } catch (error) {
    logger.error('❌ MCP服务器启动失败:', error);
    process.exit(1);
  }
}

// 捕获未处理的错误
process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝:', { reason, promise });
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常:', error);
  process.exit(1);
});

// 启动服务器
main().catch((error) => {
  logger.error('主函数执行失败:', error);
  process.exit(1);
});