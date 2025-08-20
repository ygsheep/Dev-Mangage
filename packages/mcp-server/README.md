# DevAPI Manager MCP智能搜索服务器

一个基于Model Context Protocol (MCP)的智能搜索服务器，为DevAPI Manager项目提供强大的搜索和数据检索能力。

## 🌟 特性

### 核心功能
- **🔍 多类型搜索** - 支持项目、API端点、标签、数据库表、功能模块和Issues的统一搜索
- **🧠 智能搜索** - 结合关键词搜索和语义搜索，提供更准确的结果
- **⚡ 高性能缓存** - 智能索引缓存机制，确保快速响应
- **🔧 模块化架构** - 可扩展的服务架构，支持灵活配置

### 搜索类型
- **项目搜索** (`search_projects`) - 根据项目名称、描述等搜索项目
- **API端点搜索** (`search_api_endpoints`) - 搜索REST API端点，支持方法、路径、状态过滤
- **标签搜索** (`search_tags`) - 搜索项目标签和分类
- **数据库表搜索** (`search_tables`) - 搜索数据库表结构和字段
- **功能模块搜索** (`search_features`) - 搜索项目功能模块
- **Issues搜索** (`search_issues`) - 搜索项目问题和任务
- **全局搜索** (`global_search`) - 跨所有类型的综合搜索

### 辅助功能
- **搜索建议** (`get_search_suggestions`) - 智能搜索建议和自动补全
- **最近项目** (`get_recent_items`) - 获取最近更新的项目和资源
- **索引刷新** (`refresh_search_index`) - 手动刷新搜索索引

## 🏗️ 架构设计

### 模块结构
```
src/
├── config/           # 配置管理
│   └── index.ts     # 统一配置接口
├── database/        # 数据库服务
│   └── index.ts     # Prisma客户端封装
├── server/          # 服务器核心
│   └── McpServer.ts # MCP服务器主类
├── services/        # 业务服务
│   ├── base/        # 基础服务类
│   ├── ProjectSearchService.ts      # 项目搜索
│   └── ApiEndpointSearchService.ts  # API端点搜索
├── tools/           # MCP工具
│   ├── ToolManager.ts   # 工具管理器
│   └── SearchTools.ts   # 搜索工具集
├── utils/           # 工具类
│   ├── logger.ts    # 日志工具
│   ├── errors.ts    # 错误处理
│   └── validation.ts # 参数验证
└── index.ts         # 主入口
```

### 核心组件

#### 1. 配置管理 (Config)
- 统一的配置接口，支持环境变量覆盖
- 类型安全的配置验证
- 多环境配置支持

#### 2. 数据库服务 (Database)
- Prisma客户端的封装和管理
- 连接池和事务管理
- 健康检查和错误恢复

#### 3. 搜索服务 (Services)
- **SearchService基类** - 统一的搜索接口和缓存机制
- **ProjectSearchService** - 项目搜索实现
- **ApiEndpointSearchService** - API端点搜索实现
- 支持Fuse.js模糊搜索和相关性排序

#### 4. 工具管理 (Tools)
- **ToolManager** - 工具注册、验证和执行管理
- **SearchTools** - 所有搜索工具的定义和实现
- 支持缓存、限流和统计功能

#### 5. 工具类 (Utils)
- **Logger** - 结构化日志记录
- **Errors** - 统一错误处理和分类
- **Validation** - 参数验证和安全检查

## 🚀 快速开始

### 环境要求
- Node.js 18+
- TypeScript 5.2+
- SQLite数据库

### 安装依赖
```bash
npm install
```

### 配置环境变量
创建 `.env` 文件：
```env
# 数据库配置
DATABASE_URL="file:../backend/prisma/dev.db"

# 搜索配置
SEARCH_DEFAULT_LIMIT=10
SEARCH_MAX_LIMIT=100
SEARCH_FUSE_THRESHOLD=0.3
SEARCH_ENABLE_VECTOR=true

# 服务器配置
MCP_HTTP_PORT=3000
LOG_LEVEL=info
```

### 运行服务器

#### STDIO模式 (推荐用于MCP客户端)
```bash
npm run dev
```

#### HTTP模式 (用于调试和测试)
```bash
npm run dev:http
```

### 构建生产版本
```bash
npm run build
npm start
```

## 📚 API文档

### 搜索工具

#### `search_projects` - 搜索项目
**参数:**
```json
{
  "query": "搜索查询字符串",
  "limit": 10,
  "status": "项目状态过滤",
  "includeArchived": false
}
```

**返回示例:**
```json
{
  "type": "projects",
  "query": "api",
  "total": 5,
  "results": [
    {
      "id": "uuid",
      "name": "API项目",
      "description": "API管理项目",
      "status": "ACTIVE",
      "score": 0.95,
      "_count": {
        "apis": 15,
        "tags": 8
      }
    }
  ]
}
```

#### `search_api_endpoints` - 搜索API端点
**参数:**
```json
{
  "query": "搜索查询字符串",
  "projectId": "项目ID",
  "method": "HTTP方法",
  "status": "端点状态",
  "limit": 10
}
```

#### `global_search` - 全局搜索
**参数:**
```json
{
  "query": "搜索查询字符串",
  "types": ["projects", "endpoints", "tags"],
  "limit": 15,
  "projectId": "限制搜索范围"
}
```

### 配置选项

#### 搜索配置
```typescript
interface SearchConfig {
  indexCacheTtl: number;        // 索引缓存TTL（毫秒）
  defaultLimit: number;         // 默认结果限制
  maxLimit: number;            // 最大结果限制
  fuseThreshold: number;       // 模糊搜索阈值
  vectorThreshold: number;     // 向量搜索阈值
  enableVectorSearch: boolean; // 是否启用向量搜索
}
```

