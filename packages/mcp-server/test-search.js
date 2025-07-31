const { spawn } = require('child_process');
const { createWriteStream } = require('fs');

// 测试MCP服务器功能
async function testMCPServer() {
  console.log('启动MCP服务器测试...');
  
  // 启动MCP服务器
  const server = spawn('node', ['dist/index.js'], {
    stdio: ['pipe', 'pipe', 'inherit'],
    cwd: __dirname
  });

  // 测试消息队列
  const testMessages = [
    // 1. 列出可用工具
    JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list"
    }),
    
    // 2. 刷新搜索索引
    JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "refresh_search_index",
        arguments: { force: true }
      }
    }),
    
    // 3. 测试项目搜索
    JSON.stringify({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "search_projects",
        arguments: { query: "API管理", limit: 5 }
      }
    }),
    
    // 4. 测试全局搜索
    JSON.stringify({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "global_search",
        arguments: { query: "用户", types: ["projects", "apis"], limit: 3 }
      }
    }),
    
    // 5. 构建向量索引
    JSON.stringify({
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: "build_vector_index",
        arguments: {}
      }
    }),
    
    // 6. 测试向量搜索 (延迟执行，等待索引构建)
    JSON.stringify({
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: {
        name: "vector_search",
        arguments: { query: "用户登录接口", limit: 5, threshold: 0.3 }
      }
    }),
    
    // 7. 构建API上下文
    JSON.stringify({
      jsonrpc: "2.0",
      id: 7,
      method: "tools/call",
      params: {
        name: "build_api_context",
        arguments: {}
      }
    }),
    
    // 8. 测试RAG API搜索
    JSON.stringify({
      jsonrpc: "2.0",
      id: 8,
      method: "tools/call",
      params: {
        name: "rag_search_apis",
        arguments: { 
          query: "获取用户信息的接口", 
          method: "GET",
          includeRelated: true
        }
      }
    })
  ];

  let messageIndex = 0;
  let responses = [];

  // 处理服务器响应
  server.stdout.on('data', (data) => {
    const response = data.toString();
    console.log(`响应 ${messageIndex}:`, response);
    responses.push(response);
    
    // 发送下一个测试消息
    if (messageIndex < testMessages.length) {
      if (messageIndex === 5) {
        // 向量搜索前等待一会儿让索引构建完成
        setTimeout(() => {
          server.stdin.write(testMessages[messageIndex] + '\n');
          messageIndex++;
        }, 3000);
      } else if (messageIndex === 7) {
        // RAG搜索前等待API上下文构建
        setTimeout(() => {
          server.stdin.write(testMessages[messageIndex] + '\n');
          messageIndex++;
        }, 2000);
      } else {
        setTimeout(() => {
          if (messageIndex < testMessages.length) {
            server.stdin.write(testMessages[messageIndex] + '\n');
            messageIndex++;
          }
        }, 1000);
      }
    } else {
      // 所有测试完成
      setTimeout(() => {
        console.log('所有测试完成，关闭服务器...');
        server.kill();
      }, 2000);
    }
  });

  // 发送第一个消息
  setTimeout(() => {
    server.stdin.write(testMessages[0] + '\n');
    messageIndex++;
  }, 1000);

  server.on('close', (code) => {
    console.log(`MCP服务器测试完成，退出码: ${code}`);
    
    // 保存测试结果
    const logStream = createWriteStream('test-results.json');
    logStream.write(JSON.stringify({
      timestamp: new Date().toISOString(),
      responses: responses,
      exitCode: code
    }, null, 2));
    logStream.end();
    
    console.log('测试结果已保存到 test-results.json');
  });

  server.on('error', (error) => {
    console.error('MCP服务器错误:', error);
  });
}

// 运行测试
if (require.main === module) {
  testMCPServer().catch(console.error);
}

module.exports = { testMCPServer };