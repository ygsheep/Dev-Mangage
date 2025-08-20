import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  Edit3,
  FileText,
  GitBranch,
  GitCommit,
  GitCompare,
  Minus,
  Plus,
  RotateCcw,
  Tag,
  User,
  X,
} from 'lucide-react'
import React, { useMemo, useState } from 'react'

interface ModelVersion {
  id: string
  version: string
  name: string
  description: string
  createdBy: string
  createdAt: Date
  changes: ChangeRecord[]
  isActive: boolean
  tags: string[]
}

interface ChangeRecord {
  id: string
  type: 'CREATE' | 'UPDATE' | 'DELETE'
  entity: 'TABLE' | 'FIELD' | 'INDEX' | 'RELATIONSHIP'
  entityId: string
  entityName: string
  changes: FieldChange[]
  metadata?: any
}

interface FieldChange {
  field: string
  oldValue: any
  newValue: any
  changeType: 'added' | 'removed' | 'modified'
}

interface VersionControlProps {
  projectId: string
  versions: ModelVersion[]
  currentVersion: string
  onCreateVersion: (data: { name: string; description: string }) => void
  onRevertToVersion: (versionId: string) => void
  onTagVersion: (versionId: string, tag: string) => void
  onCompareVersions: (versionA: string, versionB: string) => void
}

