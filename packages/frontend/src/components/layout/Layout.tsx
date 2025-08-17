import React, { useState, useEffect, useRef } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  Folder, 
  Import, 
  Settings, 
  BookOpen, 
  Search, 
  Menu, 
  BarChart3, 
  Sun, 
  Moon,
  Plus,
  MessageSquare,
  Archive,
  User,
  ChevronDown,
  Languages,
  HelpCircle,
  LogOut,
  X
} from 'lucide-react'
import QuickSearch from '../features/search/components/QuickSearch'
import { debug, useDebugComponent } from '../../debug'
import { useTheme } from '../../contexts/ThemeContext'
import './Layout.css'

const Layout: React.FC = () => {
  const location = useLocation()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    // 从localStorage读取用户偏好
    const saved = localStorage.getItem('devapi-sidebar-collapsed')
    return saved ? JSON.parse(saved) : false
  })
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { isDark, toggleDarkMode } = useTheme()
  const userMenuRef = useRef<HTMLDivElement>(null)

  // 调试组件状态跟踪
  useDebugComponent('Layout', {
    currentPath: location.pathname,
    isSearchOpen,
    isSidebarCollapsed,
    timestamp: Date.now()
  })

  // 切换侧边栏状态
  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed
    setIsSidebarCollapsed(newState)
    // 保存用户偏好到localStorage
    localStorage.setItem('devapi-sidebar-collapsed', JSON.stringify(newState))
    debug.log('侧边栏状态切换', { 
      collapsed: newState,
      currentPath: location.pathname 
    }, 'Layout')
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
    debug.log('路由变化', {
      from: 'Layout',
      path: location.pathname,
      search: location.search,
      timestamp: new Date().toISOString()
    }, 'Layout')

    // 模拟页面性能监控
    const timer = debug.time(`页面加载: ${location.pathname}`)
    
    // 模拟页面加载完成
    setTimeout(() => {
      timer.end()
    }, Math.random() * 200 + 100)

  }, [location.pathname])

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K 打开搜索
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        debug.log('用户使用快捷键打开搜索', { 
          shortcut: 'Ctrl+K',
          currentPath: location.pathname 
        }, 'Layout')
        setIsSearchOpen(true)
      }
      
      // Cmd/Ctrl + B 切换侧边栏
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        debug.log('用户使用快捷键切换侧边栏', { 
          shortcut: 'Ctrl+B',
          currentPath: location.pathname,
          collapsed: !isSidebarCollapsed
        }, 'Layout')
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

  const navigation = [
    { name: '新建项目', href: '/projects/new', icon: Plus, isAction: true },
    { name: '对话', href: '/chats', icon: MessageSquare },
    { name: '归档', href: '/archive', icon: Archive },
  ]

  const recentItems = [
    '中文文档翻译',
    'API管理系统',
    '数据库设计',
    '项目开发进度',
  ]

  const mainNavigation = [
    { name: '首页', href: '/', icon: Home },
    { name: '仪表板', href: '/dashboard', icon: BarChart3 },
    { name: '项目', href: '/projects', icon: Folder },
    { name: '导入', href: '/import/documents', icon: Import },
    { name: '设置', href: '/settings', icon: Settings },
  ]

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-bg-secondary transition-colors duration-300">
      {/* Claude Desktop 风格侧边栏 */}
      <div 
        className={`claude-sidebar group fixed inset-y-0 left-0 z-50 bg-[#2f2f2f] text-[#b8b8b8] transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'w-12' : 'w-64'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* 顶部Logo和收起按钮 */}
          <div className="flex h-12 items-center justify-between px-3 border-b border-[#404040]">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded hover:bg-[#404040] transition-colors duration-200"
                title={isSidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
              >
                <Menu className="h-4 w-4" />
              </button>
              {!isSidebarCollapsed && (
                <span className="text-lg font-semibold text-white">DevAPI</span>
              )}
            </div>
          </div>

          {/* 主要功能按钮 */}
          <div className="p-3 space-y-1">
            {navigation.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`claude-nav-item group flex items-center px-3 py-2.5 text-sm rounded-lg transition-all duration-200 ${
                    item.isAction
                      ? 'bg-[#d97757] text-white hover:bg-[#e08663]'
                      : active
                      ? 'bg-[#404040] text-white'
                      : 'hover:bg-[#404040] hover:text-white'
                  } ${isSidebarCollapsed ? 'justify-center px-2' : ''}`}
                  title={isSidebarCollapsed ? item.name : ''}
                >
                  <item.icon className={`h-4 w-4 flex-shrink-0 ${isSidebarCollapsed ? '' : 'mr-3'}`} />
                  {!isSidebarCollapsed && (
                    <span className="transition-opacity duration-200">{item.name}</span>
                  )}
                </Link>
              )
            })}
          </div>

          {/* 最近项目 */}
          {!isSidebarCollapsed && (
            <div className="px-3 py-2">
              <h3 className="text-xs font-medium text-[#888] uppercase tracking-wider mb-2">
                最近项目
              </h3>
              <div className="space-y-1">
                {recentItems.map((item, index) => (
                  <Link
                    key={index}
                    to={`/recent/${index}`}
                    className="block px-3 py-1.5 text-sm rounded hover:bg-[#404040] hover:text-white transition-colors duration-200 truncate"
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 间隔区域 */}
          <div className="flex-1" />

          {/* 底部用户菜单 */}
          <div className="border-t border-[#404040] p-3" ref={userMenuRef}>
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`claude-user-btn w-full flex items-center px-2 py-2 rounded-lg hover:bg-[#404040] transition-colors duration-200 ${
                  isSidebarCollapsed ? 'justify-center' : ''
                }`}
                title={isSidebarCollapsed ? '用户菜单' : ''}
              >
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 rounded bg-[#d97757] flex items-center justify-center">
                    <span className="text-xs font-medium text-white">D</span>
                  </div>
                </div>
                {!isSidebarCollapsed && (
                  <>
                    <div className="ml-2 flex-1 text-left">
                      <p className="text-sm font-medium text-white">开发者</p>
                      <p className="text-xs text-[#888]">免费计划</p>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                      isUserMenuOpen ? 'rotate-180' : ''
                    }`} />
                  </>
                )}
              </button>

              {/* 用户下拉菜单 */}
              {isUserMenuOpen && (
                <div className={`claude-user-menu absolute bottom-full mb-2 bg-[#2f2f2f] border border-[#404040] rounded-lg shadow-lg py-1 z-50 ${
                  isSidebarCollapsed ? 'left-full ml-2 w-48' : 'left-0 right-0'
                }`}>
                  <div className="px-3 py-2 border-b border-[#404040]">
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
                  
                  <div className="border-t border-[#404040] mt-1 pt-1">
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

        {/* 收起状态下的额外导航 */}
        {isSidebarCollapsed && (
          <div className="absolute top-16 left-full ml-2 hidden group-hover:block">
            <div className="bg-[#2f2f2f] border border-[#404040] rounded-lg shadow-lg py-2 px-1 min-w-[200px]">
              {mainNavigation.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-2 text-sm rounded hover:bg-[#404040] transition-colors duration-200 ${
                      active ? 'bg-[#404040] text-white' : 'text-[#b8b8b8]'
                    }`}
                  >
                    <item.icon className="h-4 w-4 mr-3" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* 主内容区域 */}
      <div 
        className={`content-transition transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'pl-12' : 'pl-64'
        }`}
      >
        {/* 顶部搜索栏 */}
        <div className="bg-bg-paper border-b border-border-primary px-6 py-3">
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
              <kbd className="px-1.5 py-0.5 text-xs bg-bg-paper border border-border-primary rounded">K</kbd>
            </div>
          </button>
        </div>

        <main className="min-h-[calc(100vh-60px)] p-6">
          <Outlet />
        </main>
      </div>

      {/* 背景覆盖层 - 用于移动端 */}
      {!isSidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* 快速搜索组件 */}
      <QuickSearch 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </div>
  )
}

export default Layout