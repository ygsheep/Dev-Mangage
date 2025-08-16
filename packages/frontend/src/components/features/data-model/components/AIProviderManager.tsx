import React, { useState, useEffect } from 'react'
import {
  Brain,
  Settings,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  Activity,
  Server,
  Key,
  Globe,
  Zap,
  Clock,
  BarChart3,
  RefreshCw,
  TestTube
} from 'lucide-react'
import {
  getAIProviders,
  createAIProvider,
  updateAIProvider,
  deleteAIProvider,
  testAIProvider,
  getAIProviderStats
} from '../../../../utils/api'
import { toast } from 'react-hot-toast'

interface AIProvider {
  id: string
  name: string
  displayName: string
  type: 'openai' | 'deepseek' | 'ollama' | 'claude' | 'custom'
  endpoint?: string
  apiKey?: string
  model?: string
  maxTokens?: number
  temperature?: number
  isDefault: boolean
  isEnabled: boolean
  createdAt: string
  updatedAt: string
  lastUsed?: string
  stats?: {
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    averageResponseTime: number
    totalTokensUsed: number
    costEstimate: number
  }
}

interface ProviderFormData {
  name: string
  displayName: string
  type: 'openai' | 'deepseek' | 'ollama' | 'claude' | 'custom'
  endpoint?: string
  apiKey?: string
  model?: string
  maxTokens: number
  temperature: number
  isDefault: boolean
  isEnabled: boolean
}

interface AIProviderManagerProps {
  onClose: () => void
}

const PROVIDER_TYPES = [
  { value: 'openai', label: 'OpenAI', icon: '🤖', description: 'OpenAI GPT models' },
  { value: 'deepseek', label: 'DeepSeek', icon: '🧠', description: 'DeepSeek Coder models' },
  { value: 'ollama', label: 'Ollama', icon: '🦙', description: 'Local Ollama models' },
  { value: 'claude', label: 'Claude', icon: '🎭', description: 'Anthropic Claude models' },
  { value: 'custom', label: 'Custom', icon: '⚙️', description: 'Custom API endpoint' }
]

