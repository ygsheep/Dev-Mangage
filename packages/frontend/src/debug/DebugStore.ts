import { create } from 'zustand'
import { DebugStore, LogEntry, NetworkRequest, PerformanceMetric, ComponentState } from './types'
import { logger } from './Logger'
import { networkMonitor } from './NetworkMonitor'
import { performanceMonitor } from './PerformanceMonitor'

interface DebugStoreActions {
  // 基础操作
  setEnabled: (enabled: boolean) => void
  setVisible: (visible: boolean) => void
  toggle: () => void
  
  // 日志管理
  addLog: (log: LogEntry) => void
  clearLogs: () => void
  setLogFilter: (levels: LogEntry['level'][]) => void
  
  // 网络监控
  addNetworkRequest: (request: NetworkRequest) => void
  clearNetworkRequests: () => void
  setShowNetwork: (show: boolean) => void
  
  // 性能监控
  addPerformanceMetric: (metric: PerformanceMetric) => void
  clearPerformanceMetrics: () => void
  setShowPerformance: (show: boolean) => void
  
  // 组件状态
  addComponentState: (state: ComponentState) => void
  clearComponentStates: () => void
  setShowComponents: (show: boolean) => void
  
  // 导出功能
  exportAllData: () => Promise<void>
  
  // 查看服务器日志
  viewServerLogs: () => Promise<void>
  
  // 初始化
  init: () => void
}

const useDebugStore = create<DebugStore & DebugStoreActions>((set, get) => ({
  // 初始状态
  logs: [],
  networkRequests: [],
  performanceMetrics: [],
  componentStates: [],
  isEnabled: import.meta.env.DEV,
  isVisible: false,
  filters: {
    logLevel: ['debug', 'info', 'warn', 'error'],
    showNetwork: true,
    showPerformance: true,
    showComponents: true
  },

  // 基础操作
  setEnabled: (enabled) => {
    set({ isEnabled: enabled })
    if (enabled) {
      get().init()
    }
    // 保存到localStorage
    localStorage.setItem('debug-enabled', enabled.toString())
  },

  setVisible: (visible) => {
    set({ isVisible: visible })
    localStorage.setItem('debug-visible', visible.toString())
  },

  toggle: () => {
    const { isVisible } = get()
    get().setVisible(!isVisible)
  },

  // 日志管理
  addLog: (log) => {
    set((state) => ({
      logs: [...state.logs, log].slice(-1000) // 限制日志数量
    }))
  },

  clearLogs: () => {
    set({ logs: [] })
    logger.clearLogs()
  },

  setLogFilter: (levels) => {
    set((state) => ({
      filters: { ...state.filters, logLevel: levels }
    }))
  },

  // 网络监控
  addNetworkRequest: (request) => {
    set((state) => {
      const existingIndex = state.networkRequests.findIndex(r => r.id === request.id)
      let newRequests: NetworkRequest[]
      
      if (existingIndex >= 0) {
        // 更新现有请求
        newRequests = [...state.networkRequests]
        newRequests[existingIndex] = request
      } else {
        // 添加新请求
        newRequests = [...state.networkRequests, request]
      }
      
      return {
        networkRequests: newRequests.slice(-500)
      }
    })
  },

  clearNetworkRequests: () => {
    set({ networkRequests: [] })
    networkMonitor.clearRequests()
  },

  setShowNetwork: (show) => {
    set((state) => ({
      filters: { ...state.filters, showNetwork: show }
    }))
  },

  // 性能监控
  addPerformanceMetric: (metric) => {
    set((state) => ({
      performanceMetrics: [...state.performanceMetrics, metric].slice(-500)
    }))
  },

  clearPerformanceMetrics: () => {
    set({ performanceMetrics: [] })
  },

  setShowPerformance: (show) => {
    set((state) => ({
      filters: { ...state.filters, showPerformance: show }
    }))
  },

  // 组件状态
  addComponentState: (componentState) => {
    set((state) => ({
      componentStates: [...state.componentStates, componentState].slice(-100)
    }))
  },

  clearComponentStates: () => {
    set({ componentStates: [] })
  },

  setShowComponents: (show) => {
    set((state) => ({
      filters: { ...state.filters, showComponents: show }
    }))
  },

  // 导出功能
  exportAllData: async () => {
    const state = get()
    const data = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      data: {
        logs: state.logs,
        networkRequests: state.networkRequests,
        performanceMetrics: state.performanceMetrics,
        componentStates: state.componentStates,
        filters: state.filters
      }
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `debug-export-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },

  // 查看服务器保存的日志
  viewServerLogs: async () => {
    try {
      const response = await fetch('/api/debug/logs')
      if (response.ok) {
        const data = await response.json()
        logger.info('服务器日志信息', {
          totalFiles: data.totalFiles,
          files: data.files.slice(0, 5), // 显示最近5个文件
          logsDirectory: data.logsDirectory
        }, 'DebugStore')
        
        if (data.files.length > 0) {
          const latest = data.files[0]
          logger.info(`最新日志文件: ${latest.filename}`, {
            logCount: latest.logCount,
            size: `${(latest.size / 1024).toFixed(1)}KB`,
            created: latest.created
          }, 'DebugStore')
        }
      } else {
        logger.warn('无法获取服务器日志信息', { status: response.status }, 'DebugStore')
      }
    } catch (error) {
      logger.error('查看服务器日志失败', error, 'DebugStore')
    }
  },

  // 初始化
  init: () => {
    const { addLog, addNetworkRequest, addPerformanceMetric } = get()

    // 恢复保存的设置
    const savedEnabled = localStorage.getItem('debug-enabled')
    const savedVisible = localStorage.getItem('debug-visible')
    
    if (savedEnabled !== null) {
      set({ isEnabled: savedEnabled === 'true' })
    }
    
    if (savedVisible !== null) {
      set({ isVisible: savedVisible === 'true' })
    }

    // 初始化监听器
    logger.subscribe(addLog)
    networkMonitor.onRequest(addNetworkRequest)
    performanceMonitor.onMetric(addPerformanceMetric)

    // 启动拦截器
    networkMonitor.interceptFetch()
    networkMonitor.interceptXHR()
    performanceMonitor.start()

    // 初始化快捷键
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Shift+D 切换调试窗口
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault()
        get().toggle()
      }
      
      // Ctrl+Shift+E 导出调试数据
      if (event.ctrlKey && event.shiftKey && event.key === 'E') {
        event.preventDefault()
        get().exportAllData()
      }
      
      // Ctrl+Shift+C 清空所有数据
      if (event.ctrlKey && event.shiftKey && event.key === 'C') {
        event.preventDefault()
        get().clearLogs()
        get().clearNetworkRequests()
        get().clearPerformanceMetrics()
        get().clearComponentStates()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    // 添加初始化日志
    logger.info('Debug system initialized', {
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    }, 'DebugStore')
  }
}))

export default useDebugStore