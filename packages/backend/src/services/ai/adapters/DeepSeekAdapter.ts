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

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface DeepSeekCompletionRequest {
  model: string
  messages: DeepSeekMessage[]
  temperature?: number
  max_tokens?: number
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
  stop?: string[]
  stream?: boolean
}

interface DeepSeekCompletionResponse {
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

export class DeepSeekAdapter extends BaseAIAdapter {
  private client: AxiosInstance
  private isServiceAvailable: boolean = false
  private lastHealthCheck: number = 0
  private healthCheckInterval: number = 300000 // 5分钟

  constructor(config: AIServiceConfig) {
    super(config)
    
    this.client = axios.create({
      baseURL: config.apiUrl || 'https://api.deepseek.com/v1',
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
    return 'DeepSeek'
  }

  getModelVersion(): string {
    return this.config.model || 'deepseek-coder'
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
      // DeepSeek API测试请求
      const testRequest: DeepSeekCompletionRequest = {
        model: this.getModelVersion(),
        messages: [
          { role: 'user', content: 'Test' }
        ],
        max_tokens: 1,
        temperature: 0
      }

      await this.client.post('/chat/completions', testRequest)
      
      this.isServiceAvailable = true
      this.lastHealthCheck = Date.now()
      
      logger.info('DeepSeek服务可用性检查成功', { 
        model: this.getModelVersion(),
        available: true 
      })
    } catch (error) {
      this.isServiceAvailable = false
      this.lastHealthCheck = Date.now()
      
      const errorMsg = error.response?.data?.error?.message || error.message
      logger.warn('DeepSeek服务可用性检查失败', { 
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
      
      // 发送测试请求
      const testRequest: DeepSeekCompletionRequest = {
        model: this.getModelVersion(),
        messages: [
          { role: 'system', content: '你是一个代码分析专家。' },
          { role: 'user', content: 'Hello' }
        ],
        max_tokens: 10,
        temperature: 0
      }

      const response = await this.client.post<DeepSeekCompletionResponse>('/chat/completions', testRequest)
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
    const messages: DeepSeekMessage[] = [
      {
        role: 'system',
        content: '你是一个专业的数据库和代码分析专家，擅长SQL设计、数据建模和代码生成。请准确理解需求，生成高质量的结构化响应。'
      },
      {
        role: 'user',
        content: prompt
      }
    ]

    const requestData: DeepSeekCompletionRequest = {
      model: this.getModelVersion(),
      messages,
      temperature: options?.temperature || this.config.temperature || 0.1,
      max_tokens: options?.maxTokens || this.config.maxTokens || 4000,
      top_p: 0.95,
      frequency_penalty: 0,
      presence_penalty: 0,
      stream: false
    }

    logger.debug('发送DeepSeek请求', {
      model: requestData.model,
      messagesCount: messages.length,
      maxTokens: requestData.max_tokens
    })

    const response = await this.client.post<DeepSeekCompletionResponse>('/chat/completions', requestData)
    
    if (!response.data.choices || response.data.choices.length === 0) {
      throw new Error('DeepSeek响应中没有生成内容')
    }

    const choice = response.data.choices[0]
    if (choice.finish_reason === 'length') {
      logger.warn('DeepSeek响应被长度限制截断', {
        maxTokens: requestData.max_tokens,
        usage: response.data.usage
      })
    }

    logger.debug('DeepSeek响应完成', {
      model: response.data.model,
      finishReason: choice.finish_reason,
      usage: response.data.usage
    })

    return choice.message.content
  }

  // DeepSeek专门优化的SQL生成实现
  async generateSQL(model: ParsedModel, dialect: SQLDialect, options: GenerateOptions = {}): Promise<GenerateResult> {
    if (!await this.isAvailable()) {
      return {
        success: false,
        error: 'DeepSeek服务不可用',
        metadata: {
          provider: this.getProviderName(),
          timestamp: new Date()
        }
      }
    }

    try {
      const prompt = this.buildCodeGenPrompt(model, dialect, options)
      const response = await this.withRetry(() => this.callAI(prompt, {
        temperature: 0.1,
        maxTokens: 8000
      }))

      const result = this.parseCodeGenResponse(response, dialect)

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

  // DeepSeek专门优化的代码分析实现
  async optimizeSchema(tables: ParsedTable[], options: OptimizeOptions = {}): Promise<OptimizeResult> {
    if (!await this.isAvailable()) {
      return {
        success: false,
        error: 'DeepSeek服务不可用',
        metadata: {
          provider: this.getProviderName(),
          timestamp: new Date(),
          analysisType: []
        }
      }
    }

    try {
      const prompt = this.buildCodeAnalysisPrompt(tables, options)
      const response = await this.withRetry(() => this.callAI(prompt, {
        temperature: 0.2,
        maxTokens: 6000
      }))

      const suggestions = this.parseAnalysisResponse(response)

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

  // 高级索引建议（利用DeepSeek的代码理解能力）
  async suggestIndexes(table: ParsedTable, queryPatterns: string[] = []): Promise<IndexSuggestion[]> {
    if (!await this.isAvailable()) {
      return []
    }

    try {
      const prompt = this.buildCodeOptimizationPrompt(table, queryPatterns)
      const response = await this.callAI(prompt, {
        temperature: 0.1,
        maxTokens: 3000
      })

      return this.parseIndexOptimizationResponse(response, table.name)
    } catch (error) {
      logger.error('DeepSeek索引建议生成失败', {
        tableName: table.name,
        error: error.message
      })
      return []
    }
  }

  // 构建代码生成专用提示词（利用DeepSeek的代码生成优势）
  private buildCodeGenPrompt(model: ParsedModel, dialect: SQLDialect, options: GenerateOptions): string {
    const dialectSpecs = {
      [SQLDialect.MYSQL]: {
        name: 'MySQL',
        version: '8.0',
        syntax: 'MySQL 8.0语法',
        features: 'AUTO_INCREMENT, InnoDB, utf8mb4, JSON类型, 生成列, CTE'
      },
      [SQLDialect.POSTGRESQL]: {
        name: 'PostgreSQL',
        version: '15',
        syntax: 'PostgreSQL 15语法',
        features: 'SERIAL, JSONB, 数组, UUID, 部分索引, 窗口函数, CTE'
      },
      [SQLDialect.SQLITE]: {
        name: 'SQLite',
        version: '3.40',
        syntax: 'SQLite 3.40语法',
        features: 'AUTOINCREMENT, 严格模式, JSON1扩展, CTE, 窗口函数'
      }
    }

    const spec = dialectSpecs[dialect] || dialectSpecs[SQLDialect.MYSQL]

    return `# 数据库DDL代码生成任务

## 目标
生成生产级别的${spec.name} ${spec.version}建表SQL代码

## 技术规范
- **数据库**: ${spec.name} ${spec.version}
- **语法标准**: ${spec.syntax}
- **支持特性**: ${spec.features}

## 代码质量要求
1. **语法准确性**: 严格遵循${spec.name}语法规范
2. **性能优化**: 合理的索引和约束设计
3. **代码规范**: 一致的命名和格式化
4. **生产就绪**: 包含错误处理和最佳实践
5. **文档完善**: 详细的注释说明

## 输入数据模型
\`\`\`json
${JSON.stringify(model, null, 2)}
\`\`\`

## 输出要求
请生成JSON格式的结果，包含完整的SQL代码：

\`\`\`json
{
  "dialect": "${dialect}",
  "statements": [
    {
      "type": "CREATE_TABLE",
      "table": "表名",
      "sql": "-- 表注释\\nCREATE TABLE ...",
      "dependencies": ["依赖表"],
      "description": "表功能说明",
      "performance_notes": "性能优化说明"
    },
    {
      "type": "CREATE_INDEX",
      "table": "表名",
      "sql": "CREATE INDEX ...",
      "description": "索引用途"
    }
  ],
  "metadata": {
    "generatedAt": "时间戳",
    "totalStatements": 数量,
    "estimatedSize": "预估存储大小",
    "warnings": ["注意事项"],
    "deployment_order": ["部署顺序"]
  }
}
\`\`\`

## 特殊要求
- 按表依赖关系正确排序
- 包含完整的约束定义
- 添加性能优化索引
- 提供部署建议

请基于你的代码生成专长，创建高质量的数据库DDL代码。`
  }

  // 构建代码分析专用提示词
  private buildCodeAnalysisPrompt(tables: ParsedTable[], options: OptimizeOptions): string {
    return `# 数据库代码质量分析任务

## 分析目标
对数据库schema设计进行专业的代码质量分析和优化建议

## 分析维度
- **代码规范**: 命名规范、结构设计
- **性能优化**: 索引策略、查询效率
- **安全性**: 数据完整性、约束设计
- **可维护性**: 代码可读性、扩展性
- **最佳实践**: 行业标准遵循度

## 代码审查重点
1. **Schema设计**: 规范化程度、关系设计
2. **字段定义**: 类型选择、长度设置
3. **约束配置**: 主键、外键、检查约束
4. **索引策略**: 覆盖度、冗余分析
5. **命名规范**: 一致性、可读性

## 输入Schema
\`\`\`json
${JSON.stringify({ tables }, null, 2)}
\`\`\`

## 分析配置
- 分析深度: ${options.analysisDepth || 'standard'}
- 重点领域: ${(options.focusAreas || []).join(', ')}
- 目标环境: ${options.targetEnvironment || 'production'}

## 输出格式
请提供详细的代码分析报告：

\`\`\`json
{
  "suggestions": [
    {
      "type": "CODE_QUALITY|PERFORMANCE|SECURITY|NAMING|STRUCTURE",
      "severity": "LOW|MEDIUM|HIGH|CRITICAL",
      "target": {
        "table": "表名",
        "field": "字段名",
        "constraint": "约束名"
      },
      "title": "问题标题",
      "description": "详细问题描述",
      "recommendation": "具体改进建议",
      "code_example": "示例代码",
      "impact": "影响评估",
      "effort": "实施成本",
      "best_practice": "相关最佳实践"
    }
  ],
  "code_quality_score": 85,
  "performance_score": 78,
  "security_score": 92,
  "maintainability_score": 80,
  "overall_score": 84,
  "summary": {
    "strengths": ["设计优点"],
    "weaknesses": ["需改进点"],
    "priority_fixes": ["优先修复项"]
  }
}
\`\`\`

请基于你的代码分析专长，提供专业的数据库代码审查报告。`
  }

  // 构建代码优化专用提示词
  private buildCodeOptimizationPrompt(table: ParsedTable, queryPatterns: string[]): string {
    return `# 数据库索引优化代码分析

## 优化目标
为指定表设计最优的索引策略，提升查询性能

## 表结构代码
\`\`\`json
${JSON.stringify(table, null, 2)}
\`\`\`

## 查询模式分析
${queryPatterns.length > 0 ? 
  queryPatterns.map((pattern, i) => `-- 查询${i + 1}\n${pattern}`).join('\n\n') : 
  '-- 无具体查询模式，基于表结构进行通用优化分析'
}

## 分析要求
1. **查询性能**: 分析WHERE、JOIN、ORDER BY条件
2. **索引覆盖**: 评估现有索引覆盖度
3. **复合索引**: 识别多字段索引机会
4. **写入性能**: 平衡查询优化与写入开销
5. **存储效率**: 索引空间使用优化

## 代码生成要求
- 提供完整的CREATE INDEX语句
- 包含性能影响评估
- 标注实施优先级
- 给出存储和维护成本

## 输出格式
\`\`\`json
{
  "suggestions": [
    {
      "table": "${table.name}",
      "fields": ["字段列表"],
      "type": "INDEX|UNIQUE|COMPOSITE",
      "name": "idx_${table.name}_推荐名称",
      "reason": "创建原因和性能提升预期",
      "performance_impact": 8,
      "storage_cost": 3,
      "maintenance_cost": 2,
      "priority": "HIGH|MEDIUM|LOW",
      "sql_example": "CREATE INDEX idx_name ON table_name (fields);",
      "query_benefit": "受益的查询类型详细说明",
      "benchmark_estimate": "预估性能提升百分比"
    }
  ],
  "current_analysis": {
    "existing_indexes": "现有索引评估",
    "performance_bottlenecks": "性能瓶颈识别", 
    "optimization_potential": "优化潜力评分"
  },
  "implementation_plan": {
    "phase1": "高优先级索引",
    "phase2": "中等优先级索引",
    "monitoring": "性能监控建议"
  }
}
\`\`\`

请基于你的代码优化专长，提供精准的索引优化方案。`
  }

  // 解析代码生成响应
  private parseCodeGenResponse(response: string, dialect: SQLDialect): any {
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
          warnings: parsed.metadata?.warnings || [],
          deploymentOrder: parsed.metadata?.deployment_order || []
        }
      }
    } catch (error) {
      logger.warn('DeepSeek代码生成响应解析失败', { error: error.message })
      throw new Error(`代码生成响应解析失败: ${error.message}`)
    }
  }

  // 解析代码分析响应
  private parseAnalysisResponse(response: string): any[] {
    try {
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      const jsonContent = jsonMatch ? jsonMatch[1] : response
      
      const parsed = JSON.parse(jsonContent)
      return parsed.suggestions || []
    } catch (error) {
      logger.warn('DeepSeek代码分析响应解析失败', { error: error.message })
      return []
    }
  }

  // 解析索引优化响应
  private parseIndexOptimizationResponse(response: string, tableName: string): IndexSuggestion[] {
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
      logger.warn('DeepSeek索引优化响应解析失败', { tableName, error: error.message })
      return []
    }
  }
}