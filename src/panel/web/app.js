/* MCPHelm 控制台前端 */
'use strict';

/* ---------------- 多语言 ---------------- */
const I18N = {
  zh: {
    brandSub: '本地隧道控制台',
    tagline: '把本地 AI 能力安全接进 ChatGPT',
    navDashboard: '概览', navTunnels: '隧道', navServers: '服务器', navLogs: '日志', navDoctor: '体检', navSettings: '设置',
    metaDashboardT: '概览', metaDashboardS: '一眼看清整个接入进度',
    metaTunnelsT: '隧道', metaTunnelsS: '把本地 MCP 服务器安全地暴露给 ChatGPT',
    metaServersT: '服务器', metaServersS: '管理你本机的 MCP 服务器',
    metaLogsT: '日志', metaLogsS: '查看每条隧道的运行输出',
    metaDoctorT: '体检', metaDoctorS: '自动检查环境和配置有没有问题',
    metaSettingsT: '设置', metaSettingsS: '界面偏好、路径、密钥状态与帮助入口',
    refresh: '刷新', newTunnel: '新建隧道', downloadRuntime: '下载运行环境',
    close: '关闭', cancel: '取消', confirm: '确定', delete: '删除', save: '保存修改',
    opFailed: '操作失败', deleteTunnel: '删除隧道',
    deleteTunnelMsg: '确定要删除隧道 <strong>{n}</strong> 吗？<br>这只会移除 MCPHelm 里的登记，不会影响 OpenAI 平台上的隧道。',
    tunnelDeleted: '已删除隧道 {n}', serverDeleted: '已删除服务器 {n}',
    tunnelStarted: '隧道 {n} 已启动', tunnelStopped: '隧道 {n} 已停止', tunnelRestarted: '隧道 {n} 已重启',
    serverAdded: '已添加服务器 {n}', saved: '已保存 {n}',
    tunnelCreated: '已创建隧道 {n}，点"启动"即可上线',
    runtimeReadyToast: '运行环境已就绪',
    downloadFailed: '下载失败：', importedRuntime: '已导入运行环境',
    noZipPath: '请填 zip 文件路径', fillName: '请填写名称', fillCommand: '请填写启动命令',
    fillUrl: '请填写服务地址', fillEnvName: '请填写环境变量名', fillKey: '请粘贴 runtime key',
    fillTunnelId: '请填写隧道 ID', badPort: '端口必须是 1-65535 的整数',
    offline: '无法连接本地服务：',
    envMissing: '缺少运行环境', envOk: '环境正常', envBadCfg: '配置有 {n} 个问题',
    statTunnels: '隧道总数', statRunning: '运行中', statHealthy: '健康通过', statAttention: '需要关注',
    heroTitle: '三步把你的本地 AI 能力接进 ChatGPT',
    heroP: 'MCPHelm 帮你把运行在本机的 MCP 服务器，通过 OpenAI 官方安全隧道接到 ChatGPT。全程不用敲命令，跟着下面三步走就行。',
    heroProgress: '{d} / {t} 步已完成',
    stepRuntime: '准备运行环境',
    stepRuntimeDone: '官方 tunnel-client 已就绪', stepRuntimeDoneV: '（v{v}）',
    stepRuntimeTodo: '下载 OpenAI 官方 tunnel-client，这是隧道能跑起来的发动机',
    redownload: '重新下载', oneClickDownload: '一键下载',
    stepServer: '添加 MCP 服务器',
    stepServerDone: '已登记 {n} 个服务器',
    stepServerTodo: '告诉 MCPHelm 你本地要暴露哪个 MCP 服务器（命令或地址）',
    addAnother: '再添加一个', addServer: '添加服务器',
    stepTunnel: '创建并启动隧道',
    stepTunnelDone: '已有 {n} 条隧道，随时可以启动',
    stepTunnelTodo: '填入 OpenAI 平台发的隧道 ID 和密钥，把服务器接到 ChatGPT',
    manageTunnels: '管理隧道', createTunnel: '创建隧道',
    whereTitle: '隧道 ID 和密钥要去哪拿？',
    whereP1: '① 打开 {a}，用你的 OpenAI 账号创建一个隧道，拿到 tunnel_ 开头的隧道 ID；',
    whereP1a: 'OpenAI 平台 · 隧道管理',
    whereP2: '② 打开 {a}，生成一把 runtime key 当作密钥，粘贴到第 ③ 步的表单里；',
    whereP2a: 'OpenAI 平台 · API 密钥',
    whereP3: '③ 回到这里点"创建隧道"，填好 ID 和密钥，点启动，就能在 {a} 里看到它、直接用了。',
    whereP3a: 'ChatGPT 连接器设置',
    attentionLine: '<strong>有 {n} 处需要关注。</strong> 去<a href="#" data-goto="doctor">体检</a>看看具体问题和修复建议。',
    dashTunnels: '隧道一览', dashTunnelsSub: '点击卡片上的按钮即可启动、停止或查看日志',
    stRunningOk: '运行正常', stHealthBad: '健康检查未过', stRunning: '运行中', stError: '出错了',
    stStale: '状态残留', stStopped: '已停止',
    keyReady: '密钥就绪', keyMissing: '密钥未就绪', keyFrom: '密钥来源：',
    stop: '停止', restart: '重启', start: '启动', logs: '日志', edit: '编辑',
    tunnelEmptyH: '还没有隧道',
    tunnelEmptyP: '隧道是连接本地服务器和 ChatGPT 的桥梁。先确认已添加服务器，再创建第一条隧道。',
    createFirstTunnel: '创建第一条隧道',
    serverEmptyH: '还没有登记 MCP 服务器',
    serverEmptyP: '把你想给 ChatGPT 用的本地 MCP 服务器登记在这里——可以是一条启动命令（stdio），也可以是一个本机 HTTP 地址。',
    fromTemplate: '从模板新建', importConfig: '导入已有配置',
    deleteServer: '删除服务器', deleteServerMsg: '确定要删除服务器 <strong>{n}</strong> 吗？',
    deleteServerWarn: '<br><span style="color:var(--red)">注意：正被隧道 {l} 使用，删除前需先删掉这些隧道。</span>',
    usedByN: '被 {n} 条隧道使用', usedByNone: '还没有隧道使用',
    kindHttp: 'HTTP 服务', kindStdio: '命令型',
    logEmptyH: '还没有可查看的日志',
    logEmptyP: '创建并启动一条隧道后，它的运行输出会实时出现在这里。',
    goCreateTunnel: '去创建隧道', logTitle: '运行日志', logSub: '选择一条隧道，实时查看它的输出',
    logAuto: '自动刷新', logLoading: '加载中…', logNone: '（还没有日志输出，启动隧道后这里会有内容）',
    logTruncated: '（仅显示末尾 400 行）', openDir: '打开目录', backupConfig: '备份配置',
    doctorTitle: '环境体检', doctorSub: '自动检查运行环境、配置和连通性，把问题摆在明面上',
    doctorRun: '重新体检', doctorRunOnline: '含联网检查', doctorIdle: '点击"重新体检"开始检查。',
    doctorChecking: '正在检查', doctorOnlineNote: '（含联网，可能稍慢）',
    doctorAllOk: '一切正常', doctorAllOkSub: '没有发现问题', doctorFailed: '体检失败：',
    doctorHint: '建议：', checkItem: '检查项',
    cfgProblems: '配置问题', cfgProblemsSub: '来自配置文件的直接校验结果',
    lvlError: '错误', lvlWarn: '警告',
    secPrefs: '界面与偏好', secPrefsSub: '语言、桌面行为（即时生效）',
    languageLabel: '界面语言',
    prefTray: '关闭窗口时最小化到系统托盘（隧道保持在线）',
    prefAutoLaunch: '登录 Windows 后自动启动 MCPHelm',
    savePrefs: '保存偏好', prefsSaved: '偏好已保存',
    secLocal: '本地环境', secLocalSub: 'MCPHelm 在你电脑上的位置',
    kvVersion: '版本', kvHome: '数据目录', kvConfig: '配置文件', kvLogs: '日志目录', kvScope: '配置来源',
    openHome: '打开数据目录', openLogs: '打开日志目录',
    secData: '数据位置', secDataSub: '软件产生的所有文件都在这一个目录里，C 盘零占用',
    dlRoot: '数据总目录', dlRuntime: '运行时（tunnel-client）', dlLogs: '日志', dlCache: '第三方缓存', dlDesktop: '桌面版数据',
    dlHint: '配置、日志、运行时、下载缓存、临时文件、窗口会话数据全部保存在这里。系统盘（C 盘）不会产生任何文件。',
    dlOpen: '打开数据总目录', dlMigrate: '迁移到其他盘…', dlMigrating: '正在迁移…', dlRestart: '迁移完成',
    dlRestartHint: '数据已复制到新目录。请完全退出 MCPHelm（托盘图标右键 → 退出）再重新打开，新位置才会生效。原目录保留作为备份，确认无误后可手动删除。',
    dlNoMigrate: '当前以命令行方式运行，可用环境变量 MCPHELM_HOME 指定数据目录。',
    dlSameWarn: '迁移只复制不删除，原目录会保留作为备份。',
    dlFallbackWarn: '程序安装目录不可写，数据暂时退回到系统用户目录。建议点“迁移到其他盘”换到非系统盘位置。',
    secRuntime: '运行环境', secRuntimeSub: 'OpenAI 官方 tunnel-client',
    rtStatus: '状态', rtReady: '已就绪', rtVersion: '版本', rtSource: '来源', rtPath: '路径', rtUnknown: '未知',
    rtMissing: '<strong>运行环境缺失。</strong>隧道无法启动，请先下载官方 tunnel-client。',
    downloadNow: '立即下载', importLocal: '导入本地安装包',
    secHelp: '帮助与入口', secHelpSub: '常用官方页面，新用户跟着走',
    lnkTunnels: 'OpenAI 平台 · 隧道管理（创建隧道拿 ID）',
    lnkApiKeys: 'OpenAI 平台 · API 密钥（拿 runtime key）',
    lnkGuide: '官方文档 · 安全隧道指南',
    lnkConnectors: 'ChatGPT · 连接器设置（最终在这里用）',
    lnkRepo: 'tunnel-client 官方仓库',
    secAbout: '关于 MCPHelm',
    aboutP: 'MCPHelm 是一个开源的本地隧道管理器，把 OpenAI 官方 tunnel-client 包装成人人能用的图形界面：不用记命令、不用背参数，点几下就能把自己电脑上跑的 MCP 服务器安全地接进 ChatGPT。',
    aboutRepo: '项目仓库', aboutSafe: '你的密钥只保存在你自己的电脑上，MCPHelm 不会上传任何数据。',
    smAddTitle: '添加 MCP 服务器', smEditTitle: '编辑服务器',
    smSub: '登记你本机要暴露给 ChatGPT 的服务',
    fName: '名称', fNamePh: '例如 my-files 或 local-notes',
    fNameHint: '字母、数字开头，可含 . _ -，是这台服务器的唯一称呼',
    fKind: '类型', fKindStdio: '命令型 (stdio)', fKindHttp: 'HTTP 服务',
    kindHintStdio: 'MCPHelm 负责启动这条命令，适合绝大多数 MCP 服务器',
    kindHintHttp: '你自己已经在本机把服务跑起来了，MCPHelm 只做转发',
    fCommand: '启动命令', fCommandHint: 'MCPHelm 会通过隧道帮你拉起并管理这个进程',
    fUrl: '服务地址', fUrlHint: '已经在本机跑着的 MCP HTTP 端点',
    fHeaders: '额外的请求头（可选）', fHeadersPh: '每行一个，格式 Key: Value',
    fDesc: '备注（可选）', fDescPh: '一句话说明这台服务器是干嘛的',
    testConn: '测试连通性', testRunning: '正在测试…', testOk: '连通正常', testFail: '连通失败',
    add: '添加',
    tmCreateTitle: '创建隧道', tmEditTitle: '编辑隧道', tmSub: '把一台本地服务器接到 ChatGPT',
    fServerBind: '绑定服务器', fTunnelId: '隧道 ID',
    fTunnelIdHint: '在 {a} 创建隧道后获得，格式 tunnel_ + 32 位字符', fTunnelIdA: 'OpenAI 平台 · 隧道管理',
    fKey: '密钥（runtime key）',
    keyModeEnv: '环境变量', keyModeKeyring: '密钥保险箱（推荐）', keyModeInline: '直接填写',
    fKeyEnv: '环境变量名', fKeyEnvHint: '密钥不落盘，启动时从该环境变量读取',
    fKeyKeyringHint: '密钥只存进 Windows 凭据管理器，不写进任何配置文件，本机最安全的方式',
    fKeyInlinePh: '粘贴 OpenAI 平台生成的 runtime key',
    fKeyInlineHint: '在 {a} 生成', fKeyInlineA: 'OpenAI 平台 · API 密钥', fKeyKeep: '；已保存过密钥，留空表示保持不变',
    fHealthPort: '健康检查端口（可选）',
    needServerTitle: '先添加服务器',
    needServerMsg: '创建隧道前，需要先登记至少一台 MCP 服务器。现在去添加吗？',
    goAdd: '去添加',
    rmTitle: '下载运行环境', rmSub: '从 OpenAI 官方仓库下载 tunnel-client，自动校验完整性',
    rmInfo: 'tunnel-client 是 OpenAI 官方发布的隧道客户端，MCPHelm 会从 {a} 下载并做 SHA-256 校验，全程自动化。',
    rmInfoA: '官方仓库', startDownload: '开始下载', unknownError: '未知错误',
    riTitle: '导入本地安装包', riSub: '如果你已经手动下载了官方 zip，可以直接导入',
    fZipPath: 'zip 文件路径', fZipVer: '版本号（可选）', fZipVerPh: '留空则自动识别', doImport: '导入',
    tplTitle: '从模板新建服务器', tplSub: '挑一个常用服务器，一键填入，再按提示改路径',
    tplUse: '用这个模板',
    imTitle: '导入已有的 MCP 配置', imSub: '自动发现 Claude / Cursor / VS Code 里配好的服务器，一键搬过来',
    imTabScan: '扫描本机配置', imTabPaste: '粘贴配置文本',
    imScanning: '正在扫描本机…', imRescan: '重新扫描',
    imNoneFound: '没有找到 Claude Desktop / Cursor / VS Code 的 MCP 配置文件。可以试试旁边的"粘贴配置文本"。',
    imParseErr: '这个文件读取有问题：',
    imPickFile: '选文件导入',
    imPasteHint: '把 Claude / Cursor / VS Code 配置文件里的内容（含 mcpServers 段）原样粘贴进来：',
    imPasteBtn: '解析粘贴内容',
    imPickAll: '全选', imPickNone: '全不选',
    imOverwrite: '覆盖同名服务器',
    imDoApply: '导入选中的 {n} 个',
    imDone: '导入完成：新增 {a} 个，覆盖 {r} 个，跳过 {s} 个',
    imNothing: '请先勾选要导入的服务器',
    imServersN: '{n} 个服务器',
  },
  en: {
    brandSub: 'Local Tunnel Console',
    tagline: 'Securely connect local AI power to ChatGPT',
    navDashboard: 'Overview', navTunnels: 'Tunnels', navServers: 'Servers', navLogs: 'Logs', navDoctor: 'Doctor', navSettings: 'Settings',
    metaDashboardT: 'Overview', metaDashboardS: 'Your whole setup at a glance',
    metaTunnelsT: 'Tunnels', metaTunnelsS: 'Safely expose local MCP servers to ChatGPT',
    metaServersT: 'Servers', metaServersS: 'Manage MCP servers on this machine',
    metaLogsT: 'Logs', metaLogsS: 'Live output of every tunnel',
    metaDoctorT: 'Doctor', metaDoctorS: 'Check environment and config automatically',
    metaSettingsT: 'Settings', metaSettingsS: 'Preferences, paths, key status and help',
    refresh: 'Refresh', newTunnel: 'New Tunnel', downloadRuntime: 'Download Runtime',
    close: 'Close', cancel: 'Cancel', confirm: 'OK', delete: 'Delete', save: 'Save',
    opFailed: 'Operation failed', deleteTunnel: 'Delete tunnel',
    deleteTunnelMsg: 'Delete tunnel <strong>{n}</strong>?<br>This only removes the entry in MCPHelm; the tunnel on the OpenAI platform is untouched.',
    tunnelDeleted: 'Tunnel {n} deleted', serverDeleted: 'Server {n} deleted',
    tunnelStarted: 'Tunnel {n} started', tunnelStopped: 'Tunnel {n} stopped', tunnelRestarted: 'Tunnel {n} restarted',
    serverAdded: 'Server {n} added', saved: '{n} saved',
    tunnelCreated: 'Tunnel {n} created — press Start to go live',
    runtimeReadyToast: 'Runtime is ready',
    downloadFailed: 'Download failed: ', importedRuntime: 'Runtime imported',
    noZipPath: 'Please enter the zip path', fillName: 'Please enter a name', fillCommand: 'Please enter the launch command',
    fillUrl: 'Please enter the service URL', fillEnvName: 'Please enter the env var name', fillKey: 'Please paste the runtime key',
    fillTunnelId: 'Please enter the tunnel ID', badPort: 'Port must be an integer between 1 and 65535',
    offline: 'Cannot reach the local service: ',
    envMissing: 'Runtime missing', envOk: 'Environment OK', envBadCfg: '{n} config issue(s)',
    statTunnels: 'Tunnels', statRunning: 'Running', statHealthy: 'Healthy', statAttention: 'Attention',
    heroTitle: 'Connect your local AI power to ChatGPT in 3 steps',
    heroP: 'MCPHelm bridges MCP servers running on this machine to ChatGPT through the official OpenAI secure tunnel. No commands to remember — just follow the three steps below.',
    heroProgress: '{d} / {t} steps done',
    stepRuntime: 'Prepare the runtime',
    stepRuntimeDone: 'Official tunnel-client is ready', stepRuntimeDoneV: ' (v{v})',
    stepRuntimeTodo: 'Download the official OpenAI tunnel-client — the engine that powers tunnels',
    redownload: 'Re-download', oneClickDownload: 'Download',
    stepServer: 'Add an MCP server',
    stepServerDone: '{n} server(s) registered',
    stepServerTodo: 'Tell MCPHelm which local MCP server to expose (a command or an address)',
    addAnother: 'Add another', addServer: 'Add server',
    stepTunnel: 'Create and start a tunnel',
    stepTunnelDone: '{n} tunnel(s) configured, ready to start',
    stepTunnelTodo: 'Paste the tunnel ID and key from the OpenAI platform to wire a server into ChatGPT',
    manageTunnels: 'Manage tunnels', createTunnel: 'Create tunnel',
    whereTitle: 'Where do I get a tunnel ID and key?',
    whereP1: '1. Open {a}, sign in with your OpenAI account and create a tunnel to get a tunnel_ ID;',
    whereP1a: 'OpenAI Platform · Tunnels',
    whereP2: '2. Open {a} and generate a runtime key — that is the secret you paste in step 3;',
    whereP2a: 'OpenAI Platform · API keys',
    whereP3: '3. Back here, press "Create tunnel", fill in the ID and key, press start — then use it in {a}.',
    whereP3a: 'ChatGPT connector settings',
    attentionLine: '<strong>{n} thing(s) need attention.</strong> Open <a href="#" data-goto="doctor">Doctor</a> for details and fixes.',
    dashTunnels: 'Your tunnels', dashTunnelsSub: 'Use the buttons on each card to start, stop or view logs',
    stRunningOk: 'Healthy', stHealthBad: 'Health check failing', stRunning: 'Running', stError: 'Error',
    stStale: 'Stale state', stStopped: 'Stopped',
    keyReady: 'Key ready', keyMissing: 'Key missing', keyFrom: 'Key source: ',
    stop: 'Stop', restart: 'Restart', start: 'Start', logs: 'Logs', edit: 'Edit',
    tunnelEmptyH: 'No tunnels yet',
    tunnelEmptyP: 'A tunnel is the bridge between a local server and ChatGPT. Add a server first, then create your first tunnel.',
    createFirstTunnel: 'Create my first tunnel',
    serverEmptyH: 'No MCP servers registered',
    serverEmptyP: 'Register the local MCP servers you want ChatGPT to use — either a launch command (stdio) or a local HTTP address.',
    fromTemplate: 'From a template', importConfig: 'Import existing config',
    deleteServer: 'Delete server', deleteServerMsg: 'Delete server <strong>{n}</strong>?',
    deleteServerWarn: '<br><span style="color:var(--red)">Warning: used by tunnel(s) {l}. Delete those tunnels first.</span>',
    usedByN: 'Used by {n} tunnel(s)', usedByNone: 'No tunnel uses it yet',
    kindHttp: 'HTTP', kindStdio: 'Command',
    logEmptyH: 'No logs yet',
    logEmptyP: 'Once a tunnel is created and started, its live output will appear here.',
    goCreateTunnel: 'Create a tunnel', logTitle: 'Runtime logs', logSub: 'Pick a tunnel to watch its output live',
    logAuto: 'Auto refresh', logLoading: 'Loading…', logNone: '(No output yet — start the tunnel to see logs here.)',
    logTruncated: '(Last 400 lines only)', openDir: 'Open folder', backupConfig: 'Back up config',
    doctorTitle: 'Environment doctor', doctorSub: 'Checks runtime, config and connectivity, and surfaces every issue',
    doctorRun: 'Run again', doctorRunOnline: 'Include online checks', doctorIdle: 'Press "Run again" to start.',
    doctorChecking: 'Checking', doctorOnlineNote: ' (online checks, may take longer)',
    doctorAllOk: 'All good', doctorAllOkSub: 'No issues found', doctorFailed: 'Doctor failed: ',
    doctorHint: 'Hint: ', checkItem: 'Check',
    cfgProblems: 'Config issues', cfgProblemsSub: 'Direct validation results from the config file',
    lvlError: 'Error', lvlWarn: 'Warning',
    secPrefs: 'Interface & preferences', secPrefsSub: 'Language and desktop behavior (instant)',
    languageLabel: 'Language',
    prefTray: 'Minimize to system tray when the window is closed (tunnels stay online)',
    prefAutoLaunch: 'Start MCPHelm automatically when you sign in to Windows',
    savePrefs: 'Save preferences', prefsSaved: 'Preferences saved',
    secLocal: 'Local environment', secLocalSub: 'Where MCPHelm lives on your machine',
    kvVersion: 'Version', kvHome: 'Data folder', kvConfig: 'Config file', kvLogs: 'Logs folder', kvScope: 'Config scope',
    openHome: 'Open data folder', openLogs: 'Open logs folder',
    secData: 'Data location', secDataSub: 'Everything MCPHelm writes lives in one folder — zero footprint on your system drive',
    dlRoot: 'Data folder', dlRuntime: 'Runtime (tunnel-client)', dlLogs: 'Logs', dlCache: 'Package caches', dlDesktop: 'Desktop app data',
    dlHint: 'Config, logs, runtime, download caches, temp files and window session data all live here. Nothing is written to the system drive (C:).',
    dlOpen: 'Open data folder', dlMigrate: 'Move to another drive…', dlMigrating: 'Migrating…', dlRestart: 'Migration done',
    dlRestartHint: 'Data was copied to the new folder. Fully quit MCPHelm (tray icon → Quit) and reopen it for the new location to take effect. The old folder is kept as a backup — delete it once you have verified everything.',
    dlNoMigrate: 'Running from the command line — set the MCPHELM_HOME environment variable to choose the data folder.',
    dlSameWarn: 'Migration copies only; the old folder stays as a backup.',
    dlFallbackWarn: 'The install folder is not writable, so data lives in your user folder for now. Use "Move to another drive" to place it outside the system drive.',
    secRuntime: 'Runtime', secRuntimeSub: 'Official OpenAI tunnel-client',
    rtStatus: 'Status', rtReady: 'Ready', rtVersion: 'Version', rtSource: 'Source', rtPath: 'Path', rtUnknown: 'Unknown',
    rtMissing: '<strong>Runtime missing.</strong> Tunnels cannot start — download the official tunnel-client first.',
    downloadNow: 'Download now', importLocal: 'Import local package',
    secHelp: 'Help & links', secHelpSub: 'Official pages new users should follow',
    lnkTunnels: 'OpenAI Platform · Tunnels (create a tunnel for its ID)',
    lnkApiKeys: 'OpenAI Platform · API keys (get a runtime key)',
    lnkGuide: 'Official docs · Secure tunnel guide',
    lnkConnectors: 'ChatGPT · Connector settings (final stop)',
    lnkRepo: 'tunnel-client official repo',
    secAbout: 'About MCPHelm',
    aboutP: 'MCPHelm is an open-source local tunnel manager that wraps the official OpenAI tunnel-client in a friendly UI: no commands to memorize, no flags to remember — a few clicks and your local MCP servers are securely connected to ChatGPT.',
    aboutRepo: 'Repository', aboutSafe: 'Your keys stay on your own machine. MCPHelm uploads nothing.',
    smAddTitle: 'Add MCP server', smEditTitle: 'Edit server',
    smSub: 'Register a local service you want to expose to ChatGPT',
    fName: 'Name', fNamePh: 'e.g. my-files or local-notes',
    fNameHint: 'Starts with a letter or digit; may contain . _ -  — the unique handle of this server',
    fKind: 'Type', fKindStdio: 'Command (stdio)', fKindHttp: 'HTTP service',
    kindHintStdio: 'MCPHelm launches this command for you — fits most MCP servers',
    kindHintHttp: 'The service already runs on your machine; MCPHelm only forwards',
    fCommand: 'Launch command', fCommandHint: 'MCPHelm spawns and manages this process through the tunnel',
    fUrl: 'Service URL', fUrlHint: 'An MCP HTTP endpoint already running locally',
    fHeaders: 'Extra headers (optional)', fHeadersPh: 'One per line, format Key: Value',
    fDesc: 'Note (optional)', fDescPh: 'One sentence about what this server does',
    testConn: 'Test connection', testRunning: 'Testing…', testOk: 'Reachable', testFail: 'Unreachable',
    add: 'Add',
    tmCreateTitle: 'Create tunnel', tmEditTitle: 'Edit tunnel', tmSub: 'Wire a local server into ChatGPT',
    fServerBind: 'Bound server', fTunnelId: 'Tunnel ID',
    fTunnelIdHint: 'Create a tunnel at {a} to get one — format tunnel_ + 32 chars', fTunnelIdA: 'OpenAI Platform · Tunnels',
    fKey: 'Key (runtime key)',
    keyModeEnv: 'Env variable', keyModeKeyring: 'Key vault (recommended)', keyModeInline: 'Paste directly',
    fKeyEnv: 'Env variable name', fKeyEnvHint: 'The key never touches disk; it is read from this variable at start',
    fKeyKeyringHint: 'The key goes only into Windows Credential Manager — nothing is written to any config file',
    fKeyInlinePh: 'Paste the runtime key from the OpenAI platform',
    fKeyInlineHint: 'Generate one at {a}', fKeyInlineA: 'OpenAI Platform · API keys', fKeyKeep: '; a key is already saved — leave empty to keep it',
    fHealthPort: 'Health check port (optional)',
    needServerTitle: 'Add a server first',
    needServerMsg: 'You need at least one MCP server before creating a tunnel. Add one now?',
    goAdd: 'Add now',
    rmTitle: 'Download runtime', rmSub: 'Download tunnel-client from the official OpenAI repo with integrity verification',
    rmInfo: 'tunnel-client is the official tunnel client from OpenAI. MCPHelm downloads it from the {a} and verifies its SHA-256 automatically.',
    rmInfoA: 'official repo', startDownload: 'Start download', unknownError: 'Unknown error',
    riTitle: 'Import local package', riSub: 'If you already downloaded the official zip yourself, import it directly',
    fZipPath: 'Zip file path', fZipVer: 'Version (optional)', fZipVerPh: 'Leave empty to auto-detect', doImport: 'Import',
    tplTitle: 'New server from template', tplSub: 'Pick a popular server, fill it in one click, then adjust the paths',
    tplUse: 'Use this template',
    imTitle: 'Import existing MCP config', imSub: 'Find servers already configured in Claude / Cursor / VS Code and bring them over',
    imTabScan: 'Scan this machine', imTabPaste: 'Paste config text',
    imScanning: 'Scanning…', imRescan: 'Rescan',
    imNoneFound: 'No MCP config from Claude Desktop / Cursor / VS Code was found. Try "Paste config text" instead.',
    imParseErr: 'Could not read this file: ',
    imPickFile: 'Import from file',
    imPasteHint: 'Paste the content of a Claude / Cursor / VS Code config (with the mcpServers section):',
    imPasteBtn: 'Parse pasted text',
    imPickAll: 'All', imPickNone: 'None',
    imOverwrite: 'Overwrite servers with the same name',
    imDoApply: 'Import {n} selected',
    imDone: 'Import finished: {a} added, {r} replaced, {s} skipped',
    imNothing: 'Select at least one server first',
    imServersN: '{n} server(s)',
  },
};

