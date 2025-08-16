import React, { useState, useMemo } from 'react'
import {
  BarChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Database,
  Table,
  Link,
  Key,
  Index,
  FileText,
  Calendar,
  Users,
  Activity,
  Eye,
  Download,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  HardDrive,
  Layers
} from 'lucide-react'

interface TableStatistics {
  id: string
  tableId: string
  tableName: string
  tableDisplayName: string
  rowCount: number
  dataSize: number // bytes
  indexSize: number // bytes
  fragmentSize: number // bytes
  lastAnalyzed: string
  category?: string
  status: string
}

interface ProjectSummary {
  projectId: string
  projectName: string
  overview: {
    tablesCount: number
    fieldsCount: number
    indexesCount: number
    relationshipsCount: number
    totalRowCount: number
    totalDataSize: number
    totalIndexSize: number
    totalFragmentSize: number
    hasStatistics: number
  }
  categoryBreakdown: Record<string, {
    tablesCount: number
    rowCount: number
    dataSize: number
    indexSize: number
  }>
  statusBreakdown: Record<string, number>
  recentlyUpdated: Array<{
    tableId: string
    tableName: string
    displayName: string
    lastAnalyzed: string
    rowCount: number
    dataSize: number
  }>
  largestTables: Array<{
    tableId: string
    tableName: string
    displayName: string
    rowCount: number
    dataSize: number
    category: string
  }>
  lastUpdated: string
}

interface StatsDashboardProps {
  projectId: string
  projectName?: string
  summary: ProjectSummary
  statistics: TableStatistics[]
  onRefreshData: () => void
  onAnalyzeTable: (tableId: string) => void
  onAnalyzeProject: () => void
  onExportReport: (format: 'pdf' | 'excel' | 'csv') => void
}

const StatsDashboard: React.FC<StatsDashboardProps> = ({
  projectId,
  projectName,
  summary,
  statistics,
  onRefreshData,
  onAnalyzeTable,
  onAnalyzeProject,
  onExportReport
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'tables' | 'performance' | 'trends'>('overview')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview', 'categories']))
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [sortBy, setSortBy] = useState<'rowCount' | 'dataSize' | 'name'>('rowCount')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // 格式化字节大小
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 格式化数字
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  // 计算健康度分数
  const calculateHealthScore = (): number => {
    const metrics = {
      hasStatistics: summary.overview.hasStatistics / Math.max(summary.overview.tablesCount, 1),
      lowFragmentation: statistics.filter(s => s.fragmentSize < s.dataSize * 0.1).length / Math.max(statistics.length, 1),
      recentAnalysis: statistics.filter(s => {
        const daysSince = (Date.now() - new Date(s.lastAnalyzed).getTime()) / (1000 * 60 * 60 * 24)
        return daysSince <= 7
      }).length / Math.max(statistics.length, 1)
    }

    return Math.round((metrics.hasStatistics * 0.4 + metrics.lowFragmentation * 0.3 + metrics.recentAnalysis * 0.3) * 100)
  }

  // 排序统计数据
  const sortedStatistics = useMemo(() => {
    return [...statistics].sort((a, b) => {
      let aValue: number | string
      let bValue: number | string

      switch (sortBy) {
        case 'rowCount':
          aValue = a.rowCount
          bValue = b.rowCount
          break
        case 'dataSize':
          aValue = a.dataSize
          bValue = b.dataSize
          break
        case 'name':
          aValue = a.tableName
          bValue = b.tableName
          break
        default:
          return 0
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      return sortOrder === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number)
    })
  }, [statistics, sortBy, sortOrder])

  const healthScore = calculateHealthScore()

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'deprecated':
        return 'bg-red-100 text-red-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <BarChart className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">数据统计仪表板</h1>
              <p className="text-gray-600">
                {projectName || '项目'} - 数据模型分析和性能指标
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="input w-auto"
            >
              <option value="7d">最近 7 天</option>
              <option value="30d">最近 30 天</option>
              <option value="90d">最近 90 天</option>
            </select>
            
            <button
              onClick={onRefreshData}
              className="btn-outline flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>刷新数据</span>
            </button>
            
            <div className="relative">
              <button className="btn-outline flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>导出报告</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {/* 导出下拉菜单可以在这里实现 */}
            </div>
          </div>
        </div>
      </div>

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">数据表总数</p>
              <p className="text-3xl font-bold text-gray-900">{summary.overview.tablesCount}</p>
              <p className="text-sm text-gray-500">
                {summary.overview.hasStatistics} 个已分析
              </p>
            </div>
            <Table className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">总数据量</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatBytes(summary.overview.totalDataSize)}
              </p>
              <p className="text-sm text-gray-500">
                索引: {formatBytes(summary.overview.totalIndexSize)}
              </p>
            </div>
            <HardDrive className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">总记录数</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatNumber(summary.overview.totalRowCount)}
              </p>
              <p className="text-sm text-gray-500">
                关系: {summary.overview.relationshipsCount}
              </p>
            </div>
            <Database className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">健康度评分</p>
              <p className={`text-3xl font-bold ${getHealthColor(healthScore).split(' ')[0]}`}>
                {healthScore}%
              </p>
              <p className="text-sm text-gray-500">
                {healthScore >= 80 ? '优秀' : healthScore >= 60 ? '良好' : '需要优化'}
              </p>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getHealthColor(healthScore)}`}>
              {healthScore >= 80 ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
          </div>
        </div>
      </div>

      {/* 标签导航 */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: '概览', icon: Eye },
              { id: 'tables', label: '表统计', icon: Table },
              { id: 'performance', label: '性能分析', icon: Zap },
              { id: 'trends', label: '趋势分析', icon: TrendingUp }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 分类分布 */}
              <div>
                <button
                  onClick={() => toggleSection('categories')}
                  className="flex items-center space-x-2 text-lg font-medium text-gray-900 hover:text-gray-700"
                >
                  {expandedSections.has('categories') ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                  <span>分类分布</span>
                </button>

                {expandedSections.has('categories') && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(summary.categoryBreakdown).map(([category, stats]) => (
                      <div key={category} className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">
                          {category === 'uncategorized' ? '未分类' : category}
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">表数:</span>
                            <span className="font-medium">{stats.tablesCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">记录:</span>
                            <span className="font-medium">{formatNumber(stats.rowCount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">数据量:</span>
                            <span className="font-medium">{formatBytes(stats.dataSize)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 状态分布 */}
              <div>
                <button
                  onClick={() => toggleSection('status')}
                  className="flex items-center space-x-2 text-lg font-medium text-gray-900 hover:text-gray-700"
                >
                  {expandedSections.has('status') ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                  <span>状态分布</span>
                </button>

                {expandedSections.has('status') && (
                  <div className="mt-4 flex flex-wrap gap-4">
                    {Object.entries(summary.statusBreakdown).map(([status, count]) => (
                      <div key={status} className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
                          {status}
                        </span>
                        <span className="text-gray-600">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 最大表排行 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">数据量排行</h3>
                <div className="space-y-3">
                  {summary.largestTables.slice(0, 5).map((table, index) => (
                    <div key={table.tableId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {table.displayName || table.tableName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {table.category || '未分类'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          {formatNumber(table.rowCount)} 行
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatBytes(table.dataSize)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tables' && (
            <div className="space-y-4">
              {/* 表统计工具栏 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="input w-auto"
                  >
                    <option value="rowCount">按记录数排序</option>
                    <option value="dataSize">按数据量排序</option>
                    <option value="name">按名称排序</option>
                  </select>
                  
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="btn-outline"
                  >
                    {sortOrder === 'asc' ? '升序' : '降序'}
                  </button>
                </div>

                <button
                  onClick={onAnalyzeProject}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Activity className="w-4 h-4" />
                  <span>分析所有表</span>
                </button>
              </div>

              {/* 表统计列表 */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        表名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        记录数
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        数据量
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        索引大小
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        碎片率
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        最后分析
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedStatistics.map((stat) => {
                      const fragmentationRate = stat.dataSize > 0 ? (stat.fragmentSize / stat.dataSize) * 100 : 0
                      const daysSinceAnalysis = (Date.now() - new Date(stat.lastAnalyzed).getTime()) / (1000 * 60 * 60 * 24)

                      return (
                        <tr key={stat.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {stat.tableDisplayName || stat.tableName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {stat.category || '未分类'}
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatNumber(stat.rowCount)}
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatBytes(stat.dataSize)}
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatBytes(stat.indexSize)}
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`text-sm font-medium ${fragmentationRate > 20 ? 'text-red-600' : fragmentationRate > 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                                {fragmentationRate.toFixed(1)}%
                              </div>
                              {fragmentationRate > 20 && <AlertTriangle className="w-4 h-4 text-red-500 ml-1" />}
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(stat.lastAnalyzed).toLocaleDateString()}
                            </div>
                            <div className={`text-xs ${daysSinceAnalysis > 7 ? 'text-red-600' : 'text-gray-500'}`}>
                              {daysSinceAnalysis > 1 ? `${Math.floor(daysSinceAnalysis)} 天前` : '今天'}
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => onAnalyzeTable(stat.tableId)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              重新分析
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  性能分析
                </h3>
                <p className="text-gray-600">
                  性能分析功能正在开发中，敬请期待
                </p>
              </div>
            </div>
          )}

          {activeTab === 'trends' && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  趋势分析
                </h3>
                <p className="text-gray-600">
                  趋势分析功能正在开发中，敬请期待
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 最近更新 */}
      {summary.recentlyUpdated.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              最近更新
            </h3>
          </div>
          
          <div className="p-6">
            <div className="space-y-3">
              {summary.recentlyUpdated.map((table) => (
                <div key={table.tableId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Table className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {table.displayName || table.tableName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(table.lastAnalyzed).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatNumber(table.rowCount)} 行
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatBytes(table.dataSize)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StatsDashboard