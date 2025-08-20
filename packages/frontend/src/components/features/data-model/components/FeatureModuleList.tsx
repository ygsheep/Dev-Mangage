import {
  Calendar,
  Clock,
  Edit2,
  Eye,
  Filter,
  MoreVertical,
  Plus,
  Search,
  Target,
  Trash2,
  User,
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { FeatureModule } from '../../../../types'
import { deleteFeatureModule, getFeatureModules } from '../../../../utils/api'
import CreateFeatureModuleModal from './modals/CreateFeatureModuleModal'
import FeatureModuleModal from './modals/FeatureModuleModal'

interface FeatureModuleListProps {
  projectId: string
}

const PRIORITY_COLORS = {
  HIGH: 'bg-red-100 text-red-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-green-100 text-green-800',
}

const STATUS_COLORS = {
  planned: 'bg-gray-100 text-gray-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  deprecated: 'bg-red-100 text-red-800',
}

const STATUS_LABELS = {
  planned: '计划中',
  'in-progress': '进行中',
  completed: '已完成',
  deprecated: '已废弃',
}

const PRIORITY_LABELS = {
  HIGH: '高优先级',
  MEDIUM: '中优先级',
  LOW: '低优先级',
}

const FeatureModuleList: React.FC<FeatureModuleListProps> = ({ projectId }) => {
  const [modules, setModules] = useState<FeatureModule[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedModule, setSelectedModule] = useState<FeatureModule | null>(null)
  const [showDropdown, setShowDropdown] = useState<string | null>(null)

  // 获取功能模块列表
  const fetchModules = async () => {
    try {
      setLoading(true)
      const response = await getFeatureModules(projectId, {
        search: searchQuery || undefined,
        status: filterStatus || undefined,
      })

      if (response.success && response.data) {
        setModules(response.data.modules || [])
      }
    } catch (error: any) {
      console.error('获取功能模块失败:', error)
      toast.error('获取功能模块失败: ' + (error.message || '请重试'))
    } finally {
      setLoading(false)
    }
  }

  // 初始加载和依赖更新
  useEffect(() => {
    if (projectId) {
      fetchModules()
    }
  }, [projectId, searchQuery, filterStatus])

  // 删除功能模块
  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('确定要删除这个功能模块吗？此操作无法撤销。')) {
      return
    }

    try {
      const response = await deleteFeatureModule(projectId, moduleId)
      if (response.success) {
        toast.success('功能模块删除成功')
        fetchModules() // 重新获取列表
      }
    } catch (error: any) {
      console.error('删除功能模块失败:', error)
      toast.error('删除失败: ' + (error.message || '请重试'))
    }
  }

  // 过滤后的模块列表
  const filteredModules = modules.filter(module => {
    const matchesSearch =
      !searchQuery ||
      module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.category?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = !filterStatus || module.status === filterStatus

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-text-secondary">加载功能模块中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 工具栏 */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="搜索功能模块..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input pl-10 pr-4 py-2 w-full sm:w-64"
            />
          </div>

          {/* 状态筛选 */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="input pl-10 pr-8 py-2 appearance-none bg-bg-paper"
            >
              <option value="">全部状态</option>
              <option value="planned">计划中</option>
              <option value="in-progress">进行中</option>
              <option value="completed">已完成</option>
              <option value="deprecated">已废弃</option>
            </select>
          </div>
        </div>

        {/* 新建按钮 */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>新建功能模块</span>
        </button>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-bg-paper p-4 rounded-lg border border-border-primary">
          <div className="text-2xl font-bold text-blue-600">{modules.length}</div>
          <div className="text-sm text-text-tertiary">总模块数</div>
        </div>
        <div className="bg-bg-paper p-4 rounded-lg border border-border-primary">
          <div className="text-2xl font-bold text-yellow-600">
            {modules.filter(m => m.status === 'in-progress').length}
          </div>
          <div className="text-sm text-text-tertiary">进行中</div>
        </div>
        <div className="bg-bg-paper p-4 rounded-lg border border-border-primary">
          <div className="text-2xl font-bold text-green-600">
            {modules.filter(m => m.status === 'completed').length}
          </div>
          <div className="text-sm text-text-tertiary">已完成</div>
        </div>
        <div className="bg-bg-paper p-4 rounded-lg border border-border-primary">
          <div className="text-2xl font-bold text-purple-600">
            {modules.reduce((sum, m) => sum + (m.stats?.totalEndpoints || 0), 0)}
          </div>
          <div className="text-sm text-text-tertiary">总API数</div>
        </div>
      </div>

      {/* 模块列表 */}
      {filteredModules.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-text-tertiary" />
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-2">
            {searchQuery || filterStatus ? '没有找到匹配的功能模块' : '暂无功能模块'}
          </h3>
          <p className="text-text-secondary mb-6">
            {searchQuery || filterStatus
              ? '请尝试调整搜索条件或筛选器'
              : '开始为项目创建第一个功能模块'}
          </p>
          <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary">
            创建第一个功能模块
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredModules.map(module => (
            <div
              key={module.id}
              className="bg-bg-paper rounded-lg border border-border-primary hover:border-border-secondary transition-all duration-200 hover:shadow-lg"
            >
              {/* 模块头部 */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-text-primary truncate">
                        {module.displayName || module.name}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[module.status]}`}
                      >
                        {STATUS_LABELS[module.status]}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${PRIORITY_COLORS[module.priority]}`}
                      >
                        {PRIORITY_LABELS[module.priority]}
                      </span>
                      {module.category && (
                        <span className="px-2 py-1 bg-bg-tertiary text-text-secondary text-xs rounded">
                          {module.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 操作菜单 */}
                  <div className="relative">
                    <button
                      onClick={() => setShowDropdown(showDropdown === module.id ? null : module.id)}
                      className="p-1 hover:bg-bg-tertiary rounded"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {showDropdown === module.id && (
                      <div className="absolute right-0 top-8 bg-bg-paper border border-border-primary rounded-lg shadow-lg z-10 min-w-32">
                        <button
                          onClick={() => {
                            setSelectedModule(module)
                            setShowDropdown(null)
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-bg-tertiary flex items-center space-x-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span>查看详情</span>
                        </button>
                        <button
                          onClick={() => {
                            // TODO: 实现编辑功能
                            setShowDropdown(null)
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-bg-tertiary flex items-center space-x-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span>编辑</span>
                        </button>
                        <hr className="border-border-primary" />
                        <button
                          onClick={() => {
                            handleDeleteModule(module.id)
                            setShowDropdown(null)
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center space-x-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>删除</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 描述 */}
                {module.description && (
                  <p className="text-text-secondary text-sm mb-4 line-clamp-2">
                    {module.description}
                  </p>
                )}

                {/* 进度条 */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-text-tertiary">进度</span>
                    <span className="text-text-primary font-medium">{module.progress}%</span>
                  </div>
                  <div className="w-full bg-bg-tertiary rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${module.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* 统计信息 */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">
                      {module.stats?.totalEndpoints || 0}
                    </div>
                    <div className="text-xs text-text-tertiary">API</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">
                      {module.stats?.totalTasks || 0}
                    </div>
                    <div className="text-xs text-text-tertiary">任务</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-purple-600">
                      {module.stats?.totalDocuments || 0}
                    </div>
                    <div className="text-xs text-text-tertiary">文档</div>
                  </div>
                </div>

                {/* 其他信息 */}
                <div className="space-y-2">
                  {module.assigneeName && (
                    <div className="flex items-center space-x-2 text-sm text-text-secondary">
                      <User className="w-4 h-4" />
                      <span>负责人: {module.assigneeName}</span>
                    </div>
                  )}
                  {module.estimatedHours && (
                    <div className="flex items-center space-x-2 text-sm text-text-secondary">
                      <Clock className="w-4 h-4" />
                      <span>预估: {module.estimatedHours}h</span>
                    </div>
                  )}
                  {module.dueDate && (
                    <div className="flex items-center space-x-2 text-sm text-text-secondary">
                      <Calendar className="w-4 h-4" />
                      <span>截止: {new Date(module.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* 标签 */}
                {module.tags && module.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {module.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {module.tags.length > 3 && (
                      <span className="px-2 py-1 bg-bg-tertiary text-text-tertiary text-xs rounded">
                        +{module.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="px-6 py-3 bg-bg-tertiary border-t border-border-primary">
                <button onClick={() => setSelectedModule(module)} className="btn-outline w-full">
                  查看详情
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 创建功能模块弹窗 */}
      <CreateFeatureModuleModal
        projectId={projectId}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false)
          fetchModules()
        }}
      />

      {/* 功能模块详情弹窗 */}
      <FeatureModuleModal
        module={selectedModule}
        isOpen={!!selectedModule}
        onClose={() => setSelectedModule(null)}
      />
    </div>
  )
}

export default FeatureModuleList
