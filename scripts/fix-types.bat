@echo off
chcp 65001 >nul
echo 🔧 修复 DevAPI Manager TypeScript 类型错误
echo.

echo 📋 检查常见的TypeScript类型问题...
echo.

echo 1️⃣ 修复 apiManagement.ts 中的查询参数类型...
cd packages\backend\src\routes

REM 检查是否已经修复
findstr /C:"projectId as string" apiManagement.ts >nul
if %errorlevel% equ 0 (
    echo ✅ apiManagement.ts 类型已修复
) else (
    echo ⚠️  需要修复 apiManagement.ts 类型错误
    echo 请手动修复或重新运行构建脚本
)

cd ..\..\..\..

echo.
echo 2️⃣ 检查其他可能的类型错误...

REM 运行类型检查
echo 运行 TypeScript 类型检查...
cd packages\backend
call npm run type-check 2>type-errors.log
if %errorlevel% equ 0 (
    echo ✅ 后端类型检查通过
) else (
    echo ❌ 发现类型错误，请查看 type-errors.log
    type type-errors.log
)

cd ..\frontend
call npm run type-check 2>type-errors.log
if %errorlevel% equ 0 (
    echo ✅ 前端类型检查通过
) else (
    echo ❌ 发现类型错误，请查看 type-errors.log
    type type-errors.log
)

cd ..\..

echo.
echo 🎯 类型检查完成！
echo.
pause