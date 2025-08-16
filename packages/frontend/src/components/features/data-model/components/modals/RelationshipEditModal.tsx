import React, { useState, useEffect } from 'react'
import {
  X,
  Database,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Settings,
  Info,
  Trash2,
  Link
} from 'lucide-react'
import { DatabaseTable, TableRelationship, DatabaseField } from '@shared/types'
import { toast } from 'react-hot-toast'

interface RelationshipEditModalProps {
  isOpen: boolean
  relationship: Partial<TableRelationship> | null
  tables: DatabaseTable[]
  onClose: () => void
  onSave: (relationship: Omit<TableRelationship, 'id'>) => void
  onDelete?: (relationshipId: string) => void
  mode: 'create' | 'edit'
}

type RelationshipType = 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_MANY'
type CascadeAction = 'CASCADE' | 'SET_NULL' | 'RESTRICT' | 'NO_ACTION'

const RelationshipEditModal: React.FC<RelationshipEditModalProps> = ({
  isOpen,
  relationship,
  tables,
  onClose,
  onSave,
  onDelete,
  mode
}) => {
  const [formData, setFormData] = useState({
    name: '',
    fromTableId: '',
    toTableId: '',
    fromFieldId: '',
    toFieldId: '',
    relationshipType: 'ONE_TO_MANY' as RelationshipType,
    onUpdate: 'RESTRICT' as CascadeAction,
    onDelete: 'RESTRICT' as CascadeAction,
    comment: '',
    isEnforced: true,
    deferrable: false
  })

  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [bridgeTableName, setBridgeTableName] = useState('')

  useEffect(() => {
    if (relationship && mode === 'edit') {
      setFormData({
        name: relationship.name || '',
        fromTableId: relationship.fromTableId || '',
        toTableId: relationship.toTableId || '',
        fromFieldId: relationship.fromFieldId || '',
        toFieldId: relationship.toFieldId || '',
        relationshipType: (relationship.relationshipType as RelationshipType) || 'ONE_TO_MANY',
        onUpdate: (relationship.onUpdate as CascadeAction) || 'RESTRICT',
        onDelete: (relationship.onDelete as CascadeAction) || 'RESTRICT',
        comment: relationship.comment || '',
        isEnforced: true,
        deferrable: false
      })
    } else {
      // 重置表单为创建模式
      setFormData({
        name: '',
        fromTableId: '',
        toTableId: '',
        fromFieldId: '',
        toFieldId: '',
        relationshipType: 'ONE_TO_MANY',
        onUpdate: 'RESTRICT',
        onDelete: 'RESTRICT',
        comment: '',
        isEnforced: true,
        deferrable: false
      })
    }
  }, [relationship, mode, isOpen])

  // 获取可用字段
  const getAvailableFields = (tableId: string): DatabaseField[] => {
    const table = tables.find(t => t.id === tableId)
    return table?.fields || []
  }

  // 验证关系配置
  const validateRelationship = (): string[] => {
    const errors: string[] = []

    if (!formData.name.trim()) {
      errors.push('关系名称不能为空')
    }

    if (!formData.fromTableId) {
      errors.push('请选择源表')
    }

    if (!formData.toTableId) {
      errors.push('请选择目标表')
    }

    if (formData.fromTableId === formData.toTableId) {
      errors.push('源表和目标表不能相同')
    }

    if (!formData.fromFieldId) {
      errors.push('请选择源字段')
    }

    if (!formData.toFieldId) {
      errors.push('请选择目标字段')
    }

    // 类型兼容性检查
    if (formData.fromFieldId && formData.toFieldId) {
      const fromField = getAvailableFields(formData.fromTableId).find(f => f.id === formData.fromFieldId)
      const toField = getAvailableFields(formData.toTableId).find(f => f.id === formData.toFieldId)
      
      if (fromField && toField && fromField.type !== toField.type) {
        errors.push('源字段和目标字段类型不匹配')
      }
    }

    // 多对多关系需要中间表
    if (formData.relationshipType === 'MANY_TO_MANY' && !bridgeTableName.trim()) {
      errors.push('多对多关系需要指定中间表名称')
    }

    return errors
  }

  // 自动生成关系名称
  const generateRelationshipName = () => {
    if (formData.fromTableId && formData.toTableId) {
      const fromTable = tables.find(t => t.id === formData.fromTableId)
      const toTable = tables.find(t => t.id === formData.toTableId)
      
      if (fromTable && toTable) {
        const name = `fk_${fromTable.name}_${toTable.name}`
        setFormData(prev => ({ ...prev, name }))
      }
    }
  }

  // 自动生成中间表名称
  const generateBridgeTableName = () => {
    if (formData.fromTableId && formData.toTableId) {
      const fromTable = tables.find(t => t.id === formData.fromTableId)
      const toTable = tables.find(t => t.id === formData.toTableId)
      
      if (fromTable && toTable) {
        const name = `${fromTable.name}_${toTable.name}`
        setBridgeTableName(name)
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const errors = validateRelationship()
    setValidationErrors(errors)
    
    if (errors.length > 0) {
      toast.error('请修正表单错误')
      return
    }

    const relationshipData: Omit<TableRelationship, 'id'> = {
      projectId: tables[0]?.projectId || '',
      name: formData.name,
      fromTableId: formData.fromTableId,
      toTableId: formData.toTableId,
      fromFieldId: formData.fromFieldId,
      toFieldId: formData.toFieldId,
      relationshipType: formData.relationshipType,
      onUpdate: formData.onUpdate,
      onDelete: formData.onDelete,
      comment: formData.comment,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    onSave(relationshipData)
    
    // 如果是多对多关系，显示中间表创建提示
    if (formData.relationshipType === 'MANY_TO_MANY') {
      toast.success(`关系创建成功，建议创建中间表: ${bridgeTableName}`)
    } else {
      toast.success('关系创建成功')
    }
  }

  const handleDelete = () => {
    if (relationship?.id && onDelete) {
      if (window.confirm('确定要删除这个关系吗？此操作不可撤销。')) {
        onDelete(relationship.id)
        onClose()
      }
    }
  }

  if (!isOpen) return null

  const fromTable = tables.find(t => t.id === formData.fromTableId)
  const toTable = tables.find(t => t.id === formData.toTableId)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center space-x-3">
            <Link className="w-8 h-8 text-blue-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {mode === 'edit' ? '编辑关系' : '创建关系'}
              </h2>
              <p className="text-gray-600">管理表间的外键关系和约束行为</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {mode === 'edit' && relationship?.id && (
              <button
                onClick={handleDelete}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="删除关系"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[calc(90vh-80px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 基础配置 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 关系名称 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  关系名称 *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="input flex-1"
                    placeholder="如: fk_orders_user_id"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateRelationshipName}
                    className="btn-outline text-sm"
                    title="自动生成名称"
                  >
                    自动
                  </button>
                </div>
              </div>

              {/* 关系类型 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  关系类型 *
                </label>
                <select
                  value={formData.relationshipType}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    relationshipType: e.target.value as RelationshipType 
                  }))}
                  className="input w-full"
                  required
                >
                  <option value="ONE_TO_ONE">一对一 (1:1)</option>
                  <option value="ONE_TO_MANY">一对多 (1:N)</option>
                  <option value="MANY_TO_MANY">多对多 (M:N)</option>
                </select>
              </div>
            </div>

            {/* 表和字段选择 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                <Database className="w-5 h-5 mr-2" />
                表和字段关联
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
                {/* 源表 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    源表 *
                  </label>
                  <select
                    value={formData.fromTableId}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      fromTableId: e.target.value,
                      fromFieldId: '' // 重置字段选择
                    }))}
                    className="input w-full"
                    required
                  >
                    <option value="">请选择源表</option>
                    {tables.map(table => (
                      <option key={table.id} value={table.id}>
                        {table.displayName || table.name}
                      </option>
                    ))}
                  </select>
                  
                  {formData.fromTableId && (
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        源字段 *
                      </label>
                      <select
                        value={formData.fromFieldId}
                        onChange={(e) => setFormData(prev => ({ ...prev, fromFieldId: e.target.value }))}
                        className="input w-full"
                        required
                      >
                        <option value="">请选择字段</option>
                        {getAvailableFields(formData.fromTableId).map(field => (
                          <option key={field.id} value={field.id}>
                            {field.name} ({field.type})
                            {field.isPrimaryKey && ' 🗝️'}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* 关系箭头 */}
                <div className="flex justify-center items-center">
                  <div className="text-center">
                    <ArrowRight className="w-8 h-8 text-gray-400 mx-auto" />
                    <span className="text-xs text-gray-500 mt-1">
                      {formData.relationshipType === 'ONE_TO_ONE' && '1:1'}
                      {formData.relationshipType === 'ONE_TO_MANY' && '1:N'}
                      {formData.relationshipType === 'MANY_TO_MANY' && 'M:N'}
                    </span>
                  </div>
                </div>

                {/* 目标表 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    目标表 *
                  </label>
                  <select
                    value={formData.toTableId}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      toTableId: e.target.value,
                      toFieldId: '' // 重置字段选择
                    }))}
                    className="input w-full"
                    required
                  >
                    <option value="">请选择目标表</option>
                    {tables.filter(table => table.id !== formData.fromTableId).map(table => (
                      <option key={table.id} value={table.id}>
                        {table.displayName || table.name}
                      </option>
                    ))}
                  </select>
                  
                  {formData.toTableId && (
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        目标字段 *
                      </label>
                      <select
                        value={formData.toFieldId}
                        onChange={(e) => setFormData(prev => ({ ...prev, toFieldId: e.target.value }))}
                        className="input w-full"
                        required
                      >
                        <option value="">请选择字段</option>
                        {getAvailableFields(formData.toTableId).map(field => (
                          <option key={field.id} value={field.id}>
                            {field.name} ({field.type})
                            {field.isPrimaryKey && ' 🗝️'}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 多对多关系的中间表配置 */}
            {formData.relationshipType === 'MANY_TO_MANY' && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <h4 className="font-medium text-orange-900">多对多关系配置</h4>
                </div>
                <p className="text-sm text-orange-700 mb-3">
                  多对多关系需要创建中间表来存储关联关系。
                </p>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={bridgeTableName}
                    onChange={(e) => setBridgeTableName(e.target.value)}
                    className="input flex-1"
                    placeholder="中间表名称"
                  />
                  <button
                    type="button"
                    onClick={generateBridgeTableName}
                    className="btn-outline text-sm"
                  >
                    自动生成
                  </button>
                </div>
              </div>
            )}

            {/* 级联操作配置 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  更新时动作 (ON UPDATE)
                </label>
                <select
                  value={formData.onUpdate}
                  onChange={(e) => setFormData(prev => ({ ...prev, onUpdate: e.target.value as CascadeAction }))}
                  className="input w-full"
                >
                  <option value="RESTRICT">RESTRICT - 限制操作</option>
                  <option value="CASCADE">CASCADE - 级联更新</option>
                  <option value="SET_NULL">SET NULL - 设置为NULL</option>
                  <option value="NO_ACTION">NO ACTION - 无操作</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  删除时动作 (ON DELETE)
                </label>
                <select
                  value={formData.onDelete}
                  onChange={(e) => setFormData(prev => ({ ...prev, onDelete: e.target.value as CascadeAction }))}
                  className="input w-full"
                >
                  <option value="RESTRICT">RESTRICT - 限制操作</option>
                  <option value="CASCADE">CASCADE - 级联删除</option>
                  <option value="SET_NULL">SET NULL - 设置为NULL</option>
                  <option value="NO_ACTION">NO ACTION - 无操作</option>
                </select>
              </div>
            </div>

            {/* 高级配置 */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <Settings className="w-4 h-4" />
                <span>高级配置</span>
              </button>
              
              {showAdvanced && (
                <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.isEnforced}
                        onChange={(e) => setFormData(prev => ({ ...prev, isEnforced: e.target.checked }))}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">强制约束</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.deferrable}
                        onChange={(e) => setFormData(prev => ({ ...prev, deferrable: e.target.checked }))}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">可延迟约束</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* 说明 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                关系说明
              </label>
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                className="input w-full"
                rows={3}
                placeholder="描述这个关系的业务含义..."
              />
            </div>

            {/* 验证错误显示 */}
            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h4 className="font-medium text-red-900">请修正以下错误：</h4>
                </div>
                <ul className="text-sm text-red-700 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 关系预览 */}
            {fromTable && toTable && formData.fromFieldId && formData.toFieldId && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-green-900">关系预览</h4>
                </div>
                <div className="text-sm text-green-700">
                  <p>
                    <strong>{fromTable.displayName || fromTable.name}</strong>
                    .{getAvailableFields(formData.fromTableId).find(f => f.id === formData.fromFieldId)?.name}
                    {' → '}
                    <strong>{toTable.displayName || toTable.name}</strong>
                    .{getAvailableFields(formData.toTableId).find(f => f.id === formData.toFieldId)?.name}
                  </p>
                  <p className="mt-1">
                    类型: {formData.relationshipType} | 
                    更新: {formData.onUpdate} | 
                    删除: {formData.onDelete}
                  </p>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="btn-outline"
              >
                取消
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                {mode === 'edit' ? '更新关系' : '创建关系'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default RelationshipEditModal