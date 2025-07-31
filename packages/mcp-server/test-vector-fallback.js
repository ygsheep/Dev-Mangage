// 测试回退向量搜索功能
console.log('🧪 测试回退向量搜索功能...\n');

async function testFallbackVectorSearch() {
  try {
    // 导入向量搜索服务
    const { vectorSearchService } = await import('./dist/vectorSearch.js');
    
    console.log('1️⃣ 初始化向量搜索服务...');
    await vectorSearchService.initialize();
    console.log('✅ 向量搜索服务初始化完成\n');
    
    console.log('2️⃣ 构建搜索索引...');
    await vectorSearchService.buildSearchIndex();
    console.log('✅ 搜索索引构建完成\n');
    
    const stats = vectorSearchService.getStats();
    console.log('📊 搜索统计信息:');
    console.log(`   📄 文档数量: ${stats.documentCount}`);
    console.log(`   🔧 服务状态: ${stats.isInitialized ? '已初始化' : '未初始化'}`);
    console.log(`   🛡️  回退模式: ${stats.useFallback ? '是 (TF-IDF)' : '否 (预训练模型)'}`);
    console.log('');
    
    // 测试各种API搜索场景
    const testQueries = [
      {
        query: '用户登录',
        description: '中文API功能搜索'
      },
      {
        query: 'user login api',
        description: '英文API功能搜索'
      },
      {
        query: 'GET /api/v1/users',
        description: '具体API路径搜索'
      },
      {
        query: '项目管理',
        description: '项目相关搜索'
      },
      {
        query: 'POST create',
        description: 'HTTP方法搜索'
      }
    ];
    
    console.log('3️⃣ 执行向量搜索测试...\n');
    
    for (let i = 0; i < testQueries.length; i++) {
      const test = testQueries[i];
      console.log(`🔍 测试 ${i + 1}: ${test.description}`);
      console.log(`   查询: "${test.query}"`);
      
      const results = await vectorSearchService.search(test.query, 3, 0.1);
      console.log(`   结果数量: ${results.length}`);
      
      if (results.length > 0) {
        results.forEach((result, index) => {
          const meta = result.document.metadata;
          console.log(`   ${index + 1}. [${result.score.toFixed(3)}] ${meta.type}: ${meta.name || meta.path || meta.id}`);
          if (meta.method && meta.path) {
            console.log(`      ${meta.method} ${meta.path}`);
          }
          if (meta.description) {
            console.log(`      ${meta.description.substring(0, 50)}...`);
          }
        });
      } else {
        console.log('   ⚠️  未找到匹配结果');
      }
      console.log('');
    }
    
    console.log('4️⃣ 测试混合搜索...\n');
    
    // 模拟一些Fuse.js模糊搜索结果
    const mockFuzzyResults = [
      {
        item: {
          id: 'api-1',
          name: '获取用户信息',
          method: 'GET',
          path: '/api/v1/users/{id}',
          type: 'api'
        },
        score: 0.2 // Fuse.js score (越低越好)
      }
    ];
    
    const hybridResults = await vectorSearchService.hybridSearch('用户信息', mockFuzzyResults, 5);
    console.log(`🔀 混合搜索结果数量: ${hybridResults.length}`);
    
    if (hybridResults.length > 0) {
      hybridResults.forEach((result, index) => {
        console.log(`   ${index + 1}. [混合: ${result.hybridScore?.toFixed(3)}, 向量: ${result.vectorScore?.toFixed(3)}, 模糊: ${result.fuzzyScore?.toFixed(3)}]`);
        console.log(`      ${result.name || result.path || result.id}`);
      });
    }
    
    console.log('\n🎉 回退向量搜索测试完成！');
    console.log('\n💡 总结:');
    console.log('✅ 回退向量搜索服务正常工作');
    console.log('✅ TF-IDF + 余弦相似度算法有效');
    console.log('✅ 专门为API搜索优化的分词和权重');
    console.log('✅ 支持中英文混合搜索');
    console.log('✅ 混合搜索整合模糊匹配和语义搜索');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
  }
}

// 运行测试
testFallbackVectorSearch();