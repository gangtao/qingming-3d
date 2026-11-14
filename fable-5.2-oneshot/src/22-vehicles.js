/* 车轿：辐条车轮、席篷牛车、平板大车、独轮车、轿子，以及成队行进的编组 */
(function () {
  'use strict';
  var Q = window.Q, M = Q.M, put = Q.put, C = Q.C, F = Q.F, A = Q.A;
  var V = Q.V = {};
  var WD = C(0x6a5238), WL = C(0x8a6c48), DK = C(0x3e3228), MAT = C(0xb89c68), G1 = [1, 1, 1];
  // 车轮：半径 1，轴沿 X；轮辋、辐条、毂
  function gWheel(nsp) {
    return function (b) {
      b.aux = 0;
      var n = 18, w = 0.07, ro = 1, ri = 0.86, i;
      function pt(r, a, x) { return [x, Math.cos(a) * r, Math.sin(a) * r]; }
      for (i = 0; i < n; i++) {
        var a0 = i / n * 6.2832, a1 = (i + 1) / n * 6.2832, c = i % 2 ? WD : Q.shade(WD, 0.9);
        b.quad('plain', pt(ro, a0, -w), pt(ro, a0, w), pt(ro, a1, w), pt(ro, a1, -w), DK);
        b.quad('plain', pt(ri, a0, w), pt(ri, a0, -w), pt(ri, a1, -w), pt(ri, a1, w), c);
        b.quad('plain', pt(ri, a0, w), pt(ri, a1, w), pt(ro, a1, w), pt(ro, a0, w), c);
        b.quad('plain', pt(ri, a1, -w), pt(ri, a0, -w), pt(ro, a0, -w), pt(ro, a1, -w), c);
      }
      for (i = 0; i < nsp; i++) { var a = i / nsp * 6.2832; b.beam('plain', pt(0.14, a, 0), pt(ri + 0.01, a, 0), 0.07, 0.05, WL); }
      b.cyl('plain', [-0.2, 0, 0], [0.2, 0, 0], 0.16, 0.13, 8, DK, true, true);
      b.cyl('plain', [0.2, 0, 0], [0.3, 0, 0], 0.06, 0.05, 6, C(0x2a2420), false, true);
    };
  }
  function arch(b, mat, z0, z1, rx, ry, y0, col, n, skirt) {
    var rings = [], k, j;
    for (k = 0; k < 2; k++) { var ring = []; if (skirt) ring.push([-rx, y0 - skirt, k ? z1 : z0]); for (j = 0; j <= n; j++) { var a = j / n * Math.PI; ring.push([-Math.cos(a) * rx, y0 + Math.sin(a) * ry, k ? z1 : z0]); } if (skirt) ring.push([rx, y0 - skirt, k ? z1 : z0]); rings.push(ring); }
    b.loft('plain', rings, { closed: false, col: col });
  }
  var bodies = {
    // 席篷牛车（棕盖大车）：车厢 + 前后两段拱篷 + 双辕。原点在轴心正下方地面，朝 +Z
    oxCart: function (b) {
      b.aux = 0;
      b.box('plain', 0, 0.98, 0, 1.5, 0.12, 2.9, WL);
      for (var s = -1; s <= 1; s += 2) {
        b.beam('plain', [s * 0.62, 0.95, -1.5], [s * 0.5, 0.92, 3.9], 0.09, 0.1, WD, true);       // 辕
        b.box('plain', s * 0.74, 1.3, 0, 0.05, 0.6, 2.8, Q.shade(WL, 0.85));
        for (var k = -2; k <= 2; k++) b.beam('plain', [s * 0.77, 1.02, k * 0.6], [s * 0.77, 1.62, k * 0.6], 0.04, 0.05, DK);
        b.beam('plain', [s * 0.77, 1.62, -1.4], [s * 0.77, 1.62, 1.4], 0.04, 0.06, DK);
      }
      b.beam('plain', [-0.95, 0.9, 0], [0.95, 0.9, 0], 0.1, 0.1, DK, true);   // 轴
      b.aux = 1;
      arch(b, 'plain', -1.75, 1.2, 0.86, 0.82, 1.6, G1, 8, 0.12);
      arch(b, 'plain', 1.0, 2.0, 0.7, 0.62, 1.55, [0.9, 0.9, 0.9], 6, 0.1);
      arch(b, 'plain', -1.95, -1.6, 0.92, 0.9, 1.56, [0.86, 0.86, 0.86], 8, 0.14);
      b.aux = 0;
      b.quad('plain', [-0.72, 1.04, -1.5], [0.72, 1.04, -1.5], [0.6, 2.2, -1.5], [-0.6, 2.2, -1.5], C(0x7d8a8a));   // 后帘
      b.beam('plain', [-0.5, 0.95, 3.85], [0.5, 0.95, 3.85], 0.08, 0.08, WD, true);
    },
    // 平板大车（太平车）：敞厢装货
    flatCart: function (b) {
      b.aux = 0;
      b.box('plain', 0, 0.95, 0, 1.5, 0.12, 2.8, WL);
      for (var s = -1; s <= 1; s += 2) {
        b.beam('plain', [s * 0.62, 0.92, -1.4], [s * 0.5, 0.9, 3.6], 0.09, 0.1, WD, true);
        for (var k = -2; k <= 2; k++) b.beam('plain', [s * 0.75, 1.0, k * 0.6], [s * 0.82, 1.55, k * 0.6], 0.05, 0.05, DK);
        b.beam('plain', [s * 0.82, 1.55, -1.3], [s * 0.82, 1.55, 1.3], 0.05, 0.06, DK);
        b.beam('plain', [s * 0.79, 1.28, -1.3], [s * 0.79, 1.28, 1.3], 0.04, 0.05, DK);
      }
      b.beam('plain', [-0.95, 0.9, 0], [0.95, 0.9, 0], 0.1, 0.1, DK, true);
      b.aux = 1;
      b.ball('plain', 0, 1.5, -0.3, 0.66, 0.5, 1.1, 7, 4, G1);
      b.ball('plain', 0.1, 1.42, 0.75, 0.55, 0.4, 0.5, 6, 3, [0.88, 0.88, 0.88]);
      b.aux = 0;
      for (var q = -1; q <= 1; q++) b.tube('plain', [[-0.7, 1.05, q * 0.7], [-0.4, 1.9, q * 0.7], [0.4, 1.9, q * 0.7], [0.7, 1.05, q * 0.7]], 0.02, 4, C(0x4a3a2c));
    },
    // 独轮车（串车）：中间一个大轮，两侧架货，后有扶把，前有拉杆
    barrow: function (b) {
      b.aux = 0;
      for (var s = -1; s <= 1; s += 2) {
        b.beam('plain', [s * 0.22, 0.78, -1.7], [s * 0.2, 0.72, 1.5], 0.06, 0.07, WD, true);
        b.beam('plain', [s * 0.22, 0.78, -0.9], [s * 0.6, 0.6, -0.9], 0.05, 0.05, WD); b.beam('plain', [s * 0.22, 0.78, 0.9], [s * 0.6, 0.6, 0.9], 0.05, 0.05, WD);
        b.beam('plain', [s * 0.6, 0.6, -0.95], [s * 0.6, 0.6, 0.95], 0.05, 0.05, WD);
        b.beam('plain', [s * 0.22, 0.75, -0.6], [s * 0.22, 1.45, -0.5], 0.04, 0.04, DK); b.beam('plain', [s * 0.22, 0.75, 0.6], [s * 0.22, 1.45, 0.5], 0.04, 0.04, DK);
        b.beam('plain', [s * 0.22, 1.45, -0.5], [s * 0.22, 1.45, 0.5], 0.04, 0.04, DK);
        b.beam('plain', [s * 0.5, 0, -1.25], [s * 0.3, 0.75, -1.2], 0.04, 0.04, DK);    // 后撑脚
        b.aux = 1; b.ball('plain', s * 0.52, 1.0, 0, 0.28, 0.42, 0.85, 7, 4, G1); b.aux = 0;
      }
      b.aux = 1; b.ball('plain', 0, 1.55, 0, 0.5, 0.24, 0.8, 7, 3, [0.9, 0.9, 0.9]); b.aux = 0;
      b.beam('plain', [-0.3, 0.62, 0], [0.3, 0.62, 0], 0.07, 0.07, DK, true);
    },
    // 轿子：四柱方厢、格子窗、盝顶，两根长轿杆
    sedan: function (b) {
      b.aux = 0;
      var w = 0.44, d = 0.48, y0 = 0.42, y1 = 1.82;
      for (var sx = -1; sx <= 1; sx += 2) for (var sz = -1; sz <= 1; sz += 2) b.beam('plain', [sx * w, y0, sz * d], [sx * w, y1, sz * d], 0.06, 0.06, DK, true);
      b.box('plain', 0, y0 + 0.03, 0, w * 2 + 0.08, 0.06, d * 2 + 0.08, WD);
      b.aux = 1;
      var lower = [0.82, 0.82, 0.82];
      for (sx = -1; sx <= 1; sx += 2) { b.quad('plain', [sx * w, y0, -d], [sx * w, y0, d], [sx * w, y0 + 0.62, d], [sx * w, y0 + 0.62, -d], lower); }
      b.quad('plain', [-w, y0, -d], [w, y0, -d], [w, y1, -d], [-w, y1, -d], lower);
      b.quad('plain', [-w, y0, d], [w, y0, d], [w, y0 + 0.5, d], [-w, y0 + 0.5, d], lower);
      b.aux = 0;
      // 格子窗
      var lc = C(0x3e3228);
      for (sx = -1; sx <= 1; sx += 2) {
        b.quad('plain', [sx * w, y0 + 0.62, -d], [sx * w, y0 + 0.62, d], [sx * w, y1, d], [sx * w, y1, -d], C(0xd8cba8));
        for (var k = 1; k < 6; k++) b.beam('plain', [sx * (w + 0.01), y0 + 0.62, -d + k * d / 3], [sx * (w + 0.01), y1, -d + k * d / 3], 0.02, 0.025, lc);
        for (k = 1; k < 5; k++) b.beam('plain', [sx * (w + 0.01), y0 + 0.62 + k * 0.155, -d], [sx * (w + 0.01), y0 + 0.62 + k * 0.155, d], 0.02, 0.025, lc);
        b.beam('plain', [sx * (w + 0.1), 1.02, -2.0], [sx * (w + 0.1), 1.02, 2.0], 0.055, 0.065, WD, true);     // 轿杆
      }
      // 门帘
      b.aux = 1; b.quad('plain', [-w * 0.8, y0 + 0.5, d + 0.01], [w * 0.8, y0 + 0.5, d + 0.01], [w * 0.8, y1 - 0.05, d + 0.01], [-w * 0.8, y1 - 0.05, d + 0.01], G1); b.aux = 0;
      // 轿顶
      var e = 0.14;
      b.loft('plain', [[[-w - e, y1, d + e], [w + e, y1, d + e], [w + e, y1, -d - e], [-w - e, y1, -d - e]], [[-w * 0.55, y1 + 0.24, d * 0.55], [w * 0.55, y1 + 0.24, d * 0.55], [w * 0.55, y1 + 0.24, -d * 0.55], [-w * 0.55, y1 + 0.24, -d * 0.55]]], { flat: true, col: C(0x4e443a) });
      b.quad('plain', [-w * 0.55, y1 + 0.24, d * 0.55], [w * 0.55, y1 + 0.24, d * 0.55], [w * 0.55, y1 + 0.24, -d * 0.55], [-w * 0.55, y1 + 0.24, -d * 0.55], C(0x5a5046));
      b.ball('plain', 0, y1 + 0.3, 0, 0.07, 0.08, 0.07, 6, 3, C(0x8a6a40));
      b.box('plain', 0, y1 - 0.02, 0, w * 2 + e * 2, 0.05, d * 2 + e * 2, DK);
    },
    // 轿上插的柳枝（清明扫墓归来）
    sedanWillow: function (b) {
      b.aux = 0; var g = C(0x7f8356);
      for (var i = 0; i < 16; i++) { var a = i / 16 * 6.283, r = 0.5 + (i % 3) * 0.1; b.tube('plain', [[Math.cos(a) * 0.3, 1.85, Math.sin(a) * 0.3], [Math.cos(a) * r, 2.3, Math.sin(a) * r], [Math.cos(a) * (r + 0.25), 1.95, Math.sin(a) * (r + 0.25)]], 0.012, 3, g); }
    }
  };
  var P = {};
  function pool(name) { if (!P[name]) P[name] = name === 'wheel' ? Q.pool('v_wheel', gWheel(14)) : Q.pool('v_' + name, bodies[name]); return P[name]; }
  var R = M.make(), T1 = M.make(), po = {};
  /* 车。o: {type, path,s0,speed,dir,lat | x,z,yaw}, col, wheelR */
  V.vehicle = function (o) {
    var e = { type: o.type, body: pool(o.type), path: o.path || null, s0: o.s0 || 0, speed: o.speed || 0, dir: o.dir || 1, lat: o.lat || 0, x: o.x || 0, z: o.z || 0, y: o.y || 0, yaw: o.yaw || 0,
      col: o.col || Q.jit(Q.pick([MAT, C(0xa88e60), C(0xc4ac7a)]), 0.08), extra: o.extra ? pool(o.extra) : null };
    e.body.need++; if (e.extra) e.extra.need++;
    var cfg = { oxCart: { r: 0.9, tw: 0.92, n: 2 }, flatCart: { r: 0.9, tw: 0.92, n: 2 }, barrow: { r: 0.62, tw: 0, n: 1 }, sedan: { n: 0 } }[o.type];
    e.cfg = cfg; if (cfg.n) { e.wheel = pool('wheel'); e.wheel.need += cfg.n; }
    e.draw = function (t, x0, x1) {
      var d = 0;
      if (e.path) {
        var L = e.path.len; d = (e.s0 + e.speed * t) % L; e.path.at(d, e.lat, e.dir, po);
        if (po.x < x0 - 4 || po.x > x1 + 4) return false;
        var f = d < 2 ? d / 2 : (L - d < 2 ? (L - d) / 2 : 1);
        M.pose(R, po.x, po.y, po.z, po.yaw, 0.25 + 0.75 * f);
      } else { if (e.x < x0 - 4 || e.x > x1 + 4) return false; M.pose(R, e.x, e.y, e.z, e.yaw, 1); }
      var wob = e.speed ? Math.sin(t * 5 + e.s0) * 0.012 : 0;
      if (e.type === 'sedan') { M.tr(T1, R, 0, 0.36 + (e.speed ? Math.abs(Math.sin(t * e.speed * 2.5 + e.s0)) * 0.03 : -0.36), 0); M.rz(T1, T1, wob * 1.5); put(e.body, T1, e.col); if (e.extra) put(e.extra, T1, e.col); return true; }
      M.rz(T1, R, wob); put(e.body, T1, e.col);
      for (var i = 0; i < cfg.n; i++) {
        M.tr(T1, R, cfg.n === 1 ? 0 : (i ? -cfg.tw : cfg.tw), cfg.r, 0); M.rx(T1, T1, d / cfg.r + i); if (i) M.ry(T1, T1, Math.PI); M.sc(T1, T1, cfg.r);
        put(e.wheel, T1, G1);
      }
      return true;
    };
    V.count = (V.count || 0) + 1;
    Q.addEnt(e); return e;
  };
  // ---------- 编组 ----------
  // 牛车：两头牛一前一后拉车，车把式持鞭走在旁边
  V.oxCartTrain = function (path, s0, dir, o) {
    o = o || {}; var sp = o.speed || 0.55, lat = o.lat || 0, ty = o.type || 'oxCart', an = o.animal || 'ox';
    V.vehicle({ type: ty, path: path, s0: s0, speed: sp, dir: dir, lat: lat });
    A.animal({ kind: an, path: path, s0: s0 + 2.75, speed: sp, dir: dir, lat: lat, load: 'yoke', headLow: 0.15 });
    if (o.n !== 1) A.animal({ kind: an, path: path, s0: s0 + 5.0, speed: sp, dir: dir, lat: lat + (o.abreast ? 0 : 0.1), headLow: 0.2 });
    if (o.n === 3) A.animal({ kind: an, path: path, s0: s0 + 5.0, speed: sp, dir: dir, lat: lat + 0.9, headLow: 0.2 });
    F.person({ path: path, s0: s0 + 3.6, speed: sp, dir: dir, lat: lat + 1.2, look: 'labor', pose: 'walkWhip', prop: 'whip' });
    if (o.follow) F.person({ path: path, s0: s0 - 2.6, speed: sp, dir: dir, lat: lat - 0.4, look: 'labor', pose: 'walk' });
  };
  // 轿子：前后两名轿夫，旁边可随从
  V.sedanTrain = function (path, s0, dir, o) {
    o = o || {}; var sp = o.speed || 0.95, lat = o.lat || 0;
    V.vehicle({ type: 'sedan', path: path, s0: s0, speed: sp, dir: dir, lat: lat, col: o.col || Q.jit(Q.pick([C(0x8a7a5c), C(0x6e6a5a), C(0x9a8460)]), 0.08), extra: o.willow ? 'sedanWillow' : null });
    for (var k = -1; k <= 1; k += 2) for (var s = -1; s <= 1; s += 2) if (o.four || s < 0) F.person({ path: path, s0: s0 + k * 1.72, speed: sp, dir: dir, lat: lat + (o.four ? s * 0.3 : 0), look: 'labor', pose: 'carryPole', scale: 0.97 });
    var nf = o.followers || 0;
    for (var i = 0; i < nf; i++) F.person({ path: path, s0: s0 - 3.2 - i * 1.3 + (i % 2) * 0.4, speed: sp, dir: dir, lat: lat + (i % 2 ? 0.7 : -0.6), look: Q.pick(['labor', 'gentry', 'labor']), pose: Q.pick(['walk', 'walkCarry', 'walkBack']), prop: null });
  };
  // 独轮车：后推前拉（人或驴）
  V.barrowTrain = function (path, s0, dir, o) {
    o = o || {}; var sp = o.speed || 0.7, lat = o.lat || 0;
    V.vehicle({ type: 'barrow', path: path, s0: s0, speed: sp, dir: dir, lat: lat });
    F.person({ path: path, s0: s0 - 2.05, speed: sp, dir: dir, lat: lat, look: 'labor', pose: 'push' });
    if (o.donkey) { A.animal({ kind: 'donkey', path: path, s0: s0 + 2.5, speed: sp, dir: dir, lat: lat, headLow: 0.15 }); F.person({ path: path, s0: s0 + 3.4, speed: sp, dir: dir, lat: lat + 0.9, look: 'labor', pose: 'walkWhip', prop: 'whip' }); }
    else F.person({ path: path, s0: s0 + 1.9, speed: sp, dir: dir, lat: lat, look: 'labor', pose: 'pullShaft' });
  };
  // 驮队：n 头牲口鱼贯而行，脚夫随行
  V.packTrain = function (path, s0, dir, o) {
    o = o || {}; var sp = o.speed || 0.85, lat = o.lat || 0, n = o.n || 4, kind = o.kind || 'donkey', gap = o.gap || (kind === 'camel' ? 2.9 : 1.9);
    for (var i = 0; i < n; i++) A.animal({ kind: kind, path: path, s0: s0 - i * gap, speed: sp, dir: dir, lat: lat + Q.rand(-0.2, 0.2), load: o.load || 'pack', loadCol: o.loadCol });
    F.person({ path: path, s0: s0 + (o.lead === false ? -n * gap : 1.4), speed: sp, dir: dir, lat: lat + 0.3, look: o.leadLook || 'labor', pose: o.lead === false ? 'walkWhip' : 'walk', prop: o.lead === false ? 'whip' : null });
    if (o.tail) F.person({ path: path, s0: s0 - n * gap - 0.4, speed: sp, dir: dir, lat: lat - 0.4, look: 'labor', pose: 'walkWhip', prop: 'whip' });
  };
  // 骑驴/骑马的人，可带牵牲口的仆从
  V.rider = function (path, s0, dir, o) {
    o = o || {}; var sp = o.speed || 1.0, lat = o.lat || 0;
    A.animal({ kind: o.kind || 'donkey', path: path, s0: s0, speed: sp, dir: dir, lat: lat, load: 'saddle', loadCol: Q.pick([C(0x8a5a48), C(0x6a7a70), C(0x9a8460)]), rider: { look: o.look || Q.pick(['gentry', 'traveler', 'official']), pose: 'ride' } });
    if (o.groom !== false) F.person({ path: path, s0: s0 + 1.5, speed: sp, dir: dir, lat: lat + 0.45, look: 'labor', pose: 'walk' });
    if (o.porter) F.person({ path: path, s0: s0 - 1.8, speed: sp, dir: dir, lat: lat - 0.2, look: 'labor', pose: 'walkCarry', prop: Q.pick(['danzi', 'stickBundle']) });
  };
})();
