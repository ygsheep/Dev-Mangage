import React, { useState, useEffect } from 'react'
import { X, Brain, Settings, AlertCircle, CheckCircle, Download, Loader2, RefreshCw } from 'lucide-react'
import { AIParsingConfig } from '../../../services/aiParsingService'
import OllamaService, { OllamaModel, RECOMMENDED_MODELS, DEEPSEEK_MODELS, OPENAI_MODELS } from '../../../services/ollamaService'
import toast from 'react-hot-toast'

interface AIConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (config: AIParsingConfig) => void
  currentConfig?: AIParsingConfig
}

const AIConfigModal: React.FC<AIConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentConfig
}) => {
  const [config, setConfig] = useState<AIParsingConfig>({
    provider: 'ollama',
    model: 'qwen2.5-coder:7b',
    baseUrl: 'http://localhost:11434'
  })
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'success' | 'error' | null>(null)
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [installedModels, setInstalledModels] = useState<OllamaModel[]>([])
  const [availableModels, setAvailableModels] = useState<any[]>([])
  const [showModelInstaller, setShowModelInstaller] = useState(false)

  useEffect(() => {
    if (currentConfig) {
      setConfig(currentConfig)
    }
  }, [currentConfig])

  useEffect(() => {
    // 当提供商改变或弹窗打开时，更新可用模型列表
    if (isOpen) {
      updateAvailableModels()
    }
  }, [isOpen, config.provider])

  const updateAvailableModels = () => {
    switch (config.provider) {
      case 'ollama':
        loadOllamaModels()
        break
      case 'deepseek':
        setAvailableModels(DEEPSEEK_MODELS)
        break
      case 'openai':
        setAvailableModels(OPENAI_MODELS)
        break
    }
  }

  const loadOllamaModels = async () => {
    setIsLoadingModels(true)
    try {
      const ollamaService = new OllamaService(config.baseUrl)
      const models = await ollamaService.getInstalledModels()
      setInstalledModels(models)
      
      // 如果没有安装模型，显示推荐模型
      if (models.length === 0) {
        setAvailableModels(RECOMMENDED_MODELS.filter(m => m.category === 'code'))
        setShowModelInstaller(true)
      } else {
        setAvailableModels(models)
        setShowModelInstaller(false)
      }
    } catch (error) {
      console.error('加载Ollama模型失败:', error)
      setAvailableModels(RECOMMENDED_MODELS.filter(m => m.category === 'code'))
      setShowModelInstaller(true)
      toast.error('无法连接到Ollama服务，请确保Ollama已启动')
    } finally {
      setIsLoadingModels(false)
    }
  }

  if (!isOpen) return null

  const handleConfigChange = (field: keyof AIParsingConfig, value: string) => {
    setConfig(prev => {
      const newConfig = { ...prev, [field]: value }
      
      // 如果切换到deepseek，清空baseUrl
      if (field === 'provider' && value === 'deepseek') {
        newConfig.baseUrl = ''
      }
      // 如果切换到openai，可以保持baseUrl为空或现有值
      else if (field === 'provider' && value === 'openai') {
        // 保持现有的baseUrl或为空
      }
      // 如果切换到ollama，设置默认的baseUrl
      else if (field === 'provider' && value === 'ollama' && !newConfig.baseUrl) {
        newConfig.baseUrl = 'http://localhost:11434'
      }
      
      return newConfig
    })
    setConnectionStatus(null)
  }

  const testConnection = async () => {
    setIsTestingConnection(true)
    setConnectionStatus(null)

    try {
      let testUrl: string
      let testHeaders: Record<string, string>

      switch (config.provider) {
        case 'ollama':
          testUrl = `${config.baseUrl}/api/tags`
          testHeaders = { 'Content-Type': 'application/json' }
          break

        case 'deepseek':
          testUrl = 'https://api.deepseek.com/v1/models'
          testHeaders = {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
          }
          break

        case 'openai':
          testUrl = `${config.baseUrl || 'https://api.openai.com'}/v1/models`
          testHeaders = {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
          }
          break

        default:
          throw new Error('不支持的提供商')
      }

      const response = await fetch(testUrl, {
        method: 'GET',
        headers: testHeaders
      })

      if (response.ok) {
        setConnectionStatus('success')
        toast.success('连接测试成功')
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error: any) {
      setConnectionStatus('error')
      toast.error('连接测试失败: ' + error.message)
    } finally {
      setIsTestingConnection(false)
    }
  }

  const handleSave = () => {
    if (!config.model.trim()) {
      toast.error('请输入模型名称')
      return
    }

    if (config.provider !== 'ollama' && !config.apiKey?.trim()) {
      toast.error('请输入API密钥')
      return
    }

    onSave(config)
    toast.success('AI配置已保存')
    onClose()
  }

  const getProviderInfo = (provider: string) => {
    switch (provider) {
      case 'ollama':
        return {
          name: 'Ollama Local',
          displayName: 'Ollama Local',
          description: '本地AI模型服务，支持多种开源模型',
          icon: '/static/images/Ollama.png',
          pros: ['完全本地运行', '数据安全', '无API费用', '支持离线使用'],
          cons: ['需要本地安装', '占用计算资源']
        }
      case 'deepseek':
        return {
          name: 'DeepSeek Coder',
          displayName: 'DeepSeek Coder',
          description: 'DeepSeek专业代码生成模型',
          icon: '/static/images/deepseek.png',
          pros: ['性价比极高', '代码理解能力强', '中文支持好', '响应速度快'],
          cons: ['需要网络连接', '按使用量付费']
        }
      case 'openai':
        return {
          name: 'OpenAI GPT',
          displayName: 'OpenAI GPT',
          description: 'OpenAI官方API服务，包括GPT-4等模型',
          icon: '/static/images/openai.png',
          pros: ['理解能力最强', '稳定性好', '生态完善'],
          cons: ['价格较高', '需要网络连接', '国内访问限制']
        }
      default:
        return null
    }
  }

  const providerInfo = getProviderInfo(config.provider)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center space-x-3">
            <Brain className="w-8 h-8 text-blue-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">AI解析配置</h2>
              <p className="text-gray-600">配置AI服务提供商和模型参数</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* 详细配置 */}
          <div className="space-y-6">

            {/* AI提供商选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI服务提供商
              </label>
              
              <div className="grid grid-cols-1 gap-3">
                {['ollama', 'deepseek', 'openai'].map((provider) => {
                  const info = getProviderInfo(provider)
                  return (
                    <label
                      key={provider}
                      className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                        config.provider === provider
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="provider"
                          value={provider}
                          checked={config.provider === provider}
                          onChange={(e) => handleConfigChange('provider', e.target.value)}
                          className="rounded border-gray-300"
                        />
                        {info?.icon && (
                          <img 
                            src={info.icon} 
                            alt={info.displayName} 
                            className="w-8 h-8 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        )}
                        <div>
                          <span className="font-medium text-sm">{info?.displayName}</span>
                          <p className="text-xs text-gray-500 mt-1">{info?.description}</p>
                        </div>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                    </label>
                  )
                })}
              </div>
            </div>

            {/* 提供商信息展示 */}
            {providerInfo && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  {providerInfo.icon && (
                    <img 
                      src={providerInfo.icon} 
                      alt={providerInfo.displayName} 
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                  <span className="font-medium text-gray-900">{providerInfo.name}</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{providerInfo.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-green-700 mb-1">优势:</div>
                    <ul className="text-green-600 space-y-1">
                      {providerInfo.pros.map((pro, index) => (
                        <li key={index}>• {pro}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="font-medium text-orange-700 mb-1">注意:</div>
                    <ul className="text-orange-600 space-y-1">
                      {providerInfo.cons.map((con, index) => (
                        <li key={index}>• {con}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* 模型选择 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  模型选择
                </label>
                {config.provider === 'ollama' && (
                  <button
                    onClick={loadOllamaModels}
                    disabled={isLoadingModels}
                    className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingModels ? 'animate-spin' : ''}`} />
                    <span>刷新</span>
                  </button>
                )}
              </div>
              
              {isLoadingModels ? (
                <div className="flex items-center justify-center py-8 border border-gray-300 rounded-lg">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />
                  <span className="text-sm text-gray-600">加载模型列表...</span>
                </div>
              ) : (
                <select
                  value={config.model}
                  onChange={(e) => handleConfigChange('model', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {availableModels.map((model) => (
                    <option key={model.name || model.model} value={model.name || model.model}>
                      {model.name || model.model} 
                      {model.description && ` - ${model.description}`}
                      {model.size && ` (${typeof model.size === 'number' ? OllamaService.formatModelSize(model.size) : model.size})`}
                    </option>
                  ))}
                </select>
              )}
              
              {/* Ollama模型安装提示 */}
              {config.provider === 'ollama' && showModelInstaller && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Download className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-yellow-800">
                      <div className="font-medium mb-1">未检测到已安装的模型</div>
                      <div className="mb-2">请使用以下命令安装推荐模型：</div>
                      <code className="bg-yellow-100 px-2 py-1 rounded text-xs">
                        ollama pull {config.model}
                      </code>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 已安装模型状态 */}
              {config.provider === 'ollama' && installedModels.length > 0 && (
                <div className="mt-2 text-xs text-green-600">
                  ✓ 检测到 {installedModels.length} 个已安装模型
                </div>
              )}
            </div>

            {/* Base URL */}
            {config.provider !== 'deepseek' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base URL
                </label>
                <input
                  type="url"
                  value={config.baseUrl || ''}
                  onChange={(e) => handleConfigChange('baseUrl', e.target.value)}
                  placeholder={
                    config.provider === 'ollama' ? 'http://localhost:11434' :
                    config.provider === 'openai' ? '留空使用默认地址' :
                    ''
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {config.provider === 'openai' && (
                  <p className="mt-1 text-sm text-gray-500">
                    留空将使用默认的 OpenAI API 地址
                  </p>
                )}
              </div>
            )}

            {/* API密钥 */}
            {config.provider !== 'ollama' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API密钥
                </label>
                <input
                  type="password"
                  value={config.apiKey || ''}
                  onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                  placeholder="请输入API密钥"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  API密钥将安全存储在本地，不会上传到服务器
                </p>
              </div>
            )}

            {/* 连接测试 */}
            <div className="flex items-center space-x-3">
              <button
                onClick={testConnection}
                disabled={isTestingConnection}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isTestingConnection ? (
                  <>
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>测试中...</span>
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4" />
                    <span>测试连接</span>
                  </>
                )}
              </button>

              {connectionStatus === 'success' && (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">连接成功</span>
                </div>
              )}

              {connectionStatus === 'error' && (
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">连接失败</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            配置将保存在本地，用于API文档和数据库文档的智能解析
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="btn-outline"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="btn-primary"
            >
              保存配置
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIConfigModal