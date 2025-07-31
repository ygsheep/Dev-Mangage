@echo off
echo 🧪 测试 DevAPI Manager 桌面应用
echo.

echo 🔧 启动开发模式...
echo.

cd packages\desktop

echo 📦 安装依赖...
call npm install

echo 🔨 构建源码...
call npm run build

echo 🚀 启动桌面应用 (开发模式)...
set NODE_ENV=development
call npm run start

pause