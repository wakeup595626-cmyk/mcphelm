// MCPHelm desktop main process.
// Wraps the same local panel in a native window and adds: tray, auto-launch,
// offline notifications and in-app self update via electron-updater.

const { app, BrowserWindow, Menu, Tray, dialog, shell, nativeImage, Notification } = require('electron');
const { existsSync, readFileSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

let autoUpdater = null;
try {
  autoUpdater = require('electron-updater').autoUpdater;
} catch {
  autoUpdater = null;
}

const DIST = path.join(__dirname, '..', 'dist');
const ICON = path.join(__dirname, '..', 'build', 'icon.ico');
const ICON_32 = path.join(__dirname, '..', 'build', 'icon-32.png');
const importDist = (rel) => import(pathToFileURL(path.join(DIST, rel)).href);

let mainWindow = null;
let tray = null;
let panel = null;
let context = null;
let quitting = false;
let updateWatcher = null;

async function startBackend() {
  const { resolvePaths } = await importDist('paths.js');
  const { loadConfig, emptyConfig, saveConfig } = await importDist('store.js');
  const { startPanel } = await importDist('panel/server.js');

  let paths = resolvePaths({ cwd: os.homedir(), env: process.env });
  if (!existsSync(paths.configFile)) {
    saveConfig(paths, emptyConfig());
    paths = resolvePaths({ cwd: os.homedir(), env: process.env });
  }
  const loaded = loadConfig(paths);

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

function uiPrefs() {
  const ui = (context && context.loaded.config.ui) || {};
  return {
    minimizeToTray: ui.minimizeToTray !== false,
    autoLaunch: ui.autoLaunch === true,
  };
}

function applyLoginItem() {
  const enabled = uiPrefs().autoLaunch;
  try {
    app.setLoginItemSettings({ openAtLogin: enabled, args: [] });
  } catch {
    // best effort on platforms that do not support it
  }
}

function notify(title, body) {
  try {
    if (Notification.isSupported()) new Notification({ title, body }).show();
  } catch {
    // notifications are best effort
  }
}

function trayIcon() {
  const file = existsSync(ICON_32) ? ICON_32 : ICON;
  const image = nativeImage.createFromPath(file);
  return image.isEmpty() ? undefined : image;
}

function ensureTray() {
  if (tray) return;
  const icon = trayIcon();
  tray = new Tray(icon || nativeImage.createEmpty());
  tray.setToolTip('MCPHelm');
  tray.on('double-click', () => showWindow());
  rebuildTrayMenu();
}

function rebuildTrayMenu(statusText) {
  if (!tray) return;
  const menu = Menu.buildFromTemplate([
    { label: statusText || 'MCPHelm', enabled: false },
    { type: 'separator' },
    { label: '打开主窗口', click: () => showWindow() },
    { label: '打开日志文件夹', click: () => context && shell.openPath(context.paths.logsDir) },
    { type: 'separator' },
    {
      label: quitting ? '正在退出…' : '退出 MCPHelm',
      click: () => {
        quitting = true;
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(menu);
}

function showWindow() {
  if (!mainWindow) {
    if (panel) createWindow(panel.url);
    return;
  }
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function watchTunnelHealth() {
  // Desktop-only drop notification: poll panel state and fire a system
  // notification when a tunnel transitions from running to crashed.
  const wasRunning = new Map();
  updateWatcher = setInterval(async () => {
    if (!panel) return;
    try {
      const res = await fetch('http://127.0.0.1:' + panel.port + '/api/state', {
        headers: { 'x-mcphelm-token': panel.token },
      });
      if (!res.ok) return;
      const state = await res.json();
      for (const tunnel of state.tunnels || []) {
        const running = tunnel.status && tunnel.status.state === 'running';
        const prev = wasRunning.get(tunnel.name);
        if (prev === true && !running) {
          notify('隧道掉线', '隧道 ' + tunnel.name + ' 已停止运行，守护进程正在自动拉起，可在面板查看详情。');
        }
        wasRunning.set(tunnel.name, running);
      }
      rebuildTrayMenu(
        'MCPHelm · ' +
          (state.counts ? state.counts.running + '/' + state.counts.tunnels + ' 隧道在线' : '')
      );
    } catch {
      // panel temporarily unavailable, next tick retries
    }
  }, 10000);
  updateWatcher.unref();
}

function setupAutoUpdate() {
  if (!autoUpdater || !app.isPackaged) return;
  autoUpdater.autoDownload = true;
  autoUpdater.on('update-downloaded', (info) => {
    notify('MCPHelm 有新版本', '版本 ' + (info && info.version ? info.version : '') + ' 已下载完成，重启应用后生效。');
    if (mainWindow) {
      dialog
        .showMessageBox(mainWindow, {
          type: 'info',
          title: '发现新版本',
          message: 'MCPHelm ' + (info && info.version ? info.version : '') + ' 已下载完成',
          detail: '现在重启应用完成更新，或稍后手动重启。',
          buttons: ['立即重启更新', '稍后'],
          defaultId: 0,
          cancelId: 1,
        })
        .then((choice) => {
          if (choice.response === 0) {
            quitting = true;
            autoUpdater.quitAndInstall();
          }
        });
    }
  });
  autoUpdater.on('error', () => {
    // stay quiet on update check failure; the app keeps working offline
  });
  autoUpdater.checkForUpdates().catch(() => {});
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
        {
          label: '登录系统后自动启动',
          type: 'checkbox',
          checked: uiPrefs().autoLaunch,
          click: async (item) => {
            const { saveConfig } = await importDist('store.js');
            context.loaded.config.ui = context.loaded.config.ui || {};
            context.loaded.config.ui.autoLaunch = item.checked;
            saveConfig(context.paths, context.loaded.config);
            applyLoginItem();
          },
        },
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
  mainWindow.on('close', (event) => {
    if (!quitting && uiPrefs().minimizeToTray) {
      event.preventDefault();
      mainWindow.hide();
      ensureTray();
      notify('MCPHelm 仍在后台运行', '隧道保持在线；双击托盘图标可重新打开窗口。');
    }
  });
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

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
    applyLoginItem();
    ensureTray();
    createWindow(handle.url);
    watchTunnelHealth();
    setupAutoUpdate();
  } catch (err) {
    dialog.showErrorBox('MCPHelm 启动失败', String((err && err.message) || err));
    app.quit();
  }
}

app.setName('MCPHelm');

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => showWindow());

  app.whenReady().then(boot);

  app.on('window-all-closed', () => {
    if (!uiPrefs().minimizeToTray) app.quit();
  });

  app.on('before-quit', () => {
    quitting = true;
    if (updateWatcher) clearInterval(updateWatcher);
    if (panel) void panel.close();
  });
}
