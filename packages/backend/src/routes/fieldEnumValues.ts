import { Router } from 'express'
import { body, param, query } from 'express-validator'
import { validateRequest } from '../middleware/validateRequest'
import { prisma } from '../database'
import { AppError } from '../middleware/errorHandler'
import logger from '../utils/logger'

const router = Router()

/**
 * @route   GET /api/v1/field-enum-values
 * @desc    获取字段枚举值列表
 * @access  Public
 */
router.get('/', [
  query('fieldId').optional().isUUID().withMessage('fieldId必须是有效的UUID'),
  query('isActive').optional().isBoolean().withMessage('isActive必须是布尔值'),
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页条数必须在1-100之间')
], validateRequest, async (req, res, next) => {
  try {
    const { fieldId, isActive, page = 1, limit = 20 } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    // 构建查询条件
    const where: any = {}
    if (fieldId) where.fieldId = fieldId as string
    if (isActive !== undefined) where.isActive = isActive === 'true'

    // 查询枚举值
    const [enumValues, total] = await Promise.all([
      prisma.fieldEnumValue.findMany({
        where,
        include: {
          field: {
            select: {
              id: true,
              name: true,
              type: true,
              table: {
                select: {
                  id: true,
                  name: true,
                  displayName: true
                }
              }
            }
          }
        },
        orderBy: [
          { fieldId: 'asc' },
          { sortOrder: 'asc' },
          { createdAt: 'asc' }
        ],
        skip,
        take: Number(limit)
      }),
      prisma.fieldEnumValue.count({ where })
    ])

    logger.info('查询字段枚举值成功', {
      total,
      page: Number(page),
      limit: Number(limit),
      filters: { fieldId, isActive }
    })

    res.json({
      success: true,
      data: enumValues,
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
 * @route   GET /api/v1/field-enum-values/:id
 * @desc    获取单个枚举值详情
 * @access  Public
 */
router.get('/:id', [
  param('id').isUUID().withMessage('ID必须是有效的UUID')
], validateRequest, async (req, res, next) => {
  try {
    const { id } = req.params

    const enumValue = await prisma.fieldEnumValue.findUnique({
      where: { id },
      include: {
        field: {
          include: {
            table: {
              select: {
                id: true,
                name: true,
                displayName: true,
                projectId: true
              }
            }
          }
        }
      }
    })

    if (!enumValue) {
      throw new AppError('枚举值不存在', 404)
    }

    logger.info('获取枚举值详情成功', { enumValueId: id })

    res.json({
      success: true,
      data: enumValue
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   POST /api/v1/field-enum-values
 * @desc    创建新的枚举值
 * @access  Public
 */
router.post('/', [
  body('fieldId').isUUID().withMessage('fieldId必须是有效的UUID'),
  body('value').isString().isLength({ min: 1, max: 100 }).withMessage('value必须是1-100字符的字符串'),
  body('label').optional().isString().isLength({ max: 200 }).withMessage('label不能超过200字符'),
  body('description').optional().isString().withMessage('description必须是字符串'),
  body('sortOrder').optional().isInt({ min: 0 }).withMessage('sortOrder必须是非负整数'),
  body('isDefault').optional().isBoolean().withMessage('isDefault必须是布尔值'),
  body('isActive').optional().isBoolean().withMessage('isActive必须是布尔值'),
  body('color').optional().isString().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('color必须是有效的十六进制颜色值')
], validateRequest, async (req, res, next) => {
  try {
    const {
      fieldId,
      value,
      label,
      description,
      sortOrder = 0,
      isDefault = false,
      isActive = true,
      color
    } = req.body

    // 检查字段是否存在
    const field = await prisma.databaseField.findUnique({
      where: { id: fieldId },
      include: {
        table: {
          select: {
            projectId: true,
            name: true
          }
        }
      }
    })

    if (!field) {
      throw new AppError('字段不存在', 404)
    }

    // 检查字段类型是否支持枚举值
    if (!['ENUM', 'SET'].includes(field.type)) {
      throw new AppError('该字段类型不支持枚举值', 400)
    }

    // 检查是否已存在相同值
    const existingValue = await prisma.fieldEnumValue.findUnique({
      where: {
        fieldId_value: {
          fieldId,
          value
        }
      }
    })

    if (existingValue) {
      throw new AppError('该枚举值已存在', 400)
    }

    // 如果设置为默认值，需要取消其他默认值
    if (isDefault) {
      await prisma.fieldEnumValue.updateMany({
        where: {
          fieldId,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      })
    }

    // 创建枚举值
    const enumValue = await prisma.fieldEnumValue.create({
      data: {
        fieldId,
        value,
        label,
        description,
        sortOrder,
        isDefault,
        isActive,
        color
      },
      include: {
        field: {
          select: {
            id: true,
            name: true,
            type: true,
            table: {
              select: {
                id: true,
                name: true,
                displayName: true
              }
            }
          }
        }
      }
    })

    logger.info('创建枚举值成功', {
      enumValueId: enumValue.id,
      fieldId,
      value,
      projectId: field.table.projectId
    })

    res.status(201).json({
      success: true,
      data: enumValue,
      message: '枚举值创建成功'
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   PUT /api/v1/field-enum-values/:id
 * @desc    更新枚举值
 * @access  Public
 */
router.put('/:id', [
  param('id').isUUID().withMessage('ID必须是有效的UUID'),
  body('value').optional().isString().isLength({ min: 1, max: 100 }).withMessage('value必须是1-100字符的字符串'),
  body('label').optional().isString().isLength({ max: 200 }).withMessage('label不能超过200字符'),
  body('description').optional().isString().withMessage('description必须是字符串'),
  body('sortOrder').optional().isInt({ min: 0 }).withMessage('sortOrder必须是非负整数'),
  body('isDefault').optional().isBoolean().withMessage('isDefault必须是布尔值'),
  body('isActive').optional().isBoolean().withMessage('isActive必须是布尔值'),
  body('color').optional().isString().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('color必须是有效的十六进制颜色值')
], validateRequest, async (req, res, next) => {
  try {
    const { id } = req.params
    const updateData = req.body

    // 检查枚举值是否存在
    const existingValue = await prisma.fieldEnumValue.findUnique({
      where: { id },
      include: {
        field: {
          include: {
            table: {
              select: {
                projectId: true
              }
            }
          }
        }
      }
    })

    if (!existingValue) {
      throw new AppError('枚举值不存在', 404)
    }

    // 如果要更新值，检查是否冲突
    if (updateData.value && updateData.value !== existingValue.value) {
      const conflictValue = await prisma.fieldEnumValue.findUnique({
        where: {
          fieldId_value: {
            fieldId: existingValue.fieldId,
            value: updateData.value
          }
        }
      })

      if (conflictValue) {
        throw new AppError('该枚举值已存在', 400)
      }
    }

    // 如果设置为默认值，需要取消其他默认值
    if (updateData.isDefault) {
      await prisma.fieldEnumValue.updateMany({
        where: {
          fieldId: existingValue.fieldId,
          isDefault: true,
          id: { not: id }
        },
        data: {
          isDefault: false
        }
      })
    }

    // 更新枚举值
    const updatedValue = await prisma.fieldEnumValue.update({
      where: { id },
      data: updateData,
      include: {
        field: {
          select: {
            id: true,
            name: true,
            type: true,
            table: {
              select: {
                id: true,
                name: true,
                displayName: true
              }
            }
          }
        }
      }
    })

    logger.info('更新枚举值成功', {
      enumValueId: id,
      updates: Object.keys(updateData),
      projectId: existingValue.field.table.projectId
    })

    res.json({
      success: true,
      data: updatedValue,
      message: '枚举值更新成功'
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   DELETE /api/v1/field-enum-values/:id
 * @desc    删除枚举值
 * @access  Public
 */
router.delete('/:id', [
  param('id').isUUID().withMessage('ID必须是有效的UUID')
], validateRequest, async (req, res, next) => {
  try {
    const { id } = req.params

    // 检查枚举值是否存在
    const enumValue = await prisma.fieldEnumValue.findUnique({
      where: { id },
      include: {
        field: {
          include: {
            table: {
              select: {
                projectId: true
              }
            }
          }
        }
      }
    })

    if (!enumValue) {
      throw new AppError('枚举值不存在', 404)
    }

    // 删除枚举值
    await prisma.fieldEnumValue.delete({
      where: { id }
    })

    logger.info('删除枚举值成功', {
      enumValueId: id,
      value: enumValue.value,
      projectId: enumValue.field.table.projectId
    })

    res.json({
      success: true,
      message: '枚举值删除成功'
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   POST /api/v1/field-enum-values/batch
 * @desc    批量创建枚举值
 * @access  Public
 */
router.post('/batch', [
  body('fieldId').isUUID().withMessage('fieldId必须是有效的UUID'),
  body('values').isArray().withMessage('values必须是数组'),
  body('values.*.value').isString().isLength({ min: 1, max: 100 }).withMessage('每个枚举值的value必须是1-100字符的字符串'),
  body('values.*.label').optional().isString().isLength({ max: 200 }).withMessage('label不能超过200字符'),
  body('values.*.description').optional().isString().withMessage('description必须是字符串'),
  body('values.*.sortOrder').optional().isInt({ min: 0 }).withMessage('sortOrder必须是非负整数'),
  body('values.*.isDefault').optional().isBoolean().withMessage('isDefault必须是布尔值'),
  body('values.*.color').optional().isString().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('color必须是有效的十六进制颜色值')
], validateRequest, async (req, res, next) => {
  try {
    const { fieldId, values } = req.body

    // 检查字段是否存在
    const field = await prisma.databaseField.findUnique({
      where: { id: fieldId },
      include: {
        table: {
          select: {
            projectId: true
          }
        }
      }
    })

    if (!field) {
      throw new AppError('字段不存在', 404)
    }

    // 检查字段类型是否支持枚举值
    if (!['ENUM', 'SET'].includes(field.type)) {
      throw new AppError('该字段类型不支持枚举值', 400)
    }

    // 检查重复值
    const valueSet = new Set()
    for (const item of values) {
      if (valueSet.has(item.value)) {
        throw new AppError(`枚举值 "${item.value}" 重复`, 400)
      }
      valueSet.add(item.value)
    }

    // 检查数据库中是否已存在
    const existingValues = await prisma.fieldEnumValue.findMany({
      where: {
        fieldId,
        value: {
          in: values.map((v: any) => v.value)
        }
      }
    })

    if (existingValues.length > 0) {
      throw new AppError(`枚举值 "${existingValues[0].value}" 已存在`, 400)
    }

    // 检查默认值设置
    const defaultValues = values.filter((v: any) => v.isDefault)
    if (defaultValues.length > 1) {
      throw new AppError('只能设置一个默认值', 400)
    }

    // 如果有默认值，取消现有默认值
    if (defaultValues.length === 1) {
      await prisma.fieldEnumValue.updateMany({
        where: {
          fieldId,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      })
    }

    // 批量创建
    const createData = values.map((item: any, index: number) => ({
      fieldId,
      value: item.value,
      label: item.label,
      description: item.description,
      sortOrder: item.sortOrder ?? index,
      isDefault: item.isDefault ?? false,
      isActive: item.isActive ?? true,
      color: item.color
    }))

    const createdValues = await prisma.$transaction(
      createData.map(data => 
        prisma.fieldEnumValue.create({
          data,
          include: {
            field: {
              select: {
                id: true,
                name: true,
                type: true
              }
            }
          }
        })
      )
    )

    logger.info('批量创建枚举值成功', {
      fieldId,
      count: createdValues.length,
      projectId: field.table.projectId
    })

    res.status(201).json({
      success: true,
      data: createdValues,
      message: `成功创建 ${createdValues.length} 个枚举值`
    })
  } catch (error) {
    next(error)
  }
})

export default router