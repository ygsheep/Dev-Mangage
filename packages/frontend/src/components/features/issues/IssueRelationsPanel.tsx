import React, { useEffect, useState } from 'react'
import IssueRelationManager from './IssueRelationManager'
import { RELATION_TYPE_COLORS, RELATION_TYPE_LABELS, RelationType } from '../../../types'
import {
  createIssueAPIRelation,
  createIssueFeatureRelation,
  createIssueTableRelation,
  deleteIssueAPIRelation,
  deleteIssueFeatureRelation,
  deleteIssueTableRelation,
  getIssueRelations,
} from '../../../utils/api'

interface IssueRelationsPanelProps {
  issueId: string
  projectId: string
  onClose: () => void
  onUpdated: () => void
}

interface IssueRelationsPanelProps {
  issueId: string
  projectId: string
  onClose: () => void
  onUpdated: () => void
}

interface ApiRelation {
  id: string
  apiId?: string
  endpointId?: string
  relationType: RelationType
  description?: string
  api?: {
    id: string
    name: string
    method: string
    path: string
  }
  endpoint?: {
    id: string
    method: string
    path: string
  }
}

interface TableRelation {
  id: string
  tableId: string
  relationType: RelationType
  description?: string
  table: {
    id: string
    name: string
    displayName?: string
    comment?: string
  }
}

interface FeatureRelation {
  id: string
  featureId: string
  relationType: RelationType
  description?: string
  feature: {
    id: string
    name: string
    description?: string
  }
}

interface Relations {
  apis: ApiRelation[]
  tables: TableRelation[]
  features: FeatureRelation[]
}

interface AvailableResources {
  apis: Array<{ id: string; name: string; method: string; path: string }>
  tables: Array<{ id: string; name: string; displayName?: string; comment?: string }>
  features: Array<{ id: string; name: string; description?: string }>
}

export const IssueRelationsPanel: React.FC<IssueRelationsPanelProps> = ({
  issueId,
  projectId,
  onClose,
  onUpdated,
}) => {
  const [relations, setRelations] = useState<Relations>({
    apis: [],
    tables: [],
    features: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 获取当前关联
  const fetchRelations = async () => {
    try {
      const response = await getIssueRelations(projectId, issueId)
      if (response.success) {
        setRelations(response.data)
      }
    } catch (err: any) {
      console.error('获取关联关系失败:', err)
      setError('获取关联关系失败')
    }
  }

  // 初始化加载
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        await fetchRelations()
      } catch (err) {
        setError('加载数据失败')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [issueId, projectId])

  // 处理关联变化
  const handleRelationChange = async () => {
    await fetchRelations()
    onUpdated()
  }

  // 删除关联
  const handleRemoveRelation = async (relationId: string, type: 'api' | 'table' | 'feature') => {
    if (!confirm('确定要删除这个关联吗？')) {
      return
    }

    try {
      // 根据类型调用对应的API删除方法
      let response: any
      switch (type) {
        case 'api':
          response = await deleteIssueAPIRelation(projectId, issueId, relationId)
          break
        case 'table':
          response = await deleteIssueTableRelation(projectId, issueId, relationId)
          break
        case 'feature':
          response = await deleteIssueFeatureRelation(projectId, issueId, relationId)
          break
      }

      if (response.success) {
        await fetchRelations()
        onUpdated()
      } else {
        setError('删除关联失败')
      }
    } catch (err: any) {
      console.error('删除关联失败:', err)
      setError(err.message || '删除关联失败')
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-bg-paper rounded-lg shadow-xl p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-text-secondary">加载关联信息...</span>
          </div>
        </div>
      </div>
    )
  }

  // 将关联关系转换为组件需要的格式
  const convertedAPIs = relations.apis.map(relation => ({
    apiId: relation.apiId,
    endpointId: relation.endpointId,
    relationType: relation.relationType,
    description: relation.description || `关联到 ${relation.api?.name || '未知API'}`
  }))

  const convertedTables = relations.tables.map(relation => ({
    tableId: relation.tableId,
    relationType: relation.relationType,
    description: relation.description || `关联到表 ${relation.table.displayName || relation.table.name}`
  }))

  const convertedFeatures = relations.features.map(relation => ({
    featureId: relation.featureId,
    relationType: relation.relationType,
    description: relation.description || `关联到功能 ${relation.feature.name}`
  }))

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-paper rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col custom-scrollbar">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-6 border-b border-border-primary bg-bg-tertiary">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Issue 关联管理</h2>
            <p className="text-sm text-text-secondary mt-1">管理 Issue 与项目资源的关联关系</p>
          </div>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary transition-colors rounded-lg p-2 hover:bg-bg-paper"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 主要内容区 */}
        <div className="flex-1 overflow-hidden custom-scrollbar">
          <IssueRelationManager
            projectId={projectId}
            issueId={issueId}
            mode="edit"
            selectedAPIs={convertedAPIs}
            selectedTables={convertedTables}
            selectedFeatures={convertedFeatures}
            onAPIChange={(relations) => {
              // 当API关联发生变化时，重新获取数据
              handleRelationChange()
            }}
            onTableChange={(relations) => {
              // 当数据表关联发生变化时，重新获取数据
              handleRelationChange()
            }}
            onFeatureChange={(relations) => {
              // 当功能模块关联发生变化时，重新获取数据
              handleRelationChange()
            }}
            maxHeight="500px"
            showSearch={true}
            className="h-full border-0 rounded-none"
          />
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mx-6 mb-6 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
            >
              关闭
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
