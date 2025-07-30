import { Router } from 'express'
import { z } from 'zod'
import { ProjectStatus } from '@devapi/shared'
import { prisma } from '../database'
import { asyncHandler, AppError } from '../middleware/errorHandler'
import { validateBody, validateParams, validateQuery } from '../middleware/validation'

const router = Router()

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.ACTIVE),
})

const updateProjectSchema = createProjectSchema.partial()

const projectParamsSchema = z.object({
  id: z.string().uuid(),
})

const projectQuerySchema = z.object({
  status: z.nativeEnum(ProjectStatus).optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

// Get all projects
router.get(
  '/',
  validateQuery(projectQuerySchema),
  asyncHandler(async (req, res) => {
    const { status, search, page, limit } = req.query as any

    const where = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          _count: {
            select: { apis: true, tags: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.project.count({ where }),
    ])

    res.json({
      success: true,
      data: {
        projects,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  })
)

// Get project by ID
router.get(
  '/:id',
  validateParams(projectParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        apis: {
          include: {
            apiTags: {
              include: { tag: true },
            },
          },
          orderBy: { updatedAt: 'desc' },
        },
        tags: {
          include: {
            _count: {
              select: { apiTags: true },
            },
          },
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { apis: true, tags: true },
        },
      },
    })

    if (!project) {
      throw new AppError('Project not found', 404)
    }

    res.json({
      success: true,
      data: { project },
    })
  })
)

// Create project
router.post(
  '/',
  validateBody(createProjectSchema),
  asyncHandler(async (req, res) => {
    const projectData = req.body

    const project = await prisma.project.create({
      data: projectData,
      include: {
        _count: {
          select: { apis: true, tags: true },
        },
      },
    })

    res.status(201).json({
      success: true,
      data: { project },
    })
  })
)

// Update project
router.put(
  '/:id',
  validateParams(projectParamsSchema),
  validateBody(updateProjectSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const updateData = req.body

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { apis: true, tags: true },
        },
      },
    })

    res.json({
      success: true,
      data: { project },
    })
  })
)

// Delete project
router.delete(
  '/:id',
  validateParams(projectParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params

    await prisma.project.delete({
      where: { id },
    })

    res.status(204).send()
  })
)

// Get project statistics
router.get(
  '/:id/stats',
  validateParams(projectParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        apis: {
          select: { status: true },
        },
        _count: {
          select: { apis: true, tags: true },
        },
      },
    })

    if (!project) {
      throw new AppError('Project not found', 404)
    }

    const statusCounts = project.apis.reduce((acc, api) => {
      acc[api.status] = (acc[api.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    res.json({
      success: true,
      data: {
        totalAPIs: project._count.apis,
        totalTags: project._count.tags,
        statusCounts,
      },
    })
  })
)

export { router as projectsRouter }