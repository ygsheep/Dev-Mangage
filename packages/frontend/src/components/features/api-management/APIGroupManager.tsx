import { Folder } from 'lucide-react'
import React from 'react'

interface APIGroupManagerProps {
  projectId: string
  groups?: any[]
  loading?: boolean
  onRefresh?: () => void
}

export const APIGroupManager: React.FC<APIGroupManagerProps> = ({
  projectId,
  groups = [],
  loading = false,
  onRefresh,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-text-secondary">加载中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <Folder className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">分组管理功能开发中</p>
        <p className="text-gray-400 text-sm">此功能正在开发中，敬请期待</p>
      </div>
    </div>
  )
}
