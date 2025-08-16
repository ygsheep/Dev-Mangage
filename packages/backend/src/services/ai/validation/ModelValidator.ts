import { ParsedModel, ParsedTable, ParsedField, ValidationResult, SQLDialect } from '../types'
import logger from '../../../utils/logger'

export interface ValidationOptions {
  strictMode?: boolean
  checkNaming?: boolean
  checkTypes?: boolean
  checkRelationships?: boolean
  checkConstraints?: boolean
  targetDialect?: SQLDialect
  customRules?: ValidationRule[]
}

export interface ValidationRule {
  name: string
  description: string
  severity: 'ERROR' | 'WARNING' | 'INFO'
  check: (model: ParsedModel, options?: ValidationOptions) => ValidationIssue[]
}

export interface ValidationIssue {
  rule: string
  severity: 'ERROR' | 'WARNING' | 'INFO'
  message: string
  target: {
    table?: string
    field?: string
    relationship?: string
  }
  suggestion?: string
  autoFixable?: boolean
}

export interface ValidationResult {
  isValid: boolean
  score: number // 0-100
  issues: ValidationIssue[]
  suggestions: string[]
  summary: {
    errorCount: number
    warningCount: number
    infoCount: number
  }
}

export class ModelValidator {
  private static readonly DEFAULT_RULES: ValidationRule[] = [
    {
      name: 'table_naming_convention',
      description: '检查表命名规范',
      severity: 'WARNING',
      check: ModelValidator.checkTableNaming
    },
    {
      name: 'field_naming_convention', 
      description: '检查字段命名规范',
      severity: 'WARNING',
      check: ModelValidator.checkFieldNaming
    },
    {
      name: 'primary_key_required',
      description: '检查每个表是否有主键',
      severity: 'ERROR',
      check: ModelValidator.checkPrimaryKeys
    },
    {
      name: 'field_types_valid',
      description: '检查字段类型是否有效',
      severity: 'ERROR',
      check: ModelValidator.checkFieldTypes
    },
    {
      name: 'foreign_key_integrity',
      description: '检查外键引用完整性',
      severity: 'ERROR',
      check: ModelValidator.checkForeignKeyIntegrity
    },
    {
      name: 'index_optimization',
      description: '检查索引优化建议',
      severity: 'INFO',
      check: ModelValidator.checkIndexOptimization
    },
    {
      name: 'table_relationships',
      description: '检查表关系合理性',
      severity: 'WARNING',
      check: ModelValidator.checkTableRelationships
    },
    {
      name: 'data_consistency',
      description: '检查数据一致性约束',
      severity: 'WARNING',
      check: ModelValidator.checkDataConsistency
    }
  ]

  /**
   * 验证数据模型
   */
  static validate(model: ParsedModel, options: ValidationOptions = {}): ValidationResult {
    const issues: ValidationIssue[] = []
    const rules = [...this.DEFAULT_RULES, ...(options.customRules || [])]

    logger.info('开始模型验证', { 
      modelName: model.name,
      tablesCount: model.tables.length,
      rulesCount: rules.length
    })

    // 执行所有验证规则
    for (const rule of rules) {
      try {
        const ruleIssues = rule.check(model, options)
        issues.push(...ruleIssues)
      } catch (error) {
        logger.warn('验证规则执行失败', { 
          rule: rule.name, 
          error: error.message 
        })
      }
    }

    // 计算验证分数
    const score = this.calculateScore(issues)
    const summary = this.summarizeIssues(issues)
    const suggestions = this.generateSuggestions(issues, model)

    const result: ValidationResult = {
      isValid: summary.errorCount === 0,
      score,
      issues,
      suggestions,
      summary
    }

    logger.info('模型验证完成', {
      modelName: model.name,
      isValid: result.isValid,
      score,
      errorCount: summary.errorCount,
      warningCount: summary.warningCount
    })

    return result
  }

  /**
   * 检查表命名规范
   */
  private static checkTableNaming(model: ParsedModel, options?: ValidationOptions): ValidationIssue[] {
    const issues: ValidationIssue[] = []
    
    for (const table of model.tables) {
      // 检查表名格式
      if (!/^[a-z][a-z0-9_]*$/.test(table.name)) {
        issues.push({
          rule: 'table_naming_convention',
          severity: 'WARNING',
          message: `表名 "${table.name}" 不符合命名规范，建议使用小写字母、数字和下划线`,
          target: { table: table.name },
          suggestion: `建议改为: ${this.suggestTableName(table.name)}`,
          autoFixable: true
        })
      }

      // 检查表名是否过长
      if (table.name.length > 64) {
        issues.push({
          rule: 'table_naming_convention',
          severity: 'WARNING',
          message: `表名 "${table.name}" 过长 (${table.name.length} 字符)，建议不超过64字符`,
          target: { table: table.name },
          autoFixable: false
        })
      }

      // 检查是否使用了保留字
      if (this.isReservedWord(table.name)) {
        issues.push({
          rule: 'table_naming_convention',
          severity: 'ERROR',
          message: `表名 "${table.name}" 是数据库保留字，必须修改`,
          target: { table: table.name },
          suggestion: `建议改为: ${table.name}_table`,
          autoFixable: true
        })
      }
    }

    // 检查表名重复
    const tableNames = model.tables.map(t => t.name.toLowerCase())
    const duplicates = tableNames.filter((name, index) => tableNames.indexOf(name) !== index)
    
    for (const duplicate of [...new Set(duplicates)]) {
      issues.push({
        rule: 'table_naming_convention',
        severity: 'ERROR',
        message: `发现重复的表名: ${duplicate}`,
        target: { table: duplicate },
        autoFixable: false
      })
    }

    return issues
  }

  /**
   * 检查字段命名规范
   */
  private static checkFieldNaming(model: ParsedModel, options?: ValidationOptions): ValidationIssue[] {
    const issues: ValidationIssue[] = []
    
    for (const table of model.tables) {
      for (const field of table.fields) {
        // 检查字段名格式
        if (!/^[a-z][a-z0-9_]*$/.test(field.name)) {
          issues.push({
            rule: 'field_naming_convention',
            severity: 'WARNING',
            message: `字段 "${table.name}.${field.name}" 不符合命名规范`,
            target: { table: table.name, field: field.name },
            suggestion: `建议改为: ${this.suggestFieldName(field.name)}`,
            autoFixable: true
          })
        }

        // 检查字段名长度
        if (field.name.length > 64) {
          issues.push({
            rule: 'field_naming_convention',
            severity: 'WARNING',
            message: `字段名 "${field.name}" 过长`,
            target: { table: table.name, field: field.name },
            autoFixable: false
          })
        }

        // 检查是否使用了保留字
        if (this.isReservedWord(field.name)) {
          issues.push({
            rule: 'field_naming_convention',
            severity: 'ERROR',
            message: `字段名 "${field.name}" 是数据库保留字`,
            target: { table: table.name, field: field.name },
            autoFixable: true
          })
        }
      }

      // 检查字段名重复
      const fieldNames = table.fields.map(f => f.name.toLowerCase())
      const duplicates = fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index)
      
      for (const duplicate of [...new Set(duplicates)]) {
        issues.push({
          rule: 'field_naming_convention',
          severity: 'ERROR',
          message: `表 ${table.name} 中发现重复的字段名: ${duplicate}`,
          target: { table: table.name, field: duplicate },
          autoFixable: false
        })
      }
    }

