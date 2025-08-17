import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ArrowLeft, Link as LinkIcon, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiMethods } from '../utils/api'

const SwaggerImportPage: React.FC = () => {
  const navigate = useNavigate()
  const [importType, setImportType] = useState<'url' | 'content'>('url')
  const [swaggerUrl, setSwaggerUrl] = useState('')
  const [swaggerContent, setSwaggerContent] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [validationResult, setValidationResult] = useState<any>(null)
  const [importOptions, setImportOptions] = useState({
    overwriteExisting: false,
    createTags: true,
    defaultStatus: 'NOT_STARTED',
  })

  // Fetch projects for selection
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiMethods.getProjects({ limit: 100 }),
  })

  const projects = projectsData?.data?.projects || []

  // Validate Swagger mutation
  const validateMutation = useMutation({
    mutationFn: (data: any) => apiMethods.validateSwagger(data),
    onSuccess: (result: any) => {
        setValidationResult(result.data)
      toast.success('Swagger文档验证成功')
    },
    onError: (error: any) => {
      setValidationResult(null)
      toast.error(error.response?.data?.error?.message || 'Swagger文档验证失败')
    },
  })

  // Import Swagger mutation
  const importMutation = useMutation({
    mutationFn: (data: any) => apiMethods.importSwagger(data),
    onSuccess: (result: any) => {
        const { imported, skipped, errors } = result.data
      toast.success(`导入完成：${imported} 个API已导入，${skipped} 个已跳过，${errors} 个错误`)
      if (selectedProjectId) {
        navigate(`/projects/${selectedProjectId}`)
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || '导入失败')
    },
  })

  const handleValidate = () => {
    if (!swaggerUrl && !swaggerContent) {
      toast.error('请输入Swagger URL或内容')
      return
    }

    const data = importType === 'url' 
      ? { url: swaggerUrl }
      : { content: swaggerContent }

    validateMutation.mutate(data)
  }

  const handleImport = () => {
    if (!selectedProjectId) {
      toast.error('请选择目标项目')
      return
    }

    if (!validationResult?.valid) {
      toast.error('请先验证Swagger文档')
      return
    }

    const data = {
      projectId: selectedProjectId,
      ...(importType === 'url' 
        ? { url: swaggerUrl }
        : { content: swaggerContent }),
      options: importOptions,
    }

    importMutation.mutate(data)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">导入Swagger文档</h1>
            <p className="text-text-secondary">从Swagger/OpenAPI文档导入API定义</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Input */}
        <div className="space-y-6">
          {/* Import Type Selection */}
          <div className="card">
            <h3 className="text-lg font-semibold text-text-primary mb-4">导入方式</h3>
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setImportType('url')}
                className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  importType === 'url'
                    ? 'bg-bg-paper text-primary-600 shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <LinkIcon className="w-4 h-4" />
                <span>URL链接</span>
              </button>
              <button
                onClick={() => setImportType('content')}
                className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  importType === 'content'
                    ? 'bg-bg-paper text-primary-600 shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>JSON内容</span>
              </button>
            </div>
          </div>

          {/* Input Area */}
          <div className="card">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              {importType === 'url' ? 'Swagger URL' : 'Swagger JSON内容'}
            </h3>
            
            {importType === 'url' ? (
              <div>
                <input
                  type="url"
                  value={swaggerUrl}
                  onChange={(e) => setSwaggerUrl(e.target.value)}
                  placeholder="https://api.example.com/swagger.json"
                  className="input"
                />
                <p className="mt-2 text-sm text-gray-500">
                  输入Swagger文档的URL地址
                </p>
              </div>
            ) : (
              <div>
                <textarea
                  value={swaggerContent}
                  onChange={(e) => setSwaggerContent(e.target.value)}
                  rows={12}
                  className="input font-mono text-sm resize-none"
                  placeholder='{"swagger": "2.0", "info": {...}, "paths": {...}}'
                />
                <p className="mt-2 text-sm text-gray-500">
                  粘贴Swagger JSON内容
                </p>
              </div>
            )}

            <div className="mt-4">
              <button
                onClick={handleValidate}
                disabled={validateMutation.isPending}
                className="btn-primary"
              >
                {validateMutation.isPending ? '验证中...' : '验证文档'}
              </button>
            </div>
          </div>

          {/* Project Selection */}
          <div className="card">
            <h3 className="text-lg font-semibold text-text-primary mb-4">目标项目</h3>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="input"
            >
              <option value="">选择项目</option>
              {projects.map((project: any) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Import Options */}
          <div className="card">
            <h3 className="text-lg font-semibold text-text-primary mb-4">导入选项</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={importOptions.overwriteExisting}
                  onChange={(e) => setImportOptions(prev => ({
                    ...prev,
                    overwriteExisting: e.target.checked
                  }))}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">覆盖已存在的API</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={importOptions.createTags}
                  onChange={(e) => setImportOptions(prev => ({
                    ...prev,
                    createTags: e.target.checked
                  }))}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">自动创建标签</span>
              </label>

              <div>
                <label className="label">默认状态</label>
                <select
                  value={importOptions.defaultStatus}
                  onChange={(e) => setImportOptions(prev => ({
                    ...prev,
                    defaultStatus: e.target.value
                  }))}
                  className="input"
                >
                  <option value="NOT_STARTED">未开发</option>
                  <option value="IN_PROGRESS">开发中</option>
                  <option value="COMPLETED">已完成</option>
                </select>
              </div>
            </div>
          </div>

          {/* Import Button */}
          <div className="card">
            <button
              onClick={handleImport}
              disabled={!validationResult?.valid || !selectedProjectId || importMutation.isPending}
              className="btn-primary w-full"
            >
              {importMutation.isPending ? '导入中...' : '开始导入'}
            </button>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="space-y-6">
          {/* Validation Result */}
          {validationResult && (
            <div className="card">
              <div className="flex items-center space-x-2 mb-4">
                {validationResult.valid ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                <h3 className="text-lg font-semibold text-text-primary">验证结果</h3>
              </div>

              {validationResult.valid ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 mb-2">文档信息</h4>
                    <dl className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-green-600">标题:</dt>
                        <dd className="text-green-800 font-medium">{validationResult.info?.title}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-green-600">版本:</dt>
                        <dd className="text-green-800">{validationResult.info?.version}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-green-600">端点数量:</dt>
                        <dd className="text-green-800">{validationResult.info?.endpoints}</dd>
                      </div>
                    </dl>
                  </div>

                  {validationResult.info?.description && (
                    <div>
                      <h4 className="font-medium text-text-primary mb-2">描述</h4>
                      <p className="text-sm text-text-secondary">{validationResult.info.description}</p>
                    </div>
                  )}

                  {validationResult.info?.methods && (
                    <div>
                      <h4 className="font-medium text-text-primary mb-2">HTTP方法</h4>
                      <div className="flex flex-wrap gap-1">
                        {validationResult.info.methods.map((method: string) => (
                          <span
                            key={method}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {method}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">文档验证失败，请检查格式是否正确</p>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-text-primary mb-4">使用说明</h3>
            <div className="space-y-3 text-sm text-text-secondary">
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-5 h-5 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-medium">1</span>
                <p>选择导入方式：URL链接或直接粘贴JSON内容</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-5 h-5 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-medium">2</span>
                <p>输入Swagger文档内容并点击"验证文档"</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-5 h-5 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-medium">3</span>
                <p>选择要导入到的目标项目</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-5 h-5 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-medium">4</span>
                <p>配置导入选项并开始导入</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SwaggerImportPage