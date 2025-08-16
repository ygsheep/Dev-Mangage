import React, { useState, useMemo } from 'react'
import {
  Plus,
  Edit3,
  Trash2,
  Search,
  Filter,
  Link,
  ArrowRight,
  Key,
  AlertTriangle,
  CheckCircle,
  Settings,
  Eye,
  Copy,
  X
} from 'lucide-react'
import { DatabaseTable, TableRelationship } from '@shared/types'

interface RelationshipManagerProps {
  projectId: string
  tables: DatabaseTable[]
  relationships: TableRelationship[]
  onRelationshipCreate: (relationship: Omit<TableRelationship, 'id'>) => void
  onRelationshipUpdate: (relationshipId: string, updates: Partial<TableRelationship>) => void
  onRelationshipDelete: (relationshipId: string) => void
}

const RelationshipManager: React.FC<RelationshipManagerProps> = ({
  projectId,
  tables,
  relationships,
  onRelationshipCreate,
  onRelationshipUpdate,
  onRelationshipDelete
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<'ALL' | 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_MANY'>('ALL')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingRelationship, setEditingRelationship] = useState<TableRelationship | null>(null)
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set())

  // 过滤关系
  const filteredRelationships = useMemo(() => {
    let filtered = relationships

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(rel => {
        const fromTable = tables.find(t => t.id === rel.fromTableId)
        const toTable = tables.find(t => t.id === rel.toTableId)
        return (
          rel.name?.toLowerCase().includes(query) ||
          fromTable?.name.toLowerCase().includes(query) ||
          fromTable?.displayName?.toLowerCase().includes(query) ||
          toTable?.name.toLowerCase().includes(query) ||
          toTable?.displayName?.toLowerCase().includes(query)
        )
      })
    }

    if (selectedType !== 'ALL') {
      filtered = filtered.filter(rel => rel.relationshipType === selectedType)
    }

    if (selectedTables.size > 0) {
      filtered = filtered.filter(rel => 
        selectedTables.has(rel.fromTableId) || selectedTables.has(rel.toTableId)
      )
    }

    return filtered
  }, [relationships, searchQuery, selectedType, selectedTables, tables])

  // 关系统计
  const relationshipStats = useMemo(() => {
    const stats = {
      total: relationships.length,
      oneToOne: 0,
      oneToMany: 0,
      manyToMany: 0,
      issues: 0
    }

    relationships.forEach(rel => {
      switch (rel.relationshipType) {
        case 'ONE_TO_ONE':
          stats.oneToOne++
          break
        case 'ONE_TO_MANY':
          stats.oneToMany++
          break
        case 'MANY_TO_MANY':
          stats.manyToMany++
          break
      }

      // 检查问题（如缺失字段等）
      if (!rel.fromFieldId || !rel.toFieldId) {
        stats.issues++
      }
    })

    return stats
  }, [relationships])

  const getRelationshipIcon = (type: string) => {
    switch (type) {
      case 'ONE_TO_ONE':
        return '1:1'
      case 'ONE_TO_MANY':
        return '1:N'
      case 'MANY_TO_MANY':
        return 'N:M'
      default:
        return '?'
    }
  }

  const getRelationshipColor = (type: string) => {
    switch (type) {
      case 'ONE_TO_ONE':
        return 'bg-blue-100 text-blue-800'
      case 'ONE_TO_MANY':
        return 'bg-green-100 text-green-800'
      case 'MANY_TO_MANY':
        return 'bg-amber-100 text-amber-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleTableToggle = (tableId: string) => {
    const newSelected = new Set(selectedTables)
    if (newSelected.has(tableId)) {
      newSelected.delete(tableId)
    } else {
      newSelected.add(tableId)
    }
    setSelectedTables(newSelected)
  }

  const handleCreateRelationship = () => {
    setShowCreateModal(true)
  }

  const handleEditRelationship = (relationship: TableRelationship) => {
    setEditingRelationship(relationship)
  }

  const hasIssues = (relationship: TableRelationship) => {
    return !relationship.fromFieldId || !relationship.toFieldId
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">总关系数</p>
              <p className="text-2xl font-bold text-gray-900">{relationshipStats.total}</p>
            </div>
            <Link className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">一对一</p>
              <p className="text-2xl font-bold text-blue-600">{relationshipStats.oneToOne}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-xs font-bold text-blue-600">1:1</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">一对多</p>
              <p className="text-2xl font-bold text-green-600">{relationshipStats.oneToMany}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-xs font-bold text-green-600">1:N</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">多对多</p>
              <p className="text-2xl font-bold text-amber-600">{relationshipStats.manyToMany}</p>
            </div>
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <span className="text-xs font-bold text-amber-600">N:M</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">需要修复</p>
              <p className="text-2xl font-bold text-red-600">{relationshipStats.issues}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* 工具栏 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索关系..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 w-64"
              />
            </div>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="input w-auto"
            >
              <option value="ALL">所有类型</option>
              <option value="ONE_TO_ONE">一对一</option>
              <option value="ONE_TO_MANY">一对多</option>
              <option value="MANY_TO_MANY">多对多</option>
            </select>

            <button
              onClick={() => setSelectedTables(new Set())}
              className={`btn-outline ${selectedTables.size === 0 ? 'opacity-50' : ''}`}
              disabled={selectedTables.size === 0}
            >
              清除筛选
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCreateRelationship}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>创建关系</span>
            </button>
          </div>
        </div>
      </div>

      {/* 表筛选器 */}
      {tables.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            按表筛选 {selectedTables.size > 0 && `(${selectedTables.size} 个已选择)`}
          </h3>
          
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {tables.map(table => (
              <label
                key={table.id}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                  selectedTables.has(table.id)
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedTables.has(table.id)}
                  onChange={() => handleTableToggle(table.id)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">
                  {table.displayName || table.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 关系列表 */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            关系列表 ({filteredRelationships.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  关系名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  类型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  从表
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  到表
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  约束行为
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRelationships.map((relationship) => {
                const fromTable = tables.find(t => t.id === relationship.fromTableId)
                const toTable = tables.find(t => t.id === relationship.toTableId)
                const hasProblems = hasIssues(relationship)

                return (
                  <tr key={relationship.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Link className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {relationship.name || `${fromTable?.name}_${toTable?.name}`}
                          </div>
                          {relationship.comment && (
                            <div className="text-sm text-gray-500">
                              {relationship.comment}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRelationshipColor(relationship.relationshipType)}`}>
                        {getRelationshipIcon(relationship.relationshipType)}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm text-gray-900">
                          {fromTable?.displayName || fromTable?.name || '未知表'}
                        </div>
                        {relationship.fromFieldId && (
                          <div className="ml-2 flex items-center text-xs text-gray-500">
                            <Key className="w-3 h-3 mr-1" />
                            <span>字段ID</span>
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ArrowRight className="w-4 h-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">
                          {toTable?.displayName || toTable?.name || '未知表'}
                        </div>
                        {relationship.toFieldId && (
                          <div className="ml-2 flex items-center text-xs text-gray-500">
                            <Key className="w-3 h-3 mr-1" />
                            <span>字段ID</span>
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-1">
                        <div>更新: {relationship.onUpdate}</div>
                        <div>删除: {relationship.onDelete}</div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {hasProblems ? (
                        <div className="flex items-center text-red-600">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          <span className="text-sm">需要修复</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          <span className="text-sm">正常</span>
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditRelationship(relationship)}
                          className="text-blue-600 hover:text-blue-900"
                          title="编辑关系"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => {/* TODO: 查看关系详情 */}}
                          className="text-gray-600 hover:text-gray-900"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => {/* TODO: 复制关系 */}}
                          className="text-gray-600 hover:text-gray-900"
                          title="复制关系"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => onRelationshipDelete(relationship.id)}
                          className="text-red-600 hover:text-red-900"
                          title="删除关系"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredRelationships.length === 0 && (
          <div className="text-center py-12">
            <Link className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || selectedType !== 'ALL' || selectedTables.size > 0
                ? '没有找到匹配的关系'
                : '暂无关系'
              }
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || selectedType !== 'ALL' || selectedTables.size > 0
                ? '请尝试调整搜索条件'
                : '创建表之间的关系来建立数据连接'
              }
            </p>
            <button
              onClick={handleCreateRelationship}
              className="btn-primary"
            >
              创建第一个关系
            </button>
          </div>
        )}
      </div>

      {/* 创建/编辑关系模态框 */}
      {(showCreateModal || editingRelationship) && (
        <RelationshipEditModal
          isOpen={true}
          relationship={editingRelationship}
          tables={tables}
          onClose={() => {
            setShowCreateModal(false)
            setEditingRelationship(null)
          }}
          onSave={(relationshipData) => {
            if (editingRelationship) {
              onRelationshipUpdate(editingRelationship.id, relationshipData)
            } else {
              onRelationshipCreate({ ...relationshipData, projectId })
            }
            setShowCreateModal(false)
            setEditingRelationship(null)
          }}
        />
      )}
    </div>
  )
}

// 关系编辑模态框组件
interface RelationshipEditModalProps {
  isOpen: boolean
  relationship?: TableRelationship | null
  tables: DatabaseTable[]
  onClose: () => void
  onSave: (data: Omit<TableRelationship, 'id' | 'projectId'>) => void
}

const RelationshipEditModal: React.FC<RelationshipEditModalProps> = ({
  isOpen,
  relationship,
  tables,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    name: relationship?.name || '',
    fromTableId: relationship?.fromTableId || '',
    toTableId: relationship?.toTableId || '',
    fromFieldId: relationship?.fromFieldId || '',
    toFieldId: relationship?.toFieldId || '',
    relationshipType: relationship?.relationshipType || 'ONE_TO_MANY' as const,
    onUpdate: relationship?.onUpdate || 'RESTRICT' as const,
    onDelete: relationship?.onDelete || 'RESTRICT' as const,
    comment: relationship?.comment || ''
  })

  const fromTable = tables.find(t => t.id === formData.fromTableId)
  const toTable = tables.find(t => t.id === formData.toTableId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {relationship ? '编辑关系' : '创建关系'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                关系名称
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input w-full"
                placeholder="自动生成或手动输入"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                关系类型
              </label>
              <select
                value={formData.relationshipType}
                onChange={(e) => setFormData({ ...formData, relationshipType: e.target.value as any })}
                className="input w-full"
              >
                <option value="ONE_TO_ONE">一对一 (1:1)</option>
                <option value="ONE_TO_MANY">一对多 (1:N)</option>
                <option value="MANY_TO_MANY">多对多 (N:M)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                源表
              </label>
              <select
                value={formData.fromTableId}
                onChange={(e) => setFormData({ ...formData, fromTableId: e.target.value, fromFieldId: '' })}
                className="input w-full"
                required
              >
                <option value="">选择源表</option>
                {tables.map(table => (
                  <option key={table.id} value={table.id}>
                    {table.displayName || table.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                目标表
              </label>
              <select
                value={formData.toTableId}
                onChange={(e) => setFormData({ ...formData, toTableId: e.target.value, toFieldId: '' })}
                className="input w-full"
                required
              >
                <option value="">选择目标表</option>
                {tables.map(table => (
                  <option key={table.id} value={table.id}>
                    {table.displayName || table.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                源表字段
              </label>
              <select
                value={formData.fromFieldId}
                onChange={(e) => setFormData({ ...formData, fromFieldId: e.target.value })}
                className="input w-full"
                disabled={!fromTable}
                required
              >
                <option value="">选择字段</option>
                {fromTable?.fields?.map(field => (
                  <option key={field.id} value={field.id}>
                    {field.name} ({field.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                目标表字段
              </label>
              <select
                value={formData.toFieldId}
                onChange={(e) => setFormData({ ...formData, toFieldId: e.target.value })}
                className="input w-full"
                disabled={!toTable}
                required
              >
                <option value="">选择字段</option>
                {toTable?.fields?.map(field => (
                  <option key={field.id} value={field.id}>
                    {field.name} ({field.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                更新时
              </label>
              <select
                value={formData.onUpdate}
                onChange={(e) => setFormData({ ...formData, onUpdate: e.target.value as any })}
                className="input w-full"
              >
                <option value="RESTRICT">RESTRICT (限制)</option>
                <option value="CASCADE">CASCADE (级联)</option>
                <option value="SET_NULL">SET NULL (设为空)</option>
                <option value="NO_ACTION">NO ACTION (无操作)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                删除时
              </label>
              <select
                value={formData.onDelete}
                onChange={(e) => setFormData({ ...formData, onDelete: e.target.value as any })}
                className="input w-full"
              >
                <option value="RESTRICT">RESTRICT (限制)</option>
                <option value="CASCADE">CASCADE (级联)</option>
                <option value="SET_NULL">SET NULL (设为空)</option>
                <option value="NO_ACTION">NO ACTION (无操作)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              关系说明
            </label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              className="input w-full"
              rows={3}
              placeholder="描述这个关系的业务含义..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
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
              {relationship ? '更新' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RelationshipManager