const VersionControl: React.FC<VersionControlProps> = ({
  projectId,
  versions,
  currentVersion,
  onCreateVersion,
  onRevertToVersion,
  onTagVersion,
  onCompareVersions,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedVersions, setSelectedVersions] = useState<string[]>([])
  const [expandedChanges, setExpandedChanges] = useState<Set<string>>(new Set())
  const [showTagModal, setShowTagModal] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<'ALL' | 'CREATE' | 'UPDATE' | 'DELETE'>('ALL')

  const sortedVersions = useMemo(() => {
    return [...versions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [versions])

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'CREATE':
        return <Plus className="w-4 h-4 text-green-600" />
      case 'UPDATE':
        return <Edit3 className="w-4 h-4 text-blue-600" />
      case 'DELETE':
        return <Minus className="w-4 h-4 text-red-600" />
      default:
        return <FileText className="w-4 h-4 text-text-secondary" />
    }
  }

  const getChangeColor = (type: string) => {
    switch (type) {
      case 'CREATE':
        return 'bg-green-50 border-green-200'
      case 'UPDATE':
        return 'bg-primary-50 dark:bg-primary-900/20 border-blue-200'
      case 'DELETE':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-bg-secondary border-gray-200'
    }
  }

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case 'TABLE':
        return '🗂️'
      case 'FIELD':
        return '📝'
      case 'INDEX':
        return '🔍'
      case 'RELATIONSHIP':
        return '🔗'
      default:
        return '📄'
    }
  }

  const handleVersionSelect = (versionId: string) => {
    const newSelected = [...selectedVersions]
    const index = newSelected.indexOf(versionId)

    if (index > -1) {
      newSelected.splice(index, 1)
    } else if (newSelected.length < 2) {
      newSelected.push(versionId)
    } else {
      newSelected[1] = versionId
    }

    setSelectedVersions(newSelected)
  }

  const handleCompareVersions = () => {
    if (selectedVersions.length === 2) {
      onCompareVersions(selectedVersions[0], selectedVersions[1])
    }
  }

  const toggleChangeExpansion = (changeId: string) => {
    const newExpanded = new Set(expandedChanges)
    if (newExpanded.has(changeId)) {
      newExpanded.delete(changeId)
    } else {
      newExpanded.add(changeId)
    }
    setExpandedChanges(newExpanded)
  }

  const filteredChanges = (changes: ChangeRecord[]) => {
    if (filterType === 'ALL') return changes
    return changes.filter(change => change.type === filterType)
  }

  return (
    <div className="space-y-6">
      {/* 工具栏 */}
      <div className="bg-bg-paper rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <GitBranch className="w-6 h-6 text-text-secondary" />
            <div>
              <h2 className="text-lg font-medium text-text-primary">版本控制</h2>
              <p className="text-sm text-text-secondary">管理数据模型的版本历史和变更记录</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as any)}
              className="input w-auto"
            >
              <option value="ALL">所有变更</option>
              <option value="CREATE">新增</option>
              <option value="UPDATE">修改</option>
              <option value="DELETE">删除</option>
            </select>

            <button
              onClick={handleCompareVersions}
              disabled={selectedVersions.length !== 2}
              className={`btn-outline flex items-center space-x-2 ${
                selectedVersions.length !== 2 ? 'opacity-50' : ''
              }`}
            >
              <GitCompare className="w-4 h-4" />
              <span>对比版本</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Tag className="w-4 h-4" />
              <span>创建版本</span>
            </button>
          </div>
        </div>
      </div>

      {/* 版本时间线 */}
      <div className="bg-bg-paper rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-text-primary">版本历史 ({versions.length})</h3>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            {sortedVersions.map((version, index) => (
              <div key={version.id} className="relative">
                {/* 时间线连接线 */}
                {index < sortedVersions.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-full bg-gray-200" />
                )}

                <div className="flex items-start space-x-4">
                  {/* 版本图标 */}
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                      version.id === currentVersion
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-text-secondary'
                    }`}
                  >
                    {version.id === currentVersion ? (
                      <GitCommit className="w-6 h-6" />
                    ) : (
                      <GitBranch className="w-6 h-6" />
                    )}
                  </div>

                  {/* 版本信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="bg-bg-secondary rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedVersions.includes(version.id)}
                              onChange={() => handleVersionSelect(version.id)}
                              disabled={
                                selectedVersions.length >= 2 &&
                                !selectedVersions.includes(version.id)
                              }
                              className="rounded border-gray-300 bg-bg-secondary"
                            />
                            <h4 className="font-medium text-text-primary">{version.name}</h4>
                          </label>

                          <span className="px-2 py-1 bg-gray-200 text-text-primary text-xs rounded">
                            v{version.version}
                          </span>

                          {version.id === currentVersion && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                              当前版本
                            </span>
                          )}

                          {version.tags.map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setShowTagModal(version.id)}
                            className="p-1 hover:bg-gray-200 rounded"
                            title="添加标签"
                          >
                            <Tag className="w-4 h-4 text-gray-500" />
                          </button>

                          {version.id !== currentVersion && (
                            <button
                              onClick={() => onRevertToVersion(version.id)}
                              className="p-1 hover:bg-gray-200 rounded"
                              title="回滚到此版本"
                            >
                              <RotateCcw className="w-4 h-4 text-gray-500" />
                            </button>
                          )}

                          <button className="p-1 hover:bg-gray-200 rounded" title="下载版本">
                            <Download className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      </div>

                      <p className="text-text-secondary text-sm mb-3">{version.description}</p>

                      <div className="flex items-center space-x-4 text-xs text-gray-500 mb-4">
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{version.createdBy}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(version.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FileText className="w-3 h-3" />
                          <span>{version.changes.length} 项变更</span>
                        </div>
                      </div>

                      {/* 变更摘要 */}
                      {version.changes.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-text-primary text-sm">变更详情</h5>
                            <div className="flex items-center space-x-3 text-xs">
                              <span className="text-green-600">
                                +{version.changes.filter(c => c.type === 'CREATE').length}
                              </span>
                              <span className="text-blue-600">
                                ~{version.changes.filter(c => c.type === 'UPDATE').length}
                              </span>
                              <span className="text-red-600">
                                -{version.changes.filter(c => c.type === 'DELETE').length}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                            {filteredChanges(version.changes).map(change => (
                              <div
                                key={change.id}
                                className={`border rounded-lg p-3 ${getChangeColor(change.type)}`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    {getChangeIcon(change.type)}
                                    <span className="text-sm">{getEntityIcon(change.entity)}</span>
                                    <span className="font-medium text-sm">
                                      {change.type} {change.entity}
                                    </span>
                                    <span className="text-sm text-text-secondary">
                                      {change.entityName}
                                    </span>
                                  </div>

                                  <button
                                    onClick={() => toggleChangeExpansion(change.id)}
                                    className="p-1 hover:bg-bg-paper/50 rounded"
                                  >
                                    {expandedChanges.has(change.id) ? (
                                      <ChevronDown className="w-4 h-4" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>

                                {expandedChanges.has(change.id) && (
                                  <div className="mt-3 pt-3 border-t border-current/20">
                                    <div className="space-y-2">
                                      {change.changes.map((fieldChange, idx) => (
                                        <div
                                          key={idx}
                                          className="flex items-center space-x-2 text-xs"
                                        >
                                          <span className="font-medium text-text-primary">
                                            {fieldChange.field}:
                                          </span>

                                          {fieldChange.changeType === 'added' && (
                                            <span className="text-green-700">
                                              + {JSON.stringify(fieldChange.newValue)}
                                            </span>
                                          )}

                                          {fieldChange.changeType === 'removed' && (
                                            <span className="text-red-700">
                                              - {JSON.stringify(fieldChange.oldValue)}
                                            </span>
                                          )}

                                          {fieldChange.changeType === 'modified' && (
                                            <div className="flex items-center space-x-2">
                                              <span className="text-red-700 line-through">
                                                {JSON.stringify(fieldChange.oldValue)}
                                              </span>
                                              <ArrowRight className="w-3 h-3 text-gray-500" />
                                              <span className="text-green-700">
                                                {JSON.stringify(fieldChange.newValue)}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {versions.length === 0 && (
            <div className="text-center py-12">
              <GitBranch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">暂无版本历史</h3>
              <p className="text-text-secondary mb-6">创建第一个版本来开始跟踪数据模型的变更</p>
              <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                创建初始版本
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 创建版本模态框 */}
      {showCreateModal && (
        <CreateVersionModal onClose={() => setShowCreateModal(false)} onSave={onCreateVersion} />
      )}

      {/* 添加标签模态框 */}
      {showTagModal && (
        <TagVersionModal
          versionId={showTagModal}
          onClose={() => setShowTagModal(null)}
          onSave={tag => {
            onTagVersion(showTagModal, tag)
            setShowTagModal(null)
          }}
        />
      )}
    </div>
  )
}

// 创建版本模态框
interface CreateVersionModalProps {
  onClose: () => void
  onSave: (data: { name: string; description: string }) => void
}

const CreateVersionModal: React.FC<CreateVersionModalProps> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-paper rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-text-primary">创建新版本</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">版本名称</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="input w-full"
              placeholder="例如: 初始版本, 用户模块优化"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">版本描述</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="input w-full"
              rows={4}
              placeholder="描述这个版本的主要变更和改进..."
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="btn-outline">
              取消
            </button>
            <button type="submit" className="btn-primary">
              创建版本
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 添加标签模态框
interface TagVersionModalProps {
  versionId: string
  onClose: () => void
  onSave: (tag: string) => void
}

const TagVersionModal: React.FC<TagVersionModalProps> = ({ versionId, onClose, onSave }) => {
  const [tag, setTag] = useState('')

  const predefinedTags = ['stable', 'beta', 'alpha', 'release', 'hotfix', 'feature', 'bugfix']

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (tag.trim()) {
      onSave(tag.trim())
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-paper rounded-lg shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-text-primary">添加标签</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">标签名称</label>
            <input
              type="text"
              value={tag}
              onChange={e => setTag(e.target.value)}
              className="input w-full"
              placeholder="输入标签名称"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">常用标签</label>
            <div className="flex flex-wrap gap-2">
              {predefinedTags.map(predefinedTag => (
                <button
                  key={predefinedTag}
                  type="button"
                  onClick={() => setTag(predefinedTag)}
                  className="px-2 py-1 bg-gray-100 text-text-primary text-xs rounded hover:bg-gray-200 transition-colors"
                >
                  {predefinedTag}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="btn-outline">
              取消
            </button>
            <button type="submit" className="btn-primary">
              添加标签
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default VersionControl
