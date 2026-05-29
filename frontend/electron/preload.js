const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 菜单事件
  onMenuNewContract: (callback) => {
    ipcRenderer.on('menu:new-contract', callback);
  },
  
  // 系统信息
  getPlatform: () => process.platform,
  
  // 文件对话框
  showOpenDialog: (options) => ipcRenderer.invoke('dialog:open', options),
  showSaveDialog: (options) => ipcRenderer.invoke('dialog:save', options),
  
  // 应用信息
  getVersion: () => ipcRenderer.invoke('app:version'),
  
  // 窗口控制
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close')
});