#### 数据库配置
```typescript
interface DatabaseConfig {
  url: string;              // 数据库连接URL
  maxConnections: number;   // 最大连接数
  queryTimeout: number;     // 查询超时时间
}
```

## 🔧 开发指南

### 添加新的搜索类型

1. **创建搜索服务**
```typescript
// src/services/NewSearchService.ts
export class NewSearchService extends SearchService<NewDataType> {
  // 实现抽象方法
}
```

2. **创建工具定义**
```typescript
// src/tools/NewTools.ts
export const newTools: Record<string, ToolDefinition> = {
  searchNew: {
    tool: { /* 工具定义 */ },
    handler: newSearchHandler,
    cacheable: true
  }
};
```

3. **注册工具**
```typescript
// src/server/McpServer.ts
toolManager.registerTools(newTools);
```

### 自定义验证器
```typescript
// src/utils/validation.ts
export const CustomSchemas = {
  newSearch: z.object({
    query: BaseSchemas.searchQuery,
    customField: z.string().optional()
  })
};
```

### 错误处理
```typescript
import { DatabaseError, SearchError, NotFoundError } from '../utils/errors.js';

// 抛出具体错误
throw new SearchError('搜索失败', { query, reason: 'index_not_found' });
```

## 🧪 测试

### 运行测试
```bash
# 运行所有测试
npm test

# 运行特定测试
npm test -- --grep "ProjectSearchService"

# 覆盖率报告
npm run test:coverage
```

### 手动测试MCP工具
```bash
# 启动HTTP服务器
npm run dev:http

# 测试搜索项目
curl -X POST http://localhost:3000/tools/search_projects \
  -H "Content-Type: application/json" \
  -d '{"query": "api", "limit": 5}'
```

## 📊 监控和诊断

### 健康检查
服务器提供全面的健康检查接口，包括：
- 数据库连接状态
- 搜索服务状态  
- 工具执行统计
- 错误率监控

### 日志记录
- 结构化日志输出
- 多级别日志控制
- 文件和控制台双输出
- 性能监控装饰器

### 统计信息
```typescript
// 获取服务器信息
const info = server.getServerInfo();

// 获取工具统计
const stats = toolManager.getToolStats();

// 获取错误统计
const errors = ErrorStats.getStats();
```

## 🔒 安全特性

### 输入验证
- Zod schema严格验证
- SQL注入防护
- XSS攻击防护
- 文件路径验证

### 访问控制
- 工具级别的认证要求
- 项目访问权限验证
- 速率限制保护

### 错误处理
- 敏感信息隐藏
- 详细错误分类
- 安全日志记录

## 📈 性能优化

### 缓存策略
- 多级缓存架构
- 智能缓存失效
- 内存使用控制
- 定期清理机制

### 搜索优化
- 索引预构建
- 并行搜索处理
- 结果分页支持
- 相关性排序

## 🛠️ 故障排除

### 常见问题

#### 1. 数据库连接失败
```bash
# 检查数据库文件权限
ls -la ../backend/prisma/dev.db

# 重新生成Prisma客户端 (NixOS环境)
npx prisma generate

# 推送数据库schema (NixOS环境)  
npx prisma db push
```

#### 2. 搜索索引未找到
```bash
# 手动刷新索引
curl -X POST http://localhost:3000/tools/refresh_search_index \
  -H "Content-Type: application/json" \
  -d '{"force": true}'
```

#### 3. 端口冲突
```bash
# 检查端口使用
netstat -ano | findstr ":3000"

# 修改端口
export MCP_HTTP_PORT=3001
npm run dev:http
```

### 调试模式
```bash
# 启用详细日志
export LOG_LEVEL=debug
npm run dev

# 启用性能追踪
export ENABLE_PERFORMANCE_TRACKING=true
npm run dev
```

## 🔗 集成指南

### 与Claude Desktop集成

#### STDIO模式配置 (推荐)
```json
{
  "mcpServers": {
    "devapi-manager": {
      "command": "node",
      "args": ["./packages/mcp-server/dist/index.js"],
      "env": {
        "NODE_ENV": "production",
        "DATABASE_URL": "file:./packages/backend/prisma/dev.db",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

#### HTTP模式配置
```json
{
  "mcpServers": {
    "devapi-manager-http": {
      "url": "http://localhost:3000",
      "transport": "http"
    }
  }
}
```

### 与Cursor IDE集成

在 `.cursor/mcp.json` 中配置：
```json
{
  "mcpServers": {
    "dev-manage-mcp": {
      "command": "node",
      "args": ["./packages/mcp-server/dist/index.js"],
      "env": {
        "DATABASE_URL": "file:./packages/backend/prisma/dev.db"
      }
    }
  }
}
```

## 🤝 贡献指南

### 代码规范
- TypeScript严格模式
- ESLint代码检查
- Prettier代码格式化
- 完整的中文注释

### 提交规范
```
feat(search): 添加向量搜索功能
fix(database): 修复连接池内存泄漏
docs(readme): 更新API文档
```

### Pull Request流程
1. Fork项目并创建特性分支
2. 添加测试覆盖新功能
3. 确保所有测试通过
4. 更新相关文档
5. 提交PR并描述变更

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🔗 相关链接

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Prisma ORM](https://www.prisma.io/)
- [Fuse.js 模糊搜索](https://fusejs.io/)
- [Zod 数据验证](https://zod.dev/)

---

**DevAPI Manager** - 让API管理更智能，让开发更高效！ 🚀