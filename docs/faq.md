# 常见问题

> 返回 [README](../README.zh.md)

## 需要 OpenAI 账号吗？

需要。隧道 ID 和 runtime key 都在 OpenAI 平台创建：

- 隧道：<https://platform.openai.com/settings/organization/tunnels>
- key：<https://platform.openai.com/settings/organization/api-keys>
- 官方指南：<https://developers.openai.com/api/docs/guides/secure-mcp-tunnels>

本项目只负责**你本机这一侧**：登记服务器、拉起官方运行时、看状态。

## 这个工具收费吗？

本项目开源免费（Apache-2.0）。你在 OpenAI 平台上的实际用量按官方计费规则结算，与本项目无关。

## 它会破解或绕过什么吗？

不会。项目里没有授权码、激活、注册或许可校验机制，也不修改官方二进制的行为。它做的事只有：按官方文档拼参数、启动进程、读取官方健康端点、展示状态与日志。

## 支持哪些平台和架构？

Windows / macOS / Linux，x64（amd64）与 arm64。其他组合会在下载运行时那一步明确报错，而不是悄悄失败。

## 能同时跑多条隧道吗？

可以。每条隧道一个独立的官方运行时子进程、独立的健康端点端口、独立的日志文件与状态文件；`mcphelm start --all` 一次全拉起，`mcphelm status` 逐条列出。

## 桌面版和命令行版有什么区别？能装到 D 盘吗？

功能完全一样：桌面版就是把本地面板装进一个原生窗口，读写的是同一份 `~/.mcphelm/config.json`，装完之后命令行 `mcphelm` 也照用不误。

- **装到哪都行**：安装向导里可以改盘符和目录，C 盘、D 盘或者其他盘都可以；
- **桌面图标**：向导默认勾选桌面快捷方式和开始菜单项；
- **自动端口**：桌面版启动时自己挑一个空闲端口，只监听 `127.0.0.1`，不会和你别的程序抢端口。

## 桌面版怎么卸载？

系统「设置 → 应用 → MCPHelm」→ 卸载（开始菜单里也有卸载入口）。卸载不会删除 `~/.mcphelm` 里的配置、日志和运行时；想彻底清干净，见下一节。

## 端口被占用怎么办？

- 启动时会自动换用系统分配的空闲端口，不需要你操心；
- 想在启动前就发现冲突，`mcphelm doctor` 会逐个检查配置里的健康端口并给出 warn；
- 想固定端口，用 `mcphelm tunnel add ... --health-port 8090` 或直接在配置里写 `healthPort`。

## 怎么升级或更换官方运行时？

```bash
mcphelm runtime fetch --force              # 重装最新版
mcphelm runtime fetch --version v0.0.15    # 指定版本
mcphelm runtime import ./some-dir/tunnel-client-runtime-v0.0.15-windows-amd64.zip
mcphelm runtime path                       # 看看现在用的是哪一个
```

已经有现成的二进制（比如公司内网分发），也可以设 `MCPHELM_TUNNEL_CLIENT=/path/to/tunnel-client-runtime` 让本项目直接用它。

## 支持发布里的 cloudflared 变体吗？

目前不支持。本工具使用的是标准资产 `tunnel-client-runtime-<版本>-<平台>-<架构>.zip`；官方发布里还有 `cloudflared` 前缀的变体，本项目没有使用它们。

## 日志在哪里？

- 文件：`~/.mcphelm/logs/<隧道名>.log`，每次启动会追加一段带时间与完整命令的头部；
- 命令行：`mcphelm logs <名字> --lines 200`、`mcphelm logs <名字> --follow`；
- 面板：打开对应隧道就能看到最近日志（面板接口一次最多取 2000 行）。

## Windows 上怎么永久设置 runtime key？

```powershell
[Environment]::SetEnvironmentVariable('CONTROL_PLANE_API_KEY', 'sk-...', 'User')
```

写完要**新开一个终端**（或重启编辑器 / IDE）才看得到；`mcphelm doctor` 能告诉你当前终端到底有没有读到。

## 面板能远程访问吗？

默认不能：只绑定 `127.0.0.1`，而且没有鉴权。不建议用 `--host 0.0.0.0` 直接暴露，也不要反代到公网；确实需要远程访问时，请自己在前面加一层带认证的反向代理，并清楚这超出了本工具的安全模型（详见 [security.md](security.md)）。

## 有没有开机自启 / 系统服务？

没有，这是有意的设计选择：本项目不做常驻服务、不动系统配置。如果你需要它随开机跑，可以用系统自带的任务计划（Windows 任务计划程序、macOS launchd、Linux systemd user unit）包一层调用 `mcphelm start --all`，注意给服务进程也准备好环境变量。

## 怎么彻底卸载？

- 桌面版：系统「设置 → 应用 → MCPHelm」→ 卸载；
- 命令行版：

```bash
npm uninstall -g mcphelm    # 或：删除源码目录 + npm unlink
```

- `~/.mcphelm/`（配置、日志、状态、下载的运行时都在这里；先确认没有正在跑的隧道）
- 环境变量 `CONTROL_PLANE_API_KEY`（如果你只为它设置过）
- 如果改过 `MCPHELM_HOME` / `MCPHELM_CONFIG` / `MCPHELM_TUNNEL_CLIENT`，也一并清掉

## 为什么还要用这个，不直接用官方 CLI？

直接用官方 `tunnel-client` 完全可行，尤其是只跑一条隧道的时候。本项目的价值在于**多条隧道、多个服务器的日常管理**：一处登记、一条命令启停、状态与健康一目了然、日志集中存放、出问题有体检、还有一个本地面板。懒得记参数的时候，它更省事。

