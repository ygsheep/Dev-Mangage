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
              api: { select: { id: true, name: true, method: true, path: true } },
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
            api: { select: { id: true, name: true, method: true, path: true, status: true } },
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
            apiId: relation.apiId,
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
        apis: relatedAPIs.length,
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
            api: { select: { id: true, name: true, method: true, path: true } },
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

// 获取 Issue 统计信息
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

export default router