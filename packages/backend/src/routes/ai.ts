import express from 'express'
import { aiParsingService } from '../services/ai/aiParsingService'
import { aiServiceManager } from '../services/ai/AIServiceManager'
import { DocumentType, SQLDialect } from '../services/ai/types'
import { validateRequest } from '../middleware/validation'
import { body, param, query } from 'express-validator'
import { AppError } from '../middleware/errorHandler'
import logger from '../utils/logger'

const router = express.Router()

/**
 * AI服务状态和配置管理路由
 */

// 获取AI服务健康状态
router.get('/health', async (req, res, next) => {
  try {
    const healthStatus = await aiParsingService.getHealthStatus()
    res.json({
      success: true,
      data: healthStatus
    })
  } catch (error) {
    next(new AppError(`AI服务健康检查失败: ${error.message}`, 500))
  }
})

// 获取可用的AI提供者列表
router.get('/providers', async (req, res, next) => {
  try {
    const providers = await aiServiceManager.getAvailableProviders()
    res.json({
      success: true,
      data: providers
    })
  } catch (error) {
    next(new AppError(`获取AI提供者列表失败: ${error.message}`, 500))
  }
})

// 获取详细的AI提供者信息
router.get('/providers/detailed', async (req, res, next) => {
  try {
    const providers = await aiServiceManager.getAvailableProvidersWithDetails()
    res.json({
      success: true,
      data: providers
    })
  } catch (error) {
    next(new AppError(`获取AI提供者详细信息失败: ${error.message}`, 500))
  }
})

// 获取可用模型列表
router.get('/models', [
  query('provider').optional().isString().withMessage('提供者名称必须是字符串'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { provider } = req.query
    const models = await aiServiceManager.getAvailableModels(provider as string)
    res.json({
      success: true,
      data: models
    })
  } catch (error) {
    next(new AppError(`获取模型列表失败: ${error.message}`, 500))
  }
})

// 自动选择最佳模型
router.post('/models/auto-select', [
  body('provider').optional().isString().withMessage('提供者名称必须是字符串'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { provider } = req.body
    const bestModel = await aiServiceManager.autoSelectBestModel(provider)
    
    if (!bestModel) {
      return next(new AppError('无法找到合适的模型', 404))
    }

    res.json({
      success: true,
      data: {
        provider: provider || aiServiceManager.getDefaultProvider(),
        selectedModel: bestModel
      }
    })
  } catch (error) {
    next(new AppError(`自动选择模型失败: ${error.message}`, 500))
  }
})

