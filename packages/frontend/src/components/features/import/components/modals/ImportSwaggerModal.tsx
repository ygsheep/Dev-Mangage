import React, { useState } from 'react'
import { X, Upload, Link as LinkIcon } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { apiMethods } from '../../../../../utils/api'

interface ImportSwaggerModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  onSuccess?: () => void
}

/**
 * Swagger导入模态框组件
 * 支持URL和文件内容两种导入方式
 */
const ImportSwaggerModal: React.FC<ImportSwaggerModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onSuccess
}) => {
  const [importType, setImportType] = useState<'url' | 'content'>('url')
  const [swaggerUrl, setSwaggerUrl] = useState('')
  const [swaggerContent, setSwaggerContent] = useState('')

  // 导入Swagger mutation
  const importMutation = useMutation({
    mutationFn: (data: any) => apiMethods.importSwagger(data),
    onSuccess: (result: any) => {
      const { imported, skipped, errors } = result.data
      toast.success(`导入完成：${imported} 个API已导入，${skipped} 个已跳过，${errors} 个错误`)
      onSuccess?.()
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '导入失败')
    }
  })

  /**
   * 处理导入提交
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const data = {
      projectId,
      type: importType,
      ...(importType === 'url' ? { url: swaggerUrl } : { content: swaggerContent })
    }
    
    importMutation.mutate(data)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">导入Swagger文档</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 导入类型选择 */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setImportType('url')}
              className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                importType === 'url'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <LinkIcon className="h-5 w-5 mx-auto mb-1" />
              <div className="text-sm font-medium">URL导入</div>
            </button>
            <button
              type="button"
              onClick={() => setImportType('content')}
              className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                importType === 'content'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Upload className="h-5 w-5 mx-auto mb-1" />
              <div className="text-sm font-medium">内容导入</div>
            </button>
          </div>

          {/* 输入区域 */}
          {importType === 'url' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Swagger文档URL
              </label>
              <input
                type="url"
                value={swaggerUrl}
                onChange={(e) => setSwaggerUrl(e.target.value)}
                placeholder="https://api.example.com/swagger.json"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Swagger文档内容
              </label>
              <textarea
                value={swaggerContent}
                onChange={(e) => setSwaggerContent(e.target.value)}
                placeholder="粘贴Swagger JSON或YAML内容..."
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={importMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {importMutation.isPending ? '导入中...' : '导入'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ImportSwaggerModal