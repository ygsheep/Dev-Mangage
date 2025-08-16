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
  baseUrl?: string  // 新增API测试基础URL
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

// 数据库字段类型枚举
export enum DatabaseFieldType {
  VARCHAR = 'VARCHAR',
  INT = 'INT',
  BIGINT = 'BIGINT',
  TEXT = 'TEXT',
  LONGTEXT = 'LONGTEXT',
  TIMESTAMP = 'TIMESTAMP',
  DATE = 'DATE',
  TIME = 'TIME',
  DATETIME = 'DATETIME',
  BOOLEAN = 'BOOLEAN',
  DECIMAL = 'DECIMAL',
  FLOAT = 'FLOAT',
  DOUBLE = 'DOUBLE',
  JSON = 'JSON',
  ENUM = 'ENUM',
  BLOB = 'BLOB',
  LONGBLOB = 'LONGBLOB'
}

// 数据库索引类型枚举
export enum DatabaseIndexType {
  PRIMARY = 'PRIMARY',
  UNIQUE = 'UNIQUE',
  INDEX = 'INDEX',
  FULLTEXT = 'FULLTEXT',
  FOREIGN = 'FOREIGN'
}

// 数据模型状态枚举
export enum DataModelStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  DEPRECATED = 'DEPRECATED'
}

// 数据库字段接口
export interface DatabaseField extends BaseEntity {
  tableId: string
  name: string
  type: DatabaseFieldType
  length?: number
  precision?: number
  scale?: number
  nullable: boolean
  defaultValue?: string
  comment?: string
  isPrimaryKey: boolean
  isAutoIncrement: boolean
  isUnique?: boolean
  isIndex?: boolean
  enumValues?: string[]
  referencedTableId?: string
  referencedFieldId?: string
  sortOrder: number
  table?: DatabaseTable
  enumValuesList?: FieldEnumValue[]
}

// 字段枚举值接口
export interface FieldEnumValue extends BaseEntity {
  fieldId: string
  value: string
  label?: string
  description?: string
  sortOrder: number
  isDefault: boolean
  field?: DatabaseField
}

// 数据库索引接口
export interface DatabaseIndex extends BaseEntity {
  tableId: string
  name: string
  type: DatabaseIndexType
  fields: string[] // 字段名数组
  isUnique: boolean
  comment?: string
}

// 数据库表接口
export interface DatabaseTable extends BaseEntity {
  projectId: string
  name: string
  displayName?: string
  comment?: string
  engine: string
  charset: string
  collation: string
  status: DataModelStatus
  category?: string // 表分类，如用户系统、内容系统等
  fields?: DatabaseField[]
  indexes?: DatabaseIndex[]
  relationshipCount?: number
  fromRelations?: TableRelationship[]
  toRelations?: TableRelationship[]
  project?: Project
}

// 数据模型文档接口
export interface DataModelDocument extends BaseEntity {
  projectId: string
  name: string
  description?: string
  filePath?: string
  content: string
  parsedTables?: DatabaseTable[]
  parseStatus: 'PENDING' | 'SUCCESS' | 'FAILED'
  parseError?: string
  language: string // markdown, sql等
  importedAt: Date | string
}

// 数据表关系接口
export interface TableRelationship extends BaseEntity {
  fromTableId: string
  toTableId: string
  fromFieldId: string
  toFieldId: string
  relationshipType: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_ONE' | 'MANY_TO_MANY'
  name?: string
  description?: string
  comment?: string
  onUpdate?: 'CASCADE' | 'SET_NULL' | 'SET_DEFAULT' | 'RESTRICT' | 'NO_ACTION'
  onDelete?: 'CASCADE' | 'SET_NULL' | 'SET_DEFAULT' | 'RESTRICT' | 'NO_ACTION'
  isDeferrable?: boolean
  isEnforced?: boolean
  constraintName?: string
  fromTable?: DatabaseTable
  toTable?: DatabaseTable
}

// 查询构建器接口（为未来实时查询功能预留）
export interface QueryBuilder {
  id: string
  name: string
  description?: string
  tableId: string
  queryType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
  conditions: QueryCondition[]
  fields: string[]
  joins: QueryJoin[]
  orderBy: QueryOrderBy[]
  limit?: number
  offset?: number
  createdAt: Date | string
  updatedAt: Date | string
}

export interface QueryCondition {
  field: string
  operator: 'EQ' | 'NE' | 'GT' | 'GTE' | 'LT' | 'LTE' | 'LIKE' | 'IN' | 'NOT_IN' | 'IS_NULL' | 'IS_NOT_NULL'
  value?: any
  logicalOperator?: 'AND' | 'OR'
}

export interface QueryJoin {
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL'
  tableId: string
  onField: string
  targetField: string
}

export interface QueryOrderBy {
  field: string
  direction: 'ASC' | 'DESC'
}

// 数据模型状态标签映射
export const DATA_MODEL_STATUS_LABELS: Record<DataModelStatus, string> = {
  [DataModelStatus.DRAFT]: '草稿',
  [DataModelStatus.ACTIVE]: '已创建',
  [DataModelStatus.DEPRECATED]: '已废弃'
}

// 数据模型状态颜色映射
export const DATA_MODEL_STATUS_COLORS: Record<DataModelStatus, string> = {
  [DataModelStatus.DRAFT]: 'bg-yellow-100 text-yellow-800',
  [DataModelStatus.ACTIVE]: 'bg-green-100 text-green-800',
  [DataModelStatus.DEPRECATED]: 'bg-red-100 text-red-800'
}

// 数据库字段类型标签映射
export const DATABASE_FIELD_TYPE_LABELS: Record<DatabaseFieldType, string> = {
  [DatabaseFieldType.VARCHAR]: '字符串',
  [DatabaseFieldType.INT]: '整数',
  [DatabaseFieldType.BIGINT]: '长整数',
  [DatabaseFieldType.TEXT]: '文本',
  [DatabaseFieldType.LONGTEXT]: '长文本',
  [DatabaseFieldType.TIMESTAMP]: '时间戳',
  [DatabaseFieldType.DATE]: '日期',
  [DatabaseFieldType.TIME]: '时间',
  [DatabaseFieldType.DATETIME]: '日期时间',
  [DatabaseFieldType.BOOLEAN]: '布尔值',
  [DatabaseFieldType.DECIMAL]: '小数',
  [DatabaseFieldType.FLOAT]: '浮点数',
  [DatabaseFieldType.DOUBLE]: '双精度',
  [DatabaseFieldType.JSON]: 'JSON',
  [DatabaseFieldType.ENUM]: '枚举',
  [DatabaseFieldType.BLOB]: '二进制',
  [DatabaseFieldType.LONGBLOB]: '长二进制'
}

// === API测试相关类型定义 ===

// API测试请求类型
export interface APITestRequest {
  method: HTTPMethod
  url: string
  headers?: Record<string, string>
  params?: Record<string, any>
  body?: any
  timeout?: number
}

// API测试响应类型
export interface APITestResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  data: any
  responseTime: number
  size: number
  timestamp: Date | string
}

// API测试结果类型
export interface APITestResult extends BaseEntity {
  apiId: string
  projectId: string
  request: APITestRequest
  response?: APITestResponse
  error?: {
    code: string
    message: string
    details?: any
  }
  status: 'SUCCESS' | 'ERROR' | 'TIMEOUT'
  executedAt: Date | string
  executedBy?: string
}

// API测试历史记录
export interface APITestHistory extends BaseEntity {
  apiId: string
  projectId: string
  results: APITestResult[]
  totalTests: number
  successCount: number
  errorCount: number
  averageResponseTime: number
  lastTestAt?: Date | string
}

// API参数定义
export interface APIParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  required: boolean
  description?: string
  example?: any
  enum?: any[]
  format?: string // date, email, url, etc.
  location: 'query' | 'path' | 'header' | 'body'
}

// API响应定义
export interface APIResponseSchema {
  statusCode: number
  description?: string
  headers?: Record<string, string>
  schema?: {
    type: string
    properties?: Record<string, any>
    example?: any
  }
}

// 增强的API接口定义
export interface EnhancedAPI extends API {
  parameters?: APIParameter[]
  responses?: APIResponseSchema[]
  testHistory?: APITestHistory
  lastTestResult?: APITestResult
}