let currentLang = 'zh';
function t(key, params) {
  let s = (I18N[currentLang] && I18N[currentLang][key]) ?? I18N.zh[key] ?? key;
  if (params) for (const k of Object.keys(params)) s = s.split('{' + k + '}').join(String(params[k]));
  return s;
}

/* ---------------- 工具 ---------------- */
const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

async function api(path, opts) {
  const token = getToken();
  const joiner = path.includes('?') ? '&' : '?';
  const url = token ? path + joiner + 'token=' + encodeURIComponent(token) : path;
  const res = await fetch(url, opts ? {
    method: opts.method || 'POST',
    headers: { 'content-type': 'application/json' },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  } : undefined);
  let data = null;
  try { data = await res.json(); } catch (e) { /* ignore */ }
  if (!res.ok) {
    const msg = data && data.error ? data.error : ('请求失败 (' + res.status + ')');
    const err = new Error(msg);
    err.data = data;
    throw err;
  }
  return data;
}

function getToken() {
  const m = /[#&]token=([^&]+)/.exec(window.location.hash || '');
  return m ? decodeURIComponent(m[1]) : '';
}

function fmtUptime(ms) {
  if (!ms || ms < 0) return '\u2014';
  const s = Math.floor(ms / 1000);
  if (s < 60) return currentLang === 'en' ? s + 's' : s + ' 秒';
  const m = Math.floor(s / 60);
  if (m < 60) return currentLang === 'en' ? m + 'm' : m + ' 分钟';
  const h = Math.floor(m / 60);
  if (h < 24) return currentLang === 'en' ? h + 'h ' + (m % 60) + 'm' : h + ' 小时 ' + (m % 60) + ' 分';
  return currentLang === 'en' ? Math.floor(h / 24) + 'd ' + (h % 24) + 'h' : Math.floor(h / 24) + ' 天 ' + (h % 24) + ' 小时';
}

function fmtBytes(n) {
  if (!n || n <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i += 1; }
  return (v >= 100 || i === 0 ? Math.round(v) : v.toFixed(1)) + ' ' + units[i];
}

/* ---------------- 图标 ---------------- */
const ICONS = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
  tunnels: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17V9a8 8 0 0 1 16 0v8"/><path d="M2 17h20"/><path d="M12 9v8"/></svg>',
  servers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><circle cx="7.5" cy="7.5" r="1" fill="currentColor"/><circle cx="7.5" cy="16.5" r="1" fill="currentColor"/></svg>',
  logs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h5"/></svg>',
  doctor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-4.6-9.5-9A5.5 5.5 0 0 1 12 6.5 5.5 5.5 0 0 1 21.5 12C19 16.4 12 21 12 21z"/><path d="M7 12h3l1.5-3 2 5L15 12h2"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>',
  stop: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
  restart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6M14 11v6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
  warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
  key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="4.5"/><path d="M11 12L21 2M15 8l3 3M18 5l2 2"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14L21 3"/></svg>',
  folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
  zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  terminal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17l6-6-6-6M12 19h8"/></svg>',
  heartbeat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l2-7 4 14 2-7h6"/></svg>',
};
function icon(name) { return ICONS[name] || ICONS.info; }

