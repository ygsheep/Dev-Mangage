import React, { useState, useMemo, useEffect } from 'react'
import {
  Database,
  Download,
  Copy,
  Settings,
  Play,
  FileText,
  Code,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Layers,
  GitBranch,
  Loader2,
  Brain,
  Wrench,
  History
} from 'lucide-react'
import { DatabaseTable, TableRelationship, DatabaseIndex } from '@shared/types'
import { 
  generateSQL as generateSQLAPI,
  generateMigrationScript,
  getCodeTemplates,
  renderCodeTemplate
} from '../../../../utils/api'
import { toast } from 'react-hot-toast'
import SQLPreview from '../../../common/SQLPreview'

interface SQLGeneratorProps {
  projectId: string
  tables: DatabaseTable[]
  relationships: TableRelationship[]
  indexes?: DatabaseIndex[]
}

type SQLDialect = 'mysql' | 'postgresql' | 'sqlite' | 'mssql'
type GenerationType = 'create' | 'migration' | 'drop' | 'seed'

const SQLGenerator: React.FC<SQLGeneratorProps> = ({
  projectId,
  tables,
  relationships,
  indexes = []
}) => {
  const [selectedDialect, setSelectedDialect] = useState<SQLDialect>('mysql')
  const [selectedType, setSelectedType] = useState<GenerationType>('create')
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set())
  const [includeIndexes, setIncludeIndexes] = useState(true)
  const [includeConstraints, setIncludeConstraints] = useState(true)
  const [includeComments, setIncludeComments] = useState(true)
  const [includeDropStatements, setIncludeDropStatements] = useState(false)
  const [generateIfNotExists, setGenerateIfNotExists] = useState(true)
  const [showPreview, setShowPreview] = useState(true)
  const [generatedSQL, setGeneratedSQL] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [useAIGeneration, setUseAIGeneration] = useState(false)
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [migrationOptions, setMigrationOptions] = useState({
    generateDownMigrations: true,
    includeData: false,
    safeMode: true,
    chunkLargeOperations: true
  })
  const [sqlMetadata, setSqlMetadata] = useState<any>(null)

  // 数据库方言配置
  const dialectConfigs = {
    mysql: {
      name: 'MySQL',
      version: '8.0+',
      features: ['ENGINE', 'CHARSET', 'AUTO_INCREMENT', 'FULLTEXT'],
      typeMapping: {
        VARCHAR: 'VARCHAR',
        TEXT: 'TEXT',
        LONGTEXT: 'LONGTEXT',
        INT: 'INT',
        BIGINT: 'BIGINT',
        DECIMAL: 'DECIMAL',
        FLOAT: 'FLOAT',
        DOUBLE: 'DOUBLE',
        BOOLEAN: 'BOOLEAN',
        TIMESTAMP: 'TIMESTAMP',
        DATETIME: 'DATETIME',
        DATE: 'DATE',
        TIME: 'TIME',
        JSON: 'JSON',
        ENUM: 'ENUM',
        BLOB: 'BLOB',
        LONGBLOB: 'LONGBLOB'
      }
    },
    postgresql: {
      name: 'PostgreSQL',
      version: '12+',
      features: ['SERIAL', 'UUID', 'ARRAY', 'JSONB'],
      typeMapping: {
        VARCHAR: 'VARCHAR',
        TEXT: 'TEXT',
        LONGTEXT: 'TEXT',
        INT: 'INTEGER',
        BIGINT: 'BIGINT',
        DECIMAL: 'DECIMAL',
        FLOAT: 'REAL',
        DOUBLE: 'DOUBLE PRECISION',
        BOOLEAN: 'BOOLEAN',
        TIMESTAMP: 'TIMESTAMP',
        DATETIME: 'TIMESTAMP',
        DATE: 'DATE',
        TIME: 'TIME',
        JSON: 'JSONB',
        ENUM: 'VARCHAR', // PostgreSQL uses custom types for enums
        BLOB: 'BYTEA',
        LONGBLOB: 'BYTEA'
      }
    },
    sqlite: {
      name: 'SQLite',
      version: '3.x',
      features: ['AUTOINCREMENT', 'WITHOUT ROWID'],
      typeMapping: {
        VARCHAR: 'TEXT',
        TEXT: 'TEXT',
        LONGTEXT: 'TEXT',
        INT: 'INTEGER',
        BIGINT: 'INTEGER',
        DECIMAL: 'REAL',
        FLOAT: 'REAL',
        DOUBLE: 'REAL',
        BOOLEAN: 'INTEGER',
        TIMESTAMP: 'TEXT',
        DATETIME: 'TEXT',
        DATE: 'TEXT',
        TIME: 'TEXT',
        JSON: 'TEXT',
        ENUM: 'TEXT',
        BLOB: 'BLOB',
        LONGBLOB: 'BLOB'
      }
    },
    mssql: {
      name: 'SQL Server',
      version: '2019+',
      features: ['IDENTITY', 'CLUSTERED', 'NVARCHAR'],
      typeMapping: {
        VARCHAR: 'VARCHAR',
        TEXT: 'NVARCHAR(MAX)',
        LONGTEXT: 'NVARCHAR(MAX)',
        INT: 'INT',
        BIGINT: 'BIGINT',
        DECIMAL: 'DECIMAL',
        FLOAT: 'FLOAT',
        DOUBLE: 'FLOAT',
        BOOLEAN: 'BIT',
        TIMESTAMP: 'DATETIME2',
        DATETIME: 'DATETIME2',
        DATE: 'DATE',
        TIME: 'TIME',
        JSON: 'NVARCHAR(MAX)',
        ENUM: 'NVARCHAR(50)',
        BLOB: 'VARBINARY(MAX)',
        LONGBLOB: 'VARBINARY(MAX)'
      }
    }
  }

  // 加载代码模板
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await getCodeTemplates({
          dialect: selectedDialect.toUpperCase()
        })
        setAvailableTemplates(response.data || [])
      } catch (error) {
        console.error('加载代码模板失败:', error)
      }
    }

    loadTemplates()
  }, [selectedDialect])

  // AI增强的SQL生成函数
  const generateSQLWithAI = async () => {
    setIsGenerating(true)
    try {
      // 构建数据模型
      const selectedTableObjects = tables.filter(t => 
        selectedTables.size === 0 || selectedTables.has(t.id)
      )

      const model = {
        name: `${projectId}_model`,
        version: '1.0.0',
        tables: selectedTableObjects.map(table => ({
          name: table.name,
          displayName: table.displayName,
          comment: table.comment,
          fields: table.fields?.map(field => ({
            name: field.name,
            type: field.type,
            length: field.length,
            precision: field.precision,
            scale: field.scale,
            nullable: field.nullable,
            defaultValue: field.defaultValue,
            comment: field.comment,
            isPrimaryKey: field.isPrimaryKey,
            isAutoIncrement: field.isAutoIncrement,
            isUnique: field.isUnique,
            isIndex: field.isIndex,
            referencedTable: field.referencedTable,
            referencedField: field.referencedField
          })) || []
        })),
        relationships: relationships.map(rel => ({
          fromTable: tables.find(t => t.id === rel.fromTableId)?.name,
          toTable: tables.find(t => t.id === rel.toTableId)?.name,
          fromField: tables.find(t => t.id === rel.fromTableId)?.fields?.find(f => f.id === rel.fromFieldId)?.name,
          toField: tables.find(t => t.id === rel.toTableId)?.fields?.find(f => f.id === rel.toFieldId)?.name,
          type: rel.type,
          onUpdate: rel.onUpdate,
          onDelete: rel.onDelete
        }))
      }

      let sqlResult
      
      if (selectedType === 'migration') {
        // 生成迁移脚本
        sqlResult = await generateMigrationScript({
          model,
          dialect: selectedDialect.toUpperCase(),
          options: {
            ...migrationOptions,
            includeComments,
            includeIndexes,
            includeConstraints
          }
        })
      } else if (selectedTemplate) {
        // 使用模板生成
        sqlResult = await renderCodeTemplate(selectedTemplate, {
          model,
          dialect: selectedDialect.toUpperCase(),
          options: {
            includeComments,
            includeIndexes,
            includeConstraints,
            includeDropStatements,
            generateIfNotExists
          }
        })
      } else {
        // 常规SQL生成
        sqlResult = await generateSQLAPI({
          model,
          dialect: selectedDialect.toUpperCase(),
          includeComments,
          includeIndexes,
          includeConstraints,
          includeForeignKeys: includeConstraints,
          useIFNotExists: generateIfNotExists,
          formatStyle: 'pretty'
        })
      }

      if (sqlResult.success && sqlResult.data) {
        if (selectedTemplate) {
          setGeneratedSQL(sqlResult.data.output || sqlResult.data)
        } else if (selectedType === 'migration') {
          const migration = sqlResult.data
          let sql = `-- Migration Script\n`
          sql += `-- Version: ${migration.version}\n`
          sql += `-- Description: ${migration.metadata.description}\n`
          sql += `-- Generated at: ${new Date().toISOString()}\n\n`
          
          if (migration.upQueries && migration.upQueries.length > 0) {
            sql += `-- UP Migration\n`
            sql += migration.upQueries.join('\n\n') + '\n\n'
          }
          
          if (migration.downQueries && migration.downQueries.length > 0) {
            sql += `-- DOWN Migration (Rollback)\n`
            sql += migration.downQueries.join('\n\n')
          }
          
          setGeneratedSQL(sql)
        } else {
          const statements = sqlResult.data.data?.statements || sqlResult.data.statements || []
          const sql = statements.map(stmt => stmt.sql || stmt).join('\n\n')
          setGeneratedSQL(sql)
          setSqlMetadata(sqlResult.data.metadata)
        }
        
        toast.success('SQL代码生成成功')
      } else {
        throw new Error(sqlResult.error || '生成失败')
      }
    } catch (error: any) {
      console.error('AI SQL生成失败:', error)
      toast.error('SQL生成失败: ' + (error.message || '未知错误'))
      
      // 回退到本地生成
      const localSQL = generateSQL
      setGeneratedSQL(localSQL)
    } finally {
      setIsGenerating(false)
    }
  }

  // 工具函数定义

  // Drop语句生成
  const generateDropStatements = (tables: DatabaseTable[], config: any) => {
    let sql = '-- Drop Tables\n'
    
    // 按依赖关系排序（有外键的表先删除）
    const sortedTables = [...tables].reverse()
    
    sortedTables.forEach(table => {
      if (selectedDialect === 'mysql') {
        sql += `DROP TABLE IF EXISTS \`${table.name}\`;\n`
      } else if (selectedDialect === 'postgresql') {
        sql += `DROP TABLE IF EXISTS "${table.name}" CASCADE;\n`
      } else if (selectedDialect === 'sqlite') {
        sql += `DROP TABLE IF EXISTS "${table.name}";\n`
      } else if (selectedDialect === 'mssql') {
        sql += `IF OBJECT_ID('${table.name}', 'U') IS NOT NULL DROP TABLE [${table.name}];\n`
      }
    })
    
    return sql + '\n'
  }

  const generateCreateStatements = (tables: DatabaseTable[], config: any) => {
    let sql = '-- Create Tables\n'
    
    tables.forEach(table => {
      sql += generateTableSQL(table, config) + '\n'
    })
    
    return sql
  }

  const generateTableSQL = (table: DatabaseTable, config: any) => {
    const tableName = selectedDialect === 'mysql' ? `\`${table.name}\`` : `"${table.name}"`
    const ifNotExists = generateIfNotExists && selectedDialect !== 'mssql' ? 'IF NOT EXISTS ' : ''
    
    let sql = `CREATE TABLE ${ifNotExists}${tableName} (\n`
    
    // 字段定义
    const fieldDefinitions: string[] = []
    
    table.fields?.forEach(field => {
      let fieldDef = `  ${selectedDialect === 'mysql' ? `\`${field.name}\`` : `"${field.name}"`}`
      
      // 数据类型
      const mappedType = config.typeMapping[field.type] || field.type
      fieldDef += ` ${mappedType}`
      
      // 长度/精度
      if (field.length && ['VARCHAR', 'CHAR', 'DECIMAL'].some(t => mappedType.includes(t))) {
        fieldDef += `(${field.length})`
      }
      
      // NULL约束
      if (!field.nullable) {
        fieldDef += ' NOT NULL'
      }
      
      // 自增
      if (field.isAutoIncrement) {
        if (selectedDialect === 'mysql') {
          fieldDef += ' AUTO_INCREMENT'
        } else if (selectedDialect === 'postgresql') {
          fieldDef = fieldDef.replace(mappedType, 'SERIAL')
        } else if (selectedDialect === 'sqlite') {
          fieldDef += ' AUTOINCREMENT'
        } else if (selectedDialect === 'mssql') {
          fieldDef += ' IDENTITY(1,1)'
        }
      }
      
      // 默认值
      if (field.defaultValue) {
        if (field.defaultValue === 'CURRENT_TIMESTAMP') {
          if (selectedDialect === 'mysql') {
            fieldDef += ' DEFAULT CURRENT_TIMESTAMP'
          } else if (selectedDialect === 'postgresql') {
            fieldDef += ' DEFAULT CURRENT_TIMESTAMP'
          } else if (selectedDialect === 'sqlite') {
            fieldDef += ' DEFAULT CURRENT_TIMESTAMP'
          } else if (selectedDialect === 'mssql') {
            fieldDef += ' DEFAULT GETDATE()'
          }
        } else {
          fieldDef += ` DEFAULT ${field.defaultValue}`
        }
      }
      
      // 注释
      if (field.comment && includeComments) {
        if (selectedDialect === 'mysql') {
          fieldDef += ` COMMENT '${field.comment}'`
        }
        // PostgreSQL和SQLite的注释需要单独的COMMENT语句
      }
      
      fieldDefinitions.push(fieldDef)
    })
    
    // 主键约束
    const primaryKeys = table.fields?.filter(f => f.isPrimaryKey).map(f => f.name) || []
    if (primaryKeys.length > 0) {
      const pkFields = primaryKeys.map(name => 
        selectedDialect === 'mysql' ? `\`${name}\`` : `"${name}"`
      ).join(', ')
      fieldDefinitions.push(`  PRIMARY KEY (${pkFields})`)
    }
    
    sql += fieldDefinitions.join(',\n')
    sql += '\n)'
    
    // 表选项
    if (selectedDialect === 'mysql') {
      sql += ` ENGINE=${table.engine || 'InnoDB'}`
      sql += ` DEFAULT CHARSET=${table.charset || 'utf8mb4'}`
      if (table.collation) {
        sql += ` COLLATE=${table.collation}`
      }
      if (table.comment && includeComments) {
        sql += ` COMMENT='${table.comment}'`
      }
    }
    
    sql += ';\n'
    
    // PostgreSQL表注释
    if (selectedDialect === 'postgresql' && table.comment && includeComments) {
      sql += `COMMENT ON TABLE "${table.name}" IS '${table.comment}';\n`
      
      // 字段注释
      table.fields?.forEach(field => {
        if (field.comment) {
          sql += `COMMENT ON COLUMN "${table.name}"."${field.name}" IS '${field.comment}';\n`
        }
      })
    }
    
    return sql
  }

  const generateIndexStatements = (tables: DatabaseTable[], config: any) => {
    let sql = '-- Create Indexes\n'
    
    tables.forEach(table => {
      table.indexes?.forEach(index => {
        if (index.type === 'PRIMARY') return // 主键索引已经在表创建时生成
        
        const tableName = selectedDialect === 'mysql' ? `\`${table.name}\`` : `"${table.name}"`
        const indexName = selectedDialect === 'mysql' ? `\`${index.name}\`` : `"${index.name}"`
        
        // 处理索引字段，支持新的数据结构
        const indexFields = index.fields || []
        const fieldNames = indexFields.map((field: any) => 
          typeof field === 'string' ? field : field.fieldName
        )
        const fields = fieldNames.map(fieldName => 
          selectedDialect === 'mysql' ? `\`${fieldName}\`` : `"${fieldName}"`
        ).join(', ')
        
        let indexSQL = 'CREATE '
        
        if (index.isUnique) {
          indexSQL += 'UNIQUE '
        }
        
        indexSQL += `INDEX ${indexName} ON ${tableName} (${fields});\n`
        
        sql += indexSQL
      })
    })
    
    return sql + '\n'
  }

  const generateConstraintStatements = (tables: DatabaseTable[], relationships: TableRelationship[], config: any) => {
    let sql = '-- Add Foreign Key Constraints\n'
    
    relationships.forEach(rel => {
      const fromTable = tables.find(t => t.id === rel.fromTableId)
      const toTable = tables.find(t => t.id === rel.toTableId)
      const fromField = fromTable?.fields?.find(f => f.id === rel.fromFieldId)
      const toField = toTable?.fields?.find(f => f.id === rel.toFieldId)
      
      if (fromTable && toTable && fromField && toField) {
        const constraintName = rel.name || `fk_${fromTable.name}_${toTable.name}`
        
        if (selectedDialect === 'mysql') {
          sql += `ALTER TABLE \`${fromTable.name}\` ADD CONSTRAINT \`${constraintName}\` `
          sql += `FOREIGN KEY (\`${fromField.name}\`) REFERENCES \`${toTable.name}\`(\`${toField.name}\`)`
        } else {
          sql += `ALTER TABLE "${fromTable.name}" ADD CONSTRAINT "${constraintName}" `
          sql += `FOREIGN KEY ("${fromField.name}") REFERENCES "${toTable.name}"("${toField.name}")`
        }
        
        if (rel.onUpdate !== 'RESTRICT') {
          sql += ` ON UPDATE ${rel.onUpdate}`
        }
        if (rel.onDelete !== 'RESTRICT') {
          sql += ` ON DELETE ${rel.onDelete}`
        }
        
        sql += ';\n'
      }
    })
    
    return sql + '\n'
  }

  const generateSeedData = (tables: DatabaseTable[], config: any) => {
    let sql = '-- Seed Data (Sample)\n'
    
    tables.forEach(table => {
      const tableName = selectedDialect === 'mysql' ? `\`${table.name}\`` : `"${table.name}"`
      sql += `-- INSERT INTO ${tableName} VALUES (...);\n`
    })
    
    return sql + '\n'
  }

  // 生成SQL语句
  const generateSQL = useMemo(() => {
    const config = dialectConfigs[selectedDialect]
    const selectedTableObjects = tables.filter(t => 
      selectedTables.size === 0 || selectedTables.has(t.id)
    )

    let sql = ''

    // 添加注释头
    sql += `-- ${config.name} ${config.version} DDL Script\n`
    sql += `-- Generated by DevAPI Manager\n`
    sql += `-- Project: ${projectId}\n`
    sql += `-- Generated at: ${new Date().toISOString()}\n`
    sql += `-- Tables: ${selectedTableObjects.length}\n\n`

    if (selectedType === 'drop' || includeDropStatements) {
      sql += generateDropStatements(selectedTableObjects, config)
    }

    if (selectedType === 'create' || selectedType === 'migration') {
      sql += generateCreateStatements(selectedTableObjects, config)
    }

    if (includeIndexes && selectedType !== 'drop') {
      sql += generateIndexStatements(selectedTableObjects, config)
    }

    if (includeConstraints && selectedType !== 'drop') {
      sql += generateConstraintStatements(selectedTableObjects, relationships, config)
    }

    if (selectedType === 'seed') {
      sql += generateSeedData(selectedTableObjects, config)
    }

    return sql

  }, [selectedDialect, selectedType, selectedTables, tables, relationships, includeIndexes, includeConstraints, includeComments, includeDropStatements, generateIfNotExists, projectId])

  const handleTableToggle = (tableId: string) => {
    const newSelected = new Set(selectedTables)
    if (newSelected.has(tableId)) {
      newSelected.delete(tableId)
    } else {
      newSelected.add(tableId)
    }
    setSelectedTables(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedTables.size === tables.length) {
      setSelectedTables(new Set())
    } else {
      setSelectedTables(new Set(tables.map(t => t.id)))
    }
  }

  const handleGenerate = async () => {
    if (useAIGeneration) {
      await generateSQLWithAI()
    } else {
      setIsGenerating(true)
      // 本地生成
      await new Promise(resolve => setTimeout(resolve, 500))
      setGeneratedSQL(generateSQL)
      setIsGenerating(false)
    }
  }

  const handleCopySQL = () => {
    navigator.clipboard.writeText(generatedSQL)
  }

  const handleDownloadSQL = () => {
    const blob = new Blob([generatedSQL], { type: 'text/sql' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${projectId}_${selectedDialect}_${selectedType}.sql`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* 配置面板 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-text-primary mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          SQL生成配置
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {/* 数据库方言 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              数据库类型
            </label>
            <select
              value={selectedDialect}
              onChange={(e) => setSelectedDialect(e.target.value as SQLDialect)}
              className="input w-full"
            >
              {Object.entries(dialectConfigs).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.name} {config.version}
                </option>
              ))}
            </select>
          </div>
          
          {/* 生成类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              生成类型
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as GenerationType)}
              className="input w-full"
            >
              <option value="create">CREATE TABLE</option>
              <option value="migration">数据库迁移</option>
              <option value="drop">DROP TABLE</option>
              <option value="seed">种子数据</option>
            </select>
          </div>

          {/* AI增强选项 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              生成方式
            </label>
            <div className="flex space-x-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="generationMode"
                  checked={!useAIGeneration}
                  onChange={() => setUseAIGeneration(false)}
                  className="rounded border-gray-300"
                />
                <span className="ml-1 text-sm">本地</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="generationMode"
                  checked={useAIGeneration}
                  onChange={() => setUseAIGeneration(true)}
                  className="rounded border-gray-300"
                />
                <Brain className="w-3 h-3 ml-1 mr-1 text-blue-500" />
                <span className="text-sm">AI增强</span>
              </label>
            </div>
          </div>
          
          {/* 表选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              表选择 ({selectedTables.size}/{tables.length})
            </label>
            <button
              onClick={handleSelectAll}
              className="w-full btn-outline text-sm"
            >
              {selectedTables.size === tables.length ? '取消全选' : '全选'}
            </button>
          </div>
          
          {/* 生成按钮 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              生成SQL
            </label>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full btn-primary flex items-center justify-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>生成中...</span>
                </>
              ) : (
                <>
                  {useAIGeneration ? <Brain className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>生成</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI增强选项 */}
        {useAIGeneration && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-blue-900 flex items-center">
                <Brain className="w-4 h-4 mr-2" />
                AI增强选项
              </h4>
              <button
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {showAdvancedOptions ? '隐藏高级选项' : '显示高级选项'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 代码模板选择 */}
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-2">
                  代码模板
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="input w-full"
                >
                  <option value="">使用默认生成</option>
                  {availableTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* 迁移选项（仅在迁移模式下显示） */}
              {selectedType === 'migration' && showAdvancedOptions && (
                <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={migrationOptions.generateDownMigrations}
                      onChange={(e) => setMigrationOptions(prev => ({ 
                        ...prev, 
                        generateDownMigrations: e.target.checked 
                      }))}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">生成回滚</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={migrationOptions.includeData}
                      onChange={(e) => setMigrationOptions(prev => ({ 
                        ...prev, 
                        includeData: e.target.checked 
                      }))}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">包含数据</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={migrationOptions.safeMode}
                      onChange={(e) => setMigrationOptions(prev => ({ 
                        ...prev, 
                        safeMode: e.target.checked 
                      }))}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">安全模式</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={migrationOptions.chunkLargeOperations}
                      onChange={(e) => setMigrationOptions(prev => ({ 
                        ...prev, 
                        chunkLargeOperations: e.target.checked 
                      }))}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">分块处理</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* 生成选项 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={includeIndexes}
              onChange={(e) => setIncludeIndexes(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm">包含索引</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={includeConstraints}
              onChange={(e) => setIncludeConstraints(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm">包含约束</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={includeComments}
              onChange={(e) => setIncludeComments(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm">包含注释</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={includeDropStatements}
              onChange={(e) => setIncludeDropStatements(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm">包含DROP</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={generateIfNotExists}
              onChange={(e) => setGenerateIfNotExists(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm">IF NOT EXISTS</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showPreview}
              onChange={(e) => setShowPreview(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm">显示预览</span>
          </label>
        </div>
      </div>

      {/* 表选择器 */}
      {tables.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-text-primary mb-4 flex items-center">
            <Layers className="w-5 h-5 mr-2" />
            选择表 ({selectedTables.size} / {tables.length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
            {tables.map(table => (
              <label
                key={table.id}
                className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedTables.has(table.id)
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedTables.has(table.id)}
                  onChange={() => handleTableToggle(table.id)}
                  className="rounded border-gray-300"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-text-primary text-sm truncate">
                      {table.displayName || table.name}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {table.fields?.length || 0} 字段, {table.indexes?.length || 0} 索引
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* SQL预览/结果 */}
      {showPreview && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-text-primary flex items-center">
              <Code className="w-5 h-5 mr-2" />
              SQL预览 - {dialectConfigs[selectedDialect].name}
            </h3>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="隐藏预览"
              >
                <EyeOff className="w-4 h-4" />
              </button>
              
              {generatedSQL && (
                <>
                  <button
                    onClick={handleCopySQL}
                    className="btn-outline flex items-center space-x-2"
                  >
                    <Copy className="w-4 h-4" />
                    <span>复制</span>
                  </button>
                  
                  <button
                    onClick={handleDownloadSQL}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>下载</span>
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div className="p-4">
            {generatedSQL ? (
              <div className="space-y-4">
                {/* SQL元数据显示 */}
                {sqlMetadata && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-blue-700 font-medium">生成时间：</span>
                        <span className="text-blue-900">{new Date(sqlMetadata.generatedAt).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">语句数量：</span>
                        <span className="text-blue-900">{sqlMetadata.totalStatements}</span>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">预估大小：</span>
                        <span className="text-blue-900">{sqlMetadata.estimatedSize}</span>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">警告数量：</span>
                        <span className={`font-medium ${sqlMetadata.warnings?.length > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {sqlMetadata.warnings?.length || 0}
                        </span>
                      </div>
                    </div>
                    
                    {sqlMetadata.warnings && sqlMetadata.warnings.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <h5 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          生成警告
                        </h5>
                        <div className="space-y-1">
                          {sqlMetadata.warnings.map((warning: string, index: number) => (
                            <p key={index} className="text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                              {warning}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <SQLPreview
                  sql={generatedSQL}
                  dialect={dialectConfigs[selectedDialect].name}
                  title="生成的SQL代码"
                  showLineNumbers={true}
                  maxHeight="400px"
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <Code className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-text-primary mb-2">
                  SQL代码预览
                </h3>
                <p className="text-text-secondary mb-6">
                  配置生成选项后点击"生成"按钮查看SQL代码
                </p>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || tables.length === 0}
                  className="btn-primary"
                >
                  生成SQL代码
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 特性支持信息 */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
        <h4 className="font-medium text-blue-900 mb-2 flex items-center">
          <CheckCircle className="w-4 h-4 mr-2" />
          {dialectConfigs[selectedDialect].name} 特性支持
        </h4>
        <div className="flex flex-wrap gap-2">
          {dialectConfigs[selectedDialect].features.map(feature => (
            <span
              key={feature}
              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SQLGenerator