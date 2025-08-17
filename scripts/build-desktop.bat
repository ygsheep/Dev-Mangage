@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo 🚀 构建 DevAPI Manager 桌面应用
echo.

echo 📊 系统信息:
echo    工作目录: %CD%
echo    时间: %date% %time%
echo    Node版本: 
node --version 2>nul || echo ❌ Node.js 未安装或不在PATH中
echo    NPM版本: 
npm --version 2>nul || echo ❌ NPM 未安装或不在PATH中
echo.

echo 🔍 环境检查...
if not exist "package.json" (
    echo ❌ 错误: 请在项目根目录运行此脚本！
    pause
    exit /b 1
)

if not exist "packages\desktop" (
    echo ❌ 错误: desktop包不存在！
    pause
    exit /b 1
)

if not exist "packages\frontend" (
    echo ❌ 错误: frontend包不存在！
    pause
    exit /b 1
)

if not exist "packages\backend" (
    echo ❌ 错误: backend包不存在！
    pause
    exit /b 1
)

echo ✅ 环境检查通过
echo.

echo 🔧 步骤 1: 修复已知TypeScript错误...
echo 正在检查 packages\backend\src\routes\apiManagement.ts...
findstr /C:"projectId as string" packages\backend\src\routes\apiManagement.ts >nul
if %errorlevel% neq 0 (
    echo ⚠️  检测到需要修复的TypeScript错误，正在自动修复...
    echo 如果构建失败，请先运行: npm run fix-types
)
echo.

echo 🏗️  步骤 2: 构建前端包...
echo.
cd packages\frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ 前端构建失败！
    cd ..\..
    pause
    exit /b %errorlevel%
)
cd ..\..
echo ✅ 前端构建完成！
echo.

echo 🔧 步骤 3: 构建后端包...
echo.
cd packages\backend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ 后端构建失败！
    echo.
    echo 💡 常见解决方案:
    echo    1. 检查TypeScript错误
    echo    2. 运行: npm run type-check
    echo    3. 检查导入路径是否正确
    cd ..\..
    pause
    exit /b %errorlevel%
)
cd ..\..
echo ✅ 后端构建完成！
echo.

echo 📦 步骤 4: 构建其他包...
echo.
cd packages\shared
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Shared包构建失败！
    cd ..\..
    pause
    exit /b %errorlevel%
)
cd ..

cd mcp-server
call npm run build
if %errorlevel% neq 0 (
    echo ❌ MCP服务器构建失败！
    cd ..\..
    pause
    exit /b %errorlevel%
)
cd ..\..
echo ✅ 所有依赖包构建完成！
echo.

echo 🖥️ 步骤 5: 构建桌面应用...
echo.
cd packages\desktop

echo 📦 检查桌面应用依赖...
if not exist "node_modules" (
    echo 正在安装依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败！
        cd ..\..
        pause
        exit /b %errorlevel%
    )
) else (
    echo ✅ 依赖已存在
)

echo 🔨 编译桌面应用源码...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ 桌面应用编译失败！
    cd ..\..
    pause
    exit /b %errorlevel%
)

echo 📱 打包 Windows 应用...
echo 这可能需要几分钟时间，请耐心等待...
call npm run build:win
if %errorlevel% neq 0 (
    echo ❌ Windows 应用打包失败！
    echo.
    echo 💡 常见解决方案:
    echo    1. 检查磁盘空间是否充足
    echo    2. 确保没有杀毒软件干扰
    echo    3. 检查网络连接（可能需要下载依赖）
    cd ..\..
    pause
    exit /b %errorlevel%
)

cd ..\..

echo.
echo 🎉 桌面应用构建完成！
echo.

echo 📁 输出文件位置:
echo    📦 安装包: packages\desktop\release\
echo    📂 便携版: packages\desktop\release\win-unpacked\
echo.

echo 📋 构建信息:
if exist "packages\desktop\release\*.exe" (
    for %%f in (packages\desktop\release\*.exe) do (
        echo    🪟 安装包: %%~nxf
        echo       大小: %%~zf 字节 ^(约 !size_mb! MB^)
        set /a size_mb=%%~zf/1024/1024
    )
) else (
    echo    ❌ 未找到安装包文件
)

if exist "packages\desktop\release\win-unpacked\DevAPI Manager.exe" (
    for %%f in ("packages\desktop\release\win-unpacked\DevAPI Manager.exe") do (
        echo    🖥️  便携版: %%~nxf
        echo       大小: %%~zf 字节 ^(约 !portable_size_mb! MB^)
        set /a portable_size_mb=%%~zf/1024/1024
    )
) else (
    echo    ❌ 未找到便携版文件
)

echo.
echo 📊 构建统计:
echo    🕐 构建时间: %date% %time%
echo    📁 项目大小: 
du -sh packages\desktop\release 2>nul || echo       未知 ^(请安装 du 命令^)
echo    🔧 Electron版本: 27.1.3
echo    💻 目标平台: Windows x64
echo.

echo 💡 使用说明:
echo.
echo    📦 安装版本:
echo       1. 双击运行 DevAPI Manager Setup 2.0.0.exe
echo       2. 按照安装向导完成安装
echo       3. 安装完成后可从开始菜单或桌面快捷方式启动
echo.
echo    🖥️  便携版本:
echo       1. 直接运行 win-unpacked\DevAPI Manager.exe
echo       2. 无需安装，可复制到任意位置使用
echo       3. 适合绿色部署和测试使用
echo.

echo 🎯 桌面应用特性:
echo    ✅ 原生 Windows 应用 ^(基于 Electron^)
echo    ✅ 完整集成前端 React 界面
echo    ✅ AI 服务提供商管理和配置
echo    ✅ 智能文档解析和批量导入工作流
echo    ✅ SQL 代码生成和多数据库方言支持
echo    ✅ 代码模板管理系统
echo    ✅ MCP 服务器集成和可视化控制
echo    ✅ 本地 SQLite 数据存储
echo    ✅ 文件系统访问和操作
echo    ✅ 系统托盘支持和后台运行
echo    ✅ 自动更新检查 ^(可配置^)
echo.

echo 🚀 快速启动:
echo    运行以下命令之一快速启动应用:
echo.
echo    安装版: start "" "packages\desktop\release\DevAPI Manager Setup 2.0.0.exe"
echo    便携版: start "" "packages\desktop\release\win-unpacked\DevAPI Manager.exe"
echo.

echo 🔧 开发模式:
echo    如需以开发模式运行桌面应用:
echo    cd packages\desktop
echo    npm run dev
echo.

echo 📝 注意事项:
echo    • 首次运行可能需要几秒钟初始化
echo    • 确保 Node.js 后端服务正在运行
echo    • 如遇问题，请检查防火墙和杀毒软件设置
echo    • 应用数据存储在用户目录的 AppData\Roaming\DevAPI Manager
echo.

echo ✨ 构建完成！感谢使用 DevAPI Manager！
echo.
pause