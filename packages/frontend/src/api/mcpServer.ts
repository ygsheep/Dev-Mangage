import { debug } from '../debug'

export interface MCPServerStatus {
  isRunning: boolean
  port: number
  uptime: number
  requestCount: number
  lastActivity: Date | null
  vectorSearchStatus: 'idle' | 'initializing' | 'ready' | 'fallback' | 'error'
  databaseStatus: 'connected' | 'disconnected' | 'error'
  modelInfo?: {
    name: string
    size: string
    type: 'vector' | 'fallback'
  }
}

export interface MCPServerLog {
  timestamp: string
  level: 'info' | 'warn' | 'error'
  message: string
  source?: string
}

class MCPServerAPI {
  private baseUrl = 'http://localhost:3001/api/v1'

  async getStatus(): Promise<MCPServerStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/mcp/status`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const status = await response.json()
      debug.log('获取MCP服务器状态', status, 'MCPServerAPI')
      return status
    } catch (error) {
      debug.error('获取MCP服务器状态失败', error, 'MCPServerAPI')
      // 返回默认状态
      return {
        isRunning: false,
        port: 3001,
        uptime: 0,
        requestCount: 0,
        lastActivity: null,
        vectorSearchStatus: 'idle',
        databaseStatus: 'disconnected'
      }
    }
  }

  async start(): Promise<{ success: boolean; message: string }> {
    try {
      debug.log('启动MCP服务器请求', {}, 'MCPServerAPI')
      
      const response = await fetch(`${this.baseUrl}/mcp/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}`)
      }
      
      debug.log('MCP服务器启动成功', result, 'MCPServerAPI')
      return result
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      debug.error('启动MCP服务器失败', error, 'MCPServerAPI')
      return {
        success: false,
        message: `启动失败: ${errorMsg}`
      }
    }
  }

  async stop(): Promise<{ success: boolean; message: string }> {
    try {
      debug.log('停止MCP服务器请求', {}, 'MCPServerAPI')
      
      const response = await fetch(`${this.baseUrl}/mcp/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}`)
      }
      
      debug.log('MCP服务器停止成功', result, 'MCPServerAPI')
      return result
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      debug.error('停止MCP服务器失败', error, 'MCPServerAPI')
      return {
        success: false,
        message: `停止失败: ${errorMsg}`
      }
    }
  }

  async restart(): Promise<{ success: boolean; message: string }> {
    try {
      debug.log('重启MCP服务器请求', {}, 'MCPServerAPI')
      
      // 先停止
      await this.stop()
      
      // 等待一秒
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 再启动
      return await this.start()
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      debug.error('重启MCP服务器失败', error, 'MCPServerAPI')
      return {
        success: false,
        message: `重启失败: ${errorMsg}`
      }
    }
  }

  async getLogs(limit: number = 50): Promise<MCPServerLog[]> {
    try {
      const response = await fetch(`${this.baseUrl}/mcp/logs?limit=${limit}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const logs = await response.json()
      debug.log('获取MCP服务器日志', { count: logs.length }, 'MCPServerAPI')
      return logs
    } catch (error) {
      debug.error('获取MCP服务器日志失败', error, 'MCPServerAPI')
      return []
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/mcp/ping`)
      return response.ok
    } catch (error) {
      debug.error('MCP服务器连接测试失败', error, 'MCPServerAPI')
      return false
    }
  }

  // 创建EventSource连接来接收实时状态更新
  createStatusStream(onUpdate: (status: MCPServerStatus) => void): EventSource | null {
    try {
      const eventSource = new EventSource(`${this.baseUrl}/mcp/status/stream`)
      
      eventSource.onmessage = (event) => {
        try {
          const status = JSON.parse(event.data)
          debug.log('收到MCP服务器状态更新', status, 'MCPServerAPI')
          onUpdate(status)
        } catch (error) {
          debug.error('解析MCP状态更新失败', error, 'MCPServerAPI')
        }
      }
      
      eventSource.onerror = (error) => {
        debug.error('MCP状态流连接错误', error, 'MCPServerAPI')
      }
      
      return eventSource
      
    } catch (error) {
      debug.error('创建MCP状态流失败', error, 'MCPServerAPI')
      return null
    }
  }

  // 创建日志流
  createLogStream(onLog: (log: MCPServerLog) => void): EventSource | null {
    try {
      const eventSource = new EventSource(`${this.baseUrl}/mcp/logs/stream`)
      
      eventSource.onmessage = (event) => {
        try {
          const log = JSON.parse(event.data)
          debug.log('收到MCP服务器日志', log, 'MCPServerAPI')
          onLog(log)
        } catch (error) {
          debug.error('解析MCP日志失败', error, 'MCPServerAPI')
        }
      }
      
      eventSource.onerror = (error) => {
        debug.error('MCP日志流连接错误', error, 'MCPServerAPI')
      }
      
      return eventSource
      
    } catch (error) {
      debug.error('创建MCP日志流失败', error, 'MCPServerAPI')
      return null
    }
  }
}

export const mcpServerAPI = new MCPServerAPI()
export default mcpServerAPI