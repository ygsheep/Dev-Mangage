import React, { useState } from 'react'
import {
  IssueFilters,
  IssueStats,
  IssueStatus,
  IssuePriority,
  IssueType,
  ISSUE_STATUS_LABELS,
  ISSUE_PRIORITY_LABELS,
  ISSUE_TYPE_LABELS
} from '../../../types'

interface IssuesFilterBarProps {
  filters: IssueFilters
  onFiltersChange: (filters: Partial<IssueFilters>) => void
  stats?: IssueStats | null
}

export const IssuesFilterBar: React.FC<IssuesFilterBarProps> = ({
  filters,
  onFiltersChange,
  stats
}) => {
  const [searchInput, setSearchInput] = useState(filters.search || '')

  // 处理搜索
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onFiltersChange({ search: searchInput.trim() || undefined })
  }

  // 处理搜索输入变化
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchInput(value)
    
    // 如果输入为空，立即清除搜索
    if (!value.trim()) {
      onFiltersChange({ search: undefined })
    }
  }

  // 处理筛选器变化
  const handleFilterChange = (key: keyof IssueFilters, value: any) => {
    onFiltersChange({ [key]: value === 'all' ? undefined : value })
  }

  // 清除所有筛选器
  const clearFilters = () => {
    setSearchInput('')
    onFiltersChange({
      status: undefined,
      priority: undefined,
      issueType: undefined,
      assignee: undefined,
      search: undefined
    })
  }

  // 计算活跃筛选器数量
  const activeFiltersCount = [
    filters.status,
    filters.priority,
    filters.issueType,
    filters.assignee,
    filters.search
  ].filter(Boolean).length

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      {/* 搜索栏 */}
      <form onSubmit={handleSearchSubmit} className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="搜索 Issues（标题、描述）..."
            value={searchInput}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('')
                onFiltersChange({ search: undefined })
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {/* 筛选器行 */}
      <div className="flex flex-wrap items-center gap-4">
        {/* 状态筛选 */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">状态:</label>
          <select
            value={filters.status || 'all'}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">全部</option>
            {Object.entries(ISSUE_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
                {stats && ` (${value === IssueStatus.OPEN ? stats.open : stats.closed})`}
              </option>
            ))}
          </select>
        </div>

        {/* 优先级筛选 */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">优先级:</label>
          <select
            value={filters.priority || 'all'}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">全部</option>
            {Object.entries(ISSUE_PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
                {stats && stats.byPriority[value as IssuePriority] && 
                  ` (${stats.byPriority[value as IssuePriority]})`
                }
              </option>
            ))}
          </select>
        </div>

        {/* 类型筛选 */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">类型:</label>
          <select
            value={filters.issueType || 'all'}
            onChange={(e) => handleFilterChange('issueType', e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">全部</option>
            {Object.entries(ISSUE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
                {stats && stats.byType[value as IssueType] && 
                  ` (${stats.byType[value as IssueType]})`
                }
              </option>
            ))}
          </select>
        </div>

        {/* 分配人筛选 */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">分配给:</label>
          <input
            type="text"
            placeholder="用户名"
            value={filters.assignee || ''}
            onChange={(e) => handleFilterChange('assignee', e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1 w-24 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* 清除筛选器 */}
        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            清除筛选器 ({activeFiltersCount})
          </button>
        )}
      </div>

      {/* 快速筛选标签 */}
      <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
        <span className="text-sm text-gray-600">快速筛选:</span>
        
        <button
          onClick={() => onFiltersChange({ status: IssueStatus.OPEN, priority: IssuePriority.HIGH })}
          className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100"
        >
          高优先级开放
        </button>
        
        <button
          onClick={() => onFiltersChange({ issueType: IssueType.BUG, status: IssueStatus.OPEN })}
          className="px-2 py-1 text-xs bg-orange-50 text-orange-700 rounded hover:bg-orange-100"
        >
          未修复 Bug
        </button>
        
        <button
          onClick={() => onFiltersChange({ issueType: IssueType.FEATURE, status: IssueStatus.OPEN })}
          className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100"
        >
          新功能请求
        </button>
        
        <button
          onClick={() => onFiltersChange({ assignee: undefined, status: IssueStatus.OPEN })}
          className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
        >
          未分配
        </button>
      </div>
    </div>
  )
}