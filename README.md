# DevAPI Manager

专业的开发者工具，用于API聚合和项目管理，支持Swagger文档导入，提供直观的卡片式界面管理API接口。

## 🚀 功能特性

- **项目管理**: 创建和管理多个开发项目
- **Swagger导入**: 支持从Swagger/OpenAPI文档导入API
- **API卡片展示**: 直观的卡片式界面展示API信息
- **状态管理**: 完整的开发状态跟踪（未开发/开发中/已完成/未测试/已测试）
- **代码生成**: 自动生成前端和后端代码模板
- **标签系统**: 灵活的标签分类和筛选
- **跨平台支持**: 支持Web版本和桌面应用

## 📋 系统要求

- Node.js 16.x 或更高版本
- npm 或 yarn
- 现代浏览器（Chrome, Firefox, Safari, Edge）

## 🛠️ 开发环境搭建

### 克隆项目
```bash
cd devapi-manager
```

### 安装依赖

#### 后端依赖
```bash
cd backend
npm install
```

#### 前端依赖
```bash
cd frontend
npm install
```

#### 桌面应用依赖
```bash
cd desktop
npm install
```

### 环境配置

在后端目录创建 `.env` 文件：
```env
# 数据库配置
DATABASE_URL="file:./dev.db"

# 服务端口
PORT=3001

# JWT密钥（如果使用认证）
JWT_SECRET="your-secret-key"

# 环境
NODE_ENV=development
```

### 数据库初始化
```bash
cd backend
npx prisma db push  # 创建数据库表
npx prisma generate # 生成Prisma客户端
```

## 🚀 启动应用

### 开发模式

1. **启动后端服务**
```bash
cd backend
npm run dev
```

2. **启动前端开发服务器**
```bash
cd frontend
npm run dev
```

3. **启动桌面应用（可选）**
```bash
cd desktop
npm run dev
```

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