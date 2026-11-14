// ============================================================
// 30_architecture.js — 建筑、屋顶、虹桥、城门、摊棚、树木
// 静态网格按 60 米一段、按材质合并，控制绘制调用。
// ============================================================

const STATIC = { geo: new Map(), lines: new Map(), signs: [], smoke: [], flags: null, labels: [] };
const CHUNK = 60;
function SB(mat, x) {
  const k = Math.floor(x / CHUNK) + '|' + mat;
  let b = STATIC.geo.get(k);
  if (!b) { b = new GeoBuilder(); STATIC.geo.set(k, b); }
  return b;
}
function SL(x) {
  const k = Math.floor(x / CHUNK);
  let b = STATIC.lines.get(k);
  if (!b) { b = new LineBuilder(); STATIC.lines.set(k, b); }
  return b;
}
function finalizeStatic(scene) {
  let n = 0;
  const inkMats = { vc: 28, vcDouble: 28, plaster: 30, lattice: 30, tile: 40, brick: 30 };
  const inkChunks = new Map();
  for (const [k, b] of STATIC.geo) {
    if (b.empty) continue;
    const [ck, mk] = k.split('|');
    const mat = MAT[mk];
    const geo = b.build();
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'static:' + k;
    scene.add(mesh); n++;
    // 界画式墨线勾勒
    if (inkMats[mk]) {
      const eg = new THREE.EdgesGeometry(geo, inkMats[mk]);
      const arr = eg.attributes.position.array;
      if (!inkChunks.has(ck)) inkChunks.set(ck, []);
      inkChunks.get(ck).push(arr);
      eg.dispose();
    }
  }
  for (const [ck, arrs] of inkChunks) {
    const tot = arrs.reduce((a, b) => a + b.length, 0);
    const all = new Float32Array(tot);
    let o = 0; for (const a of arrs) { all.set(a, o); o += a.length; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(all, 3));
    g.computeBoundingSphere();
    const ls = new THREE.LineSegments(g, MAT.ink);
    ls.name = 'ink:' + ck;
    scene.add(ls); n++;
  }
  for (const [k, b] of STATIC.lines) {
    if (!b.count) continue;
    const ls = new THREE.LineSegments(b.build(), MAT.twig);
    ls.name = 'twigs:' + k;
    scene.add(ls); n++;
  }
  return n;
}

// 局部坐标系助手：W 为放置矩阵，返回 W*M(...)
function frame(x, y, z, yaw) {
  const W = new THREE.Matrix4().makeRotationY(yaw || 0).setPosition(x, y, z);
  const f = (tx, ty, tz, rx, ry, rz, sx, sy, sz) => W.clone().multiply(M(tx, ty, tz, rx, ry, rz, sx, sy, sz));
  f.W = W;
  f.pt = (lx, ly, lz) => new THREE.Vector3(lx, ly, lz).applyMatrix4(W);
  f.x = x; f.z = z; f.y = y; f.yaw = yaw || 0;
  return f;
}
// 局部两点圆柱
function fCyl(B, f, a, b, r, color, seg) {
  const A = f.pt(a[0], a[1], a[2]), Bp = f.pt(b[0], b[1], b[2]);
  const m = cylBetween(A, Bp).multiply(new THREE.Matrix4().makeScale(2 * r, 1, 2 * r));
  B.add(gCyl(seg || 6, true), m, color);
}

// ---------- 屋顶 ----------
// 以高度场生成：type gable(悬山) / hip(庑殿) / xieshan(歇山)；cornerLift 为翼角起翘
function roof(f, o) {
  const a = o.a, b = o.b, H = o.H, y0 = o.y0;
  const type = o.type || 'gable';
  const lift = o.lift != null ? o.lift : 0.35;
  const mat = o.mat || 'tile';
  const BR = SB(mat, f.x);
  const ridgeHalf = type === 'gable' ? a : type === 'hip' ? Math.max(0.2, a - b * 0.95) : Math.max(0.3, a - b * 0.55);
  const exp = mat === 'thatch' ? 1.15 : 1.55;
  const hAt = (x, z) => {
    const ax = Math.abs(x), az = Math.abs(z);
    let u = az / b, end = false;
    if (type !== 'gable' && ax > ridgeHalf) {
      const ue = (ax - ridgeHalf) / (a - ridgeHalf) * (type === 'xieshan' ? 1 : 1);
      if (ue > u) { u = ue; end = true; }
    }
    u = clamp(u, 0, 1);
    let h = H * Math.pow(1 - u, exp);
    // 起翘：四角上翘，檐口中段微微下垂
    const cx = Math.pow(ax / a, 5), cz = Math.pow(az / b, 3);
    h += lift * (type === 'gable' ? cx * cz * 0.6 : Math.max(cx * cz, Math.pow(Math.min(ax / a, az / b), 6)) * 1.0);
    if (mat === 'thatch') h += (vnoise(x * 1.7 + f.x, z * 1.7 + f.z) - 0.5) * 0.12 * (1 - u * 0.5);
    return { h, u, end };
  };
  const nx = Math.max(6, Math.ceil(2 * a / 0.5)) | 1, nz = Math.max(7, Math.ceil(2 * b / 0.45)) | 1;
  const pts = [], uvs = [], cols = [];
  const tint = o.color != null ? o.color : (mat === 'thatch' ? 0xb9a57c : 0x8d867b);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const x = -a + 2 * a * i / (nx - 1), z = -b + 2 * b * j / (nz - 1);
    const r = hAt(x, z);
    // 茅草顶边缘不齐
    let yy = y0 + r.h;
    if (mat === 'thatch' && (i === 0 || j === 0 || i === nx - 1 || j === nz - 1)) yy -= 0.12 + vnoise(x * 3, z * 3) * 0.15;
    pts.push(f.pt(x, yy, z));
    const slope = (1 - r.u) * Math.sqrt(H * H + b * b);
    if (r.end) uvs.push(z / 2.1, slope / 2.1); else uvs.push(x / 2.1, slope / 2.1);
    cols.push(jit(tint, 0.03));
  }
  BR.grid(pts, nz, nx, cols, uvs, null, true);
  // 檐下天花与封檐板
  const BV = SB('vcDouble', f.x);
  const eY = y0 + (o.fascia != null ? -o.fascia : -0.08);
  const ceil = [f.pt(-a * 0.97, eY, -b * 0.97), f.pt(a * 0.97, eY, -b * 0.97), f.pt(a * 0.97, eY, b * 0.97), f.pt(-a * 0.97, eY, b * 0.97)];
  BV.quad(ceil[0], ceil[1], ceil[2], ceil[3], jit(o.ceil || 0x4a3829, 0.05));
  // 檐口板
  const fc = mat === 'thatch' ? 0x6f5c3e : 0x3d3128;
  const edge = (x1, z1, x2, z2) => {
    const n = 8;
    for (let k = 0; k < n; k++) {
      const t0 = k / n, t1 = (k + 1) / n;
      const xa = lerp(x1, x2, t0), za = lerp(z1, z2, t0), xb = lerp(x1, x2, t1), zb = lerp(z1, z2, t1);
      const ha = y0 + hAt(xa, za).h, hb = y0 + hAt(xb, zb).h;
      const th = mat === 'thatch' ? 0.28 : 0.14;
      BV.quad(f.pt(xa, ha, za), f.pt(xb, hb, zb), f.pt(xb, hb - th, zb), f.pt(xa, ha - th, za), fc);
    }
  };
  edge(-a, b, a, b); edge(a, -b, -a, -b);
  if (type !== 'gable') { edge(a, b, a, -b); edge(-a, -b, -a, b); }
  if (mat === 'tile') {
    // 正脊与鸱吻
    const rh = y0 + H + 0.08;
    const len = type === 'gable' ? a * 2 * 0.98 : ridgeHalf * 2;
    BV.add(gBox(), f(0, rh + 0.1, 0, 0, 0, 0, len, 0.32, 0.26), 0x3e3730);
    BV.add(gBox(), f(0, rh + 0.28, 0, 0, 0, 0, len, 0.06, 0.18), 0x5c544a);
    for (const sx of [1, -1]) {
      const ex = sx * len / 2;
      BV.add(gBox(), f(ex, rh + 0.45, 0, 0, 0, -sx * 0.25, 0.28, 0.75, 0.22), 0x2f2924);
      BV.add(gBox(), f(ex - sx * 0.12, rh + 0.8, 0, 0, 0, sx * 0.6, 0.12, 0.35, 0.18), 0x2f2924);
    }
    if (type !== 'gable') {
      // 垂脊（戗脊），沿屋面折线
      for (const sx of [1, -1]) for (const sz of [1, -1]) {
        let prev = null;
        const N = 7;
        for (let k = 0; k <= N; k++) {
          const t = k / N;
          const x = sx * lerp(ridgeHalf, a * 0.98, t), z = sz * lerp(0, b * 0.98, t);
          const p = f.pt(x, y0 + hAt(x, z).h + 0.1, z);
          if (prev) { const m = cylBetween(prev, p).multiply(new THREE.Matrix4().makeScale(0.2, 1, 0.2)); BV.add(gBox(), m, 0x3a332c); }
          prev = p;
        }
        // 翼角
        const cp = f.pt(sx * a * 1.0, y0 + hAt(sx * a * 0.99, sz * b * 0.99).h + 0.25, sz * b * 1.0);
        BV.add(gCone(4), new THREE.Matrix4().makeTranslation(cp.x, cp.y, cp.z).multiply(new THREE.Matrix4().makeScale(0.16, 0.5, 0.16)), 0x2f2924);
      }
      if (type === 'xieshan') {
        // 山花：两端竖立的三角墙
        for (const sx of [1, -1]) {
          const x = sx * ridgeHalf;
          const zt = b * 0.42;
          const yb = y0 + hAt(x, zt).h;
          BV.tri(f.pt(x, yb, -zt), f.pt(x, y0 + H + 0.05, 0), f.pt(x, yb, zt), 0xb39c78);
        }
      }
    }
  } else if (mat === 'thatch') {
    // 草脊：压脊的草束
    BV.add(gCyl(6), f(0, y0 + H + 0.06, 0, 0, 0, Math.PI / 2, 0.36, a * 2 * 0.96, 0.3), 0x7e6a48);
  }
  if (type === 'gable' && !o.noGable) {
    // 山墙尖与搏风板
    for (const sx of [1, -1]) {
      const xw = sx * (o.wallA || a * 0.8);
      const zt = o.wallB || b * 0.8;
      const yb = y0 + hAt(xw, zt).h - 0.05;
      const top = y0 + hAt(xw, 0).h - 0.05;
      BV.tri(f.pt(xw, o.wallTop != null ? o.wallTop : yb, -zt), f.pt(xw, top, 0), f.pt(xw, o.wallTop != null ? o.wallTop : yb, zt), o.gableColor || 0xcdbb98);
      if (mat === 'tile') {
        const xb = sx * a * 0.995;
        let prev = null;
        for (let k = -6; k <= 6; k++) {
          const z = k / 6 * b;
          const p = f.pt(xb, y0 + hAt(xb, z).h - 0.04, z);
          if (prev) { const m = cylBetween(prev, p).multiply(new THREE.Matrix4().makeScale(0.06, 1, 0.3)); BV.add(gBox(), m, 0x4a3a2c); }
          prev = p;
        }
        BV.add(gBox(), f(xb, y0 + H - 0.45, 0, 0, 0, 0, 0.05, 0.5, 0.22), 0x4a3a2c); // 悬鱼
      }
    }
  }
  return hAt;
}

