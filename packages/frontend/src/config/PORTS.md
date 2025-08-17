# DevAPI Manager 端口配置说明

这个文档说明了 DevAPI Manager 项目中所有服务的端口配置和管理方式。

## 🚀 统一端口管理

为了避免硬编码端口号造成的配置混乱，我们采用了统一的环境配置管理系统。

### 默认端口分配

| 服务 | 端口 | 用途 | 配置项 |
|------|------|------|--------|
| 后端API服务器 | 3001 | Express.js 服务器，包含 MCP HTTP 接口 | `VITE_BACKEND_PORT` |
| 前端开发服务器 | 5173 | Vite 开发服务器 | Vite 默认 |
| 独立MCP服务器 | 3004 | 开发环境的独立 MCP 服务器 | 独立配置 |

### 架构说明

```
┌─────────────────┐    ┌─────────────────┐
│  前端 (5173)    │───→│  后端 (3001)    │
│                 │    │                 │
│  - React App    │    │  - Express API  │
│  - Vite Dev     │    │  - MCP HTTP     │
│                 │    │  - MCP WebSocket│
└─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │  数据库 (SQLite)│
                       │                 │
                       │  - 项目数据     │
                       │  - API 数据     │
                       │  - 标签数据     │
                       └─────────────────┘
```

## 📝 环境配置

### 1. 环境变量文件

创建 `.env` 文件来配置端口：

```bash
# 后端服务器
VITE_BACKEND_HOST=localhost
VITE_BACKEND_PORT=3001

# MCP HTTP 服务器（集成在后端中）
VITE_MCP_HTTP_HOST=localhost
VITE_MCP_HTTP_PORT=3001

# MCP WebSocket 服务器
VITE_MCP_WS_HOST=localhost
VITE_MCP_WS_PORT=3001
```

### 2. 配置优先级

1. **环境变量 (.env 文件)** - 最高优先级
2. **默认配置 (env.ts)** - 中等优先级
3. **硬编码值** - 已移除，不再使用

### 3. 代码中的使用

```typescript
import { ENV_CONFIG, getBackendBaseUrl } from '../config/env'

// 获取后端URL
const apiUrl = getBackendBaseUrl() // http://localhost:3001/api/v1

// 获取端口
const port = ENV_CONFIG.backend.port // 3001
```

## 🔧 配置文件说明

### `src/config/env.ts`
- 环境配置的核心文件
- 定义默认端口和主机
- 提供配置验证功能
- 统一的 URL 生成器

### `src/config/mcpConfig.ts`
- MCP 服务器专用配置
- 继承自 `env.ts` 的基础配置
- 提供 MCP 相关的 URL 生成方法

### `.env`
- 本地环境变量配置
- 覆盖默认设置
- 不提交到版本控制

## 🌍 不同环境配置

### 开发环境
```bash
VITE_BACKEND_HOST=localhost
VITE_BACKEND_PORT=3001
```

### 生产环境
```bash
VITE_BACKEND_HOST=your-domain.com
VITE_BACKEND_PORT=3001
```

### Docker 环境
```bash
VITE_BACKEND_HOST=backend
VITE_BACKEND_PORT=3001
```

### 局域网环境
```bash
VITE_BACKEND_HOST=192.168.1.100
VITE_BACKEND_PORT=3001
```

## 🔍 端口冲突解决

如果端口被占用，可以通过环境变量修改：

### 1. 修改后端端口
```bash
# .env 文件
VITE_BACKEND_PORT=3002
```

### 2. 检查端口占用
```bash
# Windows
netstat -ano | findstr :3001

# Linux/Mac
lsof -i :3001
```

### 3. 终止占用进程
```bash
# Windows
taskkill /PID <PID> /F

# Linux/Mac
kill -9 <PID>
```

## 🚨 注意事项

1. **不要硬编码端口号** - 始终使用环境配置
2. **保持配置同步** - 前后端端口配置要一致
3. **环境隔离** - 不同环境使用不同的配置文件
4. **配置验证** - 启动时验证配置的有效性

## 📋 配置检查清单

- [ ] `.env` 文件已创建且配置正确
- [ ] 端口号在有效范围内 (1-65535)
- [ ] 主机名格式正确
- [ ] 前后端配置一致
- [ ] 无端口冲突
- [ ] 开发工具正确显示配置信息

## 🔄 配置迁移指南

如果您的项目中还有硬编码的端口号，请参考以下步骤进行迁移：

1. **查找硬编码端口**
   ```bash
   grep -r "localhost:30" src/
   grep -r "3002" src/
   ```

2. **替换为环境配置**
   ```typescript
   // 旧代码
   const url = 'http://localhost:3002'
   
   // 新代码
   import { getBackendBaseUrl } from '../config/env'
   const url = getBackendBaseUrl()
   ```

3. **更新测试文件**
   - 使用 mock 配置而不是硬编码端口
   - 确保测试在不同环境下都能正常运行

4. **验证配置**
   ```typescript
   import { validateConfig } from '../config/env'
   console.log(validateConfig())
   ```

通过这套统一的端口管理系统，您可以轻松地在不同环境间切换，避免了硬编码带来的问题。