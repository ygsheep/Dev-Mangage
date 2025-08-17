import React, { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Home, Folder, Import, Settings, BookOpen, Search, ChevronLeft, ChevronRight, BarChart3, Sun, Moon } from 'lucide-react'
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
  const { isDark, toggleDarkMode } = useTheme()

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
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [location.pathname, isSidebarCollapsed, toggleSidebar])

  const navigation = [
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
      {/* 侧边栏 */}
      <div 
        className={`sidebar-transition fixed inset-y-0 left-0 z-50 bg-bg-paper shadow-lg border-r border-border-primary ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="logo-container flex h-16 items-center gap-3 px-6 border-b border-border-primary relative">
            {!isSidebarCollapsed && (
              <>
                <BookOpen className="logo-icon h-8 w-8 text-primary-600" />
                <span className="text-xl font-bold text-text-primary text-fade-in">DevAPI</span>
              </>
            )}
            {isSidebarCollapsed && (
              <div className="flex items-center justify-center w-full">
                <BookOpen className="logo-icon h-6 w-6 text-primary-600" />
              </div>
            )}
            
            {/* 折叠/展开按钮 */}
            <button
              onClick={toggleSidebar}
              className="sidebar-toggle-btn absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-bg-paper border border-border-primary rounded-full shadow-sm flex items-center justify-center group z-10"
              title={isSidebarCollapsed ? '展开侧边栏 (Ctrl+B)' : '折叠侧边栏 (Ctrl+B)'}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="h-3 w-3 text-text-secondary group-hover:text-primary-600 transition-colors duration-200" />
              ) : (
                <ChevronLeft className="h-3 w-3 text-text-secondary group-hover:text-primary-600 transition-colors duration-200" />
              )}
            </button>
          </div>

          {/* 搜索按钮 */}
          <div className="px-3 py-4">
            <button
              onClick={() => {
                debug.log('用户点击搜索按钮', { currentPath: location.pathname }, 'Layout')
                setIsSearchOpen(true)
              }}
              className={`search-button w-full flex items-center px-3 py-2 text-sm text-text-tertiary bg-bg-tertiary rounded-lg hover:bg-bg-secondary transition-all duration-200 ${
                isSidebarCollapsed ? 'justify-center' : ''
              }`}
              title={isSidebarCollapsed ? '搜索 (Ctrl+K)' : ''}
            >
              <Search className="h-4 w-4 flex-shrink-0" />
              {!isSidebarCollapsed && (
                <>
                  <span className="mr-auto ml-3 transition-opacity duration-200">搜索...</span>
                  <div className="flex items-center space-x-1 transition-opacity duration-200">
                    <kbd className="px-1.5 py-0.5 text-xs bg-bg-paper border border-border-primary rounded">
                      {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
                    </kbd>
                    <kbd className="px-1.5 py-0.5 text-xs bg-bg-paper border border-border-primary rounded">K</kbd>
                  </div>
                </>
              )}
            </button>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => {
                    debug.log('用户点击导航', { 
                      from: location.pathname,
                      to: item.href,
                      name: item.name 
                    }, 'Layout')
                  }}
                  className={`nav-item group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                  } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                  title={isSidebarCollapsed ? item.name : ''}
                >
                  <item.icon
                    className={`h-5 w-5 flex-shrink-0 transition-all duration-200 ${
                      active ? 'text-primary-500' : 'text-text-tertiary group-hover:text-text-secondary'
                    } ${isSidebarCollapsed ? '' : 'mr-3'}`}
                  />
                  {!isSidebarCollapsed && (
                    <span className="transition-opacity duration-200">{item.name}</span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* 底部控制区域 */}
          <div className="border-t border-border-primary p-4 space-y-3">
            {/* 主题切换按钮 */}
            <div className={`flex ${isSidebarCollapsed ? 'justify-center' : ''}`}>
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-all duration-200 hover:bg-bg-tertiary group ${
                  isSidebarCollapsed ? '' : 'w-full flex items-center gap-3'
                }`}
                title={isSidebarCollapsed ? (isDark ? '切换到浅色模式' : '切换到暗色模式') : ''}
              >
                {isDark ? (
                  <Sun className="h-4 w-4 text-text-secondary group-hover:text-yellow-500 transition-colors duration-200" />
                ) : (
                  <Moon className="h-4 w-4 text-text-secondary group-hover:text-primary-500 transition-colors duration-200" />
                )}
                {!isSidebarCollapsed && (
                  <span className="text-sm text-text-secondary">
                    {isDark ? '浅色模式' : '暗色模式'}
                  </span>
                )}
              </button>
            </div>
            
            {/* 用户信息 */}
            <div className={`flex items-center transition-all duration-200 ${
              isSidebarCollapsed ? 'justify-center' : ''
            }`}>
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-600">D</span>
                </div>
              </div>
              {!isSidebarCollapsed && (
                <div className="ml-3 transition-opacity duration-200">
                  <p className="text-sm font-medium text-text-primary">Developer</p>
                  <p className="text-xs text-text-tertiary">v1.0.0</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div 
        className={`content-transition ${
          isSidebarCollapsed ? 'pl-16' : 'pl-64'
        }`}
      >
        <main className="min-h-screen p-6">
          <Outlet />
        </main>
      </div>

      {/* 快速搜索组件 */}
      <QuickSearch 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </div>
  )
}

export default Layout