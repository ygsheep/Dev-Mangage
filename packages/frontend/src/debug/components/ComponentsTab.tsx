import React, { useState, useMemo } from 'react'
import useDebugStore from '../DebugStore'
import { ComponentState } from '../types'

const ComponentsTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedComponent, setSelectedComponent] = useState<ComponentState | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'timestamp'>('timestamp')
  
  const { 
    componentStates, 
    clearComponentStates 
  } = useDebugStore()

  // 过滤和排序组件状态
  const filteredComponents = useMemo(() => {
    let filtered = componentStates.filter(component => {
      return searchTerm === '' || 
        component.name.toLowerCase().includes(searchTerm.toLowerCase())
    })

    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      }
      return b.timestamp - a.timestamp
    })

    return filtered
  }, [componentStates, searchTerm, sortBy])

  // 按组件名称分组
  const componentsByName = useMemo(() => {
    const groups: Record<string, ComponentState[]> = {}
    filteredComponents.forEach(component => {
      if (!groups[component.name]) {
        groups[component.name] = []
      }
      groups[component.name].push(component)
    })
    
    // 每组按时间排序，最新的在前
    Object.keys(groups).forEach(name => {
      groups[name].sort((a, b) => b.timestamp - a.timestamp)
    })
    
    return groups
  }, [filteredComponents])

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit'
    })
  }

  const formatStateSize = (state: any): string => {
    const str = JSON.stringify(state)
    const bytes = new Blob([str]).size
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  const getStateComplexity = (state: any): 'simple' | 'medium' | 'complex' => {
    if (!state || typeof state !== 'object') return 'simple'
    
    const keys = Object.keys(state)
    if (keys.length <= 3) return 'simple'
    if (keys.length <= 10) return 'medium'
    return 'complex'
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'text-green-600 bg-green-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'complex': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const exportComponents = () => {
    const data = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      components: filteredComponents
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `component-states-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const renderValue = (value: any, maxDepth = 2, currentDepth = 0): React.ReactNode => {
    if (currentDepth >= maxDepth) {
      return <span className="text-gray-400">...</span>
    }

    if (value === null) return <span className="text-gray-500">null</span>
    if (value === undefined) return <span className="text-gray-500">undefined</span>
    if (typeof value === 'boolean') return <span className="text-blue-600">{String(value)}</span>
    if (typeof value === 'number') return <span className="text-purple-600">{value}</span>
    if (typeof value === 'string') return <span className="text-green-600">"{value}"</span>
    
    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="text-gray-500">[]</span>
      return (
        <span>
          [
          {value.slice(0, 3).map((item, index) => (
            <span key={index}>
              {index > 0 && ', '}
              {renderValue(item, maxDepth, currentDepth + 1)}
            </span>
          ))}
          {value.length > 3 && <span className="text-gray-400">... +{value.length - 3}</span>}
          ]
        </span>
      )
    }
    
    if (typeof value === 'object') {
      const keys = Object.keys(value)
      if (keys.length === 0) return <span className="text-gray-500">{'{}'}</span>
      return (
        <span>
          {'{'}
          {keys.slice(0, 3).map((key, index) => (
            <span key={key}>
              {index > 0 && ', '}
              <span className="text-orange-600">{key}</span>: {renderValue(value[key], maxDepth, currentDepth + 1)}
            </span>
          ))}
          {keys.length > 3 && <span className="text-gray-400">... +{keys.length - 3}</span>}
          {'}'}
        </span>
      )
    }
    
    return <span>{String(value)}</span>
  }

  return (
    <div className="flex flex-col h-full">
      {/* 控制面板 */}
      <div className="p-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="搜索组件..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="timestamp">按时间排序</option>
              <option value="name">按名称排序</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={exportComponents}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              导出
            </button>
            <button
              onClick={clearComponentStates}
              className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
            >
              清空
            </button>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <span>总计: {componentStates.length}</span>
          <span>唯一: {Object.keys(componentsByName).length}</span>
          <span>简单: {componentStates.filter(c => getStateComplexity(c.state) === 'simple').length}</span>
          <span>中等: {componentStates.filter(c => getStateComplexity(c.state) === 'medium').length}</span>
          <span>复杂: {componentStates.filter(c => getStateComplexity(c.state) === 'complex').length}</span>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* 组件列表 */}
        <div className="flex-1 overflow-auto">
          <div className="divide-y divide-gray-100">
            {Object.entries(componentsByName).map(([name, states]) => (
              <div key={name} className="p-2">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm font-medium text-gray-700 flex items-center">
                    <span className="text-blue-600 mr-2">📦</span>
                    {name}
                    <span className="ml-2 text-xs text-gray-400">({states.length} 个状态)</span>
                  </h5>
                  <div className="flex items-center space-x-1">
                    {states.slice(0, 3).map(state => {
                      const complexity = getStateComplexity(state.state)
                      return (
                        <span key={state.timestamp} className={`px-1 py-0.5 rounded text-xs ${getComplexityColor(complexity)}`}>
                          {complexity}
                        </span>
                      )
                    })}
                  </div>
                </div>

                {/* 最新状态预览 */}
                <div className="mb-2 p-2 bg-gray-50 rounded text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-500">最新状态:</span>
                    <span className="text-gray-400">{formatTime(states[0].timestamp)}</span>
                  </div>
                  <div className="font-mono-nerd text-xs overflow-hidden">
                    {renderValue(states[0].state, 1)}
                  </div>
                </div>

                {/* 状态历史 */}
                <div className="space-y-1">
                  {states.slice(0, 5).map((state) => (
                    <div
                      key={state.timestamp}
                      className={`p-2 hover:bg-gray-50 cursor-pointer text-xs rounded border ${
                        selectedComponent?.timestamp === state.timestamp && selectedComponent?.name === state.name 
                          ? 'bg-blue-50 border-blue-200' : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedComponent(
                        selectedComponent?.timestamp === state.timestamp && selectedComponent?.name === state.name 
                          ? null : state
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`px-1 py-0.5 rounded text-xs ${getComplexityColor(getStateComplexity(state.state))}`}>
                            {getStateComplexity(state.state)}
                          </span>
                          <span className="text-gray-500">{formatStateSize(state.state)}</span>
                        </div>
                        <span className="text-gray-400 font-mono-nerd">{formatTime(state.timestamp)}</span>
                      </div>
                      
                      {state.props && (
                        <div className="mt-1 text-gray-600">
                          属性: {renderValue(state.props, 1)}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {states.length > 5 && (
                    <div className="text-center text-xs text-gray-400 py-1">
                      ... 还有 {states.length - 5} 个状态
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {filteredComponents.length === 0 && (
            <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
              暂无组件状态显示
            </div>
          )}
        </div>

        {/* 详情面板 */}
        {selectedComponent && (
          <div className="w-96 border-l border-gray-200 bg-gray-50 overflow-auto">
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-800">组件详情</h4>
                <button
                  onClick={() => setSelectedComponent(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-gray-500 font-medium">组件名称:</label>
                  <div className="mt-1 font-semibold text-blue-600">{selectedComponent.name}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-500 font-medium">复杂度:</label>
                    <div className={`mt-1 px-2 py-1 rounded text-center ${getComplexityColor(getStateComplexity(selectedComponent.state))}`}>
                      {getStateComplexity(selectedComponent.state).toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-500 font-medium">大小:</label>
                    <div className="mt-1 text-center font-semibold">
                      {formatStateSize(selectedComponent.state)}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-gray-500 font-medium">时间戳:</label>
                  <div className="mt-1 font-mono-nerd">
                    {new Date(selectedComponent.timestamp).toISOString()}
                  </div>
                </div>

                <div>
                  <label className="text-gray-500 font-medium">状态:</label>
                  <pre className="mt-1 bg-bg-paper p-2 rounded border text-xs font-mono-nerd overflow-auto max-h-40">
                    {JSON.stringify(selectedComponent.state, null, 2)}
                  </pre>
                </div>

                {selectedComponent.props && (
                  <div>
                    <label className="text-gray-500 font-medium">属性:</label>
                    <pre className="mt-1 bg-bg-paper p-2 rounded border text-xs font-mono-nerd overflow-auto max-h-40">
                      {JSON.stringify(selectedComponent.props, null, 2)}
                    </pre>
                  </div>
                )}

                {/* 相同组件的历史状态 */}
                {componentsByName[selectedComponent.name] && componentsByName[selectedComponent.name].length > 1 && (
                  <div>
                    <label className="text-gray-500 font-medium">历史 ({componentsByName[selectedComponent.name].length} 个状态):</label>
                    <div className="mt-1 space-y-1 max-h-32 overflow-auto">
                      {componentsByName[selectedComponent.name].slice(0, 10).map((state) => (
                        <div 
                          key={state.timestamp} 
                          className={`flex justify-between text-xs font-mono-nerd bg-bg-paper p-1 rounded cursor-pointer hover:bg-blue-50 ${
                            state.timestamp === selectedComponent.timestamp ? 'bg-blue-100' : ''
                          }`}
                          onClick={() => setSelectedComponent(state)}
                        >
                          <span className={`px-1 rounded ${getComplexityColor(getStateComplexity(state.state))}`}>
                            {getStateComplexity(state.state)}
                          </span>
                          <span className="text-gray-400">{formatTime(state.timestamp)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200 space-y-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(selectedComponent, null, 2))
                  }}
                  className="w-full px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  复制 JSON
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(selectedComponent.state, null, 2))
                  }}
                  className="w-full px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                >
                  仅复制状态
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ComponentsTab