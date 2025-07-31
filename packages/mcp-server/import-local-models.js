#!/usr/bin/env node

/**
 * 本地模型导入脚本
 * 将下载的完整模型文件夹导入到 Transformers.js 缓存结构中
 */

const fs = require('fs');
const path = require('path');

const MODELS_DIR = path.join(__dirname, 'models');
const CACHE_DIR = path.join(__dirname, '.cache', 'transformers');
const MODEL_NAME = 'all-MiniLM-L6-v2';
const LOCAL_MODEL_DIR = path.join(MODELS_DIR, MODEL_NAME);
const CACHE_MODEL_DIR = path.join(CACHE_DIR, 'Xenova', MODEL_NAME);

async function importLocalModels() {
  console.log('🚀 导入本地向量模型...\n');
  
  // 检查本地模型目录
  if (!fs.existsSync(LOCAL_MODEL_DIR)) {
    console.error('❌ 本地模型目录不存在:', LOCAL_MODEL_DIR);
    console.log('💡 请确保已下载完整的 all-MiniLM-L6-v2 文件夹到 models/ 目录');
    process.exit(1);
  }
  
  // 列出所有模型文件
  console.log('📁 检测到的模型文件:');
  const files = fs.readdirSync(LOCAL_MODEL_DIR, { recursive: true });
  files.forEach(file => {
    const filePath = path.join(LOCAL_MODEL_DIR, file);
    if (fs.statSync(filePath).isFile()) {
      const stats = fs.statSync(filePath);
      console.log(`   📄 ${file} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);
    }
  });
  console.log('');
  
  // 检查必要文件
  const requiredFiles = [
    'config.json',
    'tokenizer.json',
    'tokenizer_config.json',
    'vocab.txt',
    'onnx/model_q4f16.onnx'
  ];
  
  console.log('🔍 验证必要文件:');
  let allFilesPresent = true;
  
  for (const file of requiredFiles) {
    const filePath = path.join(LOCAL_MODEL_DIR, file);
    if (fs.existsSync(filePath)) {
      console.log(`   ✅ ${file}`);
    } else {
      console.log(`   ❌ ${file} (缺失)`);
      allFilesPresent = false;
    }
  }
  
  if (!allFilesPresent) {
    console.error('\n❌ 模型文件不完整，请重新下载');
    process.exit(1);
  }
  
  console.log('\n✅ 所有必要文件都存在！');
  
  // 创建缓存目录结构
  try {
    console.log('\n📁 创建缓存目录结构...');
    
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      console.log(`   ✅ 创建: ${CACHE_DIR}`);
    }
    
    const xenovaDir = path.join(CACHE_DIR, 'Xenova');
    if (!fs.existsSync(xenovaDir)) {
      fs.mkdirSync(xenovaDir, { recursive: true });
      console.log(`   ✅ 创建: ${xenovaDir}`);
    }
    
    if (!fs.existsSync(CACHE_MODEL_DIR)) {
      fs.mkdirSync(CACHE_MODEL_DIR, { recursive: true });
      console.log(`   ✅ 创建: ${CACHE_MODEL_DIR}`);
    }
    
  } catch (error) {
    console.error('❌ 创建目录失败:', error.message);
    process.exit(1);
  }
  
  // 复制所有模型文件
  console.log('\n📋 复制模型文件到缓存目录...');
  
  try {
    // 复制配置文件
    const configFiles = ['config.json', 'tokenizer.json', 'tokenizer_config.json', 'vocab.txt', 'special_tokens_map.json'];
    
    for (const file of configFiles) {
      const srcPath = path.join(LOCAL_MODEL_DIR, file);
      const destPath = path.join(CACHE_MODEL_DIR, file);
      
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`   ✅ ${file}`);
      }
    }
    
    // 复制ONNX模型文件
    const onnxSrcPath = path.join(LOCAL_MODEL_DIR, 'onnx', 'model_q4f16.onnx');
    const onnxDestPath = path.join(CACHE_MODEL_DIR, 'model_quantized.onnx');
    
    if (fs.existsSync(onnxSrcPath)) {
      fs.copyFileSync(onnxSrcPath, onnxDestPath);
      console.log(`   ✅ onnx/model_q4f16.onnx → model_quantized.onnx`);
    }
    
    // 复制README
    const readmeSrc = path.join(LOCAL_MODEL_DIR, 'README.md');
    const readmeDest = path.join(CACHE_MODEL_DIR, 'README.md');
    if (fs.existsSync(readmeSrc)) {
      fs.copyFileSync(readmeSrc, readmeDest);
      console.log(`   ✅ README.md`);
    }
    
  } catch (error) {
    console.error('❌ 复制文件失败:', error.message);
    process.exit(1);
  }
  
  // 验证导入结果
  console.log('\n🔍 验证导入结果...');
  const cacheFiles = fs.readdirSync(CACHE_MODEL_DIR);
  console.log(`   📄 缓存文件数量: ${cacheFiles.length}`);
  
  cacheFiles.forEach(file => {
    const filePath = path.join(CACHE_MODEL_DIR, file);
    const stats = fs.statSync(filePath);
    if (stats.isFile()) {
      console.log(`   📋 ${file} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);
    }
  });
  
  console.log('\n🎉 本地模型导入完成！');
  
  // 显示模型信息
  try {
    const configPath = path.join(CACHE_MODEL_DIR, 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    console.log('\n📊 模型信息:');
    console.log(`   🏷️  模型类型: ${config.model_type || 'bert'}`);
    console.log(`   📐 向量维度: ${config.hidden_size || 384}`);
    console.log(`   📝 词汇表大小: ${config.vocab_size || 30522}`);
    console.log(`   🔢 最大序列长度: ${config.max_position_embeddings || 512}`);
    console.log(`   ⚡ 量化版本: Q4F16 (高性能)`);
    
  } catch (error) {
    console.log('   ⚠️ 无法读取模型配置');
  }
  
  console.log('\n🚀 测试建议:');
  console.log('   1. 运行 npm run build 重新构建项目');
  console.log('   2. 运行 node test-local-model.js 测试本地模型');
  console.log('   3. 运行 npm run dev 启动MCP服务器');
  console.log('   4. 检查向量搜索是否使用本地模型');
  
  console.log('\n✨ 优势:');
  console.log('   🚀 完全离线运行 (不需要网络下载)');
  console.log('   ⚡ 加载速度更快 (本地文件)');
  console.log('   🎯 专为API搜索优化');
  console.log('   💾 内存使用优化 (Q4F16量化)');
  
  console.log('\n💡 注意:');
  console.log('   - 模型已导入到 Transformers.js 标准缓存位置');
  console.log('   - 系统会优先使用本地缓存的模型');
  console.log('   - 如果加载失败会自动降级到回退方案');
}

// 运行导入
if (require.main === module) {
  importLocalModels().catch(console.error);
}

module.exports = { importLocalModels };