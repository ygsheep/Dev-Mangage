import {
  AIServiceAdapter,
  AIServiceConfig,
  DocumentType,
  SQLDialect,
  ParseResult,
  GenerateResult,
  OptimizeResult,
  ParsedModel,
  ParsedTable,
  ParseOptions,
  GenerateOptions,
  OptimizeOptions,
  IndexSuggestion,
  PROMPT_TEMPLATES
} from '../types'
import logger from '../../../utils/logger'

export abstract class BaseAIAdapter implements AIServiceAdapter {
  protected config: AIServiceConfig
  protected rateLimitTracker: Map<string, { count: number, resetTime: number }> = new Map()

  constructor(config: AIServiceConfig) {
    this.config = config
  }

  // 抽象方法，子类必须实现
  abstract getProviderName(): string
  abstract getModelVersion(): string
  abstract isAvailable(): Promise<boolean>
  abstract healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy', details?: any }>

  // 核心AI调用方法，子类必须实现
  protected abstract callAI(prompt: string, options?: any): Promise<string>

  // 解析AI响应的JSON，子类可以重写
  protected parseAIResponse(response: string): any {
    try {
      // 提取JSON内容（处理可能的markdown包装）
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      const jsonContent = jsonMatch ? jsonMatch[1] : response
      
      // 清理和规范化JSON
      const cleanedContent = jsonContent
        .replace(/\/\*[\s\S]*?\*\//g, '') // 移除多行注释
        .replace(/\/\/.*$/gm, '') // 移除单行注释
        .replace(/,\s*([}\]])/g, '$1') // 移除末尾逗号
        .trim()

      return JSON.parse(cleanedContent)
    } catch (error) {
      logger.warn('AI响应JSON解析失败', {
        provider: this.getProviderName(),
        error: error.message,
        response: response.substring(0, 500) + '...'
      })
      throw new Error(`AI响应格式无效: ${error.message}`)
    }
  }

  // 速率限制检查
  protected checkRateLimit(operation: string): boolean {
    if (!this.config.rateLimits?.requestsPerMinute) {
      return true
    }

    const now = Date.now()
    const key = `${this.getProviderName()}-${operation}`
    const tracker = this.rateLimitTracker.get(key)

    if (!tracker || now > tracker.resetTime) {
      this.rateLimitTracker.set(key, {
        count: 1,
        resetTime: now + 60000 // 1分钟后重置
      })
      return true
    }

    if (tracker.count >= this.config.rateLimits.requestsPerMinute) {
      return false
    }

    tracker.count++
    return true
  }

  // 构建提示词
  protected buildPrompt(content: string, type: DocumentType, options?: ParseOptions): string {
    let template = ''
    
    switch (type) {
      case DocumentType.MARKDOWN:
        template = PROMPT_TEMPLATES.DOCUMENT_PARSE.MARKDOWN
        break
      case DocumentType.SQL:
        template = PROMPT_TEMPLATES.DOCUMENT_PARSE.SQL
        break
      case DocumentType.EXCEL:
        template = PROMPT_TEMPLATES.DOCUMENT_PARSE.EXCEL
        break
      // 新增专用文档类型
      case DocumentType.API_DOCUMENTATION:
        template = PROMPT_TEMPLATES.DOCUMENT_PARSE.API_DOCUMENTATION
        break
      case DocumentType.DATA_MODEL:
        template = PROMPT_TEMPLATES.DOCUMENT_PARSE.DATA_MODEL
        break
      case DocumentType.FEATURE_MODULE:
        template = PROMPT_TEMPLATES.DOCUMENT_PARSE.FEATURE_MODULE
        break
      case DocumentType.BUSINESS_PROCESS:
        template = PROMPT_TEMPLATES.DOCUMENT_PARSE.BUSINESS_PROCESS
        break
      case DocumentType.TECHNICAL_SPEC:
        template = PROMPT_TEMPLATES.DOCUMENT_PARSE.TECHNICAL_SPEC
        break
      default:
        template = PROMPT_TEMPLATES.DOCUMENT_PARSE.MARKDOWN
    }

    // 自定义提示词覆盖
    if (options?.customPrompts?.[type]) {
      template = options.customPrompts[type]
    }

    return template.replace('{content}', content)
  }

  // 构建SQL生成提示词
  protected buildSQLPrompt(model: ParsedModel, dialect: SQLDialect, options?: GenerateOptions): string {
    let template = ''
    
    switch (dialect) {
      case SQLDialect.MYSQL:
        template = PROMPT_TEMPLATES.SQL_GENERATION.MYSQL
        break
      case SQLDialect.POSTGRESQL:
        template = PROMPT_TEMPLATES.SQL_GENERATION.POSTGRESQL
        break
      case SQLDialect.SQLITE:
        template = PROMPT_TEMPLATES.SQL_GENERATION.SQLITE
        break
      default:
        template = PROMPT_TEMPLATES.SQL_GENERATION.MYSQL
    }

    // 自定义模板覆盖
    if (options?.customTemplates?.[dialect]) {
      template = options.customTemplates[dialect]
    }

    return template.replace('{model}', JSON.stringify(model, null, 2))
  }

  // 构建优化提示词
  protected buildOptimizationPrompt(tables: ParsedTable[], options?: OptimizeOptions): string {
    const template = PROMPT_TEMPLATES.OPTIMIZATION.PERFORMANCE_REVIEW
    return template.replace('{model}', JSON.stringify({ tables }, null, 2))
  }

  // 重试机制
  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.config.maxRetries || 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        
        if (attempt === maxRetries) {
          break
        }

        logger.warn(`AI服务调用失败，尝试重试 ${attempt}/${maxRetries}`, {
          provider: this.getProviderName(),
          error: error.message
        })

        // 指数退避
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)))
      }
    }

    throw lastError
  }

  // 验证解析结果
  protected validateParseResult(data: any, confidenceThreshold: number = 0.7): { isValid: boolean, warnings: string[] } {
    const warnings: string[] = []
    let isValid = true

    // 检查基础结构
    if (!data || typeof data !== 'object') {
      return { isValid: false, warnings: ['解析结果不是有效的对象'] }
    }

    if (!Array.isArray(data.tables)) {
      return { isValid: false, warnings: ['缺少tables数组'] }
    }

    // 检查表定义
    data.tables.forEach((table: any, index: number) => {
      if (!table.name || typeof table.name !== 'string') {
        warnings.push(`表 ${index + 1} 缺少有效的name字段`)
        isValid = false
      }

      if (!Array.isArray(table.fields)) {
        warnings.push(`表 ${table.name || index + 1} 缺少fields数组`)
        isValid = false
      } else {
        table.fields.forEach((field: any, fieldIndex: number) => {
          if (!field.name || typeof field.name !== 'string') {
            warnings.push(`表 ${table.name} 的字段 ${fieldIndex + 1} 缺少有效的name`)
          }
          if (!field.type || typeof field.type !== 'string') {
            warnings.push(`表 ${table.name} 的字段 ${field.name || fieldIndex + 1} 缺少有效的type`)
          }
        })
      }
    })

    // 检查置信度
    if (data.metadata?.confidence && data.metadata.confidence < confidenceThreshold) {
      warnings.push(`解析置信度 ${data.metadata.confidence} 低于阈值 ${confidenceThreshold}`)
    }

    return { isValid, warnings }
  }

  // 标准化字段类型
  protected normalizeFieldType(type: string, dialect: SQLDialect = SQLDialect.MYSQL): string {
    const typeMap: Record<SQLDialect, Record<string, string>> = {
      [SQLDialect.MYSQL]: {
        'string': 'VARCHAR(255)',
        'text': 'TEXT',
        'integer': 'INT',
        'bigint': 'BIGINT',
        'decimal': 'DECIMAL(10,2)',
        'float': 'FLOAT',
        'double': 'DOUBLE',
        'boolean': 'BOOLEAN',
        'date': 'DATE',
        'datetime': 'DATETIME',
        'timestamp': 'TIMESTAMP',
        'json': 'JSON'
      },
      [SQLDialect.POSTGRESQL]: {
        'string': 'VARCHAR(255)',
        'text': 'TEXT',
        'integer': 'INTEGER',
        'bigint': 'BIGINT',
        'decimal': 'DECIMAL(10,2)',
        'float': 'REAL',
        'double': 'DOUBLE PRECISION',
        'boolean': 'BOOLEAN',
        'date': 'DATE',
        'datetime': 'TIMESTAMP',
        'timestamp': 'TIMESTAMP WITH TIME ZONE',
        'json': 'JSONB'
      },
      [SQLDialect.SQLITE]: {
        'string': 'TEXT',
        'text': 'TEXT',
        'integer': 'INTEGER',
        'bigint': 'INTEGER',
        'decimal': 'REAL',
        'float': 'REAL',
        'double': 'REAL',
        'boolean': 'INTEGER',
        'date': 'TEXT',
        'datetime': 'TEXT',
        'timestamp': 'TEXT',
        'json': 'TEXT'
      },
      [SQLDialect.SQL_SERVER]: {
        'string': 'NVARCHAR(255)',
        'text': 'NTEXT',
        'integer': 'INT',
        'bigint': 'BIGINT',
        'decimal': 'DECIMAL(10,2)',
        'float': 'FLOAT',
        'double': 'FLOAT',
        'boolean': 'BIT',
        'date': 'DATE',
        'datetime': 'DATETIME2',
        'timestamp': 'DATETIME2',
        'json': 'NVARCHAR(MAX)'
      },
      [SQLDialect.ORACLE]: {
        'string': 'VARCHAR2(255)',
        'text': 'CLOB',
        'integer': 'NUMBER(10)',
        'bigint': 'NUMBER(19)',
        'decimal': 'NUMBER(10,2)',
        'float': 'BINARY_FLOAT',
        'double': 'BINARY_DOUBLE',
        'boolean': 'NUMBER(1)',
        'date': 'DATE',
        'datetime': 'TIMESTAMP',
        'timestamp': 'TIMESTAMP',
        'json': 'CLOB'
      }
    }

    const normalizedType = type.toLowerCase().trim()
    return typeMap[dialect]?.[normalizedType] || type
  }

  // 默认实现：文档解析
  async parseDocument(content: string, type: DocumentType, options: ParseOptions = {}): Promise<ParseResult> {
    // 首先尝试本地解析（对于结构化文档）
    if (this.shouldUseLocalParser(type, options)) {
      try {
        const { DocumentParserService } = await import('../documentParsers')
        const localResult = await DocumentParserService.parseDocument(content, type, options)
        
        if (localResult.success && localResult.data.tables.length > 0) {
          return {
            ...localResult,
            metadata: {
              ...localResult.metadata,
              provider: `${this.getProviderName()}_local_hybrid`,
              parseMethod: 'local'
            }
          }
        }
      } catch (error) {
        logger.warn('本地解析失败，回退到AI解析', { 
          provider: this.getProviderName(),
          type,
          error: error.message 
        })
      }
    }

    // AI解析
    if (!await this.isAvailable()) {
      return {
        success: false,
        error: `${this.getProviderName()} 服务不可用`,
        metadata: {
          provider: this.getProviderName(),
          timestamp: new Date()
        }
      }
    }

    if (!this.checkRateLimit('parse')) {
      return {
        success: false,
        error: '请求频率超出限制',
        metadata: {
          provider: this.getProviderName(),
          timestamp: new Date()
        }
      }
    }

    try {
      const prompt = this.buildPrompt(content, type, options)
      const response = await this.withRetry(() => this.callAI(prompt, {
        temperature: this.config.temperature || 0.1,
        maxTokens: this.config.maxTokens || 4000
      }))

      const parsedData = this.parseAIResponse(response)
      const validation = this.validateParseResult(parsedData, options.confidenceThreshold)

      if (!validation.isValid && options.strictMode) {
        return {
          success: false,
          error: '解析结果验证失败',
          warnings: validation.warnings,
          metadata: {
            provider: this.getProviderName(),
            timestamp: new Date()
          }
        }
      }

      return {
        success: true,
        data: parsedData,
        warnings: validation.warnings,
        metadata: {
          provider: this.getProviderName(),
          modelVersion: this.getModelVersion(),
          timestamp: new Date(),
          parseMethod: 'ai'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        metadata: {
          provider: this.getProviderName(),
          timestamp: new Date()
        }
      }
    }
  }

  /**
   * 判断是否应该使用本地解析器
   */
  protected shouldUseLocalParser(type: DocumentType, options: ParseOptions = {}): boolean {
    // 如果显式要求AI解析，则不使用本地解析
    if (options.forceAIParsing) {
      return false
    }

    // 对于结构化文档，优先使用本地解析
    const structuredTypes = [DocumentType.SQL, DocumentType.EXCEL, DocumentType.CSV, DocumentType.JSON]
    return structuredTypes.includes(type)
  }

  // 默认实现：SQL生成（子类可重写以提供更专业的实现）
  async generateSQL(model: ParsedModel, dialect: SQLDialect, options: GenerateOptions = {}): Promise<GenerateResult> {
    // 基础实现，子类可以重写
    return {
      success: false,
      error: '此适配器不支持SQL生成功能',
      metadata: {
        provider: this.getProviderName(),
        timestamp: new Date()
      }
    }
  }

  // 默认实现：模式优化（子类可重写）
  async optimizeSchema(tables: ParsedTable[], options: OptimizeOptions = {}): Promise<OptimizeResult> {
    return {
      success: false,
      error: '此适配器不支持模式优化功能',
      metadata: {
        provider: this.getProviderName(),
        timestamp: new Date(),
        analysisType: []
      }
    }
  }

  // 默认实现：索引建议（子类可重写）
  async suggestIndexes(table: ParsedTable, queryPatterns: string[] = []): Promise<IndexSuggestion[]> {
    return []
  }
}