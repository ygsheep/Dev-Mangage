import React, { useState, useCallback, useEffect } from 'react'
import {
  Upload,
  FileText,
  Database,
  Settings,
  Brain,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Download,
  Eye,
  RefreshCw,
  Code,
  Layers,
  Workflow,
  FileCode
} from 'lucide-react'
import { DocumentType, DOCUMENT_TYPE_LABELS, DOCUMENT_TYPE_COLORS } from '../../types'
import { 
  parseDocument, 
  getAIProvidersDetailed, 
  getAIServiceHealth,
  getAIModels,
  autoSelectBestModel
} from '../../utils/api'
import { toast } from 'react-hot-toast'

// 支持的解析类型配置
export enum ParseType {
  DATA_MODEL = 'DATA_MODEL',
  API_DOCUMENTATION = 'API_DOCUMENTATION', 
  FEATURE_MODULE = 'FEATURE_MODULE',
  BUSINESS_PROCESS = 'BUSINESS_PROCESS',
  TECHNICAL_SPEC = 'TECHNICAL_SPEC'
}

export const PARSE_TYPE_CONFIG = {
  [ParseType.DATA_MODEL]: {
    label: '数据模型解析',
    description: '解析数据库表结构、字段定义和关系',
    icon: Database,
    documentTypes: [DocumentType.MARKDOWN, DocumentType.SQL, DocumentType.EXCEL, DocumentType.WORD, DocumentType.PDF],
    resultType: 'tables'
  },
  [ParseType.API_DOCUMENTATION]: {
    label: 'API接口解析',
    description: '解析API接口文档、参数和响应格式',
    icon: Code,
    documentTypes: [DocumentType.MARKDOWN, DocumentType.JSON, DocumentType.WORD, DocumentType.PDF],
    resultType: 'apis'
  },
  [ParseType.FEATURE_MODULE]: {
    label: '功能模块解析',
    description: '解析功能模块结构和业务流程',
    icon: Layers,
    documentTypes: [DocumentType.MARKDOWN, DocumentType.WORD, DocumentType.PDF],
    resultType: 'modules'
  },
  [ParseType.BUSINESS_PROCESS]: {
    label: '业务流程解析',
    description: '解析业务流程和规则定义',
    icon: Workflow,
    documentTypes: [DocumentType.MARKDOWN, DocumentType.WORD, DocumentType.PDF],
    resultType: 'processes'
  },
  [ParseType.TECHNICAL_SPEC]: {
    label: '技术规格解析',
    description: '解析技术架构和系统设计',
    icon: FileCode,
    documentTypes: [DocumentType.MARKDOWN, DocumentType.WORD, DocumentType.PDF],
    resultType: 'components'
  }
}

interface ParseResult {
  success: boolean
  data?: any
  error?: string
  warnings?: string[]
  metadata?: {
    provider: string
    timestamp: Date
    processingTime: number
    parseMethod?: string
  }
}

interface AIProvider {
  id: string
  name: string
  displayName: string
  description: string
  icon: string
  enabled: boolean
  model: string
  status: 'healthy' | 'degraded' | 'unhealthy'
}

interface AIModel {
  name: string
  size?: number
  modified_at?: string
}

interface AIDocumentParserProps {
  projectId: string
  parseType: ParseType
  onParseComplete: (result: ParseResult) => void
  onError?: (error: string) => void
  className?: string
  title?: string
  description?: string
}

