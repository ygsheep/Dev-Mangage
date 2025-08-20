// AI服务相关类型定义

export enum DocumentType {
  MARKDOWN = 'MARKDOWN',
  SQL = 'SQL',
  EXCEL = 'EXCEL',
  WORD = 'WORD',
  PDF = 'PDF',
  JSON = 'JSON',
  CSV = 'CSV',
  // 专用文档类型
  API_DOCUMENTATION = 'API_DOCUMENTATION',
  DATA_MODEL = 'DATA_MODEL',
  FEATURE_MODULE = 'FEATURE_MODULE',
  BUSINESS_PROCESS = 'BUSINESS_PROCESS',
  TECHNICAL_SPEC = 'TECHNICAL_SPEC'
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
    // 通用文档类型
    MARKDOWN: `
你是一个专业的数据库设计分析师。请分析以下Markdown文档，提取数据库表结构信息。

**严格要求**：
1. 必须输出完整的JSON格式
2. 每个表必须包含fields数组
3. 每个字段必须包含name和type属性
4. 不能省略任何必需的数组或对象

**输出格式示例**：
{
  "tables": [
    {
      "name": "users",
      "displayName": "用户表",
      "comment": "存储用户信息",
      "fields": [
        {
          "name": "id",
          "type": "INT",
          "constraints": ["PRIMARY KEY", "AUTO_INCREMENT"],
          "comment": "主键ID"
        },
        {
          "name": "username",
          "type": "VARCHAR(50)",
          "constraints": ["NOT NULL", "UNIQUE"],
          "comment": "用户名"
        }
      ]
    }
  ],
  "relationships": [
    {
      "sourceTable": "orders",
      "targetTable": "users", 
      "type": "FOREIGN KEY",
      "foreignKey": "user_id"
    }
  ]
}

**分析要求**：
1. 识别所有数据表及其字段
2. 确定字段类型、约束和关系
3. 提取注释和描述信息
4. 推断表之间的关联关系
5. 为每个表生成完整的fields数组

**文档内容**：
{content}

请严格按照上述格式返回JSON结果，确保每个表都包含完整的fields数组：
    `,
    
    SQL: `
你是一个专业的SQL解析专家。请分析以下SQL建表语句，转换为标准化数据模型结构。

**严格要求**：
1. 必须输出完整的JSON格式  
2. 每个表必须包含fields数组
3. 每个字段必须包含name和type属性
4. 不能省略任何必需的数组或对象

**输出格式**：
{
  "tables": [
    {
      "name": "表名",
      "displayName": "表显示名称", 
      "comment": "表注释",
      "fields": [
        {
          "name": "字段名",
          "type": "字段类型",
          "constraints": ["约束列表"],
          "comment": "字段注释"
        }
      ]
    }
  ],
  "relationships": []
}

**分析要求**：
1. 解析CREATE TABLE语句
2. 提取字段定义、约束和索引
3. 识别外键关系
4. 保留注释信息
5. 标准化字段类型
6. 确保每个表都包含完整的fields数组

**SQL内容**：
{content}

请严格按照格式返回JSON数据模型定义，确保每个表都包含fields数组：
    `,
    
    EXCEL: `
你是一个专业的Excel数据字典分析师。请分析以下Excel数据字典，提取数据库表结构定义。

**严格要求**：
1. 必须输出完整的JSON格式
2. 每个表必须包含fields数组
3. 每个字段必须包含name和type属性
4. 不能省略任何必需的数组或对象

**输出格式**：
{
  "tables": [
    {
      "name": "表名",
      "displayName": "表显示名称",
      "comment": "表注释", 
      "fields": [
        {
          "name": "字段名",
          "type": "字段类型",
          "constraints": ["约束列表"],
          "comment": "字段注释"
        }
      ]
    }
  ],
  "relationships": []
}

**分析说明**：
- 通常包含表名、字段名、字段类型、是否必填、注释等列
- 可能有多个工作表对应不同的表
- 需要智能识别列标题和数据行
- 确保每个表都包含完整的fields数组

**内容**：
{content}

请严格按照格式解析并返回标准化的数据模型JSON，确保每个表都包含fields数组：
    `,
    
