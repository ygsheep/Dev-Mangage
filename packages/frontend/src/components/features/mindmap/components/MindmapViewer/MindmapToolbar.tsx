// packages/frontend/src/components/MindmapViewer/MindmapToolbar.tsx

import React, { useState, useEffect, useRef } from 'react'
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
  Compass,
  RefreshCw,
  Maximize
} from 'lucide-react'
import { MindmapConfig } from '../../types/mindmap'

interface MindmapToolbarProps {
  config: MindmapConfig
  onLayoutChange: (layoutType: string) => void
  onConfigChange: (config: Partial<MindmapConfig>) => void
  onFitView: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onResetView: () => void
  onExport: (format: string) => void
  onRefresh: () => void
  onFullscreen: () => void
  className?: string
}

const MindmapToolbar: React.FC<MindmapToolbarProps> = ({
  config,
  onLayoutChange,
  onConfigChange,
  onFitView,
  onZoomIn,
  onZoomOut,
  onResetView,
  onExport,
  onRefresh,
  onFullscreen,
  className = ''
}) => {
  const [showLayoutMenu, setShowLayoutMenu] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  
  const layoutMenuRef = useRef<HTMLDivElement>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (layoutMenuRef.current && !layoutMenuRef.current.contains(event.target as Node)) {
        setShowLayoutMenu(false)
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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
    <div className={`mindmap-toolbar bg-bg-paper border-b border-border-primary ${className}`}>
      <div className="flex items-center justify-between px-4 py-2">
        {/* 左侧工具组 */}
        <div className="flex items-center space-x-2">
          {/* 布局选择 */}
          <div className="relative" ref={layoutMenuRef}>
            <button
              className="flex items-center space-x-2 px-3 py-2 text-sm border border-border-primary rounded-md hover:bg-bg-tertiary transition-colors text-text-primary"
              onClick={() => setShowLayoutMenu(!showLayoutMenu)}
            >
              <Layout className="w-4 h-4" />
              <span>布局</span>
            </button>

            {showLayoutMenu && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-bg-paper border border-border-primary rounded-md shadow-theme-lg z-50">
                {layoutOptions.map((option) => (
                  <button
                    key={option.key}
                    className="flex items-center space-x-3 w-full px-3 py-2 text-left hover:bg-bg-tertiary transition-colors"
                    onClick={() => {
                      onLayoutChange(option.key)
                      setShowLayoutMenu(false)
                    }}
                  >
                    <option.icon className="w-4 h-4 text-text-tertiary" />
                    <div>
                      <div className="text-sm font-medium text-text-primary">
                        {option.label}
                      </div>
                      <div className="text-xs text-text-secondary">
                        {option.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 视图控制 */}
          <div className="flex items-center space-x-1 border border-border-primary rounded-md">
            <button
              className="p-2 hover:bg-bg-tertiary transition-colors text-text-secondary"
              onClick={onFitView}
              title="适应视图"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-border-primary" />
            <button
              className="p-2 hover:bg-bg-tertiary transition-colors text-text-secondary"
              onClick={onZoomIn}
              title="放大"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              className="p-2 hover:bg-bg-tertiary transition-colors text-text-secondary"
              onClick={onZoomOut}
              title="缩小"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-border-primary" />
            <button
              className="p-2 hover:bg-bg-tertiary transition-colors text-text-secondary"
              onClick={onResetView}
              title="重置视图"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* 刷新按钮 */}
          <button
            className="p-2 border border-border-primary rounded-md hover:bg-bg-tertiary transition-colors text-text-secondary"
            onClick={onRefresh}
            title="刷新数据"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* 筛选器 */}
          <button
            className={`flex items-center space-x-2 px-3 py-2 text-sm border rounded-md transition-colors ${
              showFilterPanel 
                ? 'border-primary-300 bg-primary-50 text-primary-700' 
                : 'border-border-primary hover:bg-bg-tertiary text-text-primary'
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
                  ? 'bg-primary-100 text-primary-600'
                  : 'hover:bg-bg-tertiary text-text-secondary'
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
                  ? 'bg-primary-100 text-primary-600'
                  : 'hover:bg-bg-tertiary text-text-secondary'
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

          {/* 全屏按钮 */}
          <button
            className="p-2 border border-border-primary rounded-md hover:bg-bg-tertiary transition-colors text-text-secondary"
            onClick={onFullscreen}
            title="全屏显示"
          >
            <Maximize className="w-4 h-4" />
          </button>

          {/* 导出 */}
          <div className="relative" ref={exportMenuRef}>
            <button
              className="flex items-center space-x-2 px-3 py-2 text-sm border border-border-primary rounded-md hover:bg-bg-tertiary transition-colors text-text-primary"
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              <Download className="w-4 h-4" />
              <span>导出</span>
            </button>

            {showExportMenu && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-bg-paper border border-border-primary rounded-md shadow-theme-lg z-50">
                {exportOptions.map((option) => (
                  <button
                    key={option.key}
                    className="flex items-center justify-between w-full px-3 py-2 text-left hover:bg-bg-tertiary transition-colors"
                    onClick={() => {
                      console.log('🖱️ 点击导出选项:', option.key)
                      onExport(option.key)
                      setShowExportMenu(false)
                    }}
                  >
                    <div>
                      <div className="text-sm font-medium text-text-primary">
                        {option.label}
                      </div>
                      <div className="text-xs text-text-secondary">
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
            className="p-2 border border-border-primary rounded-md hover:bg-bg-tertiary transition-colors text-text-secondary"
            onClick={() => console.log('Open settings')}
            title="设置"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 筛选面板 */}
      {showFilterPanel && (
        <div className="border-t border-border-primary bg-bg-secondary p-4">
          <div className="grid grid-cols-3 gap-4">
            {/* 节点类型筛选 */}
            <div>
              <label className="block text-xs font-medium text-text-primary mb-2">
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
                      className="mr-2 h-3 w-3 text-primary-600 border-border-primary rounded"
                    />
                    <span className="text-xs text-text-secondary capitalize">
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
              <label className="block text-xs font-medium text-text-primary mb-2">
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
                      className="mr-2 h-3 w-3 text-primary-600 border-border-primary rounded"
                    />
                    <span className="text-xs text-text-secondary">
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
              <label className="block text-xs font-medium text-text-primary mb-2">
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
                      className="mr-2 h-3 w-3 text-primary-600 border-border-primary rounded"
                    />
                    <span className="text-xs text-text-secondary">
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