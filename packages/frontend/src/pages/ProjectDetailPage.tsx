import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Filter, 
  Download,
  Settings,
  BarChart3,
  Upload,
  Code2,
  Users,
  Grid3X3,
  List,
  Sparkles,
  FileText,
  GitBranch,
  RefreshCw
} from 'lucide-react'
import { API, APIStatus, HTTPMethod } from '@shared/types'
import { apiMethods } from '../utils/api'
// API管理组件
import APICard from '../components/features/api/components/APICard'
import CreateAPIModal from '../components/features/api/components/modals/CreateAPIModal'
import ImportSwaggerModal from '../components/features/import/components/modals/ImportSwaggerModal'
import APIDetailModal from '../components/features/api/components/modals/APIDetailModal'
import TailwindAPICard from '../components/features/api/components/TailwindAPICard'
import APITestModal from '../components/features/api/components/modals/APITestModal'

// 导入功能组件
import ImportAPIDocModal from '../components/features/import/components/modals/ImportAPIDocModal'
import UnifiedImportModal from '../components/features/import/components/modals/UnifiedImportModal'

// 数据模型组件
import FeatureModuleModal from '../components/features/data-model/components/modals/FeatureModuleModal'
import DataTableModal from '../components/features/data-model/components/modals/DataTableModal'

// 项目管理组件
import ProjectStats from '../components/features/project/components/ProjectStats'
import ProjectSettingsModal from '../components/features/project/components/modals/ProjectSettingsModal'

// 关系图谱组件
import MindmapViewer from '../components/features/mindmap/components/MindmapViewer'

