// packages/frontend/src/components/MindmapViewer/nodes/TableNode.tsx

import React, { memo, useMemo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Database, Key, Hash, Link, Eye, Settings } from 'lucide-react'
import { MindmapNodeData, MindmapNodeType } from '../../../types/mindmap'
import { DATA_MODEL_STATUS_COLORS } from '@shared/types'

interface TableNodeData extends MindmapNodeData {
  type: MindmapNodeType.TABLE
}

interface TableNodeProps extends NodeProps {
  data: TableNodeData
}

const TableNode: React.FC<TableNodeProps> = ({ data, selected }) => {
  // 计算节点大小
  const nodeSize = useMemo(() => {
    const fieldCount = data.fieldCount || 0
    if (fieldCount > 20) return 'large'
    if (fieldCount > 10) return 'medium'
    return 'small'
  }, [data.fieldCount])

  // 计算节点颜色
  const nodeColor = useMemo(() => {
    if (data.color) return data.color
    
    // 根据状态确定颜色
    switch (data.status) {
      case 'ACTIVE':
        return '#10B981' // green-500
      case 'DRAFT':
        return '#F59E0B' // amber-500
      case 'DEPRECATED':
        return '#EF4444' // red-500
      default:
        return '#6B7280' // gray-500
    }
  }, [data.color, data.status])

  // 尺寸映射
  const sizeMap = {
    small: { width: 200, height: 120 },
    medium: { width: 240, height: 140 },
    large: { width: 280, height: 160 }
  }

  const { width, height } = sizeMap[nodeSize]

  return (
    <>
      {/* 输入连接点 */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-gray-400 !border-2 !border-white"
        isConnectable={true}
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-gray-400 !border-2 !border-white"
        isConnectable={true}
      />

      {/* 节点主体 */}
      <div
        className={`
          bg-white rounded-lg shadow-md border-2 transition-all duration-200
          ${selected ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'}
          ${data.isCollapsed ? 'opacity-75' : ''}
        `}
        style={{ 
          width, 
          height,
          borderLeftColor: nodeColor,
          borderLeftWidth: '4px'
        }}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-3 border-b border-gray-100">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <Database 
              className="w-5 h-5 flex-shrink-0" 
              style={{ color: nodeColor }} 
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {data.label}
              </h3>
              {data.entityId && (
                <p className="text-xs text-gray-500 truncate">
                  {data.entityId}
                </p>
              )}
            </div>
          </div>
          
          {/* 状态标识 */}
          <div className="flex items-center space-x-1">
            {data.status && (
              <span 
                className="px-2 py-1 text-xs rounded-full font-medium"
                style={{
                  backgroundColor: `${nodeColor}20`,
                  color: nodeColor
                }}
              >
                {data.status === 'DRAFT' ? '草稿' : 
                 data.status === 'ACTIVE' ? '已创建' : '已废弃'}
              </span>
            )}
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-3">
          {/* 描述 */}
          {data.description && !data.isCollapsed && (
            <p className="text-xs text-gray-600 mb-3 line-clamp-2">
              {data.description}
            </p>
          )}

          {/* 统计信息 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-2">
              <Key className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-600">
                {data.fieldCount || 0} 字段
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Hash className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-600">
                {data.indexCount || 0} 索引
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Link className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-600">
                {data.relationshipCount || 0} 关联
              </span>
            </div>

            {data.category && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                <span className="text-xs text-gray-500 truncate">
                  {data.category}
                </span>
              </div>
            )}
          </div>

          {/* 扩展信息（非折叠时显示）*/}
          {!data.isCollapsed && data.metadata && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="flex flex-wrap gap-1">
                {Object.entries(data.metadata).slice(0, 3).map(([key, value]) => (
                  <span 
                    key={key}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                  >
                    {key}: {String(value)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 操作按钮（悬停时显示）*/}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center space-x-1">
            <button
              className="p-1 rounded bg-white shadow-sm hover:bg-gray-50 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                // 查看详情
                console.log('View table details:', data.entityId)
              }}
              title="查看详情"
            >
              <Eye className="w-3 h-3 text-gray-500" />
            </button>
            <button
              className="p-1 rounded bg-white shadow-sm hover:bg-gray-50 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                // 编辑设置
                console.log('Edit table settings:', data.entityId)
              }}
              title="编辑设置"
            >
              <Settings className="w-3 h-3 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* 输出连接点 */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-gray-400 !border-2 !border-white"
        isConnectable={true}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-gray-400 !border-2 !border-white"
        isConnectable={true}
      />
    </>
  )
}

export default memo(TableNode)