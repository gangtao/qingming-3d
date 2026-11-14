// ============================================================
// 00_base.js — 基础零件：随机数、几何拼装器、程序贴图、材质
// ============================================================
'use strict';

// ---------- 可复现随机数 ----------
function makeRng(seed) {
  let s = (seed >>> 0) || 1;
  const r = function () {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return (s >>> 0) / 4294967296;
  };
  r.range = (a, b) => a + (b - a) * r();
  r.int = (a, b) => Math.floor(a + (b - a + 1) * r());
  r.pick = (arr) => arr[Math.floor(r() * arr.length)];
  r.chance = (p) => r() < p;
  r.sign = () => (r() < 0.5 ? -1 : 1);
  return r;
}
const RNG = makeRng(20240405);

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
function smooth(a, b, x) { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }

// 2D 值噪声
function hash2(x, y) {
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}
function fbm(x, y, oct) {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < (oct || 4); i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= 0.5; }
  return s;
}

// ---------- 颜色 ----------
const _c = new THREE.Color();
function col(hex) { return new THREE.Color(hex); }
function jit(hex, amt, rng) {
  const c = new THREE.Color(hex);
  const r = rng || RNG;
  const k = 1 + (r() - 0.5) * 2 * (amt == null ? 0.08 : amt);
  c.r = clamp(c.r * k + (r() - 0.5) * 0.02, 0, 1);
  c.g = clamp(c.g * k + (r() - 0.5) * 0.02, 0, 1);
  c.b = clamp(c.b * k + (r() - 0.5) * 0.02, 0, 1);
  return c;
}

// 绢本调色板（暖褐、赭石、花青淡彩）
const PAL = {
  silk: 0xb8a27e,
  ground: 0xa48e6a,
  road: 0xb5a17c,
  bank: 0x857256,
  ink: 0x2e2620,
  inkSoft: 0x4a3f33,
  wood: 0x6e5238,
  woodDark: 0x4a3626,
  woodRed: 0x7d4a33,
  plaster: 0xd6c6a3,
  plasterDark: 0xbca986,
  tile: 0x6a6258,
  thatch: 0x9b8458,
  stone: 0xa39478,
  brick: 0x8f8170,
  skin: 0xd9b48a,
  hair: 0x1f1a16,
  willow: 0x6f6a45,
  twig: 0x4a3d2e,
  leaf: 0x6f7552,
  water: 0x9d8c6c,
  mat: 0x8e7650,
  red: 0x9a4a35,
  cyan: 0x5f7a72
};

// 服色（低饱和）
const CLOTH = [0xe3d6bb, 0xd8c9a8, 0xcbbd9c, 0xb9ab8c, 0x8d8a78, 0x6f6c60, 0x5d6660, 0x7a8478, 0x9aa197,
  0xc8b897, 0xa58f6c, 0x7c6a52, 0x4c4a44, 0xe8dfca, 0x8e9b98, 0xb7a487, 0x6b7a74];
const CLOTH_DARK = [0x3b3833, 0x4c4741, 0x5c564c, 0x6d675b, 0x47504c, 0x58524a];

// ---------- 矩阵 ----------
const _m4 = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _v3 = new THREE.Vector3();
const _s3 = new THREE.Vector3();
function M(tx, ty, tz, rx, ry, rz, sx, sy, sz) {
  _e.set(rx || 0, ry || 0, rz || 0, 'YXZ');
  _q.setFromEuler(_e);
  _v3.set(tx || 0, ty || 0, tz || 0);
  _s3.set(sx == null ? 1 : sx, sy == null ? (sx == null ? 1 : sx) : sy, sz == null ? (sx == null ? 1 : sx) : sz);
  return new THREE.Matrix4().compose(_v3, _q, _s3);
}
// 两点之间放一根圆柱（圆柱默认沿 y 轴，高度 1）
function cylBetween(a, b) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return new THREE.Matrix4().compose(mid, q, new THREE.Vector3(1, len, 1));
}

