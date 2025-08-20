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
  IndexSuggestion
} from './types'
import { OllamaAdapter } from './adapters/OllamaAdapter'
import { OpenAIAdapter } from './adapters/OpenAIAdapter'
import { DeepSeekAdapter } from './adapters/DeepSeekAdapter'
import logger from '../../utils/logger'

export class AIServiceManager {
  private providers: Map<string, AIServiceAdapter> = new Map()
  private configs: Map<string, AIServiceConfig> = new Map()
  private defaultProvider: string = 'ollama'

  constructor() {
    this.initializeProviders()
  }

  private initializeProviders(): void {
    try {
      const configs = this.loadConfigFromEnvironment()
      
      for (const [name, config] of Object.entries(configs)) {
        this.initializeProvider(name, config)
      }

      // 设置默认提供者
      if (this.providers.has('ollama')) {
        this.defaultProvider = 'ollama'
      } else if (this.providers.has('openai')) {
        this.defaultProvider = 'openai'
      } else if (this.providers.has('deepseek')) {
        this.defaultProvider = 'deepseek'
      }

      logger.info('AI服务管理器初始化完成', {
        totalProviders: this.providers.size,
        enabledProviders: Array.from(this.providers.keys()),
        defaultProvider: this.defaultProvider
      })

    } catch (error) {
      logger.error('AI服务管理器初始化失败', { error: error.message })
    }
  }

  private loadConfigFromEnvironment(): Record<string, AIServiceConfig> {
    return {
      ollama: {
        provider: 'ollama',
        enabled: process.env.OLLAMA_ENABLED === 'true' || true,
        apiUrl: process.env.OLLAMA_API_URL || 'http://localhost:11434',
        model: process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b',
        timeout: parseInt(process.env.OLLAMA_TIMEOUT || '60000'),
        maxRetries: parseInt(process.env.OLLAMA_MAX_RETRIES || '3'),
        temperature: parseFloat(process.env.OLLAMA_TEMPERATURE || '0.1')
      },
      openai: {
        provider: 'openai',
        enabled: !!process.env.OPENAI_API_KEY,
        apiKey: process.env.OPENAI_API_KEY,
        apiUrl: process.env.OPENAI_API_URL || 'https://api.openai.com/v1',
        model: process.env.OPENAI_MODEL || 'gpt-4',
        timeout: parseInt(process.env.OPENAI_TIMEOUT || '30000'),
        maxRetries: parseInt(process.env.OPENAI_MAX_RETRIES || '3'),
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.1'),
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4000')
      },
      deepseek: {
        provider: 'deepseek',
        enabled: !!process.env.DEEPSEEK_API_KEY,
        apiKey: process.env.DEEPSEEK_API_KEY,
        apiUrl: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1',
        model: process.env.DEEPSEEK_MODEL || 'deepseek-coder',
        timeout: parseInt(process.env.DEEPSEEK_TIMEOUT || '30000'),
        maxRetries: parseInt(process.env.DEEPSEEK_MAX_RETRIES || '3'),
        temperature: parseFloat(process.env.DEEPSEEK_TEMPERATURE || '0.1'),
        maxTokens: parseInt(process.env.DEEPSEEK_MAX_TOKENS || '4000')
      }
    }
  }

  private async initializeProvider(name: string, config: AIServiceConfig): Promise<void> {
    this.configs.set(name, config)
    
    if (!config.enabled) {
      return
    }

    try {
      let adapter: AIServiceAdapter
      
      switch (name) {
        case 'ollama':
          adapter = new OllamaAdapter(config)
          break
        case 'openai':
          adapter = new OpenAIAdapter(config)
          break
        case 'deepseek':
          adapter = new DeepSeekAdapter(config)
          break
        default:
          logger.warn(`未知的AI提供者: ${name}`)
          return
      }

      this.providers.set(name, adapter)
      logger.info(`${name} AI适配器初始化成功`, { 
        model: config.model,
        apiUrl: config.apiUrl 
      })
    } catch (error) {
      logger.error(`${name} AI适配器初始化失败`, { error: error.message })
    }
  }

  // 获取可用的提供者列表
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys())
  }

  // 获取详细的提供者信息
  async getAvailableProvidersWithDetails(): Promise<Array<{
    id: string,
    name: string,
    displayName: string,
    description: string,
    icon: string,
    enabled: boolean,
    model: string,
    status: 'healthy' | 'degraded' | 'unhealthy'
  }>> {
    const providers = []
    
    for (const [providerId, adapter] of this.providers.entries()) {
      const config = this.configs.get(providerId)
      if (!config) continue

      // 获取提供者健康状态
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'unhealthy'
      try {
        const health = await adapter.healthCheck()
        status = health.status
      } catch (error) {
        status = 'unhealthy'
      }

      // 构建提供者信息
      const providerInfo = {
        id: providerId,
        name: providerId,
        displayName: this.getProviderDisplayName(providerId),
        description: this.getProviderDescription(providerId),
        icon: this.getProviderIcon(providerId),
        enabled: config.enabled,
        model: adapter.getModelVersion(),
        status
      }

      providers.push(providerInfo)
    }

    return providers
  }

  private getProviderDisplayName(providerId: string): string {
    const displayNames = {
      'ollama': 'Ollama Local',
      'openai': 'OpenAI GPT',
      'deepseek': 'DeepSeek Coder',
      'claude': 'Claude AI',
      'qwen': 'Qwen Models'
    }
    return displayNames[providerId] || providerId
  }

  private getProviderDescription(providerId: string): string {
    const descriptions = {
      'ollama': '本地AI模型服务，支持多种开源模型',
      'openai': 'OpenAI官方API服务，包括GPT-4等模型',
      'deepseek': 'DeepSeek专业代码生成模型',
      'claude': 'Anthropic Claude AI助手',
      'qwen': '阿里通义千问系列模型'
    }
    return descriptions[providerId] || '第三方AI服务提供商'
  }

  private getProviderIcon(providerId: string): string {
    const icons = {
      'ollama': '/static/images/Ollama.png',
      'openai': '/static/images/openai.png',
      'deepseek': '/static/images/deepseek.png',
      'claude': '/static/images/Claude.png',
      'qwen': '/static/images/qwen.png'
    }
    return icons[providerId] || '/static/images/default-ai.png'
  }

  // 获取默认提供者
  getDefaultProvider(): string {
    return this.defaultProvider
  }

  // 设置默认提供者
  async setDefaultProvider(provider: string): Promise<void> {
    if (!this.providers.has(provider)) {
      throw new Error(`提供者 '${provider}' 不存在`)
    }

    const adapter = this.providers.get(provider)
    const isAvailable = await adapter.isAvailable()
    
    if (!isAvailable) {
      throw new Error(`提供者 '${provider}' 当前不可用`)
    }

    this.defaultProvider = provider
    logger.info('默认AI提供者已更改', { newProvider: provider })
  }

  // 获取提供者信息
  getProviderInfo(provider?: string): any {
    const targetProvider = provider || this.defaultProvider
    const adapter = this.providers.get(targetProvider)
    const config = this.configs.get(targetProvider)
    
    if (!adapter || !config) {
      return null
    }

    return {
      name: adapter.getProviderName(),
      model: adapter.getModelVersion(),
      enabled: config.enabled,
      config: {
        ...config,
        apiKey: config.apiKey ? '[CONFIGURED]' : '[NOT_SET]'
      }
    }
  }

  // 健康检查
  async healthCheck(provider?: string): Promise<{ provider: string, status: string, details?: any }[]> {
    const results = []
    const providersToCheck = provider ? [provider] : Array.from(this.providers.keys())

    for (const providerName of providersToCheck) {
      const adapter = this.providers.get(providerName)
      if (adapter) {
        try {
          const health = await adapter.healthCheck()
          results.push({
            provider: providerName,
            status: health.status,
            details: health.details
          })
        } catch (error) {
          results.push({
            provider: providerName,
            status: 'unhealthy',
            details: { error: error.message }
          })
        }
      }
    }

    return results
  }

  // 获取可用模型列表
  async getAvailableModels(provider?: string): Promise<Array<{
    provider: string,
    models: Array<{ name: string, size?: number, modified_at?: string }>
  }>> {
    const results = []
    const providersToCheck = provider ? [provider] : Array.from(this.providers.keys())

    for (const providerName of providersToCheck) {
      const adapter = this.providers.get(providerName)
      if (adapter && typeof (adapter as any).detectAvailableModels === 'function') {
        try {
          const models = await (adapter as any).detectAvailableModels()
          results.push({
            provider: providerName,
            models: models.map((model: any) => ({
              name: model.name,
              size: model.size,
              modified_at: model.modified_at
            }))
          })
        } catch (error) {
          logger.warn(`获取${providerName}模型列表失败`, { error: error.message })
          results.push({
            provider: providerName,
            models: []
          })
        }
      }
    }

    return results
  }

  // 自动选择最佳模型
  async autoSelectBestModel(provider?: string): Promise<string | null> {
    const targetProvider = provider || this.defaultProvider
    const adapter = this.providers.get(targetProvider)
    
    if (adapter && typeof (adapter as any).autoSelectBestModel === 'function') {
      try {
        await (adapter as any).detectAvailableModels()
        return (adapter as any).autoSelectBestModel()
      } catch (error) {
        logger.warn(`自动选择${targetProvider}最佳模型失败`, { error: error.message })
      }
    }
    
    return null
  }

  // 文档解析
  async parseDocument(
    content: string,
    type: DocumentType,
    options: ParseOptions & { provider?: string } = {}
  ): Promise<ParseResult> {
    const { provider: requestedProvider, ...parseOptions } = options
    const provider = requestedProvider || this.defaultProvider
    const adapter = this.providers.get(provider)

    if (!adapter) {
      return {
        success: false,
        error: `AI提供者 "${provider}" 不可用`,
        metadata: {
          provider,
          timestamp: new Date()
        }
      }
    }

    try {
      logger.info('开始AI文档解析', {
        provider,
        documentType: type,
        contentLength: content.length
      })

      const startTime = Date.now()
      const result = await adapter.parseDocument(content, type, parseOptions)
      const processingTime = Date.now() - startTime

      logger.info('AI文档解析完成', {
        provider,
        success: result.success,
        processingTime: `${processingTime}ms`,
        tablesFound: result.data?.tables?.length || 0
      })

      return {
        ...result,
        metadata: {
          ...result.metadata,
          provider,
          processingTime
        }
      }
    } catch (error) {
      logger.error('AI文档解析失败', {
        provider,
        error: error.message,
        stack: error.stack
      })

      return {
        success: false,
        error: `解析失败: ${error.message}`,
        metadata: {
          provider,
          timestamp: new Date()
        }
      }
    }
  }

  // SQL生成
  async generateSQL(
    model: ParsedModel,
    dialect: SQLDialect,
    options: GenerateOptions & { provider?: string } = {}
  ): Promise<GenerateResult> {
    const { provider: requestedProvider, ...generateOptions } = options
    const provider = requestedProvider || this.defaultProvider
    const adapter = this.providers.get(provider)

    if (!adapter) {
      return {
        success: false,
        error: `AI提供者 "${provider}" 不可用`,
        metadata: {
          provider,
          timestamp: new Date()
        }
      }
    }

    try {
      logger.info('开始AI SQL生成', {
        provider,
        dialect,
        tablesCount: model.tables.length
      })

      const startTime = Date.now()
      const result = await adapter.generateSQL(model, dialect, generateOptions)
      const processingTime = Date.now() - startTime

      logger.info('AI SQL生成完成', {
        provider,
        success: result.success,
        processingTime: `${processingTime}ms`,
        statementsCount: result.data?.statements?.length || 0
      })

      return {
        ...result,
        metadata: {
          ...result.metadata,
          provider,
          processingTime
        }
      }
    } catch (error) {
      logger.error('AI SQL生成失败', {
        provider,
        error: error.message
      })

      return {
        success: false,
        error: `生成失败: ${error.message}`,
        metadata: {
          provider,
          timestamp: new Date()
        }
      }
    }
  }

  // 模式优化
  async optimizeSchema(
    tables: ParsedTable[],
    options: OptimizeOptions & { provider?: string } = {}
  ): Promise<OptimizeResult> {
    const { provider: requestedProvider, ...optimizeOptions } = options
    const provider = requestedProvider || this.defaultProvider
    const adapter = this.providers.get(provider)

    if (!adapter) {
      return {
        success: false,
        error: `AI提供者 "${provider}" 不可用`,
        metadata: {
          provider,
          timestamp: new Date(),
          analysisType: []
        }
      }
    }

    try {
      logger.info('开始AI模式优化分析', {
        provider,
        tablesCount: tables.length,
        analysisDepth: optimizeOptions.analysisDepth || 'standard'
      })

      const result = await adapter.optimizeSchema(tables, optimizeOptions)

      logger.info('AI模式优化分析完成', {
        provider,
        success: result.success,
        suggestionsCount: result.data?.length || 0
      })

      return {
        ...result,
        metadata: {
          ...result.metadata,
          provider
        }
      }
    } catch (error) {
      logger.error('AI模式优化分析失败', {
        provider,
        error: error.message
      })

      return {
        success: false,
        error: `优化分析失败: ${error.message}`,
        metadata: {
          provider,
          timestamp: new Date(),
          analysisType: []
        }
      }
    }
  }

  // 索引建议
  async suggestIndexes(
    table: ParsedTable,
    queryPatterns: string[] = [],
    provider?: string
  ): Promise<IndexSuggestion[]> {
    const targetProvider = provider || this.defaultProvider
    const adapter = this.providers.get(targetProvider)

    if (!adapter) {
      logger.warn('AI提供者不可用，返回空索引建议', { provider: targetProvider })
      return []
    }

    try {
      logger.info('开始AI索引建议分析', {
        provider: targetProvider,
        tableName: table.name,
        fieldsCount: table.fields.length,
        queryPatternsCount: queryPatterns.length
      })

      const suggestions = await adapter.suggestIndexes(table, queryPatterns)

      logger.info('AI索引建议分析完成', {
        provider: targetProvider,
        suggestionsCount: suggestions.length
      })

      return suggestions
    } catch (error) {
      logger.error('AI索引建议分析失败', {
        provider: targetProvider,
        tableName: table.name,
        error: error.message
      })
      return []
    }
  }

  // 批量文档解析
  async batchParseDocuments(
    documents: Array<{ content: string, type: DocumentType, filename?: string }>,
    options: ParseOptions & { provider?: string } = {}
  ): Promise<Array<ParseResult & { filename?: string }>> {
    const results = []

    for (const doc of documents) {
      try {
        const result = await this.parseDocument(doc.content, doc.type, options)
        results.push({
          ...result,
          filename: doc.filename
        })
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          filename: doc.filename,
          metadata: {
            provider: options.provider || this.defaultProvider,
            timestamp: new Date()
          }
        })
      }
    }

    logger.info('批量文档解析完成', {
      totalDocuments: documents.length,
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length
    })

    return results
  }

  // 获取使用统计
  getUsageStats(): any {
    return {
      providersCount: this.providers.size,
      enabledProviders: Array.from(this.providers.keys()),
      defaultProvider: this.defaultProvider,
      configs: Array.from(this.configs.entries()).map(([name, config]) => ({
        provider: name,
        enabled: config.enabled,
        model: config.model,
        hasApiKey: !!config.apiKey
      }))
    }
  }

  // 获取可用的提供者列表 (详细信息)
  async getAvailableProvidersDetailed(): Promise<Array<{ name: string, available: boolean, model: string }>> {
    const providers = []
    
    for (const [name, provider] of this.providers) {
      try {
        const available = await provider.isAvailable()
        providers.push({
          name,
          available,
          model: provider.getModelVersion()
        })
      } catch (error) {
        providers.push({
          name,
          available: false,
          model: provider.getModelVersion()
        })
      }
    }

    return providers
  }

  /**
   * 获取当前配置
   */
  getConfiguration(): any {
    const config = {
      defaultProvider: this.defaultProvider,
      providers: {},
      globalSettings: {}
    }

    this.configs.forEach((providerConfig, name) => {
      config.providers[name] = {
        model: providerConfig.model,
        apiUrl: providerConfig.apiUrl,
        timeout: providerConfig.timeout,
        maxRetries: providerConfig.maxRetries,
        temperature: providerConfig.temperature,
        maxTokens: providerConfig.maxTokens,
        // 不返回敏感信息如API密钥
        hasApiKey: !!providerConfig.apiKey
      }
    })

    return config
  }

  /**
   * 更新配置
   */
  async updateConfiguration(configUpdate: any): Promise<void> {
    if (configUpdate.defaultProvider) {
      await this.setDefaultProvider(configUpdate.defaultProvider)
    }

    if (configUpdate.providers) {
      for (const [providerName, providerConfig] of Object.entries(configUpdate.providers)) {
        if (this.configs.has(providerName)) {
          const currentConfig = this.configs.get(providerName)
          if (currentConfig && providerConfig && typeof providerConfig === 'object') {
            const updatedConfig = { ...currentConfig, ...providerConfig as Partial<AIServiceConfig> }
            this.configs.set(providerName, updatedConfig)

            // 重新初始化提供者
            await this.initializeProvider(providerName, updatedConfig)
          }
        }
      }
    }

    logger.info('AI服务配置已更新')
  }

  /**
   * 重新加载配置
   */
  async reloadConfiguration(): Promise<void> {
    // 重新读取环境变量和配置文件
    const configs = this.loadConfigFromEnvironment()
    
    // 重新初始化所有提供者
    this.providers.clear()
    this.configs.clear()

    for (const [name, config] of Object.entries(configs)) {
      await this.initializeProvider(name, config)
    }

    logger.info('AI服务配置已重新加载')
  }

  /**
   * 测试提供者连接
   */
  async testProvider(providerName: string): Promise<any> {
    const provider = this.providers.get(providerName)
    if (!provider) {
      throw new Error(`提供者 '${providerName}' 不存在`)
    }

    const healthCheck = await provider.healthCheck()
    return {
      provider: providerName,
      model: provider.getModelVersion(),
      ...healthCheck
    }
  }

  /**
   * 更新提供者配置
   */
  async updateProviderConfig(providerName: string, newConfig: Partial<AIServiceConfig>): Promise<boolean> {
    try {
      const currentConfig = this.configs.get(providerName)
      if (!currentConfig) {
        throw new Error(`提供者 '${providerName}' 不存在`)
      }

      // 合并新配置
      const updatedConfig: AIServiceConfig = {
        ...currentConfig,
        ...newConfig,
        enabled: true // 更新配置时启用该提供者
      }

      // 更新内存中的配置
      this.configs.set(providerName, updatedConfig)

      // 重新初始化该提供者
      this.initializeProvider(providerName, updatedConfig)

      // 如果更新成功，设置为默认提供者
      this.defaultProvider = providerName

      logger.info('AI提供者配置已更新', { 
        provider: providerName, 
        model: newConfig.model,
        hasApiKey: !!newConfig.apiKey
      })

      return true
    } catch (error) {
      logger.error('更新AI提供者配置失败', { 
        provider: providerName, 
        error: error.message 
      })
      return false
    }
  }

  /**
   * 获取当前配置
   */
  async getCurrentConfig(): Promise<any> {
    const defaultProvider = this.getDefaultProvider()
    const config = this.configs.get(defaultProvider)
    const adapter = this.providers.get(defaultProvider)

    if (!config || !adapter) {
      return {
        provider: defaultProvider,
        model: 'unknown',
        enabled: false,
        available: false
      }
    }

    const isAvailable = await adapter.isAvailable()

    return {
      provider: defaultProvider,
      model: adapter.getModelVersion(),
      baseUrl: config.apiUrl,
      enabled: config.enabled,
      available: isAvailable,
      timeout: config.timeout || 120000,
      temperature: config.temperature || 0.1,
      hasApiKey: !!config.apiKey
    }
  }

}

// 单例实例
export const aiServiceManager = new AIServiceManager()