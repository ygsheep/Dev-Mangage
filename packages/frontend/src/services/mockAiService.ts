/**
 * 模拟AI服务，用于测试和调试
 */

import { ParsedAPIDocument } from './aiParsingService'
import { APIStatus, HTTPMethod } from '@shared/types'

// 模拟解析API文档
export async function mockParseAPIDocument(content: string, projectId: string): Promise<ParsedAPIDocument> {
  console.log('🎭 模拟AI解析开始:', {
    contentLength: content.length,
    contentPreview: content.substring(0, 200) + '...',
    projectId
  })

  // 模拟处理时间
  await new Promise(resolve => setTimeout(resolve, 1000))

  // 分析文档内容，尝试提取API信息
  const apis = extractAPIsFromContent(content, projectId)

  console.log('🎭 模拟AI解析完成:', {
    extractedAPIs: apis.length,
    apis: apis.map(api => ({ name: api.name, method: api.method, path: api.path }))
  })

  return {
    apis,
    success: apis.length > 0,
    errors: apis.length === 0 ? ['模拟模式：未在文档中找到API接口定义'] : [],
    confidence: 0.8
  }
}

// 从文档内容中提取API信息的简单解析器
function extractAPIsFromContent(content: string, projectId: string) {
  const apis: any[] = []
  const lines = content.split('\n')
  
  // 查找API接口定义的模式
  const apiPatterns = [
    // HTTP方法 + 路径
    /^(GET|POST|PUT|DELETE|PATCH)\s+([^\s]+)/i,
    // ### API名称 - HTTP方法 路径
    /^#{1,4}\s*(.+?)\s*-\s*(GET|POST|PUT|DELETE|PATCH)\s+(.+)$/i,
    // HTTP方法：路径
    /(GET|POST|PUT|DELETE|PATCH):\s*([^\s]+)/i,
    // 接口：HTTP方法 路径
    /接口[：:]\s*(GET|POST|PUT|DELETE|PATCH)\s+([^\s]+)/i
  ]
  
  let currentSection = ''
  let apiIndex = 0
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // 跟踪当前章节
    if (line.startsWith('#')) {
      currentSection = line.replace(/^#+\s*/, '')
      continue
    }
    
    // 尝试匹配API模式
    for (const pattern of apiPatterns) {
      const match = line.match(pattern)
      if (match) {
        const api = createAPIFromMatch(match, currentSection, projectId, apiIndex++)
        if (api) {
          // 查找接口描述
          api.description = findAPIDescription(lines, i)
          apis.push(api)
        }
        break
      }
    }
    
    // 查找表格形式的API定义
    if (line.includes('|') && (line.toLowerCase().includes('api') || line.toLowerCase().includes('接口'))) {
      const tableAPIs = parseAPITable(lines, i)
      apis.push(...tableAPIs.map((api, idx) => ({
        ...api,
        projectId,
        id: `mock-table-${apiIndex + idx}`,
        status: APIStatus.NOT_STARTED,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })))
      apiIndex += tableAPIs.length
    }
  }
  
  return apis
}

