export * from './types'
export * from './schemas'
export * from './utils'

// 常量
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100
export const DEFAULT_SEARCH_LIMIT = 10
export const SEARCH_DEBOUNCE_DELAY = 300

// API路径常量
export const API_PATHS = {
  PROJECTS: '/api/projects',
  APIS: '/api/apis',
  TAGS: '/api/tags',
  SWAGGER: '/api/swagger',
  SEARCH: '/api/search',
  HEALTH: '/api/health'
} as const

// MCP工具名称常量
export const MCP_TOOLS = {
  SEARCH_PROJECTS: 'search_projects',
  SEARCH_APIS: 'search_apis',
  SEARCH_TAGS: 'search_tags',
  GLOBAL_SEARCH: 'global_search',
  GET_SUGGESTIONS: 'get_search_suggestions',
  GET_RECENT: 'get_recent_items',
  REFRESH_INDEX: 'refresh_search_index'
} as const

// 默认颜色调色板
export const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6366F1'  // Indigo
] as const