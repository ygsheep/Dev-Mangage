import React, { useState, useCallback, useMemo } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  EdgeTypes,
  NodeTypes,
  MarkerType,
  BackgroundVariant
} from 'reactflow'
import 'reactflow/dist/style.css'
import {
  Database,
  Table,
  Plus,
  Settings,
  ZoomIn,
  ZoomOut,
  Download,
  Upload,
  Save,
  RefreshCw
} from 'lucide-react'
import { DatabaseTable, TableRelationship } from '@shared/types'

// 自定义节点类型
import TableNode from './nodes/TableNode'
import FieldGroupNode from './nodes/FieldGroupNode'

// 自定义边类型
import RelationshipEdge from './edges/RelationshipEdge'

const nodeTypes: NodeTypes = {
  tableNode: TableNode,
  fieldGroupNode: FieldGroupNode
}

const edgeTypes: EdgeTypes = {
  relationshipEdge: RelationshipEdge
}

interface ERDiagramDesignerProps {
  projectId: string
  tables: DatabaseTable[]
  relationships: TableRelationship[]
  onTableCreate?: (table: Omit<DatabaseTable, 'id'>) => void
  onTableUpdate?: (tableId: string, updates: Partial<DatabaseTable>) => void
  onTableDelete?: (tableId: string) => void
  onRelationshipCreate?: (relationship: Omit<TableRelationship, 'id'>) => void
  onRelationshipUpdate?: (relationshipId: string, updates: Partial<TableRelationship>) => void
  onRelationshipDelete?: (relationshipId: string) => void
  onSave?: () => void
}

