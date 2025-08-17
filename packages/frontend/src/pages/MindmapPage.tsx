import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, GitBranch } from 'lucide-react'
import { apiMethods } from '../utils/api'
import MindmapViewer from '../components/features/mindmap/components/MindmapViewer'

const MindmapPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()

  // Fetch project details for title
  const { data: projectData, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => apiMethods.getProject(projectId!),
    enabled: !!projectId,
  })

  const project = projectData?.data?.project

  if (!projectId) {
    return (
      <div className="card text-center py-12">
        <h3 className="text-lg font-medium text-text-primary mb-2">
          项目ID缺失
        </h3>
        <p className="text-text-secondary mb-6">
          请通过有效的项目链接访问
        </p>
        <Link to="/projects" className="btn-primary">
          返回项目列表
        </Link>
      </div>
    )
  }

  if (projectLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-bg-tertiary rounded animate-pulse"></div>
          <div className="w-48 h-8 bg-bg-tertiary rounded animate-pulse"></div>
        </div>
        <div className="w-full h-screen bg-bg-tertiary rounded animate-pulse"></div>
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
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-bg-paper border-b border-border-primary px-6 py-4">
        <div className="flex items-center space-x-4">
          <Link
            to={`/projects/${projectId}`}
            className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex items-center space-x-3">
            <GitBranch className="w-6 h-6 text-primary-600" />
            <div>
              <h1 className="text-xl font-bold text-text-primary">
                {project.name} - 关系图谱
              </h1>
              <p className="text-sm text-text-secondary">
                数据表关系可视化展示
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mindmap Viewer */}
      <div className="flex-1 overflow-hidden">
        <MindmapViewer
          projectId={projectId}
          height="100%"
          className="w-full"
          onNodeSelect={(node) => {
            if (node?.data.entityType === 'table') {
              console.log('Selected table:', node.data.entityId)
              // 可以在这里添加表节点选择的处理逻辑
              // 比如显示表详情面板或跳转到表编辑页面
            }
          }}
          onEdgeSelect={(edge) => {
            console.log('Selected relationship:', edge?.data.relationshipId)
            // 可以在这里添加关系选择的处理逻辑
            // 比如显示关系详情面板
          }}
        />
      </div>
    </div>
  )
}

export default MindmapPage