const AIDocumentParser: React.FC<AIDocumentParserProps> = ({
  projectId,
  parseType,
  onParseComplete,
  onError,
  className = '',
  title,
  description
}) => {
  // 基础状态
  const [files, setFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [parseError, setParseError] = useState<string>('')
  
  // AI配置状态
  const [providers, setProviders] = useState<AIProvider[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [availableModels, setAvailableModels] = useState<AIModel[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [showSettings, setShowSettings] = useState(false)
  
  // 结果展示状态
  const [showPreview, setShowPreview] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  const config = PARSE_TYPE_CONFIG[parseType]

  // 加载AI提供者信息
  useEffect(() => {
    loadAIProviders()
  }, [])

  const loadAIProviders = async () => {
    try {
      const response = await getAIProvidersDetailed()
      if (response.success && Array.isArray(response.data)) {
        setProviders(response.data)
        
        // 自动选择第一个可用的提供者
        const availableProvider = response.data.find((p: AIProvider) => p.enabled && p.status === 'healthy')
        if (availableProvider) {
          setSelectedProvider(availableProvider.name)
          loadModelsForProvider(availableProvider.name)
        }
      }
    } catch (error) {
      console.error('加载AI提供者失败:', error)
    }
  }

  const loadModelsForProvider = async (providerName: string) => {
    try {
      const response = await getAIModels(providerName)
      if (response.success && Array.isArray(response.data)) {
        setAvailableModels(response.data)
        
        // 自动选择最佳模型
        const bestModel = await autoSelectBestModel(providerName, response.data)
        if (bestModel) {
          setSelectedModel(bestModel)
        }
      }
    } catch (error) {
      console.error('加载模型列表失败:', error)
    }
  }

  // 文件处理
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    
    // 验证文件类型
    const supportedTypes = config.documentTypes
    const validFiles = selectedFiles.filter(file => {
      const ext = file.name.toLowerCase().split('.').pop()
      return supportedTypes.some(type => {
        switch (type) {
          case DocumentType.MARKDOWN: return ext === 'md' || ext === 'markdown'
          case DocumentType.SQL: return ext === 'sql'
          case DocumentType.EXCEL: return ext === 'xlsx' || ext === 'xls'
          case DocumentType.WORD: return ext === 'docx' || ext === 'doc'
          case DocumentType.PDF: return ext === 'pdf'
          case DocumentType.JSON: return ext === 'json'
          case DocumentType.CSV: return ext === 'csv'
          default: return false
        }
      })
    })

    if (validFiles.length !== selectedFiles.length) {
      toast.error(`部分文件格式不支持，仅支持: ${supportedTypes.map(t => DOCUMENT_TYPE_LABELS[t]).join(', ')}`)
    }

    setFiles(validFiles)
    setParseResult(null)
    setParseError('')
  }, [config.documentTypes])

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const droppedFiles = Array.from(event.dataTransfer.files)
    
    // 创建一个模拟的文件选择事件
    const fakeEvent = {
      target: {
        files: droppedFiles
      }
    } as React.ChangeEvent<HTMLInputElement>
    
    handleFileSelect(fakeEvent)
  }, [handleFileSelect])

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }, [])

  // 获取文档类型
  const getDocumentType = (file: File): DocumentType => {
    const ext = file.name.toLowerCase().split('.').pop()
    const mimeType = file.type
    
    if (ext === 'md' || ext === 'markdown') return DocumentType.MARKDOWN
    if (ext === 'sql') return DocumentType.SQL
    if (ext === 'xlsx' || ext === 'xls') return DocumentType.EXCEL
    if (ext === 'csv') return DocumentType.CSV
    if (ext === 'docx' || ext === 'doc') return DocumentType.WORD
    if (ext === 'pdf') return DocumentType.PDF
    if (ext === 'json') return DocumentType.JSON
    
    if (mimeType.includes('json')) return DocumentType.JSON
    if (mimeType.includes('csv')) return DocumentType.CSV
    if (mimeType.includes('markdown')) return DocumentType.MARKDOWN
    if (mimeType.includes('sql')) return DocumentType.SQL
    
    return DocumentType.MARKDOWN // 默认类型
  }

  // 解析文档
  const handleParse = async () => {
    if (files.length === 0) {
      toast.error('请先选择文件')
      return
    }

    if (!selectedProvider) {
      toast.error('请选择AI提供者')
      return
    }

    setIsProcessing(true)
    setParseError('')
    
    try {
      const results = []
      
      for (const file of files) {
        const fileContent = await readFileContent(file)
        const documentType = getDocumentType(file)
        
        // 调用AI解析API，传递解析类型作为文档类型
        const response = await parseDocument({
          projectId,
          content: fileContent,
          type: parseType, // 使用解析类型作为文档类型
          filename: file.name,
          provider: selectedProvider,
          model: selectedModel,
          strictMode: false,
          confidenceThreshold: 0.7
        })

        if (response.success && response.data) {
          results.push({
            filename: file.name,
            data: response.data,
            ...response
          })
        } else {
          throw new Error(`解析文件 ${file.name} 失败: ${response.error || '未知错误'}`)
        }
      }

      // 合并所有解析结果
      const mergedResult: ParseResult = {
        success: true,
        data: mergeParseResults(results, config.resultType),
        metadata: {
          provider: selectedProvider,
          timestamp: new Date(),
          processingTime: results.reduce((sum, r) => sum + (r.metadata?.processingTime || 0), 0),
          parseMethod: 'ai'
        }
      }

      setParseResult(mergedResult)
      onParseComplete(mergedResult)
      
      const totalItems = getTotalItemCount(mergedResult.data)
      toast.success(`成功解析 ${files.length} 个文件，共找到 ${totalItems} 个${config.label.replace('解析', '')}`)
      
    } catch (error: any) {
      const errorMessage = error.message || '解析失败'
      setParseError(errorMessage)
      onError?.(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  // 读取文件内容
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = (e) => reject(new Error('文件读取失败'))
      reader.readAsText(file)
    })
  }

  // 合并解析结果
  const mergeParseResults = (results: any[], resultType: string) => {
    const merged: any = {}
    
    results.forEach(result => {
      if (result.data && result.data.data) {
        const data = result.data.data
        Object.keys(data).forEach(key => {
          if (Array.isArray(data[key])) {
            if (!merged[key]) merged[key] = []
            merged[key].push(...data[key])
          } else if (typeof data[key] === 'object') {
            if (!merged[key]) merged[key] = {}
            Object.assign(merged[key], data[key])
          } else {
            merged[key] = data[key]
          }
        })
      }
    })
    
    return merged
  }

  // 获取项目总数
  const getTotalItemCount = (data: any): number => {
    if (!data) return 0
    
    switch (config.resultType) {
      case 'tables': return data.tables?.length || 0
      case 'apis': return data.apis?.length || 0
      case 'modules': return data.modules?.length || 0
      case 'processes': return data.processes?.length || 0
      case 'components': return data.components?.length || 0
      default: return 0
    }
  }

  // 处理项目选择
  const handleItemToggle = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const handleSelectAll = () => {
    if (!parseResult?.data) return
    
    const allItems = getAllItems(parseResult.data)
    const allIds = new Set(allItems.map(item => item.id || item.name))
    setSelectedItems(allIds)
  }

  const handleDeselectAll = () => {
    setSelectedItems(new Set())
  }

  // 获取所有项目
  const getAllItems = (data: any): any[] => {
    if (!data) return []
    
    switch (config.resultType) {
      case 'tables': return data.tables || []
      case 'apis': return data.apis || []
      case 'modules': return data.modules || []
      case 'processes': return data.processes || []
      case 'components': return data.components || []
      default: return []
    }
  }

  const IconComponent = config.icon

  return (
    <div className={`bg-bg-paper rounded-lg shadow-theme-sm border border-border-primary ${className}`}>
      {/* 头部 */}
      <div className="p-6 border-b border-border-primary">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <IconComponent className="w-6 h-6 text-primary-600" />
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                {title || config.label}
              </h3>
              <p className="text-sm text-text-secondary mt-1">
                {description || config.description}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
              title="AI设置"
            >
              <Settings className="w-5 h-5" />
            </button>
            
            {parseResult && (
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
                title="预览结果"
              >
                <Eye className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* AI设置面板 */}
        {showSettings && (
          <div className="mt-4 p-4 bg-bg-tertiary rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* AI提供者选择 */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  AI提供者
                </label>
                <select
                  value={selectedProvider}
                  onChange={(e) => {
                    setSelectedProvider(e.target.value)
                    loadModelsForProvider(e.target.value)
                  }}
                  className="w-full px-3 py-2 bg-bg-paper border border-border-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">选择AI提供者</option>
                  {providers.map(provider => (
                    <option key={provider.name} value={provider.name}>
                      {provider.displayName} ({provider.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* 模型选择 */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  AI模型
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-paper border border-border-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={!selectedProvider}
                >
                  <option value="">选择模型</option>
                  {availableModels.map(model => (
                    <option key={model.name} value={model.name}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 支持的文档类型提示 */}
            <div className="mt-3">
              <div className="text-sm text-text-secondary mb-2">支持的文档类型:</div>
              <div className="flex flex-wrap gap-2">
                {config.documentTypes.map(type => (
                  <span
                    key={type}
                    className={`px-2 py-1 text-xs rounded-full ${DOCUMENT_TYPE_COLORS[type]}`}
                  >
                    {DOCUMENT_TYPE_LABELS[type]}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 文件上传区域 */}
      <div className="p-6">
        <div
          className="border-2 border-dashed border-border-primary rounded-lg p-8 text-center hover:border-primary-400 transition-colors"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="flex flex-col items-center space-y-4">
            <Upload className="w-12 h-12 text-text-tertiary" />
            <div>
              <h4 className="text-lg font-medium text-text-primary mb-2">
                选择或拖拽文档文件
              </h4>
              <p className="text-text-secondary mb-4">
                支持 {config.documentTypes.map(t => DOCUMENT_TYPE_LABELS[t]).join(', ')} 格式
              </p>
              <label className="btn-primary cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept=".md,.markdown,.sql,.xlsx,.xls,.docx,.doc,.pdf,.json,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                选择文件
              </label>
            </div>
          </div>
        </div>

        {/* 已选择的文件列表 */}
        {files.length > 0 && (
          <div className="mt-4">
            <h5 className="text-sm font-medium text-text-secondary mb-2">
              已选择 {files.length} 个文件:
            </h5>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-primary-600" />
                    <div>
                      <div className="font-medium text-text-primary">{file.name}</div>
                      <div className="text-sm text-text-secondary">
                        {(file.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setFiles(files.filter((_, i) => i !== index))}
                    className="p-1 text-text-secondary hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 解析按钮 */}
        {files.length > 0 && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleParse}
              disabled={isProcessing || !selectedProvider}
              className="btn-primary px-8 py-3 flex items-center space-x-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>解析中...</span>
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  <span>开始AI解析</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* 错误信息 */}
        {parseError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="text-sm font-medium text-red-800">解析失败</h5>
                <p className="text-sm text-red-700 mt-1">{parseError}</p>
              </div>
            </div>
          </div>
        )}

        {/* 解析结果 */}
        {parseResult && parseResult.success && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h5 className="text-sm font-medium text-green-800">
                  解析完成 - 共找到 {getTotalItemCount(parseResult.data)} 个项目
                </h5>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSelectAll}
                  className="text-xs text-primary-600 hover:text-primary-800"
                >
                  全选
                </button>
                <span className="text-text-tertiary">|</span>
                <button
                  onClick={handleDeselectAll}
                  className="text-xs text-primary-600 hover:text-primary-800"
                >
                  取消全选
                </button>
              </div>
            </div>

            {/* 结果预览 */}
            {showPreview && (
              <div className="bg-bg-tertiary rounded-lg p-4 max-h-60 overflow-y-auto">
                <pre className="text-xs text-text-secondary whitespace-pre-wrap">
                  {JSON.stringify(parseResult.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AIDocumentParser