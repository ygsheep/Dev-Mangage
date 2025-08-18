/**
 * SQL代码预览组件
 * 提供SQL代码的语法高亮显示功能，支持多种数据库方言和自定义样式
 */

import React from 'react'
import CodeHighlight from '../common/CodeHighlight'

/**
 * SQL预览组件的属性接口
 */
interface SQLPreviewProps {
  /** 要显示的SQL代码字符串 */
  sql: string
  /** 数据库方言类型，默认为MySQL */
  dialect?: string
  /** 预览区域的标题，默认为'SQL预览' */
  title?: string
  /** 是否显示行号，默认为true */
  showLineNumbers?: boolean
  /** 预览区域的最大高度，默认为400px */
  maxHeight?: string
  /** 自定义CSS类名 */
  className?: string
}

/**
 * SQL代码预览组件
 * 基于CodeHighlight组件实现，专门用于SQL代码的展示
 * @param props - 组件属性
 * @returns React函数组件
 */
const SQLPreview: React.FC<SQLPreviewProps> = ({
  sql,
  dialect = 'MySQL',
  title = 'SQL预览',
  showLineNumbers = true,
  maxHeight = '400px',
  className = ''
}) => {
  // 处理空SQL的情况，显示友好的提示信息
  if (!sql || sql.trim() === '') {
    return (
      <div className={`bg-bg-secondary border border-border-primary rounded-lg p-4 text-center ${className}`}>
        <p className="text-gray-500 text-sm">暂无SQL代码</p>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* SQL预览区域标题，显示标题和数据库方言 */}
      <div className="mb-2">
        <h4 className="text-sm font-medium text-text-primary">
          {title} - {dialect}
        </h4>
      </div>
      {/* 使用CodeHighlight组件进行SQL语法高亮显示 */}
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