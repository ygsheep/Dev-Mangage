import axios, { AxiosInstance } from 'axios'
import logger from '../../utils/logger'

export interface GitHubIssue {
  id: number
  node_id: string
  number: number
  title: string
  body?: string
  state: 'open' | 'closed'
  html_url: string
  url: string
  user: {
    login: string
    avatar_url: string
    html_url: string
  }
  assignee?: {
    login: string
    avatar_url: string
    html_url: string
  }
  labels: Array<{
    id: number
    node_id: string
    name: string
    color: string
    description?: string
  }>
  milestone?: {
    id: number
    number: number
    title: string
    description?: string
    state: 'open' | 'closed'
    html_url: string
    due_on?: string
  }
  created_at: string
  updated_at: string
  closed_at?: string
}

export interface GitHubRepository {
  id: number
  node_id: string
  name: string
  full_name: string
  owner: {
    login: string
    avatar_url: string
  }
  html_url: string
  url: string
  description?: string
  private: boolean
  default_branch: string
  language?: string
}

export interface GitHubComment {
  id: number
  node_id: string
  body: string
  user: {
    login: string
    avatar_url: string
    html_url: string
  }
  html_url: string
  created_at: string
  updated_at: string
}

export interface CreateIssueOptions {
  title: string
  body?: string
  assignee?: string
  milestone?: number
  labels?: string[]
}

export interface UpdateIssueOptions {
  title?: string
  body?: string
  state?: 'open' | 'closed'
  assignee?: string
  milestone?: number
  labels?: string[]
}

/**
 * GitHub API 服务类
 * 处理与 GitHub API 的集成，包括 Issues、仓库、评论等操作
 */
export class GitHubService {
  private client: AxiosInstance
  private token: string
  private owner: string
  private repo: string

