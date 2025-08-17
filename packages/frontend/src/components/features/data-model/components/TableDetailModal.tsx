import React, { useState, useMemo } from 'react'
import {
  X,
  Edit3,
  Trash2,
  Download,
  Save,
  Plus,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Table,
  Database,
  Key,
  Link,
  FileText,
  Settings,
  AlertTriangle,
  CheckCircle,
  Info,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  Layers
} from 'lucide-react'
import { DatabaseTable, DatabaseField, DatabaseIndex, TableRelationship } from '@shared/types'
import { toast } from 'react-hot-toast'
import CompositeIndexEditor from './CompositeIndexEditor'
import SQLPreview from '../../../common/SQLPreview'

interface TableDetailModalProps {
  isOpen: boolean
  table: DatabaseTable
  tables: DatabaseTable[]
  relationships: TableRelationship[]
  onClose: () => void
  onUpdate: (updates: Partial<DatabaseTable>) => void
  onDelete: () => void
  onFieldCreate: (field: Omit<DatabaseField, 'id'>) => void
  onFieldUpdate: (fieldId: string, updates: Partial<DatabaseField>) => void
  onFieldDelete: (fieldId: string) => void
  onIndexCreate: (index: Omit<DatabaseIndex, 'id'>) => void
  onIndexUpdate: (indexId: string, updates: Partial<DatabaseIndex>) => void
  onIndexDelete: (indexId: string) => void
}

type TabType = 'info' | 'fields' | 'indexes' | 'relationships' | 'sql'

const TableDetailModal: React.FC<TableDetailModalProps> = ({
  isOpen,
  table,
  tables,
  relationships,
  onClose,
  onUpdate,
  onDelete,
  onFieldCreate,
  onFieldUpdate,
  onFieldDelete,
  onIndexCreate,
  onIndexUpdate,
  onIndexDelete
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('info')
  const [editing, setEditing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [fieldTypeFilter, setFieldTypeFilter] = useState<string>('ALL')
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set())
  const [showFieldModal, setShowFieldModal] = useState(false)
  const [editingField, setEditingField] = useState<DatabaseField | null>(null)
  const [showCompositeIndexEditor, setShowCompositeIndexEditor] = useState(false)
  const [editingIndex, setEditingIndex] = useState<DatabaseIndex | null>(null)

  // 表信息编辑状态
  const [tableInfo, setTableInfo] = useState({
    name: table.name,
    displayName: table.displayName || '',
    comment: table.comment || '',
    engine: table.engine || 'InnoDB',
    charset: table.charset || 'utf8mb4',
    collation: table.collation || 'utf8mb4_unicode_ci',
    category: table.category || ''
  })

  // 过滤和排序字段
  const filteredFields = useMemo(() => {
    let fields = table.fields || []

    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      fields = fields.filter(field =>
        field.name.toLowerCase().includes(query) ||
        field.comment?.toLowerCase().includes(query) ||
        field.type.toLowerCase().includes(query)
      )
    }

    // 类型过滤
    if (fieldTypeFilter !== 'ALL') {
      fields = fields.filter(field => field.type.includes(fieldTypeFilter))
    }

    // 排序
    if (sortConfig) {
      fields.sort((a, b) => {
        const aValue = (a as any)[sortConfig.key]
        const bValue = (b as any)[sortConfig.key]
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }

    return fields
  }, [table.fields, searchQuery, fieldTypeFilter, sortConfig])

  // 获取表关系
  const tableRelationships = useMemo(() => {
    return relationships.filter(rel => 
      rel.fromTableId === table.id || rel.toTableId === table.id
    )
  }, [relationships, table.id])

  // 处理排序
  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // 处理字段选择
  const handleFieldSelect = (fieldId: string) => {
    const newSelected = new Set(selectedFields)
    if (newSelected.has(fieldId)) {
      newSelected.delete(fieldId)
    } else {
      newSelected.add(fieldId)
    }
    setSelectedFields(newSelected)
  }

  // 保存表信息
  const handleSaveTableInfo = () => {
    onUpdate(tableInfo)
    setEditing(false)
    toast.success('表信息已更新')
  }

  // 导出SQL
  const handleExportSQL = () => {
    const sql = generateCreateTableSQL(table)
    const blob = new Blob([sql], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${table.name}.sql`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('SQL文件已导出')
  }

  // 生成建表SQL
  const generateCreateTableSQL = (table: DatabaseTable): string => {
    const fields = table.fields || []
    const indexes = table.indexes || []
    
    let sql = `CREATE TABLE \`${table.name}\` (\n`
    
    // 字段定义
    const fieldDefinitions = fields.map(field => {
      let def = `  \`${field.name}\` ${field.type.toUpperCase()}`
      
      if (field.length) {
        def += `(${field.length})`
      }
      
      if (!field.nullable) {
        def += ' NOT NULL'
      }
      
      if (field.defaultValue) {
        def += ` DEFAULT ${field.defaultValue}`
      }
      
      if (field.isAutoIncrement) {
        def += ' AUTO_INCREMENT'
      }
      
      if (field.comment) {
        def += ` COMMENT '${field.comment}'`
      }
      
      return def
    })
    
    sql += fieldDefinitions.join(',\n')
    
    // 主键
    const primaryKeys = fields.filter(f => f.isPrimaryKey).map(f => f.name)
    if (primaryKeys.length > 0) {
      sql += `,\n  PRIMARY KEY (\`${primaryKeys.join('`, `')}\`)`
    }
    
    // 索引
    indexes.forEach(index => {
      const indexType = index.isUnique ? 'UNIQUE KEY' : 'KEY'
      const indexFields = index.fields || []
      const fieldNames = indexFields.map((field: any) => 
        typeof field === 'string' ? field : field.fieldName
      )
      sql += `,\n  ${indexType} \`${index.name}\` (\`${fieldNames.join('`, `')}\`)`
    })
    
    sql += `\n) ENGINE=${table.engine} DEFAULT CHARSET=${table.charset}`
    
    if (table.collation) {
      sql += ` COLLATE=${table.collation}`
    }
    
    if (table.comment) {
      sql += ` COMMENT='${table.comment}'`
    }
    
    sql += ';'
    
    return sql
  }

  // 获取字段类型的唯一值
  const fieldTypes = useMemo(() => {
    const types = new Set((table.fields || []).map(field => field.type.split('(')[0]))
    return Array.from(types).sort()
  }, [table.fields])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-paper rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-border-primary bg-gradient-header">
          <div className="flex items-center space-x-3">
            <Table className="w-8 h-8 text-blue-500" />
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                {table.displayName || table.name} ({table.name})
              </h2>
              <div className="flex items-center space-x-4 text-sm text-text-secondary">
                <span className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                  {table.status === 'ACTIVE' ? '已创建' : table.status}
                </span>
                <span>{table.fields?.length || 0} 字段</span>
                <span>{table.indexes?.length || 0} 索引</span>
                <span>{tableRelationships.length} 关系</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setEditing(!editing)}
              className="btn-outline flex items-center space-x-2"
            >
              <Edit3 className="w-4 h-4" />
              <span>{editing ? '取消编辑' : '编辑'}</span>
            </button>
            
            <button
              onClick={onDelete}
              className="btn-outline flex items-center space-x-2 text-red-600 border-red-600 hover:bg-red-50"

            >
              <Trash2 className="w-4 h-4" />
              <span>删除</span>
            </button>
            
            <button
              onClick={handleExportSQL}
              className="btn-outline flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>导出SQL</span>
            </button>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 标签页导航 */}
        <div className="flex border-b border-border-primary bg-bg-tertiary">
          {[
            { key: 'info', label: '表信息', icon: Database },
            { key: 'fields', label: '字段结构', icon: Table },
            { key: 'indexes', label: '索引信息', icon: Key },
            { key: 'relationships', label: '关联关系', icon: Link },
            { key: 'sql', label: 'SQL语句', icon: FileText }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as TabType)}
              className={`flex items-center space-x-2 px-6 py-3 border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-primary-500 text-primary-600 bg-bg-paper'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-primary'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden">
          {/* 表信息标签页 */}
          {activeTab === 'info' && (
            <div className="p-6 space-y-6 h-full overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      表名 *
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={tableInfo.name}
                        onChange={(e) => setTableInfo(prev => ({ ...prev, name: e.target.value }))}
                        className="input w-full"
                      />
                    ) : (
                      <div className="text-text-primary font-mono bg-bg-tertiary px-3 py-2 rounded border">
                        {tableInfo.name}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      显示名称
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={tableInfo.displayName}
                        onChange={(e) => setTableInfo(prev => ({ ...prev, displayName: e.target.value }))}
                        className="input w-full"
                        placeholder="用户友好的表名"
                      />
                    ) : (
                      <div className="text-text-primary px-3 py-2 bg-bg-tertiary rounded border">
                        {tableInfo.displayName || '-'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      存储引擎
                    </label>
                    {editing ? (
                      <select
                        value={tableInfo.engine}
                        onChange={(e) => setTableInfo(prev => ({ ...prev, engine: e.target.value }))}
                        className="input w-full"
                      >
                        <option value="InnoDB">InnoDB</option>
                        <option value="MyISAM">MyISAM</option>
                        <option value="Memory">Memory</option>
                      </select>
                    ) : (
                      <div className="text-text-primary px-3 py-2 bg-bg-tertiary rounded border">
                        {tableInfo.engine}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      字符集
                    </label>
                    {editing ? (
                      <select
                        value={tableInfo.charset}
                        onChange={(e) => setTableInfo(prev => ({ ...prev, charset: e.target.value }))}
                        className="input w-full"
                      >
                        <option value="utf8mb4">utf8mb4</option>
                        <option value="utf8">utf8</option>
                        <option value="latin1">latin1</option>
                      </select>
                    ) : (
                      <div className="text-text-primary px-3 py-2 bg-bg-tertiary rounded border">
                        {tableInfo.charset}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      排序规则
                    </label>
                    {editing ? (
                      <select
                        value={tableInfo.collation}
                        onChange={(e) => setTableInfo(prev => ({ ...prev, collation: e.target.value }))}
                        className="input w-full"
                      >
                        <option value="utf8mb4_unicode_ci">utf8mb4_unicode_ci</option>
                        <option value="utf8mb4_general_ci">utf8mb4_general_ci</option>
                        <option value="utf8_unicode_ci">utf8_unicode_ci</option>
                      </select>
                    ) : (
                      <div className="text-text-primary px-3 py-2 bg-bg-tertiary rounded border">
                        {tableInfo.collation}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      分类
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={tableInfo.category}
                        onChange={(e) => setTableInfo(prev => ({ ...prev, category: e.target.value }))}
                        className="input w-full"
                        placeholder="如: 用户管理、订单管理"
                      />
                    ) : (
                      <div className="text-text-primary px-3 py-2 bg-bg-tertiary rounded border">
                        {tableInfo.category || '-'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-text-secondary">
                      表统计信息
                    </label>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-blue-50 p-3 rounded">
                        <div className="text-blue-600 font-medium">字段数量</div>
                        <div className="text-lg font-bold text-blue-900">
                          {table.fields?.length || 0}
                        </div>
                      </div>
                      <div className="bg-green-50 p-3 rounded">
                        <div className="text-green-600 font-medium">索引数量</div>
                        <div className="text-lg font-bold text-green-900">
                          {table.indexes?.length || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  表说明
                </label>
                {editing ? (
                  <textarea
                    value={tableInfo.comment}
                    onChange={(e) => setTableInfo(prev => ({ ...prev, comment: e.target.value }))}
                    className="input w-full"
                    rows={4}
                    placeholder="描述这个表的用途和存储的数据类型..."
                  />
                ) : (
                  <div className="text-text-primary px-3 py-2 bg-bg-tertiary rounded border min-h-[100px]">
                    {tableInfo.comment || '暂无说明'}
                  </div>
                )}
              </div>

              {editing && (
                <div className="flex justify-end space-x-3 pt-4 border-t border-border-primary">
                  <button
                    onClick={() => {
                      setEditing(false)
                      setTableInfo({
                        name: table.name,
                        displayName: table.displayName || '',
                        comment: table.comment || '',
                        engine: table.engine || 'InnoDB',
                        charset: table.charset || 'utf8mb4',
                        collation: table.collation || 'utf8mb4_unicode_ci',
                        category: table.category || ''
                      })
                    }}
                    className="btn-outline"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveTableInfo}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>保存</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 字段结构标签页 */}
          {activeTab === 'fields' && (
            <div className="h-full flex flex-col">
              {/* 字段工具栏 */}
              <div className="p-4 border-b border-border-primary bg-bg-tertiary">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary w-4 h-4" />
                      <input
                        type="text"
                        placeholder="搜索字段..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input pl-10 w-64"
                      />
                    </div>

                    <select
                      value={fieldTypeFilter}
                      onChange={(e) => setFieldTypeFilter(e.target.value)}
                      className="input w-auto"
                    >
                      <option value="ALL">所有类型</option>
                      {fieldTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>

                    {selectedFields.size > 0 && (
                      <span className="text-sm text-text-secondary">
                        已选择 {selectedFields.size} 个字段
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowFieldModal(true)}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>添加字段</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 字段列表 */}
              <div className="flex-1 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-bg-tertiary sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        <input
                          type="checkbox"
                          className="rounded border-border-primary"
                          checked={selectedFields.size === filteredFields.length && filteredFields.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFields(new Set(filteredFields.map(f => f.id)))
                            } else {
                              setSelectedFields(new Set())
                            }
                          }}
                        />
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider cursor-pointer hover:bg-bg-tertiary"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center">
                          字段名
                          {sortConfig?.key === 'name' && (
                            sortConfig.direction === 'asc' ? 
                            <SortAsc className="w-4 h-4 ml-1" /> : 
                            <SortDesc className="w-4 h-4 ml-1" />
                          )}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider cursor-pointer hover:bg-bg-tertiary"
                        onClick={() => handleSort('type')}
                      >
                        <div className="flex items-center">
                          类型
                          {sortConfig?.key === 'type' && (
                            sortConfig.direction === 'asc' ? 
                            <SortAsc className="w-4 h-4 ml-1" /> : 
                            <SortDesc className="w-4 h-4 ml-1" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        约束
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        默认值
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        说明
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-bg-paper divide-y divide-gray-200">
                    {filteredFields.map((field) => (
                      <tr key={field.id} className="hover:bg-bg-tertiary">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="rounded border-border-primary"
                            checked={selectedFields.has(field.id)}
                            onChange={() => handleFieldSelect(field.id)}
                          />
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {field.isPrimaryKey && (
                              <Key className="w-4 h-4 text-yellow-500 mr-2" />
                            )}
                            <div>
                              <div className="text-sm font-medium text-text-primary font-mono">
                                {field.name}
                              </div>
                              {field.isPrimaryKey && (
                                <div className="text-xs text-yellow-600">主键</div>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-bg-tertiary text-text-primary">
                            {field.type}
                            {field.length && `(${field.length})`}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {!field.nullable && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                                NOT NULL
                              </span>
                            )}
                            {field.isUnique && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                                UNIQUE
                              </span>
                            )}
                            {field.isAutoIncrement && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                                AUTO_INCREMENT
                              </span>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary font-mono">
                          {field.defaultValue || '-'}
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm text-text-primary max-w-xs truncate">
                            {field.comment || '-'}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => {
                                setEditingField(field)
                                setShowFieldModal(true)
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="编辑字段"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => onFieldDelete(field.id)}
                              className="text-red-600 hover:text-red-900"
                              title="删除字段"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredFields.length === 0 && (
                  <div className="text-center py-12">
                    <Table className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-text-primary mb-2">
                      {searchQuery || fieldTypeFilter !== 'ALL' ? '没有找到匹配的字段' : '暂无字段'}
                    </h3>
                    <p className="text-text-secondary mb-6">
                      {searchQuery || fieldTypeFilter !== 'ALL' ? 
                        '请尝试调整搜索条件' : 
                        '添加字段来定义表结构'
                      }
                    </p>
                    <button
                      onClick={() => setShowFieldModal(true)}
                      className="btn-primary"
                    >
                      添加第一个字段
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 索引信息标签页 */}
          {activeTab === 'indexes' && (
            <div className="h-full flex flex-col">
              {/* 索引工具栏 */}
              <div className="p-4 border-b border-border-primary bg-bg-tertiary">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium text-text-primary">
                      索引管理 ({table.indexes?.length || 0})
                    </h3>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingIndex(null)
                        setShowCompositeIndexEditor(true)
                      }}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>添加索引</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setEditingIndex(null)
                        setShowCompositeIndexEditor(true)
                      }}
                      className="btn-outline flex items-center space-x-2"
                    >
                      <Layers className="w-4 h-4" />
                      <span>复合索引</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 索引列表 */}
              <div className="flex-1 overflow-y-auto">
                {(table.indexes?.length || 0) > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-bg-tertiary sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                          索引名称
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                          类型
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                          字段
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                          唯一性
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-text-tertiary uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-bg-paper divide-y divide-gray-200">
                      {(table.indexes || []).map((index) => (
                        <tr key={index.id} className="hover:bg-bg-tertiary">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Key className="w-4 h-4 text-text-tertiary mr-2" />
                              <div>
                                <div className="text-sm font-medium text-text-primary font-mono">
                                  {index.name}
                                </div>
                                {index.comment && (
                                  <div className="text-xs text-text-tertiary">
                                    {index.comment}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              index.type === 'PRIMARY' ? 'bg-blue-100 text-blue-800' :
                              index.type === 'UNIQUE' ? 'bg-green-100 text-green-800' :
                              index.type === 'FULLTEXT' ? 'bg-purple-100 text-purple-800' :
                              'bg-bg-tertiary text-text-primary'
                            }`}>
                              {index.type || 'BTREE'}
                            </span>
                          </td>
                          
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {(index.fields || []).map((field: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-1 rounded text-xs bg-bg-tertiary text-text-secondary"
                                >
                                  {typeof field === 'string' ? field : field.fieldName}
                                </span>
                              ))}
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {index.isUnique ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <span className="text-text-tertiary">-</span>
                              )}
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => {
                                  setEditingIndex(index)
                                  setShowCompositeIndexEditor(true)
                                }}
                                className="text-blue-600 hover:text-blue-900"
                                title="编辑索引"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => onIndexDelete && onIndexDelete(index.id)}
                                className="text-red-600 hover:text-red-900"
                                title="删除索引"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-12">
                    <Key className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-text-primary mb-2">
                      暂无索引
                    </h3>
                    <p className="text-text-secondary mb-6">
                      添加索引可以提高查询性能
                    </p>
                    <div className="flex justify-center space-x-3">
                      <button
                        onClick={() => {
                          setEditingIndex(null)
                          setShowCompositeIndexEditor(true)
                        }}
                        className="btn-primary flex items-center space-x-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>添加索引</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingIndex(null)
                          setShowCompositeIndexEditor(true)
                        }}
                        className="btn-outline flex items-center space-x-2"
                      >
                        <Layers className="w-4 h-4" />
                        <span>复合索引</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'relationships' && (
            <div className="p-6">
              <div className="space-y-4">
                {tableRelationships.length > 0 ? (
                  tableRelationships.map(rel => (
                    <div key={rel.id} className="border border-border-primary rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-text-primary">{rel.name}</h4>
                          <p className="text-sm text-text-secondary">{rel.relationshipType}</p>
                        </div>
                        <div className="text-sm text-text-tertiary">
                          {rel.onUpdate} / {rel.onDelete}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Link className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-text-primary mb-2">
                      暂无关联关系
                    </h3>
                    <p className="text-text-secondary">
                      此表尚未与其他表建立关联关系
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-text-primary">建表SQL语句</h3>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generateCreateTableSQL(table))
                      toast.success('SQL已复制到剪贴板')
                    }}
                    className="btn-outline flex items-center space-x-2"
                  >
                    <Copy className="w-4 h-4" />
                    <span>复制</span>
                  </button>
                </div>
                
                <SQLPreview
                  sql={generateCreateTableSQL(table)}
                  dialect="MySQL"
                  title="建表SQL语句"
                  showLineNumbers={true}
                  maxHeight="400px"
                />
              </div>
            </div>
          )}
        </div>

        {/* 底部说明栏 */}
        <div className="px-6 py-4 border-t border-border-primary bg-bg-tertiary">
          <div className="flex items-center justify-between">
            <div className="text-sm text-text-secondary">
              <span className="font-medium">说明:</span> {table.comment || '存储表的基础数据信息'}
            </div>
            <button
              onClick={onClose}
              className="btn-outline"
            >
              关闭
            </button>
          </div>
        </div>
      </div>

      {/* 字段编辑模态框 */}
      {showFieldModal && (
        <FieldEditModal
          isOpen={true}
          field={editingField}
          onClose={() => {
            setShowFieldModal(false)
            setEditingField(null)
          }}
          onSave={(fieldData) => {
            if (editingField) {
              onFieldUpdate(editingField.id, fieldData)
            } else {
              onFieldCreate(fieldData)
            }
            setShowFieldModal(false)
            setEditingField(null)
          }}
        />
      )}

      {/* 复合索引编辑器 */}
      {showCompositeIndexEditor && (
        <CompositeIndexEditor
          isOpen={true}
          table={table}
          existingIndex={editingIndex}
          onClose={() => {
            setShowCompositeIndexEditor(false)
            setEditingIndex(null)
          }}
          onSave={(indexData) => {
            onIndexCreate && onIndexCreate(indexData)
            setShowCompositeIndexEditor(false)
            setEditingIndex(null)
          }}
          onUpdate={(indexId, updates) => {
            onIndexUpdate && onIndexUpdate(indexId, updates)
            setShowCompositeIndexEditor(false)
            setEditingIndex(null)
          }}
        />
      )}
    </div>
  )
}

