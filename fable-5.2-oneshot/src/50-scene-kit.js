/* 布景工具：底稿坐标换算、沿路排屋、占地登记、铺面陈设、茶座、泊船等，供各段布景共用 */
(function () {
  'use strict';
  var Q = window.Q, K = Q.K, W = Q.W, COL = Q.COL, F = Q.F, BT = Q.BT, C = Q.C;
  var S = Q.S = { nB: 0, nBoat: 0, log: [], claims: [] };
  S.P = function (ox, oy) { return [W.X(ox), W.Z(oy)]; };
  // ---- 路径裁段 ----
  S.sAt = function (path, x, z) {
    var p = path.p, bi = 0, bd = 1e9;
    for (var i = 0; i < p.length; i++) { var d = (p[i][0] - x) * (p[i][0] - x) + (p[i][1] - z) * (p[i][1] - z); if (d < bd) { bd = d; bi = i; } }
    return bi * path.step;
  };
  S.sub = function (path, a, b) {
    var i0 = Math.round(S.sAt(path, W.X(a[0]), W.Z(a[1])) / path.step), i1 = Math.round(S.sAt(path, W.X(b[0]), W.Z(b[1])) / path.step);
    var pts = path.p.slice(Math.min(i0, i1), Math.max(i0, i1) + 1); if (i0 > i1) pts.reverse();
    var P = Object.create(W.Path.prototype); P.step = path.step; P.p = pts; P.n = pts.length; P.len = (pts.length - 1) * path.step; return P;
  };
  // ---- 占地 ----
  var roadPts = [];
  Object.keys(W.roads).forEach(function (k) { if (k === 'main') return; var p = W.roads[k].p; for (var i = 0; i < p.length; i += 3) roadPts.push(p[i]); });
  S.roadD = function (x, z) {
    var best = 1e9;
    for (var i = 0; i < roadPts.length; i++) { var p = roadPts[i], dx = x - p[0]; if (dx > 40 || dx < -40) continue; var d = Math.hypot(dx, z - p[1]) - (p[2] || 2); if (d < best) best = d; }
    return best;
  };
  S.claim = function (x, z, r) { S.claims.push([x, z, r]); };
  S.claimRect = function (x, z, w, d, ry) {
    var lg = Math.max(w, d), sh = Math.min(w, d), n = Math.max(1, Math.ceil(lg / sh)), ax = w >= d ? [Math.cos(ry), -Math.sin(ry)] : [Math.sin(ry), Math.cos(ry)];
    for (var i = 0; i < n; i++) { var f = n === 1 ? 0 : (i / (n - 1) - 0.5) * (lg - sh); S.claims.push([x + ax[0] * f, z + ax[1] * f, sh * 0.5]); }
  };
  S.free = function (x, z, r, o) {
    o = o || {};
    if (W.waterD(x, z) < r + (o.bank === undefined ? 0.8 : o.bank)) return false;
    if (!o.road && S.roadD(x, z) < r * 0.85) return false;
    if (Math.abs(x - W.gate.x) < 12.5 + r) return false;
    var c = S.claims;
    for (var i = 0; i < c.length; i++) { var dx = x - c[i][0], dz = z - c[i][1], rr = r + c[i][2]; if (dx * dx + dz * dz < rr * rr) return false; }
    return true;
  };
  // ---- 房屋 ----
  S.house = function (b, o, inside) {
    b.setChunk(o.x);
    var info = K.house(b, o, inside || o.inside);
    S.claimRect(o.x, o.z, o.w + 0.6, o.d + 0.6, o.ry || 0); S.nB++;
    if (W.waterD(o.x, o.z) < 1) S.log.push('house in water ' + o.x.toFixed(0) + ',' + o.z.toFixed(0));
    return info;
  };
  var SIGNS = ['酒', '茶', '香', '药', '面', '肉', '布', '米', '纸', '灯', '伞', '果子', '熟食', '饮子', '汤饼', '生药', '书籍', '彩帛', '小酒', '新酒', '漆器', '针铺', '油', '盐'];
  var KEEP = ['stand', 'sleeves', 'talk', 'idleHold', 'stand', 'bow'];
  // 铺面里的陈设与人：柜台、货、掌柜、门口的顾客、幌子
  S.shopIn = function (ho, opt) {
    opt = opt || {};
    return function (b, info) {
      var w = ho.w, d = ho.d, y = info.base, i, p, kx = Q.rand(-w * 0.18, w * 0.18), yaw = b.yaw();
      b.push(0, y, 0, 0);
      if (opt.counter !== false) {
        K.table(b, kx, d / 2 - 0.9, 0, Math.min(2.6, w * 0.42), 0.7, 0.86);
        var g = opt.goods || Q.pick(['jar', 'basket', 'barrel', 'sack', 'jar', 'basket']);
        for (i = 0; i < 4; i++) {
          var gx = (i % 2 ? 1 : -1) * Q.rand(w * 0.26, w * 0.42), gz = d / 2 - Q.rand(0.5, 2.4);
          if (g === 'jar') K.jar(b, gx, gz, Q.rand(0.8, 1.2)); else if (g === 'barrel') K.barrel(b, gx, gz, 0.32, 0.7);
          else if (g === 'sack') { K.sack(b, gx, 0, gz, Q.rand(3)); K.sack(b, gx + 0.1, 0.24, gz, Q.rand(3)); }
          else K.basket(b, gx, 0, gz, 0.34, 0.4, null, Q.jit(Q.pick([C(0xb9a070), C(0x9a8a5a), C(0xc4a47a), C(0x8f8468)]), 0.1));
        }
        K.tableware(b, kx, 0.86, d / 2 - 0.9);
      }
      b.pop();
      if (opt.keeper !== false) { p = b.world(kx + Q.rand(-0.3, 0.3), y, d / 2 - 1.75); F.person({ x: p[0], y: p[1], z: p[2], yaw: yaw + Q.rand(-0.4, 0.4), look: Q.pick(['labor', 'gentry', 'labor', 'woman']), pose: Q.pick(KEEP), prop: null }); }
      if (Q.chance(opt.cust === undefined ? 0.55 : opt.cust)) { p = b.world(kx + Q.rand(-0.8, 0.8), 0, d / 2 + Q.rand(0.9, 1.5)); F.person({ x: p[0], y: 0, z: p[2], yaw: yaw + Math.PI + Q.rand(-0.4, 0.4), pose: Q.pick(['talk', 'point', 'sleeves', 'stand']) }); }
      var sg = opt.sign === undefined ? (Q.chance(0.5) ? Q.pick(SIGNS) : null) : opt.sign;
      if (sg) K.sign(b, sg, (Q.chance(0.5) ? 1 : -1) * (w / 2 - 0.4), y + 1.25, d / 2 + 0.75, 0, { size: 0.4 });
      if (opt.more) opt.more(b, info);
    };
  };
  // 沿路排屋：side=+1 在行进方向右侧
  S.rowAlong = function (b, path, s0, s1, side, o) {
    o = o || {};
    var s = s0, out = {}, n = 0;
    if (s1 > path.len) s1 = path.len;
    while (s < s1 - 3.6) {
      var w = Q.rand(o.wMin || 5.4, o.wMax || 8.6); if (s + w > s1) w = s1 - s;
      var d = Q.rand(o.dMin || 4.6, o.dMax || 6.2);
      path.at(s + w / 2, 0, 1, out);
      var lat = side * (out.hw + (o.gap === undefined ? 1.0 : o.gap) + d / 2);
      path.at(s + w / 2, lat, 1, out);
      var tx = Math.sin(out.yaw), tz = Math.cos(out.yaw), ry = side > 0 ? Math.atan2(tz, -tx) : Math.atan2(-tz, tx);
      if (S.free(out.x, out.z, Math.min(w, d) * 0.5, { bank: o.bank === undefined ? 2.2 : o.bank })) {
        var thatch = Q.chance(o.thatch || 0), two = !thatch && Q.chance(o.two || 0);
        var ho = { x: out.x, z: out.z, ry: ry, w: w - 0.5, d: d, h: Q.rand(2.7, 3.3), roof: thatch ? 'thatch' : 'tile',
          front: Q.pick(o.fronts || [['open'], ['valance'], ['shutter', 'open'], ['lattice', 'gate', 'lattice'], ['half', 'open'], ['open', 'lattice']]) };
        if (two) { ho.storeys = 2; ho.type = Q.chance(0.5) ? 'xieshan' : 'gable'; ho.h = 3.1; }
        else if (!thatch && Q.chance(o.awn === undefined ? 0.3 : o.awn)) ho.awning = { depth: Q.rand(1.4, 2.0), roof: Q.pick(['mat', 'mat', 'thatch']) };
        var f0 = ho.front[0], shop = f0 !== 'lattice' && !(o.plain);
        S.house(b, ho, shop ? S.shopIn(ho, o.shop) : null); n++;
      }
      s += w + Q.rand(0.15, 0.7);
    }
    return n;
  };
  // 路边小摊：桌、伞、摊主、偶有顾客
  S.stallAt = function (b, path, s, side, o) {
    o = o || {};
    var out = {}; path.at(s, 0, 1, out); path.at(s, side * (out.hw + (o.off === undefined ? -0.6 : o.off)), 1, out);
    var tx = Math.sin(out.yaw), tz = Math.cos(out.yaw), ry = side > 0 ? Math.atan2(tz, -tx) : Math.atan2(-tz, tx);
    S.stall(b, out.x, out.y, out.z, ry, o);
  };
  S.stall = function (b, x, y, z, ry, o) {
    o = o || {};
    b.setChunk(x); b.push(x, y, z, ry);
    K.stall(b, 0, 0, 0, { goods: o.goods });
    if (o.umb !== false) K.umbrella(b, Q.rand(-0.5, 0.5), -0.75, Q.rand(1.5, 1.9), Q.rand(2.5, 2.9));
    if (o.sign) K.sign(b, o.sign, 1.2, 0.2, -0.3, 0.3, { size: 0.36, post: true, clear: 0.8 });
    var p = b.world(Q.rand(-0.3, 0.3), 0, -0.85), q = b.world(Q.rand(-0.6, 0.6), 0, 1.15), yaw = b.yaw();
    b.pop();
    F.person({ x: p[0], y: p[1], z: p[2], yaw: yaw + Q.rand(-0.3, 0.3), look: Q.pick(['labor', 'labor', 'woman']), pose: Q.pick(o.sit ? ['squat'] : KEEP) });
    if (Q.chance(o.cust === undefined ? 0.6 : o.cust)) F.person({ x: q[0], y: q[1], z: q[2], yaw: yaw + Math.PI + Q.rand(-0.4, 0.4), pose: Q.pick(['talk', 'point', 'bend', 'sleeves']) });
  };
  // 茶座：nx×nz 张桌子，按概率坐人，外加一个端盘子的伙计
  S.tea = function (b, x, z, ry, nx, nz, p, o) {
    o = o || {};
    b.setChunk(x); b.push(x, o.y || 0, z, ry);
    var seats = [];
    for (var i = 0; i < nx; i++) for (var j = 0; j < nz; j++) seats = seats.concat(K.teaSet(b, (i - (nx - 1) / 2) * 2.5, (j - (nz - 1) / 2) * 2.5, Q.rand(-0.15, 0.15)));
    var w = b.world(Q.rand(-1, 1), 0, nz * 1.25 + 0.3), yaw = b.yaw();
    b.pop();
    F.sitters(seats, p === undefined ? 0.6 : p, o);
    if (o.waiter !== false) F.person({ x: w[0], y: w[1], z: w[2], yaw: yaw + Q.rand(2.5, 3.8), look: 'labor', pose: 'idleHold', prop: 'tray' });
  };
  // 一堆人原地活动
  S.man = function (x, z, yaw, look, pose, o) {
    o = o || {};
    return F.person({ x: x, y: o.y === undefined ? W.deckY(x, z) : o.y, z: z, yaw: yaw, look: look, pose: pose, prop: o.prop, propB: o.propB, seat: o.seat, scale: o.scale });
  };
  // 随机散布
  S.scatter = function (n, x0, x1, z0, z1, fn, r, o) {
    for (var i = 0, t = 0; i < n && t < n * 12; t++) {
      var x = Q.rand(x0, x1), z = Q.rand(z0, z1);
      if (!S.free(x, z, r || 0.8, o)) continue;
      fn(x, z); i++;
    }
  };
  // ---- 船 ----
  S.boat = function (ctx, o) {
    var bt = BT.make(ctx, o); S.nBoat++;
    if (W.waterD(o.x, o.z) > -o.beam * 0.4) S.log.push('boat aground ' + o.x.toFixed(0) + ',' + o.z.toFixed(0) + ' d=' + W.waterD(o.x, o.z).toFixed(1));
    return bt;
  };
  // 汴河主河段的岸线：返回靠岸泊位（中心点与船头朝向）
  S.berth = function (x, north, inset) {
    var pts = W.waters[0].pts, bi = 0, bd = 1e9, i;
    for (i = 0; i < pts.length; i++) { if (pts[i][0] > 126 || pts[i][1] < -30) continue; var d = Math.abs(pts[i][0] - x); if (d < bd) { bd = d; bi = i; } }
    var c = pts[bi], nx = pts[Math.min(pts.length - 1, bi + 2)], pv = pts[Math.max(0, bi - 2)];
    var z = c[1], st = north ? -0.25 : 0.25;
    for (i = 0; i < 200; i++) { if (W.waterD(x, z, 'river') > -inset) break; z += st; }
    return { x: x, z: z, yaw: Math.atan2(nx[0] - pv[0], nx[1] - pv[1]), cz: c[1] };
  };
  S.moor = function (ctx, x, north, o) {
    o = o || {};
    var beam = o.beam || 5.2, be = S.berth(x, north, beam / 2 + 0.7 + (o.out || 0));
    o.x = x; o.z = be.z; o.yaw = be.yaw + (o.flip ? Math.PI : 0) + (o.dyaw || 0); o.beam = beam; o.len = o.len || 21; o.kind = o.kind || 'cargo';
    if (o.mast === undefined) o.mast = o.kind === 'small' ? 'none' : 'down'; if (o.rock === undefined) o.rock = 0.6;
    return S.boat(ctx, o);
  };
  // 泊船上的闲散船工
  S.idleCrew = function (bt, n) {
    var poses = [['sitGround', 'roof'], ['stand', 'deck'], ['squat', 'deck'], ['talk', 'deck'], ['bend', 'deck'], ['sitGround', 'roof'], ['sleeves', 'deck']];
    for (var i = 0; i < n; i++) {
      var p = Q.pick(poses), roof = p[1] === 'roof';
      bt.crew(roof ? Q.rand(-0.3, 0.2) : Q.pick([Q.rand(0.5, 0.78), Q.rand(0.5, 0.78), -0.7]), Q.rand(-0.4, 0.4), Q.rand(6.3), Q.pick(['boatman', 'boatman', 'bare', 'labor']), p[0], { on: roof ? 'roof' : 'deck' });
    }
  };
  // 柳、枯树成行
  S.treesAlong = function (ctx, path, s0, s1, n, o) {
    o = o || {};
    var out = {};
    for (var i = 0; i < n; i++) {
      var s = s0 + (s1 - s0) * (i + Q.rand(0.1, 0.9)) / n, side = Q.chance(0.5) ? 1 : -1;
      path.at(s, 0, 1, out); path.at(s, side * (out.hw + Q.rand(o.near || 1.2, o.far || 4.5)), 1, out);
      if (!S.free(out.x, out.z, 0.7, { bank: 0.2 })) continue;
      ctx.b.setChunk(out.x);
      if (Q.chance(o.bare || 0)) K.bareTree(ctx.b, ctx.twigs, out.x, out.z, o.tree); else K.willow(ctx.b, ctx.twigs, out.x, out.z, o.tree);
      S.claim(out.x, out.z, 0.6);
    }
  };
  S.tree = function (ctx, x, z, bare, o) { ctx.b.setChunk(x); if (bare) K.bareTree(ctx.b, ctx.twigs, x, z, o); else K.willow(ctx.b, ctx.twigs, x, z, o); S.claim(x, z, 0.6); };
})();
