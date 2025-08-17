import { 
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
import { aiServiceManager } from './AIServiceManager'
import { prisma } from '../../database'
import logger from '../../utils/logger'

export class AIParsingService {
  
  /**
   * 解析数据库文档
   * @param projectId 项目ID
   * @param content 文档内容
   * @param type 文档类型
   * @param filename 文件名
   * @param options 解析选项
   */
  async parseDocument(
    projectId: string,
    content: string,
    type: DocumentType,
    filename: string,
    options: ParseOptions & { provider?: string } = {}
  ): Promise<ParseResult & { historyId?: string }> {
    const startTime = Date.now()
    
    try {
      logger.info('开始AI文档解析', {
        projectId,
        filename,
        documentType: type,
        contentLength: content.length,
        provider: options.provider || 'default'
      })

      // 调用AI服务进行解析
      const parseResult = await aiServiceManager.parseDocument(content, type, options)
      const processingTime = Date.now() - startTime

      // 记录解析历史
      const historyRecord = await this.recordParseHistory(
        projectId,
        filename,
        type,
        options.provider || aiServiceManager.getDefaultProvider(),
        parseResult,
        processingTime
      )

      logger.info('AI文档解析完成', {
        projectId,
        filename,
        success: parseResult.success,
        processingTime: `${processingTime}ms`,
        tablesFound: parseResult.data?.tables?.length || 0,
        historyId: historyRecord.id
      })

      return {
        ...parseResult,
        historyId: historyRecord.id
      }
    } catch (error) {
      const processingTime = Date.now() - startTime
      
      logger.error('AI文档解析失败', {
        projectId,
        filename,
        error: error.message,
        processingTime: `${processingTime}ms`
      })

      // 记录失败的解析历史
      const historyRecord = await this.recordParseHistory(
        projectId,
        filename,
        type,
        options.provider || aiServiceManager.getDefaultProvider(),
        { success: false, error: error.message },
        processingTime
      )

      return {
        success: false,
        error: error.message,
        metadata: {
          provider: options.provider || aiServiceManager.getDefaultProvider(),
          timestamp: new Date(),
          processingTime
        },
        historyId: historyRecord.id
      }
    }
  }

  /**
   * 生成SQL代码
   * @param model 数据模型
   * @param dialect SQL方言
   * @param options 生成选项
   */
  async generateSQL(
    model: ParsedModel,
    dialect: SQLDialect,
    options: GenerateOptions & { provider?: string } = {}
  ): Promise<GenerateResult> {
    try {
      logger.info('开始SQL代码生成', {
        modelName: model.name,
        dialect,
        tablesCount: model.tables.length
      })

      // 使用SQLDialectManager生成SQL
      const { SQLDialectManager } = await import('./sqlGeneration/SQLDialectManager')
      const sqlResult = SQLDialectManager.generateSQL(model, dialect, {
        includeComments: true,
        includeIndexes: true,
        includeConstraints: true,
        includeForeignKeys: true,
        ...options,
        formatStyle: 'pretty'
      })

      const result: GenerateResult = {
        success: true,
        data: {
          dialect,
          statements: sqlResult.statements,
          metadata: sqlResult.metadata
        },
        metadata: {
          provider: 'SQLDialectManager',
          timestamp: new Date()
        }
      }

      logger.info('SQL代码生成完成', {
        modelName: model.name,
        statementsCount: sqlResult.statements.length,
        warnings: sqlResult.metadata.warnings?.length || 0
      })

      return result
    } catch (error) {
      logger.error('SQL代码生成失败', {
        modelName: model.name,
        error: error.message
      })

      return {
        success: false,
        error: error.message,
        metadata: {
          provider: options.provider || 'SQLDialectManager',
          timestamp: new Date()
        }
      }
    }
  }

  /**
   * 优化数据库模式
   * @param projectId 项目ID
   * @param options 优化选项
   */
  async optimizeProjectSchema(
    projectId: string,
    options: OptimizeOptions & { provider?: string } = {}
  ): Promise<OptimizeResult> {
    try {
      // 获取项目的所有表
      const tables = await prisma.databaseTable.findMany({
        where: { projectId },
        include: {
          fields: {
            include: {
              enumValues: true
            }
          },
          indexes: {
            include: {
              fields: true
            }
          },
          fromRelations: true,
          toRelations: true
        }
      })

      if (tables.length === 0) {
        return {
          success: false,
          error: '项目中没有数据表',
          metadata: {
            provider: options.provider || aiServiceManager.getDefaultProvider(),
            timestamp: new Date(),
            analysisType: []
          }
        }
      }

      // 转换为AI服务需要的格式
      const parsedTables: ParsedTable[] = tables.map(table => ({
        name: table.name,
        displayName: table.displayName,
        comment: table.comment,
        category: table.category,
        engine: table.engine,
        charset: table.charset,
        collation: table.collation,
        fields: table.fields.map(field => ({
          name: field.name,
          type: field.type,
          length: field.length,
          precision: field.precision,
          scale: field.scale,
          nullable: field.nullable,
          defaultValue: field.defaultValue,
          comment: field.comment,
          isPrimaryKey: field.isPrimaryKey,
          isAutoIncrement: field.isAutoIncrement,
          isUnique: field.isUnique,
          isIndex: field.isIndex,
          enumValues: field.enumValues?.map(ev => ev.value) || []
        })),
        indexes: table.indexes?.map(index => ({
          name: index.name,
          type: index.type as any,
          fields: index.fields.map(f => f.fieldName),
          isUnique: index.isUnique,
          comment: index.comment
        })) || []
      }))

      logger.info('开始AI模式优化分析', {
        projectId,
        tablesCount: parsedTables.length,
        provider: options.provider || 'default'
      })

      const result = await aiServiceManager.optimizeSchema(parsedTables, options)

      logger.info('AI模式优化分析完成', {
        projectId,
        success: result.success,
        suggestionsCount: result.data?.length || 0
      })

      return result
    } catch (error) {
      logger.error('AI模式优化分析失败', {
        projectId,
        error: error.message
      })

      return {
        success: false,
        error: error.message,
        metadata: {
          provider: options.provider || aiServiceManager.getDefaultProvider(),
          timestamp: new Date(),
          analysisType: []
        }
      }
    }
  }

  /**
   * 为表生成索引建议
   * @param tableId 表ID
   * @param queryPatterns 查询模式
   * @param provider AI提供者
   */
  async suggestTableIndexes(
    tableId: string,
    queryPatterns: string[] = [],
    provider?: string
  ): Promise<IndexSuggestion[]> {
    try {
      // 获取表信息
      const table = await prisma.databaseTable.findUnique({
        where: { id: tableId },
        include: {
          fields: {
            include: {
              enumValues: true
            }
          },
          indexes: true
        }
      })

      if (!table) {
        logger.warn('表不存在，无法生成索引建议', { tableId })
        return []
      }

      // 转换为AI服务需要的格式
      const parsedTable: ParsedTable = {
        name: table.name,
        displayName: table.displayName,
        comment: table.comment,
        category: table.category,
        fields: table.fields.map(field => ({
          name: field.name,
          type: field.type,
          length: field.length,
          nullable: field.nullable,
          defaultValue: field.defaultValue,
          comment: field.comment,
          isPrimaryKey: field.isPrimaryKey,
          isAutoIncrement: field.isAutoIncrement,
          isUnique: field.isUnique,
          isIndex: field.isIndex,
          enumValues: field.enumValues?.map(ev => ev.value) || []
        }))
      }

      logger.info('开始AI索引建议分析', {
        tableId,
        tableName: table.name,
        fieldsCount: table.fields.length,
        queryPatternsCount: queryPatterns.length,
        provider: provider || 'default'
      })

      const suggestions = await aiServiceManager.suggestIndexes(parsedTable, queryPatterns, provider)

      logger.info('AI索引建议分析完成', {
        tableId,
        tableName: table.name,
        suggestionsCount: suggestions.length
      })

      return suggestions
    } catch (error) {
      logger.error('AI索引建议分析失败', {
        tableId,
        error: error.message
      })
      return []
    }
  }

  /**
   * 批量解析文档
   * @param projectId 项目ID
   * @param documents 文档列表
   * @param options 解析选项
   */
  async batchParseDocuments(
    projectId: string,
    documents: Array<{ content: string, type: DocumentType, filename?: string }>,
    options: ParseOptions & { provider?: string } = {}
  ): Promise<Array<ParseResult & { filename?: string, historyId?: string }>> {
    const results = []

    logger.info('开始批量AI文档解析', {
      projectId,
      documentsCount: documents.length,
      provider: options.provider || 'default'
    })

    for (const doc of documents) {
      try {
        const result = await this.parseDocument(
          projectId,
          doc.content,
          doc.type,
          doc.filename || `document_${Date.now()}`,
          options
        )
        results.push(result)
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          filename: doc.filename,
          metadata: {
            provider: options.provider || aiServiceManager.getDefaultProvider(),
            timestamp: new Date()
          }
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    logger.info('批量AI文档解析完成', {
      projectId,
      totalDocuments: documents.length,
      successCount,
      failureCount
    })

    return results
  }

  /**
   * 获取AI服务健康状态
   */
  async getHealthStatus(): Promise<{ 
    overall: 'healthy' | 'degraded' | 'unhealthy',
    providers: Array<{ provider: string, status: string, details?: any }>
  }> {
    try {
      const providerHealths = await aiServiceManager.healthCheck()
      
      const healthyCount = providerHealths.filter(p => p.status === 'healthy').length
      const totalCount = providerHealths.length

      let overall: 'healthy' | 'degraded' | 'unhealthy'
      if (healthyCount === totalCount) {
        overall = 'healthy'
      } else if (healthyCount > 0) {
        overall = 'degraded'
      } else {
        overall = 'unhealthy'
      }

      return {
        overall,
        providers: providerHealths
      }
    } catch (error) {
      logger.error('AI服务健康检查失败', { error: error.message })
      return {
        overall: 'unhealthy',
        providers: []
      }
    }
  }

  /**
   * 获取AI服务使用统计
   */
  getUsageStatistics(): any {
    return aiServiceManager.getUsageStats()
  }

  /**
   * 获取解析历史记录
   * @param projectId 项目ID
   * @param limit 限制数量
   */
  async getParseHistory(projectId: string, limit: number = 20): Promise<any[]> {
    try {
      const history = await prisma.aIParseHistory.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        take: limit
      })

      return history.map(record => ({
        id: record.id,
        fileName: record.fileName,
        fileType: record.fileType,
        aiProvider: record.aiProvider,
        status: record.status,
        createdAt: record.createdAt,
        tablesFound: Array.isArray(record.parseResult) ? 
          (record.parseResult as any).tables?.length || 0 : 0,
        errorMessage: record.errorMessage
      }))
    } catch (error) {
      logger.error('获取解析历史失败', { projectId, error: error.message })
      return []
    }
  }

  /**
   * 记录解析历史
   */
  private async recordParseHistory(
    projectId: string,
    fileName: string,
    fileType: DocumentType,
    aiProvider: string,
    parseResult: any,
    processingTime: number
  ): Promise<any> {
    try {
      const status = parseResult.success ? 'SUCCESS' : 'FAILED'
      
      const historyRecord = await prisma.aIParseHistory.create({
        data: {
          projectId,
          fileName,
          fileType,
          aiProvider,
          parseResult: parseResult.data || parseResult,
          status,
          errorMessage: parseResult.error,
          processingTime
        }
      })

      return historyRecord
    } catch (error) {
      logger.error('记录解析历史失败', {
        projectId,
        fileName,
        error: error.message
      })
      
      // 返回一个虚拟的记录，避免影响主流程
      return {
        id: `temp_${Date.now()}`,
        projectId,
        fileName,
        fileType,
        aiProvider,
        status: parseResult.success ? 'SUCCESS' : 'FAILED',
        createdAt: new Date()
      }
    }
  }
}

// 单例实例
export const aiParsingService = new AIParsingService()