    return issues
  }

  /**
   * 检查主键
   */
  private static checkPrimaryKeys(model: ParsedModel, options?: ValidationOptions): ValidationIssue[] {
    const issues: ValidationIssue[] = []
    
    for (const table of model.tables) {
      const primaryKeyFields = table.fields.filter(f => f.isPrimaryKey)
      
      if (primaryKeyFields.length === 0) {
        issues.push({
          rule: 'primary_key_required',
          severity: 'ERROR',
          message: `表 "${table.name}" 没有定义主键`,
          target: { table: table.name },
          suggestion: '建议添加 id INT AUTO_INCREMENT PRIMARY KEY',
          autoFixable: true
        })
      }

      // 检查复合主键的合理性
      if (primaryKeyFields.length > 3) {
        issues.push({
          rule: 'primary_key_required',
          severity: 'WARNING',
          message: `表 "${table.name}" 的复合主键字段过多 (${primaryKeyFields.length}个)`,
          target: { table: table.name },
          suggestion: '建议使用单一自增主键，将复合键改为唯一索引',
          autoFixable: false
        })
      }
    }

    return issues
  }

  /**
   * 检查字段类型
   */
  private static checkFieldTypes(model: ParsedModel, options?: ValidationOptions): ValidationIssue[] {
    const issues: ValidationIssue[] = []
    const validTypes = this.getValidTypes(options?.targetDialect || SQLDialect.MYSQL)
    
    for (const table of model.tables) {
      for (const field of table.fields) {
        const baseType = field.type.split('(')[0].toUpperCase()
        
        if (!validTypes.includes(baseType)) {
          issues.push({
            rule: 'field_types_valid',
            severity: 'ERROR',
            message: `字段 "${table.name}.${field.name}" 的类型 "${field.type}" 无效`,
            target: { table: table.name, field: field.name },
            suggestion: this.suggestFieldType(field.type),
            autoFixable: true
          })
        }

        // 检查类型和长度的匹配
        this.validateTypeLength(field, table.name, issues)
      }
    }

    return issues
  }

  /**
   * 检查外键完整性
   */
  private static checkForeignKeyIntegrity(model: ParsedModel, options?: ValidationOptions): ValidationIssue[] {
    const issues: ValidationIssue[] = []
    const tableNames = new Set(model.tables.map(t => t.name))
    
    for (const table of model.tables) {
      for (const field of table.fields) {
        if (field.referencedTable) {
          // 检查引用的表是否存在
          if (!tableNames.has(field.referencedTable)) {
            issues.push({
              rule: 'foreign_key_integrity',
              severity: 'ERROR',
              message: `字段 "${table.name}.${field.name}" 引用了不存在的表 "${field.referencedTable}"`,
              target: { table: table.name, field: field.name },
              autoFixable: false
            })
            continue
          }

          // 检查引用的字段是否存在
          const referencedTable = model.tables.find(t => t.name === field.referencedTable)
          if (referencedTable && field.referencedField) {
            const referencedField = referencedTable.fields.find(f => f.name === field.referencedField)
            if (!referencedField) {
              issues.push({
                rule: 'foreign_key_integrity',
                severity: 'ERROR',
                message: `字段 "${table.name}.${field.name}" 引用了不存在的字段 "${field.referencedTable}.${field.referencedField}"`,
                target: { table: table.name, field: field.name },
                autoFixable: false
              })
            }
          }
        }
      }
    }

    return issues
  }

  /**
   * 检查索引优化
   */
  private static checkIndexOptimization(model: ParsedModel, options?: ValidationOptions): ValidationIssue[] {
    const issues: ValidationIssue[] = []
    
    for (const table of model.tables) {
      // 检查外键字段是否有索引
      const foreignKeyFields = table.fields.filter(f => f.referencedTable)
      for (const fkField of foreignKeyFields) {
        if (!fkField.isIndex && !fkField.isPrimaryKey) {
          issues.push({
            rule: 'index_optimization',
            severity: 'INFO',
            message: `外键字段 "${table.name}.${fkField.name}" 建议添加索引`,
            target: { table: table.name, field: fkField.name },
            suggestion: `CREATE INDEX idx_${table.name}_${fkField.name} ON ${table.name}(${fkField.name})`,
            autoFixable: true
          })
        }
      }

      // 检查经常查询的字段
      const commonQueryFields = table.fields.filter(f => 
        f.name.includes('name') || 
        f.name.includes('code') || 
        f.name.includes('status') ||
        f.name.includes('email')
      )
      
      for (const field of commonQueryFields) {
        if (!field.isIndex && !field.isPrimaryKey && !field.isUnique) {
          issues.push({
            rule: 'index_optimization',
            severity: 'INFO',
            message: `常用查询字段 "${table.name}.${field.name}" 建议添加索引`,
            target: { table: table.name, field: field.name },
            autoFixable: true
          })
        }
      }
    }

    return issues
  }

  /**
   * 检查表关系
   */
  private static checkTableRelationships(model: ParsedModel, options?: ValidationOptions): ValidationIssue[] {
    const issues: ValidationIssue[] = []
    
    // 检查孤立表
    const referencedTables = new Set<string>()
    const referencingTables = new Set<string>()
    
    for (const table of model.tables) {
      for (const field of table.fields) {
        if (field.referencedTable) {
          referencedTables.add(field.referencedTable)
          referencingTables.add(table.name)
        }
      }
    }

    for (const table of model.tables) {
      if (!referencedTables.has(table.name) && !referencingTables.has(table.name)) {
        issues.push({
          rule: 'table_relationships',
          severity: 'INFO',
          message: `表 "${table.name}" 没有与其他表建立关系，可能是孤立表`,
          target: { table: table.name },
          autoFixable: false
        })
      }
    }

    return issues
  }

  /**
   * 检查数据一致性
   */
  private static checkDataConsistency(model: ParsedModel, options?: ValidationOptions): ValidationIssue[] {
    const issues: ValidationIssue[] = []
    
    for (const table of model.tables) {
      for (const field of table.fields) {
        // 检查枚举值的合理性
        if (field.enumValues && field.enumValues.length > 0) {
          if (field.enumValues.length > 20) {
            issues.push({
              rule: 'data_consistency',
              severity: 'WARNING',
              message: `字段 "${table.name}.${field.name}" 的枚举值过多 (${field.enumValues.length}个)`,
              target: { table: table.name, field: field.name },
              suggestion: '考虑使用独立的字典表',
              autoFixable: false
            })
          }
        }

        // 检查字段长度的合理性
        if (field.type.includes('VARCHAR') && field.length) {
          if (field.length > 1000) {
            issues.push({
              rule: 'data_consistency',
              severity: 'WARNING',
              message: `VARCHAR字段 "${table.name}.${field.name}" 长度过大 (${field.length})`,
              target: { table: table.name, field: field.name },
              suggestion: '考虑使用TEXT类型',
              autoFixable: true
            })
          }
        }
      }
    }

    return issues
  }

  /**
   * 计算验证分数
   */
  private static calculateScore(issues: ValidationIssue[]): number {
    let score = 100
    
    for (const issue of issues) {
      switch (issue.severity) {
        case 'ERROR':
          score -= 10
          break
        case 'WARNING':
          score -= 3
          break
        case 'INFO':
          score -= 1
          break
      }
    }

    return Math.max(0, score)
  }

  /**
   * 汇总问题
   */
  private static summarizeIssues(issues: ValidationIssue[]) {
    return {
      errorCount: issues.filter(i => i.severity === 'ERROR').length,
      warningCount: issues.filter(i => i.severity === 'WARNING').length,
      infoCount: issues.filter(i => i.severity === 'INFO').length
    }
  }

  /**
   * 生成改进建议
   */
  private static generateSuggestions(issues: ValidationIssue[], model: ParsedModel): string[] {
    const suggestions: string[] = []
    
    const errorCount = issues.filter(i => i.severity === 'ERROR').length
    const warningCount = issues.filter(i => i.severity === 'WARNING').length
    
    if (errorCount > 0) {
      suggestions.push(`发现${errorCount}个严重问题，建议优先解决`)
    }
    
    if (warningCount > 0) {
      suggestions.push(`发现${warningCount}个警告，建议在后续版本中改进`)
    }

    // 添加通用建议
    if (model.tables.length > 20) {
      suggestions.push('数据库表较多，建议考虑模块化设计')
    }

    const autoFixableCount = issues.filter(i => i.autoFixable).length
    if (autoFixableCount > 0) {
      suggestions.push(`有${autoFixableCount}个问题可以自动修复`)
    }

    return suggestions
  }

  // 辅助方法
  private static suggestTableName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9_]/g, '_')
  }

  private static suggestFieldName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9_]/g, '_')
  }

  private static isReservedWord(word: string): boolean {
    const reservedWords = [
      'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER',
      'TABLE', 'INDEX', 'DATABASE', 'SCHEMA', 'USER', 'ORDER', 'BY', 'GROUP', 'HAVING',
      'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 'UNION', 'ALL', 'DISTINCT', 'AS',
      'AND', 'OR', 'NOT', 'NULL', 'TRUE', 'FALSE', 'PRIMARY', 'KEY', 'FOREIGN',
      'REFERENCES', 'UNIQUE', 'CHECK', 'DEFAULT', 'AUTO_INCREMENT'
    ]
    return reservedWords.includes(word.toUpperCase())
  }

  private static getValidTypes(dialect: SQLDialect): string[] {
    const commonTypes = ['INT', 'VARCHAR', 'TEXT', 'DATE', 'DATETIME', 'TIMESTAMP', 'BOOLEAN', 'DECIMAL', 'FLOAT', 'DOUBLE']
    
    switch (dialect) {
      case SQLDialect.MYSQL:
        return [...commonTypes, 'BIGINT', 'TINYINT', 'MEDIUMINT', 'LONGTEXT', 'JSON', 'BLOB']
      case SQLDialect.POSTGRESQL:
        return [...commonTypes, 'BIGINT', 'SMALLINT', 'JSONB', 'UUID', 'SERIAL', 'BIGSERIAL']
      case SQLDialect.SQLITE:
        return ['INTEGER', 'TEXT', 'REAL', 'BLOB', 'NUMERIC']
      default:
        return commonTypes
    }
  }

  private static suggestFieldType(invalidType: string): string {
    const typeMapping: Record<string, string> = {
      'STRING': 'VARCHAR(255)',
      'INTEGER': 'INT',
      'NUMERIC': 'DECIMAL(10,2)',
      'BOOL': 'BOOLEAN',
      'DATETIME2': 'DATETIME'
    }
    
    const upperType = invalidType.toUpperCase()
    return typeMapping[upperType] || 'VARCHAR(255)'
  }

  private static validateTypeLength(field: ParsedField, tableName: string, issues: ValidationIssue[]): void {
    const type = field.type.toUpperCase()
    
    if (type.startsWith('VARCHAR')) {
      if (!field.length || field.length <= 0) {
        issues.push({
          rule: 'field_types_valid',
          severity: 'WARNING',
          message: `VARCHAR字段 "${tableName}.${field.name}" 未指定长度`,
          target: { table: tableName, field: field.name },
          suggestion: '建议指定合适的长度，如 VARCHAR(255)',
          autoFixable: true
        })
      }
    }

    if (type.startsWith('DECIMAL')) {
      if (!field.precision || !field.scale) {
        issues.push({
          rule: 'field_types_valid',
          severity: 'WARNING',
          message: `DECIMAL字段 "${tableName}.${field.name}" 未指定精度和标度`,
          target: { table: tableName, field: field.name },
          suggestion: '建议指定精度和标度，如 DECIMAL(10,2)',
          autoFixable: true
        })
      }
    }
  }
}