// 更新AI服务配置
router.post('/config', [
  body('provider').isString().withMessage('提供者名称必须是字符串'),
  body('model').isString().withMessage('模型名称必须是字符串'),
  body('baseUrl').optional().isString().withMessage('基础URL必须是字符串'),
  body('apiKey').optional().isString().withMessage('API密钥必须是字符串'),
  body('timeout').optional().isInt({ min: 1000, max: 300000 }).withMessage('超时时间必须在1-300秒之间'),
  body('temperature').optional().isFloat({ min: 0, max: 2 }).withMessage('温度值必须在0-2之间'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { provider, model, baseUrl, apiKey, timeout, temperature } = req.body
    
    // 验证提供者是否支持
    const availableProviders = await aiServiceManager.getAvailableProviders()
    if (!availableProviders.includes(provider)) {
      return next(new AppError(`不支持的AI提供者: ${provider}`, 400))
    }

    // 更新AI服务配置
    const success = await aiServiceManager.updateProviderConfig(provider, {
      model,
      baseUrl,
      apiKey,
      timeout: timeout || 120000,
      temperature: temperature || 0.1
    })

    if (!success) {
      return next(new AppError('更新AI配置失败', 500))
    }

    logger.info('AI配置已更新', { 
      provider, 
      model, 
      hasApiKey: !!apiKey,
      timeout: timeout || 120000 
    })

    res.json({
      success: true,
      data: {
        message: 'AI配置更新成功',
        provider,
        model,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    next(new AppError(`更新AI配置失败: ${error.message}`, 500))
  }
})

// 获取当前AI配置
router.get('/config', async (req, res, next) => {
  try {
    const config = await aiServiceManager.getCurrentConfig()
    res.json({
      success: true,
      data: config
    })
  } catch (error) {
    next(new AppError(`获取AI配置失败: ${error.message}`, 500))
  }
})

// 获取AI服务使用统计
router.get('/usage', async (req, res, next) => {
  try {
    const stats = aiParsingService.getUsageStatistics()
    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    next(new AppError('获取使用统计失败: ' + error.message, 500))
  }
})

// 切换默认AI提供者
router.post('/provider/default', [
  body('provider').isString().notEmpty().withMessage('提供者名称不能为空'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { provider } = req.body
    await aiServiceManager.setDefaultProvider(provider)
    
    logger.info('默认AI提供者已切换', { 
      newProvider: provider,
      requestId: req.headers['x-request-id']
    })

    res.json({
      success: true,
      message: `默认AI提供者已切换为 ${provider}`
    })
  } catch (error) {
    next(new AppError('切换默认提供者失败: ' + error.message, 500))
  }
})

/**
 * 文档解析相关路由
 */

// 解析单个文档
router.post('/parse/document', [
  body('projectId').isUUID().withMessage('项目ID格式无效'),
  body('content').isString().notEmpty().withMessage('文档内容不能为空'),
  body('type').isIn(Object.values(DocumentType)).withMessage('文档类型无效'),
  body('filename').optional().isString(),
  body('provider').optional().isString(),
  body('strictMode').optional().isBoolean(),
  body('confidenceThreshold').optional().isFloat({ min: 0, max: 1 }),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId, content, type, filename, provider, ...options } = req.body
    
    const result = await aiParsingService.parseDocument(
      projectId,
      content,
      type as DocumentType,
      filename || `document_${Date.now()}`,
      { provider, ...options }
    )

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    next(new AppError('文档解析失败: ' + error.message, 500))
  }
})

// 批量解析文档（简单版本）
router.post('/parse/batch', [
  body('projectId').isUUID().withMessage('项目ID格式无效'),
  body('documents').isArray().withMessage('文档列表必须是数组'),
  body('documents.*.content').isString().notEmpty().withMessage('文档内容不能为空'),
  body('documents.*.type').isIn(Object.values(DocumentType)).withMessage('文档类型无效'),
  body('provider').optional().isString(),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId, documents, provider, ...options } = req.body
    
    const results = await aiParsingService.batchParseDocuments(
      projectId,
      documents,
      { provider, ...options }
    )

    res.json({
      success: true,
      data: results
    })
  } catch (error) {
    next(new AppError('批量文档解析失败: ' + error.message, 500))
  }
})

/**
 * 批量导入工作流相关路由
 */

// 创建批量导入任务
router.post('/batch/import', [
  body('projectId').isUUID().withMessage('项目ID格式无效'),
  body('documents').isArray().withMessage('文档列表必须是数组'),
  body('documents.*.filename').isString().notEmpty().withMessage('文件名不能为空'),
  body('documents.*.content').isString().notEmpty().withMessage('文档内容不能为空'),
  body('documents.*.type').isIn(Object.values(DocumentType)).withMessage('文档类型无效'),
  body('options').optional().isObject(),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId, documents, options = {} } = req.body
    
    const { batchImportService } = await import('../services/ai/batch/BatchImportService')
    const jobId = await batchImportService.createBatchJob(projectId, documents, options)

    res.json({
      success: true,
      data: { jobId }
    })
  } catch (error) {
    next(new AppError('创建批量导入任务失败: ' + error.message, 500))
  }
})

// 获取批量导入任务状态
router.get('/batch/status/:jobId', [
  param('jobId').isString().notEmpty().withMessage('任务ID不能为空'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { jobId } = req.params
    
    const { batchImportService } = await import('../services/ai/batch/BatchImportService')
    const job = batchImportService.getJobStatus(jobId)

    if (!job) {
      return next(new AppError('任务不存在', 404))
    }

    res.json({
      success: true,
      data: job
    })
  } catch (error) {
    next(new AppError('获取任务状态失败: ' + error.message, 500))
  }
})

// 获取所有活跃的批量导入任务
router.get('/batch/jobs', async (req, res, next) => {
  try {
    const { batchImportService } = await import('../services/ai/batch/BatchImportService')
    const jobs = batchImportService.getActiveJobs()

    res.json({
      success: true,
      data: jobs
    })
  } catch (error) {
    next(new AppError('获取任务列表失败: ' + error.message, 500))
  }
})

