# 🚀 DevAPI Manager

**现代化的API管理平台** - 集成向量搜索、RAG增强检索和可视化管理的专业开发者工具。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://reactjs.org/)

## 🎯 项目愿景

DevAPI Manager 致力于成为开发者的终极API管理工具，通过现代化的技术栈和智能搜索能力，让API的发现、管理和使用变得前所未有的简单高效。

## ✨ 核心特性

### 🧠 智能搜索引擎
- **向量语义搜索**: 基于 all-MiniLM-L6-v2 模型的深度语义理解
- **智能回退机制**: 网络问题时自动切换到 TF-IDF 算法
- **混合搜索**: 结合关键词匹配和语义相似度
- **RAG增强检索**: 智能上下文分析和API推荐

### 🖥️ 现代化界面
- **响应式设计**: 完美适配桌面、平板和移动设备
- **可视化控制**: MCP服务器的图形化管理界面
- **实时监控**: 服务器状态、性能指标实时显示
- **调试工具**: 内置的开发调试面板

### 🛠️ 强大功能
- **项目管理**: 多项目支持，完整的生命周期管理
- **Swagger导入**: 一键导入OpenAPI/Swagger文档
- **标签系统**: 灵活的分类和筛选机制
- **批量操作**: 高效的批量导入和管理

### 🚀 跨平台支持
- **Web应用**: 现代化的浏览器应用
- **桌面应用**: 基于Electron的原生桌面应用
- **API服务**: RESTful API和GraphQL支持
- **MCP协议**: Model Context Protocol集成

## 📦 项目架构

```
DevAPI Manager/
├── packages/
│   ├── frontend/           # React前端应用
│   ├── backend/            # Node.js后端服务
│   ├── desktop/            # Electron桌面应用
│   ├── mcp-server/         # MCP服务器 (向量搜索)
│   └── shared/             # 共享工具和类型
├── docs/                   # 项目文档
├── scripts/                # 构建和部署脚本
└── README.md              # 项目说明
```

### 🏗️ 技术栈

| 组件 | 技术栈 | 描述 |
|------|--------|------|
| **前端** | React 18 + TypeScript + Vite + Tailwind CSS | 现代化用户界面 |
| **后端** | Node.js + Express + Prisma + SQLite | RESTful API服务 |
| **桌面** | Electron + TypeScript | 跨平台桌面应用 |
| **搜索** | Transformers.js + TF-IDF + Prisma | 智能搜索引擎 |
| **数据库** | SQLite + Prisma ORM | 轻量级数据持久化 |

## 🚀 快速开始

### 📋 系统要求
- **Node.js**: 18.0+ 
- **NPM**: 8.0+
- **内存**: 4GB+ RAM
- **存储**: 500MB+ 可用空间

### ⚡ 一键启动 (推荐)
```bash
# 克隆项目
git clone https://github.com/devapi-team/devapi-manager.git
cd devapi-manager

# 安装依赖
npm install

# 启动开发环境 (前端 + 后端)
npm run dev

# 或使用批处理脚本 (Windows)
start-dev.bat
```

访问: http://localhost:5173

### 🖥️ 桌面应用
```bash
# 构建桌面应用
npm run build:desktop

# 或使用批处理脚本 (Windows)
build-desktop.bat
```

### 🧠 MCP服务器 (可选)
```bash
# 启动MCP服务器 (向量搜索)
cd packages/mcp-server
npm run dev

# 测试向量搜索功能
node mcp-vector-demo.js
```

## 🎮 使用指南

### 1️⃣ 创建项目
```bash
# 访问首页，点击"新建项目"
# 填写项目信息：名称、描述、版本、基础URL
```

### 2️⃣ 导入API
```bash
# 进入项目详情页
# 点击"导入Swagger"
# 粘贴Swagger JSON/YAML或提供URL
```

### 3️⃣ 智能搜索
```bash
# 使用快捷键 Ctrl+K 或点击搜索框
# 输入自然语言查询：如"用户登录API"
# 查看语义搜索和关键词匹配结果
```

### 4️⃣ MCP服务器管理
```bash
# 进入"设置"页面
# 选择"MCP服务器"标签
# 点击"启动服务器"按钮
# 查看实时状态和日志
```

## 📊 功能演示

### 🔍 智能搜索示例
```
查询: "用户认证相关的接口"
结果:
├── [0.87] POST /auth/login - 用户登录
├── [0.84] POST /auth/register - 用户注册  
├── [0.79] GET /auth/profile - 获取用户信息
└── [0.71] POST /auth/logout - 用户登出
```

### 🧠 MCP服务器状态
```
🎯 MCP服务器状态
├── 🟢 运行中 - 端口 3001
├── ⏱️  运行时间: 2小时34分钟
├── 📊 请求数: 1,247
├── 🧠 向量模型: all-MiniLM-L6-v2 (28.6MB)
└── 🔍 搜索索引: 38个文档
```

### 📈 性能指标
```
⚡ 搜索性能
├── 向量搜索: <50ms
├── TF-IDF回退: <10ms  
├── 混合搜索: <100ms
└── 缓存命中率: 90%+
```

## 🛠️ 开发指南

### 📁 项目结构详解
```
packages/frontend/          # 🌐 前端应用
├── src/components/         # 可复用组件
├── src/pages/             # 页面组件
├── src/hooks/             # 自定义Hook
├── src/api/               # API接口
├── src/debug/             # 调试工具
└── src/utils/             # 工具函数

packages/backend/           # 🔌 后端服务  
├── src/routes/            # API路由
├── src/middleware/        # 中间件
├── src/lib/               # 核心库
└── prisma/                # 数据库模式

packages/mcp-server/        # 🧠 MCP服务器
├── src/vectorSearch.ts    # 向量搜索
├── src/fallbackSearch.ts  # TF-IDF回退
├── src/apiRAG.ts          # RAG增强
└── models/                # 本地模型

packages/desktop/           # 🖥️ 桌面应用
├── src/main.ts            # 主进程
├── src/preload.ts         # 预加载脚本
└── assets/                # 应用资源
```

### 🔧 开发命令
```bash
# 开发环境
npm run dev                # 启动前端+后端
npm run dev:frontend       # 仅启动前端
npm run dev:backend        # 仅启动后端
npm run dev:mcp            # 启动MCP服务器

# 构建
npm run build              # 构建所有包
npm run build:frontend     # 构建前端
npm run build:backend      # 构建后端
npm run build:desktop      # 构建桌面应用

# 测试
npm test                   # 运行所有测试
npm run test:frontend      # 前端测试
npm run test:backend       # 后端测试

# 数据库
npm run db:generate        # 生成Prisma客户端
npm run db:migrate         # 运行数据库迁移
npm run db:seed            # 初始化数据
```

### 🧪 测试和调试
```bash
# 运行测试套件
npm run test

# 启动调试模式
DEBUG=* npm run dev

# 测试MCP向量搜索
cd packages/mcp-server
node test-local-model.js

# 桌面应用调试
npm run dev:desktop
```

## 🎯 核心亮点

### 🧠 AI驱动的搜索
- **语义理解**: 理解自然语言查询意图
- **智能推荐**: 基于上下文的API推荐
- **多语言支持**: 中英文混合搜索
- **学习能力**: 搜索结果不断优化

### ⚡ 极致性能
- **向量缓存**: 本地模型缓存，减少网络依赖
- **智能回退**: 网络问题时无缝切换算法
- **并发处理**: 支持100+ QPS的搜索请求
- **内存优化**: 高效的内存使用和垃圾回收

### 🛡️ 企业级可靠性
- **故障恢复**: 自动故障检测和恢复
- **数据安全**: 完整的数据备份和恢复
- **日志监控**: 详细的操作日志和性能监控
- **扩展性**: 支持水平扩展和集群部署

