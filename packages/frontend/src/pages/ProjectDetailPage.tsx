import { API, APIStatus, HTTPMethod } from '@shared/types'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  BarChart3,
  Brain,
  Bug,
  Code2,
  Download,
  FileText,
  Filter,
  GitBranch,
  Grid3X3,
  List,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react'
import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiMethods } from '../utils/api'
// API管理组件
import APICard from '../components/features/api/components/APICard'
import TailwindAPICard from '../components/features/api/components/TailwindAPICard'
import APIDetailModal from '../components/features/api/components/modals/APIDetailModal'
import APITestModal from '../components/features/api/components/modals/APITestModal'
import CreateAPIModal from '../components/features/api/components/modals/CreateAPIModal'
import ImportSwaggerModal from '../components/features/import/components/modals/ImportSwaggerModal'


// 数据模型组件
import DataTableModal from '../components/features/data-model/components/modals/DataTableModal'
import FeatureModuleModal from '../components/features/data-model/components/modals/FeatureModuleModal'
import FeatureModuleList from '../components/features/data-model/components/FeatureModuleList'

// 项目管理组件
import ProjectStats from '../components/features/project/components/ProjectStats'
import ProjectSettingsModal from '../components/features/project/components/modals/ProjectSettingsModal'

// 关系图谱组件
import MindmapViewer from '../components/features/mindmap/components/MindmapViewer'

