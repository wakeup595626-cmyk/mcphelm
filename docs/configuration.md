# 配置参考

> 返回 [README](../README.zh.md)

## 配置文件的查找顺序

按顺序取第一个命中的：

1. 命令行 `--config <文件>`（相对路径按当前目录解析）
2. 环境变量 `MCPHELM_CONFIG`（同理）
3. 当前工作目录下的 `mcphelm.config.json`
4. `~/.mcphelm/config.json`

`mcphelm config path` 会打印实际生效的路径以及它是从哪一层来的。`mcphelm init` 默认在**当前目录**创建 `mcphelm.config.json`，也可以用 `mcphelm init --path other.json`。

## 顶层结构

```json
{
  "version": 1,
  "servers": [],
  "tunnels": [],
  "defaults": { "healthPort": 8080 }
}
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `version` | `1` | 是 | 配置格式版本，目前只支持 `1` |
| `servers` | 数组 | 是 | 本地 MCP 服务器登记表（可以为空数组） |
| `tunnels` | 数组 | 是 | 隧道登记表（可以为空数组） |
| `defaults.healthPort` | 数字 | 否 | 所有隧道的默认健康端点端口，默认 `8080` |

## servers[]：本地 MCP 服务器

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `name` | 字符串 | 是 | 服务器标识。只允许字母、数字与 `.` `_` `-`，最长 40 字符，且必须以字母或数字开头；隧道通过这个名字引用它 |
| `kind` | `"stdio"` 或 `"http"` | 是 | 服务器类型 |
| `command` | 字符串 | stdio 必填 | 完整启动命令，例如 `npx -y @scope/server` 或 `python -m my_server --stdio` |
| `url` | 字符串 | http 必填 | MCP 端点地址，例如 `http://127.0.0.1:3001/mcp` |
| `headers` | 对象 | 否 | 仅 http：额外请求头，会被逐个转成官方的 `--mcp.extra-headers` |
| `description` | 字符串 | 否 | 备注，显示在 `server list` 与面板里 |

CLI 等价写法：

```bash
mcphelm server add code --command "npx -y @modelcontextprotocol/server-everything" --description "示例"
mcphelm server add web --url "http://127.0.0.1:3001/mcp" --header "Authorization: Bearer t" --header "X-Env: dev"
```

## tunnels[]：隧道

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `name` | 字符串 | 是 | 本地隧道名（命名规则同 `servers[].name`） |
| `tunnelId` | 字符串 | 是 | OpenAI 平台生成的隧道 ID：`tunnel_` + 32 位小写十六进制 |
| `server` | 字符串 | 是 | 引用 `servers[]` 中的某个 `name` |
| `apiKeyEnv` | 字符串 | 否（推荐） | 从这个环境变量读取 runtime key，默认写 `CONTROL_PLANE_API_KEY` |
| `apiKey` | 字符串 | 否 | 把 key 明文写进配置。仅适合本地临时场景，展示时会被打码 |
| `healthPort` | 数字 | 否 | 该隧道的健康端点端口；不写就用 `defaults.healthPort` |
| `extraArgs` | 字符串数组 | 否 | 原样追加到官方 `run` 命令后面的高级参数 |

CLI 等价写法：

```bash
mcphelm tunnel add code --tunnel-id tunnel_0123456789abcdef0123456789abcdef --server code --health-port 8090
mcphelm tunnel add code --tunnel-id tunnel_... --server code --arg "--log.level=debug"
```

> `apiKeyEnv` 与 `apiKey` 同时存在时优先用环境变量。两者都没有会在体检里报一条 warn，启动时直接失败并提示你补配置。

## 环境变量

| 变量 | 作用 |
| --- | --- |
| `CONTROL_PLANE_API_KEY` | 默认的 runtime key 来源（名字由每条隧道的 `apiKeyEnv` 决定，这只是默认值） |
| `MCPHELM_CONFIG` | 指定配置文件路径，等价于 `--config` |
| `MCPHELM_HOME` | 改变主目录（默认 `~/.mcphelm`），状态、日志、运行时都跟着走；测试与多套配置并行时很有用 |
| `MCPHELM_TUNNEL_CLIENT` | 直接指定一个已有的 tunnel-client 运行时二进制路径 |

## 目录布局

```text
~/.mcphelm/
  config.json            主目录配置（项目配置不存在时生效）
  bin/
    tunnel-client-runtime        官方运行时（Windows 上是 .exe）
  run/
    <隧道名>.json         运行状态文件
  logs/
    <隧道名>.log          隧道日志
```

状态文件里实际记录的内容（`run/<名字>.json`）：

| 字段 | 说明 |
| --- | --- |
| `name` | 隧道名 |
| `pid` | 运行时子进程 PID |
| `server` | 绑定的服务器名 |
| `tunnelIdMasked` | 打码后的隧道 ID（只保留前 11 位） |
| `healthAddr` | 健康端点地址，形如 `127.0.0.1:8080` |
| `logFile` | 该隧道的日志文件路径 |
| `runtimePath` | 实际使用的运行时二进制 |
| `args` | 实际传给运行时的参数（不含任何密钥） |
| `startedAt` | 启动时间（ISO 8601） |

状态文件本身就是"这个隧道在跑吗"的唯一依据：`mcphelm status` 会读它、检查 PID 是否还活着，进程没了就显示为 `stale`，`mcphelm stop` 可以清理这种残留。

## `config validate` 会报什么

错误（error，会阻止启动）：

- 配置版本不是 `1`
- 服务器名/隧道名非法（含空格、中文、超长等）
- 服务器或隧道重名
- stdio 服务器没有 `command`
- http 服务器没有 `url`
- 隧道 ID 不是 `tunnel_` + 32 位小写十六进制
- 隧道引用了不存在的服务器
- `healthPort` 不在 1–65535 范围内

警告（warn，不阻止启动）：

- http 服务器的 `url` 不是 `http(s)://` 开头
- 隧道既没有 `apiKeyEnv` 也没有 `apiKey`

## 两个完整示例

### 例 1：最小可用（stdio）

```json
{
  "version": 1,
  "servers": [
    {
      "name": "code",
      "kind": "stdio",
      "command": "npx -y @modelcontextprotocol/server-everything",
      "description": "本机示例服务器"
    }
  ],
  "tunnels": [
    {
      "name": "code",
      "tunnelId": "tunnel_0123456789abcdef0123456789abcdef",
      "server": "code",
      "apiKeyEnv": "CONTROL_PLANE_API_KEY"
    }
  ],
  "defaults": { "healthPort": 8080 }
}
```

### 例 2：HTTP + 请求头 + 多隧道 + 独立端口

```json
{
  "version": 1,
  "servers": [
    {
      "name": "web",
      "kind": "http",
      "url": "http://127.0.0.1:3001/mcp",
      "headers": {
        "Authorization": "Bearer local-token",
        "X-Env": "dev"
      },
      "description": "本地 HTTP MCP 服务"
    },
    {
      "name": "tools",
      "kind": "stdio",
      "command": "node C:/work/mcp-tools/dist/index.js --stdio"
    }
  ],
  "tunnels": [
    {
      "name": "web-dev",
      "tunnelId": "tunnel_0123456789abcdef0123456789abcdef",
      "server": "web",
      "apiKeyEnv": "CONTROL_PLANE_API_KEY",
      "healthPort": 8081
    },
    {
      "name": "tools",
      "tunnelId": "tunnel_fedcba9876543210fedcba9876543210",
      "server": "tools",
      "apiKeyEnv": "CONTROL_PLANE_API_KEY",
      "healthPort": 8082
    }
  ],
  "defaults": { "healthPort": 8080 }
}
```

改完配置建议跑一次 `mcphelm config validate` 和 `mcphelm doctor`。

