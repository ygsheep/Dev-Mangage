import React from 'react'
import { EdgeProps, getBezierPath } from 'reactflow'

const ReferenceEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
}) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          stroke: '#10b981',
          strokeWidth: 2,
        }}
        className="react-flow__edge-path"
        d={edgePath}
      />
      {data?.label && (
        <text
          x={(sourceX + targetX) / 2}
          y={(sourceY + targetY) / 2}
          className="text-xs fill-gray-600"
          textAnchor="middle"
          dy={-5}
        >
          {data.label}
        </text>
      )}
    </>
  )
}

export default ReferenceEdge