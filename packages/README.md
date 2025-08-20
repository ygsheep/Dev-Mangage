# DevAPI Manager - 包架构文档

DevAPI Manager 采用 monorepo 架构，将不同的功能模块拆分为独立的包，每个包都有明确的职责和边界。这种架构设计提供了良好的可维护性、可扩展性和代码复用性。

## 📦 包结构概览

```
packages/
├── backend/             # 🛡️ 后端服务
├── frontend/            # 🎨 前端应用
├── mcp-server/          # 🔍 MCP搜索服务器
├── desktop/             # 🖥️ 桌面应用
├── database/            # 🗄️ 共享数据库模块
└── shared/              # 🔗 共享类型和工具
```

## 🛡️ Backend 包 - 核心API服务

**位置**: `packages/backend/`  
**端口**: `3001` (开发环境)

### 核心功能
- **RESTful API服务** - 提供完整的API管理功能
- **数据库管理** - Prisma ORM + SQLite数据库
- **Swagger导入** - 支持OpenAPI规范文档解析
- **AI集成** - 文档智能解析和SQL代码生成
- **项目管理** - 项目、API端点、标签等资源管理

### 技术栈
- **框架**: Express.js + TypeScript
- **数据库**: Prisma ORM + SQLite
- **验证**: Zod + express-validator
- **日志**: Winston + 中文日志系统
- **安全**: Helmet + CORS + Rate Limiting

### 主要目录结构
```
src/
├── routes/              # API路由定义
├── middleware/          # 中间件
├── lib/                # 核心库文件
├── services/           # 业务逻辑服务
├── utils/              # 工具函数
└── scripts/            # 脚本文件
```

### 启动命令
```bash
npm run dev              # 开发模式
npm run build           # 构建生产版本
npm run start           # 生产模式启动
```

## 🎨 Frontend 包 - React用户界面

**位置**: `packages/frontend/`  
**端口**: `5173` (开发环境)

### 核心功能
- **项目管理界面** - 直观的项目创建和管理
- **API文档管理** - API端点的可视化管理
- **Swagger导入界面** - 拖拽式文档导入
- **搜索功能** - 实时搜索和过滤
- **响应式设计** - 支持多种屏幕尺寸

### 技术栈
- **框架**: React 18 + TypeScript + Vite
- **状态管理**: React Query + Zustand
- **样式**: Tailwind CSS + 自定义组件
- **路由**: React Router Dom
- **表单**: React Hook Form + Zod验证
- **通知**: React Hot Toast

### 主要目录结构
```
src/
├── components/         # React组件
│   ├── ui/            # 基础UI组件
│   ├── layout/        # 布局组件
│   └── features/      # 功能组件
├── pages/             # 页面组件
├── hooks/             # 自定义Hooks
├── utils/             # 工具函数
└── types/             # TypeScript类型
```

### 启动命令
```bash
npm run dev             # 开发服务器
npm run build          # 构建生产版本
npm run preview        # 预览生产构建
```

## 🔍 MCP Server 包 - Model Context Protocol服务

**位置**: `packages/mcp-server/`  
**端口**: `3000` (开发环境)

### 核心功能
- **智能搜索** - 基于Fuse.js的模糊搜索
- **向量搜索** - 支持transformers.js的语义搜索
- **MCP工具集** - 10+个专业搜索工具
- **实时索引** - 自动更新搜索索引
- **性能监控** - 内置性能统计和健康检查

### 技术栈
- **协议**: Model Context Protocol (MCP) 0.5+
- **搜索引擎**: Fuse.js + transformers.js
- **AI模型**: all-MiniLM-L6-v2 (可选)
- **传输层**: STDIO + HTTP支持
- **架构**: 模块化设计 + 中文注释

### 模块架构
```
src/
├── config/            # 配置管理系统
├── database/          # 数据库服务层
├── services/          # 搜索服务实现
│   └── base/         # 服务基类
├── tools/            # MCP工具定义
├── server/           # MCP服务器主类
└── utils/            # 工具和错误处理
```

### 可用工具
- `search_projects` - 项目模糊搜索
- `search_apis` - API端点搜索
- `search_tags` - 标签搜索  
- `global_search` - 跨实体全局搜索
- `get_suggestions` - 搜索建议
- `get_recent_items` - 最近访问项目

### 启动命令
```bash
npm run dev             # STDIO模式开发
npm run dev:http        # HTTP模式开发
npm run build          # 构建服务
```

## 🖥️ Desktop 包 - Electron桌面应用

**位置**: `packages/desktop/`

### 核心功能
- **跨平台桌面应用** - Windows/macOS/Linux支持
- **本地化体验** - 离线功能和本地存储
- **系统集成** - 系统托盘和快捷键支持
- **自动更新** - 内置应用更新机制

### 技术栈
- **框架**: Electron + TypeScript
- **构建**: Electron Builder
- **界面**: 内嵌Frontend包
- **更新**: Electron Updater

### 启动命令
```bash
npm run dev            # 开发模式
npm run build         # 构建应用
npm run dist          # 打包发布版
```

## 🗄️ Database 包 - 共享数据库模块

**位置**: `packages/database/`

### 核心功能
- **统一数据访问** - 提供单一的Prisma客户端
- **类型安全** - 完整的TypeScript类型导出
- **连接管理** - 智能连接池和健康检查
- **工具函数** - 常用数据库操作封装

### 模块导出
```typescript
// 主要导出
export { prisma, PrismaClient, getPrismaClient } from './client.js';
export type { Prisma } from './client.js';
export * as DatabaseUtils from './utils.js';
```

### 设计优势
- **数据一致性** - 后端和MCP服务器使用相同实例
- **开发优化** - 避免热重载时连接池耗尽
- **类型共享** - 统一的数据库类型定义

## 🔗 Shared 包 - 共享类型和工具

**位置**: `packages/shared/`

### 核心功能
- **类型定义** - 跨包共享的TypeScript接口
- **常量定义** - 应用级常量和枚举
- **工具函数** - 通用的业务逻辑函数
- **验证Schema** - Zod验证模式定义

### 主要模块
```typescript
// 类型定义
export interface Project { ... }
export interface APIEndpoint { ... }
export interface Tag { ... }

// 工具函数
export const formatDate = ...
export const validateEmail = ...

// 验证Schema
export const ProjectSchema = z.object({ ... })
```

## 🚀 开发工作流

### 本地开发启动
```bash
# 启动完整开发环境
npm run dev                    # 自动检测并启动后端+前端

# 分别启动各个服务
npm run dev:backend           # 仅后端服务
npm run dev:frontend          # 仅前端服务  
npm run dev:mcp              # 仅MCP服务器

# 启动桌面应用
npm run dev:desktop          # Electron应用
```

### 构建和部署
```bash
# 构建所有包
npm run build

# 构建特定包
npm run build:backend
npm run build:frontend  
npm run build:desktop

# 运行测试
npm run test
```

### 数据库操作
```bash
# 数据库迁移
npm run db:generate          # 生成Prisma客户端
npm run db:push             # 推送模式到数据库
npm run db:migrate          # 运行迁移
npm run db:seed            # 填充测试数据
npm run db:studio          # 打开Prisma Studio
```

## 🏗️ 架构设计原则

### 单一职责原则
每个包都有明确的职责边界：
- **Backend**: 数据管理和API服务
- **Frontend**: 用户界面和交互
- **MCP-Server**: 智能搜索和AI集成
- **Desktop**: 桌面应用封装
- **Database**: 数据访问抽象
- **Shared**: 通用工具和类型

### 依赖管理
```mermaid
graph TD
    A[Frontend] --> F[Shared]
    B[Backend] --> F[Shared]
    B --> G[Database]
    C[MCP-Server] --> F[Shared] 
    C --> G[Database]
    D[Desktop] --> A[Frontend]
    E[Database] --> H[@prisma/client]
```

### 数据流设计
1. **Frontend** 通过HTTP API与Backend通信
2. **Backend** 通过Database包访问数据库
3. **MCP-Server** 共享同一数据库实例，提供AI搜索
4. **Desktop** 内嵌Frontend，提供本地化体验

## 🛠️ 开发环境要求

### 系统要求
- **Node.js**: 18+ (推荐 20+)
- **npm**: 8+ (支持workspaces)
- **操作系统**: Windows 10+/macOS 10.15+/Linux

### NixOS开发规范
项目在NixOS环境下开发，需要遵循：
- 使用 `npx` 前缀执行项目工具
- 示例: `npx prisma generate` 而不是 `prisma generate`
- 确保使用项目本地依赖版本

### 开发工具推荐
- **IDE**: VS Code + TypeScript插件
- **数据库**: Prisma Studio
- **API测试**: Postman/Insomnia
- **MCP调试**: Claude Desktop/Cursor IDE

## 📊 性能和监控

### 性能指标
- **后端API**: 平均响应时间 < 100ms
- **数据库查询**: 索引优化，查询时间 < 50ms  
- **MCP搜索**: 搜索响应时间 < 200ms
- **前端渲染**: 首屏渲染 < 2s

### 监控和日志
- **结构化日志**: Winston + 中文日志格式
- **错误追踪**: 统一错误处理和分类
- **性能监控**: 内置请求时间统计
- **健康检查**: 各服务健康状态API

## 🔧 故障排除

### 常见问题

**1. 端口冲突**
```bash
# 检查端口占用
netstat -ano | findstr ":3000"
# 终止进程
taskkill /PID <PID> /F
```

**2. 数据库连接问题**
```bash
# 重新生成客户端
npx prisma generate
# 推送模式更改
npx prisma db push
```

**3. MCP服务无响应**
```bash
# 检查MCP服务状态
curl http://localhost:3000/health
# 重启MCP服务
npm run dev:mcp
```

**4. 依赖安装失败**
```bash
# 清理缓存
npm cache clean --force
# 重新安装
rm -rf node_modules package-lock.json
npm install
```

## 📈 扩展和定制

### 添加新的MCP工具
1. 在 `packages/mcp-server/src/tools/` 创建工具定义
2. 实现工具处理逻辑
3. 在 `ToolManager` 中注册新工具
4. 添加相应的测试和文档

### 扩展API功能
1. 在 `packages/backend/src/routes/` 添加路由
2. 实现业务逻辑服务
3. 更新数据库模式（如需要）
4. 添加前端界面支持

### 自定义前端组件
1. 创建组件在 `packages/frontend/src/components/`
2. 遵循现有设计系统
3. 添加TypeScript类型定义
4. 编写组件文档和示例

## 🤝 贡献指南

### 代码规范
- **语言**: TypeScript优先，严格类型检查
- **格式化**: Prettier + ESLint自动格式化
- **注释**: 中文注释，详细的函数和类文档
- **命名**: camelCase变量，PascalCase类型

### 提交规范
```bash
# 提交格式
git commit -m "feat(scope): 功能描述"
git commit -m "fix(scope): 修复描述" 
git commit -m "docs: 文档更新"
git commit -m "refactor: 代码重构"
```

### 版本管理
- 使用语义化版本控制 (SemVer)
- 主版本号: 不兼容的API更改
- 次版本号: 向后兼容的功能添加
- 修订号: 向后兼容的问题修复

---

## 📞 支持和反馈

如果您在开发过程中遇到问题或有改进建议，请：

1. **查看文档**: 首先查看相关包的README和代码注释
2. **搜索Issue**: 在项目Issues中搜索类似问题
3. **提交Issue**: 详细描述问题和复现步骤
4. **贡献代码**: 欢迎提交Pull Request

**Happy Coding! 🎉**