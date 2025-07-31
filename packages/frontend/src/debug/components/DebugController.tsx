import React, { useState } from 'react'
import useDebugStore from '../DebugStore'

const DebugController: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const { 
    isEnabled, 
    isVisible, 
    setEnabled, 
    setVisible, 
    toggle,
    exportAllData,
    clearLogs,
    clearNetworkRequests,
    clearPerformanceMetrics,
    clearComponentStates,
    logs,
    networkRequests,
    performanceMetrics,
    componentStates
  } = useDebugStore()

  // 仅在开发环境显示
  if (!import.meta.env.DEV) {
    return null
  }

  const errorCount = logs.filter(log => log.level === 'error').length
  const warningCount = logs.filter(log => log.level === 'warn').length
  const failedRequests = networkRequests.filter(req => req.error || (req.status && req.status >= 400)).length

  const handleClearAll = () => {
    clearLogs()
    clearNetworkRequests()
    clearPerformanceMetrics()
    clearComponentStates()
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* 主控制按钮 */}
      <div className="relative">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-12 h-12 rounded-full shadow-lg border-2 transition-all duration-200 flex items-center justify-center text-lg ${
            isEnabled 
              ? 'bg-blue-500 border-blue-600 text-white hover:bg-blue-600' 
              : 'bg-gray-500 border-gray-600 text-white hover:bg-gray-600'
          }`}
          title="调试控制台"
        >
          🐛
        </button>

        {/* 状态指示器 */}
        {isEnabled && (
          <div className="absolute -top-1 -right-1 flex space-x-1">
            {errorCount > 0 && (
              <span className="w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {errorCount > 9 ? '9+' : errorCount}
              </span>
            )}
            {warningCount > 0 && errorCount === 0 && (
              <span className="w-4 h-4 bg-yellow-500 text-white text-xs rounded-full flex items-center justify-center">
                {warningCount > 9 ? '9+' : warningCount}
              </span>
            )}
            {failedRequests > 0 && errorCount === 0 && warningCount === 0 && (
              <span className="w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                {failedRequests > 9 ? '9+' : failedRequests}
              </span>
            )}
          </div>
        )}

        {/* 扩展面板 */}
        {isExpanded && (
          <div className="absolute bottom-14 right-0 bg-white rounded-lg shadow-xl border border-gray-200 p-3 min-w-64">
            <div className="text-sm font-medium text-gray-800 mb-3 flex items-center">
              🐛 调试控制台
              <span className="ml-auto text-xs text-gray-500">
                Ctrl+Shift+D
              </span>
            </div>

            {/* 开关控制 */}
            <div className="space-y-2 mb-3">
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="mr-2"
                />
                启用调试系统
              </label>
              
              {isEnabled && (
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={(e) => setVisible(e.target.checked)}
                    className="mr-2"
                  />
                  显示调试面板
                </label>
              )}
            </div>

            {/* 统计信息 */}
            {isEnabled && (
              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-gray-500">日志</div>
                  <div className="font-semibold">
                    {logs.length}
                    {errorCount > 0 && <span className="text-red-500 ml-1">({errorCount} 个错误)</span>}
                  </div>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-gray-500">网络</div>
                  <div className="font-semibold">
                    {networkRequests.length}
                    {failedRequests > 0 && <span className="text-red-500 ml-1">({failedRequests} 个失败)</span>}
                  </div>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-gray-500">性能</div>
                  <div className="font-semibold">{performanceMetrics.length}</div>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-gray-500">组件</div>
                  <div className="font-semibold">{componentStates.length}</div>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            {isEnabled && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={toggle}
                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    {isVisible ? '隐藏' : '显示'} 面板
                  </button>
                  <button
                    onClick={exportAllData}
                    className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    导出数据
                  </button>
                </div>
                <button
                  onClick={handleClearAll}
                  className="w-full px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                >
                  清空所有数据
                </button>
              </div>
            )}

            {/* 快捷键说明 */}
            <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-500">
              <div>快捷键:</div>
              <div>• Ctrl+Shift+D: 切换面板</div>
              <div>• Ctrl+Shift+E: 导出数据</div>
              <div>• Ctrl+Shift+C: 清空所有</div>
            </div>
          </div>
        )}
      </div>

      {/* 点击外部关闭 */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  )
}

export default DebugController