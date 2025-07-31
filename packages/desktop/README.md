# 🖥️ DevAPI Manager - Desktop

DevAPI Manager 的桌面应用，基于 Electron 构建，提供原生的跨平台API管理体验。

## 🎯 核心功能

### 🖥️ 原生体验
- **跨平台支持**: Windows、macOS、Linux
- **原生窗口**: 系统级窗口管理和快捷键
- **系统集成**: 文件系统访问、系统托盘、通知
- **离线运行**: 完全本地化，无需网络依赖

### 🔌 完整集成
- **前端界面**: 集成完整的Web前端界面
- **后端服务**: 内置后端API服务
- **MCP服务器**: 集成向量搜索和RAG功能
- **数据库**: 本地SQLite数据库

### 🛠️ 开发工具
- **调试面板**: 内置开发者工具
- **日志系统**: 完整的日志记录和查看
- **性能监控**: 实时性能指标监控
- **错误追踪**: 详细的错误信息和堆栈

### ⚡ 高性能
- **本地缓存**: 智能的本地数据缓存
- **异步处理**: 非阻塞的UI操作
- **内存优化**: 高效的内存使用管理
- **启动优化**: 快速的应用启动速度

## 🚀 快速开始

### 系统要求
- **Windows**: Windows 10/11 (x64)
- **macOS**: macOS 10.15+ (x64/ARM64)
- **Linux**: Ubuntu 18.04+ 或同等发行版
- **内存**: 最少 4GB RAM
- **存储**: 至少 500MB 可用空间

### 开发环境
```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建应用
npm run build

# 启动应用 (需要先构建)
npm start
```

### 构建分发包
```bash
# 构建Windows版本
npm run build:win

# 构建macOS版本
npm run build:mac

# 构建Linux版本
npm run build:linux

# 构建所有平台
npm run dist
```

## 📁 项目结构

```
packages/desktop/
├── src/
│   ├── main.ts              # 主进程入口
│   ├── preload.ts           # 预加载脚本
│   └── renderer/            # 渲染进程文件 (如有)
├── assets/                  # 应用资源
│   ├── icon.ico            # Windows图标
│   ├── icon.icns           # macOS图标
│   └── icon.png            # Linux图标
├── dist/                   # 编译输出
├── release/                # 分发包输出
├── package.json            # 包配置
└── tsconfig.json          # TypeScript配置
```

## 🔧 主要配置

### Electron配置
```typescript
// 主窗口配置
const mainWindow = new BrowserWindow({
  width: 1200,
  height: 800,
  minWidth: 800,
  minHeight: 600,
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    preload: path.join(__dirname, 'preload.js')
  }
})
```

### 构建配置
```json
{
  "build": {
    "appId": "com.devapi.manager",
    "productName": "DevAPI Manager",
    "directories": {
      "output": "release"
    },
    "files": [
      "dist/**/*",
      "../frontend/dist/**/*"
    ],
    "extraResources": [
      {
        "from": "../frontend/dist",
        "to": "frontend",
        "filter": ["**/*"]
      }
    ]
  }
}
```

### 打包配置
```json
{
  "win": {
    "target": "nsis",
    "requestedExecutionLevel": "asInvoker"
  },
  "mac": {
    "target": "dmg",
    "category": "public.app-category.developer-tools"
  },
  "linux": {
    "target": "AppImage",
    "category": "Development"
  }
}
```

## 🎮 功能特性

### 📋 菜单系统
```typescript
// 应用菜单配置
const menuTemplate = [
  {
    label: '文件',
    submenu: [
      { label: '新建项目', accelerator: 'CmdOrCtrl+N' },
      { label: '导入Swagger', accelerator: 'CmdOrCtrl+I' },
      { type: 'separator' },
      { label: '退出', accelerator: 'CmdOrCtrl+Q' }
    ]
  },
  {
    label: '搜索',
    submenu: [
      { label: '快速搜索', accelerator: 'CmdOrCtrl+K' },
      { label: '全局搜索', accelerator: 'CmdOrCtrl+Shift+F' }
    ]
  }
]
```

### 🔌 IPC通信
```typescript
// 主进程API暴露
contextBridge.exposeInMainWorld('electronAPI', {
  // 应用信息
  getAppVersion: () => ipcRenderer.invoke('app-version'),
  
  // 文件操作
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath: string, content: string) => 
    ipcRenderer.invoke('write-file', filePath, content),
  
  // MCP服务器控制
  startMCPServer: () => ipcRenderer.invoke('start-mcp-server'),
  stopMCPServer: () => ipcRenderer.invoke('stop-mcp-server'),
  getMCPServerStatus: () => ipcRenderer.invoke('get-mcp-server-status'),
  
  // 设置管理
  getSetting: (key: string) => ipcRenderer.invoke('get-setting', key),
  setSetting: (key: string, value: any) => 
    ipcRenderer.invoke('set-setting', key, value)
})
```

### 💾 本地存储
```typescript
// 使用electron-store进行设置存储
const store = new Store({
  name: 'devapi-settings',
  defaults: {
    windowBounds: { width: 1200, height: 800 },
    theme: 'light',
    debugMode: false,
    mcpServerAutoStart: false
  }
})

// 获取/设置配置
const theme = store.get('theme')
store.set('theme', 'dark')
```

## 🎯 使用示例

### 启动应用
```javascript
// 渲染进程中使用Electron API
async function initializeApp() {
  // 获取应用版本
  const version = await window.electronAPI.getAppVersion()
  console.log('应用版本:', version)
  
  // 启动MCP服务器
  const result = await window.electronAPI.startMCPServer()
  if (result.success) {
    console.log('MCP服务器启动成功')
  }
  
  // 监听MCP服务器状态变化
  window.electronAPI.onMCPServerStatusChange((status) => {
    console.log('MCP服务器状态:', status)
  })
}
```

### 文件操作
```javascript
// 读取本地文件
async function loadProjectFile() {
  try {
    const filePath = await window.electronAPI.showOpenDialog({
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    
    if (!filePath.canceled) {
      const content = await window.electronAPI.readFile(filePath.filePaths[0])
      const project = JSON.parse(content)
      console.log('加载项目:', project)
    }
  } catch (error) {
    console.error('文件读取失败:', error)
  }
}
```

### 设置管理
```javascript
// 设置管理示例
class SettingsManager {
  async loadSettings() {
    const settings = {
      theme: await window.electronAPI.getSetting('theme'),
      debugMode: await window.electronAPI.getSetting('debugMode'),
      autoStart: await window.electronAPI.getSetting('mcpServerAutoStart')
    }
    return settings
  }
  
  async saveSettings(settings) {
    await window.electronAPI.setSetting('theme', settings.theme)
    await window.electronAPI.setSetting('debugMode', settings.debugMode)
    await window.electronAPI.setSetting('mcpServerAutoStart', settings.autoStart)
  }
}
```

## 🔧 开发调试

### 开发模式
```bash
# 启动开发模式 (热重载)
npm run dev

# 仅构建不启动
npm run build

# 构建并监听变化
npm run build:watch
```

### 调试工具
```typescript
// 开发环境自动打开DevTools
if (isDev) {
  mainWindow.webContents.openDevTools()
}

// 调试日志
console.log('主进程日志')
mainWindow.webContents.executeJavaScript(`
  console.log('渲染进程日志')
`)
```

### 错误处理
```typescript
// 全局错误处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error)
  app.quit()
})

// 渲染进程错误处理
mainWindow.webContents.on('crashed', () => {
  console.error('渲染进程崩溃')
  // 重启渲染进程或显示错误页面
})
```

## 📦 分发和部署

### 构建流程
```bash
# 1. 构建前端
cd ../frontend && npm run build

# 2. 构建后端
cd ../backend && npm run build

# 3. 构建桌面应用
cd ../desktop && npm run build

# 4. 打包分发
npm run dist
```

### 分发包信息
- **Windows**: `.exe` 安装程序 (~100MB)
- **macOS**: `.dmg` 磁盘映像 (~100MB)  
- **Linux**: `.AppImage` 可执行文件 (~100MB)

### 签名和公证 (生产)
```bash
# Windows代码签名
npm run build:win -- --publish=never

# macOS公证
npm run build:mac -- --publish=never

# 自动更新配置
"publish": [
  {
    "provider": "github",
    "owner": "devapi-team",
    "repo": "devapi-manager"
  }
]
```

## 🛡️ 安全考虑

### 沙盒安全
```typescript
// 禁用Node.js集成
webPreferences: {
  nodeIntegration: false,
  contextIsolation: true,
  sandbox: true, // 生产环境启用
  preload: path.join(__dirname, 'preload.js')
}
```

### API安全
```typescript
// 只暴露必要的API
contextBridge.exposeInMainWorld('electronAPI', {
  // 安全的API列表
  getAppVersion: () => ipcRenderer.invoke('app-version'),
  // 不暴露文件系统的完整访问权限
})
```

### 内容安全策略
```html
<!-- 在HTML中设置CSP -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
">
```

## 📊 性能优化

### 启动优化
```typescript
// 延迟显示窗口直到准备就绪
mainWindow = new BrowserWindow({
  show: false, // 初始隐藏
  // ...其他配置
})

mainWindow.once('ready-to-show', () => {
  mainWindow.show() // 准备就绪后显示
})
```

### 内存管理
```typescript
// 自动垃圾回收
setInterval(() => {
  if (global.gc) {
    global.gc()
  }
}, 30000) // 每30秒执行一次GC

// 监控内存使用
const memoryUsage = process.memoryUsage()
console.log('内存使用:', memoryUsage)
```

### 缓存策略
```typescript
// 设置缓存策略
session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
  // 缓存静态资源
  if (details.url.includes('.js') || details.url.includes('.css')) {
    callback({ 
      redirectURL: details.url,
      responseHeaders: {
        'Cache-Control': 'public, max-age=3600'
      }
    })
  } else {
    callback({})
  }
})
```

## 🧪 测试

### 单元测试
```bash
# 运行测试
npm test

# 端到端测试
npm run test:e2e
```

### 自动化测试
```javascript
// 使用Spectron进行E2E测试
const { Application } = require('spectron')

describe('DevAPI Manager Desktop', () => {
  let app
  
  beforeEach(async () => {
    app = new Application({
      path: './node_modules/.bin/electron',
      args: ['./dist/main.js']
    })
    await app.start()
  })
  
  afterEach(async () => {
    if (app && app.isRunning()) {
      await app.stop()
    }
  })
  
  test('应用启动正常', async () => {
    const windowCount = await app.client.getWindowCount()
    expect(windowCount).toBe(1)
  })
})
```

## 🔗 相关文档

- [Electron文档](https://www.electronjs.org/docs)
- [Electron Builder文档](https://www.electron.build/)
- [Node.js文档](https://nodejs.org/docs)
- [前端项目](../frontend/README.md)
- [后端项目](../backend/README.md)

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](../../LICENSE) 文件了解详情。

---

**DevAPI Manager Desktop** - 原生的、强大的、跨平台的API管理桌面应用！ 🚀