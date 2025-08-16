import express from 'express'
import { body, param, query } from 'express-validator'
import { validateRequest } from '../middleware/validation'
import { AppError } from '../middleware/errorHandler'
import logger from '../utils/logger'

const router = express.Router()

/**
 * 权限管理相关路由 - 团队成员和权限控制
 */

// 获取项目团队成员列表
router.get('/:projectId/members', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  query('role').optional().isIn(['owner', 'admin', 'editor', 'viewer']).withMessage('角色类型无效'),
  query('status').optional().isIn(['active', 'pending', 'inactive']).withMessage('状态类型无效'),
  query('search').optional().isString(),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId } = req.params
    const { role, status, search } = req.query

    // 模拟团队成员数据
    const mockMembers = [
      {
        id: 'current-user',
        name: '当前用户',
        email: 'current@example.com',
        avatar: '',
        role: 'owner',
        joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lastActive: new Date(),
        status: 'active'
      },
      {
        id: 'user-2',
        name: '张三',
        email: 'zhangsan@example.com',
        avatar: '',
        role: 'admin',
        joinedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: 'active'
      },
      {
        id: 'user-3',
        name: '李四',
        email: 'lisi@example.com',
        avatar: '',
        role: 'editor',
        joinedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        lastActive: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: 'active'
      },
      {
        id: 'user-4',
        name: '王五',
        email: 'wangwu@example.com',
        avatar: '',
        role: 'viewer',
        joinedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        lastActive: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        status: 'active'
      },
      {
        id: 'user-5',
        name: '赵六',
        email: 'zhaoliu@example.com',
        avatar: '',
        role: 'editor',
        joinedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        lastActive: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        status: 'pending'
      }
    ]

    // 应用过滤器
    let filteredMembers = mockMembers
    
    if (role) {
      filteredMembers = filteredMembers.filter(member => member.role === role)
    }
    
    if (status) {
      filteredMembers = filteredMembers.filter(member => member.status === status)
    }
    
    if (search) {
      const searchTerm = search.toString().toLowerCase()
      filteredMembers = filteredMembers.filter(member => 
        member.name.toLowerCase().includes(searchTerm) ||
        member.email.toLowerCase().includes(searchTerm)
      )
    }

    logger.info('获取团队成员列表', { 
      projectId, 
      role, 
      status, 
      search,
      resultCount: filteredMembers.length
    })

    res.json({
      success: true,
      data: {
        members: filteredMembers,
        total: filteredMembers.length
      }
    })
  } catch (error) {
    next(new AppError('获取团队成员失败: ' + error.message, 500))
  }
})

// 邀请新成员
router.post('/:projectId/members/invite', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  body('email').isEmail().withMessage('邮箱格式无效'),
  body('role').isIn(['admin', 'editor', 'viewer']).withMessage('角色类型无效'),
  body('message').optional().isString(),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId } = req.params
    const { email, role, message = '' } = req.body

    // 模拟邀请成员
    const newMember = {
      id: `user-${Date.now()}`,
      name: email.split('@')[0],
      email,
      avatar: '',
      role,
      joinedAt: new Date(),
      lastActive: new Date(),
      status: 'pending'
    }

    logger.info('邀请新成员', { 
      projectId, 
      email,
      role,
      hasMessage: !!message
    })

    res.json({
      success: true,
      data: newMember,
      message: '邀请已发送'
    })
  } catch (error) {
    next(new AppError('邀请成员失败: ' + error.message, 500))
  }
})

// 更新成员角色
router.patch('/:projectId/members/:memberId/role', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  param('memberId').isString().notEmpty().withMessage('成员ID不能为空'),
  body('role').isIn(['admin', 'editor', 'viewer']).withMessage('角色类型无效'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId, memberId } = req.params
    const { role } = req.body

    logger.info('更新成员角色', { 
      projectId, 
      memberId,
      newRole: role
    })

    res.json({
      success: true,
      message: '成员角色更新成功'
    })
  } catch (error) {
    next(new AppError('更新成员角色失败: ' + error.message, 500))
  }
})

