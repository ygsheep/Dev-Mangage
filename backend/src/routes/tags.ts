import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { createTagSchema, updateTagSchema } from '../utils/validation'

const router = Router()
const prisma = new PrismaClient()

// 获取标签列表
router.get('/', async (req, res) => {
  try {
    const { projectId, search } = req.query
    
    const tags = await prisma.tag.findMany({
      where: {
        ...(projectId && { projectId: projectId as string }),
        ...(search && {
          name: { contains: search as string, mode: 'insensitive' }
        })
      },
      include: {
        project: { select: { name: true } },
        _count: {
          select: { apiTags: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    res.json(tags)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tags' })
  }
})

export default router