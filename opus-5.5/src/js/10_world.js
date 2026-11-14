// ============================================================
// 10_world.js — 世界坐标、汴河走向、道路、地形与水面
// 画卷坐标 (xo, yo)：xo 为全卷缩略图（6000×281）上的横坐标，
// 卷首在右（xo≈5873），卷尾在左（xo≈127）；yo 为纵坐标，0 为画面上方（远处）。
// ============================================================

const SCROLL = { x0: 127, x1: 5873, w: 6000, h: 281 };
const KX = 0.12;     // 每个缩略图像素 → 米（横向）
const KZ = 0.32;     // 纵向（画面上下 → 远近）
const X_MIN = (SCROLL.x0 - 3000) * KX, X_MAX = (SCROLL.x1 - 3000) * KX;
const Z_MIN = -46, Z_MAX = -46 + 281 * KZ;
function PX(xo) { return (xo - 3000) * KX; }
function PZ(yo) { return -46 + yo * KZ; }
function P(xo, yo) { return new THREE.Vector2(PX(xo), PZ(yo)); }
function XO(x) { return x / KX + 3000; }

// ---------- 多段线工具 ----------
class Path2 {
  constructor(pts) { // pts: [[xo,yo],...] 画卷坐标 或 Vector2
    this.p = pts.map((a) => (a.isVector2 ? a.clone() : P(a[0], a[1])));
    this.len = [0];
    for (let i = 1; i < this.p.length; i++) this.len.push(this.len[i - 1] + this.p[i].distanceTo(this.p[i - 1]));
    this.total = this.len[this.len.length - 1];
  }
  at(s, out) { // 按弧长取点与方向
    s = clamp(s, 0, this.total);
    let i = 1;
    while (i < this.len.length - 1 && this.len[i] < s) i++;
    const a = this.p[i - 1], b = this.p[i];
    const t = (s - this.len[i - 1]) / Math.max(1e-6, this.len[i] - this.len[i - 1]);
    out = out || {};
    out.x = lerp(a.x, b.x, t); out.z = lerp(a.y, b.y, t);
    out.dx = b.x - a.x; out.dz = b.y - a.y;
    const l = Math.hypot(out.dx, out.dz) || 1; out.dx /= l; out.dz /= l;
    return out;
  }
  // 点到折线的最近距离、对应弧长
  nearest(x, z) {
    let best = 1e9, bs = 0;
    for (let i = 1; i < this.p.length; i++) {
      const a = this.p[i - 1], b = this.p[i];
      const abx = b.x - a.x, abz = b.y - a.y;
      const l2 = abx * abx + abz * abz || 1;
      const t = clamp(((x - a.x) * abx + (z - a.y) * abz) / l2, 0, 1);
      const px = a.x + abx * t, pz = a.y + abz * t;
      const d = Math.hypot(x - px, z - pz);
      if (d < best) { best = d; bs = this.len[i - 1] + t * Math.sqrt(l2); }
    }
    return { d: best, s: bs };
  }
}

// ---------- 汴河 ----------
// 中心线与宽度（画卷坐标），自卷首方向流来：先从画面近处（下方）进入，向左渐远，过虹桥后折向远处（上方）出画
const RIVER_PTS = [[4560, 420], [4480, 330], [4330, 268], [4150, 228], [3950, 200], [3750, 178], [3550, 160], [3350, 128], [3150, 106], [3000, 98], [2800, 92], [2600, 82], [2450, 66], [2320, 38], [2180, -12], [2080, -70], [2000, -140]];
const RIVER_W = [190, 185, 175, 168, 160, 150, 140, 125, 108, 104, 98, 98, 100, 96, 92, 90, 90];
const RIVER = new Path2(RIVER_PTS);
const RIVER_HW = []; // 半宽（米）
for (let i = 0; i < RIVER_W.length; i++) RIVER_HW.push(RIVER_W[i] * KZ * 0.5);
function riverHalfWidthAt(s) {
  let i = 1; while (i < RIVER.len.length - 1 && RIVER.len[i] < s) i++;
  const t = clamp((s - RIVER.len[i - 1]) / (RIVER.len[i] - RIVER.len[i - 1]), 0, 1);
  return lerp(RIVER_HW[i - 1], RIVER_HW[i], t);
}
// 郊野小溪与池塘；城濠
const STREAMS = [
  { path: new Path2([[5900, 250], [5800, 232], [5745, 200], [5712, 165], [5690, 135], [5672, 100], [5650, 62], [5628, 25], [5600, -30]]), hw: 1.9 },
  { path: new Path2([[1330, -30], [1326, 100], [1322, 200], [1318, 300], [1316, 330]]), hw: 3.2 }
];
const PONDS = [ // 卷首近景的浅水洼（x0,x1,yo中心,yo半高）
  { x0: 4980, x1: 5880, yc: 250, yh: 28 }
];

const WATER_Y = -0.45;

// 水域判定：返回 >0 表示在水中的“深度系数”
function waterDepth(x, z) {
  let w = -99;
  const n = RIVER.nearest(x, z);
  const hw = riverHalfWidthAt(n.s);
  if (n.d < hw + 4) w = Math.max(w, (hw - n.d) / 4);
  for (const st of STREAMS) {
    const m = st.path.nearest(x, z);
    if (m.d < st.hw + 2) w = Math.max(w, (st.hw - m.d) / 1.2);
  }
  for (const pd of PONDS) {
    const xo = XO(x);
    if (xo > pd.x0 - 80 && xo < pd.x1 + 80) {
      const zc = PZ(pd.yc), zh = pd.yh * KZ;
      const edge = Math.min(xo - pd.x0, pd.x1 - xo) * KX;
      const wob = (fbm(x * 0.05, 3.3, 3) - 0.5) * 6;
      const dz = Math.abs(z - zc) - zh - wob;
      const dd = Math.min(-dz, edge);
      w = Math.max(w, dd / 3);
    }
  }
  return w;
}

// ---------- 道路 ----------
const ROADS = {
  rural: new Path2([[5880, 150], [5760, 138], [5600, 140], [5450, 150], [5300, 158], [5170, 168], [5050, 150], [4960, 110], [4860, 78], [4740, 62], [4620, 64], [4520, 76], [4420, 88], [4300, 82], [4150, 70], [3950, 62], [3750, 56], [3550, 48], [3350, 36], [3200, 30], [3112, 28]]),
  ruralLow: new Path2([[5170, 168], [5000, 196], [4870, 205], [4760, 212], [4650, 205], [4560, 180], [4480, 140], [4420, 88]]),
  farBankW: new Path2([[3112, 28], [3000, 22], [2860, 18], [2700, 14], [2560, 12], [2440, 10]]),
  nearBankE: new Path2([[2912, 182], [3000, 178], [3120, 176], [3260, 186], [3400, 205], [3480, 235], [3520, 290]]),
  town: new Path2([[2912, 182], [2850, 205], [2760, 214], [2660, 206], [2560, 194], [2420, 182], [2280, 176], [2140, 170], [2000, 166], [1880, 165], [1760, 168], [1640, 172], [1520, 180], [1420, 188], [1365, 192], [1290, 192], [1210, 188], [1150, 186], [1060, 182], [960, 178], [840, 180], [700, 184], [560, 186], [420, 182], [280, 178], [127, 176]]),
  crossN: new Path2([[560, 186], [568, 120], [575, 60], [580, 0], [582, -30]]),
  crossS: new Path2([[555, 186], [545, 240], [538, 300]]),
  gateN: new Path2([[1500, 180], [1480, 120], [1450, 60], [1420, 0]])
};
const ROAD_W = { rural: 3.2, ruralLow: 2.2, farBankW: 3.5, nearBankE: 3.5, town: 6.5, crossN: 4.5, crossS: 4.5, gateN: 3 };

function roadInfluence(x, z) {
  let best = 0;
  for (const k in ROADS) {
    const n = ROADS[k].nearest(x, z);
    const w = ROAD_W[k];
    const v = 1 - smooth(w * 0.7, w * 1.25, n.d);
    if (v > best) best = v;
  }
  return best;
}

