/**
 * MCP服务器主入口文件
 * 启动DevAPI Manager MCP智能搜索服务器
 */
import { createAndStartServer } from './server/McpServer.js';
import { config } from './config/index.js';

/**
 * 为STDIO模式禁用控制台输出，防止干扰MCP协议
 */
function disableConsoleForStdio(): void {
  // 检测是否运行在STDIO模式（没有HTTP_MCP_PORT环境变量）
  const isStdioMode = !process.env.HTTP_MCP_PORT;
  
  if (isStdioMode) {
    // 重定向所有控制台输出到stderr，保持stdout纯净用于MCP协议
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleInfo = console.info;
    
    console.log = (...args: any[]) => {
      // 在STDIO模式下，将普通日志重定向到stderr
      process.stderr.write(`LOG: ${args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ')}\n`);
    };
    
    console.error = (...args: any[]) => {
      process.stderr.write(`ERROR: ${args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ')}\n`);
    };
    
    console.warn = (...args: any[]) => {
      process.stderr.write(`WARN: ${args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ')}\n`);
    };
    
    console.info = (...args: any[]) => {
      process.stderr.write(`INFO: ${args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ')}\n`);
    };
  }
}

/**
 * 主函数 - 启动MCP服务器
 */
async function main(): Promise<void> {
  try {
    // 首先禁用控制台输出以保证STDIO模式兼容性
    disableConsoleForStdio();
    
    // 创建并启动MCP服务器
    const server = await createAndStartServer({
      name: config.server.name,
      version: config.server.version,
      enableVectorSearch: config.search.enableVectorSearch,
      enableRAG: config.rag.enabled
    });
    
    // 在STDIO模式下不输出任何额外日志，避免干扰协议
    if (process.env.HTTP_MCP_PORT) {
      console.log('MCP服务器已成功启动并运行');
      
      // 定期输出服务器状态（仅HTTP模式）
      setInterval(() => {
        const info = server.getServerInfo();
        console.log(`服务器状态: ${info.status}, 运行时间: ${Math.round((info.uptime || 0) / 1000)}秒`);
      }, 60 * 1000);
    }
    
  } catch (error) {
    process.stderr.write(`ERROR: MCP服务器启动失败: ${error}\n`);
    process.exit(1);
  }
}

// 捕获未处理的错误
process.on('unhandledRejection', (reason, promise) => {
  process.stderr.write(`ERROR: 未处理的Promise拒绝: ${reason}\n`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  process.stderr.write(`ERROR: 未捕获的异常: ${error}\n`);
  process.exit(1);
});

// 启动服务器
main().catch((error) => {
  process.stderr.write(`ERROR: 主函数执行失败: ${error}\n`);
  process.exit(1);
});