import toast from 'react-hot-toast'
import { API_STATUS_LABELS, HTTP_METHOD_COLORS, DatabaseTable, DataModelStatus, DATA_MODEL_STATUS_COLORS } from '@shared/types'

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<APIStatus | ''>('')
  const [methodFilter, setMethodFilter] = useState<HTTPMethod | ''>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [activeTab, setActiveTab] = useState<'apis' | 'features' | 'models' | 'mindmap'>('apis')
  const [selectedAPI, setSelectedAPI] = useState<API | null>(null)
  const [useEnhancedComponents, setUseEnhancedComponents] = useState(true)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  const [selectedFeatureModule, setSelectedFeatureModule] = useState<any>(null)
  const [selectedDataTable, setSelectedDataTable] = useState<DatabaseTable | null>(null)
  const [showDataTableModal, setShowDataTableModal] = useState(false)
  const [showAPITestModal, setShowAPITestModal] = useState(false)
  const [testingAPI, setTestingAPI] = useState<API | null>(null)
  const [showImportAPIDocModal, setShowImportAPIDocModal] = useState(false)
  const [showProjectSettings, setShowProjectSettings] = useState(false)
  const [showUnifiedImportModal, setShowUnifiedImportModal] = useState(false)

  // Fetch project details
  const { data: projectData, isLoading: projectLoading, refetch: refetchProject } = useQuery({
    queryKey: ['project', id],
    queryFn: () => apiMethods.getProject(id!),
    enabled: !!id,
  })

  // Fetch project APIs
  const { data: apisData, refetch: refetchAPIs } = useQuery({
    queryKey: ['apis', id, search, statusFilter, methodFilter],
    queryFn: () => apiMethods.getAPIs({
      projectId: id,
      search: search || undefined,
      status: statusFilter || undefined,
      method: methodFilter || undefined,
      limit: 100
    }),
    enabled: !!id,
  })

  // Fetch data tables
  const { data: dataTablesData, refetch: refetchDataTables } = useQuery({
    queryKey: ['dataTables', id],
    queryFn: () => apiMethods.getDataTables({
      projectId: id,
      limit: 100
    }),
    enabled: !!id,
  })

  const project = projectData?.data?.project
  const apis = apisData?.data?.apis || []
  const realDataTables = dataTablesData?.data?.tables || []

  // 获取功能模块数据（使用真实API）
  const { data: featureModulesData, refetch: refetchFeatureModules } = useQuery({
    queryKey: ['featureModules', id],
    queryFn: () => apiMethods.getFeatureModules(id!),
    enabled: !!id,
  })

  const featureModules = featureModulesData?.data?.modules || []

  // 示例数据表数据（仅在演示时使用）
  const _getSampleDataTables = (): DatabaseTable[] => {
    return [
      {
        id: 'table-1',
        projectId: id!,
        name: 'users',
        displayName: '用户表',
        comment: '用户基础信息表，包含用户名、邮箱、密码等核心字段',
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collation: 'utf8mb4_unicode_ci',
        status: DataModelStatus.ACTIVE,
        category: '用户系统',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fields: [
          {
            id: 'field-1',
            tableId: 'table-1',
            name: 'id',
            type: 'BIGINT' as any,
            nullable: false,
            isPrimaryKey: true,
            isAutoIncrement: true,
            comment: '用户ID',
            sortOrder: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'field-2',
            tableId: 'table-1',
            name: 'username',
            type: 'VARCHAR' as any,
            length: 50,
            nullable: false,
            isPrimaryKey: false,
            isAutoIncrement: false,
            comment: '用户名',
            sortOrder: 2,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'field-3',
            tableId: 'table-1',
            name: 'email',
            type: 'VARCHAR' as any,
            length: 100,
            nullable: false,
            isPrimaryKey: false,
            isAutoIncrement: false,
            comment: '邮箱地址',
            sortOrder: 3,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ],
        relationshipCount: 2
      },
      {
        id: 'table-2',
        projectId: id!,
        name: 'news_metadata',
        displayName: '资讯表',
        comment: '资讯元数据表，存储新闻标题、摘要、发布时间等信息',
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collation: 'utf8mb4_unicode_ci',
        status: DataModelStatus.ACTIVE,
        category: '内容系统',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fields: [
          {
            id: 'field-4',
            tableId: 'table-2',
            name: 'id',
            type: 'BIGINT' as any,
            nullable: false,
            isPrimaryKey: true,
            isAutoIncrement: true,
            comment: '资讯ID',
            sortOrder: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'field-5',
            tableId: 'table-2',
            name: 'title',
            type: 'VARCHAR' as any,
            length: 500,
            nullable: false,
            isPrimaryKey: false,
            isAutoIncrement: false,
            comment: '资讯标题',
            sortOrder: 2,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ],
        relationshipCount: 5
      },
      {
        id: 'table-3',
        projectId: id!,
        name: 'comments',
        displayName: '评论表',
        comment: '用户评论表，支持多级回复和时间戳评论功能',
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collation: 'utf8mb4_unicode_ci',
        status: DataModelStatus.DRAFT,
        category: '社区系统',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fields: [],
        relationshipCount: 0
      }
    ]
  }

  const handleTableClick = (table: DatabaseTable) => {
    setSelectedDataTable(table)
    setShowDataTableModal(true)
  }

  // 直接使用真实数据，不再显示示例数据
  const allDataTables = realDataTables

  // API测试功能处理函数
  const handleTestAPI = (api: API) => {
    setTestingAPI(api)
    setShowAPITestModal(true)
  }

  const handleUpdateBaseUrl = async (baseUrl: string) => {
    if (!project) return
    try {
      const updateData = { baseUrl }
      await apiMethods.updateProject(project.id, updateData)
      // 这里应该更新本地状态或重新获取项目数据
      // 为了演示，我们暂时只显示成功消息
    } catch (error) {
      console.error('更新Base URL失败:', error)
    }
  }

  const handleImportAPIDocSuccess = (importedAPIs: API[]) => {
    // 这里应该将导入的API添加到数据库
    // 为了演示，我们显示成功消息并刷新API列表
    console.log('导入的API:', importedAPIs)
    refetchAPIs()
  }

  const handleUnifiedImportSuccess = () => {
    // 根据导入类型执行相应的操作
    refetchAPIs() // 刷新API列表
    setShowUnifiedImportModal(false)
  }

  const handleProjectUpdate = (updatedProject: any) => {
    // 这里应该更新本地项目数据
    console.log('项目已更新:', updatedProject)
  }

  if (projectLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-48 h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="w-full h-32 bg-gray-200 rounded animate-pulse"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="card text-center py-12">
        <h3 className="text-lg font-medium text-text-primary mb-2">
          项目不存在
        </h3>
        <p className="text-text-secondary mb-6">
          请检查项目ID是否正确
        </p>
        <Link to="/projects" className="btn-primary">
          返回项目列表
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-4 mb-4">
          <Link
            to="/projects"
            className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{project.name}</h1>
            {project.description && (
              <p className="text-text-secondary">{project.description}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>添加API</span>
          </button>
          
          <button
            onClick={() => setShowUnifiedImportModal(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <FileText className="w-4 h-4" />
            <span>导入文档</span>
          </button>

          <button
            onClick={() => setShowStats(!showStats)}
            className="btn-outline flex items-center space-x-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span>统计信息</span>
          </button>

          <button
            onClick={() => setUseEnhancedComponents(!useEnhancedComponents)}
            className={`btn-outline flex items-center space-x-2 ${useEnhancedComponents ? 'bg-primary-50 dark:bg-primary-900/20 text-blue-600 border-blue-300' : ''}`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{useEnhancedComponents ? '增强模式' : '标准模式'}</span>
          </button>


          <div className="flex items-center bg-bg-tertiary rounded-lg p-1">
            <button
              onClick={() => setViewMode('card')}
              className={`px-3 py-1.5 flex items-center space-x-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'card' 
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 shadow-sm' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              <span>卡片</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 flex items-center space-x-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'list' 
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 shadow-sm' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
              }`}
            >
              <List className="w-4 h-4" />
              <span>列表</span>
            </button>
          </div>

          <button className="btn-outline flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>导出</span>
          </button>

          <Link
            to={`/api-management?project=${id}`}
            className="btn-outline flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>API管理</span>
          </Link>

          <button 
            onClick={() => setShowProjectSettings(true)}
            className="btn-outline flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>设置</span>
          </button>
        </div>
      </div>

      {/* Project Stats */}
      {showStats && <ProjectStats projectId={id!} />}

      {/* Tab Navigation */}
      <div className="bg-bg-paper rounded-lg shadow-theme-sm border border-border-primary">
        <div className="flex border-b border-border-primary">
          <button
            onClick={() => setActiveTab('apis')}
            className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'apis'
                ? 'border-primary-500 text-primary-600 bg-primary-50'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-secondary'
            }`}
          >
            <Code2 className="w-4 h-4 mr-2" />
            接口管理
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'features'
                ? 'border-primary-500 text-primary-600 bg-primary-50'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-secondary'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            功能模块
          </button>
          <button
            onClick={() => setActiveTab('models')}
            className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'models'
                ? 'border-primary-500 text-primary-600 bg-primary-50'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-secondary'
            }`}
          >
            <Grid3X3 className="w-4 h-4 mr-2" />
            数据模型
          </button>
          <button
            onClick={() => setActiveTab('mindmap')}
            className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'mindmap'
                ? 'border-primary-500 text-primary-600 bg-primary-50'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-secondary'
            }`}
          >
            <GitBranch className="w-4 h-4 mr-2" />
            关系图谱
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'apis' ? (
        <>
          {/* 同步管理快捷入口 */}
          <div className="bg-primary-50 dark:bg-primary-900/20 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <RefreshCw className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800">API同步管理</h3>
                  <p className="text-xs text-blue-600">
                    自动保持数据模型与API接口的一致性，支持双向同步和冲突检测
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Link
                  to={`/api-management?project=${id}`}
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Settings className="w-4 h-4 mr-1" />
                  管理同步
                </Link>
                <button className="inline-flex items-center px-3 py-1.5 text-sm border border-blue-300 text-blue-700 bg-bg-paper rounded-md hover:bg-primary-50 dark:bg-primary-900/20">
                  <RefreshCw className="w-4 h-4 mr-1" />
                  快速同步
                </button>
              </div>
            </div>
          </div>

          {/* 标准API展示模式 */}
          <>
            {/* Filters */}
          <div className="card">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索API..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as APIStatus | '')}
              className="input w-auto min-w-[120px]"
            >
              <option value="">所有状态</option>
              {Object.entries(API_STATUS_LABELS).map(([status, label]) => (
                <option key={status} value={status}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Method Filter */}
          <div>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as HTTPMethod | '')}
              className="input w-auto min-w-[100px]"
            >
              <option value="">所有方法</option>
              {Object.keys(HTTP_METHOD_COLORS).map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* APIs Grid/List */}
      <div className="space-y-4">
        {/* View mode indicator */}
        {apis.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-text-secondary">
              <span>共 {apis.length} 个接口</span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                {viewMode === 'card' ? <Grid3X3 className="w-3 h-3" /> : <List className="w-3 h-3" />}
                <span>{viewMode === 'card' ? '卡片视图' : '列表视图'}</span>
              </span>
            </div>
          </div>
        )}
        
        {apis.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-gray-400 mb-4">
              <Plus className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-2">
              还没有API
            </h3>
            <p className="text-text-secondary mb-6">
              添加API或导入文档开始管理
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                添加API
              </button>
              <button
                onClick={() => setShowUnifiedImportModal(true)}
                className="btn-secondary"
              >
                导入文档
              </button>
            </div>
          </div>
        ) : (
          <div className={viewMode === 'card' ? 
            "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" : 
            "space-y-2"
          }>
            {apis.map((apiItem: API) => {
              const CardComponent = useEnhancedComponents ? TailwindAPICard : APICard
              
              return (
                <CardComponent
                  key={apiItem.id}
                  api={apiItem}
                  onUpdate={() => refetchAPIs()}
                  onViewDetails={(api) => setSelectedAPI(api)}
                  onTestAPI={useEnhancedComponents ? handleTestAPI : undefined}
                  compact={viewMode === 'list'}
                  showMetrics={useEnhancedComponents}
                />
              )
            })}
          </div>
        )}
      </div>
          </>
        </>
      ) : activeTab === 'features' ? (
        /* Features Tab Content */
        <div className="card">
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">功能模块</h3>
            <p className="text-text-secondary mb-6">
              在这里管理项目的功能模块，如用户登录、权限管理等业务功能
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {/* Feature Modules with click handlers */}
              {featureModules.map((module) => (
                <div 
                  key={module.id}
                  className="bg-bg-paper border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all cursor-pointer transform hover:scale-105"
                  onClick={() => setSelectedFeatureModule(module)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-text-primary">{module.name}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      module.status === 'completed' ? 'bg-green-100 text-green-800' :
                      module.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-bg-tertiary text-text-secondary'
                    }`}>
                      {module.status === 'completed' ? '已完成' :
                       module.status === 'in-progress' ? '开发中' : '规划中'}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary mb-4">
                    {module.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {module.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                    <span>API数量: {module.apis?.length || 0}</span>
                    <span>类别: {module.category || '通用'}</span>
                    <span className="text-blue-600 font-medium">点击查看</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : activeTab === 'models' ? (
        /* Data Models Tab Content */
        <div className="card">
          <div className="text-center py-12">
            <Grid3X3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">数据模型管理</h3>
            <p className="text-text-secondary mb-6">
              设计和管理数据库表结构，支持ER图设计、AI文档解析、SQL生成等完整功能
            </p>
            <div className="space-y-4">
              <Link
                to={`/projects/${id}/data-model`}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Grid3X3 className="w-5 h-5" />
                <span>打开数据模型设计器</span>
              </Link>
              <p className="text-sm text-gray-500">
                包含ER图设计、关系管理、SQL生成、版本控制等强大功能
              </p>
            </div>
            <div className="max-w-4xl mx-auto">
              {/* Quick action when data exists */}
              {allDataTables.length > 0 && (
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-semibold text-text-primary">数据模型 ({allDataTables.length})</h4>
                  <div className="flex items-center space-x-2">
                    <button className="btn-outline flex items-center space-x-2 text-sm">
                      <Plus className="w-4 h-4" />
                      <span>新建表</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Data Models */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allDataTables.map((table: DatabaseTable) => (
                  <div 
                    key={table.id}
                    className="bg-bg-paper border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all cursor-pointer transform hover:scale-105"
                    onClick={() => handleTableClick(table)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-text-primary">
                        {table.displayName || table.name} ({table.name})
                      </h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${DATA_MODEL_STATUS_COLORS[table.status]}`}>
                        {table.status === DataModelStatus.DRAFT ? '草稿' : 
                         table.status === DataModelStatus.ACTIVE ? '已创建' : '已废弃'}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary mb-4">
                      {table.comment || '暂无描述'}
                    </p>
                    <div className="text-xs text-gray-500 space-y-1 mb-3">
                      <div>字段数量: {table.fields?.length || 0}</div>
                      <div>索引数量: {table.indexes?.length || 0}</div>
                      <div>存储引擎: {table.engine}</div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                      <span>分类: {table.category || '未分类'}</span>
                      <span className="text-blue-600 font-medium">点击查看</span>
                    </div>
                  </div>
                ))}
                
                {/* This empty state is handled above, so it's redundant here */}
              </div>

              {/* Action Buttons - Only show when no data exists */}
              {allDataTables.length === 0 && (
                <div className="mt-8 flex justify-center space-x-4">
                  <button className="btn-outline flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>新建数据表</span>
                  </button>
                  <button className="btn-outline flex items-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span>数据库设置</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === 'mindmap' ? (
        /* Mindmap Tab Content */
        <div className="bg-bg-paper rounded-lg shadow-sm border border-gray-200 overflow-hidden" style={{ height: 'calc(100vh - 240px)' }}>
          <MindmapViewer
            projectId={id!}
            height="100%"
            className="w-full h-full"
            onNodeSelect={(node) => {
              if (node?.data.entityType === 'table') {
                console.log('Selected table:', node.data.entityId)
                // 可以在这里添加表节点选择的处理逻辑
              }
            }}
            onEdgeSelect={(edge) => {
              console.log('Selected relationship:', edge?.data.relationshipId)
              // 可以在这里添加关系选择的处理逻辑
            }}
          />
        </div>
      ) : null}

      {/* Modals */}
      {showCreateModal && (
        <CreateAPIModal
          projectId={id!}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            refetchAPIs()
          }}
        />
      )}

      {showImportModal && (
        <ImportSwaggerModal
          isOpen={showImportModal}
          projectId={id!}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false)
            refetchAPIs()
          }}
        />
      )}

      {/* API Detail Modal */}
      {selectedAPI && (
        <APIDetailModal
          api={selectedAPI}
          isOpen={!!selectedAPI}
          onClose={() => setSelectedAPI(null)}
          projectBaseUrl={project?.baseUrl}
          onTestAPI={handleTestAPI}
        />
      )}

      {/* Feature Module Modal */}
      {selectedFeatureModule && (
        <FeatureModuleModal
          module={selectedFeatureModule}
          isOpen={!!selectedFeatureModule}
          onClose={() => setSelectedFeatureModule(null)}
        />
      )}

      {/* Data Table Modal */}
      <DataTableModal
        table={selectedDataTable}
        isOpen={showDataTableModal}
        onClose={() => {
          setShowDataTableModal(false)
          setSelectedDataTable(null)
        }}
        onEdit={(table) => {
          console.log('Edit table:', table)
          // TODO: 实现编辑功能
        }}
        onDelete={(tableId) => {
          console.log('Delete table:', tableId)
          // TODO: 实现删除功能
        }}
      />

      {/* API Test Modal */}
      <APITestModal
        api={testingAPI}
        isOpen={showAPITestModal}
        onClose={() => {
          setShowAPITestModal(false)
          setTestingAPI(null)
        }}
        projectBaseUrl={project?.baseUrl}
        onUpdateBaseUrl={handleUpdateBaseUrl}
      />

      {/* Import API Document Modal */}
      <ImportAPIDocModal
        isOpen={showImportAPIDocModal}
        onClose={() => setShowImportAPIDocModal(false)}
        onSuccess={handleImportAPIDocSuccess}
        projectId={id!}
      />

      {/* Project Settings Modal */}
      <ProjectSettingsModal
        project={project}
        isOpen={showProjectSettings}
        onClose={() => setShowProjectSettings(false)}
        onUpdate={handleProjectUpdate}
      />

      {/* Unified Import Modal */}
      <UnifiedImportModal
        isOpen={showUnifiedImportModal}
        onClose={() => setShowUnifiedImportModal(false)}
        onSuccess={handleUnifiedImportSuccess}
        projectId={id!}
      />
    </div>
  )
}

export default ProjectDetailPage