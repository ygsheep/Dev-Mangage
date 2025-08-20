import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Brain, 
  FileText, 
  Database, 
  Layers, 
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Workflow,
  FileCode
} from 'lucide-react'
import { toast } from 'react-hot-toast'

import AIDocumentParser, { ParseType, PARSE_TYPE_CONFIG } from '../components/common/AIDocumentParser'
import { useProjects } from '../hooks/useProjects'
import { 
  createBatchDataTables,
  createBatchAPIs,
  createBatchFeatureModules
} from '../utils/api'

const AIDocumentParsePage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { data: projects } = useProjects()
  
  const [selectedParseType, setSelectedParseType] = useState<ParseType>(ParseType.DATA_MODEL)
  const [isImporting, setIsImporting] = useState(false)
  const [parseResults, setParseResults] = useState<any>(null)
  const [currentProject, setCurrentProject] = useState<any>(null)

  useEffect(() => {
    if (projects && projectId) {
      const project = projects.find((p: any) => p.id === projectId)
      setCurrentProject(project)
    }
  }, [projects, projectId])

  const handleParseComplete = (result: any) => {
    setParseResults(result)
    toast.success('文档解析完成！')
  }

  const handleParseError = (error: string) => {
    toast.error(`解析失败: ${error}`)
  }

  const handleImportToDatabase = async () => {
    if (!parseResults?.data || !projectId) {
      toast.error('没有可导入的数据')
      return
    }

    setIsImporting(true)
    
    try {
      const { data } = parseResults
      
      switch (selectedParseType) {
        case ParseType.DATA_MODEL:
          if (data.tables && data.tables.length > 0) {
            const response = await createBatchDataTables(projectId, data.tables)
            if (response.success) {
              toast.success(`成功导入 ${data.tables.length} 个数据表`)
              navigate(`/projects/${projectId}/data-model`)
            } else {
              throw new Error(response.error || '导入数据表失败')
            }
          }
          break
          
        case ParseType.API_DOCUMENTATION:
          if (data.apis && data.apis.length > 0) {
            const response = await createBatchAPIs(projectId, data.apis)
            if (response.success) {
              toast.success(`成功导入 ${data.apis.length} 个API接口`)
              navigate(`/projects/${projectId}/api-management`)
            } else {
              throw new Error(response.error || '导入API接口失败')
            }
          }
          break
          
        case ParseType.FEATURE_MODULE:
          if (data.modules && data.modules.length > 0) {
            const response = await createBatchFeatureModules(projectId, data.modules)
            if (response.success) {
              toast.success(`成功导入 ${data.modules.length} 个功能模块`)
              navigate(`/projects/${projectId}`)
            } else {
              throw new Error(response.error || '导入功能模块失败')
            }
          }
          break
          
        default:
          toast.info('该解析类型暂不支持直接导入到数据库')
      }
    } catch (error: any) {
      console.error('导入失败:', error)
      toast.error(error.message || '导入失败')
    } finally {
      setIsImporting(false)
    }
  }

  const getParseTypeItems = () => {
    if (!parseResults?.data) return []
    
    switch (selectedParseType) {
      case ParseType.DATA_MODEL:
        return parseResults.data.tables || []
      case ParseType.API_DOCUMENTATION:
        return parseResults.data.apis || []
      case ParseType.FEATURE_MODULE:
        return parseResults.data.modules || []
      case ParseType.BUSINESS_PROCESS:
        return parseResults.data.processes || []
      case ParseType.TECHNICAL_SPEC:
        return parseResults.data.components || []
      default:
        return []
    }
  }

  const canImportToDatabase = () => {
    return [ParseType.DATA_MODEL, ParseType.API_DOCUMENTATION, ParseType.FEATURE_MODULE].includes(selectedParseType)
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* 头部导航 */}
      <div className="bg-bg-paper border-b border-border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center space-x-3">
                <Brain className="w-8 h-8 text-primary-600" />
                <div>
                  <h1 className="text-xl font-semibold text-text-primary">
                    AI文档解析
                  </h1>
                  {currentProject && (
                    <p className="text-sm text-text-secondary">
                      项目: {currentProject.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 左侧解析类型选择 */}
          <div className="lg:col-span-1">
            <div className="bg-bg-paper rounded-lg shadow-theme-sm border border-border-primary p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">解析类型</h3>
              
              <div className="space-y-2">
                {Object.entries(PARSE_TYPE_CONFIG).map(([type, config]) => {
                  const IconComponent = config.icon
                  const isSelected = selectedParseType === type
                  
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedParseType(type as ParseType)}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-left ${
                        isSelected
                          ? 'bg-primary-50 border border-primary-200 text-primary-700'
                          : 'hover:bg-bg-tertiary text-text-secondary'
                      }`}
                    >
                      <IconComponent className={`w-5 h-5 ${isSelected ? 'text-primary-600' : 'text-text-tertiary'}`} />
                      <div className="flex-1">
                        <div className={`font-medium ${isSelected ? 'text-primary-700' : 'text-text-primary'}`}>
                          {config.label}
                        </div>
                        <div className={`text-xs ${isSelected ? 'text-primary-600' : 'text-text-tertiary'}`}>
                          {config.description}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 右侧主要内容 */}
          <div className="lg:col-span-3">
            <div className="space-y-8">
              {/* AI解析组件 */}
              <AIDocumentParser
                projectId={projectId || ''}
                parseType={selectedParseType}
                onParseComplete={handleParseComplete}
                onError={handleParseError}
              />

              {/* 解析结果和导入操作 */}
              {parseResults && (
                <div className="bg-bg-paper rounded-lg shadow-theme-sm border border-border-primary p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h3 className="text-lg font-semibold text-text-primary">
                        解析结果
                      </h3>
                    </div>
                    
                    {canImportToDatabase() && (
                      <button
                        onClick={handleImportToDatabase}
                        disabled={isImporting || getParseTypeItems().length === 0}
                        className="btn-primary px-6 py-2 flex items-center space-x-2 disabled:opacity-50"
                      >
                        {isImporting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>导入中...</span>
                          </>
                        ) : (
                          <>
                            <Database className="w-4 h-4" />
                            <span>导入到数据库</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* 结果统计 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-bg-tertiary rounded-lg p-4">
                      <div className="text-2xl font-bold text-primary-600">
                        {getParseTypeItems().length}
                      </div>
                      <div className="text-sm text-text-secondary">
                        {PARSE_TYPE_CONFIG[selectedParseType].label.replace('解析', '')}
                      </div>
                    </div>
                    
                    <div className="bg-bg-tertiary rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-600">
                        {parseResults.metadata?.processingTime || 0}ms
                      </div>
                      <div className="text-sm text-text-secondary">
                        处理时间
                      </div>
                    </div>
                    
                    <div className="bg-bg-tertiary rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-600">
                        {parseResults.metadata?.provider || 'Unknown'}
                      </div>
                      <div className="text-sm text-text-secondary">
                        AI提供者
                      </div>
                    </div>
                  </div>

                  {/* 不能导入的类型提示 */}
                  {!canImportToDatabase() && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h5 className="text-sm font-medium text-amber-800">
                            该解析类型暂不支持直接导入
                          </h5>
                          <p className="text-sm text-amber-700 mt-1">
                            您可以查看解析结果并手动复制相关内容，或等待后续版本支持。
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIDocumentParsePage