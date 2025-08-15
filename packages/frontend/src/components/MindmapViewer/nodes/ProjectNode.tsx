// packages/frontend/src/components/MindmapViewer/nodes/ProjectNode.tsx

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { FolderOpen, Database, Tag, Activity } from 'lucide-react'
import { MindmapNodeData, MindmapNodeType } from '../../../types/mindmap'

interface ProjectNodeData extends MindmapNodeData {
  type: MindmapNodeType.PROJECT
}

interface ProjectNodeProps extends NodeProps {
  data: ProjectNodeData
}

const ProjectNode: React.FC<ProjectNodeProps> = ({ data, selected }) => {
  const nodeColor = data.color || '#3B82F6' // blue-500

  return (
    <>
      {/* 节点主体 */}
      <div
        className={`
          bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-lg border-3 transition-all duration-200
          ${selected ? 'border-blue-500 shadow-xl scale-105' : 'border-blue-200 hover:border-blue-300'}
        `}
        style={{ 
          width: 320, 
          height: 180,
          borderColor: nodeColor
        }}
      >
        {/* 标题区域 */}
        <div className="p-4 text-center">
          <div className="flex justify-center mb-3">
            <div 
              className="p-3 rounded-full"
              style={{ backgroundColor: `${nodeColor}20` }}
            >
              <FolderOpen 
                className="w-8 h-8" 
                style={{ color: nodeColor }}
              />
            </div>
          </div>
          
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            {data.label}
          </h2>
          
          {data.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {data.description}
            </p>
          )}
        </div>

        {/* 统计信息 */}
        <div className="px-4 pb-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="flex justify-center mb-1">
                <Database className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {data.metadata?.tableCount || 0}
              </div>
              <div className="text-xs text-gray-500">数据表</div>
            </div>
            
            <div className="text-center">
              <div className="flex justify-center mb-1">
                <Tag className="w-5 h-5 text-orange-500" />
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {data.metadata?.tagCount || 0}
              </div>
              <div className="text-xs text-gray-500">标签</div>
            </div>
            
            <div className="text-center">
              <div className="flex justify-center mb-1">
                <Activity className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {data.metadata?.relationCount || 0}
              </div>
              <div className="text-xs text-gray-500">关系</div>
            </div>
          </div>
        </div>
      </div>

      {/* 输出连接点（项目节点通常只有输出）*/}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-4 h-4 !bg-blue-500 !border-2 !border-white"
        isConnectable={true}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-4 h-4 !bg-blue-500 !border-2 !border-white"
        isConnectable={true}
      />
      <Handle
        type="source"
        position={Position.Left}
        className="w-4 h-4 !bg-blue-500 !border-2 !border-white"
        isConnectable={true}
      />
    </>
  )
}

export default memo(ProjectNode)