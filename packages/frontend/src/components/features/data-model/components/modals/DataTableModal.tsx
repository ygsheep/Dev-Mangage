import React, { useState } from 'react'
import { 
  X, 
  Database, 
  Table, 
  Key, 
  Type, 
  Hash,
  Edit3,
  Trash2,
  Plus,
  Search
} from 'lucide-react'
import { DatabaseTable, DatabaseFieldType, DATA_MODEL_STATUS_COLORS } from '@shared/types'
import SQLPreview from '../../../../common/SQLPreview'

interface DataTableModalProps {
  table: DatabaseTable | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (table: DatabaseTable) => void
  onDelete?: (tableId: string) => void
}

const DataTableModal: React.FC<DataTableModalProps> = ({
  table,
  isOpen,
  onClose,
  onEdit,
  onDelete
}) => {
  const [activeTab, setActiveTab] = useState<'fields' | 'indexes' | 'relationships' | 'sql'>('fields')
  const [searchQuery, setSearchQuery] = useState('')
  const [fieldTypeFilter, setFieldTypeFilter] = useState<DatabaseFieldType | ''>('')

  if (!isOpen || !table) return null

  const getFieldTypeColor = (type: DatabaseFieldType) => {
    const typeColors: Record<DatabaseFieldType, string> = {
      [DatabaseFieldType.VARCHAR]: 'bg-blue-100 text-blue-800',
      [DatabaseFieldType.INT]: 'bg-green-100 text-green-800',
      [DatabaseFieldType.BIGINT]: 'bg-green-100 text-green-800',
      [DatabaseFieldType.TEXT]: 'bg-purple-100 text-purple-800',
      [DatabaseFieldType.LONGTEXT]: 'bg-purple-100 text-purple-800',
      [DatabaseFieldType.TIMESTAMP]: 'bg-orange-100 text-orange-800',
      [DatabaseFieldType.DATE]: 'bg-orange-100 text-orange-800',
      [DatabaseFieldType.TIME]: 'bg-orange-100 text-orange-800',
      [DatabaseFieldType.DATETIME]: 'bg-orange-100 text-orange-800',
      [DatabaseFieldType.BOOLEAN]: 'bg-yellow-100 text-yellow-800',
      [DatabaseFieldType.DECIMAL]: 'bg-cyan-100 text-cyan-800',
      [DatabaseFieldType.FLOAT]: 'bg-cyan-100 text-cyan-800',
      [DatabaseFieldType.DOUBLE]: 'bg-cyan-100 text-cyan-800',
      [DatabaseFieldType.JSON]: 'bg-pink-100 text-pink-800',
      [DatabaseFieldType.ENUM]: 'bg-indigo-100 text-indigo-800',
      [DatabaseFieldType.BLOB]: 'bg-bg-tertiary text-text-primary',
      [DatabaseFieldType.LONGBLOB]: 'bg-bg-tertiary text-text-primary'
    }
    return typeColors[type] || 'bg-bg-tertiary text-text-primary'
  }

  const getFilteredFields = () => {
    if (!table.fields) return []
    
    let filtered = table.fields
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(field => 
        field.name.toLowerCase().includes(query) || 
        field.comment?.toLowerCase().includes(query)
      )
    }
    
    if (fieldTypeFilter) {
      filtered = filtered.filter(field => field.type === fieldTypeFilter)
    }
    
    return filtered.sort((a, b) => a.sortOrder - b.sortOrder)
  }

  const generateCreateTableSQL = () => {
    if (!table.fields) return ''
    
    const fieldDefinitions = table.fields
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(field => {
        let definition = `  ${field.name} ${field.type}`
        
        if (field.length) {
          definition += `(${field.length})`
        }
        
        if (!field.nullable) {
          definition += ' NOT NULL'
        }
        
        if (field.isAutoIncrement) {
          definition += ' AUTO_INCREMENT'
        }
        
        if (field.defaultValue) {
          definition += ` DEFAULT ${field.defaultValue}`
        }
        
        if (field.comment) {
          definition += ` COMMENT '${field.comment}'`
        }
        
        return definition
      })
    
    const primaryKeys = table.fields.filter(f => f.isPrimaryKey).map(f => f.name)
    if (primaryKeys.length > 0) {
      fieldDefinitions.push(`  PRIMARY KEY (${primaryKeys.join(', ')})`)
    }
    
    const indexes = table.indexes || []
    indexes.forEach(index => {
      if (index.type !== 'PRIMARY') {
        const indexType = index.isUnique ? 'UNIQUE INDEX' : 'INDEX'
        // 处理索引字段，支持新的数据结构
        const indexFields = index.fields || []
        const fieldNames = indexFields.map((field: any) => 
          typeof field === 'string' ? field : field.fieldName
        )
        fieldDefinitions.push(`  ${indexType} ${index.name} (${fieldNames.join(', ')})`)
      }
    })
    
    return `CREATE TABLE ${table.name} (
${fieldDefinitions.join(',\n')}
) ENGINE=${table.engine} DEFAULT CHARSET=${table.charset} COLLATE=${table.collation}${table.comment ? ` COMMENT='${table.comment}'` : ''};`
  }

  const filteredFields = getFilteredFields()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-paper rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-primary bg-gradient-header">
          <div className="flex items-center space-x-4">
            <Database className="w-8 h-8 text-blue-500" />
            <div>
              <h2 className="text-2xl font-semibold text-text-primary">
                {table.displayName || table.name}
              </h2>
              <p className="text-text-secondary">
                {table.name} • {table.engine} • {table.charset}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${DATA_MODEL_STATUS_COLORS[table.status]}`}>
              {table.status === 'DRAFT' ? '草稿' : table.status === 'ACTIVE' ? '已创建' : '已废弃'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {onEdit && (
              <button
                onClick={() => onEdit(table)}
                className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
                title="编辑表结构"
              >
                <Edit3 className="w-5 h-5 text-text-secondary" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(table.id)}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                title="删除数据表"
              >
                <Trash2 className="w-5 h-5 text-red-600" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 p-6 border-b border-border-primary bg-bg-tertiary">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{table.fields?.length || 0}</div>
            <div className="text-sm text-text-tertiary">字段数量</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{table.indexes?.length || 0}</div>
            <div className="text-sm text-text-tertiary">索引数量</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{table.relationshipCount || 0}</div>
            <div className="text-sm text-text-tertiary">关联关系</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{table.category || '-'}</div>
            <div className="text-sm text-text-tertiary">分类</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border-primary px-6">
          <button
            onClick={() => setActiveTab('fields')}
            className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'fields'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <Table className="w-4 h-4 mr-2" />
            字段结构 ({table.fields?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('indexes')}
            className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'indexes'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <Hash className="w-4 h-4 mr-2" />
            索引信息 ({table.indexes?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('relationships')}
            className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'relationships'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <Type className="w-4 h-4 mr-2" />
            关联关系 ({table.relationshipCount || 0})
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'sql'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <Database className="w-4 h-4 mr-2" />
            SQL语句
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[50vh] overflow-y-auto custom-scrollbar">
          {activeTab === 'fields' && (
            <div className="space-y-4">
              {/* Search and Filter */}
              <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary w-4 h-4" />
                  <input
                    type="text"
                    placeholder="搜索字段..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input pl-10"
                  />
                </div>
                <select
                  value={fieldTypeFilter}
                  onChange={(e) => setFieldTypeFilter(e.target.value as DatabaseFieldType | '')}
                  className="input w-auto min-w-[120px]"
                >
                  <option value="">所有类型</option>
                  {Object.values(DatabaseFieldType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <button className="btn-primary flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>添加字段</span>
                </button>
              </div>

              {/* Fields Table */}
              <div className="overflow-x-auto custom-scrollbar">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-bg-tertiary">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        字段名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        类型
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        长度
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        属性
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        默认值
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        注释
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
                          <div className="flex items-center">
                            {field.isPrimaryKey && (
                              <Key className="w-4 h-4 text-yellow-500 mr-2" />
                            )}
                            <span className={`font-medium ${field.isPrimaryKey ? 'text-yellow-700' : 'text-text-primary'}`}>
                              {field.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getFieldTypeColor(field.type)}`}>
                            {field.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                          {field.length || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {!field.nullable && (
                              <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                                NOT NULL
                              </span>
                            )}
                            {field.isAutoIncrement && (
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                AUTO_INCREMENT
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                          {field.defaultValue || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-text-tertiary max-w-xs truncate">
                          {field.comment || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-2">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredFields.length === 0 && (
                <div className="text-center py-12">
                  <Table className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-text-primary mb-2">
                    {searchQuery || fieldTypeFilter ? '没有找到匹配的字段' : '暂无字段'}
                  </h3>
                  <p className="text-text-secondary mb-6">
                    {searchQuery || fieldTypeFilter ? '请尝试调整搜索条件' : '开始为这个表添加字段'}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'indexes' && (
            <div className="text-center py-12">
              <Hash className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">索引管理</h3>
              <p className="text-text-secondary mb-6">
                管理数据表的索引信息，优化查询性能
              </p>
              <button className="btn-primary">
                添加索引
              </button>
            </div>
          )}

          {activeTab === 'relationships' && (
            <div className="text-center py-12">
              <Type className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">关联关系</h3>
              <p className="text-text-secondary mb-6">
                管理表与表之间的外键关系和数据关联
              </p>
              <button className="btn-primary">
                添加关联
              </button>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-text-primary">CREATE TABLE 语句</h3>
                <button 
                  className="btn-outline"
                  onClick={() => navigator.clipboard.writeText(generateCreateTableSQL())}
                >
                  复制SQL
                </button>
              </div>
              <SQLPreview
                sql={generateCreateTableSQL()}
                dialect="MySQL"
                title="CREATE TABLE语句"
                showLineNumbers={true}
                maxHeight="400px"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border-primary bg-bg-tertiary">
          <div className="text-sm text-text-tertiary">
            {table.comment && `说明: ${table.comment}`}
          </div>
          <button onClick={onClose} className="btn-outline">
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}

export default DataTableModal