// packages/frontend/src/stores/mindmapStore.ts

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { 
  MindmapNode, 
  MindmapEdge, 
  MindmapConfig, 
  MindmapState,
  MindmapNodeType,
  MindmapEdgeType 
} from '../types/mindmap'
import { mindmapDataTransformer } from '../services/mindmapDataTransformer'
import { mindmapLayoutService } from '../services/mindmapLayoutService'
import { apiMethods } from '../utils/api'

interface MindmapStore extends MindmapState {
  // 数据操作
  loadMindmapData: (projectId: string) => Promise<void>
  setNodes: (nodes: MindmapNode[]) => void
  setEdges: (edges: MindmapEdge[]) => void
  addNode: (node: MindmapNode) => void
  removeNode: (nodeId: string) => void
  updateNode: (nodeId: string, updates: Partial<MindmapNode>) => void
  addEdge: (edge: MindmapEdge) => void
  removeEdge: (edgeId: string) => void
  updateEdge: (edgeId: string, updates: Partial<MindmapEdge>) => void

  // 选择操作
  setSelectedNodeIds: (nodeIds: string[]) => void
  setSelectedEdgeIds: (edgeIds: string[]) => void
  clearSelection: () => void

  // 配置操作
  updateConfig: (config: Partial<MindmapConfig>) => void
  resetConfig: () => void

  // 布局操作
  applyLayout: (layoutType: string) => Promise<void>
  saveLayout: () => Promise<void>
  resetLayout: () => void

  // 视图操作
  setViewport: (viewport: { x: number, y: number, zoom: number }) => void
  fitToView: () => void

  // 筛选操作
  applyFilters: () => void
  getFilteredNodes: () => MindmapNode[]
  getFilteredEdges: () => MindmapEdge[]

  // 导出操作
  exportMindmap: (format: string, options?: any) => Promise<string | Blob>
}

// 默认配置
const defaultConfig: MindmapConfig = {
  layout: {
    type: 'hierarchical',
    direction: 'TB',
    spacing: {
      node: 100,
      level: 150
    },
    animation: {
      enabled: true,
      duration: 300
    }
  },
  display: {
    showLabels: true,
    showIcons: true,
    showStatistics: true,
    showRelationshipLabels: true,
    compactMode: false
  },
  interaction: {
    enableDrag: true,
    enableZoom: true,
    enableSelection: true,
    enableCollapse: true,
    autoLayout: false
  },
  filters: {
    nodeTypes: [MindmapNodeType.PROJECT, MindmapNodeType.CATEGORY, MindmapNodeType.TABLE],
    edgeTypes: [MindmapEdgeType.HIERARCHY, MindmapEdgeType.FOREIGN_KEY, MindmapEdgeType.REFERENCE],
    categories: [],
    statuses: ['DRAFT', 'ACTIVE', 'DEPRECATED']
  }
}

export const useMindmapStore = create<MindmapStore>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    nodes: [],
    edges: [],
    selectedNodeIds: [],
    selectedEdgeIds: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    config: defaultConfig,
    isLoading: false,
    isDragging: false,
    isSelecting: false,

    // 数据加载
    loadMindmapData: async (projectId: string) => {
      set({ isLoading: true })
      try {
        // 获取项目数据
        const [tablesResponse, relationshipsResponse] = await Promise.all([
          apiMethods.getDataTables({ projectId }),
          apiMethods.getTableRelationships(projectId)
        ])

        const tables = tablesResponse.data?.tables || []
        const relationships = relationshipsResponse.data?.relationships || []

        // 转换为mindmap数据
        const { nodes, edges } = mindmapDataTransformer.fromDatabaseTables(tables, relationships)

        // 应用默认布局
        const { nodes: layoutedNodes, edges: layoutedEdges } = await mindmapLayoutService.calculate(
          nodes, 
          edges, 
          get().config
        )

        set({ 
          nodes: layoutedNodes, 
          edges: layoutedEdges, 
          isLoading: false 
        })

        // 应用筛选
        get().applyFilters()

      } catch (error) {
        console.error('Failed to load mindmap data:', error)
        set({ isLoading: false })
      }
    },

    // 节点操作
    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),

    addNode: (node) => {
      set(state => ({
        nodes: [...state.nodes, node]
      }))
    },

    removeNode: (nodeId) => {
      set(state => ({
        nodes: state.nodes.filter(node => node.id !== nodeId),
        edges: state.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId),
        selectedNodeIds: state.selectedNodeIds.filter(id => id !== nodeId)
      }))
    },

    updateNode: (nodeId, updates) => {
      set(state => ({
        nodes: state.nodes.map(node => 
          node.id === nodeId 
            ? { ...node, ...updates, data: { ...node.data, ...updates.data } }
            : node
        )
      }))
    },

    addEdge: (edge) => {
      set(state => ({
        edges: [...state.edges, edge]
      }))
    },

    removeEdge: (edgeId) => {
      set(state => ({
        edges: state.edges.filter(edge => edge.id !== edgeId),
        selectedEdgeIds: state.selectedEdgeIds.filter(id => id !== edgeId)
      }))
    },

    updateEdge: (edgeId, updates) => {
      set(state => ({
        edges: state.edges.map(edge => 
          edge.id === edgeId 
            ? { ...edge, ...updates, data: { ...edge.data, ...updates.data } }
            : edge
        )
      }))
    },

    // 选择操作
    setSelectedNodeIds: (nodeIds) => set({ selectedNodeIds: nodeIds }),
    setSelectedEdgeIds: (edgeIds) => set({ selectedEdgeIds: edgeIds }),
    clearSelection: () => set({ selectedNodeIds: [], selectedEdgeIds: [] }),

    // 配置操作
    updateConfig: (configUpdates) => {
      set(state => ({
        config: {
          ...state.config,
          ...configUpdates,
          layout: { ...state.config.layout, ...configUpdates.layout },
          display: { ...state.config.display, ...configUpdates.display },
          interaction: { ...state.config.interaction, ...configUpdates.interaction },
          filters: { ...state.config.filters, ...configUpdates.filters }
        }
      }))
      
      // 应用筛选
      get().applyFilters()
    },

    resetConfig: () => set({ config: defaultConfig }),

    // 布局操作
    applyLayout: async (layoutType: string) => {
      const state = get()
      const newConfig = { ...state.config, layout: { ...state.config.layout, type: layoutType as any } }
      
      const { nodes: layoutedNodes, edges: layoutedEdges } = await mindmapLayoutService.calculate(
        state.nodes,
        state.edges,
        newConfig
      )

      set({ 
        nodes: layoutedNodes, 
        edges: layoutedEdges, 
        config: newConfig 
      })
    },

    saveLayout: async () => {
      // 保存布局到后端
      const { nodes, edges } = get()
      try {
        await apiMethods.saveMindmapLayout({
          nodes: nodes.map(node => ({
            id: node.id,
            position: node.position,
            data: node.data
          })),
          edges: edges.map(edge => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            data: edge.data
          }))
        })
      } catch (error) {
        console.error('Failed to save layout:', error)
      }
    },

    resetLayout: () => {
      const { nodes, edges, config } = get()
      mindmapLayoutService.calculate(nodes, edges, config).then(result => {
        set({ 
          nodes: result.nodes, 
          edges: result.edges 
        })
      })
    },

    // 视图操作
    setViewport: (viewport) => set({ viewport }),
    
    fitToView: () => {
      // 由ReactFlow组件处理
    },

    // 筛选操作
    applyFilters: () => {
      const { config } = get()
      // 筛选逻辑将在组件层面处理，因为ReactFlow需要实际的节点和边
    },

    getFilteredNodes: () => {
      const { nodes, config } = get()
      return nodes.filter(node => {
        // 节点类型筛选
        if (!config.filters.nodeTypes.includes(node.data.type)) {
          return false
        }

        // 状态筛选
        if (node.data.status && !config.filters.statuses.includes(node.data.status)) {
          return false
        }

        // 分类筛选
        if (config.filters.categories.length > 0 && 
            node.data.category && 
            !config.filters.categories.includes(node.data.category)) {
          return false
        }

        return true
      })
    },

    getFilteredEdges: () => {
      const { edges, config } = get()
      const filteredNodes = get().getFilteredNodes()
      const nodeIds = new Set(filteredNodes.map(node => node.id))

      return edges.filter(edge => {
        // 边类型筛选
        if (!config.filters.edgeTypes.includes(edge.data.type)) {
          return false
        }

        // 只保留连接到可见节点的边
        return nodeIds.has(edge.source) && nodeIds.has(edge.target)
      })
    },

    // 导出操作
    exportMindmap: async (format: string, options = {}) => {
      const { nodes, edges } = get()
      
      switch (format) {
        case 'json':
          return JSON.stringify({ nodes, edges }, null, 2)
        
        case 'mermaid':
          return mindmapDataTransformer.toMermaid(nodes, edges)
        
        case 'png':
        case 'svg':
        case 'pdf':
          // 这些格式需要在组件层面处理，使用html2canvas或类似库
          throw new Error(`Export format ${format} should be handled by the component`)
        
        default:
          throw new Error(`Unsupported export format: ${format}`)
      }
    }
  }))
)

// 订阅配置变化，自动保存
useMindmapStore.subscribe(
  (state) => state.config,
  (config) => {
    // 保存配置到localStorage
    localStorage.setItem('mindmap-config', JSON.stringify(config))
  },
  { equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b) }
)

// 从localStorage加载配置
const savedConfig = localStorage.getItem('mindmap-config')
if (savedConfig) {
  try {
    const config = JSON.parse(savedConfig)
    useMindmapStore.setState({ config: { ...defaultConfig, ...config } })
  } catch (error) {
    console.error('Failed to load saved config:', error)
  }
}