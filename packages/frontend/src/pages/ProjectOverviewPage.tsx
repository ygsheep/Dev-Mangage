import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  ArrowRight,
  BarChart3,
  Brain,
  Bug,
  Code2,
  Database,
  GitBranch,
  Layers,
  Settings,
  TrendingUp,
  Users,
} from 'lucide-react'
import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import ProjectStats from '../components/features/project/components/ProjectStats'
import ProjectSettingsModal from '../components/features/project/components/modals/ProjectSettingsModal'
import { apiMethods } from '../utils/api'

const ProjectOverviewPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const [showStats, setShowStats] = useState(false)
  const [showProjectSettings, setShowProjectSettings] = useState(false)

  // 检查是否为创建新项目
  const isNewProject = projectId === 'new'

  // 获取项目信息
  const { data: projectData } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => apiMethods.getProject(projectId!),
    enabled: !!projectId && !isNewProject,
  })

  // 获取项目统计数据
  const { data: apisData } = useQuery({
    queryKey: ['apis', projectId],
    queryFn: () => apiMethods.getAPIs({ projectId: projectId, limit: 10 }),
    enabled: !!projectId && !isNewProject,
  })

  const project = projectData?.data
  const apis = apisData?.data?.apis || []

  const handleProjectUpdate = (updatedProject: any) => {
    // 可以添加项目更新逻辑
    console.log('项目已更新:', updatedProject)
  }

  const quickActions = [
    {
      name: 'API管理',
      description: '管理API接口定义和测试',
      href: `/manage/apis?project=${projectId}`,
      icon: Code2,
      color: 'bg-blue-500',
      stats: `${apis.length} 个接口`,
    },
    {
      name: '数据模型',
      description: '设计和管理数据库表结构',
      href: `/manage/data-models?project=${projectId}`,
      icon: Database,
      color: 'bg-green-500',
      stats: '数据表设计',
    },
    {
      name: '功能模块',
      description: '管理项目功能模块和业务组件',
      href: `/projects/${projectId}/features`,
      icon: Layers,
      color: 'bg-purple-500',
      stats: '业务功能',
    },
    {
      name: 'Issues',
      description: '跟踪和管理项目问题',
      href: `/projects/${projectId}/issues`,
      icon: Bug,
      color: 'bg-red-500',
      stats: '问题跟踪',
    },
    {
      name: '关系图谱',
      description: '可视化数据和功能关系',
      href: `/projects/${projectId}/mindmap`,
      icon: GitBranch,
      color: 'bg-yellow-500',
      stats: '关系可视化',
    },
    {
      name: 'AI解析',
      description: '智能文档解析和导入',
      href: `/projects/${projectId}/ai-parse`,
      icon: Brain,
      color: 'bg-indigo-500',
      stats: '智能导入',
    },
  ]

  // 如果是新项目创建页面，显示创建项目表单
  if (isNewProject) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-bg-paper rounded-lg shadow-sm border border-border-primary p-6">
            <h1 className="text-2xl font-bold text-text-primary mb-6">创建新项目</h1>
            <p className="text-text-secondary mb-4">请使用项目管理页面创建新项目。</p>
            <Link to="/manage/projects" className="btn-primary inline-flex items-center space-x-2">
              <span>前往项目管理</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* 页面头部 */}
      <div className="bg-bg-paper border-b border-border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="w-5 h-5 text-white"
                  >
                    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-text-primary">
                    {project?.name || '项目总览'}
                  </h1>
                  <p className="text-sm text-text-secondary">
                    {project?.description || '项目概况和快速操作'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowStats(!showStats)}
                className="btn-outline flex items-center space-x-2"
              >
                <BarChart3 className="w-4 h-4" />
                <span>统计</span>
              </button>

              <button
                onClick={() => setShowProjectSettings(true)}
                className="btn-outline flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>设置</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 项目统计 */}
        {showStats && (
          <div className="mb-8">
            <ProjectStats projectId={projectId!} />
          </div>
        )}

        {/* 项目信息概览 */}
        <div className="bg-bg-paper rounded-lg shadow-theme-sm border border-border-primary p-6 mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4">项目信息</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-text-secondary">状态</div>
                <div className="font-medium text-text-primary">{project?.status || '开发中'}</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Code2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-text-secondary">API接口</div>
                <div className="font-medium text-text-primary">{apis.length} 个</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-text-secondary">团队成员</div>
                <div className="font-medium text-text-primary">{project?.teamSize || 1} 人</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-sm text-text-secondary">进度</div>
                <div className="font-medium text-text-primary">{project?.progress || 0}%</div>
              </div>
            </div>
          </div>

          {project?.baseUrl && (
            <div className="mt-4 pt-4 border-t border-border-primary">
              <div className="text-sm text-text-secondary">API Base URL</div>
              <div className="font-mono text-sm text-primary-600 mt-1">{project.baseUrl}</div>
            </div>
          )}
        </div>

        {/* 快速操作 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4">快速操作</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map(action => {
              const Icon = action.icon
              return (
                <Link
                  key={action.name}
                  to={action.href}
                  className="group bg-bg-paper border border-border-primary rounded-lg p-6 hover:shadow-theme-md transition-all duration-200 hover:border-primary-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-text-tertiary group-hover:text-primary-600 transition-colors" />
                  </div>

                  <h3 className="font-semibold text-text-primary mb-2 group-hover:text-primary-600 transition-colors">
                    {action.name}
                  </h3>

                  <p className="text-sm text-text-secondary mb-3">{action.description}</p>

                  <div className="text-xs text-text-tertiary">{action.stats}</div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* 最近活动 */}
        <div className="bg-bg-paper rounded-lg shadow-theme-sm border border-border-primary p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">最近活动</h2>

          <div className="text-center py-8 text-text-secondary">
            <Activity className="w-12 h-12 mx-auto mb-3 text-text-tertiary" />
            <p>暂无最近活动</p>
            <p className="text-sm mt-1">开始使用各功能模块后，这里会显示相关活动</p>
          </div>
        </div>
      </div>

      {/* 项目设置模态框 */}
      <ProjectSettingsModal
        project={project}
        isOpen={showProjectSettings}
        onClose={() => setShowProjectSettings(false)}
        onUpdate={handleProjectUpdate}
      />
    </div>
  )
}

export default ProjectOverviewPage
