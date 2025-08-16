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
  X,
  Network,
  GitBranch,
  Database
} from 'lucide-react'
import { DatabaseTable, TableRelationship } from '@shared/types'
import RelationshipEditModal from './modals/RelationshipEditModal'

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
  const [showRelationshipDetails, setShowRelationshipDetails] = useState<string | null>(null)
  const [showConstraintValidation, setShowConstraintValidation] = useState(false)

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

  // 检测循环依赖
  const detectCircularDependencies = (relationships: TableRelationship[], tables: DatabaseTable[]): number => {
    const graph = new Map<string, string[]>()
    
    // 构建依赖图
    tables.forEach(table => {
      graph.set(table.id, [])
    })

    relationships.forEach(rel => {
      const deps = graph.get(rel.fromTableId) || []
      deps.push(rel.toTableId)
      graph.set(rel.fromTableId, deps)
    })

    // DFS检测循环
    const visited = new Set<string>()
    const recStack = new Set<string>()
    let circularCount = 0

    const hasCycle = (node: string): boolean => {
      if (recStack.has(node)) {
        circularCount++
        return true
      }
      if (visited.has(node)) {
        return false
      }

      visited.add(node)
      recStack.add(node)

      const neighbors = graph.get(node) || []
      for (const neighbor of neighbors) {
        if (hasCycle(neighbor)) {
          return true
        }
      }

      recStack.delete(node)
      return false
    }

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        hasCycle(node)
      }
    }

    return circularCount
  }

  // 关系统计
  const relationshipStats = useMemo(() => {
    const stats = {
      total: relationships.length,
      oneToOne: 0,
      oneToMany: 0,
      manyToMany: 0,
      issues: 0,
      circularDependencies: 0,
      orphanedRelationships: 0
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

      // 检查孤立关系（表不存在）
      const fromTableExists = tables.some(t => t.id === rel.fromTableId)
      const toTableExists = tables.some(t => t.id === rel.toTableId)
      if (!fromTableExists || !toTableExists) {
        stats.orphanedRelationships++
      }
    })

    // 检查循环依赖
    stats.circularDependencies = detectCircularDependencies(relationships, tables)

    return stats
  }, [relationships, tables])

  // 验证关系完整性
  const validateRelationshipIntegrity = () => {
    const issues: Array<{
      relationshipId: string
      type: 'missing_table' | 'missing_field' | 'type_mismatch' | 'circular_dependency'
      message: string
    }> = []

    relationships.forEach(rel => {
      const fromTable = tables.find(t => t.id === rel.fromTableId)
      const toTable = tables.find(t => t.id === rel.toTableId)

      // 检查表是否存在
      if (!fromTable) {
        issues.push({
          relationshipId: rel.id,
          type: 'missing_table',
          message: `源表不存在: ${rel.fromTableId}`
        })
      }

      if (!toTable) {
        issues.push({
          relationshipId: rel.id,
          type: 'missing_table',
          message: `目标表不存在: ${rel.toTableId}`
        })
      }

      // 检查字段是否存在
      if (fromTable && rel.fromFieldId) {
        const fromField = fromTable.fields?.find(f => f.id === rel.fromFieldId)
        if (!fromField) {
          issues.push({
            relationshipId: rel.id,
            type: 'missing_field',
            message: `源字段不存在: ${rel.fromFieldId}`
          })
        }
      }

      if (toTable && rel.toFieldId) {
        const toField = toTable.fields?.find(f => f.id === rel.toFieldId)
        if (!toField) {
          issues.push({
            relationshipId: rel.id,
            type: 'missing_field',
            message: `目标字段不存在: ${rel.toFieldId}`
          })
        }
      }

      // 检查类型匹配
      if (fromTable && toTable && rel.fromFieldId && rel.toFieldId) {
        const fromField = fromTable.fields?.find(f => f.id === rel.fromFieldId)
        const toField = toTable.fields?.find(f => f.id === rel.toFieldId)
        
        if (fromField && toField && fromField.type !== toField.type) {
          issues.push({
            relationshipId: rel.id,
            type: 'type_mismatch',
            message: `字段类型不匹配: ${fromField.type} vs ${toField.type}`
          })
        }
      }
    })

    return issues
  }

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

  const handleViewRelationshipDetails = (relationshipId: string) => {
    setShowRelationshipDetails(relationshipId)
  }

  const handleCopyRelationship = (relationship: TableRelationship) => {
    // 复制关系逻辑
    const copiedRelationship: Omit<TableRelationship, 'id'> = {
      projectId: relationship.projectId,
      name: `${relationship.name}_copy`,
      fromTableId: relationship.fromTableId,
      toTableId: relationship.toTableId,
      fromFieldId: relationship.fromFieldId,
      toFieldId: relationship.toFieldId,
      relationshipType: relationship.relationshipType,
      onUpdate: relationship.onUpdate,
      onDelete: relationship.onDelete,
      comment: relationship.comment ? `${relationship.comment} (复制)` : '复制的关系',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    onRelationshipCreate(copiedRelationship)
  }

  const hasIssues = (relationship: TableRelationship) => {
    const fromTable = tables.find(t => t.id === relationship.fromTableId)
    const toTable = tables.find(t => t.id === relationship.toTableId)
    
    return !relationship.fromFieldId || 
           !relationship.toFieldId || 
           !fromTable || 
           !toTable
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
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
              <p className="text-sm font-medium text-gray-600">循环依赖</p>
              <p className="text-2xl font-bold text-orange-600">{relationshipStats.circularDependencies}</p>
            </div>
            <GitBranch className="w-8 h-8 text-orange-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">需要修复</p>
              <p className="text-2xl font-bold text-red-600">{relationshipStats.issues + relationshipStats.orphanedRelationships}</p>
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
              onClick={() => setShowConstraintValidation(true)}
              className="btn-outline flex items-center space-x-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>验证约束</span>
            </button>
            
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
                          onClick={() => handleViewRelationshipDetails(relationship.id)}
                          className="text-gray-600 hover:text-gray-900"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleCopyRelationship(relationship)}
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
          mode={editingRelationship ? 'edit' : 'create'}
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
          onDelete={editingRelationship ? (relationshipId: string) => {
            onRelationshipDelete(relationshipId)
            setEditingRelationship(null)
          } : undefined}
        />
      )}

      {/* 约束验证模态框 */}
      {showConstraintValidation && (
        <ConstraintValidationModal
          isOpen={true}
          relationships={relationships}
          tables={tables}
          onClose={() => setShowConstraintValidation(false)}
          onFixIssue={(relationshipId, fixes) => {
            // 自动修复逻辑
            console.log('Fix issues for relationship:', relationshipId, fixes)
          }}
        />
      )}

      {/* 关系详情模态框 */}
      {showRelationshipDetails && (
        <RelationshipDetailsModal
          isOpen={true}
          relationshipId={showRelationshipDetails}
          relationships={relationships}
          tables={tables}
          onClose={() => setShowRelationshipDetails(null)}
          onEdit={(relationship) => {
            setShowRelationshipDetails(null)
            setEditingRelationship(relationship)
          }}
        />
      )}
    </div>
  )
}

