import { Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'

// 页面组件
import HomePage from './pages/HomePage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import MindmapPage from './pages/MindmapPage'
import SwaggerImportPage from './pages/SwaggerImportPage'
import DocumentsImportPage from './pages/DocumentsImportPage'
import SettingsPage from './pages/SettingsPage'
import DataModelPage from './pages/DataModelPage'
import { APIManagementPage } from './pages/APIManagementPage'
import DashboardPage from './pages/DashboardPage'
import ERDPage from './pages/ERDPage'
import DataModelMindmapPage from './pages/DataModelMindmapPage'

// 布局组件
import Layout from './components/layout'
import TitleBar from './components/layout/TitleBar'

// 主题系统
import { ThemeProvider } from './contexts/ThemeContext'

// 调试系统
import { DebugPanel, DebugController } from './debug'

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
      <div className={`min-h-screen ${isElectron ? 'app-with-titlebar' : ''}`}>
        {/* Electron环境下显示自定义标题栏 */}
        {isElectron && <TitleBar />}
        
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:id" element={<ProjectDetailPage />} />
            <Route path="projects/:projectId/mindmap" element={<MindmapPage />} />
            <Route path="projects/:projectId/data-model" element={<DataModelPage />} />
            <Route path="projects/:projectId/erd" element={<ERDPage />} />
            <Route path="projects/:projectId/data-mindmap" element={<DataModelMindmapPage />} />
            <Route path="projects/:projectId/api-management" element={<APIManagementPage />} />
            <Route path="api-management" element={<APIManagementPage />} />
            <Route path="import/swagger" element={<SwaggerImportPage />} />
            <Route path="import" element={<DocumentsImportPage />} />
            <Route path="import/documents" element={<DocumentsImportPage />} />
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