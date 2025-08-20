# DevAPI Manager - API 接口文档

> **版本**: 2.0.0  
> **更新时间**: 2025-08-20  
> **基础URL**: `http://localhost:3000/api/v1`

## 目录

- [概述](#概述)
- [认证](#认证)
- [通用响应格式](#通用响应格式)
- [错误处理](#错误处理)
- [核心业务模块API](#核心业务模块api)
  - [项目管理](#项目管理)
  - [API接口管理](#api接口管理)
  - [功能模块管理](#功能模块管理)
  - [标签管理](#标签管理)
  - [数据模型管理](#数据模型管理)
- [AI智能服务API](#ai智能服务api)
- [GitHub集成API](#github集成api)
- [MCP协议服务](#mcp协议服务)
- [系统管理API](#系统管理api)

## 概述

DevAPI Manager 是一个现代化的API聚合和项目管理平台，提供完整的RESTful API用于项目管理、API接口管理、数据建模、AI集成等功能。

### 技术栈

- **框架**: Express.js + TypeScript
- **数据库**: SQLite + Prisma ORM
- **认证**: JWT (计划中)
- **文档**: OpenAPI 3.0

### 环境信息

- **开发环境**: `http://localhost:3000`
- **API前缀**: `/api/v1`
- **健康检查**: `GET /health`

## 认证

当前版本暂未实现用户认证，所有API端点均可直接访问。计划在后续版本中集成JWT认证。

```bash
# 计划中的认证方式
Authorization: Bearer <jwt_token>
```

## 通用响应格式

所有API响应遵循统一的JSON格式：

### 成功响应

```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "meta": {
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "details": []
  }
}
```

## 错误处理

### HTTP状态码

- `200` - 请求成功
- `201` - 资源创建成功
- `400` - 请求参数错误
- `404` - 资源不存在
- `409` - 资源冲突
- `429` - 请求频率限制
- `500` - 服务器内部错误

### 常见错误代码

- `VALIDATION_ERROR` - 参数验证失败
- `RESOURCE_NOT_FOUND` - 资源不存在
- `DUPLICATE_RESOURCE` - 资源重复
- `RATE_LIMIT_EXCEEDED` - 请求频率超限

---

## 核心业务模块API

### 项目管理

#### 获取项目列表

```http
GET /api/v1/projects
```

**查询参数:**

- `page` (number, optional) - 页码，默认1
- `limit` (number, optional) - 每页数量，默认20
- `search` (string, optional) - 搜索关键词
- `status` (string, optional) - 项目状态过滤

**响应示例:**

```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "uuid",
        "name": "DevAPI Manager",
        "description": "API聚合和项目管理工具",
        "status": "ACTIVE",
        "baseUrl": "http://localhost:3000",
        "createdAt": "2025-08-20T00:00:00.000Z",
        "updatedAt": "2025-08-20T00:00:00.000Z",
        "_count": {
          "apiEndpoints": 15,
          "tags": 8
        }
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20
  }
}
```

#### 创建项目

```http
POST /api/v1/projects
```

**请求体:**

```json
{
  "name": "新项目名称",
  "description": "项目描述",
  "baseUrl": "http://api.example.com"
}
```

#### 获取项目详情

```http
GET /api/v1/projects/{projectId}
```

#### 更新项目

```http
PUT /api/v1/projects/{projectId}
```

#### 删除项目

```http
DELETE /api/v1/projects/{projectId}
```

---

### API接口管理

#### 获取API端点列表

```http
GET /api/v1/api-management/endpoints
```

**查询参数:**

- `projectId` (string, required) - 项目ID
- `page` (number) - 页码
- `pageSize` (number) - 每页数量
- `method` (string) - HTTP方法过滤
- `status` (string) - 状态过滤
- `search` (string) - 搜索关键词
- `deprecated` (boolean) - 是否已废弃

**响应示例:**

```json
{
  "success": true,
  "data": {
    "endpoints": [
      {
        "id": "uuid",
        "projectId": "uuid",
        "groupId": "uuid",
        "name": "用户登录",
        "displayName": "用户登录接口",
        "method": "POST",
        "path": "/api/v1/auth/login",
        "summary": "用户认证登录",
        "description": "用户使用邮箱和密码进行登录认证",
        "status": "implemented",
        "implementationStatus": "completed",
        "testStatus": "passed",
        "tags": ["认证", "用户"],
        "authRequired": true,
        "deprecated": false,
        "createdAt": "2025-08-20T00:00:00.000Z",
        "updatedAt": "2025-08-20T00:00:00.000Z",
        "parameters": [],
        "responses": [],
        "examples": [],
        "testCases": [],
        "documentation": []
      }
    ],
    "total": 15,
    "page": 1,
    "pageSize": 20
  }
}
```

#### 创建API端点

```http
POST /api/v1/api-management/endpoints
```

**请求体:**

```json
{
  "projectId": "uuid",
  "groupId": "uuid",
  "name": "API名称",
  "method": "GET",
  "path": "/api/v1/example",
  "summary": "接口摘要",
  "description": "详细描述",
  "tags": ["标签1", "标签2"],
  "authRequired": true
}
```

#### 获取API端点详情

```http
GET /api/v1/api-management/endpoints/{endpointId}
```

#### 更新API端点

```http
PUT /api/v1/api-management/endpoints/{endpointId}
```

#### 删除API端点

```http
DELETE /api/v1/api-management/endpoints/{endpointId}
```

#### API分组管理

**获取API分组列表:**

```http
GET /api/v1/api-management/groups?projectId={projectId}
```

**创建API分组:**

```http
POST /api/v1/api-management/groups
```

---

### 功能模块管理

#### 获取功能模块列表

```http
GET /api/v1/features/{projectId}/modules
```

**查询参数:**

- `status` (string, optional) - 状态过滤: `planned|in-progress|completed|deprecated`
- `search` (string, optional) - 搜索关键词

**响应示例:**

```json
{
  "success": true,
  "data": {
    "modules": [
      {
        "id": "uuid",
        "projectId": "uuid",
        "name": "用户认证模块",
        "displayName": "用户认证和权限管理",
        "description": "包含用户登录、注册、权限验证等功能",
        "status": "completed",
        "category": "用户管理",
        "priority": "HIGH",
        "progress": 100,
        "tags": ["用户", "认证", "权限"],
        "techStack": ["React", "Node.js", "JWT"],
        "estimatedHours": 40,
        "actualHours": 38,
        "assigneeId": null,
        "assigneeName": "张开发",
        "startDate": "2024-01-01T00:00:00.000Z",
        "dueDate": "2024-01-15T00:00:00.000Z",
        "completedAt": "2024-01-14T00:00:00.000Z",
        "createdAt": "2025-08-20T00:00:00.000Z",
        "updatedAt": "2025-08-20T00:00:00.000Z",
        "apiEndpoints": [],
        "stats": {
          "totalEndpoints": 3,
          "totalTasks": 5,
          "totalDocuments": 2,
          "completedTasks": 5
        }
      }
    ],
    "total": 6,
    "summary": {
      "planned": 2,
      "inProgress": 2,
      "completed": 2,
      "total": 6
    }
  }
}
```

#### 创建功能模块

```http
POST /api/v1/features/{projectId}/modules
```

**请求体:**

```json
{
  "name": "模块名称",
  "displayName": "显示名称",
  "description": "模块描述",
  "category": "分类",
  "priority": "HIGH",
  "tags": ["标签1", "标签2"],
  "techStack": ["技术1", "技术2"],
  "estimatedHours": 40,
  "assigneeName": "负责人",
  "startDate": "2024-01-01T00:00:00.000Z",
  "dueDate": "2024-01-31T00:00:00.000Z"
}
```

#### 获取功能模块详情

```http
GET /api/v1/features/{projectId}/modules/{moduleId}
```

#### 更新功能模块

```http
PUT /api/v1/features/{projectId}/modules/{moduleId}
```

#### 删除功能模块

```http
DELETE /api/v1/features/{projectId}/modules/{moduleId}
```

#### 获取功能模块统计

```http
GET /api/v1/features/{projectId}/modules/stats
```

---

### 标签管理

#### 获取标签列表

```http
GET /api/v1/tags
```

**查询参数:**

- `projectId` (string, required) - 项目ID

#### 创建标签

```http
POST /api/v1/tags
```

**请求体:**

```json
{
  "name": "标签名称",
  "color": "#3B82F6",
  "projectId": "uuid"
}
```

#### 更新标签

```http
PUT /api/v1/tags/{tagId}
```

#### 删除标签

```http
DELETE /api/v1/tags/{tagId}
```

---

### 数据模型管理

#### 获取数据库表列表

```http
GET /api/v1/data-models/{projectId}/tables
```

**响应示例:**

```json
{
  "success": true,
  "data": {
    "tables": [
      {
        "id": "uuid",
        "projectId": "uuid",
        "name": "users",
        "displayName": "用户表",
        "comment": "系统用户信息表",
        "status": "ACTIVE",
        "engine": "InnoDB",
        "charset": "utf8mb4",
        "createdAt": "2025-08-20T00:00:00.000Z",
        "fields": [
          {
            "id": "uuid",
            "name": "id",
            "displayName": "用户ID",
            "type": "INT",
            "size": 11,
            "nullable": false,
            "isPrimaryKey": true,
            "isAutoIncrement": true,
            "comment": "主键ID"
          }
        ],
        "indexes": [],
        "_count": {
          "fields": 8,
          "indexes": 2
        }
      }
    ],
    "total": 12
  }
}
```

#### 创建数据库表

```http
POST /api/v1/data-models/{projectId}/tables
```

#### 获取表字段列表

```http
GET /api/v1/data-models/{projectId}/tables/{tableId}/fields
```

#### 创建表字段

```http
POST /api/v1/data-models/{projectId}/tables/{tableId}/fields
```

#### 思维导图API

```http
GET /api/v1/mindmap/{projectId}/layout
POST /api/v1/mindmap/{projectId}/layout
PUT /api/v1/mindmap/{projectId}/layout
```

---

## AI智能服务API

### AI文档解析

#### 解析单个文档

```http
POST /api/v1/ai/parse/document
```

**请求体:**

```json
{
  "projectId": "uuid",
  "content": "文档内容",
  "format": "markdown",
  "language": "zh-CN",
  "parseType": "database_schema"
}
```

#### 批量文档解析

```http
POST /api/v1/ai/parse/batch
```

#### 创建批量导入任务

```http
POST /api/v1/ai/batch/import
```

#### 查询任务状态

```http
GET /api/v1/ai/batch/status/{jobId}
```

### SQL代码生成

#### AI增强SQL生成

```http
POST /api/v1/ai/generate/sql
```

**请求体:**

```json
{
  "projectId": "uuid",
  "tableIds": ["uuid1", "uuid2"],
  "sqlType": "CREATE_TABLE",
  "dialect": "mysql",
  "options": {
    "includeIndexes": true,
    "includeConstraints": true
  }
}
```

#### 生成迁移脚本

```http
POST /api/v1/ai/generate/migration
```

### 代码模板管理

#### 获取模板列表

```http
GET /api/v1/ai/templates
```

#### 创建模板

```http
POST /api/v1/ai/templates
```

#### 渲染模板

```http
POST /api/v1/ai/templates/{templateId}/render
```

### AI服务健康检查

#### 获取AI服务状态

```http
GET /api/v1/ai/health
```

#### 获取可用提供商

```http
GET /api/v1/ai/providers
```

---

## GitHub集成API

### Issue管理

#### 获取Issue列表

```http
GET /api/v1/issues
```

**查询参数:**

- `projectId` (string, required) - 项目ID
- `status` (string) - 状态过滤
- `priority` (string) - 优先级过滤
- `assignee` (string) - 指派人过滤
- `page` (number) - 页码
- `pageSize` (number) - 每页数量

#### 创建Issue

```http
POST /api/v1/issues
```

#### 同步GitHub Issues

```http
POST /api/v1/github/sync/issues
```

### Issue关联管理

#### 创建Issue关联

```http
POST /api/v1/issue-relations
```

#### 获取Issue关联列表

```http
GET /api/v1/issue-relations
```

---

## MCP协议服务

### MCP工具接口

#### 搜索项目

```http
POST /api/v1/mcp/tools/search_projects
```

#### 搜索API

```http
POST /api/v1/mcp/tools/search_apis
```

#### 全局搜索

```http
POST /api/v1/mcp/tools/global_search
```

#### 获取搜索建议

```http
POST /api/v1/mcp/tools/get_search_suggestions
```

#### 刷新搜索索引

```http
POST /api/v1/mcp/tools/refresh_search_index
```

### MCP服务状态

#### 获取MCP服务状态

```http
GET /api/v1/mcp/status
```

---

## 系统管理API

### 健康检查

#### 系统健康状态

```http
GET /health
```

**响应示例:**

```json
{
  "status": "OK",
  "timestamp": "2025-08-20T00:00:00.000Z",
  "version": "2.0.0",
  "environment": "development"
}
```

### 仪表板数据

#### 获取仪表板统计

```http
GET /api/v1/dashboard/stats
```

#### 获取最近活动

```http
GET /api/v1/dashboard/activities
```

### Swagger文档

#### 导入Swagger文档

```http
POST /api/v1/swagger/import
```

#### 生成Swagger文档

```http
GET /api/v1/swagger/generate/{projectId}
```

---

## 调试工具API

### 系统调试

#### 获取系统信息

```http
GET /api/v1/debug/system
```

#### 获取数据库状态

```http
GET /api/v1/debug/database
```

#### 清理缓存

```http
POST /api/v1/debug/cache/clear
```

---

## 速率限制

当前配置的API速率限制：

- **窗口时间**: 1分钟
- **最大请求数**: 1000次/分钟
- **超限响应**: HTTP 429

## 错误日志

系统自动记录以下类型的日志：

- **HTTP请求日志**: `logs/http-YYYY-MM-DD.log`
- **错误日志**: `logs/error-YYYY-MM-DD.log`
- **组合日志**: `logs/combined-YYYY-MM-DD.log`

## 开发者资源

- **GitHub仓库**: https://github.com/ygsheep/Dev-Mangage
- **API集合**: 可导入Postman或其他API测试工具
- **WebSocket**: 计划支持实时更新功能
- **Webhook**: 计划支持事件回调

## 版本历史

### v2.0.0 (当前版本)

- 重构API架构
- 新增AI智能服务
- GitHub集成功能
- MCP协议支持
- 功能模块管理

### v1.x.x (历史版本)

- 基础API管理功能
- 项目管理功能
- 数据模型管理

---

**最后更新**: 2025-08-20  
**维护团队**: DevAPI Manager Team
