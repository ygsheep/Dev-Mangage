import { ArrowLeft } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { GitHubSyncPanel } from '../components/features/issues/GitHubSyncPanel'
import { IssueCard } from '../components/features/issues/IssueCard'
import { IssuesFilterBar } from '../components/features/issues/IssuesFilterBar'
import { CreateIssueModal } from '../components/features/issues/modals/CreateIssueModal'
import { Issue, IssueFilters, IssuePriority, IssueStats } from '../types'
import { getIssueStats, getIssues } from '../utils/api'
export const IssuesPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()

  const [issues, setIssues] = useState<Issue[]>([])
  const [stats, setStats] = useState<IssueStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<IssueFilters>({
    page: 1,
    limit: 20,
  })
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })

  // 模态框状态
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSyncPanel, setShowSyncPanel] = useState(false)

  // 获取 Issues 列表
  const fetchIssues = async () => {
    if (!projectId) return

    try {
      setLoading(true)
      setError(null)

      const response = await getIssues(projectId, filters)

      if (response.success) {
        setIssues(response.data.issues)
        setPagination(response.data.pagination)
      } else {
        setError('获取Issues列表失败')
      }
    } catch (err: any) {
      console.error('获取Issues失败:', err)
      setError(err.message || '获取Issues列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取统计信息
  const fetchStats = async () => {
    if (!projectId) return

    try {
      const response = await getIssueStats(projectId)
      if (response.success) {
        setStats(response.data)
      }
    } catch (err: any) {
      console.error('获取统计信息失败:', err)
    }
  }

  // 初始化加载
  useEffect(() => {
    if (projectId) {
      fetchIssues()
      fetchStats()
    }
  }, [projectId, filters])

  // 处理筛选器变化
  const handleFilterChange = (newFilters: Partial<IssueFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1, // 重置页码
    }))
  }

  // 处理分页
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  // 处理 Issue 点击
  const handleIssueClick = (issue: Issue) => {
    navigate(`/projects/${projectId}/issues/${issue.id}`)
  }

  // 处理创建 Issue 成功
  const handleCreateSuccess = () => {
    setShowCreateModal(false)
    fetchIssues()
    fetchStats()
  }

  // 处理同步完成
  const handleSyncComplete = () => {
    fetchIssues()
    fetchStats()
  }

  if (loading && issues.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-text-secondary">加载中...</span>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* 页面头部 */}
      <div className="bg-bg-paper border-b border-border-primary mb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate(`/projects/${projectId}`)}
                  className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors mr-2"
                  title="返回项目详情"
                >
                  <ArrowLeft className="w-5 h-5 text-text-secondary" />
                </button>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="w-6 h-6 text-white"
                >
                  <path d="m8 2 1.88 1.88"></path>
                  <path d="M14.12 3.88 16 2"></path>
                  <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"></path>
                  <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"></path>
                  <path d="M12 20v-9"></path>
                  <path d="M6.53 9C4.6 8.8 3 7.1 3 5"></path>
                  <path d="M6 13H2"></path>
                  <path d="M3 21c0-2.1 1.7-3.9 3.8-4"></path>
                  <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"></path>
                  <path d="M22 13h-4"></path>
                  <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"></path>
                </svg>
                <div>
                  <h1 className="text-xl font-bold text-text-primary">Issues 管理</h1>
                  <p className="text-sm text-text-secondary">管理项目中的 Issues 和 GitHub 同步</p>
                </div>
              </div>
            </div>
            <div className="flex space-x-3 ">
              <button
                onClick={() => setShowSyncPanel(true)}
                className="px-4 py-2 bg-gray-100 text-text-secondary rounded-lg hover:bg-gray-200 transition-colors"
              >
                GitHub 同步
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                新建 Issue
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-bg-paper p-4 rounded-lg shadow-sm border border-border-primary">
            <div className="text-2xl font-bold text-text-primary">{stats.total}</div>
            <div className="text-sm text-text-secondary">总计 Issues</div>
          </div>
          <div className="bg-bg-paper p-4 rounded-lg shadow-sm border border-border-primary">
            <div className="text-2xl font-bold text-success-600">{stats.open}</div>
            <div className="text-sm text-text-secondary">开放</div>
          </div>
          <div className="bg-bg-paper p-4 rounded-lg shadow-sm border border-border-primary">
            <div className="text-2xl font-bold text-text-secondary">{stats.closed}</div>
            <div className="text-sm text-text-secondary">已关闭</div>
          </div>
          <div className="bg-bg-paper p-4 rounded-lg shadow-sm border border-border-primary">
            <div className="text-2xl font-bold text-warning-600">
              {stats.byPriority[IssuePriority.HIGH] || 0}
            </div>
            <div className="text-sm text-text-secondary">高优先级</div>
          </div>
        </div>
      )}

      {/* 筛选栏 */}
      <IssuesFilterBar filters={filters} onFiltersChange={handleFilterChange} stats={stats} />

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
          <button onClick={fetchIssues} className="mt-2 text-red-600 hover:text-red-800 underline">
            重试
          </button>
        </div>
      )}

      {/* Issues 列表 */}
      <div className="space-y-4">
        {issues.map(issue => (
          <IssueCard key={issue.id} issue={issue} onClick={() => handleIssueClick(issue)} />
        ))}

        {/* 空状态 */}
        {!loading && issues.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-text-primary mb-2">暂无 Issues</h3>
            <p className="text-text-secondary mb-4">创建第一个 Issue 或从 GitHub 同步现有 Issues</p>
            <div className="space-x-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                创建 Issue
              </button>
              <button
                onClick={() => setShowSyncPanel(true)}
                className="px-4 py-2 bg-gray-100 text-text-secondary rounded-lg hover:bg-gray-200"
              >
                配置 GitHub 同步
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 分页 */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={!pagination.hasPrev}
            className="px-3 py-2 text-sm text-text-secondary bg-bg-paper border border-border-primary rounded-lg hover:bg-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>

          <span className="text-sm text-text-secondary">
            第 {pagination.page} 页，共 {pagination.totalPages} 页
          </span>

          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={!pagination.hasNext}
            className="px-3 py-2 text-sm text-text-secondary bg-bg-paper border border-border-primary rounded-lg hover:bg-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      )}

      {/* 加载状态 */}
      {loading && issues.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* 创建 Issue 模态框 */}
      {showCreateModal && (
        <CreateIssueModal
          projectId={projectId!}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* GitHub 同步面板 */}
      {showSyncPanel && (
        <GitHubSyncPanel
          projectId={projectId!}
          onClose={() => setShowSyncPanel(false)}
          onSyncComplete={handleSyncComplete}
        />
      )}
    </div>
  )
}
