import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// 获取仪表板统计数据
router.get('/stats', async (req, res, next) => {
  try {
    const { projectId } = req.query;

    logger.info('获取仪表板统计数据', { projectId });

    // 如果指定了项目ID，返回项目级别的统计
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId as string },
        include: {
          apis: {
            include: {
              apiTags: {
                include: {
                  tag: true
                }
              }
            }
          },
          tags: true,
          databaseTables: {
            include: {
              fields: true,
              indexes: true
            }
          }
        }
      });

      if (!project) {
        throw new AppError('项目不存在', 404);
      }

      // API状态分布
      const apiStatusStats = project.apis.reduce((acc: any, api) => {
        acc[api.status] = (acc[api.status] || 0) + 1;
        return acc;
      }, {});

      // HTTP方法分布
      const methodStats = project.apis.reduce((acc: any, api) => {
        acc[api.method] = (acc[api.method] || 0) + 1;
        return acc;
      }, {});

      // 标签使用统计
      const tagStats = project.apis.flatMap(api => 
        api.apiTags.map(at => at.tag.name)
      ).reduce((acc: any, tagName) => {
        acc[tagName] = (acc[tagName] || 0) + 1;
        return acc;
      }, {});

      // 数据表统计
      const tableStats = {
        totalTables: project.databaseTables.length,
        totalFields: project.databaseTables.reduce((sum, table) => sum + table.fields.length, 0),
        totalIndexes: project.databaseTables.reduce((sum, table) => sum + table.indexes.length, 0),
        avgFieldsPerTable: project.databaseTables.length > 0 
          ? Math.round(project.databaseTables.reduce((sum, table) => sum + table.fields.length, 0) / project.databaseTables.length * 10) / 10
          : 0
      };

      const projectStats = {
        overview: {
          totalApis: project.apis.length,
          totalTags: project.tags.length,
          totalTables: project.databaseTables.length,
          lastUpdated: project.updatedAt
        },
        apiStats: {
          statusDistribution: Object.entries(apiStatusStats).map(([status, count]) => ({
            name: status,
            value: count,
            color: getStatusColor(status)
          })),
          methodDistribution: Object.entries(methodStats).map(([method, count]) => ({
            name: method,
            value: count,
            color: getMethodColor(method)
          }))
        },
        tagStats: Object.entries(tagStats).map(([name, count]) => ({
          name,
          value: count
        })).sort((a: any, b: any) => b.value - a.value).slice(0, 10),
        tableStats,
        trends: await getProjectTrends(projectId as string)
      };

      res.json(projectStats);
    } else {
      // 全局统计
      const [totalProjects, totalApis, totalTags, totalTables] = await Promise.all([
        prisma.project.count(),
        prisma.aPI.count(),
        prisma.tag.count(),
        prisma.databaseTable.count()
      ]);

      // 获取最近活跃的项目
      const recentProjects = await prisma.project.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: {
          _count: {
            select: {
              apis: true,
              tags: true,
              databaseTables: true
            }
          }
        }
      });

      // 获取全局API状态分布
      const allApis = await prisma.aPI.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      });

      const globalStats = {
        overview: {
          totalProjects,
          totalApis,
          totalTags,
          totalTables
        },
        recentProjects: recentProjects.map(project => ({
          id: project.id,
          name: project.name,
          description: project.description,
          updatedAt: project.updatedAt,
          stats: {
            apis: project._count.apis,
            tags: project._count.tags,
            tables: project._count.databaseTables
          }
        })),
        globalApiStats: allApis.map(item => ({
          name: item.status,
          value: item._count.status,
          color: getStatusColor(item.status)
        })),
        trends: await getGlobalTrends()
      };

      res.json(globalStats);
    }
  } catch (error) {
    next(error);
  }
});

// 获取使用情况分析数据
router.get('/analytics', async (req, res, next) => {
  try {
    const { projectId, timeRange = '7d' } = req.query;

    logger.info('获取使用情况分析数据', { projectId, timeRange });

    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '1d':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    // 这里可以扩展为真实的使用情况数据
    // 现在先返回模拟数据
    const analytics = {
      timeRange,
      period: { start: startDate, end: endDate },
      activities: generateMockActivityData(startDate, endDate),
      popularApis: await getPopularApis(projectId as string),
      userEngagement: generateMockEngagementData()
    };

    res.json(analytics);
  } catch (error) {
    next(error);
  }
});

// 辅助函数：获取状态颜色
function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'active': '#10b981',
    'inactive': '#6b7280',
    'deprecated': '#f59e0b',
    'draft': '#3b82f6'
  };
  return colors[status] || '#6b7280';
}

// 辅助函数：获取HTTP方法颜色
function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    'GET': '#10b981',
    'POST': '#3b82f6', 
    'PUT': '#f59e0b',
    'DELETE': '#ef4444',
    'PATCH': '#8b5cf6'
  };
  return colors[method] || '#6b7280';
}

// 获取项目趋势数据
async function getProjectTrends(projectId: string) {
  // 这里可以实现真实的趋势分析
  // 现在返回模拟数据
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return {
      date: date.toISOString().split('T')[0],
      apis: Math.floor(Math.random() * 5) + 1,
      tags: Math.floor(Math.random() * 3),
      tables: Math.floor(Math.random() * 2)
    };
  }).reverse();

  return last7Days;
}

// 获取全局趋势数据
async function getGlobalTrends() {
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return {
      date: date.toISOString().split('T')[0],
      projects: Math.floor(Math.random() * 3),
      apis: Math.floor(Math.random() * 15) + 5,
      activeUsers: Math.floor(Math.random() * 10) + 5
    };
  }).reverse();

  return last30Days;
}

// 生成模拟活动数据
function generateMockActivityData(startDate: Date, endDate: Date) {
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    return {
      date: date.toISOString().split('T')[0],
      views: Math.floor(Math.random() * 100) + 20,
      edits: Math.floor(Math.random() * 30) + 5,
      imports: Math.floor(Math.random() * 10) + 1
    };
  });
}

// 获取热门API
async function getPopularApis(projectId?: string) {
  const whereClause = projectId ? { projectId } : {};
  
  const apis = await prisma.aPI.findMany({
    where: whereClause,
    include: {
      project: {
        select: {
          name: true
        }
      },
      apiTags: {
        include: {
          tag: true
        }
      }
    },
    take: 10,
    orderBy: {
      createdAt: 'desc'
    }
  });

  return apis.map(api => ({
    id: api.id,
    name: api.name,
    method: api.method,
    path: api.path,
    project: api.project.name,
    tags: api.apiTags.map(at => at.tag.name),
    // 模拟使用次数
    usageCount: Math.floor(Math.random() * 1000) + 100
  }));
}

// 生成模拟用户参与度数据
function generateMockEngagementData() {
  return {
    dailyActiveUsers: Math.floor(Math.random() * 50) + 10,
    weeklyActiveUsers: Math.floor(Math.random() * 200) + 50,
    monthlyActiveUsers: Math.floor(Math.random() * 500) + 100,
    averageSessionDuration: Math.floor(Math.random() * 30) + 15, // 分钟
    bounceRate: (Math.random() * 0.3 + 0.1).toFixed(2) // 10%-40%
  };
}

export default router;