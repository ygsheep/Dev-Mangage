# 用户管理系统数据库设计

## 用户表 (users)
用于存储系统用户基本信息

| 字段名 | 类型 | 长度 | 是否为空 | 默认值 | 说明 |
|--------|------|------|----------|--------|------|
| id | INT | - | NOT NULL | AUTO_INCREMENT | 用户ID，主键 |
| username | VARCHAR | 50 | NOT NULL | - | 用户名，唯一 |
| email | VARCHAR | 100 | NOT NULL | - | 邮箱地址，唯一 |
| password | VARCHAR | 255 | NOT NULL | - | 密码哈希 |
| created_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

## 用户资料表 (user_profiles)
存储用户详细资料信息

| 字段名 | 类型 | 长度 | 是否为空 | 默认值 | 说明 |
|--------|------|------|----------|--------|------|
| id | INT | - | NOT NULL | AUTO_INCREMENT | 资料ID，主键 |
| user_id | INT | - | NOT NULL | - | 用户ID，外键关联users.id |
| first_name | VARCHAR | 50 | NULL | - | 名字 |
| last_name | VARCHAR | 50 | NULL | - | 姓氏 |
| phone | VARCHAR | 20 | NULL | - | 电话号码 |
| avatar | VARCHAR | 255 | NULL | - | 头像URL |
| bio | TEXT | - | NULL | - | 个人简介 |

## 索引设计
- users表：username、email字段建立唯一索引
- user_profiles表：user_id字段建立普通索引