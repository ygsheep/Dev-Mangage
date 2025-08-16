import { DocumentType, ParseResult, ParseOptions, ParsedModel } from '../types'
import { aiParsingService } from '../aiParsingService'
import { ModelValidationService } from '../validation'
import { prisma } from '../../../database'
import logger from '../../../utils/logger'
import { EventEmitter } from 'events'

export interface BatchImportJob {
  id: string
  projectId: string
  name: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  documents: BatchDocument[]
  options: BatchImportOptions
  results?: BatchImportResult
  progress: BatchProgress
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  error?: string
}

export interface BatchDocument {
  id: string
  filename: string
  content: string
  type: DocumentType
  size: number
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'SKIPPED'
  parseResult?: ParseResult
  validationResult?: any
  error?: string
}

export interface BatchImportOptions extends ParseOptions {
  enableValidation?: boolean
  enableAutoCorrection?: boolean
  correctionMode?: 'conservative' | 'aggressive' | 'custom'
  skipOnError?: boolean
  parallelProcessing?: boolean
  maxConcurrency?: number
  mergeStrategy?: 'append' | 'merge' | 'replace'
  conflictResolution?: 'skip' | 'overwrite' | 'rename'
  generateReport?: boolean
  provider?: string
}

export interface BatchProgress {
  total: number
  processed: number
  successful: number
  failed: number
  skipped: number
  percentage: number
  currentDocument?: string
  estimatedTimeRemaining?: number
  startTime?: Date
}

export interface BatchImportResult {
  totalDocuments: number
  processedDocuments: number
  successfulParsing: number
  failedParsing: number
  skippedDocuments: number
  mergedTables: number
  totalTables: number
  totalFields: number
  validationSummary?: {
    totalModels: number
    averageScore: number
    issuesFound: number
    issuesFixed: number
  }
  performanceMetrics: {
    totalTime: number
    averageTimePerDocument: number
    peakMemoryUsage?: number
  }
  report?: string
}

export class BatchImportService extends EventEmitter {
  private activeJobs: Map<string, BatchImportJob> = new Map()
  private jobQueue: string[] = []
  private isProcessing: boolean = false

  constructor() {
    super()
    this.setMaxListeners(100) // 支持更多监听器
  }

  /**
   * 创建批量导入任务
   */
  async createBatchJob(
    projectId: string,
    documents: Array<{ filename: string, content: string, type: DocumentType }>,
    options: BatchImportOptions = {}
  ): Promise<string> {
    const jobId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const batchDocuments: BatchDocument[] = documents.map((doc, index) => ({
      id: `doc_${index + 1}`,
      filename: doc.filename,
      content: doc.content,
      type: doc.type,
      size: Buffer.byteLength(doc.content, 'utf8'),
      status: 'PENDING'
    }))

    const job: BatchImportJob = {
      id: jobId,
      projectId,
      name: options.modelName || `批量导入_${new Date().toLocaleString()}`,
      status: 'PENDING',
      documents: batchDocuments,
      options: {
        enableValidation: true,
        enableAutoCorrection: true,
        correctionMode: 'conservative',
        skipOnError: false,
        parallelProcessing: true,
        maxConcurrency: 3,
        mergeStrategy: 'merge',
        conflictResolution: 'rename',
        generateReport: true,
        ...options
      },
      progress: {
        total: batchDocuments.length,
        processed: 0,
        successful: 0,
        failed: 0,
        skipped: 0,
        percentage: 0,
        startTime: new Date()
      },
      createdAt: new Date()
    }

    this.activeJobs.set(jobId, job)
    this.jobQueue.push(jobId)

    logger.info('批量导入任务已创建', {
      jobId,
      projectId,
      documentsCount: documents.length,
      options: { ...options, content: undefined }
    })

    // 触发任务队列处理
    this.processJobQueue()

    return jobId
  }

  /**
   * 获取任务状态
   */
  getJobStatus(jobId: string): BatchImportJob | null {
    return this.activeJobs.get(jobId) || null
  }

  /**
   * 获取任务列表
   */
  getActiveJobs(): BatchImportJob[] {
    return Array.from(this.activeJobs.values())
  }

  /**
   * 取消任务
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.activeJobs.get(jobId)
    if (!job) return false

    if (job.status === 'PROCESSING') {
      job.status = 'CANCELLED'
      this.emit('jobCancelled', job)
      logger.info('批量导入任务已取消', { jobId })
    }

    return true
  }

  /**
   * 处理任务队列
   */
  private async processJobQueue(): Promise<void> {
    if (this.isProcessing || this.jobQueue.length === 0) {
      return
    }

    this.isProcessing = true

    while (this.jobQueue.length > 0) {
      const jobId = this.jobQueue.shift()!
      const job = this.activeJobs.get(jobId)

      if (!job || job.status !== 'PENDING') {
        continue
      }

      try {
        await this.processJob(job)
      } catch (error) {
        logger.error('批量导入任务处理失败', { jobId, error: error.message })
        job.status = 'FAILED'
        job.error = error.message
        this.emit('jobFailed', job, error)
      }
    }

    this.isProcessing = false
  }

