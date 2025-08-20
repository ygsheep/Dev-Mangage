# 用户管理系统

## 用户表 (users)

用于存储系统用户的基本信息

| 字段名 | 类型 | 长度 | 是否必填 | 默认值 | 说明 |
|--------|------|------|----------|--------|------|
| id | INT | - | 是 | - | 主键，自增 |
| username | VARCHAR | 50 | 是 | - | 用户名，唯一 |
| email | VARCHAR | 100 | 是 | - | 邮箱地址 |
| password | VARCHAR | 255 | 是 | - | 密码哈希 |
| status | ENUM | - | 是 | 'active' | 用户状态 |
| created_at | TIMESTAMP | - | 是 | CURRENT_TIMESTAMP | 创建时间 |

## 角色表 (roles)

定义系统中的各种角色

| 字段名 | 类型 | 长度 | 是否必填 | 默认值 | 说明 |
|--------|------|------|----------|--------|------|
| id | INT | - | 是 | - | 主键，自增 |
| name | VARCHAR | 50 | 是 | - | 角色名称 |
| description | TEXT | - | 否 | NULL | 角色描述 |