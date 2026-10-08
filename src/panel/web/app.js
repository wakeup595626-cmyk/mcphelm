/* MCPHelm 控制台前端 */
'use strict';

/* ---------------- 多语言 ---------------- */
const I18N = {
  zh: {
    brandSub: '本地隧道控制台',
    tagline: '把本地 AI 能力安全接进 ChatGPT',
    navDashboard: '概览', navTunnels: '隧道', navServers: '服务器', navMarket: '组件市场', navLogs: '日志', navDoctor: '体检', navSettings: '设置',
    stuckT: '卡住了？常见问题与官方入口',
    metaDashboardT: '概览', metaDashboardS: '上面是五步上手指引（始终保留），下面是实时运行状态',
    metaTunnelsT: '隧道', metaTunnelsS: '把本地 MCP 服务器安全地暴露给 ChatGPT',
    metaServersT: '服务器', metaServersS: '管理你本机的 MCP 服务器',
    metaMarketT: '组件市场', metaMarketS: '一键安装 GitHub 上主流的 MCP 服务器，免去手写命令',
    mkTitle: '精选组件', mkSub: '挑一个点“安装”，MCPHelm 自动配好命令写进服务器列表，再挂上隧道就能用',
    mkNote: '组件全部来自 GitHub 主流开源项目（MIT / Apache-2.0），按需下载不预打包，安装包保持小巧。装好后再去「隧道」页给它建一条隧道即可。',
    mkInstall: '安装', mkInstalled: '已安装', mkUninstall: '卸载', mkReinstallTip: '已安装，去服务器页挂隧道',
    mkCmd: '启动命令', mkRunner: '运行方式', mkLicense: '许可证', mkSource: '来源',
    mkInstallOk: '已安装，去「服务器」挂上隧道就能用', mkUninstallOk: '已卸载',
    mkUninstallTitle: '卸载组件', mkUninstallMsg: '确定卸载 {t} 吗？这会把它从服务器列表里移除（不会删你的隧道配置）。',
    mkNeedTunnel: '已装好，还差一步：去「隧道」页新建一条隧道，服务器选它',
    mkCustom: '想要别的？去「服务器」页手动添加任意 MCP 命令',
    /* 组件市场卡片：能力清单 + 星标（星标数字由面板联网刷新，刷不到就用打包时的快照） */
    mkAbilities: '能做什么',
    mkStars: '★ {n}',
    mkStarsLive: '星标数：刚刚联网更新',
    mkStarsSnapshot: '星标数来自 {d} 的快照（联网刷新失败时显示的就是它）',
    metaLogsT: '日志', metaLogsS: '查看每条隧道的运行输出',
    metaDoctorT: '体检', metaDoctorS: '自动检查环境和配置有没有问题',
    metaSettingsT: '设置', metaSettingsS: '界面偏好、路径、密钥状态与帮助入口',
    /* 「密钥」板块：隧道密钥与 API 密钥集中在「服务器 / 隧道」之前，先备钥匙再动手 */
    navKeys: '密钥',
    metaKeysT: '密钥', metaKeysS: '先把隧道密钥和 API 密钥存好，建隧道时会自动带上',
    keysIntroT: '先存两把钥匙，后面两步就顺了',
    keysIntroD: '建隧道一共要用两样东西：一把「隧道密钥」（Tunnel ID，tunnel_ 开头）和一把「API 密钥」（runtime key，sk- 开头）。在这里存一次就行，之后新建隧道会自动带上，不用来回跑平台复制。',
    /* 「密钥管理」：一行两列，一把钥匙一列，状态、值、谁在用它、操作都在这一列里 */
    keysManageT: '密钥管理',
    keysManageD: '本机保存的两把钥匙都在这里：状态、存放位置、谁在用它一目了然，随时可以复制、更新或清除。',
    keysSummary: '{a}/{b} 已就绪',
    keysSaved: '已保存', keysNotReady: '未保存',
    keysStoreKeyring: 'Windows 凭据管理器', keysStorePlain: '本机配置文件（明文）',
    keysSavedAt: '保存于 {t}', keysUsedBy: '隧道 {n} 正在用它', keysUnused: '还没有隧道用它，建隧道时会自动预填',
    keysApiReuse: '新建隧道选「密钥保险箱」并留空就用这把',
    keysTailHint: '只保留保存时的末四位，完整密钥不会显示在界面或日志里',
    keysNeedResavePill: '需重新保存',
    keysNeedResave: '保险箱里找不到这把密钥了（可能被系统清理过），重新粘贴一次就能恢复。',
    keysEmptyTunnel: '还没保存：点「粘贴并保存」，把 tunnel_ 开头的那串 ID 存进来。',
    keysEmptyApi: '还没保存：点「粘贴并保存」，把 runtime key 存进来。',
    keysBtnCopy: '复制', keysBtnEdit: '更新', keysBtnPaste: '粘贴并保存',
    keysCopied: '已复制到剪贴板', keysCopyFail: '复制失败，请手动选中这串 ID 复制',
    keysClearTunnelAsk: '清除之后，新建隧道不会再自动预填这条隧道 ID（平台上那条隧道不受影响），随时可以再存一次。',
    keysClearKeyAsk: '清除之后，新建隧道要重新粘贴一次 runtime key（已经建好的隧道不受影响），随时可以再存一次。',
    keysField1: '隧道密钥（Tunnel ID）', keysPh1: 'tunnel_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', keysSave1: '保存隧道密钥',
    keysSaved1: '隧道密钥已保存',
    keysCard1T: '① 隧道密钥（Tunnel ID）', keysCard1D: '在 OpenAI 平台的隧道页面创建隧道后拿到的那串 ID。',
    keysCard1B1: '打开 OpenAI 平台，进入「Tunnels / 隧道」页面（登录你自己的账号）。',
    keysCard1B2: '新建一条隧道，名字随便起（例如 my-first-tunnel），创建完复制它给出的 Tunnel ID。',
    keysCard1B3: '回到本页「密钥管理」，点隧道密钥这一行右边的「粘贴并保存」。',
    keysCard1B4: '把 tunnel_ 开头的这串 ID 粘进输入框，点「保存隧道密钥」，状态变成「已保存」就成功。',
    keysField2: 'API 密钥（runtime key）', keysSave2: '保存 API 密钥',
    keysSaved2: 'API 密钥已保存',
    keysCard2T: '② API 密钥（runtime key）', keysCard2D: '隧道连上 OpenAI 平台要用的密钥，在平台的 API keys 页面创建。',
    keysCard2B1: '打开 OpenAI 平台的「API keys」页面（就是拿 runtime key 的地方）。',
    keysCard2B2: '点「Create new secret key」新建一把密钥并复制（离开页面后就不再完整显示了）。',
    keysCard2B3: '回到本页「密钥管理」，点 API 密钥这一行右边的「粘贴并保存」，保存方式选「密钥保险箱」（推荐：只进 Windows 凭据管理器，磁盘不留明文）。',
    keysCard2B4: '把密钥粘进输入框，点「保存 API 密钥」，状态变成「已保存」就成功。',
    keysStoreLabel: '保存方式',
    keysClearKey: '清除 API 密钥', keysClearTunnel: '清除隧道密钥',
    keysClearedTunnel: '隧道密钥已清除', keysClearedKey: '已保存的 API 密钥已清除',
    keysNeedValue: '先把内容粘进来再保存',
    keysGuidesT: '这两把钥匙去哪儿拿？', keysGuidesS: '照着下面的步骤在 OpenAI 平台各拿一把，回来保存就行。',
    keysOpenTunnels: '打开隧道管理', keysOpenApiKeys: '打开 API 密钥页',
    keysKeyringOff: '这台电脑的密钥保险箱不可用，先用「直接填写」保存；它会把这把密钥写进本地配置文件。',
    keysInlineHint: '这把密钥会写进本机配置文件（明文保存），保险箱不可用时再用它。',
    refresh: '刷新', refreshing: '刷新中…', refreshed: '已刷新', refreshHint: '重新同步最新数据', newTunnel: '新建隧道', downloadRuntime: '下载运行环境',
    close: '关闭', cancel: '取消', confirm: '确定', delete: '删除', save: '保存修改',
    opFailed: '操作失败', deleteTunnel: '删除隧道',
    deleteTunnelMsg: '确定要删除隧道 <strong>{n}</strong> 吗？<br>这只会移除 MCPHelm 里的登记，不会影响 OpenAI 平台上的隧道。',
    tunnelDeleted: '已删除隧道 {n}', serverDeleted: '已删除服务器 {n}',
    tunnelStarted: '隧道 {n} 已启动', tunnelStopped: '隧道 {n} 已停止', tunnelRestarted: '隧道 {n} 已重启',
    serverAdded: '已添加服务器 {n}', saved: '已保存 {n}',
    tunnelCreated: '已创建隧道 {n}，点"启动"即可上线',
    overwriteSave: '用这份配置覆盖', overwriteHint: '已经有一条叫 {n} 的隧道。确认要用现在这份配置覆盖它，就再点一次这个按钮。',
    runtimeReadyToast: '运行环境已就绪',
    downloadFailed: '下载失败：', importedRuntime: '已导入运行环境',
    /* 运行环境下装进度：后端每完成一段就回报百分比与阶段，进度条不再是假动画 */
    dlStage_prepare: '准备中：正在检查网络与下载地址…',
    dlStage_download: '正在下载运行环境…',
    dlStage_verify: '下载完成，正在校验文件…',
    dlStage_unpack: '正在解压安装包…',
    dlStage_install: '正在写入安装文件…',
    dlStage_done: '安装完成',
    dlStage_failed: '安装失败',
    noZipPath: '请填 zip 文件路径', fillName: '请填写名称', fillCommand: '请填写启动命令',
    fillUrl: '请填写服务地址', fillEnvName: '请填写环境变量名', fillKey: '请粘贴 runtime key',
    fillTunnelId: '请填写隧道 ID', badPort: '端口必须是 1-65535 的整数',
    offline: '无法连接本地服务：',
    envMissing: '缺少运行环境', envOk: '环境正常', envBadCfg: '配置有 {n} 个问题',
    statTunnels: '隧道总数', statRunning: '运行中', statHealthy: '健康通过', statAttention: '需要关注',
    heroTitle: '五步把你的本地 AI 能力接进 ChatGPT',
    heroP: 'MCPHelm 帮你把运行在本机的 MCP 服务器，通过 OpenAI 官方安全隧道接到 ChatGPT。全程不用敲命令，跟着下面五个真实操作走就行，和新手指南是同一套流程。',
    heroProgress: '{d} / {t} 步已完成',
    heroContinue: '继续第 {n} 步',
    redownload: '重新下载', oneClickDownload: '一键下载',
    addAnother: '再添加一个', addServer: '添加服务器',
    manageTunnels: '管理隧道', createTunnel: '创建隧道',
    attentionLine: '<strong>有 {n} 处需要关注。</strong> 去<a href="#" data-goto="doctor">体检</a>看看具体问题和修复建议。',
    dashTunnels: '隧道一览', dashTunnelsSub: '点击卡片上的按钮即可启动、停止或查看日志',
    stRunningOk: '运行正常', stHealthBad: '本机自检未就绪', stRunning: '运行中', stError: '出错了',
    stHealthTipOk: '本机健康端点自检通过（healthz、readyz 都是 200），隧道进程和 ChatGPT 侧都在正常工作。',
    stHealthTipBad: '本机健康端点自检没过：healthz={h}，readyz={r}{e}。这只是本机自检，不代表 ChatGPT 已经断线——隧道进程仍在运行，可以先点「重启」，或点「日志」看输出。',
    stStale: '进程已退出', stStopped: '已停止',
    stStaleTip: '这条隧道的进程已经退出了（面板还保留着上一次的运行记录）。下面写了退出原因，按建议处理后再点「启动」。',
    /* 0.1.10：隧道起不来时，卡片上直接给出「为什么」和「怎么修」 */
    errFix: '修复建议',
    tunErrWhy: '这条隧道没能起来',
    mkRunnerMissing: '需先安装 {r}',
    mkRunnerMissingTip: '这条 MCP 组件要用 {r} 拉起，本机现在还找不到它。',
    keyReady: '密钥就绪', keyMissing: '密钥未就绪', keyFrom: '密钥来源：',
    keyMissingTip: '密钥还没就位：点「编辑」重新填一次，或者把密钥来源换成「环境变量」「直接填写」。',
    stop: '停止', restart: '重启', start: '启动', logs: '日志', edit: '编辑',
    tunnelEmptyH: '还没有隧道',
    tunnelEmptyP: '隧道是连接本地服务器和 ChatGPT 的桥梁。先确认已添加服务器，再创建第一条隧道。',
    createFirstTunnel: '创建第一条隧道',
    tunnelEmptyKeys: '两把钥匙还没存？先去「密钥」板块存好，新建隧道时就会自动带上。',
    tunnelEmptyKeysBtn: '先去「密钥」存好',
    serverEmptyH: '还没有登记 MCP 服务器',
    serverEmptyP: '把你想给 ChatGPT 用的本地 MCP 服务器登记在这里——可以是一条启动命令（stdio），也可以是一个本机 HTTP 地址。',
    fromTemplate: '从模板新建', importConfig: '导入已有配置', fromMarket: '从组件市场选',
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

    /* 支持作者（Star / 请我喝咖啡）：纯自愿，不参与任何功能判定，点了不解锁、不点也不限制 */
    supEntryStar: '点个 Star',
    supEntryCoffee: '请我喝咖啡',
    supTitle: '支持 MCPHelm',
    supSub: '免费开源，所有功能一开始就是全的',
    supWelcomeT: '欢迎使用 MCPHelm',
    supWelcomeS: '免费开源：没有授权码、没有试用期，全部功能直接可用',
    supStarBlockT: '给项目点个 Star',
    supStarWhy1: '完全免费：不需要授权码、没有试用期，Star 也不解锁任何东西。',
    supStarWhy2: 'Star 是别人判断「这个项目靠不靠谱」的第一眼信号——星越多，愿意试一试的人越多。',
    supStarWhy3: '点一下不影响你的数据和配置，随时可以在 GitHub 上取消。',
    supStarBtn: '去 GitHub 点 Star',
    supStarFine: '会打开浏览器进入项目主页，点右上角的 ★ Star 就行。GitHub 不允许第三方软件替用户点 Star，所以这最后一下得你亲手来。',
    supCoffeeT: '请我喝杯咖啡',
    supCoffeeLead: '如果它帮你省下了折腾命令行的时间，可以打开支付宝扫右边的码。几块钱也是实实在在的鼓励。',
    supCoffeeFine: '完全自愿：不打赏也照样能用全部功能，这一点不会变。',
    supQrAlt: '支付宝收款码',
    supQrCap: '支付宝扫一扫 · 收款码',
    supLater: '以后再说',
    supHintClose: '不再显示',
    supStarOpened: '已打开项目主页，点一下 ★ Star 就好',
    supNoStar: '还没有配置项目主页地址',
    supHintT: '五步都跑通了',
    supHintD: '如果 MCPHelm 对你有用，可以给项目点个 Star，或者请我喝杯咖啡。',
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
    fTunnelIdPrefill: '已从「密钥」板块自动带过来，不用再粘一次',
    fKey: '密钥（runtime key）',
    keyModeEnv: '环境变量', keyModeKeyring: '密钥保险箱（推荐）', keyModeInline: '直接填写',
    fKeyEnv: '环境变量名', fKeyEnvHint: '密钥不落盘，启动时从该环境变量读取',
    fKeyKeyringHint: '密钥只存进 Windows 凭据管理器，不写进任何配置文件，本机最安全的方式',
    fKeyReuseHint: '「密钥」板块里已经存好了，这里留空就会自动复用它',
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

    /* 新手指南（软件内教程） */
    gDone: '已完成', gTodo: '待完成',
    wizStepOf: '第 {i} 步，共 {n} 步',
    wizPrev: '上一步', wizNext: '下一步',
    wizAllDoneT: '五步已全部完成',
    wizAllDoneD: '上手指引会一直留在这里：想回看哪一步，点上面的圆点翻回去就行，每一步的按钮都还在。下面是实时运行状态。',
    wizFinish: '去概览看看', wizHelpT: '常见问题 · 官方链接', wizOpenHere: '在这里继续这一步',
    gs2T: '下载运行环境（发动机）',
    gs2D: '隧道要跑起来，需要 OpenAI 官方的 tunnel-client。点下面的按钮，MCPHelm 会自动下载并做完整性校验，等进度走完即可。',
    gs2S1: '点一下按钮，自动下载并校验，等进度条走完。',
    gs2S2: '如果网络到不了官方仓库：去官方仓库手动下载 zip，再到「设置 → 运行环境 → 导入本地安装包」导入。',
    gs3T: '添加 MCP 服务器（你要接入的能力）',
    gs3D: '告诉 MCPHelm 你电脑里哪个服务要接给 ChatGPT。下面三种方式任选一种，装好一个就会打上「已完成」。',
    gs3S1: '自定义添加：填一行启动命令（命令型），或填本机地址（HTTP 型）。',
    gs3S2: '从模板选：常见服务器已写好参数，选一个补全即可。',
    gs3S3: '从组件市场选：主流开源 MCP 服务器一键装好，启动命令都帮你填好。',
    gs3S4: '在用 Claude / Cursor / VS Code？点「导入已有配置」一键搬过来。',
    gs4T: '去 OpenAI 平台拿两把钥匙',
    gs4D: '这一步要拿两样东西：tunnel_ 开头的隧道 ID，和 sk- 开头的 runtime key。两把「钥匙」只保存在你自己的电脑上；拿到后到左边「密钥」板块存一次，后面建隧道会自动带上。',
    gs4S1: '点「打开隧道管理」，登录 OpenAI 账号，创建一条隧道，复制 tunnel_ 开头的隧道 ID。',
    gs4S2: '点「打开 API 密钥」，生成一把 runtime key（只完整显示一次，先复制再关页面）。',
    gs4S3: '把两把钥匙存进左边「密钥」板块（点下面的「去「密钥」存好」），存一次以后新建隧道都能复用。',
    gs4S4: '钥匙存好之后，点「我已经拿到这两把钥匙」做个标记，再到下一步。',
    gs4B1: '打开隧道管理', gs4B2: '打开 API 密钥',
    gs4BKeys: '去「密钥」存好', gs4BKeysTip: '隧道 ID 和 runtime key 在「密钥」板块各存一次，新建隧道时隧道 ID 自动预填、runtime key 勾「密钥保险箱」就能直接复用。',
    gs4B3: '我已经拿到这两把钥匙', gs4B3On: '已标记拿到钥匙（点此撤销）',
    gs4B3Note: '钥匙已经到手了。接着点「下一步」，把隧道 ID 和 runtime key 粘进隧道表单就行。',
    /* 第三步图文教程：真实截图上叠编号方框，回答「去哪创建隧道 / 去哪拿 runtime key」 */
    wizTutT: '图文教程：创建隧道 · 拿 runtime key',
    wizTutD: '下面 4 张图把「去哪创建隧道、弹窗怎么填、去哪创建 runtime key」拆成了带编号方框的截图。红圈里的数字就是操作顺序，和每张图下面的说明一一对应。截图里的账号、组织和密钥都已打码。',
    wizTutFigN: '图 {n}', wizTutZoom: '点一下看大图',
    wizTutF1T: '入口就在这张卡片上（三个按钮）',
    wizTutF1D: '① 点「打开隧道管理」，浏览器会打开 OpenAI 平台的 Tunnels 页面；② 点「打开 API 密钥」，打开 API keys 页面（这两个页面都要求先登录 OpenAI 账号）；③ 两把钥匙都复制好之后，回到这张卡片点「我已经拿到这两把钥匙」。',
    wizTutF2T: '在 Tunnels 页面创建隧道',
    wizTutF2D: '① 点右上角黑色的「Create tunnel」；② 填完弹窗（见「图 3」）后，你新建的隧道会出现在列表第一行，就是刚才起的那个名字；③ ID 列里 tunnel_ 开头的一长串，就是隧道 ID；④ 点 ID 右边的复制图标，整串直接进剪贴板，不用手选。',
    wizTutF3T: 'Create tunnel 弹窗这四个框怎么填',
    wizTutF3D: '① Name：给自己认的名字，随便起，比如「我的浏览器助手」；② Description：一句话描述，必填；③ Organizations：选中你自己的组织（图中已打码）；④ ChatGPT workspaces：选中要接入的 workspace。填完点右下角「Create」，隧道就建好了。',
    wizTutF4T: '在 API keys 页面创建 runtime key',
    wizTutF4D: '① 点右上角「Create new secret key」；② 在弹出的窗口里给这把 key 起名并创建，新 key 会出现在列表第一行；③ 完整密钥（sk- 开头）只在那个弹窗里显示这一次，先复制再关窗口——列表里只看得到头尾几位，关掉就只剩重建一把这条路。',
    wizTutSafe: '安全提醒：runtime key 就是这条隧道的门钥匙，谁拿到都能连上你的账号。它只保存在你自己的电脑上，别截图发人、别贴进聊天工具。',
    wizTutTip: '两把钥匙都复制好之后，回到这张卡片点「我已经拿到这两把钥匙」，再点「下一步」把它们粘进隧道表单。',
    /* 第五步图文教程：ChatGPT 网页端把隧道加成插件 */
    wizTut5T: '图文教程：把隧道接进 ChatGPT 网页端',
    wizTut5D: '动手之前先做一件事：打开 ChatGPT 的开发者模式（设置 → 连接器 → 高级 → 开发者模式）。不打开的话，「创建自定义 MCP 服务器」这个入口根本不会出现，菜单里也找不到。打开之后，下面 2 张图就是 ChatGPT 网页端的真实操作：先从左栏进「插件」，再从右上角「添加」里选「创建自定义 MCP 服务器」，然后在弹窗里把「连接」切成「隧道」、粘上隧道 ID、身份验证选「无需身份验证」。图里标的红色数字就是点击顺序。',
    wizTut5F1T: '从左侧栏进「插件」，再点右上角的「添加」',
    wizTut5F1D: '① 在 ChatGPT 左侧栏点「插件」（就在「资料库」下面），进入插件页；② 点右上角黑色的「添加」，下拉菜单里选「创建自定义 MCP 服务器」——这一步就是让 ChatGPT 认领你在 MCPHelm 里建好的那条隧道。',
    wizTut5F2T: '弹窗里这两个红框照着填',
    wizTut5F2D: '① 「连接」切到「隧道」，下面输入框会变成 tunnel 占位提示，把你从 MCPHelm 隧道板块复制的那串隧道 ID（tunnel_ 开头）粘进去；② 「身份验证」下拉里选「无需身份验证」（隧道 ID 本身就是钥匙，这里不需要再叠一层 OAuth）。这两个红框填完后，把下面的「我已了解，并希望继续」勾上——不勾的话右下角那个按钮是灰的、点不动——再点「以插件形式创建」，就完成了。上面的名称、描述随便填一个自己认的就行。',
    wizTut5Safe: '安全提醒：插件只在你这台电脑上的 MCPHelm 在跑、对应隧道在连的时候才可用；隧道 ID 等于钥匙，别截图发给别人。想停掉它，到 MCPHelm 隧道板块停掉那条隧道，或者在 ChatGPT 里删掉这个插件。',
    wizTut5Tip: '创建完，插件会出现在插件页的「已安装」里，回到对话就能直接调用你电脑上的能力。ChatGPT 那边要是报连不上，先看 MCPHelm 隧道卡片上的「日志」。',
    gs5T: '创建并启动隧道',
    gs5D: '把两把钥匙填进隧道表单，创建后启动，让本机能力真正在线。',
    gs5S1: '回到「隧道」页，点右上角「新建隧道」。',
    gs5S2: '选择要接入的服务器，粘贴 tunnel_ 隧道 ID。',
    gs5S3: '密钥来源选「密钥保险箱（推荐）」，粘贴 runtime key。',
    gs5S4: '创建后点卡片上的「启动」；状态变成「运行中」就成功了，掉线会自动重连。',
    gs6T: '在 ChatGPT 里用起来',
    gs6D: '最后一步：先打开 ChatGPT 的「开发者模式」，再把隧道加成插件，让它真正被用上。',
    gs6DevT: '重点：先在 ChatGPT 里打开开发者模式',
    gs6DevD: '不打开开发者模式，下面要用的「创建自定义 MCP 服务器」入口根本不会出现在菜单里。路径：ChatGPT 网页端 → 设置 → 连接器 → 高级 → 打开「开发者模式」开关。不同版本的菜单叫法可能略有差异，找「高级 / Advanced」里的开发者模式开关即可。',
    gs6S1: '【必须第一步】打开 ChatGPT 的开发者模式：设置 → 连接器 → 高级 → 开发者模式开关打开。',
    gs6S2: '点下面的按钮打开 ChatGPT，然后点左侧栏的「插件」。',
    gs6S3: '点右上角「添加」→「创建自定义 MCP 服务器」，连接方式选「隧道」、粘贴隧道 ID，身份验证选「无需身份验证」。',
    gs6S4: '添加完成后，在对话里就能直接调用你电脑里的能力了；想确认它在跑，点隧道卡片上的「日志」。',
    gs6B: '打开 ChatGPT',
    guideTipsT: '日常使用，记住三件事',
    tip1T: '关窗不等于断线', tip1D: '点右上角 X 只是收进托盘，隧道继续在线；要彻底关闭，用右下角托盘图标右键，选退出。',
    tip2T: '掉线会自动拉起', tip2D: '守护进程盯着每条隧道，意外断开会自动重连，并在右下角弹通知告诉你原因。',
    tip3T: '出问题先点「体检」', tip3D: '体检自动检查环境、配置、连通性，每条问题都附修复建议，照着做就行。',
    guideFaqT: '常见疑问',
    faqQ1: '装到 C 盘会不会占空间？',
    faqA1: '不会。配置、日志、缓存、临时文件全部保存在「数据目录」里，跟着安装位置走——装在 D 盘就全在 D 盘，C 盘零占用。想换位置：设置 → 数据位置 → 迁移到其他盘。',
    faqQ2: '密钥安全吗？',
    faqA2: '选「密钥保险箱」时，密钥只进 Windows 凭据管理器（和系统保存 Wi-Fi 密码同一个地方），配置文件里一个字符都不留，MCPHelm 也不会把它上传到任何地方。',
    faqQ3: '卸载会删掉我的数据吗？',
    faqA3: '不会。卸载只删除程序本身，配置和日志保留在数据目录中，重装后自动恢复。',
    faqQ4: '下载不了运行环境怎么办？',
    faqA4: '去 tunnel-client 官方仓库手动下载 zip，然后在「设置 → 运行环境 → 导入本地安装包」选择刚下载的文件即可。',
    faqQ5: '能把我现在的 Claude / Cursor 配置搬过来吗？',
    faqA5: '可以。在「服务器」页点「导入已有配置」，MCPHelm 会自动扫描常见位置并列出可导入的服务器。',
    guideLinksT: '官方页面直达',
  },
  en: {
    brandSub: 'Local Tunnel Console',
    tagline: 'Securely connect local AI power to ChatGPT',
    navDashboard: 'Overview', navTunnels: 'Tunnels', navServers: 'Servers', navMarket: 'Marketplace', navLogs: 'Logs', navDoctor: 'Doctor', navSettings: 'Settings',
    stuckT: 'Stuck? FAQ & official links',
    metaDashboardT: 'Overview', metaDashboardS: 'The five-step guide stays on top; live status is below it',
    metaTunnelsT: 'Tunnels', metaTunnelsS: 'Safely expose local MCP servers to ChatGPT',
    metaServersT: 'Servers', metaServersS: 'Manage MCP servers on this machine',
    metaMarketT: 'Marketplace', metaMarketS: 'Install popular open-source MCP servers in one click',
    mkTitle: 'Featured components', mkSub: 'Pick one and hit Install — MCPHelm writes the launch command into your server list, then attach a tunnel to use it',
    mkNote: 'All components come from popular open-source GitHub projects (MIT / Apache-2.0), downloaded on demand rather than pre-bundled, so the installer stays small. After installing, create a tunnel for it on the Tunnels page.',
    mkInstall: 'Install', mkInstalled: 'Installed', mkUninstall: 'Uninstall', mkReinstallTip: 'Installed — attach a tunnel on the Servers page',
    mkCmd: 'Launch command', mkRunner: 'Runner', mkLicense: 'License', mkSource: 'Source',
    mkInstallOk: 'Installed. Attach a tunnel on the Servers page to use it', mkUninstallOk: 'Uninstalled',
    mkUninstallTitle: 'Uninstall component', mkUninstallMsg: 'Uninstall {t}? This removes it from the server list (your tunnels are kept).',
    mkNeedTunnel: 'Installed. One more step: create a tunnel on the Tunnels page and pick this server',
    mkCustom: 'Want something else? Add any MCP command manually on the Servers page',
    /* Marketplace card: ability list + stars (counts refresh online, snapshot is the fallback) */
    mkAbilities: 'What it can do',
    mkStars: '★ {n}',
    mkStarsLive: 'Star count refreshed online just now',
    mkStarsSnapshot: 'Star count from the {d} snapshot (shown when the online refresh fails)',
    metaLogsT: 'Logs', metaLogsS: 'Live output of every tunnel',
    metaDoctorT: 'Doctor', metaDoctorS: 'Check environment and config automatically',
    metaSettingsT: 'Settings', metaSettingsS: 'Preferences, paths, key status and help',
    /* Keys board: the tunnel key and the API key live here, before Servers and Tunnels */
    navKeys: 'Keys',
    metaKeysT: 'Keys', metaKeysS: 'Save the tunnel key and the API key first — new tunnels reuse them automatically',
    keysIntroT: 'Two keys first, then everything else is easy',
    keysIntroD: 'A tunnel needs two things: a tunnel key (Tunnel ID, starting with tunnel_) and an API key (runtime key, starting with sk-). Save them once here and new tunnels pick them up automatically.',
    /* Keys manager: one row per key — state, value, who uses it, actions */
    keysManageT: 'Key manager',
    keysManageD: 'Both stored keys live here: state, where they are kept and which tunnels use them — copy, replace or clear them any time.',
    keysSummary: '{a}/{b} ready',
    keysSaved: 'Saved', keysNotReady: 'Not saved',
    keysStoreKeyring: 'Windows Credential Manager', keysStorePlain: 'local config file (plaintext)',
    keysSavedAt: 'saved {t}', keysUsedBy: 'used by tunnel {n}', keysUnused: 'no tunnel uses it yet — new tunnels pre-fill it',
    keysApiReuse: 'new tunnels reuse it when you pick the key vault and leave the field empty',
    keysTailHint: 'only the last four characters are kept - the full key never shows up in the UI or the logs',
    keysNeedResavePill: 'Re-save needed',
    keysNeedResave: 'This key is no longer in the vault (it may have been cleaned up) - paste it again to restore it.',
  keysEmptyTunnel: 'Not saved yet: click Paste and save, then drop the tunnel_ ID in.',
  keysEmptyApi: 'Not saved yet: click Paste and save, then drop the runtime key in.',
    keysBtnCopy: 'Copy', keysBtnEdit: 'Replace', keysBtnPaste: 'Paste and save',
    keysCopied: 'Copied to clipboard', keysCopyFail: 'Copy failed — select the ID and copy it manually',
    keysClearTunnelAsk: 'After clearing, new tunnels will not pre-fill this tunnel ID (the tunnel on the platform is untouched). You can save it again any time.',
    keysClearKeyAsk: 'After clearing, new tunnels need the runtime key pasted again (existing tunnels keep working). You can save it again any time.',
    keysCard1T: '1. Tunnel key (Tunnel ID)', keysCard1D: 'The ID you get after creating a tunnel on the OpenAI platform.',
    keysCard1B1: 'Open the OpenAI platform and go to the Tunnels page (sign in with your own account).',
    keysCard1B2: 'Create a tunnel — any name works, e.g. my-first-tunnel — then copy its Tunnel ID.',
    keysCard1B3: 'Back on this page, click Paste and save on the tunnel key row in the key manager.',
    keysCard1B4: 'Paste the tunnel_ ID into the field and click Save tunnel key; the state turns into Saved.',
    keysField1: 'Tunnel key (Tunnel ID)', keysPh1: 'tunnel_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', keysSave1: 'Save tunnel key',
    keysSaved1: 'Tunnel key saved',
    keysCard2T: '2. API key (runtime key)', keysCard2D: 'The key your tunnel uses to reach the OpenAI platform; create it on the API keys page.',
    keysCard2B1: 'Open the API keys page on the OpenAI platform.',
    keysCard2B2: 'Create a new secret key and copy it right away (it is shown in full only once).',
    keysCard2B3: 'Back on this page, click Paste and save on the API key row and pick the key vault (recommended: it keeps the key in Windows Credential Manager, no plaintext on disk).',
    keysCard2B4: 'Paste the key into the field and click Save API key; the state turns into Saved.',
    keysField2: 'API key (runtime key)', keysSave2: 'Save API key',
    keysSaved2: 'API key saved',
    keysStoreLabel: 'Storage',
    keysClearKey: 'Clear API key', keysClearTunnel: 'Clear tunnel key',
    keysClearedTunnel: 'Tunnel key cleared', keysClearedKey: 'Stored API key cleared',
    keysNeedValue: 'Paste something before saving',
    keysGuidesT: 'Where do these two keys come from?',
    keysGuidesS: 'Follow the steps below to grab each key on the OpenAI platform, then save it here.',
    keysOpenTunnels: 'Open tunnel manager', keysOpenApiKeys: 'Open API keys page',
    keysKeyringOff: 'The key vault is unavailable on this machine, so use Paste directly — the key will be written into the local config file.',
    keysInlineHint: 'This key is written into the local config file in plaintext — use it only when the vault is unavailable.',
    refresh: 'Refresh', refreshing: 'Refreshing…', refreshed: 'Refreshed', refreshHint: 'Re-sync latest data', newTunnel: 'New Tunnel', downloadRuntime: 'Download Runtime',
    close: 'Close', cancel: 'Cancel', confirm: 'OK', delete: 'Delete', save: 'Save',
    opFailed: 'Operation failed', deleteTunnel: 'Delete tunnel',
    deleteTunnelMsg: 'Delete tunnel <strong>{n}</strong>?<br>This only removes the entry in MCPHelm; the tunnel on the OpenAI platform is untouched.',
    tunnelDeleted: 'Tunnel {n} deleted', serverDeleted: 'Server {n} deleted',
    tunnelStarted: 'Tunnel {n} started', tunnelStopped: 'Tunnel {n} stopped', tunnelRestarted: 'Tunnel {n} restarted',
    serverAdded: 'Server {n} added', saved: '{n} saved',
    tunnelCreated: 'Tunnel {n} created — press Start to go live',
    overwriteSave: 'Overwrite with this config', overwriteHint: 'A tunnel named {n} already exists. Click this button again to overwrite it with what you just entered.',
    runtimeReadyToast: 'Runtime is ready',
    downloadFailed: 'Download failed: ', importedRuntime: 'Runtime imported',
    dlStage_prepare: 'Preparing: checking network and download URL...',
    dlStage_download: 'Downloading the runtime...',
    dlStage_verify: 'Download finished, verifying the file...',
    dlStage_unpack: 'Unpacking the archive...',
    dlStage_install: 'Writing files...',
    dlStage_done: 'Installed',
    dlStage_failed: 'Install failed',
    noZipPath: 'Please enter the zip path', fillName: 'Please enter a name', fillCommand: 'Please enter the launch command',
    fillUrl: 'Please enter the service URL', fillEnvName: 'Please enter the env var name', fillKey: 'Please paste the runtime key',
    fillTunnelId: 'Please enter the tunnel ID', badPort: 'Port must be an integer between 1 and 65535',
    offline: 'Cannot reach the local service: ',
    envMissing: 'Runtime missing', envOk: 'Environment OK', envBadCfg: '{n} config issue(s)',
    statTunnels: 'Tunnels', statRunning: 'Running', statHealthy: 'Healthy', statAttention: 'Attention',
    heroTitle: 'Connect your local AI power to ChatGPT in 5 steps',
    heroP: 'MCPHelm bridges MCP servers running on this machine to ChatGPT through the official OpenAI secure tunnel. No commands to remember — five real actions below, the exact same flow as the Getting-started guide.',
    heroProgress: '{d} / {t} steps done',
    heroContinue: 'Continue step {n}',
    redownload: 'Re-download', oneClickDownload: 'Download',
    addAnother: 'Add another', addServer: 'Add server',
    manageTunnels: 'Manage tunnels', createTunnel: 'Create tunnel',
    attentionLine: '<strong>{n} thing(s) need attention.</strong> Open <a href="#" data-goto="doctor">Doctor</a> for details and fixes.',
    dashTunnels: 'Your tunnels', dashTunnelsSub: 'Use the buttons on each card to start, stop or view logs',
    stRunningOk: 'Healthy', stHealthBad: 'Local self-check failing', stRunning: 'Running', stError: 'Error',
    stHealthTipOk: 'Local health endpoints passed (healthz and readyz both returned 200). The tunnel process and the ChatGPT side are both fine.',
    stHealthTipBad: 'Local health endpoints failed: healthz={h}, readyz={r}{e}. This is a self-check on this machine and does not mean ChatGPT is disconnected — the tunnel process is still running. Try Restart, or open Logs.',
    stStale: 'Process exited', stStopped: 'Stopped',
    stStaleTip: 'This tunnel process has already exited (the panel still shows the last run record). See the reason below, apply the fix, then press Start.',
    /* 0.1.10: when a tunnel cannot come up, the card shows why and how to fix it */
    errFix: 'How to fix',
    tunErrWhy: 'This tunnel could not start',
    mkRunnerMissing: 'Needs {r}',
    mkRunnerMissingTip: 'This MCP component is launched with {r}, which is not available on this machine yet.',
    keyReady: 'Key ready', keyMissing: 'Key missing', keyFrom: 'Key source: ',
    keyMissingTip: 'The runtime key is not in place yet: click Edit to enter it again, or switch the key source to env var / direct entry.',
    stop: 'Stop', restart: 'Restart', start: 'Start', logs: 'Logs', edit: 'Edit',
    tunnelEmptyH: 'No tunnels yet',
    tunnelEmptyP: 'A tunnel is the bridge between a local server and ChatGPT. Add a server first, then create your first tunnel.',
    createFirstTunnel: 'Create my first tunnel',
    tunnelEmptyKeys: 'Keys not saved yet? Store them in the Keys panel first — new tunnels pick them up automatically.',
    tunnelEmptyKeysBtn: 'Save them in Keys first',
    serverEmptyH: 'No MCP servers registered',
    serverEmptyP: 'Register the local MCP servers you want ChatGPT to use — either a launch command (stdio) or a local HTTP address.',
    fromTemplate: 'From a template', importConfig: 'Import existing config', fromMarket: 'From the marketplace',
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

    /* Support the author (star / coffee): entirely optional, never gates any feature */
    supEntryStar: 'Star on GitHub',
    supEntryCoffee: 'Buy me a coffee',
    supTitle: 'Support MCPHelm',
    supSub: 'Free and open source, with every feature unlocked',
    supWelcomeT: 'Welcome to MCPHelm',
    supWelcomeS: 'Free and open source: no license key, no trial, everything works out of the box',
    supStarBlockT: 'Star the project',
    supStarWhy1: 'Completely free: no license key, no trial period, and a star unlocks nothing.',
    supStarWhy2: 'A star is the first signal people use to judge whether a project is worth trying.',
    supStarWhy3: 'It changes nothing about your data or config, and you can unstar anytime.',
    supStarBtn: 'Open GitHub and star',
    supStarFine: 'This opens the project page in your browser; click the ★ button in the top-right corner. GitHub does not let apps star on your behalf, so that last click has to be yours.',
    supCoffeeT: 'Buy me a coffee',
    supCoffeeLead: 'If it saved you from wrestling with command lines, you can scan the Alipay code on the right. Even a couple of yuan is real encouragement.',
    supCoffeeFine: 'Entirely optional: every feature stays available whether you donate or not.',
    supQrAlt: 'Alipay donation QR code',
    supQrCap: 'Scan with Alipay',
    supLater: 'Maybe later',
    supHintClose: 'Do not show again',
    supStarOpened: 'Project page opened — just click the ★ Star button',
    supNoStar: 'Project URL is not configured yet',
    supHintT: 'All five steps are done',
    supHintD: 'If MCPHelm has been useful, a star on GitHub or a coffee goes a long way.',
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
    fTunnelIdPrefill: 'Pre-filled from the Keys panel — no need to paste it again',
    fKey: 'Key (runtime key)',
    keyModeEnv: 'Env variable', keyModeKeyring: 'Key vault (recommended)', keyModeInline: 'Paste directly',
    fKeyEnv: 'Env variable name', fKeyEnvHint: 'The key never touches disk; it is read from this variable at start',
    fKeyKeyringHint: 'The key goes only into Windows Credential Manager — nothing is written to any config file',
    fKeyReuseHint: 'Already saved in the Keys panel — leave this empty to reuse it',
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

    /* In-app guide */
    gDone: 'Done', gTodo: 'To do',
    wizStepOf: 'Step {i} of {n}',
    wizPrev: 'Back', wizNext: 'Next',
    wizAllDoneT: 'All five steps are done',
    wizAllDoneD: 'The guide stays here for good: click the dots above to revisit any step — every button is still there. Live status is below.',
    wizFinish: 'Go to overview', wizHelpT: 'FAQ · Official links', wizOpenHere: 'Continue this step here',
    gs2T: 'Download the runtime (the engine)',
    gs2D: 'Tunnels are driven by the official OpenAI tunnel-client. Click the button below: MCPHelm downloads it and verifies its integrity automatically — just wait for the progress to finish.',
    gs2S1: 'Click the button: it downloads and verifies on its own, then wait for the progress bar.',
    gs2S2: 'Repo unreachable? Download the zip from the official repo, then use Settings → Runtime → Import local package.',
    gs3T: 'Add an MCP server (what you expose)',
    gs3D: 'Tell MCPHelm which local service should reach ChatGPT. Pick any of the three ways below — one server is enough to complete this step.',
    gs3S1: 'Custom: enter one launch command (command type) or a local URL (HTTP type).',
    gs3S2: 'From a template: common servers come with parameters prefilled — pick one and finish the blanks.',
    gs3S3: 'From the marketplace: one-click installs of popular open-source MCP servers, launch command included.',
    gs3S4: 'On Claude / Cursor / VS Code already? Import existing config in one click.',
    gs4T: 'Get the two keys from the OpenAI platform',
    gs4D: 'Two things are needed here: the tunnel_ ID and an sk- runtime key. Both stay only on your own machine — save them once in the Keys panel on the left and later tunnels reuse them automatically.',
    gs4S1: 'Open Tunnels, sign in, create a tunnel and copy its tunnel_ ID.',
    gs4S2: 'Open API keys and create a runtime key (shown in full once — copy it before closing the page).',
    gs4S3: 'Save both into the Keys panel on the left (click "Save them in Keys" below) — every new tunnel can reuse them afterwards.',
    gs4S4: 'Once they are saved, click "I already have both keys" to mark this step, then continue.',
    gs4B1: 'Open Tunnels', gs4B2: 'Open API keys',
    gs4BKeys: 'Save them in Keys', gs4BKeysTip: 'Store the tunnel ID and the runtime key once in the Keys panel: new tunnels pre-fill the ID and reuse the key when you pick the key vault.',
    gs4B3: 'I already have both keys', gs4B3On: 'Marked as obtained (click to undo)',
    gs4B3Note: 'Keys in hand. Click Next and paste the tunnel ID and the runtime key into the tunnel form.',
    /* Step 3 illustrated tutorial: real screenshots with numbered boxes */
    wizTutT: 'Illustrated guide: create a tunnel · get a runtime key',
    wizTutD: 'These four screenshots break down where to create a tunnel, what to fill in the dialog, and where to create the runtime key. The red numbers are the order of clicks and match the notes under each image. Account, org and key values in the screenshots are redacted.',
    wizTutFigN: 'Fig. {n}', wizTutZoom: 'Click to enlarge',
    wizTutF1T: 'The entry point is on this card (three buttons)',
    wizTutF1D: '(1) Click "Open Tunnels" to open the Tunnels page on the OpenAI platform; (2) click "Open API keys" for the API keys page (both ask you to sign in first); (3) once both keys are copied, come back to this card and click "I already have both keys".',
    wizTutF2T: 'Create the tunnel on the Tunnels page',
    wizTutF2D: '(1) Click the black "Create tunnel" button at the top right; (2) once the dialog is filled in (see Fig. 3) the new tunnel shows up as the first row under the name you gave it; (3) the ID column holds the tunnel ID - the long tunnel_ string; (4) click the copy icon next to it to copy the whole value instead of selecting it by hand.',
    wizTutF3T: 'The four fields in the Create tunnel dialog',
    wizTutF3D: '(1) Name: any name you will recognise, e.g. "my browser helper"; (2) Description: one sentence, required; (3) Organizations: pick your own org (redacted in the screenshot); (4) ChatGPT workspaces: pick the workspace to attach it to. Then click "Create" at the bottom right.',
    wizTutF4T: 'Create the runtime key on the API keys page',
    wizTutF4D: '(1) Click "Create new secret key" at the top right; (2) name it in the dialog and create it - the new key appears as the first row; (3) the full key (starting with sk-) is shown only once in that dialog, so copy it before closing. The list only shows the first and last few characters, so closing it means creating a new one.',
    wizTutSafe: 'Security note: the runtime key is the door key to this tunnel - anyone holding it can connect to your account. It stays on your own machine, so never post it or paste it into a chat.',
    wizTutTip: 'Once both are copied, come back to this card, click "I already have both keys", then click Next and paste them into the tunnel form.',
    /* Step 5 illustrated tutorial: adding the tunnel to the ChatGPT web app */
    wizTut5T: 'Illustrated guide: wire the tunnel into the ChatGPT web app',
    wizTut5D: 'Do one thing before anything else: turn on Developer mode in ChatGPT (Settings → Connectors → Advanced → Developer mode). Without it the Create custom MCP server entry never appears in the menu. After that, these two screenshots are the real ChatGPT web flow: open Plugins from the left rail, pick Create custom MCP server from the Add menu at the top right, then in the dialog switch Connection to Tunnel, paste the tunnel ID and pick No authentication. The red numbers on the screenshots are the order of clicks.',
    wizTut5F1T: 'Open Plugins from the left rail, then Add at the top right',
    wizTut5F1D: '(1) In the ChatGPT left rail click Plugins (right under Library) to open the plugins page; (2) click the black Add button at the top right and choose Create custom MCP server - this is where ChatGPT claims the tunnel you already built in MCPHelm.',
    wizTut5F2T: 'Fill in these two boxed spots in the dialog',
    wizTut5F2D: '(1) Switch Connection to Tunnel - the field below turns into a tunnel placeholder, so paste the tunnel ID you copied from the MCPHelm Tunnels view (the tunnel_ string); (2) in the Authentication dropdown pick No authentication (the tunnel ID is already the key, no extra OAuth layer is needed here). Once those two boxed spots are filled in, tick "I understand and want to continue" - the bottom-right button stays greyed out until you do - and click Create as plugin. Name and description above can be anything you recognise.',
    wizTut5Safe: 'Security note: the plugin only works while MCPHelm is running on this machine and that tunnel is connected; the tunnel ID is the key, so never screenshot it to others. To stop it, stop the tunnel in the MCPHelm Tunnels view or remove the plugin in ChatGPT.',
    wizTut5Tip: 'Once created, the plugin shows up under Installed on the plugins page and your chats can call the local capability. If ChatGPT reports it cannot connect, check Logs on the tunnel card in MCPHelm first.',
    gs5T: 'Create and start the tunnel',
    gs5D: 'Fill the tunnel form with the two keys, create it and start it to bring the local capability online.',
    gs5S1: 'Go to the Tunnels page and click New tunnel.',
    gs5S2: 'Pick the server you just added and paste the tunnel_ ID.',
    gs5S3: 'Keep the key source as Key vault (recommended) and paste the runtime key.',
    gs5S4: 'After creating it, press Start on the card — state Running means you are online (drops re-raise automatically).',
    gs6T: 'Use it inside ChatGPT',
    gs6D: 'Last step: turn on Developer mode in ChatGPT first, then add the tunnel as a plugin so it can actually be used.',
    gs6DevT: 'Important: turn on Developer mode in ChatGPT first',
    gs6DevD: 'Without Developer mode the Create custom MCP server entry never appears in the menu. Path: ChatGPT web → Settings → Connectors → Advanced → turn on Developer mode. Menu wording differs slightly between versions — look for the developer-mode switch under Advanced.',
    gs6S1: '[Must do first] Turn on Developer mode in ChatGPT: Settings → Connectors → Advanced → Developer mode.',
    gs6S2: 'Click the button below to open ChatGPT, then pick Plugins in the left rail.',
    gs6S3: 'Click Add at the top right → Create custom MCP server, choose Tunnel, paste the tunnel ID and pick No authentication.',
    gs6S4: 'Done — your chats can now call the local capability. To confirm it is running, click Logs on the tunnel card.',
    gs6B: 'Open ChatGPT',
    guideTipsT: 'Three things to remember day to day',
    tip1T: 'Closing the window is not disconnecting', tip1D: 'The X button only hides it to the tray; the tunnel stays online. To quit fully, right-click the tray icon and choose Exit.',
    tip2T: 'Drops are re-raised for you', tip2D: 'A supervisor watches every tunnel, re-raises it after an unexpected drop and tells you in a toast.',
    tip3T: 'Run Doctor when something feels off', tip3D: 'Doctor checks environment, config and connectivity, and every finding comes with a suggested fix.',
    guideFaqT: 'FAQ',
    faqQ1: 'Will installing on C: eat up space?',
    faqA1: 'No. Config, logs, caches and temp files all live in the data folder next to the install — install on D: and nothing lands on C:. To move later: Settings → Data location → Migrate to another drive.',
    faqQ2: 'Is my key safe?',
    faqA2: 'With the key vault, the key goes only into Windows Credential Manager (the same place that stores Wi-Fi passwords). Nothing is written into config files and nothing is uploaded.',
    faqQ3: 'Will uninstalling delete my data?',
    faqA3: 'No. Uninstall removes the program only; config and logs stay in the data folder and come back after a reinstall.',
    faqQ4: 'The runtime download fails — what now?',
    faqA4: 'Download the zip manually from the tunnel-client repo, then use Settings → Runtime → Import local package.',
    faqQ5: 'Can I bring over my Claude / Cursor config?',
    faqA5: 'Yes. Open the Servers page and click Import existing config — MCPHelm scans the usual locations and lists what it finds.',
    guideLinksT: 'Official pages',
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
    /* message 通常比 error 更完整（0.1.10 起失败响应会把修复建议拼进 message） */
    const msg = data && (data.message || data.error) ? (data.message || data.error) : ('请求失败 (' + res.status + ')');
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
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M9 7h7M9 11h5"/></svg>',
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
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 14.5v2"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14L21 3"/></svg>',
  folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
  prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  terminal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17l6-6-6-6M12 19h8"/></svg>',
  heartbeat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l2-7 4 14 2-7h6"/></svg>',
  market: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7l2-3h12l2 3"/><path d="M4 7h16v3a2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1-5 0z"/><path d="M5 12.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7.5"/><path d="M9.5 21v-5h5v5"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.6l2.95 5.98 6.6.96-4.78 4.66 1.13 6.57L12 17.67l-5.9 3.1 1.13-6.57L2.45 9.54l6.6-.96z"/></svg>',
  coffee: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v6a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5z"/><path d="M6 2v2M10 2v2M14 2v2"/></svg>',
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
  /* minimizeToTray 默认 true：关窗口最小化到托盘、隧道继续在线，
     与 desktop/main.cjs 的默认行为保持一致（以前这里是 false，勾选框与真实行为相反）。 */
  ui: { language: 'zh', minimizeToTray: true, autoLaunch: false },
  desktop: false,
  keyringSupported: false,
  guideIdx: 0,
  guideAutoAdvance: true, // 首次进入指南时允许自动推进到第一个未完成步骤
  openDetails: {},        // 记住展开的折叠区（常见问题等），后台刷新时不收起
  tutClosed: {},          // 图文教程（第三步 / 第五步）默认铺开，用户收起过就记住
  prefsDraft: null,       // 设置页未保存的偏好草稿，刷新时不覆盖用户的选择
  lastFP: null,           // 上一次渲染对应的数据指纹，数据没变就不重建界面
  supportWelcomeChecked: false, // 欢迎弹窗（Star / 赞助）本轮只判定一次，避免每次轮询重弹
};

function viewMeta(v) {
  const map = {
    dashboard: ['metaDashboardT', 'metaDashboardS'],
    keys: ['metaKeysT', 'metaKeysS'],
    tunnels: ['metaTunnelsT', 'metaTunnelsS'],
    servers: ['metaServersT', 'metaServersS'],
    market: ['metaMarketT', 'metaMarketS'],
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

/* ---------------- 支持作者（Star / 请我喝咖啡） ---------------- */
/* 三条底线：
   1) 不锁功能——不点 Star、不打赏，全部功能照旧，永远不会因为这件事设门槛；
   2) 不代点 Star——GitHub 禁止自动化刷星，也禁止「给奖励换 Star」，所以软件只负责把仓库页打开，
      最后那一下必须用户自己在浏览器里点；
   3) 不反复打扰——欢迎弹窗只弹一次，概览里的提示条关掉就永久不再出现。 */
function supportInfo() {
  const b = (app.state && app.state.brand) || {};
  const sup = b.support || {};
  let qr = '';
  if (sup.alipayQr) {
    try { qr = new URL(sup.alipayQr, location.href).href; } catch (e) { qr = sup.alipayQr; }
  }
  return { starUrl: b.starUrl || b.repoUrl || '', qr: qr, link: sup.link || '' };
}

function openStarPage() {
  const info = supportInfo();
  if (!info.starUrl) { toast(t('supNoStar'), 'info'); return; }
  window.open(info.starUrl, '_blank', 'noopener');
  toast(t('supStarOpened'), 'ok');
}

function showSupportModal(opts) {
  const o = opts || {};
  const info = supportInfo();
  let left = '<div class="sup-col">';
  if (info.starUrl) {
    left += '<div class="sup-block">' +
      '<div class="sup-block-h"><span class="ico sup-ico-star">' + icon('star') + '</span>' + esc(t('supStarBlockT')) + '</div>' +
      '<ul class="sup-list">' +
        '<li>' + esc(t('supStarWhy1')) + '</li>' +
        '<li>' + esc(t('supStarWhy2')) + '</li>' +
        '<li>' + esc(t('supStarWhy3')) + '</li>' +
      '</ul>' +
      '<button class="btn accent" type="button" data-support="star"><span class="ico">' + icon('star') + '</span>' + esc(t('supStarBtn')) + '</button>' +
      '<p class="sup-fine">' + esc(t('supStarFine')) + '</p>' +
    '</div>';
  }
  if (info.qr) {
    left += '<div class="sup-block">' +
      '<div class="sup-block-h"><span class="ico sup-ico-coffee">' + icon('coffee') + '</span>' + esc(t('supCoffeeT')) + '</div>' +
      '<p class="sup-lead">' + esc(t('supCoffeeLead')) + '</p>' +
      '<p class="sup-fine">' + esc(t('supCoffeeFine')) + '</p>' +
    '</div>';
  }
  left += '</div>';
  const right = info.qr
    ? '<div class="sup-qr"><img src="' + esc(info.qr) + '" alt="' + esc(t('supQrAlt')) + '" title="' + esc(t('supQrCap')) + '">' +
      '<div class="sup-qr-cap">' + esc(t('supQrCap')) + '</div></div>'
    : '';
  const actions = o.welcome
    ? [
        { label: t('supStarBtn'), kind: 'accent', icon: 'star', onClick: () => { openStarPage(); } },
        { label: t('supLater'), kind: 'ghost', close: true },
      ]
    : [{ label: t('close'), kind: 'ghost', close: true }];
  openModal({
    title: o.welcome ? t('supWelcomeT') : t('supTitle'),
    sub: o.welcome ? t('supWelcomeS') : t('supSub'),
    wide: true,
    body: '<div class="sup-grid' + (right ? '' : ' no-qr') + '">' + left + right + '</div>',
    actions: actions,
  });
}

/* 欢迎弹窗只弹一次：「已看过」写进配置，换端口、重启、重开面板都不再打扰 */
function markSupportSeen() {
  if (app.state && app.state.ui) app.state.ui.supportSeen = true;
  api('/api/ui', { method: 'POST', body: { supportSeen: true } }).catch(() => { /* 落库失败最多下次再弹一次，不影响使用 */ });
}

function maybeShowSupportWelcome() {
  const s = app.state;
  if (!s || app.supportWelcomeChecked) return;
  const info = supportInfo();
  if (!info.starUrl && !info.qr) { app.supportWelcomeChecked = true; return; }
  if (s.ui && s.ui.supportSeen) { app.supportWelcomeChecked = true; return; }
  const root = $('#modalRoot');
  if (root && root.innerHTML.trim() !== '') return; // 用户正开在别的弹窗里，等下一次轮询
  app.supportWelcomeChecked = true;
  markSupportSeen();
  showSupportModal({ welcome: true });
}

/* 概览页：五步都跑通后出现一条柔和的支持提示，点「不再显示」就永久消失 */
function supportHintHtml() {
  const info = supportInfo();
  if (!info.starUrl && !info.qr) return '';
  let h = '<div class="support-hint"><span class="ico sup-ico-star">' + icon('star') + '</span>';
  h += '<div class="sh-text"><strong>' + esc(t('supHintT')) + '</strong><span>' + esc(t('supHintD')) + '</span></div>';
  h += '<div class="sh-actions">';
  if (info.starUrl) h += '<button class="btn accent small" type="button" data-support="star"><span class="ico">' + icon('star') + '</span>' + esc(t('supStarBtn')) + '</button>';
  if (info.qr) h += '<button class="btn soft small" type="button" data-support="coffee"><span class="ico">' + icon('coffee') + '</span>' + esc(t('supCoffeeT')) + '</button>';
  h += '<button class="btn ghost small" type="button" data-support="dismiss">' + esc(t('supHintClose')) + '</button>';
  h += '</div></div>';
  return h;
}

function dismissSupportHint() {
  if (app.state && app.state.ui) app.state.ui.supportHintClosed = true;
  api('/api/ui', { method: 'POST', body: { supportHintClosed: true } }).catch(() => {});
  renderView();
}

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
/* 数据指纹：心跳类字段每次都变，排除掉才能判断“界面内容是否真的变化” */
function stateFP(s) {
  try {
    return JSON.stringify(s, (k, v) => (k === 'uptimeMs' || k === 'startedAt' ? undefined : v));
  } catch (e) {
    return null;
  }
}

/* 折叠区（常见问题等）展开状态：渲染时按 data-dk 还原 */
function detailsOpenAttr(k) {
  return app.openDetails[k] ? ' open' : '';
}

async function refreshState(silent, force) {
  try {
    app.state = await api('/api/state', { method: 'GET' });
    syncPrefsFromState();
    renderShell();
    const fp = stateFP(app.state);
    if (force || fp !== app.lastFP) {
      app.lastFP = fp;
      renderView();
    }
    schedulePoll();
    const rb = $('#btnRefresh');
    if (rb) rb.title = t('refreshHint') + ' · ' + new Date().toLocaleTimeString();
    maybeShowSupportWelcome();
    return true;
  } catch (e) {
    if (!silent) toast(t('offline') + e.message, 'err');
    return false;
  }
}

/* 手动刷新：按钮给出明确的「进行中 → 已完成」反馈 */
async function refreshNow() {
  const btn = $('#btnRefresh');
  if (!btn || btn.disabled) return;
  btn.disabled = true;
  btn.classList.add('loading');
  btn.innerHTML = '<span class="ico spin">' + icon('refresh') + '</span>' + esc(t('refreshing'));
  const ok = await refreshState(false, true);
  btn.disabled = false;
  btn.classList.remove('loading');
  if (ok) {
    btn.classList.add('done');
    btn.innerHTML = '<span class="ico">' + icon('check') + '</span>' + esc(t('refreshed'));
    setTimeout(() => {
      btn.classList.remove('done');
      btn.innerHTML = '<span class="ico">' + icon('refresh') + '</span>' + esc(t('refresh'));
    }, 1400);
  } else {
    btn.innerHTML = '<span class="ico">' + icon('refresh') + '</span>' + esc(t('refresh'));
  }
}

function syncPrefsFromState() {
  const s = app.state;
  if (!s) return;
  const ui = s.ui || {};
  const lang = ui.language === 'en' ? 'en' : 'zh';
  const changed = lang !== currentLang;
  app.ui = { language: lang, minimizeToTray: ui.minimizeToTray !== false, autoLaunch: ui.autoLaunch === true };
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
  const navLabels = { dashboard: 'navDashboard', keys: 'navKeys', servers: 'navServers', market: 'navMarket', tunnels: 'navTunnels', logs: 'navLogs', doctor: 'navDoctor', settings: 'navSettings' };
  $$('#nav .nav-item').forEach((b) => {
    const lbl = $('.nav-label', b);
    if (lbl && navLabels[b.dataset.view]) lbl.textContent = t(navLabels[b.dataset.view]);
  });
  const rb = $('#btnRefresh');
  if (rb) {
    rb.innerHTML = '<span class="ico">' + icon('refresh') + '</span>' + esc(t('refresh'));
    rb.title = t('refreshHint');
  }
  const meta = viewMeta(app.view);
  $('#pageTitle').textContent = meta.title;
  $('#pageSub').textContent = meta.sub;
}

function schedulePoll() {
  clearTimeout(app.pollTimer);
  if (document.hidden) return;
  const anyRunning = app.state && app.state.tunnels.some((t) => t.status.state === 'running');
  const jobRunning = app.state && app.state.runtimeJob && app.state.runtimeJob.running;
  app.pollTimer = setTimeout(() => refreshState(true), (anyRunning || jobRunning) ? 2500 : 8000);
}

/* ---------------- 外壳 ---------------- */
function renderShell() {
  const s = app.state;
  if (!s) return;
  $('#versionText').textContent = s.brand.name + ' v' + s.brand.version;
  // 侧边栏常驻支持入口：没配 Star 地址 / 收款码时整块隐藏，不留死链
  const seWrap = $('#supportEntry');
  if (seWrap) {
    const info = supportInfo();
    const seStar = $('#seStarLabel'), seCoffee = $('#seCoffeeLabel');
    if (seStar) seStar.textContent = t('supEntryStar');
    if (seCoffee) seCoffee.textContent = t('supEntryCoffee');
    const starBtn = $('#supportEntry [data-support="star"]');
    const coffeeBtn = $('#supportEntry [data-support="coffee"]');
    if (starBtn) starBtn.classList.toggle('hidden', !info.starUrl);
    if (coffeeBtn) coffeeBtn.classList.toggle('hidden', !info.qr);
    seWrap.classList.toggle('hidden', !info.starUrl && !info.qr);
  }
  // 环境状态
  const envDot = $('#envDot'), envText = $('#envText');
  const errCount = (s.configIssues || []).filter((i) => i.level === 'error').length;
  if (!s.runtime.found) { envDot.className = 'dot dot-warn'; envText.textContent = t('envMissing'); }
  else if (errCount > 0) { envDot.className = 'dot dot-err'; envText.textContent = t('envBadCfg', { n: errCount }); }
  else { envDot.className = 'dot dot-ok'; envText.textContent = t('envOk'); }
  // 导航角标
  const nbT = $('#navBadgeTunnels'), nbS = $('#navBadgeServers'), nbD = $('#navBadgeDoctor'), nbK = $('#navBadgeKeys');
  /* 密钥角标：两把钥匙缺几把就显示几，都备齐了角标消失 */
  const keysState = s.keys || {};
  const keysMissing = (keysState.tunnelId ? 0 : 1) + (keysState.apiKeyReady ? 0 : 1);
  if (nbK) { nbK.textContent = keysMissing; nbK.classList.toggle('hidden', keysMissing === 0); }
  nbT.textContent = s.counts.running + '/' + s.counts.tunnels;
  nbT.classList.toggle('hidden', s.counts.tunnels === 0);
  nbS.textContent = s.counts.servers;
  nbS.classList.toggle('hidden', s.counts.servers === 0);
  const warnCount = (s.configIssues || []).length;
  nbD.textContent = warnCount;
  nbD.classList.toggle('hidden', warnCount === 0);
}

function setView(v) {
  app.view = v;
  $$('#nav .nav-item').forEach((b) => b.classList.toggle('active', b.dataset.view === v));
  const meta = viewMeta(v);
  $('#pageTitle').textContent = meta.title;
  $('#pageSub').textContent = meta.sub;
  clearInterval(app.logTimer);
  renderView();
  $('#content').scrollTop = 0;
}

function renderView() {
  const s = app.state;
  if (!s) return;
  const c = $('#content');
  const keepScroll = c.scrollTop; // 刷新时保持用户当前的滚动位置
  if (app.view === 'dashboard') renderDashboard(c, s);
  else if (app.view === 'keys') renderKeys(c, s);
  else if (app.view === 'tunnels') renderTunnels(c, s);
  else if (app.view === 'servers') renderServers(c, s);
  else if (app.view === 'market') renderMarket(c, s);
  else if (app.view === 'logs') renderLogs(c, s);
  else if (app.view === 'doctor') renderDoctor(c, s);
  else if (app.view === 'settings') renderSettings(c, s);
  if (c.scrollTop !== keepScroll) c.scrollTop = keepScroll;
}


/* ---------------- 上手流程（概览与新手指南共用的一套五步） ---------------- */
/* 第三步「拿到两把钥匙」：钥匙有没有到手只有用户自己知道，所以除了「表单里已就绪」，
   再给一个手动确认开关；否则用户拿到钥匙、还没填回表单时这一步永远不绿。 */
const KEYS_FLAG = 'mcphelm.keysDone';
function keysFlagOn() {
  try { return localStorage.getItem(KEYS_FLAG) === '1'; } catch (e) { return false; }
}
function toggleKeysFlag() {
  const on = keysFlagOn();
  try { localStorage.setItem(KEYS_FLAG, on ? '0' : '1'); } catch (e) { /* 隐私模式下写不进去也不影响使用 */ }
  app.guideAutoAdvance = false; // 手动标记之后不要再被自动跳步覆盖掉
  renderView();
}

function setupSteps(s) {
  const docs = s.docs || {};
  const hasKey = (s.tunnels || []).some((x) => x.key && x.key.ready);
  const keysDone = keysFlagOn();
  /* 「密钥」板块里两把钥匙都存好了，第三步就是真的做完了，不用再靠手动标记 */
  const draft = s.keys || {};
  const draftKeysReady = !!(draft.tunnelId && draft.apiKeyReady);
  return [
    {
      name: t('gs2T'), desc: t('gs2D'), done: !!s.runtime.found,
      details: [t('gs2S1'), t('gs2S2')],
      actions: [{ label: s.runtime.found ? t('redownload') : t('oneClickDownload'), kind: 'accent', icon: 'download', fn: () => showRuntimeModal() }],
    },
    {
      name: t('gs3T'), desc: t('gs3D'), done: s.counts.servers > 0,
      details: [t('gs3S1'), t('gs3S2'), t('gs3S3'), t('gs3S4')],
      actions: [
        { label: s.counts.servers > 0 ? t('addAnother') : t('addServer'), kind: 'accent', icon: 'plus', fn: () => showServerModal(null) },
        { label: t('fromTemplate'), kind: 'accent', icon: 'servers', fn: () => showTemplateModal() },
        { label: t('fromMarket'), kind: 'accent', icon: 'market', fn: () => setView('market') },
      ],
    },
    {
      name: t('gs4T'), desc: t('gs4D'), done: hasKey || keysDone || draftKeysReady,
      details: [t('gs4S1'), t('gs4S2'), t('gs4S3'), t('gs4S4')],
      note: draftKeysReady ? t('gs4BKeysTip') : (keysDone && !hasKey ? t('gs4B3Note') : ''),
      actions: [
        { label: t('gs4B1'), kind: 'accent', icon: 'ext', href: docs.platformTunnels },
        { label: t('gs4B2'), kind: 'accent', icon: 'ext', href: docs.platformApiKeys },
        { label: t('gs4BKeys'), kind: draftKeysReady ? 'soft' : 'accent', icon: 'key', fn: () => setView('keys') },
        { label: keysDone ? t('gs4B3On') : t('gs4B3'), kind: keysDone ? 'soft' : 'accent', icon: 'check', fn: () => toggleKeysFlag() },
      ],
    },
    {
      name: t('gs5T'), desc: t('gs5D'), done: s.counts.tunnels > 0,
      details: [t('gs5S1'), t('gs5S2'), t('gs5S3'), t('gs5S4')],
      actions: [{ label: s.counts.tunnels > 0 ? t('manageTunnels') : t('createTunnel'), kind: 'accent', icon: s.counts.tunnels > 0 ? undefined : 'plus', fn: () => (s.counts.tunnels > 0 ? setView('tunnels') : showTunnelModal(null)) }],
    },
    {
      name: t('gs6T'), desc: t('gs6D'), done: s.counts.running > 0,
      details: [t('gs6S1'), t('gs6S2'), t('gs6S3'), t('gs6S4')],
      actions: [{ label: t('gs6B'), kind: 'accent', icon: 'ext', href: docs.chatgptConnectors }],
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

  const steps = setupSteps(s);
  const doneCount = steps.filter((x) => x.done).length;
  const allDone = doneCount === steps.length;
  /* 五步向导常驻在概览顶部：配完也不消失，随时能翻回去看每一步 */
  if (allDone) {
    // 全部完成后停在用户自己选中/回看的那一步，不再自动跳
    if (app.guideIdx < 0 || app.guideIdx >= steps.length) app.guideIdx = 0;
  } else {
    // 自动推进：当前步骤刚完成时，跳到下一个未完成步骤；手动导航（上一步/圆点）后锁定不再弹回
    const curDone = !!(steps[app.guideIdx] && steps[app.guideIdx].done);
    if (curDone && app.guideAutoAdvance !== false && app.guideIdx < steps.length - 1) {
      const nxt = steps.findIndex((x, i2) => i2 > app.guideIdx && !x.done);
      if (nxt !== -1) { app.guideIdx = nxt; app.guideAutoAdvance = false; }
    }
    if (app.guideIdx >= steps.length) app.guideIdx = steps.length - 1;
    if (app.guideIdx < 0) app.guideIdx = 0;
  }
  const i = app.guideIdx;
  const st = steps[i];
  const segs = steps.map((x, j) => {
    const cls = x.done ? 'done' : (j === i ? 'cur' : '');
    return '<span class="hero-seg' + (cls ? ' ' + cls : '') + '" title="' + esc(x.name) + '"></span>';
  }).join('');

  html += '<div class="hero">' +
    '<h2>' + esc(t('heroTitle')) + '</h2>' +
    '<p>' + esc(t('heroP')) + '</p>' +
    '<div class="hero-progress"><div class="hero-segs">' + segs + '</div><span class="hero-progress-text">' + esc(t('heroProgress', { d: doneCount, t: steps.length })) + '</span></div>' +
    '</div>';

  if (allDone) {
    html += '<div class="notice ok"><span class="ico">' + icon('check') + '</span><div><strong>' + esc(t('wizAllDoneT')) + '</strong> ' + esc(t('wizAllDoneD')) + '</div></div>';
  }
  // 五步全绿才出现一次「支持作者」提示；点「不再显示」写进配置，之后永久不再渲染
  if (allDone && !(s.ui && s.ui.supportHintClosed)) html += supportHintHtml();

  // 步骤圆点
  html += '<div class="wizard-dots">';
  steps.forEach((x, j) => {
    const cls = (j === i) ? 'cur' : (x.done ? 'done' : '');
    html += '<button class="wizard-dot ' + cls + '" data-gnav="' + j + '" title="' + esc(x.name) + '" aria-label="' + esc(t('wizStepOf', { i: j + 1, n: steps.length })) + '">' + (x.done ? icon('check') : (j + 1)) + '</button>';
  });
  html += '</div>';

  // 当前步骤大卡片
  html += '<div class="wizard-card">' +
    '<div class="wizard-step-tag">' + esc(t('wizStepOf', { i: i + 1, n: steps.length })) +
      (st.done ? ' <span class="pill ok">' + esc(t('gDone')) + '</span>' : '') +
    '</div>' +
    '<h3 class="wizard-name">' + esc(st.name) + '</h3>' +
    '<p class="wizard-desc">' + esc(st.desc) + '</p>';
  /* 第五步：开发者模式必须先打开，单独用醒目警示块顶在正文最前面，确保不会被划过去 */
  if (i === 4) {
    html += '<div class="notice warn devmode"><span class="ico">' + icon('warn') + '</span><div><strong>' + esc(t('gs6DevT')) + '</strong><br>' + esc(t('gs6DevD')) + '</div></div>';
  }
  if (st.details && st.details.length > 0) {
    html += '<div class="wizard-fine"><ol class="wizard-fine-list">';
    st.details.forEach((d) => { html += '<li>' + esc(d) + '</li>'; });
    html += '</ol></div>';
  }
  if (st.note) html += '<p class="wizard-note">' + esc(st.note) + '</p>';
  if (st.actions.length > 0) {
    html += '<div class="wizard-actions">';
    st.actions.forEach((a, j) => {
      const inner = (a.icon ? '<span class="ico">' + icon(a.icon) + '</span>' : '') + esc(a.label);
      if (a.href) html += '<a class="btn ' + a.kind + '" href="' + esc(a.href) + '" target="_blank" rel="noopener">' + inner + '</a>';
      else html += '<button class="btn ' + a.kind + '" data-gact="' + i + '-' + j + '">' + inner + '</button>';
    });
    html += '</div>';
  }
  html += stepTutorialHtml(i); // 图文教程（第三步 / 第五步）：真实截图 + 编号方框，放在按钮之后、翻页之前
  html += '<div class="wizard-nav">' +
    '<button class="btn ghost" data-gnav="' + (i - 1) + '"' + (i === 0 ? ' disabled' : '') + '><span class="ico">' + icon('prev') + '</span>' + esc(t('wizPrev')) + '</button>';
  if (i < steps.length - 1) {
    html += '<button class="btn primary" data-gnav="' + (i + 1) + '">' + esc(t('wizNext')) + '<span class="ico">' + icon('arrow') + '</span></button>';
  } else {
    html += '<span class="wizard-nav-hint">' + esc(t('gTodo')) + '</span>';
  }
  html += '</div></div>';

  /* 隧道明细统一在「隧道」板块里，概览不再重复；这里只保留需要注意的提醒 */
  if (attention > 0) {
    html += '<div class="notice warn"><span class="ico">' + icon('warn') + '</span><div>' + t('attentionLine', { n: attention }) + '</div></div>';
  }
  html += dashHelpSection(s);

  c.innerHTML = html;
  $$('[data-tutshot]', c).forEach((im) => im.addEventListener('click', () => openTutZoom(im.dataset.tutshot)));
  $$('[data-gact]', c).forEach((b) => b.addEventListener('click', () => {
    const parts = b.dataset.gact.split('-');
    const stp = steps[Number(parts[0])];
    const a = stp && stp.actions[Number(parts[1])];
    if (a && a.fn) a.fn();
  }));
  $$('[data-gnav]', c).forEach((b) => b.addEventListener('click', () => {
    const j = Number(b.dataset.gnav);
    if (j >= 0 && j < steps.length) { app.guideIdx = j; app.guideAutoAdvance = false; renderView(); }
  }));
  bindTunnelCards(c, s);
  $$('[data-goto]', c).forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); setView(a.dataset.goto); }));
}

/* ---------------- 图文教程（第三步 / 第五步共用一套外壳） ---------------- */
/* 截图只做过两件事：账号/密钥区域打码 + 叠加红色序号；界面本身没有被改动或重绘。
   第三步四张图按实际操作顺序排：入口 → 建隧道 → 弹窗怎么填 → 拿 runtime key。
   第五步两张图沿用用户自己标的红框（只加序号，不裁剪、不放大），顺序：插件页入口 → 创建弹窗。 */
const TUT3_FIGS = [
  { src: 'tutorial/step3-entry.png', t: 'wizTutF1T', d: 'wizTutF1D' },
  { src: 'tutorial/step3-tunnels.png', t: 'wizTutF2T', d: 'wizTutF2D' },
  { src: 'tutorial/step3-create.png', t: 'wizTutF3T', d: 'wizTutF3D' },
  { src: 'tutorial/step3-apikeys.png', t: 'wizTutF4T', d: 'wizTutF4D' },
];
/* 第五步两张图：ChatGPT 网页端插件页入口 → 创建自定义 MCP 服务器弹窗怎么填 */
const TUT5_FIGS = [
  { src: 'tutorial/step5-plugins.png', t: 'wizTut5F1T', d: 'wizTut5F1D' },
  { src: 'tutorial/step5-create.png', t: 'wizTut5F2T', d: 'wizTut5F2D' },
];
/* 步骤序号（第几步，从 1 数）→ 教程配置；文案各自一组，外壳与样式完全共用 */
const TUTORIALS = {
  3: { id: 'tut3', figs: TUT3_FIGS, title: 'wizTutT', lead: 'wizTutD', tips: [['warn', 'wizTutSafe'], ['zap', 'wizTutTip']] },
  5: { id: 'tut5', figs: TUT5_FIGS, title: 'wizTut5T', lead: 'wizTut5D', tips: [['warn', 'wizTut5Safe'], ['zap', 'wizTut5Tip']] },
};

function tutHtml(cfg) {
  /* 默认展开：新用户往下滑就能照着做；用户手动收起过就记住，不再自动铺开 */
  let h = '<details class="wiz-tut" data-tut="' + cfg.id + '"' + (app.tutClosed[cfg.id] ? '' : ' open') + '>' +
    '<summary><span class="ico">' + icon('info') + '</span>' + esc(t(cfg.title)) +
    '<span class="chev">' + icon('arrow') + '</span></summary><div class="wiz-tut-body">' +
    '<p class="wiz-tut-lead">' + esc(t(cfg.lead)) + '</p>' +
    '<div class="wiz-tut-figs">';
  cfg.figs.forEach((f, k) => {
    const head = '<div class="wiz-tut-fig-t"><span class="wiz-tut-fig-n">' + esc(t('wizTutFigN', { n: k + 1 })) + '</span>' + esc(t(f.t)) + '</div>';
    const shot = '<img class="wiz-tut-shot" src="' + f.src + '" alt="' + esc(t(f.t)) + '" title="' + esc(t('wizTutZoom')) + '" loading="lazy" data-tutshot="' + f.src + '">';
    const cap = '<figcaption class="wiz-tut-cap">' + esc(t(f.d)) + '</figcaption>';
    /* 四张图统一「编号标题 → 截图 → 说明」，竖排一列，一行一张，图都横向铺满 */
    h += '<figure class="wiz-tut-fig">' + head + shot + cap + '</figure>';
  });
  h += '</div>';
  cfg.tips.forEach((tip) => {
    h += '<div class="wiz-tut-tip' + (tip[0] === 'warn' ? '' : ' soft') + '"><span class="ico">' + icon(tip[0]) + '</span><div>' + esc(t(tip[1])) + '</div></div>';
  });
  h += '</div></details>';
  return h;
}

/* 教程铺在第三步（拿钥匙）和第五步（接进 ChatGPT）；其余步骤的同类教程后续版本再补 */
function stepTutorialHtml(stepIdx) {
  const cfg = TUTORIALS[stepIdx + 1];
  return cfg ? tutHtml(cfg) : '';
}

/* 点截图看大图：浮层铺满窗口，点任意处或按 Esc 关掉 */
function openTutZoom(src) {
  const old = document.querySelector('.tut-zoom');
  if (old) old.remove();
  const box = document.createElement('div');
  box.className = 'tut-zoom';
  const img = document.createElement('img');
  img.src = src;
  img.alt = '';
  box.appendChild(img);
  function close() { box.remove(); document.removeEventListener('keydown', onKey); }
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  box.addEventListener('click', close);
  document.addEventListener('keydown', onKey);
  document.body.appendChild(box);
}

/* 概览底部的帮助折叠区：常见问题 + 官方入口，想看再展开 */
function dashHelpSection(s) {
  let h = '<details class="wizard-help dash-help" data-dk="stuck"' + detailsOpenAttr('stuck') + '><summary><span class="ico">' + icon('info') + '</span>' + esc(t('stuckT')) + '<span class="chev">' + icon('arrow') + '</span></summary><div class="wizard-help-body">';
  h += '<div class="guide-tips">';
  [['zap', 'tip1T', 'tip1D'], ['refresh', 'tip2T', 'tip2D'], ['heartbeat', 'tip3T', 'tip3D']].forEach((row) => {
    h += '<div class="guide-tip"><div class="t"><span class="ico">' + icon(row[0]) + '</span>' + esc(t(row[1])) + '</div><div class="d">' + esc(t(row[2])) + '</div></div>';
  });
  h += '</div>';
  h += '<div class="section-title" style="margin-top:20px"><span class="ico">' + icon('info') + '</span>' + esc(t('guideFaqT')) + '</div>';
  h += '<div class="faq-list">';
  for (let k = 1; k <= 5; k++) {
    h += '<details class="faq" data-dk="faq' + k + '"' + detailsOpenAttr('faq' + k) + '><summary><span class="ico">' + icon('info') + '</span>' + esc(t('faqQ' + k)) + '<span class="chev">' + icon('arrow') + '</span></summary><div class="faq-a">' + esc(t('faqA' + k)) + '</div></details>';
  }
  h += '</div>';
  h += '<div class="section-title" style="margin-top:20px"><span class="ico">' + icon('link') + '</span>' + esc(t('guideLinksT')) + '</div>';
  h += '<div class="card"><div class="card-body" style="padding-top:8px"><div class="link-row">';
  const docs = s.docs || {};
  [['platformTunnels', 'lnkTunnels'], ['platformApiKeys', 'lnkApiKeys'], ['chatgptConnectors', 'lnkConnectors'], ['secureTunnelGuide', 'lnkGuide'], ['tunnelClientRepo', 'lnkRepo']].forEach((row) => {
    if (docs[row[0]]) h += '<a class="link-item" href="' + esc(docs[row[0]]) + '" target="_blank" rel="noopener"><span class="ico">' + icon('ext') + '</span>' + esc(t(row[1])) + '<span class="arrow">' + icon('arrow') + '</span></a>';
  });
  h += '</div></div></div>';
  h += '</div></details>';
  return h;
}

/* 保留空壳：老的 renderGuide 已由概览统一承担 */

function statCard(ic, tint, num, label) {
  return '<div class="stat-card"><div class="stat-ico ' + tint + '">' + icon(ic) + '</div>' +
    '<div><div class="stat-num">' + num + '</div><div class="stat-label">' + esc(label) + '</div></div></div>';
}

/* ---------------- 隧道卡片 ---------------- */
/* 健康药丸的悬浮说明：讲清楚「自检没过」到底哪儿没过，以及它并不代表隧道断了 */
function healthTipText(tn) {
  const h = tn.health || {};
  const mark = (v) => (v ? '200' : (currentLang === 'en' ? 'failed' : '未通过'));
  const e = h.error ? (currentLang === 'en' ? ' (' + h.error + ')' : '（原因：' + h.error + '）') : '';
  return t('stHealthTipBad', { h: mark(h.healthz), r: mark(h.readyz), e });
}

function statePill(tn) {
  const st = tn.status.state;
  if (st === 'running') {
    if (tn.health && tn.health.ok) return '<span class="pill ok" title="' + esc(t('stHealthTipOk')) + '"><span class="dot dot-ok"></span>' + esc(t('stRunningOk')) + '</span>';
    if (tn.health) return '<span class="pill warn" title="' + esc(healthTipText(tn)) + '"><span class="dot dot-warn"></span>' + esc(t('stHealthBad')) + '</span>';
    return '<span class="pill ok"><span class="dot dot-ok"></span>' + esc(t('stRunning')) + '</span>';
  }
  if (st === 'error') return '<span class="pill err"><span class="dot dot-err"></span>' + esc(t('stError')) + '</span>';
  if (st === 'stale') return '<span class="pill warn" title="' + esc(t('stStaleTip')) + '"><span class="dot dot-warn"></span>' + esc(t('stStale')) + '</span>';
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
    : '<span class="m" style="color:var(--amber)" title="' + esc(t('keyMissingTip')) + '"><span class="ico">' + icon('key') + '</span>' + esc(t('keyMissing')) + '</span>';
  html += keyM;
  html += '</div>';
  if (tn.lastError) {
    html += '<div class="tun-err">' +
      '<div class="tun-err-t"><span class="ico">' + icon('x') + '</span><span>' + esc(tn.lastError) + '</span></div>' +
      (tn.lastErrorHint
        ? '<div class="tun-err-h"><span class="tun-err-tag">' + esc(t('errFix')) + '</span><span>' + esc(tn.lastErrorHint) + '</span></div>'
        : '') +
      '</div>';
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
  if (act === 'logs') { app.logTunnel = tn.name; app.logCache = null; setView('logs'); return; }
  if (act === 'edit') { showTunnelModal(tn.name); return; }
  if (act === 'remove') {
    const okGo = await confirmModal(t('deleteTunnel'), t('deleteTunnelMsg', { n: esc(tn.name) }), t('delete'), true);
    if (!okGo) return;
    try { await api('/api/tunnels/' + encodeURIComponent(tn.name) + '/remove', { method: 'POST' }); toast(t('tunnelDeleted', { n: tn.name }), 'ok'); refreshState(true); }
    catch (e) { toast(e.message, 'err'); }
    return;
  }
  // start / stop / restart
  btn.disabled = true; btn.classList.add('loading');
  try {
    const res = await api('/api/tunnels/' + encodeURIComponent(tn.name) + '/' + act, { method: 'POST' });
    /* 起不来的话后端会把「原因 + 修复建议」放进 message，直接给用户看，别只说一句「已启动」 */
    if (res && res.ready === false && res.message) toast(res.message, 'warn');
    else toast(t(act === 'start' ? 'tunnelStarted' : act === 'stop' ? 'tunnelStopped' : 'tunnelRestarted', { n: tn.name }), 'ok');
  } catch (e) { toast(e.message, 'err'); }
  finally { btn.disabled = false; btn.classList.remove('loading'); }
  if (!document.hidden) setTimeout(() => refreshState(true), 600);
}

/* ---------------- 密钥页 ---------------- */
/*
 * 「密钥」板块：还没绑定隧道的两把钥匙先收在这里，顺序排在「服务器 / 隧道」前面。
 * 页面只有两块：上面「密钥管理」一行一把钥匙（状态 / 值 / 谁在用 / 复制·更新·清除），
 * 下面「这两把钥匙去哪儿拿」的折叠指南。存好的钥匙会被隧道表单复用：
 * 隧道 ID 直接预填，runtime key 在表单里选「密钥保险箱」留空即可。
 */
function renderKeys(c, s) {
  const k = s.keys || {};
  const docs = s.docs || {};
  const tunnelReady = !!k.tunnelId;
  const apiReady = !!k.apiKeyReady;
  /* 配置记着「存在保险箱」但凭据查不到（系统清理过 / 换过机器）：不能只说未保存，要提示重存一次 */
  const apiLost = !apiReady && k.apiKeyStore === 'keyring';
  const storeMode = k.apiKeyStore === 'keyring' ? 'keyring' : (k.apiKeyStore === 'inline' ? 'inline' : (app.keyringSupported ? 'keyring' : 'inline'));
  const readyCount = (tunnelReady ? 1 : 0) + (apiReady ? 1 : 0);
  const steps = (arr) => '<ol class="keys-steps">' + arr.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ol>';
  const extLink = (href, label) => '<a class="btn ghost" href="' + esc(href || '#') + '" target="_blank" rel="noopener"><span class="ico">' + icon('ext') + '</span>' + esc(label) + '</a>';
  const pill = (cls, label) => '<span class="pill ' + cls + '">' + esc(label) + '</span>';
  const fmtTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleString();
  };
  /* 行内小字：空项直接丢掉，免得留下孤零零的分隔符 */
  const notes = (list) => {
    const kept = list.filter((x) => x && x.html);
    return kept.length
      ? '<div class="keys-item-notes">' + kept.map((x) => '<span class="keys-item-note' + (x.hot ? ' hot' : '') + '">' + x.html + '</span>').join('') + '</div>'
      : '';
  };
  const save = async (body, okMsg) => {
    try {
      await api('/api/keys', { method: 'POST', body });
      toast(okMsg, 'ok');
      refreshState(true, true);
    } catch (e) { toast(e.message, 'err'); }
  };

  let html = '<div class="notice info"><span class="ico">' + icon('key') + '</span><div><strong>' + esc(t('keysIntroT')) + '</strong><br>' + esc(t('keysIntroD')) + '</div></div>';

  /* ① 密钥管理：一行两列，一把钥匙一列 */
  html += '<div class="card"><div class="card-head"><div>' +
      '<div class="card-title"><span class="ico">' + icon('key') + '</span>' + esc(t('keysManageT')) + '</div>' +
      '<div class="card-sub">' + esc(t('keysManageD')) + '</div></div>' +
      pill(readyCount === 2 ? 'ok' : 'blue', t('keysSummary', { a: readyCount, b: 2 })) +
    '</div><div class="card-body"><div class="keys-list">';

  /* ①-1 隧道密钥（Tunnel ID）：这串 ID 不是机密，可以完整复制 */
  const usedBy = (k.tunnelIdUsedBy || []).filter(Boolean);
  html += '<div class="keys-item' + (tunnelReady ? ' is-saved' : '') + '">' +
    '<div class="keys-item-main">' +
      '<div class="keys-item-head"><span class="keys-item-name"><span class="ico">' + icon('key') + '</span>' + esc(t('keysField1')) + '</span>' +
        pill(tunnelReady ? 'ok' : 'muted', tunnelReady ? t('keysSaved') : t('keysNotReady')) + '</div>' +
      (tunnelReady && k.tunnelIdMasked
        ? '<div class="keys-item-value mono">' + esc(k.tunnelIdMasked) + '</div>'
        : '<div class="keys-item-empty">' + esc(t('keysEmptyTunnel')) + '</div>') +
      notes([
        tunnelReady && k.tunnelIdSavedAt ? { html: esc(t('keysSavedAt', { t: fmtTime(k.tunnelIdSavedAt) })) } : null,
        tunnelReady ? (usedBy.length
          ? { html: esc(t('keysUsedBy', { n: usedBy.join('、') })), hot: true }
          : { html: esc(t('keysUnused')) }) : null,
      ]) +
    '</div>' +
    '<div class="keys-item-actions">' +
      (tunnelReady
        ? '<button class="btn soft" data-copy="tunnel"><span class="ico">' + icon('copy') + '</span>' + esc(t('keysBtnCopy')) + '</button>' +
          '<button class="btn soft" data-edit="tunnel"><span class="ico">' + icon('edit') + '</span>' + esc(t('keysBtnEdit')) + '</button>' +
          '<button class="btn danger-soft" data-clear="tunnel"><span class="ico">' + icon('trash') + '</span>' + esc(t('keysClearTunnel')) + '</button>'
        : '<button class="btn primary" data-focus="tunnel"><span class="ico">' + icon('key') + '</span>' + esc(t('keysBtnPaste')) + '</button>') +
    '</div>' +
    '<div class="keys-item-editor" data-editor="tunnel"' + (tunnelReady ? ' hidden' : '') + '>' +
      '<div class="field" style="margin-bottom:0"><label class="field-label" for="k_tunnel">' + esc(t('keysField1')) + '</label>' +
      '<input class="input mono" id="k_tunnel" placeholder="' + esc(t('keysPh1')) + '" value="' + esc(k.tunnelId || '') + '">' +
      '<div class="field-hint">' + t('fTunnelIdHint', { a: '<a href="' + esc(docs.platformTunnels || '#') + '" target="_blank" rel="noopener">' + esc(t('fTunnelIdA')) + '</a>' }) + '</div></div>' +
      '<div class="keys-item-btns">' +
        '<button class="btn primary" data-save="tunnel"><span class="ico">' + icon('check') + '</span>' + esc(t('keysSave1')) + '</button>' +
        '<button class="btn ghost" data-cancel="tunnel">' + esc(t('cancel')) + '</button>' +
        extLink(docs.platformTunnels, t('keysOpenTunnels')) +
      '</div>' +
    '</div></div>';

  /* ①-2 API 密钥（runtime key）：只显示末四位，保存方式与隧道表单一致（保险箱优先）。
     输入框排在编辑器最前面，和左边「隧道密钥」的第一行字段对齐；「保存方式」跟在输入框下面。 */
  const keyringBtn = app.keyringSupported
    ? '<button data-k="keyring" type="button" class="' + (storeMode === 'keyring' ? 'active' : '') + '">' + esc(t('keyModeKeyring')) + '</button>'
    : '';
  html += '<div class="keys-item' + (apiReady ? ' is-saved' : '') + '">' +
    '<div class="keys-item-main">' +
      '<div class="keys-item-head"><span class="keys-item-name"><span class="ico">' + icon('lock') + '</span>' + esc(t('keysField2')) + '</span>' +
        (apiLost ? pill('warn', t('keysNeedResavePill')) : pill(apiReady ? 'ok' : 'muted', apiReady ? t('keysSaved') : t('keysNotReady'))) + '</div>' +
      (apiReady
        ? '<div class="keys-item-value mono" title="' + esc(t('keysTailHint')) + '">••••••••' + (k.apiKeyTail ? ' ' + esc(k.apiKeyTail) : '') + '</div>'
        : '<div class="keys-item-empty">' + esc(apiLost ? t('keysNeedResave') : t('keysEmptyApi')) + '</div>') +
      notes([
        apiReady ? { html: esc(t('keysStoreLabel')) + '：' + esc(k.apiKeyStore === 'keyring' ? t('keysStoreKeyring') : t('keysStorePlain')) } : null,
        apiReady && k.apiKeySavedAt ? { html: esc(t('keysSavedAt', { t: fmtTime(k.apiKeySavedAt) })) } : null,
        apiReady ? { html: esc(t('keysApiReuse')) } : null,
      ]) +
    '</div>' +
    '<div class="keys-item-actions">' +
      (apiReady
        ? '<button class="btn soft" data-edit="api"><span class="ico">' + icon('edit') + '</span>' + esc(t('keysBtnEdit')) + '</button>' +
          '<button class="btn danger-soft" data-clear="api"><span class="ico">' + icon('trash') + '</span>' + esc(t('keysClearKey')) + '</button>'
        : '<button class="btn primary" data-focus="api"><span class="ico">' + icon('lock') + '</span>' + esc(t('keysBtnPaste')) + '</button>') +
    '</div>' +
    '<div class="keys-item-editor" data-editor="api"' + (apiReady ? ' hidden' : '') + '>' +
      '<div class="field" style="margin-bottom:0"><label class="field-label" for="k_apikey">' + esc(t('keysField2')) + '</label>' +
      '<input class="input mono" id="k_apikey" type="password" placeholder="' + esc(t('fKeyInlinePh')) + '" value="">' +
      '<div class="field-hint">' + t('fKeyInlineHint', { a: '<a href="' + esc(docs.platformApiKeys || '#') + '" target="_blank" rel="noopener">' + esc(t('fKeyInlineA')) + '</a>' }) + '</div></div>' +
      '<div class="keys-item-btns">' +
        '<button class="btn primary" data-save="api"><span class="ico">' + icon('check') + '</span>' + esc(t('keysSave2')) + '</button>' +
        '<button class="btn ghost" data-cancel="api">' + esc(t('cancel')) + '</button>' +
        extLink(docs.platformApiKeys, t('keysOpenApiKeys')) +
      '</div>' +
      /* 「保存方式」贴卡片最底部：左边那张卡是版式模板（标签 → 输入框 → 说明 → 按钮），
         这一项是右卡独有的，放到按钮下面，两张卡的字段行才在同一水平线上 */
      '<div class="keys-item-store"><div class="field" style="margin-bottom:0"><label class="field-label">' + esc(t('keysStoreLabel')) + '</label>' +
      '<div class="seg" id="k_store">' + keyringBtn +
        '<button data-k="inline" type="button" class="' + (storeMode === 'inline' ? 'active' : '') + '">' + esc(t('keyModeInline')) + '</button>' +
      '</div>' +
      '<div class="field-hint" id="k_storeHint">' + esc(app.keyringSupported ? t('fKeyKeyringHint') : t('keysKeyringOff')) + '</div></div></div>' +
    '</div></div>';

  html += '</div></div></div>';

  /* ② 钥匙去哪儿拿：折叠起来，需要时再展开，不与上面的管理区抢版面 */
  const guideBlock = (title, sub, items, href, hrefLabel) =>
    '<div class="keys-guide">' +
      '<div class="keys-guide-head"><div class="keys-guide-t">' + esc(title) + '</div><div class="keys-guide-d">' + esc(sub) + '</div></div>' +
      steps(items) +
      '<div class="keys-guide-foot">' + extLink(href, hrefLabel) + '</div>' +
    '</div>';
  html += '<details class="wiz-tut keys-guides" data-tut="keysGuide"' + (app.tutClosed.keysGuide === false ? ' open' : '') + '>' +
    '<summary><span class="ico">' + icon('info') + '</span>' + esc(t('keysGuidesT')) + '<span class="chev">' + icon('arrow') + '</span></summary>' +
    '<div class="wiz-tut-body"><p class="wiz-tut-lead">' + esc(t('keysGuidesS')) + '</p>' +
      guideBlock(t('keysCard1T'), t('keysCard1D'), [t('keysCard1B1'), t('keysCard1B2'), t('keysCard1B3'), t('keysCard1B4')], docs.platformTunnels, t('keysOpenTunnels')) +
      guideBlock(t('keysCard2T'), t('keysCard2D'), [t('keysCard2B1'), t('keysCard2B2'), t('keysCard2B3'), t('keysCard2B4')], docs.platformApiKeys, t('keysOpenApiKeys')) +
    '</div></details>';

  c.innerHTML = html;

  /* 输入区：已保存时折叠起来，没保存 / 点「更新」时展开并聚焦 */
  const showEditor = (which, on) => {
    const ed = $('[data-editor="' + which + '"]', c);
    if (!ed) return;
    ed.hidden = !on;
    const item = ed.closest('.keys-item');
    if (item) item.classList.toggle('editing', on);
    const input = $('input', ed);
    if (on && input) { input.focus(); if (input.value) input.select(); }
  };
  $$('[data-focus]', c).forEach((b) => b.addEventListener('click', () => showEditor(b.dataset.focus, true)));
  $$('[data-edit]', c).forEach((b) => b.addEventListener('click', () => showEditor(b.dataset.edit, true)));
  $$('[data-cancel]', c).forEach((b) => b.addEventListener('click', () => showEditor(b.dataset.cancel, false)));

  /* 复制：先走剪贴板 API，被权限挡住就退回临时 textarea */
  const copyOut = async (text, okMsg) => {
    let ok = false;
    if (!text) { toast(t('keysCopyFail'), 'err'); return; }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        ok = true;
      }
    } catch (e) { ok = false; }
    if (!ok) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', 'readonly');
        ta.style.position = 'fixed';
        ta.style.top = '-1000px';
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand('copy');
        ta.remove();
      } catch (e) { ok = false; }
    }
    toast(ok ? okMsg : t('keysCopyFail'), ok ? 'ok' : 'err');
  };
  $$('[data-copy]', c).forEach((b) => b.addEventListener('click', () => copyOut(k.tunnelId || '', t('keysCopied'))));

  $$('[data-save]', c).forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.save === 'tunnel') {
      const val = $('#k_tunnel', c).value.trim();
      if (!val) { toast(t('keysNeedValue'), 'err'); return; }
      save({ tunnelId: val }, t('keysSaved1'));
      return;
    }
    const seg = $('#k_store button.active', c);
    const val = $('#k_apikey', c).value.trim();
    if (!val) { toast(t('keysNeedValue'), 'err'); return; }
    save({ keyMode: seg ? seg.dataset.k : 'inline', apiKey: val }, t('keysSaved2'));
  }));

  $$('[data-clear]', c).forEach((b) => b.addEventListener('click', async () => {
    const isTunnel = b.dataset.clear === 'tunnel';
    const okGo = await confirmModal(
      isTunnel ? t('keysClearTunnel') : t('keysClearKey'),
      esc(isTunnel ? t('keysClearTunnelAsk') : t('keysClearKeyAsk')),
      isTunnel ? t('keysClearTunnel') : t('keysClearKey'),
      true,
    );
    if (!okGo) return;
    save(isTunnel ? { tunnelId: '' } : { keyMode: 'clear' }, isTunnel ? t('keysClearedTunnel') : t('keysClearedKey'));
  }));

  const segEl = $('#k_store', c);
  if (segEl) $$('button', segEl).forEach((b) => b.addEventListener('click', () => {
    $$('button', segEl).forEach((x) => x.classList.toggle('active', x === b));
    const hint = $('#k_storeHint', c);
    if (hint) hint.textContent = b.dataset.k === 'inline' ? t('keysInlineHint') : t('fKeyKeyringHint');
  }));
}