  /**
   * 处理单个任务
   */
  private async processJob(job: BatchImportJob): Promise<void> {
    const startTime = Date.now()
    job.status = 'PROCESSING'
    job.startedAt = new Date()
    
    this.emit('jobStarted', job)
    logger.info('开始处理批量导入任务', { 
      jobId: job.id, 
      projectId: job.projectId,
      documentsCount: job.documents.length 
    })

    try {
      // 并行或串行处理文档
      if (job.options.parallelProcessing) {
        await this.processDocumentsParallel(job)
      } else {
        await this.processDocumentsSequential(job)
      }

      // 合并解析结果
      const mergedModel = await this.mergeParseResults(job)

      // 保存到数据库
      if (mergedModel) {
        await this.saveMergedModel(job, mergedModel)
      }

      // 生成报告
      if (job.options.generateReport) {
        const report = this.generateBatchReport(job)
        job.results!.report = report
      }

      job.status = 'COMPLETED'
      job.completedAt = new Date()
      
      // 计算性能指标
      const totalTime = Date.now() - startTime
      job.results!.performanceMetrics = {
        totalTime,
        averageTimePerDocument: totalTime / job.documents.length,
        peakMemoryUsage: process.memoryUsage().heapUsed
      }

      this.emit('jobCompleted', job)
      logger.info('批量导入任务完成', { 
        jobId: job.id,
        totalTime: `${totalTime}ms`,
        successRate: `${(job.results!.successfulParsing / job.results!.totalDocuments * 100).toFixed(1)}%`
      })

      // 清理已完成的任务（保留一段时间）
      setTimeout(() => {
        this.activeJobs.delete(job.id)
      }, 5 * 60 * 1000) // 5分钟后清理

    } catch (error) {
      job.status = 'FAILED'
      job.error = error.message
      job.completedAt = new Date()
      
      this.emit('jobFailed', job, error)
      throw error
    }
  }

  /**
   * 并行处理文档
   */
  private async processDocumentsParallel(job: BatchImportJob): Promise<void> {
    const concurrency = job.options.maxConcurrency || 3
    const semaphore = new Array(concurrency).fill(null)
    
    const processDocument = async (document: BatchDocument): Promise<void> => {
      document.status = 'PROCESSING'
      job.progress.currentDocument = document.filename
      
      this.emit('documentStarted', job, document)

      try {
        // 解析文档
        const parseResult = await aiParsingService.parseDocument(
          job.projectId,
          document.content,
          document.type,
          document.filename,
          job.options
        )

        document.parseResult = parseResult
        document.status = parseResult.success ? 'COMPLETED' : 'FAILED'
        
        if (!parseResult.success) {
          document.error = parseResult.error
          job.progress.failed++
        } else {
          job.progress.successful++
          
          // 如果启用验证，进行模型验证
          if (job.options.enableValidation && parseResult.data) {
            const validationResult = ModelValidationService.quickValidate(parseResult.data)
            document.validationResult = validationResult
          }
        }

      } catch (error) {
        document.status = 'FAILED'
        document.error = error.message
        job.progress.failed++
        
        if (!job.options.skipOnError) {
          throw error
        }
      }

      job.progress.processed++
      job.progress.percentage = Math.round((job.progress.processed / job.progress.total) * 100)
      
      this.emit('documentCompleted', job, document)
      this.emit('progressUpdate', job)
    }

    // 使用Promise.allSettled确保所有文档都被处理
    const promises = job.documents.map(async (document) => {
      // 等待可用的并发槽位
      await new Promise(resolve => {
        const checkSlot = () => {
          const availableIndex = semaphore.findIndex(slot => slot === null)
          if (availableIndex !== -1) {
            semaphore[availableIndex] = document.id
            resolve(availableIndex)
          } else {
            setTimeout(checkSlot, 100)
          }
        }
        checkSlot()
      })

      try {
        await processDocument(document)
      } finally {
        const slotIndex = semaphore.findIndex(slot => slot === document.id)
        if (slotIndex !== -1) {
          semaphore[slotIndex] = null
        }
      }
    })

    await Promise.allSettled(promises)
  }

  /**
   * 串行处理文档
   */
  private async processDocumentsSequential(job: BatchImportJob): Promise<void> {
    for (const document of job.documents) {
      if (job.status === 'CANCELLED') {
        document.status = 'SKIPPED'
        job.progress.skipped++
        continue
      }

      document.status = 'PROCESSING'
      job.progress.currentDocument = document.filename
      
      this.emit('documentStarted', job, document)

      try {
        const parseResult = await aiParsingService.parseDocument(
          job.projectId,
          document.content,
          document.type,
          document.filename,
          job.options
        )

        document.parseResult = parseResult
        document.status = parseResult.success ? 'COMPLETED' : 'FAILED'
        
        if (!parseResult.success) {
          document.error = parseResult.error
          job.progress.failed++
          
          if (!job.options.skipOnError) {
            throw new Error(`文档 ${document.filename} 解析失败: ${parseResult.error}`)
          }
        } else {
          job.progress.successful++
          
          if (job.options.enableValidation && parseResult.data) {
            const validationResult = ModelValidationService.quickValidate(parseResult.data)
            document.validationResult = validationResult
          }
        }

      } catch (error) {
        document.status = 'FAILED'
        document.error = error.message
        job.progress.failed++
        
        if (!job.options.skipOnError) {
          throw error
        }
      }

      job.progress.processed++
      job.progress.percentage = Math.round((job.progress.processed / job.progress.total) * 100)
      
      this.emit('documentCompleted', job, document)
      this.emit('progressUpdate', job)
    }
  }

  /**
   * 合并解析结果
   */
  private async mergeParseResults(job: BatchImportJob): Promise<ParsedModel | null> {
    const successfulResults = job.documents
      .filter(doc => doc.status === 'COMPLETED' && doc.parseResult?.success && doc.parseResult.data)
      .map(doc => doc.parseResult!.data!)

    if (successfulResults.length === 0) {
      return null
    }

    logger.info('开始合并解析结果', { 
      jobId: job.id,
      modelsCount: successfulResults.length 
    })

    // 根据合并策略处理
    const mergedModel: ParsedModel = {
      name: job.name,
      description: `批量导入合并的数据模型，包含${successfulResults.length}个文档的解析结果`,
      version: '1.0.0',
      tables: [],
      relationships: []
    }

    const tableNameMap = new Map<string, number>() // 用于处理重名表

    for (const model of successfulResults) {
      for (const table of model.tables) {
        let finalTableName = table.name
        
        // 处理表名冲突
        if (job.options.conflictResolution === 'rename') {
          const baseTableName = table.name
          let counter = tableNameMap.get(baseTableName) || 0
          
          if (counter > 0) {
            finalTableName = `${baseTableName}_${counter}`
          }
          
          tableNameMap.set(baseTableName, counter + 1)
        } else if (job.options.conflictResolution === 'skip') {
          const existingTable = mergedModel.tables.find(t => t.name === table.name)
          if (existingTable) {
            continue // 跳过重名表
          }
        }

        // 添加表到合并模型
        mergedModel.tables.push({
          ...table,
          name: finalTableName
        })
      }

      // 合并关系
      if (model.relationships) {
        mergedModel.relationships!.push(...model.relationships)
      }
    }

    // 统计信息
    job.results = {
      totalDocuments: job.documents.length,
      processedDocuments: job.progress.processed,
      successfulParsing: job.progress.successful,
      failedParsing: job.progress.failed,
      skippedDocuments: job.progress.skipped,
      mergedTables: mergedModel.tables.length,
      totalTables: successfulResults.reduce((sum, model) => sum + model.tables.length, 0),
      totalFields: mergedModel.tables.reduce((sum, table) => sum + table.fields.length, 0),
      performanceMetrics: {
        totalTime: 0,
        averageTimePerDocument: 0
      }
    }

    // 如果启用验证，对合并后的模型进行验证
    if (job.options.enableValidation) {
      const validationResult = ModelValidationService.quickValidate(mergedModel)
      
      job.results.validationSummary = {
        totalModels: 1,
        averageScore: validationResult.score,
        issuesFound: validationResult.issues.length,
        issuesFixed: 0
      }

      // 如果启用自动修正
      if (job.options.enableAutoCorrection) {
        const correctionResult = await ModelValidationService.validateAndCorrect(mergedModel, {
          enableAutoCorrection: true,
          correctionMode: job.options.correctionMode
        })

        if (correctionResult.correctionResult) {
          job.results.validationSummary.issuesFixed = correctionResult.correctionResult.appliedFixes.length
          return correctionResult.correctionResult.correctedModel
        }
      }
    }

    return mergedModel
  }

