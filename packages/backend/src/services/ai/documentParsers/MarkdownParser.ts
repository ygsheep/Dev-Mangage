import { DocumentType, ParseResult, ParseOptions, ParsedModel, ParsedTable, ParsedField } from '../types'
import logger from '../../../utils/logger'

export class MarkdownParser {
  /**
   * 解析Markdown格式的数据库文档
   */
  static parseContent(content: string, options: ParseOptions = {}): ParsedModel {
    const tables = this.extractTablesFromMarkdown(content)
    const relationships = this.extractRelationships(content, tables)
    
    return {
      name: options.modelName || this.extractModelName(content) || 'Database Model',
      description: this.extractDescription(content),
      version: '1.0.0',
      tables,
      relationships: relationships || []
    }
  }

  /**
   * 从Markdown内容中提取表定义
   */
  private static extractTablesFromMarkdown(content: string): ParsedTable[] {
    const tables: ParsedTable[] = []
    
    // 匹配表格标题和内容的正则表达式
    const tableRegex = /##?\s+(.+?)(?:\n\n|\n(?=##)|\n(?=###)|\n$)([\s\S]*?)(?=\n##|\n###|$)/g
    let match

    while ((match = tableRegex.exec(content)) !== null) {
      const title = match[1].trim()
      const tableContent = match[2].trim()
      
      // 检查是否是表定义（通常包含字段信息）
      if (this.isTableDefinition(tableContent)) {
        const table = this.parseTableSection(title, tableContent)
        if (table) {
          tables.push(table)
        }
      }
    }

    // 如果没有找到标准格式的表，尝试解析Markdown表格
    if (tables.length === 0) {
      const markdownTables = this.parseMarkdownTables(content)
      tables.push(...markdownTables)
    }

    return tables
  }

  /**
   * 检查内容是否是表定义
   */
  private static isTableDefinition(content: string): boolean {
    const indicators = [
      /字段|field|column/i,
      /类型|type|数据类型/i,
      /主键|primary.*key|pk/i,
      /外键|foreign.*key|fk/i,
      /\|.*\|.*\|/  // Markdown表格格式
    ]
    
    return indicators.some(regex => regex.test(content))
  }

  /**
   * 解析表章节
   */
  private static parseTableSection(title: string, content: string): ParsedTable | null {
    try {
      const tableName = this.extractTableName(title)
      const description = this.extractSectionDescription(content)
      const fields = this.extractFieldsFromSection(content)
      
      if (fields.length === 0) {
        return null
      }

      return {
        name: tableName,
        displayName: title,
        comment: description,
        fields,
        category: this.inferCategory(tableName, description)
      }
    } catch (error) {
      logger.warn('解析表章节失败', { title, error: error.message })
      return null
    }
  }

  /**
   * 解析Markdown表格
   */
  private static parseMarkdownTables(content: string): ParsedTable[] {
    const tables: ParsedTable[] = []
    const tableRegex = /\|(.+?)\|\n\|[-\s|:]+\|\n((?:\|.+?\|\n?)+)/g
    let match

    let tableIndex = 1
    while ((match = tableRegex.exec(content)) !== null) {
      const headerRow = match[1].trim()
      const dataRows = match[2].trim()
      
      const headers = headerRow.split('|').map(h => h.trim()).filter(h => h)
      const rows = dataRows.split('\n').map(row => 
        row.split('|').map(cell => cell.trim()).filter(cell => cell)
      ).filter(row => row.length > 0)

      // 检查是否是字段定义表
      if (this.isFieldDefinitionTable(headers)) {
        const table = this.parseFieldDefinitionTable(headers, rows, tableIndex)
        if (table) {
          tables.push(table)
          tableIndex++
        }
      }
    }

    return tables
  }

  /**
   * 检查是否是字段定义表
   */
  private static isFieldDefinitionTable(headers: string[]): boolean {
    const fieldIndicators = ['字段', 'field', 'column', '列名']
    const typeIndicators = ['类型', 'type', '数据类型', 'datatype']
    
    const hasFieldColumn = headers.some(h => 
      fieldIndicators.some(indicator => h.toLowerCase().includes(indicator.toLowerCase()))
    )
    const hasTypeColumn = headers.some(h => 
      typeIndicators.some(indicator => h.toLowerCase().includes(indicator.toLowerCase()))
    )
    
    return hasFieldColumn && hasTypeColumn
  }

