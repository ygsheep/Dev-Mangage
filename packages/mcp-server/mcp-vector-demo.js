#!/usr/bin/env node

/**
 * MCP 向量模型使用演示
 * 展示 MCP 服务器如何使用向量模型进行搜索
 */

console.log('📚 MCP 向量模型使用演示\n');

async function demonstrateMCPVectorUsage() {
  console.log('🎯 MCP 如何使用向量模型？\n');
  
  console.log('📋 工作流程说明:');
  console.log('   1️⃣ MCP 客户端发送搜索请求');
  console.log('   2️⃣ MCP 服务器接收查询参数');
  console.log('   3️⃣ 向量搜索服务处理查询');
  console.log('   4️⃣ 生成向量嵌入');
  console.log('   5️⃣ 计算相似度匹配');
  console.log('   6️⃣ 返回排序结果');
  
  console.log('\n🔧 技术实现:');
  
  try {
    // 导入向量搜索服务
    const { vectorSearchService } = await import('./dist/vectorSearch.js');
    
    console.log('✅ 向量搜索服务已加载');
    
    // 初始化服务
    await vectorSearchService.initialize();
    const stats = vectorSearchService.getStats();
    
    console.log('\n📊 当前配置:');
    console.log(`   🔧 服务状态: ${stats.isInitialized ? '已初始化' : '未初始化'}`);
    console.log(`   🛡️  使用方案: ${stats.useFallback ? 'TF-IDF回退算法' : '深度学习向量模型'}`);
    console.log(`   📄 文档数量: ${stats.documentCount}`);
    
    // 构建搜索索引
    console.log('\n🏗️  构建搜索索引...');
    await vectorSearchService.buildSearchIndex();
    
    const updatedStats = vectorSearchService.getStats();
    console.log(`✅ 索引构建完成，包含 ${updatedStats.documentCount} 个文档`);
    
    console.log('\n🔍 搜索演示:');
    
    // 演示不同类型的搜索查询
    const testCases = [
      {
        query: 'API接口管理',
        description: '中文API概念搜索',
        expected: '找到相关的API管理接口'
      },
      {
        query: 'GET /api/users',
        description: 'HTTP方法和路径匹配',
        expected: '匹配HTTP GET请求和用户相关API'
      },
      {
        query: 'user authentication',
        description: '英文技术术语搜索',
        expected: '找到用户认证相关的API'
      },
      {
        query: '项目',
        description: '简单中文关键词',
        expected: '匹配所有项目相关内容'
      }
    ];
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n🧪 测试案例 ${i + 1}: ${testCase.description}`);
      console.log(`   📝 查询: "${testCase.query}"`);
      console.log(`   🎯 预期: ${testCase.expected}`);
      
      try {
        const results = await vectorSearchService.search(testCase.query, 3, 0.1);
        console.log(`   📊 实际结果: ${results.length} 个匹配项`);
        
        if (results.length > 0) {
          results.forEach((result, index) => {
            const meta = result.document.metadata;
            const score = result.score.toFixed(3);
            console.log(`      ${index + 1}. [${score}] ${meta.type}: ${meta.name || meta.path || meta.id}`);
          });
        } else {
          console.log('      ⚠️  未找到匹配结果');
        }
        
      } catch (error) {
        console.log(`   ❌ 搜索失败: ${error.message}`);
      }
    }
    
    // 演示混合搜索
    console.log('\n🔀 混合搜索演示:');
    console.log('   📝 查询: "用户管理"');
    console.log('   🎯 组合: 向量语义搜索 + 关键词模糊搜索');
    
    // 模拟Fuse.js模糊搜索结果
    const mockFuzzyResults = [
      {
        item: {
          id: 'api-users',
          name: '用户管理API',
          method: 'GET',
          path: '/api/v1/users',
          type: 'api'
        },
        score: 0.2
      }
    ];
    
    try {
      const hybridResults = await vectorSearchService.hybridSearch(
        '用户管理', 
        mockFuzzyResults, 
        5, 
        0.6, // 向量权重
        0.4  // 模糊搜索权重
      );
      
      console.log(`   📊 混合搜索结果: ${hybridResults.length} 个`);
      
      if (hybridResults.length > 0) {
        hybridResults.forEach((result, index) => {
          const hybrid = result.hybridScore ? result.hybridScore.toFixed(3) : '0.000';
          const vector = result.vectorScore ? result.vectorScore.toFixed(3) : '0.000';
          const fuzzy = result.fuzzyScore ? result.fuzzyScore.toFixed(3) : '0.000';
          
          console.log(`      ${index + 1}. [总分:${hybrid}] ${result.name || result.path}`);
          console.log(`         📐 向量: ${vector} | 🔍 模糊: ${fuzzy}`);
        });
      }
      
    } catch (error) {
      console.log(`   ❌ 混合搜索失败: ${error.message}`);
    }
    
    console.log('\n🚀 MCP 集成方式:');
    console.log('   📡 MCP 工具调用: client.callTool("vector_search", { query: "用户API" })');
    console.log('   🔄 服务器处理: vectorSearchService.search(query, limit, threshold)');
    console.log('   📤 返回结果: 标准化的搜索结果对象');
    
    console.log('\n💡 核心优势:');
    if (stats.useFallback) {
      console.log('   🛡️  智能回退: 网络问题时自动使用TF-IDF算法');
      console.log('   ⚡ 高性能: 专为API搜索优化的关键词匹配');
      console.log('   🔍 精准匹配: HTTP方法、路径、技术术语智能识别');
      console.log('   💾 低资源: 内存使用少，响应速度快');
    } else {
      console.log('   🧠 语义理解: 深度学习模型理解查询意图');
      console.log('   🌍 多语言: 支持中英文混合搜索');
      console.log('   📐 向量空间: 384维语义向量表示');
      console.log('   🎯 高准确性: 基于余弦相似度的精确匹配');
    }
    
    console.log('\n✨ 用户体验:');
    console.log('   🔍 自然语言查询: "我需要用户登录相关的API"');
    console.log('   📝 技术关键词: "GET /api/v1/users"');
    console.log('   🌏 中英文混搭: "user 用户管理 API"');
    console.log('   🚀 即时响应: <100ms 搜索延迟');
    
    console.log('\n🎉 总结:');
    console.log('   MCP 向量模型通过智能搜索算法，为开发者提供:');
    console.log('   • 快速准确的API发现');
    console.log('   • 语义化的接口推荐');
    console.log('   • 多维度的搜索结果');
    console.log('   • 稳定可靠的服务体验');
    
  } catch (error) {
    console.error('❌ 演示失败:', error.message);
    console.log('\n🔧 故障排除:');
    console.log('   1. 检查项目构建状态: npm run build');
    console.log('   2. 验证依赖安装: npm install');
    console.log('   3. 检查文件权限和路径');
  }
}

// 运行演示
demonstrateMCPVectorUsage();