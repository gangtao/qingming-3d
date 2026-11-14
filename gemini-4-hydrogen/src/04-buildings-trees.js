// ============================================================================
// 04-buildings-trees.js — 瓦顶起翘、茅舍、彩楼欢门、虹桥、城门城楼与早春老柳杂树
// ============================================================================
(function (QM) {
  'use strict';

  QM.animatedFlags = [];
  QM.animatedWillows = [];
  QM.smokeEmitters = [];

  // 添加屋顶两坡瓦顶 + 屋脊起翘（悬山/歇山宋式风貌）
  function addSongRoof(batch, cx, baseY, cz, w, d, h, yaw, isThatch) {
    const matKey = isThatch ? 'thatch' : 'tile';
    const col = isThatch ? QM.PAL.thatch : QM.PAL.tileGrey;
    const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
    const toW = (lx, ly, lz) => [
      cx + lx * cosY + lz * sinY,
      baseY + ly,
      cz - lx * sinY + lz * cosY
    ];

    const slopeLen = Math.hypot(d * 0.5 + 0.5, h);
    const pitch = Math.atan2(h, d * 0.5 + 0.5);

    // 前后两坡
    [-1, 1].forEach((side) => {
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0));
      const qSlope = new THREE.Quaternion().setFromEuler(new THREE.Euler(side * pitch, 0, 0));
      q.multiply(qSlope);
      const pos = toW(0, h * 0.5, side * (d * 0.25 + 0.15));
      m.compose(new THREE.Vector3(pos[0], pos[1], pos[2]), q, new THREE.Vector3(1, 1, 1));
      batch.add(matKey, new THREE.BoxGeometry(w + 0.9, 0.18, slopeLen), m, col);
    });

    // 山墙三角形填充
    [-w * 0.46, w * 0.46].forEach((gx) => {
      const pos = toW(gx, h * 0.45, 0);
      batch.addBox('plaster', 0.18, h * 0.85, d * 0.72, pos[0], pos[1], pos[2], 0, yaw, 0, QM.PAL.plasterWarm);
    });

    if (!isThatch) {
      // 主屋脊 + 两端起翘吻兽剪影
      const rPos = toW(0, h + 0.08, 0);
      batch.addBox('tile', w + 1.0, 0.22, 0.24, rPos[0], rPos[1], rPos[2], 0, yaw, 0, QM.PAL.tileDark);
      [-w * 0.5 - 0.45, w * 0.5 + 0.45].forEach((rx) => {
        const up = toW(rx, h + 0.24, 0);
        const tilt = rx < 0 ? 0.35 : -0.35;
        const m = new THREE.Matrix4();
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, tilt));
        m.compose(new THREE.Vector3(up[0], up[1], up[2]), q, new THREE.Vector3(1, 1, 1));
        batch.add('tile', new THREE.BoxGeometry(0.45, 0.26, 0.24), m, QM.PAL.tileDark);
      });
    }
  }

  // 构建典型宋代铺面/民居（台基 + 木构立柱 + 格子窗 + 门面 + 屋顶）
  QM.addSongHouse = function (batch, scene, cfg) {
    const x = cfg.x, z = cfg.z;
    const gy = cfg.y !== undefined ? cfg.y : QM.groundHeight(x, z);
    const w = cfg.w || 7.5;
    const d = cfg.d || 5.4;
    const h = cfg.h || 3.4;
    const floors = cfg.floors || 1;
    const yaw = cfg.yaw || 0;
    const isThatch = !!cfg.thatch;
    const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
    const toW = (lx, ly, lz) => [
      x + lx * cosY + lz * sinY,
      gy + ly,
      z - lx * sinY + lz * cosY
    ];

    // 砖石台基
    const plinthH = 0.45;
    const pPos = toW(0, plinthH * 0.5, 0);
    batch.addBox(isThatch ? 'stone' : 'brick', w + 0.6, plinthH, d + 0.6, pPos[0], pPos[1], pPos[2], 0, yaw, 0, QM.PAL.stone);

    for (let fl = 0; fl < floors; fl++) {
      const fy = plinthH + fl * h;
      const fw = w - fl * 0.35;
      const fd = d - fl * 0.25;

      // 墙体（二层以上缩进形成平座外廊）
      const wallPos = toW(0, fy + h * 0.5, -0.15);
      batch.addBox('plaster', fw - 0.3, h, fd - 0.5, wallPos[0], wallPos[1], wallPos[2], 0, yaw, 0,
        cfg.wallColor || (isThatch ? QM.PAL.plasterWarm : QM.PAL.plaster));

      // 木构柱网与横梁
      const cols = Math.max(2, Math.round(fw / 2.2));
      for (let c = 0; c <= cols; c++) {
        const lx = -fw * 0.5 + (fw / cols) * c;
        [-fd * 0.48, fd * 0.48].forEach((lz) => {
          const cp = toW(lx, fy + h * 0.5, lz);
          batch.addBox('wood', 0.20, h, 0.20, cp[0], cp[1], cp[2], 0, yaw, 0, QM.PAL.woodDark);
        });
      }
      // 额枋横梁
      const beam = toW(0, fy + h - 0.14, fd * 0.48);
      batch.addBox('wood', fw + 0.2, 0.24, 0.24, beam[0], beam[1], beam[2], 0, yaw, 0, QM.PAL.woodDark);

      // 正面格子窗 / 敞开铺面
      if (fl === 0 && cfg.openShop) {
        // 柜台与敞开门柱
        const cnt = toW(0, fy + 0.45, fd * 0.36);
        batch.addBox('wood', fw * 0.72, 0.9, 0.55, cnt[0], cnt[1], cnt[2], 0, yaw, 0, QM.PAL.woodMid);
      } else {
        const winCount = Math.max(2, Math.floor(fw / 2.1));
        for (let wi = 0; wi < winCount; wi++) {
          const wx = -fw * 0.34 + (fw * 0.68 / Math.max(1, winCount - 1)) * wi;
          const wp = toW(winCount === 1 ? 0 : wx, fy + h * 0.55, fd * 0.46);
          batch.addBox('lattice', 1.05, 1.25, 0.10, wp[0], wp[1], wp[2], 0, yaw, 0, 0xffffff);
        }
      }

      // 二三层平座栏杆（酒楼平座）
      if (fl > 0) {
        const railF = toW(0, fy + 0.46, fd * 0.5 + 0.35);
        batch.addBox('wood', fw + 0.8, 0.85, 0.10, railF[0], railF[1], railF[2], 0, yaw, 0, QM.PAL.cinnabar);
        const floorEx = toW(0, fy - 0.05, fd * 0.5 + 0.15);
        batch.addBox('wood', fw + 0.9, 0.14, 0.9, floorEx[0], floorEx[1], floorEx[2], 0, yaw, 0, QM.PAL.woodMid);
      }
    }

    // 屋顶
    const topY = plinthH + floors * h;
    addSongRoof(batch, x, gy + topY, z, w + 0.4, d + 0.4, isThatch ? 1.9 : 2.3, yaw, isThatch);

    // 铺面门前遮阳布篷（宋代市井极常见）
    if (cfg.awning) {
      const ap = toW(0, plinthH + 2.2, d * 0.5 + 1.1);
      batch.addBox('plaster', w * 0.82, 0.08, 2.1, ap[0], ap[1], ap[2], 0.30, yaw, 0, QM.PAL.hemp);
      [-w * 0.36, w * 0.36].forEach((px) => {
        const pp = toW(px, plinthH + 1.0, d * 0.5 + 1.9);
        batch.addCyl('wood', 0.05, 0.06, 2.0, 6, pp[0], pp[1], pp[2], 0, 0, 0, QM.PAL.bamboo);
      });
    }

    // 匾额或竖立牌招
    if (cfg.signText) {
      const sm = QM.makeSignMaterial(cfg.signText, {
        vertical: !!cfg.signVertical,
        bg: cfg.signBg || '#3a2b1d',
        fg: cfg.signFg || '#e8d7b2'
      });
      const sg = cfg.signVertical ? new THREE.PlaneGeometry(0.85, 2.5) : new THREE.PlaneGeometry(2.6, 0.85);
      const mesh = new THREE.Mesh(sg, sm);
      const sp = toW(cfg.signOffsetX || 0, plinthH + (cfg.signY || (floors * h - 0.4)), d * 0.5 + (cfg.signOffsetZ || 0.45));
      mesh.position.set(sp[0], sp[1], sp[2]);
      mesh.rotation.y = yaw;
      scene.add(mesh);
    }

    // 飘动酒旗/幌子
    if (cfg.flagText) {
      const fPos = toW(w * 0.48, plinthH + floors * h * 0.72, d * 0.5 + 0.65);
      batch.addCyl('wood', 0.04, 0.05, 3.2, 6, fPos[0], fPos[1], fPos[2], 0, yaw, -0.45, QM.PAL.bamboo);
      const fm = QM.makeSignMaterial(cfg.flagText, {
        vertical: true,
        bg: cfg.flagBg || '#8c3d2d',
        fg: '#efe3c6'
      });
      const flagMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 1.9), fm);
      flagMesh.position.set(fPos[0] + sinY * 0.8 + cosY * 0.55, fPos[1] + 0.45, fPos[2] + cosY * 0.8);
      flagMesh.rotation.y = yaw;
      scene.add(flagMesh);
      QM.animatedFlags.push({ mesh: flagMesh, baseYaw: yaw, phase: QM.rand() * 6.28 });
    }

    // 门前“杈子”（北宋酒楼特有的交木栅栏）
    if (cfg.chazi) {
      for (let i = -2; i <= 2; i++) {
        const cp = toW(i * 1.1, plinthH + 0.55, d * 0.5 + 1.5);
        batch.addBox('wood', 0.09, 1.1, 0.09, cp[0], cp[1], cp[2], 0, yaw, 0.55, QM.PAL.cinnabar);
        batch.addBox('wood', 0.09, 1.1, 0.09, cp[0], cp[1], cp[2], 0, yaw, -0.55, QM.PAL.cinnabar);
      }
    }
  };

  // 构建北宋正店门前华丽的“彩楼欢门”（如孙羊正店）
  QM.addHuanMen = function (batch, scene, x, z, yaw, w, h) {
    const gy = QM.groundHeight(x, z);
    const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
    const toW = (lx, ly, lz) => [x + lx * cosY + lz * sinY, gy + ly, z - lx * sinY + lz * cosY];

    // 四根高大竹木立柱扎彩楼架
    [-w * 0.5, -w * 0.22, w * 0.22, w * 0.5].forEach((lx) => {
      const p = toW(lx, h * 0.5, 0);
      batch.addCyl('wood', 0.12, 0.15, h, 8, p[0], p[1], p[2], 0, 0, 0, QM.PAL.cinnabar);
    });
    // 三层叠起彩色横枋与扎彩牌楼顶
    for (let lv = 0; lv < 3; lv++) {
      const ly = h * (0.45 + lv * 0.26);
      const lw = w * (1.0 - lv * 0.18);
      const bp = toW(0, ly, 0);
      batch.addBox('wood', lw, 0.55, 0.45, bp[0], bp[1], bp[2], 0, yaw, 0, lv % 2 === 0 ? QM.PAL.cinnabar : QM.PAL.tealMuted);
      // 悬挂栀子灯（圆形红灯笼）
      if (lv < 2) {
        [-lw * 0.38, lw * 0.38].forEach((dx) => {
          const lp = toW(dx, ly - 0.65, 0.3);
          batch.add('stone', new THREE.SphereGeometry(0.28, 8, 6),
            new THREE.Matrix4().makeTranslation(lp[0], lp[1], lp[2]), QM.PAL.cinnabar);
        });
      }
    }
    // 尖顶脊饰
    const topP = toW(0, h + 0.65, 0);
    batch.addBox('tile', w * 0.62, 0.45, 0.85, topP[0], topP[1], topP[2], 0, yaw, 0, QM.PAL.tealMuted);

    // 悬于欢门中央的大匾与竖幡
    const mainSign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.3, 0.95),
      QM.makeSignMaterial('孙羊正店', { bg: '#7d3426', fg: '#f2e1b8' })
    );
    const sp = toW(0, h * 0.72, 0.35);
    mainSign.position.set(sp[0], sp[1], sp[2]);
    mainSign.rotation.y = yaw;
    scene.add(mainSign);

    ['正店', '香醪'].forEach((txt, idx) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(0.72, 2.2),
        QM.makeSignMaterial(txt, { vertical: true, bg: idx === 0 ? '#8c3d2d' : '#425b4f', fg: '#f0e2be' })
      );
      const fp = toW(idx === 0 ? -w * 0.55 : w * 0.55, h * 0.68, 0.4);
      m.position.set(fp[0], fp[1], fp[2]);
      m.rotation.y = yaw;
      scene.add(m);
      QM.animatedFlags.push({ mesh: m, baseYaw: yaw, phase: idx * 2.1 });
    });
  };

  // 构建汴河虹桥（上土桥）：北宋无柱木拱桥（贯木拱结构 + 石砌桥台 + 木栏杆）
  QM.addRainbowBridge = function (batch, x, z) {
    const span = 22.0;
    const width = 6.6;
    const deckApex = 5.4;
    const yaw = -0.18; // 微斜跨汴河，贴合原画视角
    const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
    const toW = (lx, ly, lz) => [x + lx * cosY + lz * sinY, ly, z - lx * sinY + lz * cosY];

    // 两岸青砖石砌桥台
    [-span * 0.52, span * 0.52].forEach((az) => {
      const ap = toW(0, -0.4, az);
      batch.addBox('brick', width + 1.8, 3.6, 4.4, ap[0], ap[1], ap[2], 0, yaw, 0, QM.PAL.brick);
    });

    // 虹桥桥面弧线函数 y(t), t in [-1, 1]
    QM.bridgeHeightAt = function (wx, wz) {
      const dx = wx - x, dz = wz - z;
      const lz = dx * sinY + dz * cosY;
      const lx = dx * cosY - dz * sinY;
      if (Math.abs(lx) > width * 0.55 || Math.abs(lz) > span * 0.62) return null;
      const t = Math.max(-1, Math.min(1, lz / (span * 0.55)));
      return -0.2 + deckApex * (1 - t * t * 0.88);
    };

    // 分段木拱肋、横贯木与桥面木板（16段拱券）
    const segs = 16;
    for (let i = 0; i < segs; i++) {
      const t0 = -1 + (2 * i) / segs;
      const t1 = -1 + (2 * (i + 1)) / segs;
      const tm = (t0 + t1) * 0.5;
      const z0 = t0 * span * 0.55, z1 = t1 * span * 0.55, zm = tm * span * 0.55;
      const y0 = -0.2 + deckApex * (1 - t0 * t0 * 0.88);
      const y1 = -0.2 + deckApex * (1 - t1 * t1 * 0.88);
      const ym = (y0 + y1) * 0.5;
      const segLen = Math.hypot(z1 - z0, y1 - y0) + 0.12;
      const slope = Math.atan2(y1 - y0, z1 - z0);

      // 桥面铺板
      const dp = toW(0, ym, zm);
      batch.addBox('wood', width, 0.26, segLen, dp[0], dp[1], dp[2], -slope, yaw, 0, QM.PAL.woodMid);

      // 五道主拱肋（典型贯木拱骨）
      [-width * 0.44, -width * 0.22, 0, width * 0.22, width * 0.44].forEach((ax) => {
        const ap = toW(ax, ym - 0.55, zm);
        batch.addBox('wood', 0.26, 0.42, segLen * 1.1, ap[0], ap[1], ap[2], -slope, yaw, 0, QM.PAL.woodDark);
      });

      // 桥面横木横梁
      const cb = toW(0, ym - 0.35, zm);
      batch.addBox('wood', width + 0.3, 0.22, 0.24, cb[0], cb[1], cb[2], 0, yaw, 0, QM.PAL.woodDark);

      // 两侧红褐色木望柱与栏杆（原画中桥栏醒目）
      [-width * 0.48, width * 0.48].forEach((rx) => {
        const rp = toW(rx, ym + 0.65, zm);
        batch.addBox('wood', 0.16, 1.15, 0.16, rp[0], rp[1], rp[2], 0, yaw, 0, QM.PAL.cinnabar);
        const rail = toW(rx, ym + 1.02, zm);
        batch.addBox('wood', 0.12, 0.12, segLen, rail[0], rail[1], rail[2], -slope, yaw, 0, QM.PAL.cinnabar);
        const midRail = toW(rx, ym + 0.58, zm);
        batch.addBox('wood', 0.10, 0.10, segLen, midRail[0], midRail[1], midRail[2], -slope, yaw, 0, QM.PAL.woodMid);
      });
    }

    // 桥端四角华表木柱（望柱）
    [-width * 0.5, width * 0.5].forEach((rx) => {
      [-span * 0.54, span * 0.54].forEach((rz) => {
        const hp = toW(rx, 1.7, rz);
        batch.addCyl('wood', 0.16, 0.19, 2.8, 8, hp[0], hp[1], hp[2], 0, 0, 0, QM.PAL.cinnabar);
      });
    });
  };

  // 构建东角子门：砖砌城台 + 夯土城墙 + 重檐木构城楼
  QM.addCityGate = function (batch, x, z) {
    const gy = QM.groundHeight(x, z);
    const gateW = 10.5;
    const gateH = 7.4;
    const depth = 11.0;

    // 城门南北两侧长段城墙（砖砌外包 + 垛口）
    [-25, 22].forEach((dz) => {
      const len = dz < 0 ? 36 : 28;
      batch.addBox('brick', depth * 0.72, gateH - 0.5, len, x, gy + (gateH - 0.5) * 0.5, z + dz, 0, 0, 0, QM.PAL.brick);
      // 垛口女墙
      for (let m = -len * 0.45; m <= len * 0.45; m += 2.2) {
        batch.addBox('brick', 0.9, 1.0, 1.2, x + depth * 0.31, gy + gateH, z + dz + m, 0, 0, 0, QM.PAL.brick);
      }
    });

    // 城门洞门墩（留出中轴 x 向通路 z-3.4 .. z+3.4）
    [-5.8, 5.8].forEach((dz) => {
      batch.addBox('brick', depth, gateH, 4.8, x, gy + gateH * 0.5, z + dz, 0, 0, 0, QM.PAL.brick);
    });
    // 门洞上方过梁砖台
    batch.addBox('brick', depth, 2.4, 7.0, x, gy + gateH - 1.2, z, 0, 0, 0, QM.PAL.brick);
    // 半开大红城门扇
    [-3.1, 3.1].forEach((dz) => {
      batch.addBox('wood', 2.2, 4.4, 0.24, x - 2.6, gy + 2.2, z + dz, 0, 0.35 * (dz > 0 ? -1 : 1), 0, QM.PAL.cinnabar);
    });

    // 城台之上：双层重檐歇山木构城楼
    const towerY = gy + gateH;
    const tw = 6.2, td = 13.8;
    // 一层木构柱廊与回廊栏杆
    batch.addBox('plaster', tw - 1.2, 3.6, td - 2.2, x, towerY + 1.8, z, 0, 0, 0, QM.PAL.plasterWarm);
    for (let pz = -td * 0.46; pz <= td * 0.46; pz += 2.6) {
      [-tw * 0.46, tw * 0.46].forEach((px) => {
        batch.addCyl('wood', 0.16, 0.18, 3.8, 8, x + px, towerY + 1.9, z + pz, 0, 0, 0, QM.PAL.cinnabar);
      });
    }
    // 城楼一重檐
    addSongRoof(batch, x, towerY + 3.6, z, td + 1.6, tw + 1.6, 1.9, Math.PI / 2, false);
    // 二层收分明楼与重檐歇山大顶
    batch.addBox('plaster', tw - 2.2, 2.7, td - 4.2, x, towerY + 5.6, z, 0, 0, 0, QM.PAL.plasterWarm);
    addSongRoof(batch, x, towerY + 7.0, z, td - 1.2, tw - 0.6, 2.8, Math.PI / 2, false);
  };

  // 小桥（卷首小木桥 / 护城河平桥）
  QM.addSimpleBridge = function (batch, x, z, len, w, yaw, arched) {
    const gy = 0.25;
    const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
    const segs = 6;
    for (let i = 0; i < segs; i++) {
      const t = -0.5 + (i + 0.5) / segs;
      const lz = t * len;
      const h = arched ? Math.cos(t * Math.PI) * 0.65 : 0.15;
      const wx = x + lz * sinY, wz = z + lz * cosY;
      batch.addBox('wood', w, 0.18, len / segs + 0.08, wx, gy + h, wz, 0, yaw, 0, QM.PAL.woodMid);
      if (i % 2 === 0) {
        [-w * 0.44, w * 0.44].forEach((lx) => {
          batch.addCyl('wood', 0.09, 0.11, 2.2, 6, wx + lx * cosY, gy + h - 1.0, wz - lx * sinY, 0, 0, 0, QM.PAL.woodDark);
        });
      }
    }
    // 扶手栏杆
    [-w * 0.46, w * 0.46].forEach((lx) => {
      batch.addBox('wood', 0.10, 0.10, len, x + lx * cosY, gy + (arched ? 1.15 : 0.95), z - lx * sinY, 0, yaw, 0, QM.PAL.woodDark);
    });
  };

  // 街市大伞与货摊
  QM.addMarketStall = function (batch, x, z, hasUmbrella, goodsCol) {
    const gy = QM.groundHeight(x, z);
    // 木货架与筐盆货物
    batch.addBox('wood', 2.1, 0.72, 1.05, x, gy + 0.36, z, 0, 0, 0, QM.PAL.woodMid);
    [-0.55, 0, 0.55].forEach((ox) => {
      batch.addCyl('wood', 0.26, 0.18, 0.26, 8, x + ox, gy + 0.85, z, 0, 0, 0, goodsCol || QM.PAL.ochre);
    });
    if (hasUmbrella) {
      batch.addCyl('wood', 0.05, 0.06, 2.75, 6, x, gy + 1.38, z, 0, 0, 0, QM.PAL.bamboo);
      const cone = new THREE.ConeGeometry(1.65, 0.45, 10);
      batch.add('plaster', cone, new THREE.Matrix4().makeTranslation(x, gy + 2.75, z), QM.PAL.hemp);
    }
  };

  // 石碾 / 水井 / 酒坛堆
  QM.addStoneMill = function (batch, x, z) {
    const gy = QM.groundHeight(x, z);
    batch.addCyl('stone', 0.72, 0.76, 0.45, 12, x, gy + 0.22, z, 0, 0, 0, QM.PAL.stone);
    batch.addCyl('stone', 0.32, 0.32, 0.55, 10, x + 0.18, gy + 0.65, z, Math.PI / 2, 0, 0, 0x9b9180);
  };

  QM.addPublicWell = function (batch, x, z) {
    const gy = QM.groundHeight(x, z);
    batch.addCyl('stone', 0.78, 0.85, 0.68, 12, x, gy + 0.34, z, 0, 0, 0, QM.PAL.stone);
    batch.addCyl('water', 0.58, 0.58, 0.08, 10, x, gy + 0.58, z, 0, 0, 0, 0x454535);
    [-0.7, 0.7].forEach((ox) => {
      batch.addBox('wood', 0.12, 1.7, 0.12, x + ox, gy + 0.85, z, 0, 0, 0, QM.PAL.woodDark);
    });
    batch.addBox('wood', 1.6, 0.14, 0.14, x, gy + 1.65, z, 0, 0, 0, QM.PAL.woodMid);
  };

  QM.addWineJars = function (batch, x, z, rows, cols) {
    const gy = QM.groundHeight(x, z);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        batch.add('stone', new THREE.SphereGeometry(0.28, 7, 6),
          new THREE.Matrix4().makeTranslation(x + c * 0.62, gy + 0.28, z + r * 0.62), 0x624b35);
      }
    }
  };

  // --------------------------------------------------------------------------
  // 早春老柳（粗矮歪斜树干上放射细枝，早春枝叶稀疏）与枯枝杂树、翠竹
  // --------------------------------------------------------------------------
  QM.addOldWillow = function (batch, scene, x, z, scale, heroSway) {
    const gy = QM.groundHeight(x, z);
    const sc = scale || 1.0;
    const tilt = (QM.rand() - 0.5) * 0.45;
    const yaw = QM.rand() * Math.PI * 2;

    // 粗矮歪斜老干
    const mTrunk = new THREE.Matrix4();
    const qT = new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt, yaw, (QM.rand() - 0.5) * 0.3));
    mTrunk.compose(new THREE.Vector3(x, gy + 1.2 * sc, z), qT, new THREE.Vector3(1, 1, 1));
    batch.add('wood', new THREE.CylinderGeometry(0.32 * sc, 0.48 * sc, 2.7 * sc, 7), mTrunk, 0x5c4733);

    const crownX = x + Math.sin(tilt) * 0.6 * sc;
    const crownY = gy + 2.3 * sc;
    const crownZ = z;

    // 从树瘤放射出的细枝（“一团辐射细枝”）+ 稀疏早春嫩绿垂柳
    const twigGroup = heroSway ? new THREE.Group() : null;
    if (twigGroup) {
      twigGroup.position.set(crownX, crownY, crownZ);
      scene.add(twigGroup);
      QM.animatedWillows.push({ group: twigGroup, phase: QM.rand() * 6.28 });
    }

    const branchCount = 9;
    for (let b = 0; b < branchCount; b++) {
      const a = (b / branchCount) * Math.PI * 2 + QM.rand() * 0.4;
      const spread = (0.7 + QM.rand() * 0.65) * sc;
      const len = (2.1 + QM.rand() * 1.1) * sc;
      const bx = Math.cos(a) * spread * 1.3;
      const by = (0.8 + QM.rand() * 0.7) * sc;
      const bz = Math.sin(a) * spread * 1.3;

      const mBr = new THREE.Matrix4();
      const dir = new THREE.Vector3(bx, by, bz).normalize();
      const qB = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      mBr.compose(new THREE.Vector3(crownX + bx * 0.45, crownY + by * 0.45, crownZ + bz * 0.45), qB, new THREE.Vector3(1, 1, 1));
      batch.add('wood', new THREE.CylinderGeometry(0.035 * sc, 0.08 * sc, len, 5), mBr, 0x67523b);

      // 下垂细柳条与稀疏嫩叶
      const tipX = crownX + bx * 0.9;
      const tipY = crownY + by * 0.88;
      const tipZ = crownZ + bz * 0.9;
      for (let s = 0; s < 2; s++) {
        const sx = tipX + (QM.rand() - 0.5) * 0.45 * sc;
        const sz = tipZ + (QM.rand() - 0.5) * 0.45 * sc;
        const dropLen = (1.3 + QM.rand() * 0.9) * sc;
        if (twigGroup && s === 0) {
          const wg = QM.prepareGeo(new THREE.CylinderGeometry(0.015 * sc, 0.008 * sc, dropLen, 4), QM.PAL.foliageWillow);
          const wm = new THREE.Mesh(wg, QM.MAT.foliage);
          wm.position.set(sx - crownX, tipY - crownY - dropLen * 0.45, sz - crownZ);
          twigGroup.add(wm);
        } else {
          batch.addCyl('foliage', 0.02, 0.01, dropLen, 4, sx, tipY - dropLen * 0.45, sz, 0, 0, 0, QM.PAL.foliageWillow);
        }
        // 稀疏早春叶簇（绝不厚重成球）
        if (QM.rand() > 0.35) {
          batch.add('foliage', new THREE.DodecahedronGeometry(0.28 * sc, 0),
            new THREE.Matrix4().makeTranslation(sx, tipY - dropLen * 0.35, sz), QM.PAL.foliageWillow);
        }
      }
    }
  };

  QM.addBareTree = function (batch, x, z, scale, hasNest) {
    const gy = QM.groundHeight(x, z);
    const sc = scale || (0.85 + QM.rand() * 0.5);
    const trunkH = 3.2 * sc;
    const tilt = (QM.rand() - 0.5) * 0.25;
    const mT = new THREE.Matrix4();
    mT.compose(
      new THREE.Vector3(x, gy + trunkH * 0.5, z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt, QM.rand() * 3, 0)),
      new THREE.Vector3(1, 1, 1)
    );
    batch.add('wood', new THREE.CylinderGeometry(0.14 * sc, 0.26 * sc, trunkH, 6), mT, 0x574432);

    // 蟹爪枯枝岔开
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + QM.rand() * 0.5;
      const bx = Math.cos(a) * 1.1 * sc, by = (1.1 + QM.rand() * 0.8) * sc, bz = Math.sin(a) * 1.1 * sc;
      const dir = new THREE.Vector3(bx, by, bz).normalize();
      const qB = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      const mB = new THREE.Matrix4();
      mB.compose(new THREE.Vector3(x + bx * 0.45, gy + trunkH * 0.85 + by * 0.45, z + bz * 0.45), qB, new THREE.Vector3(1, 1, 1));
      batch.add('wood', new THREE.CylinderGeometry(0.03 * sc, 0.08 * sc, 1.9 * sc, 5), mB, 0x5e4a36);

      if (QM.rand() > 0.5) {
        batch.add('foliage', new THREE.DodecahedronGeometry(0.26 * sc, 0),
          new THREE.Matrix4().makeTranslation(x + bx * 0.85, gy + trunkH * 0.85 + by * 0.85, z + bz * 0.85),
          QM.PAL.foliageDry);
      }
    }
    if (hasNest) {
      batch.add('thatch', new THREE.CylinderGeometry(0.28, 0.16, 0.18, 7),
        new THREE.Matrix4().makeTranslation(x + 0.25, gy + trunkH * 0.96, z), 0x5a4630);
    }
  };

  QM.addBambooCluster = function (batch, x, z, count) {
    const gy = QM.groundHeight(x, z);
    for (let i = 0; i < count; i++) {
      const bx = x + (QM.rand() - 0.5) * 3.0;
      const bz = z + (QM.rand() - 0.5) * 3.0;
      const h = 3.8 + QM.rand() * 1.8;
      batch.addCyl('foliage', 0.04, 0.055, h, 5, bx, gy + h * 0.5, bz, (QM.rand() - 0.5) * 0.14, 0, (QM.rand() - 0.5) * 0.14, QM.PAL.bambooLeaf);
      batch.add('foliage', new THREE.ConeGeometry(0.55, 1.1, 5),
        new THREE.Matrix4().makeTranslation(bx, gy + h * 0.85, bz), QM.PAL.bambooLeaf);
    }
  };
})(window.QM = window.QM || {});
