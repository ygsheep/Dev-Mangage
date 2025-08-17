# 🌐 HTTP MCP Server

为 DevAPI Manager 提供基于 HTTP 的 MCP 工具访问接口，支持客户端直接通过 URL 连接。

## 🎯 核心特性

### ✨ HTTP REST API

- **直接连接**: 客户端可通过 HTTP URL 直接访问 MCP 工具
- **标准协议**: 基于 REST API，兼容所有 HTTP 客户端
- **跨平台**: 支持浏览器、移动端、桌面应用等
- **易集成**: 无需 MCP SDK，使用标准 HTTP 请求

### 🔧 支持的工具

1. **search_projects** - 项目搜索
2. **search_apis** - API接口搜索
3. **global_search** - 全局搜索
4. **vector_search** - 向量语义搜索
5. **hybrid_search** - 混合搜索
6. **rag_search_apis** - RAG增强API搜索

## 🚀 快速开始

### 启动 HTTP MCP 服务器

```bash
# 开发模式（自动重启）
npm run dev:http

# 生产模式
npm run build
npm run start:http
```

### 配置端口

```bash
# 默认端口 3001
export HTTP_MCP_PORT=3001

# 或在 .env 文件中设置
HTTP_MCP_PORT=3001
```

## 📖 API 使用指南

### 健康检查

```bash
curl http://localhost:3001/health
```

**响应:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "service": "HTTP MCP Server",
  "version": "2.0.0"
}
```

### 获取工具列表

```bash
curl http://localhost:3001/mcp/tools
```

**响应:**

```json
{
  "tools": [
    {
      "name": "search_projects",
      "description": "搜索项目",
      "inputSchema": {
        "type": "object",
        "properties": {
          "query": { "type": "string", "description": "搜索查询" },
          "limit": {
            "type": "number",
            "description": "结果数量限制",
            "default": 10
          }
        },
        "required": ["query"]
      }
    }
  ]
}
```

### 调用工具

#### 1. 项目搜索

```bash
curl -X POST http://localhost:3001/mcp/tools/search_projects \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"query": "API管理", "limit": 5}}'
```

#### 2. API 搜索

```bash
curl -X POST http://localhost:3001/mcp/tools/search_apis \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"query": "用户登录", "method": "POST", "limit": 10}}'
```

#### 3. 全局搜索

```bash
curl -X POST http://localhost:3001/mcp/tools/global_search \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"query": "用户", "types": ["projects", "apis"], "limit": 10}}'
```

#### 4. 向量搜索

```bash
curl -X POST http://localhost:3001/mcp/tools/vector_search \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"query": "用户认证", "limit": 5, "threshold": 0.3}}'
```

#### 5. 混合搜索

```bash
curl -X POST http://localhost:3001/mcp/tools/hybrid_search \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"query": "API接口", "vectorWeight": 0.7, "fuzzyWeight": 0.3, "limit": 10}}'
```

#### 6. RAG 增强搜索

```bash
curl -X POST http://localhost:3001/mcp/tools/rag_search_apis \
  -H "Content-Type: application/json" \
  -d '{"arguments": {"query": "用户管理", "includeRelated": true, "limit": 5}}'
```

## 💻 前端集成

### JavaScript/TypeScript

```typescript
// MCP HTTP 客户端类
class MCPHTTPClient {
  private baseUrl: string;

  constructor(baseUrl: string = "http://localhost:3001") {
    this.baseUrl = baseUrl;
  }

  async callTool(toolName: string, args: any) {
    const response = await fetch(`${this.baseUrl}/mcp/tools/${toolName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ arguments: args }),
    });

    if (!response.ok) {
      throw new Error(`Tool call failed: ${response.statusText}`);
    }

    return response.json();
  }

  async searchProjects(query: string, limit: number = 10) {
    return this.callTool("search_projects", { query, limit });
  }

  async searchAPIs(query: string, method?: string, limit: number = 10) {
    return this.callTool("search_apis", { query, method, limit });
  }

  async globalSearch(
    query: string,
    types: string[] = ["projects", "apis"],
    limit: number = 10
  ) {
    return this.callTool("global_search", { query, types, limit });
  }

  async vectorSearch(
    query: string,
    limit: number = 10,
    threshold: number = 0.3
  ) {
    return this.callTool("vector_search", { query, limit, threshold });
  }
}

// 使用示例
const client = new MCPHTTPClient();

// 搜索项目
const projects = await client.searchProjects("API管理");
console.log(projects);

// 搜索API
const apis = await client.searchAPIs("用户登录", "POST");
console.log(apis);

// 向量搜索
const vectorResults = await client.vectorSearch("用户认证");
console.log(vectorResults);
```

### React Hook

```typescript
import { useState, useCallback } from 'react';

interface MCPSearchResult {
  content: Array<{
    type: string;
    text: string;
  }>;
}

export function useMCPSearch(baseUrl: string = 'http://localhost:3001') {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callTool = useCallback(async (toolName: string, args: any): Promise<MCPSearchResult> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${baseUrl}/mcp/tools/${toolName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ arguments: args })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  return {
    callTool,
    loading,
    error
  };
}

// 使用示例
function SearchComponent() {
  const { callTool, loading, error } = useMCPSearch();
  const [results, setResults] = useState(null);

  const handleSearch = async (query: string) => {
    try {
      const result = await callTool('global_search', { query });
      setResults(result);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="搜索..."
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            handleSearch(e.target.value);
          }
        }}
      />
      {loading && <div>搜索中...</div>}
      {error && <div>错误: {error}</div>}
      {results && <pre>{JSON.stringify(results, null, 2)}</pre>}
    </div>
  );
}
```

### Python 客户端

```python
import requests
import json

class MCPHTTPClient:
    def __init__(self, base_url="http://localhost:3001"):
        self.base_url = base_url

    def call_tool(self, tool_name, args):
        url = f"{self.base_url}/mcp/tools/{tool_name}"
        payload = {"arguments": args}

        response = requests.post(
            url,
            headers={"Content-Type": "application/json"},
            json=payload
        )

        response.raise_for_status()
        return response.json()

    def search_projects(self, query, limit=10):
        return self.call_tool("search_projects", {"query": query, "limit": limit})

    def search_apis(self, query, method=None, limit=10):
        args = {"query": query, "limit": limit}
        if method:
            args["method"] = method
        return self.call_tool("search_apis", args)

    def vector_search(self, query, limit=10, threshold=0.3):
        return self.call_tool("vector_search", {
            "query": query,
            "limit": limit,
            "threshold": threshold
        })

# 使用示例
client = MCPHTTPClient()

# 搜索项目
projects = client.search_projects("API管理")
print(json.dumps(projects, indent=2, ensure_ascii=False))

# 向量搜索
vector_results = client.vector_search("用户认证")
print(json.dumps(vector_results, indent=2, ensure_ascii=False))
```

## 🔧 响应格式

所有工具调用都返回统一的响应格式：

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"tool\": \"search_projects\", \"results\": [...], \"total\": 5}"
    }
  ]
}
```

其中 `text` 字段包含 JSON 格式的实际搜索结果。

## 🚦 错误处理

### HTTP 状态码

- `200` - 成功
- `400` - 请求参数错误
- `404` - 工具不存在
- `500` - 服务器内部错误

### 错误响应格式

```json
{
  "error": "Tool execution failed",
  "message": "详细错误信息"
}
```

## 🔄 与标准 MCP 的对比

| 特性       | 标准 MCP (stdio) | HTTP MCP         |
| ---------- | ---------------- | ---------------- |
| 连接方式   | stdio 管道       | HTTP REST API    |
| 客户端要求 | MCP SDK          | 任何 HTTP 客户端 |
| 跨平台支持 | 有限             | 完全支持         |
| 浏览器支持 | 不支持           | 原生支持         |
| 实时通信   | 是               | 请求-响应        |
| 性能       | 更高             | 良好             |
| 易用性     | 中等             | 很高             |

## 🌟 使用场景

### 1. 前端应用

- React/Vue/Angular 应用
- 浏览器扩展
- 移动端 WebView

### 2. 第三方集成

- API 网关
- 微服务架构
- 外部系统调用

### 3. 开发测试

- API 调试
- 功能验证
- 性能测试

### 4. 跨语言支持

- Python 脚本
- Java 应用
- .NET 程序
- PHP 网站

## 🔒 安全考虑

### CORS 配置

服务器默认允许以下来源：

- `http://localhost:5173` (前端开发服务器)
- `http://localhost:3001` (后端服务器)

### 生产环境

在生产环境中，建议：

1. 配置适当的 CORS 策略
2. 添加身份验证
3. 启用 HTTPS
4. 设置请求限流

## 📊 监控和日志

服务器提供详细的请求日志：

```
2024-01-20T10:30:00.000Z POST /mcp/tools/search_projects
2024-01-20T10:30:01.000Z POST /mcp/tools/vector_search
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进 HTTP MCP 服务器！

---

**HTTP MCP Server** - 让 MCP 工具更易访问，让集成更简单！ 🚀
