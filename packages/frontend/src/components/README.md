# DevAPI Manager 前端组件开发文档

## 目录

- [项目概述](#项目概述)
- [组件架构](#组件架构)
- [暗色模式支持](#暗色模式支持)
- [组件开发规范](#组件开发规范)
- [扩展指南](#扩展指南)
- [最佳实践](#最佳实践)
- [故障排除](#故障排除)

## 项目概述

DevAPI Manager 是一个现代化的 API 管理平台，采用 React 18 + TypeScript + Tailwind CSS 技术栈。前端组件系统采用模块化设计，支持完整的暗色模式主题切换。

### 技术栈

- **前端框架**: React 18 + TypeScript
- **状态管理**: Zustand + React Query
- **样式系统**: Tailwind CSS + CSS Variables
- **图标库**: Lucide React
- **表单处理**: React Hook Form + Zod

## 组件架构

### 目录结构

```
src/components/
├── features/              # 功能特性组件
│   ├── api/              # API 管理相关组件
│   │   ├── components/   # API 基础组件
│   │   └── modals/       # API 相关弹窗
│   ├── api-management/   # API 管理扩展组件
│   ├── data-model/       # 数据模型组件
│   ├── data-visualization/ # 数据可视化组件
│   ├── import/           # 导入功能组件
│   ├── mindmap/          # 思维导图组件
│   ├── project/          # 项目管理组件
│   ├── search/           # 搜索功能组件
│   └── settings/         # 设置页面组件
├── integrations/         # 第三方集成组件
│   ├── ai/              # AI 服务集成
│   └── mcp/             # MCP 服务集成
├── layout/              # 布局组件
├── shared/              # 共享组件
├── ui/                  # 基础 UI 组件
└── common/              # 通用工具组件
```

### 组件分类

1. **功能组件 (Features)**: 实现具体业务功能的组件
2. **布局组件 (Layout)**: 页面布局和导航组件
3. **集成组件 (Integrations)**: 第三方服务集成组件
4. **共享组件 (Shared)**: 跨功能模块复用的组件
5. **UI 组件 (UI)**: 基础界面组件库
6. **通用组件 (Common)**: 通用工具和预览组件

## 暗色模式支持

### 设计原则

DevAPI Manager 采用基于 CSS Variables 的主题系统，实现了完整的暗色模式支持。

### 主题变量系统

#### 语义化色彩变量

```css
/* 主色调 */
--color-primary-50: #eff6ff;
--color-primary-100: #dbeafe;
--color-primary-500: #3b82f6;
--color-primary-600: #2563eb;
--color-primary-700: #1d4ed8;

/* 语义化状态色 */
--color-success-*: /* 成功状态 */ --color-warning- *: /* 警告状态 */
  --color-danger- *: /* 错误状态 */ --color-info- *: /* 信息提示 */ /* 文本色彩 */
  --color-text-primary: /* 主要文本 */ --color-text-secondary: /* 次要文本 */
  --color-text-tertiary: /* 辅助文本 */ /* 背景色彩 */ --color-bg-primary: /* 主背景 */
  --color-bg-secondary: /* 次背景 */ --color-bg-paper: /* 卡片背景 */
  --color-bg-tertiary: /* 三级背景 */ /* 边框色彩 */ --color-border-primary: /* 主边框 */
  --color-border-secondary: /* 次边框 */;
```

### 暗色模式实现指南

#### 1. 使用语义化类名

**✅ 正确做法:**

```tsx
// 使用语义化主题变量
<div className="bg-bg-paper text-text-primary border-border-primary">
  <button className="bg-primary-600 text-white hover:bg-primary-700">确认</button>
</div>
```

**❌ 错误做法:**

```tsx
// 硬编码颜色值
<div className="bg-bg-paper text-text-primary border-gray-200">
  <button className="bg-blue-600 text-white hover:bg-blue-700">确认</button>
</div>
```

#### 2. 表单元素暗色模式

**输入框样式:**

```tsx
<input
  className="w-full px-3 py-2 border border-border-primary rounded-lg 
             focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
             bg-bg-paper text-text-primary placeholder:text-text-tertiary"
  placeholder="请输入内容"
/>
```

**选择器样式:**

```tsx
<select
  className="w-full px-3 py-2 border border-border-primary rounded-lg 
             focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
             bg-bg-paper text-text-primary"
>
  <option value="">请选择</option>
</select>
```

**单选/复选框样式:**

```tsx
<input
  type="checkbox"
  className="rounded border-border-primary text-primary-600 
             focus:ring-primary-500 bg-bg-paper"
/>
```

#### 3. 卡片和选中状态

**选中卡片:**

```tsx
<div
  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
    isSelected
      ? 'border-primary-500 bg-primary-50'
      : 'border-border-primary hover:border-primary-300'
  }`}
>
  {/* 卡片内容 */}
</div>
```

**状态指示器:**

```tsx
<span
  className={`px-2 py-1 rounded text-xs font-medium ${
    status === 'success'
      ? 'bg-success-100 text-success-800'
      : status === 'warning'
        ? 'bg-warning-100 text-warning-800'
        : status === 'error'
          ? 'bg-danger-100 text-danger-800'
          : 'bg-info-100 text-info-800'
  }`}
>
  {statusText}
</span>
```

#### 4. 全局文本选中样式

已在 `src/index.css` 中配置：

```css
::selection {
  background-color: var(--color-primary-100);
  color: var(--color-primary-800);
}

::-moz-selection {
  background-color: var(--color-primary-100);
  color: var(--color-primary-800);
}
```

## 组件开发规范

### 1. 组件结构规范

#### 标准组件模板

```tsx
import React, { useState, useEffect } from 'react'
import { SomeIcon } from 'lucide-react'
import toast from 'react-hot-toast'

// 类型定义
interface ComponentProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  data?: SomeDataType
}

// 组件主体
const MyComponent: React.FC<ComponentProps> = ({ isOpen, onClose, onSuccess, data }) => {
  // 状态管理
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 副作用
  useEffect(() => {
    // 组件初始化逻辑
  }, [])

  // 事件处理
  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      // 业务逻辑
      onSuccess?.()
      toast.success('操作成功')
    } catch (err: any) {
      setError(err.message)
      toast.error('操作失败: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // 条件渲染守卫
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-bg-paper rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-primary">
          <h2 className="text-xl font-semibold text-text-primary">组件标题</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">{/* 内容区域 */}</div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border-primary bg-bg-tertiary">
          <div className="text-sm text-text-tertiary">{/* 底部信息 */}</div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-text-secondary bg-bg-paper border border-border-primary rounded-lg hover:bg-bg-tertiary transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '处理中...' : '确认'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MyComponent
```

### 2. 命名规范

#### 文件命名

- 组件文件：`PascalCase.tsx` (如 `APIDetailModal.tsx`)
- 工具文件：`camelCase.ts` (如 `apiUtils.ts`)
- 类型文件：`types.ts` 或 `*.types.ts`

#### 组件命名

- 组件名：`PascalCase` (如 `APIDetailModal`)
- Props接口：`ComponentNameProps` (如 `APIDetailModalProps`)
- 状态变量：`camelCase` (如 `isLoading`, `selectedItem`)

#### CSS类名规范

- 使用 Tailwind CSS 类名
- 优先使用主题变量类名
- 复杂状态使用条件类名组合

### 3. TypeScript 规范

#### Props 类型定义

```tsx
interface ComponentProps {
  // 必需属性
  id: string
  title: string

  // 可选属性
  description?: string
  isVisible?: boolean

  // 函数属性
  onSave: (data: SomeType) => void
  onCancel?: () => void

  // 联合类型
  status: 'pending' | 'success' | 'error'

  // 复杂对象
  data?: {
    name: string
    value: number
  }
}
```

#### 状态类型定义

```tsx
interface ComponentState {
  loading: boolean
  error: string | null
  data: SomeDataType[]
}

const [state, setState] = useState<ComponentState>({
  loading: false,
  error: null,
  data: [],
})
```

## 扩展指南

### 1. 添加新的功能组件

#### 步骤1: 创建组件目录

```bash
mkdir -p src/components/features/my-feature/components
mkdir -p src/components/features/my-feature/modals
```

#### 步骤2: 创建组件文件

```tsx
// src/components/features/my-feature/components/MyFeatureCard.tsx
import React from 'react'

interface MyFeatureCardProps {
  title: string
  description: string
  onEdit: () => void
}

const MyFeatureCard: React.FC<MyFeatureCardProps> = ({ title, description, onEdit }) => {
  return (
    <div className="bg-bg-paper border border-border-primary rounded-lg p-4 hover:shadow-md transition-shadow">
      <h3 className="text-lg font-medium text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary mb-4">{description}</p>
      <button
        onClick={onEdit}
        className="px-3 py-1.5 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
      >
        编辑
      </button>
    </div>
  )
}

export default MyFeatureCard
```

#### 步骤3: 导出组件

```tsx
// src/components/features/my-feature/index.ts
export { default as MyFeatureCard } from './components/MyFeatureCard'
export { default as MyFeatureModal } from './modals/MyFeatureModal'
```

### 2. 扩展主题系统

#### 添加新的色彩变量

```css
/* src/index.css */
:root {
  /* 新增语义化颜色 */
  --color-accent-50: #f0f9ff;
  --color-accent-100: #e0f2fe;
  --color-accent-500: #0ea5e9;
  --color-accent-600: #0284c7;
  --color-accent-700: #0369a1;
}
```

#### 在 Tailwind 配置中注册

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        accent: {
          50: 'var(--color-accent-50)',
          100: 'var(--color-accent-100)',
          500: 'var(--color-accent-500)',
          600: 'var(--color-accent-600)',
          700: 'var(--color-accent-700)',
        },
      },
    },
  },
}
```

### 3. 添加新的表单组件

#### 创建通用表单组件

```tsx
// src/components/ui/FormField.tsx
import React from 'react'

interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}

const FormField: React.FC<FormFieldProps> = ({ label, error, required = false, children }) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text-secondary">
        {label}
        {required && <span className="text-danger-600 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-sm text-danger-600">{error}</p>}
    </div>
  )
}

export default FormField
```

## 最佳实践

### 1. 性能优化

#### 使用 React.memo 优化组件

```tsx
import React, { memo } from 'react'

const MyComponent = memo<ComponentProps>(
  ({ data, onUpdate }) => {
    // 组件实现
  },
  (prevProps, nextProps) => {
    // 自定义比较逻辑
    return prevProps.data.id === nextProps.data.id
  }
)
```

#### 使用 useMemo 和 useCallback

```tsx
const MyComponent: React.FC<Props> = ({ data, onFilter }) => {
  const filteredData = useMemo(() => {
    return data.filter(item => item.status === 'active')
  }, [data])

  const handleItemClick = useCallback((item: Item) => {
    onFilter(item.id)
  }, [onFilter])

  return (
    // 组件JSX
  )
}
```

### 2. 错误处理

#### 组件错误边界

```tsx
import React, { Component, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class ComponentErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
          <h3 className="text-danger-800 font-medium">组件加载失败</h3>
          <p className="text-danger-700 text-sm mt-1">
            请刷新页面重试，如果问题持续存在请联系技术支持。
          </p>
        </div>
      )
    }

    return this.props.children
  }
}
```

### 3. 无障碍访问

#### 键盘导航支持

```tsx
const Modal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
      {/* 模态框内容 */}
    </div>
  )
}
```

#### ARIA 标签

```tsx
<button aria-label="关闭弹窗" aria-expanded={isOpen} onClick={onClose}>
  <X className="w-5 h-5" />
</button>
```

## 故障排除

### 1. 常见问题

#### 主题色彩不生效

**问题**: 使用了主题变量但颜色不显示
**解决**: 确保使用正确的变量名和 Tailwind 配置

```tsx
// ❌ 错误
<div className="bg-primary-600"> // 如果没有在 tailwind.config.js 中配置

// ✅ 正确
<div className="bg-primary-600"> // 确保 tailwind.config.js 中有对应配置
```

#### 组件样式冲突

**问题**: 组件样式在不同主题下显示异常
**解决**: 检查是否使用了硬编码颜色值

```tsx
// ❌ 硬编码颜色
<div className="bg-bg-paper text-black">

// ✅ 使用主题变量
<div className="bg-bg-paper text-text-primary">
```

### 2. 调试工具

#### 主题变量检查

在浏览器开发者工具中检查 CSS 变量：

```javascript
// 控制台执行
const styles = getComputedStyle(document.documentElement)
console.log('Primary color:', styles.getPropertyValue('--color-primary-600'))
```

#### 组件状态调试

```tsx
const MyComponent = () => {
  const [state, setState] = useState(initialState)

  // 开发环境下的调试输出
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Component state:', state)
    }
  }, [state])
}
```

### 3. 性能监控

#### 使用 React DevTools Profiler

1. 安装 React DevTools 浏览器扩展
2. 在 Profiler 标签页中监控组件渲染性能
3. 识别不必要的重新渲染

#### 组件渲染次数监控

```tsx
const useRenderCount = (componentName: string) => {
  const renderCount = useRef(0)

  useEffect(() => {
    renderCount.current++
    console.log(`${componentName} rendered ${renderCount.current} times`)
  })
}

// 在组件中使用
const MyComponent = () => {
  useRenderCount('MyComponent')
  // 组件逻辑
}
```

## 组件实例分析

### 已实现的暗色模式支持组件

#### 1. AI配置模态框 (AIConfigModal.tsx)

**修复内容:**

- ✅ 选中卡片样式：`border-primary-500 bg-primary-50`
- ✅ 输入框focus样式：`focus:ring-primary-500 bg-bg-paper text-text-primary`
- ✅ 按钮和交互元素使用主题色彩
- ✅ Radio按钮支持暗色模式

#### 2. 统一导入模态框 (UnifiedImportModal.tsx)

**修复内容:**

- ✅ 表单元素暗色模式：checkbox、radio、input、textarea
- ✅ 选中状态样式：卡片边框和背景色
- ✅ 状态指示器：错误、成功、警告、信息状态
- ✅ 进度条和加载状态

#### 3. 全局文本选中 (index.css)

**新增内容:**

- ✅ 全局文本选中背景色和文字色
- ✅ 兼容Firefox的选中样式

### 开发实例：创建新的暗色模式组件

```tsx
// src/components/features/example/ExampleCard.tsx
import React, { useState } from 'react'
import { Edit, Delete, Star } from 'lucide-react'

interface ExampleCardProps {
  title: string
  description: string
  isFavorite?: boolean
  onEdit: () => void
  onDelete: () => void
  onToggleFavorite: () => void
}

const ExampleCard: React.FC<ExampleCardProps> = ({
  title,
  description,
  isFavorite = false,
  onEdit,
  onDelete,
  onToggleFavorite,
}) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="bg-bg-paper border border-border-primary rounded-lg p-4 
                 hover:shadow-md hover:border-primary-300 transition-all duration-200
                 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-text-primary">{title}</h3>
        <button
          onClick={onToggleFavorite}
          className={`p-1 rounded transition-colors ${
            isFavorite
              ? 'text-warning-500 hover:text-warning-600'
              : 'text-text-tertiary hover:text-warning-500'
          }`}
        >
          <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <p className="text-text-secondary text-sm mb-4 line-clamp-2">{description}</p>

      {/* Actions */}
      <div
        className={`flex items-center space-x-2 transition-opacity ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <button
          onClick={onEdit}
          className="flex items-center space-x-1 px-3 py-1.5 
                     bg-primary-600 text-white rounded hover:bg-primary-700 
                     transition-colors text-sm"
        >
          <Edit className="w-3 h-3" />
          <span>编辑</span>
        </button>
        <button
          onClick={onDelete}
          className="flex items-center space-x-1 px-3 py-1.5 
                     bg-danger-600 text-white rounded hover:bg-danger-700 
                     transition-colors text-sm"
        >
          <Delete className="w-3 h-3" />
          <span>删除</span>
        </button>
      </div>
    </div>
  )
}

export default ExampleCard
```

---

## 总结

本文档涵盖了 DevAPI Manager 前端组件的完整开发指南，包括：

1. **暗色模式系统**: 基于 CSS Variables 的主题切换，已完成核心组件的暗色模式支持
2. **组件规范**: 标准化的组件结构和命名规范
3. **扩展指南**: 如何添加新功能和组件
4. **最佳实践**: 性能优化、错误处理、无障碍访问
5. **故障排除**: 常见问题的解决方案
6. **实际案例**: 已修复的组件实例和新组件开发示例

遵循这些规范和最佳实践，可以确保组件的一致性、可维护性和用户体验。所有新开发的组件都应该从设计阶段就考虑暗色模式支持，使用语义化的主题变量而不是硬编码颜色值。

如有疑问或需要进一步的技术支持，请联系开发团队。
