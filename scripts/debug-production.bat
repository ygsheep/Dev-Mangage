@echo off
chcp 65001 >nul
echo 🔍 DevAPI Manager 生产模式调试
echo.

echo 📊 当前环境:
echo    工作目录: %CD%
echo    时间: %date% %time%
echo.

echo 🔧 步骤 1: 重新构建最新版本...
echo 正在重新构建应用以包含调试信息...
cd packages\desktop
call npm run build
if %errorlevel% neq 0 (
    echo ❌ 桌面应用构建失败！
    pause
    exit /b %errorlevel%
)

echo.
echo 🔧 步骤 2: 重新打包应用...
echo 正在重新打包Windows应用...
call npm run build:win
if %errorlevel% neq 0 (
    echo ❌ 应用打包失败！
    pause
    exit /b %errorlevel%
)

cd ..\..

echo.
echo 🔧 步骤 3: 启动生产模式调试...
echo 设置调试环境变量...

REM 设置生产模式调试
set DEBUG_PROD=1
set NODE_ENV=production

echo.
echo 🚀 启动应用 (带调试工具)...
echo    - 将自动打开开发者工具
echo    - 可以查看控制台日志
echo    - 检查网络请求
echo.

start "" "packages\desktop\release\win-unpacked\DevAPI Manager.exe"

echo.
echo 💡 调试提示:
echo    1. 应用启动后会自动打开开发者工具
echo    2. 查看 Console 标签页的启动日志
echo    3. 检查 Network 标签页的资源加载
echo    4. 如果页面空白，检查 Elements 标签页的DOM结构
echo    5. 按 F12 可以手动打开/关闭开发者工具
echo.

echo 📋 常见问题排查:
echo    • 空白页面 → 检查前端资源路径是否正确
echo    • 加载错误 → 查看 Console 中的错误信息
echo    • 网络问题 → 检查后端服务是否运行
echo    • 样式问题 → 检查 CSS 文件是否正确加载
echo.

pause