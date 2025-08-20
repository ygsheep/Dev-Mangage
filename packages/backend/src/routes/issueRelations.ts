import express from 'express'
import { body, param, query } from 'express-validator'
import { validateRequest } from '../middleware/validation'
import { AppError } from '../middleware/errorHandler'
import { prisma } from '../lib/prisma'
import logger from '../utils/logger'

const router = express.Router()

/**
 * Issue 关联管理路由
 * 处理 Issue 与 API、数据表、功能模块的关联关系
 */

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
      }
    })

    if (!issue) {
      return next(new AppError('Issue不存在', 404))
    }

    // 获取所有关联关系
    const [apiRelations, tableRelations, featureRelations] = await Promise.all([
      // API 关联
      prisma.issueAPIRelation.findMany({
        where: { issueId },
        include: {
          endpoint: {
            select: {
              id: true,
              name: true,
              displayName: true,
              method: true,
              path: true,
              status: true,
              description: true
            }
          }
        }
      }),

      // 数据表关联
      prisma.issueTableRelation.findMany({
        where: { issueId },
        include: {
          table: {
            select: {
              id: true,
              name: true,
              displayName: true,
              comment: true,
              status: true,
              category: true
            }
          }
        }
      }),

      // 功能模块关联
      prisma.issueFeatureRelation.findMany({
        where: { issueId }
      })
    ])

    const relations = {
      apiEndpoints: apiRelations,
      tables: tableRelations,
      features: featureRelations,
      summary: {
        totalRelations: apiRelations.length + tableRelations.length + featureRelations.length,
        apiCount: apiRelations.length,
        tableCount: tableRelations.length,
        featureCount: featureRelations.length
      }
    }

    logger.info('获取Issue关联关系', {
      projectId,
      issueId,
      summary: relations.summary
    })

    res.json({
      success: true,
      data: relations
    })
  } catch (error) {
    next(new AppError('获取Issue关联关系失败: ' + error.message, 500))
  }
})

// 添加 Issue 与 API 的关联
router.post('/:projectId/issues/:issueId/relations/apis', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  param('issueId').isUUID().withMessage('IssueID格式无效'),
  body('endpointId').optional().isUUID().withMessage('API ID格式无效'),
  body('endpointId').optional().isUUID().withMessage('端点ID格式无效'),
  body('relationType').isIn(['RELATES_TO', 'BLOCKS', 'BLOCKED_BY', 'IMPLEMENTS', 'FIXES']).withMessage('关联类型无效'),
  body('description').optional().isString(),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId, issueId } = req.params
    const { endpointId, relationType, description } = req.body

    // 验证必须提供 endpointId
    if (!endpointId) {
      return next(new AppError('必须提供 endpointId', 400))
    }

    // 验证 Issue 是否存在
    const issue = await prisma.issue.findFirst({
      where: {
        id: issueId,
        projectId
      }
    })

    if (!issue) {
      return next(new AppError('Issue不存在', 404))
    }

    // 验证 API 或端点是否存在
    if (endpointId) {
      const api = await prisma.aPIEndpoint.findFirst({
        where: {
          id: endpointId,
          projectId
        }
      })

      if (!api) {
        return next(new AppError('API端点不存在', 404))
      }
    }

    if (endpointId) {
      const endpoint = await prisma.aPIEndpoint.findFirst({
        where: {
          id: endpointId,
          projectId
        }
      })

      if (!endpoint) {
        return next(new AppError('API端点不存在', 404))
      }
    }

    // 检查关联是否已存在
    const existingRelation = await prisma.issueAPIRelation.findFirst({
      where: {
        issueId,
        ...(endpointId && { endpointId })
      }
    })

    if (existingRelation) {
      return next(new AppError('该关联关系已存在', 409))
    }

    // 创建关联
    const relation = await prisma.issueAPIRelation.create({
      data: {
        issueId,
        endpointId,
        endpointId,
        relationType,
        description
      },
      include: {
        api: endpointId ? {
          select: {
            id: true,
            name: true,
            method: true,
            path: true,
            status: true
          }
        } : undefined,
        endpoint: endpointId ? {
          select: {
            id: true,
            name: true,
            displayName: true,
            method: true,
            path: true,
            status: true
          }
        } : undefined
      }
    })

    logger.info('创建Issue-API关联', {
      projectId,
      issueId,
      endpointId,
      endpointId,
      relationType
    })

    res.status(201).json({
      success: true,
      data: relation,
      message: 'Issue与API关联创建成功'
    })
  } catch (error) {
    next(new AppError('创建Issue-API关联失败: ' + error.message, 500))
  }
})

