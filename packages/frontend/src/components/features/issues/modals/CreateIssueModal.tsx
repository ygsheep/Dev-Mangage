import React, { useState } from 'react'
import {
  CreateIssueData,
  ISSUE_PRIORITY_LABELS,
  ISSUE_TYPE_LABELS,
  IssuePriority,
  IssueSeverity,
  IssueType,
} from '../../../../types'
import { createIssue } from '../../../../utils/api'
import MarkdownEditor from '../../../common/MarkdownEditor'
import IssueRelationManager from '../IssueRelationManager'

interface CreateIssueModalProps {
  projectId: string
  onClose: () => void
  onSuccess: () => void
}

export const CreateIssueModal: React.FC<CreateIssueModalProps> = ({
  projectId,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<CreateIssueData>({
    title: '',
    description: '',
    priority: IssuePriority.MEDIUM,
    severity: IssueSeverity.NORMAL,
    issueType: IssueType.BUG,
    assigneeName: '',
    dueDate: '',
    estimatedHours: undefined,
    storyPoints: undefined,
    labels: [],
    relatedAPIs: [],
    relatedTables: [],
    relatedFeatures: [],
  })

  // 标签输入状态
  const [labelInput, setLabelInput] = useState('')

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      setError('请输入 Issue 标题')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await createIssue(projectId, formData)

      if (response.success) {
        onSuccess()
      } else {
        setError(response.message || '创建 Issue 失败')
      }
    } catch (err: any) {
      console.error('创建 Issue 失败:', err)
      setError(err.message || '创建 Issue 失败')
    } finally {
      setLoading(false)
    }
  }

  // 处理输入变化
  const handleInputChange = (field: keyof CreateIssueData, value: any) => {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-paper rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-6 border-b border-border-primary bg-bg-tertiary">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">创建新 Issue</h2>
            <p className="text-sm text-text-secondary mt-1">
              填写 Issue 详情并支持 Markdown 格式描述
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary transition-colors rounded-lg p-2 hover:bg-bg-paper"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <form id="create-issue-form" onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 左侧：基本信息 */}
              <div className="lg:col-span-2 space-y-6">
                <h3 className="text-lg font-medium text-text-primary mb-4 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  基本信息
                </h3>

                {/* 标题 */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    标题 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-border-primary bg-bg-elevated text-text-primary placeholder-text-tertiary rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="描述这个 Issue..."
                  />
                </div>

                {/* 描述 - Markdown 编辑器 */}
                <MarkdownEditor
                  label="描述"
                  value={formData.description}
                  onChange={value => handleInputChange('description', value)}
                  rows={8}
                  placeholder="详细描述这个 Issue..."
                  helpText="支持 Markdown 语法，可描述问题、重现步骤、期望结果等"
                />

                {/* 类型和优先级 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      类型
                    </label>
                    <select
                      value={formData.issueType}
                      onChange={e => handleInputChange('issueType', e.target.value as IssueType)}
                      className="w-full px-3 py-2 border border-border-primary bg-bg-elevated text-text-primary rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      {Object.entries(ISSUE_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      优先级
                    </label>
                    <select
                      value={formData.priority}
                      onChange={e => handleInputChange('priority', e.target.value as IssuePriority)}
                      className="w-full px-3 py-2 border border-border-primary bg-bg-elevated text-text-primary rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      {Object.entries(ISSUE_PRIORITY_LABELS).map(([value, label]) => (
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
                      className="w-full px-3 py-2 border border-border-primary bg-bg-elevated text-text-primary placeholder-text-tertiary rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                      className="w-full px-3 py-2 border border-border-primary bg-bg-elevated text-text-primary rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                      className="w-full px-3 py-2 border border-border-primary bg-bg-elevated text-text-primary placeholder-text-tertiary rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                      className="w-full px-3 py-2 border border-border-primary bg-bg-elevated text-text-primary placeholder-text-tertiary rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="点数"
                    />
                  </div>
                </div>

                {/* 标签管理 */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">标签</label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={labelInput}
                      onChange={e => setLabelInput(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addLabel())}
                      className="flex-1 px-3 py-2 border border-border-primary bg-bg-elevated text-text-primary placeholder-text-tertiary rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="添加标签..."
                    />
                    <button
                      type="button"
                      onClick={addLabel}
                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      添加
                    </button>
                  </div>

                  {/* 标签列表 */}
                  {formData.labels && formData.labels.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.labels.map((label, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                        >
                          {label.name}
                          <button
                            type="button"
                            onClick={() => removeLabel(index)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 右侧：关联管理 */}
              <div className="space-y-6">
                <IssueRelationManager
                  projectId={projectId}
                  selectedAPIs={formData.relatedAPIs || []}
                  selectedTables={formData.relatedTables || []}
                  selectedFeatures={formData.relatedFeatures || []}
                  onAPIChange={relations => handleInputChange('relatedAPIs', relations)}
                  onTableChange={relations => handleInputChange('relatedTables', relations)}
                  onFeatureChange={relations => handleInputChange('relatedFeatures', relations)}
                  maxHeight="400px"
                  showSearch={true}
                />
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="col-span-full mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* 底部按钮栏 */}
        <div className="flex justify-end space-x-3 p-6 bg-bg-tertiary border-t border-border-primary">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-text-secondary bg-bg-paper border border-border-primary rounded-md hover:bg-bg-tertiary transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            form="create-issue-form"
            disabled={loading || !formData.title.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <span>{loading ? '创建中...' : '创建 Issue'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
