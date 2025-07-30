// 项目状态枚举
export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED'
}

// API状态枚举
export enum APIStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  NOT_TESTED = 'NOT_TESTED',
  TESTED = 'TESTED',
  DEPRECATED = 'DEPRECATED'
}

// HTTP方法枚举
export enum HTTPMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS'
}

// 基础实体接口
export interface BaseEntity {
  id: string
  createdAt: Date | string
  updatedAt: Date | string
}

// 项目实体
export interface Project extends BaseEntity {
  name: string
  description?: string
  status: ProjectStatus
  apis?: API[]
  tags?: Tag[]
  _count?: {
    apis: number
    tags: number
  }
}

// API实体
export interface API extends BaseEntity {
  projectId: string
  name: string
  method: HTTPMethod
  path: string
  description?: string
  parameters?: Record<string, any>
  responses?: Record<string, any>
  status: APIStatus
  frontendCode?: string
  backendCode?: string
  project?: Pick<Project, 'id' | 'name'>
  apiTags?: APITag[]
}

// 标签实体
export interface Tag extends BaseEntity {
  name: string
  color: string
  projectId: string
  project?: Pick<Project, 'id' | 'name'>
  _count?: {
    apiTags: number
  }
}

// API标签关联
export interface APITag {
  apiId: string
  tagId: string
  api?: API
  tag?: Tag
}

// API状态标签映射
export const API_STATUS_LABELS: Record<APIStatus, string> = {
  [APIStatus.NOT_STARTED]: '未开发',
  [APIStatus.IN_PROGRESS]: '开发中',
  [APIStatus.COMPLETED]: '已完成',
  [APIStatus.NOT_TESTED]: '未测试',
  [APIStatus.TESTED]: '已测试',
  [APIStatus.DEPRECATED]: '已废弃'
}

// API状态颜色映射
export const API_STATUS_COLORS: Record<APIStatus, string> = {
  [APIStatus.NOT_STARTED]: 'bg-gray-100 text-gray-800',
  [APIStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
  [APIStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [APIStatus.NOT_TESTED]: 'bg-yellow-100 text-yellow-800',
  [APIStatus.TESTED]: 'bg-emerald-100 text-emerald-800',
  [APIStatus.DEPRECATED]: 'bg-red-100 text-red-800'
}

// HTTP方法颜色映射
export const HTTP_METHOD_COLORS: Record<HTTPMethod, string> = {
  [HTTPMethod.GET]: 'bg-blue-100 text-blue-800',
  [HTTPMethod.POST]: 'bg-green-100 text-green-800',
  [HTTPMethod.PUT]: 'bg-orange-100 text-orange-800',
  [HTTPMethod.PATCH]: 'bg-purple-100 text-purple-800',
  [HTTPMethod.DELETE]: 'bg-red-100 text-red-800',
  [HTTPMethod.HEAD]: 'bg-gray-100 text-gray-800',
  [HTTPMethod.OPTIONS]: 'bg-gray-100 text-gray-800'
}

// 项目状态标签映射
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  [ProjectStatus.ACTIVE]: '活跃',
  [ProjectStatus.ARCHIVED]: '已归档',
  [ProjectStatus.DELETED]: '已删除'
}