  /**
   * 保存合并的模型到数据库
   */
  private async saveMergedModel(job: BatchImportJob, model: ParsedModel): Promise<void> {
    logger.info('保存合并模型到数据库', { 
      jobId: job.id,
      tablesCount: model.tables.length 
    })

    try {
      // 这里可以调用现有的数据模型保存服务
      // 暂时记录到解析历史中
      await prisma.aIParseHistory.create({
        data: {
          projectId: job.projectId,
          fileName: `${job.name}_merged.json`,
          fileType: 'BATCH_IMPORT',
          aiProvider: job.options.provider || 'batch_service',
          parseResult: JSON.stringify(model),
          status: 'SUCCESS',
          processingTime: job.results?.performanceMetrics.totalTime || 0
        }
      })

      logger.info('合并模型已保存', { jobId: job.id })
    } catch (error) {
      logger.error('保存合并模型失败', { jobId: job.id, error: error.message })
      throw error
    }
  }

  /**
   * 生成批量导入报告
   */
  private generateBatchReport(job: BatchImportJob): string {
    const report = []
    const results = job.results!

    report.push(`# 批量导入报告`)
    report.push(``)
    report.push(`**任务名称**: ${job.name}`)
    report.push(`**项目ID**: ${job.projectId}`)
    report.push(`**执行时间**: ${job.startedAt?.toLocaleString()} - ${job.completedAt?.toLocaleString()}`)
    report.push(`**总耗时**: ${results.performanceMetrics.totalTime}ms`)
    report.push(``)

    // 处理统计
    report.push(`## 处理统计`)
    report.push(`- 文档总数: ${results.totalDocuments}`)
    report.push(`- 成功解析: ${results.successfulParsing}`)
    report.push(`- 解析失败: ${results.failedParsing}`)
    report.push(`- 跳过文档: ${results.skippedDocuments}`)
    report.push(`- 成功率: ${(results.successfulParsing / results.totalDocuments * 100).toFixed(1)}%`)
    report.push(``)

    // 模型统计
    report.push(`## 模型统计`)
    report.push(`- 合并后表数量: ${results.mergedTables}`)
    report.push(`- 原始表总数: ${results.totalTables}`)
    report.push(`- 总字段数: ${results.totalFields}`)
    report.push(`- 平均每表字段数: ${(results.totalFields / results.mergedTables).toFixed(1)}`)
    report.push(``)

    // 验证结果
    if (results.validationSummary) {
      report.push(`## 验证结果`)
      report.push(`- 模型质量评分: ${results.validationSummary.averageScore}/100`)
      report.push(`- 发现问题数: ${results.validationSummary.issuesFound}`)
      report.push(`- 自动修复数: ${results.validationSummary.issuesFixed}`)
      report.push(``)
    }

    // 性能指标
    report.push(`## 性能指标`)
    report.push(`- 总处理时间: ${results.performanceMetrics.totalTime}ms`)
    report.push(`- 平均每文档: ${results.performanceMetrics.averageTimePerDocument.toFixed(1)}ms`)
    if (results.performanceMetrics.peakMemoryUsage) {
      report.push(`- 峰值内存: ${(results.performanceMetrics.peakMemoryUsage / 1024 / 1024).toFixed(1)}MB`)
    }
    report.push(``)

    // 文档详情
    report.push(`## 文档处理详情`)
    for (const doc of job.documents) {
      const status = doc.status === 'COMPLETED' ? '✅' : 
                    doc.status === 'FAILED' ? '❌' : 
                    doc.status === 'SKIPPED' ? '⏭️' : '⏳'
      
      report.push(`${status} **${doc.filename}** (${doc.type})`)
      if (doc.error) {
        report.push(`   - 错误: ${doc.error}`)
      }
      if (doc.validationResult) {
        report.push(`   - 验证评分: ${doc.validationResult.score}/100`)
      }
    }

    return report.join('\n')
  }

  /**
   * 清理过期任务
   */
  cleanupExpiredJobs(maxAge: number = 24 * 60 * 60 * 1000): number {
    const now = Date.now()
    let cleanedCount = 0

    for (const [jobId, job] of this.activeJobs.entries()) {
      const jobAge = now - job.createdAt.getTime()
      
      if (jobAge > maxAge && ['COMPLETED', 'FAILED', 'CANCELLED'].includes(job.status)) {
        this.activeJobs.delete(jobId)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      logger.info('清理过期批量导入任务', { cleanedCount })
    }

    return cleanedCount
  }
}

// 单例实例
export const batchImportService = new BatchImportService()

// 定期清理过期任务
setInterval(() => {
  batchImportService.cleanupExpiredJobs()
}, 60 * 60 * 1000) // 每小时清理一次