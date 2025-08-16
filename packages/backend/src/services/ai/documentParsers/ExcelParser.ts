import { DocumentType, ParseResult, ParseOptions, ParsedModel, ParsedTable, ParsedField } from '../types'
import logger from '../../../utils/logger'

export class ExcelParser {
  /**
   * 解析Excel/CSV格式的数据库文档
   * 注意：这里处理的是Excel导出的CSV或文本格式
   */
  static parseContent(content: string, options: ParseOptions = {}): ParsedModel {
    const tables = this.extractTablesFromExcel(content)
    
    return {
      name: options.modelName || 'Excel Database Model',
      description: this.extractDescription(content),
      version: '1.0.0',
      tables,
      relationships: []
    }
  }

  /**
   * 从Excel内容中提取表定义
   */
  private static extractTablesFromExcel(content: string): ParsedTable[] {
    const tables: ParsedTable[] = []
    
    // 检测分隔符
    const delimiter = this.detectDelimiter(content)
    
    // 按空行分割，可能包含多个表
    const sections = content.split(/\n\s*\n/)
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i].trim()
      if (!section) continue
      
      const table = this.parseExcelSection(section, delimiter, i + 1)
      if (table) {
        tables.push(table)
      }
    }

    // 如果没有找到分节，尝试解析整个内容作为一个表
    if (tables.length === 0) {
      const table = this.parseExcelSection(content, delimiter, 1)
      if (table) {
        tables.push(table)
      }
    }

    return tables
  }

  /**
   * 检测CSV分隔符
   */
  private static detectDelimiter(content: string): string {
    const delimiters = [',', '\t', ';', '|']
    const lines = content.split('\n').slice(0, 5) // 检查前5行
    
    let bestDelimiter = ','
    let maxColumns = 0
    
    for (const delimiter of delimiters) {
      let totalColumns = 0
      let validLines = 0
      
      for (const line of lines) {
        if (line.trim()) {
          const columns = line.split(delimiter).length
          if (columns > 1) {
            totalColumns += columns
            validLines++
          }
        }
      }
      
      const avgColumns = validLines > 0 ? totalColumns / validLines : 0
      if (avgColumns > maxColumns) {
        maxColumns = avgColumns
        bestDelimiter = delimiter
      }
    }
    
    return bestDelimiter
  }

  /**
   * 解析Excel节
   */
  private static parseExcelSection(content: string, delimiter: string, sectionIndex: number): ParsedTable | null {
    const lines = content.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      return null
    }

    // 查找表名行（通常是第一个非标题行或包含"表"字的行）
    let tableName = ''
    let headerRowIndex = 0
    
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const line = lines[i].trim()
      
      // 检查是否是表名行
      if (this.isTableNameLine(line, delimiter)) {
        tableName = this.extractTableName(line)
        headerRowIndex = i + 1
        break
      }
      
      // 检查是否是字段标题行
      if (this.isFieldHeaderLine(line, delimiter)) {
        headerRowIndex = i
        break
      }
    }

    if (headerRowIndex >= lines.length) {
      return null
    }

    // 解析标题行
    const headerLine = lines[headerRowIndex]
    const headers = this.parseCSVRow(headerLine, delimiter)
    
    if (!this.isValidFieldHeaders(headers)) {
      logger.warn('Excel节中未找到有效的字段标题', { sectionIndex, headers })
      return null
    }

    // 解析数据行
    const dataRows = lines.slice(headerRowIndex + 1)
    const fields = this.parseFieldsFromExcelData(headers, dataRows, delimiter)
    
    if (fields.length === 0) {
      return null
    }

    return {
      name: tableName || `excel_table_${sectionIndex}`,
      displayName: tableName || `Excel Table ${sectionIndex}`,
      comment: `从Excel文档解析的第${sectionIndex}个表`,
      fields,
      category: 'imported'
    }
  }

  /**
   * 检查是否是表名行
   */
  private static isTableNameLine(line: string, delimiter: string): boolean {
    const columns = this.parseCSVRow(line, delimiter)
    
    // 只有一列且包含表相关关键词
    if (columns.length === 1) {
      const content = columns[0].toLowerCase()
      return /表|table|数据表|sheet/.test(content)
    }
    
    return false
  }

  /**
   * 检查是否是字段标题行
   */
  private static isFieldHeaderLine(line: string, delimiter: string): boolean {
    const columns = this.parseCSVRow(line, delimiter)
    return this.isValidFieldHeaders(columns)
  }

  /**
   * 验证是否是有效的字段标题
   */
  private static isValidFieldHeaders(headers: string[]): boolean {
    if (headers.length < 2) return false
    
    const fieldIndicators = ['字段', 'field', 'column', '列名', '字段名']
    const typeIndicators = ['类型', 'type', '数据类型', 'datatype']
    
    const hasFieldHeader = headers.some(h => 
      fieldIndicators.some(indicator => h.toLowerCase().includes(indicator.toLowerCase()))
    )
    
    const hasTypeHeader = headers.some(h => 
      typeIndicators.some(indicator => h.toLowerCase().includes(indicator.toLowerCase()))
    )
    
    return hasFieldHeader && hasTypeHeader
  }

  /**
   * 解析CSV行
   */
  private static parseCSVRow(line: string, delimiter: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    let quoteChar = ''
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const nextChar = line[i + 1]
      
      if (!inQuotes && (char === '"' || char === "'")) {
        inQuotes = true
        quoteChar = char
      } else if (inQuotes && char === quoteChar) {
        if (nextChar === quoteChar) {
          // 转义的引号
          current += char
          i++ // 跳过下一个引号
        } else {
          inQuotes = false
          quoteChar = ''
        }
      } else if (!inQuotes && char === delimiter) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current.trim())
    return result.map(cell => cell.replace(/^["']|["']$/g, '')) // 移除首尾引号
  }

  /**
   * 从Excel数据解析字段
   */
  private static parseFieldsFromExcelData(headers: string[], dataRows: string[], delimiter: string): ParsedField[] {
    const fields: ParsedField[] = []
    
    // 查找关键列的索引
    const fieldNameIndex = this.findColumnIndex(headers, ['字段', 'field', 'column', '列名', '字段名'])
    const typeIndex = this.findColumnIndex(headers, ['类型', 'type', '数据类型'])
    const commentIndex = this.findColumnIndex(headers, ['说明', 'comment', 'description', '备注', '注释'])
    const nullableIndex = this.findColumnIndex(headers, ['可空', 'nullable', 'null', '允许空'])
    const primaryKeyIndex = this.findColumnIndex(headers, ['主键', 'primary', 'pk', '主键标识'])
    const defaultIndex = this.findColumnIndex(headers, ['默认值', 'default', '缺省值'])
    const lengthIndex = this.findColumnIndex(headers, ['长度', 'length', 'size', '大小'])
    
    if (fieldNameIndex === -1 || typeIndex === -1) {
      logger.warn('Excel数据中未找到字段名或类型列')
      return fields
    }

    for (const rowText of dataRows) {
      const row = this.parseCSVRow(rowText, delimiter)
      
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
        isPrimaryKey: primaryKeyIndex !== -1 ? this.parseBoolean(row[primaryKeyIndex]) : false,
        defaultValue: defaultIndex !== -1 ? row[defaultIndex]?.trim() : undefined
      }

      // 解析长度信息
      if (lengthIndex !== -1 && row[lengthIndex]) {
        const lengthValue = row[lengthIndex].trim()
        if (/^\d+$/.test(lengthValue)) {
          field.length = parseInt(lengthValue)
        } else if (/^\d+,\d+$/.test(lengthValue)) {
          const parts = lengthValue.split(',')
          field.precision = parseInt(parts[0])
          field.scale = parseInt(parts[1])
        }
      }

      // 从类型字符串中解析详细信息
      this.parseFieldTypeDetails(field, fieldType)
      
      fields.push(field)
    }

    return fields
  }

  /**
   * 查找列索引
   */
  private static findColumnIndex(headers: string[], keywords: string[]): number {
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].toLowerCase().trim()
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
    return ['true', 'yes', 'y', '1', '是', '√', '✓', 'x'].includes(lowerValue)
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
        field.precision = parseInt(lengthMatch[1])
        field.scale = parseInt(lengthMatch[2])
      }
    }

    // 检查特殊属性
    const upperType = typeStr.toUpperCase()
    if (upperType.includes('NOT NULL') || upperType.includes('非空')) {
      field.nullable = false
    }
    if (upperType.includes('AUTO_INCREMENT') || upperType.includes('自增')) {
      field.isAutoIncrement = true
    }
    if (upperType.includes('UNIQUE') || upperType.includes('唯一')) {
      field.isUnique = true
    }
  }

  /**
   * 规范化字段类型
   */
  private static normalizeFieldType(type: string): string {
    const typeMap: Record<string, string> = {
      '整数': 'INT',
      '整型': 'INT',
      '字符串': 'VARCHAR',
      '字符': 'VARCHAR',
      '文本': 'TEXT',
      '长文本': 'LONGTEXT',
      '日期': 'DATE',
      '时间': 'DATETIME',
      '时间戳': 'TIMESTAMP',
      '浮点': 'FLOAT',
      '浮点数': 'FLOAT',
      '小数': 'DECIMAL',
      '布尔': 'BOOLEAN',
      '布尔型': 'BOOLEAN',
      '是否': 'BOOLEAN',
      '二进制': 'BLOB',
      '大文本': 'TEXT',
      '枚举': 'ENUM'
    }

    // 清理类型字符串
    let cleanType = type.replace(/\([^)]*\)/, '').trim()
    cleanType = cleanType.replace(/\s+(NOT\s+NULL|AUTO_INCREMENT|UNIQUE|PRIMARY\s+KEY).*/i, '')
    
    const normalizedType = typeMap[cleanType] || cleanType.toUpperCase()
    
    // 恢复长度信息
    const lengthMatch = type.match(/\(([^)]+)\)/)
    if (lengthMatch) {
      return `${normalizedType}(${lengthMatch[1]})`
    }
    
    return normalizedType
  }

  /**
   * 提取表名
   */
  private static extractTableName(line: string): string {
    let tableName = line.replace(/^(表|table|数据表)\s*[:：]?\s*/i, '')
    tableName = tableName.replace(/[^\w\u4e00-\u9fff]/g, '_')
    return tableName.toLowerCase() || 'unnamed_table'
  }

  /**
   * 提取描述
   */
  private static extractDescription(content: string): string | undefined {
    const lines = content.split('\n')
    
    // 查找包含"说明"、"描述"等关键词的行
    for (const line of lines) {
      const trimmed = line.trim()
      if (/^(说明|描述|备注|注释)[:：]\s*(.+)$/i.test(trimmed)) {
        const match = trimmed.match(/^(说明|描述|备注|注释)[:：]\s*(.+)$/i)
        return match ? match[2] : undefined
      }
    }
    
    return 'Excel导入的数据库模型'
  }
}