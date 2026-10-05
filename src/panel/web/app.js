/* MCPHelm 控制台前端 */
'use strict';

/* ---------------- 工具 ---------------- */
const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

async function api(path, opts) {
  const res = await fetch(path, opts ? {
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

function fmtUptime(ms) {
  if (!ms || ms < 0) return '—';
  const s = Math.floor(ms / 1000);
  if (s < 60) return s + ' 秒';
  const m = Math.floor(s / 60);
  if (m < 60) return m + ' 分钟';
  const h = Math.floor(m / 60);
  if (h < 24) return h + ' 小时 ' + (m % 60) + ' 分';
  return Math.floor(h / 24) + ' 天 ' + (h % 24) + ' 小时';
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
};

const VIEW_META = {
  dashboard: { title: '概览', sub: '一眼看清整个接入进度' },
  tunnels: { title: '隧道', sub: '把本地 MCP 服务器安全地暴露给 ChatGPT' },
  servers: { title: '服务器', sub: '管理你本机的 MCP 服务器' },
  logs: { title: '日志', sub: '查看每条隧道的运行输出' },
  doctor: { title: '体检', sub: '自动检查环境和配置有没有问题' },
  settings: { title: '设置', sub: '查看路径、密钥状态与帮助入口' },
};

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
    (opts.actions || [{ label: '关闭', kind: 'ghost', close: true }]).forEach((a) => {
      const btn = document.createElement('button');
      btn.className = 'btn ' + (a.kind || 'ghost');
      btn.innerHTML = (a.icon ? '<span class="ico">' + icon(a.icon) + '</span>' : '') + esc(a.label);
      btn.addEventListener('click', async () => {
        if (a.onClick) {
          btn.classList.add('loading');
          btn.disabled = true;
          try { const keep = await a.onClick(body, btn); if (keep !== true) closeModal(); }
          catch (e) { toast(e.message || '操作失败', 'err'); }
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
        { label: '取消', kind: 'ghost', onClick: () => { resolve(false); } },
        { label: confirmLabel || '确定', kind: danger ? 'danger-soft' : 'primary', onClick: () => { resolve(true); } },
      ],
    });
  });
}

/* ---------------- 数据 ---------------- */
async function refreshState(silent) {
  try {
    app.state = await api('/api/state');
    renderShell();
    renderView();
    schedulePoll();
  } catch (e) {
    if (!silent) toast('无法连接本地服务：' + e.message, 'err');
  }
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
  if (!s.runtime.found) { envDot.className = 'dot dot-warn'; envText.textContent = '缺少运行环境'; }
  else if (errCount > 0) { envDot.className = 'dot dot-err'; envText.textContent = '配置有 ' + errCount + ' 个问题'; }
  else { envDot.className = 'dot dot-ok'; envText.textContent = '环境正常'; }
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
    quick.innerHTML = '<span class="ico">' + icon('download') + '</span>下载运行环境';
    quick.onclick = () => showRuntimeModal();
  } else {
    quick.innerHTML = '<span class="ico">' + icon('plus') + '</span>新建隧道';
    quick.onclick = () => showTunnelModal(null);
  }
}

function setView(v) {
  app.view = v;
  $$('#nav .nav-item').forEach((b) => b.classList.toggle('active', b.dataset.view === v));
  $('#pageTitle').textContent = VIEW_META[v].title;
  $('#pageSub').textContent = VIEW_META[v].sub;
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
      name: '准备运行环境',
      desc: s.runtime.found
        ? '官方 tunnel-client 已就绪' + (s.runtime.version ? '（v' + s.runtime.version + '）' : '')
        : '下载 OpenAI 官方 tunnel-client，这是隧道能跑起来的发动机',
      done: !!s.runtime.found,
      action: s.runtime.found
        ? { label: '重新下载', kind: 'ghost', fn: () => showRuntimeModal() }
        : { label: '一键下载', kind: 'primary', icon: 'download', fn: () => showRuntimeModal() },
    },
    {
      key: 'server',
      name: '添加 MCP 服务器',
      desc: s.counts.servers > 0
        ? '已登记 ' + s.counts.servers + ' 个服务器'
        : '告诉 MCPHelm 你本地要暴露哪个 MCP 服务器（命令或地址）',
      done: s.counts.servers > 0,
      action: { label: s.counts.servers > 0 ? '再添加一个' : '添加服务器', kind: s.counts.servers > 0 ? 'ghost' : 'primary', icon: s.counts.servers > 0 ? undefined : 'plus', fn: () => showServerModal(null) },
    },
    {
      key: 'tunnel',
      name: '创建并启动隧道',
      desc: s.counts.tunnels > 0
        ? '已有 ' + s.counts.tunnels + ' 条隧道，随时可以启动'
        : '填入 OpenAI 平台发的隧道 ID 和密钥，把服务器接到 ChatGPT',
      done: s.counts.tunnels > 0,
      action: { label: s.counts.tunnels > 0 ? '管理隧道' : '创建隧道', kind: s.counts.tunnels > 0 ? 'soft' : 'primary', icon: s.counts.tunnels > 0 ? undefined : 'plus', fn: () => (s.counts.tunnels > 0 ? setView('tunnels') : showTunnelModal(null)) },
    },
  ];
}

function renderDashboard(c, s) {
  const errCount = (s.configIssues || []).filter((i) => i.level === 'error').length;
  const warnCount = (s.configIssues || []).filter((i) => i.level === 'warn').length;
  const healthy = s.tunnels.filter((t) => t.health && t.health.ok).length;
  const attention = errCount + warnCount + s.tunnels.filter((t) => t.status.state === 'error' || t.status.state === 'stale').length;

  let html = '<div class="stat-row">';
  html += statCard('tunnels', 'tint-blue', s.counts.tunnels, '隧道总数');
  html += statCard('zap', 'tint-green', s.counts.running, '运行中');
  html += statCard('heartbeat', 'tint-violet', healthy, '健康通过');
  html += statCard('warn', 'tint-amber', attention, '需要关注');
  html += '</div>';

  if (needsSetup(s)) {
    const steps = setupSteps(s);
    const done = steps.filter((x) => x.done).length;
    const pct = Math.round((done / steps.length) * 100);
    html += '<div class="hero">' +
      '<h2>三步把你的本地 AI 能力接进 ChatGPT</h2>' +
      '<p>MCPHelm 帮你把运行在本机的 MCP 服务器，通过 OpenAI 官方安全隧道接到 ChatGPT。全程不用敲命令，跟着下面三步走就行。</p>' +
      '<div class="hero-progress"><div class="hero-progress-bar"><div class="hero-progress-fill" style="width:' + pct + '%"></div></div><span class="hero-progress-text">' + done + ' / ' + steps.length + ' 步已完成</span></div>' +
      '</div>';
    html += '<div class="step-list">';
    const currentIdx = steps.findIndex((x) => !x.done);
    steps.forEach((st, i) => {
      const cls = st.done ? 'done' : (i === currentIdx ? 'current' : '');
      html += '<div class="step-item ' + cls + '">' +
        '<div class="step-num">' + (st.done ? icon('check') : (i + 1)) + '</div>' +
        '<div class="step-info"><div class="step-name">' + esc(st.name) + (st.done ? ' <span class="pill ok">已完成</span>' : '') + '</div>' +
        '<div class="step-desc">' + esc(st.desc) + '</div></div>' +
        '<div class="step-actions"><button class="btn ' + st.action.kind + '" data-step="' + st.key + '">' + (st.action.icon ? '<span class="ico">' + icon(st.action.icon) + '</span>' : '') + esc(st.action.label) + '</button></div>' +
      '</div>';
    });
    html += '</div>';
    c.innerHTML = html;
    steps.forEach((st) => {
      const btn = $('[data-step="' + st.key + '"]', c);
      if (btn) btn.addEventListener('click', st.action.fn);
    });
    return;
  }

  // 已完成初始化：显示隧道卡片 + 问题提示
  if (attention > 0) {
    html += '<div class="notice warn"><span class="ico">' + icon('warn') + '</span><div><strong>有 ' + attention + ' 处需要关注。</strong> 去 <a href="#" data-goto="doctor">体检</a> 看看具体问题和修复建议。</div></div>';
  }
  html += '<div class="section-title"><span class="ico">' + icon('tunnels') + '</span>隧道一览</div>';
  html += '<div class="section-sub">点击卡片上的按钮即可启动、停止或查看日志</div>';
  html += '<div class="entity-grid">';
  s.tunnels.forEach((t) => { html += tunnelCard(t); });
  html += '</div>';
  c.innerHTML = html;
  bindTunnelCards(c, s);
  $$('[data-goto]', c).forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); setView(a.dataset.goto); }));
}

function statCard(ic, tint, num, label) {
  return '<div class="stat-card"><div class="stat-ico ' + tint + '">' + icon(ic) + '</div>' +
    '<div><div class="stat-num">' + num + '</div><div class="stat-label">' + esc(label) + '</div></div></div>';
}

/* ---------------- 隧道卡片 ---------------- */
function statePill(t) {
  const st = t.status.state;
  if (st === 'running') {
    if (t.health && t.health.ok) return '<span class="pill ok"><span class="dot dot-ok"></span>运行正常</span>';
    if (t.health) return '<span class="pill warn"><span class="dot dot-warn"></span>健康检查未过</span>';
    return '<span class="pill ok"><span class="dot dot-ok"></span>运行中</span>';
  }
  if (st === 'error') return '<span class="pill err"><span class="dot dot-err"></span>出错了</span>';
  if (st === 'stale') return '<span class="pill warn"><span class="dot dot-warn"></span>状态残留</span>';
  return '<span class="pill muted"><span class="dot dot-muted"></span>已停止</span>';
}

function tunnelCard(t) {
  let html = '<div class="entity-card" data-tunnel="' + esc(t.name) + '">';
  html += '<div class="entity-top">' +
    '<div class="entity-ico">' + icon('tunnels') + '</div>' +
    '<div class="entity-names"><div class="entity-name">' + esc(t.name) + '</div>' +
    '<div class="entity-target" title="' + esc(t.target) + '">' + esc(t.target || '—') + '</div></div>' +
    statePill(t) +
  '</div>';
  html += '<div class="entity-meta">';
  html += '<span class="m"><span class="ico">' + icon('servers') + '</span>' + esc(t.server) + '</span>';
  html += '<span class="m"><span class="ico">' + icon('link') + '</span><span class="mono">' + esc(t.tunnelIdMasked || '—') + '</span></span>';
  if (t.status.state === 'running') html += '<span class="m"><span class="ico">' + icon('clock') + '</span>' + fmtUptime(t.status.uptimeMs) + '</span>';
  const keyM = t.key.ready
    ? '<span class="m" title="密钥来源：' + esc(t.key.source || '') + '"><span class="ico">' + icon('key') + '</span>密钥就绪</span>'
    : '<span class="m" style="color:var(--amber)"><span class="ico">' + icon('key') + '</span>密钥未就绪</span>';
  html += keyM;
  html += '</div>';
  if (t.lastError) {
    html += '<div style="padding:8px 18px;font-size:12px;color:var(--red);background:var(--red-soft);border-top:1px solid var(--border)">' + esc(t.lastError) + '</div>';
  }
  html += '<div class="entity-foot">';
  if (t.status.state === 'running') {
    html += '<button class="btn small danger-soft" data-act="stop"><span class="ico">' + icon('stop') + '</span>停止</button>';
    html += '<button class="btn small ghost" data-act="restart"><span class="ico">' + icon('restart') + '</span>重启</button>';
  } else {
    html += '<button class="btn small success-soft" data-act="start"><span class="ico">' + icon('play') + '</span>启动</button>';
  }
  html += '<span class="spacer"></span>';
  html += '<button class="btn small ghost" data-act="logs"><span class="ico">' + icon('logs') + '</span>日志</button>';
  html += '<button class="btn small ghost" data-act="edit"><span class="ico">' + icon('edit') + '</span></button>';
  html += '<button class="btn small ghost" data-act="remove"><span class="ico">' + icon('trash') + '</span></button>';
  html += '</div></div>';
  return html;
}

function bindTunnelCards(c, s) {
  $$('[data-tunnel]', c).forEach((card) => {
    const name = card.dataset.tunnel;
    const t = s.tunnels.find((x) => x.name === name);
    if (!t) return;
    $$('[data-act]', card).forEach((btn) => {
      btn.addEventListener('click', () => tunnelAction(t, btn.dataset.act, btn));
    });
  });
}

async function tunnelAction(t, act, btn) {
  if (act === 'logs') { app.logTunnel = t.name; setView('logs'); return; }
  if (act === 'edit') { showTunnelModal(t.name); return; }
  if (act === 'remove') {
    const okGo = await confirmModal('删除隧道', '确定要删除隧道 <strong>' + esc(t.name) + '</strong> 吗？<br>这只会移除 MCPHelm 里的登记，不会影响 OpenAI 平台上的隧道。', '删除', true);
    if (!okGo) return;
    try { await api('/api/tunnels/' + encodeURIComponent(t.name) + '/remove'); toast('已删除隧道 ' + t.name, 'ok'); refreshState(true); }
    catch (e) { toast(e.message, 'err'); }
    return;
  }
  // start / stop / restart
  btn.disabled = true; btn.classList.add('loading');
  try {
    await api('/api/tunnels/' + encodeURIComponent(t.name) + '/' + act);
    toast(act === 'start' ? '隧道 ' + t.name + ' 已启动' : act === 'stop' ? '隧道 ' + t.name + ' 已停止' : '隧道 ' + t.name + ' 已重启', 'ok');
  } catch (e) { toast(e.message, 'err'); }
  finally { btn.disabled = false; btn.classList.remove('loading'); }
  setTimeout(() => refreshState(true), 600);
}

/* ---------------- 隧道列表页 ---------------- */
function renderTunnels(c, s) {
  let html = '';
  if (s.tunnels.length === 0) {
    html = '<div class="empty"><div class="empty-ico">' + icon('tunnels') + '</div>' +
      '<h3>还没有隧道</h3><p>隧道是连接本地服务器和 ChatGPT 的桥梁。先确认已添加服务器，再创建第一条隧道。</p>' +
      '<button class="btn primary" id="emptyNewTunnel"><span class="ico">' + icon('plus') + '</span>创建第一条隧道</button></div>';
    c.innerHTML = html;
    $('#emptyNewTunnel', c).addEventListener('click', () => showTunnelModal(null));
    return;
  }
  html += '<div style="display:flex;justify-content:flex-end;margin-bottom:14px"><button class="btn primary" id="newTunnelBtn"><span class="ico">' + icon('plus') + '</span>新建隧道</button></div>';
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
    '<span class="pill blue">' + (sv.kind === 'http' ? 'HTTP' : '命令行') + '</span>' +
  '</div>';
  html += '<div class="entity-meta">';
  if (sv.description) html += '<span class="m">' + esc(sv.description) + '</span>';
  html += sv.usedBy.length > 0
    ? '<span class="m"><span class="ico">' + icon('tunnels') + '</span>被 ' + sv.usedBy.length + ' 条隧道使用</span>'
    : '<span class="m" style="color:var(--text-3)"><span class="ico">' + icon('info') + '</span>还没有隧道使用</span>';
  html += '</div>';
  html += '<div class="entity-foot"><span class="spacer"></span>' +
    '<button class="btn small ghost" data-act="edit"><span class="ico">' + icon('edit') + '</span>编辑</button>' +
    '<button class="btn small danger-soft" data-act="remove"><span class="ico">' + icon('trash') + '</span>删除</button>' +
  '</div></div>';
  return html;
}

