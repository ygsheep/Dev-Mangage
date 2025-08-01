# MCP 服务器地址统一管理迁移指南

本文档描述了如何从硬编码的 MCP 服务器地址迁移到统一的配置管理系统。

## 迁移概述

### 迁移前（硬编码方式）
```typescript
// 各个文件中分散的硬编码地址
const baseUrl = 'http://localhost:3001'
const mcpUrl = 'http://localhost:3320'
const wsUrl = 'ws://localhost:3321'
```

### 迁移后（统一配置管理）
```typescript
// 统一的配置管理
import { mcpConfig, getMCPUrls } from '../config/mcpConfig'

const urls = getMCPUrls()
const backendUrl = urls.backend
const httpServerUrl = urls.httpServer
const websocketUrl = urls.websocket
```

## 迁移步骤

### 1. 环境变量配置

创建或更新 `.env` 文件：

```env
# 后端 API 配置
VITE_API_URL=http://localhost:3001
VITE_BACKEND_HOST=localhost
VITE_BACKEND_PORT=3001

# MCP 服务器配置
VITE_MCP_HTTP_HOST=localhost
VITE_MCP_HTTP_PORT=3320
VITE_MCP_WS_HOST=localhost
VITE_MCP_WS_PORT=3321
```

### 2. 代码迁移

#### 2.1 API 客户端迁移

**迁移前：**
```typescript
// api/mcpServer.ts
const baseUrl = 'http://localhost:3001/api/v1'

export const MCPServerAPI = {
  async getStatus() {
    const response = await fetch(`${baseUrl}/mcp/status`)
    return response.json()
  }
}
```

**迁移后：**
```typescript
// api/mcpServer.ts
import { mcpConfig } from '../config/mcpConfig'

export const MCPServerAPI = {
  async getStatus() {
    const response = await fetch(mcpConfig.getMCPStatusUrl())
    return response.json()
  }
}
```

#### 2.2 React 组件迁移

**迁移前：**
```typescript
// components/SomeComponent.tsx
const [serverHost, setServerHost] = useState('localhost')
const [serverPort, setServerPort] = useState('3001')

const apiUrl = `http://${serverHost}:${serverPort}/api`
```

**迁移后：**
```typescript
// components/SomeComponent.tsx
import { useMCPConfig } from '../hooks/useMCPConfig'

const { config, urls, updateConfig } = useMCPConfig()
const [serverHost, setServerHost] = useState(config.BACKEND_HOST)
const [serverPort, setServerPort] = useState(config.BACKEND_PORT)

const apiUrl = urls.backend
```

#### 2.3 配置生成函数迁移

**迁移前：**
```typescript
const generateHTTPConfig = () => {
  return {
    mcpServers: {
      "dev-manage-http": {
        command: "npx",
        args: [
          "@modelcontextprotocol/server-fetch",
          `http://${serverHost}:3320/mcp`
        ]
      }
    }
  }
}
```

**迁移后：**
```typescript
const generateHTTPConfig = () => {
  return {
    mcpServers: {
      "dev-manage-http": {
        command: "npx",
        args: [
          "@modelcontextprotocol/server-fetch",
          urls.httpServer + '/mcp'
        ]
      }
    }
  }
}
```

### 3. Hook 使用指南

#### 3.1 基础配置管理
```typescript
import { useMCPConfig } from '../hooks/useMCPConfig'

function MyComponent() {
  const { config, urls, updateConfig, isValid } = useMCPConfig()
  
  // 获取当前配置
  console.log('当前配置:', config)
  console.log('生成的 URLs:', urls)
  
  // 更新配置
  const handleHostChange = (newHost: string) => {
    updateConfig({ BACKEND_HOST: newHost })
  }
  
  // 检查配置有效性
  if (!isValid) {
    return <div>配置错误，请检查设置</div>
  }
  
  return (
    <div>
      <p>后端地址: {urls.backend}</p>
      <p>HTTP 服务器: {urls.httpServer}</p>
    </div>
  )
}
```

#### 3.2 连接状态监控
```typescript
import { useMCPConnection } from '../hooks/useMCPConfig'

function ConnectionStatus() {
  const { isConnected, isChecking, checkConnection } = useMCPConnection()
  
  return (
    <div>
      <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
        {isChecking ? '检查中...' : (isConnected ? '已连接' : '断开连接')}
      </span>
      <button onClick={checkConnection}>手动检查</button>
    </div>
  )
}
```

#### 3.3 配置表单管理
```typescript
import { useMCPConfigForm } from '../hooks/useMCPConfig'