/* ---------------- 状态 ---------------- */
const app = {
  state: null,
  view: 'dashboard',
  logTunnel: null,
  logAuto: true,
  pollTimer: null,
  logTimer: null,
  jobPolling: false,
  ui: { language: 'zh', minimizeToTray: false, autoLaunch: false },
  desktop: false,
  keyringSupported: false,
};

function viewMeta(v) {
  const map = {
    dashboard: ['metaDashboardT', 'metaDashboardS'],
    tunnels: ['metaTunnelsT', 'metaTunnelsS'],
    servers: ['metaServersT', 'metaServersS'],
    logs: ['metaLogsT', 'metaLogsS'],
    doctor: ['metaDoctorT', 'metaDoctorS'],
    settings: ['metaSettingsT', 'metaSettingsS'],
  };
  const keys = map[v] || map.dashboard;
  return { title: t(keys[0]), sub: t(keys[1]) };
}

/* ---------------- Toast ---------------- */
function toast(msg, kind) {
  const root = $('#toastRoot');
  const el = document.createElement('div');
  el.className = 'toast ' + (kind || 'info');
  const ic = kind === 'ok' ? 'check' : kind === 'err' ? 'x' : 'info';
  el.innerHTML = '<span class="ico">' + icon(ic) + '</span><span>' + esc(msg) + '</span>';
  root.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 3600);
}

/* ---------------- 模态框 ---------------- */
function openModal(opts) {
  const root = $('#modalRoot');
  root.innerHTML = '';
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const wide = opts.wide ? ' wide' : '';
  overlay.innerHTML =
    '<div class="modal' + wide + '">' +
      '<div class="modal-head">' +
        '<div><div class="modal-title">' + esc(opts.title) + '</div>' +
        (opts.sub ? '<div class="modal-sub">' + esc(opts.sub) + '</div>' : '') + '</div>' +
        '<button class="modal-close" data-close>' + icon('x') + '</button>' +
      '</div>' +
      '<div class="modal-body"></div>' +
      (opts.footer !== false ? '<div class="modal-foot"></div>' : '') +
    '</div>';
  root.appendChild(overlay);
  const body = $('.modal-body', overlay);
  if (typeof opts.body === 'string') body.innerHTML = opts.body; else if (opts.body) body.appendChild(opts.body);
  if (opts.footer !== false) {
    const foot = $('.modal-foot', overlay);
    (opts.actions || [{ label: t('close'), kind: 'ghost', close: true }]).forEach((a) => {
      const btn = document.createElement('button');
      btn.className = 'btn ' + (a.kind || 'ghost');
      btn.innerHTML = (a.icon ? '<span class="ico">' + icon(a.icon) + '</span>' : '') + esc(a.label);
      btn.addEventListener('click', async () => {
        if (a.onClick) {
          btn.classList.add('loading');
          btn.disabled = true;
          try { const keep = await a.onClick(body, btn); if (keep !== true) closeModal(); }
          catch (e) { toast(e.message || t('opFailed'), 'err'); }
          finally { btn.classList.remove('loading'); btn.disabled = false; }
        } else if (a.close !== false) closeModal();
      });
      foot.appendChild(btn);
    });
  }
  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay && opts.dismissable !== false) closeModal(); });
  $('[data-close]', overlay).addEventListener('click', () => closeModal());
  return { overlay, body };
}
function closeModal() { $('#modalRoot').innerHTML = ''; }

function confirmModal(title, message, confirmLabel, danger) {
  return new Promise((resolve) => {
    openModal({
      title,
      body: '<p style="font-size:13.5px;color:var(--text-2);line-height:1.7">' + message + '</p>',
      actions: [
        { label: t('cancel'), kind: 'ghost', onClick: () => { resolve(false); } },
        { label: confirmLabel || t('confirm'), kind: danger ? 'danger-soft' : 'primary', onClick: () => { resolve(true); } },
      ],
    });
  });
}

/* ---------------- 数据 ---------------- */
async function refreshState(silent) {
  try {
    app.state = await api('/api/state');
    syncPrefsFromState();
    renderShell();
    renderView();
    schedulePoll();
  } catch (e) {
    if (!silent) toast(t('offline') + e.message, 'err');
  }
}

function syncPrefsFromState() {
  const s = app.state;
  if (!s) return;
  const ui = s.ui || {};
  const lang = ui.language === 'en' ? 'en' : 'zh';
  const changed = lang !== currentLang;
  app.ui = { language: lang, minimizeToTray: ui.minimizeToTray === true, autoLaunch: ui.autoLaunch === true };
  app.keyringSupported = !!(s.security && s.security.keyringSupported);
  if (changed) {
    currentLang = lang;
    applyLanguage();
  }
}

/* 把静态骨架上的文案换成当前语言 */
function applyLanguage() {
  document.documentElement.lang = currentLang === 'en' ? 'en' : 'zh-CN';
  document.title = 'MCPHelm \u00b7 ' + t('tagline');
  const brandSub = $('#brandSub'); if (brandSub) brandSub.textContent = t('brandSub');
  const navLabels = { dashboard: 'navDashboard', tunnels: 'navTunnels', servers: 'navServers', logs: 'navLogs', doctor: 'navDoctor', settings: 'navSettings' };
  $$('#nav .nav-item').forEach((b) => {
    const lbl = $('.nav-label', b);
    if (lbl && navLabels[b.dataset.view]) lbl.textContent = t(navLabels[b.dataset.view]);
  });
  const rb = $('#btnRefresh');
  if (rb) rb.innerHTML = '<span class="ico">' + icon('refresh') + '</span>' + esc(t('refresh'));
  const meta = viewMeta(app.view);
  $('#pageTitle').textContent = meta.title;
  $('#pageSub').textContent = meta.sub;
}

function schedulePoll() {
  clearTimeout(app.pollTimer);
  const anyRunning = app.state && app.state.tunnels.some((t) => t.status.state === 'running');
  const jobRunning = app.state && app.state.runtimeJob && app.state.runtimeJob.running;
  app.pollTimer = setTimeout(() => refreshState(true), (anyRunning || jobRunning) ? 2500 : 8000);
}

/* ---------------- 外壳 ---------------- */
function renderShell() {
  const s = app.state;
  if (!s) return;
  $('#versionText').textContent = s.brand.name + ' v' + s.brand.version;
  // 环境状态
  const envDot = $('#envDot'), envText = $('#envText');
  const errCount = (s.configIssues || []).filter((i) => i.level === 'error').length;
  if (!s.runtime.found) { envDot.className = 'dot dot-warn'; envText.textContent = t('envMissing'); }
  else if (errCount > 0) { envDot.className = 'dot dot-err'; envText.textContent = t('envBadCfg', { n: errCount }); }
  else { envDot.className = 'dot dot-ok'; envText.textContent = t('envOk'); }
  // 导航角标
  const nbT = $('#navBadgeTunnels'), nbS = $('#navBadgeServers'), nbD = $('#navBadgeDoctor');
  nbT.textContent = s.counts.running + '/' + s.counts.tunnels;
  nbT.classList.toggle('hidden', s.counts.tunnels === 0);
  nbS.textContent = s.counts.servers;
  nbS.classList.toggle('hidden', s.counts.servers === 0);
  const warnCount = (s.configIssues || []).length;
  nbD.textContent = warnCount;
  nbD.classList.toggle('hidden', warnCount === 0);
  // 顶栏主按钮
  const quick = $('#btnQuickAction');
  if (!s.runtime.found) {
    quick.innerHTML = '<span class="ico">' + icon('download') + '</span>' + esc(t('downloadRuntime'));
    quick.onclick = () => showRuntimeModal();
  } else {
    quick.innerHTML = '<span class="ico">' + icon('plus') + '</span>' + esc(t('newTunnel'));
    quick.onclick = () => showTunnelModal(null);
  }
}

function setView(v) {
  app.view = v;
  $$('#nav .nav-item').forEach((b) => b.classList.toggle('active', b.dataset.view === v));
  const meta = viewMeta(v);
  $('#pageTitle').textContent = meta.title;
  $('#pageSub').textContent = meta.sub;
  clearInterval(app.logTimer);
  renderView();
}

function renderView() {
  const s = app.state;
  if (!s) return;
  const c = $('#content');
  if (app.view === 'dashboard') renderDashboard(c, s);
  else if (app.view === 'tunnels') renderTunnels(c, s);
  else if (app.view === 'servers') renderServers(c, s);
  else if (app.view === 'logs') renderLogs(c, s);
  else if (app.view === 'doctor') renderDoctor(c, s);
  else if (app.view === 'settings') renderSettings(c, s);
}


/* ---------------- 概览 ---------------- */
function needsSetup(s) {
  return !s.runtime.found || s.counts.servers === 0 || s.counts.tunnels === 0;
}

function setupSteps(s) {
  return [
    {
      key: 'runtime',
      name: t('stepRuntime'),
      desc: s.runtime.found
        ? t('stepRuntimeDone') + (s.runtime.version ? t('stepRuntimeDoneV', { v: s.runtime.version }) : '')
        : t('stepRuntimeTodo'),
      done: !!s.runtime.found,
      action: s.runtime.found
        ? { label: t('redownload'), kind: 'ghost', fn: () => showRuntimeModal() }
        : { label: t('oneClickDownload'), kind: 'primary', icon: 'download', fn: () => showRuntimeModal() },
    },
    {
      key: 'server',
      name: t('stepServer'),
      desc: s.counts.servers > 0
        ? t('stepServerDone', { n: s.counts.servers })
        : t('stepServerTodo'),
      done: s.counts.servers > 0,
      action: { label: s.counts.servers > 0 ? t('addAnother') : t('addServer'), kind: s.counts.servers > 0 ? 'ghost' : 'primary', icon: s.counts.servers > 0 ? undefined : 'plus', fn: () => showServerModal(null) },
    },
    {
      key: 'tunnel',
      name: t('stepTunnel'),
      desc: s.counts.tunnels > 0
        ? t('stepTunnelDone', { n: s.counts.tunnels })
        : t('stepTunnelTodo'),
      done: s.counts.tunnels > 0,
      action: { label: s.counts.tunnels > 0 ? t('manageTunnels') : t('createTunnel'), kind: s.counts.tunnels > 0 ? 'soft' : 'primary', icon: s.counts.tunnels > 0 ? undefined : 'plus', fn: () => (s.counts.tunnels > 0 ? setView('tunnels') : showTunnelModal(null)) },
    },
  ];
}

function renderDashboard(c, s) {
  const errCount = (s.configIssues || []).filter((i) => i.level === 'error').length;
  const warnCount = (s.configIssues || []).filter((i) => i.level === 'warn').length;
  const healthy = s.tunnels.filter((t) => t.health && t.health.ok).length;
  const attention = errCount + warnCount + s.tunnels.filter((t) => t.status.state === 'error' || t.status.state === 'stale').length;

  let html = '<div class="stat-row">';
  html += statCard('tunnels', 'tint-blue', s.counts.tunnels, t('statTunnels'));
  html += statCard('zap', 'tint-green', s.counts.running, t('statRunning'));
  html += statCard('heartbeat', 'tint-violet', healthy, t('statHealthy'));
  html += statCard('warn', 'tint-amber', attention, t('statAttention'));
  html += '</div>';

  if (needsSetup(s)) {
    const steps = setupSteps(s);
    const done = steps.filter((x) => x.done).length;
    const pct = Math.round((done / steps.length) * 100);
    html += '<div class="hero">' +
      '<h2>' + esc(t('heroTitle')) + '</h2>' +
      '<p>' + esc(t('heroP')) + '</p>' +
      '<div class="hero-progress"><div class="hero-progress-bar"><div class="hero-progress-fill" style="width:' + pct + '%"></div></div><span class="hero-progress-text">' + esc(t('heroProgress', { d: done, t: steps.length })) + '</span></div>' +
      '</div>';
    html += '<div class="step-list">';
    const currentIdx = steps.findIndex((x) => !x.done);
    steps.forEach((st, i) => {
      const cls = st.done ? 'done' : (i === currentIdx ? 'current' : '');
      html += '<div class="step-item ' + cls + '">' +
        '<div class="step-num">' + (st.done ? icon('check') : (i + 1)) + '</div>' +
        '<div class="step-info"><div class="step-name">' + esc(st.name) + (st.done ? ' <span class="pill ok">' + esc(currentLang === 'en' ? 'Done' : '已完成') + '</span>' : '') + '</div>' +
        '<div class="step-desc">' + esc(st.desc) + '</div></div>' +
        '<div class="step-actions"><button class="btn ' + st.action.kind + '" data-step="' + st.key + '">' + (st.action.icon ? '<span class="ico">' + icon(st.action.icon) + '</span>' : '') + esc(st.action.label) + '</button></div>' +
      '</div>';
    });
    html += '</div>';
    html += whereGuideCard(s);
    c.innerHTML = html;
    steps.forEach((st) => {
      const btn = $('[data-step="' + st.key + '"]', c);
      if (btn) btn.addEventListener('click', st.action.fn);
    });
    return;
  }

  // 已完成初始化：显示隧道卡片 + 问题提示
  if (attention > 0) {
    html += '<div class="notice warn"><span class="ico">' + icon('warn') + '</span><div>' + t('attentionLine', { n: attention }) + '</div></div>';
  }
  html += '<div class="section-title"><span class="ico">' + icon('tunnels') + '</span>' + esc(t('dashTunnels')) + '</div>';
  html += '<div class="section-sub">' + esc(t('dashTunnelsSub')) + '</div>';
  html += '<div class="entity-grid">';
  s.tunnels.forEach((t) => { html += tunnelCard(t); });
  html += '</div>';
  c.innerHTML = html;
  bindTunnelCards(c, s);
  $$('[data-goto]', c).forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); setView(a.dataset.goto); }));
}

/* 新手引导卡：隧道 ID 和密钥到底去哪拿 */
function whereGuideCard(s) {
  const d = s.docs || {};
  const link = (url, key) => '<a href="' + esc(url || '#') + '" target="_blank" rel="noopener">' + esc(t(key)) + '</a>';
  return '<div class="guide-card">' +
    '<div class="guide-head"><span class="ico">' + icon('info') + '</span><strong>' + esc(t('whereTitle')) + '</strong></div>' +
    '<ol class="guide-steps">' +
      '<li>' + t('whereP1', { a: link(d.platformTunnels, 'whereP1a') }) + '</li>' +
      '<li>' + t('whereP2', { a: link(d.platformApiKeys, 'whereP2a') }) + '</li>' +
      '<li>' + t('whereP3', { a: link(d.chatgptConnectors, 'whereP3a') }) + '</li>' +
    '</ol>' +
  '</div>';
}

function statCard(ic, tint, num, label) {
  return '<div class="stat-card"><div class="stat-ico ' + tint + '">' + icon(ic) + '</div>' +
    '<div><div class="stat-num">' + num + '</div><div class="stat-label">' + esc(label) + '</div></div></div>';
}

/* ---------------- 隧道卡片 ---------------- */
function statePill(tn) {
  const st = tn.status.state;
  if (st === 'running') {
    if (tn.health && tn.health.ok) return '<span class="pill ok"><span class="dot dot-ok"></span>' + esc(t('stRunningOk')) + '</span>';
    if (tn.health) return '<span class="pill warn"><span class="dot dot-warn"></span>' + esc(t('stHealthBad')) + '</span>';
    return '<span class="pill ok"><span class="dot dot-ok"></span>' + esc(t('stRunning')) + '</span>';
  }
  if (st === 'error') return '<span class="pill err"><span class="dot dot-err"></span>' + esc(t('stError')) + '</span>';
  if (st === 'stale') return '<span class="pill warn"><span class="dot dot-warn"></span>' + esc(t('stStale')) + '</span>';
  return '<span class="pill muted"><span class="dot dot-muted"></span>' + esc(t('stStopped')) + '</span>';
}

function tunnelCard(tn) {
  let html = '<div class="entity-card" data-tunnel="' + esc(tn.name) + '">';
  html += '<div class="entity-top">' +
    '<div class="entity-ico">' + icon('tunnels') + '</div>' +
    '<div class="entity-names"><div class="entity-name">' + esc(tn.name) + '</div>' +
    '<div class="entity-target" title="' + esc(tn.target) + '">' + esc(tn.target || '—') + '</div></div>' +
    statePill(tn) +
  '</div>';
  html += '<div class="entity-meta">';
  html += '<span class="m"><span class="ico">' + icon('servers') + '</span>' + esc(tn.server) + '</span>';
  html += '<span class="m"><span class="ico">' + icon('link') + '</span><span class="mono">' + esc(tn.tunnelIdMasked || '—') + '</span></span>';
  if (tn.status.state === 'running') html += '<span class="m"><span class="ico">' + icon('clock') + '</span>' + fmtUptime(tn.status.uptimeMs) + '</span>';
  const keyM = tn.key.ready
    ? '<span class="m" title="' + esc(t('keyFrom') + (tn.key.source || '')) + '"><span class="ico">' + icon('key') + '</span>' + esc(t('keyReady')) + '</span>'
    : '<span class="m" style="color:var(--amber)"><span class="ico">' + icon('key') + '</span>' + esc(t('keyMissing')) + '</span>';
  html += keyM;
  html += '</div>';
  if (tn.lastError) {
    html += '<div style="padding:8px 18px;font-size:12px;color:var(--red);background:var(--red-soft);border-top:1px solid var(--border)">' + esc(tn.lastError) + '</div>';
  }
  html += '<div class="entity-foot">';
  if (tn.status.state === 'running') {
    html += '<button class="btn small danger-soft" data-act="stop"><span class="ico">' + icon('stop') + '</span>' + esc(t('stop')) + '</button>';
    html += '<button class="btn small ghost" data-act="restart"><span class="ico">' + icon('restart') + '</span>' + esc(t('restart')) + '</button>';
  } else {
    html += '<button class="btn small success-soft" data-act="start"><span class="ico">' + icon('play') + '</span>' + esc(t('start')) + '</button>';
  }
  html += '<span class="spacer"></span>';
  html += '<button class="btn small ghost" data-act="logs"><span class="ico">' + icon('logs') + '</span>' + esc(t('logs')) + '</button>';
  html += '<button class="btn small ghost" data-act="edit"><span class="ico">' + icon('edit') + '</span></button>';
  html += '<button class="btn small ghost" data-act="remove"><span class="ico">' + icon('trash') + '</span></button>';
  html += '</div></div>';
  return html;
}

function bindTunnelCards(c, s) {
  $$('[data-tunnel]', c).forEach((card) => {
    const name = card.dataset.tunnel;
    const tn = s.tunnels.find((x) => x.name === name);
    if (!tn) return;
    $$('[data-act]', card).forEach((btn) => {
      btn.addEventListener('click', () => tunnelAction(tn, btn.dataset.act, btn));
    });
  });
}

async function tunnelAction(tn, act, btn) {
  if (act === 'logs') { app.logTunnel = tn.name; setView('logs'); return; }
  if (act === 'edit') { showTunnelModal(tn.name); return; }
  if (act === 'remove') {
    const okGo = await confirmModal(t('deleteTunnel'), t('deleteTunnelMsg', { n: esc(tn.name) }), t('delete'), true);
    if (!okGo) return;
    try { await api('/api/tunnels/' + encodeURIComponent(tn.name) + '/remove'); toast(t('tunnelDeleted', { n: tn.name }), 'ok'); refreshState(true); }
    catch (e) { toast(e.message, 'err'); }
    return;
  }
  // start / stop / restart
  btn.disabled = true; btn.classList.add('loading');
  try {
    await api('/api/tunnels/' + encodeURIComponent(tn.name) + '/' + act);
    toast(t(act === 'start' ? 'tunnelStarted' : act === 'stop' ? 'tunnelStopped' : 'tunnelRestarted', { n: tn.name }), 'ok');
  } catch (e) { toast(e.message, 'err'); }
  finally { btn.disabled = false; btn.classList.remove('loading'); }
  setTimeout(() => refreshState(true), 600);
}

