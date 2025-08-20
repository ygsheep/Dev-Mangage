#!/usr/bin/env node

/**
 * DevAPI Manager 修复验证测试脚本
 * 验证所有已修复的问题是否正常工作
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

console.log('🧪 DevAPI Manager 修复验证测试');
console.log('==========================================');

async function testAPIConnection() {
  console.log('\n📡 测试API连接...');
  
  try {
    // 测试后端健康检查
    const response = await axios.get('http://localhost:3000/health', {
      timeout: 5000
    });
    
    console.log('✅ 后端服务器连接成功');
    console.log(`  - 状态: ${response.status}`);
    console.log(`  - 响应: ${JSON.stringify(response.data, null, 2)}`);
    return true;
  } catch (error) {
    console.log('❌ 后端服务器连接失败');
    console.log(`  - 错误: ${error.message}`);
    return false;
  }
}

async function testProjectsAPI() {
  console.log('\n📋 测试项目API...');
  
  try {
    const response = await axios.get('http://localhost:3000/api/v1/projects', {
      timeout: 5000
    });
    
    console.log('✅ 项目API连接成功');
    console.log(`  - 状态: ${response.status}`);
    console.log(`  - 项目数量: ${response.data?.data?.projects?.length || 0}`);
    return true;
  } catch (error) {
    console.log('❌ 项目API连接失败');
    console.log(`  - 错误: ${error.message}`);
    return false;
  }
}

function testFrontendBuild() {
  console.log('\n🏗️ 测试前端构建...');
  
  const frontendDistPath = path.join(__dirname, 'packages/frontend/dist');
  const indexPath = path.join(frontendDistPath, 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    console.log('❌ 前端构建文件不存在');
    return false;
  }
  
  const htmlContent = fs.readFileSync(indexPath, 'utf8');
  const hasRelativePaths = htmlContent.includes('./assets/');
  const hasAbsolutePaths = htmlContent.includes('/assets/') && !htmlContent.includes('./assets/');
  
  console.log('✅ 前端构建文件检查通过');
  console.log(`  - 相对路径: ${hasRelativePaths ? '是' : '否'}`);
  console.log(`  - 绝对路径: ${hasAbsolutePaths ? '是' : '否'}`);
  
  if (hasAbsolutePaths && !hasRelativePaths) {
    console.log('⚠️ 警告: 仍包含绝对路径，可能影响Electron加载');
    return false;
  }
  
  return true;
}

function testEnvironmentConfig() {
  console.log('\n⚙️ 测试环境配置...');
  
  const envPath = path.join(__dirname, 'packages/frontend/.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ 环境配置文件不存在');
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasCorrectPort = envContent.includes('VITE_BACKEND_PORT=3000');
  const hasWrongPort = envContent.includes('VITE_BACKEND_PORT=3001');
  
  console.log('✅ 环境配置文件检查通过');
  console.log(`  - 正确端口3000: ${hasCorrectPort ? '是' : '否'}`);
  console.log(`  - 错误端口3001: ${hasWrongPort ? '是' : '否'}`);
  
  return hasCorrectPort && !hasWrongPort;
}

function testRouterConfig() {
  console.log('\n🛣️ 测试路由配置...');
  
  const mainPath = path.join(__dirname, 'packages/frontend/src/main.tsx');
  
  if (!fs.existsSync(mainPath)) {
    console.log('❌ main.tsx文件不存在');
    return false;
  }
  
  const mainContent = fs.readFileSync(mainPath, 'utf8');
  const hasHashRouter = mainContent.includes('HashRouter');
  const hasRouterVariable = mainContent.includes('const Router = isElectron ? HashRouter : BrowserRouter');
  
  console.log('✅ 路由配置检查通过');
  console.log(`  - HashRouter支持: ${hasHashRouter ? '是' : '否'}`);
  console.log(`  - 动态路由选择: ${hasRouterVariable ? '是' : '否'}`);
  
  return hasHashRouter && hasRouterVariable;
}

function testLayoutFix() {
  console.log('\n🎨 测试布局修复...');
  
  const appPath = path.join(__dirname, 'packages/frontend/src/App.tsx');
  
  if (!fs.existsSync(appPath)) {
    console.log('❌ App.tsx文件不存在');
    return false;
  }
  
  const appContent = fs.readFileSync(appPath, 'utf8');
  const hasFlexCol = appContent.includes('flex flex-col');
  const hasCalcHeight = appContent.includes('h-[calc(100vh-2rem)]');
  
  console.log('✅ 布局修复检查通过');
  console.log(`  - Flex布局: ${hasFlexCol ? '是' : '否'}`);
  console.log(`  - 高度计算: ${hasCalcHeight ? '是' : '否'}`);
  
  return hasFlexCol && hasCalcHeight;
}

async function runAllTests() {
  console.log('开始运行所有测试...\n');
  
  const results = {
    apiConnection: await testAPIConnection(),
    projectsAPI: await testProjectsAPI(), 
    frontendBuild: testFrontendBuild(),
    environmentConfig: testEnvironmentConfig(),
    routerConfig: testRouterConfig(),
    layoutFix: testLayoutFix()
  };
  
  console.log('\n📊 测试结果汇总');
  console.log('==========================================');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r).length;
  
  Object.entries(results).forEach(([test, result]) => {
    console.log(`${result ? '✅' : '❌'} ${test}: ${result ? '通过' : '失败'}`);
  });
  
  console.log(`\n总计: ${passedTests}/${totalTests} 测试通过`);
  
  if (passedTests === totalTests) {
    console.log('🎉 所有修复验证通过！Desktop应用应该可以正常工作了。');
  } else {
    console.log('⚠️  部分测试失败，请检查相关配置。');
  }
  
  return results;
}

// 运行测试
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ 测试运行失败:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests };