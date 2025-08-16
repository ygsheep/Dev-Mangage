// Data Model 功能组件统一导出

// 核心数据模型组件
export { default as ERDiagramDesigner } from './components/ERDiagramDesigner'
export { default as AIDocumentParser } from './components/AIDocumentParser'
export { default as RelationshipManager } from './components/RelationshipManager'
export { default as SQLGenerator } from './components/SQLGenerator'
export { default as VersionControl } from './components/VersionControl'

// 节点组件
export { default as TableNode } from './components/nodes/TableNode'
export { default as FieldGroupNode } from './components/nodes/FieldGroupNode'

// 边组件
export { default as RelationshipEdge } from './components/edges/RelationshipEdge'

// 模态框组件
export { default as DataTableModal } from './components/modals/DataTableModal'
export { default as FeatureModuleModal } from './components/modals/FeatureModuleModal'

// 类型导出
export type { DataTableModalProps } from './components/modals/DataTableModal'