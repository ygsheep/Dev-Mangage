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
  RefreshCw
} from 'lucide-react'
import { DatabaseTable, DatabaseField } from '@shared/types'
import { 
  parseDocument, 
  getAIProvidersDetailed, 
  getAIServiceHealth,
  getAIModels,
  autoSelectBestModel
} from '../../../../utils/api'
import { toast } from 'react-hot-toast'
import SQLPreview from '../../../common/SQLPreview'

interface ParsedTableResult {
  name: string
  displayName: string
  comment?: string
  fields: Array<{
    name: string
    type: string
    length?: string
    nullable: boolean
    defaultValue?: string
    comment?: string
    isPrimaryKey: boolean
    isAutoIncrement: boolean
  }>
  indexes?: Array<{
    name: string
    type: string
    fields: string[]
    isUnique: boolean
  }>
}

interface ParseResult {
  success: boolean
  tables: ParsedTableResult[]
  errors?: string[]
  metadata?: {
    provider: string
    timestamp: Date
    processingTime: number
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
  onTablesImported: (tables: ParsedTableResult[]) => void
  onClose: () => void
}

const AIDocumentParser: React.FC<AIDocumentParserProps> = ({
  projectId,
  onTablesImported,
  onClose
}) => {
  const [file, setFile] = useState<File | null>(null)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [availableModels, setAvailableModels] = useState<AIModel[]>([])
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set())
  const [showPreview, setShowPreview] = useState(false)
  const [availableProviders, setAvailableProviders] = useState<AIProvider[]>([])
  const [serviceHealth, setServiceHealth] = useState<any>(null)

