// packages/frontend/src/components/MindmapViewer/nodes/CategoryNode.tsx

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Folder, ChevronDown, ChevronRight } from 'lucide-react'
import { MindmapNodeData, MindmapNodeType } from '../../../types/mindmap'

interface CategoryNodeData extends MindmapNodeData {
  type: MindmapNodeType.CATEGORY
}

interface CategoryNodeProps extends NodeProps {
  data: CategoryNodeData
}

const CategoryNode: React.FC<CategoryNodeProps> = ({ data, selected }) => {
  const nodeColor = data.color || '#F59E0B' // amber-500
  const isCollapsed = data.isCollapsed || false

  return (
    <>
      {/* 输入连接点 */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-amber-400 !border-2 !border-bg-paper"
        isConnectable={true}
      />

      {/* 节点主体 */}
      <div
        className={`
          bg-bg-paper rounded-lg shadow-md border-2 transition-all duration-200
          ${selected ? 'border-amber-500 shadow-lg' : 'border-amber-200 hover:border-amber-300'}
        `}
        style={{ 
          width: 180, 
          height: isCollapsed ? 60 : 100,
          borderLeftColor: nodeColor,
          borderLeftWidth: '4px'
        }}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <Folder 
              className="w-4 h-4 flex-shrink-0" 
              style={{ color: nodeColor }} 
            />
            <h3 className="text-sm font-medium text-text-primary truncate">
              {data.label}
            </h3>
          </div>
          
          {/* 折叠/展开按钮 */}
          <button
            className="p-1 hover:bg-bg-tertiary rounded transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              // 触发折叠/展开逻辑
              console.log('Toggle collapse for category:', data.id)
            }}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>

        {/* 内容区域（非折叠时显示）*/}
        {!isCollapsed && (
          <div className="px-3 pb-3">
            {/* 描述 */}
            {data.description && (
              <p className="text-xs text-text-secondary mb-2 line-clamp-2">
                {data.description}
              </p>
            )}

            {/* 统计信息 */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {data.metadata?.childCount || 0} 个表
              </span>
              {data.metadata?.fieldCount && (
                <span>
                  {data.metadata.fieldCount} 字段
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 输出连接点 */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-amber-400 !border-2 !border-bg-paper"
        isConnectable={true}
      />
    </>
  )
}

export default memo(CategoryNode)