// ---------- 基本几何（缓存） ----------
const GEO = {};
function gBox() { return GEO.box || (GEO.box = new THREE.BoxGeometry(1, 1, 1).toNonIndexed()); }
function gCyl(seg, open) {
  const k = 'cyl' + seg + (open ? 'o' : '');
  return GEO[k] || (GEO[k] = new THREE.CylinderGeometry(0.5, 0.5, 1, seg, 1, !!open).toNonIndexed());
}
function gCone(seg) {
  const k = 'cone' + seg;
  return GEO[k] || (GEO[k] = new THREE.CylinderGeometry(0, 0.5, 1, seg, 1, false).toNonIndexed());
}
function gTaper(rt, rb, seg, open) {
  const k = 'tp' + rt + '_' + rb + '_' + seg + (open ? 'o' : '');
  return GEO[k] || (GEO[k] = new THREE.CylinderGeometry(rt, rb, 1, seg, 1, !!open).toNonIndexed());
}
function gSphere(w, h) {
  const k = 'sph' + w + '_' + h;
  return GEO[k] || (GEO[k] = new THREE.SphereGeometry(0.5, w || 8, h || 6).toNonIndexed());
}
function gHemi(w, h) {
  const k = 'hemi' + w + '_' + h;
  return GEO[k] || (GEO[k] = new THREE.SphereGeometry(0.5, w || 8, h || 4, 0, Math.PI * 2, 0, Math.PI / 2).toNonIndexed());
}
function gTorus(r, t, rs, ts, arc) {
  const k = 'tor' + r + t + rs + ts + (arc || 0);
  return GEO[k] || (GEO[k] = new THREE.TorusGeometry(r, t, rs, ts, arc || Math.PI * 2).toNonIndexed());
}
function gPlane() { return GEO.plane || (GEO.plane = new THREE.PlaneGeometry(1, 1).toNonIndexed()); }
function gIco(d) { const k = 'ico' + (d || 0); return GEO[k] || (GEO[k] = new THREE.IcosahedronGeometry(0.5, d || 0).toNonIndexed()); }

// ---------- 几何拼装器 ----------
// 把许多小零件合并成一个 BufferGeometry，带顶点色、uv 以及自定义的逐顶点属性
class GeoBuilder {
  constructor(attrDefs) {
    // attrDefs: { name: itemSize }
    this.defs = attrDefs || {};
    this.pos = []; this.nor = []; this.col = []; this.uv = [];
    this.ext = {};
    for (const k in this.defs) this.ext[k] = [];
    this.count = 0;
  }
  // geo 非索引几何；mat 矩阵；color THREE.Color 或 hex；attrs 常量属性；uvFn(pos,normal)->[u,v]
  add(geo, mat, color, attrs, uvMode) {
    const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
    const c = (color && color.isColor) ? color : _c.set(color == null ? 0xffffff : color);
    const cr = c.r, cg = c.g, cb = c.b;
    const nm = new THREE.Matrix3().getNormalMatrix(mat);
    const det = mat.determinant();
    const v = new THREE.Vector3(), nn = new THREE.Vector3();
    const cnt = p.count;
    const P = [], N = [], UV = [];
    for (let i = 0; i < cnt; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(mat);
      nn.fromBufferAttribute(n, i).applyMatrix3(nm).normalize();
      P.push(v.x, v.y, v.z); N.push(nn.x, nn.y, nn.z);
      if (Array.isArray(uvMode)) UV.push(uvMode[0], uvMode[1]);
      else if (uvMode === 'world') {
        // 依据法线选择投影面的世界坐标 uv
        const ax = Math.abs(nn.x), ay = Math.abs(nn.y), az = Math.abs(nn.z);
        if (ay >= ax && ay >= az) UV.push(v.x, v.z); else if (ax >= az) UV.push(v.z, v.y); else UV.push(v.x, v.y);
      } else if (uv) UV.push(uv.getX(i), uv.getY(i)); else UV.push(0, 0);
    }
    // 镜像矩阵时翻转绕序
    if (det < 0) {
      for (let i = 0; i < cnt; i += 3) {
        for (let k = 0; k < 3; k++) { const t = P[(i + 1) * 3 + k]; P[(i + 1) * 3 + k] = P[(i + 2) * 3 + k]; P[(i + 2) * 3 + k] = t; }
        for (let k = 0; k < 3; k++) { const t = N[(i + 1) * 3 + k]; N[(i + 1) * 3 + k] = N[(i + 2) * 3 + k]; N[(i + 2) * 3 + k] = t; }
        for (let k = 0; k < 2; k++) { const t = UV[(i + 1) * 2 + k]; UV[(i + 1) * 2 + k] = UV[(i + 2) * 2 + k]; UV[(i + 2) * 2 + k] = t; }
      }
    }
    for (let i = 0; i < P.length; i++) this.pos.push(P[i]);
    for (let i = 0; i < N.length; i++) this.nor.push(N[i]);
    for (let i = 0; i < UV.length; i++) this.uv.push(UV[i]);
    for (let i = 0; i < cnt; i++) this.col.push(cr, cg, cb);
    for (const k in this.defs) {
      const sz = this.defs[k];
      const val = attrs && attrs[k] != null ? attrs[k] : 0;
      for (let i = 0; i < cnt; i++) {
        if (sz === 1) this.ext[k].push(val);
        else for (let j = 0; j < sz; j++) this.ext[k].push(val[j]);
      }
    }
    this.count += cnt;
    return this;
  }
  // 直接加三角形（世界坐标），用于地形、屋面等自定义网格
  tri(a, b, c, color, attrs, uva, uvb, uvc) {
    const e1 = new THREE.Vector3().subVectors(b, a), e2 = new THREE.Vector3().subVectors(c, a);
    const n = e1.cross(e2).normalize();
    const cc = (color && color.isColor) ? color : _c.set(color);
    [a, b, c].forEach((p) => { this.pos.push(p.x, p.y, p.z); this.nor.push(n.x, n.y, n.z); this.col.push(cc.r, cc.g, cc.b); });
    this.uv.push(...(uva || [0, 0]), ...(uvb || [0, 0]), ...(uvc || [0, 0]));
    for (const k in this.defs) {
      const sz = this.defs[k]; const val = attrs && attrs[k] != null ? attrs[k] : 0;
      for (let i = 0; i < 3; i++) { if (sz === 1) this.ext[k].push(val); else for (let j = 0; j < sz; j++) this.ext[k].push(val[j]); }
    }
    this.count += 3;
  }
  quad(a, b, c, d, color, attrs, uvs) {
    uvs = uvs || [[0, 0], [1, 0], [1, 1], [0, 1]];
    this.tri(a, b, c, color, attrs, uvs[0], uvs[1], uvs[2]);
    this.tri(a, c, d, color, attrs, uvs[0], uvs[2], uvs[3]);
  }
  // 带平滑法线的网格（rows x cols 顶点）
  grid(pts, rows, cols, colors, uvs, attrs, flip) {
    // pts: Vector3 数组 rows*cols；先估计法线
    const nrm = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const pr = pts[Math.min(r + 1, rows - 1) * cols + c], pl = pts[Math.max(r - 1, 0) * cols + c];
      const pu = pts[r * cols + Math.min(c + 1, cols - 1)], pd = pts[r * cols + Math.max(c - 1, 0)];
      const a = new THREE.Vector3().subVectors(pr, pl), b = new THREE.Vector3().subVectors(pu, pd);
      const n = flip ? a.cross(b) : b.cross(a);
      nrm[i] = n.normalize();
    }
    const push = (i) => {
      const p = pts[i], n = nrm[i];
      this.pos.push(p.x, p.y, p.z); this.nor.push(n.x, n.y, n.z);
      const cc = colors ? (colors[i].isColor ? colors[i] : _c.set(colors[i])) : _c.set(0xffffff);
      this.col.push(cc.r, cc.g, cc.b);
      this.uv.push(uvs ? uvs[i * 2] : 0, uvs ? uvs[i * 2 + 1] : 0);
      for (const k in this.defs) {
        const sz = this.defs[k]; const val = attrs && attrs[k] != null ? attrs[k] : 0;
        if (sz === 1) this.ext[k].push(val); else for (let j = 0; j < sz; j++) this.ext[k].push(val[j]);
      }
      this.count++;
    };
    for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cols - 1; c++) {
      const a = r * cols + c, b = a + 1, d = a + cols, e = d + 1;
      if (flip) { push(a); push(e); push(b); push(a); push(d); push(e); }
      else { push(a); push(b); push(e); push(a); push(e); push(d); }
    }
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    for (const k in this.defs) g.setAttribute(k, new THREE.Float32BufferAttribute(this.ext[k], this.defs[k]));
    g.computeBoundingSphere();
    g.computeBoundingBox();
    return g;
  }
  get empty() { return this.count === 0; }
}

