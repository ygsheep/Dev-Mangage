# 羊咩快报 - Django后端API接口设计

## API设计概述

基于RESTful API设计原则，为羊咩快报AI智能音频新闻平台提供完整的后端服务接口。API采用JSON格式进行数据交换，支持JWT身份验证。

API接口按照访问权限分为三大类：
- **前端API（公开）**: 无需认证，支持内容浏览、搜索等基础功能
- **前端API（登录）**: 需要用户认证，支持个性化推荐、用户行为等功能  
- **后端API**: 管理员权限，支持内容管理、用户管理、数据分析等功能

## 接口基础信息

- **基础URL**: `https://api.yangmie.com/v1`
- **认证方式**: JWT Token
- **数据格式**: JSON
- **编码格式**: UTF-8
- **HTTP状态码**: 标准HTTP状态码

## 通用响应格式

### 成功响应
```json
{
    "success": true,
    "code": 200,
    "message": "Success",
    "data": {},
    "timestamp": "2025-07-19T10:30:00Z"
}
```

### 错误响应
```json
{
    "success": false,
    "code": 400,
    "message": "Error message",
    "errors": {
        "field": ["error detail"]
    },
    "timestamp": "2025-07-19T10:30:00Z"
}
```

### 分页响应
```json
{
    "success": true,
    "code": 200,
    "message": "Success",
    "data": {
        "results": [],
        "pagination": {
            "page": 1,
            "page_size": 20,
            "total": 100,
            "total_pages": 5,
            "has_next": true,
            "has_previous": false
        }
    },
    "timestamp": "2025-07-19T10:30:00Z"
}
```

---

# 前端API（公开）

以下API无需身份验证，前端可直接调用，主要用于内容展示、搜索等基础功能。

## 1. 内容展示模块 (Public Content)

### 1.1 获取分类列表
```http
GET /categories
```

**查询参数**:
- `parent_id`: 父分类ID (可选)
- `is_active`: 是否激活 (可选)

