import React, { useEffect, useState } from 'react'
import { Bug, ArrowLeft, Plus, Search, Filter } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { IssueCard } from '../components/features/issues/IssueCard'
import { Issue, IssueFilters } from '../types'
import { getIssues } from '../utils/api'

const IssuesManagePage: React.FC = () => {
  const navigate = useNavigate()
  
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<IssueFilters>({
    page: 1,
    limit: 20,
  })
  
  // 获取所有Issues（不限制项目）
  const fetchIssues = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = {
        ...filters,
        search: searchQuery || undefined
      }
      
      const response = await getIssues(undefined, params) // projectId为undefined获取所有Issues
      setIssues(response.data?.issues || [])
    } catch (error) {
      console.error('获取Issues失败:', error)
      setError('获取Issues失败')
      setIssues([])
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchIssues()
  }, [filters, searchQuery])

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
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <Bug className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-text-primary">Issues管理</h1>
                  <p className="text-sm text-text-secondary">跟踪和管理项目问题</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Issues管理内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 搜索和过滤栏 */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
              <input
                type="text"
                placeholder="搜索Issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-outline flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>过滤</span>
            </button>
            <button 
              onClick={() => navigate('/projects')} 
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>创建Issue</span>
            </button>
          </div>
        </div>

        {/* Issues列表 */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-text-secondary">加载中...</div>
          </div>
        ) : error ? (
          <div className="bg-bg-paper border border-border-primary rounded-lg p-8 text-center">
            <Bug className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">加载失败</h3>
            <p className="text-text-secondary mb-4">{error}</p>
            <button 
              onClick={fetchIssues}
              className="btn-primary"
            >
              重试
            </button>
          </div>
        ) : issues.length === 0 ? (
          <div className="bg-bg-paper border border-border-primary rounded-lg p-8 text-center">
            <Bug className="w-12 h-12 text-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">暂无Issues</h3>
            <p className="text-text-secondary mb-4">
              {searchQuery ? '没有找到匹配的Issues' : '还没有创建任何Issues'}
            </p>
            <button 
              onClick={() => navigate('/projects')}
              className="btn-primary"
            >
              创建第一个Issue
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {issues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                onClick={(issue) => navigate(`/projects/${issue.projectId}/issues/${issue.id}`)}
                onUpdate={fetchIssues}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default IssuesManagePage