// 添加 Issue 与数据表的关联
router.post('/:projectId/issues/:issueId/relations/tables', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  param('issueId').isUUID().withMessage('IssueID格式无效'),
  body('tableId').isUUID().withMessage('表ID格式无效'),
  body('relationType').isIn(['RELATES_TO', 'AFFECTS', 'MODIFIES', 'CREATES', 'DROPS']).withMessage('关联类型无效'),
  body('description').optional().isString(),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId, issueId } = req.params
    const { tableId, relationType, description } = req.body

    // 验证 Issue 是否存在
    const issue = await prisma.issue.findFirst({
      where: {
        id: issueId,
        projectId
      }
    })

    if (!issue) {
      return next(new AppError('Issue不存在', 404))
    }

    // 验证数据表是否存在
    const table = await prisma.databaseTable.findFirst({
      where: {
        id: tableId,
        projectId
      }
    })

    if (!table) {
      return next(new AppError('数据表不存在', 404))
    }

    // 检查关联是否已存在
    const existingRelation = await prisma.issueTableRelation.findFirst({
      where: {
        issueId,
        tableId
      }
    })

    if (existingRelation) {
      return next(new AppError('该关联关系已存在', 409))
    }

    // 创建关联
    const relation = await prisma.issueTableRelation.create({
      data: {
        issueId,
        tableId,
        relationType,
        description
      },
      include: {
        table: {
          select: {
            id: true,
            name: true,
            displayName: true,
            comment: true,
            status: true,
            category: true
          }
        }
      }
    })

    logger.info('创建Issue-Table关联', {
      projectId,
      issueId,
      tableId,
      relationType
    })

    res.status(201).json({
      success: true,
      data: relation,
      message: 'Issue与数据表关联创建成功'
    })
  } catch (error) {
    next(new AppError('创建Issue-Table关联失败: ' + error.message, 500))
  }
})

// 添加 Issue 与功能模块的关联
router.post('/:projectId/issues/:issueId/relations/features', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  param('issueId').isUUID().withMessage('IssueID格式无效'),
  body('featureName').isString().notEmpty().withMessage('功能名称不能为空'),
  body('component').optional().isString(),
  body('relationType').isIn(['RELATES_TO', 'IMPLEMENTS', 'ENHANCES', 'REFACTORS']).withMessage('关联类型无效'),
  body('description').optional().isString(),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId, issueId } = req.params
    const { featureName, component, relationType, description } = req.body

    // 验证 Issue 是否存在
    const issue = await prisma.issue.findFirst({
      where: {
        id: issueId,
        projectId
      }
    })

    if (!issue) {
      return next(new AppError('Issue不存在', 404))
    }

    // 检查关联是否已存在
    const existingRelation = await prisma.issueFeatureRelation.findFirst({
      where: {
        issueId,
        featureName,
        component: component || null
      }
    })

    if (existingRelation) {
      return next(new AppError('该关联关系已存在', 409))
    }

    // 创建关联
    const relation = await prisma.issueFeatureRelation.create({
      data: {
        issueId,
        featureName,
        component,
        relationType,
        description
      }
    })

    logger.info('创建Issue-Feature关联', {
      projectId,
      issueId,
      featureName,
      component,
      relationType
    })

    res.status(201).json({
      success: true,
      data: relation,
      message: 'Issue与功能模块关联创建成功'
    })
  } catch (error) {
    next(new AppError('创建Issue-Feature关联失败: ' + error.message, 500))
  }
})

// 删除 Issue 与 API 的关联
router.delete('/:projectId/issues/:issueId/relations/apis/:relationId', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  param('issueId').isUUID().withMessage('IssueID格式无效'),
  param('relationId').isUUID().withMessage('关联ID格式无效'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId, issueId, relationId } = req.params

    // 验证关联是否存在
    const relation = await prisma.issueAPIRelation.findFirst({
      where: {
        id: relationId,
        issueId,
        issue: {
          projectId
        }
      }
    })

    if (!relation) {
      return next(new AppError('关联关系不存在', 404))
    }

    await prisma.issueAPIRelation.delete({
      where: { id: relationId }
    })

    logger.info('删除Issue-API关联', {
      projectId,
      issueId,
      relationId
    })

    res.json({
      success: true,
      message: 'Issue与API关联删除成功'
    })
  } catch (error) {
    next(new AppError('删除Issue-API关联失败: ' + error.message, 500))
  }
})

// 删除 Issue 与数据表的关联
router.delete('/:projectId/issues/:issueId/relations/tables/:relationId', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  param('issueId').isUUID().withMessage('IssueID格式无效'),
  param('relationId').isUUID().withMessage('关联ID格式无效'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId, issueId, relationId } = req.params

    // 验证关联是否存在
    const relation = await prisma.issueTableRelation.findFirst({
      where: {
        id: relationId,
        issueId,
        issue: {
          projectId
        }
      }
    })

    if (!relation) {
      return next(new AppError('关联关系不存在', 404))
    }

    await prisma.issueTableRelation.delete({
      where: { id: relationId }
    })

    logger.info('删除Issue-Table关联', {
      projectId,
      issueId,
      relationId
    })

    res.json({
      success: true,
      message: 'Issue与数据表关联删除成功'
    })
  } catch (error) {
    next(new AppError('删除Issue-Table关联失败: ' + error.message, 500))
  }
})

// 删除 Issue 与功能模块的关联
router.delete('/:projectId/issues/:issueId/relations/features/:relationId', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  param('issueId').isUUID().withMessage('IssueID格式无效'),
  param('relationId').isUUID().withMessage('关联ID格式无效'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId, issueId, relationId } = req.params

    // 验证关联是否存在
    const relation = await prisma.issueFeatureRelation.findFirst({
      where: {
        id: relationId,
        issueId,
        issue: {
          projectId
        }
      }
    })

    if (!relation) {
      return next(new AppError('关联关系不存在', 404))
    }

    await prisma.issueFeatureRelation.delete({
      where: { id: relationId }
    })

    logger.info('删除Issue-Feature关联', {
      projectId,
      issueId,
      relationId
    })

    res.json({
      success: true,
      message: 'Issue与功能模块关联删除成功'
    })
  } catch (error) {
    next(new AppError('删除Issue-Feature关联失败: ' + error.message, 500))
  }
})

// 批量创建关联
router.post('/:projectId/issues/:issueId/relations/batch', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  param('issueId').isUUID().withMessage('IssueID格式无效'),
  body('relations').isArray().withMessage('关联列表必须是数组'),
  body('relations.*.type').isIn(['api', 'table', 'feature']).withMessage('关联类型无效'),
  body('relations.*.relationType').isString().notEmpty().withMessage('关联关系类型不能为空'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId, issueId } = req.params
    const { relations } = req.body

    // 验证 Issue 是否存在
    const issue = await prisma.issue.findFirst({
      where: {
        id: issueId,
        projectId
      }
    })

    if (!issue) {
      return next(new AppError('Issue不存在', 404))
    }

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[]
    }

    // 在事务中批量创建关联
    await prisma.$transaction(async (tx) => {
      for (const relation of relations) {
        try {
          if (relation.type === 'api') {
            // 检查是否已存在
            const existing = await tx.issueAPIRelation.findFirst({
              where: {
                issueId,
                ...(relation.endpointId && { endpointId: relation.endpointId })
              }
            })

            if (!existing) {
              await tx.issueAPIRelation.create({
                data: {
                  issueId,
                  endpointId: relation.endpointId,
                  relationType: relation.relationType,
                  description: relation.description
                }
              })
              results.created++
            } else {
              results.skipped++
            }
          } else if (relation.type === 'table') {
            const existing = await tx.issueTableRelation.findFirst({
              where: {
                issueId,
                tableId: relation.tableId
              }
            })

            if (!existing) {
              await tx.issueTableRelation.create({
                data: {
                  issueId,
                  tableId: relation.tableId,
                  relationType: relation.relationType,
                  description: relation.description
                }
              })
              results.created++
            } else {
              results.skipped++
            }
          } else if (relation.type === 'feature') {
            const existing = await tx.issueFeatureRelation.findFirst({
              where: {
                issueId,
                featureName: relation.featureName,
                component: relation.component || null
              }
            })

            if (!existing) {
              await tx.issueFeatureRelation.create({
                data: {
                  issueId,
                  featureName: relation.featureName,
                  component: relation.component,
                  relationType: relation.relationType,
                  description: relation.description
                }
              })
              results.created++
            } else {
              results.skipped++
            }
          }
        } catch (error: any) {
          results.errors.push(`创建关联失败: ${error.message}`)
        }
      }
    })

    logger.info('批量创建Issue关联', {
      projectId,
      issueId,
      totalRelations: relations.length,
      results
    })

    res.json({
      success: true,
      data: results,
      message: `批量创建关联完成，成功创建 ${results.created} 个关联`
    })
  } catch (error) {
    next(new AppError('批量创建Issue关联失败: ' + error.message, 500))
  }
})

// 获取可关联的资源列表
router.get('/:projectId/issues/:issueId/relations/available', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  param('issueId').isUUID().withMessage('IssueID格式无效'),
  query('type').optional().isIn(['api', 'table', 'feature']).withMessage('资源类型无效'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId, issueId } = req.params
    const { type } = req.query

    // 验证 Issue 是否存在
    const issue = await prisma.issue.findFirst({
      where: {
        id: issueId,
        projectId
      }
    })

    if (!issue) {
      return next(new AppError('Issue不存在', 404))
    }

    const available: any = {}

    if (!type || type === 'api') {
      // 获取未关联的 API
      const [apiEndpoints, endpoints] = await Promise.all([
        prisma.aPIEndpoint.findMany({
          where: {
            projectId,
            relatedIssues: {
              none: { issueId }
            }
          },
          select: {
            id: true,
            name: true,
            method: true,
            path: true,
            status: true,
            description: true
          }
        }),
        prisma.aPIEndpoint.findMany({
          where: {
            projectId,
            relatedIssues: {
              none: { issueId }
            }
          },
          select: {
            id: true,
            name: true,
            displayName: true,
            method: true,
            path: true,
            status: true,
            description: true
          }
        })
      ])

      available.apis = apis
      available.endpoints = endpoints
    }

    if (!type || type === 'table') {
      // 获取未关联的数据表
      const tables = await prisma.databaseTable.findMany({
        where: {
          projectId,
          relatedIssues: {
            none: { issueId }
          }
        },
        select: {
          id: true,
          name: true,
          displayName: true,
          comment: true,
          status: true,
          category: true
        }
      })

      available.tables = tables
    }

    if (!type || type === 'feature') {
      // 获取已存在的功能模块（从现有关联中提取）
      const existingFeatures = await prisma.issueFeatureRelation.findMany({
        where: {
          issue: { projectId }
        },
        select: {
          featureName: true,
          component: true
        },
        distinct: ['featureName', 'component']
      })

      available.features = existingFeatures
    }

    logger.info('获取可关联资源', {
      projectId,
      issueId,
      type,
      counts: {
        apiEndpoints: available.apis?.length || 0,
        endpoints: available.endpoints?.length || 0,
        tables: available.tables?.length || 0,
        features: available.features?.length || 0
      }
    })

    res.json({
      success: true,
      data: available
    })
  } catch (error) {
    next(new AppError('获取可关联资源失败: ' + error.message, 500))
  }
})

export default router