#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError,
  Tool,
} from '@modelcontextprotocol/sdk/types.js'
import { PrismaClient } from '@prisma/client'
import Fuse from 'fuse.js'

const prisma = new PrismaClient()

// 搜索配置
const searchConfig = {
  projects: {
    keys: ['name', 'description'],
    threshold: 0.3,
    includeScore: true,
  },
  apis: {
    keys: ['name', 'description', 'path', 'method'],
    threshold: 0.3,
    includeScore: true,
  },
  tags: {
    keys: ['name'],
    threshold: 0.2,
    includeScore: true,
  }
}

// 搜索索引缓存
let searchIndexes = {
  projects: null as Fuse<any> | null,
  apis: null as Fuse<any> | null,
  tags: null as Fuse<any> | null,
}

// 索引更新时间
let lastIndexUpdate = 0
const INDEX_CACHE_TIME = 5 * 60 * 1000 // 5分钟缓存

class DevAPISearchServer {
  private server: Server

  constructor() {
    this.server = new Server(
      {
        name: 'devapi-search-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    )

    this.setupToolHandlers()
  }

  private setupToolHandlers() {
    // 列出可用工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'search_projects',
            description: '搜索项目',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: '搜索关键词'
                },
                limit: {
                  type: 'number',
                  description: '返回结果数量限制',
                  default: 10
                }
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
                query: {
                  type: 'string',
                  description: '搜索关键词'
                },
                projectId: {
                  type: 'string',
                  description: '项目ID（可选）'
                },
                method: {
                  type: 'string',
                  description: 'HTTP方法过滤'
                },
                status: {
                  type: 'string',
                  description: 'API状态过滤'
                },
                limit: {
                  type: 'number',
                  description: '返回结果数量限制',
                  default: 20
                }
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
                query: {
                  type: 'string',
                  description: '搜索关键词'
                },
                projectId: {
                  type: 'string',
                  description: '项目ID（可选）'
                },
                limit: {
                  type: 'number',
                  description: '返回结果数量限制',
                  default: 10
                }
              },
              required: ['query']
            }
          },
          {
            name: 'global_search',
            description: '全局搜索（项目、API、标签）',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: '搜索关键词'
                },
                types: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['projects', 'apis', 'tags']
                  },
                  description: '搜索类型限制',
                  default: ['projects', 'apis', 'tags']
                },
                limit: {
                  type: 'number',
                  description: '每种类型返回结果数量限制',
                  default: 5
                }
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
                query: {
                  type: 'string',
                  description: '部分输入的搜索词'
                },
                limit: {
                  type: 'number',
                  description: '建议数量限制',
                  default: 5
                }
              },
              required: ['query']
            }
          },
          {
            name: 'get_recent_items',
            description: '获取最近访问的项目和API',
            inputSchema: {
              type: 'object',
              properties: {
                limit: {
                  type: 'number',
                  description: '返回数量限制',
                  default: 10
                }
              }
            }
          },
          {
            name: 'refresh_search_index',
            description: '刷新搜索索引',
            inputSchema: {
              type: 'object',
              properties: {
                force: {
                  type: 'boolean',
                  description: '强制刷新',
                  default: false
                }
              }
            }
          }
        ] satisfies Tool[]
      }
    })

    // 处理工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        await this.updateSearchIndexIfNeeded()

        switch (request.params.name) {
          case 'search_projects':
            return await this.searchProjects(request.params.arguments)
          
          case 'search_apis':
            return await this.searchAPIs(request.params.arguments)
          
          case 'search_tags':
            return await this.searchTags(request.params.arguments)
          
          case 'global_search':
            return await this.globalSearch(request.params.arguments)
          
          case 'get_search_suggestions':
            return await this.getSearchSuggestions(request.params.arguments)
          
          case 'get_recent_items':
            return await this.getRecentItems(request.params.arguments)
          
          case 'refresh_search_index':
            return await this.refreshSearchIndex(request.params.arguments)
          
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${request.params.name}`
            )
        }
      } catch (error) {
        console.error('Tool execution error:', error)
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error.message}`
        )
      }
    })
  }

  // 更新搜索索引
  private async updateSearchIndexIfNeeded(force = false) {
    const now = Date.now()
    if (!force && now - lastIndexUpdate < INDEX_CACHE_TIME && searchIndexes.projects) {
      return
    }

    try {
      // 获取所有数据
      const [projects, apis, tags] = await Promise.all([
        prisma.project.findMany({
          include: {
            _count: {
              select: { apis: true, tags: true }
            }
          }
        }),
        prisma.aPI.findMany({
          include: {
            project: { select: { name: true } },
            apiTags: {
              include: { tag: true }
            }
          }
        }),
        prisma.tag.findMany({
          include: {
            project: { select: { name: true } },
            _count: {
              select: { apiTags: true }
            }
          }
        })
      ])

      // 创建搜索索引
      searchIndexes.projects = new Fuse(projects, searchConfig.projects)
      searchIndexes.apis = new Fuse(apis, searchConfig.apis)
      searchIndexes.tags = new Fuse(tags, searchConfig.tags)

      lastIndexUpdate = now
      console.log('Search indexes updated successfully')
    } catch (error) {
      console.error('Failed to update search indexes:', error)
      throw error
    }
  }

  // 搜索项目
  private async searchProjects(args: any) {
    const { query, limit = 10 } = args

    if (!searchIndexes.projects) {
      throw new Error('Search index not initialized')
    }

    const results = searchIndexes.projects.search(query, { limit })
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            type: 'projects',
            query,
            total: results.length,
            results: results.map(result => ({
              ...result.item,
              score: result.score
            }))
          }, null, 2)
        }
      ]
    }
  }

  // 搜索API
  private async searchAPIs(args: any) {
    const { query, projectId, method, status, limit = 20 } = args

    if (!searchIndexes.apis) {
      throw new Error('Search index not initialized')
    }

    let results = searchIndexes.apis.search(query, { limit: limit * 2 })

    // 应用过滤条件
    if (projectId || method || status) {
      results = results.filter(result => {
        const api = result.item
        if (projectId && api.projectId !== projectId) return false
        if (method && api.method !== method) return false
        if (status && api.status !== status) return false
        return true
      })
    }

    // 限制结果数量
    results = results.slice(0, limit)

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            type: 'apis',
            query,
            filters: { projectId, method, status },
            total: results.length,
            results: results.map(result => ({
              ...result.item,
              score: result.score
            }))
          }, null, 2)
        }
      ]
    }
  }

  // 搜索标签
  private async searchTags(args: any) {
    const { query, projectId, limit = 10 } = args

    if (!searchIndexes.tags) {
      throw new Error('Search index not initialized')
    }

    let results = searchIndexes.tags.search(query, { limit: limit * 2 })

    // 应用项目过滤
    if (projectId) {
      results = results.filter(result => result.item.projectId === projectId)
    }

    results = results.slice(0, limit)

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            type: 'tags',
            query,
            filters: { projectId },
            total: results.length,
            results: results.map(result => ({
              ...result.item,
              score: result.score
            }))
          }, null, 2)
        }
      ]
    }
  }

  // 全局搜索
  private async globalSearch(args: any) {
    const { query, types = ['projects', 'apis', 'tags'], limit = 5 } = args

    const results = {}

    if (types.includes('projects') && searchIndexes.projects) {
      const projectResults = searchIndexes.projects.search(query, { limit })
      results['projects'] = projectResults.map(r => ({ ...r.item, score: r.score }))
    }

    if (types.includes('apis') && searchIndexes.apis) {
      const apiResults = searchIndexes.apis.search(query, { limit })
      results['apis'] = apiResults.map(r => ({ ...r.item, score: r.score }))
    }

    if (types.includes('tags') && searchIndexes.tags) {
      const tagResults = searchIndexes.tags.search(query, { limit })
      results['tags'] = tagResults.map(r => ({ ...r.item, score: r.score }))
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            type: 'global_search',
            query,
            types,
            results
          }, null, 2)
        }
      ]
    }
  }

  // 获取搜索建议
  private async getSearchSuggestions(args: any) {
    const { query, limit = 5 } = args

    const suggestions = new Set<string>()

    // 从项目名称获取建议
    if (searchIndexes.projects) {
      const projectResults = searchIndexes.projects.search(query, { limit })
      projectResults.forEach(result => {
        const words = result.item.name.split(' ')
        words.forEach(word => {
          if (word.toLowerCase().includes(query.toLowerCase())) {
            suggestions.add(word)
          }
        })
      })
    }

    // 从API名称获取建议
    if (searchIndexes.apis) {
      const apiResults = searchIndexes.apis.search(query, { limit })
      apiResults.forEach(result => {
        const words = result.item.name.split(' ')
        words.forEach(word => {
          if (word.toLowerCase().includes(query.toLowerCase())) {
            suggestions.add(word)
          }
        })
      })
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            type: 'suggestions',
            query,
            suggestions: Array.from(suggestions).slice(0, limit)
          }, null, 2)
        }
      ]
    }
  }

  // 获取最近项目
  private async getRecentItems(args: any) {
    const { limit = 10 } = args

    const [recentProjects, recentAPIs] = await Promise.all([
      prisma.project.findMany({
        take: Math.ceil(limit / 2),
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: { apis: true, tags: true }
          }
        }
      }),
      prisma.aPI.findMany({
        take: Math.ceil(limit / 2),
        orderBy: { updatedAt: 'desc' },
        include: {
          project: { select: { name: true } }
        }
      })
    ])

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            type: 'recent_items',
            projects: recentProjects,
            apis: recentAPIs
          }, null, 2)
        }
      ]
    }
  }

  // 刷新搜索索引
  private async refreshSearchIndex(args: any) {
    const { force = false } = args

    await this.updateSearchIndexIfNeeded(force)

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            type: 'index_refresh',
            success: true,
            timestamp: new Date().toISOString()
          }, null, 2)
        }
      ]
    }
  }

  async run() {
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    console.error('DevAPI Search MCP Server running on stdio')
  }
}

const server = new DevAPISearchServer()
server.run().catch(console.error)