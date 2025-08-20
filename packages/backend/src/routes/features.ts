import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../middleware/errorHandler'
import { validateBody, validateParams, validateQuery } from '../middleware/validation'
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'

const router = Router()

// Validation schemas
const projectParamsSchema = z.object({
  projectId: z.string().min(1),
})

const moduleParamsSchema = z.object({
  projectId: z.string().min(1),
  moduleId: z.string().min(1),
})

const moduleQuerySchema = z.object({
  status: z.enum(['planned', 'in-progress', 'completed']).optional(),
  search: z.string().optional(),
})

const createModuleSchema = z.object({
  name: z.string().min(1).max(100),
  displayName: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  category: z.string().optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  tags: z.array(z.string()).optional(),
  techStack: z.array(z.string()).optional(),
  estimatedHours: z.number().min(0).optional(),
  assigneeId: z.string().optional(),
  assigneeName: z.string().optional(),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
})

const updateModuleSchema = createModuleSchema.partial().extend({
  status: z.enum(['planned', 'in-progress', 'completed', 'deprecated']).optional(),
  progress: z.number().min(0).max(100).optional(),
  actualHours: z.number().min(0).optional(),
  completedAt: z.string().datetime().optional(),
})

/**
 * 获取项目功能模块
 */
router.get('/:projectId/modules',
  validateParams(projectParamsSchema),
  validateQuery(moduleQuerySchema),
  asyncHandler(async (req, res) => {
    const { projectId } = req.params
    const { status, search } = req.query as any

    // 验证项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      throw new AppError('项目不存在', 404)
    }

    // 构建查询条件
    const where: any = {
      projectId,
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ]
    }

    // 查询功能模块
    const modules = await prisma.featureModule.findMany({
      where,
      include: {
        endpoints: {
          select: {
            id: true,
            name: true,
            method: true,
            path: true,
            status: true,
          }
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          }
        },
        _count: {
          select: {
            endpoints: true,
            tasks: true,
            documents: true,
          }
        }
      },
      orderBy: [
        { sortOrder: 'asc' },
        { updatedAt: 'desc' }
      ]
    })

    // 计算统计信息
    const allModules = await prisma.featureModule.findMany({
      where: { projectId },
      select: { status: true }
    })

    const summary = {
      planned: allModules.filter(m => m.status === 'planned').length,
      inProgress: allModules.filter(m => m.status === 'in-progress').length,
      completed: allModules.filter(m => m.status === 'completed').length,
      total: allModules.length,
    }

    // 转换数据格式以保持API兼容性
    const formattedModules = modules.map(module => ({
      id: module.id,
      projectId: module.projectId,
      name: module.name,
      displayName: module.displayName || module.name,
      description: module.description,
      status: module.status,
      category: module.category,
      priority: module.priority,
      progress: module.progress,
      tags: module.tags ? JSON.parse(module.tags) : [],
      techStack: module.techStack ? JSON.parse(module.techStack) : [],
      estimatedHours: module.estimatedHours,
      actualHours: module.actualHours,
      assigneeId: module.assigneeId,
      assigneeName: module.assigneeName,
      startDate: module.startDate,
      dueDate: module.dueDate,
      completedAt: module.completedAt,
      createdAt: module.createdAt.toISOString(),
      updatedAt: module.updatedAt.toISOString(),
      // 添加API端点信息以保持兼容性
      apiEndpoints: module.endpoints.map(endpoint => ({
        id: endpoint.id,
        name: endpoint.name,
        method: endpoint.method,
        path: endpoint.path,
        status: endpoint.status,
      })),
      // 统计信息
      stats: {
        totalEndpoints: module._count.endpoints,
        totalTasks: module._count.tasks,
        totalDocuments: module._count.documents,
        completedTasks: module.tasks.filter(t => t.status === 'COMPLETED').length,
      }
    }))

    res.json({
      success: true,
      data: {
        modules: formattedModules,
        total: formattedModules.length,
        summary
      },
      message: '功能模块获取成功'
    })
  })
)

/**
 * 获取功能模块详情
 */
