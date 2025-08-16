import axios from 'axios'
import { mcpConfig } from '../config/mcpConfig'

// 获取 API 基础 URL，优先使用环境变量，否则使用配置管理
const API_BASE_URL = import.meta.env.VITE_API_URL || mcpConfig.getBackendBaseUrl()

/**
 * 创建 axios 实例
 * 统一管理 API 请求配置
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 增加到60秒，给AI解析更多时间
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证token等
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error)
    throw error
  }
)

// 项目相关API
export const getProjects = async (params?: any) => {
  return apiClient.get('/projects', { params })
}

export const getProject = async (id: string) => {
  return apiClient.get(`/projects/${id}`)
}

export const createProject = async (data: any) => {
  return apiClient.post('/projects', data)
}

export const updateProject = async (id: string, data: any) => {
  return apiClient.put(`/projects/${id}`, data)
}

export const deleteProject = async (id: string) => {
  return apiClient.delete(`/projects/${id}`)
}

export const getProjectStats = async (id: string) => {
  return apiClient.get(`/projects/${id}/stats`)
}

// API相关API
export const getAPIs = async (params?: any) => {
  return apiClient.get('/apis', { params })
}

export const createAPI = async (data: any) => {
  return apiClient.post('/apis', data)
}

export const createBatchAPIs = async (apis: any[]) => {
  return apiClient.post('/apis/batch', { apis })
}

export const updateAPI = async (id: string, data: any) => {
  return apiClient.put(`/apis/${id}`, data)
}

export const deleteAPI = async (id: string) => {
  return apiClient.delete(`/apis/${id}`)
}

export const updateAPIStatus = async (id: string, status: string) => {
  return apiClient.patch(`/apis/${id}/status`, { status })
}

export const generateAPICode = async (id: string, options: any) => {
  return apiClient.post(`/apis/${id}/generate-code`, options)
}

// 标签相关API
export const getTags = async (projectId: string) => {
  return apiClient.get(`/tags?projectId=${projectId}`)
}

export const createTag = async (data: any) => {
  return apiClient.post('/tags', data)
}

export const updateTag = async (id: string, data: any) => {
  return apiClient.put(`/tags/${id}`, data)
}

export const deleteTag = async (id: string) => {
  return apiClient.delete(`/tags/${id}`)
}

// Swagger相关API
export const validateSwagger = async (data: any) => {
  return apiClient.post('/swagger/validate', data)
}

export const importSwagger = async (data: any) => {
  return apiClient.post('/swagger/import', data)
}

// 数据模型相关API
export const getDataTables = async (params?: any) => {
  return apiClient.get('/data-models', { params })
}

export const getDataTable = async (id: string) => {
  return apiClient.get(`/data-models/${id}`)
}

export const createDataTable = async (data: any) => {
  return apiClient.post('/data-models', data)
}

export const updateDataTable = async (id: string, data: any) => {
  return apiClient.put(`/data-models/${id}`, data)
}

export const deleteDataTable = async (id: string) => {
  return apiClient.delete(`/data-models/${id}`)
}

export const createBatchDataTables = async (tables: any[]) => {
  return apiClient.post('/data-models/batch', { tables })
}

// 思维导图相关API
export const getMindmapData = async (projectId: string) => {
  return apiClient.get(`/mindmap/${projectId}`)
}

export const saveMindmapLayout = async (projectId: string, data: any) => {
  return apiClient.post(`/mindmap/${projectId}/layout`, data)
}

export const getMindmapLayout = async (projectId: string) => {
  return apiClient.get(`/mindmap/${projectId}/layout`)
}

export const deleteMindmapLayout = async (projectId: string) => {
  return apiClient.delete(`/mindmap/${projectId}/layout`)
}

export const getMindmapStats = async (projectId: string) => {
  return apiClient.get(`/mindmap/${projectId}/stats`)
}

export const getTableRelationships = async (projectId: string) => {
  return apiClient.get(`/data-models/relationships?projectId=${projectId}`)
}

// AI服务相关API
export const getAIServiceHealth = async () => {
  return apiClient.get('/ai/health')
}

export const getAIProviders = async () => {
  return apiClient.get('/ai/providers')
}

// 获取详细的AI提供者信息
export const getAIProvidersDetailed = async () => {
  return apiClient.get('/ai/providers/detailed')
}

// 获取可用模型列表
export const getAIModels = async (provider?: string) => {
  const params = provider ? { provider } : {}
  return apiClient.get('/ai/models', { params })
}

// 自动选择最佳模型
export const autoSelectBestModel = async (provider?: string) => {
  return apiClient.post('/ai/models/auto-select', { provider })
}

export const setDefaultAIProvider = async (provider: string) => {
  return apiClient.post('/ai/provider/default', { provider })
}

export const getAIUsageStats = async () => {
  return apiClient.get('/ai/usage')
}

export const getAIConfiguration = async () => {
  return apiClient.get('/ai/config')
}

export const updateAIConfiguration = async (config: any) => {
  return apiClient.put('/ai/config', config)
}

export const reloadAIConfiguration = async () => {
  return apiClient.post('/ai/config/reload')
}

export const testAIProvider = async (providerId: string) => {
  return apiClient.post(`/api/v1/ai/providers/${providerId}/test`)
}

// AI提供商管理API
export const createAIProvider = async (data: {
  name: string
  displayName: string
  type: string
  endpoint?: string
  apiKey?: string
  model?: string
  maxTokens?: number
  temperature?: number
  isDefault: boolean
  isEnabled: boolean
}) => {
  return apiClient.post('/ai/providers', data)
}

export const updateAIProvider = async (providerId: string, data: any) => {
  return apiClient.put(`/api/v1/ai/providers/${providerId}`, data)
}

export const deleteAIProvider = async (providerId: string) => {
  return apiClient.delete(`/api/v1/ai/providers/${providerId}`)
}

export const getAIProviderStats = async (providerId: string) => {
  return apiClient.get(`/api/v1/ai/providers/${providerId}/stats`)
}

// AI文档解析相关API
export const parseDocument = async (data: {
  projectId: string
  content: string
  type: string
  filename?: string
  provider?: string
  [key: string]: any
}) => {
  return apiClient.post('/ai/parse/document', data)
}

export const batchParseDocuments = async (data: {
  projectId: string
  documents: Array<{
    content: string
    type: string
    filename?: string
  }>
  provider?: string
  [key: string]: any
}) => {
  return apiClient.post('/ai/parse/batch', data)
}

export const getParseHistory = async (projectId: string, limit?: number) => {
  return apiClient.get(`/api/v1/ai/history/${projectId}`, { 
    params: { limit } 
  })
}

// 批量导入工作流API
export const createBatchImportJob = async (data: {
  projectId: string
  documents: Array<{
    filename: string
    content: string
    type: string
  }>
  options?: any
}) => {
  return apiClient.post('/ai/batch/import', data)
}

export const getBatchImportJobStatus = async (jobId: string) => {
  return apiClient.get(`/api/v1/ai/batch/status/${jobId}`)
}

export const getBatchImportJobs = async () => {
  return apiClient.get('/ai/batch/jobs')
}

export const cancelBatchImportJob = async (jobId: string) => {
  return apiClient.post(`/api/v1/ai/batch/cancel/${jobId}`)
}

export const getBatchImportJobReport = async (jobId: string) => {
  return apiClient.get(`/api/v1/ai/batch/report/${jobId}`)
}

// SQL代码生成API
export const generateSQL = async (data: {
  model: any
  dialect: string
  provider?: string
  [key: string]: any
}) => {
  return apiClient.post('/ai/generate/sql', data)
}

export const generateMigrationScript = async (data: {
  model: any
  dialect: string
  oldModel?: any
  options?: any
}) => {
  return apiClient.post('/ai/generate/migration', data)
}

export const generateMigrationPlan = async (migrations: any[]) => {
  return apiClient.post('/ai/generate/migration-plan', { migrations })
}

export const generateRollbackScript = async (migrationId: string, data: {
  migration: any
  targetVersion?: string
}) => {
  return apiClient.post(`/api/v1/ai/generate/rollback/${migrationId}`, data)
}

// 数据库优化API
export const optimizeProjectSchema = async (projectId: string, options?: any) => {
  return apiClient.post(`/api/v1/ai/optimize/schema/${projectId}`, options || {})
}

export const suggestTableIndexes = async (tableId: string, data?: {
  queryPatterns?: string[]
  provider?: string
}) => {
  return apiClient.post(`/api/v1/ai/suggest/indexes/${tableId}`, data || {})
}

// 模型验证和修正API
export const validateModel = async (data: {
  model: any
  options?: any
}) => {
  return apiClient.post('/ai/validate/model', data)
}

export const validateAndCorrectModel = async (data: {
  model: any
  options?: any
  enableAutoCorrection?: boolean
  correctionMode?: string
}) => {
  return apiClient.post('/ai/validate/correct', data)
}

export const smartCorrectModel = async (data: {
  model: any
  options?: any
}) => {
  return apiClient.post('/ai/correct/smart', data)
}

export const generateQualityReport = async (data: {
  model: any
  validationResult?: any
}) => {
  return apiClient.post('/ai/report/quality', data)
}

// 协作管理API
export const getComments = async (projectId: string, params?: {
  targetType?: string
  targetId?: string
  limit?: number
  offset?: number
}) => {
  return apiClient.get(`/collaboration/${projectId}/comments`, { params })
}

export const createComment = async (projectId: string, data: {
  content: string
  targetType: string
  targetId: string
  targetName: string
  parentId?: string
  mentions?: string[]
}) => {
  return apiClient.post(`/collaboration/${projectId}/comments`, data)
}

export const updateComment = async (projectId: string, commentId: string, data: {
  content: string
}) => {
  return apiClient.put(`/collaboration/${projectId}/comments/${commentId}`, data)
}

export const deleteComment = async (projectId: string, commentId: string) => {
  return apiClient.delete(`/collaboration/${projectId}/comments/${commentId}`)
}

export const resolveComment = async (projectId: string, commentId: string, isResolved: boolean) => {
  return apiClient.patch(`/collaboration/${projectId}/comments/${commentId}/resolve`, { isResolved })
}

export const getCommentStats = async (projectId: string) => {
  return apiClient.get(`/collaboration/${projectId}/comments/stats`)
}

// 权限管理API
export const getTeamMembers = async (projectId: string, params?: {
  role?: string
  status?: string
  search?: string
}) => {
  return apiClient.get(`/permissions/${projectId}/members`, { params })
}

export const inviteMember = async (projectId: string, data: {
  email: string
  role: string
  message?: string
}) => {
  return apiClient.post(`/permissions/${projectId}/members/invite`, data)
}

export const updateMemberRole = async (projectId: string, memberId: string, role: string) => {
  return apiClient.patch(`/permissions/${projectId}/members/${memberId}/role`, { role })
}

export const removeMember = async (projectId: string, memberId: string) => {
  return apiClient.delete(`/permissions/${projectId}/members/${memberId}`)
}

export const getRolesAndPermissions = async (projectId: string) => {
  return apiClient.get(`/permissions/${projectId}/roles`)
}

export const checkPermission = async (projectId: string, params: {
  permission: string
  userId?: string
}) => {
  return apiClient.get(`/permissions/${projectId}/permissions/check`, { params })
}

export const getPermissionStats = async (projectId: string) => {
  return apiClient.get(`/permissions/${projectId}/permissions/stats`)
}

// 功能模块管理API
export const getFeatureModules = async (projectId: string, params?: {
  status?: 'planned' | 'in-progress' | 'completed'
  search?: string
}) => {
  return apiClient.get(`/features/${projectId}/modules`, { params })
}

export const getFeatureModule = async (projectId: string, moduleId: string) => {
  return apiClient.get(`/features/${projectId}/modules/${moduleId}`)
}

export const createFeatureModule = async (projectId: string, data: {
  name: string
  description?: string
  category?: string
  tags?: string[]
}) => {
  return apiClient.post(`/features/${projectId}/modules`, data)
}

export const updateFeatureModule = async (projectId: string, moduleId: string, data: any) => {
  return apiClient.put(`/features/${projectId}/modules/${moduleId}`, data)
}

export const deleteFeatureModule = async (projectId: string, moduleId: string) => {
  return apiClient.delete(`/features/${projectId}/modules/${moduleId}`)
}

export const getFeatureModuleStats = async (projectId: string) => {
  return apiClient.get(`/features/${projectId}/modules/stats`)
}

// 代码模板管理API
export const getCodeTemplates = async (filters?: {
  category?: string
  dialect?: string
  tags?: string
  search?: string
}) => {
  return apiClient.get('/ai/templates', { params: filters })
}

export const getCodeTemplate = async (templateId: string) => {
  return apiClient.get(`/api/v1/ai/templates/${templateId}`)
}

export const renderCodeTemplate = async (templateId: string, variables: Record<string, any>) => {
  return apiClient.post(`/api/v1/ai/templates/${templateId}/render`, { variables })
}

export const previewCodeTemplate = async (templateId: string, context: {
  model: any
  dialect: string
  [key: string]: any
}) => {
  return apiClient.post(`/api/v1/ai/templates/${templateId}/preview`, { context })
}

export const createCodeTemplate = async (template: {
  name: string
  description: string
  category: string
  language: string
  content: string
  variables: any[]
  isPublic: boolean
  tags?: string[]
}) => {
  return apiClient.post('/ai/templates', template)
}

export const updateCodeTemplate = async (templateId: string, updates: any) => {
  return apiClient.put(`/api/v1/ai/templates/${templateId}`, updates)
}

export const deleteCodeTemplate = async (templateId: string) => {
  return apiClient.delete(`/api/v1/ai/templates/${templateId}`)
}

export const exportTemplateCollection = async (templateIds: string[]) => {
  return apiClient.post('/ai/templates/export', { templateIds })
}

export const importTemplateCollection = async (collection: any) => {
  return apiClient.post('/ai/templates/import', { collection })
}

export const exportCodeTemplates = async (templateIds: string[]) => {
  return apiClient.post('/ai/templates/export', { templateIds })
}

export const importCodeTemplates = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return apiClient.post('/ai/templates/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 导出API对象
export const apiMethods = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,
  getAPIs,
  createAPI,
  createBatchAPIs,
  updateAPI,
  deleteAPI,
  updateAPIStatus,
  generateAPICode,
  getTags,
  createTag,
  updateTag,
  deleteTag,
  validateSwagger,
  importSwagger,
  getDataTables,
  getDataTable,
  createDataTable,
  updateDataTable,
  deleteDataTable,
  createBatchDataTables,
  getMindmapData,
  saveMindmapLayout,
  getMindmapLayout,
  deleteMindmapLayout,
  getMindmapStats,
  getTableRelationships,
  // AI服务相关
  getAIServiceHealth,
  getAIProviders,
  getAIProvidersDetailed,
  getAIModels,
  autoSelectBestModel,
  setDefaultAIProvider,
  getAIUsageStats,
  getAIConfiguration,
  updateAIConfiguration,
  reloadAIConfiguration,
  testAIProvider,
  // AI提供商管理
  createAIProvider,
  updateAIProvider,
  deleteAIProvider,
  getAIProviderStats,
  // AI文档解析
  parseDocument,
  batchParseDocuments,
  getParseHistory,
  // 批量导入工作流
  createBatchImportJob,
  getBatchImportJobStatus,
  getBatchImportJobs,
  cancelBatchImportJob,
  getBatchImportJobReport,
  // SQL代码生成
  generateSQL,
  generateMigrationScript,
  generateMigrationPlan,
  generateRollbackScript,
  // 数据库优化
  optimizeProjectSchema,
  suggestTableIndexes,
  // 模型验证和修正
  validateModel,
  validateAndCorrectModel,
  smartCorrectModel,
  generateQualityReport,
  // 功能模块管理
  getFeatureModules,
  getFeatureModule,
  createFeatureModule,
  updateFeatureModule,
  deleteFeatureModule,
  getFeatureModuleStats,
  // 代码模板管理
  getCodeTemplates,
  getCodeTemplate,
  renderCodeTemplate,
  previewCodeTemplate,
  createCodeTemplate,
  updateCodeTemplate,
  deleteCodeTemplate,
  exportTemplateCollection,
  importTemplateCollection,
  exportCodeTemplates,
  importCodeTemplates,
}

export default apiMethods