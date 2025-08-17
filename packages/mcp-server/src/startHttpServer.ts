#!/usr/bin/env tsx

import { HTTPMCPServer } from './httpServer.js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

/**
 * HTTP MCP 服务器启动脚本
 * 提供基于 HTTP 的 MCP 工具访问接口
 */
async function startHTTPMCPServer() {
  console.log('🚀 启动 HTTP MCP 服务器...');
  console.log('📋 服务信息:');
  console.log('   • 协议: HTTP REST API');
  console.log('   • 端口: 3001 (可通过 HTTP_MCP_PORT 环境变量配置)');
  console.log('   • 功能: 12个 MCP 工具的 HTTP 接口');
  console.log('   • 兼容: 支持直接 URL 连接');
  console.log('');
  
  const port = parseInt(process.env.HTTP_MCP_PORT || '3001');
  const server = new HTTPMCPServer(port);
  
  try {
    await server.start();
    
    console.log('');
    console.log('🎉 HTTP MCP 服务器启动成功！');
    console.log('');
    console.log('📖 使用指南:');
    console.log(`   • 健康检查: curl http://localhost:${port}/health`);
    console.log(`   • 工具列表: curl http://localhost:${port}/mcp/tools`);
    console.log(`   • 搜索项目: curl -X POST http://localhost:${port}/mcp/tools/search_projects \\`);
    console.log('                    -H "Content-Type: application/json" \\');
    console.log('                    -d \'{"arguments":{"query":"API管理"}}\'');
    console.log(`   • 向量搜索: curl -X POST http://localhost:${port}/mcp/tools/vector_search \\`);
    console.log('                    -H "Content-Type: application/json" \\');
    console.log('                    -d \'{"arguments":{"query":"用户认证"}}\'');
    console.log('');
    console.log('🔧 前端集成:');
    console.log('   const response = await fetch(\'http://localhost:3001/mcp/tools/global_search\', {');
    console.log('     method: \'POST\',');
    console.log('     headers: { \'Content-Type\': \'application/json\' },');
    console.log('     body: JSON.stringify({ arguments: { query: \'用户API\' } })');
    console.log('   });');
    console.log('');
    console.log('⚡ 可用工具:');
    console.log('   1. search_projects    - 项目搜索');
    console.log('   2. search_apis        - API接口搜索');
    console.log('   3. global_search      - 全局搜索');
    console.log('   4. vector_search      - 向量语义搜索');
    console.log('   5. hybrid_search      - 混合搜索');
    console.log('   6. rag_search_apis    - RAG增强API搜索');
    console.log('');
    console.log('🌐 服务器运行中，按 Ctrl+C 停止...');
    
  } catch (error) {
    console.error('❌ 启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭处理
process.on('SIGINT', () => {
  console.log('\n👋 正在关闭服务器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 正在关闭服务器...');
  process.exit(0);
});

// 启动服务器
startHTTPMCPServer().catch(console.error);