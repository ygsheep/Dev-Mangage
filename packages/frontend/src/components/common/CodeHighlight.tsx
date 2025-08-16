import React, { useEffect, useRef } from 'react'
import Prism from 'prismjs'
import 'prismjs/themes/prism-tomorrow.css' // 暗色主题
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-markdown'
import 'prismjs/plugins/line-numbers/prism-line-numbers.css'
import 'prismjs/plugins/line-numbers/prism-line-numbers'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface CodeHighlightProps {
  code: string
  language: string
  showLineNumbers?: boolean
  showCopyButton?: boolean
  className?: string
  maxHeight?: string
}

const CodeHighlight: React.FC<CodeHighlightProps> = ({
  code,
  language,
  showLineNumbers = false,
  showCopyButton = true,
  className = '',
  maxHeight = '400px'
}) => {
  const codeRef = useRef<HTMLElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current)
    }
  }, [code, language])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {/* 头部工具栏 */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-sm text-gray-400 ml-2">{language.toUpperCase()}</span>
        </div>
        
        {showCopyButton && (
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                <span>已复制</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>复制</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* 代码区域 */}
      <div 
        className="overflow-auto text-sm"
        style={{ maxHeight }}
      >
        <pre 
          className={`!bg-gray-900 !m-0 !p-4 ${showLineNumbers ? 'line-numbers' : ''}`}
          style={{ backgroundColor: 'transparent' }}
        >
          <code
            ref={codeRef}
            className={`language-${language} !bg-transparent`}
          >
            {code}
          </code>
        </pre>
      </div>
    </div>
  )
}

export default CodeHighlight