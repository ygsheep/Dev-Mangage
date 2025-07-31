# AI智能解析功能设置指南

## 概述

我们为API文档和数据库文档解析添加了AI智能解析功能，相比传统的规则匹配，AI解析可以：

- 🎯 **更高识别率**: 准确识别各种格式的文档
- 🧠 **智能理解**: 理解自然语言描述的API
- 🔧 **灵活适应**: 适应不同的文档结构和格式
- 📊 **置信度评估**: 提供解析结果的可信度评分

## 支持的AI服务

### 1. Ollama (推荐) - 本地部署
**优势**: 完全本地运行，数据安全，无API费用

#### 安装步骤：
```bash
# Windows (使用 winget)
winget install Ollama.Ollama

# 或下载安装包
# 访问 https://ollama.ai/download 下载Windows版本

# 启动服务后拉取推荐模型
ollama pull qwen2.5-coder:7b    # 推荐，性能好
ollama pull qwen2.5-coder:1.5b  # 备选，速度快

# 验证安装
ollama list
```

#### 配置信息：
- **提供商**: Ollama
- **模型**: qwen2.5-coder:7b 或 qwen2.5-coder:1.5b
- **Base URL**: http://localhost:11434

### 2. DeepSeek (推荐) - 在线服务
**优势**: 性价比极高，专门优化代码理解，中文支持好

#### 获取API密钥：
1. 访问 [DeepSeek开放平台](https://platform.deepseek.com/)
2. 注册账号并实名认证
3. 在控制台创建API密钥
4. 首次注册有免费额度

#### 配置信息：
- **提供商**: DeepSeek
- **模型**: deepseek-coder
- **Base URL**: https://api.deepseek.com
- **API密钥**: 从平台获取

### 3. OpenAI - 在线服务
**优势**: 理解能力最强，稳定性好

#### 获取API密钥：
1. 访问 [OpenAI平台](https://platform.openai.com/)
2. 注册账号并充值
3. 创建API密钥

#### 配置信息：
- **提供商**: OpenAI
- **模型**: gpt-3.5-turbo 或 gpt-4
- **Base URL**: https://api.openai.com
- **API密钥**: 从平台获取

## 使用方法

### 1. 配置AI服务

1. 在导入API文档时，点击"解析设置"区域
2. 勾选"使用AI智能解析"
3. 点击"配置"按钮打开AI配置
4. 选择合适的预设或自定义配置
5. 点击"测试连接"验证配置
6. 保存配置

### 2. 导入API文档

1. 选择API文档文件 (.md格式)
2. 确保AI解析已启用
3. 点击"解析文档"
4. 查看解析结果和置信度
5. 确认后导入到项目

### 3. 解析结果说明

- **置信度 ≥ 80%**: 绿色，解析结果非常可靠
- **置信度 60-79%**: 黄色，解析结果基本可靠，建议检查
- **置信度 < 60%**: 红色，建议手动检查和修正

## 支持的文档格式

### API文档示例（AI可识别）

```markdown
# 用户管理API

## 用户登录
**接口地址**: POST /api/v1/auth/login
**功能说明**: 用户通过用户名和密码登录系统

### 请求参数
- username (string, 必填): 用户名或邮箱
- password (string, 必填): 用户密码

### 返回结果
成功时返回用户信息和token:
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": { "id": 1, "username": "admin" }
  }
}

## 获取用户列表
**方法**: GET
**路径**: /api/v1/users
获取系统中所有用户的列表信息
```

### 数据库文档示例（AI可识别）

```markdown
# 数据库设计

## 用户表 (users)
存储用户基础信息

| 字段名 | 类型 | 长度 | 必填 | 说明 |
|--------|------|------|------|------|
| id | BIGINT | - | 是 | 用户ID，主键，自增 |
| username | VARCHAR | 50 | 是 | 用户名，唯一 |
| email | VARCHAR | 100 | 是 | 邮箱地址 |
| password | VARCHAR | 255 | 是 | 加密后的密码 |
| created_at | TIMESTAMP | - | 是 | 创建时间 |

索引：
- PRIMARY KEY (id)
- UNIQUE KEY uk_username (username)
- UNIQUE KEY uk_email (email)
```

## 故障排除

### Ollama相关问题

1. **连接失败**
   ```bash
   # 检查Ollama是否运行
   ollama list
   
   # 重启Ollama服务
   # Windows: 在任务管理器中重启Ollama服务
   ```

2. **模型下载失败**
   ```bash
   # 检查网络连接，使用国内镜像
   export OLLAMA_HOST=0.0.0.0:11434
   ollama pull qwen2.5-coder:7b
   ```

### API服务问题

1. **API密钥无效**
   - 检查密钥是否正确复制
   - 确认账号是否有足够余额
   - 检查密钥是否已过期

2. **网络连接问题**
   - 检查网络连接
   - 确认防火墙设置
   - 对于OpenAI，可能需要科学上网

3. **解析失败**
   - 检查文档格式是否支持
   - 尝试调整AI提供商
   - 降级使用传统解析模式

## 性能优化建议

### 本地部署 (Ollama)
- **推荐配置**: 8GB+ 内存，支持GPU加速更佳
- **模型选择**: 
  - qwen2.5-coder:1.5b (速度优先，4GB内存可用)
  - qwen2.5-coder:7b (精度优先，8GB+内存推荐)

### 在线服务
- **DeepSeek**: 性价比最高，推荐日常使用
- **OpenAI**: 准确率最高，推荐重要文档

## 数据安全说明

- **Ollama**: 完全本地运行，数据不会离开本机
- **在线服务**: 文档内容会发送到AI服务商进行处理
- **API密钥**: 仅保存在浏览器本地存储，不会上传到服务器
- **建议**: 敏感项目使用Ollama本地部署

## 成本估算

### DeepSeek定价 (2024年参考)
- 输入: ¥0.0014/1K tokens
- 输出: ¥0.002/1K tokens
- 一般API文档解析成本: ¥0.01-0.1元

### OpenAI定价 (GPT-3.5-turbo)
- 输入: $0.0015/1K tokens  
- 输出: $0.002/1K tokens
- 成本约为DeepSeek的5-10倍

## 更新日志

- **v1.0.0**: 初始版本，支持Ollama、DeepSeek、OpenAI
- 支持API文档智能解析
- 支持置信度评估
- 支持配置持久化保存