// 取消批量导入任务
router.post('/batch/cancel/:jobId', [
  param('jobId').isString().notEmpty().withMessage('任务ID不能为空'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { jobId } = req.params
    
    const { batchImportService } = await import('../services/ai/batch/BatchImportService')
    const cancelled = await batchImportService.cancelJob(jobId)

    if (!cancelled) {
      return next(new AppError('任务不存在或无法取消', 404))
    }

    res.json({
      success: true,
      message: '任务已取消'
    })
  } catch (error) {
    next(new AppError('取消任务失败: ' + error.message, 500))
  }
})

// 获取批量导入任务报告
router.get('/batch/report/:jobId', [
  param('jobId').isString().notEmpty().withMessage('任务ID不能为空'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { jobId } = req.params
    
    const { batchImportService } = await import('../services/ai/batch/BatchImportService')
    const job = batchImportService.getJobStatus(jobId)

    if (!job) {
      return next(new AppError('任务不存在', 404))
    }

    if (!job.results?.report) {
      return next(new AppError('报告尚未生成', 400))
    }

    res.json({
      success: true,
      data: {
        report: job.results.report,
        results: job.results
      }
    })
  } catch (error) {
    next(new AppError('获取任务报告失败: ' + error.message, 500))
  }
})

/**
 * SQL代码生成相关路由
 */

// 生成SQL代码
router.post('/generate/sql', [
  body('model').isObject().withMessage('数据模型必须是对象'),
  body('model.tables').isArray().withMessage('表定义必须是数组'),
  body('dialect').isIn(Object.values(SQLDialect)).withMessage('SQL方言无效'),
  body('provider').optional().isString(),
  body('includeIndexes').optional().isBoolean(),
  body('includeConstraints').optional().isBoolean(),
  validateRequest()
], async (req, res, next) => {
  try {
    const { model, dialect, provider, ...options } = req.body
    
    const result = await aiParsingService.generateSQL(
      model,
      dialect as SQLDialect,
      { provider, ...options }
    )

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    next(new AppError('SQL代码生成失败: ' + error.message, 500))
  }
})

// 生成迁移脚本
router.post('/generate/migration', [
  body('model').isObject().withMessage('数据模型必须是对象'),
  body('dialect').isIn(Object.values(SQLDialect)).withMessage('SQL方言无效'),
  body('oldModel').optional().isObject(),
  body('options').optional().isObject(),
  validateRequest()
], async (req, res, next) => {
  try {
    const { model, oldModel, dialect, options = {} } = req.body
    
    const { MigrationScriptGenerator } = await import('../services/ai/sqlGeneration/MigrationScriptGenerator')
    
    let migration
    if (oldModel) {
      // 生成差异迁移
      migration = MigrationScriptGenerator.generateDiffMigration(
        oldModel,
        model,
        dialect as SQLDialect,
        options
      )
    } else {
      // 生成创建迁移
      migration = MigrationScriptGenerator.generateModelMigration(
        model,
        dialect as SQLDialect,
        options
      )
    }

    res.json({
      success: true,
      data: migration
    })
  } catch (error) {
    next(new AppError('迁移脚本生成失败: ' + error.message, 500))
  }
})

// 生成迁移计划
router.post('/generate/migration-plan', [
  body('migrations').isArray().withMessage('迁移列表必须是数组'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { migrations } = req.body
    
    const { MigrationScriptGenerator } = await import('../services/ai/sqlGeneration/MigrationScriptGenerator')
    const plan = MigrationScriptGenerator.generateMigrationPlan(migrations)

    res.json({
      success: true,
      data: plan
    })
  } catch (error) {
    next(new AppError('迁移计划生成失败: ' + error.message, 500))
  }
})

// 生成回滚脚本
router.post('/generate/rollback/:migrationId', [
  param('migrationId').isString().notEmpty().withMessage('迁移ID不能为空'),
  body('migration').isObject().withMessage('迁移对象必须是对象'),
  body('targetVersion').optional().isString(),
  validateRequest()
], async (req, res, next) => {
  try {
    const { migrationId } = req.params
    const { migration, targetVersion } = req.body
    
    const { MigrationScriptGenerator } = await import('../services/ai/sqlGeneration/MigrationScriptGenerator')
    const rollbackScript = MigrationScriptGenerator.generateRollbackScript(migration, targetVersion)

    res.json({
      success: true,
      data: {
        migrationId,
        targetVersion,
        rollbackScript
      }
    })
  } catch (error) {
    next(new AppError('回滚脚本生成失败: ' + error.message, 500))
  }
})

/**
 * 数据库优化相关路由
 */

// 优化项目数据库模式
router.post('/optimize/schema/:projectId', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  body('focusAreas').optional().isArray(),
  body('analysisDepth').optional().isIn(['basic', 'standard', 'advanced']),
  body('targetEnvironment').optional().isIn(['development', 'staging', 'production']),
  body('provider').optional().isString(),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId } = req.params
    const { provider, ...options } = req.body
    
    const result = await aiParsingService.optimizeProjectSchema(
      projectId,
      { provider, ...options }
    )

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    next(new AppError('数据库模式优化失败: ' + error.message, 500))
  }
})

// 为表生成索引建议
router.post('/suggest/indexes/:tableId', [
  param('tableId').isUUID().withMessage('表ID格式无效'),
  body('queryPatterns').optional().isArray(),
  body('provider').optional().isString(),
  validateRequest()
], async (req, res, next) => {
  try {
    const { tableId } = req.params
    const { queryPatterns = [], provider } = req.body
    
    const suggestions = await aiParsingService.suggestTableIndexes(
      tableId,
      queryPatterns,
      provider
    )

    res.json({
      success: true,
      data: suggestions
    })
  } catch (error) {
    next(new AppError('索引建议生成失败: ' + error.message, 500))
  }
})

/**
 * 模型验证和修正相关路由
 */

// 验证数据模型
router.post('/validate/model', [
  body('model').isObject().withMessage('数据模型必须是对象'),
  body('model.name').isString().notEmpty().withMessage('模型名称不能为空'),
  body('model.tables').isArray().withMessage('表定义必须是数组'),
  body('options').optional().isObject(),
  validateRequest()
], async (req, res, next) => {
  try {
    const { model, options = {} } = req.body
    
    const { ModelValidationService } = await import('../services/ai/validation')
    const result = ModelValidationService.quickValidate(model, options)

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    next(new AppError('模型验证失败: ' + error.message, 500))
  }
})

// 验证并修正数据模型
router.post('/validate/correct', [
  body('model').isObject().withMessage('数据模型必须是对象'),
  body('model.name').isString().notEmpty().withMessage('模型名称不能为空'),
  body('model.tables').isArray().withMessage('表定义必须是数组'),
  body('options').optional().isObject(),
  body('enableAutoCorrection').optional().isBoolean(),
  body('correctionMode').optional().isIn(['conservative', 'aggressive', 'custom']),
  validateRequest()
], async (req, res, next) => {
  try {
    const { model, options = {} } = req.body
    
    const { ModelValidationService } = await import('../services/ai/validation')
    const result = await ModelValidationService.validateAndCorrect(model, options)

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    next(new AppError('模型验证和修正失败: ' + error.message, 500))
  }
})

// 智能修正数据模型
router.post('/correct/smart', [
  body('model').isObject().withMessage('数据模型必须是对象'),
  body('model.name').isString().notEmpty().withMessage('模型名称不能为空'),
  body('model.tables').isArray().withMessage('表定义必须是数组'),
  body('options').optional().isObject(),
  validateRequest()
], async (req, res, next) => {
  try {
    const { model, options = {} } = req.body
    
    const { ModelValidationService } = await import('../services/ai/validation')
    const result = await ModelValidationService.smartCorrect(model, options)

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    next(new AppError('智能模型修正失败: ' + error.message, 500))
  }
})

// 生成模型质量报告
router.post('/report/quality', [
  body('model').isObject().withMessage('数据模型必须是对象'),
  body('validationResult').optional().isObject(),
  validateRequest()
], async (req, res, next) => {
  try {
    const { model, validationResult } = req.body
    
    const { ModelValidationService } = await import('../services/ai/validation')
    
    let validation = validationResult
    if (!validation) {
      validation = ModelValidationService.quickValidate(model)
    }
    
    const report = ModelValidationService.generateQualityReport(model, validation)

    res.json({
      success: true,
      data: {
        report,
        validation
      }
    })
  } catch (error) {
    next(new AppError('生成质量报告失败: ' + error.message, 500))
  }
})

/**
 * 解析历史相关路由
 */

// 获取项目解析历史
router.get('/history/:projectId', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('限制数量必须在1-100之间'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId } = req.params
    const limit = parseInt(req.query.limit as string) || 20
    
    const history = await aiParsingService.getParseHistory(projectId, limit)

    res.json({
      success: true,
      data: history
    })
  } catch (error) {
    next(new AppError('获取解析历史失败: ' + error.message, 500))
  }
})

/**
 * 代码模板管理相关路由
 */

// 获取模板列表
router.get('/templates', [
  query('category').optional().isString(),
  query('dialect').optional().isIn(Object.values(SQLDialect)),
  query('tags').optional().isString(),
  query('search').optional().isString(),
  validateRequest()
], async (req, res, next) => {
  try {
    const { category, dialect, tags, search } = req.query
    
    const filters: any = {}
    if (category) filters.category = category
    if (dialect) filters.dialect = dialect
    if (tags) filters.tags = (tags as string).split(',')
    if (search) filters.search = search
    
    const { CodeTemplateManager } = await import('../services/ai/sqlGeneration/CodeTemplateManager')
    const templates = CodeTemplateManager.getTemplates(filters)

    res.json({
      success: true,
      data: templates
    })
  } catch (error) {
    next(new AppError('获取模板列表失败: ' + error.message, 500))
  }
})

// 获取模板详情
router.get('/templates/:templateId', [
  param('templateId').isString().notEmpty().withMessage('模板ID不能为空'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { templateId } = req.params
    
    const { CodeTemplateManager } = await import('../services/ai/sqlGeneration/CodeTemplateManager')
    const template = CodeTemplateManager.getTemplate(templateId)

    if (!template) {
      return next(new AppError('模板不存在', 404))
    }

    res.json({
      success: true,
      data: template
    })
  } catch (error) {
    next(new AppError('获取模板详情失败: ' + error.message, 500))
  }
})

// 渲染模板
router.post('/templates/:templateId/render', [
  param('templateId').isString().notEmpty().withMessage('模板ID不能为空'),
  body('context').isObject().withMessage('渲染上下文必须是对象'),
  body('context.model').isObject().withMessage('数据模型必须是对象'),
  body('context.dialect').isIn(Object.values(SQLDialect)).withMessage('SQL方言无效'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { templateId } = req.params
    const { context } = req.body
    
    const { CodeTemplateManager } = await import('../services/ai/sqlGeneration/CodeTemplateManager')
    const result = await CodeTemplateManager.renderTemplate(templateId, context)

    res.json({
      success: true,
      data: {
        templateId,
        output: result
      }
    })
  } catch (error) {
    next(new AppError('模板渲染失败: ' + error.message, 500))
  }
})

// 预览模板
router.post('/templates/:templateId/preview', [
  param('templateId').isString().notEmpty().withMessage('模板ID不能为空'),
  body('context').isObject().withMessage('渲染上下文必须是对象'),
  body('context.model').isObject().withMessage('数据模型必须是对象'),
  body('context.dialect').isIn(Object.values(SQLDialect)).withMessage('SQL方言无效'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { templateId } = req.params
    const { context } = req.body
    
    const { CodeTemplateManager } = await import('../services/ai/sqlGeneration/CodeTemplateManager')
    const result = await CodeTemplateManager.previewTemplate(templateId, context)

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    next(new AppError('模板预览失败: ' + error.message, 500))
  }
})

// 添加自定义模板
router.post('/templates', [
  body('name').isString().notEmpty().withMessage('模板名称不能为空'),
  body('description').isString().notEmpty().withMessage('模板描述不能为空'),
  body('category').isIn(['DDL', 'DML', 'PROCEDURE', 'FUNCTION', 'TRIGGER', 'VIEW', 'INDEX', 'CONSTRAINT']).withMessage('模板类别无效'),
  body('dialect').isIn([...Object.values(SQLDialect), 'ALL']).withMessage('SQL方言无效'),
  body('template').isString().notEmpty().withMessage('模板内容不能为空'),
  body('variables').isArray().withMessage('变量定义必须是数组'),
  body('tags').optional().isArray(),
  validateRequest()
], async (req, res, next) => {
  try {
    const templateData = req.body
    
    const { CodeTemplateManager } = await import('../services/ai/sqlGeneration/CodeTemplateManager')
    const templateId = await CodeTemplateManager.addTemplate(templateData)

    res.json({
      success: true,
      data: {
        templateId,
        message: '模板创建成功'
      }
    })
  } catch (error) {
    next(new AppError('创建模板失败: ' + error.message, 500))
  }
})

