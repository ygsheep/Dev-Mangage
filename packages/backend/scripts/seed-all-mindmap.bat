@echo off
REM Mindmap 模拟数据种子脚本 (Windows版本)
REM 用于为 DevAPI Manager 创建完整的 mindmap 测试数据

echo 🌱 开始创建 Mindmap 模拟数据...
echo ==================================

REM 检查是否在正确的目录
if not exist "package.json" (
    echo ❌ 请在 packages/backend 目录下运行此脚本
    exit /b 1
)

REM 检查 Prisma 客户端
echo 🔍 检查 Prisma 客户端...
npx prisma --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Prisma 未安装或配置不正确
    exit /b 1
)
echo ✅ Prisma 客户端就绪

REM 生成 Prisma 客户端
echo 🔧 生成 Prisma 客户端...
npx prisma generate
if errorlevel 1 (
    echo ❌ Prisma 客户端生成失败
    exit /b 1
)
echo ✅ Prisma 客户端生成成功

REM 确保数据库是最新的
echo 📄 推送数据库schema...
npx prisma db push
if errorlevel 1 (
    echo ❌ 数据库schema推送失败
    exit /b 1
)
echo ✅ 数据库schema已更新

REM 步骤1: 创建数据表和字段
echo.
echo 📊 步骤1: 创建数据表和字段...
npx tsx prisma/seed-mindmap.ts
if errorlevel 1 (
    echo ❌ 数据表创建失败
    exit /b 1
)
echo ✅ 数据表和字段创建成功

REM 步骤2: 创建表关系
echo.
echo 🔗 步骤2: 创建表关系...
npx tsx prisma/seed-relationships.ts
if errorlevel 1 (
    echo ❌ 表关系创建失败
    exit /b 1
)
echo ✅ 表关系创建成功

REM 步骤3: 创建Mindmap布局数据
echo.
echo 🎨 步骤3: 创建Mindmap布局数据...
npx tsx prisma/seed-mindmap-layouts.ts
if errorlevel 1 (
    echo ❌ Mindmap布局数据创建失败
    exit /b 1
)
echo ✅ Mindmap布局数据创建成功

REM 步骤4: 验证数据
echo.
echo ✅ 步骤4: 验证所有数据...
npx tsx prisma/verify-mindmap-data.ts
if errorlevel 1 (
    echo ❌ 数据验证失败
    exit /b 1
)

echo.
echo ==================================
echo 🎉 Mindmap 模拟数据创建完成！
echo.
echo 📊 数据统计:
echo    - 2个项目 (DevAPI Manager + E-commerce Platform)
echo    - 12个数据表
echo    - 73个字段
echo    - 11个表关系
echo    - 2个Mindmap布局
echo.
echo 🔗 快速访问:
echo    📊 DevAPI Manager Mindmap:
echo       http://localhost:5173/projects/{project-id}/mindmap
echo    📊 E-commerce Platform Mindmap:
echo       http://localhost:5173/projects/{project-id}/mindmap
echo.
echo 💡 提示:
echo    - 确保前端开发服务器运行在 localhost:5173
echo    - 确保后端开发服务器运行在 localhost:3001
echo    - 可以运行 'npm run dev' 启动完整开发环境
echo.