const AIProviderManager: React.FC<AIProviderManagerProps> = ({ onClose }) => {
  const [providers, setProviders] = useState<AIProvider[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null)
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({})
  const [testingProvider, setTestingProvider] = useState<string | null>(null)
  const [formData, setFormData] = useState<ProviderFormData>({
    name: '',
    displayName: '',
    type: 'openai',
    endpoint: '',
    apiKey: '',
    model: '',
    maxTokens: 4000,
    temperature: 0.7,
    isDefault: false,
    isEnabled: true
  })

  // 加载AI提供商列表
  useEffect(() => {
    loadProviders()
  }, [])

  const loadProviders = async () => {
    try {
      setIsLoading(true)
      const response = await getAIProviders()
      if (response.success && response.data) {
        // 加载统计信息
        const providersWithStats = await Promise.all(
          response.data.map(async (provider: AIProvider) => {
            try {
              const statsResponse = await getAIProviderStats(provider.id)
              return {
                ...provider,
                stats: statsResponse.success ? statsResponse.data : undefined
              }
            } catch (error) {
              return provider
            }
          })
        )
        setProviders(providersWithStats)
      }
    } catch (error) {
      console.error('加载AI提供商失败:', error)
      toast.error('加载AI提供商失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateProvider = () => {
    setEditingProvider(null)
    setFormData({
      name: '',
      displayName: '',
      type: 'openai',
      endpoint: '',
      apiKey: '',
      model: '',
      maxTokens: 4000,
      temperature: 0.7,
      isDefault: false,
      isEnabled: true
    })
    setShowForm(true)
  }

  const handleEditProvider = (provider: AIProvider) => {
    setEditingProvider(provider)
    setFormData({
      name: provider.name,
      displayName: provider.displayName,
      type: provider.type,
      endpoint: provider.endpoint || '',
      apiKey: provider.apiKey || '',
      model: provider.model || '',
      maxTokens: provider.maxTokens || 4000,
      temperature: provider.temperature || 0.7,
      isDefault: provider.isDefault,
      isEnabled: provider.isEnabled
    })
    setShowForm(true)
  }

  const handleSubmitForm = async () => {
    try {
      if (editingProvider) {
        const response = await updateAIProvider(editingProvider.id, formData)
        if (response.success) {
          toast.success('AI提供商更新成功')
        } else {
          throw new Error(response.error || '更新失败')
        }
      } else {
        const response = await createAIProvider(formData)
        if (response.success) {
          toast.success('AI提供商创建成功')
        } else {
          throw new Error(response.error || '创建失败')
        }
      }
      
      setShowForm(false)
      loadProviders()
    } catch (error: any) {
      console.error('保存AI提供商失败:', error)
      toast.error('保存失败: ' + (error.message || '未知错误'))
    }
  }

  const handleDeleteProvider = async (provider: AIProvider) => {
    if (!confirm(`确定要删除AI提供商 "${provider.displayName}" 吗？`)) {
      return
    }

    try {
      const response = await deleteAIProvider(provider.id)
      if (response.success) {
        toast.success('AI提供商删除成功')
        loadProviders()
      } else {
        throw new Error(response.error || '删除失败')
      }
    } catch (error: any) {
      console.error('删除AI提供商失败:', error)
      toast.error('删除失败: ' + (error.message || '未知错误'))
    }
  }

  const handleTestProvider = async (provider: AIProvider) => {
    setTestingProvider(provider.id)
    try {
      const response = await testAIProvider(provider.id)
      if (response.success) {
        toast.success(`AI提供商 "${provider.displayName}" 连接测试成功`)
      } else {
        throw new Error(response.error || '连接测试失败')
      }
    } catch (error: any) {
      console.error('测试AI提供商失败:', error)
      toast.error('连接测试失败: ' + (error.message || '未知错误'))
    } finally {
      setTestingProvider(null)
    }
  }

  const toggleApiKeyVisibility = (providerId: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }))
  }

  const getProviderTypeInfo = (type: string) => {
    return PROVIDER_TYPES.find(t => t.value === type) || PROVIDER_TYPES[0]
  }

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const formatCost = (cost: number) => {
    if (cost < 1) return `$${cost.toFixed(4)}`
    return `$${cost.toFixed(2)}`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center space-x-3">
            <Brain className="w-8 h-8 text-purple-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">AI提供商管理</h2>
              <p className="text-gray-600">配置和管理AI服务提供商</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCreateProvider}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>添加提供商</span>
            </button>
            <button
              onClick={loadProviders}
              className="btn-outline flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>刷新</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 主内容区域 */}
        <div className="flex h-[calc(90vh-80px)]">
          {/* 左侧：提供商列表 */}
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">加载中...</p>
                </div>
              </div>
            ) : providers.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    暂无AI提供商
                  </h3>
                  <p className="text-gray-600 mb-4">
                    点击右上角按钮添加第一个AI提供商
                  </p>
                  <button
                    onClick={handleCreateProvider}
                    className="btn-primary"
                  >
                    添加提供商
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {providers.map((provider) => {
                  const typeInfo = getProviderTypeInfo(provider.type)
                  return (
                    <div
                      key={provider.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedProvider?.id === provider.id
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedProvider(provider)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{typeInfo.icon}</div>
                          <div>
                            <h3 className="font-medium text-gray-900 flex items-center space-x-2">
                              <span>{provider.displayName}</span>
                              {provider.isDefault && (
                                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                                  默认
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-gray-600">{typeInfo.label}</p>
                            {provider.model && (
                              <p className="text-xs text-gray-500">{provider.model}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${
                            provider.isEnabled ? 'bg-green-400' : 'bg-gray-300'
                          }`} />
                          {provider.stats && (
                            <div className="text-xs text-gray-500">
                              {provider.stats.successfulRequests} 次成功
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 右侧：详情和表单 */}
          <div className="flex-1 overflow-y-auto">
            {showForm ? (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingProvider ? '编辑' : '添加'}AI提供商
                  </h3>
                  <button
                    onClick={() => setShowForm(false)}
                    className="btn-outline"
                  >
                    取消
                  </button>
                </div>

                <div className="space-y-6">
                  {/* 基础信息 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        名称 *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="input w-full"
                        placeholder="唯一标识名称"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        显示名称 *
                      </label>
                      <input
                        type="text"
                        value={formData.displayName}
                        onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                        className="input w-full"
                        placeholder="用户友好的显示名称"
                      />
                    </div>
                  </div>

                  {/* 类型选择 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      提供商类型 *
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {PROVIDER_TYPES.map((type) => (
                        <label
                          key={type.value}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            formData.type === type.value
                              ? 'border-blue-300 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="type"
                            value={type.value}
                            checked={formData.type === type.value}
                            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                            className="sr-only"
                          />
                          <div className="text-center">
                            <div className="text-2xl mb-1">{type.icon}</div>
                            <div className="font-medium text-sm">{type.label}</div>
                            <div className="text-xs text-gray-500">{type.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 连接配置 */}
                  <div className="grid grid-cols-2 gap-4">
                    {(formData.type === 'custom' || formData.type === 'ollama') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          API端点
                        </label>
                        <input
                          type="url"
                          value={formData.endpoint}
                          onChange={(e) => setFormData(prev => ({ ...prev, endpoint: e.target.value }))}
                          className="input w-full"
                          placeholder="https://api.example.com/v1"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        API密钥
                      </label>
                      <input
                        type="password"
                        value={formData.apiKey}
                        onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                        className="input w-full"
                        placeholder="sk-..."
                      />
                    </div>
                  </div>

                  {/* 模型配置 */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        模型名称
                      </label>
                      <input
                        type="text"
                        value={formData.model}
                        onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                        className="input w-full"
                        placeholder="gpt-4, deepseek-coder, llama2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        最大Token数
                      </label>
                      <input
                        type="number"
                        value={formData.maxTokens}
                        onChange={(e) => setFormData(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                        className="input w-full"
                        min="100"
                        max="32000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Temperature
                      </label>
                      <input
                        type="number"
                        value={formData.temperature}
                        onChange={(e) => setFormData(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                        className="input w-full"
                        min="0"
                        max="2"
                        step="0.1"
                      />
                    </div>
                  </div>

                  {/* 设置选项 */}
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.isDefault}
                        onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">设为默认提供商</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.isEnabled}
                        onChange={(e) => setFormData(prev => ({ ...prev, isEnabled: e.target.checked }))}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">启用此提供商</span>
                    </label>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setShowForm(false)}
                      className="btn-outline"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSubmitForm}
                      className="btn-primary"
                    >
                      {editingProvider ? '更新' : '创建'}
                    </button>
                  </div>
                </div>
              </div>
            ) : selectedProvider ? (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{getProviderTypeInfo(selectedProvider.type).icon}</div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                        <span>{selectedProvider.displayName}</span>
                        {selectedProvider.isDefault && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                            默认
                          </span>
                        )}
                        <div className={`w-2 h-2 rounded-full ${
                          selectedProvider.isEnabled ? 'bg-green-400' : 'bg-gray-300'
                        }`} />
                      </h3>
                      <p className="text-gray-600">{getProviderTypeInfo(selectedProvider.type).label}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleTestProvider(selectedProvider)}
                      disabled={testingProvider === selectedProvider.id}
                      className="btn-outline flex items-center space-x-2"
                    >
                      {testingProvider === selectedProvider.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <TestTube className="w-4 h-4" />
                      )}
                      <span>测试连接</span>
                    </button>
                    <button
                      onClick={() => handleEditProvider(selectedProvider)}
                      className="btn-outline flex items-center space-x-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>编辑</span>
                    </button>
                    <button
                      onClick={() => handleDeleteProvider(selectedProvider)}
                      className="btn-outline text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>删除</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* 基础信息 */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Settings className="w-5 h-5 mr-2" />
                      基础配置
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">名称：</span>
                        <span className="font-medium">{selectedProvider.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">类型：</span>
                        <span className="font-medium">{getProviderTypeInfo(selectedProvider.type).label}</span>
                      </div>
                      {selectedProvider.endpoint && (
                        <div>
                          <span className="text-gray-600">端点：</span>
                          <span className="font-medium">{selectedProvider.endpoint}</span>
                        </div>
                      )}
                      {selectedProvider.model && (
                        <div>
                          <span className="text-gray-600">模型：</span>
                          <span className="font-medium">{selectedProvider.model}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-600">最大Token：</span>
                        <span className="font-medium">{selectedProvider.maxTokens || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Temperature：</span>
                        <span className="font-medium">{selectedProvider.temperature || 'N/A'}</span>
                      </div>
                    </div>

                    {selectedProvider.apiKey && (
                      <div className="mt-4">
                        <span className="text-gray-600">API密钥：</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {showApiKeys[selectedProvider.id] 
                              ? selectedProvider.apiKey 
                              : '*'.repeat(selectedProvider.apiKey.length)
                            }
                          </span>
                          <button
                            onClick={() => toggleApiKeyVisibility(selectedProvider.id)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            {showApiKeys[selectedProvider.id] ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 使用统计 */}
                  {selectedProvider.stats && (
                    <div className="bg-white rounded-lg border border-gray-200">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <h4 className="font-medium text-gray-900 flex items-center">
                          <BarChart3 className="w-5 h-5 mr-2" />
                          使用统计
                        </h4>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {selectedProvider.stats.totalRequests}
                            </div>
                            <div className="text-sm text-gray-600">总请求数</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {Math.round((selectedProvider.stats.successfulRequests / selectedProvider.stats.totalRequests) * 100)}%
                            </div>
                            <div className="text-sm text-gray-600">成功率</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {formatResponseTime(selectedProvider.stats.averageResponseTime)}
                            </div>
                            <div className="text-sm text-gray-600">平均响应时间</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="text-center">
                            <div className="text-lg font-semibold text-orange-600">
                              {selectedProvider.stats.totalTokensUsed.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-600">总Token消耗</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-red-600">
                              {formatCost(selectedProvider.stats.costEstimate)}
                            </div>
                            <div className="text-sm text-gray-600">预估成本</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 最后使用时间 */}
                  {selectedProvider.lastUsed && (
                    <div className="text-sm text-gray-600 flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      最后使用：{new Date(selectedProvider.lastUsed).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    选择AI提供商
                  </h3>
                  <p className="text-gray-600">
                    从左侧列表中选择一个AI提供商查看详情
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIProviderManager