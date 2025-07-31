// 调试工具的辅助函数
import { logger } from './Logger'
import { performanceMonitor } from './PerformanceMonitor'
import useDebugStore from './DebugStore'

// 便捷的调试工具函数
export const debug = {
  // 快速日志记录
  log: (message: string, data?: any, source?: string) => {
    return logger.info(message, data, source)
  },
  warn: (message: string, data?: any, source?: string) => {
    return logger.warn(message, data, source)
  },
  error: (message: string, data?: any, source?: string) => {
    return logger.error(message, data, source)
  },
  
  // 性能测量
  time: (label: string) => {
    const startTime = performance.now()
    return {
      end: () => {
        const endTime = performance.now()
        const duration = endTime - startTime
        performanceMonitor.addMetric(label, duration, 'ms', 'timing')
        return duration
      }
    }
  },
  
  // 组件状态记录
  recordComponent: (name: string, state: any, props?: any) => {
    try {
      useDebugStore.getState().addComponentState({
        name,
        state,
        props,
        timestamp: Date.now()
      })
    } catch (error) {
      console.warn('Debug store not available:', error)
    }
  },
  
  // 导出所有调试数据
  export: async () => {
    try {
      await useDebugStore.getState().exportAllData()
    } catch (error) {
      console.warn('Export failed:', error)
    }
  },
  
  // 清空所有数据
  clear: () => {
    try {
      const store = useDebugStore.getState()
      store.clearLogs()
      store.clearNetworkRequests()
      store.clearPerformanceMetrics()
      store.clearComponentStates()
    } catch (error) {
      console.warn('Clear failed:', error)
    }
  },
  
  // 切换调试窗口显示
  toggle: () => {
    try {
      useDebugStore.getState().toggle()
    } catch (error) {
      console.warn('Toggle failed:', error)
    }
  }
}

// 初始化调试系统
export const initDebugSystem = () => {
  try {
    const store = useDebugStore.getState()
    store.init()
    
    // 添加全局调试对象到 window
    if (typeof window !== 'undefined') {
      (window as any).__DEBUG__ = debug
      console.info('🐛 Debug system initialized. Use window.__DEBUG__ to access debug tools.')
    }
  } catch (error) {
    console.warn('Failed to initialize debug system:', error)
  }
}

// 自动初始化（仅在开发环境）
if (import.meta.env.DEV && typeof window !== 'undefined') {
  initDebugSystem()
}