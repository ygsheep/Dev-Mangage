import React, { useState } from 'react'
import { 
  Copy, 
  Eye, 
  EyeOff, 
  MoreVertical, 
  FileText, 
  Send, 
  Clock,
  Star,
  Heart,
  TrendingUp,
  Zap,
  CheckCircle,
  Play
} from 'lucide-react'
import toast from 'react-hot-toast'
import { API, HTTPMethod, HTTP_METHOD_COLORS } from '@shared/types'

interface TailwindAPICardProps {
  api: API
  onViewDetails?: (api: API) => void
  onTestAPI?: (api: API) => void
  style?: React.CSSProperties
  showMetrics?: boolean
  compact?: boolean
}

const TailwindAPICard: React.FC<TailwindAPICardProps> = ({ 
  api, 
  onViewDetails,
  onTestAPI,
  style = {},
  showMetrics = true,
  compact = false
}) => {
  const [showDescription, setShowDescription] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const handleCopy = (_text: string, type: string) => {
    toast.success(`${type}已复制到剪贴板`)
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // 阻止按钮点击事件冒泡
    if ((e.target as HTMLElement).closest('.card-actions')) {
      return
    }
    onViewDetails?.(api)
  }

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsFavorited(!isFavorited)
    toast.success(isFavorited ? '已取消收藏' : '已添加收藏')
  }

  const getTypeColor = (type?: string) => ({
    frontend: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    backend: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    both: { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' }
  }[type || 'frontend'] || { color: 'text-text-secondary', bg: 'bg-gray-50', border: 'border-gray-200' })

  const getStatusColor = (status: string) => ({
    DRAFT: 'text-yellow-600 bg-yellow-50',
    DEVELOPMENT: 'text-blue-600 bg-blue-50', 
    TESTING: 'text-cyan-600 bg-cyan-50',
    PRODUCTION: 'text-green-600 bg-green-50',
    DEPRECATED: 'text-red-600 bg-red-50'
  }[status] || 'text-text-secondary bg-gray-50')

  const getPriorityIcon = (priority?: string) => {
    switch(priority) {
      case 'high': 
        return <Zap className="w-3 h-3 text-red-500" />
      case 'medium': 
        return <Clock className="w-3 h-3 text-yellow-500" />
      case 'low':
        return <CheckCircle className="w-3 h-3 text-green-500" />
      default: 
        return null
    }
  }

  // 模拟统计数据
  const mockMetrics = {
    usage: Math.floor(Math.random() * 1000) + 100,
    responseTime: Math.floor(Math.random() * 200) + 50,
    successRate: (95 + Math.random() * 5).toFixed(1),
    lastUsed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN')
  }

  const typeInfo = getTypeColor('frontend') // Default to frontend since API type is not available

  const menuItems = [
    ...(onTestAPI ? [{
      key: 'test-api',
      label: '测试接口',
      icon: <Play className="w-4 h-4" />,
      onClick: () => onTestAPI(api)  
    }] : []),
    {
      key: 'copy-json',
      label: '复制JSON',
      icon: <Copy className="w-4 h-4" />,
      onClick: () => handleCopy(JSON.stringify(api, null, 2), 'API信息')
    },
    {
      key: 'copy-endpoint',
      label: '复制端点',
      icon: <FileText className="w-4 h-4" />,
      onClick: () => handleCopy(api.path, 'API端点')
    },
    {
      key: 'copy-curl',
      label: '复制cURL',
      icon: <Send className="w-4 h-4" />,
      onClick: () => {
        const curl = `curl -X ${api.method} "${api.path}"`
        handleCopy(curl, 'cURL命令')
      }
    }
  ]

  if (compact) {
    // Compact list view
    return (
      <div
        className="bg-bg-paper rounded-lg shadow-theme-sm border border-border-primary p-4 hover:shadow-theme-md transition-all duration-200 cursor-pointer flex items-center"
        style={style}
        onClick={handleCardClick}
      >
        {/* Left section: Method, API Name, Path */}
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <span className={`px-2 py-1 rounded text-xs font-mono font-medium ${HTTP_METHOD_COLORS[api.method as HTTPMethod]} flex-shrink-0`}>
            {api.method}
          </span>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-medium text-text-primary text-sm truncate">{api.name}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(api.status)} flex-shrink-0`}>
                {api.status}
              </span>
            </div>
            <code className="text-xs text-text-secondary bg-bg-tertiary px-2 py-0.5 rounded font-mono truncate block">
              {api.path}
            </code>
          </div>
        </div>

        {/* Right section: Metrics and Actions */}
        <div className="flex items-center space-x-4 flex-shrink-0">
          {showMetrics && (
            <div className="flex items-center space-x-3 text-xs text-text-tertiary">
              <span className="flex items-center space-x-1">
                <TrendingUp className="w-3 h-3" />
                <span>{mockMetrics.usage}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{mockMetrics.responseTime}ms</span>
              </span>
              <span className="flex items-center space-x-1">
                <CheckCircle className="w-3 h-3" />
                <span>{mockMetrics.successRate}%</span>
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-1 card-actions">
            <button
              title={isFavorited ? '取消收藏' : '添加收藏'}
              onClick={handleToggleFavorite}
              className="p-1.5 rounded hover:bg-gray-100 transition-colors"
            >
              {isFavorited ? 
                <Heart className="w-3.5 h-3.5 text-red-500 fill-current" /> : 
                <Star className="w-3.5 h-3.5 text-gray-400" />
              }
            </button>
            
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDropdown(!showDropdown)
                }}
                className="p-1.5 rounded hover:bg-gray-100 transition-colors"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 top-8 w-48 bg-bg-paper rounded-lg shadow-lg border border-border-primary z-10">
                  <div className="py-1">
                    {menuItems.map(item => (
                      <button
                        key={item.key}
                        onClick={(e) => {
                          e.stopPropagation()
                          item.onClick()
                          setShowDropdown(false)
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {item.icon}
                        <span className="ml-3">{item.label}</span>
                      </button>
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

  // Card view (original layout)
  return (
    <div
      className="bg-bg-paper rounded-xl shadow-theme-sm border border-border-primary p-6 hover:shadow-theme-md transition-all duration-300 cursor-pointer"
      style={style}
      onClick={handleCardClick}
    >
      {/* Header with enhanced stats */}
      {showMetrics && !compact && (
        <div className="flex items-center justify-between mb-4 p-3 bg-bg-tertiary rounded-lg">
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-xs text-text-tertiary mb-1">调用次数</div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4 text-primary-500" />
                <span className="text-lg font-semibold text-primary-600">{mockMetrics.usage}</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-text-tertiary mb-1">响应时间</div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-status-success" />
                <span className="text-lg font-semibold text-status-success">{mockMetrics.responseTime}ms</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-text-tertiary mb-1">成功率</div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-4 h-4 text-status-info" />
                <span className="text-lg font-semibold text-status-info">{mockMetrics.successRate}%</span>
              </div>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onViewDetails?.(api)
            }}
            className="btn-primary flex items-center space-x-1"
          >
            <Eye className="w-4 h-4" />
            <span>查看详情</span>
          </button>
        </div>
      )}

      {/* API Information */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          {/* Top row: Type label and Status */}
          <div className="flex items-center justify-between mb-2">
            <div className="relative flex-shrink-0">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${typeInfo.bg} ${typeInfo.color} ${typeInfo.border} border`}>
                前端API
              </span>
              {getPriorityIcon('medium') && (
                <div className="absolute -top-1 -right-1">
                  {getPriorityIcon('medium')}
                </div>
              )}
            </div>
            
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(api.status)} ml-2 flex-shrink-0`}>
              {api.status}
            </span>
          </div>
          
          {/* Second row: API Name */}
          <div className="mb-2">
            <h3 className="font-semibold text-text-primary text-base truncate">{api.name}</h3>
          </div>
          
          {/* Third row: Method and Path */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded text-xs font-mono font-medium ${HTTP_METHOD_COLORS[api.method as HTTPMethod]} flex-shrink-0`}>
              {api.method}
            </span>
            <code className="text-sm text-text-secondary bg-gray-50 px-2 py-1 rounded font-mono truncate min-w-0">
              {api.path}
            </code>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4 card-actions">
          <button
            title={isFavorited ? '取消收藏' : '添加收藏'}
            onClick={handleToggleFavorite}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isFavorited ? 
              <Heart className="w-4 h-4 text-red-500 fill-current" /> : 
              <Star className="w-4 h-4 text-gray-400" />
            }
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowDescription(!showDescription)
            }}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title={showDescription ? '隐藏描述' : '显示描述'}
          >
            {showDescription ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowDropdown(!showDropdown)
              }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 top-10 w-48 bg-bg-paper rounded-lg shadow-lg border border-border-primary z-10">
                <div className="py-1">
                  {menuItems.map(item => (
                    <button
                      key={item.key}
                      onClick={(e) => {
                        e.stopPropagation()
                        item.onClick()
                        setShowDropdown(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {item.icon}
                      <span className="ml-3">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {showDescription && api.description && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
          <p className="text-sm text-gray-700">{api.description}</p>
        </div>
      )}

      {/* Tags */}
      {api.apiTags && api.apiTags.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {api.apiTags.slice(0, 5).map((apiTag) => (
              apiTag.tag && (
                <span
                  key={apiTag.tagId}
                  className="px-2 py-1 rounded-full text-xs font-medium border"
                  style={{
                    backgroundColor: apiTag.tag.color + '20',
                    color: apiTag.tag.color,
                    borderColor: apiTag.tag.color + '30',
                  }}
                >
                  {apiTag.tag.name}
                </span>
              )
            ))}
            {api.apiTags.length > 5 && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-text-secondary">
                +{api.apiTags.length - 5}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Compact metrics */}
      {compact && showMetrics && (
        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <TrendingUp className="w-3 h-3" />
              <span>{mockMetrics.usage}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{mockMetrics.responseTime}ms</span>
            </span>
            <span className="flex items-center space-x-1">
              <CheckCircle className="w-3 h-3" />
              <span>{mockMetrics.successRate}%</span>
            </span>
          </div>
          <span>最后使用: {mockMetrics.lastUsed}</span>
        </div>
      )}

      {/* Footer info */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
        <span>创建于 {new Date(api.createdAt).toLocaleDateString('zh-CN')}</span>
        <span>更新于 {new Date(api.updatedAt).toLocaleDateString('zh-CN')}</span>
      </div>
    </div>
  )
}

export default TailwindAPICard