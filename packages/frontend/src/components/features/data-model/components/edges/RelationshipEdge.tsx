import React from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
  MarkerType
} from 'reactflow'
import { Edit3, Trash2, Eye } from 'lucide-react'
import { TableRelationship } from '@shared/types'

interface RelationshipEdgeData {
  relationship: TableRelationship
  onEdit: () => void
  onDelete: () => void
}

const RelationshipEdge: React.FC<EdgeProps<RelationshipEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  })

  if (!data) return null

  const { relationship, onEdit, onDelete } = data

  const getRelationshipColor = (type: string) => {
    switch (type) {
      case 'ONE_TO_ONE':
        return '#3b82f6' // blue
      case 'ONE_TO_MANY':
        return '#10b981' // green
      case 'MANY_TO_MANY':
        return '#f59e0b' // amber
      default:
        return '#6b7280' // gray
    }
  }

  const getRelationshipLabel = (type: string) => {
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

  const color = getRelationshipColor(relationship.relationshipType)
  const label = getRelationshipLabel(relationship.relationshipType)

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: relationship.relationshipType === 'MANY_TO_MANY' ? '5,5' : undefined
        }}
        markerEnd={{
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color
        }}
      />
      
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all'
          }}
          className="group"
        >
          {/* 关系标签 */}
          <div 
            className={`bg-bg-paper border-2 rounded-lg px-2 py-1 shadow-sm transition-all duration-200 ${
              selected ? 'border-blue-500 shadow-lg' : 'border-gray-300'
            }`}
            style={{ borderColor: color }}
          >
            <div className="flex items-center space-x-2">
              <span 
                className="text-xs font-medium"
                style={{ color }}
              >
                {label}
              </span>
              {relationship.name && (
                <span className="text-xs text-gray-500 max-w-[100px] truncate">
                  {relationship.name}
                </span>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="bg-bg-paper rounded-lg shadow-lg border border-gray-200 flex items-center">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  // TODO: 查看关系详情
                }}
                className="p-2 hover:bg-bg-secondary rounded-l-lg transition-colors"
                title="查看详情"
              >
                <Eye className="w-3 h-3 text-gray-600" />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
                className="p-2 hover:bg-bg-secondary transition-colors border-x border-gray-200"
                title="编辑关系"
              >
                <Edit3 className="w-3 h-3 text-gray-600" />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                className="p-2 hover:bg-red-50 rounded-r-lg transition-colors"
                title="删除关系"
              >
                <Trash2 className="w-3 h-3 text-red-600" />
              </button>
            </div>
          </div>

          {/* 关系信息提示 */}
          {selected && (
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-8 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
              <div className="space-y-1">
                <div>类型: {relationship.relationshipType}</div>
                <div>更新: {relationship.onUpdate}</div>
                <div>删除: {relationship.onDelete}</div>
              </div>
              
              {/* 箭头 */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900" />
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export default RelationshipEdge