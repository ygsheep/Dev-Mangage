import { LogEntry } from './types'

class Logger {
  private static instance: Logger
  private listeners: ((entry: LogEntry) => void)[] = []
  private maxLogs = 1000
  private logBuffer: LogEntry[] = []
  private isFileSaveEnabled = false

  private constructor() {
    this.initializeFileSave()
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  private initializeFileSave() {
    const saved = localStorage.getItem('debug-auto-save')
    this.isFileSaveEnabled = saved === 'true'
  }

  private createLogEntry(level: LogEntry['level'], message: string, data?: any, source?: string): LogEntry {
    return {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level,
      message,
      data: data ? JSON.parse(JSON.stringify(data)) : undefined,
      source,
      stack: level === 'error' ? new Error().stack : undefined
    }
  }

  private addToBuffer(entry: LogEntry) {
    this.logBuffer.push(entry)
    if (this.logBuffer.length > this.maxLogs) {
      this.logBuffer = this.logBuffer.slice(-this.maxLogs)
    }
    
    this.notifyListeners(entry)
    
    if (this.isFileSaveEnabled) {
      this.saveToFile()
    }
  }

  private notifyListeners(entry: LogEntry) {
    this.listeners.forEach(listener => {
      try {
        listener(entry)
      } catch (error) {
        console.error('Error in log listener:', error)
      }
    })
  }

  debug(message: string, data?: any, source?: string) {
    const entry = this.createLogEntry('debug', message, data, source)
    this.addToBuffer(entry)
    console.debug(`[${source || 'Debug'}]`, message, data || '')
  }

  info(message: string, data?: any, source?: string) {
    const entry = this.createLogEntry('info', message, data, source)
    this.addToBuffer(entry)
    console.info(`[${source || 'Info'}]`, message, data || '')
  }

  log(message: string, data?: any, source?: string) {
    const entry = this.createLogEntry('info', message, data, source)
    this.addToBuffer(entry)
    console.log(`[${source || 'Log'}]`, message, data || '')
  }

  warn(message: string, data?: any, source?: string) {
    const entry = this.createLogEntry('warn', message, data, source)
    this.addToBuffer(entry)
    console.warn(`[${source || 'Warning'}]`, message, data || '')
  }

  error(message: string, error?: any, source?: string) {
    const entry = this.createLogEntry('error', message, error, source)
    this.addToBuffer(entry)
    console.error(`[${source || 'Error'}]`, message, error || '')
  }

  getLogs(): LogEntry[] {
    return [...this.logBuffer]
  }

  clearLogs() {
    this.logBuffer = []
    this.notifyListeners({ 
      id: 'clear', 
      timestamp: Date.now(), 
      level: 'info', 
      message: 'Logs cleared' 
    })
  }

  subscribe(listener: (entry: LogEntry) => void) {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  setFileSaveEnabled(enabled: boolean) {
    this.isFileSaveEnabled = enabled
    localStorage.setItem('debug-auto-save', enabled.toString())
  }

  isFileSaveEnabledValue(): boolean {
    return this.isFileSaveEnabled
  }

  private saveToFile() {
    if (this.logBuffer.length === 0) return
    
    try {
      const logData = this.logBuffer.map(entry => ({
        timestamp: new Date(entry.timestamp).toISOString(),
        level: entry.level,
        message: entry.message,
        source: entry.source,
        data: entry.data
      }))
      
      const content = JSON.stringify(logData, null, 2)
      const filename = `devapi-debug-${new Date().toISOString().slice(0, 10)}.json`
      
      // 静默保存到浏览器下载目录
      const element = document.createElement('a')
      const file = new Blob([content], { type: 'application/json' })
      element.href = URL.createObjectURL(file)
      element.download = filename
      element.style.display = 'none'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
      URL.revokeObjectURL(element.href)
    } catch (error) {
      console.error('Failed to save logs:', error)
    }
  }

  exportLogs() {
    this.saveToFile()
  }

  time(label: string) {
    const startTime = performance.now()
    return {
      end: () => {
        const endTime = performance.now()
        const duration = endTime - startTime
        this.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`, { duration, startTime, endTime }, 'Timer')
        return duration
      }
    }
  }

  group(name: string) {
    console.group(name)
    this.log(`📁 Group: ${name}`, undefined, 'Group')
  }

  groupEnd() {
    console.groupEnd()
    this.log(`📁 Group End`, undefined, 'Group')
  }
}

export const logger = Logger.getInstance()
export default logger