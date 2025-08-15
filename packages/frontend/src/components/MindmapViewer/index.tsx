// packages/frontend/src/components/MindmapViewer/index.tsx

import React, { useCallback, useEffect, useRef, useState } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  ReactFlowProvider,
  Controls,
  MiniMap,
  Background,
  useReactFlow,
  Panel,
  NodeTypes,
  EdgeTypes
} from 'reactflow'
import 'reactflow/dist/style.css'

import { MindmapNode, MindmapEdge, MindmapConfig, MindmapState } from '../../types/mindmap'
import MindmapToolbar from './MindmapToolbar'
import MindmapSidebar from './MindmapSidebar'
import { useMindmapStore } from '../../stores/mindmapStore'
import { mindmapLayoutService } from '../../services/mindmapLayoutService'
import { mindmapDataTransformer } from '../../services/mindmapDataTransformer'

// 自定义节点组件
import ProjectNode from './nodes/ProjectNode'
import TableNode from './nodes/TableNode'
import CategoryNode from './nodes/CategoryNode'
import FieldGroupNode from './nodes/FieldGroupNode'

// 自定义边组件
import HierarchyEdge from './edges/HierarchyEdge'
import ForeignKeyEdge from './edges/ForeignKeyEdge'
import ReferenceEdge from './edges/ReferenceEdge'

interface MindmapViewerProps {
  projectId: string
  className?: string
  height?: string | number
  onNodeSelect?: (node: MindmapNode | null) => void
  onEdgeSelect?: (edge: MindmapEdge | null) => void
  onNodesChange?: (nodes: MindmapNode[]) => void
  onEdgesChange?: (edges: MindmapEdge[]) => void
}

// 自定义节点类型映射
const nodeTypes: NodeTypes = {
  project: ProjectNode,
  table: TableNode,
  category: CategoryNode,
  fieldGroup: FieldGroupNode,
}

// 自定义边类型映射
const edgeTypes: EdgeTypes = {
  hierarchy: HierarchyEdge,
  foreignKey: ForeignKeyEdge,
  reference: ReferenceEdge,
  dependency: ReferenceEdge, // 复用reference样式
}

const MindmapViewerInner: React.FC<MindmapViewerProps> = ({
  projectId,
  className = '',
  height = '100%',
  onNodeSelect,
  onEdgeSelect,
  onNodesChange,
  onEdgesChange
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { project, setViewport, getViewport } = useReactFlow()

  // 状态管理
  const {
    nodes,
    edges,
    config,
    isLoading,
    selectedNodeIds,
    selectedEdgeIds,
    setNodes,
    setEdges,
    setSelectedNodeIds,
    setSelectedEdgeIds,
    loadMindmapData,
    updateConfig,
    applyLayout
  } = useMindmapStore()

  const [nodes_state, setNodes_state, onNodesChange_internal] = useNodesState([])
  const [edges_state, setEdges_state, onEdgesChange_internal] = useEdgesState([])

  // 同步状态
  useEffect(() => {
    setNodes_state(nodes)
  }, [nodes, setNodes_state])

  useEffect(() => {
    setEdges_state(edges)
  }, [edges, setEdges_state])

  // 加载数据
  useEffect(() => {
    loadMindmapData(projectId)
  }, [projectId, loadMindmapData])

  // 节点选择处理
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const mindmapNode = node as MindmapNode
    setSelectedNodeIds([node.id])
    setSelectedEdgeIds([])
    onNodeSelect?.(mindmapNode)
  }, [setSelectedNodeIds, setSelectedEdgeIds, onNodeSelect])

  // 边选择处理
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    const mindmapEdge = edge as MindmapEdge
    setSelectedEdgeIds([edge.id])
    setSelectedNodeIds([])
    onEdgeSelect?.(mindmapEdge)
  }, [setSelectedEdgeIds, setSelectedNodeIds, onEdgeSelect])

  // 连接处理
  const onConnect = useCallback((params: Connection) => {
    const newEdge: MindmapEdge = {
      id: `edge-${params.source}-${params.target}`,
      source: params.source!,
      target: params.target!,
      type: 'reference',
      data: {
        id: `edge-${params.source}-${params.target}`,
        type: 'reference' as any,
        style: 'solid'
      }
    }
    setEdges_state((edges) => addEdge(newEdge, edges))
  }, [setEdges_state])

  // 拖拽结束处理
  const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    // 如果启用了自动布局，则重新计算布局
    if (config.interaction.autoLayout) {
      applyLayout(config.layout.type)
    }
  }, [config.interaction.autoLayout, config.layout.type, applyLayout])

  // 画布点击处理（取消选择）
  const onPaneClick = useCallback(() => {
    setSelectedNodeIds([])
    setSelectedEdgeIds([])
    onNodeSelect?.(null)
    onEdgeSelect?.(null)
  }, [setSelectedNodeIds, setSelectedEdgeIds, onNodeSelect, onEdgeSelect])

  // 视口变化处理
  const onViewportChange = useCallback((viewport: { x: number, y: number, zoom: number }) => {
    setViewport(viewport, { duration: 0 })
  }, [setViewport])

  // 工具栏操作处理
  const handleLayoutChange = useCallback((layoutType: string) => {
    applyLayout(layoutType as any)
  }, [applyLayout])

  const handleConfigChange = useCallback((newConfig: Partial<MindmapConfig>) => {
    updateConfig(newConfig)
  }, [updateConfig])

  const handleFitView = useCallback(() => {
    // 适应视图
    const { fitView } = project()
    fitView({ duration: 800 })
  }, [project])

  const handleExport = useCallback(async (format: string) => {
    // 导出功能
    console.log('Export to:', format)
  }, [])

  return (
    <div className={`mindmap-viewer ${className}`} style={{ height }}>
      {/* 工具栏 */}
      <MindmapToolbar
        config={config}
        onLayoutChange={handleLayoutChange}
        onConfigChange={handleConfigChange}
        onFitView={handleFitView}
        onExport={handleExport}
      />

      {/* 主视图区域 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 侧边栏 */}
        <MindmapSidebar
          selectedNodeIds={selectedNodeIds}
          selectedEdgeIds={selectedEdgeIds}
          onNodeUpdate={(nodeId, updates) => {
            const updatedNodes = nodes_state.map(node => 
              node.id === nodeId ? { ...node, data: { ...node.data, ...updates } } : node
            )
            setNodes_state(updatedNodes)
            onNodesChange?.(updatedNodes as MindmapNode[])
          }}
          onEdgeUpdate={(edgeId, updates) => {
            const updatedEdges = edges_state.map(edge => 
              edge.id === edgeId ? { ...edge, data: { ...edge.data, ...updates } } : edge
            )
            setEdges_state(updatedEdges)
            onEdgesChange?.(updatedEdges as MindmapEdge[])
          }}
        />

        {/* ReactFlow 容器 */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes_state}
            edges={edges_state}
            onNodesChange={onNodesChange_internal}
            onEdgesChange={onEdgesChange_internal}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onConnect={onConnect}
            onNodeDragStop={onNodeDragStop}
            onPaneClick={onPaneClick}
            onViewportChange={onViewportChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            attributionPosition="bottom-left"
            className="bg-gray-50"
          >
            {/* 控制面板 */}
            <Controls 
              position="bottom-right"
              showFitView={false}
              showInteractive={false}
            />
            
            {/* 小地图 */}
            <MiniMap 
              position="bottom-left"
              nodeColor={(node) => {
                switch (node.type) {
                  case 'project': return '#3B82F6'
                  case 'table': return '#10B981'
                  case 'category': return '#F59E0B'
                  default: return '#6B7280'
                }
              }}
              className="bg-white border border-gray-200 rounded-lg"
            />
            
            {/* 背景 */}
            <Background 
              variant="dots" 
              gap={20} 
              size={1}
              color="#E5E7EB"
            />

            {/* 加载状态 */}
            {isLoading && (
              <Panel position="center">
                <div className="bg-white p-4 rounded-lg shadow-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-600">加载中...</span>
                  </div>
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>
      </div>
    </div>
  )
}

const MindmapViewer: React.FC<MindmapViewerProps> = (props) => {
  return (
    <ReactFlowProvider>
      <MindmapViewerInner {...props} />
    </ReactFlowProvider>
  )
}

export default MindmapViewer