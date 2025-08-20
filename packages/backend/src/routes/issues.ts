import express from 'express'
import { body, param, query } from 'express-validator'
import { validateRequest } from '../middleware/validation'
import { AppError } from '../middleware/errorHandler'
import { prisma } from '../lib/prisma'
import logger from '../utils/logger'

const router = express.Router()

/**
 * GitHub Issues 管理路由
 * 提供 Issue 的增删改查、关联管理、同步功能
 */

// 获取全局 Issues 列表（跨所有项目）
router.get('/issues', [
  query('status').optional().isIn(['OPEN', 'CLOSED']).withMessage('状态参数无效'),
  query('priority').optional().isIn(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).withMessage('优先级参数无效'),
  query('issueType').optional().isIn(['BUG', 'FEATURE', 'ENHANCEMENT', 'TASK', 'DOCUMENTATION', 'QUESTION']).withMessage('Issue类型无效'),
  query('assignee').optional().isString(),
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须大于0'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('限制数量必须在1-100之间'),
  validateRequest()
], async (req, res, next) => {
  try {
    const {
      status,
      priority,
      issueType,
      assignee,
      search,
      page = 1,
      limit = 20
    } = req.query

    logger.info('获取全局Issues列表', {
      filters: { status, priority, issueType, assignee, search },
      pagination: { page, limit }
    })

    // 构建查询条件
    const where: any = {}
    
    if (status) where.status = status
    if (priority) where.priority = priority
    if (issueType) where.issueType = issueType
    if (assignee) where.assignee = assignee
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // 计算分页
    const skip = (Number(page) - 1) * Number(limit)
    const take = Number(limit)

    // 获取Issues列表
    const [issues, total] = await Promise.all([
      prisma.issue.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        skip,
        take
      }),
      prisma.issue.count({ where })
    ])

    // 计算分页信息
    const totalPages = Math.ceil(total / take)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    res.json({
      success: true,
      data: {
        issues,
        pagination: {
          total,
          page: Number(page),
          limit: take,
          totalPages,
          hasNext,
          hasPrev
        }
      }
    })

  } catch (error) {
    logger.error('获取全局Issues列表失败', { error: error.message })
    next(error)
  }
})

// 获取项目的 Issues 列表
router.get('/:projectId/issues', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  query('status').optional().isIn(['OPEN', 'CLOSED']).withMessage('状态参数无效'),
  query('priority').optional().isIn(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).withMessage('优先级参数无效'),
  query('issueType').optional().isIn(['BUG', 'FEATURE', 'ENHANCEMENT', 'TASK', 'DOCUMENTATION', 'QUESTION']).withMessage('Issue类型无效'),
  query('assignee').optional().isString(),
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须大于0'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('限制数量必须在1-100之间'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId } = req.params
    const {
      status,
      priority,
      issueType,
      assignee,
      search,
      page = 1,
      limit = 20
    } = req.query

    // 验证项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return next(new AppError('项目不存在', 404))
    }

    // 构建查询条件
    const where: any = {
      projectId,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(issueType && { issueType }),
      ...(assignee && { assigneeId: assignee }),
      ...(search && {
        OR: [
          { title: { contains: search } },
          { description: { contains: search } }
        ]
      })
    }

    // 分页查询
    const offset = (Number(page) - 1) * Number(limit)
    
    const [issues, total] = await Promise.all([
      prisma.issue.findMany({
        where,
        include: {
          labels: true,
          relatedAPIs: {
            include: {
              endpoint: { select: { id: true, name: true, method: true, path: true } }
            }
          },
          relatedTables: {
            include: {
              table: { select: { id: true, name: true, displayName: true } }
            }
          },
          relatedFeatures: true,
          comments: {
            orderBy: { createdAt: 'desc' },
            take: 3,
            select: {
              id: true,
              content: true,
              authorName: true,
              createdAt: true
            }
          }
        },
        orderBy: [
          { priority: 'asc' },
          { createdAt: 'desc' }
        ],
        skip: offset,
        take: Number(limit)
      }),
      prisma.issue.count({ where })
    ])

    logger.info('获取Issues列表', {
      projectId,
      filters: { status, priority, issueType, assignee, search },
      pagination: { page, limit },
      totalFound: total
    })

    res.json({
      success: true,
      data: {
        issues,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
          hasNext: offset + Number(limit) < total,
          hasPrev: Number(page) > 1
        }
      }
    })
  } catch (error) {
    next(new AppError('获取Issues列表失败: ' + error.message, 500))
  }
})

