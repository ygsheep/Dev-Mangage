import { DocumentType, ParseResult, ParseOptions, ParsedModel, ParsedTable, ParsedField } from '../types'
import logger from '../../../utils/logger'

export class SQLParser {
  /**
   * 解析SQL DDL文档
   */
  static parseContent(content: string, options: ParseOptions = {}): ParsedModel {
    const tables = this.extractTablesFromSQL(content)
    const relationships = this.extractRelationshipsFromSQL(content, tables)
    
    return {
      name: options.modelName || this.extractSchemaName(content) || 'Database Schema',
      description: this.extractComments(content),
      version: '1.0.0',
      tables,
      relationships: relationships || []
    }
  }

  /**
   * 从SQL内容中提取表定义
   */
  private static extractTablesFromSQL(content: string): ParsedTable[] {
    const tables: ParsedTable[] = []
    
    // 移除注释和规范化SQL
    const cleanedSQL = this.cleanSQL(content)
    
    // 匹配CREATE TABLE语句
    const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`?(\w+)`?\.)?`?(\w+)`?\s*\(([\s\S]*?)\)(?:\s*ENGINE\s*=\s*\w+)?(?:\s*DEFAULT\s+CHARSET\s*=\s*\w+)?(?:\s*COLLATE\s*=\s*\w+)?(?:\s*COMMENT\s*=\s*['"](.*?)['"])?/gi
    
    let match
    while ((match = createTableRegex.exec(cleanedSQL)) !== null) {
      const schema = match[1]
      const tableName = match[2]
      const tableDefinition = match[3]
      const tableComment = match[4]
      
      const table = this.parseTableDefinition(tableName, tableDefinition, tableComment, schema)
      if (table) {
        tables.push(table)
      }
    }

    return tables
  }

  /**
   * 清理SQL内容
   */
  private static cleanSQL(content: string): string {
    // 移除单行注释
    let cleaned = content.replace(/--.*$/gm, '')
    
    // 移除多行注释
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '')
    
    // 规范化空白字符
    cleaned = cleaned.replace(/\s+/g, ' ').trim()
    
    return cleaned
  }

  /**
   * 解析表定义
   */
  private static parseTableDefinition(
    tableName: string, 
    definition: string, 
    comment?: string,
    schema?: string
  ): ParsedTable | null {
    try {
      const fields = this.parseFields(definition)
      const indexes = this.parseIndexes(definition)
      
      if (fields.length === 0) {
        logger.warn('表定义中未找到字段', { tableName })
        return null
      }

      return {
        name: tableName,
        displayName: tableName,
        comment: comment || this.extractTableComment(definition),
        fields,
        indexes: indexes || [],
        category: this.inferTableCategory(tableName, comment)
      }
    } catch (error) {
      logger.warn('解析表定义失败', { tableName, error: error.message })
      return null
    }
  }

  /**
   * 解析字段定义
   */
  private static parseFields(definition: string): ParsedField[] {
    const fields: ParsedField[] = []
    
    // 分割字段定义（处理嵌套括号）
    const fieldDefinitions = this.splitFieldDefinitions(definition)
    
    for (const fieldDef of fieldDefinitions) {
      const field = this.parseFieldDefinition(fieldDef.trim())
      if (field) {
        fields.push(field)
      }
    }

    return fields
  }

  /**
   * 分割字段定义
   */
  private static splitFieldDefinitions(definition: string): string[] {
    const definitions: string[] = []
    let current = ''
    let parenthesesLevel = 0
    let inQuotes = false
    let quoteChar = ''

    for (let i = 0; i < definition.length; i++) {
      const char = definition[i]
      const nextChar = definition[i + 1]

      if (!inQuotes && (char === '"' || char === "'" || char === '`')) {
        inQuotes = true
        quoteChar = char
      } else if (inQuotes && char === quoteChar && definition[i - 1] !== '\\') {
        inQuotes = false
        quoteChar = ''
      }

      if (!inQuotes) {
        if (char === '(') {
          parenthesesLevel++
        } else if (char === ')') {
          parenthesesLevel--
        } else if (char === ',' && parenthesesLevel === 0) {
          const trimmed = current.trim()
          if (trimmed && !this.isConstraintDefinition(trimmed)) {
            definitions.push(trimmed)
          }
          current = ''
          continue
        }
      }

      current += char
    }

    // 添加最后一个定义
    const trimmed = current.trim()
    if (trimmed && !this.isConstraintDefinition(trimmed)) {
      definitions.push(trimmed)
    }

    return definitions
  }

  /**
   * 检查是否是约束定义
   */
  private static isConstraintDefinition(definition: string): boolean {
    const constraintKeywords = [
      'PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE KEY', 'KEY', 'INDEX',
      'CONSTRAINT', 'CHECK', 'FULLTEXT'
    ]
    
    const upperDef = definition.toUpperCase().trim()
    return constraintKeywords.some(keyword => upperDef.startsWith(keyword))
  }

  /**
   * 解析单个字段定义
   */
  private static parseFieldDefinition(definition: string): ParsedField | null {
    // 匹配字段定义: 字段名 类型 [约束...] [COMMENT '注释']
    const fieldRegex = /^`?(\w+)`?\s+(\w+(?:\([^)]*\))?(?:\s+\w+)*)\s*(.*?)(?:COMMENT\s+['"](.*?)['"])?$/i
    const match = definition.match(fieldRegex)
    
    if (!match) {
      return null
    }

    const fieldName = match[1]
    const typeDefinition = match[2]
    const constraints = match[3] || ''
    const comment = match[4]

    const field: ParsedField = {
      name: fieldName,
      type: this.extractDataType(typeDefinition),
      comment: comment || undefined,
      nullable: !constraints.toUpperCase().includes('NOT NULL'),
      isPrimaryKey: false,
      isAutoIncrement: constraints.toUpperCase().includes('AUTO_INCREMENT'),
      isUnique: constraints.toUpperCase().includes('UNIQUE'),
      defaultValue: this.extractDefaultValue(constraints)
    }

    // 解析类型详细信息
    this.parseTypeDetails(field, typeDefinition)

    // 检查主键（可能在字段定义中或者约束中）
    if (constraints.toUpperCase().includes('PRIMARY KEY')) {
      field.isPrimaryKey = true
      field.nullable = false
    }

    return field
  }

  /**
   * 提取数据类型
   */
  private static extractDataType(typeDefinition: string): string {
    const typeMatch = typeDefinition.match(/^(\w+)(?:\([^)]*\))?/i)
    return typeMatch ? typeMatch[1].toUpperCase() : 'VARCHAR'
  }

  /**
   * 解析类型详细信息
   */
  private static parseTypeDetails(field: ParsedField, typeDefinition: string): void {
    // 提取长度和精度
    const lengthMatch = typeDefinition.match(/\((\d+)(?:,\s*(\d+))?\)/)
    if (lengthMatch) {
      field.length = parseInt(lengthMatch[1])
      if (lengthMatch[2]) {
        field.precision = parseInt(lengthMatch[1])
        field.scale = parseInt(lengthMatch[2])
      }
    }

    // 检查无符号
    if (/UNSIGNED/i.test(typeDefinition)) {
      field.isUnsigned = true
    }

    // 检查零填充
    if (/ZEROFILL/i.test(typeDefinition)) {
      field.isZerofill = true
    }
  }

  /**
   * 提取默认值
   */
  private static extractDefaultValue(constraints: string): string | undefined {
    const defaultMatch = constraints.match(/DEFAULT\s+('([^']*)'|"([^"]*)"|([^\s]+))/i)
    if (defaultMatch) {
      return defaultMatch[2] || defaultMatch[3] || defaultMatch[4]
    }
    return undefined
  }

