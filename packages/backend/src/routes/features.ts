import { Router } from 'express'
import { validateRequest } from '../middleware/validation'
import { body, param, query } from 'express-validator'

const router = Router()

/**
 * 获取项目功能模块
 */
router.get('/:projectId/modules', [
  param('projectId').isUUID().withMessage('项目ID必须是有效的UUID'),
  query('status').optional().isIn(['planned', 'in-progress', 'completed']).withMessage('状态值无效'),
  query('search').optional().isString().withMessage('搜索关键词必须是字符串'),
  validateRequest
], async (req, res, next) => {
  try {
    const { projectId } = req.params
    const { status, search } = req.query

    // 模拟功能模块数据 - 基于真实项目需求
    const allModules = [
      {
        id: 'user-management',
        projectId,
        name: '用户管理',
        description: '用户注册、登录、密码重置、用户信息管理等基础认证功能',
        status: 'completed',
        tags: ['JWT认证', '邮箱验证', '密码加密'],
        category: '用户系统',
        apis: [
          {
            id: 'user-register',
            name: '用户注册',
            method: 'POST',
            path: '/api/v1/auth/register',
            description: '用户注册接口'
          },
          {
            id: 'user-login',
            name: '用户登录',
            method: 'POST',
            path: '/api/v1/auth/login',
            description: '用户登录接口'
          },
          {
            id: 'user-profile',
            name: '获取用户信息',
            method: 'GET',
            path: '/api/v1/users/profile',
            description: '获取当前用户信息'
          },
          {
            id: 'user-update',
            name: '更新用户信息',
            method: 'PUT',
            path: '/api/v1/users/profile',
            description: '更新用户基本信息'
          }
        ],
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'permission-management',
        projectId,
        name: '权限管理',
        description: '基于角色的权限控制(RBAC)、菜单权限、数据权限、API权限管理',
        status: 'in-progress',
        tags: ['RBAC', '菜单控制', '数据权限'],
        category: '权限系统',
        apis: [
          {
            id: 'role-list',
            name: '获取角色列表',
            method: 'GET',
            path: '/api/v1/roles',
            description: '获取系统角色列表'
          },
          {
            id: 'permission-check',
            name: '权限检查',
            method: 'POST',
            path: '/api/v1/permissions/check',
            description: '检查用户是否有指定权限'
          },
          {
            id: 'user-roles',
            name: '用户角色管理',
            method: 'PUT',
            path: '/api/v1/users/{id}/roles',
            description: '分配用户角色'
          }
        ],
        createdAt: new Date('2024-01-15').toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'file-management',
        projectId,
        name: '文件管理',
        description: '文件上传、下载、预览、存储管理、缩略图生成等文件操作功能',
        status: 'planned',
        tags: ['OSS存储', '缩略图', '文件预览'],
        category: '文件系统',
        apis: [
          {
            id: 'file-upload',
            name: '文件上传',
            method: 'POST',
            path: '/api/v1/files/upload',
            description: '单文件或多文件上传'
          },
          {
            id: 'file-download',
            name: '文件下载',
            method: 'GET',
            path: '/api/v1/files/{id}/download',
            description: '文件下载接口'
          },
          {
            id: 'file-list',
            name: '文件列表',
            method: 'GET',
            path: '/api/v1/files',
            description: '获取文件列表'
          }
        ],
        createdAt: new Date('2024-02-01').toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'notification-system',
        projectId,
        name: '消息通知',
        description: '系统消息、邮件通知、短信通知、推送通知等消息管理功能',
        status: 'planned',
        tags: ['邮件通知', '短信', '推送'],
        category: '消息系统',
        apis: [
          {
            id: 'send-notification',
            name: '发送通知',
            method: 'POST',
            path: '/api/v1/notifications/send',
            description: '发送系统通知'
          },
          {
            id: 'notification-list',
            name: '通知列表',
            method: 'GET',
            path: '/api/v1/notifications',
            description: '获取用户通知列表'
          }
        ],
        createdAt: new Date('2024-02-15').toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'data-export',
        projectId,
        name: '数据导出',
        description: 'Excel导出、PDF报告、数据备份、批量导出等数据导出功能',
        status: 'completed',
        tags: ['Excel导出', 'PDF生成', '数据备份'],
        category: '数据系统',
        apis: [
          {
            id: 'export-excel',
            name: 'Excel导出',
            method: 'POST',
            path: '/api/v1/export/excel',
            description: '导出Excel文件'
          },
          {
            id: 'export-pdf',
            name: 'PDF导出',
            method: 'POST',
            path: '/api/v1/export/pdf',
            description: '导出PDF报告'
          }
        ],
        createdAt: new Date('2024-01-20').toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]

    // 应用筛选条件
    let filteredModules = allModules

    if (status) {
      filteredModules = filteredModules.filter(module => module.status === status)
    }

    if (search) {
      const searchLower = search.toString().toLowerCase()
      filteredModules = filteredModules.filter(module => 
        module.name.toLowerCase().includes(searchLower) ||
        module.description.toLowerCase().includes(searchLower) ||
        module.tags.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }

    res.json({
      success: true,
      data: {
        modules: filteredModules,
        total: filteredModules.length,
        summary: {
          planned: allModules.filter(m => m.status === 'planned').length,
          inProgress: allModules.filter(m => m.status === 'in-progress').length,
          completed: allModules.filter(m => m.status === 'completed').length
        }
      },
      message: '功能模块获取成功'
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 获取功能模块详情
 */
router.get('/:projectId/modules/:moduleId', [
  param('projectId').isUUID().withMessage('项目ID必须是有效的UUID'),
  param('moduleId').isString().withMessage('模块ID必须是字符串'),
  validateRequest
], async (req, res, next) => {
  try {
    const { projectId, moduleId } = req.params

    // 模拟单个功能模块详情数据
    const moduleDetails = {
      id: moduleId,
      projectId,
      name: '用户管理',
      description: '用户注册、登录、密码重置、用户信息管理等基础认证功能',
      status: 'completed',
      tags: ['JWT认证', '邮箱验证', '密码加密'],
      category: '用户系统',
      progress: 85,
      apis: [
        {
          id: 'user-register',
          name: '用户注册',
          method: 'POST',
          path: '/api/v1/auth/register',
          description: '用户注册接口',
          status: 'completed',
          requestBody: {
            username: 'string',
            email: 'string',
            password: 'string'
          },
          responseBody: {
            id: 'string',
            username: 'string',
            email: 'string',
            token: 'string'
          }
        }
      ],
      dependencies: ['数据库连接', '邮件服务'],
      techStack: ['Node.js', 'Express', 'JWT', 'bcrypt'],
      createdAt: new Date('2024-01-01').toISOString(),
      updatedAt: new Date().toISOString()
    }

    res.json({
      success: true,
      data: moduleDetails,
      message: '功能模块详情获取成功'
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 创建功能模块
 */
router.post('/:projectId/modules', [
  param('projectId').isUUID().withMessage('项目ID必须是有效的UUID'),
  body('name').isString().isLength({ min: 1, max: 100 }).withMessage('模块名称长度必须在1-100之间'),
  body('description').optional().isString().isLength({ max: 500 }).withMessage('描述长度不能超过500字符'),
  body('category').optional().isString().withMessage('分类必须是字符串'),
  body('tags').optional().isArray().withMessage('标签必须是数组'),
  validateRequest
], async (req, res, next) => {
  try {
    const { projectId } = req.params
    const { name, description, category, tags } = req.body

    const newModule = {
      id: `module-${Date.now()}`,
      projectId,
      name,
      description: description || '',
      category: category || '通用',
      tags: tags || [],
      status: 'planned',
      apis: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    res.status(201).json({
      success: true,
      data: newModule,
      message: '功能模块创建成功'
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 更新功能模块
 */
router.put('/:projectId/modules/:moduleId', [
  param('projectId').isUUID().withMessage('项目ID必须是有效的UUID'),
  param('moduleId').isString().withMessage('模块ID必须是字符串'),
  body('name').optional().isString().isLength({ min: 1, max: 100 }).withMessage('模块名称长度必须在1-100之间'),
  body('description').optional().isString().isLength({ max: 500 }).withMessage('描述长度不能超过500字符'),
  body('status').optional().isIn(['planned', 'in-progress', 'completed']).withMessage('状态值无效'),
  validateRequest
], async (req, res, next) => {
  try {
    const { projectId, moduleId } = req.params
    const updateData = req.body

    const updatedModule = {
      id: moduleId,
      projectId,
      ...updateData,
      updatedAt: new Date().toISOString()
    }

    res.json({
      success: true,
      data: updatedModule,
      message: '功能模块更新成功'
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 删除功能模块
 */
router.delete('/:projectId/modules/:moduleId', [
  param('projectId').isUUID().withMessage('项目ID必须是有效的UUID'),
  param('moduleId').isString().withMessage('模块ID必须是字符串'),
  validateRequest
], async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: '功能模块删除成功'
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 获取功能模块统计信息
 */
router.get('/:projectId/modules/stats', [
  param('projectId').isUUID().withMessage('项目ID必须是有效的UUID'),
  validateRequest
], async (req, res, next) => {
  try {
    const stats = {
      totalModules: 5,
      completedModules: 2,
      inProgressModules: 1,
      plannedModules: 2,
      totalApis: 12,
      completionRate: 40,
      categories: {
        '用户系统': 2,
        '权限系统': 1,
        '文件系统': 1,
        '消息系统': 1
      }
    }

    res.json({
      success: true,
      data: stats,
      message: '功能模块统计信息获取成功'
    })
  } catch (error) {
    next(error)
  }
})

export { router as featuresRouter }