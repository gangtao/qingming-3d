/* 人物：分件实例化（躯干、头、上臂、前臂、大腿、小腿、随身物），每帧按姿态算关节矩阵。
   面朝局部 +Z；左臂在 +X，右臂在 -X。身高约 1.7。 */
(function () {
  'use strict';
  var Q = window.Q, COL = Q.COL, M = Q.M, W = Q.W, put = Q.put, C = Q.C;
  var F = Q.F = {};
  var SKIN = C(0xd8ae86), HAIR = C(0x2a2420), SHOE = C(0x2e2824), WHITE = C(0xe8dec6);

  function ering(y, rx, rz, n, cz, cx) {
    var r = []; cz = cz || 0; cx = cx || 0;
    for (var j = 0; j < n; j++) { var a = (j + 0.5) / n * Math.PI * 2; r.push([cx + Math.sin(a) * rx, y, cz + Math.cos(a) * rz]); }
    return r;
  }
  function body(b, prof, n, tint, shades) {
    b.aux = tint;
    b.loft('plain', prof.map(function (p) { return ering(p[0], p[1], p[2], n, p[3] || 0); }), { cols: shades });
  }
  var G1 = [1, 1, 1], G9 = [0.9, 0.9, 0.9], G8 = [0.8, 0.8, 0.8];

  // ---------- 零件几何 ----------
  function collarBelt(b, beltY, long) {
    b.aux = 0;
    // 交领（右衽）：左肩斜向右腋
    var w = 0.034, cw = Q.shade(WHITE, 0.98);
    b.quad('plain', [0.085, 0.545, 0.062], [0.085 - w, 0.56, 0.06], [-0.07, beltY + 0.07, 0.128], [-0.07 + w * 1.2, beltY + 0.05, 0.13], cw);
    b.quad('plain', [-0.085, 0.545, 0.062], [-0.085 + w, 0.56, 0.06], [-0.012, 0.36, 0.124], [-0.03, 0.33, 0.126], cw);
    b.tri('plain', [-0.05, 0.56, 0.062], [0.05, 0.56, 0.062], [-0.005, 0.44, 0.112], Q.shade(WHITE, 0.92));
    // 腰带与带结
    var dk = C(0x3a2f26);
    b.loft('plain', [ering(beltY - 0.028, 0.162, 0.122, 8), ering(beltY + 0.028, 0.16, 0.12, 8)], { col: dk });
    b.box('plain', 0.03, beltY - 0.005, 0.125, 0.05, 0.05, 0.03, Q.shade(dk, 1.3));
    b.quad('plain', [0.02, beltY - 0.02, 0.135], [0.05, beltY - 0.02, 0.135], [0.06, beltY - 0.17, 0.14], [0.03, beltY - 0.17, 0.14], Q.shade(dk, 1.2));
  }
  function gTorsoS(b) { // 短褐
    body(b, [[-0.21, 0.175, 0.13], [-0.03, 0.158, 0.118], [0.1, 0.148, 0.108], [0.3, 0.178, 0.122], [0.46, 0.2, 0.112], [0.535, 0.1, 0.078], [0.585, 0.055, 0.055]], 8, 1, [G8, G9, G9, G1, G1, G1, G9]);
    collarBelt(b, 0.1);
  }
  function gTorsoL(b) { // 长袍
    body(b, [[-0.73, 0.215, 0.17], [-0.5, 0.195, 0.152], [-0.2, 0.172, 0.13], [0.1, 0.15, 0.11], [0.3, 0.18, 0.124], [0.46, 0.205, 0.114], [0.535, 0.1, 0.078], [0.585, 0.055, 0.055]], 8, 1, [G8, G9, G9, G9, G1, G1, G1, G9]);
    collarBelt(b, 0.1, true);
    b.aux = 1; b.quad('plain', [-0.012, 0.07, 0.112], [0.012, 0.07, 0.112], [0.016, -0.72, 0.172], [-0.016, -0.72, 0.172], [0.72, 0.72, 0.72]);
  }
  function gTorsoW(b) { // 妇人：褙子长裙
    body(b, [[-0.75, 0.23, 0.19], [-0.45, 0.19, 0.15], [-0.1, 0.15, 0.115], [0.12, 0.13, 0.1], [0.3, 0.155, 0.112], [0.46, 0.175, 0.105], [0.535, 0.09, 0.072], [0.585, 0.05, 0.05]], 8, 1, [G8, G9, G1, G1, G1, G1, G1, G9]);
    b.aux = 0;
    var cw = Q.shade(WHITE, 1.0);
    b.quad('plain', [0.05, 0.56, 0.06], [0.085, 0.545, 0.06], [0.06, -0.3, 0.14], [0.03, -0.3, 0.142], cw);
    b.quad('plain', [-0.05, 0.56, 0.06], [-0.085, 0.545, 0.06], [-0.06, -0.3, 0.14], [-0.03, -0.3, 0.142], cw);
    b.quad('plain', [-0.03, 0.52, 0.066], [0.03, 0.52, 0.066], [0.03, -0.3, 0.138], [-0.03, -0.3, 0.138], C(0xb98a6a));
  }
  function gTorsoB(b) { // 赤膊
    body(b, [[0.02, 0.15, 0.108], [0.12, 0.146, 0.106], [0.3, 0.176, 0.12], [0.46, 0.198, 0.11], [0.535, 0.09, 0.072], [0.585, 0.055, 0.055]], 8, 0, [SKIN, Q.shade(SKIN, 0.95), SKIN, SKIN, SKIN, SKIN]);
    body(b, [[-0.2, 0.172, 0.128], [-0.03, 0.16, 0.118], [0.1, 0.152, 0.11], [0.14, 0.155, 0.112]], 8, 1, [G8, G9, G1, G1]);
    b.aux = 0; b.loft('plain', [ering(0.09, 0.162, 0.12, 8), ering(0.15, 0.16, 0.118, 8)], { col: C(0x3a2f26) });
  }
  function limb(b, len, r0, r1, tint, col, n) { b.aux = tint; b.loft('plain', [ering(0.01, r0 * 0.8, r0 * 0.8, n || 6), ering(-0.02, r0, r0, n || 6), ering(-len, r1, r1, n || 6)], { col: col || G1 }); }
  function hand(b, y) { b.aux = 0; b.ball('plain', 0, y, 0.005, 0.034, 0.05, 0.03, 6, 3, SKIN); b.box('plain', 0.03, y + 0.01, 0.02, 0.018, 0.04, 0.02, Q.shade(SKIN, 0.95)); }
  function gUarm(b) { limb(b, 0.27, 0.062, 0.052, 1); }
  function gUarmSkin(b) { limb(b, 0.27, 0.055, 0.045, 0, SKIN); }
  function gFa(b) { limb(b, 0.23, 0.052, 0.046, 1); b.aux = 0; b.loft('plain', [ering(-0.2, 0.048, 0.048, 6), ering(-0.235, 0.05, 0.05, 6)], { col: Q.shade(WHITE, 0.95) }); hand(b, -0.285); }
  function gFaW(b) { // 宽袖
    b.aux = 1; b.loft('plain', [ering(0.0, 0.052, 0.052, 6), ering(-0.1, 0.07, 0.065, 6), ering(-0.24, 0.1, 0.07, 6, 0, 0)], { cols: [G1, G1, G9] });
    b.loft('plain', [ering(-0.24, 0.1, 0.07, 6), ering(-0.235, 0.03, 0.03, 6)], { col: [0.62, 0.62, 0.62] });
    hand(b, -0.275);
  }
  function gFaSkin(b) { limb(b, 0.23, 0.046, 0.038, 0, SKIN); hand(b, -0.28); }
  function gThigh(b) { limb(b, 0.4, 0.082, 0.064, 1, G9); }
  function shoe(b, col) { b.aux = 0; b.ball('plain', 0, -0.372, 0.045, 0.048, 0.032, 0.105, 6, 3, col); }
  function gShin(b) {
    limb(b, 0.3, 0.064, 0.05, 1, G9);
    b.aux = 0; b.loft('plain', [ering(-0.27, 0.052, 0.052, 6), ering(-0.35, 0.044, 0.046, 6)], { col: Q.shade(WHITE, 0.96) });
    shoe(b, SHOE);
  }
  function gShinBare(b) { limb(b, 0.345, 0.05, 0.036, 0, SKIN); shoe(b, C(0x9a8358)); }
  function gSkirtLeg(b) { // 长袍下只露鞋
    b.aux = 0; b.loft('plain', [ering(-0.2, 0.05, 0.05, 5), ering(-0.35, 0.044, 0.046, 5)], { col: Q.shade(WHITE, 0.9) }); shoe(b, SHOE);
  }

  function headBase(b, skin) {
    b.aux = 0;
    b.cyl('plain', [0, -0.04, 0], [0, 0.05, 0], 0.046, 0.046, 6, Q.shade(skin, 0.92));
    b.ball('plain', 0, 0.13, 0, 0.098, 0.124, 0.108, 10, 6, skin);
    var dk = C(0x241c16);
    for (var s = -1; s <= 1; s += 2) {
      b.box('plain', s * 0.038, 0.142, 0.098, 0.03, 0.013, 0.012, dk);                 // 眼
      b.box('plain', s * 0.04, 0.168, 0.097, 0.04, 0.008, 0.012, Q.shade(dk, 1.4));    // 眉
      b.ball('plain', s * 0.098, 0.13, -0.005, 0.016, 0.03, 0.02, 5, 3, Q.shade(skin, 0.93)); // 耳
    }
    b.tri('plain', [-0.016, 0.105, 0.104], [0.016, 0.105, 0.104], [0, 0.15, 0.108], Q.shade(skin, 0.86));  // 鼻
    b.quad('plain', [-0.016, 0.105, 0.104], [0.016, 0.105, 0.104], [0, 0.112, 0.128], [0, 0.112, 0.128], Q.shade(skin, 0.8));
    b.tri('plain', [-0.016, 0.105, 0.104], [0, 0.112, 0.128], [0, 0.15, 0.108], Q.shade(skin, 1.03));
    b.tri('plain', [0.016, 0.105, 0.104], [0, 0.15, 0.108], [0, 0.112, 0.128], Q.shade(skin, 0.92));
    b.box('plain', 0, 0.072, 0.098, 0.042, 0.009, 0.012, C(0x7a4034));               // 口
  }
  function hairCap(b, col, k) { b.aux = 0; k = k || 1; b.ball('plain', 0, 0.178, -0.016, 0.104 * k, 0.088 * k, 0.112 * k, 8, 4, col); b.ball('plain', 0, 0.12, -0.05, 0.1, 0.1, 0.075, 8, 3, col); }
  function beard(b) { b.aux = 0; var c = C(0x2e2620); b.box('plain', 0, 0.086, 0.1, 0.07, 0.01, 0.012, c); b.tri('plain', [-0.035, 0.06, 0.096], [0.035, 0.06, 0.096], [0, -0.03, 0.1], c); b.tri('plain', [-0.035, 0.06, 0.096], [0, -0.03, 0.1], [0, 0.03, 0.06], Q.shade(c, 0.8)); b.tri('plain', [0.035, 0.06, 0.096], [0, 0.03, 0.06], [0, -0.03, 0.1], Q.shade(c, 0.8)); }
  var heads = {
    futou: function (b) { // 幞头
      headBase(b, SKIN); var k = C(0x26211d);
      b.ball('plain', 0, 0.19, -0.012, 0.106, 0.085, 0.114, 8, 4, k);
      b.box('plain', 0, 0.262, -0.05, 0.13, 0.085, 0.09, Q.shade(k, 1.15));
      b.box('plain', 0, 0.225, 0.045, 0.16, 0.035, 0.07, k);
      for (var s = -1; s <= 1; s += 2) b.quad('plain', [s * 0.03, 0.2, -0.118], [s * 0.075, 0.2, -0.118], [s * 0.1, 0.03, -0.14], [s * 0.06, 0.03, -0.14], Q.shade(k, 1.1));
    },
    bun: function (b) { // 束发髻
      headBase(b, SKIN); hairCap(b, HAIR);
      b.ball('plain', 0, 0.285, -0.025, 0.042, 0.045, 0.042, 6, 4, HAIR);
      b.aux = 1; b.loft('plain', [ering(0.255, 0.046, 0.046, 6, -0.025), ering(0.275, 0.046, 0.046, 6, -0.025)], { col: G1 });
    },
    wrap: function (b) { // 裹巾
      headBase(b, SKIN); b.aux = 1;
      b.ball('plain', 0, 0.2, -0.012, 0.108, 0.09, 0.116, 8, 4, G1);
      b.ball('plain', 0, 0.27, -0.03, 0.055, 0.045, 0.05, 6, 3, G9);
      b.aux = 0; b.ball('plain', 0, 0.12, -0.06, 0.095, 0.09, 0.07, 6, 3, HAIR);
    },
    douli: function (b) { // 斗笠
      headBase(b, SKIN); hairCap(b, HAIR, 0.98);
      var st = C(0xb89c66), n = 12, rim = [], mid = [], j;
      for (j = 0; j < n; j++) { var a = j / n * 6.283; rim.push([Math.cos(a) * 0.36, 0.2, Math.sin(a) * 0.36]); mid.push([Math.cos(a) * 0.12, 0.3, Math.sin(a) * 0.12]); }
      b.aux = 0; b.loft('plain', [rim, mid], { cols: [Q.shade(st, 0.9), st] });
      b.fan('plain', mid.map(function (p) { return [p[0], p[1], p[2]]; }), Q.shade(st, 1.05), true);
      b.ball('plain', 0, 0.31, 0, 0.05, 0.035, 0.05, 6, 3, Q.shade(st, 0.8));
    },
    weimao: function (b) { // 帷帽 / 风帽（骑驴的远行人）
      headBase(b, SKIN); var k = C(0x4a4038), n = 12, rim = [], mid = [], j;
      for (j = 0; j < n; j++) { var a = j / n * 6.283; rim.push([Math.cos(a) * 0.3, 0.215, Math.sin(a) * 0.3]); mid.push([Math.cos(a) * 0.105, 0.225, Math.sin(a) * 0.105]); }
      b.aux = 0; b.loft('plain', [rim, mid], { col: k });
      b.cyl('plain', [0, 0.22, 0], [0, 0.33, 0], 0.105, 0.085, 8, Q.shade(k, 1.1), false, true);
      b.aux = 1; b.loft('plain', [ering(0.2, 0.11, 0.12, 8, -0.02), ering(0.02, 0.15, 0.13, 8, -0.05)], { col: G9 });
    },
    woman: function (b) { // 高髻
      headBase(b, Q.shade(SKIN, 1.06)); hairCap(b, HAIR, 1.02);
      b.ball('plain', 0, 0.3, -0.03, 0.06, 0.075, 0.06, 7, 4, HAIR);
      b.ball('plain', 0, 0.2, -0.11, 0.06, 0.06, 0.05, 6, 3, HAIR);
      b.box('plain', 0, 0.262, 0.02, 0.1, 0.012, 0.012, C(0xb08a50));
    },
    child: function (b) { // 髡发小儿
      headBase(b, Q.shade(SKIN, 1.05));
      for (var s = -1; s <= 1; s += 2) b.ball('plain', s * 0.075, 0.225, -0.02, 0.035, 0.035, 0.035, 5, 3, HAIR);
      b.ball('plain', 0, 0.245, 0.04, 0.03, 0.02, 0.03, 5, 3, HAIR);
    },
    bald: function (b) { headBase(b, SKIN); }
  };
  function gHead(name, bd) { return function (b) { heads[name](b); if (bd) beard(b); }; }

  // 随身物
  var props = {
    danzi: function (b) { // 担子：扁担两头挂筐。原点在肩头，扁担沿 Z
      b.aux = 0; var wd = C(0x7a5c3c);
      b.tube('plain', [[0, -0.04, -0.85], [0, 0.02, -0.4], [0, 0.035, 0], [0, 0.02, 0.4], [0, -0.04, 0.85]], 0.02, 4, wd);
      for (var s = -1; s <= 1; s += 2) {
        var z = s * 0.8;
        for (var k = -1; k <= 1; k += 2) { b.beam('plain', [0, -0.03, z], [k * 0.13, -0.62, z + 0.1], 0.01, 0.01, C(0x5a4a38)); b.beam('plain', [0, -0.03, z], [k * 0.13, -0.62, z - 0.1], 0.01, 0.01, C(0x5a4a38)); }
        b.cyl('plain', [0, -0.86, z], [0, -0.6, z], 0.13, 0.19, 8, C(0xb09668), true, false);
        b.aux = 1; b.ball('plain', 0, -0.6, z, 0.17, 0.08, 0.17, 7, 3, G1); b.aux = 0;
      }
    },
    bundle: function (b) { b.aux = 1; b.ball('plain', 0, 0, 0, 0.17, 0.2, 0.13, 7, 4, G1); b.aux = 0; b.box('plain', 0, 0.05, 0.1, 0.34, 0.03, 0.03, C(0x5a4a38)); },
    backBasket: function (b) { // 背篓
      b.aux = 0; var c = C(0xa88e60);
      b.loft('plain', [ering(-0.25, 0.12, 0.1, 8), ering(0.2, 0.19, 0.16, 8)], { col: c, capA: true });
      b.loft('plain', [ering(0.19, 0.195, 0.165, 8), ering(0.22, 0.195, 0.165, 8)], { col: Q.shade(c, 0.7) });
      b.aux = 1; b.ball('plain', 0, 0.2, 0, 0.16, 0.08, 0.13, 6, 3, G1);
    },
    sack: function (b) { b.aux = 0; b.ball('plain', 0, 0, 0, 0.2, 0.17, 0.42, 7, 4, C(0xcbb98e)); b.loft('plain', [ering(0, 0.205, 0.175, 7, 0.36), ering(0, 0.02, 0.02, 7, 0.46)], { col: C(0xa8966e) }); },
    staff: function (b) { b.aux = 0; b.cyl('plain', [0, -0.9, 0], [0, 0.6, 0], 0.014, 0.012, 4, C(0x6a5238)); },
    longPole: function (b) { b.aux = 0; b.cyl('plain', [0, -3.4, 0], [0, 2.0, 0], 0.028, 0.02, 5, C(0x8a7048)); },
    fan: function (b) { b.aux = 0; b.cyl('plain', [0, -0.05, 0], [0, 0.1, 0], 0.01, 0.01, 4, C(0x5a4a38)); var r = []; for (var j = 0; j < 8; j++) { var a = j / 8 * 6.283; r.push([Math.cos(a) * 0.11, 0.2 + Math.sin(a) * 0.12, 0]); } b.fan('plain', r, WHITE, false); },
    stickBundle: function (b) { b.aux = 0; b.cyl('plain', [0, 0, -0.6], [0, 0.06, 0.45], 0.014, 0.014, 4, C(0x6a5238)); b.aux = 1; b.ball('plain', 0, -0.1, -0.55, 0.15, 0.17, 0.14, 6, 4, G1); },
    box: function (b) { b.aux = 0; b.box('plain', 0, 0, 0, 0.42, 0.26, 0.3, C(0x7a5c3c)); b.box('plain', 0, 0.14, 0, 0.44, 0.03, 0.32, C(0x5a4630)); },
    tray: function (b) { b.aux = 0; b.cyl('plain', [0, 0, 0], [0, 0.04, 0], 0.2, 0.22, 8, C(0x8a6a48), true); for (var i = 0; i < 4; i++) b.ball('plain', Math.cos(i * 1.6) * 0.1, 0.07, Math.sin(i * 1.6) * 0.1, 0.05, 0.04, 0.05, 5, 3, WHITE); },
    cup: function (b) { b.aux = 0; b.cyl('plain', [0, -0.02, 0], [0, 0.03, 0], 0.02, 0.032, 6, WHITE); },
    hammer: function (b) { b.aux = 0; b.cyl('plain', [0, -0.05, 0], [0, 0.38, 0], 0.014, 0.014, 4, C(0x6a5238)); b.box('plain', 0, 0.38, 0, 0.06, 0.07, 0.16, C(0x4a4038)); },
    whip: function (b) { b.aux = 0; b.cyl('plain', [0, -0.05, 0], [0, 0.75, 0], 0.011, 0.007, 4, C(0x5a4630)); b.beam('plain', [0, 0.75, 0], [0, 0.45, 0.3], 0.006, 0.006, C(0x3a3028)); },
    umbrellaShut: function (b) { b.aux = 0; b.cyl('plain', [0, -0.5, 0], [0, 0.5, 0], 0.03, 0.012, 5, C(0x8a7048)); },
    rope: function (b) { b.aux = 0; b.cyl('plain', [0, 0, 0], [0, 0, 1], 0.012, 0.012, 4, C(0x6a5a40)); },
    broom: function (b) { b.aux = 0; b.cyl('plain', [0, -0.3, 0], [0, 0.6, 0], 0.012, 0.012, 4, C(0x6a5238)); b.loft('plain', [ering(-0.3, 0.02, 0.02, 5), ering(-0.7, 0.1, 0.04, 5)], { col: C(0x9a8358) }); }
  };
  F.propPool = function (name) { return Q.pool('p_' + name, props[name]); };

  var PL = {};
  function pools() {
    if (PL.torsoS) return PL;
    PL.torsoS = Q.pool('torsoS', gTorsoS); PL.torsoL = Q.pool('torsoL', gTorsoL); PL.torsoW = Q.pool('torsoW', gTorsoW); PL.torsoB = Q.pool('torsoB', gTorsoB);
    PL.uarm = Q.pool('uarm', gUarm); PL.uarmSkin = Q.pool('uarmSkin', gUarmSkin);
    PL.fa = Q.pool('fa', gFa); PL.faW = Q.pool('faW', gFaW); PL.faSkin = Q.pool('faSkin', gFaSkin);
    PL.thigh = Q.pool('thigh', gThigh); PL.shin = Q.pool('shin', gShin); PL.shinBare = Q.pool('shinBare', gShinBare); PL.skirtLeg = Q.pool('skirtLeg', gSkirtLeg);
    ['futou', 'bun', 'wrap', 'douli', 'weimao', 'woman', 'child', 'bald'].forEach(function (n) { PL['h_' + n] = Q.pool('h_' + n, gHead(n, false)); });
    ['futou', 'bun', 'wrap', 'douli'].forEach(function (n) { PL['h_' + n + 'B'] = Q.pool('h_' + n + 'B', gHead(n, true)); });
    return PL;
  }

  // ---------- 衣着 ----------
  var ROBE = [0xe6dcc4, 0xd8c8a2, 0xcac2ae, 0x8f9a9a, 0x707c82, 0x9a7c5a, 0x6e5644, 0x8c8a68, 0xc8a88e, 0x4e4842, 0xb9a070, 0x7d8a78].map(C);
  var PALE = [0xe6dcc4, 0xdccfae, 0xcfc6b0, 0xd9cdb0, 0xc4b89a].map(C);
  var DARK = [0x4e4842, 0x5a4a3c, 0x6e5644, 0x54606a, 0x3e3a36].map(C);
  F.look = function (kind) {
    var k = { kind: kind, skin: 1, s: Q.rand(0.94, 1.05) };
    switch (kind) {
      case 'gentry': k.torso = 'torsoL'; k.fore = 'faW'; k.head = Q.pick(['futou', 'futou', 'futou', 'futouB', 'bun']); k.robe = Q.pick(ROBE.concat(PALE)); k.trou = Q.pick(PALE); k.hat = WHITE; break;
      case 'official': k.torso = 'torsoL'; k.fore = 'faW'; k.head = Q.pick(['futou', 'futouB']); k.robe = Q.pick([C(0x6a7a70), C(0x8a5a48), C(0x4e4842), C(0x74707a)]); k.trou = WHITE; k.hat = WHITE; break;
      case 'woman': k.torso = 'torsoW'; k.fore = 'faW'; k.head = 'woman'; k.robe = Q.pick([C(0xc8a88e), C(0xd8c8a2), C(0x9aa69a), C(0xb9a8a0), C(0xcab89a)]); k.trou = WHITE; k.hat = WHITE; k.s *= 0.95; break;
      case 'child': k.torso = 'torsoS'; k.fore = 'fa'; k.head = 'child'; k.robe = Q.pick(PALE.concat([C(0xb98a6a), C(0x8f9a9a)])); k.trou = Q.pick(PALE); k.hat = WHITE; k.s = Q.rand(0.52, 0.7); break;
      case 'monk': k.torso = 'torsoL'; k.fore = 'faW'; k.head = 'bald'; k.robe = Q.pick([C(0x8a7a5c), C(0x70685a)]); k.trou = WHITE; k.hat = WHITE; break;
      case 'traveler': k.torso = Q.chance(0.5) ? 'torsoL' : 'torsoS'; k.fore = 'fa'; k.head = Q.pick(['douli', 'douli', 'douliB', 'weimao']); k.robe = Q.pick(ROBE); k.trou = Q.pick(PALE); k.hat = Q.pick(PALE); break;
      case 'bare': k.torso = 'torsoB'; k.fore = 'faSkin'; k.uarm = 'uarmSkin'; k.shin = 'shinBare'; k.head = Q.pick(['bun', 'wrap', 'bunB']); k.robe = Q.pick(PALE); k.trou = Q.pick(PALE); k.hat = Q.pick(PALE); break;
      case 'boatman': k.torso = 'torsoS'; k.fore = Q.pick(['fa', 'faSkin']); k.shin = Q.pick(['shin', 'shinBare']); k.head = Q.pick(['bun', 'wrap', 'wrapB', 'bunB']); k.robe = Q.pick(PALE.concat([C(0x8f9a9a), C(0x9a7c5a)])); k.trou = Q.pick(PALE); k.hat = Q.pick(PALE.concat(DARK)); break;
      default: // labor
        k.torso = 'torsoS'; k.fore = Q.pick(['fa', 'fa', 'faSkin']); k.shin = Q.pick(['shin', 'shin', 'shinBare']);
        k.head = Q.pick(['bun', 'bun', 'wrap', 'wrap', 'bunB', 'wrapB', 'futou', 'douli']);
        k.robe = Q.pick(PALE.concat(PALE, [C(0x8f9a9a), C(0x9a7c5a), C(0x707c82), C(0x8c8a68), C(0x6e5644)])); k.trou = Q.pick(PALE); k.hat = Q.pick(PALE.concat(DARK, [C(0x707c82)]));
    }
    k.robe = Q.jit(k.robe, 0.06);
    return k;
  };
  // 街上行人的随机身份
  F.anyLook = function () {
    var r = Q.rand();
    return F.look(r < 0.46 ? 'labor' : r < 0.74 ? 'gentry' : r < 0.82 ? 'traveler' : r < 0.88 ? 'woman' : r < 0.93 ? 'child' : r < 0.96 ? 'official' : r < 0.98 ? 'monk' : 'bare');
  };

  // ---------- 姿态 ----------
  // J: y(髋高偏移) fz lean twist roll hY hP | 左臂 alp alr ale ali 右臂 arp arr are ari | 左腿 llh llk lls 右腿 lrh lrk lrs | pa pb(随身物动画)
  function J0() { return { y: 0, fz: 0, lean: 0, twist: 0, roll: 0, hY: 0, hP: 0, alp: 0, alr: 0.08, ale: 0.15, ali: 0, arp: 0, arr: 0.08, are: 0.15, ari: 0, llh: 0, llk: 0, lls: 0.02, lrh: 0, lrk: 0, lrs: 0.02, pa: 0, pb: 0 }; }
  function reset(J) { J.y = 0; J.fz = 0; J.lean = 0; J.twist = 0; J.roll = 0; J.hY = 0; J.hP = 0; J.alp = 0; J.alr = 0.08; J.ale = 0.15; J.ali = 0; J.arp = 0; J.arr = 0.08; J.are = 0.15; J.ari = 0; J.llh = 0; J.llk = 0; J.lls = 0.02; J.lrh = 0; J.lrk = 0; J.lrs = 0.02; J.pa = 0; J.pb = 0; }
  var sin = Math.sin, cos = Math.cos, abs = Math.abs, max = Math.max;
  function legsWalk(J, ph, A, K) {
    var s = sin(ph);
    J.llh = A * s; J.lrh = -A * s;
    J.llk = max(0, cos(ph + 0.4)) * K + 0.06; J.lrk = max(0, -cos(ph + 0.4)) * K + 0.06;
    J.y = -0.035 * (1 - abs(cos(ph))) * (A / 0.5);
  }
  var POSE = F.POSE = {
    walk: function (t, J, e) {
      var ph = t * e.cad; legsWalk(J, ph, 0.5, 0.75);
      var s = sin(ph); J.alp = -0.42 * s; J.arp = 0.42 * s; J.ale = 0.25 + 0.1 * s; J.are = 0.25 - 0.1 * s;
      J.lean = 0.06; J.twist = 0.07 * s; J.hY = sin(t * 0.37 + e.ph) * 0.3;
    },
    stroll: function (t, J, e) { // 袖手缓行
      var ph = t * e.cad; legsWalk(J, ph, 0.38, 0.5);
      J.alp = J.arp = 0.3; J.ale = J.are = 1.55; J.ali = J.ari = 0.75; J.hY = sin(t * 0.3 + e.ph) * 0.45; J.lean = 0.03;
    },
    walkCarry: function (t, J, e) { // 挑担：一手扶扁担
      var ph = t * e.cad; legsWalk(J, ph, 0.46, 0.7);
      var s = sin(ph); J.arp = 1.15; J.are = 2.0; J.ari = 0.25; J.alp = -0.4 * s; J.ale = 0.3;
      J.lean = 0.1; J.pa = sin(ph * 2) * 0.05; J.pb = s * 0.06; J.twist = 0.05 * s;
    },
    walkShoulder: function (t, J, e) { // 扛货（麻袋、包袱在肩背）
      var ph = t * e.cad; legsWalk(J, ph, 0.42, 0.7);
      J.lean = 0.42; J.alp = 2.5; J.ale = 1.1; J.arp = 2.4; J.are = 1.2; J.hP = 0.1; J.twist = 0.05 * sin(ph);
    },
    walkBack: function (t, J, e) { // 背篓、背包袱赶路
      var ph = t * e.cad; legsWalk(J, ph, 0.48, 0.72);
      var s = sin(ph); J.lean = 0.2; J.alp = 0.5; J.ale = 1.7; J.ali = 0.3; J.arp = 0.35 * s; J.are = 0.3; J.hP = -0.12;
    },
    walkStaff: function (t, J, e) {
      var ph = t * e.cad; legsWalk(J, ph, 0.4, 0.6);
      var s = sin(ph); J.arp = 0.7 + 0.25 * s; J.are = 0.7; J.alp = -0.3 * s; J.lean = 0.14; J.pa = -0.5 - 0.25 * s;
    },
    walkWhip: function (t, J, e) { // 赶车、赶牲口
      var ph = t * e.cad; legsWalk(J, ph, 0.46, 0.7);
      var s = sin(ph), w = Q.smooth(0.6, 1, sin(t * 1.3 + e.ph));
      J.arp = 0.9 + w * 1.2; J.are = 0.9 - w * 0.5; J.alp = -0.4 * s; J.lean = 0.08; J.pa = 0.4 - w * 1.0;
    },
    carryPole: function (t, J, e) { // 抬轿：双手扶肩上的轿杆
      var ph = t * e.cad; legsWalk(J, ph, 0.42, 0.65);
      J.alp = J.arp = 1.5; J.ale = J.are = 2.1; J.ali = J.ari = -0.1; J.lean = 0.12; J.y -= 0.02;
    },
    push: function (t, J, e) { // 推车
      var ph = t * e.cad; legsWalk(J, ph, 0.5, 0.7);
      J.lean = 0.5; J.alp = J.arp = 0.95; J.ale = J.are = 0.35; J.hP = 0;
    },
    pullShaft: function (t, J, e) { // 驾辕拉车
      var ph = t * e.cad; legsWalk(J, ph, 0.5, 0.7);
      J.lean = 0.45; J.alp = J.arp = -0.5; J.ale = J.are = 0.3; J.alr = J.arr = 0.35; J.hP = 0;
    },
    run: function (t, J, e) {
      var ph = t * e.cad; legsWalk(J, ph, 0.85, 1.3);
      var s = sin(ph); J.alp = -0.9 * s; J.arp = 0.9 * s; J.ale = J.are = 1.3; J.lean = 0.3; J.y += 0.03;
    },
    stand: function (t, J, e) {
      J.lean = 0.02 + 0.015 * sin(t * 0.7 + e.ph); J.hY = sin(t * 0.33 + e.ph) * 0.5; J.hP = 0.05 * sin(t * 0.5 + e.ph * 2);
      J.alp = 0.05 * sin(t * 0.6 + e.ph); J.arp = -J.alp; J.twist = sin(t * 0.21 + e.ph) * 0.12;
    },
    sleeves: function (t, J, e) { // 袖手而立
      J.alp = J.arp = 0.32; J.ale = J.are = 1.55; J.ali = J.ari = 0.78;
      J.hY = sin(t * 0.3 + e.ph) * 0.55; J.lean = 0.03 + 0.02 * sin(t * 0.5 + e.ph); J.twist = sin(t * 0.17 + e.ph) * 0.15;
    },
    talk: function (t, J, e) { // 交谈比划
      var g = Q.smooth(-0.2, 0.5, sin(t * 0.45 + e.ph));
      J.arp = 0.25 + g * (0.75 + 0.2 * sin(t * 3.1 + e.ph)); J.are = 0.3 + g * (0.9 + 0.3 * sin(t * 2.3)); J.arr = 0.1 + g * 0.25;
      J.alp = 0.2; J.ale = 0.5 + 0.15 * sin(t * 0.9 + e.ph);
      J.hY = sin(t * 0.5 + e.ph) * 0.25; J.hP = 0.06 * sin(t * 2.1 + e.ph); J.lean = 0.05 + 0.03 * sin(t * 0.8 + e.ph);
    },
    point: function (t, J, e) { // 指点、招呼
      J.arp = 1.35 + 0.18 * sin(t * 2.4 + e.ph); J.are = 0.15 + 0.2 * max(0, sin(t * 4.2 + e.ph)); J.arr = 0.2;
      J.alp = 0.3; J.ale = 0.9; J.lean = 0.16 + 0.06 * sin(t * 1.2 + e.ph); J.hP = -0.08; J.hY = 0.2 * sin(t * 0.7 + e.ph);
    },
    wave: function (t, J, e) { // 挥臂呼喊
      var a = sin(t * 3.3 + e.ph), c = sin(t * 2.7 + e.ph * 1.7);
      J.alp = 2.3 + 0.35 * a; J.ale = 0.4 + 0.3 * c; J.alr = 0.4; J.arp = 2.0 + 0.4 * c; J.are = 0.5 + 0.3 * a; J.arr = 0.45;
      J.lean = 0.12 + 0.06 * a; J.hP = -0.15; J.twist = 0.15 * c; J.y = 0.01 * a;
    },
    lean: function (t, J, e) { // 凭栏俯看
      J.lean = 0.3 + 0.04 * sin(t * 0.5 + e.ph); J.alp = J.arp = 0.95; J.ale = J.are = 0.75; J.ali = J.ari = 0.25;
      J.hP = 0.12 + 0.1 * sin(t * 0.4 + e.ph); J.hY = 0.5 * sin(t * 0.27 + e.ph); J.fz = -0.12; J.llh = 0.1; J.lrh = -0.25; J.lrk = 0.3;
    },
    sit: function (t, J, e) { // 坐凳
      J.y = (e.seat || 0.46) - 0.73; J.llh = J.lrh = 1.5; J.llk = J.lrk = 1.45; J.lls = J.lrs = 0.12;
      J.lean = 0.08 + 0.03 * sin(t * 0.6 + e.ph); J.alp = J.arp = 0.55; J.ale = J.are = 1.0; J.ali = J.ari = 0.15;
      J.hY = 0.4 * sin(t * 0.35 + e.ph); J.fz = -0.1;
    },
    sitDrink: function (t, J, e) { // 坐着喝茶饮酒
      POSE.sit(t, J, e);
      var g = Q.smooth(0.55, 0.9, sin(t * 0.6 + e.ph));
      J.arp = 0.75 + g * 0.55; J.are = 1.0 + g * 1.25; J.ari = 0.15 + g * 0.25; J.hP = -g * 0.22; J.alp = 0.7; J.ale = 0.95;
    },
    sitTalk: function (t, J, e) {
      POSE.sit(t, J, e);
      var g = Q.smooth(-0.1, 0.6, sin(t * 0.5 + e.ph));
      J.alp = 0.6 + g * 0.5; J.ale = 1.0 + g * 0.5 * sin(t * 2.6 + e.ph); J.alr = 0.1 + g * 0.3; J.lean = 0.16 + 0.05 * sin(t * 0.9 + e.ph);
    },
    sitGround: function (t, J, e) { // 席地而坐（树下、粮包上）
      J.y = (e.seat || 0.12) - 0.8; J.llh = 1.35; J.lrh = 1.1; J.llk = 0.5; J.lrk = 1.5; J.lls = 0.25; J.lrs = 0.3;
      J.lean = 0.22; J.alp = 0.6; J.ale = 0.9; J.arp = 0.3; J.are = 0.6; J.hY = 0.5 * sin(t * 0.3 + e.ph);
    },
    squat: function (t, J, e) { // 蹲着干活
      J.y = -0.42; J.llh = J.lrh = 2.0; J.llk = J.lrk = 2.4; J.lls = J.lrs = 0.3; J.lean = 0.55;
      var a = sin(t * 2 + e.ph); J.alp = 0.9 + 0.2 * a; J.arp = 0.9 - 0.2 * a; J.ale = J.are = 0.6; J.hP = 0.2;
    },
    bend: function (t, J, e) { // 弯腰搬、舀水
      var a = 0.5 + 0.5 * sin(t * 1.1 + e.ph);
      J.lean = 0.7 + 0.5 * a; J.alp = J.arp = 1.2 + 0.4 * a; J.ale = J.are = 0.3; J.llk = J.lrk = 0.35 + 0.2 * a; J.llh = J.lrh = 0.3; J.hP = -0.3; J.fz = -0.15;
    },
    haul: function (t, J, e) { // 拉纤：身体前倾，一步一顿
      var a = sin(t * 1.5 + e.ph), g = max(0, a);
      J.lean = 0.95 + 0.1 * g; J.llh = 0.75 + 0.1 * g; J.llk = 0.9 - 0.2 * g; J.lrh = -0.5 - 0.1 * g; J.lrk = 0.12;
      J.alp = -0.5; J.ale = 0.2; J.arp = 0.9; J.are = 1.9; J.ari = 0.4; J.hP = -0.1; J.y = -0.1; J.fz = 0.05 * g;
    },
    punt: function (t, J, e) { // 撑篙
      var a = 0.5 + 0.5 * sin(t * 1.25 + e.ph);
      J.lean = 0.12 + 0.5 * a; J.twist = -0.5; J.llh = 0.45; J.llk = 0.35 + 0.2 * a; J.lrh = -0.35; J.lrk = 0.1;
      J.arp = 1.5 - 0.5 * a; J.are = 0.5; J.ari = 0.5; J.alp = 0.75 - 0.35 * a; J.ale = 0.9; J.ali = -0.2;
      J.pa = 0.55 + 0.5 * a; J.hP = -0.15;
    },
    scull: function (t, J, e) { // 摇橹：数人合力推拉
      var a = sin(t * 1.4 + (e.sync || 0));
      J.twist = 0.35 * a; J.lean = 0.25 + 0.12 * a; J.alp = J.arp = 1.25 + 0.2 * a; J.ale = J.are = 0.55 - 0.25 * a;
      J.llh = 0.3; J.lrh = -0.3; J.llk = 0.2 + 0.1 * a; J.lrk = 0.15; J.fz = 0.12 * a; J.lls = J.lrs = 0.1;
    },
    work: function (t, J, e) { // 抡锤、劈砍
      var a = sin(t * 4.2 + e.ph), up = max(0, a);
      J.lean = 0.5 - 0.2 * up; J.arp = 0.7 + 1.5 * up; J.are = 0.9 - 0.4 * up; J.alp = 0.8; J.ale = 0.6; J.llh = 0.35; J.lrh = -0.2; J.llk = 0.3; J.pa = -0.3 + up * 0.8;
    },
    ride: function (t, J, e) { // 骑乘
      J.y = -0.34; J.llh = J.lrh = 1.0; J.lls = J.lrs = 0.5; J.llk = J.lrk = 0.9; J.lean = 0.1;
      J.alp = J.arp = 0.6; J.ale = J.are = 0.85; J.ali = J.ari = 0.25; J.hY = 0.3 * sin(t * 0.3 + e.ph);
    },
    rideSide: function (t, J, e) { POSE.ride(t, J, e); J.alp = 0.3; J.ale = 1.5; J.ali = 0.7; J.arp = 0.3; J.are = 1.5; J.ari = 0.7; },
    tell: function (t, J, e) { // 说书、叫卖：大幅比划
      var a = sin(t * 1.7 + e.ph), c = sin(t * 2.3 + e.ph * 2);
      J.arp = 1.1 + 0.6 * a; J.are = 0.6 + 0.4 * c; J.arr = 0.3; J.alp = 0.7 + 0.4 * c; J.ale = 0.9 + 0.3 * a; J.alr = 0.25;
      J.twist = 0.3 * sin(t * 0.6 + e.ph); J.lean = 0.08 + 0.05 * a; J.hY = 0.3 * sin(t * 0.8); J.hP = -0.05;
    },
    bow: function (t, J, e) { // 作揖寒暄
      var g = Q.smooth(0.2, 0.8, sin(t * 0.7 + e.ph));
      J.lean = 0.1 + 0.45 * g; J.alp = J.arp = 0.9 + 0.2 * g; J.ale = J.are = 1.2; J.ali = J.ari = 0.6; J.hP = 0.15 * g;
    },
    idleHold: function (t, J, e) { // 站着端着东西
      J.alp = J.arp = 0.55; J.ale = J.are = 1.25; J.ali = J.ari = 0.1; J.hY = 0.4 * sin(t * 0.4 + e.ph); J.lean = 0.04;
    }
  };

  // ---------- 绘制 ----------
  var R = M.make(), P = M.make(), Tm = M.make(), Hm = M.make(), A1 = M.make(), A2 = M.make(), L1 = M.make(), L2 = M.make(), Pm = M.make();
  var J = J0(), po = {}, HALF = Math.PI / 2;
  // 在给定根矩阵上画一个人
  F.drawBody = function (e, root, t) {
    var k = e.look, pl = PL;
    reset(J); e.pose(t, J, e);
    M.tr(P, root, 0, 0.8 + J.y, J.fz);
    if (J.roll) M.rz(P, P, J.roll);
    // 躯干
    M.rx(Tm, P, J.lean); if (J.twist) M.ry(Tm, Tm, J.twist);
    put(pl[k.torso], Tm, k.robe);
    // 头
    M.tr(Hm, Tm, 0, 0.585, 0); if (J.hY) M.ry(Hm, Hm, J.hY); M.rx(Hm, Hm, J.hP - J.lean * 0.7);
    put(pl['h_' + k.head], Hm, k.hat);
    var ua = pl[k.uarm || 'uarm'], fa = pl[k.fore], uc = k.uarm ? k.robe : k.robe;
    var far = F.far;   // 远眺时人只有几个像素：省去手臂与大腿
    // 左臂
    M.tr(A1, Tm, 0.2, 0.47, 0); M.rz(A1, A1, J.alr); M.rx(A1, A1, -J.alp); if (!far) put(ua, A1, uc);
    M.tr(A2, A1, 0, -0.27, 0); if (J.ali) M.ry(A2, A2, -J.ali); M.rx(A2, A2, -J.ale); if (!far) put(fa, A2, k.robe);
    if (e.propL) drawProp(e, e.propL, A2, Tm, t);
    // 右臂
    M.tr(A1, Tm, -0.2, 0.47, 0); M.rz(A1, A1, -J.arr); M.rx(A1, A1, -J.arp); if (!far) put(ua, A1, uc);
    M.tr(A2, A1, 0, -0.27, 0); if (J.ari) M.ry(A2, A2, J.ari); M.rx(A2, A2, -J.are); if (!far) put(fa, A2, k.robe);
    if (e.prop) drawProp(e, e.prop, A2, Tm, t);
    // 腿
    var long = k.torso === 'torsoL' || k.torso === 'torsoW', sh = long ? pl.skirtLeg : pl[k.shin || 'shin'];
    var damp = long ? 0.55 : 1;
    M.tr(L1, P, 0.085, 0, 0); M.rz(L1, L1, J.lls); M.rx(L1, L1, -J.llh * damp); if (!long && !far) put(pl.thigh, L1, k.trou);
    M.tr(L2, L1, 0, -0.4, 0); M.rx(L2, L2, J.llk * damp); put(sh, L2, k.trou);
    M.tr(L1, P, -0.085, 0, 0); M.rz(L1, L1, -J.lrs); M.rx(L1, L1, -J.lrh * damp); if (!long && !far) put(pl.thigh, L1, k.trou);
    M.tr(L2, L1, 0, -0.4, 0); M.rx(L2, L2, J.lrk * damp); put(sh, L2, k.trou);
    if (e.propB) drawProp(e, e.propB, A2, Tm, t);
  };
  function drawProp(e, pr, hand, torso, t) {
    var m = Pm;
    switch (pr.at) {
      case 'shoulder': M.tr(m, torso, pr.side * 0.13, 0.56 + J.pa, 0); if (J.pb) M.ry(m, m, J.pb); if (pr.rx) M.rx(m, m, pr.rx); break;
      case 'back': M.tr(m, torso, 0, pr.y === undefined ? 0.28 : pr.y, -0.2); if (pr.rx) M.rx(m, m, pr.rx); break;
      case 'top': M.tr(m, torso, pr.x || 0, 0.66, pr.z || 0); if (pr.ry) M.ry(m, m, pr.ry); break;
      case 'chest': M.tr(m, torso, 0, 0.22, 0.3); break;
      case 'torso': M.tr(m, torso, pr.x || 0, pr.y || 0, pr.z || 0); M.rx(m, m, (pr.rx || 0) + J.pa); if (pr.rz) M.rz(m, m, pr.rz); break;
      default: M.tr(m, hand, 0, -0.29, 0.02); M.rx(m, m, (pr.rx === undefined ? 1.2 : pr.rx) + J.pa); if (pr.rz) M.rz(m, m, pr.rz);
    }
    if (pr.s) M.sc(m, m, pr.s);
    put(pr.pool, m, pr.col || WHITE);
  }
  function mkProp(p) {
    if (!p) return null;
    if (typeof p === 'string') p = { name: p };
    var d = { danzi: { at: 'shoulder', side: -1 }, bundle: { at: 'back' }, backBasket: { at: 'back', y: 0.3 }, sack: { at: 'top', z: -0.05, ry: 1.57 }, staff: { at: 'hand', rx: 0.3 },
      longPole: { at: 'torso', x: -0.24, y: 0.42, z: 0.3, rx: 0 }, fan: { at: 'hand', rx: 1.9 }, stickBundle: { at: 'shoulder', side: -1 }, box: { at: 'chest' }, tray: { at: 'chest' },
      cup: { at: 'hand', rx: 1.5 }, hammer: { at: 'hand', rx: 1.4 }, whip: { at: 'hand', rx: 1.0 }, umbrellaShut: { at: 'shoulder', side: 1, rx: 1.2 }, broom: { at: 'hand', rx: 0.4 } }[p.name] || {};
    var r = { pool: F.propPool(p.name), col: p.col || Q.jit(Q.pick([C(0xb9a070), C(0xa9764a), C(0xd8c8a2), C(0x8c8a68), C(0x9a7c5a)]), 0.1) };
    for (var k in d) r[k] = d[k]; for (k in p) if (k !== 'name' && k !== 'col') r[k] = p[k];
    r.pool.need++;
    return r;
  }
  /* 建一个人。o: {x,z,y,yaw | path,s0,speed,lat,dir | parent(带 m 的对象),lx,ly,lz}, look, pose, prop, propL, propB, seat, sync */
  F.person = function (o) {
    var pl = pools();
    var e = {
      look: typeof o.look === 'string' ? F.look(o.look) : (o.look || F.anyLook()),
      pose: typeof o.pose === 'string' ? POSE[o.pose] : (o.pose || POSE.stand),
      x: o.x || 0, y: o.y || 0, z: o.z || 0, yaw: o.yaw || 0, ph: o.ph === undefined ? Q.rand(100) : o.ph,
      path: o.path || null, s0: o.s0 || 0, speed: o.speed || 0, lat: o.lat || 0, dir: o.dir || 1, parent: o.parent || null,
      seat: o.seat, sync: o.sync, noDraw: o.noDraw
    };
    if (o.scale) e.look.s = o.scale;
    e.cad = (e.speed || 1.0) / (0.62 * e.look.s) * Math.PI;   // 步频
    e.prop = mkProp(o.prop); e.propL = mkProp(o.propL); e.propB = mkProp(o.propB);
    if (e.prop && e.prop.at === 'back') { e.propB = e.prop; e.prop = null; }
    var k = e.look;
    pl[k.torso].need++; pl['h_' + k.head].need++; pl[k.uarm || 'uarm'].need += 2; pl[k.fore].need += 2;
    var long = k.torso === 'torsoL' || k.torso === 'torsoW';
    if (long) pl.skirtLeg.need += 2; else { pl.thigh.need += 2; pl[k.shin || 'shin'].need += 2; }
    e.draw = drawPerson;
    F.count = (F.count || 0) + 1;
    if (!o.noEnt) Q.addEnt(e);
    return e;
  };
  function drawPerson(t, x0, x1) {
    var e = this, s = e.look.s;
    if (e.path) {
      var L = e.path.len, d = (e.s0 + e.speed * t) % L;
      e.path.at(d, e.lat, e.dir, po);
      if (po.x < x0 || po.x > x1) return false;
      var f = d < 2 ? d / 2 : (L - d < 2 ? (L - d) / 2 : 1);
      M.pose(R, po.x, po.y, po.z, po.yaw, s * (0.25 + 0.75 * f));
    } else if (e.parent) {
      var pm = e.parent.m; if (pm[9] < x0 - 20 || pm[9] > x1 + 20) return false;
      M.pose(R, e.x, e.y, e.z, e.yaw, s); M.mul(R, pm, R);
    } else {
      if (e.x < x0 || e.x > x1) return false;
      M.pose(R, e.x, e.y, e.z, e.yaw, s);
    }
    F.drawBody(e, R, t);
    return true;
  }

  // ---------- 成组摆放的便捷函数 ----------
  // 路上行人：在 path 上随机撒 n 个来回走的人
  F.walkers = function (path, n, o) {
    o = o || {};
    for (var i = 0; i < n; i++) {
      var dir = Q.chance(0.5) ? 1 : -1, look = o.look ? F.look(Q.pick(o.look)) : F.anyLook();
      var r = Q.rand(), pose = 'walk', prop = null, propL = null;
      var kind = look.kind;
      if (kind === 'gentry' || kind === 'official' || kind === 'monk' || kind === 'woman') { pose = r < 0.5 ? 'stroll' : 'walk'; if (r > 0.85 && kind === 'gentry') prop = 'fan'; }
      else if (kind === 'child') pose = r < 0.4 ? 'run' : 'walk';
      else if (r < 0.26) { pose = 'walkCarry'; prop = 'danzi'; }
      else if (r < 0.38) { pose = 'walkBack'; prop = Q.pick(['backBasket', 'bundle']); }
      else if (r < 0.46) { pose = 'walkShoulder'; prop = 'sack'; }
      else if (r < 0.54) { pose = 'walkCarry'; prop = 'stickBundle'; }
      else if (r < 0.6) { pose = 'walkStaff'; prop = 'staff'; }
      var sp = pose === 'run' ? Q.rand(2.2, 2.8) : pose === 'stroll' ? Q.rand(0.55, 0.8) : Q.rand(0.85, 1.25);
      var hw = o.spread === undefined ? 0.75 : o.spread;
      F.person({ path: path, s0: Q.rand(path.len), speed: sp, dir: dir, lat: Q.rand(0.12, 1) * (o.hw || 3) * hw, look: look, pose: pose, prop: prop, propL: propL });
    }
  };
  // 站着的一小群人，围成圈交谈/围观
  F.cluster = function (x, z, n, o) {
    o = o || {};
    var r = o.r || (0.45 + n * 0.14), poses = o.poses || ['talk', 'sleeves', 'stand', 'talk', 'sleeves', 'point'];
    for (var i = 0; i < n; i++) {
      var a = i / n * 6.283 + Q.rand(-0.3, 0.3), rr = r * Q.rand(0.8, 1.15);
      var px = x + Math.cos(a) * rr, pz = z + Math.sin(a) * rr;
      var tx = o.face ? o.face[0] : x, tz = o.face ? o.face[1] : z;
      F.person({ x: px, z: pz, y: o.y || 0, yaw: Math.atan2(tx - px, tz - pz) + Q.rand(-0.25, 0.25), look: o.look ? F.look(Q.pick(o.look)) : F.anyLook(), pose: Q.pick(poses), prop: o.prop && Q.chance(0.3) ? Q.pick(o.prop) : null });
    }
  };
  // 一片面向同一处的看客
  F.audience = function (x0, z0, x1, z1, n, face, o) {
    o = o || {};
    for (var i = 0; i < n; i++) {
      var px = Q.rand(x0, x1), pz = Q.rand(z0, z1);
      F.person({ x: px, z: pz, y: W.deckY(px, pz), yaw: Math.atan2(face[0] - px, face[1] - pz) + Q.rand(-0.2, 0.2), look: o.look ? F.look(Q.pick(o.look)) : F.anyLook(), pose: Q.pick(o.poses || ['sleeves', 'stand', 'sleeves', 'talk', 'point']) });
    }
  };
  // 茶座酒座上的客人
  F.sitters = function (seats, p, o) {
    o = o || {};
    seats.forEach(function (s) {
      if (!Q.chance(p === undefined ? 0.7 : p)) return;
      var pose = Q.pick(o.poses || ['sitDrink', 'sitTalk', 'sit', 'sitDrink']);
      F.person({ x: s.p[0], y: s.p[1], z: s.p[2], yaw: s.yaw, look: F.look(Q.pick(o.look || ['gentry', 'gentry', 'labor', 'traveler', 'labor'])), pose: pose, seat: s.h || 0.46, prop: pose === 'sitDrink' ? 'cup' : null });
    });
  };
})();
