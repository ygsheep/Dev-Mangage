import React from 'react'
import { Code2, ArrowLeft } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { APIManagementPage } from './APIManagementPage'

const APIManagePage: React.FC = () => {
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
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Code2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-text-primary">API接口管理</h1>
                  <p className="text-sm text-text-secondary">管理和测试API接口定义</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API管理内容 */}
      <div className="pt-0">
        <APIManagementPage />
      </div>
    </div>
  )
}

export default APIManagePage