// 移除成员
router.delete('/:projectId/members/:memberId', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  param('memberId').isString().notEmpty().withMessage('成员ID不能为空'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId, memberId } = req.params

    logger.info('移除成员', { 
      projectId, 
      memberId
    })

    res.json({
      success: true,
      message: '成员已移除'
    })
  } catch (error) {
    next(new AppError('移除成员失败: ' + error.message, 500))
  }
})

// 获取角色和权限定义
router.get('/:projectId/roles', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId } = req.params

    // 模拟权限数据
    const mockPermissions = [
      {
        id: 'view_tables',
        name: '查看表结构',
        description: '可以查看数据表和字段信息',
        category: 'read'
      },
      {
        id: 'edit_tables',
        name: '编辑表结构',
        description: '可以创建、修改和删除数据表',
        category: 'write'
      },
      {
        id: 'manage_indexes',
        name: '管理索引',
        description: '可以创建、修改和删除索引',
        category: 'write'
      },
      {
        id: 'manage_relationships',
        name: '管理关系',
        description: '可以创建和修改表间关系',
        category: 'write'
      },
      {
        id: 'generate_sql',
        name: '生成SQL',
        description: '可以生成和导出SQL脚本',
        category: 'read'
      },
      {
        id: 'ai_features',
        name: 'AI功能',
        description: '可以使用AI解析和优化功能',
        category: 'write'
      },
      {
        id: 'manage_users',
        name: '用户管理',
        description: '可以邀请、移除和管理团队成员',
        category: 'admin'
      },
      {
        id: 'manage_permissions',
        name: '权限管理',
        description: '可以修改角色和权限设置',
        category: 'admin'
      }
    ]

    // 模拟角色数据
    const mockRoles = [
      {
        id: 'owner',
        name: '所有者',
        description: '项目拥有者，拥有所有权限',
        permissions: mockPermissions.map(p => p.id),
        isSystem: true,
        userCount: 1
      },
      {
        id: 'admin',
        name: '管理员',
        description: '项目管理员，可以管理用户和权限',
        permissions: mockPermissions.filter(p => p.category !== 'admin' || p.id === 'manage_users').map(p => p.id),
        isSystem: true,
        userCount: 2
      },
      {
        id: 'editor',
        name: '编辑者',
        description: '可以编辑数据模型和使用所有功能',
        permissions: mockPermissions.filter(p => p.category !== 'admin').map(p => p.id),
        isSystem: true,
        userCount: 5
      },
      {
        id: 'viewer',
        name: '查看者',
        description: '只能查看数据模型，不能编辑',
        permissions: mockPermissions.filter(p => p.category === 'read').map(p => p.id),
        isSystem: true,
        userCount: 3
      }
    ]

    logger.info('获取角色权限定义', { 
      projectId,
      rolesCount: mockRoles.length,
      permissionsCount: mockPermissions.length
    })

    res.json({
      success: true,
      data: {
        roles: mockRoles,
        permissions: mockPermissions
      }
    })
  } catch (error) {
    next(new AppError('获取角色权限失败: ' + error.message, 500))
  }
})

// 检查用户权限
router.get('/:projectId/permissions/check', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  query('permission').isString().notEmpty().withMessage('权限ID不能为空'),
  query('userId').optional().isString(),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId } = req.params
    const { permission, userId = 'current-user' } = req.query

    // 模拟权限检查
    const hasPermission = true // 在实际项目中这里会进行真实的权限检查

    logger.info('检查用户权限', { 
      projectId, 
      userId,
      permission,
      result: hasPermission
    })

    res.json({
      success: true,
      data: {
        userId,
        permission,
        hasPermission
      }
    })
  } catch (error) {
    next(new AppError('权限检查失败: ' + error.message, 500))
  }
})

// 获取项目权限统计
router.get('/:projectId/permissions/stats', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId } = req.params

    // 模拟统计数据
    const stats = {
      totalMembers: 5,
      activeMembers: 4,
      pendingInvitations: 1,
      roleDistribution: {
        owner: 1,
        admin: 1,
        editor: 2,
        viewer: 1
      },
      recentActivity: {
        invitations: 2,
        roleChanges: 1,
        removals: 0
      }
    }

    logger.info('获取权限统计', { 
      projectId,
      stats
    })

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    next(new AppError('获取权限统计失败: ' + error.message, 500))
  }
})

export default router