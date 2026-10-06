# 快速开始

> 返回 [README](../README.zh.md)

目标：用最短路径让 ChatGPT / Codex 通过安全隧道连上你本机的一个 MCP 服务器。

## 0. 先准备四样东西

| 需要什么 | 从哪里来 |
| --- | --- |
| Node.js 20.11+ | <https://nodejs.org>（从源码开发、跑测试需要 22.18+） |
| 一个 MCP 服务器 | 例如 `npx -y @modelcontextprotocol/server-everything`，或你自己的 HTTP 端点 |
| 一个隧道 ID | OpenAI 平台：<https://platform.openai.com/settings/organization/tunnels> |
| 一个 runtime key | 同上，或 <https://platform.openai.com/settings/organization/api-keys> |

## 1. 安装（源码方式）

包还没发布到 npm，直接从源码装：

```bash
git clone https://github.com/wakeup595626-cmyk/mcphelm.git
cd mcphelm
npm ci
npm run build
npm link
```

验证一下：`mcphelm --version`。如果 `npm link` 权限不够，也可以每次用 `node /path/to/mcphelm/dist/cli.js <命令>`。

## 2. 创建配置文件

```bash
mkdir my-tunnels && cd my-tunnels
mcphelm init
```

当前目录里会出现 `mcphelm.config.json`。`mcphelm config path` 可以随时告诉你"现在到底在用哪一份配置"。

## 3. 下载官方运行时

```bash
mcphelm runtime fetch
```

它会查询 openai/tunnel-client 的最新发布版，挑出当前平台/架构对应的压缩包，下载后与官方 `SHA256SUMS.txt` 比对，通过才安装到 `~/.mcphelm/bin/`。已经装好时不会重复下载；想强制重装加 `--force`，想指定版本用 `--version v0.0.15`。

## 4. 注册本地 MCP 服务器

stdio 型（给一条完整启动命令）：

```bash
mcphelm server add code --command "npx -y @modelcontextprotocol/server-everything" --description "Everything 示例"
```

HTTP 型（给端点，请求头可重复加）：

```bash
mcphelm server add web --url "http://127.0.0.1:3001/mcp" --header "Authorization: Bearer local-token"
```

看一眼：`mcphelm server list`。

## 5. 建隧道

在 OpenAI 平台创建隧道后把它给你的 ID 填进来（规则：`tunnel_` + 32 位小写十六进制）：

```bash
mcphelm tunnel add code --tunnel-id tunnel_0123456789abcdef0123456789abcdef --server code
```

## 6. 配置 runtime key

推荐放在环境变量里，配置文件中只写变量名（`apiKeyEnv`，默认 `CONTROL_PLANE_API_KEY`）。

Windows PowerShell：

```powershell
# 当前会话有效
$env:CONTROL_PLANE_API_KEY = "sk-..."

# 永久写入用户环境变量（需要重开终端）
[Environment]::SetEnvironmentVariable('CONTROL_PLANE_API_KEY', 'sk-...', 'User')
```

macOS / Linux：

```bash
export CONTROL_PLANE_API_KEY="sk-..."
# 想持久生效就写进 ~/.zshrc 或 ~/.bashrc
```

## 7. 体检

```bash
mcphelm doctor
```

每项给出 `pass` / `info` / `warn` / `fail`，fail 项自带下一步提示（例如"执行 mcphelm runtime fetch"）。加 `--online` 会顺便对比官方最新版本。

## 8. 启动并观察

```bash
mcphelm start code --dry-run    # 先看看将要执行的真实命令行
mcphelm start code              # 启动，默认等健康端点就绪 6 秒（--wait 0 表示不等）
mcphelm status --health         # 状态 + /healthz、/readyz 探测
mcphelm logs code --follow      # 实时跟随官方 runtime 的日志
```

## 9. 打开本地面板

```bash
mcphelm panel
```

默认 <http://127.0.0.1:7331>，面板里可以直接启停隧道、看日志和体检结果。

## 10. 收工

```bash
mcphelm stop code      # 停止一条
mcphelm stop --all     # 全部停止
```

## 出问题先看这张表

| 现象 | 怎么办 |
| --- | --- |
| `doctor` 说找不到运行时 | `mcphelm runtime fetch`（或 `runtime import` 导入离线包） |
| `doctor` 说 key 未就绪 | 确认 `apiKeyEnv` 指向的环境变量在**当前终端**可见；新设的环境变量要新开终端 |
| 健康端口被占用 | 启动时会自动改用空闲端口；也可以用 `--health-port` 或配置里的 `healthPort` 固定 |
| 启动后马上就没了 | `mcphelm logs <名字>` 看官方 runtime 到底报了什么 |
| 平台侧连不上 | 确认隧道 ID 与连接器属于同一个组织；ChatGPT 里已添加对应连接器 |
| 想确认到底跑了什么命令 | `mcphelm start <名字> --dry-run`，或看日志文件开头的一段 |

下一站：[配置参考](configuration.md) ｜ [架构与原理](architecture.md) ｜ [安全说明](security.md) ｜ [常见问题](faq.md)

## 组件市场：一键安装主流 MCP 服务器

不想手写命令？左侧「组件市场」里挑一个点「安装」，MCPHelm 会自动生成启动命令写进服务器列表，你再去「隧道」页给它建一条隧道就能用。

| 组件 | 干什么 | 来源（许可证） | 运行方式 |
| --- | --- | --- | --- |
| Serena 代码助手 | 读懂整个代码库，精准查找/改写代码 | oraios/serena（MIT） | uvx |
| Windows-MCP 桌面控制 | 看屏幕、操作 Windows 窗口 | CursorTouch/Windows-MCP（MIT） | uvx |
| Playwright 浏览器 | 自动开浏览器、点网页、截图 | microsoft/playwright-mcp（Apache-2.0） | npx |
| Filesystem 文件读写 | 读写指定文件夹 | 官方示例（MIT） | npx |
| Fetch 网页抓取 | 抓网页正文给模型读 | 官方示例（MIT） | uvx |
| Memory 持久记忆 | 跨会话记住偏好与背景 | 官方示例（MIT） | npx |

> 提示：npx 随 Node.js 自带；uvx 需要先装 uv。组件按需下载，不预打包，所以安装包保持小巧。

