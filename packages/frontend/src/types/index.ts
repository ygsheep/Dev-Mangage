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

// 文档类型 (与后端保持一致)
export enum DocumentType {
  MARKDOWN = 'MARKDOWN',
  SQL = 'SQL',
  EXCEL = 'EXCEL',
  WORD = 'WORD',
  PDF = 'PDF',
  JSON = 'JSON',
  CSV = 'CSV',
  // 专用文档类型
  API_DOCUMENTATION = 'API_DOCUMENTATION',
  DATA_MODEL = 'DATA_MODEL',
  FEATURE_MODULE = 'FEATURE_MODULE',
  BUSINESS_PROCESS = 'BUSINESS_PROCESS',
  TECHNICAL_SPEC = 'TECHNICAL_SPEC'
}

// 文档类型中文映射
export const DOCUMENT_TYPE_LABELS = {
  [DocumentType.MARKDOWN]: 'Markdown文档',
  [DocumentType.SQL]: 'SQL脚本',
  [DocumentType.EXCEL]: 'Excel表格',
  [DocumentType.WORD]: 'Word文档',
  [DocumentType.PDF]: 'PDF文档',
  [DocumentType.JSON]: 'JSON数据',
  [DocumentType.CSV]: 'CSV表格',
  [DocumentType.API_DOCUMENTATION]: 'API接口文档',
  [DocumentType.DATA_MODEL]: '数据模型文档',
  [DocumentType.FEATURE_MODULE]: '功能模块文档',
  [DocumentType.BUSINESS_PROCESS]: '业务流程文档',
  [DocumentType.TECHNICAL_SPEC]: '技术规格文档'
}

// 文档类型颜色映射
export const DOCUMENT_TYPE_COLORS = {
  [DocumentType.MARKDOWN]: 'bg-blue-100 text-blue-800',
  [DocumentType.SQL]: 'bg-green-100 text-green-800',
  [DocumentType.EXCEL]: 'bg-yellow-100 text-yellow-800',
  [DocumentType.WORD]: 'bg-purple-100 text-purple-800',
  [DocumentType.PDF]: 'bg-red-100 text-red-800',
  [DocumentType.JSON]: 'bg-orange-100 text-orange-800',
  [DocumentType.CSV]: 'bg-teal-100 text-teal-800',
  [DocumentType.API_DOCUMENTATION]: 'bg-indigo-100 text-indigo-800',
  [DocumentType.DATA_MODEL]: 'bg-cyan-100 text-cyan-800',
  [DocumentType.FEATURE_MODULE]: 'bg-pink-100 text-pink-800',
  [DocumentType.BUSINESS_PROCESS]: 'bg-amber-100 text-amber-800',
  [DocumentType.TECHNICAL_SPEC]: 'bg-slate-100 text-slate-800'
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

// ========== GitHub Issues 相关类型定义 ==========

// Issue 状态枚举
export enum IssueStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED'
}

// Issue 优先级枚举
export enum IssuePriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

// Issue 严重程度枚举
export enum IssueSeverity {
  BLOCKER = 'BLOCKER',
  CRITICAL = 'CRITICAL',
  MAJOR = 'MAJOR',
  MINOR = 'MINOR',
  TRIVIAL = 'TRIVIAL',
  NORMAL = 'NORMAL'
}

// Issue 类型枚举
export enum IssueType {
  BUG = 'BUG',
  FEATURE = 'FEATURE',
  ENHANCEMENT = 'ENHANCEMENT',
  TASK = 'TASK',
  DOCUMENTATION = 'DOCUMENTATION',
  QUESTION = 'QUESTION'
}

// 同步状态枚举
export enum SyncStatus {
  LOCAL = 'LOCAL',
  SYNCED = 'SYNCED',
  SYNC_PENDING = 'SYNC_PENDING',
  SYNC_FAILED = 'SYNC_FAILED'
}

