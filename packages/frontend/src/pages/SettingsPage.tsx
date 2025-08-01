import React, { useState } from 'react'
import { 
  Settings, 
  Server, 
  Database, 
  Search, 
  Palette, 
  Bell, 
  Shield,
  Info,
  Copy,
  Code,
  Download
} from 'lucide-react'
import MCPServerControl from '../components/MCPServerControl'
import { debug, useDebugComponent } from '../debug'
import { useMCPConfig } from '../hooks/useMCPConfig'

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('mcp-server')
  const [copiedConfig, setCopiedConfig] = useState<string | null>(null)
  const [clientType, setClientType] = useState<'trae' | 'claude'>('claude')
  
  // 使用 MCP 配置管理
  const { config, urls, updateConfig, isValid, validation } = useMCPConfig()
  const [serverHost, setServerHost] = useState(config.BACKEND_HOST)
  const [serverPort, setServerPort] = useState(config.BACKEND_PORT)

  // 生成 MCP 服务器配置
  const generateMCPConfig = () => {
    if (clientType === 'trae') {
      return {
        mcpServers: {
          "devapi-manager": {
            command: "node",
            args: ["d:\\Code\\Dev-Mangage\\packages\\mcp-server\\dist\\index.js"],
            env: {
              NODE_ENV: "development",
              DATABASE_URL: "file:d:\\Code\\Dev-Mangage\\packages\\backend\\prisma\\dev.db",
              PORT: serverPort
            }
          }
        }
      }
    } else {
      return {
        mcpServers: {
          "devapi-manager": {
            command: "node",
            args: ["./packages/mcp-server/dist/index.js"],
            env: {
              NODE_ENV: "development",
              DATABASE_URL: "file:./packages/backend/prisma/dev.db",
              PORT: serverPort
            }
          }
        }
      }
    }
  }

  // 生成生产环境配置
  const generateProductionConfig = () => {
    if (clientType === 'trae') {
      return {
        mcpServers: {
          "devapi-manager": {
            command: "node",
            args: ["d:\\Code\\Dev-Mangage\\packages\\mcp-server\\dist\\index.js"],
            env: {
              NODE_ENV: "production",
              DATABASE_URL: "file:d:\\Code\\Dev-Mangage\\packages\\backend\\prisma\\dev.db",
              PORT: serverPort
            }
          }
        }
      }
    } else {
      return {
        mcpServers: {
          "devapi-manager": {
            command: "node",
            args: ["./dist/index.js"],
            env: {
              NODE_ENV: "production",
              DATABASE_URL: "file:./data/production.db",
              PORT: serverPort
            }
          }
        }
      }
    }
  }

  // 生成 Trae AI HTTP 配置
  const generateTraeHTTPConfig = () => {
    return {
      mcpServers: {
        "devapi-manager-http": {
          command: "node",
          args: ["-e", `console.log('HTTP MCP Server: ${urls.httpServer}')`],
          env: {
            MCP_SERVER_URL: urls.httpServer
          }
        }
      }
    }
  }

  // 生成 URL 形式配置（HTTP/WebSocket）
  const generateURLConfig = () => {
    return {
      mcpServers: {
        "dev-manage-mcp-url": {
          url: `${urls.httpServer}/mcp`,
          transport: "http"
        }
      }
    }
  }

  // 生成 WebSocket 配置
  const generateWebSocketConfig = () => {
    return {
      mcpServers: {
        "dev-manage-mcp-ws": {
          url: `${urls.websocket}/mcp/ws`,
          transport: "websocket"
        }
      }
    }
  }

  // 复制配置到剪贴板
  const copyConfig = (configType: 'development' | 'production' | 'http' | 'websocket' | 'trae-http') => {
    let config
    switch (configType) {
      case 'development':
        config = generateMCPConfig()
        break
      case 'production':
        config = generateProductionConfig()
        break
      case 'http':
        config = generateURLConfig()
        break
      case 'websocket':
        config = generateWebSocketConfig()
        break
      case 'trae-http':
        config = generateTraeHTTPConfig()
        break
      default:
        config = generateMCPConfig()
    }
    const configString = JSON.stringify(config, null, 2)
    navigator.clipboard.writeText(configString)
    setCopiedConfig(configType)
    setTimeout(() => setCopiedConfig(null), 2000)
  }

  // 下载配置文件
  const downloadConfig = (configType: 'development' | 'production' | 'http' | 'websocket' | 'trae-http') => {
    let config
    switch (configType) {
      case 'development':
        config = generateMCPConfig()
        break
      case 'production':
        config = generateProductionConfig()
        break
      case 'http':
        config = generateURLConfig()
        break
      case 'websocket':
        config = generateWebSocketConfig()
        break
      case 'trae-http':
        config = generateTraeHTTPConfig()
        break
      default:
        config = generateMCPConfig()
    }
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mcp-server-config-${configType}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 调试组件状态跟踪
  useDebugComponent('SettingsPage', {
    activeTab,
    serverHost,
    serverPort,
    timestamp: Date.now()
  })

  const tabs = [
    {
      id: 'mcp-server',
      name: 'MCP 服务器',
      icon: Server,
      description: '向量搜索服务管理'
    },
    {
      id: 'database',
      name: '数据库',
      icon: Database,
      description: '数据存储设置'
    },
    {
      id: 'search',
      name: '搜索设置',
      icon: Search,
      description: '搜索引擎配置'
    },
    {
      id: 'appearance',
      name: '外观',
      icon: Palette,
      description: '主题和界面设置'
    },
    {
      id: 'notifications',
      name: '通知',
      icon: Bell,
      description: '消息提醒设置'
    },
    {
      id: 'security',
      name: '安全',
      icon: Shield,
      description: '权限和安全设置'
    }
  ]

  const handleTabChange = (tabId: string) => {
    debug.log('用户切换设置标签', { 
      from: activeTab, 
      to: tabId 
    }, 'SettingsPage')
    setActiveTab(tabId)
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'mcp-server':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">MCP 服务器管理</h2>
              <p className="text-gray-600 mb-6">
                管理和监控 Model Context Protocol (MCP) 服务器，包括向量搜索、数据库连接和API接口服务。
              </p>
            </div>
            
            <MCPServerControl />
            
            {/* 服务器地址配置 */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">服务器地址配置</h3>
                {!isValid && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                    配置错误
                  </span>
                )}
              </div>
              <p className="text-gray-600 mb-4">
                配置 MCP 服务器的网络地址，用于生成 URL 形式的客户端配置。
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    服务器主机
                  </label>
                  <input
                    type="text"
                    value={serverHost}
                    onChange={(e) => {
                      setServerHost(e.target.value)
                      updateConfig({ BACKEND_HOST: e.target.value })
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      validation.errors.some(err => err.includes('后端主机名'))
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="localhost 或 IP 地址"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    服务器端口
                  </label>
                  <input
                    type="text"
                    value={serverPort}
                    onChange={(e) => {
                      setServerPort(e.target.value)
                      updateConfig({ BACKEND_PORT: e.target.value })
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      validation.errors.some(err => err.includes('后端端口号'))
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="3001"
                  />
                </div>
              </div>
              
              {/* 配置验证错误显示 */}
              {validation.errors.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Info className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-800">
                      <p className="font-medium mb-1">配置错误：</p>
                      <ul className="space-y-1 text-xs">
                        {validation.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 当前生成的 URLs 预览 */}
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-800">
                    <p className="font-medium mb-1">当前配置预览：</p>
                    <ul className="space-y-1 text-xs font-mono">
                      <li>• <strong>后端 API</strong>: {urls.backend}</li>
                      <li>• <strong>MCP HTTP</strong>: {urls.httpServer}</li>
                      <li>• <strong>WebSocket</strong>: {urls.websocket}</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">地址说明：</p>
                    <ul className="space-y-1 text-xs">
                      <li>• <strong>localhost</strong>：本地开发环境</li>
                      <li>• <strong>IP地址</strong>：局域网或远程服务器地址</li>
                      <li>• <strong>端口</strong>：MCP 服务器监听的端口号（默认 3001）</li>
                      <li>• <strong>配置实时生效</strong>：修改后立即应用到所有 URL</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            {/* MCP 服务器配置 JSON */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">客户端配置</h3>
              </div>
              
              {/* 客户端类型选择器 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  选择客户端类型
                </label>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setClientType('claude')}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      clientType === 'claude'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Claude Desktop
                  </button>
                  <button
                    onClick={() => setClientType('trae')}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      clientType === 'trae'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Trae AI
                  </button>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6">
                将以下配置添加到您的 {clientType === 'claude' ? 'Claude Desktop' : 'Trae AI'} 配置文件中。选择适合您环境的配置：
              </p>
              
              {/* 开发环境配置 */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-md font-medium text-gray-900 flex items-center space-x-2">
                    <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                    <span>开发环境配置</span>
                  </h4>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyConfig('development')}
                      className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedConfig === 'development' ? '已复制' : '复制'}</span>
                    </button>
                    <button
                      onClick={() => downloadConfig('development')}
                      className="flex items-center space-x-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      <span>下载</span>
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">开发环境 MCP 配置</span>
                    <Code className="w-4 h-4 text-gray-500" />
                  </div>
                  <pre className="text-sm text-gray-800 overflow-x-auto">
{JSON.stringify(generateMCPConfig(), null, 2)}
                  </pre>
                </div>
              </div>
              
              {/* 生产环境配置 */}
               <div className="mb-6">
                 <div className="flex items-center justify-between mb-3">
                   <h4 className="text-md font-medium text-gray-900 flex items-center space-x-2">
                     <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                     <span>生产环境配置</span>
                   </h4>
                   <div className="flex space-x-2">
                     <button
                       onClick={() => copyConfig('production')}
                       className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                     >
                       <Copy className="w-3 h-3" />
                       <span>{copiedConfig === 'production' ? '已复制' : '复制'}</span>
                     </button>
                     <button
                       onClick={() => downloadConfig('production')}
                       className="flex items-center space-x-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                     >
                       <Download className="w-3 h-3" />
                       <span>下载</span>
                     </button>
                   </div>
                 </div>
                 
                 <div className="bg-gray-50 rounded-lg p-4 border">
                   <div className="flex items-center justify-between mb-2">
                     <span className="text-sm font-medium text-gray-700">生产环境 MCP 配置</span>
                     <Code className="w-4 h-4 text-gray-500" />
                   </div>
                   <pre className="text-sm text-gray-800 overflow-x-auto">
{JSON.stringify(generateProductionConfig(), null, 2)}
                   </pre>
                 </div>
               </div>
               
               {/* HTTP URL 配置 */}
               <div className="mb-6">
                 <div className="flex items-center justify-between mb-3">
                   <h4 className="text-md font-medium text-gray-900 flex items-center space-x-2">
                     <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                     <span>HTTP URL 配置</span>
                   </h4>
                   <div className="flex space-x-2">
                     <button
                       onClick={() => copyConfig('http')}
                       className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                     >
                       <Copy className="w-3 h-3" />
                       <span>{copiedConfig === 'http' ? '已复制' : '复制'}</span>
                     </button>
                     <button
                       onClick={() => downloadConfig('http')}
                       className="flex items-center space-x-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                     >
                       <Download className="w-3 h-3" />
                       <span>下载</span>
                     </button>
                   </div>
                 </div>
                 
                 <div className="bg-gray-50 rounded-lg p-4 border">
                   <div className="flex items-center justify-between mb-2">
                     <span className="text-sm font-medium text-gray-700">HTTP 传输 MCP 配置</span>
                     <Code className="w-4 h-4 text-gray-500" />
                   </div>
                   <pre className="text-sm text-gray-800 overflow-x-auto">
{JSON.stringify(generateURLConfig(), null, 2)}
                   </pre>
                 </div>
               </div>
               
               {/* WebSocket 配置 */}
               <div className="mb-6">
                 <div className="flex items-center justify-between mb-3">
                   <h4 className="text-md font-medium text-gray-900 flex items-center space-x-2">
                     <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                     <span>WebSocket 配置</span>
                   </h4>
                   <div className="flex space-x-2">
                     <button
                       onClick={() => copyConfig('websocket')}
                       className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                     >
                       <Copy className="w-3 h-3" />
                       <span>{copiedConfig === 'websocket' ? '已复制' : '复制'}</span>
                     </button>
                     <button
                       onClick={() => downloadConfig('websocket')}
                       className="flex items-center space-x-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                     >
                       <Download className="w-3 h-3" />
                       <span>下载</span>
                     </button>
                   </div>
                 </div>
                 
                 <div className="bg-gray-50 rounded-lg p-4 border">
                   <div className="flex items-center justify-between mb-2">
                     <span className="text-sm font-medium text-gray-700">WebSocket 传输 MCP 配置</span>
                     <Code className="w-4 h-4 text-gray-500" />
                   </div>
                   <pre className="text-sm text-gray-800 overflow-x-auto">
{JSON.stringify(generateWebSocketConfig(), null, 2)}
                   </pre>
                 </div>
               </div>
               
               {/* Trae AI HTTP 配置 - 仅在选择 Trae AI 时显示 */}
               {clientType === 'trae' && (
                 <div className="mb-6">
                   <div className="flex items-center justify-between mb-3">
                     <h4 className="text-md font-medium text-gray-900 flex items-center space-x-2">
                       <span className="w-3 h-3 bg-indigo-500 rounded-full"></span>
                       <span>Trae AI HTTP 配置</span>
                     </h4>
                     <div className="flex space-x-2">
                       <button
                         onClick={() => copyConfig('trae-http')}
                         className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                       >
                         <Copy className="w-3 h-3" />
                         <span>{copiedConfig === 'trae-http' ? '已复制' : '复制'}</span>
                       </button>
                       <button
                         onClick={() => downloadConfig('trae-http')}
                         className="flex items-center space-x-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                       >
                         <Download className="w-3 h-3" />
                         <span>下载</span>
                       </button>
                     </div>
                   </div>
                   
                   <div className="bg-gray-50 rounded-lg p-4 border">
                     <div className="flex items-center justify-between mb-2">
                       <span className="text-sm font-medium text-gray-700">Trae AI HTTP MCP 配置</span>
                       <Code className="w-4 h-4 text-gray-500" />
                     </div>
                     <pre className="text-sm text-gray-800 overflow-x-auto">
{JSON.stringify(generateTraeHTTPConfig(), null, 2)}
                     </pre>
                   </div>
                 </div>
               )}
              
              {/* 配置说明 */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                   <div className="flex items-start space-x-2">
                     <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                     <div className="text-sm text-blue-800">
                       <p className="font-medium mb-1">开发环境：</p>
                       <ul className="space-y-1 text-xs">
                         <li>• 本地源码路径</li>
                         <li>• 完整环境变量</li>
                         <li>• 开发调试专用</li>
                       </ul>
                     </div>
                   </div>
                 </div>
                 
                 <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                   <div className="flex items-start space-x-2">
                     <Info className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                     <div className="text-sm text-green-800">
                       <p className="font-medium mb-1">生产环境：</p>
                       <ul className="space-y-1 text-xs">
                         <li>• 构建后代码</li>
                         <li>• 优化配置</li>
                         <li>• 部署环境专用</li>
                       </ul>
                     </div>
                   </div>
                 </div>
                 
                 <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                   <div className="flex items-start space-x-2">
                     <Info className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                     <div className="text-sm text-purple-800">
                       <p className="font-medium mb-1">HTTP 传输：</p>
                       <ul className="space-y-1 text-xs">
                         <li>• RESTful API</li>
                         <li>• 简单易用</li>
                         <li>• 防火墙友好</li>
                       </ul>
                     </div>
                   </div>
                 </div>
                 
                 {clientType === 'claude' ? (
                   <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                     <div className="flex items-start space-x-2">
                       <Info className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                       <div className="text-sm text-orange-800">
                         <p className="font-medium mb-1">WebSocket：</p>
                         <ul className="space-y-1 text-xs">
                           <li>• 实时双向通信</li>
                           <li>• 低延迟</li>
                           <li>• 持久连接</li>
                         </ul>
                       </div>
                     </div>
                   </div>
                 ) : (
                   <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                     <div className="flex items-start space-x-2">
                       <Info className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                       <div className="text-sm text-indigo-800">
                         <p className="font-medium mb-1">Trae AI HTTP：</p>
                         <ul className="space-y-1 text-xs">
                           <li>• 专为 Trae AI 优化</li>
                           <li>• 绝对路径配置</li>
                           <li>• 简化连接方式</li>
                         </ul>
                       </div>
                     </div>
                   </div>
                 )}
               </div>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">使用步骤：</p>
                    <ol className="space-y-1 text-xs list-decimal list-inside">
                      <li>确保已运行 <code className="bg-yellow-100 px-1 rounded">npm run build</code> 构建 MCP 服务器</li>
                      <li>复制对应环境的配置到 {clientType === 'claude' ? 'Claude Desktop' : 'Trae AI'} 配置文件</li>
                      <li>重启 {clientType === 'claude' ? 'Claude Desktop 应用' : 'Trae AI 客户端'}</li>
                      <li>在对话中使用 MCP 工具进行 API 搜索和管理</li>
                      {clientType === 'trae' && (
                        <li>对于 HTTP 配置，确保 MCP 服务器在 http://localhost:3321 运行</li>
                      )}
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900 mb-1">关于 MCP 服务器</h3>
                  <p className="text-sm text-blue-700 mb-2">
                    MCP 服务器提供强大的API搜索和发现功能，支持以下特性：
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• <strong>向量语义搜索</strong> - 使用 all-MiniLM-L6-v2 模型进行深度语义理解</li>
                    <li>• <strong>智能回退机制</strong> - 网络问题时自动使用 TF-IDF 算法</li>
                    <li>• <strong>混合搜索</strong> - 结合关键词匹配和语义相似度</li>
                    <li>• <strong>RAG 增强检索</strong> - 提供智能API推荐和上下文分析</li>
                    <li>• <strong>12个 MCP 工具</strong> - 涵盖项目、API、标签等多维度搜索</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )

      case 'database':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">数据库设置</h2>
              <p className="text-gray-600 mb-6">配置数据存储和备份选项。</p>
            </div>
            
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Prisma 数据库配置</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    数据库类型
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>SQLite (本地)</option>
                    <option>PostgreSQL</option>
                    <option>MySQL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    连接字符串
                  </label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="file:./dev.db"
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 'search':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">搜索引擎设置</h2>
              <p className="text-gray-600 mb-6">配置向量搜索和关键词搜索参数。</p>
            </div>
            
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">向量搜索配置</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    相似度阈值 (0.0 - 1.0)
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.1" 
                    defaultValue="0.3"
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0.0 (宽松)</span>
                    <span>1.0 (严格)</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    最大结果数量
                  </label>
                  <input 
                    type="number" 
                    min="1" 
                    max="50" 
                    defaultValue="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">外观设置</h2>
              <p className="text-gray-600 mb-6">自定义界面主题和字体。</p>
            </div>
            
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">主题配置</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">主题模式</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>浅色模式</option>
                    <option>深色模式</option>
                    <option>跟随系统</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">UI字体</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>OPPO Sans (推荐)</option>
                    <option>系统默认</option>
                    <option>Arial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">代码字体</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>JetBrains Mono Nerd Font (推荐)</option>
                    <option>Fira Code</option>
                    <option>Monaco</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">通知设置</h2>
              <p className="text-gray-600 mb-6">管理应用通知和提醒。</p>
            </div>
            
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">通知偏好</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">MCP服务器状态通知</h4>
                    <p className="text-sm text-gray-500">服务器启动、停止或出错时通知</p>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">搜索性能警告</h4>
                    <p className="text-sm text-gray-500">搜索响应时间过长时提醒</p>
                  </div>
                  <input type="checkbox" className="rounded" />
                </div>
              </div>
            </div>
          </div>
        )

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">安全设置</h2>
              <p className="text-gray-600 mb-6">配置权限和安全选项。</p>
            </div>
            
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">访问控制</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">MCP服务器认证</h4>
                    <p className="text-sm text-gray-500">要求API密钥访问MCP服务</p>
                  </div>
                  <input type="checkbox" className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">本地网络访问</h4>
                    <p className="text-sm text-gray-500">允许局域网内其他设备访问</p>
                  </div>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return <div>选择一个设置选项</div>
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
          <Settings className="h-8 w-8 text-blue-600" />
          <span>系统设置</span>
        </h1>
        <p className="text-gray-600 mt-2">管理应用配置和服务设置</p>
      </div>

      <div className="flex space-x-8">
        {/* 左侧导航 */}
        <div className="w-64 flex-shrink-0">
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon className={`h-5 w-5 ${
                  activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <div>
                  <div className="font-medium">{tab.name}</div>
                  <div className="text-xs text-gray-500">{tab.description}</div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* 右侧内容区域 */}
        <div className="flex-1 min-w-0">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}

export default SettingsPage