// 线段拼装器（细枝、柳条、绳索），带摇摆权重
class LineBuilder {
  constructor() { this.pos = []; this.col = []; this.sw = []; this.count = 0; }
  seg(a, b, color, wa, wb) {
    const c = (color && color.isColor) ? color : _c.set(color);
    this.pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
    this.col.push(c.r, c.g, c.b, c.r, c.g, c.b);
    this.sw.push(wa || 0, wb || 0);
    this.count += 2;
  }
  poly(pts, color, weights) {
    for (let i = 0; i < pts.length - 1; i++) this.seg(pts[i], pts[i + 1], color, weights ? weights[i] : 0, weights ? weights[i + 1] : 0);
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('aSway', new THREE.Float32BufferAttribute(this.sw, 1));
    g.computeBoundingSphere();
    return g;
  }
}

// ---------- 程序贴图 ----------
function canvasTex(w, h, draw, repeat) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  if (repeat) t.repeat.set(repeat[0], repeat[1]);
  return t;
}
function speckle(ctx, w, h, n, alpha, rng) {
  for (let i = 0; i < n; i++) {
    const v = Math.floor(rng() * 80);
    ctx.fillStyle = `rgba(${v},${v * 0.8 | 0},${v * 0.6 | 0},${alpha * rng()})`;
    ctx.fillRect(rng() * w, rng() * h, 1 + rng() * 2, 1 + rng() * 2);
  }
}

