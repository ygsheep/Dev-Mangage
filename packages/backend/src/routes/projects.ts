/**
 * 项目管理路由模块
 * 提供项目的 CRUD 操作、统计信息查询和数据库表管理功能
 *
 * @author Dev-Manage Team
 * @version 1.0.0
 */

import { ProjectStatus } from '@devapi/shared'
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../database'
import { AppError, asyncHandler } from '../middleware/errorHandler'
import { validateBody, validateParams, validateQuery } from '../middleware/validation'

// 创建路由实例
const router = Router()

// ==================== 数据验证模式定义 ====================

/**
 * 创建项目的数据验证模式
 * 定义项目创建时必需和可选的字段及其验证规则
 */
const createProjectSchema = z.object({
  name: z.string().min(1).max(100), // 项目名称：1-100字符
  description: z.string().max(500).optional(), // 项目描述：最多500字符，可选
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.ACTIVE), // 项目状态：默认为活跃状态
})

/**
 * 更新项目的数据验证模式
 * 基于创建模式，所有字段都变为可选
 */
const updateProjectSchema = createProjectSchema.partial()

/**
 * 项目路径参数验证模式
 * 用于验证 URL 中的项目 ID 参数
 */
const projectParamsSchema = z.object({
  id: z.string().min(1), // 项目ID：非空字符串
})

/**
 * 项目查询参数验证模式
 * 用于验证列表查询的查询参数
 */
const projectQuerySchema = z.object({
  status: z.nativeEnum(ProjectStatus).optional(), // 状态筛选：可选
  search: z.string().optional(), // 搜索关键词：可选
  page: z.coerce.number().min(1).default(1), // 页码：最小为1，默认第1页
  limit: z.coerce.number().min(1).max(100).default(20), // 每页数量：1-100，默认20条
})

// ==================== 路由处理函数定义 ====================

/**
 * 获取项目列表
 * GET /api/projects
 *
 * 功能说明：
 * - 支持按状态筛选项目
 * - 支持按名称和描述搜索项目
 * - 支持分页查询
 * - 返回项目基本信息及统计数据
 *
 * 查询参数：
 * @param {ProjectStatus} [status] - 项目状态筛选
 * @param {string} [search] - 搜索关键词（匹配项目名称或描述）
 * @param {number} [page=1] - 页码
 * @param {number} [limit=20] - 每页数量
 *
 * 响应格式：
 * @returns {Object} 包含项目列表和分页信息的响应对象
 */
router.get(
  '/',
  validateQuery(projectQuerySchema),
  asyncHandler(async (req, res) => {
    // 从查询参数中提取筛选条件
    const { status, search, page, limit } = req.query as any

    // 构建数据库查询条件
    const where = {
      // 如果指定了状态，添加状态筛选
      ...(status && { status }),
      // 如果指定了搜索关键词，在名称和描述中搜索
      ...(search && {
        OR: [
          { name: { contains: search } }, // 在项目名称中搜索
          { description: { contains: search } }, // 在项目描述中搜索
        ],
      }),
    }

    // 并行执行查询和计数操作，提高性能
    const [projects, total] = await Promise.all([
      // 查询项目列表
      prisma.project.findMany({
        where,
        include: {
          _count: {
            select: {
              apiEndpoints: true, // 统计API端点数量
              tags: true, // 统计标签数量
            },
          },
        },
        orderBy: { updatedAt: 'desc' }, // 按更新时间倒序排列
        skip: (page - 1) * limit, // 分页偏移量
        take: limit, // 每页数量
      }),
      // 查询总数量（用于分页计算）
      prisma.project.count({ where }),
    ])

    // 返回成功响应
    res.json({
      success: true,
      data: {
        projects, // 项目列表
        pagination: {
          page, // 当前页码
          limit, // 每页数量
          total, // 总数量
          pages: Math.ceil(total / limit), // 总页数
        },
      },
    })
  })
)

/**
 * 根据ID获取项目详情
 * GET /api/projects/:id
 *
 * 功能说明：
 * - 获取指定项目的完整信息
 * - 包含关联的API端点列表
 * - 包含项目标签及其使用统计
 * - 包含项目的统计信息
 *
 * 路径参数：
 * @param {string} id - 项目唯一标识符
 *
 * 响应格式：
 * @returns {Object} 包含项目详细信息的响应对象
 *
 * 错误处理：
 * @throws {AppError} 404 - 项目不存在时抛出错误
 */
