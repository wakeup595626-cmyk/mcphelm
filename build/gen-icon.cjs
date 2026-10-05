// gen-icon.cjs — 纯 Node 生成 MCPHelm 图标（无外部依赖）
// 画一个舵轮：外圆环 + 8 根辐条 + 中心毂，深蓝渐变圆角方块底，青色发光舵轮
// 输出多尺寸 PNG，再打包成 Windows .ico

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT_DIR = __dirname;

// ---------- 最小 PNG 编码器（真彩色 + alpha） ----------
function crc32(buf) {
  let c, table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  c = -1;
  for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ table[(c ^ buf[i]) & 0xff];
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0;
    rgba.copy(raw, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ---------- 颜色与渐变 ----------
function lerp(a, b, t) { return a + (b - a) * t; }
function hex(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
// 底色：亮蓝渐变（任务栏小尺寸下足够醒目，不会被误认为白色）
const BG_TOP = hex('#2563eb'), BG_BOT = hex('#1d4ed8');
// 舵轮：纯白（高对比度，任何背景下都清晰）
const WHEEL = hex('#ffffff'), WHEEL_HI = hex('#e0f2fe');

// ---------- 画布 ----------
function render(size) {
  const px = new Float32Array(size * size * 4);
  const S = size, c = S / 2;
  const inset = S * 0.035;                    // 四周留白，避免图标贴边
  const half = S / 2 - inset;                 // 圆角方块半径
  const corner = S * 0.20;                    // 圆角半径
  const wheelR = S * 0.28;                    // 舵轮外圆半径
  const ringW = S * 0.055;                    // 舵轮环宽（加粗，小尺寸更清晰）
  const spokeW = S * 0.035;                   // 辐条宽（加粗）
  const spokeLen = S * 0.38;                  // 辐条长
  const hubR = S * 0.095;                     // 中心毂半径（加大）

  function inRoundedRect(x, y) {
    const dx = Math.max(Math.abs(x - c) - (half - corner), 0);
    const dy = Math.max(Math.abs(y - c) - (half - corner), 0);
    return dx * dx + dy * dy <= corner * corner;
  }
  function put(x, y, r, g, b, a) {
    if (x < 0 || y < 0 || x >= S || y >= S) return;
    const i = (y * S + x) * 4;
    const ia = 1 - a;
    px[i] = r * a + px[i] * ia;
    px[i + 1] = g * a + px[i + 1] * ia;
    px[i + 2] = b * a + px[i + 2] * ia;
    px[i + 3] = Math.min(255, px[i + 3] + a * 255);
  }
  // 1) 圆角方块底 + 竖向渐变
  for (let y = 0; y < S; y++) {
    const t = y / (S - 1);
    const r = lerp(BG_TOP[0], BG_BOT[0], t);
    const g = lerp(BG_TOP[1], BG_BOT[1], t);
    const b = lerp(BG_TOP[2], BG_BOT[2], t);
    for (let x = 0; x < S; x++) {
      if (!inRoundedRect(x + 0.5, y + 0.5)) continue;
      put(x, y, r, g, b, 1);
    }
  }
  // 2) 舵轮发光（在外环位置叠一层大范围低透明青色）
  const glowR = wheelR * 1.7;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const d = Math.hypot(x - c, y - c);
    if (d > glowR) continue;
    const a = 0.16 * (1 - d / glowR);
    put(x, y, WHEEL[0], WHEEL[1], WHEEL[2], a);
  }
  // 3) 辐条（8 根，从中心到外）
  for (let k = 0; k < 8; k++) {
    const ang = (Math.PI / 4) * k;
    const ux = Math.cos(ang), uy = Math.sin(ang);
    const nx = -uy, ny = ux;
    const r0 = hubR * 0.4, r1 = spokeLen;
    for (let r = r0; r <= r1; r += 0.5) {
      for (let w = -spokeW / 2; w <= spokeW / 2; w += 0.5) {
        const x = Math.round(c + ux * r + nx * w);
        const y = Math.round(c + uy * r + ny * w);
        put(x, y, WHEEL[0], WHEEL[1], WHEEL[2], 1);
      }
    }
  }
  // 4) 外圆环（抗锯齿：按距离混色）
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const d = Math.hypot(x - c, y - c);
    const dr = Math.abs(d - wheelR);
    if (dr > ringW / 2 + 1) continue;
    const a = Math.max(0, Math.min(1, (ringW / 2 + 1 - dr)));
    const t = Math.max(0, 1 - dr / (ringW / 2 + 1));
    const r = lerp(WHEEL[0], WHEEL_HI[0], t * 0.6);
    const g = lerp(WHEEL[1], WHEEL_HI[1], t * 0.6);
    const b = lerp(WHEEL[2], WHEEL_HI[2], t * 0.6);
    put(x, y, r, g, b, a);
  }
  // 5) 中心毂（实心 + 高光）
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const d = Math.hypot(x - c, y - c);
    if (d > hubR) continue;
    const t = 1 - d / hubR;
    const r = lerp(WHEEL[0], WHEEL_HI[0], t);
    const g = lerp(WHEEL[1], WHEEL_HI[1], t);
    const b = lerp(WHEEL[2], WHEEL_HI[2], t);
    put(x, y, r, g, b, 1);
  }
  const out = Buffer.alloc(S * S * 4);
  for (let i = 0; i < out.length; i++) out[i] = Math.max(0, Math.min(255, Math.round(px[i])));
  return out;
}

// ---------- 生成多尺寸 PNG ----------
const sizes = [16, 24, 32, 48, 64, 128, 256];
const pngs = sizes.map(s => {
  const rgba = render(s);
  const png = encodePNG(s, s, rgba);
  fs.writeFileSync(path.join(OUT_DIR, 'icon-' + s + '.png'), png);
  return { size: s, data: png };
});
console.log('PNG 生成完成：' + sizes.map(s => s + 'x' + s).join(', '));

// ---------- 打包 ICO ----------
// ICO = ICONDIR(6) + ICONDIRENTRY* N(16 each) + PNG data blobs
const count = pngs.length;
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(count, 4);
let offset = 6 + count * 16;
const entries = [];
for (const p of pngs) {
  const e = Buffer.alloc(16);
  e[0] = p.size >= 256 ? 0 : p.size;   // 256 用 0 表示
  e[1] = p.size >= 256 ? 0 : p.size;
  e[2] = 0; e[3] = 0;
  e.writeUInt16LE(1, 4);               // planes
  e.writeUInt16LE(32, 6);              // bpp
  e.writeUInt32LE(p.data.length, 8);
  e.writeUInt32LE(offset, 12);
  entries.push(e);
  offset += p.data.length;
}
const ico = Buffer.concat([header, ...entries, ...pngs.map(p => p.data)]);
fs.writeFileSync(path.join(OUT_DIR, 'icon.ico'), ico);
console.log('icon.ico 生成完成，包含尺寸：' + sizes.join(', '));
