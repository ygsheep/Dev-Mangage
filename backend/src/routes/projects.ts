import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { createProjectSchema, updateProjectSchema } from '../utils/validation'

const router = Router()
const prisma = new PrismaClient()

// 获取所有项目
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query
    
    const projects = await prisma.project.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(search && {
          OR: [
            { name: { contains: search as string } },
            { description: { contains: search as string } }
          ]
        })
      },
      include: {
        _count: {
          select: { apis: true, tags: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })
    
    res.json(projects)
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch projects' })
  }
})

// 获取单个项目
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        apis: {
          include: {
            apiTags: {
              include: { tag: true }
            }
          }
        },
        tags: true
      }
    })
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }
    
    res.json(project)
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch project' })
  }
})

// 创建项目
router.post('/', async (req, res) => {
  try {
    const { error, value } = createProjectSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }
    
    const project = await prisma.project.create({
      data: value,
      include: {
        _count: {
          select: { apis: true, tags: true }
        }
      }
    })
    
    res.status(201).json(project)
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to create project' })
  }
})

// 更新项目
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { error, value } = updateProjectSchema.validate(req.body)
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }
    
    const project = await prisma.project.update({
      where: { id },
      data: value,
      include: {
        _count: {
          select: { apis: true, tags: true }
        }
      }
    })
    
    res.json(project)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Project not found' })
    }
    return res.status(500).json({ error: 'Failed to update project' })
  }
})

// 删除项目
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    await prisma.project.delete({
      where: { id }
    })
    
    res.status(204).send()
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Project not found' })
    }
    return res.status(500).json({ error: 'Failed to delete project' })
  }
})

// 获取项目统计信息
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params
    
    const stats = await prisma.project.findUnique({
      where: { id },
      select: {
        _count: {
          select: { apis: true, tags: true }
        },
        apis: {
          select: { status: true }
        }
      }
    })
    
    if (!stats) {
      return res.status(404).json({ error: 'Project not found' })
    }
    
    // 计算API状态统计
    const statusCounts = stats.apis.reduce((acc, api) => {
      acc[api.status] = (acc[api.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    res.json({
      totalAPIs: stats._count.apis,
      totalTags: stats._count.tags,
      statusCounts
    })
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch project stats' })
  }
})

export default router