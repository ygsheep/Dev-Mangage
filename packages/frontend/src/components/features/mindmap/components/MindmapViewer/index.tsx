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
import './MindmapViewer.css'

import { MindmapNode, MindmapEdge, MindmapConfig, MindmapState } from '../../../../../types/mindmap'
import MindmapToolbar from './MindmapToolbar'
import MindmapSidebar from './MindmapSidebar'
import { useMindmapStore } from '../../../../../stores/mindmapStore'
import { mindmapLayoutService } from '../../../../../services/mindmapLayoutService'
import { mindmapDataTransformer } from '../../../../../services/mindmapDataTransformer'

// 自定义节点组件
import ProjectNode from './nodes/ProjectNode'
import TableNode from './nodes/TableNode'
import CategoryNode from './nodes/CategoryNode'
import FieldGroupNode from './nodes/FieldGroupNode'

// 自定义边组件
import HierarchyEdge from './edges/HierarchyEdge'
import ForeignKeyEdge from './edges/ForeignKeyEdge'
import ReferenceEdge from './edges/ReferenceEdge'

// 导出功能辅助函数
const exportToPNG = async (element: HTMLElement, filename: string) => {
  console.log('📸 开始PNG导出:', filename)
  try {
    console.log('📦 导入html2canvas...')
    const html2canvas = (await import('html2canvas')).default
    console.log('✅ html2canvas导入成功')
    
    console.log('🎨 开始截图，元素大小:', {
      width: element.scrollWidth,
      height: element.scrollHeight
    })
    
    const canvas = await html2canvas(element, {
      backgroundColor: '#f9fafb',
      width: element.scrollWidth,
      height: element.scrollHeight,
      scale: 1,
      useCORS: true,
      allowTaint: true
    })
    
    console.log('✅ 截图完成')
    const link = document.createElement('a')
    link.download = `${filename}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    console.log('🎉 PNG导出成功:', filename)
  } catch (error) {
    console.error('❌ PNG导出失败:', error)
    throw error
  }
}

const exportToSVG = async (element: HTMLElement, filename: string) => {
  try {
    // 简化的SVG导出实现
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${element.scrollWidth}" height="${element.scrollHeight}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml">
            ${element.innerHTML}
          </div>
        </foreignObject>
      </svg>
    `
    
    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `${filename}.svg`
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('SVG导出失败:', error)
    throw error
  }
}

const exportToPDF = async (element: HTMLElement, filename: string) => {
  try {
    // 使用html2canvas先转换为图片，然后创建PDF
    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(element, {
      backgroundColor: '#f9fafb',
      width: element.scrollWidth,
      height: element.scrollHeight,
      scale: 1,
      useCORS: true,
      allowTaint: true
    })
    
    // 简化的PDF导出（暂时导出为PNG，后续可以集成jsPDF）
    const link = document.createElement('a')
    link.download = `${filename}.png` // 暂时导出为PNG
    link.href = canvas.toDataURL('image/png')
    link.click()
  } catch (error) {
    console.error('PDF导出失败:', error)
    throw error
  }
}

