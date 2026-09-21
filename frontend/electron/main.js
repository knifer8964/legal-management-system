const { app, BrowserWindow, Menu, Tray, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let mainWindow;
let tray;
let backendProcess;
const isDev = process.env.NODE_ENV === 'development';

// 后端服务路径
const getBackendPath = () => {
  if (isDev) {
    return path.join(__dirname, '..', '..', 'backend');
  }
  // 生产环境：后端随包放在 resources/backend
  return path.join(process.resourcesPath, 'backend');
};

// 用户数据目录（可写）：数据库、日志均放这里，规避 Program Files 只读问题
const getUserDataDir = () => app.getPath('userData');

// 首次运行：把随包携带的种子数据库复制到用户数据目录
const ensureDatabase = (backendPath) => {
  const userDir = getUserDataDir();
  if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
  const targetDb = path.join(userDir, 'legal.db');
  if (!fs.existsSync(targetDb)) {
    const seedDb = path.join(backendPath, 'prisma', 'dev.db');
    if (fs.existsSync(seedDb)) {
      fs.copyFileSync(seedDb, targetDb);
      console.log('Database initialized at:', targetDb);
    } else {
      console.error('Seed database not found at:', seedDb);
    }
  }
  return targetDb;
};

// 读取随包 .env（仅取键值，作为兜底默认值）
const readEnvFile = (backendPath) => {
  const result = {};
  const envFile = path.join(backendPath, '.env');
  if (fs.existsSync(envFile)) {
    fs.readFileSync(envFile, 'utf8').split(/\r?\n/).forEach((line) => {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) result[m[1]] = m[2].replace(/^["']|["']$/g, '');
    });
  }
  return result;
};

// 启动后端服务（使用 Electron 内置 Node，无需目标机器安装 Node.js）
const startBackend = () => {
  const backendPath = getBackendPath();
  const backendEntry = path.join(backendPath, 'dist', 'index.js');
  const userDir = getUserDataDir();
  const dbFile = ensureDatabase(backendPath);
  const fileEnv = readEnvFile(backendPath);

  console.log('Starting backend from:', backendEntry);
  console.log('Database file:', dbFile);

  backendProcess = spawn(process.execPath, [backendEntry], {
    cwd: userDir, // 可写目录：winston 日志写入 userDir/logs
    stdio: 'inherit',
    env: {
      ...process.env,
      ...fileEnv,
      ELECTRON_RUN_AS_NODE: '1',
      NODE_ENV: 'production',
      PORT: '3000',
      DATABASE_URL: 'file:' + dbFile.replace(/\\/g, '/'),
      CORS_ORIGIN: '*'
    }
  });

  backendProcess.on('error', (err) => {
    console.error('Failed to start backend:', err);
  });

  backendProcess.on('exit', (code) => {
    console.log('Backend exited with code:', code);
  });
};

// 停止后端服务
const stopBackend = () => {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
};

// 创建主窗口
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: '公司法务智慧管理系统',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false
  });

  // 加载前端页面
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 处理外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

// 创建系统托盘
const createTray = () => {
  const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
  tray = new Tray(iconPath);
  
  const contextMenu = Menu.buildFromTemplate([
    { label: '显示主窗口', click: () => mainWindow?.show() },
    { label: '重启后端服务', click: () => { stopBackend(); startBackend(); } },
    { type: 'separator' },
    { label: '退出', click: () => { app.quit(); } }
  ]);
  
  tray.setToolTip('公司法务智慧管理系统');
  tray.setContextMenu(contextMenu);
  
  tray.on('double-click', () => {
    mainWindow?.show();
  });
};

// 创建应用菜单
const createMenu = () => {
  const template = [
    {
      label: '文件',
      submenu: [
        { label: '新建合同', accelerator: 'CmdOrCtrl+N', click: () => mainWindow?.webContents.send('menu:new-contract') },
        { type: 'separator' },
        { label: '退出', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { label: '刷新', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: '强制刷新', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { type: 'separator' },
        { label: '开发者工具', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '全屏', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        { label: '关于', click: () => {
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: '关于',
            message: '公司法务智慧管理系统',
            detail: `版本: ${app.getVersion()}\n\n基于 Electron + React + Node.js 构建`
          });
        }}
      ]
    }
  ];
  
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

// 应用生命周期
app.whenReady().then(() => {
  // 生产环境启动后端
  if (!isDev) {
    startBackend();
  }
  
  createWindow();
  createMenu();
  createTray();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopBackend();
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  dialog.showErrorBox('应用程序错误', error.message);
});
