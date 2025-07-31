// AI解析服务 - 使用小模型进行智能文档解析
import { API, HTTPMethod, APIStatus, DatabaseTable } from '@shared/types'

export interface AIParsingConfig {
  provider: 'ollama' | 'deepseek' | 'openai' | 'mock'
  model: string
  baseUrl?: string
  apiKey?: string
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

  // 调用Ollama本地模型
  private async callOllama(prompt: string, content: string): Promise<any> {
    const baseUrl = this.config.baseUrl || 'http://localhost:11434'
    
    try {
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
        return {
          apis: [],
          success: false,
          errors: [`Ollama请求失败: ${response.status} ${response.statusText}`],
          confidence: 0
        }
      }

      const result = await response.json()
      console.log('Ollama原始响应:', result)
      
      const parsedResult = this.parseAIResponse(result.response)
      
      // 如果解析结果包含错误，记录但不抛出异常
      if (!parsedResult.success && parsedResult.errors) {
        console.warn('AI解析包含错误:', parsedResult.errors)
      }
      
      return parsedResult
    } catch (error) {
      console.error('Ollama调用失败:', error)
      // 返回错误响应而不是抛出异常
      return {
        apis: [],
        success: false,
        errors: [`Ollama调用异常: ${error.message}`],
        confidence: 0
      }
    }
  }

  // 调用在线API (DeepSeek、OpenAI等)
  private async callOnlineAPI(prompt: string, content: string): Promise<any> {
    const { provider, model, apiKey, baseUrl } = this.config
    
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

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.statusText}`)
      }

      const result = await response.json()
      const content = result.choices?.[0]?.message?.content
      
      if (!content) {
        throw new Error('AI响应格式错误')
      }

      const parsedResult = this.parseAIResponse(content)
      
      // 如果解析结果包含错误，记录但不抛出异常
      if (!parsedResult.success && parsedResult.errors) {
        console.warn('在线API解析包含错误:', parsedResult.errors)
      }
      
      return parsedResult
    } catch (error) {
      console.error('在线API调用失败:', error)
      // 返回错误响应而不是抛出异常
      return {
        apis: [],
        success: false,
        errors: [`在线API调用异常: ${error.message}`],
        confidence: 0
      }
    }
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

  // 解析API文档
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

      const prompt = this.getAPIParsingPrompt()
      let result: any

      if (this.config.provider === 'ollama') {
        result = await this.callOllama(prompt, content)
      } else {
        result = await this.callOnlineAPI(prompt, content)
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
    } catch (error: any) {
      return {
        apis: [],
        success: false,
        errors: [error.message || '解析失败'],
        confidence: 0
      }
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