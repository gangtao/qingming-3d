/* ===== 00 基础零件 =====
 * 随机数、程序纹理、材质，以及把大量小零件合并成少数网格的 Geo 累加器。
 * 构建时所有模块按文件名顺序拼成同一个 <script>，共享全局作用域。
 */
var QM = window.QM = window.QM || {};
QM.L = 1600;                                  // 卷长（世界单位，约等于米）

function rngFactory(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
var RND = rngFactory(20260714);
function rnd(a = 0, b = 1) { return a + (b - a) * RND(); }
function rint(a, b) { return Math.floor(rnd(a, b + 1)); }
function pick(arr) { return arr[Math.floor(RND() * arr.length)]; }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function smooth(a, b, x) { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
function lerp(a, b, t) { return a + (b - a) * t; }
function nrm3(v) { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }

// 位置 + 欧拉角 + 缩放 -> 矩阵（角度为弧度，旋转顺序 YXZ）
function M(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  return new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')),
    new THREE.Vector3(sx, sy, sz));
}

// 三角形列表（每个三角形是 3 个 [x,y,z]）-> BufferGeometry，可选 uv 函数
function geoFromTris(tris, uvFn = null) {
  const pos = [], uv = [];
  for (const t of tris) for (const p of t) {
    pos.push(p[0], p[1], p[2]);
    if (uvFn) { const q = uvFn(p); uv.push(q[0], q[1]); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  if (uvFn) g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

/* Geo：顶点色累加器。所有零件都写进它，最后 build() 成一个 BufferGeometry。
 * 每个三角形带一点明暗抖动，模拟绢本上墨色的浓淡不均。 */
class Geo {
  constructor() { this.p = []; this.c = []; this.u = []; this.tris = 0; }
  add(g, m = null, col = 0xffffff) {
    const ng = g.index ? g.toNonIndexed() : g;
    const P = ng.attributes.position, U = ng.attributes.uv;
    const base = col instanceof THREE.Color ? col : new THREE.Color(col);
    const v = new THREE.Vector3();
    let j = 1;
    for (let i = 0; i < P.count; i++) {
      v.fromBufferAttribute(P, i);
      if (m) v.applyMatrix4(m);
      if (i % 3 === 0) j = 0.9 + 0.2 * RND();
      this.p.push(v.x, v.y, v.z);
      this.c.push(base.r * j, base.g * j, base.b * j);
      if (U) this.u.push(U.getX(i), U.getY(i)); else this.u.push(0, 0);
    }
    this.tris += P.count / 3;
    return this;
  }
  // 把另一个 Geo（已在局部坐标）经矩阵并入
  merge(src, m = null) {
    const v = new THREE.Vector3();
    for (let i = 0; i < src.p.length; i += 3) {
      v.set(src.p[i], src.p[i + 1], src.p[i + 2]);
      if (m) v.applyMatrix4(m);
      this.p.push(v.x, v.y, v.z);
    }
    for (const x of src.c) this.c.push(x);
    for (const x of src.u) this.u.push(x);
    this.tris += src.tris;
    return this;
  }
  tri(list, col = 0xffffff, uvFn = null) { return this.add(geoFromTris(list, uvFn), null, col); }
  box(x, y, z, w, h, d, col = 0xffffff, rx = 0, ry = 0, rz = 0) {
    return this.add(new THREE.BoxGeometry(w, h, d), M(x, y, z, rx, ry, rz), col);
  }
  cyl(x, y, z, rt, rb, h, seg, col = 0xffffff, rx = 0, ry = 0, rz = 0) {
    return this.add(new THREE.CylinderGeometry(rt, rb, h, seg, 1, false), M(x, y, z, rx, ry, rz), col);
  }
  // 连接两点的圆杆：a 端半径 r0，b 端半径 r1
  stick(a, b, r0, r1, col = 0xffffff, seg = 5) {
    const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const len = Math.max(0.01, d.length());
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), q, new THREE.Vector3(1, 1, 1));
    return this.add(new THREE.CylinderGeometry(r1, r0, len, seg, 1, false), m, col);
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2));
    g.computeVertexNormals();
    return g;
  }
}

// 静态合并组：键名 == 材质名。世界里不动的东西都进这里，最后每组一个 Mesh。
var SG = {};
function sg(key) { return SG[key] || (SG[key] = new Geo()); }
function sgMerge(key, src, m) { return sg(key).merge(src, m); }

