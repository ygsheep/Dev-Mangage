import { contextBridge, ipcRenderer } from 'electron';

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 应用信息
  getAppVersion: () => ipcRenderer.invoke('app-version'),
  
  // 对话框
  showMessageBox: (options: Electron.MessageBoxOptions) => 
    ipcRenderer.invoke('show-message-box', options),
  showOpenDialog: (options: Electron.OpenDialogOptions) => 
    ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options: Electron.SaveDialogOptions) => 
    ipcRenderer.invoke('show-save-dialog', options),
  
  // 菜单事件监听
  onMenuAction: (callback: (action: string) => void) => {
    ipcRenderer.on('menu-new-project', () => callback('new-project'));
    ipcRenderer.on('menu-import-swagger', () => callback('import-swagger'));
    ipcRenderer.on('menu-quick-search', () => callback('quick-search'));
    ipcRenderer.on('menu-global-search', () => callback('global-search'));
    ipcRenderer.on('menu-about', () => callback('about'));
  },
  
  // 文件系统操作
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath: string, content: string) => 
    ipcRenderer.invoke('write-file', filePath, content),
  
  // 系统信息
  getPlatform: () => process.platform,
  isPackaged: () => ipcRenderer.invoke('is-packaged'),
  
  // 窗口控制
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  
  // MCP服务器集成支持
  startMCPServer: () => ipcRenderer.invoke('start-mcp-server'),
  stopMCPServer: () => ipcRenderer.invoke('stop-mcp-server'),
  getMCPServerStatus: () => ipcRenderer.invoke('get-mcp-server-status'),
  onMCPServerStatusChange: (callback: (status: any) => void) => {
    ipcRenderer.on('mcp-server-status-changed', (_, status) => callback(status));
  },
  
  // 数据库操作
  executeQuery: (query: string, params?: any[]) => 
    ipcRenderer.invoke('execute-query', query, params),
  
  // 设置管理
  getSetting: (key: string) => ipcRenderer.invoke('get-setting', key),
  setSetting: (key: string, value: any) => 
    ipcRenderer.invoke('set-setting', key, value),
  
  // 日志系统
  log: (level: string, message: string, data?: any) => 
    ipcRenderer.invoke('log', level, message, data),
});

// 类型声明
declare global {
  interface Window {
    electronAPI: {
      getAppVersion: () => Promise<string>;
      showMessageBox: (options: Electron.MessageBoxOptions) => Promise<Electron.MessageBoxReturnValue>;
      showOpenDialog: (options: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>;
      showSaveDialog: (options: Electron.SaveDialogOptions) => Promise<Electron.SaveDialogReturnValue>;
      onMenuAction: (callback: (action: string) => void) => void;
      readFile: (filePath: string) => Promise<string>;
      writeFile: (filePath: string, content: string) => Promise<void>;
      getPlatform: () => string;
      isPackaged: () => Promise<boolean>;
      minimizeWindow: () => Promise<void>;
      maximizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;
      startMCPServer: () => Promise<any>;
      stopMCPServer: () => Promise<any>;
      getMCPServerStatus: () => Promise<any>;
      onMCPServerStatusChange: (callback: (status: any) => void) => void;
      executeQuery: (query: string, params?: any[]) => Promise<any>;
      getSetting: (key: string) => Promise<any>;
      setSetting: (key: string, value: any) => Promise<void>;
      log: (level: string, message: string, data?: any) => Promise<void>;
    };
  }
}