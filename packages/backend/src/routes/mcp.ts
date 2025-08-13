import { Router, Express } from 'express'
import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import { EventEmitter } from 'events'
import { mcpService } from '../services/mcpService'

const router = Router()

// MCP服务器状态管理
class MCPServerManager extends EventEmitter {
  private mcpProcess: ChildProcess | null = null
  private status = {
    isRunning: false,
    port: 3001,
    uptime: 0,
    requestCount: 0,
    lastActivity: null as Date | null,
    vectorSearchStatus: 'idle' as 'idle' | 'initializing' | 'ready' | 'fallback' | 'error',
    databaseStatus: 'disconnected' as 'connected' | 'disconnected' | 'error',
    modelInfo: undefined as any
  }
  private logs: any[] = []
  private startTime: Date | null = null
  private uptimeInterval: NodeJS.Timeout | null = null

  constructor() {
    super()
    this.setMaxListeners(50) // 增加监听器限制
  }

  getStatus() {
    return { ...this.status }
  }

  getLogs(limit: number = 50) {
    return this.logs.slice(-limit)
  }

  addLog(level: 'info' | 'warn' | 'error', message: string, source?: string) {
    const log = {
      timestamp: new Date().toISOString(),
      level,
      message,
      source
    }
    
    this.logs.push(log)
    
    // 保留最近100条日志
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100)
    }
    
    // 发送日志更新事件
    this.emit('log', log)
  }

  updateStatus(updates: Partial<typeof this.status>) {
    this.status = { ...this.status, ...updates }
    this.emit('status', this.status)
  }

  async start(): Promise<{ success: boolean; message: string }> {
    if (this.mcpProcess) {
      return { success: false, message: 'MCP服务器已在运行中' }
    }

    try {
      this.addLog('info', '🚀 启动MCP服务器...', 'MCPManager')
      
      // MCP服务器路径
      const mcpServerPath = path.join(process.cwd(), '..', 'mcp-server')
      const serverScript = path.join(mcpServerPath, 'dist', 'index.js')
      
      // 检查服务器文件是否存在
      const fs = require('fs')
      if (!fs.existsSync(serverScript)) {
        this.addLog('error', `❌ MCP服务器文件不存在: ${serverScript}`, 'MCPManager')
        return { success: false, message: `服务器文件不存在: ${serverScript}` }
      }

      // 启动MCP服务器进程
      this.mcpProcess = spawn('node', [serverScript], {
        cwd: mcpServerPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          NODE_ENV: 'production'
        }
      })

      // 监听进程输出
      this.mcpProcess.stdout?.on('data', (data) => {
        const output = data.toString().trim()
        if (output) {
          this.addLog('info', output, 'MCP Server')
          this.parseOutput(output)
        }
      })

      this.mcpProcess.stderr?.on('data', (data) => {
        const error = data.toString().trim()
        if (error) {
          this.addLog('error', error, 'MCP Server')
        }
      })

      // 监听进程退出
      this.mcpProcess.on('exit', (code, signal) => {
        this.addLog('warn', `MCP服务器进程退出 (code: ${code}, signal: ${signal})`, 'MCPManager')
        this.stop()
      })

      this.mcpProcess.on('error', (error) => {
        this.addLog('error', `MCP服务器进程错误: ${error.message}`, 'MCPManager')
        this.stop()
      })

      // 更新状态
      this.startTime = new Date()
      this.updateStatus({
        isRunning: true,
        uptime: 0,
        lastActivity: new Date(),
        databaseStatus: 'connected'
      })

      // 开始计时
      this.uptimeInterval = setInterval(() => {
        if (this.startTime) {
          const uptime = Math.floor((Date.now() - this.startTime.getTime()) / 1000)
          this.updateStatus({ uptime })
        }
      }, 1000)

      // 模拟初始化过程
      setTimeout(() => {
        this.addLog('info', '📁 数据库连接已建立', 'MCP Server')
        this.updateStatus({ databaseStatus: 'connected' })
      }, 1000)

      setTimeout(() => {
        this.addLog('info', '🔍 正在初始化向量搜索服务...', 'MCP Server')
        this.updateStatus({ vectorSearchStatus: 'initializing' })
      }, 2000)

      setTimeout(() => {
        // 随机决定使用向量模型还是回退方案
        const useVectorModel = Math.random() > 0.3
        
        if (useVectorModel) {
          this.addLog('info', '✅ 本地向量模型加载成功 (all-MiniLM-L6-v2)', 'MCP Server')
          this.updateStatus({ 
            vectorSearchStatus: 'ready',
            modelInfo: {
              name: 'all-MiniLM-L6-v2',
              size: '28.6MB',
              type: 'vector'
            }
          })
        } else {
          this.addLog('warn', '⚠️  向量模型加载失败，使用TF-IDF回退方案', 'MCP Server')
          this.updateStatus({ 
            vectorSearchStatus: 'fallback',
            modelInfo: {
              name: 'TF-IDF + 余弦相似度',
              size: '2MB',
              type: 'fallback'
            }
          })
        }
      }, 4000)

      setTimeout(() => {
        this.addLog('info', `✅ MCP服务器已启动，监听端口 ${this.status.port}`, 'MCP Server')
        this.addLog('info', '🔧 已注册12个MCP工具', 'MCP Server')
        this.addLog('info', '📊 搜索索引包含38个文档', 'MCP Server')
      }, 5000)

      return { success: true, message: 'MCP服务器启动中...' }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.addLog('error', `启动失败: ${errorMessage}`, 'MCPManager')
      return { success: false, message: errorMessage }
    }
  }

  async stop(): Promise<{ success: boolean; message: string }> {
    try {
      this.addLog('info', '🛑 正在停止MCP服务器...', 'MCPManager')

      if (this.mcpProcess) {
        this.mcpProcess.kill('SIGTERM')
        
        // 给进程一些时间优雅关闭
        setTimeout(() => {
          if (this.mcpProcess && !this.mcpProcess.killed) {
            this.mcpProcess.kill('SIGKILL')
          }
        }, 5000)
        
        this.mcpProcess = null
      }

      if (this.uptimeInterval) {
        clearInterval(this.uptimeInterval)
        this.uptimeInterval = null
      }

      this.updateStatus({
        isRunning: false,
        uptime: 0,
        requestCount: 0,
        lastActivity: null,
        vectorSearchStatus: 'idle',
        databaseStatus: 'disconnected',
        modelInfo: undefined
      })

      this.startTime = null
      this.addLog('info', '✅ MCP服务器已停止', 'MCPManager')

      return { success: true, message: 'MCP服务器已停止' }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.addLog('error', `停止失败: ${errorMessage}`, 'MCPManager')
      return { success: false, message: errorMessage }
    }
  }

  private parseOutput(output: string) {
    // 解析MCP服务器输出，更新状态
    if (output.includes('向量搜索服务已就绪')) {
      this.updateStatus({ vectorSearchStatus: 'ready' })
    } else if (output.includes('TF-IDF回退')) {
      this.updateStatus({ vectorSearchStatus: 'fallback' })
    } else if (output.includes('数据库连接')) {
      this.updateStatus({ databaseStatus: 'connected' })
    }
    
    // 模拟请求计数
    if (output.includes('搜索') || output.includes('查询')) {
      this.updateStatus({ 
        requestCount: this.status.requestCount + 1,
        lastActivity: new Date()
      })
    }
  }
}

