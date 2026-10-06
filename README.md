# MCPHelm

English | [中文](README.zh.md)

**A local control center that connects your local MCP servers to ChatGPT / Codex through the official Secure MCP Tunnel**: register servers, bring a tunnel up, and manage it from a desktop window, a local web panel or the CLI.

[![CI](https://github.com/wakeup595626-cmyk/mcphelm/actions/workflows/ci.yml/badge.svg)](https://github.com/wakeup595626-cmyk/mcphelm/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20.11-339933.svg)](package.json)

## Developer preview

MCPHelm is an **early 0.1.x release** (the first public version was 0.1.0) and is still iterating quickly: **the CLI flags and the config format may still change in incompatible ways.**

Windows users can install the packaged app straight from [Releases](https://github.com/wakeup595626-cmyk/mcphelm/releases); the package is not published to npm yet, so other platforms run from source.

## What it is

The OpenAI Secure MCP Tunnel lets ChatGPT / Codex reach MCP servers running on your own machine without exposing them to the public internet: the official `tunnel-client` opens an outbound connection from your machine, and the platform finds you by tunnel ID.

The official tool is a command-line binary. Past the first tunnel, everyday questions turn into manual work: which tunnel maps to which server, which environment variable holds the key, is the health port taken, where are the logs, is the process still alive. MCPHelm adds a **control center that runs only on your machine**:

- one config file that registers your local MCP servers and tunnels;
- one set of commands that manages their lifecycle (start, stop, status, logs, doctor);
- one local-only web panel that lays out status, health probes and logs.

It ships **no license key, activation or validation logic**, and it never asks you to hand your key to a third party: you create the runtime key on the OpenAI platform and keep it in your own environment variables.

## Features

- **Multi-server / multi-tunnel registry**: one `mcphelm.config.json` instead of copying tunnel IDs around.
- **Both kinds of MCP servers**: stdio (full command line) and HTTP (endpoint plus custom headers), each with a connectivity test before you save it.
- **One-command lifecycle**: `mcphelm start code`, `mcphelm start --all`; `--dry-run` prints the exact command first.
- **Crash recovery**: the supervisor restarts with exponential backoff, records exit codes and gives up after a limit instead of looping forever.
- **State and health probes**: process state, PID, uptime, plus `/healthz` and `/readyz` results at a glance.
- **Centralized logs with rotation**: every run appends to `~/.mcphelm/logs/<name>.log`, archives past 5 MB, keeps 3 files, and `--follow` tails live.
- **Environment doctor**: `mcphelm doctor` checks the Node version, config, runtime, tunnel IDs, key availability, port conflicts, MCP reachability and log size in one pass.
- **One-click import**: scans Claude Desktop / Cursor / VS Code MCP configs, or takes a pasted `mcpServers` JSON: pick and move, overwrite duplicates if you want.
- **Templates and a component market**: filesystem / fetch / git / sqlite / everything are one click away, and the market installs other popular open-source MCP servers for you.
- **Local web panel**: `mcphelm panel`, a native front-end with zero CDN, bound to `127.0.0.1` only, a random access token per launch and Host / Origin header checks.
- **Bilingual UI**: the panel and the desktop app switch between 中文 and English instantly.
- **Scriptable**: `--json` output for `status`, `doctor`, `logs` and `config show`.
- **Runtime download with mandatory verification**: fetched from the official releases and refused unless it matches the official `SHA256SUMS.txt`.
- **Keys three ways**: environment variable (nothing on disk), Windows Credential Manager (key vault, recommended) or inline; the key is only passed to the child process through the environment, never logged, never written to state files, and always masked when displayed.
- **Zero runtime dependencies**: nothing to install at runtime; TypeScript and `types/node` are dev-only.
- **Cross-platform**: Windows / macOS / Linux on x64 and arm64, plus a Windows desktop app with an installer wizard.

## How it works

```text
┌──────────────────────────────┐
│ Local MCP servers            │   stdio: npx -y ...   HTTP: http://127.0.0.1:3001/mcp
└───────────────┬──────────────┘
                │ the official runtime spawns it (stdio) or forwards to it (HTTP)
┌───────────────▼──────────────┐
│ tunnel-client (local child)  │   official release binary, downloaded + SHA-256 verified by this tool
└───────────────┬──────────────┘
                │ outbound HTTPS, no inbound port needed
┌───────────────▼──────────────┐
│ OpenAI secure tunnel         │   tunnel_ + 32 lowercase hex chars
└───────────────┬──────────────┘
                │
┌───────────────▼──────────────┐
│ ChatGPT connector / Codex    │
└──────────────────────────────┘
```

This project only manages **your local side**: it does not proxy your traffic, does not store your data, and makes no network requests other than downloading the official runtime and the explicit `doctor --online` version check.

## Run

### Desktop app (Windows)

Prefer not to touch a terminal? Grab `MCPHelm-Setup-x.y.z.exe` from [Releases](https://github.com/wakeup595626-cmyk/mcphelm/releases) and double-click it; if you would rather not install anything, `MCPHelm-Portable-x.y.z.exe` runs on the spot without writing to the system.

- **Choose your install location**: the wizard lets you pick any drive or folder — C:, D:, wherever you like;
- **Feels like a normal app**: after installing you get MCPHelm icons on the desktop and in the Start menu — double-click to open the full interface, no terminal required;
- **No separate Node install**: the runtime ships inside the installer;
- **Data lives with the install**: the desktop app keeps its data in `<install dir>\data` (config, logs, runtime, exports), so it follows whichever drive you install to; on first launch it migrates an existing `~/.mcphelm` automatically;
- **Uninstall only removes the app**: remove it via Settings → Apps → MCPHelm; config, logs and runtime stay in `<install dir>\data` — upgrades and auto-updates leave them untouched too, so delete that folder manually only if you want it gone.

The window hosts this project's own local panel on an automatically chosen free port, bound to `127.0.0.1` only. Tray residency, minimize-to-tray on close, launch at login, disconnect notifications and auto-update all have switches in the interface.

> Only Windows installers are provided for now; macOS / Linux users run from source below.

### Run from source

Requires **Node.js 20.11+** (building and testing from source needs 22.18+ for native TypeScript type stripping). The package is not on npm yet:

```bash
git clone https://github.com/wakeup595626-cmyk/mcphelm.git
cd mcphelm
npm ci
npm run build
npm link        # afterwards you can run mcphelm from anywhere
```

## Quick start

### 1. Initialize and fetch the official runtime

```bash
mcphelm init                    # creates mcphelm.config.json in the current directory
mcphelm runtime fetch           # downloads the official tunnel-client and verifies SHA256SUMS.txt
```

### 2. Register local MCP servers

```bash
# stdio: provide the full command line
mcphelm server add code --command "npx -y @modelcontextprotocol/server-everything" --description "example MCP server"

# HTTP: provide the endpoint, repeat --header as needed
mcphelm server add web --url "http://127.0.0.1:3001/mcp" --header "Authorization: Bearer local-token"
```

### 3. Create a tunnel

Create the tunnel on the OpenAI platform first: <https://platform.openai.com/settings/organization/tunnels>

```bash
mcphelm tunnel add code --tunnel-id tunnel_0123456789abcdef0123456789abcdef --server code
```

### 4. Provide the runtime key through the environment

```powershell
# Windows PowerShell (current session)
$env:CONTROL_PLANE_API_KEY = "sk-..."

# Windows PowerShell (persistent user variable, reopen the terminal afterwards)
[Environment]::SetEnvironmentVariable('CONTROL_PLANE_API_KEY', 'sk-...', 'User')
```

```bash
# macOS / Linux
export CONTROL_PLANE_API_KEY="sk-..."
```

### 5. Doctor → dry run → start → logs → panel

```bash
mcphelm doctor                  # config, runtime, key, ports, MCP reachability
mcphelm start code --dry-run    # see the exact command first
mcphelm start code              # start, waiting up to 6s for the health endpoint
mcphelm logs code --follow      # live tail of the official runtime logs
mcphelm panel                   # open the local control center (127.0.0.1:7331)
```

`mcphelm start --all` starts everything, `mcphelm stop --all` stops everything.

## Command reference

| Command | Purpose |
| --- | --- |
| `mcphelm init` | Create the config file (`--path` for the filename, `--health-port` for the default port, `--force` to overwrite) |
| `mcphelm server add <name>` | Register an MCP server: stdio via `--command "..."`, HTTP via `--url <endpoint>` plus repeatable `--header "Key: Value"` |
| `mcphelm server list` | List registered servers (`--json`) |
| `mcphelm server remove <name>` | Remove a server (`--force` when a tunnel still references it) |
| `mcphelm tunnel add <name>` | Create a tunnel: `--tunnel-id tunnel_xxx` + `--server <name>`; optional `--api-key-env`, `--api-key`, `--health-port`, `--arg` |
| `mcphelm tunnel list` | List tunnels (`--json`, tunnel IDs masked) |
| `mcphelm tunnel remove <name>` | Remove a tunnel (`--force` handles a running process) |
| `mcphelm start <name...>` | Start one or more tunnels; `--all` for everything, `--dry-run` to only print the command, `--wait <seconds>` for the health-endpoint wait |
| `mcphelm stop <name...>` | Stop tunnels, `--all` for everything |
| `mcphelm status` | Show status; `--health` probes the health endpoints, `--json` for machines |
| `mcphelm logs <name>` | Show the last `--lines <n>` lines (default 60), `--follow` to stream |
| `mcphelm doctor` | Environment check; `--online` compares against the latest official release, `--json` for machines |
| `mcphelm panel` | Start the local panel: `--port` (default 7331), `--host` (default 127.0.0.1), `--no-open` |
| `mcphelm runtime path` | Show the runtime binary in use and where it came from |
| `mcphelm runtime fetch` | Download and install the official runtime (`--version vX.Y.Z`, `--force`, `--skip-verify`) |
| `mcphelm runtime import <zip>` | Install from a local archive (verification still on by default) |
| `mcphelm config path` | Show the effective config file and where it was resolved from |
| `mcphelm config show` | Print the config with secrets masked |
| `mcphelm config validate` | Validate the config and list every issue |

Global flags: `--config <file>`, `--json`, `--no-color`, `-h` / `--help`, `-v` / `--version`.

## Local panel

```bash
mcphelm panel                 # default http://127.0.0.1:7331 , picks a free port if 7331 is taken
mcphelm panel --port 8080     # use another port
mcphelm panel --no-open       # do not open a browser
```

The panel binds to `127.0.0.1` only (changing that with `--host` is **not** recommended), and the front-end is plain HTML/CSS/JS with no CDN. It shows status, health probes and recent logs per tunnel and can start/stop them. A small JSON API is available for your own scripts or status bar:

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/state` | Aggregated state: brand, config path, runtime, servers, tunnels, health |
| GET | `/api/doctor` | Doctor results; add `?online=1` for the latest-version check |
| GET | `/api/logs/<tunnel>?lines=200` | Log tail (max 2000 lines) |
| POST | `/api/tunnels/<tunnel>/start` | Start that tunnel |
| POST | `/api/tunnels/<tunnel>/stop` | Stop that tunnel |
| GET | `/api/version` | Version information |

```bash
curl http://127.0.0.1:7331/api/state
curl -X POST http://127.0.0.1:7331/api/tunnels/code/start
```

## Configuration and directories

Config resolution order (first match wins):

1. `--config <file>` on the command line
2. the `MCPHELM_CONFIG` environment variable
3. `mcphelm.config.json` in the current directory
4. `~/.mcphelm/config.json`

Minimal config:

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

Local files:

```text
~/.mcphelm/
  config.json           home config (used when no project config is found)
  bin/                  official tunnel-client runtime
  run/<tunnel>.json     runtime state: PID, health address, startedAt, args, log path
  logs/<tunnel>.log     tunnel logs, including a header per start with the full command
```

`MCPHELM_HOME` relocates the home directory, and `MCPHELM_TUNNEL_CLIENT` points at an existing runtime binary. The desktop app defaults to `<install dir>\data` as its data root (migrated from `~/.mcphelm` on first launch); the lookup order and layout above apply to the CLI. Field-by-field reference: [docs/configuration.md](docs/configuration.md).

## Security

- **Keys travel through the environment**: `apiKeyEnv` (default `CONTROL_PLANE_API_KEY`) is the recommended setup; the key is only injected into the child process environment and never appears in the command line, the logs or the state files.
- **Plaintext fallback**: the `apiKey` field exists for local temporary use only, and every display path (`config show`, `status`, `doctor`) masks it.
- **The panel is a local tool**: bound to `127.0.0.1` with no authentication — a deliberate trade-off. Do not forward it to the internet. See [docs/security.md](docs/security.md).
- **Supply chain**: the runtime binary comes from the official openai/tunnel-client releases and must match the official `SHA256SUMS.txt` before installation; a mismatch aborts, and only an explicit `--skip-verify` skips the check.
- **No telemetry**: apart from the runtime download and `doctor --online`, this project makes no network requests.

## FAQ

**Do I need an OpenAI account?**
Yes. The tunnel ID and runtime key are created on the OpenAI platform (see the official guide <https://developers.openai.com/api/docs/guides/secure-mcp-tunnels>). This tool only manages your local side.

**Is it free?**
This tool is free and open source. Your usage on the OpenAI platform is billed by OpenAI.

**Does it crack or bypass anything?**
No. There is no license key, activation or validation logic here, and the official binary is used as-is: this project only builds the documented arguments, starts the process and displays state.

**Can I run several tunnels at once?**
Yes — one runtime child process, one health port and one log file per tunnel.

**How do I uninstall it?**

```bash
npm uninstall -g mcphelm   # or delete the source directory and run npm unlink
```

Then delete `~/.mcphelm` (config, logs and runtime all live there) and remove the `CONTROL_PLANE_API_KEY` environment variable. The desktop app is removed through Settings → Apps: that only removes the program itself and keeps your data in `data\` under the install directory. More questions: [docs/faq.md](docs/faq.md).

## Relationship to the official project

- Official repository: <https://github.com/openai/tunnel-client> (Apache-2.0). This is an **independent third-party tool**: it does not modify or redistribute the official source, it only downloads the official release binaries on demand.
- Official guide: <https://developers.openai.com/api/docs/guides/secure-mcp-tunnels>.
- This project is not an OpenAI product and is not affiliated with or endorsed by OpenAI.

## Documentation

Most in-repo docs are written in Chinese (the primary audience):

- [docs/desktop-guide.md](docs/desktop-guide.md) — beginner walkthrough for the desktop app
- [docs/quickstart.md](docs/quickstart.md) — shortest path from zero to a working tunnel
- [docs/configuration.md](docs/configuration.md) — config fields, directories, validation rules
- [docs/architecture.md](docs/architecture.md) — process model, launch arguments, state and logs, panel API
- [docs/security.md](docs/security.md) — security model, key handling, threat boundaries
- [docs/faq.md](docs/faq.md) — frequently asked questions
- Chinese README: [README.zh.md](README.zh.md)

## Contributing

Issues and pull requests are welcome. Before submitting:

```bash
npm run typecheck
npm run build
npm test
```

See [CHANGELOG.md](CHANGELOG.md) for the change history.

## License

[Apache-2.0](LICENSE)

