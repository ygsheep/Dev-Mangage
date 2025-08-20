import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Folder, Import, Settings, Clock, BookOpen } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { apiMethods } from '../utils/api'
import { useDebugComponent } from '../debug'

const HomePage: React.FC = () => {
  const navigate = useNavigate()
  
  const { data: projectsResponse = {} } = useQuery({
    queryKey: ['projects'],
    queryFn: apiMethods.getProjects,
  })

  const projects = projectsResponse?.data?.projects || projectsResponse?.projects || []
  const projectsArray = Array.isArray(projects) ? projects : []
  const recentProjects = projectsArray.slice(0, 6)

  // 调试功能
  useDebugComponent('HomePage', { 
    projectsCount: projectsArray.length,
    recentProjectsCount: recentProjects.length 
  }, { 
    navigate: !!navigate 
  })

  const quickActions = [
    {
      title: '新建项目',
      description: '创建一个新的API项目',
      icon: Plus,
      color: 'bg-primary-50 dark:bg-primary-900/20',
      action: () => navigate('/projects?action=new'),
    },
    {
      title: '导入文档',
      description: '导入API文档、Swagger、数据库设计',
      icon: Import,
      color: 'bg-green-500',
      action: () => navigate('/import/documents'),
    },
    {
      title: '浏览项目',
      description: '查看所有项目',
      icon: Folder,
      color: 'bg-purple-500',
      action: () => navigate('/projects'),
    },
    {
      title: '设置',
      description: '应用程序设置',
      icon: Settings,
      color: 'bg-bg-secondary0',
      action: () => navigate('/settings'),
    },
  ]

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* 欢迎区域 */}
      <header className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <BookOpen className="h-12 w-12 text-primary-600 mr-3" />
          <h1 className="text-4xl font-bold text-text-primary">DevAPI Manager</h1>
        </div>
        <p className="text-xl text-text-secondary max-w-2xl mx-auto">
          专业的API聚合管理工具，让你的开发工作更加高效有序
        </p>
      </header>

      {/* Gray Background Test Area */}
      <section className="mb-12">
        <div className="bg-bg-paper rounded-xl p-6 shadow-theme-sm border border-border-primary">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Gray Background Test (暗色模式测试)</h2>
          <div className="grid grid-cols-5 gap-4">
             <div className="bg-gray-100 p-4 rounded text-center">
               <div className="text-sm font-medium text-gray-900 dark:text-gray-100">bg-gray-100</div>
             </div>
             <div className="bg-gray-200 p-4 rounded text-center">
               <div className="text-sm font-medium text-gray-900 dark:text-gray-100">bg-gray-200</div>
             </div>
             <div className="bg-gray-300 p-4 rounded text-center">
               <div className="text-sm font-medium text-gray-900 dark:text-gray-100">bg-gray-300</div>
             </div>
             <div className="bg-gray-400 p-4 rounded text-center">
               <div className="text-sm font-medium text-gray-900 dark:text-gray-100">bg-gray-400</div>
             </div>
             <div className="bg-gray-500 p-4 rounded text-center">
               <div className="text-sm font-medium text-gray-100 dark:text-gray-900">bg-gray-500</div>
             </div>
             <div className="bg-gray-600 p-4 rounded text-center">
               <div className="text-sm font-medium text-gray-100 dark:text-gray-900">bg-gray-600</div>
             </div>
             <div className="bg-gray-700 p-4 rounded text-center">
               <div className="text-sm font-medium text-gray-100 dark:text-gray-900">bg-gray-700</div>
             </div>
             <div className="bg-gray-800 p-4 rounded text-center">
               <div className="text-sm font-medium text-gray-100 dark:text-gray-900">bg-gray-800</div>
             </div>
             <div className="bg-gray-900 p-4 rounded text-center">
               <div className="text-sm font-medium text-gray-100 dark:text-gray-900">bg-gray-900</div>
             </div>
           </div>
        </div>
      </section>

      {/* 快速操作 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-text-primary mb-6">快速开始</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="group bg-bg-paper rounded-xl p-6 shadow-theme-sm border border-border-primary hover:shadow-theme-md transition-all duration-200 text-left"
            >
              <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <action.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-text-primary mb-2">{action.title}</h3>
              <p className="text-sm text-text-secondary">{action.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* 最近项目 */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-text-primary">最近项目</h2>
          <Link
            to="/projects"
            className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
          >
            查看全部
            <Clock className="h-4 w-4 ml-1" />
          </Link>
        </div>

        {recentProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentProjects.map((project: any) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="group bg-bg-paper rounded-xl p-6 shadow-theme-sm border border-border-primary hover:shadow-theme-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-primary group-hover:text-primary-600 transition-colors">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-text-secondary text-sm mt-1 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </div>
                  <div className="ml-3">
                    <Folder className="h-5 w-5 text-text-tertiary group-hover:text-primary-500 transition-colors" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-text-tertiary">
                  <div className="flex items-center space-x-4">
                    <span>{project._count?.apis || 0} APIs</span>
                    <span>{project._count?.tags || 0} 标签</span>
                  </div>
                  <span>
                    {new Date(project.updatedAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Folder className="h-16 w-16 text-text-tertiary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">暂无项目</h3>
            <p className="text-text-secondary mb-6">开始创建你的第一个项目吧</p>
            <button
              onClick={() => navigate('/projects?action=new')}
              className="btn-primary inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              新建项目
            </button>
          </div>
        )}
      </section>
    </div>
  )
}

export default HomePage