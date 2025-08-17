@echo off
chcp 65001 >nul

echo 🧪 测试构建脚本修复
echo.

echo 📊 系统信息:
echo    工作目录: %CD%
echo    时间: %date% %time%
node --version 2>nul && echo ✅ Node.js 可用 || echo ❌ Node.js 不可用
npm --version 2>nul && echo ✅ NPM 可用 || echo ❌ NPM 不可用
echo.

echo 🔍 环境检查...
if exist "package.json" (echo ✅ package.json 存在) else (echo ❌ package.json 不存在)
if exist "packages\desktop" (echo ✅ desktop包存在) else (echo ❌ desktop包不存在)
if exist "packages\frontend" (echo ✅ frontend包存在) else (echo ❌ frontend包不存在)
if exist "packages\backend" (echo ✅ backend包存在) else (echo ❌ backend包不存在)
echo.

echo 🔧 检查TypeScript修复状态...
findstr /C:"projectId as string" packages\backend\src\routes\apiManagement.ts >nul
if %errorlevel% equ 0 (
    echo ✅ TypeScript类型错误已修复
) else (
    echo ❌ TypeScript类型错误未修复
)
echo.

echo 📦 检查已构建的桌面应用...
if exist "packages\desktop\release\DevAPI Manager Setup 2.0.0.exe" (
    echo ✅ 安装包存在
    for %%f in ("packages\desktop\release\DevAPI Manager Setup 2.0.0.exe") do (
        set /a size_mb=%%~zf/1024/1024
        echo    大小: %%~zf 字节 (约 !size_mb! MB)
    )
) else (
    echo ❌ 安装包不存在
)

if exist "packages\desktop\release\win-unpacked\DevAPI Manager.exe" (
    echo ✅ 便携版存在
    for %%f in ("packages\desktop\release\win-unpacked\DevAPI Manager.exe") do (
        set /a portable_size_mb=%%~zf/1024/1024
        echo    大小: %%~zf 字节 (约 !portable_size_mb! MB)
    )
) else (
    echo ❌ 便携版不存在
)
echo.

echo 🎉 测试完成！
echo.
pause