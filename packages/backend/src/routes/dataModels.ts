import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../database'
import { asyncHandler, AppError } from '../middleware/errorHandler'
import { validateBody, validateParams, validateQuery } from '../middleware/validation'

const router = Router()

// Validation schemas
const createTableSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(64),
  displayName: z.string().max(100).optional(),
  comment: z.string().max(500).optional(),
  engine: z.string().default('InnoDB'),
  charset: z.string().default('utf8mb4'),
  collation: z.string().default('utf8mb4_unicode_ci'),
  status: z.enum(['DRAFT', 'ACTIVE', 'DEPRECATED']).default('DRAFT'),
  category: z.string().max(50).optional(),
})

const updateTableSchema = createTableSchema.partial().omit({ projectId: true })

const createFieldSchema = z.object({
  tableId: z.string().uuid(),
  name: z.string().min(1).max(64),
  type: z.string(),
  length: z.number().int().positive().optional(),
  precision: z.number().int().positive().optional(),
  scale: z.number().int().min(0).optional(),
  nullable: z.boolean().default(true),
  defaultValue: z.string().optional(),
  comment: z.string().max(500).optional(),
  isPrimaryKey: z.boolean().default(false),
  isAutoIncrement: z.boolean().default(false),
  enumValues: z.array(z.string()).optional(),
  referencedTableId: z.string().uuid().optional(),
  referencedFieldId: z.string().uuid().optional(),
  sortOrder: z.number().int().min(0).default(0),
})

const updateFieldSchema = createFieldSchema.partial().omit({ tableId: true })

const createIndexSchema = z.object({
  tableId: z.string().uuid(),
  name: z.string().min(1).max(64),
  type: z.enum(['PRIMARY', 'UNIQUE', 'INDEX', 'FULLTEXT', 'FOREIGN']).default('INDEX'),
  fields: z.array(z.string()).min(1),
  isUnique: z.boolean().default(false),
  comment: z.string().max(500).optional(),
})

const updateIndexSchema = createIndexSchema.partial().omit({ tableId: true })

const createDocumentSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  content: z.string(),
  language: z.enum(['markdown', 'sql', 'json']).default('markdown'),
})

const tableParamsSchema = z.object({
  id: z.string().uuid(),
})

const fieldParamsSchema = z.object({
  id: z.string().uuid(),
})

const indexParamsSchema = z.object({
  id: z.string().uuid(),
})

const documentParamsSchema = z.object({
  id: z.string().uuid(),
})

const tableQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'DEPRECATED']).optional(),
  category: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

// Get all database tables
router.get(
  '/',
  validateQuery(tableQuerySchema),
  asyncHandler(async (req, res) => {
    const { projectId, status, category, page, limit } = req.query as any

    const where = {
      ...(projectId && { projectId }),
      ...(status && { status }),
      ...(category && { category }),
    }

    const [tables, total] = await Promise.all([
      prisma.databaseTable.findMany({
        where,
        include: {
          project: { select: { id: true, name: true } },
          fields: {
            orderBy: { sortOrder: 'asc' },
            include: {
              referencedTable: { select: { id: true, name: true } },
              referencedField: { select: { id: true, name: true } },
            },
          },
          indexes: true,
          _count: {
            select: { 
              fields: true, 
              indexes: true,
              fromRelations: true,
              toRelations: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.databaseTable.count({ where }),
    ])

    res.json({
      success: true,
      data: {
        tables,
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

// Get table by ID
router.get(
  '/:id',
  validateParams(tableParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const table = await prisma.databaseTable.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        fields: {
          orderBy: { sortOrder: 'asc' },
          include: {
            referencedTable: { select: { id: true, name: true } },
            referencedField: { select: { id: true, name: true } },
          },
        },
        indexes: true,
        fromRelations: {
          include: {
            toTable: { select: { id: true, name: true } },
          },
        },
        toRelations: {
          include: {
            fromTable: { select: { id: true, name: true } },
          },
        },
        _count: {
          select: { 
            fields: true, 
            indexes: true,
            fromRelations: true,
            toRelations: true,
          },
        },
      },
    })

    if (!table) {
      throw new AppError('Database table not found', 404)
    }

    res.json({
      success: true,
      data: { table },
    })
  })
)

// Create database table
router.post(
  '/',
  validateBody(createTableSchema),
  asyncHandler(async (req, res) => {
    const tableData = req.body

    const table = await prisma.databaseTable.create({
      data: tableData,
      include: {
        project: { select: { id: true, name: true } },
        _count: {
          select: { 
            fields: true, 
            indexes: true,
            fromRelations: true,
            toRelations: true,
          },
        },
      },
    })

    res.status(201).json({
      success: true,
      data: { table },
    })
  })
)

// Update database table
router.put(
  '/:id',
  validateParams(tableParamsSchema),
  validateBody(updateTableSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const updateData = req.body

    const table = await prisma.databaseTable.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true, name: true } },
        _count: {
          select: { 
            fields: true, 
            indexes: true,
            fromRelations: true,
            toRelations: true,
          },
        },
      },
    })

    res.json({
      success: true,
      data: { table },
    })
  })
)

// Delete database table
router.delete(
  '/:id',
  validateParams(tableParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params

    await prisma.databaseTable.delete({
      where: { id },
    })

    res.status(204).send()
  })
)

// Batch create database tables with fields and indexes
const createBatchTablesSchema = z.object({
  tables: z.array(
    createTableSchema.extend({
      fields: z.array(createFieldSchema.omit({ tableId: true })).optional(),
      indexes: z.array(createIndexSchema.omit({ tableId: true })).optional(),
    })
  ).min(1),
})

router.post(
  '/batch',
  validateBody(createBatchTablesSchema),
  asyncHandler(async (req, res) => {
    const { tables } = req.body
    
    const createdTables = []
    const errors = []
    
    for (const tableData of tables) {
      try {
        const { fields, indexes, ...tableInfo } = tableData
        
        // Create table first
        const table = await prisma.databaseTable.create({
          data: tableInfo,
        })
        
        // Create fields if provided
        if (fields && fields.length > 0) {
          await prisma.databaseField.createMany({
            data: fields.map((field, index) => ({
              ...field,
              tableId: table.id,
              sortOrder: field.sortOrder ?? index,
            })),
          })
        }
        
        // Create indexes if provided
        if (indexes && indexes.length > 0) {
          await prisma.databaseIndex.createMany({
            data: indexes.map(index => ({
              ...index,
              tableId: table.id,
            })),
          })
        }
        
        // Get complete table with relations
        const completeTable = await prisma.databaseTable.findUnique({
          where: { id: table.id },
          include: {
            project: { select: { id: true, name: true } },
            fields: {
              orderBy: { sortOrder: 'asc' },
            },
            indexes: true,
            _count: {
              select: { 
                fields: true, 
                indexes: true,
                fromRelations: true,
                toRelations: true,
              },
            },
          },
        })
        
        createdTables.push(completeTable)
      } catch (error: any) {
        errors.push({
          table: tableData,
          error: error.message
        })
      }
    }

    res.status(201).json({
      success: true,
      data: { 
        created: createdTables,
        total: tables.length,
        success: createdTables.length,
        failed: errors.length,
        errors
      },
    })
  })
)

export { router as dataModelsRouter }