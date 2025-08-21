/**
 * MCP Server 配置管理
 * 统一管理前端调用 MCP server 的地址配置
 */

import { ENV_CONFIG, getBackendBaseUrl, getMCPHttpUrl, getMCPWebSocketUrl } from './env'
import { mcpServerAPI, MCPConfig as DynamicMCPConfig } from '../api/mcpServer'
import { debug } from '../debug'

// 环境变量配置（保持向后兼容）
const getEnvConfig = () => {
  return {
    // 从环境变量获取配置，使用新的环境配置系统
    BACKEND_HOST: ENV_CONFIG.backend.host,
    BACKEND_PORT: ENV_CONFIG.backend.port.toString(),
    MCP_HTTP_HOST: ENV_CONFIG.mcp.http.host,
    MCP_HTTP_PORT: ENV_CONFIG.mcp.http.port.toString(),
    MCP_WS_HOST: ENV_CONFIG.mcp.ws.host,
    MCP_WS_PORT: ENV_CONFIG.mcp.ws.port.toString(),
  }
}

// MCP 服务器配置类
class MCPConfig {
  private config = getEnvConfig()
  private dynamicConfig: DynamicMCPConfig | null = null
  private configLoadPromise: Promise<void> | null = null

  /**
   * 加载动态配置
   */
  private async loadDynamicConfig(): Promise<void> {
    if (this.configLoadPromise) {
      return this.configLoadPromise
    }

    this.configLoadPromise = (async () => {
      try {
        debug.log('开始加载动态MCP配置', {}, 'MCPConfig')
        this.dynamicConfig = await mcpServerAPI.getConfig()
        debug.log('动态MCP配置加载成功', {
          timestamp: this.dynamicConfig.timestamp,
          backend: this.dynamicConfig.backend,
          toolsCount: this.dynamicConfig.tools.count
        }, 'MCPConfig')
      } catch (error) {
        debug.error('加载动态MCP配置失败，使用默认配置', error, 'MCPConfig')
        this.dynamicConfig = null
      }
    })()

    return this.configLoadPromise
  }

  /**
   * 获取动态配置（如果可用）
   */
  private async getDynamicConfig(): Promise<DynamicMCPConfig | null> {
    await this.loadDynamicConfig()
    return this.dynamicConfig
  }

  /**
   * 获取后端 API 基础 URL
   * 用于 MCP 服务器管理接口
   */
  getBackendBaseUrl(): string {
    if (this.dynamicConfig) {
      return `${this.dynamicConfig.backend.url}${this.dynamicConfig.backend.apiBaseUrl}`
    }
    const { BACKEND_HOST, BACKEND_PORT } = this.config
    return `http://${BACKEND_HOST}:${BACKEND_PORT}/api/v1`
  }

  /**
   * 获取 MCP HTTP 服务器 URL
   * 用于直接调用 MCP 工具
   */
  getMCPHttpUrl(): string {
    if (this.dynamicConfig) {
      return this.dynamicConfig.mcp.http.url
    }
    const { MCP_HTTP_HOST, MCP_HTTP_PORT } = this.config
    return `http://${MCP_HTTP_HOST}:${MCP_HTTP_PORT}`
  }

  /**
   * 获取 MCP WebSocket 服务器 URL
   * 用于实时通信
   */
  getMCPWebSocketUrl(): string {
    if (this.dynamicConfig) {
      return this.dynamicConfig.mcp.ws.url
    }
    const { MCP_WS_HOST, MCP_WS_PORT } = this.config
    return `ws://${MCP_WS_HOST}:${MCP_WS_PORT}`
  }

  /**
   * 获取 MCP 工具调用 URL
   * @param toolName 工具名称
   */
  getMCPToolUrl(toolName: string): string {
    if (this.dynamicConfig) {
      return `${this.dynamicConfig.backend.url}${this.dynamicConfig.backend.apiBaseUrl}/mcp/tools/${toolName}`
    }
    return `${this.getBackendBaseUrl()}/mcp/tools/${toolName}`
  }

  /**
   * 获取 MCP 状态 URL
   */
  getMCPStatusUrl(): string {
    if (this.dynamicConfig) {
      return `${this.dynamicConfig.backend.url}${this.dynamicConfig.mcp.http.endpoints.status}`
    }
    return `${this.getBackendBaseUrl()}/mcp/status`
  }

  /**
   * 获取 MCP 日志 URL
   */
  getMCPLogsUrl(): string {
    if (this.dynamicConfig) {
      return `${this.dynamicConfig.backend.url}${this.dynamicConfig.mcp.http.endpoints.logs}`
    }
    return `${this.getBackendBaseUrl()}/mcp/logs`
  }

  /**
   * 获取 MCP 状态流 URL (SSE)
   */
  getMCPStatusStreamUrl(): string {
    if (this.dynamicConfig) {
      return `${this.dynamicConfig.backend.url}${this.dynamicConfig.mcp.http.endpoints.status}/stream`
    }
    return `${this.getBackendBaseUrl()}/mcp/status/stream`
  }

