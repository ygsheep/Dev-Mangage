import React, { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Home, Folder, Import, Settings, BookOpen, Search } from 'lucide-react'
import QuickSearch from './QuickSearch'
import { debug, useDebugComponent } from '../debug'

const Layout: React.FC = () => {
  const location = useLocation()
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // 调试组件状态跟踪
  useDebugComponent('Layout', {
    currentPath: location.pathname,
    isSearchOpen,
    timestamp: Date.now()
  })

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
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [location.pathname])

  const navigation = [
    { name: '首页', href: '/', icon: Home },
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
    <div className="min-h-screen bg-gray-50">
      {/* 侧边栏 */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 px-6 border-b border-gray-200">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">DevAPI</span>
          </div>

          {/* 搜索按钮 */}
          <div className="px-3 py-4">
            <button
              onClick={() => {
                debug.log('用户点击搜索按钮', { currentPath: location.pathname }, 'Layout')
                setIsSearchOpen(true)
              }}
              className="w-full flex items-center px-3 py-2 text-sm text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Search className="h-4 w-4 mr-3" />
              <span>搜索...</span>
              <div className="ml-auto flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 text-xs bg-white border border-gray-300 rounded">
                  {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
                </kbd>
                <kbd className="px-1.5 py-0.5 text-xs bg-white border border-gray-300 rounded">K</kbd>
              </div>
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
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      active ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* 底部信息 */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">D</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">Developer</p>
                <p className="text-xs text-gray-500">v1.0.0</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="pl-64">
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