import React, { useState, useMemo, useRef, useEffect } from 'react'
import useDebugStore from '../DebugStore'
import { LogEntry } from '../types'

const LogsTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [autoScroll, setAutoScroll] = useState(true)
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)
  
  const { 
    logs, 
    filters, 
    setLogFilter, 
    clearLogs 
  } = useDebugStore()

  // 过滤日志
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const levelMatch = filters.logLevel.includes(log.level)
      const searchMatch = searchTerm === '' || 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.source?.toLowerCase().includes(searchTerm.toLowerCase())
      
      return levelMatch && searchMatch
    })
  }, [logs, filters.logLevel, searchTerm])

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [filteredLogs, autoScroll])

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'debug': return 'text-gray-500'
      case 'info': return 'text-blue-600'
      case 'warn': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getLevelBg = (level: LogEntry['level']) => {
    switch (level) {
      case 'debug': return 'bg-gray-100'
      case 'info': return 'bg-primary-50 dark:bg-primary-900/20'
      case 'warn': return 'bg-yellow-50'
      case 'error': return 'bg-red-50'
      default: return 'bg-bg-secondary'
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit'
    })
    const ms = date.getMilliseconds().toString().padStart(3, '0')
    return `${timeStr}.${ms}`
  }

  const handleLevelToggle = (level: LogEntry['level']) => {
    const newLevels = filters.logLevel.includes(level)
      ? filters.logLevel.filter(l => l !== level)
      : [...filters.logLevel, level]
    setLogFilter(newLevels)
  }

  const exportLogs = () => {
    const data = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      logs: filteredLogs
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs-export-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full">
      {/* 控制面板 */}
      <div className="p-3 bg-bg-secondary border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="搜索日志..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <label className="flex items-center text-xs">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="mr-1"
              />
              自动滚动
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={exportLogs}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              导出
            </button>
            <button
              onClick={clearLogs}
              className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
            >
              清空
            </button>
          </div>
        </div>

        {/* 级别过滤器 */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">级别:</span>
          {(['debug', 'info', 'warn', 'error'] as const).map(level => (
            <label key={level} className="flex items-center text-xs">
              <input
                type="checkbox"
                checked={filters.logLevel.includes(level)}
                onChange={() => handleLevelToggle(level)}
                className="mr-1"
              />
              <span className={`capitalize ${getLevelColor(level)}`}>
                {level}
              </span>
              <span className="ml-1 text-gray-400">
                ({logs.filter(log => log.level === level).length})
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* 日志列表 */}
        <div className="flex-1 overflow-auto">
          <div className="divide-y divide-gray-100">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`p-2 hover:bg-bg-secondary cursor-pointer text-xs ${
                  selectedLog?.id === log.id ? 'bg-primary-50 dark:bg-primary-900/20 border-l-2 border-blue-500' : ''
                }`}
                onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
              >
                <div className="flex items-start space-x-2">
                  <span className="text-gray-400 font-mono-nerd text-xs whitespace-nowrap">
                    {formatTime(log.timestamp)}
                  </span>
                  <span className={`px-1 py-0.5 rounded text-xs font-medium uppercase ${getLevelBg(log.level)} ${getLevelColor(log.level)}`}>
                    {log.level}
                  </span>
                  {log.source && (
                    <span className="text-purple-600 text-xs font-medium">
                      [{log.source}]
                    </span>
                  )}
                  <span className="flex-1 text-gray-800 break-words">
                    {log.message}
                  </span>
                </div>
                
                {log.data && (
                  <div className="mt-1 ml-20 text-gray-600 text-xs font-mono-nerd">
                    Data: {typeof log.data === 'object' ? JSON.stringify(log.data) : String(log.data)}
                  </div>
                )}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
          
          {filteredLogs.length === 0 && (
            <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
              暂无日志显示
            </div>
          )}
        </div>

        {/* 详情面板 */}
        {selectedLog && (
          <div className="w-80 border-l border-gray-200 bg-bg-secondary overflow-auto">
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-800">日志详情</h4>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-gray-500 font-medium">时间戳:</label>
                  <div className="mt-1 font-mono-nerd">
                    {new Date(selectedLog.timestamp).toISOString()}
                  </div>
                </div>

                <div>
                  <label className="text-gray-500 font-medium">级别:</label>
                  <div className={`mt-1 ${getLevelColor(selectedLog.level)}`}>
                    {selectedLog.level.toUpperCase()}
                  </div>
                </div>

                {selectedLog.source && (
                  <div>
                    <label className="text-gray-500 font-medium">来源:</label>
                    <div className="mt-1 text-purple-600">{selectedLog.source}</div>
                  </div>
                )}

                <div>
                  <label className="text-gray-500 font-medium">消息:</label>
                  <div className="mt-1 break-words">{selectedLog.message}</div>
                </div>

                {selectedLog.data && (
                  <div>
                    <label className="text-gray-500 font-medium">数据:</label>
                    <pre className="mt-1 bg-bg-paper p-2 rounded border text-xs font-mono-nerd overflow-auto max-h-32">
                      {JSON.stringify(selectedLog.data, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.stack && (
                  <div>
                    <label className="text-gray-500 font-medium">调用栈:</label>
                    <pre className="mt-1 bg-bg-paper p-2 rounded border text-xs font-mono-nerd overflow-auto max-h-40 whitespace-pre-wrap">
                      {selectedLog.stack}
                    </pre>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2))
                  }}
                  className="w-full px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  复制 JSON
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LogsTab