  /**
   * 获取 MCP 日志流 URL (SSE)
   */
  getMCPLogStreamUrl(): string {
    if (this.dynamicConfig) {
      return `${this.dynamicConfig.backend.url}${this.dynamicConfig.mcp.http.endpoints.logs}/stream`
    }
    return `${this.getBackendBaseUrl()}/mcp/logs/stream`
  }

  /**
   * 获取 MCP 启动 URL
   */
  getMCPStartUrl(): string {
    if (this.dynamicConfig) {
      return `${this.dynamicConfig.backend.url}${this.dynamicConfig.mcp.http.endpoints.start}`
    }
    return `${this.getBackendBaseUrl()}/mcp/start`
  }

  /**
   * 获取 MCP 停止 URL
   */
  getMCPStopUrl(): string {
    if (this.dynamicConfig) {
      return `${this.dynamicConfig.backend.url}${this.dynamicConfig.mcp.http.endpoints.stop}`
    }
    return `${this.getBackendBaseUrl()}/mcp/stop`
  }

  /**
   * 获取连接测试 URL
   */
  getMCPPingUrl(): string {
    if (this.dynamicConfig) {
      return `${this.dynamicConfig.backend.url}${this.dynamicConfig.mcp.http.endpoints.ping}`
    }
    return `${this.getBackendBaseUrl()}/mcp/ping`
  }

  /**
   * 初始化动态配置
   * 应在应用启动时调用
   */
  async initializeDynamicConfig(): Promise<void> {
    try {
      await this.loadDynamicConfig()
      debug.log('MCP动态配置初始化完成', {
        hasDynamicConfig: !!this.dynamicConfig,
        timestamp: this.dynamicConfig?.timestamp
      }, 'MCPConfig')
    } catch (error) {
      debug.error('MCP动态配置初始化失败', error, 'MCPConfig')
    }
  }

  /**
   * 刷新动态配置
   */
  async refreshDynamicConfig(): Promise<void> {
    this.configLoadPromise = null
    this.dynamicConfig = null
    await this.loadDynamicConfig()
    debug.log('MCP动态配置已刷新', {
      hasDynamicConfig: !!this.dynamicConfig,
      timestamp: this.dynamicConfig?.timestamp
    }, 'MCPConfig')
  }

  /**
   * 检查是否使用动态配置
   */
  isDynamicConfigEnabled(): boolean {
    return this.dynamicConfig !== null
  }

  /**
   * 获取当前使用的配置类型
   */
  getConfigType(): 'static' | 'dynamic' {
    return this.dynamicConfig ? 'dynamic' : 'static'
  }

  /**
   * 更新配置
   * @param newConfig 新的配置项
   */
  updateConfig(newConfig: Partial<typeof this.config>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * 获取当前配置
   */
  getCurrentConfig() {
    return { ...this.config }
  }

  /**
   * 重置为默认配置
   */
  resetToDefault(): void {
    this.config = getEnvConfig()
  }

  /**
   * 验证配置是否有效
   */
  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    const { BACKEND_HOST, BACKEND_PORT, MCP_HTTP_HOST, MCP_HTTP_PORT } = this.config

    // 验证主机名
    if (!BACKEND_HOST || BACKEND_HOST.trim() === '') {
      errors.push('后端主机名不能为空')
    }

    if (!MCP_HTTP_HOST || MCP_HTTP_HOST.trim() === '') {
      errors.push('MCP HTTP 主机名不能为空')
    }

    // 验证端口号
    const backendPort = parseInt(BACKEND_PORT)
    if (isNaN(backendPort) || backendPort < 1 || backendPort > 65535) {
      errors.push('后端端口号必须是 1-65535 之间的数字')
    }

    const mcpHttpPort = parseInt(MCP_HTTP_PORT)
    if (isNaN(mcpHttpPort) || mcpHttpPort < 1 || mcpHttpPort > 65535) {
      errors.push('MCP HTTP 端口号必须是 1-65535 之间的数字')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// 导出单例实例
export const mcpConfig = new MCPConfig()

// 导出类型定义
export type MCPConfigType = typeof mcpConfig

// 导出常用的 URL 获取函数
export const getMCPUrls = () => ({
  backend: mcpConfig.getBackendBaseUrl(),
  httpServer: mcpConfig.getMCPHttpUrl(),
  websocket: mcpConfig.getMCPWebSocketUrl(),
  status: mcpConfig.getMCPStatusUrl(),
  logs: mcpConfig.getMCPLogsUrl(),
  start: mcpConfig.getMCPStartUrl(),
  stop: mcpConfig.getMCPStopUrl(),
  ping: mcpConfig.getMCPPingUrl(),
})

export default mcpConfig