router.get(
  '/:id',
  validateParams(projectParamsSchema),
  asyncHandler(async (req, res) => {
    // 从路径参数中获取项目ID
    const { id } = req.params

    // 查询项目详细信息，包含所有关联数据
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        // 包含API端点信息
        apiEndpoints: {
          orderBy: { updatedAt: 'desc' }, // 按更新时间倒序排列
        },
        // 包含项目标签信息
        tags: {
          orderBy: { name: 'asc' }, // 按标签名称升序排列
        },
        // 包含项目统计信息
        _count: {
          select: {
            apiEndpoints: true, // API端点总数
            tags: true, // 标签总数
          },
        },
      },
    })

    // 检查项目是否存在
    if (!project) {
      throw new AppError('Project not found', 404)
    }

    // 返回项目详细信息
    res.json({
      success: true,
      data: { project },
    })
  })
)

/**
 * 创建新项目
 * POST /api/projects
 *
 * 功能说明：
 * - 创建一个新的项目记录
 * - 自动设置创建时间和更新时间
 * - 返回创建的项目信息及统计数据
 *
 * 请求体：
 * @param {string} name - 项目名称（必需，1-100字符）
 * @param {string} [description] - 项目描述（可选，最多500字符）
 * @param {ProjectStatus} [status] - 项目状态（可选，默认为ACTIVE）
 *
 * 响应格式：
 * @returns {Object} 包含新创建项目信息的响应对象
 */
router.post(
  '/',
  validateBody(createProjectSchema),
  asyncHandler(async (req, res) => {
    // 从请求体中获取项目数据
    const projectData = req.body

    // 创建新项目记录
    const project = await prisma.project.create({
      data: projectData,
      include: {
        _count: {
          select: {
            apiEndpoints: true, // 统计API端点数量（新项目为0）
            tags: true, // 统计标签数量（新项目为0）
          },
        },
      },
    })

    // 返回创建成功响应（HTTP 201）
    res.status(201).json({
      success: true,
      data: { project },
    })
  })
)

/**
 * 更新项目信息
 * PUT /api/projects/:id
 *
 * 功能说明：
 * - 更新指定项目的信息
 * - 支持部分字段更新
 * - 自动更新修改时间
 * - 返回更新后的项目信息
 *
 * 路径参数：
 * @param {string} id - 项目唯一标识符
 *
 * 请求体：
 * @param {string} [name] - 项目名称（可选，1-100字符）
 * @param {string} [description] - 项目描述（可选，最多500字符）
 * @param {ProjectStatus} [status] - 项目状态（可选）
 *
 * 响应格式：
 * @returns {Object} 包含更新后项目信息的响应对象
 *
 * 错误处理：
 * @throws {AppError} 404 - 项目不存在时由Prisma自动抛出错误
 */
router.put(
  '/:id',
  validateParams(projectParamsSchema),
  validateBody(updateProjectSchema),
  asyncHandler(async (req, res) => {
    // 从路径参数中获取项目ID
    const { id } = req.params
    // 从请求体中获取更新数据
    const updateData = req.body

    // 更新项目信息
    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            apiEndpoints: true, // 统计API端点数量
            tags: true, // 统计标签数量
          },
        },
      },
    })

    // 返回更新成功响应
    res.json({
      success: true,
      data: { project },
    })
  })
)

/**
 * 删除项目
 * DELETE /api/projects/:id
 *
 * 功能说明：
 * - 删除指定的项目记录
 * - 会级联删除相关的API端点、标签等关联数据
 * - 删除成功后返回空响应体
 *
 * 路径参数：
 * @param {string} id - 项目唯一标识符
 *
 * 响应格式：
 * @returns {void} HTTP 204 No Content - 删除成功，无响应体
 *
 * 错误处理：
 * @throws {AppError} 404 - 项目不存在时由Prisma自动抛出错误
 */
