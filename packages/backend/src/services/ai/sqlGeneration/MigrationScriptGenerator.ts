import { SQLDialect, ParsedModel, ParsedTable, ParsedField, GeneratedSQL } from '../types'
import { SQLDialectManager } from './SQLDialectManager'
import logger from '../../../utils/logger'

export interface MigrationOperation {
  type: 'CREATE_TABLE' | 'DROP_TABLE' | 'ALTER_TABLE' | 'ADD_COLUMN' | 'DROP_COLUMN' | 'MODIFY_COLUMN' | 'ADD_INDEX' | 'DROP_INDEX' | 'ADD_CONSTRAINT' | 'DROP_CONSTRAINT'
  table: string
  column?: string
  oldValue?: any
  newValue?: any
  description: string
}

export interface MigrationScript {
  version: string
  dialect: SQLDialect
  operations: MigrationOperation[]
  upQueries: string[]
  downQueries: string[]
  metadata: {
    createdAt: Date
    description: string
    author?: string
    migrationId: string
    dependencies: string[]
    estimatedTime: number
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
    dataLoss: boolean
  }
}

export interface MigrationPlan {
  migrations: MigrationScript[]
  summary: {
    totalMigrations: number
    totalOperations: number
    estimatedTime: number
    riskAssessment: string
    dataLossOperations: number
  }
}

export interface MigrationOptions {
  generateDownMigrations?: boolean
  batchSize?: number
  includeData?: boolean
  safeMode?: boolean
  skipValidation?: boolean
  targetDialect?: SQLDialect
  preserveData?: boolean
  chunkLargeOperations?: boolean
}

export class MigrationScriptGenerator {
  /**
   * 生成数据模型的迁移脚本
   */
  static generateModelMigration(
    model: ParsedModel,
    dialect: SQLDialect,
    options: MigrationOptions = {}
  ): MigrationScript {
    const migrationId = `create_${model.name.toLowerCase()}_${Date.now()}`
    const operations: MigrationOperation[] = []
    const upQueries: string[] = []
    const downQueries: string[] = []

    logger.info('生成模型迁移脚本', {
      modelName: model.name,
      dialect,
      tablesCount: model.tables.length
    })

    // 生成创建表的操作
    const sqlResult = SQLDialectManager.generateSQL(model, dialect, {
      includeComments: true,
      includeIndexes: true,
      includeConstraints: true,
      includeForeignKeys: true
    })

    // 按依赖关系排序表
    const sortedTables = this.sortTablesByDependencies(model.tables)

    // 生成CREATE TABLE语句
    for (const table of sortedTables) {
      operations.push({
        type: 'CREATE_TABLE',
        table: table.name,
        description: `创建表 ${table.name}`
      })

      const tableStatement = sqlResult.statements.find(s => s.table === table.name && s.type === 'CREATE_TABLE')
      if (tableStatement) {
        upQueries.push(tableStatement.sql)
        
        if (options.generateDownMigrations) {
          downQueries.unshift(`DROP TABLE IF EXISTS ${this.quoteIdentifier(table.name, dialect)};`)
        }
      }
    }

    // 生成外键约束
    const foreignKeyStatements = sqlResult.statements.filter(s => s.type === 'ALTER_TABLE')
    for (const stmt of foreignKeyStatements) {
      operations.push({
        type: 'ADD_CONSTRAINT',
        table: stmt.table,
        description: `Add foreign key constraint to ${stmt.table}`
      })
      
      upQueries.push(stmt.sql)
    }

    // 生成索引
    const indexStatements = sqlResult.statements.filter(s => s.type === 'CREATE_INDEX')
    for (const stmt of indexStatements) {
      operations.push({
        type: 'ADD_INDEX',
        table: stmt.table,
        description: `Add index to ${stmt.table}`
      })
      
      upQueries.push(stmt.sql)
    }

    const migration: MigrationScript = {
      version: '1.0.0',
      dialect,
      operations,
      upQueries,
      downQueries,
      metadata: {
        createdAt: new Date(),
        description: `创建数据模型: ${model.name}`,
        migrationId,
        dependencies: [],
        estimatedTime: this.estimateMigrationTime(operations),
        riskLevel: this.assessRiskLevel(operations),
        dataLoss: false
      }
    }

    logger.info('模型迁移脚本生成完成', {
      migrationId,
      operationsCount: operations.length,
      upQueriesCount: upQueries.length,
      estimatedTime: migration.metadata.estimatedTime
    })

    return migration
  }

  /**
   * 生成两个模型之间的差异迁移脚本
   */
  static generateDiffMigration(
    oldModel: ParsedModel,
    newModel: ParsedModel,
    dialect: SQLDialect,
    options: MigrationOptions = {}
  ): MigrationScript {
    const migrationId = `migrate_${newModel.name.toLowerCase()}_${Date.now()}`
    const operations: MigrationOperation[] = []
    const upQueries: string[] = []
    const downQueries: string[] = []

    logger.info('生成差异迁移脚本', {
      oldModelName: oldModel.name,
      newModelName: newModel.name,
      dialect
    })

    // 分析表级别的变化
    const tableChanges = this.analyzeTableChanges(oldModel, newModel)
    
    // 处理删除的表
    for (const table of tableChanges.dropped) {
      operations.push({
        type: 'DROP_TABLE',
        table: table.name,
        description: `删除表 ${table.name}`
      })
      
      if (options.safeMode) {
        upQueries.push(`-- 安全模式：请手动确认删除表 ${table.name}`)
        upQueries.push(`-- DROP TABLE IF EXISTS ${this.quoteIdentifier(table.name, dialect)};`)
      } else {
        upQueries.push(`DROP TABLE IF EXISTS ${this.quoteIdentifier(table.name, dialect)};`)
      }
      
      if (options.generateDownMigrations) {
        // 重新创建删除的表
        const createSQL = SQLDialectManager.generateSQL(
          { name: oldModel.name, tables: [table], relationships: [] },
          dialect
        )
        downQueries.unshift(...createSQL.statements.map(s => s.sql))
      }
    }

    // 处理新增的表
    for (const table of tableChanges.added) {
      operations.push({
        type: 'CREATE_TABLE',
        table: table.name,
        description: `创建表 ${table.name}`
      })
      
      const createSQL = SQLDialectManager.generateSQL(
        { name: newModel.name, tables: [table], relationships: [] },
        dialect
      )
      upQueries.push(...createSQL.statements.map(s => s.sql))
      
      if (options.generateDownMigrations) {
        downQueries.unshift(`DROP TABLE IF EXISTS ${this.quoteIdentifier(table.name, dialect)};`)
      }
    }

    // 处理修改的表
    for (const { oldTable, newTable } of tableChanges.modified) {
      const columnChanges = this.analyzeColumnChanges(oldTable, newTable)
      
      // 处理删除的列
      for (const column of columnChanges.dropped) {
        operations.push({
          type: 'DROP_COLUMN',
          table: newTable.name,
          column: column.name,
          description: `删除列 ${newTable.name}.${column.name}`
        })
        
        if (options.safeMode) {
          upQueries.push(`-- 安全模式：请手动确认删除列 ${newTable.name}.${column.name}`)
          upQueries.push(`-- ALTER TABLE ${this.quoteIdentifier(newTable.name, dialect)} DROP COLUMN ${this.quoteIdentifier(column.name, dialect)};`)
        } else {
          upQueries.push(`ALTER TABLE ${this.quoteIdentifier(newTable.name, dialect)} DROP COLUMN ${this.quoteIdentifier(column.name, dialect)};`)
        }
      }

      // 处理新增的列
      for (const column of columnChanges.added) {
        operations.push({
          type: 'ADD_COLUMN',
          table: newTable.name,
          column: column.name,
          newValue: column,
          description: `添加列 ${newTable.name}.${column.name}`
        })
        
        const columnDef = this.generateColumnDefinition(column, dialect)
        upQueries.push(`ALTER TABLE ${this.quoteIdentifier(newTable.name, dialect)} ADD COLUMN ${columnDef};`)
      }

      // 处理修改的列
      for (const { oldColumn, newColumn } of columnChanges.modified) {
        operations.push({
          type: 'MODIFY_COLUMN',
          table: newTable.name,
          column: newColumn.name,
          oldValue: oldColumn,
          newValue: newColumn,
          description: `修改列 ${newTable.name}.${newColumn.name}`
        })
        
        const columnDef = this.generateColumnDefinition(newColumn, dialect)
        const modifySQL = this.generateModifyColumnSQL(newTable.name, newColumn.name, columnDef, dialect)
        upQueries.push(modifySQL)
      }
    }

    const migration: MigrationScript = {
      version: this.generateVersionNumber(oldModel.version, newModel.version),
      dialect,
      operations,
      upQueries,
      downQueries,
      metadata: {
        createdAt: new Date(),
        description: `从 ${oldModel.name} v${oldModel.version} 迁移到 v${newModel.version}`,
        migrationId,
        dependencies: [],
        estimatedTime: this.estimateMigrationTime(operations),
        riskLevel: this.assessRiskLevel(operations),
        dataLoss: operations.some(op => op.type === 'DROP_TABLE' || op.type === 'DROP_COLUMN')
      }
    }

    logger.info('差异迁移脚本生成完成', {
      migrationId,
      operationsCount: operations.length,
      dataLoss: migration.metadata.dataLoss,
      riskLevel: migration.metadata.riskLevel
    })

    return migration
  }