// 根据正则匹配结果创建API对象
function createAPIFromMatch(match: RegExpMatchArray, section: string, projectId: string, index: number) {
  let method: string, path: string, name: string
  
  if (match.length === 3) {
    // GET /api/users 格式
    method = match[1].toUpperCase()
    path = match[2]
    name = `${section || '接口'} ${index + 1}`
  } else if (match.length === 4) {
    // ### 用户列表 - GET /api/users 格式
    name = match[1].trim()
    method = match[2].toUpperCase()
    path = match[3]
  } else {
    return null
  }
  
  // 验证HTTP方法
  const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
  if (!validMethods.includes(method)) {
    return null
  }
  
  // 确保路径以/开头
  if (!path.startsWith('/')) {
    path = '/' + path
  }
  
  return {
    id: `mock-${Date.now()}-${index}`,
    name: name || `${method} ${path}`,
    description: '',
    method: method as HTTPMethod,
    path,
    projectId,
    status: APIStatus.NOT_STARTED,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

// 查找API描述
function findAPIDescription(lines: string[], currentIndex: number): string {
  // 查找当前行附近的描述信息
  const searchRange = 3
  const descriptions = []
  
  // 向前查找
  for (let i = Math.max(0, currentIndex - searchRange); i < currentIndex; i++) {
    const line = lines[i].trim()
    if (line && !line.startsWith('#') && !line.match(/^(GET|POST|PUT|DELETE|PATCH)/i)) {
      descriptions.push(line)
    }
  }
  
  // 向后查找
  for (let i = currentIndex + 1; i < Math.min(lines.length, currentIndex + searchRange + 1); i++) {
    const line = lines[i].trim()
    if (line && !line.startsWith('#') && !line.match(/^(GET|POST|PUT|DELETE|PATCH)/i)) {
      descriptions.push(line)
      break // 只取第一个描述行
    }
  }
  
  return descriptions.join(' ').replace(/[|`*]/g, '').trim()
}

// 解析表格形式的API定义
function parseAPITable(lines: string[], startIndex: number): any[] {
  const apis: any[] = []
  
  // 查找表格头
  let headerIndex = -1
  for (let i = startIndex; i < Math.min(lines.length, startIndex + 5); i++) {
    const line = lines[i].trim()
    if (line.includes('|') && (line.toLowerCase().includes('方法') || line.toLowerCase().includes('method'))) {
      headerIndex = i
      break
    }
  }
  
  if (headerIndex === -1) return apis
  
  // 解析表格头部，确定列的位置
  const headerLine = lines[headerIndex].trim()
  const headers = headerLine.split('|').map(h => h.trim().toLowerCase())
  
  const nameIndex = headers.findIndex(h => h.includes('名称') || h.includes('name') || h.includes('接口'))
  const methodIndex = headers.findIndex(h => h.includes('方法') || h.includes('method'))
  const pathIndex = headers.findIndex(h => h.includes('路径') || h.includes('path') || h.includes('url'))
  const descIndex = headers.findIndex(h => h.includes('描述') || h.includes('说明') || h.includes('description'))
  
  if (methodIndex === -1 || pathIndex === -1) return apis
  
  // 跳过分隔符行
  const dataStartIndex = headerIndex + 2
  
  // 解析数据行
  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line.includes('|') || line.startsWith('|--')) break
    
    const cells = line.split('|').map(c => c.trim())
    if (cells.length < Math.max(methodIndex, pathIndex) + 1) continue
    
    const method = cells[methodIndex]?.toUpperCase()
    const path = cells[pathIndex]
    const name = nameIndex >= 0 ? cells[nameIndex] : ''
    const description = descIndex >= 0 ? cells[descIndex] : ''
    
    if (method && path && ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      apis.push({
        name: name || `${method} ${path}`,
        method: method as HTTPMethod,
        path: path.startsWith('/') ? path : '/' + path,
        description: description || ''
      })
    }
  }
  
  return apis
}

// 模拟解析数据库文档
export async function mockParseDatabaseDocument(content: string): Promise<any> {
  console.log('🎭 模拟数据库解析开始:', {
    contentLength: content.length,
    contentPreview: content.substring(0, 200) + '...'
  })

  await new Promise(resolve => setTimeout(resolve, 1200))

  // 分析内容，提取数据库表信息
  const result = extractDatabaseFromContent(content)

  console.log('🎭 模拟数据库解析完成:', {
    extractedTables: result.tables.length,
    extractedIndexes: result.indexes.length,
    tables: result.tables.map(t => t.name)
  })

  return {
    ...result,
    success: result.tables.length > 0,
    errors: result.tables.length === 0 ? ['模拟模式：未在文档中找到数据库表定义'] : [],
    confidence: 0.85
  }
}

// 增强的数据库内容解析器
function extractDatabaseFromContent(content: string) {
  console.log('🔍 开始分析数据库内容...')
  
  const result = {
    tables: [],
    indexes: [],
    relationships: [],
    views: [],
    procedures: [],
    triggers: []
  }
  
  // 首先尝试解析SQL语句
  const sqlTables = extractTablesFromSQL(content)
  if (sqlTables.length > 0) {
    console.log('📊 从SQL语句中提取到', sqlTables.length, '个表')
    result.tables.push(...sqlTables)
  }
  
  // 然后解析Markdown格式的表定义
  const markdownTables = extractTablesFromMarkdown(content)
  if (markdownTables.length > 0) {
    console.log('📝 从Markdown文档中提取到', markdownTables.length, '个表')
    result.tables.push(...markdownTables)
  }
  
  // 提取索引信息
  result.indexes = extractIndexesFromContent(content)
  
  // 提取表关系
  result.relationships = extractRelationshipsFromContent(content)
  
  // 去重处理
  result.tables = deduplicateTables(result.tables)
  
  console.log('✅ 数据库解析完成:', {
    tables: result.tables.length,
    indexes: result.indexes.length,
    relationships: result.relationships.length
  })
  
  return result
}

// 从SQL语句中提取表定义
function extractTablesFromSQL(content: string) {
  const tables = []
  
  // 匹配CREATE TABLE语句
  const createTableRegex = /CREATE\s+TABLE\s+(\w+)\s*\(\s*([\s\S]*?)\s*\)\s*(?:ENGINE|;)/gi
  let match
  
  while ((match = createTableRegex.exec(content)) !== null) {
    const tableName = match[1]
    const tableDefinition = match[2]
    
    console.log('🔍 解析SQL表:', tableName)
    
    const table = {
      id: `sql-${tableName}-${Date.now()}`,
      name: tableName.toLowerCase(),
      displayName: tableName,
      comment: extractTableCommentFromSQL(content, tableName),
      engine: 'InnoDB',
      charset: 'utf8mb4',
      fields: parseFieldsFromSQLDefinition(tableDefinition),
      constraints: parseConstraintsFromSQLDefinition(tableDefinition),
      indexes: parseIndexesFromSQLDefinition(tableDefinition),
      source: 'sql'
    }
    
    tables.push(table)
  }
  
  return tables
}

// 从Markdown文档中提取表定义
function extractTablesFromMarkdown(content: string) {
  const tables = []
  const lines = content.split('\n')
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // 查找表标题 (如: #### 1.1 用户表 (users))
    const tableHeaderMatch = line.match(/^#{1,6}\s*(?:\d+\.?\d*\s+)?(.+?)(?:\s*\((\w+)\))?/i)
    if (tableHeaderMatch && (line.includes('表') || line.toLowerCase().includes('table'))) {
      const displayName = tableHeaderMatch[1].trim()
      const tableName = tableHeaderMatch[2] || displayName.replace(/[^\w\u4e00-\u9fa5]/g, '_').toLowerCase()
      
      console.log('📝 解析Markdown表:', displayName)
      
      // 查找表的SQL定义或字段描述
      const tableData = extractTableDataFromMarkdown(lines, i + 1, displayName)
      
      if (tableData.fields.length > 0 || tableData.sqlDefinition) {
        const table = {
          id: `md-${tableName}-${Date.now()}`,
          name: tableName,
          displayName: displayName,
          comment: tableData.comment,
          fields: tableData.fields,
          constraints: tableData.constraints || [],
          indexes: tableData.indexes || [],
          source: 'markdown',
          sqlDefinition: tableData.sqlDefinition
        }
        
        tables.push(table)
      }
    }
  }
  
  return tables
}

// 从Markdown中提取单个表的数据
function extractTableDataFromMarkdown(lines, startIndex, tableName) {
  const tableData = {
    comment: '',
    fields: [],
    constraints: [],
    indexes: [],
    sqlDefinition: ''
  }
  
  let inSqlBlock = false
  let sqlContent = ''
  
  // 扫描表定义内容
  for (let i = startIndex; i < Math.min(lines.length, startIndex + 100); i++) {
    const line = lines[i].trim()
    
    // 遇到下一个表标题则停止
    if (line.match(/^#{1,6}\s*(?:\d+\.?\d*\s+)?/) && line !== lines[startIndex - 1]) {
      break
    }
    
    // 检测SQL代码块
    if (line.startsWith('```sql')) {
      inSqlBlock = true
      continue
    } else if (line.startsWith('```') && inSqlBlock) {
      inSqlBlock = false
      tableData.sqlDefinition = sqlContent.trim()
      
      // 如果有SQL定义，从中解析字段
      if (tableData.sqlDefinition) {
        tableData.fields = parseFieldsFromSQLDefinition(tableData.sqlDefinition)
        tableData.constraints = parseConstraintsFromSQLDefinition(tableData.sqlDefinition)
        tableData.indexes = parseIndexesFromSQLDefinition(tableData.sqlDefinition)
      }
      continue
    }
    
    if (inSqlBlock) {
      sqlContent += line + '\n'
      continue
    }
    
    // 提取表描述
    if (!tableData.comment && line && !line.startsWith('#') && !line.includes('|')) {
      tableData.comment = line
    }
    
    // 解析字段表格
    if (line.includes('|') && (line.includes('字段') || line.includes('Field'))) {
      const fieldsData = parseFieldsFromTable(lines, i)
      if (fieldsData.length > 0) {
        tableData.fields.push(...fieldsData)
      }
    }
  }
  
  return tableData
}

// 从SQL定义中解析字段
function parseFieldsFromSQLDefinition(sqlDefinition) {
  const fields = []
  const lines = sqlDefinition.split('\n')
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    
    // 跳过约束、索引等非字段行
    if (trimmedLine.startsWith('PRIMARY KEY') || 
        trimmedLine.startsWith('FOREIGN KEY') ||
        trimmedLine.startsWith('INDEX') ||
        trimmedLine.startsWith('KEY') ||
        trimmedLine.startsWith('UNIQUE') ||
        trimmedLine.startsWith('CONSTRAINT') ||
        trimmedLine === '' || 
        trimmedLine === ',') {
      continue
    }
    
    // 解析字段定义
    const fieldMatch = trimmedLine.match(/^(\w+)\s+([^\s,]+)(?:\s+([^,]*?))?(?:,|$)/i)
    if (fieldMatch) {
      const fieldName = fieldMatch[1]
      const fieldType = fieldMatch[2].toUpperCase()
      const fieldConstraints = fieldMatch[3] || ''
      
      const field = {
        name: fieldName,
        type: fieldType,
        length: extractLengthFromType(fieldType),
        nullable: !fieldConstraints.includes('NOT NULL'),
        primaryKey: fieldConstraints.includes('PRIMARY KEY') || fieldConstraints.includes('AUTO_INCREMENT'),
        autoIncrement: fieldConstraints.includes('AUTO_INCREMENT'),
        unique: fieldConstraints.includes('UNIQUE'),
        defaultValue: extractDefaultValue(fieldConstraints),
        comment: extractCommentFromConstraints(fieldConstraints)
      }
      
      fields.push(field)
    }
  }
  
  return fields
}

// 从表格中解析字段（Markdown表格格式）
function parseFieldsFromTable(lines, headerIndex) {
  const fields = []
  
  // 解析表格头部，确定列的位置
  const headerLine = lines[headerIndex].trim()
  const headers = headerLine.split('|').map(h => h.trim().toLowerCase())
  
  const nameIndex = headers.findIndex(h => h.includes('字段') || h.includes('field') || h.includes('name'))
  const typeIndex = headers.findIndex(h => h.includes('类型') || h.includes('type'))
  const nullableIndex = headers.findIndex(h => h.includes('空') || h.includes('null') || h.includes('必填'))
  const commentIndex = headers.findIndex(h => h.includes('说明') || h.includes('comment') || h.includes('描述'))
  const defaultIndex = headers.findIndex(h => h.includes('默认') || h.includes('default'))
  
  if (nameIndex === -1 || typeIndex === -1) return fields
  
  // 跳过分隔符行，解析数据行
  const dataStartIndex = headerIndex + 2
  
  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line.includes('|') || line.startsWith('##')) break
    
    const cells = line.split('|').map(c => c.trim())
    if (cells.length <= Math.max(nameIndex, typeIndex)) continue
    
    const fieldName = cells[nameIndex] || ''
    const fieldType = cells[typeIndex] || ''
    
    if (fieldName && fieldType) {
      fields.push({
        name: fieldName,
        type: fieldType.toUpperCase(),
        length: extractLengthFromType(fieldType),
        nullable: nullableIndex >= 0 ? !cells[nullableIndex]?.includes('NOT NULL') && !cells[nullableIndex]?.includes('必填') : true,
        primaryKey: fieldType.toLowerCase().includes('primary') || fieldName.toLowerCase() === 'id',
        autoIncrement: fieldType.toLowerCase().includes('auto_increment'),
        defaultValue: defaultIndex >= 0 ? cells[defaultIndex] : null,
        comment: commentIndex >= 0 ? cells[commentIndex] : ''
      })
    }
  }
  
  return fields
}

// 辅助函数：从类型中提取长度
function extractLengthFromType(type) {
  const match = type.match(/\((\d+)\)/)
  return match ? parseInt(match[1]) : null
}

// 辅助函数：提取默认值
function extractDefaultValue(constraints) {
  const match = constraints.match(/DEFAULT\s+([^,\s]+)/i)
  if (match) {
    const value = match[1]
    if (value === 'NULL') return null
    if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1)
    return value
  }
  return null
}

// 辅助函数：提取注释
function extractCommentFromConstraints(constraints) {
  const match = constraints.match(/COMMENT\s+['"](.*?)['"]/i)
  return match ? match[1] : ''
}

// 提取表注释
function extractTableCommentFromSQL(content, tableName) {
  const regex = new RegExp(`CREATE\\s+TABLE\\s+${tableName}[\\s\\S]*?COMMENT\\s*=\\s*['"](.*?)['"]`, 'i')
  const match = content.match(regex)
  return match ? match[1] : ''
}

// 解析约束
function parseConstraintsFromSQLDefinition(sqlDefinition) {
  const constraints = []
  const lines = sqlDefinition.split('\n')
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    
    if (trimmedLine.startsWith('FOREIGN KEY')) {
      const fkMatch = trimmedLine.match(/FOREIGN KEY\s+\((\w+)\)\s+REFERENCES\s+(\w+)\s*\((\w+)\)/i)
      if (fkMatch) {
        constraints.push({
          type: 'FOREIGN_KEY',
          column: fkMatch[1],
          referencedTable: fkMatch[2],
          referencedColumn: fkMatch[3]
        })
      }
    } else if (trimmedLine.startsWith('UNIQUE KEY') || trimmedLine.startsWith('UNIQUE')) {
      constraints.push({
        type: 'UNIQUE',
        definition: trimmedLine
      })
    }
  }
  
  return constraints
}

// 解析索引
function parseIndexesFromSQLDefinition(sqlDefinition) {
  const indexes = []
  const lines = sqlDefinition.split('\n')
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    
    if (trimmedLine.startsWith('INDEX') || trimmedLine.startsWith('KEY')) {
      const indexMatch = trimmedLine.match(/(INDEX|KEY)\s+(\w+)\s*\(([^)]+)\)/i)
      if (indexMatch) {
        indexes.push({
          name: indexMatch[2],
          columns: indexMatch[3].split(',').map(c => c.trim()),
          type: 'INDEX'
        })
      }
    }
  }
  
  return indexes
}

