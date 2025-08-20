# DevAPI Manager 路由文档

本文档详细说明了DevAPI Manager系统中的所有API路由和前端路由配置。

## API路由概览

### 基础API模式
所有API端点遵循RESTful设计，使用统一的`/api/v1/{resource}`模式。

### 项目管理API

#### 项目CRUD操作
```
GET    /api/v1/projects                    # 获取所有项目列表
POST   /api/v1/projects                    # 创建新项目
GET    /api/v1/projects/:id                # 获取指定项目详情
PUT    /api/v1/projects/:id                # 更新项目信息
DELETE /api/v1/projects/:id                # 删除项目
```

#### 项目搜索和过滤
```
GET    /api/v1/projects/search             # 搜索项目
GET    /api/v1/projects/:id/apis           # 获取项目下的所有API
GET    /api/v1/projects/:id/tags           # 获取项目标签
GET    /api/v1/projects/:id/statistics     # 获取项目统计信息
```

### API端点管理

#### API基础操作
```
GET    /api/v1/apis                        # 获取所有API端点
POST   /api/v1/apis                        # 创建新API端点
GET    /api/v1/apis/:id                    # 获取API端点详情
PUT    /api/v1/apis/:id                    # 更新API端点
DELETE /api/v1/apis/:id                    # 删除API端点
```

#### API批量操作
```
POST   /api/v1/apis/batch                  # 批量创建API端点
PUT    /api/v1/apis/batch                  # 批量更新API端点
DELETE /api/v1/apis/batch                  # 批量删除API端点
```

#### API状态管理
```
PUT    /api/v1/apis/:id/status             # 更新API状态
GET    /api/v1/apis/status/:status         # 按状态筛选API
```

### 标签管理API

#### 标签基础操作
```
GET    /api/v1/tags                        # 获取所有标签
POST   /api/v1/tags                        # 创建新标签
GET    /api/v1/tags/:id                    # 获取标签详情
PUT    /api/v1/tags/:id                    # 更新标签
DELETE /api/v1/tags/:id                    # 删除标签
```

#### 标签关联操作
```
POST   /api/v1/tags/:id/apis               # 为标签关联API
DELETE /api/v1/tags/:id/apis/:apiId        # 移除标签与API的关联
GET    /api/v1/tags/:id/apis               # 获取标签下的所有API
```

### Swagger导入API

#### 文档导入
```
POST   /api/v1/import/swagger              # 导入Swagger文档
POST   /api/v1/import/openapi              # 导入OpenAPI文档
POST   /api/v1/import/postman              # 导入Postman集合
GET    /api/v1/import/history              # 获取导入历史
```

#### 导入验证
```
POST   /api/v1/import/validate/swagger     # 验证Swagger文档格式
POST   /api/v1/import/validate/openapi     # 验证OpenAPI文档格式
```

### AI服务API

#### AI服务健康和配置
```
GET    /api/v1/ai/health                   # AI服务健康检查
GET    /api/v1/ai/providers                # 获取可用AI提供商
POST   /api/v1/ai/providers/test           # 测试AI提供商连接
```

#### 文档解析API
```
POST   /api/v1/ai/parse/document           # 单文档AI解析
POST   /api/v1/ai/parse/batch              # 批量文档解析
GET    /api/v1/ai/parse/results/:jobId     # 获取解析结果
```

#### 批量导入API
```
POST   /api/v1/ai/batch/import             # 创建批量导入作业
GET    /api/v1/ai/batch/status/:jobId      # 获取作业状态
GET    /api/v1/ai/batch/jobs               # 获取所有批量作业
DELETE /api/v1/ai/batch/jobs/:jobId        # 取消批量作业
```

#### SQL生成API
```
POST   /api/v1/ai/generate/sql             # AI增强SQL生成
POST   /api/v1/ai/generate/migration       # 生成迁移脚本
POST   /api/v1/ai/generate/schema          # 生成数据库模式
```

#### 代码模板API
```
GET    /api/v1/ai/templates                # 获取所有代码模板
POST   /api/v1/ai/templates                # 创建新代码模板
GET    /api/v1/ai/templates/:id            # 获取模板详情
PUT    /api/v1/ai/templates/:id            # 更新代码模板
DELETE /api/v1/ai/templates/:id            # 删除代码模板
POST   /api/v1/ai/templates/:id/render     # 渲染模板
```

#### 数据库优化API
```
POST   /api/v1/ai/optimize/schema/:projectId    # 数据库模式优化建议
POST   /api/v1/ai/optimize/queries/:projectId   # 查询优化建议
POST   /api/v1/ai/optimize/indexes/:projectId   # 索引优化建议
```

#### 模型验证API
```
POST   /api/v1/ai/validate/model           # 数据模型验证
POST   /api/v1/ai/validate/schema          # 数据库模式验证
POST   /api/v1/ai/validate/api             # API规范验证
```

### 数据库表管理API

#### 表结构管理
```
GET    /api/v1/database/tables             # 获取所有数据库表
POST   /api/v1/database/tables             # 创建数据库表
GET    /api/v1/database/tables/:id         # 获取表详情
PUT    /api/v1/database/tables/:id         # 更新表结构
DELETE /api/v1/database/tables/:id         # 删除数据库表
```

#### 字段管理
```
GET    /api/v1/database/tables/:id/fields  # 获取表字段
POST   /api/v1/database/tables/:id/fields  # 添加字段
PUT    /api/v1/database/fields/:id         # 更新字段
DELETE /api/v1/database/fields/:id         # 删除字段
```

#### 索引管理
```
GET    /api/v1/database/tables/:id/indexes # 获取表索引
POST   /api/v1/database/tables/:id/indexes # 创建索引
DELETE /api/v1/database/indexes/:id        # 删除索引
```

### Issue管理API

#### Issue基础操作
```
GET    /api/v1/:projectId/issues                    # 获取项目的Issues列表
POST   /api/v1/:projectId/issues                    # 创建新Issue
GET    /api/v1/:projectId/issues/stats              # 获取Issue统计信息
GET    /api/v1/:projectId/issues/:issueId           # 获取Issue详情
PUT    /api/v1/:projectId/issues/:issueId           # 更新Issue
DELETE /api/v1/:projectId/issues/:issueId           # 删除Issue
```

#### Issue关联管理API
```
GET    /api/v1/:projectId/issues/:issueId/relations/available    # 获取可关联的资源
GET    /api/v1/:projectId/issues/:issueId/relations              # 获取Issue的所有关联关系

POST   /api/v1/:projectId/issues/:issueId/relations/api          # 创建Issue与API的关联
POST   /api/v1/:projectId/issues/:issueId/relations/table        # 创建Issue与数据表的关联  
POST   /api/v1/:projectId/issues/:issueId/relations/feature      # 创建Issue与功能模块的关联

DELETE /api/v1/:projectId/issues/:issueId/relations/api/:relationId      # 删除API关联
DELETE /api/v1/:projectId/issues/:issueId/relations/table/:relationId    # 删除数据表关联
DELETE /api/v1/:projectId/issues/:issueId/relations/feature/:relationId  # 删除功能模块关联
```

#### Issue关联参数说明
- API关联参数：`{ apiId?, endpointId?, relationType, description? }`
- 数据表关联参数：`{ tableId, relationType, description? }`
- 功能模块关联参数：`{ featureName, component?, relationType, description? }`
- 关联类型：`RELATES_TO | DEPENDS_ON | BLOCKS | IMPLEMENTS | TESTS`

### MCP搜索API

#### 搜索服务
```
POST   /api/v1/mcp/search/projects         # 搜索项目
POST   /api/v1/mcp/search/apis             # 搜索API端点
POST   /api/v1/mcp/search/tags             # 搜索标签
POST   /api/v1/mcp/search/global           # 全局搜索
```

#### 搜索建议和历史
```
GET    /api/v1/mcp/search/suggestions      # 获取搜索建议
GET    /api/v1/mcp/search/recent           # 获取最近搜索
POST   /api/v1/mcp/search/index/refresh    # 刷新搜索索引
```

### 系统管理API

#### 健康检查和状态
```
GET    /api/v1/health                      # 系统健康检查
GET    /api/v1/status                      # 系统状态信息
GET    /api/v1/version                     # 获取系统版本
```

#### 日志和监控
```
GET    /api/v1/logs                        # 获取系统日志
GET    /api/v1/metrics                     # 获取系统指标
GET    /api/v1/performance                 # 性能监控数据
```

#### 配置管理
```
GET    /api/v1/config                      # 获取系统配置
PUT    /api/v1/config                      # 更新系统配置
POST   /api/v1/config/reset                # 重置配置为默认值
```

## 前端路由配置

### 主要页面路由

#### 首页和导航
```
/                                          # 首页 - 项目概览
/dashboard                                 # 控制台主页
/projects                                  # 项目列表页面
/projects/:id                              # 项目详情页面
/projects/:id/edit                         # 编辑项目页面
/projects/new                              # 创建新项目页面
```

#### API管理页面
```
/apis                                      # API列表页面
/apis/:id                                  # API详情页面
/apis/:id/edit                             # 编辑API页面
/apis/new                                  # 创建新API页面
/projects/:projectId/apis                  # 项目下的API列表
/projects/:projectId/apis/new              # 在项目下创建API
```

#### 标签管理页面
```
/tags                                      # 标签管理页面
/tags/:id                                  # 标签详情页面
/tags/new                                  # 创建新标签页面
```

#### 导入功能页面
```
/import                                    # 导入首页
/import/swagger                            # Swagger导入页面
/import/openapi                            # OpenAPI导入页面
/import/postman                            # Postman导入页面
/import/batch                              # 批量导入页面
/import/history                            # 导入历史页面
```

#### AI功能页面
```
/ai                                        # AI功能概览
/ai/document-parser                        # 文档解析页面
/ai/batch-import                           # AI批量导入页面
/ai/sql-generator                          # SQL生成器页面
/ai/templates                              # 代码模板管理
/ai/templates/:id                          # 模板详情页面
/ai/templates/new                          # 创建新模板页面
/ai/optimization                           # 数据库优化建议
```

#### 数据库管理页面
```
/database                                  # 数据库概览
/database/tables                           # 数据库表列表
/database/tables/:id                       # 数据库表详情
/database/tables/new                       # 创建新表页面
/database/schema                           # 数据库模式设计
/database/migration                        # 数据迁移管理
```

#### Issue管理页面
```
/issues                                    # Issue列表页面
/issues/:id                                # Issue详情页面
/issues/:id/edit                           # 编辑Issue页面
/issues/new                                # 创建新Issue页面
/projects/:projectId/issues                # 项目下的Issue列表
/projects/:projectId/issues/new            # 在项目下创建Issue
/projects/:projectId/issues/:id            # 项目Issue详情
/projects/:projectId/issues/:id/relations  # Issue关联管理页面
```

#### 搜索相关页面
```
/search                                    # 全局搜索页面
/search/projects                           # 项目搜索结果
/search/apis                               # API搜索结果
/search/tags                               # 标签搜索结果
```

#### 系统管理页面
```
/admin                                     # 系统管理首页
/admin/config                              # 系统配置页面
/admin/logs                                # 系统日志页面
/admin/monitoring                          # 系统监控页面
/admin/users                               # 用户管理页面（如果适用）
```

#### 帮助和设置页面
```
/settings                                  # 设置页面
/settings/general                          # 通用设置
/settings/ai                               # AI服务设置
/settings/database                         # 数据库设置
/settings/export                           # 导出设置
/help                                      # 帮助文档
/help/getting-started                      # 入门指南
/help/api-guide                            # API指南
/help/troubleshooting                      # 故障排除
/about                                     # 关于页面
```

## 路由参数说明

### URL参数
- `:id` - 实体的唯一标识符（UUID格式）
- `:projectId` - 项目ID参数
- `:apiId` - API端点ID参数
- `:tagId` - 标签ID参数
- `:jobId` - 批量作业ID参数
- `:issueId` - Issue ID参数
- `:relationId` - 关联关系ID参数

### 查询参数

#### 分页参数
```
?page=1&limit=20                          # 分页查询
?offset=0&limit=50                        # 偏移量分页
```

#### 搜索和过滤参数
```
?search=keyword                           # 关键词搜索
?filter[status]=active                    # 状态过滤
?filter[method]=GET                       # HTTP方法过滤
?filter[project]=uuid                     # 项目过滤
?filter[priority]=HIGH                    # Issue优先级过滤
?filter[issueType]=BUG                    # Issue类型过滤
?filter[assignee]=userId                  # Issue分配人过滤
?sort=created_at&order=desc               # 排序参数
```

#### API特定参数
```
?include=tags,project                     # 包含关联数据
?fields=id,name,description               # 字段选择
?expand=true                              # 展开嵌套数据
```

## 错误处理路由

### 错误页面
```
/404                                      # 页面未找到
/500                                      # 服务器内部错误
/error                                    # 通用错误页面
/unauthorized                             # 未授权访问
/forbidden                                # 禁止访问
```

## 中间件和路由保护

### 认证中间件
- 所有`/api/v1/*`路由都经过身份验证中间件
- 管理员路由需要额外的权限验证
- AI服务路由需要API密钥验证

### 速率限制
- 搜索API限制：每分钟100次请求
- 导入API限制：每小时10次请求
- AI服务API限制：根据配置的提供商限制

### CORS配置
- 开发环境：允许所有来源
- 生产环境：仅允许配置的域名

## WebSocket路由

### 实时通信端点
```
/ws/notifications                         # 系统通知
/ws/batch-progress                        # 批量作业进度
/ws/ai-processing                         # AI处理状态
/ws/search-suggestions                    # 实时搜索建议
```

## 静态资源路由

### 静态文件服务
```
/assets/*                                 # 静态资源文件
/uploads/*                                # 用户上传文件
/downloads/*                              # 可下载文件
/docs/*                                   # 文档资源
```

## 重定向规则

### 常见重定向
```
/                        → /dashboard     # 根路径重定向到控制台
/project/:id             → /projects/:id  # 兼容性重定向
/api/:id                 → /apis/:id      # 兼容性重定向
```

### SEO友好URL
```
/p/:id                   → /projects/:id  # 项目短链接
/a/:id                   → /apis/:id      # API短链接
/t/:id                   → /tags/:id      # 标签短链接
```

此路由文档提供了DevAPI Manager系统中所有路由的完整概览，包括API端点、前端路由、参数说明和配置信息，便于开发者理解和使用系统的路由架构。