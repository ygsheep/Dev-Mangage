import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { createAPISchema, updateAPISchema } from '../utils/validation'

const router = Router()
const prisma = new PrismaClient()

// 获取API列表
router.get('/', async (req, res) => {
  try {
    const { projectId, method, status, search } = req.query
    
    const apis = await prisma.aPI.findMany({
      where: {
        ...(projectId && { projectId: projectId as string }),
        ...(method && { method: method as any }),
        ...(status && { status: status as any }),
        ...(search && {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' } },
            { description: { contains: search as string, mode: 'insensitive' } },
            { path: { contains: search as string, mode: 'insensitive' } }
          ]
        })
      },
      include: {
        project: { select: { name: true } },
        apiTags: {
          include: { tag: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })
    
    res.json(apis)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch APIs' })
  }
})

export default router