// ---------- 地形高度 ----------
function terrainHeight(x, z) {
  const xo = XO(x);
  let h = 0;
  // 郊野起伏（卷首至汴河入画处）
  const rural = smooth(4300, 4700, xo);
  h += rural * (fbm(x * 0.03, z * 0.04, 4) - 0.45) * 2.2;
  // 远处缓坡
  h += smooth(-30, -46, z) * 1.2 * rural;
  // 城门两侧土城（城墙基）
  const gx = PX(1112);
  if (Math.abs(x - gx) < 9) {
    const dz = Math.abs(z - PZ(186));
    if (dz > 8) h += (1 - smooth(5, 9, Math.abs(x - gx))) * 4.5 * smooth(8, 12, dz);
  }
  // 水域
  const wd = waterDepth(x, z);
  if (wd > -1) {
    const bankTop = 0.25;
    const t = clamp(wd + 1, 0, 2) / 2; // 0 远离水 → 1 深水
    const bed = -2.4;
    if (wd <= 0) h = lerp(h, bankTop, smooth(-1, 0, wd) * 0.6);
    else h = lerp(-0.7, bed, smooth(0, 1, wd));
  }
  return h;
}

// 道路、河岸、田地的地面颜色
function groundColor(x, z, h) {
  const xo = XO(x);
  const n = fbm(x * 0.06 + 7, z * 0.06, 3);
  const c = new THREE.Color(PAL.ground);
  // 郊野：略带新绿与赭
  const rural = smooth(4200, 4700, xo);
  c.lerp(new THREE.Color(0x968f6e), rural * 0.5 * smooth(0.35, 0.7, n));
  // 城内：更亮更干
  const city = 1 - smooth(1100, 1500, xo);
  c.lerp(new THREE.Color(0xb3a283), city * 0.35);
  // 道路
  const r = roadInfluence(x, z);
  c.lerp(new THREE.Color(PAL.road), r * 0.85);
  // 河岸湿泥
  if (h < 0.15) c.lerp(new THREE.Color(PAL.bank), smooth(0.15, -0.6, h) * 0.8);
  // 斑驳
  c.multiplyScalar(0.9 + n * 0.2);
  return c;
}


const EDGE_GLSL = `
uniform vec3 uBg; varying vec3 vWP;
float edgeFade(vec3 p){
  float a = smoothstep(${(Z_MAX - 2).toFixed(1)}, ${(Z_MAX + 28).toFixed(1)}, p.z);
  float b = 1.0 - smoothstep(${(Z_MIN - 40).toFixed(1)}, ${(Z_MIN + 4).toFixed(1)}, p.z);
  float c = smoothstep(${X_MAX.toFixed(1)}, ${(X_MAX + 40).toFixed(1)}, p.x);
  float d = 1.0 - smoothstep(${(X_MIN - 40).toFixed(1)}, ${X_MIN.toFixed(1)}, p.x);
  return max(max(a, b), max(c, d));
}`;
// 画外渐隐：地面与水面在长卷边缘融入绢色背景
function edgeFadeMaterial(m, key) {
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => {
    if (prev) prev(sh, r);
    sh.uniforms.uBg = { value: new THREE.Color(PAL.silk) };
    if (!/varying vec3 vWP/.test(sh.vertexShader)) {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP = (modelMatrix * vec4(transformed,1.0)).xyz;');
    }
    sh.fragmentShader = sh.fragmentShader.replace('varying vec3 vWP;', '');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + EDGE_GLSL)
      .replace('#include <fog_fragment>', 'gl_FragColor.rgb = mix(gl_FragColor.rgb, uBg, edgeFade(vWP));\n#include <fog_fragment>');
  };
  m.customProgramCacheKey = () => key;
  return m;
}

function buildTerrain(scene) {
  const x0 = X_MIN - 60, x1 = X_MAX + 60, z0 = Z_MIN - 60, z1 = Z_MAX + 46;
  const dx = 1.0, dz = 1.0;
  const nx = Math.ceil((x1 - x0) / dx) + 1, nz = Math.ceil((z1 - z0) / dz) + 1;
  const pos = new Float32Array(nx * nz * 3), colA = new Float32Array(nx * nz * 3), uv = new Float32Array(nx * nz * 2);
  const H = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const x = x0 + i * dx, z = z0 + j * dz;
    const h = terrainHeight(x, z);
    const k = j * nx + i;
    H[k] = h;
    pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z;
    const c = groundColor(x, z, h);
    colA[k * 3] = c.r; colA[k * 3 + 1] = c.g; colA[k * 3 + 2] = c.b;
    uv[k * 2] = x / 24; uv[k * 2 + 1] = z / 24;
  }
  const idx = [];
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(colA, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = edgeFadeMaterial(new THREE.MeshLambertMaterial({ vertexColors: true, map: TEX.ground }), 'terrain');
  const mesh = new THREE.Mesh(g, m);
  mesh.name = 'terrain';
  scene.add(mesh);
  WORLD.heightGrid = { x0, z0, dx, dz, nx, nz, H };
  return mesh;
}

// 双线性取高
function groundY(x, z) {
  const G = WORLD.heightGrid;
  if (!G) return terrainHeight(x, z);
  const fx = (x - G.x0) / G.dx, fz = (z - G.z0) / G.dz;
  const i = clamp(Math.floor(fx), 0, G.nx - 2), j = clamp(Math.floor(fz), 0, G.nz - 2);
  const tx = clamp(fx - i, 0, 1), tz = clamp(fz - j, 0, 1);
  const a = G.H[j * G.nx + i], b = G.H[j * G.nx + i + 1], c = G.H[(j + 1) * G.nx + i], d = G.H[(j + 1) * G.nx + i + 1];
  return lerp(lerp(a, b, tx), lerp(c, d, tx), tz);
}

// ---------- 水面：绢本上的墨线水纹 ----------
function buildWater(scene) {
  const g = new THREE.PlaneGeometry(X_MAX - X_MIN + 110, Z_MAX - Z_MIN + 90, 1, 1);
  g.rotateX(-Math.PI / 2);
  const m = new THREE.MeshBasicMaterial({ color: PAL.water });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.uTime;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP = (modelMatrix * vec4(transformed,1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vWP; uniform float uTime;
        float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
        float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
          return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }`)
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );', `
        vec2 p = vWP.xz;
        float t = uTime * 0.35;
        // 鱼鳞状水纹：沿水流方向拉长的弧线
        vec2 q = vec2(p.x * 1.1 + t, p.y * 2.6);
        q.y += 0.6 * vn(p * 0.15 + t * 0.2);
        vec2 cell = floor(q); vec2 fq = fract(q) - 0.5;
        fq.x += (h21(cell) - 0.5) * 0.6;
        float arc = abs(length(fq * vec2(1.0, 1.8) + vec2(0.0, 0.35)) - 0.42);
        float lineA = smoothstep(0.05, 0.0, arc) * step(-0.05, fq.y) * 0.32 * step(0.35, h21(cell + 7.0));
        // 细长波线
        float w = sin(p.y * 3.0 + 1.2 * sin(p.x * 0.35 + t) + t * 1.5) * 0.5 + 0.5;
        float lineB = smoothstep(0.97, 1.0, w) * 0.12 * vn(p * 0.2 + 3.0);
        float mott = vn(p * 0.05) * 0.12;
        vec3 base = diffuse * (0.95 + mott);
        vec3 inkc = vec3(0.30, 0.25, 0.19);
        vec3 cc = mix(base, inkc, clamp(lineA + lineB, 0.0, 0.6));
        vec4 diffuseColor = vec4(cc, opacity);`);
  };
  edgeFadeMaterial(m, 'water');
  const mesh = new THREE.Mesh(g, m);
  mesh.position.set((X_MIN + X_MAX) / 2, WATER_Y, (Z_MIN + Z_MAX) / 2);
  mesh.name = 'water';
  scene.add(mesh);
  return mesh;
}

// ---------- 远景：绢色背景上的淡远树影 ----------
function buildBackdrop(scene) {
  // 远处一圈淡淡的雾林，用一组低矮的面片
  const B = new GeoBuilder();
  const r = makeRng(99);
  for (let x = X_MIN - 40; x < X_MAX + 40; x += 6) {
    const z = Z_MIN - 14 - r() * 10;
    const h = 5 + r() * 9;
    const w = 6 + r() * 8;
    B.add(gSphere(7, 4), M(x, h * 0.2, z, 0, 0, 0, w, h * 0.6, 4), jit(0xa8987a, 0.05, r));
  }
  const mesh = new THREE.Mesh(B.build(), MAT.vc);
  scene.add(mesh);
}

const WORLD = {};
