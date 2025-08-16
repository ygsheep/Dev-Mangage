// AI解析服务 - 使用小模型进行智能文档解析
import { API, HTTPMethod, APIStatus, DatabaseTable } from '@shared/types'

export interface AIParsingConfig {
  provider: 'ollama' | 'deepseek' | 'openai' | 'mock'
  model: string
  baseUrl?: string
  apiKey?: string
}

// 模型Token限制配置
export interface ModelLimits {
  maxTokens: number      // 模型最大token数
  reserveTokens: number  // 为响应预留的token数
  maxInputTokens: number // 实际可用于输入的token数
}

// AI模型限制配置
export const AI_MODEL_LIMITS: Record<string, ModelLimits> = {
  'ollama': { 
    maxTokens: 4096, 
    reserveTokens: 1024, 
    maxInputTokens: 3072 
  },
  'deepseek': { 
    maxTokens: 16384, 
    reserveTokens: 2048, 
    maxInputTokens: 14336 
  },
  'openai': { 
    maxTokens: 16384, 
    reserveTokens: 2048, 
    maxInputTokens: 14336 
  },
  'mock': { 
    maxTokens: 8192, 
    reserveTokens: 1024, 
    maxInputTokens: 7168 
  }
}

// 文档分块结果接口
export interface DocumentChunk {
  content: string
  index: number
  type: 'header' | 'api' | 'content'
  title?: string
  estimatedTokens: number
}

// 分块处理结果接口
export interface ChunkedParseResult {
  totalChunks: number
  processedChunks: number
  failedChunks: number
  results: ParsedAPIDocument[]
  errors: string[]
}

export interface ParsedAPIDocument {
  apis: API[]
  success: boolean
  errors: string[]
  confidence: number
}

export interface ParsedDatabaseDocument {
  tables: ParsedDatabaseTable[]
  relationships: DatabaseRelationship[]
  indexes: DatabaseIndex[]
  success: boolean
  errors: string[]
  confidence: number
}

export interface ParsedDatabaseTable {
  id: string
  name: string
  displayName: string
  comment?: string
  engine?: string
  charset?: string
  fields: DatabaseField[]
  constraints: DatabaseConstraint[]
  indexes: TableIndex[]
  source?: string
  sqlDefinition?: string
}

export interface DatabaseField {
  name: string
  type: string
  length?: number | null
  nullable: boolean
  primaryKey: boolean
  autoIncrement: boolean
  unique?: boolean
  defaultValue?: any
  comment?: string
}

export interface DatabaseConstraint {
  type: string
  column?: string
  referencedTable?: string
  referencedColumn?: string
  definition?: string
}

export interface TableIndex {
  name: string
  columns: string[]
  type: string
  unique?: boolean
}

export interface DatabaseIndex {
  name: string
  table: string
  columns: string[]
  unique: boolean
  type?: string
}

export interface DatabaseRelationship {
  type: string
  fromTable?: string
  fromColumn: string
  toTable: string
  toColumn: string
}

class AIParsingService {
  private config: AIParsingConfig

  constructor(config: AIParsingConfig) {
    this.config = config
  }

  /**
   * 简单Token估算 (中文字符按2个token计算，英文按0.75个token计算)
   */
  private estimateTokenCount(text: string): number {
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
    const otherChars = text.length - chineseChars
    return Math.ceil(chineseChars * 2 + otherChars * 0.75)
  }

  /**
   * 获取当前模型的Token限制
   */
  private getModelLimits(): ModelLimits {
    const limits = AI_MODEL_LIMITS[this.config.provider]
    if (!limits) {
      console.warn(`未找到${this.config.provider}的Token限制配置，使用默认配置`)
      return AI_MODEL_LIMITS.ollama
    }
    return limits
  }

  /**
   * 智能文档分块策略
   */
  private chunkDocument(content: string): DocumentChunk[] {
    const limits = this.getModelLimits()
    const promptTokens = this.estimateTokenCount(this.getAPIParsingPrompt())
    const availableTokens = limits.maxInputTokens - promptTokens
    
    console.log('分块分析:', {
      provider: this.config.provider,
      maxInputTokens: limits.maxInputTokens,
      promptTokens,
      availableTokens,
      contentLength: content.length,
      estimatedContentTokens: this.estimateTokenCount(content)
    })

    // 如果内容长度在限制内，直接返回单个块
    const contentTokens = this.estimateTokenCount(content)
    if (contentTokens <= availableTokens) {
      return [{
        content,
        index: 0,
        type: 'content',
        title: '完整文档',
        estimatedTokens: contentTokens
      }]
    }

    // 需要分块处理
    const chunks: DocumentChunk[] = []
    const lines = content.split('\n')
    let currentChunk = ''
    let currentTokens = 0
    let chunkIndex = 0

    // 策略1: 按章节分块 (优先级最高)
    const sections = this.splitByHeaders(content)
    if (sections.length > 1) {
      return this.chunkBySections(sections, availableTokens)
    }

    // 策略2: 按API接口分块
    const apiBlocks = this.extractAPIBlocks(content)
    if (apiBlocks.length > 1) {
      return this.chunkByAPIs(apiBlocks, availableTokens)
    }

    // 策略3: 按段落分块 (保留重叠)
    return this.chunkByParagraphs(content, availableTokens)
  }

  /**
   * 按标题章节分块
   */
  private splitByHeaders(content: string): Array<{title: string, content: string}> {
    const sections: Array<{title: string, content: string}> = []
    const lines = content.split('\n')
    let currentSection = { title: '', content: '' }

    for (const line of lines) {
      const headerMatch = line.match(/^#+\s+(.+)$/)
      if (headerMatch) {
        if (currentSection.content.trim()) {
          sections.push(currentSection)
        }
        currentSection = {
          title: headerMatch[1],
          content: line + '\n'
        }
      } else {
        currentSection.content += line + '\n'
      }
    }

    if (currentSection.content.trim()) {
      sections.push(currentSection)
    }

    return sections
  }

  /**
   * 按章节进行分块
   */
  private chunkBySections(sections: Array<{title: string, content: string}>, availableTokens: number): DocumentChunk[] {
    const chunks: DocumentChunk[] = []
    let currentChunk = ''
    let currentTokens = 0
    let chunkIndex = 0

    for (const section of sections) {
      const sectionTokens = this.estimateTokens(section.content)
      
      // 如果当前块加上这个章节会超出限制，先保存当前块
      if (currentTokens + sectionTokens > availableTokens && currentChunk) {
        chunks.push({
          content: currentChunk.trim(),
          index: chunkIndex++,
          type: 'header',
          title: `分块 ${chunkIndex}`,
          estimatedTokens: currentTokens
        })
        currentChunk = ''
        currentTokens = 0
      }

      // 如果单个章节就超出限制，需要进一步分割
      if (sectionTokens > availableTokens) {
        const subChunks = this.chunkByParagraphs(section.content, availableTokens)
        chunks.push(...subChunks.map(chunk => ({
          ...chunk,
          index: chunkIndex++,
          title: section.title
        })))
      } else {
        currentChunk += section.content + '\n'
        currentTokens += sectionTokens
      }
    }

    // 保存最后一个块
    if (currentChunk.trim()) {
      chunks.push({
        content: currentChunk.trim(),
        index: chunkIndex,
        type: 'header',
        title: `分块 ${chunkIndex + 1}`,
        estimatedTokens: currentTokens
      })
    }

    return chunks
  }

  /**
   * 提取API接口块
   */
  private extractAPIBlocks(content: string): Array<{title: string, content: string}> {
    const apiBlocks: Array<{title: string, content: string}> = []
    const lines = content.split('\n')
    let currentBlock = { title: '', content: '' }
    let inAPIBlock = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // 检测API接口定义
      const apiMatch = line.match(/^#{1,4}\s*(.+?)\s*-\s*(GET|POST|PUT|DELETE|PATCH)\s+(.+)$/) ||
                      line.match(/^(GET|POST|PUT|DELETE|PATCH)\s+(.+)$/)
      
      if (apiMatch) {
        // 保存上一个API块
        if (inAPIBlock && currentBlock.content.trim()) {
          apiBlocks.push(currentBlock)
        }
        
        // 开始新的API块
        currentBlock = {
          title: apiMatch[1] || `${apiMatch[1] || apiMatch[0]} API`,
          content: line + '\n'
        }
        inAPIBlock = true
      } else if (inAPIBlock) {
        currentBlock.content += line + '\n'
        
        // 如果遇到下一个API或章节标题，结束当前块
        const nextApiMatch = lines[i + 1]?.match(/^#{1,4}\s*(.+?)\s*-\s*(GET|POST|PUT|DELETE|PATCH)\s+(.+)$/) ||
                            lines[i + 1]?.match(/^(GET|POST|PUT|DELETE|PATCH)\s+(.+)$/)
        const nextHeaderMatch = lines[i + 1]?.match(/^#+\s+(.+)$/)
        
        if (nextApiMatch || nextHeaderMatch) {
          apiBlocks.push(currentBlock)
          inAPIBlock = false
        }
      }
    }

    // 保存最后一个API块
    if (inAPIBlock && currentBlock.content.trim()) {
      apiBlocks.push(currentBlock)
    }

    return apiBlocks
  }

  /**
   * 按API接口分块
   */
  private chunkByAPIs(apiBlocks: Array<{title: string, content: string}>, availableTokens: number): DocumentChunk[] {
    const chunks: DocumentChunk[] = []
    let currentChunk = ''
    let currentTokens = 0
    let chunkIndex = 0

    for (const apiBlock of apiBlocks) {
      const blockTokens = this.estimateTokenCount(apiBlock.content)
      
      // 如果当前块加上这个API会超出限制，先保存当前块
      if (currentTokens + blockTokens > availableTokens && currentChunk) {
        chunks.push({
          content: currentChunk.trim(),
          index: chunkIndex++,
          type: 'api',
          title: `API分块 ${chunkIndex}`,
          estimatedTokens: currentTokens
        })
        currentChunk = ''
        currentTokens = 0
      }

      currentChunk += apiBlock.content + '\n'
      currentTokens += blockTokens
    }

    // 保存最后一个块
    if (currentChunk.trim()) {
      chunks.push({
        content: currentChunk.trim(),
        index: chunkIndex,
        type: 'api',
        title: `API分块 ${chunkIndex + 1}`,
        estimatedTokens: currentTokens
      })
    }

    return chunks
  }

  /**
   * 按段落分块 (带重叠)
   */
  private chunkByParagraphs(content: string, availableTokens: number): DocumentChunk[] {
    const chunks: DocumentChunk[] = []
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim())
    const overlapSize = Math.floor(availableTokens * 0.1) // 10% 重叠
    
    let currentChunk = ''
    let currentTokens = 0
    let chunkIndex = 0
    let overlapContent = ''

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i]
      const paragraphTokens = this.estimateTokenCount(paragraph)
      
      if (currentTokens + paragraphTokens > availableTokens && currentChunk) {
        // 保存当前块
        chunks.push({
          content: currentChunk.trim(),
          index: chunkIndex++,
          type: 'content',
          title: `内容分块 ${chunkIndex}`,
          estimatedTokens: currentTokens
        })
        
        // 准备重叠内容
        const sentences = currentChunk.split(/[。！？.!?]\s*/).slice(-3) // 保留最后3句
        overlapContent = sentences.join('。') + (sentences.length > 0 ? '。' : '')
        
        currentChunk = overlapContent + '\n' + paragraph + '\n'
        currentTokens = this.estimateTokenCount(currentChunk)
      } else {
        currentChunk += paragraph + '\n'
        currentTokens += paragraphTokens
      }
    }

    // 保存最后一个块
    if (currentChunk.trim()) {
      chunks.push({
        content: currentChunk.trim(),
        index: chunkIndex,
        type: 'content',
        title: `内容分块 ${chunkIndex + 1}`,
        estimatedTokens: currentTokens
      })
    }

    return chunks
  }

  /**
   * 估算Token数量的辅助方法
   */
  private estimateTokens(text: string): number {
    return this.estimateTokenCount(text)
  }

  // API文档解析的系统提示词
  private getAPIParsingPrompt(): string {
    return `# 系统角色定义

你是一个专业的API文档解析专家，擅长从各种格式的技术文档中提取和标准化API接口信息。你的任务是将用户提供的API文档内容解析为结构化的JSON格式，确保信息的准确性和完整性。

# 解析目标

请将提供的API文档解析为标准的JSON格式，包含以下核心信息：
- API接口的基本信息（名称、描述、HTTP方法、路径）
- 请求参数（查询参数、路径参数、请求体）
- 响应格式和状态码
- 认证要求
- 示例数据

# 输出格式要求

请严格按照以下JSON格式输出，不要添加任何额外的文本说明：

{
  "apis": [
    {
      "name": "API接口名称",
      "description": "接口功能描述",
      "method": "GET|POST|PUT|DELETE|PATCH",
      "path": "/api/v1/example",
      "category": "接口分类",
      "auth_required": true,
      "parameters": {
        "query": [
          {
            "name": "参数名",
            "type": "string|number|boolean|array|object",
            "required": true,
            "description": "参数描述",
            "example": "示例值"
          }
        ],
        "path": [
          {
            "name": "参数名",
            "type": "string|number",
            "required": true,
            "description": "路径参数描述"
          }
        ],
        "body": {
          "type": "object",
          "properties": {
            "字段名": {
              "type": "数据类型",
              "description": "字段描述",
              "required": true
            }
          }
        }
      },
      "responses": {
        "200": {
          "description": "成功响应",
          "example": {
            "success": true,
            "data": {},
            "message": "操作成功"
          }
        },
        "400": {
          "description": "请求错误",
          "example": {
            "success": false,
            "error": "错误信息"
          }
        }
      },
      "tags": ["标签1", "标签2"]
    }
  ],
  "base_url": "https://api.example.com",
  "version": "v1",
  "auth_type": "Bearer Token|API Key|Basic Auth|None",
  "confidence": 0.95
}

# 解析规则

## 1. 接口识别规则
- 识别HTTP方法关键词：GET、POST、PUT、DELETE、PATCH
- 提取API路径：以 / 开头的URL路径
- 识别接口名称：通常在HTTP方法附近或路径注释中
- 提取接口描述：接口功能说明文字

## 2. 参数解析规则
- 查询参数：URL中 ? 后的参数或文档中明确标注的query参数
- 路径参数：URL路径中的 {param} 或 :param 格式
- 请求体参数：POST/PUT请求的body内容
- 参数类型推断：根据示例值和描述推断数据类型

## 3. 响应格式识别
- 提取HTTP状态码和对应的响应描述
- 识别响应数据结构和示例
- 标准化错误响应格式

## 4. 认证信息提取
- 识别认证方式：Bearer Token、API Key、Basic Auth等
- 提取认证相关的header信息

# 质量检查清单

在输出最终结果前，请确保：
1. ✅ JSON格式正确：语法无误，可以被正确解析
2. ✅ 接口信息完整：name、method、path必须存在
3. ✅ 参数类型准确：根据示例和描述推断正确的数据类型
4. ✅ 路径格式标准：以 / 开头，参数使用 {param} 格式
5. ✅ HTTP方法正确：使用标准的HTTP方法名
6. ✅ 认证信息准确：正确识别是否需要认证
7. ✅ 响应格式统一：包含状态码和示例数据
8. ✅ 描述信息清晰：提供有意义的接口和参数描述

# 注意事项

1. 严格遵循JSON格式：输出必须是有效的JSON，不要包含注释或额外文本
2. 保持信息准确性：如果文档信息不明确，使用合理的默认值
3. 统一命名规范：接口名称使用中文，参数名称保持原文
4. 完整性优先：尽可能提取所有可用信息
5. 错误处理：如果无法解析某个接口，在响应中说明原因

现在请开始解析用户提供的API文档内容。`
  }

  // 数据库文档解析的系统提示词
  private getDatabaseParsingPrompt(): string {
    return `# 数据库文档解析专家

你是一个专业的数据库文档解析专家，擅长从各种格式的数据库设计文档中提取和标准化数据库结构信息。

## 解析目标

请将提供的数据库文档解析为标准的JSON格式，包含以下信息：
- 数据表定义（表名、字段、类型、约束等）
- 索引定义
- 表关系（外键约束）
- 表注释和字段注释

## 输出格式要求

请严格按照以下JSON格式输出，不要添加任何额外的文本说明：

{
  "tables": [
    {
      "name": "table_name",
      "displayName": "表显示名称",
      "comment": "表注释说明",
      "engine": "InnoDB",
      "charset": "utf8mb4",
      "fields": [
        {
          "name": "字段名",
          "type": "数据类型",
          "length": 字段长度,
          "nullable": true/false,
          "primaryKey": true/false,
          "autoIncrement": true/false,
          "unique": true/false,
          "defaultValue": "默认值",
          "comment": "字段注释"
        }
      ],
      "constraints": [
        {
          "type": "FOREIGN_KEY",
          "column": "外键字段",
          "referencedTable": "引用表",
          "referencedColumn": "引用字段"
        }
      ],
      "indexes": [
        {
          "name": "索引名",
          "columns": ["字段1", "字段2"],
          "type": "INDEX",
          "unique": false
        }
      ]
    }
  ],
  "relationships": [
    {
      "type": "one-to-many",
      "fromTable": "源表",
      "fromColumn": "源字段",
      "toTable": "目标表", 
      "toColumn": "目标字段"
    }
  ],
  "indexes": [
    {
      "name": "idx_name",
      "table": "表名",
      "columns": ["字段列表"],
      "unique": false,
      "type": "BTREE"
    }
  ],
  "confidence": 0.95
}

## 解析规则

### 1. 表识别规则
- 识别CREATE TABLE语句
- 识别Markdown中的表标题（如：#### 1.1 用户表 (users)）
- 提取表名、显示名称和注释

### 2. 字段解析规则
- 从SQL DDL语句中提取字段定义
- 从Markdown表格中提取字段信息
- 正确识别数据类型（VARCHAR, INT, BIGINT, TEXT, JSON等）
- 提取字段长度、是否可空、默认值等属性
- 识别主键、外键、唯一约束

### 3. 约束和索引
- 识别PRIMARY KEY、FOREIGN KEY、UNIQUE约束
- 提取INDEX、KEY定义
- 识别复合索引和单列索引

### 4. 关系识别
- 从FOREIGN KEY约束中提取表关系
- 推断一对一、一对多、多对多关系

### 5. 数据类型标准化
- 统一数据类型命名（如：VARCHAR, INT, BIGINT）
- 提取类型长度参数
- 识别枚举类型的可选值

## 质量检查清单

在输出最终结果前，请确保：
1. ✅ JSON格式正确，语法无误
2. ✅ 表名和字段名准确提取
3. ✅ 数据类型正确识别和标准化
4. ✅ 约束关系正确解析
5. ✅ 索引信息完整提取
6. ✅ 注释信息准确获取

## 注意事项

1. 严格遵循JSON格式：输出必须是有效的JSON
2. 保持信息准确性：如果信息不明确，使用合理的默认值
3. 统一命名规范：表名使用snake_case，显示名称使用中文
4. 完整性优先：尽可能提取所有可用信息
5. 错误处理：如果无法解析某个表，在响应中说明原因

现在请开始解析用户提供的数据库文档内容。`
  }

  /**
   * 带重试的API调用
   */
  private async callWithRetry<T>(
    apiCall: () => Promise<T>, 
    maxRetries: number = 3, 
    delayMs: number = 1000,
    context: string = ''
  ): Promise<T> {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`${context} - 尝试 ${attempt}/${maxRetries}`)
        const result = await apiCall()
        
        // 检查是否是token限制错误
        if (this.isTokenLimitError(result)) {
          throw new Error('Token限制错误，需要重新分块')
        }
        
        return result
      } catch (error: any) {
        lastError = error
        console.warn(`${context} - 尝试 ${attempt}/${maxRetries} 失败:`, error.message)
        
        // 如果是最后一次尝试，直接抛出错误
        if (attempt === maxRetries) {
          break
        }
        
        // 根据错误类型决定是否重试
        if (this.shouldRetry(error)) {
          const delay = delayMs * Math.pow(2, attempt - 1) // 指数退避
          console.log(`${context} - 等待 ${delay}ms 后重试...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        } else {
          console.log(`${context} - 错误类型不支持重试，直接失败`)
          break
        }
      }
    }
    
    throw lastError || new Error(`${context} - 重试 ${maxRetries} 次后仍然失败`)
  }

  /**
   * 检查是否是token限制错误
   */
  private isTokenLimitError(result: any): boolean {
    if (typeof result === 'string') {
      return result.toLowerCase().includes('token') && 
             (result.toLowerCase().includes('limit') || result.toLowerCase().includes('exceed'))
    }
    if (result?.error) {
      const errorStr = result.error.toLowerCase()
      return (errorStr.includes('token') && errorStr.includes('limit')) ||
             errorStr.includes('context length') ||
             errorStr.includes('maximum context')
    }
    return false
  }

  /**
   * 判断错误是否应该重试
   */
  private shouldRetry(error: any): boolean {
    const message = error?.message?.toLowerCase() || ''
    const isNetworkError = message.includes('network') || 
                          message.includes('timeout') || 
                          message.includes('connection') ||
                          message.includes('fetch')
    
    const isServerError = error?.status >= 500 && error?.status < 600
    const isRateLimitError = error?.status === 429
    const isTokenError = this.isTokenLimitError(error)
    
    // 不重试的情况
    if (isTokenError || 
        error?.status === 401 || // 认证失败
        error?.status === 403 || // 权限不足
        error?.status === 404) { // 资源不存在
      return false
    }
    
    // 应该重试的情况
    return isNetworkError || isServerError || isRateLimitError
  }

  // 调用Ollama本地模型 - 增强错误处理
  private async callOllama(prompt: string, content: string): Promise<any> {
    const baseUrl = this.config.baseUrl || 'http://localhost:11434'
    
    return await this.callWithRetry(async () => {
      console.log('调用Ollama API:', {
        url: `${baseUrl}/api/generate`,
        model: this.config.model
      })
      
      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model,
          prompt: `${prompt}\n\n文档内容：\n${content}`,
          stream: false,
          options: {
            temperature: 0.1,
            top_p: 0.9
          }
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Ollama请求失败:', response.status, response.statusText, errorText)
        
        // 检查是否是token限制错误
        if (errorText.includes('context length') || errorText.includes('token')) {
          throw new Error(`Token限制错误: ${errorText}`)
        }
        
        const error = new Error(`Ollama请求失败: ${response.status} ${response.statusText}`)
        ;(error as any).status = response.status
        throw error
      }

      const result = await response.json()
      console.log('Ollama原始响应:', result)
      
      const parsedResult = this.parseAIResponse(result.response)
      
      // 如果解析结果包含错误，记录但不抛出异常
      if (!parsedResult.success && parsedResult.errors) {
        console.warn('AI解析包含错误:', parsedResult.errors)
      }
      
      return parsedResult
    }, 3, 2000, 'Ollama API调用')
  }

  // 调用在线API (DeepSeek、OpenAI等) - 增强错误处理
  private async callOnlineAPI(prompt: string, content: string): Promise<any> {
    const { provider, model, apiKey, baseUrl } = this.config
    
    return await this.callWithRetry(async () => {
      let url: string
      let headers: Record<string, string>
      let body: any

      switch (provider) {
        case 'deepseek':
          url = `${baseUrl || 'https://api.deepseek.com'}/v1/chat/completions`
          headers = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
          body = {
            model: model || 'deepseek-coder',
            messages: [
              { role: 'system', content: prompt },
              { role: 'user', content: content }
            ],
            temperature: 0.1
          }
          break

        case 'openai':
          url = `${baseUrl || 'https://api.openai.com'}/v1/chat/completions`
          headers = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
          body = {
            model: model || 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: prompt },
              { role: 'user', content: content }
            ],
            temperature: 0.1
          }
          break

        default:
          throw new Error(`不支持的AI提供商: ${provider}`)
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('在线API请求失败:', response.status, response.statusText, errorText)
        
        // 检查是否是token限制错误
        if (errorText.includes('token') || errorText.includes('context_length')) {
          throw new Error(`Token限制错误: ${errorText}`)
        }
        
        const error = new Error(`API请求失败: ${response.status} ${response.statusText}`)
        ;(error as any).status = response.status
        throw error
      }

      const result = await response.json()
      const content = result.choices?.[0]?.message?.content
      
      if (!content) {
        throw new Error('AI响应格式错误: 未找到有效内容')
      }

      const parsedResult = this.parseAIResponse(content)
      
      // 如果解析结果包含错误，记录但不抛出异常
      if (!parsedResult.success && parsedResult.errors) {
        console.warn('在线API解析包含错误:', parsedResult.errors)
      }
      
      return parsedResult
    }, 3, 2000, `${provider}在线API调用`)
  }

  // 解析AI响应
  private parseAIResponse(response: string): any {
    try {
      console.log('🔍 开始解析AI响应...')
      console.log('📏 原始AI响应长度:', response.length)
      console.log('📄 原始AI响应前500字符:', response.substring(0, 500))
      console.log('📄 原始AI响应后100字符:', response.substring(Math.max(0, response.length - 100)))
      
      // 深度清理响应内容
      let cleanedResponse = response
        .replace(/^\uFEFF/, '') // 移除BOM
        .replace(/^[\s\r\n]+/, '') // 移除开头的所有空白字符
        .replace(/[\s\r\n]+$/, '') // 移除结尾的所有空白字符
      
      console.log('🧹 清理后响应前200字符:', cleanedResponse.substring(0, 200))
      
      // 移除可能的markdown代码块标记
      cleanedResponse = cleanedResponse
        .replace(/^```json\s*/, '')
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '')
      
      console.log('🔤 移除markdown后:', cleanedResponse.substring(0, 200))
      
      // 移除可能的文本说明
      cleanedResponse = cleanedResponse
        .replace(/^[^{\[]*(?=[{\[])/s, '') // 移除JSON/数组前的所有文本
        .replace(/(?<=[}\]])[^}\]]*$/s, '') // 移除JSON/数组后的所有文本
      
      console.log('✨ 最终清理后的响应长度:', cleanedResponse.length)
      console.log('✨ 最终清理后的响应:', cleanedResponse.substring(0, 300) + (cleanedResponse.length > 300 ? '...' : ''))
      
      // 检查是否为空
      if (!cleanedResponse) {
        throw new Error('清理后的响应为空')
      }
      
      // 尝试直接解析
      try {
        const parsed = JSON.parse(cleanedResponse)
        console.log('✅ 直接解析成功:', {
          type: typeof parsed,
          hasApis: parsed?.hasOwnProperty('apis'),
          apisLength: Array.isArray(parsed?.apis) ? parsed.apis.length : 'not array',
          keys: Object.keys(parsed || {})
        })
        return parsed
      } catch (directError) {
        console.log('❌ 直接解析失败:', directError.message)
      }
      
      // 尝试提取JSON对象（更宽松的匹配）
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        console.log('🎯 找到JSON对象匹配:', jsonMatch[0].substring(0, 100) + '...')
        try {
          const parsed = JSON.parse(jsonMatch[0])
          console.log('✅ 对象提取解析成功:', {
            type: typeof parsed,
            hasApis: parsed?.hasOwnProperty('apis'),
            apisLength: Array.isArray(parsed?.apis) ? parsed.apis.length : 'not array',
            keys: Object.keys(parsed || {})
          })
          return parsed
        } catch (jsonError) {
          console.log('❌ 对象提取解析失败:', jsonError.message)
        }
      } else {
        console.log('⚠️ 未找到JSON对象匹配')
      }
      
      // 尝试查找数组格式
      const arrayMatch = cleanedResponse.match(/\[[\s\S]*\]/)
      if (arrayMatch) {
        console.log('🎯 找到数组匹配:', arrayMatch[0].substring(0, 100) + '...')
        try {
          const parsed = JSON.parse(arrayMatch[0])
          console.log('✅ 数组提取解析成功:', {
            type: typeof parsed,
            isArray: Array.isArray(parsed),
            length: Array.isArray(parsed) ? parsed.length : 'not array'
          })
          return { apis: parsed }
        } catch (arrayError) {
          console.log('❌ 数组提取解析失败:', arrayError.message)
        }
      } else {
        console.log('⚠️ 未找到数组匹配')
      }
      
      throw new Error('无法从响应中提取有效的JSON')
    } catch (error) {
      console.error('解析AI响应失败:', error)
      console.error('完整响应内容:', JSON.stringify(response))
      
      // 返回一个默认的错误响应而不是抛出异常
      return {
        apis: [],
        success: false,
        errors: [`AI响应解析失败: ${error.message}。请检查AI模型配置或尝试其他模型。`],
        confidence: 0
      }
    }
  }


  // 带进度的数据库文档解析
  async parseDatabaseDocumentWithProgress(
    content: string,
    onProgress?: (progress: { current: number; total: number; chunk?: DocumentChunk }) => void
  ): Promise<ParsedDatabaseDocument> {
    try {
      console.log('🔍 开始带进度的数据库文档解析:', {
        provider: this.config.provider,
        model: this.config.model,
        contentLength: content.length
      })
      
      // 如果是模拟模式，使用模拟数据
      if (this.config.provider === 'mock') {
        const { mockParseDatabaseDocumentWithProgress } = await import('@/services/mockAiService')
        return await mockParseDatabaseDocumentWithProgress(content, onProgress)
      }

      // 检查是否需要分块处理
      const chunks = this.chunkDocument(content)
      
      if (chunks.length === 1) {
        // 单块处理，直接报告进度
        onProgress?.({ current: 0, total: 1, chunk: chunks[0] })
        const result = await this.parseSingleDatabaseChunk(chunks[0])
        onProgress?.({ current: 1, total: 1 })
        return result
      } else {
        // 多块处理，逐个报告进度
        return await this.parseMultipleDatabaseChunksWithProgress(chunks, onProgress)
      }
    } catch (error: any) {
      console.error('数据库文档解析失败:', error)
      return {
        tables: [],
        relationships: [],
        indexes: [],
        success: false,
        errors: [`数据库文档解析失败: ${error.message}`],
        confidence: 0
      }
    }
  }

  // 解析单个数据库文档分块
  private async parseSingleDatabaseChunk(chunk: DocumentChunk): Promise<ParsedDatabaseDocument> {
    console.log(`🔍 开始解析数据库分块 ${chunk.index + 1}:`, {
      title: chunk.title,
      contentLength: chunk.content.length,
      estimatedTokens: chunk.estimatedTokens,
      provider: this.config.provider,
      model: this.config.model
    })

    const prompt = this.getDatabaseParsingPrompt()
    let result: any

    try {
      if (this.config.provider === 'ollama') {
        console.log(`📡 调用Ollama API解析数据库...`)
        result = await this.callOllama(prompt, chunk.content)
      } else {
        console.log(`📡 调用在线API解析数据库...`)
        result = await this.callOnlineAPI(prompt, chunk.content)
      }
      
      console.log(`🤖 数据库AI响应原始结果:`, {
        hasResult: !!result,
        resultType: typeof result,
        hasTables: result?.hasOwnProperty('tables'),
        tablesLength: Array.isArray(result?.tables) ? result.tables.length : 'not array',
        hasIndexes: result?.hasOwnProperty('indexes'),
        indexesLength: Array.isArray(result?.indexes) ? result.indexes.length : 'not array'
      })
      
    } catch (error: any) {
      console.error(`❌ 数据库分块 ${chunk.index + 1} AI调用异常:`, error)
      return {
        tables: [],
        relationships: [],
        indexes: [],
        success: false,
        errors: [`AI调用异常: ${error.message}`],
        confidence: 0
      }
    }
    
    // 检查结果是否包含错误
    if (!result.success && result.errors) {
      console.warn(`⚠️ 数据库分块 ${chunk.index + 1} AI解析返回错误:`, result.errors)
      return {
        tables: [],
        relationships: [],
        indexes: [],
        success: false,
        errors: result.errors,
        confidence: 0
      }
    }

    // 处理解析结果
    const tables = result.tables || []
    const relationships = result.relationships || []
    const indexes = result.indexes || []

    console.log(`✅ 数据库分块 ${chunk.index + 1} 解析完成:`, {
      tablesCount: tables.length,
      relationshipsCount: relationships.length,
      indexesCount: indexes.length,
      success: tables.length > 0
    })

    return {
      tables,
      relationships,
      indexes,
      success: tables.length > 0,
      errors: tables.length === 0 ? ['未能解析到任何数据表'] : [],
      confidence: result.confidence || 0.8
    }
  }

  // 解析多个数据库文档分块并合并结果
  private async parseMultipleDatabaseChunks(chunks: DocumentChunk[]): Promise<ParsedDatabaseDocument> {
    console.log(`🔄 数据库文档过长，分为${chunks.length}个块进行处理`)
    
    const results: ParsedDatabaseDocument[] = []
    const errors: string[] = []
    let successCount = 0
    let totalConfidence = 0

    // 分组处理，避免并发过多
    const chunkGroups = []
    const groupSize = 3
    for (let i = 0; i < chunks.length; i += groupSize) {
      chunkGroups.push(chunks.slice(i, i + groupSize))
    }

    for (const chunkGroup of chunkGroups) {
      const promises = chunkGroup.map(async (chunk) => {
        try {
          console.log(`🔍 处理数据库分块 ${chunk.index + 1}/${chunks.length}: ${chunk.title}`)
          
          const result = await this.parseSingleDatabaseChunk(chunk)
          
          if (result.success && result.tables.length > 0) {
            console.log(`✅ 数据库分块 ${chunk.index + 1} 解析成功: ${result.tables.length} 个表`)
            successCount++
            totalConfidence += result.confidence
            return result
          } else {
            console.warn(`❌ 数据库分块 ${chunk.index + 1} 解析失败:`, result.errors)
            errors.push(`分块${chunk.index + 1}解析失败: ${result.errors.join(', ')}`)
            return result
          }
        } catch (error: any) {
          console.error(`❌ 数据库分块 ${chunk.index + 1} 处理异常:`, error)
          errors.push(`分块${chunk.index + 1}处理异常: ${error.message}`)
          return {
            tables: [],
            relationships: [],
            indexes: [],
            success: false,
            errors: [error.message],
            confidence: 0
          }
        }
      })

      const groupResults = await Promise.all(promises)
      results.push(...groupResults)
      
      // 添加延迟避免过于频繁的API调用
      if (chunkGroups.indexOf(chunkGroup) < chunkGroups.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // 合并所有成功的结果
    const allTables = []
    const allRelationships = []
    const allIndexes = []

    for (const result of results) {
      if (result.success) {
        allTables.push(...result.tables)
        allRelationships.push(...result.relationships)
        allIndexes.push(...result.indexes)
      }
    }

    // 去重处理
    const uniqueTables = this.deduplicateTables(allTables)
    const uniqueRelationships = this.deduplicateRelationships(allRelationships)
    const uniqueIndexes = this.deduplicateIndexes(allIndexes)

    console.log(`🎯 数据库多分块解析完成:`, {
      totalChunks: chunks.length,
      successfulChunks: successCount,
      finalTables: uniqueTables.length,
      finalRelationships: uniqueRelationships.length,
      finalIndexes: uniqueIndexes.length
    })

    return {
      tables: uniqueTables,
      relationships: uniqueRelationships,
      indexes: uniqueIndexes,
      success: uniqueTables.length > 0,
      errors: uniqueTables.length === 0 ? errors : [],
      confidence: successCount > 0 ? totalConfidence / successCount : 0
    }
  }

  // 带进度的解析多个数据库文档分块并合并结果
  private async parseMultipleDatabaseChunksWithProgress(
    chunks: DocumentChunk[],
    onProgress?: (progress: { current: number; total: number; chunk?: DocumentChunk }) => void
  ): Promise<ParsedDatabaseDocument> {
    console.log(`🔄 数据库文档过长，分为${chunks.length}个块进行处理（带进度）`)
    
    const results: ParsedDatabaseDocument[] = []
    const errors: string[] = []
    let successCount = 0
    let totalConfidence = 0

    // 逐个处理，保证进度报告的准确性
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      
      // 报告当前进度
      onProgress?.({
        current: i,
        total: chunks.length,
        chunk
      })
      
      try {
        console.log(`🔍 处理数据库分块 ${i + 1}/${chunks.length}: ${chunk.title}`)
        
        const result = await this.parseSingleDatabaseChunk(chunk)
        
        if (result.success && result.tables.length > 0) {
          console.log(`✅ 数据库分块 ${i + 1} 解析成功: ${result.tables.length} 个表`)
          successCount++
          totalConfidence += result.confidence
          results.push(result)
        } else {
          console.warn(`❌ 数据库分块 ${i + 1} 解析失败:`, result.errors)
          errors.push(`分块${i + 1}解析失败: ${result.errors.join(', ')}`)
          results.push(result)
        }
      } catch (error: any) {
        console.error(`❌ 数据库分块 ${i + 1} 处理异常:`, error)
        errors.push(`分块${i + 1}处理异常: ${error.message}`)
        results.push({
          tables: [],
          relationships: [],
          indexes: [],
          success: false,
          errors: [error.message],
          confidence: 0
        })
      }
      
      // 添加延迟避免过于频繁的API调用
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    // 报告完成进度
    onProgress?.({
      current: chunks.length,
      total: chunks.length
    })

    // 合并所有成功的结果
    const allTables = []
    const allRelationships = []
    const allIndexes = []

    for (const result of results) {
      if (result.success) {
        allTables.push(...result.tables)
        allRelationships.push(...result.relationships)
        allIndexes.push(...result.indexes)
      }
    }

    // 去重处理
    const uniqueTables = this.deduplicateTables(allTables)
    const uniqueRelationships = this.deduplicateRelationships(allRelationships)
    const uniqueIndexes = this.deduplicateIndexes(allIndexes)

    console.log(`🎯 数据库多分块解析完成:`, {
      totalChunks: chunks.length,
      successfulChunks: successCount,
      finalTables: uniqueTables.length,
      finalRelationships: uniqueRelationships.length,
      finalIndexes: uniqueIndexes.length
    })

    return {
      tables: uniqueTables,
      relationships: uniqueRelationships,
      indexes: uniqueIndexes,
      success: uniqueTables.length > 0,
      errors: uniqueTables.length === 0 ? errors : [],
      confidence: successCount > 0 ? totalConfidence / successCount : 0
    }
  }

  // 数据库表去重
  private deduplicateTables(tables: any[]): any[] {
    const seen = new Set()
    return tables.filter(table => {
      const key = table.name.toLowerCase()
      if (seen.has(key)) {
        console.log(`🔄 发现重复表定义: ${table.name}，已去重`)
        return false
      }
      seen.add(key)
      return true
    })
  }

  // 关系去重
  private deduplicateRelationships(relationships: any[]): any[] {
    const seen = new Set()
    return relationships.filter(rel => {
      const key = `${rel.fromTable}.${rel.fromColumn}-${rel.toTable}.${rel.toColumn}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  // 索引去重
  private deduplicateIndexes(indexes: any[]): any[] {
    const seen = new Set()
    return indexes.filter(idx => {
      const key = `${idx.table}.${idx.name}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  // 解析API文档 - 支持分块处理
  async parseAPIDocument(content: string, projectId: string): Promise<ParsedAPIDocument> {
    try {
      console.log('开始解析API文档:', {
        provider: this.config.provider,
        model: this.config.model,
        contentLength: content.length
      })
      
      // 如果是模拟模式，使用模拟数据
      if (this.config.provider === 'mock') {
        const { mockParseAPIDocument } = await import('@/services/mockAiService')
        const mockResult = await mockParseAPIDocument(content, projectId)
        return {
          apis: mockResult.apis || [],
          success: mockResult.success,
          errors: mockResult.errors,
          confidence: mockResult.confidence
        }
      }

      // 检查是否需要分块处理
      const chunks = this.chunkDocument(content)
      
      if (chunks.length === 1) {
        // 单块处理
        return await this.parseSingleChunk(chunks[0], projectId)
      } else {
        // 多块处理
        return await this.parseMultipleChunks(chunks, projectId)
      }
    } catch (error: any) {
      return {
        apis: [],
        success: false,
        errors: [error.message || '解析失败'],
        confidence: 0
      }
    }
  }

  /**
   * 解析单个分块
   */
  private async parseSingleChunk(chunk: DocumentChunk, projectId: string): Promise<ParsedAPIDocument> {
    console.log(`🔍 开始解析分块 ${chunk.index + 1}:`, {
      title: chunk.title,
      contentLength: chunk.content.length,
      estimatedTokens: chunk.estimatedTokens,
      contentPreview: chunk.content.substring(0, 300) + (chunk.content.length > 300 ? '...' : ''),
      provider: this.config.provider,
      model: this.config.model
    })

    const prompt = this.getAPIParsingPrompt()
    let result: any

    try {
      if (this.config.provider === 'ollama') {
        console.log(`📡 调用Ollama API...`)
        result = await this.callOllama(prompt, chunk.content)
      } else {
        console.log(`📡 调用在线API...`)
        result = await this.callOnlineAPI(prompt, chunk.content)
      }
      
      console.log(`🤖 AI响应原始结果:`, {
        hasResult: !!result,
        resultType: typeof result,
        hasSuccess: result?.hasOwnProperty('success'),
        success: result?.success,
        hasApis: result?.hasOwnProperty('apis'),
        apisType: typeof result?.apis,
        apisLength: Array.isArray(result?.apis) ? result.apis.length : 'not array',
        hasErrors: result?.hasOwnProperty('errors'),
        errors: result?.errors,
        rawResultPreview: JSON.stringify(result).substring(0, 500) + '...'
      })
      
    } catch (error: any) {
      console.error(`❌ 分块 ${chunk.index + 1} AI调用异常:`, error)
      return {
        apis: [],
        success: false,
        errors: [`AI调用异常: ${error.message}`],
        confidence: 0
      }
    }
    
    // 检查结果是否包含错误
    if (!result.success && result.errors) {
      console.warn(`⚠️ 分块 ${chunk.index + 1} AI解析返回错误:`, result.errors)
      return {
        apis: [],
        success: false,
        errors: result.errors,
        confidence: 0
      }
    }

    // 转换为标准API格式
    console.log(`🔄 开始转换API格式，原始APIs:`, result.apis)
    const apis: API[] = result.apis?.map((api: any, index: number) => {
      console.log(`📝 处理API ${index + 1}:`, {
        originalApi: api,
        hasName: !!api.name,
        hasMethod: !!api.method,
        hasPath: !!api.path
      })

      return {
        id: `ai-parsed-${Date.now()}-${index}`,
        projectId,
        name: api.name || '未命名API',
        description: api.description || '',
        method: this.normalizeHTTPMethod(api.method),
        path: api.path || '/',
        status: APIStatus.NOT_STARTED,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }) || []

    console.log(`✅ 分块 ${chunk.index + 1} 解析完成:`, {
      finalApisCount: apis.length,
      success: apis.length > 0,
      apisPreview: apis.map(api => ({ name: api.name, method: api.method, path: api.path }))
    })

    return {
      apis,
      success: apis.length > 0,
      errors: apis.length === 0 ? ['未能解析到任何API接口'] : [],
      confidence: result.confidence || 0.8
    }
  }

  /**
   * 解析多个分块并合并结果
   */
  private async parseMultipleChunks(chunks: DocumentChunk[], projectId: string): Promise<ParsedAPIDocument> {
    console.log(`文档过长，分为${chunks.length}个块进行处理`)
    
    const results: ParsedAPIDocument[] = []
    const errors: string[] = []
    let totalAPIs: API[] = []
    let successCount = 0
    let totalConfidence = 0

    // 并行处理所有分块（限制并发数）
    const concurrency = 3 // 最大并发数
    const chunkGroups = []
    
    for (let i = 0; i < chunks.length; i += concurrency) {
      chunkGroups.push(chunks.slice(i, i + concurrency))
    }

    for (const chunkGroup of chunkGroups) {
      const promises = chunkGroup.map(async (chunk, index) => {
        try {
          console.log(`处理分块 ${chunk.index + 1}/${chunks.length}: ${chunk.title} (${chunk.estimatedTokens} tokens)`)
          
          const result = await this.parseSingleChunk(chunk, projectId)
          
          if (result.success && result.apis.length > 0) {
            console.log(`分块 ${chunk.index + 1} 解析成功: ${result.apis.length} 个API`)
            successCount++
            totalConfidence += result.confidence
            
            // 为API添加分块信息
            const chunkAPIs = result.apis.map(api => ({
              ...api,
              id: `chunk-${chunk.index}-${api.id}`,
              description: `[分块${chunk.index + 1}] ${api.description || ''}`
            }))
            
            return {
              ...result,
              apis: chunkAPIs
            }
          } else {
            console.warn(`分块 ${chunk.index + 1} 解析失败:`, result.errors)
            errors.push(`分块${chunk.index + 1}解析失败: ${result.errors.join(', ')}`)
            return result
          }
        } catch (error: any) {
          console.error(`分块 ${chunk.index + 1} 处理异常:`, error)
          errors.push(`分块${chunk.index + 1}处理异常: ${error.message}`)
          return {
            apis: [],
            success: false,
            errors: [error.message],
            confidence: 0
          }
        }
      })

      const groupResults = await Promise.all(promises)
      results.push(...groupResults)
      
      // 添加延迟避免过于频繁的API调用
      if (chunkGroups.indexOf(chunkGroup) < chunkGroups.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // 合并所有成功的结果
    for (const result of results) {
      if (result.success && result.apis.length > 0) {
        totalAPIs.push(...result.apis)
      }
    }

    // 去重处理 - 基于name和path的相似性
    const uniqueAPIs = this.deduplicateAPIs(totalAPIs)
    
    const averageConfidence = successCount > 0 ? totalConfidence / successCount : 0
    const hasErrors = errors.length > 0
    
    console.log(`分块解析完成: ${chunks.length}个分块, ${successCount}个成功, ${uniqueAPIs.length}个API (去重后)`)

    return {
      apis: uniqueAPIs,
      success: uniqueAPIs.length > 0,
      errors: hasErrors ? errors : (uniqueAPIs.length === 0 ? ['所有分块都未能解析到API接口'] : []),
      confidence: averageConfidence
    }
  }

  /**
   * API去重处理
   */
  private deduplicateAPIs(apis: API[]): API[] {
    const uniqueAPIs: API[] = []
    const seenAPIs = new Set<string>()

    for (const api of apis) {
      // 创建唯一标识符
      const key = `${api.method}:${api.path}:${api.name}`.toLowerCase()
      
      if (!seenAPIs.has(key)) {
        seenAPIs.add(key)
        uniqueAPIs.push(api)
      } else {
        // 如果重复，合并描述信息
        const existingAPI = uniqueAPIs.find(existing => 
          existing.method === api.method && 
          existing.path === api.path && 
          existing.name === api.name
        )
        
        if (existingAPI && api.description && api.description !== existingAPI.description) {
          existingAPI.description = `${existingAPI.description}\n\n补充信息: ${api.description}`
        }
      }
    }

    return uniqueAPIs
  }

  /**
   * 获取分块处理进度的回调接口
   */
  async parseAPIDocumentWithProgress(
    content: string, 
    projectId: string,
    onProgress?: (progress: { current: number, total: number, chunk: DocumentChunk }) => void
  ): Promise<ParsedAPIDocument> {
    const chunks = this.chunkDocument(content)
    
    if (chunks.length === 1) {
      onProgress?.({ current: 1, total: 1, chunk: chunks[0] })
      return await this.parseSingleChunk(chunks[0], projectId)
    }
    
    console.log(`开始分块处理: ${chunks.length} 个分块`)
    
    const results: ParsedAPIDocument[] = []
    const errors: string[] = []
    let totalAPIs: API[] = []
    let successCount = 0
    let totalConfidence = 0

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      onProgress?.({ current: i + 1, total: chunks.length, chunk })
      
      try {
        const result = await this.parseSingleChunk(chunk, projectId)
        results.push(result)
        
        if (result.success && result.apis.length > 0) {
          successCount++
          totalConfidence += result.confidence
          totalAPIs.push(...result.apis.map(api => ({
            ...api,
            id: `chunk-${i}-${api.id}`,
            description: `[分块${i + 1}] ${api.description || ''}`
          })))
        } else {
          errors.push(`分块${i + 1}解析失败: ${result.errors.join(', ')}`)
        }
        
        // 添加延迟
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error: any) {
        errors.push(`分块${i + 1}处理异常: ${error.message}`)
      }
    }

    const uniqueAPIs = this.deduplicateAPIs(totalAPIs)
    const averageConfidence = successCount > 0 ? totalConfidence / successCount : 0

    return {
      apis: uniqueAPIs,
      success: uniqueAPIs.length > 0,
      errors: errors.length > 0 ? errors : (uniqueAPIs.length === 0 ? ['所有分块都未能解析到API接口'] : []),
      confidence: averageConfidence
    }
  }

  // 解析数据库文档
  async parseDatabaseDocument(content: string, projectId: string): Promise<ParsedDatabaseDocument> {
    try {
      const prompt = this.getDatabaseParsingPrompt()
      let result: any

      if (this.config.provider === 'ollama') {
        result = await this.callOllama(prompt, content)
      } else {
        result = await this.callOnlineAPI(prompt, content)
      }

      // 转换为标准数据表格式
      const tables: DatabaseTable[] = result.tables?.map((table: any, index: number) => ({
        id: `ai-parsed-table-${Date.now()}-${index}`,
        projectId,
        name: table.name || `table_${index}`,
        displayName: table.displayName || table.name,
        comment: table.comment || '',
        engine: table.engine || 'InnoDB',
        charset: table.charset || 'utf8mb4',
        collation: table.collation || 'utf8mb4_unicode_ci',
        status: 'ACTIVE' as any,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fields: table.fields?.map((field: any, fieldIndex: number) => ({
          id: `field-${Date.now()}-${fieldIndex}`,
          tableId: `ai-parsed-table-${Date.now()}-${index}`,
          name: field.name,
          type: field.type,
          length: field.length,
          nullable: field.nullable !== false,
          isPrimaryKey: field.isPrimaryKey || false,
          isAutoIncrement: field.isAutoIncrement || false,
          comment: field.comment || '',
          sortOrder: field.sortOrder || fieldIndex + 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })) || []
      })) || []

      return {
        tables,
        success: tables.length > 0,
        errors: tables.length === 0 ? ['未能解析到任何数据表'] : [],
        confidence: result.confidence || 0.8
      }
    } catch (error: any) {
      return {
        tables: [],
        success: false,
        errors: [error.message || '解析失败'],
        confidence: 0
      }
    }
  }

  // 标准化HTTP方法
  private normalizeHTTPMethod(method: string): HTTPMethod {
    const normalizedMethod = method?.toUpperCase()
    switch (normalizedMethod) {
      case 'GET': return HTTPMethod.GET
      case 'POST': return HTTPMethod.POST
      case 'PUT': return HTTPMethod.PUT
      case 'PATCH': return HTTPMethod.PATCH
      case 'DELETE': return HTTPMethod.DELETE
      case 'HEAD': return HTTPMethod.HEAD
      case 'OPTIONS': return HTTPMethod.OPTIONS
      default: return HTTPMethod.GET
    }
  }
}

// 创建默认的AI解析服务实例
export const createAIParsingService = (config: AIParsingConfig): AIParsingService => {
  return new AIParsingService(config)
}

// 预设配置
export const AI_PARSING_PRESETS = {
  // 模拟模式（用于调试）
  mock: {
    provider: 'mock' as const,
    model: 'mock-model',
    baseUrl: ''
  },
  // Ollama本地配置
  ollama_qwen: {
    provider: 'ollama' as const,
    model: 'qwen2.5-coder:7b',
    baseUrl: 'http://localhost:11434'
  },
  ollama_qwen_small: {
    provider: 'ollama' as const,
    model: 'qwen2.5-coder:1.5b',
    baseUrl: 'http://localhost:11434'
  },
  // DeepSeek在线配置
  deepseek: {
    provider: 'deepseek' as const,
    model: 'deepseek-coder',
    baseUrl: 'https://api.deepseek.com',
    apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY
  },
  // OpenAI配置
  openai: {
    provider: 'openai' as const,
    model: 'gpt-3.5-turbo',
    baseUrl: 'https://api.openai.com',
    apiKey: import.meta.env.VITE_OPENAI_API_KEY
  }
}

export default AIParsingService