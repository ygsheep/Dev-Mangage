import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MarkdownPreview from '@uiw/react-markdown-preview'
import { ExternalLink } from 'lucide-react'
import MarkdownEditor from '../components/common/MarkdownEditor'
import { IssueRelationsPanel } from '../components/features/issues/IssueRelationsPanel'
import { IssueEditModal } from '../components/features/issues/modals/IssueEditModal'
import {
  ISSUE_PRIORITY_COLORS,
  ISSUE_PRIORITY_LABELS,
  ISSUE_SEVERITY_LABELS,
  ISSUE_STATUS_COLORS,
  ISSUE_STATUS_LABELS,
  ISSUE_TYPE_COLORS,
  ISSUE_TYPE_LABELS,
  Issue,
  IssueComment,
  IssueStatus,
} from '../types'
import {
  createComment,
  deleteIssue,
  getComments,
  getIssue,
  getIssueRelations,
  updateIssue,
} from '../utils/api'

export const IssueDetailPage: React.FC = () => {
  const { projectId, issueId } = useParams<{ projectId: string; issueId: string }>()
  const navigate = useNavigate()

  const [issue, setIssue] = useState<Issue | null>(null)
  const [comments, setComments] = useState<IssueComment[]>([])
  const [relations, setRelations] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 编辑相关状态
  const [showEditModal, setShowEditModal] = useState(false)
  const [showRelationsPanel, setShowRelationsPanel] = useState(false)

  // 评论相关状态
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  // 获取 Issue 详情
  const fetchIssue = async () => {
    if (!projectId || !issueId) return

    try {
      setLoading(true)
      setError(null)

      const response = await getIssue(projectId, issueId)

      if (response.success) {
        setIssue(response.data)
      } else {
        setError('获取 Issue 详情失败')
      }
    } catch (err: any) {
      console.error('获取 Issue 详情失败:', err)
      setError(err.message || '获取 Issue 详情失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取评论列表
  const fetchComments = async () => {
    if (!projectId || !issueId) return

    try {
      const response = await getComments(projectId, {
        targetType: 'issue',
        targetId: issueId,
      })
      if (response.success) {
        setComments(response.data.comments || [])
      }
    } catch (err: any) {
      console.error('获取评论失败:', err)
    }
  }

  // 获取关联关系
  const fetchRelations = async () => {
    if (!projectId || !issueId) return

    try {
      const response = await getIssueRelations(projectId, issueId)
      if (response.success) {
        setRelations(response.data)
      }
    } catch (err: any) {
      console.error('获取关联关系失败:', err)
    }
  }

  // 初始化加载
  useEffect(() => {
    if (projectId && issueId) {
      fetchIssue()
      fetchComments()
      fetchRelations()
    }
  }, [projectId, issueId])

  // 快速状态更新
  const handleStatusChange = async (status: IssueStatus) => {
    if (!issue || !projectId) return

    try {
      const response = await updateIssue(projectId, issue.id, { status })

      if (response.success) {
        setIssue(response.data)
      } else {
        setError('更新状态失败')
      }
    } catch (err: any) {
      console.error('更新状态失败:', err)
      setError(err.message || '更新状态失败')
    }
  }

  // 删除 Issue
  const handleDelete = async () => {
    if (!issue || !projectId) return

    if (!confirm('确定要删除这个 Issue 吗？此操作不可撤销。')) {
      return
    }

    try {
      const response = await deleteIssue(projectId, issue.id)

      if (response.success) {
        navigate(`/projects/${projectId}/issues`)
      } else {
        setError('删除 Issue 失败')
      }
    } catch (err: any) {
      console.error('删除 Issue 失败:', err)
      setError(err.message || '删除 Issue 失败')
    }
  }

  // 添加评论
  const handleAddComment = async () => {
    if (!newComment.trim() || !projectId || !issueId) return

    setSubmittingComment(true)
    setError(null)

    try {
      const response = await createComment(projectId, {
        content: newComment,
        targetType: 'issue',
        targetId: issueId,
        targetName: issue?.title || 'Unknown Issue',
      })

      if (response.success) {
        setNewComment('')
        await fetchComments()
      } else {
        setError(response.message || '添加评论失败')
      }
    } catch (err: any) {
      console.error('添加评论失败:', err)
      setError(err.message || '添加评论失败')
    } finally {
      setSubmittingComment(false)
    }
  }

  // 处理编辑成功
  const handleEditSuccess = (updatedIssue: Issue) => {
    setIssue(updatedIssue)
    setShowEditModal(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-text-secondary">加载中...</span>
      </div>
    )
  }

  if (error && !issue) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <div className="mt-4 space-x-3">
            <button onClick={fetchIssue} className="text-red-600 hover:text-red-800 underline">
              重试
            </button>
            <button
              onClick={() => navigate(`/projects/${projectId}/issues`)}
              className="text-text-secondary hover:text-text-primary underline"
            >
              返回列表
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!issue) return null

  return (
    <div className="py-8 px-6 max-w-6xl mx-auto">
      {/* 顶部导航和操作栏 */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/projects/${projectId}/issues`)}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              #{issue.number} {issue.title}
            </h1>
            <div className="flex items-center space-x-3 mt-2">
              <span
                className={`px-2 py-1 text-xs rounded-full ${ISSUE_STATUS_COLORS[issue.status]} text-white`}
              >
                {ISSUE_STATUS_LABELS[issue.status]}
              </span>
              <span
                className={`px-2 py-1 text-xs rounded-full ${ISSUE_PRIORITY_COLORS[issue.priority]} text-white`}
              >
                {ISSUE_PRIORITY_LABELS[issue.priority]}
              </span>
              <span
                className={`px-2 py-1 text-xs rounded-full ${ISSUE_TYPE_COLORS[issue.issueType]} text-white`}
              >
                {ISSUE_TYPE_LABELS[issue.issueType]}
              </span>
              {issue.githubId && (
                <span className="px-2 py-1 text-xs rounded-full bg-gray-700 text-white">
                  GitHub #{issue.githubId}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          {/* 快速状态切换 */}
          <div className="flex space-x-1 bg-bg-tertiary border border-border-primary rounded-lg p-1">
            {Object.entries(ISSUE_STATUS_LABELS).map(([status, label]) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status as IssueStatus)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  issue.status === status
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-paper'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowRelationsPanel(true)}
            className="px-3 py-2 text-text-primary bg-bg-paper border border-border-primary rounded-lg hover:bg-bg-tertiary transition-colors"
          >
            关联
          </button>
          <button
            onClick={() => setShowEditModal(true)}
            className="px-3 py-2 text-text-primary bg-bg-paper border border-border-primary rounded-lg hover:bg-bg-tertiary transition-colors"
          >
            编辑
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            删除
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 主内容区 */}
        <div className="lg:col-span-3 space-y-0">
          {/* Issue 描述 */}
          <div className="bg-bg-paper border border-border-primary rounded-t-lg">
            {/* 描述头部 */}
            <div className="flex items-center px-4 py-3 bg-bg-tertiary border-b border-border-primary rounded-t-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                  {issue.assignee?.slice(0, 1).toUpperCase() || '?'}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-text-primary">
                      {issue.assignee || '未分配'}
                    </span>
                    <span className="text-sm text-text-tertiary">创建于</span>
                    <span className="text-sm text-text-tertiary">
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-xs text-text-tertiary">创建者</div>
                </div>
              </div>
            </div>
            
            {/* 描述内容 */}
            <div className="p-4">
              {issue.description ? (
                <div className="markdown-content">
                  <MarkdownPreview
                    source={issue.description}
                    data-color-mode={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                    style={{ 
                      backgroundColor: 'transparent',
                      padding: 0
                    }}
                  />
                </div>
              ) : (
                <p className="text-text-tertiary italic">暂无描述</p>
              )}
            </div>
          </div>

          {/* 时间线和评论 */}
          <div className="mt-6 space-y-4">
            {comments.map((comment, index) => (
              <div key={comment.id} className="flex space-x-3">
                {/* 时间线头像 */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {comment.authorName.slice(0, 1).toUpperCase()}
                  </div>
                </div>
                
                {/* 评论内容 */}
                <div className="flex-1 min-w-0">
                  <div className="bg-bg-paper border border-border-primary rounded-lg">
                    {/* 评论头部 */}
                    <div className="flex items-center px-4 py-3 bg-bg-tertiary border-b border-border-primary rounded-t-lg">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-text-primary">{comment.authorName}</span>
                        <span className="text-sm text-text-tertiary">评论于</span>
                        <span className="text-sm text-text-tertiary">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                        {comment.githubId && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                            GitHub
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* 评论内容 */}
                    <div className="p-4">
                      <div className="comment-content">
                        <MarkdownPreview
                          source={comment.content}
                          data-color-mode={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                          style={{ 
                            backgroundColor: 'transparent',
                            padding: 0,
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {comments.length === 0 && (
              <div className="text-center py-8">
                <p className="text-text-tertiary italic">暂无评论</p>
              </div>
            )}
          </div>

            {/* 添加评论 */}
            <div className="mt-6 flex space-x-3">
              {/* 用户头像 */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  U
                </div>
              </div>
              
              {/* 评论编辑器 */}
              <div className="flex-1 min-w-0">
                <MarkdownEditor
                  value={newComment}
                  onChange={setNewComment}
                  rows={6}
                  placeholder="使用 Markdown 语法编写评论..."
                  helpText="可通过拖拽、选择或粘贴来添加文件附件"
                />
                
                {/* 提交按钮 */}
                <div className="flex justify-end mt-3">
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || submittingComment}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center space-x-2"
                  >
                    {submittingComment && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    <span>{submittingComment ? '提交中...' : '发表评论'}</span>
                  </button>
                </div>
              </div>
            </div>
        </div>

        {/* 侧边栏信息 */}
        <div className="space-y-6">
          {/* 分配者 */}
          <div>
            <div className="text-sm font-medium text-text-secondary mb-2">分配者</div>
            <div className="text-sm text-text-tertiary">
              {issue.assigneeName ? (
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                    {issue.assigneeName.slice(0, 1).toUpperCase()}
                  </div>
                  <span className="text-text-primary">{issue.assigneeName}</span>
                </div>
              ) : (
                '暂未分配'
              )}
            </div>
          </div>

          {/* 标签 */}
          <div>
            <div className="text-sm font-medium text-text-secondary mb-2">标签</div>
            <div className="space-y-1">
              <span className={`inline-block px-2 py-1 rounded-full text-xs ${ISSUE_TYPE_COLORS[issue.issueType]} text-white mr-1 mb-1`}>
                {ISSUE_TYPE_LABELS[issue.issueType]}
              </span>
              <span className={`inline-block px-2 py-1 rounded-full text-xs ${ISSUE_PRIORITY_COLORS[issue.priority]} text-white mr-1 mb-1`}>
                {ISSUE_PRIORITY_LABELS[issue.priority]}
              </span>
              <span className={`inline-block px-2 py-1 rounded-full text-xs ${ISSUE_STATUS_COLORS[issue.status]} text-white mr-1 mb-1`}>
                {ISSUE_STATUS_LABELS[issue.status]}
              </span>
              {issue.labels && issue.labels.map((label, index) => (
                <span
                  key={index}
                  style={{ backgroundColor: label.color }}
                  className="inline-block px-2 py-1 text-xs text-white rounded-full mr-1 mb-1"
                >
                  {label.name}
                </span>
              ))}
            </div>
          </div>

          {/* 里程碑 */}
          <div>
            <div className="text-sm font-medium text-text-secondary mb-2">里程碑</div>
            <div className="text-sm text-text-tertiary">
              {issue.dueDate ? (
                <div>
                  <div className="text-text-primary">截止: {new Date(issue.dueDate).toLocaleDateString()}</div>
                  {issue.estimatedHours && (
                    <div className="text-xs">预估: {issue.estimatedHours}小时</div>
                  )}
                  {issue.storyPoints && (
                    <div className="text-xs">故事点: {issue.storyPoints}</div>
                  )}
                </div>
              ) : (
                '暂无里程碑'
              )}
            </div>
          </div>

          {/* 关联资源 */}
          <div>
            <div className="text-sm font-medium text-text-secondary mb-2">关联资源</div>
            {relations && (relations.apis?.length > 0 || relations.tables?.length > 0 || relations.features?.length > 0) ? (
              <div className="space-y-2 text-xs">
                {relations.apis?.length > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 text-text-primary">
                      <span>🔗</span>
                      <span>{relations.apis.length} 个API接口</span>
                    </div>
                    <button
                      onClick={() => navigate(`/projects/${projectId}/apis`)}
                      className="text-blue-500 hover:text-blue-600 p-1"
                      title="查看API管理"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {relations.tables?.length > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 text-text-primary">
                      <span>🗃️</span>
                      <span>{relations.tables.length} 个数据表</span>
                    </div>
                    <button
                      onClick={() => navigate(`/projects/${projectId}/erd`)}
                      className="text-blue-500 hover:text-blue-600 p-1"
                      title="查看数据模型"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {relations.features?.length > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 text-text-primary">
                      <span>⚡</span>
                      <span>{relations.features.length} 个功能模块</span>
                    </div>
                    <button
                      onClick={() => navigate(`/projects/${projectId}/mindmap`)}
                      className="text-blue-500 hover:text-blue-600 p-1"
                      title="查看思维导图"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setShowRelationsPanel(true)}
                  className="text-blue-500 hover:text-blue-600 underline mt-1"
                >
                  管理关联关系
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-text-tertiary mb-2">
                  暂无关联资源
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => navigate(`/projects/${projectId}/apis`)}
                    className="flex items-center justify-between w-full text-xs text-blue-500 hover:text-blue-600 py-1"
                  >
                    <span>📝 关联API接口</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => navigate(`/projects/${projectId}/erd`)}
                    className="flex items-center justify-between w-full text-xs text-blue-500 hover:text-blue-600 py-1"
                  >
                    <span>🗃️ 关联数据表</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setShowRelationsPanel(true)}
                    className="text-xs text-blue-500 hover:text-blue-600 underline"
                  >
                    手动添加关联
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="border-t border-border-primary pt-4 space-y-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              编辑 Issue
            </button>
            <button
              onClick={() => setShowRelationsPanel(true)}
              className="w-full px-3 py-2 text-sm border border-border-primary text-text-primary rounded hover:bg-bg-tertiary transition-colors"
            >
              管理关联
            </button>
            <button
              onClick={handleDelete}
              className="w-full px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              删除 Issue
            </button>
          </div>

          {/* 时间信息 */}
          <div className="text-xs text-text-tertiary space-y-1 border-t border-border-primary pt-4">
            <div>创建时间: {new Date(issue.createdAt).toLocaleDateString()}</div>
            <div>更新时间: {new Date(issue.updatedAt).toLocaleDateString()}</div>
            {issue.resolvedAt && (
              <div>解决时间: {new Date(issue.resolvedAt).toLocaleDateString()}</div>
            )}
            {issue.severity && (
              <div>严重程度: {ISSUE_SEVERITY_LABELS[issue.severity]}</div>
            )}
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
          <p className="text-red-800 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
          >
            关闭
          </button>
        </div>
      )}

      {/* 编辑模态框 */}
      {showEditModal && issue && (
        <IssueEditModal
          issue={issue}
          projectId={projectId!}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* 关联面板 */}
      {showRelationsPanel && (
        <IssueRelationsPanel
          issueId={issue.id}
          projectId={projectId!}
          onClose={() => setShowRelationsPanel(false)}
          onUpdated={fetchRelations}
        />
      )}
    </div>
  )
}
