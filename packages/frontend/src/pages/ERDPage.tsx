import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Database,
  Eye,
  EyeOff,
  Grid,
  HelpCircle,
  Maximize2,
  Settings,
} from 'lucide-react'
import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ERDViewer from '../components/features/data-visualization/ERDViewer'
import { api } from '../utils/api'

export const ERDPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const [showMinimap, setShowMinimap] = useState(true)
  const [showBackground, setShowBackground] = useState(true)
  const [allowEditing, setAllowEditing] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // 获取项目信息
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required')
      const response = await api.get(`/api/v1/projects/${projectId}`)
      return response.data
    },
    enabled: !!projectId,
  })

  if (!projectId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">项目ID未提供</p>
          <Link
            to="/projects"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            返回项目列表
          </Link>
        </div>
      </div>
    )
  }

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
    setIsFullscreen(!isFullscreen)
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-bg-paper' : 'space-y-6'}`}>
      {/* 页面头部 */}
      <div
        className={`${isFullscreen ? 'p-4' : ''} ${isFullscreen ? 'border-b border-gray-200' : 'bg-bg-paper rounded-lg shadow-md p-6'}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {!isFullscreen && (
              <Link
                to={`/projects/${projectId}/data-model`}
                className="p-2 text-text-secondary hover:text-blue-600 hover:bg-primary-50 dark:bg-primary-900/20 rounded-lg transition-colors"
                title="返回数据模型"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
            )}

            <div>
              <div className="flex items-center gap-2">
                <Database className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-text-primary">实体关系图 (ERD)</h1>
              </div>
              {project && (
                <p className="text-text-secondary mt-1">{project.name} - 数据库表关系可视化</p>
              )}
            </div>
          </div>

          {/* 工具栏 */}
          <div className="flex items-center gap-2">
            {/* 显示选项 */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setShowMinimap(!showMinimap)}
                className={`p-2 rounded transition-colors ${
                  showMinimap
                    ? 'bg-bg-paper text-blue-600 shadow-sm'
                    : 'text-text-secondary hover:text-blue-600'
                }`}
                title={showMinimap ? '隐藏小地图' : '显示小地图'}
              >
                {showMinimap ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setShowBackground(!showBackground)}
                className={`p-2 rounded transition-colors ${
                  showBackground
                    ? 'bg-bg-paper text-blue-600 shadow-sm'
                    : 'text-text-secondary hover:text-blue-600'
                }`}
                title={showBackground ? '隐藏网格背景' : '显示网格背景'}
              >
                <Grid className="w-4 h-4" />
              </button>

              <button
                onClick={() => setAllowEditing(!allowEditing)}
                className={`p-2 rounded transition-colors ${
                  allowEditing
                    ? 'bg-bg-paper text-orange-600 shadow-sm'
                    : 'text-text-secondary hover:text-orange-600'
                }`}
                title={allowEditing ? '禁用编辑模式' : '启用编辑模式'}
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {/* 全屏按钮 */}
            <button
              onClick={toggleFullscreen}
              className="p-2 text-text-secondary hover:text-blue-600 hover:bg-primary-50 dark:bg-primary-900/20 rounded-lg transition-colors"
              title={isFullscreen ? '退出全屏' : '进入全屏'}
            >
              <Maximize2 className="w-5 h-5" />
            </button>

            {/* 帮助按钮 */}
            <button
              onClick={() => {
                // 这里可以显示帮助对话框
                alert(
                  'ERD 帮助:\n\n• 拖拽表格来重新排列\n• 使用鼠标滚轮缩放\n• 点击表格标题可以折叠/展开字段\n• 蓝色线条表示外键关系\n• 黄色图标表示主键\n• 蓝色图标表示外键'
                )
              }}
              className="p-2 text-text-secondary hover:text-blue-600 hover:bg-primary-50 dark:bg-primary-900/20 rounded-lg transition-colors"
              title="查看帮助"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ERD 视图 */}
      <div className={isFullscreen ? 'flex-1' : ''}>
        <ERDViewer
          projectId={projectId}
          height={isFullscreen ? 'calc(100vh - 100px)' : '800px'}
          className={isFullscreen ? '' : 'bg-bg-paper rounded-lg shadow-md'}
          showMinimap={showMinimap}
          showBackground={showBackground}
          allowEditing={allowEditing}
        />
      </div>

      {/* 使用说明 */}
      {!isFullscreen && (
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-2">使用说明</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p>
                  • <span className="font-medium">拖拽移动:</span> 拖拽表格来重新排列位置
                </p>
                <p>
                  • <span className="font-medium">缩放视图:</span> 使用鼠标滚轮或右侧控制按钮
                </p>
                <p>
                  • <span className="font-medium">折叠表格:</span> 点击表格标题右侧的眼睛图标
                </p>
                <p>
                  • <span className="font-medium">关系线条:</span>{' '}
                  蓝色线条表示外键关系，箭头指向被引用的表
                </p>
                <p>
                  • <span className="font-medium">字段图标:</span>
                  <span className="inline-flex items-center gap-1 ml-1">
                    黄色钥匙 = 主键，蓝色井号 = 外键，灰色类型 = 普通字段
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ERDPage
