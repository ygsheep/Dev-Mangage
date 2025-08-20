import React, { useState } from 'react'
import {
  ISSUE_PRIORITY_LABELS,
  ISSUE_SEVERITY_LABELS,
  ISSUE_STATUS_LABELS,
  ISSUE_TYPE_LABELS,
  Issue,
  IssuePriority,
  IssueSeverity,
  IssueStatus,
  IssueType,
  UpdateIssueData,
} from '../../../../types'
import { updateIssue } from '../../../../utils/api'

interface IssueEditModalProps {
  issue: Issue
  projectId: string
  onClose: () => void
  onSuccess: (updatedIssue: Issue) => void
}

export const IssueEditModal: React.FC<IssueEditModalProps> = ({
  issue,
  projectId,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<UpdateIssueData>({
    title: issue.title,
    description: issue.description || '',
    status: issue.status,
    priority: issue.priority,
    severity: issue.severity,
    issueType: issue.issueType,
    assigneeName: issue.assigneeName || '',
    dueDate: issue.dueDate || '',
    estimatedHours: issue.estimatedHours,
    storyPoints: issue.storyPoints,
    labels: issue.labels || [],
  })

  // 标签输入状态
  const [labelInput, setLabelInput] = useState('')

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title?.trim()) {
      setError('请输入 Issue 标题')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await updateIssue(projectId, issue.id, formData)

      if (response.success) {
        onSuccess(response.data)
      } else {
        setError(response.message || '更新 Issue 失败')
      }
    } catch (err: any) {
      console.error('更新 Issue 失败:', err)
      setError(err.message || '更新 Issue 失败')
    } finally {
      setLoading(false)
    }
  }

  // 处理输入变化
  const handleInputChange = (field: keyof UpdateIssueData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // 添加标签
  const addLabel = () => {
    if (labelInput.trim() && !formData.labels?.find(l => l.name === labelInput.trim())) {
      const newLabel = {
        name: labelInput.trim(),
        color: '#3B82F6',
      }
      handleInputChange('labels', [...(formData.labels || []), newLabel])
      setLabelInput('')
    }
  }

  // 删除标签
  const removeLabel = (index: number) => {
    const newLabels = formData.labels?.filter((_, i) => i !== index) || []
    handleInputChange('labels', newLabels)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-bg-paper rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-text-primary">编辑 Issue #{issue.number}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-text-secondary transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左侧：基本信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-text-primary mb-4">基本信息</h3>

              {/* 标题 */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={e => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 bg-bg-secondary focus:outline-none rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Issue 标题..."
                />
              </div>

              {/* 描述 */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">描述</label>
                <textarea
                  value={formData.description || ''}
                  onChange={e => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 bg-bg-secondary focus:outline-none rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="详细描述这个 Issue..."
                />
              </div>

              {/* 状态和类型 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">状态</label>
                  <select
                    value={formData.status}
                    onChange={e => handleInputChange('status', e.target.value as IssueStatus)}
                    className="w-full px-3 py-2 border border-gray-300 bg-bg-secondary focus:outline-none rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(ISSUE_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">类型</label>
                  <select
                    value={formData.issueType}
                    onChange={e => handleInputChange('issueType', e.target.value as IssueType)}
                    className="w-full px-3 py-2 border border-gray-300 bg-bg-secondary focus:outline-none rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(ISSUE_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 优先级和严重程度 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    优先级
                  </label>
                  <select
                    value={formData.priority}
                    onChange={e => handleInputChange('priority', e.target.value as IssuePriority)}
                    className="w-full px-3 py-2 border border-gray-300 bg-bg-secondary focus:outline-none rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(ISSUE_PRIORITY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    严重程度
                  </label>
                  <select
                    value={formData.severity || IssueSeverity.NORMAL}
                    onChange={e => handleInputChange('severity', e.target.value as IssueSeverity)}
                    className="w-full px-3 py-2 border border-gray-300 bg-bg-secondary focus:outline-none rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(ISSUE_SEVERITY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 分配人和截止日期 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    分配给
                  </label>
                  <input
                    type="text"
                    value={formData.assigneeName || ''}
                    onChange={e => handleInputChange('assigneeName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 bg-bg-secondary focus:outline-none rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="用户名"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    截止日期
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate || ''}
                    onChange={e => handleInputChange('dueDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 bg-bg-secondary focus:outline-none rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 估算工时和故事点 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    预估工时
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.estimatedHours || ''}
                    onChange={e =>
                      handleInputChange(
                        'estimatedHours',
                        e.target.value ? parseFloat(e.target.value) : undefined
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 bg-bg-secondary focus:outline-none rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="小时"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    故事点
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.storyPoints || ''}
                    onChange={e =>
                      handleInputChange(
                        'storyPoints',
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 bg-bg-secondary focus:outline-none rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="点数"
                  />
                </div>
              </div>
            </div>

            {/* 右侧：标签管理 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-text-primary mb-4">标签管理</h3>

              {/* 标签输入 */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  添加标签
                </label>
                <div className="flex space-x-2 mb-4">
                  <input
                    type="text"
                    value={labelInput}
                    onChange={e => setLabelInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addLabel())}
                    className="flex-1 px-3 py-2 border border-gray-300 bg-bg-secondary focus:outline-none rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="标签名称..."
                  />
                  <button
                    type="button"
                    onClick={addLabel}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    添加
                  </button>
                </div>
              </div>

              {/* 当前标签列表 */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  当前标签
                </label>
                {formData.labels && formData.labels.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {formData.labels.map((label, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {label.name}
                        <button
                          type="button"
                          onClick={() => removeLabel(index)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic text-sm">暂无标签</p>
                )}
              </div>

              {/* GitHub 同步信息 */}
              {issue.githubId && (
                <div className="bg-bg-paper p-4 rounded-lg">
                  <h4 className="font-medium text-text-primary mb-2">GitHub 同步</h4>
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="text-text-secondary">GitHub ID:</span>
                      <span className="ml-2 font-mono">#{issue.githubId}</span>
                    </div>
                    {issue.githubUrl && (
                      <div>
                        <span className="text-text-secondary">链接:</span>
                        <a
                          href={issue.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-blue-600 hover:underline"
                        >
                          在 GitHub 中查看
                        </a>
                      </div>
                    )}
                    {issue.lastSyncAt && (
                      <div>
                        <span className="text-text-secondary">最后同步:</span>
                        <span className="ml-2">{new Date(issue.lastSyncAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">💡 修改后会在下次同步时更新到 GitHub</p>
                </div>
              )}

              {/* 变更历史摘要 */}
              <div className="bg-bg-paper p-4 rounded-lg">
                <h4 className="font-medium text-text-primary mb-2">变更信息</h4>
                <div className="text-sm space-y-1 text-text-secondary">
                  <div>创建时间: {new Date(issue.createdAt).toLocaleString()}</div>
                  <div>更新时间: {new Date(issue.updatedAt).toLocaleString()}</div>
                  {issue.resolvedAt && (
                    <div>解决时间: {new Date(issue.resolvedAt).toLocaleString()}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* 底部按钮 */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-text-secondary bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title?.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '更新中...' : '保存更改'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
