// packages/frontend/src/types/mindmap.ts

import { Node, Edge } from 'reactflow'
import { DatabaseTable, TableRelationship } from '@shared/types'

// 节点类型枚举
export enum MindmapNodeType {
  PROJECT = 'project',          // 项目根节点
  CATEGORY = 'category',        // 分类节点
  TABLE = 'table',             // 数据表节点
  FIELD_GROUP = 'fieldGroup'   // 字段分组节点
}

// 边类型枚举
export enum MindmapEdgeType {
  HIERARCHY = 'hierarchy',     // 层次关系（分类到表）
  FOREIGN_KEY = 'foreignKey',  // 外键关系
  REFERENCE = 'reference',     // 引用关系
  DEPENDENCY = 'dependency'    // 业务依赖
}

// 节点数据结构
export interface MindmapNodeData {
  // 基础信息
  id: string
  type: MindmapNodeType
  label: string
  description?: string
  
  // 业务数据
  entityId?: string            // 对应的业务实体ID
  entityType?: 'project' | 'table' | 'category'
  
  // 统计信息（针对表节点）
  fieldCount?: number
  indexCount?: number
  relationshipCount?: number
  status?: string
  
  // 视觉属性
  color?: string
  size?: 'small' | 'medium' | 'large'
  icon?: string
  isCollapsed?: boolean        // 是否折叠子节点
  
  // 布局属性
  level?: number               // 层级深度
  category?: string            // 所属分类
  
  // 扩展数据
  metadata?: Record<string, any>
}

// 边数据结构
export interface MindmapEdgeData {
  id: string
  type: MindmapEdgeType
  label?: string
  
  // 关系信息
  relationshipId?: string      // 对应的关系ID
  fromField?: string           // 源字段
  toField?: string            // 目标字段
  constraintType?: 'CASCADE' | 'SET_NULL' | 'RESTRICT'
  
  // 视觉属性
  color?: string
  style?: 'solid' | 'dashed' | 'dotted'
  width?: number
  animated?: boolean
  
  // 扩展数据
  metadata?: Record<string, any>
}

// React Flow 节点类型
export interface MindmapNode extends Node {
  data: MindmapNodeData
}

// React Flow 边类型
export interface MindmapEdge extends Edge {
  data: MindmapEdgeData
}

// Mindmap 配置
export interface MindmapConfig {
  // 布局配置
  layout: {
    type: 'hierarchical' | 'radial' | 'force' | 'circular'
    direction: 'TB' | 'BT' | 'LR' | 'RL'
    spacing: {
      node: number
      level: number
    }
    animation: {
      enabled: boolean
      duration: number
    }
  }
  
  // 显示配置
  display: {
    showLabels: boolean
    showIcons: boolean
    showStatistics: boolean
    showRelationshipLabels: boolean
    compactMode: boolean
  }
  
  // 交互配置
  interaction: {
    enableDrag: boolean
    enableZoom: boolean
    enableSelection: boolean
    enableCollapse: boolean
    autoLayout: boolean
  }
  
  // 过滤配置
  filters: {
    nodeTypes: MindmapNodeType[]
    edgeTypes: MindmapEdgeType[]
    categories: string[]
    statuses: string[]
  }
}

// Mindmap 状态
export interface MindmapState {
  // 数据
  nodes: MindmapNode[]
  edges: MindmapEdge[]
  
  // 选择状态
  selectedNodeIds: string[]
  selectedEdgeIds: string[]
  
  // 视图状态
  viewport: {
    x: number
    y: number
    zoom: number
  }
  
  // 配置
  config: MindmapConfig
  
  // UI状态
  isLoading: boolean
  isDragging: boolean
  isSelecting: boolean
}

// 数据转换接口
export interface MindmapDataTransformer {
  // 从数据库数据生成mindmap数据
  fromDatabaseTables(
    tables: DatabaseTable[], 
    relationships: TableRelationship[]
  ): { nodes: MindmapNode[], edges: MindmapEdge[] }
  
  // 从mindmap数据提取变更
  extractChanges(
    originalNodes: MindmapNode[],
    modifiedNodes: MindmapNode[]
  ): MindmapChangeSet
}

// 变更集合
export interface MindmapChangeSet {
  nodeChanges: {
    added: MindmapNode[]
    updated: { id: string, changes: Partial<MindmapNodeData> }[]
    removed: string[]
  }
  edgeChanges: {
    added: MindmapEdge[]
    updated: { id: string, changes: Partial<MindmapEdgeData> }[]
    removed: string[]
  }
}

// 布局算法接口
export interface LayoutAlgorithm {
  name: string
  calculate(
    nodes: MindmapNode[], 
    edges: MindmapEdge[], 
    config: MindmapConfig
  ): { nodes: MindmapNode[], edges: MindmapEdge[] }
}

// 导出格式
export interface MindmapExportFormat {
  format: 'png' | 'svg' | 'pdf' | 'json' | 'mermaid'
  options: {
    width?: number
    height?: number
    quality?: number
    backgroundColor?: string
    includeMetadata?: boolean
  }
}