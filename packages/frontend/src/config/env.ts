/**
 * 环境配置管理
 * 统一管理所有环境变量和配置常量，避免硬编码
 */

// 默认端口配置
export const DEFAULT_PORTS = {
  // 后端API服务器
  BACKEND: 3001,
  // MCP HTTP服务器（集成在后端中）
  MCP_HTTP: 3001,
  // MCP WebSocket服务器
  MCP_WS: 3001,
  // 独立MCP服务器（开发环境）
  MCP_STANDALONE: 3004,
  // 前端开发服务器
  FRONTEND: 5173,
} as const

// 默认主机配置
export const DEFAULT_HOSTS = {
  LOCALHOST: 'localhost',
  DEV_SERVER: '127.0.0.1',
} as const

// 环境变量获取器
export const getEnvVar = (key: string, defaultValue?: string): string => {
  return import.meta.env[key] || defaultValue || ''
}

// 环境配置
export const ENV_CONFIG = {
  // 开发环境标识
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  
  // 后端配置
  backend: {
    host: getEnvVar('VITE_BACKEND_HOST', DEFAULT_HOSTS.LOCALHOST),
    port: parseInt(getEnvVar('VITE_BACKEND_PORT', DEFAULT_PORTS.BACKEND.toString())),
    url: getEnvVar('VITE_API_URL'), // 如果设置了完整URL，优先使用
  },
  
  // MCP配置
  mcp: {
    http: {
      host: getEnvVar('VITE_MCP_HTTP_HOST', DEFAULT_HOSTS.LOCALHOST),
      port: parseInt(getEnvVar('VITE_MCP_HTTP_PORT', DEFAULT_PORTS.MCP_HTTP.toString())),
    },
    ws: {
      host: getEnvVar('VITE_MCP_WS_HOST', DEFAULT_HOSTS.LOCALHOST),
      port: parseInt(getEnvVar('VITE_MCP_WS_PORT', DEFAULT_PORTS.MCP_WS.toString())),
    },
  },
} as const

// URL生成器
export const createUrl = (protocol: 'http' | 'https' | 'ws' | 'wss', host: string, port: number, path?: string): string => {
  const baseUrl = `${protocol}://${host}:${port}`
  return path ? `${baseUrl}${path.startsWith('/') ? path : `/${path}`}` : baseUrl
}

// 获取后端基础URL
export const getBackendBaseUrl = (): string => {
  if (ENV_CONFIG.backend.url) {
    return ENV_CONFIG.backend.url
  }
  return createUrl('http', ENV_CONFIG.backend.host, ENV_CONFIG.backend.port, '/api/v1')
}

// 获取MCP HTTP URL
export const getMCPHttpUrl = (): string => {
  return createUrl('http', ENV_CONFIG.mcp.http.host, ENV_CONFIG.mcp.http.port)
}

// 获取MCP WebSocket URL
export const getMCPWebSocketUrl = (): string => {
  return createUrl('ws', ENV_CONFIG.mcp.ws.host, ENV_CONFIG.mcp.ws.port)
}

// 验证端口号是否有效
export const isValidPort = (port: number): boolean => {
  return Number.isInteger(port) && port >= 1 && port <= 65535
}

// 验证主机名是否有效
export const isValidHost = (host: string): boolean => {
  return typeof host === 'string' && host.trim().length > 0
}

// 配置验证
export const validateConfig = () => {
  const errors: string[] = []
  
  if (!isValidHost(ENV_CONFIG.backend.host)) {
    errors.push('后端主机名无效')
  }
  
  if (!isValidPort(ENV_CONFIG.backend.port)) {
    errors.push(`后端端口号无效: ${ENV_CONFIG.backend.port}`)
  }
  
  if (!isValidHost(ENV_CONFIG.mcp.http.host)) {
    errors.push('MCP HTTP主机名无效')
  }
  
  if (!isValidPort(ENV_CONFIG.mcp.http.port)) {
    errors.push(`MCP HTTP端口号无效: ${ENV_CONFIG.mcp.http.port}`)
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    config: ENV_CONFIG,
  }
}

// 调试信息
export const getDebugInfo = () => {
  return {
    environment: {
      isDev: ENV_CONFIG.isDev,
      isProd: ENV_CONFIG.isProd,
    },
    urls: {
      backend: getBackendBaseUrl(),
      mcpHttp: getMCPHttpUrl(),
      mcpWebSocket: getMCPWebSocketUrl(),
    },
    config: ENV_CONFIG,
    validation: validateConfig(),
  }
}

// 开发环境下输出调试信息
if (ENV_CONFIG.isDev) {
  console.log('🔧 环境配置信息:', getDebugInfo())
}