router.delete(
  '/:id',
  validateParams(projectParamsSchema),
  asyncHandler(async (req, res) => {
    // 从路径参数中获取项目ID
    const { id } = req.params

    // 删除项目记录（会自动级联删除相关数据）
    await prisma.project.delete({
      where: { id },
    })

    // 返回删除成功响应（HTTP 204）
    res.status(204).send()
  })
)

/**
 * 获取项目统计信息
 * GET /api/projects/:id/stats
 *
 * 功能说明：
 * - 获取指定项目的详细统计信息
 * - 包含API端点总数、标签总数
 * - 包含API端点按状态分组的统计数据
 *
 * 路径参数：
 * @param {string} id - 项目唯一标识符
 *
 * 响应格式：
 * @returns {Object} 包含项目统计信息的响应对象
 * - totalAPIEndpoints: API端点总数
 * - totalTags: 标签总数
 * - statusCounts: 按状态分组的API端点数量统计
 *
 * 错误处理：
 * @throws {AppError} 404 - 项目不存在时抛出错误
 */
router.get(
  '/:id/stats',
  validateParams(projectParamsSchema),
  asyncHandler(async (req, res) => {
    // 从路径参数中获取项目ID
    const { id } = req.params

    // 查询项目及其API端点状态信息
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        apiEndpoints: {
          select: { status: true }, // 只获取状态字段用于统计
        },
        _count: {
          select: {
            apiEndpoints: true, // 统计API端点总数
            tags: true, // 统计标签总数
          },
        },
      },
    })

    // 检查项目是否存在
    if (!project) {
      throw new AppError('Project not found', 404)
    }

    // 统计各状态的API端点数量
    const statusCounts = project.apiEndpoints.reduce(
      (acc, api) => {
        acc[api.status] = (acc[api.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    // 返回统计信息
    res.json({
      success: true,
      data: {
        totalAPIEndpoints: project._count.apiEndpoints, // API端点总数
        totalTags: project._count.tags, // 标签总数
        statusCounts, // 按状态分组的统计
      },
    })
  })
)

/**
 * 获取项目数据库表列表
 * GET /api/projects/:id/database-tables
 *
 * 功能说明：
 * - 获取指定项目的所有数据库表信息
 * - 包含表字段详细信息及其关联关系
 * - 包含表索引信息
 * - 包含表的统计信息（字段数、索引数、关联数）
 *
 * 路径参数：
 * @param {string} id - 项目唯一标识符
 *
 * 响应格式：
 * @returns {Object} 包含数据库表列表的响应对象
 * - tables: 数据库表数组，每个表包含：
 *   - 基本信息（id, name, description等）
 *   - fields: 字段列表（按sortOrder排序）
 *   - indexes: 索引列表
 *   - _count: 统计信息（字段数、索引数、关联数）
 *
 * 错误处理：
 * @throws {AppError} 404 - 项目不存在时抛出错误
 */
router.get(
  '/:id/database-tables',
  validateParams(projectParamsSchema),
  asyncHandler(async (req, res) => {
    // 从路径参数中获取项目ID
    const { id } = req.params

    // 首先验证项目是否存在
    const project = await prisma.project.findUnique({
      where: { id },
      select: { id: true }, // 只需要验证存在性，不需要完整数据
    })

    // 检查项目是否存在
    if (!project) {
      throw new AppError('Project not found', 404)
    }

    // 查询项目的所有数据库表及其详细信息
    const tables = await prisma.databaseTable.findMany({
      where: { projectId: id },
      include: {
        // 包含表字段信息
        fields: {
          orderBy: { sortOrder: 'asc' }, // 按字段排序顺序排列
          include: {
            // 包含字段的外键关联信息
            referencedTable: { select: { id: true, name: true } }, // 关联的表信息
            referencedField: { select: { id: true, name: true } }, // 关联的字段信息
          },
        },
        // 包含表索引信息
        indexes: true,
        // 包含统计信息
        _count: {
          select: {
            fields: true, // 字段总数
            indexes: true, // 索引总数
            fromRelations: true, // 作为源表的关联数
            toRelations: true, // 作为目标表的关联数
          },
        },
      },
      orderBy: { updatedAt: 'desc' }, // 按更新时间倒序排列
    })

    // 返回数据库表列表
    res.json({
      success: true,
      data: { tables },
    })
  })
)

// 导出路由模块
export { router as projectsRouter }
