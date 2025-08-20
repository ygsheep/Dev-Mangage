import axios, { AxiosInstance } from 'axios'
import { BaseAIAdapter } from './BaseAIAdapter'
import { 
  AIServiceConfig, 
  DocumentType, 
  SQLDialect, 
  GenerateResult, 
  OptimizeResult, 
  ParsedModel, 
  ParsedTable, 
  GenerateOptions, 
  OptimizeOptions, 
  IndexSuggestion, 
  GeneratedSQL 
} from '../types'
import logger from '../../../utils/logger'

interface OllamaGenerateRequest {
  model: string
  prompt: string
  stream?: boolean
  options?: {
    temperature?: number
    top_k?: number
    top_p?: number
    num_predict?: number
    stop?: string[]
  }
}

interface OllamaGenerateResponse {
  model: string
  created_at: string
  response: string
  done: boolean
  total_duration?: number
  load_duration?: number
  prompt_eval_count?: number
  prompt_eval_duration?: number
  eval_count?: number
  eval_duration?: number
}

export class OllamaAdapter extends BaseAIAdapter {
  private client: AxiosInstance
  private isModelAvailable: boolean = false
  private lastHealthCheck: number = 0
  private healthCheckInterval: number = 60000 // 1分钟

  constructor(config: AIServiceConfig) {
    super(config)
    
    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: config.timeout || 120000, // 默认2分钟超时
      headers: {
        'Content-Type': 'application/json',
        ...config.customHeaders
      },
      proxy: false // 禁用代理，避免本地连接问题
    })

    // 初始化时检测可用模型并选择最佳模型
    this.initializeWithAutoDetection()
  }

  /**
   * 初始化时自动检测模型
   */
  private async initializeWithAutoDetection(): Promise<void> {
    try {
      await this.detectAvailableModels()
      // 如果配置中没有指定模型，自动选择最佳模型
      if (!this.config.model) {
        const bestModel = this.autoSelectBestModel()
        if (bestModel) {
          this.config.model = bestModel
          logger.info('自动设置最佳模型', { model: bestModel })
        }
      }
      await this.checkModelAvailability()
    } catch (error) {
      logger.warn('模型自动检测初始化失败', { error: error.message })
    }
  }

  getProviderName(): string {
    return 'Ollama'
  }

  getModelVersion(): string {
    return this.config.model || this.autoSelectBestModel() || 'qwen2.5-coder:7b'
  }

  /**
   * 自动选择最佳可用模型
   */
  private autoSelectBestModel(): string | null {
    if (this.lastDetectedModels && this.lastDetectedModels.length > 0) {
      // 模型优先级：coder > chat > base，大参数 > 小参数
      const modelPriority = [
        'qwen2.5-coder:14b', 'qwen2.5-coder:7b', 'qwen2.5-coder:1.5b',
        'qwen2.5:14b', 'qwen2.5:7b', 'qwen2.5:1.5b', 
        'deepseek-coder:33b', 'deepseek-coder:6.7b', 'deepseek-coder:1.3b',
        'codellama:34b', 'codellama:13b', 'codellama:7b',
        'llama3:70b', 'llama3:8b',
        'gpt-4', 'gpt-3.5-turbo'
      ]
      
      for (const preferredModel of modelPriority) {
        if (this.lastDetectedModels.some(model => 
          model.name === preferredModel || model.name.startsWith(preferredModel.split(':')[0])
        )) {
          logger.info('自动选择模型', { selectedModel: preferredModel })
          return preferredModel
        }
      }
      
      // 如果没有找到优先模型，选择第一个可用的
      const fallbackModel = this.lastDetectedModels[0]?.name
      if (fallbackModel) {
        logger.info('使用回退模型', { fallbackModel })
        return fallbackModel
      }
    }
    
    return null
  }

  private lastDetectedModels: any[] = []

  /**
   * 检测可用模型列表
   */
  async detectAvailableModels(): Promise<any[]> {
    try {
      const response = await this.client.get('/api/tags')
      const models = response.data?.models || []
      this.lastDetectedModels = models
      
      logger.info('检测到可用模型', { 
        totalModels: models.length,
        models: models.map((m: any) => m.name)
      })
      
      return models
    } catch (error) {
      logger.warn('检测模型失败', { error: error.message })
      return []
    }
  }

  async isAvailable(): Promise<boolean> {
    const now = Date.now()
    
    // 如果距离上次健康检查时间较短，直接返回缓存结果
    if (now - this.lastHealthCheck < this.healthCheckInterval) {
      return this.isModelAvailable
    }

    await this.checkModelAvailability()
    return this.isModelAvailable
  }

  private async checkModelAvailability(): Promise<void> {
    try {
      // 检查Ollama服务是否运行
      const response = await this.client.get('/api/tags')
      
      // 检查指定模型是否在模型列表中
      const models = response.data?.models || []
      const targetModel = this.getModelVersion()
      const modelExists = models.some((model: any) => 
        model.name === targetModel || model.model === targetModel
      )

      if (modelExists) {
        this.isModelAvailable = true
        logger.info('Ollama模型可用性检查成功', { 
          model: targetModel, 
          available: true 
        })
      } else {
        this.isModelAvailable = false
        logger.warn('Ollama模型不存在', { 
          model: targetModel,
          availableModels: models.map((m: any) => m.name || m.model),
          available: false
        })
      }
      
      this.lastHealthCheck = Date.now()
    } catch (error) {
      this.isModelAvailable = false
      this.lastHealthCheck = Date.now()
      
      logger.warn('Ollama模型可用性检查失败', { 
        model: this.getModelVersion(),
        error: error.message,
        available: false
      })
    }
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy', details?: any }> {
    try {
      // 检查服务状态
      const startTime = Date.now()
      const response = await this.client.get('/api/tags')
      const responseTime = Date.now() - startTime

      // 检查模型
      const models = response.data?.models || []
      const targetModel = this.getModelVersion()
      const modelExists = models.some((model: any) => 
        model.name === targetModel || model.name.startsWith(targetModel.split(':')[0])
      )

      if (!modelExists) {
        return {
          status: 'unhealthy',
          details: {
            error: `模型 ${targetModel} 未找到`,
            availableModels: models.map((m: any) => m.name),
            responseTime
          }
        }
      }

      // 测试生成能力
      const testStart = Date.now()
      await this.client.post('/api/generate', {
        model: targetModel,
        prompt: 'Test',
        stream: false,
        options: { num_predict: 1 }
      })
      const generateTime = Date.now() - testStart

      return {
        status: responseTime < 5000 && generateTime < 10000 ? 'healthy' : 'degraded',
        details: {
          serviceResponseTime: responseTime,
          generateResponseTime: generateTime,
          modelName: targetModel,
          totalModels: models.length,
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  protected async callAI(prompt: string, options?: any): Promise<string> {
    const requestData: OllamaGenerateRequest = {
      model: this.getModelVersion(),
      prompt,
      stream: false,
      options: {
        temperature: options?.temperature || this.config.temperature || 0.1,
        num_predict: options?.maxTokens || this.config.maxTokens || 4000,
        top_k: 10,
        top_p: 0.9
      }
    }

    logger.debug('发送Ollama请求', {
      model: requestData.model,
      promptLength: prompt.length,
      options: requestData.options
    })

    const response = await this.client.post<OllamaGenerateResponse>('/api/generate', requestData)
    
    if (!response.data.done) {
      throw new Error('Ollama响应未完成')
    }

    logger.debug('Ollama响应完成', {
      model: response.data.model,
      responseLength: response.data.response.length,
      totalDuration: response.data.total_duration,
      evalCount: response.data.eval_count
    })

    return response.data.response
  }

  // Ollama专用的SQL生成实现
  async generateSQL(model: ParsedModel, dialect: SQLDialect, options: GenerateOptions = {}): Promise<GenerateResult> {
    if (!await this.isAvailable()) {
      return {
        success: false,
        error: 'Ollama服务不可用',
        metadata: {
          provider: this.getProviderName(),
          timestamp: new Date()
        }
      }
    }

    try {
      const prompt = this.buildSQLGenerationPrompt(model, dialect, options)
      const response = await this.withRetry(() => this.callAI(prompt, {
        temperature: 0.1,
        maxTokens: 8000
      }))

      const sqlStatements = this.parseGeneratedSQL(response, dialect)
      
      const result: GeneratedSQL = {
        dialect,
        statements: sqlStatements,
        metadata: {
          generatedAt: new Date(),
          totalStatements: sqlStatements.length,
          warnings: []
        }
      }

      return {
        success: true,
        data: result,
        metadata: {
          provider: this.getProviderName(),
          modelVersion: this.getModelVersion(),
          timestamp: new Date()
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

  // Ollama专用的模式优化实现
  async optimizeSchema(tables: ParsedTable[], options: OptimizeOptions = {}): Promise<OptimizeResult> {
    if (!await this.isAvailable()) {
      return {
        success: false,
        error: 'Ollama服务不可用',
        metadata: {
          provider: this.getProviderName(),
          timestamp: new Date(),
          analysisType: []
        }
      }
    }

    try {
      const prompt = this.buildOptimizationAnalysisPrompt(tables, options)
      const response = await this.withRetry(() => this.callAI(prompt, {
        temperature: 0.2,
        maxTokens: 6000
      }))

      const suggestions = this.parseOptimizationSuggestions(response)

      return {
        success: true,
        data: suggestions,
        metadata: {
          provider: this.getProviderName(),
          timestamp: new Date(),
          analysisType: options.focusAreas || ['performance', 'security', 'maintainability']
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        metadata: {
          provider: this.getProviderName(),
          timestamp: new Date(),
          analysisType: []
        }
      }
    }
  }

  // 索引建议
  async suggestIndexes(table: ParsedTable, queryPatterns: string[] = []): Promise<IndexSuggestion[]> {
    if (!await this.isAvailable()) {
      return []
    }

    try {
      const prompt = this.buildIndexSuggestionPrompt(table, queryPatterns)
      const response = await this.callAI(prompt, {
        temperature: 0.1,
        maxTokens: 2000
      })

      return this.parseIndexSuggestions(response, table.name)
    } catch (error) {
      logger.error('Ollama索引建议生成失败', {
        tableName: table.name,
        error: error.message
      })
      return []
    }
  }

  // 构建SQL生成提示词
  private buildSQLGenerationPrompt(model: ParsedModel, dialect: SQLDialect, options: GenerateOptions): string {
    const dialectInfo = {
      [SQLDialect.MYSQL]: { name: 'MySQL', features: '支持AUTO_INCREMENT, ENGINE=InnoDB, utf8mb4字符集' },
      [SQLDialect.POSTGRESQL]: { name: 'PostgreSQL', features: '支持SERIAL, 序列, JSONB类型' },
      [SQLDialect.SQLITE]: { name: 'SQLite', features: '轻量级, INTEGER PRIMARY KEY AUTOINCREMENT' },
      [SQLDialect.SQL_SERVER]: { name: 'SQL Server', features: '支持IDENTITY, NVARCHAR类型' },
      [SQLDialect.ORACLE]: { name: 'Oracle', features: '支持序列, VARCHAR2类型' }
    }

    const info = dialectInfo[dialect]
    
    return `你是一个专业的数据库工程师，请基于以下数据模型生成${info.name}建表语句。

数据库特性：${info.features}

要求：
1. 生成完整的CREATE TABLE语句
2. 包含所有字段定义、约束和索引
3. 添加适当的注释
4. 遵循${info.name}最佳实践
5. 确保语法正确
6. 按依赖关系排序表创建顺序

数据模型：
\`\`\`json
${JSON.stringify(model, null, 2)}
\`\`\`

请返回SQL语句，每个CREATE TABLE语句用分号结束。不要包含其他解释文字。`
  }

  // 构建优化分析提示词
  private buildOptimizationAnalysisPrompt(tables: ParsedTable[], options: OptimizeOptions): string {
    const focusAreas = options.focusAreas || ['performance', 'security', 'maintainability', 'scalability']
    
    return `你是一个数据库性能优化专家，请分析以下数据库表设计并提供优化建议。

分析重点：${focusAreas.join(', ')}
分析深度：${options.analysisDepth || 'standard'}
目标环境：${options.targetEnvironment || 'production'}

表结构：
\`\`\`json
${JSON.stringify({ tables }, null, 2)}
\`\`\`

请从以下维度进行分析：
1. 字段类型和长度优化
2. 索引策略建议
3. 约束和关系设计
4. 性能潜在问题
5. 安全性建议
6. 可维护性改进

返回JSON格式的建议列表，每个建议包含：
- type: 建议类型
- severity: 严重程度
- target: 目标对象
- title: 建议标题
- description: 详细描述
- recommendation: 具体建议
- example: 示例代码（可选）

\`\`\`json
{
  "suggestions": [
    {
      "type": "INDEX",
      "severity": "HIGH",
      "target": {"table": "users", "field": "email"},
      "title": "添加邮箱唯一索引",
      "description": "邮箱字段应该有唯一约束以防止重复注册",
      "recommendation": "在email字段上创建唯一索引",
      "example": "CREATE UNIQUE INDEX idx_users_email ON users(email);"
    }
  ]
}
\`\`\``
  }

  // 构建索引建议提示词
  private buildIndexSuggestionPrompt(table: ParsedTable, queryPatterns: string[]): string {
    return `作为数据库索引优化专家，请为以下表分析并建议合适的索引策略。

表结构：
\`\`\`json
${JSON.stringify(table, null, 2)}
\`\`\`

常见查询模式：
${queryPatterns.length > 0 ? queryPatterns.map(p => `- ${p}`).join('\n') : '- 暂无特定查询模式'}

请分析：
1. 主键和外键索引
2. 查询性能优化索引
3. 复合索引机会
4. 唯一约束索引

返回JSON格式的索引建议：
\`\`\`json
{
  "suggestions": [
    {
      "table": "${table.name}",
      "fields": ["field1", "field2"],
      "type": "INDEX",
      "reason": "优化WHERE子句查询性能",
      "performance_impact": 8,
      "storage_cost": 3,
      "maintenance_cost": 2,
      "priority": "HIGH"
    }
  ]
}
\`\`\``
  }

  // 解析生成的SQL
  private parseGeneratedSQL(response: string, dialect: SQLDialect): any[] {
    const statements = []
    
    // 提取SQL语句
    const sqlBlocks = response.match(/CREATE\s+TABLE[\s\S]*?;/gi) || []
    
    sqlBlocks.forEach((sql, index) => {
      const tableMatch = sql.match(/CREATE\s+TABLE\s+(?:`?)(\w+)(?:`?)/i)
      const tableName = tableMatch ? tableMatch[1] : `table_${index + 1}`
      
      statements.push({
        type: 'CREATE_TABLE' as const,
        table: tableName,
        sql: sql.trim(),
        dependencies: this.extractTableDependencies(sql)
      })
    })

    // 按依赖关系排序
    return this.sortStatementsByDependencies(statements)
  }

  // 提取表依赖关系
  private extractTableDependencies(sql: string): string[] {
    const dependencies = []
    const foreignKeyMatches = sql.match(/REFERENCES\s+(?:`?)(\w+)(?:`?)/gi) || []
    
    foreignKeyMatches.forEach(match => {
      const tableMatch = match.match(/REFERENCES\s+(?:`?)(\w+)(?:`?)/i)
      if (tableMatch) {
        dependencies.push(tableMatch[1])
      }
    })
    
    return dependencies
  }

  // 按依赖关系排序语句
  private sortStatementsByDependencies(statements: any[]): any[] {
    const sorted = []
    const remaining = [...statements]
    const created = new Set<string>()

    while (remaining.length > 0) {
      const canCreate = remaining.filter(stmt => 
        stmt.dependencies.every((dep: string) => created.has(dep))
      )

      if (canCreate.length === 0) {
        // 如果有循环依赖，按原顺序添加
        sorted.push(...remaining)
        break
      }

      canCreate.forEach(stmt => {
        sorted.push(stmt)
        created.add(stmt.table)
        const index = remaining.indexOf(stmt)
        remaining.splice(index, 1)
      })
    }

    return sorted
  }

  // 解析优化建议
  private parseOptimizationSuggestions(response: string): any[] {
    try {
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      const jsonContent = jsonMatch ? jsonMatch[1] : response
      
      const parsed = JSON.parse(jsonContent)
      return parsed.suggestions || parsed || []
    } catch (error) {
      logger.warn('优化建议解析失败', { error: error.message })
      return []
    }
  }

  // 解析索引建议
  private parseIndexSuggestions(response: string, tableName: string): IndexSuggestion[] {
    try {
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      const jsonContent = jsonMatch ? jsonMatch[1] : response
      
      const parsed = JSON.parse(jsonContent)
      const suggestions = parsed.suggestions || parsed || []
      
      return suggestions.map((s: any) => ({
        table: s.table || tableName,
        fields: Array.isArray(s.fields) ? s.fields : [s.fields].filter(Boolean),
        type: s.type || 'INDEX',
        reason: s.reason || '性能优化',
        performance_impact: s.performance_impact || 5,
        storage_cost: s.storage_cost || 3,
        maintenance_cost: s.maintenance_cost || 2,
        priority: s.priority || 'MEDIUM'
      }))
    } catch (error) {
      logger.warn('索引建议解析失败', { tableName, error: error.message })
      return []
    }
  }
}