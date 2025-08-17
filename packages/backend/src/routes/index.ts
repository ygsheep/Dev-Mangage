import { Express } from 'express'
import { config } from '../config'
import { API_ENDPOINTS } from '../config/api-endpoints'
import { projectsRouter } from './projects'
import { apisRouter } from './apis'
import { tagsRouter } from './tags'
import { swaggerRouter } from './swagger'
import { debugRouter } from './debug'
import { mcpRouter, setupIntegratedMCPRoutes } from './mcp'
import { dataModelsRouter } from './dataModels'
import { mindmapRouter } from './mindmap'
import fieldEnumValuesRouter from './fieldEnumValues'
import tableRelationshipsRouter from './tableRelationships'
import modelVersionsRouter from './modelVersions'
import tableStatisticsRouter from './tableStatistics'
import aiRouter from './ai'
import collaborationRouter from './collaboration'
import permissionsRouter from './permissions'
import { featuresRouter } from './features'
import apiManagementRouter from './apiManagement'
import dashboardRouter from './dashboard'

export const setupRoutes = (app: Express): void => {
  const apiPrefix = config.apiPrefix

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      environment: config.nodeEnv,
    })
  })

  // API routes - 使用统一配置的端点
  app.use(API_ENDPOINTS.PROJECTS.BASE, projectsRouter)
  app.use(API_ENDPOINTS.APIS.BASE, apisRouter)  
  app.use(API_ENDPOINTS.TAGS.BASE, tagsRouter)
  app.use(API_ENDPOINTS.DATA_MODELS.BASE, dataModelsRouter)
  app.use(API_ENDPOINTS.MINDMAP.BASE, mindmapRouter)
  app.use(API_ENDPOINTS.SWAGGER.BASE, swaggerRouter)
  app.use(API_ENDPOINTS.DEBUG.BASE, debugRouter)
  app.use(API_ENDPOINTS.MCP.BASE, mcpRouter)
  
  // 新增的数据模型相关API
  app.use(`${apiPrefix}/field-enum-values`, fieldEnumValuesRouter)
  app.use(`${apiPrefix}/table-relationships`, tableRelationshipsRouter)
  app.use(`${apiPrefix}/model-versions`, modelVersionsRouter)
  app.use(`${apiPrefix}/table-statistics`, tableStatisticsRouter)
  
  // AI服务相关API
  app.use(`${apiPrefix}/ai`, aiRouter)
  
  // 协作和权限管理API
  app.use(`${apiPrefix}/collaboration`, collaborationRouter)
  app.use(`${apiPrefix}/permissions`, permissionsRouter)
  
  // 功能模块管理API
  app.use(`${apiPrefix}/features`, featuresRouter)
  
  // API接口管理相关API
  app.use(`${apiPrefix}/api-management`, apiManagementRouter)
  
  // 仪表板统计API
  app.use(`${apiPrefix}/dashboard`, dashboardRouter)
  
  // 集成HTTP MCP服务路由
  setupIntegratedMCPRoutes(app)
  
  // 处理错误的MCP路径（临时修复）
  app.use(API_ENDPOINTS.MCP.LEGACY, mcpRouter)
  
  // 添加直接访问 /mcp 的重定向
  app.get('/mcp', (req, res) => {
    res.redirect(301, '/api/v1/mcp/status')
  })
  
  app.use('/mcp', (req, res) => {
    res.redirect(301, `/api/v1/mcp${req.path === '/mcp' ? '/status' : req.path}`)
  })

  // API documentation - 使用统一配置
  app.get(`${apiPrefix}`, (req, res) => {
    res.json({
      name: 'DevAPI Manager API',
      version: '2.0.0',
      description: 'API聚合和项目管理后端服务',
      endpoints: {
        projects: API_ENDPOINTS.PROJECTS.BASE,
        apis: API_ENDPOINTS.APIS.BASE,
        tags: API_ENDPOINTS.TAGS.BASE,
        dataModels: API_ENDPOINTS.DATA_MODELS.BASE,
        mindmap: API_ENDPOINTS.MINDMAP.BASE,
        swagger: API_ENDPOINTS.SWAGGER.BASE,
        debug: API_ENDPOINTS.DEBUG.BASE,
        mcp: API_ENDPOINTS.MCP.BASE,
        fieldEnumValues: `${apiPrefix}/field-enum-values`,
        tableRelationships: `${apiPrefix}/table-relationships`,
        modelVersions: `${apiPrefix}/model-versions`,
        tableStatistics: `${apiPrefix}/table-statistics`,
        ai: `${apiPrefix}/ai`,
        collaboration: `${apiPrefix}/collaboration`,
        permissions: `${apiPrefix}/permissions`,
        features: `${apiPrefix}/features`,
        apiManagement: `${apiPrefix}/api-management`,
        dashboard: `${apiPrefix}/dashboard`,
      },
      documentation: 'https://github.com/devapi-team/devapi-manager',
    })
  })
}