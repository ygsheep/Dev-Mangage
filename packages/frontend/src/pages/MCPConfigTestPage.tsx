import React, { useEffect, useState } from 'react'
import { useMCPDynamicConfig } from '../hooks/useMCPDynamicConfig'
import { mcpConfig } from '../config/mcpConfig'

/**
 * MCP配置测试页面
 * 用于验证动态配置功能是否正常工作
 */
export const MCPConfigTestPage: React.FC = () => {
  const {
    config,
    loading,
    error,
    lastUpdated,
    refreshConfig,
    getBackendBaseUrl,
    getMCPHttpUrl,
    isConfigReady,
    getConfigSummary
  } = useMCPDynamicConfig()

  const [staticConfig, setStaticConfig] = useState<any>(null)

  useEffect(() => {
    // 获取静态配置用于对比
    setStaticConfig({
      backendBaseUrl: mcpConfig.getBackendBaseUrl(),
      mcpHttpUrl: mcpConfig.getMCPHttpUrl(),
      configType: mcpConfig.getConfigType(),
      isDynamicEnabled: mcpConfig.isDynamicConfigEnabled()
    })
  }, [])

  const handleRefreshConfig = async () => {
    await refreshConfig()
    // 同时刷新静态配置显示
    setStaticConfig({
      backendBaseUrl: mcpConfig.getBackendBaseUrl(),
      mcpHttpUrl: mcpConfig.getMCPHttpUrl(),
      configType: mcpConfig.getConfigType(),
      isDynamicEnabled: mcpConfig.isDynamicConfigEnabled()
    })
  }

  const handleRefreshStaticConfig = async () => {
    await mcpConfig.refreshDynamicConfig()
    setStaticConfig({
      backendBaseUrl: mcpConfig.getBackendBaseUrl(),
      mcpHttpUrl: mcpConfig.getMCPHttpUrl(),
      configType: mcpConfig.getConfigType(),
      isDynamicEnabled: mcpConfig.isDynamicConfigEnabled()
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">MCP配置测试</h1>
          <p className="text-muted-foreground mt-2">
            验证动态MCP配置功能是否正常工作
          </p>
        </div>
        <div className="flex gap-2">
          <div 
            onClick={handleRefreshConfig} 
            className={`px-4 py-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600 transition-colors ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? '刷新中...' : '刷新Hook配置'}
          </div>
          <div 
            onClick={handleRefreshStaticConfig} 
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded cursor-pointer hover:bg-gray-50 transition-colors"
          >
            刷新静态配置
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 动态配置 Hook */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              🔄 动态配置 Hook
              {isConfigReady() && <span className="text-green-500 text-sm">✓ 已就绪</span>}
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              使用 useMCPDynamicConfig Hook 获取的配置
            </p>
          </div>
          <div className="px-6 pb-6 space-y-4">
            {loading && (
              <div className="text-blue-500">⏳ 正在加载配置...</div>
            )}
            
            {error && (
              <div className="text-red-500 p-3 bg-red-50 rounded-md">
                ❌ 错误: {error}
              </div>
            )}
            
            {config && (
              <div className="space-y-3">
                <div>
                  <strong>配置状态:</strong>
                  <div className="text-sm text-gray-600 mt-1">
                    <div>✅ 配置已加载</div>
                    <div>🕒 最后更新: {lastUpdated?.toLocaleString()}</div>
                    <div>📊 配置时间戳: {new Date(config.timestamp).toLocaleString()}</div>
                  </div>
                </div>
                
                <div>
                  <strong>URL 配置:</strong>
                  <div className="text-sm font-mono bg-gray-100 p-2 rounded mt-1">
                    <div>Backend: {getBackendBaseUrl()}</div>
                    <div>MCP HTTP: {getMCPHttpUrl()}</div>
                  </div>
                </div>
                
                <div>
                  <strong>服务状态:</strong>
                  <div className="text-sm text-gray-600 mt-1">
                    <div>🌍 环境: {config.runtime.environment}</div>
                    <div>🚀 MCP运行: {config.status.isRunning ? '是' : '否'}</div>
                    <div>🛠️ 工具数量: {config.tools.count}</div>
                  </div>
                </div>

                <div>
                  <strong>配置摘要:</strong>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                    {JSON.stringify(getConfigSummary(), null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 静态配置类 */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              ⚙️ 静态配置类
              {staticConfig?.isDynamicEnabled && <span className="text-green-500 text-sm">✓ 已启用动态</span>}
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              使用 mcpConfig 单例获取的配置
            </p>
          </div>
          <div className="px-6 pb-6 space-y-4">
            {staticConfig && (
              <div className="space-y-3">
                <div>
                  <strong>配置类型:</strong>
                  <div className="text-sm mt-1">
                    <span className={`px-2 py-1 rounded text-xs ${
                      staticConfig.configType === 'dynamic' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {staticConfig.configType === 'dynamic' ? '🔄 动态配置' : '📌 静态配置'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <strong>URL 配置:</strong>
                  <div className="text-sm font-mono bg-gray-100 p-2 rounded mt-1">
                    <div>Backend: {staticConfig.backendBaseUrl}</div>
                    <div>MCP HTTP: {staticConfig.mcpHttpUrl}</div>
                  </div>
                </div>
                
                <div>
                  <strong>功能状态:</strong>
                  <div className="text-sm text-gray-600 mt-1">
                    <div>动态配置: {staticConfig.isDynamicEnabled ? '✅ 已启用' : '❌ 未启用'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 完整配置数据 */}
      {config && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold">📋 完整配置数据</h3>
            <p className="text-gray-600 text-sm mt-1">
              从后端获取的完整MCP配置信息
            </p>
          </div>
          <div className="px-6 pb-6">
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(config, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

export default MCPConfigTestPage