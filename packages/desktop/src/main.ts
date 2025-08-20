import { app, BrowserWindow, Menu, shell, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';

const isDev = process.env.NODE_ENV === 'development' || 
             process.env.ELECTRON_IS_DEV === '1' ||
             !app.isPackaged;

// 添加详细的日志记录
console.log('=== DevAPI Manager Electron Startup ===');
console.log('isDev:', isDev);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('ELECTRON_IS_DEV:', process.env.ELECTRON_IS_DEV);
console.log('app.isPackaged:', app.isPackaged);
console.log('process.resourcesPath:', process.resourcesPath);
console.log('__dirname:', __dirname);

let mainWindow: BrowserWindow;

function createWindow(): void {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    height: 800,
    width: 1200,
    minHeight: 600,
    minWidth: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    frame: false, // 无边框窗口
    titleBarStyle: 'hidden', // 隐藏标题栏
    titleBarOverlay: false, // 禁用标题栏覆盖
    show: false,
    backgroundColor: '#1a1a1a', // 设置背景色为暗色
    vibrancy: 'under-window', // macOS毛玻璃效果
    visualEffectState: 'active', // macOS视觉效果状态
  });

  // 加载应用
  if (isDev) {
    console.log('开发模式：尝试连接到 http://localhost:5173');
    mainWindow.loadURL('http://localhost:5173').catch(err => {
      console.error('开发模式连接失败，尝试备用端口:', err);
      // 尝试5174端口
      mainWindow.loadURL('http://localhost:5174').catch(err2 => {
        console.error('备用端口也连接失败:', err2);
        // 最后尝试加载本地文件
        const localPath = path.join(__dirname, '../../frontend/dist/index.html');
        console.log('尝试加载本地文件:', localPath);
        mainWindow.loadFile(localPath);
      });
    });
    mainWindow.webContents.openDevTools();
  } else {
    // 生产环境加载打包后的前端资源
    const frontendPath = path.join(process.resourcesPath, 'frontend', 'index.html');
    const fallbackPath = path.join(__dirname, '../../frontend/dist/index.html');
    
    console.log('生产模式尝试加载路径:');
    console.log('1. 主路径:', frontendPath);
    console.log('2. 备用路径:', fallbackPath);
    console.log('process.resourcesPath:', process.resourcesPath);
    console.log('__dirname:', __dirname);
    
    // 列出resources目录内容
    if (fs.existsSync(process.resourcesPath)) {
      console.log('Resources目录内容:', fs.readdirSync(process.resourcesPath));
      const frontendDir = path.join(process.resourcesPath, 'frontend');
      if (fs.existsSync(frontendDir)) {
        console.log('Frontend目录内容:', fs.readdirSync(frontendDir));
      }
    }
    
    console.log('1. 主路径存在:', fs.existsSync(frontendPath));
    console.log('2. 备用路径存在:', fs.existsSync(fallbackPath));
    
    if (fs.existsSync(frontendPath)) {
      console.log('使用主路径加载前端');
      mainWindow.loadFile(frontendPath);
    } else if (fs.existsSync(fallbackPath)) {
      console.log('使用备用路径加载前端');
      mainWindow.loadFile(fallbackPath);
    } else {
      console.error('所有前端路径都不存在！');
      // 创建一个错误页面
      mainWindow.loadURL(`data:text/html;charset=utf-8,
        <html>
          <head><title>DevAPI Manager - Error</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
            <h1 style="color: #e74c3c;">DevAPI Manager 启动错误</h1>
            <p>前端资源文件未找到，请检查以下路径：</p>
            <ul>
              <li><code>${frontendPath}</code></li>
              <li><code>${fallbackPath}</code></li>
            </ul>
            <p><strong>Resources目录：</strong> <code>${process.resourcesPath}</code></p>
            <p><strong>解决方案：</strong></p>
            <ol>
              <li>确保前端已正确构建：<code>npm run build</code></li>
              <li>重新构建桌面应用：<code>npm run build:win</code></li>
              <li>检查 electron-builder 配置</li>
            </ol>
          </body>
        </html>
      `);
    }
    
    // 生产模式也开启开发者工具用于调试
    mainWindow.webContents.openDevTools();
  }

  // 添加页面加载事件监听
  mainWindow.webContents.on('did-start-loading', () => {
    console.log('页面开始加载...');
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('页面加载完成！');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('页面加载失败:', {
      errorCode,
      errorDescription,
      validatedURL
    });
  });

  mainWindow.webContents.on('dom-ready', () => {
    console.log('DOM 准备就绪');
  });

  mainWindow.webContents.on('crashed', (event, killed) => {
    console.error('渲染进程崩溃:', { killed });
  });

  // 窗口准备显示时显示
  mainWindow.once('ready-to-show', () => {
    console.log('窗口准备显示');
    mainWindow.show();
  });

  // 处理外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // 设置菜单
  createMenu();
}