// 获取 Issue 统计信息 - 放在动态路由之前
router.get('/:projectId/issues/stats', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId } = req.params

    // 验证项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return next(new AppError('项目不存在', 404))
    }

    const [
      totalCount,
      openCount,
      closedCount,
      priorityStats,
      typeStats,
      recentActivity
    ] = await Promise.all([
      // 总数统计
      prisma.issue.count({ where: { projectId } }),
      
      // 状态统计
      prisma.issue.count({ where: { projectId, status: 'OPEN' } }),
      prisma.issue.count({ where: { projectId, status: 'CLOSED' } }),
      
      // 优先级统计
      prisma.issue.groupBy({
        by: ['priority'],
        where: { projectId },
        _count: { priority: true }
      }),
      
      // 类型统计
      prisma.issue.groupBy({
        by: ['issueType'],
        where: { projectId },
        _count: { issueType: true }
      }),
      
      // 最近活动
      prisma.issue.findMany({
        where: { projectId },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { updatedAt: 'desc' },
        take: 10
      })
    ])

    const stats = {
      total: totalCount,
      open: openCount,
      closed: closedCount,
      byPriority: priorityStats.reduce((acc, item) => {
        acc[item.priority] = item._count.priority
        return acc
      }, {} as Record<string, number>),
      byType: typeStats.reduce((acc, item) => {
        acc[item.issueType] = item._count.issueType
        return acc
      }, {} as Record<string, number>),
      recentActivity
    }

    logger.info('获取Issue统计信息', { projectId, stats: { total: totalCount, open: openCount, closed: closedCount } })

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    next(new AppError('获取Issue统计信息失败: ' + error.message, 500))
  }
})

// 获取单个 Issue 详情
router.get('/:projectId/issues/:issueId', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  param('issueId').isUUID().withMessage('IssueID格式无效'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId, issueId } = req.params

    const issue = await prisma.issue.findFirst({
      where: {
        id: issueId,
        projectId
      },
      include: {
        labels: true,
        comments: {
          include: {
            replies: true
          },
          orderBy: { createdAt: 'asc' }
        },
        attachments: true,
        relatedAPIs: {
          include: {
            endpoint: { select: { id: true, name: true, method: true, path: true, status: true } }
          }
        },
        relatedTables: {
          include: {
            table: { select: { id: true, name: true, displayName: true, comment: true, status: true } }
          }
        },
        relatedFeatures: true,
        milestones: true,
        timeEntries: {
          orderBy: { date: 'desc' }
        }
      }
    })

    if (!issue) {
      return next(new AppError('Issue不存在', 404))
    }

    logger.info('获取Issue详情', { projectId, issueId })

    res.json({
      success: true,
      data: issue
    })
  } catch (error) {
    next(new AppError('获取Issue详情失败: ' + error.message, 500))
  }
})

