import { ParsedModel, ParsedTable, ParsedField, SQLDialect } from '../types'
import { ValidationResult, ValidationIssue } from './ModelValidator'
import logger from '../../../utils/logger'

export interface CorrectionOptions {
  autoFixNaming?: boolean
  autoAddPrimaryKeys?: boolean
  autoFixTypes?: boolean
  autoOptimizeIndexes?: boolean
  preserveOriginalNames?: boolean
  targetDialect?: SQLDialect
}

export interface CorrectionResult {
  success: boolean
  correctedModel: ParsedModel
  appliedFixes: CorrectionFix[]
  remainingIssues: ValidationIssue[]
  summary: {
    fixesApplied: number
    issuesRemaining: number
  }
}

export interface CorrectionFix {
  type: 'naming' | 'type' | 'constraint' | 'index' | 'structure'
  target: {
    table?: string
    field?: string
    oldValue?: string
    newValue?: string
  }
  description: string
  impact: 'LOW' | 'MEDIUM' | 'HIGH'
}

export class ModelCorrector {
  /**
   * 自动修正模型问题
   */
  static async correctModel(
    model: ParsedModel,
    validationResult: ValidationResult,
    options: CorrectionOptions = {}
  ): Promise<CorrectionResult> {
    const correctedModel = JSON.parse(JSON.stringify(model)) // 深拷贝
    const appliedFixes: CorrectionFix[] = []
    const remainingIssues: ValidationIssue[] = []

    logger.info('开始模型自动修正', {
      modelName: model.name,
      issuesCount: validationResult.issues.length,
      options
    })

    // 按优先级处理问题
    const prioritizedIssues = this.prioritizeIssues(validationResult.issues)

    for (const issue of prioritizedIssues) {
      const fixed = await this.applyFix(correctedModel, issue, options)
      
      if (fixed) {
        appliedFixes.push(fixed)
      } else {
        remainingIssues.push(issue)
      }
    }

    // 执行后处理优化
    this.postProcessOptimizations(correctedModel, appliedFixes, options)

    const result: CorrectionResult = {
      success: appliedFixes.length > 0,
      correctedModel,
      appliedFixes,
      remainingIssues,
      summary: {
        fixesApplied: appliedFixes.length,
        issuesRemaining: remainingIssues.length
      }
    }

    logger.info('模型自动修正完成', {
      modelName: model.name,
      fixesApplied: appliedFixes.length,
      issuesRemaining: remainingIssues.length
    })

    return result
  }

