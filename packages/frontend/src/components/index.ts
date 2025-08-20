// Components 组件统一导出入口

// 🎨 基础UI组件
export * from './ui'

// 📐 布局组件
export * from './layout'

// 🚀 功能特性组件
export * from './features'

// 🔌 第三方集成组件
export * from './integrations'

// 🤝 共享业务组件
export * from './shared'

// 📋 兼容性导出 (过渡期保留，建议使用分类导出)
// 布局组件
export { default as Layout } from './layout/Layout'

// 项目管理
export { default as ProjectCard } from './features/project/components/ProjectCard'
export { default as ProjectStats } from './features/project/components/ProjectStats'
export { default as CreateProjectModal } from './features/project/components/modals/CreateProjectModal'
export { default as ProjectSettingsModal } from './features/project/components/modals/ProjectSettingsModal'
export { default as DeleteProjectModal } from './features/project/components/modals/DeleteProjectModal'

// API管理
export { default as APICard } from './features/api/components/APICard'
export { default as FeatureAPICard } from './features/api/components/FeatureAPICard'
export { default as TailwindAPICard } from './features/api/components/TailwindAPICard'
export { default as CreateAPIModal } from './features/api/components/modals/CreateAPIModal'
export { default as APIDetailModal } from './features/api/components/modals/APIDetailModal'
export { default as APITestModal } from './features/api/components/modals/APITestModal'

// 导入功能
export { default as UnifiedImportModal } from './features/import/components/modals/UnifiedImportModal'
export { default as ImportSwaggerModal } from './features/import/components/modals/ImportSwaggerModal'
export { default as ImportAPIDocModal } from './features/import/components/modals/ImportAPIDocModal'

// 关系图谱
export { default as MindmapViewer } from './features/mindmap/components/MindmapViewer'

// 数据模型
export { default as DataTableModal } from './features/data-model/components/modals/DataTableModal'
export { default as FeatureModuleModal } from './features/data-model/components/modals/FeatureModuleModal'
export { default as ERDiagramDesigner } from './features/data-model/components/ERDiagramDesigner'
export { default as AIDocumentParser } from './features/data-model/components/AIDocumentParser'
export { default as RelationshipManager } from './features/data-model/components/RelationshipManager'
export { default as VersionControl } from './features/data-model/components/VersionControl'
export { default as SQLGenerator } from './features/data-model/components/SQLGenerator'
export { default as EnumValueManager } from './features/data-model/components/EnumValueManager'
export { default as StatsDashboard } from './features/data-model/components/StatsDashboard'

// 搜索功能
export { default as QuickSearch } from './features/search/components/QuickSearch'

// 集成组件
export { default as AIConfigModal } from './integrations/ai/AIConfigModal'
export { default as MCPServerControl } from './integrations/mcp/MCPServerControl'

// 通用组件
export { default as AIDocumentParser } from './common/AIDocumentParser'

// 共享组件
// export { default as FontTest } from './shared/FontTest'