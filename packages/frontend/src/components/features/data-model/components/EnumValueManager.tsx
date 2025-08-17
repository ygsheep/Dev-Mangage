import React, { useState, useMemo } from 'react'
import {
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  ArrowUp,
  ArrowDown,
  Search,
  Star,
  StarOff,
  Copy,
  List,
  Type,
  Hash,
  FileText,
  CheckCircle,
  AlertTriangle,
  Filter,
  MoreVertical,
  GripVertical
} from 'lucide-react'
import { DatabaseField, FieldEnumValue } from '@shared/types'

interface EnumValueManagerProps {
  fieldId: string
  field?: DatabaseField
  enumValues: FieldEnumValue[]
  onEnumValueCreate: (data: Omit<FieldEnumValue, 'id'>) => void
  onEnumValueUpdate: (enumValueId: string, updates: Partial<FieldEnumValue>) => void
  onEnumValueDelete: (enumValueId: string) => void
  onEnumValueReorder: (enumValueIds: string[]) => void
  onBatchCreate: (values: Omit<FieldEnumValue, 'id'>[]) => void
  readonly?: boolean
}

interface EditingValue {
  id: string
  value: string
  label: string
  description: string
  isDefault: boolean
}

const EnumValueManager: React.FC<EnumValueManagerProps> = ({
  fieldId,
  field,
  enumValues,
  onEnumValueCreate,
  onEnumValueUpdate,
  onEnumValueDelete,
  onEnumValueReorder,
  onBatchCreate,
  readonly = false
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingValue, setEditingValue] = useState<EditingValue | null>(null)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [sortBy, setSortBy] = useState<'sortOrder' | 'value' | 'createdAt'>('sortOrder')
  const [filterType, setFilterType] = useState<'ALL' | 'DEFAULT' | 'NORMAL'>('ALL')
  const [newValue, setNewValue] = useState({
    value: '',
    label: '',
    description: '',
    isDefault: false
  })

  // 排序和过滤枚举值
  const filteredAndSortedValues = useMemo(() => {
    let filtered = enumValues

    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(enumValue =>
        enumValue.value.toLowerCase().includes(query) ||
        enumValue.label?.toLowerCase().includes(query) ||
        enumValue.description?.toLowerCase().includes(query)
      )
    }

    // 类型过滤
    if (filterType === 'DEFAULT') {
      filtered = filtered.filter(enumValue => enumValue.isDefault)
    } else if (filterType === 'NORMAL') {
      filtered = filtered.filter(enumValue => !enumValue.isDefault)
    }

    // 排序
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'sortOrder':
          return a.sortOrder - b.sortOrder
        case 'value':
          return a.value.localeCompare(b.value)
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default:
          return 0
      }
    })

    return sorted
  }, [enumValues, searchQuery, filterType, sortBy])

  // 枚举值统计
  const enumStats = useMemo(() => {
    return {
      total: enumValues.length,
      defaults: enumValues.filter(v => v.isDefault).length,
      withDescriptions: enumValues.filter(v => v.description).length
    }
  }, [enumValues])

  const handleAddValue = () => {
    const maxSortOrder = Math.max(...enumValues.map(v => v.sortOrder), -1)
    onEnumValueCreate({
      fieldId,
      value: newValue.value,
      label: newValue.label || newValue.value,
      description: newValue.description,
      isDefault: newValue.isDefault,
      sortOrder: maxSortOrder + 1
    })

    setNewValue({
      value: '',
      label: '',
      description: '',
      isDefault: false
    })
    setShowAddForm(false)
  }

  const handleEditValue = (enumValue: FieldEnumValue) => {
    setEditingValue({
      id: enumValue.id,
      value: enumValue.value,
      label: enumValue.label || '',
      description: enumValue.description || '',
      isDefault: enumValue.isDefault
    })
  }

  const handleSaveEdit = () => {
    if (editingValue) {
      onEnumValueUpdate(editingValue.id, {
        value: editingValue.value,
        label: editingValue.label || editingValue.value,
        description: editingValue.description,
        isDefault: editingValue.isDefault
      })
      setEditingValue(null)
    }
  }

  const handleMoveValue = (enumValueId: string, direction: 'up' | 'down') => {
    const sortedValues = [...enumValues].sort((a, b) => a.sortOrder - b.sortOrder)
    const currentIndex = sortedValues.findIndex(v => v.id === enumValueId)
    
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= sortedValues.length) return

    // 交换位置
    const newOrder = [...sortedValues]
    const temp = newOrder[currentIndex].sortOrder
    newOrder[currentIndex].sortOrder = newOrder[newIndex].sortOrder
    newOrder[newIndex].sortOrder = temp

    // 更新排序
    onEnumValueUpdate(newOrder[currentIndex].id, { sortOrder: newOrder[currentIndex].sortOrder })
    onEnumValueUpdate(newOrder[newIndex].id, { sortOrder: newOrder[newIndex].sortOrder })
  }

  const handleSetDefault = (enumValueId: string, isDefault: boolean) => {
    if (isDefault) {
      // 如果设为默认值，先取消其他默认值
      enumValues.forEach(v => {
        if (v.isDefault && v.id !== enumValueId) {
          onEnumValueUpdate(v.id, { isDefault: false })
        }
      })
    }
    onEnumValueUpdate(enumValueId, { isDefault })
  }

  const handleDuplicateValue = (enumValue: FieldEnumValue) => {
    const maxSortOrder = Math.max(...enumValues.map(v => v.sortOrder), -1)
    onEnumValueCreate({
      fieldId,
      value: `${enumValue.value}_copy`,
      label: `${enumValue.label || enumValue.value} (副本)`,
      description: enumValue.description,
      isDefault: false,
      sortOrder: maxSortOrder + 1
    })
  }

  const validateValue = (value: string): string[] => {
    const errors: string[] = []
    
    if (!value.trim()) {
      errors.push('值不能为空')
    }
    
    if (enumValues.some(v => v.value === value && v.id !== editingValue?.id)) {
      errors.push('值已存在')
    }
    
    if (value.length > 255) {
      errors.push('值长度不能超过255字符')
    }

    return errors
  }

  return (
    <div className="space-y-6">
      {/* 字段信息和统计 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Type className="w-6 h-6 text-text-secondary" />
            <div>
              <h2 className="text-lg font-medium text-text-primary">
                枚举值管理 - {field?.name || '字段'}
              </h2>
              <p className="text-sm text-text-secondary">
                管理字段的可选值和默认值设置
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-text-primary">{enumStats.total}</div>
                <div className="text-xs text-text-secondary">总数</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{enumStats.defaults}</div>
                <div className="text-xs text-text-secondary">默认值</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{enumStats.withDescriptions}</div>
                <div className="text-xs text-text-secondary">有描述</div>
              </div>
            </div>
          </div>
        </div>

        {field && (
          <div className="flex items-center space-x-4 text-sm text-text-secondary">
            <span>字段类型: {field.type}</span>
            <span>表: {field.table?.name}</span>
            {field.nullable && <span className="text-amber-600">可为空</span>}
            {field.isUnique && <span className="text-blue-600">唯一约束</span>}
          </div>
        )}
      </div>

      {/* 工具栏 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索枚举值..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 w-64"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="input w-auto"
            >
              <option value="sortOrder">排序</option>
              <option value="value">值</option>
              <option value="createdAt">创建时间</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="input w-auto"
            >
              <option value="ALL">所有</option>
              <option value="DEFAULT">默认值</option>
              <option value="NORMAL">普通值</option>
            </select>
          </div>

          {!readonly && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowBatchModal(true)}
                className="btn-outline flex items-center space-x-2"
              >
                <List className="w-4 h-4" />
                <span>批量导入</span>
              </button>
              
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>添加枚举值</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 添加表单 */}
      {showAddForm && !readonly && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-medium text-text-primary mb-4">添加新枚举值</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                值 *
              </label>
              <input
                type="text"
                value={newValue.value}
                onChange={(e) => setNewValue({ ...newValue, value: e.target.value })}
                className="input w-full"
                placeholder="枚举值"
                required
              />
              {validateValue(newValue.value).map((error, index) => (
                <p key={index} className="text-red-600 text-xs mt-1">{error}</p>
              ))}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                显示标签
              </label>
              <input
                type="text"
                value={newValue.label}
                onChange={(e) => setNewValue({ ...newValue, label: e.target.value })}
                className="input w-full"
                placeholder="显示给用户的标签"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              描述
            </label>
            <textarea
              value={newValue.description}
              onChange={(e) => setNewValue({ ...newValue, description: e.target.value })}
              className="input w-full"
              rows={2}
              placeholder="描述此枚举值的含义和用途"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={newValue.isDefault}
                onChange={(e) => setNewValue({ ...newValue, isDefault: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">设为默认值</span>
            </label>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="btn-outline"
              >
                取消
              </button>
              <button
                onClick={handleAddValue}
                disabled={!newValue.value || validateValue(newValue.value).length > 0}
                className="btn-primary"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 枚举值列表 */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-text-primary">
            枚举值列表 ({filteredAndSortedValues.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  排序
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  值
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  显示标签
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  描述
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                {!readonly && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedValues.map((enumValue, index) => (
                <tr key={enumValue.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                      <span className="text-sm text-text-secondary">{enumValue.sortOrder}</span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingValue?.id === enumValue.id ? (
                      <input
                        type="text"
                        value={editingValue.value}
                        onChange={(e) => setEditingValue({ ...editingValue, value: e.target.value })}
                        className="input w-full text-sm"
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                          {enumValue.value}
                        </code>
                        {enumValue.isDefault && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingValue?.id === enumValue.id ? (
                      <input
                        type="text"
                        value={editingValue.label}
                        onChange={(e) => setEditingValue({ ...editingValue, label: e.target.value })}
                        className="input w-full text-sm"
                      />
                    ) : (
                      <span className="text-sm text-text-primary">
                        {enumValue.label || enumValue.value}
                      </span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4">
                    {editingValue?.id === enumValue.id ? (
                      <textarea
                        value={editingValue.description}
                        onChange={(e) => setEditingValue({ ...editingValue, description: e.target.value })}
                        className="input w-full text-sm"
                        rows={2}
                      />
                    ) : (
                      <span className="text-sm text-text-secondary max-w-xs truncate">
                        {enumValue.description || '-'}
                      </span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {enumValue.isDefault ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Star className="w-3 h-3 mr-1" />
                          默认值
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          普通值
                        </span>
                      )}
                    </div>
                  </td>
                  
                  {!readonly && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingValue?.id === enumValue.id ? (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={handleSaveEdit}
                            className="text-green-600 hover:text-green-900"
                            title="保存"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingValue(null)}
                            className="text-text-secondary hover:text-text-primary"
                            title="取消"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleMoveValue(enumValue.id, 'up')}
                            disabled={index === 0}
                            className={`${index === 0 ? 'text-gray-300' : 'text-text-secondary hover:text-text-primary'}`}
                            title="上移"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleMoveValue(enumValue.id, 'down')}
                            disabled={index === filteredAndSortedValues.length - 1}
                            className={`${index === filteredAndSortedValues.length - 1 ? 'text-gray-300' : 'text-text-secondary hover:text-text-primary'}`}
                            title="下移"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleSetDefault(enumValue.id, !enumValue.isDefault)}
                            className={enumValue.isDefault ? 'text-yellow-600 hover:text-yellow-900' : 'text-text-secondary hover:text-text-primary'}
                            title={enumValue.isDefault ? '取消默认' : '设为默认'}
                          >
                            {enumValue.isDefault ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                          </button>
                          
                          <button
                            onClick={() => handleEditValue(enumValue)}
                            className="text-blue-600 hover:text-blue-900"
                            title="编辑"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDuplicateValue(enumValue)}
                            className="text-text-secondary hover:text-text-primary"
                            title="复制"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => onEnumValueDelete(enumValue.id)}
                            className="text-red-600 hover:text-red-900"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedValues.length === 0 && (
          <div className="text-center py-12">
            <List className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">
              {searchQuery || filterType !== 'ALL' ? '没有找到匹配的枚举值' : '暂无枚举值'}
            </h3>
            <p className="text-text-secondary mb-6">
              {searchQuery || filterType !== 'ALL'
                ? '请尝试调整搜索条件'
                : '为字段添加可选的枚举值'
              }
            </p>
            {!readonly && (
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-primary"
              >
                添加第一个枚举值
              </button>
            )}
          </div>
        )}
      </div>

      {/* 批量导入模态框 */}
      {showBatchModal && !readonly && (
        <BatchImportModal
          fieldId={fieldId}
          onClose={() => setShowBatchModal(false)}
          onSave={onBatchCreate}
        />
      )}
    </div>
  )
}

// 批量导入模态框
interface BatchImportModalProps {
  fieldId: string
  onClose: () => void
  onSave: (values: Omit<FieldEnumValue, 'id'>[]) => void
}

const BatchImportModal: React.FC<BatchImportModalProps> = ({ fieldId, onClose, onSave }) => {
  const [textInput, setTextInput] = useState('')
  const [separator, setSeparator] = useState('\n')
  const [hasLabels, setHasLabels] = useState(false)
  const [hasDescriptions, setHasDescriptions] = useState(false)

  const parseValues = (): Omit<FieldEnumValue, 'id'>[] => {
    const lines = textInput.split(separator).filter(line => line.trim())
    
    return lines.map((line, index) => {
      const parts = line.split('|').map(part => part.trim())
      
      return {
        fieldId,
        value: parts[0] || '',
        label: hasLabels && parts[1] ? parts[1] : parts[0] || '',
        description: hasDescriptions && parts[hasLabels ? 2 : 1] ? parts[hasLabels ? 2 : 1] : '',
        isDefault: false,
        sortOrder: index
      }
    })
  }

  const previewValues = useMemo(() => {
    try {
      return parseValues()
    } catch {
      return []
    }
  }, [textInput, separator, hasLabels, hasDescriptions])

  const handleImport = () => {
    const values = parseValues()
    if (values.length > 0 && values.every(v => v.value)) {
      onSave(values)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-text-primary">批量导入枚举值</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* 配置选项 */}
          <div className="space-y-4">
            <h3 className="font-medium text-text-primary">导入配置</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  分隔符
                </label>
                <select
                  value={separator}
                  onChange={(e) => setSeparator(e.target.value)}
                  className="input w-full"
                >
                  <option value="\n">换行符</option>
                  <option value=",">逗号</option>
                  <option value=";">分号</option>
                  <option value="\t">制表符</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={hasLabels}
                    onChange={(e) => setHasLabels(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">包含显示标签</span>
                </label>
              </div>
              
              <div className="flex items-center">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={hasDescriptions}
                    onChange={(e) => setHasDescriptions(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">包含描述</span>
                </label>
              </div>
            </div>

            <div className="text-sm text-text-secondary">
              <p>格式说明：</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>每行一个枚举值</li>
                {hasLabels && <li>使用 | 分隔值和标签：值|标签</li>}
                {hasDescriptions && <li>使用 | 分隔描述：值{hasLabels ? '|标签' : ''}|描述</li>}
              </ul>
            </div>
          </div>

          {/* 输入区域 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              枚举值数据
            </label>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="input w-full"
              rows={8}
              placeholder={
                hasLabels && hasDescriptions
                  ? "男|男性|表示男性用户\n女|女性|表示女性用户"
                  : hasLabels
                  ? "男|男性\n女|女性"
                  : "男\n女\n其他"
              }
            />
          </div>

          {/* 预览 */}
          {previewValues.length > 0 && (
            <div>
              <h3 className="font-medium text-text-primary mb-3">
                预览 ({previewValues.length} 项)
              </h3>
              
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">值</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">标签</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">描述</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewValues.map((value, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm">
                          <code className="px-2 py-1 bg-gray-100 rounded">{value.value}</code>
                        </td>
                        <td className="px-4 py-2 text-sm text-text-primary">{value.label}</td>
                        <td className="px-4 py-2 text-sm text-text-secondary">{value.description || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="btn-outline"
          >
            取消
          </button>
          <button
            onClick={handleImport}
            disabled={previewValues.length === 0 || !previewValues.every(v => v.value)}
            className="btn-primary"
          >
            导入 {previewValues.length} 项
          </button>
        </div>
      </div>
    </div>
  )
}

export default EnumValueManager