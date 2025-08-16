import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import {
  Database,
  Key,
  Hash,
  Edit3,
  Trash2,
  MoreVertical,
  Eye,
  Copy
} from 'lucide-react'
import { DatabaseTable, DatabaseFieldType, DATA_MODEL_STATUS_COLORS } from '@shared/types'

interface TableNodeData {
  table: DatabaseTable
  isSelected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}

const TableNode: React.FC<NodeProps<TableNodeData>> = ({ data, selected }) => {
  const { table, isSelected, onSelect, onEdit, onDelete } = data

  const getFieldTypeIcon = (type: DatabaseFieldType) => {
    if (type.includes('INT') || type.includes('DECIMAL') || type.includes('FLOAT')) {
      return '#'
    }
    if (type.includes('VARCHAR') || type.includes('TEXT')) {
      return 'T'
    }
    if (type.includes('DATE') || type.includes('TIME')) {
      return '📅'
    }
    if (type === 'BOOLEAN') {
      return '✓'
    }
    return '•'
  }

  const getFieldTypeColor = (type: DatabaseFieldType) => {
    if (type.includes('INT') || type.includes('DECIMAL') || type.includes('FLOAT')) {
      return 'text-green-600'
    }
    if (type.includes('VARCHAR') || type.includes('TEXT')) {
      return 'text-blue-600'
    }
    if (type.includes('DATE') || type.includes('TIME')) {
      return 'text-orange-600'
    }
    if (type === 'BOOLEAN') {
      return 'text-purple-600'
    }
    return 'text-gray-600'
  }

  const primaryKeys = table.fields?.filter(f => f.isPrimaryKey) || []
  const regularFields = table.fields?.filter(f => !f.isPrimaryKey).slice(0, 8) || []
  const hasMoreFields = (table.fields?.length || 0) > primaryKeys.length + 8

  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-lg shadow-lg border-2 transition-all duration-200 cursor-pointer min-w-[280px] max-w-[320px] ${
        selected || isSelected
          ? 'border-blue-500 shadow-xl'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
      }`}
    >
      {/* 表头 */}
      <div className="table-drag-handle bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 rounded-t-lg border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <Database className="w-5 h-5 text-gray-600 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 truncate text-sm">
                {table.displayName || table.name}
              </h3>
              <p className="text-xs text-gray-500 truncate">
                {table.name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <span className={`px-2 py-1 rounded text-xs font-medium ${DATA_MODEL_STATUS_COLORS[table.status]}`}>
              {table.status === 'DRAFT' ? '草稿' : table.status === 'ACTIVE' ? '活跃' : '废弃'}
            </span>
            
            <div className="relative group">
              <button className="p-1 hover:bg-gray-200 rounded">
                <MoreVertical className="w-4 h-4 text-gray-500" />
              </button>
              
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 min-w-[120px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit()
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>编辑</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    // TODO: 复制表结构
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Copy className="w-4 h-4" />
                  <span>复制</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    // TODO: 查看详情
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Eye className="w-4 h-4" />
                  <span>详情</span>
                </button>
                <hr className="my-1 border-gray-200" />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>删除</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* 表统计信息 */}
        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
          <span>{table.fields?.length || 0} 字段</span>
          <span>{table.indexes?.length || 0} 索引</span>
          <span>{table.engine}</span>
        </div>
      </div>

      {/* 字段列表 */}
      <div className="px-4 py-3 space-y-1 max-h-64 overflow-y-auto">
        {/* 主键字段 */}
        {primaryKeys.map((field) => (
          <div key={field.id} className="flex items-center space-x-2 py-1">
            <Key className="w-3 h-3 text-yellow-500 flex-shrink-0" />
            <span className="font-medium text-gray-900 text-sm flex-1 truncate">
              {field.name}
            </span>
            <span className={`text-xs ${getFieldTypeColor(field.type)}`}>
              {getFieldTypeIcon(field.type)}
            </span>
            <span className="text-xs text-gray-500 w-12 text-right">
              {field.type}
            </span>
          </div>
        ))}
        
        {/* 分隔线 */}
        {primaryKeys.length > 0 && regularFields.length > 0 && (
          <hr className="border-gray-200 my-2" />
        )}
        
        {/* 普通字段 */}
        {regularFields.map((field) => (
          <div key={field.id} className="flex items-center space-x-2 py-1">
            <div className="w-3 h-3 flex-shrink-0">
              {!field.nullable && (
                <div className="w-2 h-2 bg-red-400 rounded-full" title="NOT NULL" />
              )}
            </div>
            <span className="text-gray-700 text-sm flex-1 truncate">
              {field.name}
            </span>
            <span className={`text-xs ${getFieldTypeColor(field.type)}`}>
              {getFieldTypeIcon(field.type)}
            </span>
            <span className="text-xs text-gray-500 w-12 text-right">
              {field.type}
            </span>
          </div>
        ))}
        
        {/* 更多字段指示器 */}
        {hasMoreFields && (
          <div className="flex items-center justify-center py-2 text-xs text-gray-500">
            <span>+ {(table.fields?.length || 0) - primaryKeys.length - regularFields.length} 个字段</span>
          </div>
        )}
        
        {/* 空状态 */}
        {(!table.fields || table.fields.length === 0) && (
          <div className="text-center py-4 text-gray-400">
            <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">暂无字段</p>
          </div>
        )}
      </div>

      {/* 表说明 */}
      {table.comment && (
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 rounded-b-lg">
          <p className="text-xs text-gray-600 line-clamp-2">
            {table.comment}
          </p>
        </div>
      )}

      {/* 连接点 */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
        style={{ left: -6 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
        style={{ right: -6 }}
      />
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
        style={{ top: -6 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
        style={{ bottom: -6 }}
      />
    </div>
  )
}

export default memo(TableNode)