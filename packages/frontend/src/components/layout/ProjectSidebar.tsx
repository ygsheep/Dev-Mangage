import React from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import {
  BarChart3,
  Brain,
  Bug,
  Code2,
  Database,
  GitBranch,
  Grid3X3,
  Home,
  Layers,
  Settings,
  Users
} from 'lucide-react'

interface ProjectSidebarProps {
  projectName: string
  isCollapsed: boolean
}

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  projectName,
  isCollapsed
}) => {
  const location = useLocation()
  const { id: projectId } = useParams<{ id: string }>()

  const projectNavigation = [
    {
      name: '项目总览',
      href: `/projects/${projectId}`,
      icon: Home,
      description: '查看项目基本信息和统计数据'
    },
    {
      name: 'API管理',
      href: `/projects/${projectId}/apis`,
      icon: Code2,
      description: '管理API接口定义和测试'
    },
    {
      name: '数据模型',
      href: `/projects/${projectId}/data-models`,
      icon: Database,
      description: '设计和管理数据库表结构'
    },
    {
      name: '功能模块',
      href: `/projects/${projectId}/features`,
      icon: Layers,
      description: '管理项目功能模块和业务组件'
    },
    {
      name: 'Issues',
      href: `/projects/${projectId}/issues`,
      icon: Bug,
      description: '跟踪和管理项目问题'
    },
    {
      name: '关系图谱',
      href: `/projects/${projectId}/mindmap`,
      icon: GitBranch,
      description: '可视化数据和功能关系'
    },
    {
      name: 'AI解析',
      href: `/projects/${projectId}/ai-parse`,
      icon: Brain,
      description: '智能文档解析和导入'
    },
    {
      name: '项目设置',
      href: `/projects/${projectId}/settings`,
      icon: Settings,
      description: '配置项目参数和权限'
    }
  ]

  const isActive = (href: string) => {
    if (href === `/projects/${projectId}`) {
      return location.pathname === href
    }
    return location.pathname.startsWith(href)
  }

  return (
    <div className="border-t border-border-primary" onClick={(e) => e.stopPropagation()}>
      {/* 项目名称 */}
      <div className="p-3">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
          <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="text-sm font-medium text-text-primary truncate">
                {projectName}
              </div>
              <div className="text-xs text-text-tertiary">当前项目</div>
            </div>
          )}
        </div>
      </div>

      {/* 项目功能导航 */}
      <div className="px-3 space-y-1">
        {projectNavigation.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              to={item.href}
              className={`group flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                active
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
              }`}
              title={isCollapsed ? item.name : item.description}
            >
              <Icon
                className={`flex-shrink-0 ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4 mr-3'} ${
                  active
                    ? 'text-white'
                    : 'text-text-tertiary group-hover:text-text-secondary'
                }`}
              />
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className={`text-xs mt-0.5 ${
                    active 
                      ? 'text-primary-100' 
                      : 'text-text-tertiary group-hover:text-text-secondary'
                  }`}>
                    {item.description}
                  </div>
                </div>
              )}
              
              {/* 激活状态指示器 */}
              {active && (
                <div className="w-1 h-1 bg-white rounded-full ml-2 flex-shrink-0" />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default ProjectSidebar