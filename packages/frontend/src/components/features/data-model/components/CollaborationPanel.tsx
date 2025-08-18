import React, { useState, useEffect } from 'react'
import {
  MessageSquare,
  Send,
  Reply,
  MoreHorizontal,
  Edit3,
  Trash2,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  X,
  Plus,
  Filter,
  Search
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getComments, createComment, updateComment, deleteComment, resolveComment } from '../../../../utils/api'

interface Comment {
  id: string
  content: string
  authorId: string
  authorName: string
  authorAvatar?: string
  createdAt: Date
  updatedAt: Date
  parentId?: string
  replies?: Comment[]
  isResolved?: boolean
  target: {
    type: 'table' | 'field' | 'index' | 'relationship'
    id: string
    name: string
  }
  mentions?: string[]
  attachments?: Array<{
    id: string
    name: string
    url: string
    type: string
  }>
}

interface CollaborationPanelProps {
  projectId: string
  targetType: 'table' | 'field' | 'index' | 'relationship'
  targetId: string
  targetName: string
  currentUserId: string
  currentUserName: string
}

const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  projectId,
  targetType,
  targetId,
  targetName,
  currentUserId,
  currentUserName
}) => {
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const queryClient = useQueryClient()

  // 加载评论数据
  const { data: commentsResponse, isLoading } = useQuery({
    queryKey: ['comments', projectId, targetType, targetId],
    queryFn: () => getComments(projectId, {
      targetType,
      targetId
    }),
    enabled: !!projectId
  })

  const comments = commentsResponse?.data?.comments || []

  // 过滤评论
  const filteredComments = comments.filter(comment => {
    // 状态过滤
    if (filter === 'resolved' && !comment.isResolved) return false
    if (filter === 'unresolved' && comment.isResolved) return false

    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        comment.content.toLowerCase().includes(query) ||
        comment.authorName.toLowerCase().includes(query) ||
        comment.replies?.some(reply => 
          reply.content.toLowerCase().includes(query) ||
          reply.authorName.toLowerCase().includes(query)
        )
      )
    }

    return true
  })

  // 添加评论 Mutation
  const createCommentMutation = useMutation({
    mutationFn: (data: { content: string; parentId?: string }) => 
      createComment(projectId, {
        content: data.content,
        targetType,
        targetId,
        targetName,
        parentId: data.parentId
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', projectId, targetType, targetId])
      setNewComment('')
      setReplyingTo(null)
      toast.success('评论已添加')
    },
    onError: () => {
      toast.error('添加评论失败')
    }
  })

  // 添加评论
  const handleAddComment = async (content: string, parentId?: string) => {
    if (!content.trim()) return
    createCommentMutation.mutate({ content: content.trim(), parentId })
  }

  // 编辑评论 Mutation
  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) => 
      updateComment(projectId, commentId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', projectId, targetType, targetId])
      setEditingComment(null)
      toast.success('评论已更新')
    },
    onError: () => {
      toast.error('更新评论失败')
    }
  })

  // 编辑评论
  const handleEditComment = (commentId: string, content: string) => {
    updateCommentMutation.mutate({ commentId, content: content.trim() })
  }

  // 删除评论 Mutation
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => deleteComment(projectId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', projectId, targetType, targetId])
      toast.success('评论已删除')
    },
    onError: () => {
      toast.error('删除评论失败')
    }
  })

  // 删除评论
  const handleDeleteComment = (commentId: string) => {
    deleteCommentMutation.mutate(commentId)
  }

  // 解决/重新打开评论 Mutation
  const resolveCommentMutation = useMutation({
    mutationFn: ({ commentId, isResolved }: { commentId: string; isResolved: boolean }) => 
      resolveComment(projectId, commentId, isResolved),
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', projectId, targetType, targetId])
    },
    onError: () => {
      toast.error('更新评论状态失败')
    }
  })

  // 解决/重新打开评论
  const toggleCommentResolution = (commentId: string) => {
    const comment = comments.find(c => c.id === commentId)
    if (comment) {
      resolveCommentMutation.mutate({ commentId, isResolved: !comment.isResolved })
    }
  }

  // 格式化时间
  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    // 检查是否是有效的日期对象
    if (!dateObj || isNaN(dateObj.getTime())) {
      return '时间未知'
    }
    
    const now = new Date()
    const diff = now.getTime() - dateObj.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return dateObj.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* 头部工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <MessageSquare className="w-6 h-6 text-blue-500" />
          <h3 className="text-lg font-medium text-text-primary">
            协作讨论 ({filteredComments.length})
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索评论..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-64"
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="input w-auto"
          >
            <option value="all">全部评论</option>
            <option value="unresolved">待解决</option>
            <option value="resolved">已解决</option>
          </select>
        </div>
      </div>

      {/* 新评论输入 */}
      <div className="bg-bg-paper rounded-lg border border-gray-200 p-4">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {currentUserName.charAt(0)}
          </div>
          
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={`对 ${targetName} 添加评论...`}
              className="input w-full resize-none"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleAddComment(newComment)
                }
              }}
            />
            
            <div className="flex items-center justify-between mt-3">
              <div className="text-sm text-gray-500">
                支持 Markdown 格式，Ctrl+Enter 快速发送
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setNewComment('')}
                  className="btn-outline"
                  disabled={!newComment.trim()}
                >
                  清空
                </button>
                <button
                  onClick={() => handleAddComment(newComment)}
                  disabled={!newComment.trim() || createCommentMutation.isLoading}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>发送</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 评论列表 */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12 bg-bg-secondary rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4" />
            <p className="text-text-secondary">加载评论中...</p>
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="text-center py-12 bg-bg-secondary rounded-lg">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-text-primary mb-2">
              {searchQuery || filter !== 'all' ? '没有找到相关评论' : '暂无评论'}
            </h4>
            <p className="text-text-secondary">
              {searchQuery || filter !== 'all' 
                ? '请尝试调整搜索条件或筛选器' 
                : '成为第一个发表评论的人'}
            </p>
          </div>
        ) : (
          filteredComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onReply={(content) => handleAddComment(content, comment.id)}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
              onToggleResolution={toggleCommentResolution}
              formatTime={formatTime}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              editingComment={editingComment}
              setEditingComment={setEditingComment}
            />
          ))
        )}
      </div>
    </div>
  )
}

