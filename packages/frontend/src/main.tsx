import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App.tsx'
import './index.css'
import { mcpConfig } from './config/mcpConfig'
import { debug } from './debug'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

// 检测Electron环境
const isElectron = typeof window !== 'undefined' && window.electronAPI
const Router = isElectron ? HashRouter : BrowserRouter

// 初始化MCP动态配置
const initializeApp = async () => {
  try {
    debug.log('开始初始化应用配置', {}, 'App')
    
    // 初始化MCP动态配置
    await mcpConfig.initializeDynamicConfig()
    
    debug.log('应用配置初始化完成', {
      configType: mcpConfig.getConfigType(),
      isDynamicEnabled: mcpConfig.isDynamicConfigEnabled()
    }, 'App')
    
  } catch (error) {
    debug.error('应用配置初始化失败', error, 'App')
  }
}

// 启动应用配置初始化（异步）
initializeApp()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10B981',
              },
            },
            error: {
              style: {
                background: '#EF4444',
              },
            },
          }}
        />
      </Router>
    </QueryClientProvider>
  </React.StrictMode>,
)