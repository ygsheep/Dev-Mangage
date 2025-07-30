import React, { useState } from 'react'
import { Copy, Edit, Trash2, Eye, EyeOff, Code2 } from 'lucide-react'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import toast from 'react-hot-toast'
import { API, HTTPMethod, APIStatus, HTTP_METHOD_COLORS, API_STATUS_COLORS, API_STATUS_LABELS } from '../types'

interface APICardProps {
  api: API
  onStatusChange: (id: string, status: APIStatus) => void
  onEdit: (api: API) => void
  onDelete: (id: string) => void
}

const APICard: React.FC<APICardProps> = ({ api, onStatusChange, onEdit, onDelete }) => {
  const [showDescription, setShowDescription] = useState(false)
  const [activeCodeTab, setActiveCodeTab] = useState<'frontend' | 'backend'>('frontend')

  const handleCopy = (text: string, type: string) => {
    toast.success(`${type}代码已复制到剪贴板`)
  }

  const handleStatusChange = (newStatus: APIStatus) => {
    onStatusChange(api.id, newStatus)
    toast.success(`状态已更新为：${API_STATUS_LABELS[newStatus]}`)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* 头部信息 */}
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
          
          <button
            onClick={() => onEdit(api)}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="编辑"
          >
            <Edit className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => onDelete(api.id)}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="删除"
          >
            <Trash2 className="h-4 w-4" />
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