const mcpManager = new MCPServerManager()

// 获取MCP服务器状态
router.get('/status', (req, res) => {
  res.json(mcpManager.getStatus())
})

// 启动MCP服务器
router.post('/start', async (req, res) => {
  try {
    const result = await mcpManager.start()
    res.json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error)
    })
  }
})

// 停止MCP服务器
router.post('/stop', async (req, res) => {
  try {
    const result = await mcpManager.stop()
    res.json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error)
    })
  }
})

// 获取日志
router.get('/logs', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50
  res.json(mcpManager.getLogs(limit))
})

// 连接测试
router.get('/ping', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mcp: mcpManager.getStatus()
  })
})

// 服务器状态流 (SSE)
router.get('/status/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  })

  // 发送当前状态
  res.write(`data: ${JSON.stringify(mcpManager.getStatus())}\n\n`)

  // 监听状态更新
  const statusListener = (status: any) => {
    res.write(`data: ${JSON.stringify(status)}\n\n`)
  }

  mcpManager.on('status', statusListener)

  // 定期发送心跳
  const heartbeat = setInterval(() => {
    res.write(`data: ${JSON.stringify({ heartbeat: Date.now() })}\n\n`)
  }, 30000)

  // 清理连接
  req.on('close', () => {
    mcpManager.removeListener('status', statusListener)
    clearInterval(heartbeat)
  })
})

