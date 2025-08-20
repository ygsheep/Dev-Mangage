/**
 * API请求工具模块
 * 提供统一的HTTP请求封装和业务API方法
 * 包含项目管理、API管理、标签管理、数据模型等所有前端需要的接口调用
 */

import axios from 'axios'
import { getBackendBaseUrl } from '../config/env'
import { 
  FeatureModuleQueryParams, 
  CreateFeatureModuleData, 
  UpdateFeatureModuleData,
  FeatureModulesResponse 
} from '../types'

// 获取API基础URL，使用统一的环境配置管理
const API_BASE_URL = getBackendBaseUrl()

/**
 * Axios HTTP客户端实例
 * 统一管理所有API请求的配置、拦截器和错误处理
 * 配置了较长的超时时间以支持AI文档解析等耗时操作
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60秒超时，为AI解析和复杂查询预留充裕时间
})

/**
 * 请求拦截器
 * 在发送请求前自动添加认证信息、公共头部等
 */
apiClient.interceptors.request.use(
  config => {
    // TODO: 在这里添加认证token、请求ID等公共头部
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

/**
 * 响应拦截器
 * 统一处理响应数据和错误，简化上层调用
 */
apiClient.interceptors.response.use(
  response => response.data, // 直接返回数据部分，简化调用
  error => {
    console.error('API Error:', error)
    throw error // 抛出错误供上层处理
  }
)

// ========== 项目管理API ==========

/**
 * 获取项目列表
 * @param params - 查询参数（分页、搜索、筛选等）
 * @returns 项目列表数据
 */
export const getProjects = async (params?: any) => {
  return apiClient.get('/projects', { params })
}

/**
 * 获取单个项目详情
 * @param id - 项目 ID
 * @returns 项目详细信息
 */
export const getProject = async (id: string) => {
  return apiClient.get(`/projects/${id}`)
}

/**
 * 创建新项目
 * @param data - 项目创建数据
 * @returns 创建的项目信息
 */
export const createProject = async (data: any) => {
  return apiClient.post('/projects', data)
}

/**
 * 更新项目信息
 * @param id - 项目 ID
 * @param data - 更新数据
 * @returns 更新后的项目信息
 */
export const updateProject = async (id: string, data: any) => {
  return apiClient.put(`/projects/${id}`, data)
}

/**
 * 删除项目
 * @param id - 项目 ID
 * @returns 删除结果
 */
export const deleteProject = async (id: string) => {
  return apiClient.delete(`/projects/${id}`)
}

/**
 * 获取项目统计信息
 * @param id - 项目 ID
 * @returns 项目统计数据（API数量、模型数量等）
 */
export const getProjectStats = async (id: string) => {
  return apiClient.get(`/projects/${id}/stats`)
}

// ========== API接口管理API ==========

/**
 * 获取API接口列表
 * @param params - 查询参数（项目 ID、状态筛选、分页等）
 * @returns API接口列表
 */
export const getAPIs = async (params?: any) => {
  return apiClient.get('/apis', { params })
}

/**
 * 创建单个API接口
 * @param data - API接口创建数据
 * @returns 创建的API接口信息
 */
export const createAPI = async (data: any) => {
  return apiClient.post('/apis', data)
}

/**
 * 批量创建API接口
 * @param apis - API接口数据数组
 * @returns 批量创建结果
 */
export const createBatchAPIs = async (apis: any[]) => {
  return apiClient.post('/apis/batch', { apis })
}

/**
 * 更新API接口信息
 * @param id - API接口 ID
 * @param data - 更新数据
 * @returns 更新后的API接口信息
 */
export const updateAPI = async (id: string, data: any) => {
  return apiClient.put(`/apis/${id}`, data)
}

/**
 * 删除API接口
 * @param id - API接口 ID
 * @returns 删除结果
 */
export const deleteAPI = async (id: string) => {
  return apiClient.delete(`/apis/${id}`)
}

/**
 * 更新API接口状态
 * @param id - API接口 ID
 * @param status - 新状态值
 * @returns 更新结果
 */
export const updateAPIStatus = async (id: string, status: string) => {
  return apiClient.patch(`/apis/${id}/status`, { status })
}

/**
 * 生成API接口代码
 * @param id - API接口 ID
 * @param options - 代码生成选项（语言、框架等）
 * @returns 生成的代码内容
 */
export const generateAPICode = async (id: string, options: any) => {
  return apiClient.post(`/apis/${id}/generate-code`, options)
}

// ========== 标签管理API ==========

/**
 * 获取项目标签列表
 * @param projectId - 项目 ID
 * @returns 标签列表
 */
export const getTags = async (projectId: string) => {
  return apiClient.get(`/tags?projectId=${projectId}`)
}

/**
 * 创建新标签
 * @param data - 标签创建数据（名称、颜色、描述等）
 * @returns 创建的标签信息
 */
export const createTag = async (data: any) => {
  return apiClient.post('/tags', data)
}

/**
 * 更新标签信息
 * @param id - 标签 ID
 * @param data - 更新数据
 * @returns 更新后的标签信息
 */
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
  return apiClient.post(`/ai/providers/${providerId}/test`)
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
  return apiClient.put(`/ai/providers/${providerId}`, data)
}

export const deleteAIProvider = async (providerId: string) => {
  return apiClient.delete(`/ai/providers/${providerId}`)
}

export const getAIProviderStats = async (providerId: string) => {
  return apiClient.get(`/ai/providers/${providerId}/stats`)
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
  return apiClient.get(`/ai/history/${projectId}`, {
    params: { limit },
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
  return apiClient.get(`/ai/batch/status/${jobId}`)
}

export const getBatchImportJobs = async () => {
  return apiClient.get('/ai/batch/jobs')
}

export const cancelBatchImportJob = async (jobId: string) => {
  return apiClient.post(`/ai/batch/cancel/${jobId}`)
}

export const getBatchImportJobReport = async (jobId: string) => {
  return apiClient.get(`/ai/batch/report/${jobId}`)
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

export const generateRollbackScript = async (
  migrationId: string,
  data: {
    migration: any
    targetVersion?: string
  }
) => {
  return apiClient.post(`/ai/generate/rollback/${migrationId}`, data)
}

// 数据库优化API
export const optimizeProjectSchema = async (projectId: string, options?: any) => {
  return apiClient.post(`/ai/optimize/schema/${projectId}`, options || {})
}

export const suggestTableIndexes = async (
  tableId: string,
  data?: {
    queryPatterns?: string[]
    provider?: string
  }
) => {
  return apiClient.post(`/ai/suggest/indexes/${tableId}`, data || {})
}

// 模型验证和修正API
export const validateModel = async (data: { model: any; options?: any }) => {
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

export const smartCorrectModel = async (data: { model: any; options?: any }) => {
  return apiClient.post('/ai/correct/smart', data)
}

export const generateQualityReport = async (data: { model: any; validationResult?: any }) => {
  return apiClient.post('/ai/report/quality', data)
}

// 协作管理API
export const getComments = async (
  projectId: string,
  params?: {
    targetType?: string
    targetId?: string
    limit?: number
    offset?: number
  }
) => {
  return apiClient.get(`/collaboration/${projectId}/comments`, { params })
}

export const createComment = async (
  projectId: string,
  data: {
    content: string
    targetType: string
    targetId: string
    targetName: string
    parentId?: string
    mentions?: string[]
  }
) => {
  return apiClient.post(`/collaboration/${projectId}/comments`, data)
}

export const updateComment = async (
  projectId: string,
  commentId: string,
  data: {
    content: string
  }
) => {
  return apiClient.put(`/collaboration/${projectId}/comments/${commentId}`, data)
}

export const deleteComment = async (projectId: string, commentId: string) => {
  return apiClient.delete(`/collaboration/${projectId}/comments/${commentId}`)
}

export const resolveComment = async (projectId: string, commentId: string, isResolved: boolean) => {
  return apiClient.patch(`/collaboration/${projectId}/comments/${commentId}/resolve`, {
    isResolved,
  })
}

export const getCommentStats = async (projectId: string) => {
  return apiClient.get(`/collaboration/${projectId}/comments/stats`)
}

// 权限管理API
export const getTeamMembers = async (
  projectId: string,
  params?: {
    role?: string
    status?: string
    search?: string
  }
) => {
  return apiClient.get(`/permissions/${projectId}/members`, { params })
}

export const inviteMember = async (
  projectId: string,
  data: {
    email: string
    role: string
    message?: string
  }
) => {
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

export const checkPermission = async (
  projectId: string,
  params: {
    permission: string
    userId?: string
  }
) => {
  return apiClient.get(`/permissions/${projectId}/permissions/check`, { params })
}

export const getPermissionStats = async (projectId: string) => {
  return apiClient.get(`/permissions/${projectId}/permissions/stats`)
}

// 功能模块管理API
export const getFeatureModules = async (
  projectId: string,
  params?: FeatureModuleQueryParams
): Promise<{ success: boolean; data: FeatureModulesResponse; message: string }> => {
  return apiClient.get(`/features/${projectId}/modules`, { params })
}

export const getFeatureModule = async (projectId: string, moduleId: string) => {
  return apiClient.get(`/features/${projectId}/modules/${moduleId}`)
}

export const createFeatureModule = async (
  projectId: string,
  data: CreateFeatureModuleData
) => {
  return apiClient.post(`/features/${projectId}/modules`, data)
}

export const updateFeatureModule = async (
  projectId: string, 
  moduleId: string, 
  data: UpdateFeatureModuleData
) => {
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
  return apiClient.get(`/ai/templates/${templateId}`)
}

export const renderCodeTemplate = async (templateId: string, variables: Record<string, any>) => {
  return apiClient.post(`/ai/templates/${templateId}/render`, { variables })
}

export const previewCodeTemplate = async (
  templateId: string,
  context: {
    model: any
    dialect: string
    [key: string]: any
  }
) => {
  return apiClient.post(`/ai/templates/${templateId}/preview`, { context })
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
  return apiClient.put(`/ai/templates/${templateId}`, updates)
}

export const deleteCodeTemplate = async (templateId: string) => {
  return apiClient.delete(`/ai/templates/${templateId}`)
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
      'Content-Type': 'multipart/form-data',
    },
  })
}

// ========== GitHub Issues 管理API ==========

/**
 * 获取项目的 Issues 列表
 * @param projectId - 项目 ID
 * @param filters - 筛选条件
 * @returns Issues 列表数据
 */
export const getIssues = async (
  projectId: string,
  filters?: {
    status?: string
    priority?: string
    issueType?: string
    assignee?: string
    search?: string
    page?: number
    limit?: number
  }
) => {
  return apiClient.get(`/${projectId}/issues`, { params: filters })
}

/**
 * 获取单个 Issue 详情
 * @param projectId - 项目 ID
 * @param issueId - Issue ID
 * @returns Issue 详细信息
 */
export const getIssue = async (projectId: string, issueId: string) => {
  return apiClient.get(`/${projectId}/issues/${issueId}`)
}

/**
 * 创建新 Issue
 * @param projectId - 项目 ID
 * @param data - Issue 创建数据
 * @returns 创建的 Issue 信息
 */
export const createIssue = async (projectId: string, data: any) => {
  return apiClient.post(`/${projectId}/issues`, data)
}

/**
 * 更新 Issue
 * @param projectId - 项目 ID
 * @param issueId - Issue ID
 * @param data - 更新数据
 * @returns 更新后的 Issue 信息
 */
export const updateIssue = async (projectId: string, issueId: string, data: any) => {
  return apiClient.put(`/${projectId}/issues/${issueId}`, data)
}

/**
 * 删除 Issue
 * @param projectId - 项目 ID
 * @param issueId - Issue ID
 * @returns 删除结果
 */
export const deleteIssue = async (projectId: string, issueId: string) => {
  return apiClient.delete(`/${projectId}/issues/${issueId}`)
}

/**
 * 获取 Issue 统计信息
 * @param projectId - 项目 ID
 * @returns Issue 统计数据
 */
export const getIssueStats = async (projectId: string) => {
  return apiClient.get(`/${projectId}/issues/stats`)
}

// ========== Issue 关联管理API ==========

/**
 * 获取 Issue 的所有关联关系
 * @param projectId - 项目 ID
 * @param issueId - Issue ID
 * @returns 关联关系数据
 */
export const getIssueRelations = async (projectId: string, issueId: string) => {
  return apiClient.get(`/${projectId}/issues/${issueId}/relations`)
}

/**
 * 添加 Issue 与 API 的关联
 * @param projectId - 项目 ID
 * @param issueId - Issue ID
 * @param data - 关联数据
 * @returns 创建的关联关系
 */
export const createIssueAPIRelation = async (
  projectId: string,
  issueId: string,
  data: {
    apiId?: string
    endpointId?: string
    relationType: string
    description?: string
  }
) => {
  return apiClient.post(`/${projectId}/issues/${issueId}/relations/api`, data)
}

/**
 * 添加 Issue 与数据表的关联
 * @param projectId - 项目 ID
 * @param issueId - Issue ID
 * @param data - 关联数据
 * @returns 创建的关联关系
 */
export const createIssueTableRelation = async (
  projectId: string,
  issueId: string,
  data: {
    tableId: string
    relationType: string
    description?: string
  }
) => {
  return apiClient.post(`/${projectId}/issues/${issueId}/relations/table`, data)
}

/**
 * 添加 Issue 与功能模块的关联
 * @param projectId - 项目 ID
 * @param issueId - Issue ID
 * @param data - 关联数据
 * @returns 创建的关联关系
 */
export const createIssueFeatureRelation = async (
  projectId: string,
  issueId: string,
  data: {
    featureName?: string
    featureId?: string  // 兼容旧的调用方式
    component?: string
    relationType: string
    description?: string
  }
) => {
  // 如果传入的是 featureId，需要转换为 featureName 和 component
  const requestData = { ...data }
  if (data.featureId && !data.featureName) {
    const parts = data.featureId.split('-')
    requestData.featureName = parts[0]
    requestData.component = parts.slice(1).join('-') || undefined
    delete requestData.featureId
  }
  
  return apiClient.post(`/${projectId}/issues/${issueId}/relations/feature`, requestData)
}

/**
 * 删除 Issue 与 API 的关联
 * @param projectId - 项目 ID
 * @param issueId - Issue ID
 * @param relationId - 关联 ID
 * @returns 删除结果
 */
export const deleteIssueAPIRelation = async (
  projectId: string,
  issueId: string,
  relationId: string
) => {
  return apiClient.delete(`/${projectId}/issues/${issueId}/relations/api/${relationId}`)
}

/**
 * 删除 Issue 与数据表的关联
 * @param projectId - 项目 ID
 * @param issueId - Issue ID
 * @param relationId - 关联 ID
 * @returns 删除结果
 */
export const deleteIssueTableRelation = async (
  projectId: string,
  issueId: string,
  relationId: string
) => {
  return apiClient.delete(`/${projectId}/issues/${issueId}/relations/table/${relationId}`)
}

/**
 * 删除 Issue 与功能模块的关联
 * @param projectId - 项目 ID
 * @param issueId - Issue ID
 * @param relationId - 关联 ID
 * @returns 删除结果
 */
export const deleteIssueFeatureRelation = async (
  projectId: string,
  issueId: string,
  relationId: string
) => {
  return apiClient.delete(`/${projectId}/issues/${issueId}/relations/feature/${relationId}`)
}

/**
 * 批量创建关联
 * @param projectId - 项目 ID
 * @param issueId - Issue ID
 * @param data - 批量关联数据
 * @returns 批量创建结果
 */
export const createBatchIssueRelations = async (
  projectId: string,
  issueId: string,
  data: {
    relations: Array<{
      type: 'api' | 'table' | 'feature'
      relationType: string
      [key: string]: any
    }>
  }
) => {
  return apiClient.post(`/${projectId}/issues/${issueId}/relations/batch`, data)
}

/**
 * 获取可关联的资源列表
 * @param projectId - 项目 ID
 * @param issueId - Issue ID
 * @param type - 资源类型
 * @returns 可关联的资源
 */
export const getAvailableIssueRelations = async (
  projectId: string,
  issueId: string,
  type?: 'api' | 'table' | 'feature'
) => {
  return apiClient.get(`/${projectId}/issues/${issueId}/relations/available`, {
    params: { type },
  })
}

// ========== GitHub 集成管理API ==========

/**
 * 获取项目的 GitHub 仓库配置
 * @param projectId - 项目 ID
 * @returns GitHub 仓库配置
 */
export const getGitHubRepository = async (projectId: string) => {
  return apiClient.get(`/${projectId}/github/repository`)
}

/**
 * 配置 GitHub 仓库
 * @param projectId - 项目 ID
 * @param data - 仓库配置数据
 * @returns 配置结果
 */
export const configureGitHubRepository = async (
  projectId: string,
  data: {
    owner: string
    name: string
    accessToken: string
    autoSync?: boolean
    syncInterval?: number
  }
) => {
  return apiClient.post(`/${projectId}/github/repository`, data)
}

/**
 * 验证 GitHub 仓库访问权限
 * @param projectId - 项目 ID
 * @param data - 验证数据
 * @returns 验证结果
 */
export const validateGitHubRepository = async (
  projectId: string,
  data: {
    owner: string
    name: string
    accessToken: string
  }
) => {
  return apiClient.post(`/${projectId}/github/repository/validate`, data)
}

/**
 * 从 GitHub 同步 Issues
 * @param projectId - 项目 ID
 * @param options - 同步选项
 * @returns 同步结果
 */
export const syncIssuesFromGitHub = async (
  projectId: string,
  options?: {
    syncLabels?: boolean
    syncComments?: boolean
    syncMilestones?: boolean
    dryRun?: boolean
  }
) => {
  return apiClient.post(`/${projectId}/github/sync/from-github`, options || {})
}

/**
 * 同步 Issues 到 GitHub
 * @param projectId - 项目 ID
 * @param options - 同步选项
 * @returns 同步结果
 */
export const syncIssuesToGitHub = async (
  projectId: string,
  options?: {
    syncLabels?: boolean
    syncComments?: boolean
    dryRun?: boolean
  }
) => {
  return apiClient.post(`/${projectId}/github/sync/to-github`, options || {})
}

/**
 * 双向同步 Issues
 * @param projectId - 项目 ID
 * @param options - 同步选项
 * @returns 同步结果
 */
export const syncIssuesBidirectional = async (
  projectId: string,
  options?: {
    syncLabels?: boolean
    syncComments?: boolean
    syncMilestones?: boolean
    dryRun?: boolean
  }
) => {
  return apiClient.post(`/${projectId}/github/sync/bidirectional`, options || {})
}

/**
 * 获取同步状态
 * @param projectId - 项目 ID
 * @returns 同步状态信息
 */
export const getGitHubSyncStatus = async (projectId: string) => {
  return apiClient.get(`/${projectId}/github/sync/status`)
}

/**
 * 删除 GitHub 仓库配置
 * @param projectId - 项目 ID
 * @returns 删除结果
 */
export const deleteGitHubRepository = async (projectId: string) => {
  return apiClient.delete(`/${projectId}/github/repository`)
}

// 导出API客户端实例（用于直接HTTP调用）
export const api = apiClient

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
  // GitHub Issues 管理
  getIssues,
  getIssue,
  createIssue,
  updateIssue,
  deleteIssue,
  getIssueStats,
  // Issue 关联管理
  getIssueRelations,
  createIssueAPIRelation,
  createIssueTableRelation,
  createIssueFeatureRelation,
  deleteIssueAPIRelation,
  deleteIssueTableRelation,
  deleteIssueFeatureRelation,
  createBatchIssueRelations,
  getAvailableIssueRelations,
  // GitHub 集成管理
  getGitHubRepository,
  configureGitHubRepository,
  validateGitHubRepository,
  syncIssuesFromGitHub,
  syncIssuesToGitHub,
  syncIssuesBidirectional,
  getGitHubSyncStatus,
  deleteGitHubRepository,
}

export default apiMethods
