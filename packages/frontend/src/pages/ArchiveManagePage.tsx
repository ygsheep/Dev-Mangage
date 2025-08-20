import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Archive, 
  Search, 
  RotateCcw, 
  Trash2, 
  Download, 
  Eye,
  Calendar,
  Settings,
  Folder,
  Database,
  Bug,
  Activity,
  ArrowLeft
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { apiMethods } from '../utils/api'
import { toast } from 'react-hot-toast'

const ArchiveManagePage: React.FC = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'archivedAt'>('archivedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // 获取已归档项目列表（使用模拟数据）
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiMethods.getProjects(),
    staleTime: 30000
  })

  // 模拟归档项目数据
  const archivedProjects: any[] = []
  const isLoading = false
  const error = null
  const refetch = () => Promise.resolve()

  const handleRestoreProject = async (projectId: string) => {
    toast.success('恢复功能暂未实现')
  }

  const handlePermanentDelete = async (projectId: string) => {
    toast.success('永久删除功能暂未实现')
  }

  const handleExportProject = async (projectId: string, projectName: string) => {
    toast.success('导出功能暂未实现')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getArchiveReason = (reason?: string) => {
    const reasons: Record<string, string> = {
      'completed': '项目完成',
      'cancelled': '项目取消',
      'deprecated': '项目废弃',
      'manual': '手动归档',
      'inactive': '长期不活跃'
    }
    return reasons[reason || 'manual'] || '手动归档'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-text-secondary">加载已归档项目中...</p>
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
          <p className="text-text-secondary mb-4">无法获取归档项目列表</p>
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

  const projectList = Array.isArray(archivedProjects) ? archivedProjects : archivedProjects?.data || []

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
                <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                  <Archive className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-text-primary">归档项目</h1>
                  <p className="text-sm text-text-secondary">查看和管理已归档的项目</p>
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
            </div>
          </div>
        </div>
      </div>

      {/* 筛选和搜索 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-bg-paper rounded-lg shadow-theme-sm border border-border-primary p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 搜索框 */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="搜索已归档项目..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-bg-primary text-text-primary"
                />
              </div>
            </div>

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
              <option value="archivedAt-desc">最近归档</option>
              <option value="archivedAt-asc">最早归档</option>
              <option value="name-asc">名称 A-Z</option>
              <option value="name-desc">名称 Z-A</option>
            </select>
          </div>
        </div>
      </div>

      {/* 归档项目列表 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {projectList.length === 0 ? (
          <div className="text-center py-12">
            <Archive className="w-16 h-16 mx-auto text-text-tertiary mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">暂无归档项目</h3>
            <p className="text-text-secondary">当你归档项目时，它们会显示在这里</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projectList.map((project: any) => (
              <div key={project.id} className="bg-bg-paper rounded-lg shadow-theme-sm border border-border-primary overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    {/* 左侧项目信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Folder className="w-5 h-5 text-gray-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-text-primary truncate">
                            {project.name}
                          </h3>
                          <p className="text-sm text-text-secondary">
                            归档原因: {getArchiveReason(project.archiveReason)}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            已归档
                          </span>
                        </div>
                      </div>

                      {/* 项目描述 */}
                      <p className="text-text-secondary text-sm mb-4 line-clamp-2">
                        {project.description || '暂无描述'}
                      </p>

                      {/* 项目统计 */}
                      <div className="grid grid-cols-4 gap-6 mb-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Activity className="w-4 h-4 text-blue-500 mr-1" />
                            <span className="text-lg font-semibold text-text-primary">
                              {project._count?.apis || 0}
                            </span>
                          </div>
                          <div className="text-xs text-text-tertiary">API接口</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Database className="w-4 h-4 text-green-500 mr-1" />
                            <span className="text-lg font-semibold text-text-primary">
                              {project._count?.databaseTables || 0}
                            </span>
                          </div>
                          <div className="text-xs text-text-tertiary">数据表</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Bug className="w-4 h-4 text-red-500 mr-1" />
                            <span className="text-lg font-semibold text-text-primary">
                              {project._count?.issues || 0}
                            </span>
                          </div>
                          <div className="text-xs text-text-tertiary">Issues</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Archive className="w-4 h-4 text-gray-500 mr-1" />
                            <span className="text-lg font-semibold text-text-primary">
                              {Math.ceil((Date.now() - new Date(project.archivedAt).getTime()) / (1000 * 60 * 60 * 24))}
                            </span>
                          </div>
                          <div className="text-xs text-text-tertiary">天前归档</div>
                        </div>
                      </div>

                      {/* 时间信息 */}
                      <div className="flex items-center justify-between text-xs text-text-tertiary">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>归档于 {formatDate(project.archivedAt)}</span>
                        </div>
                        <div className="flex items-center">
                          <span>最后更新 {formatDate(project.updatedAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* 右侧操作按钮 */}
                    <div className="flex-shrink-0 ml-6">
                      <div className="flex space-x-2">
                        <Link
                          to={`/projects/${project.id}`}
                          className="p-2 text-text-tertiary hover:text-primary-600 hover:bg-bg-tertiary rounded-lg transition-colors"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        
                        <button
                          onClick={() => handleExportProject(project.id, project.name)}
                          className="p-2 text-text-tertiary hover:text-blue-600 hover:bg-bg-tertiary rounded-lg transition-colors"
                          title="导出项目"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleRestoreProject(project.id)}
                          className="p-2 text-text-tertiary hover:text-green-600 hover:bg-bg-tertiary rounded-lg transition-colors"
                          title="恢复项目"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handlePermanentDelete(project.id)}
                          className="p-2 text-text-tertiary hover:text-red-600 hover:bg-bg-tertiary rounded-lg transition-colors"
                          title="永久删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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

export default ArchiveManagePage