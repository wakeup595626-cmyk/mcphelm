# MCPHelm

**把本地 MCP 服务器安全接进 ChatGPT / Codex 的本地控制台**：注册服务器 → 拉起官方隧道 → 用桌面窗口、网页面板或命令行管理。

[![CI](https://github.com/wakeup595626-cmyk/mcphelm/actions/workflows/ci.yml/badge.svg)](https://github.com/wakeup595626-cmyk/mcphelm/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20.11-339933.svg)](package.json)

> **项目状态**：0.1.0 首个版本，尚未发布到 npm；Windows 安装包见 GitHub Releases。功能已经可用，CLI 与配置格式仍可能小幅调整。

## 这是什么

OpenAI 的安全隧道（Secure MCP Tunnel）让 ChatGPT / Codex 能连上你本机跑的 MCP 服务器，而不需要把服务暴露到公网：本机启动官方 `tunnel-client` 建立一个出站连接，平台侧按隧道 ID 找到你这条链路。

官方工具本身是一个命令行二进制。隧道一多，"哪条隧道对应哪个服务器、key 从哪个环境变量来、健康端点端口有没有被占、日志在哪里、进程还在不在"就变成了手工活。MCPHelm 给这套流程补上一个**本地控制台**：

- 一份配置文件登记本地 MCP 服务器和隧道；
- 一组命令管理它们的生命周期（启动、停止、状态、日志、体检）；
- 一个只监听本机的网页面板，把状态、健康探测和日志摊开给你看。

它**不含任何授权码、激活或校验逻辑**，也不需要你把自己的 key 交给任何第三方：`runtime key` 由你在 OpenAI 平台创建，只存在你的环境变量里。

## 工作方式

```text
┌──────────────────────────────┐
│ 你本机的 MCP 服务器           │   stdio：npx -y ...   HTTP：http://127.0.0.1:3001/mcp
└───────────────┬──────────────┘
                │ 官方 runtime 亲自拉起（stdio）或转发请求（HTTP）
┌───────────────▼──────────────┐
│ tunnel-client（本机子进程）    │   官方发布二进制，本项目负责下载 + SHA-256 校验
└───────────────┬──────────────┘
                │ 出站 HTTPS，无需公网入站端口
┌───────────────▼──────────────┐
│ OpenAI 安全隧道               │   tunnel_ + 32 位小写十六进制 ID
└───────────────┬──────────────┘
                │
┌───────────────▼──────────────┐
│ ChatGPT 连接器 / Codex        │
└──────────────────────────────┘
```

本项目是**你本机这一侧的管理工具**：它不代理你的流量，不转存你的数据，除了"下载官方运行时"和显式的 `doctor --online` 之外不发起网络请求。

## 特性

- **多服务器 / 多隧道注册表**：一份 `mcphelm.config.json` 管到底，不再到处抄 tunnel id。
- **两种 MCP 服务器都支持**：stdio（完整命令行）与 HTTP（端点 + 自定义请求头）。
- **一条命令启停**：`mcphelm start code`、`mcphelm start --all`；`--dry-run` 先打印将要执行的命令再决定。
- **状态与健康探测**：进程状态、PID、启动时长、`/healthz` 与 `/readyz` 探测结果一目了然。
- **日志集中管理**：每次启动自动写入 `~/.mcphelm/logs/<名字>.log`，`--follow` 实时跟随。
- **环境体检**：`mcphelm doctor` 一次检查 Node 版本、配置、运行时、隧道 ID、key、端口占用、MCP 端点可达性。
- **本地网页面板**：`mcphelm panel`，纯原生前端、零 CDN、只监听 `127.0.0.1`，可在线启停隧道、看日志。
- **可脚本化**：`status` / `doctor` / `logs` / `config show` 等支持 `--json`。
- **运行时自动下载 + 强制校验**：从官方 releases 下载对应平台压缩包，必须通过官方 `SHA256SUMS.txt` 校验才安装。
- **密钥不进命令行**：`runtime key` 只在启动子进程时通过环境变量传入，不落日志、不落状态文件，展示时统一打码。
- **零运行时依赖**：装完即用，供应链面小；只有开发期依赖 TypeScript 与 `@types/node`。
- **跨平台**：Windows / macOS / Linux，x64 与 arm64；Windows 另有带安装向导的桌面版。

## 桌面版（Windows）

不想碰命令行的话，装桌面版就行：到 [Releases](https://github.com/wakeup595626-cmyk/mcphelm/releases) 下载 `MCPHelm-Setup-x.y.z.exe`，双击安装。

- **自选安装位置**：安装向导里可以改盘符和目录，C 盘、D 盘或任意其他盘都行；
- **像普通软件一样用**：装完桌面和开始菜单会出现 MCPHelm 图标，双击打开就是完整界面，不用开终端；
- **不用另外装 Node**：运行环境打包在安装包里；
- **和命令行共用一份配置**：桌面版读写同一份 `~/.mcphelm/config.json`，两个入口随时切换；
- **卸载干净**：走系统「设置 → 应用 → MCPHelm」卸载（或开始菜单里的卸载入口）；`~/.mcphelm` 里的配置、日志、运行时不会被自动删除，想清干净手动删掉即可。

窗口内容就是本项目自带的本地面板：启动时自动挑一个空闲端口，只监听 `127.0.0.1`，看状态、启停隧道、翻日志都能在界面里点。

> 目前只提供 Windows 安装包，macOS / Linux 用户先走下面的命令行方式。

## 快速开始

要求 **Node.js 20.11 或更高**（从源码开发/跑测试需要 22.18+，因为用到 Node 原生的 TypeScript 类型擦除）。

### 1. 安装

包还没发布到 npm，当前请从源码安装：

```bash
git clone https://github.com/wakeup595626-cmyk/mcphelm.git
cd mcphelm
npm ci
npm run build
npm link        # 之后可以在任意目录直接用 mcphelm
```

### 2. 初始化并拉取官方运行时

```bash
mcphelm init                    # 在当前目录生成 mcphelm.config.json
mcphelm runtime fetch           # 下载官方 tunnel-client 并核对 SHA256SUMS.txt
```

### 3. 注册本地 MCP 服务器

```bash
# stdio 型：给一条完整的启动命令
mcphelm server add code --command "npx -y @modelcontextprotocol/server-everything" --description "示例 MCP 服务器"

# HTTP 型：给端点，可重复加请求头
mcphelm server add web --url "http://127.0.0.1:3001/mcp" --header "Authorization: Bearer local-token"
```

### 4. 建隧道

隧道 ID 在 OpenAI 平台创建：<https://platform.openai.com/settings/organization/tunnels>

```bash
mcphelm tunnel add code --tunnel-id tunnel_0123456789abcdef0123456789abcdef --server code
```

### 5. 配置 runtime key（放环境变量，别落盘）

```powershell
# Windows PowerShell：当前会话
$env:CONTROL_PLANE_API_KEY = "sk-..."

# Windows PowerShell：永久写入用户环境变量（重开终端生效）
[Environment]::SetEnvironmentVariable('CONTROL_PLANE_API_KEY', 'sk-...', 'User')
```

```bash
# macOS / Linux
export CONTROL_PLANE_API_KEY="sk-..."
```

### 6. 体检 → 试跑 → 启动 → 看日志 → 开面板

```bash
mcphelm doctor                  # 体检：配置、运行时、key、端口、MCP 可达性
mcphelm start code --dry-run    # 先看看将要执行的命令长什么样
mcphelm start code              # 真正启动，默认等健康端点就绪 6 秒
mcphelm logs code --follow      # 实时看官方 runtime 的日志
mcphelm panel                   # 打开本地控制台（默认 127.0.0.1:7331）
```

想一次全起来就是 `mcphelm start --all`，想停就是 `mcphelm stop --all`。

## 命令速查

| 命令 | 作用 |
| --- | --- |
| `mcphelm init` | 在当前目录创建配置文件（`--path` 指定文件名、`--health-port` 改默认端口、`--force` 覆盖） |
| `mcphelm server add <名字>` | 注册 MCP 服务器：stdio 用 `--command "..."`，HTTP 用 `--url <地址>` 加可重复的 `--header "Key: Value"` |
| `mcphelm server list` | 列出已登记的服务器（`--json`） |
| `mcphelm server remove <名字>` | 删除服务器（被隧道引用时需 `--force`） |
| `mcphelm tunnel add <名字>` | 建隧道：`--tunnel-id tunnel_xxx` + `--server <服务器名>`；可选 `--api-key-env`、`--api-key`、`--health-port`、`--arg` |
| `mcphelm tunnel list` | 列出隧道（`--json`，tunnel id 打码显示） |
| `mcphelm tunnel remove <名字>` | 删除隧道（`--force` 可连带处理运行中的进程） |
| `mcphelm start <名字...>` | 启动一条或多条隧道；`--all` 全部启动，`--dry-run` 只打印命令，`--wait <秒>` 设置等待健康端点的秒数 |
| `mcphelm stop <名字...>` | 停止隧道，`--all` 停止全部 |
| `mcphelm status` | 查看状态；`--health` 顺带探测健康端点，`--json` 输出 JSON |
| `mcphelm logs <名字>` | 查看日志，最后 `--lines <行数>` 行（默认 60），`--follow` 持续跟踪 |
| `mcphelm doctor` | 环境体检；`--online` 顺带对比官方最新版本，`--json` 输出 JSON |
| `mcphelm panel` | 启动本地面板：`--port`（默认 7331）、`--host`（默认 127.0.0.1）、`--no-open` |
| `mcphelm runtime path` | 显示当前使用的运行时二进制与来源 |
| `mcphelm runtime fetch` | 下载并安装官方运行时（`--version vX.Y.Z` 指定版本、`--force` 重装、`--skip-verify` 跳过校验） |
| `mcphelm runtime import <zip>` | 用本地压缩包安装运行时（同样默认强制校验） |
| `mcphelm config path` | 显示实际生效的配置文件路径与来源 |
| `mcphelm config show` | 打印配置内容（密钥自动打码） |
| `mcphelm config validate` | 校验配置并列出问题 |

全局参数：`--config <文件>` 指定配置文件、`--json` 结构化输出、`--no-color` 关闭彩色、`-h` / `--help` 帮助、`-v` / `--version` 版本。

## 本地面板

```bash
mcphelm panel                 # 默认 http://127.0.0.1:7331 ，端口被占用时自动换空闲端口
mcphelm panel --port 8080     # 换端口
mcphelm panel --no-open       # 不自动打开浏览器
```

面板只监听 `127.0.0.1`（可用 `--host` 改，但**不建议**），前端是零 CDN 的原生 HTML/CSS/JS，展示每条隧道的状态、健康探测、最近日志，并可以直接 start / stop。它也提供一小组 JSON 接口，方便你接到自己的脚本或状态栏里：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/state` | 汇总状态：品牌信息、配置路径、运行时、服务器、隧道、健康探测 |
| GET | `/api/doctor` | 体检结果；加 `?online=1` 顺带查官方最新版 |
| GET | `/api/logs/<隧道名>?lines=200` | 日志尾部（行数上限 2000） |
| POST | `/api/tunnels/<隧道名>/start` | 启动该隧道 |
| POST | `/api/tunnels/<隧道名>/stop` | 停止该隧道 |
| GET | `/api/version` | 版本信息 |

```bash
curl http://127.0.0.1:7331/api/state
curl -X POST http://127.0.0.1:7331/api/tunnels/code/start
```

## 配置文件与目录

配置查找顺序（谁先命中用谁）：

1. 命令行 `--config <文件>`
2. 环境变量 `MCPHELM_CONFIG`
3. 当前目录的 `mcphelm.config.json`
4. `~/.mcphelm/config.json`

最小可用配置：

```json
{
  "version": 1,
  "servers": [
    { "name": "code", "kind": "stdio", "command": "npx -y @modelcontextprotocol/server-everything" }
  ],
  "tunnels": [
    {
      "name": "code",
      "tunnelId": "tunnel_0123456789abcdef0123456789abcdef",
      "server": "code",
      "apiKeyEnv": "CONTROL_PLANE_API_KEY",
      "healthPort": 8080
    }
  ],
  "defaults": { "healthPort": 8080 }
}
```

本机的其他文件：

```text
~/.mcphelm/
  config.json           主目录配置（没用到项目配置时生效）
  bin/                  官方 tunnel-client 运行时
  run/<隧道名>.json      运行状态：PID、健康端点、启动时间、日志路径、实际参数
  logs/<隧道名>.log      隧道日志，含每次启动的时间与完整命令
```

`MCPHELM_HOME` 可以改主目录，`MCPHELM_TUNNEL_CLIENT` 可以直接指定一个已有的运行时二进制。字段级说明见 [docs/configuration.md](docs/configuration.md)。

## 安全说明

- **密钥走环境变量**：`apiKeyEnv`（默认 `CONTROL_PLANE_API_KEY`）是推荐做法，key 不落盘；只有启动子进程时才通过环境变量传给官方 runtime，不进命令行、不进日志、不进状态文件。
- **真的需要明文时**：`apiKey` 字段可以写进配置，但那是给本地临时场景用的；`config show`、`status`、`doctor` 一律打码输出。
- **面板是本地工具**：默认只绑定 `127.0.0.1`，且没有鉴权——这是有意的取舍，请不要把它转发到公网。细节与威胁模型见 [docs/security.md](docs/security.md)。
- **运行时可溯源**：下载的二进制来自 openai/tunnel-client 官方 releases，安装前强制比对官方 `SHA256SUMS.txt`；校验失败直接中止，只有显式 `--skip-verify` 才会跳过。
- **不收集任何遥测**：除下载运行时与 `doctor --online` 外，本项目不发起网络请求。

## 常见问题

**需要 OpenAI 账号吗？**
需要。隧道 ID 和 runtime key 都在 OpenAI 平台创建，参见官方指南 <https://developers.openai.com/api/docs/guides/secure-mcp-tunnels>；本项目只管本机侧。

**这个工具收费吗？**
本项目开源免费；你在 OpenAI 平台上的用量按官方计费规则结算。

**它会破解或绕过什么吗？**
不会。项目里没有授权码、激活或校验逻辑，也不修改官方二进制的行为——它只负责按官方文档构造参数、启动进程、展示状态。

**能同时跑多条隧道吗？**
可以。每条隧道是独立的 runtime 子进程，各有自己的健康端点端口与日志文件。

**怎么卸载？**
```bash
npm uninstall -g mcphelm   # 或删除源码目录并 npm unlink
```
然后删除 `~/.mcphelm`（配置、日志、运行时都在里面），并清掉 `CONTROL_PLANE_API_KEY` 环境变量。桌面版则在系统「设置 → 应用」里卸载，它同样不会动 `~/.mcphelm`。

更多问答见 [docs/faq.md](docs/faq.md)。

## 与官方项目的关系

- 官方仓库：<https://github.com/openai/tunnel-client>（Apache-2.0）。本项目是**独立第三方工具**，不修改、不重新分发官方源码，只按需下载其官方发布二进制。
- 官方指南：<https://developers.openai.com/api/docs/guides/secure-mcp-tunnels>。
- 本项目不是 OpenAI 官方产品，与 OpenAI 无隶属或背书关系。

## 文档

- [docs/quickstart.md](docs/quickstart.md) — 从零到跑通的最短路径（含 Windows 与 macOS/Linux 写法）
- [docs/configuration.md](docs/configuration.md) — 配置字段、目录布局、校验规则
- [docs/architecture.md](docs/architecture.md) — 进程模型、启动参数、状态与日志、面板接口
- [docs/security.md](docs/security.md) — 安全模型、密钥处理、威胁边界
- [docs/faq.md](docs/faq.md) — 常见问题
- [README.en.md](README.en.md) — English version

## 贡献

欢迎 issue 与 PR。提交前请先跑：

```bash
npm run typecheck
npm run build
npm test
```

变更记录见 [CHANGELOG.md](CHANGELOG.md)。

## 许可证

[Apache-2.0](LICENSE)

