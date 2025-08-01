/**
 * MCP 配置管理 React Hook
 * 提供在 React 组件中使用 MCP 配置的便捷方法
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { mcpConfig, getMCPUrls, type MCPConfigType } from '../config/mcpConfig'

/**
 * MCP 配置状态接口
 */
interface MCPConfigState {
  config: ReturnType<typeof mcpConfig.getCurrentConfig>
  urls: ReturnType<typeof getMCPUrls>
  validation: ReturnType<typeof mcpConfig.validateConfig>
  isValid: boolean
}

/**
 * MCP 配置管理 Hook
 * @returns 配置状态和操作方法
 */
export const useMCPConfig = () => {
  // 配置状态
  const [configState, setConfigState] = useState<MCPConfigState>(() => ({
    config: mcpConfig.getCurrentConfig(),
    urls: getMCPUrls(),
    validation: mcpConfig.validateConfig(),
    isValid: mcpConfig.validateConfig().isValid
  }))

  /**
   * 更新配置状态
   */
  const updateConfigState = useCallback(() => {
    const config = mcpConfig.getCurrentConfig()
    const urls = getMCPUrls()
    const validation = mcpConfig.validateConfig()
    
    setConfigState({
      config,
      urls,
      validation,
      isValid: validation.isValid
    })
  }, [])

  /**
   * 更新配置
   * @param newConfig 新的配置项
   */
  const updateConfig = useCallback((newConfig: Partial<ReturnType<typeof mcpConfig.getCurrentConfig>>) => {
    mcpConfig.updateConfig(newConfig)
    updateConfigState()
  }, [updateConfigState])

  /**
   * 重置为默认配置
   */
  const resetToDefault = useCallback(() => {
    mcpConfig.resetToDefault()
    updateConfigState()
  }, [updateConfigState])

  /**
   * 验证配置
   */
  const validateConfig = useCallback(() => {
    const validation = mcpConfig.validateConfig()
    setConfigState(prev => ({
      ...prev,
      validation,
      isValid: validation.isValid
    }))
    return validation
  }, [])

  /**
   * 获取特定工具的 URL
   */
  const getToolUrl = useCallback((toolName: string) => {
    return mcpConfig.getMCPToolUrl(toolName)
  }, [])

  /**
   * 测试连接
   */
  const testConnection = useCallback(async () => {
    try {
      const response = await fetch(mcpConfig.getMCPPingUrl())
      return response.ok
    } catch (error) {
      console.error('连接测试失败:', error)
      return false
    }
  }, [])

  /**
   * 获取环境特定的配置建议
   */
  const getEnvironmentSuggestions = useMemo(() => {
    const isDev = import.meta.env.DEV
    const isProd = import.meta.env.PROD
    
    if (isDev) {
      return {
        environment: 'development',
        suggestions: [
          '开发环境建议使用 localhost',
          '确保后端服务器在端口 3001 运行',
          '确保 MCP HTTP 服务器在端口 3321 运行'
        ]
      }
    } else if (isProd) {
      return {
        environment: 'production',
        suggestions: [
          '生产环境建议使用域名或 IP 地址',
          '确保配置了正确的 CORS 策略',
          '建议启用 HTTPS'
        ]
      }
    }
    
    return {
      environment: 'unknown',
      suggestions: ['请检查环境配置']
    }
  }, [])

  // 监听环境变量变化（暂时禁用）
  useEffect(() => {
    // 暂时禁用配置变化监听，避免无限循环
    // if (import.meta.env.DEV) {
    //   const interval = setInterval(() => {
    //     const currentConfig = mcpConfig.getCurrentConfig()
    //     if (JSON.stringify(currentConfig) !== JSON.stringify(configState.config)) {
    //       updateConfigState()
    //     }
    //   }, 30000)
    //   return () => clearInterval(interval)
    // }
  }, [])

  return {
    // 状态
    config: configState.config,
    urls: configState.urls,
    validation: configState.validation,
    isValid: configState.isValid,
    environmentSuggestions: getEnvironmentSuggestions,
    
    // 操作方法
    updateConfig,
    resetToDefault,
    validateConfig,
    getToolUrl,
    testConnection,
    
    // 便捷方法
    refresh: updateConfigState
  }
}

