import React, { useState, useEffect } from 'react'
import { X, FileText, Upload, Database, Brain, Code, AlertCircle, CheckCircle, Settings, Download } from 'lucide-react'
import { API, HTTPMethod, APIStatus, APIParameter, APIResponseSchema } from '@shared/types'
import { createAIParsingService, AIParsingConfig, AI_PARSING_PRESETS } from '../services/aiParsingService'
import { useMutation } from '@tanstack/react-query'
import { apiMethods } from '../utils/api'
import AIConfigModal from './AIConfigModal'
import toast from 'react-hot-toast'

interface UnifiedImportModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  onSuccess?: () => void
  initialTab?: ImportTab
}

type ImportTab = 'api-doc' | 'database'

interface ParsedAPI {
  name: string
  method: HTTPMethod
  path: string
  description?: string
  parameters?: APIParameter[]
  responseSchema?: APIResponseSchema
}

/**
 * 统一导入模态框组件
 * 支持API文档和数据库文档的导入
 */
const UnifiedImportModal: React.FC<UnifiedImportModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onSuccess,
  initialTab = 'api-doc'
}) => {
  const [activeTab, setActiveTab] = useState<ImportTab>(initialTab)
  const [apiDocType, setApiDocType] = useState<'markdown' | 'json'>('markdown')
  
  // API文档解析相关状态
  const [apiFile, setApiFile] = useState<File | null>(null)
  const [isParsingAPI, setIsParsingAPI] = useState(false)
  const [parsedAPIs, setParsedAPIs] = useState<ParsedAPI[]>([])
  const [apiParseError, setApiParseError] = useState<string | null>(null)
  const [apiPreviewContent, setApiPreviewContent] = useState<string>('')
  const [useAI, setUseAI] = useState(true)
  const [aiConfig, setAiConfig] = useState<AIParsingConfig>(() => {
    const saved = localStorage.getItem('ai-parsing-config')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Failed to parse AI config from localStorage:', e)
      }
    }
    return AI_PARSING_PRESETS.ollama_qwen
  })
  
  // Swagger导入相关状态
  const [swaggerUrl, setSwaggerUrl] = useState('')
  const [swaggerContent, setSwaggerContent] = useState('')
  const [swaggerImportMethod, setSwaggerImportMethod] = useState<'url' | 'content'>('url')
  
  // 数据库文档相关状态
  const [dbFile, setDbFile] = useState<File | null>(null)
  const [isParsingDB, setIsParsingDB] = useState(false)
  const [dbParseResult, setDbParseResult] = useState<any>(null)
  const [dbParseError, setDbParseError] = useState<string | null>(null)
  
  // AI配置弹窗
  const [showAIConfig, setShowAIConfig] = useState(false)
  
  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])
  
  // Swagger导入mutation
  const swaggerImportMutation = useMutation({
    mutationFn: async (data: { url?: string; content?: string }) => {
      if (data.url) {
        return await apiMethods.importSwagger({ projectId, url: data.url })
      } else if (data.content) {
        return await apiMethods.importSwagger({ projectId, content: data.content })
      }
      throw new Error('No URL or content provided')
    },
    onSuccess: () => {
      handleSwaggerSuccess()
    },
    onError: (error: any) => {
      toast.error(`Swagger导入失败: ${error.message}`)
    }
  })
  
  /**
   * 处理Swagger导入提交
   */
  const handleSwaggerSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (swaggerImportMethod === 'url' && swaggerUrl) {
      swaggerImportMutation.mutate({ url: swaggerUrl })
    } else if (swaggerImportMethod === 'content' && swaggerContent) {
      swaggerImportMutation.mutate({ content: swaggerContent })
    }
  }
  
  /**
   * 处理API文件选择
   */
  const handleApiFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setApiFile(selectedFile)
      setApiParseError(null)
      setParsedAPIs([])
      
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setApiPreviewContent(content.slice(0, 1000) + (content.length > 1000 ? '...' : ''))
      }
      reader.readAsText(selectedFile)
    }
  }

  /**
   * 解析Markdown格式的API文档
   */
  const parseMarkdownAPI = (content: string): ParsedAPI[] => {
    const apis: ParsedAPI[] = []
    
    try {
      const lines = content.split('\n')
      let currentAPI: Partial<ParsedAPI> | null = null
      let currentSection = ''
      let isInCodeBlock = false
      let codeBlockContent = ''
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        
        if (line.startsWith('```')) {
          isInCodeBlock = !isInCodeBlock
          if (!isInCodeBlock && codeBlockContent && currentAPI) {
            if (currentSection === 'request' && codeBlockContent.includes('{')) {
              try {
                const jsonMatch = codeBlockContent.match(/\{[\s\S]*\}/)
                if (jsonMatch) {
                  const jsonObj = JSON.parse(jsonMatch[0])
                  currentAPI.parameters = Object.keys(jsonObj).map(key => ({
                    name: key,
                    type: typeof jsonObj[key] as any,
                    required: true,
                    description: `${key}参数`,
                    location: 'body' as const
                  }))
                }
              } catch (e) {
                // 忽略JSON解析错误
              }
            }
          }
          codeBlockContent = ''
          continue
        }
        
        if (isInCodeBlock) {
          codeBlockContent += line + '\n'
          continue
        }
        
        const apiMatch = line.match(/^#{1,4}\s*(.+?)\s*-\s*(GET|POST|PUT|DELETE|PATCH)\s+(.+)$/)
        if (apiMatch) {
          if (currentAPI && currentAPI.name && currentAPI.method && currentAPI.path) {
            apis.push(currentAPI as ParsedAPI)
          }
          
          currentAPI = {
            name: apiMatch[1].trim(),
            method: apiMatch[2] as HTTPMethod,
            path: apiMatch[3].trim(),
            description: '',
            parameters: []
          }
          currentSection = 'basic'
          continue
        }
        
        const methodPathMatch = line.match(/^(GET|POST|PUT|DELETE|PATCH)\s+(.+)$/)
        if (methodPathMatch && currentAPI) {
          currentAPI.method = methodPathMatch[1] as HTTPMethod
          currentAPI.path = methodPathMatch[2].trim()
          continue
        }
        
        if (line && !line.startsWith('#') && !line.startsWith('|') && currentAPI && !currentAPI.description) {
          currentAPI.description = line
          continue
        }
      }
      
      if (currentAPI && currentAPI.name && currentAPI.method && currentAPI.path) {
        apis.push(currentAPI as ParsedAPI)
      }
      
    } catch (error) {
      console.error('解析API文档失败:', error)
      throw new Error('API文档格式无法识别，请检查文档格式')
    }
    
    return apis
  }

  /**
   * 处理API文档解析
   */
  const handleParseAPI = async () => {
    if (!apiFile) return
    
    setIsParsingAPI(true)
    setApiParseError(null)
    setParsedAPIs([])
    
    try {
      const content = await apiFile.text()
      console.log('开始解析文件内容，长度:', content.length)
      
      if (useAI) {
        console.log('使用AI解析，配置:', aiConfig)
        const aiService = createAIParsingService(aiConfig)
        const result = await aiService.parseAPIDocument(content, projectId)
        
        console.log('AI解析结果:', result)
        
        // 检查是否有解析错误
        if (!result.success || (result.errors && result.errors.length > 0)) {
          const errorMessage = result.errors?.join(', ') || 'AI解析失败'
          setApiParseError(errorMessage)
          toast.error('AI解析失败: ' + errorMessage)
          return
        }
        
        // 检查是否解析到API
        if (!result.apis || result.apis.length === 0) {
          const errorMessage = 'AI未能从文档中解析到任何API接口，请检查文档格式或尝试其他AI模型'
          setApiParseError(errorMessage)
          toast.error(errorMessage)
          return
        }
        
        // 转换API格式
        const convertedAPIs: ParsedAPI[] = result.apis.map(api => ({
          name: api.name || '未命名API',
          method: api.method || 'GET',
          path: api.path || '/',
          description: api.description || '',
          parameters: []
        }))
        
        setParsedAPIs(convertedAPIs)
        const confidenceText = result.confidence ? ` (置信度: ${Math.round(result.confidence * 100)}%)` : ''
        toast.success(`AI成功解析到 ${result.apis.length} 个API接口${confidenceText}`)
      } else {
        console.log('使用传统Markdown解析')
        const parsed = parseMarkdownAPI(content)
        
        if (parsed.length === 0) {
          const errorMessage = '未能从文档中解析到任何API接口，请检查文档格式'
          setApiParseError(errorMessage)
          toast.error(errorMessage)
          return
        }
        
        setParsedAPIs(parsed)
        toast.success(`成功解析到 ${parsed.length} 个API接口`)
      }
    } catch (error: any) {
      console.error('解析过程中发生异常:', error)
      const errorMessage = error.message || '解析过程中发生未知错误'
      setApiParseError(errorMessage)
      toast.error('API文档解析失败: ' + errorMessage)
    } finally {
      setIsParsingAPI(false)
    }
  }

  /**
   * 处理API导入
   */
  const handleImportAPI = async () => {
    if (parsedAPIs.length === 0) return
    
    try {
      for (const parsedAPI of parsedAPIs) {
        const apiData = {
          projectId,
          name: parsedAPI.name,
          description: parsedAPI.description || '',
          method: parsedAPI.method,
          path: parsedAPI.path,
          status: APIStatus.NOT_STARTED
        }
        
        await apiMethods.createAPI(apiData)
      }
      
      toast.success(`成功导入 ${parsedAPIs.length} 个API接口`)
      handleAPIDocSuccess()
    } catch (error: any) {
      toast.error('API导入失败: ' + error.message)
    }
  }

  /**
   * 处理API文档导入成功
   */
  const handleAPIDocSuccess = () => {
    onSuccess?.()
    onClose()
  }
  
  /**
   * 处理Swagger导入成功
   */
  const handleSwaggerSuccess = () => {
    toast.success('Swagger导入成功！')
    onSuccess?.()
    onClose()
  }
  
  /**
   * 处理数据库文档导入成功
   */
  const handleDatabaseSuccess = () => {
    toast.success('数据库文档导入成功！')
    onSuccess?.()
    onClose()
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">导入文档</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('api-doc')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'api-doc'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>API文档</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'database'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4" />
                <span>数据库设计</span>
              </div>
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* API文档导入 */}
          {activeTab === 'api-doc' && (
            <div className="p-6">
              {/* API文档类型选择 */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">选择API文档格式</h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Markdown 选项 */}
                  <button
                    onClick={() => setApiDocType('markdown')}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      apiDocType === 'markdown'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Brain className="w-6 h-6 text-purple-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">Markdown 文档</h4>
                        <p className="text-sm text-gray-600">AI智能解析，支持自然语言描述</p>
                      </div>
                    </div>
                  </button>
                  
                  {/* JSON 选项 */}
                  <button
                    onClick={() => setApiDocType('json')}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      apiDocType === 'json'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Code className="w-6 h-6 text-blue-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">JSON 规范</h4>
                        <p className="text-sm text-gray-600">标准OpenAPI/Swagger格式</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
              
              {/* 根据选择的类型显示相应的导入界面 */}
              {apiDocType === 'markdown' ? (
                <div className="space-y-6">
                  {/* Markdown 文档导入 */}
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Brain className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-purple-800 mb-1">AI智能解析</h4>
                        <p className="text-sm text-purple-700">
                          使用AI技术自动识别和解析各种格式的API文档，支持自然语言描述
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {!apiFile ? (
                    <div className="space-y-6">
                      {/* 文件上传区域 */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                        <div className="flex flex-col items-center space-y-4">
                          <Upload className="w-12 h-12 text-gray-400" />
                          <div>
                            <p className="text-lg font-medium text-gray-900 mb-2">上传API文档</p>
                            <p className="text-sm text-gray-600 mb-4">
                              支持 Markdown、Word、PDF、TXT 等格式的API文档
                            </p>
                            <input
                              type="file"
                              accept=".md,.txt,.doc,.docx,.pdf"
                              onChange={handleApiFileSelect}
                              className="hidden"
                              id="api-file-upload"
                            />
                            <label
                              htmlFor="api-file-upload"
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 cursor-pointer"
                            >
                              选择文件
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      {/* 支持格式说明 */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">支持的文档格式</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                          <div>• Markdown (.md)</div>
                          <div>• 纯文本 (.txt)</div>
                          <div>• Word文档 (.doc, .docx)</div>
                          <div>• PDF文档 (.pdf)</div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          AI将自动识别文档中的API接口信息，包括接口名称、HTTP方法、路径、参数等
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* 文件信息 */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <FileText className="w-8 h-8 text-purple-600" />
                            <div>
                              <h4 className="font-medium text-gray-900">{apiFile.name}</h4>
                              <p className="text-sm text-gray-500">
                                {(apiFile.size / 1024).toFixed(1)} KB • {apiFile.type || '未知类型'}
                              </p>
                              <p className="text-xs text-green-600 mt-1">
                                ✅ 文件已上传，请向下滚动点击"开始解析"按钮
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setApiFile(null)
                              setApiPreviewContent('')
                              setParsedAPIs([])
                              setApiParseError(null)
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      
                      {/* 解析配置选项 */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={useAI}
                              onChange={(e) => setUseAI(e.target.checked)}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm font-medium text-gray-900">AI智能解析</span>
                          </label>
                          
                          {useAI && (
                            <button
                              onClick={() => setShowAIConfig(true)}
                              className="flex items-center space-x-1 text-sm text-purple-600 hover:text-purple-700"
                            >
                              <Settings className="w-4 h-4" />
                              <span>配置</span>
                            </button>
                          )}
                        </div>
                        
                        {useAI && (
                          <div className="text-xs text-blue-700">
                            <div>当前使用: {aiConfig.provider === 'ollama' ? 'Ollama本地' : aiConfig.provider === 'deepseek' ? 'DeepSeek在线' : aiConfig.provider === 'openai' ? 'OpenAI在线' : '模拟模式'}</div>
                            <div>模型: {aiConfig.model}</div>
                          </div>
                        )}
                        
                        <div className="text-xs text-blue-600">
                          {useAI 
                            ? '✨ AI模式可以更准确地识别复杂格式的API文档，支持自然语言描述，解析完成后将显示提交按钮'
                            : '📝 标准模式使用规则匹配，适合格式规范的文档，解析完成后将显示提交按钮'
                          }
                        </div>
                      </div>
                      
                      {/* 文件内容预览 */}
                      {apiPreviewContent && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-900">文档预览</h4>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                            <pre className="text-xs text-gray-700 whitespace-pre-wrap">{apiPreviewContent}</pre>
                          </div>
                        </div>
                      )}
                      
                      {/* 解析错误 */}
                      {apiParseError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <h4 className="text-sm font-medium text-red-800">解析失败</h4>
                              <p className="text-sm text-red-700 mt-1">{apiParseError}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* 解析结果 */}
                      {parsedAPIs.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900">
                              解析结果 ({parsedAPIs.length} 个API)
                            </h4>
                            <div className="flex items-center space-x-2 text-xs text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span>解析成功</span>
                            </div>
                          </div>
                          
                          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-64 overflow-y-auto">
                            {parsedAPIs.map((api, index) => (
                              <div key={index} className="p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                      api.method === 'GET' ? 'bg-green-100 text-green-800' :
                                      api.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                                      api.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                                      api.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {api.method}
                                    </span>
                                    <div>
                                      <div className="font-medium text-gray-900">{api.name}</div>
                                      <div className="text-sm text-gray-500">{api.path}</div>
                                    </div>
                                  </div>
                                </div>
                                {api.description && (
                                  <p className="text-sm text-gray-600 mt-2">{api.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* 解析和导入按钮 */}
                      <div className="flex justify-end space-x-3">
                        {parsedAPIs.length === 0 ? (
                          <button
                            onClick={handleParseAPI}
                            disabled={isParsingAPI || !apiFile}
                            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                          >
                            {isParsingAPI ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>解析中...</span>
                              </>
                            ) : (
                              <>
                                <Brain className="w-4 h-4" />
                                <span>开始解析</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setParsedAPIs([])
                                setApiParseError(null)
                              }}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              重新解析
                            </button>
                            <button
                              onClick={handleImportAPI}
                              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                            >
                              <Upload className="w-4 h-4" />
                              <span>开始提交</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* JSON/Swagger 文档导入 */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Code className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-800 mb-1">标准格式导入</h4>
                        <p className="text-sm text-blue-700">
                          支持OpenAPI 3.0和Swagger 2.0规范，可通过URL或直接粘贴内容导入
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Swagger导入方式选择 */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-900">导入方式</h4>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="swaggerMethod"
                          value="url"
                          checked={swaggerImportMethod === 'url'}
                          onChange={(e) => setSwaggerImportMethod(e.target.value as 'url' | 'content')}
                          className="text-blue-600"
                        />
                        <span className="text-sm text-gray-700">从URL导入</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="swaggerMethod"
                          value="content"
                          checked={swaggerImportMethod === 'content'}
                          onChange={(e) => setSwaggerImportMethod(e.target.value as 'url' | 'content')}
                          className="text-blue-600"
                        />
                        <span className="text-sm text-gray-700">粘贴内容</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* URL导入 */}
                  {swaggerImportMethod === 'url' && (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Swagger文档URL
                      </label>
                      <input
                        type="url"
                        value={swaggerUrl}
                        onChange={(e) => setSwaggerUrl(e.target.value)}
                        placeholder="https://api.example.com/swagger.json"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                  
                  {/* 内容导入 */}
                  {swaggerImportMethod === 'content' && (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Swagger文档内容
                      </label>
                      <textarea
                        value={swaggerContent}
                        onChange={(e) => setSwaggerContent(e.target.value)}
                        placeholder="粘贴您的OpenAPI/Swagger JSON或YAML内容..."
                        rows={10}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                  
                  {/* 开始导入按钮 */}
                  <div className="flex justify-end">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        handleSwaggerSubmit(e)
                      }}
                      disabled={swaggerImportMutation.isPending || (!swaggerUrl && !swaggerContent)}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {swaggerImportMutation.isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>导入中...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>开始导入</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* 数据库文档导入 */}
          {activeTab === 'database' && (
            <div className="p-6">
              <div className="text-center py-8">
                <p className="text-gray-500">数据库文档导入功能开发中...</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            支持多种格式的API和数据库文档导入
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            关闭
          </button>
        </div>
        
        {/* AI配置弹窗 */}
        <AIConfigModal
          isOpen={showAIConfig}
          onClose={() => setShowAIConfig(false)}
          onSave={(config) => {
            setAiConfig(config)
            setShowAIConfig(false)
            localStorage.setItem('ai-parsing-config', JSON.stringify(config))
          }}
          currentConfig={aiConfig}
        />
      </div>
    </div>
  )
}

export default UnifiedImportModal