**响应数据**:
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "音乐",
            "name_en": "Music",
            "description": "各类音乐内容",
            "icon_url": "https://example.com/icon.png",
            "color_code": "#4CD964",
            "children": [
                {
                    "id": 2,
                    "name": "流行音乐",
                    "name_en": "Pop Music"
                }
            ]
        }
    ]
}
```

### 1.2 获取公开内容列表
```http
GET /content/public
```

**查询参数**:
- `page`: 页码 (默认: 1)
- `page_size`: 每页数量 (默认: 20)
- `category_id`: 分类筛选 (可选)
- `type`: 内容类型 audio|video|article (可选)
- `sort`: 排序方式 latest|popular|hot|duration

### 1.3 获取热门内容
```http
GET /content/trending
```

**查询参数**:
- `period`: 时间范围 day|week|month|all
- `category_id`: 分类筛选
- `limit`: 返回数量 (默认: 20, 最大: 100)

### 1.4 获取内容详情
```http
GET /content/{content_id}
```

**响应数据**:
```json
{
    "success": true,
    "data": {
        "id": 1,
        "title": "音频标题",
        "description": "详细描述",
        "cover_url": "https://example.com/cover.jpg",
        "audio_url": "https://example.com/audio.mp3",
        "duration": 180,
        "file_size": 5242880,
        "bitrate": 320,
        "format": "mp3",
        "transcript": "文本内容",
        "language": "zh-CN",
        "artist": {
            "id": 1,
            "name": "艺术家名称",
            "bio": "艺术家简介",
            "avatar_url": "https://example.com/artist.jpg"
        },
        "category": {
            "id": 1,
            "name": "音乐",
            "color_code": "#4CD964"
        },
        "tags": [
            {
                "id": 1,
                "name": "流行",
                "color_code": "#FF3B30"
            }
        ],
        "stats": {
            "play_count": 1000,
            "like_count": 50,
            "download_count": 20,
            "share_count": 10
        },
        "is_premium": false,
        "created_at": "2025-07-19T10:30:00Z"
    }
}
```

### 1.5 搜索内容
```http
GET /content/search
```

**查询参数**:
- `q`: 搜索关键词 (必需)
- `type`: 搜索类型 all|audio|artist|album|playlist
- `category_id`: 分类筛选
- `page`: 页码
- `page_size`: 每页数量

### 1.6 获取搜索建议
```http
GET /search/suggestions
```

**查询参数**:
- `q`: 查询关键词
- `limit`: 建议数量 (默认: 5)

**响应数据**:
```json
{
    "success": true,
    "data": {
        "suggestions": [
            {
                "text": "建议搜索词",
                "type": "artist",
                "highlight": "<em>关键</em>词"
            }
        ]
    }
}
```

### 1.2 获取推荐内容（支持多媒体类型和新分类/标签体系）
```http
GET /content/recommend
```
**查询参数**:
- `type`: 内容类型 audio|video|article (可选)
- `category_id`: 分类ID (可选)
- `tag`: 标签 (可选，支持单标签)
- `sort`: 排序方式 published_at|hot|popular (可选)
- `page`: 页码 (可选)
- `page_size`: 每页数量 (可选)

**示例请求**:
- 推荐音频内容：`/content/recommend?type=audio`
- 推荐某分类下视频：`/content/recommend?type=video&category_id=2`
- 推荐带标签的文章：`/content/recommend?type=article&tag=AI`

---

### 1.3 获取分类内容（支持多媒体类型和新分类/标签体系）
```http
GET /content/category/{category_id}
```
**查询参数**:
- `type`: 内容类型 audio|video|article (可选)
- `tag`: 标签 (可选)
- `sort`: 排序方式 published_at|hot|popular (可选)
- `page`: 页码 (可选)
- `page_size`: 每页数量 (可选)

**示例请求**:
- 分类下音频内容：`/content/category/2?type=audio`
- 分类下带标签内容：`/content/category/2?tag=科技`

---

### 1.4 搜索内容（支持多媒体类型和新分类/标签体系）
```http
GET /content/search
```
**查询参数**:
- `q`: 搜索关键词 (必需)
- `type`: 搜索类型 audio|video|article (可选)
- `category_id`: 分类ID (可选)
- `tag`: 标签 (可选)
- `page`: 页码 (可选)
- `page_size`: 每页数量 (可选)

**示例请求**:
- 搜索AI相关视频：`/content/search?q=AI&type=video`
- 搜索某分类下文章：`/content/search?q=新闻&type=article&category_id=2`

---

### 1.5 响应数据示例
```json
{
    "success": true,
    "data": {
        "results": [
            {
                "id": 1,
                "type": "audio",
                "title": "AI驱动的新闻推荐系统正式上线",
                "summary": "AI推荐系统助力个性化资讯推送，用户满意度大幅提升",
                "source": "羊咩快报",
                "category": 2,
                "tags": ["AI", "推荐算法"],
                "published_at": "2025-07-20T10:00:00Z",
                "importance_score": 0.98,
                "sentiment_score": 0.95,
                ...
            }
        ],
        "pagination": {
            "page": 1,
            "page_size": 10,
            "total": 100,
            "total_pages": 10,
            "has_next": true,
            "has_previous": false
        }
    },
    "timestamp": "2025-07-20T10:30:00Z"
}
```

---

### 1.6 前端API调用示例（JavaScript/uni.request/axios）

```js
// 推荐内容（音频）
http.get('/content/recommend', { type: 'audio', page: 1, page_size: 10 })
  .then(res => {
    if (res.success) {
      // 渲染内容
      console.log(res.data.results)
    }
  })

// 分类内容（视频）
http.get('/content/category/2', { type: 'video', tag: '科技' })
  .then(res => {
    if (res.success) {
      // 渲染内容
    }
  })

// 搜索内容（文章）
http.get('/content/search', { q: 'AI', type: 'article', category_id: 2 })
  .then(res => {
    if (res.success) {
      // 渲染内容
    }
  })
```

---

### 1.7 自动生成接口文档
- 推荐使用 drf-spectacular 或 drf-yasg 自动生成 OpenAPI/Swagger 文档
- 访问 `/schema/` 或 `/docs/` 查看接口文档
- 所有接口参数、响应结构、示例均自动同步最新代码

## 2. AI内容模块 (Public AI)

### 2.1 获取AI音频内容
```http
GET /ai/audio/{content_id}
```

### 2.2 获取AI解说文本
```http
GET /ai/commentary/{content_id}
```

### 2.3 获取内容转录文本
```http
GET /content/{content_id}/transcript
```

---

# 前端API（登录）

以下API需要用户身份验证，主要用于个性化功能、用户行为记录等。

## 3. 用户认证模块 (Authentication)

### 3.1 用户注册
```http
POST /auth/register
```

**请求参数**:
```json
{
    "username": "user123",
    "email": "user@example.com",
    "password": "password123",
    "password_confirm": "password123",
    "nickname": "用户昵称",
    "phone": "13800138000"
}
```

### 3.2 用户登录
```http
POST /auth/login
```

**请求参数**:
```json
{
    "login": "user123",
    "password": "password123",
    "device_info": {
        "device_type": "mobile",
        "device_id": "unique_device_id",
        "platform": "ios"
    }
}
```

### 3.3 Token刷新
```http
POST /auth/refresh
Authorization: Bearer {refresh_token}
```

### 3.4 用户注销
```http
POST /auth/logout
Authorization: Bearer {token}
```

### 3.5 密码重置
```http
POST /auth/password/reset
```

**请求参数**:
```json
{
    "email": "user@example.com"
}
```

## 4. 用户资料模块 (User Profile)

### 4.1 获取用户资料
```http
GET /users/profile
Authorization: Bearer {token}
```

### 4.2 更新用户资料
```http
PUT /users/profile
Authorization: Bearer {token}
```

**请求参数**:
```json
{
    "nickname": "新昵称",
    "bio": "新的个人简介",
    "birth_date": "1990-01-01",
    "gender": "male"
}
```

### 4.3 上传头像
```http
POST /users/avatar
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

### 4.4 获取用户偏好设置
```http
GET /users/preferences
Authorization: Bearer {token}
```

### 4.5 更新用户偏好设置
```http
PUT /users/preferences
Authorization: Bearer {token}
```

**请求参数**:
```json
{
    "language": "zh-CN",
    "theme": "dark",
    "audio_quality": "high",
    "auto_play": true,
    "notification_enabled": false
}
```

## 5. 个性化推荐模块 (Personalized Content)

### 5.1 获取个性化推荐
```http
GET /recommendations/personalized
Authorization: Bearer {token}
```

**查询参数**:
- `type`: 推荐类型 similar|trending|discovery
- `based_on`: 基于内容ID (可选)
- `limit`: 返回数量 (默认: 10)

### 5.2 获取"为你推荐"内容
```http
GET /content/for-you
Authorization: Bearer {token}
```

### 5.3 获取最近播放
```http
GET /users/recent-played
Authorization: Bearer {token}
```

## 6. 用户行为模块 (User Behavior)

### 6.1 收藏/取消收藏
```http
POST /content/{content_id}/favorite
Authorization: Bearer {token}
```

### 6.2 点赞/取消点赞
```http
POST /content/{content_id}/like
Authorization: Bearer {token}
```

### 6.3 分享内容
```http
POST /content/{content_id}/share
Authorization: Bearer {token}
```

**请求参数**:
```json
{
    "platform": "wechat",
    "message": "分享消息"
}
```

### 6.4 评论内容
```http
POST /content/{content_id}/comments
Authorization: Bearer {token}
```

**请求参数**:
```json
{
    "content": "评论内容",
    "parent_id": null
}
```

### 6.5 获取内容评论
```http
GET /content/{content_id}/comments
Authorization: Bearer {token} (可选)
```

### 6.6 关注/取消关注用户
```http
POST /users/{user_id}/follow
Authorization: Bearer {token}
```

## 7. 播放控制模块 (Player Control)

### 7.1 记录播放行为
```http
POST /player/play
Authorization: Bearer {token}
```

**请求参数**:
```json
{
    "content_id": 1,
    "play_duration": 120,
    "completion_rate": 66.67,
    "device_type": "mobile",
    "playlist_id": 1,
    "source": "recommendation"
}
```

### 7.2 获取播放历史
```http
GET /player/history
Authorization: Bearer {token}
```

### 7.3 更新播放进度
```http
PUT /player/progress
Authorization: Bearer {token}
```

**请求参数**:
```json
{
    "content_id": 1,
    "progress": 60,
    "is_playing": true
}
```

## 8. 用户收藏和播放列表模块 (User Collections)

### 8.1 获取收藏列表
```http
GET /users/favorites
Authorization: Bearer {token}
```

### 8.2 获取用户播放列表
```http
GET /users/playlists
Authorization: Bearer {token}
```

### 8.3 创建播放列表
```http
POST /users/playlists
Authorization: Bearer {token}
```

**请求参数**:
```json
{
    "name": "我的播放列表",
    "description": "播放列表描述",
    "is_public": false,
    "cover_url": "https://example.com/playlist.jpg"
}
```

### 8.4 更新播放列表
```http
PUT /users/playlists/{playlist_id}
Authorization: Bearer {token}
```

### 8.5 删除播放列表
```http
DELETE /users/playlists/{playlist_id}
Authorization: Bearer {token}
```

### 8.6 添加内容到播放列表
```http
POST /users/playlists/{playlist_id}/contents
Authorization: Bearer {token}
```

**请求参数**:
```json
{
    "content_ids": [1, 2, 3]
}
```

### 8.7 从播放列表移除内容
```http
DELETE /users/playlists/{playlist_id}/contents/{content_id}
Authorization: Bearer {token}
```

## 9. AI功能模块 (Authenticated AI Features)

### 9.1 语音合成
```http
POST /ai/tts
Authorization: Bearer {token}
```

**请求参数**:
```json
{
    "text": "要合成的文本内容",
    "voice_type": "standard_female",
    "speed": 1.0,
    "pitch": 1.0,
    "content_id": 1
}
```

### 9.2 获取TTS任务状态
```http
GET /ai/tts/{task_id}
Authorization: Bearer {token}
```

### 9.3 个性化AI推荐
```http
GET /ai/recommend/personal
Authorization: Bearer {token}
```

## 10. 通知模块 (Notifications)

### 10.1 获取通知列表
```http
GET /notifications
Authorization: Bearer {token}
```

### 10.2 标记通知已读
```http
PUT /notifications/{notification_id}/read
Authorization: Bearer {token}
```

### 10.3 获取未读通知数量
```http
GET /notifications/unread/count
Authorization: Bearer {token}
```

---

# 后端API

以下API需要管理员权限，主要用于内容管理、用户管理、数据分析等后台功能。

## 11. 内容管理模块 (Content Management)

### 11.1 内容CRUD操作

**创建内容**
```http
POST /admin/content
Authorization: Bearer {admin_token}
```

**请求参数**:
```json
{
    "title": "内容标题",
    "description": "内容描述",
    "content_type": "audio",
    "category_id": 1,
    "tags": ["流行", "音乐"],
    "source_url": "https://example.com/source.mp3",
    "artist_name": "艺术家名称",
    "is_premium": false,
    "status": "published"
}
```

**获取内容列表（管理）**
```http
GET /admin/content
Authorization: Bearer {admin_token}
```

**查询参数**:
- `page`: 页码
- `page_size`: 每页数量
- `status`: 状态筛选 (published|draft|archived|deleted)
- `category_id`: 分类筛选
- `date_from`: 创建日期开始
- `date_to`: 创建日期结束
- `search`: 搜索关键词

**更新内容**
```http
PUT /admin/content/{content_id}
Authorization: Bearer {admin_token}
```

**删除内容**
```http
DELETE /admin/content/{content_id}
Authorization: Bearer {admin_token}
```

### 11.2 批量操作

**批量导入内容**
```http
POST /admin/content/batch-import
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data
```

**批量更新状态**
```http
PUT /admin/content/batch-status
Authorization: Bearer {admin_token}
```

**请求参数**:
```json
{
    "content_ids": [1, 2, 3],
    "status": "published"
}
```

### 11.3 分类管理

**创建分类**
```http
POST /admin/categories
Authorization: Bearer {admin_token}
```

**更新分类**
```http
PUT /admin/categories/{category_id}
Authorization: Bearer {admin_token}
```

**删除分类**
```http
DELETE /admin/categories/{category_id}
Authorization: Bearer {admin_token}
```

## 12. AI内容生成管理模块 (AI Generation Management)

### 12.1 AI任务管理

**触发AI解说生成**
```http
POST /admin/ai/generate-commentary
Authorization: Bearer {admin_token}
```

**请求参数**:
```json
{
    "content_id": 1,
    "style": "professional",
    "length": "medium",
    "voice_type": "standard_female"
}
```

**触发AI音频生成**
```http
POST /admin/ai/generate-audio
Authorization: Bearer {admin_token}
```

**触发AI视频生成**
```http
POST /admin/ai/generate-video
Authorization: Bearer {admin_token}
```

**获取AI任务状态**
```http
GET /admin/ai/tasks
Authorization: Bearer {admin_token}
```

**查询参数**:
- `status`: 任务状态 (pending|processing|completed|failed)
- `task_type`: 任务类型 (commentary|audio|video)
- `page`: 页码

**更新任务状态**
```http
PUT /admin/ai/tasks/{task_id}
Authorization: Bearer {admin_token}
```

## 13. 用户管理模块 (User Management)

### 13.1 用户CRUD操作

**获取用户列表**
```http
GET /admin/users
Authorization: Bearer {admin_token}
```

**查询参数**:
- `page`: 页码
- `page_size`: 每页数量
- `status`: 用户状态 (active|inactive|banned)
- `is_premium`: 是否会员
- `date_from`: 注册日期开始
- `date_to`: 注册日期结束
- `search`: 搜索关键词

**获取用户详情**
```http
GET /admin/users/{user_id}
Authorization: Bearer {admin_token}
```

**更新用户状态**
```http
PUT /admin/users/{user_id}/status
Authorization: Bearer {admin_token}
```

**请求参数**:
```json
{
    "status": "banned",
    "reason": "违规行为",
    "ban_until": "2025-12-31T23:59:59Z"
}
```

### 13.2 社区管理

**获取评论列表（审核）**
```http
GET /admin/comments
Authorization: Bearer {admin_token}
```

**查询参数**:
- `status`: 审核状态 (pending|approved|rejected)
- `content_id`: 内容ID筛选
- `user_id`: 用户ID筛选

**审核评论**
```http
PUT /admin/comments/{comment_id}/moderate
Authorization: Bearer {admin_token}
```

**请求参数**:
```json
{
    "action": "approve",
    "reason": "审核原因"
}
```

**获取举报列表**
```http
GET /admin/reports
Authorization: Bearer {admin_token}
```

**处理举报**
```http
PUT /admin/reports/{report_id}/resolve
Authorization: Bearer {admin_token}
```

## 14. 数据分析模块 (Analytics)

### 14.1 内容分析

**内容性能分析**
```http
GET /admin/analytics/content
Authorization: Bearer {admin_token}
```

**查询参数**:
- `period`: 时间范围 (day|week|month|quarter|year)
- `content_id`: 特定内容分析
- `category_id`: 分类分析

**响应数据**:
```json
{
    "success": true,
    "data": {
        "total_plays": 10000,
        "unique_listeners": 5000,
        "avg_completion_rate": 75.5,
        "top_content": [
            {
                "id": 1,
                "title": "热门内容",
                "play_count": 1000,
                "like_count": 50
            }
        ],
        "category_distribution": [
            {
                "category": "音乐",
                "percentage": 45.2
            }
        ]
    }
}
```

### 14.2 用户行为分析

**用户行为分析**
```http
GET /admin/analytics/users
Authorization: Bearer {admin_token}
```

**参与度分析**
```http
GET /admin/analytics/engagement
Authorization: Bearer {admin_token}
```

### 14.3 收入分析

**收入分析**
```http
GET /admin/analytics/revenue
Authorization: Bearer {admin_token}
```

## 15. 系统配置模块 (System Configuration)

### 15.1 系统设置

**获取系统配置**
```http
GET /admin/system/configs
Authorization: Bearer {admin_token}
```

**更新系统配置**
```http
PUT /admin/system/configs
Authorization: Bearer {admin_token}
```

**请求参数**:
```json
{
    "site_name": "羊咩快报",
    "max_upload_size": 50,
    "ai_generation_enabled": true,
    "auto_moderation": false,
    "premium_features": ["高音质", "无广告", "离线下载"]
}
```

### 15.2 文件管理

**获取文件列表**
```http
GET /admin/files
Authorization: Bearer {admin_token}
```

**删除文件**
```http
DELETE /admin/files/{file_id}
Authorization: Bearer {admin_token}
```

---

## CRUD操作总结

### 前端API（公开）
- **只读操作**: 主要提供 `GET` 操作，包括内容浏览、搜索、分类查看等
- **无需认证**: 支持游客用户访问基础内容