const TEX = {};
function buildTextures() {
  const r = makeRng(77);
  // 瓦顶：竖向瓦垄（筒瓦）+ 横向瓦片接缝；u 沿檐口，v 沿坡向
  TEX.tile = canvasTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#d8d0c4'; ctx.fillRect(0, 0, w, h);
    const lanes = 8, lw = w / lanes;
    for (let i = 0; i < lanes; i++) {
      const x = i * lw;
      // 板瓦凹槽
      const g = ctx.createLinearGradient(x, 0, x + lw, 0);
      g.addColorStop(0, '#8f877b'); g.addColorStop(0.18, '#c9c0b2'); g.addColorStop(0.5, '#ddd5c8'); g.addColorStop(0.82, '#c9c0b2'); g.addColorStop(1, '#8f877b');
      ctx.fillStyle = g; ctx.fillRect(x, 0, lw, h);
      // 筒瓦（瓦垄）
      ctx.fillStyle = '#5c554c'; ctx.fillRect(x - 1.6, 0, 3.2, h);
      ctx.fillStyle = '#efe8dc'; ctx.fillRect(x + 1.0, 0, 0.8, h);
      for (let j = 0; j < 8; j++) {
        ctx.fillStyle = 'rgba(40,34,28,0.55)';
        ctx.fillRect(x + 2, j * h / 8, lw - 4, 1.3);
        ctx.fillStyle = 'rgba(40,34,28,0.9)';
        ctx.fillRect(x - 2.2, j * h / 8 + 3, 4.4, 1.2);
      }
    }
    speckle(ctx, w, h, 600, 0.25, r);
  });
  // 茅草
  TEX.thatch = canvasTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#c8b48c'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) {
      const x = r() * w, y = r() * h, l = 6 + r() * 16;
      const v = 70 + r() * 90;
      ctx.strokeStyle = `rgba(${v | 0},${(v * 0.85) | 0},${(v * 0.6) | 0},${0.35 + r() * 0.4})`;
      ctx.lineWidth = 0.6 + r() * 0.8;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (r() - 0.5) * 3, y + l); ctx.stroke();
    }
    for (let j = 0; j < 4; j++) { ctx.fillStyle = 'rgba(60,45,30,0.25)'; ctx.fillRect(0, j * 32 + 28, w, 3); }
  });
  // 席篷（编织）
  TEX.mat = canvasTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#cdb994'; ctx.fillRect(0, 0, w, h);
    const c = 4;
    for (let y = 0; y < h; y += c) for (let x = 0; x < w; x += c) {
      const o = ((x + y) / c) % 2;
      ctx.fillStyle = o ? 'rgba(95,75,50,0.16)' : 'rgba(255,245,220,0.12)';
      ctx.fillRect(x, y, c, c);
      ctx.fillStyle = 'rgba(70,55,35,0.22)';
      if (o) ctx.fillRect(x, y, c, 0.7); else ctx.fillRect(x, y, 0.7, c);
    }
    speckle(ctx, w, h, 300, 0.12, r);
  });
  // 船板：横向木板 + 钉眼
  TEX.plank = canvasTex(128, 64, (ctx, w, h) => {
    ctx.fillStyle = '#d8c3a0'; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 8) {
      ctx.fillStyle = `rgba(110,80,50,${0.15 + r() * 0.15})`; ctx.fillRect(0, y, w, 8);
      ctx.fillStyle = 'rgba(50,35,22,0.7)'; ctx.fillRect(0, y, w, 1);
      for (let x = (y / 8 % 2) * 8; x < w; x += 16) { ctx.fillStyle = 'rgba(30,20,15,0.85)'; ctx.fillRect(x, y + 4, 1.5, 1.5); }
    }
    speckle(ctx, w, h, 200, 0.2, r);
  });
  // 格子窗
  TEX.lattice = canvasTex(64, 64, (ctx, w, h) => {
    ctx.fillStyle = '#e6dcc4'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#5a4430'; ctx.lineWidth = 1.6;
    for (let i = 0; i <= w; i += 8) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); }
    for (let i = 0; i <= h; i += 8) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke(); }
    ctx.lineWidth = 4; ctx.strokeRect(0, 0, w, h);
  });
  // 砖（城台）
  TEX.brick = canvasTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#cfc4b0'; ctx.fillRect(0, 0, w, h);
    for (let y = 0, row = 0; y < h; y += 8, row++) {
      ctx.fillStyle = 'rgba(70,60,50,0.55)'; ctx.fillRect(0, y, w, 1);
      for (let x = (row % 2) * 8; x < w; x += 16) ctx.fillRect(x, y, 1, 8);
    }
    speckle(ctx, w, h, 500, 0.25, r);
  });
  // 墙面（灰泥，带水渍）
  TEX.plaster = canvasTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#ece4d2'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(120,100,70,${r() * 0.07})`;
      ctx.beginPath(); ctx.ellipse(r() * w, r() * h, 6 + r() * 20, 4 + r() * 12, 0, 0, Math.PI * 2); ctx.fill();
    }
    speckle(ctx, w, h, 300, 0.15, r);
  });
  // 地面：绢丝纹理 + 斑驳
  TEX.ground = canvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#e4ddce'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = `rgba(110,90,60,${r() * 0.06})`;
      ctx.beginPath(); ctx.ellipse(r() * w, r() * h, 10 + r() * 40, 5 + r() * 18, r() * 3, 0, Math.PI * 2); ctx.fill();
    }
    // 皴擦短笔
    for (let i = 0; i < 300; i++) {
      const x = r() * w, y = r() * h;
      ctx.strokeStyle = `rgba(80,62,40,${0.05 + r() * 0.1})`; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 4 + r() * 10, y + (r() - 0.5) * 2); ctx.stroke();
    }
    speckle(ctx, w, h, 1500, 0.12, r);
  });
  // 绢纹（屏幕叠加用）
  TEX.silkCanvas = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = 'rgb(128,128,128)'; ctx.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 128; y += 2) { ctx.fillStyle = `rgba(90,70,40,${0.06 + r() * 0.05})`; ctx.fillRect(0, y, 128, 1); }
    for (let x = 0; x < 128; x += 2) { ctx.fillStyle = `rgba(255,240,210,${0.04 + r() * 0.04})`; ctx.fillRect(x, 0, 1, 128); }
    speckle(ctx, 128, 128, 400, 0.08, r);
    return cv;
  })();
  // 旗幌：酒旗条纹
  TEX.flag = canvasTex(32, 64, (ctx, w, h) => {
    ctx.fillStyle = '#e9e0cc'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#3c4b55'; ctx.fillRect(0, 0, w / 3, h); ctx.fillRect(2 * w / 3, 0, w / 3, h);
  });
  // 烟
  TEX.smoke = canvasTex(64, 64, (ctx, w, h) => {
    const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 31);
    g.addColorStop(0, 'rgba(235,228,212,0.55)'); g.addColorStop(0.6, 'rgba(225,215,195,0.2)'); g.addColorStop(1, 'rgba(220,210,190,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
  TEX.smoke.wrapS = TEX.smoke.wrapT = THREE.ClampToEdgeWrapping;
}

// ---------- 共享 uniform 与材质 ----------
const U = { uTime: { value: 0 } };
const MAT = {};
function buildMaterials() {
  const lam = (o) => new THREE.MeshLambertMaterial(Object.assign({ vertexColors: true }, o));
  MAT.vc = lam({});
  MAT.vcDouble = lam({ side: THREE.DoubleSide });
  MAT.tile = lam({ map: TEX.tile, side: THREE.DoubleSide });
  MAT.thatch = lam({ map: TEX.thatch, side: THREE.DoubleSide });
  MAT.mat = lam({ map: TEX.mat, side: THREE.DoubleSide });
  MAT.plank = lam({ map: TEX.plank, side: THREE.DoubleSide });
  MAT.lattice = lam({ map: TEX.lattice, side: THREE.DoubleSide });
  MAT.brick = lam({ map: TEX.brick, side: THREE.DoubleSide });
  MAT.plaster = lam({ map: TEX.plaster });
  // 墨线（界画勾勒）
  MAT.ink = new THREE.LineBasicMaterial({ color: 0x3a2f25, transparent: true, opacity: 0.55, fog: true });
  // 细枝与柳条：顶点着色器里随风摆动
  MAT.twig = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85, fog: true });
  MAT.twig.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.uTime;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aSway;\nuniform float uTime;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float ph = position.x * 0.31 + position.z * 0.17;
        float sw = aSway;
        transformed.x += sw * (0.22 * sin(uTime * 1.3 + ph) + 0.08 * sin(uTime * 3.1 + ph * 2.0));
        transformed.z += sw * 0.12 * sin(uTime * 1.1 + ph * 1.4);
        transformed.y -= sw * 0.03 * (1.0 + sin(uTime * 1.3 + ph));`);
  };
  MAT.twig.customProgramCacheKey = () => 'twig';
  // 旗幌、酒旗：风中飘动（顶点 uv.x 为离旗杆的距离）
  MAT.flag = new THREE.MeshLambertMaterial({ vertexColors: true, map: TEX.flag, side: THREE.DoubleSide });
  MAT.flag.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.uTime;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float fw = uv.y;
        float ph2 = position.x * 0.5 + position.z * 0.3;
        transformed.x += fw * 0.18 * sin(uTime * 2.6 + ph2 + fw * 3.0);
        transformed.z += fw * 0.18 * cos(uTime * 2.2 + ph2 + fw * 2.0);`);
  };
  MAT.flag.customProgramCacheKey = () => 'flag';
}
