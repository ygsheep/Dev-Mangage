# DevAPI Manager 调试系统使用指南

## 🎉 调试系统已成功集成！

您的前端项目现在包含了一个完整的调试系统，具备实时日志记录、网络监控、性能分析和组件状态跟踪功能。

## 🚀 如何使用

### 1. 启动应用
```bash
npm run dev
```

### 2. 访问调试功能

调试系统仅在开发环境下启用，有多种方式访问：

#### 🔧 浮动控制器
- 查看页面右下角的 🐛 图标
- 点击可展开控制面板
- 实时显示错误和警告数量

#### ⌨️ 快捷键
- `Ctrl+Shift+D` - 切换调试面板显示/隐藏
- `Ctrl+Shift+E` - 导出所有调试数据
- `Ctrl+Shift+C` - 清空所有调试数据

#### 💻 浏览器控制台
```javascript
// 访问全局调试对象
window.__DEBUG__

// 快速日志记录
window.__DEBUG__.log('测试消息', { data: 'test' })
window.__DEBUG__.warn('警告消息')
window.__DEBUG__.error('错误消息')

// 性能测量
const timer = window.__DEBUG__.time('测试操作')
// ... 执行操作
timer.end()

// 导出数据
window.__DEBUG__.export()

// 清空数据
window.__DEBUG__.clear()

// 切换面板
window.__DEBUG__.toggle()
```

## 📋 调试面板功能

### 📊 日志标签页
- **实时日志流** - 查看所有应用日志
- **级别过滤** - 按 DEBUG/INFO/WARN/ERROR 过滤
- **搜索功能** - 全文搜索日志内容
- **详情查看** - 点击日志查看详细信息和堆栈跟踪
- **自动滚动** - 可开关的自动滚动到最新日志

### 🌐 网络标签页
- **请求监控** - 自动捕获所有 HTTP 请求
- **状态过滤** - 按成功/失败状态过滤
- **请求详情** - 查看完整的请求/响应数据
- **性能统计** - 请求耗时、数据大小等指标
- **一键复制** - 复制为 cURL 命令

### ⚡ 性能标签页
- **内存监控** - 实时 JavaScript 内存使用情况
- **时间指标** - DNS查询、TCP连接、请求响应时间
- **核心指标** - LCP、FID、CLS 等 Web Vitals
- **历史图表** - 性能指标的时间序列展示
- **统计分析** - 最小值、最大值、平均值

### 🧩 组件标签页
- **状态跟踪** - React 组件状态变化历史
- **Props 监控** - 组件属性变化记录
- **复杂度分析** - 状态复杂度自动评估
- **状态对比** - 不同时间点的状态差异

## 💾 数据持久化

### 自动保存
- 日志每30秒自动保存到文件
- 调试数据存储在浏览器 IndexedDB 中
- 设置和配置保存到 localStorage

### 手动导出
- 点击"Export"按钮导出 JSON 格式数据
- 包含所有日志、网络请求、性能指标和组件状态
- 支持文件系统访问 API（现代浏览器）或下载方式

## 🎯 演示功能

项目中已添加了演示代码，展示调试系统的各种功能：

### HomePage 组件演示
- ✅ 组件状态跟踪
- ✅ 用户操作日志记录
- ✅ 性能时间测量
- ✅ 错误处理和警告
- ✅ 随机错误演示

### Layout 组件演示
- ✅ 路由变化监控
- ✅ 导航点击跟踪
- ✅ 快捷键使用记录
- ✅ 页面加载性能监控

## 🔍 实际测试

1. **打开应用** - 访问 http://localhost:5174
2. **查看日志** - 按 `Ctrl+Shift+D` 打开调试面板
3. **测试功能**：
   - 点击导航菜单 → 查看路由变化日志
   - 点击快速操作按钮 → 查看用户操作记录
   - 刷新页面 → 查看性能指标
   - 查看网络标签 → 观察 API 请求监控
   - 查看组件标签 → 查看状态变化

## ⚠️ 注意事项

- 调试系统仅在开发环境 (`NODE_ENV=development`) 下启用
- 不会影响生产构建，生产环境自动禁用
- 调试数据仅存储在本地浏览器中
- 不记录敏感信息（密码、令牌等）

## 🛠️ 自定义和扩展

### 添加自定义日志
```typescript
import { debug } from './debug'

// 在组件中使用
debug.log('自定义消息', { data: 'value' }, '组件名')
debug.warn('警告消息', { context: 'additional info' })
debug.error('错误消息', { error: errorObject })
```

### 组件状态自动跟踪
```typescript
import { useDebugComponent } from './debug'

const MyComponent = () => {
  const [state, setState] = useState({ count: 0 })
  
  // 自动跟踪状态变化
  useDebugComponent('MyComponent', state, { someProp: 'value' })
  
  return <div>{state.count}</div>
}
```

### 性能测量
```typescript
import { debug } from './debug'

// 方法1：使用计时器
const timer = debug.time('数据处理')
// ... 执行操作
timer.end()

// 方法2：包装函数
const result = performanceMonitor.measureFunction('complexCalculation', () => {
  return doComplexWork()
})
```

## 📚 更多信息

- 详细文档：`packages/frontend/src/debug/README.md`
- 类型定义：`packages/frontend/src/debug/types.ts`
- 示例代码：`packages/frontend/src/pages/HomePage.tsx`

---

🎉 **调试系统已就绪！开始探索您的应用性能和行为吧！**