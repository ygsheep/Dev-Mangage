// packages/backend/src/routes/mindmap.ts

import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../database'
import { asyncHandler, AppError } from '../middleware/errorHandler'
import { validateBody, validateParams, validateQuery } from '../middleware/validation'

const router = Router()

// 验证模式
const mindmapLayoutSchema = z.object({
  projectId: z.string().min(1),
  nodes: z.array(z.object({
    id: z.string(),
    type: z.string(),
    position: z.object({
      x: z.number(),
      y: z.number()
    }),
    data: z.any()
  })),
  edges: z.array(z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    type: z.string().optional(),
    data: z.any().optional()
  })),
  config: z.object({
    layout: z.any(),
    display: z.any(),
    interaction: z.any(),
    filters: z.any()
  }).optional()
})

const projectParamsSchema = z.object({
  projectId: z.string().min(1)
})

// 获取项目的mindmap数据
router.get(
  '/:projectId',
  validateParams(projectParamsSchema),
  asyncHandler(async (req, res) => {
    const { projectId } = req.params

    // 获取项目基本信息
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      throw new AppError('Project not found', 404)
    }

    // 获取数据表信息
    const tables = await prisma.databaseTable.findMany({
      where: { projectId },
      include: {
        fields: {
          orderBy: { sortOrder: 'asc' }
        },
        indexes: true,
        fromRelations: {
          include: {
            toTable: { select: { id: true, name: true } }
          }
        },
        toRelations: {
          include: {
            fromTable: { select: { id: true, name: true } }
          }
        },
        _count: {
          select: {
            fields: true,
            indexes: true,
            fromRelations: true,
            toRelations: true
          }
        }
      }
    })

    // 获取表关系
    const relationships = await prisma.tableRelationship.findMany({
      where: {
        OR: [
          { fromTable: { projectId } },
          { toTable: { projectId } }
        ]
      },
      include: {
        fromTable: { select: { id: true, name: true } },
        toTable: { select: { id: true, name: true } }
      }
    })

    // 获取已保存的布局配置
    const savedLayout = await prisma.mindmapLayout.findUnique({
      where: { projectId }
    })

    res.json({
      success: true,
      data: {
        project,
        tables,
        relationships,
        savedLayout: savedLayout?.layoutData || null
      }
    })
  })
)

// 保存mindmap布局
router.post(
  '/:projectId/layout',
  validateParams(projectParamsSchema),
  validateBody(mindmapLayoutSchema.omit({ projectId: true })),
  asyncHandler(async (req, res) => {
    const { projectId } = req.params
    const { nodes, edges, config } = req.body

    // 检查项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      throw new AppError('Project not found', 404)
    }

    // 保存或更新布局
    const layoutData = {
      nodes,
      edges,
      config,
      updatedAt: new Date()
    }

    const savedLayout = await prisma.mindmapLayout.upsert({
      where: { projectId },
      update: { 
        layoutData,
        updatedAt: new Date()
      },
      create: {
        projectId,
        layoutData,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    res.json({
      success: true,
      data: { savedLayout }
    })
  })
)

// 获取保存的布局
router.get(
  '/:projectId/layout',
  validateParams(projectParamsSchema),
  asyncHandler(async (req, res) => {
    const { projectId } = req.params

    const savedLayout = await prisma.mindmapLayout.findUnique({
      where: { projectId }
    })

    if (!savedLayout) {
      throw new AppError('Layout not found', 404)
    }

    res.json({
      success: true,
      data: { layout: savedLayout.layoutData }
    })
  })
)

// 删除保存的布局
router.delete(
  '/:projectId/layout',
  validateParams(projectParamsSchema),
  asyncHandler(async (req, res) => {
    const { projectId } = req.params

    await prisma.mindmapLayout.delete({
      where: { projectId }
    })

    res.status(204).send()
  })
)

// 获取项目的表关系统计
router.get(
  '/:projectId/stats',
  validateParams(projectParamsSchema),
  asyncHandler(async (req, res) => {
    const { projectId } = req.params

    // 统计各种关系类型的数量
    const [
      tableCount,
      fieldCount,
      indexCount,
      relationshipCount,
      categoryCount
    ] = await Promise.all([
      prisma.databaseTable.count({ where: { projectId } }),
      prisma.databaseField.count({ 
        where: { table: { projectId } } 
      }),
      prisma.databaseIndex.count({ 
        where: { table: { projectId } } 
      }),
      prisma.tableRelationship.count({
        where: {
          OR: [
            { fromTable: { projectId } },
            { toTable: { projectId } }
          ]
        }
      }),
      prisma.databaseTable.groupBy({
        by: ['category'],
        where: { 
          projectId,
          category: { not: null }
        },
        _count: true
      })
    ])

    // 按状态统计表数量
    const tablesByStatus = await prisma.databaseTable.groupBy({
      by: ['status'],
      where: { projectId },
      _count: true
    })

    // 按关系类型统计
    const relationshipsByType = await prisma.tableRelationship.groupBy({
      by: ['relationshipType'],
      where: {
        OR: [
          { fromTable: { projectId } },
          { toTable: { projectId } }
        ]
      },
      _count: true
    })

    res.json({
      success: true,
      data: {
        summary: {
          tableCount,
          fieldCount,
          indexCount,
          relationshipCount,
          categoryCount: categoryCount.length
        },
        tablesByStatus: tablesByStatus.reduce((acc, item) => {
          acc[item.status] = item._count
          return acc
        }, {} as Record<string, number>),
        relationshipsByType: relationshipsByType.reduce((acc, item) => {
          acc[item.relationshipType] = item._count
          return acc
        }, {} as Record<string, number>),
        categories: categoryCount.map(item => ({
          name: item.category,
          count: item._count
        }))
      }
    })
  })
)

export { router as mindmapRouter }