  constructor(token: string, owner: string, repo: string) {
    this.token = token
    this.owner = owner
    this.repo = repo

    this.client = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'DevAPI-Manager/1.0.0'
      },
      timeout: 30000
    })

    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        logger.debug('GitHub API请求', {
          method: config.method?.toUpperCase(),
          url: config.url,
          params: config.params
        })
        return config
      },
      (error) => {
        logger.error('GitHub API请求错误', { error: error.message })
        return Promise.reject(error)
      }
    )

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('GitHub API响应', {
          status: response.status,
          url: response.config.url,
          rateLimit: {
            limit: response.headers['x-ratelimit-limit'],
            remaining: response.headers['x-ratelimit-remaining'],
            reset: response.headers['x-ratelimit-reset']
          }
        })
        return response
      },
      (error) => {
        logger.error('GitHub API响应错误', {
          status: error.response?.status,
          message: error.response?.data?.message,
          url: error.config?.url
        })
        return Promise.reject(error)
      }
    )
  }

  /**
   * 验证 GitHub 令牌和仓库访问权限
   */
  async validateAccess(): Promise<{ valid: boolean; repository?: GitHubRepository; error?: string }> {
    try {
      const response = await this.client.get(`/repos/${this.owner}/${this.repo}`)
      return {
        valid: true,
        repository: response.data
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message
      logger.error('GitHub访问验证失败', {
        owner: this.owner,
        repo: this.repo,
        error: errorMessage
      })
      return {
        valid: false,
        error: errorMessage
      }
    }
  }

  /**
   * 获取仓库信息
   */
  async getRepository(): Promise<GitHubRepository> {
    try {
      const response = await this.client.get(`/repos/${this.owner}/${this.repo}`)
      return response.data
    } catch (error: any) {
      logger.error('获取GitHub仓库信息失败', {
        owner: this.owner,
        repo: this.repo,
        error: error.message
      })
      throw new Error(`获取仓库信息失败: ${error.response?.data?.message || error.message}`)
    }
  }

  /**
   * 获取 Issues 列表
   */
  async getIssues(options: {
    state?: 'open' | 'closed' | 'all'
    labels?: string
    sort?: 'created' | 'updated' | 'comments'
    direction?: 'asc' | 'desc'
    since?: string
    page?: number
    per_page?: number
  } = {}): Promise<GitHubIssue[]> {
    try {
      const params = {
        state: options.state || 'all',
        labels: options.labels,
        sort: options.sort || 'updated',
        direction: options.direction || 'desc',
        since: options.since,
        page: options.page || 1,
        per_page: Math.min(options.per_page || 30, 100)
      }

      const response = await this.client.get(`/repos/${this.owner}/${this.repo}/issues`, { params })
      
      logger.info('获取GitHub Issues列表', {
        owner: this.owner,
        repo: this.repo,
        params,
        count: response.data.length
      })

      return response.data
    } catch (error: any) {
      logger.error('获取GitHub Issues失败', {
        owner: this.owner,
        repo: this.repo,
        error: error.message
      })
      throw new Error(`获取Issues失败: ${error.response?.data?.message || error.message}`)
    }
  }

  /**
   * 获取单个 Issue
   */
  async getIssue(issueNumber: number): Promise<GitHubIssue> {
    try {
      const response = await this.client.get(`/repos/${this.owner}/${this.repo}/issues/${issueNumber}`)
      
      logger.info('获取GitHub Issue详情', {
        owner: this.owner,
        repo: this.repo,
        issueNumber,
        title: response.data.title
      })

      return response.data
    } catch (error: any) {
      logger.error('获取GitHub Issue详情失败', {
        owner: this.owner,
        repo: this.repo,
        issueNumber,
        error: error.message
      })
      throw new Error(`获取Issue详情失败: ${error.response?.data?.message || error.message}`)
    }
  }

  /**
   * 创建新 Issue
   */
  async createIssue(options: CreateIssueOptions): Promise<GitHubIssue> {
    try {
      const response = await this.client.post(`/repos/${this.owner}/${this.repo}/issues`, options)
      
      logger.info('创建GitHub Issue', {
        owner: this.owner,
        repo: this.repo,
        issueNumber: response.data.number,
        title: options.title
      })

      return response.data
    } catch (error: any) {
      logger.error('创建GitHub Issue失败', {
        owner: this.owner,
        repo: this.repo,
        title: options.title,
        error: error.message
      })
      throw new Error(`创建Issue失败: ${error.response?.data?.message || error.message}`)
    }
  }

  /**
   * 更新 Issue
   */
  async updateIssue(issueNumber: number, options: UpdateIssueOptions): Promise<GitHubIssue> {
    try {
      const response = await this.client.patch(`/repos/${this.owner}/${this.repo}/issues/${issueNumber}`, options)
      
      logger.info('更新GitHub Issue', {
        owner: this.owner,
        repo: this.repo,
        issueNumber,
        changes: Object.keys(options)
      })

      return response.data
    } catch (error: any) {
      logger.error('更新GitHub Issue失败', {
        owner: this.owner,
        repo: this.repo,
        issueNumber,
        error: error.message
      })
      throw new Error(`更新Issue失败: ${error.response?.data?.message || error.message}`)
    }
  }

  /**
   * 关闭 Issue
   */
  async closeIssue(issueNumber: number): Promise<GitHubIssue> {
    return this.updateIssue(issueNumber, { state: 'closed' })
  }

  /**
   * 重新打开 Issue
   */
  async reopenIssue(issueNumber: number): Promise<GitHubIssue> {
    return this.updateIssue(issueNumber, { state: 'open' })
  }

  /**
   * 获取 Issue 评论
   */
  async getIssueComments(issueNumber: number, options: {
    since?: string
    page?: number
    per_page?: number
  } = {}): Promise<GitHubComment[]> {
    try {
      const params = {
        since: options.since,
        page: options.page || 1,
        per_page: Math.min(options.per_page || 30, 100)
      }

      const response = await this.client.get(`/repos/${this.owner}/${this.repo}/issues/${issueNumber}/comments`, { params })
      
      logger.info('获取GitHub Issue评论', {
        owner: this.owner,
        repo: this.repo,
        issueNumber,
        count: response.data.length
      })

      return response.data
    } catch (error: any) {
      logger.error('获取GitHub Issue评论失败', {
        owner: this.owner,
        repo: this.repo,
        issueNumber,
        error: error.message
      })
      throw new Error(`获取Issue评论失败: ${error.response?.data?.message || error.message}`)
    }
  }

  /**
   * 创建 Issue 评论
   */
  async createIssueComment(issueNumber: number, body: string): Promise<GitHubComment> {
    try {
      const response = await this.client.post(`/repos/${this.owner}/${this.repo}/issues/${issueNumber}/comments`, { body })
      
      logger.info('创建GitHub Issue评论', {
        owner: this.owner,
        repo: this.repo,
        issueNumber,
        commentId: response.data.id
      })

      return response.data
    } catch (error: any) {
      logger.error('创建GitHub Issue评论失败', {
        owner: this.owner,
        repo: this.repo,
        issueNumber,
        error: error.message
      })
      throw new Error(`创建Issue评论失败: ${error.response?.data?.message || error.message}`)
    }
  }

  /**
   * 获取仓库标签
   */
  async getLabels(): Promise<Array<{ id: number; name: string; color: string; description?: string }>> {
    try {
      const response = await this.client.get(`/repos/${this.owner}/${this.repo}/labels`)
      
      logger.info('获取GitHub标签', {
        owner: this.owner,
        repo: this.repo,
        count: response.data.length
      })

      return response.data
    } catch (error: any) {
      logger.error('获取GitHub标签失败', {
        owner: this.owner,
        repo: this.repo,
        error: error.message
      })
      throw new Error(`获取标签失败: ${error.response?.data?.message || error.message}`)
    }
  }

  /**
   * 获取里程碑
   */
  async getMilestones(state: 'open' | 'closed' | 'all' = 'all'): Promise<Array<{
    id: number
    number: number
    title: string
    description?: string
    state: 'open' | 'closed'
    html_url: string
    due_on?: string
  }>> {
    try {
      const response = await this.client.get(`/repos/${this.owner}/${this.repo}/milestones`, {
        params: { state }
      })
      
      logger.info('获取GitHub里程碑', {
        owner: this.owner,
        repo: this.repo,
        state,
        count: response.data.length
      })

      return response.data
    } catch (error: any) {
      logger.error('获取GitHub里程碑失败', {
        owner: this.owner,
        repo: this.repo,
        error: error.message
      })
      throw new Error(`获取里程碑失败: ${error.response?.data?.message || error.message}`)
    }
  }

  /**
   * 获取 API 速率限制信息
   */
  async getRateLimit(): Promise<{
    limit: number
    remaining: number
    reset: number
    used: number
  }> {
    try {
      const response = await this.client.get('/rate_limit')
      return response.data.rate
    } catch (error: any) {
      logger.error('获取GitHub API速率限制信息失败', { error: error.message })
      throw new Error(`获取速率限制信息失败: ${error.response?.data?.message || error.message}`)
    }
  }

  /**
   * 检查仓库权限
   */
  async checkPermissions(): Promise<{
    admin: boolean
    push: boolean
    pull: boolean
  }> {
    try {
      const response = await this.client.get(`/repos/${this.owner}/${this.repo}`)
      const permissions = response.data.permissions || {}
      
      return {
        admin: permissions.admin || false,
        push: permissions.push || false,
        pull: permissions.pull || false
      }
    } catch (error: any) {
      logger.error('检查GitHub仓库权限失败', {
        owner: this.owner,
        repo: this.repo,
        error: error.message
      })
      throw new Error(`检查仓库权限失败: ${error.response?.data?.message || error.message}`)
    }
  }
}