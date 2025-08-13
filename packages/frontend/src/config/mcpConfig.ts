/**
 * MCP Server 配置管理
 * 统一管理前端调用 MCP server 的地址配置
 */

// 环境变量配置
const getEnvConfig = () => {
  return {
    // 从环境变量获取配置，提供默认值
    BACKEND_HOST: import.meta.env.VITE_BACKEND_HOST || 'localhost',
    BACKEND_PORT: import.meta.env.VITE_BACKEND_PORT || '3001',
    MCP_HTTP_HOST: import.meta.env.VITE_MCP_HTTP_HOST || 'localhost',
    MCP_HTTP_PORT: import.meta.env.VITE_MCP_HTTP_PORT || '3001',
    MCP_WS_HOST: import.meta.env.VITE_MCP_WS_HOST || 'localhost',
    MCP_WS_PORT: import.meta.env.VITE_MCP_WS_PORT || '3001',
  }
}

// MCP 服务器配置类
class MCPConfig {
  private config = getEnvConfig()

  /**
   * 获取后端 API 基础 URL
   * 用于 MCP 服务器管理接口
   */
  getBackendBaseUrl(): string {
    const { BACKEND_HOST, BACKEND_PORT } = this.config
    return `http://${BACKEND_HOST}:${BACKEND_PORT}/api/v1`
  }

  /**
   * 获取 MCP HTTP 服务器 URL
   * 用于直接调用 MCP 工具
   */
  getMCPHttpUrl(): string {
    const { MCP_HTTP_HOST, MCP_HTTP_PORT } = this.config
    return `http://${MCP_HTTP_HOST}:${MCP_HTTP_PORT}`
  }

  /**
   * 获取 MCP WebSocket 服务器 URL
   * 用于实时通信
   */
  getMCPWebSocketUrl(): string {
    const { MCP_WS_HOST, MCP_WS_PORT } = this.config
    return `ws://${MCP_WS_HOST}:${MCP_WS_PORT}`
  }

  /**
   * 获取 MCP 工具调用 URL
   * @param toolName 工具名称
   */
  getMCPToolUrl(toolName: string): string {
    return `${this.getBackendBaseUrl()}/mcp/tools/${toolName}`
  }

  /**
   * 获取 MCP 状态 URL
   */
  getMCPStatusUrl(): string {
    return `${this.getBackendBaseUrl()}/mcp/status`
  }

  /**
   * 获取 MCP 日志 URL
   */
  getMCPLogsUrl(): string {
    return `${this.getBackendBaseUrl()}/mcp/logs`
  }

  /**
   * 获取 MCP 状态流 URL (SSE)
   */
  getMCPStatusStreamUrl(): string {
    return `${this.getBackendBaseUrl()}/mcp/status/stream`
  }

  /**
   * 获取 MCP 日志流 URL (SSE)
   */
  getMCPLogStreamUrl(): string {
    return `${this.getBackendBaseUrl()}/mcp/logs/stream`
  }

  /**
   * 获取 MCP 启动 URL
   */
  getMCPStartUrl(): string {
    return `${this.getBackendBaseUrl()}/mcp/start`
  }

  /**
   * 获取 MCP 停止 URL
   */
  getMCPStopUrl(): string {
    return `${this.getBackendBaseUrl()}/mcp/stop`
  }

  /**
   * 获取连接测试 URL
   */
  getMCPPingUrl(): string {
    return `${this.getBackendBaseUrl()}/mcp/ping`
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