// 字段编辑模态框组件
interface FieldEditModalProps {
  isOpen: boolean
  field: DatabaseField | null
  onClose: () => void
  onSave: (data: Omit<DatabaseField, 'id'>) => void
}

const FieldEditModal: React.FC<FieldEditModalProps> = ({
  isOpen,
  field,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    name: field?.name || '',
    type: field?.type || 'VARCHAR',
    length: field?.length || 255,
    isNullable: field?.isNullable ?? true,
    isPrimaryKey: field?.isPrimaryKey || false,
    isUnique: field?.isUnique || false,
    autoIncrement: field?.autoIncrement || false,
    defaultValue: field?.defaultValue || '',
    comment: field?.comment || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-bg-paper rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-border-primary">
          <h2 className="text-xl font-semibold text-text-primary">
            {field ? '编辑字段' : '添加字段'}
          </h2>
          <button onClick={onClose} className="btn-ghost">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              字段名 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="input w-full"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                类型 *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="input w-full"
              >
                <option value="VARCHAR">VARCHAR</option>
                <option value="TEXT">TEXT</option>
                <option value="INT">INT</option>
                <option value="BIGINT">BIGINT</option>
                <option value="DECIMAL">DECIMAL</option>
                <option value="DATETIME">DATETIME</option>
                <option value="TIMESTAMP">TIMESTAMP</option>
                <option value="BOOLEAN">BOOLEAN</option>
                <option value="JSON">JSON</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                长度
              </label>
              <input
                type="number"
                value={formData.length}
                onChange={(e) => setFormData(prev => ({ ...prev, length: parseInt(e.target.value) || 0 }))}
                className="input w-full"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isPrimaryKey}
                onChange={(e) => setFormData(prev => ({ ...prev, isPrimaryKey: e.target.checked }))}
                className="rounded border-border-primary"
              />
              <span className="text-sm text-text-secondary">主键</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={!formData.isNullable}
                onChange={(e) => setFormData(prev => ({ ...prev, isNullable: !e.target.checked }))}
                className="rounded border-border-primary"
              />
              <span className="text-sm text-text-secondary">不允许为空</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isUnique}
                onChange={(e) => setFormData(prev => ({ ...prev, isUnique: e.target.checked }))}
                className="rounded border-border-primary"
              />
              <span className="text-sm text-text-secondary">唯一约束</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.autoIncrement}
                onChange={(e) => setFormData(prev => ({ ...prev, autoIncrement: e.target.checked }))}
                className="rounded border-border-primary"
              />
              <span className="text-sm text-text-secondary">自动递增</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              默认值
            </label>
            <input
              type="text"
              value={formData.defaultValue}
              onChange={(e) => setFormData(prev => ({ ...prev, defaultValue: e.target.value }))}
              className="input w-full"
              placeholder="如: NULL, '', 0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              字段说明
            </label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
              className="input w-full"
              rows={3}
              placeholder="描述此字段的用途..."
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
              {field ? '更新' : '添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TableDetailModal