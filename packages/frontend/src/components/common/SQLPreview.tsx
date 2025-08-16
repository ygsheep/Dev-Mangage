import React from 'react'
import CodeHighlight from '../common/CodeHighlight'

interface SQLPreviewProps {
  sql: string
  dialect?: string
  title?: string
  showLineNumbers?: boolean
  maxHeight?: string
  className?: string
}

const SQLPreview: React.FC<SQLPreviewProps> = ({
  sql,
  dialect = 'MySQL',
  title = 'SQL预览',
  showLineNumbers = true,
  maxHeight = '400px',
  className = ''
}) => {
  if (!sql || sql.trim() === '') {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 text-center ${className}`}>
        <p className="text-gray-500 text-sm">暂无SQL代码</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="mb-2">
        <h4 className="text-sm font-medium text-gray-900">
          {title} - {dialect}
        </h4>
      </div>
      <CodeHighlight
        code={sql}
        language="sql"
        showLineNumbers={showLineNumbers}
        showCopyButton={true}
        maxHeight={maxHeight}
      />
    </div>
  )
}

export default SQLPreview