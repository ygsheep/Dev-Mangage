// 项目状态
export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED'
}

// API状态
export enum APIStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  NOT_TESTED = 'NOT_TESTED',
  TESTED = 'TESTED',
  DEPRECATED = 'DEPRECATED'
}

// HTTP方法
export enum HTTPMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS'
}

// API状态中文映射
export const API_STATUS_LABELS = {
  [APIStatus.NOT_STARTED]: '未开发',
  [APIStatus.IN_PROGRESS]: '开发中',
  [APIStatus.COMPLETED]: '已完成',
  [APIStatus.NOT_TESTED]: '未测试',
  [APIStatus.TESTED]: '已测试',
  [APIStatus.DEPRECATED]: '已废弃'
}

// API状态颜色映射
export const API_STATUS_COLORS = {
  [APIStatus.NOT_STARTED]: 'bg-gray-100 text-gray-800',
  [APIStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
  [APIStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [APIStatus.NOT_TESTED]: 'bg-yellow-100 text-yellow-800',
  [APIStatus.TESTED]: 'bg-emerald-100 text-emerald-800',
  [APIStatus.DEPRECATED]: 'bg-red-100 text-red-800'
}

// HTTP方法颜色映射
export const HTTP_METHOD_COLORS = {
  [HTTPMethod.GET]: 'bg-blue-100 text-blue-800',
  [HTTPMethod.POST]: 'bg-green-100 text-green-800',
  [HTTPMethod.PUT]: 'bg-orange-100 text-orange-800',
  [HTTPMethod.PATCH]: 'bg-purple-100 text-purple-800',
  [HTTPMethod.DELETE]: 'bg-red-100 text-red-800',
  [HTTPMethod.HEAD]: 'bg-gray-100 text-gray-800',
  [HTTPMethod.OPTIONS]: 'bg-gray-100 text-gray-800'
}

// 项目接口类型
export interface Project {
  id: string
  name: string
  description?: string
  status: ProjectStatus
  createdAt: string
  updatedAt: string
  apis?: API[]
  tags?: Tag[]
  _count?: {
    apis: number
    tags: number
  }
}

// API接口类型
export interface API {
  id: string
  projectId: string
  name: string
  method: HTTPMethod
  path: string
  description?: string
  parameters?: any
  responses?: any
  status: APIStatus
  frontendCode?: string
  backendCode?: string
  createdAt: string
  updatedAt: string
  apiTags?: APITag[]
}

// 标签接口类型
export interface Tag {
  id: string
  name: string
  color: string
  projectId: string
  createdAt: string
}

// API标签关联接口类型
export interface APITag {
  apiId: string
  tagId: string
  api: API
  tag: Tag
}

// Swagger导入数据类型
export interface SwaggerImportData {
  projectId: string
  swaggerUrl?: string
  swaggerJson?: any
}

// Swagger验证结果类型
export interface SwaggerValidationResult {
  valid: boolean
  error?: string
  info?: {
    title: string
    version: string
    description: string
    pathCount: number
    tagCount: number
    tags: string[]
  }
}