/**
 * 简化的 MCP URLs Hook
 * 只返回 URLs，适用于只需要获取地址的场景
 */
export const useMCPUrls = () => {
  const [urls, setUrls] = useState(() => getMCPUrls())
  
  const refresh = useCallback(() => {
    setUrls(getMCPUrls())
  }, [])
  
  useEffect(() => {
    // 暂时禁用配置变化监听
    // const interval = setInterval(refresh, 60000)
    // return () => clearInterval(interval)
  }, [])
  
  return {
    urls,
    refresh
  }
}

/**
 * MCP 连接状态 Hook
 * 监控 MCP 服务器的连接状态
 */
export const useMCPConnection = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  
  const checkConnection = useCallback(async () => {
    if (isChecking) return
    
    setIsChecking(true)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(mcpConfig.getMCPPingUrl(), {
        method: 'GET',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      const connected = response.ok
      setIsConnected(connected)
      setLastChecked(new Date())
      return connected
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.warn('MCP连接检查失败:', error)
      }
      setIsConnected(false)
      setLastChecked(new Date())
      return false
    } finally {
      setIsChecking(false)
    }
  }, [isChecking])
  
  // 自动检查连接状态 (暂时禁用避免无限循环)
  useEffect(() => {
    checkConnection() // 只执行一次初始检查
    
    // 暂时禁用定时器
    // const interval = setInterval(checkConnection, 60000)
    // return () => clearInterval(interval)
  }, []) // 移除checkConnection依赖，避免无限循环
  
  return {
    isConnected,
    lastChecked,
    isChecking,
    checkConnection
  }
}

/**
 * MCP 配置表单 Hook
 * 提供表单状态管理和验证
 */
export const useMCPConfigForm = () => {
  const { config, updateConfig, validateConfig, resetToDefault } = useMCPConfig()
  const [formData, setFormData] = useState(config)
  const [isDirty, setIsDirty] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  
  /**
   * 更新表单数据
   */
  const updateFormData = useCallback((field: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      setIsDirty(JSON.stringify(newData) !== JSON.stringify(config))
      return newData
    })
  }, [config])
  
  /**
   * 验证表单
   */
  const validateForm = useCallback(() => {
    // 临时更新配置进行验证
    const originalConfig = mcpConfig.getCurrentConfig()
    mcpConfig.updateConfig(formData)
    const validation = mcpConfig.validateConfig()
    mcpConfig.updateConfig(originalConfig) // 恢复原配置
    
    setErrors(validation.errors)
    return validation.isValid
  }, [formData])
  
  /**
   * 提交表单
   */
  const submitForm = useCallback(() => {
    if (validateForm()) {
      updateConfig(formData)
      setIsDirty(false)
      return true
    }
    return false
  }, [formData, updateConfig, validateForm])
  
  /**
   * 重置表单
   */
  const resetForm = useCallback(() => {
    setFormData(config)
    setIsDirty(false)
    setErrors([])
  }, [config])
  
  /**
   * 重置为默认值
   */
  const resetToDefaultForm = useCallback(() => {
    resetToDefault()
    setFormData(mcpConfig.getCurrentConfig())
    setIsDirty(false)
    setErrors([])
  }, [resetToDefault])
  
  // 同步配置变化
  useEffect(() => {
    if (!isDirty) {
      setFormData(config)
    }
  }, [config, isDirty])
  
  return {
    formData,
    isDirty,
    errors,
    isValid: errors.length === 0,
    
    updateFormData,
    validateForm,
    submitForm,
    resetForm,
    resetToDefaultForm
  }
}

export default useMCPConfig