/* ---------------- 隧道列表页 ---------------- */
function renderTunnels(c, s) {
  let html = '';
  if (s.tunnels.length === 0) {
    /* 一条隧道都没有时，先把「密钥」板块没存齐的钥匙提示出来，避免新用户卡在弹窗里 */
    const dk = s.keys || {};
    const keysReady = !!(dk.tunnelId && dk.apiKeyReady);
    html = '<div class="empty"><div class="empty-ico">' + icon('tunnels') + '</div>' +
      '<h3>' + esc(t('tunnelEmptyH')) + '</h3><p>' + esc(t('tunnelEmptyP')) + '</p>' +
      (keysReady ? '' : '<div class="empty-sub">' + esc(t('tunnelEmptyKeys')) + '</div>') +
      '<div class="empty-actions">' +
      (keysReady ? '' : '<button class="btn ghost" id="emptyKeysBtn"><span class="ico">' + icon('key') + '</span>' + esc(t('tunnelEmptyKeysBtn')) + '</button>') +
      '<button class="btn primary" id="emptyNewTunnel"><span class="ico">' + icon('plus') + '</span>' + esc(t('createFirstTunnel')) + '</button></div></div>';
    c.innerHTML = html;
    $('#emptyNewTunnel', c).addEventListener('click', () => showTunnelModal(null));
    const keysBtn = $('#emptyKeysBtn', c);
    if (keysBtn) keysBtn.addEventListener('click', () => setView('keys'));
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
    '<button class="btn accent" id="tplBtn"><span class="ico">' + icon('zap') + '</span>' + esc(t('fromTemplate')) + '</button>' +
    '<button class="btn accent" id="importBtn"><span class="ico">' + icon('download') + '</span>' + esc(t('importConfig')) + '</button>' +
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
      try { await api('/api/servers/' + encodeURIComponent(name) + '/remove', { method: 'POST' }); toast(t('serverDeleted', { n: name }), 'ok'); refreshState(true); }
      catch (e) { toast(e.message, 'err'); }
    });
  });
}


