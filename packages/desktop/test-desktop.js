#!/usr/bin/env node

/**
 * 桌面应用测试脚本
 * 用于验证Desktop应用是否正常工作
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🖥️  DevAPI Manager Desktop 应用测试脚本');
console.log('========================================');

// 检查前端构建是否存在
const frontendDistPath = path.join(__dirname, '../frontend/dist');
const frontendIndexPath = path.join(frontendDistPath, 'index.html');

console.log('📁 检查前端构建文件...');
console.log(`检查路径: ${frontendDistPath}`);

if (!fs.existsSync(frontendDistPath)) {
  console.error('❌ 前端构建目录不存在！');
  console.log('请先构建前端：');
  console.log('  cd packages/frontend');
  console.log('  npm run build');
  process.exit(1);
}

if (!fs.existsSync(frontendIndexPath)) {
  console.error('❌ 前端index.html不存在！');
  console.log('请先构建前端：');
  console.log('  cd packages/frontend');
  console.log('  npm run build');
  process.exit(1);
}

console.log('✅ 前端构建文件检查通过');

// 读取并验证HTML文件内容
const htmlContent = fs.readFileSync(frontendIndexPath, 'utf8');
const hasRelativePaths = htmlContent.includes('./assets/');
const hasAbsolutePaths = htmlContent.includes('/assets/') && !htmlContent.includes('./assets/');

console.log('📄 检查HTML文件路径配置...');
console.log(`包含相对路径: ${hasRelativePaths ? '✅ 是' : '❌ 否'}`);
console.log(`包含绝对路径: ${hasAbsolutePaths ? '❌ 是' : '✅ 否'}`);

if (hasAbsolutePaths && !hasRelativePaths) {
  console.warn('⚠️  警告：HTML文件使用绝对路径，可能在Electron中无法正常加载');
  console.log('请确保前端的vite.config.ts设置了 base: "./"');
}

// 检查Desktop构建是否存在
const desktopDistPath = path.join(__dirname, 'dist');
const desktopMainPath = path.join(desktopDistPath, 'main.js');

console.log('🔧 检查Desktop构建文件...');
if (!fs.existsSync(desktopMainPath)) {
  console.log('⚠️  Desktop主文件不存在，正在构建...');
  console.log('执行: npm run build');
  
  const buildProcess = spawn('npm', ['run', 'build'], { 
    cwd: __dirname,
    stdio: 'inherit' 
  });
  
  buildProcess.on('close', (code) => {
    if (code !== 0) {
      console.error('❌ Desktop构建失败！');
      process.exit(1);
    }
    
    console.log('✅ Desktop构建完成');
    startDesktopApp();
  });
} else {
  console.log('✅ Desktop构建文件检查通过');
  startDesktopApp();
}

function startDesktopApp() {
  console.log('🚀 启动Desktop应用...');
  console.log('如果应用正常启动，您应该能看到DevAPI Manager界面');
  console.log('按 Ctrl+C 停止应用');
  
  // 设置开发环境变量
  const env = {
    ...process.env,
    NODE_ENV: 'development',
    ELECTRON_IS_DEV: '1'
  };
  
  const electronProcess = spawn('electron', [desktopMainPath], {
    cwd: __dirname,
    stdio: 'inherit',
    env
  });
  
  electronProcess.on('close', (code) => {
    console.log(`\n📊 Desktop应用已退出 (代码: ${code})`);
    if (code === 0) {
      console.log('✅ 应用正常退出');
    } else {
      console.log('❌ 应用异常退出');
    }
  });
  
  electronProcess.on('error', (error) => {
    console.error('❌ 启动Desktop应用时出错:', error.message);
    console.log('请确保已安装Electron依赖：npm install');
  });
}