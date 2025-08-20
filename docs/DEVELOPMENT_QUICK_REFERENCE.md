# DevAPI Manager 开发快速参考

本文档提供日常开发中最常用的规范和命令的快速参考。

## 🚀 快速开始

### 开发环境启动

```bash
# 安装依赖
npm install

# 启动开发环境（推荐）
npm run dev

# 或单独启动服务
npm run dev:backend   # 后端服务（端口 3000）
npm run dev:frontend  # 前端服务（端口 5173）
npm run dev:mcp       # MCP 服务（端口 3000）
```

### 代码质量检查

```bash
# 格式化代码
npm run format

# 检查代码质量
npm run lint

# 类型检查
npm run type-check

# 运行测试
npm run test
```

## 📝 代码注释快速模板

### 文件头注释

```typescript
/**
 * [模块名称]
 * [功能描述]
 *
 * 主要功能：
 * - [功能1]
 * - [功能2]
 */
```

### 函数注释

```typescript
/**
 * [函数功能描述]
 * @param param1 - 参数1说明
 * @param param2 - 参数2说明
 * @returns 返回值说明
 * @throws {ErrorType} 错误条件说明
 */
```

### React 组件注释

```typescript
/**
 * [组件名称]组件
 * [组件功能描述]
 */
interface ComponentProps {
  /** 属性说明 */
  prop: string
}

const Component: React.FC<ComponentProps> = ({ prop }) => {
  // 组件实现
}
```

## 🔧 Git 提交规范

### 提交类型

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 格式修改
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 添加测试
- `chore`: 构建工具

### 提交示例

```bash
git commit -m "feat(user): 添加用户头像上传功能"
git commit -m "fix(api): 修复用户列表分页错误"
git commit -m "docs: 更新开发文档"
```

## 🏗️ 代码结构模板

### API 控制器模板

```typescript
/**
 * [资源名称]控制器
 * 处理[资源名称]相关的 HTTP 请求
 */
export class ResourceController {
  constructor(private service: ResourceService) {}

  /**
   * 获取[资源名称]列表
   * @route GET /api/v1/resources
   */
  async getResources(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.service.getResources(req.query)
      res.json({ success: true, data: result })
    } catch (error) {
      next(error)
    }
  }
}
```

### React Hook 模板

```typescript
/**
 * [功能名称] Hook
 * [Hook 功能描述]
 */
function useFeature(param: string) {
  const [data, setData] = useState<DataType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Hook 逻辑实现
  }, [param])

  return { data, loading, error }
}
```

## 🔍 常用代码片段

### API 响应格式

```typescript
// 成功响应
res.json({
  success: true,
  data: result,
  message: '操作成功',
})

// 错误响应
res.status(400).json({
  success: false,
  error: {
    code: 'ERROR_CODE',
    message: '错误信息',
  },
})
```

### 表单验证（Zod）

```typescript
const schema = z.object({
  name: z.string().min(1, '名称不能为空'),
  email: z.string().email('邮箱格式不正确'),
  age: z.number().min(0, '年龄必须大于0'),
})

type FormData = z.infer<typeof schema>
```

### React Query 使用

```typescript
// 查询数据
const { data, isLoading, error } = useQuery({
  queryKey: ['users', filters],
  queryFn: () => api.getUsers(filters),
})

// 变更数据
const mutation = useMutation({
  mutationFn: api.createUser,
  onSuccess: () => {
    queryClient.invalidateQueries(['users'])
    toast.success('创建成功')
  },
})
```

## 📁 文件命名规范

```
components/
├── UserCard.tsx           # React 组件 (PascalCase)
├── user-card.module.css   # 样式文件 (kebab-case)
└── index.ts              # 导出文件

utils/
├── formatDate.ts         # 工具函数 (camelCase)
├── API_ENDPOINTS.ts      # 常量文件 (UPPER_SNAKE_CASE)
└── validation.ts         # 普通模块 (camelCase)
```

## 🎯 TypeScript 最佳实践

### 类型定义

```typescript
// 接口定义（对象结构）
interface User {
  id: string
  name: string
  email?: string // 可选属性
}

// 联合类型
type Status = 'pending' | 'approved' | 'rejected'

// 泛型使用
interface ApiResponse<T> {
  data: T
  success: boolean
}
```

### 错误处理

```typescript
// Result 模式
type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E }

// 使用示例
const result = await fetchUser(id)
if (result.success) {
  console.log(result.data) // 类型安全
} else {
  console.error(result.error)
}
```

## 🧪 测试模板

### 单元测试

```typescript
describe('UserService', () => {
  it('应该成功创建用户', async () => {
    // Arrange
    const userData = { name: 'John', email: 'john@example.com' }

    // Act
    const result = await userService.createUser(userData)

    // Assert
    expect(result.success).toBe(true)
    expect(result.data.name).toBe('John')
  })
})
```

### React 组件测试

```typescript
import { render, screen } from '@testing-library/react'
import UserCard from './UserCard'

describe('UserCard', () => {
  it('应该显示用户信息', () => {
    const user = { id: '1', name: 'John', email: 'john@example.com' }

    render(<UserCard user={user} />)

    expect(screen.getByText('John')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })
})
```

## 🔧 调试技巧

### 后端调试

```typescript
// 使用 logger
logger.info('用户创建成功', { userId, username })
logger.error('创建用户失败', { error: error.message, userId })

// 条件断点
if (process.env.NODE_ENV === 'development') {
  console.log('调试信息:', debugData)
}
```

### 前端调试

```typescript
// React DevTools
const DebugComponent = () => {
  console.log('组件重新渲染', { props, state })
  return <div>...</div>
}

// React Query DevTools（开发环境）
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
```

## 📊 性能优化

### React 性能优化

```typescript
// 使用 memo 避免不必要的重渲染
const UserCard = memo(({ user, onClick }) => {
  return <div onClick={() => onClick(user)}>...</div>
})

// 使用 useCallback 缓存函数
const handleClick = useCallback((user) => {
  console.log('点击用户:', user.name)
}, [])

// 使用 useMemo 缓存计算结果
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data)
}, [data])
```

### 后端性能优化

```typescript
// 数据库查询优化
const users = await prisma.user.findMany({
  where: { status: 'active' },
  select: { id: true, name: true, email: true }, // 只选择需要的字段
  take: 20, // 限制返回数量
})

// 缓存响应
const cachedResult = await redis.get(cacheKey)
if (cachedResult) {
  return JSON.parse(cachedResult)
}
```

## 🚨 常见问题解决

### 端口冲突

```bash
# 查看端口使用情况
netstat -ano | findstr ":3000"

# 杀死占用端口的进程
taskkill /PID <PID> /F
```

### 依赖问题

```bash
# 清理缓存重新安装
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### TypeScript 错误

```bash
# 重新生成类型文件
npx prisma generate

# 重启 TypeScript 服务
# VSCode: Ctrl+Shift+P -> TypeScript: Restart TS Server
```

这份快速参考文档涵盖了日常开发中最常用的规范和技巧，帮助开发者快速上手和保持代码质量。
