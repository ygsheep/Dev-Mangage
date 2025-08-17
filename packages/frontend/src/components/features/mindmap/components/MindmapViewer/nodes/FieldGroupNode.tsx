// packages/frontend/src/components/MindmapViewer/nodes/FieldGroupNode.tsx

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Layers, ChevronDown, ChevronRight } from 'lucide-react'
import { MindmapNodeData, MindmapNodeType } from '../../../types/mindmap'

interface FieldGroupNodeData extends MindmapNodeData {
  type: MindmapNodeType.FIELD_GROUP
}

interface FieldGroupNodeProps extends NodeProps {
  data: FieldGroupNodeData
}

const FieldGroupNode: React.FC<FieldGroupNodeProps> = ({ data, selected }) => {
  const nodeColor = data.color || '#8B5CF6' // purple-500
  const isCollapsed = data.isCollapsed || false

  return (
    <>
      {/* 输入连接点 */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 !bg-purple-400 !border-2 !border-white"
        isConnectable={true}
      />

      {/* 节点主体 */}
      <div
        className={`
          bg-white rounded-md shadow-sm border-2 transition-all duration-200
          ${selected ? 'border-purple-500 shadow-md' : 'border-purple-200 hover:border-purple-300'}
        `}
        style={{ 
          width: 160, 
          height: isCollapsed ? 50 : 80,
          borderLeftColor: nodeColor,
          borderLeftWidth: '3px'
        }}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <Layers 
              className="w-3 h-3 flex-shrink-0" 
              style={{ color: nodeColor }} 
            />
            <h4 className="text-xs font-medium text-text-primary truncate">
              {data.label}
            </h4>
          </div>
          
          {/* 折叠/展开按钮 */}
          <button
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              console.log('Toggle collapse for field group:', data.id)
            }}
          >
            {isCollapsed ? (
              <ChevronRight className="w-3 h-3 text-gray-400" />
            ) : (
              <ChevronDown className="w-3 h-3 text-gray-400" />
            )}
          </button>
        </div>

        {/* 内容区域（非折叠时显示）*/}
        {!isCollapsed && (
          <div className="px-2 pb-2">
            {/* 描述 */}
            {data.description && (
              <p className="text-xs text-gray-500 mb-1 line-clamp-1">
                {data.description}
              </p>
            )}

            {/* 统计信息 */}
            <div className="text-xs text-gray-500">
              {data.fieldCount || 0} 个字段
            </div>
          </div>
        )}
      </div>

      {/* 输出连接点 */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 !bg-purple-400 !border-2 !border-white"
        isConnectable={true}
      />
    </>
  )
}

export default memo(FieldGroupNode)