function flushStatic(scene) {
  for (const key in SG) {
    const g = SG[key];
    if (!g.p.length) continue;
    const mesh = new THREE.Mesh(g.build(), MAT[key]);
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    scene.add(mesh);
  }
}

/* ---------- 程序纹理（不引用外部图片） ---------- */
var TEX = {}, MAT = {};
function canvasTex(w, h, draw, rep = [1, 1]) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rep[0], rep[1]);
  t.anisotropy = 4;
  return t;
}
function initTex() {
  // 瓦垄：错缝的灰褐瓦片
  TEX.roof = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#6e5d49'; g.fillRect(0, 0, w, h);
    const cols = 8, rows = 10, tw = w / cols, th = h / rows;
    for (let r = 0; r < rows; r++) for (let c = -1; c < cols; c++) {
      const x = c * tw + (r % 2) * tw / 2, y = r * th, s = 0.8 + 0.35 * RND();
      g.fillStyle = `rgb(${(132 * s) | 0},${(116 * s) | 0},${(96 * s) | 0})`;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + tw, y); g.lineTo(x + tw * 0.9, y + th); g.lineTo(x + tw * 0.1, y + th); g.closePath(); g.fill();
      g.fillStyle = 'rgba(40,30,22,0.55)'; g.fillRect(x, y + th - 2, tw, 2);
    }
  });
  // 绢底：暖褐色，带细纹和浅色斑
  TEX.silk = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#8f7b57'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      const x = RND() * w, y = RND() * h, r = rnd(2, 14);
      g.fillStyle = RND() < 0.5 ? 'rgba(255,240,200,0.07)' : 'rgba(70,50,25,0.07)';
      g.beginPath(); g.ellipse(x, y, r, r * 0.4, RND() * 3, 0, 7); g.fill();
    }
    g.strokeStyle = 'rgba(90,70,40,0.09)';
    for (let i = 0; i < 160; i++) {
      const x = RND() * w, y = RND() * h;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + rnd(20, 80), y + rnd(-3, 3)); g.stroke();
    }
  }, [1, 1]);
  // 水：浅土黄底上的墨线波纹
  TEX.water = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#6f6349'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(120,110,80,0.35)';
    for (let i = 0; i < 40; i++) g.fillRect(RND() * w, RND() * h, rnd(20, 60), rnd(2, 5));
    g.strokeStyle = 'rgba(200,185,145,0.5)'; g.lineWidth = 1.3;
    for (let i = 0; i < 80; i++) {
      const x = RND() * w, y = RND() * h;
      g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 6, y - 3, x + 12, y + 3, x + 18, y); g.stroke();
    }
  });
  // 茅草
  TEX.thatch = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#8f7a4c'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 520; i++) {
      const x = RND() * w, y = RND() * h;
      g.strokeStyle = RND() < 0.5 ? 'rgba(220,200,130,0.5)' : 'rgba(60,45,25,0.5)';
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + rnd(-6, 6), y + rnd(4, 10)); g.stroke();
    }
  });
  // 城砖
  TEX.brick = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#8b6b52'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(55,40,30,0.7)'; g.lineWidth = 2;
    for (let r = 0; r < 8; r++) {
      const y = r * 16;
      g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
      for (let c = 0; c < 4; c++) { const x = c * 32 + (r % 2) * 16; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 16); g.stroke(); }
    }
  }, [3, 3]);
}
function initMat() {
  MAT.vc = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  MAT.vc2 = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  MAT.roof = new THREE.MeshLambertMaterial({ vertexColors: true, map: TEX.roof, side: THREE.DoubleSide });
  MAT.thatch = new THREE.MeshLambertMaterial({ vertexColors: true, map: TEX.thatch, side: THREE.DoubleSide });
  MAT.brick = new THREE.MeshLambertMaterial({ vertexColors: true, map: TEX.brick, side: THREE.DoubleSide });
  MAT.silk = new THREE.MeshLambertMaterial({ vertexColors: true, map: TEX.silk, side: THREE.DoubleSide });
  MAT.water = new THREE.MeshLambertMaterial({ vertexColors: true, map: TEX.water, side: THREE.DoubleSide });
}