  /**
   * 优先级排序问题
   */
  private static prioritizeIssues(issues: ValidationIssue[]): ValidationIssue[] {
    return issues.sort((a, b) => {
      // 按严重程度排序
      const severityOrder = { 'ERROR': 3, 'WARNING': 2, 'INFO': 1 }
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity]
      
      if (severityDiff !== 0) return severityDiff
      
      // 自动修复的问题优先
      if (a.autoFixable && !b.autoFixable) return -1
      if (!a.autoFixable && b.autoFixable) return 1
      
      return 0
    })
  }

  /**
   * 应用修复
   */
  private static async applyFix(
    model: ParsedModel,
    issue: ValidationIssue,
    options: CorrectionOptions
  ): Promise<CorrectionFix | null> {
    if (!issue.autoFixable) {
      return null
    }

    switch (issue.rule) {
      case 'table_naming_convention':
        return this.fixTableNaming(model, issue, options)
      
      case 'field_naming_convention':
        return this.fixFieldNaming(model, issue, options)
      
      case 'primary_key_required':
        return this.fixPrimaryKey(model, issue, options)
      
      case 'field_types_valid':
        return this.fixFieldType(model, issue, options)
      
      case 'index_optimization':
        return this.fixIndexOptimization(model, issue, options)
      
      default:
        return null
    }
  }

  /**
   * 修复表命名问题
   */
  private static fixTableNaming(
    model: ParsedModel,
    issue: ValidationIssue,
    options: CorrectionOptions
  ): CorrectionFix | null {
    if (!options.autoFixNaming || !issue.target.table) {
      return null
    }

    const table = model.tables.find(t => t.name === issue.target.table)
    if (!table) return null

    const oldName = table.name
    let newName = oldName

    // 修复命名规范
    if (issue.message.includes('命名规范')) {
      newName = this.normalizeTableName(oldName)
    }
    
    // 处理保留字
    if (issue.message.includes('保留字')) {
      newName = `${oldName}_table`
    }

    if (newName !== oldName) {
      // 更新表名
      table.name = newName
      
      // 更新相关的外键引用
      this.updateForeignKeyReferences(model, oldName, newName)

      return {
        type: 'naming',
        target: {
          table: oldName,
          oldValue: oldName,
          newValue: newName
        },
        description: `表名从 "${oldName}" 修正为 "${newName}"`,
        impact: 'LOW'
      }
    }

    return null
  }

  /**
   * 修复字段命名问题
   */
  private static fixFieldNaming(
    model: ParsedModel,
    issue: ValidationIssue,
    options: CorrectionOptions
  ): CorrectionFix | null {
    if (!options.autoFixNaming || !issue.target.table || !issue.target.field) {
      return null
    }

    const table = model.tables.find(t => t.name === issue.target.table)
    if (!table) return null

    const field = table.fields.find(f => f.name === issue.target.field)
    if (!field) return null

    const oldName = field.name
    let newName = oldName

    // 修复命名规范
    if (issue.message.includes('命名规范')) {
      newName = this.normalizeFieldName(oldName)
    }
    
    // 处理保留字
    if (issue.message.includes('保留字')) {
      newName = `${oldName}_field`
    }

    if (newName !== oldName) {
      field.name = newName

      return {
        type: 'naming',
        target: {
          table: table.name,
          field: oldName,
          oldValue: oldName,
          newValue: newName
        },
        description: `字段名从 "${oldName}" 修正为 "${newName}"`,
        impact: 'LOW'
      }
    }

    return null
  }

  /**
   * 修复主键问题
   */
  private static fixPrimaryKey(
    model: ParsedModel,
    issue: ValidationIssue,
    options: CorrectionOptions
  ): CorrectionFix | null {
    if (!options.autoAddPrimaryKeys || !issue.target.table) {
      return null
    }

    const table = model.tables.find(t => t.name === issue.target.table)
    if (!table) return null

    // 检查是否已有主键
    const existingPK = table.fields.find(f => f.isPrimaryKey)
    if (existingPK) return null

    // 检查是否有合适的候选字段
    const candidates = table.fields.filter(f => 
      f.name.toLowerCase() === 'id' || 
      f.name.toLowerCase().endsWith('_id') ||
      (f.type.includes('INT') && f.isAutoIncrement)
    )

    if (candidates.length > 0) {
      // 使用现有字段作为主键
      const pkField = candidates[0]
      pkField.isPrimaryKey = true
      pkField.nullable = false
      
      if (!pkField.isAutoIncrement && pkField.type.includes('INT')) {
        pkField.isAutoIncrement = true
      }

      return {
        type: 'constraint',
        target: {
          table: table.name,
          field: pkField.name
        },
        description: `将字段 "${pkField.name}" 设置为主键`,
        impact: 'MEDIUM'
      }
    } else {
      // 添加新的ID字段作为主键
      const idField: ParsedField = {
        name: 'id',
        type: 'INT',
        nullable: false,
        isPrimaryKey: true,
        isAutoIncrement: true,
        comment: '自动生成的主键ID'
      }

      // 将主键字段插入到第一位
      table.fields.unshift(idField)

      return {
        type: 'structure',
        target: {
          table: table.name,
          field: 'id'
        },
        description: `为表 "${table.name}" 添加自增主键字段 "id"`,
        impact: 'HIGH'
      }
    }
  }

  /**
   * 修复字段类型问题
   */
  private static fixFieldType(
    model: ParsedModel,
    issue: ValidationIssue,
    options: CorrectionOptions
  ): CorrectionFix | null {
    if (!options.autoFixTypes || !issue.target.table || !issue.target.field) {
      return null
    }

    const table = model.tables.find(t => t.name === issue.target.table)
    if (!table) return null

    const field = table.fields.find(f => f.name === issue.target.field)
    if (!field) return null

    const oldType = field.type
    let newType = oldType

    // 修复无效类型
    if (issue.message.includes('类型') && issue.message.includes('无效')) {
      newType = this.correctFieldType(oldType, options.targetDialect)
    }

    // 添加缺失的长度
    if (issue.message.includes('未指定长度')) {
      if (oldType.toUpperCase().startsWith('VARCHAR')) {
        newType = 'VARCHAR(255)'
      } else if (oldType.toUpperCase().startsWith('DECIMAL')) {
        newType = 'DECIMAL(10,2)'
        field.precision = 10
        field.scale = 2
      }
    }

    // 优化长度过大的VARCHAR
    if (issue.message.includes('长度过大')) {
      newType = 'TEXT'
    }

    if (newType !== oldType) {
      field.type = newType

      return {
        type: 'type',
        target: {
          table: table.name,
          field: field.name,
          oldValue: oldType,
          newValue: newType
        },
        description: `字段类型从 "${oldType}" 修正为 "${newType}"`,
        impact: 'MEDIUM'
      }
    }

    return null
  }

  /**
   * 修复索引优化问题
   */
  private static fixIndexOptimization(
    model: ParsedModel,
    issue: ValidationIssue,
    options: CorrectionOptions
  ): CorrectionFix | null {
    if (!options.autoOptimizeIndexes || !issue.target.table || !issue.target.field) {
      return null
    }

    const table = model.tables.find(t => t.name === issue.target.table)
    if (!table) return null

    const field = table.fields.find(f => f.name === issue.target.field)
    if (!field) return null

    // 标记字段需要索引
    field.isIndex = true

    return {
      type: 'index',
      target: {
        table: table.name,
        field: field.name
      },
      description: `为字段 "${field.name}" 添加索引`,
      impact: 'LOW'
    }
  }

  /**
   * 后处理优化
   */
  private static postProcessOptimizations(
    model: ParsedModel,
    appliedFixes: CorrectionFix[],
    options: CorrectionOptions
  ): void {
    // 优化字段顺序：主键在前
    for (const table of model.tables) {
      table.fields.sort((a, b) => {
        if (a.isPrimaryKey && !b.isPrimaryKey) return -1
        if (!a.isPrimaryKey && b.isPrimaryKey) return 1
        return 0
      })
    }

    // 添加常用字段
    this.addCommonFields(model, appliedFixes, options)
  }

  /**
   * 添加常用字段
   */
  private static addCommonFields(
    model: ParsedModel,
    appliedFixes: CorrectionFix[],
    options: CorrectionOptions
  ): void {
    for (const table of model.tables) {
      const fieldNames = table.fields.map(f => f.name.toLowerCase())
      
      // 添加创建时间字段
      if (!fieldNames.includes('created_at') && !fieldNames.includes('createtime')) {
        const createdAtField: ParsedField = {
          name: 'created_at',
          type: 'DATETIME',
          nullable: false,
          defaultValue: 'CURRENT_TIMESTAMP',
          comment: '创建时间',
          isPrimaryKey: false,
          isAutoIncrement: false
        }
        
        table.fields.push(createdAtField)
        
        appliedFixes.push({
          type: 'structure',
          target: {
            table: table.name,
            field: 'created_at'
          },
          description: `为表 "${table.name}" 添加创建时间字段`,
          impact: 'LOW'
        })
      }

      // 添加更新时间字段
      if (!fieldNames.includes('updated_at') && !fieldNames.includes('updatetime')) {
        const updatedAtField: ParsedField = {
          name: 'updated_at',
          type: 'DATETIME',
          nullable: true,
          defaultValue: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
          comment: '更新时间',
          isPrimaryKey: false,
          isAutoIncrement: false
        }
        
        table.fields.push(updatedAtField)
        
        appliedFixes.push({
          type: 'structure',
          target: {
            table: table.name,
            field: 'updated_at'
          },
          description: `为表 "${table.name}" 添加更新时间字段`,
          impact: 'LOW'
        })
      }
    }
  }

  // 辅助方法
  private static normalizeTableName(name: string): string {
    return name.toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
  }

  private static normalizeFieldName(name: string): string {
    return name.toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
  }

  private static correctFieldType(type: string, dialect?: SQLDialect): string {
    const typeMapping: Record<string, string> = {
      'STRING': 'VARCHAR(255)',
      'INTEGER': 'INT',
      'NUMERIC': 'DECIMAL(10,2)',
      'BOOL': 'BOOLEAN',
      'DATETIME2': 'DATETIME',
      'NVARCHAR': 'VARCHAR',
      'NTEXT': 'TEXT'
    }

    const upperType = type.toUpperCase()
    const baseType = upperType.split('(')[0]
    
    return typeMapping[baseType] || type
  }

  private static updateForeignKeyReferences(model: ParsedModel, oldTableName: string, newTableName: string): void {
    for (const table of model.tables) {
      for (const field of table.fields) {
        if (field.referencedTable === oldTableName) {
          field.referencedTable = newTableName
        }
      }
    }

    // 更新关系定义中的引用
    if (model.relationships) {
      for (const relation of model.relationships) {
        if (relation.fromTable === oldTableName) {
          relation.fromTable = newTableName
        }
        if (relation.toTable === oldTableName) {
          relation.toTable = newTableName
        }
      }
    }
  }
}