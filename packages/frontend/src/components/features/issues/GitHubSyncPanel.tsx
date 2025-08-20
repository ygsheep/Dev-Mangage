import React, { useEffect, useState } from 'react'
import { GitHubRepository, SyncOptions, SyncResult } from '../../../types'
import {
  configureGitHubRepository,
  deleteGitHubRepository,
  getGitHubRepository,
  getGitHubSyncStatus,
  syncIssuesBidirectional,
  syncIssuesFromGitHub,
  syncIssuesToGitHub,
  validateGitHubRepository,
} from '../../../utils/api'

interface GitHubSyncPanelProps {
  projectId: string
  onClose: () => void
  onSyncComplete: () => void
}

interface ValidationResult {
  valid: boolean
  error?: string
  repository?: any
  permissions?: any
  rateLimit?: any
}

export const GitHubSyncPanel: React.FC<GitHubSyncPanelProps> = ({
  projectId,
  onClose,
  onSyncComplete,
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [repository, setRepository] = useState<GitHubRepository | null>(null)
  const [syncStatus, setSyncStatus] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'config' | 'sync' | 'status'>('config')

  // 配置表单状态
  const [configForm, setConfigForm] = useState({
    owner: '',
    name: '',
    accessToken: '',
    autoSync: true,
    syncInterval: 300,
  })

  // 同步选项状态
  const [syncOptions, setSyncOptions] = useState<SyncOptions>({
    syncDirection: 'BIDIRECTIONAL',
    syncLabels: true,
    syncComments: true,
    syncMilestones: true,
    dryRun: false,
  })

  // 同步结果状态
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)

  // 获取当前配置
  useEffect(() => {
    fetchRepository()
    fetchSyncStatus()
  }, [projectId])

  const fetchRepository = async () => {
    try {
      const response = await getGitHubRepository(projectId)
      if (response.success && response.data) {
        setRepository(response.data)
        setConfigForm({
          owner: response.data.owner,
          name: response.data.name,
          accessToken: '', // 不显示实际 token
          autoSync: response.data.autoSync,
          syncInterval: response.data.syncInterval,
        })
        setActiveTab('sync') // 如果已配置，显示同步页面
      }
    } catch (err: any) {
      // 未配置时会返回 404，这是正常的
      console.log('未找到 GitHub 配置')
    }
  }

  const fetchSyncStatus = async () => {
    try {
      const response = await getGitHubSyncStatus(projectId)
      if (response.success) {
        setSyncStatus(response.data)
      }
    } catch (err: any) {
      console.log('获取同步状态失败:', err)
    }
  }

  // 验证 GitHub 配置
  const validateConfiguration = async () => {
    if (!configForm.owner || !configForm.name || !configForm.accessToken) {
      setError('请填写完整的配置信息')
      return
    }

    setLoading(true)
    setError(null)
    setValidationResult(null)

    try {
      const response = await validateGitHubRepository(projectId, {
        owner: configForm.owner,
        name: configForm.name,
        accessToken: configForm.accessToken,
      })

      setValidationResult(response.data)

      if (!response.data.valid) {
        setError(response.data.error || '验证失败')
      }
    } catch (err: any) {
      console.error('验证失败:', err)
      setError(err.message || '验证失败')
    } finally {
      setLoading(false)
    }
  }

  // 保存配置
  const saveConfiguration = async () => {
    if (!validationResult?.valid) {
      setError('请先验证配置')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await configureGitHubRepository(projectId, configForm)

      if (response.success) {
        setRepository(response.data)
        setActiveTab('sync')
        await fetchSyncStatus()
      } else {
        setError(response.message || '保存配置失败')
      }
    } catch (err: any) {
      console.error('保存配置失败:', err)
      setError(err.message || '保存配置失败')
    } finally {
      setLoading(false)
    }
  }

  // 执行同步
  const performSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    setError(null)

    try {
      let response

      switch (syncOptions.syncDirection) {
        case 'GITHUB_TO_LOCAL':
          response = await syncIssuesFromGitHub(projectId, syncOptions)
          break
        case 'LOCAL_TO_GITHUB':
          response = await syncIssuesToGitHub(projectId, syncOptions)
          break
        case 'BIDIRECTIONAL':
          response = await syncIssuesBidirectional(projectId, syncOptions)
          break
      }

      if (response.success) {
        setSyncResult(response.data)
        onSyncComplete()
        await fetchSyncStatus()
      } else {
        setError(response.message || '同步失败')
      }
    } catch (err: any) {
      console.error('同步失败:', err)
      setError(err.message || '同步失败')
    } finally {
      setSyncing(false)
    }
  }

  // 删除配置
  const removeConfiguration = async () => {
    if (!confirm('确定要删除 GitHub 配置吗？这不会影响已同步的数据。')) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await deleteGitHubRepository(projectId)

      if (response.success) {
        setRepository(null)
        setSyncStatus(null)
        setConfigForm({
          owner: '',
          name: '',
          accessToken: '',
          autoSync: true,
          syncInterval: 300,
        })
        setActiveTab('config')
      } else {
        setError('删除配置失败')
      }
    } catch (err: any) {
      console.error('删除配置失败:', err)
      setError(err.message || '删除配置失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-bg-paper rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-text-primary">GitHub 同步配置</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-text-secondary transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 标签页 */}
        <div className="border-b">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('config')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'config'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-text-secondary'
              }`}
            >
              仓库配置
            </button>
            <button
              onClick={() => setActiveTab('sync')}
              disabled={!repository}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'sync'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-text-secondary'
              } ${!repository ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              同步管理
            </button>
            <button
              onClick={() => setActiveTab('status')}
              disabled={!repository}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'status'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-text-secondary'
              } ${!repository ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              同步状态
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* 配置页面 */}
          {activeTab === 'config' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-text-primary mb-4">GitHub 仓库配置</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      仓库所有者 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={configForm.owner}
                      onChange={e => setConfigForm(prev => ({ ...prev, owner: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 bg-bg-secondary focus:outline-none rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="例: microsoft"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      仓库名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={configForm.name}
                      onChange={e => setConfigForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 bg-bg-secondary focus:outline-none rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="例: vscode"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    访问令牌 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={configForm.accessToken}
                    onChange={e =>
                      setConfigForm(prev => ({ ...prev, accessToken: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 bg-bg-secondary focus:outline-none rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="GitHub Personal Access Token"
                  />
                  <p className="text-sm text-text-secondary mt-1">
                    需要 repo 权限的 Personal Access Token
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="autoSync"
                      checked={configForm.autoSync}
                      onChange={e =>
                        setConfigForm(prev => ({ ...prev, autoSync: e.target.checked }))
                      }
                      className="h-4 w-4 text-blue-600 border-gray-300 bg-bg-secondary rounded focus:ring-blue-500"
                    />
                    <label htmlFor="autoSync" className="ml-2 text-sm text-text-secondary">
                      自动同步
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      同步间隔（秒）
                    </label>
                    <input
                      type="number"
                      min="60"
                      value={configForm.syncInterval}
                      onChange={e =>
                        setConfigForm(prev => ({ ...prev, syncInterval: parseInt(e.target.value) }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 bg-bg-secondary focus:outline-none rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* 验证结果 */}
                {validationResult && (
                  <div
                    className={`mt-4 p-4 rounded-md ${
                      validationResult.valid
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    {validationResult.valid ? (
                      <div>
                        <h4 className="text-green-800 font-medium mb-2">✅ 验证成功</h4>
                        {validationResult.repository && (
                          <div className="text-sm text-green-700">
                            <p>
                              <strong>仓库:</strong> {validationResult.repository.full_name}
                            </p>
                            <p>
                              <strong>描述:</strong>{' '}
                              {validationResult.repository.description || '无'}
                            </p>
                            <p>
                              <strong>语言:</strong>{' '}
                              {validationResult.repository.language || '未知'}
                            </p>
                          </div>
                        )}
                        {validationResult.permissions && (
                          <div className="text-sm text-green-700 mt-2">
                            <p>
                              <strong>权限:</strong>
                              {validationResult.permissions.admin && ' 管理员'}
                              {validationResult.permissions.push && ' 推送'}
                              {validationResult.permissions.pull && ' 拉取'}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-red-800">
                        <h4 className="font-medium mb-2">❌ 验证失败</h4>
                        <p>{validationResult.error}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={validateConfiguration}
                    disabled={
                      loading || !configForm.owner || !configForm.name || !configForm.accessToken
                    }
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '验证中...' : '验证配置'}
                  </button>

                  {validationResult?.valid && (
                    <button
                      onClick={saveConfiguration}
                      disabled={loading}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? '保存中...' : '保存配置'}
                    </button>
                  )}

                  {repository && (
                    <button
                      onClick={removeConfiguration}
                      disabled={loading}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      删除配置
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 同步页面 */}
          {activeTab === 'sync' && repository && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-text-primary mb-4">
                  同步设置 - {repository.fullName}
                </h3>

                {/* 同步方向 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    同步方向
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="GITHUB_TO_LOCAL"
                        checked={syncOptions.syncDirection === 'GITHUB_TO_LOCAL'}
                        onChange={e =>
                          setSyncOptions(prev => ({
                            ...prev,
                            syncDirection: e.target.value as any,
                          }))
                        }
                        className="h-4 w-4 text-blue-600 border-gray-300 bg-bg-secondary focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-text-secondary">从 GitHub 同步到本地</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="LOCAL_TO_GITHUB"
                        checked={syncOptions.syncDirection === 'LOCAL_TO_GITHUB'}
                        onChange={e =>
                          setSyncOptions(prev => ({
                            ...prev,
                            syncDirection: e.target.value as any,
                          }))
                        }
                        className="h-4 w-4 text-blue-600 border-gray-300 bg-bg-secondary focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-text-secondary">从本地同步到 GitHub</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="BIDIRECTIONAL"
                        checked={syncOptions.syncDirection === 'BIDIRECTIONAL'}
                        onChange={e =>
                          setSyncOptions(prev => ({
                            ...prev,
                            syncDirection: e.target.value as any,
                          }))
                        }
                        className="h-4 w-4 text-blue-600 border-gray-300 bg-bg-secondary focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-text-secondary">双向同步（推荐）</span>
                    </label>
                  </div>
                </div>

                {/* 同步选项 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    同步选项
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={syncOptions.syncLabels}
                        onChange={e =>
                          setSyncOptions(prev => ({ ...prev, syncLabels: e.target.checked }))
                        }
                        className="h-4 w-4 text-blue-600 border-gray-300 bg-bg-secondary rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-text-secondary">同步标签</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={syncOptions.syncComments}
                        onChange={e =>
                          setSyncOptions(prev => ({ ...prev, syncComments: e.target.checked }))
                        }
                        className="h-4 w-4 text-blue-600 border-gray-300 bg-bg-secondary rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-text-secondary">同步评论</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={syncOptions.syncMilestones}
                        onChange={e =>
                          setSyncOptions(prev => ({ ...prev, syncMilestones: e.target.checked }))
                        }
                        className="h-4 w-4 text-blue-600 border-gray-300 bg-bg-secondary rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-text-secondary">同步里程碑</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={syncOptions.dryRun}
                        onChange={e =>
                          setSyncOptions(prev => ({ ...prev, dryRun: e.target.checked }))
                        }
                        className="h-4 w-4 text-blue-600 border-gray-300 bg-bg-secondary rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-text-secondary">干运行（预览模式）</span>
                    </label>
                  </div>
                </div>

                {/* 同步按钮 */}
                <button
                  onClick={performSync}
                  disabled={syncing}
                  className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {syncing ? '同步中...' : '开始同步'}
                </button>

                {/* 同步结果 */}
                {syncResult && (
                  <div
                    className={`mt-4 p-4 rounded-md ${
                      syncResult.success
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <h4
                      className={`font-medium mb-2 ${
                        syncResult.success ? 'text-green-800' : 'text-red-800'
                      }`}
                    >
                      {syncResult.success ? '✅ 同步完成' : '❌ 同步失败'}
                    </h4>
                    <div
                      className={`text-sm ${
                        syncResult.success ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      <p>总计同步: {syncResult.synced} 个</p>
                      <p>新创建: {syncResult.created} 个</p>
                      <p>已更新: {syncResult.updated} 个</p>
                      <p>跳过: {syncResult.skipped} 个</p>
                      {syncResult.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="font-medium">错误信息:</p>
                          <ul className="list-disc list-inside">
                            {syncResult.errors.map((error, index) => (
                              <li key={index}>{error.message}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 状态页面 */}
          {activeTab === 'status' && syncStatus && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-text-primary mb-4">同步状态</h3>

                {/* 仓库信息 */}
                <div className="bg-bg-paper p-4 rounded-md mb-4">
                  <h4 className="font-medium text-text-primary mb-2">仓库信息</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-text-secondary">仓库:</span>
                      <span className="ml-2 font-medium">{syncStatus.repository.fullName}</span>
                    </div>
                    <div>
                      <span className="text-text-secondary">自动同步:</span>
                      <span className="ml-2 font-medium">
                        {syncStatus.repository.autoSync ? '开启' : '关闭'}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-secondary">同步间隔:</span>
                      <span className="ml-2 font-medium">
                        {syncStatus.repository.syncInterval} 秒
                      </span>
                    </div>
                    <div>
                      <span className="text-text-secondary">最后同步:</span>
                      <span className="ml-2 font-medium">
                        {syncStatus.repository.lastSyncAt
                          ? new Date(syncStatus.repository.lastSyncAt).toLocaleString()
                          : '从未同步'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 同步统计 */}
                <div className="bg-blue-50 p-4 rounded-md mb-4">
                  <h4 className="font-medium text-text-primary mb-2">同步统计</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {syncStatus.sync.totalIssues}
                      </div>
                      <div className="text-text-secondary">总 Issues</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {syncStatus.sync.syncedIssues}
                      </div>
                      <div className="text-text-secondary">已同步</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-600">
                        {syncStatus.sync.pendingSync}
                      </div>
                      <div className="text-text-secondary">待同步</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">
                        {syncStatus.sync.failedSync}
                      </div>
                      <div className="text-text-secondary">同步失败</div>
                    </div>
                  </div>
                </div>

                {/* API 速率限制 */}
                {syncStatus.rateLimit && (
                  <div className="bg-yellow-50 p-4 rounded-md">
                    <h4 className="font-medium text-text-primary mb-2">API 速率限制</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-text-secondary">限制:</span>
                        <span className="ml-2 font-medium">{syncStatus.rateLimit.limit}</span>
                      </div>
                      <div>
                        <span className="text-text-secondary">剩余:</span>
                        <span className="ml-2 font-medium">{syncStatus.rateLimit.remaining}</span>
                      </div>
                      <div>
                        <span className="text-text-secondary">已使用:</span>
                        <span className="ml-2 font-medium">{syncStatus.rateLimit.used}</span>
                      </div>
                      <div>
                        <span className="text-text-secondary">重置时间:</span>
                        <span className="ml-2 font-medium">
                          {new Date(syncStatus.rateLimit.reset * 1000).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
