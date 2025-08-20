import React, { useState } from 'react'
import { 
  X, 
  Code2, 
  Database, 
  Plus, 
  Search,
  Users,
  Settings,
  Shield,
  Upload,
  FileText,
  Eye,
  Copy,
  Clock,
  Target,
  CheckCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { 
  FeatureModule,
  FEATURE_MODULE_STATUS_LABELS,
  FEATURE_MODULE_STATUS_COLORS,
  FEATURE_MODULE_PRIORITY_LABELS,
  FEATURE_MODULE_PRIORITY_COLORS
} from '../../../../../types'
import FeatureAPICard from '../../../api/components/FeatureAPICard'

interface FeatureModuleModalProps {
  module: FeatureModule | null
  isOpen: boolean
  onClose: () => void
  useEnhancedComponents?: boolean
}

const FeatureModuleModal: React.FC<FeatureModuleModalProps> = ({ 
  module, 
  isOpen, 
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'apis' | 'tasks' | 'docs'>('apis')
  const [searchQuery, setSearchQuery] = useState('')

  if (!isOpen || !module) return null


  const getModuleIcon = (moduleName: string) => {
    switch (moduleName) {
      case '用户登录':
        return <Users className="w-8 h-8 text-blue-500" />
      case '权限管理':
        return <Shield className="w-8 h-8 text-purple-500" />
      case '文件管理':
        return <Upload className="w-8 h-8 text-green-500" />
      default:
        return <Settings className="w-8 h-8 text-text-tertiary" />
    }
  }

  // Filter APIs based on search query
  const getFilteredAPIs = () => {
    let apis = module.apiEndpoints || []

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      apis = apis.filter(api =>
        api.name.toLowerCase().includes(query) ||
        api.description?.toLowerCase().includes(query) ||
        api.path.toLowerCase().includes(query)
      )
    }

    return apis
  }

  const filteredAPIs = getFilteredAPIs()

  const handleCopyAllAPIs = async () => {
    const allApiEndpoints = filteredAPIs.map(api => `${api.method} ${api.path}`).join('\n')
    
    try {
      await navigator.clipboard.writeText(allApiEndpoints)
      toast.success(`已复制 ${filteredAPIs.length} 个API接口到剪贴板`)
    } catch (error) {
      toast.error('复制失败，请手动复制')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-paper rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-primary bg-gradient-header">
          <div className="flex items-center space-x-4">
            {getModuleIcon(module.name)}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-2xl font-semibold text-text-primary">{module.displayName || module.name}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${FEATURE_MODULE_STATUS_COLORS[module.status]}`}>
                  {FEATURE_MODULE_STATUS_LABELS[module.status]}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${FEATURE_MODULE_PRIORITY_COLORS[module.priority]}`}>
                  {FEATURE_MODULE_PRIORITY_LABELS[module.priority]}
                </span>
              </div>
              <p className="text-text-secondary mb-2">{module.description}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                {module.assigneeName && (
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>负责人: {module.assigneeName}</span>
                  </div>
                )}
                {module.estimatedHours && (
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>预估: {module.estimatedHours}h</span>
                  </div>
                )}
                {module.actualHours && (
                  <div className="flex items-center space-x-1">
                    <Target className="w-4 h-4" />
                    <span>实际: {module.actualHours}h</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4" />
                  <span>进度: {module.progress}%</span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 p-6 border-b border-border-primary bg-bg-tertiary">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{module.frontendAPIs?.length || 0}</div>
            <div className="text-sm text-text-tertiary">前端API</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{module.backendAPIs?.length || 0}</div>
            <div className="text-sm text-text-tertiary">后端API</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{(module.frontendAPIs?.length || 0) + (module.backendAPIs?.length || 0)}</div>
            <div className="text-sm text-text-tertiary">总计API</div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-border-primary">
          <div className="flex items-center justify-between mb-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-text-tertiary" />
              </div>
              <input
                type="text"
                placeholder="搜索API..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 pr-4 py-2 w-full"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {filteredAPIs.length > 0 && (
                <button 
                  onClick={handleCopyAllAPIs}
                  className="btn-outline flex items-center space-x-2"
                  title={`复制所有 ${filteredAPIs.length} 个API接口`}
                >
                  <Copy className="w-4 h-4" />
                  <span>复制全部 ({filteredAPIs.length})</span>
                </button>
              )}
              <button className="btn-primary flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>添加API</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-bg-tertiary p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'all'
                  ? 'bg-bg-paper text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <span className="flex items-center justify-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>全部API ({(module.frontendAPIs?.length || 0) + (module.backendAPIs?.length || 0)})</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('frontend')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'frontend'
                  ? 'bg-bg-paper text-blue-600 shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <span className="flex items-center justify-center space-x-2">
                <Code2 className="w-4 h-4" />
                <span>前端API ({module.frontendAPIs?.length || 0})</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('backend')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'backend'
                  ? 'bg-bg-paper text-green-600 shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <span className="flex items-center justify-center space-x-2">
                <Database className="w-4 h-4" />
                <span>后端API ({module.backendAPIs?.length || 0})</span>
              </span>
            </button>
          </div>
        </div>

        {/* API List */}
        <div className="p-6 max-h-[50vh] overflow-y-auto custom-scrollbar">
          {/* 使用提示 */}
          {filteredAPIs.length > 0 && (
            <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border-l-4 border-blue-400">
              <div className="flex items-center space-x-2 text-sm text-blue-800">
                <Copy className="w-4 h-4" />
                <span>点击路径框可复制单个API，点击右上角"复制全部"可复制所有API接口</span>
              </div>
            </div>
          )}
          {filteredAPIs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-text-tertiary" />
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">
                {searchQuery ? '没有找到匹配的API' : '暂无API'}
              </h3>
              <p className="text-text-secondary mb-6">
                {searchQuery ? '请尝试调整搜索条件' : '开始为这个功能模块添加API接口'}
              </p>
              <button className="btn-primary">
                添加第一个API
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAPIs.map((api) => (
                <FeatureAPICard
                  key={api.id}
                  api={api}
                  onViewDetails={() => {}}
                  compact={false}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border-primary bg-bg-tertiary">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-text-tertiary">
              共显示 {filteredAPIs.length} 个API
            </div>
            {module.tags.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-text-tertiary">标签：</span>
                {module.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button onClick={onClose} className="btn-outline">
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}

export default FeatureModuleModal