// 调试系统的主要导出
export { default as DebugPanel } from './components/DebugPanel'
export { default as DebugController } from './components/DebugController'
export { default as useDebugStore } from './DebugStore'
export { logger } from './Logger'
export { networkMonitor } from './NetworkMonitor'
export { performanceMonitor } from './PerformanceMonitor'

// 类型导出
export type {
  LogEntry,
  NetworkRequest,
  PerformanceMetric,
  ComponentState,
  DebugStore,
  DebugPanelProps
} from './types'

// 重新导出调试工具
export { debug, initDebugSystem } from './debugUtils'

// React Hook 用于组件状态记录
import React, { useEffect, useRef } from 'react'
import { debug } from './debugUtils'

export const useDebugComponent = (name: string, state: any, props?: any) => {
  const prevStateRef = useRef(state)
  const prevPropsRef = useRef(props)
  
  useEffect(() => {
    // 只在状态或props实际改变时记录
    if (JSON.stringify(prevStateRef.current) !== JSON.stringify(state) ||
        JSON.stringify(prevPropsRef.current) !== JSON.stringify(props)) {
      
      debug.recordComponent(name, state, props)
      prevStateRef.current = state
      prevPropsRef.current = props
    }
  }, [name, state, props])
}

// 高阶组件用于自动记录组件状态
export const withDebug = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) => {
  const DebugWrapper = React.forwardRef<any, P>((props, ref) => {
    const name = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component'
    
    useEffect(() => {
      debug.recordComponent(name, {}, props)
    }, [name, props])
    
    return React.createElement(WrappedComponent, { ...props as any, ref })
  })
  
  DebugWrapper.displayName = `withDebug(${componentName || WrappedComponent.displayName || WrappedComponent.name})`
  return DebugWrapper
}

// 装饰器用于类组件
export const debugComponent = (name?: string) => {
  return <T extends { new(...args: any[]): React.Component }>(constructor: T) => {
    return class extends constructor {
      componentDidMount() {
        const componentName = name || constructor.name
        debug.recordComponent(componentName, this.state, this.props)
        
        if (super.componentDidMount) {
          super.componentDidMount()
        }
      }
      
      componentDidUpdate(prevProps?: any, prevState?: any) {
        const componentName = name || constructor.name
        debug.recordComponent(componentName, this.state, this.props)
        
        if (super.componentDidUpdate) {
          super.componentDidUpdate(prevProps, prevState)
        }
      }
    }
  }
}