### 前端API（登录）  
- **创建操作**: 用户注册、播放列表创建、评论发布、收藏添加等
- **读取操作**: 个人资料、收藏列表、播放历史、个性化推荐等
- **更新操作**: 用户资料更新、播放进度更新、偏好设置等
- **删除操作**: 播放列表删除、收藏移除、评论删除等

### 后端API
- **完整CRUD**: 所有资源的增删改查操作
  - 内容管理：创建、编辑、删除、批量操作
  - 用户管理：查看、状态更新、权限管理
  - 系统配置：设置更新、功能开关
  - 数据分析：只读，提供各种统计分析

## 错误码定义

| 错误码 | HTTP状态码 | 说明 |
|--------|------------|------|
| 200 | 200 | 请求成功 |
| 400 | 400 | 请求参数错误 |
| 401 | 401 | 未授权/Token失效 |
| 403 | 403 | 禁止访问 |
| 404 | 404 | 资源不存在 |
| 409 | 409 | 资源冲突 |
| 422 | 422 | 请求参数验证失败 |
| 429 | 429 | 请求频率限制 |
| 500 | 500 | 服务器内部错误 |
| 1001 | 400 | 用户名已存在 |
| 1002 | 400 | 邮箱已存在 |
| 1003 | 400 | 密码格式不正确 |
| 2001 | 404 | 内容不存在 |
| 2002 | 403 | 内容需要付费 |
| 3001 | 400 | 文件格式不支持 |
| 3002 | 400 | 文件大小超限 |
| 4001 | 429 | TTS请求频率限制 |
| 4002 | 500 | TTS服务不可用 |

## API限流策略

- **未认证用户**: 每分钟100请求
- **普通用户**: 每分钟500请求
- **付费用户**: 每分钟1000请求
- **管理员**: 每分钟2000请求
- **TTS接口**: 每用户每小时50次
- **上传接口**: 每用户每天100个文件

## Django实现要点

### 1. 项目结构
```
yangmie_backend/
├── yangmie/
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── development.py
│   │   ├── production.py
│   │   └── testing.py
│   ├── urls.py
│   └── wsgi.py
├── apps/
│   ├── authentication/
│   ├── users/
│   ├── content/
│   ├── playlists/
│   ├── player/
│   ├── ai/
│   ├── analytics/
│   └── admin_panel/
├── common/
│   ├── permissions.py
│   ├── pagination.py
│   ├── serializers.py
│   └── utils.py
├── requirements/
│   ├── base.txt
│   ├── development.txt
│   └── production.txt
└── manage.py
```

### 2. 关键Django包
```txt
Django>=4.2.0
djangorestframework>=3.14.0
djangorestframework-simplejwt>=5.2.0
django-cors-headers>=4.0.0
django-filter>=23.0
django-extensions>=3.2.0
celery>=5.3.0
redis>=4.5.0
Pillow>=10.0.0
gunicorn>=21.0.0
psycopg2-binary>=2.9.0
```

### 3. 认证配置
```python
# settings/base.py
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'common.pagination.StandardResultsSetPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
}
```

### 4. 权限控制
```python
# common/permissions.py
class IsOwnerOrReadOnly(BasePermission):
    """只有所有者可以编辑，其他人只读"""
    
class IsAdminUser(BasePermission):
    """只有管理员可以访问"""
    
class IsPublicOrAuthenticated(BasePermission):
    """公开内容或认证用户可访问"""
```

---

*此文档随开发进展持续更新*

---

## 接口变更日志

- 2025-07-20：前端公开API全部放行，无需登录；分类、内容、搜索等接口权限调整为AllowAny。
- 2025-07-20：/categories 分类数据批量插入演示数据（关注、推荐、资讯）。
- 2025-07-20：/content/category/{category_id} 路由修正，支持分页、排序、时长筛选，接口文档美化。
- 2025-07-20：所有@extend_schema的examples参数改为OpenApiExample，修复drf-spectacular schema生成报错。
- 2025-07-20：接口文档示例美化，Mock数据更贴近真实业务。
- 2025-07-20：UserProfile.user字段由ForeignKey(unique=True)改为OneToOneField。
- 2025-07-20：REST_FRAMEWORK只用JSONRenderer，避免browsable API模板报错。