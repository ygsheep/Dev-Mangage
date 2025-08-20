import {
  Archive,
  BarChart3,
  ChevronDown,
  Folder,
  HelpCircle,
  Home,
  Languages,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
} from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { debug, useDebugComponent } from '../../debug'
import QuickSearch from '../features/search/components/QuickSearch'
import './Layout.css'

const Layout: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    // 从localStorage读取用户偏好
    const saved = localStorage.getItem('devapi-sidebar-collapsed')
    return saved ? JSON.parse(saved) : false
  })
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { isDark, toggleDarkMode } = useTheme()
  const userMenuRef = useRef<HTMLDivElement>(null)

  // 检测是否为desktop模式
  const isDesktopMode = window.electronAPI !== undefined

  // 调试组件状态跟踪
  useDebugComponent('Layout', {
    currentPath: location.pathname,
    isSearchOpen,
    isSidebarCollapsed,
    timestamp: Date.now(),
  })

  // 切换侧边栏状态
  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed
    setIsSidebarCollapsed(newState)
    // 保存用户偏好到localStorage
    localStorage.setItem('devapi-sidebar-collapsed', JSON.stringify(newState))
    debug.log(
      '侧边栏状态切换',
      {
        collapsed: newState,
        currentPath: location.pathname,
      },
      'Layout'
    )
  }

  // 点击功能模块按钮时的处理逻辑 - 保持当前状态，正常导航
  const handleMainNavClick = (e: React.MouseEvent, href: string) => {
    // 不展开侧边栏，保持当前状态，正常导航
    debug.log(
      '点击功能模块导航',
      {
        href,
        currentPath: location.pathname,
        sidebarCollapsed: isSidebarCollapsed,
      },
      'Layout'
    )
  }

  // 其他按钮的正常处理逻辑
  const handleSidebarInteraction = (e: React.MouseEvent, href?: string) => {
    // 其他按钮保持原有逻辑，不阻止导航
    if (isSidebarCollapsed && href && !href.startsWith('#')) {
      debug.log(
        '点击其他链接',
        {
          href,
          currentPath: location.pathname,
        },
        'Layout'
      )
    }
  }

  // 点击外部关闭用户菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserMenuOpen])

  // 路由变化监控
  useEffect(() => {
    debug.log(
      '路由变化',
      {
        from: 'Layout',
        path: location.pathname,
        search: location.search,
        timestamp: new Date().toISOString(),
      },
      'Layout'
    )

    // 模拟页面性能监控
    const timer = debug.time(`页面加载: ${location.pathname}`)

    // 模拟页面加载完成
    setTimeout(
      () => {
        timer.end()
      },
      Math.random() * 200 + 100
    )
  }, [location.pathname])

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K 打开搜索
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        debug.log(
          '用户使用快捷键打开搜索',
          {
            shortcut: 'Ctrl+K',
            currentPath: location.pathname,
          },
          'Layout'
        )
        setIsSearchOpen(true)
      }

      // Cmd/Ctrl + B 切换侧边栏
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        debug.log(
          '用户使用快捷键切换侧边栏',
          {
            shortcut: 'Ctrl+B',
            currentPath: location.pathname,
            collapsed: !isSidebarCollapsed,
          },
          'Layout'
        )
        toggleSidebar()
      }

      // ESC 关闭菜单
      if (e.key === 'Escape') {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [location.pathname, isSidebarCollapsed])

  const navigation = [{ name: '新建对话', href: '/chats/', icon: Plus, isAction: true }]
  const mainNavigation = [
    { name: '首页', href: '/', icon: Home },
    { name: '项目', href: '/projects', icon: Folder },
    { name: '对话', href: '/chats', icon: MessageSquare },
    { name: '归档', href: '/archive', icon: Archive },
    { name: '仪表板', href: '/dashboard', icon: BarChart3 },
  ]

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(href)
  }

  return (
    <div className="flex h-screen bg-bg-secondary">
      {/* Claude Desktop 风格侧边栏 */}
      <div
        className={`claude-sidebar group flex-shrink-0 text-[#b8b8b8] transition-all duration-300 ${
          isSidebarCollapsed
            ? 'w-16 bg-[#2f2f2f] hover:bg-[#1F1E1D] cursor-pointer'
            : 'w-64 bg-[#2f2f2f]'
        }`}
        title={isSidebarCollapsed ? '点击展开侧边栏' : ''}
      >
        <div className="flex h-full flex-col" onClick={e => e.stopPropagation()}>
          {/* 顶部Logo和收起按钮 */}
          <div className="flex h-12 items-center px-3">
            <div className="flex items-center gap-2 w-full">
              <button
                onClick={toggleSidebar}
                className="px-3 py-2 rounded hover:bg-[#404040] transition-colors duration-300 flex-shrink-0"
                title={isSidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
              >
                <Menu className="h-4 w-4" />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 flex-1 flex justify-center ${
                  isSidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                }`}
              >
                <span className="text-lg font-semibold text-white whitespace-nowrap">DevAPI</span>
              </div>
            </div>
          </div>

          {/* Desktop模式下的搜索组件 */}
          {isDesktopMode && (
            <div className="px-3 py-2">
              <button
                onClick={() => setIsSearchOpen(true)}
                className={`w-full flex items-center text-sm rounded-lg transition-all duration-300 ${
                  isSidebarCollapsed
                    ? 'justify-center w-10 h-10 hover:bg-[#404040]'
                    : 'px-3 py-2 text-[#b8b8b8] bg-[#404040] hover:bg-[#505050]'
                }`}
                title={isSidebarCollapsed ? '搜索' : '搜索项目、API...'}
              >
                <Search className="h-4 w-4 flex-shrink-0" />
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isSidebarCollapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-3'
                  }`}
                >
                  <span className="whitespace-nowrap">搜索项目、API...</span>
                </div>
              </button>
            </div>
          )}

          {/* 主要功能按钮 */}
          <div className="p-3 space-y-1">
            {navigation.map(item => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={e => handleSidebarInteraction(e, item.href)}
                  className={`claude-nav-item group flex items-center text-sm rounded-lg transition-all duration-300 ${
                    item.isAction
                      ? 'bg-[#d97757] text-white hover:bg-[#e08663]'
                      : active
                        ? 'bg-[#404040] text-white'
                        : 'hover:bg-[#404040] hover:text-white'
                  } ${isSidebarCollapsed ? 'justify-center w-10 h-10' : 'px-3 py-2.5'}`}
                  title={isSidebarCollapsed ? item.name : ''}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isSidebarCollapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-3'
                    }`}
                  >
                    <span className="whitespace-nowrap">{item.name}</span>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* 分割线 */}
          <div className="mx-3 my-2"></div>

          {/* 功能模块导航 */}
          <div className="px-3 flex-1 space-y-1">
            {mainNavigation.map(item => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={e => handleMainNavClick(e, item.href)}
                  className={`claude-nav-item group flex items-center text-sm rounded-lg transition-all duration-300 ${
                    active
                      ? 'bg-[#404040] text-white'
                      : isSidebarCollapsed
                        ? 'hover:bg-[#d97757] hover:text-white'
                        : 'hover:bg-[#404040] hover:text-white'
                  } ${isSidebarCollapsed ? 'justify-center w-10 h-10' : 'px-3 py-2'}`}
                  title={isSidebarCollapsed ? item.name : ''}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isSidebarCollapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-3'
                    }`}
                  >
                    <span className="whitespace-nowrap">{item.name}</span>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* 间隔区域 - 收起时点击可展开 */}
          <div
            className={`flex-1 ${isSidebarCollapsed ? 'cursor-pointer' : ''}`}
            onClick={isSidebarCollapsed ? toggleSidebar : undefined}
          />

          {/* 底部用户菜单 */}
          <div className="p-3" ref={userMenuRef}>
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`claude-user-btn flex items-center rounded-lg hover:bg-[#404040] transition-colors duration-300 ${
                  isSidebarCollapsed ? 'justify-center w-10 h-10' : 'w-full px-2 py-2'
                }`}
                title={isSidebarCollapsed ? '用户菜单' : ''}
              >
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 rounded bg-[#d97757] flex items-center justify-center">
                    <span className="text-xs font-medium text-white">D</span>
                  </div>
                </div>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isSidebarCollapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-2'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-white whitespace-nowrap">开发者</p>
                      <p className="text-xs text-[#888] whitespace-nowrap">免费计划</p>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 flex-shrink-0 ml-2 ${
                        isUserMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>
              </button>

              {/* 用户下拉菜单 */}
              {isUserMenuOpen && (
                <div
                  className={`claude-user-menu absolute bottom-full mb-2 bg-[#2f2f2f] rounded-lg shadow-2xl border border-[#404040] py-1 z-50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-200 ${
                    isSidebarCollapsed ? 'left-full ml-2 w-48' : 'left-0 right-0'
                  }`}
                  style={{
                    boxShadow:
                      '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                    background: 'linear-gradient(145deg, #2f2f2f, #1a1a1a)',
                  }}
                >
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-white">开发者账户</p>
                    <p className="text-xs text-[#888]">dev@example.com</p>
                  </div>

                  <button
                    onClick={toggleDarkMode}
                    className="w-full flex items-center px-3 py-2 text-sm hover:bg-[#404040] transition-colors duration-200"
                  >
                    {isDark ? <Sun className="h-4 w-4 mr-3" /> : <Moon className="h-4 w-4 mr-3" />}
                    {isDark ? '浅色模式' : '暗色模式'}
                  </button>

                  <Link
                    to="/settings"
                    className="w-full flex items-center px-3 py-2 text-sm hover:bg-[#404040] transition-colors duration-200"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    设置
                  </Link>

                  <button className="w-full flex items-center px-3 py-2 text-sm hover:bg-[#404040] transition-colors duration-200">
                    <Languages className="h-4 w-4 mr-3" />
                    语言
                  </button>

                  <button className="w-full flex items-center px-3 py-2 text-sm hover:bg-[#404040] transition-colors duration-200">
                    <HelpCircle className="h-4 w-4 mr-3" />
                    获取帮助
                  </button>

                  <div className="mt-1 pt-1">
                    <button className="w-full flex items-center px-3 py-2 text-sm hover:bg-[#404040] transition-colors duration-200">
                      <LogOut className="h-4 w-4 mr-3" />
                      登出
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区域 - 完全独立的容器，不使用padding-left */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部搜索栏 - 只在非desktop模式下显示 */}
        {!isDesktopMode && (
          <div className="bg-bg-paper border-b border-border-primary px-6 py-1 flex-shrink-0">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full max-w-md flex items-center px-4 py-2 text-sm text-text-tertiary bg-bg-secondary rounded-lg hover:bg-bg-tertiary transition-colors duration-200"
            >
              <Search className="h-4 w-4 mr-3" />
              <span className="mr-auto">搜索项目、API...</span>
              <div className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 text-xs bg-bg-paper border border-border-primary rounded">
                  {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
                </kbd>
                <kbd className="px-1.5 py-0.5 text-xs bg-bg-paper border border-border-primary rounded">
                  K
                </kbd>
              </div>
            </button>
          </div>
        )}

        {/* 主内容区域 - 独立的滚动容器，滚动条只在这个区域内 */}
        <main className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          <Outlet />
        </main>
      </div>

      {/* 背景覆盖层 - 用于移动端 */}
      <div
        className={`fixed inset-0 bg-black z-40 lg:hidden transition-opacity duration-300 ${
          isSidebarCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-50 pointer-events-auto'
        }`}
        onClick={toggleSidebar}
      />

      {/* 快速搜索组件 */}
      <QuickSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  )
}

export default Layout
