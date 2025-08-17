import React, { useState } from 'react'
import { Copy, CheckCircle, ExternalLink } from 'lucide-react'
import { API, HTTPMethod, HTTP_METHOD_COLORS } from '@shared/types'
import toast from 'react-hot-toast'

interface FeatureAPICardProps {
  api: API
  onViewDetails?: (api: API) => void
  compact?: boolean
}

const FeatureAPICard: React.FC<FeatureAPICardProps> = ({ 
  api, 
  onViewDetails,
  compact = false 
}) => {
  const [copied, setCopied] = useState(false)

  const getMethodColor = (method: HTTPMethod) => {
    return HTTP_METHOD_COLORS[method] || 'bg-gray-100 text-gray-800'
  }

  const getFullEndpoint = () => {
    return `${api.method} ${api.path}`
  }

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    try {
      await navigator.clipboard.writeText(getFullEndpoint())
      setCopied(true)
      toast.success('API接口已复制到剪贴板')
      
      // 2秒后重置复制状态
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (error) {
      toast.error('复制失败，请手动复制')
    }
  }

  const handleCardClick = () => {
    onViewDetails?.(api)
  }

  return (
    <div 
      className="bg-bg-paper border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group"
      onClick={handleCardClick}
    >
      {/* API 标识和状态 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded text-xs font-mono font-medium ${getMethodColor(api.method as HTTPMethod)}`}>
            {api.method}
          </span>
          <span className="text-sm font-medium text-gray-900">{api.name}</span>
        </div>
        
        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            title="复制API接口"
          >
            {copied ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4 text-gray-500" />
            )}
          </button>
          
          {onViewDetails && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onViewDetails(api)
              }}
              className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
              title="查看详情"
            >
              <ExternalLink className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* API 路径 - 可复制的完整格式 */}
      <div className="mb-3">
        <div 
          className="relative bg-gray-50 rounded-lg p-3 font-mono text-sm cursor-pointer hover:bg-gray-100 transition-colors group/endpoint"
          onClick={handleCopy}
          title="点击复制完整API"
        >
          <div className="flex items-center justify-between">
            <code className="text-gray-800 select-all">
              <span className={`font-semibold ${
                api.method === 'GET' ? 'text-blue-600' :
                api.method === 'POST' ? 'text-green-600' :
                api.method === 'PUT' ? 'text-orange-600' :
                api.method === 'DELETE' ? 'text-red-600' :
                'text-gray-600'
              }`}>
                {api.method}
              </span>
              <span className="text-gray-600 ml-2">{api.path}</span>
            </code>
            
            <div className="opacity-0 group-hover/endpoint:opacity-100 transition-opacity">
              {copied ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* API 描述 */}
      {api.description && !compact && (
        <div className="mb-3">
          <p className="text-sm text-gray-600 line-clamp-2">{api.description}</p>
        </div>
      )}

      {/* 状态标签 */}
      <div className="flex items-center justify-between">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          api.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
          api.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
          api.status === 'NOT_STARTED' ? 'bg-gray-100 text-gray-800' :
          api.status === 'TESTED' ? 'bg-emerald-100 text-emerald-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {api.status === 'COMPLETED' ? '已完成' :
           api.status === 'IN_PROGRESS' ? '开发中' :
           api.status === 'NOT_STARTED' ? '未开始' :
           api.status === 'TESTED' ? '已测试' :
           '进行中'}
        </span>
        
        {!compact && (
          <div className="text-xs text-gray-500">
            更新: {new Date(api.updatedAt).toLocaleDateString('zh-CN')}
          </div>
        )}
      </div>

      {/* 快速复制提示 */}
      {!compact && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>点击路径框可快速复制完整API</span>
            <span className="flex items-center space-x-1">
              <Copy className="w-3 h-3" />
              <span>一键复制</span>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default FeatureAPICard