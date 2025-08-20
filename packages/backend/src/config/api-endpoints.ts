/**
 * API接口统一配置管理
 */

// 基础配置
export const API_CONFIG = {
  // 服务器配置
  SERVER: {
    PORT: 3000,
    HOST: 'localhost',
    BASE_URL: 'http://localhost:3000',
  },

  // API版本和前缀
  VERSION: 'v1',
  PREFIX: '/api/v1',

  // 健康检查
  HEALTH: '/health',
} as const

// API端点配置
export const API_ENDPOINTS = {
  // 项目管理
  PROJECTS: {
    BASE: `${API_CONFIG.PREFIX}/projects`,
    LIST: `${API_CONFIG.PREFIX}/projects`,
    CREATE: `${API_CONFIG.PREFIX}/projects`,
    GET_BY_ID: (id: string | number) => `${API_CONFIG.PREFIX}/projects/${id}`,
    UPDATE: (id: string | number) => `${API_CONFIG.PREFIX}/projects/${id}`,
    DELETE: (id: string | number) => `${API_CONFIG.PREFIX}/projects/${id}`,
    SEARCH: `${API_CONFIG.PREFIX}/projects/search`,
  },

  // API管理
  APIS: {
    BASE: `${API_CONFIG.PREFIX}/apis`,
    LIST: `${API_CONFIG.PREFIX}/apis`,
    CREATE: `${API_CONFIG.PREFIX}/apis`,
    GET_BY_ID: (id: string | number) => `${API_CONFIG.PREFIX}/apis/${id}`,
    UPDATE: (id: string | number) => `${API_CONFIG.PREFIX}/apis/${id}`,
    DELETE: (id: string | number) => `${API_CONFIG.PREFIX}/apis/${id}`,
    SEARCH: `${API_CONFIG.PREFIX}/apis/search`,
    BY_PROJECT: (projectId: string | number) => `${API_CONFIG.PREFIX}/apis/project/${projectId}`,
    IMPORT_SWAGGER: `${API_CONFIG.PREFIX}/apis/import/swagger`,
  },

  // 标签管理
  TAGS: {
    BASE: `${API_CONFIG.PREFIX}/tags`,
    LIST: `${API_CONFIG.PREFIX}/tags`,
    CREATE: `${API_CONFIG.PREFIX}/tags`,
    GET_BY_ID: (id: string | number) => `${API_CONFIG.PREFIX}/tags/${id}`,
    UPDATE: (id: string | number) => `${API_CONFIG.PREFIX}/tags/${id}`,
    DELETE: (id: string | number) => `${API_CONFIG.PREFIX}/tags/${id}`,
    SEARCH: `${API_CONFIG.PREFIX}/tags/search`,
  },

  // Swagger文档
  SWAGGER: {
    BASE: `${API_CONFIG.PREFIX}/swagger`,
    JSON: `${API_CONFIG.PREFIX}/swagger.json`,
    UI: `${API_CONFIG.PREFIX}/swagger-ui`,
    DOCS: `${API_CONFIG.PREFIX}/docs`,
  },

  // MCP服务
  MCP: {
    BASE: `${API_CONFIG.PREFIX}/mcp`,
    TOOLS: `${API_CONFIG.PREFIX}/mcp/tools`,
    CALL: `${API_CONFIG.PREFIX}/mcp/call`,
    STATUS: `${API_CONFIG.PREFIX}/mcp/status`,
    // 临时兼容路径
    LEGACY: '/__mcp',
  },

  // 数据模型
  DATA_MODELS: {
    BASE: `${API_CONFIG.PREFIX}/data-models`,
    LIST: `${API_CONFIG.PREFIX}/data-models`,
    CREATE: `${API_CONFIG.PREFIX}/data-models`,
    GET_BY_ID: (id: string | number) => `${API_CONFIG.PREFIX}/data-models/${id}`,
    UPDATE: (id: string | number) => `${API_CONFIG.PREFIX}/data-models/${id}`,
    DELETE: (id: string | number) => `${API_CONFIG.PREFIX}/data-models/${id}`,
    BATCH_CREATE: `${API_CONFIG.PREFIX}/data-models/batch`,
  },

  // 思维导图
  MINDMAP: {
    BASE: `${API_CONFIG.PREFIX}/mindmap`,
    GET_DATA: (projectId: string | number) => `${API_CONFIG.PREFIX}/mindmap/${projectId}`,
    SAVE_LAYOUT: (projectId: string | number) => `${API_CONFIG.PREFIX}/mindmap/${projectId}/layout`,
    GET_LAYOUT: (projectId: string | number) => `${API_CONFIG.PREFIX}/mindmap/${projectId}/layout`,
    DELETE_LAYOUT: (projectId: string | number) =>
      `${API_CONFIG.PREFIX}/mindmap/${projectId}/layout`,
    GET_STATS: (projectId: string | number) => `${API_CONFIG.PREFIX}/mindmap/${projectId}/stats`,
  },

  // 调试工具
  DEBUG: {
    BASE: `${API_CONFIG.PREFIX}/debug`,
    INFO: `${API_CONFIG.PREFIX}/debug/info`,
    ROUTES: `${API_CONFIG.PREFIX}/debug/routes`,
    CONFIG: `${API_CONFIG.PREFIX}/debug/config`,
  },

  // GitHub Issues 管理
  ISSUES: {
    BASE: `${API_CONFIG.PREFIX}/issues`,
    LIST: (projectId: string) => `${API_CONFIG.PREFIX}/issues/${projectId}/issues`,
    CREATE: (projectId: string) => `${API_CONFIG.PREFIX}/issues/${projectId}/issues`,
    GET_BY_ID: (projectId: string, issueId: string) =>
      `${API_CONFIG.PREFIX}/issues/${projectId}/issues/${issueId}`,
    UPDATE: (projectId: string, issueId: string) =>
      `${API_CONFIG.PREFIX}/issues/${projectId}/issues/${issueId}`,
    DELETE: (projectId: string, issueId: string) =>
      `${API_CONFIG.PREFIX}/issues/${projectId}/issues/${issueId}`,
    STATS: (projectId: string) => `${API_CONFIG.PREFIX}/issues/${projectId}/issues/stats`,

    // GitHub 同步
    SYNC_FROM_GITHUB: (projectId: string) =>
      `${API_CONFIG.PREFIX}/issues/${projectId}/sync/from-github`,
    SYNC_TO_GITHUB: (projectId: string) =>
      `${API_CONFIG.PREFIX}/issues/${projectId}/sync/to-github`,
    SYNC_BIDIRECTIONAL: (projectId: string) =>
      `${API_CONFIG.PREFIX}/issues/${projectId}/sync/bidirectional`,
    SYNC_STATUS: (projectId: string) => `${API_CONFIG.PREFIX}/issues/${projectId}/sync/status`,

    // 关联关系
    RELATIONS: {
      BASE: (projectId: string, issueId: string) =>
        `${API_CONFIG.PREFIX}/issues/${projectId}/issues/${issueId}/relations`,
      APIS: (projectId: string, issueId: string) =>
        `${API_CONFIG.PREFIX}/issues/${projectId}/issues/${issueId}/relations/apis`,
      TABLES: (projectId: string, issueId: string) =>
        `${API_CONFIG.PREFIX}/issues/${projectId}/issues/${issueId}/relations/tables`,
      FEATURES: (projectId: string, issueId: string) =>
        `${API_CONFIG.PREFIX}/issues/${projectId}/issues/${issueId}/relations/features`,
      BATCH: (projectId: string, issueId: string) =>
        `${API_CONFIG.PREFIX}/issues/${projectId}/issues/${issueId}/relations/batch`,
      AVAILABLE: (projectId: string, issueId: string) =>
        `${API_CONFIG.PREFIX}/issues/${projectId}/issues/${issueId}/relations/available`,
    },
  },

  // GitHub 仓库配置
  GITHUB: {
    BASE: `${API_CONFIG.PREFIX}/github`,
    REPOSITORIES: `${API_CONFIG.PREFIX}/github/repositories`,
    REPOSITORY: (projectId: string) => `${API_CONFIG.PREFIX}/github/repositories/${projectId}`,
    VALIDATE: (projectId: string) =>
      `${API_CONFIG.PREFIX}/github/repositories/${projectId}/validate`,
    WEBHOOK: (projectId: string) => `${API_CONFIG.PREFIX}/github/repositories/${projectId}/webhook`,
  },

  // 健康检查
  HEALTH: {
    CHECK: '/health',
    STATUS: '/status',
  },
} as const

// HTTP方法配置
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  OPTIONS: 'OPTIONS',
} as const

// 响应状态码
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const

// CORS配置
export const CORS_CONFIG = {
  ALLOWED_ORIGINS: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'],
  ALLOWED_METHODS: [
    HTTP_METHODS.GET,
    HTTP_METHODS.POST,
    HTTP_METHODS.PUT,
    HTTP_METHODS.PATCH,
    HTTP_METHODS.DELETE,
    HTTP_METHODS.OPTIONS,
  ],
  ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-Requested-With'],
} as const

// 获取完整URL的辅助函数
export const getFullUrl = (endpoint: string): string => {
  return `${API_CONFIG.SERVER.BASE_URL}${endpoint}`
}

// 导出类型定义
export type ApiEndpoint = string | ((id: string | number) => string)
export type HttpMethod = keyof typeof HTTP_METHODS
export type HttpStatusCode = keyof typeof HTTP_STATUS
