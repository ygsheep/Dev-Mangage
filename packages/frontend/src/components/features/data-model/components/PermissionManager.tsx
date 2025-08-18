import React, { useState, useEffect } from 'react'
import {
  Shield,
  Users,
  UserPlus,
  UserMinus,
  Crown,
  Edit3,
  Eye,
  Settings,
  Mail,
  Search,
  Filter,
  MoreVertical,
  Check,
  X,
  AlertTriangle,
  Copy,
  ExternalLink
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTeamMembers, getRolesAndPermissions, inviteMember, updateMemberRole, removeMember } from '../../../../utils/api'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  joinedAt: Date
  lastActive: Date
  status: 'active' | 'pending' | 'inactive'
}

interface Permission {
  id: string
  name: string
  description: string
  category: 'read' | 'write' | 'admin'
}

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  isSystem: boolean
  userCount: number
}

interface PermissionManagerProps {
  projectId: string
  currentUserId: string
  isOwner: boolean
}

const PermissionManager: React.FC<PermissionManagerProps> = ({
  projectId,
  currentUserId,
  isOwner
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'invitations'>('users')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('viewer')
  const [inviteMessage, setInviteMessage] = useState('')
  const queryClient = useQueryClient()

  // 处理搜索和筛选变化的防抖
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // 加载团队成员数据
  const { data: membersResponse, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['team-members', projectId, selectedRole, debouncedSearchQuery],
    queryFn: () => getTeamMembers(projectId, {
      role: selectedRole !== 'all' ? selectedRole : undefined,
      search: debouncedSearchQuery || undefined
    }),
    enabled: !!projectId
  })

  const users = membersResponse?.data?.members || []

  // 加载角色和权限数据
  const { data: rolesResponse, isLoading: isLoadingRoles } = useQuery({
    queryKey: ['roles-permissions', projectId],
    queryFn: () => getRolesAndPermissions(projectId),
    enabled: !!projectId
  })

  const roles = rolesResponse?.data?.roles || []
  const permissions = rolesResponse?.data?.permissions || []


  // 邀请成员 Mutation
  const inviteMemberMutation = useMutation({
    mutationFn: () => inviteMember(projectId, {
      email: inviteEmail,
      role: inviteRole,
      message: inviteMessage
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['team-members', projectId])
      setShowInviteModal(false)
      setInviteEmail('')
      setInviteRole('viewer')
      setInviteMessage('')
      toast.success('邀请已发送')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '发送邀请失败')
    }
  })

  // 发送邀请
  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('请输入邮箱地址')
      return
    }

    // 检查邮箱是否已存在
    if (users.some(user => user.email === inviteEmail)) {
      toast.error('该用户已在项目中')
      return
    }

    inviteMemberMutation.mutate()
  }

  // 更改用户角色 Mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, newRole }: { userId: string; newRole: string }) => 
      updateMemberRole(projectId, userId, newRole),
    onSuccess: () => {
      queryClient.invalidateQueries(['team-members', projectId])
      toast.success('用户角色已更新')
    },
    onError: () => {
      toast.error('更新用户角色失败')
    }
  })

  // 更改用户角色
  const handleChangeUserRole = (userId: string, newRole: string) => {
    if (userId === currentUserId && newRole !== 'owner') {
      toast.error('不能修改自己的角色')
      return
    }
    updateRoleMutation.mutate({ userId, newRole })
  }

  // 移除用户 Mutation
  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => removeMember(projectId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['team-members', projectId])
      toast.success('用户已移除')
    },
    onError: () => {
      toast.error('移除用户失败')
    }
  })

  // 移除用户
  const handleRemoveUser = (userId: string) => {
    if (userId === currentUserId) {
      toast.error('不能移除自己')
      return
    }
    removeMemberMutation.mutate(userId)
  }

  // 获取角色颜色
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800'
      case 'admin': return 'bg-blue-100 text-blue-800'
      case 'editor': return 'bg-green-100 text-green-800'
      case 'viewer': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // 格式化时间
  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    // 检查是否是有效的日期对象
    if (!dateObj || isNaN(dateObj.getTime())) {
      return '时间未知'
    }
    
    const now = new Date()
    const diff = now.getTime() - dateObj.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return dateObj.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-blue-500" />
          <div>
            <h2 className="text-xl font-semibold text-text-primary">团队权限管理</h2>
            <p className="text-text-secondary">管理项目成员和访问权限</p>
          </div>
        </div>

        {isOwner && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>邀请成员</span>
          </button>
        )}
      </div>

      {/* 标签导航 */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'users' 
              ? 'bg-bg-paper text-text-primary shadow' 
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Users className="w-4 h-4" />
            <span>团队成员 ({users.length})</span>
          </div>
        </button>
        
        <button
          onClick={() => setActiveTab('roles')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'roles' 
              ? 'bg-bg-paper text-text-primary shadow' 
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Crown className="w-4 h-4" />
            <span>角色权限 ({roles.length})</span>
          </div>
        </button>
      </div>

      {/* 用户管理标签页 */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* 筛选工具栏 */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索成员..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="input w-auto"
            >
              <option value="all">所有角色</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>

          {/* 用户列表 */}
          <div className="bg-bg-paper rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-bg-secondary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    成员
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    角色
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最后活跃
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-bg-paper divide-y divide-gray-200">
                {isLoadingMembers ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4" />
                      <p className="text-text-secondary">加载团队成员中...</p>
                    </td>
                  </tr>
                ) : users.map((user) => (
                  <tr key={user.id} className="hover:bg-bg-secondary">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-white font-medium">
                          {user.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-text-primary">
                            {user.name}
                            {user.id === currentUserId && (
                              <span className="ml-2 text-blue-600 text-xs">(您)</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isOwner && user.id !== currentUserId ? (
                        <select
                          value={user.role}
                          onChange={(e) => handleChangeUserRole(user.id, e.target.value)}
                          className={`text-xs font-medium rounded-full px-3 py-1 border-0 ${getRoleColor(user.role)}`}
                        >
                          {roles.map(role => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {roles.find(r => r.id === user.role)?.name || user.role}
                        </span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                        {user.status === 'active' ? '活跃' : 
                         user.status === 'pending' ? '待确认' : '不活跃'}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTime(user.lastActive)}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {isOwner && user.id !== currentUserId && (
                        <button
                          onClick={() => handleRemoveUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                          title="移除成员"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 角色权限标签页 */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roles.map((role) => (
              <div key={role.id} className="bg-bg-paper rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-text-primary">{role.name}</h3>
                    <p className="text-sm text-text-secondary">{role.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{role.userCount} 位成员</p>
                  </div>
                  
                  {!role.isSystem && isOwner && (
                    <button
                      onClick={() => {
                        setEditingRole(role)
                        setShowRoleModal(true)
                      }}
                      className="text-gray-400 hover:text-text-secondary"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-text-primary">权限列表</h4>
                  <div className="space-y-1">
                    {permissions.filter(p => role.permissions.includes(p.id)).map(permission => (
                      <div key={permission.id} className="flex items-center space-x-2 text-sm">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-text-primary">{permission.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 邀请成员模态框 */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-paper rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-text-primary">邀请团队成员</h2>
              <button onClick={() => setShowInviteModal(false)} className="btn-ghost">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  邮箱地址 *
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="input w-full"
                  placeholder="输入要邀请的邮箱地址"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  角色权限
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="input w-full"
                >
                  {roles.filter(role => role.id !== 'owner').map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name} - {role.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  邀请消息 (可选)
                </label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  className="input w-full"
                  rows={3}
                  placeholder="为被邀请人添加一些说明..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowInviteModal(false)}
                className="btn-outline"
              >
                取消
              </button>
              <button
                onClick={handleSendInvite}
                className="btn-primary flex items-center space-x-2"
              >
                <Mail className="w-4 h-4" />
                <span>发送邀请</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PermissionManager