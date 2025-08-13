import { prisma } from '../database'
import Fuse from 'fuse.js'

// 搜索索引缓存
let projectsIndex: Fuse<any> | null = null
let apisIndex: Fuse<any> | null = null
let tagsIndex: Fuse<any> | null = null
let lastIndexUpdate = 0
const INDEX_CACHE_TTL = 5 * 60 * 1000 // 5分钟缓存

/**
 * MCP服务类
 * 提供搜索和数据检索功能
 */
export class MCPService {
  /**
   * 初始化搜索索引
   */
  async initializeSearchIndexes() {
    const now = Date.now()
    if (now - lastIndexUpdate < INDEX_CACHE_TTL && projectsIndex && apisIndex && tagsIndex) {
      return // 使用缓存的索引
    }

    const [projects, apis, tags] = await Promise.all([
      prisma.project.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          status: true,
        },
      }),
      prisma.aPI.findMany({
        select: {
          id: true,
          projectId: true,
          name: true,
          method: true,
          path: true,
          description: true,
          status: true,
        },
      }),
      prisma.tag.findMany({
        select: {
          id: true,
          name: true,
          color: true,
          projectId: true,
        },
      }),
    ])

    projectsIndex = new Fuse(projects, {
      keys: ['name', 'description'],
      threshold: 0.3,
    })

    apisIndex = new Fuse(apis, {
      keys: ['name', 'description', 'path', 'method'],
      threshold: 0.3,
    })

    tagsIndex = new Fuse(tags, {
      keys: ['name'],
      threshold: 0.3,
    })

    lastIndexUpdate = now
  }

  /**
   * 搜索项目
   */
  async searchProjects(query: string, limit: number = 10) {
    await this.initializeSearchIndexes()
    
    if (!projectsIndex) {
      throw new Error('项目搜索索引未初始化')
    }
    
    const results = projectsIndex.search(query, { limit })
    
    return {
      tool: 'search_projects',
      query,
      results: results.map(result => ({
        ...(result.item || {}),
        score: result.score
      })),
      total: results.length
    }
  }

  /**
   * 搜索API接口
   */
  async searchAPIs(query: string, options: {
    projectId?: string
    method?: string
    status?: string
    limit?: number
  } = {}) {
    const { projectId, method, status, limit = 10 } = options
    
    // 构建查询条件
    const where: any = {}
    if (projectId) where.projectId = projectId
    if (method) where.method = method
    if (status) where.status = status
    
    const apis = await prisma.aPI.findMany({
      where,
      select: {
        id: true,
        projectId: true,
        name: true,
        method: true,
        path: true,
        description: true,
        status: true,
        project: {
          select: {
            name: true,
          },
        },
      },
    })
    
    // 使用Fuse进行模糊搜索
    const fuseIndex = new Fuse(apis, {
      keys: ['name', 'description', 'path', 'method'],
      threshold: 0.3,
    })
    
    const results = fuseIndex.search(query, { limit })
    
    return {
      tool: 'search_apis',
      query,
      projectId,
      method,
      status,
      results: results.map(result => ({
        ...(result.item || {}),
        score: result.score
      })),
      total: results.length
    }
  }

  /**
   * 搜索标签
   */
  async searchTags(query: string, options: {
    projectId?: string
    limit?: number
  } = {}) {
    const { projectId, limit = 10 } = options
    
    const where: any = {}
    if (projectId) where.projectId = projectId
    
    const tags = await prisma.tag.findMany({
      where,
      select: {
        id: true,
        name: true,
        color: true,
        projectId: true,
        project: {
          select: {
            name: true,
          },
        },
      },
    })
    
    const fuseIndex = new Fuse(tags, {
      keys: ['name'],
      threshold: 0.3,
    })
    
    const results = fuseIndex.search(query, { limit })
    
    return {
      tool: 'search_tags',
      query,
      projectId,
      results: results.map(result => ({
        ...(result.item || {}),
        score: result.score
      })),
      total: results.length
    }
  }

  /**
   * 全局搜索
   */
  async globalSearch(query: string, options: {
    types?: string[]
    limit?: number
  } = {}) {
    const { types = ['projects', 'apis', 'tags'], limit = 5 } = options
    await this.initializeSearchIndexes()
    
    const results: any = {
      tool: 'global_search',
      query,
      types,
      data: {}
    }

    if (types.includes('projects') && projectsIndex) {
      const projectResults = projectsIndex.search(query, { limit })
      results.data.projects = projectResults.map(r => ({ 
        type: 'project',
        ...r.item, 
        score: r.score 
      }))
    }

    if (types.includes('apis') && apisIndex) {
      const apiResults = apisIndex.search(query, { limit })
      results.data.apis = apiResults.map(r => ({ 
        type: 'api',
        ...r.item, 
        score: r.score 
      }))
    }

    if (types.includes('tags') && tagsIndex) {
      const tagResults = tagsIndex.search(query, { limit })
      results.data.tags = tagResults.map(r => ({ 
        type: 'tag',
        ...r.item, 
        score: r.score 
      }))
    }

    // 合并所有结果并按分数排序
    const allResults: any[] = []
    Object.values(results.data).forEach((categoryResults: any) => {
      if (Array.isArray(categoryResults)) {
        allResults.push(...categoryResults)
      }
    })
    
    allResults.sort((a, b) => (a.score || 0) - (b.score || 0))
    
    return {
      ...results,
      results: allResults.slice(0, limit * types.length),
      total: allResults.length
    }
  }

  /**
   * 获取搜索建议
   */
  async getSearchSuggestions(query: string, limit: number = 5) {
    // 获取项目、API和标签名称作为搜索建议
    const [projects, apis, tags] = await Promise.all([
      prisma.project.findMany({
        select: { name: true },
        where: {
          name: {
            contains: query,
          },
        },
        take: limit,
      }),
      prisma.aPI.findMany({
        select: { name: true, path: true },
        where: {
          OR: [
            { name: { contains: query } },
            { path: { contains: query } },
          ],
        },
        take: limit,
      }),
      prisma.tag.findMany({
        select: { name: true },
        where: {
          name: {
            contains: query,
          },
        },
        take: limit,
      }),
    ])

    const suggestions = [
      ...projects.map(p => ({ type: 'project', text: p.name })),
      ...apis.map(a => ({ type: 'api', text: a.name, path: a.path })),
      ...tags.map(t => ({ type: 'tag', text: t.name })),
    ].slice(0, limit)

    return {
      tool: 'get_search_suggestions',
      query,
      suggestions,
      total: suggestions.length
    }
  }

  /**
   * 获取最近项目
   */
  async getRecentItems(limit: number = 10) {
    const [recentProjects, recentAPIs] = await Promise.all([
      prisma.project.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: Math.ceil(limit / 2),
      }),
      prisma.aPI.findMany({
        select: {
          id: true,
          name: true,
          method: true,
          path: true,
          updatedAt: true,
          project: {
            select: { name: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: Math.ceil(limit / 2),
      }),
    ])

    return {
      tool: 'get_recent_items',
      projects: recentProjects,
      apis: recentAPIs,
      total: recentProjects.length + recentAPIs.length
    }
  }

  /**
   * 刷新搜索索引
   */
  async refreshSearchIndex(force: boolean = false) {
    if (force) {
      lastIndexUpdate = 0 // 强制刷新
    }
    
    await this.initializeSearchIndexes()
    
    return {
      tool: 'refresh_search_index',
      status: 'success',
      timestamp: new Date().toISOString()
    }
  }

  /**
   * 获取可用工具列表
   */
  getToolsList() {
    return [
      {
        name: 'search_projects',
        description: '搜索项目',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: '搜索查询' },
            limit: { type: 'number', description: '结果数量限制', default: 10 }
          },
          required: ['query']
        }
      },
      {
        name: 'search_apis',
        description: '搜索API接口',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: '搜索查询' },
            method: { type: 'string', description: 'HTTP方法过滤' },
            projectId: { type: 'string', description: '项目ID过滤' },
            status: { type: 'string', description: '状态过滤' },
            limit: { type: 'number', description: '结果数量限制', default: 10 }
          },
          required: ['query']
        }
      },
      {
        name: 'search_tags',
        description: '搜索标签',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: '搜索查询' },
            projectId: { type: 'string', description: '项目ID过滤' },
            limit: { type: 'number', description: '结果数量限制', default: 10 }
          },
          required: ['query']
        }
      },
      {
        name: 'global_search',
        description: '全局搜索',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: '搜索查询' },
            types: { type: 'array', items: { type: 'string' }, description: '搜索类型' },
            limit: { type: 'number', description: '结果数量限制', default: 10 }
          },
          required: ['query']
        }
      },
      {
        name: 'get_search_suggestions',
        description: '获取搜索建议',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: '搜索查询前缀' },
            limit: { type: 'number', description: '返回建议数量限制', default: 5 }
          },
          required: ['query']
        }
      },
      {
        name: 'get_recent_items',
        description: '获取最近项目',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: '返回结果数量限制', default: 10 }
          }
        }
      },
      {
        name: 'refresh_search_index',
        description: '刷新搜索索引',
        inputSchema: {
          type: 'object',
          properties: {
            force: { type: 'boolean', description: '强制刷新索引', default: false }
          }
        }
      }
    ]
  }
}

// 导出单例实例
export const mcpService = new MCPService()