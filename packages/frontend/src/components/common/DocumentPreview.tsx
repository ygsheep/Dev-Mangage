import React from 'react'
import CodeHighlight from '../common/CodeHighlight'

interface DocumentPreviewProps {
  content: string
  type: 'markdown' | 'json' | 'javascript' | 'typescript' | 'text'
  title?: string
  showLineNumbers?: boolean
  maxHeight?: string
  className?: string
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  content,
  type,
  title = '文档预览',
  showLineNumbers = false,
  maxHeight = '400px',
  className = ''
}) => {
  if (!content || content.trim() === '') {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 text-center ${className}`}>
        <p className="text-gray-500 text-sm">暂无内容</p>
      </div>
    )
  }

  // 根据文档类型确定语言
  const getLanguage = (docType: string) => {
    switch (docType) {
      case 'markdown':
        return 'markdown'
      case 'json':
        return 'json'
      case 'javascript':
        return 'javascript'
      case 'typescript':
        return 'typescript'
      default:
        return 'text'
    }
  }

  const language = getLanguage(type)

  return (
    <div className={className}>
      <div className="mb-2">
        <h4 className="text-sm font-medium text-gray-900">
          {title} ({type.toUpperCase()})
        </h4>
      </div>
      <CodeHighlight
        code={content}
        language={language}
        showLineNumbers={showLineNumbers}
        showCopyButton={true}
        maxHeight={maxHeight}
      />
    </div>
  )
}

export default DocumentPreview