## 📈 路线图

### 🎯 近期目标 (Q1 2024)
- [ ] **云端同步**: 支持云端数据同步和团队协作
- [ ] **API测试**: 集成API测试和Mock服务
- [ ] **代码生成**: 自动生成客户端SDK
- [ ] **插件系统**: 支持第三方插件扩展

### 🚀 长期规划 (2024年)
- [ ] **AI助手**: 集成GPT-4的AI代码助手
- [ ] **可视化编辑**: 拖拽式API设计器
- [ ] **版本控制**: API版本管理和变更追踪
- [ ] **企业版**: 企业级权限管理和审计

## 🤝 贡献指南

我们欢迎所有形式的贡献！请阅读我们的 [贡献指南](CONTRIBUTING.md) 了解详情。

### 💡 贡献方式
- **🐛 报告Bug**: 在Issues中报告问题
- **💡 功能建议**: 提出新功能想法
- **📝 文档改进**: 完善项目文档
- **🔧 代码贡献**: 提交Pull Request

### 👥 开发团队
- **@主要维护者** - 项目负责人
- **@前端开发** - React/TypeScript专家
- **@后端开发** - Node.js/数据库专家
- **@AI工程师** - 向量搜索和机器学习专家

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE) - 查看文件了解详情。

## 🔗 相关链接

- **📚 文档**: [docs.devapi-manager.com](https://docs.devapi-manager.com)
- **🐛 问题反馈**: [GitHub Issues](https://github.com/devapi-team/devapi-manager/issues)
- **💬 讨论区**: [GitHub Discussions](https://github.com/devapi-team/devapi-manager/discussions)
- **📧 联系我们**: [contact@devapi.team](mailto:contact@devapi.team)

## 🙏 致谢

感谢以下开源项目和社区的支持：

- **React** - 构建用户界面的JavaScript库
- **Electron** - 跨平台桌面应用框架
- **Transformers.js** - 浏览器端的机器学习
- **Prisma** - 下一代数据库工具包
- **Tailwind CSS** - 实用的CSS框架

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给我们一个Star！**

**🚀 DevAPI Manager - 让API管理更智能，让开发更高效！**

[⬆ 回到顶部](#-devapi-manager)

</div>

## 🛠️ 开发环境搭建

### 快速开始

1. **克隆项目**
```bash
git clone <repository-url>
cd devapi-manager
```

2. **安装所有依赖**
```bash
npm install
```

3. **初始化开发环境**
```bash
node start-dev.js
```

### 手动安装步骤

如果自动安装失败，可以手动执行以下步骤：

#### 1. 构建共享包
```bash
cd packages/shared
npm install
npm run build
```

#### 2. 安装后端依赖
```bash
cd packages/backend
npm install
```

#### 3. 初始化数据库
```bash
cd packages/backend
npx prisma generate
npx prisma db push
npm run db:seed
```

#### 4. 安装前端依赖
```bash
cd packages/frontend
npm install
```

## 🚀 启动应用

### 一键启动（推荐）

```bash
# 方式1: 使用启动脚本（自动处理端口冲突和依赖）
npm run dev

# 方式2: 直接运行脚本
node start-dev.js

# 方式3: 使用批处理文件 (Windows)
dev.bat

# 方式4: 使用shell脚本 (Linux/Mac)
./dev.sh
```

### 手动启动

如果需要分别启动各个服务：

1. **启动后端服务** (终端1)
```bash
cd packages/backend
npm run dev
```

2. **启动前端开发服务器** (终端2)
```bash
cd packages/frontend
npm run dev
```

3. **启动MCP搜索服务器** (终端3)
```bash
cd packages/mcp-server
npm run dev
```

### 访问地址

启动成功后可访问：
- 📱 **前端应用**: http://localhost:5173
- 🔧 **后端API**: http://localhost:3001
- 📚 **API文档**: http://localhost:3001/api/v1
- 🏥 **健康检查**: http://localhost:3001/health

### 生产模式

1. **构建后端**
```bash
cd backend
npm run build
```

2. **构建前端**
```bash
cd frontend
npm run build
```

3. **启动生产服务**
```bash
cd backend
npm start
```

## 📱 桌面应用打包

```bash
cd desktop

# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux

# 所有平台
npm run build
```

## 🔧 项目结构

```
devapi-manager/
├── backend/                 # Node.js后端
│   ├── src/
│   │   ├── controllers/     # 控制器
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # 路由定义
│   │   ├── services/       # 业务逻辑
│   │   ├── utils/          # 工具函数
│   │   └── app.ts          # 应用入口
│   ├── prisma/             # 数据库模式
│   └── package.json
├── frontend/               # React前端
│   ├── src/
│   │   ├── components/     # React组件
│   │   ├── pages/          # 页面组件
│   │   ├── hooks/          # 自定义Hook
│   │   ├── stores/         # 状态管理
│   │   ├── utils/          # 工具函数
│   │   └── App.tsx         # 应用根组件
│   └── package.json
├── desktop/                # Electron桌面应用
│   ├── main.js             # Electron主进程
│   └── package.json
└── docs/                   # 文档
```

## 🌐 API文档

### 项目管理
- `GET /api/projects` - 获取项目列表
- `POST /api/projects` - 创建新项目
- `GET /api/projects/:id` - 获取项目详情
- `PUT /api/projects/:id` - 更新项目
- `DELETE /api/projects/:id` - 删除项目
- `GET /api/projects/:id/stats` - 获取项目统计

### API管理
- `GET /api/apis?projectId=:id` - 获取项目API列表
- `POST /api/apis` - 创建API
- `PUT /api/apis/:id` - 更新API
- `DELETE /api/apis/:id` - 删除API

### Swagger导入
- `POST /api/swagger/validate` - 验证Swagger文档
- `POST /api/swagger/import` - 导入Swagger文档

### 标签管理
- `GET /api/tags?projectId=:id` - 获取项目标签
- `POST /api/tags` - 创建标签
- `PUT /api/tags/:id` - 更新标签
- `DELETE /api/tags/:id` - 删除标签

## 💡 使用指南

### 1. 创建项目
1. 点击首页的"新建项目"按钮
2. 填写项目名称和描述
3. 保存项目

### 2. 导入Swagger
1. 进入项目详情页
2. 点击"导入Swagger"按钮
3. 输入Swagger文档URL或粘贴JSON内容
4. 验证并导入

### 3. 管理API
1. 在项目详情页查看所有API
2. 使用状态选择器更新API开发状态
3. 复制生成的前端/后端代码
4. 使用标签对API进行分类

### 4. API状态说明
- **未开发**: API还未开始开发
- **开发中**: API正在开发中
- **已完成**: API开发完成
- **未测试**: API开发完成但未测试
- **已测试**: API已通过测试
- **已废弃**: API不再使用

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📝 开发规范

### 代码风格
- 使用 TypeScript
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码

### 提交规范
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码格式调整
- refactor: 代码重构
- test: 测试相关
- chore: 构建过程或辅助工具的变动

## 🔍 故障排除

### 常见问题

1. **端口被占用**
   - 检查3001端口是否被其他服务占用
   - 修改backend/.env中的PORT配置

2. **数据库连接失败**
   - 确保Prisma数据库已正确初始化
   - 运行 `npx prisma db push`

3. **前端无法连接后端**
   - 检查前端.env中的API_URL配置
   - 确保后端服务已启动

4. **Swagger导入失败**
   - 检查Swagger文档格式是否正确
   - 确保URL可访问

## 📞 技术支持

如遇到问题，请提交Issue到项目仓库。

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

感谢所有为此项目做出贡献的开发者。

---

**DevAPI Manager** - 让API管理更简单高效！