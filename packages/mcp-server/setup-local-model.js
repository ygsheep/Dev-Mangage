#!/usr/bin/env node

/**
 * 本地模型设置脚本
 * 配置已下载的model_q4f16.onnx文件供Transformers.js使用
 */

const fs = require('fs');
const path = require('path');

const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';
const CACHE_DIR = path.join(__dirname, '.cache', 'transformers');
const MODEL_CACHE_DIR = path.join(CACHE_DIR, MODEL_NAME);
const LOCAL_MODEL_FILE = path.join(__dirname, 'models', 'model_q4f16.onnx');

async function setupLocalModel() {
  console.log('🔧 配置本地向量模型...\n');
  
  // 检查本地模型文件
  if (!fs.existsSync(LOCAL_MODEL_FILE)) {
    console.error('❌ 本地模型文件不存在:', LOCAL_MODEL_FILE);
    console.log('💡 请确保已下载 model_q4f16.onnx 到 models/ 目录');
    process.exit(1);
  }
  
  const stats = fs.statSync(LOCAL_MODEL_FILE);
  console.log('✅ 检测到本地模型文件:');
  console.log(`   📄 路径: ${LOCAL_MODEL_FILE}`);
  console.log(`   📦 大小: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);
  console.log(`   📅 修改时间: ${stats.mtime.toLocaleString()}`);
  console.log('');
  
  // 创建缓存目录结构
  try {
    console.log('📁 创建缓存目录结构...');
    
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      console.log(`   ✅ 创建: ${CACHE_DIR}`);
    }
    
    if (!fs.existsSync(MODEL_CACHE_DIR)) {
      fs.mkdirSync(MODEL_CACHE_DIR, { recursive: true });
      console.log(`   ✅ 创建: ${MODEL_CACHE_DIR}`);
    }
    
    // 复制模型文件到缓存目录
    const targetModelFile = path.join(MODEL_CACHE_DIR, 'model_quantized.onnx');
    
    console.log('📋 复制模型文件到缓存...');
    fs.copyFileSync(LOCAL_MODEL_FILE, targetModelFile);
    console.log(`   ✅ 复制: ${LOCAL_MODEL_FILE} → ${targetModelFile}`);
    
    // 创建模型配置文件 (简化版)
    const modelConfig = {
      model_type: "bert",
      quantized: true,
      local_model: true,
      source_file: LOCAL_MODEL_FILE
    };
    
    const configFile = path.join(MODEL_CACHE_DIR, 'config.json');
    fs.writeFileSync(configFile, JSON.stringify(modelConfig, null, 2));
    console.log(`   ✅ 创建配置: ${configFile}`);
    
    console.log('\n🎉 本地模型配置完成！');
    console.log('\n📊 模型信息:');
    console.log('   🏷️  模型名称: all-MiniLM-L6-v2');
    console.log('   📦 量化版本: Q4F16 (30MB)');
    console.log('   🎯 优化类型: API文档和技术内容搜索');
    console.log('   💾 缓存位置: .cache/transformers/');
    
    console.log('\n🚀 测试建议:');
    console.log('   1. 运行 npm run dev 启动MCP服务器');
    console.log('   2. 运行 node test-vector-fallback.js 测试搜索功能');
    console.log('   3. 检查向量搜索是否使用本地模型');
    
    console.log('\n💡 注意:');
    console.log('   - 当前配置为实验性功能');
    console.log('   - 如果本地模型加载失败，系统会自动降级到回退方案');
    console.log('   - 回退方案(TF-IDF)同样经过API搜索优化，性能良好');
    
  } catch (error) {
    console.error('❌ 配置过程中出错:', error.message);
    process.exit(1);
  }
}

// 运行配置
if (require.main === module) {
  setupLocalModel().catch(console.error);
}

module.exports = { setupLocalModel };