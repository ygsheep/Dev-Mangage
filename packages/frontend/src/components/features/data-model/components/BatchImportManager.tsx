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
  Play,
  Pause,
  Square,
  Clock,
  Users,
  Activity,
  BarChart3,
  FileCheck,
  FileX
} from 'lucide-react'
import {
  createBatchImportJob,
  getBatchImportJobStatus,
  getBatchImportJobs,
  cancelBatchImportJob,
  getBatchImportJobReport,
  getAIProviders
} from '../../../../utils/api'
import { toast } from 'react-hot-toast'

interface BatchImportDocument {
  filename: string
  content: string
  type: string
  size: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error?: string
}

interface BatchImportJob {
  id: string
  projectId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  totalDocuments: number
  processedDocuments: number
  successfulDocuments: number
  failedDocuments: number
  createdAt: string
  startedAt?: string
  completedAt?: string
  estimatedTimeRemaining?: number
  currentDocument?: string
  results?: {
    documents: Array<{
      filename: string
      status: string
      tablesFound: number
      error?: string
    }>
    report: {
      totalTables: number
      successRate: number
      processingTime: number
      errors: string[]
    }
  }
}

interface BatchImportManagerProps {
  projectId: string
  onImportComplete?: (results: any) => void
  onClose: () => void
}

const BatchImportManager: React.FC<BatchImportManagerProps> = ({
  projectId,
  onImportComplete,
  onClose
}) => {
  const [documents, setDocuments] = useState<BatchImportDocument[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [currentJob, setCurrentJob] = useState<BatchImportJob | null>(null)
  const [allJobs, setAllJobs] = useState<BatchImportJob[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [availableProviders, setAvailableProviders] = useState<any[]>([])
  const [showJobHistory, setShowJobHistory] = useState(false)
  const [processingOptions, setProcessingOptions] = useState({
    mode: 'sequential' as 'sequential' | 'parallel',
    autoCorrection: true,
    validationStrict: false,
    maxRetries: 3,
    batchSize: 10
  })

  // 加载AI服务提供商
  useEffect(() => {
    const loadProviders = async () => {
      try {
        const response = await getAIProviders()
        setAvailableProviders(response.data || [])
        if (response.data && response.data.length > 0) {
          setSelectedProvider(response.data[0].name)
        }
      } catch (error) {
        console.error('加载AI服务提供商失败:', error)
        toast.error('加载AI服务提供商失败')
      }
    }

    loadProviders()
  }, [])

  // 加载历史任务
  useEffect(() => {
    const loadJobs = async () => {
      try {
        const response = await getBatchImportJobs()
        setAllJobs(response.data || [])
      } catch (error) {
        console.error('加载任务历史失败:', error)
      }
    }

    loadJobs()
  }, [])

  // 轮询当前任务状态
  useEffect(() => {
    if (!currentJob || currentJob.status === 'completed' || currentJob.status === 'failed' || currentJob.status === 'cancelled') {
      return
    }

    const interval = setInterval(async () => {
      try {
        const response = await getBatchImportJobStatus(currentJob.id)
        if (response.data) {
          setCurrentJob(response.data)
          
          if (response.data.status === 'completed') {
            toast.success('批量导入完成！')
            if (onImportComplete) {
              onImportComplete(response.data.results)
            }
          } else if (response.data.status === 'failed') {
            toast.error('批量导入失败')
          }
        }
      } catch (error) {
        console.error('获取任务状态失败:', error)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [currentJob, onImportComplete])

  const handleFilesSelect = useCallback((files: FileList) => {
    const newDocuments: BatchImportDocument[] = []
    
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        const docType = getDocumentType(file)
        
        newDocuments.push({
          filename: file.name,
          content,
          type: docType,
          size: file.size,
          status: 'pending'
        })
        
        if (newDocuments.length === files.length) {
          setDocuments(prev => [...prev, ...newDocuments])
        }
      }
      reader.readAsText(file, 'utf-8')
    })
  }, [])

  const getDocumentType = (file: File): string => {
    const ext = file.name.toLowerCase().split('.').pop()
    
    if (ext === 'md' || ext === 'markdown') return 'MARKDOWN'
    if (ext === 'sql') return 'SQL'
    if (ext === 'xlsx' || ext === 'xls') return 'EXCEL'
    if (ext === 'csv') return 'CSV'
    if (ext === 'docx' || ext === 'doc') return 'WORD'
    if (ext === 'pdf') return 'PDF'
    if (ext === 'json') return 'JSON'
    if (ext === 'txt') return 'TEXT'
    
    return 'TEXT'
  }

  const handleStartBatchImport = async () => {
    if (documents.length === 0 || !selectedProvider) {
      toast.error('请先添加文档并选择AI服务提供商')
      return
    }

    setIsProcessing(true)
    try {
      const response = await createBatchImportJob({
        projectId,
        documents: documents.map(doc => ({
          filename: doc.filename,
          content: doc.content,
          type: doc.type
        })),
        options: {
          provider: selectedProvider,
          ...processingOptions
        }
      })

      if (response.success && response.data) {
        setCurrentJob({
          id: response.data.jobId,
          projectId,
          status: 'pending',
          totalDocuments: documents.length,
          processedDocuments: 0,
          successfulDocuments: 0,
          failedDocuments: 0,
          createdAt: new Date().toISOString()
        })
        
        toast.success('批量导入任务已启动')
      } else {
        throw new Error(response.error || '启动任务失败')
      }
    } catch (error: any) {
      console.error('启动批量导入失败:', error)
      toast.error('启动批量导入失败: ' + (error.message || '未知错误'))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancelJob = async () => {
    if (!currentJob) return

    try {
      await cancelBatchImportJob(currentJob.id)
      setCurrentJob({ ...currentJob, status: 'cancelled' })
      toast.success('任务已取消')
    } catch (error) {
      console.error('取消任务失败:', error)
      toast.error('取消任务失败')
    }
  }

  const handleRemoveDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index))
  }

  const handleClearAll = () => {
    setDocuments([])
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-500" />
      case 'running':
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'cancelled':
        return <X className="w-4 h-4 text-gray-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '等待中'
      case 'running': return '运行中'
      case 'processing': return '处理中'
      case 'completed': return '已完成'
      case 'failed': return '失败'
      case 'cancelled': return '已取消'
      default: return '未知'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const calculateProgress = () => {
    if (!currentJob || currentJob.totalDocuments === 0) return 0
    return Math.round((currentJob.processedDocuments / currentJob.totalDocuments) * 100)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-paper rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-header">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-purple-500" />
            <div>
              <h2 className="text-xl font-semibold text-text-primary">批量导入管理器</h2>
              <p className="text-text-secondary">智能批量解析多个文档，高效管理导入流程</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowJobHistory(!showJobHistory)}
              className="btn-outline flex items-center space-x-2"
            >
              <Activity className="w-4 h-4" />
              <span>任务历史</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* 左侧：文档管理 */}
          <div className="w-1/2 border-r border-gray-200 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* 文档上传区域 */}
              <div className="bg-bg-secondary rounded-lg p-4">
                <h3 className="font-medium text-text-primary mb-3 flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  添加文档文件
                </h3>
                
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('batch-file-input')?.click()}
                  onDrop={(e) => {
                    e.preventDefault()
                    handleFilesSelect(e.dataTransfer.files)
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-text-secondary mb-1">点击选择文件或拖拽到此处</p>
                  <p className="text-sm text-gray-500">支持 MD, SQL, Excel, Word, PDF, JSON 等格式</p>
                  
                  <input
                    id="batch-file-input"
                    type="file"
                    multiple
                    className="hidden"
                    accept=".md,.sql,.xlsx,.xls,.csv,.docx,.doc,.pdf,.json,.txt"
                    onChange={(e) => {
                      if (e.target.files) {
                        handleFilesSelect(e.target.files)
                      }
                    }}
                  />
                </div>
                
                {documents.length > 0 && (
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-sm text-text-secondary">
                      已添加 {documents.length} 个文档
                    </span>
                    <button
                      onClick={handleClearAll}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      清空全部
                    </button>
                  </div>
                )}
              </div>

              {/* 处理配置 */}
              <div className="bg-bg-secondary rounded-lg p-4">
                <h3 className="font-medium text-text-primary mb-3 flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  处理配置
                </h3>
                
                <div className="space-y-4">
                  {/* AI服务提供商 */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      AI服务提供商
                    </label>
                    <select
                      value={selectedProvider}
                      onChange={(e) => setSelectedProvider(e.target.value)}
                      className="input w-full"
                    >
                      <option value="">请选择</option>
                      {availableProviders.map(provider => (
                        <option key={provider.name} value={provider.name}>
                          {provider.displayName || provider.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 处理模式 */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      处理模式
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="mode"
                          value="sequential"
                          checked={processingOptions.mode === 'sequential'}
                          onChange={(e) => setProcessingOptions(prev => ({ 
                            ...prev, 
                            mode: e.target.value as 'sequential' | 'parallel' 
                          }))}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">串行处理</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="mode"
                          value="parallel"
                          checked={processingOptions.mode === 'parallel'}
                          onChange={(e) => setProcessingOptions(prev => ({ 
                            ...prev, 
                            mode: e.target.value as 'sequential' | 'parallel' 
                          }))}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">并行处理</span>
                      </label>
                    </div>
                  </div>

                  {/* 其他选项 */}
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={processingOptions.autoCorrection}
                        onChange={(e) => setProcessingOptions(prev => ({ 
                          ...prev, 
                          autoCorrection: e.target.checked 
                        }))}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">自动修正</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={processingOptions.validationStrict}
                        onChange={(e) => setProcessingOptions(prev => ({ 
                          ...prev, 
                          validationStrict: e.target.checked 
                        }))}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">严格验证</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 文档列表 */}
              {documents.length > 0 && (
                <div className="bg-bg-paper rounded-lg border border-gray-200">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <h3 className="font-medium text-text-primary">文档列表</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-text-primary truncate">
                              {doc.filename}
                            </p>
                            <p className="text-xs text-gray-500">
                              {doc.type} • {formatFileSize(doc.size)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(doc.status)}
                          <button
                            onClick={() => handleRemoveDocument(index)}
                            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 开始按钮 */}
              <button
                onClick={handleStartBatchImport}
                disabled={isProcessing || documents.length === 0 || !selectedProvider || (currentJob && ['pending', 'running'].includes(currentJob.status))}
                className="w-full btn-primary flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>启动中...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>开始批量导入</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 右侧：任务监控 */}
          <div className="w-1/2 p-6 overflow-y-auto">
            {currentJob ? (
              <div className="space-y-6">
                {/* 任务状态 */}
                <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-blue-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-blue-900 flex items-center">
                      {getStatusIcon(currentJob.status)}
                      <span className="ml-2">当前任务状态</span>
                    </h3>
                    {currentJob.status === 'running' && (
                      <button
                        onClick={handleCancelJob}
                        className="btn-outline text-sm flex items-center space-x-1"
                      >
                        <Square className="w-3 h-3" />
                        <span>取消</span>
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-text-secondary">状态：</span>
                      <span className="font-medium">{getStatusText(currentJob.status)}</span>
                    </div>
                    <div>
                      <span className="text-text-secondary">进度：</span>
                      <span className="font-medium">{currentJob.processedDocuments}/{currentJob.totalDocuments}</span>
                    </div>
                    <div>
                      <span className="text-text-secondary">成功：</span>
                      <span className="font-medium text-green-600">{currentJob.successfulDocuments}</span>
                    </div>
                    <div>
                      <span className="text-text-secondary">失败：</span>
                      <span className="font-medium text-red-600">{currentJob.failedDocuments}</span>
                    </div>
                  </div>

                  {/* 进度条 */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-text-secondary mb-1">
                      <span>处理进度</span>
                      <span>{calculateProgress()}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-50 dark:bg-primary-900/20 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${calculateProgress()}%` }}
                      />
                    </div>
                  </div>

                  {currentJob.currentDocument && (
                    <div className="mt-3 text-sm text-text-secondary">
                      正在处理：{currentJob.currentDocument}
                    </div>
                  )}
                </div>

                {/* 结果详情 */}
                {currentJob.results && (
                  <div className="bg-bg-paper rounded-lg border border-gray-200">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <h3 className="font-medium text-text-primary flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2" />
                        处理结果
                      </h3>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-text-secondary">总表数：</span>
                          <span className="font-medium">{currentJob.results.report.totalTables}</span>
                        </div>
                        <div>
                          <span className="text-text-secondary">成功率：</span>
                          <span className="font-medium">{currentJob.results.report.successRate}%</span>
                        </div>
                        <div>
                          <span className="text-text-secondary">处理时间：</span>
                          <span className="font-medium">{currentJob.results.report.processingTime}ms</span>
                        </div>
                      </div>

                      {/* 文档结果列表 */}
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {currentJob.results.documents.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-bg-secondary rounded">
                            <div className="flex items-center space-x-2">
                              {doc.status === 'success' ? (
                                <FileCheck className="w-4 h-4 text-green-500" />
                              ) : (
                                <FileX className="w-4 h-4 text-red-500" />
                              )}
                              <span className="text-sm font-medium">{doc.filename}</span>
                            </div>
                            <div className="text-sm text-text-secondary">
                              {doc.status === 'success' ? `${doc.tablesFound} 张表` : doc.error}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-text-primary mb-2">
                  批量导入监控
                </h3>
                <p className="text-text-secondary mb-6">
                  添加文档并配置选项后开始批量导入，这里将显示实时进度
                </p>
              </div>
            )}

            {/* 任务历史 */}
            {showJobHistory && allJobs.length > 0 && (
              <div className="mt-6 bg-bg-paper rounded-lg border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-200">
                  <h3 className="font-medium text-text-primary">任务历史</h3>
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {allJobs.slice(0, 10).map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(job.status)}
                        <div>
                          <p className="text-sm font-medium">{job.totalDocuments} 个文档</p>
                          <p className="text-xs text-gray-500">
                            {new Date(job.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-text-secondary">
                        {job.successfulDocuments}/{job.totalDocuments}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BatchImportManager