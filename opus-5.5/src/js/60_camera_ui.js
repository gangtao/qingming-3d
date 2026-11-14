// ============================================================
// 60_camera_ui.js — 镜头控制、长卷导航条、视角面板、题签、段落说明
// ============================================================

const SECTIONS = [
  { name: '郊野春色', x0: 4450, x1: 5873 },
  { name: '汴河虹桥', x0: 2250, x1: 4450 },
  { name: '城门街市', x0: 127, x1: 2250 }
];
const CAPTIONS = [
  { x0: 5300, x1: 5900, sec: 0, text: '卷首。薄雾疏林，枯枝如蟹爪，早春寒意未消。一队驮炭的毛驴正沿小路走向汴京。' },
  { x0: 4950, x1: 5300, sec: 0, text: '村舍茅屋错落，篱笆围着菜畦；近处一汪浅水，老柳初发新枝。' },
  { x0: 4450, x1: 4950, sec: 0, text: '清明扫墓归来的轿马队伍，轿顶插着柳枝；路边茅草茶棚，田畴里有人劳作。' },
  { x0: 3900, x1: 4450, sec: 1, text: '汴河入画。漕船靠岸，力夫扛包卸货，北岸茶肆饭铺临河而开。' },
  { x0: 3350, x1: 3900, sec: 1, text: '纤夫在岸上拉纤，大船逆水而上；客船摇橹，小舟撑篙，河面舟楫往来。' },
  { x0: 2850, x1: 3350, sec: 1, text: '虹桥飞跨汴河。一艘大船放倒桅杆急着过桥，船工撑篙呼喊，桥上凭栏的人指点惊呼。' },
  { x0: 2250, x1: 2850, sec: 1, text: '桥头十千脚店，门前彩楼欢门高耸；酒楼上客人满座，河边食店临水。' },
  { x0: 1400, x1: 2250, sec: 2, text: '城郊街道，牛拉的太平车、独轮车、驴驮往来不绝，路旁茶坊脚店林立。' },
  { x0: 1000, x1: 1400, sec: 2, text: '城门楼高耸在砖砌城台上，驼队正穿门出城；护城河平桥上有人倚栏看水。' },
  { x0: 650, x1: 1000, sec: 2, text: '城内孙羊正店，二层酒楼前扎着彩楼欢门，栀子灯下酒客盈门。' },
  { x0: 400, x1: 650, sec: 2, text: '十字街口，说书人被围得水泄不通；久住王员外家客店楼上有人读书。' },
  { x0: 100, x1: 400, sec: 2, text: '卷尾。赵太丞家医铺、解库、水井边打水的人，街市依旧熙熙攘攘。' }
];

const CAM = {
  tx: PX(5600), tz: PZ(150), dist: 95, yaw: 0, pitchOff: 0,
  cur: null, fov: 42, interacted: false
};
const DIST_MIN = 2.6, DIST_MAX = 560;
function pitchAuto(d) {
  const t = clamp((Math.log(d) - Math.log(DIST_MIN)) / (Math.log(DIST_MAX) - Math.log(DIST_MIN)), 0, 1);
  return 7 + Math.pow(t, 0.85) * 52;
}
function camPitch(s) { return clamp(pitchAuto(s.dist) + s.pitchOff, 2, 86); }

function initCamera(camera, dom) {
  CAM.camera = camera;
  CAM.cur = { tx: CAM.tx, tz: CAM.tz, dist: CAM.dist, yaw: CAM.yaw, pitchOff: CAM.pitchOff };
  const st = { mode: null, x: 0, y: 0, touches: null };
  const firstInteract = () => {
    if (CAM.interacted) return;
    CAM.interacted = true;
    const h = document.getElementById('hint');
    if (h) h.classList.add('gone');
  };
  CAM.firstInteract = firstInteract;
  const unitsPerPx = () => 2 * CAM.dist * Math.tan(CAM.fov * Math.PI / 360) / dom.clientHeight;
  const pan = (dx, dy) => {
    const k = unitsPerPx();
    const sp = Math.max(0.35, Math.sin(camPitch(CAM) * Math.PI / 180));
    const cy = Math.cos(CAM.yaw), sy = Math.sin(CAM.yaw);
    CAM.tx += (-dx * cy - dy * sy / sp) * k;
    CAM.tz += (dx * sy - dy * cy / sp) * k;
  };
  const rotate = (dx, dy) => {
    CAM.yaw -= dx * 0.005;
    CAM.pitchOff = clamp(CAM.pitchOff + dy * 0.2, -40, 40);
  };
  const zoomAt = (factor, cx, cy) => {
    const nd = clamp(CAM.dist * factor, DIST_MIN, DIST_MAX);
    // 以光标处的地面点为中心缩放
    if (cx != null) {
      const g = screenToGround(cx, cy);
      if (g) {
        const k = nd / CAM.dist;
        CAM.tx = g.x + (CAM.tx - g.x) * k;
        CAM.tz = g.z + (CAM.tz - g.z) * k;
      }
    }
    CAM.dist = nd;
  };
  CAM.zoomAt = zoomAt;
  dom.addEventListener('contextmenu', (e) => e.preventDefault());
  dom.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') return;
    firstInteract();
    st.mode = (e.button === 2 || e.shiftKey) ? 'rot' : 'pan';
    st.x = e.clientX; st.y = e.clientY;
    dom.setPointerCapture(e.pointerId);
  });
  dom.addEventListener('pointermove', (e) => {
    if (!st.mode || e.pointerType === 'touch') return;
    const dx = e.clientX - st.x, dy = e.clientY - st.y;
    st.x = e.clientX; st.y = e.clientY;
    if (st.mode === 'rot' || e.shiftKey) rotate(dx, dy); else pan(dx, dy);
  });
  const up = (e) => { st.mode = null; try { dom.releasePointerCapture(e.pointerId); } catch (_) { } };
  dom.addEventListener('pointerup', up);
  dom.addEventListener('pointercancel', up);
  dom.addEventListener('wheel', (e) => {
    e.preventDefault();
    firstInteract();
    const d = e.deltaMode === 1 ? e.deltaY * 30 : e.deltaY;
    zoomAt(Math.exp(clamp(d, -200, 200) * 0.0016), e.clientX, e.clientY);
  }, { passive: false });
  // 触屏：单指平移；双指捏合缩放、旋转、上下推动改俯仰
  dom.addEventListener('touchstart', (e) => {
    e.preventDefault(); firstInteract();
    st.touches = [...e.touches].map((t) => ({ x: t.clientX, y: t.clientY }));
  }, { passive: false });
  dom.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const now = [...e.touches].map((t) => ({ x: t.clientX, y: t.clientY }));
    const prev = st.touches;
    if (prev && now.length === 1 && prev.length === 1) pan(now[0].x - prev[0].x, now[0].y - prev[0].y);
    else if (prev && now.length >= 2 && prev.length >= 2) {
      const d0 = Math.hypot(prev[1].x - prev[0].x, prev[1].y - prev[0].y), d1 = Math.hypot(now[1].x - now[0].x, now[1].y - now[0].y);
      const a0 = Math.atan2(prev[1].y - prev[0].y, prev[1].x - prev[0].x), a1 = Math.atan2(now[1].y - now[0].y, now[1].x - now[0].x);
      const my0 = (prev[0].y + prev[1].y) / 2, my1 = (now[0].y + now[1].y) / 2;
      const mx0 = (prev[0].x + prev[1].x) / 2, mx1 = (now[0].x + now[1].x) / 2;
      if (d1 > 0 && d0 > 0) zoomAt(d0 / d1, mx1, my1);
      let da = a1 - a0; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI;
      CAM.yaw += da;
      // 两指同向上下推：俯仰；同向平移：平移
      const ddy = my1 - my0, ddx = mx1 - mx0;
      if (Math.abs(ddy) > Math.abs(d1 - d0) * 0.6) CAM.pitchOff = clamp(CAM.pitchOff + ddy * 0.25, -40, 40);
      else pan(ddx, 0);
    }
    st.touches = now;
  }, { passive: false });
  dom.addEventListener('touchend', (e) => { st.touches = [...e.touches].map((t) => ({ x: t.clientX, y: t.clientY })); }, { passive: false });
  window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT')) return;
    const step = 60;
    let used = true;
    switch (e.key) {
      case 'ArrowLeft': pan(step, 0); break;
      case 'ArrowRight': pan(-step, 0); break;
      case 'ArrowUp': pan(0, step); break;
      case 'ArrowDown': pan(0, -step); break;
      case '+': case '=': zoomAt(0.85); break;
      case '-': case '_': zoomAt(1.18); break;
      case 'q': case 'Q': CAM.yaw += 0.08; break;
      case 'e': case 'E': CAM.yaw -= 0.08; break;
      default: used = false;
    }
    if (used) { firstInteract(); e.preventDefault(); }
  });
}

const _ray = new THREE.Raycaster();
const _ndc = new THREE.Vector2();
const _gplane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
function screenToGround(cx, cy) {
  const c = CAM.camera, el = CAM.dom || document.body;
  const rect = el.getBoundingClientRect();
  _ndc.set(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1);
  _ray.setFromCamera(_ndc, c);
  const p = new THREE.Vector3();
  return _ray.ray.intersectPlane(_gplane, p) ? p : null;
}

function updateCamera(dt) {
  CAM.tx = clamp(CAM.tx, X_MIN - 10, X_MAX + 10);
  CAM.tz = clamp(CAM.tz, Z_MIN - 6, Z_MAX + 6);
  const c = CAM.cur, k = 1 - Math.exp(-dt * 9);
  c.tx += (CAM.tx - c.tx) * k; c.tz += (CAM.tz - c.tz) * k;
  c.dist *= Math.exp((Math.log(CAM.dist) - Math.log(c.dist)) * k);
  c.yaw += (CAM.yaw - c.yaw) * k; c.pitchOff += (CAM.pitchOff - c.pitchOff) * k;
  const p = camPitch(c) * Math.PI / 180;
  const near = 1 - smooth(4, 45, c.dist);
  const ty = surfaceY(c.tx, c.tz) * (0.5 + 0.5 * near) + 1.35 * near;
  const cam = CAM.camera;
  let cx = c.tx + Math.sin(c.yaw) * Math.cos(p) * c.dist;
  let cz = c.tz + Math.cos(c.yaw) * Math.cos(p) * c.dist;
  let cy = ty + Math.sin(p) * c.dist;
  const gmin = surfaceY(cx, cz) + 0.5;
  if (cy < gmin) cy = gmin;
  cam.position.set(cx, cy, cz);
  cam.lookAt(c.tx, ty, c.tz);
  // 雾随远近变化：近看清透，远看如绢上淡墨
  const fog = SCENE.fog;
  fog.near = 25 + c.dist * 0.55;
  fog.far = 140 + c.dist * 1.9;
}

// ---------- 界面 ----------
const UI = {};
function initUI() {
  UI.nav = document.getElementById('nav');
  UI.navBox = document.getElementById('nav-box');
  UI.cap = document.getElementById('caption');
  UI.capT = document.getElementById('cap-title');
  UI.capP = document.getElementById('cap-text');
  UI.labelsEl = document.getElementById('labels');
  UI.labelsOn = true;
  // 导航条分段标记
  const marks = document.getElementById('nav-marks');
  for (const s of SECTIONS) {
    const d = document.createElement('div');
    d.className = 'nav-sec';
    d.style.left = (xoToNav(s.x0) * 100) + '%';
    d.style.width = ((xoToNav(s.x1) - xoToNav(s.x0)) * 100) + '%';
    d.innerHTML = `<span>${s.name}</span>`;
    marks.appendChild(d);
  }
  // 拖动导航
  let dragging = false;
  const go = (e) => {
    const r = UI.nav.getBoundingClientRect();
    const u = clamp((e.clientX - r.left) / r.width, 0, 1);
    const xo = SCROLL.x0 + u * (SCROLL.x1 - SCROLL.x0);
    CAM.tx = PX(xo);
    CAM.firstInteract();
  };
  UI.nav.addEventListener('pointerdown', (e) => { dragging = true; UI.nav.setPointerCapture(e.pointerId); go(e); e.preventDefault(); });
  UI.nav.addEventListener('pointermove', (e) => { if (dragging) go(e); });
  UI.nav.addEventListener('pointerup', () => { dragging = false; });
  UI.nav.addEventListener('pointercancel', () => { dragging = false; });
  // 视角面板
  const panel = document.getElementById('panel');
  const tog = document.getElementById('panel-toggle');
  if (window.innerWidth < 720) panel.classList.add('collapsed');
  tog.addEventListener('click', () => panel.classList.toggle('collapsed'));
  UI.sZoom = document.getElementById('s-zoom');
  UI.sPitch = document.getElementById('s-pitch');
  UI.sRot = document.getElementById('s-rot');
  UI.sZoom.addEventListener('input', () => {
    const t = UI.sZoom.value / 100;
    CAM.dist = Math.exp(lerp(Math.log(DIST_MAX), Math.log(DIST_MIN), t));
    CAM.firstInteract();
  });
  UI.sPitch.addEventListener('input', () => {
    CAM.pitchOff = clamp(+UI.sPitch.value - pitchAuto(CAM.dist), -40, 40);
    CAM.firstInteract();
  });
  UI.sRot.addEventListener('input', () => { CAM.yaw = -(+UI.sRot.value) * Math.PI / 180; CAM.firstInteract(); });
  document.getElementById('b-labels').addEventListener('click', (e) => {
    UI.labelsOn = !UI.labelsOn;
    e.currentTarget.classList.toggle('on', UI.labelsOn);
    UI.labelsEl.style.display = UI.labelsOn ? '' : 'none';
  });
  document.getElementById('b-reset').addEventListener('click', () => {
    CAM.yaw = 0; CAM.pitchOff = 0; CAM.dist = 95; CAM.tz = PZ(150);
  });
  // 题签
  UI.labels = STATIC.labels.map((l) => {
    const el = document.createElement('div');
    el.className = 'label' + (l.major ? ' major' : l.minor ? ' minor' : '');
    el.textContent = l.text;
    el.style.display = 'none';
    UI.labelsEl.appendChild(el);
    return { el, l, vis: false };
  });
  UI.lastCap = -1;
}
function xoToNav(xo) { return (xo - SCROLL.x0) / (SCROLL.x1 - SCROLL.x0); }

const _pv = new THREE.Vector3();
function updateUI() {
  const cam = CAM.camera;
  // 导航框：视野在地面上的横向范围
  const el = CAM.dom;
  const rect = el.getBoundingClientRect();
  const pts = [];
  // 以视点中心所在的屏幕行为准，取左右两端落在地面的位置
  const tv = new THREE.Vector3(CAM.cur.tx, 0, CAM.cur.tz).project(cam);
  const ty = clamp(0.5 - tv.y * 0.5, 0.05, 0.95);
  for (const [sx, sy] of [[0, ty], [1, ty]]) {
    const g = screenToGround(rect.left + sx * rect.width, rect.top + sy * rect.height);
    if (g) pts.push(XO(g.x));
  }
  let a = XO(CAM.cur.tx) - 50, b = XO(CAM.cur.tx) + 50;
  if (pts.length >= 2) { a = Math.min(...pts); b = Math.max(...pts); }
  const span = clamp(b - a, 25, 6000);
  const mid = XO(CAM.cur.tx);
  const lo = clamp(mid - span / 2, SCROLL.x0, SCROLL.x1), hi = clamp(mid + span / 2, SCROLL.x0, SCROLL.x1);
  UI.navBox.style.left = (xoToNav(lo) * 100) + '%';
  UI.navBox.style.width = (Math.max(0.4, (xoToNav(hi) - xoToNav(lo)) * 100)) + '%';
  // 段落说明
  const xo = XO(CAM.cur.tx);
  let ci = CAPTIONS.findIndex((c) => xo >= c.x0 && xo < c.x1);
  if (ci < 0) ci = xo > 3000 ? 0 : CAPTIONS.length - 1;
  if (ci !== UI.lastCap) {
    UI.lastCap = ci;
    const c = CAPTIONS[ci];
    UI.cap.classList.remove('show'); void UI.cap.offsetWidth; UI.cap.classList.add('show');
    UI.capT.textContent = SECTIONS[c.sec].name;
    UI.capP.textContent = c.text;
    document.querySelectorAll('.nav-sec').forEach((d, i) => d.classList.toggle('cur', i === c.sec));
  }
  // 面板滑杆同步
  if (document.activeElement !== UI.sZoom) UI.sZoom.value = 100 * (Math.log(DIST_MAX) - Math.log(CAM.dist)) / (Math.log(DIST_MAX) - Math.log(DIST_MIN));
  if (document.activeElement !== UI.sPitch) UI.sPitch.value = camPitch(CAM);
  if (document.activeElement !== UI.sRot) { let d = -CAM.yaw * 180 / Math.PI; d = ((d + 180) % 360 + 360) % 360 - 180; UI.sRot.value = d; }
  // 题签
  if (UI.labelsOn) {
    const w = rect.width, h = rect.height;
    const dmax = CAM.cur.dist;
    for (const L of UI.labels) {
      _pv.copy(L.l.pos);
      const dd = _pv.distanceTo(cam.position);
      const lim = L.l.major ? 520 : L.l.minor ? 110 : 190;
      let show = dd < lim && (L.l.major || dmax < 160);
      if (show) {
        _pv.project(cam);
        if (_pv.z > 1 || _pv.x < -1.1 || _pv.x > 1.1 || _pv.y < -1.1 || _pv.y > 1.1) show = false;
        else {
          const x = (_pv.x * 0.5 + 0.5) * w, y = (-_pv.y * 0.5 + 0.5) * h;
          L.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
          L.el.style.opacity = clamp((lim - dd) / (lim * 0.25), 0, 1).toFixed(2);
        }
      }
      if (show !== L.vis) { L.vis = show; L.el.style.display = show ? '' : 'none'; }
    }
  }
}
