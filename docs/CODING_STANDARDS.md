# DevAPI Manager 开发规范

本文档定义了 DevAPI Manager 项目的开发规范和最佳实践，确保代码质量和团队协作效率。

## 目录

- [代码注释规范](#代码注释规范)
- [TypeScript 开发规范](#typescript-开发规范)
- [React 组件开发规范](#react-组件开发规范)
- [API 开发规范](#api-开发规范)
- [Git 提交规范](#git-提交规范)
- [项目文件组织规范](#项目文件组织规范)
- [代码质量要求](#代码质量要求)

## 代码注释规范

### 基本原则

- **强制使用中文注释** - 所有注释必须使用简体中文
- **注释先行** - 复杂功能先写注释再写代码
- **保持更新** - 代码变更时同步更新相关注释
- **避免废话** - 注释应该解释"为什么"而不是"是什么"

### 文件级注释

每个源文件顶部必须包含模块说明：

```typescript
/**
 * 用户管理服务模块
 * 提供用户认证、权限管理和个人信息维护功能
 * 
 * 主要功能：
 * - 用户注册和登录验证
 * - 角色权限管理
 * - 个人资料CRUD操作
 * 
 * @author 开发者姓名
 * @since 2024-01-01
 */
```

### 接口和类型注释

```typescript
/**
 * 用户信息接口定义
 * 用于用户数据的类型约束和API响应结构
 */
interface UserInfo {
  /** 用户唯一标识符 */
  id: string
  /** 用户名，用于登录和显示 */
  username: string
  /** 用户邮箱地址，必须唯一 */
  email: string
  /** 用户角色，决定权限范围 */
  role: 'admin' | 'user' | 'guest'
  /** 账户创建时间 */
  createdAt: Date
  /** 最后登录时间，可为空 */
  lastLoginAt?: Date
}
```

### 函数和方法注释

```typescript
/**
 * 创建新用户账户
 * 验证用户数据的唯一性并创建账户记录
 * 
 * @param userData - 用户注册数据
 * @param options - 创建选项配置
 * @param options.sendWelcomeEmail - 是否发送欢迎邮件
 * @param options.autoActivate - 是否自动激活账户
 * @returns 创建的用户信息和初始密码
 * @throws {ValidationError} 当用户数据验证失败时
 * @throws {ConflictError} 当用户名或邮箱已存在时
 * 
 * @example
 * ```typescript
 * const newUser = await createUser({
 *   username: 'john_doe',
 *   email: 'john@example.com'
 * }, {
 *   sendWelcomeEmail: true,
 *   autoActivate: false
 * })
 * ```
 */
async function createUser(
  userData: CreateUserRequest,
  options: CreateUserOptions = {}
): Promise<CreateUserResponse> {
  // 验证用户名唯一性
  const existingUser = await checkUserExists(userData.username)
  if (existingUser) {
    throw new ConflictError('用户名已存在')
  }
  
  // 创建用户记录
  const user = await this.userRepository.create({
    ...userData,
    status: options.autoActivate ? 'active' : 'pending'
  })
  
  // 发送欢迎邮件（如果需要）
  if (options.sendWelcomeEmail) {
    await this.emailService.sendWelcomeEmail(user.email)
  }
  
  return {
    user: this.sanitizeUserData(user),
    temporaryPassword: generateTemporaryPassword()
  }
}
```

### React 组件注释

```typescript
/**
 * 用户列表组件
 * 展示分页的用户列表，支持搜索、筛选和批量操作
 * 
 * 功能特性：
 * - 实时搜索和多条件筛选
 * - 分页加载和虚拟滚动
 * - 批量选择和操作
 * - 响应式布局适配
 */

/**
 * 用户列表组件的属性接口
 */
interface UserListProps {
  /** 是否显示操作按钮，默认为 true */
  showActions?: boolean
  /** 每页显示的用户数量，默认为 20 */
  pageSize?: number
  /** 用户选择变化的回调函数 */
  onSelectionChange?: (selectedUsers: User[]) => void
  /** 自定义的CSS类名 */
  className?: string
}

/**
 * 用户列表组件
 * 
 * @param props - 组件属性
 * @returns React函数组件
 */
const UserList: React.FC<UserListProps> = ({
  showActions = true,
  pageSize = 20,
  onSelectionChange,
  className = ''
}) => {
  // 用户列表状态管理
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  
  // 处理用户选择变化
  const handleSelectionChange = useCallback((newSelection: User[]) => {
    setSelectedUsers(newSelection)
    onSelectionChange?.(newSelection)
  }, [onSelectionChange])
  
  return (
    <div className={`user-list ${className}`}>
      {/* 搜索和筛选区域 */}
      <div className="user-list__filters">
        {/* 筛选组件实现 */}
      </div>
      
      {/* 用户表格区域 */}
      <div className="user-list__table">
        {/* 表格组件实现 */}
      </div>
      
      {/* 分页控制区域 */}
      <div className="user-list__pagination">
        {/* 分页组件实现 */}
      </div>
    </div>
  )
}

export default UserList
```

### 内联注释规范

```typescript
// 业务逻辑注释 - 解释复杂的业务规则
if (user.lastLoginAt && daysBetween(user.lastLoginAt, new Date()) > 90) {
  // 用户超过90天未登录，标记为不活跃状态
  await markUserInactive(user.id)
}

// 性能优化注释 - 说明优化原理
const memoizedUserData = useMemo(() => {
  // 缓存处理后的用户数据，避免每次渲染时重新计算
  return users.map(user => ({
    ...user,
    displayName: formatUserDisplayName(user)
  }))
}, [users])

// 临时代码注释 - 标记待处理的代码
// TODO: 实现用户头像上传功能
// FIXME: 修复用户权限检查的边界情况
// HACK: 临时解决方案，等待后端API优化
```

### 注释质量检查清单

- [ ] 所有公共接口都有完整的JSDoc注释
- [ ] 复杂业务逻辑有清晰的说明
- [ ] 函数参数和返回值类型有详细描述
- [ ] 异常情况和错误处理有说明
- [ ] 性能相关的代码有优化说明
- [ ] 临时代码有明确的TODO标记
- [ ] 注释内容与代码实现保持一致

## 注释模板

### 服务类模板

```typescript
/**
 * [服务名称]服务类
 * [服务功能的简要描述]
 * 
 * 主要职责：
 * - [职责1]
 * - [职责2]
 * - [职责3]
 * 
 * 依赖服务：
 * - [依赖服务1]：[用途说明]
 * - [依赖服务2]：[用途说明]
 */
export class ServiceTemplate {
  /**
   * 构造函数
   * @param dependency1 - 依赖服务1
   * @param dependency2 - 依赖服务2
   */
  constructor(
    private dependency1: Dependency1,
    private dependency2: Dependency2
  ) {}
  
  /**
   * [方法功能描述]
   * [详细的业务逻辑说明]
   * 
   * @param param1 - 参数1说明
   * @param param2 - 参数2说明
   * @returns 返回值说明
   * @throws {ErrorType} 错误条件说明
   */
  async methodTemplate(param1: string, param2: number): Promise<Result> {
    // 实现逻辑
  }
}
```

### React组件模板

```typescript
/**
 * [组件名称]组件
 * [组件功能的简要描述]
 * 
 * 功能特性：
 * - [特性1]
 * - [特性2]
 * - [特性3]
 * 
 * 使用场景：
 * - [场景1]
 * - [场景2]
 */

/**
 * [组件名称]的属性接口
 */
interface ComponentProps {
  /** [属性1说明] */
  prop1: string
  /** [属性2说明]，默认值为 [默认值] */
  prop2?: boolean
  /** [回调函数说明] */
  onAction?: (data: ActionData) => void
}

/**
 * [组件名称]组件
 * @param props - 组件属性
 * @returns React函数组件
 */
const ComponentTemplate: React.FC<ComponentProps> = ({
  prop1,
  prop2 = false,
  onAction
}) => {
  // 组件实现
}
```

这份代码注释规范确保了项目中所有代码都有清晰、一致的中文注释，提高代码的可读性和维护性。

## TypeScript 开发规范

### 基本原则

- **严格类型检查** - 启用严格模式，避免使用 `any` 类型
- **明确的类型定义** - 为所有函数参数和返回值定义类型
- **合理使用泛型** - 提高代码复用性和类型安全
- **接口优于类型别名** - 对象结构使用 interface，联合类型使用 type

### 类型定义规范

```typescript
// ✅ 推荐：明确的接口定义
interface UserCreateRequest {
  username: string
  email: string
  role: UserRole
  profile?: UserProfile
}

// ✅ 推荐：使用枚举定义常量
enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}

// ✅ 推荐：使用联合类型
type ApiResponse<T> = {
  success: true
  data: T
} | {
  success: false
  error: string
}

// ❌ 避免：使用 any 类型
function handleData(data: any): any {
  return data
}

// ✅ 推荐：使用泛型
function handleData<T>(data: T): T {
  return data
}
```

### 函数类型规范

```typescript
// ✅ 推荐：明确的函数类型定义
type EventHandler<T = void> = (event: Event, data?: T) => void
type AsyncDataFetcher<T> = (params: FetchParams) => Promise<T>

// ✅ 推荐：使用函数重载
function formatDate(date: Date): string
function formatDate(date: string): string
function formatDate(date: number): string
function formatDate(date: Date | string | number): string {
  // 实现逻辑
}

// ✅ 推荐：可选参数和默认值
function createUser(
  userData: UserData,
  options: CreateOptions = {}
): Promise<User> {
  // 实现逻辑
}
```

### 工具类型使用

```typescript
// ✅ 推荐：使用内置工具类型
type PartialUser = Partial<User>
type RequiredProfile = Required<UserProfile>
type UserKeys = keyof User
type PublicUserInfo = Pick<User, 'id' | 'username' | 'email'>
type UserWithoutPassword = Omit<User, 'password'>

// ✅ 推荐：自定义工具类型
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

type NonNullable<T> = T extends null | undefined ? never : T
```

### 错误处理类型

```typescript
// ✅ 推荐：定义错误类型
interface AppError {
  code: string
  message: string
  details?: Record<string, any>
}

// ✅ 推荐：使用 Result 模式
type Result<T, E = AppError> = {
  success: true
  data: T
} | {
  success: false
  error: E
}

// 使用示例
async function fetchUser(id: string): Promise<Result<User>> {
  try {
    const user = await userRepository.findById(id)
    return { success: true, data: user }
  } catch (error) {
    return { 
      success: false, 
      error: {
        code: 'USER_NOT_FOUND',
        message: '用户不存在'
      }
    }
  }
}
```

### 模块导入导出规范

```typescript
// ✅ 推荐：命名导出
export interface User {
  id: string
  username: string
}

export class UserService {
  // 实现
}

export const userUtils = {
  // 工具函数
}

// ✅ 推荐：默认导出（组件）
const UserComponent: React.FC<UserProps> = (props) => {
  // 组件实现
}

export default UserComponent

// ✅ 推荐：类型导入
import type { User, UserService } from './user-types'
import { createUser } from './user-service'
```

## React 组件开发规范

### 组件设计原则

- **单一职责** - 每个组件只做一件事
- **可复用性** - 通过 props 实现组件的灵活配置
- **可测试性** - 组件逻辑清晰，便于单元测试
- **性能优化** - 合理使用 memo、useMemo、useCallback

### 组件结构规范

```typescript
/**
 * 用户卡片组件
 * 展示用户基本信息，支持多种显示模式和操作
 */

import React, { memo, useCallback } from 'react'
import { User } from '@shared/types'

// 1. 类型定义
interface UserCardProps {
  /** 用户信息对象 */
  user: User
  /** 显示模式：简洁版或详细版 */
  variant?: 'compact' | 'detailed'
  /** 是否显示操作按钮 */
  showActions?: boolean
  /** 点击用户卡片的回调函数 */
  onClick?: (user: User) => void
  /** 删除用户的回调函数 */
  onDelete?: (userId: string) => void
  /** 自定义CSS类名 */
  className?: string
}

// 2. 主组件实现
const UserCard: React.FC<UserCardProps> = memo(({
  user,
  variant = 'compact',
  showActions = false,
  onClick,
  onDelete,
  className = ''
}) => {
  // 3. 事件处理函数
  const handleClick = useCallback(() => {
    onClick?.(user)
  }, [onClick, user])

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(user.id)
  }, [onDelete, user.id])

  // 4. 渲染逻辑
  return (
    <div 
      className={`user-card user-card--${variant} ${className}`}
      onClick={handleClick}
    >
      {/* 用户头像 */}
      <div className="user-card__avatar">
        <img src={user.avatar || '/default-avatar.png'} alt={user.username} />
      </div>
      
      {/* 用户信息 */}
      <div className="user-card__info">
        <h3 className="user-card__name">{user.username}</h3>
        <p className="user-card__email">{user.email}</p>
        
        {variant === 'detailed' && (
          <div className="user-card__details">
            <span className="user-card__role">{user.role}</span>
            <span className="user-card__status">{user.status}</span>
          </div>
        )}
      </div>
      
      {/* 操作按钮 */}
      {showActions && (
        <div className="user-card__actions">
          <button
            type="button"
            className="user-card__delete-btn"
            onClick={handleDelete}
            aria-label="删除用户"
          >
            删除
          </button>
        </div>
      )}
    </div>
  )
})

// 5. 设置显示名称（便于调试）
UserCard.displayName = 'UserCard'

export default UserCard
```

### Hooks 使用规范

```typescript
// ✅ 推荐：自定义 Hook
function useUserData(userId: string) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const fetchUser = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const userData = await userApi.getUser(userId)
        setUser(userData)
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取用户信息失败')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [userId])

  return { user, loading, error, refetch: () => fetchUser() }
}

// ✅ 推荐：useCallback 优化
const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])

  // 使用 useCallback 避免子组件不必要的重渲染
  const handleUserClick = useCallback((user: User) => {
    console.log('用户点击:', user.username)
  }, [])

  const handleUserDelete = useCallback((userId: string) => {
    setUsers(prev => prev.filter(user => user.id !== userId))
  }, [])

  return (
    <div>
      {users.map(user => (
        <UserCard
          key={user.id}
          user={user}
          onClick={handleUserClick}
          onDelete={handleUserDelete}
        />
      ))}
    </div>
  )
}
```

### 表单组件规范

```typescript
/**
 * 用户编辑表单组件
 * 使用 react-hook-form 进行表单管理和验证
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// 表单验证模式
const userEditSchema = z.object({
  username: z.string()
    .min(3, '用户名至少3个字符')
    .max(20, '用户名最多20个字符'),
  email: z.string()
    .email('请输入有效的邮箱地址'),
  role: z.enum(['admin', 'user', 'guest'], {
    errorMap: () => ({ message: '请选择有效的用户角色' })
  })
})

type UserEditFormData = z.infer<typeof userEditSchema>

interface UserEditFormProps {
  /** 要编辑的用户信息（新建时为空） */
  initialData?: Partial<User>
  /** 表单提交成功的回调 */
  onSubmit: (data: UserEditFormData) => Promise<void>
  /** 取消编辑的回调 */
  onCancel: () => void
  /** 是否处于加载状态 */
  loading?: boolean
}

const UserEditForm: React.FC<UserEditFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset
  } = useForm<UserEditFormData>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      username: initialData?.username || '',
      email: initialData?.email || '',
      role: initialData?.role || 'user'
    }
  })

  const handleFormSubmit = async (data: UserEditFormData) => {
    try {
      await onSubmit(data)
      reset()
    } catch (error) {
      // 错误处理由父组件负责
      console.error('表单提交失败:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="user-edit-form">
      {/* 用户名输入 */}
      <div className="form-field">
        <label htmlFor="username" className="form-label">
          用户名 *
        </label>
        <input
          id="username"
          type="text"
          className={`form-input ${errors.username ? 'form-input--error' : ''}`}
          {...register('username')}
        />
        {errors.username && (
          <span className="form-error">{errors.username.message}</span>
        )}
      </div>

      {/* 邮箱输入 */}
      <div className="form-field">
        <label htmlFor="email" className="form-label">
          邮箱地址 *
        </label>
        <input
          id="email"
          type="email"
          className={`form-input ${errors.email ? 'form-input--error' : ''}`}
          {...register('email')}
        />
        {errors.email && (
          <span className="form-error">{errors.email.message}</span>
        )}
      </div>

      {/* 角色选择 */}
      <div className="form-field">
        <label htmlFor="role" className="form-label">
          用户角色 *
        </label>
        <select
          id="role"
          className={`form-select ${errors.role ? 'form-select--error' : ''}`}
          {...register('role')}
        >
          <option value="user">普通用户</option>
          <option value="admin">管理员</option>
          <option value="guest">访客</option>
        </select>
        {errors.role && (
          <span className="form-error">{errors.role.message}</span>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="form-actions">
        <button
          type="button"
          className="btn btn--secondary"
          onClick={onCancel}
          disabled={loading}
        >
          取消
        </button>
        <button
          type="submit"
          className="btn btn--primary"
          disabled={!isValid || loading}
        >
          {loading ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  )
}

export default UserEditForm
```

## API 开发规范

### RESTful API 设计原则

- **资源导向** - URL 表示资源，HTTP 方法表示操作
- **统一接口** - 使用标准的 HTTP 状态码和方法
- **无状态** - 每个请求包含所有必要信息
- **分层系统** - 清晰的分层架构和职责分离

### API 路由设计

```typescript
// ✅ 推荐：RESTful 路由设计
const userRoutes = {
  // 用户资源的 CRUD 操作
  'GET /api/v1/users': '获取用户列表',
  'POST /api/v1/users': '创建新用户',
  'GET /api/v1/users/:id': '获取指定用户',
  'PUT /api/v1/users/:id': '更新用户信息',
  'DELETE /api/v1/users/:id': '删除用户',
  
  // 用户相关的子资源
  'GET /api/v1/users/:id/posts': '获取用户的文章列表',
  'POST /api/v1/users/:id/posts': '为用户创建新文章',
  
  // 用户操作（非资源操作）
  'POST /api/v1/users/:id/activate': '激活用户账户',
  'POST /api/v1/users/:id/deactivate': '停用用户账户',
  'POST /api/v1/users/:id/reset-password': '重置用户密码'
}

// ❌ 避免：非 RESTful 设计
const badRoutes = {
  'GET /api/v1/getAllUsers': '❌ 动词形式',
  'POST /api/v1/userCreate': '❌ 不符合资源导向',
  'GET /api/v1/users/delete/:id': '❌ 使用错误的 HTTP 方法'
}
```

### API 控制器规范

```typescript
/**
 * 用户管理控制器
 * 处理用户相关的 HTTP 请求，包括 CRUD 操作和业务逻辑
 */

import { Request, Response, NextFunction } from 'express'
import { UserService } from '../services/UserService'
import { validateRequest } from '../middleware/validation'
import { CreateUserSchema, UpdateUserSchema } from '../schemas/userSchemas'
import { AppError } from '../utils/AppError'
import logger from '../utils/logger'

export class UserController {
  constructor(private userService: UserService) {}

  /**
   * 获取用户列表
   * 支持分页、搜索和筛选功能
   * 
   * @route GET /api/v1/users
   * @param req - Express 请求对象
   * @param res - Express 响应对象
   * @param next - Express 错误处理中间件
   */
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        page = 1,
        pageSize = 20,
        search,
        role,
        status
      } = req.query

      const result = await this.userService.getUsers({
        page: Number(page),
        pageSize: Number(pageSize),
        search: search as string,
        role: role as string,
        status: status as string
      })

      res.json({
        success: true,
        data: result.users,
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
          totalPages: result.totalPages
        }
      })

      logger.info('获取用户列表成功', {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * 创建新用户
   * 
   * @route POST /api/v1/users
   * @param req - Express 请求对象
   * @param res - Express 响应对象
   * @param next - Express 错误处理中间件
   */
  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      // 验证请求数据
      const validatedData = CreateUserSchema.parse(req.body)

      // 创建用户
      const newUser = await this.userService.createUser(validatedData)

      res.status(201).json({
        success: true,
        data: newUser,
        message: '用户创建成功'
      })

      logger.info('用户创建成功', {
        userId: newUser.id,
        username: newUser.username
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * 获取指定用户信息
   * 
   * @route GET /api/v1/users/:id
   * @param req - Express 请求对象
   * @param res - Express 响应对象
   * @param next - Express 错误处理中间件
   */
  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params

      const user = await this.userService.getUserById(id)
      
      if (!user) {
        throw new AppError('用户不存在', 404)
      }

      res.json({
        success: true,
        data: user
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * 更新用户信息
   * 
   * @route PUT /api/v1/users/:id
   * @param req - Express 请求对象
   * @param res - Express 响应对象
   * @param next - Express 错误处理中间件
   */
  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const validatedData = UpdateUserSchema.parse(req.body)

      const updatedUser = await this.userService.updateUser(id, validatedData)

      res.json({
        success: true,
        data: updatedUser,
        message: '用户信息更新成功'
      })

      logger.info('用户信息更新成功', {
        userId: id,
        changes: Object.keys(validatedData)
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * 删除用户
   * 
   * @route DELETE /api/v1/users/:id
   * @param req - Express 请求对象
   * @param res - Express 响应对象
   * @param next - Express 错误处理中间件
   */
  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params

      await this.userService.deleteUser(id)

      res.status(204).send()

      logger.info('用户删除成功', { userId: id })
    } catch (error) {
      next(error)
    }
  }
}
```

### API 响应格式规范

```typescript
// ✅ 推荐：统一的响应格式
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: {
    code: string
    message: string
    details?: any
  }
  pagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  meta?: {
    timestamp: string
    requestId: string
    version: string
  }
}

// 成功响应示例
const successResponse: ApiResponse<User[]> = {
  success: true,
  data: [
    { id: '1', username: 'john', email: 'john@example.com' }
  ],
  pagination: {
    page: 1,
    pageSize: 20,
    total: 100,
    totalPages: 5
  },
  meta: {
    timestamp: '2024-01-01T00:00:00Z',
    requestId: 'req_123456',
    version: 'v1'
  }
}

// 错误响应示例
const errorResponse: ApiResponse = {
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: '请求数据验证失败',
    details: {
      field: 'email',
      value: 'invalid-email',
      message: '邮箱格式不正确'
    }
  },
  meta: {
    timestamp: '2024-01-01T00:00:00Z',
    requestId: 'req_123456',
    version: 'v1'
  }
}
```

### 中间件开发规范

```typescript
/**
 * 请求验证中间件
 * 使用 Zod 进行请求数据验证
 */

import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'
import { AppError } from '../utils/AppError'

export const validateRequest = (schema: {
  body?: ZodSchema
  query?: ZodSchema
  params?: ZodSchema
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // 验证请求体
      if (schema.body) {
        req.body = schema.body.parse(req.body)
      }

      // 验证查询参数
      if (schema.query) {
        req.query = schema.query.parse(req.query)
      }

      // 验证路径参数
      if (schema.params) {
        req.params = schema.params.parse(req.params)
      }

      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = new AppError(
          '请求数据验证失败',
          400,
          'VALIDATION_ERROR',
          error.errors
        )
        next(validationError)
      } else {
        next(error)
      }
    }
  }
}

/**
 * 错误处理中间件
 * 统一处理应用程序错误并返回格式化响应
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500
  let errorCode = 'INTERNAL_ERROR'
  let message = '服务器内部错误'
  let details = undefined

  // 处理自定义应用错误
  if (error instanceof AppError) {
    statusCode = error.statusCode
    errorCode = error.code
    message = error.message
    details = error.details
  }

  // 记录错误日志
  logger.error('API错误', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  })

  // 返回错误响应
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      details
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: req.get('X-Request-ID') || 'unknown',
      version: 'v1'
    }
  })
}
```

## Git 提交规范

### 提交信息格式

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<类型>[可选的作用域]: <描述>

[可选的正文]

[可选的脚注]
```

### 提交类型

- **feat**: 新功能
- **fix**: 修复 bug
- **docs**: 文档变更
- **style**: 格式变更（不影响代码运行）
- **refactor**: 重构（既不是新增功能，也不是修复 bug）
- **perf**: 性能优化
- **test**: 添加测试
- **chore**: 构建过程或辅助工具变动
- **ci**: CI 配置文件和脚本变动

### 提交示例

```bash
# 新功能
feat(user): 添加用户头像上传功能

# 修复 bug
fix(api): 修复用户列表分页错误

# 文档更新
docs: 更新 API 文档和使用示例

# 代码重构
refactor(auth): 重构用户认证模块，提高代码可读性

# 性能优化
perf(database): 优化用户查询的数据库索引

# 添加测试
test(user): 添加用户服务的单元测试

# 构建相关
chore: 更新依赖包版本

# 样式修改
style: 修复代码格式和 ESLint 警告
```

### 提交规则

1. **提交频率**: 每个功能或修复应该是一个独立的提交
2. **提交大小**: 每次提交应该是一个逻辑单元，避免过大的提交
3. **提交描述**: 使用中文描述，简洁明了地说明变更内容
4. **作用域**: 使用小写字母，表示变更影响的模块或组件

### 分支管理规范

```bash
# 主分支
main                    # 生产环境分支
develop                 # 开发环境分支

# 功能分支
feature/user-management # 新功能开发
feature/api-optimization # API 优化

# 修复分支
fix/login-error         # Bug 修复
hotfix/security-patch   # 紧急修复

# 发布分支
release/v1.2.0          # 版本发布准备
```

### Git 工作流程

1. **从 develop 分支创建功能分支**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/new-feature
   ```

2. **开发过程中定期提交**
   ```bash
   git add .
   git commit -m "feat(feature): 实现新功能的核心逻辑"
   ```

3. **功能完成后推送并创建 PR**
   ```bash
   git push origin feature/new-feature
   # 在 GitHub 创建 Pull Request
   ```

4. **代码审查通过后合并到 develop**
   ```bash
   git checkout develop
   git pull origin develop
   git merge feature/new-feature
   git push origin develop
   ```

## 项目文件组织规范

### 目录结构

```
packages/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── controllers/     # 控制器层
│   │   ├── services/        # 业务逻辑层
│   │   ├── repositories/    # 数据访问层
│   │   ├── middleware/      # 中间件
│   │   ├── routes/          # 路由定义
│   │   ├── schemas/         # 数据验证模式
│   │   ├── types/           # TypeScript 类型定义
│   │   ├── utils/           # 工具函数
│   │   ├── config/          # 配置文件
│   │   └── app.ts          # 应用入口
│   ├── tests/              # 测试文件
│   ├── docs/               # API 文档
│   └── package.json
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── components/     # React 组件
│   │   │   ├── common/     # 通用组件
│   │   │   ├── features/   # 功能特定组件
│   │   │   └── layout/     # 布局组件
│   │   ├── pages/          # 页面组件
│   │   ├── hooks/          # 自定义 Hooks
│   │   ├── utils/          # 工具函数
│   │   ├── services/       # API 服务
│   │   ├── stores/         # 状态管理
│   │   ├── types/          # TypeScript 类型
│   │   ├── styles/         # 样式文件
│   │   └── App.tsx         # 应用入口
│   ├── public/             # 静态资源
│   └── package.json
├── shared/                 # 共享代码
│   ├── types/              # 共享类型定义
│   ├── utils/              # 共享工具函数
│   └── constants/          # 共享常量
└── docs/                   # 项目文档
    ├── api/                # API 文档
    ├── development/        # 开发文档
    └── deployment/         # 部署文档
```

### 文件命名规范

- **组件文件**: PascalCase (UserCard.tsx)
- **工具函数**: camelCase (formatDate.ts)
- **常量文件**: UPPER_SNAKE_CASE (API_ENDPOINTS.ts)
- **样式文件**: kebab-case (user-card.css)
- **配置文件**: kebab-case (eslint.config.js)

### 导入顺序规范

```typescript
// 1. Node.js 内置模块
import fs from 'fs'
import path from 'path'

// 2. 第三方库
import React from 'react'
import axios from 'axios'
import { z } from 'zod'

// 3. 内部模块（绝对路径）
import { User } from '@shared/types'
import { apiClient } from '@/utils/api'

// 4. 相对路径导入
import { UserCard } from '../components/UserCard'
import { formatDate } from './utils'

// 5. 类型导入（单独分组）
import type { ComponentProps } from 'react'
import type { ApiResponse } from '@shared/types'
```

## 代码质量要求

### 静态代码检查

- **ESLint**: 代码质量和风格检查
- **Prettier**: 代码格式化
- **TypeScript**: 类型检查
- **Husky**: Git hooks 自动化检查

### 测试要求

- **单元测试覆盖率**: 不低于 80%
- **集成测试**: 关键业务流程必须有集成测试
- **E2E 测试**: 主要用户路径必须有端到端测试

### 性能要求

- **首页加载时间**: 不超过 3 秒
- **API 响应时间**: 95% 的请求在 500ms 内响应
- **内存使用**: 前端运行时内存占用不超过 100MB

### 安全要求

- **输入验证**: 所有用户输入必须验证
- **SQL 注入防护**: 使用参数化查询
- **XSS 防护**: 所有用户内容必须转义
- **CSRF 保护**: 使用 CSRF token

这份开发规范为 DevAPI Manager 项目提供了全面的编码标准和最佳实践指导。