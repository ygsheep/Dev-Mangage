import React, { useState, useEffect } from 'react'
import { 
  X, 
  Play, 
  Copy, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Code,
  Settings,
  Eye,
  EyeOff,
  Plus,
  Trash2
} from 'lucide-react'
import { API, HTTPMethod, HTTP_METHOD_COLORS, APITestRequest, APITestResponse } from '@shared/types'
import toast from 'react-hot-toast'

interface APITestModalProps {
  api: API | null
  isOpen: boolean
  onClose: () => void
  projectBaseUrl?: string
  onUpdateBaseUrl?: (baseUrl: string) => void
}

const APITestModal: React.FC<APITestModalProps> = ({
  api,
  isOpen,
  onClose,
  projectBaseUrl = '',
  onUpdateBaseUrl
}) => {
  const [activeTab, setActiveTab] = useState<'request' | 'response' | 'history'>('request')
  const [testRequest, setTestRequest] = useState<APITestRequest>({
    method: HTTPMethod.GET,
    url: '',
    headers: {},
    params: {},
    body: null,
    timeout: 30000
  })
  const [testResponse, setTestResponse] = useState<APITestResponse | null>(null)
  const [testError, setTestError] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showHeaders, setShowHeaders] = useState(false)
  const [showParams, setShowParams] = useState(false)
  const [customHeaders, setCustomHeaders] = useState<Array<{key: string, value: string}>>([])
  const [customParams, setCustomParams] = useState<Array<{key: string, value: string}>>([])
  const [requestBody, setRequestBody] = useState('')
  const [baseUrl, setBaseUrl] = useState(projectBaseUrl)

  useEffect(() => {
    if (api && isOpen) {
      const fullUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}${api.path}` : api.path
      setTestRequest({
        method: api.method as HTTPMethod,
        url: fullUrl,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        params: {},
        body: null,
        timeout: 30000
      })
      setBaseUrl(projectBaseUrl)
      setRequestBody('')
      setCustomHeaders([])
      setCustomParams([])
      setTestResponse(null)
      setTestError(null)
    }
  }, [api, isOpen, projectBaseUrl, baseUrl])

  if (!isOpen || !api) return null

  const getMethodColor = (method: HTTPMethod) => {
    return HTTP_METHOD_COLORS[method] || 'bg-gray-100 text-gray-800'
  }

  const addCustomHeader = () => {
    setCustomHeaders([...customHeaders, { key: '', value: '' }])
  }

  const updateCustomHeader = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...customHeaders]
    updated[index][field] = value
    setCustomHeaders(updated)
  }

  const removeCustomHeader = (index: number) => {
    setCustomHeaders(customHeaders.filter((_, i) => i !== index))
  }

  const addCustomParam = () => {
    setCustomParams([...customParams, { key: '', value: '' }])
  }

  const updateCustomParam = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...customParams]
    updated[index][field] = value
    setCustomParams(updated)
  }

  const removeCustomParam = (index: number) => {
    setCustomParams(customParams.filter((_, i) => i !== index))
  }

  const handleBaseUrlChange = (newBaseUrl: string) => {
    setBaseUrl(newBaseUrl)
    const fullUrl = newBaseUrl ? `${newBaseUrl.replace(/\/$/, '')}${api.path}` : api.path
    setTestRequest(prev => ({ ...prev, url: fullUrl }))
    onUpdateBaseUrl?.(newBaseUrl)
  }

  const executeTest = async () => {
    setIsLoading(true)
    setTestResponse(null)
    setTestError(null)

    try {
      const startTime = Date.now()
      
      // 构建最终的headers
      const finalHeaders = { ...testRequest.headers }
      customHeaders.forEach(header => {
        if (header.key && header.value) {
          finalHeaders[header.key] = header.value
        }
      })

      // 构建最终的params
      const finalParams = { ...testRequest.params }
      customParams.forEach(param => {
        if (param.key && param.value) {
          finalParams[param.key] = param.value
        }
      })

      // 构建请求体
      let finalBody = null
      if (['POST', 'PUT', 'PATCH'].includes(testRequest.method) && requestBody) {
        try {
          finalBody = JSON.parse(requestBody)
        } catch (e) {
          finalBody = requestBody
        }
      }

      // 模拟API请求 (实际项目中应该调用真实的API)
      const response = await mockAPIRequest({
        ...testRequest,
        headers: finalHeaders,
        params: finalParams,
        body: finalBody
      })

      const endTime = Date.now()
      const responseTime = endTime - startTime

      const testResult: APITestResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers || {},
        data: response.data,
        responseTime,
        size: JSON.stringify(response.data).length,
        timestamp: new Date().toISOString()
      }

      setTestResponse(testResult)
      toast.success(`API测试成功 (${responseTime}ms)`)
    } catch (error: any) {
      setTestError(error)
      toast.error('API测试失败: ' + (error.message || '未知错误'))
    } finally {
      setIsLoading(false)
    }
  }

  // 模拟API请求函数 (实际项目中替换为真实的API调用)
  const mockAPIRequest = async (_request: APITestRequest): Promise<any> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.8) {
          reject(new Error('网络连接超时'))
        } else {
          resolve({
            status: 200,
            statusText: 'OK',
            headers: {
              'content-type': 'application/json',
              'x-response-time': '123ms'
            },
            data: {
              success: true,
              message: '请求成功',
              data: {
                id: 1,
                name: '测试数据',
                timestamp: new Date().toISOString()
              }
            }
          })
        }
      }, Math.random() * 2000 + 500) // 随机延迟500-2500ms
    })
  }

  const copyResponse = async () => {
    if (!testResponse) return
    try {
      await navigator.clipboard.writeText(JSON.stringify(testResponse.data, null, 2))
      toast.success('响应数据已复制到剪贴板')
    } catch (error) {
      toast.error('复制失败')
    }
  }

  const formatJSON = (data: any) => {
    try {
      return JSON.stringify(data, null, 2)
    } catch (e) {
      return String(data)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded text-sm font-mono font-medium ${getMethodColor(api.method as HTTPMethod)}`}>
                {api.method}
              </span>
              <span className="text-lg font-semibold text-gray-900">{api.name}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Base URL Configuration */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Settings className="w-4 h-4 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Base URL:</label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => handleBaseUrlChange(e.target.value)}
              placeholder="https://api.example.com/v1"
              className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="text-xs text-gray-500">
              完整URL: {testRequest.url}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab('request')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'request'
                ? 'border-blue-500 text-blue-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>请求配置</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('response')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'response'
                ? 'border-blue-500 text-blue-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Code className="w-4 h-4" />
              <span>响应结果</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>测试历史</span>
            </div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[50vh] overflow-y-auto">
          {activeTab === 'request' && (
            <div className="space-y-6">
              {/* Headers */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <span>请求头</span>
                  </h3>
                  <button
                    onClick={() => setShowHeaders(!showHeaders)}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                  >
                    {showHeaders ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>{showHeaders ? '隐藏' : '显示'}</span>
                  </button>
                </div>
                
                {showHeaders && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded">
                      <div className="text-xs font-medium text-gray-600">Content-Type: application/json</div>
                      <div className="text-xs font-medium text-gray-600">Accept: application/json</div>
                    </div>
                    
                    {customHeaders.map((header, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="Header名称"
                          value={header.key}
                          onChange={(e) => updateCustomHeader(index, 'key', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Header值"
                          value={header.value}
                          onChange={(e) => updateCustomHeader(index, 'value', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                        <button
                          onClick={() => removeCustomHeader(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    <button
                      onClick={addCustomHeader}
                      className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Plus className="w-4 h-4" />
                      <span>添加自定义Header</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Query Parameters */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">查询参数</h3>
                  <button
                    onClick={() => setShowParams(!showParams)}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                  >
                    {showParams ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>{showParams ? '隐藏' : '显示'}</span>
                  </button>
                </div>
                
                {showParams && (
                  <div className="space-y-2">
                    {customParams.map((param, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="参数名"
                          value={param.key}
                          onChange={(e) => updateCustomParam(index, 'key', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                        <input
                          type="text"
                          placeholder="参数值"
                          value={param.value}
                          onChange={(e) => updateCustomParam(index, 'value', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                        <button
                          onClick={() => removeCustomParam(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    <button
                      onClick={addCustomParam}
                      className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Plus className="w-4 h-4" />
                      <span>添加查询参数</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Request Body */}
              {['POST', 'PUT', 'PATCH'].includes(api.method) && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">请求体 (JSON)</h3>
                  <textarea
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    placeholder='{\n  "key": "value"\n}'
                    className="w-full h-40 px-3 py-2 border border-gray-300 rounded font-mono text-sm resize-vertical"
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'response' && (
            <div className="space-y-4">
              {testResponse ? (
                <div className="space-y-4">
                  {/* Response Status */}
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-medium text-green-800">
                          {testResponse.status} {testResponse.statusText}
                        </div>
                        <div className="text-sm text-green-600">
                          响应时间: {testResponse.responseTime}ms | 大小: {testResponse.size} bytes
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={copyResponse}
                      className="flex items-center space-x-2 px-3 py-1 text-sm text-green-700 hover:bg-green-100 rounded"
                    >
                      <Copy className="w-4 h-4" />
                      <span>复制响应</span>
                    </button>
                  </div>

                  {/* Response Data */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">响应数据</h4>
                    <pre className="bg-gray-50 rounded-lg p-4 text-sm overflow-x-auto border">
                      <code>{formatJSON(testResponse.data)}</code>
                    </pre>
                  </div>
                </div>
              ) : testError ? (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <div className="font-medium text-red-800">请求失败</div>
                      <div className="text-sm text-red-600 mt-1">
                        {testError.message || '未知错误'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Code className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>点击"发送请求"按钮执行API测试</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="text-center py-12 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>测试历史功能将在未来版本中实现</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              {api.description && (
                <span>描述: {api.description}</span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              关闭
            </button>
            <button
              onClick={executeTest}
              disabled={isLoading}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>测试中...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>发送请求</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default APITestModal