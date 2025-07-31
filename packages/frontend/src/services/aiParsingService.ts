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
  tables: DatabaseTable[]
  success: boolean
  errors: string[]
  confidence: number
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
    return `你是一个专业的数据库文档解析专家。请分析以下数据库设计文档，提取所有数据表信息。

要求：
1. 识别所有数据表的名称、描述、字段信息
2. 提取字段的类型、长度、是否必填、是否主键等属性
3. 识别字段注释和说明
4. 提取索引信息（如果有）

输出格式示例：
{
  "tables": [
    {
      "name": "users",
      "displayName": "用户表",
      "comment": "用户基础信息表",
      "engine": "InnoDB",
      "charset": "utf8mb4",
      "collation": "utf8mb4_unicode_ci",
      "fields": [
        {
          "name": "id",
          "type": "BIGINT",
          "length": null,
          "nullable": false,
          "isPrimaryKey": true,
          "isAutoIncrement": true,
          "comment": "用户ID",
          "sortOrder": 1
        },
        {
          "name": "username",
          "type": "VARCHAR",
          "length": 50,
          "nullable": false,
          "isPrimaryKey": false,
          "isAutoIncrement": false,
          "comment": "用户名",
          "sortOrder": 2
        }
      ]
    }
  ],
  "confidence": 0.92
}

请严格按照以上格式输出，只返回JSON，不要其他文字。`
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
      console.log('原始AI响应长度:', response.length)
      console.log('原始AI响应前100字符:', response.substring(0, 100))
      
      // 深度清理响应内容
      let cleanedResponse = response
        .replace(/^\uFEFF/, '') // 移除BOM
        .replace(/^[\s\r\n]+/, '') // 移除开头的所有空白字符
        .replace(/[\s\r\n]+$/, '') // 移除结尾的所有空白字符
      
      console.log('清理后响应前100字符:', cleanedResponse.substring(0, 100))
      
      // 移除可能的markdown代码块标记
      cleanedResponse = cleanedResponse
        .replace(/^```json\s*/, '')
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '')
      
      // 移除可能的文本说明
      cleanedResponse = cleanedResponse
        .replace(/^[^{\[]*(?=[{\[])/s, '') // 移除JSON/数组前的所有文本
        .replace(/(?<=[}\]])[^}\]]*$/s, '') // 移除JSON/数组后的所有文本
      
      console.log('最终清理后的响应:', cleanedResponse)
      
      // 检查是否为空
      if (!cleanedResponse) {
        throw new Error('清理后的响应为空')
      }
      
      // 尝试直接解析
      try {
        const parsed = JSON.parse(cleanedResponse)
        console.log('直接解析成功:', parsed)
        return parsed
      } catch (directError) {
        console.log('直接解析失败:', directError.message)
      }
      
      // 尝试提取JSON对象（更宽松的匹配）
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0])
          console.log('对象提取解析成功:', parsed)
          return parsed
        } catch (jsonError) {
          console.log('对象提取解析失败:', jsonError.message)
        }
      }
      
      // 尝试查找数组格式
      const arrayMatch = cleanedResponse.match(/\[[\s\S]*\]/)
      if (arrayMatch) {
        try {
          const parsed = JSON.parse(arrayMatch[0])
          console.log('数组提取解析成功:', parsed)
          return { apis: parsed }
        } catch (arrayError) {
          console.log('数组提取解析失败:', arrayError.message)
        }
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
    const prompt = this.getAPIParsingPrompt()
    let result: any

    if (this.config.provider === 'ollama') {
      result = await this.callOllama(prompt, chunk.content)
    } else {
      result = await this.callOnlineAPI(prompt, chunk.content)
    }
    
    // 检查结果是否包含错误
    if (!result.success && result.errors) {
      console.warn('AI解析返回错误:', result.errors)
      return {
        apis: [],
        success: false,
        errors: result.errors,
        confidence: 0
      }
    }

    // 转换为标准API格式
    const apis: API[] = result.apis?.map((api: any, index: number) => ({
      id: `ai-parsed-${Date.now()}-${index}`,
      projectId,
      name: api.name || '未命名API',
      description: api.description || '',
      method: this.normalizeHTTPMethod(api.method),
      path: api.path || '/',
      status: APIStatus.NOT_STARTED,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })) || []

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