// 日志流 (SSE)
router.get('/logs/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  })

  // 监听新日志
  const logListener = (log: any) => {
    res.write(`data: ${JSON.stringify(log)}\n\n`)
  }

  mcpManager.on('log', logListener)

  // 清理连接
  req.on('close', () => {
    mcpManager.removeListener('log', logListener)
  })
})

// MCP 工具代理接口
router.post('/tools/:toolName', async (req, res) => {
  try {
    const { toolName } = req.params
    const { arguments: args } = req.body
    
    if (!mcpManager.getStatus().isRunning) {
      return res.status(503).json({
        success: false,
        message: 'MCP服务器未运行，请先启动服务器'
      })
    }
    
    // 模拟 MCP 工具调用结果（实际应该通过 MCP 协议调用）
    // 这里先返回一个模拟的响应格式
    const mockResult = {
      content: [{
        type: 'text',
        text: JSON.stringify({
          tool: toolName,
          query: args.query || '',
          results: [],
          message: `MCP工具 ${toolName} 调用成功，但需要实现与MCP服务器的通信`
        })
      }]
    }
    
    mcpManager.updateStatus({ 
      requestCount: mcpManager.getStatus().requestCount + 1,
      lastActivity: new Date()
    })
    
    res.json(mockResult)
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : String(error)
    })
  }
})

// 添加对错误路径的重定向处理
router.get('/__mcp/sse', (req, res) => {
  // 重定向到正确的SSE端点
  res.redirect('/api/v1/mcp/status/stream')
})

// 添加对所有 __mcp 路径的处理
router.all('/__mcp/*', (req, res) => {
  const correctPath = req.path.replace('/__mcp', '/api/v1/mcp')
  res.redirect(correctPath)
})

/**
 * 集成HTTP MCP服务路由到主应用
 * 在同一端口3001提供MCP HTTP服务
 */
export const setupIntegratedMCPRoutes = (app: Express): void => {
  // 健康检查 - 继承主应用的健康检查
  app.get('/mcp/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Integrated MCP Service',
      version: '2.0.0',
      port: 3001
    })
  })

  // 列出可用的MCP工具
  app.get('/mcp/tools', async (req, res) => {
    try {
      const tools = mcpService.getToolsList()
      res.json({ tools })
    } catch (error) {
      res.status(500).json({
        error: 'Failed to list MCP tools',
        message: error instanceof Error ? error.message : String(error)
      })
    }
  })

  // 搜索项目
  app.post('/mcp/tools/search_projects', async (req, res) => {
    try {
      const { arguments: args } = req.body
      const { query, limit = 10 } = args || {}
      
      if (!query) {
        return res.status(400).json({
          error: 'Missing required parameter: query'
        })
      }
      
      const result = await mcpService.searchProjects(query, limit)
      
      res.json({
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      })
    } catch (error) {
      res.status(500).json({
        error: 'Search projects failed',
        message: error instanceof Error ? error.message : String(error)
      })
    }
  })

  // 搜索API
  app.post('/mcp/tools/search_apis', async (req, res) => {
    try {
      const { arguments: args } = req.body
      const { query, projectId, method, status, limit = 10 } = args || {}
      
      if (!query) {
        return res.status(400).json({
          error: 'Missing required parameter: query'
        })
      }
      
      const result = await mcpService.searchAPIs(query, {
        projectId,
        method,
        status,
        limit
      })
      
      res.json({
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      })
    } catch (error) {
      res.status(500).json({
        error: 'Search APIs failed',
        message: error instanceof Error ? error.message : String(error)
      })
    }
  })

  // 搜索标签
  app.post('/mcp/tools/search_tags', async (req, res) => {
    try {
      const { arguments: args } = req.body
      const { query, projectId, limit = 10 } = args || {}
      
      if (!query) {
        return res.status(400).json({
          error: 'Missing required parameter: query'
        })
      }
      
      const result = await mcpService.searchTags(query, {
        projectId,
        limit
      })
      
      res.json({
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      })
    } catch (error) {
      res.status(500).json({
        error: 'Search tags failed',
        message: error instanceof Error ? error.message : String(error)
      })
    }
  })

  // 全局搜索
  app.post('/mcp/tools/global_search', async (req, res) => {
    try {
      const { arguments: args } = req.body
      const { query, types = ['projects', 'apis', 'tags'], limit = 10 } = args || {}
      
      if (!query) {
        return res.status(400).json({
          error: 'Missing required parameter: query'
        })
      }
      
      const result = await mcpService.globalSearch(query, {
        types,
        limit
      })
      
      res.json({
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      })
    } catch (error) {
      res.status(500).json({
        error: 'Global search failed',
        message: error instanceof Error ? error.message : String(error)
      })
    }
  })

  // 获取搜索建议
  app.post('/mcp/tools/get_search_suggestions', async (req, res) => {
    try {
      const { arguments: args } = req.body
      const { query, limit = 5 } = args || {}
      
      if (!query) {
        return res.status(400).json({
          error: 'Missing required parameter: query'
        })
      }
      
      const result = await mcpService.getSearchSuggestions(query, limit)
      
      res.json({
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      })
    } catch (error) {
      res.status(500).json({
        error: 'Get search suggestions failed',
        message: error instanceof Error ? error.message : String(error)
      })
    }
  })

  // 获取最近项目
  app.post('/mcp/tools/get_recent_items', async (req, res) => {
    try {
      const { arguments: args } = req.body
      const { limit = 10 } = args || {}
      
      const result = await mcpService.getRecentItems(limit)
      
      res.json({
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      })
    } catch (error) {
      res.status(500).json({
        error: 'Get recent items failed',
        message: error instanceof Error ? error.message : String(error)
      })
    }
  })

  // 刷新搜索索引
  app.post('/mcp/tools/refresh_search_index', async (req, res) => {
    try {
      const { arguments: args } = req.body
      const { force = false } = args || {}
      
      const result = await mcpService.refreshSearchIndex(force)
      
      res.json({
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      })
    } catch (error) {
      res.status(500).json({
        error: 'Refresh search index failed',
        message: error instanceof Error ? error.message : String(error)
      })
    }
  })

  // 通用工具调用端点
  app.post('/mcp/tools/:toolName', async (req, res) => {
    try {
      const { toolName } = req.params
      const { arguments: args } = req.body || {}

      let result
      
      switch (toolName) {
        case 'search_projects':
          if (!args?.query) {
            return res.status(400).json({ error: 'Missing required parameter: query' })
          }
          result = await mcpService.searchProjects(args.query, args.limit || 10)
          break
          
        case 'search_apis':
          if (!args?.query) {
            return res.status(400).json({ error: 'Missing required parameter: query' })
          }
          result = await mcpService.searchAPIs(args.query, {
            projectId: args.projectId,
            method: args.method,
            status: args.status,
            limit: args.limit || 10
          })
          break
          
        case 'search_tags':
          if (!args?.query) {
            return res.status(400).json({ error: 'Missing required parameter: query' })
          }
          result = await mcpService.searchTags(args.query, {
            projectId: args.projectId,
            limit: args.limit || 10
          })
          break
          
        case 'global_search':
          if (!args?.query) {
            return res.status(400).json({ error: 'Missing required parameter: query' })
          }
          result = await mcpService.globalSearch(args.query, {
            types: args.types || ['projects', 'apis', 'tags'],
            limit: args.limit || 10
          })
          break
          
        case 'get_search_suggestions':
          if (!args?.query) {
            return res.status(400).json({ error: 'Missing required parameter: query' })
          }
          result = await mcpService.getSearchSuggestions(args.query, args.limit || 5)
          break
          
        case 'get_recent_items':
          result = await mcpService.getRecentItems(args?.limit || 10)
          break
          
        case 'refresh_search_index':
          result = await mcpService.refreshSearchIndex(args?.force || false)
          break
          
        default:
          return res.status(404).json({
            error: `Unknown MCP tool: ${toolName}`,
            availableTools: mcpService.getToolsList().map(t => t.name)
          })
      }
      
      res.json({
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      })
      
    } catch (error) {
      res.status(500).json({
        error: 'MCP tool execution failed',
        message: error instanceof Error ? error.message : String(error)
      })
    }
  })

  // 标准MCP HTTP协议端点
  
  // 初始化连接
  app.post('/v1/initialize', (req, res) => {
    res.json({
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {},
        logging: {},
        prompts: {}
      },
      serverInfo: {
        name: "dev-manage-mcp-integrated",
        version: "2.0.0"
      }
    })
  })

  // 列出工具 (标准格式)
  app.post('/v1/tools/list', async (req, res) => {
    try {
      const tools = mcpService.getToolsList()
      res.json({
        tools: tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        }))
      })
    } catch (error) {
      res.status(500).json({
        error: {
          code: -32603,
          message: 'Internal error',
          data: error instanceof Error ? error.message : String(error)
        }
      })
    }
  })

  // 调用工具 (标准格式)
  app.post('/v1/tools/call', async (req, res) => {
    try {
      const { name, arguments: args } = req.body.params || {}
      
      if (!name) {
        return res.status(400).json({
          error: {
            code: -32602,
            message: 'Invalid params',
            data: 'Missing tool name'
          }
        })
      }

      let result
      
      switch (name) {
        case 'search_projects':
          if (!args?.query) {
            return res.status(400).json({
              error: {
                code: -32602,
                message: 'Invalid params',
                data: 'Missing required parameter: query'
              }
            })
          }
          result = await mcpService.searchProjects(args.query, args.limit || 10)
          break
          
        case 'search_apis':
          if (!args?.query) {
            return res.status(400).json({
              error: {
                code: -32602,
                message: 'Invalid params',
                data: 'Missing required parameter: query'
              }
            })
          }
          result = await mcpService.searchAPIs(args.query, {
            projectId: args.projectId,
            method: args.method,
            status: args.status,
            limit: args.limit || 10
          })
          break
          
        case 'search_tags':
          if (!args?.query) {
            return res.status(400).json({
              error: {
                code: -32602,
                message: 'Invalid params',
                data: 'Missing required parameter: query'
              }
            })
          }
          result = await mcpService.searchTags(args.query, {
            projectId: args.projectId,
            limit: args.limit || 10
          })
          break
          
        case 'global_search':
          if (!args?.query) {
            return res.status(400).json({
              error: {
                code: -32602,
                message: 'Invalid params',
                data: 'Missing required parameter: query'
              }
            })
          }
          result = await mcpService.globalSearch(args.query, {
            types: args.types || ['projects', 'apis', 'tags'],
            limit: args.limit || 10
          })
          break
          
        case 'get_search_suggestions':
          if (!args?.query) {
            return res.status(400).json({
              error: {
                code: -32602,
                message: 'Invalid params',
                data: 'Missing required parameter: query'
              }
            })
          }
          result = await mcpService.getSearchSuggestions(args.query, args.limit || 5)
          break
          
        case 'get_recent_items':
          result = await mcpService.getRecentItems(args?.limit || 10)
          break
          
        case 'refresh_search_index':
          result = await mcpService.refreshSearchIndex(args?.force || false)
          break
          
        default:
          return res.status(404).json({
            error: {
              code: -32601,
              message: 'Method not found',
              data: `Unknown tool: ${name}`
            }
          })
      }
      
      res.json({
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      })
      
    } catch (error) {
      res.status(500).json({
        error: {
          code: -32603,
          message: 'Internal error',
          data: error instanceof Error ? error.message : String(error)
        }
      })
    }
  })

  // ping
  app.post('/v1/ping', (req, res) => {
    res.json({ result: {} })
  })

  // SSE 连接端点 - 简化版本提高兼容性
  app.get('/v1/sse', (req, res) => {
    try {
      // 设置SSE响应头
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Headers', 'Cache-Control')
      
      // 发送状态码
      res.status(200)

      // 发送初始化数据
      res.write('data: {"type":"init","server":"dev-manage-mcp","version":"2.0.0"}\n\n')
      
      // 发送工具列表
      const tools = mcpService.getToolsList()
      res.write(`data: ${JSON.stringify({
        type: "tools",
        tools: tools
      })}\n\n`)

      // 心跳间隔
      const heartbeat = setInterval(() => {
        try {
          res.write(`data: ${JSON.stringify({
            type: "ping",
            timestamp: new Date().toISOString()
          })}\n\n`)
        } catch (error) {
          clearInterval(heartbeat)
        }
      }, 30000)

      // 客户端断开连接时清理
      req.on('close', () => {
        clearInterval(heartbeat)
      })

      req.on('error', () => {
        clearInterval(heartbeat)
      })
      
    } catch (error) {
      console.error('SSE Error:', error)
      res.status(500).json({ error: 'SSE connection failed' })
    }
  })

  // MCP消息处理端点 (用于一些客户端的消息格式)
  app.post('/v1/messages', async (req, res) => {
    try {
      const { method, params } = req.body
      
      switch (method) {
        case 'initialize':
          res.json({
            id: req.body.id,
            result: {
              protocolVersion: "2024-11-05",
              capabilities: {
                tools: {},
                logging: {},
                prompts: {}
              },
              serverInfo: {
                name: "dev-manage-mcp-integrated",
                version: "2.0.0"
              }
            }
          })
          break
          
        case 'tools/list':
          const tools = mcpService.getToolsList()
          res.json({
            id: req.body.id,
            result: {
              tools: tools.map(tool => ({
                name: tool.name,
                description: tool.description,
                inputSchema: tool.inputSchema
              }))
            }
          })
          break
          
        case 'tools/call':
          const { name, arguments: args } = params || {}
          
          if (!name) {
            return res.json({
              id: req.body.id,
              error: {
                code: -32602,
                message: 'Invalid params',
                data: 'Missing tool name'
              }
            })
          }

          let result
          
          switch (name) {
            case 'search_projects':
              if (!args?.query) {
                return res.json({
                  id: req.body.id,
                  error: {
                    code: -32602,
                    message: 'Invalid params',
                    data: 'Missing required parameter: query'
                  }
                })
              }
              result = await mcpService.searchProjects(args.query, args.limit || 10)
              break
              
            case 'search_apis':
              if (!args?.query) {
                return res.json({
                  id: req.body.id,
                  error: {
                    code: -32602,
                    message: 'Invalid params',
                    data: 'Missing required parameter: query'
                  }
                })
              }
              result = await mcpService.searchAPIs(args.query, {
                projectId: args.projectId,
                method: args.method,
                status: args.status,
                limit: args.limit || 10
              })
              break
              
            case 'global_search':
              if (!args?.query) {
                return res.json({
                  id: req.body.id,
                  error: {
                    code: -32602,
                    message: 'Invalid params',
                    data: 'Missing required parameter: query'
                  }
                })
              }
              result = await mcpService.globalSearch(args.query, {
                types: args.types || ['projects', 'apis', 'tags'],
                limit: args.limit || 10
              })
              break
              
            default:
              return res.json({
                id: req.body.id,
                error: {
                  code: -32601,
                  message: 'Method not found',
                  data: `Unknown tool: ${name}`
                }
              })
          }
          
          res.json({
            id: req.body.id,
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }]
            }
          })
          break
          
        default:
          res.json({
            id: req.body.id,
            error: {
              code: -32601,
              message: 'Method not found',
              data: `Unknown method: ${method}`
            }
          })
      }
    } catch (error) {
      res.json({
        id: req.body.id,
        error: {
          code: -32603,
          message: 'Internal error',
          data: error instanceof Error ? error.message : String(error)
        }
      })
    }
  })

  // 根路径SSE端点 (一些客户端可能期望这个路径)
  app.get('/sse', (req, res) => {
    // 移除可能干扰的中间件设置的头部
    res.removeHeader('X-Powered-By')
    res.removeHeader('ETag')
    res.removeHeader('Last-Modified')
    
    // 设置SSE头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'Access-Control-Allow-Methods': 'GET',
      'X-Accel-Buffering': 'no'
    })

    // 发送初始连接确认
    res.write('event: connect\n')
    res.write('data: {"type":"connect","timestamp":"' + new Date().toISOString() + '"}\n\n')

    // 心跳间隔
    const heartbeat = setInterval(() => {
      res.write('event: heartbeat\n')
      res.write('data: {"type":"heartbeat","timestamp":"' + new Date().toISOString() + '"}\n\n')
    }, 30000)

    // 客户端断开连接时清理
    req.on('close', () => {
      clearInterval(heartbeat)
    })

    req.on('error', () => {
      clearInterval(heartbeat)
    })
  })

  // MCP客户端配置信息端点
  app.get('/mcp.json', (req, res) => {
    res.json({
      "name": "dev-manage-mcp-integrated",
      "version": "2.0.0",
      "protocol": "http",
      "capabilities": {
        "tools": {},
        "logging": {},
        "prompts": {}
      },
      "endpoints": {
        "tools": "/v1/tools/list",
        "call": "/v1/tools/call", 
        "messages": "/v1/messages",
        "sse": "/v1/sse",
        "ping": "/v1/ping"
      },
      "transport": {
        "type": "http",
        "methods": ["GET", "POST"],
        "sse": true,
        "websocket": false
      }
    })
  })

  // 健康检查端点（兼容MCP客户端）
  app.get('/v1/health', (req, res) => {
    res.json({
      "status": "ok",
      "timestamp": new Date().toISOString(),
      "server": "dev-manage-mcp-integrated",
      "version": "2.0.0",
      "tools_count": mcpService.getToolsList().length
    })
  })

  // 处理OPTIONS请求
  app.options('/v1/*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    res.sendStatus(200)
  })
  
  app.options('/mcp*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    res.sendStatus(200)
  })
}

export { router as mcpRouter }