  /**
   * 解析字段定义表
   */
  private static parseFieldDefinitionTable(headers: string[], rows: string[][], tableIndex: number): ParsedTable | null {
    const fieldNameIndex = this.findColumnIndex(headers, ['字段', 'field', 'column', '列名'])
    const typeIndex = this.findColumnIndex(headers, ['类型', 'type', '数据类型'])
    const commentIndex = this.findColumnIndex(headers, ['说明', 'comment', 'description', '备注'])
    const nullableIndex = this.findColumnIndex(headers, ['可空', 'nullable', 'null'])
    const primaryKeyIndex = this.findColumnIndex(headers, ['主键', 'primary', 'pk'])
    
    if (fieldNameIndex === -1 || typeIndex === -1) {
      return null
    }

    const fields: ParsedField[] = []
    
    for (const row of rows) {
      if (row.length <= Math.max(fieldNameIndex, typeIndex)) {
        continue
      }

      const fieldName = row[fieldNameIndex]?.trim()
      const fieldType = row[typeIndex]?.trim()
      
      if (!fieldName || !fieldType) {
        continue
      }

      const field: ParsedField = {
        name: fieldName,
        type: this.normalizeFieldType(fieldType),
        comment: commentIndex !== -1 ? row[commentIndex]?.trim() : undefined,
        nullable: nullableIndex !== -1 ? this.parseBoolean(row[nullableIndex]) : true,
        isPrimaryKey: primaryKeyIndex !== -1 ? this.parseBoolean(row[primaryKeyIndex]) : false
      }

      // 解析字段类型详细信息
      this.parseFieldTypeDetails(field, fieldType)
      fields.push(field)
    }

    if (fields.length === 0) {
      return null
    }

    return {
      name: `table_${tableIndex}`,
      displayName: `Table ${tableIndex}`,
      comment: `从Markdown表格解析的第${tableIndex}个表`,
      fields,
      category: 'parsed'
    }
  }

