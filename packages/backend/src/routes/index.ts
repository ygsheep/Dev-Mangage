import { Express } from 'express'
import { config } from '../config'
import { projectsRouter } from './projects'
import { apisRouter } from './apis'
import { tagsRouter } from './tags'
import { swaggerRouter } from './swagger'
import { debugRouter } from './debug'
import { mcpRouter } from './mcp'

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

  // API routes
  app.use(`${apiPrefix}/projects`, projectsRouter)
  app.use(`${apiPrefix}/apis`, apisRouter)  
  app.use(`${apiPrefix}/tags`, tagsRouter)
  app.use(`${apiPrefix}/swagger`, swaggerRouter)
  app.use(`${apiPrefix}/debug`, debugRouter)
  app.use(`${apiPrefix}/mcp`, mcpRouter)

  // API documentation
  app.get(`${apiPrefix}`, (req, res) => {
    res.json({
      name: 'DevAPI Manager API',
      version: '2.0.0',
      description: 'API聚合和项目管理后端服务',
      endpoints: {
        projects: `${apiPrefix}/projects`,
        apis: `${apiPrefix}/apis`,
        tags: `${apiPrefix}/tags`,
        swagger: `${apiPrefix}/swagger`,
        debug: `${apiPrefix}/debug`,
        mcp: `${apiPrefix}/mcp`,
      },
      documentation: 'https://github.com/devapi-team/devapi-manager',
    })
  })
}