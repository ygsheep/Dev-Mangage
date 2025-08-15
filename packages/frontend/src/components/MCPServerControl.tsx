import React, { useState, useEffect } from 'react'
import { 
  Server, 
  Play, 
  Square, 
  RefreshCw, 
  Activity, 
  Wifi, 
  WifiOff, 
  Terminal,
  Database,
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react'
import { debug, useDebugComponent } from '../debug'
import { mcpServerAPI, MCPServerStatus, MCPServerLog } from '../api/mcpServer'
import { useMCPConfig, useMCPConnection } from '../hooks/useMCPConfig'

const MCPServerControl: React.FC = () => {
  // 使用 MCP 配置管理
  const { config, urls, isValid } = useMCPConfig()
  const { isConnected, isChecking } = useMCPConnection()
  
  const [serverStatus, setServerStatus] = useState<MCPServerStatus>({
    isRunning: false,
    port: parseInt(config.BACKEND_PORT),
    uptime: 0,
    requestCount: 0,
    lastActivity: null,
    vectorSearchStatus: 'idle',
    databaseStatus: 'disconnected'
  })
  
  const [isStarting, setIsStarting] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [logs, setLogs] = useState<MCPServerLog[]>([])
  const [showLogs, setShowLogs] = useState(false)

  // 调试组件状态跟踪
  useDebugComponent('MCPServerControl', {
    serverStatus,
    isStarting,
    isStopping,
    showLogs,
    isConnected,
    timestamp: Date.now()
  })

  // 初始化：获取服务器状态
  useEffect(() => {
    const initializeStatus = async () => {
      if (isConnected) {
        try {
          const status = await mcpServerAPI.getStatus()
          setServerStatus(prev => ({
            ...prev,
            ...status,
            port: parseInt(config.BACKEND_PORT)
          }))
          
          // 获取最近的日志
          const recentLogs = await mcpServerAPI.getLogs(20)
          setLogs(recentLogs)
        } catch (error) {
          debug.error('初始化状态失败', error, 'MCPServerControl')
        }
      }
    }
    
    initializeStatus()
  }, [isConnected]) // 移除config依赖，避免过度触发

  // 设置状态流和日志流
  useEffect(() => {
    if (!isConnected) return

    // 创建状态更新流
    const statusStream = mcpServerAPI.createStatusStream((status) => {
      setServerStatus(status)
    })

    // 创建日志流
    const logStream = mcpServerAPI.createLogStream((log) => {
      setLogs(prev => [...prev.slice(-19), log]) // 保留最近20条
    })

    return () => {
      statusStream?.close()
      logStream?.close()
    }
  }, [isConnected])

  // 定时刷新状态（暂时禁用）
  useEffect(() => {
    // 暂时禁用定时刷新，避免无限循环
    // if (!isConnected) return
    // let isRequesting = false
    // const interval = setInterval(async () => {
    //   if (isRequesting) return
    //   isRequesting = true
    //   try {
    //     const status = await mcpServerAPI.getStatus()
    //     setServerStatus(status)
    //   } catch (error) {
    //     debug.error('定时获取状态失败', error, 'MCPServerControl')
    //   } finally {
    //     isRequesting = false
    //   }
    // }, 30000)
    // return () => clearInterval(interval)
  }, [isConnected])

  const startServer = async () => {
    if (isStarting || serverStatus.isRunning) return
    
    setIsStarting(true)
    
    try {
      const result = await mcpServerAPI.start()
      
      if (result.success) {
        debug.log('MCP Server启动成功', result, 'MCPServerControl')
        // 状态会通过流更新
      } else {
        debug.error('MCP Server启动失败', result.message, 'MCPServerControl')
        setLogs(prev => [...prev, {
          timestamp: new Date().toISOString(),
          level: 'error',
          message: result.message
        }])
      }
      
    } catch (error) {
      debug.error('启动请求失败', error, 'MCPServerControl')
    } finally {
      setIsStarting(false)
    }
  }

  const stopServer = async () => {
    if (isStopping || !serverStatus.isRunning) return
    
    setIsStopping(true)
    
    try {
      const result = await mcpServerAPI.stop()
      
      if (result.success) {
        debug.log('MCP Server停止成功', result, 'MCPServerControl')
      } else {
        debug.error('MCP Server停止失败', result.message, 'MCPServerControl')
        setLogs(prev => [...prev, {
          timestamp: new Date().toISOString(),
          level: 'error',
          message: result.message
        }])
      }
      
    } catch (error) {
      debug.error('停止请求失败', error, 'MCPServerControl')
    } finally {
      setIsStopping(false)
    }
  }

  const restartServer = async () => {
    try {
      const result = await mcpServerAPI.restart()
      
      if (result.success) {
        debug.log('MCP Server重启成功', result, 'MCPServerControl')
      } else {
        debug.error('MCP Server重启失败', result.message, 'MCPServerControl')
      }
      
    } catch (error) {
      debug.error('重启请求失败', error, 'MCPServerControl')
    }
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}时${minutes}分${secs}秒`
    } else if (minutes > 0) {
      return `${minutes}分${secs}秒`
    } else {
      return `${secs}秒`
    }
  }


  const getStatusIcon = () => {
    if (isStarting) return <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
    if (isStopping) return <RefreshCw className="h-5 w-5 animate-spin text-orange-500" />
    if (!serverStatus.isRunning) return <Server className="h-5 w-5 text-gray-500" />
    return <Activity className="h-5 w-5 text-green-500" />
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">MCP 服务器</h3>
            <p className="text-sm text-gray-500">
              {serverStatus.isRunning ? (
                <span className="flex items-center space-x-2">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>运行中 - 端口 {serverStatus.port}</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <span className="inline-block w-2 h-2 bg-gray-400 rounded-full"></span>
                  <span>已停止</span>
                </span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="查看日志"
          >
            <Terminal className="h-4 w-4" />
          </button>
          
          <button
            onClick={restartServer}
            disabled={isStarting || isStopping}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="重启服务器"
          >
            <RefreshCw className={`h-4 w-4 ${(isStarting || isStopping) ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="flex space-x-3 mb-6">
        {!serverStatus.isRunning ? (
          <button
            onClick={startServer}
            disabled={isStarting}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isStarting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            <span>{isStarting ? '启动中...' : '启动服务器'}</span>
          </button>
        ) : (
          <button
            onClick={stopServer}
            disabled={isStopping}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isStopping ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            <span>{isStopping ? '停止中...' : '停止服务器'}</span>
          </button>
        )}
      </div>

      {/* 连接和配置状态 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm font-medium text-gray-700">连接状态</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className={`text-sm font-medium ${
              isConnected ? 'text-green-600' : 'text-red-600'
            }`}>
              {isChecking ? '检查中...' : (isConnected ? '已连接' : '断开连接')}
            </span>
          </div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <Server className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">服务地址</span>
          </div>
          <p className="text-xs font-mono text-gray-900">{urls.backend}</p>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            {isValid ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm font-medium text-gray-700">配置状态</span>
          </div>
          <span className={`text-sm font-medium ${
            isValid ? 'text-green-600' : 'text-red-600'
          }`}>
            {isValid ? '配置正常' : '配置错误'}
          </span>
        </div>
      </div>

      {/* 服务状态 */}
      {serverStatus.isRunning && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">运行时间</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">{formatUptime(serverStatus.uptime)}</p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Zap className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">请求数</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">{serverStatus.requestCount.toLocaleString()}</p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Database className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">数据库</span>
            </div>
            <div className="flex items-center space-x-1">
              {serverStatus.databaseStatus === 'connected' ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm font-medium text-gray-900">
                {serverStatus.databaseStatus === 'connected' ? '已连接' : '断开'}
              </span>
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Search className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">向量搜索</span>
            </div>
            <div className="flex items-center space-x-1">
              {serverStatus.vectorSearchStatus === 'ready' ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : serverStatus.vectorSearchStatus === 'fallback' ? (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              ) : (
                <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
              )}
              <span className="text-sm font-medium text-gray-900">
                {serverStatus.vectorSearchStatus === 'ready' ? '向量模型' : 
                 serverStatus.vectorSearchStatus === 'fallback' ? 'TF-IDF' : '初始化中'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 模型信息 */}
      {serverStatus.modelInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              serverStatus.modelInfo.type === 'vector' ? 'bg-blue-100' : 'bg-yellow-100'
            }`}>
              {serverStatus.modelInfo.type === 'vector' ? (
                <Wifi className="h-5 w-5 text-blue-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-yellow-600" />
              )}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{serverStatus.modelInfo.name}</h4>
              <p className="text-sm text-gray-600">
                大小: {serverStatus.modelInfo.size} | 类型: {
                  serverStatus.modelInfo.type === 'vector' ? '深度学习向量模型' : '关键词匹配算法'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 连接状态指示 */}
      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <h3 className="font-medium text-yellow-900">后端连接断开</h3>
              <p className="text-sm text-yellow-700">
                无法连接到后端服务器，请确保后端服务正在运行 (http://localhost:3320)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 日志显示 */}
      {showLogs && (
        <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm max-h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">暂无日志</p>
          ) : (
            logs.map((log, index) => {
              const timestamp = new Date(log.timestamp).toLocaleTimeString()
              const levelColor = log.level === 'error' ? 'text-red-400' : 
                                log.level === 'warn' ? 'text-yellow-400' : 'text-green-400'
              return (
                <div key={index} className="mb-1">
                  <span className="text-gray-500">[{timestamp}]</span>
                  <span className={`ml-2 ${levelColor}`}>{log.message}</span>
                  {log.source && <span className="text-gray-400 ml-2">({log.source})</span>}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export default MCPServerControl