import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Database,
  Layers,
  GitBranch,
  Code,
  Brain,
  Settings,
  Eye,
  BarChart3,
  Download
} from 'lucide-react'

// 导入新创建的数据模型组件
import ERDiagramDesigner from '../components/features/data-model/components/ERDiagramDesigner'
import AIDocumentParser from '../components/features/data-model/components/AIDocumentParser'
import RelationshipManager from '../components/features/data-model/components/RelationshipManager'
import SQLGenerator from '../components/features/data-model/components/SQLGenerator'
import VersionControl from '../components/features/data-model/components/VersionControl'

// 导入现有组件
import DataTableModal from '../components/features/data-model/components/modals/DataTableModal'

import { DatabaseTable, TableRelationship } from '@shared/types'

type TabType = 'overview' | 'diagram' | 'relationships' | 'sql' | 'versions' | 'ai'

const DataModelPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [tables, setTables] = useState<DatabaseTable[]>([])
  const [relationships, setRelationships] = useState<TableRelationship[]>([])
  const [selectedTable, setSelectedTable] = useState<DatabaseTable | null>(null)
  const [showAIParser, setShowAIParser] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 模拟数据加载
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 模拟数据
      const mockTables: DatabaseTable[] = [
        {
          id: 'table-1',
          projectId: projectId || '',
          name: 'users',
          displayName: '用户表',
          comment: '存储用户基础信息',
          engine: 'InnoDB',
          charset: 'utf8mb4',
          collation: 'utf8mb4_unicode_ci',
          status: 'ACTIVE',
          category: 'user-management',
          version: 1,
          fields: [
            {
              id: 'field-1',
              tableId: 'table-1',
              name: 'id',
              type: 'BIGINT',
              nullable: false,
              isPrimaryKey: true,
              isAutoIncrement: true,
              comment: '用户ID',
              sortOrder: 1,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 'field-2',
              tableId: 'table-1',
              name: 'username',
              type: 'VARCHAR',
              length: '50',
              nullable: false,
              isPrimaryKey: false,
              isAutoIncrement: false,
              comment: '用户名',
              sortOrder: 2,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 'field-3',
              tableId: 'table-1',
              name: 'email',
              type: 'VARCHAR',
              length: '100',
              nullable: false,
              isPrimaryKey: false,
              isAutoIncrement: false,
              comment: '邮箱地址',
              sortOrder: 3,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ],
          indexes: [
            {
              id: 'index-1',
              tableId: 'table-1',
              name: 'idx_username',
              type: 'UNIQUE',
              fields: ['username'],
              isUnique: true,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'table-2',
          projectId: projectId || '',
          name: 'posts',
          displayName: '文章表',
          comment: '存储用户发布的文章',
          engine: 'InnoDB',
          charset: 'utf8mb4',
          collation: 'utf8mb4_unicode_ci',
          status: 'ACTIVE',
          category: 'content',
          version: 1,
          fields: [
            {
              id: 'field-4',
              tableId: 'table-2',
              name: 'id',
              type: 'BIGINT',
              nullable: false,
              isPrimaryKey: true,
              isAutoIncrement: true,
              comment: '文章ID',
              sortOrder: 1,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 'field-5',
              tableId: 'table-2',
              name: 'user_id',
              type: 'BIGINT',
              nullable: false,
              isPrimaryKey: false,
              isAutoIncrement: false,
              comment: '作者用户ID',
              sortOrder: 2,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 'field-6',
              tableId: 'table-2',
              name: 'title',
              type: 'VARCHAR',
              length: '255',
              nullable: false,
              isPrimaryKey: false,
              isAutoIncrement: false,
              comment: '文章标题',
              sortOrder: 3,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ],
          indexes: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      const mockRelationships: TableRelationship[] = [
        {
          id: 'rel-1',
          projectId: projectId || '',
          fromTableId: 'table-2',
          toTableId: 'table-1',
          fromFieldId: 'field-5',
          toFieldId: 'field-1',
          relationshipType: 'ONE_TO_MANY',
          onUpdate: 'RESTRICT',
          onDelete: 'CASCADE',
          name: 'fk_posts_user_id',
          comment: '文章作者关系',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      setTables(mockTables)
      setRelationships(mockRelationships)
      setIsLoading(false)
    }

    if (projectId) {
      loadData()
    }
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

  const handleTablesImported = (importedTables: any[]) => {
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
        length: field.length,
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
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: '概览', icon: BarChart3, count: tables.length },
    { id: 'diagram', label: 'ER图设计', icon: Layers },
    { id: 'relationships', label: '关系管理', icon: Database, count: relationships.length },
    { id: 'sql', label: 'SQL生成', icon: Code },
    { id: 'versions', label: '版本控制', icon: GitBranch },
    { id: 'ai', label: 'AI解析', icon: Brain }
  ] as const

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Database className="w-8 h-8 text-blue-500" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">数据模型管理</h1>
                <p className="text-sm text-gray-500">设计和管理数据库结构</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
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
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Database className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">{tables.length}</h3>
                    <p className="text-sm text-gray-500">数据表</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Layers className="w-8 h-8 text-green-500" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {tables.reduce((sum, table) => sum + (table.fields?.length || 0), 0)}
                    </h3>
                    <p className="text-sm text-gray-500">字段总数</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Database className="w-8 h-8 text-purple-500" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">{relationships.length}</h3>
                    <p className="text-sm text-gray-500">关联关系</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <GitBranch className="w-8 h-8 text-orange-500" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">1</h3>
                    <p className="text-sm text-gray-500">版本数</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 表列表 */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">数据表列表</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {tables.map(table => (
                  <div
                    key={table.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 cursor-pointer transition-colors"
                    onClick={() => setSelectedTable(table)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">
                        {table.displayName || table.name}
                      </h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        table.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {table.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      {table.comment || '暂无描述'}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{table.fields?.length || 0} 字段</span>
                      <span>{table.indexes?.length || 0} 索引</span>
                      <span>{table.engine}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'diagram' && (
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

        {activeTab === 'sql' && (
          <SQLGenerator
            projectId={projectId || ''}
            tables={tables}
            relationships={relationships}
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
      </div>

      {/* AI文档解析模态框 */}
      {showAIParser && (
        <AIDocumentParser
          projectId={projectId || ''}
          onTablesImported={handleTablesImported}
          onClose={() => setShowAIParser(false)}
        />
      )}

      {/* 表详情模态框 */}
      {selectedTable && (
        <DataTableModal
          table={selectedTable}
          isOpen={!!selectedTable}
          onClose={() => setSelectedTable(null)}
          onEdit={(table) => {
            console.log('Edit table:', table)
            setSelectedTable(null)
          }}
          onDelete={(tableId) => {
            handleTableDelete(tableId)
            setSelectedTable(null)
          }}
        />
      )}
    </div>
  )
}

export default DataModelPage