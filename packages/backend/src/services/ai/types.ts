// AI服务相关类型定义

export enum DocumentType {
  MARKDOWN = 'MARKDOWN',
  SQL = 'SQL',
  EXCEL = 'EXCEL',
  WORD = 'WORD',
  PDF = 'PDF',
  JSON = 'JSON',
  CSV = 'CSV'
}

export enum SQLDialect {
  MYSQL = 'MYSQL',
  POSTGRESQL = 'POSTGRESQL',
  SQLITE = 'SQLITE',
  SQL_SERVER = 'SQL_SERVER',
  ORACLE = 'ORACLE'
}

export interface ParsedField {
  name: string
  type: string
  length?: number
  precision?: number
  scale?: number
  nullable: boolean
  defaultValue?: string
  comment?: string
  isPrimaryKey: boolean
  isAutoIncrement: boolean
  isUnique?: boolean
  isIndex?: boolean
  isForeignKey?: boolean
  isUnsigned?: boolean
  isZerofill?: boolean
  enumValues?: string[]
  referencedTable?: string
  referencedField?: string
}

export interface ParsedIndex {
  name: string
  type: 'PRIMARY' | 'UNIQUE' | 'INDEX' | 'FULLTEXT'
  fields: string[]
  isUnique: boolean
  comment?: string
}

export interface ParsedRelationship {
  fromTable: string
  toTable: string
  fromField: string
  toField: string
  relationshipType: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_ONE' | 'MANY_TO_MANY'
  name?: string
  description?: string
  onUpdate?: 'CASCADE' | 'SET_NULL' | 'RESTRICT' | 'NO_ACTION'
  onDelete?: 'CASCADE' | 'SET_NULL' | 'RESTRICT' | 'NO_ACTION'
}

export interface ParsedTable {
  name: string
  displayName?: string
  comment?: string
  fields: ParsedField[]
  indexes?: ParsedIndex[]
  relationships?: ParsedRelationship[]
  category?: string
  engine?: string
  charset?: string
  collation?: string
}

export interface ParsedModel {
  name: string
  description?: string
  version?: string
  tables: ParsedTable[]
  relationships?: ParsedRelationship[]
  metadata?: {
    sourceType?: DocumentType
    parsedAt?: Date
    modelVersion?: string
    confidence?: number
    warnings?: string[]
  }
}

export interface OptimizationSuggestion {
  type: 'INDEX' | 'CONSTRAINT' | 'PERFORMANCE' | 'SECURITY' | 'BEST_PRACTICE'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  target: {
    table?: string
    field?: string
    index?: string
    relationship?: string
  }
  title: string
  description: string
  recommendation: string
  example?: string
  impact?: string
  effort?: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface IndexSuggestion {
  table: string
  fields: string[]
  type: 'INDEX' | 'UNIQUE' | 'COMPOSITE'
  reason: string
  performance_impact: number // 1-10 scale
  storage_cost: number // 1-10 scale
  maintenance_cost: number // 1-10 scale
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface GeneratedSQL {
  dialect: SQLDialect
  statements: {
    type: 'CREATE_TABLE' | 'CREATE_INDEX' | 'ALTER_TABLE' | 'CREATE_CONSTRAINT'
    table: string
    sql: string
    dependencies?: string[]
  }[]
  metadata: {
    generatedAt: Date
    totalStatements: number
    estimatedSize?: string
    warnings?: string[]
  }
}

export interface ParseResult {
  success: boolean
  data?: ParsedModel
  error?: string
  warnings?: string[]
  metadata?: {
    provider: string
    modelVersion?: string
    timestamp: Date
    tokensUsed?: number
    processingTime?: number
    parseMethod?: 'ai' | 'local' | 'hybrid'
  }
}

export interface ValidationResult {
  isValid: boolean
  score: number // 0-100
  issues: any[]
  suggestions: string[]
  summary: {
    errorCount: number
    warningCount: number
    infoCount: number
  }
}

export interface GenerateResult {
  success: boolean
  data?: GeneratedSQL
  error?: string
  warnings?: string[]
  metadata?: {
    provider: string
    modelVersion?: string
    timestamp: Date
    tokensUsed?: number
    processingTime?: number
  }
}

export interface OptimizeResult {
  success: boolean
  data?: OptimizationSuggestion[]
  error?: string
  metadata?: {
    provider: string
    timestamp: Date
    analysisType: string[]
  }
}

// AI服务适配器接口
export interface AIServiceAdapter {
  // 基础信息
  getProviderName(): string
  getModelVersion(): string
  isAvailable(): Promise<boolean>
  
  // 文档解析
  parseDocument(content: string, type: DocumentType, options?: ParseOptions): Promise<ParseResult>
  
  // SQL生成
  generateSQL(model: ParsedModel, dialect: SQLDialect, options?: GenerateOptions): Promise<GenerateResult>
  
  // 模式优化
  optimizeSchema(tables: ParsedTable[], options?: OptimizeOptions): Promise<OptimizeResult>
  
  // 索引建议
  suggestIndexes(table: ParsedTable, queryPatterns?: string[]): Promise<IndexSuggestion[]>
  
  // 健康检查
  healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy', details?: any }>
}

// 配置接口
export interface AIServiceConfig {
  provider: string
  enabled: boolean
  apiKey?: string
  apiUrl?: string
  model?: string
  timeout?: number
  maxRetries?: number
  temperature?: number
  maxTokens?: number
  customHeaders?: Record<string, string>
  rateLimits?: {
    requestsPerMinute?: number
    tokensPerDay?: number
  }
}

// 选项接口
export interface ParseOptions {
  language?: string
  strictMode?: boolean
  includeComments?: boolean
  inferRelationships?: boolean
  detectEnums?: boolean
  customPrompts?: Record<string, string>
  confidenceThreshold?: number
  modelName?: string
  forceAIParsing?: boolean  // 强制使用AI解析，不使用本地解析器
  preserveComments?: boolean  // 保留注释信息
  maxTables?: number  // 最大表数量限制
  includeExamples?: boolean  // 在提示词中包含示例
}

export interface GenerateOptions {
  includeComments?: boolean
  includeConstraints?: boolean
  includeIndexes?: boolean
  formatStyle?: 'compact' | 'readable' | 'verbose'
  tablePrefix?: string
  customTemplates?: Record<string, string>
}

export interface OptimizeOptions {
  analysisDepth?: 'basic' | 'standard' | 'comprehensive'
  focusAreas?: ('performance' | 'security' | 'maintainability' | 'scalability')[]
  includeExamples?: boolean
  targetEnvironment?: 'development' | 'staging' | 'production'
}

// 提示词模板
export const PROMPT_TEMPLATES = {
  DOCUMENT_PARSE: {
    MARKDOWN: `
分析以下Markdown数据库设计文档，提取表结构信息。

要求：
1. 识别所有数据表及其字段
2. 确定字段类型、约束和关系
3. 提取注释和描述信息
4. 推断表之间的关联关系
5. 输出标准化的JSON格式

文档内容：
{content}

请返回JSON格式的结果，包含tables数组和relationships数组。
    `,
    
    SQL: `
解析以下SQL建表语句，转换为标准化数据模型结构。

要求：
1. 解析CREATE TABLE语句
2. 提取字段定义、约束和索引
3. 识别外键关系
4. 保留注释信息
5. 标准化字段类型

SQL内容：
{content}

请返回JSON格式的数据模型定义。
    `,
    
    EXCEL: `
分析Excel数据字典，提取数据库表结构定义。

表格说明：
- 通常包含表名、字段名、字段类型、是否必填、注释等列
- 可能有多个工作表对应不同的表
- 需要智能识别列标题和数据行

内容：
{content}

请解析并返回标准化的数据模型JSON。
    `
  },
  
  SQL_GENERATION: {
    MYSQL: `
基于以下数据模型生成MySQL建表语句。

要求：
1. 使用MySQL语法和数据类型
2. 包含适当的约束和索引
3. 设置合理的字符集和引擎
4. 添加注释说明
5. 考虑性能优化

数据模型：
{model}

请生成完整的CREATE TABLE语句。
    `,
    
    POSTGRESQL: `
生成PostgreSQL兼容的DDL语句。

要求：
1. 使用PostgreSQL数据类型
2. 创建适当的序列和索引
3. 设置外键约束
4. 添加表和字段注释
5. 考虑PostgreSQL特性

数据模型：
{model}

请生成PostgreSQL DDL脚本。
    `,
    
    SQLITE: `
生成SQLite数据库建表脚本。

要求：
1. 使用SQLite支持的数据类型
2. 简化约束定义
3. 考虑SQLite限制
4. 保持兼容性

数据模型：
{model}

请生成SQLite建表语句。
    `
  },
  
  OPTIMIZATION: {
    INDEX_SUGGESTION: `
分析表结构，建议最优索引策略。

考虑因素：
1. 查询模式和频率
2. 数据量和增长趋势
3. 读写比例
4. 存储成本
5. 维护开销

表定义：
{table}

查询模式：
{queries}

请提供索引建议和优化方案。
    `,
    
    PERFORMANCE_REVIEW: `
评估数据库设计性能问题。

分析维度：
1. 表结构设计
2. 字段类型选择
3. 索引配置
4. 约束设置
5. 关系设计

数据模型：
{model}

请提供性能优化建议。
    `
  }
} as const