/* ---------------- 隧道列表页 ---------------- */
function renderTunnels(c, s) {
  let html = '';
  if (s.tunnels.length === 0) {
    html = '<div class="empty"><div class="empty-ico">' + icon('tunnels') + '</div>' +
      '<h3>' + esc(t('tunnelEmptyH')) + '</h3><p>' + esc(t('tunnelEmptyP')) + '</p>' +
      '<button class="btn primary" id="emptyNewTunnel"><span class="ico">' + icon('plus') + '</span>' + esc(t('createFirstTunnel')) + '</button></div>';
    c.innerHTML = html;
    $('#emptyNewTunnel', c).addEventListener('click', () => showTunnelModal(null));
    return;
  }
  html += '<div style="display:flex;justify-content:flex-end;margin-bottom:14px"><button class="btn primary" id="newTunnelBtn"><span class="ico">' + icon('plus') + '</span>' + esc(t('newTunnel')) + '</button></div>';
  html += '<div class="entity-grid">';
  s.tunnels.forEach((t) => { html += tunnelCard(t); });
  html += '</div>';
  c.innerHTML = html;
  $('#newTunnelBtn', c).addEventListener('click', () => showTunnelModal(null));
  bindTunnelCards(c, s);
}

/* ---------------- 服务器页 ---------------- */
function serverCard(sv) {
  let html = '<div class="entity-card" data-server="' + esc(sv.name) + '">';
  html += '<div class="entity-top">' +
    '<div class="entity-ico kind-' + esc(sv.kind) + '">' + icon(sv.kind === 'http' ? 'globe' : 'terminal') + '</div>' +
    '<div class="entity-names"><div class="entity-name">' + esc(sv.name) + '</div>' +
    '<div class="entity-target" title="' + esc(sv.target) + '">' + esc(sv.target || '—') + '</div></div>' +
    '<span class="pill blue">' + (sv.kind === 'http' ? esc(t('kindHttp')) : esc(t('kindStdio'))) + '</span>' +
  '</div>';
  html += '<div class="entity-meta">';
  if (sv.description) html += '<span class="m">' + esc(sv.description) + '</span>';
  html += sv.usedBy.length > 0
    ? '<span class="m"><span class="ico">' + icon('tunnels') + '</span>' + esc(t('usedByN', { n: sv.usedBy.length })) + '</span>'
    : '<span class="m" style="color:var(--text-3)"><span class="ico">' + icon('info') + '</span>' + esc(t('usedByNone')) + '</span>';
  html += '</div>';
  html += '<div class="entity-foot"><span class="spacer"></span>' +
    '<button class="btn small ghost" data-act="edit"><span class="ico">' + icon('edit') + '</span>' + esc(t('edit')) + '</button>' +
    '<button class="btn small danger-soft" data-act="remove"><span class="ico">' + icon('trash') + '</span>' + esc(t('delete')) + '</button>' +
  '</div></div>';
  return html;
}

function serverToolbar() {
  return '<div style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:14px;flex-wrap:wrap">' +
    '<button class="btn ghost" id="tplBtn"><span class="ico">' + icon('zap') + '</span>' + esc(t('fromTemplate')) + '</button>' +
    '<button class="btn ghost" id="importBtn"><span class="ico">' + icon('download') + '</span>' + esc(t('importConfig')) + '</button>' +
    '<button class="btn primary" id="newServerBtn"><span class="ico">' + icon('plus') + '</span>' + esc(t('addServer')) + '</button>' +
  '</div>';
}

function bindServerToolbar(c) {
  const nb = $('#newServerBtn', c); if (nb) nb.addEventListener('click', () => showServerModal(null));
  const tb = $('#tplBtn', c); if (tb) tb.addEventListener('click', () => showTemplateModal());
  const ib = $('#importBtn', c); if (ib) ib.addEventListener('click', () => showImportModal());
}

function renderServers(c, s) {
  let html = '';
  if (s.servers.length === 0) {
    c.innerHTML = serverToolbar() +
      '<div class="empty"><div class="empty-ico">' + icon('servers') + '</div>' +
      '<h3>' + esc(t('serverEmptyH')) + '</h3><p>' + esc(t('serverEmptyP')) + '</p></div>';
    bindServerToolbar(c);
    return;
  }
  html += serverToolbar();
  html += '<div class="entity-grid">';
  s.servers.forEach((sv) => { html += serverCard(sv); });
  html += '</div>';
  c.innerHTML = html;
  bindServerToolbar(c);
  $$('[data-server]', c).forEach((card) => {
    const name = card.dataset.server;
    const sv = s.servers.find((x) => x.name === name);
    if (!sv) return;
    $('[data-act="edit"]', card).addEventListener('click', () => showServerModal(name));
    $('[data-act="remove"]', card).addEventListener('click', async () => {
      const warn = sv.usedBy.length > 0 ? t('deleteServerWarn', { l: esc(sv.usedBy.join('、')) }) : '';
      const okGo = await confirmModal(t('deleteServer'), t('deleteServerMsg', { n: esc(name) }) + warn, t('delete'), true);
      if (!okGo) return;
      try { await api('/api/servers/' + encodeURIComponent(name) + '/remove'); toast(t('serverDeleted', { n: name }), 'ok'); refreshState(true); }
      catch (e) { toast(e.message, 'err'); }
    });
  });
}


/* ---------------- 日志页 ---------------- */
async function renderLogs(c, s) {
  if (s.tunnels.length === 0) {
    c.innerHTML = '<div class="empty"><div class="empty-ico">' + icon('logs') + '</div>' +
      '<h3>' + esc(t('logEmptyH')) + '</h3><p>' + esc(t('logEmptyP')) + '</p>' +
      '<button class="btn primary" id="emptyGoTunnel"><span class="ico">' + icon('plus') + '</span>' + esc(t('goCreateTunnel')) + '</button></div>';
    $('#emptyGoTunnel', c).addEventListener('click', () => showTunnelModal(null));
    return;
  }
  if (!app.logTunnel || !s.tunnels.find((t) => t.name === app.logTunnel)) app.logTunnel = s.tunnels[0].name;
  let html = '<div class="card"><div class="card-head">' +
    '<div><div class="card-title"><span class="ico">' + icon('logs') + '</span>' + esc(t('logTitle')) + '</div><div class="card-sub">' + esc(t('logSub')) + '</div></div>' +
    '<div class="log-toolbar">' +
      '<select class="select" id="logTunnelSel">' +
      s.tunnels.map((t) => '<option value="' + esc(t.name) + '"' + (t.name === app.logTunnel ? ' selected' : '') + '>' + esc(t.name) + '</option>').join('') +
      '</select>' +
      '<label style="display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--text-2);cursor:pointer"><input type="checkbox" id="logAutoChk"' + (app.logAuto ? ' checked' : '') + '> ' + esc(t('logAuto')) + '</label>' +
      '<button class="btn ghost small" id="logRefreshBtn"><span class="ico">' + icon('refresh') + '</span>' + esc(t('refresh')) + '</button>' +
      '<button class="btn ghost small" id="logOpenDir"><span class="ico">' + icon('folder') + '</span>' + esc(t('openDir')) + '</button>' +
    '</div></div>' +
    '<div class="card-body"><div class="log-viewer" id="logViewer"><span class="log-empty">' + esc(t('logLoading')) + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;margin-top:10px;font-size:12px;color:var(--text-3)"><span id="logFilePath"></span><span id="logTrunc"></span></div></div></div>';
  c.innerHTML = html;
  $('#logTunnelSel', c).addEventListener('change', (e) => { app.logTunnel = e.target.value; loadLog(true); });
  $('#logAutoChk', c).addEventListener('change', (e) => { app.logAuto = e.target.checked; scheduleLogPoll(); });
  $('#logRefreshBtn', c).addEventListener('click', () => loadLog(false));
  $('#logOpenDir', c).addEventListener('click', async () => {
    try { await api('/api/open', { body: { target: 'logs' } }); } catch (e) { toast(e.message, 'err'); }
  });
  loadLog(true);
  scheduleLogPoll();
}

function scheduleLogPoll() {
  clearInterval(app.logTimer);
  if (app.view === 'logs' && app.logAuto) app.logTimer = setInterval(() => loadLog(true), 2500);
}

async function loadLog(silent) {
  const viewer = $('#logViewer');
  if (!viewer || !app.logTunnel) return;
  try {
    const data = await api('/api/logs/' + encodeURIComponent(app.logTunnel) + '?lines=400');
    const atBottom = viewer.scrollHeight - viewer.scrollTop - viewer.clientHeight < 40;
    if (data.lines && data.lines.length > 0) {
      viewer.textContent = data.lines.join('\n');
    } else {
      viewer.innerHTML = '<span class="log-empty">' + esc(t('logNone')) + '</span>';
    }
    if (silent && atBottom) viewer.scrollTop = viewer.scrollHeight;
    if (!silent) viewer.scrollTop = viewer.scrollHeight;
    const fp = $('#logFilePath'); if (fp) fp.textContent = data.logFile || '';
    const tr = $('#logTrunc'); if (tr) tr.textContent = data.truncated ? t('logTruncated') : '';
  } catch (e) {
    if (!silent) toast(e.message, 'err');
  }
}

/* ---------------- 体检页 ---------------- */
function renderDoctor(c, s) {
  const issues = s.configIssues || [];
  let html = '<div class="card" style="margin-bottom:16px"><div class="card-head">' +
    '<div><div class="card-title"><span class="ico">' + icon('doctor') + '</span>' + esc(t('doctorTitle')) + '</div><div class="card-sub">' + esc(t('doctorSub')) + '</div></div>' +
    '<div style="display:flex;gap:8px">' +
      '<button class="btn ghost small" id="doctorRun"><span class="ico">' + icon('refresh') + '</span>' + esc(t('doctorRun')) + '</button>' +
      '<button class="btn soft small" id="doctorRunOnline"><span class="ico">' + icon('globe') + '</span>' + esc(t('doctorRunOnline')) + '</button>' +
    '</div></div>' +
    '<div class="card-body" id="doctorBody"><div style="color:var(--text-3);font-size:13px">' + esc(t('doctorIdle')) + '</div></div></div>';
  if (issues.length > 0) {
    html += '<div class="card"><div class="card-head"><div><div class="card-title"><span class="ico">' + icon('warn') + '</span>' + esc(t('cfgProblems')) + ' (' + issues.length + ')</div><div class="card-sub">' + esc(t('cfgProblemsSub')) + '</div></div></div><div class="card-body"><div class="check-list">';
    issues.forEach((i) => {
      html += '<div class="check-item ' + (i.level === 'error' ? 'err' : 'warn') + '"><span class="ico">' + icon(i.level === 'error' ? 'x' : 'warn') + '</span><div><div class="check-name">' + esc(i.level === 'error' ? t('lvlError') : t('lvlWarn')) + '</div><div class="check-detail">' + esc(i.message) + '</div></div></div>';
    });
    html += '</div></div></div>';
  }
  c.innerHTML = html;
  $('#doctorRun', c).addEventListener('click', () => runDoctorChecks(false));
  $('#doctorRunOnline', c).addEventListener('click', () => runDoctorChecks(true));
  runDoctorChecks(false);
}

async function runDoctorChecks(online) {
  const body = $('#doctorBody');
  if (!body) return;
  body.innerHTML = '<div style="color:var(--text-3);font-size:13px;display:flex;align-items:center;gap:8px"><span class="ico" style="animation:indet 1.2s infinite">' + icon('refresh') + '</span>' + esc(t('doctorChecking')) + (online ? esc(t('doctorOnlineNote')) : '') + '…</div>';
  try {
    const data = await api('/api/doctor' + (online ? '?online=1' : ''));
    const checks = data.checks || [];
    if (checks.length === 0) { body.innerHTML = '<div class="check-item ok"><span class="ico">' + icon('check') + '</span><div><div class="check-name">' + esc(t('doctorAllOk')) + '</div><div class="check-detail">' + esc(t('doctorAllOkSub')) + '</div></div></div>'; return; }
    let html = '<div class="check-list">';
    checks.forEach((ck) => {
      const raw = String(ck.level || '').toLowerCase();
      const lvl = (raw === 'fail' || raw === 'error') ? 'err' : (raw === 'warn' ? 'warn' : (raw === 'info' ? 'info' : 'ok'));
      html += '<div class="check-item ' + lvl + '"><span class="ico">' + icon(lvl === 'err' ? 'x' : lvl === 'warn' ? 'warn' : lvl === 'info' ? 'info' : 'check') + '</span>' +
        '<div><div class="check-name">' + esc(ck.title || ck.name || ck.id || t('checkItem')) + '</div>' +
        '<div class="check-detail">' + esc(ck.detail || ck.message || '') + '</div>' +
        (ck.hint ? '<div class="check-detail" style="color:var(--primary)">' + esc(t('doctorHint')) + esc(ck.hint) + '</div>' : '') +
      '</div></div>';
    });
    html += '</div>';
    body.innerHTML = html;
  } catch (e) {
    body.innerHTML = '<div class="notice err"><span class="ico">' + icon('x') + '</span><div>' + esc(t('doctorFailed')) + esc(e.message) + '</div></div>';
  }
}

