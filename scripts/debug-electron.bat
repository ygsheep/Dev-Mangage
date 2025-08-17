@echo off
chcp 65001 >nul
echo 🔍 DevAPI Manager Electron 调试工具
echo.

echo 📊 环境信息:
echo    工作目录: %CD%
echo    时间: %date% %time%
echo.

echo 🔧 步骤 1: 检查前端资源...
if exist "packages\frontend\dist\index.html" (
    echo ✅ 前端已构建
    echo    位置: packages\frontend\dist\index.html
) else (
    echo ❌ 前端未构建，正在构建...
    cd packages\frontend
    call npm run build
    cd ..\..
)

echo.
echo 🔧 步骤 2: 检查桌面应用资源...
if exist "packages\desktop\release\win-unpacked\resources\frontend\index.html" (
    echo ✅ 桌面应用前端资源存在
) else (
    echo ❌ 桌面应用前端资源缺失
)

echo.
echo 🔧 步骤 3: 启动调试模式...
echo 正在启动Electron调试模式，将自动打开开发者工具...
echo.

cd packages\desktop

REM 设置开发环境变量
set NODE_ENV=development
set ELECTRON_IS_DEV=1

echo 🚀 启动Electron开发模式...
echo    - 将打开开发者工具
echo    - 将尝试连接到 http://localhost:5174
echo    - 如果前端服务未启动，请在新终端运行: npm run dev:frontend
echo.

start cmd /k "echo 前端开发服务器 && cd ..\frontend && npm run dev"

timeout /t 3 /nobreak >nul

call npm run dev

cd ..\..
pause