  /**
   * 解析索引定义
   */
  private static parseIndexes(definition: string): any[] {
    const indexes: any[] = []
    
    // 匹配各种索引定义
    const indexRegexes = [
      /PRIMARY\s+KEY\s*\(([^)]+)\)/gi,
      /(?:UNIQUE\s+)?(?:KEY|INDEX)\s+(?:`?(\w+)`?\s*)?\(([^)]+)\)/gi,
      /FULLTEXT\s+(?:KEY|INDEX)\s+(?:`?(\w+)`?\s*)?\(([^)]+)\)/gi
    ]

    for (const regex of indexRegexes) {
      let match
      while ((match = regex.exec(definition)) !== null) {
        const indexName = match[1] || 'PRIMARY'
        const fields = match[2] || match[1]
        
        const index = {
          name: indexName,
          fields: this.parseIndexFields(fields),
          type: this.determineIndexType(match[0]),
          isUnique: /UNIQUE|PRIMARY/i.test(match[0])
        }
        
        indexes.push(index)
      }
    }

    return indexes
  }

  /**
   * 解析索引字段
   */
  private static parseIndexFields(fieldsStr: string): string[] {
    return fieldsStr.split(',').map(field => {
      // 移除长度限制和排序信息
      const cleanField = field.trim().replace(/`/g, '').replace(/\(\d+\)/, '').replace(/\s+(ASC|DESC)$/i, '')
      return cleanField
    })
  }

  /**
   * 确定索引类型
   */
  private static determineIndexType(indexDefinition: string): string {
    const upperDef = indexDefinition.toUpperCase()
    
    if (upperDef.includes('PRIMARY')) return 'PRIMARY'
    if (upperDef.includes('UNIQUE')) return 'UNIQUE'
    if (upperDef.includes('FULLTEXT')) return 'FULLTEXT'
    return 'INDEX'
  }

  /**
   * 提取表注释
   */
  private static extractTableComment(definition: string): string | undefined {
    const commentMatch = definition.match(/COMMENT\s*=\s*['"](.*?)['"]$/i)
    return commentMatch ? commentMatch[1] : undefined
  }

  /**
   * 推断表分类
   */
  private static inferTableCategory(tableName: string, comment?: string): string {
    const text = (tableName + ' ' + (comment || '')).toLowerCase()
    
    if (/user|account|member|customer/.test(text)) return 'user'
    if (/order|transaction|payment|billing/.test(text)) return 'transaction'
    if (/product|item|goods|inventory/.test(text)) return 'product'
    if (/log|audit|history/.test(text)) return 'log'
    if (/config|setting|parameter/.test(text)) return 'configuration'
    if (/dict|lookup|enum|reference/.test(text)) return 'reference'
    
    return 'general'
  }

  /**
   * 提取模式名称
   */
  private static extractSchemaName(content: string): string | null {
    const useMatch = content.match(/USE\s+`?(\w+)`?/i)
    if (useMatch) return useMatch[1]
    
    const createSchemaMatch = content.match(/CREATE\s+(?:DATABASE|SCHEMA)\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?/i)
    if (createSchemaMatch) return createSchemaMatch[1]
    
    return null
  }

  /**
   * 提取注释
   */
  private static extractComments(content: string): string | undefined {
    const comments: string[] = []
    
    // 提取单行注释
    const singleLineComments = content.match(/--\s*(.+)$/gm)
    if (singleLineComments) {
      comments.push(...singleLineComments.map(c => c.replace(/^--\s*/, '')))
    }
    
    // 提取多行注释
    const multiLineComments = content.match(/\/\*\s*([\s\S]*?)\s*\*\//g)
    if (multiLineComments) {
      comments.push(...multiLineComments.map(c => c.replace(/^\/\*\s*|\s*\*\/$/g, '')))
    }
    
    // 返回第一个非空注释作为描述
    const meaningfulComment = comments.find(c => c.trim().length > 0)
    return meaningfulComment?.trim()
  }

  /**
   * 提取关系信息
   */
  private static extractRelationshipsFromSQL(content: string, tables: ParsedTable[]): any[] {
    const relationships = []
    
    // 匹配外键约束
    const foreignKeyRegex = /FOREIGN\s+KEY\s*\(`?(\w+)`?\)\s*REFERENCES\s+`?(\w+)`?\s*\(`?(\w+)`?\)(?:\s+ON\s+DELETE\s+(\w+))?(?:\s+ON\s+UPDATE\s+(\w+))?/gi
    
    let match
    while ((match = foreignKeyRegex.exec(content)) !== null) {
      const relationship = {
        fromField: match[1],
        toTable: match[2],
        toField: match[3],
        onDelete: match[4] || 'RESTRICT',
        onUpdate: match[5] || 'RESTRICT',
        type: 'foreign_key'
      }
      
      relationships.push(relationship)
    }

    return relationships
  }
}