# DevAPI Manager 调试系统

## 概述

这是一个完整的前端调试系统，为DevAPI Manager项目提供实时调试、日志记录、性能监控和状态跟踪功能。

## 主要功能

### 🎯 核心特性
- **实时日志系统** - 捕获所有console输出和自定义日志
- **网络监控** - 监控所有HTTP请求/响应
- **性能监控** - 内存使用、响应时间、核心Web指标
- **组件状态跟踪** - React组件状态和props变化
- **可拖拽浮动窗口** - 灵活的调试界面
- **数据导出** - 支持JSON格式导出所有调试数据
- **本地存储** - 自动保存配置和历史数据

### 💾 日志文件保存
- **自动保存** - 每30秒自动保存日志到文件
- **手动导出** - 支持手动导出调试数据
- **IndexedDB存储** - 离线存储历史调试数据
- **多种格式** - 支持JSON文件和浏览器下载

## 使用方法

### 🚀 快速开始

1. **自动启用** - 在开发环境下自动启用调试系统
2. **快捷键操作**：
   - `Ctrl+Shift+D` - 切换调试面板显示/隐藏
   - `Ctrl+Shift+E` - 导出所有调试数据
   - `Ctrl+Shift+C` - 清空所有调试数据

3. **浮动控制器** - 页面右下角的🐛按钮提供快速访问

### 📝 编程接口

```typescript
import { debug, logger, useDebugComponent } from './debug'

// 基础日志记录
debug.log('用户操作', { action: 'click', target: 'button' })
debug.warn('性能警告', { loadTime: 2000 })
debug.error('API错误', { status: 500, url: '/api/users' })

// 性能测量
const timer = debug.time('API请求')
// ... 执行操作
timer.end() // 自动记录耗时

// 组件状态记录
const MyComponent = () => {
  const [state, setState] = useState({ count: 0 })
  
  // 自动记录状态变化
  useDebugComponent('MyComponent', state, { prop1: 'value' })
  
  return <div>{state.count}</div>
}
```

### 🔧 高级用法

#### 高阶组件包装
```typescript
import { withDebug } from './debug'

const MyComponent = ({ name }) => <div>Hello {name}</div>

export default withDebug(MyComponent, 'MyComponent')
```

#### 类组件装饰器
```typescript
import { debugComponent } from './debug'

@debugComponent('MyClassComponent')
class MyComponent extends React.Component {
  render() {
    return <div>Content</div>
  }
}
```

#### 手动性能监控
```typescript
import { performanceMonitor } from './debug'

// 添加自定义指标
performanceMonitor.addMetric('Database Query', 150, 'ms', 'timing')

// 测量函数执行时间
const result = performanceMonitor.measureFunction('complexCalculation', () => {
  return someComplexOperation()
})

// 测量异步函数
const result = await performanceMonitor.measureAsyncFunction('apiCall', async () => {
  return await fetch('/api/data')
})
```

## 调试面板功能

### 📊 日志标签页
- **实时日志流** - 所有日志实时显示
- **级别过滤** - 按DEBUG/INFO/WARN/ERROR级别过滤
- **搜索功能** - 全文搜索日志内容
- **详情查看** - 点击日志查看完整信息和堆栈跟踪
- **自动滚动** - 可开关的自动滚动到最新日志

### 🌐 网络标签页
- **请求列表** - 所有HTTP请求的完整记录
- **状态过滤** - 按成功/失败状态过滤
- **请求详情** - 查看请求/响应数据
- **性能信息** - 请求耗时、数据大小统计
- **cURL导出** - 一键复制为cURL命令

### ⚡ 性能标签页
- **内存监控** - 实时内存使用情况
- **时间指标** - 页面加载、响应时间等
- **核心指标** - LCP、FID、CLS等Web Vitals
- **历史图表** - 性能指标的时间序列图
- **统计分析** - 最小值、最大值、平均值统计

### 🧩 组件标签页
- **状态历史** - 组件状态变化历史
- **复杂度分析** - 状态复杂度评估
- **Props跟踪** - 组件属性变化监控
- **状态对比** - 不同时间点的状态对比

## 配置选项

### 本地存储配置
系统会自动保存以下配置到localStorage：
- 调试系统启用状态
- 面板显示状态
- 过滤器设置
- 窗口位置和大小

### 自定义配置
```typescript
import { logger, networkMonitor, performanceMonitor } from './debug'

// 设置日志自动保存间隔（毫秒）
logger.setAutoSaveInterval(60000) // 每分钟保存一次

// 启用/禁用文件保存
logger.setFileSaveEnabled(true)

// 停止网络监控
networkMonitor.clearRequests()

// 停止性能监控
performanceMonitor.stop()
```

## 数据导出格式

导出的JSON文件包含以下结构：
```json
{
  "version": "1.0",
  "timestamp": "2023-11-20T10:30:00.000Z",
  "userAgent": "Mozilla/5.0...",
  "url": "http://localhost:5173",
  "data": {
    "logs": [...],
    "networkRequests": [...],
    "performanceMetrics": [...],
    "componentStates": [...],
    "filters": {...}
  }
}
```

## 安全考虑

- **生产环境隔离** - 调试系统仅在开发环境启用
- **数据脱敏** - 不记录敏感信息（密码、令牌等）
- **本地存储** - 所有数据仅存储在本地浏览器中
- **性能影响** - 优化的性能开销，不影响应用正常运行

## 故障排除

### 常见问题

1. **调试面板不显示**
   - 确认在开发环境 (`NODE_ENV=development`)
   - 检查浏览器控制台是否有错误
   - 尝试 `Ctrl+Shift+D` 快捷键

2. **日志保存失败**
   - 检查浏览器是否支持文件系统访问API
   - 尝试手动导出功能
   - 查看浏览器控制台错误信息

3. **性能监控无数据**
   - 确认浏览器支持Performance API
   - 检查是否有安全策略阻止
   - 刷新页面重新初始化

### 调试调试系统
```typescript
// 在浏览器控制台中访问调试工具
window.__DEBUG__

// 查看调试系统状态
console.log(window.__DEBUG__)

// 手动触发导出
window.__DEBUG__.export()
```

## 扩展开发

### 添加新的监控类型
```typescript
// 创建新的监控器
class CustomMonitor {
  private listeners: ((data: any) => void)[] = []
  
  onData(listener: (data: any) => void) {
    this.listeners.push(listener)
  }
  
  emit(data: any) {
    this.listeners.forEach(listener => listener(data))
  }
}

// 集成到调试系统
const customMonitor = new CustomMonitor()
useDebugStore.getState().addCustomData = (data) => {
  // 处理自定义数据
}
```

### 添加新的面板标签
```typescript
// 创建新的标签组件
const CustomTab: React.FC = () => {
  return <div>自定义调试面板</div>
}

// 在DebugPanel中添加新标签
```

## 技术架构

- **状态管理**: Zustand
- **UI框架**: React + TypeScript
- **样式**: Tailwind CSS
- **存储**: IndexedDB + localStorage
- **文件操作**: File System Access API / Blob下载
- **性能监控**: Performance API + PerformanceObserver
- **网络监控**: Fetch/XHR拦截

## 版本历史

- **v1.0.0** - 初始版本，包含基础调试功能
- **v1.1.0** - 添加日志文件保存功能
- **v1.2.0** - 优化性能监控和组件状态跟踪

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 编写测试用例
4. 提交Pull Request

## 许可证

MIT License - 详见项目根目录LICENSE文件