import {
  API_STATUS_LABELS,
  DATA_MODEL_STATUS_COLORS,
  DataModelStatus,
  DatabaseTable,
  HTTP_METHOD_COLORS,
} from '@shared/types'
import {
  FeatureModule,
  FEATURE_MODULE_STATUS_LABELS,
  FEATURE_MODULE_STATUS_COLORS,
  FEATURE_MODULE_PRIORITY_LABELS,
  FEATURE_MODULE_PRIORITY_COLORS,
} from '../types'

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
  const [selectedFeatureModule, setSelectedFeatureModule] = useState<FeatureModule | null>(null)
  const [selectedDataTable, setSelectedDataTable] = useState<DatabaseTable | null>(null)
  const [showDataTableModal, setShowDataTableModal] = useState(false)
  const [showAPITestModal, setShowAPITestModal] = useState(false)
  const [testingAPI, setTestingAPI] = useState<API | null>(null)
  const [showProjectSettings, setShowProjectSettings] = useState(false)

  // Fetch project details
  const {
    data: projectData,
    isLoading: projectLoading,
    refetch: refetchProject,
  } = useQuery({
    queryKey: ['project', id],
    queryFn: () => apiMethods.getProject(id!),
    enabled: !!id,
  })

  // Fetch project APIs
  const { data: apisData, refetch: refetchAPIs } = useQuery({
    queryKey: ['apis', id, search, statusFilter, methodFilter],
    queryFn: () =>
      apiMethods.getAPIs({
        projectId: id,
        search: search || undefined,
        status: statusFilter || undefined,
        method: methodFilter || undefined,
        limit: 100,
      }),
    enabled: !!id,
  })

  // Fetch data tables
  const { data: dataTablesData, refetch: refetchDataTables } = useQuery({
    queryKey: ['dataTables', id],
    queryFn: () =>
      apiMethods.getDataTables({
        projectId: id,
        limit: 100,
      }),
    enabled: !!id,
  })

  const project = projectData?.data?.project
  const apiEndpoints = apisData?.data?.apiEndpoints || []
  const realDataTables = dataTablesData?.data?.tables || []

  // 获取功能模块数据（使用真实API）
  const { data: featureModulesData, refetch: refetchFeatureModules } = useQuery({
    queryKey: ['featureModules', id],
    queryFn: () => apiMethods.getFeatureModules(id!),
    enabled: !!id,
  })

  const featureModules = featureModulesData?.data?.modules || []

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
        <h3 className="text-lg font-medium text-text-primary mb-2">项目不存在</h3>
        <p className="text-text-secondary mb-6">请检查项目ID是否正确</p>
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
          <Link to="/projects" className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{project.name}</h1>
            {project.description && <p className="text-text-secondary">{project.description}</p>}
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

          <Link
            to={`/projects/${id}/ai-parse`}
            className="btn-secondary flex items-center space-x-2"
          >
            <Brain className="w-4 h-4" />
            <span>AI解析</span>
          </Link>

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
            onClick={() => setActiveTab('issues')}
            className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'issues'
                ? 'border-primary-500 text-primary-600 bg-primary-50'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-secondary'
            }`}
          >
            <Bug className="w-4 h-4 mr-2" />
            Issues
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
                      onChange={e => setSearch(e.target.value)}
                      className="input pl-10"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as APIStatus | '')}
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
                    onChange={e => setMethodFilter(e.target.value as HTTPMethod | '')}
                    className="input w-auto min-w-[100px]"
                  >
                    <option value="">所有方法</option>
                    {Object.keys(HTTP_METHOD_COLORS).map(method => (
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
              {apiEndpoints.length > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-text-secondary">
                    <span>共 {apiEndpoints.length} 个接口</span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      {viewMode === 'card' ? (
                        <Grid3X3 className="w-3 h-3" />
                      ) : (
                        <List className="w-3 h-3" />
                      )}
                      <span>{viewMode === 'card' ? '卡片视图' : '列表视图'}</span>
                    </span>
                  </div>
                </div>
              )}

              {apiEndpoints.length === 0 ? (
                <div className="card text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Plus className="w-12 h-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-text-primary mb-2">还没有API</h3>
                  <p className="text-text-secondary mb-6">添加API或使用AI解析开始管理</p>
                  <div className="flex justify-center space-x-3">
                    <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                      添加API
                    </button>
                    <Link
                      to={`/projects/${id}/ai-parse`}
                      className="btn-secondary"
                    >
                      AI解析
                    </Link>
                  </div>
                </div>
              ) : (
                <div
                  className={
                    viewMode === 'card'
                      ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'
                      : 'space-y-2'
                  }
                >
                  {apiEndpoints.map((apiItem: API) => {
                    const CardComponent = useEnhancedComponents ? TailwindAPICard : APICard

                    return (
                      <CardComponent
                        key={apiItem.id}
                        api={apiItem}
                        onUpdate={() => refetchAPIs()}
                        onViewDetails={api => setSelectedAPI(api)}
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
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-text-primary mb-2">功能模块管理</h3>
              <p className="text-text-secondary">
                管理项目的功能模块，如用户登录、权限管理等业务功能。每个模块可以包含相关的API接口、开发任务和文档。
              </p>
            </div>
            <FeatureModuleList projectId={id!} />
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
                  <h4 className="text-lg font-semibold text-text-primary">
                    数据模型 ({allDataTables.length})
                  </h4>
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
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${DATA_MODEL_STATUS_COLORS[table.status]}`}
                      >
                        {table.status === DataModelStatus.DRAFT
                          ? '草稿'
                          : table.status === DataModelStatus.ACTIVE
                            ? '已创建'
                            : '已废弃'}
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
      ) : activeTab === 'issues' ? (
        /* Issues Tab Content */
        <div className="bg-bg-paper rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-text-primary">Issues 管理</h3>
              <p className="text-sm text-text-secondary">管理项目中的问题、功能需求和任务追踪</p>
            </div>
            <Link to={`/projects/${id}/issues`} className="btn-primary flex items-center space-x-2">
              <Bug className="w-4 h-4" />
              <span>进入 Issues</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* 统计卡片占位符 */}
            <div className="bg-bg-paper p-6 rounded-lg border shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Bug className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-text-secondary">总计 Issues</p>
                  <p className="text-2xl font-semibold text-text-primary">--</p>
                </div>
              </div>
            </div>
            <div className="bg-bg-paper p-6 rounded-lg border shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Bug className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-text-secondary">开放中</p>
                  <p className="text-2xl font-semibold text-text-primary">--</p>
                </div>
              </div>
            </div>
            <div className="bg-bg-paper p-6 rounded-lg border shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Bug className="w-6 h-6 text-text-secondary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-text-secondary">已关闭</p>
                  <p className="text-2xl font-semibold text-text-primary">--</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center py-12 bg-bg-paper rounded-lg">
            <Bug className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-text-primary mb-2">Issues 功能集成</h4>
            <p className="text-text-secondary mb-6 max-w-md mx-auto">
              点击上方的"进入 Issues"按钮开始管理项目中的问题、功能需求和任务追踪。 支持 GitHub
              同步、关联 API 和数据模型等高级功能。
            </p>
            <div className="flex justify-center space-x-3">
              <Link to={`/projects/${id}/issues`} className="btn-primary">
                开始使用 Issues
              </Link>
              <button onClick={() => setActiveTab('apis')} className="btn-outline">
                查看 API 接口
              </button>
            </div>
          </div>
        </div>
      ) : activeTab === 'mindmap' ? (
        /* Mindmap Tab Content */
        <div
          className="bg-bg-paper rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          style={{ height: 'calc(100vh - 240px)' }}
        >
          <MindmapViewer
            projectId={id!}
            height="100%"
            className="w-full h-full"
            onNodeSelect={node => {
              if (node?.data.entityType === 'table') {
                console.log('Selected table:', node.data.entityId)
                // 可以在这里添加表节点选择的处理逻辑
              }
            }}
            onEdgeSelect={edge => {
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
        onEdit={table => {
          console.log('Edit table:', table)
          // TODO: 实现编辑功能
        }}
        onDelete={tableId => {
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

      {/* Project Settings Modal */}
      <ProjectSettingsModal
        project={project}
        isOpen={showProjectSettings}
        onClose={() => setShowProjectSettings(false)}
        onUpdate={handleProjectUpdate}
      />
    </div>
  )
}

export default ProjectDetailPage
