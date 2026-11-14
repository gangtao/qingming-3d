/* 卷首·郊野春色：溪桥、驮炭驴队、村舍打谷场、老柳、扫墓归来的轿马、惊马、路边茶棚、卧牛 */
(function () {
  'use strict';
  var Q = window.Q, K = Q.K, W = Q.W, COL = Q.COL, F = Q.F, A = Q.A, V = Q.V, S = Q.S, C = Q.C, P = S.P;
  Q.scenes.push(function (ctx) {
    var b = ctx.b, tw = ctx.twigs, main = W.roads.main, p, i;
    K.flatBridge(b, W.footBridge, { rail: false });
    // —— 驮炭的驴队正要过小桥 ——
    var pA = S.pA = S.sub(main, [6080, 100], [5180, 178]);
    V.packTrain(pA, 44, 1, { n: 5, load: 'charcoal', tail: true, speed: 0.8 });
    Q.label('驮炭驴队', W.X(5690), 2.6, W.Z(165));
    // —— 村舍与打谷场 ——
    var huts = [[5225, 104, 0.2, 7, 4.6], [5300, 90, -0.1, 8, 5], [5388, 96, 0.12, 6.6, 4.6], [5452, 118, -0.6, 7, 4.6], [5200, 136, 1.25, 5.6, 4]];
    huts.forEach(function (h, k) {
      p = P(h[0], h[1]);
      S.house(b, { x: p[0], z: p[1], ry: h[2], w: h[3], d: h[4], h: 2.5, roof: 'thatch', front: k % 2 ? ['earth', 'door', 'earth'] : ['door', 'window'], sides: 'earth', back: 'earth' });
    });
    p = P(5335, 126);
    b.setChunk(p[0]);
    b.cyl('stone', [p[0] - 0.6, 0.32, p[1]], [p[0] + 0.6, 0.32, p[1] + 0.2], 0.32, 0.32, 9, COL.stone, true, true);       // 碌碡
    b.ball('thatch', p[0] + 6, 0.9, p[1] - 3, 1.5, 1.4, 1.5, 9, 5, Q.shade(COL.thatch, 0.95));                              // 草垛
    b.ball('thatch', p[0] - 8.5, 0.7, p[1] + 1.5, 1.1, 1.1, 1.1, 8, 5, Q.shade(COL.thatch, 0.9));
    K.fence(b, [[p[0] - 12, p[1] + 4.6], [p[0] - 2, p[1] + 5.6], [p[0] + 7, p[1] + 5.2], [p[0] + 13.5, p[1] + 3.4]], 1.0);
    S.man(p[0] + 1.5, p[1] + 0.6, 2.2, 'labor', 'work', { prop: 'broom' });
    S.man(p[0] - 3.4, p[1] - 1.2, 0.6, 'woman', 'stand'); S.man(p[0] - 2.6, p[1] - 0.6, -1.6, 'child', 'wave');
    S.man(p[0] + 5, p[1] + 2.4, 1.2, 'labor', 'sitGround');
    A.animal({ kind: 'dog', x: p[0] - 5, z: p[1] + 2, yaw: 1.0, mode: 'stand' });
    A.animal({ kind: 'pig', x: p[0] + 9.4, z: p[1] + 0.5, yaw: -2, mode: 'graze' }); A.animal({ kind: 'pig', x: p[0] + 10.4, z: p[1] + 1.4, yaw: -0.4, mode: 'graze', scale: 0.8 });
    Q.label('村舍', p[0], 3.4, p[1] - 4);
    // —— 路边的老柳、枯树 ——
    var pB = S.pB = S.sub(main, [5250, 164], [4425, 120]);
    S.treesAlong(ctx, pB, 4, 44, 16, { tree: { h: 3.0, r: 0.62 }, near: 1.4, far: 5 });
    S.treesAlong(ctx, pA, 0, pA.len, 14, { bare: 0.7 });
    S.treesAlong(ctx, pB, 44, pB.len - 8, 9, { bare: 0.3 });
    // —— 路旁瓦屋、草棚与篱笆 ——
    p = P(4812, 172);
    S.house(b, { x: p[0], z: p[1], ry: 0.08, w: 8.4, d: 5, roof: 'tile', front: ['lattice', 'door', 'lattice'] });
    K.shed(b, p[0] - 8.6, p[1] + 3.6, 0.2, 4.2, 3, 2.2, { roof: 'thatch' }); S.claim(p[0] - 8.6, p[1] + 3.6, 2);
    K.fence(b, [[p[0] - 12, p[1] + 6.6], [p[0] - 3, p[1] + 7.2], [p[0] + 6.5, p[1] + 6.4]], 1.0);
    A.animal({ kind: 'donkey', x: p[0] - 8.4, z: p[1] + 3.8, yaw: 1.4, mode: 'graze' });
    S.man(p[0] + 1, p[1] + 4.2, 0.4, 'labor', 'sleeves');
    // —— 骑驴进城的一行 ——
    V.rider(pB, 50, 1, { kind: 'donkey', look: 'woman', porter: true, speed: 0.9 });
    V.rider(pB, 56, 1, { kind: 'donkey', look: 'traveler', speed: 0.9 });
    V.packTrain(pB, 30, 1, { n: 2, load: 'pack', speed: 0.85 });
    F.walkers(pA, 9, { look: ['labor', 'traveler', 'labor', 'gentry'] });
    F.walkers(pB, 16, { look: ['labor', 'traveler', 'labor', 'gentry', 'woman', 'child'] });
    // —— 扫墓归来：插柳的轿子、骑马的主人、挑担的仆从 ——
    var tomb = W.roads.tomb;
    V.sedanTrain(tomb, 42, 1, { willow: true, followers: 3, speed: 0.95 });
    V.rider(tomb, 34.5, 1, { kind: 'horse', look: 'gentry', porter: true, speed: 0.95 });
    F.person({ path: tomb, s0: 47, speed: 0.95, lat: 0.5, look: 'labor', pose: 'run' }); F.person({ path: tomb, s0: 45.6, speed: 0.95, lat: -0.5, look: 'labor', pose: 'walkCarry', prop: 'danzi' });
    F.person({ path: tomb, s0: 29, speed: 0.95, lat: 0.3, look: 'labor', pose: 'walkCarry', prop: 'danzi' }); F.person({ path: tomb, s0: 27, speed: 0.95, lat: -0.3, look: 'labor', pose: 'walkBack', prop: 'bundle' });
    p = P(4830, 75); Q.label('扫墓归来', p[0], 3.4, p[1]);
    S.treesAlong(ctx, tomb, 2, 60, 12, { bare: 0.6 });
    // —— 惊马狂奔，路人惊避 ——
    var hp = W.makePath([[4900, 96, 1.5], [4800, 120, 1.5], [4700, 128, 1.5], [4610, 140, 1.5], [4545, 160, 1.5]]);
    A.animal({ kind: 'horse', path: hp, s0: 20, speed: 3.0, col: C(0xd6cdb8) });
    F.person({ path: hp, s0: 14, speed: 3.0, lat: 0.4, look: 'labor', pose: 'run' }); F.person({ path: hp, s0: 11.5, speed: 3.0, lat: -0.6, look: 'labor', pose: 'run' });
    p = P(4640, 150);
    S.man(p[0], p[1] + 1.5, 1.3, 'gentry', 'point'); S.man(p[0] - 1.2, p[1] + 2.2, 1.0, 'child', 'run'); S.man(p[0] + 0.8, p[1] + 2.6, 1.5, 'woman', 'wave');
    Q.label('惊马', p[0] + 3, 3, p[1] - 3);
    // —— 路边茶棚 ——
    p = P(4496, 70);
    S.house(b, { x: p[0], z: p[1], ry: -0.25, w: 9, d: 4.8, h: 2.7, roof: 'thatch', front: ['open'], awning: { depth: 3.4, roof: 'thatch' } }, function (bb, info) {
      bb.push(0, info.base, 0, 0); K.table(bb, -2.5, 0.6, 0, 2.2, 0.7, 0.85); K.jar(bb, 3.2, 1, 1.2); K.jar(bb, 3.6, 0.2, 1); K.barrel(bb, 2.4, 0.4, 0.3, 0.6); bb.pop();
      var q = bb.world(-2.5, info.base, -0.4); F.person({ x: q[0], y: q[1], z: q[2], yaw: bb.yaw(), look: 'labor', pose: 'work' });
    });
    S.tea(b, p[0] - 1.1, p[1] + 4.4, -0.25, 3, 1, 0.75);
    K.sign(b, '茶', p[0] + 5.4, 0, p[1] + 4, -0.25, { size: 0.5, post: true, clear: 1.4 });
    Q.label('路边茶棚', p[0], 4, p[1]);
    // —— 卧牛 ——
    p = P(4585, 108);
    A.animal({ kind: 'ox', x: p[0], z: p[1], yaw: 1.2, mode: 'lie' }); A.animal({ kind: 'ox', x: p[0] + 2.4, z: p[1] + 2.2, yaw: 2.4, mode: 'lie', col: C(0x6a5a48) });
    A.animal({ kind: 'ox', x: p[0] - 2.6, z: p[1] - 2.4, yaw: -0.8, mode: 'graze' }); A.animal({ kind: 'ox', x: p[0] + 3.6, z: p[1] - 2.8, yaw: 0.3, mode: 'stand', scale: 0.7 });
    S.claim(p[0], p[1], 4.5);
    // —— 菜畦里的农人 ——
    p = P(4625, 62); S.man(p[0], p[1], 0.4, 'labor', 'bend'); S.man(p[0] + 3.2, p[1] + 1.4, -1.2, 'labor', 'idleHold', { prop: 'danzi' });
    p = P(5030, 0); S.man(p[0], p[1], 2, 'labor', 'bend'); S.man(p[0] + 4, p[1] - 3, 1, 'labor', 'work', { prop: 'hammer' });
    p = P(4760, 96); K.well(b, p[0], p[1], 0.4); S.claim(p[0], p[1], 2); S.man(p[0] + 1.9, p[1] + 0.4, -1.4, 'labor', 'bend');
    // —— 疏林：枯树为主，间以新柳；溪边芦苇 ——
    S.scatter(70, 128, 300, -27, 27, function (x, z) { S.tree(ctx, x, z, Q.chance(0.72)); }, 0.9, { bank: 0.3 });
    S.scatter(26, 140, 300, -27, 26, function (x, z) { K.shrub(tw, x, z, Q.rand(0.6, 1.2), Q.rand(0.5, 1)); }, 0.5, { bank: 0.1 });
    for (i = 0; i < 46; i++) {
      var x = Q.rand(186, 330), z = Q.rand(4, 40), d = W.waterD(x, z);
      if (d > -1.2 && d < 0.5) K.reeds(tw, x, z, 0.9, 12);
    }
    // 远处人家
    [[5640, 30, 0.1], [5760, 64, -0.2], [5560, -30, 0.3], [5000, 100, -0.1], [4980, 260, 3.2], [5420, 240, 3.0], [5800, 240, 3.3]].forEach(function (h) {
      var q = P(h[0], h[1]); if (S.free(q[0], q[1], 3)) S.house(b, { x: q[0], z: q[1], ry: h[2], w: Q.rand(6, 8), d: 4.6, h: 2.5, roof: 'thatch', front: ['door', 'window'], sides: 'earth', back: 'earth' });
    });
  });
})();
