import MarkdownPreview from '@uiw/react-markdown-preview'
import { Bold, Code, Edit3, Eye, Italic, Link, List, Quote } from 'lucide-react'
import React, { useState } from 'react'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  label?: string
  required?: boolean
  className?: string
  showToolbar?: boolean
  showCharCount?: boolean
  helpText?: string
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = '使用 Markdown 语法编写内容...',
  rows = 6,
  label,
  required = false,
  className = '',
  showToolbar = true,
  showCharCount = true,
  helpText,
}) => {
  const [mode, setMode] = useState<'write' | 'preview'>('write')

  // 插入文本的通用函数
  const insertText = (before: string, after: string = '', selectText: string = '') => {
    const textarea = document.querySelector(`textarea[data-markdown-editor]`) as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const selectedText = text.substring(start, end) || selectText
    const newText = text.substring(0, start) + before + selectedText + after + text.substring(end)

    onChange(newText)

    // 恢复光标位置
    setTimeout(() => {
      const newCursorPos = start + before.length + selectedText.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
      textarea.focus()
    }, 0)
  }

  // 工具栏按钮
  const toolbarButtons = [
    {
      icon: Bold,
      tooltip: '粗体',
      action: () => insertText('**', '**', '粗体文本'),
    },
    {
      icon: Italic,
      tooltip: '斜体',
      action: () => insertText('*', '*', '斜体文本'),
    },
    {
      icon: Code,
      tooltip: '代码',
      action: () => insertText('`', '`', '代码'),
    },
    {
      icon: Link,
      tooltip: '链接',
      action: () => insertText('[', '](URL)', '链接文本'),
    },
    {
      icon: List,
      tooltip: '列表',
      action: () => insertText('\n- ', '\n', '列表项'),
    },
    {
      icon: Quote,
      tooltip: '引用',
      action: () => insertText('> ', '', '引用内容'),
    },
  ]

  const defaultPlaceholder = `${placeholder}

示例格式：
## 标题
正文内容...

### 子标题
- 列表项 1
- 列表项 2

**粗体文本** 和 *斜体文本*

\`内联代码\` 和代码块：

\`\`\`javascript
// 代码示例
console.log('Hello World');
\`\`\`

> 引用内容

[链接文本](URL)`

  return (
    <div className={`space-y-2 ${className}`}>
      {/* 标签 */}
      {label && (
        <label className="block text-sm font-medium text-text-secondary">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* 编辑器容器 */}
      <div className="bg-bg-paper border border-border-primary rounded-lg">
        {/* 编辑器头部 - Write/Preview 切换 */}
        <div className="flex items-center justify-between px-4 py-2 bg-bg-tertiary border-b border-border-primary rounded-t-lg">
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setMode('write')}
              className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                mode === 'write'
                  ? 'bg-bg-paper dark:bg-gray-700 text-text-primary border border-blue-500 shadow-sm'
                  : 'text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary'
              }`}
            >
              <Edit3 className="w-4 h-4 inline-block mr-1" />
              编辑
            </button>
            <button
              type="button"
              onClick={() => setMode('preview')}
              className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                mode === 'preview'
                  ? 'bg-bg-paper dark:bg-gray-700 text-text-primary border border-blue-500 shadow-sm'
                  : 'text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary'
              }`}
              disabled={!value.trim()}
            >
              <Eye className="w-4 h-4 inline-block mr-1" />
              预览
            </button>
          </div>

          {/* Markdown 工具栏 */}
          {showToolbar && mode === 'write' && (
            <div className="flex items-center space-x-1">
              {toolbarButtons.map((button, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={button.action}
                  className="p-1 text-text-tertiary hover:text-text-primary rounded transition-colors"
                  title={button.tooltip}
                >
                  <button.icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 编辑器内容区 */}
        <div className="p-4">
          {mode === 'write' ? (
            <textarea
              data-markdown-editor
              value={value}
              onChange={e => onChange(e.target.value)}
              rows={rows}
              className="w-full bg-transparent text-text-primary placeholder-text-tertiary border-none resize-none focus:outline-none"
              placeholder={defaultPlaceholder}
            />
          ) : (
            <div className={`min-h-[${rows * 24}px]`}>
              {value.trim() ? (
                <div className="markdown-content">
                  <MarkdownPreview
                    source={value}
                    data-color-mode={
                      document.documentElement.classList.contains('dark') ? 'dark' : 'light'
                    }
                    style={{
                      backgroundColor: 'transparent',
                      padding: 0,
                      fontSize: '14px',
                    }}
                  />
                </div>
              ) : (
                <p className="text-text-tertiary italic">暂无内容预览</p>
              )}
            </div>
          )}
        </div>

        {/* 编辑器底部 */}
        <div className="flex items-center justify-between px-4 py-2 bg-bg-tertiary border-t border-border-primary rounded-b-lg">
          <div className="text-xs text-text-tertiary">
            <span>{helpText || '支持 Markdown 语法，可使用工具栏快速插入格式'}</span>
          </div>
          {showCharCount && value.length > 0 && (
            <span className="text-xs text-text-tertiary">{value.length} 字符</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default MarkdownEditor
