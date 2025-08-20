# 🔌 DevAPI Manager - Backend

DevAPI Manager 的后端服务，提供RESTful API、数据库管理和MCP服务器控制功能。

## 🎯 核心功能

### 📊 API管理

- **项目管理**: 创建、编辑、删除API项目
- **接口管理**: API接口的CRUD操作
- **标签系统**: 灵活的标签分类和管理
- **批量导入**: 支持Swagger/OpenAPI规范导入

### 🔍 搜索服务

- **全文搜索**: 基于数据库的全文搜索
- **标签筛选**: 按标签快速筛选API
- **模糊匹配**: 智能的模糊搜索算法
- **搜索建议**: 实时搜索建议和自动补全

### 🧠 MCP集成

- **服务器控制**: 启动、停止、重启MCP服务器
- **状态监控**: 实时监控MCP服务器状态
- **日志管理**: 日志流推送和历史查看
- **配置管理**: MCP服务器配置和参数调整

### 📁 数据持久化

- **Prisma ORM**: 类型安全的数据库操作
- **SQLite**: 开发环境默认数据库
- **数据迁移**: 自动化数据库架构管理
- **数据验证**: 完整的输入验证和错误处理

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 环境配置

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
# DATABASE_URL="file:./dev.db"
# PORT=3000
# NODE_ENV=development
```

### 数据库设置

```bash
# 生成Prisma客户端
npm run db:generate

# 执行数据库迁移
npm run db:migrate

# 初始化数据 (可选)
npm run db:seed
```

### 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm run build && npm start
```

## 📁 项目结构

```
packages/backend/
├── src/
│   ├── app.ts                # Express应用配置
│   ├── server.ts            # 服务器启动入口
│   ├── config.ts            # 配置管理
│   ├── routes/              # 路由模块
│   │   ├── index.ts         # 路由汇总
│   │   ├── projects.ts      # 项目管理API
│   │   ├── apis.ts          # 接口管理API
│   │   ├── tags.ts          # 标签管理API
│   │   ├── swagger.ts       # Swagger导入API
│   │   ├── debug.ts         # 调试工具API
│   │   └── mcp.ts           # MCP服务器控制API
│   ├── middleware/          # 中间件
│   │   ├── errorHandler.ts  # 错误处理
│   │   └── validation.ts    # 数据验证
│   ├── lib/
│   │   └── prisma.ts        # Prisma客户端
│   └── scripts/
│       └── seed.ts          # 数据初始化
├── prisma/
│   ├── schema.prisma        # 数据库模式
│   └── migrations/          # 数据库迁移
├── .env.example             # 环境变量模板
└── tsconfig.json           # TypeScript配置
```

## 🔌 API接口

### 项目管理

```
GET    /api/projects           # 获取项目列表
POST   /api/projects           # 创建新项目
GET    /api/projects/:id       # 获取项目详情
PUT    /api/projects/:id       # 更新项目
DELETE /api/projects/:id       # 删除项目
```

### 接口管理

```
GET    /api/apis               # 获取API列表
POST   /api/apis               # 创建新API
GET    /api/apis/:id           # 获取API详情
PUT    /api/apis/:id           # 更新API
DELETE /api/apis/:id           # 删除API
GET    /api/apis/search        # 搜索API
```

### 标签管理

```
GET    /api/tags               # 获取标签列表
POST   /api/tags               # 创建新标签
GET    /api/tags/:id           # 获取标签详情
PUT    /api/tags/:id           # 更新标签
DELETE /api/tags/:id           # 删除标签
```

### Swagger导入

```
POST   /api/swagger/import     # 导入Swagger文档
POST   /api/swagger/validate   # 验证Swagger文档
GET    /api/swagger/templates  # 获取导入模板
```

### MCP服务器控制

```
GET    /api/mcp/status         # 获取MCP服务器状态
POST   /api/mcp/start          # 启动MCP服务器
POST   /api/mcp/stop           # 停止MCP服务器
GET    /api/mcp/logs           # 获取MCP服务器日志
GET    /api/mcp/ping           # MCP服务器健康检查
GET    /api/mcp/status/stream  # 状态实时流 (SSE)
GET    /api/mcp/logs/stream    # 日志实时流 (SSE)
```

### 调试工具

```
GET    /api/debug/health       # 服务健康状态
GET    /api/debug/metrics      # 性能指标
GET    /api/debug/logs         # 系统日志
POST   /api/debug/reset        # 重置调试数据
```

## 🔧 配置说明

### 环境变量

```bash
# 服务配置
PORT=3000                      # 服务端口
NODE_ENV=development           # 运行环境
API_PREFIX=/api               # API前缀

# 数据库配置
DATABASE_URL="file:./dev.db"  # SQLite数据库路径

# CORS配置
CORS_ORIGIN=http://localhost:5173  # 允许的前端域名

# MCP服务器配置
MCP_SERVER_PORT=3000          # MCP服务器端口
MCP_SERVER_AUTO_START=false   # 是否自动启动MCP服务器

# 日志配置
LOG_LEVEL=info                # 日志级别
LOG_FILE=./logs/app.log       # 日志文件路径
```

### 数据库配置

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

## 📊 数据模型

### 项目模型

```typescript
interface Project {
  id: string
  name: string
  description?: string
  version: string
  baseUrl?: string
  tags: Tag[]
  apis: Api[]
  createdAt: Date
  updatedAt: Date
}
```

### API模型

```typescript
interface Api {
  id: string
  name: string
  method: string
  path: string
  description?: string
  requestBody?: object
  responses?: object
  tags: Tag[]
  projectId: string
  project: Project
  createdAt: Date
  updatedAt: Date
}
```

### 标签模型

```typescript
interface Tag {
  id: string
  name: string
  color?: string
  description?: string
  apis: Api[]
  projects: Project[]
  createdAt: Date
  updatedAt: Date
}
```

## 🎯 使用示例

### 项目管理

```javascript
// 创建项目
const response = await fetch('/api/projects', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'User Management API',
    description: '用户管理相关接口',
    version: '1.0.0',
    baseUrl: 'https://api.example.com',
  }),
})

// 获取项目列表
const projects = await fetch('/api/projects').then(r => r.json())
```

### API管理

```javascript
// 创建API
const api = await fetch('/api/apis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: '获取用户信息',
    method: 'GET',
    path: '/api/users/:id',
    description: '根据用户ID获取用户详细信息',
    projectId: 'project-id-here',
    tagIds: ['tag1', 'tag2'],
  }),
})

// 搜索API
const searchResults = await fetch('/api/apis/search?q=用户&method=GET&tags=auth').then(r =>
  r.json()
)
```

### MCP服务器控制

```javascript
// 启动MCP服务器
const startResult = await fetch('/api/mcp/start', {
  method: 'POST',
}).then(r => r.json())

// 获取实时状态
const eventSource = new EventSource('/api/mcp/status/stream')
eventSource.onmessage = event => {
  const status = JSON.parse(event.data)
  console.log('MCP服务器状态:', status)
}
```

## 🔍 搜索功能

### 全文搜索

```sql
-- 基于SQLite FTS的全文搜索
SELECT * FROM apis
WHERE apis MATCH ?
ORDER BY rank
```

### 标签筛选

```typescript
// 按标签筛选API
const filteredApis = await prisma.api.findMany({
  where: {
    tags: {
      some: {
        name: { in: ['authentication', 'user'] },
      },
    },
  },
  include: { tags: true, project: true },
})
```

### 复合搜索

```typescript
// 组合搜索条件
const searchResults = await prisma.api.findMany({
  where: {
    AND: [
      {
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
          { path: { contains: query } },
        ],
      },
      method ? { method: method.toUpperCase() } : {},
      projectId ? { projectId } : {},
      tags?.length
        ? {
            tags: { some: { name: { in: tags } } },
          }
        : {},
    ],
  },
})
```

## 🛡️ 安全和验证

### 输入验证

```typescript
// 使用Zod进行数据验证
import { z } from 'zod'

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  baseUrl: z.string().url().optional(),
})
```

### 错误处理

```typescript
// 统一错误处理中间件
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('API错误:', error)

  if (error instanceof ValidationError) {
    return res.status(400).json({
      error: '数据验证失败',
      details: error.details,
    })
  }

  res.status(500).json({
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? error.message : '请稍后重试',
  })
})
```

### CORS配置

```typescript
// CORS中间件配置
app.use(
  cors({
    origin: [
      'http://localhost:5173', // 开发环境前端
      'http://localhost:3000', // 生产环境前端
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)
```

## 📈 监控和日志

### 性能监控

```typescript
// 请求性能中间件
app.use((req, res, next) => {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`)
  })

  next()
})
```

### 健康检查

```typescript
// 健康检查端点
app.get('/health', async (req, res) => {
  try {
    // 检查数据库连接
    await prisma.$queryRaw`SELECT 1`

    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: 'connected',
    })
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      error: error.message,
    })
  }
})
```

## 🧪 测试

### 单元测试

```bash
# 运行测试
npm test

# 测试覆盖率
npm run test:coverage

# 监视模式
npm run test:watch
```

### API测试

```javascript
// 使用Jest和Supertest进行API测试
describe('Projects API', () => {
  test('should create a new project', async () => {
    const response = await request(app)
      .post('/api/projects')
      .send({
        name: 'Test Project',
        version: '1.0.0',
      })
      .expect(201)

    expect(response.body.name).toBe('Test Project')
  })
})
```

## 🚀 部署

### 生产环境

```bash
# 构建项目
npm run build

# 运行数据库迁移
npm run db:migrate:deploy

# 启动服务
npm start
```

### Docker部署

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### 环境变量 (生产)

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://user:pass@localhost:5432/devapi"
CORS_ORIGIN="https://devapi.example.com"
```

## 🔗 相关文档

- [Express.js文档](https://expressjs.com/)
- [Prisma文档](https://www.prisma.io/docs)
- [TypeScript文档](https://www.typescriptlang.org/docs)
- [前端项目](../frontend/README.md)
- [MCP服务器](../mcp-server/README.md)

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](../../LICENSE) 文件了解详情。

---

**DevAPI Manager Backend** - 强大、可靠、易扩展的API管理后端服务！ 🚀
