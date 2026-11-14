// ============================================================================
// 06-scenes.js — 按故宫本原画从卷首到卷尾逐段布景（已校准南北岸与铺面朝向）
// ============================================================================
(function (QM) {
  'use strict';

  QM.SECTIONS = [
    {
      id: 'rural',
      title: '第一段 · 郊野春色',
      xMin: 110,
      xMax: 264,
      desc: '开卷薄雾疏林，驮炭毛驴队踏过村桥，茅舍石碾与清明扫墓归来的轿队相映成趣。'
    },
    {
      id: 'river',
      title: '第二段 · 汴河虹桥',
      xMin: -60,
      xMax: 110,
      desc: '汴河漕船云集码头，纤夫逆流拉纤；虹桥飞架两岸，下方大漕船人字桅将触桥桁，桥上桥下齐声呼救。'
    },
    {
      id: 'city',
      title: '第三段 · 城门街市',
      xMin: -264,
      xMax: -60,
      desc: '驼队穿东角子门而出，城内孙羊正店彩楼欢门耸立，十字街口刘家沉檀、赵太丞家铺面百业兴旺。'
    }
  ];

  // 重要题签坐标（用于“题签”按钮显隐）
  QM.LANDMARKS = [
    { name: '驮炭毛驴队', x: 228, y: 3.2, z: 9 },
    { name: '村头茶棚茅舍', x: 174, y: 4.5, z: -4 },
    { name: '踏青归来轿队', x: 124, y: 3.4, z: 8 },
    { name: '古柳漕船码头', x: 96, y: 4.2, z: 3 },
    { name: '漕船船队码头', x: 64, y: 4.2, z: -2 },
    { name: '十千脚店', x: 34, y: 6.2, z: -11 },
    { name: '汴河虹桥', x: 5, y: 8.2, z: 0 },
    { name: '大漕船放桅险情', x: 18, y: 5.2, z: 2 },
    { name: '久住王员外家', x: -78, y: 6.2, z: -4 },
    { name: '东角子门', x: -115, y: 15.5, z: 6 },
    { name: '孙羊正店', x: -138, y: 12.6, z: -5 },
    { name: '刘家上色沉檀拣香', x: -168, y: 7.2, z: -4 },
    { name: '王家罗锦匹帛铺', x: -175, y: 6.0, z: 16 },
    { name: '赵太丞家', x: -222, y: 6.8, z: -4 }
  ];

  const SHIRTS = [
    0x3b4d5e, 0x735c43, 0xc9b99c, 0x626e58, 0xb08b53,
    0x554b42, 0x8d493b, 0x9e8c6e, 0x455853, 0xa89b84
  ];
  const pickShirt = () => SHIRTS[Math.floor(QM.rand() * SHIRTS.length)];
  const pickHat = () => {
    const r = QM.rand();
    if (r < 0.25) return 'putou';
    if (r < 0.48) return 'douli';
    if (r < 0.72) return 'scarf';
    return 'bun';
  };

  QM.populateWorld = function (scene, batch, em, bm) {
    // ------------------------------------------------------------------------
    // 一、第一段：郊野春色 (X = 264 -> 110)
    // ------------------------------------------------------------------------
    for (let i = 0; i < 36; i++) {
      const tx = 148 + QM.rand() * 108;
      const tz = (QM.rand() > 0.5 ? -1 : 1) * (15 + QM.rand() * 32);
      if (i % 3 === 0) QM.addOldWillow(batch, scene, tx, tz, 0.8 + QM.rand() * 0.4, i < 4);
      else QM.addBareTree(batch, tx, tz, 0.85 + QM.rand() * 0.5, i === 6 || i === 14);
    }

    // 驮炭毛驴队（5头毛驴 + 2名脚夫）
    for (let d = 0; d < 5; d++) {
      const dx = 238 - d * 3.5;
      const dz = 10.5 - d * 0.45;
      em.addAnimal({
        species: 'donkey',
        x: dx, z: dz,
        path: { x0: dx + 6, z0: dz + 0.4, x1: dx - 14, z1: dz - 0.8, t: d * 0.08, loop: false },
        speed: 0.75
      });
    }
    em.addPerson({ x: 241, z: 10.8, hat: 'douli', shirt: 0x735c43, prop: 'none', action: 'walk',
      path: { x0: 247, z0: 11.1, x1: 227, z1: 9.8, t: 0.05 }, speed: 0.75 });
    em.addPerson({ x: 222, z: 8.6, hat: 'douli', shirt: 0x554b42, prop: 'bundle', action: 'walk',
      path: { x0: 228, z0: 9.0, x1: 208, z1: 7.8, t: 0.12 }, speed: 0.75 });

    // 郊野小溪木桥与村头茅舍群（全朝 +Z 镜头侧）
    QM.addSimpleBridge(batch, 210, 7.2, 6.8, 3.0, Math.PI * 0.35, true);
    QM.addSongHouse(batch, scene, { x: 180, z: -6, w: 6.8, d: 4.8, h: 2.8, yaw: 0.12, thatch: true });
    QM.addSongHouse(batch, scene, { x: 170, z: -2, w: 7.4, d: 4.6, h: 2.9, yaw: -0.05, thatch: true, openShop: true, awning: true });
    QM.addSongHouse(batch, scene, { x: 162, z: -11, w: 6.2, d: 4.4, h: 2.7, yaw: 0.25, thatch: true });
    QM.addStoneMill(batch, 177, 1.5);
    QM.smokeEmitters.push({ x: 171, y: 3.8, z: -3.5 });

    for (let f = 0; f < 10; f++) {
      const fx = 165 + f * 1.8;
      batch.addBox('wood', 1.6, 0.9, 0.08, fx, QM.groundHeight(fx, 3.2) + 0.45, 3.2, 0, 0, 0, QM.PAL.bamboo);
    }
    for (let p = 0; p < 8; p++) {
      em.addPerson({
        x: 168 + (p % 4) * 1.8, z: 0.5 + Math.floor(p / 4) * 1.5,
        yaw: p % 2 === 0 ? 0.5 : -0.8, hat: pickHat(), shirt: pickShirt(),
        action: p < 4 ? 'sit' : 'talk'
      });
    }
    for (let pg = 0; pg < 5; pg++) {
      em.addAnimal({
        species: 'pig',
        x: 183 + pg * 1.1, z: 1.5 + (pg % 2) * 1.2,
        path: { x0: 182 + pg, z0: 1.4, x1: 186 + pg, z1: 3.1, t: pg * 0.2 }, speed: 0.5
      });
    }
    em.addAnimal({ species: 'dog', x: 173, z: 3.8, path: { x0: 172, z0: 3.8, x1: 178, z1: 4.5, t: 0.1 }, speed: 0.9 });

    // 疏柳春林
    for (let w = 0; w < 18; w++) {
      QM.addOldWillow(batch, scene, 118 + w * 2.4, -8 - (w % 4) * 7, 0.9 + (w % 3) * 0.2, w % 4 === 0);
    }
    QM.addBambooCluster(batch, 152, -16, 14);

    // 清明扫墓归来轿队（轿顶插柳枝）
    em.addSedan({ x: 125, z: 8.5, flower: true, path: { x0: 138, z0: 9.2, x1: 112, z1: 7.5, t: 0.2 }, speed: 0.9 });
    em.addPerson({ x: 127, z: 8.5, hat: 'scarf', shirt: 0x3b4d5e, action: 'walk', path: { x0: 140, z0: 9.2, x1: 114, z1: 7.5, t: 0.2 }, speed: 0.9 });
    em.addPerson({ x: 123, z: 8.5, hat: 'scarf', shirt: 0x3b4d5e, action: 'walk', path: { x0: 136, z0: 9.2, x1: 110, z1: 7.5, t: 0.2 }, speed: 0.9 });
    em.addAnimal({ species: 'horse', x: 131, z: 9.2, path: { x0: 144, z0: 9.8, x1: 118, z1: 8.2, t: 0.2 }, speed: 0.9 });
    em.addPerson({ x: 131, z: 9.2, hat: 'putou', shirt: 0x8d493b, action: 'ride', path: { x0: 144, z0: 9.8, x1: 118, z1: 8.2, t: 0.2 }, speed: 0.9 });
    for (let k = 0; k < 10; k++) {
      const kx = 148 - k * 3.5;
      em.addPerson({
        x: kx, z: 7.5 + (k % 3), hat: pickHat(), shirt: pickShirt(),
        prop: k % 3 === 0 ? 'pole' : 'bundle', action: 'walk',
        path: { x0: kx + 10, z0: 8, x1: kx - 12, z1: 7, t: k * 0.09 }, speed: 0.95
      });
    }

    // ------------------------------------------------------------------------
    // 二、第二段：汴河虹桥 (X = 110 -> -60)
    // ------------------------------------------------------------------------
    for (let bx = 108; bx >= -58; bx -= 5.5) {
      const rz = QM.riverCenterZ(bx);
      const rw = QM.riverHalfWidth(bx);
      batch.addCyl('wood', 0.14, 0.16, 2.2, 6, bx, QM.WATER_LEVEL + 0.4, rz + rw - 0.3, 0, 0, 0, QM.PAL.woodDark);
      batch.addCyl('wood', 0.14, 0.16, 2.2, 6, bx, QM.WATER_LEVEL + 0.4, rz - rw + 0.3, 0, 0, 0, QM.PAL.woodDark);
      if (Math.abs(bx - 5) > 10 && Math.abs(bx) % 11 < 5) {
        QM.addOldWillow(batch, scene, bx, rz - rw - 2.6, 1.0, bx > 30 && bx < 100);
        if (bx < 40) QM.addOldWillow(batch, scene, bx - 2, rz + rw + 3.0, 0.95, false);
      }
    }

    // 古柳漕船码头（x ≈ 96，停靠北岸 rz - rw + 4）
    [101, 90].forEach((bx, idx) => {
      const rz = QM.riverCenterZ(bx);
      const rw = QM.riverHalfWidth(bx);
      const northBank = rz - rw;
      bm.addBoat({ x: bx, z: northBank + 4.4, yaw: 0.25, type: 'grain', mastTilt: 1.38, hasPlank: true, plankSide: -1, bobAmp: 0.04 });
      for (let m = 0; m < 5; m++) {
        em.addPerson({
          x: bx + (m - 2) * 1.4, z: northBank - 1.5 - (m % 2) * 1.4,
          hat: 'scarf', shirt: pickShirt(), prop: 'sack', action: 'walk',
          path: { x0: bx, z0: northBank + 1.2, x1: bx + 2, z1: northBank - 5.5, t: m * 0.2 }, speed: 1.05
        });
      }
      if (idx === 1) {
        em.addPerson({ x: bx - 1.5, z: northBank - 3.2, yaw: 0.2, hat: 'putou', shirt: 0x3b4d5e, action: 'sit' });
      }
    });

    // 漕船船队码头（x ≈ 74 .. 52）：五艘万石漕船停泊北岸凹湾，北岸为私家粮仓与临河小饭铺
    for (let b = 0; b < 5; b++) {
      const bx = 74 - b * 5.2;
      const rz = QM.riverCenterZ(bx);
      const rw = QM.riverHalfWidth(bx);
      bm.addBoat({
        x: bx, z: rz - rw + 4.6 + (b % 2) * 1.4, yaw: 0.16,
        type: 'grain', mastTilt: 1.36, hasPlank: b % 2 === 0, plankSide: -1, bobAmp: 0.045
      });
    }
    QM.addSongHouse(batch, scene, { x: 76, z: -12.5, w: 8.8, d: 5.5, h: 3.4, yaw: 0.08, openShop: true, awning: true, flagText: '酒' });
    QM.addSongHouse(batch, scene, { x: 64, z: -13.0, w: 9.2, d: 5.8, h: 3.6, yaw: 0.05 });
    QM.addSongHouse(batch, scene, { x: 52, z: -12.0, w: 8.2, d: 5.2, h: 3.3, yaw: 0.08, openShop: true, awning: true });

    // 码头发筹监工与 22 名卸粮力夫
    em.addPerson({ x: 63, z: -6.2, yaw: 0, hat: 'putou', shirt: 0x8d493b, action: 'talk' });
    for (let k = 0; k < 22; k++) {
      const kx = 75 - k * 1.1;
      const nb = QM.riverCenterZ(kx) - QM.riverHalfWidth(kx);
      em.addPerson({
        x: kx, z: nb - 1.6 - (k % 3) * 1.0,
        hat: k % 2 === 0 ? 'douli' : 'scarf', shirt: pickShirt(),
        prop: k % 3 === 0 ? 'pole' : 'sack', action: 'walk',
        path: { x0: kx, z0: nb + 0.8, x1: kx - 2.2, z1: nb - 6.8, t: (k * 0.13) % 1 }, speed: 1.1
      });
    }

    // 河心逆流而上的漕船 + 南岸（近景 +Z 岸堤）五名纤夫拉纤
    bm.addBoat({ x: 42, z: QM.riverCenterZ(42) + 1.5, yaw: 0.12, type: 'grain', mastTilt: 1.34, hasOar: true, bobAmp: 0.07 });
    for (let tr = 0; tr < 5; tr++) {
      const tx = 54 + tr * 1.7;
      const tz = QM.riverCenterZ(tx) + QM.riverHalfWidth(tx) + 1.9;
      em.addPerson({
        x: tx, z: tz, yaw: 1.52, hat: 'douli', shirt: 0xc9b99c, action: 'haul',
        path: { x0: tx - 2.2, z0: tz, x1: tx + 2.2, z1: tz, t: 0.5 }, speed: 0.35
      });
    }
    batch.addBox('wood', 18.0, 0.04, 0.04, 49, 0.3, QM.riverCenterZ(49) + 10.5, 0, -0.32, 0, 0x8a7554);

    // 虹桥东首北岸“十千脚店”与临河茶坊（正面向 +Z 河面与道路）
    QM.addSongHouse(batch, scene, {
      x: 34, z: -13.5, w: 9.0, d: 5.8, h: 3.4, floors: 2, yaw: -0.06,
      openShop: true, awning: true, chazi: true,
      signText: '十千脚店', signVertical: false, flagText: '新酒'
    });
    QM.addSongHouse(batch, scene, {
      x: 22, z: -13.5, w: 7.4, d: 5.0, h: 3.2, yaw: -0.08, openShop: true, awning: true, flagText: '茶'
    });
    QM.smokeEmitters.push({ x: 35, y: 7.2, z: -15.0 });
    for (let st = 0; st < 8; st++) {
      em.addPerson({ x: 30.5 + st * 1.0, z: -9.5 + (st % 2) * 0.9, yaw: 0.1, hat: pickHat(), shirt: pickShirt(), action: 'sit' });
    }

    // 【全画核心高潮】汴河虹桥 (x = 5, z = 0) + 桥下险情大漕船
    QM.addRainbowBridge(batch, 5, 0);
    bm.addBoat({
      x: 18, z: QM.riverCenterZ(18) + 0.5, yaw: 0.16,
      type: 'grain', mastTilt: 0.56, hasOar: true, isClimax: true, bobAmp: 0.09
    });
    for (let cw = 0; cw < 9; cw++) {
      em.addPerson({
        x: 14 + cw * 1.1, z: QM.riverCenterZ(18) + (cw % 2 - 0.5) * 1.2,
        yOffset: () => QM.WATER_LEVEL + 1.45,
        yaw: cw < 4 ? -1.4 : 1.3, hat: 'scarf', shirt: pickShirt(),
        action: cw % 2 === 0 ? 'row' : 'talk'
      });
    }

    QM.addMarketStall(batch, 2.2, -3.5, true, 0xa88f5a);
    QM.addMarketStall(batch, 8.2, 4.2, true, 0x8f4e3c);
    const bridgeY = (bx, bz) => {
      const h = QM.bridgeHeightAt ? QM.bridgeHeightAt(bx, bz) : null;
      return h !== null ? h : QM.groundHeight(bx, bz);
    };
    em.addSedan({ x: 5.8, z: -1.8, yaw: 0.18, yOffset: bridgeY });
    em.addAnimal({ species: 'horse', x: 4.5, z: 2.0, yaw: 3.0, yOffset: bridgeY });
    em.addPerson({ x: 4.5, z: 2.0, yaw: 3.0, hat: 'putou', shirt: 0x8d493b, action: 'ride', yOffset: bridgeY });

    for (let bp = 0; bp < 32; bp++) {
      const onRail = bp < 18;
      const bx = onRail ? (bp < 9 ? 2.2 : 7.8) : 3.2 + (bp % 4) * 1.1;
      const bz = -9.5 + (bp % 11) * 1.85;
      em.addPerson({
        x: bx, z: bz, yOffset: bridgeY,
        yaw: onRail ? (bx < 5 ? -1.55 : 1.55) : (bp % 2 === 0 ? 0.1 : -3.0),
        hat: pickHat(), shirt: pickShirt(),
        prop: !onRail && bp % 5 === 0 ? 'pole' : 'none',
        action: onRail ? 'talk' : 'walk',
        path: onRail ? null : { x0: bx, z0: -8.5, x1: bx, z1: 8.5, t: (bp * 0.11) % 1 },
        speed: 0.75
      });
    }

    // 虹桥下游客船、家船
    bm.addBoat({ x: -12, z: QM.riverCenterZ(-12) - 0.8, yaw: 0.28, type: 'passenger', mastTilt: 1.38, hasOar: true, bobAmp: 0.06 });
    bm.addBoat({ x: -27, z: QM.riverCenterZ(-27) + 2.5, yaw: 0.34, type: 'grain', mastTilt: 1.40, bobAmp: 0.05 });
    bm.addBoat({ x: -38, z: QM.riverCenterZ(-38) - 2.2, yaw: 0.25, type: 'passenger', mastTilt: 1.38, bobAmp: 0.05 });
    bm.addBoat({ x: -49, z: QM.riverCenterZ(-49) + 1.8, yaw: 0.30, type: 'skiff', hasOar: true, bobAmp: 0.07 });
    bm.addBoat({ x: -64, z: QM.riverCenterZ(-64) - 1.0, yaw: 0.22, type: 'skiff', hasOar: true, bobAmp: 0.06 });

    // 桥西大道南侧沿街铺面（朝北 yaw = Math.PI 面向大街）
    for (let sx = -14; sx >= -54; sx -= 10) {
      QM.addSongHouse(batch, scene, {
        x: sx, z: 18.5, w: 8.2, d: 5.2, h: 3.3, yaw: Math.PI, openShop: true, awning: sx % 20 === -14,
        flagText: sx === -24 ? '酒' : undefined
      });
    }
    em.addCart({ type: 'barrow', x: -16, z: 11.5, path: { x0: -6, z0: 11, x1: -44, z1: 12.5, t: 0.3 }, speed: 0.9 });
    em.addCart({ type: 'covered', x: -36, z: 10.5, path: { x0: -20, z0: 10.5, x1: -72, z1: 9.0, t: 0.15 }, speed: 0.65 });
    em.addAnimal({ species: 'ox', x: -33.2, z: 10.5, path: { x0: -17.2, z0: 10.5, x1: -69.2, z1: 9.0, t: 0.15 }, speed: 0.65 });

    // ------------------------------------------------------------------------
    // 三、第三段：城门街市 (X = -60 -> -264)
    // ------------------------------------------------------------------------
    QM.addSimpleBridge(batch, -96, 6.2, 11.5, 6.2, Math.PI * 0.5, false);

    // 城外街市北侧：“久住王员外家”旅舍 + 门前“香饮子”大伞摊 + 香椿菜摊 + 税务所外打盹兵丁
    QM.addSongHouse(batch, scene, {
      x: -78, z: -5.5, w: 9.5, d: 6.0, h: 3.5, floors: 2, yaw: 0,
      openShop: true, awning: true, signText: '久住王员外家', signVertical: false
    });
    QM.addMarketStall(batch, -78, 0.5, true, 0x7c8e58);
    QM.addMarketStall(batch, -66, 0.2, true, 0x6f7e49);
    QM.addSongHouse(batch, scene, { x: -64, z: -5.5, w: 8.0, d: 5.2, h: 3.3, yaw: 0, openShop: true, awning: true });

    // 税务所（城门外北侧）+ 打盹兵丁
    QM.addSongHouse(batch, scene, { x: -102, z: -5.5, w: 7.2, d: 5.0, h: 3.2, yaw: 0, openShop: true });
    em.addPerson({ x: -103, z: -0.5, yaw: 0.2, hat: 'scarf', shirt: 0x554b42, action: 'nap' });
    em.addPerson({ x: -100, z: -0.8, yaw: -0.4, hat: 'scarf', shirt: 0x554b42, action: 'sit' });

    // 出城门骆驼商队（6峰骆驼）
    for (let cm = 0; cm < 6; cm++) {
      const cx = -84 - cm * 3.8;
      em.addAnimal({
        species: 'camel', x: cx, z: 6.2 + (cm % 2) * 0.5,
        path: { x0: cx - 18, z0: 6.2, x1: cx + 16, z1: 7.4, t: 0.4 }, speed: 0.72
      });
    }
    em.addPerson({
      x: -82, z: 5.5, hat: 'douli', shirt: 0x455853, action: 'walk',
      path: { x0: -100, z0: 5.5, x1: -66, z1: 6.7, t: 0.4 }, speed: 0.72
    });

    // 【核心建筑】东角子门（砖砌城台 + 重檐木构城楼，x = -115）
    QM.addCityGate(batch, -115, 6);
    QM.addOldWillow(batch, scene, -104, -12, 1.1, false);
    QM.addOldWillow(batch, scene, -124, -12, 1.0, false);

    // 城内街北侧（z ≈ -6，正面 yaw = 0 朝南面对大街与观者）：“孙羊正店” + 华丽彩楼欢门 + 后院酒坛
    QM.addSongHouse(batch, scene, {
      x: -138, z: -6.8, w: 12.8, d: 7.4, h: 3.5, floors: 3, yaw: 0,
      openShop: true, chazi: true, wallColor: QM.PAL.plaster
    });
    QM.addHuanMen(batch, scene, -138, -0.5, 0, 8.6, 8.8);
    QM.addWineJars(batch, -146, -13.5, 3, 5);
    QM.smokeEmitters.push({ x: -141, y: 11.5, z: -8.5 });
    for (let g = 0; g < 12; g++) {
      em.addPerson({
        x: -142 + (g % 5) * 2.1, z: -2.8 - (g % 2) * 0.4,
        yOffset: () => g < 6 ? 4.2 : 7.7,
        yaw: 0, hat: 'putou', shirt: pickShirt(), action: 'sit'
      });
    }

    // 十字街口北侧：“刘家上色沉檀拣香”铺与“解”字算命摊
    QM.addSongHouse(batch, scene, {
      x: -154, z: -6.0, w: 8.6, d: 5.6, h: 3.4, floors: 2, yaw: 0, openShop: true, awning: true, flagText: '酒'
    });
    QM.addSongHouse(batch, scene, {
      x: -168, z: -6.5, w: 9.2, d: 5.8, h: 3.6, floors: 2, yaw: 0, openShop: true,
      signText: '刘家上色沉檀拣香', signVertical: false
    });
    QM.addMarketStall(batch, -158, -0.5, true, 0x4d4a44);
    const fortuneSign = new THREE.Mesh(
      new THREE.PlaneGeometry(0.75, 2.1),
      QM.makeSignMaterial('解', { vertical: true, bg: '#e6d7b7', fg: '#2b2017' })
    );
    fortuneSign.position.set(-159.5, 2.8, -0.2);
    scene.add(fortuneSign);

    // 说书围观人群
    em.addPerson({ x: -150, z: 10.5, yaw: 0.2, hat: 'putou', shirt: 0x3b4d5e, action: 'talk' });
    for (let sp = 0; sp < 13; sp++) {
      const ang = (sp / 13) * Math.PI * 2;
      em.addPerson({
        x: -150 + Math.cos(ang) * 2.4, z: 10.5 + Math.sin(ang) * 2.1,
        yaw: Math.atan2(-Math.cos(ang), -Math.sin(ang)),
        hat: pickHat(), shirt: pickShirt(), action: sp % 3 === 0 ? 'talk' : 'idle'
      });
    }

    // 十字街口柳树下的水井（3人打水）
    QM.addPublicWell(batch, -168, 11.2);
    QM.addOldWillow(batch, scene, -165, 13.8, 1.05, true);
    for (let wp = 0; wp < 3; wp++) {
      em.addPerson({ x: -169.2 + wp * 1.1, z: 10.6 + (wp % 2) * 0.8, yaw: 0.5 - wp * 0.6, hat: 'scarf', shirt: pickShirt(), action: 'talk' });
    }

    // 十字街南侧：“王家罗锦匹帛铺”（面向北面大街 yaw = Math.PI）与相邻店铺
    QM.addSongHouse(batch, scene, {
      x: -175, z: 16.5, w: 9.0, d: 5.5, h: 3.4, yaw: Math.PI, openShop: true, awning: true,
      signText: '王家罗锦匹帛铺', signVertical: false, signOffsetZ: 0.55
    });
    QM.addSongHouse(batch, scene, {
      x: -188, z: 16.5, w: 8.5, d: 5.2, h: 3.2, yaw: Math.PI, openShop: true, awning: true
    });
    QM.addSongHouse(batch, scene, {
      x: -184, z: -6.2, w: 8.8, d: 5.6, h: 3.4, floors: 2, yaw: 0, openShop: true, awning: true, flagText: '新酒'
    });

    // 卷尾街北侧：“赵太丞家”医铺（正面朝南面向大街）+ 双牌招 + 坐诊求医
    QM.addSongHouse(batch, scene, {
      x: -202, z: -6.0, w: 9.4, d: 5.8, h: 3.4, yaw: 0, openShop: true, awning: true
    });
    QM.addSongHouse(batch, scene, {
      x: -222, z: -6.5, w: 10.2, d: 6.2, h: 3.6, floors: 2, yaw: 0, openShop: true,
      signText: '赵太丞家', signVertical: false
    });
    ['治酒所伤真方集香丸', '大理中丸医肠胃'].forEach((t, idx) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(0.68, 2.7),
        QM.makeSignMaterial(t, { vertical: true, bg: '#d9c8a4', fg: '#2b2016' })
      );
      m.position.set(-225.5 + idx * 7.0, 2.2, -1.6);
      scene.add(m);
    });
    em.addPerson({ x: -222, z: -3.2, yaw: 0, hat: 'putou', shirt: 0x3b4d5e, action: 'sit' });
    em.addPerson({ x: -222, z: -1.4, yaw: 3.14, hat: 'bun', shirt: 0x8d493b, action: 'talk' });

    // 卷尾士绅宅院与收尾巷陌
    for (let rx = -238; rx >= -258; rx -= 11) {
      QM.addSongHouse(batch, scene, { x: rx, z: -6.5, w: 9.4, d: 6.0, h: 3.4, floors: rx === -238 ? 2 : 1, yaw: 0, openShop: rx === -238 });
      QM.addSongHouse(batch, scene, { x: rx, z: 16.5, w: 8.6, d: 5.4, h: 3.2, yaw: Math.PI, openShop: false });
      QM.addBareTree(batch, rx + 3, -15, 1.0, false);
    }
    QM.addBambooCluster(batch, -246, -15, 12);

    // ------------------------------------------------------------------------
    // 四、全城大街繁华动态人流、车马、独轮车、轿子
    // ------------------------------------------------------------------------
    for (let i = 0; i < 135; i++) {
      const px = -60 - QM.rand() * 195;
      const pz = 2.0 + QM.rand() * 9.5;
      const walk = QM.rand() > 0.38;
      const dx = (QM.rand() > 0.5 ? 1 : -1) * (10 + QM.rand() * 24);
      em.addPerson({
        x: px, z: pz,
        yaw: QM.rand() * Math.PI * 2,
        hat: pickHat(), shirt: pickShirt(),
        prop: walk && QM.rand() > 0.62 ? (QM.rand() > 0.5 ? 'pole' : 'bundle') : 'none',
        action: walk ? 'walk' : (QM.rand() > 0.5 ? 'talk' : 'idle'),
        path: walk ? { x0: px, z0: pz, x1: Math.max(-258, Math.min(-55, px + dx)), z1: pz + (QM.rand() - 0.5) * 2.0, t: QM.rand() } : null,
        speed: 0.75 + QM.rand() * 0.65
      });
    }

    for (let j = 0; j < 78; j++) {
      const px = -55 + QM.rand() * 160;
      const rz = QM.riverCenterZ(px);
      const rw = QM.riverHalfWidth(px);
      const north = QM.rand() > 0.4;
      const pz = north ? (rz - rw - 2.2 - QM.rand() * 5) : (rz + rw + 2.2 + QM.rand() * 8);
      const walk = QM.rand() > 0.35;
      em.addPerson({
        x: px, z: pz,
        yaw: QM.rand() * Math.PI * 2,
        hat: pickHat(), shirt: pickShirt(),
        prop: QM.rand() > 0.6 ? 'pole' : (QM.rand() > 0.5 ? 'sack' : 'none'),
        action: walk ? 'walk' : 'talk',
        path: walk ? { x0: px, z0: pz, x1: px + (QM.rand() > 0.5 ? 14 : -14), z1: pz, t: QM.rand() } : null,
        speed: 0.8 + QM.rand() * 0.5
      });
    }

    for (let r = 0; r < 9; r++) {
      const rx = -126 - r * 14;
      const rz = 5.5 + (r % 3) * 1.4;
      const destX = rx + (r % 2 === 0 ? -24 : 24);
      em.addAnimal({
        species: r % 3 === 0 ? 'donkey' : 'horse',
        x: rx, z: rz, path: { x0: rx, z0: rz, x1: destX, z1: rz, t: r * 0.1 }, speed: 0.95
      });
      em.addPerson({
        x: rx, z: rz, hat: 'putou', shirt: pickShirt(), action: 'ride',
        path: { x0: rx, z0: rz, x1: destX, z1: rz, t: r * 0.1 }, speed: 0.95
      });
    }

    for (let c = 0; c < 14; c++) {
      const cx = -125 - c * 9.5;
      const cz = 4.2 + (c % 3) * 2.2;
      const type = c % 3 === 0 ? 'covered' : (c % 3 === 1 ? 'flat' : 'barrow');
      const dir = c % 2 === 0 ? -1 : 1;
      em.addCart({
        type, x: cx, z: cz,
        path: { x0: cx, z0: cz, x1: Math.max(-256, Math.min(-120, cx + dir * 28)), z1: cz, t: c * 0.08 },
        speed: type === 'barrow' ? 0.95 : 0.68
      });
      if (type !== 'barrow') {
        em.addAnimal({
          species: 'ox', x: cx + dir * 2.6, z: cz,
          path: { x0: cx + dir * 2.6, z0: cz, x1: Math.max(-256, Math.min(-120, cx + dir * 30.6)), z1: cz, t: c * 0.08 },
          speed: 0.68
        });
      }
    }

    for (let s = 0; s < 5; s++) {
      const sx = -132 - s * 22;
      const sz = 7.2 + (s % 2) * 1.5;
      const path = { x0: sx, z0: sz, x1: sx - 26, z1: sz, t: s * 0.17 };
      em.addSedan({ x: sx, z: sz, path, speed: 0.95 });
      em.addPerson({ x: sx - 1.8, z: sz, hat: 'scarf', shirt: 0x3b4d5e, action: 'walk', path, speed: 0.95 });
      em.addPerson({ x: sx + 1.8, z: sz, hat: 'scarf', shirt: 0x3b4d5e, action: 'walk', path, speed: 0.95 });
    }

    for (let dg = 0; dg < 7; dg++) {
      const dx = -130 - dg * 18;
      em.addAnimal({ species: 'dog', x: dx, z: 9.8, path: { x0: dx - 3, z0: 9.8, x1: dx + 4, z1: 10.6, t: dg * 0.2 }, speed: 0.85 });
    }
    for (let bt = 0; bt < 45; bt++) {
      const tx = -258 + bt * 6.4;
      const tz = -18 - (bt % 5) * 6;
      if (bt % 3 === 0) QM.addOldWillow(batch, scene, tx, tz, 0.9, false);
      else QM.addBareTree(batch, tx, tz, 0.9 + (bt % 3) * 0.2, false);
    }
  };
})(window.QM = window.QM || {});
