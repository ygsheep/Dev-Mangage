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
  IndexSuggestion 
} from '../types'
import logger from '../../../utils/logger'

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenAICompletionRequest {
  model: string
  messages: OpenAIMessage[]
  temperature?: number
  max_tokens?: number
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
  stop?: string[]
}

interface OpenAICompletionResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class OpenAIAdapter extends BaseAIAdapter {
  private client: AxiosInstance
  private isServiceAvailable: boolean = false
  private lastHealthCheck: number = 0
  private healthCheckInterval: number = 300000 // 5分钟

  constructor(config: AIServiceConfig) {
    super(config)
    
    this.client = axios.create({
      baseURL: config.apiUrl || 'https://api.openai.com/v1',
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        ...config.customHeaders
      }
    })

    // 初始化时检查服务可用性
    this.checkServiceAvailability()
  }

  getProviderName(): string {
    return 'OpenAI'
  }

  getModelVersion(): string {
    return this.config.model || 'gpt-4'
  }

  async isAvailable(): Promise<boolean> {
    if (!this.config.apiKey) {
      return false
    }

    const now = Date.now()
    
    // 如果距离上次健康检查时间较短，直接返回缓存结果
    if (now - this.lastHealthCheck < this.healthCheckInterval) {
      return this.isServiceAvailable
    }

    await this.checkServiceAvailability()
    return this.isServiceAvailable
  }

  private async checkServiceAvailability(): Promise<void> {
    try {
      // 检查模型列表以验证API密钥和服务状态
      const response = await this.client.get('/models')
      
      // 验证目标模型是否可用
      const models = response.data?.data || []
      const targetModel = this.getModelVersion()
      const modelExists = models.some((model: any) => model.id === targetModel)

      if (!modelExists) {
        logger.warn('OpenAI指定模型不可用', { 
          targetModel, 
          availableModels: models.slice(0, 5).map((m: any) => m.id) 
        })
      }

      this.isServiceAvailable = true
      this.lastHealthCheck = Date.now()
      
      logger.info('OpenAI服务可用性检查成功', { 
        model: targetModel,
        available: true 
      })
    } catch (error) {
      this.isServiceAvailable = false
      this.lastHealthCheck = Date.now()
      
      const errorMsg = error.response?.data?.error?.message || error.message
      logger.warn('OpenAI服务可用性检查失败', { 
        model: this.getModelVersion(),
        error: errorMsg,
        status: error.response?.status,
        available: false
      })
    }
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy', details?: any }> {
    try {
      if (!this.config.apiKey) {
        return {
          status: 'unhealthy',
          details: { error: 'API密钥未配置' }
        }
      }

      const startTime = Date.now()
      
      // 发送简单的测试请求
      const testRequest: OpenAICompletionRequest = {
        model: this.getModelVersion(),
        messages: [
          { role: 'user', content: 'Test connection' }
        ],
        max_tokens: 1,
        temperature: 0
      }

      const response = await this.client.post<OpenAICompletionResponse>('/chat/completions', testRequest)
      const responseTime = Date.now() - startTime

      return {
        status: responseTime < 10000 ? 'healthy' : 'degraded',
        details: {
          responseTime,
          model: response.data.model,
          usage: response.data.usage,
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      const errorDetails = {
        error: error.response?.data?.error?.message || error.message,
        status: error.response?.status,
        type: error.response?.data?.error?.type,
        timestamp: new Date().toISOString()
      }

      return {
        status: 'unhealthy',
        details: errorDetails
      }
    }
  }

  protected async callAI(prompt: string, options?: any): Promise<string> {
    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: '你是一个专业的数据库设计专家，擅长分析文档并生成标准化的数据模型定义。请准确理解用户需求，生成结构化的JSON响应。'
      },
      {
        role: 'user',
        content: prompt
      }
    ]

    const requestData: OpenAICompletionRequest = {
      model: this.getModelVersion(),
      messages,
      temperature: options?.temperature || this.config.temperature || 0.1,
      max_tokens: options?.maxTokens || this.config.maxTokens || 4000,
      top_p: 0.9,
      frequency_penalty: 0,
      presence_penalty: 0
    }

    logger.debug('发送OpenAI请求', {
      model: requestData.model,
      messagesCount: messages.length,
      maxTokens: requestData.max_tokens
    })

    const response = await this.client.post<OpenAICompletionResponse>('/chat/completions', requestData)
    
    if (!response.data.choices || response.data.choices.length === 0) {
      throw new Error('OpenAI响应中没有生成内容')
    }

    const choice = response.data.choices[0]
    if (choice.finish_reason === 'length') {
      logger.warn('OpenAI响应被长度限制截断', {
        maxTokens: requestData.max_tokens,
        usage: response.data.usage
      })
    }

    logger.debug('OpenAI响应完成', {
      model: response.data.model,
      finishReason: choice.finish_reason,
      usage: response.data.usage
    })

    return choice.message.content
  }

  // OpenAI专用的SQL生成实现
  async generateSQL(model: ParsedModel, dialect: SQLDialect, options: GenerateOptions = {}): Promise<GenerateResult> {
    if (!await this.isAvailable()) {
      return {
        success: false,
        error: 'OpenAI服务不可用',
        metadata: {
          provider: this.getProviderName(),
          timestamp: new Date()
        }
      }
    }

    try {
      const prompt = this.buildAdvancedSQLPrompt(model, dialect, options)
      const response = await this.withRetry(() => this.callAI(prompt, {
        temperature: 0.1,
        maxTokens: 8000
      }))

      const result = this.parseAdvancedSQLResponse(response, dialect)

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

  // OpenAI专用的模式优化实现
  async optimizeSchema(tables: ParsedTable[], options: OptimizeOptions = {}): Promise<OptimizeResult> {
    if (!await this.isAvailable()) {
      return {
        success: false,
        error: 'OpenAI服务不可用',
        metadata: {
          provider: this.getProviderName(),
          timestamp: new Date(),
          analysisType: []
        }
      }
    }

    try {
      const prompt = this.buildSchemaOptimizationPrompt(tables, options)
      const response = await this.withRetry(() => this.callAI(prompt, {
        temperature: 0.2,
        maxTokens: 6000
      }))

      const suggestions = this.parseOptimizationResponse(response)

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

  // 高级索引建议
  async suggestIndexes(table: ParsedTable, queryPatterns: string[] = []): Promise<IndexSuggestion[]> {
    if (!await this.isAvailable()) {
      return []
    }

    try {
      const prompt = this.buildIndexAnalysisPrompt(table, queryPatterns)
      const response = await this.callAI(prompt, {
        temperature: 0.1,
        maxTokens: 3000
      })

      return this.parseIndexResponse(response, table.name)
    } catch (error) {
      logger.error('OpenAI索引建议生成失败', {
        tableName: table.name,
        error: error.message
      })
      return []
    }
  }

  // 构建高级SQL生成提示词
  private buildAdvancedSQLPrompt(model: ParsedModel, dialect: SQLDialect, options: GenerateOptions): string {
    const dialectFeatures = {
      [SQLDialect.MYSQL]: {
        name: 'MySQL',
        version: '8.0+',
        features: [
          'InnoDB存储引擎',
          'utf8mb4字符集',
          'AUTO_INCREMENT自增',
          'JSON数据类型',
          '虚拟列和生成列',
          'CHECK约束（8.0.16+）'
        ],
        bestPractices: [
          '使用InnoDB存储引擎',
          '设置utf8mb4字符集和utf8mb4_unicode_ci排序规则',
          '为外键字段创建索引',
          '合理使用UNSIGNED修饰符',
          '避免使用TEXT/BLOB作为主键'
        ]
      },
      [SQLDialect.POSTGRESQL]: {
        name: 'PostgreSQL',
        version: '12+',
        features: [
          'SERIAL/BIGSERIAL类型',
          'JSONB数据类型',
          '数组类型',
          'UUID类型',
          '部分索引和表达式索引',
          '检查约束和排除约束'
        ],
        bestPractices: [
          '使用SERIAL/UUID作为主键',
          '优先使用JSONB而非JSON',
          '为频繁查询的JSONB字段创建GIN索引',
          '使用NOT NULL约束提高性能',
          '合理使用部分索引减少存储'
        ]
      }
    }

    const info = dialectFeatures[dialect] || dialectFeatures[SQLDialect.MYSQL]

    return `作为高级数据库架构师，请为以下数据模型生成生产级的${info.name} ${info.version}建表语句。

## 数据库特性和约束
${info.features.map(f => `- ${f}`).join('\n')}

## 最佳实践要求
${info.bestPractices.map(p => `- ${p}`).join('\n')}

## 生成要求
1. **表结构完整性**: 包含所有字段、约束、索引
2. **性能优化**: 合理的数据类型、索引策略
3. **安全性**: 适当的约束和验证
4. **可维护性**: 清晰的命名和注释
5. **扩展性**: 考虑未来需求变化

## 数据模型
\`\`\`json
${JSON.stringify(model, null, 2)}
\`\`\`

## 输出格式
请返回JSON格式的结果，包含：
- statements: SQL语句数组
- metadata: 元数据信息

\`\`\`json
{
  "dialect": "${dialect}",
  "statements": [
    {
      "type": "CREATE_TABLE",
      "table": "表名",
      "sql": "完整的CREATE TABLE语句",
      "dependencies": ["依赖的表名"],
      "description": "表的用途说明"
    }
  ],
  "metadata": {
    "generatedAt": "生成时间",
    "totalStatements": "语句数量",
    "estimatedSize": "预估大小",
    "warnings": ["警告信息"]
  }
}
\`\`\`

请确保SQL语句符合${info.name}语法规范，并按照表之间的依赖关系正确排序。`
  }

  // 构建模式优化提示词
  private buildSchemaOptimizationPrompt(tables: ParsedTable[], options: OptimizeOptions): string {
    const analysisDepth = options.analysisDepth || 'standard'
    const focusAreas = options.focusAreas || ['performance', 'security', 'maintainability', 'scalability']
    const targetEnv = options.targetEnvironment || 'production'

    return `作为数据库性能调优专家，请对以下数据库设计进行深度分析和优化。

## 分析配置
- **分析深度**: ${analysisDepth}
- **重点领域**: ${focusAreas.join(', ')}
- **目标环境**: ${targetEnv}
- **包含示例**: ${options.includeExamples ? '是' : '否'}

## 分析维度

### 1. 性能优化 (Performance)
- 字段类型和长度优化
- 索引策略分析
- 查询性能瓶颈识别
- 存储空间优化

### 2. 安全性 (Security)
- 数据完整性约束
- 敏感数据处理
- 访问控制建议
- 审计跟踪需求

### 3. 可维护性 (Maintainability)
- 命名规范检查
- 表结构规范化
- 文档和注释完整性
- 版本兼容性

### 4. 可扩展性 (Scalability)
- 分区策略建议
- 水平扩展考虑
- 缓存策略优化
- 读写分离准备

## 表结构定义
\`\`\`json
${JSON.stringify({ tables }, null, 2)}
\`\`\`

## 输出格式
请返回详细的优化建议JSON：

\`\`\`json
{
  "suggestions": [
    {
      "type": "INDEX|CONSTRAINT|PERFORMANCE|SECURITY|BEST_PRACTICE",
      "severity": "LOW|MEDIUM|HIGH|CRITICAL",
      "target": {
        "table": "表名",
        "field": "字段名（可选）",
        "index": "索引名（可选）"
      },
      "title": "建议标题",
      "description": "详细描述问题和影响",
      "recommendation": "具体的改进建议",
      "example": "示例代码或配置（可选）",
      "impact": "预期的性能或安全影响",
      "effort": "LOW|MEDIUM|HIGH - 实施难度"
    }
  ],
  "summary": {
    "totalIssues": "问题总数",
    "criticalIssues": "严重问题数",
    "performanceGain": "预期性能提升",
    "implementationOrder": ["建议实施顺序"]
  }
}
\`\`\`

请基于${targetEnv}环境的实际需求，提供具体可行的优化方案。`
  }

  // 构建索引分析提示词
  private buildIndexAnalysisPrompt(table: ParsedTable, queryPatterns: string[]): string {
    return `作为数据库索引优化专家，请为以下表设计最优的索引策略。

## 表结构分析
\`\`\`json
${JSON.stringify(table, null, 2)}
\`\`\`

## 查询模式
${queryPatterns.length > 0 ? 
  queryPatterns.map((pattern, i) => `${i + 1}. ${pattern}`).join('\n') : 
  '暂无具体查询模式，请基于通用最佳实践分析'
}

## 分析要求
1. **主键索引**: 分析主键选择和性能
2. **外键索引**: 确保关联查询性能
3. **查询优化索引**: 基于WHERE、ORDER BY、JOIN条件
4. **复合索引**: 多字段组合索引机会
5. **唯一约束**: 业务逻辑唯一性保证
6. **全文索引**: 文本搜索需求（如适用）

## 考虑因素
- **查询频率**: 高频查询优先优化
- **数据量**: 预估数据规模影响
- **写入性能**: 索引对INSERT/UPDATE的影响
- **存储成本**: 索引空间开销
- **维护成本**: 索引管理复杂度

## 输出格式
\`\`\`json
{
  "suggestions": [
    {
      "table": "${table.name}",
      "fields": ["字段1", "字段2"],
      "type": "INDEX|UNIQUE|COMPOSITE|FULLTEXT",
      "name": "建议的索引名称",
      "reason": "创建此索引的原因",
      "performance_impact": 8,
      "storage_cost": 3,
      "maintenance_cost": 2,
      "priority": "HIGH|MEDIUM|LOW",
      "sql_example": "CREATE INDEX示例",
      "query_benefit": "受益的查询类型"
    }
  ],
  "analysis": {
    "current_indexes": "当前索引评估",
    "missing_indexes": "缺失的重要索引",
    "redundant_indexes": "可能冗余的索引",
    "optimization_potential": "优化潜力评分(1-10)"
  }
}
\`\`\`

请提供专业的索引策略建议，确保查询性能和存储效率的最佳平衡。`
  }

  // 解析高级SQL响应
  private parseAdvancedSQLResponse(response: string, dialect: SQLDialect): any {
    try {
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      const jsonContent = jsonMatch ? jsonMatch[1] : response
      
      const parsed = JSON.parse(jsonContent)
      
      return {
        dialect,
        statements: parsed.statements || [],
        metadata: {
          generatedAt: new Date(),
          totalStatements: parsed.statements?.length || 0,
          estimatedSize: parsed.metadata?.estimatedSize,
          warnings: parsed.metadata?.warnings || []
        }
      }
    } catch (error) {
      logger.warn('OpenAI SQL响应解析失败', { error: error.message })
      throw new Error(`SQL响应解析失败: ${error.message}`)
    }
  }

  // 解析优化响应
  private parseOptimizationResponse(response: string): any[] {
    try {
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      const jsonContent = jsonMatch ? jsonMatch[1] : response
      
      const parsed = JSON.parse(jsonContent)
      return parsed.suggestions || []
    } catch (error) {
      logger.warn('OpenAI优化建议解析失败', { error: error.message })
      return []
    }
  }

  // 解析索引响应
  private parseIndexResponse(response: string, tableName: string): IndexSuggestion[] {
    try {
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      const jsonContent = jsonMatch ? jsonMatch[1] : response
      
      const parsed = JSON.parse(jsonContent)
      const suggestions = parsed.suggestions || []
      
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
      logger.warn('OpenAI索引建议解析失败', { tableName, error: error.message })
      return []
    }
  }
}