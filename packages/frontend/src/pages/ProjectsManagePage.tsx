import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Archive, 
  Settings,
  GitBranch,
  Database,
  Bug,
  Activity,
  Calendar,
  Users,
  Folder,
  ArrowLeft
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { apiMethods } from '../utils/api'
import { toast } from 'react-hot-toast'

const ProjectsManagePage: React.FC = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'updatedAt' | 'createdAt'>('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [statusFilter, setStatusFilter] = useState<string>('')
  
  // 获取项目列表
  const { data: projects, isLoading, error, refetch } = useQuery({
    queryKey: ['projects', searchQuery, sortBy, sortOrder, statusFilter],
    queryFn: () => apiMethods.getProjects({
      search: searchQuery || undefined,
      sortBy,
      sortOrder,
      status: statusFilter || undefined
    }),
    staleTime: 30000
  })

  // 确保项目列表是数组 - 正确解析后端响应结构
  const projectList = projects?.data?.projects || []
  const pagination = projects?.data?.pagination || { page: 1, limit: 20, total: 0, pages: 0 }

  // 获取项目统计（基于实际数据）
  const stats = {
    totalProjects: pagination.total,
    activeProjects: projectList.filter((p: any) => p.status === 'ACTIVE').length,
    archivedProjects: projectList.filter((p: any) => p.status === 'ARCHIVED').length,
    totalMembers: 1 // 临时数据，后续可以从用户管理获取
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('确定要删除这个项目吗？此操作无法撤销。')) {
      return
    }
    
    try {
      await apiMethods.deleteProject(projectId)
      toast.success('项目删除成功')
      refetch()
    } catch (error: any) {
      toast.error(error.message || '删除项目失败')
    }
  }

  const handleArchiveProject = async (projectId: string) => {
    try {
      // TODO: 实现归档功能
      toast.success('归档功能暂未实现')
      // refetch()
    } catch (error: any) {
      toast.error(error.message || '归档项目失败')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800'
      case 'DELETED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '活跃'
      case 'ARCHIVED': return '已归档'
      case 'DELETED': return '已删除'
      default: return status
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-text-secondary">加载项目列表中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-2">加载失败</h3>
          <p className="text-text-secondary mb-4">无法获取项目列表</p>
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-secondary">
      {/* 页面头部 */}
      <div className="bg-bg-paper border-b border-border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 标题区域 */}
            <div className="flex items-center space-x-4">
              {/* 返回按钮 */}
              <button
                onClick={() => navigate('/')}
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
                title="返回首页"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Folder className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-text-primary">项目管理</h1>
                  <p className="text-sm text-text-secondary">管理你的所有API项目</p>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => refetch()}
                className="btn-outline flex items-center space-x-2"
                disabled={isLoading}
              >
                <Activity className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>刷新</span>
              </button>
              
              <Link
                to="/projects/new"
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>新建项目</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-bg-paper rounded-lg shadow-theme-sm border border-border-primary p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Folder className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-text-primary">
                    {stats.totalProjects || 0}
                  </div>
                  <div className="text-sm text-text-secondary">总项目数</div>
                </div>
              </div>
            </div>

            <div className="bg-bg-paper rounded-lg shadow-theme-sm border border-border-primary p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-text-primary">
                    {stats.activeProjects || 0}
                  </div>
                  <div className="text-sm text-text-secondary">活跃项目</div>
                </div>
              </div>
            </div>

            <div className="bg-bg-paper rounded-lg shadow-theme-sm border border-border-primary p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Archive className="h-8 w-8 text-gray-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-text-primary">
                    {stats.archivedProjects || 0}
                  </div>
                  <div className="text-sm text-text-secondary">已归档</div>
                </div>
              </div>
            </div>

            <div className="bg-bg-paper rounded-lg shadow-theme-sm border border-border-primary p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-text-primary">
                    {stats.totalMembers || 0}
                  </div>
                  <div className="text-sm text-text-secondary">团队成员</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 筛选和搜索 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="bg-bg-paper rounded-lg shadow-theme-sm border border-border-primary p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 搜索框 */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="搜索项目名称或描述..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-bg-primary text-text-primary"
                />
              </div>
            </div>

            {/* 状态筛选 */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-bg-primary text-text-primary"
            >
              <option value="">所有状态</option>
              <option value="ACTIVE">活跃</option>
              <option value="ARCHIVED">已归档</option>
              <option value="DELETED">已删除</option>
            </select>

            {/* 排序 */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-')
                setSortBy(field as any)
                setSortOrder(order as any)
              }}
              className="px-3 py-2 border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-bg-primary text-text-primary"
            >
              <option value="updatedAt-desc">最近更新</option>
              <option value="createdAt-desc">最新创建</option>
              <option value="name-asc">名称 A-Z</option>
              <option value="name-desc">名称 Z-A</option>
            </select>
          </div>
        </div>
      </div>

      {/* 项目列表 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {projectList.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="w-16 h-16 mx-auto text-text-tertiary mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">暂无项目</h3>
            <p className="text-text-secondary mb-4">创建你的第一个API项目开始使用</p>
            <Link
              to="/projects/new"
              className="inline-flex items-center space-x-2 btn-primary"
            >
              <Plus className="w-4 h-4" />
              <span>新建项目</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectList.map((project: any) => (
              <div key={project.id} className="bg-bg-paper rounded-lg shadow-theme-sm border border-border-primary overflow-hidden hover:shadow-theme-md transition-shadow">
                <div className="p-6">
                  {/* 项目标题和状态 */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/projects/${project.id}`}
                        className="text-lg font-semibold text-text-primary hover:text-primary-600 transition-colors truncate block"
                      >
                        {project.name}
                      </Link>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getStatusColor(project.status)}`}>
                        {getStatusLabel(project.status)}
                      </span>
                    </div>
                    
                    <div className="relative">
                      <button className="text-text-tertiary hover:text-text-primary">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* 项目描述 */}
                  <p className="text-text-secondary text-sm mb-4 line-clamp-2">
                    {project.description || '暂无描述'}
                  </p>

                  {/* 项目统计 */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-text-primary">
                        {project._count?.apiEndpoints || 0}
                      </div>
                      <div className="text-xs text-text-tertiary">API</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-text-primary">
                        {project._count?.tags || 0}
                      </div>
                      <div className="text-xs text-text-tertiary">标签</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-text-primary">
                        0
                      </div>
                      <div className="text-xs text-text-tertiary">Issues</div>
                    </div>
                  </div>

                  {/* 项目信息 */}
                  <div className="flex items-center justify-between text-xs text-text-tertiary">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>{formatDate(project.updatedAt)}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        to={`/projects/${project.id}/settings`}
                        className="text-text-tertiary hover:text-text-primary"
                        title="设置"
                      >
                        <Settings className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleArchiveProject(project.id)}
                        className="text-text-tertiary hover:text-warning-600"
                        title="归档"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-text-tertiary hover:text-danger-600"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectsManagePage