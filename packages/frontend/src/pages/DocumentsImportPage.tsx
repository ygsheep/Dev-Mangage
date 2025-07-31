import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, FileText, Database, Brain, Code } from 'lucide-react'
import { apiMethods } from '../utils/api'
import UnifiedImportModal from '../components/UnifiedImportModal'

type ImportTab = 'api-doc' | 'swagger' | 'database'

const DocumentsImportPage: React.FC = () => {
  const navigate = useNavigate()
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [activeTab, setActiveTab] = useState<ImportTab>('api-doc')
  const [showImportModal, setShowImportModal] = useState(false)

  // Fetch projects for selection
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiMethods.getProjects({ limit: 100 }),
  })

  const projects = projectsData?.data?.projects || []

  const tabs = [
    {
      id: 'api-doc' as ImportTab,
      name: 'API文档',
      icon: <Brain className="w-5 h-5" />,
      description: '智能解析API设计文档',
      badge: 'AI',
      badgeColor: 'bg-purple-100 text-purple-800',
      features: ['AI智能解析', 'Markdown格式', '自然语言支持', '高识别率']
    },
    {
      id: 'swagger' as ImportTab,
      name: 'Swagger',
      icon: <Code className="w-5 h-5" />,
      description: '标准OpenAPI/Swagger规范',
      badge: 'JSON',
      badgeColor: 'bg-blue-100 text-blue-800',
      features: ['OpenAPI 3.0', 'Swagger 2.0', 'JSON/YAML', '标准规范']
    },
    {
      id: 'database' as ImportTab,
      name: '数据库设计',
      icon: <Database className="w-5 h-5" />,
      description: '数据表结构设计文档',
      badge: 'SQL',
      badgeColor: 'bg-green-100 text-green-800',
      features: ['表结构解析', '字段信息', '索引关系', '数据模型']
    }
  ]

  const handleImportSuccess = () => {
    setShowImportModal(false)
    if (selectedProjectId) {
      navigate(`/projects/${selectedProjectId}`)
    }
  }

  const handleStartImport = () => {
    if (!selectedProjectId) {
      return // Will show error in modal
    }
    setShowImportModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">导入文档</h1>
            <p className="text-gray-600">支持多种格式的文档导入，自动解析生成API和数据模型</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Project Selection */}
        <div className="space-y-6">
          {/* Project Selection */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">选择目标项目</h3>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="input"
            >
              <option value="">请选择项目</option>
              {projects.map((project: any) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Selected Project Info */}
          {selectedProjectId && (
            <div className="card">
              <h4 className="font-medium text-gray-900 mb-2">项目信息</h4>
              {(() => {
                const project = projects.find((p: any) => p.id === selectedProjectId)
                return project ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">项目名称:</span>
                      <span className="font-medium">{project.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">现有API:</span>
                      <span>{project._count?.apis || 0} 个</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">标签数量:</span>
                      <span>{project._count?.tags || 0} 个</span>
                    </div>
                    {project.description && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-gray-600 text-xs">{project.description}</p>
                      </div>
                    )}
                  </div>
                ) : null
              })()}
            </div>
          )}

          {/* Start Import Button */}
          <div className="card">
            <button
              onClick={handleStartImport}
              disabled={!selectedProjectId}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              开始导入
            </button>
          </div>
        </div>

        {/* Right Panel - Import Types */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200 bg-gray-50 rounded-t-lg">
              <div className="flex">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-all ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 bg-white'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className="flex items-center space-x-2">
                        {tab.icon}
                        <span>{tab.name}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${tab.badgeColor}`}>
                          {tab.badge}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 text-center">{tab.description}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {(() => {
                const currentTab = tabs.find(tab => tab.id === activeTab)
                return currentTab ? (
                  <div className="space-y-6">
                    {/* Tab Header */}
                    <div className={`p-4 rounded-lg border ${
                      activeTab === 'api-doc' ? 'bg-purple-50 border-purple-200' :
                      activeTab === 'swagger' ? 'bg-blue-50 border-blue-200' :
                      'bg-green-50 border-green-200'
                    }`}>
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${
                          activeTab === 'api-doc' ? 'bg-purple-100' :
                          activeTab === 'swagger' ? 'bg-blue-100' :
                          'bg-green-100'
                        }`}>
                          {currentTab.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-medium mb-1 ${
                            activeTab === 'api-doc' ? 'text-purple-800' :
                            activeTab === 'swagger' ? 'text-blue-800' :
                            'text-green-800'
                          }`}>
                            {currentTab.name}导入
                          </h4>
                          <p className={`text-sm ${
                            activeTab === 'api-doc' ? 'text-purple-700' :
                            activeTab === 'swagger' ? 'text-blue-700' :
                            'text-green-700'
                          }`}>
                            {currentTab.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Features */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">支持特性</h5>
                      <div className="grid grid-cols-2 gap-3">
                        {currentTab.features.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                            <div className={`w-2 h-2 rounded-full ${
                              activeTab === 'api-doc' ? 'bg-purple-500' :
                              activeTab === 'swagger' ? 'bg-blue-500' :
                              'bg-green-500'
                            }`}></div>
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Format Examples */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">格式示例</h5>
                      <div className={`p-4 rounded-lg text-xs font-mono ${
                        activeTab === 'api-doc' ? 'bg-purple-100 text-purple-800' :
                        activeTab === 'swagger' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {activeTab === 'api-doc' && (
                          <pre>{`## 用户登录 - POST /api/v1/auth/login
用户登录接口，支持用户名/邮箱登录

### 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| username | string | 是 | 用户名或邮箱 |
| password | string | 是 | 密码 |`}</pre>
                        )}
                        {activeTab === 'swagger' && (
                          <pre>{`{
  "openapi": "3.0.0",
  "info": {
    "title": "示例API",
    "version": "1.0.0"
  },
  "paths": {
    "/users": {
      "get": {
        "summary": "获取用户列表",
        "responses": {
          "200": {
            "description": "成功"
          }
        }
      }
    }
  }
}`}</pre>
                        )}
                        {activeTab === 'database' && (
                          <pre>{`## users 用户表
用户基础信息表

| 字段名 | 类型 | 长度 | 是否主键 | 是否为空 | 注释 |
|--------|------|------|----------|----------|------|
| id | BIGINT | 20 | YES | NO | 用户ID |
| username | VARCHAR | 50 | NO | NO | 用户名 |
| email | VARCHAR | 100 | NO | NO | 邮箱地址 |`}</pre>
                        )}
                      </div>
                    </div>

                    {/* Instructions */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">使用说明</h5>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-start space-x-2">
                          <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium text-white ${
                            activeTab === 'api-doc' ? 'bg-purple-500' :
                            activeTab === 'swagger' ? 'bg-blue-500' :
                            'bg-green-500'
                          }`}>1</span>
                          <p>选择目标项目</p>
                        </div>
                        <div className="flex items-start space-x-2">
                          <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium text-white ${
                            activeTab === 'api-doc' ? 'bg-purple-500' :
                            activeTab === 'swagger' ? 'bg-blue-500' :
                            'bg-green-500'
                          }`}>2</span>
                          <p>点击"开始导入"打开导入向导</p>
                        </div>
                        <div className="flex items-start space-x-2">
                          <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium text-white ${
                            activeTab === 'api-doc' ? 'bg-purple-500' :
                            activeTab === 'swagger' ? 'bg-blue-500' :
                            'bg-green-500'
                          }`}>3</span>
                          <p>
                            {activeTab === 'api-doc' && '上传Markdown文档并配置AI解析选项'}
                            {activeTab === 'swagger' && '输入Swagger URL或粘贴JSON内容'}
                            {activeTab === 'database' && '上传数据库设计文档'}
                          </p>
                        </div>
                        <div className="flex items-start space-x-2">
                          <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium text-white ${
                            activeTab === 'api-doc' ? 'bg-purple-500' :
                            activeTab === 'swagger' ? 'bg-blue-500' :
                            'bg-green-500'
                          }`}>4</span>
                          <p>确认解析结果并完成导入</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Unified Import Modal */}
      {showImportModal && (
        <UnifiedImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={handleImportSuccess}
          projectId={selectedProjectId}
          initialTab={activeTab as ImportTab}
        />
      )}
    </div>
  )
}

export default DocumentsImportPage