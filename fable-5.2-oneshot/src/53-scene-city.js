/* 卷尾·城门街市：十字路口、说书场、修车铺、护城河桥、城门驼队、税务、孙羊正店、香铺、王员外家、赵太丞家、水井、解字摊 */
(function () {
  'use strict';
  var Q = window.Q, K = Q.K, W = Q.W, COL = Q.COL, F = Q.F, A = Q.A, V = Q.V, S = Q.S, C = Q.C, P = S.P;
  var PI = Math.PI;
  Q.scenes.push(function (ctx) {
    var b = ctx.b, tw = ctx.twigs, main = W.roads.main, p, i, q, pD = S.pD;
    var pE = S.sub(main, [1700, 158], [900, 186]);      // 护城河桥—城门
    var pF = S.sub(main, [1040, 190], [20, 182]);       // 城内大街
    [[-272.6, -2.4, 3.4], [-222, 2, 4], [-235, 15.4, 3], [-269, 12.6, 3.4], [-206, 2, 3], [-92, -9, 4.5], [-80, -12.6, 2.5]].forEach(function (c) { S.claim(c[0], c[1], c[2]); });
    var north = W.roads.north, lane = W.roads.lane, cityN = W.roads.cityN, cityS = W.roads.cityS;

    // ================= 十字路口一带 =================
    // 河湾西岸的茶坊
    S.house(b, { x: -74.6, z: 2, ry: -PI / 2, w: 10, d: 6, front: ['open'], awning: { depth: 3, roof: 'mat' } }, null);
    S.tea(b, -80.2, 2, -PI / 2, 3, 1, 0.8);
    K.sign(b, '茶', -80.6, 0, 8.6, -PI / 2, { size: 0.5, post: true, clear: 1.3 });
    // 修车铺：地上摆着车轮、车辕，木匠挥锤
    S.house(b, { x: -76.4, z: -13, ry: -PI / 2, w: 7.4, d: 5, front: ['open'] }, null);
    b.setChunk(-80); 
    [[-80.2, -11.6, 0.3], [-80.6, -14.6, 1.2]].forEach(function (wv, k) {
      b.push(wv[0], 0, wv[1], wv[2]);
      if (k === 0) { b.push(0, 0.85, 0, 0); b.m && 0; b.pop(); }
      var R = 0.85, n = 14, rim = Q.shade(COL.wood, 0.8);
      for (var j = 0; j < n; j++) { var a0 = j / n * 6.283, a1 = (j + 1) / n * 6.283;
        var lay = k === 1;
        var A0 = lay ? [Math.cos(a0) * R, 0.1, Math.sin(a0) * R] : [Math.cos(a0) * R, R + Math.sin(a0) * R, 0], A1 = lay ? [Math.cos(a1) * R, 0.1, Math.sin(a1) * R] : [Math.cos(a1) * R, R + Math.sin(a1) * R, 0];
        b.beam('plain', A0, A1, 0.1, 0.1, rim); if (j % 1 === 0) b.beam('plain', lay ? [0, 0.1, 0] : [0, R, 0], A0, 0.04, 0.05, Q.shade(rim, 1.15)); }
      b.pop();
    });
    b.beam('wood', [-80.9, 0.12, -9.6], [-78.2, 0.12, -9.2], 0.12, 0.12, COL.wood); b.beam('wood', [-80.9, 0.12, -9.0], [-78.2, 0.12, -8.6], 0.12, 0.12, COL.wood);
    S.man(-79.4, -14.2, -1.2, 'labor', 'work', { prop: 'hammer' }); S.man(-79.6, -11, -2.0, 'bare', 'bend'); S.man(-78.8, -12.6, -1.6, 'labor', 'squat');
    Q.label('修车铺', -79, 4.2, -12.6);
    // 说书场：席棚下说书人，路人围听
    K.shed(b, -92.6, -11, PI / 2, 4.6, 3.2, 2.6, { roof: 'mat' }); S.claim(-92.6, -11, 2.2);
    S.man(-92.2, -11, PI / 2, 'gentry', 'tell');
    for (i = 0; i < 17; i++) { var a = -1.25 + i * 0.156 + Q.rand(-0.05, 0.05), r = 2.2 + (i % 3) * 0.75; S.man(-92.2 + Math.cos(a) * r, -11 + Math.sin(a) * r, Math.atan2(-Math.cos(a), -Math.sin(a)), null, Q.pick(['sleeves', 'stand', 'sleeves', 'lean', 'talk'])); }
    Q.label('说书', -91.6, 4, -11);
    // 临街酒食店，檐下搭凉棚
    S.house(b, { x: -104, z: -7.6, ry: 0, w: 10.5, d: 6, front: ['open'], awning: { depth: 2.6, roof: 'mat' } }, function (bb, info) {
      bb.push(0, info.base, 0, 0); K.table(bb, -3, 1.2, 0, 2.4, 0.7, 0.86); K.jar(bb, 4, 1.6, 1.2); K.jar(bb, 4.4, 0.6, 1.1); K.barrel(bb, 3.2, 0.8, 0.32, 0.7); bb.pop();
      q = bb.world(-3, info.base, 0.4); F.person({ x: q[0], y: q[1], z: q[2], yaw: 0, look: 'labor', pose: 'work' });
    });
    S.tea(b, -104, -2.9, 0, 3, 1, 0.8);
    K.flag(b, -97.6, -3.2, 0.2, { h: 6.4, text: '小酒' });
    // 路北的小庙门
    S.house(b, { x: -115.4, z: -13, ry: 0, w: 6, d: 4.2, h: 3.2, type: 'xieshan', front: ['plaster', 'gate', 'plaster'], dougong: true }, null);
    K.fence(b, [[-121, -10.4], [-118.6, -10.6]], 1.3); K.fence(b, [[-112.2, -10.6], [-109.8, -10.4]], 1.3);
    // 柳下歇脚的挑夫
    [[-127.6, -5.6], [-123.2, -6], [-131.4, -5.4]].forEach(function (t) { S.tree(ctx, t[0], t[1], false, { h: 3, r: 0.6 }); });
    for (i = 0; i < 5; i++) { var px = -129.6 + i * 1.5, pz = -4.9 + (i % 2) * 0.5; S.man(px, pz, Q.rand(-0.5, 0.5), 'labor', i === 2 ? 'squat' : 'sitGround'); b.setChunk(px); K.basket(b, px + 0.6, 0, pz + 0.5, 0.3, 0.36, null, Q.C(0x9a8a5a)); }
    // 路口的车轿牲口
    V.oxCartTrain(pD, 108, 1, { lat: 1.4, n: 3 }); V.oxCartTrain(pD, 116, -1, { lat: 1.6 });
    V.oxCartTrain(pD, 150, 1, { lat: -1.2, type: 'flatCart' });
    V.sedanTrain(pD, 138, 1, { lat: 1.5, followers: 2 }); V.barrowTrain(pD, 128, 1, { lat: -2.2, donkey: true });
    V.rider(pD, 160, -1, { lat: 1.4, kind: 'horse', look: 'gentry', porter: true });
    [100, 112, 126, 141, 156].forEach(function (s, k) { S.stallAt(b, pD, s, k % 2 ? 1 : -1, { umb: k % 2 === 0 }); });
    S.rowAlong(b, pD, 122, pD.len, 1, { two: 0.1 }); S.rowAlong(b, pD, 118, pD.len, -1, { two: 0.1 });
    // 北去的路与小巷：赶猪人、行人、屋舍
    for (i = 0; i < 5; i++) A.animal({ kind: 'pig', path: lane, s0: 26 + i * 1.3 + Q.rand(0.4), speed: 0.6, dir: -1, lat: Q.rand(-0.9, 0.9), scale: Q.rand(0.85, 1.05) });
    F.person({ path: lane, s0: 23.6, speed: 0.6, dir: -1, lat: 0.3, look: 'labor', pose: 'walkWhip', prop: 'whip' });
    F.walkers(north, 14); F.walkers(lane, 6);
    S.rowAlong(b, north, 20, north.len, 1, { thatch: 0.25 }); S.rowAlong(b, north, 30, north.len, -1, { thatch: 0.25 });
    S.rowAlong(b, lane, 4, lane.len, 1, { thatch: 0.35 }); S.rowAlong(b, lane, 4, lane.len, -1, { thatch: 0.35 });

    // ================= 护城河与平桥 =================
    K.flatBridge(b, W.moatBridge, { cross: true });
    var m = W.moatBridge;
    for (i = 0; i < 12; i++) { var sd = i % 3 ? 1 : -1, x = Q.rand(m.x0 + 2, m.x1 - 2); S.man(x, sd > 0 ? m.z1 - 0.5 : m.z0 + 0.5, sd > 0 ? Q.rand(-0.3, 0.3) : PI + Q.rand(-0.3, 0.3), null, Q.pick(['lean', 'lean', 'point', 'sleeves']), { y: m.y }); }
    for (i = 0; i < 34; i++) { var z = Q.rand(-100, 80), ex = Q.chance(0.5) ? -151.2 - Q.rand(2.2) : -169 + Q.rand(2.2); if (S.free(ex, z, 0.8, { bank: 0.3 })) S.tree(ctx, ex, z, Q.chance(0.12), { h: Q.rand(2.4, 3.3) }); }
    Q.label('护城河', -160, 2.6, 2);
    var mb = S.boat(ctx, { x: -160, z: 34, yaw: 0.1, len: 10, beam: 2.5, kind: 'small', mast: 'none', yuloh: 'stern', rock: 0.8 }); mb.crew(-0.7, 0, 0, 'boatman', 'scull'); mb.crew(0.5, 0, 0, 'labor', 'squat');
    // ================= 城门 =================
    K.gate(b);
    Q.label('城门', W.gate.x, 16.5, W.gate.z, true);
    // 出城的驼队
    V.packTrain(pE, pE.len - 53, -1, { kind: 'camel', n: 4, load: 'camelLoad', lat: 0.4, speed: 0.75 });
    V.rider(pE, 30, 1, { lat: 0.9 }); V.barrowTrain(pE, 10, 1, { lat: 1.2 }); V.packTrain(pE, 22, -1, { n: 3, lat: 1.2 });
    F.walkers(pE, 36, { spread: 0.7 });
    S.man(-181, 6.6, 1.2, 'labor', 'sitGround'); S.man(-180.2, 13.4, 2.2, 'monk', 'stand'); S.man(-198.4, 13, -1.3, 'labor', 'squat');
    S.rowAlong(b, pE, 0, 30, 1, { thatch: 0.2 }); S.rowAlong(b, pE, 0, 30, -1, { thatch: 0.2 });
    // 城头树木
    for (i = 0; i < 26; i++) { var tz = Q.rand(-110, 80); if (Math.abs(tz - W.gate.z) < 17) continue; var txx = W.gate.x + Q.rand(-6, 6); b.setChunk(txx); b.push(0, W.rampartH(txx, tz) - 0.2, 0, 0); if (Q.chance(0.5)) K.bareTree(b, tw, txx, tz, { h: 3.4 }); else K.willow(b, tw, txx, tz, { h: 2.2 }); b.pop(); }

    // ================= 城内 =================
    // 税务：官吏坐在案后，门前货包成堆
    S.house(b, { x: -206.2, z: -3.6, ry: 0, w: 7.2, d: 5.6, front: ['open'] }, function (bb, info) {
      bb.push(0, info.base, 0, 0); K.table(bb, 0, 0.8, 0, 2.2, 0.8, 0.8); K.bench(bb, 0, -0.1, 0, 1.6); bb.pop();
      q = bb.world(0, info.base, -0.1); F.person({ x: q[0], y: q[1], z: q[2], yaw: 0, look: 'official', pose: 'sitTalk', seat: 0.46 });
      q = bb.world(1.9, info.base, 0.6); F.person({ x: q[0], y: q[1], z: q[2], yaw: -0.6, look: 'official', pose: 'sleeves' });
    });
    b.setChunk(-206); for (i = 0; i < 16; i++) K.sack(b, -206 + Q.rand(-2.2, 2.2), (i > 10) * 0.24, 1.4 + Q.rand(-0.7, 0.7), Q.rand(3));
    S.man(-204.2, 2.6, PI, 'labor', 'point'); S.man(-207.6, 2.8, PI - 0.3, 'labor', 'bend'); S.man(-205.6, 3.2, PI + 0.2, 'gentry', 'talk'); S.man(-208.6, 1.4, 1.2, 'bare', 'idleHold', { prop: 'sack' });
    Q.label('税务', -206.2, 5, -3.6);
    // 孙羊正店：二层歇山大楼，门前花饰彩楼欢门
    S.house(b, { x: -222, z: -8, ry: 0, w: 13, d: 8.4, h: 3.5, h2: 3, storeys: 2, type: 'xieshan', dougong: true, front: ['lattice', 'open', 'open', 'lattice'], front2: ['open', 'lattice', 'lattice', 'open'] }, function (bb, info) {
      for (var k = 0; k < 4; k++) { q = bb.world(-4.5 + k * 3, info.floor2, 3.0); F.person({ x: q[0], y: q[1], z: q[2], yaw: k % 2 ? 0.8 : -0.8, look: Q.pick(['gentry', 'gentry', 'official']), pose: Q.pick(['sitDrink', 'sitTalk']), seat: 0.46, prop: 'cup' }); }
      q = bb.world(-5.6, info.floor2, 4.8); F.person({ x: q[0], y: q[1], z: q[2], yaw: 0.2, look: 'gentry', pose: 'lean' }); q = bb.world(5.2, info.floor2, 4.8); F.person({ x: q[0], y: q[1], z: q[2], yaw: -0.2, look: 'woman', pose: 'lean' });
    });
    K.cailou(b, { x: -222, z: -1.5, ry: 0, w: 9, d: 2.6, h: 7, nx: 4, door: true, deco: 'flower' }); S.claim(-222, -1.5, 3.4);
    S.house(b, { x: -233.4, z: -7.4, ry: 0, w: 8, d: 7, h: 3.3, storeys: 2, type: 'xieshan', front: ['shutter', 'open'], front2: ['lattice'] }, S.shopIn({ w: 8, d: 7 }, { sign: null, goods: 'jar' }));
    K.sign(b, '孙羊店', -228.2, 0, 0.6, 0.35, { size: 0.5, post: true, clear: 1.2, style: 1 });
    K.sign(b, '正店', -215.8, 0, 0.6, -0.35, { size: 0.56, post: true, clear: 1.3, style: 1 });
    K.sign(b, '香醪', -222, 4.3, -0.1, 0, { size: 0.46, vertical: false });
    K.flag(b, -214.4, -2.6, 0.3, { h: 9, len: 3.2, text: '新酒' });
    b.setChunk(-222); for (i = 0; i < 28; i++) K.jar(b, -226 + (i % 7) * 0.8, -14.6 - Math.floor(i / 7) * 0.8, 1.1, Q.jit(Q.C(0x5a4a3c), 0.1));       // 后院倒扣的酒瓮
    F.cluster(-222, 1.8, 6); S.man(-220.4, 0.6, 0.3, 'labor', 'bow'); S.man(-224.6, 0.9, -0.2, 'labor', 'idleHold', { prop: 'tray' });
    S.stall(b, -229.6, 0, 2.4, 0, { goods: 'fruit' }); S.stall(b, -214.2, 0, 2.2, 0, { goods: 'cake', umb: false });
    Q.label('孙羊正店', -222, 9, -1.5, true);
    // 刘家香铺
    S.house(b, { x: -251, z: -6.8, ry: 0, w: 7.4, d: 6, front: ['shutter', 'open'] }, S.shopIn({ w: 7.4, d: 6 }, { sign: null, goods: 'basket' }));
    K.sign(b, '刘家上色沉檀拣香', -247, 0, -2.8, 0.2, { size: 0.42, post: true, clear: 0.9 });
    // 久住王员外家（旅店）
    S.house(b, { x: -235, z: 20.8, ry: PI, w: 12, d: 7, h: 3.2, storeys: 2, type: 'xieshan', front: ['lattice', 'gate', 'lattice', 'half'], front2: ['open', 'lattice', 'open'] }, function (bb, info) {
      q = bb.world(-2, info.floor2, 2.4); F.person({ x: q[0], y: q[1], z: q[2], yaw: PI - 0.5, look: 'gentry', pose: 'sitTalk', seat: 0.46 });        // 楼上读书的士子
      q = bb.world(3.6, info.floor2, 4); F.person({ x: q[0], y: q[1], z: q[2], yaw: PI, look: 'gentry', pose: 'lean' });
    });
    K.sign(b, '久住王员外家', -242.8, 0, 16.4, 0.3, { size: 0.44, post: true, clear: 1.0 });
    Q.label('久住王员外家', -235, 9, 20);
    // 赵太丞家（医铺）
    S.house(b, { x: -272.6, z: -8, ry: 0, w: 9.4, d: 6.2, h: 3.3, type: 'xieshan', front: ['lattice', 'open', 'lattice'] }, function (bb, info) {
      bb.push(0, info.base, 0, 0); K.table(bb, 0, 0.6, 0, 2.6, 0.8, 0.86); K.bench(bb, 2.4, 1.6, PI / 2, 1.5); bb.pop();
      q = bb.world(0, info.base, -0.4); F.person({ x: q[0], y: q[1], z: q[2], yaw: 0, look: 'gentry', pose: 'talk' });
      q = bb.world(2.4, info.base, 1.6); F.person({ x: q[0], y: q[1], z: q[2], yaw: -PI / 2, look: 'woman', pose: 'sit', seat: 0.46 });
      q = bb.world(1.6, info.base, 2.2); F.person({ x: q[0], y: q[1], z: q[2], yaw: -2.4, look: 'child', pose: 'stand' });
    });
    K.sign(b, '赵太丞家', -272.6, 3.75, -4.3, 0, { size: 0.5, vertical: false });
    K.sign(b, '治酒所伤真方集香丸', -277.6, 0, -2.4, 0.15, { size: 0.36, post: true, clear: 0.6 });
    K.sign(b, '大理中丸医肠胃冷', -267.6, 0, -2.4, -0.15, { size: 0.36, post: true, clear: 0.8 });
    K.sign(b, '五劳七伤', -270.2, 0, -3.2, 0, { size: 0.34, post: true, clear: 0.6 });
    Q.label('赵太丞家', -272.6, 6.6, -6);
    // 水井
    K.well(b, -262.6, -3.2, 0.2); S.claim(-262.6, -3.2, 2);
    S.man(-261.2, -2.4, -2.2, 'labor', 'bend'); S.man(-264.2, -3.8, 1.2, 'labor', 'bend'); S.man(-262.2, -0.6, 2.6, 'labor', 'idleHold', { prop: 'danzi' });
    Q.label('水井', -262.6, 2.4, -3.2);
    // 街心伞下的饮子摊
    S.stall(b, -258.4, 0, -1.4, 0, { sign: '饮子', goods: 'pots' }); S.stall(b, -254.8, 0, -0.8, 0, { sign: '香饮子', goods: 'pots' });
    // “解”字卦摊与听众
    K.shed(b, -269, 15.6, PI, 5, 3.4, 2.7, { roof: 'mat' }); S.claim(-269, 15.6, 2.4);
    K.sign(b, '解', -269, 2.0, 13.7, 0, { size: 0.6 }); K.sign(b, '神课', -271.2, 1.5, 13.8, 0, { size: 0.3 }); K.sign(b, '看命', -266.8, 1.5, 13.8, 0, { size: 0.3 }); K.sign(b, '决疑', -269, 1.2, 13.8, 0, { size: 0.3, vertical: false });
    b.setChunk(-269); K.table(b, -269, 15.4, 0, 1.6, 0.8); S.man(-269, 16.2, PI, 'gentry', 'tell');
    for (i = 0; i < 13; i++) { var aa = PI + 0.5 + i * 0.165, rr = 2.6 + (i % 3) * 0.7; S.man(-269 + Math.cos(aa) * rr, 14.6 + Math.sin(aa) * rr, Math.atan2(-Math.cos(aa), -Math.sin(aa)), null, Q.pick(['sleeves', 'stand', 'lean', 'sleeves', 'talk'])); }
    Q.label('解', -269, 4.6, 15);
    // 街上的车轿人马
    V.sedanTrain(pF, 30, 1, { lat: 2.6, followers: 2 }); V.sedanTrain(pF, 62, -1, { lat: 2.8, followers: 1, four: true });
    V.rider(pF, 44, -1, { kind: 'horse', look: 'official', lat: 1.2, porter: true }); V.rider(pF, 14, 1, { kind: 'horse', look: 'gentry', lat: 1.5 });
    V.oxCartTrain(pF, 52, 1, { lat: -2.4, type: 'flatCart' }); V.barrowTrain(pF, 76, -1, { lat: 3.4 }); V.barrowTrain(pF, 20, -1, { lat: 3.2, donkey: true });
    V.packTrain(pF, 84, 1, { n: 3, lat: -3 });
    [8, 26, 36, 50, 58, 70, 80, 90].forEach(function (s, k) { S.stallAt(b, pF, s, k % 2 ? 1 : -1, { umb: k % 3 !== 1, off: -1.2 }); });
    F.walkers(pF, 96, { spread: 0.8 });
    for (i = 0; i < 6; i++) { p = {}; pF.at(12 + i * 15 + Q.rand(4), Q.rand(-3, 3), 1, p); if (S.free(p.x, p.z, 1.2, { road: true })) F.cluster(p.x, p.z, 3 + (i % 2)); }
    S.man(-246.6, 3.6, 1.2, 'monk', 'stroll'); S.man(-240.2, 12.6, -2, 'monk', 'stand'); S.man(-239.2, 12.2, 2.2, 'gentry', 'bow');
    F.walkers(cityN, 14); F.walkers(cityS, 12);
    S.rowAlong(b, pF, 3, pF.len, 1, { two: 0.22, awn: 0.35 }); S.rowAlong(b, pF, 3, pF.len, -1, { two: 0.22, awn: 0.35 });
    S.rowAlong(b, cityN, 14, cityN.len, 1, { two: 0.1 }); S.rowAlong(b, cityN, 14, cityN.len, -1, { two: 0.1 });
    S.rowAlong(b, cityS, 12, cityS.len, 1, { two: 0.1 }); S.rowAlong(b, cityS, 12, cityS.len, -1, { two: 0.1 });
    // 城内里坊：街后层层叠叠的屋顶
    for (var gx = -298; gx < -204; gx += 9.4) for (var gz = -104; gz < 76; gz += 8.6) {
      var hx = gx + Q.rand(-1.2, 1.2), hz = gz + Q.rand(-1, 1);
      if (!S.free(hx, hz, 3.6)) continue;
      S.house(b, { x: hx, z: hz, ry: Q.pick([0, 0, PI, PI / 2]), w: Q.rand(6.4, 8.4), d: Q.rand(4.6, 5.6), h: Q.rand(2.6, 3.1), front: ['lattice', 'door', 'lattice'], noStrips: Math.abs(hz) > 40 });
    }
    S.scatter(46, -298, -204, -100, 76, function (x, z) { S.tree(ctx, x, z, Q.chance(0.35), { h: Q.rand(2.4, 3.4) }); }, 1.3);
    // 城外散树
    S.scatter(60, -196, -66, -90, 70, function (x, z) { S.tree(ctx, x, z, Q.chance(0.4)); }, 1.5, { bank: 0.5 });
  });
})();