/* ---------------- 设置页 ---------------- */
function renderSettings(c, s) {
  const d = s.docs || {};
  let html = '<div class="settings-grid">';

  // 界面与偏好
  html += '<div class="card"><div class="card-head"><div><div class="card-title"><span class="ico">' + icon('settings') + '</span>' + esc(t('secPrefs')) + '</div><div class="card-sub">' + esc(t('secPrefsSub')) + '</div></div></div><div class="card-body" style="padding-top:8px">';
  html += '<div class="kv"><div class="kv-k">' + esc(t('languageLabel')) + '</div>' +
    '<select class="select" id="prefLang" style="max-width:220px">' +
    '<option value="zh"' + (app.ui.language !== 'en' ? ' selected' : '') + '>中文</option>' +
    '<option value="en"' + (app.ui.language === 'en' ? ' selected' : '') + '>English</option>' +
    '</select></div>';
  html += '<label style="display:flex;align-items:flex-start;gap:8px;margin-top:12px;font-size:13px;color:var(--text-2);cursor:pointer"><input type="checkbox" id="prefTray"' + (app.ui.minimizeToTray ? ' checked' : '') + ' style="margin-top:2px"> <span>' + esc(t('prefTray')) + '</span></label>';
  html += '<label style="display:flex;align-items:flex-start;gap:8px;margin-top:8px;font-size:13px;color:var(--text-2);cursor:pointer"><input type="checkbox" id="prefAuto"' + (app.ui.autoLaunch ? ' checked' : '') + ' style="margin-top:2px"> <span>' + esc(t('prefAutoLaunch')) + '</span></label>';
  html += '<div style="margin-top:14px"><button class="btn primary small" id="prefSave"><span class="ico">' + icon('check') + '</span>' + esc(t('savePrefs')) + '</button></div>';
  html += '</div></div>';

  // 数据位置（C 盘零占用说明 + 图形化迁移）
  {
    const dl = s.dataLocation || null;
    const sizes = (dl && dl.sizes) || {};
    html += '<div class="card"><div class="card-head"><div><div class="card-title"><span class="ico">' + icon('folder') + '</span>' + esc(t('secData')) + '</div><div class="card-sub">' + esc(t('secDataSub')) + '</div></div></div><div class="card-body" style="padding-top:8px">';
    if (dl) {
      html += kv(t('dlRoot'), dl.dataRoot, true);
      html += kv(t('dlRuntime'), fmtBytes(sizes.bin || 0));
      html += kv(t('dlLogs'), fmtBytes(sizes.logs || 0));
      html += kv(t('dlCache'), fmtBytes(sizes.cache || 0));
      html += kv(t('dlDesktop'), fmtBytes(sizes.desktop || 0));
      html += '<div class="notice ok" style="margin-top:12px"><span class="ico">' + icon('check') + '</span><div>' + esc(t('dlHint')) + '</div></div>';
      if (dl.fallback) {
        html += '<div class="notice warn" style="margin-top:8px"><span class="ico">' + icon('warn') + '</span><div>' + esc(t('dlFallbackWarn')) + '</div></div>';
      }
      html += '<div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">' +
        '<button class="btn ghost small" data-open="home"><span class="ico">' + icon('folder') + '</span>' + esc(t('dlOpen')) + '</button>' +
        (dl.canMigrate ? '<button class="btn primary small" id="dlMigrateBtn"><span class="ico">' + icon('arrow') + '</span>' + esc(t('dlMigrate')) + '</button>' : '') +
      '</div>';
    } else {
      html += kv(t('dlRoot'), s.home, true);
      html += '<div class="notice info" style="margin-top:12px"><span class="ico">' + icon('info') + '</span><div>' + esc(t('dlNoMigrate')) + '</div></div>';
      html += '<div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">' +
        '<button class="btn ghost small" data-open="home"><span class="ico">' + icon('folder') + '</span>' + esc(t('dlOpen')) + '</button>' +
      '</div>';
    }
    html += '</div></div>';
  }

  // 本地环境
  html += '<div class="card"><div class="card-head"><div><div class="card-title"><span class="ico">' + icon('folder') + '</span>' + esc(t('secLocal')) + '</div><div class="card-sub">' + esc(t('secLocalSub')) + '</div></div></div><div class="card-body" style="padding-top:8px">';
  html += kv(t('kvVersion'), s.brand.name + ' v' + s.brand.version);
  html += kv(t('kvHome'), s.home, true);
  html += kv(t('kvConfig'), s.configPath, true);
  html += kv(t('kvLogs'), s.logsDir, true);
  html += kv(t('kvScope'), s.configScope || '—');
  html += '<div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">' +
    '<button class="btn ghost small" data-open="home"><span class="ico">' + icon('folder') + '</span>' + esc(t('openHome')) + '</button>' +
    '<button class="btn ghost small" data-open="logs"><span class="ico">' + icon('folder') + '</span>' + esc(t('openLogs')) + '</button>' +
    '<button class="btn ghost small" id="backupBtn"><span class="ico">' + icon('download') + '</span>' + esc(t('backupConfig')) + '</button>' +
  '</div>';
  html += '</div></div>';

  // 运行环境
  html += '<div class="card"><div class="card-head"><div><div class="card-title"><span class="ico">' + icon('download') + '</span>' + esc(t('secRuntime')) + '</div><div class="card-sub">' + esc(t('secRuntimeSub')) + '</div></div></div><div class="card-body" style="padding-top:8px">';
  if (s.runtime.found) {
    html += kv(t('rtStatus'), t('rtReady'), false, 'ok');
    html += kv(t('rtVersion'), s.runtime.version || t('rtUnknown'));
    html += kv(t('rtSource'), s.runtime.source || '—');
    html += kv(t('rtPath'), s.runtime.path || '—', true);
  } else {
    html += '<div class="notice warn" style="margin-bottom:12px"><span class="ico">' + icon('warn') + '</span><div>' + t('rtMissing') + '</div></div>';
  }
  html += '<div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap">' +
    '<button class="btn primary small" id="runtimeBtn"><span class="ico">' + icon('download') + '</span>' + esc(s.runtime.found ? t('redownload') : t('downloadNow')) + '</button>' +
    '<button class="btn ghost small" id="runtimeImportBtn"><span class="ico">' + icon('folder') + '</span>' + esc(t('importLocal')) + '</button>' +
  '</div>';
  html += '</div></div>';

  // 帮助与入口
  html += '<div class="card"><div class="card-head"><div><div class="card-title"><span class="ico">' + icon('link') + '</span>' + esc(t('secHelp')) + '</div><div class="card-sub">' + esc(t('secHelpSub')) + '</div></div></div><div class="card-body" style="padding-top:8px"><div class="link-row">';
  const links = [
    ['platformTunnels', t('lnkTunnels')],
    ['platformApiKeys', t('lnkApiKeys')],
    ['secureTunnelGuide', t('lnkGuide')],
    ['chatgptConnectors', t('lnkConnectors')],
    ['tunnelClientRepo', t('lnkRepo')],
  ];
  links.forEach(([k, label]) => {
    if (d[k]) html += '<a class="link-item" href="' + esc(d[k]) + '" target="_blank" rel="noopener"><span class="ico">' + icon('ext') + '</span>' + esc(label) + '<span class="arrow">' + icon('arrow') + '</span></a>';
  });
  html += '</div></div></div>';

  // 关于
  html += '<div class="card"><div class="card-head"><div><div class="card-title"><span class="ico">' + icon('info') + '</span>' + esc(t('secAbout')) + '</div></div></div><div class="card-body" style="padding-top:8px">';
  html += '<p style="font-size:13px;color:var(--text-2);line-height:1.8">' + esc(t('aboutP')) + '</p>';
  html += kv(t('aboutRepo'), s.brand.repoUrl || '', true);
  html += '<div class="notice info" style="margin-top:12px"><span class="ico">' + icon('info') + '</span><div>' + esc(t('aboutSafe')) + '</div></div>';
  html += '</div></div>';

  html += '</div>';
  c.innerHTML = html;

  $$('[data-open]', c).forEach((b) => b.addEventListener('click', async () => {
    try { await api('/api/open', { body: { target: b.dataset.open } }); } catch (e) { toast(e.message, 'err'); }
  }));
  const rb = $('#runtimeBtn', c); if (rb) rb.addEventListener('click', () => showRuntimeModal());
  const rib = $('#runtimeImportBtn', c); if (rib) rib.addEventListener('click', () => showImportRuntimeModal());
  const bb = $('#backupBtn', c); if (bb) bb.addEventListener('click', () => {
    const token = getToken();
    window.open('/api/config/export' + (token ? '?token=' + encodeURIComponent(token) : ''), '_blank');
  });
  const dmb = $('#dlMigrateBtn', c); if (dmb) dmb.addEventListener('click', async () => {
    try {
      dmb.disabled = true;
      dmb.textContent = t('dlMigrating');
      const picked = await api('/api/data-location/choose', { body: {} });
      if (!picked || !picked.path) { refreshState(true); return; }
      const result = await api('/api/data-location/migrate', { body: { target: picked.path } });
      openModal({
        title: t('dlRestart'),
        body: '<div class="notice ok"><span class="ico">' + icon('check') + '</span><div>' + esc(result.message || t('dlRestartHint')) + '</div></div>' +
          '<div class="notice warn" style="margin-top:10px"><span class="ico">' + icon('warn') + '</span><div>' + esc(t('dlSameWarn')) + '</div></div>' +
          '<div class="kv" style="margin-top:10px"><div class="kv-k">' + esc(t('dlRoot')) + '</div><div class="kv-v mono">' + esc(result.newRoot || '') + '</div></div>',
        actions: [{ label: t('confirm'), kind: 'primary' }],
      });
    } catch (e) { toast(e.message, 'err'); refreshState(true); }
  });
  const ps = $('#prefSave', c); if (ps) ps.addEventListener('click', async () => {
    try {
      await api('/api/ui', { body: {
        language: $('#prefLang', c).value,
        minimizeToTray: $('#prefTray', c).checked,
        autoLaunch: $('#prefAuto', c).checked,
      } });
      toast(t('prefsSaved'), 'ok');
      refreshState(true);
    } catch (e) { toast(e.message, 'err'); }
  });
}

function kv(k, v, mono, pillKind) {
  const val = pillKind
    ? '<span class="pill ' + pillKind + '">' + esc(v) + '</span>'
    : '<div class="kv-v' + (mono ? ' mono' : '') + '">' + esc(v) + '</div>';
  return '<div class="kv"><div class="kv-k">' + esc(k) + '</div>' + val + '</div>';
}


