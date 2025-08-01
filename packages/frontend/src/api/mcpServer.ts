import { debug } from '../debug'
import { mcpConfig } from '../config/mcpConfig'

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

/**
 * MCP 服务器 API 客户端
 * 统一管理与 MCP 服务器的通信
 */
class MCPServerAPI {
  /**
   * 获取 MCP 服务器状态
   */

  async getStatus(): Promise<MCPServerStatus> {
    try {
      const response = await fetch(mcpConfig.getMCPStatusUrl())
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

  /**
   * 启动 MCP 服务器
   */
  async start(): Promise<{ success: boolean; message: string }> {
    try {
      debug.log('启动MCP服务器请求', {}, 'MCPServerAPI')
      
      const response = await fetch(mcpConfig.getMCPStartUrl(), {
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

  /**
   * 停止 MCP 服务器
   */
  async stop(): Promise<{ success: boolean; message: string }> {
    try {
      debug.log('停止MCP服务器请求', {}, 'MCPServerAPI')
      
      const response = await fetch(mcpConfig.getMCPStopUrl(), {
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

  /**
   * 重启 MCP 服务器
   */
  async restart(): Promise<{ success: boolean; message: string }> {
    try {
      debug.log('重启MCP服务器请求', {}, 'MCPServerAPI')
      
      // 先停止
      const stopResult = await this.stop()
      if (!stopResult.success) {
        return stopResult
      }
      
      // 等待一秒
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 再启动
      const startResult = await this.start()
      
      debug.log('MCP服务器重启完成', startResult, 'MCPServerAPI')
      return startResult
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      debug.error('重启MCP服务器失败', error, 'MCPServerAPI')
      return {
        success: false,
        message: `重启失败: ${errorMsg}`
      }
    }
  }

  /**
   * 获取 MCP 服务器日志
   */
  async getLogs(limit: number = 50): Promise<MCPServerLog[]> {
    try {
      const response = await fetch(`${mcpConfig.getMCPLogsUrl()}?limit=${limit}`)
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

  /**
   * 测试 MCP 服务器连接
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(mcpConfig.getMCPPingUrl())
      return response.ok
    } catch (error) {
      debug.error('MCP服务器连接测试失败', error, 'MCPServerAPI')
      return false
    }
  }

  /**
   * 创建EventSource连接来接收实时状态更新
   */
  createStatusStream(onUpdate: (status: MCPServerStatus) => void): EventSource | null {
    try {
      const eventSource = new EventSource(mcpConfig.getMCPStatusStreamUrl())
      
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

  /**
   * 创建日志流
   */
  createLogStream(onLog: (log: MCPServerLog) => void): EventSource | null {
    try {
      const eventSource = new EventSource(mcpConfig.getMCPLogStreamUrl())
      
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