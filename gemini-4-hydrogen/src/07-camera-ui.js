// ============================================================================
// 07-camera-ui.js — 手动交互镜头、底部全卷缩略图、视角控制面板、题签投影与主循环
// ============================================================================
(function (QM) {
  'use strict';

  QM.startApp = function () {
    if (typeof THREE === 'undefined') {
      const err = document.getElementById('load-error');
      if (err) err.style.display = 'flex';
      return;
    }

    const container = document.getElementById('canvas-wrap');
    const W = window.innerWidth;
    const H = window.innerHeight;

    // ------------------------------------------------------------------------
    // 1. Three.js 场景、暖褐绢本色调雾效、灯光
    // ------------------------------------------------------------------------
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(QM.PAL.silkBg);
    scene.fog = new THREE.FogExp2(QM.PAL.silkBg, 0.0020);

    const camera = new THREE.PerspectiveCamera(42, W / H, 0.5, 650);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);

    // 北宋早春柔和天光与暖阳
    const hemiLight = new THREE.HemisphereLight(0xf6ebd4, 0x8f7b5d, 0.86);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfff1d6, 0.82);
    dirLight.position.set(80, 115, 70);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 20;
    dirLight.shadow.camera.far = 380;
    dirLight.shadow.camera.left = -150;
    dirLight.shadow.camera.right = 150;
    dirLight.shadow.camera.top = 95;
    dirLight.shadow.camera.bottom = -95;
    scene.add(dirLight);

    // ------------------------------------------------------------------------
    // 2. 构建地形、静态建筑树木、动态船只与人物牲口
    // ------------------------------------------------------------------------
    QM.initMaterials();
    QM.buildTerrain(scene);

    const batch = new QM.StaticBatcher();
    const em = new QM.EntityManager(scene);
    const bm = new QM.BoatManager(scene);

    QM.populateWorld(scene, batch, em, bm);
    batch.buildInto(scene);
    em.finalize();

    // 炊烟粒子（InstancedMesh）
    const smokeGeo = QM.prepareGeo(new THREE.DodecahedronGeometry(0.42, 0), 0xe8decb);
    const smokeMat = new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.32 });
    const smokeCount = Math.max(1, QM.smokeEmitters.length * 6);
    const smokeIM = new THREE.InstancedMesh(smokeGeo, smokeMat, smokeCount);
    smokeIM.frustumCulled = false;
    scene.add(smokeIM);

    // 飞鸟群（InstancedMesh）
    const birdGeo = (() => {
      const p = [];
      const b = new THREE.BoxGeometry(0.12, 0.08, 0.36);
      p.push(QM.prepareGeo(b, 0x3b3229));
      const wL = new THREE.BoxGeometry(0.48, 0.03, 0.16);
      wL.translate(-0.24, 0.02, 0);
      p.push(QM.prepareGeo(wL, 0x453b31));
      const wR = new THREE.BoxGeometry(0.48, 0.03, 0.16);
      wR.translate(0.24, 0.02, 0);
      p.push(QM.prepareGeo(wR, 0x453b31));
      return QM.mergeGeometries(p);
    })();
    const birdCount = 26;
    const birdIM = new THREE.InstancedMesh(birdGeo, QM.MAT.entity, birdCount);
    birdIM.frustumCulled = false;
    const birds = [];
    for (let i = 0; i < birdCount; i++) {
      birdIM.setColorAt(i, new THREE.Color(0xffffff));
      birds.push({
        cx: -210 + QM.rand() * 440,
        cz: -18 + QM.rand() * 34,
        cy: 14 + QM.rand() * 14,
        r: 7 + QM.rand() * 12,
        sp: 0.35 + QM.rand() * 0.45,
        ph: QM.rand() * 6.28
      });
    }
    if (birdIM.instanceColor) birdIM.instanceColor.needsUpdate = true;
    scene.add(birdIM);

    // ------------------------------------------------------------------------
    // 3. 题签（店铺与地标标签 DOM）
    // ------------------------------------------------------------------------
    const labelsLayer = document.getElementById('labels-layer');
    let showLabels = true;
    const labelItems = QM.LANDMARKS.map((lm) => {
      const el = document.createElement('div');
      el.className = 'landmark-tag';
      el.textContent = lm.name;
      labelsLayer.appendChild(el);
      return { lm, el };
    });

    // ------------------------------------------------------------------------
    // 4. 手动镜头状态与控制（严禁自动播放，完全手动浏览）
    // ------------------------------------------------------------------------
    const DEFAULT_CAM = {
      tx: 196,       // 开卷位置：郊野春色（卷首）
      tz: 7.5,
      dist: 42,
      pitch: 0.48,   // ~27.5° 俯角
      yaw: 0.0
    };
    const camState = { ...DEFAULT_CAM };
    const camTarget = { ...DEFAULT_CAM };

    const clampCam = (s) => {
      s.tx = Math.max(-256, Math.min(256, s.tx));
      s.tz = Math.max(-32, Math.min(34, s.tz));
      s.dist = Math.max(7.5, Math.min(210, s.dist));
      s.pitch = Math.max(0.14, Math.min(1.36, s.pitch));
    };

    // 首次操作淡出提示
    const hintEl = document.getElementById('hint-banner');
    let hintDismissed = false;
    function dismissHint() {
      if (!hintDismissed) {
        hintDismissed = true;
        hintEl.classList.add('hidden');
      }
    }

    // 视角面板绑定
    const panel = document.getElementById('view-panel');
    const toggleBtn = document.getElementById('panel-toggle');
    if (window.innerWidth < 768) panel.classList.add('collapsed');
    toggleBtn.addEventListener('click', () => {
      panel.classList.toggle('collapsed');
    });

    const sZoom = document.getElementById('slider-zoom');
    const sPitch = document.getElementById('slider-pitch');
    const sYaw = document.getElementById('slider-yaw');
    const btnLabels = document.getElementById('btn-labels');
    const btnReset = document.getElementById('btn-reset');

    function syncSlidersFromTarget() {
      sZoom.value = Math.round(camTarget.dist);
      sPitch.value = Math.round((camTarget.pitch * 180) / Math.PI);
      let deg = Math.round((camTarget.yaw * 180) / Math.PI) % 360;
      if (deg > 180) deg -= 360;
      if (deg < -180) deg += 360;
      sYaw.value = deg;
    }

    sZoom.addEventListener('input', () => { dismissHint(); camTarget.dist = Number(sZoom.value); clampCam(camTarget); });
    sPitch.addEventListener('input', () => { dismissHint(); camTarget.pitch = (Number(sPitch.value) * Math.PI) / 180; clampCam(camTarget); });
    sYaw.addEventListener('input', () => { dismissHint(); camTarget.yaw = (Number(sYaw.value) * Math.PI) / 180; });

    btnLabels.addEventListener('click', () => {
      showLabels = !showLabels;
      btnLabels.classList.toggle('active', showLabels);
      labelsLayer.style.display = showLabels ? 'block' : 'none';
    });
    btnReset.addEventListener('click', () => {
      dismissHint();
      Object.assign(camTarget, DEFAULT_CAM);
      syncSlidersFromTarget();
    });
    syncSlidersFromTarget();

    // 鼠标拖拽：左键平移，右键或 Shift+左键旋转俯仰，滚轮缩放
    const dom = renderer.domElement;
    let dragMode = null; // 'pan' | 'orbit'
    let lastX = 0, lastY = 0;

    dom.addEventListener('contextmenu', (e) => e.preventDefault());
    dom.addEventListener('mousedown', (e) => {
      dismissHint();
      lastX = e.clientX;
      lastY = e.clientY;
      if (e.button === 2 || e.shiftKey) dragMode = 'orbit';
      else if (e.button === 0) dragMode = 'pan';
    });

    window.addEventListener('mousemove', (e) => {
      if (!dragMode) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      if (dragMode === 'pan') {
        const panScale = camTarget.dist * 0.00145;
        const cosY = Math.cos(camTarget.yaw);
        const sinY = Math.sin(camTarget.yaw);
        camTarget.tx -= (dx * cosY + dy * sinY) * panScale;
        camTarget.tz -= (-dx * sinY + dy * cosY) * panScale;
        clampCam(camTarget);
      } else if (dragMode === 'orbit') {
        camTarget.yaw -= dx * 0.0055;
        camTarget.pitch += dy * 0.0045;
        clampCam(camTarget);
        syncSlidersFromTarget();
      }
    });
    window.addEventListener('mouseup', () => { dragMode = null; });

    dom.addEventListener('wheel', (e) => {
      e.preventDefault();
      dismissHint();
      const factor = Math.exp(e.deltaY * 0.0011);
      camTarget.dist *= factor;
      clampCam(camTarget);
      syncSlidersFromTarget();
    }, { passive: false });

    // 触屏控制：单指平移，双指捏合缩放 + 旋转与俯仰
    let touchState = null;
    function getTouchMetrics(touches) {
      const t0 = touches[0], t1 = touches[1];
      const cx = (t0.clientX + t1.clientX) * 0.5;
      const cy = (t0.clientY + t1.clientY) * 0.5;
      const d = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      const a = Math.atan2(t1.clientY - t0.clientY, t1.clientX - t0.clientX);
      return { cx, cy, d, a };
    }
    dom.addEventListener('touchstart', (e) => {
      dismissHint();
      if (e.touches.length === 1) {
        touchState = { mode: 'pan', x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        touchState = { mode: 'pinch', ...getTouchMetrics(e.touches) };
      }
    }, { passive: true });
    dom.addEventListener('touchmove', (e) => {
      if (!touchState) return;
      e.preventDefault();
      if (e.touches.length === 1 && touchState.mode === 'pan') {
        const dx = e.touches[0].clientX - touchState.x;
        const dy = e.touches[0].clientY - touchState.y;
        touchState.x = e.touches[0].clientX;
        touchState.y = e.touches[0].clientY;
        const panScale = camTarget.dist * 0.0017;
        const cosY = Math.cos(camTarget.yaw), sinY = Math.sin(camTarget.yaw);
        camTarget.tx -= (dx * cosY + dy * sinY) * panScale;
        camTarget.tz -= (-dx * sinY + dy * cosY) * panScale;
        clampCam(camTarget);
      } else if (e.touches.length === 2) {
        if (touchState.mode !== 'pinch') {
          touchState = { mode: 'pinch', ...getTouchMetrics(e.touches) };
          return;
        }
        const cur = getTouchMetrics(e.touches);
        if (cur.d > 10 && touchState.d > 10) {
          camTarget.dist *= touchState.d / cur.d;
        }
        let da = cur.a - touchState.a;
        if (da > Math.PI) da -= Math.PI * 2;
        if (da < -Math.PI) da += Math.PI * 2;
        camTarget.yaw -= da * 0.85;
        camTarget.pitch += (cur.cy - touchState.cy) * 0.0045;
        touchState = { mode: 'pinch', ...cur };
        clampCam(camTarget);
        syncSlidersFromTarget();
      }
    }, { passive: false });
    dom.addEventListener('touchend', (e) => {
      if (e.touches.length === 0) touchState = null;
      else if (e.touches.length === 1) touchState = { mode: 'pan', x: e.touches[0].clientX, y: e.touches[0].clientY };
    });

    // 键盘方向键与 +- 缩放
    const keysDown = new Set();
    window.addEventListener('keydown', (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '=', '+', '-', '_'].includes(e.key)) {
        dismissHint();
        keysDown.add(e.key);
      }
    });
    window.addEventListener('keyup', (e) => keysDown.delete(e.key));

    function processKeyboard(dt) {
      if (keysDown.size === 0) return;
      const step = camTarget.dist * 0.72 * dt;
      const cosY = Math.cos(camTarget.yaw), sinY = Math.sin(camTarget.yaw);
      if (keysDown.has('ArrowLeft')) { camTarget.tx -= cosY * step; camTarget.tz += sinY * step; }
      if (keysDown.has('ArrowRight')) { camTarget.tx += cosY * step; camTarget.tz -= sinY * step; }
      if (keysDown.has('ArrowUp')) { camTarget.tx -= sinY * step; camTarget.tz -= cosY * step; }
      if (keysDown.has('ArrowDown')) { camTarget.tx += sinY * step; camTarget.tz += cosY * step; }
      if (keysDown.has('=') || keysDown.has('+')) { camTarget.dist *= (1 - 1.1 * dt); syncSlidersFromTarget(); }
      if (keysDown.has('-') || keysDown.has('_')) { camTarget.dist *= (1 + 1.1 * dt); syncSlidersFromTarget(); }
      clampCam(camTarget);
    }

    // ------------------------------------------------------------------------
    // 5. 底部全卷缩略图导航条（程序绘全卷，左为城门街市、中为虹桥、右为郊野春色）
    // ------------------------------------------------------------------------
    const miniCanvas = document.getElementById('minimap-canvas');
    const miniBox = document.getElementById('minimap-viewport');
    const miniWrap = document.getElementById('minimap-wrap');

    function paintMinimapScroll() {
      const cw = 1600, ch = 84;
      miniCanvas.width = cw;
      miniCanvas.height = ch;
      const ctx = miniCanvas.getContext('2d');

      const bg = ctx.createLinearGradient(0, 0, cw, 0);
      bg.addColorStop(0, '#c8b38c');
      bg.addColorStop(0.5, '#d4c29f');
      bg.addColorStop(1, '#cbb792');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, cw, ch);

      const xToU = (wx) => ((wx - QM.WORLD.X_MIN) / QM.WORLD.LEN) * cw;
      const zToV = (wz) => ((wz - QM.WORLD.Z_MIN) / (QM.WORLD.Z_MAX - QM.WORLD.Z_MIN)) * ch;

      // 汴河河道
      ctx.beginPath();
      for (let wx = -264; wx <= 145; wx += 4) {
        const u = xToU(wx);
        const v = zToV(QM.riverCenterZ(wx) - QM.riverHalfWidth(wx));
        if (wx === -264) ctx.moveTo(u, v); else ctx.lineTo(u, v);
      }
      for (let wx = 145; wx >= -264; wx -= 4) {
        ctx.lineTo(xToU(wx), zToV(QM.riverCenterZ(wx) + QM.riverHalfWidth(wx)));
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(104, 102, 78, 0.58)';
      ctx.fill();

      // 主干道
      ctx.strokeStyle = 'rgba(148, 120, 82, 0.5)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let wx = -260; wx <= 260; wx += 6) {
        const u = xToU(wx), v = zToV(QM.roadCenterZ(wx));
        if (wx === -260) ctx.moveTo(u, v); else ctx.lineTo(u, v);
      }
      ctx.stroke();

      // 城内外建筑剪影
      ctx.fillStyle = 'rgba(78, 56, 36, 0.65)';
      for (let wx = -255; wx < -118; wx += 11) {
        ctx.fillRect(xToU(wx) - 4, zToV(16) - 3, 9, 6);
        if (wx < -165) ctx.fillRect(xToU(wx) - 4, zToV(-8) - 2, 8, 5);
      }
      for (let wx = 20; wx <= 82; wx += 13) {
        ctx.fillRect(xToU(wx) - 3, zToV(18) - 2, 7, 5);
      }
      // 村舍茅屋
      ctx.fillRect(xToU(174) - 4, zToV(-4) - 2, 9, 5);
      // 东角子门城台
      ctx.fillStyle = '#5a4939';
      ctx.fillRect(xToU(-115) - 5, zToV(-18), 10, 48);
      // 虹桥拱影
      ctx.fillStyle = '#7e3628';
      ctx.fillRect(xToU(5) - 4, zToV(-10), 8, 22);
      // 漕船剪影
      ctx.fillStyle = '#5a432c';
      [101, 90, 74, 68, 62, 56, 42, 18, -12, -27, -38].forEach((bx) => {
        ctx.fillRect(xToU(bx) - 5, zToV(QM.riverCenterZ(bx)) - 1, 10, 3);
      });
      // 三段分界竖线
      ctx.strokeStyle = 'rgba(70, 50, 30, 0.35)';
      ctx.setLineDash([3, 3]);
      [110, -60].forEach((sx) => {
        const ux = xToU(sx);
        ctx.beginPath(); ctx.moveTo(ux, 0); ctx.lineTo(ux, ch); ctx.stroke();
      });
    }
    paintMinimapScroll();

    function jumpFromMinimap(clientX) {
      dismissHint();
      const rect = miniWrap.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const wx = QM.WORLD.X_MIN + ratio * QM.WORLD.LEN;
      camTarget.tx = wx;
      camTarget.tz = wx > 10 ? 7.5 : (wx > -60 ? 5.0 : 6.0);
      clampCam(camTarget);
    }

    let miniDragging = false;
    miniWrap.addEventListener('pointerdown', (e) => {
      miniDragging = true;
      miniWrap.setPointerCapture(e.pointerId);
      jumpFromMinimap(e.clientX);
    });
    miniWrap.addEventListener('pointermove', (e) => {
      if (miniDragging) jumpFromMinimap(e.clientX);
    });
    miniWrap.addEventListener('pointerup', () => { miniDragging = false; });

    // ------------------------------------------------------------------------
    // 6. 左上角段落信息同步与窗口尺寸响应
    // ------------------------------------------------------------------------
    const secTitleEl = document.getElementById('sec-title');
    const secDescEl = document.getElementById('sec-desc');
    let currentSecId = '';

    function updateSectionCaption(wx) {
      let sec = QM.SECTIONS[1];
      for (let i = 0; i < QM.SECTIONS.length; i++) {
        if (wx >= QM.SECTIONS[i].xMin && wx <= QM.SECTIONS[i].xMax) {
          sec = QM.SECTIONS[i];
          break;
        }
      }
      if (sec.id !== currentSecId) {
        currentSecId = sec.id;
        secTitleEl.textContent = sec.title;
        secDescEl.textContent = sec.desc;
      }
    }

    window.addEventListener('resize', () => {
      const w = window.innerWidth, h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });

    // ------------------------------------------------------------------------
    // 7. 主渲染循环
    // ------------------------------------------------------------------------
    const clock = new THREE.Clock();
    const tmpVec = new THREE.Vector3();
    const smokeDummy = new THREE.Object3D();
    const birdDummy = new THREE.Object3D();
    let elapsed = 0;

    function animate() {
      requestAnimationFrame(animate);
      const dt = Math.min(0.05, clock.getDelta());
      elapsed += dt;

      processKeyboard(dt);

      // 镜头平滑阻尼跟随手动目标
      const damp = 1 - Math.exp(-10 * dt);
      camState.tx += (camTarget.tx - camState.tx) * damp;
      camState.tz += (camTarget.tz - camState.tz) * damp;
      camState.dist += (camTarget.dist - camState.dist) * damp;
      camState.pitch += (camTarget.pitch - camState.pitch) * damp;
      camState.yaw += (camTarget.yaw - camState.yaw) * damp;

      const targetY = Math.max(0.2, QM.groundHeight(camState.tx, camState.tz) * 0.4 + 1.1);
      const horiz = Math.cos(camState.pitch) * camState.dist;
      const vert = Math.sin(camState.pitch) * camState.dist;
      camera.position.set(
        camState.tx + Math.sin(camState.yaw) * horiz,
        targetY + vert,
        camState.tz + Math.cos(camState.yaw) * horiz
      );
      camera.lookAt(camState.tx, targetY, camState.tz);

      // 平行光随视点中心跟随，保持近处人物建筑阴影锐利
      dirLight.position.set(camState.tx + 60, 110, camState.tz + 65);
      dirLight.target.position.set(camState.tx, 0, camState.tz);
      dirLight.target.updateMatrixWorld();

      // 1. 汴河水波流动
      QM.textures.texWater.offset.x = -elapsed * 0.04;
      QM.textures.texWater.offset.y = Math.sin(elapsed * 0.4) * 0.02;

      // 2. 人物、牲口、车轿、船只更新
      em.update(elapsed, dt);
      bm.update(elapsed);

      // 3. 旗幌、早春柳条轻拂
      for (let i = 0; i < QM.animatedFlags.length; i++) {
        const f = QM.animatedFlags[i];
        f.mesh.rotation.y = f.baseYaw + Math.sin(elapsed * 2.4 + f.phase) * 0.22;
        f.mesh.rotation.z = Math.cos(elapsed * 1.9 + f.phase) * 0.08;
      }
      for (let i = 0; i < QM.animatedWillows.length; i++) {
        const w = QM.animatedWillows[i];
        w.group.rotation.z = Math.sin(elapsed * 1.4 + w.phase) * 0.055;
        w.group.rotation.x = Math.cos(elapsed * 1.1 + w.phase) * 0.035;
      }

      // 4. 炊烟袅袅
      let si = 0;
      for (let e = 0; e < QM.smokeEmitters.length; e++) {
        const emPos = QM.smokeEmitters[e];
        for (let p = 0; p < 6; p++) {
          const life = (elapsed * 0.22 + p / 6 + e * 0.17) % 1;
          smokeDummy.position.set(
            emPos.x + Math.sin(life * 5 + e) * 0.65 + life * 1.4,
            emPos.y + life * 6.5,
            emPos.z + Math.cos(life * 4) * 0.35
          );
          const sc = (0.4 + life * 1.8) * Math.sin(life * Math.PI);
          smokeDummy.scale.set(sc, sc * 0.85, sc);
          smokeDummy.rotation.y = life * 3;
          smokeDummy.updateMatrix();
          smokeIM.setMatrixAt(si++, smokeDummy.matrix);
        }
      }
      smokeIM.instanceMatrix.needsUpdate = true;

      // 5. 飞鸟盘旋
      for (let b = 0; b < birds.length; b++) {
        const bd = birds[b];
        const a = elapsed * bd.sp + bd.ph;
        const bx = bd.cx + Math.cos(a) * bd.r;
        const bz = bd.cz + Math.sin(a) * bd.r * 0.65;
        const by = bd.cy + Math.sin(elapsed * 2.1 + bd.ph) * 0.9;
        birdDummy.position.set(bx, by, bz);
        birdDummy.rotation.set(0, -a, Math.sin(elapsed * 9 + bd.ph) * 0.22);
        birdDummy.scale.set(1, 1, 1);
        birdDummy.updateMatrix();
        birdIM.setMatrixAt(b, birdDummy.matrix);
      }
      birdIM.instanceMatrix.needsUpdate = true;

      // 6. 底部全卷缩略图视窗框同步（宽度随缩放变化）
      const viewWorldW = 2 * camState.dist * Math.tan(THREE.MathUtils.degToRad(21)) * camera.aspect * 1.05;
      const boxWFrac = Math.max(0.025, Math.min(0.95, viewWorldW / QM.WORLD.LEN));
      const centerFrac = (camState.tx - QM.WORLD.X_MIN) / QM.WORLD.LEN;
      const leftFrac = Math.max(0, Math.min(1 - boxWFrac, centerFrac - boxWFrac * 0.5));
      miniBox.style.left = (leftFrac * 100).toFixed(2) + '%';
      miniBox.style.width = (boxWFrac * 100).toFixed(2) + '%';

      // 7. 左上角段落标题更新
      updateSectionCaption(camState.tx);

      // 8. 题签屏幕投影更新
      if (showLabels) {
        const vw = window.innerWidth, vh = window.innerHeight;
        for (let i = 0; i < labelItems.length; i++) {
          const item = labelItems[i];
          const d = Math.hypot(item.lm.x - camState.tx, item.lm.z - camState.tz);
          if (d > 145) {
            item.el.style.display = 'none';
            continue;
          }
          tmpVec.set(item.lm.x, item.lm.y, item.lm.z).project(camera);
          if (tmpVec.z > 1 || tmpVec.z < -1) {
            item.el.style.display = 'none';
            continue;
          }
          const sx = (tmpVec.x * 0.5 + 0.5) * vw;
          const sy = (-tmpVec.y * 0.5 + 0.5) * vh;
          if (sx < -60 || sx > vw + 60 || sy < 20 || sy > vh - 96) {
            item.el.style.display = 'none';
          } else {
            item.el.style.display = 'block';
            item.el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -100%)`;
            item.el.style.opacity = d > 110 ? String(Math.max(0, 1 - (d - 110) / 35)) : '1';
          }
        }
      }

      renderer.render(scene, camera);
    }

    animate();
  };
})(window.QM = window.QM || {});