// 约束验证模态框
interface ConstraintValidationModalProps {
  isOpen: boolean
  relationships: TableRelationship[]
  tables: DatabaseTable[]
  onClose: () => void
  onFixIssue: (relationshipId: string, fixes: any) => void
}

const ConstraintValidationModal: React.FC<ConstraintValidationModalProps> = ({
  isOpen,
  relationships,
  tables,
  onClose,
  onFixIssue
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            约束验证报告
          </h2>
          <button onClick={onClose} className="btn-ghost">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-gray-600">约束验证功能正在开发中...</p>
        </div>
      </div>
    </div>
  )
}

// 关系详情模态框
interface RelationshipDetailsModalProps {
  isOpen: boolean
  relationshipId: string
  relationships: TableRelationship[]
  tables: DatabaseTable[]
  onClose: () => void
  onEdit: (relationship: TableRelationship) => void
}

const RelationshipDetailsModal: React.FC<RelationshipDetailsModalProps> = ({
  isOpen,
  relationshipId,
  relationships,
  tables,
  onClose,
  onEdit
}) => {
  if (!isOpen) return null

  const relationship = relationships.find(r => r.id === relationshipId)
  if (!relationship) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            关系详情
          </h2>
          <button onClick={onClose} className="btn-ghost">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">关系名称</label>
              <p className="text-gray-900">{relationship.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">类型</label>
              <p className="text-gray-900">{relationship.relationshipType}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">约束行为</label>
              <p className="text-gray-900">
                更新: {relationship.onUpdate}, 删除: {relationship.onDelete}
              </p>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button onClick={onClose} className="btn-outline">
              关闭
            </button>
            <button 
              onClick={() => onEdit(relationship)}
              className="btn-primary"
            >
              编辑
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RelationshipManager