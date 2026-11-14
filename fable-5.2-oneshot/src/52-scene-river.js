/* 中段·汴河虹桥：码头卸粮、北岸街市、纤夫拉船、摇橹的客船、放桅过桥的大船、虹桥上下的人潮、桥南脚店 */
(function () {
  'use strict';
  var T = THREE, Q = window.Q, K = Q.K, W = Q.W, COL = Q.COL, F = Q.F, A = Q.A, V = Q.V, S = Q.S, C = Q.C, P = S.P, BT = Q.BT;
  Q.scenes.push(function (ctx) {
    var b = ctx.b, tw = ctx.twigs, main = W.roads.main, p, i, bt, q;
    var pC = S.pC = S.sub(main, [4500, 146], [3180, 20]);       // 北岸街
    var pBr = S.pBr = S.sub(main, [3300, 6], [2700, 254]);      // 过桥
    var pD = S.pD = S.sub(main, [2900, 200], [1545, 182]);      // 桥南街至十字路口

    // ================= 码头卸粮 =================
    var c1 = S.boat(ctx, { x: 130, z: 15, yaw: 2.4, len: 22, beam: 5.4, kind: 'cargo', mast: 'down', cargo: 9, rock: 0.5 });
    var c2 = S.boat(ctx, { x: 139.4, z: 21.4, yaw: 2.4, len: 23, beam: 5.6, kind: 'cargo', mast: 'down', cargo: 7, rock: 0.5 });
    var c3 = S.boat(ctx, { x: 120, z: 13.2, yaw: 2.45, len: 21, beam: 5.2, kind: 'cargo', mast: 'down', cargo: 4, rock: 0.5 });
    BT.gangplank(b, c1, 0.8, -1, 139.4, 4.6); BT.gangplank(b, c2, 0.8, -1, 148, 11); BT.gangplank(b, c3, 0.8, -1, 129.4, 2.6);
    c1.crew(0.55, 0.2, 0.5, 'bare', 'bend'); c1.crew(0.62, -0.3, 2, 'labor', 'walkShoulder', { prop: 'sack' }); c1.crew(-0.72, 0, 0, 'boatman', 'stand', { on: 'helm' }); c1.crew(0, 0.2, 1, 'boatman', 'sitGround', { on: 'roof' });
    c2.crew(0.5, 0, 0.5, 'bare', 'bend'); c2.crew(0.66, 0.3, 1, 'boatman', 'point'); c2.crew(-0.1, -0.2, 2, 'boatman', 'sitGround', { on: 'roof' }); c2.crew(-0.74, 0, 3, 'boatman', 'sleeves', { on: 'helm' });
    c3.crew(0.6, 0, 2.5, 'boatman', 'squat'); c3.crew(0.1, 0, 4, 'boatman', 'sitGround', { on: 'roof' });
    var porter = W.makePathW([[139.5, 5.0, 1], [139.9, 2.4, 1], [139.2, -0.2, 1], [138.2, -2.2, 1]]);
    var porter2 = W.makePathW([[148.2, 10.6, 1], [146.8, 6, 1], [143.4, 1.4, 1], [140.2, -1.6, 1]]);
    var porter3 = W.makePathW([[129.5, 2.4, 1], [131.4, 0, 1], [134.6, -2, 1], [136.4, -3, 1]]);
    [porter, porter2, porter3].forEach(function (pp, k) {
      for (i = 0; i < 3 + k; i++) F.person({ path: pp, s0: i * pp.len / (3 + k) + Q.rand(0.5), speed: 0.75, lat: 0.3, dir: 1, look: Q.pick(['bare', 'labor']), pose: 'walkShoulder', prop: 'sack' });
      for (i = 0; i < 2; i++) F.person({ path: pp, s0: i * pp.len / 2 + Q.rand(0.5), speed: 0.9, lat: 0.3, dir: -1, look: Q.pick(['bare', 'labor']), pose: 'walk' });
    });
    b.setChunk(137);
    for (i = 0; i < 34; i++) { var lv = i < 16 ? 0 : i < 28 ? 1 : 2; K.sack(b, 137.4 + Q.rand(-1.8 + lv * 0.5, 1.8 - lv * 0.5), lv * 0.24, -4 + Q.rand(-1.2 + lv * 0.3, 1.2 - lv * 0.3), Q.rand(3)); }
    for (i = 0; i < 12; i++) K.sack(b, 133.6 + Q.rand(-1, 1), (i > 7) * 0.24, -5.6 + Q.rand(-0.8, 0.8), Q.rand(3));
    S.claim(137.4, -4, 2.6);
    S.man(137.2, -4, 0.9, 'gentry', 'sitTalk', { y: 0, seat: 0.66 });      // 坐在粮包上发筹的货主
    S.man(138.6, -1.6, 3.6, 'labor', 'point'); S.man(135.4, -2.6, 1.2, 'gentry', 'sleeves'); S.man(134.2, -4.2, 0.6, 'bare', 'bend');
    Q.label('漕船卸粮', 137.4, 3.2, -3);
    // ================= 河边酒食店 =================
    S.house(b, { x: 128, z: -6.4, ry: 0, w: 10.5, d: 5.6, front: ['open'], awning: { depth: 3.2, roof: 'mat' } }, function (bb, info) {
      bb.push(0, info.base, 0, 0); K.table(bb, 3, 0.5, 0, 2.4, 0.7, 0.85); K.jar(bb, -4, 1.2, 1.3); K.jar(bb, -4.4, 0.2, 1.1); K.jar(bb, -3.4, 0.4, 1); bb.pop();
      q = bb.world(3, info.base, -0.5); F.person({ x: q[0], y: q[1], z: q[2], yaw: 0, look: 'labor', pose: 'work' });
    });
    S.tea(b, 128, -1.4, 0, 3, 1, 0.8);
    K.flag(b, 134.6, -2.4, 0.3, { h: 6, text: '小酒' });
    // ================= 北岸大院落，河边并泊的船 =================
    S.house(b, { x: 100, z: -14, ry: 0, w: 12, d: 6, h: 3.3, type: 'xieshan', dougong: true, front: ['lattice', 'open', 'open', 'lattice'], awning: { depth: 2.2, roof: 'mat' } }, null);
    S.tea(b, 100, -9.4, 0, 3, 1, 0.7, { waiter: false });
    S.house(b, { x: 88, z: -14, ry: 0, w: 8, d: 5.6, front: ['half', 'open'] }, null);
    S.house(b, { x: 111.5, z: -12.5, ry: 0, w: 8, d: 5.4, front: ['shutter', 'open'], awning: { depth: 1.8 } }, null);
    K.fence(b, [[83, -9.6], [92.5, -9.2]], 1.0);
    bt = S.moor(ctx, 97, true, { len: 22, kind: 'cargo', cargo: 3 }); S.idleCrew(bt, 3);
    bt = S.moor(ctx, 105, true, { len: 23, kind: 'pass', out: 5.9, mast: 'down' }); S.idleCrew(bt, 3);
    bt = S.moor(ctx, 114, true, { len: 20, kind: 'cargo', out: 1.2 }); S.idleCrew(bt, 2);
    S.man(96, -8.6, 2.6, 'labor', 'squat'); S.man(103.4, -8.4, 3.4, 'gentry', 'sleeves'); S.man(104.4, -8.2, 2.8, 'gentry', 'talk');
    // ================= 纤夫拉船 =================
    var tow = S.boat(ctx, { x: 86, z: 6, yaw: -1.66, len: 24, beam: 5.8, kind: 'pass', mast: 'up', yuloh: 'stern', rock: 0.8, drift: 0.5 });
    tow.crew(-0.75, 0, 0, 'boatman', 'scull', { on: 'helm' }); tow.crew(0.72, 0.3, -0.3, 'boatman', 'punt', { prop: 'longPole' }); tow.crew(0.6, -0.4, 0.4, 'boatman', 'stand');
    tow.crew(0.1, 0, 0.2, 'boatman', 'point', { on: 'roof' }); tow.crew(-0.2, 0.2, 1, 'gentry', 'sitGround', { on: 'roof' });
    var trk = [];
    for (i = 0; i < 5; i++) { var tx = 62 - i * 1.7, be = S.berth(tx, true, 0); trk.push([tx, be.z - 1.5 - (i % 2) * 0.25]); S.man(tx, be.z - 1.5 - (i % 2) * 0.25, -1.45, i % 2 ? 'bare' : 'labor', 'haul'); S.claim(tx, be.z - 1.5, 1); }
    // 纤绳：自桅顶牵到岸上，随船晃动
    var NP = 16 + trk.length, rp = new Float32Array(NP * 3), rg = new T.BufferGeometry();
    rg.setAttribute('position', new T.BufferAttribute(rp, 3));
    var rope = new T.Line(rg, new T.LineBasicMaterial({ color: 0x5a4832 })); rope.frustumCulled = false; ctx.scene.add(rope);
    var mt = new T.Vector3();
    Q.tickers.push(function () {
      mt.set(tow.mastTop[0], tow.mastTop[1], tow.mastTop[2]).applyMatrix4(tow.grp.matrix);
      var e = trk[0], ey = 1.25, k;
      for (k = 0; k < 16; k++) { var f = k / 15; rp[k * 3] = mt.x + (e[0] - mt.x) * f; rp[k * 3 + 1] = mt.y + (ey - mt.y) * f - Math.sin(f * Math.PI) * 1.1; rp[k * 3 + 2] = mt.z + (e[1] - mt.z) * f; }
      for (k = 0; k < trk.length; k++) { rp[(16 + k) * 3] = trk[k][0]; rp[(16 + k) * 3 + 1] = 1.25; rp[(16 + k) * 3 + 2] = trk[k][1]; }
      rg.attributes.position.needsUpdate = true;
    });
    Q.label('纤夫拉船', 60, 3.2, trk[1][1] - 1);
    // ================= 临河楼阁与客船 =================
    S.house(b, { x: 47, z: -18.6, ry: 0, w: 10, d: 6.4, h: 3.2, storeys: 2, type: 'xieshan', dougong: true, front: ['open', 'lattice', 'open'], front2: ['open'] }, function (bb, info) {
      for (var k = 0; k < 4; k++) { q = bb.world(-3.4 + k * 2.2, info.floor2, 3.75); F.person({ x: q[0], y: q[1], z: q[2], yaw: Q.rand(-0.4, 0.4), look: Q.pick(['gentry', 'gentry', 'woman']), pose: Q.pick(['lean', 'point', 'sleeves']) }); }
    });
    S.house(b, { x: 36.6, z: -18.4, ry: 0, w: 8, d: 5.6, front: ['valance'], awning: { depth: 2 } }, null);
    bt = S.moor(ctx, 43, true, { len: 23, kind: 'pass', mast: 'down', yuloh: 'stern' });
    bt.crew(0.66, 0.2, 1.2, 'boatman', 'bend'); bt.crew(0.5, -0.3, 2, 'gentry', 'sleeves'); bt.crew(-0.74, 0, 2, 'boatman', 'stand', { on: 'helm' }); bt.crew(0.1, 0, 1.5, 'woman', 'sitGround', { on: 'roof' });
    BT.gangplank(b, bt, 0.5, -1, 37.5, bt.z - 5.4);
    // ================= 河心：八人摇大橹的船 =================
    bt = S.boat(ctx, { x: 49, z: 6.6, yaw: -1.5, len: 22, beam: 5.4, kind: 'pass', mast: 'down', yuloh: 'both', rock: 1, drift: 0.8 });
    for (i = 0; i < 6; i++) bt.crew(0.8 - (i >> 1) * 0.085, (i % 2 ? 0.34 : -0.34), i % 2 ? -1.2 : 1.2, Q.pick(['boatman', 'bare']), 'scull');
    bt.crew(-0.76, 0.2, 2.6, 'boatman', 'scull', { on: 'helm' }); bt.crew(-0.7, -0.3, 2.9, 'boatman', 'scull', { on: 'helm' }); bt.crew(0, 0, 0, 'boatman', 'wave', { on: 'roof' });
    // 南岸小船
    bt = S.moor(ctx, 46, false, { kind: 'small', len: 9, beam: 2.4, yuloh: 'stern' }); bt.crew(-0.7, 0, 0.4, 'boatman', 'squat');
    bt = S.moor(ctx, 57, false, { kind: 'small', len: 10, beam: 2.5 }); bt.crew(0.5, 0, 2, 'woman', 'bend');
    bt = S.moor(ctx, 69, false, { kind: 'cargo', len: 20, cargo: 2 }); S.idleCrew(bt, 2);
    bt = S.moor(ctx, 28, false, { kind: 'cargo', len: 21, beam: 5.2 }); S.idleCrew(bt, 3);
    bt = S.moor(ctx, 31, true, { kind: 'pass', len: 21, beam: 5.2 }); S.idleCrew(bt, 2);
    // ================= 放桅过桥的大船 =================
    var big = S.boat(ctx, { x: 20.5, z: 2.4, yaw: -1.93, len: 25, beam: 6, kind: 'pass', mast: 0.92, yuloh: 'stern', rock: 1.6, drift: 0.9 });
    [[0.05, 0, 'wave'], [0.28, 0.3, 'point'], [-0.15, -0.3, 'wave'], [-0.35, 0.2, 'haul'], [0.36, -0.25, 'haul'], [-0.05, 0.4, 'point']].forEach(function (c) { big.crew(c[0], c[1], Q.rand(-0.5, 0.5), Q.pick(['boatman', 'bare', 'labor']), c[2], { on: 'roof' }); });
    big.crew(0.8, 0.3, 0.5, 'boatman', 'punt', { prop: 'longPole' }); big.crew(0.86, -0.3, -0.5, 'boatman', 'punt', { prop: 'longPole' }); big.crew(0.66, 0, 0, 'bare', 'wave');
    big.crew(0.3, 0.92, 1.4, 'boatman', 'punt', { prop: 'longPole' }); big.crew(-0.1, -0.92, -1.4, 'boatman', 'punt', { prop: 'longPole' });
    big.crew(-0.74, 0.2, 0, 'boatman', 'scull', { on: 'helm' }); big.crew(-0.7, -0.3, 0.3, 'boatman', 'scull', { on: 'helm' }); big.crew(0.56, -0.4, 0, 'woman', 'stand'); big.crew(0.52, 0.4, 0, 'child', 'point');
    Q.label('放桅过桥', 20, 6.5, 2, true);
    // 已过桥的船
    bt = S.boat(ctx, { x: -19, z: -10.4, yaw: -1.5, len: 21, beam: 5.2, kind: 'pass', mast: 'down', yuloh: 'both', rock: 1, drift: 0.7 });
    bt.crew(0.86, 0.3, -1.2, 'boatman', 'scull'); bt.crew(0.8, -0.3, 1.2, 'boatman', 'scull'); bt.crew(-0.74, 0, 2.8, 'boatman', 'scull', { on: 'helm' }); bt.crew(0.1, 0, 0, 'boatman', 'sitGround', { on: 'roof' });
    // ================= 虹桥 =================
    K.rainbow(b);
    var B = W.bridge, u, v, xz;
    function onBr(u, v) { xz = W.bridgeXZ(u, v); return xz; }
    // 桥栏边看船的人
    for (i = 0; i < 26; i++) { u = Q.rand(-8, 9); onBr(u, B.hw - 0.42); S.man(xz[0], xz[1], 0.93 + Q.rand(-0.3, 0.3), null, Q.pick(['lean', 'lean', 'point', 'wave', 'lean', 'sleeves']), { y: W.archY(u) }); }
    for (i = 0; i < 9; i++) { u = Q.rand(-7, 7); onBr(u, -B.hw + 0.42); S.man(xz[0], xz[1], 0.93 + Math.PI + Q.rand(-0.3, 0.3), null, Q.pick(['lean', 'lean', 'point', 'sleeves']), { y: W.archY(u) }); }
    // 桥面两侧的摊子
    [[-13.5, 1], [-10.5, -1], [10.5, 1], [13.6, -1], [-15.5, -1], [15.8, 1], [8.2, -1]].forEach(function (s, k) { u = s[0]; v = s[1] * (B.hw - 0.95); onBr(u, v); S.stall(b, xz[0], W.archY(u), xz[1], 0.93 + (s[1] > 0 ? Math.PI : 0), { umb: k % 3 !== 2, cust: 0.7 }); });
    // 桥心：轿子与骑马的迎面相遇，各有仆从吆喝
    V.sedanTrain(pBr, pBr.len * 0.5 - 6, 1, { lat: 0.9, followers: 2, speed: 0.8 });
    V.rider(pBr, pBr.len * 0.5 - 7, -1, { kind: 'horse', look: 'official', lat: 0.9, porter: true, speed: 0.8 });
    V.packTrain(pBr, pBr.len * 0.5 - 22, 1, { n: 2, load: 'pack', lat: 0.6, speed: 0.8 });
    F.walkers(pBr, 46, { spread: 0.55 });
    V.barrowTrain(pBr, 14, -1, { lat: 0.8 });
    Q.label('虹桥', B.cx, 8.6, B.cz, true);
    // 桥北岸边看热闹的
    F.audience(15, -12.6, 25, -11, 9, [19, 0]);
    // ================= 桥北街市 =================
    S.stallAt(b, pC, pC.len - 6, 1, { sign: '饮子' }); S.stallAt(b, pC, pC.len - 12, -1, {}); S.stallAt(b, pC, pC.len - 20, 1, {});
    V.oxCartTrain(pC, 62, 1, { lat: 0.6 }); V.barrowTrain(pC, 96, -1, { donkey: true, lat: 0.9 }); V.packTrain(pC, 30, 1, { n: 3, lat: -0.5 }); V.rider(pC, 80, -1, { lat: 0.8 });
    F.walkers(pC, 62, { spread: 0.7 });
    S.rowAlong(b, pC, 14, pC.len - 3, 1, { awn: 0.35, two: 0.12 });
    S.rowAlong(b, pC, 30, pC.len - 8, -1, { awn: 0.2, bank: 3.5 });
    S.rowAlong(b, W.roads.bankN, 5, 60, 1, { thatch: 0.3 }); S.rowAlong(b, W.roads.bankN, 5, 60, -1, { thatch: 0.3 });
    F.walkers(W.roads.bankN, 7);
    // ================= 桥南：十千脚店 =================
    S.house(b, { x: -33, z: 11.6, ry: 0, w: 9.5, d: 6, h: 3.2, front: ['open'] }, function (bb, info) {
      bb.push(0, info.base, 0, 0); K.table(bb, -2.6, 1, 0, 2.6, 0.7, 0.86); K.jar(bb, 3.4, 1.4, 1.3); K.jar(bb, 3.8, 0.4, 1.1); K.jar(bb, 2.8, 0.2, 1.2); bb.pop();
      q = bb.world(-2.6, info.base, 0.2); F.person({ x: q[0], y: q[1], z: q[2], yaw: 0, look: 'labor', pose: 'idleHold', prop: 'tray' });
    });
    K.cailou(b, { x: -33, z: 16.4, ry: 0, w: 7, d: 2.4, h: 6.2, nx: 4, door: true }); S.claim(-33, 16.4, 3);
    S.house(b, { x: -46.4, z: 10.4, ry: 0, w: 11.5, d: 7.4, h: 3.2, storeys: 2, type: 'xieshan', dougong: true, front: ['lattice', 'open', 'open', 'lattice'], front2: ['open'] }, function (bb, info) {
      for (var k = 0; k < 3; k++) { q = bb.world(-3 + k * 3, info.floor2, 2.2); F.person({ x: q[0], y: q[1], z: q[2], yaw: Math.PI / 2 * (k - 1), look: 'gentry', pose: Q.pick(['sitDrink', 'sitTalk']), seat: 0.46, prop: 'cup' }); }
      q = bb.world(4.6, info.floor2, 4.2); F.person({ x: q[0], y: q[1], z: q[2], yaw: 0.3, look: 'gentry', pose: 'lean' });
    });
    K.sign(b, '十千', -37.6, 0, 18.2, 0.5, { size: 0.55, post: true, clear: 1.3, style: 1 });
    K.sign(b, '脚店', -28.6, 0, 18.2, -0.5, { size: 0.55, post: true, clear: 1.3, style: 1 });
    K.sign(b, '天之', -35.2, 3.3, 17.7, 0, { size: 0.4 }); K.sign(b, '美禄', -30.8, 3.3, 17.7, 0, { size: 0.4 });
    K.flag(b, -27.2, 15.4, 0.4, { h: 8.5, len: 3.2, text: '新酒' });
    S.tea(b, -39.6, 16.6, 0, 1, 1, 0.9, { waiter: false });
    F.cluster(-33, 19, 5); S.man(-31.6, 17.6, 0.2, 'labor', 'bow');
    Q.label('十千脚店', -33, 7.6, 16, true);
    // 桥南街：摊贩、伞下的饮子铺、车马
    [8, 14, 21, 30, 52, 70].forEach(function (s, k) { S.stallAt(b, pD, s, k % 2 ? 1 : -1, { sign: k === 1 ? '香饮子' : null, umb: true }); });
    V.oxCartTrain(pD, 60, 1, { lat: 0.8 }); V.barrowTrain(pD, 34, -1, { lat: 1 }); V.rider(pD, 44, 1, { lat: -0.8 }); V.sedanTrain(pD, 90, -1, { lat: 1, followers: 1 });
    F.walkers(pD, 78, { spread: 0.75 });
    S.rowAlong(b, pD, 3, 122, 1, { two: 0.12, bank: 2.4 }); S.rowAlong(b, pD, 6, 118, -1, { two: 0.1 });
    // 桥南岸边：泊船与看水的人
    bt = S.moor(ctx, -26, false, { len: 20, kind: 'cargo', cargo: 3 }); S.idleCrew(bt, 3);
    bt = S.moor(ctx, -22, true, { len: 22, kind: 'cargo' }); S.idleCrew(bt, 2);
    bt = S.moor(ctx, -41, true, { len: 21, kind: 'pass', mast: 'down' }); S.idleCrew(bt, 3);
    // 河湾处的船群
    [[-62.2, -30, 3.1, 'cargo', 'down'], [-62.6, -53, 3.14, 'pass', 'down'], [-49.4, -31, 3.2, 'pass', 'up'], [-50.4, -58, 3.1, 'cargo', 'down'], [-57, -84, 3.16, 'cargo', 'none'], [-60, -118, 3.1, 'pass', 'down'], [160, 47, 2.5, 'cargo', 'down']].forEach(function (s) {
      bt = S.boat(ctx, { x: s[0], z: s[1], yaw: s[2], len: Q.rand(19, 22), beam: 5.2, kind: s[3], mast: s[4], rock: 0.6 }); S.idleCrew(bt, 2);
    });
    bt = S.boat(ctx, { x: -55, z: -19, yaw: -2.5, len: 21, beam: 5.2, kind: 'pass', mast: 'down', yuloh: 'both', rock: 1, drift: 0.8 });
    for (i = 0; i < 4; i++) bt.crew(0.82 - (i >> 1) * 0.09, (i % 2 ? 0.34 : -0.34), i % 2 ? -1.2 : 1.2, 'boatman', 'scull');
    bt.crew(-0.74, 0, 2.8, 'boatman', 'scull', { on: 'helm' });
    // 南岸桥东的几间屋
    [[20, 23.5], [31, 24.5], [42.5, 26], [55, 27], [68, 30]].forEach(function (h) { if (S.free(h[0], h[1], 2.6, { bank: 1.5 })) S.house(b, { x: h[0], z: h[1], ry: Math.PI, w: Q.rand(7, 9), d: 5, front: ['lattice', 'door', 'lattice'], roof: Q.chance(0.4) ? 'thatch' : 'tile' }); });
    // 岸柳
    for (i = 0; i < 60; i++) {
      var x = Q.rand(-48, 124), nb = Q.chance(0.5), be2 = S.berth(x, nb, 0), z = be2.z + (nb ? -1 : 1) * Q.rand(1.2, 3.2);
      if (Math.abs(x - 6) < 16) continue;
      if (S.free(x, z, 0.8, { bank: 0.4 })) S.tree(ctx, x, z, Q.chance(0.15), { h: Q.rand(2.2, 3.2) });
    }
    S.scatter(40, -66, 126, -60, 40, function (x, z) { S.tree(ctx, x, z, Q.chance(0.4)); }, 1.6, { bank: 0.6 });
  });
})();
