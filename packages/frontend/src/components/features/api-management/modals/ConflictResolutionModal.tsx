import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Database,
  Eye,
  Globe,
  RotateCcw,
  X,
} from 'lucide-react'
import React, { useState } from 'react'

interface Conflict {
  id: string
  type:
    | 'field_type_mismatch'
    | 'field_count_mismatch'
    | 'missing_parameter'
    | 'path_mismatch'
    | 'naming_conflict'
  tableId?: string
  endpointId?: string
  description: string
  modelData?: any
  apiData?: any
  severity: 'high' | 'medium' | 'low'
}

interface ConflictResolution {
  conflictId: string
  resolution: 'use_model' | 'use_api' | 'merge' | 'skip'
  customData?: any
}

interface ConflictResolutionModalProps {
  isOpen: boolean
  onClose: () => void
  conflicts: Conflict[]
  onResolve: (resolutions: ConflictResolution[]) => void
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  isOpen,
  onClose,
  conflicts,
  onResolve,
}) => {
  const [resolutions, setResolutions] = useState<{ [key: string]: ConflictResolution }>({})
  const [processing, setProcessing] = useState(false)

  if (!isOpen) return null

  const handleResolutionChange = (
    conflictId: string,
    resolution: ConflictResolution['resolution']
  ) => {
    setResolutions(prev => ({
      ...prev,
      [conflictId]: {
        conflictId,
        resolution,
      },
    }))
  }

  const handleApplyAllResolution = (resolution: ConflictResolution['resolution']) => {
    const newResolutions: { [key: string]: ConflictResolution } = {}
    conflicts.forEach(conflict => {
      newResolutions[conflict.id] = {
        conflictId: conflict.id,
        resolution,
      }
    })
    setResolutions(newResolutions)
  }

  const handleResolve = async () => {
    setProcessing(true)
    try {
      const resolutionList = Object.values(resolutions)
      await onResolve(resolutionList)
    } finally {
      setProcessing(false)
    }
  }

  const getConflictTypeLabel = (type: Conflict['type']) => {
    switch (type) {
      case 'field_type_mismatch':
        return '字段类型不匹配'
      case 'field_count_mismatch':
        return '字段数量不匹配'
      case 'missing_parameter':
        return '缺少API参数'
      case 'path_mismatch':
        return '路径不匹配'
      case 'naming_conflict':
        return '命名冲突'
      default:
        return '未知冲突'
    }
  }

  const getSeverityColor = (severity: Conflict['severity']) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-100'
      case 'medium':
        return 'text-orange-600 bg-orange-100'
      case 'low':
        return 'text-yellow-600 bg-yellow-100'
      default:
        return 'text-text-secondary bg-gray-100'
    }
  }

  const allResolved = conflicts.every(conflict => resolutions[conflict.id])

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto custom-scrollbar">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative transform overflow-hidden rounded-lg bg-bg-paper text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-primary">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
              <h3 className="text-lg font-semibold text-text-primary">解决同步冲突</h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                {conflicts.length} 个冲突
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-text-tertiary hover:text-text-secondary transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Batch Actions */}
          <div className="px-6 py-4 bg-bg-secondary border-b border-border-primary">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-text-primary">批量操作</h4>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleApplyAllResolution('use_model')}
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                >
                  <Database size={14} className="mr-1" />
                  全部使用模型
                </button>
                <button
                  onClick={() => handleApplyAllResolution('use_api')}
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                >
                  <Globe size={14} className="mr-1" />
                  全部使用API
                </button>
                <button
                  onClick={() => handleApplyAllResolution('merge')}
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200"
                >
                  <ArrowRight size={14} className="mr-1" />
                  全部合并
                </button>
                <button
                  onClick={() => setResolutions({})}
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-100 text-text-primary rounded-md hover:bg-gray-200"
                >
                  <RotateCcw size={14} className="mr-1" />
                  重置
                </button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-4 max-h-96 overflow-y-auto scrollbar-thin">
            <div className="space-y-4">
              {conflicts.map((conflict, index) => (
                <div key={conflict.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="mt-1">
                        <AlertTriangle size={16} className="text-orange-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h5 className="font-medium text-text-primary">
                            冲突 #{index + 1}: {getConflictTypeLabel(conflict.type)}
                          </h5>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(conflict.severity)}`}
                          >
                            {conflict.severity === 'high'
                              ? '高'
                              : conflict.severity === 'medium'
                                ? '中'
                                : '低'}
                          </span>
                        </div>
                        <p className="text-sm text-text-secondary mb-3">{conflict.description}</p>

                        {/* 冲突详情 */}
                        {(conflict.modelData || conflict.apiData) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {conflict.modelData && (
                              <div className="bg-primary-50 dark:bg-primary-900/20 border border-blue-200 rounded-md p-3">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Database size={14} className="text-blue-600" />
                                  <span className="text-sm font-medium text-blue-800">
                                    数据模型
                                  </span>
                                </div>
                                <pre className="text-xs text-blue-700 overflow-x-auto custom-scrollbar">
                                  {JSON.stringify(conflict.modelData, null, 2)}
                                </pre>
                              </div>
                            )}
                            {conflict.apiData && (
                              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Globe size={14} className="text-green-600" />
                                  <span className="text-sm font-medium text-green-800">
                                    API数据
                                  </span>
                                </div>
                                <pre className="text-xs text-green-700 overflow-x-auto custom-scrollbar">
                                  {JSON.stringify(conflict.apiData, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 解决方案选择 */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-text-secondary">解决方案:</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleResolutionChange(conflict.id, 'use_model')}
                        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${
                          resolutions[conflict.id]?.resolution === 'use_model'
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                      >
                        <Database size={12} className="mr-1" />
                        使用模型
                      </button>
                      <button
                        onClick={() => handleResolutionChange(conflict.id, 'use_api')}
                        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${
                          resolutions[conflict.id]?.resolution === 'use_api'
                            ? 'bg-green-600 text-white'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        <Globe size={12} className="mr-1" />
                        使用API
                      </button>
                      <button
                        onClick={() => handleResolutionChange(conflict.id, 'merge')}
                        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${
                          resolutions[conflict.id]?.resolution === 'merge'
                            ? 'bg-purple-600 text-white'
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        }`}
                      >
                        <ArrowRight size={12} className="mr-1" />
                        合并
                      </button>
                      <button
                        onClick={() => handleResolutionChange(conflict.id, 'skip')}
                        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${
                          resolutions[conflict.id]?.resolution === 'skip'
                            ? 'bg-gray-600 text-white'
                            : 'bg-gray-100 text-text-primary hover:bg-gray-200'
                        }`}
                      >
                        <Eye size={12} className="mr-1" />
                        跳过
                      </button>
                    </div>
                    {resolutions[conflict.id] && (
                      <CheckCircle size={16} className="text-green-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center px-6 py-4 border-t border-border-primary bg-bg-tertiary">
            <div className="text-sm text-text-secondary">
              已处理: {Object.keys(resolutions).length} / {conflicts.length}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                disabled={processing}
                className="px-4 py-2 text-sm font-medium text-text-secondary bg-bg-paper border border-border-primary rounded-md hover:bg-bg-tertiary transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleResolve}
                disabled={!allResolved || processing}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-500 border border-transparent rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {processing && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                )}
                <span>{processing ? '处理中...' : '应用解决方案'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
