import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'

// 页面组件
import { APIManagementPage } from './pages/APIManagementPage'
import APIManagePage from './pages/APIManagePage'
import AIDocumentParsePage from './pages/AIDocumentParsePage'
import ArchiveManagePage from './pages/ArchiveManagePage'
import ChatsPage from './pages/ChatsPage'
import DashboardPage from './pages/DashboardPage'
import DashboardManagePage from './pages/DashboardManagePage'
import DataModelManagePage from './pages/DataModelManagePage'
import DataModelMindmapPage from './pages/DataModelMindmapPage'
import DataModelPage from './pages/DataModelPage'
import ERDPage from './pages/ERDPage'
import HomePage from './pages/HomePage'
import { IssueDetailPage } from './pages/IssueDetailPage'
import { IssuesPage } from './pages/IssuesPage'
import IssuesManagePage from './pages/IssuesManagePage'
import MindmapPage from './pages/MindmapPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import ProjectOverviewPage from './pages/ProjectOverviewPage'
import ProjectDataModelsPage from './pages/ProjectDataModelsPage'
import ProjectFeaturesPage from './pages/ProjectFeaturesPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectsManagePage from './pages/ProjectsManagePage'
import SettingsPage from './pages/SettingsPage'

// 布局组件
import Layout from './components/layout'
import TitleBar from './components/layout/TitleBar'

// 主题系统
import { ThemeProvider } from './contexts/ThemeContext'

// 调试系统
import { DebugController, DebugPanel } from './debug'

function App() {
  const [isElectron, setIsElectron] = useState(false)

  useEffect(() => {
    // 检测是否在Electron环境中运行
    if (typeof window !== 'undefined' && window.electronAPI) {
      setIsElectron(true)
    }
  }, [])

  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col">
        {/* Electron环境下显示自定义标题栏 */}
        {isElectron && <TitleBar />}
        
        {/* 主要内容区域，在Electron环境下需要排除标题栏高度 */}
        <div className={`flex-1 ${isElectron ? 'h-[calc(100vh-2rem)]' : 'min-h-screen'}`}>

        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            
            {/* 全局管理页面 - 侧边栏直接跳转 */}
            <Route path="manage/projects" element={<ProjectsManagePage />} />
            <Route path="manage/dashboard" element={<DashboardManagePage />} />
            <Route path="manage/apis" element={<APIManagePage />} />
            <Route path="manage/data-models" element={<DataModelManagePage />} />
            <Route path="manage/issues" element={<IssuesManagePage />} />
            <Route path="manage/archive" element={<ArchiveManagePage />} />
            
            {/* Projects页面使用tabs */}
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="chats" element={<ChatsPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/dashboard" element={<ProjectsPage />} />
            <Route path="projects/archive" element={<ProjectsPage />} />
            <Route path="projects/settings" element={<ProjectsPage />} />
            <Route path="archive" element={<ArchiveManagePage />} />
            
            {/* 新的项目导航结构 */}
            <Route path="projects/:projectId" element={<ProjectOverviewPage />} />
            <Route path="projects/:projectId/apis" element={<APIManagementPage />} />
            <Route path="projects/:projectId/data-models" element={<ProjectDataModelsPage />} />
            <Route path="projects/:projectId/features" element={<ProjectFeaturesPage />} />
            <Route path="projects/:projectId/issues" element={<IssuesPage />} />
            <Route path="projects/:projectId/issues/:issueId" element={<IssueDetailPage />} />
            <Route path="projects/:projectId/mindmap" element={<MindmapPage />} />
            <Route path="projects/:projectId/ai-parse" element={<AIDocumentParsePage />} />
            <Route path="projects/:projectId/settings" element={<ProjectOverviewPage />} />
            
            {/* 保留旧路由兼容性 */}
            <Route path="projects/:id" element={<ProjectDetailPage />} />
            <Route path="projects/:projectId/data-model" element={<DataModelPage />} />
            <Route path="projects/:projectId/erd" element={<ERDPage />} />
            <Route path="projects/:projectId/data-mindmap" element={<DataModelMindmapPage />} />
            <Route path="projects/:projectId/api-management" element={<APIManagementPage />} />
            <Route path="api-management" element={<APIManagementPage />} />
            <Route path="ai-parse" element={<AIDocumentParsePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          </Routes>
        </div>

        {/* 调试系统 - 仅在开发环境显示 */}
        {import.meta.env.DEV && (
          <>
            <DebugPanel />
            <DebugController />
          </>
        )}
      </div>
    </ThemeProvider>
  )
}

export default App