// ---------- 小件 ----------
function table(B, f, x, z, rot) {
  const g = (tx, ty, tz, sx, sy, sz) => f(x + Math.cos(rot) * tx + Math.sin(rot) * tz, ty, z - Math.sin(rot) * tx + Math.cos(rot) * tz, 0, rot, 0, sx, sy, sz);
  B.add(gBox(), g(0, 0.76, 0, 1.1, 0.06, 0.65), 0x6a4f36);
  for (const sx of [1, -1]) for (const sz of [1, -1]) B.add(gBox(), g(sx * 0.48, 0.37, sz * 0.26, 0.06, 0.74, 0.06), 0x4f3a28);
  // 碗盏
  for (let k = 0; k < 3; k++) B.add(gTaper(0.5, 0.35, 7, false), g((k - 1) * 0.28, 0.82, (k % 2) * 0.12 - 0.05, 0.13, 0.06, 0.13), RNG.pick([0xe8e0cc, 0xd9cfba, 0x8a8a7a]));
}
function bench(B, f, x, z, rot, len) {
  len = len || 1.4;
  const g = (tx, ty, tz, sx, sy, sz) => f(x + Math.cos(rot) * tx + Math.sin(rot) * tz, ty, z - Math.sin(rot) * tx + Math.cos(rot) * tz, 0, rot, 0, sx, sy, sz);
  B.add(gBox(), g(0, 0.42, 0, len, 0.05, 0.24), 0x6a4f36);
  for (const sx of [1, -1]) B.add(gBox(), g(sx * (len / 2 - 0.1), 0.2, 0, 0.05, 0.4, 0.2), 0x4f3a28);
}

// 酒旗、幌子（合并到一个会飘动的网格）
const FLAGB = new GeoBuilder();
function flagBanner(x, y, z, yaw, w, h, color) {
  // 竖挂的长条：上端固定，uv.y = 0 为固定端
  const f = frame(x, y, z, yaw);
  const n = 6;
  const pts = [], uvs = [], cols = [];
  for (let j = 0; j <= n; j++) for (let i = 0; i <= 1; i++) {
    pts.push(f.pt((i - 0.5) * w, -h * j / n, 0));
    uvs.push(i, j / n);
    cols.push(new THREE.Color(color || 0xffffff));
  }
  FLAGB.grid(pts, n + 1, 2, cols, uvs);
}
function winePole(x, z, h, yaw, label) {
  const y = groundY(x, z);
  const B = SB('vc', x);
  B.add(gCyl(6), M(x, y + h / 2, z, 0, 0, 0, 0.12, h, 0.12), 0x5a4330);
  const f = frame(x, y, z, yaw);
  B.add(gBox(), f(0.7, h - 0.1, 0, 0, 0, 0, 1.5, 0.06, 0.06), 0x5a4330);
  const p = f.pt(1.3, h - 0.15, 0);
  flagBanner(p.x, p.y, p.z, yaw, 0.7, 2.6);
  if (label) STATIC.labels.push({ text: label, pos: new THREE.Vector3(x, y + h + 0.6, z), minor: true });
}

// 招牌（真实文字，竖写）
function signBoard(x, y, z, yaw, text, opts) {
  opts = opts || {};
  const vertical = opts.vertical !== false;
  const n = text.length;
  const w = vertical ? (opts.w || 0.55) : (opts.w || n * 0.5 + 0.3);
  const h = vertical ? (opts.h || n * 0.5 + 0.3) : (opts.h || 0.6);
  STATIC.signs.push({ x, y, z, yaw, text, w, h, vertical, bg: opts.bg || '#e9dfc6', fg: opts.fg || '#2a221c' });
}
function buildSigns(scene) {
  for (const s of STATIC.signs) {
    const cv = document.createElement('canvas');
    const px = 96;
    cv.width = Math.round(s.w * px); cv.height = Math.round(s.h * px);
    const ctx = cv.getContext('2d');
    ctx.fillStyle = s.bg; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.strokeStyle = '#4a3828'; ctx.lineWidth = 6; ctx.strokeRect(3, 3, cv.width - 6, cv.height - 6);
    ctx.fillStyle = s.fg;
    const fs = Math.min(cv.width * 0.72, (s.vertical ? cv.height / s.text.length : cv.width / s.text.length) * 0.82);
    ctx.font = `${fs}px "LXGW WenKai", "KaiTi", serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let i = 0; i < s.text.length; i++) {
      if (s.vertical) ctx.fillText(s.text[i], cv.width / 2, (i + 0.5) * cv.height / s.text.length);
      else ctx.fillText(s.text[i], (i + 0.5) * cv.width / s.text.length, cv.height / 2);
    }
    const t = new THREE.CanvasTexture(cv);
    t.anisotropy = 4;
    const m = new THREE.Mesh(new THREE.BoxGeometry(s.w, s.h, 0.06), [MAT.vcSign = MAT.vcSign || new THREE.MeshLambertMaterial({ color: 0x4a3828 }), MAT.vcSign, MAT.vcSign, MAT.vcSign, new THREE.MeshLambertMaterial({ map: t }), new THREE.MeshLambertMaterial({ map: t })]);
    m.position.set(s.x, s.y, s.z);
    m.rotation.y = s.yaw;
    scene.add(m);
  }
}

// ---------- 房屋 ----------
// o: { x, z, yaw, w, d, h, roof:'tile'|'thatch', type, open, stories, h2, plat, porch, interior, cailou, label, kitchen, balcony }
function house(o) {
  SCN.houses = (SCN.houses || 0) + 1;
  const r = RNG;
  const yaw = o.yaw || 0;
  const gy = o.y != null ? o.y : Math.min(groundY(o.x, o.z), groundY(o.x + 2, o.z), groundY(o.x - 2, o.z));
  const ph = o.plat != null ? o.plat : 0.35;
  const f = frame(o.x, gy + ph, o.z, yaw);
  const B = SB('vc', o.x), BP = SB('plaster', o.x), BL = SB('lattice', o.x);
  const w = o.w, d = o.d, h = o.h || 3.2;
  const thatch = o.roof === 'thatch';
  const wood = thatch ? 0x5e4a36 : jit(r.pick([0x5a4030, 0x6a4a34, 0x704634, 0x4e3a2a]), 0.05);
  // 台基
  if (ph > 0) {
    B.add(gBox(), f(0, -ph / 2 - 0.25, 0, 0, 0, 0, w + 0.7, ph + 0.5, d + 0.7), jit(thatch ? 0x9a8462 : 0xa69878, 0.05));
    B.add(gBox(), f(0, -ph * 0.5, d / 2 + 0.55, 0, 0, 0, Math.min(2.4, w * 0.4), ph * 0.5, 0.45), 0x9a8c70); // 踏步
  }
  // 地面
  B.add(gBox(), f(0, 0.01, 0, 0, 0, 0, w, 0.02, d), 0x8f7b5e);
  const bays = Math.max(2, Math.round(w / (thatch ? 3.0 : 3.3)));
  const colR = thatch ? 0.1 : 0.12;
  const colX = [];
  for (let i = 0; i <= bays; i++) colX.push(-w / 2 + w * i / bays);
  // 柱
  for (const x of colX) for (const z of [d / 2, -d / 2]) {
    B.add(gCyl(7), f(x, h / 2, z, 0, 0, 0, colR * 2, h, colR * 2), wood);
    if (!thatch) B.add(gBox(), f(x, 0.08, z, 0, 0, 0, 0.36, 0.16, 0.36), 0x9a8c70); // 柱础
  }
  if (d > 5) for (const x of [-w / 2, w / 2]) B.add(gCyl(7), f(x, h / 2, 0, 0, 0, 0, colR * 2, h, colR * 2), wood);
  // 阑额、斗拱
  for (const z of [d / 2, -d / 2]) B.add(gBox(), f(0, h - 0.14, z, 0, 0, 0, w + 0.2, 0.24, 0.16), wood);
  for (const x of [-w / 2, w / 2]) B.add(gBox(), f(x, h - 0.14, 0, 0, 0, 0, 0.16, 0.24, d + 0.2), wood);
  if (!thatch && o.dougong !== false) {
    for (const x of colX) for (const z of [d / 2, -d / 2]) {
      B.add(gBox(), f(x, h + 0.08, z, 0, 0, 0, 0.32, 0.16, 0.32), 0x4a3828);
      B.add(gBox(), f(x, h + 0.2, z, 0, 0, 0, 0.7, 0.1, 0.16), 0x4a3828);
      B.add(gBox(), f(x, h + 0.2, z, 0, 0, 0, 0.16, 0.1, 0.7), 0x4a3828);
    }
  }
  // 墙：后墙、山墙（灰泥 + 木骨）
  const wallC = thatch ? jit(0xb8a27c, 0.06) : jit(0xe3d8c0, 0.04);
  BP.add(gBox(), f(0, h / 2, -d / 2, 0, 0, 0, w, h, 0.16), wallC, null, 'world');
  for (const sx of [1, -1]) BP.add(gBox(), f(sx * w / 2, h / 2, 0, 0, 0, 0, 0.16, h, d), wallC, null, 'world');
  if (!thatch) {
    B.add(gBox(), f(0, h * 0.45, -d / 2 - 0.09, 0, 0, 0, w, 0.12, 0.03), wood);
    for (const sx of [1, -1]) B.add(gBox(), f(sx * (w / 2 + 0.09), h * 0.45, 0, 0, 0, 0, 0.03, 0.12, d), wood);
  }
  // 后墙小窗
  if (!thatch && w > 5) BL.add(gPlane(), f(w * 0.2, h * 0.62, -d / 2 - 0.09, 0, Math.PI, 0, 1.2, 0.8, 1), 0xd8cdb4);
  // 前檐：开敞的铺面或格子门窗
  if (o.open) {
    // 柜台、货架
    if (o.counter !== false) B.add(gBox(), f(-w * 0.18, 0.5, d / 2 - 0.5, 0, 0, 0, w * 0.45, 1.0, 0.5), jit(0x6a5038, 0.05));
    B.add(gBox(), f(0, 1.4, -d / 2 + 0.35, 0, 0, 0, w * 0.8, 0.05, 0.45), 0x5a4330);
    B.add(gBox(), f(0, 2.0, -d / 2 + 0.35, 0, 0, 0, w * 0.8, 0.05, 0.45), 0x5a4330);
    for (let k = 0; k < Math.floor(w * 2); k++) {
      const gx = -w * 0.4 + k * 0.5;
      B.add(r() < 0.5 ? gBox() : gCyl(6), f(gx, 1.55 + (k % 2) * 0.6, -d / 2 + 0.35, 0, 0, 0, 0.3, 0.25 + r() * 0.2, 0.3), jit(r.pick([0xc9b894, 0x8a6a48, 0x6d6a58, 0xb5a080, 0x9c5a40]), 0.1));
    }
    // 帘
    for (let i = 0; i < bays; i++) {
      if (r() < 0.5) {
        const cx = lerp(colX[i], colX[i + 1], 0.5);
        B.add(gBox(), f(cx, h - 0.45, d / 2 + 0.02, 0, 0, 0, w / bays * 0.9, 0.6, 0.03), jit(r.pick([0xcfc2a2, 0x7d8a84, 0xb5a682]), 0.05));
      }
    }
  } else {
    for (let i = 0; i < bays; i++) {
      const cx = lerp(colX[i], colX[i + 1], 0.5), bw = w / bays - colR * 2;
      if (thatch) {
        if (i === Math.floor(bays / 2)) B.add(gBox(), f(cx, h * 0.4, d / 2, 0, 0, 0, bw * 0.6, h * 0.8, 0.05), 0x3a2e24);
        else BP.add(gBox(), f(cx, h / 2, d / 2, 0, 0, 0, bw, h, 0.12), wallC, null, 'world');
      } else {
        BL.add(gPlane(), f(cx, h * 0.6, d / 2 + 0.01, 0, 0, 0, bw, h * 0.62, 1), 0xd9ceb4);
        B.add(gBox(), f(cx, h * 0.15, d / 2, 0, 0, 0, bw, h * 0.3, 0.06), jit(0x5e4632, 0.05)); // 裙板
      }
    }
  }
  // 室内桌凳
  if (o.interior) {
    const nt = Math.max(1, Math.floor(w / 2.6));
    for (let i = 0; i < nt; i++) {
      const tx = -w / 2 + (i + 0.5) * w / nt, tz = 0.2 + (i % 2) * 0.3;
      table(B, f, tx, tz, 0);
      bench(B, f, tx, tz + 0.75, 0, 1.2);
      bench(B, f, tx, tz - 0.75, 0, 1.2);
      if (o.patrons !== false && r() < 0.85) {
        const p = f.pt(tx + (r() - 0.5) * 0.6, 0, tz + 0.75);
        addPerson({ x: p.x, z: p.z, y: gy + ph, yaw: yaw + Math.PI, act: ACT.sit, variant: r.int(0, 2), prop: r() < 0.4 ? 'cup' : undefined });
        if (r() < 0.7) {
          const p2 = f.pt(tx + (r() - 0.5) * 0.6, 0, tz - 0.75);
          addPerson({ x: p2.x, z: p2.z, y: gy + ph, yaw: yaw, act: ACT.sit, variant: r.int(0, 2) });
        }
      }
    }
  }
  let topY = h;
  // 二层：腰檐、平座、上层
  if (o.stories === 2) {
    const h2 = o.h2 || 2.8;
    // 腰檐（四面披檐）
    const BT = SB(thatch ? 'thatch' : 'tile', o.x);
    const ex = 1.1, eh = 0.75;
    const yi = h + 0.25 + eh, yo = h + 0.25;
    const C4 = [[-w / 2, d / 2], [w / 2, d / 2], [w / 2, -d / 2], [-w / 2, -d / 2]];
    const O4 = [[-w / 2 - ex, d / 2 + ex], [w / 2 + ex, d / 2 + ex], [w / 2 + ex, -d / 2 - ex], [-w / 2 - ex, -d / 2 - ex]];
    for (let k = 0; k < 4; k++) {
      const k2 = (k + 1) % 4;
      const A = f.pt(C4[k][0], yi, C4[k][1]), Bq = f.pt(C4[k2][0], yi, C4[k2][1]);
      const Cq = f.pt(O4[k2][0], yo, O4[k2][1]), Dq = f.pt(O4[k][0], yo, O4[k][1]);
      const L = (k % 2 ? d : w) / 2.1;
      BT.quad(A, Dq, Cq, Bq, 0x8d867b, null, [[0, 0], [0, 0.6], [L, 0.6], [L, 0]]);
    }
    // 平座与勾阑
    const fy = h + 0.25 + eh + 0.15;
    const bw2 = w + 1.0, bd2 = d + 1.0;
    B.add(gBox(), f(0, fy, 0, 0, 0, 0, bw2, 0.18, bd2), 0x5e4632);
    const railH = 0.85;
    const railRing = [[-bw2 / 2, bd2 / 2, bw2 / 2, bd2 / 2], [bw2 / 2, bd2 / 2, bw2 / 2, -bd2 / 2], [-bw2 / 2, -bd2 / 2, -bw2 / 2, bd2 / 2]];
    for (const [x1, z1, x2, z2] of railRing) {
      const len = Math.hypot(x2 - x1, z2 - z1);
      const ang = Math.atan2(-(z2 - z1), x2 - x1);
      const mx = (x1 + x2) / 2, mz = (z1 + z2) / 2;
      B.add(gBox(), f(mx, fy + railH, mz, 0, ang, 0, len, 0.07, 0.08), 0x7a3e2e);
      B.add(gBox(), f(mx, fy + railH * 0.45, mz, 0, ang, 0, len, 0.05, 0.05), 0x7a3e2e);
      BL.add(gPlane(), f(mx, fy + railH * 0.45, mz, 0, ang, 0, len, railH * 0.6, 1), 0xb8a888);
      const np = Math.max(2, Math.round(len / 1.2));
      for (let k = 0; k <= np; k++) {
        const px = lerp(x1, x2, k / np), pz = lerp(z1, z2, k / np);
        B.add(gBox(), f(px, fy + railH / 2, pz, 0, 0, 0, 0.09, railH, 0.09), 0x6a3628);
      }
    }
    // 上层
    const y2 = fy + 0.1;
    const w2 = w - 0.4, d2 = d - 0.4;
    for (const x of [-w2 / 2, w2 / 2]) for (const z of [-d2 / 2, d2 / 2]) B.add(gCyl(7), f(x, y2 + h2 / 2, z, 0, 0, 0, 0.22, h2, 0.22), wood);
    BL.add(gPlane(), f(0, y2 + h2 * 0.5, d2 / 2, 0, 0, 0, w2 - 0.3, h2 * 0.7, 1), 0xd9ceb4);
    for (const sx of [1, -1]) BL.add(gPlane(), f(sx * w2 / 2, y2 + h2 * 0.5, 0, 0, sx * Math.PI / 2, 0, d2 - 0.3, h2 * 0.7, 1), 0xd9ceb4);
    BP.add(gBox(), f(0, y2 + h2 / 2, -d2 / 2, 0, 0, 0, w2, h2, 0.14), wallC, null, 'world');
    B.add(gBox(), f(0, y2 + h2 - 0.12, d2 / 2, 0, 0, 0, w2 + 0.2, 0.24, 0.16), wood);
    B.add(gBox(), f(0, y2 + h2 * 0.15, d2 / 2, 0, 0, 0, w2, h2 * 0.3, 0.06), 0x5e4632);
    // 楼上酒客
    if (o.upPatrons !== false) {
      for (let k = 0; k < Math.floor(w2 / 2.2); k++) {
        const tx = -w2 / 2 + 1.1 + k * 2.2;
        table(B, f, tx, 0.3, 0);
        const p = f.pt(tx, 0, 0.95);
        if (r() < 0.8) addPerson({ x: p.x, z: p.z, y: gy + ph + y2, yaw: yaw + Math.PI, act: ACT.sit, body: 'robe', variant: r.int(0, 1) });
        const p2 = f.pt(tx + 0.2, 0, -0.35);
        if (r() < 0.6) addPerson({ x: p2.x, z: p2.z, y: gy + ph + y2, yaw: yaw, act: ACT.sit, body: 'robe', variant: r.int(0, 1) });
      }
    }
    topY = y2 + h2;
    roof(f, { a: w2 / 2 + 1.0, b: d2 / 2 + 1.1, H: (d2 / 2 + 1.1) * 0.5, y0: topY + 0.25, type: o.type || 'xieshan', lift: 0.45, wallA: w2 / 2, wallB: d2 / 2, wallTop: topY });
  } else {
    const ov = thatch ? 0.7 : 0.95;
    const b = d / 2 + ov + (o.deepEave || 0);
    roof(f, {
      a: w / 2 + ov, b, H: b * (thatch ? 0.62 : (o.pitch || 0.48)), y0: topY + (thatch ? 0.05 : 0.3),
      type: o.type || (thatch ? 'gable' : 'gable'), mat: thatch ? 'thatch' : 'tile', lift: thatch ? 0 : (o.lift != null ? o.lift : 0.3),
      wallA: w / 2, wallB: d / 2, wallTop: topY + (thatch ? 0 : 0.3), noGable: o.type === 'hip'
    });
  }
  // 门前凉棚（席棚）
  if (o.porch) {
    const pd = o.porch;
    const BM = SB('mat', o.x);
    const y1 = h * 0.82, y2 = h * 0.66;
    const pts = [f.pt(-w / 2 - 0.2, y1, d / 2 + 0.2), f.pt(w / 2 + 0.2, y1, d / 2 + 0.2), f.pt(w / 2 + 0.2, y2, d / 2 + pd), f.pt(-w / 2 - 0.2, y2, d / 2 + pd)];
    BM.quad(pts[0], pts[3], pts[2], pts[1], 0xd8c8a4, null, [[0, 0], [0, pd], [w, pd], [w, 0]]);
    const np = Math.max(2, Math.round(w / 3));
    for (let k = 0; k <= np; k++) {
      const px = -w / 2 + w * k / np;
      B.add(gCyl(5), f(px, y2 / 2, d / 2 + pd - 0.1, 0, 0, 0, 0.1, y2, 0.1), 0x5a4532);
    }
    // 棚下桌凳
    if (o.porchTables) {
      for (let k = 0; k < np; k++) {
        const tx = -w / 2 + w * (k + 0.5) / np, tz = d / 2 + pd * 0.55;
        table(B, f, tx, tz, 0);
        bench(B, f, tx, tz + 0.72, 0, 1.2);
        bench(B, f, tx, tz - 0.72, 0, 1.2);
        if (r() < 0.75) { const p = f.pt(tx, 0, tz + 0.72); addPerson({ x: p.x, z: p.z, y: gy + ph * 0.3, yaw: yaw + Math.PI, act: ACT.sit, variant: r.int(0, 2), prop: r() < 0.3 ? 'cup' : undefined }); }
        if (r() < 0.5) { const p = f.pt(tx + 0.2, 0, tz - 0.72); addPerson({ x: p.x, z: p.z, y: gy + ph * 0.3, yaw: yaw, act: ACT.sit, variant: r.int(0, 2) }); }
      }
    }
  }
  // 彩楼欢门
  if (o.cailou) caiLou(f, w, d, o.cailou);
  // 炊烟
  if (o.kitchen) {
    const p = f.pt(w * 0.3, topY + (thatch ? 1.6 : 1.8), -d * 0.2);
    STATIC.smoke.push(p);
  }
  if (o.label) STATIC.labels.push({ text: o.label, pos: f.pt(0, topY + 3.5, 0), major: !!o.major });
  return f;
}

// 彩楼欢门：门前以杆木扎成的高架，层层收分，挂彩帛
function caiLou(f, w, d, opt) {
  const B = SB('vc', f.x);
  const z0 = d / 2 + (opt.dz || 1.4);
  const W = opt.w || Math.min(w + 1, 9);
  const H = opt.h || 8;
  const levels = opt.levels || 5;
  const red = 0x8a3e2c, grn = 0x4d6658, pole = 0x5a4532;
  const cols = 7;
  for (let i = 0; i < cols; i++) {
    const t = i / (cols - 1) - 0.5;
    const ht = H * (1 - Math.abs(t) * 0.9) + (i % 2) * 0.4;
    fCyl(B, f, [t * W, 0, z0], [t * W * 0.92, ht, z0], 0.06, pole, 5);
    fCyl(B, f, [t * W, 0, z0 - 1.1], [t * W * 0.92, ht - 0.8, z0 - 1.1], 0.05, pole, 5);
    // 杆顶尖饰
    const tp = f.pt(t * W * 0.92, ht + 0.35, z0);
    B.add(gCone(5), new THREE.Matrix4().makeTranslation(tp.x, tp.y, tp.z).multiply(new THREE.Matrix4().makeScale(0.16, 0.7, 0.16)), 0x3a2e24);
  }
  for (let l = 1; l <= levels; l++) {
    const y = H * l / (levels + 1);
    const ww = W * (1 - (l / (levels + 1)) * 0.75);
    fCyl(B, f, [-ww / 2, y, z0], [ww / 2, y, z0], 0.045, pole, 4);
    fCyl(B, f, [-ww / 2, y - 0.6, z0 - 1.1], [ww / 2, y - 0.6, z0 - 1.1], 0.04, pole, 4);
    // 斜撑
    fCyl(B, f, [-ww / 2, y, z0], [ww / 4, y + H / (levels + 1), z0], 0.03, pole, 4);
    fCyl(B, f, [ww / 2, y, z0], [-ww / 4, y + H / (levels + 1), z0], 0.03, pole, 4);
    // 彩帛垂带
    for (let k = 0; k < 6; k++) {
      const x = -ww / 2 + ww * (k + 0.5) / 6;
      B.add(gBox(), f(x, y - 0.35, z0 + 0.06, 0, 0, 0, 0.18, 0.7, 0.02), (k + l) % 2 ? red : grn);
    }
  }
  // 门楣横额 + 栀子灯
  B.add(gBox(), f(0, 3.0, z0 + 0.05, 0, 0, 0, W * 0.9, 0.5, 0.1), red);
  for (const sx of [-1, 1]) {
    const p = f.pt(sx * W * 0.42, 2.4, z0 + 0.3);
    B.add(gSphere(8, 6), M(p.x, p.y, p.z, 0, 0, 0, 0.42, 0.5, 0.42), 0xd8c49a);
    B.add(gBox(), M(p.x, p.y + 0.4, p.z, 0, 0, 0, 0.04, 0.4, 0.04), 0x3a2e24);
  }
}

// ---------- 摊棚、大伞 ----------
function umbrella(x, z, r, color, opts) {
  opts = opts || {};
  const y = (opts.y != null ? opts.y : groundY(x, z));
  const B = SB('vc', x), BM = SB('mat', x);
  const h = opts.h || 2.5;
  B.add(gCyl(5), M(x, y + h / 2, z, 0, 0, 0, 0.07, h, 0.07), 0x4e3a28);
  const tilt = opts.tilt || 0, tdir = opts.tdir || 0;
  const W = new THREE.Matrix4().makeTranslation(x, y + h, z).multiply(new THREE.Matrix4().makeRotationY(tdir)).multiply(new THREE.Matrix4().makeRotationX(tilt));
  const n = 16;
  for (let i = 0; i < n; i++) {
    const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2;
    const p0 = new THREE.Vector3(0, 0.45, 0).applyMatrix4(W);
    const p1 = new THREE.Vector3(Math.cos(a0) * r, 0, Math.sin(a0) * r).applyMatrix4(W);
    const p2 = new THREE.Vector3(Math.cos(a1) * r, 0, Math.sin(a1) * r).applyMatrix4(W);
    BM.tri(p0, p2, p1, color || 0xcdb994, null, [0, 0], [r, 0], [0, r]);
    // 伞骨
    const m = cylBetween(p0, p1).multiply(new THREE.Matrix4().makeScale(0.025, 1, 0.025));
    B.add(gBox(), m, 0x3a2e24);
  }
  if (opts.stall !== false) stall(x + (opts.sx || 0), z + (opts.sz || 0.6), opts.yaw || 0);
}
function stall(x, z, yaw, w) {
  const y = groundY(x, z);
  const f = frame(x, y, z, yaw || 0);
  const B = SB('vc', x);
  w = w || 1.6;
  B.add(gBox(), f(0, 0.72, 0, 0, 0, 0, w, 0.06, 0.8), 0x6a5038);
  for (const sx of [1, -1]) for (const sz of [1, -1]) B.add(gBox(), f(sx * (w / 2 - 0.08), 0.36, sz * 0.32, 0, 0, 0, 0.06, 0.72, 0.06), 0x4f3a28);
  for (let k = 0; k < 7; k++) {
    const gx = (RNG() - 0.5) * (w - 0.3), gz = (RNG() - 0.5) * 0.5;
    const kind = RNG.int(0, 3);
    const c = jit(RNG.pick([0xc9b48a, 0x9a6a48, 0x7a8a6a, 0xd8ccb0, 0x8c4a38, 0xb89a5a]), 0.1);
    if (kind === 0) B.add(gSphere(6, 4), f(gx, 0.82, gz, 0, 0, 0, 0.22, 0.16, 0.22), c);
    else if (kind === 1) B.add(gBox(), f(gx, 0.82, gz, 0, RNG() * 3, 0, 0.25, 0.14, 0.18), c);
    else if (kind === 2) B.add(gTaper(0.5, 0.35, 8, false), f(gx, 0.8, gz, 0, 0, 0, 0.32, 0.12, 0.32), 0x8a7148);
    else B.add(gCyl(7), f(gx, 0.85, gz, 0, 0, 0, 0.16, 0.22, 0.16), c);
  }
  return f;
}
// 席棚摊：四柱斜顶
function matShed(x, z, w, d, yaw, opts) {
  opts = opts || {};
  const y = opts.y != null ? opts.y : groundY(x, z);
  const f = frame(x, y, z, yaw || 0);
  const B = SB('vc', x), BM = SB('mat', x);
  const h1 = opts.h || 2.4, h2 = h1 - 0.5;
  for (const sx of [1, -1]) {
    B.add(gCyl(5), f(sx * w / 2, h1 / 2, -d / 2, 0, 0, 0, 0.1, h1, 0.1), 0x5a4532);
    B.add(gCyl(5), f(sx * w / 2, h2 / 2, d / 2, 0, 0, 0, 0.1, h2, 0.1), 0x5a4532);
  }
  const a = f.pt(-w / 2 - 0.3, h1 + 0.05, -d / 2 - 0.3), b = f.pt(w / 2 + 0.3, h1 + 0.05, -d / 2 - 0.3), c = f.pt(w / 2 + 0.3, h2 + 0.05, d / 2 + 0.4), dd = f.pt(-w / 2 - 0.3, h2 + 0.05, d / 2 + 0.4);
  BM.quad(a, dd, c, b, jit(0xd2c19c, 0.05), null, [[0, 0], [0, d], [w, d], [w, 0]]);
  if (opts.table !== false) {
    B.add(gBox(), f(0, 0.72, 0.2, 0, 0, 0, w * 0.8, 0.06, d * 0.5), 0x6a5038);
    for (const sx of [1, -1]) B.add(gBox(), f(sx * w * 0.36, 0.36, 0.2, 0, 0, 0, 0.06, 0.72, d * 0.45), 0x4f3a28);
    for (let k = 0; k < 6; k++) B.add(gSphere(6, 4), f((RNG() - 0.5) * w * 0.7, 0.82, 0.2 + (RNG() - 0.5) * d * 0.3, 0, 0, 0, 0.22, 0.14, 0.22), jit(RNG.pick([0xc9b48a, 0x9a6a48, 0x7a8a6a, 0xd8ccb0]), 0.1));
  }
  return f;
}

// 篱笆
function fence(pts, h) {
  h = h || 1.1;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const len = a.distanceTo(b);
    const n = Math.ceil(len / 0.18);
    const L = SL(a.x);
    for (let k = 0; k <= n; k++) {
      const x = lerp(a.x, b.x, k / n), z = lerp(a.y, b.y, k / n);
      const y = groundY(x, z);
      L.seg(V(x, y, z), V(x + (RNG() - 0.5) * 0.08, y + h * (0.8 + RNG() * 0.3), z), 0x4a3c2c);
    }
    for (const hh of [0.35, 0.8]) {
      const ya = groundY(a.x, a.y) + h * hh, yb = groundY(b.x, b.y) + h * hh;
      L.seg(V(a.x, ya, a.y), V(b.x, yb, b.y), 0x3e3226);
    }
  }
}

// ---------- 树 ----------
// 老柳：粗矮歪斜的树干，满是瘤节；顶端瘤头上放射出成束的细长枝条（早春，叶未展）
function willow(x, z, s, opts) {
  SCN.trees = (SCN.trees || 0) + 1;
  opts = opts || {};
  const r = makeRng(Math.floor(x * 131 + z * 71) + 7);
  s = s || 1;
  const y = groundY(x, z);
  const B = SB('vc', x), L = SL(x);
  const bark = 0x4a3c2f, barkD = 0x2c241d, barkL = 0x6a5a48;
  const lean = (opts.lean != null ? opts.lean : (r() - 0.5) * 0.7);
  const ldir = opts.ldir != null ? opts.ldir : r() * Math.PI * 2;
  let p = V(x, y - 0.3, z);
  let rad = (0.5 + r() * 0.22) * s;
  const H = (2.3 + r() * 1.2) * s;
  const segs = 6;
  let wob = 0;
  for (let i = 0; i < segs; i++) {
    const t = (i + 1) / segs;
    wob += (r() - 0.5) * 0.5;
    const bend = Math.sin(lean) * H * t * (0.6 + 0.4 * t);
    const q = V(x + Math.cos(ldir) * bend + Math.cos(ldir + 1.5) * wob * 0.3 * s, y + H * t, z + Math.sin(ldir) * bend + Math.sin(ldir + 1.5) * wob * 0.3 * s);
    const r2 = rad * (0.86 + r() * 0.08);
    const m = cylBetween(p, q).multiply(new THREE.Matrix4().makeScale(2 * rad, 1.05, 2 * rad * (0.75 + r() * 0.3)));
    B.add(gTaper(0.5 * r2 / rad, 0.5, 9, true), m, jit(lerp(0, 1, r()) < 0.5 ? bark : 0x55463a, 0.05, r)); void barkL;
    // 瘤节、树洞、斑驳树皮
    const nk = 2 + r.int(0, 2);
    for (let k = 0; k < nk; k++) {
      const a = r() * Math.PI * 2, hh = r();
      const c = V(lerp(p.x, q.x, hh) + Math.cos(a) * rad * 0.85, lerp(p.y, q.y, hh), lerp(p.z, q.z, hh) + Math.sin(a) * rad * 0.85);
      B.add(gIco(0), M(c.x, c.y, c.z, r() * 3, r() * 3, r() * 3, rad * (0.5 + r() * 0.6), rad * (0.6 + r() * 0.7), rad * (0.5 + r() * 0.6)), jit(r() < 0.5 ? barkD : bark, 0.12, r));
    }
    p = q; rad = r2;
  }
  // 根部盘结
  for (let k = 0; k < 5; k++) {
    const a = k / 5 * Math.PI * 2 + r();
    const q = V(x + Math.cos(a) * rad * 2.6, y - 0.15, z + Math.sin(a) * rad * 2.6);
    const m = cylBetween(V(x, y + 0.7 * s, z), q).multiply(new THREE.Matrix4().makeScale(rad * 1.1, 1, rad * 1.1));
    B.add(gTaper(0.3, 0.5, 6, true), m, barkD);
  }
  // 瘤头
  for (let k = 0; k < 4; k++) B.add(gIco(1), M(p.x + (r() - 0.5) * rad, p.y + (r() - 0.3) * rad, p.z + (r() - 0.5) * rad, r(), r(), r(), rad * (1.6 + r()), rad * (1.2 + r() * 0.6), rad * (1.6 + r())), jit(barkD, 0.15, r));
  // 短粗的主枝与细长柳条
  const nb = 9 + r.int(0, 6);
  const shootC = jit(opts.green ? 0x5d6440 : 0x4f4b34, 0.08, r);
  const tipC = jit(opts.green ? 0x7c8452 : 0x6b6a48, 0.08, r);
  for (let i = 0; i < nb; i++) {
    const a = r() * Math.PI * 2;
    const up = 0.5 + r() * 0.9;
    const len = (0.5 + r() * 0.9) * s;
    const q = V(p.x + Math.cos(a) * Math.cos(up) * len, p.y + Math.sin(up) * len, p.z + Math.sin(a) * Math.cos(up) * len);
    const m = cylBetween(p, q).multiply(new THREE.Matrix4().makeScale(0.22 * s, 1, 0.22 * s));
    B.add(gTaper(0.6, 1, 5, true), m, bark);
    B.add(gIco(0), M(q.x, q.y, q.z, 0, 0, 0, 0.32 * s, 0.26 * s, 0.32 * s), barkD);
    const ns = 14 + r.int(0, 12);
    for (let k = 0; k < ns; k++) {
      const a2 = a + (r() - 0.5) * 1.6;
      const rise = (1.6 + r() * 2.6) * s * (opts.tall || 1);
      const out = (1.2 + r() * 2.8) * s * (0.5 + Math.cos(up));
      const droop = (0.2 + r() * 1.0) * s * (opts.droop || 1);
      const pts = [], ws = [];
      const N = 6;
      for (let j = 0; j <= N; j++) {
        const t = j / N;
        const hgt = rise * Math.sin(t * Math.PI / 2) - droop * Math.pow(t, 3);
        const o2 = out * (0.4 * t + 0.6 * t * t);
        pts.push(V(q.x + Math.cos(a2) * o2, q.y + hgt, q.z + Math.sin(a2) * o2));
        ws.push(Math.pow(t, 1.6) * s * 0.7);
      }
      for (let j = 0; j < N; j++) L.seg(pts[j], pts[j + 1], j < N - 2 ? shootC : tipC, ws[j], ws[j + 1]);
    }
    // 垂丝：先上扬再长长垂下，使树冠蓬松柔软
    const nh = 6 + r.int(0, 6);
    for (let k = 0; k < nh; k++) {
      const a2 = a + (r() - 0.5) * 1.4;
      const rise = (1.2 + r() * 1.6) * s * (opts.tall || 1);
      const out = (1.8 + r() * 2.4) * s;
      const fall = (2.2 + r() * 2.6) * s * (opts.droop || 1);
      const pts = [], ws = [];
      const N = 8;
      for (let j = 0; j <= N; j++) {
        const t = j / N;
        const hgt = rise * Math.sin(Math.min(1, t * 1.8) * Math.PI / 2) - fall * Math.pow(Math.max(0, t - 0.4) / 0.6, 1.6);
        const o2 = out * Math.sin(t * Math.PI / 2);
        pts.push(V(q.x + Math.cos(a2) * o2, q.y + hgt, q.z + Math.sin(a2) * o2));
        ws.push(Math.pow(t, 1.2) * s * 0.9);
      }
      for (let j = 0; j < N; j++) L.seg(pts[j], pts[j + 1], j < N - 3 ? shootC : tipC, ws[j], ws[j + 1]);
    }
  }
}

// 杂树：直干，枝条分叉，细枝成“蟹爪”
function bareTree(x, z, s, opts) {
  SCN.trees = (SCN.trees || 0) + 1;
  opts = opts || {};
  const r = makeRng(Math.floor(x * 97 + z * 53) + 3);
  s = s || 1;
  const y = groundY(x, z);
  const B = SB('vc', x), L = SL(x);
  const bark = jit(0x4a3e30, 0.08, r);
  const twig = jit(0x3c3228, 0.06, r);
  const H = (5 + r() * 4) * s;
  const lean = (r() - 0.5) * 0.25;
  const top = V(x + lean * H, y + H, z + (r() - 0.5) * 0.25 * H);
  const base = V(x, y - 0.2, z);
  const tr = (0.16 + r() * 0.1) * s;
  // 干：两段，略弯
  const mid = V(lerp(base.x, top.x, 0.5) + (r() - 0.5) * 0.6, lerp(base.y, top.y, 0.5), lerp(base.z, top.z, 0.5) + (r() - 0.5) * 0.5);
  B.add(gTaper(0.38, 0.5, 6, true), cylBetween(base, mid).multiply(new THREE.Matrix4().makeScale(tr * 2, 1, tr * 2)), bark);
  B.add(gTaper(0.25, 0.5, 6, true), cylBetween(mid, top).multiply(new THREE.Matrix4().makeScale(tr * 1.5, 1, tr * 1.5)), bark);
  const leafy = opts.leafy;
  const grow = (p, dir, len, depth, w) => {
    const q = p.clone().addScaledVector(dir, len);
    if (depth <= 1) {
      L.seg(p, q, twig, w, w + 0.15);
      // 蟹爪细梢
      for (let k = 0; k < 2; k++) {
        const d2 = dir.clone().add(V((r() - 0.5) * 1.2, r() * 0.6, (r() - 0.5) * 1.2)).normalize();
        L.seg(q, q.clone().addScaledVector(d2, len * 0.45), twig, w + 0.15, w + 0.25);
      }
      if (leafy && r() < 0.7) B.add(gIco(0), M(q.x, q.y, q.z, r(), r(), r(), len * 1.4, len * 0.7, len * 1.4), jit(leafy, 0.1, r));
      return;
    }
    if (depth >= 3) {
      const m = cylBetween(p, q).multiply(new THREE.Matrix4().makeScale(0.05 * depth * s, 1, 0.05 * depth * s));
      B.add(gTaper(0.6, 0.5, 4, true), m, bark);
    } else L.seg(p, q, twig, w, w + 0.1);
    const nk = depth >= 3 ? 3 : 2 + (r() < 0.5 ? 1 : 0);
    for (let k = 0; k < nk; k++) {
      const d2 = dir.clone().add(V((r() - 0.5) * 1.4, (r() - 0.2) * 0.8, (r() - 0.5) * 1.4)).normalize();
      grow(q, d2, len * (0.6 + r() * 0.2), depth - 1, w + 0.1);
    }
  };
  const nMain = 4 + r.int(0, 2);
  for (let i = 0; i < nMain; i++) {
    const t = 0.55 + i / nMain * 0.45;
    const p = V(lerp(base.x, top.x, t), lerp(base.y, top.y, t), lerp(base.z, top.z, t));
    const a = r() * Math.PI * 2;
    const dir = V(Math.cos(a), 0.5 + r() * 0.9, Math.sin(a)).normalize();
    grow(p, dir, (1.6 + r() * 1.2) * s, 4, 0.02);
  }
}

// 远景小树（低成本）
function distantTree(x, z, s) {
  const y = groundY(x, z);
  const B = SB('vc', x);
  const r = makeRng(Math.floor(x * 13 + z * 7));
  B.add(gCyl(4), M(x, y + 1.5 * s, z, 0, 0, 0, 0.18 * s, 3 * s, 0.18 * s), 0x4e4032);
  B.add(gIco(0), M(x, y + 3.6 * s, z, r(), r(), r(), 2.6 * s, 2.2 * s, 2.6 * s), jit(0x857a5e, 0.08, r));
}

// 船桅杆竖立的木排、货堆
function cargoPile(x, z, n) {
  const B = SB('vc', x);
  const y = groundY(x, z);
  for (let i = 0; i < n; i++) {
    const px = x + (RNG() - 0.5) * 2.2, pz = z + (RNG() - 0.5) * 1.6;
    B.add(gSphere(7, 5), M(px, y + 0.25 + (i > n / 2 ? 0.4 : 0), pz, 0, RNG() * 3, 0, 0.9, 0.48, 0.55), jit(0xd2c6a8, 0.06));
  }
}

// 水井（辘轳）
function well(x, z) {
  const y = groundY(x, z);
  const B = SB('vc', x);
  B.add(gBox(), M(x, y + 0.05, z, 0, 0, 0, 3.0, 0.1, 3.0), 0x9a8c70);
  B.add(gBox(), M(x, y + 0.3, z, 0, 0.3, 0, 1.3, 0.5, 1.3), 0x7d6e58);
  B.add(gBox(), M(x, y + 0.56, z, 0, 0.3, 0, 0.85, 0.04, 0.85), 0x2a2420);
  for (const sx of [1, -1]) B.add(gBox(), M(x + sx * 0.75, y + 0.9, z, 0, 0.3, 0, 0.1, 1.3, 0.1), 0x4f3a28);
  B.add(gCyl(6), M(x, y + 1.4, z, 0, 0.3, Math.PI / 2, 0.16, 1.6, 0.16), 0x5a4330);
}

// ---------- 虹桥 ----------
const BRIDGE = {};
function buildBridge() {
  const A = P(2912, 182), Bf = P(3112, 28); // 南（近）端、北（远）端
  const dir = V(Bf.x - A.x, 0, Bf.y - A.y);
  const L = dir.length(); dir.normalize();
  const yaw = Math.atan2(dir.x, dir.z); // 局部 +z 指向北端
  const cx = (A.x + Bf.x) / 2, cz = (A.y + Bf.y) / 2;
  const f = frame(cx, 0, cz, yaw);
  const HW = 4.6; // 半宽
  const peak = 6.4;
  const deck = (t) => 0.3 + peak * Math.pow(Math.max(0, 1 - Math.pow(2 * t - 1, 2)), 0.75); // t∈[0,1]
  Object.assign(BRIDGE, { A, Bf, L, yaw, cx, cz, HW, deck, f });
  WORLD.bridgeDeckY = (x, z) => {
    const dx = x - cx, dz = z - cz;
    const lz = dx * Math.sin(yaw) + dz * Math.cos(yaw);
    const lx = dx * Math.cos(yaw) - dz * Math.sin(yaw);
    const t = lz / L + 0.5;
    if (t < 0 || t > 1 || Math.abs(lx) > HW + 0.3) return null;
    return deck(t) + 0.12;
  };
  const B = SB('vc', cx), BK = SB('plank', cx);
  const N = 40;
  // 桥面板
  const pts = [], uvs = [], cols = [];
  for (let j = 0; j <= N; j++) for (let i = 0; i <= 1; i++) {
    const t = j / N;
    pts.push(f.pt((i - 0.5) * 2 * HW, deck(t) + 0.1, (t - 0.5) * L));
    uvs.push(i * HW, t * L / 1.0);
    cols.push(jit(0xb8a07c, 0.03));
  }
  BK.grid(pts, N + 1, 2, cols, uvs, null, true);
  // 桥身侧板（涂黑的护板）
  for (const sx of [1, -1]) {
    for (let j = 0; j < N; j++) {
      const t0 = j / N, t1 = (j + 1) / N;
      const a = f.pt(sx * HW, deck(t0) + 0.1, (t0 - 0.5) * L), b = f.pt(sx * HW, deck(t1) + 0.1, (t1 - 0.5) * L);
      const c = f.pt(sx * HW, deck(t1) - 0.55, (t1 - 0.5) * L), d = f.pt(sx * HW, deck(t0) - 0.55, (t0 - 0.5) * L);
      SB('vcDouble', cx).quad(a, b, c, d, 0x3a2f26);
    }
  }
  // 拱架：纵向巨木分几组相互搭接（叠梁拱），横木连系
  const t0 = 0.17, t1 = 0.83;
  const archY = (t) => {
    // 拱底：两端落在河岸石台，中间贴近桥面下
    const u = (t - t0) / (t1 - t0);
    const sp = 0.0 + Math.sin(u * Math.PI) * 0.0;
    void sp;
    return lerp(-0.4, deck(t) - 0.75, Math.pow(Math.sin(clamp(u, 0, 1) * Math.PI), 0.6));
  };
  const nodes = [0, 0.18, 0.36, 0.5, 0.64, 0.82, 1].map((u) => lerp(t0, t1, u));
  const nLong = 13;
  for (let k = 0; k < nLong; k++) {
    const lx = -HW + 0.35 + k * (2 * HW - 0.7) / (nLong - 1);
    for (let s = 0; s < nodes.length - 1; s++) {
      const ta = nodes[s], tb = nodes[s + 1];
      const off = (k % 2 ? 0.12 : -0.08);
      const a = f.pt(lx, archY(ta) + off, (ta - 0.5) * L), b = f.pt(lx, archY(tb) + off, (tb - 0.5) * L);
      B.add(gCyl(6), cylBetween(a, b).multiply(new THREE.Matrix4().makeScale(0.32, 1.08, 0.32)), jit(0x5a4634, 0.06));
    }
  }
  for (const t of nodes) {
    const a = f.pt(-HW - 0.2, archY(t), (t - 0.5) * L), b = f.pt(HW + 0.2, archY(t), (t - 0.5) * L);
    B.add(gCyl(7), cylBetween(a, b).multiply(new THREE.Matrix4().makeScale(0.42, 1, 0.42)), 0x2e2620);
    // 吊柱接桥面
    for (const sx of [-1, 1]) {
      const c = f.pt(sx * (HW - 0.3), archY(t), (t - 0.5) * L), d = f.pt(sx * (HW - 0.3), deck(t), (t - 0.5) * L);
      if (d.y - c.y > 0.3) B.add(gBox(), cylBetween(c, d).multiply(new THREE.Matrix4().makeScale(0.2, 1, 0.2)), 0x3a2f26);
    }
  }
  // 桥台：两岸石砌
  for (const t of [t0, t1]) {
    const p = f.pt(0, 0, (t - 0.5) * L);
    B.add(gBox(), M(p.x, -1.45, p.z, 0, yaw, 0, 2 * HW + 3, 2.2, 3.5), 0x857256);
  }
  // 栏杆：望柱 + 寻杖 + 盆唇
  for (const sx of [1, -1]) {
    const np = 34;
    let prevTop = null, prevMid = null;
    for (let j = 0; j <= np; j++) {
      const t = 0.02 + 0.96 * j / np;
      const y = deck(t) + 0.1;
      const base = f.pt(sx * (HW - 0.12), y, (t - 0.5) * L);
      B.add(gBox(), M(base.x, base.y + 0.55, base.z, 0, yaw, 0, 0.14, 1.1, 0.14), 0x4a3a2c);
      const top = base.clone().add(V(0, 1.05, 0)), mid = base.clone().add(V(0, 0.5, 0));
      if (prevTop) {
        B.add(gBox(), cylBetween(prevTop, top).multiply(new THREE.Matrix4().makeScale(0.1, 1, 0.12)), 0x5a4634);
        B.add(gBox(), cylBetween(prevMid, mid).multiply(new THREE.Matrix4().makeScale(0.06, 1, 0.06)), 0x5a4634);
      }
      prevTop = top; prevMid = mid;
    }
  }
  // 桥头四根望杆（华表），顶端立鹤
  for (const t of [0.0, 1.0]) for (const sx of [1, -1]) {
    const p = f.pt(sx * (HW + 0.6), 0, (t - 0.5) * L + (t ? 1.2 : -1.2));
    const y = groundY(p.x, p.z);
    B.add(gCyl(7), M(p.x, y + 5.5, p.z, 0, 0, 0, 0.24, 11, 0.24), 0x4a3a2c);
    B.add(gBox(), M(p.x, y + 9.6, p.z, 0, yaw + Math.PI / 4, 0, 1.6, 0.12, 0.12), 0x4a3a2c);
    B.add(gSphere(6, 4), M(p.x, y + 11.2, p.z, 0, 0, 0, 0.3, 0.3, 0.6), 0xe8e0d0);
    B.add(gBox(), M(p.x, y + 11.5, p.z + 0.25, 0, 0, 0, 0.05, 0.35, 0.05), 0x2a2420);
  }
  STATIC.labels.push({ text: '虹桥', pos: f.pt(0, peak + 6, 0), major: true });
  return BRIDGE;
}

// ---------- 城门 ----------
function frustumBlock(B, x0, x1, z0, z1, y0, y1, batter, color) {
  // 四面收分的砖台（世界坐标轴对齐）
  const b = batter;
  const p = (x, y, z) => V(x, y, z);
  const bl = [p(x0, y0, z0), p(x1, y0, z0), p(x1, y0, z1), p(x0, y0, z1)];
  const tl = [p(x0 + b.x0, y1, z0 + b.z0), p(x1 - b.x1, y1, z0 + b.z0), p(x1 - b.x1, y1, z1 - b.z1), p(x0 + b.x0, y1, z1 - b.z1)];
  const uv = (a, c, e, g, horiz) => horiz;
  void uv;
  const face = (a, bb, c, d) => {
    const w = a.distanceTo(bb) / 3, h = a.distanceTo(d) / 3;
    B.quad(a, bb, c, d, color, null, [[0, 0], [w, 0], [w, h], [0, h]]);
  };
  face(bl[0], bl[1], tl[1], tl[0]); // -z 面
  face(bl[2], bl[3], tl[3], tl[2]); // +z 面
  face(bl[1], bl[2], tl[2], tl[1]); // +x
  face(bl[3], bl[0], tl[0], tl[3]); // -x
  B.quad(tl[0], tl[1], tl[2], tl[3], color, null, [[0, 0], [1, 0], [1, 1], [0, 1]]);
}

function buildGate() {
  const gx = PX(1112), gz = PZ(186);
  const BR = SB('brick', gx), B = SB('vc', gx);
  const hx = 8.5, zN = gz - 17, zS = gz + 17, tw = 3.0, H = 8.5;
  const c = 0xd9cfbd;
  // 门洞两侧墩台
  frustumBlock(BR, gx - hx, gx + hx, zN, gz - tw, -0.5, H, { x0: 1.2, x1: 1.2, z0: 1.2, z1: 0 }, c);
  frustumBlock(BR, gx - hx, gx + hx, gz + tw, zS, -0.5, H, { x0: 1.2, x1: 1.2, z0: 0, z1: 1.2 }, c);
  // 门洞上方
  frustumBlock(BR, gx - hx, gx + hx, gz - tw - 0.01, gz + tw + 0.01, 5.6, H, { x0: 1.2 * (H - 5.6) / (H + 0.5), x1: 1.2 * (H - 5.6) / (H + 0.5), z0: 0, z1: 0 }, c);
  // 门洞内木排叉柱（梯形门洞）
  for (let k = -5; k <= 5; k++) {
    const x = gx + k * 1.55;
    for (const sz of [1, -1]) {
      const a = V(x, 0, gz + sz * tw * 0.98), b = V(x, 5.0, gz + sz * (tw * 0.98 - 0.6));
      B.add(gBox(), cylBetween(a, b).multiply(new THREE.Matrix4().makeScale(0.25, 1, 0.25)), 0x4a3828);
    }
    B.add(gBox(), M(x, 5.2, gz, 0, 0, 0, 0.25, 0.25, tw * 2 - 1.0), 0x4a3828);
  }
  B.add(gBox(), M(gx, 5.45, gz, 0, 0, 0, hx * 2, 0.2, tw * 2), 0x3a2e24);
  // 城门两扇（敞开）
  for (const sz of [1, -1]) B.add(gBox(), M(gx + hx - 0.6, 2.4, gz + sz * (tw - 0.5), 0, sz * 0.2, 0, 0.18, 4.8, 2.4), 0x5a3a2a);
  // 门额
  // 城台上的平座与城楼
  const top = H;
  B.add(gBox(), M(gx, top + 0.12, gz, 0, 0, 0, hx * 2 - 2.6, 0.24, zS - zN - 2.6), 0x8c7c62);
  // 女墙
  for (const sx of [1, -1]) B.add(gBox(), M(gx + sx * (hx - 1.4), top + 0.6, gz, 0, 0, 0, 0.4, 1.0, zS - zN - 3), 0xb7aa92);
  const f = house({ x: gx, z: gz, y: top + 0.24, yaw: Math.PI / 2, w: 19, d: 9.5, h: 4.2, plat: 0.6, open: false, stories: 1, type: 'hip', pitch: 0.55, lift: 0.7, deepEave: 0.4, interior: false });
  // 城楼平座栏杆
  const railY = top + 1.0;
  for (const sx of [1, -1]) {
    B.add(gBox(), M(gx + sx * 6.1, railY, gz, 0, 0, 0, 0.1, 0.08, 23), 0x7a3e2e);
    B.add(gBox(), M(gx, railY, gz + sx * 11.4, 0, 0, 0, 12.2, 0.08, 0.1), 0x7a3e2e);
    for (let k = -11; k <= 11; k += 1.5) B.add(gBox(), M(gx + sx * 6.1, railY - 0.4, gz + k, 0, 0, 0, 0.09, 0.8, 0.09), 0x6a3628);
  }
  // 马道（城台北侧坡道）
  const rp = [V(gx - hx - 0.5, 0, zN + 4), V(gx - hx - 0.5, top, zN + 14)];
  B.add(gBox(), cylBetween(rp[0], rp[1]).multiply(new THREE.Matrix4().makeScale(2.4, 1, 0.6)), 0xa89a82);
  // 两侧土城墙（低矮，草木覆盖）
  for (const [z0, z1] of [[zN - 26, zN + 0.5], [zS - 0.5, zS + 16]]) {
    const n = 8;
    for (let k = 0; k < n; k++) {
      const z = lerp(z0, z1, (k + 0.5) / n);
      B.add(gSphere(8, 5), M(gx + (RNG() - 0.5), 1.2, z, 0, 0, 0, 13, 6 + RNG() * 2, (z1 - z0) / n * 1.6), jit(0xa8946c, 0.05));
    }
  }
  STATIC.labels.push({ text: '城门楼', pos: V(gx, top + 14, gz), major: true });
  signBoard(gx + hx - 0.2, 6.9, gz, Math.PI / 2, '城门', { vertical: false, w: 2.0, h: 0.9, bg: '#2e3a40', fg: '#e8dcc0' });
  return f;
}

// ---------- 炊烟 ----------
function buildSmoke(scene) {
  if (!STATIC.smoke.length) return;
  const per = 14;
  const n = STATIC.smoke.length * per;
  const pos = new Float32Array(n * 3), ph = new Float32Array(n);
  STATIC.smoke.forEach((p, i) => {
    for (let k = 0; k < per; k++) {
      const j = i * per + k;
      pos[j * 3] = p.x; pos[j * 3 + 1] = p.y; pos[j * 3 + 2] = p.z;
      ph[j] = k / per + RNG() * 0.03;
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aPh', new THREE.BufferAttribute(ph, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, map: { value: TEX.smoke }, uScale: { value: 600 } },
    vertexShader: `attribute float aPh; uniform float uTime; uniform float uScale; varying float vA;
      void main(){
        float t = fract(uTime*0.06 + aPh);
        vec3 p = position;
        p.y += t*9.0; p.x += t*t*5.0 + sin(t*6.0+aPh*20.0)*0.6; p.z += sin(t*4.0+aPh*13.0)*0.5;
        vec4 mv = modelViewMatrix*vec4(p,1.0);
        gl_Position = projectionMatrix*mv;
        gl_PointSize = uScale*(0.6+t*2.6)/(-mv.z);
        vA = smoothstep(0.0,0.15,t)*(1.0-t)*0.55;
      }`,
    fragmentShader: `uniform sampler2D map; varying float vA;
      void main(){ vec4 c = texture2D(map, gl_PointCoord); gl_FragColor = vec4(c.rgb, c.a*vA); }`,
    transparent: true, depthWrite: false
  });
  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false;
  scene.add(pts);
  STATIC.smokeMat = m;
}

function buildFlags(scene) {
  if (FLAGB.empty) return;
  const mesh = new THREE.Mesh(FLAGB.build(), MAT.flag);
  scene.add(mesh);
}
