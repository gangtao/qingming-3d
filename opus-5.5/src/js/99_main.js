// ============================================================
// 99_main.js — 初始化、渲染循环
// ============================================================
let SCENE, RENDERER, CAMERA;

function buildBirds(scene) {
  const n = 26;
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 4 * 2 * 3);
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.LineBasicMaterial({ color: 0x2c241d });
  const ls = new THREE.LineSegments(g, m);
  ls.frustumCulled = false;
  scene.add(ls);
  const birds = [];
  const flocks = [[5500, 30, 18], [3600, -10, 22], [1200, 20, 20], [4300, 40, 16]];
  for (let i = 0; i < n; i++) {
    const f = flocks[i % flocks.length];
    birds.push({ cx: PX(f[0]) + (RNG() - 0.5) * 30, cz: PZ(f[1]) + (RNG() - 0.5) * 20, y: f[2] + RNG() * 8, r: 20 + RNG() * 40, w: (0.05 + RNG() * 0.05) * (RNG() < 0.5 ? 1 : -1), ph: RNG() * 6.28, fl: 6 + RNG() * 3 });
  }
  return { g, birds, update(t) {
    let k = 0;
    for (const b of birds) {
      const a = b.ph + t * b.w;
      const x = b.cx + Math.cos(a) * b.r, z = b.cz + Math.sin(a) * b.r * 0.5, y = b.y + Math.sin(t * 0.5 + b.ph) * 1.5;
      const hx = -Math.sin(a) * Math.sign(b.w), hz = Math.cos(a) * 0.5 * Math.sign(b.w);
      const hl = Math.hypot(hx, hz) || 1;
      const sx = -hz / hl, sz = hx / hl; // 翼展方向
      const flap = Math.sin(t * b.fl + b.ph);
      const s = 0.45;
      const tipY = flap * 0.35, midY = 0.12 + flap * 0.12;
      const pts = [[x, y, z], [x + sx * s * 0.5, y + midY, z + sz * s * 0.5], [x + sx * s * 0.5, y + midY, z + sz * s * 0.5], [x + sx * s, y + tipY, z + sz * s],
        [x, y, z], [x - sx * s * 0.5, y + midY, z - sz * s * 0.5], [x - sx * s * 0.5, y + midY, z - sz * s * 0.5], [x - sx * s, y + tipY, z - sz * s]];
      for (const p of pts) { pos[k++] = p[0]; pos[k++] = p[1]; pos[k++] = p[2]; }
    }
    g.attributes.position.needsUpdate = true;
  } };
}

function buildTowRope(scene) {
  if (!STATIC.towRope) return null;
  const g = new THREE.BufferGeometry();
  const N = 16;
  const pos = new Float32Array(N * 3);
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x3a3026 }));
  line.frustumCulled = false;
  scene.add(line);
  const tr = STATIC.towRope;
  const a = V(tr.from.x, groundY(tr.from.x, tr.from.y) + 1.25, tr.from.y);
  return { update() {
    const b = tr.boat.group;
    const mast = b.userData.mast;
    const e = (mast ? b.userData.mastApex.clone().applyMatrix4(mast.matrixWorld) : b.position.clone());
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      pos[i * 3] = lerp(a.x, e.x, t); pos[i * 3 + 1] = lerp(a.y, e.y, t) - Math.sin(t * Math.PI) * 1.2; pos[i * 3 + 2] = lerp(a.z, e.z, t);
    }
    g.attributes.position.needsUpdate = true;
  } };
}

function silkOverlay() {
  const el = document.getElementById('silk');
  if (el && TEX.silkCanvas) el.style.backgroundImage = `url(${TEX.silkCanvas.toDataURL()})`;
}

async function main() {
  const canvasHost = document.getElementById('view');
  RENDERER = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  RENDERER.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  RENDERER.setSize(canvasHost.clientWidth, canvasHost.clientHeight);
  RENDERER.setClearColor(PAL.silk);
  RENDERER.outputEncoding = THREE.LinearEncoding;
  canvasHost.appendChild(RENDERER.domElement);
  SCENE = new THREE.Scene();
  SCENE.background = new THREE.Color(PAL.silk);
  SCENE.fog = new THREE.Fog(PAL.silk, 80, 600);
  CAMERA = new THREE.PerspectiveCamera(42, canvasHost.clientWidth / canvasHost.clientHeight, 0.1, 2000);
  CAM.dom = RENDERER.domElement;

  const hemi = new THREE.HemisphereLight(0xf4ede0, 0x7a6e58, 0.8);
  SCENE.add(hemi);
  const sun = new THREE.DirectionalLight(0xf6ecdc, 0.5);
  sun.position.set(-60, 120, 80);
  SCENE.add(sun);
  const amb = new THREE.AmbientLight(0xd8c8a8, 0.1);
  SCENE.add(amb);

  // 字体就绪后再画招牌
  try { await document.fonts.load('48px "LXGW WenKai"', '清明上河图十千脚店'); } catch (e) { }

  const T0 = performance.now();
  const step = (msg) => { const l = document.getElementById('loading-msg'); if (l) l.textContent = msg; return new Promise((r) => setTimeout(r, 0)); };
  await step('铺绢……');
  buildTextures();
  buildMaterials();
  silkOverlay();
  buildTerrain(SCENE);
  buildWater(SCENE);
  buildBackdrop(SCENE);
  await step('勾勒屋宇舟桥……');
  buildScenes(SCENE);
  await step('点染人物……');
  finalizeFigures(SCENE);
  finalizeStatic(SCENE);
  buildSigns(SCENE);
  buildSmoke(SCENE);
  buildFlags(SCENE);
  const birds = buildBirds(SCENE);
  const rope = buildTowRope(SCENE);
  void T0;
  initCamera(CAMERA, RENDERER.domElement);
  initUI();

  const onResize = () => {
    const w = canvasHost.clientWidth, h = canvasHost.clientHeight;
    RENDERER.setSize(w, h);
    CAMERA.aspect = w / h;
    CAMERA.updateProjectionMatrix();
  };
  window.addEventListener('resize', onResize);
  onResize();

  let last = performance.now();
  let frames = 0;
  const loop = (now) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    U.uTime.value += dt;
    const t = U.uTime.value;
    updateBoats(t);
    updateFigures(dt);
    markFiguresDirty();
    birds.update(t);
    if (rope) rope.update();
    updateCamera(dt);
    updateUI();
    RENDERER.render(SCENE, CAMERA);
    frames++;
    if (frames === 3) document.body.classList.add('ready');
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  window.__qm = {
    stats: () => ({
      people: FIG.people.length, animals: FIG.animals.length, carts: FIG.carts.length, sedans: FIG.sedans.length,
      boats: BOATS.length, buildings: SCN.houses || 0, skipped: SCN.skipped, trees: SCN.trees || 0,
      drawCalls: RENDERER.info.render.calls, triangles: RENDERER.info.render.triangles
    }),
    cam: CAM
  };
}

window.addEventListener('DOMContentLoaded', () => { main().catch((e) => { console.error(e); const l = document.getElementById('loading-msg'); if (l) l.textContent = '出错：' + e.message; }); });
