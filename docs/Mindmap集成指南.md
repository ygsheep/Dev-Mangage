# DevAPI Manager Mindmap 可视化组件集成指南

## 📋 概述

本指南详细说明如何将数据表关系可视化Mindmap组件集成到DevAPI Manager中，实现业务逻辑和数据表关系的可视化展示。

## 🎯 功能特性

### ✅ 已实现功能

- **可视化展示**: 支持项目、分类、数据表的层次化展示
- **交互操作**: 支持拖拽、缩放、选择、编辑
- **多种布局**: 层次布局、放射布局、力导向布局、环形布局
- **智能筛选**: 按节点类型、关系类型、状态筛选
- **导出功能**: 支持PNG、SVG、PDF、JSON、Mermaid格式导出
- **实时保存**: 布局和配置自动保存到数据库

### 🔧 技术栈

- **前端**: React 18 + TypeScript + React Flow + Zustand
- **后端**: Node.js + Express + Prisma + SQLite/PostgreSQL
- **样式**: Tailwind CSS
- **图形引擎**: React Flow

## 📦 安装依赖

### 前端依赖

```bash
cd packages/frontend
npm install reactflow zustand react-hot-toast
```

### 后端依赖

```bash
cd packages/backend
# 安装tsx用于TypeScript执行（如果未安装）
npm install tsx --save-dev
```

## 🗄️ 数据库迁移

### 1. 运行Prisma迁移

```bash
cd packages/backend
npx prisma db push
# 或创建迁移
npx prisma migrate dev --name add-mindmap-layout
```

### 2. 验证数据库表

确保以下表已创建：

- `mindmap_layouts`: 存储mindmap布局数据

## 🔧 后端集成

### 1. 添加mindmap端点配置

编辑 `packages/backend/src/config/api-endpoints.ts`:

```typescript
// 在API_ENDPOINTS中添加mindmap配置
MINDMAP: {
  BASE: `${API_CONFIG.PREFIX}/mindmap`,
  GET_DATA: (projectId: string | number) => `${API_CONFIG.PREFIX}/mindmap/${projectId}`,
  SAVE_LAYOUT: (projectId: string | number) => `${API_CONFIG.PREFIX}/mindmap/${projectId}/layout`,
  GET_LAYOUT: (projectId: string | number) => `${API_CONFIG.PREFIX}/mindmap/${projectId}/layout`,
  DELETE_LAYOUT: (projectId: string | number) => `${API_CONFIG.PREFIX}/mindmap/${projectId}/layout`,
  GET_STATS: (projectId: string | number) => `${API_CONFIG.PREFIX}/mindmap/${projectId}/stats`,
},
```

### 2. 注册mindmap路由

编辑 `packages/backend/src/routes/index.ts`:

```typescript
import { mindmapRouter } from './mindmap'

export const setupRoutes = (app: Express): void => {
  // ... 现有路由

  // 添加mindmap路由（注意顺序）
  app.use(API_ENDPOINTS.MINDMAP.BASE, mindmapRouter)

  // 在API documentation的endpoints中添加
  endpoints: {
    // ... 其他端点
    mindmap: API_ENDPOINTS.MINDMAP.BASE,
  }
}
```

### 3. 添加数据模型关系端点

编辑 `packages/backend/src/routes/dataModels.ts`:

```typescript
// 在文件开头添加（必须在参数化路由之前）
const relationshipsQuerySchema = z.object({
  projectId: z.string().uuid(),
})

router.get(
  '/relationships',
  validateQuery(relationshipsQuerySchema),
  asyncHandler(async (req, res) => {
    const { projectId } = req.query as any

    const relationships = await prisma.tableRelationship.findMany({
      where: {
        OR: [{ fromTable: { projectId } }, { toTable: { projectId } }],
      },
      include: {
        fromTable: { select: { id: true, name: true, displayName: true } },
        toTable: { select: { id: true, name: true, displayName: true } },
      },
    })

    res.json({
      success: true,
      data: { relationships },
    })
  })
)
```

### 4. 扩展API工具函数

编辑 `packages/frontend/src/utils/api.ts`:

```typescript
// 添加mindmap相关API
export const getMindmapData = async (projectId: string) => {
  return apiClient.get(`/mindmap/${projectId}`)
}

export const saveMindmapLayout = async (projectId: string, data: any) => {
  return apiClient.post(`/mindmap/${projectId}/layout`, data)
}

export const getMindmapLayout = async (projectId: string) => {
  return apiClient.get(`/mindmap/${projectId}/layout`)
}

export const deleteMindmapLayout = async (projectId: string) => {
  return apiClient.delete(`/mindmap/${projectId}/layout`)
}

export const getMindmapStats = async (projectId: string) => {
  return apiClient.get(`/mindmap/${projectId}/stats`)
}

export const getTableRelationships = async (projectId: string) => {
  return apiClient.get(`/data-models/relationships?projectId=${projectId}`)
}

// 更新apiMethods导出
export const apiMethods = {
  // ... 现有方法
  getMindmapData,
  saveMindmapLayout,
  getMindmapLayout,
  deleteMindmapLayout,
  getMindmapStats,
  getTableRelationships,
}
```

## 🎨 前端集成

### 1. 集成到项目详情页

编辑 `packages/frontend/src/pages/ProjectDetailPage.tsx`:

```typescript
import MindmapViewer from '../components/MindmapViewer'
import { GitBranch } from 'lucide-react'

// 在组件中添加新的Tab（注意更新类型）
const [activeTab, setActiveTab] = useState<'apis' | 'features' | 'models' | 'mindmap'>('apis')

// 在Tab导航中添加mindmap按钮
<button
  onClick={() => setActiveTab('mindmap')}
  className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
    activeTab === 'mindmap'
      ? 'border-blue-500 text-blue-600 bg-blue-50'
      : 'border-transparent text-gray-500 hover:text-text-secondary hover:border-gray-300 bg-bg-secondary'
  }`}
>
  <GitBranch className="w-4 h-4 mr-2" />
  关系图谱
</button>

// 在内容区域的条件渲染中添加（注意修正ternary结构）
) : activeTab === 'models' ? (
  /* Data Models Tab Content */
  <div className="card">
    {/* ... 数据模型内容 */}
  </div>
) : activeTab === 'mindmap' ? (
  /* Mindmap Tab Content */
  <div className="h-[calc(100vh-300px)]">
    <MindmapViewer
      projectId={id!}
      onNodeSelect={(node) => {
        if (node?.data.entityType === 'table') {
          console.log('Selected table:', node.data.entityId)
          // 可以在这里添加表节点选择的处理逻辑
        }
      }}
      onEdgeSelect={(edge) => {
        console.log('Selected relationship:', edge?.data.relationshipId)
        // 可以在这里添加关系选择的处理逻辑
      }}
    />
  </div>
) : null}
```

### 2. 添加到导航菜单

编辑 `packages/frontend/src/components/Layout.tsx`:

```typescript
// 在导航菜单中添加mindmap入口
{project && (
  <nav className="space-y-1">
    {/* 现有导航项 */}

    <Link
      to={`/projects/${project.id}/mindmap`}
      className="flex items-center px-3 py-2 text-sm font-medium text-text-secondary rounded-md hover:bg-bg-tertiary hover:text-text-primary"
    >
      <GitBranch className="w-5 h-5 mr-3" />
      关系图谱
    </Link>
  </nav>
)}
```

### 3. 创建独立mindmap页面

创建 `packages/frontend/src/pages/MindmapPage.tsx`:

```typescript
import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, GitBranch } from 'lucide-react'
import { apiMethods } from '../utils/api'
import MindmapViewer from '../components/MindmapViewer'

const MindmapPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()

  // Fetch project details for title
  const { data: projectData, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => apiMethods.getProject(projectId!),
    enabled: !!projectId,
  })

  const project = projectData?.data?.project

  if (!projectId) {
    return (
      <div className="card text-center py-12">
        <h3 className="text-lg font-medium text-text-primary mb-2">
          项目ID缺失
        </h3>
        <p className="text-text-secondary mb-6">
          请通过有效的项目链接访问
        </p>
        <Link to="/projects" className="btn-primary">
          返回项目列表
        </Link>
      </div>
    )
  }

  if (projectLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-48 h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="w-full h-screen bg-gray-200 rounded animate-pulse"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="card text-center py-12">
        <h3 className="text-lg font-medium text-text-primary mb-2">
          项目不存在
        </h3>
        <p className="text-text-secondary mb-6">
          请检查项目ID是否正确
        </p>
        <Link to="/projects" className="btn-primary">
          返回项目列表
        </Link>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-bg-paper border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-4">
          <Link
            to={`/projects/${projectId}`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center space-x-3">
            <GitBranch className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-text-primary">
                {project.name} - 关系图谱
              </h1>
              <p className="text-sm text-text-secondary">
                数据表关系可视化展示
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mindmap Viewer */}
      <div className="flex-1 overflow-hidden">
        <MindmapViewer
          projectId={projectId}
          height="100%"
          className="w-full"
          onNodeSelect={(node) => {
            if (node?.data.entityType === 'table') {
              console.log('Selected table:', node.data.entityId)
              // 可以在这里添加表节点选择的处理逻辑
            }
          }}
          onEdgeSelect={(edge) => {
            console.log('Selected relationship:', edge?.data.relationshipId)
            // 可以在这里添加关系选择的处理逻辑
          }}
        />
      </div>
    </div>
  )
}

export default MindmapPage
```

### 4. 创建缺失的边组件

创建 `packages/frontend/src/components/MindmapViewer/edges/ForeignKeyEdge.tsx`:

```typescript
import React from 'react'
import { EdgeProps, getBezierPath } from 'reactflow'

const ForeignKeyEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
}) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          stroke: '#f59e0b',
          strokeWidth: 2,
          strokeDasharray: '5,5',
        }}
        className="react-flow__edge-path"
        d={edgePath}
      />
      {data?.label && (
        <text
          x={(sourceX + targetX) / 2}
          y={(sourceY + targetY) / 2}
          className="text-xs fill-gray-600"
          textAnchor="middle"
          dy={-5}
        >
          {data.label}
        </text>
      )}
    </>
  )
}

export default ForeignKeyEdge
```

创建 `packages/frontend/src/components/MindmapViewer/edges/ReferenceEdge.tsx`:

```typescript
import React from 'react'
import { EdgeProps, getBezierPath } from 'reactflow'

const ReferenceEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
}) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          stroke: '#10b981',
          strokeWidth: 2,
        }}
        className="react-flow__edge-path"
        d={edgePath}
      />
      {data?.label && (
        <text
          x={(sourceX + targetX) / 2}
          y={(sourceY + targetY) / 2}
          className="text-xs fill-gray-600"
          textAnchor="middle"
          dy={-5}
        >
          {data.label}
        </text>
      )}
    </>
  )
}

export default ReferenceEdge
```

### 5. 更新路由配置

编辑 `packages/frontend/src/App.tsx` 或路由配置文件:

```typescript
import MindmapPage from './pages/MindmapPage'

// 添加路由
<Route path="/projects/:projectId/mindmap" element={<MindmapPage />} />
```

## 🚀 使用示例

### 基础使用

```typescript
import MindmapViewer from '../components/MindmapViewer'

function MyComponent() {
  return (
    <MindmapViewer
      projectId="your-project-id"
      height="600px"
      onNodeSelect={(node) => {
        console.log('Node selected:', node)
      }}
      onEdgeSelect={(edge) => {
        console.log('Edge selected:', edge)
      }}
    />
  )
}
```

### 高级配置

```typescript
import { useMindmapStore } from '../stores/mindmapStore'

function AdvancedMindmap() {
  const { config, updateConfig } = useMindmapStore()

  // 自定义配置
  const customConfig = {
    layout: {
      type: 'radial',
      direction: 'TB',
      spacing: { node: 150, level: 200 }
    },
    display: {
      showLabels: true,
      compactMode: false
    }
  }

  useEffect(() => {
    updateConfig(customConfig)
  }, [])

  return <MindmapViewer projectId="project-id" />
}
```

### 监听事件

```typescript
function EventExample() {
  const handleNodeChange = useCallback((nodes: MindmapNode[]) => {
    // 节点变更时的处理逻辑
    console.log('Nodes changed:', nodes)

    // 可以在这里触发保存操作
    // saveMindmapLayout(...)
  }, [])

  return (
    <MindmapViewer
      projectId="project-id"
      onNodesChange={handleNodeChange}
    />
  )
}
```

## 🎛️ 配置选项

### 布局配置

```typescript
interface LayoutConfig {
  type: 'hierarchical' | 'radial' | 'force' | 'circular'
  direction: 'TB' | 'BT' | 'LR' | 'RL' // 仅层次布局
  spacing: {
    node: number // 节点间距
    level: number // 层级间距
  }
  animation: {
    enabled: boolean // 启用动画
    duration: number // 动画持续时间(ms)
  }
}
```

### 显示配置

```typescript
interface DisplayConfig {
  showLabels: boolean // 显示节点标签
  showIcons: boolean // 显示节点图标
  showStatistics: boolean // 显示统计信息
  showRelationshipLabels: boolean // 显示关系标签
  compactMode: boolean // 紧凑模式
}
```

### 交互配置

```typescript
interface InteractionConfig {
  enableDrag: boolean // 启用拖拽
  enableZoom: boolean // 启用缩放
  enableSelection: boolean // 启用选择
  enableCollapse: boolean // 启用折叠
  autoLayout: boolean // 自动布局
}
```

## 🎨 样式定制

### CSS变量

```css
/* 在你的CSS文件中定义mindmap主题变量 */
.mindmap-viewer {
  --mindmap-bg-color: #f9fafb;
  --mindmap-node-border: #e5e7eb;
  --mindmap-node-hover: #f3f4f6;
  --mindmap-edge-color: #9ca3af;
  --mindmap-selection-color: #3b82f6;
}
```

### 自定义节点样式

```typescript
// 在MindmapViewer/nodes/CustomTableNode.tsx中
const CustomTableNode: React.FC<TableNodeProps> = ({ data, selected }) => {
  return (
    <div
      className={`
        custom-table-node
        ${selected ? 'selected' : ''}
        ${data.status === 'ACTIVE' ? 'active' : ''}
      `}
      style={{
        backgroundColor: data.color,
        // 其他自定义样式
      }}
    >
      {/* 自定义节点内容 */}
    </div>
  )
}
```

## 🔍 调试和开发

### 开发模式

```bash
# 启动前端开发服务器
cd packages/frontend
npm run dev

# 启动后端开发服务器
cd packages/backend
npm run dev
```

### 调试技巧

1. **React DevTools**: 查看组件状态和props
2. **Network Tab**: 检查API请求和响应
3. **Console**: 查看mindmap事件日志
4. **Zustand DevTools**: 监控状态变化

### 常见问题排查

#### 1. ReactFlow 警告: Unknown event handler property `onViewportChange`

**问题**: React DevTools 显示 `onViewportChange` 警告
**解决方案**: 移除 ReactFlow 组件中的 `onViewportChange` 属性，新版本不再需要

```typescript
// 错误的写法 ❌
<ReactFlow
  onViewportChange={onViewportChange}
  // ...
/>

// 正确的写法 ✅
<ReactFlow
  // 移除 onViewportChange 属性
  // ...
/>
```

#### 2. API 400 错误: `/data-models/relationships` 端点不存在

**问题**: 前端请求 relationships 端点时返回 400 错误
**解决方案**: 在 dataModels 路由中添加 relationships 端点，**必须放在参数化路由之前**

```typescript
// 在 packages/backend/src/routes/dataModels.ts 的开头添加
router.get('/relationships', validateQuery(relationshipsQuerySchema), ...)
// 然后才是其他路由
router.get('/:id', ...)
```

#### 3. 后端编译错误: 重复声明 `relationshipsQuerySchema`

**问题**: tsx 编译时报错重复声明
**解决方案**: 确保只声明一次 schema，检查是否有重复的导入或声明

#### 4. tsx 命令未找到错误

**问题**: `'tsx' is not recognized as an internal or external command`
**解决方案**: 安装 tsx 依赖

```bash
cd packages/backend
npm install tsx --save-dev
```

#### 5. 数据不显示

```typescript
// 检查数据加载
const { isLoading, nodes, edges } = useMindmapStore()
console.log('Loading:', isLoading)
console.log('Nodes:', nodes.length)
console.log('Edges:', edges.length)
```

#### 6. 布局异常

```typescript
// 检查布局配置
const { config } = useMindmapStore()
console.log('Layout config:', config.layout)

// 重新应用布局
const { applyLayout } = useMindmapStore()
applyLayout('hierarchical')
```

#### 7. API错误调试

```bash
# 检查后端路由注册
curl http://localhost:3000/api/v1/mindmap/PROJECT_ID

# 检查 relationships 端点
curl "http://localhost:3000/api/v1/data-models/relationships?projectId=PROJECT_ID"

# 检查数据库连接
npx prisma studio
```

## 📊 性能优化

### 1. 大数据集处理

```typescript
// 使用虚拟化和筛选
const { getFilteredNodes, getFilteredEdges } = useMindmapStore()

// 限制显示的节点数量
const maxNodes = 100
const displayNodes = getFilteredNodes().slice(0, maxNodes)
```

### 2. 动画优化

```typescript
// 禁用复杂动画以提升性能
updateConfig({
  layout: {
    ...config.layout,
    animation: { enabled: false, duration: 0 },
  },
})
```

### 3. 缓存策略

```typescript
// 在useMindmapStore中启用缓存
const cachedData = useMemo(() => {
  return computeExpensiveLayout(nodes, edges)
}, [nodes, edges])
```

## 📋 测试

### 单元测试

```bash
cd packages/frontend
npm test -- MindmapViewer
```

### 集成测试

```typescript
// 测试mindmap数据加载
test('should load mindmap data', async () => {
  const { loadMindmapData } = useMindmapStore.getState()
  await loadMindmapData('test-project-id')

  const { nodes, edges } = useMindmapStore.getState()
  expect(nodes.length).toBeGreaterThan(0)
  expect(edges.length).toBeGreaterThan(0)
})
```

## 🔐 安全考虑

1. **权限控制**: 确保用户只能查看有权限的项目数据
2. **数据验证**: 前后端都要验证mindmap数据格式
3. **SQL注入防护**: 使用Prisma的类型安全查询

## 📚 扩展功能

### 1. 自定义节点类型

```typescript
// 添加新的节点类型
enum CustomNodeType {
  SERVICE = 'service',
  MODULE = 'module',
}

// 创建自定义节点组件
const ServiceNode: React.FC<NodeProps> = ({ data }) => {
  // 自定义服务节点实现
}
```

### 2. 插件系统

```typescript
// 注册mindmap插件
const customPlugin = {
  name: 'tableMetrics',
  nodeEnhancer: (node: MindmapNode) => {
    // 增强节点数据
    return { ...node, metrics: calculateMetrics(node) }
  },
}

mindmapLayoutService.registerPlugin(customPlugin)
```

### 3. 导出扩展

```typescript
// 添加自定义导出格式
const exportToExcel = async (nodes: MindmapNode[], edges: MindmapEdge[]) => {
  // 实现Excel导出逻辑
  const workbook = createExcelWorkbook(nodes, edges)
  return workbook.writeBuffer()
}
```

## 🚀 部署注意事项

1. **环境变量**: 确保生产环境配置正确
2. **数据库迁移**: 在部署前运行数据库迁移
3. **静态资源**: 确保mindmap相关的CSS和JS资源正确打包
4. **缓存策略**: 配置适当的HTTP缓存头

---

## 📞 技术支持

如果在集成过程中遇到问题，请：

1. 检查控制台错误信息
2. 查看网络请求是否正常
3. 确认数据库表结构正确
4. 参考示例代码和配置

## 🚀 快速开始

### 开发环境启动

```bash
# 启动完整开发环境
npm run dev

# 或者分别启动
npm run dev:backend   # 后端 (localhost:3000)
npm run dev:frontend  # 前端 (localhost:5173)
```

### 访问Mindmap功能

1. **项目详情页集成**:
   - 访问: `http://localhost:5173/projects/{PROJECT_ID}`
   - 点击"关系图谱"标签页

2. **独立全屏页面**:
   - 访问: `http://localhost:5173/projects/{PROJECT_ID}/mindmap`

### 验证功能

```bash
# 检查后端API
curl "http://localhost:3000/api/v1/mindmap/PROJECT_ID"
curl "http://localhost:3000/api/v1/data-models/relationships?projectId=PROJECT_ID"

# 检查项目列表获取有效PROJECT_ID
curl "http://localhost:3000/api/v1/projects"
```

### 当前状态

- ✅ 数据库包含 mindmap_layouts 表
- ✅ 后端 API 端点已就绪
- ✅ 前端组件已集成
- ✅ 路由配置完成
- ✅ 所有已知问题已修复

**完整的Mindmap可视化组件已准备就绪，可以开始集成和使用！**
