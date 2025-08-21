import { ArrowLeft, Layers } from 'lucide-react'
import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
// 功能模块组件
import FeatureModuleList from '../components/features/data-model/components/FeatureModuleList'

const ProjectFeaturesPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* 页面头部 */}
      <div className="bg-bg-paper border-b border-border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate(`/projects/${projectId}`)}
                  className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors mr-2"
                  title="返回项目详情"
                >
                  <ArrowLeft className="w-5 h-5 text-text-secondary" />
                </button>

                <Layers className="w-8 h-8 text-primary-600" />
                <div>
                  <h1 className="text-xl font-semibold text-text-primary">功能模块管理</h1>
                  <p className="text-sm text-text-secondary">管理项目的功能模块和业务组件</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-bg-paper rounded-lg shadow-theme-sm border border-border-primary">
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-text-primary mb-2">功能模块管理</h3>
              <p className="text-text-secondary">
                管理项目的功能模块，如用户登录、权限管理等业务功能。每个模块可以包含相关的API接口、开发任务和文档。
              </p>
            </div>
            <FeatureModuleList projectId={projectId!} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectFeaturesPage
