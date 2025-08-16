import { SQLDialect, ParsedModel, ParsedTable, ParsedField, GeneratedSQL } from '../types'
import logger from '../../../utils/logger'

export interface DialectFeatures {
  name: string
  version: string
  supportsAutoIncrement: boolean
  supportsUUID: boolean
  supportsJSON: boolean
  supportsArrays: boolean
  supportsPartialIndexes: boolean
  supportsCheckConstraints: boolean
  supportsGeneratedColumns: boolean
  supportsCTE: boolean
  supportsWindowFunctions: boolean
  maxIdentifierLength: number
  maxVarcharLength: number
  reservedWords: string[]
  dataTypes: {
    [key: string]: {
      nativeType: string
      alternatives?: string[]
      maxLength?: number
      requiresLength?: boolean
      supportsPrecision?: boolean
    }
  }
}

export interface SQLGenerationOptions {
  includeComments?: boolean
  includeIndexes?: boolean
  includeConstraints?: boolean
  includeForeignKeys?: boolean
  useIFNotExists?: boolean
  addTimestamps?: boolean
  formatStyle?: 'compact' | 'expanded' | 'pretty'
  tablePrefix?: string
  generateSeparateIndexes?: boolean
  optimizeForPerformance?: boolean
}

export class SQLDialectManager {
  private static readonly DIALECT_FEATURES: Record<SQLDialect, DialectFeatures> = {
    [SQLDialect.MYSQL]: {
      name: 'MySQL',
      version: '8.0',
      supportsAutoIncrement: true,
      supportsUUID: false,
      supportsJSON: true,
      supportsArrays: false,
      supportsPartialIndexes: false,
      supportsCheckConstraints: true,
      supportsGeneratedColumns: true,
      supportsCTE: true,
      supportsWindowFunctions: true,
      maxIdentifierLength: 64,
      maxVarcharLength: 65535,
      reservedWords: [
        'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER',
        'TABLE', 'INDEX', 'DATABASE', 'SCHEMA', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES',
        'UNIQUE', 'NOT', 'NULL', 'DEFAULT', 'AUTO_INCREMENT', 'ENGINE', 'CHARSET'
      ],
      dataTypes: {
        'INT': { nativeType: 'INT', alternatives: ['INTEGER'] },
        'BIGINT': { nativeType: 'BIGINT' },
        'TINYINT': { nativeType: 'TINYINT' },
        'SMALLINT': { nativeType: 'SMALLINT' },
        'MEDIUMINT': { nativeType: 'MEDIUMINT' },
        'VARCHAR': { nativeType: 'VARCHAR', requiresLength: true, maxLength: 65535 },
        'TEXT': { nativeType: 'TEXT' },
        'LONGTEXT': { nativeType: 'LONGTEXT' },
        'DECIMAL': { nativeType: 'DECIMAL', supportsPrecision: true },
        'FLOAT': { nativeType: 'FLOAT' },
        'DOUBLE': { nativeType: 'DOUBLE' },
        'DATE': { nativeType: 'DATE' },
        'DATETIME': { nativeType: 'DATETIME' },
        'TIMESTAMP': { nativeType: 'TIMESTAMP' },
        'BOOLEAN': { nativeType: 'BOOLEAN', alternatives: ['BOOL'] },
        'JSON': { nativeType: 'JSON' },
        'BLOB': { nativeType: 'BLOB' },
        'ENUM': { nativeType: 'ENUM', requiresLength: true }
      }
    },

    [SQLDialect.POSTGRESQL]: {
      name: 'PostgreSQL',
      version: '15',
      supportsAutoIncrement: false, // Uses SERIAL instead
      supportsUUID: true,
      supportsJSON: true,
      supportsArrays: true,
      supportsPartialIndexes: true,
      supportsCheckConstraints: true,
      supportsGeneratedColumns: true,
      supportsCTE: true,
      supportsWindowFunctions: true,
      maxIdentifierLength: 63,
      maxVarcharLength: 1073741823,
      reservedWords: [
        'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER',
        'TABLE', 'INDEX', 'DATABASE', 'SCHEMA', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES',
        'UNIQUE', 'NOT', 'NULL', 'DEFAULT', 'SERIAL', 'BIGSERIAL', 'CONSTRAINT'
      ],
      dataTypes: {
        'INT': { nativeType: 'INTEGER', alternatives: ['INT4'] },
        'BIGINT': { nativeType: 'BIGINT', alternatives: ['INT8'] },
        'SMALLINT': { nativeType: 'SMALLINT', alternatives: ['INT2'] },
        'VARCHAR': { nativeType: 'VARCHAR', requiresLength: true },
        'TEXT': { nativeType: 'TEXT' },
        'DECIMAL': { nativeType: 'DECIMAL', alternatives: ['NUMERIC'], supportsPrecision: true },
        'FLOAT': { nativeType: 'REAL' },
        'DOUBLE': { nativeType: 'DOUBLE PRECISION' },
        'DATE': { nativeType: 'DATE' },
        'DATETIME': { nativeType: 'TIMESTAMP' },
        'TIMESTAMP': { nativeType: 'TIMESTAMP WITH TIME ZONE' },
        'BOOLEAN': { nativeType: 'BOOLEAN', alternatives: ['BOOL'] },
        'JSON': { nativeType: 'JSONB', alternatives: ['JSON'] },
        'BLOB': { nativeType: 'BYTEA' },
        'UUID': { nativeType: 'UUID' },
        'SERIAL': { nativeType: 'SERIAL' },
        'BIGSERIAL': { nativeType: 'BIGSERIAL' }
      }
    },

    [SQLDialect.SQLITE]: {
      name: 'SQLite',
      version: '3.40',
      supportsAutoIncrement: true,
      supportsUUID: false,
      supportsJSON: true,
      supportsArrays: false,
      supportsPartialIndexes: true,
      supportsCheckConstraints: true,
      supportsGeneratedColumns: true,
      supportsCTE: true,
      supportsWindowFunctions: true,
      maxIdentifierLength: 1000,
      maxVarcharLength: 1000000000,
      reservedWords: [
        'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER',
        'TABLE', 'INDEX', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'UNIQUE', 'NOT', 'NULL',
        'DEFAULT', 'AUTOINCREMENT', 'INTEGER', 'TEXT', 'REAL', 'BLOB'
      ],
      dataTypes: {
        'INT': { nativeType: 'INTEGER' },
        'BIGINT': { nativeType: 'INTEGER' },
        'SMALLINT': { nativeType: 'INTEGER' },
        'VARCHAR': { nativeType: 'TEXT' },
        'TEXT': { nativeType: 'TEXT' },
        'DECIMAL': { nativeType: 'REAL' },
        'FLOAT': { nativeType: 'REAL' },
        'DOUBLE': { nativeType: 'REAL' },
        'DATE': { nativeType: 'TEXT' },
        'DATETIME': { nativeType: 'TEXT' },
        'TIMESTAMP': { nativeType: 'TEXT' },
        'BOOLEAN': { nativeType: 'INTEGER' },
        'JSON': { nativeType: 'TEXT' },
        'BLOB': { nativeType: 'BLOB' }
      }
    },

    [SQLDialect.SQL_SERVER]: {
      name: 'SQL Server',
      version: '2022',
      supportsAutoIncrement: false, // Uses IDENTITY instead
      supportsUUID: true,
      supportsJSON: true,
      supportsArrays: false,
      supportsPartialIndexes: true,
      supportsCheckConstraints: true,
      supportsGeneratedColumns: true,
      supportsCTE: true,
      supportsWindowFunctions: true,
      maxIdentifierLength: 128,
      maxVarcharLength: 8000,
      reservedWords: [
        'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER',
        'TABLE', 'INDEX', 'DATABASE', 'SCHEMA', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES',
        'UNIQUE', 'NOT', 'NULL', 'DEFAULT', 'IDENTITY', 'CONSTRAINT'
      ],
      dataTypes: {
        'INT': { nativeType: 'INT' },
        'BIGINT': { nativeType: 'BIGINT' },
        'SMALLINT': { nativeType: 'SMALLINT' },
        'TINYINT': { nativeType: 'TINYINT' },
        'VARCHAR': { nativeType: 'NVARCHAR', requiresLength: true, maxLength: 4000 },
        'TEXT': { nativeType: 'NVARCHAR(MAX)' },
        'DECIMAL': { nativeType: 'DECIMAL', supportsPrecision: true },
        'FLOAT': { nativeType: 'FLOAT' },
        'DOUBLE': { nativeType: 'FLOAT' },
        'DATE': { nativeType: 'DATE' },
        'DATETIME': { nativeType: 'DATETIME2' },
        'TIMESTAMP': { nativeType: 'DATETIME2' },
        'BOOLEAN': { nativeType: 'BIT' },
        'JSON': { nativeType: 'NVARCHAR(MAX)' },
        'BLOB': { nativeType: 'VARBINARY(MAX)' },
        'UUID': { nativeType: 'UNIQUEIDENTIFIER' }
      }
    },

    [SQLDialect.ORACLE]: {
      name: 'Oracle',
      version: '19c',
      supportsAutoIncrement: false, // Uses sequences
      supportsUUID: false,
      supportsJSON: true,
      supportsArrays: false,
      supportsPartialIndexes: false,
      supportsCheckConstraints: true,
      supportsGeneratedColumns: true,
      supportsCTE: true,
      supportsWindowFunctions: true,
      maxIdentifierLength: 128,
      maxVarcharLength: 4000,
      reservedWords: [
        'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER',
        'TABLE', 'INDEX', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'UNIQUE', 'NOT', 'NULL',
        'DEFAULT', 'CONSTRAINT', 'SEQUENCE', 'TRIGGER'
      ],
      dataTypes: {
        'INT': { nativeType: 'NUMBER(10)' },
        'BIGINT': { nativeType: 'NUMBER(19)' },
        'SMALLINT': { nativeType: 'NUMBER(5)' },
        'VARCHAR': { nativeType: 'VARCHAR2', requiresLength: true, maxLength: 4000 },
        'TEXT': { nativeType: 'CLOB' },
        'DECIMAL': { nativeType: 'NUMBER', supportsPrecision: true },
        'FLOAT': { nativeType: 'BINARY_FLOAT' },
        'DOUBLE': { nativeType: 'BINARY_DOUBLE' },
        'DATE': { nativeType: 'DATE' },
        'DATETIME': { nativeType: 'TIMESTAMP' },
        'TIMESTAMP': { nativeType: 'TIMESTAMP' },
        'BOOLEAN': { nativeType: 'NUMBER(1)' },
        'JSON': { nativeType: 'CLOB' },
        'BLOB': { nativeType: 'BLOB' }
      }
    }
  }

  /**
   * 获取方言特性
   */
  static getDialectFeatures(dialect: SQLDialect): DialectFeatures {
    return this.DIALECT_FEATURES[dialect]
  }

  /**
   * 生成适合特定方言的SQL代码
   */
  static generateSQL(
    model: ParsedModel,
    dialect: SQLDialect,
    options: SQLGenerationOptions = {}
  ): GeneratedSQL {
    const features = this.getDialectFeatures(dialect)
    const statements: any[] = []

    logger.info('开始生成SQL代码', {
      dialect,
      tablesCount: model.tables.length,
      options: { ...options, includeComments: undefined }
    })

    // 按依赖关系排序表
    const sortedTables = this.sortTablesByDependencies(model.tables)

    // 为每个表生成CREATE TABLE语句
    for (const table of sortedTables) {
      const tableStatements = this.generateTableSQL(table, dialect, features, options)
      statements.push(...tableStatements)
    }

    // 生成外键约束（如果启用）
    if (options.includeForeignKeys !== false) {
      const foreignKeyStatements = this.generateForeignKeyConstraints(sortedTables, dialect, features, options)
      statements.push(...foreignKeyStatements)
    }

    // 生成索引（如果启用且不是分离生成）
    if (options.includeIndexes !== false && !options.generateSeparateIndexes) {
      const indexStatements = this.generateIndexes(sortedTables, dialect, features, options)
      statements.push(...indexStatements)
    }

    const result: GeneratedSQL = {
      dialect,
      statements,
      metadata: {
        generatedAt: new Date(),
        totalStatements: statements.length,
        estimatedSize: this.estimateSize(statements),
        warnings: this.generateWarnings(model, dialect, features),
        deploymentOrder: statements.map(s => s.table).filter((v, i, a) => a.indexOf(v) === i)
      }
    }

    logger.info('SQL代码生成完成', {
      dialect,
      statementsCount: statements.length,
      warnings: result.metadata.warnings?.length || 0
    })

    return result
  }

  /**
   * 生成表的SQL语句
   */
  private static generateTableSQL(
    table: ParsedTable,
    dialect: SQLDialect,
    features: DialectFeatures,
    options: SQLGenerationOptions
  ): any[] {
    const statements: any[] = []
    const tableName = this.sanitizeIdentifier(options.tablePrefix ? `${options.tablePrefix}${table.name}` : table.name, features)

    // 生成CREATE TABLE语句
    const createTableSQL = this.generateCreateTableStatement(table, tableName, dialect, features, options)
    
    statements.push({
      type: 'CREATE_TABLE',
      table: tableName,
      sql: createTableSQL,
      dependencies: this.extractTableDependencies(table),
      description: table.comment || `${table.displayName || table.name}表`,
      performanceNotes: this.generatePerformanceNotes(table, dialect)
    })

    return statements
  }

  /**
   * 生成CREATE TABLE语句
   */
  private static generateCreateTableStatement(
    table: ParsedTable,
    tableName: string,
    dialect: SQLDialect,
    features: DialectFeatures,
    options: SQLGenerationOptions
  ): string {
    const lines: string[] = []
    const indent = options.formatStyle === 'compact' ? '' : '  '

    // 开始CREATE TABLE
    const ifNotExists = options.useIFNotExists ? 'IF NOT EXISTS ' : ''
    lines.push(`CREATE TABLE ${ifNotExists}${this.quoteIdentifier(tableName, dialect)} (`)

    // 字段定义
    const fieldDefinitions: string[] = []
    
    for (const field of table.fields) {
      const fieldDef = this.generateFieldDefinition(field, dialect, features, options)
      fieldDefinitions.push(`${indent}${fieldDef}`)
    }

    // 主键定义
    const primaryKeyFields = table.fields.filter(f => f.isPrimaryKey)
    if (primaryKeyFields.length > 0) {
      const pkFields = primaryKeyFields.map(f => this.quoteIdentifier(f.name, dialect)).join(', ')
      fieldDefinitions.push(`${indent}PRIMARY KEY (${pkFields})`)
    }

    // 唯一约束
    const uniqueFields = table.fields.filter(f => f.isUnique && !f.isPrimaryKey)
    for (const field of uniqueFields) {
      fieldDefinitions.push(`${indent}UNIQUE (${this.quoteIdentifier(field.name, dialect)})`)
    }

    // 检查约束
    if (features.supportsCheckConstraints && options.includeConstraints) {
      const checkConstraints = this.generateCheckConstraints(table, dialect, features)
      fieldDefinitions.push(...checkConstraints.map(c => `${indent}${c}`))
    }

    lines.push(fieldDefinitions.join(',\n'))
    lines.push(')')

    // 表选项
    const tableOptions = this.generateTableOptions(table, dialect, features, options)
    if (tableOptions) {
      lines[lines.length - 1] += ' ' + tableOptions
    }

    lines[lines.length - 1] += ';'

    // 添加注释
    if (options.includeComments && table.comment) {
      lines.unshift(`-- ${table.comment}`)
    }

    return lines.join('\n')
  }

  /**
   * 生成字段定义
   */
  private static generateFieldDefinition(
    field: ParsedField,
    dialect: SQLDialect,
    features: DialectFeatures,
    options: SQLGenerationOptions
  ): string {
    const parts: string[] = []
    
    // 字段名
    parts.push(this.quoteIdentifier(field.name, dialect))
    
    // 数据类型
    const dataType = this.convertDataType(field, dialect, features)
    parts.push(dataType)

    // 自增
    if (field.isAutoIncrement) {
      const autoIncrement = this.getAutoIncrementSyntax(dialect, features)
      if (autoIncrement) {
        parts.push(autoIncrement)
      }
    }

    // 非空约束
    if (!field.nullable) {
      parts.push('NOT NULL')
    }

    // 默认值
    if (field.defaultValue !== undefined && field.defaultValue !== null) {
      const defaultValue = this.formatDefaultValue(field.defaultValue, field.type, dialect)
      parts.push(`DEFAULT ${defaultValue}`)
    }

    // 字段注释
    if (options.includeComments && field.comment) {
      const comment = this.formatComment(field.comment, dialect)
      if (comment) {
        parts.push(comment)
      }
    }

    return parts.join(' ')
  }

  /**
   * 转换数据类型
   */
  private static convertDataType(field: ParsedField, dialect: SQLDialect, features: DialectFeatures): string {
    const baseType = field.type.split('(')[0].toUpperCase()
    const typeMapping = features.dataTypes[baseType]
    
    if (!typeMapping) {
      logger.warn('未知的数据类型', { type: field.type, dialect })
      return field.type // 使用原始类型
    }

    let result = typeMapping.nativeType

    // 处理长度
    if (typeMapping.requiresLength && field.length) {
      result += `(${field.length})`
    } else if (typeMapping.supportsPrecision && field.precision && field.scale) {
      result += `(${field.precision},${field.scale})`
    } else if (typeMapping.supportsPrecision && field.precision) {
      result += `(${field.precision})`
    } else if (field.type.includes('(')) {
      // 保留原有的长度定义
      const lengthMatch = field.type.match(/\(([^)]+)\)/)
      if (lengthMatch) {
        result += lengthMatch[0]
      }
    }

    // 处理枚举值
    if (baseType === 'ENUM' && field.enumValues && field.enumValues.length > 0) {
      if (dialect === SQLDialect.MYSQL) {
        const enumValues = field.enumValues.map(v => `'${v.replace(/'/g, "''")}'`).join(', ')
        result = `ENUM(${enumValues})`
      } else {
        // 其他数据库使用CHECK约束
        result = typeMapping.nativeType
      }
    }

    return result
  }

  /**
   * 获取自增语法
   */
  private static getAutoIncrementSyntax(dialect: SQLDialect, features: DialectFeatures): string | null {
    switch (dialect) {
      case SQLDialect.MYSQL:
        return 'AUTO_INCREMENT'
      case SQLDialect.SQLITE:
        return 'AUTOINCREMENT'
      case SQLDialect.SQL_SERVER:
        return 'IDENTITY(1,1)'
      case SQLDialect.POSTGRESQL:
        return null // PostgreSQL uses SERIAL type
      case SQLDialect.ORACLE:
        return null // Oracle uses sequences and triggers
      default:
        return null
    }
  }

  /**
   * 格式化默认值
   */
  private static formatDefaultValue(value: string, fieldType: string, dialect: SQLDialect): string {
    // 处理特殊的默认值
    if (value.toUpperCase() === 'CURRENT_TIMESTAMP' || 
        value.toUpperCase() === 'NOW()' ||
        value.toUpperCase().includes('CURRENT_TIMESTAMP')) {
      return this.getCurrentTimestampSyntax(dialect)
    }

    // 字符串值需要引号
    if (fieldType.toUpperCase().includes('VARCHAR') || 
        fieldType.toUpperCase().includes('TEXT') ||
        fieldType.toUpperCase().includes('CHAR')) {
      return `'${value.replace(/'/g, "''")}'`
    }

    // 数值类型直接返回
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      return value
    }

    // 布尔值
    if (value.toUpperCase() === 'TRUE' || value.toUpperCase() === 'FALSE') {
      return this.formatBooleanValue(value.toUpperCase() === 'TRUE', dialect)
    }

    // 默认加引号
    return `'${value.replace(/'/g, "''")}'`
  }

  /**
   * 获取当前时间戳语法
   */
  private static getCurrentTimestampSyntax(dialect: SQLDialect): string {
    switch (dialect) {
      case SQLDialect.MYSQL:
        return 'CURRENT_TIMESTAMP'
      case SQLDialect.POSTGRESQL:
        return 'CURRENT_TIMESTAMP'
      case SQLDialect.SQLITE:
        return 'CURRENT_TIMESTAMP'
      case SQLDialect.SQL_SERVER:
        return 'GETDATE()'
      case SQLDialect.ORACLE:
        return 'CURRENT_TIMESTAMP'
      default:
        return 'CURRENT_TIMESTAMP'
    }
  }

  /**
   * 格式化布尔值
   */
  private static formatBooleanValue(value: boolean, dialect: SQLDialect): string {
    switch (dialect) {
      case SQLDialect.MYSQL:
      case SQLDialect.POSTGRESQL:
        return value ? 'TRUE' : 'FALSE'
      case SQLDialect.SQLITE:
      case SQLDialect.SQL_SERVER:
      case SQLDialect.ORACLE:
        return value ? '1' : '0'
      default:
        return value ? 'TRUE' : 'FALSE'
    }
  }

  /**
   * 格式化注释
   */
  private static formatComment(comment: string, dialect: SQLDialect): string | null {
    const escapedComment = comment.replace(/'/g, "''")
    
    switch (dialect) {
      case SQLDialect.MYSQL:
        return `COMMENT '${escapedComment}'`
      case SQLDialect.POSTGRESQL:
        return null // PostgreSQL uses separate COMMENT statements
      case SQLDialect.SQLITE:
        return null // SQLite doesn't support column comments in CREATE TABLE
      case SQLDialect.SQL_SERVER:
        return null // SQL Server uses extended properties
      case SQLDialect.ORACLE:
        return null // Oracle uses separate COMMENT statements
      default:
        return null
    }
  }

  /**
   * 生成表选项
   */
  private static generateTableOptions(
    table: ParsedTable,
    dialect: SQLDialect,
    features: DialectFeatures,
    options: SQLGenerationOptions
  ): string | null {
    const parts: string[] = []

    switch (dialect) {
      case SQLDialect.MYSQL:
        parts.push('ENGINE=InnoDB')
        parts.push('DEFAULT CHARSET=utf8mb4')
        parts.push('COLLATE=utf8mb4_unicode_ci')
        
        if (options.includeComments && table.comment) {
          parts.push(`COMMENT='${table.comment.replace(/'/g, "''")}'`)
        }
        break

      case SQLDialect.POSTGRESQL:
        // PostgreSQL doesn't have table options in CREATE TABLE
        break

      case SQLDialect.SQLITE:
        // SQLite doesn't have table options
        break

      case SQLDialect.SQL_SERVER:
        // SQL Server table options would go here
        break

      case SQLDialect.ORACLE:
        // Oracle table options would go here
        break
    }

    return parts.length > 0 ? parts.join(' ') : null
  }

  /**
   * 生成检查约束
   */
  private static generateCheckConstraints(
    table: ParsedTable,
    dialect: SQLDialect,
    features: DialectFeatures
  ): string[] {
    const constraints: string[] = []

    for (const field of table.fields) {
      // 枚举约束（对于非MySQL数据库）
      if (field.enumValues && field.enumValues.length > 0 && dialect !== SQLDialect.MYSQL) {
        const values = field.enumValues.map(v => `'${v.replace(/'/g, "''")}'`).join(', ')
        const constraintName = `chk_${table.name}_${field.name}_enum`
        constraints.push(`CONSTRAINT ${constraintName} CHECK (${this.quoteIdentifier(field.name, dialect)} IN (${values}))`)
      }

      // 其他业务约束可以在这里添加
    }

    return constraints
  }

  /**
   * 生成外键约束
   */
  private static generateForeignKeyConstraints(
    tables: ParsedTable[],
    dialect: SQLDialect,
    features: DialectFeatures,
    options: SQLGenerationOptions
  ): any[] {
    const statements: any[] = []

    for (const table of tables) {
      const tableName = options.tablePrefix ? `${options.tablePrefix}${table.name}` : table.name

      for (const field of table.fields) {
        if (field.referencedTable && field.referencedField) {
          const referencedTableName = options.tablePrefix ? `${options.tablePrefix}${field.referencedTable}` : field.referencedTable
          const constraintName = `fk_${table.name}_${field.name}`
          
          const sql = `ALTER TABLE ${this.quoteIdentifier(tableName, dialect)} 
ADD CONSTRAINT ${this.quoteIdentifier(constraintName, dialect)} 
FOREIGN KEY (${this.quoteIdentifier(field.name, dialect)}) 
REFERENCES ${this.quoteIdentifier(referencedTableName, dialect)}(${this.quoteIdentifier(field.referencedField, dialect)});`

          statements.push({
            type: 'ALTER_TABLE',
            table: tableName,
            sql,
            description: `外键约束：${field.name} -> ${field.referencedTable}.${field.referencedField}`
          })
        }
      }
    }

    return statements
  }

  /**
   * 生成索引
   */
  private static generateIndexes(
    tables: ParsedTable[],
    dialect: SQLDialect,
    features: DialectFeatures,
    options: SQLGenerationOptions
  ): any[] {
    const statements: any[] = []

    for (const table of tables) {
      const tableName = options.tablePrefix ? `${options.tablePrefix}${table.name}` : table.name

      // 为标记为需要索引的字段创建索引
      for (const field of table.fields) {
        if (field.isIndex && !field.isPrimaryKey && !field.isUnique) {
          const indexName = `idx_${table.name}_${field.name}`
          const sql = `CREATE INDEX ${this.quoteIdentifier(indexName, dialect)} ON ${this.quoteIdentifier(tableName, dialect)} (${this.quoteIdentifier(field.name, dialect)});`
          
          statements.push({
            type: 'CREATE_INDEX',
            table: tableName,
            sql,
            description: `索引：${field.name}`
          })
        }

        // 外键字段自动创建索引
        if (field.referencedTable && !field.isPrimaryKey && !field.isIndex) {
          const indexName = `idx_${table.name}_${field.name}_fk`
          const sql = `CREATE INDEX ${this.quoteIdentifier(indexName, dialect)} ON ${this.quoteIdentifier(tableName, dialect)} (${this.quoteIdentifier(field.name, dialect)});`
          
          statements.push({
            type: 'CREATE_INDEX',
            table: tableName,
            sql,
            description: `外键索引：${field.name}`
          })
        }
      }

      // 处理复合索引
      if (table.indexes) {
        for (const index of table.indexes) {
          const indexName = index.name || `idx_${table.name}_${index.fields.join('_')}`
          const fields = index.fields.map(f => this.quoteIdentifier(f, dialect)).join(', ')
          const unique = index.isUnique ? 'UNIQUE ' : ''
          const sql = `CREATE ${unique}INDEX ${this.quoteIdentifier(indexName, dialect)} ON ${this.quoteIdentifier(tableName, dialect)} (${fields});`
          
          statements.push({
            type: 'CREATE_INDEX',
            table: tableName,
            sql,
            description: index.comment || `复合索引：${index.fields.join(', ')}`
          })
        }
      }
    }

    return statements
  }

  // 辅助方法
  private static quoteIdentifier(identifier: string, dialect: SQLDialect): string {
    switch (dialect) {
      case SQLDialect.MYSQL:
        return `\`${identifier}\``
      case SQLDialect.POSTGRESQL:
      case SQLDialect.SQLITE:
        return `"${identifier}"`
      case SQLDialect.SQL_SERVER:
        return `[${identifier}]`
      case SQLDialect.ORACLE:
        return `"${identifier.toUpperCase()}"`
      default:
        return identifier
    }
  }

  private static sanitizeIdentifier(identifier: string, features: DialectFeatures): string {
    // 移除无效字符
    let sanitized = identifier.replace(/[^a-zA-Z0-9_]/g, '_')
    
    // 确保以字母开头
    if (!/^[a-zA-Z]/.test(sanitized)) {
      sanitized = 'tbl_' + sanitized
    }

    // 限制长度
    if (sanitized.length > features.maxIdentifierLength) {
      sanitized = sanitized.substring(0, features.maxIdentifierLength)
    }

    // 检查保留字
    if (features.reservedWords.includes(sanitized.toUpperCase())) {
      sanitized += '_tbl'
    }

    return sanitized
  }

  private static sortTablesByDependencies(tables: ParsedTable[]): ParsedTable[] {
    const sorted: ParsedTable[] = []
    const remaining = [...tables]
    const processed = new Set<string>()

    while (remaining.length > 0) {
      const canProcess = remaining.filter(table => 
        this.extractTableDependencies(table).every(dep => processed.has(dep))
      )

      if (canProcess.length === 0) {
        // 有循环依赖，按原顺序添加剩余表
        sorted.push(...remaining)
        break
      }

      for (const table of canProcess) {
        sorted.push(table)
        processed.add(table.name)
        const index = remaining.indexOf(table)
        remaining.splice(index, 1)
      }
    }

    return sorted
  }

  private static extractTableDependencies(table: ParsedTable): string[] {
    const dependencies = new Set<string>()
    
    for (const field of table.fields) {
      if (field.referencedTable && field.referencedTable !== table.name) {
        dependencies.add(field.referencedTable)
      }
    }

    return Array.from(dependencies)
  }

  private static estimateSize(statements: any[]): string {
    const totalChars = statements.reduce((sum, stmt) => sum + stmt.sql.length, 0)
    const kb = Math.round(totalChars / 1024)
    return kb > 0 ? `${kb}KB` : `${totalChars}B`
  }

  private static generateWarnings(model: ParsedModel, dialect: SQLDialect, features: DialectFeatures): string[] {
    const warnings: string[] = []

    // 检查不支持的特性
    for (const table of model.tables) {
      for (const field of table.fields) {
        if (field.isAutoIncrement && !features.supportsAutoIncrement) {
          warnings.push(`${features.name} 不支持 AUTO_INCREMENT，字段 ${table.name}.${field.name} 需要手动处理`)
        }

        if (field.type.toUpperCase() === 'JSON' && !features.supportsJSON) {
          warnings.push(`${features.name} 不支持 JSON 类型，字段 ${table.name}.${field.name} 将使用 TEXT 替代`)
        }

        if (field.type.toUpperCase() === 'UUID' && !features.supportsUUID) {
          warnings.push(`${features.name} 不支持 UUID 类型，字段 ${table.name}.${field.name} 需要使用其他类型`)
        }
      }
    }

    return warnings
  }

  private static generatePerformanceNotes(table: ParsedTable, dialect: SQLDialect): string {
    const notes: string[] = []

    // 检查主键
    const hasPrimaryKey = table.fields.some(f => f.isPrimaryKey)
    if (!hasPrimaryKey) {
      notes.push('建议添加主键以提高查询性能')
    }

    // 检查外键索引
    const foreignKeys = table.fields.filter(f => f.referencedTable)
    const unindexedForeignKeys = foreignKeys.filter(f => !f.isIndex && !f.isPrimaryKey)
    if (unindexedForeignKeys.length > 0) {
      notes.push('外键字段建议添加索引')
    }

    // 检查大表
    if (table.fields.length > 20) {
      notes.push('表字段较多，考虑垂直分表')
    }

    return notes.join('; ')
  }
}