/* 镜头：全手动。左键拖动平移，右键/Shift 拖动转视角与俯仰，滚轮缩放；
   触屏单指平移，双指捏合缩放、扭转旋转、同向上下推俯仰；方向键与加减号。 */
(function () {
  'use strict';
  var T = THREE, Q = window.Q, W = Q.W;
  var DMIN = 4.2, DMAX = 430, D2R = Math.PI / 180;
  var HOME = { x: 232, z: 2, zoom: 0.60, yaw: 0, pitchOff: 0 };
  var cam = Q.cam = {
    x: HOME.x, z: HOME.z, zoom: HOME.zoom, yaw: 0, pitchOff: 0,       // 目标值
    cx: HOME.x, cz: HOME.z, czoom: HOME.zoom, cyaw: 0, cpitchOff: 0,  // 当前（平滑后）
    dist: 100, pitch: 0.6, range: { x0: 0, x1: 0, z0: 0, z1: 0 }, moved: false, onChange: null
  };
  cam.autoPitch = function (zoom) { return Q.lerp(9, 54, Q.smooth(0.0, 1.0, zoom)) * D2R; };
  cam.distOf = function (zoom) { return DMIN * Math.pow(DMAX / DMIN, zoom); };
  cam.getPitchDeg = function () { return Q.clamp((cam.autoPitch(cam.zoom) + cam.pitchOff) / D2R, 3, 88); };
  cam.setPitchDeg = function (deg) { cam.pitchOff = deg * D2R - cam.autoPitch(cam.zoom); };
  function clampState() {
    cam.x = Q.clamp(cam.x, W.xMin - 4, W.xMax + 4);
    cam.z = Q.clamp(cam.z, -42, 34);
    cam.zoom = Q.clamp(cam.zoom, 0, 1);
    var p = cam.autoPitch(cam.zoom) + cam.pitchOff;
    p = Q.clamp(p, 3 * D2R, 88 * D2R); cam.pitchOff = p - cam.autoPitch(cam.zoom);
  }
  cam.reset = function () { cam.x = HOME.x; cam.z = HOME.z; cam.zoom = HOME.zoom; cam.yaw = 0; cam.pitchOff = 0; while (cam.cyaw > Math.PI) cam.cyaw -= 2 * Math.PI; while (cam.cyaw < -Math.PI) cam.cyaw += 2 * Math.PI; };
  cam.set = function (o, snap) {
    for (var k in o) cam[k] = o[k];
    clampState();
    if (snap) { cam.cx = cam.x; cam.cz = cam.z; cam.czoom = cam.zoom; cam.cyaw = cam.yaw; cam.cpitchOff = cam.pitchOff; }
  };
  cam.pan = function (dxPix, dyPix) {
    var h = Q.renderer.domElement.clientHeight;
    var k = cam.dist * 2 * Math.tan(cam.camera.fov * D2R / 2) / h;
    var sp = Math.max(0.3, Math.sin(cam.pitch));
    var rx = Math.cos(cam.cyaw), rz = -Math.sin(cam.cyaw), fx = -Math.sin(cam.cyaw), fz = -Math.cos(cam.cyaw);
    cam.x += -dxPix * k * rx + dyPix * k / sp * fx;
    cam.z += -dxPix * k * rz + dyPix * k / sp * fz;
    clampState();
  };
  cam.zoomBy = function (d) { cam.zoom += d; clampState(); };
  cam.rotate = function (dyaw, dpitch) { cam.yaw += dyaw; cam.pitchOff += dpitch; clampState(); };

  cam.init = function (renderer) {
    var el = renderer.domElement;
    cam.camera = new T.PerspectiveCamera(30, 1, 0.5, 3000);
    var ptrs = {}, np = 0, last2 = null;
    function touched() { if (!cam.moved) { cam.moved = true; if (cam.onFirst) cam.onFirst(); } }
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    el.addEventListener('pointerdown', function (e) {
      el.setPointerCapture && el.setPointerCapture(e.pointerId);
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY, rot: e.button === 2 || e.shiftKey || e.button === 1 };
      np = Object.keys(ptrs).length; last2 = null;
      el.style.cursor = 'grabbing';
    });
    function two() {
      var k = Object.keys(ptrs), a = ptrs[k[0]], b = ptrs[k[1]];
      return { d: Math.hypot(a.x - b.x, a.y - b.y), a: Math.atan2(b.y - a.y, b.x - a.x), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
    }
    el.addEventListener('pointermove', function (e) {
      var p = ptrs[e.pointerId]; if (!p) return;
      var dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (np === 1) {
        if (p.rot || e.shiftKey) cam.rotate(-dx * 0.005, dy * 0.004);
        else cam.pan(dx, dy);
        touched();
      } else if (np === 2) {
        var t = two();
        if (last2) {
          if (t.d > 10 && last2.d > 10) cam.zoomBy(-Math.log(t.d / last2.d) / Math.log(DMAX / DMIN));
          var da = t.a - last2.a; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI;
          // 双指同向上下 → 俯仰；扭转 → 旋转
          cam.rotate(-da, (t.cy - last2.cy) * 0.004);
          cam.pan((t.cx - last2.cx) * 0.6, 0);
        }
        last2 = t; touched();
      }
    });
    function up(e) { delete ptrs[e.pointerId]; np = Object.keys(ptrs).length; last2 = null; if (!np) el.style.cursor = 'grab'; }
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') up(e); });
    el.addEventListener('wheel', function (e) {
      e.preventDefault();
      var d = e.deltaMode === 1 ? e.deltaY * 30 : e.deltaY;
      cam.zoomBy(Q.clamp(d, -240, 240) * 0.00042); touched();
    }, { passive: false });
    var keys = {};
    window.addEventListener('keydown', function (e) {
      if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName) && e.target.type !== 'range') return;
      keys[e.key] = true;
      if (/^Arrow/.test(e.key) || e.key === '+' || e.key === '-' || e.key === '=' || e.key === '_') { e.preventDefault(); touched(); }
    });
    window.addEventListener('keyup', function (e) { keys[e.key] = false; });
    window.addEventListener('blur', function () { keys = {}; });
    cam.keys = function (dt) {
      var s = 620 * dt, any = false;
      if (keys.ArrowLeft) { cam.pan(s, 0); any = true; } if (keys.ArrowRight) { cam.pan(-s, 0); any = true; }
      if (keys.ArrowUp) { cam.pan(0, s); any = true; } if (keys.ArrowDown) { cam.pan(0, -s); any = true; }
      if (keys['+'] || keys['=']) { cam.zoomBy(-0.5 * dt); any = true; } if (keys['-'] || keys['_']) { cam.zoomBy(0.5 * dt); any = true; }
      return any;
    };
    el.style.cursor = 'grab'; el.style.touchAction = 'none';
  };

  var ray = new T.Vector3(), tmp = new T.Vector3();
  cam.update = function (dt) {
    cam.keys(dt);
    var k = 1 - Math.exp(-dt * 9);
    cam.cx += (cam.x - cam.cx) * k; cam.cz += (cam.z - cam.cz) * k;
    cam.czoom += (cam.zoom - cam.czoom) * k; cam.cyaw += (cam.yaw - cam.cyaw) * k; cam.cpitchOff += (cam.pitchOff - cam.cpitchOff) * k;
    var dist = cam.dist = cam.distOf(cam.czoom);
    var pitch = cam.pitch = Q.clamp(cam.autoPitch(cam.czoom) + cam.cpitchOff, 3 * D2R, 88 * D2R);
    var c = cam.camera, cp = Math.cos(pitch), sp = Math.sin(pitch);
    var ty = Q.lerp(1.25, 0.2, Q.smooth(0.05, 0.6, cam.czoom)) + W.deckY(cam.cx, cam.cz) * (1 - Q.smooth(0.2, 0.6, cam.czoom));
    c.position.set(cam.cx + Math.sin(cam.cyaw) * cp * dist, Math.max(0.9, ty + sp * dist), cam.cz + Math.cos(cam.cyaw) * cp * dist);
    c.near = Math.max(0.25, dist * 0.04); c.far = dist * 3 + 1200;
    c.lookAt(cam.cx, ty, cam.cz);
    c.updateProjectionMatrix(); c.updateMatrixWorld();
    if (Q.scene.fog) { Q.scene.fog.near = dist * 1.05 + 30; Q.scene.fog.far = dist * 2.6 + 300; }
    // 视野在地面上的范围
    var x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, lim = dist * 2.2 + 160;
    var pts = [[-1, -1], [1, -1], [-1, 1], [1, 1], [-1, 0], [1, 0]];
    for (var i = 0; i < pts.length; i++) {
      ray.set(pts[i][0], pts[i][1], 0.5).unproject(c).sub(c.position).normalize();
      var t = ray.y < -1e-4 ? -c.position.y / ray.y : lim;
      if (t > lim) t = lim;
      tmp.copy(c.position).addScaledVector(ray, t);
      x0 = Math.min(x0, tmp.x); x1 = Math.max(x1, tmp.x); z0 = Math.min(z0, tmp.z); z1 = Math.max(z1, tmp.z);
    }
    cam.range.x0 = x0; cam.range.x1 = x1; cam.range.z0 = z0; cam.range.z1 = z1;
    // 正前方画面宽度（导航框用屏幕中线处的宽度更稳）
    var half = dist * Math.tan(c.fov * D2R / 2) * c.aspect;
    cam.viewHalf = half;
  };
})();
