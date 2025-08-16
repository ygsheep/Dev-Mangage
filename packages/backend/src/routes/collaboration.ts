import express from 'express'
import { body, param, query } from 'express-validator'
import { validateRequest } from '../middleware/validation'
import { AppError } from '../middleware/errorHandler'
import logger from '../utils/logger'

const router = express.Router()

/**
 * 协作相关路由 - 评论和讨论管理
 */

// 获取目标对象的评论列表
router.get('/:projectId/comments', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  query('targetType').optional().isIn(['table', 'field', 'index', 'relationship', 'project']).withMessage('目标类型无效'),
  query('targetId').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('限制数量必须在1-100之间'),
  query('offset').optional().isInt({ min: 0 }).withMessage('偏移量必须大于等于0'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId } = req.params
    const { targetType, targetId, limit = 20, offset = 0 } = req.query

    // 模拟评论数据 - 在实际项目中这里会从数据库获取
    const mockComments = [
      {
        id: 'comment-1',
        content: '这个字段的命名需要更加规范，建议使用驼峰命名法。',
        authorId: 'user-1',
        authorName: '张三',
        authorAvatar: '',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        target: {
          type: targetType || 'table',
          id: targetId || 'general',
          name: '目标对象'
        },
        isResolved: false,
        replies: [
          {
            id: 'comment-2',
            content: '同意，我来修改一下字段名称。',
            authorId: 'current-user',
            authorName: '当前用户',
            createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
            parentId: 'comment-1',
            target: {
              type: targetType || 'table',
              id: targetId || 'general',
              name: '目标对象'
            }
          }
        ]
      },
      {
        id: 'comment-3',
        content: '添加索引时需要考虑查询性能的影响，建议先测试一下。',
        authorId: 'user-2',
        authorName: '李四',
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
        updatedAt: new Date(Date.now() - 30 * 60 * 1000),
        target: {
          type: targetType || 'table',
          id: targetId || 'general',
          name: '目标对象'
        },
        isResolved: true
      }
    ]

    logger.info('获取评论列表', { 
      projectId, 
      targetType, 
      targetId, 
      limit, 
      offset 
    })

    res.json({
      success: true,
      data: {
        comments: mockComments,
        total: mockComments.length,
        hasMore: false
      }
    })
  } catch (error) {
    next(new AppError('获取评论列表失败: ' + error.message, 500))
  }
})

// 创建新评论
router.post('/:projectId/comments', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  body('content').isString().notEmpty().withMessage('评论内容不能为空'),
  body('targetType').isIn(['table', 'field', 'index', 'relationship', 'project']).withMessage('目标类型无效'),
  body('targetId').isString().notEmpty().withMessage('目标ID不能为空'),
  body('targetName').isString().notEmpty().withMessage('目标名称不能为空'),
  body('parentId').optional().isString(),
  body('mentions').optional().isArray(),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId } = req.params
    const { content, targetType, targetId, targetName, parentId, mentions = [] } = req.body

    // 模拟创建评论
    const newComment = {
      id: `comment-${Date.now()}`,
      content: content.trim(),
      authorId: 'current-user',
      authorName: '当前用户',
      createdAt: new Date(),
      updatedAt: new Date(),
      parentId,
      target: {
        type: targetType,
        id: targetId,
        name: targetName
      },
      mentions,
      isResolved: false
    }

    logger.info('创建新评论', { 
      projectId, 
      commentId: newComment.id,
      targetType,
      targetId,
      hasParent: !!parentId
    })

    res.json({
      success: true,
      data: newComment,
      message: '评论创建成功'
    })
  } catch (error) {
    next(new AppError('创建评论失败: ' + error.message, 500))
  }
})

// 更新评论
router.put('/:projectId/comments/:commentId', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  param('commentId').isString().notEmpty().withMessage('评论ID不能为空'),
  body('content').isString().notEmpty().withMessage('评论内容不能为空'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId, commentId } = req.params
    const { content } = req.body

    logger.info('更新评论', { 
      projectId, 
      commentId,
      contentLength: content.length
    })

    res.json({
      success: true,
      message: '评论更新成功'
    })
  } catch (error) {
    next(new AppError('更新评论失败: ' + error.message, 500))
  }
})

// 删除评论
router.delete('/:projectId/comments/:commentId', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  param('commentId').isString().notEmpty().withMessage('评论ID不能为空'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId, commentId } = req.params

    logger.info('删除评论', { 
      projectId, 
      commentId
    })

    res.json({
      success: true,
      message: '评论删除成功'
    })
  } catch (error) {
    next(new AppError('删除评论失败: ' + error.message, 500))
  }
})

// 解决/重新打开评论
router.patch('/:projectId/comments/:commentId/resolve', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  param('commentId').isString().notEmpty().withMessage('评论ID不能为空'),
  body('isResolved').isBoolean().withMessage('解决状态必须是布尔值'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId, commentId } = req.params
    const { isResolved } = req.body

    logger.info('更新评论解决状态', { 
      projectId, 
      commentId,
      isResolved
    })

    res.json({
      success: true,
      message: isResolved ? '评论已标记为已解决' : '评论已重新打开'
    })
  } catch (error) {
    next(new AppError('更新评论状态失败: ' + error.message, 500))
  }
})

// 获取评论统计信息
router.get('/:projectId/comments/stats', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId } = req.params

    // 模拟统计数据
    const stats = {
      total: 15,
      resolved: 8,
      unresolved: 7,
      byTarget: {
        table: 10,
        field: 3,
        index: 1,
        relationship: 1
      },
      recentActivity: {
        today: 3,
        thisWeek: 8,
        thisMonth: 15
      }
    }

    logger.info('获取评论统计', { 
      projectId,
      stats
    })

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    next(new AppError('获取评论统计失败: ' + error.message, 500))
  }
})

export default router