// 关联类型枚举
export enum RelationType {
  RELATES_TO = 'RELATES_TO',
  BLOCKS = 'BLOCKS',
  BLOCKED_BY = 'BLOCKED_BY',
  IMPLEMENTS = 'IMPLEMENTS',
  FIXES = 'FIXES',
  AFFECTS = 'AFFECTS',
  MODIFIES = 'MODIFIES',
  CREATES = 'CREATES',
  DROPS = 'DROPS',
  ENHANCES = 'ENHANCES',
  REFACTORS = 'REFACTORS'
}

// 关联类型中文映射
export const RELATION_TYPE_LABELS = {
  [RelationType.RELATES_TO]: '关联',
  [RelationType.BLOCKS]: '阻塞',
  [RelationType.BLOCKED_BY]: '被阻塞',
  [RelationType.IMPLEMENTS]: '实现',
  [RelationType.FIXES]: '修复',
  [RelationType.AFFECTS]: '影响',
  [RelationType.MODIFIES]: '修改',
  [RelationType.CREATES]: '创建',
  [RelationType.DROPS]: '删除',
  [RelationType.ENHANCES]: '增强',
  [RelationType.REFACTORS]: '重构'
}

// 关联类型颜色映射
export const RELATION_TYPE_COLORS = {
  [RelationType.RELATES_TO]: 'bg-blue-100 text-blue-800',
  [RelationType.BLOCKS]: 'bg-red-100 text-red-800',
  [RelationType.BLOCKED_BY]: 'bg-orange-100 text-orange-800',
  [RelationType.IMPLEMENTS]: 'bg-green-100 text-green-800',
  [RelationType.FIXES]: 'bg-purple-100 text-purple-800',
  [RelationType.AFFECTS]: 'bg-yellow-100 text-yellow-800',
  [RelationType.MODIFIES]: 'bg-indigo-100 text-indigo-800',
  [RelationType.CREATES]: 'bg-teal-100 text-teal-800',
  [RelationType.DROPS]: 'bg-pink-100 text-pink-800',
  [RelationType.ENHANCES]: 'bg-cyan-100 text-cyan-800',
  [RelationType.REFACTORS]: 'bg-amber-100 text-amber-800'
}

// Issue 标签接口
export interface IssueLabel {
  id: string
  issueId: string
  name: string
  color: string
  description?: string
  githubId?: string
  githubNodeId?: string
  createdAt: string
}

// Issue 评论接口
export interface IssueComment {
  id: string
  issueId: string
  content: string
  authorId?: string
  authorName?: string
  authorAvatar?: string
  githubId?: string
  githubNodeId?: string
  githubUrl?: string
  isInternal: boolean
  replyToId?: string
  createdAt: string
  updatedAt: string
  replies?: IssueComment[]
}

// Issue 附件接口
export interface IssueAttachment {
  id: string
  issueId: string
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  description?: string
  uploadedBy?: string
  createdAt: string
}

// Issue API 关联接口
export interface IssueAPIRelation {
  id: string
  issueId: string
  apiId?: string
  endpointId?: string
  relationType: RelationType
  description?: string
  createdAt: string
  api?: API
  endpoint?: any // APIEndpoint 类型
}

// Issue 数据表关联接口
export interface IssueTableRelation {
  id: string
  issueId: string
  tableId: string
  relationType: RelationType
  description?: string
  createdAt: string
  table?: any // DatabaseTable 类型
}

// Issue 功能模块关联接口
export interface IssueFeatureRelation {
  id: string
  issueId: string
  featureName: string
  component?: string
  relationType: RelationType
  description?: string
  createdAt: string
}

// Issue 里程碑接口
export interface IssueMilestone {
  id: string
  issueId: string
  title: string
  description?: string
  dueDate?: string
  progress: number
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  githubId?: number
  githubNodeId?: string
  githubUrl?: string
  createdAt: string
  updatedAt: string
}

// Issue 时间条目接口
export interface IssueTimeEntry {
  id: string
  issueId: string
  userId?: string
  userName?: string
  description?: string
  hours: number
  date: string
  billable: boolean
  createdAt: string
}

