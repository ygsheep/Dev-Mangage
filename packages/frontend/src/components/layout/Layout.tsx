import { useQuery } from '@tanstack/react-query'
import {
  Archive,
  Bug,
  ChevronDown,
  Code2,
  Database,
  Folder,
  HelpCircle,
  Home,
  Languages,
  Layers,
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
import { apiMethods } from '../../utils/api'
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

  // 选中的项目状态管理
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => {
    // 从localStorage读取上次选择的项目
    return localStorage.getItem('devapi-selected-project') || null
  })

  // 检测是否在项目页面，并获取项目ID
  const projectMatch = location.pathname.match(/^\/projects\/([a-f0-9\-]{36})/)
  const currentProjectIdFromPath = projectMatch ? projectMatch[1] : null

  // 从查询参数中获取项目ID
  const searchParams = new URLSearchParams(location.search)
  const currentProjectIdFromQuery = searchParams.get('project')

  // 优先使用路径中的项目ID，其次使用查询参数中的项目ID
  const currentProjectId = currentProjectIdFromPath || currentProjectIdFromQuery
  const isInProject = !!currentProjectId

  // 当进入项目页面时，自动设置选中的项目
  useEffect(() => {
    if (currentProjectId && currentProjectId !== selectedProjectId) {
      setSelectedProjectId(currentProjectId)
      localStorage.setItem('devapi-selected-project', currentProjectId)
    }
  }, [currentProjectId, selectedProjectId])

  // 使用选中的项目ID（优先使用当前路由的项目ID）
  const activeProjectId = currentProjectId || selectedProjectId

  // 辅助函数：截断长文本
  const truncateText = (text: string, maxLength: number = 20): string => {
    if (!text) return ''
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
  }

  // 获取当前项目信息 - 使用activeProjectId以确保数据一致
  const {
    data: projectData,
    isLoading: isProjectLoading,
    error: projectError,
  } = useQuery({
    queryKey: ['project', activeProjectId],
    queryFn: () => apiMethods.getProject(activeProjectId!),
    enabled: !!activeProjectId,
  })

  // 获取项目列表用于侧边栏导航
  const { data: projectsData } = useQuery({
    queryKey: ['projects-sidebar'],
    queryFn: () => apiMethods.getProjects({ limit: 10 }),
    staleTime: 30000,
  })

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

  // 项目选择处理逻辑
  const handleProjectSelect = (e: React.MouseEvent, projectId: string) => {
    e.preventDefault() // 阻止默认导航

    setSelectedProjectId(projectId)
    localStorage.setItem('devapi-selected-project', projectId)

    debug.log(
      '选择项目',
      {
        projectId,
        currentPath: location.pathname,
        previousProjectId: currentProjectId,
      },
      'Layout'
    )

    // 导航到项目总览页面
    navigate(`/projects/${projectId}`)
  }

  // 清除项目选择
  const clearProjectSelection = () => {
    setSelectedProjectId(null)
    localStorage.removeItem('devapi-selected-project')
    navigate('/')
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
    { name: '项目', href: '/manage/projects', icon: Folder },
    { name: '对话', href: '/chats', icon: MessageSquare },
    { name: '归档', href: '/archive', icon: Archive },
  ]

  // 当选中项目时的项目功能导航
  const projectFunctionNavigation = activeProjectId
    ? [
        { name: 'API接口管理', href: `/manage/apis?project=${activeProjectId}`, icon: Code2 },
        {
          name: '数据模型管理',
          href: `/manage/data-models?project=${activeProjectId}`,
          icon: Database,
        },
        { name: '功能模块管理', href: `/projects/${activeProjectId}/features`, icon: Layers },
        { name: 'Issues管理', href: `/projects/${activeProjectId}/issues`, icon: Bug },
      ]
    : []

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/'
    }

    // 处理带查询参数的链接
    if (href.includes('?')) {
      const [hrefPath, hrefQuery] = href.split('?')
      const currentPath = location.pathname
      const currentQuery = location.search.slice(1) // 移除开头的?

      // 路径必须匹配，查询参数也要检查
      if (currentPath === hrefPath) {
        // 如果有查询参数，检查是否包含相同的参数
        if (hrefQuery && currentQuery) {
          const hrefParams = new URLSearchParams(hrefQuery)
          const currentParams = new URLSearchParams(currentQuery)
          // 检查href中的所有参数是否在当前URL中都存在且值相同
          for (const [key, value] of hrefParams.entries()) {
            if (currentParams.get(key) !== value) {
              return false
            }
          }
          return true
        }
        return !hrefQuery // 如果href没有查询参数，但路径匹配，则激活
      }
      return false
    }

    // 项目链接的特殊处理
    if (href.startsWith('/projects/')) {
      return location.pathname.startsWith(href)
    }

    return location.pathname.startsWith(href)
  }

  return (
    <div className="flex h-screen bg-bg-secondary">
      {/* Claude Desktop 风格侧边栏 */}
      <div
        className={`claude-sidebar group flex-shrink-0 text-[#b8b8b8] transition-all duration-300 ${
          isSidebarCollapsed
            ? 'w-12 bg-[#2f2f2f] hover:bg-[#1F1E1D] cursor-pointer'
            : 'w-64 bg-[#2f2f2f]'
        } ${isDesktopMode ? 'pb-8' : ''}`}
        title={isSidebarCollapsed ? '点击展开侧边栏' : ''}
      >
        <div className="flex h-full flex-col" onClick={e => e.stopPropagation()}>
          {/* 顶部Logo和收起按钮 */}
          <div
            className={`flex h-12 items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'px-3'}`}
          >
            <div
              className={`flex items-center w-full ${isSidebarCollapsed ? 'justify-center' : 'gap-2'}`}
            >
              <button
                onClick={toggleSidebar}
                className={`rounded hover:bg-[#404040] transition-colors duration-300 flex-shrink-0 ${
                  isSidebarCollapsed ? 'p-3 w-8 h-8 flex items-center justify-center' : 'px-2 py-2'
                }`}
                title={isSidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
              >
                <Menu className="w-4 h-4" />
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
            <div className={`py-2 ${isSidebarCollapsed ? 'px-2' : 'px-3'}`}>
              <button
                onClick={() => setIsSearchOpen(true)}
                className={`flex items-center text-sm rounded-lg transition-all duration-300 ${
                  isSidebarCollapsed
                    ? 'justify-center w-8 h-8 hover:bg-[#404040]'
                    : 'w-full px-3 py-2 text-[#b8b8b8] bg-[#404040] hover:bg-[#505050]'
                }`}
                title={isSidebarCollapsed ? '搜索' : '搜索项目、API...'}
              >
                <Search className="w-4 h-4 flex-shrink-0" />
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
          <div className={`space-y-1 ${isSidebarCollapsed ? 'px-2' : 'px-3'} py-3`}>
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
                  } ${isSidebarCollapsed ? 'justify-center w-8 h-8' : 'px-3 py-2.5'}`}
                  title={isSidebarCollapsed ? item.name : ''}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
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
          <div className={`flex-1 space-y-1 ${isSidebarCollapsed ? 'px-2' : 'px-3'}`}>
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
                  } ${isSidebarCollapsed ? 'justify-center w-8 h-8' : 'px-3 py-2'}`}
                  title={isSidebarCollapsed ? item.name : ''}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
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

            {/* 当前选中的项目显示 */}
            {activeProjectId && (
              <>
                {!isSidebarCollapsed && (
                  <div className="pt-4 pb-2">
                    <div className="px-2 flex items-center justify-between">
                      <div className="text-xs font-semibold text-[#888] uppercase tracking-wider">
                        当前项目
                      </div>
                      <button
                        onClick={clearProjectSelection}
                        className="text-xs text-[#888] hover:text-white transition-colors"
                        title="切换项目"
                      >
                        切换
                      </button>
                    </div>
                  </div>
                )}

                {/* 当前项目信息 - 可点击跳转到项目总览 */}
                <Link
                  to={`/projects/${activeProjectId}`}
                  className={`block rounded-lg hover:bg-[#4a4a4a] transition-colors ${
                    isSidebarCollapsed ? 'mx-0 mb-2' : 'mx-0 mb-2 p-2 bg-[#404040]'
                  }`}
                  title={isSidebarCollapsed ? '点击查看项目总览' : ''}
                >
                  {isSidebarCollapsed ? (
                    <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {projectData?.data?.project?.name?.charAt(0).toUpperCase() || 'P'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">
                          {projectData?.data?.project?.name?.charAt(0).toUpperCase() || 'P'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {projectData?.data?.project?.name || '加载中...'}
                        </p>
                        <p
                          className="text-[#888] text-xs truncate"
                          title={projectData?.data?.project?.description}
                        >
                          {projectData?.data?.project?.description
                            ? truncateText(projectData.data.project.description, 25)
                            : '暂无项目描述'}
                        </p>
                      </div>
                    </div>
                  )}
                </Link>

                {/* 项目功能导航 */}
                {!isSidebarCollapsed && (
                  <div className="pb-2">
                    <div className="px-2">
                      <div className="text-xs font-semibold text-[#888] uppercase tracking-wider">
                        项目功能
                      </div>
                    </div>
                  </div>
                )}

                {projectFunctionNavigation.map(item => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={e => handleMainNavClick(e, item.href)}
                      className={`claude-nav-item group flex items-center text-sm rounded-lg transition-all duration-300 mb-1 ${
                        active
                          ? 'bg-[#404040] text-white'
                          : isSidebarCollapsed
                            ? 'hover:bg-[#d97757] hover:text-white'
                            : 'hover:bg-[#404040] hover:text-white'
                      } ${isSidebarCollapsed ? 'justify-center w-8 h-8 mx-0' : 'px-3 py-2 mx-0'}`}
                      title={isSidebarCollapsed ? item.name : ''}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
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
              </>
            )}
          </div>

          {/* 间隔区域 - 收起时点击可展开 */}
          <div
            className={`flex-1 ${isSidebarCollapsed ? 'cursor-pointer' : ''}`}
            onClick={isSidebarCollapsed ? toggleSidebar : undefined}
          />

          {/* 底部用户菜单 */}
          <div className={`${isSidebarCollapsed ? 'px-2' : 'px-3'} py-3`} ref={userMenuRef}>
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`claude-user-btn flex items-center rounded-lg hover:bg-[#404040] transition-colors duration-300 ${
                  isSidebarCollapsed ? 'justify-center w-8 h-8' : 'w-full px-2 py-2'
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
                      className={`h-3 w-3 transition-transform duration-200 flex-shrink-0 ml-2 ${
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
                    {isDark ? <Sun className="w-3 h-3 mr-3" /> : <Moon className="w-3 h-3 mr-3" />}
                    {isDark ? '浅色模式' : '暗色模式'}
                  </button>

                  <Link
                    to="/settings"
                    className="w-full flex items-center px-3 py-2 text-sm hover:bg-[#404040] transition-colors duration-200"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Settings className="w-3 h-3 mr-3" />
                    设置
                  </Link>

                  <button className="w-full flex items-center px-3 py-2 text-sm hover:bg-[#404040] transition-colors duration-200">
                    <Languages className="w-3 h-3 mr-3" />
                    语言
                  </button>

                  <button className="w-full flex items-center px-3 py-2 text-sm hover:bg-[#404040] transition-colors duration-200">
                    <HelpCircle className="w-3 h-3 mr-3" />
                    获取帮助
                  </button>

                  <div className="mt-1 pt-1">
                    <button className="w-full flex items-center px-3 py-2 text-sm hover:bg-[#404040] transition-colors duration-200">
                      <LogOut className="w-3 h-3 mr-3" />
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
              <Search className="w-3 h-3 mr-3" />
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
        <main
          className={`flex-1 p-6 overflow-y-auto custom-scrollbar ${isDesktopMode ? 'pb-8' : ''}`}
        >
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