// 更新模板
router.put('/templates/:templateId', [
  param('templateId').isString().notEmpty().withMessage('模板ID不能为空'),
  body('name').optional().isString(),
  body('description').optional().isString(),
  body('template').optional().isString(),
  body('variables').optional().isArray(),
  body('tags').optional().isArray(),
  validateRequest()
], async (req, res, next) => {
  try {
    const { templateId } = req.params
    const updates = req.body
    
    const { CodeTemplateManager } = await import('../services/ai/sqlGeneration/CodeTemplateManager')
    await CodeTemplateManager.updateTemplate(templateId, updates)

    res.json({
      success: true,
      message: '模板更新成功'
    })
  } catch (error) {
    next(new AppError('更新模板失败: ' + error.message, 500))
  }
})

// 删除模板
router.delete('/templates/:templateId', [
  param('templateId').isString().notEmpty().withMessage('模板ID不能为空'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { templateId } = req.params
    
    const { CodeTemplateManager } = await import('../services/ai/sqlGeneration/CodeTemplateManager')
    await CodeTemplateManager.deleteTemplate(templateId)

    res.json({
      success: true,
      message: '模板删除成功'
    })
  } catch (error) {
    next(new AppError('删除模板失败: ' + error.message, 500))
  }
})

// 导出模板集合
router.post('/templates/export', [
  body('templateIds').isArray().withMessage('模板ID列表必须是数组'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { templateIds } = req.body
    
    const { CodeTemplateManager } = await import('../services/ai/sqlGeneration/CodeTemplateManager')
    const collection = await CodeTemplateManager.exportTemplateCollection(templateIds)

    res.json({
      success: true,
      data: collection
    })
  } catch (error) {
    next(new AppError('导出模板集合失败: ' + error.message, 500))
  }
})

// 导入模板集合
router.post('/templates/import', [
  body('collection').isObject().withMessage('模板集合必须是对象'),
  body('collection.templates').isArray().withMessage('模板列表必须是数组'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { collection } = req.body
    
    const { CodeTemplateManager } = await import('../services/ai/sqlGeneration/CodeTemplateManager')
    const importedIds = await CodeTemplateManager.importTemplateCollection(collection)

    res.json({
      success: true,
      data: {
        importedTemplates: importedIds.length,
        templateIds: importedIds
      }
    })
  } catch (error) {
    next(new AppError('导入模板集合失败: ' + error.message, 500))
  }
})

/**
 * 配置管理相关路由
 */

// 获取AI服务配置
router.get('/config', async (req, res, next) => {
  try {
    const config = aiServiceManager.getConfiguration()
    res.json({
      success: true,
      data: config
    })
  } catch (error) {
    next(new AppError('获取配置失败: ' + error.message, 500))
  }
})

// 更新AI服务配置
router.put('/config', [
  body('providers').optional().isObject(),
  body('defaultProvider').optional().isString(),
  body('globalSettings').optional().isObject(),
  validateRequest()
], async (req, res, next) => {
  try {
    const configUpdate = req.body
    await aiServiceManager.updateConfiguration(configUpdate)
    
    logger.info('AI服务配置已更新', { 
      update: configUpdate,
      requestId: req.headers['x-request-id']
    })

    res.json({
      success: true,
      message: 'AI服务配置更新成功'
    })
  } catch (error) {
    next(new AppError('更新配置失败: ' + error.message, 500))
  }
})

// 重新加载AI服务配置
router.post('/config/reload', async (req, res, next) => {
  try {
    await aiServiceManager.reloadConfiguration()
    
    logger.info('AI服务配置已重新加载', { 
      requestId: req.headers['x-request-id']
    })

    res.json({
      success: true,
      message: 'AI服务配置重新加载成功'
    })
  } catch (error) {
    next(new AppError('重新加载配置失败: ' + error.message, 500))
  }
})

// 测试AI服务连接
router.post('/test/:provider', [
  param('provider').isString().notEmpty().withMessage('提供者名称不能为空'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { provider } = req.params
    const testResult = await aiServiceManager.testProvider(provider)
    
    res.json({
      success: true,
      data: testResult
    })
  } catch (error) {
    next(new AppError('AI服务连接测试失败: ' + error.message, 500))
  }
})

export default router