/* ---------------- 组件市场页 ---------------- */
/* 12345 → 12.3k；和 src/marketstars.ts 的 formatStars 保持同一套规则 */
function starsText(n) {
  if (typeof n !== 'number' || !isFinite(n) || n < 0) return '';
  if (n < 1000) return String(n);
  if (n < 10000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return Math.round(n / 1000) + 'k';
}

async function renderMarket(c, s) {
  c.innerHTML = '<div class="empty"><div class="empty-ico">' + icon('market') + '</div><p>' + esc(t('logLoading')) + '</p></div>';
  let items = [];
  try {
    const data = await api('/api/components', { method: 'GET' });
    items = data.components || [];
  } catch (e) {
    c.innerHTML = '<div class="empty"><div class="empty-ico">' + icon('warn') + '</div><h3>' + esc(e.message) + '</h3></div>';
    return;
  }
  let html = '<div class="mk-note"><span class="ico">' + icon('info') + '</span><span>' + esc(t('mkNote')) + '</span></div>';
  html += '<div class="entity-grid">';
  items.forEach((it) => {
    const installed = it.installed === true;
    /* 中英双语字段：切到 English 时优先用 xxEn，缺了就退回中文，界面不会出现空标题 */
    const en = currentLang === 'en';
    const title = (en && it.titleEn) ? it.titleEn : it.title;
    const desc = (en && it.descriptionEn) ? it.descriptionEn : it.description;
    const hint = (en && it.hintEn) ? it.hintEn : it.hint;
    const abilities = ((en && it.abilitiesEn && it.abilitiesEn.length) ? it.abilitiesEn : (it.abilities || []));
    const starTxt = starsText(it.stars);
    const starTip = it.starsLive ? t('mkStarsLive') : t('mkStarsSnapshot', { d: it.starsSnapshotAt || '' });
    html += '<div class="entity-card" data-comp="' + esc(it.id) + '">' +
      '<div class="entity-top">' +
        '<div class="entity-ico kind-stdio">' + icon(it.runner === 'npx' ? 'terminal' : 'zap') + '</div>' +
        '<div class="entity-names"><div class="entity-name">' + esc(title) + '</div>' +
        '<div class="entity-target" title="' + esc(it.command) + '">' + esc(it.command) + '</div></div>' +
        '<span class="pill ' + (installed ? 'ok' : 'muted') + '">' + (installed ? esc(t('mkInstalled')) : esc(it.runnerName)) + '</span>' +
      '</div>' +
      '<div class="entity-meta">' +
        '<span class="m">' + esc(desc) + '</span>' +
      '</div>' +
      /* 0.1.10：这条组件要用的 uvx / npx 本机没装的话，卡片上先说清楚，别等隧道启动失败 */
      (it.runnerAvailable === false
        ? '<div class="entity-meta"><span class="m" style="color:var(--amber)" title="' + esc(it.runnerHint || '') + '">' +
          '<span class="ico">' + icon('warn') + '</span>' + esc(t('mkRunnerMissingTip', { r: it.runner })) + '</span></div>'
        : '') +
      /* 能力清单：这个组件到底能干什么，一行一条，新用户不用猜 */
      (abilities.length
        ? '<div class="mk-abil"><div class="mk-abil-t">' + esc(t('mkAbilities')) + '</div>' +
          abilities.map((a) => '<span class="mk-abil-i"><span class="ico">' + icon('check') + '</span><span>' + esc(a) + '</span></span>').join('') +
          '</div>'
        : '') +
      '<div class="entity-meta">' +
        (starTxt ? '<span class="m mk-star" title="' + esc(starTip) + '"><span class="ico">' + icon('star') + '</span>' + esc(t('mkStars', { n: starTxt })) + '</span>' : '') +
        '<span class="m"><span class="ico">' + icon('ext') + '</span><a href="' + esc(it.source.url) + '" target="_blank" rel="noreferrer" style="color:inherit">' + esc(it.source.repo) + '</a></span>' +
        '<span class="m"><span class="ico">' + icon('book') + '</span>' + esc(it.source.license) + '</span>' +
        (hint ? '<span class="m" style="color:var(--amber)"><span class="ico">' + icon('warn') + '</span>' + esc(hint) + '</span>' : '') +
      '</div>' +
      '<div class="entity-foot"><span class="spacer"></span>' +
        (installed
          ? '<button class="btn small accent" data-act="goto"><span class="ico">' + icon('servers') + '</span>' + esc(t('mkReinstallTip')) + '</button>' +
            '<button class="btn small danger-soft" data-act="remove"><span class="ico">' + icon('trash') + '</span>' + esc(t('mkUninstall')) + '</button>'
          : '<button class="btn small accent" data-act="install"><span class="ico">' + icon('download') + '</span>' + esc(t('mkInstall')) + '</button>') +
      '</div>' +
    '</div>';
  });
  html += '</div>';
  html += '<div class="mk-note" style="margin-top:14px"><span class="ico">' + icon('zap') + '</span><span>' + esc(t('mkCustom')) + '</span></div>';
  c.innerHTML = html;

  $$('[data-comp]', c).forEach((card) => {
    const id = card.dataset.comp;
    const it = items.find((x) => x.id === id);
    if (!it) return;
    const installBtn = $('[data-act="install"]', card);
    if (installBtn) installBtn.addEventListener('click', async () => {
      installBtn.disabled = true;
      try {
        const res = await api('/api/components/' + encodeURIComponent(id) + '/install', { method: 'POST' });
        toast(t('mkInstallOk'), 'ok');
        if (res && res.runnerWarning) toast(res.runnerWarning, 'warn');
        await refreshState(true, true);
      } catch (e) { toast(e.message, 'err'); installBtn.disabled = false; }
    });
    const gotoBtn = $('[data-act="goto"]', card);
    if (gotoBtn) gotoBtn.addEventListener('click', () => setView('servers'));
    const removeBtn = $('[data-act="remove"]', card);
    if (removeBtn) removeBtn.addEventListener('click', async () => {
      /* 标题必须在这里重取一次：上面那层的 title 属于另一个 forEach 的作用域，
         直接引用会抛 ReferenceError，点「卸载」整张卡片就哑了（0.1.14 修复）。 */
      const en = currentLang === 'en';
      const title = (en && it.titleEn) ? it.titleEn : it.title;
      const okGo = await confirmModal(t('mkUninstallTitle'), t('mkUninstallMsg', { t: esc(title) }), t('mkUninstall'), true);
      if (!okGo) return;
      try {
        await api('/api/components/' + encodeURIComponent(id) + '/remove', { method: 'POST' });
        toast(t('mkUninstallOk'), 'ok');
        await refreshState(true, true);
      } catch (e) { toast(e.message, 'err'); }
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
  if (!app.logTunnel || !s.tunnels.find((t) => t.name === app.logTunnel)) { app.logTunnel = s.tunnels[0].name; app.logCache = null; }
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
    '<div style="display:flex;justify-content:space-between;margin-top:10px;font-size:12.5px;color:var(--text-3)"><span id="logFilePath"></span><span id="logTrunc"></span></div></div></div>';
  c.innerHTML = html;
  $('#logTunnelSel', c).addEventListener('change', (e) => { app.logTunnel = e.target.value; app.logCache = null; loadLog(true); });
  $('#logAutoChk', c).addEventListener('change', (e) => { app.logAuto = e.target.checked; scheduleLogPoll(); });
  $('#logRefreshBtn', c).addEventListener('click', () => loadLog(false));
  $('#logOpenDir', c).addEventListener('click', async () => {
    try { await api('/api/open', { method: 'POST', body: { target: 'logs' } }); } catch (e) { toast(e.message, 'err'); }
  });
  loadLog(true);
  scheduleLogPoll();
}

function scheduleLogPoll() {
  clearInterval(app.logTimer);
  if (document.hidden) return;
  if (app.view === 'logs' && app.logAuto) app.logTimer = setInterval(() => loadLog(true), 2500);
}

async function loadLog(silent) {
  const viewer = $('#logViewer');
  if (!viewer || !app.logTunnel) return;
  try {
    const data = await api('/api/logs/' + encodeURIComponent(app.logTunnel) + '?lines=400', { method: 'GET' });
    const atBottom = viewer.scrollHeight - viewer.scrollTop - viewer.clientHeight < 40;
    const lines = data.lines || [];
    const cached = app.logCache && app.logCache.tunnel === app.logTunnel ? app.logCache.lines : null;
    /* 日志整体替换时滚动位置会丢（真机体验：看历史时每次轮询都被拉回底部）。
       做增量追加：只有出现新行才动 DOM，滚动位置才能稳。 */
    if (lines.length === 0) {
      if (!cached) viewer.innerHTML = '<span class="log-empty">' + esc(t('logNone')) + '</span>';
      app.logCache = { tunnel: app.logTunnel, lines: [] };
    } else {
      let overlap = 0;
      if (cached) {
        for (let n = Math.min(cached.length, lines.length); n > 0; n--) {
          let same = true;
          for (let k = 0; k < n; k++) {
            if (cached[cached.length - n + k] !== lines[k]) { same = false; break; }
          }
          if (same) { overlap = n; break; }
        }
      }
      const fresh = lines.slice(overlap);
      if (fresh.length > 0 || !cached) {
        if (!cached) viewer.textContent = lines.join('\n');
        else viewer.textContent += (viewer.textContent ? '\n' : '') + fresh.join('\n');
        app.logCache = { tunnel: app.logTunnel, lines };
        if (atBottom || !silent) viewer.scrollTop = viewer.scrollHeight;
      }
    }
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
    '<div class="card-body" id="doctorBody"><div style="color:var(--text-3);font-size:13.5px">' + esc(t('doctorIdle')) + '</div></div></div>';
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
  body.innerHTML = '<div style="color:var(--text-3);font-size:13.5px;display:flex;align-items:center;gap:8px"><span class="ico" style="animation:indet 1.2s infinite">' + icon('refresh') + '</span>' + esc(t('doctorChecking')) + (online ? esc(t('doctorOnlineNote')) : '') + '…</div>';
  try {
    const data = await api('/api/doctor' + (online ? '?online=1' : ''), { method: 'GET' });
    const checks = data.checks || [];
    if (checks.length === 0) { body.innerHTML = '<div class="check-item ok"><span class="ico">' + icon('check') + '</span><div><div class="check-name">' + esc(t('doctorAllOk')) + '</div><div class="check-detail">' + esc(t('doctorAllOkSub')) + '</div></div></div>'; return; }
    let html = '<div class="check-list">';
    checks.forEach((ck) => {
      const raw = String(ck.level || '').toLowerCase();
      const lvl = (raw === 'fail' || raw === 'error') ? 'err' : (raw === 'warn' ? 'warn' : (raw === 'info' ? 'info' : 'ok'));
      /* 体检给出的修复建议原本只有命令行写法（mcphelm runtime fetch / tunnel add），
         桌面版用户没装 CLI 就无处可抄。能在界面里一键做完的，直接在条目上给按钮。 */
      const cta = (lvl === 'err' && ck.id === 'runtime')
        ? '<div style="margin-top:10px"><button class="btn primary small" id="doctorRuntimeBtn"><span class="ico">' + icon('download') + '</span>' + esc(t('downloadNow')) + '</button></div>'
        : (ck.id === 'tunnels'
          ? '<div style="margin-top:10px"><button class="btn ghost small" id="doctorTunnelBtn"><span class="ico">' + icon('plus') + '</span>' + esc(t('goCreateTunnel')) + '</button></div>'
          : '');
      html += '<div class="check-item ' + lvl + '"><span class="ico">' + icon(lvl === 'err' ? 'x' : lvl === 'warn' ? 'warn' : lvl === 'info' ? 'info' : 'check') + '</span>' +
        '<div><div class="check-name">' + esc(ck.title || ck.name || ck.id || t('checkItem')) + '</div>' +
        '<div class="check-detail">' + esc(ck.detail || ck.message || '') + '</div>' +
        (ck.hint ? '<div class="check-detail" style="color:var(--primary)">' + esc(t('doctorHint')) + esc(ck.hint) + '</div>' : '') +
        cta +
      '</div></div>';
    });
    html += '</div>';
    body.innerHTML = html;
    const drb = $('#doctorRuntimeBtn', body);
    if (drb) drb.addEventListener('click', () => showRuntimeModal());
    const dtb = $('#doctorTunnelBtn', body);
    if (dtb) dtb.addEventListener('click', () => showTunnelModal(null));
  } catch (e) {
    body.innerHTML = '<div class="notice err"><span class="ico">' + icon('x') + '</span><div>' + esc(t('doctorFailed')) + esc(e.message) + '</div></div>';
  }
}

/* ---------------- 设置页 ---------------- */
function renderSettings(c, s) {
  const d = s.docs || {};
  let html = '<div class="settings-grid">';

  // 界面与偏好
  const pf = app.prefsDraft || app.ui; // 有未保存的改动时，先按草稿显示，不被后台刷新覆盖
  html += '<div class="card"><div class="card-head"><div><div class="card-title"><span class="ico">' + icon('settings') + '</span>' + esc(t('secPrefs')) + '</div><div class="card-sub">' + esc(t('secPrefsSub')) + '</div></div></div><div class="card-body" style="padding-top:8px">';
  html += '<div class="set-row"><div class="set-row-k">' + esc(t('languageLabel')) + '</div>' +
    '<select class="select" id="prefLang">' +
    '<option value="zh"' + (pf.language !== 'en' ? ' selected' : '') + '>中文</option>' +
    '<option value="en"' + (pf.language === 'en' ? ' selected' : '') + '>English</option>' +
    '</select></div>';
  html += '<div class="set-rows"><label class="check-row"><input type="checkbox" id="prefTray"' + (pf.minimizeToTray ? ' checked' : '') + '> <span>' + esc(t('prefTray')) + '</span></label>' +
    '<label class="check-row"><input type="checkbox" id="prefAuto"' + (pf.autoLaunch ? ' checked' : '') + '> <span>' + esc(t('prefAutoLaunch')) + '</span></label></div>';
  html += '<div class="card-actions"><button class="btn primary small" id="prefSave"><span class="ico">' + icon('check') + '</span>' + esc(t('savePrefs')) + '</button></div>';
  html += '</div></div>';

  // 运行环境
  html += '<div class="card"><div class="card-head"><div><div class="card-title"><span class="ico">' + icon('download') + '</span>' + esc(t('secRuntime')) + '</div><div class="card-sub">' + esc(t('secRuntimeSub')) + '</div></div></div><div class="card-body" style="padding-top:8px">';
  if (s.runtime.found) {
    html += '<div class="set-rows">' +
      setRow(t('rtStatus'), '<span class="pill ok">' + esc(t('rtReady')) + '</span>') +
      setRow(t('rtVersion'), s.runtime.version || t('rtUnknown')) +
      setRow(t('rtSource'), s.runtime.source || '—') +
      setRow(t('rtPath'), s.runtime.path || '—', true) +
      '</div>';
  } else {
    html += '<div class="notice warn" style="margin-bottom:12px"><span class="ico">' + icon('warn') + '</span><div>' + t('rtMissing') + '</div></div>';
  }
  html += '<div class="card-actions">' +
    '<button class="btn primary small" id="runtimeBtn"><span class="ico">' + icon('download') + '</span>' + esc(s.runtime.found ? t('redownload') : t('downloadNow')) + '</button>' +
    '<button class="btn ghost small" id="runtimeImportBtn"><span class="ico">' + icon('folder') + '</span>' + esc(t('importLocal')) + '</button>' +
  '</div>';
  html += '</div></div>';

  // 数据位置（C 盘零占用说明 + 图形化迁移）
  {
    const dl = s.dataLocation || null;
    const sizes = (dl && dl.sizes) || {};
    html += '<div class="card"><div class="card-head"><div><div class="card-title"><span class="ico">' + icon('folder') + '</span>' + esc(t('secData')) + '</div><div class="card-sub">' + esc(t('secDataSub')) + '</div></div></div><div class="card-body" style="padding-top:8px">';
    if (dl) {
      html += '<div class="set-rows">' +
        setRow(t('dlRoot'), dl.dataRoot, true) +
        setRow(t('dlRuntime'), fmtBytes(sizes.bin || 0)) +
        setRow(t('dlLogs'), fmtBytes(sizes.logs || 0)) +
        setRow(t('dlCache'), fmtBytes(sizes.cache || 0)) +
        setRow(t('dlDesktop'), fmtBytes(sizes.desktop || 0)) +
        '</div>';
      html += '<div class="notice ok"><span class="ico">' + icon('check') + '</span><div>' + esc(t('dlHint')) + '</div></div>';
      if (dl.fallback) {
        html += '<div class="notice warn" style="margin-top:8px"><span class="ico">' + icon('warn') + '</span><div>' + esc(t('dlFallbackWarn')) + '</div></div>';
      }
      html += '<div class="card-actions">' +
        '<button class="btn ghost small" data-open="home"><span class="ico">' + icon('folder') + '</span>' + esc(t('dlOpen')) + '</button>' +
        (dl.canMigrate ? '<button class="btn primary small" id="dlMigrateBtn"><span class="ico">' + icon('arrow') + '</span>' + esc(t('dlMigrate')) + '</button>' : '') +
      '</div>';
    } else {
      html += '<div class="set-rows">' + setRow(t('dlRoot'), s.home, true) + '</div>';
      html += '<div class="notice info"><span class="ico">' + icon('info') + '</span><div>' + esc(t('dlNoMigrate')) + '</div></div>';
      html += '<div class="card-actions">' +
        '<button class="btn ghost small" data-open="home"><span class="ico">' + icon('folder') + '</span>' + esc(t('dlOpen')) + '</button>' +
      '</div>';
    }
    html += '</div></div>';
  }

  // 本地环境
  html += '<div class="card"><div class="card-head"><div><div class="card-title"><span class="ico">' + icon('folder') + '</span>' + esc(t('secLocal')) + '</div><div class="card-sub">' + esc(t('secLocalSub')) + '</div></div></div><div class="card-body" style="padding-top:8px">';
  html += '<div class="set-rows">' +
    setRow(t('kvVersion'), s.brand.name + ' v' + s.brand.version) +
    setRow(t('kvHome'), s.home, true) +
    setRow(t('kvConfig'), s.configPath, true) +
    setRow(t('kvLogs'), s.logsDir, true) +
    setRow(t('kvScope'), s.configScope || '—') +
    '</div>';
  html += '<div class="card-actions">' +
    '<button class="btn ghost small" data-open="home"><span class="ico">' + icon('folder') + '</span>' + esc(t('openHome')) + '</button>' +
    '<button class="btn ghost small" data-open="logs"><span class="ico">' + icon('folder') + '</span>' + esc(t('openLogs')) + '</button>' +
    '<button class="btn ghost small" id="backupBtn"><span class="ico">' + icon('download') + '</span>' + esc(t('backupConfig')) + '</button>' +
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
  html += '<p style="font-size:13.5px;color:var(--text-2);line-height:1.8;margin:0">' + esc(t('aboutP')) + '</p>';
  html += '<div class="set-rows">' + setRow(t('aboutRepo'), s.brand.repoUrl || '', true) + '</div>';
  const supInfo = supportInfo();
  if (supInfo.starUrl || supInfo.qr) {
    html += '<div class="link-row" style="margin-top:10px">';
    if (supInfo.starUrl) html += '<button class="link-item sup-star" type="button" data-support="star"><span class="ico">' + icon('star') + '</span>' + esc(t('supStarBtn')) + '<span class="arrow">' + icon('arrow') + '</span></button>';
    if (supInfo.qr) html += '<button class="link-item sup-coffee" type="button" data-support="coffee"><span class="ico">' + icon('coffee') + '</span>' + esc(t('supCoffeeT')) + '<span class="arrow">' + icon('arrow') + '</span></button>';
    html += '</div>';
  }
  html += '<div class="notice info"><span class="ico">' + icon('info') + '</span><div>' + esc(t('aboutSafe')) + '</div></div>';
  html += '</div></div>';

  html += '</div>';
  c.innerHTML = html;

  $$('[data-open]', c).forEach((b) => b.addEventListener('click', async () => {
    try { await api('/api/open', { method: 'POST', body: { target: b.dataset.open } }); } catch (e) { toast(e.message, 'err'); }
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
      const picked = await api('/api/data-location/choose', { method: 'POST', body: {} });
      if (!picked || !picked.path) { refreshState(true); return; }
      const result = await api('/api/data-location/migrate', { method: 'POST', body: { target: picked.path } });
      openModal({
        title: t('dlRestart'),
        body: '<div class="notice ok"><span class="ico">' + icon('check') + '</span><div>' + esc(result.message || t('dlRestartHint')) + '</div></div>' +
          '<div class="notice warn" style="margin-top:10px"><span class="ico">' + icon('warn') + '</span><div>' + esc(t('dlSameWarn')) + '</div></div>' +
          '<div class="kv" style="margin-top:10px"><div class="kv-k">' + esc(t('dlRoot')) + '</div><div class="kv-v mono">' + esc(result.newRoot || '') + '</div></div>',
        actions: [{ label: t('confirm'), kind: 'primary' }],
      });
    } catch (e) { toast(e.message, 'err'); refreshState(true); }
  });
  // 记住未保存的偏好，后台刷新不覆盖用户的选择
  const keepDraft = () => {
    app.prefsDraft = {
      language: $('#prefLang', c) ? $('#prefLang', c).value : app.ui.language,
      minimizeToTray: !!($('#prefTray', c) && $('#prefTray', c).checked),
      autoLaunch: !!($('#prefAuto', c) && $('#prefAuto', c).checked),
    };
  };
  ['#prefLang', '#prefTray', '#prefAuto'].forEach((sel) => {
    const el = $(sel, c);
    if (el) el.addEventListener('change', keepDraft);
  });
  const ps = $('#prefSave', c); if (ps) ps.addEventListener('click', async () => {
    try {
      await api('/api/ui', { method: 'POST', body: {
        language: $('#prefLang', c).value,
        minimizeToTray: $('#prefTray', c).checked,
        autoLaunch: $('#prefAuto', c).checked,
      } });
      app.prefsDraft = null;
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

// 设置页专用紧凑行：键在左、值在右，单行排列，行高分组统一
function setRow(k, v, mono) {
  return '<div class="set-row"><div class="set-row-k">' + esc(k) + '</div>' +
    '<div class="set-row-v' + (mono ? ' mono' : '') + '">' + v + '</div></div>';
}



/* ---------------- 服务器表单 ---------------- */
async function showServerModal(editName, prefill) {
  let existing = null;
  if (editName) {
    try {
      const data = await api('/api/config', { method: 'GET' });
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
            const data = await api('/api/servers/test', { method: 'POST', body: req });
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
            await api('/api/servers', { method: 'POST', body: payload });
            toast(t('serverAdded', { n: name }), 'ok');
          } else {
            await api('/api/servers/' + encodeURIComponent(editName) + '/update', { method: 'POST', body: payload });
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
/* 409「隧道已存在」的就地确认：表单不关、填写内容不丢，按钮自己变成「用这份配置覆盖」 */
function armOverwrite(bodyEl, btn, name) {
  const old = $('#overwriteNotice', bodyEl);
  if (old) old.remove();
  const n = document.createElement('div');
  n.className = 'notice warn';
  n.id = 'overwriteNotice';
  n.innerHTML = '<span class="ico">' + icon('warn') + '</span><div>' + esc(t('overwriteHint', { n: name })) + '</div>';
  if (bodyEl.firstChild) bodyEl.insertBefore(n, bodyEl.firstChild); else bodyEl.appendChild(n);
  if (btn) btn.innerHTML = '<span class="ico">' + icon('check') + '</span>' + esc(t('overwriteSave'));
}

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
      const data = await api('/api/config', { method: 'GET' });
      existing = (data.config.tunnels || []).find((x) => x.name === editName) || null;
    } catch (e) { toast(e.message, 'err'); return; }
  }
  const d = s.docs || {};
  /* 「密钥」板块里存好的两把钥匙：隧道 ID 直接预填，runtime key 留空就复用 */
  const draftKeys = s.keys || {};
  const draftStore = draftKeys.apiKeyReady ? draftKeys.apiKeyStore : null;
  const initKeyMode = existing
    ? (existing.apiKeyEnv ? 'env' : (existing.apiKeyStore === 'keyring' ? 'keyring' : (existing.apiKeySet ? 'inline' : 'env')))
    : (draftStore === 'keyring' && app.keyringSupported
        ? 'keyring'
        : (draftStore === 'inline' ? 'inline' : (app.keyringSupported ? 'keyring' : 'env')));
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
    '<input class="input mono" id="f_tid" placeholder="tunnel_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value="' + esc(existing ? existing.tunnelId : (draftKeys.tunnelId || '')) + '">' +
    '<div class="field-hint">' + t('fTunnelIdHint', { a: '<a href="' + esc(d.platformTunnels || '#') + '" target="_blank" rel="noopener">' + esc(t('fTunnelIdA')) + '</a>' }) +
      (!existing && draftKeys.tunnelId ? ' <span class="hint-ok">' + esc(t('fTunnelIdPrefill')) + '</span>' : '') + '</div></div>' +
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
    '<div class="field-hint">' + esc(t('fKeyKeyringHint')) + (existing && existing.apiKeySet ? esc(t('fKeyKeep')) : '') +
      (!existing && draftStore === 'keyring' ? ' <span class="hint-ok">' + esc(t('fKeyReuseHint')) + '</span>' : '') + '</div></div>' +
    '<div class="field hidden" id="wrap_keyinline"><label class="field-label">runtime key</label>' +
    '<input class="input mono" id="f_keyinline" type="password" placeholder="' + esc(t('fKeyInlinePh')) + '" value="">' +
    '<div class="field-hint">' + t('fKeyInlineHint', { a: '<a href="' + esc(d.platformApiKeys || '#') + '" target="_blank" rel="noopener">' + esc(t('fKeyInlineA')) + '</a>' }) + (existing && existing.apiKeySet ? esc(t('fKeyKeep')) : '') +
      (!existing && draftStore === 'inline' ? ' <span class="hint-ok">' + esc(t('fKeyReuseHint')) + '</span>' : '') + '</div></div>' +
    '<div class="field"><label class="field-label">' + esc(t('fHealthPort')) + '</label>' +
    '<input class="input mono" id="f_tport" placeholder="8080" value="' + esc(existing && existing.healthPort ? String(existing.healthPort) : '') + '"></div>';

  /* 同名隧道覆盖：服务器回 409 时先不关表单，等用户再点一次才真的覆盖 */
  let overwriteArmed = false;
  let armedName = '';
  const m = openModal({
    title: existing ? t('tmEditTitle') : t('tmCreateTitle'),
    sub: t('tmSub'),
    body,
    wide: true,
    actions: [
      { label: t('cancel'), kind: 'ghost' },
      {
        label: existing ? t('save') : t('createTunnel'), kind: 'primary', icon: 'check',
        onClick: async (bodyEl, btn) => {
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
            /* 新建时可以留空：服务端会从「密钥」板块里把存好的 runtime key 取出来复用 */
            else if (!existing && draftStore === 'keyring') { /* 留空复用 */ }
            else if (!existing || existing.apiKeyStore !== 'keyring') throw new Error(t('fillKey'));
            else payload.keyMode = 'keep';
          } else {
            const keyVal = $('#f_keyinline', bodyEl).value.trim();
            if (keyVal) payload.apiKey = keyVal;
            else if (!existing && draftStore === 'inline') { /* 留空复用 */ }
            else if (!existing || !existing.apiKeySet) throw new Error(t('fillKey'));
            else payload.keyMode = 'keep';
          }
          if (!existing) {
            if (!name) throw new Error(t('fillName'));
            if (!payload.tunnelId) throw new Error(t('fillTunnelId'));
            if (overwriteArmed && armedName === name) payload.overwrite = true;
            let res = null;
            try {
              res = await api('/api/tunnels', { method: 'POST', body: payload });
            } catch (e) {
              if (!(e.data && e.data.code === 'tunnel_exists')) throw e;
              overwriteArmed = true;
              armedName = name;
              armOverwrite(bodyEl, btn, name);
              return true; // 表单保持打开，等用户再点一次确认覆盖
            }
            if (res && res.warning) toast(res.warning, 'info');
            else toast(t('tunnelCreated', { n: name }), 'ok');
          } else {
            const res = await api('/api/tunnels/' + encodeURIComponent(editName) + '/update', { method: 'POST', body: payload });
            if (res && res.warning) toast(res.warning, 'info');
            else toast(t('saved', { n: name }), 'ok');
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
      '<div id="dlProgress" class="hidden" style="margin-bottom:14px">' +
      '<div class="dl-head"><span id="dlStage">' + esc(t('dlStage_prepare')) + '</span><span id="dlPct" class="dl-pct">0%</span></div>' +
      '<div class="progress"><div class="progress-fill indeterminate"></div></div>' +
      '<div id="dlLog" class="mono" style="margin-top:10px;font-size:12.5px;color:var(--text-2);max-height:140px;overflow-y:auto;background:var(--surface-2);border-radius:8px;padding:10px 12px"></div></div>',
    dismissable: true,
    actions: [
      { label: t('close'), kind: 'ghost' },
      {
        label: t('startDownload'), kind: 'primary', icon: 'download',
        onClick: async (bodyEl, btn) => {
          $('#dlProgress', bodyEl).classList.remove('hidden');
          btn.classList.add('hidden');
          app.dlProgress = 0;
          await api('/api/runtime/fetch', { method: 'POST', body: {} });
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
    const data = await api('/api/runtime/job', { method: 'GET' });
    const job = data.job;
    const logEl = $('#dlLog', bodyEl);
    if (job && logEl) logEl.textContent = (job.lines || []).slice(-40).join('\n');
    /* 进度条跟着后端真实阶段走（下载百分比 → 校验 → 解压 → 写入），不再只停在假动画里等它忽然跳满 */
    if (job && job.running && typeof job.progress === 'number') {
      app.dlProgress = Math.max(app.dlProgress || 0, Math.round(job.progress));
      paintRuntimeProgress(bodyEl, app.dlProgress, job.stage);
    }
    if (job && !job.running) {
      app.jobPolling = false;
      if (job.ok) {
        paintRuntimeProgress(bodyEl, 100, 'done');
        toast(t('runtimeReadyToast'), 'ok');
        setTimeout(() => { closeModal(); if (!document.hidden) refreshState(true); }, 900);
      } else {
        const fill = $('.progress-fill', bodyEl);
        if (fill) { fill.style.width = '100%'; fill.style.background = 'var(--red)'; }
        if (fill) fill.classList.remove('indeterminate');
        const lab = $('#dlStage', bodyEl);
        if (lab) lab.textContent = t('dlStage_failed');
        toast(t('downloadFailed') + (job.error || t('unknownError')), 'err');
        if (!document.hidden) refreshState(true);
      }
      return;
    }
  } catch (e) { /* 继续轮询 */ }
  setTimeout(() => pollRuntimeJob(bodyEl), 800);
}

/* 把后端上报的百分比与阶段画到进度条上；不到 2% 保持流动条，免得看起来"卡在 0%" */
function paintRuntimeProgress(bodyEl, percent, stage) {
  const p = Math.max(0, Math.min(100, Math.round(percent || 0)));
  const fill = $('.progress-fill', bodyEl);
  if (fill) {
    if (p < 2) {
      fill.classList.add('indeterminate');
    } else {
      fill.classList.remove('indeterminate');
      fill.style.width = p + '%';
    }
  }
  const pct = $('#dlPct', bodyEl);
  if (pct) pct.textContent = p + '%';
  const lab = $('#dlStage', bodyEl);
  if (lab) lab.textContent = p >= 100 ? t('dlStage_done') : t('dlStage_' + (stage || 'download'));
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
          await api('/api/runtime/import', { method: 'POST', body: { zipPath, version: version || undefined } });
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
  try { data = await api('/api/templates', { method: 'GET' }); } catch (e) { toast(e.message, 'err'); return; }
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
          const data = await api('/api/import/apply', { method: 'POST', body });
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
    body.innerHTML = '<div style="color:var(--text-3);font-size:13.5px;display:flex;align-items:center;gap:8px;padding:12px 0"><span class="ico" style="animation:indet 1.2s infinite">' + icon('refresh') + '</span>' + esc(t('imScanning')) + '</div>';
    api('/api/import/scan', { method: 'GET' }).then((data) => {
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
          '<div class="card-title"><span class="ico">' + icon('download') + '</span>' + esc(f.source) + ' <span class="pill blue">' + esc(t('imServersN', { n: f.servers.length })) + '</span></div>' +
          '<div class="card-sub mono">' + esc(f.file) + '</div>' +
        '</div></div><div class="card-body" style="padding-top:4px">';
        f.servers.forEach((sv) => {
          h += '<label style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;font-size:13.5px;cursor:pointer;border-bottom:1px solid var(--border)">' +
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
            h += '<label style="display:flex;align-items:center;gap:8px;padding:5px 0;font-size:13.5px;cursor:pointer;border-bottom:1px solid var(--border)">' +
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
  $('#btnRefresh').addEventListener('click', refreshNow);
  // 折叠区（常见问题等）的展开状态记下来，后台刷新时按原样还原，不打断阅读
  $('#content').addEventListener('toggle', (e) => {
    const d = e.target;
    if (!d || d.tagName !== 'DETAILS' || !d.dataset || !d.dataset.dk) return;
    if (d.open) app.openDetails[d.dataset.dk] = true; else delete app.openDetails[d.dataset.dk];
  }, true);
  // 图文教程（第三步 / 第五步）：默认展开，用户收起过就记住这次选择，后台刷新不再自动铺开
  $('#content').addEventListener('toggle', (e) => {
    const d = e.target;
    if (!d || d.tagName !== 'DETAILS' || !d.dataset || !d.dataset.tut) return;
    app.tutClosed[d.dataset.tut] = !d.open;
  }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  /* 窗口缩到托盘 / 标签页切到后台时暂停所有轮询，回来时立即补一次刷新 */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearTimeout(app.pollTimer);
      clearInterval(app.logTimer);
    } else {
      refreshState(true);
      if (app.view === 'logs' && app.logAuto) scheduleLogPoll();
    }
  });
  // 支持入口统一走事件委托：侧边栏常驻入口、概览提示条、设置页「关于」都用同一套动作
  document.addEventListener('click', (e) => {
    const el = e.target && e.target.closest ? e.target.closest('[data-support]') : null;
    if (!el) return;
    const act = el.dataset.support;
    if (act === 'star') openStarPage();
    else if (act === 'coffee') showSupportModal({});
    else if (act === 'dismiss') dismissSupportHint();
  });
  refreshState(false);
});