// 提取索引信息
function extractIndexesFromContent(content) {
  const indexes = []
  
  // 匹配CREATE INDEX语句
  const indexRegex = /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(\w+)\s+ON\s+(\w+)\s*\(([^)]+)\)/gi
  let match
  
  while ((match = indexRegex.exec(content)) !== null) {
    indexes.push({
      name: match[1],
      table: match[2],
      columns: match[3].split(',').map(c => c.trim()),
      unique: match[0].includes('UNIQUE')
    })
  }
  
  return indexes
}

// 提取表关系
function extractRelationshipsFromContent(content) {
  const relationships = []
  
  // 从FOREIGN KEY约束中提取关系
  const fkRegex = /FOREIGN KEY\s+\((\w+)\)\s+REFERENCES\s+(\w+)\s*\((\w+)\)/gi
  let match
  
  while ((match = fkRegex.exec(content)) !== null) {
    relationships.push({
      type: 'one-to-many',
      fromColumn: match[1],
      toTable: match[2],
      toColumn: match[3]
    })
  }
  
  return relationships
}

// 去重处理
function deduplicateTables(tables) {
  const seen = new Set()
  return tables.filter(table => {
    const key = table.name.toLowerCase()
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

// 提取表字段信息
function extractTableFields(lines: string[], startIndex: number) {
  const fields: any[] = []
  
  // 查找字段表格
  for (let i = startIndex; i < Math.min(lines.length, startIndex + 20); i++) {
    const line = lines[i].trim()
    
    // 找到字段表格头部
    if (line.includes('|') && (line.includes('字段') || line.includes('Field'))) {
      // 解析表格
      const headers = line.split('|').map(h => h.trim().toLowerCase())
      const nameIndex = headers.findIndex(h => h.includes('字段') || h.includes('field') || h.includes('name'))
      const typeIndex = headers.findIndex(h => h.includes('类型') || h.includes('type'))
      const commentIndex = headers.findIndex(h => h.includes('说明') || h.includes('comment') || h.includes('描述'))
      
      if (nameIndex >= 0 && typeIndex >= 0) {
        // 跳过分隔符行
        for (let j = i + 2; j < lines.length; j++) {
          const dataLine = lines[j].trim()
          if (!dataLine.includes('|') || dataLine.startsWith('##')) break
          
          const cells = dataLine.split('|').map(c => c.trim())
          if (cells.length > Math.max(nameIndex, typeIndex)) {
            fields.push({
              name: cells[nameIndex] || '',
              type: cells[typeIndex] || 'varchar',
              comment: commentIndex >= 0 ? cells[commentIndex] || '' : '',
              nullable: true,
              default: null
            })
          }
        }
      }
      break
    }
  }
  
  return fields
}

// 从Mermaid图表中提取表定义
function extractTablesFromMermaid(content: string) {
  const tables = []
  
  // 查找Mermaid代码块
  const mermaidBlocks = content.match(/```mermaid[\s\S]*?```/gi)
  if (!mermaidBlocks) return tables
  
  for (const block of mermaidBlocks) {
    const mermaidContent = block.replace(/```mermaid|```/g, '').trim()
    console.log('🎨 解析Mermaid内容:', mermaidContent.substring(0, 200))
    
    // 解析实体关系图 (ER图)
    const erTables = extractTablesFromMermaidER(mermaidContent)
    if (erTables.length > 0) {
      tables.push(...erTables)
      continue
    }
    
    // 解析流程图中的数据库实体
    const flowchartTables = extractTablesFromMermaidFlowchart(mermaidContent)
    if (flowchartTables.length > 0) {
      tables.push(...flowchartTables)
    }
  }
  
  return tables
}

// 从Mermaid ER图中提取表定义
function extractTablesFromMermaidER(mermaidContent: string) {
  const tables = []
  
  // 匹配ER图实体定义 例如: CUSTOMER ||--o{ ORDER : places
  const entityRegex = /(\w+)\s*\|\|?--[o\{\}]+\s*(\w+)\s*:\s*(\w+)/g
  const entities = new Set()
  
  let match
  while ((match = entityRegex.exec(mermaidContent)) !== null) {
    entities.add(match[1])
    entities.add(match[2])
  }
  
  // 也匹配单独的实体定义
  const singleEntityRegex = /^\s*(\w+)\s*\{/gm
  while ((match = singleEntityRegex.exec(mermaidContent)) !== null) {
    entities.add(match[1])
  }
  
  // 为每个实体创建表定义
  for (const entityName of entities) {
    const table = {
      id: `mermaid-er-${entityName.toLowerCase()}-${Date.now()}`,
      name: entityName.toLowerCase(),
      displayName: entityName,
      comment: `从Mermaid ER图解析的${entityName}实体`,
      fields: generateDefaultFieldsForEntity(entityName),
      constraints: [],
      indexes: [],
      source: 'mermaid-er'
    }
    
    tables.push(table)
  }
  
  return tables
}

// 从Mermaid流程图中提取表定义
function extractTablesFromMermaidFlowchart(mermaidContent: string) {
  const tables = []
  
  // 匹配流程图节点定义，查找可能的数据库表
  const nodeRegex = /(\w+)\[([^\]]+)\]/g
  const subgraphRegex = /subgraph\s+"([^"]+)"/g
  
  let match
  
  // 解析子图（可能表示数据库模块）
  while ((match = subgraphRegex.exec(mermaidContent)) !== null) {
    const subgraphName = match[1]
    
    // 如果子图名称包含数据库相关关键词
    if (subgraphName.includes('数据库') || subgraphName.includes('Database') || 
        subgraphName.includes('存储') || subgraphName.includes('Storage')) {
      
      // 在这个子图中查找节点
      const subgraphStart = match.index
      const subgraphEnd = mermaidContent.indexOf('end', subgraphStart)
      
      if (subgraphEnd > subgraphStart) {
        const subgraphContent = mermaidContent.substring(subgraphStart, subgraphEnd)
        const nodeMatches = subgraphContent.matchAll(/(\w+)\[([^\]]+)\]/g)
        
        for (const nodeMatch of nodeMatches) {
          const nodeName = nodeMatch[1]
          const nodeLabel = nodeMatch[2]
          
          // 如果节点标签看起来像表名
          if (nodeLabel.includes('表') || nodeLabel.includes('Table') || 
              nodeLabel.includes('数据') || nodeLabel.includes('信息')) {
            
            const table = {
              id: `mermaid-flow-${nodeName.toLowerCase()}-${Date.now()}`,
              name: nodeName.toLowerCase(),
              displayName: nodeLabel,
              comment: `从Mermaid流程图解析的${nodeLabel}`,
              fields: generateDefaultFieldsForEntity(nodeName),
              constraints: [],
              indexes: [],
              source: 'mermaid-flowchart'
            }
            
            tables.push(table)
          }
        }
      }
    }
  }
  
  return tables
}

// 为实体生成默认字段
function generateDefaultFieldsForEntity(entityName: string) {
  const fields = [
    {
      name: 'id',
      type: 'BIGINT',
      length: null,
      nullable: false,
      primaryKey: true,
      autoIncrement: true,
      unique: false,
      defaultValue: null,
      comment: '主键ID'
    }
  ]
  
  // 根据实体名称推测可能的字段
  const entityLower = entityName.toLowerCase()
  
  if (entityLower.includes('user') || entityLower.includes('用户')) {
    fields.push(
      {
        name: 'username',
        type: 'VARCHAR',
        length: 50,
        nullable: false,
        primaryKey: false,
        autoIncrement: false,
        unique: true,
        defaultValue: null,
        comment: '用户名'
      },
      {
        name: 'email',
        type: 'VARCHAR',
        length: 100,
        nullable: true,
        primaryKey: false,
        autoIncrement: false,
        unique: false,
        defaultValue: null,
        comment: '邮箱地址'
      }
    )
  } else if (entityLower.includes('order') || entityLower.includes('订单')) {
    fields.push(
      {
        name: 'order_number',
        type: 'VARCHAR',
        length: 32,
        nullable: false,
        primaryKey: false,
        autoIncrement: false,
        unique: true,
        defaultValue: null,
        comment: '订单号'
      },
      {
        name: 'total_amount',
        type: 'DECIMAL',
        length: null,
        nullable: false,
        primaryKey: false,
        autoIncrement: false,
        unique: false,
        defaultValue: '0.00',
        comment: '订单总金额'
      }
    )
  } else {
    // 通用字段
    fields.push(
      {
        name: 'name',
        type: 'VARCHAR',
        length: 100,
        nullable: false,
        primaryKey: false,
        autoIncrement: false,
        unique: false,
        defaultValue: null,
        comment: '名称'
      },
      {
        name: 'description',
        type: 'TEXT',
        length: null,
        nullable: true,
        primaryKey: false,
        autoIncrement: false,
        unique: false,
        defaultValue: null,
        comment: '描述信息'
      }
    )
  }
  
  // 添加通用的时间戳字段
  fields.push(
    {
      name: 'created_at',
      type: 'TIMESTAMP',
      length: null,
      nullable: false,
      primaryKey: false,
      autoIncrement: false,
      unique: false,
      defaultValue: 'CURRENT_TIMESTAMP',
      comment: '创建时间'
    },
    {
      name: 'updated_at',
      type: 'TIMESTAMP',
      length: null,
      nullable: false,
      primaryKey: false,
      autoIncrement: false,
      unique: false,
      defaultValue: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
      comment: '更新时间'
    }
  )
  
  return fields
}

// 模拟带进度的数据库解析
export async function mockParseDatabaseDocumentWithProgress(
  content: string, 
  onProgress?: (progress: { current: number; total: number; chunk?: { title: string } }) => void
): Promise<any> {
  console.log('🎭 模拟数据库分块解析开始:', {
    contentLength: content.length,
    contentPreview: content.substring(0, 200) + '...'
  })

  // 分析内容，估算分块数量
  const estimatedTokens = content.length * 0.75
  const chunks = Math.ceil(estimatedTokens / 3000) // 假设每块3000 tokens
  
  const allTables = []
  
  for (let i = 0; i < chunks; i++) {
    // 更新进度
    onProgress?.({
      current: i,
      total: chunks,
      chunk: {
        title: `数据库文档分块 ${i + 1}/${chunks}`
      }
    })
    
    // 模拟处理时间
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // 分块处理内容
    const chunkStart = Math.floor((content.length / chunks) * i)
    const chunkEnd = Math.floor((content.length / chunks) * (i + 1))
    const chunkContent = content.substring(chunkStart, chunkEnd)
    
    // 解析当前分块
    const chunkResult = extractDatabaseFromContent(chunkContent)
    allTables.push(...chunkResult.tables)
  }
  
  // 最终进度
  onProgress?.({
    current: chunks,
    total: chunks
  })
  
  // 去重和合并结果
  const uniqueTables = deduplicateTables(allTables)
  
  console.log('🎭 模拟数据库分块解析完成:', {
    totalChunks: chunks,
    extractedTables: uniqueTables.length,
    tables: uniqueTables.map(t => t.name)
  })
  
  return {
    tables: uniqueTables,
    indexes: [],
    relationships: [],
    success: uniqueTables.length > 0,
    errors: uniqueTables.length === 0 ? ['模拟模式：未在文档中找到数据库表定义'] : [],
    confidence: 0.85
  }
}