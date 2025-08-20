import { Clock, Code, Command, Folder, Loader, Search, Tag, X } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMCPSearch } from '../../../../hooks/useMCPSearch'
import { debounce } from '../../../../utils/debounce'

interface SearchResult {
  type: 'project' | 'api' | 'tag'
  id: string
  title: string
  subtitle?: string
  description?: string
  metadata?: any
  score?: number
}

interface QuickSearchProps {
  isOpen: boolean
  onClose: () => void
}

const QuickSearch: React.FC<QuickSearchProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [recentItems, setRecentItems] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [searchType, setSearchType] = useState<'all' | 'projects' | 'apis' | 'tags'>('all')

  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { searchGlobal, searchProjects, searchAPIs, searchTags, getRecentItems } = useMCPSearch()

  // 防抖搜索
  const debouncedSearch = useRef(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        let searchResults: SearchResult[] = []

        switch (searchType) {
          case 'all':
            const globalResults = await searchGlobal(searchQuery, ['projects', 'apis', 'tags'], 5)
            searchResults = [
              ...formatProjectResults(globalResults.data?.projects || []),
              ...formatAPIResults(globalResults.data?.apis || []),
              ...formatTagResults(globalResults.data?.tags || []),
            ]
            break
          case 'projects':
            const projects = await searchProjects(searchQuery, 10)
            searchResults = formatProjectResults(projects.results || [])
            break
          case 'apis':
            const apis = await searchAPIs(searchQuery, { limit: 15 })
            searchResults = formatAPIResults(apis.results || [])
            break
          case 'tags':
            const tags = await searchTags(searchQuery, { limit: 10 })
            searchResults = formatTagResults(tags.results || [])
            break
        }

        setResults(searchResults)
        setSelectedIndex(0)
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300)
  ).current

  // 格式化搜索结果
  const formatProjectResults = (projects: any[]): SearchResult[] => {
    return projects.map(project => ({
      type: 'project' as const,
      id: project.id,
      title: project.name,
      description: project.description,
      subtitle: `${project._count?.apis || 0} APIs, ${project._count?.tags || 0} 标签`,
      metadata: project,
    }))
  }

  const formatAPIResults = (apis: any[]): SearchResult[] => {
    return apis.map(api => ({
      type: 'api' as const,
      id: api.id,
      title: api.name,
      subtitle: `${api.method} ${api.path}`,
      description: api.description,
      metadata: api,
    }))
  }

  const formatTagResults = (tags: any[]): SearchResult[] => {
    return tags.map(tag => ({
      type: 'tag' as const,
      id: tag.id,
      title: tag.name,
      subtitle: `${tag._count?.apiTags || 0} APIs`,
      description: tag.project?.name ? `项目: ${tag.project.name}` : '',
      metadata: tag,
    }))
  }

  // 加载最近项目
  const loadRecentItems = async () => {
    try {
      const recent = await getRecentItems(8)
      const recentResults = [
        ...formatProjectResults(recent.projects || []),
        ...formatAPIResults(recent.apis || []),
      ]
      setRecentItems(recentResults)
    } catch (error) {
      console.error('Failed to load recent items:', error)
    }
  }

  // 处理搜索
  useEffect(() => {
    if (query.trim()) {
      debouncedSearch(query)
    } else {
      setResults([])
      setIsLoading(false)
    }
  }, [query, searchType, debouncedSearch])

  // 加载最近项目
  useEffect(() => {
    if (isOpen) {
      loadRecentItems()
      // 聚焦输入框
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // 键盘导航和全局ESC监听
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const displayResults = query.trim() ? results : recentItems

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(Math.min(selectedIndex + 1, displayResults.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(Math.max(selectedIndex - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (displayResults[selectedIndex]) {
          handleResultSelect(displayResults[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }

  // 全局ESC键监听
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleGlobalKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [isOpen, onClose])

  // 处理结果选择
  const handleResultSelect = (result: SearchResult) => {
    switch (result.type) {
      case 'project':
        navigate(`/projects/${result.id}`)
        break
      case 'api':
        navigate(`/projects/${result.metadata.projectId}?apiId=${result.id}`)
        break
      case 'tag':
        navigate(`/projects/${result.metadata.projectId}?tag=${result.id}`)
        break
    }
    onClose()
  }

  // 获取结果图标
  const getResultIcon = (type: string) => {
    switch (type) {
      case 'project':
        return <Folder className="h-4 w-4" />
      case 'api':
        return <Code className="h-4 w-4" />
      case 'tag':
        return <Tag className="h-4 w-4" />
      default:
        return <Search className="h-4 w-4" />
    }
  }

  // 获取方法颜色
  const getMethodColor = (method: string) => {
    const colors = {
      GET: 'text-blue-600 bg-primary-50 dark:bg-primary-900/20 dark:text-blue-400 dark:bg-blue-900/30',
      POST: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30',
      PUT: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30',
      PATCH: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/30',
      DELETE: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30',
    }
    return colors[method as keyof typeof colors] || 'text-text-secondary bg-bg-tertiary'
  }

  if (!isOpen) return null

  const displayResults = query.trim() ? results : recentItems
  const showEmpty = query.trim() && !isLoading && results.length === 0

  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-start justify-center pt-20"
      onClick={onClose}
    >
      <div 
        className="bg-bg-paper rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-96"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 搜索头部 */}
        <div className="flex items-center px-4 py-3 border-b border-border-primary">
          <Search className="h-5 w-5 text-text-tertiary mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="搜索项目、API、标签..."
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 text-lg outline-none placeholder-text-tertiary bg-transparent text-text-primary"
          />

          {/* 搜索类型选择 */}
          <div className="flex items-center space-x-2 mx-4">
            {(['all', 'projects', 'apis', 'tags'] as const).map(type => (
              <button
                key={type}
                onClick={() => setSearchType(type)}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  searchType === type
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-text-tertiary hover:text-text-secondary'
                }`}
              >
                {type === 'all'
                  ? '全部'
                  : type === 'projects'
                    ? '项目'
                    : type === 'apis'
                      ? 'API'
                      : '标签'}
              </button>
            ))}
          </div>

          <button
            onClick={onClose}
            className="p-1 text-text-tertiary hover:text-text-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 搜索结果 */}
        <div className="max-h-80 overflow-y-auto scrollbar-thin">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-text-secondary">搜索中...</span>
            </div>
          )}

          {showEmpty && (
            <div className="flex flex-col items-center justify-center py-8 text-text-tertiary">
              <Search className="h-8 w-8 mb-2" />
              <p>未找到相关结果</p>
            </div>
          )}

          {!query.trim() && recentItems.length > 0 && (
            <div className="p-3 border-b border-border-secondary">
              <div className="flex items-center text-sm text-text-tertiary mb-2">
                <Clock className="h-4 w-4 mr-1" />
                最近访问
              </div>
            </div>
          )}

          {displayResults.map((result, index) => (
            <div
              key={`${result.type}-${result.id}`}
              onClick={() => handleResultSelect(result)}
              className={`flex items-center px-4 py-3 cursor-pointer transition-colors ${
                index === selectedIndex
                  ? 'bg-primary-50 border-r-2 border-primary-500 dark:bg-primary-900/20 dark:border-primary-400'
                  : 'hover:bg-bg-tertiary'
              }`}
            >
              <div className="flex-shrink-0 mr-3">
                <div
                  className={`p-2 rounded-lg ${
                    result.type === 'project'
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : result.type === 'api'
                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                  }`}
                >
                  {getResultIcon(result.type)}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <h3 className="font-medium text-text-primary truncate">{result.title}</h3>
                  {result.type === 'api' && result.metadata?.method && (
                    <span
                      className={`ml-2 px-2 py-1 text-xs font-medium rounded ${getMethodColor(result.metadata.method)}`}
                    >
                      {result.metadata.method}
                    </span>
                  )}
                </div>

                {result.subtitle && (
                  <p className="text-sm text-text-secondary truncate">{result.subtitle}</p>
                )}

                {result.description && (
                  <p className="text-xs text-text-tertiary truncate mt-1">{result.description}</p>
                )}
              </div>

              {result.score && (
                <div className="flex-shrink-0 text-xs text-text-tertiary">
                  {Math.round((1 - result.score) * 100)}%
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 快捷键提示 */}
        <div className="px-4 py-2 bg-bg-tertiary border-t border-border-primary">
          <div className="flex items-center justify-between text-xs text-text-tertiary">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <kbd className="px-2 py-1 bg-bg-paper border border-border-secondary rounded text-xs">
                  ↑↓
                </kbd>
                <span className="ml-1">导航</span>
              </span>
              <span className="flex items-center">
                <kbd className="px-2 py-1 bg-bg-paper border border-border-secondary rounded text-xs">
                  Enter
                </kbd>
                <span className="ml-1">选择</span>
              </span>
              <span className="flex items-center">
                <kbd className="px-2 py-1 bg-bg-paper border border-border-secondary rounded text-xs">
                  Esc
                </kbd>
                <span className="ml-1">关闭</span>
              </span>
            </div>
            <div className="flex items-center">
              <Command className="h-3 w-3 mr-1" />
              <span>MCP 驱动</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuickSearch
