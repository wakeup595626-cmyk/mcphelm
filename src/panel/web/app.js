'use strict';

const $ = (selector, root) => (root || document).querySelector(selector);

function el(tag, props, children) {
  const node = document.createElement(tag);
  if (props) {
    for (const key of Object.keys(props)) {
      const value = props[key];
      if (value === undefined || value === null || value === false) continue;
      if (key === 'class') node.className = String(value);
      else if (key === 'text') node.textContent = String(value);
      else if (key.slice(0, 2) === 'on' && typeof value === 'function') node.addEventListener(key.slice(2), value);
      else node.setAttribute(key, value === true ? '' : String(value));
    }
  }
  for (const child of children || []) {
    if (child === undefined || child === null) continue;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

async function requestJson(url, options) {
  const res = await fetch(url, options);
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const reason = data && (data.error || data.message) ? data.error || data.message : 'HTTP ' + res.status;
    throw new Error(reason);
  }
  return data;
}

const api = {
  state: () => requestJson('/api/state'),
  logs: (name, lines) => requestJson('/api/logs/' + encodeURIComponent(name) + '?lines=' + lines),
  doctor: (online) => requestJson('/api/doctor' + (online ? '?online=1' : '')),
  action: (name, action) =>
    requestJson('/api/tunnels/' + encodeURIComponent(name) + '/' + action, { method: 'POST' }),
};

const busy = new Set();
let latest = null;
let logTarget = null;
let logTimer = null;

function toast(message, kind) {
  const node = el('div', { class: 'toast ' + (kind || ''), text: message });
  $('#toasts').appendChild(node);
  setTimeout(() => node.remove(), 5200);
}

function fmtDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  if (total < 60) return total + ' 秒';
  const minutes = Math.floor(total / 60);
  if (minutes < 60) return minutes + ' 分 ' + (total % 60) + ' 秒';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + ' 小时 ' + (minutes % 60) + ' 分';
  return Math.floor(hours / 24) + ' 天 ' + (hours % 24) + ' 小时';
}

const STATE_TEXT = { running: '运行中', stopped: '未启动', stale: '残留状态', error: '异常' };

function healthDot(label, ok) {
  return el('span', { class: 'dot ' + (ok ? 'ok' : 'bad'), text: label + (ok ? ' ✓' : ' ✗') });
}

function tunnelCard(tunnel) {
  const state = tunnel.status.state;
  const pending = busy.has(tunnel.name);
  const card = el('div', { class: 'card' }, [
    el('div', { class: 'card-head' }, [
      el('h3', { text: tunnel.name }),
      el('span', { class: 'badge ' + state, text: STATE_TEXT[state] || state }),
    ]),
    el('dl', { class: 'meta' }, [
      el('div', {}, [el('dt', { text: 'tunnel id' }), el('dd', { text: tunnel.tunnelIdMasked })]),
      el('div', {}, [el('dt', { text: 'MCP 服务器' }), el('dd', { text: tunnel.server })]),
      el('div', {}, [el('dt', { text: 'PID' }), el('dd', { text: tunnel.status.pid === null ? '-' : String(tunnel.status.pid) })]),
      el('div', {}, [el('dt', { text: '已运行' }), el('dd', { text: state === 'running' ? fmtDuration(tunnel.status.uptimeMs) : '-' })]),
      el('div', {}, [el('dt', { text: '健康端点' }), el('dd', { text: tunnel.healthAddr || '-' })]),
      el('div', {}, [el('dt', { text: '本地目标' }), el('dd', { text: tunnel.target || '-' })]),
    ]),
  ]);

  const healthRow = el('div', { class: 'row' });
  if (state === 'running' && tunnel.health) {
    healthRow.appendChild(healthDot('/healthz', tunnel.health.healthz));
    healthRow.appendChild(healthDot('/readyz', tunnel.health.readyz));
    if (tunnel.health.error) healthRow.appendChild(el('span', { class: 'hint', text: tunnel.health.error }));
  } else if (state === 'running') {
    healthRow.appendChild(el('span', { class: 'dot', text: '健康端点探测中 …' }));
  } else {
    healthRow.appendChild(el('span', { class: 'dot', text: '未运行' }));
  }
  card.appendChild(healthRow);

  if (tunnel.lastError) {
    card.appendChild(el('div', { class: 'row' }, [el('span', { class: 'hint', text: tunnel.lastError })]));
  }

  const startBtn = el('button', {
    class: 'btn primary',
    type: 'button',
    disabled: pending || state === 'running',
    text: '启动',
    onclick: () => runAction(tunnel.name, 'start'),
  });
  const stopBtn = el('button', {
    class: 'btn danger',
    type: 'button',
    disabled: pending || (state !== 'running' && state !== 'stale'),
    text: '停止',
    onclick: () => runAction(tunnel.name, 'stop'),
  });
  const logBtn = el('button', {
    class: 'btn ghost',
    type: 'button',
    text: '日志',
    onclick: () => openLog(tunnel.name),
  });
  card.appendChild(el('div', { class: 'row' }, [startBtn, stopBtn, logBtn]));
  return card;
}

function serverCard(server) {
  return el('div', { class: 'card' }, [
    el('div', { class: 'card-head' }, [
      el('h3', { text: server.name }),
      el('span', { class: 'badge', text: server.kind }),
    ]),
    el('div', { class: 'row' }, [el('span', { class: 'meta-target', text: server.target })]),
    server.description ? el('div', { class: 'row' }, [el('span', { class: 'hint', text: server.description })]) : null,
  ]);
}

function render() {
  if (!latest) return;
  $('#brandName').textContent = latest.brand.name + ' v' + latest.panelVersion;
  $('#configPath').textContent = '配置文件：' + latest.configPath + '（' + latest.configScope + '）';
  const runtimeChip = $('#runtimeChip');
  if (latest.runtime.found) {
    runtimeChip.className = 'chip ok';
    runtimeChip.textContent = '运行时 v' + (latest.runtime.version || '未知');
    runtimeChip.title = latest.runtime.path || '';
  } else {
    runtimeChip.className = 'chip warn';
    runtimeChip.textContent = '未找到官方运行时 · 执行 mcphelm runtime fetch';
    runtimeChip.title = '';
  }

  const tunnels = $('#tunnels');
  tunnels.textContent = '';
  if (latest.tunnels.length === 0) {
    tunnels.appendChild(
      el('div', { class: 'empty', text: '还没有配置隧道。在命令行执行：mcphelm tunnel add <名称> --tunnel-id tunnel_xxx --server <服务器名>' })
    );
  } else {
    for (const tunnel of latest.tunnels) tunnels.appendChild(tunnelCard(tunnel));
  }
  const running = latest.tunnels.filter((item) => item.status.state === 'running').length;
  $('#tunnelHint').textContent = latest.tunnels.length === 0 ? '' : running + ' / ' + latest.tunnels.length + ' 正在运行';

  const servers = $('#servers');
  servers.textContent = '';
  if (latest.servers.length === 0) {
    servers.appendChild(el('div', { class: 'empty', text: '还没有注册 MCP 服务器。示例：mcphelm server add code --command "npx -y @modelcontextprotocol/server-filesystem D:\\work"' }));
  } else {
    for (const server of latest.servers) servers.appendChild(serverCard(server));
  }

  const footer = $('#footer');
  footer.textContent =
    '本地控制台 · 数据全部来自本机 · 运行目录 ' + latest.home + ' · 官方文档见 ' + latest.docs.secureTunnelGuide;
}

async function refresh() {
  try {
    latest = await api.state();
    render();
  } catch (err) {
    toast('读取状态失败：' + err.message, 'bad');
  }
}

async function runAction(name, action) {
  if (busy.has(name)) return;
  busy.add(name);
  render();
  try {
    const result = await api.action(name, action);
    toast(result.message || name + '：' + action + ' 完成', 'ok');
  } catch (err) {
    toast(name + ' ' + (action === 'start' ? '启动' : '停止') + '失败：' + err.message, 'bad');
  } finally {
    busy.delete(name);
    await refresh();
  }
}

async function loadLog() {
  if (!logTarget) return;
  try {
    const data = await api.logs(logTarget, 200);
    const box = $('#logBody');
    box.textContent = data.lines.length === 0 ? '（暂无日志）' : data.lines.join('\n');
    box.scrollTop = box.scrollHeight;
  } catch (err) {
    $('#logBody').textContent = '读取日志失败：' + err.message;
  }
}

function openLog(name) {
  logTarget = name;
  $('#logName').textContent = name;
  $('#drawer').hidden = false;
  void loadLog();
  if (logTimer) clearInterval(logTimer);
  logTimer = setInterval(() => {
    if ($('#logAuto').checked && !document.hidden) void loadLog();
  }, 2500);
}

function closeLog() {
  logTarget = null;
  $('#drawer').hidden = true;
  if (logTimer) {
    clearInterval(logTimer);
    logTimer = null;
  }
}

async function openDoctor() {
  const card = $('#doctorCard');
  card.hidden = false;
  const body = $('#doctorBody');
  body.textContent = '';
  body.appendChild(el('div', { class: 'check' }, [el('span', { class: 'hint', text: '正在体检 …' })]));
  try {
    const data = await api.doctor($('#doctorOnline').checked);
    body.textContent = '';
    for (const check of data.checks) {
      const row = el('div', { class: 'check' }, [
        el('span', { class: 'lvl ' + check.level, text: { pass: '通过', info: '提示', warn: '警告', fail: '失败' }[check.level] || check.level }),
        el('span', { class: 'title', text: check.title }),
        el('span', { class: 'detail', text: check.detail }),
      ]);
      if (check.hint) row.appendChild(el('span', { class: 'fix', text: '→ ' + check.hint }));
      body.appendChild(row);
    }
    const summary = data.summary;
    toast('体检完成：通过 ' + summary.pass + ' · 提示 ' + summary.info + ' · 警告 ' + summary.warn + ' · 失败 ' + summary.fail, summary.fail ? 'bad' : 'ok');
  } catch (err) {
    body.textContent = '体检失败：' + err.message;
  }
}

function bind() {
  $('#btnRefresh').addEventListener('click', () => {
    void refresh();
  });
  $('#btnDoctor').addEventListener('click', () => {
    void openDoctor();
  });
  $('#btnDoctorClose').addEventListener('click', () => {
    $('#doctorCard').hidden = true;
  });
  $('#doctorOnline').addEventListener('change', () => {
    void openDoctor();
  });
  $('#btnLogClose').addEventListener('click', closeLog);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeLog();
  });
}

bind();
void refresh();
setInterval(() => {
  if (!document.hidden) void refresh();
}, 4000);
