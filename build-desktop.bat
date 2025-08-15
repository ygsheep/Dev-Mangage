@echo off
echo 🚀 构建 DevAPI Manager 桌面应用
echo.

echo 📊 系统信息:
echo    工作目录: %CD%
echo    时间: %date% %time%
echo.

echo 🔧 步骤 1: 构建所有包...
echo.
call npm run build
if %errorlevel% neq 0 (
    echo ❌ 构建失败！
    pause
    exit /b %errorlevel%
)

echo.
echo ✅ 所有包构建完成！
echo.

echo 🖥️ 步骤 2: 构建桌面应用...
echo.
cd packages\desktop

echo 📦 安装桌面应用依赖...
call npm install
if %errorlevel% neq 0 (
    echo ❌ 依赖安装失败！
    pause
    exit /b %errorlevel%
)

echo 🔨 编译桌面应用源码...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ 桌面应用编译失败！
    pause
    exit /b %errorlevel%
)

echo 📱 打包 Windows 应用...
call npm run build:win
if %errorlevel% neq 0 (
    echo ❌ Windows 应用打包失败！
    pause
    exit /b %errorlevel%
)

echo.
echo 🎉 桌面应用构建完成！
echo.

echo 📁 输出文件位置:
echo    📦 安装包: packages\desktop\release\
echo.

echo 📋 构建信息:
for %%f in (packages\desktop\release\*.exe) do (
    echo    🪟 Windows: %%f
    echo       大小: %%~zf bytes
)

echo.
echo 💡 使用说明:
echo    1. 安装包位于 packages\desktop\release\ 目录
echo    2. 运行 .exe 文件进行安装
echo    3. 桌面应用会自动集成前端界面
echo    4. 支持 MCP 服务器可视化控制
echo.

echo 🎯 桌面应用特性:
echo    • 原生 Windows 应用
echo    • 集成前端界面
echo    • MCP 服务器控制
echo    • 本地数据存储
echo    • 文件系统访问
echo    • 系统托盘支持
echo.

cd ..\..
pause