// 主要的 Issue 接口
export interface Issue {
  id: string
  projectId: string
  githubId?: number
  githubNodeId?: string
  title: string
  description?: string
  status: IssueStatus
  state: 'open' | 'closed'
  priority: IssuePriority
  severity: IssueSeverity
  issueType: IssueType
  
  // GitHub 集成
  githubUrl?: string
  githubNumber?: number
  githubHtmlUrl?: string
  githubApiUrl?: string
  repositoryName?: string
  repositoryOwner?: string
  
  // 分配和跟踪
  assigneeId?: string
  assigneeName?: string
  assigneeAvatar?: string
  reporterId?: string
  reporterName?: string
  reporterAvatar?: string
  
  // 生命周期跟踪
  createdAt: string
  updatedAt: string
  closedAt?: string
  dueDate?: string
  
  // 同步跟踪
  lastSyncAt?: string
  syncStatus: SyncStatus
  syncError?: string
  
  // 元数据
  estimatedHours?: number
  actualHours?: number
  storyPoints?: number
  
  // 关联数据
  labels?: IssueLabel[]
  comments?: IssueComment[]
  attachments?: IssueAttachment[]
  relatedAPIs?: IssueAPIRelation[]
  relatedTables?: IssueTableRelation[]
  relatedFeatures?: IssueFeatureRelation[]
  milestones?: IssueMilestone[]
  timeEntries?: IssueTimeEntry[]
}

// GitHub 仓库配置接口
export interface GitHubRepository {
  id: string
  projectId: string
  owner: string
  name: string
  fullName: string
  description?: string
  language?: string
  defaultBranch: string
  isPrivate: boolean
  isActive: boolean
  autoSync: boolean
  syncInterval: number
  lastSyncAt?: string
  htmlUrl?: string
  createdAt: string
  updatedAt: string
}

// Issue 统计信息接口
export interface IssueStats {
  total: number
  open: number
  closed: number
  byPriority: Record<IssuePriority, number>
  byType: Record<IssueType, number>
  recentActivity: Array<{
    id: string
    title: string
    status: IssueStatus
    priority: IssuePriority
    createdAt: string
    updatedAt: string
  }>
}

// 同步结果接口
export interface SyncResult {
  success: boolean
  synced: number
  created: number
  updated: number
  errors: Array<{
    message: string
    issueId?: string
    githubNumber?: number
  }>
  skipped: number
}

// 同步选项接口
export interface SyncOptions {
  syncDirection: 'GITHUB_TO_LOCAL' | 'LOCAL_TO_GITHUB' | 'BIDIRECTIONAL'
  syncLabels?: boolean
  syncComments?: boolean
  syncMilestones?: boolean
  dryRun?: boolean
}

// Issue 筛选选项接口
export interface IssueFilters {
  status?: IssueStatus
  priority?: IssuePriority
  issueType?: IssueType
  assignee?: string
  search?: string
  page?: number
  limit?: number
}

// Issue 创建数据接口
export interface CreateIssueData {
  title: string
  description?: string
  priority?: IssuePriority
  severity?: IssueSeverity
  issueType?: IssueType
  assigneeId?: string
  assigneeName?: string
  reporterId?: string
  reporterName?: string
  dueDate?: string
  estimatedHours?: number
  storyPoints?: number
  labels?: Array<{
    name: string
    color?: string
    description?: string
  }>
  relatedAPIs?: Array<{
    apiId?: string
    endpointId?: string
    relationType: RelationType
    description?: string
  }>
  relatedTables?: Array<{
    tableId: string
    relationType: RelationType
    description?: string
  }>
  relatedFeatures?: Array<{
    featureName: string
    component?: string
    relationType: RelationType
    description?: string
  }>
}

// 关联关系汇总接口
export interface IssueRelations {
  apis: IssueAPIRelation[]
  tables: IssueTableRelation[]
  features: IssueFeatureRelation[]
  summary: {
    totalRelations: number
    apiCount: number
    tableCount: number
    featureCount: number
  }
}

// 可关联资源接口
export interface AvailableRelations {
  apis?: Array<{
    id: string
    name: string
    method: string
    path: string
    status: string
    description?: string
  }>
  endpoints?: Array<{
    id: string
    name: string
    displayName?: string
    method: string
    path: string
    status: string
    description?: string
  }>
  tables?: Array<{
    id: string
    name: string
    displayName?: string
    comment?: string
    status: string
    category?: string
  }>
  features?: Array<{
    featureName: string
    component?: string
  }>
}

// Issue 状态中文映射
export const ISSUE_STATUS_LABELS = {
  [IssueStatus.OPEN]: '开放',
  [IssueStatus.CLOSED]: '已关闭'
}

// Issue 状态颜色映射
export const ISSUE_STATUS_COLORS = {
  [IssueStatus.OPEN]: 'bg-green-600 text-white',
  [IssueStatus.CLOSED]: 'bg-gray-600 text-white'
}

// Issue 优先级中文映射
export const ISSUE_PRIORITY_LABELS = {
  [IssuePriority.CRITICAL]: '紧急',
  [IssuePriority.HIGH]: '高',
  [IssuePriority.MEDIUM]: '中',
  [IssuePriority.LOW]: '低'
}

// Issue 优先级颜色映射
export const ISSUE_PRIORITY_COLORS = {
  [IssuePriority.CRITICAL]: 'bg-red-600 text-white',
  [IssuePriority.HIGH]: 'bg-orange-600 text-white',
  [IssuePriority.MEDIUM]: 'bg-yellow-600 text-white',
  [IssuePriority.LOW]: 'bg-blue-600 text-white'
}

// Issue 类型中文映射
export const ISSUE_TYPE_LABELS = {
  [IssueType.BUG]: 'Bug',
  [IssueType.FEATURE]: '新功能',
  [IssueType.ENHANCEMENT]: '功能增强',
  [IssueType.TASK]: '任务',
  [IssueType.DOCUMENTATION]: '文档',
  [IssueType.QUESTION]: '问题'
}

// Issue 类型颜色映射
export const ISSUE_TYPE_COLORS = {
  [IssueType.BUG]: 'bg-red-600 text-white',
  [IssueType.FEATURE]: 'bg-green-600 text-white',
  [IssueType.ENHANCEMENT]: 'bg-blue-600 text-white',
  [IssueType.TASK]: 'bg-purple-600 text-white',
  [IssueType.DOCUMENTATION]: 'bg-indigo-600 text-white',
  [IssueType.QUESTION]: 'bg-gray-600 text-white'
}

// Issue 严重程度中文映射
export const ISSUE_SEVERITY_LABELS = {
  [IssueSeverity.CRITICAL]: '致命',
  [IssueSeverity.MAJOR]: '严重',
  [IssueSeverity.MINOR]: '一般',
  [IssueSeverity.NORMAL]: '正常',
  [IssueSeverity.TRIVIAL]: '轻微'
}

// Issue 严重程度颜色映射
export const ISSUE_SEVERITY_COLORS = {
  [IssueSeverity.CRITICAL]: 'bg-red-100 text-red-800',
  [IssueSeverity.MAJOR]: 'bg-orange-100 text-orange-800',
  [IssueSeverity.MINOR]: 'bg-yellow-100 text-yellow-800',
  [IssueSeverity.NORMAL]: 'bg-blue-100 text-blue-800',
  [IssueSeverity.TRIVIAL]: 'bg-gray-100 text-gray-800'
}

// 同步状态中文映射
export const SYNC_STATUS_LABELS = {
  [SyncStatus.LOCAL]: '本地',
  [SyncStatus.SYNCED]: '已同步',
  [SyncStatus.SYNC_PENDING]: '待同步',
  [SyncStatus.SYNC_FAILED]: '同步失败'
}

// 同步状态颜色映射
export const SYNC_STATUS_COLORS = {
  [SyncStatus.LOCAL]: 'bg-gray-100 text-gray-800',
  [SyncStatus.SYNCED]: 'bg-green-100 text-green-800',
  [SyncStatus.SYNC_PENDING]: 'bg-yellow-100 text-yellow-800',
  [SyncStatus.SYNC_FAILED]: 'bg-red-100 text-red-800'
}

