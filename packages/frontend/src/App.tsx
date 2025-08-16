import { Routes, Route } from 'react-router-dom'

// 页面组件
import HomePage from './pages/HomePage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import MindmapPage from './pages/MindmapPage'
import SwaggerImportPage from './pages/SwaggerImportPage'
import DocumentsImportPage from './pages/DocumentsImportPage'
import SettingsPage from './pages/SettingsPage'
import DataModelPage from './pages/DataModelPage'

// 布局组件
import Layout from './components/Layout'

// 调试系统
import { DebugPanel, DebugController } from './debug'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="projects/:projectId/mindmap" element={<MindmapPage />} />
          <Route path="projects/:projectId/data-model" element={<DataModelPage />} />
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
  )
}

export default App