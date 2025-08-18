import React from 'react'
import { 
  Issue,
  ISSUE_STATUS_COLORS,
  ISSUE_PRIORITY_COLORS,
  ISSUE_TYPE_COLORS,
  SYNC_STATUS_COLORS,
  ISSUE_STATUS_LABELS,
  ISSUE_PRIORITY_LABELS,
  ISSUE_TYPE_LABELS,
  SYNC_STATUS_LABELS
} from '../../../types'

interface IssueCardProps {
  issue: Issue
  onClick?: () => void
}

export const IssueCard: React.FC<IssueCardProps> = ({ issue, onClick }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 24) {
      return `${diffInHours} 小时前`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays} 天前`
    }
  }

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      {/* 头部：标题和 GitHub 链接 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600">
              {issue.title}
            </h3>
            {issue.githubNumber && (
              <span className="text-sm text-gray-500">
                #{issue.githubNumber}
              </span>
            )}
          </div>
          
          {issue.description && (
            <p className="text-gray-600 text-sm line-clamp-2">
              {issue.description}
            </p>
          )}
        </div>

        {/* GitHub 链接 */}
        {issue.githubHtmlUrl && (
          <a
            href={issue.githubHtmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-4 text-gray-400 hover:text-gray-600"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
            </svg>
          </a>
        )}
      </div>

      {/* 标签行：状态、优先级、类型、同步状态 */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {/* 状态标签 */}
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${ISSUE_STATUS_COLORS[issue.status]}`}>
          {ISSUE_STATUS_LABELS[issue.status]}
        </span>

        {/* 优先级标签 */}
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${ISSUE_PRIORITY_COLORS[issue.priority]}`}>
          {ISSUE_PRIORITY_LABELS[issue.priority]}
        </span>

        {/* 类型标签 */}
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${ISSUE_TYPE_COLORS[issue.issueType]}`}>
          {ISSUE_TYPE_LABELS[issue.issueType]}
        </span>

        {/* 同步状态标签 */}
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${SYNC_STATUS_COLORS[issue.syncStatus]}`}>
          {SYNC_STATUS_LABELS[issue.syncStatus]}
        </span>

        {/* Issue 标签 */}
        {issue.labels?.slice(0, 3).map((label) => (
          <span
            key={label.id}
            className="px-2 py-1 text-xs font-medium rounded-full"
            style={{
              backgroundColor: label.color + '20',
              color: label.color,
              borderColor: label.color + '40',
              border: '1px solid'
            }}
          >
            {label.name}
          </span>
        ))}

        {/* 更多标签指示器 */}
        {issue.labels && issue.labels.length > 3 && (
          <span className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
            +{issue.labels.length - 3}
          </span>
        )}
      </div>

      {/* 底部信息：分配人、时间、关联数量 */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          {/* 分配人 */}
          {issue.assigneeName && (
            <div className="flex items-center space-x-1">
              <span>👤</span>
              <span>{issue.assigneeName}</span>
            </div>
          )}

          {/* 截止日期 */}
          {issue.dueDate && (
            <div className="flex items-center space-x-1">
              <span>📅</span>
              <span className={new Date(issue.dueDate) < new Date() ? 'text-red-600' : ''}>
                {formatDate(issue.dueDate)}
              </span>
            </div>
          )}

          {/* 工时信息 */}
          {issue.estimatedHours && (
            <div className="flex items-center space-x-1">
              <span>⏱️</span>
              <span>{issue.estimatedHours}h</span>
              {issue.actualHours && (
                <span className="text-gray-400">
                  / {issue.actualHours}h
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* 关联数量 */}
          <div className="flex items-center space-x-3 text-xs">
            {issue.relatedAPIs && issue.relatedAPIs.length > 0 && (
              <span>🔗 {issue.relatedAPIs.length} API</span>
            )}
            {issue.relatedTables && issue.relatedTables.length > 0 && (
              <span>🗄️ {issue.relatedTables.length} 表</span>
            )}
            {issue.comments && issue.comments.length > 0 && (
              <span>💬 {issue.comments.length}</span>
            )}
          </div>

          {/* 最后更新时间 */}
          <span className="text-xs">
            {formatTimeAgo(issue.updatedAt)}
          </span>
        </div>
      </div>

      {/* 同步错误提示 */}
      {issue.syncStatus === 'SYNC_FAILED' && issue.syncError && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
          <span className="font-medium">同步失败：</span>
          {issue.syncError}
        </div>
      )}
    </div>
  )
}