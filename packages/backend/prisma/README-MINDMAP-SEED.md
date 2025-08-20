# Mindmap 模拟数据种子脚本使用指南

## 📋 概述

本目录包含了为 DevAPI Manager 项目创建 Mindmap 可视化所需的完整模拟数据的脚本集合。

## 🗂️ 脚本文件

### 核心种子脚本

- `seed-mindmap.ts` - 创建数据表和字段
- `seed-relationships.ts` - 创建表之间的关系
- `seed-mindmap-layouts.ts` - 创建 Mindmap 布局数据
- `verify-mindmap-data.ts` - 验证所有数据的完整性

### 便捷执行脚本

- `scripts/seed-all-mindmap.sh` - Linux/Mac 一键执行脚本
- `scripts/seed-all-mindmap.bat` - Windows 一键执行脚本

## 🚀 快速开始

### 方法一：使用便捷脚本 (推荐)

**Windows用户：**

```bash
cd packages/backend
scripts\seed-all-mindmap.bat
```

**Linux/Mac用户：**

```bash
cd packages/backend
chmod +x scripts/seed-all-mindmap.sh
./scripts/seed-all-mindmap.sh
```

### 方法二：手动执行

```bash
cd packages/backend

# 1. 生成Prisma客户端
npx prisma generate

# 2. 推送数据库schema
npx prisma db push

# 3. 创建数据表和字段
npx tsx prisma/seed-mindmap.ts

# 4. 创建表关系
npx tsx prisma/seed-relationships.ts

# 5. 创建Mindmap布局数据
npx tsx prisma/seed-mindmap-layouts.ts

# 6. 验证数据完整性
npx tsx prisma/verify-mindmap-data.ts
```

## 📊 创建的数据

### 项目数据

1. **DevAPI Manager** - API聚合和项目管理工具
2. **E-commerce Platform** - 电子商务平台API

### DevAPI Manager 项目数据表 (7个表)

#### 用户模块

- `users` - 用户表 (7字段)
- `roles` - 角色表 (5字段)
- `user_roles` - 用户角色关联表 (3字段)

#### 项目模块

- `projects` - 项目表 (7字段)
- `apis` - API表 (8字段)
- `tags` - 标签表 (4字段)

#### 系统模块

- `system_logs` - 系统日志表 (8字段)

### E-commerce Platform 项目数据表 (5个表)

#### 用户管理

- `customers` - 客户表 (6字段)

#### 商品管理

- `products` - 商品表 (8字段)
- `categories` - 分类表 (5字段)

#### 订单管理

- `orders` - 订单表 (6字段)
- `order_items` - 订单项表 (6字段)

### 表关系 (11个)

- 用户角色关系 (user_roles → users/roles)
- 项目所有权关系 (projects → users)
- API项目关系 (apis → projects)
- 标签项目关系 (tags → projects)
- 系统日志用户关系 (system_logs → users)
- 商品分类关系 (products → categories)
- 分类父子关系 (categories → categories)
- 订单客户关系 (orders → customers)
- 订单项关系 (order_items → orders/products)

### Mindmap布局数据 (2个)

- 每个项目都有预配置的可视化布局
- 包含节点位置、连线样式、颜色配置等

## 🎯 数据统计

- ✅ **2个项目** (DevAPI Manager + E-commerce Platform)
- ✅ **12个数据表**
- ✅ **73个字段**
- ✅ **11个表关系**
- ✅ **2个Mindmap布局**

## 🌐 访问链接

脚本执行完成后，可以通过以下链接访问 Mindmap 可视化：

### DevAPI Manager

```
http://localhost:5173/projects/bbf158a8-fb6f-4c68-994e-5a419efe3e41/mindmap
```

### E-commerce Platform

```
http://localhost:5173/projects/dbc6dbcd-7106-4df4-9aee-a41dcd1d9e71/mindmap
```

> **注意**: 项目ID可能因数据库重建而改变，请使用验证脚本输出的实际链接。

## 🔧 API端点验证

脚本会自动验证以下API端点：

- `GET /api/v1/mindmap/{projectId}` - 获取项目的Mindmap数据
- `GET /api/v1/data-models/relationships?projectId={projectId}` - 获取表关系数据
- `GET /api/v1/mindmap/{projectId}/layout` - 获取Mindmap布局数据

## ⚠️ 注意事项

1. **环境要求**
   - Node.js 16+
   - 已安装项目依赖 (`npm install`)
   - 数据库连接正常

2. **运行前确认**
   - 确保在 `packages/backend` 目录下运行
   - 确保开发服务器已启动 (`npm run dev`)
   - 确保数据库文件存在且可写

3. **数据重复**
   - 脚本可以重复运行，会跳过已存在的数据
   - 如需重新创建，请先清空相关数据表

## 🐛 故障排除

### 常见错误

**1. "Prisma 未安装或配置不正确"**

```bash
npm install @prisma/client prisma
npx prisma generate
```

**2. "请在 packages/backend 目录下运行此脚本"**

```bash
cd packages/backend
# 然后重新运行脚本
```

**3. "数据库连接失败"**

- 检查 `.env` 文件中的 `DATABASE_URL` 配置
- 确保SQLite文件路径正确且可写

**4. "tsx 命令未找到"**

```bash
npm install tsx --save-dev
```

### 调试步骤

1. 检查数据库内容：

```bash
npx prisma studio
```

2. 查看数据库表：

```bash
sqlite3 prisma/dev.db ".tables"
```

3. 检查API服务：

```bash
curl http://localhost:3000/api/v1/projects
```

## 📚 相关文档

- [Mindmap集成指南](../../docs/Mindmap集成指南.md)
- [Prisma文档](https://www.prisma.io/docs)
- [React Flow文档](https://reactflow.dev)

## 🤝 支持

如果遇到问题，请：

1. 检查控制台错误信息
2. 运行验证脚本确认数据状态
3. 查看相关日志文件
4. 参考故障排除部分

---

**Happy Coding! 🎉**
