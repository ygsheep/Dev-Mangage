import { Router } from 'express'
import { body, param, query } from 'express-validator'
import { validateRequest } from '../middleware/validateRequest'
import { prisma } from '../database'
import { AppError } from '../middleware/errorHandler'
import logger from '../utils/logger'

const router = Router()

/**
 * @route   GET /api/v1/model-versions
 * @desc    获取模型版本列表
 * @access  Public
 */
router.get('/', [
  query('projectId').optional().isUUID().withMessage('projectId必须是有效的UUID'),
  query('branchName').optional().isString().withMessage('branchName必须是字符串'),
  query('isActive').optional().isBoolean().withMessage('isActive必须是布尔值'),
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页条数必须在1-100之间')
], validateRequest, async (req, res, next) => {
  try {
    const { 
      projectId, 
      branchName, 
      isActive, 
      page = 1, 
      limit = 20 
    } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    // 构建查询条件
    const where: any = {}
    if (projectId) where.projectId = projectId as string
    if (branchName) where.branchName = branchName as string
    if (isActive !== undefined) where.isActive = isActive === 'true'

    // 查询版本
    const [versions, total] = await Promise.all([
      prisma.modelVersion.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true
            }
          },
          parentVersion: {
            select: {
              id: true,
              versionNumber: true,
              createdAt: true
            }
          },
          childVersions: {
            select: {
              id: true,
              versionNumber: true,
              createdAt: true
            }
          }
        },
        orderBy: [
          { projectId: 'asc' },
          { branchName: 'asc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: Number(limit)
      }),
      prisma.modelVersion.count({ where })
    ])

    logger.info('查询模型版本成功', {
      total,
      page: Number(page),
      limit: Number(limit),
      filters: { projectId, branchName, isActive }
    })

    res.json({
      success: true,
      data: versions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   GET /api/v1/model-versions/:id
 * @desc    获取单个版本详情
 * @access  Public
 */
router.get('/:id', [
  param('id').isUUID().withMessage('ID必须是有效的UUID')
], validateRequest, async (req, res, next) => {
  try {
    const { id } = req.params

    const version = await prisma.modelVersion.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        parentVersion: {
          select: {
            id: true,
            versionNumber: true,
            changeDescription: true,
            createdAt: true
          }
        },
        childVersions: {
          select: {
            id: true,
            versionNumber: true,
            changeDescription: true,
            createdAt: true
          }
        }
      }
    })

    if (!version) {
      throw new AppError('版本不存在', 404)
    }

    // 解析schema快照
    let schemaSnapshot = null
    try {
      schemaSnapshot = JSON.parse(version.schemaSnapshot)
    } catch (error) {
      logger.warn('解析schema快照失败', { versionId: id, error: error.message })
    }

    const responseData = {
      ...version,
      schemaSnapshot
    }

    logger.info('获取版本详情成功', { versionId: id })

    res.json({
      success: true,
      data: responseData
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   POST /api/v1/model-versions
 * @desc    创建新版本
 * @access  Public
 */
router.post('/', [
  body('projectId').isUUID().withMessage('projectId必须是有效的UUID'),
  body('versionNumber').isString().isLength({ min: 1, max: 20 }).withMessage('versionNumber必须是1-20字符的字符串'),
  body('changeDescription').optional().isString().withMessage('changeDescription必须是字符串'),
  body('changeType').optional().isIn(['MANUAL', 'AUTO_IMPORT', 'AI_GENERATED', 'MIGRATION']).withMessage('changeType必须是有效的变更类型'),
  body('createdBy').optional().isString().withMessage('createdBy必须是字符串'),
  body('parentVersionId').optional().isUUID().withMessage('parentVersionId必须是有效的UUID'),
  body('branchName').optional().isString().isLength({ max: 50 }).withMessage('branchName不能超过50字符'),
  body('tags').optional().isArray().withMessage('tags必须是数组'),
  body('makeActive').optional().isBoolean().withMessage('makeActive必须是布尔值')
], validateRequest, async (req, res, next) => {
  try {
    const {
      projectId,
      versionNumber,
      changeDescription,
      changeType = 'MANUAL',
      createdBy,
      parentVersionId,
      branchName = 'main',
      tags = [],
      makeActive = false
    } = req.body

    // 检查项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      throw new AppError('项目不存在', 404)
    }

    // 检查版本号是否已存在
    const existingVersion = await prisma.modelVersion.findUnique({
      where: {
        projectId_versionNumber: {
          projectId,
          versionNumber
        }
      }
    })

    if (existingVersion) {
      throw new AppError('版本号已存在', 400)
    }

    // 检查父版本是否存在
    if (parentVersionId) {
      const parentVersion = await prisma.modelVersion.findUnique({
        where: { id: parentVersionId }
      })

      if (!parentVersion || parentVersion.projectId !== projectId) {
        throw new AppError('父版本不存在或不属于该项目', 400)
      }
    }

    // 获取当前项目的完整数据模型快照
    const [tables, relationships] = await Promise.all([
      prisma.databaseTable.findMany({
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
          }
        }
      }),
      prisma.tableRelationship.findMany({
        where: {
          fromTable: { projectId }
        }
      })
    ])

    // 构建schema快照
    const schemaSnapshot = {
      version: versionNumber,
      timestamp: new Date().toISOString(),
      tables,
      relationships,
      metadata: {
        tablesCount: tables.length,
        relationshipsCount: relationships.length,
        fieldsCount: tables.reduce((sum, table) => sum + table.fields.length, 0)
      }
    }

    // 如果要设为活跃版本，先取消其他活跃版本
    if (makeActive) {
      await prisma.modelVersion.updateMany({
        where: {
          projectId,
          isActive: true
        },
        data: {
          isActive: false
        }
      })
    }

    // 创建版本
    const version = await prisma.modelVersion.create({
      data: {
        projectId,
        versionNumber,
        changeDescription,
        changeType,
        createdBy,
        parentVersionId,
        branchName,
        tags: JSON.stringify(tags),
        schemaSnapshot: JSON.stringify(schemaSnapshot),
        isActive: makeActive
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        parentVersion: {
          select: {
            id: true,
            versionNumber: true
          }
        }
      }
    })

    logger.info('创建模型版本成功', {
      versionId: version.id,
      projectId,
      versionNumber,
      changeType,
      isActive: makeActive
    })

    res.status(201).json({
      success: true,
      data: version,
      message: '版本创建成功'
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   PUT /api/v1/model-versions/:id
 * @desc    更新版本信息
 * @access  Public
 */
router.put('/:id', [
  param('id').isUUID().withMessage('ID必须是有效的UUID'),
  body('changeDescription').optional().isString().withMessage('changeDescription必须是字符串'),
  body('tags').optional().isArray().withMessage('tags必须是数组'),
  body('isActive').optional().isBoolean().withMessage('isActive必须是布尔值')
], validateRequest, async (req, res, next) => {
  try {
    const { id } = req.params
    const updateData = req.body

    // 检查版本是否存在
    const existingVersion = await prisma.modelVersion.findUnique({
      where: { id }
    })

    if (!existingVersion) {
      throw new AppError('版本不存在', 404)
    }

    // 处理tags序列化
    if (updateData.tags) {
      updateData.tags = JSON.stringify(updateData.tags)
    }

    // 如果要设为活跃版本，先取消其他活跃版本
    if (updateData.isActive) {
      await prisma.modelVersion.updateMany({
        where: {
          projectId: existingVersion.projectId,
          isActive: true,
          id: { not: id }
        },
        data: {
          isActive: false
        }
      })
    }

    // 更新版本
    const updatedVersion = await prisma.modelVersion.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        parentVersion: {
          select: {
            id: true,
            versionNumber: true
          }
        }
      }
    })

    logger.info('更新模型版本成功', {
      versionId: id,
      updates: Object.keys(updateData),
      projectId: existingVersion.projectId
    })

    res.json({
      success: true,
      data: updatedVersion,
      message: '版本更新成功'
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   DELETE /api/v1/model-versions/:id
 * @desc    删除版本
 * @access  Public
 */
router.delete('/:id', [
  param('id').isUUID().withMessage('ID必须是有效的UUID')
], validateRequest, async (req, res, next) => {
  try {
    const { id } = req.params

    // 检查版本是否存在
    const version = await prisma.modelVersion.findUnique({
      where: { id },
      include: {
        childVersions: true
      }
    })

    if (!version) {
      throw new AppError('版本不存在', 404)
    }

    // 检查是否有子版本依赖
    if (version.childVersions.length > 0) {
      throw new AppError('该版本有子版本依赖，无法删除', 400)
    }

    // 检查是否为活跃版本
    if (version.isActive) {
      throw new AppError('活跃版本无法删除，请先切换到其他版本', 400)
    }

    // 删除版本
    await prisma.modelVersion.delete({
      where: { id }
    })

    logger.info('删除模型版本成功', {
      versionId: id,
      versionNumber: version.versionNumber,
      projectId: version.projectId
    })

    res.json({
      success: true,
      message: '版本删除成功'
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   POST /api/v1/model-versions/:id/activate
 * @desc    激活指定版本
 * @access  Public
 */
router.post('/:id/activate', [
  param('id').isUUID().withMessage('ID必须是有效的UUID')
], validateRequest, async (req, res, next) => {
  try {
    const { id } = req.params

    // 检查版本是否存在
    const version = await prisma.modelVersion.findUnique({
      where: { id }
    })

    if (!version) {
      throw new AppError('版本不存在', 404)
    }

    if (version.isActive) {
      return res.json({
        success: true,
        message: '该版本已是活跃版本'
      })
    }

    // 使用事务确保操作的原子性
    await prisma.$transaction(async (tx) => {
      // 取消该项目所有版本的活跃状态
      await tx.modelVersion.updateMany({
        where: {
          projectId: version.projectId,
          isActive: true
        },
        data: {
          isActive: false
        }
      })

      // 激活指定版本
      await tx.modelVersion.update({
        where: { id },
        data: {
          isActive: true
        }
      })
    })

    logger.info('激活模型版本成功', {
      versionId: id,
      versionNumber: version.versionNumber,
      projectId: version.projectId
    })

    res.json({
      success: true,
      message: '版本激活成功'
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   GET /api/v1/model-versions/:id/compare/:compareId
 * @desc    比较两个版本的差异
 * @access  Public
 */
router.get('/:id/compare/:compareId', [
  param('id').isUUID().withMessage('ID必须是有效的UUID'),
  param('compareId').isUUID().withMessage('compareId必须是有效的UUID')
], validateRequest, async (req, res, next) => {
  try {
    const { id, compareId } = req.params

    // 检查版本是否存在
    const [version1, version2] = await Promise.all([
      prisma.modelVersion.findUnique({ where: { id } }),
      prisma.modelVersion.findUnique({ where: { id: compareId } })
    ])

    if (!version1) {
      throw new AppError('源版本不存在', 404)
    }
    if (!version2) {
      throw new AppError('目标版本不存在', 404)
    }

    // 检查是否属于同一项目
    if (version1.projectId !== version2.projectId) {
      throw new AppError('只能比较同一项目的版本', 400)
    }

    // 解析schema快照
    let schema1, schema2
    try {
      schema1 = JSON.parse(version1.schemaSnapshot)
      schema2 = JSON.parse(version2.schemaSnapshot)
    } catch (error) {
      throw new AppError('解析版本快照失败', 500)
    }

    // 计算差异
    const comparison = {
      source: {
        id: version1.id,
        versionNumber: version1.versionNumber,
        createdAt: version1.createdAt
      },
      target: {
        id: version2.id,
        versionNumber: version2.versionNumber,
        createdAt: version2.createdAt
      },
      differences: {
        tables: {
          added: [] as any[],
          removed: [] as any[],
          modified: [] as any[]
        },
        relationships: {
          added: [] as any[],
          removed: [] as any[],
          modified: [] as any[]
        },
        summary: {
          totalChanges: 0,
          tablesChanged: 0,
          relationshipsChanged: 0
        }
      }
    }

    // 比较表结构
    const tables1Map = new Map(schema1.tables.map((t: any) => [t.id, t]))
    const tables2Map = new Map(schema2.tables.map((t: any) => [t.id, t]))

    // 找出新增的表
    for (const [tableId, table] of tables2Map) {
      if (!tables1Map.has(tableId)) {
        comparison.differences.tables.added.push({
          id: table.id,
          name: table.name,
          displayName: table.displayName
        })
      }
    }

    // 找出删除的表
    for (const [tableId, table] of tables1Map) {
      if (!tables2Map.has(tableId)) {
        comparison.differences.tables.removed.push({
          id: table.id,
          name: table.name,
          displayName: table.displayName
        })
      }
    }

    // 找出修改的表
    for (const [tableId, table1] of tables1Map) {
      const table2 = tables2Map.get(tableId)
      if (table2) {
        // 简单的差异检测（可以根据需要扩展）
        if (table1.name !== table2.name || 
            table1.displayName !== table2.displayName ||
            table1.fields.length !== table2.fields.length) {
          comparison.differences.tables.modified.push({
            id: tableId,
            name: table2.name,
            changes: {
              nameChanged: table1.name !== table2.name,
              displayNameChanged: table1.displayName !== table2.displayName,
              fieldsCountChanged: table1.fields.length !== table2.fields.length
            }
          })
        }
      }
    }

    // 比较关系（类似的逻辑）
    const rels1Map = new Map(schema1.relationships.map((r: any) => [r.id, r]))
    const rels2Map = new Map(schema2.relationships.map((r: any) => [r.id, r]))

    for (const [relId, rel] of rels2Map) {
      if (!rels1Map.has(relId)) {
        comparison.differences.relationships.added.push(rel)
      }
    }

    for (const [relId, rel] of rels1Map) {
      if (!rels2Map.has(relId)) {
        comparison.differences.relationships.removed.push(rel)
      }
    }

    // 计算总计
    comparison.differences.summary.tablesChanged = 
      comparison.differences.tables.added.length +
      comparison.differences.tables.removed.length +
      comparison.differences.tables.modified.length

    comparison.differences.summary.relationshipsChanged = 
      comparison.differences.relationships.added.length +
      comparison.differences.relationships.removed.length +
      comparison.differences.relationships.modified.length

    comparison.differences.summary.totalChanges = 
      comparison.differences.summary.tablesChanged +
      comparison.differences.summary.relationshipsChanged

    logger.info('版本比较成功', {
      version1: version1.versionNumber,
      version2: version2.versionNumber,
      totalChanges: comparison.differences.summary.totalChanges
    })

    res.json({
      success: true,
      data: comparison
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   GET /api/v1/model-versions/project/:projectId/tree
 * @desc    获取项目的版本树
 * @access  Public
 */
router.get('/project/:projectId/tree', [
  param('projectId').isUUID().withMessage('projectId必须是有效的UUID')
], validateRequest, async (req, res, next) => {
  try {
    const { projectId } = req.params

    // 检查项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      throw new AppError('项目不存在', 404)
    }

    // 获取项目的所有版本
    const versions = await prisma.modelVersion.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' }
    })

    // 构建版本树
    const versionMap = new Map()
    const rootVersions = []

    // 首先创建所有版本节点
    versions.forEach(version => {
      versionMap.set(version.id, {
        ...version,
        children: []
      })
    })

    // 然后建立父子关系
    versions.forEach(version => {
      const versionNode = versionMap.get(version.id)
      if (version.parentVersionId) {
        const parentNode = versionMap.get(version.parentVersionId)
        if (parentNode) {
          parentNode.children.push(versionNode)
        } else {
          // 父版本不存在，作为根版本
          rootVersions.push(versionNode)
        }
      } else {
        // 没有父版本，是根版本
        rootVersions.push(versionNode)
      }
    })

    const tree = {
      projectId,
      projectName: project.name,
      branches: {} as any,
      totalVersions: versions.length,
      activeVersion: versions.find(v => v.isActive)
    }

    // 按分支组织版本树
    versions.forEach(version => {
      if (!tree.branches[version.branchName]) {
        tree.branches[version.branchName] = []
      }
      
      const versionNode = versionMap.get(version.id)
      if (!version.parentVersionId) {
        tree.branches[version.branchName].push(versionNode)
      }
    })

    logger.info('获取版本树成功', {
      projectId,
      versionsCount: versions.length,
      branchesCount: Object.keys(tree.branches).length
    })

    res.json({
      success: true,
      data: tree
    })
  } catch (error) {
    next(error)
  }
})

export default router