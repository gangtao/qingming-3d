/* 船：汴河漕船与客船——两头上翘的船身、拱形席篷、舵楼、大舵、可放倒的人字桅、橹；另有小划子。
   每条船一个 Group（自带合并网格），整体轻晃；船上的人以船矩阵为父。船头朝局部 +Z，y=0 为水线。 */
(function () {
  'use strict';
  var T = THREE, Q = window.Q, COL = Q.COL, M = Q.M, W = Q.W, K = Q.K, F = Q.F, C = Q.C, UVS = Q.UVS;
  var BT = Q.BT = { list: [] };
  function mk(o) {
    var L = o.len, B = o.beam, N = 16;
    var S = { L: L, B: B, N: N, fb: o.fb || 1.05, bowR: o.bowRise || 1.15, sternR: o.sternRise || 1.55 };
    S.sh = function (u) { return S.fb + (u > 0 ? S.bowR : S.sternR) * Math.pow(Math.abs(u), 2.5); };
    S.hb = function (u) { return B / 2 * (1 - 0.68 * Math.pow(Math.abs(u), 3.4)); };
    S.bot = function (u) { return -0.7 + (S.sh(u) - S.fb) * 0.78 + 0.45 * Math.pow(Math.abs(u), 3); };
    S.dk = function (u) { return S.sh(u) - 0.24; };
    S.z = function (u) { return u * L / 2; };
    return S;
  }
  var SEC = [[-1, 1], [-1.04, 0.62], [-0.93, 0.27], [-0.58, 0.05], [0, 0], [0.58, 0.05], [0.93, 0.27], [1.04, 0.62], [1, 1]];
  function hull(b, S, wood) {
    var N = S.N, lines = [], i, j;
    for (j = 0; j < SEC.length; j++) {
      var line = [];
      for (i = 0; i <= N; i++) { var u = -1 + 2 * i / N, hb = S.hb(u), bt = S.bot(u), sh = S.sh(u); line.push([SEC[j][0] * hb, bt + (sh - bt) * SEC[j][1], S.z(u)]); }
      lines.push(line);
    }
    var sh2 = [1, 0.9, 0.82, 0.7, 0.62, 0.7, 0.82, 0.9, 1].map(function (f) { return Q.shade(wood, f); });
    b.loft('wood', lines, { closed: false, cols: sh2 });
    // 首尾封板
    [0, N].forEach(function (ii) { b.fan('wood', lines.map(function (l) { return l[ii]; }), Q.shade(wood, 0.85), ii === 0); });
    // 护舷木、舷边
    var dk = Q.shade(COL.woodDark, 0.9);
    for (i = 0; i < N; i++) for (var s = -1; s <= 1; s += 2) {
      var a = lines[s < 0 ? 1 : 7][i], c = lines[s < 0 ? 1 : 7][i + 1], a2 = lines[s < 0 ? 0 : 8][i], c2 = lines[s < 0 ? 0 : 8][i + 1];
      b.beam('plain', [a[0] + s * 0.03, a[1], a[2]], [c[0] + s * 0.03, c[1], c[2]], 0.08, 0.14, dk);
      b.beam('plain', [a2[0], a2[1] + 0.04, a2[2]], [c2[0], c2[1] + 0.04, c2[2]], 0.14, 0.1, dk);
    }
    // 甲板
    for (i = 0; i < N; i++) {
      var u0 = -1 + 2 * i / N, u1 = -1 + 2 * (i + 1) / N, h0 = S.hb(u0) * 0.98, h1 = S.hb(u1) * 0.98;
      b.quad('wood', [-h0, S.dk(u0), S.z(u0)], [h0, S.dk(u0), S.z(u0)], [h1, S.dk(u1), S.z(u1)], [-h1, S.dk(u1), S.z(u1)], Q.shade(wood, 1.08));
    }
  }
  // 拱形席篷，覆盖 u∈[ua,ub]，半宽为船宽的 wf，侧壁高 wh，拱高 rise
  function awning(b, S, ua, ub, wf, wh, rise, o) {
    o = o || {};
    var n = Math.max(2, Math.round((ub - ua) * S.L / 2 / 1.4)), rings = [], i, j, mat = Q.jit(COL.mat, 0.08), wood = Q.shade(COL.wood, 0.9), dk = COL.woodDark;
    for (i = 0; i <= n; i++) {
      var u = ua + (ub - ua) * i / n, hw = S.hb(u) * wf, y = S.dk(u) + wh, z = S.z(u), ring = [];
      ring.push([-hw - 0.1, y - 0.12, z]);
      for (j = 0; j <= 8; j++) { var a = j / 8 * Math.PI; ring.push([-Math.cos(a) * (hw + 0.06), y + Math.sin(a) * rise, z]); }
      ring.push([hw + 0.1, y - 0.12, z]);
      rings.push(ring);
    }
    b.loft('mat', rings, { closed: false, col: mat });
    // 压篷的竹竿与绳
    [2, 5, 8].forEach(function (jj) { for (i = 0; i < n; i++) { var p = rings[i][jj], q = rings[i + 1][jj]; b.beam('plain', [p[0], p[1] + 0.04, p[2]], [q[0], q[1] + 0.04, q[2]], 0.05, 0.05, Q.shade(COL.thatchDark, 0.9)); } });
    for (i = 0; i <= n; i += 1) for (j = 1; j < 10; j++) { var p2 = rings[i][j], q2 = rings[i][j + 1]; if (j < 10) b.beam('plain', [p2[0], p2[1] + 0.02, p2[2]], [q2[0], q2[1] + 0.02, q2[2]], 0.035, 0.035, Q.shade(COL.rope, 0.9)); }
    // 两侧舱壁：板壁与格窗相间
    if (wh > 0.5) for (i = 0; i < n; i++) {
      var u0 = ua + (ub - ua) * i / n, u1 = ua + (ub - ua) * (i + 1) / n;
      for (var s = -1; s <= 1; s += 2) {
        var x0 = s * S.hb(u0) * wf, x1 = s * S.hb(u1) * wf, y0 = S.dk(u0), y1 = S.dk(u1), z0 = S.z(u0), z1 = S.z(u1);
        var kind = o.walls ? o.walls[i % o.walls.length] : (i % 2 ? 'lattice' : 'board');
        if (kind === 'open') { b.beam('wood', [x0, y0, z0], [x0, y0 + wh, z0], 0.1, 0.1, dk); continue; }
        b.quad('wood', [x0, y0, z0], [x1, y1, z1], [x1, y1 + wh * 0.42, z1], [x0, y0 + wh * 0.42, z0], wood);
        b.quad(kind === 'lattice' ? 'lattice' : 'wood', [x0, y0 + wh * 0.42, z0], [x1, y1 + wh * 0.42, z1], [x1, y1 + wh, z1], [x0, y0 + wh, z0], kind === 'lattice' ? COL.paper : Q.shade(wood, 0.92));
        b.beam('wood', [x0, y0, z0], [x0, y0 + wh, z0], 0.1, 0.1, dk);
        b.beam('wood', [x0 + s * 0.02, y0 + wh * 0.42, z0], [x1 + s * 0.02, y1 + wh * 0.42, z1], 0.05, 0.07, dk);
      }
    }
    // 前后山面
    [[ua, 0], [ub, n]].forEach(function (e) {
      var r = rings[e[1]], u = e[0], y = S.dk(u), hw = S.hb(u) * wf, z = S.z(u);
      if (wh > 0.5) {
        b.quad('wood', [-hw, y, z], [-hw * 0.38, y, z], [-hw * 0.38, y + wh, z], [-hw, y + wh, z], wood);
        b.quad('wood', [hw * 0.38, y, z], [hw, y, z], [hw, y + wh, z], [hw * 0.38, y + wh, z], wood);
        b.beam('wood', [-hw * 0.38, y, z], [-hw * 0.38, y + wh, z], 0.09, 0.09, dk); b.beam('wood', [hw * 0.38, y, z], [hw * 0.38, y + wh, z], 0.09, 0.09, dk);
      }
      b.fan('mat', r.slice(1, 10).concat([[0, y + wh, z]]).slice(0, 9), Q.shade(mat, 0.8), e[1] === 0);
    });
    return rings;
  }
  /* o: {x,z,yaw,len,beam, kind:'cargo'|'pass'|'small', mast:'up'|'down'|'none'|角度, rock, cabin:[ua,ub], cargo, yuloh:'stern'|'both', plank:[x,z] 跳板搭到岸上的点 } */
  BT.make = function (ctx, o) {
    var S = mk(o), b = new Q.Batch(), wood = o.wood || Q.jit(Q.C(0xa58a62), 0.07), dk = COL.woodDark;
    var L = S.L, small = o.kind === 'small';
    var boat = { S: S, o: o, m: M.make(), x: o.x, z: o.z, yaw: o.yaw, ph: Q.rand(100), rock: o.rock === undefined ? 1 : o.rock, parts: [] };
    var ropes = [];
    hull(b, S, wood);
    var ca = o.cabin || (small ? [-0.45, 0.25] : [-0.52, 0.42]);
    if (o.kind === 'cargo') {
      // 货船：低矮通长的席篷，篷上再压卷席
      var r = awning(b, S, ca[0], ca[1], 0.86, 0.55, 0.85, { walls: ['board'] });
      for (var q = 0; q < 3; q++) { var uu = ca[0] + (ca[1] - ca[0]) * (0.25 + q * 0.25); b.cyl('mat', [-S.hb(uu) * 0.5, S.dk(uu) + 1.52, S.z(uu)], [S.hb(uu) * 0.5, S.dk(uu) + 1.52, S.z(uu)], 0.22, 0.22, 7, Q.jit(COL.mat, 0.1), true, true); }
    } else if (small) {
      awning(b, S, ca[0], ca[1], 0.8, 0.35, 0.75, { walls: ['board'] });
    } else {
      // 客船：舱壁开窗，篷顶较高，舷侧留走道
      awning(b, S, ca[0], ca[1], 0.78, 1.25, 0.6, { walls: o.walls || ['lattice', 'board', 'lattice', 'open'] });
    }
    if (!small) {
      // 舵楼：船尾高起的小棚
      var u0 = -0.86, u1 = ca[0] - 0.02, y0 = S.dk(-0.7) + 0.5, hw = S.hb(-0.75) * 0.82, z0 = S.z(u0), z1 = S.z(u1);
      b.box('wood', 0, y0 - 0.25, (z0 + z1) / 2, hw * 2, 0.5, z1 - z0, Q.shade(wood, 0.95));
      [[-1, z0], [1, z0], [-1, z1], [1, z1]].forEach(function (p) { b.beam('wood', [p[0] * (hw - 0.08), y0, p[1]], [p[0] * (hw - 0.08), y0 + 1.75, p[1]], 0.09, 0.09, dk); });
      var mc = Q.jit(COL.mat, 0.08);
      b.quad('mat', [-hw - 0.25, y0 + 1.72, z0 - 0.3], [hw + 0.25, y0 + 1.72, z0 - 0.3], [hw + 0.25, y0 + 1.86, z1 + 0.3], [-hw - 0.25, y0 + 1.86, z1 + 0.3], mc);
      b.quad('plain', [-hw - 0.25, y0 + 1.68, z0 - 0.3], [hw + 0.25, y0 + 1.68, z0 - 0.3], [hw + 0.25, y0 + 1.82, z1 + 0.3], [-hw - 0.25, y0 + 1.82, z1 + 0.3], Q.shade(mc, 0.6));
      K.railing(b, [[-hw, y0, z1], [-hw, y0, z0], [hw, y0, z0], [hw, y0, z1]], 0.7, dk, { span: 1.2 });
      boat.helm = [0, y0, (z0 + z1) / 2];
      // 大舵：舵杆穿出船尾，下挂大舵叶；舵柄伸进舵楼
      var zs = S.z(-1) - 0.15, ys = S.sh(-1);
      b.cyl('wood', [0, -0.6, zs - 0.35], [0, ys + 1.3, zs + 0.1], 0.1, 0.1, 6, dk);
      b.quad('wood', [0, -1.0, zs - 0.2], [0, -1.0, zs - 0.2 - L * 0.11], [0, ys * 0.55, zs - 0.45 - L * 0.11], [0, ys * 0.7, zs - 0.25], Q.shade(wood, 0.8));
      b.quad('wood', [0, -1.0, zs - 0.2], [0, -0.9, zs + L * 0.035], [0, ys * 0.3, zs + L * 0.02], [0, ys * 0.7, zs - 0.25], Q.shade(wood, 0.75));
      for (var k = 0; k < 4; k++) b.beam('plain', [0.03, -0.7 + k * 0.5, zs - 0.2], [0.03, -0.75 + k * 0.52, zs - 0.3 - L * 0.11], 0.03, 0.06, dk);
      b.beam('wood', [0, ys + 1.2, zs + 0.1], [0.3, y0 + 1.0, z0 + 0.9], 0.07, 0.07, dk, true);
      // 船头：绞车、系缆桩、碇
      var ub = 0.72, yb = S.dk(ub), zb = S.z(ub);
      for (var s2 = -1; s2 <= 1; s2 += 2) { b.beam('wood', [s2 * 0.75, yb, zb], [s2 * 0.75, yb + 0.85, zb], 0.12, 0.12, dk, true); b.beam('wood', [s2 * S.hb(0.88) * 0.7, S.dk(0.88), S.z(0.88)], [s2 * S.hb(0.88) * 0.7, S.dk(0.88) + 0.6, S.z(0.88)], 0.14, 0.14, dk, true); }
      b.cyl('wood', [-0.85, yb + 0.6, zb], [0.85, yb + 0.6, zb], 0.16, 0.16, 7, Q.shade(wood, 0.8), true, true);
      for (k = 0; k < 4; k++) b.beam('plain', [0.95, yb + 0.6 - Math.cos(k * 0.785) * 0.45, zb - Math.sin(k * 0.785) * 0.45], [0.95, yb + 0.6 + Math.cos(k * 0.785) * 0.45, zb + Math.sin(k * 0.785) * 0.45], 0.04, 0.04, dk);
      b.box('plain', S.hb(0.95) * 0.5, S.sh(0.95) + 0.1, S.z(0.97), 0.35, 0.3, 0.9, Q.shade(COL.stone, 0.8));
      // 舷侧走道上的货、船头的绳堆
      b.cyl('plain', [-0.3, S.dk(0.6), S.z(0.6)], [-0.3, S.dk(0.6) + 0.16, S.z(0.6)], 0.42, 0.4, 8, COL.rope, false, true);
    }
    // 货物
    if (o.cargo) for (var g = 0; g < o.cargo; g++) { var ug = Q.rand(0.46, 0.62), xg = Q.rand(-1, 1) * S.hb(ug) * 0.6; b.push(0, 0, 0, 0); K.sack(b, xg, S.dk(ug) + (g % 3) * 0.22, S.z(ug) + Q.rand(-0.8, 0.8), Q.rand(3)); b.pop(); }
    // 人字桅
    var mast = o.mast === undefined ? 'none' : o.mast;
    if (mast !== 'none' && !small) {
      var um = 0.16, ym = S.dk(um), zm = S.z(um), H = o.mastH || L * 0.56, ang = mast === 'up' ? 0.03 : mast === 'down' ? 1.38 : mast;
      var top = [0, ym + 0.6 + Math.cos(ang) * H, zm - Math.sin(ang) * H], fx = S.hb(um) * 0.72;
      for (var s3 = -1; s3 <= 1; s3 += 2) {
        b.cyl('wood', [s3 * fx, ym, zm], [s3 * 0.12, top[1], top[2]], 0.11, 0.07, 6, Q.shade(wood, 0.85));
        b.box('wood', s3 * fx, ym + 0.35, zm, 0.3, 0.7, 0.4, dk);
      }
      for (var c = 1; c <= 3; c++) { var f = c / 4, wy = ym + (top[1] - ym) * f, wz = zm + (top[2] - zm) * f; b.beam('wood', [-fx * (1 - f) - 0.1, wy, wz], [fx * (1 - f) + 0.1, wy, wz], 0.07, 0.07, dk, true); }
      b.box('wood', 0, top[1] + 0.1, top[2], 0.5, 0.3, 0.2, dk);
      boat.mastTop = top;
      var rc = Q.shade(COL.rope, 0.85);
      if (ang < 0.5) {
        // 桅顶向四面牵出的缆索
        var targets = [];
        for (var e = 0; e < 5; e++) { var ue = 0.5 + e * 0.11; targets.push([(e % 2 ? 1 : -1) * S.hb(ue) * 0.8, S.sh(ue), S.z(ue)]); }
        for (e = 0; e < 5; e++) { var ue2 = -0.45 - e * 0.11; targets.push([(e % 2 ? 1 : -1) * S.hb(ue2) * 0.85, S.sh(ue2) + (e > 2 ? 1.6 : 0), S.z(ue2)]); }
        for (e = -1; e <= 1; e += 2) { targets.push([e * S.hb(0) * 0.98, S.sh(0), S.z(-0.1)], [e * S.hb(0.3) * 0.98, S.sh(0.3), S.z(0.36)]); }
        targets.forEach(function (p) { ropes.push(top, p); });
      } else {
        // 放倒时：桅身下垫支架，几根缆索松垂
        var cu = -0.45, cy = S.dk(cu) + 2.3;
        b.beam('wood', [-0.5, S.dk(cu), S.z(cu)], [0, cy, S.z(cu)], 0.09, 0.09, dk); b.beam('wood', [0.5, S.dk(cu), S.z(cu)], [0, cy, S.z(cu)], 0.09, 0.09, dk);
        ropes.push(top, [S.hb(0.6) * 0.8, S.sh(0.6), S.z(0.6)], top, [-S.hb(0.6) * 0.8, S.sh(0.6), S.z(0.6)], top, [0, S.sh(-0.9), S.z(-0.9)]);
      }
      boat.ropeCol = rc;
    }
    // 跳板
    if (o.plank) boat.plank = o.plank;
    // 组装
    var grp = new T.Group();
    grp.add(b.build());
    if (ropes.length) {
      var rl = new Q.Lines();
      for (var ri = 0; ri < ropes.length; ri += 2) {
        // 略带垂度
        var A = ropes[ri], Bp = ropes[ri + 1], prev = A;
        for (var sgi = 1; sgi <= 4; sgi++) { var ff = sgi / 4, sag = Math.sin(ff * Math.PI) * 0.25; var cur = [A[0] + (Bp[0] - A[0]) * ff, A[1] + (Bp[1] - A[1]) * ff - sag, A[2] + (Bp[2] - A[2]) * ff]; rl.seg(prev, cur, boat.ropeCol, boat.ropeCol); prev = cur; }
      }
      grp.add(rl.build(Q.mats.rope));
    }
    // 橹：单独的可动网格
    function yuloh(atStern) {
      var bb = new Q.Batch(), len = L * 0.55;
      bb.cyl('wood', [0, 0, -len * 0.36], [0, 0, len * 0.4], 0.06, 0.08, 6, Q.shade(wood, 0.85));
      bb.quad('wood', [-0.02, 0.16, len * 0.38], [-0.02, -0.16, len * 0.38], [-0.02, -0.22, len * 0.64], [-0.02, 0.22, len * 0.64], Q.shade(wood, 0.8));
      bb.quad('wood', [0.02, 0.16, len * 0.38], [0.02, 0.22, len * 0.64], [0.02, -0.22, len * 0.64], [0.02, -0.16, len * 0.38], Q.shade(wood, 0.7));
      var g = bb.build(); g.matrixAutoUpdate = true;
      var u = atStern ? -0.93 : 0.93;
      g.position.set(atStern ? 0.5 : -0.5, S.sh(u) + 0.25, S.z(u));
      g.userData = { stern: atStern, base: atStern ? Math.PI : 0 };
      g.children.forEach(function (ch) { ch.frustumCulled = false; });
      grp.add(g); boat.parts.push(g);
      // 橹架
      return g;
    }
    if (o.yuloh) { yuloh(true); if (o.yuloh === 'both') yuloh(false); }
    grp.matrixAutoUpdate = false;
    ctx.scene.add(grp); boat.grp = grp;
    boat.deckY = function (u) { return S.dk(u); };
    /* 在船上放人：u 沿船长 [-1,1]，x 横向(相对半宽的比例)，on:'deck'|'roof'|'helm' */
    boat.crew = function (u, xf, yawL, look, pose, opt) {
      opt = opt || {};
      var y = opt.on === 'roof' ? S.dk(u) + (o.kind === 'cargo' ? 1.3 : small ? 1.0 : 1.8) : opt.on === 'helm' && boat.helm ? boat.helm[1] : S.dk(u);
      var po = { parent: boat, x: xf * S.hb(u), y: y + (opt.dy || 0), z: S.z(u), yaw: yawL, look: look || 'boatman', pose: pose || 'stand', prop: opt.prop, sync: boat.ph, seat: opt.seat };
      return F.person(po);
    };
    boat.tick = function (t) {
      var a = boat.rock, g = boat.grp, p = boat.ph, drift = o.drift ? Math.sin(t * 0.21 + p) * o.drift : 0;
      g.position.set(boat.x + Math.sin(boat.yaw) * drift, W.WATER_Y + Math.sin(t * 0.9 + p) * 0.035 * a, boat.z + Math.cos(boat.yaw) * drift);
      g.rotation.set(Math.sin(t * 0.7 + p * 2) * 0.012 * a, boat.yaw, Math.sin(t * 0.83 + p) * 0.02 * a, 'YXZ');
      for (var i = 0; i < boat.parts.length; i++) {
        var y = boat.parts[i], ud = y.userData, sw = Math.sin(t * 1.4 + boat.ph);
        y.rotation.set(ud.stern ? -0.3 : 0.3, ud.base + sw * 0.2, sw * 0.5, 'YXZ');
      }
      g.updateMatrix(); g.matrixWorldNeedsUpdate = true;
      M.from4(boat.m, g.matrix.elements);
    };
    boat.tick(0);
    BT.list.push(boat);
    return boat;
  };
  // 船头搭到岸上的跳板（静态，世界坐标）
  BT.gangplank = function (b, boat, u, side, sx, sz) {
    var S = boat.S, c = Math.cos(boat.yaw), s = Math.sin(boat.yaw), lx = side * S.hb(u), lz = S.z(u);
    var wx = boat.x + lx * c + lz * s, wz = boat.z - lx * s + lz * c, wy = W.WATER_Y + S.sh(u) + 0.05;
    b.setChunk(wx);
    b.beam('wood', [wx, wy, wz], [sx, 0.12, sz], 0.5, 0.07, Q.shade(COL.wood, 0.9), true);
    var n = Math.round(Math.hypot(sx - wx, sz - wz) / 0.5);
    for (var i = 1; i < n; i++) { var f = i / n; b.box('plain', wx + (sx - wx) * f, wy + (0.12 - wy) * f + 0.05, wz + (sz - wz) * f, 0.5, 0.04, 0.06, COL.woodDark, { ry: boat.yaw }); }
  };
  Q.tickers.push(function (t) { var l = BT.list; for (var i = 0; i < l.length; i++) l[i].tick(t); });
})();