function ConfigForm() {
  const {
    formData,
    isDirty,
    errors,
    isValid,
    updateFormData,
    submitForm,
    resetForm
  } = useMCPConfigForm()
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      if (submitForm()) {
        alert('配置已保存')
      }
    }}>
      <input
        value={formData.BACKEND_HOST}
        onChange={(e) => updateFormData('BACKEND_HOST', e.target.value)}
        className={errors.length > 0 ? 'border-red-500' : 'border-gray-300'}
      />
      
      {errors.map((error, index) => (
        <div key={index} className="text-red-600">{error}</div>
      ))}
      
      <button type="submit" disabled={!isDirty || !isValid}>
        保存配置
      </button>
      <button type="button" onClick={resetForm}>
        重置
      </button>
    </form>
  )
}
```

## 已迁移的文件

### ✅ 已完成迁移
- `src/config/mcpConfig.ts` - 核心配置管理
- `src/hooks/useMCPConfig.ts` - React Hook
- `src/api/mcpServer.ts` - MCP 服务器 API
- `src/hooks/useMCPSearch.ts` - MCP 搜索 Hook
- `src/utils/api.ts` - API 工具
- `src/pages/SettingsPage.tsx` - 设置页面
- `src/components/MCPServerControl.tsx` - 服务器控制组件

### 📋 待迁移文件
如果还有其他文件使用硬编码地址，请按照上述模式进行迁移。

## 配置验证

### 自动验证
配置管理系统会自动验证：
- 主机名格式
- 端口号范围（1-65535）
- URL 格式

### 手动验证
```typescript
import { mcpConfig } from '../config/mcpConfig'

const validation = mcpConfig.validateConfig()
if (!validation.isValid) {
  console.error('配置错误:', validation.errors)
}
```

## 环境特定配置

### 开发环境
```env
# .env.development
VITE_BACKEND_HOST=localhost
VITE_BACKEND_PORT=3001
VITE_MCP_HTTP_HOST=localhost
VITE_MCP_HTTP_PORT=3320
```

### 生产环境
```env
# .env.production
VITE_BACKEND_HOST=your-domain.com
VITE_BACKEND_PORT=443
VITE_MCP_HTTP_HOST=your-domain.com
VITE_MCP_HTTP_PORT=443
```

### 局域网环境
```env
# .env.local
VITE_BACKEND_HOST=192.168.1.100
VITE_BACKEND_PORT=3001
VITE_MCP_HTTP_HOST=192.168.1.100
VITE_MCP_HTTP_PORT=3320
```

## 故障排除

### 常见问题

1. **配置不生效**
   - 检查环境变量是否正确设置
   - 重启开发服务器
   - 清除浏览器缓存

2. **连接失败**
   - 验证服务器是否运行
   - 检查端口是否被占用
   - 确认防火墙设置

3. **配置验证失败**
   - 检查主机名格式
   - 确认端口号在有效范围内
   - 查看控制台错误信息

### 调试方法

```typescript
// 启用调试模式
import { mcpConfig } from '../config/mcpConfig'

// 查看当前配置
console.log('当前配置:', mcpConfig.getCurrentConfig())

// 查看生成的 URLs
console.log('生成的 URLs:', getMCPUrls())

// 验证配置
const validation = mcpConfig.validateConfig()
console.log('配置验证:', validation)
```

## 最佳实践

1. **使用环境变量**：不要在代码中硬编码地址
2. **配置验证**：始终验证配置的有效性
3. **错误处理**：妥善处理配置错误和连接失败
4. **类型安全**：使用 TypeScript 确保类型安全
5. **文档更新**：及时更新相关文档

## 贡献指南

如果需要添加新的配置项或 URL 生成方法：

1. 在 `mcpConfig.ts` 中添加新的配置字段
2. 更新 `MCPConfigType` 接口
3. 添加相应的 URL 生成方法
4. 更新验证逻辑
5. 添加测试用例
6. 更新文档

## 总结

通过统一的配置管理系统，我们实现了：

- ✅ **集中管理**：所有 MCP 服务器地址统一管理
- ✅ **环境支持**：支持开发、生产、局域网等多种环境
- ✅ **类型安全**：完整的 TypeScript 类型支持
- ✅ **实时验证**：配置变更时自动验证
- ✅ **React 集成**：提供专用的 React Hook
- ✅ **错误处理**：完善的错误处理和用户反馈
- ✅ **可扩展性**：易于添加新的配置项和功能

这个迁移大大提高了代码的可维护性和可扩展性，同时为不同环境的部署提供了灵活性。