  /**
   * 生成迁移计划
   */
  static generateMigrationPlan(
    migrations: MigrationScript[]
  ): MigrationPlan {
    const totalOperations = migrations.reduce((sum, m) => sum + m.operations.length, 0)
    const totalTime = migrations.reduce((sum, m) => sum + m.metadata.estimatedTime, 0)
    const dataLossOperations = migrations.reduce((sum, m) => 
      sum + m.operations.filter(op => op.type === 'DROP_TABLE' || op.type === 'DROP_COLUMN').length, 0
    )

    const riskLevels = migrations.map(m => m.metadata.riskLevel)
    const hasHigh = riskLevels.includes('HIGH')
    const hasMedium = riskLevels.includes('MEDIUM')
    
    let riskAssessment = 'LOW'
    if (hasHigh) {
      riskAssessment = 'HIGH'
    } else if (hasMedium) {
      riskAssessment = 'MEDIUM'
    }

    return {
      migrations: migrations.sort((a, b) => a.metadata.createdAt.getTime() - b.metadata.createdAt.getTime()),
      summary: {
        totalMigrations: migrations.length,
        totalOperations,
        estimatedTime: totalTime,
        riskAssessment,
        dataLossOperations
      }
    }
  }

  /**
   * 生成回滚脚本
   */
  static generateRollbackScript(
    migration: MigrationScript,
    targetVersion?: string
  ): string {
    const rollbackQueries: string[] = []
    
    rollbackQueries.push('-- 回滚脚本')
    rollbackQueries.push(`-- 回滚迁移: ${migration.metadata.migrationId}`)
    rollbackQueries.push(`-- 目标版本: ${targetVersion || '上一版本'}`)
    rollbackQueries.push(`-- 生成时间: ${new Date().toLocaleString()}`)
    rollbackQueries.push('')
    
    rollbackQueries.push('BEGIN TRANSACTION;')
    rollbackQueries.push('')
    
    rollbackQueries.push('-- 执行回滚操作')
    for (const query of migration.downQueries) {
      rollbackQueries.push(query)
    }
    
    rollbackQueries.push('')
    rollbackQueries.push('-- 更新版本信息')
    rollbackQueries.push(`-- UPDATE schema_migrations SET version = '${targetVersion || 'previous'}' WHERE migration_id = '${migration.metadata.migrationId}';`)
    rollbackQueries.push('')
    rollbackQueries.push('COMMIT;')
    
    return rollbackQueries.join('\n')
  }

  // 私有辅助方法
  private static analyzeTableChanges(oldModel: ParsedModel, newModel: ParsedModel) {
    const oldTables = new Map(oldModel.tables.map(t => [t.name, t]))
    const newTables = new Map(newModel.tables.map(t => [t.name, t]))
    
    const added: ParsedTable[] = []
    const dropped: ParsedTable[] = []
    const modified: Array<{ oldTable: ParsedTable, newTable: ParsedTable }> = []
    
    // 找出新增的表
    for (const [name, table] of newTables) {
      if (!oldTables.has(name)) {
        added.push(table)
      }
    }
    
    // 找出删除的表
    for (const [name, table] of oldTables) {
      if (!newTables.has(name)) {
        dropped.push(table)
      }
    }
    
    // 找出修改的表
    for (const [name, newTable] of newTables) {
      const oldTable = oldTables.get(name)
      if (oldTable && this.hasTableChanged(oldTable, newTable)) {
        modified.push({ oldTable, newTable })
      }
    }
    
    return { added, dropped, modified }
  }

  private static analyzeColumnChanges(oldTable: ParsedTable, newTable: ParsedTable) {
    const oldColumns = new Map(oldTable.fields.map(f => [f.name, f]))
    const newColumns = new Map(newTable.fields.map(f => [f.name, f]))
    
    const added: ParsedField[] = []
    const dropped: ParsedField[] = []
    const modified: Array<{ oldColumn: ParsedField, newColumn: ParsedField }> = []
    
    // 找出新增的列
    for (const [name, column] of newColumns) {
      if (!oldColumns.has(name)) {
        added.push(column)
      }
    }
    
    // 找出删除的列
    for (const [name, column] of oldColumns) {
      if (!newColumns.has(name)) {
        dropped.push(column)
      }
    }
    
    // 找出修改的列
    for (const [name, newColumn] of newColumns) {
      const oldColumn = oldColumns.get(name)
      if (oldColumn && this.hasColumnChanged(oldColumn, newColumn)) {
        modified.push({ oldColumn, newColumn })
      }
    }
    
    return { added, dropped, modified }
  }

  private static hasTableChanged(oldTable: ParsedTable, newTable: ParsedTable): boolean {
    if (oldTable.fields.length !== newTable.fields.length) {
      return true
    }
    
    for (let i = 0; i < oldTable.fields.length; i++) {
      if (this.hasColumnChanged(oldTable.fields[i], newTable.fields[i])) {
        return true
      }
    }
    
    return false
  }

  private static hasColumnChanged(oldColumn: ParsedField, newColumn: ParsedField): boolean {
    return (
      oldColumn.type !== newColumn.type ||
      oldColumn.nullable !== newColumn.nullable ||
      oldColumn.isPrimaryKey !== newColumn.isPrimaryKey ||
      oldColumn.isAutoIncrement !== newColumn.isAutoIncrement ||
      oldColumn.defaultValue !== newColumn.defaultValue ||
      oldColumn.length !== newColumn.length ||
      oldColumn.precision !== newColumn.precision ||
      oldColumn.scale !== newColumn.scale
    )
  }

  private static generateColumnDefinition(column: ParsedField, dialect: SQLDialect): string {
    const parts: string[] = []
    
    parts.push(this.quoteIdentifier(column.name, dialect))
    parts.push(column.type)
    
    if (!column.nullable) {
      parts.push('NOT NULL')
    }
    
    if (column.defaultValue !== undefined && column.defaultValue !== null) {
      parts.push(`DEFAULT ${column.defaultValue}`)
    }
    
    return parts.join(' ')
  }

  private static generateModifyColumnSQL(tableName: string, columnName: string, columnDef: string, dialect: SQLDialect): string {
    switch (dialect) {
      case SQLDialect.MYSQL:
        return `ALTER TABLE ${this.quoteIdentifier(tableName, dialect)} MODIFY ${columnDef};`
      case SQLDialect.POSTGRESQL:
        // PostgreSQL需要分别修改类型、NULL约束等
        return `ALTER TABLE ${this.quoteIdentifier(tableName, dialect)} ALTER COLUMN ${this.quoteIdentifier(columnName, dialect)} TYPE ${columnDef};`
      case SQLDialect.SQLITE:
        // SQLite不支持直接修改列，需要重建表
        return `-- SQLite不支持ALTER COLUMN，请使用重建表的方式修改列 ${columnName}`
      case SQLDialect.SQL_SERVER:
        return `ALTER TABLE ${this.quoteIdentifier(tableName, dialect)} ALTER COLUMN ${columnDef};`
      case SQLDialect.ORACLE:
        return `ALTER TABLE ${this.quoteIdentifier(tableName, dialect)} MODIFY (${columnDef});`
      default:
        return `ALTER TABLE ${this.quoteIdentifier(tableName, dialect)} MODIFY ${columnDef};`
    }
  }

  private static estimateMigrationTime(operations: MigrationOperation[]): number {
    // 基于操作类型估算时间（秒）
    const timeEstimates = {
      'CREATE_TABLE': 10,
      'DROP_TABLE': 5,
      'ALTER_TABLE': 15,
      'ADD_COLUMN': 8,
      'DROP_COLUMN': 6,
      'MODIFY_COLUMN': 12,
      'ADD_INDEX': 20,
      'DROP_INDEX': 5,
      'ADD_CONSTRAINT': 15,
      'DROP_CONSTRAINT': 8
    }
    
    return operations.reduce((total, op) => total + (timeEstimates[op.type] || 10), 0)
  }

  private static assessRiskLevel(operations: MigrationOperation[]): 'LOW' | 'MEDIUM' | 'HIGH' {
    const riskFactors = {
      'DROP_TABLE': 5,
      'DROP_COLUMN': 4,
      'MODIFY_COLUMN': 3,
      'DROP_CONSTRAINT': 2,
      'DROP_INDEX': 1
    }
    
    const totalRisk = operations.reduce((total, op) => total + (riskFactors[op.type] || 0), 0)
    
    if (totalRisk >= 10) return 'HIGH'
    if (totalRisk >= 5) return 'MEDIUM'
    return 'LOW'
  }

  private static generateVersionNumber(oldVersion?: string, newVersion?: string): string {
    if (newVersion) return newVersion
    if (oldVersion) {
      const parts = oldVersion.split('.').map(Number)
      parts[2] = (parts[2] || 0) + 1
      return parts.join('.')
    }
    return '1.0.1'
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
}