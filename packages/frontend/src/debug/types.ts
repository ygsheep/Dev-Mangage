export interface LogEntry {
  id: string
  timestamp: number
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  data?: any
  source?: string
  stack?: string
}

export interface NetworkRequest {
  id: string
  timestamp: number
  method: string
  url: string
  status?: number
  duration?: number
  requestData?: any
  responseData?: any
  error?: string
}

export interface PerformanceMetric {
  id: string
  timestamp: number
  name: string
  value: number
  unit: string
  type: 'memory' | 'timing' | 'counter'
}

export interface ComponentState {
  name: string
  state: any
  props?: any
  timestamp: number
}

export interface DebugStore {
  logs: LogEntry[]
  networkRequests: NetworkRequest[]
  performanceMetrics: PerformanceMetric[]
  componentStates: ComponentState[]
  isEnabled: boolean
  isVisible: boolean
  filters: {
    logLevel: LogEntry['level'][]
    showNetwork: boolean
    showPerformance: boolean
    showComponents: boolean
  }
}

export interface DebugPanelProps {
  position?: { x: number; y: number }
  onPositionChange?: (position: { x: number; y: number }) => void
  onClose?: () => void
}