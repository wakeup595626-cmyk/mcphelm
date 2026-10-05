# 更新日志

本项目的所有重要改动都会记录在这里。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

仓库地址：https://github.com/wakeup595626-cmyk/mcphelm

## [Unreleased]

### Fixed

- Windows 任务栏白色图标：主窗口图标改为 PNG 资源（优先 `icon-256.png`，依次回退 `icon-32.png`、`icon.ico`），并在创建后再显式 `setIcon` 一次，绕开被反复覆盖安装污染的 exe 图标缓存链路（此前托盘已改用 PNG，本次把窗口图标一并改掉）。
- 打包清单补齐 16/24/32/48/64/128/256 全部 PNG 尺寸，避免安装后出现「托盘图标缺 PNG 回退成白色」的情况。
- 已验证：全新安装路径 + 清理系统图标缓存后，任务栏按钮与桌面快捷方式均显示蓝色舵轮图标，且任务栏出现独立的「MCPHelm - 1 个运行窗口」按钮。

### Known limitations

- 从其他已声明 AppUserModelID 的应用（例如 Codex 自身）的进程树里启动桌面版时，Windows 会把窗口并入父应用的任务栏按钮（MSIX 父进程的 AUMID 会覆盖应用自设值）。正常双击桌面/开始菜单快捷方式启动不受影响。

## [0.1.0] - 2026-10-05

首个公开版本。目标是把"本地 MCP 服务器 ↔ ChatGPT / Codex"这条链路变成可管理、可观测、可脚本化的日常工具。

### Added

- 配置文件（`mcphelm.config.json`）与多服务器 / 多隧道注册表；支持 stdio 与 HTTP 两种 MCP 服务器，HTTP 型可携带自定义请求头（转发为官方 `--mcp.extra-headers`）。
- CLI 子命令：`init`、`server add|list|remove`、`tunnel add|list|remove`、`start`、`stop`、`status`、`logs`、`doctor`、`panel`、`runtime path|fetch|import`、`config path|show|validate`。
- 隧道生命周期管理：后台分离启动，记录 PID、启动时间与健康端点；停止时按进程树终止，并识别残留状态。
- `status --health` 探测本机健康端点的 `/healthz` 与 `/readyz`；`logs --follow` 实时跟随日志；`--json` 便于脚本消费。
- 本地面板（默认 http://127.0.0.1:7331 ）：纯原生前端、零 CDN，展示服务器 / 隧道 / 运行状态 / 健康探测 / 日志，并可直接 start / stop；同时提供只读 JSON 接口。
- `doctor` 环境体检：Node 版本、配置文件与内容、官方运行时、隧道 ID、runtime key、健康端口占用、MCP 端点可达性；`--online` 可顺带对比官方最新版本。
- 运行时管理：从 openai/tunnel-client 官方 releases 发现并下载对应平台压缩包，强制核对官方 `SHA256SUMS.txt` 后才安装；也支持 `runtime import` 导入本地压缩包。
- 跨平台：Windows / macOS / Linux，x64 与 arm64；解压按平台选择 `tar` / `Expand-Archive` / `ditto` / `unzip` / `python3` 并自动兜底。
- 桌面版（Windows）：Electron 外壳复用同一份配置与面板逻辑（自动选空闲端口、单实例、中文菜单），NSIS 安装向导支持**自选安装盘符与目录**、桌面与开始菜单快捷方式、按用户级安装；应用图标为纯 Node 生成的舵轮标志，无第三方图形依赖。
- 中英文双语文档（`README.md` / `README.en.md`）与 `docs/` 详解（快速开始、配置参考、架构、安全、FAQ）。
- GitHub Actions CI：Ubuntu × Node 22/24、Windows × Node 24，执行 `npm ci` → `typecheck` → `build` → `test`。

### Security

- runtime key 只在启动子进程时通过环境变量 `CONTROL_PLANE_API_KEY` 传入：不写入命令行（避免出现在进程列表里）、不写入日志、不写入状态文件；`config show` 与状态输出统一打码。
- 本地面板默认只监听 `127.0.0.1`，不对局域网或公网开放。
- 下载的运行时压缩包必须通过官方 SHA-256 校验才会安装，校验失败直接中止；只有显式加 `--skip-verify` 才会跳过。
- 不收集遥测；除"下载运行时"与显式的 `doctor --online` 外不发起网络请求。

### Notes

- 尚未发布到 npm：Windows 用户可从 GitHub Releases 下载 `MCPHelm-Setup-x.y.z.exe` 安装桌面版，其他平台用源码方式安装（README：`npm ci && npm run build && npm link`）。
- 桌面版打包命令：`npm run dist:win`（产出在 `release/`）；本地调试用 `npm run desktop`。
- 本项目是独立第三方工具，只按需下载 openai/tunnel-client 的官方发布二进制，不修改也不重新分发其源码；本项目非 OpenAI 官方产品。

[0.1.0]: https://github.com/wakeup595626-cmyk/mcphelm/releases/tag/v0.1.0
