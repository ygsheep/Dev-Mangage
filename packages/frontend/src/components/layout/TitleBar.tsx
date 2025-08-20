import { Home, Menu, Minus, Settings, Square, X } from 'lucide-react'
import React from 'react'
import { Link } from 'react-router-dom'

interface TitleBarProps {
  title?: string
  subtitle?: string
  isDesktopMode?: boolean
}

const TitleBar: React.FC<TitleBarProps> = ({
  title = 'DevAPI Manager',
  subtitle = 'Control+Alt+Space',
  isDesktopMode = false,
}) => {
  const handleMinimize = () => {
    if (window.electronAPI) {
      window.electronAPI.minimizeWindow()
    }
  }

  const handleMaximize = () => {
    if (window.electronAPI) {
      window.electronAPI.maximizeWindow()
    }
  }

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.closeWindow()
    }
  }

  return (
    <div className="h-8 bg-[#2f2f2f] border-b border-[#404040] flex items-center justify-between px-3 select-none">
      {/* 左侧：Logo和菜单 */}
      <div className="flex items-center space-x-3 flex-shrink-0" style={{ WebkitAppRegion: 'no-drag' as any }}>
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-[#d97757] rounded flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">D</span>
          </div>
        </div>
        
        {/* 菜单项 */}
        <div className="flex items-center space-x-1">
          <Link
            to="/"
            className="px-2 py-1 text-xs text-[#b8b8b8] hover:text-white hover:bg-[#404040] rounded transition-colors duration-200"
            title="首页"
          >
            <Home className="w-3 h-3" />
          </Link>
          <Link
            to="/settings"
            className="px-2 py-1 text-xs text-[#b8b8b8] hover:text-white hover:bg-[#404040] rounded transition-colors duration-200"
            title="设置"
          >
            <Settings className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* 中间：标题 */}
      <div className="flex-1 flex justify-center" style={{ WebkitAppRegion: 'drag' as any }}>
        <div className="text-xs text-white font-medium text-center">
          {title}
          {subtitle && (
            <>
              <span className="text-[#888] mx-1">—</span>
              <span className="text-[#888]">{subtitle}</span>
            </>
          )}
        </div>
      </div>

      {/* 右侧：窗口控制按钮 */}
      <div className="flex items-center space-x-1 flex-shrink-0" style={{ WebkitAppRegion: 'no-drag' as any }}>
        <button
          onClick={handleMinimize}
          className="w-7 h-6 flex items-center justify-center text-[#b8b8b8] hover:text-white hover:bg-[#404040] rounded transition-colors duration-200"
          title="最小化"
        >
          <Minus size={12} />
        </button>
        <button
          onClick={handleMaximize}
          className="w-7 h-6 flex items-center justify-center text-[#b8b8b8] hover:text-white hover:bg-[#404040] rounded transition-colors duration-200"
          title="最大化"
        >
          <Square size={10} />
        </button>
        <button
          onClick={handleClose}
          className="w-7 h-6 flex items-center justify-center text-[#b8b8b8] hover:text-white hover:bg-red-500 rounded transition-colors duration-200"
          title="关闭"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  )
}

export default TitleBar