// 创建新 Issue
router.post('/:projectId/issues', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  body('title').isString().notEmpty().withMessage('标题不能为空'),
  body('description').optional().isString(),
  body('priority').optional().isIn(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).withMessage('优先级无效'),
  body('severity').optional().isIn(['BLOCKER', 'CRITICAL', 'MAJOR', 'MINOR', 'TRIVIAL', 'NORMAL']).withMessage('严重程度无效'),
  body('issueType').optional().isIn(['BUG', 'FEATURE', 'ENHANCEMENT', 'TASK', 'DOCUMENTATION', 'QUESTION']).withMessage('Issue类型无效'),
  body('assigneeId').optional().isString(),
  body('assigneeName').optional().isString(),
  body('reporterId').optional().isString(),
  body('reporterName').optional().isString(),
  body('dueDate').optional().isISO8601().withMessage('截止日期格式无效'),
  body('estimatedHours').optional().isFloat({ min: 0 }).withMessage('预估工时必须大于等于0'),
  body('storyPoints').optional().isInt({ min: 0 }).withMessage('故事点数必须大于等于0'),
  body('labels').optional().isArray(),
  body('relatedAPIs').optional().isArray(),
  body('relatedTables').optional().isArray(),
  body('relatedFeatures').optional().isArray(),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId } = req.params
    const {
      title,
      description,
      priority = 'MEDIUM',
      severity = 'NORMAL',
      issueType = 'BUG',
      assigneeId,
      assigneeName,
      reporterId,
      reporterName,
      dueDate,
      estimatedHours,
      storyPoints,
      labels = [],
      relatedAPIs = [],
      relatedTables = [],
      relatedFeatures = []
    } = req.body

    // 验证项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return next(new AppError('项目不存在', 404))
    }

    // 在事务中创建 Issue 及其关联数据
    const result = await prisma.$transaction(async (tx) => {
      // 创建 Issue
      const newIssue = await tx.issue.create({
        data: {
          projectId,
          title: title.trim(),
          description: description?.trim(),
          priority,
          severity,
          issueType,
          assigneeId,
          assigneeName,
          reporterId,
          reporterName,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          estimatedHours,
          storyPoints
        }
      })

      // 创建标签
      if (labels.length > 0) {
        await tx.issueLabel.createMany({
          data: labels.map((label: any) => ({
            issueId: newIssue.id,
            name: label.name,
            color: label.color || '#3B82F6',
            description: label.description
          }))
        })
      }

      // 创建 API 关联
      if (relatedAPIs.length > 0) {
        await tx.issueAPIRelation.createMany({
          data: relatedAPIs.map((relation: any) => ({
            issueId: newIssue.id,
            endpointId: relation.endpointId,
            endpointId: relation.endpointId,
            relationType: relation.relationType || 'RELATES_TO',
            description: relation.description
          }))
        })
      }

      // 创建数据表关联
      if (relatedTables.length > 0) {
        await tx.issueTableRelation.createMany({
          data: relatedTables.map((relation: any) => ({
            issueId: newIssue.id,
            tableId: relation.tableId,
            relationType: relation.relationType || 'RELATES_TO',
            description: relation.description
          }))
        })
      }

      // 创建功能模块关联
      if (relatedFeatures.length > 0) {
        await tx.issueFeatureRelation.createMany({
          data: relatedFeatures.map((relation: any) => ({
            issueId: newIssue.id,
            featureName: relation.featureName,
            component: relation.component,
            relationType: relation.relationType || 'RELATES_TO',
            description: relation.description
          }))
        })
      }

      return newIssue
    })

    logger.info('创建新Issue', {
      projectId,
      issueId: result.id,
      title,
      issueType,
      priority,
      relationsCount: {
        labels: labels.length,
        apiEndpoints: relatedAPIs.length,
        tables: relatedTables.length,
        features: relatedFeatures.length
      }
    })

    res.status(201).json({
      success: true,
      data: result,
      message: 'Issue创建成功'
    })
  } catch (error) {
    next(new AppError('创建Issue失败: ' + error.message, 500))
  }
})

