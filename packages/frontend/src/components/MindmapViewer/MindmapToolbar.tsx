// packages/frontend/src/components/MindmapViewer/MindmapToolbar.tsx

import React, { useState } from 'react'
import {
  Maximize2,
  Download,
  Settings,
  Layout,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Filter,
  Eye,
  EyeOff,
  Grid3X3,
  Circle,
  GitBranch,
  Compass
} from 'lucide-react'
import { MindmapConfig } from '../../types/mindmap'

interface MindmapToolbarProps {
  config: MindmapConfig
  onLayoutChange: (layoutType: string) => void
  onConfigChange: (config: Partial<MindmapConfig>) => void
  onFitView: () => void
  onExport: (format: string) => void
  className?: string
}

const MindmapToolbar: React.FC<MindmapToolbarProps> = ({
  config,
  onLayoutChange,
  onConfigChange,
  onFitView,
  onExport,
  className = ''
}) => {
  const [showLayoutMenu, setShowLayoutMenu] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showFilterPanel, setShowFilterPanel] = useState(false)

  // 布局选项
  const layoutOptions = [
    { 
      key: 'hierarchical', 
      label: '层次布局', 
      icon: GitBranch,
      description: '树状层次结构'
    },
    { 
      key: 'radial', 
      label: '放射布局', 
      icon: Compass,
      description: '以中心向外放射'
    },
    { 
      key: 'force', 
      label: '力导向布局', 
      icon: Circle,
      description: '基于物理力学'
    },
    { 
      key: 'circular', 
      label: '环形布局', 
      icon: Circle,
      description: '节点排列成圆形'
    }
  ]

  // 导出格式选项
  const exportOptions = [
    { key: 'png', label: 'PNG 图片', description: '适合文档和演示' },
    { key: 'svg', label: 'SVG 矢量图', description: '可缩放矢量格式' },
    { key: 'pdf', label: 'PDF 文档', description: '适合打印和分享' },
    { key: 'json', label: 'JSON 数据', description: '结构化数据格式' },
  ]

  return (
    <div className={`mindmap-toolbar bg-white border-b border-gray-200 ${className}`}>
      <div className="flex items-center justify-between px-4 py-2">
        {/* 左侧工具组 */}
        <div className="flex items-center space-x-2">
          {/* 布局选择 */}
          <div className="relative">
            <button
              className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              onClick={() => setShowLayoutMenu(!showLayoutMenu)}
            >
              <Layout className="w-4 h-4" />
              <span>布局</span>
            </button>

            {showLayoutMenu && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                {layoutOptions.map((option) => (
                  <button
                    key={option.key}
                    className="flex items-center space-x-3 w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      onLayoutChange(option.key)
                      setShowLayoutMenu(false)
                    }}
                  >
                    <option.icon className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {option.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 视图控制 */}
          <div className="flex items-center space-x-1 border border-gray-300 rounded-md">
            <button
              className="p-2 hover:bg-gray-50 transition-colors"
              onClick={onFitView}
              title="适应视图"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-gray-300" />
            <button
              className="p-2 hover:bg-gray-50 transition-colors"
              onClick={() => console.log('Zoom in')}
              title="放大"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              className="p-2 hover:bg-gray-50 transition-colors"
              onClick={() => console.log('Zoom out')}
              title="缩小"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-gray-300" />
            <button
              className="p-2 hover:bg-gray-50 transition-colors"
              onClick={() => console.log('Reset view')}
              title="重置视图"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* 筛选器 */}
          <button
            className={`flex items-center space-x-2 px-3 py-2 text-sm border rounded-md transition-colors ${
              showFilterPanel 
                ? 'border-blue-300 bg-blue-50 text-blue-700' 
                : 'border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setShowFilterPanel(!showFilterPanel)}
          >
            <Filter className="w-4 h-4" />
            <span>筛选</span>
          </button>
        </div>

        {/* 右侧工具组 */}
        <div className="flex items-center space-x-2">
          {/* 显示选项 */}
          <div className="flex items-center space-x-1">
            <button
              className={`p-2 rounded-md transition-colors ${
                config.display.showLabels
                  ? 'bg-blue-100 text-blue-600'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onConfigChange({
                display: {
                  ...config.display,
                  showLabels: !config.display.showLabels
                }
              })}
              title="显示/隐藏标签"
            >
              {config.display.showLabels ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </button>
            
            <button
              className={`p-2 rounded-md transition-colors ${
                config.display.compactMode
                  ? 'bg-blue-100 text-blue-600'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onConfigChange({
                display: {
                  ...config.display,
                  compactMode: !config.display.compactMode
                }
              })}
              title="紧凑模式"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>

          {/* 导出 */}
          <div className="relative">
            <button
              className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              <Download className="w-4 h-4" />
              <span>导出</span>
            </button>

            {showExportMenu && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                {exportOptions.map((option) => (
                  <button
                    key={option.key}
                    className="flex items-center justify-between w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      onExport(option.key)
                      setShowExportMenu(false)
                    }}
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {option.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 设置 */}
          <button
            className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            onClick={() => console.log('Open settings')}
            title="设置"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 筛选面板 */}
      {showFilterPanel && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="grid grid-cols-3 gap-4">
            {/* 节点类型筛选 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                节点类型
              </label>
              <div className="space-y-2">
                {['project', 'category', 'table', 'fieldGroup'].map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.filters.nodeTypes.includes(type as any)}
                      onChange={(e) => {
                        const nodeTypes = e.target.checked
                          ? [...config.filters.nodeTypes, type as any]
                          : config.filters.nodeTypes.filter(t => t !== type)
                        onConfigChange({
                          filters: { ...config.filters, nodeTypes }
                        })
                      }}
                      className="mr-2 h-3 w-3 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="text-xs text-gray-600 capitalize">
                      {type === 'project' ? '项目' : 
                       type === 'category' ? '分类' : 
                       type === 'table' ? '数据表' : '字段组'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* 边类型筛选 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                关系类型
              </label>
              <div className="space-y-2">
                {['hierarchy', 'foreignKey', 'reference', 'dependency'].map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.filters.edgeTypes.includes(type as any)}
                      onChange={(e) => {
                        const edgeTypes = e.target.checked
                          ? [...config.filters.edgeTypes, type as any]
                          : config.filters.edgeTypes.filter(t => t !== type)
                        onConfigChange({
                          filters: { ...config.filters, edgeTypes }
                        })
                      }}
                      className="mr-2 h-3 w-3 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="text-xs text-gray-600">
                      {type === 'hierarchy' ? '层次' : 
                       type === 'foreignKey' ? '外键' : 
                       type === 'reference' ? '引用' : '依赖'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* 状态筛选 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                表状态
              </label>
              <div className="space-y-2">
                {['DRAFT', 'ACTIVE', 'DEPRECATED'].map((status) => (
                  <label key={status} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.filters.statuses.includes(status)}
                      onChange={(e) => {
                        const statuses = e.target.checked
                          ? [...config.filters.statuses, status]
                          : config.filters.statuses.filter(s => s !== status)
                        onConfigChange({
                          filters: { ...config.filters, statuses }
                        })
                      }}
                      className="mr-2 h-3 w-3 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="text-xs text-gray-600">
                      {status === 'DRAFT' ? '草稿' : 
                       status === 'ACTIVE' ? '已创建' : '已废弃'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MindmapToolbar