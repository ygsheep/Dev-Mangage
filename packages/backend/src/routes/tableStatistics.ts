import { Router } from 'express'
import { body, param, query } from 'express-validator'
import { validateRequest } from '../middleware/validateRequest'
import { prisma } from '../database'
import { AppError } from '../middleware/errorHandler'
import logger from '../utils/logger'

const router = Router()

/**
 * @route   GET /api/v1/table-statistics
 * @desc    获取表统计信息列表
 * @access  Public
 */
router.get('/', [
  query('projectId').optional().isUUID().withMessage('projectId必须是有效的UUID'),
  query('tableId').optional().isUUID().withMessage('tableId必须是有效的UUID'),
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页条数必须在1-100之间')
], validateRequest, async (req, res, next) => {
  try {
    const { projectId, tableId, page = 1, limit = 20 } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    // 构建查询条件
    const where: any = {}
    if (tableId) {
      where.tableId = tableId as string
    } else if (projectId) {
      where.table = {
        projectId: projectId as string
      }
    }

    // 查询统计信息
    const [statistics, total] = await Promise.all([
      prisma.tableStatistics.findMany({
        where,
        include: {
          table: {
            select: {
              id: true,
              name: true,
              displayName: true,
              projectId: true,
              status: true,
              category: true
            }
          }
        },
        orderBy: [
          { table: { name: 'asc' } },
          { updatedAt: 'desc' }
        ],
        skip,
        take: Number(limit)
      }),
      prisma.tableStatistics.count({ where })
    ])

    logger.info('查询表统计信息成功', {
      total,
      page: Number(page),
      limit: Number(limit),
      filters: { projectId, tableId }
    })

    res.json({
      success: true,
      data: statistics,
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
 * @route   GET /api/v1/table-statistics/:id
 * @desc    获取单个表统计信息详情
 * @access  Public
 */
router.get('/:id', [
  param('id').isUUID().withMessage('ID必须是有效的UUID')
], validateRequest, async (req, res, next) => {
  try {
    const { id } = req.params

    const statistics = await prisma.tableStatistics.findUnique({
      where: { id },
      include: {
        table: {
          include: {
            fields: {
              select: {
                id: true,
                name: true,
                type: true,
                nullable: true,
                isPrimaryKey: true,
                isIndex: true
              }
            },
            indexes: {
              select: {
                id: true,
                name: true,
                type: true,
                isUnique: true
              }
            },
            fromRelations: {
              select: {
                id: true,
                relationshipType: true,
                toTable: {
                  select: {
                    name: true,
                    displayName: true
                  }
                }
              }
            },
            toRelations: {
              select: {
                id: true,
                relationshipType: true,
                fromTable: {
                  select: {
                    name: true,
                    displayName: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!statistics) {
      throw new AppError('表统计信息不存在', 404)
    }

    logger.info('获取表统计信息详情成功', { statisticsId: id })

    res.json({
      success: true,
      data: statistics
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   POST /api/v1/table-statistics
 * @desc    创建或更新表统计信息
 * @access  Public
 */
router.post('/', [
  body('tableId').isUUID().withMessage('tableId必须是有效的UUID'),
  body('rowCount').optional().isInt({ min: 0 }).withMessage('rowCount必须是非负整数'),
  body('dataSize').optional().isInt({ min: 0 }).withMessage('dataSize必须是非负整数'),
  body('indexSize').optional().isInt({ min: 0 }).withMessage('indexSize必须是非负整数'),
  body('fragmentSize').optional().isInt({ min: 0 }).withMessage('fragmentSize必须是非负整数'),
  body('lastAnalyzed').optional().isISO8601().withMessage('lastAnalyzed必须是有效的日期')
], validateRequest, async (req, res, next) => {
  try {
    const {
      tableId,
      rowCount = 0,
      dataSize = 0,
      indexSize = 0,
      fragmentSize = 0,
      lastAnalyzed
    } = req.body

    // 检查表是否存在
    const table = await prisma.databaseTable.findUnique({
      where: { id: tableId }
    })

    if (!table) {
      throw new AppError('表不存在', 404)
    }

    // 检查是否已存在统计信息
    const existingStats = await prisma.tableStatistics.findFirst({
      where: { tableId }
    })

    let statistics
    if (existingStats) {
      // 更新现有统计信息
      statistics = await prisma.tableStatistics.update({
        where: { id: existingStats.id },
        data: {
          rowCount,
          dataSize,
          indexSize,
          fragmentSize,
          lastAnalyzed: lastAnalyzed ? new Date(lastAnalyzed) : new Date()
        },
        include: {
          table: {
            select: {
              id: true,
              name: true,
              displayName: true
            }
          }
        }
      })

      logger.info('更新表统计信息成功', {
        statisticsId: statistics.id,
        tableId,
        tableName: table.name
      })
    } else {
      // 创建新的统计信息
      statistics = await prisma.tableStatistics.create({
        data: {
          tableId,
          rowCount,
          dataSize,
          indexSize,
          fragmentSize,
          lastAnalyzed: lastAnalyzed ? new Date(lastAnalyzed) : new Date()
        },
        include: {
          table: {
            select: {
              id: true,
              name: true,
              displayName: true
            }
          }
        }
      })

      logger.info('创建表统计信息成功', {
        statisticsId: statistics.id,
        tableId,
        tableName: table.name
      })
    }

    res.status(existingStats ? 200 : 201).json({
      success: true,
      data: statistics,
      message: existingStats ? '统计信息更新成功' : '统计信息创建成功'
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   PUT /api/v1/table-statistics/:id
 * @desc    更新表统计信息
 * @access  Public
 */
router.put('/:id', [
  param('id').isUUID().withMessage('ID必须是有效的UUID'),
  body('rowCount').optional().isInt({ min: 0 }).withMessage('rowCount必须是非负整数'),
  body('dataSize').optional().isInt({ min: 0 }).withMessage('dataSize必须是非负整数'),
  body('indexSize').optional().isInt({ min: 0 }).withMessage('indexSize必须是非负整数'),
  body('fragmentSize').optional().isInt({ min: 0 }).withMessage('fragmentSize必须是非负整数'),
  body('lastAnalyzed').optional().isISO8601().withMessage('lastAnalyzed必须是有效的日期')
], validateRequest, async (req, res, next) => {
  try {
    const { id } = req.params
    const updateData = req.body

    // 检查统计信息是否存在
    const existingStats = await prisma.tableStatistics.findUnique({
      where: { id },
      include: {
        table: true
      }
    })

    if (!existingStats) {
      throw new AppError('表统计信息不存在', 404)
    }

    // 处理日期字段
    if (updateData.lastAnalyzed) {
      updateData.lastAnalyzed = new Date(updateData.lastAnalyzed)
    }

    // 更新统计信息
    const updatedStats = await prisma.tableStatistics.update({
      where: { id },
      data: updateData,
      include: {
        table: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        }
      }
    })

    logger.info('更新表统计信息成功', {
      statisticsId: id,
      updates: Object.keys(updateData),
      tableId: existingStats.tableId
    })

    res.json({
      success: true,
      data: updatedStats,
      message: '统计信息更新成功'
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   DELETE /api/v1/table-statistics/:id
 * @desc    删除表统计信息
 * @access  Public
 */
router.delete('/:id', [
  param('id').isUUID().withMessage('ID必须是有效的UUID')
], validateRequest, async (req, res, next) => {
  try {
    const { id } = req.params

    // 检查统计信息是否存在
    const statistics = await prisma.tableStatistics.findUnique({
      where: { id },
      include: {
        table: true
      }
    })

    if (!statistics) {
      throw new AppError('表统计信息不存在', 404)
    }

    // 删除统计信息
    await prisma.tableStatistics.delete({
      where: { id }
    })

    logger.info('删除表统计信息成功', {
      statisticsId: id,
      tableId: statistics.tableId,
      tableName: statistics.table.name
    })

    res.json({
      success: true,
      message: '统计信息删除成功'
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   GET /api/v1/table-statistics/project/:projectId/summary
 * @desc    获取项目的统计信息汇总
 * @access  Public
 */
router.get('/project/:projectId/summary', [
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

    // 获取项目的基础统计
    const [
      tablesCount,
      fieldsCount,
      indexesCount,
      relationshipsCount,
      statistics
    ] = await Promise.all([
      prisma.databaseTable.count({
        where: { projectId }
      }),
      prisma.databaseField.count({
        where: {
          table: { projectId }
        }
      }),
      prisma.databaseIndex.count({
        where: {
          table: { projectId }
        }
      }),
      prisma.tableRelationship.count({
        where: {
          fromTable: { projectId }
        }
      }),
      prisma.tableStatistics.findMany({
        where: {
          table: { projectId }
        },
        include: {
          table: {
            select: {
              id: true,
              name: true,
              displayName: true,
              status: true,
              category: true
            }
          }
        }
      })
    ])

    // 计算数据大小汇总
    const totalRowCount = statistics.reduce((sum, stat) => sum + stat.rowCount, 0)
    const totalDataSize = statistics.reduce((sum, stat) => sum + stat.dataSize, 0)
    const totalIndexSize = statistics.reduce((sum, stat) => sum + stat.indexSize, 0)
    const totalFragmentSize = statistics.reduce((sum, stat) => sum + stat.fragmentSize, 0)

    // 按类别分组统计
    const categoryStats: { [key: string]: any } = {}
    statistics.forEach(stat => {
      const category = stat.table.category || 'uncategorized'
      if (!categoryStats[category]) {
        categoryStats[category] = {
          tablesCount: 0,
          rowCount: 0,
          dataSize: 0,
          indexSize: 0
        }
      }
      categoryStats[category].tablesCount++
      categoryStats[category].rowCount += stat.rowCount
      categoryStats[category].dataSize += stat.dataSize
      categoryStats[category].indexSize += stat.indexSize
    })

    // 按状态分组统计
    const statusStats: { [key: string]: number } = {}
    const tablesWithStats = await prisma.databaseTable.findMany({
      where: { projectId },
      select: { status: true }
    })
    
    tablesWithStats.forEach(table => {
      statusStats[table.status] = (statusStats[table.status] || 0) + 1
    })

    // 最近更新的表
    const recentlyUpdated = statistics
      .filter(stat => stat.lastAnalyzed)
      .sort((a, b) => new Date(b.lastAnalyzed!).getTime() - new Date(a.lastAnalyzed!).getTime())
      .slice(0, 5)
      .map(stat => ({
        tableId: stat.tableId,
        tableName: stat.table.name,
        displayName: stat.table.displayName,
        lastAnalyzed: stat.lastAnalyzed,
        rowCount: stat.rowCount,
        dataSize: stat.dataSize
      }))

    // 大表排行
    const largestTables = statistics
      .sort((a, b) => b.rowCount - a.rowCount)
      .slice(0, 10)
      .map(stat => ({
        tableId: stat.tableId,
        tableName: stat.table.name,
        displayName: stat.table.displayName,
        rowCount: stat.rowCount,
        dataSize: stat.dataSize,
        category: stat.table.category
      }))

    const summary = {
      projectId,
      projectName: project.name,
      overview: {
        tablesCount,
        fieldsCount,
        indexesCount,
        relationshipsCount,
        totalRowCount,
        totalDataSize,
        totalIndexSize,
        totalFragmentSize,
        hasStatistics: statistics.length
      },
      categoryBreakdown: categoryStats,
      statusBreakdown: statusStats,
      recentlyUpdated,
      largestTables,
      lastUpdated: new Date()
    }

    logger.info('获取项目统计汇总成功', {
      projectId,
      tablesCount,
      statisticsCount: statistics.length
    })

    res.json({
      success: true,
      data: summary
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   POST /api/v1/table-statistics/table/:tableId/analyze
 * @desc    分析表并更新统计信息（模拟）
 * @access  Public
 */
router.post('/table/:tableId/analyze', [
  param('tableId').isUUID().withMessage('tableId必须是有效的UUID')
], validateRequest, async (req, res, next) => {
  try {
    const { tableId } = req.params

    // 检查表是否存在
    const table = await prisma.databaseTable.findUnique({
      where: { id: tableId },
      include: {
        fields: true,
        indexes: true
      }
    })

    if (!table) {
      throw new AppError('表不存在', 404)
    }

    // 模拟分析过程（在实际应用中，这里应该连接到真实的数据库进行分析）
    const mockAnalysis = {
      rowCount: Math.floor(Math.random() * 100000) + 1000,
      dataSize: Math.floor(Math.random() * 50000000) + 100000, // bytes
      indexSize: Math.floor(Math.random() * 10000000) + 50000, // bytes
      fragmentSize: Math.floor(Math.random() * 1000000), // bytes
      lastAnalyzed: new Date()
    }

    // 查找现有统计信息
    const existingStats = await prisma.tableStatistics.findFirst({
      where: { tableId }
    })

    // 更新或创建统计信息
    const statistics = existingStats 
      ? await prisma.tableStatistics.update({
          where: { id: existingStats.id },
          data: mockAnalysis,
          include: {
            table: {
              select: {
                id: true,
                name: true,
                displayName: true
              }
            }
          }
        })
      : await prisma.tableStatistics.create({
          data: {
            tableId,
            ...mockAnalysis
          },
          include: {
            table: {
              select: {
                id: true,
                name: true,
                displayName: true
              }
            }
          }
        })

    logger.info('表分析完成', {
      tableId,
      tableName: table.name,
      rowCount: mockAnalysis.rowCount,
      dataSize: mockAnalysis.dataSize
    })

    res.json({
      success: true,
      data: statistics,
      message: '表分析完成'
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   POST /api/v1/table-statistics/project/:projectId/analyze-all
 * @desc    分析项目所有表并更新统计信息
 * @access  Public
 */
router.post('/project/:projectId/analyze-all', [
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

    // 获取项目的所有表
    const tables = await prisma.databaseTable.findMany({
      where: { projectId }
    })

    if (tables.length === 0) {
      return res.json({
        success: true,
        data: { analyzedTables: 0 },
        message: '该项目没有数据表需要分析'
      })
    }

    // 批量分析所有表（模拟）
    const analysisResults = tables.map(table => ({
      tableId: table.id,
      rowCount: Math.floor(Math.random() * 100000) + 1000,
      dataSize: Math.floor(Math.random() * 50000000) + 100000,
      indexSize: Math.floor(Math.random() * 10000000) + 50000,
      fragmentSize: Math.floor(Math.random() * 1000000),
      lastAnalyzed: new Date()
    }))

    // 批量更新统计信息
    const updatePromises = analysisResults.map(async (result) => {
      const existing = await prisma.tableStatistics.findFirst({
        where: { tableId: result.tableId }
      })
      
      if (existing) {
        return prisma.tableStatistics.update({
          where: { id: existing.id },
          data: result
        })
      } else {
        return prisma.tableStatistics.create({
          data: result
        })
      }
    })

    await Promise.all(updatePromises)

    logger.info('项目表分析完成', {
      projectId,
      analyzedTables: tables.length
    })

    res.json({
      success: true,
      data: {
        projectId,
        analyzedTables: tables.length,
        results: analysisResults
      },
      message: `成功分析 ${tables.length} 个数据表`
    })
  } catch (error) {
    next(error)
  }
})

export default router