/* ---------------- 服务器表单 ---------------- */
async function showServerModal(editName, prefill) {
  let existing = null;
  if (editName) {
    try {
      const data = await api('/api/config');
      existing = (data.config.servers || []).find((x) => x.name === editName) || null;
    } catch (e) { toast(e.message, 'err'); return; }
  }
  const pf = (!existing && prefill) ? prefill : null;
  const kind = existing ? existing.kind : (pf && pf.kind === 'http' ? 'http' : 'stdio');
  const body =
    '<div class="field"><label class="field-label">' + esc(t('fName')) + '<span class="req">*</span></label>' +
    '<input class="input" id="f_name" placeholder="' + esc(t('fNamePh')) + '" value="' + esc(existing ? existing.name : (pf && pf.name ? pf.name : '')) + '"' + (existing ? ' disabled' : '') + '>' +
    '<div class="field-hint">' + esc(t('fNameHint')) + '</div></div>' +
    '<div class="field"><label class="field-label">' + esc(t('fKind')) + '</label>' +
    '<div class="seg" id="f_kind">' +
      '<button data-k="stdio" class="' + (kind === 'stdio' ? 'active' : '') + '">' + esc(t('fKindStdio')) + '</button>' +
      '<button data-k="http" class="' + (kind === 'http' ? 'active' : '') + '">' + esc(t('fKindHttp')) + '</button>' +
    '</div>' +
    '<div class="field-hint" id="kindHint"></div></div>' +
    '<div class="field" id="wrap_command"><label class="field-label">' + esc(t('fCommand')) + '<span class="req">*</span></label>' +
    '<input class="input mono" id="f_command" placeholder="例如 npx -y @modelcontextprotocol/server-filesystem C:\\Users\\me\\docs" value="' + esc(existing && existing.command ? existing.command : (pf && pf.command ? pf.command : '')) + '">' +
    '<div class="field-hint">' + esc(t('fCommandHint')) + '</div></div>' +
    '<div class="field hidden" id="wrap_url"><label class="field-label">' + esc(t('fUrl')) + '<span class="req">*</span></label>' +
    '<input class="input mono" id="f_url" placeholder="例如 http://127.0.0.1:3001/mcp" value="' + esc(existing && existing.url ? existing.url : '') + '">' +
    '<div class="field-hint">' + esc(t('fUrlHint')) + '</div></div>' +
    '<div class="field" id="wrap_headers"><label class="field-label">' + esc(t('fHeaders')) + '</label>' +
    '<textarea class="textarea" id="f_headers" placeholder="' + esc(t('fHeadersPh')) + '">' + esc(existing && existing.headers ? Object.entries(existing.headers).map(([k, v]) => k + ': ' + v).join('\n') : '') + '</textarea></div>' +
    '<div class="field"><label class="field-label">' + esc(t('fDesc')) + '</label>' +
    '<input class="input" id="f_desc" placeholder="' + esc(t('fDescPh')) + '" value="' + esc(existing && existing.description ? existing.description : (pf && pf.description ? pf.description : '')) + '"></div>' +
    '<div id="testResult" class="hidden" style="margin-bottom:2px"></div>';

  const m = openModal({
    title: existing ? t('smEditTitle') : t('smAddTitle'),
    sub: t('smSub'),
    body,
    actions: [
      { label: t('cancel'), kind: 'ghost' },
      {
        label: t('testConn'), kind: 'ghost', icon: 'heartbeat',
        onClick: async (bodyEl, btn) => {
          const box = $('#testResult', bodyEl);
          const k = $('#f_kind button.active', bodyEl).dataset.k;
          const req = { kind: k };
          if (k === 'stdio') {
            req.command = $('#f_command', bodyEl).value.trim();
            if (!req.command) throw new Error(t('fillCommand'));
          } else {
            req.url = $('#f_url', bodyEl).value.trim();
            if (!req.url) throw new Error(t('fillUrl'));
            const headersRaw = $('#f_headers', bodyEl).value.trim();
            if (headersRaw) {
              const headers = {};
              headersRaw.split('\n').forEach((line) => {
                const idx = line.indexOf(':');
                if (idx > 0) headers[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
              });
              if (Object.keys(headers).length > 0) req.headers = headers;
            }
          }
          box.className = 'notice info';
          box.style.marginBottom = '2px';
          box.innerHTML = '<span class="ico" style="animation:indet 1.2s infinite">' + icon('refresh') + '</span><div>' + esc(t('testRunning')) + '</div>';
          try {
            const data = await api('/api/servers/test', { body: req });
            const r = data.result || {};
            box.className = 'notice ' + (r.ok ? 'ok' : 'err');
            box.innerHTML = '<span class="ico">' + icon(r.ok ? 'check' : 'x') + '</span><div><strong>' + esc(r.ok ? t('testOk') : t('testFail')) + '</strong>' + (r.message ? ' ' + esc(r.message) : '') + '</div>';
          } catch (e) {
            box.className = 'notice err';
            box.innerHTML = '<span class="ico">' + icon('x') + '</span><div><strong>' + esc(t('testFail')) + '</strong> ' + esc(e.message) + '</div>';
          }
          return true; // 不关闭弹窗
        },
      },
      {
        label: existing ? t('save') : t('add'), kind: 'primary', icon: 'check',
        onClick: async (bodyEl) => {
          const name = $('#f_name', bodyEl).value.trim();
          const k = $('#f_kind button.active', bodyEl).dataset.k;
          const payload = {
            name,
            kind: k,
            description: $('#f_desc', bodyEl).value.trim() || undefined,
          };
          if (k === 'stdio') {
            payload.command = $('#f_command', bodyEl).value.trim();
            if (!payload.command) throw new Error(t('fillCommand'));
          } else {
            payload.url = $('#f_url', bodyEl).value.trim();
            if (!payload.url) throw new Error(t('fillUrl'));
            const headersRaw = $('#f_headers', bodyEl).value.trim();
            if (headersRaw) {
              const headers = {};
              headersRaw.split('\n').forEach((line) => {
                const idx = line.indexOf(':');
                if (idx > 0) headers[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
              });
              if (Object.keys(headers).length > 0) payload.headers = headers;
            }
          }
          if (!existing) {
            if (!name) throw new Error(t('fillName'));
            await api('/api/servers', { body: payload });
            toast(t('serverAdded', { n: name }), 'ok');
          } else {
            await api('/api/servers/' + encodeURIComponent(editName) + '/update', { body: payload });
            toast(t('saved', { n: name }), 'ok');
          }
          refreshState(true);
        },
      },
    ],
  });

  const syncKind = (k) => {
    $$('#f_kind button', m.body).forEach((b) => b.classList.toggle('active', b.dataset.k === k));
    $('#wrap_command', m.body).classList.toggle('hidden', k !== 'stdio');
    $('#wrap_url', m.body).classList.toggle('hidden', k !== 'http');
    $('#wrap_headers', m.body).classList.toggle('hidden', k !== 'http');
    $('#kindHint', m.body).textContent = k === 'stdio' ? t('kindHintStdio') : t('kindHintHttp');
    const box = $('#testResult', m.body); if (box) box.className = 'hidden';
  };
  $$('#f_kind button', m.body).forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); syncKind(b.dataset.k); }));
  syncKind(kind);
}

/* ---------------- 隧道表单 ---------------- */
async function showTunnelModal(editName) {
  const s = app.state;
  if (!s) return;
  if (s.servers.length === 0) {
    const go = await confirmModal(t('needServerTitle'), t('needServerMsg'), t('goAdd'));
    if (go) showServerModal(null);
    return;
  }
  let existing = null;
  if (editName) {
    try {
      const data = await api('/api/config');
      existing = (data.config.tunnels || []).find((x) => x.name === editName) || null;
    } catch (e) { toast(e.message, 'err'); return; }
  }
  const d = s.docs || {};
  const initKeyMode = existing
    ? (existing.apiKeyEnv ? 'env' : (existing.apiKeyStore === 'keyring' ? 'keyring' : (existing.apiKeySet ? 'inline' : 'env')))
    : (app.keyringSupported ? 'keyring' : 'env');
  const keyringBtn = app.keyringSupported
    ? '<button data-k="keyring" class="' + (initKeyMode === 'keyring' ? 'active' : '') + '">' + esc(t('keyModeKeyring')) + '</button>'
    : '';

  const body =
    '<div class="field-row">' +
      '<div class="field"><label class="field-label">' + esc(t('fName')) + '<span class="req">*</span></label>' +
      '<input class="input" id="f_tname" placeholder="my-first-tunnel" value="' + esc(existing ? existing.name : '') + '"' + (existing ? ' disabled' : '') + '></div>' +
      '<div class="field"><label class="field-label">' + esc(t('fServerBind')) + '<span class="req">*</span></label>' +
      '<select class="select" id="f_tserver">' +
      s.servers.map((sv) => '<option value="' + esc(sv.name) + '"' + (existing && existing.server === sv.name ? ' selected' : '') + '>' + esc(sv.name) + '（' + (sv.kind === 'http' ? 'HTTP' : 'stdio') + '）</option>').join('') +
      '</select></div>' +
    '</div>' +
    '<div class="field"><label class="field-label">' + esc(t('fTunnelId')) + '<span class="req">*</span></label>' +
    '<input class="input mono" id="f_tid" placeholder="tunnel_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value="' + esc(existing ? existing.tunnelId : '') + '">' +
    '<div class="field-hint">' + t('fTunnelIdHint', { a: '<a href="' + esc(d.platformTunnels || '#') + '" target="_blank" rel="noopener">' + esc(t('fTunnelIdA')) + '</a>' }) + '</div></div>' +
    '<div class="field"><label class="field-label">' + esc(t('fKey')) + '<span class="req">*</span></label>' +
    '<div class="seg" id="f_keymode">' +
      keyringBtn +
      '<button data-k="env" class="' + (initKeyMode === 'env' ? 'active' : '') + '">' + esc(t('keyModeEnv')) + '</button>' +
      '<button data-k="inline" class="' + (initKeyMode === 'inline' ? 'active' : '') + '">' + esc(t('keyModeInline')) + '</button>' +
    '</div></div>' +
    '<div class="field" id="wrap_keyenv"><label class="field-label">' + esc(t('fKeyEnv')) + '</label>' +
    '<input class="input mono" id="f_keyenv" placeholder="MCPHELM_RUNTIME_KEY" value="' + esc(existing && existing.apiKeyEnv ? existing.apiKeyEnv : 'MCPHELM_RUNTIME_KEY') + '">' +
    '<div class="field-hint">' + esc(t('fKeyEnvHint')) + '</div></div>' +
    '<div class="field hidden" id="wrap_keykeyring"><label class="field-label">runtime key</label>' +
    '<input class="input mono" id="f_keykeyring" type="password" placeholder="' + esc(t('fKeyInlinePh')) + '" value="">' +
    '<div class="field-hint">' + esc(t('fKeyKeyringHint')) + (existing && existing.apiKeySet ? esc(t('fKeyKeep')) : '') + '</div></div>' +
    '<div class="field hidden" id="wrap_keyinline"><label class="field-label">runtime key</label>' +
    '<input class="input mono" id="f_keyinline" type="password" placeholder="' + esc(t('fKeyInlinePh')) + '" value="">' +
    '<div class="field-hint">' + t('fKeyInlineHint', { a: '<a href="' + esc(d.platformApiKeys || '#') + '" target="_blank" rel="noopener">' + esc(t('fKeyInlineA')) + '</a>' }) + (existing && existing.apiKeySet ? esc(t('fKeyKeep')) : '') + '</div></div>' +
    '<div class="field"><label class="field-label">' + esc(t('fHealthPort')) + '</label>' +
    '<input class="input mono" id="f_tport" placeholder="8080" value="' + esc(existing && existing.healthPort ? String(existing.healthPort) : '') + '"></div>';

  const m = openModal({
    title: existing ? t('tmEditTitle') : t('tmCreateTitle'),
    sub: t('tmSub'),
    body,
    wide: true,
    actions: [
      { label: t('cancel'), kind: 'ghost' },
      {
        label: existing ? t('save') : t('createTunnel'), kind: 'primary', icon: 'check',
        onClick: async (bodyEl) => {
          const name = $('#f_tname', bodyEl).value.trim();
          const keyMode = $('#f_keymode button.active', bodyEl).dataset.k;
          const portRaw = $('#f_tport', bodyEl).value.trim();
          const payload = {
            name,
            tunnelId: $('#f_tid', bodyEl).value.trim(),
            server: $('#f_tserver', bodyEl).value,
            keyMode,
          };
          if (portRaw) {
            const p = Number(portRaw);
            if (!Number.isInteger(p) || p < 1 || p > 65535) throw new Error(t('badPort'));
            payload.healthPort = p;
          }
          if (keyMode === 'env') {
            payload.apiKeyEnv = $('#f_keyenv', bodyEl).value.trim();
            if (!payload.apiKeyEnv) throw new Error(t('fillEnvName'));
          } else if (keyMode === 'keyring') {
            const keyVal = $('#f_keykeyring', bodyEl).value.trim();
            if (keyVal) payload.apiKey = keyVal;
            else if (!existing || !existing.apiKeySet) throw new Error(t('fillKey'));
            else payload.keyMode = 'keep';
          } else {
            const keyVal = $('#f_keyinline', bodyEl).value.trim();
            if (keyVal) payload.apiKey = keyVal;
            else if (!existing || !existing.apiKeySet) throw new Error(t('fillKey'));
            else payload.keyMode = 'keep';
          }
          if (!existing) {
            if (!name) throw new Error(t('fillName'));
            if (!payload.tunnelId) throw new Error(t('fillTunnelId'));
            await api('/api/tunnels', { body: payload });
            toast(t('tunnelCreated', { n: name }), 'ok');
          } else {
            await api('/api/tunnels/' + encodeURIComponent(editName) + '/update', { body: payload });
            toast(t('saved', { n: name }), 'ok');
          }
          refreshState(true);
        },
      },
    ],
  });

  const syncKey = (k) => {
    $$('#f_keymode button', m.body).forEach((b) => b.classList.toggle('active', b.dataset.k === k));
    $('#wrap_keyenv', m.body).classList.toggle('hidden', k !== 'env');
    $('#wrap_keyinline', m.body).classList.toggle('hidden', k !== 'inline');
    const kr = $('#wrap_keykeyring', m.body); if (kr) kr.classList.toggle('hidden', k !== 'keyring');
  };
  $$('#f_keymode button', m.body).forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); syncKey(b.dataset.k); }));
  syncKey(initKeyMode);
}

/* ---------------- 运行时下载/导入 ---------------- */
function showRuntimeModal() {
  const s = app.state;
  const d = (s && s.docs) || {};
  openModal({
    title: t('rmTitle'),
    sub: t('rmSub'),
    body:
      '<div class="notice info"><span class="ico">' + icon('info') + '</span><div>' + t('rmInfo', { a: '<a href="' + esc(d.tunnelClientRepo || '#') + '" target="_blank" rel="noopener">' + esc(t('rmInfoA')) + '</a>' }) + '</div></div>' +
      '<div id="dlProgress" class="hidden" style="margin-bottom:14px"><div class="progress"><div class="progress-fill indeterminate"></div></div>' +
      '<div id="dlLog" class="mono" style="margin-top:10px;font-size:12px;color:var(--text-2);max-height:140px;overflow-y:auto;background:var(--surface-2);border-radius:8px;padding:10px 12px"></div></div>',
    dismissable: true,
    actions: [
      { label: t('close'), kind: 'ghost' },
      {
        label: t('startDownload'), kind: 'primary', icon: 'download',
        onClick: async (bodyEl, btn) => {
          $('#dlProgress', bodyEl).classList.remove('hidden');
          btn.classList.add('hidden');
          await api('/api/runtime/fetch', { body: {} });
          pollRuntimeJob(bodyEl);
          return true; // 保持弹窗开着看进度
        },
      },
    ],
  });
}