  /**
   * 查找列索引
   */
  private static findColumnIndex(headers: string[], keywords: string[]): number {
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].toLowerCase()
      if (keywords.some(keyword => header.includes(keyword.toLowerCase()))) {
        return i
      }
    }
    return -1
  }

  /**
   * 解析布尔值
   */
  private static parseBoolean(value: string): boolean {
    if (!value) return false
    const lowerValue = value.toLowerCase().trim()
    return ['true', 'yes', 'y', '1', '是', '√', '✓'].includes(lowerValue)
  }

  /**
   * 从章节内容中提取字段
   */
  private static extractFieldsFromSection(content: string): ParsedField[] {
    const fields: ParsedField[] = []
    
    // 尝试匹配列表格式的字段定义
    const listFieldRegex = /[-*]\s*(.+?)[:：]\s*(.+?)(?:\n|$)/g
    let match

    while ((match = listFieldRegex.exec(content)) !== null) {
      const fieldName = match[1].trim()
      const fieldInfo = match[2].trim()
      
      const field = this.parseFieldInfo(fieldName, fieldInfo)
      if (field) {
        fields.push(field)
      }
    }

    return fields
  }

  /**
   * 解析字段信息
   */
  private static parseFieldInfo(name: string, info: string): ParsedField | null {
    const field: ParsedField = {
      name: name.replace(/[`'"]/g, ''),
      type: 'VARCHAR(255)',
      nullable: true
    }

    // 提取数据类型
    const typeMatch = info.match(/(\w+)(?:\((\d+(?:,\d+)?)\))?/i)
    if (typeMatch) {
      field.type = typeMatch[0].toUpperCase()
      if (typeMatch[2]) {
        const sizeParams = typeMatch[2].split(',')
        field.length = parseInt(sizeParams[0])
        if (sizeParams[1]) {
          field.scale = parseInt(sizeParams[1])
        }
      }
    }

    // 检查主键
    if (/主键|primary.*key|pk/i.test(info)) {
      field.isPrimaryKey = true
      field.nullable = false
    }

    // 检查外键
    if (/外键|foreign.*key|fk/i.test(info)) {
      field.isForeignKey = true
    }

    // 检查可空性
    if (/not.*null|非空|必填/i.test(info)) {
      field.nullable = false
    }

    // 检查自增
    if (/auto.*increment|自增|自动增长/i.test(info)) {
      field.isAutoIncrement = true
    }

    // 提取注释
    const commentMatch = info.match(/[，,]\s*(.+)$/)
    if (commentMatch) {
      field.comment = commentMatch[1].trim()
    }

    return field
  }

  /**
   * 解析字段类型详细信息
   */
  private static parseFieldTypeDetails(field: ParsedField, typeStr: string): void {
    // 提取长度信息
    const lengthMatch = typeStr.match(/\((\d+)(?:,(\d+))?\)/)
    if (lengthMatch) {
      field.length = parseInt(lengthMatch[1])
      if (lengthMatch[2]) {
        field.scale = parseInt(lengthMatch[2])
      }
    }

    // 规范化类型名称
    const baseType = typeStr.replace(/\([^)]*\)/, '').trim().toUpperCase()
    field.type = this.normalizeFieldType(baseType)
  }

  /**
   * 规范化字段类型
   */
  private static normalizeFieldType(type: string): string {
    const typeMap: Record<string, string> = {
      '整数': 'INT',
      '整型': 'INT',
      '字符串': 'VARCHAR',
      '文本': 'TEXT',
      '日期': 'DATE',
      '时间': 'DATETIME',
      '浮点': 'FLOAT',
      '布尔': 'BOOLEAN',
      '布尔型': 'BOOLEAN'
    }

    const normalizedType = type.toUpperCase().trim()
    return typeMap[type] || normalizedType
  }

  /**
   * 提取表名
   */
  private static extractTableName(title: string): string {
    // 移除标题标记和常见前缀
    let tableName = title.replace(/^#+\s*/, '')
    tableName = tableName.replace(/^(表|table|数据表)\s*[:：]?\s*/i, '')
    
    // 提取第一个词作为表名
    const words = tableName.split(/\s+/)
    return words[0].replace(/[^\w\u4e00-\u9fff]/g, '_').toLowerCase()
  }

  /**
   * 提取模型名称
   */
  private static extractModelName(content: string): string | null {
    const titleMatch = content.match(/^#\s+(.+)$/m)
    return titleMatch ? titleMatch[1].trim() : null
  }

  /**
   * 提取描述
   */
  private static extractDescription(content: string): string | undefined {
    const lines = content.split('\n')
    let description = ''
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line.startsWith('#')) {
        continue
      }
      if (line && !line.startsWith('|') && !line.startsWith('-')) {
        description = line
        break
      }
    }
    
    return description || undefined
  }

  /**
   * 提取章节描述
   */
  private static extractSectionDescription(content: string): string | undefined {
    const lines = content.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('|') && !trimmed.startsWith('-') && !trimmed.startsWith('*')) {
        return trimmed
      }
    }
    return undefined
  }

  /**
   * 推断表分类
   */
  private static inferCategory(tableName: string, description?: string): string {
    const businessKeywords = ['用户', 'user', '订单', 'order', '产品', 'product', '客户', 'customer']
    const systemKeywords = ['log', '日志', 'config', '配置', 'setting', '设置']
    const referenceKeywords = ['dict', '字典', 'ref', '参考', 'lookup', '枚举']
    
    const text = (tableName + ' ' + (description || '')).toLowerCase()
    
    if (businessKeywords.some(keyword => text.includes(keyword))) {
      return 'business'
    }
    if (systemKeywords.some(keyword => text.includes(keyword))) {
      return 'system'
    }
    if (referenceKeywords.some(keyword => text.includes(keyword))) {
      return 'reference'
    }
    
    return 'general'
  }

  /**
   * 提取关系信息
   */
  private static extractRelationships(content: string, tables: ParsedTable[]): any[] {
    const relationships = []
    
    // 这里可以实现关系提取逻辑
    // 暂时返回空数组，后续可以扩展
    
    return relationships
  }
}