// ============================================================================
// 02-world-terrain.js — 世界坐标定义、汴河河道、街路地形与水波动画
// ============================================================================
(function (QM) {
  'use strict';

  // 原画纵 24.8cm × 横 528.7cm；1世界单位 ≈ 1米，总长 528 单位
  // X = +264 为卷首（右端·郊野春色），X = -264 为卷尾（左端·城门街市）
  QM.WORLD = {
    X_MIN: -264,
    X_MAX: 264,
    LEN: 528,
    Z_MIN: -58, // 远景（北侧）
    Z_MAX: 54   // 近景（南侧）
  };

  // 汴河中心线 Z(x)：从右前景(x=135,z=22)斜贯至虹桥(x=5,z=0)，再折向城北外郭(x=-85,z=-28)
  QM.riverCenterZ = function (x) {
    if (x > 138) return 26 + (x - 138) * 0.28; // 卷首南侧出画外
    if (x > 5) {
      const t = (138 - x) / 133;
      return 26 * (1 - t) - 2 * Math.sin(t * Math.PI);
    }
    if (x > -95) {
      const t = (5 - x) / 100;
      return -28 * Math.pow(t, 1.15);
    }
    return -28 - (-95 - x) * 0.14;
  };

  // 汴河半宽：虹桥处最窄（符合原画水工设计），码头凹湾处加宽
  QM.riverHalfWidth = function (x) {
    if (x > 142) return 6.0;
    let w = 10.5;
    // 古柳码头与漕船大码头凹湾（右岸/南岸侧稍宽）
    w += 3.2 * Math.exp(-Math.pow((x - 66) / 24, 2));
    // 虹桥处河道束窄
    w -= 2.4 * Math.exp(-Math.pow((x - 5) / 11, 2));
    // 客船区微宽
    w += 1.6 * Math.exp(-Math.pow((x + 30) / 16, 2));
    if (x < -75) w = Math.max(6.2, w - (-75 - x) * 0.04);
    return w;
  };

  QM.WATER_LEVEL = -1.35;

  // 郊野小溪（卷首小木桥下）
  QM.creekCenterZ = function (x) {
    return -10 + (x - 210) * 0.35;
  };

  // 主干道中心线（从卷首村路经虹桥北岸、过护城河平桥进东角子门至赵太丞家）
  QM.roadCenterZ = function (x) {
    if (x > 140) return 10 - (x - 140) * 0.05;
    if (x > 25) return 8 + Math.sin((x - 25) / 40) * 2.2;
    if (x > -20) {
      // 虹桥北侧接引上桥与下桥路
      const t = (25 - x) / 45;
      return 8 * (1 - t) + 12 * t;
    }
    if (x > -115) {
      // 从桥西大路走向东角子门
      const t = (-20 - x) / 95;
      return 12 * (1 - t) + 6 * t;
    }
    // 城内通衢大街（东角子门内 -> 孙羊正店 -> 十字街口 -> 赵太丞家）
    return 6;
  };

  // 地形高度采样（一切建筑、人物、车轿、树木都贴合此高度）
  QM.groundHeight = function (x, z) {
    let h = 0.0;

    // 卷首郊野微丘起伏
    if (x > 125) {
      const rural = Math.min(1, (x - 125) / 50);
      h += rural * (0.45 * Math.sin(x * 0.06 + z * 0.08) + 0.35 * Math.cos(z * 0.09));
      if (z < -18) h += rural * ((-18 - z) * 0.06);
    }

    // 城内街道略微平整垫高
    if (x < -105) {
      h = Math.max(h, 0.2);
    }

    // 汴河河槽挖深（只在 x < 142 进入画面区）
    if (x < 148) {
      const rz = QM.riverCenterZ(x);
      const rw = QM.riverHalfWidth(x);
      const dist = Math.abs(z - rz);
      const fade = x > 135 ? Math.max(0, (148 - x) / 13) : 1;
      if (dist < rw + 3.2) {
        const t = Math.max(0, Math.min(1, (rw + 3.2 - dist) / 4.2));
        const smooth = t * t * (3 - 2 * t);
        h -= smooth * 2.95 * fade;
      }
    }

    // 卷首小溪沟渠（x ≈ 195..235）
    if (x > 185 && x < 245) {
      const cz = QM.creekCenterZ(x);
      const cd = Math.abs(z - (x - 208) * 1.15);
      // 实际上小溪斜穿道路 x≈210 处
      const creekDist = Math.abs((x - 210) * 0.72 + (z - 6) * 0.68);
      if (creekDist < 3.4) {
        const t = (3.4 - creekDist) / 3.4;
        h -= t * t * 1.45;
      }
    }

    // 护城河沟（紧贴东角子门外侧 x ≈ -96）
    if (x > -106 && x < -86 && z > -24) {
      const md = Math.abs(x + 96);
      if (md < 6.0) {
        const t = (6.0 - md) / 6.0;
        h -= t * t * 2.3;
      }
    }

    return h;
  };

  // 构建地面、河床、护城河与水波网格
  QM.buildTerrain = function (scene) {
    const segX = 280;
    const segZ = 56;
    const width = QM.WORLD.LEN + 20;
    const depth = QM.WORLD.Z_MAX - QM.WORLD.Z_MIN;
    const geo = new THREE.PlaneGeometry(width, depth, segX, segZ);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const cols = new Float32Array(pos.count * 3);
    const cEarth = new THREE.Color(QM.PAL.earthLight);
    const cEarthDark = new THREE.Color(QM.PAL.earthDark);
    const cGrass = new THREE.Color(QM.PAL.grassEarly);
    const cStreet = new THREE.Color(QM.PAL.street);
    const cBed = new THREE.Color(QM.PAL.riverBed);
    const tmp = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i) + (QM.WORLD.Z_MAX + QM.WORLD.Z_MIN) * 0.5;
      pos.setZ(i, z);

      const y = QM.groundHeight(x, z);
      pos.setY(i, y);

      // 计算地貌着色
      tmp.copy(cEarth);
      if (x > 110) {
        // 郊野田地与早春稀疏草地
        const patch = 0.5 + 0.5 * Math.sin(x * 0.11) * Math.cos(z * 0.14);
        tmp.lerp(cGrass, 0.35 + patch * 0.35);
      } else if (x < -105) {
        // 城内夯土街面
        tmp.lerp(cStreet, 0.72);
      } else {
        tmp.lerp(cGrass, 0.18);
      }

      // 主干道及十字街口着色
      const roadZ = QM.roadCenterZ(x);
      let onRoad = Math.abs(z - roadZ) < (x < -110 ? 5.8 : 4.0);
      // 城内十字街口南北向支路 (x ≈ -168)
      if (x > -176 && x < -160) onRoad = true;
      // 南岸纤夫道与虹桥南引道
      if (x > -25 && x < 28 && z < -2 && z > -26 && Math.abs(x - 5) < 4.8) onRoad = true;
      if (onRoad && y > -0.6) {
        tmp.lerp(cStreet, 0.75);
      }

      // 河岸湿土与河床变暗
      if (y < -0.25) {
        const wet = Math.min(1, (-0.25 - y) / 1.8);
        tmp.lerp(y < -1.2 ? cBed : cEarthDark, wet * 0.85);
      }

      // 远景（北边）轻度压柔融入绢纸
      if (z < -36) {
        const edge = Math.min(1, (-36 - z) / 22);
        tmp.lerp(new THREE.Color(QM.PAL.silkBg), edge * 0.55);
      }

      cols[i * 3] = tmp.r;
      cols[i * 3 + 1] = tmp.g;
      cols[i * 3 + 2] = tmp.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    geo.computeVertexNormals();

    const terrainMesh = new THREE.Mesh(geo, QM.MAT.ground);
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);

    // 汴河及小溪水面（统一水平面，因河槽与沟渠均低于 WATER_LEVEL）
    const waterGeo = new THREE.PlaneGeometry(420, 108, 1, 1);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMesh = new THREE.Mesh(waterGeo, QM.MAT.water);
    waterMesh.position.set(-48, QM.WATER_LEVEL, 0);
    waterMesh.receiveShadow = true;
    scene.add(waterMesh);

    // 护城河与卷首小溪水片
    const creekWater = new THREE.Mesh(
      new THREE.PlaneGeometry(36, 44),
      QM.MAT.water
    );
    creekWater.rotation.x = -Math.PI / 2;
    creekWater.position.set(212, -0.78, 6);
    scene.add(creekWater);

    QM.waterMesh = waterMesh;
  };
})(window.QM = window.QM || {});
