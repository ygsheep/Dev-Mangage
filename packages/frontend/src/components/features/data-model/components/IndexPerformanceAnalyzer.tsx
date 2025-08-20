import React, { useState, useEffect } from 'react'
import {
  Search,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Database,
  Clock,
  Zap,
  Settings,
  RefreshCw,
  Download,
  Brain,
  Target,
  X,
  Info
} from 'lucide-react'
import { DatabaseTable, DatabaseField, DatabaseIndex } from '@shared/types'
import { suggestTableIndexes } from '../../../../utils/api'
import { toast } from 'react-hot-toast'

interface IndexPerformanceAnalyzerProps {
  tables: DatabaseTable[]
  onIndexCreate: (tableId: string, indexData: Omit<DatabaseIndex, 'id'>) => void
  onIndexUpdate: (tableId: string, indexId: string, updates: Partial<DatabaseIndex>) => void
}

interface IndexSuggestion {
  id: string
  tableId: string
  tableName: string
  indexName: string
  fields: string[]
  indexType: 'BTREE' | 'HASH' | 'FULLTEXT' | 'SPATIAL'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  estimatedImprovement: number
  reasoning: string
  queryPatterns: string[]
  estimatedCost: {
    storage: number // MB
    maintenance: number // 0-100
  }
  conflicts?: string[]
}

interface PerformanceMetrics {
  tableId: string
  tableName: string
  currentIndexes: number
  missingIndexes: number
  redundantIndexes: number
  performanceScore: number // 0-100
  queryEfficiency: number // 0-100
  recommendations: number
}

const IndexPerformanceAnalyzer: React.FC<IndexPerformanceAnalyzerProps> = ({
  tables,
  onIndexCreate,
  onIndexUpdate
}) => {
  const [selectedTable, setSelectedTable] = useState<string>('')
  const [suggestions, setSuggestions] = useState<IndexSuggestion[]>([])
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([])
  const [loading, setLoading] = useState(false)
  const [analysisMode, setAnalysisMode] = useState<'basic' | 'advanced' | 'ai'>('ai')
  const [queryPatterns, setQueryPatterns] = useState<string[]>([])
  const [showDetails, setShowDetails] = useState<string | null>(null)

  // 模拟性能指标计算
  const calculateMetrics = (table: DatabaseTable): PerformanceMetrics => {
    const indexes = table.indexes || []
    const fields = table.fields || []
    
    // 基础计算逻辑
    const currentIndexes = indexes.length
    const totalFields = fields.length
    const hasUniqueConstraints = fields.filter(f => f.isUnique).length
    const hasForeignKeys = fields.filter(f => f.references).length
    
    // 性能评分算法
    const indexCoverage = Math.min(100, (currentIndexes / Math.max(1, totalFields * 0.3)) * 100)
    const uniqueIndexScore = Math.min(100, (hasUniqueConstraints + hasForeignKeys) * 20)
    const performanceScore = Math.round((indexCoverage + uniqueIndexScore) / 2)
    
    return {
      tableId: table.id,
      tableName: table.name,
      currentIndexes,
      missingIndexes: Math.max(0, hasUniqueConstraints + hasForeignKeys - currentIndexes),
      redundantIndexes: 0, // 需要更复杂的逻辑检测
      performanceScore,
      queryEfficiency: Math.min(100, performanceScore + Math.random() * 20),
      recommendations: Math.max(0, 3 - currentIndexes)
    }
  }

  // 初始化指标
  useEffect(() => {
    const calculatedMetrics = tables.map(calculateMetrics)
    setMetrics(calculatedMetrics)
  }, [tables])

  // AI驱动的索引建议
  const analyzeIndexes = async (tableId?: string) => {
    if (!tableId && !selectedTable) {
      toast.error('请选择要分析的表')
      return
    }

    const targetTableId = tableId || selectedTable
    const table = tables.find(t => t.id === targetTableId)
    
    if (!table) {
      toast.error('表不存在')
      return
    }

    setLoading(true)
    
    try {
      // 调用AI服务分析索引
      const response = await suggestTableIndexes(targetTableId, {
        queryPatterns,
        provider: 'default'
      })

      if (response.success) {
        // 转换API响应为组件需要的格式
        const aiSuggestions: IndexSuggestion[] = response.data.suggestions?.map((suggestion: any, index: number) => ({
          id: `suggestion_${index}`,
          tableId: targetTableId,
          tableName: table.name,
          indexName: suggestion.indexName || `idx_${table.name}_${index}`,
          fields: suggestion.fields || [],
          indexType: suggestion.type || 'BTREE',
          priority: suggestion.priority || 'MEDIUM',
          estimatedImprovement: suggestion.estimatedImprovement || 0,
          reasoning: suggestion.reasoning || 'AI推荐的索引',
          queryPatterns: suggestion.queryPatterns || [],
          estimatedCost: {
            storage: suggestion.estimatedCost?.storage || 1,
            maintenance: suggestion.estimatedCost?.maintenance || 10
          },
          conflicts: suggestion.conflicts || []
        })) || []

        setSuggestions(aiSuggestions)
        toast.success(`为表 ${table.displayName || table.name} 生成了 ${aiSuggestions.length} 个索引建议`)
      } else {
        throw new Error(response.message || '分析失败')
      }
    } catch (error) {
      console.error('Index analysis failed:', error)
      
      // 生成模拟建议数据
      const mockSuggestions: IndexSuggestion[] = generateMockSuggestions(table)
      setSuggestions(mockSuggestions)
      toast.success(`为表 ${table.displayName || table.name} 生成了 ${mockSuggestions.length} 个索引建议（模拟数据）`)
    } finally {
      setLoading(false)
    }
  }

  // 生成模拟索引建议
  const generateMockSuggestions = (table: DatabaseTable): IndexSuggestion[] => {
    const suggestions: IndexSuggestion[] = []
    const fields = table.fields || []

    // 为唯一字段建议唯一索引
    fields.filter(f => f.isUnique).forEach((field, index) => {
      suggestions.push({
        id: `mock_unique_${index}`,
        tableId: table.id,
        tableName: table.name,
        indexName: `idx_${table.name}_${field.name}_unique`,
        fields: [field.name],
        indexType: 'BTREE',
        priority: 'HIGH',
        estimatedImprovement: 85,
        reasoning: `${field.name} 字段具有唯一约束，建议创建唯一索引以提高查询性能和数据完整性`,
        queryPatterns: [`SELECT * FROM ${table.name} WHERE ${field.name} = ?`],
        estimatedCost: {
          storage: 2,
          maintenance: 5
        }
      })
    })

    // 为外键字段建议索引
    fields.filter(f => f.references).forEach((field, index) => {
      suggestions.push({
        id: `mock_fk_${index}`,
        tableId: table.id,
        tableName: table.name,
        indexName: `idx_${table.name}_${field.name}_fk`,
        fields: [field.name],
        indexType: 'BTREE',
        priority: 'HIGH',
        estimatedImprovement: 70,
        reasoning: `${field.name} 是外键字段，索引可以显著提高JOIN查询性能`,
        queryPatterns: [
          `SELECT * FROM ${table.name} WHERE ${field.name} = ?`,
          `SELECT * FROM ${table.name} t1 JOIN ${field.references?.table} t2 ON t1.${field.name} = t2.id`
        ],
        estimatedCost: {
          storage: 3,
          maintenance: 10
        }
      })
    })

    // 建议复合索引
    if (fields.length >= 2) {
      const commonFields = fields.filter(f => 
        ['name', 'title', 'status', 'type', 'category'].some(common => 
          f.name.toLowerCase().includes(common)
        )
      ).slice(0, 2)

      if (commonFields.length >= 2) {
        suggestions.push({
          id: 'mock_composite',
          tableId: table.id,
          tableName: table.name,
          indexName: `idx_${table.name}_${commonFields.map(f => f.name).join('_')}`,
          fields: commonFields.map(f => f.name),
          indexType: 'BTREE',
          priority: 'MEDIUM',
          estimatedImprovement: 60,
          reasoning: `复合索引可以优化多字段查询和排序操作`,
          queryPatterns: [
            `SELECT * FROM ${table.name} WHERE ${commonFields[0].name} = ? AND ${commonFields[1].name} = ?`,
            `SELECT * FROM ${table.name} ORDER BY ${commonFields[0].name}, ${commonFields[1].name}`
          ],
          estimatedCost: {
            storage: 5,
            maintenance: 15
          }
        })
      }
    }

    return suggestions
  }

  // 应用索引建议
  const applySuggestion = (suggestion: IndexSuggestion) => {
    const indexData: Omit<DatabaseIndex, 'id'> = {
      name: suggestion.indexName,
      fields: suggestion.fields,
      type: suggestion.indexType,
      isUnique: suggestion.indexType === 'BTREE' && suggestion.fields.length === 1,
      comment: suggestion.reasoning,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    onIndexCreate(suggestion.tableId, indexData)
    
    // 从建议中移除已应用的项
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))
    
    toast.success(`索引 ${suggestion.indexName} 已创建`)
  }

  // 获取性能评分颜色
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success-600'
    if (score >= 60) return 'text-warning-600'
    return 'text-danger-600'
  }

  // 获取优先级颜色
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-danger-100 text-danger-800'
      case 'MEDIUM': return 'bg-warning-100 text-warning-800'
      case 'LOW': return 'bg-success-100 text-success-800'
      default: return 'bg-bg-tertiary text-text-secondary'
    }
  }

  return (
    <div className="space-y-6">
      {/* 分析控制面板 */}
      <div className="bg-bg-paper rounded-lg border border-border-primary p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Brain className="w-8 h-8 text-primary-500" />
            <div>
              <h2 className="text-xl font-semibold text-text-primary">AI索引性能分析器</h2>
              <p className="text-text-secondary">基于AI的智能索引优化建议</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={analysisMode}
              onChange={(e) => setAnalysisMode(e.target.value as any)}
              className="input w-auto"
            >
              <option value="ai">AI深度分析</option>
              <option value="advanced">高级分析</option>
              <option value="basic">基础分析</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              选择分析表
            </label>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="input w-full"
            >
              <option value="">选择要分析的表</option>
              {tables.map(table => (
                <option key={table.id} value={table.id}>
                  {table.displayName || table.name} ({table.fields?.length || 0} 字段)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              查询模式 (可选)
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="添加常用查询模式..."
                className="input flex-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    setQueryPatterns(prev => [...prev, e.currentTarget.value.trim()])
                    e.currentTarget.value = ''
                  }
                }}
              />
              <button
                onClick={() => analyzeIndexes()}
                disabled={!selectedTable || loading}
                className="btn-primary flex items-center space-x-2"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4" />
                )}
                <span>分析</span>
              </button>
            </div>
            
            {queryPatterns.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {queryPatterns.map((pattern, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded"
                  >
                    {pattern}
                    <button
                      onClick={() => setQueryPatterns(prev => prev.filter((_, i) => i !== index))}
                      className="ml-1 text-primary-500 hover:text-primary-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 性能概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-bg-paper rounded-lg border border-border-primary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary">总表数</p>
              <p className="text-2xl font-bold text-text-primary">{tables.length}</p>
            </div>
            <Database className="w-8 h-8 text-text-tertiary" />
          </div>
        </div>

        <div className="bg-bg-paper rounded-lg border border-border-primary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary">已优化表</p>
              <p className="text-2xl font-bold text-success-600">
                {metrics.filter(m => m.performanceScore >= 80).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-success-500" />
          </div>
        </div>

        <div className="bg-bg-paper rounded-lg border border-border-primary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary">需要优化</p>
              <p className="text-2xl font-bold text-danger-600">
                {metrics.filter(m => m.performanceScore < 60).length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-danger-500" />
          </div>
        </div>

        <div className="bg-bg-paper rounded-lg border border-border-primary p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary">AI建议数</p>
              <p className="text-2xl font-bold text-primary-600">{suggestions.length}</p>
            </div>
            <Lightbulb className="w-8 h-8 text-primary-500" />
          </div>
        </div>
      </div>

      {/* 表性能列表 */}
      <div className="bg-bg-paper rounded-lg border border-border-primary">
        <div className="px-6 py-4 border-b border-border-primary">
          <h3 className="text-lg font-medium text-text-primary">表性能评估</h3>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-bg-secondary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  表名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  当前索引
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  性能评分
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  查询效率
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  建议数量
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-bg-paper divide-y divide-gray-200">
              {metrics.map((metric) => (
                <tr key={metric.tableId} className="hover:bg-bg-tertiary">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Database className="w-4 h-4 text-text-tertiary mr-2" />
                      <div>
                        <div className="text-sm font-medium text-text-primary">
                          {metric.tableName}
                        </div>
                        <div className="text-sm text-text-secondary">
                          {tables.find(t => t.id === metric.tableId)?.fields?.length || 0} 字段
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-text-primary">{metric.currentIndexes}</span>
                      {metric.missingIndexes > 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-danger-100 text-danger-800">
                          缺少 {metric.missingIndexes}
                        </span>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`text-sm font-medium ${getScoreColor(metric.performanceScore)}`}>
                        {metric.performanceScore}%
                      </div>
                      <div className="ml-2 w-16 bg-bg-tertiary rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            metric.performanceScore >= 80 ? 'bg-success-500' :
                            metric.performanceScore >= 60 ? 'bg-warning-500' : 'bg-danger-500'
                          }`}
                          style={{ width: `${metric.performanceScore}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 text-text-tertiary mr-1" />
                      <span className={`text-sm ${getScoreColor(metric.queryEfficiency)}`}>
                        {metric.queryEfficiency}%
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      {metric.recommendations} 个建议
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => analyzeIndexes(metric.tableId)}
                      disabled={loading}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      分析
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI索引建议 */}
      {suggestions.length > 0 && (
        <div className="bg-bg-paper rounded-lg border border-border-primary">
          <div className="px-6 py-4 border-b border-border-primary flex items-center justify-between">
            <h3 className="text-lg font-medium text-text-primary">
              AI索引优化建议 ({suggestions.length})
            </h3>
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify(suggestions, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'index-suggestions.json'
                a.click()
                URL.revokeObjectURL(url)
              }}
              className="btn-outline flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>导出建议</span>
            </button>
          </div>

          <div className="p-6 space-y-4">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="border border-border-primary rounded-lg p-4 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-text-primary">{suggestion.indexName}</h4>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(suggestion.priority)}`}>
                        {suggestion.priority === 'HIGH' ? '高优先级' : 
                         suggestion.priority === 'MEDIUM' ? '中优先级' : '低优先级'}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-bg-tertiary text-text-secondary">
                        {suggestion.indexType}
                      </span>
                    </div>
                    
                    <div className="text-sm text-text-secondary mb-2">
                      <span className="font-medium">字段:</span> {suggestion.fields.join(', ')}
                    </div>
                    
                    <p className="text-sm text-text-primary mb-3">{suggestion.reasoning}</p>
                    
                    <div className="flex items-center space-x-6 text-sm text-text-secondary">
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="w-4 h-4" />
                        <span>预期提升: {suggestion.estimatedImprovement}%</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Database className="w-4 h-4" />
                        <span>存储成本: {suggestion.estimatedCost.storage}MB</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>维护成本: {suggestion.estimatedCost.maintenance}%</span>
                      </div>
                    </div>

                    {suggestion.conflicts && suggestion.conflicts.length > 0 && (
                      <div className="mt-3 p-3 bg-warning-50 border border-warning-200 rounded">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-warning-600" />
                          <span className="text-sm font-medium text-warning-800">潜在冲突</span>
                        </div>
                        <ul className="mt-1 text-sm text-warning-700">
                          {suggestion.conflicts.map((conflict, index) => (
                            <li key={index}>• {conflict}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => setShowDetails(showDetails === suggestion.id ? null : suggestion.id)}
                      className="btn-ghost p-2"
                      title="查看详情"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => applySuggestion(suggestion)}
                      className="btn-primary"
                    >
                      应用
                    </button>
                  </div>
                </div>

                {/* 详细信息展开 */}
                {showDetails === suggestion.id && (
                  <div className="mt-4 pt-4 border-t border-border-primary">
                    <h5 className="font-medium text-text-primary mb-2">相关查询模式</h5>
                    <div className="space-y-2">
                      {suggestion.queryPatterns.map((pattern, index) => (
                        <div key={index} className="bg-bg-secondary rounded p-2 font-mono text-xs">
                          {pattern}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default IndexPerformanceAnalyzer