function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建项目',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-project');
          },
        },
        {
          label: '导入Swagger',
          accelerator: 'CmdOrCtrl+I',
          click: () => {
            mainWindow.webContents.send('menu-import-swagger');
          },
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
      ],
    },
    {
      label: '查看',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'forceReload', label: '强制重新加载' },
        { role: 'toggleDevTools', label: '切换开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '实际大小' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '切换全屏' },
      ],
    },
    {
      label: '搜索',
      submenu: [
        {
          label: '快速搜索',
          accelerator: 'CmdOrCtrl+K',
          click: () => {
            mainWindow.webContents.send('menu-quick-search');
          },
        },
        {
          label: '全局搜索',
          accelerator: 'CmdOrCtrl+Shift+F',
          click: () => {
            mainWindow.webContents.send('menu-global-search');
          },
        },
      ],
    },
    {
      label: '窗口',
      submenu: [
        { role: 'minimize', label: '最小化' },
        { role: 'close', label: '关闭' },
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于 DevAPI Manager',
          click: () => {
            mainWindow.webContents.send('menu-about');
          },
        },
        {
          label: '查看文档',
          click: () => {
            shell.openExternal('https://github.com/devapi-team/devapi-manager');
          },
        },
      ],
    },
  ];

  // macOS 特殊处理
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about', label: `关于 ${app.getName()}` },
        { type: 'separator' },
        { role: 'services', label: '服务' },
        { type: 'separator' },
        { role: 'hide', label: `隐藏 ${app.getName()}` },
        { role: 'hideOthers', label: '隐藏其他' },
        { role: 'unhide', label: '显示全部' },
        { type: 'separator' },
        { role: 'quit', label: `退出 ${app.getName()}` },
      ],
    });

    // 窗口菜单
    (template[4].submenu as Electron.MenuItemConstructorOptions[]).push(
      { type: 'separator' },
      {
        label: '前置所有窗口',
        role: 'front',
      }
    );
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 应用事件处理
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC 事件处理
ipcMain.handle('app-version', () => {
  return app.getVersion();
});

ipcMain.handle('show-message-box', async (event, options) => {
  const { dialog } = await import('electron');
  const result = await dialog.showMessageBox(mainWindow, options);
  return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const { dialog } = await import('electron');
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

// 文件系统操作
ipcMain.handle('read-file', async (event, filePath: string) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content;
  } catch (error) {
    throw new Error(`Failed to read file: ${error}`);
  }
});

ipcMain.handle('write-file', async (event, filePath: string, content: string) => {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
  } catch (error) {
    throw new Error(`Failed to write file: ${error}`);
  }
});

// 应用信息
ipcMain.handle('is-packaged', () => {
  return app.isPackaged;
});

// 窗口控制
ipcMain.handle('minimize-window', () => {
  mainWindow.minimize();
});

ipcMain.handle('maximize-window', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.restore();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.handle('close-window', () => {
  mainWindow.close();
});

// MCP服务器管理
let mcpServerProcess: ChildProcess | null = null;

ipcMain.handle('start-mcp-server', async () => {
  if (mcpServerProcess) {
    return { success: false, message: 'MCP Server already running' };
  }

  try {
    const mcpServerPath = isDev 
      ? path.join(__dirname, '../../mcp-server/dist/index.js')
      : path.join(process.resourcesPath, 'mcp-server', 'index.js');

    mcpServerProcess = spawn('node', [mcpServerPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });

    mcpServerProcess.on('exit', (code) => {
      mcpServerProcess = null;
      mainWindow.webContents.send('mcp-server-status-changed', {
        isRunning: false,
        exitCode: code
      });
    });

    mcpServerProcess.on('error', (error) => {
      mcpServerProcess = null;
      mainWindow.webContents.send('mcp-server-status-changed', {
        isRunning: false,
        error: error.message
      });
    });

    return { success: true, message: 'MCP Server started' };
  } catch (error) {
    return { success: false, message: `Failed to start MCP Server: ${error}` };
  }
});

ipcMain.handle('stop-mcp-server', async () => {
  if (!mcpServerProcess) {
    return { success: false, message: 'MCP Server not running' };
  }

  try {
    mcpServerProcess.kill('SIGTERM');
    mcpServerProcess = null;
    return { success: true, message: 'MCP Server stopped' };
  } catch (error) {
    return { success: false, message: `Failed to stop MCP Server: ${error}` };
  }
});

ipcMain.handle('get-mcp-server-status', () => {
  return {
    isRunning: mcpServerProcess !== null,
    pid: mcpServerProcess?.pid || null
  };
});

// 设置管理 (使用electron-store)
let store: any = null;

const initStore = async () => {
  if (!store) {
    const Store = (await import('electron-store')).default;
    store = new Store({
      name: 'devapi-settings',
      defaults: {
        windowBounds: { width: 1200, height: 800 },
        theme: 'light',
        debugMode: false,
        mcpServerAutoStart: false
      }
    });
  }
  return store;
};

ipcMain.handle('get-setting', async (event, key: string) => {
  const store = await initStore();
  return store.get(key);
});

ipcMain.handle('set-setting', async (event, key: string, value: any) => {
  const store = await initStore();
  store.set(key, value);
});

// 日志系统
ipcMain.handle('log', (event, level: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data || '');
  
  // 可以在这里添加日志文件写入逻辑
  // 或者发送到主窗口的调试面板
  mainWindow.webContents.send('desktop-log', {
    timestamp,
    level,
    message,
    data
  });
});

// 查询数据库 (简化版，实际应该通过后端API)
ipcMain.handle('execute-query', async (event, query: string, params?: any[]) => {
  // 这里应该通过HTTP请求调用后端API
  // 暂时返回模拟数据
  return { success: true, data: [], message: 'Database query executed' };
});