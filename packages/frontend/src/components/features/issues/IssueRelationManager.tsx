import { Database, Link, Package, Search, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { RelationType } from '../../../types'
import {
  createIssueAPIRelation,
  createIssueFeatureRelation,
  createIssueTableRelation,
  getAvailableIssueRelations,
} from '../../../utils/api'

interface RelationItem {
  id: string
  name: string
  type: 'api' | 'table' | 'feature'
  description?: string
  method?: string
  path?: string
  comment?: string
  displayName?: string
}

interface SelectedRelation {
  apiId?: string
  endpointId?: string
  tableId?: string
  featureId?: string
  relationType: RelationType
  description: string
}

interface IssueRelationManagerProps {
  projectId: string
  issueId?: string // 如果提供了 issueId，则为编辑模式，会调用后端API
  selectedAPIs?: SelectedRelation[]
  selectedTables?: SelectedRelation[]
  selectedFeatures?: SelectedRelation[]
  onAPIChange?: (relations: SelectedRelation[]) => void
  onTableChange?: (relations: SelectedRelation[]) => void
  onFeatureChange?: (relations: SelectedRelation[]) => void
  maxHeight?: string
  showSearch?: boolean
  className?: string
  mode?: 'create' | 'edit' // create: 用于创建Issue时，edit: 用于编辑已存在Issue
}

export const IssueRelationManager: React.FC<IssueRelationManagerProps> = ({
  projectId,
  issueId,
  selectedAPIs = [],
  selectedTables = [],
  selectedFeatures = [],
  onAPIChange,
  onTableChange,
  onFeatureChange,
  maxHeight = '300px',
  showSearch = true,
  className = '',
  mode = 'create',
}) => {
  const [availableRelations, setAvailableRelations] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'api' | 'table' | 'feature'>('api')
  const [addingRelations, setAddingRelations] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)

  // 获取可关联的资源
  useEffect(() => {
    const fetchAvailableRelations = async () => {
      if (!projectId) return

      setLoading(true)
      try {
        const response = await getAvailableIssueRelations(projectId, issueId || 'temp')
        if (response.success) {
          setAvailableRelations(response.data)
        }
      } catch (err) {
        console.error('获取可关联资源失败:', err)
        setError('获取可关联资源失败')
      } finally {
        setLoading(false)
      }
    }

    fetchAvailableRelations()
  }, [projectId, issueId])

  // 过滤搜索结果
  const filterItems = (items: any[], type: string) => {
    if (!items) return []

    return items.filter(item => {
      const searchText = searchQuery.toLowerCase()
      if (!searchText) return true

      const name = item.name || item.displayName || ''
      const description = item.description || item.comment || ''
      const method = item.method || ''
      const path = item.path || ''

      return (
        name.toLowerCase().includes(searchText) ||
        description.toLowerCase().includes(searchText) ||
        method.toLowerCase().includes(searchText) ||
        path.toLowerCase().includes(searchText)
      )
    })
  }

  // 检查是否已选中
  const isSelected = (item: any, type: 'api' | 'table' | 'feature') => {
    switch (type) {
      case 'api':
        return selectedAPIs.some(rel => rel.apiId === item.id || rel.endpointId === item.id)
      case 'table':
        return selectedTables.some(rel => rel.tableId === item.id)
      case 'feature':
        return selectedFeatures.some(rel => rel.featureId === item.id)
      default:
        return false
    }
  }

  // 添加关联
  const addRelation = async (item: any, type: 'api' | 'table' | 'feature') => {
    const relationKey = `${type}-${item.id}`

    if (mode === 'edit' && issueId && projectId) {
      // 编辑模式：调用后端API
      setAddingRelations(prev => ({ ...prev, [relationKey]: true }))
      setError(null)

      try {
        let response: any
        const relationData = {
          relationType: RelationType.RELATES_TO,
          description: `关联到 ${item.displayName || item.name}`,
        }

        switch (type) {
          case 'api':
            response = await createIssueAPIRelation(projectId, issueId, {
              apiId: item.id,
              ...relationData,
            })
            break
          case 'table':
            response = await createIssueTableRelation(projectId, issueId, {
              tableId: item.id,
              ...relationData,
            })
            break
          case 'feature':
            // 解析 featureId (格式: "featureName-component")
            const parts = item.id.split('-')
            const featureName = parts[0]
            const component = parts.slice(1).join('-') || undefined

            response = await createIssueFeatureRelation(projectId, issueId, {
              featureName,
              component,
              ...relationData,
            })
            break
        }

        if (response.success) {
          // 成功后调用对应的 onChange 回调来刷新数据
          switch (type) {
            case 'api':
              onAPIChange?.([...selectedAPIs])
              break
            case 'table':
              onTableChange?.([...selectedTables])
              break
            case 'feature':
              onFeatureChange?.([...selectedFeatures])
              break
          }
        } else {
          setError(response.message || '添加关联失败')
        }
      } catch (err: any) {
        console.error('添加关联失败:', err)
        setError(err.message || '添加关联失败')
      } finally {
        setAddingRelations(prev => ({ ...prev, [relationKey]: false }))
      }
    } else {
      // 创建模式：只更新本地状态
      const relation: SelectedRelation = {
        relationType: RelationType.RELATES_TO,
        description: `关联到 ${item.displayName || item.name}`,
      }

      switch (type) {
        case 'api':
          relation.apiId = item.id
          if (item.endpointId) relation.endpointId = item.endpointId
          onAPIChange?.([...selectedAPIs, relation])
          break
        case 'table':
          relation.tableId = item.id
          onTableChange?.([...selectedTables, relation])
          break
        case 'feature':
          relation.featureId = item.id
          onFeatureChange?.([...selectedFeatures, relation])
          break
      }
    }
  }

  // 移除关联
  const removeRelation = (index: number, type: 'api' | 'table' | 'feature') => {
    switch (type) {
      case 'api':
        const newAPIs = selectedAPIs.filter((_, i) => i !== index)
        onAPIChange?.(newAPIs)
        break
      case 'table':
        const newTables = selectedTables.filter((_, i) => i !== index)
        onTableChange?.(newTables)
        break
      case 'feature':
        const newFeatures = selectedFeatures.filter((_, i) => i !== index)
        onFeatureChange?.(newFeatures)
        break
    }
  }

  const tabs = [
    {
      id: 'api' as const,
      label: 'API 接口',
      icon: Link,
      count: availableRelations?.apis?.length || 0,
    },
    {
      id: 'table' as const,
      label: '数据表',
      icon: Database,
      count: availableRelations?.tables?.length || 0,
    },
    {
      id: 'feature' as const,
      label: '功能模块',
      icon: Package,
      count: availableRelations?.features?.length || 0,
    },
  ]

  const selectedCounts = {
    api: selectedAPIs.length,
    table: selectedTables.length,
    feature: selectedFeatures.length,
  }

  if (loading) {
    return (
      <div className={`bg-bg-paper border border-border-primary rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-text-secondary">加载关联资源中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-bg-paper border border-border-primary rounded-lg ${className}`}>
      {/* 头部 */}
      <div className="p-4 border-b border-border-primary">
        <h3 className="text-lg font-medium text-text-primary mb-3 flex items-center">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          关联资源
        </h3>

        {/* 搜索框 */}
        {showSearch && (
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary w-4 h-4" />
            <input
              type="text"
              placeholder="搜索资源..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-border-primary bg-bg-elevated text-text-primary placeholder-text-tertiary rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        )}

        {/* 选项卡 */}
        <div className="flex space-x-1 bg-bg-tertiary p-1 rounded-lg">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-bg-paper dark:bg-gray-700 text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-paper'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-4">
        {/* 可选资源列表 */}
        <div className="mb-4">
          <div className={`max-h-[${maxHeight}] overflow-y-auto custom-scrollbar space-y-2`}>
            {activeTab === 'api' &&
              availableRelations?.apis &&
              filterItems(availableRelations.apis, 'api').map((api: any) => (
                <div
                  key={api.id}
                  className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                    isSelected(api, 'api')
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-border-primary hover:bg-bg-tertiary'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-text-primary truncate">
                        {api.name}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          api.method === 'GET'
                            ? 'bg-green-100 text-green-700'
                            : api.method === 'POST'
                              ? 'bg-blue-100 text-blue-700'
                              : api.method === 'PUT'
                                ? 'bg-yellow-100 text-yellow-700'
                                : api.method === 'DELETE'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {api.method}
                      </span>
                    </div>
                    <div className="text-xs text-text-tertiary mt-1 truncate">{api.path}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => addRelation(api, 'api')}
                    disabled={isSelected(api, 'api') || addingRelations[`api-${api.id}`]}
                    className={`ml-3 px-3 py-1 text-sm rounded transition-colors flex items-center space-x-1 ${
                      isSelected(api, 'api')
                        ? 'bg-green-100 text-green-700 cursor-not-allowed'
                        : addingRelations[`api-${api.id}`]
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                    }`}
                  >
                    {addingRelations[`api-${api.id}`] && (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                    )}
                    <span>
                      {isSelected(api, 'api')
                        ? '已关联'
                        : addingRelations[`api-${api.id}`]
                          ? '添加中...'
                          : '关联'}
                    </span>
                  </button>
                </div>
              ))}

            {activeTab === 'table' &&
              availableRelations?.tables &&
              filterItems(availableRelations.tables, 'table').map((table: any) => (
                <div
                  key={table.id}
                  className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                    isSelected(table, 'table')
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-border-primary hover:bg-bg-tertiary'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <Database className="w-4 h-4 text-text-secondary" />
                      <span className="text-sm font-medium text-text-primary truncate">
                        {table.displayName || table.name}
                      </span>
                    </div>
                    {table.comment && (
                      <div className="text-xs text-text-tertiary mt-1 truncate">
                        {table.comment}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => addRelation(table, 'table')}
                    disabled={isSelected(table, 'table') || addingRelations[`table-${table.id}`]}
                    className={`ml-3 px-3 py-1 text-sm rounded transition-colors flex items-center space-x-1 ${
                      isSelected(table, 'table')
                        ? 'bg-green-100 text-green-700 cursor-not-allowed'
                        : addingRelations[`table-${table.id}`]
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                    }`}
                  >
                    {addingRelations[`table-${table.id}`] && (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                    )}
                    <span>
                      {isSelected(table, 'table')
                        ? '已关联'
                        : addingRelations[`table-${table.id}`]
                          ? '添加中...'
                          : '关联'}
                    </span>
                  </button>
                </div>
              ))}

            {activeTab === 'feature' &&
              availableRelations?.features &&
              filterItems(availableRelations.features, 'feature').map((feature: any) => (
                <div
                  key={feature.id}
                  className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                    isSelected(feature, 'feature')
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-border-primary hover:bg-bg-tertiary'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <Package className="w-4 h-4 text-text-secondary" />
                      <span className="text-sm font-medium text-text-primary truncate">
                        {feature.name}
                      </span>
                    </div>
                    {feature.description && (
                      <div className="text-xs text-text-tertiary mt-1 truncate">
                        {feature.description}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => addRelation(feature, 'feature')}
                    disabled={
                      isSelected(feature, 'feature') || addingRelations[`feature-${feature.id}`]
                    }
                    className={`ml-3 px-3 py-1 text-sm rounded transition-colors flex items-center space-x-1 ${
                      isSelected(feature, 'feature')
                        ? 'bg-green-100 text-green-700 cursor-not-allowed'
                        : addingRelations[`feature-${feature.id}`]
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                    }`}
                  >
                    {addingRelations[`feature-${feature.id}`] && (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                    )}
                    <span>
                      {isSelected(feature, 'feature')
                        ? '已关联'
                        : addingRelations[`feature-${feature.id}`]
                          ? '添加中...'
                          : '关联'}
                    </span>
                  </button>
                </div>
              ))}

            {/* 空状态 */}
            {activeTab === 'api' &&
              (!availableRelations?.apis ||
                filterItems(availableRelations.apis, 'api').length === 0) && (
                <div className="text-center py-8">
                  <Link className="w-12 h-12 text-text-tertiary mx-auto mb-2" />
                  <p className="text-text-secondary">
                    {searchQuery ? '没有找到匹配的API接口' : '暂无可关联的API接口'}
                  </p>
                </div>
              )}

            {activeTab === 'table' &&
              (!availableRelations?.tables ||
                filterItems(availableRelations.tables, 'table').length === 0) && (
                <div className="text-center py-8">
                  <Database className="w-12 h-12 text-text-tertiary mx-auto mb-2" />
                  <p className="text-text-secondary">
                    {searchQuery ? '没有找到匹配的数据表' : '暂无可关联的数据表'}
                  </p>
                </div>
              )}

            {activeTab === 'feature' &&
              (!availableRelations?.features ||
                filterItems(availableRelations.features, 'feature').length === 0) && (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-text-tertiary mx-auto mb-2" />
                  <p className="text-text-secondary">
                    {searchQuery ? '没有找到匹配的功能模块' : '暂无可关联的功能模块'}
                  </p>
                </div>
              )}
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
            >
              关闭
            </button>
          </div>
        )}

        {/* 已选关联预览 */}
        {(selectedAPIs.length > 0 || selectedTables.length > 0 || selectedFeatures.length > 0) && (
          <div className="border-t border-border-primary pt-4">
            <h4 className="text-sm font-medium text-text-secondary mb-3 flex items-center">
              <span>已选关联</span>
              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                {selectedAPIs.length + selectedTables.length + selectedFeatures.length}
              </span>
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin">
              {/* API 关联 */}
              {selectedAPIs.map((relation, index) => (
                <div
                  key={`api-${index}`}
                  className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded"
                >
                  <div className="flex items-center space-x-2">
                    <Link className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-700 dark:text-blue-300">API 关联</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRelation(index, 'api')}
                    className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* 数据表关联 */}
              {selectedTables.map((relation, index) => (
                <div
                  key={`table-${index}`}
                  className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded"
                >
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700 dark:text-green-300">数据表关联</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRelation(index, 'table')}
                    className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* 功能模块关联 */}
              {selectedFeatures.map((relation, index) => (
                <div
                  key={`feature-${index}`}
                  className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded"
                >
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-purple-700 dark:text-purple-300">
                      功能模块关联
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRelation(index, 'feature')}
                    className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default IssueRelationManager
