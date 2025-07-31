# 用户管理API文档

## 用户登录 - POST /api/v1/auth/login
用户登录接口，支持用户名/邮箱登录

### 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| username | string | 是 | 用户名或邮箱 |
| password | string | 是 | 密码 |

### 响应示例
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com"
    }
  }
}
```

## 获取用户信息 - GET /api/v1/user/profile
获取当前登录用户的详细信息

### 请求头
| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| Authorization | string | 是 | Bearer token |

### 响应示例
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "avatar": "https://example.com/avatar.jpg",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

## 更新用户信息 - PUT /api/v1/user/profile
更新当前登录用户的信息

### 请求参数
```json
{
  "username": "newusername",
  "email": "newemail@example.com",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

## 用户列表 - GET /api/v1/users
获取用户列表，支持分页和搜索

### 查询参数
| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认10 |
| search | string | 否 | 搜索关键词 |

## 删除用户 - DELETE /api/v1/users/{id}
删除指定用户

### 路径参数
| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| id | number | 是 | 用户ID |