// ========== 功能模块管理 ==========

// 功能模块状态
export enum FeatureModuleStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  DEPRECATED = 'deprecated'
}

// 优先级
export enum FeatureModulePriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

// 任务状态
export enum ModuleTaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// 端点状态
export enum ModuleEndpointStatus {
  PLANNED = 'planned',
  IMPLEMENTING = 'implementing',
  IMPLEMENTED = 'implemented',
  TESTING = 'testing',
  DEPRECATED = 'deprecated'
}

// API端点接口
export interface APIEndpoint {
  id: string
  name: string
  method: string
  path: string
  status: ModuleEndpointStatus
  description?: string
}

// 功能模块统计信息
export interface FeatureModuleStats {
  totalEndpoints: number
  totalTasks: number
  totalDocuments: number
  completedTasks: number
}

// 功能模块接口
export interface FeatureModule {
  id: string
  projectId: string
  name: string
  displayName?: string
  description?: string
  status: FeatureModuleStatus
  category?: string
  priority: FeatureModulePriority
  progress: number
  tags: string[]
  techStack: string[]
  estimatedHours?: number
  actualHours?: number
  assigneeId?: string
  assigneeName?: string
  ownerId?: string
  ownerName?: string
  startDate?: string
  dueDate?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
  apiEndpoints: APIEndpoint[]
  stats: FeatureModuleStats
}

// 功能模块创建参数
export interface CreateFeatureModuleData {
  name: string
  displayName?: string
  description?: string
  category?: string
  priority?: FeatureModulePriority
  tags?: string[]
  techStack?: string[]
  estimatedHours?: number
  assigneeId?: string
  assigneeName?: string
  startDate?: string
  dueDate?: string
}

// 功能模块更新参数
export interface UpdateFeatureModuleData {
  name?: string
  displayName?: string
  description?: string
  category?: string
  priority?: FeatureModulePriority
  status?: FeatureModuleStatus
  progress?: number
  tags?: string[]
  techStack?: string[]
  estimatedHours?: number
  actualHours?: number
  assigneeId?: string
  assigneeName?: string
  startDate?: string
  dueDate?: string
  completedAt?: string
}

// 功能模块查询参数
export interface FeatureModuleQueryParams {
  status?: FeatureModuleStatus
  search?: string
}

// 功能模块API响应
export interface FeatureModulesResponse {
  modules: FeatureModule[]
  total: number
  summary: {
    planned: number
    inProgress: number
    completed: number
    total: number
  }
}

// 功能模块状态中文映射
export const FEATURE_MODULE_STATUS_LABELS = {
  [FeatureModuleStatus.PLANNED]: '计划中',
  [FeatureModuleStatus.IN_PROGRESS]: '开发中',
  [FeatureModuleStatus.COMPLETED]: '已完成',
  [FeatureModuleStatus.DEPRECATED]: '已废弃'
}

// 功能模块状态颜色映射
export const FEATURE_MODULE_STATUS_COLORS = {
  [FeatureModuleStatus.PLANNED]: 'bg-gray-100 text-gray-800',
  [FeatureModuleStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
  [FeatureModuleStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [FeatureModuleStatus.DEPRECATED]: 'bg-red-100 text-red-800'
}

// 优先级中文映射
export const FEATURE_MODULE_PRIORITY_LABELS = {
  [FeatureModulePriority.HIGH]: '高',
  [FeatureModulePriority.MEDIUM]: '中',
  [FeatureModulePriority.LOW]: '低'
}

// 优先级颜色映射
export const FEATURE_MODULE_PRIORITY_COLORS = {
  [FeatureModulePriority.HIGH]: 'bg-red-100 text-red-800',
  [FeatureModulePriority.MEDIUM]: 'bg-yellow-100 text-yellow-800',
  [FeatureModulePriority.LOW]: 'bg-green-100 text-green-800'
}