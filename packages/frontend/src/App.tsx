import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'

// 页面组件
import { APIManagementPage } from './pages/APIManagementPage'
import AIDocumentParsePage from './pages/AIDocumentParsePage'
import ChatsPage from './pages/ChatsPage'
import DashboardPage from './pages/DashboardPage'
import DataModelMindmapPage from './pages/DataModelMindmapPage'
import DataModelPage from './pages/DataModelPage'
import ERDPage from './pages/ERDPage'
import HomePage from './pages/HomePage'
import { IssueDetailPage } from './pages/IssueDetailPage'
import { IssuesPage } from './pages/IssuesPage'
import MindmapPage from './pages/MindmapPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import ProjectsPage from './pages/ProjectsPage'
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
      <div className={`min-h-screen ${isElectron ? '' : ''}`}>
        {/* Electron环境下显示自定义标题栏 */}
        {isElectron && <TitleBar />}

        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="chats" element={<ChatsPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:id" element={<ProjectDetailPage />} />
            <Route path="projects/:projectId/mindmap" element={<MindmapPage />} />
            <Route path="projects/:projectId/data-model" element={<DataModelPage />} />
            <Route path="projects/:projectId/erd" element={<ERDPage />} />
            <Route path="projects/:projectId/data-mindmap" element={<DataModelMindmapPage />} />
            <Route path="projects/:projectId/api-management" element={<APIManagementPage />} />
            <Route path="projects/:projectId/issues" element={<IssuesPage />} />
            <Route path="projects/:projectId/issues/:issueId" element={<IssueDetailPage />} />
            <Route path="projects/:projectId/ai-parse" element={<AIDocumentParsePage />} />
            <Route path="api-management" element={<APIManagementPage />} />
            <Route path="ai-parse" element={<AIDocumentParsePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>

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
