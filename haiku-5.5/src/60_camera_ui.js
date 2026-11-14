/* ===== 60 镜头与界面 =====
 * 镜头：目标点（tx,tz）+ 偏航 yaw + 俯仰 pitch + 距离 dist，三者都平滑追随。
 * 左键拖动平移；右键或 Shift+左键转视角；滚轮/双指捏合缩放；触屏双指可旋转和俯仰。
 */
var CAM_DEFAULT = { tx: 1080, tz: 14, yaw: 0.2, pitch: 0.42, dist: 230 };
var CAM = Object.assign({}, CAM_DEFAULT);     // 目标值（用户期望）
var CUR = Object.assign({}, CAM_DEFAULT);     // 当前值（渲染用）
var FOV = 40;
var SEGS = [
  { x1: 700, t: '郊野春色', d: '春寒未散，柳色初青。驮队、行人与牛车沿大路向汴京而行，远处村舍疏落。' },
  { x1: 800, t: '汴河虹桥', d: '汴河横贯，拱形虹桥跨水而立，桥上观者如堵；河中漕船穿桥而过，岸边船工忙着摇橹。' },
  { x1: 1e9, t: '城门街市', d: '城门高耸，街市繁盛。彩楼欢门横于大街，十千脚店、孙羊正店、赵太丞家、久住王员外家沿街列开。' },
];
var labelsOn = true;
var segIdx = -1;
var hintOff = false;

QM.setView = (v) => { Object.assign(CAM, v); Object.assign(CUR, v); };
QM.state = () => ({ CAM: Object.assign({}, CAM), CUR: Object.assign({}, CUR) });

function clampCam() {
  CAM.tx = clamp(CAM.tx, -40, QM.L + 40);
  CAM.tz = clamp(CAM.tz, -110, 110);
  CAM.pitch = clamp(CAM.pitch, 0.08, 1.42);
  CAM.dist = clamp(CAM.dist, 5, 900);
}

function stepCam(dt) {
  const k = 1 - Math.exp(-dt * 9);
  for (const key of ['tx', 'tz', 'yaw', 'pitch', 'dist']) CUR[key] += (CAM[key] - CUR[key]) * k;
  const c = QM.camera, th = CUR.yaw, ph = CUR.pitch, d = CUR.dist;
  c.position.set(CUR.tx + d * Math.sin(th) * Math.cos(ph), d * Math.sin(ph), CUR.tz + d * Math.cos(th) * Math.cos(ph));
  c.lookAt(CUR.tx, 0, CUR.tz);
  c.near = Math.max(0.15, d * 0.01);
  c.updateProjectionMatrix();
}

// 视野在卷轴方向上的宽度（世界单位）
function visibleWidth() {
  return 2 * CUR.dist * Math.tan(FOV * Math.PI / 360) * (innerWidth / innerHeight);
}

function bindInput(canvas) {
  const ptrs = new Map();
  let mode = null, pinchD = 0, pinchA = 0;
  const hideHint = () => { if (!hintOff) { hintOff = true; document.getElementById('hint').classList.add('off'); } };
  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    hideHint();
    if (ptrs.size === 1) mode = (e.button === 2 || e.shiftKey) ? 'rot' : 'pan';
    else { mode = 'pinch'; const [a, b] = [...ptrs.values()]; pinchD = Math.hypot(a.x - b.x, a.y - b.y); pinchA = Math.atan2(b.y - a.y, b.x - a.x); }
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = ptrs.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (ptrs.size === 1) {
      if (mode === 'rot' || e.shiftKey && (e.buttons & 1)) {
        CAM.yaw -= dx * 0.006;
        CAM.pitch = clamp(CAM.pitch - dy * 0.004, 0.08, 1.42);
      } else {
        // 左键拖动：地面跟随鼠标移动（拖向右，画面右移 -> 目标向左）
        const s = CAM.dist * 0.0022;
        const R = [Math.cos(CAM.yaw), -Math.sin(CAM.yaw)];
        const F = [-Math.sin(CAM.yaw), -Math.cos(CAM.yaw)];
        const fk = s / Math.max(0.35, Math.sin(CAM.pitch));
        CAM.tx += -R[0] * dx * s + F[0] * dy * fk;
        CAM.tz += -R[1] * dx * s + F[1] * dy * fk;
      }
    } else if (ptrs.size >= 2) {
      const [a, b] = [...ptrs.values()];
      const D = Math.hypot(a.x - b.x, a.y - b.y), A = Math.atan2(b.y - a.y, b.x - a.x);
      if (pinchD > 0) CAM.dist *= pinchD / D;
      CAM.yaw -= (A - pinchA);
      pinchD = D; pinchA = A;
    }
    clampCam();
  });
  const up = (e) => { ptrs.delete(e.pointerId); if (ptrs.size === 0) mode = null; };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault(); hideHint();
    CAM.dist *= Math.exp(e.deltaY * 0.0012);
    clampCam();
  }, { passive: false });
  window.addEventListener('keydown', (e) => {
    const s = CAM.dist * 0.06;
    const R = [Math.cos(CAM.yaw), -Math.sin(CAM.yaw)], F = [-Math.sin(CAM.yaw), -Math.cos(CAM.yaw)];
    let used = true;
    if (e.key === 'ArrowLeft') { CAM.tx -= R[0] * s; CAM.tz -= R[1] * s; }
    else if (e.key === 'ArrowRight') { CAM.tx += R[0] * s; CAM.tz += R[1] * s; }
    else if (e.key === 'ArrowUp') { CAM.tx += F[0] * s; CAM.tz += F[1] * s; }
    else if (e.key === 'ArrowDown') { CAM.tx -= F[0] * s; CAM.tz -= F[1] * s; }
    else if (e.key === '+' || e.key === '=') CAM.dist *= 0.85;
    else if (e.key === '-' || e.key === '_') CAM.dist /= 0.85;
    else used = false;
    if (used) { hideHint(); clampCam(); e.preventDefault(); }
  });
}

function bindNav() {
  const nav = document.getElementById('nav'), cv = document.getElementById('navc');
  const toX = (clientX) => {
    const r = cv.getBoundingClientRect();
    const u = clamp((clientX - r.left) / r.width, 0, 1);
    return (1 - u) * QM.L;
  };
  let drag = false;
  const go = (e) => {
    const vis = visibleWidth();
    const x = toX(e.clientX);
    // 点在框内时保持相对位置不跳
    CAM.tx = x;
    clampCam();
  };
  cv.addEventListener('pointerdown', (e) => { drag = true; cv.setPointerCapture(e.pointerId); go(e); document.getElementById('hint').classList.add('off'); hintOff = true; });
  cv.addEventListener('pointermove', (e) => { if (drag) go(e); });
  cv.addEventListener('pointerup', () => { drag = false; });
  cv.addEventListener('pointercancel', () => { drag = false; });
}

function resizeNav() {
  const cv = document.getElementById('navc');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(cv.clientWidth * dpr);
  cv.height = Math.round(cv.clientHeight * dpr);
}

var NAV_IMG = new Image();
NAV_IMG.src = 'data:image/jpeg;base64,/*NAV*/';

function drawNav() {
  const cv = document.getElementById('navc');
  const g = cv.getContext('2d'), W = cv.width, H = cv.height;
  if (NAV_IMG.complete && NAV_IMG.naturalWidth) g.drawImage(NAV_IMG, 0, 0, W, H);
  else { g.fillStyle = '#c9b58a'; g.fillRect(0, 0, W, H); }
  const vis = visibleWidth();
  const u0 = clamp(1 - (CUR.tx + vis / 2) / QM.L, 0, 1), u1 = clamp(1 - (CUR.tx - vis / 2) / QM.L, 0, 1);
  const x0 = u0 * W, w = Math.max(6, (u1 - u0) * W);
  g.fillStyle = 'rgba(255,248,225,0.2)'; g.fillRect(x0, 0, w, H);
  g.strokeStyle = '#8c2f1e'; g.lineWidth = 2 * (W / cv.clientWidth) * 0.5 + 1;
  g.strokeRect(x0 + 1, 1, w - 2, H - 2);
  // 段落分界
  g.strokeStyle = 'rgba(60,40,20,0.55)'; g.lineWidth = 1;
  for (const X of [700, 800]) { const x = (1 - X / QM.L) * W; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
}

function buildNavLabels() {
  const box = document.getElementById('navlabels');
  const items = [['郊野春色', 350], ['汴河虹桥', 740], ['城门街市', 1200]];
  for (const [t, X] of items) {
    const s = document.createElement('span');
    s.textContent = t;
    s.style.left = ((1 - X / QM.L) * 100) + '%';
    box.appendChild(s);
  }
}

function syncPanel() {
  const sz = document.getElementById('sz'), sp = document.getElementById('sp'), sy = document.getElementById('sy');
  if (document.activeElement !== sz) {
    const t = (Math.log(CAM.dist) - Math.log(5)) / (Math.log(900) - Math.log(5));
    sz.value = Math.round((1 - t) * 100);
  }
  if (document.activeElement !== sp) sp.value = Math.round(CAM.pitch * 180 / Math.PI);
  if (document.activeElement !== sy) sy.value = Math.round(((CAM.yaw * 180 / Math.PI + 180) % 360 + 360) % 360 - 180);
  document.getElementById('sv').textContent = `俯仰 ${Math.round(CAM.pitch * 180 / Math.PI)}°`;
}

function bindPanel() {
  const panel = document.getElementById('panel');
  const sz = document.getElementById('sz'), sp = document.getElementById('sp'), sy = document.getElementById('sy');
  if (window.innerWidth < 720) panel.classList.add('collapsed');
  document.getElementById('ptog').addEventListener('click', () => panel.classList.toggle('collapsed'));
  sz.addEventListener('input', () => { const t = 1 - sz.value / 100; CAM.dist = Math.exp(Math.log(5) + t * (Math.log(900) - Math.log(5))); clampCam(); });
  sp.addEventListener('input', () => { CAM.pitch = sp.value * Math.PI / 180; clampCam(); });
  sy.addEventListener('input', () => { CAM.yaw = sy.value * Math.PI / 180; clampCam(); });
  const bl = document.getElementById('blabel');
  bl.addEventListener('click', () => {
    labelsOn = !labelsOn;
    QM.labelGroup.visible = labelsOn;
    bl.textContent = labelsOn ? '题签：开' : '题签：关';
    bl.setAttribute('aria-pressed', String(labelsOn));
  });
  document.getElementById('brst').addEventListener('click', () => { Object.assign(CAM, CAM_DEFAULT); clampCam(); });
}

function updateTitle() {
  const i = SEGS.findIndex((s) => CUR.tx < s.x1);
  const idx = i < 0 ? SEGS.length - 1 : i;
  if (idx !== segIdx) {
    segIdx = idx;
    document.getElementById('st').textContent = SEGS[idx].t;
    document.getElementById('sd').textContent = SEGS[idx].d;
  }
}

function updateUI() {
  drawNav();
  syncPanel();
  updateTitle();
}
