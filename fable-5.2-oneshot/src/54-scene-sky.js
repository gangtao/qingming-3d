/* 炊烟、飞鸟与画幅之外的远景 */
(function () {
  'use strict';
  var T = THREE, Q = window.Q, K = Q.K, W = Q.W, COL = Q.COL, S = Q.S, M = Q.M, C = Q.C;
  Q.scenes.push(function (ctx) {
    var i, j;
    // —— 炊烟 ——
    var src = [[149.5, 4.3, -15.2], [233, 3.8, -11], [128, 5, -8], [100, 6, -15], [47, 9, -20], [-46.4, 9.5, 9], [-104, 5, -9], [-74.6, 5, 0], [-222, 11, -10], [-235, 9.6, 22], [-272.6, 6, -9], [-206, 5, -5], [181, 5, 6], [-33, 5.4, 10]];
    var NPF = 12, n = src.length * NPF;
    var sm = new T.InstancedMesh(new T.IcosahedronGeometry(1, 1), new T.MeshBasicMaterial({ color: 0xe6dcc6, transparent: true, opacity: 0.11, depthWrite: false, fog: false }), n);
    sm.frustumCulled = false; sm.renderOrder = 5; ctx.scene.add(sm);
    var mm = new T.Matrix4(), ph = src.map(function () { return Q.rand(10); });
    Q.tickers.push(function (t) {
      for (var a = 0; a < src.length; a++) for (var k = 0; k < NPF; k++) {
        var f = (t * 0.085 + k / NPF + ph[a]) % 1, s = (0.3 + f * 1.5) * Q.smooth(0, 0.08, f) * (1 - Q.smooth(0.7, 1, f));
        mm.makeScale(s * 1.2, s * 0.7, s * 1.2);
        mm.setPosition(src[a][0] + f * f * 3.4 + Math.sin(f * 5 + ph[a] + k) * 0.3 * f, src[a][1] + f * 6.5, src[a][2] + Math.cos(f * 4 + ph[a]) * 0.4 * f);
        sm.setMatrixAt(a * NPF + k, mm);
      }
      sm.instanceMatrix.needsUpdate = true;
    });
    // —— 飞鸟 ——
    var body = Q.pool('bird', function (b) { b.ball('plain', 0, 0, 0, 0.07, 0.06, 0.2, 5, 3, [1, 1, 1]); b.tri('plain', [0, 0, -0.18], [0.07, 0.01, -0.36], [-0.07, 0.01, -0.36], [1, 1, 1]); });
    var wing = Q.pool('birdWing', function (b) { b.tri('plain', [0, 0, 0.1], [0.5, 0, -0.02], [0, 0, -0.1], [1, 1, 1]); b.tri('plain', [0, 0.004, -0.1], [0.5, 0.004, -0.02], [0, 0.004, 0.1], [1, 1, 1]); });
    var R = M.make(), T1 = M.make(), flocks = [[250, -4, 13, 5], [176, 10, 12, 4], [60, 0, 15, 5], [4, -6, 17, 6], [-70, -8, 14, 4], [-189.5, 10, 20, 7], [-235, 4, 16, 5], [-140, 20, 13, 3]];
    flocks.forEach(function (fl) {
      for (j = 0; j < fl[3]; j++) (function (cx, cz, h, k) {
        body.need++; wing.need += 2;
        var rad = Q.rand(5, 13), sp = Q.rand(0.22, 0.4) * (Q.chance(0.5) ? 1 : -1), p0 = Q.rand(6.3), hh = h + Q.rand(-2, 2), col = Q.shade(Q.C(0x3c342c), Q.rand(0.8, 1.3)), fp = Q.rand(6);
        Q.addEnt({ draw: function (t, x0, x1) {
          var a = p0 + t * sp, x = cx + Math.cos(a) * rad * 1.5, z = cz + Math.sin(a) * rad;
          if (x < x0 - 30 || x > x1 + 30) return false;
          var y = hh + Math.sin(t * 0.5 + p0) * 1.2, yaw = Math.atan2(-Math.sin(a) * 1.5 * sp, Math.cos(a) * sp);
          M.pose(R, x, y, z, yaw, 1.5); M.rz(R, R, sp > 0 ? -0.25 : 0.25);
          Q.put(body, R, col);
          var fl2 = Math.sin(t * 9 + fp) * 0.7 * (0.5 + 0.5 * Q.smooth(-0.3, 0.3, Math.sin(t * 0.7 + fp)));
          M.rz(T1, R, fl2); Q.put(wing, T1, col);
          M.ry(T1, R, Math.PI); M.rz(T1, T1, fl2); Q.put(wing, T1, col);
          return false;
        } });
      })(fl[0], fl[1], fl[2], j);
    });
    S.nBirds = flocks.reduce(function (a, f) { return a + f[3]; }, 0);
    // —— 画幅之外：远树、远村，俯瞰时不致空旷 ——
    var b = ctx.b;
    S.scatter(150, -360, 360, -146, -30, function (x, z) { S.tree(ctx, x, z, Q.chance(0.6), { h: Q.rand(3, 5) }); }, 1.6, { bank: 0.5 });
    S.scatter(70, -200, 360, 30, 80, function (x, z) { S.tree(ctx, x, z, Q.chance(0.6), { h: Q.rand(3, 5) }); }, 1.6, { bank: 0.5 });
    S.scatter(34, -190, 360, -140, -36, function (x, z) { S.house(b, { x: x, z: z, ry: Q.rand(-0.4, 0.4), w: Q.rand(6, 8.5), d: 4.8, h: 2.6, roof: Q.chance(0.7) ? 'thatch' : 'tile', front: ['door', 'window'], sides: 'earth', back: 'earth', noStrips: true }); }, 4.5);
    S.scatter(14, -190, 360, 34, 78, function (x, z) { S.house(b, { x: x, z: z, ry: Math.PI + Q.rand(-0.4, 0.4), w: Q.rand(6, 8.5), d: 4.8, h: 2.6, roof: Q.chance(0.7) ? 'thatch' : 'tile', front: ['door', 'window'], sides: 'earth', back: 'earth', noStrips: true }); }, 4.5);
    for (i = 0; i < 40; i++) { var x = Q.rand(-64, 130), z = Q.rand(-12, 34), d = W.waterD(x, z); if (d > -1 && d < 0.4 && Math.abs(x - 4) > 14) K.reeds(ctx.twigs, x, z, 0.8, 10); }
  });
})();
