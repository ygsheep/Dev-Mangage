import { DocumentType, ParseResult, ParseOptions, ParsedModel } from '../types'
import { MarkdownParser } from './MarkdownParser'
import { SQLParser } from './SQLParser'
import { ExcelParser } from './ExcelParser'
import logger from '../../../utils/logger'

export class DocumentParserService {
  /**
   * 解析文档内容
   */
  static async parseDocument(
    content: string,
    type: DocumentType,
    options: ParseOptions = {}
  ): Promise<ParseResult> {
    try {
      logger.info('开始解析文档', { 
        type, 
        contentLength: content.length,
        options: { ...options, content: undefined }
      })

      let parsedModel: ParsedModel

      switch (type) {
        case DocumentType.MARKDOWN:
          parsedModel = MarkdownParser.parseContent(content, options)
          break
        
        case DocumentType.SQL:
          parsedModel = SQLParser.parseContent(content, options)
          break
        
        case DocumentType.EXCEL:
        case DocumentType.CSV:
          parsedModel = ExcelParser.parseContent(content, options)
          break
        
        case DocumentType.WORD:
          // Word文档通常需要先转换为文本，这里暂时当作Markdown处理
          parsedModel = MarkdownParser.parseContent(content, options)
          break
        
        case DocumentType.PDF:
          // PDF文档通常需要先提取文本，这里暂时当作Markdown处理
          parsedModel = MarkdownParser.parseContent(content, options)
          break
        
        case DocumentType.JSON:
          parsedModel = this.parseJSONDocument(content, options)
          break
        
        default:
          throw new Error(`不支持的文档类型: ${type}`)
      }

      // 验证解析结果
      const validation = this.validateParsedModel(parsedModel, options)
      
      if (!validation.isValid && options.strictMode) {
        return {
          success: false,
          error: '文档解析结果验证失败',
          warnings: validation.warnings,
          metadata: {
            provider: 'DocumentParser',
            timestamp: new Date()
          }
        }
      }

      logger.info('文档解析完成', {
        type,
        tablesCount: parsedModel.tables.length,
        fieldsCount: parsedModel.tables.reduce((sum, table) => sum + table.fields.length, 0),
        hasWarnings: validation.warnings.length > 0
      })

      return {
        success: true,
        data: parsedModel,
        warnings: validation.warnings,
        metadata: {
          provider: 'DocumentParser',
          timestamp: new Date(),
          processingTime: Date.now()
        }
      }

    } catch (error) {
      logger.error('文档解析失败', {
        type,
        error: error.message,
        stack: error.stack
      })

      return {
        success: false,
        error: `文档解析失败: ${error.message}`,
        metadata: {
          provider: 'DocumentParser',
          timestamp: new Date()
        }
      }
    }
  }

  /**
   * 解析JSON文档
   */
  private static parseJSONDocument(content: string, options: ParseOptions = {}): ParsedModel {
    try {
      const jsonData = JSON.parse(content)
      
      // 检查是否是已经解析的模型格式
      if (this.isValidParsedModel(jsonData)) {
        return jsonData as ParsedModel
      }
      
      // 尝试从JSON结构推断表结构
      return this.inferModelFromJSON(jsonData, options)
      
    } catch (error) {
      throw new Error(`JSON解析失败: ${error.message}`)
    }
  }

  /**
   * 检查是否是有效的解析模型
   */
  private static isValidParsedModel(data: any): boolean {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof data.name === 'string' &&
      Array.isArray(data.tables) &&
      data.tables.every((table: any) => 
        typeof table.name === 'string' &&
        Array.isArray(table.fields) &&
        table.fields.every((field: any) => 
          typeof field.name === 'string' &&
          typeof field.type === 'string'
        )
      )
    )
  }

  /**
   * 从JSON结构推断模型
   */
  private static inferModelFromJSON(data: any, options: ParseOptions): ParsedModel {
    const tables = []
    
    if (Array.isArray(data)) {
      // 如果是数组，分析第一个对象的结构
      if (data.length > 0 && typeof data[0] === 'object') {
        const table = this.createTableFromObject('inferred_table', data[0])
        tables.push(table)
      }
    } else if (typeof data === 'object' && data !== null) {
      // 检查是否包含多个表的定义
      for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
          const table = this.createTableFromObject(key, value[0])
          tables.push(table)
        } else if (typeof value === 'object' && value !== null) {
          const table = this.createTableFromObject(key, value)
          tables.push(table)
        }
      }
    }

    return {
      name: options.modelName || 'JSON推断模型',
      description: '从JSON数据结构推断的数据库模型',
      version: '1.0.0',
      tables,
      relationships: []
    }
  }

  /**
   * 从对象创建表定义
   */
  private static createTableFromObject(tableName: string, obj: any): any {
    const fields = []
    
    for (const [key, value] of Object.entries(obj)) {
      const field = {
        name: key,
        type: this.inferFieldType(value),
        nullable: value === null || value === undefined,
        comment: `从JSON推断的${key}字段`
      }
      
      fields.push(field)
    }
    
    return {
      name: tableName,
      displayName: tableName,
      comment: `从JSON对象推断的${tableName}表`,
      fields,
      category: 'inferred'
    }
  }

  /**
   * 推断字段类型
   */
  private static inferFieldType(value: any): string {
    if (value === null || value === undefined) {
      return 'VARCHAR(255)'
    }
    
    switch (typeof value) {
      case 'string':
        if (value.length > 255) {
          return 'TEXT'
        }
        // 检查是否是日期格式
        if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
          return value.includes('T') ? 'DATETIME' : 'DATE'
        }
        return `VARCHAR(${Math.max(255, value.length * 2)})`
      
      case 'number':
        return Number.isInteger(value) ? 'INT' : 'DECIMAL(10,2)'
      
      case 'boolean':
        return 'BOOLEAN'
      
      case 'object':
        if (Array.isArray(value)) {
          return 'JSON'
        }
        return 'JSON'
      
      default:
        return 'VARCHAR(255)'
    }
  }

  /**
   * 验证解析的模型
   */
  private static validateParsedModel(
    model: ParsedModel, 
    options: ParseOptions = {}
  ): { isValid: boolean, warnings: string[] } {
    const warnings: string[] = []
    let isValid = true

    // 检查基本结构
    if (!model.name || typeof model.name !== 'string') {
      warnings.push('模型名称无效')
      isValid = false
    }

    if (!Array.isArray(model.tables)) {
      warnings.push('表列表无效')
      isValid = false
    }

    if (model.tables.length === 0) {
      warnings.push('未找到任何表定义')
      if (options.strictMode) {
        isValid = false
      }
    }

    // 检查表定义
    model.tables.forEach((table, index) => {
      if (!table.name || typeof table.name !== 'string') {
        warnings.push(`表 ${index + 1} 名称无效`)
        isValid = false
      }

      if (!Array.isArray(table.fields)) {
        warnings.push(`表 ${table.name || index + 1} 字段列表无效`)
        isValid = false
      }

      if (table.fields.length === 0) {
        warnings.push(`表 ${table.name || index + 1} 没有字段定义`)
      }

      // 检查字段定义
      table.fields.forEach((field, fieldIndex) => {
        if (!field.name || typeof field.name !== 'string') {
          warnings.push(`表 ${table.name} 的字段 ${fieldIndex + 1} 名称无效`)
        }

        if (!field.type || typeof field.type !== 'string') {
          warnings.push(`表 ${table.name} 的字段 ${field.name || fieldIndex + 1} 类型无效`)
        }
      })

      // 检查主键
      const primaryKeyFields = table.fields.filter(f => f.isPrimaryKey)
      if (primaryKeyFields.length === 0) {
        warnings.push(`表 ${table.name} 没有定义主键`)
      }
    })

    // 检查表名重复
    const tableNames = model.tables.map(t => t.name)
    const duplicateNames = tableNames.filter((name, index) => tableNames.indexOf(name) !== index)
    if (duplicateNames.length > 0) {
      warnings.push(`发现重复的表名: ${duplicateNames.join(', ')}`)
    }

    return { isValid, warnings }
  }

  /**
   * 获取支持的文档类型
   */
  static getSupportedTypes(): DocumentType[] {
    return [
      DocumentType.MARKDOWN,
      DocumentType.SQL,
      DocumentType.EXCEL,
      DocumentType.CSV,
      DocumentType.WORD,
      DocumentType.PDF,
      DocumentType.JSON
    ]
  }

  /**
   * 检查文档类型是否支持
   */
  static isTypeSupported(type: DocumentType): boolean {
    return this.getSupportedTypes().includes(type)
  }
}

// 导出各个解析器
export { MarkdownParser } from './MarkdownParser'
export { SQLParser } from './SQLParser'
export { ExcelParser } from './ExcelParser'