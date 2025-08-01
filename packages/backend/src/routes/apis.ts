import { Router } from 'express'
import { z } from 'zod'
import { APIStatus, HTTPMethod } from '@devapi/shared'
import { prisma } from '../database'
import { asyncHandler, AppError } from '../middleware/errorHandler'
import { validateBody, validateParams, validateQuery } from '../middleware/validation'

const router = Router()

// Validation schemas
const createAPISchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(100),
  method: z.nativeEnum(HTTPMethod),
  path: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  parameters: z.any().optional(),
  responses: z.any().optional(),
  status: z.nativeEnum(APIStatus).default(APIStatus.NOT_STARTED),
  frontendCode: z.string().optional(),
  backendCode: z.string().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
})

const updateAPISchema = createAPISchema.partial()

const apiParamsSchema = z.object({
  id: z.string().uuid(),
})

const apiQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  status: z.nativeEnum(APIStatus).optional(),
  method: z.nativeEnum(HTTPMethod).optional(),
  search: z.string().optional(),
  tagIds: z.string().optional().transform((val) => val ? val.split(',') : undefined),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

// Get all APIs
router.get(
  '/',
  validateQuery(apiQuerySchema),
  asyncHandler(async (req, res) => {
    const { projectId, status, method, search, tagIds, page, limit } = req.query as any

    const where = {
      ...(projectId && { projectId }),
      ...(status && { status }),
      ...(method && { method }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { description: { contains: search } },
          { path: { contains: search } },
        ],
      }),
      ...(tagIds && {
        apiTags: {
          some: {
            tagId: { in: tagIds },
          },
        },
      }),
    }

    const [apis, total] = await Promise.all([
      prisma.aPI.findMany({
        where,
        include: {
          project: {
            select: { id: true, name: true },
          },
          apiTags: {
            include: { tag: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.aPI.count({ where }),
    ])

    res.json({
      success: true,
      data: {
        apis,
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

// Get API by ID
router.get(
  '/:id',
  validateParams(apiParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const api = await prisma.aPI.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true, description: true },
        },
        apiTags: {
          include: { tag: true },
        },
      },
    })

    if (!api) {
      throw new AppError('API not found', 404)
    }

    res.json({
      success: true,
      data: { api },
    })
  })
)

// Create API
router.post(
  '/',
  validateBody(createAPISchema),
  asyncHandler(async (req, res) => {
    const { tagIds, ...apiData } = req.body

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: apiData.projectId },
    })

    if (!project) {
      throw new AppError('Project not found', 404)
    }

    // Create API with tags
    const api = await prisma.aPI.create({
      data: {
        ...apiData,
        ...(tagIds && {
          apiTags: {
            create: tagIds.map((tagId: string) => ({ tagId })),
          },
        }),
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
        apiTags: {
          include: { tag: true },
        },
      },
    })

    res.status(201).json({
      success: true,
      data: { api },
    })
  })
)

// Update API
router.put(
  '/:id',
  validateParams(apiParamsSchema),
  validateBody(updateAPISchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { tagIds, ...updateData } = req.body

    // If updating tags, handle the relationship
    const api = await prisma.aPI.update({
      where: { id },
      data: {
        ...updateData,
        ...(tagIds && {
          apiTags: {
            deleteMany: {},
            create: tagIds.map((tagId: string) => ({ tagId })),
          },
        }),
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
        apiTags: {
          include: { tag: true },
        },
      },
    })

    res.json({
      success: true,
      data: { api },
    })
  })
)

// Delete API
router.delete(
  '/:id',
  validateParams(apiParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params

    await prisma.aPI.delete({
      where: { id },
    })

    res.status(204).send()
  })
)

// Update API status
router.patch(
  '/:id/status',
  validateParams(apiParamsSchema),
  validateBody(z.object({ status: z.nativeEnum(APIStatus) })),
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { status } = req.body

    const api = await prisma.aPI.update({
      where: { id },
      data: { status },
      include: {
        project: {
          select: { id: true, name: true },
        },
        apiTags: {
          include: { tag: true },
        },
      },
    })

    res.json({
      success: true,
      data: { api },
    })
  })
)

// Generate code for API
router.post(
  '/:id/generate-code',
  validateParams(apiParamsSchema),
  validateBody(z.object({ 
    type: z.enum(['frontend', 'backend', 'both']),
    framework: z.string().optional(),
  })),
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { type, framework = 'express' } = req.body

    const api = await prisma.aPI.findUnique({
      where: { id },
    })

    if (!api) {
      throw new AppError('API not found', 404)
    }

    // Generate code based on API definition
    const frontendCode = generateFrontendCode(api, framework)
    const backendCode = generateBackendCode(api, framework)

    const generatedCode = {
      ...(type === 'frontend' || type === 'both' ? { frontendCode } : {}),
      ...(type === 'backend' || type === 'both' ? { backendCode } : {}),
    }

    // Update API with generated code
    const updatedAPI = await prisma.aPI.update({
      where: { id },
      data: generatedCode,
    })

    res.json({
      success: true,
      data: { 
        api: updatedAPI,
        generatedCode,
      },
    })
  })
)

// Helper functions for code generation
function generateFrontendCode(api: any, framework: string): string {
  const baseUrl = 'http://localhost:3001/api/v1'
  const method = api.method.toLowerCase()
  
  return `// Generated ${method.toUpperCase()} request for ${api.name}
import axios from 'axios'

export const ${toCamelCase(api.name)} = async (${method === 'get' ? 'params?' : 'data?'}: any) => {
  try {
    const response = await axios.${method}(\`${baseUrl}${api.path}\`${method === 'get' ? ', { params }' : ', data'})
    return response.data
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}`
}

function generateBackendCode(api: any, framework: string): string {
  const method = api.method.toLowerCase()
  
  return `// Generated ${method.toUpperCase()} endpoint for ${api.name}
import { Router } from 'express'
const router = Router()

router.${method}('${api.path}', async (req, res) => {
  try {
    // TODO: Implement ${api.name} logic
    ${method === 'get' ? 'const data = {}' : 'const result = {}'}
    
    res.json({
      success: true,
      data: ${method === 'get' ? 'data' : 'result'}
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

export default router`
}

function toCamelCase(str: string): string {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
    return index === 0 ? word.toLowerCase() : word.toUpperCase()
  }).replace(/\s+/g, '')
}

export { router as apisRouter }