function renderServers(c, s) {
  let html = '';
  if (s.servers.length === 0) {
    html = '<div class="empty"><div class="empty-ico">' + icon('servers') + '</div>' +
      '<h3>还没有登记 MCP 服务器</h3><p>把你想给 ChatGPT 用的本地 MCP 服务器登记在这里——可以是一条启动命令（stdio），也可以是一个本地 HTTP 地址。</p>' +
      '<button class="btn primary" id="emptyNewServer"><span class="ico">' + icon('plus') + '</span>添加服务器</button></div>';
    c.innerHTML = html;
    $('#emptyNewServer', c).addEventListener('click', () => showServerModal(null));
    return;
  }
  html += '<div style="display:flex;justify-content:flex-end;margin-bottom:14px"><button class="btn primary" id="newServerBtn"><span class="ico">' + icon('plus') + '</span>添加服务器</button></div>';
  html += '<div class="entity-grid">';
  s.servers.forEach((sv) => { html += serverCard(sv); });
  html += '</div>';
  c.innerHTML = html;
  $('#newServerBtn', c).addEventListener('click', () => showServerModal(null));
  $$('[data-server]', c).forEach((card) => {
    const name = card.dataset.server;
    const sv = s.servers.find((x) => x.name === name);
    if (!sv) return;
    $('[data-act="edit"]', card).addEventListener('click', () => showServerModal(name));
    $('[data-act="remove"]', card).addEventListener('click', async () => {
      const warn = sv.usedBy.length > 0 ? '<br><span style="color:var(--red)">注意：正被隧道 ' + esc(sv.usedBy.join('、')) + ' 使用，删除前需先删掉这些隧道。</span>' : '';
      const okGo = await confirmModal('删除服务器', '确定要删除服务器 <strong>' + esc(name) + '</strong> 吗？' + warn, '删除', true);
      if (!okGo) return;
      try { await api('/api/servers/' + encodeURIComponent(name) + '/remove'); toast('已删除服务器 ' + name, 'ok'); refreshState(true); }
      catch (e) { toast(e.message, 'err'); }
    });
  });
}


/* ---------------- 日志页 ---------------- */
async function renderLogs(c, s) {
  if (s.tunnels.length === 0) {
    c.innerHTML = '<div class="empty"><div class="empty-ico">' + icon('logs') + '</div>' +
      '<h3>还没有可查看的日志</h3><p>创建并启动一条隧道后，它的运行输出会实时出现在这里。</p>' +
      '<button class="btn primary" id="emptyGoTunnel"><span class="ico">' + icon('plus') + '</span>去创建隧道</button></div>';
    $('#emptyGoTunnel', c).addEventListener('click', () => showTunnelModal(null));
    return;
  }
  if (!app.logTunnel || !s.tunnels.find((t) => t.name === app.logTunnel)) app.logTunnel = s.tunnels[0].name;
  let html = '<div class="card"><div class="card-head">' +
    '<div><div class="card-title"><span class="ico">' + icon('logs') + '</span>运行日志</div><div class="card-sub">选择一条隧道，实时查看它的输出</div></div>' +
    '<div class="log-toolbar">' +
      '<select class="select" id="logTunnelSel">' +
      s.tunnels.map((t) => '<option value="' + esc(t.name) + '"' + (t.name === app.logTunnel ? ' selected' : '') + '>' + esc(t.name) + '</option>').join('') +
      '</select>' +
      '<label style="display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--text-2);cursor:pointer"><input type="checkbox" id="logAutoChk"' + (app.logAuto ? ' checked' : '') + '> 自动刷新</label>' +
      '<button class="btn ghost small" id="logRefreshBtn"><span class="ico">' + icon('refresh') + '</span>刷新</button>' +
      '<button class="btn ghost small" id="logOpenDir"><span class="ico">' + icon('folder') + '</span>打开目录</button>' +
    '</div></div>' +
    '<div class="card-body"><div class="log-viewer" id="logViewer"><span class="log-empty">加载中…</span></div>' +
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
      viewer.innerHTML = '<span class="log-empty">（还没有日志输出，启动隧道后这里会有内容）</span>';
    }
    if (silent && atBottom) viewer.scrollTop = viewer.scrollHeight;
    if (!silent) viewer.scrollTop = viewer.scrollHeight;
    const fp = $('#logFilePath'); if (fp) fp.textContent = data.logFile || '';
    const tr = $('#logTrunc'); if (tr) tr.textContent = data.truncated ? '（仅显示末尾 400 行）' : '';
  } catch (e) {
    if (!silent) toast(e.message, 'err');
  }
}

/* ---------------- 体检页 ---------------- */
function renderDoctor(c, s) {
  const issues = s.configIssues || [];
  let html = '<div class="card" style="margin-bottom:16px"><div class="card-head">' +
    '<div><div class="card-title"><span class="ico">' + icon('doctor') + '</span>环境体检</div><div class="card-sub">自动检查运行环境、配置和连通性，把问题摆在明面上</div></div>' +
    '<div style="display:flex;gap:8px">' +
      '<button class="btn ghost small" id="doctorRun"><span class="ico">' + icon('refresh') + '</span>重新体检</button>' +
      '<button class="btn soft small" id="doctorRunOnline"><span class="ico">' + icon('globe') + '</span>含联网检查</button>' +
    '</div></div>' +
    '<div class="card-body" id="doctorBody"><div style="color:var(--text-3);font-size:13px">点击"重新体检"开始检查…</div></div></div>';
  if (issues.length > 0) {
    html += '<div class="card"><div class="card-head"><div><div class="card-title"><span class="ico">' + icon('warn') + '</span>配置问题 (' + issues.length + ')</div><div class="card-sub">来自配置文件的直接校验结果</div></div></div><div class="card-body"><div class="check-list">';
    issues.forEach((i) => {
      html += '<div class="check-item ' + (i.level === 'error' ? 'err' : 'warn') + '"><span class="ico">' + icon(i.level === 'error' ? 'x' : 'warn') + '</span><div><div class="check-name">' + (i.level === 'error' ? '错误' : '警告') + '</div><div class="check-detail">' + esc(i.message) + '</div></div></div>';
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
  body.innerHTML = '<div style="color:var(--text-3);font-size:13px;display:flex;align-items:center;gap:8px"><span class="ico" style="animation:indet 1.2s infinite">' + icon('refresh') + '</span>正在检查' + (online ? '（含联网，可能稍慢）' : '') + '…</div>';
  try {
    const data = await api('/api/doctor' + (online ? '?online=1' : ''));
    const checks = data.checks || [];
    if (checks.length === 0) { body.innerHTML = '<div class="check-item ok"><span class="ico">' + icon('check') + '</span><div><div class="check-name">一切正常</div><div class="check-detail">没有发现问题</div></div></div>'; return; }
    let html = '<div class="check-list">';
    checks.forEach((ck) => {
      const raw = String(ck.level || '').toLowerCase();
      const lvl = (raw === 'fail' || raw === 'error') ? 'err' : (raw === 'warn' ? 'warn' : (raw === 'info' ? 'info' : 'ok'));
      html += '<div class="check-item ' + lvl + '"><span class="ico">' + icon(lvl === 'err' ? 'x' : lvl === 'warn' ? 'warn' : lvl === 'info' ? 'info' : 'check') + '</span>' +
        '<div><div class="check-name">' + esc(ck.title || ck.name || ck.id || '检查项') + '</div>' +
        '<div class="check-detail">' + esc(ck.detail || ck.message || '') + '</div>' +
        (ck.hint ? '<div class="check-detail" style="color:var(--primary)">建议：' + esc(ck.hint) + '</div>' : '') +
      '</div></div>';
    });
    html += '</div>';
    body.innerHTML = html;
  } catch (e) {
    body.innerHTML = '<div class="notice err"><span class="ico">' + icon('x') + '</span><div>体检失败：' + esc(e.message) + '</div></div>';
  }
}

/* ---------------- 设置页 ---------------- */
function renderSettings(c, s) {
  const d = s.docs || {};
  let html = '<div class="settings-grid">';

  html += '<div class="card"><div class="card-head"><div><div class="card-title"><span class="ico">' + icon('settings') + '</span>本地环境</div><div class="card-sub">MCPHelm 在你电脑上的位置</div></div></div><div class="card-body" style="padding-top:8px">';
  html += kv('版本', s.brand.name + ' v' + s.brand.version);
  html += kv('数据目录', s.home, true);
  html += kv('配置文件', s.configPath, true);
  html += kv('日志目录', s.logsDir, true);
  html += kv('配置来源', s.configScope || '—');
  html += '<div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">' +
    '<button class="btn ghost small" data-open="home"><span class="ico">' + icon('folder') + '</span>打开数据目录</button>' +
    '<button class="btn ghost small" data-open="logs"><span class="ico">' + icon('folder') + '</span>打开日志目录</button>' +
  '</div>';
  html += '</div></div>';

  html += '<div class="card"><div class="card-head"><div><div class="card-title"><span class="ico">' + icon('download') + '</span>运行环境</div><div class="card-sub">OpenAI 官方 tunnel-client</div></div></div><div class="card-body" style="padding-top:8px">';
  if (s.runtime.found) {
    html += kv('状态', '已就绪', false, 'ok');
    html += kv('版本', s.runtime.version || '未知');
    html += kv('来源', s.runtime.source || '—');
    html += kv('路径', s.runtime.path || '—', true);
  } else {
    html += '<div class="notice warn" style="margin-bottom:12px"><span class="ico">' + icon('warn') + '</span><div><strong>运行环境缺失。</strong>隧道无法启动，请先下载官方 tunnel-client。</div></div>';
  }
  html += '<div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap">' +
    '<button class="btn primary small" id="runtimeBtn"><span class="ico">' + icon('download') + '</span>' + (s.runtime.found ? '重新下载' : '立即下载') + '</button>' +
    '<button class="btn ghost small" id="runtimeImportBtn"><span class="ico">' + icon('folder') + '</span>导入本地安装包</button>' +
  '</div>';
  html += '</div></div>';

  html += '<div class="card"><div class="card-head"><div><div class="card-title"><span class="ico">' + icon('link') + '</span>帮助与入口</div><div class="card-sub">常用官方页面，新用户跟着走</div></div></div><div class="card-body" style="padding-top:8px"><div class="link-row">';
  const links = [
    ['platformTunnels', 'OpenAI 平台 · 隧道管理（创建隧道拿 ID）'],
    ['platformApiKeys', 'OpenAI 平台 · API 密钥（拿 runtime key）'],
    ['secureTunnelGuide', '官方文档 · 安全隧道指南'],
    ['chatgptConnectors', 'ChatGPT · 连接器设置（最终在这里用）'],
    ['tunnelClientRepo', 'tunnel-client 官方仓库'],
  ];
  links.forEach(([k, label]) => {
    if (d[k]) html += '<a class="link-item" href="' + esc(d[k]) + '" target="_blank" rel="noopener"><span class="ico">' + icon('ext') + '</span>' + esc(label) + '<span class="arrow">' + icon('arrow') + '</span></a>';
  });
  html += '</div></div></div>';

  html += '<div class="card"><div class="card-head"><div><div class="card-title"><span class="ico">' + icon('info') + '</span>关于 MCPHelm</div></div></div><div class="card-body" style="padding-top:8px">';
  html += '<p style="font-size:13px;color:var(--text-2);line-height:1.8">MCPHelm 是一个开源的本地隧道管理器，把 OpenAI 官方 tunnel-client 包装成人人能用的图形界面：不用记命令、不用背参数，点几下就能把自己电脑上跑的 MCP 服务器安全地接进 ChatGPT。</p>';
  html += kv('项目仓库', s.brand.repoUrl || '', true);
  html += '<div class="notice info" style="margin-top:12px"><span class="ico">' + icon('info') + '</span><div>你的密钥只保存在你自己的电脑上，MCPHelm 不会上传任何数据。</div></div>';
  html += '</div></div>';

  html += '</div>';
  c.innerHTML = html;

  $$('[data-open]', c).forEach((b) => b.addEventListener('click', async () => {
    try { await api('/api/open', { body: { target: b.dataset.open } }); } catch (e) { toast(e.message, 'err'); }
  }));
  const rb = $('#runtimeBtn', c); if (rb) rb.addEventListener('click', () => showRuntimeModal());
  const rib = $('#runtimeImportBtn', c); if (rib) rib.addEventListener('click', () => showImportRuntimeModal());
}

function kv(k, v, mono, pillKind) {
  const val = pillKind
    ? '<span class="pill ' + pillKind + '">' + esc(v) + '</span>'
    : '<div class="kv-v' + (mono ? ' mono' : '') + '">' + esc(v) + '</div>';
  return '<div class="kv"><div class="kv-k">' + esc(k) + '</div>' + val + '</div>';
}


/* ---------------- 服务器表单 ---------------- */
async function showServerModal(editName) {
  let existing = null;
  if (editName) {
    try {
      const data = await api('/api/config');
      existing = (data.config.servers || []).find((x) => x.name === editName) || null;
    } catch (e) { toast(e.message, 'err'); return; }
  }
  const kind = existing ? existing.kind : 'stdio';
  const body =
    '<div class="field"><label class="field-label">名称<span class="req">*</span></label>' +
    '<input class="input" id="f_name" placeholder="例如 my-files 或 local-notes" value="' + esc(existing ? existing.name : '') + '"' + (existing ? ' disabled' : '') + '>' +
    '<div class="field-hint">字母、数字开头，可含 . _ -，是这台服务器的唯一称呼</div></div>' +
    '<div class="field"><label class="field-label">类型</label>' +
    '<div class="seg" id="f_kind">' +
      '<button data-k="stdio" class="' + (kind === 'stdio' ? 'active' : '') + '">命令行 (stdio)</button>' +
      '<button data-k="http" class="' + (kind === 'http' ? 'active' : '') + '">HTTP 服务</button>' +
    '</div>' +
    '<div class="field-hint" id="kindHint"></div></div>' +
    '<div class="field" id="wrap_command"><label class="field-label">启动命令<span class="req">*</span></label>' +
    '<input class="input mono" id="f_command" placeholder="例如 npx -y @modelcontextprotocol/server-filesystem C:\\Users\\me\\docs" value="' + esc(existing && existing.command ? existing.command : '') + '">' +
    '<div class="field-hint">MCPHelm 会通过隧道帮你拉起并管理这个进程</div></div>' +
    '<div class="field hidden" id="wrap_url"><label class="field-label">服务地址<span class="req">*</span></label>' +
    '<input class="input mono" id="f_url" placeholder="例如 http://127.0.0.1:3001/mcp" value="' + esc(existing && existing.url ? existing.url : '') + '">' +
    '<div class="field-hint">已经在本机跑着的 MCP HTTP 端点</div></div>' +
    '<div class="field" id="wrap_headers"><label class="field-label">额外的请求头（可选）</label>' +
    '<textarea class="textarea" id="f_headers" placeholder="每行一个，格式 Key: Value">' + esc(existing && existing.headers ? Object.entries(existing.headers).map(([k, v]) => k + ': ' + v).join('\n') : '') + '</textarea></div>' +
    '<div class="field"><label class="field-label">备注（可选）</label>' +
    '<input class="input" id="f_desc" placeholder="一句话说明这台服务器是干嘛的" value="' + esc(existing && existing.description ? existing.description : '') + '"></div>';

  const m = openModal({
    title: existing ? '编辑服务器' : '添加 MCP 服务器',
    sub: '登记你本机要暴露给 ChatGPT 的服务',
    body,
    actions: [
      { label: '取消', kind: 'ghost' },
      {
        label: existing ? '保存修改' : '添加', kind: 'primary', icon: 'check',
        onClick: async (bodyEl) => {
          const name = $('#f_name', bodyEl).value.trim();
          const k = $('.seg button.active', bodyEl).dataset.k;
          const payload = {
            name,
            kind: k,
            description: $('#f_desc', bodyEl).value.trim() || undefined,
          };
          if (k === 'stdio') {
            payload.command = $('#f_command', bodyEl).value.trim();
            if (!payload.command) throw new Error('请填写启动命令');
          } else {
            payload.url = $('#f_url', bodyEl).value.trim();
            if (!payload.url) throw new Error('请填写服务地址');
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
            if (!name) throw new Error('请填写名称');
            await api('/api/servers', { body: payload });
            toast('已添加服务器 ' + name, 'ok');
          } else {
            await api('/api/servers/' + encodeURIComponent(editName) + '/update', { body: payload });
            toast('已保存 ' + name, 'ok');
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
    $('#kindHint', m.body).textContent = k === 'stdio'
      ? 'MCPHelm 负责启动这条命令，适合绝大多数 MCP 服务器'
      : '你自己已经在本机把服务跑起来了，MCPHelm 只做转发';
  };
  $$('#f_kind button', m.body).forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); syncKind(b.dataset.k); }));
  syncKind(kind);
}

/* ---------------- 隧道表单 ---------------- */
async function showTunnelModal(editName) {
  const s = app.state;
  if (!s) return;
  if (s.servers.length === 0) {
    const go = await confirmModal('先添加服务器', '创建隧道前，需要先登记至少一台 MCP 服务器。现在去添加吗？', '去添加');
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
  const initKeyMode = existing ? (existing.apiKeyEnv ? 'env' : (existing.apiKeySet ? 'inline' : 'env')) : 'env';

  const body =
    '<div class="field-row">' +
      '<div class="field"><label class="field-label">名称<span class="req">*</span></label>' +
      '<input class="input" id="f_tname" placeholder="例如 my-first-tunnel" value="' + esc(existing ? existing.name : '') + '"' + (existing ? ' disabled' : '') + '></div>' +
      '<div class="field"><label class="field-label">绑定服务器<span class="req">*</span></label>' +
      '<select class="select" id="f_tserver">' +
      s.servers.map((sv) => '<option value="' + esc(sv.name) + '"' + (existing && existing.server === sv.name ? ' selected' : '') + '>' + esc(sv.name) + '（' + (sv.kind === 'http' ? 'HTTP' : '命令行') + '）</option>').join('') +
      '</select></div>' +
    '</div>' +
    '<div class="field"><label class="field-label">隧道 ID<span class="req">*</span></label>' +
    '<input class="input mono" id="f_tid" placeholder="tunnel_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value="' + esc(existing ? existing.tunnelId : '') + '">' +
    '<div class="field-hint">在 <a href="' + esc(d.platformTunnels || '#') + '" target="_blank" rel="noopener">OpenAI 平台 → 隧道管理</a> 创建隧道后获得，格式 tunnel_ + 32 位字符</div></div>' +
    '<div class="field"><label class="field-label">密钥（runtime key）<span class="req">*</span></label>' +
    '<div class="seg" id="f_keymode">' +
      '<button data-k="env" class="' + (initKeyMode === 'env' ? 'active' : '') + '">环境变量（推荐）</button>' +
      '<button data-k="inline" class="' + (initKeyMode === 'inline' ? 'active' : '') + '">直接填写</button>' +
    '</div></div>' +
    '<div class="field" id="wrap_keyenv"><label class="field-label">环境变量名</label>' +
    '<input class="input mono" id="f_keyenv" placeholder="例如 MCPHELM_RUNTIME_KEY" value="' + esc(existing && existing.apiKeyEnv ? existing.apiKeyEnv : 'MCPHELM_RUNTIME_KEY') + '">' +
    '<div class="field-hint">密钥不落盘，启动时从该环境变量读取，更安全</div></div>' +
    '<div class="field hidden" id="wrap_keyinline"><label class="field-label">runtime key</label>' +
    '<input class="input mono" id="f_keyinline" type="password" placeholder="粘贴 OpenAI 平台生成的 runtime key" value="">' +
    '<div class="field-hint">在 <a href="' + esc(d.platformApiKeys || '#') + '" target="_blank" rel="noopener">OpenAI 平台 → API 密钥</a> 生成' + (existing && existing.apiKeySet ? '；已保存过密钥，留空表示保持不变' : '') + '</div></div>' +
    '<div class="field"><label class="field-label">健康检查端口（可选）</label>' +
    '<input class="input mono" id="f_tport" placeholder="默认 8080" value="' + esc(existing && existing.healthPort ? String(existing.healthPort) : '') + '"></div>';

  const m = openModal({
    title: existing ? '编辑隧道' : '创建隧道',
    sub: '把一台本地服务器接到 ChatGPT',
    body,
    wide: true,
    actions: [
      { label: '取消', kind: 'ghost' },
      {
        label: existing ? '保存修改' : '创建隧道', kind: 'primary', icon: 'check',
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
            if (!Number.isInteger(p) || p < 1 || p > 65535) throw new Error('端口必须是 1-65535 的整数');
            payload.healthPort = p;
          }
          if (keyMode === 'env') {
            payload.apiKeyEnv = $('#f_keyenv', bodyEl).value.trim();
            if (!payload.apiKeyEnv) throw new Error('请填写环境变量名');
          } else {
            const keyVal = $('#f_keyinline', bodyEl).value.trim();
            if (keyVal) payload.apiKey = keyVal;
            else if (!existing || !existing.apiKeySet) throw new Error('请粘贴 runtime key');
            else payload.keyMode = 'keep';
          }
          if (!existing) {
            if (!name) throw new Error('请填写名称');
            if (!payload.tunnelId) throw new Error('请填写隧道 ID');
            await api('/api/tunnels', { body: payload });
            toast('已创建隧道 ' + name + '，点"启动"即可上线', 'ok');
          } else {
            await api('/api/tunnels/' + encodeURIComponent(editName) + '/update', { body: payload });
            toast('已保存 ' + name, 'ok');
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
  };
  $$('#f_keymode button', m.body).forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); syncKey(b.dataset.k); }));
  syncKey(initKeyMode);
}

/* ---------------- 运行时下载/导入 ---------------- */
function showRuntimeModal() {
  const s = app.state;
  const d = (s && s.docs) || {};
  openModal({
    title: '下载运行环境',
    sub: '从 OpenAI 官方仓库下载 tunnel-client，自动校验完整性',
    body:
      '<div class="notice info"><span class="ico">' + icon('info') + '</span><div>tunnel-client 是 OpenAI 官方发布的隧道客户端，MCPHelm 会从 <a href="' + esc(d.tunnelClientRepo || '#') + '" target="_blank" rel="noopener">官方仓库</a> 下载并做 SHA-256 校验，全程自动。</div></div>' +
      '<div id="dlProgress" class="hidden" style="margin-bottom:14px"><div class="progress"><div class="progress-fill indeterminate"></div></div>' +
      '<div id="dlLog" class="mono" style="margin-top:10px;font-size:12px;color:var(--text-2);max-height:140px;overflow-y:auto;background:var(--surface-2);border-radius:8px;padding:10px 12px"></div></div>',
    dismissable: true,
    actions: [
      { label: '关闭', kind: 'ghost' },
      {
        label: '开始下载', kind: 'primary', icon: 'download',
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
        toast('运行环境已就绪', 'ok');
        setTimeout(() => { closeModal(); refreshState(true); }, 900);
      } else {
        if (fill) { fill.style.width = '100%'; fill.style.background = 'var(--red)'; }
        toast('下载失败：' + (job.error || '未知错误'), 'err');
        refreshState(true);
      }
      return;
    }
  } catch (e) { /* 继续轮询 */ }
  setTimeout(() => pollRuntimeJob(bodyEl), 800);
}

function showImportRuntimeModal() {
  openModal({
    title: '导入本地安装包',
    sub: '如果你已经手动下载了官方 zip，可以直接导入',
    body:
      '<div class="field"><label class="field-label">zip 文件路径<span class="req">*</span></label>' +
      '<input class="input mono" id="f_zippath" placeholder="例如 D:\\Downloads\\tunnel-client-windows-x64.zip"></div>' +
      '<div class="field"><label class="field-label">版本号（可选）</label>' +
      '<input class="input mono" id="f_zipver" placeholder="留空则自动识别"></div>',
    actions: [
      { label: '取消', kind: 'ghost' },
      {
        label: '导入', kind: 'primary', icon: 'check',
        onClick: async (bodyEl) => {
          const zipPath = $('#f_zippath', bodyEl).value.trim();
          if (!zipPath) throw new Error('请填写 zip 文件路径');
          const version = $('#f_zipver', bodyEl).value.trim();
          await api('/api/runtime/import', { body: { zipPath, version: version || undefined } });
          toast('已导入运行环境', 'ok');
          refreshState(true);
        },
      },
    ],
  });
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
