// packages/frontend/src/components/MindmapViewer/edges/HierarchyEdge.tsx

import React from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath, EdgeProps } from 'reactflow'
import { MindmapEdgeData } from '../../../types/mindmap'

interface HierarchyEdgeProps extends EdgeProps {
  data: MindmapEdgeData
}

const HierarchyEdge: React.FC<HierarchyEdgeProps> = ({
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
    targetPosition,
  })

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? '#3B82F6' : (data.color || '#9CA3AF'),
          strokeWidth: selected ? 3 : (data.width || 2),
          strokeDasharray: data.style === 'dashed' ? '5,5' : 
                          data.style === 'dotted' ? '2,2' : 'none'
        }}
      />
      
      {data.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 500,
              border: '1px solid #e5e7eb',
              color: '#374151',
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export default HierarchyEdge