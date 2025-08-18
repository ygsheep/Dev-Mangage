import { GitHubService, GitHubIssue } from './GitHubService'
import { prisma } from '../../lib/prisma'
import logger from '../../utils/logger'

export interface SyncOptions {
  syncDirection: 'GITHUB_TO_LOCAL' | 'LOCAL_TO_GITHUB' | 'BIDIRECTIONAL'
  syncLabels?: boolean
  syncComments?: boolean
  syncMilestones?: boolean
  dryRun?: boolean
}

export interface SyncResult {
  success: boolean
  synced: number
  created: number
  updated: number
  errors: Array<{ message: string; issueId?: string; githubNumber?: number }>
  skipped: number
}

/**
 * GitHub Issues 同步服务
 * 处理本地 Issues 与 GitHub Issues 的双向同步
 */
export class GitHubSyncService {
  private githubService: GitHubService
  private projectId: string

  constructor(githubService: GitHubService, projectId: string) {
    this.githubService = githubService
    this.projectId = projectId
  }

  /**
   * 同步 GitHub Issues 到本地
   */
  async syncFromGitHub(options: SyncOptions = { syncDirection: 'GITHUB_TO_LOCAL' }): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      synced: 0,
      created: 0,
      updated: 0,
      errors: [],
      skipped: 0
    }

    try {
      logger.info('开始从GitHub同步Issues', { projectId: this.projectId, options })

      // 获取 GitHub Issues
      const githubIssues = await this.githubService.getIssues({ state: 'all' })
      
      for (const githubIssue of githubIssues) {
        try {
          await this.syncGitHubIssueToLocal(githubIssue, options, result)
        } catch (error: any) {
          result.errors.push({
            message: `同步Issue #${githubIssue.number} 失败: ${error.message}`,
            githubNumber: githubIssue.number
          })
          result.success = false
        }
      }

      logger.info('GitHub Issues同步完成', {
        projectId: this.projectId,
        result: {
          total: githubIssues.length,
          synced: result.synced,
          created: result.created,
          updated: result.updated,
          errors: result.errors.length,
          skipped: result.skipped
        }
      })

      return result
    } catch (error: any) {
      logger.error('GitHub Issues同步失败', {
        projectId: this.projectId,
        error: error.message
      })

      result.success = false
      result.errors.push({ message: `同步失败: ${error.message}` })
      return result
    }
  }

  /**
   * 同步本地 Issues 到 GitHub
   */
  async syncToGitHub(options: SyncOptions = { syncDirection: 'LOCAL_TO_GITHUB' }): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      synced: 0,
      created: 0,
      updated: 0,
      errors: [],
      skipped: 0
    }

    try {
      logger.info('开始同步Issues到GitHub', { projectId: this.projectId, options })

      // 获取本地 Issues
      const localIssues = await prisma.issue.findMany({
        where: { projectId: this.projectId },
        include: {
          labels: true,
          comments: true
        }
      })

      for (const localIssue of localIssues) {
        try {
          await this.syncLocalIssueToGitHub(localIssue, options, result)
        } catch (error: any) {
          result.errors.push({
            message: `同步Issue ${localIssue.title} 失败: ${error.message}`,
            issueId: localIssue.id
          })
          result.success = false
        }
      }

      logger.info('本地Issues同步到GitHub完成', {
        projectId: this.projectId,
        result: {
          total: localIssues.length,
          synced: result.synced,
          created: result.created,
          updated: result.updated,
          errors: result.errors.length,
          skipped: result.skipped
        }
      })

      return result
    } catch (error: any) {
      logger.error('同步Issues到GitHub失败', {
        projectId: this.projectId,
        error: error.message
      })

      result.success = false
      result.errors.push({ message: `同步失败: ${error.message}` })
      return result
    }
  }

  /**
   * 双向同步
   */
  async syncBidirectional(options: SyncOptions = { syncDirection: 'BIDIRECTIONAL' }): Promise<SyncResult> {
    try {
      logger.info('开始双向同步Issues', { projectId: this.projectId })

      // 先从 GitHub 同步到本地
      const fromGitHubResult = await this.syncFromGitHub({
        ...options,
        syncDirection: 'GITHUB_TO_LOCAL'
      })

      // 再从本地同步到 GitHub
      const toGitHubResult = await this.syncToGitHub({
        ...options,
        syncDirection: 'LOCAL_TO_GITHUB'
      })

      // 合并结果
      const result: SyncResult = {
        success: fromGitHubResult.success && toGitHubResult.success,
        synced: fromGitHubResult.synced + toGitHubResult.synced,
        created: fromGitHubResult.created + toGitHubResult.created,
        updated: fromGitHubResult.updated + toGitHubResult.updated,
        errors: [...fromGitHubResult.errors, ...toGitHubResult.errors],
        skipped: fromGitHubResult.skipped + toGitHubResult.skipped
      }

      logger.info('双向同步Issues完成', { projectId: this.projectId, result })
      return result
    } catch (error: any) {
      logger.error('双向同步Issues失败', {
        projectId: this.projectId,
        error: error.message
      })

      return {
        success: false,
        synced: 0,
        created: 0,
        updated: 0,
        errors: [{ message: `双向同步失败: ${error.message}` }],
        skipped: 0
      }
    }
  }

  /**
   * 同步单个 GitHub Issue 到本地
   */
  private async syncGitHubIssueToLocal(
    githubIssue: GitHubIssue,
    options: SyncOptions,
    result: SyncResult
  ): Promise<void> {
    if (options.dryRun) {
      logger.debug('干运行模式: 跳过实际同步', { githubNumber: githubIssue.number })
      result.skipped++
      return
    }

    // 检查本地是否已存在该 Issue
    const existingIssue = await prisma.issue.findFirst({
      where: {
        projectId: this.projectId,
        githubNumber: githubIssue.number
      },
      include: {
        labels: true
      }
    })

    const issueData = {
      title: githubIssue.title,
      description: githubIssue.body || undefined,
      status: githubIssue.state === 'open' ? 'OPEN' : 'CLOSED',
      state: githubIssue.state,
      githubId: githubIssue.id,
      githubNodeId: githubIssue.node_id,
      githubNumber: githubIssue.number,
      githubUrl: githubIssue.url,
      githubHtmlUrl: githubIssue.html_url,
      repositoryName: this.githubService['repo'],
      repositoryOwner: this.githubService['owner'],
      assigneeId: githubIssue.assignee?.login,
      assigneeName: githubIssue.assignee?.login,
      assigneeAvatar: githubIssue.assignee?.avatar_url,
      reporterId: githubIssue.user.login,
      reporterName: githubIssue.user.login,
      reporterAvatar: githubIssue.user.avatar_url,
      closedAt: githubIssue.closed_at ? new Date(githubIssue.closed_at) : null,
      lastSyncAt: new Date(),
      syncStatus: 'SYNCED' as const
    }

    if (existingIssue) {
      // 更新现有 Issue
      await prisma.issue.update({
        where: { id: existingIssue.id },
        data: issueData
      })

      // 同步标签
      if (options.syncLabels && githubIssue.labels.length > 0) {
        await this.syncIssueLabels(existingIssue.id, githubIssue.labels)
      }

      // 同步评论
      if (options.syncComments) {
        await this.syncIssueComments(existingIssue.id, githubIssue.number)
      }

      result.updated++
      logger.debug('更新本地Issue', {
        issueId: existingIssue.id,
        githubNumber: githubIssue.number,
        title: githubIssue.title
      })
    } else {
      // 创建新 Issue
      const newIssue = await prisma.issue.create({
        data: {
          ...issueData,
          projectId: this.projectId
        }
      })

      // 同步标签
      if (options.syncLabels && githubIssue.labels.length > 0) {
        await this.syncIssueLabels(newIssue.id, githubIssue.labels)
      }

      // 同步评论
      if (options.syncComments) {
        await this.syncIssueComments(newIssue.id, githubIssue.number)
      }

      result.created++
      logger.debug('创建本地Issue', {
        issueId: newIssue.id,
        githubNumber: githubIssue.number,
        title: githubIssue.title
      })
    }

    result.synced++
  }

  /**
   * 同步本地 Issue 到 GitHub
   */
  private async syncLocalIssueToGitHub(
    localIssue: any,
    options: SyncOptions,
    result: SyncResult
  ): Promise<void> {
    if (options.dryRun) {
      logger.debug('干运行模式: 跳过实际同步', { issueId: localIssue.id })
      result.skipped++
      return
    }

    try {
      if (localIssue.githubNumber) {
        // 更新现有 GitHub Issue
        const updateOptions = {
          title: localIssue.title,
          body: localIssue.description || '',
          state: localIssue.state as 'open' | 'closed',
          ...(localIssue.assigneeId && { assignee: localIssue.assigneeId })
        }

        await this.githubService.updateIssue(localIssue.githubNumber, updateOptions)

        // 更新本地同步状态
        await prisma.issue.update({
          where: { id: localIssue.id },
          data: {
            lastSyncAt: new Date(),
            syncStatus: 'SYNCED'
          }
        })

        result.updated++
        logger.debug('更新GitHub Issue', {
          issueId: localIssue.id,
          githubNumber: localIssue.githubNumber,
          title: localIssue.title
        })
      } else {
        // 创建新 GitHub Issue
        const createOptions = {
          title: localIssue.title,
          body: localIssue.description || '',
          ...(localIssue.assigneeId && { assignee: localIssue.assigneeId }),
          labels: localIssue.labels?.map((label: any) => label.name) || []
        }

        const githubIssue = await this.githubService.createIssue(createOptions)

        // 更新本地 Issue 的 GitHub 信息
        await prisma.issue.update({
          where: { id: localIssue.id },
          data: {
            githubId: githubIssue.id,
            githubNodeId: githubIssue.node_id,
            githubNumber: githubIssue.number,
            githubUrl: githubIssue.url,
            githubHtmlUrl: githubIssue.html_url,
            lastSyncAt: new Date(),
            syncStatus: 'SYNCED'
          }
        })

        result.created++
        logger.debug('创建GitHub Issue', {
          issueId: localIssue.id,
          githubNumber: githubIssue.number,
          title: localIssue.title
        })
      }

      result.synced++
    } catch (error: any) {
      // 更新同步失败状态
      await prisma.issue.update({
        where: { id: localIssue.id },
        data: {
          syncStatus: 'SYNC_FAILED',
          syncError: error.message
        }
      })
      throw error
    }
  }

  /**
   * 同步 Issue 标签
   */
  private async syncIssueLabels(issueId: string, githubLabels: any[]): Promise<void> {
    try {
      // 删除现有标签
      await prisma.issueLabel.deleteMany({
        where: { issueId }
      })

      // 创建新标签
      if (githubLabels.length > 0) {
        await prisma.issueLabel.createMany({
          data: githubLabels.map(label => ({
            issueId,
            name: label.name,
            color: `#${label.color}`,
            description: label.description,
            githubId: label.id.toString(),
            githubNodeId: label.node_id
          }))
        })
      }

      logger.debug('同步Issue标签', { issueId, labelCount: githubLabels.length })
    } catch (error: any) {
      logger.error('同步Issue标签失败', {
        issueId,
        error: error.message
      })
      throw error
    }
  }

  /**
   * 同步 Issue 评论
   */
  private async syncIssueComments(issueId: string, githubNumber: number): Promise<void> {
    try {
      const githubComments = await this.githubService.getIssueComments(githubNumber)

      for (const githubComment of githubComments) {
        // 检查评论是否已存在
        const existingComment = await prisma.issueComment.findFirst({
          where: {
            issueId,
            githubId: githubComment.id.toString()
          }
        })

        const commentData = {
          content: githubComment.body,
          authorId: githubComment.user.login,
          authorName: githubComment.user.login,
          authorAvatar: githubComment.user.avatar_url,
          githubId: githubComment.id.toString(),
          githubNodeId: githubComment.node_id,
          githubUrl: githubComment.html_url
        }

        if (existingComment) {
          await prisma.issueComment.update({
            where: { id: existingComment.id },
            data: commentData
          })
        } else {
          await prisma.issueComment.create({
            data: {
              ...commentData,
              issueId
            }
          })
        }
      }

      logger.debug('同步Issue评论', { issueId, commentCount: githubComments.length })
    } catch (error: any) {
      logger.error('同步Issue评论失败', {
        issueId,
        githubNumber,
        error: error.message
      })
      throw error
    }
  }

  /**
   * 获取同步状态
   */
  async getSyncStatus(): Promise<{
    lastSyncAt?: Date
    totalIssues: number
    syncedIssues: number
    pendingSync: number
    failedSync: number
  }> {
    try {
      const [stats, lastSync] = await Promise.all([
        prisma.issue.groupBy({
          by: ['syncStatus'],
          where: { projectId: this.projectId },
          _count: { syncStatus: true }
        }),
        prisma.issue.findFirst({
          where: {
            projectId: this.projectId,
            lastSyncAt: { not: null }
          },
          select: { lastSyncAt: true },
          orderBy: { lastSyncAt: 'desc' }
        })
      ])

      const statusCounts = stats.reduce((acc, item) => {
        acc[item.syncStatus] = item._count.syncStatus
        return acc
      }, {} as Record<string, number>)

      return {
        lastSyncAt: lastSync?.lastSyncAt || undefined,
        totalIssues: Object.values(statusCounts).reduce((sum, count) => sum + count, 0),
        syncedIssues: statusCounts['SYNCED'] || 0,
        pendingSync: statusCounts['SYNC_PENDING'] || 0,
        failedSync: statusCounts['SYNC_FAILED'] || 0
      }
    } catch (error: any) {
      logger.error('获取同步状态失败', {
        projectId: this.projectId,
        error: error.message
      })
      throw error
    }
  }
}