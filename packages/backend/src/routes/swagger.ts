import { Router } from 'express'
import { z } from 'zod'
import SwaggerParser from '@apidevtools/swagger-parser'
import { HTTPMethod, APIStatus } from '@devapi/shared'
import { prisma } from '../database'
import { asyncHandler, AppError } from '../middleware/errorHandler'
import { validateBody } from '../middleware/validation'

const router = Router()

// Validation schemas
const validateSwaggerSchema = z.object({
  url: z.string().url().optional(),
  content: z.string().optional(),
}).refine(data => data.url || data.content, {
  message: "Either 'url' or 'content' must be provided",
})

const importSwaggerSchema = z.object({
  projectId: z.string().min(1),
  url: z.string().url().optional(),
  content: z.string().optional(),
  options: z.object({
    overwriteExisting: z.boolean().default(false),
    createTags: z.boolean().default(true),
    defaultStatus: z.nativeEnum(APIStatus).default(APIStatus.NOT_STARTED),
  }).optional(),
}).refine(data => data.url || data.content, {
  message: "Either 'url' or 'content' must be provided",
})

// Validate Swagger document
router.post(
  '/validate',
  validateBody(validateSwaggerSchema),
  asyncHandler(async (req, res) => {
    const { url, content } = req.body

    try {
      let api
      if (url) {
        api = await SwaggerParser.validate(url)
      } else {
        api = await SwaggerParser.validate(JSON.parse(content))
      }

      const info = {
        title: api.info?.title || 'Untitled API',
        version: api.info?.version || '1.0.0',
        description: api.info?.description,
        endpoints: Object.keys(api.paths || {}).length,
        methods: getAvailableMethods(api),
        servers: api.servers || [],
      }

      res.json({
        success: true,
        data: {
          valid: true,
          info,
        },
      })
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid Swagger document',
          details: error.message,
        },
      })
    }
  })
)

// Import Swagger document
router.post(
  '/import',
  validateBody(importSwaggerSchema),
  asyncHandler(async (req, res) => {
    const { projectId, url, content, options = {} } = req.body

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new AppError('Project not found', 404)
    }

    try {
      let api
      if (url) {
        api = await SwaggerParser.validate(url)
      } else {
        api = await SwaggerParser.validate(JSON.parse(content))
      }

      const importResult = await importSwaggerToProject(api, projectId, options)

      res.json({
        success: true,
        data: importResult,
      })
    } catch (error: any) {
      throw new AppError(`Import failed: ${error.message}`, 400)
    }
  })
)

// Get import history
router.get(
  '/history/:projectId',
  asyncHandler(async (req, res) => {
    const { projectId } = req.params

    // This would typically be stored in a separate import_history table
    // For now, we'll return a mock response
    res.json({
      success: true,
      data: {
        imports: [],
        message: 'Import history feature coming soon',
      },
    })
  })
)

// Helper functions
function getAvailableMethods(api: any): string[] {
  const methods = new Set<string>()
  
  Object.values(api.paths || {}).forEach((pathItem: any) => {
    Object.keys(pathItem).forEach(method => {
      if (['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(method)) {
        methods.add(method.toUpperCase())
      }
    })
  })
  
  return Array.from(methods)
}

async function importSwaggerToProject(api: any, projectId: string, options: any) {
  const { overwriteExisting = false, createTags = true, defaultStatus = APIStatus.NOT_STARTED } = options
  
  const results = {
    imported: 0,
    skipped: 0,
    errors: 0,
    apiEndpoints: [] as any[],
    tags: [] as any[],
  }

  // Create tags from Swagger tags if enabled
  const tagMap = new Map<string, string>()
  if (createTags && api.tags) {
    for (const swaggerTag of api.tags) {
      try {
        const tag = await prisma.tag.create({
          data: {
            name: swaggerTag.name,
            color: generateRandomColor(),
            projectId,
          },
        })
        tagMap.set(swaggerTag.name, tag.id)
        results.tags.push(tag)
      } catch (error) {
        // Tag might already exist, try to find it
        const existingTag = await prisma.tag.findFirst({
          where: { name: swaggerTag.name, projectId },
        })
        if (existingTag) {
          tagMap.set(swaggerTag.name, existingTag.id)
        }
      }
    }
  }

  // Import endpoints
  for (const [path, pathItem] of Object.entries(api.paths || {})) {
    for (const [method, operation] of Object.entries(pathItem as any)) {
      if (!['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(method)) {
        continue
      }

      try {
        const op = operation as any
        const apiName = op.operationId || op.summary || `${method.toUpperCase()} ${path}`
        const httpMethod = method.toUpperCase() as HTTPMethod

        // Check if API already exists
        if (!overwriteExisting) {
          const existing = await prisma.aPIEndpoint.findFirst({
            where: {
              projectId,
              method: httpMethod,
              path,
            },
          })

          if (existing) {
            results.skipped++
            continue
          }
        }

        // Prepare API data - match APIEndpoint schema fields
        const apiData = {
          projectId,
          name: apiName,
          method: httpMethod,
          path,
          description: op.description || op.summary,
          summary: op.summary,
          // Note: parameters and responses are handled through separate tables in APIEndpoint model
          // status field doesn't exist in APIEndpoint, might use implementationStatus instead
          implementationStatus: defaultStatus || 'NOT_IMPLEMENTED',
        }

        // Create API
        const createdAPI = await prisma.aPIEndpoint.upsert({
          where: {
            id: `${projectId}_${httpMethod}_${path}`, // Use a simple unique identifier
          },
          create: apiData,
          update: overwriteExisting ? apiData : {},
          include: {
            // Note: APIEndpoint doesn't have endpointTags relation, it may have a different relation
          },
        })

        // Add tags to API
        if (op.tags && createTags) {
          const tagIds = op.tags
            .map((tagName: string) => tagMap.get(tagName))
            .filter(Boolean)

          if (tagIds.length > 0) {
            await prisma.aPIEndpoint.update({
              where: { id: createdAPI.id },
              data: {
                // Note: APIEndpoint model doesn't have endpointTags relation
                // Tags might need to be handled differently or stored in the tags field as JSON
                tags: JSON.stringify(tagIds),
              },
            })
          }
        }

        results.apiEndpoints.push(createdAPI)
        results.imported++
      } catch (error) {
        console.error(`Error importing ${method.toUpperCase()} ${path}:`, error)
        results.errors++
      }
    }
  }

  return results
}

function generateRandomColor(): string {
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

export { router as swaggerRouter }