const exportToJSON = async (nodes: any[], edges: any[], config: any, filename: string) => {
  try {
    const data = {
      nodes,
      edges,
      config,
      exportTime: new Date().toISOString(),
      version: '1.0.0'
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `${filename}.json`
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('JSON导出失败:', error)
    throw error
  }
}

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
  const { fitView, zoomIn, zoomOut, setViewport, getViewport } = useReactFlow()

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

  // 视口变化处理 - 在新版本 ReactFlow 中不再需要

  // 工具栏操作处理
  const handleLayoutChange = useCallback((layoutType: string) => {
    applyLayout(layoutType as any)
  }, [applyLayout])

  const handleConfigChange = useCallback((newConfig: Partial<MindmapConfig>) => {
    updateConfig(newConfig)
  }, [updateConfig])

  const handleFitView = useCallback(() => {
    // 适应视图
    try {
      if (fitView) {
        fitView({ duration: 800, padding: 0.1 })
      }
    } catch (error) {
      console.warn('无法调用 fitView:', error)
    }
  }, [fitView])

  const handleZoomIn = useCallback(() => {
    try {
      if (zoomIn) {
        zoomIn({ duration: 200 })
      }
    } catch (error) {
      console.warn('无法调用 zoomIn:', error)
    }
  }, [zoomIn])

  const handleZoomOut = useCallback(() => {
    try {
      if (zoomOut) {
        zoomOut({ duration: 200 })
      }
    } catch (error) {
      console.warn('无法调用 zoomOut:', error)
    }
  }, [zoomOut])

  const handleResetView = useCallback(() => {
    try {
      if (setViewport) {
        setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 800 })
      }
    } catch (error) {
      console.warn('无法重置视图:', error)
    }
  }, [setViewport])

  const handleExport = useCallback(async (format: string) => {
    console.log('🎨 开始导出:', format)
    try {
      const reactFlowElement = reactFlowWrapper.current?.querySelector('.react-flow')
      if (!reactFlowElement) {
        console.error('❌ React Flow element not found')
        throw new Error('React Flow element not found')
      }

      console.log('✅ 找到React Flow元素:', reactFlowElement)
      const projectName = `mindmap-${projectId}-${Date.now()}`
      console.log('📁 文件名:', projectName)

      switch (format) {
        case 'png':
          await exportToPNG(reactFlowElement as HTMLElement, projectName)
          break
        case 'svg':
          await exportToSVG(reactFlowElement as HTMLElement, projectName)
          break
        case 'pdf':
          await exportToPDF(reactFlowElement as HTMLElement, projectName)
          break
        case 'json':
          await exportToJSON(nodes_state, edges_state, config, projectName)
          break
        default:
          console.warn('不支持的导出格式:', format)
      }
    } catch (error) {
      console.error('导出失败:', error)
      // 这里可以添加 toast 通知
    }
  }, [projectId, nodes_state, edges_state, config])

  const handleRefresh = useCallback(() => {
    loadMindmapData(projectId)
  }, [loadMindmapData, projectId])

  const handleFullscreen = useCallback(async () => {
    try {
      const element = reactFlowWrapper.current
      if (!element) {
        console.warn('React Flow 容器未找到')
        return
      }

      if (!document.fullscreenElement) {
        // 进入全屏
        if (element.requestFullscreen) {
          await element.requestFullscreen()
        } else if ((element as any).webkitRequestFullscreen) {
          await (element as any).webkitRequestFullscreen()
        } else if ((element as any).mozRequestFullScreen) {
          await (element as any).mozRequestFullScreen()
        } else if ((element as any).msRequestFullscreen) {
          await (element as any).msRequestFullscreen()
        }
      } else {
        // 退出全屏
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen()
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen()
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen()
        }
      }
    } catch (error) {
      console.warn('全屏切换失败:', error)
    }
  }, [])

  return (
    <div className={`mindmap-viewer flex flex-col ${className}`} style={{ height }}>
      {/* 工具栏 */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white relative z-40">
        <MindmapToolbar
          config={config}
          onLayoutChange={handleLayoutChange}
          onConfigChange={handleConfigChange}
          onFitView={handleFitView}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetView={handleResetView}
          onExport={handleExport}
          onRefresh={handleRefresh}
          onFullscreen={handleFullscreen}
        />
      </div>

      {/* 主视图区域 */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* 侧边栏 */}
        <div className="flex-shrink-0 w-80 border-r border-gray-200 bg-white overflow-y-auto">
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
        </div>

        {/* ReactFlow 容器 */}
        <div className="flex-1 relative min-h-0" ref={reactFlowWrapper}>
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
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            attributionPosition="bottom-left"
            className="bg-gray-50 w-full h-full"
            style={{ width: '100%', height: '100%' }}
          >
            {/* 控制面板 */}
            <Controls 
              position="bottom-right"
              showFitView={true}
              showInteractive={true}
              className="react-flow__controls"
            />
            
            {/* 小地图 */}
            <MiniMap 
              position="top-right"
              nodeColor={(node) => {
                switch (node.type) {
                  case 'project': return '#3B82F6'
                  case 'table': return '#10B981'
                  case 'category': return '#F59E0B'
                  default: return '#6B7280'
                }
              }}
              className="bg-white border border-gray-200 rounded-lg shadow-sm"
              style={{ width: 200, height: 150 }}
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
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-600">正在加载关系图谱...</span>
                  </div>
                </div>
              </Panel>
            )}

            {/* 空数据状态 */}
            {!isLoading && nodes_state.length === 0 && (
              <Panel position="center">
                <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    暂无数据表关系
                  </h3>
                  <p className="text-gray-600 mb-4">
                    请先在"数据模型"标签页中导入数据库设计文档，或手动创建数据表
                  </p>
                  <div className="text-sm text-gray-500">
                    支持的操作：
                    <br />• 导入 Markdown 格式的数据库文档
                    <br />• 手动创建数据表和字段
                    <br />• 建立表之间的关系
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