// 更新 Issue
router.put('/:projectId/issues/:issueId', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  param('issueId').isUUID().withMessage('IssueID格式无效'),
  body('title').optional().isString().notEmpty().withMessage('标题不能为空'),
  body('description').optional().isString(),
  body('status').optional().isIn(['OPEN', 'CLOSED']).withMessage('状态无效'),
  body('priority').optional().isIn(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).withMessage('优先级无效'),
  body('severity').optional().isIn(['BLOCKER', 'CRITICAL', 'MAJOR', 'MINOR', 'TRIVIAL', 'NORMAL']).withMessage('严重程度无效'),
  body('issueType').optional().isIn(['BUG', 'FEATURE', 'ENHANCEMENT', 'TASK', 'DOCUMENTATION', 'QUESTION']).withMessage('Issue类型无效'),
  body('assigneeId').optional().isString(),
  body('assigneeName').optional().isString(),
  body('dueDate').optional().isISO8601().withMessage('截止日期格式无效'),
  body('estimatedHours').optional().isFloat({ min: 0 }).withMessage('预估工时必须大于等于0'),
  body('actualHours').optional().isFloat({ min: 0 }).withMessage('实际工时必须大于等于0'),
  body('storyPoints').optional().isInt({ min: 0 }).withMessage('故事点数必须大于等于0'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId, issueId } = req.params
    const updateData = req.body

    // 验证 Issue 是否存在
    const existingIssue = await prisma.issue.findFirst({
      where: {
        id: issueId,
        projectId
      }
    })

    if (!existingIssue) {
      return next(new AppError('Issue不存在', 404))
    }

    // 处理状态变更
    if (updateData.status && updateData.status !== existingIssue.status) {
      if (updateData.status === 'CLOSED') {
        updateData.closedAt = new Date()
      } else if (updateData.status === 'OPEN') {
        updateData.closedAt = null
      }
    }

    // 处理日期字段
    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate)
    }

    const updatedIssue = await prisma.issue.update({
      where: { id: issueId },
      data: updateData,
      include: {
        labels: true,
        relatedAPIs: {
          include: {
            endpoint: { select: { id: true, name: true, method: true, path: true } }
          }
        },
        relatedTables: {
          include: {
            table: { select: { id: true, name: true, displayName: true } }
          }
        },
        relatedFeatures: true
      }
    })

    logger.info('更新Issue', {
      projectId,
      issueId,
      changes: Object.keys(updateData),
      statusChanged: updateData.status !== existingIssue.status
    })

    res.json({
      success: true,
      data: updatedIssue,
      message: 'Issue更新成功'
    })
  } catch (error) {
    next(new AppError('更新Issue失败: ' + error.message, 500))
  }
})

// 删除 Issue
router.delete('/:projectId/issues/:issueId', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  param('issueId').isUUID().withMessage('IssueID格式无效'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId, issueId } = req.params

    // 验证 Issue 是否存在
    const existingIssue = await prisma.issue.findFirst({
      where: {
        id: issueId,
        projectId
      }
    })

    if (!existingIssue) {
      return next(new AppError('Issue不存在', 404))
    }

    await prisma.issue.delete({
      where: { id: issueId }
    })

    logger.info('删除Issue', { projectId, issueId, title: existingIssue.title })

    res.json({
      success: true,
      message: 'Issue删除成功'
    })
  } catch (error) {
    next(new AppError('删除Issue失败: ' + error.message, 500))
  }
})

// 获取可关联的资源 - 用于 Issue 关联管理
router.get('/:projectId/issues/:issueId/relations/available', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  param('issueId').isString().withMessage('IssueID不能为空'),  // 允许 "temp" 用于创建模式
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId, issueId } = req.params

    // 验证项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return next(new AppError('项目不存在', 404))
    }

    // 并行获取所有可关联的资源
    const [apiEndpoints, tables, features] = await Promise.all([
      // 获取项目的 API Endpoints
      prisma.aPIEndpoint.findMany({
        where: { 
          projectId,
          status: { not: 'DEPRECATED' }
        },
        select: {
          id: true,
          name: true,
          displayName: true,
          method: true,
          path: true,
          description: true,
          status: true
        },
        orderBy: { name: 'asc' }
      }),

      // 获取项目的数据表
      prisma.databaseTable.findMany({
        where: { 
          projectId,
          status: { not: 'DELETED' }
        },
        select: {
          id: true,
          name: true,
          displayName: true,
          comment: true,
          status: true
        },
        orderBy: { name: 'asc' }
      }),

      // 获取项目的功能模块（从已存在的 Issue 中提取）
      prisma.issueFeatureRelation.findMany({
        where: {
          issue: { projectId }
        },
        select: {
          featureName: true,
          component: true
        },
        distinct: ['featureName', 'component']
      })
    ])

    // 处理 API Endpoint 数据
    const flattenedAPIs = apiEndpoints.map(endpoint => ({
      id: endpoint.id,
      name: endpoint.displayName || endpoint.name,
      method: endpoint.method,
      path: endpoint.path,
      description: endpoint.description,
      status: endpoint.status
    }))

    // 处理功能模块数据
    const uniqueFeatures = []
    const featureMap = new Map()

    for (const feature of features) {
      const key = `${feature.featureName}-${feature.component || ''}`
      if (!featureMap.has(key)) {
        featureMap.set(key, {
          id: key,
          name: feature.featureName,
          component: feature.component,
          description: feature.component ? `${feature.featureName} (${feature.component})` : feature.featureName
        })
      }
    }

    uniqueFeatures.push(...featureMap.values())

    // 如果不是创建模式（issueId !== 'temp'），需要过滤掉已关联的资源
    let excludeRelations = { apiEndpoints: [], tables: [], features: [] }
    
    if (issueId !== 'temp') {
      // 验证 Issue 是否存在
      const issue = await prisma.issue.findFirst({
        where: {
          id: issueId,
          projectId
        },
        include: {
          relatedAPIs: true,
          relatedTables: true,
          relatedFeatures: true
        }
      })

      if (issue) {
        excludeRelations = {
          apiEndpoints: issue.relatedAPIs.map(rel => rel.endpointId).filter(Boolean),
          tables: issue.relatedTables.map(rel => rel.tableId),
          features: issue.relatedFeatures.map(rel => `${rel.featureName}-${rel.component || ''}`)
        }
      }
    }

    // 过滤已关联的资源
    const availableAPIs = flattenedAPIs.filter(api => !excludeRelations.apis.includes(api.id))
    const availableTables = tables.filter(table => !excludeRelations.tables.includes(table.id))
    const availableFeatures = uniqueFeatures.filter(feature => !excludeRelations.features.includes(feature.id))

    logger.info('获取可关联资源', {
      projectId,
      issueId,
      counts: {
        apiEndpoints: availableAPIs.length,
        tables: availableTables.length,
        features: availableFeatures.length
      }
    })

    res.json({
      success: true,
      data: {
        apiEndpoints: availableAPIs,
        tables: availableTables,
        features: availableFeatures
      }
    })
  } catch (error) {
    next(new AppError('获取可关联资源失败: ' + error.message, 500))
  }
})

// 获取 Issue 的所有关联关系
router.get('/:projectId/issues/:issueId/relations', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  param('issueId').isUUID().withMessage('IssueID格式无效'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId, issueId } = req.params

    // 验证 Issue 是否存在
    const issue = await prisma.issue.findFirst({
      where: {
        id: issueId,
        projectId
      },
      include: {
        relatedAPIs: {
          include: {
            endpoint: { select: { id: true, name: true, method: true, path: true, status: true } }
          }
        },
        relatedTables: {
          include: {
            table: { select: { id: true, name: true, displayName: true, comment: true, status: true } }
          }
        },
        relatedFeatures: true
      }
    })

    if (!issue) {
      return next(new AppError('Issue不存在', 404))
    }

    logger.info('获取Issue关联关系', {
      projectId,
      issueId,
      counts: {
        apiEndpoints: issue.relatedAPIs.length,
        tables: issue.relatedTables.length,
        features: issue.relatedFeatures.length
      }
    })

    res.json({
      success: true,
      data: {
        apiEndpoints: issue.relatedAPIs,
        tables: issue.relatedTables,
        features: issue.relatedFeatures
      }
    })
  } catch (error) {
    next(new AppError('获取Issue关联关系失败: ' + error.message, 500))
  }
})

// 创建 Issue 与 API 的关联
router.post('/:projectId/issues/:issueId/relations/api', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  param('issueId').isUUID().withMessage('IssueID格式无效'),
  body('endpointId').optional().isUUID().withMessage('APIID格式无效'),
  body('endpointId').optional().isUUID().withMessage('EndpointID格式无效'),
  body('relationType').optional().isIn(['RELATES_TO', 'DEPENDS_ON', 'BLOCKS', 'IMPLEMENTS', 'TESTS']).withMessage('关联类型无效'),
  body('description').optional().isString(),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId, issueId } = req.params
    const { endpointId, relationType = 'RELATES_TO', description } = req.body

    if (!endpointId) {
      return next(new AppError('必须提供 endpointId', 400))
    }

    // 验证 Issue 是否存在
    const issue = await prisma.issue.findFirst({
      where: { id: issueId, projectId }
    })

    if (!issue) {
      return next(new AppError('Issue不存在', 404))
    }

    // 验证 API Endpoint 是否存在
    if (endpointId) {
      const endpoint = await prisma.aPIEndpoint.findFirst({
        where: { id: endpointId, projectId }
      })
      if (!endpoint) {
        return next(new AppError('API端点不存在', 404))
      }
    }

    const relation = await prisma.issueAPIRelation.create({
      data: {
        issueId,
        endpointId,
        endpointId,
        relationType,
        description
      },
      include: {
        endpoint: { select: { id: true, name: true, method: true, path: true } }
      }
    })

    logger.info('创建Issue-API关联', { projectId, issueId, endpointId, relationType })

    res.status(201).json({
      success: true,
      data: relation,
      message: 'API关联创建成功'
    })
  } catch (error) {
    if (error.code === 'P2002') {
      return next(new AppError('该关联已存在', 400))
    }
    next(new AppError('创建API关联失败: ' + error.message, 500))
  }
})

// 创建 Issue 与数据表的关联
router.post('/:projectId/issues/:issueId/relations/table', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  param('issueId').isUUID().withMessage('IssueID格式无效'),
  body('tableId').isUUID().withMessage('TableID格式无效'),
  body('relationType').optional().isIn(['RELATES_TO', 'DEPENDS_ON', 'BLOCKS', 'IMPLEMENTS', 'TESTS']).withMessage('关联类型无效'),
  body('description').optional().isString(),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId, issueId } = req.params
    const { tableId, relationType = 'RELATES_TO', description } = req.body

    // 验证 Issue 是否存在
    const issue = await prisma.issue.findFirst({
      where: { id: issueId, projectId }
    })

    if (!issue) {
      return next(new AppError('Issue不存在', 404))
    }

    // 验证数据表是否存在
    const table = await prisma.databaseTable.findFirst({
      where: { id: tableId, projectId }
    })

    if (!table) {
      return next(new AppError('数据表不存在', 404))
    }

    const relation = await prisma.issueTableRelation.create({
      data: {
        issueId,
        tableId,
        relationType,
        description
      },
      include: {
        table: { select: { id: true, name: true, displayName: true, comment: true } }
      }
    })

    logger.info('创建Issue-Table关联', { projectId, issueId, tableId, relationType })

    res.status(201).json({
      success: true,
      data: relation,
      message: '数据表关联创建成功'
    })
  } catch (error) {
    if (error.code === 'P2002') {
      return next(new AppError('该关联已存在', 400))
    }
    next(new AppError('创建数据表关联失败: ' + error.message, 500))
  }
})

// 创建 Issue 与功能模块的关联
router.post('/:projectId/issues/:issueId/relations/feature', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  param('issueId').isUUID().withMessage('IssueID格式无效'),
  body('featureId').isString().notEmpty().withMessage('FeatureID不能为空'),
  body('relationType').optional().isIn(['RELATES_TO', 'DEPENDS_ON', 'BLOCKS', 'IMPLEMENTS', 'TESTS']).withMessage('关联类型无效'),
  body('description').optional().isString(),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId, issueId } = req.params
    const { featureId, relationType = 'RELATES_TO', description } = req.body

    // 验证 Issue 是否存在
    const issue = await prisma.issue.findFirst({
      where: { id: issueId, projectId }
    })

    if (!issue) {
      return next(new AppError('Issue不存在', 404))
    }

    // 解析 featureId (格式: "featureName-component")
    const parts = featureId.split('-')
    const featureName = parts[0]
    const component = parts.slice(1).join('-') || null

    const relation = await prisma.issueFeatureRelation.create({
      data: {
        issueId,
        featureName,
        component,
        relationType,
        description
      }
    })

    logger.info('创建Issue-Feature关联', { projectId, issueId, featureName, component, relationType })

    res.status(201).json({
      success: true,
      data: relation,
      message: '功能模块关联创建成功'
    })
  } catch (error) {
    if (error.code === 'P2002') {
      return next(new AppError('该关联已存在', 400))
    }
    next(new AppError('创建功能模块关联失败: ' + error.message, 500))
  }
})

// 删除 Issue 与 API 的关联
router.delete('/:projectId/issues/:issueId/relations/api/:relationId', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  param('issueId').isUUID().withMessage('IssueID格式无效'),
  param('relationId').isUUID().withMessage('RelationID格式无效'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId, issueId, relationId } = req.params

    const relation = await prisma.issueAPIRelation.findFirst({
      where: {
        id: relationId,
        issueId,
        issue: { projectId }
      }
    })

    if (!relation) {
      return next(new AppError('关联关系不存在', 404))
    }

    await prisma.issueAPIRelation.delete({
      where: { id: relationId }
    })

    logger.info('删除Issue-API关联', { projectId, issueId, relationId })

    res.json({
      success: true,
      message: 'API关联删除成功'
    })
  } catch (error) {
    next(new AppError('删除API关联失败: ' + error.message, 500))
  }
})

// 删除 Issue 与数据表的关联
router.delete('/:projectId/issues/:issueId/relations/table/:relationId', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  param('issueId').isUUID().withMessage('IssueID格式无效'),
  param('relationId').isUUID().withMessage('RelationID格式无效'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId, issueId, relationId } = req.params

    const relation = await prisma.issueTableRelation.findFirst({
      where: {
        id: relationId,
        issueId,
        issue: { projectId }
      }
    })

    if (!relation) {
      return next(new AppError('关联关系不存在', 404))
    }

    await prisma.issueTableRelation.delete({
      where: { id: relationId }
    })

    logger.info('删除Issue-Table关联', { projectId, issueId, relationId })

    res.json({
      success: true,
      message: '数据表关联删除成功'
    })
  } catch (error) {
    next(new AppError('删除数据表关联失败: ' + error.message, 500))
  }
})

// 删除 Issue 与功能模块的关联
router.delete('/:projectId/issues/:issueId/relations/feature/:relationId', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  param('issueId').isUUID().withMessage('IssueID格式无效'),
  param('relationId').isUUID().withMessage('RelationID格式无效'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId, issueId, relationId } = req.params

    const relation = await prisma.issueFeatureRelation.findFirst({
      where: {
        id: relationId,
        issueId,
        issue: { projectId }
      }
    })

    if (!relation) {
      return next(new AppError('关联关系不存在', 404))
    }

    await prisma.issueFeatureRelation.delete({
      where: { id: relationId }
    })

    logger.info('删除Issue-Feature关联', { projectId, issueId, relationId })

    res.json({
      success: true,
      message: '功能模块关联删除成功'
    })
  } catch (error) {
    next(new AppError('删除功能模块关联失败: ' + error.message, 500))
  }
})

export default router