# MCP 配置管理文档

## 概述

本模块提供了统一的 MCP (Model Context Protocol) 服务器地址配置管理，解决了前端代码中硬编码地址的问题。

## 功能特性

- ✅ **统一管理** - 所有 MCP 相关的地址配置集中管理
- ✅ **环境变量支持** - 支持通过环境变量动态配置
- ✅ **类型安全** - 完整的 TypeScript 类型定义
- ✅ **配置验证** - 内置配置有效性验证
- ✅ **默认值** - 提供合理的默认配置
- ✅ **动态更新** - 支持运行时配置更新

## 使用方法

### 基础用法

```typescript
import { mcpConfig } from './mcpConfig'

// 获取各种 URL
const backendUrl = mcpConfig.getBackendBaseUrl()
const mcpHttpUrl = mcpConfig.getMCPHttpUrl()
const statusUrl = mcpConfig.getMCPStatusUrl()
```

### 在 API 客户端中使用

```typescript
// 替换硬编码的地址
// ❌ 旧方式
const response = await fetch('http://localhost:3000/api/v1/mcp/status')

// ✅ 新方式
const response = await fetch(mcpConfig.getMCPStatusUrl())
```

### 获取所有 URL

```typescript
import { getMCPUrls } from './mcpConfig'

const urls = getMCPUrls()
console.log(urls)
// {
//   backend: 'http://localhost:3000/api/v1',
//   httpServer: 'http://localhost:3320',
//   websocket: 'ws://localhost:3000',
//   status: 'http://localhost:3000/api/v1/mcp/status',
//   logs: 'http://localhost:3000/api/v1/mcp/logs',
//   start: 'http://localhost:3000/api/v1/mcp/start',
//   stop: 'http://localhost:3000/api/v1/mcp/stop',
//   ping: 'http://localhost:3000/api/v1/mcp/ping'
// }
```

## 环境变量配置

在 `.env.local` 文件中配置：

```bash
# 后端服务器配置
VITE_BACKEND_HOST=localhost
VITE_BACKEND_PORT=3000

# MCP HTTP 服务器配置
VITE_MCP_HTTP_HOST=localhost
VITE_MCP_HTTP_PORT=3320

# MCP WebSocket 服务器配置
VITE_MCP_WS_HOST=localhost
VITE_MCP_WS_PORT=3000
```

## API 参考

### MCPConfig 类

#### 方法列表

| 方法                      | 返回值   | 描述                          |
| ------------------------- | -------- | ----------------------------- |
| `getBackendBaseUrl()`     | `string` | 获取后端 API 基础 URL         |
| `getMCPHttpUrl()`         | `string` | 获取 MCP HTTP 服务器 URL      |
| `getMCPWebSocketUrl()`    | `string` | 获取 MCP WebSocket 服务器 URL |
| `getMCPToolUrl(toolName)` | `string` | 获取 MCP 工具调用 URL         |
| `getMCPStatusUrl()`       | `string` | 获取 MCP 状态 URL             |
| `getMCPLogsUrl()`         | `string` | 获取 MCP 日志 URL             |
| `getMCPStatusStreamUrl()` | `string` | 获取 MCP 状态流 URL (SSE)     |
| `getMCPLogStreamUrl()`    | `string` | 获取 MCP 日志流 URL (SSE)     |
| `getMCPStartUrl()`        | `string` | 获取 MCP 启动 URL             |
| `getMCPStopUrl()`         | `string` | 获取 MCP 停止 URL             |
| `getMCPPingUrl()`         | `string` | 获取连接测试 URL              |
| `updateConfig(config)`    | `void`   | 更新配置                      |
| `getCurrentConfig()`      | `object` | 获取当前配置                  |
| `resetToDefault()`        | `void`   | 重置为默认配置                |
| `validateConfig()`        | `object` | 验证配置有效性                |

### 配置验证

```typescript
const validation = mcpConfig.validateConfig()
if (!validation.isValid) {
  console.error('配置错误:', validation.errors)
}
```

### 动态配置更新

```typescript
// 更新配置
mcpConfig.updateConfig({
  BACKEND_HOST: '192.168.1.100',
  BACKEND_PORT: '3000',
})

// 重置配置
mcpConfig.resetToDefault()
```

## 迁移指南

### 从硬编码地址迁移

1. **导入配置管理**

   ```typescript
   import { mcpConfig } from '../config/mcpConfig'
   ```

2. **替换硬编码地址**

   ```typescript
   // ❌ 替换前
   const baseUrl = 'http://localhost:3000/api/v1'

   // ✅ 替换后
   // 删除 baseUrl 变量，直接使用配置方法
   ```

3. **更新 fetch 调用**

   ```typescript
   // ❌ 替换前
   fetch(`${baseUrl}/mcp/status`)

   // ✅ 替换后
   fetch(mcpConfig.getMCPStatusUrl())
   ```

### 已迁移的文件

- ✅ `src/api/mcpServer.ts` - MCP 服务器 API 客户端
- ✅ `src/hooks/useMCPSearch.ts` - MCP 搜索 Hook
- ✅ `src/utils/api.ts` - 通用 API 工具

## 最佳实践

1. **使用配置方法而不是直接访问配置对象**

   ```typescript
   // ✅ 推荐
   const url = mcpConfig.getMCPStatusUrl()

   // ❌ 不推荐
   const config = mcpConfig.getCurrentConfig()
   const url = `http://${config.BACKEND_HOST}:${config.BACKEND_PORT}/api/v1/mcp/status`
   ```

2. **在组件中缓存 URL**

   ```typescript
   const statusUrl = useMemo(() => mcpConfig.getMCPStatusUrl(), [])
   ```

3. **环境特定配置**
   ```typescript
   // 开发环境
   if (import.meta.env.DEV) {
     mcpConfig.updateConfig({
       BACKEND_HOST: 'localhost',
       MCP_HTTP_PORT: '3320',
     })
   }
   ```

## 故障排除

### 常见问题

1. **配置不生效**
   - 检查 `.env.local` 文件是否存在
   - 确认环境变量名称正确（必须以 `VITE_` 开头）
   - 重启开发服务器

2. **连接失败**
   - 使用 `mcpConfig.validateConfig()` 检查配置
   - 确认服务器正在运行
   - 检查防火墙设置

3. **类型错误**
   - 确保导入了正确的类型
   - 检查 TypeScript 版本兼容性

### 调试方法

```typescript
// 打印当前配置
console.log('当前配置:', mcpConfig.getCurrentConfig())

// 打印所有 URL
console.log('所有 URL:', getMCPUrls())

// 验证配置
const validation = mcpConfig.validateConfig()
console.log('配置验证:', validation)
```

## 贡献指南

1. 添加新的 URL 方法时，请同时更新文档
2. 确保所有方法都有完整的 JSDoc 注释
3. 添加相应的类型定义
4. 更新迁移指南和最佳实践

## 版本历史

- **v1.0.0** - 初始版本，支持基础配置管理
- **v1.1.0** - 添加配置验证和动态更新功能
- **v1.2.0** - 完善环境变量支持和文档
