import { Folder, FolderOpen, Hash } from 'lucide-react'
import React, { memo } from 'react'
import { Handle, NodeProps, Position } from 'reactflow'

interface FieldGroupData {
  name: string
  fields: Array<{
    id: string
    name: string
    type: string
    isPrimaryKey?: boolean
  }>
  isExpanded: boolean
  color: string
  onToggle: () => void
}

const FieldGroupNode: React.FC<NodeProps<FieldGroupData>> = ({ data }) => {
  const { name, fields, isExpanded, color, onToggle } = data

  return (
    <div className="bg-bg-paper rounded-lg shadow-lg border-2 border-gray-200 min-w-[200px] max-w-[280px]">
      {/* 分组头部 */}
      <div
        className="px-3 py-2 rounded-t-lg cursor-pointer"
        style={{ backgroundColor: color + '20', borderColor: color }}
        onClick={onToggle}
      >
        <div className="flex items-center space-x-2">
          {isExpanded ? (
            <FolderOpen className="w-4 h-4" style={{ color }} />
          ) : (
            <Folder className="w-4 h-4" style={{ color }} />
          )}
          <span className="font-medium text-text-primary text-sm">{name}</span>
          <span className="text-xs text-gray-500">({fields.length})</span>
        </div>
      </div>

      {/* 字段列表 */}
      {isExpanded && (
        <div className="px-3 py-2 space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
          {fields.map(field => (
            <div key={field.id} className="flex items-center space-x-2 py-1">
              {field.isPrimaryKey ? (
                <Hash className="w-3 h-3 text-yellow-500" />
              ) : (
                <div className="w-3 h-3 rounded-full bg-gray-300" />
              )}
              <span className="text-sm text-text-primary flex-1 truncate">{field.name}</span>
              <span className="text-xs text-gray-500">{field.type}</span>
            </div>
          ))}

          {fields.length === 0 && (
            <div className="text-center py-2 text-xs text-gray-400">暂无字段</div>
          )}
        </div>
      )}

      {/* 连接点 */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2 bg-gray-400 border border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-2 bg-gray-400 border border-white"
      />
    </div>
  )
}

export default memo(FieldGroupNode)
