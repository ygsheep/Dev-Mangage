import React from 'react'
import { Database, ArrowLeft } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import DataModelPage from './DataModelPage'

const DataModelManagePage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('project')

  return (
    <div className="min-h-screen bg-bg-secondary">
      {/* 页面头部 */}
      <div className="bg-bg-paper border-b border-border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 标题区域 */}
            <div className="flex items-center space-x-4">
              {/* 返回按钮 */}
              <button
                onClick={() => navigate('/')}
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
                title="返回首页"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <Database className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-text-primary">数据模型管理</h1>
                  <p className="text-sm text-text-secondary">设计和管理数据库表结构</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 数据模型内容 */}
      <div className="pt-0">
        {projectId ? (
          <DataModelPage projectIdFromQuery={projectId} />
        ) : (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <Database className="w-16 h-16 mx-auto text-text-tertiary mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">请选择项目</h3>
              <p className="text-text-secondary">请先从侧边栏选择一个项目来管理数据模型</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DataModelManagePage