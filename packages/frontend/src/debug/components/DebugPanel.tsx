import React, { useEffect, useMemo, useState } from 'react'
import useDebugStore from '../DebugStore'
import ComponentsTab from './ComponentsTab'
import DraggableWindow from './DraggableWindow'
import LogsTab from './LogsTab'
import NetworkTab from './NetworkTab'
import PerformanceTab from './PerformanceTab'

type TabType = 'logs' | 'network' | 'performance' | 'components'

const DebugPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('logs')
  const [position, setPosition] = useState({ x: 100, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const {
    isVisible,
    setVisible,
    logs,
    networkRequests,
    performanceMetrics,
    componentStates,
    clearLogs,
    clearNetworkRequests,
    clearPerformanceMetrics,
    clearComponentStates,
    exportAllData,
    viewServerLogs,
  } = useDebugStore()

  // 计算各种统计信息
  const stats = useMemo(() => {
    const errorLogs = logs.filter(log => log.level === 'error').length
    const warnLogs = logs.filter(log => log.level === 'warn').length
    const failedRequests = networkRequests.filter(
      req => req.error || (req.status && req.status >= 400)
    ).length

    return {
      totalLogs: logs.length,
      errorLogs,
      warnLogs,
      totalRequests: networkRequests.length,
      failedRequests,
      totalMetrics: performanceMetrics.length,
      totalComponents: componentStates.length,
    }
  }, [logs, networkRequests, performanceMetrics, componentStates])

  /**
   * 处理拖拽过程中的鼠标移动和释放事件
   */
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newPosition = {
          x: Math.max(0, Math.min(window.innerWidth - 200, e.clientX - dragOffset.x)),
          y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.y)),
        }
        setPosition(newPosition)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = 'none'
    } else {
      document.body.style.userSelect = ''
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
    }
  }, [isDragging, dragOffset, position])

  if (!isVisible) return null

  const tabs = [
    {
      id: 'logs',
      label: '日志',
      count: stats.totalLogs,
      badge: stats.errorLogs > 0 ? stats.errorLogs : undefined,
      badgeColor: 'bg-red-500',
    },
    {
      id: 'network',
      label: '网络',
      count: stats.totalRequests,
      badge: stats.failedRequests > 0 ? stats.failedRequests : undefined,
      badgeColor: 'bg-red-500',
    },
    {
      id: 'performance',
      label: '性能',
      count: stats.totalMetrics,
    },
    {
      id: 'components',
      label: '组件',
      count: stats.totalComponents,
    },
  ]

  const handleClearAll = () => {
    clearLogs()
    clearNetworkRequests()
    clearPerformanceMetrics()
    clearComponentStates()
  }

  /**
   * 处理工具栏拖拽开始
   * @param e - 鼠标事件
   */
  const handleToolbarMouseDown = (e: React.MouseEvent) => {
    // 如果点击的是按钮或按钮内的元素，不触发拖拽
    if (
      (e.target as HTMLElement).tagName === 'BUTTON' ||
      (e.target as HTMLElement).closest('button')
    ) {
      return
    }

    setIsDragging(true)
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }
  return (
    <DraggableWindow
      title="DevAPI Manager Debug Console"
      position={position}
      onPositionChange={setPosition}
      onClose={() => setVisible(false)}
      defaultWidth={900}
      defaultHeight={700}
      className="debug-panel text-sm"
    >
      <div className="flex flex-col h-full">
        {/* 工具栏 - 支持拖拽 */}
        <div
          className={`bg-bg-secondary border-b border-gray-200 px-4 py-2 flex items-center justify-between cursor-move select-none ${
            isDragging ? 'bg-gray-300' : ''
          }`}
          onMouseDown={handleToolbarMouseDown}
        >
          <div className="flex items-center space-x-4 pointer-events-none">
            <div className="text-xs text-gray-500">🐛 Debug Console</div>
            <div className="text-xs text-gray-400">
              Ctrl+Shift+D: Toggle | Ctrl+Shift+E: Export | Ctrl+Shift+C: Clear
            </div>
          </div>

          <div className="flex items-center space-x-2 pointer-events-auto">
            <button
              onClick={viewServerLogs}
              className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 cursor-pointer"
              title="查看服务器保存的日志"
            >
              服务器日志
            </button>
            <button
              onClick={exportAllData}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer"
            >
              导出
            </button>
            <button
              onClick={handleClearAll}
              className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 cursor-pointer"
            >
              清空全部
            </button>
          </div>
        </div>

        {/* 标签页导航 */}
        <div className="bg-bg-paper border-b border-gray-200">
          <div className="flex">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors relative ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-text-primary hover:border-gray-300 bg-bg-secondary'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && <span className="ml-1 text-xs text-gray-400">({tab.count})</span>}
                {tab.badge && tab.badge > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 min-w-5 h-5 text-xs text-white rounded-full flex items-center justify-center ${tab.badgeColor}`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 标签页内容 */}
        <div className="flex-1 overflow-hidden custom-scrollbar">
          {activeTab === 'logs' && <LogsTab />}
          {activeTab === 'network' && <NetworkTab />}
          {activeTab === 'performance' && <PerformanceTab />}
          {activeTab === 'components' && <ComponentsTab />}
        </div>

        {/* 状态栏 */}
        <div className="bg-bg-secondary border-t border-gray-200 px-4 py-1 text-xs text-gray-500 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span>日志: {stats.totalLogs}</span>
            <span>网络: {stats.totalRequests}</span>
            <span>性能: {stats.totalMetrics}</span>
            <span>组件: {stats.totalComponents}</span>
          </div>

          <div className="flex items-center space-x-2">
            {stats.errorLogs > 0 && (
              <span className="text-red-500">⚠ {stats.errorLogs} 个错误</span>
            )}
            {stats.failedRequests > 0 && (
              <span className="text-red-500">⚠ {stats.failedRequests} 个失败请求</span>
            )}
            <span className="text-gray-400">{new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </DraggableWindow>
  )
}

export default DebugPanel