    // 专用文档类型提示词
    API_DOCUMENTATION: `
你是一个专业的API接口分析师。请分析以下API接口文档，提取API接口信息。

**严格要求**：
1. 必须输出完整的JSON格式
2. 每个API必须包含完整的信息
3. 支持多种API文档格式识别

**输出格式**：
{
  "apis": [
    {
      "name": "API名称",
      "method": "HTTP方法",
      "path": "接口路径",
      "description": "接口描述",
      "parameters": [
        {
          "name": "参数名",
          "type": "参数类型",
          "required": true/false,
          "description": "参数说明",
          "location": "query/body/header/path"
        }
      ],
      "responses": [
        {
          "statusCode": 200,
          "description": "响应描述",
          "schema": {}
        }
      ],
      "tags": ["标签1", "标签2"]
    }
  ],
  "baseUrl": "API基础地址",
  "version": "API版本"
}

**分析要求**：
1. 识别API接口定义（标题、HTTP方法、路径）
2. 提取参数信息（请求参数、路径参数、查询参数）
3. 分析响应格式和状态码
4. 提取接口描述和标签信息
5. 支持OpenAPI/Swagger、Markdown表格等格式

**文档内容**：
{content}

请分析并返回完整的API接口定义JSON：
    `,
    
    DATA_MODEL: `
你是一个专业的数据模型分析师。请分析以下数据模型文档，提取数据库表结构和关系信息。

**严格要求**：
1. 必须输出完整的JSON格式
2. 每个表必须包含fields数组
3. 分析表之间的关联关系

**输出格式**：
{
  "tables": [
    {
      "name": "表名",
      "displayName": "表显示名称",
      "comment": "表注释",
      "category": "表分类",
      "fields": [
        {
          "name": "字段名",
          "type": "字段类型", 
          "length": 长度,
          "nullable": true/false,
          "isPrimaryKey": true/false,
          "isAutoIncrement": true/false,
          "comment": "字段注释",
          "constraints": ["约束列表"]
        }
      ],
      "indexes": [
        {
          "name": "索引名",
          "type": "索引类型",
          "fields": ["字段列表"],
          "isUnique": true/false
        }
      ]
    }
  ],
  "relationships": [
    {
      "sourceTable": "源表",
      "targetTable": "目标表",
      "type": "关系类型",
      "foreignKey": "外键字段",
      "description": "关系描述"
    }
  ],
  "metadata": {
    "modelName": "模型名称",
    "version": "版本号",
    "description": "模型描述"
  }
}

**分析要求**：
1. 识别所有数据表及其字段定义
2. 分析字段类型、约束和索引
3. 推断表之间的关联关系
4. 提取业务实体和领域概念
5. 支持ER图、UML、SQL DDL等格式

**文档内容**：
{content}

请分析并返回完整的数据模型定义JSON：
    `,
    
    FEATURE_MODULE: `
你是一个专业的功能模块分析师。请分析以下功能模块文档，提取功能模块结构和业务流程信息。

**严格要求**：
1. 必须输出完整的JSON格式
2. 每个模块必须包含完整的功能信息
3. 分析模块间的依赖关系

**输出格式**：
{
  "modules": [
    {
      "name": "模块名称",
      "displayName": "模块显示名称", 
      "description": "模块描述",
      "category": "模块分类",
      "status": "开发状态",
      "priority": "优先级",
      "features": [
        {
          "name": "功能名称",
          "description": "功能描述",
          "type": "功能类型",
          "status": "实现状态",
          "complexity": "复杂度",
          "requirements": ["需求列表"]
        }
      ],
      "dependencies": ["依赖模块列表"],
      "apis": ["相关API列表"],
      "dataModels": ["相关数据模型列表"]
    }
  ],
  "workflows": [
    {
      "name": "流程名称",
      "description": "流程描述",
      "steps": [
        {
          "name": "步骤名称",
          "description": "步骤描述",
          "type": "步骤类型",
          "module": "所属模块",
          "order": 顺序号
        }
      ],
      "conditions": ["流程条件"],
      "outputs": ["输出结果"]
    }
  ],
  "metadata": {
    "projectName": "项目名称",
    "version": "版本号",
    "architecture": "架构类型"
  }
}

**分析要求**：
1. 识别功能模块和子功能
2. 分析模块间的依赖关系
3. 提取业务流程和工作流
4. 识别核心功能和扩展功能
5. 评估开发复杂度和优先级

**文档内容**：
{content}

请分析并返回完整的功能模块定义JSON：
    `,
    
    BUSINESS_PROCESS: `
你是一个专业的业务流程分析师。请分析以下业务流程文档，提取业务流程和规则信息。

**严格要求**：
1. 必须输出完整的JSON格式
2. 每个流程必须包含完整的步骤信息
3. 分析业务规则和决策点

**输出格式**：
{
  "processes": [
    {
      "name": "流程名称",
      "displayName": "流程显示名称",
      "description": "流程描述",
      "category": "流程分类",
      "type": "流程类型",
      "actors": ["参与角色"],
      "steps": [
        {
          "id": "步骤ID",
          "name": "步骤名称",
          "description": "步骤描述",
          "type": "步骤类型",
          "actor": "执行角色",
          "inputs": ["输入条件"],
          "outputs": ["输出结果"],
          "decisions": ["决策点"],
          "nextSteps": ["后续步骤"]
        }
      ],
      "rules": [
        {
          "name": "规则名称",
          "description": "规则描述",
          "condition": "触发条件",
          "action": "执行动作",
          "priority": "优先级"
        }
      ],
      "exceptions": [
        {
          "name": "异常名称",
          "description": "异常描述",
          "handling": "处理方式"
        }
      ]
    }
  ],
  "metadata": {
    "domain": "业务域",
    "version": "版本号",
    "lastUpdated": "更新时间"
  }
}

**分析要求**：
1. 识别业务流程和子流程
2. 提取流程步骤和决策点
3. 分析参与角色和职责
4. 识别业务规则和约束
5. 提取异常处理机制

**文档内容**：
{content}

请分析并返回完整的业务流程定义JSON：
    `,
    
    TECHNICAL_SPEC: `
你是一个专业的技术规格分析师。请分析以下技术规格文档，提取技术架构和实现细节。

**严格要求**：
1. 必须输出完整的JSON格式
2. 每个组件必须包含完整的技术信息
3. 分析技术依赖和约束

**输出格式**：
{
  "architecture": {
    "name": "架构名称",
    "type": "架构类型",
    "description": "架构描述",
    "patterns": ["设计模式"],
    "principles": ["设计原则"]
  },
  "components": [
    {
      "name": "组件名称",
      "type": "组件类型",
      "description": "组件描述",
      "technology": "技术栈",
      "interfaces": [
        {
          "name": "接口名称",
          "type": "接口类型",
          "protocol": "通信协议",
          "format": "数据格式"
        }
      ],
      "dependencies": ["依赖组件"],
      "configurations": [
        {
          "name": "配置项",
          "type": "配置类型",
          "defaultValue": "默认值",
          "description": "配置说明"
        }
      ]
    }
  ],
  "deployment": {
    "environment": "部署环境",
    "requirements": ["环境要求"],
    "steps": ["部署步骤"],
    "monitoring": ["监控指标"]
  },
  "quality": {
    "performance": ["性能要求"],
    "security": ["安全要求"],
    "scalability": ["扩展性要求"],
    "reliability": ["可靠性要求"]
  }
}

**分析要求**：
1. 识别技术架构和组件
2. 提取技术栈和依赖关系
3. 分析接口和通信方式
4. 识别配置和部署要求
5. 评估质量属性和约束

**文档内容**：
{content}

请分析并返回完整的技术规格定义JSON：
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