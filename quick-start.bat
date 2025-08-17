@echo off
chcp 65001 >nul

echo.
echo 🚀 DevAPI Manager 启动选择
echo =====================================
echo 1. 快速启动 - 生产版本 (推荐)
echo 2. 开发模式 - 完整开发环境
echo 3. 退出
echo.
set /p choice=请选择启动模式 (1-3): 

if "%choice%"=="1" goto production
if "%choice%"=="2" goto development
if "%choice%"=="3" goto exit
goto invalid

:production
echo.
echo 🎯 启动生产版本桌面应用...
echo =====================================
cd /d "%~dp0packages\desktop\release\win-unpacked"
if exist "DevAPI Manager.exe" (
    echo ✅ 找到桌面应用，正在启动...
    start "" "DevAPI Manager.exe"
    echo.
    echo 🎉 应用已启动！享受 Claude 风格的无边框界面体验
    echo.
    echo 💡 提示：
    echo    - 拖拽顶部标题栏可移动窗口
    echo    - 右上角按钮控制窗口状态
    echo    - 默认启用暗色主题
) else (
    echo ❌ 桌面应用未找到，请先构建：
    echo    运行 fix-font-paths.bat 来构建应用
)
pause
goto end

:development
echo.
echo 🛠️ 启动开发环境...
echo =====================================
echo 📋 步骤 1: 启动后端服务...
start "后端服务" cmd /k "cd packages\backend && npm run dev"
timeout /t 3 /nobreak >nul

echo 📋 步骤 2: 启动前端开发服务...
start "前端服务" cmd /k "cd packages\frontend && npm run dev"
timeout /t 5 /nobreak >nul

echo 📋 步骤 3: 启动Electron（开发模式）...
cd packages\desktop
set NODE_ENV=development
set ELECTRON_IS_DEV=1
call npm run dev
goto end

:invalid
echo ❌ 无效选择，请重新运行脚本
pause
goto end

:exit
echo 👋 再见!
goto end

:end