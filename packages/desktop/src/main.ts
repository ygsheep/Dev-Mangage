import { app, BrowserWindow, Menu, shell, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';

const isDev = process.env.NODE_ENV === 'development';

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
    titleBarStyle: 'default',
    show: false,
  });

  // 加载应用
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // 生产环境加载打包后的前端资源
    const frontendPath = path.join(process.resourcesPath, 'frontend', 'index.html');
    if (require('fs').existsSync(frontendPath)) {
      mainWindow.loadFile(frontendPath);
    } else {
      // 开发模式下的备用路径
      mainWindow.loadFile(path.join(__dirname, '../../frontend/dist/index.html'));
    }
  }

  // 窗口准备显示时显示
  mainWindow.once('ready-to-show', () => {
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