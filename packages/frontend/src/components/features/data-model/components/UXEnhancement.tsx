import React, { useState, useEffect, useCallback } from 'react'
import {
  Keyboard,
  HelpCircle,
  X,
  Search,
  Plus,
  Save,
  Copy,
  Download,
  Upload,
  Eye,
  Edit3,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Command,
  Zap,
  MousePointer,
  Info
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Shortcut {
  id: string
  keys: string[]
  description: string
  category: 'navigation' | 'editing' | 'actions' | 'general'
  action?: () => void
}

interface UXEnhancementProps {
  onShortcutTrigger?: (shortcutId: string) => void
}

const UXEnhancement: React.FC<UXEnhancementProps> = ({ onShortcutTrigger }) => {
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showTips, setShowTips] = useState(false)
  const [currentTip, setCurrentTip] = useState(0)
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set())

  // 快捷键配置
  const shortcuts: Shortcut[] = [
    // 导航类
    {
      id: 'goto-overview',
      keys: ['g', 'o'],
      description: '跳转到概览页面',
      category: 'navigation'
    },
    {
      id: 'goto-diagram',
      keys: ['g', 'd'],
      description: '跳转到ER图设计',
      category: 'navigation'
    },
    {
      id: 'goto-relationships',
      keys: ['g', 'r'],
      description: '跳转到关系管理',
      category: 'navigation'
    },
    {
      id: 'goto-sql',
      keys: ['g', 's'],
      description: '跳转到SQL生成',
      category: 'navigation'
    },

    // 编辑类
    {
      id: 'create-table',
      keys: ['c', 't'],
      description: '创建新表',
      category: 'editing'
    },
    {
      id: 'create-field',
      keys: ['c', 'f'],
      description: '添加字段',
      category: 'editing'
    },
    {
      id: 'create-index',
      keys: ['c', 'i'],
      description: '创建索引',
      category: 'editing'
    },
    {
      id: 'create-relationship',
      keys: ['c', 'r'],
      description: '创建关系',
      category: 'editing'
    },

    // 操作类
    {
      id: 'search',
      keys: ['/', '/'],
      description: '全局搜索',
      category: 'actions'
    },
    {
      id: 'save',
      keys: ['Ctrl', 's'],
      description: '保存当前修改',
      category: 'actions'
    },
    {
      id: 'copy',
      keys: ['Ctrl', 'c'],
      description: '复制选中内容',
      category: 'actions'
    },
    {
      id: 'export',
      keys: ['Ctrl', 'e'],
      description: '导出SQL',
      category: 'actions'
    },

    // 通用类
    {
      id: 'help',
      keys: ['?'],
      description: '显示帮助',
      category: 'general'
    },
    {
      id: 'shortcuts',
      keys: ['Ctrl', 'k'],
      description: '显示快捷键',
      category: 'general'
    },
    {
      id: 'undo',
      keys: ['Ctrl', 'z'],
      description: '撤销操作',
      category: 'general'
    },
    {
      id: 'redo',
      keys: ['Ctrl', 'y'],
      description: '重做操作',
      category: 'general'
    }
  ]

  // 使用提示
  const tips = [
    {
      title: '快速创建表',
      description: '使用快捷键 C + T 可以快速打开创建表对话框',
      icon: Plus
    },
    {
      title: '拖拽排序',
      description: '在字段列表中可以通过拖拽来调整字段顺序',
      icon: MousePointer
    },
    {
      title: '批量操作',
      description: '选中多个字段或索引后，可以进行批量删除操作',
      icon: Edit3
    },
    {
      title: 'AI智能建议',
      description: '系统会根据表结构自动推荐最优的索引配置',
      icon: Zap
    },
    {
      title: '实时协作',
      description: '团队成员可以实时查看和评论您的数据模型变更',
      icon: Info
    }
  ]

  // 键盘事件处理
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const key = event.key.toLowerCase()
    const newPressedKeys = new Set(pressedKeys)
    
    // 添加特殊键
    if (event.ctrlKey) newPressedKeys.add('ctrl')
    if (event.altKey) newPressedKeys.add('alt')
    if (event.shiftKey) newPressedKeys.add('shift')
    if (event.metaKey) newPressedKeys.add('cmd')
    
    newPressedKeys.add(key)
    setPressedKeys(newPressedKeys)

    // 检查快捷键匹配
    const matchedShortcut = shortcuts.find(shortcut => {
      const shortcutKeys = shortcut.keys.map(k => k.toLowerCase())
      return shortcutKeys.length === newPressedKeys.size &&
             shortcutKeys.every(k => newPressedKeys.has(k))
    })

    if (matchedShortcut) {
      // 特殊处理某些快捷键，避免干扰浏览器默认行为
      if (matchedShortcut.id === 'copy') {
        const selection = window.getSelection()
        if (selection && selection.toString().length > 0) {
          // 有文本选中，不阻止默认行为，让浏览器执行复制
          return
        }
      }
      
      // 特殊处理 Ctrl+S：在输入框焦点时允许默认行为
      if (matchedShortcut.id === 'save') {
        const activeElement = document.activeElement
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable)) {
          // 在输入框中，不阻止默认行为
          return
        }
      }
      
      event.preventDefault()
      handleShortcutAction(matchedShortcut)
    }
  }, [pressedKeys, shortcuts])

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    // 清空按键状态
    setTimeout(() => setPressedKeys(new Set()), 100)
  }, [])

  // 快捷键动作处理
  const handleShortcutAction = (shortcut: Shortcut) => {
    switch (shortcut.id) {
      case 'help':
        setShowTips(true)
        break
      case 'shortcuts':
        setShowShortcuts(true)
        break
      case 'search':
        // 聚焦到搜索框
        const searchInput = document.querySelector('input[placeholder*="搜索"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
          searchInput.select()
        }
        break
      default:
        if (onShortcutTrigger) {
          onShortcutTrigger(shortcut.id)
        }
        toast.success(`快捷键: ${shortcut.description}`)
    }
  }

  // 绑定键盘事件
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  // 自动显示提示
  useEffect(() => {
    const hasSeenTips = localStorage.getItem('datamodel-tips-seen')
    if (!hasSeenTips) {
      setTimeout(() => {
        setShowTips(true)
      }, 3000)
    }
  }, [])

  // 下一个提示
  const nextTip = () => {
    setCurrentTip((prev) => (prev + 1) % tips.length)
  }

  // 上一个提示
  const prevTip = () => {
    setCurrentTip((prev) => (prev - 1 + tips.length) % tips.length)
  }

  // 关闭提示并记录
  const closeTips = () => {
    setShowTips(false)
    localStorage.setItem('datamodel-tips-seen', 'true')
  }

  // 按类别分组快捷键
  const groupedShortcuts = shortcuts.reduce((groups, shortcut) => {
    if (!groups[shortcut.category]) {
      groups[shortcut.category] = []
    }
    groups[shortcut.category].push(shortcut)
    return groups
  }, {} as Record<string, Shortcut[]>)

  const categoryNames = {
    navigation: '导航',
    editing: '编辑',
    actions: '操作',
    general: '通用'
  }

  return (
    <>
      {/* 快捷键显示 */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-paper rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Keyboard className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-semibold text-gray-900">快捷键指南</h2>
              </div>
              <button
                onClick={() => setShowShortcuts(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
                  <div key={category}>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {categoryNames[category as keyof typeof categoryNames]}
                    </h3>
                    <div className="space-y-3">
                      {shortcuts.map((shortcut) => (
                        <div key={shortcut.id} className="flex items-center justify-between">
                          <span className="text-sm text-text-primary">{shortcut.description}</span>
                          <div className="flex items-center space-x-1">
                            {shortcut.keys.map((key, index) => (
                              <React.Fragment key={index}>
                                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
                                  {key === 'ctrl' ? '⌃' : 
                                   key === 'cmd' ? '⌘' : 
                                   key === 'alt' ? '⌥' : 
                                   key === 'shift' ? '⇧' : key.toUpperCase()}
                                </kbd>
                                {index < shortcut.keys.length - 1 && (
                                  <span className="text-gray-400">+</span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-bg-secondary">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  按 <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Ctrl + K</kbd> 随时打开此面板
                </div>
                <button
                  onClick={() => setShowShortcuts(false)}
                  className="btn-primary"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 使用提示 */}
      {showTips && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-paper rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <HelpCircle className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-semibold text-gray-900">使用技巧</h2>
              </div>
              <button
                onClick={closeTips}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {React.createElement(tips[currentTip].icon, {
                    className: "w-8 h-8 text-blue-600"
                  })}
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {tips[currentTip].title}
                </h3>
                
                <p className="text-gray-600 mb-6">
                  {tips[currentTip].description}
                </p>

                <div className="flex items-center justify-center space-x-2 mb-6">
                  {tips.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTip(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentTip ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-bg-secondary">
              <button
                onClick={prevTip}
                className="btn-outline flex items-center space-x-2"
                disabled={currentTip === 0}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>上一个</span>
              </button>

              <span className="text-sm text-gray-500">
                {currentTip + 1} / {tips.length}
              </span>

              <button
                onClick={currentTip === tips.length - 1 ? closeTips : nextTip}
                className="btn-primary flex items-center space-x-2"
              >
                <span>{currentTip === tips.length - 1 ? '完成' : '下一个'}</span>
                {currentTip < tips.length - 1 && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 浮动帮助按钮 */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="flex flex-col space-y-2">
          <button
            onClick={() => setShowShortcuts(true)}
            className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-colors flex items-center justify-center"
            title="快捷键 (Ctrl+K)"
          >
            <Keyboard className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setShowTips(true)}
            className="w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition-colors flex items-center justify-center"
            title="使用技巧"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 键盘状态指示器（开发模式） */}
      {process.env.NODE_ENV === 'development' && pressedKeys.size > 0 && (
        <div className="fixed top-4 right-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm font-mono z-50">
          按键: {Array.from(pressedKeys).join(' + ')}
        </div>
      )}
    </>
  )
}

export default UXEnhancement