/* 牲口：驴、马、牛、骆驼、猪、狗。四足骨架：躯干、颈头、四条两段的腿、尾；另有鞍垫、驮包、炭篓等。面朝局部 +Z。 */
(function () {
  'use strict';
  var Q = window.Q, M = Q.M, put = Q.put, C = Q.C, F = Q.F;
  var A = Q.A = {};
  function ell(z, cy, rx, ry, n) { var r = []; for (var j = 0; j < n; j++) { var a = (j + 0.5) / n * 6.2832; r.push([Math.sin(a) * rx, cy + Math.cos(a) * ry, z]); } return r; }
  var G1 = [1, 1, 1], HOOF = C(0x2a2420), DK = C(0x2a221c);
  /* 规格：len 身长, h 肩高, br 身粗, neck [长, 仰角], head [长, 俯角, 粗], ear, legR, mane, tail, horn, hump, snout */
  var SPEC = A.SPEC = {
    donkey: { len: 1.15, h: 0.95, br: 0.2, neck: [0.42, 0.95], head: [0.4, 0.75, 0.095], ear: 0.2, legR: 0.042, mane: 1, tail: 0.5, cols: [0x8a7c6c, 0x6e6258, 0x9a8a74, 0x5a5048] },
    horse: { len: 1.45, h: 1.2, br: 0.25, neck: [0.55, 0.95], head: [0.46, 0.85, 0.105], ear: 0.1, legR: 0.05, mane: 2, tail: 0.8, cols: [0x7a5a40, 0xd9cdb4, 0x5a4636, 0x9a7a56, 0x3e3632] },
    ox: { len: 1.65, h: 1.14, br: 0.34, neck: [0.42, 0.22], head: [0.46, 0.5, 0.15], ear: 0.14, legR: 0.062, tail: 0.7, horn: 1, cols: [0xa8906a, 0x8a7458, 0xb9a078, 0x6e5a48] },
    camel: { len: 1.8, h: 1.5, br: 0.33, neck: [0.9, 1.02], head: [0.46, 0.35, 0.11], ear: 0.07, legR: 0.062, tail: 0.5, hump: 1, cols: [0xb08e62, 0xa07e56] },
    pig: { len: 1.0, h: 0.52, br: 0.23, neck: [0.14, 0.05], head: [0.3, 0.2, 0.13], ear: 0.1, legR: 0.04, tail: 0.16, snout: 1, cols: [0x4a403a, 0x5a4e46, 0x3e3632] },
    dog: { len: 0.66, h: 0.46, br: 0.11, neck: [0.18, 0.7], head: [0.22, 0.4, 0.07], ear: 0.07, legR: 0.026, tail: 0.3, cols: [0x8a6a48, 0x4a403a, 0xc9b78e] }
  };
  Object.keys(SPEC).forEach(function (k) {
    var s = SPEC[k]; s.name = k; s.cols = s.cols.map(C);
    s.hj = s.h - s.br * 0.55;       // 腿根离地高
    s.lu = s.hj * 0.52; s.ll = s.hj * 0.48;
    s.by = s.h - s.br * 0.15;       // 躯干中心离地高（背线约在 h + 0.85br）
    s.by = s.hj + s.br * 0.4;
  });
  function gBody(s) {
    return function (b) {
      b.aux = 1;
      var L = s.len, r = s.br, n = 10, zs = [-0.5, -0.46, -0.36, -0.15, 0.1, 0.3, 0.43, 0.5], rw = [0.3, 0.72, 0.95, 1.0, 1.0, 0.92, 0.7, 0.35], rh = [0.35, 0.8, 1.0, 1.02, 1.05, 1.06, 0.85, 0.45], cy = [0.25, 0.1, 0.02, -0.03, -0.02, 0.0, 0.1, 0.22];
      var wide = s.name === 'ox' || s.name === 'pig' ? 1.0 : 0.82;
      var rings = zs.map(function (z, i) { return ell(z * L, cy[i] * r, rw[i] * r * wide, rh[i] * r, n); });
      b.loft('plain', rings, { cols: [[0.8, 0.8, 0.8], [0.9, 0.9, 0.9], G1, G1, G1, G1, [0.95, 0.95, 0.95], [0.9, 0.9, 0.9]], capA: true, capB: true });
      if (s.hump) { b.ball('plain', 0, r * 1.25, -L * 0.2, r * 0.52, r * 0.7, r * 0.62, 7, 4, [0.92, 0.92, 0.92]); b.ball('plain', 0, r * 1.2, L * 0.18, r * 0.5, r * 0.66, r * 0.6, 7, 4, [0.95, 0.95, 0.95]); }
      if (s.name === 'ox') b.ball('plain', 0, r * 0.95, L * 0.34, r * 0.5, r * 0.4, r * 0.55, 6, 3, [0.92, 0.92, 0.92]);
    };
  }
  function gHead(s) {
    return function (b) {
      b.aux = 1;
      var nl = s.neck[0], na = s.neck[1], hl = s.head[0], ha = s.head[1], hr = s.head[2], r = s.br;
      var nd = [0, Math.sin(na), Math.cos(na)], E = [0, nd[1] * nl, nd[2] * nl];
      var hd = [0, -Math.sin(ha), Math.cos(ha)];
      if (s.name === 'camel') b.tube('plain', [[0, -0.1, -0.1], [0, 0.05, 0.3], [0, nl * 0.5, 0.5], E], [r * 0.6, r * 0.42, r * 0.3, r * 0.27], 7, G1);
      else b.tube('plain', [[0, -r * 0.25, -r * 0.35], [0, E[1] * 0.45 - r * 0.05, E[2] * 0.5], E], [r * 0.9, r * 0.7, hr * 1.25], 8, G1);
      var pts = [[E[0], E[1] + hr * 0.3, E[2] - hr * 0.5]], rad = [hr * 0.9], fs = [0.3, 0.62, 0.9, 1.0], rr = [1.05, 0.82, 0.62, 0.5];
      for (var i = 0; i < 4; i++) { pts.push([0, E[1] + hd[1] * hl * fs[i], E[2] + hd[2] * hl * fs[i]]); rad.push(hr * rr[i] * (s.snout && i > 1 ? 1.25 : 1)); }
      b.tube('plain', pts, rad, 7, G1, [G1, G1, G1, [0.9, 0.9, 0.9], [0.72, 0.72, 0.72]]);
      var tip = pts[4]; b.fan('plain', Q.ringAt(tip, [1, 0, 0], [0, hd[2], -hd[1]], rad[4], 7), [0.6, 0.6, 0.6], false);
      b.aux = 0;
      // 眼、耳、鬃、角
      var ey = pts[1];
      for (var sd = -1; sd <= 1; sd += 2) {
        b.box('plain', sd * hr * 0.92, ey[1] + hr * 0.25, ey[2] + hr * 0.2, 0.02, 0.03, 0.04, DK);
        b.aux = 1;
        if (s.name === 'pig') b.tri('plain', [sd * hr * 0.5, E[1] + hr * 0.9, E[2]], [sd * hr * 1.1, E[1] + hr * 0.7, E[2] + 0.02], [sd * hr * 0.9, E[1] + hr * 0.1, E[2] + s.ear], [0.8, 0.8, 0.8]);
        else b.cyl('plain', [sd * hr * 0.55, E[1] + hr * 0.75, E[2] - hr * 0.2], [sd * hr * (s.name === 'ox' ? 2.0 : 0.85), E[1] + hr * 0.75 + s.ear * (s.name === 'ox' ? 0.2 : 1), E[2] - hr * 0.5], 0.035, 0.008, 4, [0.85, 0.85, 0.85]);
        b.aux = 0;
        if (s.horn) b.tube('plain', [[sd * hr * 0.5, E[1] + hr * 1.0, E[2] - hr * 0.1], [sd * hr * 1.9, E[1] + hr * 1.5, E[2]], [sd * hr * 2.0, E[1] + hr * 2.6, E[2] + hr * 0.5]], [0.04, 0.032, 0.008], 5, C(0x4a4038));
      }
      if (s.mane) { var mc = C(0x2e2620); b.quad('plain', [0, -r * 0.2 + r * 0.9, -r * 0.2], [0, E[1] + hr * 1.3, E[2] - hr * 0.6], [0, E[1] + hr * 1.3 + 0.07 * s.mane, E[2] - hr * 0.9], [0, r * 0.75 + 0.07 * s.mane, -r * 0.5], mc); b.box('plain', 0, E[1] + hr * 1.2, E[2] - hr * 0.2, 0.05, 0.06, 0.12, mc); }
      if (s.name === 'camel') { b.aux = 1; b.ball('plain', 0, E[1] * 0.25, 0.28, r * 0.3, r * 0.5, r * 0.3, 5, 3, [0.8, 0.8, 0.8]); b.aux = 0; }
      if (s.snout) b.box('plain', 0, tip[1], tip[2] + 0.012, 0.07, 0.03, 0.01, DK);
      else { b.box('plain', 0.03, tip[1] + 0.01, tip[2] + 0.008, 0.02, 0.02, 0.01, DK); b.box('plain', -0.03, tip[1] + 0.01, tip[2] + 0.008, 0.02, 0.02, 0.01, DK); }
    };
  }
  function gLegU(s) { return function (b) { b.aux = 1; var r = s.legR; b.loft('plain', [ell(0.04, 0, r * 1.5, r * 2.0, 6).map(sw), ell(-s.lu * 0.45, 0, r * 1.35, r * 1.6, 6).map(sw), ell(-s.lu, 0, r * 1.0, r * 1.05, 6).map(sw)], { col: [0.95, 0.95, 0.95] }); }; }
  function gLegL(s) {
    return function (b) {
      b.aux = 1; var r = s.legR;
      b.loft('plain', [ell(0, 0, r * 1.05, r * 1.1, 6).map(sw), ell(-s.ll * 0.82, 0, r * 0.8, r * 0.85, 6).map(sw)], { col: [0.88, 0.88, 0.88] });
      b.aux = 0; b.loft('plain', [ell(-s.ll * 0.8, 0, r * 0.95, r * 1.0, 6).map(sw), ell(-s.ll, 0, r * 1.25, r * 1.35, 6).map(function (p) { p = sw(p); p[2] += r * 0.3; return p; })], { col: HOOF, capB: true });
    };
  }
  function sw(p) { return [p[0], p[2], p[1]]; }   // ell 给的是 XY 圈（z 为轴）→ 换成水平圈（y 为轴）
  function gTail(s) {
    return function (b) {
      var L = s.tail;
      if (s.name === 'horse') { b.aux = 0; b.tube('plain', [[0, 0, 0], [0, -L * 0.3, -L * 0.25], [0, -L, -L * 0.3]], [0.035, 0.07, 0.02], 5, C(0x2e2620)); }
      else if (s.name === 'pig' || s.name === 'dog') { b.aux = 1; b.tube('plain', [[0, 0, 0], [0, L * 0.5, -L * 0.5], [0, L * 0.9, -L * 0.3]], [0.022, 0.016, 0.006], 4, G1); }
      else { b.aux = 1; b.tube('plain', [[0, 0, 0], [0, -L * 0.5, -L * 0.15], [0, -L * 0.85, -L * 0.12]], [0.025, 0.016, 0.012], 4, G1); b.aux = 0; b.ball('plain', 0, -L * 0.95, -L * 0.12, 0.03, 0.09, 0.03, 5, 3, C(0x2e2620)); }
    };
  }
  // 负载
  var loads = {
    saddle: function (b) { // 鞍垫与鞍
      b.aux = 1; var n = 6, rings = [];
      for (var i = 0; i <= 1; i++) { var ring = []; for (var j = 0; j <= n; j++) { var a = (j / n - 0.5) * 2.6; ring.push([Math.sin(a) * 1.08, Math.cos(a) * 1.08 - 0.02, (i - 0.5) * 2.4]); } rings.push(ring); }
      b.loft('plain', rings, { closed: false, col: G1 });
      b.aux = 0; b.box('plain', 0, 1.14, -0.45, 0.9, 0.3, 0.14, C(0x4a3a2c)); b.box('plain', 0, 1.14, 0.5, 0.8, 0.26, 0.12, C(0x4a3a2c)); b.box('plain', 0, 1.08, 0, 0.8, 0.1, 0.9, C(0x6a5238));
    },
    pack: function (b) { // 驮包：两侧各一大包，背上横一卷
      b.aux = 0; b.box('plain', 0, 1.0, 0, 2.3, 0.1, 1.6, C(0x6a5a48));
      b.aux = 1; for (var s = -1; s <= 1; s += 2) b.ball('plain', s * 1.35, 0.35, 0, 0.75, 1.0, 1.25, 7, 4, G1);
      b.ball('plain', 0, 1.3, 0, 1.2, 0.5, 0.9, 7, 4, [0.9, 0.9, 0.9]);
      b.aux = 0; for (s = -1; s <= 1; s += 2) { b.beam('plain', [-1.9, 0.5, s * 0.5], [0, 1.6, s * 0.5], 0.05, 0.05, C(0x4a3a2c)); b.beam('plain', [1.9, 0.5, s * 0.5], [0, 1.6, s * 0.5], 0.05, 0.05, C(0x4a3a2c)); }
    },
    charcoal: function (b) { // 炭篓
      b.aux = 0; b.box('plain', 0, 1.0, 0, 2.2, 0.1, 1.4, C(0x6a5a48));
      for (var s = -1; s <= 1; s += 2) { b.cyl('plain', [s * 1.4, -0.5, 0], [s * 1.45, 1.1, 0], 0.55, 0.75, 7, C(0x8a7450), true); b.ball('plain', s * 1.45, 1.1, 0, 0.7, 0.45, 0.7, 7, 3, C(0x2e2a28)); }
      b.ball('plain', 0, 1.5, 0, 0.9, 0.45, 0.8, 7, 3, C(0x353030));
    },
    camelLoad: function (b) {
      b.aux = 0; b.box('plain', 0, 1.3, 0, 2.0, 0.12, 1.8, C(0x6a5a48));
      b.aux = 1; for (var s = -1; s <= 1; s += 2) { b.box('plain', s * 1.25, 0.6, 0, 0.75, 1.3, 1.9, G1); b.aux = 0; b.box('plain', s * 1.64, 0.6, 0, 0.03, 1.3, 0.08, C(0x4a3a2c)); b.aux = 1; }
      b.ball('plain', 0, 1.7, 0, 0.9, 0.4, 1.0, 6, 3, [0.9, 0.9, 0.9]);
    },
    yoke: function (b) { b.aux = 0; b.tube('plain', [[-1.5, 0.6, 0], [-0.7, 1.15, 0], [0.7, 1.15, 0], [1.5, 0.6, 0]], 0.14, 5, C(0x5a4630)); }
  };
  function sp(kind) {
    var s = SPEC[kind];
    if (!s.P) s.P = { body: Q.pool('a_' + kind + '_body', gBody(s)), head: Q.pool('a_' + kind + '_head', gHead(s)), legU: Q.pool('a_' + kind + '_legU', gLegU(s)), legL: Q.pool('a_' + kind + '_legL', gLegL(s)), tail: Q.pool('a_' + kind + '_tail', gTail(s)) };
    return s;
  }
  var R = M.make(), B = M.make(), T1 = M.make(), T2 = M.make(), po = {};
  var PH = [0, Math.PI, Math.PI * 0.5, Math.PI * 1.5]; // 左前、右前、左后、右后
  /* o: {kind, x,z,yaw | path,s0,speed,lat,dir}, mode:'walk'|'stand'|'graze'|'lie', load, loadCol, rider:{look,pose,prop}, col, scale, headLow */
  A.animal = function (o) {
    var s = sp(o.kind);
    var e = { s: s, kind: o.kind, x: o.x || 0, y: o.y || 0, z: o.z || 0, yaw: o.yaw || 0, path: o.path || null, s0: o.s0 || 0, speed: o.speed || 0, lat: o.lat || 0, dir: o.dir || 1,
      mode: o.mode || (o.path ? 'walk' : 'stand'), col: o.col || Q.jit(Q.pick(s.cols), 0.08), sc: o.scale || Q.rand(0.94, 1.05), ph: Q.rand(100), headLow: o.headLow || 0, m: M.make(), parent: o.parent || null };
    e.cad = (e.speed || 1) / (s.hj * 0.95) * Math.PI * 0.85;
    s.P.body.need++; s.P.head.need++; s.P.legU.need += 4; s.P.legL.need += 4; s.P.tail.need++;
    if (o.load) { e.load = Q.pool('l_' + o.load, loads[o.load]); e.load.need++; e.loadCol = o.loadCol || Q.jit(Q.pick([C(0xc9b78e), C(0xb9a070), C(0x9a8a6a), C(0xd8c8a2)]), 0.1); }
    if (o.rider) { var r = o.rider; e.rider = F.person({ look: r.look || 'traveler', pose: r.pose || 'ride', prop: r.prop, propB: r.propB, noEnt: true }); }
    e.draw = drawAnimal;
    A.count = (A.count || 0) + 1;
    Q.addEnt(e);
    return e;
  };
  function drawAnimal(t, x0, x1) {
    var e = this, s = e.s, sc = e.sc, P = s.P;
    if (e.path) {
      var L = e.path.len, d = (e.s0 + e.speed * t) % L;
      e.path.at(d, e.lat, e.dir, po);
      if (po.x < x0 - 3 || po.x > x1 + 3) return false;
      var f = d < 2 ? d / 2 : (L - d < 2 ? (L - d) / 2 : 1);
      M.pose(R, po.x, po.y, po.z, po.yaw, sc * (0.25 + 0.75 * f));
    } else if (e.parent) { M.pose(R, e.x, e.y, e.z, e.yaw, sc); M.mul(R, e.parent.m, R); }
    else { if (e.x < x0 - 3 || e.x > x1 + 3) return false; M.pose(R, e.x, e.y, e.z, e.yaw, sc); }
    var walk = e.mode === 'walk', lie = e.mode === 'lie', ph = t * e.cad + e.ph, tt = t + e.ph;
    var bob = walk ? Math.abs(Math.sin(ph * 2)) * 0.012 * s.h : 0;
    var by = lie ? s.br * 0.95 : s.by + bob;
    M.tr(B, R, 0, by, 0);
    if (walk) M.rz(B, B, Math.sin(ph) * 0.02); else if (lie) M.rz(B, B, 0.12);
    M.copy(e.m, B);
    put(P.body, B, e.col);
    // 颈头
    var hp = e.mode === 'graze' ? 0.9 + 0.1 * Math.sin(tt * 1.3) : lie ? 0.25 + 0.05 * Math.sin(tt * 0.7) : (walk ? 0.06 * Math.sin(ph * 2) : 0.05 * Math.sin(tt * 0.6) + Q.smooth(0.7, 1, Math.sin(tt * 0.23)) * 0.5) + e.headLow;
    M.tr(T1, B, 0, s.br * 0.35, s.len * 0.42); M.rx(T1, T1, hp); if (!walk) M.ry(T1, T1, 0.25 * Math.sin(tt * 0.31));
    put(P.head, T1, e.col);
    // 四腿
    var A0 = s.name === 'pig' || s.name === 'dog' ? 0.45 : 0.27;
    for (var i = 0; i < 4; i++) {
      var front = i < 2, sx = (i % 2 ? -1 : 1) * s.br * 0.5 * (s.name === 'ox' || s.name === 'pig' ? 1.15 : 0.95), lz = front ? s.len * 0.34 : -s.len * 0.36;
      var th, kn;
      if (walk) { var p = ph + PH[i]; th = A0 * Math.sin(p) + (front ? 0 : 0.16); kn = Math.max(0, Math.cos(p + 0.3)) * (front ? 0.9 : 0.7) + (front ? 0.04 : 0.36); }
      else if (lie) { th = 1.45; kn = 2.65; }
      else { th = front ? 0 : 0.18; kn = front ? 0.02 : 0.4; }
      M.tr(T1, B, sx, s.hj - s.by + (lie ? s.br * 0.3 : 0), lz);
      M.rx(T1, T1, -th); put(P.legU, T1, e.col);
      M.tr(T2, T1, 0, -s.lu, 0); M.rx(T2, T2, kn); put(P.legL, T2, e.col);
    }
    // 尾
    M.tr(T1, B, 0, s.br * 0.55, -s.len * 0.48); M.rz(T1, T1, Math.sin(tt * 2.1) * (walk ? 0.25 : 0.4) * Q.smooth(0.2, 0.9, Math.sin(tt * 0.5) + (walk ? 1 : 0)));
    put(P.tail, T1, e.col);
    if (e.load) { M.tr(T1, B, 0, s.br * 0.02, -s.len * 0.02); M.sc(T1, T1, s.br * 0.98); put(e.load, T1, e.loadCol); }
    if (e.rider) { M.tr(T1, B, 0, s.br * 1.0 - 0.46 * e.rider.look.s, -s.len * 0.06); M.sc(T1, T1, e.rider.look.s / sc); F.drawBody(e.rider, T1, t + e.ph); }
    return true;
  }
  A.loadPool = function (name) { return Q.pool('l_' + name, loads[name]); };
})();
