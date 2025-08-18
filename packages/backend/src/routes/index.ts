/**
 * 路由配置主模块
 * 负责注册和配置所有API路由，提供统一的路由管理和API文档访问入口
 * 包含项目管理、API管理、数据模型、AI服务等核心功能模块的路由映射
 */

import { Express } from 'express'
import { config } from '../config'
import { API_ENDPOINTS } from '../config/api-endpoints'

// 核心业务模块路由
import { projectsRouter } from './projects'
import { apisRouter } from './apis'
import { tagsRouter } from './tags'
import { swaggerRouter } from './swagger'
import { debugRouter } from './debug'
import { mcpRouter, setupIntegratedMCPRoutes } from './mcp'

// 数据模型相关路由
import { dataModelsRouter } from './dataModels'
import { mindmapRouter } from './mindmap'
import fieldEnumValuesRouter from './fieldEnumValues'
import tableRelationshipsRouter from './tableRelationships'
import modelVersionsRouter from './modelVersions'
import tableStatisticsRouter from './tableStatistics'

// AI和协作功能路由
import aiRouter from './ai'
import collaborationRouter from './collaboration'
import permissionsRouter from './permissions'
import { featuresRouter } from './features'
import apiManagementRouter from './apiManagement'
import dashboardRouter from './dashboard'

// GitHub Issues 相关路由
import issuesRouter from './issues'
import issueRelationsRouter from './issueRelations'
import githubRouter from './github'

/**
 * 设置所有API路由的主函数
 * 按功能模块组织路由，包括健康检查、业务模块、MCP服务等
 * @param app - Express应用实例
 */
export const setupRoutes = (app: Express): void => {
  const apiPrefix = config.apiPrefix

  // 健康检查端点 - 用于监控服务状态
  app.get('/health', (req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      environment: config.nodeEnv,
    })
  })

  // 核心业务模块API路由 - 使用统一配置的端点
  app.use(API_ENDPOINTS.PROJECTS.BASE, projectsRouter)       // 项目管理
  app.use(API_ENDPOINTS.APIS.BASE, apisRouter)               // API接口管理 
  app.use(API_ENDPOINTS.TAGS.BASE, tagsRouter)               // 标签管理
  app.use(API_ENDPOINTS.DATA_MODELS.BASE, dataModelsRouter)  // 数据模型管理
  app.use(API_ENDPOINTS.MINDMAP.BASE, mindmapRouter)         // 思维导图
  app.use(API_ENDPOINTS.SWAGGER.BASE, swaggerRouter)         // Swagger文档
  app.use(API_ENDPOINTS.DEBUG.BASE, debugRouter)             // 调试工具
  app.use(API_ENDPOINTS.MCP.BASE, mcpRouter)                 // MCP协议服务
  
  // 数据模型扩展功能API
  app.use(`${apiPrefix}/field-enum-values`, fieldEnumValuesRouter)      // 字段枚举值管理
  app.use(`${apiPrefix}/table-relationships`, tableRelationshipsRouter) // 表关系管理
  app.use(`${apiPrefix}/model-versions`, modelVersionsRouter)            // 模型版本管理
  app.use(`${apiPrefix}/table-statistics`, tableStatisticsRouter)       // 表统计信息
  
  // AI智能服务API
  app.use(`${apiPrefix}/ai`, aiRouter)                              // AI文档解析和代码生成
  
  // 协作和权限管理API
  app.use(`${apiPrefix}/collaboration`, collaborationRouter)       // 团队协作功能
  app.use(`${apiPrefix}/permissions`, permissionsRouter)           // 权限控制
  
  // 功能和管理模块API
  app.use(`${apiPrefix}/features`, featuresRouter)                 // 功能开关管理
  app.use(`${apiPrefix}/api-management`, apiManagementRouter)      // API管理工具
  app.use(`${apiPrefix}/dashboard`, dashboardRouter)               // 仪表板数据
  
  // GitHub Issues 管理API
  app.use(`${apiPrefix}`, issuesRouter)                           // Issue 管理
  app.use(`${apiPrefix}`, issueRelationsRouter)                   // Issue 关联管理
  app.use(`${apiPrefix}`, githubRouter)                           // GitHub 集成管理
  
  // MCP (Model Context Protocol) 服务集成
  setupIntegratedMCPRoutes(app)  // 设置集成的HTTP MCP服务路由
  
  // MCP服务兼容性处理
  app.use(API_ENDPOINTS.MCP.LEGACY, mcpRouter)  // 处理旧版MCP路径
  
  // MCP服务访问重定向 - 提供更友好的访问方式
  app.get('/mcp', (req, res) => {
    res.redirect(301, '/api/v1/mcp/status')
  })
  
  app.use('/mcp', (req, res) => {
    res.redirect(301, `/api/v1/mcp${req.path === '/mcp' ? '/status' : req.path}`)
  })

  // API文档和服务信息端点 - 提供完整的API概览
  app.get(`${apiPrefix}`, (req, res) => {
    res.json({
      name: 'DevAPI Manager API',
      version: '2.0.0',
      description: 'API聚合和项目管理后端服务',
      endpoints: {
        // 核心业务模块
        projects: API_ENDPOINTS.PROJECTS.BASE,
        apis: API_ENDPOINTS.APIS.BASE,
        tags: API_ENDPOINTS.TAGS.BASE,
        dataModels: API_ENDPOINTS.DATA_MODELS.BASE,
        mindmap: API_ENDPOINTS.MINDMAP.BASE,
        swagger: API_ENDPOINTS.SWAGGER.BASE,
        debug: API_ENDPOINTS.DEBUG.BASE,
        mcp: API_ENDPOINTS.MCP.BASE,
        // 数据模型扩展
        fieldEnumValues: `${apiPrefix}/field-enum-values`,
        tableRelationships: `${apiPrefix}/table-relationships`,
        modelVersions: `${apiPrefix}/model-versions`,
        tableStatistics: `${apiPrefix}/table-statistics`,
        // AI和协作功能
        ai: `${apiPrefix}/ai`,
        collaboration: `${apiPrefix}/collaboration`,
        permissions: `${apiPrefix}/permissions`,
        features: `${apiPrefix}/features`,
        apiManagement: `${apiPrefix}/api-management`,
        dashboard: `${apiPrefix}/dashboard`,
        // GitHub Issues
        issues: `${apiPrefix}/issues`,
        issueRelations: `${apiPrefix}/issue-relations`,
        github: `${apiPrefix}/github`,
      },
      documentation: 'https://github.com/devapi-team/devapi-manager',
    })
  })
}