import { NetworkRequest } from './types'

class NetworkMonitor {
  private static instance: NetworkMonitor
  private listeners: ((request: NetworkRequest) => void)[] = []
  private requests: Map<string, NetworkRequest> = new Map()

  private constructor() {}

  static getInstance(): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor()
    }
    return NetworkMonitor.instance
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private emit(request: NetworkRequest) {
    this.listeners.forEach(listener => listener(request))
  }

  // 监控fetch请求
  interceptFetch() {
    const originalFetch = window.fetch

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const id = this.generateId()
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const method = init?.method || 'GET'
      const startTime = performance.now()

      const request: NetworkRequest = {
        id,
        timestamp: Date.now(),
        method,
        url,
        requestData: init?.body ? this.tryParseJson(init.body) : undefined
      }

      this.requests.set(id, request)
      this.emit(request)

      try {
        const response = await originalFetch(input, init)
        const endTime = performance.now()
        const duration = endTime - startTime

        let responseData
        try {
          const clonedResponse = response.clone()
          const text = await clonedResponse.text()
          responseData = this.tryParseJson(text)
        } catch (e) {
          responseData = 'Unable to parse response'
        }

        const updatedRequest: NetworkRequest = {
          ...request,
          status: response.status,
          duration,
          responseData
        }

        this.requests.set(id, updatedRequest)
        this.emit(updatedRequest)

        return response
      } catch (error) {
        const endTime = performance.now()
        const duration = endTime - startTime

        const updatedRequest: NetworkRequest = {
          ...request,
          duration,
          error: error instanceof Error ? error.message : String(error)
        }

        this.requests.set(id, updatedRequest)
        this.emit(updatedRequest)

        throw error
      }
    }
  }

  // 监控XMLHttpRequest
  interceptXHR() {
    const originalXHR = window.XMLHttpRequest
    const self = this

    window.XMLHttpRequest = function() {
      const xhr = new originalXHR()
      const id = self.generateId()
      let startTime: number
      let method: string
      let url: string

      const originalOpen = xhr.open
      const originalSend = xhr.send

      xhr.open = function(m: string, u: string | URL, async: boolean = true, username?: string | null, password?: string | null) {
        method = m
        url = typeof u === 'string' ? u : u.href
        return originalOpen.apply(this, [m, u, async, username, password])
      }

      xhr.send = function(data?: any) {
        startTime = performance.now()

        const request: NetworkRequest = {
          id,
          timestamp: Date.now(),
          method,
          url,
          requestData: data ? self.tryParseJson(data) : undefined
        }

        self.requests.set(id, request)
        self.emit(request)

        return originalSend.apply(this, [data])
      }

      xhr.addEventListener('loadend', () => {
        const endTime = performance.now()
        const duration = startTime ? endTime - startTime : 0
        
        const existingRequest = self.requests.get(id)
        if (existingRequest) {
          const updatedRequest: NetworkRequest = {
            ...existingRequest,
            status: xhr.status,
            duration,
            responseData: self.tryParseJson(xhr.responseText),
            error: xhr.status >= 400 ? `HTTP ${xhr.status}` : undefined
          }

          self.requests.set(id, updatedRequest)
          self.emit(updatedRequest)
        }
      })

      return xhr
    } as any
  }

  private tryParseJson(data: any): any {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data)
      } catch {
        return data
      }
    }
    return data
  }

  onRequest(listener: (request: NetworkRequest) => void) {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  getRequests(): NetworkRequest[] {
    return Array.from(this.requests.values())
  }

  clearRequests() {
    this.requests.clear()
  }
}

export const networkMonitor = NetworkMonitor.getInstance()