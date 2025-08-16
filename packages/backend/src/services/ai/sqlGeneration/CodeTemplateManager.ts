import { SQLDialect, ParsedModel, ParsedTable, ParsedField } from '../types'
import logger from '../../../utils/logger'
import * as fs from 'fs/promises'
import * as path from 'path'

export interface CodeTemplate {
  id: string
  name: string
  description: string
  category: 'DDL' | 'DML' | 'PROCEDURE' | 'FUNCTION' | 'TRIGGER' | 'VIEW' | 'INDEX' | 'CONSTRAINT'
  dialect: SQLDialect | 'ALL'
  template: string
  variables: TemplateVariable[]
  examples: TemplateExample[]
  tags: string[]
  version: string
  author?: string
  createdAt: Date
  updatedAt: Date
  usage: {
    usageCount: number
    lastUsed?: Date
    averageRating?: number
  }
}

export interface TemplateVariable {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  description: string
  required: boolean
  defaultValue?: any
  validation?: {
    pattern?: string
    min?: number
    max?: number
    options?: string[]
  }
}

export interface TemplateExample {
  title: string
  description: string
  variables: Record<string, any>
  expectedOutput: string
}

export interface TemplateRenderContext {
  model: ParsedModel
  table?: ParsedTable
  field?: ParsedField
  dialect: SQLDialect
  customVariables?: Record<string, any>
  options?: {
    includeComments?: boolean
    formatStyle?: 'compact' | 'expanded' | 'pretty'
    useSchemaPrefix?: boolean
    schemaName?: string
  }
}

export interface TemplateCollection {
  id: string
  name: string
  description: string
  templates: CodeTemplate[]
  metadata: {
    version: string
    author: string
    createdAt: Date
    tags: string[]
  }
}

export class CodeTemplateManager {
  private static templates: Map<string, CodeTemplate> = new Map()
  private static collections: Map<string, TemplateCollection> = new Map()
  private static templateCache: Map<string, string> = new Map()

  /**
   * 初始化模板管理器
   */
  static async initialize(): Promise<void> {
    logger.info('初始化代码模板管理器')
    
    try {
      await this.loadBuiltinTemplates()
      await this.loadUserTemplates()
      
      logger.info('代码模板管理器初始化完成', {
        templatesCount: this.templates.size,
        collectionsCount: this.collections.size
      })
    } catch (error) {
      logger.error('代码模板管理器初始化失败', { error: error.message })
      throw error
    }
  }

  /**
   * 渲染模板
   */
  static async renderTemplate(
    templateId: string,
    context: TemplateRenderContext
  ): Promise<string> {
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error(`模板 ${templateId} 不存在`)
    }

    logger.info('渲染代码模板', {
      templateId,
      templateName: template.name,
      modelName: context.model.name,
      dialect: context.dialect
    })

    // 构建渲染上下文
    const renderContext = this.buildRenderContext(template, context)
    
    // 验证必需变量
    this.validateRequiredVariables(template, renderContext)
    
    // 渲染模板
    const result = this.processTemplate(template.template, renderContext)
    
    // 更新使用统计
    await this.updateUsageStats(templateId)
    
    logger.info('模板渲染完成', {
      templateId,
      outputLength: result.length
    })

    return result
  }

  /**
   * 获取模板列表
   */
  static getTemplates(filters?: {
    category?: string
    dialect?: SQLDialect
    tags?: string[]
    search?: string
  }): CodeTemplate[] {
    let templates = Array.from(this.templates.values())
    
    if (filters) {
      if (filters.category) {
        templates = templates.filter(t => t.category === filters.category)
      }
      
      if (filters.dialect) {
        templates = templates.filter(t => t.dialect === 'ALL' || t.dialect === filters.dialect)
      }
      
      if (filters.tags && filters.tags.length > 0) {
        templates = templates.filter(t => 
          filters.tags!.some(tag => t.tags.includes(tag))
        )
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        templates = templates.filter(t =>
          t.name.toLowerCase().includes(searchLower) ||
          t.description.toLowerCase().includes(searchLower) ||
          t.tags.some(tag => tag.toLowerCase().includes(searchLower))
        )
      }
    }
    
    return templates.sort((a, b) => {
      // 按使用频率和评分排序
      const aScore = (a.usage.usageCount || 0) * (a.usage.averageRating || 3)
      const bScore = (b.usage.usageCount || 0) * (b.usage.averageRating || 3)
      return bScore - aScore
    })
  }

  /**
   * 添加自定义模板
   */
  static async addTemplate(template: Omit<CodeTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usage'>): Promise<string> {
    const templateId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const fullTemplate: CodeTemplate = {
      ...template,
      id: templateId,
      createdAt: new Date(),
      updatedAt: new Date(),
      usage: {
        usageCount: 0
      }
    }
    
    this.templates.set(templateId, fullTemplate)
    
    // 保存到用户模板文件
    await this.saveUserTemplate(fullTemplate)
    
    logger.info('添加自定义模板', {
      templateId,
      templateName: template.name,
      category: template.category
    })
    
    return templateId
  }

  /**
   * 更新模板
   */
  static async updateTemplate(templateId: string, updates: Partial<CodeTemplate>): Promise<void> {
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error(`模板 ${templateId} 不存在`)
    }
    
    const updatedTemplate = {
      ...template,
      ...updates,
      id: templateId, // 保持ID不变
      updatedAt: new Date()
    }
    
    this.templates.set(templateId, updatedTemplate)
    
    // 如果是自定义模板，保存到文件
    if (templateId.startsWith('custom_')) {
      await this.saveUserTemplate(updatedTemplate)
    }
    
    logger.info('更新模板', {
      templateId,
      templateName: updatedTemplate.name
    })
  }

  /**
   * 删除模板
   */
  static async deleteTemplate(templateId: string): Promise<void> {
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error(`模板 ${templateId} 不存在`)
    }
    
    // 只能删除自定义模板
    if (!templateId.startsWith('custom_')) {
      throw new Error('只能删除自定义模板')
    }
    
    this.templates.delete(templateId)
    
    // 从文件中删除
    await this.deleteUserTemplate(templateId)
    
    logger.info('删除模板', {
      templateId,
      templateName: template.name
    })
  }

  /**
   * 获取模板详情
   */
  static getTemplate(templateId: string): CodeTemplate | null {
    return this.templates.get(templateId) || null
  }

  /**
   * 预览模板输出
   */
  static async previewTemplate(
    templateId: string,
    context: TemplateRenderContext
  ): Promise<{ output: string, variables: Record<string, any> }> {
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error(`模板 ${templateId} 不存在`)
    }

    const renderContext = this.buildRenderContext(template, context)
    const output = this.processTemplate(template.template, renderContext)
    
    return {
      output,
      variables: renderContext
    }
  }

  /**
   * 导出模板集合
   */
  static async exportTemplateCollection(templateIds: string[]): Promise<TemplateCollection> {
    const templates = templateIds
      .map(id => this.templates.get(id))
      .filter(t => t !== undefined) as CodeTemplate[]
    
    const collection: TemplateCollection = {
      id: `collection_${Date.now()}`,
      name: '导出的模板集合',
      description: `包含 ${templates.length} 个模板的集合`,
      templates,
      metadata: {
        version: '1.0.0',
        author: 'System',
        createdAt: new Date(),
        tags: []
      }
    }
    
    return collection
  }

  /**
   * 导入模板集合
   */
  static async importTemplateCollection(collection: TemplateCollection): Promise<string[]> {
    const importedIds: string[] = []
    
    for (const template of collection.templates) {
      try {
        const templateId = await this.addTemplate({
          name: template.name,
          description: template.description,
          category: template.category,
          dialect: template.dialect,
          template: template.template,
          variables: template.variables,
          examples: template.examples,
          tags: template.tags,
          version: template.version,
          author: template.author
        })
        
        importedIds.push(templateId)
      } catch (error) {
        logger.warn('导入模板失败', {
          templateName: template.name,
          error: error.message
        })
      }
    }
    
    logger.info('导入模板集合完成', {
      collectionName: collection.name,
      totalTemplates: collection.templates.length,
      importedCount: importedIds.length
    })
    
    return importedIds
  }

  // 私有方法
  private static async loadBuiltinTemplates(): Promise<void> {
    const builtinTemplates = this.getBuiltinTemplates()
    
    for (const template of builtinTemplates) {
      this.templates.set(template.id, template)
    }
    
    logger.info('加载内置模板完成', { count: builtinTemplates.length })
  }

  private static async loadUserTemplates(): Promise<void> {
    try {
      const userTemplatesDir = path.join(process.cwd(), 'data', 'templates')
      
      try {
        const files = await fs.readdir(userTemplatesDir)
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            const filePath = path.join(userTemplatesDir, file)
            const content = await fs.readFile(filePath, 'utf-8')
            const template: CodeTemplate = JSON.parse(content)
            
            // 转换日期字段
            template.createdAt = new Date(template.createdAt)
            template.updatedAt = new Date(template.updatedAt)
            if (template.usage.lastUsed) {
              template.usage.lastUsed = new Date(template.usage.lastUsed)
            }
            
            this.templates.set(template.id, template)
          }
        }
      } catch (error) {
        // 目录不存在，创建它
        await fs.mkdir(userTemplatesDir, { recursive: true })
      }
      
      logger.info('加载用户模板完成')
    } catch (error) {
      logger.error('加载用户模板失败', { error: error.message })
    }
  }

  private static buildRenderContext(template: CodeTemplate, context: TemplateRenderContext): Record<string, any> {
    const renderContext: Record<string, any> = {
      // 基础上下文
      model: context.model,
      table: context.table,
      field: context.field,
      dialect: context.dialect,
      options: context.options || {},
      
      // 工具函数
      utils: {
        formatName: (name: string) => this.formatIdentifier(name, context.dialect),
        quote: (identifier: string) => this.quoteIdentifier(identifier, context.dialect),
        upperCase: (str: string) => str.toUpperCase(),
        lowerCase: (str: string) => str.toLowerCase(),
        camelCase: (str: string) => this.toCamelCase(str),
        snakeCase: (str: string) => this.toSnakeCase(str),
        now: () => new Date().toISOString()
      },
      
      // 自定义变量
      ...context.customVariables
    }
    
    // 添加模板默认变量
    for (const variable of template.variables) {
      if (variable.defaultValue !== undefined && !(variable.name in renderContext)) {
        renderContext[variable.name] = variable.defaultValue
      }
    }
    
    return renderContext
  }

  private static validateRequiredVariables(template: CodeTemplate, context: Record<string, any>): void {
    const missingVariables: string[] = []
    
    for (const variable of template.variables) {
      if (variable.required && !(variable.name in context)) {
        missingVariables.push(variable.name)
      }
    }
    
    if (missingVariables.length > 0) {
      throw new Error(`缺少必需的模板变量: ${missingVariables.join(', ')}`)
    }
  }

  private static processTemplate(templateStr: string, context: Record<string, any>): string {
    // 简单的模板引擎实现
    let result = templateStr
    
    // 处理变量替换 {{variable}}
    result = result.replace(/\{\{([^}]+)\}\}/g, (match, variablePath) => {
      const value = this.getNestedValue(context, variablePath.trim())
      return value !== undefined ? String(value) : match
    })
    
    // 处理条件语句 {{#if condition}}...{{/if}}
    result = result.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
      const conditionValue = this.evaluateCondition(condition.trim(), context)
      return conditionValue ? content : ''
    })
    
    // 处理循环语句 {{#each array}}...{{/each}}
    result = result.replace(/\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayPath, content) => {
      const array = this.getNestedValue(context, arrayPath.trim())
      if (!Array.isArray(array)) return ''
      
      return array.map((item, index) => {
        let itemContent = content
        itemContent = itemContent.replace(/\{\{this\}\}/g, String(item))
        itemContent = itemContent.replace(/\{\{@index\}\}/g, String(index))
        
        // 如果item是对象，替换其属性
        if (typeof item === 'object' && item !== null) {
          for (const [key, value] of Object.entries(item)) {
            itemContent = itemContent.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value))
          }
        }
        
        return itemContent
      }).join('')
    })
    
    return result
  }

  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined
    }, obj)
  }

  private static evaluateCondition(condition: string, context: Record<string, any>): boolean {
    // 简单的条件评估
    const value = this.getNestedValue(context, condition)
    return Boolean(value)
  }

  private static async updateUsageStats(templateId: string): Promise<void> {
    const template = this.templates.get(templateId)
    if (!template) return
    
    template.usage.usageCount = (template.usage.usageCount || 0) + 1
    template.usage.lastUsed = new Date()
    
    // 如果是自定义模板，保存到文件
    if (templateId.startsWith('custom_')) {
      await this.saveUserTemplate(template)
    }
  }

  private static async saveUserTemplate(template: CodeTemplate): Promise<void> {
    try {
      const userTemplatesDir = path.join(process.cwd(), 'data', 'templates')
      await fs.mkdir(userTemplatesDir, { recursive: true })
      
      const filePath = path.join(userTemplatesDir, `${template.id}.json`)
      await fs.writeFile(filePath, JSON.stringify(template, null, 2), 'utf-8')
    } catch (error) {
      logger.error('保存用户模板失败', {
        templateId: template.id,
        error: error.message
      })
    }
  }

  private static async deleteUserTemplate(templateId: string): Promise<void> {
    try {
      const userTemplatesDir = path.join(process.cwd(), 'data', 'templates')
      const filePath = path.join(userTemplatesDir, `${templateId}.json`)
      await fs.unlink(filePath)
    } catch (error) {
      logger.error('删除用户模板失败', {
        templateId,
        error: error.message
      })
    }
  }

  private static formatIdentifier(name: string, dialect: SQLDialect): string {
    // 根据数据库方言格式化标识符
    switch (dialect) {
      case SQLDialect.MYSQL:
        return name.toLowerCase()
      case SQLDialect.POSTGRESQL:
        return name.toLowerCase()
      case SQLDialect.ORACLE:
        return name.toUpperCase()
      default:
        return name
    }
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

  private static toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
  }

  private static toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '')
  }

  private static getBuiltinTemplates(): CodeTemplate[] {
    return [
      {
        id: 'builtin_create_table',
        name: '创建表',
        description: '标准的CREATE TABLE语句模板',
        category: 'DDL',
        dialect: 'ALL',
        template: `CREATE TABLE {{#if options.useSchemaPrefix}}{{options.schemaName}}.{{/if}}{{utils.quote table.name}} (
{{#each table.fields}}
  {{utils.quote name}} {{type}}{{#if length}}({{length}}){{/if}}{{#if precision}}}({{precision}}{{#if scale}},{{scale}}{{/if}}){{/if}}{{#if not nullable}} NOT NULL{{/if}}{{#if isPrimaryKey}} PRIMARY KEY{{/if}}{{#if isAutoIncrement}} AUTO_INCREMENT{{/if}}{{#if defaultValue}} DEFAULT {{defaultValue}}{{/if}}{{#if comment}}{{#if options.includeComments}} COMMENT '{{comment}}'{{/if}}{{/if}}{{#if @index}},{{/if}}
{{/each}}
){{#if options.includeComments}}{{#if table.comment}} COMMENT = '{{table.comment}}'{{/if}}{{/if}};`,
        variables: [
          {
            name: 'table',
            type: 'object',
            description: '表对象',
            required: true
          }
        ],
        examples: [
          {
            title: '创建用户表',
            description: '创建一个简单的用户表',
            variables: {},
            expectedOutput: 'CREATE TABLE `users` (\n  `id` INT PRIMARY KEY AUTO_INCREMENT,\n  `name` VARCHAR(100) NOT NULL,\n  `email` VARCHAR(255)\n);'
          }
        ],
        tags: ['table', 'create', 'ddl'],
        version: '1.0.0',
        author: 'System',
        createdAt: new Date(),
        updatedAt: new Date(),
        usage: {
          usageCount: 0
        }
      },
      {
        id: 'builtin_insert_data',
        name: '插入数据',
        description: 'INSERT INTO语句模板',
        category: 'DML',
        dialect: 'ALL',
        template: `INSERT INTO {{utils.quote table.name}} (
{{#each table.fields}}
  {{utils.quote name}}{{#if @index}},{{/if}}
{{/each}}
) VALUES (
{{#each table.fields}}
  {{#if defaultValue}}{{defaultValue}}{{else}}?{{/if}}{{#if @index}},{{/if}}
{{/each}}
);`,
        variables: [
          {
            name: 'table',
            type: 'object',
            description: '表对象',
            required: true
          }
        ],
        examples: [
          {
            title: '插入用户数据',
            description: '向用户表插入数据',
            variables: {},
            expectedOutput: 'INSERT INTO `users` (\n  `id`,\n  `name`,\n  `email`\n) VALUES (\n  ?,\n  ?,\n  ?\n);'
          }
        ],
        tags: ['insert', 'data', 'dml'],
        version: '1.0.0',
        author: 'System',
        createdAt: new Date(),
        updatedAt: new Date(),
        usage: {
          usageCount: 0
        }
      },
      {
        id: 'builtin_select_all',
        name: '查询所有数据',
        description: 'SELECT * FROM语句模板',
        category: 'DML',
        dialect: 'ALL',
        template: `SELECT 
{{#each table.fields}}
  {{utils.quote name}}{{#if @index}},{{/if}}
{{/each}}
FROM {{utils.quote table.name}}
{{#if whereClause}}WHERE {{whereClause}}{{/if}}
{{#if orderBy}}ORDER BY {{orderBy}}{{/if}}
{{#if limit}}LIMIT {{limit}}{{/if}};`,
        variables: [
          {
            name: 'table',
            type: 'object',
            description: '表对象',
            required: true
          },
          {
            name: 'whereClause',
            type: 'string',
            description: 'WHERE条件',
            required: false
          },
          {
            name: 'orderBy',
            type: 'string',
            description: '排序字段',
            required: false
          },
          {
            name: 'limit',
            type: 'number',
            description: '限制行数',
            required: false
          }
        ],
        examples: [
          {
            title: '查询用户',
            description: '查询所有用户数据',
            variables: {},
            expectedOutput: 'SELECT \n  `id`,\n  `name`,\n  `email`\nFROM `users`;'
          }
        ],
        tags: ['select', 'query', 'dml'],
        version: '1.0.0',
        author: 'System',
        createdAt: new Date(),
        updatedAt: new Date(),
        usage: {
          usageCount: 0
        }
      }
    ]
  }
}