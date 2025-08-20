import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../database'
import { asyncHandler, AppError } from '../middleware/errorHandler'
import { validateBody, validateParams, validateQuery } from '../middleware/validation'

const router = Router()

// Validation schemas
const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).default('#3B82F6'),
  projectId: z.string().min(1),
})

const updateTagSchema = createTagSchema.partial().omit({ projectId: true })

const tagParamsSchema = z.object({
  id: z.string().uuid(),
})

const tagQuerySchema = z.object({
  projectId: z.string().min(1).optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
})

// Get all tags
router.get(
  '/',
  validateQuery(tagQuerySchema),
  asyncHandler(async (req, res) => {
    const { projectId, search, page, limit } = req.query as any

    const where = {
      ...(projectId && { projectId }),
      ...(search && {
        name: { contains: search },
      }),
    }

    const [tags, total] = await Promise.all([
      prisma.tag.findMany({
        where,
        include: {
          project: {
            select: { id: true, name: true },
          },
          _count: {
            select: { endpointTags: true },
          },
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.tag.count({ where }),
    ])

    res.json({
      success: true,
      data: {
        tags,
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

// Get tag by ID
router.get(
  '/:id',
  validateParams(tagParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true, description: true },
        },
        endpointTags: {
          include: {
            api: {
              select: { id: true, name: true, method: true, path: true, status: true },
            },
          },
        },
        _count: {
          select: { endpointTags: true },
        },
      },
    })

    if (!tag) {
      throw new AppError('Tag not found', 404)
    }

    res.json({
      success: true,
      data: { tag },
    })
  })
)

// Create tag
router.post(
  '/',
  validateBody(createTagSchema),
  asyncHandler(async (req, res) => {
    const tagData = req.body

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: tagData.projectId },
    })

    if (!project) {
      throw new AppError('Project not found', 404)
    }

    const tag = await prisma.tag.create({
      data: tagData,
      include: {
        project: {
          select: { id: true, name: true },
        },
        _count: {
          select: { endpointTags: true },
        },
      },
    })

    res.status(201).json({
      success: true,
      data: { tag },
    })
  })
)

// Update tag
router.put(
  '/:id',
  validateParams(tagParamsSchema),
  validateBody(updateTagSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const updateData = req.body

    const tag = await prisma.tag.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: { id: true, name: true },
        },
        _count: {
          select: { endpointTags: true },
        },
      },
    })

    res.json({
      success: true,
      data: { tag },
    })
  })
)

// Delete tag
router.delete(
  '/:id',
  validateParams(tagParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params

    await prisma.tag.delete({
      where: { id },
    })

    res.status(204).send()
  })
)

// Get tags by project
router.get(
  '/project/:projectId',
  validateParams(z.object({ projectId: z.string().min(1) })),
  asyncHandler(async (req, res) => {
    const { projectId } = req.params

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new AppError('Project not found', 404)
    }

    const tags = await prisma.tag.findMany({
      where: { projectId },
      include: {
        _count: {
          select: { endpointTags: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    res.json({
      success: true,
      data: { tags },
    })
  })
)

// Get popular tags (most used across all projects)
router.get(
  '/popular',
  validateQuery(z.object({
    limit: z.coerce.number().min(1).max(50).default(10),
  })),
  asyncHandler(async (req, res) => {
    const { limit } = req.query as any

    const tags = await prisma.tag.findMany({
      include: {
        project: {
          select: { id: true, name: true },
        },
        _count: {
          select: { endpointTags: true },
        },
      },
      orderBy: {
        endpointTags: {
          _count: 'desc',
        },
      },
      take: limit,
    })

    res.json({
      success: true,
      data: { tags },
    })
  })
)

// Bulk create tags
router.post(
  '/bulk',
  validateBody(z.object({
    projectId: z.string().min(1),
    tags: z.array(z.object({
      name: z.string().min(1).max(50),
      color: z.string().regex(/^#[0-9A-F]{6}$/i).default('#3B82F6'),
    })),
  })),
  asyncHandler(async (req, res) => {
    const { projectId, tags: tagData } = req.body

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new AppError('Project not found', 404)
    }

    const tags = await Promise.all(
      tagData.map((tag: any) =>
        prisma.tag.create({
          data: {
            ...tag,
            projectId,
          },
          include: {
            project: {
              select: { id: true, name: true },
            },
            _count: {
              select: { endpointTags: true },
            },
          },
        })
      )
    )

    res.status(201).json({
      success: true,
      data: { tags },
    })
  })
)

export { router as tagsRouter }