# 🌐 DevAPI Manager - Frontend

DevAPI Manager 的前端界面，基于 React + TypeScript + Vite 构建，提供现代化的API管理用户体验。

## 🎯 核心功能

### 📊 项目管理

- **项目仪表板**: 直观的项目概览和统计
- **项目创建**: 快速创建和配置API项目
- **项目编辑**: 完整的项目信息管理
- **批量操作**: 支持项目的批量导入和导出

### 🔍 API管理

- **接口列表**: 清晰的API接口列表视图
- **接口详情**: 详细的API文档和参数说明
- **快速搜索**: 实时的API搜索和筛选
- **标签管理**: 灵活的标签分类系统

### 🎨 用户界面

- **响应式设计**: 完美适配桌面和移动设备
- **主题系统**: 支持浅色/深色主题切换
- **组件库**: 基于Tailwind CSS的现代UI组件
- **交互动效**: 流畅的页面转场和交互反馈

### 🧠 MCP集成

- **可视化控制**: MCP服务器的图形化管理界面
- **实时监控**: 服务器状态、性能指标实时显示
- **日志查看**: 实时日志流和历史日志查看
- **搜索体验**: 集成向量搜索和智能推荐

### 🛠️ 开发工具

- **调试面板**: 内置的开发调试工具
- **性能监控**: 实时的性能指标和内存使用
- **网络监控**: HTTP请求的详细监控和分析
- **组件状态**: React组件状态的实时查看

## 🚀 快速开始

### 系统要求

- **Node.js**: 18.0+
- **NPM**: 8.0+
- **现代浏览器**: Chrome 90+, Firefox 90+, Safari 14+

### 安装依赖

```bash
npm install
```

### 开发服务器

```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:5173
```

### 构建部署

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 类型检查
npm run type-check

# 代码检查
npm run lint
```

## 📁 项目结构

```
packages/frontend/
├── src/
│   ├── components/          # 可复用组件
│   │   ├── Layout.tsx       # 页面布局组件
│   │   ├── QuickSearch.tsx  # 快速搜索组件
│   │   ├── MCPServerControl.tsx # MCP服务器控制
│   │   ├── ProjectCard.tsx  # 项目卡片组件
│   │   ├── APICard.tsx      # API卡片组件
│   │   └── ...              # 其他UI组件
│   ├── pages/               # 页面组件
│   │   ├── HomePage.tsx     # 首页
│   │   ├── ProjectsPage.tsx # 项目页面
│   │   ├── SettingsPage.tsx # 设置页面
│   │   └── ...              # 其他页面
│   ├── hooks/               # 自定义Hook
│   │   ├── useMCPSearch.ts  # MCP搜索Hook
│   │   └── ...              # 其他Hook
│   ├── utils/               # 工具函数
│   │   ├── api.ts          # API请求封装
│   │   └── ...              # 其他工具
│   ├── api/                 # API接口定义
│   │   ├── mcpServer.ts    # MCP服务器API
│   │   └── ...              # 其他API模块
│   ├── debug/               # 调试工具
│   │   ├── index.ts        # 调试工具入口
│   │   ├── Logger.ts       # 日志系统
│   │   ├── DebugPanel.tsx  # 调试面板
│   │   └── ...              # 其他调试组件
│   ├── types/               # TypeScript类型定义
│   ├── styles/              # 样式文件
│   ├── assets/              # 静态资源
│   │   └── fonts/          # 字体文件
│   ├── App.tsx             # 根组件
│   ├── main.tsx            # 应用入口
│   └── vite-env.d.ts       # Vite类型声明
├── public/                 # 公共资源
├── index.html             # HTML模板
├── package.json           # 包配置
├── vite.config.ts         # Vite配置
├── tailwind.config.js     # Tailwind配置
└── tsconfig.json         # TypeScript配置
```

## 🎨 技术栈

### 核心框架

- **React 18**: 用户界面框架
- **TypeScript**: 类型安全的JavaScript
- **Vite**: 现代化的构建工具
- **React Router**: 客户端路由管理

### UI框架

- **Tailwind CSS**: 原子化CSS框架
- **Lucide React**: 现代化图标库
- **Headless UI**: 无样式可访问组件
- **Framer Motion**: 动画库

### 状态管理

- **TanStack Query**: 服务器状态管理
- **Zustand**: 轻量级状态管理
- **React Hook Form**: 表单状态管理

### 开发工具

- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化
- **TypeScript**: 静态类型检查
- **Vite DevTools**: 开发调试工具

## 🔧 配置说明

### Vite配置

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@headlessui/react', 'lucide-react'],
        },
      },
    },
  },
})
```

### Tailwind配置

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['OPPO Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono Nerd Font', 'monospace'],
      },
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
}
```

### TypeScript配置

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## 🎯 核心组件

### 布局组件

```tsx
// Layout.tsx - 主布局组件
const Layout: React.FC = () => {
  const location = useLocation()
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <div className="min-h-screen bg-bg-paper">
      {/* 侧边栏 */}
      <Sidebar />

      {/* 主内容区域 */}
      <main className="pl-64">
        <Outlet />
      </main>

      {/* 快速搜索 */}
      <QuickSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  )
}
```

### 搜索组件

```tsx
// QuickSearch.tsx - 快速搜索组件
const QuickSearch: React.FC<Props> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('')
  const { data: results, isLoading } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchAPI(query),
    enabled: query.length > 0,
  })

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <div className="fixed inset-0 bg-black/25" />
      <div className="fixed inset-0 flex items-start justify-center pt-[15vh]">
        <Dialog.Panel className="w-full max-w-2xl bg-bg-paper rounded-lg shadow-xl">
          <SearchInput value={query} onChange={setQuery} placeholder="搜索API、项目、标签..." />
          <SearchResults results={results} isLoading={isLoading} onSelect={onClose} />
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
```

### MCP控制组件

```tsx
// MCPServerControl.tsx - MCP服务器控制
const MCPServerControl: React.FC = () => {
  const [serverStatus, setServerStatus] = useState<MCPServerStatus>()
  const [isStarting, setIsStarting] = useState(false)

  const startServer = async () => {
    setIsStarting(true)
    try {
      const result = await mcpServerAPI.start()
      if (result.success) {
        // 更新状态
      }
    } catch (error) {
      console.error('启动失败:', error)
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <div className="bg-bg-paper rounded-lg shadow border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">MCP 服务器</h3>
        <ServerStatus status={serverStatus} />
      </div>

      <div className="flex space-x-3">
        <Button onClick={startServer} disabled={isStarting} className="bg-green-600 text-white">
          {isStarting ? '启动中...' : '启动服务器'}
        </Button>
      </div>

      <ServerMetrics status={serverStatus} />
      <ServerLogs />
    </div>
  )
}
```

## 🔌 API集成

### API请求封装

```typescript
// api.ts - API请求封装
class APIClient {
  private baseURL = 'http://localhost:3000/api'

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  // 项目管理
  getProjects = () => this.request<Project[]>('/projects')
  createProject = (data: CreateProjectData) =>
    this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    })

  // API管理
  getAPIs = (projectId?: string) =>
    this.request<API[]>(`/apis${projectId ? `?projectId=${projectId}` : ''}`)

  searchAPIs = (query: string, filters?: SearchFilters) =>
    this.request<SearchResult[]>('/apis/search', {
      method: 'POST',
      body: JSON.stringify({ query, ...filters }),
    })
}

export const apiClient = new APIClient()
```

### React Query集成

```typescript
// hooks/useProjects.ts - 项目数据Hook
export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: apiClient.getProjects,
    staleTime: 5 * 60 * 1000, // 5分钟
    cacheTime: 10 * 60 * 1000, // 10分钟
  })
}

export const useCreateProject = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: apiClient.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries(['projects'])
    },
  })
}
```

### MCP搜索Hook

```typescript
// hooks/useMCPSearch.ts - MCP搜索Hook
export const useMCPSearch = (query: string, options: SearchOptions = {}) => {
  return useQuery({
    queryKey: ['mcp-search', query, options],
    queryFn: async () => {
      if (!query.trim()) return []

      // 使用MCP向量搜索
      const vectorResults = await mcpServerAPI.vectorSearch(query, {
        limit: options.limit || 10,
        threshold: options.threshold || 0.3,
      })

      // 混合搜索结果
      const hybridResults = await mcpServerAPI.hybridSearch(query, {
        vectorWeight: 0.6,
        fuzzyWeight: 0.4,
      })

      return {
        vector: vectorResults,
        hybrid: hybridResults,
        total: vectorResults.length + hybridResults.length,
      }
    },
    enabled: query.length > 0,
    staleTime: 30 * 1000, // 30秒
    keepPreviousData: true,
  })
}
```

## 🎨 样式系统

### 颜色系统

```css
/* 主题颜色定义 */
:root {
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-900: #1e3a8a;

  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-500: #6b7280;
  --color-gray-900: #111827;
}
```

### 组件样式

```tsx
// 使用Tailwind的组件样式
const Button = ({ variant, size, children, ...props }) => {
  const baseStyles =
    'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2'

  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-text-primary hover:bg-gray-300 focus:ring-gray-500',
    outline:
      'border border-gray-300 bg-bg-secondary focus:outline-none bg-bg-paper text-text-secondary hover:bg-bg-tertiary',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  const className = `${baseStyles} ${variants[variant]} ${sizes[size]}`

  return (
    <button className={className} {...props}>
      {children}
    </button>
  )
}
```

### 响应式设计

```tsx
// 响应式组件布局
const ProjectGrid = ({ projects }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {projects.map(project => (
        <ProjectCard
          key={project.id}
          project={project}
          className="transform hover:scale-105 transition-transform duration-200"
        />
      ))}
    </div>
  )
}
```

## 🧪 调试工具

### 调试面板

```tsx
// debug/DebugPanel.tsx - 调试面板
const DebugPanel: React.FC = () => {
  const { logs, networkRequests, performance } = useDebugStore()
  const [activeTab, setActiveTab] = useState('logs')

  return (
    <DraggableWindow title="调试面板" defaultPosition={{ x: 20, y: 20 }}>
      <div className="w-96 h-64 bg-gray-900 text-green-400 font-mono text-xs">
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="p-2 h-48 overflow-y-auto">
          {activeTab === 'logs' && <LogsTab logs={logs} />}
          {activeTab === 'network' && <NetworkTab requests={networkRequests} />}
          {activeTab === 'performance' && <PerformanceTab metrics={performance} />}
        </div>
      </div>
    </DraggableWindow>
  )
}
```

### 性能监控

```typescript
// debug/PerformanceMonitor.ts - 性能监控
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []

  measureComponentRender(componentName: string) {
    const start = performance.now()

    return () => {
      const end = performance.now()
      const duration = end - start

      this.addMetric({
        name: `${componentName} Render`,
        value: duration,
        unit: 'ms',
        type: 'timing',
        timestamp: Date.now(),
      })
    }
  }

  measureAPICall(endpoint: string) {
    const start = performance.now()

    return (response: Response) => {
      const end = performance.now()
      const duration = end - start

      this.addMetric({
        name: `API ${endpoint}`,
        value: duration,
        unit: 'ms',
        type: 'timing',
        timestamp: Date.now(),
        extra: {
          status: response.status,
          url: response.url,
        },
      })
    }
  }
}
```

## 📱 响应式设计

### 断点系统

```javascript
// Tailwind断点配置
const screens = {
  sm: '640px', // 手机横屏
  md: '768px', // 平板
  lg: '1024px', // 小桌面
  xl: '1280px', // 大桌面
  '2xl': '1536px', // 超大桌面
}
```

### 移动端适配

```tsx
// 移动端导航组件
const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="md:hidden">
      <button onClick={() => setIsOpen(true)} className="p-2 rounded-lg bg-gray-100">
        <Menu className="h-6 w-6" />
      </button>

      <Transition show={isOpen}>
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/25" onClick={() => setIsOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-64 bg-bg-paper shadow-xl">
            <NavigationMenu onItemClick={() => setIsOpen(false)} />
          </div>
        </div>
      </Transition>
    </div>
  )
}
```

## 🚀 性能优化

### 代码分割

```tsx
// 路由级别的代码分割
const HomePage = lazy(() => import('./pages/HomePage'))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

const App = () => {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Suspense>
    </Router>
  )
}
```

### 组件优化

```tsx
// 使用memo优化组件重渲染
const ProjectCard = memo(({ project }: { project: Project }) => {
  return (
    <div className="bg-bg-paper rounded-lg shadow p-4">
      <h3 className="font-semibold text-text-primary">{project.name}</h3>
      <p className="text-text-secondary text-sm mt-1">{project.description}</p>
      <div className="mt-3 flex items-center space-x-2">
        <Badge variant="outline">{project.version}</Badge>
        <span className="text-xs text-gray-500">{project.apis.length} APIs</span>
      </div>
    </div>
  )
})
```

### 虚拟滚动

```tsx
// 大列表虚拟滚动
import { FixedSizeList as List } from 'react-window'

const APIList = ({ apis }: { apis: API[] }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <APICard api={apis[index]} />
    </div>
  )

  return (
    <List height={600} itemCount={apis.length} itemSize={80} width="100%">
      {Row}
    </List>
  )
}
```

## 🧪 测试

### 组件测试

```tsx
// __tests__/ProjectCard.test.tsx
import { render, screen } from '@testing-library/react'
import { ProjectCard } from '../components/ProjectCard'

describe('ProjectCard', () => {
  const mockProject = {
    id: '1',
    name: 'Test Project',
    description: 'Test Description',
    version: '1.0.0',
    apis: [],
  }

  it('renders project information correctly', () => {
    render(<ProjectCard project={mockProject} />)

    expect(screen.getByText('Test Project')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
    expect(screen.getByText('1.0.0')).toBeInTheDocument()
  })
})
```

### E2E测试

```typescript
// e2e/search.spec.ts
import { test, expect } from '@playwright/test'

test('search functionality works correctly', async ({ page }) => {
  await page.goto('http://localhost:5173')

  // 打开搜索
  await page.keyboard.press('Control+k')

  // 输入搜索词
  await page.fill('[data-testid="search-input"]', 'user api')

  // 验证搜索结果
  await expect(page.locator('[data-testid="search-results"]')).toBeVisible()
  await expect(page.locator('.search-result-item')).toHaveCount.greaterThan(0)
})
```

## 🔗 相关文档

- [React文档](https://react.dev/)
- [TypeScript文档](https://www.typescriptlang.org/docs)
- [Vite文档](https://vitejs.dev/)
- [Tailwind CSS文档](https://tailwindcss.com/docs)
- [TanStack Query文档](https://tanstack.com/query)

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](../../LICENSE) 文件了解详情。

---

**DevAPI Manager Frontend** - 现代化、响应式、高性能的API管理界面！ 🚀
