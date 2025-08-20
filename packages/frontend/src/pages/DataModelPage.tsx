import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Database,
  Layers,
  GitBranch,
  Code,
  Brain,
  Settings,
  Eye,
  BarChart3,
  Download,
  Plus,
  Search,
  Filter,
  RefreshCw,
  MessageSquare,
  Shield,
  X,
  ArrowLeft
} from 'lucide-react'

// 导入新创建的数据模型组件
import ERDiagramDesigner from '../components/features/data-model/components/ERDiagramDesigner'
import AIDocumentParser from '../components/features/data-model/components/AIDocumentParser'
import RelationshipManager from '../components/features/data-model/components/RelationshipManager'
import SQLGenerator from '../components/features/data-model/components/SQLGenerator'
import VersionControl from '../components/features/data-model/components/VersionControl'
import IndexPerformanceAnalyzer from '../components/features/data-model/components/IndexPerformanceAnalyzer'
import MigrationPlanner from '../components/features/data-model/components/MigrationPlanner'
import TableDetailModal from '../components/features/data-model/components/TableDetailModal'
import CollaborationPanel from '../components/features/data-model/components/CollaborationPanel'
import PermissionManager from '../components/features/data-model/components/PermissionManager'
import UXEnhancement from '../components/features/data-model/components/UXEnhancement'

// 导入现有组件
import DataTableModal from '../components/features/data-model/components/modals/DataTableModal'

import { DatabaseTable, TableRelationship, DatabaseField, DatabaseIndex } from '@shared/types'
import { getDataTables, getTableRelationships } from '../utils/api'
import { toast } from 'react-hot-toast'

type TabType = 'overview' | 'diagram' | 'relationships' | 'sql' | 'versions' | 'ai' | 'performance' | 'migration' | 'collaboration' | 'permissions'

const DataModelPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [tables, setTables] = useState<DatabaseTable[]>([])
  const [relationships, setRelationships] = useState<TableRelationship[]>([])
  const [selectedTable, setSelectedTable] = useState<DatabaseTable | null>(null)
  const [showAIParser, setShowAIParser] = useState(false)
  const [showTableDetail, setShowTableDetail] = useState<DatabaseTable | null>(null)
  const [showCreateTable, setShowCreateTable] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // 真实数据加载
  useEffect(() => {
    const loadData = async () => {
      if (!projectId) return
      
      setIsLoading(true)
      
      try {
        // 加载项目的数据表
        const tablesResponse = await getDataTables({ projectId })
        const tables = tablesResponse?.data?.tables || []
        
        // 加载表关系
        const relationshipsResponse = await getTableRelationships(projectId)
        const relationships = relationshipsResponse?.data?.relationships || []
        
        setTables(tables)
        setRelationships(relationships)
      } catch (error) {
        console.error('加载数据模型失败:', error)
        toast.error('加载数据模型失败')
        
        // 如果API失败，使用空数据
        setTables([])
        setRelationships([])
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [projectId])

  const handleTableCreate = (tableData: Omit<DatabaseTable, 'id'>) => {
    const newTable: DatabaseTable = {
      ...tableData,
      id: `table-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      fields: [],
      indexes: []
    }
    setTables(prev => [...prev, newTable])
  }

  const handleTableUpdate = (tableId: string, updates: Partial<DatabaseTable>) => {
    setTables(prev => prev.map(table => 
      table.id === tableId 
        ? { ...table, ...updates, updatedAt: new Date() }
        : table
    ))
  }

  const handleTableDelete = (tableId: string) => {
    setTables(prev => prev.filter(table => table.id !== tableId))
    // 同时删除相关的关系
    setRelationships(prev => prev.filter(rel => 
      rel.fromTableId !== tableId && rel.toTableId !== tableId
    ))
  }

  const handleRelationshipCreate = (relationshipData: Omit<TableRelationship, 'id'>) => {
    const newRelationship: TableRelationship = {
      ...relationshipData,
      id: `rel-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    setRelationships(prev => [...prev, newRelationship])
  }

  const handleRelationshipUpdate = (relationshipId: string, updates: Partial<TableRelationship>) => {
    setRelationships(prev => prev.map(rel => 
      rel.id === relationshipId 
        ? { ...rel, ...updates, updatedAt: new Date() }
        : rel
    ))
  }

  const handleRelationshipDelete = (relationshipId: string) => {
    setRelationships(prev => prev.filter(rel => rel.id !== relationshipId))
  }

  // 快捷键处理
  const handleShortcutTrigger = (shortcutId: string) => {
    switch (shortcutId) {
      case 'goto-overview':
        setActiveTab('overview')
        break
      case 'goto-diagram':
        setActiveTab('diagram')
        break
      case 'goto-relationships':
        setActiveTab('relationships')
        break
      case 'goto-sql':
        setActiveTab('sql')
        break
      case 'create-table':
        setShowCreateTable(true)
        break
      case 'save':
        toast.success('数据已保存')
        break
      case 'export':
        toast.success('正在导出SQL...')
        break
      default:
        console.log('未处理的快捷键:', shortcutId)
    }
  }

  // 字段操作处理函数
  const handleFieldCreate = (tableId: string, fieldData: Omit<DatabaseField, 'id'>) => {
    const newField: DatabaseField = {
      ...fieldData,
      id: `field-${Date.now()}`,
      tableId,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setTables(prev => prev.map(table => 
      table.id === tableId 
        ? { 
            ...table, 
            fields: [...(table.fields || []), newField],
            updatedAt: new Date()
          }
        : table
    ))
  }

  const handleFieldUpdate = (tableId: string, fieldId: string, updates: Partial<DatabaseField>) => {
    setTables(prev => prev.map(table => 
      table.id === tableId 
        ? { 
            ...table, 
            fields: (table.fields || []).map(field => 
              field.id === fieldId 
                ? { ...field, ...updates, updatedAt: new Date() }
                : field
            ),
            updatedAt: new Date()
          }
        : table
    ))
  }

  const handleFieldDelete = (tableId: string, fieldId: string) => {
    setTables(prev => prev.map(table => 
      table.id === tableId 
        ? { 
            ...table, 
            fields: (table.fields || []).filter(field => field.id !== fieldId),
            updatedAt: new Date()
          }
        : table
    ))
  }

  // 索引操作处理函数
  const handleIndexCreate = (tableId: string, indexData: Omit<DatabaseIndex, 'id'>) => {
    const newIndex: DatabaseIndex = {
      ...indexData,
      id: `index-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setTables(prev => prev.map(table => 
      table.id === tableId 
        ? { 
            ...table, 
            indexes: [...(table.indexes || []), newIndex],
            updatedAt: new Date()
          }
        : table
    ))
  }

  const handleIndexUpdate = (tableId: string, indexId: string, updates: Partial<DatabaseIndex>) => {
    setTables(prev => prev.map(table => 
      table.id === tableId 
        ? { 
            ...table, 
            indexes: (table.indexes || []).map(index => 
              index.id === indexId 
                ? { ...index, ...updates, updatedAt: new Date() }
                : index
            ),
            updatedAt: new Date()
          }
        : table
    ))
  }

  const handleIndexDelete = (tableId: string, indexId: string) => {
    setTables(prev => prev.map(table => 
      table.id === tableId 
        ? { 
            ...table, 
            indexes: (table.indexes || []).filter(index => index.id !== indexId),
            updatedAt: new Date()
          }
        : table
    ))
  }

  // 处理从AI文档解析器导入的表格
  const handleTablesImported = (importedTables: Array<{
    name: string
    displayName: string
    comment?: string
    fields: Array<{
      name: string
      type: string
      length?: string
      nullable: boolean
      defaultValue?: string
      comment?: string
      isPrimaryKey: boolean
      isAutoIncrement: boolean
    }>
    indexes?: Array<{
      name: string
      type: string
      fields: string[]
      isUnique: boolean
    }>
  }>) => {
    // 转换导入的表数据为标准格式
    const newTables: DatabaseTable[] = importedTables.map(table => ({
      id: `table-${Date.now()}-${Math.random()}`,
      projectId: projectId || '',
      name: table.name,
      displayName: table.displayName,
      comment: table.comment,
      engine: 'InnoDB',
      charset: 'utf8mb4',
      collation: 'utf8mb4_unicode_ci',
      status: 'DRAFT',
      category: '',
      version: 1,
      fields: table.fields.map((field: any, index: number) => ({
        id: `field-${Date.now()}-${index}`,
        tableId: '',
        name: field.name,
        type: field.type,
        length: field.length ? parseInt(field.length) : undefined,
        nullable: field.nullable,
        isPrimaryKey: field.isPrimaryKey,
        isAutoIncrement: field.isAutoIncrement,
        comment: field.comment,
        defaultValue: field.defaultValue,
        sortOrder: index + 1,
        createdAt: new Date(),
        updatedAt: new Date()
      })),
      indexes: table.indexes?.map((index: any, idx: number) => ({
        id: `index-${Date.now()}-${idx}`,
        tableId: '',
        name: index.name,
        type: index.type,
        fields: index.fields,
        isUnique: index.isUnique,
        createdAt: new Date(),
        updatedAt: new Date()
      })) || [],
      createdAt: new Date(),
      updatedAt: new Date()
    }))

    // 更新字段和索引的tableId
    newTables.forEach(table => {
      table.fields?.forEach(field => {
        field.tableId = table.id
      })
      table.indexes?.forEach(index => {
        index.tableId = table.id
      })
    })

    setTables(prev => [...prev, ...newTables])
    setShowAIParser(false)
    toast.success(`成功导入 ${newTables.length} 个表`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: '概览', icon: BarChart3, count: tables.length },
    { id: 'diagram', label: 'ER图设计', icon: Layers },
    { id: 'relationships', label: '关系管理', icon: Database, count: relationships.length },
    { id: 'performance', label: '性能分析', icon: BarChart3 },
    { id: 'sql', label: 'SQL生成', icon: Code },
    { id: 'migration', label: '迁移工具', icon: RefreshCw },
    { id: 'versions', label: '版本控制', icon: GitBranch },
    { id: 'collaboration', label: '协作讨论', icon: MessageSquare },
    { id: 'permissions', label: '权限管理', icon: Shield }
  ] as const

  return (
    <div className="min-h-screen bg-bg-secondary">
      {/* 页面头部 */}
      <div className="bg-bg-paper border-b border-border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(`/projects/${projectId}`)}
                className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors mr-2"
                title="返回项目详情"
              >
                <ArrowLeft className="w-5 h-5 text-text-secondary" />
              </button>
              <Database className="w-8 h-8 text-primary-500" />
              <div>
                <h1 className="text-xl font-semibold text-text-primary">数据模型管理</h1>
                <p className="text-sm text-text-secondary">设计和管理数据库结构</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(`/projects/${projectId}/erd`)}
                className="btn-outline flex items-center space-x-2"
                title="查看实体关系图"
              >
                <Layers className="w-4 h-4" />
                <span>ERD视图</span>
              </button>
              
              <button
                onClick={() => navigate(`/projects/${projectId}/data-mindmap`)}
                className="btn-outline flex items-center space-x-2"
                title="查看数据模型思维导图"
              >
                <GitBranch className="w-4 h-4" />
                <span>思维导图</span>
              </button>
              
              <button
                onClick={() => setShowAIParser(true)}
                className="btn-outline flex items-center space-x-2"
              >
                <Brain className="w-4 h-4" />
                <span>AI解析</span>
              </button>
              
              <button className="btn-primary flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>导出</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 标签导航 */}
      <div className="bg-bg-paper border-b border-border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 移动端导航 */}
          <div className="sm:hidden">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as TabType)}
              className="input w-full my-2"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label} {tab.count !== undefined && `(${tab.count})`}
                </option>
              ))}
            </select>
          </div>
          
          {/* 桌面端导航 */}
          <nav className="hidden sm:flex space-x-8 overflow-x-auto custom-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      activeTab === tab.id
                        ? 'bg-primary-100 text-primary-600'
                        : 'bg-bg-tertiary text-text-secondary'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 统计卡片 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
              <div className="bg-bg-paper rounded-lg border border-border-primary p-4 lg:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Database className="w-6 h-6 lg:w-8 lg:h-8 text-primary-500" />
                  </div>
                  <div className="ml-3 lg:ml-4">
                    <h3 className="text-lg lg:text-xl font-semibold text-text-primary">{tables.length}</h3>
                    <p className="text-xs lg:text-sm text-text-secondary">数据表</p>
                  </div>
                </div>
              </div>

              <div className="bg-bg-paper rounded-lg border border-border-primary p-4 lg:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Layers className="w-6 h-6 lg:w-8 lg:h-8 text-success-500" />
                  </div>
                  <div className="ml-3 lg:ml-4">
                    <h3 className="text-lg lg:text-xl font-semibold text-text-primary">
                      {tables.reduce((sum, table) => sum + (table.fields?.length || 0), 0)}
                    </h3>
                    <p className="text-xs lg:text-sm text-text-secondary">字段总数</p>
                  </div>
                </div>
              </div>

              <div className="bg-bg-paper rounded-lg border border-border-primary p-4 lg:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Database className="w-6 h-6 lg:w-8 lg:h-8 text-secondary-500" />
                  </div>
                  <div className="ml-3 lg:ml-4">
                    <h3 className="text-lg lg:text-xl font-semibold text-text-primary">{relationships.length}</h3>
                    <p className="text-xs lg:text-sm text-text-secondary">关联关系</p>
                  </div>
                </div>
              </div>

              <div className="bg-bg-paper rounded-lg border border-border-primary p-4 lg:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <GitBranch className="w-6 h-6 lg:w-8 lg:h-8 text-warning-500" />
                  </div>
                  <div className="ml-3 lg:ml-4">
                    <h3 className="text-lg lg:text-xl font-semibold text-text-primary">1</h3>
                    <p className="text-xs lg:text-sm text-text-secondary">版本数</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 表列表 */}
            <div className="bg-bg-paper rounded-lg border border-border-primary">
              <div className="px-4 lg:px-6 py-4 border-b border-border-primary flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <h3 className="text-lg font-medium text-text-primary">数据表列表</h3>
                <button
                  onClick={() => setShowCreateTable(true)}
                  className="btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>新建表</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 lg:p-6">
                {tables.map(table => (
                  <div
                    key={table.id}
                    className="border border-border-primary rounded-lg p-4 hover:border-border-secondary cursor-pointer transition-colors"
                    onClick={() => setShowTableDetail(table)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-text-primary truncate">
                        {table.displayName || table.name}
                      </h4>
                      <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ml-2 ${
                        table.status === 'ACTIVE' 
                          ? 'bg-success-100 text-success-800'
                          : 'bg-bg-tertiary text-text-secondary'
                      }`}>
                        {table.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-text-secondary mb-3 line-clamp-2">
                      {table.comment || '暂无描述'}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-text-tertiary">
                      <span>{table.fields?.length || 0} 字段</span>
                      <span>{table.indexes?.length || 0} 索引</span>
                      <span className="hidden sm:inline">{table.engine}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'diagram' && (
          <div className="h-screen" style={{ height: 'calc(100vh - 200px)' }}>
            <ERDiagramDesigner
              projectId={projectId || ''}
              tables={tables}
              relationships={relationships}
              onTableCreate={handleTableCreate}
              onTableUpdate={handleTableUpdate}
              onTableDelete={handleTableDelete}
              onRelationshipCreate={handleRelationshipCreate}
              onRelationshipUpdate={handleRelationshipUpdate}
              onRelationshipDelete={handleRelationshipDelete}
            />
          </div>
        )}

        {activeTab === 'relationships' && (
          <RelationshipManager
            projectId={projectId || ''}
            tables={tables}
            relationships={relationships}
            onRelationshipCreate={handleRelationshipCreate}
            onRelationshipUpdate={handleRelationshipUpdate}
            onRelationshipDelete={handleRelationshipDelete}
          />
        )}

        {activeTab === 'performance' && (
          <IndexPerformanceAnalyzer
            tables={tables}
            onIndexCreate={handleIndexCreate}
            onIndexUpdate={handleIndexUpdate}
          />
        )}

        {activeTab === 'sql' && (
          <SQLGenerator
            projectId={projectId || ''}
            tables={tables}
            relationships={relationships}
          />
        )}

        {activeTab === 'migration' && (
          <MigrationPlanner
            projectId={projectId || ''}
            currentModel={{ tables, relationships }}
            targetModel={{ tables, relationships }}
            onMigrationCreate={(plan) => console.log('Create migration:', plan)}
            onMigrationExecute={(planId) => console.log('Execute migration:', planId)}
          />
        )}

        {activeTab === 'versions' && (
          <VersionControl
            projectId={projectId || ''}
            versions={[]}
            currentVersion="v1.0.0"
            onCreateVersion={(data) => console.log('Create version:', data)}
            onRevertToVersion={(versionId) => console.log('Revert to:', versionId)}
            onTagVersion={(versionId, tag) => console.log('Tag version:', versionId, tag)}
            onCompareVersions={(versionA, versionB) => console.log('Compare:', versionA, versionB)}
          />
        )}

        {activeTab === 'ai' && (
          <div className="space-y-6">
            <AIDocumentParser
              projectId={projectId || ''}
              onTablesImported={handleTablesImported}
              onClose={() => {}}
            />
          </div>
        )}

        {activeTab === 'collaboration' && (
          <CollaborationPanel
            projectId={projectId || ''}
            targetType="table"
            targetId="general"
            targetName="数据模型项目"
            currentUserId="current-user"
            currentUserName="当前用户"
          />
        )}

        {activeTab === 'permissions' && (
          <PermissionManager
            projectId={projectId || ''}
            currentUserId="current-user"
            isOwner={true}
          />
        )}
      </div>

      {/* 表详情模态框 */}
      {showTableDetail && (
        <TableDetailModal
          isOpen={true}
          table={showTableDetail}
          tables={tables}
          relationships={relationships}
          onClose={() => setShowTableDetail(null)}
          onUpdate={(updates) => {
            handleTableUpdate(showTableDetail.id, updates)
            setShowTableDetail(null)
          }}
          onDelete={() => {
            handleTableDelete(showTableDetail.id)
            setShowTableDetail(null)
          }}
          onFieldCreate={(fieldData) => handleFieldCreate(showTableDetail.id, fieldData)}
          onFieldUpdate={(fieldId, updates) => handleFieldUpdate(showTableDetail.id, fieldId, updates)}
          onFieldDelete={(fieldId) => handleFieldDelete(showTableDetail.id, fieldId)}
          onIndexCreate={(indexData) => handleIndexCreate(showTableDetail.id, indexData)}
          onIndexUpdate={(indexId, updates) => handleIndexUpdate(showTableDetail.id, indexId, updates)}
          onIndexDelete={(indexId) => handleIndexDelete(showTableDetail.id, indexId)}
        />
      )}

      {/* 表创建模态框 */}
      {showCreateTable && (
        <DataTableModal
          isOpen={true}
          onClose={() => setShowCreateTable(false)}
          onSave={(tableData) => {
            handleTableCreate(tableData)
            setShowCreateTable(false)
          }}
        />
      )}

      {/* AI文档解析模态框 */}
      {showAIParser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-paper rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border-primary">
              <h2 className="text-xl font-semibold text-text-primary">AI文档解析</h2>
              <button
                onClick={() => setShowAIParser(false)}
                className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <AIDocumentParser
                projectId={projectId || ''}
                onTablesImported={handleTablesImported}
                onClose={() => setShowAIParser(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* 用户体验增强组件 */}
      <UXEnhancement onShortcutTrigger={handleShortcutTrigger} />
    </div>
  )
}

export default DataModelPage