import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import SwaggerParser from '@apidevtools/swagger-parser'
import { v4 as uuidv4 } from 'uuid'

const router = Router()
const prisma = new PrismaClient()

// 导入Swagger文档
router.post('/import', async (req, res) => {
  try {
    const { projectId, swaggerUrl, swaggerJson } = req.body
    
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' })
    }
    
    if (!swaggerUrl && !swaggerJson) {
      return res.status(400).json({ error: 'Either swaggerUrl or swaggerJson is required' })
    }
    
    // 验证项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }
    
    let swaggerDoc: any
    
    try {
      // 解析Swagger文档
      if (swaggerUrl) {
        swaggerDoc = await SwaggerParser.parse(swaggerUrl)
      } else {
        swaggerDoc = await SwaggerParser.parse(swaggerJson)
      }
    } catch (parseError: any) {
      return res.status(400).json({ 
        error: 'Invalid Swagger document', 
        details: parseError.message 
      })
    }
    
    // 转换Swagger paths为API记录
    const apis = []
    const paths = swaggerDoc.paths || {}
    
    for (const [path, methods] of Object.entries(paths)) {
      for (const [method, details] of Object.entries(methods as any)) {
        if (['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(method.toLowerCase())) {
          const apiDetail = details as any
          
          apis.push({
            id: uuidv4(),
            projectId,
            name: apiDetail.summary || apiDetail.operationId || `${method.toUpperCase()} ${path}`,
            method: method.toUpperCase(),
            path,
            description: apiDetail.description || '',
            parameters: JSON.stringify(apiDetail.parameters || []),
            responses: JSON.stringify(apiDetail.responses || {}),
            status: 'NOT_STARTED',
            frontendCode: generateFrontendCode(method.toUpperCase(), path, apiDetail),
            backendCode: generateBackendCode(method.toUpperCase(), path, apiDetail)
          })
        }
      }
    }
    
    // 批量插入APIs
    const createdAPIs = await prisma.aPI.createMany({
      data: apis
    })
    
    // 创建默认标签（如果有）
    const tags = swaggerDoc.tags || []
    for (const tag of tags) {
      try {
        await prisma.tag.create({
          data: {
            name: tag.name,
            description: tag.description || '',
            projectId,
            color: getRandomColor()
          }
        })
      } catch (error) {
        // 忽略重复标签错误
        console.log(`Tag ${tag.name} already exists`)
      }
    }
    
    res.json({
      message: 'Swagger document imported successfully',
      importedAPIs: createdAPIs.count,
      totalPaths: Object.keys(paths).length
    })
    
  } catch (error: any) {
    console.error('Swagger import error:', error)
    res.status(500).json({ error: 'Failed to import Swagger document' })
  }
})

// 验证Swagger文档
router.post('/validate', async (req, res) => {
  try {
    const { swaggerUrl, swaggerJson } = req.body
    
    if (!swaggerUrl && !swaggerJson) {
      return res.status(400).json({ error: 'Either swaggerUrl or swaggerJson is required' })
    }
    
    let swaggerDoc: any
    
    try {
      if (swaggerUrl) {
        swaggerDoc = await SwaggerParser.validate(swaggerUrl)
      } else {
        swaggerDoc = await SwaggerParser.validate(swaggerJson)
      }
      
      // 提取基本信息
      const info = {
        title: swaggerDoc.info?.title || 'Unknown API',
        version: swaggerDoc.info?.version || '1.0.0',
        description: swaggerDoc.info?.description || '',
        pathCount: Object.keys(swaggerDoc.paths || {}).length,
        tagCount: (swaggerDoc.tags || []).length,
        tags: (swaggerDoc.tags || []).map((tag: any) => tag.name)
      }
      
      res.json({
        valid: true,
        info
      })
      
    } catch (validationError: any) {
      res.status(400).json({
        valid: false,
        error: validationError.message
      })
    }
    
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to validate Swagger document' })
  }
})

// 生成前端代码
function generateFrontendCode(method: string, path: string, details: any): string {
  const functionName = details.operationId || `${method.toLowerCase()}${path.replace(/[^a-zA-Z0-9]/g, '')}`
  
  return `// ${details.summary || 'API调用'}
async function ${functionName}(${generateFrontendParams(details.parameters || [])}) {
  try {
    const response = await fetch('${path}', {
      method: '${method}',
      headers: {
        'Content-Type': 'application/json',
        // 添加其他需要的headers
      },
      ${method !== 'GET' ? 'body: JSON.stringify(data),' : ''}
    })
    
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('API调用失败:', error)
    throw error
  }
}`
}

// 生成后端代码
function generateBackendCode(method: string, path: string, details: any): string {
  return `// ${details.summary || 'API端点'}
router.${method.toLowerCase()}('${path}', async (req, res) => {
  try {
    // 参数验证
    ${generateBackendValidation(details.parameters || [])}
    
    // 业务逻辑
    const result = await ${details.operationId || 'handleRequest'}(req)
    
    res.json(result)
  } catch (error) {
    console.error('API处理失败:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})`
}

// 生成前端参数
function generateFrontendParams(parameters: any[]): string {
  const params = parameters
    .filter(p => p.in === 'path' || p.in === 'query')
    .map(p => p.name)
  
  if (parameters.some(p => p.in === 'body')) {
    params.push('data')
  }
  
  return params.join(', ')
}

// 生成后端验证
function generateBackendValidation(parameters: any[]): string {
  const validations = parameters.map(p => {
    if (p.required) {
      return `    if (!req.${p.in === 'path' ? 'params' : p.in === 'query' ? 'query' : 'body'}.${p.name}) {
      return res.status(400).json({ error: '${p.name} is required' })
    }`
    }
    return ''
  }).filter(Boolean)
  
  return validations.join('\n')
}

// 获取随机颜色
function getRandomColor(): string {
  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']
  return colors[Math.floor(Math.random() * colors.length)]
}

export default router