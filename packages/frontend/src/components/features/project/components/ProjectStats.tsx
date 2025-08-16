import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, Code2, Tag, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { apiMethods } from '../../../../utils/api'
import { API_STATUS_LABELS } from '@shared/types'

interface ProjectStatsProps {
  projectId: string
}

const ProjectStats: React.FC<ProjectStatsProps> = ({ projectId }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['project-stats', projectId],
    queryFn: () => apiMethods.getProjectStats(projectId),
  })

  const stats = data?.data

  if (isLoading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'TESTED':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'IN_PROGRESS':
        return <Clock className="w-5 h-5 text-blue-500" />
      case 'NOT_TESTED':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      default:
        return <Code2 className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'TESTED':
        return 'text-green-600'
      case 'IN_PROGRESS':
        return 'text-blue-600'
      case 'NOT_TESTED':
        return 'text-yellow-600'
      case 'DEPRECATED':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="card">
      <div className="flex items-center space-x-2 mb-6">
        <BarChart3 className="w-5 h-5 text-primary-600" />
        <h3 className="text-lg font-semibold text-gray-900">项目统计</h3>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">总API数</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalAPIs}</p>
            </div>
            <Code2 className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">标签数</p>
              <p className="text-2xl font-bold text-green-900">{stats.totalTags}</p>
            </div>
            <Tag className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">完成率</p>
              <p className="text-2xl font-bold text-purple-900">
                {stats.totalAPIs > 0 
                  ? Math.round(((stats.statusCounts?.COMPLETED || 0) + (stats.statusCounts?.TESTED || 0)) / stats.totalAPIs * 100)
                  : 0
                }%
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      {stats.statusCounts && Object.keys(stats.statusCounts).length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">API状态分布</h4>
          <div className="space-y-3">
            {Object.entries(stats.statusCounts).map(([status, count]) => {
              const percentage = stats.totalAPIs > 0 ? (Number(count) / stats.totalAPIs * 100) : 0
              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(status)}
                    <span className="text-sm font-medium text-gray-700">
                      {API_STATUS_LABELS[status as keyof typeof API_STATUS_LABELS] || status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getStatusColor(status).replace('text-', 'bg-').replace('600', '500')}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className={`text-sm font-semibold ${getStatusColor(status)} min-w-[3rem] text-right`}>
                      {count as number} ({Math.round(percentage)}%)
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {stats.totalAPIs === 0 && (
        <div className="text-center py-8">
          <Code2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">还没有API数据</p>
          <p className="text-sm text-gray-400">添加一些API来查看统计信息</p>
        </div>
      )}
    </div>
  )
}

export default ProjectStats