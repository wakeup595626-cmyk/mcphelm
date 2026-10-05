// MCPHelm 桌面版主进程：把已有的本地面板装进一个原生窗口。
// 复用 dist/ 里同一套逻辑（配置解析、面板服务），不重复实现任何业务功能。

const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const { existsSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const DIST = path.join(__dirname, '..', 'dist');
const ICON = path.join(__dirname, '..', 'build', 'icon.ico');
const importDist = (rel) => import(pathToFileURL(path.join(DIST, rel)).href);

let mainWindow = null;
let panel = null;
let context = null;

/** 启动本地服务：解析配置（必要时创建一份空的）→ 起面板 → 返回地址 */
async function startBackend() {
  const { resolvePaths } = await importDist('paths.js');
  const { loadConfig, emptyConfig, saveConfig } = await importDist('store.js');
  const { startPanel } = await importDist('panel/server.js');

  // 以用户主目录为基准解析配置，和「在家里敲命令」的行为一致
  let paths = resolvePaths({ cwd: os.homedir(), env: process.env });

  if (!existsSync(paths.configFile)) {
    saveConfig(paths, emptyConfig());
    // 新建后重新解析一次，让面板正确显示「用户主目录配置」而不是「尚未创建」
    paths = resolvePaths({ cwd: os.homedir(), env: process.env });
  }
  const loaded = loadConfig(paths);

  // port 0 = 让系统分配空闲端口，永远不会和别的程序抢端口
  panel = await startPanel({
    paths,
    config: loaded.config,
    configIssues: loaded.issues,
    port: 0,
    host: '127.0.0.1',
  });
  context = { paths, loaded };
  return panel;
}

function buildMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        { label: '重新加载界面', accelerator: 'F5', click: () => mainWindow && mainWindow.reload() },
        { type: 'separator' },
        { label: '打开配置所在文件夹', click: () => context && shell.openPath(path.dirname(context.paths.configFile)) },
        { label: '打开日志文件夹', click: () => context && shell.openPath(context.paths.logsDir) },
        { type: 'separator' },
        { role: 'quit', label: '退出 MCPHelm' },
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
        { role: 'selectAll', label: '全选' },
      ],
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '刷新' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '实际大小' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' },
      ],
    },
    {
      label: '帮助',
      submenu: [
        { label: '官方隧道文档', click: () => shell.openExternal('https://developers.openai.com/api/docs/guides/secure-mcp-tunnels') },
        { label: '项目主页', click: () => shell.openExternal('https://github.com/wakeup595626-cmyk/mcphelm') },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 940,
    minHeight: 620,
    show: false,
    title: 'MCPHelm',
    backgroundColor: '#0b1220',
    autoHideMenuBar: true,
    icon: existsSync(ICON) ? ICON : undefined,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 站内链接留在窗口里，外部链接交给系统浏览器
  mainWindow.webContents.setWindowOpenHandler(({ url: target }) => {
    if (target.startsWith('http://127.0.0.1')) return { action: 'allow' };
    shell.openExternal(target);
    return { action: 'deny' };
  });

  void mainWindow.loadURL(url);
}

async function boot() {
  try {
    const handle = await startBackend();
    buildMenu();
    createWindow(handle.url);
  } catch (err) {
    dialog.showErrorBox('MCPHelm 启动失败', String((err && err.message) || err));
    app.quit();
  }
}

app.setName('MCPHelm');

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(boot);

  app.on('window-all-closed', () => {
    app.quit();
  });

  app.on('before-quit', () => {
    if (panel) void panel.close();
  });
}