  const supportedFileTypes = {
    'text/markdown': ['.md', '.markdown'],
    'text/plain': ['.txt', '.sql'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.ms-excel': ['.xls'],
    'text/csv': ['.csv'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/msword': ['.doc'],
    'application/pdf': ['.pdf'],
    'application/json': ['.json']
  }

  // 加载AI服务信息
  useEffect(() => {
    const loadAIInfo = async () => {
      try {
        const [providers, health, models] = await Promise.all([
          getAIProvidersDetailed(),
          getAIServiceHealth(),
          getAIModels() // 获取所有提供者的模型列表
        ])
        
        setAvailableProviders(providers.data || [])
        setServiceHealth(health.data)
        
        // 设置默认提供者
        if (providers.data && providers.data.length > 0) {
          const defaultProvider = providers.data[0].name
          handleProviderChange(defaultProvider)
        }
        
        // 显示模型信息
        if (models.data && models.data.length > 0) {
          const totalModels = models.data.reduce((total, provider) => total + provider.models.length, 0)
          console.log('检测到可用模型:', { 
            providers: models.data.length, 
            totalModels,
            details: models.data 
          })
        }
        
      } catch (error) {
        console.error('加载AI服务信息失败:', error)
        toast.error('加载AI服务信息失败')
      }
    }

    loadAIInfo()
  }, [])

  // 处理提供商变更
  const handleProviderChange = async (providerName: string) => {
    setSelectedProvider(providerName)
    setSelectedModel('')
    setAvailableModels([])
    
    try {
      // 获取该提供商的模型列表
      const modelsResponse = await getAIModels(providerName)
      if (modelsResponse.success && modelsResponse.data) {
        const providerModels = modelsResponse.data.find(p => p.provider === providerName)
        if (providerModels && providerModels.models.length > 0) {
          setAvailableModels(providerModels.models)
          // 自动选择第一个模型
          setSelectedModel(providerModels.models[0].name)
        }
      }
      
      // 尝试自动选择最佳模型
      try {
        const bestModelResponse = await autoSelectBestModel(providerName)
        if (bestModelResponse.success && bestModelResponse.data) {
          setSelectedModel(bestModelResponse.data.selectedModel)
          toast.success(`已自动选择最佳模型: ${bestModelResponse.data.selectedModel}`)
        }
      } catch (error) {
        console.warn('自动选择模型失败:', error)
      }
    } catch (error) {
      console.error('获取模型列表失败:', error)
      toast.error('获取模型列表失败')
    }
  }

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile)
    setParseResult(null)
    setSelectedTables(new Set())
  }, [])

  const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }, [handleFileSelect])

  const handleFileUpload = useCallback(async () => {
    if (!file) return

    setIsUploading(true)
    try {
      // 模拟文件上传
      await new Promise(resolve => setTimeout(resolve, 1000))
      setIsUploading(false)
      
      // 开始AI解析
      await handleAIParse()
    } catch (error) {
      setIsUploading(false)
      console.error('文件上传失败:', error)
    }
  }, [file])

  const handleAIParse = useCallback(async () => {
    if (!file || !selectedProvider) return

    setIsParsing(true)
    try {
      // 读取文件内容
      const fileContent = await readFileContent(file)
      
      // 确定文档类型
      const documentType = getDocumentType(file)
      
      // 调用AI解析API
      const response = await parseDocument({
        projectId,
        content: fileContent,
        type: documentType,
        filename: file.name,
        provider: selectedProvider,
        model: selectedModel,
        strictMode: false,
        confidenceThreshold: 0.7
      })

      if (response.success && response.data) {
        const result: ParseResult = {
          success: true,
          tables: response.data.data?.tables || [],
          metadata: response.data.metadata
        }
        
        setParseResult(result)
        
        // 默认选中所有表
        const allTableNames = new Set(result.tables.map(t => t.name))
        setSelectedTables(allTableNames)
        
        toast.success(`成功解析出 ${result.tables.length} 张表`)
      } else {
        throw new Error(response.data?.error || '解析失败')
      }
    } catch (error: any) {
      console.error('AI解析失败:', error)
      setParseResult({
        success: false,
        tables: [],
        errors: [error.message || 'AI解析失败']
      })
      toast.error('AI解析失败: ' + (error.message || '未知错误'))
    } finally {
      setIsParsing(false)
    }
  }, [file, selectedProvider, projectId])

  // 读取文件内容的辅助函数
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = (e) => reject(new Error('文件读取失败'))
      reader.readAsText(file, 'utf-8')
    })
  }

  // 获取文档类型的辅助函数
  const getDocumentType = (file: File): string => {
    const ext = file.name.toLowerCase().split('.').pop()
    const mimeType = file.type
    
    // 根据文件扩展名和MIME类型确定文档类型
    if (ext === 'md' || ext === 'markdown') return 'MARKDOWN'
    if (ext === 'sql') return 'SQL'
    if (ext === 'xlsx' || ext === 'xls') return 'EXCEL'
    if (ext === 'csv') return 'CSV'
    if (ext === 'docx' || ext === 'doc') return 'WORD'
    if (ext === 'pdf') return 'PDF'
    if (ext === 'json') return 'JSON'
    if (ext === 'txt') return 'TEXT'
    
    // 根据MIME类型推断
    if (mimeType.includes('json')) return 'JSON'
    if (mimeType.includes('csv')) return 'CSV'
    if (mimeType.includes('markdown')) return 'MARKDOWN'
    if (mimeType.includes('sql')) return 'SQL'
    
    return 'TEXT' // 默认类型
  }

  const handleTableToggle = (tableName: string) => {
    const newSelected = new Set(selectedTables)
    if (newSelected.has(tableName)) {
      newSelected.delete(tableName)
    } else {
      newSelected.add(tableName)
    }
    setSelectedTables(newSelected)
  }

  const handleImportTables = () => {
    if (!parseResult?.tables) return

    const tablesToImport = parseResult.tables.filter(table => 
      selectedTables.has(table.name)
    )
    
    onTablesImported(tablesToImport)
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.toLowerCase().split('.').pop()
    switch (ext) {
      case 'md':
      case 'markdown':
        return '📝'
      case 'sql':
        return '🗄️'
      case 'xlsx':
      case 'xls':
        return '📊'
      case 'csv':
        return '📋'
      case 'docx':
      case 'doc':
        return '📄'
      case 'pdf':
        return '📕'
      case 'json':
        return '🔧'
      default:
        return '📄'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center space-x-3">
            <Brain className="w-8 h-8 text-blue-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">AI文档解析</h2>
              <p className="text-gray-600">智能解析数据库设计文档，自动生成表结构</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[calc(90vh-80px)] overflow-y-auto">
          {/* 第一步：文件上传 */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                第一步：选择文档文件
              </h3>
              
              {!file ? (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                  onDrop={handleFileDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">点击选择文件或拖拽文件到此处</p>
                  <p className="text-sm text-gray-500">
                    支持格式: MD, SQL, Excel, Word, PDF, JSON
                  </p>
                  
                  <input
                    id="file-input"
                    type="file"
                    className="hidden"
                    accept=".md,.sql,.xlsx,.xls,.csv,.docx,.doc,.pdf,.json,.txt"
                    onChange={(e) => {
                      const selectedFile = e.target.files?.[0]
                      if (selectedFile) handleFileSelect(selectedFile)
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                  <span className="text-2xl">{getFileIcon(file.name)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              )}
            </div>

            {/* 第二步：AI配置 */}
            {file && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  第二步：AI解析配置
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      AI服务提供商
                      {serviceHealth && (
                        <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                          serviceHealth.overall === 'healthy' ? 'bg-green-100 text-green-800' :
                          serviceHealth.overall === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {serviceHealth.overall === 'healthy' ? '服务正常' :
                           serviceHealth.overall === 'degraded' ? '部分可用' : '服务异常'}
                        </span>
                      )}
                    </label>
                    
                    {availableProviders.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3">
                        {availableProviders.map((provider, index) => (
                          <label
                            key={provider.id || provider.name || index}
                            className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                              selectedProvider === provider.name
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            } ${provider.status !== 'healthy' ? 'opacity-50' : ''}`}
                          >
                            <div className="flex items-center space-x-3">
                              <input
                                type="radio"
                                name="provider"
                                value={provider.name}
                                checked={selectedProvider === provider.name}
                                onChange={(e) => handleProviderChange(e.target.value)}
                                disabled={provider.status !== 'healthy'}
                                className="rounded border-gray-300"
                              />
                              {provider.icon && (
                                <img 
                                  src={provider.icon} 
                                  alt={provider.displayName} 
                                  className="w-8 h-8 object-contain"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                  }}
                                />
                              )}
                              <div>
                                <span className="font-medium text-sm">{provider.displayName}</span>
                                <p className="text-xs text-gray-500 mt-1">{provider.description}</p>
                                <p className="text-xs text-gray-400">模型: {provider.model}</p>
                              </div>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${
                              provider.status === 'healthy' ? 'bg-green-500' : 
                              provider.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                        <p className="text-sm text-gray-500">正在加载AI服务提供商...</p>
                      </div>
                    )}
                  </div>
                  
                  {/* 模型选择 */}
                  {selectedProvider && availableModels.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        模型选择
                      </label>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">请选择模型</option>
                        {availableModels.map((model, index) => (
                          <option key={model.name || index} value={model.name}>
                            {model.name} {model.size ? `(${(model.size / 1024 / 1024 / 1024).toFixed(1)}GB)` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <button
                    onClick={handleFileUpload}
                    disabled={isUploading || isParsing || !selectedProvider || !selectedModel}
                    className="w-full btn-primary flex items-center justify-center space-x-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>上传中...</span>
                      </>
                    ) : isParsing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>AI解析中...</span>
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4" />
                        <span>开始AI解析</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* 第三步：解析结果 */}
            {parseResult && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  {parseResult.success ? (
                    <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
                  )}
                  第三步：解析结果确认
                </h3>
                
                {parseResult.success ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        成功解析 {parseResult.tables.length} 张表，
                        选中 {selectedTables.size} 张表进行导入
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setShowPreview(!showPreview)}
                          className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                        >
                          <Eye className="w-4 h-4" />
                          <span>{showPreview ? '隐藏' : '预览'}SQL</span>
                        </button>
                        <button
                          onClick={handleAIParse}
                          className="text-sm text-gray-600 hover:text-gray-700 flex items-center space-x-1"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>重新解析</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {parseResult.tables.map((table) => (
                        <div key={table.name} className="bg-white rounded-lg border border-gray-200 p-3">
                          <label className="flex items-start space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedTables.has(table.name)}
                              onChange={() => handleTableToggle(table.name)}
                              className="mt-1 rounded border-gray-300"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <Database className="w-4 h-4 text-gray-500" />
                                <span className="font-medium text-gray-900">
                                  {table.displayName || table.name}
                                </span>
                                <span className="text-sm text-gray-500">
                                  ({table.name})
                                </span>
                              </div>
                              
                              {table.comment && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {table.comment}
                                </p>
                              )}
                              
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                <span>{table.fields.length} 字段</span>
                                <span>{table.indexes?.length || 0} 索引</span>
                                <span>
                                  主键: {table.fields.filter(f => f.isPrimaryKey).map(f => f.name).join(', ') || '无'}
                                </span>
                              </div>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                    
                    {showPreview && (
                      <SQLPreview
                        sql={parseResult.tables
                          .filter(table => selectedTables.has(table.name))
                          .map(table => {
                            const fieldDefs = table.fields.map(field => {
                              let def = `  ${field.name} ${field.type}`
                              if (field.length) def += `(${field.length})`
                              if (!field.nullable) def += ' NOT NULL'
                              if (field.isAutoIncrement) def += ' AUTO_INCREMENT'
                              if (field.defaultValue) def += ` DEFAULT ${field.defaultValue}`
                              if (field.comment) def += ` COMMENT '${field.comment}'`
                              return def
                            })
                            
                            const primaryKeys = table.fields
                              .filter(f => f.isPrimaryKey)
                              .map(f => f.name)
                            
                            if (primaryKeys.length > 0) {
                              fieldDefs.push(`  PRIMARY KEY (${primaryKeys.join(', ')})`)
                            }
                            
                            return `CREATE TABLE ${table.name} (\n${fieldDefs.join(',\n')}\n)${table.comment ? ` COMMENT='${table.comment}'` : ''};`
                          })
                          .join('\n\n')}
                        dialect="MySQL"
                        title="生成的SQL代码"
                        showLineNumbers={true}
                        maxHeight="300px"
                      />
                    )}
                    
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={onClose}
                        className="btn-outline"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleImportTables}
                        disabled={selectedTables.size === 0}
                        className="btn-primary flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>导入选中表 ({selectedTables.size})</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {parseResult.errors?.map((error, index) => (
                      <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-5 h-5 text-red-500" />
                          <span className="text-red-700">{error}</span>
                        </div>
                      </div>
                    ))}
                    
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={handleAIParse}
                        className="btn-outline flex items-center space-x-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>重试</span>
                      </button>
                      <button
                        onClick={onClose}
                        className="btn-primary"
                      >
                        关闭
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIDocumentParser