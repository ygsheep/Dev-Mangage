import { Router } from 'express'
import { body, param, query } from 'express-validator'
import { validateRequest } from '../middleware/validateRequest'
import { prisma } from '../database'
import { AppError } from '../middleware/errorHandler'
import logger from '../utils/logger'

const router = Router()

/**
 * @route   GET /api/v1/table-relationships
 * @desc    获取表关系列表
 * @access  Public
 */
router.get('/', [
  query('projectId').optional().isUUID().withMessage('projectId必须是有效的UUID'),
  query('fromTableId').optional().isUUID().withMessage('fromTableId必须是有效的UUID'),
  query('toTableId').optional().isUUID().withMessage('toTableId必须是有效的UUID'),
  query('relationshipType').optional().isIn(['ONE_TO_ONE', 'ONE_TO_MANY', 'MANY_TO_ONE', 'MANY_TO_MANY']).withMessage('relationshipType必须是有效的关系类型'),
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页条数必须在1-100之间')
], validateRequest, async (req, res, next) => {
  try {
    const { 
      projectId, 
      fromTableId, 
      toTableId, 
      relationshipType, 
      page = 1, 
      limit = 20 
    } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    // 构建查询条件
    const where: any = {}
    if (relationshipType) where.relationshipType = relationshipType as string

    // 处理表级别的筛选
    if (fromTableId) where.fromTableId = fromTableId as string
    if (toTableId) where.toTableId = toTableId as string
    
    // 处理项目级别的筛选
    if (projectId) {
      where.fromTable = {
        projectId: projectId as string
      }
    }

    // 查询关系
    const [relationships, total] = await Promise.all([
      prisma.tableRelationship.findMany({
        where,
        include: {
          fromTable: {
            select: {
              id: true,
              name: true,
              displayName: true,
              projectId: true
            }
          },
          toTable: {
            select: {
              id: true,
              name: true,
              displayName: true,
              projectId: true
            }
          }
        },
        orderBy: [
          { fromTable: { name: 'asc' } },
          { toTable: { name: 'asc' } },
          { createdAt: 'desc' }
        ],
        skip,
        take: Number(limit)
      }),
      prisma.tableRelationship.count({ where })
    ])

    logger.info('查询表关系成功', {
      total,
      page: Number(page),
      limit: Number(limit),
      filters: { projectId, fromTableId, toTableId, relationshipType }
    })

    res.json({
      success: true,
      data: relationships,
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
 * @route   GET /api/v1/table-relationships/:id
 * @desc    获取单个表关系详情
 * @access  Public
 */
router.get('/:id', [
  param('id').isUUID().withMessage('ID必须是有效的UUID')
], validateRequest, async (req, res, next) => {
  try {
    const { id } = req.params

    const relationship = await prisma.tableRelationship.findUnique({
      where: { id },
      include: {
        fromTable: {
          include: {
            fields: {
              select: {
                id: true,
                name: true,
                type: true,
                isPrimaryKey: true,
                nullable: true
              }
            }
          }
        },
        toTable: {
          include: {
            fields: {
              select: {
                id: true,
                name: true,
                type: true,
                isPrimaryKey: true,
                nullable: true
              }
            }
          }
        }
      }
    })

    if (!relationship) {
      throw new AppError('表关系不存在', 404)
    }

    logger.info('获取表关系详情成功', { relationshipId: id })

    res.json({
      success: true,
      data: relationship
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   POST /api/v1/table-relationships
 * @desc    创建新的表关系
 * @access  Public
 */
router.post('/', [
  body('fromTableId').isUUID().withMessage('fromTableId必须是有效的UUID'),
  body('toTableId').isUUID().withMessage('toTableId必须是有效的UUID'),
  body('fromFieldId').isUUID().withMessage('fromFieldId必须是有效的UUID'),
  body('toFieldId').isUUID().withMessage('toFieldId必须是有效的UUID'),
  body('relationshipType').isIn(['ONE_TO_ONE', 'ONE_TO_MANY', 'MANY_TO_ONE', 'MANY_TO_MANY']).withMessage('relationshipType必须是有效的关系类型'),
  body('name').optional().isString().isLength({ max: 100 }).withMessage('name不能超过100字符'),
  body('description').optional().isString().withMessage('description必须是字符串'),
  body('onUpdate').optional().isIn(['CASCADE', 'SET_NULL', 'SET_DEFAULT', 'RESTRICT', 'NO_ACTION']).withMessage('onUpdate必须是有效的约束动作'),
  body('onDelete').optional().isIn(['CASCADE', 'SET_NULL', 'SET_DEFAULT', 'RESTRICT', 'NO_ACTION']).withMessage('onDelete必须是有效的约束动作'),
  body('isDeferrable').optional().isBoolean().withMessage('isDeferrable必须是布尔值'),
  body('isEnforced').optional().isBoolean().withMessage('isEnforced必须是布尔值'),
  body('constraintName').optional().isString().isLength({ max: 64 }).withMessage('constraintName不能超过64字符')
], validateRequest, async (req, res, next) => {
  try {
    const {
      fromTableId,
      toTableId,
      fromFieldId,
      toFieldId,
      relationshipType,
      name,
      description,
      onUpdate = 'RESTRICT',
      onDelete = 'RESTRICT',
      isDeferrable = false,
      isEnforced = true,
      constraintName
    } = req.body

    // 检查表是否存在
    const [fromTable, toTable] = await Promise.all([
      prisma.databaseTable.findUnique({ where: { id: fromTableId } }),
      prisma.databaseTable.findUnique({ where: { id: toTableId } })
    ])

    if (!fromTable) {
      throw new AppError('源表不存在', 404)
    }
    if (!toTable) {
      throw new AppError('目标表不存在', 404)
    }

    // 检查表是否在同一项目中
    if (fromTable.projectId !== toTable.projectId) {
      throw new AppError('关系表必须在同一项目中', 400)
    }

    // 检查字段是否存在且属于对应的表
    const [fromField, toField] = await Promise.all([
      prisma.databaseField.findUnique({ 
        where: { id: fromFieldId },
        include: { table: true }
      }),
      prisma.databaseField.findUnique({ 
        where: { id: toFieldId },
        include: { table: true }
      })
    ])

    if (!fromField || fromField.tableId !== fromTableId) {
      throw new AppError('源字段不存在或不属于源表', 400)
    }
    if (!toField || toField.tableId !== toTableId) {
      throw new AppError('目标字段不存在或不属于目标表', 400)
    }

    // 检查字段类型兼容性
    if (fromField.type !== toField.type) {
      logger.warn('字段类型不匹配', {
        fromFieldType: fromField.type,
        toFieldType: toField.type
      })
    }

    // 检查是否已存在相同的关系
    const existingRelationship = await prisma.tableRelationship.findFirst({
      where: {
        fromTableId,
        toTableId,
        fromFieldId,
        toFieldId
      }
    })

    if (existingRelationship) {
      throw new AppError('该关系已存在', 400)
    }

    // 生成约束名称
    const finalConstraintName = constraintName || 
      `fk_${fromTable.name}_${toTable.name}_${fromField.name}`

    // 创建关系
    const relationship = await prisma.tableRelationship.create({
      data: {
        fromTableId,
        toTableId,
        fromFieldId,
        toFieldId,
        relationshipType,
        name,
        description,
        onUpdate,
        onDelete,
        isDeferrable,
        isEnforced,
        constraintName: finalConstraintName
      },
      include: {
        fromTable: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        },
        toTable: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        }
      }
    })

    logger.info('创建表关系成功', {
      relationshipId: relationship.id,
      fromTable: fromTable.name,
      toTable: toTable.name,
      relationshipType,
      projectId: fromTable.projectId
    })

    res.status(201).json({
      success: true,
      data: relationship,
      message: '表关系创建成功'
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   PUT /api/v1/table-relationships/:id
 * @desc    更新表关系
 * @access  Public
 */
router.put('/:id', [
  param('id').isUUID().withMessage('ID必须是有效的UUID'),
  body('relationshipType').optional().isIn(['ONE_TO_ONE', 'ONE_TO_MANY', 'MANY_TO_ONE', 'MANY_TO_MANY']).withMessage('relationshipType必须是有效的关系类型'),
  body('name').optional().isString().isLength({ max: 100 }).withMessage('name不能超过100字符'),
  body('description').optional().isString().withMessage('description必须是字符串'),
  body('onUpdate').optional().isIn(['CASCADE', 'SET_NULL', 'SET_DEFAULT', 'RESTRICT', 'NO_ACTION']).withMessage('onUpdate必须是有效的约束动作'),
  body('onDelete').optional().isIn(['CASCADE', 'SET_NULL', 'SET_DEFAULT', 'RESTRICT', 'NO_ACTION']).withMessage('onDelete必须是有效的约束动作'),
  body('isDeferrable').optional().isBoolean().withMessage('isDeferrable必须是布尔值'),
  body('isEnforced').optional().isBoolean().withMessage('isEnforced必须是布尔值'),
  body('constraintName').optional().isString().isLength({ max: 64 }).withMessage('constraintName不能超过64字符')
], validateRequest, async (req, res, next) => {
  try {
    const { id } = req.params
    const updateData = req.body

    // 检查关系是否存在
    const existingRelationship = await prisma.tableRelationship.findUnique({
      where: { id },
      include: {
        fromTable: true,
        toTable: true
      }
    })

    if (!existingRelationship) {
      throw new AppError('表关系不存在', 404)
    }

    // 更新关系
    const updatedRelationship = await prisma.tableRelationship.update({
      where: { id },
      data: updateData,
      include: {
        fromTable: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        },
        toTable: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        }
      }
    })

    logger.info('更新表关系成功', {
      relationshipId: id,
      updates: Object.keys(updateData),
      projectId: existingRelationship.fromTable.projectId
    })

    res.json({
      success: true,
      data: updatedRelationship,
      message: '表关系更新成功'
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   DELETE /api/v1/table-relationships/:id
 * @desc    删除表关系
 * @access  Public
 */
router.delete('/:id', [
  param('id').isUUID().withMessage('ID必须是有效的UUID')
], validateRequest, async (req, res, next) => {
  try {
    const { id } = req.params

    // 检查关系是否存在
    const relationship = await prisma.tableRelationship.findUnique({
      where: { id },
      include: {
        fromTable: true,
        toTable: true
      }
    })

    if (!relationship) {
      throw new AppError('表关系不存在', 404)
    }

    // 删除关系
    await prisma.tableRelationship.delete({
      where: { id }
    })

    logger.info('删除表关系成功', {
      relationshipId: id,
      fromTable: relationship.fromTable.name,
      toTable: relationship.toTable.name,
      projectId: relationship.fromTable.projectId
    })

    res.json({
      success: true,
      message: '表关系删除成功'
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   GET /api/v1/table-relationships/project/:projectId/graph
 * @desc    获取项目的关系图数据
 * @access  Public
 */
router.get('/project/:projectId/graph', [
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

    // 获取项目的所有表和关系
    const [tables, relationships] = await Promise.all([
      prisma.databaseTable.findMany({
        where: { projectId },
        include: {
          fields: {
            select: {
              id: true,
              name: true,
              type: true,
              isPrimaryKey: true,
              nullable: true,
              isAutoIncrement: true
            },
            orderBy: {
              sortOrder: 'asc'
            }
          }
        }
      }),
      prisma.tableRelationship.findMany({
        where: {
          fromTable: { projectId }
        },
        include: {
          fromTable: {
            select: {
              id: true,
              name: true,
              displayName: true
            }
          },
          toTable: {
            select: {
              id: true,
              name: true,
              displayName: true
            }
          }
        }
      })
    ])

    // 构建关系图数据结构
    const graphData = {
      nodes: tables.map(table => ({
        id: table.id,
        name: table.name,
        displayName: table.displayName,
        fields: table.fields,
        category: table.category,
        status: table.status
      })),
      edges: relationships.map(rel => ({
        id: rel.id,
        fromTableId: rel.fromTableId,
        toTableId: rel.toTableId,
        fromFieldId: rel.fromFieldId,
        toFieldId: rel.toFieldId,
        relationshipType: rel.relationshipType,
        name: rel.name,
        constraintName: rel.constraintName,
        onUpdate: rel.onUpdate,
        onDelete: rel.onDelete
      }))
    }

    logger.info('获取项目关系图成功', {
      projectId,
      tablesCount: tables.length,
      relationshipsCount: relationships.length
    })

    res.json({
      success: true,
      data: graphData
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   POST /api/v1/table-relationships/validate
 * @desc    验证关系定义的有效性
 * @access  Public
 */
router.post('/validate', [
  body('fromTableId').isUUID().withMessage('fromTableId必须是有效的UUID'),
  body('toTableId').isUUID().withMessage('toTableId必须是有效的UUID'),
  body('fromFieldId').isUUID().withMessage('fromFieldId必须是有效的UUID'),
  body('toFieldId').isUUID().withMessage('toFieldId必须是有效的UUID'),
  body('relationshipType').isIn(['ONE_TO_ONE', 'ONE_TO_MANY', 'MANY_TO_ONE', 'MANY_TO_MANY']).withMessage('relationshipType必须是有效的关系类型')
], validateRequest, async (req, res, next) => {
  try {
    const { fromTableId, toTableId, fromFieldId, toFieldId, relationshipType } = req.body

    const validation = {
      isValid: true,
      warnings: [] as string[],
      errors: [] as string[]
    }

    // 检查表和字段
    const [fromTable, toTable, fromField, toField] = await Promise.all([
      prisma.databaseTable.findUnique({ where: { id: fromTableId } }),
      prisma.databaseTable.findUnique({ where: { id: toTableId } }),
      prisma.databaseField.findUnique({ where: { id: fromFieldId } }),
      prisma.databaseField.findUnique({ where: { id: toFieldId } })
    ])

    if (!fromTable) validation.errors.push('源表不存在')
    if (!toTable) validation.errors.push('目标表不存在')
    if (!fromField) validation.errors.push('源字段不存在')
    if (!toField) validation.errors.push('目标字段不存在')

    if (validation.errors.length > 0) {
      validation.isValid = false
      return res.json({ success: true, data: validation })
    }

    // 检查项目一致性
    if (fromTable!.projectId !== toTable!.projectId) {
      validation.errors.push('关系表必须在同一项目中')
    }

    // 检查字段属于对应的表
    if (fromField!.tableId !== fromTableId) {
      validation.errors.push('源字段不属于源表')
    }
    if (toField!.tableId !== toTableId) {
      validation.errors.push('目标字段不属于目标表')
    }

    // 检查字段类型兼容性
    if (fromField!.type !== toField!.type) {
      validation.warnings.push(`字段类型不匹配: ${fromField!.type} vs ${toField!.type}`)
    }

    // 检查关系类型的合理性
    if (relationshipType === 'ONE_TO_ONE' && !fromField!.isUnique) {
      validation.warnings.push('一对一关系建议源字段设置为唯一约束')
    }

    // 检查是否已存在关系
    const existingRelationship = await prisma.tableRelationship.findFirst({
      where: { fromTableId, toTableId, fromFieldId, toFieldId }
    })

    if (existingRelationship) {
      validation.errors.push('该关系已存在')
    }

    validation.isValid = validation.errors.length === 0

    res.json({
      success: true,
      data: validation
    })
  } catch (error) {
    next(error)
  }
})

export default router