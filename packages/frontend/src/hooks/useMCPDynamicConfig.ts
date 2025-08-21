import { useState, useEffect, useCallback } from 'react'
import { mcpServerAPI, MCPConfig } from '../api/mcpServer'
import { debug } from '../debug'

/**
 * 动态MCP配置管理Hook
 * 从后端获取实时配置信息，替代硬编码配置
 */
export const useMCPDynamicConfig = () => {
  const [config, setConfig] = useState<MCPConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  /**
   * 从后端获取配置
   */
  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      debug.log('开始获取MCP动态配置', {}, 'useMCPDynamicConfig')
      
      const freshConfig = await mcpServerAPI.getConfig()
      setConfig(freshConfig)
      setLastUpdated(new Date())
      
      debug.log('MCP动态配置获取成功', {
        timestamp: freshConfig.timestamp,
        toolsCount: freshConfig.tools.count,
        backend: freshConfig.backend,
        mcpHttp: freshConfig.mcp.http
      }, 'useMCPDynamicConfig')
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      setError(errorMessage)
      debug.error('获取MCP动态配置失败', error, 'useMCPDynamicConfig')
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * 刷新配置
   */
  const refreshConfig = useCallback(() => {
    debug.log('手动刷新MCP配置', {}, 'useMCPDynamicConfig')
    return fetchConfig()
  }, [fetchConfig])

  /**
   * 获取后端基础URL
   */
  const getBackendBaseUrl = useCallback((): string => {
    if (!config) return 'http://localhost:3000/api/v1'
    return `${config.backend.url}${config.backend.apiBaseUrl}`
  }, [config])

  /**
   * 获取MCP HTTP URL
   */
  const getMCPHttpUrl = useCallback((): string => {
    if (!config) return 'http://localhost:3000'
    return config.mcp.http.url
  }, [config])

  /**
   * 获取MCP工具URL
   */
  const getMCPToolUrl = useCallback((toolName: string): string => {
    if (!config) return `http://localhost:3000/api/v1/mcp/tools/${toolName}`
    return `${config.backend.url}${config.backend.apiBaseUrl}/mcp/tools/${toolName}`
  }, [config])

  /**
   * 获取MCP状态URL
   */
  const getMCPStatusUrl = useCallback((): string => {
    if (!config) return 'http://localhost:3000/api/v1/mcp/status'
    return `${config.backend.url}${config.mcp.http.endpoints.status}`
  }, [config])

  /**
   * 获取MCP日志URL
   */
  const getMCPLogsUrl = useCallback((): string => {
    if (!config) return 'http://localhost:3000/api/v1/mcp/logs'
    return `${config.backend.url}${config.mcp.http.endpoints.logs}`
  }, [config])

  /**
   * 获取MCP启动URL
   */
  const getMCPStartUrl = useCallback((): string => {
    if (!config) return 'http://localhost:3000/api/v1/mcp/start'
    return `${config.backend.url}${config.mcp.http.endpoints.start}`
  }, [config])

  /**
   * 获取MCP停止URL
   */
  const getMCPStopUrl = useCallback((): string => {
    if (!config) return 'http://localhost:3000/api/v1/mcp/stop'
    return `${config.backend.url}${config.mcp.http.endpoints.stop}`
  }, [config])

  /**
   * 获取MCP Ping URL
   */
  const getMCPPingUrl = useCallback((): string => {
    if (!config) return 'http://localhost:3000/api/v1/mcp/ping'
    return `${config.backend.url}${config.mcp.http.endpoints.ping}`
  }, [config])

  /**
   * 获取MCP状态流URL（SSE）
   */
  const getMCPStatusStreamUrl = useCallback((): string => {
    if (!config) return 'http://localhost:3000/api/v1/mcp/status/stream'
    return `${config.backend.url}${config.mcp.http.endpoints.status}/stream`
  }, [config])

  /**
   * 获取MCP日志流URL（SSE）
   */
  const getMCPLogStreamUrl = useCallback((): string => {
    if (!config) return 'http://localhost:3000/api/v1/mcp/logs/stream'
    return `${config.backend.url}${config.mcp.http.endpoints.logs}/stream`
  }, [config])

  /**
   * 检查配置是否已加载
   */
  const isConfigReady = useCallback((): boolean => {
    return !loading && config !== null && error === null
  }, [loading, config, error])

  /**
   * 获取配置摘要信息
   */
  const getConfigSummary = useCallback(() => {
    if (!config) return null
    
    return {
      backendUrl: config.backend.url,
      mcpUrl: config.mcp.http.url,
      toolsCount: config.tools.count,
      isRunning: config.status.isRunning,
      environment: config.runtime.environment,
      lastUpdated: lastUpdated?.toLocaleString(),
      configTimestamp: new Date(config.timestamp).toLocaleString()
    }
  }, [config, lastUpdated])

  // 组件挂载时获取配置
  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  // 定时刷新配置（每5分钟）
  useEffect(() => {
    if (!config) return

    const interval = setInterval(() => {
      debug.log('定时刷新MCP配置', {}, 'useMCPDynamicConfig')
      fetchConfig()
    }, 5 * 60 * 1000) // 5分钟

    return () => clearInterval(interval)
  }, [config, fetchConfig])

  return {
    // 状态
    config,
    loading,
    error,
    lastUpdated,
    
    // 操作
    refreshConfig,
    
    // URL获取器
    getBackendBaseUrl,
    getMCPHttpUrl,
    getMCPToolUrl,
    getMCPStatusUrl,
    getMCPLogsUrl,
    getMCPStartUrl,
    getMCPStopUrl,
    getMCPPingUrl,
    getMCPStatusStreamUrl,
    getMCPLogStreamUrl,
    
    // 工具方法
    isConfigReady,
    getConfigSummary
  }
}

export default useMCPDynamicConfig