router.get('/:projectId/modules/:moduleId',
  validateParams(moduleParamsSchema),
  asyncHandler(async (req, res) => {
    const { projectId, moduleId } = req.params

    const module = await prisma.featureModule.findFirst({
      where: {
        id: moduleId,
        projectId
      },
      include: {
        endpoints: {
          include: {
            endpoint: {
              select: {
                id: true,
                name: true,
                method: true,
                path: true,
                status: true,
                description: true,
              }
            }
          }
        },
        tables: {
          include: {
            table: {
              select: {
                id: true,
                name: true,
                displayName: true,
                status: true,
                comment: true,
              }
            }
          }
        },
        tasks: {
          orderBy: { sortOrder: 'asc' }
        },
        dependencies_from: {
          include: {
            toModule: {
              select: {
                id: true,
                name: true,
                status: true,
              }
            }
          }
        },
        dependencies_to: {
          include: {
            fromModule: {
              select: {
                id: true,
                name: true,
                status: true,
              }
            }
          }
        },
        documents: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    if (!module) {
      throw new AppError('功能模块不存在', 404)
    }

    // 格式化详细信息
    const moduleDetails = {
      id: module.id,
      projectId: module.projectId,
      name: module.name,
      displayName: module.displayName || module.name,
      description: module.description,
      status: module.status,
      category: module.category,
      priority: module.priority,
      progress: module.progress,
      tags: module.tags ? JSON.parse(module.tags) : [],
      techStack: module.techStack ? JSON.parse(module.techStack) : [],
      estimatedHours: module.estimatedHours,
      actualHours: module.actualHours,
      assigneeId: module.assigneeId,
      assigneeName: module.assigneeName,
      ownerId: module.ownerId,
      ownerName: module.ownerName,
      startDate: module.startDate,
      dueDate: module.dueDate,
      completedAt: module.completedAt,
      createdAt: module.createdAt.toISOString(),
      updatedAt: module.updatedAt.toISOString(),

      // API端点
      apiEndpoints: module.endpoints.map(ep => ({
        id: ep.id,
        moduleId: ep.moduleId,
        endpointId: ep.endpointId,
        name: ep.name,
        method: ep.method,
        path: ep.path,
        description: ep.description,
        status: ep.status,
        priority: ep.priority,
        // 如果关联了实际的API端点，包含其信息
        ...(ep.endpoint && {
          linkedEndpoint: ep.endpoint
        })
      })),

      // 数据库表
      databaseTables: module.tables.map(t => ({
        id: t.id,
        moduleId: t.moduleId,
        tableId: t.tableId,
        name: t.name,
        description: t.description,
        status: t.status,
        purpose: t.purpose,
        // 如果关联了实际的数据库表，包含其信息
        ...(t.table && {
          linkedTable: t.table
        })
      })),

      // 开发任务
      tasks: module.tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        type: task.type,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assigneeId,
        assigneeName: task.assigneeName,
        estimatedHours: task.estimatedHours,
        actualHours: task.actualHours,
        startDate: task.startDate,
        dueDate: task.dueDate,
        completedAt: task.completedAt,
        tags: task.tags ? JSON.parse(task.tags) : [],
        labels: task.labels ? JSON.parse(task.labels) : [],
        dependsOn: task.dependsOn ? JSON.parse(task.dependsOn) : [],
        blockedBy: task.blockedBy ? JSON.parse(task.blockedBy) : [],
      })),

      // 依赖关系
      dependencies: {
        requires: module.dependencies_from.map(dep => ({
          id: dep.id,
          toModuleId: dep.toModuleId,
          module: dep.toModule,
          dependencyType: dep.dependencyType,
          description: dep.description,
          isRequired: dep.isRequired,
          version: dep.version,
        })),
        requiredBy: module.dependencies_to.map(dep => ({
          id: dep.id,
          fromModuleId: dep.fromModuleId,
          module: dep.fromModule,
          dependencyType: dep.dependencyType,
          description: dep.description,
          isRequired: dep.isRequired,
          version: dep.version,
        }))
      },

      // 文档
      documents: module.documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        type: doc.type,
        format: doc.format,
        language: doc.language,
        version: doc.version,
        isPublic: doc.isPublic,
        createdBy: doc.createdBy,
        lastModifiedBy: doc.lastModifiedBy,
        reviewedBy: doc.reviewedBy,
        reviewedAt: doc.reviewedAt,
        approvedBy: doc.approvedBy,
        approvedAt: doc.approvedAt,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      }))
    }

    res.json({
      success: true,
      data: moduleDetails,
      message: '功能模块详情获取成功'
    })
  })
)

/**
 * 创建功能模块
 */
router.post('/:projectId/modules',
  validateParams(projectParamsSchema),
  validateBody(createModuleSchema),
  asyncHandler(async (req, res) => {
    const { projectId } = req.params
    const {
      name,
      displayName,
      description,
      category,
      priority,
      tags,
      techStack,
      estimatedHours,
      assigneeId,
      assigneeName,
      startDate,
      dueDate
    } = req.body

    // 验证项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      throw new AppError('项目不存在', 404)
    }

    // 检查模块名称是否重复
    const existingModule = await prisma.featureModule.findFirst({
      where: {
        projectId,
        name
      }
    })

    if (existingModule) {
      throw new AppError('模块名称已存在', 400)
    }

    // 创建功能模块
    const newModule = await prisma.featureModule.create({
      data: {
        projectId,
        name,
        displayName,
        description,
        category: category || '通用',
        priority,
        tags: tags ? JSON.stringify(tags) : null,
        techStack: techStack ? JSON.stringify(techStack) : null,
        estimatedHours,
        assigneeId,
        assigneeName,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdBy: 'system', // TODO: 从认证中获取用户ID
      },
      include: {
        _count: {
          select: {
            endpoints: true,
            tasks: true,
            documents: true,
          }
        }
      }
    })

    const formattedModule = {
      id: newModule.id,
      projectId: newModule.projectId,
      name: newModule.name,
      displayName: newModule.displayName || newModule.name,
      description: newModule.description,
      status: newModule.status,
      category: newModule.category,
      priority: newModule.priority,
      progress: newModule.progress,
      tags: newModule.tags ? JSON.parse(newModule.tags) : [],
      techStack: newModule.techStack ? JSON.parse(newModule.techStack) : [],
      estimatedHours: newModule.estimatedHours,
      actualHours: newModule.actualHours,
      assigneeId: newModule.assigneeId,
      assigneeName: newModule.assigneeName,
      startDate: newModule.startDate,
      dueDate: newModule.dueDate,
      completedAt: newModule.completedAt,
      createdAt: newModule.createdAt.toISOString(),
      updatedAt: newModule.updatedAt.toISOString(),
      apiEndpoints: [],
      stats: {
        totalEndpoints: newModule._count.endpoints,
        totalTasks: newModule._count.tasks,
        totalDocuments: newModule._count.documents,
        completedTasks: 0,
      }
    }

    res.status(201).json({
      success: true,
      data: formattedModule,
      message: '功能模块创建成功'
    })
  })
)

/**
 * 更新功能模块
 */
router.put('/:projectId/modules/:moduleId',
  validateParams(moduleParamsSchema),
  validateBody(updateModuleSchema),
  asyncHandler(async (req, res) => {
    const { projectId, moduleId } = req.params
    const updateData = req.body

    // 验证模块是否存在
    const existingModule = await prisma.featureModule.findFirst({
      where: {
        id: moduleId,
        projectId
      }
    })

    if (!existingModule) {
      throw new AppError('功能模块不存在', 404)
    }

    // 如果更新名称，检查是否重复
    if (updateData.name && updateData.name !== existingModule.name) {
      const duplicateModule = await prisma.featureModule.findFirst({
        where: {
          projectId,
          name: updateData.name,
          id: { not: moduleId }
        }
      })

      if (duplicateModule) {
        throw new AppError('模块名称已存在', 400)
      }
    }

    // 准备更新数据
    const updatePayload: any = {
      ...updateData,
      lastModifiedBy: 'system', // TODO: 从认证中获取用户ID
    }

    if (updateData.tags) {
      updatePayload.tags = JSON.stringify(updateData.tags)
    }

    if (updateData.techStack) {
      updatePayload.techStack = JSON.stringify(updateData.techStack)
    }

    if (updateData.startDate) {
      updatePayload.startDate = new Date(updateData.startDate)
    }

    if (updateData.dueDate) {
      updatePayload.dueDate = new Date(updateData.dueDate)
    }

    if (updateData.completedAt) {
      updatePayload.completedAt = new Date(updateData.completedAt)
    }

    // 如果状态变为completed，自动设置完成时间
    if (updateData.status === 'completed' && !updateData.completedAt) {
      updatePayload.completedAt = new Date()
      updatePayload.progress = 100
    }

    // 更新模块
    const updatedModule = await prisma.featureModule.update({
      where: { id: moduleId },
      data: updatePayload,
      include: {
        endpoints: {
          select: {
            id: true,
            name: true,
            method: true,
            path: true,
            status: true,
          }
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          }
        },
        _count: {
          select: {
            endpoints: true,
            tasks: true,
            documents: true,
          }
        }
      }
    })

    const formattedModule = {
      id: updatedModule.id,
      projectId: updatedModule.projectId,
      name: updatedModule.name,
      displayName: updatedModule.displayName || updatedModule.name,
      description: updatedModule.description,
      status: updatedModule.status,
      category: updatedModule.category,
      priority: updatedModule.priority,
      progress: updatedModule.progress,
      tags: updatedModule.tags ? JSON.parse(updatedModule.tags) : [],
      techStack: updatedModule.techStack ? JSON.parse(updatedModule.techStack) : [],
      estimatedHours: updatedModule.estimatedHours,
      actualHours: updatedModule.actualHours,
      assigneeId: updatedModule.assigneeId,
      assigneeName: updatedModule.assigneeName,
      startDate: updatedModule.startDate,
      dueDate: updatedModule.dueDate,
      completedAt: updatedModule.completedAt,
      createdAt: updatedModule.createdAt.toISOString(),
      updatedAt: updatedModule.updatedAt.toISOString(),
      apiEndpoints: updatedModule.endpoints.map(endpoint => ({
        id: endpoint.id,
        name: endpoint.name,
        method: endpoint.method,
        path: endpoint.path,
        status: endpoint.status,
      })),
      stats: {
        totalEndpoints: updatedModule._count.endpoints,
        totalTasks: updatedModule._count.tasks,
        totalDocuments: updatedModule._count.documents,
        completedTasks: updatedModule.tasks.filter(t => t.status === 'COMPLETED').length,
      }
    }

    res.json({
      success: true,
      data: formattedModule,
      message: '功能模块更新成功'
    })
  })
)

/**
 * 删除功能模块
 */
router.delete('/:projectId/modules/:moduleId',
  validateParams(moduleParamsSchema),
  asyncHandler(async (req, res) => {
    const { projectId, moduleId } = req.params

    // 验证模块是否存在
    const existingModule = await prisma.featureModule.findFirst({
      where: {
        id: moduleId,
        projectId
      }
    })

    if (!existingModule) {
      throw new AppError('功能模块不存在', 404)
    }

    // 删除模块（级联删除相关数据）
    await prisma.featureModule.delete({
      where: { id: moduleId }
    })

    res.json({
      success: true,
      message: '功能模块删除成功'
    })
  })
)

/**
 * 获取功能模块统计信息
 */
router.get('/:projectId/modules/stats',
  validateParams(projectParamsSchema),
  asyncHandler(async (req, res) => {
    const { projectId } = req.params

    // 验证项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      throw new AppError('项目不存在', 404)
    }

    // 获取统计数据
    const [
      totalModules,
      modulesByStatus,
      modulesByCategory,
      totalEndpoints,
      totalTasks,
      completedTasks
    ] = await Promise.all([
      // 总模块数
      prisma.featureModule.count({
        where: { projectId }
      }),
      // 按状态分组
      prisma.featureModule.groupBy({
        by: ['status'],
        where: { projectId },
        _count: { id: true }
      }),
      // 按分类分组
      prisma.featureModule.groupBy({
        by: ['category'],
        where: { projectId },
        _count: { id: true }
      }),
      // 总端点数
      prisma.moduleEndpoint.count({
        where: {
          module: { projectId }
        }
      }),
      // 总任务数
      prisma.moduleTask.count({
        where: {
          module: { projectId }
        }
      }),
      // 已完成任务数
      prisma.moduleTask.count({
        where: {
          module: { projectId },
          status: 'COMPLETED'
        }
      })
    ])

    // 构建统计对象
    const statusCounts = {
      planned: 0,
      'in-progress': 0,
      completed: 0,
      deprecated: 0,
    }

    modulesByStatus.forEach(group => {
      statusCounts[group.status as keyof typeof statusCounts] = group._count.id
    })

    const categoryCounts: Record<string, number> = {}
    modulesByCategory.forEach(group => {
      categoryCounts[group.category || '未分类'] = group._count.id
    })

    const completionRate = totalModules > 0 
      ? Math.round((statusCounts.completed / totalModules) * 100)
      : 0

    const stats = {
      totalModules,
      completedModules: statusCounts.completed,
      inProgressModules: statusCounts['in-progress'],
      plannedModules: statusCounts.planned,
      deprecatedModules: statusCounts.deprecated,
      totalApis: totalEndpoints,
      totalTasks,
      completedTasks,
      completionRate,
      taskCompletionRate: totalTasks > 0 
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0,
      categories: categoryCounts,
      statusDistribution: statusCounts
    }

    res.json({
      success: true,
      data: stats,
      message: '功能模块统计信息获取成功'
    })
  })
)

export { router as featuresRouter }