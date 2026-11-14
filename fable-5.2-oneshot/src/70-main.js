/* 主程序：建场景、主循环 */
(function () {
  'use strict';
  var T = THREE, Q = window.Q, W = Q.W;
  Q.scenes = Q.scenes || [];
  Q.tickers = Q.tickers || [];
  function start() {
    var app = document.getElementById('app');
    var renderer = Q.renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    var pr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pr);
    app.appendChild(renderer.domElement);
    var scene = Q.scene = new T.Scene();
    var silk = new T.Color(Q.COL.silk[0], Q.COL.silk[1], Q.COL.silk[2]);
    scene.background = silk.clone().multiplyScalar(1.02);
    scene.fog = new T.Fog(scene.background.getHex(), 100, 600);
    scene.add(new T.HemisphereLight(0xfff4e2, 0x94805e, 0.74));
    var sun = new T.DirectionalLight(0xfff2dc, 0.36); sun.position.set(-0.5, 1, 0.75); scene.add(sun);
    Q.makeMaterials();
    Q.cam.init(renderer);
    W.build(scene);
    var ctx = Q.ctx = { b: new Q.Batch(60), twigs: new Q.Lines(60), ropes: new Q.Lines(120), scene: scene };
    Q.scenes.forEach(function (fn) { fn(ctx); });
    scene.add(ctx.b.build());
    scene.add(ctx.twigs.build(Q.mats.twig));
    scene.add(ctx.ropes.build(Q.mats.rope));
    Q.stats.pools = Q.finalizePools(scene);
    Q.ui.init();
    function resize() {
      var w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      Q.cam.camera.aspect = w / h;
    }
    resize(); window.addEventListener('resize', resize);
    var clock = new T.Clock(), t = 0, slow = 0, fast = 0;
    Q.time = 0;
    function frame() {
      var dt = Math.min(clock.getDelta(), 0.1);
      if (Q.freeze !== undefined) { t = Q.freeze; dt = 0.016; } else t += dt;
      Q.time = t; Q.uTime.value = t;
      Q.cam.update(dt);
      Q.F.far = Q.cam.dist > 190;
      W.tick(t);
      var r = Q.cam.range, x0 = r.x0 - 6, x1 = r.x1 + 6;
      var i, es = Q.ents, n = es.length, tk = Q.tickers;
      for (i = 0; i < tk.length; i++) tk[i](t, dt, x0, x1);
      var shown = 0;
      for (i = 0; i < n; i++) { if (es[i].draw(t, x0, x1)) shown++; }
      Q.stats.shown = shown;
      Q.flushPools();
      Q.ui.update();
      renderer.render(scene, Q.cam.camera);
      Q.stats.calls = renderer.info.render.calls; Q.stats.frameTris = renderer.info.render.triangles;
      // 帧率过低时自动降分辨率
      if (Q.freeze === undefined) {
        if (dt > 0.045) { slow++; fast = 0; } else if (dt < 0.02) { fast++; slow = Math.max(0, slow - 1); }
        if (slow > 40 && pr > 0.75) { pr = Math.max(0.75, pr - 0.25); renderer.setPixelRatio(pr); resize(); slow = 0; }
      }
      requestAnimationFrame(frame);
    }
    Q.cam.set({}, true);
    frame();
    Q.ready = true;
    var ld = document.getElementById('loading'); ld.classList.add('gone');
    setTimeout(function () { ld.style.display = 'none'; }, 1200);
  }
  function boot() {
    var go = function () { setTimeout(function () { try { start(); } catch (e) { console.error(e); document.getElementById('loadMsg').textContent = '载入出错：' + e.message; } }, 30); };
    var done = false, once = function () { if (!done) { done = true; go(); } };
    if (document.fonts && document.fonts.load) {
      document.fonts.load('20px "QMKai"', '清明上河图').then(once, once);
      setTimeout(once, 2500);
    } else once();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
