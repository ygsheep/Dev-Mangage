import React, { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Eye,
  EyeOff,
  Settings,
  Database,
  Zap,
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  Save,
  RotateCcw
} from 'lucide-react'
import { DatabaseTable, DatabaseField, DatabaseIndex } from '@shared/types'
import { toast } from 'react-hot-toast'

interface CompositeIndexEditorProps {
  isOpen: boolean
  table: DatabaseTable
  existingIndex?: DatabaseIndex
  onClose: () => void
  onSave: (indexData: Omit<DatabaseIndex, 'id'>) => void
  onUpdate?: (indexId: string, updates: Partial<DatabaseIndex>) => void
}

interface IndexField {
  fieldId: string
  fieldName: string
  fieldType: string
  order: 'ASC' | 'DESC'
  length?: number
  visible: boolean
}

interface IndexValidation {
  isValid: boolean
  warnings: string[]
  errors: string[]
  suggestions: string[]
}

const CompositeIndexEditor: React.FC<CompositeIndexEditorProps> = ({
  isOpen,
  table,
  existingIndex,
  onClose,
  onSave,
  onUpdate
}) => {
  const [indexName, setIndexName] = useState('')
  const [indexType, setIndexType] = useState<'BTREE' | 'HASH' | 'FULLTEXT'>('BTREE')
  const [isUnique, setIsUnique] = useState(false)
  const [indexFields, setIndexFields] = useState<IndexField[]>([])
  const [comment, setComment] = useState('')
  const [validation, setValidation] = useState<IndexValidation>({
    isValid: true,
    warnings: [],
    errors: [],
    suggestions: []
  })
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const availableFields = table.fields || []
  const isEditMode = !!existingIndex

  // 初始化编辑模式
  useEffect(() => {
    if (existingIndex) {
      setIndexName(existingIndex.name)
      setIndexType(existingIndex.type as any || 'BTREE')
      setIsUnique(existingIndex.isUnique || false)
      setComment(existingIndex.comment || '')
      
      // 转换现有字段
      const fields: IndexField[] = existingIndex.fields.map(fieldName => {
        const field = availableFields.find(f => f.name === fieldName)
        return {
          fieldId: field?.id || fieldName,
          fieldName,
          fieldType: field?.type || 'VARCHAR',
          order: 'ASC',
          visible: true
        }
      })
      setIndexFields(fields)
    } else {
      // 重置为新建模式
      setIndexName(`idx_${table.name}_`)
      setIndexType('BTREE')
      setIsUnique(false)
      setIndexFields([])
      setComment('')
    }
  }, [existingIndex, table, availableFields])

  // 验证索引配置
  const validateIndex = useCallback(() => {
    const warnings: string[] = []
    const errors: string[] = []
    const suggestions: string[] = []

    // 基础验证
    if (!indexName.trim()) {
      errors.push('索引名称不能为空')
    }

    if (indexFields.length === 0) {
      errors.push('至少需要选择一个字段')
    }

    if (indexFields.length > 16) {
      warnings.push('MySQL建议复合索引不超过16个字段')
    }

    // 字段顺序验证
    const visibleFields = indexFields.filter(f => f.visible)
    if (visibleFields.length !== indexFields.length) {
      warnings.push('包含隐藏字段，请确认字段配置')
    }

    // 类型兼容性检查
    if (indexType === 'HASH' && indexFields.length > 1) {
      warnings.push('HASH索引不支持范围查询，请考虑使用BTREE')
    }

    if (indexType === 'FULLTEXT') {
      const nonTextFields = indexFields.filter(f => 
        !['VARCHAR', 'TEXT', 'LONGTEXT'].includes(f.fieldType.toUpperCase())
      )
      if (nonTextFields.length > 0) {
        errors.push('FULLTEXT索引只能用于文本字段')
      }
    }

    // 唯一性检查
    if (isUnique && indexFields.length > 1) {
      suggestions.push('复合唯一索引将约束所有字段组合的唯一性')
    }

    // 字段顺序建议
    if (indexFields.length > 1) {
      suggestions.push('建议将选择性高的字段放在前面，以提高查询效率')
    }

    // 重复索引检查
    const existingIndexes = table.indexes || []
    const duplicateIndex = existingIndexes.find(idx => 
      idx.id !== existingIndex?.id && 
      idx.fields.length === indexFields.length &&
      idx.fields.every((field, i) => field === indexFields[i]?.fieldName)
    )
    
    if (duplicateIndex) {
      errors.push(`与现有索引 "${duplicateIndex.name}" 重复`)
    }

    setValidation({
      isValid: errors.length === 0,
      warnings,
      errors,
      suggestions
    })
  }, [indexName, indexFields, indexType, isUnique, table.indexes, existingIndex])

  // 实时验证
  useEffect(() => {
    validateIndex()
  }, [validateIndex])

  // 添加字段
  const addField = (fieldId: string) => {
    const field = availableFields.find(f => f.id === fieldId)
    if (!field) return

    // 检查是否已添加
    if (indexFields.some(f => f.fieldId === fieldId)) {
      toast.error('字段已存在于索引中')
      return
    }

    const newIndexField: IndexField = {
      fieldId: field.id,
      fieldName: field.name,
      fieldType: field.type,
      order: 'ASC',
      visible: true
    }

    setIndexFields(prev => [...prev, newIndexField])
  }

  // 移除字段
  const removeField = (index: number) => {
    setIndexFields(prev => prev.filter((_, i) => i !== index))
  }

  // 字段排序
  const moveField = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return

    setIndexFields(prev => {
      const newFields = [...prev]
      const [movedField] = newFields.splice(fromIndex, 1)
      newFields.splice(toIndex, 0, movedField)
      return newFields
    })
  }

  // 更新字段属性
  const updateField = (index: number, updates: Partial<IndexField>) => {
    setIndexFields(prev => prev.map((field, i) => 
      i === index ? { ...field, ...updates } : field
    ))
  }

  // 拖拽处理
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      moveField(draggedIndex, targetIndex)
      setDraggedIndex(targetIndex)
    }
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  // 保存索引
  const handleSave = () => {
    if (!validation.isValid) {
      toast.error('请修复验证错误后再保存')
      return
    }

    const indexData: Omit<DatabaseIndex, 'id'> = {
      name: indexName.trim(),
      fields: indexFields.filter(f => f.visible).map(f => f.fieldName),
      type: indexType,
      isUnique,
      comment: comment.trim(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    if (isEditMode && onUpdate && existingIndex) {
      onUpdate(existingIndex.id, indexData)
      toast.success('索引已更新')
    } else {
      onSave(indexData)
      toast.success('索引已创建')
    }

    onClose()
  }

  // 重置表单
  const handleReset = () => {
    if (existingIndex) {
      setIndexName(existingIndex.name)
      setIndexType(existingIndex.type as any || 'BTREE')
      setIsUnique(existingIndex.isUnique || false)
      setComment(existingIndex.comment || '')
    } else {
      setIndexName(`idx_${table.name}_`)
      setIndexType('BTREE')
      setIsUnique(false)
      setComment('')
    }
    setIndexFields([])
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-header">
          <div className="flex items-center space-x-3">
            <Database className="w-8 h-8 text-blue-500" />
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                {isEditMode ? '编辑复合索引' : '创建复合索引'}
              </h2>
              <p className="text-text-secondary">
                表: {table.displayName || table.name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="btn-outline flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>高级选项</span>
            </button>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden flex">
          {/* 左侧配置面板 */}
          <div className="w-1/3 border-r border-gray-200 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* 基础配置 */}
              <div>
                <h3 className="text-lg font-medium text-text-primary mb-4">基础配置</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      索引名称 *
                    </label>
                    <input
                      type="text"
                      value={indexName}
                      onChange={(e) => setIndexName(e.target.value)}
                      className="input w-full"
                      placeholder="如: idx_user_name_email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      索引类型
                    </label>
                    <select
                      value={indexType}
                      onChange={(e) => setIndexType(e.target.value as any)}
                      className="input w-full"
                    >
                      <option value="BTREE">BTREE (默认)</option>
                      <option value="HASH">HASH (等值查询)</option>
                      <option value="FULLTEXT">FULLTEXT (全文搜索)</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={isUnique}
                        onChange={(e) => setIsUnique(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">唯一索引</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 高级选项 */}
              {showAdvanced && (
                <div>
                  <h3 className="text-lg font-medium text-text-primary mb-4">高级选项</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      索引注释
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="input w-full"
                      rows={3}
                      placeholder="描述索引用途和优化目标..."
                    />
                  </div>
                </div>
              )}

              {/* 可用字段 */}
              <div>
                <h3 className="text-lg font-medium text-text-primary mb-4">可用字段</h3>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableFields.map(field => {
                    const isAdded = indexFields.some(f => f.fieldId === field.id)
                    return (
                      <div
                        key={field.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          isAdded 
                            ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                        onClick={() => !isAdded && addField(field.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm text-text-primary">
                              {field.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {field.type}{field.length && `(${field.length})`}
                            </div>
                          </div>
                          {isAdded && <CheckCircle className="w-4 h-4 text-green-500" />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 右侧字段编辑器 */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* 字段列表 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-text-primary">
                    索引字段 ({indexFields.filter(f => f.visible).length})
                  </h3>
                  {indexFields.length > 0 && (
                    <div className="text-sm text-text-secondary">
                      拖拽调整字段顺序
                    </div>
                  )}
                </div>

                {indexFields.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
                    <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-text-primary mb-2">
                      暂无索引字段
                    </h4>
                    <p className="text-text-secondary">
                      从左侧选择字段添加到索引中
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {indexFields.map((field, index) => (
                      <div
                        key={field.fieldId}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`p-4 border border-gray-200 rounded-lg bg-white transition-all ${
                          draggedIndex === index ? 'opacity-50' : ''
                        } ${!field.visible ? 'opacity-60' : ''}`}
                      >
                        <div className="flex items-center space-x-3">
                          <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium text-text-primary">
                                {index + 1}. {field.fieldName}
                              </span>
                              <span className="px-2 py-1 bg-gray-100 text-text-secondary text-xs rounded">
                                {field.fieldType}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <label className="text-sm text-text-secondary">排序:</label>
                                <select
                                  value={field.order}
                                  onChange={(e) => updateField(index, { order: e.target.value as 'ASC' | 'DESC' })}
                                  className="text-sm border border-gray-300 rounded px-2 py-1"
                                >
                                  <option value="ASC">升序 (ASC)</option>
                                  <option value="DESC">降序 (DESC)</option>
                                </select>
                              </div>
                              
                              {field.fieldType.includes('VARCHAR') && (
                                <div className="flex items-center space-x-2">
                                  <label className="text-sm text-text-secondary">前缀长度:</label>
                                  <input
                                    type="number"
                                    value={field.length || ''}
                                    onChange={(e) => updateField(index, { 
                                      length: e.target.value ? parseInt(e.target.value) : undefined 
                                    })}
                                    className="text-sm border border-gray-300 rounded px-2 py-1 w-16"
                                    placeholder="可选"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateField(index, { visible: !field.visible })}
                              className="p-1 text-gray-400 hover:text-text-secondary"
                              title={field.visible ? '隐藏字段' : '显示字段'}
                            >
                              {field.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                            
                            <button
                              onClick={() => removeField(index)}
                              className="p-1 text-red-400 hover:text-red-600"
                              title="移除字段"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 验证结果 */}
              {(validation.errors.length > 0 || validation.warnings.length > 0 || validation.suggestions.length > 0) && (
                <div className="space-y-3">
                  {validation.errors.length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <h4 className="font-medium text-red-900">错误</h4>
                      </div>
                      <ul className="space-y-1">
                        {validation.errors.map((error, index) => (
                          <li key={index} className="text-sm text-red-700">• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {validation.warnings.length > 0 && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        <h4 className="font-medium text-yellow-900">警告</h4>
                      </div>
                      <ul className="space-y-1">
                        {validation.warnings.map((warning, index) => (
                          <li key={index} className="text-sm text-yellow-700">• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {validation.suggestions.length > 0 && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Info className="w-5 h-5 text-blue-600" />
                        <h4 className="font-medium text-blue-900">建议</h4>
                      </div>
                      <ul className="space-y-1">
                        {validation.suggestions.map((suggestion, index) => (
                          <li key={index} className="text-sm text-blue-700">• {suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleReset}
                className="btn-outline flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>重置</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="btn-outline"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!validation.isValid}
                className="btn-primary flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{isEditMode ? '更新索引' : '创建索引'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompositeIndexEditor