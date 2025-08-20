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

    // TODO: 从数据库获取真实评论数据
    // 临时添加一些 Markdown 测试数据用于演示
    const comments = [
      {
        id: 'comment-1',
        content: `## 代码审查反馈

这个字段的命名需要更加规范，建议使用驼峰命名法。

### 建议修改
- 将 \`user_name\` 改为 \`userName\`
- 将 \`create_time\` 改为 \`createTime\`

**示例代码：**
\`\`\`typescript
interface User {
  userName: string;  // ✅ 推荐
  createTime: Date;  // ✅ 推荐
}
\`\`\`

> 💡 **提示**: 遵循一致的命名规范有助于提高代码可读性`,
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
        isResolved: false
      },
      {
        id: 'comment-2',
        content: `## 性能优化建议

添加索引时需要考虑查询性能的影响，建议先测试一下。

### 测试计划
1. **基准测试**: 记录当前查询性能
2. **索引创建**: 添加复合索引
3. **性能对比**: 测试优化效果

#### 建议的索引策略
- [ ] 为 \`user_id\` 和 \`status\` 创建复合索引
- [ ] 监控索引使用情况
- [ ] 定期清理无用索引

\`\`\`sql
-- 推荐的索引创建语句
CREATE INDEX idx_user_status ON user_actions(user_id, status, created_at);
\`\`\`

**参考文档**: [数据库索引最佳实践](https://example.com/db-index-best-practices)`,
        authorId: 'user-2',
        authorName: '李四',
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
        updatedAt: new Date(Date.now() - 30 * 60 * 1000),
        target: {
          type: targetType || 'table',
          id: targetId || 'general',
          name: '目标对象'
        },
        isResolved: false
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
        comments: comments,
        total: comments.length,
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