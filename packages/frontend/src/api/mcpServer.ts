import { debug } from '../debug'
import { mcpConfig } from '../config/mcpConfig'
import { ENV_CONFIG } from '../config/env'

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

export interface MCPConfig {
  backend: {
    host: string
    port: number
    url: string
    apiBaseUrl: string
  }
  mcp: {
    http: {
      host: string
      port: number
      url: string
      endpoints: {
        health: string
        tools: string
        status: string
        logs: string
        start: string
        stop: string
        ping: string
      }
    }
    ws: {
      host: string
      port: number
      url: string
      enabled: boolean
    }
    standalone: {
      host: string
      port: number
      url: string
      serverPath: string
      enabled: boolean
    }
  }
  tools: {
    available: string[]
    count: number
  }
  runtime: {
    nodeVersion: string
    platform: string
    architecture: string
    workingDirectory: string
    environment: string
    uptime: number
  }
  status: MCPServerStatus
  timestamp: string
}

/**
 * MCP 服务器 API 客户端
 * 统一管理与 MCP 服务器的通信
 */
class MCPServerAPI {
  /**
   * 获取 MCP 配置信息
   */
  async getConfig(): Promise<MCPConfig> {
    try {
      const response = await fetch(`${mcpConfig.getBackendBaseUrl()}/mcp/config`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.message || '获取配置失败')
      }
      debug.log('获取MCP配置成功', result.config, 'MCPServerAPI')
      return result.config
    } catch (error) {
      debug.error('获取MCP配置失败', error, 'MCPServerAPI')
      // 返回默认配置
      return {
        backend: {
          host: ENV_CONFIG.backend.host,
          port: ENV_CONFIG.backend.port,
          url: `http://${ENV_CONFIG.backend.host}:${ENV_CONFIG.backend.port}`,
          apiBaseUrl: '/api/v1'
        },
        mcp: {
          http: {
            host: ENV_CONFIG.mcp.http.host,
            port: ENV_CONFIG.mcp.http.port,
            url: `http://${ENV_CONFIG.mcp.http.host}:${ENV_CONFIG.mcp.http.port}`,
            endpoints: {
              health: '/mcp/health',
              tools: '/mcp/tools',
              status: '/api/v1/mcp/status',
              logs: '/api/v1/mcp/logs',
              start: '/api/v1/mcp/start',
              stop: '/api/v1/mcp/stop',
              ping: '/api/v1/mcp/ping'
            }
          },
          ws: {
            host: ENV_CONFIG.mcp.ws.host,
            port: ENV_CONFIG.mcp.ws.port,
            url: `ws://${ENV_CONFIG.mcp.ws.host}:${ENV_CONFIG.mcp.ws.port}`,
            enabled: false
          },
          standalone: {
            host: 'localhost',
            port: 3000,
            url: 'http://localhost:3000',
            serverPath: '',
            enabled: false
          }
        },
        tools: {
          available: [],
          count: 0
        },
        runtime: {
          nodeVersion: '',
          platform: '',
          architecture: '',
          workingDirectory: '',
          environment: 'development',
          uptime: 0
        },
        status: {
          isRunning: false,
          port: ENV_CONFIG.backend.port,
          uptime: 0,
          requestCount: 0,
          lastActivity: null,
          vectorSearchStatus: 'idle',
          databaseStatus: 'disconnected'
        },
        timestamp: new Date().toISOString()
      }
    }
  }

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
        port: ENV_CONFIG.backend.port,
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