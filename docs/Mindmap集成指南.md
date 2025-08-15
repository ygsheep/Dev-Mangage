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
# 无需额外依赖，使用现有Prisma和Express
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

### 1. 注册mindmap路由
编辑 `packages/backend/src/routes/index.ts`:

```typescript
import { mindmapRouter } from './mindmap'

export const setupRoutes = (app: Express): void => {
  // ... 现有路由
  
  // 添加mindmap路由
  app.use('/api/v1/mindmap', mindmapRouter)
}
```

### 2. 扩展API工具函数
编辑 `packages/frontend/src/utils/api.ts`:

```typescript
// 添加mindmap相关API
export const getMindmapData = async (projectId: string) => {
  return apiClient.get(`/mindmap/${projectId}`)
}

export const saveMindmapLayout = async (data: any) => {
  return apiClient.post(`/mindmap/${data.projectId}/layout`, data)
}

export const getMindmapLayout = async (projectId: string) => {
  return apiClient.get(`/mindmap/${projectId}/layout`)
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
  getTableRelationships,
}
```

## 🎨 前端集成

### 1. 集成到项目详情页
编辑 `packages/frontend/src/pages/ProjectDetailPage.tsx`:

```typescript
import MindmapViewer from '../components/MindmapViewer'

// 在组件中添加新的Tab
const [activeTab, setActiveTab] = useState<'apis' | 'models' | 'mindmap'>('apis')

// 在Tab导航中添加
<button
  onClick={() => setActiveTab('mindmap')}
  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
    activeTab === 'mindmap'
      ? 'border-blue-500 text-blue-600'
      : 'border-transparent text-gray-500 hover:text-gray-700'
  }`}
>
  <GitBranch className="w-4 h-4 mr-2" />
  关系图谱
</button>

// 在内容区域添加
{activeTab === 'mindmap' && (
  <div className="h-[calc(100vh-200px)]">
    <MindmapViewer
      projectId={projectId}
      onNodeSelect={(node) => {
        if (node?.data.entityType === 'table') {
          // 处理表节点选择
          console.log('Selected table:', node.data.entityId)
        }
      }}
      onEdgeSelect={(edge) => {
        // 处理关系选择
        console.log('Selected relationship:', edge?.data.relationshipId)
      }}
    />
  </div>
)}
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
      className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
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
import { useParams } from 'react-router-dom'
import MindmapViewer from '../components/MindmapViewer'

const MindmapPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()

  if (!projectId) {
    return <div>Project ID is required</div>
  }

  return (
    <div className="h-screen">
      <MindmapViewer
        projectId={projectId}
        height="100vh"
        className="w-full"
        onNodeSelect={(node) => {
          // 处理节点选择
        }}
        onEdgeSelect={(edge) => {
          // 处理边选择
        }}
      />
    </div>
  )
}

export default MindmapPage
```

### 4. 更新路由配置
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
  direction: 'TB' | 'BT' | 'LR' | 'RL'  // 仅层次布局
  spacing: {
    node: number      // 节点间距
    level: number     // 层级间距
  }
  animation: {
    enabled: boolean  // 启用动画
    duration: number  // 动画持续时间(ms)
  }
}
```

### 显示配置
```typescript
interface DisplayConfig {
  showLabels: boolean              // 显示节点标签
  showIcons: boolean              // 显示节点图标
  showStatistics: boolean         // 显示统计信息
  showRelationshipLabels: boolean // 显示关系标签
  compactMode: boolean           // 紧凑模式
}
```

### 交互配置
```typescript
interface InteractionConfig {
  enableDrag: boolean      // 启用拖拽
  enableZoom: boolean      // 启用缩放
  enableSelection: boolean // 启用选择
  enableCollapse: boolean  // 启用折叠
  autoLayout: boolean     // 自动布局
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

#### 1. 数据不显示
```typescript
// 检查数据加载
const { isLoading, nodes, edges } = useMindmapStore()
console.log('Loading:', isLoading)
console.log('Nodes:', nodes.length)
console.log('Edges:', edges.length)
```

#### 2. 布局异常
```typescript
// 检查布局配置
const { config } = useMindmapStore()
console.log('Layout config:', config.layout)

// 重新应用布局
const { applyLayout } = useMindmapStore()
applyLayout('hierarchical')
```

#### 3. API错误
```bash
# 检查后端路由注册
curl http://localhost:3001/api/v1/mindmap/PROJECT_ID

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
    animation: { enabled: false, duration: 0 }
  }
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
  MODULE = 'module'
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
  }
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

**完整的Mindmap可视化组件已准备就绪，可以开始集成和使用！**