import { Archive, BarChart3, Folder, List, Settings } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import ProjectsManagePage from './ProjectsManagePage'
import DashboardPage from './DashboardPage'
import ArchiveManagePage from './ArchiveManagePage'
import SettingsPage from './SettingsPage'

type TabId = 'list' | 'dashboard' | 'archive' | 'settings'

interface Tab {
  id: TabId
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  path: string
}

const ProjectsPage: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // 定义 tabs
  const tabs: Tab[] = [
    {
      id: 'list',
      label: '项目列表',
      icon: List,
      description: '管理你的所有API项目',
      path: '/projects',
    },
    {
      id: 'dashboard',
      label: '仪表板',
      icon: BarChart3,
      description: '项目统计和概览数据',
      path: '/projects/dashboard',
    },
    {
      id: 'archive',
      label: '归档项目',
      icon: Archive,
      description: '查看已归档的项目',
      path: '/projects/archive',
    },
    {
      id: 'settings',
      label: '项目设置',
      icon: Settings,
      description: '全局项目配置',
      path: '/projects/settings',
    },
  ]

  // 根据当前路径确定活动的 tab
  const getActiveTab = (): TabId => {
    const path = location.pathname
    if (path === '/projects/dashboard') return 'dashboard'
    if (path === '/projects/archive') return 'archive'
    if (path === '/projects/settings') return 'settings'
    return 'list' // 默认为项目列表
  }

  const [activeTab, setActiveTab] = useState<TabId>(getActiveTab())

  // 监听路径变化来更新活动 tab
  useEffect(() => {
    setActiveTab(getActiveTab())
  }, [location.pathname])

  // 切换 tab
  const handleTabChange = (tabId: TabId) => {
    const targetTab = tabs.find(tab => tab.id === tabId)
    if (targetTab) {
      navigate(targetTab.path)
    }
  }

  // 渲染 tab 内容
  const renderTabContent = () => {
    switch (activeTab) {
      case 'list':
        return <ProjectsManagePage />
      case 'dashboard':
        return <DashboardPage />
      case 'archive':
        return <ArchiveManagePage />
      case 'settings':
        return <SettingsPage />
      default:
        return <ProjectsManagePage />
    }
  }

  return (
    <div className="min-h-screen bg-bg-secondary">
      {/* 页面头部 */}
      <div className="bg-bg-paper border-b border-border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 标题区域 */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Folder className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-text-primary">项目管理</h1>
                  <p className="text-sm text-text-secondary">
                    {tabs.find(tab => tab.id === activeTab)?.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tab 导航 */}
          <div className="flex space-x-8 overflow-x-auto custom-scrollbar">
            {tabs.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-secondary'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab 内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{renderTabContent()}</div>
    </div>
  )
}

export default ProjectsPage
