// 简单的MCP搜索功能测试
console.log('开始测试MCP搜索功能...');

// 模拟MCP客户端调用
const testSearchAPIs = async () => {
  try {
    // 这里我们直接测试RAG服务的功能
    const { apiRAGService } = await import('./dist/apiRAG.js');
    
    console.log('1. 构建API上下文...');
    await apiRAGService.buildAPIContext();
    
    const stats = apiRAGService.getStats();
    console.log('API统计信息:', stats);
    
    console.log('\n2. 测试API搜索...');
    const searchResults = await apiRAGService.searchAPIs('用户登录', {
      includeRelated: true
    });
    
    console.log('搜索结果数量:', searchResults.length);
    searchResults.forEach((result, index) => {
      console.log(`\n结果 ${index + 1}:`);
      console.log(`- API名称: ${result.api.name}`);
      console.log(`- 方法: ${result.api.method}`);
      console.log(`- 路径: ${result.api.path}`);
      console.log(`- 相关性评分: ${result.relevanceScore.toFixed(3)}`);
      console.log(`- 解释: ${result.explanation}`);
      if (result.suggestions.length > 0) {
        console.log(`- 建议: ${result.suggestions.join(', ')}`);
      }
    });
    
    console.log('\n3. 测试项目内搜索...');
    const projectResults = await apiRAGService.searchAPIs('获取', {
      method: 'GET',
      includeRelated: false
    });
    
    console.log('GET方法搜索结果数量:', projectResults.length);
    projectResults.slice(0, 3).forEach((result, index) => {
      console.log(`${index + 1}. ${result.api.method} ${result.api.path} - ${result.api.name}`);
    });
    
    console.log('\n✅ MCP搜索功能测试完成');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
  }
};

// 运行测试
testSearchAPIs();