async function pollRuntimeJob(bodyEl) {
  if (!document.body.contains(bodyEl)) { app.jobPolling = false; return; }
  app.jobPolling = true;
  try {
    const data = await api('/api/runtime/job');
    const job = data.job;
    const logEl = $('#dlLog', bodyEl);
    if (job && logEl) logEl.textContent = (job.lines || []).slice(-40).join('\n');
    if (job && !job.running) {
      app.jobPolling = false;
      const fill = $('.progress-fill', bodyEl);
      if (fill) fill.classList.remove('indeterminate');
      if (job.ok) {
        if (fill) { fill.style.width = '100%'; }
        toast(t('runtimeReadyToast'), 'ok');
        setTimeout(() => { closeModal(); refreshState(true); }, 900);
      } else {
        if (fill) { fill.style.width = '100%'; fill.style.background = 'var(--red)'; }
        toast(t('downloadFailed') + (job.error || t('unknownError')), 'err');
        refreshState(true);
      }
      return;
    }
  } catch (e) { /* 继续轮询 */ }
  setTimeout(() => pollRuntimeJob(bodyEl), 800);
}

function showImportRuntimeModal() {
  openModal({
    title: t('riTitle'),
    sub: t('riSub'),
    body:
      '<div class="field"><label class="field-label">' + esc(t('fZipPath')) + '<span class="req">*</span></label>' +
      '<input class="input mono" id="f_zippath" placeholder="例如 D:\\Downloads\\tunnel-client-windows-x64.zip"></div>' +
      '<div class="field"><label class="field-label">' + esc(t('fZipVer')) + '</label>' +
      '<input class="input mono" id="f_zipver" placeholder="' + esc(t('fZipVerPh')) + '"></div>',
    actions: [
      { label: t('cancel'), kind: 'ghost' },
      {
        label: t('doImport'), kind: 'primary', icon: 'check',
        onClick: async (bodyEl) => {
          const zipPath = $('#f_zippath', bodyEl).value.trim();
          if (!zipPath) throw new Error(t('noZipPath'));
          const version = $('#f_zipver', bodyEl).value.trim();
          await api('/api/runtime/import', { body: { zipPath, version: version || undefined } });
          toast(t('importedRuntime'), 'ok');
          refreshState(true);
        },
      },
    ],
  });
}

/* ---------------- 服务器模板 ---------------- */
async function showTemplateModal() {
  let data;
  try { data = await api('/api/templates'); } catch (e) { toast(e.message, 'err'); return; }
  const templates = data.templates || [];
  let html = '<div class="entity-grid" style="grid-template-columns:1fr">';
  templates.forEach((tp) => {
    html += '<div class="entity-card" data-tpl="' + esc(tp.id) + '">' +
      '<div class="entity-top">' +
        '<div class="entity-ico kind-stdio">' + icon('zap') + '</div>' +
        '<div class="entity-names"><div class="entity-name">' + esc(tp.name) + '</div>' +
        '<div class="entity-target">' + esc(tp.description || '') + '</div></div>' +
      '</div>' +
      '<div class="entity-meta"><span class="m mono" style="font-size:11.5px">' + esc(tp.command || '') + '</span></div>' +
      (tp.hint ? '<div class="entity-meta"><span class="m" style="color:var(--text-3)"><span class="ico">' + icon('info') + '</span>' + esc(tp.hint) + '</span></div>' : '') +
      '<div class="entity-foot"><span class="spacer"></span>' +
        '<button class="btn small primary" data-use="' + esc(tp.id) + '"><span class="ico">' + icon('check') + '</span>' + esc(t('tplUse')) + '</button>' +
      '</div></div>';
  });
  html += '</div>';
  const m = openModal({ title: t('tplTitle'), sub: t('tplSub'), body: html, wide: true, actions: [{ label: t('cancel'), kind: 'ghost' }] });
  $$('[data-use]', m.body).forEach((b) => b.addEventListener('click', () => {
    const tp = templates.find((x) => x.id === b.dataset.use);
    if (!tp) return;
    closeModal();
    showServerModal(null, { name: tp.id, kind: tp.kind || 'stdio', command: tp.command || '', description: tp.description || '' });
  }));
}

/* ---------------- 导入向导 ---------------- */
function showImportModal() {
  const state = { tab: 'scan', found: [], pasted: null };

  const m = openModal({
    title: t('imTitle'),
    sub: t('imSub'),
    wide: true,
    body:
      '<div class="seg" id="imTabs" style="margin-bottom:14px">' +
        '<button data-tab="scan" class="active">' + esc(t('imTabScan')) + '</button>' +
        '<button data-tab="paste">' + esc(t('imTabPaste')) + '</button>' +
      '</div>' +
      '<div id="imBody"></div>',
    actions: [
      { label: t('cancel'), kind: 'ghost' },
      {
        label: t('imDoApply', { n: 0 }), kind: 'primary', icon: 'check', id: 'imApply',
        onClick: async (bodyEl, btn) => {
          const checked = $$('#imBody input[type=checkbox][data-name]:checked', bodyEl).map((x) => x.dataset.name);
          if (checked.length === 0) throw new Error(t('imNothing'));
          const overwrite = !!($('#imOverwrite', bodyEl) && $('#imOverwrite', bodyEl).checked);
          const body = { names: checked, overwrite };
          if (state.tab === 'paste' && state.pasted) body.pastedText = state.pasted;
          else if (state.tab === 'scan' && state.found.length > 0) body.sourceFile = state.found[0].file;
          else throw new Error(t('imNothing'));
          const data = await api('/api/import/apply', { body });
          const o = data.outcome || { added: [], replaced: [], skipped: [] };
          toast(t('imDone', { a: o.added.length, r: o.replaced.length, s: o.skipped.length }), 'ok');
          refreshState(true);
        },
      },
    ],
  });

  const applyBtn = $$('.modal-foot .btn', m.overlay).pop();
  const refreshApplyLabel = () => {
    const n = $$('#imBody input[type=checkbox][data-name]:checked', m.body).length;
    applyBtn.innerHTML = '<span class="ico">' + icon('check') + '</span>' + esc(t('imDoApply', { n }));
    applyBtn.disabled = n === 0;
  };

  const renderScan = () => {
    const body = $('#imBody', m.body);
    body.innerHTML = '<div style="color:var(--text-3);font-size:13px;display:flex;align-items:center;gap:8px;padding:12px 0"><span class="ico" style="animation:indet 1.2s infinite">' + icon('refresh') + '</span>' + esc(t('imScanning')) + '</div>';
    api('/api/import/scan').then((data) => {
      state.found = (data.found || []).filter((f) => !f.error && f.servers && f.servers.length > 0);
      const errs = (data.found || []).filter((f) => f.error);
      if (state.found.length === 0) {
        let h = '<div class="notice info"><span class="ico">' + icon('info') + '</span><div>' + esc(t('imNoneFound')) + '</div></div>';
        errs.forEach((f) => { h += '<div class="notice warn" style="margin-top:8px"><span class="ico">' + icon('warn') + '</span><div>' + esc(f.source || '') + '：' + esc(t('imParseErr')) + esc(f.error) + '</div></div>'; });
        h += '<div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn ghost small" id="imRescan"><span class="ico">' + icon('refresh') + '</span>' + esc(t('imRescan')) + '</button></div>';
        body.innerHTML = h;
        $('#imRescan', body).addEventListener('click', renderScan);
        refreshApplyLabel();
        return;
      }
      let h = '';
      state.found.forEach((f) => {
        h += '<div class="card" style="margin-bottom:12px"><div class="card-head" style="padding-bottom:8px"><div>' +
          '<div class="card-title" style="font-size:13.5px"><span class="ico">' + icon('download') + '</span>' + esc(f.source) + ' <span class="pill blue">' + esc(t('imServersN', { n: f.servers.length })) + '</span></div>' +
          '<div class="card-sub mono" style="font-size:11px">' + esc(f.file) + '</div>' +
        '</div></div><div class="card-body" style="padding-top:4px">';
        f.servers.forEach((sv) => {
          h += '<label style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;font-size:13px;cursor:pointer;border-bottom:1px solid var(--line)">' +
            '<input type="checkbox" data-name="' + esc(sv.name) + '" checked style="margin-top:2px">' +
            '<span><strong>' + esc(sv.name) + '</strong> <span style="color:var(--text-3)">(' + esc(sv.kind) + ')</span><br>' +
            '<span class="mono" style="font-size:11.5px;color:var(--text-2)">' + esc(sv.target || '') + '</span></span></label>';
        });
        h += '</div></div>';
      });
      errs.forEach((f) => { h += '<div class="notice warn" style="margin-bottom:10px"><span class="ico">' + icon('warn') + '</span><div>' + esc(f.source || '') + '：' + esc(t('imParseErr')) + esc(f.error) + '</div></div>'; });
      h += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">' +
        '<label style="display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--text-2);cursor:pointer"><input type="checkbox" id="imOverwrite"> ' + esc(t('imOverwrite')) + '</label>' +
        '<span style="display:flex;gap:6px"><button class="btn ghost small" id="imPickAll">' + esc(t('imPickAll')) + '</button><button class="btn ghost small" id="imPickNone">' + esc(t('imPickNone')) + '</button></span></div>';
      body.innerHTML = h;
      $$('#imBody input[type=checkbox][data-name]', m.body).forEach((x) => x.addEventListener('change', refreshApplyLabel));
      $('#imPickAll', body).addEventListener('click', () => { $$('#imBody input[type=checkbox][data-name]', m.body).forEach((x) => { x.checked = true; }); refreshApplyLabel(); });
      $('#imPickNone', body).addEventListener('click', () => { $$('#imBody input[type=checkbox][data-name]', m.body).forEach((x) => { x.checked = false; }); refreshApplyLabel(); });
      refreshApplyLabel();
    }).catch((e) => {
      body.innerHTML = '<div class="notice err"><span class="ico">' + icon('x') + '</span><div>' + esc(e.message) + '</div></div>';
      refreshApplyLabel();
    });
  };

  const renderPaste = () => {
    const body = $('#imBody', m.body);
    body.innerHTML =
      '<div class="field"><label class="field-label">' + esc(t('imPasteHint')) + '</label>' +
      '<textarea class="textarea mono" id="imPaste" rows="9" placeholder="{\"mcpServers\": { ... }}"></textarea></div>' +
      '<div id="imPastePreview"></div>';
    const ta = $('#imPaste', body);
    const preview = $('#imPastePreview', body);
    const parse = () => {
      const raw = ta.value.trim();
      state.pasted = raw || null;
      if (!raw) { preview.innerHTML = ''; refreshApplyLabel(); return; }
      try {
        const obj = JSON.parse(raw);
        const servers = (obj && obj.mcpServers && typeof obj.mcpServers === 'object') ? Object.keys(obj.mcpServers) : [];
        if (servers.length === 0) {
          preview.innerHTML = '<div class="notice warn"><span class="ico">' + icon('warn') + '</span><div>' + esc(t('imNoneFound')) + '</div></div>';
        } else {
          let h = '<div style="margin-top:4px">';
          servers.forEach((n) => {
            h += '<label style="display:flex;align-items:center;gap:8px;padding:5px 0;font-size:13px;cursor:pointer;border-bottom:1px solid var(--line)">' +
              '<input type="checkbox" data-name="' + esc(n) + '" checked> <strong>' + esc(n) + '</strong></label>';
          });
          h += '</div><label style="display:flex;align-items:center;gap:6px;margin-top:8px;font-size:12.5px;color:var(--text-2);cursor:pointer"><input type="checkbox" id="imOverwrite"> ' + esc(t('imOverwrite')) + '</label>';
          preview.innerHTML = h;
          $$('#imBody input[type=checkbox][data-name]', m.body).forEach((x) => x.addEventListener('change', refreshApplyLabel));
        }
      } catch (e) {
        state.pasted = null;
        preview.innerHTML = '<div class="notice err"><span class="ico">' + icon('x') + '</span><div>' + esc(t('imParseErr')) + esc(e.message) + '</div></div>';
      }
      refreshApplyLabel();
    };
    ta.addEventListener('input', parse);
    parse();
  };

  $$('#imTabs button', m.body).forEach((b) => b.addEventListener('click', (e) => {
    e.preventDefault();
    state.tab = b.dataset.tab;
    $$('#imTabs button', m.body).forEach((x) => x.classList.toggle('active', x === b));
    if (state.tab === 'scan') renderScan(); else renderPaste();
  }));
  renderScan();
}

/* ---------------- 初始化 ---------------- */
function initIcons() {
  $$('[data-ico]').forEach((el) => { el.innerHTML = icon(el.dataset.ico); });
}

document.addEventListener('DOMContentLoaded', () => {
  initIcons();
  $$('#nav .nav-item').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
  $('#btnRefresh').addEventListener('click', () => refreshState(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  refreshState(false);
});
