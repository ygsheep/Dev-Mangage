import React, { useMemo, useState } from 'react'
import useDebugStore from '../DebugStore'
import { NetworkRequest } from '../types'

const NetworkTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<NetworkRequest | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'error'>('all')

  const { networkRequests, clearNetworkRequests } = useDebugStore()

  // 过滤请求
  const filteredRequests = useMemo(() => {
    return networkRequests
      .filter(request => {
        const searchMatch =
          searchTerm === '' ||
          request.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.method.toLowerCase().includes(searchTerm.toLowerCase())

        const statusMatch =
          filterStatus === 'all' ||
          (filterStatus === 'success' &&
            !request.error &&
            (!request.status || request.status < 400)) ||
          (filterStatus === 'error' && (request.error || (request.status && request.status >= 400)))

        return searchMatch && statusMatch
      })
      .sort((a, b) => b.timestamp - a.timestamp)
  }, [networkRequests, searchTerm, filterStatus])

  const getStatusColor = (request: NetworkRequest) => {
    if (request.error) return 'text-red-600 bg-red-50'
    if (!request.status) return 'text-yellow-600 bg-yellow-50'
    if (request.status >= 400) return 'text-red-600 bg-red-50'
    if (request.status >= 300) return 'text-yellow-600 bg-yellow-50'
    return 'text-green-600 bg-green-50'
  }

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'text-blue-600 bg-primary-50 dark:bg-primary-900/20'
      case 'POST':
        return 'text-green-600 bg-green-50'
      case 'PUT':
        return 'text-yellow-600 bg-yellow-50'
      case 'DELETE':
        return 'text-red-600 bg-red-50'
      case 'PATCH':
        return 'text-purple-600 bg-purple-50'
      default:
        return 'text-text-secondary bg-bg-secondary'
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const timeStr = date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    const ms = date.getMilliseconds().toString().padStart(3, '0')
    return `${timeStr}.${ms}`
  }

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A'
    if (duration < 1000) return `${Math.round(duration)}ms`
    return `${(duration / 1000).toFixed(2)}s`
  }

  const formatSize = (data: any): string => {
    if (!data) return 'N/A'
    const str = JSON.stringify(data)
    const bytes = new Blob([str]).size
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  const exportRequests = () => {
    const data = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      requests: filteredRequests,
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `network-requests-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copyAsCurl = (request: NetworkRequest) => {
    let curl = `curl -X ${request.method} '${request.url}'`

    if (request.requestData) {
      curl += ` -H 'Content-Type: application/json'`
      curl += ` -d '${JSON.stringify(request.requestData)}'`
    }

    navigator.clipboard.writeText(curl)
  }

  return (
    <div className="flex flex-col h-full">
      {/* 控制面板 */}
      <div className="p-3 bg-bg-secondary border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="搜索请求..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-300 bg-bg-secondary focus:outline-none rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
              className="px-2 py-1 text-xs border border-gray-300 bg-bg-secondary focus:outline-none rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">所有状态</option>
              <option value="success">成功</option>
              <option value="error">错误</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={exportRequests}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              导出
            </button>
            <button
              onClick={clearNetworkRequests}
              className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
            >
              清空
            </button>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <span>总计: {networkRequests.length}</span>
          <span>
            成功: {networkRequests.filter(r => !r.error && (!r.status || r.status < 400)).length}
          </span>
          <span>
            错误: {networkRequests.filter(r => r.error || (r.status && r.status >= 400)).length}
          </span>
          <span>
            平均耗时:{' '}
            {networkRequests.length > 0
              ? formatDuration(
                  networkRequests.reduce((sum, r) => sum + (r.duration || 0), 0) /
                    networkRequests.length
                )
              : 'N/A'}
          </span>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* 请求列表 */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          <div className="divide-y divide-gray-100">
            {filteredRequests.map(request => (
              <div
                key={request.id}
                className={`p-2 hover:bg-bg-secondary cursor-pointer text-xs ${
                  selectedRequest?.id === request.id
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-l-2 border-blue-500'
                    : ''
                }`}
                onClick={() =>
                  setSelectedRequest(selectedRequest?.id === request.id ? null : request)
                }
              >
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400 font-mono-nerd text-xs whitespace-nowrap">
                    {formatTime(request.timestamp)}
                  </span>
                  <span
                    className={`px-1 py-0.5 rounded text-xs font-medium ${getMethodColor(request.method)}`}
                  >
                    {request.method}
                  </span>
                  <span
                    className={`px-1 py-0.5 rounded text-xs font-medium ${getStatusColor(request)}`}
                  >
                    {request.error ? 'ERROR' : request.status || 'PENDING'}
                  </span>
                  <span className="text-gray-500 text-xs">{formatDuration(request.duration)}</span>
                  <span className="flex-1 text-gray-800 font-mono-nerd truncate">
                    {request.url}
                  </span>
                </div>

                {request.error && (
                  <div className="mt-1 ml-20 text-red-600 text-xs">错误: {request.error}</div>
                )}
              </div>
            ))}
          </div>

          {filteredRequests.length === 0 && (
            <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
              暂无网络请求显示
            </div>
          )}
        </div>

        {/* 详情面板 */}
        {selectedRequest && (
          <div className="w-96 border-l border-gray-200 bg-bg-secondary overflow-auto scrollbar-thin">
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-800">请求详情</h4>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-text-secondary"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-gray-500 font-medium">URL:</label>
                  <div className="mt-1 font-mono-nerd break-all bg-bg-paper p-2 rounded border">
                    {selectedRequest.url}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-500 font-medium">方法:</label>
                    <div
                      className={`mt-1 px-2 py-1 rounded text-center ${getMethodColor(selectedRequest.method)}`}
                    >
                      {selectedRequest.method}
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-500 font-medium">状态:</label>
                    <div
                      className={`mt-1 px-2 py-1 rounded text-center ${getStatusColor(selectedRequest)}`}
                    >
                      {selectedRequest.error ? 'ERROR' : selectedRequest.status || 'PENDING'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-500 font-medium">耗时:</label>
                    <div className="mt-1">{formatDuration(selectedRequest.duration)}</div>
                  </div>
                  <div>
                    <label className="text-gray-500 font-medium">时间戳:</label>
                    <div className="mt-1 font-mono-nerd">
                      {new Date(selectedRequest.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                {selectedRequest.requestData && (
                  <div>
                    <label className="text-gray-500 font-medium">
                      请求数据 ({formatSize(selectedRequest.requestData)}):
                    </label>
                    <pre className="mt-1 bg-bg-paper p-2 rounded border text-xs font-mono-nerd overflow-auto max-h-32 scrollbar-thin">
                      {JSON.stringify(selectedRequest.requestData, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedRequest.responseData && (
                  <div>
                    <label className="text-gray-500 font-medium">
                      响应数据 ({formatSize(selectedRequest.responseData)}):
                    </label>
                    <pre className="mt-1 bg-bg-paper p-2 rounded border text-xs font-mono-nerd overflow-auto max-h-32 scrollbar-thin">
                      {typeof selectedRequest.responseData === 'string'
                        ? selectedRequest.responseData
                        : JSON.stringify(selectedRequest.responseData, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedRequest.error && (
                  <div>
                    <label className="text-gray-500 font-medium">错误:</label>
                    <div className="mt-1 bg-red-50 p-2 rounded border text-red-700">
                      {selectedRequest.error}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200 space-y-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(selectedRequest, null, 2))
                  }}
                  className="w-full px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  复制 JSON
                </button>
                <button
                  onClick={() => copyAsCurl(selectedRequest)}
                  className="w-full px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                >
                  复制为 cURL
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default NetworkTab
