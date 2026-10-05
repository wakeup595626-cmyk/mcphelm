# 架构与原理

> 返回 [README](../README.md)

## 组件构成

| 模块 | 文件 | 职责 |
| --- | --- | --- |
| CLI 入口 | `src/cli.ts` | 解析命令行、分发子命令、渲染输出（含 `--json`） |
| 配置层 | `src/store.ts` | 配置类型、校验规则、读取/原子写入、key 解析 |
| 路径解析 | `src/paths.ts` | 配置文件查找顺序、主目录与状态/日志/运行时目录 |
| 运行时管理 | `src/tunnelclient.ts` | 发现运行时、查询官方版本、下载、SHA-256 校验、解压、安装 |
| 隧道生命周期 | `src/runtime.ts` | 构造启动参数、后台拉起进程、状态文件、停止、日志读取 |
| 环境体检 | `src/doctor.ts` | 逐项检查并把问题映射成 pass/info/warn/fail |
| 本地面板 | `src/panel/server.ts`、`src/panel/web/` | HTTP 服务、JSON 接口、零 CDN 前端 |
| 公共工具 | `src/util.ts` | 颜色、宽字符表格、原子写、进程存活判断、进程树终止、空闲端口 |
| 品牌与链接 | `src/brand.ts` | 名称、版本、配置文件名、环境变量前缀、官方文档链接 |
| 桌面壳 | `desktop/main.cjs` | Electron 主进程：复用 dist/ 的配置与面板逻辑，把面板装进原生窗口（单实例、中文菜单、自动空闲端口） |

项目是纯 ESM + TypeScript，编译到 `dist/` 后用 Node 直接运行；**没有任何运行时依赖**，只使用 Node 内置模块。

## 数据流

```text
        mcphelm start code
             │
             │ 1) 读配置、校验（store / paths）
             │ 2) 解析 runtime key（只从环境变量或本地配置读，不打日志）
             │ 3) 找运行时二进制（~/.mcphelm/bin 或 MCPHELM_TUNNEL_CLIENT）
             │ 4) 选健康端点端口（优先 healthPort，被占用则挑空闲端口）
             ▼
   spawn(detached) ──► tunnel-client-runtime run --control-plane.tunnel-id=... ...
             │                    │
             │                    ├─ stdio：按 --mcp.command 拉起你的 MCP 服务器并与其通信
             │                    ├─ http ：把平台请求转发到 --mcp.server-url
             │                    └─ 健康端点：http://127.0.0.1:<port>/healthz、/readyz
             │
             ├─ 标准输出/错误 → 追加写入 ~/.mcphelm/logs/<名字>.log
             └─ 写入运行状态 → ~/.mcphelm/run/<名字>.json（PID、健康端点、启动时间、参数）
```

## 进程模型

`mcphelm` 自己是**短命进程**：`start` 把官方 runtime 以 detached 方式拉起、`unref()` 之后立刻退出，隧道继续在后台跑。所以：

- 关掉终端、关掉面板，都不影响已经启动的隧道；
- "某条隧道在不在跑"完全由 `~/.mcphelm/run/<名字>.json` + PID 存活判断决定；
- `status`、`stop`、`logs`、面板都只是读这份状态文件，不需要常驻服务。

Windows 上子进程用 `windowsHide: true` 启动，不会弹黑框。

## 桌面版（Electron 外壳）

`desktop/main.cjs` 是 Electron 主进程，**不重新实现任何业务逻辑**，只做三件事：

1. **启动后端**：按"用户主目录"解析路径（配置不存在就先落一份空的），调用同一个 `startPanel()`，端口传 `0` 让系统分配空闲端口，永远不会和别的程序抢；
2. **创建原生窗口**：1240×820，`contextIsolation` 开、`nodeIntegration` 关、`sandbox` 开；站内链接留在窗口里，外部链接交给系统浏览器；
3. **管理生命周期**：单实例锁（再次启动会把已有窗口提到前台）、中文菜单（打开配置/日志目录、官方文档、项目主页），退出时关闭面板服务器。

打包由 `electron-builder` 完成（配置在 `electron-builder.yml`）：Windows NSIS 安装向导，支持自选安装目录、桌面与开始菜单快捷方式、按用户级安装（不写系统目录）；产物输出到 `release/`。应用图标由 `build/gen-icon.cjs` 生成（纯 Node 手写光栅化，无第三方依赖）；本地调试用 `npm run desktop`，打包用 `npm run dist:win`。

## 启动参数是怎么拼出来的

| 参数 | 何时出现 | 说明 |
| --- | --- | --- |
| `run` | 总是 | 官方 runtime 的运行子命令 |
| `--control-plane.tunnel-id=<id>` | 总是 | 你的隧道 ID |
| `--health.listen-addr=127.0.0.1:<port>` | 总是 | 本机健康端点监听地址 |
| `--mcp.command=<完整命令>` | stdio 服务器 | 整条命令作为一个参数传给官方 runtime，由它自己拉起子进程 |
| `--mcp.server-url=<url>` | http 服务器 | 由官方 runtime 转发请求 |
| `--mcp.extra-headers=Key: Value` | 配置了 `headers` 时 | 每个请求头一个参数 |
| `<extraArgs...>` | 配置了 `extraArgs` 时 | 原样追加，方便使用官方的高级开关 |
| 环境变量 `CONTROL_PLANE_API_KEY` | 总是（除非 dry-run） | 唯一的密钥通道 |

想确认实际命令，用 `mcphelm start <名字> --dry-run`，或者看日志文件开头的那段头部信息——启动时会把完整命令写进去（不含密钥）。

## 端口是怎么选的

1. 先看隧道的 `healthPort`，没有就看 `defaults.healthPort`（默认 `8080`）；
2. 试着在这个端口上监听，如果被占用（包括被别的隧道占了），自动换一个系统分配的空闲端口；
3. 最终用的地址写进状态文件，所以 `status` 与 `stop` 永远知道真实端口。

## 停止是怎么做的

`mcphelm stop`（以及面板上的停止按钮）走同一条路径：

1. 读状态文件；进程已经不存在 → 直接清理残留状态，报告"已清理"；
2. 终止整棵进程树：Windows 用 `taskkill /T /F`（失败自动重试 3 次，仍不行再用 `SIGKILL` 兜底）；macOS / Linux 先 `SIGTERM`，超时后升级到 `SIGKILL`；
3. 确认进程真的没了才删除状态文件，否则如实报错并给出提示。

## 日志

- 每次启动都会在日志开头追加一段头部：时间、完整命令、MCP 目标、健康端点；
- 官方 runtime 的 stdout / stderr 直接追加进同一个文件；
- `readLogTail` 只读取文件**尾部最多 512 KB**，避免日志大了之后把内存拖爆；面板接口再限制最多 2000 行；
- `logs --follow` 用 400ms 轮询增量读取，不依赖跨平台差异较大的文件监听 API。

## 运行时的发现与校验

发现顺序：显式指定 → 环境变量 `MCPHELM_TUNNEL_CLIENT` → `~/.mcphelm/bin/` → 当前目录 → `PATH`。找到后执行一次 `--version` 确认可执行。

下载安装流程：

1. 查询 `https://api.github.com/repos/openai/tunnel-client/releases/latest` 拿版本号；
2. 组装资源名 `tunnel-client-runtime-<vX.Y.Z>-<platform>-<arch>.zip`；
3. 下载到临时目录（带进度）；`runtime import` 则直接用你给的本地 zip；
4. 计算本地 SHA-256，与官方 `SHA256SUMS.txt` 中该文件的哈希强制比对，不一致直接中止；
5. 解压：Windows 先 `tar` 后 PowerShell `Expand-Archive`；macOS 先 `ditto` 后 `tar`；Linux 先 `unzip`、再 `tar`、最后 `python3 -m zipfile`；
6. 在解压结果里找到 runtime 二进制，复制到 `~/.mcphelm/bin/`（POSIX 上补 `755` 权限），再执行一次 `--version` 确认可用；
7. 临时目录在 `finally` 里清理。

## 本地面板

- 静态资源在构建时从 `src/panel/web` 复制到 `dist/panel/web`，由 `panel/server.ts` 直接读文件返回；
- 请求路径先做 `resolve` 归一化，必须落在 web 目录内，否则 403（防目录穿越）；
- `/api/*` 之外只允许 `GET`；
- 每条隧道的 start / stop 有一把内存里的"忙"锁，重复点击会拿到 `409` 而不是并发操作；
- 前端是原生 HTML/CSS/JS，无 CDN、无框架、无外链请求。

## 跨平台差异一览

| 场景 | Windows | macOS | Linux |
| --- | --- | --- | --- |
| 运行时文件名 | `tunnel-client-runtime.exe` | `tunnel-client-runtime` | `tunnel-client-runtime` |
| 资源标签 | `windows` / `amd64` `arm64` | `darwin` / `amd64` `arm64` | `linux` / `amd64` `arm64` |
| 解压首选 | `tar`（Win10+ 自带） | `ditto` | `unzip` |
| 进程树终止 | `taskkill /T /F` + 重试 | `SIGTERM` → `SIGKILL` | `SIGTERM` → `SIGKILL` |
| 后台启动 | detached + windowsHide | detached | detached |

