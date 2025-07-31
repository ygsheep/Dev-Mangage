import React, { useState } from 'react'
import { Copy, Eye, EyeOff, Code2, MoreVertical } from 'lucide-react'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import toast from 'react-hot-toast'
import { API, HTTPMethod, APIStatus, HTTP_METHOD_COLORS, API_STATUS_COLORS, API_STATUS_LABELS } from '@shared/types'
import { useMutation } from '@tanstack/react-query'
import { apiMethods } from '../utils/api'

interface APICardProps {
  api: API
  onUpdate?: () => void
  onViewDetails?: (api: API) => void
}

const APICard: React.FC<APICardProps> = ({ api, onUpdate, onViewDetails }) => {
  const [showDescription, setShowDescription] = useState(false)
  const [activeCodeTab, setActiveCodeTab] = useState<'frontend' | 'backend'>('frontend')

  // Update API status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (status: APIStatus) => apiMethods.updateAPIStatus(api.id, status),
    onSuccess: () => {
      onUpdate?.()
      toast.success('状态已更新')
    },
    onError: () => {
      toast.error('更新状态失败')
    },
  })

  // Generate code mutation
  const generateCodeMutation = useMutation({
    mutationFn: (type: 'frontend' | 'backend' | 'both') => 
      apiMethods.generateAPICode(api.id, { type }),
    onSuccess: () => {
      onUpdate?.()
      toast.success('代码已生成')
    },
    onError: () => {
      toast.error('生成代码失败')
    },
  })

  const handleCopy = (_text: string, type: string) => {
    toast.success(`${type}代码已复制到剪贴板`)
  }

  const handleStatusChange = (newStatus: APIStatus) => {
    updateStatusMutation.mutate(newStatus)
  }

  const handleGenerateCode = (type: 'frontend' | 'backend' | 'both') => {
    generateCodeMutation.mutate(type)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header with Stats */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-xs text-gray-500">调用次数</div>
            <div className="text-lg font-semibold text-blue-600">{Math.floor(Math.random() * 1000)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">响应时间</div>
            <div className="text-lg font-semibold text-green-600">{Math.floor(Math.random() * 200)}ms</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">成功率</div>
            <div className="text-lg font-semibold text-purple-600">{(95 + Math.random() * 5).toFixed(1)}%</div>
          </div>
        </div>
        <button
          onClick={() => onViewDetails?.(api)}
          className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100 transition-colors"
        >
          查看详情
        </button>
      </div>

      {/* API 信息 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${HTTP_METHOD_COLORS[api.method as HTTPMethod]}`}>
              {api.method}
            </span>
            <h3 className="font-semibold text-gray-900 truncate">{api.name}</h3>
          </div>
          
          <code className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded font-mono">
            {api.path}
          </code>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => setShowDescription(!showDescription)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title={showDescription ? '隐藏描述' : '显示描述'}
          >
            {showDescription ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          
          {!api.frontendCode && !api.backendCode && (
            <button
              onClick={() => handleGenerateCode('both')}
              className="p-1 text-gray-400 hover:text-green-600 transition-colors"
              title="生成代码"
              disabled={generateCodeMutation.isPending}
            >
              <Code2 className="h-4 w-4" />
            </button>
          )}
          
          <button
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="更多操作"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 描述信息 */}
      {showDescription && api.description && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">{api.description}</p>
        </div>
      )}

      {/* 状态选择器 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
        <select
          value={api.status}
          onChange={(e) => handleStatusChange(e.target.value as APIStatus)}
          className={`w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${API_STATUS_COLORS[api.status]}`}
        >
          {Object.entries(API_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* 代码区域 */}
      {(api.frontendCode || api.backendCode) && (
        <div className="space-y-3">
          {/* 代码标签页 */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {api.frontendCode && (
              <button
                onClick={() => setActiveCodeTab('frontend')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeCodeTab === 'frontend'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Code2 className="h-4 w-4 inline mr-1" />
                前端代码
              </button>
            )}
            {api.backendCode && (
              <button
                onClick={() => setActiveCodeTab('backend')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeCodeTab === 'backend'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Code2 className="h-4 w-4 inline mr-1" />
                后端代码
              </button>
            )}
          </div>

          {/* 代码内容 */}
          <div className="relative">
            {activeCodeTab === 'frontend' && api.frontendCode && (
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{api.frontendCode}</code>
                </pre>
                <CopyToClipboard
                  text={api.frontendCode}
                  onCopy={() => handleCopy(api.frontendCode!, '前端')}
                >
                  <button className="absolute top-2 right-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors">
                    <Copy className="h-4 w-4 text-gray-300" />
                  </button>
                </CopyToClipboard>
              </div>
            )}

            {activeCodeTab === 'backend' && api.backendCode && (
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{api.backendCode}</code>
                </pre>
                <CopyToClipboard
                  text={api.backendCode}
                  onCopy={() => handleCopy(api.backendCode!, '后端')}
                >
                  <button className="absolute top-2 right-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors">
                    <Copy className="h-4 w-4 text-gray-300" />
                  </button>
                </CopyToClipboard>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 标签 */}
      {api.apiTags && api.apiTags.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex flex-wrap gap-2">
            {api.apiTags.map((apiTag) => (
              apiTag.tag && (
                <span
                  key={apiTag.tagId}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: apiTag.tag.color + '20',
                    color: apiTag.tag.color
                  }}
                >
                  {apiTag.tag.name}
                </span>
              )
            ))}
          </div>
        </div>
      )}

      {/* 底部信息 */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span>创建于 {new Date(api.createdAt).toLocaleDateString('zh-CN')}</span>
        <span>更新于 {new Date(api.updatedAt).toLocaleDateString('zh-CN')}</span>
      </div>
    </div>
  )
}

export default APICard