#!/usr/bin/env node

/**
 * 向量模型下载脚本
 * 用于预下载和缓存向量搜索模型
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// 推荐的模型列表（按API管理项目适用性排序）
const RECOMMENDED_MODELS = [
  {
    name: 'Xenova/all-MiniLM-L6-v2',
    description: '轻量英文模型 - 最适合API文档和技术内容',
    size: '~23MB',
    priority: 1,
    strengths: ['API路径匹配', '技术术语理解', '代码相关文本'],
    useCase: 'API接口名称、路径、参数搜索'
  },
  {
    name: 'Xenova/multilingual-e5-small', 
    description: '多语言小模型 - 支持中英文混合',
    size: '~118MB',
    priority: 2,
    strengths: ['中英文混合', 'API描述文本', '多语言支持'],
    useCase: '中文API描述、混合语言文档搜索'
  },
  {
    name: 'Xenova/all-MiniLM-L12-v2',
    description: '中等英文模型 - 更好的语义理解', 
    size: '~34MB',
    priority: 3,
    strengths: ['深度语义理解', '复杂查询', '上下文匹配'],
    useCase: '复杂API文档搜索、语义相似度匹配'
  }
];

function displayModelInfo() {
  console.log('\n🎯 推荐模型 (按API管理项目适用性排序)\n');
  
  RECOMMENDED_MODELS.forEach((model, index) => {
    console.log(`${index + 1}. ${model.name}`);
    console.log(`   📄 ${model.description}`);
    console.log(`   📦 大小: ${model.size}`);
    console.log(`   🎯 适用场景: ${model.useCase}`);
    console.log(`   💪 优势: ${model.strengths.join(', ')}`);
    console.log('');
  });
}

function checkProxy() {
  const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy;
  const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  
  console.log('🔍 代理配置检查:');
  console.log(`   HTTP_PROXY: ${httpProxy || '未设置'}`);
  console.log(`   HTTPS_PROXY: ${httpsProxy || '未设置'}`);
  
  if (!httpProxy && !httpsProxy) {
    console.log('   ⚠️  未检测到代理配置，如果网络受限请配置代理');
    console.log('   💡 配置方法: 运行 setup-proxy.bat');
  } else {
    console.log('   ✅ 已检测到代理配置');
  }
  console.log('');
}

function testNetworkConnectivity() {
  console.log('🌐 测试网络连接...');
  
  return new Promise((resolve) => {
    const testUrls = [
      'https://huggingface.co',
      'https://hf-mirror.com'
    ];
    
    let completedTests = 0;
    const results = {};
    
    testUrls.forEach(url => {
      const protocol = url.startsWith('https:') ? https : http;
      const request = protocol.get(url, { timeout: 5000 }, (res) => {
        results[url] = res.statusCode < 400;
        completedTests++;
        if (completedTests === testUrls.length) {
          displayNetworkResults(results);
          resolve(results);
        }
      });
      
      request.on('error', () => {
        results[url] = false;
        completedTests++;
        if (completedTests === testUrls.length) {
          displayNetworkResults(results);
          resolve(results);
        }
      });
      
      request.setTimeout(5000, () => {
        request.destroy();
        results[url] = false;
        completedTests++;
        if (completedTests === testUrls.length) {
          displayNetworkResults(results);
          resolve(results);
        }
      });
    });
  });
}

function displayNetworkResults(results) {
  console.log('📊 网络连接测试结果:');
  Object.entries(results).forEach(([url, success]) => {
    console.log(`   ${success ? '✅' : '❌'} ${url}`);
  });
  
  const hasConnection = Object.values(results).some(result => result);
  if (!hasConnection) {
    console.log('\n⚠️  网络连接问题，建议:');
    console.log('   1. 检查网络连接');
    console.log('   2. 配置代理服务器');
    console.log('   3. 使用镜像源');
  }
  console.log('');
}

async function downloadModel(modelName) {
  console.log(`📥 开始下载模型: ${modelName}`);
  
  try {
    // 使用transformers.js来下载和缓存模型
    const { pipeline } = await import('@xenova/transformers');
    
    console.log('🔧 初始化pipeline...');
    const encoder = await pipeline('feature-extraction', modelName, {
      quantized: true,
      progress_callback: (progress) => {
        if (progress.status === 'downloading') {
          const percent = Math.round(progress.progress || 0);
          console.log(`   📥 ${progress.name}: ${percent}%`);
        } else if (progress.status === 'loading') {
          console.log(`   🔧 加载: ${progress.name}`);
        }
      }
    });
    
    console.log(`✅ 模型 ${modelName} 下载完成！`);
    
    // 测试模型
    console.log('🧪 测试模型...');
    const testResult = await encoder('API接口测试', { pooling: 'mean', normalize: true });
    console.log(`   向量维度: ${testResult.data.length}`);
    console.log(`✅ 模型测试通过！`);
    
    return true;
  } catch (error) {
    console.error(`❌ 模型 ${modelName} 下载失败:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 DevAPI Manager 向量模型下载工具\n');
  
  // 显示模型信息
  displayModelInfo();
  
  // 检查代理配置
  checkProxy();
  
  // 测试网络连接
  const networkResults = await testNetworkConnectivity();
  
  // 如果没有网络连接，退出
  const hasConnection = Object.values(networkResults).some(result => result);
  if (!hasConnection) {
    console.log('❌ 无法连接到模型下载源，请检查网络配置后重试');
    process.exit(1);
  }
  
  console.log('🎯 推荐下载顺序 (根据API管理项目需求):');
  console.log('1. all-MiniLM-L6-v2 (首选，轻量且专精API内容)');
  console.log('2. multilingual-e5-small (如需中英混合支持)');
  console.log('3. all-MiniLM-L12-v2 (如需更强语义理解)\n');
  
  // 询问用户要下载哪个模型
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('请选择要下载的模型 (1-3, 或 a 下载全部): ', async (answer) => {
    let modelsToDownload = [];
    
    if (answer.toLowerCase() === 'a') {
      modelsToDownload = RECOMMENDED_MODELS;
    } else {
      const index = parseInt(answer) - 1;
      if (index >= 0 && index < RECOMMENDED_MODELS.length) {
        modelsToDownload = [RECOMMENDED_MODELS[index]];
      } else {
        console.log('❌ 无效选择');
        rl.close();
        return;
      }
    }
    
    console.log(`\n📦 准备下载 ${modelsToDownload.length} 个模型...\n`);
    
    let successCount = 0;
    for (const model of modelsToDownload) {
      const success = await downloadModel(model.name);
      if (success) successCount++;
    }
    
    console.log(`\n🎉 下载完成！成功: ${successCount}/${modelsToDownload.length}`);
    
    if (successCount > 0) {
      console.log('\n✅ 模型已缓存，向量搜索服务现在可以离线使用');
      console.log('🚀 运行 npm run dev 启动MCP服务器测试向量搜索功能');
    }
    
    rl.close();
  });
}

// 运行主程序
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { RECOMMENDED_MODELS, downloadModel };