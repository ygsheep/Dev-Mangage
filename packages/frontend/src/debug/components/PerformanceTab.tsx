import React, { useState, useMemo } from 'react'
import useDebugStore from '../DebugStore'
import { PerformanceMetric } from '../types'

const PerformanceTab: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState<PerformanceMetric | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'memory' | 'timing' | 'counter'>('all')
  const [timeRange, setTimeRange] = useState<'5m' | '15m' | '1h' | 'all'>('15m')
  
  const { 
    performanceMetrics, 
    clearPerformanceMetrics 
  } = useDebugStore()

  // 过滤指标
  const filteredMetrics = useMemo(() => {
    const now = Date.now()
    const timeRanges = {
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      'all': Infinity
    } as const

    return performanceMetrics.filter(metric => {
      const typeMatch = filterType === 'all' || metric.type === filterType
      const timeMatch = timeRange === 'all' || (now - metric.timestamp <= timeRanges[timeRange])
      
      return typeMatch && timeMatch
    }).sort((a, b) => b.timestamp - a.timestamp)
  }, [performanceMetrics, filterType, timeRange])

  // 计算统计信息
  const stats = useMemo(() => {
    const memoryMetrics = filteredMetrics.filter(m => m.type === 'memory')
    const timingMetrics = filteredMetrics.filter(m => m.type === 'timing')
    const counterMetrics = filteredMetrics.filter(m => m.type === 'counter')

    const currentMemory = memoryMetrics.find(m => m.name === 'Memory Used')
    const avgTiming = timingMetrics.length > 0 
      ? timingMetrics.reduce((sum, m) => sum + m.value, 0) / timingMetrics.length 
      : 0

    return {
      total: filteredMetrics.length,
      memory: memoryMetrics.length,
      timing: timingMetrics.length,
      counter: counterMetrics.length,
      currentMemory: currentMemory?.value || 0,
      avgTiming
    }
  }, [filteredMetrics])

  const getTypeColor = (type: PerformanceMetric['type']) => {
    switch (type) {
      case 'memory': return 'text-purple-600 bg-purple-50'
      case 'timing': return 'text-green-600 bg-green-50'
      case 'counter': return 'text-blue-600 bg-blue-50'
      default: return 'text-text-secondary bg-gray-50'
    }
  }

  const formatValue = (value: number, unit: string) => {
    if (unit === 'ms' && value >= 1000) {
      return `${(value / 1000).toFixed(2)}s`
    }
    if (unit === 'MB' && value >= 1024) {
      return `${(value / 1024).toFixed(2)}GB`
    }
    return `${value.toFixed(2)}${unit}`
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit'
    })
  }

  const exportMetrics = () => {
    const data = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      metrics: filteredMetrics,
      stats
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-metrics-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 按名称分组的指标用于图表显示
  const metricsByName = useMemo(() => {
    const groups: Record<string, PerformanceMetric[]> = {}
    filteredMetrics.forEach(metric => {
      if (!groups[metric.name]) {
        groups[metric.name] = []
      }
      groups[metric.name].push(metric)
    })
    
    // 每组只保留最近的10个数据点
    Object.keys(groups).forEach(name => {
      groups[name] = groups[name].slice(0, 10).reverse()
    })
    
    return groups
  }, [filteredMetrics])

  return (
    <div className="flex flex-col h-full">
      {/* 控制面板 */}
      <div className="p-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">所有类型</option>
              <option value="memory">内存</option>
              <option value="timing">计时</option>
              <option value="counter">计数器</option>
            </select>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="5m">近5分钟</option>
              <option value="15m">近15分钟</option>
              <option value="1h">近1小时</option>
              <option value="all">所有时间</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={exportMetrics}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              导出
            </button>
            <button
              onClick={clearPerformanceMetrics}
              className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
            >
              清空
            </button>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-5 gap-4 text-xs">
          <div className="bg-bg-paper p-2 rounded border">
            <div className="text-gray-500">总计</div>
            <div className="text-lg font-semibold text-gray-800">{stats.total}</div>
          </div>
          <div className="bg-purple-50 p-2 rounded border">
            <div className="text-purple-600">内存</div>
            <div className="text-lg font-semibold text-purple-800">{stats.currentMemory.toFixed(1)}MB</div>
          </div>
          <div className="bg-green-50 p-2 rounded border">
            <div className="text-green-600">平均耗时</div>
            <div className="text-lg font-semibold text-green-800">{stats.avgTiming.toFixed(1)}ms</div>
          </div>
          <div className="bg-blue-50 p-2 rounded border">
            <div className="text-blue-600">计数器</div>
            <div className="text-lg font-semibold text-blue-800">{stats.counter}</div>
          </div>
          <div className="bg-gray-50 p-2 rounded border">
            <div className="text-text-secondary">唯一</div>
            <div className="text-lg font-semibold text-gray-800">{Object.keys(metricsByName).length}</div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* 指标列表 */}
        <div className="flex-1 overflow-auto">
          {/* 分组显示 */}
          <div className="divide-y divide-gray-100">
            {Object.entries(metricsByName).map(([name, metrics]) => (
              <div key={name} className="p-2">
                <h5 className="text-xs font-medium text-gray-700 mb-2 flex items-center">
                  <span className={`px-1 py-0.5 rounded text-xs mr-2 ${getTypeColor(metrics[0].type)}`}>
                    {metrics[0].type.toUpperCase()}
                  </span>
                  {name}
                  <span className="ml-auto text-gray-400">({metrics.length} 个数据点)</span>
                </h5>
                
                {/* 简单的迷你图表 */}
                <div className="h-8 bg-gray-100 rounded mb-2 relative overflow-hidden">
                  {metrics.length > 1 && (
                    <div className="h-full flex items-end">
                      {metrics.map((metric) => {
                        const maxValue = Math.max(...metrics.map(m => m.value))
                        const height = maxValue > 0 ? (metric.value / maxValue) * 100 : 0
                        return (
                          <div
                            key={metric.id}
                            className="flex-1 bg-blue-400 mx-px rounded-sm"
                            style={{ height: `${height}%` }}
                            title={`${formatValue(metric.value, metric.unit)} at ${formatTime(metric.timestamp)}`}
                          />
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* 最新值 */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary">
                    最新: <span className="font-semibold">{formatValue(metrics[metrics.length - 1].value, metrics[metrics.length - 1].unit)}</span>
                  </span>
                  <span className="text-gray-400">
                    {formatTime(metrics[metrics.length - 1].timestamp)}
                  </span>
                </div>

                {/* 详细数据点 */}
                <div className="mt-2 space-y-1">
                  {metrics.slice(-3).map((metric) => (
                    <div
                      key={metric.id}
                      className={`p-1 hover:bg-gray-50 cursor-pointer text-xs rounded ${
                        selectedMetric?.id === metric.id ? 'bg-blue-50 border border-blue-200' : ''
                      }`}
                      onClick={() => setSelectedMetric(selectedMetric?.id === metric.id ? null : metric)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono-nerd">{formatValue(metric.value, metric.unit)}</span>
                        <span className="text-gray-400">{formatTime(metric.timestamp)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {filteredMetrics.length === 0 && (
            <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
              暂无性能指标显示
            </div>
          )}
        </div>

        {/* 详情面板 */}
        {selectedMetric && (
          <div className="w-80 border-l border-gray-200 bg-gray-50 overflow-auto">
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-800">指标详情</h4>
                <button
                  onClick={() => setSelectedMetric(null)}
                  className="text-gray-400 hover:text-text-secondary"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-gray-500 font-medium">名称:</label>
                  <div className="mt-1 font-semibold">{selectedMetric.name}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-500 font-medium">类型:</label>
                    <div className={`mt-1 px-2 py-1 rounded text-center ${getTypeColor(selectedMetric.type)}`}>
                      {selectedMetric.type.toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-500 font-medium">值:</label>
                    <div className="mt-1 text-lg font-semibold">
                      {formatValue(selectedMetric.value, selectedMetric.unit)}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-gray-500 font-medium">时间戳:</label>
                  <div className="mt-1 font-mono-nerd">
                    {new Date(selectedMetric.timestamp).toISOString()}
                  </div>
                </div>

                {/* 相同指标的历史数据 */}
                {metricsByName[selectedMetric.name] && metricsByName[selectedMetric.name].length > 1 && (
                  <div>
                    <label className="text-gray-500 font-medium">历史:</label>
                    <div className="mt-1 space-y-1 max-h-32 overflow-auto">
                      {metricsByName[selectedMetric.name].slice(-10).reverse().map((metric) => (
                        <div key={metric.id} className="flex justify-between text-xs font-mono-nerd bg-bg-paper p-1 rounded">
                          <span>{formatValue(metric.value, metric.unit)}</span>
                          <span className="text-gray-400">{formatTime(metric.timestamp)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 统计信息 */}
                {metricsByName[selectedMetric.name] && metricsByName[selectedMetric.name].length > 1 && (
                  <div>
                    <label className="text-gray-500 font-medium">统计:</label>
                    <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                      {(() => {
                        const values = metricsByName[selectedMetric.name].map(m => m.value)
                        const min = Math.min(...values)
                        const max = Math.max(...values)
                        const avg = values.reduce((sum, v) => sum + v, 0) / values.length
                        
                        return (
                          <>
                            <div>最小: {formatValue(min, selectedMetric.unit)}</div>
                            <div>最大: {formatValue(max, selectedMetric.unit)}</div>
                            <div>平均: {formatValue(avg, selectedMetric.unit)}</div>
                            <div>数量: {values.length}</div>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(selectedMetric, null, 2))
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

export default PerformanceTab