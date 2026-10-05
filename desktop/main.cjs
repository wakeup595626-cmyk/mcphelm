// MCPHelm desktop main process.
// Wraps the same local panel in a native window and adds: tray, auto-launch,
// offline notifications and in-app self update via electron-updater.

const { app, BrowserWindow, Menu, Tray, dialog, shell, nativeImage, Notification } = require('electron');
const { existsSync, readFileSync, mkdirSync, readdirSync, statSync, copyFileSync, writeFileSync, unlinkSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

/* ------------------------------------------------------------- 数据目录（C 盘零占用）
 * 规则：软件产生的所有文件（配置/日志/运行时/缓存/临时/窗口会话数据/崩溃转储）
 * 一律落在数据根下，数据根默认放在程序所在盘的 <安装目录>\data，
 * 因此装到 D 盘就连数据一起在 D 盘，正常运行不会在 C 盘生成任何文件。
 * 用户可在 exe 旁放 mcphelm.data.json（{"dataRoot": "D:\\somewhere"}）自定义位置。
 */

/** 安装目录：便携版要认 PORTABLE_EXECUTABLE_DIR（否则会指到临时解压目录） */
function installBaseDir() {
  const portable = process.env.PORTABLE_EXECUTABLE_DIR;
  if (app.isPackaged && portable && path.isAbsolute(portable)) return portable;
  return path.dirname(app.getPath('exe'));
}

const INSTALL_DIR = installBaseDir();
const POINTER_FILE = path.join(INSTALL_DIR, 'mcphelm.data.json');

function defaultDataRoot() {
  if (app.isPackaged) return path.join(INSTALL_DIR, 'data');
  return path.join(os.homedir(), '.mcphelm');
}

function writableDir(dir) {
  try {
    mkdirSync(dir, { recursive: true });
    const probe = path.join(dir, '.write-test-' + process.pid);
    writeFileSync(probe, 'ok', 'utf8');
    try { unlinkSync(probe); } catch { /* 探针文件残留也不影响 */ }
    return true;
  } catch {
    return false;
  }
}

function readDataRoot() {
  try {
    if (existsSync(POINTER_FILE)) {
      const parsed = JSON.parse(readFileSync(POINTER_FILE, 'utf8'));
      if (parsed && typeof parsed.dataRoot === 'string' && parsed.dataRoot.trim()) {
        return path.resolve(parsed.dataRoot.trim());
      }
    }
  } catch {
    // 指针文件损坏时回退默认位置，界面迁移时会重写它
  }
  return defaultDataRoot();
}

function copyDirRecursive(src, dst) {
  mkdirSync(dst, { recursive: true });
  for (const entry of readdirSync(src)) {
    if (entry === 'desktop') continue; // 桌面会话数据不跨环境搬运
    const from = path.join(src, entry);
    const to = path.join(dst, entry);
    const stat = statSync(from);
    if (stat.isDirectory()) copyDirRecursive(from, to);
    else if (stat.isFile() && !existsSync(to)) copyFileSync(from, to);
  }
}

let DATA_ROOT = readDataRoot();
let DATA_FALLBACK = false;

// 安装目录可能不可写（例如装到 C:\Program Files 时）。这种情况退回到用户目录，
// 并在界面里提示建议迁移到其他盘。
if (app.isPackaged && !writableDir(DATA_ROOT)) {
  const fallbackRoot = path.join(
    process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
    'MCPHelm',
    'data'
  );
  if (fallbackRoot !== DATA_ROOT && writableDir(fallbackRoot)) {
    DATA_ROOT = fallbackRoot;
    DATA_FALLBACK = true;
  }
}

// 首次从旧版（数据在 C 盘 ~\.mcphelm）升级时，把既有配置/日志/运行时一并搬过来，
// 旧目录保留原样作为备份，用户确认无误后可自行删除。
try {
  const legacy = path.join(os.homedir(), '.mcphelm');
  const marker = path.join(DATA_ROOT, '.migrated-from-legacy');
  if (app.isPackaged && DATA_ROOT !== legacy && existsSync(legacy) && !existsSync(marker) && !existsSync(path.join(DATA_ROOT, 'config.json'))) {
    copyDirRecursive(legacy, DATA_ROOT);
    writeFileSync(marker, 'migrated from ' + legacy + ' at ' + new Date().toISOString() + '\n', 'utf8');
  }
} catch {
  // 迁移失败不阻断启动；数据根仍是 DATA_ROOT，旧数据仍在原处
}

mkdirSync(DATA_ROOT, { recursive: true });
process.env.MCPHELM_HOME = DATA_ROOT;

const DESKTOP_DATA = path.join(DATA_ROOT, 'desktop');
const EXPORTS_DIR = path.join(DATA_ROOT, 'exports');
for (const sub of ['userData', 'sessionData', 'cache', 'temp', 'logs', 'crashDumps']) {
  const target = path.join(DESKTOP_DATA, sub);
  mkdirSync(target, { recursive: true });
  app.setPath(sub, target);
}
// 软件里"备份配置"等触发的下载默认保存到数据根下，不落到 C 盘下载文件夹
mkdirSync(EXPORTS_DIR, { recursive: true });
try { app.setPath('downloads', EXPORTS_DIR); } catch { /* 尽力而为 */ }

// 子进程（tunnel-client、用户自己用 npx/uvx 拉起的 MCP 服务器）的缓存与临时目录
// 一并引到数据根，避免它们把缓存写回 C 盘。
const CACHE_ROOT = path.join(DATA_ROOT, 'cache');
const TMP_ROOT = path.join(DATA_ROOT, 'tmp');
mkdirSync(CACHE_ROOT, { recursive: true });
mkdirSync(TMP_ROOT, { recursive: true });
const envDefaults = {
  NPM_CONFIG_CACHE: path.join(CACHE_ROOT, 'npm'),
  npm_config_cache: path.join(CACHE_ROOT, 'npm'),
  PIP_CACHE_DIR: path.join(CACHE_ROOT, 'pip'),
  UV_CACHE_DIR: path.join(CACHE_ROOT, 'uv'),
  XDG_CACHE_HOME: CACHE_ROOT,
  TEMP: TMP_ROOT,
  TMP: TMP_ROOT,
};
for (const [key, value] of Object.entries(envDefaults)) {
  if (!process.env[key]) process.env[key] = value;
}

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

  let paths = resolvePaths({ cwd: DATA_ROOT, env: process.env });
  if (!existsSync(paths.configFile)) {
    saveConfig(paths, emptyConfig());
    paths = resolvePaths({ cwd: DATA_ROOT, env: process.env });
  }
  const loaded = loadConfig(paths);

  panel = await startPanel({
    paths,
    config: loaded.config,
    configIssues: loaded.issues,
    port: 0,
    host: '127.0.0.1',
    dataLocation: {
      dataRoot: DATA_ROOT,
      desktopDir: DESKTOP_DATA,
      isDesktop: true,
      canMigrate: app.isPackaged,
      fallback: DATA_FALLBACK,
      chooseFolder: async (defaultPath) => {
        const win = mainWindow && !mainWindow.isDestroyed() ? mainWindow : undefined;
        const options = {
          title: '选择新的数据目录',
          defaultPath: defaultPath || undefined,
          buttonLabel: '选择此文件夹',
          properties: ['openDirectory', 'createDirectory'],
        };
        const result = win
          ? await dialog.showOpenDialog(win, options)
          : await dialog.showOpenDialog(options);
        if (result.canceled || !result.filePaths || !result.filePaths[0]) return null;
        return result.filePaths[0];
      },
      migrate: async (newRoot) => {
        if (!app.isPackaged) throw new Error('开发模式下不支持迁移数据目录');
        const target = path.resolve(String(newRoot || ''));
        if (!target || target.length < 3) throw new Error('目标路径无效');
        if (target.toLowerCase() === DATA_ROOT.toLowerCase()) throw new Error('新目录与当前数据目录相同');
        const systemDrive = (process.env.SystemDrive || 'C:').toUpperCase();
        if (target.toUpperCase().startsWith(systemDrive + '\\') || target.toUpperCase() === systemDrive) {
          throw new Error('不能把数据目录放到系统盘（' + systemDrive + '），请选择其他磁盘');
        }
        // 复制业务数据（desktop 会话数据不带过去，重启后自动重建）
        for (const sub of ['config.json', 'config.backup.json']) {
          const from = path.join(DATA_ROOT, sub);
          if (existsSync(from)) {
            mkdirSync(target, { recursive: true });
            copyFileSync(from, path.join(target, sub));
          }
        }
        for (const sub of ['run', 'logs', 'bin', 'cache', 'tmp', 'exports']) {
          const from = path.join(DATA_ROOT, sub);
          if (existsSync(from)) copyDirRecursive(from, path.join(target, sub));
        }
        // 先验证指针能写、目录可用，再切换
        mkdirSync(target, { recursive: true });
        try {
          writeFileSync(POINTER_FILE, JSON.stringify({ dataRoot: target }, null, 2) + '\n', 'utf8');
        } catch {
          throw new Error('数据已复制完成，但无法写入程序目录（' + POINTER_FILE + '）。请以管理员身份重新打开 MCPHelm 后再点一次迁移。');
        }
        return target;
      },
    },
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

  // 界面里的下载（如“备份配置”）默认保存到数据根下的 exports\，不落到 C 盘
  try {
    mainWindow.webContents.session.on('will-download', (event, item) => {
      try {
        mkdirSync(EXPORTS_DIR, { recursive: true });
        item.setSaveDialogOptions({ defaultPath: path.join(EXPORTS_DIR, item.getFilename()) });
      } catch {
        // 对话框给不出默认路径时用户仍可手动选择
      }
    });
  } catch {
    // session 不可用时忽略
  }

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