const ERDiagramDesigner: React.FC<ERDiagramDesignerProps> = ({
  projectId,
  tables,
  relationships,
  onTableCreate,
  onTableUpdate,
  onTableDelete,
  onRelationshipCreate,
  onRelationshipUpdate,
  onRelationshipDelete,
  onSave
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [isDesignMode, setIsDesignMode] = useState(false)
  const [showMiniMap, setShowMiniMap] = useState(true)
  const [showBackground, setShowBackground] = useState(true)

  // 添加调试日志
  console.log('ERDiagramDesigner render:', {
    projectId,
    tablesCount: tables.length,
    relationshipsCount: relationships.length,
    tables: tables.map(t => ({ id: t.id, name: t.name, fieldsCount: t.fields?.length || 0 }))
  })

  // 初始化节点和边
  const initializeNodes = useCallback(() => {
    console.log('Initializing nodes with tables:', tables.length)
    const tableNodes: Node[] = tables.map((table, index) => ({
      id: table.id,
      type: 'tableNode',
      position: {
        x: (index % 4) * 300 + 50,
        y: Math.floor(index / 4) * 200 + 50
      },
      data: {
        table,
        isSelected: selectedTable === table.id,
        onSelect: () => setSelectedTable(table.id),
        onEdit: () => onTableUpdate?.(table.id, {}),
        onDelete: () => onTableDelete?.(table.id)
      },
      dragHandle: '.table-drag-handle'
    }))

    console.log('Created table nodes:', tableNodes.length)
    setNodes(tableNodes)
  }, [tables, selectedTable, onTableUpdate, onTableDelete, setNodes])

  const initializeEdges = useCallback(() => {
    const relationshipEdges: Edge[] = relationships.map((rel) => ({
      id: rel.id,
      source: rel.fromTableId,
      target: rel.toTableId,
      type: 'relationshipEdge',
      data: {
        relationship: rel,
        onEdit: () => onRelationshipUpdate?.(rel.id, {}),
        onDelete: () => onRelationshipDelete?.(rel.id)
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: '#6b7280'
      },
      style: {
        strokeWidth: 2,
        stroke: '#6b7280'
      }
    }))

    setEdges(relationshipEdges)
  }, [relationships, onRelationshipUpdate, onRelationshipDelete, setEdges])

  // 当数据变化时重新初始化
  React.useEffect(() => {
    initializeNodes()
  }, [initializeNodes])

  React.useEffect(() => {
    initializeEdges()
  }, [initializeEdges])

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target && params.source !== params.target) {
        const newRelationship = {
          fromTableId: params.source,
          toTableId: params.target,
          fromFieldId: '', // 需要通过对话框选择
          toFieldId: '', // 需要通过对话框选择
          relationshipType: 'ONE_TO_MANY' as const,
          onUpdate: 'RESTRICT' as const,
          onDelete: 'RESTRICT' as const,
          name: `fk_${params.source}_${params.target}`,
          projectId
        }
        
        onRelationshipCreate?.(newRelationship)
      }
    },
    [onRelationshipCreate, projectId]
  )

  const handleAddTable = () => {
    const newTable: Omit<DatabaseTable, 'id'> = {
      projectId,
      name: `table_${Date.now()}`,
      displayName: '新数据表',
      comment: '请添加表说明',
      engine: 'InnoDB',
      charset: 'utf8mb4',
      collation: 'utf8mb4_unicode_ci',
      status: 'DRAFT',
      category: '',
      version: 1,
      fields: [],
      indexes: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    onTableCreate?.(newTable)
  }

  const handleAutoLayout = () => {
    const layoutNodes = nodes.map((node, index) => {
      const row = Math.floor(index / 4)
      const col = index % 4
      return {
        ...node,
        position: {
          x: col * 320 + 50,
          y: row * 220 + 50
        }
      }
    })
    
    setNodes(layoutNodes)
  }

  const handleExportLayout = () => {
    const layout = {
      nodes: nodes.map(node => ({
        id: node.id,
        position: node.position,
        type: node.type
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type
      }))
    }
    
    const blob = new Blob([JSON.stringify(layout, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `er-diagram-${projectId}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImportLayout = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const layout = JSON.parse(e.target?.result as string)
            
            // 更新节点位置
            const updatedNodes = nodes.map(node => {
              const layoutNode = layout.nodes.find((n: any) => n.id === node.id)
              return layoutNode ? { ...node, position: layoutNode.position } : node
            })
            
            setNodes(updatedNodes)
          } catch (error) {
            console.error('Invalid layout file:', error)
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const proOptions = { hideAttribution: true }

  // 空状态检查
  if (!tables || tables.length === 0) {
    return (
      <div className="h-full bg-bg-secondary flex items-center justify-center">
        <div className="text-center">
          <Database className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">
            暂无数据表
          </h3>
          <p className="text-text-secondary mb-6">
            开始创建数据表来设计您的数据库结构
          </p>
          <button
            onClick={handleAddTable}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>创建第一个数据表</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-bg-primary relative" style={{ width: '100%', height: '100%' }}>
      {/* 工具栏 */}
      <div className="absolute top-4 left-4 z-10 bg-bg-paper rounded-lg shadow-lg border border-border-primary">
        <div className="flex items-center space-x-2 p-3">
          <button
            onClick={handleAddTable}
            className="flex items-center space-x-2 px-3 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
            title="添加数据表"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">添加表</span>
          </button>
          
          <div className="w-px h-6 bg-border-secondary" />
          
          <button
            onClick={handleAutoLayout}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-md transition-colors"
            title="自动布局"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setIsDesignMode(!isDesignMode)}
            className={`p-2 rounded-md transition-colors ${
              isDesignMode 
                ? 'bg-primary-100 text-primary-600' 
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
            }`}
            title="设计模式"
          >
            <Settings className="w-4 h-4" />
          </button>
          
          <div className="w-px h-6 bg-border-secondary" />
          
          <button
            onClick={handleExportLayout}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-md transition-colors"
            title="导出布局"
          >
            <Download className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleImportLayout}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-md transition-colors"
            title="导入布局"
          >
            <Upload className="w-4 h-4" />
          </button>
          
          <div className="w-px h-6 bg-border-secondary" />
          
          <button
            onClick={onSave}
            className="flex items-center space-x-2 px-3 py-2 bg-success-500 text-white rounded-md hover:bg-success-600 transition-colors"
            title="保存"
          >
            <Save className="w-4 h-4" />
            <span className="text-sm">保存</span>
          </button>
        </div>
      </div>

      {/* 视图选项 */}
      <div className="absolute top-4 right-4 z-10 bg-bg-paper rounded-lg shadow-lg border border-border-primary">
        <div className="flex items-center space-x-2 p-3">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={showMiniMap}
              onChange={(e) => setShowMiniMap(e.target.checked)}
              className="rounded border-border-primary"
            />
            <span>小地图</span>
          </label>
          
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={showBackground}
              onChange={(e) => setShowBackground(e.target.checked)}
              className="rounded border-border-primary"
            />
            <span>网格</span>
          </label>
        </div>
      </div>

      {/* ReactFlow 画布 */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode="loose"
        snapToGrid={true}
        snapGrid={[15, 15]}
        fitView
        attributionPosition="bottom-left"
        proOptions={proOptions}
        className="bg-bg-secondary"
        style={{ width: '100%', height: '100%' }}
      >
        {showBackground && (
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#e5e7eb"
          />
        )}
        
        <Controls
          position="bottom-right"
          showZoom={true}
          showFitView={true}
          showInteractive={false}
        />
        
        {showMiniMap && (
          <MiniMap
            position="bottom-left"
            zoomable
            pannable
            className="bg-bg-paper border border-border-primary rounded-lg"
            style={{ background: '#f9fafb' }}
          />
        )}
      </ReactFlow>

      {/* 表详情面板 */}
      {selectedTable && (
        <div className="absolute right-4 top-20 w-80 bg-bg-paper rounded-lg shadow-lg border border-border-primary z-10">
          <div className="p-4 border-b border-border-primary">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-text-primary">表详情</h3>
              <button
                onClick={() => setSelectedTable(null)}
                className="text-text-tertiary hover:text-text-secondary"
              >
                ×
              </button>
            </div>
          </div>
          
          <div className="p-4 max-h-96 overflow-y-auto scrollbar-thin">
            {(() => {
              const table = tables.find(t => t.id === selectedTable)
              if (!table) return null
              
              return (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      表名
                    </label>
                    <div className="text-sm text-text-primary">{table.name}</div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      显示名
                    </label>
                    <div className="text-sm text-text-primary">{table.displayName}</div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      字段数量
                    </label>
                    <div className="text-sm text-text-primary">{table.fields?.length || 0}</div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      状态
                    </label>
                    <div className="text-sm text-text-primary">{table.status}</div>
                  </div>
                  
                  {table.comment && (
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">
                        说明
                      </label>
                      <div className="text-sm text-text-secondary">{table.comment}</div>
                    </div>
                  )}
                  
                  <div className="pt-2 border-t border-border-primary">
                    <button
                      onClick={() => onTableUpdate?.(table.id, {})}
                      className="w-full btn-primary text-sm"
                    >
                      编辑表结构
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* 状态栏 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-bg-paper rounded-lg shadow-lg border border-border-primary px-4 py-2">
        <div className="flex items-center space-x-4 text-sm text-text-secondary">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span>{tables.length} 张表</span>
          </div>
          <div className="flex items-center space-x-2">
            <Table className="w-4 h-4" />
            <span>{relationships.length} 个关系</span>
          </div>
          {selectedTable && (
            <div className="flex items-center space-x-2 text-primary-600">
              <span>已选择: {tables.find(t => t.id === selectedTable)?.displayName}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ERDiagramDesigner