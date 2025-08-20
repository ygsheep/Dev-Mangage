#!/bin/bash

# Mindmap 模拟数据种子脚本
# 用于为 DevAPI Manager 创建完整的 mindmap 测试数据

echo "🌱 开始创建 Mindmap 模拟数据..."
echo "=================================="

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在 packages/backend 目录下运行此脚本"
    exit 1
fi

# 检查 Prisma 客户端
echo "🔍 检查 Prisma 客户端..."
if ! npx prisma --version > /dev/null 2>&1; then
    echo "❌ Prisma 未安装或配置不正确"
    exit 1
fi
echo "✅ Prisma 客户端就绪"

# 生成 Prisma 客户端
echo "🔧 生成 Prisma 客户端..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo "❌ Prisma 客户端生成失败"
    exit 1
fi
echo "✅ Prisma 客户端生成成功"

# 确保数据库是最新的
echo "📄 推送数据库schema..."
npx prisma db push
if [ $? -ne 0 ]; then
    echo "❌ 数据库schema推送失败"
    exit 1
fi
echo "✅ 数据库schema已更新"

# 步骤1: 创建数据表和字段
echo ""
echo "📊 步骤1: 创建数据表和字段..."
npx tsx prisma/seed-mindmap.ts
if [ $? -ne 0 ]; then
    echo "❌ 数据表创建失败"
    exit 1
fi
echo "✅ 数据表和字段创建成功"

# 步骤2: 创建表关系
echo ""
echo "🔗 步骤2: 创建表关系..."
npx tsx prisma/seed-relationships.ts
if [ $? -ne 0 ]; then
    echo "❌ 表关系创建失败"
    exit 1
fi
echo "✅ 表关系创建成功"

# 步骤3: 创建Mindmap布局数据
echo ""
echo "🎨 步骤3: 创建Mindmap布局数据..."
npx tsx prisma/seed-mindmap-layouts.ts
if [ $? -ne 0 ]; then
    echo "❌ Mindmap布局数据创建失败"
    exit 1
fi
echo "✅ Mindmap布局数据创建成功"

# 步骤4: 验证数据
echo ""
echo "✅ 步骤4: 验证所有数据..."
npx tsx prisma/verify-mindmap-data.ts
if [ $? -ne 0 ]; then
    echo "❌ 数据验证失败"
    exit 1
fi

echo ""
echo "=================================="
echo "🎉 Mindmap 模拟数据创建完成！"
echo ""
echo "📊 数据统计:"
echo "   - 2个项目 (DevAPI Manager + E-commerce Platform)"
echo "   - 12个数据表"
echo "   - 73个字段"
echo "   - 11个表关系"
echo "   - 2个Mindmap布局"
echo ""
echo "🔗 快速访问:"
echo "   📊 DevAPI Manager Mindmap:"
echo "      http://localhost:5173/projects/{project-id}/mindmap"
echo "   📊 E-commerce Platform Mindmap:"
echo "      http://localhost:5173/projects/{project-id}/mindmap"
echo ""
echo "💡 提示:"
echo "   - 确保前端开发服务器运行在 localhost:5173"
echo "   - 确保后端开发服务器运行在 localhost:3000"
echo "   - 可以运行 'npm run dev' 启动完整开发环境"
echo ""
