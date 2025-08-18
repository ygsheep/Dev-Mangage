import express from 'express'
import { body, param, query } from 'express-validator'
import { validateRequest } from '../middleware/validation'
import { AppError } from '../middleware/errorHandler'
import { prisma } from '../lib/prisma'
import logger from '../utils/logger'
import { GitHubService } from '../services/github/GitHubService'
import { GitHubSyncService } from '../services/github/GitHubSyncService'

const router = express.Router()

/**
 * GitHub 集成管理路由
 * 处理 GitHub 仓库配置、同步设置、Issues 同步等功能
 */

// 获取项目的 GitHub 仓库配置
router.get('/:projectId/github/repository', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId } = req.params

    // 验证项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return next(new AppError('项目不存在', 404))
    }

    const repository = await prisma.gitHubRepository.findUnique({
      where: { projectId },
      select: {
        id: true,
        owner: true,
        name: true,
        fullName: true,
        description: true,
        language: true,
        defaultBranch: true,
        isPrivate: true,
        isActive: true,
        autoSync: true,
        syncInterval: true,
        lastSyncAt: true,
        htmlUrl: true,
        createdAt: true,
        updatedAt: true
        // 注意：不返回 accessToken 等敏感信息
      }
    })

    logger.info('获取GitHub仓库配置', { projectId, hasRepository: !!repository })

    res.json({
      success: true,
      data: repository
    })
  } catch (error) {
    next(new AppError('获取GitHub仓库配置失败: ' + error.message, 500))
  }
})

// 配置 GitHub 仓库
router.post('/:projectId/github/repository', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  body('owner').isString().notEmpty().withMessage('仓库所有者不能为空'),
  body('name').isString().notEmpty().withMessage('仓库名称不能为空'),
  body('accessToken').isString().notEmpty().withMessage('访问令牌不能为空'),
  body('autoSync').optional().isBoolean().withMessage('自动同步必须是布尔值'),
  body('syncInterval').optional().isInt({ min: 60, max: 86400 }).withMessage('同步间隔必须在60-86400秒之间'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId } = req.params
    const {
      owner,
      name,
      accessToken,
      autoSync = true,
      syncInterval = 300
    } = req.body

    // 验证项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return next(new AppError('项目不存在', 404))
    }

    // 验证 GitHub 访问权限
    const githubService = new GitHubService(accessToken, owner, name)
    const validation = await githubService.validateAccess()

    if (!validation.valid) {
      return next(new AppError(`GitHub访问验证失败: ${validation.error}`, 400))
    }

    const repositoryData = validation.repository!

    // 检查是否已存在配置
    const existingRepository = await prisma.gitHubRepository.findUnique({
      where: { projectId }
    })

    const repoConfig = {
      projectId,
      owner,
      name,
      fullName: repositoryData.full_name,
      accessToken, // 在生产环境中应该加密存储
      autoSync,
      syncInterval,
      githubId: repositoryData.id,
      nodeId: repositoryData.node_id,
      htmlUrl: repositoryData.html_url,
      apiUrl: repositoryData.url,
      description: repositoryData.description,
      language: repositoryData.language,
      defaultBranch: repositoryData.default_branch,
      isPrivate: repositoryData.private,
      isActive: true
    }

    let repository
    if (existingRepository) {
      // 更新现有配置
      repository = await prisma.gitHubRepository.update({
        where: { projectId },
        data: repoConfig
      })
    } else {
      // 创建新配置
      repository = await prisma.gitHubRepository.create({
        data: repoConfig
      })
    }

    // 不返回敏感信息
    const { accessToken: _, ...safeRepository } = repository

    logger.info('配置GitHub仓库', {
      projectId,
      owner,
      name,
      isUpdate: !!existingRepository
    })

    res.json({
      success: true,
      data: safeRepository,
      message: existingRepository ? 'GitHub仓库配置更新成功' : 'GitHub仓库配置创建成功'
    })
  } catch (error) {
    next(new AppError('配置GitHub仓库失败: ' + error.message, 500))
  }
})

// 验证 GitHub 仓库访问权限
router.post('/:projectId/github/repository/validate', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  body('owner').isString().notEmpty().withMessage('仓库所有者不能为空'),
  body('name').isString().notEmpty().withMessage('仓库名称不能为空'),
  body('accessToken').isString().notEmpty().withMessage('访问令牌不能为空'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId } = req.params
    const { owner, name, accessToken } = req.body

    // 验证项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return next(new AppError('项目不存在', 404))
    }

    const githubService = new GitHubService(accessToken, owner, name)
    const validation = await githubService.validateAccess()

    if (validation.valid) {
      // 检查权限
      const permissions = await githubService.checkPermissions()
      const rateLimit = await githubService.getRateLimit()

      logger.info('GitHub仓库访问验证成功', {
        projectId,
        owner,
        name,
        permissions,
        rateLimit
      })

      res.json({
        success: true,
        data: {
          valid: true,
          repository: validation.repository,
          permissions,
          rateLimit
        },
        message: 'GitHub仓库访问验证成功'
      })
    } else {
      logger.warn('GitHub仓库访问验证失败', {
        projectId,
        owner,
        name,
        error: validation.error
      })

      res.json({
        success: false,
        data: {
          valid: false,
          error: validation.error
        },
        message: 'GitHub仓库访问验证失败'
      })
    }
  } catch (error) {
    next(new AppError('验证GitHub仓库访问失败: ' + error.message, 500))
  }
})

// 从 GitHub 同步 Issues
router.post('/:projectId/github/sync/from-github', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  body('syncLabels').optional().isBoolean(),
  body('syncComments').optional().isBoolean(),
  body('syncMilestones').optional().isBoolean(),
  body('dryRun').optional().isBoolean(),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId } = req.params
    const {
      syncLabels = true,
      syncComments = true,
      syncMilestones = true,
      dryRun = false
    } = req.body

    // 获取 GitHub 仓库配置
    const repository = await prisma.gitHubRepository.findUnique({
      where: { projectId }
    })

    if (!repository || !repository.isActive) {
      return next(new AppError('GitHub仓库未配置或已禁用', 404))
    }

    const githubService = new GitHubService(repository.accessToken!, repository.owner, repository.name)
    const syncService = new GitHubSyncService(githubService, projectId)

    const result = await syncService.syncFromGitHub({
      syncDirection: 'GITHUB_TO_LOCAL',
      syncLabels,
      syncComments,
      syncMilestones,
      dryRun
    })

    // 更新最后同步时间
    if (result.success && !dryRun) {
      await prisma.gitHubRepository.update({
        where: { projectId },
        data: { lastSyncAt: new Date() }
      })
    }

    logger.info('从GitHub同步Issues', {
      projectId,
      options: { syncLabels, syncComments, syncMilestones, dryRun },
      result: {
        success: result.success,
        synced: result.synced,
        created: result.created,
        updated: result.updated,
        errors: result.errors.length
      }
    })

    res.json({
      success: result.success,
      data: result,
      message: result.success ? 
        `成功同步 ${result.synced} 个Issues（创建 ${result.created} 个，更新 ${result.updated} 个）` :
        `同步完成但有 ${result.errors.length} 个错误`
    })
  } catch (error) {
    next(new AppError('从GitHub同步Issues失败: ' + error.message, 500))
  }
})

// 同步 Issues 到 GitHub
router.post('/:projectId/github/sync/to-github', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  body('syncLabels').optional().isBoolean(),
  body('syncComments').optional().isBoolean(),
  body('dryRun').optional().isBoolean(),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId } = req.params
    const {
      syncLabels = true,
      syncComments = true,
      dryRun = false
    } = req.body

    // 获取 GitHub 仓库配置
    const repository = await prisma.gitHubRepository.findUnique({
      where: { projectId }
    })

    if (!repository || !repository.isActive) {
      return next(new AppError('GitHub仓库未配置或已禁用', 404))
    }

    const githubService = new GitHubService(repository.accessToken!, repository.owner, repository.name)
    const syncService = new GitHubSyncService(githubService, projectId)

    const result = await syncService.syncToGitHub({
      syncDirection: 'LOCAL_TO_GITHUB',
      syncLabels,
      syncComments,
      dryRun
    })

    // 更新最后同步时间
    if (result.success && !dryRun) {
      await prisma.gitHubRepository.update({
        where: { projectId },
        data: { lastSyncAt: new Date() }
      })
    }

    logger.info('同步Issues到GitHub', {
      projectId,
      options: { syncLabels, syncComments, dryRun },
      result: {
        success: result.success,
        synced: result.synced,
        created: result.created,
        updated: result.updated,
        errors: result.errors.length
      }
    })

    res.json({
      success: result.success,
      data: result,
      message: result.success ? 
        `成功同步 ${result.synced} 个Issues到GitHub（创建 ${result.created} 个，更新 ${result.updated} 个）` :
        `同步完成但有 ${result.errors.length} 个错误`
    })
  } catch (error) {
    next(new AppError('同步Issues到GitHub失败: ' + error.message, 500))
  }
})

// 双向同步 Issues
router.post('/:projectId/github/sync/bidirectional', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  body('syncLabels').optional().isBoolean(),
  body('syncComments').optional().isBoolean(),
  body('syncMilestones').optional().isBoolean(),
  body('dryRun').optional().isBoolean(),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId } = req.params
    const {
      syncLabels = true,
      syncComments = true,
      syncMilestones = true,
      dryRun = false
    } = req.body

    // 获取 GitHub 仓库配置
    const repository = await prisma.gitHubRepository.findUnique({
      where: { projectId }
    })

    if (!repository || !repository.isActive) {
      return next(new AppError('GitHub仓库未配置或已禁用', 404))
    }

    const githubService = new GitHubService(repository.accessToken!, repository.owner, repository.name)
    const syncService = new GitHubSyncService(githubService, projectId)

    const result = await syncService.syncBidirectional({
      syncDirection: 'BIDIRECTIONAL',
      syncLabels,
      syncComments,
      syncMilestones,
      dryRun
    })

    // 更新最后同步时间
    if (result.success && !dryRun) {
      await prisma.gitHubRepository.update({
        where: { projectId },
        data: { lastSyncAt: new Date() }
      })
    }

    logger.info('双向同步Issues', {
      projectId,
      options: { syncLabels, syncComments, syncMilestones, dryRun },
      result: {
        success: result.success,
        synced: result.synced,
        created: result.created,
        updated: result.updated,
        errors: result.errors.length
      }
    })

    res.json({
      success: result.success,
      data: result,
      message: result.success ? 
        `双向同步成功，共处理 ${result.synced} 个Issues（创建 ${result.created} 个，更新 ${result.updated} 个）` :
        `双向同步完成但有 ${result.errors.length} 个错误`
    })
  } catch (error) {
    next(new AppError('双向同步Issues失败: ' + error.message, 500))
  }
})

// 获取同步状态
router.get('/:projectId/github/sync/status', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId } = req.params

    // 获取 GitHub 仓库配置
    const repository = await prisma.gitHubRepository.findUnique({
      where: { projectId }
    })

    if (!repository) {
      return next(new AppError('GitHub仓库未配置', 404))
    }

    const githubService = new GitHubService(repository.accessToken!, repository.owner, repository.name)
    const syncService = new GitHubSyncService(githubService, projectId)

    const syncStatus = await syncService.getSyncStatus()
    const rateLimit = await githubService.getRateLimit()

    const status = {
      repository: {
        owner: repository.owner,
        name: repository.name,
        fullName: repository.fullName,
        isActive: repository.isActive,
        autoSync: repository.autoSync,
        syncInterval: repository.syncInterval,
        lastSyncAt: repository.lastSyncAt
      },
      sync: syncStatus,
      rateLimit
    }

    logger.info('获取GitHub同步状态', { projectId, status })

    res.json({
      success: true,
      data: status
    })
  } catch (error) {
    next(new AppError('获取GitHub同步状态失败: ' + error.message, 500))
  }
})

// 删除 GitHub 仓库配置
router.delete('/:projectId/github/repository', [
  param('projectId').isUUID().withMessage('项目ID格式无效'),
  validateRequest()
], async (req, res, next) => {
  try {
    const { projectId } = req.params

    const repository = await prisma.gitHubRepository.findUnique({
      where: { projectId }
    })

    if (!repository) {
      return next(new AppError('GitHub仓库配置不存在', 404))
    }

    await prisma.gitHubRepository.delete({
      where: { projectId }
    })

    logger.info('删除GitHub仓库配置', {
      projectId,
      repository: { owner: repository.owner, name: repository.name }
    })

    res.json({
      success: true,
      message: 'GitHub仓库配置删除成功'
    })
  } catch (error) {
    next(new AppError('删除GitHub仓库配置失败: ' + error.message, 500))
  }
})

export default router