// 评论项组件
interface CommentItemProps {
  comment: Comment
  currentUserId: string
  onReply: (content: string) => void
  onEdit: (commentId: string, content: string) => void
  onDelete: (commentId: string) => void
  onToggleResolution: (commentId: string) => void
  formatTime: (date: Date) => string
  replyingTo: string | null
  setReplyingTo: (id: string | null) => void
  editingComment: string | null
  setEditingComment: (id: string | null) => void
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onToggleResolution,
  formatTime,
  replyingTo,
  setReplyingTo,
  editingComment,
  setEditingComment
}) => {
  const [replyContent, setReplyContent] = useState('')
  const [editContent, setEditContent] = useState(comment.content)
  const [showActions, setShowActions] = useState(false)

  const isAuthor = comment.authorId === currentUserId
  const isEditing = editingComment === comment.id

  return (
    <div className={`bg-bg-paper rounded-lg border p-4 ${comment.isResolved ? 'opacity-75' : ''}`}>
      {/* 评论头部 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {comment.authorName.charAt(0)}
          </div>
          
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-text-primary">{comment.authorName}</span>
              {comment.isResolved && (
                <CheckCircle className="w-4 h-4 text-green-500" title="已解决" />
              )}
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{formatTime(comment.createdAt)}</span>
              {(() => {
                const updatedAt = typeof comment.updatedAt === 'string' ? new Date(comment.updatedAt) : comment.updatedAt
                const createdAt = typeof comment.createdAt === 'string' ? new Date(comment.createdAt) : comment.createdAt
                return updatedAt && createdAt && updatedAt.getTime() > createdAt.getTime()
              })() && (
                <span className="text-gray-400">（已编辑）</span>
              )}
            </div>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1 text-gray-400 hover:text-text-secondary rounded"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showActions && (
            <div className="absolute right-0 top-8 bg-bg-paper border border-gray-200 rounded-lg shadow-lg py-1 z-10 w-32">
              <button
                onClick={() => {
                  setReplyingTo(comment.id)
                  setShowActions(false)
                }}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-text-primary hover:bg-gray-100 w-full"
              >
                <Reply className="w-4 h-4" />
                <span>回复</span>
              </button>
              
              {isAuthor && (
                <>
                  <button
                    onClick={() => {
                      setEditingComment(comment.id)
                      setShowActions(false)
                    }}
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-text-primary hover:bg-gray-100 w-full"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>编辑</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      onDelete(comment.id)
                      setShowActions(false)
                    }}
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>删除</span>
                  </button>
                </>
              )}
              
              <button
                onClick={() => {
                  onToggleResolution(comment.id)
                  setShowActions(false)
                }}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-text-primary hover:bg-gray-100 w-full"
              >
                {comment.isResolved ? (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    <span>重新打开</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>标记已解决</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 评论内容 */}
      <div className="mb-3">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="input w-full resize-none"
              rows={3}
            />
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  onEdit(comment.id, editContent)
                  setEditingComment(null)
                }}
                className="btn-primary"
                disabled={!editContent.trim()}
              >
                保存
              </button>
              <button
                onClick={() => {
                  setEditingComment(null)
                  setEditContent(comment.content)
                }}
                className="btn-outline"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <div className="text-text-primary whitespace-pre-wrap">{comment.content}</div>
        )}
      </div>

      {/* 回复输入 */}
      {replyingTo === comment.id && (
        <div className="mt-4 ml-8 bg-bg-secondary rounded-lg p-3">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="写下你的回复..."
            className="input w-full resize-none"
            rows={2}
            autoFocus
          />
          <div className="flex items-center space-x-2 mt-2">
            <button
              onClick={() => {
                onReply(replyContent)
                setReplyContent('')
              }}
              disabled={!replyContent.trim()}
              className="btn-primary"
            >
              回复
            </button>
            <button
              onClick={() => {
                setReplyingTo(null)
                setReplyContent('')
              }}
              className="btn-outline"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 回复列表 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 ml-8 space-y-3">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="bg-bg-secondary rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-medium">
                    {reply.authorName.charAt(0)}
                  </div>
                  <span className="font-medium text-text-primary text-sm">{reply.authorName}</span>
                  <span className="text-xs text-gray-500">{formatTime(reply.createdAt)}</span>
                </div>
                
                {reply.authorId === currentUserId && (
                  <button
                    onClick={() => onDelete(reply.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="text-text-primary text-sm whitespace-pre-wrap">{reply.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CollaborationPanel