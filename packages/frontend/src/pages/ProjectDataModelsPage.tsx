import { Brain, Database, GitBranch, Grid3X3 } from 'lucide-react'
import React from 'react'
import { Link, useParams } from 'react-router-dom'

const ProjectDataModelsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <Grid3X3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">数据模型管理</h3>
          <p className="text-text-secondary mb-6">
            设计和管理数据库表结构，支持ER图设计、AI文档解析、SQL生成等完整功能
          </p>
          <div className="space-y-4">
            <Link
              to={`/projects/${projectId}/data-model`}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Database className="w-5 h-5 mr-2" />
              进入数据模型管理
            </Link>

            <div className="flex justify-center space-x-4">
              <Link
                to={`/projects/${projectId}/erd`}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <GitBranch className="w-5 h-5 mr-2" />
                ER图设计器
              </Link>

              <Link
                to={`/projects/${projectId}/ai-parse`}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Brain className="w-5 h-5 mr-2" />
                AI文档解析
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectDataModelsPage
