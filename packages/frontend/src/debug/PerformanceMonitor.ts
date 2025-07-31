import { PerformanceMetric } from './types'

class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private listeners: ((metric: PerformanceMetric) => void)[] = []
  private intervalId: number | null = null
  private observers: PerformanceObserver[] = []

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private emit(metric: PerformanceMetric) {
    this.listeners.forEach(listener => listener(metric))
  }

  private createMetric(
    name: string,
    value: number,
    unit: string,
    type: PerformanceMetric['type']
  ): PerformanceMetric {
    return {
      id: this.generateId(),
      timestamp: Date.now(),
      name,
      value,
      unit,
      type
    }
  }

  // 开始监控
  start() {
    this.monitorMemory()
    this.monitorNavigation()
    this.monitorLCP()
    this.monitorFID()
    this.monitorCLS()
  }

  // 监控内存使用
  private monitorMemory() {
    if ('memory' in performance) {
      this.intervalId = window.setInterval(() => {
        const memory = (performance as any).memory
        
        this.emit(this.createMetric(
          'Memory Used',
          memory.usedJSHeapSize / 1024 / 1024,
          'MB',
          'memory'
        ))

        this.emit(this.createMetric(
          'Memory Total',
          memory.totalJSHeapSize / 1024 / 1024,
          'MB',
          'memory'
        ))

        this.emit(this.createMetric(
          'Memory Limit',
          memory.jsHeapSizeLimit / 1024 / 1024,
          'MB',
          'memory'
        ))
      }, 5000)
    }
  }

  // 监控导航性能
  private monitorNavigation() {
    if ('getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
      
      if (navigationEntries.length > 0) {
        const nav = navigationEntries[0]
        
        this.emit(this.createMetric(
          'DNS Lookup',
          nav.domainLookupEnd - nav.domainLookupStart,
          'ms',
          'timing'
        ))

        this.emit(this.createMetric(
          'TCP Connection',
          nav.connectEnd - nav.connectStart,
          'ms',
          'timing'
        ))

        this.emit(this.createMetric(
          'Request',
          nav.responseStart - nav.requestStart,
          'ms',
          'timing'
        ))

        this.emit(this.createMetric(
          'Response',
          nav.responseEnd - nav.responseStart,
          'ms',
          'timing'
        ))

        this.emit(this.createMetric(
          'DOM Ready',
          nav.domContentLoadedEventEnd - nav.fetchStart,
          'ms',
          'timing'
        ))

        this.emit(this.createMetric(
          'Load Complete',
          nav.loadEventEnd - nav.fetchStart,
          'ms',
          'timing'
        ))
      }
    }
  }

  // 监控最大内容绘制 (LCP)
  private monitorLCP() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          
          this.emit(this.createMetric(
            'Largest Contentful Paint',
            lastEntry.startTime,
            'ms',
            'timing'
          ))
        })

        observer.observe({ entryTypes: ['largest-contentful-paint'] })
        this.observers.push(observer)
      } catch (e) {
        console.warn('LCP monitoring not supported')
      }
    }
  }

  // 监控首次输入延迟 (FID)
  private monitorFID() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            this.emit(this.createMetric(
              'First Input Delay',
              (entry as any).processingStart - entry.startTime,
              'ms',
              'timing'
            ))
          })
        })

        observer.observe({ entryTypes: ['first-input'] })
        this.observers.push(observer)
      } catch (e) {
        console.warn('FID monitoring not supported')
      }
    }
  }

  // 监控累积布局偏移 (CLS)
  private monitorCLS() {
    if ('PerformanceObserver' in window) {
      try {
        let clsValue = 0
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value
              this.emit(this.createMetric(
                'Cumulative Layout Shift',
                clsValue,
                'score',
                'counter'
              ))
            }
          })
        })

        observer.observe({ entryTypes: ['layout-shift'] })
        this.observers.push(observer)
      } catch (e) {
        console.warn('CLS monitoring not supported')
      }
    }
  }

  // 手动添加性能指标
  addMetric(name: string, value: number, unit: string, type: PerformanceMetric['type']) {
    this.emit(this.createMetric(name, value, unit, type))
  }

  // 测量函数执行时间
  measureFunction<T>(name: string, fn: () => T): T {
    const start = performance.now()
    const result = fn()
    const end = performance.now()
    
    this.emit(this.createMetric(name, end - start, 'ms', 'timing'))
    return result
  }

  // 测量异步函数执行时间
  async measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    const result = await fn()
    const end = performance.now()
    
    this.emit(this.createMetric(name, end - start, 'ms', 'timing'))
    return result
  }

  onMetric(listener: (metric: PerformanceMetric) => void) {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance()