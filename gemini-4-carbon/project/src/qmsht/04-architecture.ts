import * as THREE from 'three';
import {
  createRng,
  MaterialLibrary,
  StaticGeometryBatcher,
} from './01-primitives';
import {
  fromRainbowBridgeLocal,
  groundHeightAt,
  MOAT_BRIDGE,
  queryBianRiver,
  RAINBOW_BRIDGE,
  rainbowBridgeElevationByS,
  RB_YAW,
  RURAL_BRIDGE,
} from './02-world';

/**
 * 模块四：建筑、桥梁、城门与树木（04-architecture.ts）
 * - 宋式瓦顶：带举折凹曲屋面、立体瓦垄凸棱、正脊与垂脊起翘及吻兽
 * - 草顶农舍：厚重覆茅悬挑与压脊木
 * - 房屋构件：石砖台基、踏道、露明木构架、斗拱替木、直棂格子窗、敞轩柜台
 * - 大酒楼与彩楼欢门：二层平座寻杖栏杆 + 竹木绑扎多层高耸彩楼欢门
 * - 汴河虹桥：无柱叠梁编木拱斜跨汴河，配木栏杆与桥头望柱华表
 * - 城门城楼：收分青砖城台、过梁式门洞、马道、雉堞女墙与歇山顶木构城楼
 * - 树木：粗矮歪斜盘根老柳（树头肿瘤放射细枝、早春稀疏嫩芽随风轻拂）与蟹爪枯枝杂树
 */

const _m = new THREE.Matrix4();
const _m2 = new THREE.Matrix4();
const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _euler = new THREE.Euler();
const _scale = new THREE.Vector3(1, 1, 1);

/**
 * 构造宋式举折凹曲双坡瓦顶几何体（含檐口微翘生起）
 */
function createCurvedGableRoofGeo(width: number, depth: number, rise: number): THREE.BufferGeometry {
  const segX = 8;
  const segZ = 8;
  const verts: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const halfW = width * 0.5;
  const halfD = depth * 0.5;

  // 生成半坡网格函数（side = +1 前坡, -1 后坡）
  for (const side of [-1, 1]) {
    const baseIdx = verts.length / 3;
    for (let ix = 0; ix <= segX; ix++) {
      const tx = ix / segX; // 0..1 沿面阔方向
      const x = -halfW + tx * width;
      const cornerLift = Math.pow(Math.abs(tx - 0.5) * 2, 2.4) * (rise * 0.16);

      for (let iz = 0; iz <= segZ; iz++) {
        const tz = iz / segZ; // 0=正脊, 1=檐口
        const z = side * tz * halfD;
        // 宋代举折凹曲：靠近正脊陡、靠近檐口平缓微翘
        const curveY = rise * Math.pow(1 - tz, 1.36) + cornerLift * Math.pow(tz, 1.4);
        verts.push(x, curveY, z);
        uvs.push(tx * (width * 0.85), tz * (halfD * 0.85));
      }
    }

    for (let ix = 0; ix < segX; ix++) {
      for (let iz = 0; iz < segZ; iz++) {
        const a = baseIdx + ix * (segZ + 1) + iz;
        const b = a + 1;
        const c = baseIdx + (ix + 1) * (segZ + 1) + iz;
        const d = c + 1;
        if (side === 1) {
          indices.push(a, b, c, b, d, c);
        } else {
          indices.push(a, c, b, b, c, d);
        }
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * 在屋面上添加立体瓦垄、起翘正脊、鸱吻与博风垂脊
 */
function addDetailedTiledRoof(
  batcher: StaticGeometryBatcher,
  baseMatrix: THREE.Matrix4,
  eaveY: number,
  width: number,
  depth: number,
  rise: number,
  hipGable = false,
) {
  const roofW = width + 0.92;
  const roofD = depth + 0.96;
  const roofMat = new THREE.Matrix4().makeTranslation(0, eaveY, 0).premultiply(baseMatrix);

  const roofSurf = createCurvedGableRoofGeo(roofW, roofD, rise);
  batcher.add('tileRoof', roofSurf, roofMat);
  roofSurf.dispose();

  // 封护山墙三角尖（山花板）
  for (const sx of [-1, 1]) {
    const gx = sx * (width * 0.48);
    const shape = new THREE.Shape();
    shape.moveTo(-depth * 0.48, 0);
    shape.lineTo(0, rise * 0.96);
    shape.lineTo(depth * 0.48, 0);
    shape.closePath();
    const gableGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: false });
    gableGeo.rotateY(Math.PI / 2);
    gableGeo.translate(gx - 0.04, eaveY, 0);
    batcher.add(hipGable ? 'woodDark' : 'plasterWall', gableGeo, baseMatrix, [0.4, 0.4]);
    gableGeo.dispose();
  }

  // 若为歇山顶（城楼、大酒楼），四面出际加下层四周腰檐裙坡
  if (hipGable) {
    for (const sx of [-1, 1]) {
      const skirtW = 0.85;
      const skirtGeo = new THREE.BoxGeometry(skirtW, 0.10, roofD * 0.96);
      skirtGeo.rotateZ(-sx * 0.38);
      skirtGeo.translate(sx * (width * 0.5 + 0.28), eaveY + 0.16, 0);
      batcher.add('tileRoof', skirtGeo, baseMatrix, [0.8, roofD * 0.4]);
      skirtGeo.dispose();
    }
  }

  // 立体瓦垄肋条（每隔 0.36m 一道，近看瓦垄凹凸极其分明）
  const ribSpacing = 0.38;
  const ribCount = Math.floor((roofW - 0.3) / ribSpacing);
  const slopeLen = Math.hypot(roofD * 0.5, rise);
  const slopeAng = Math.atan2(rise, roofD * 0.5);

  for (let i = 0; i <= ribCount; i++) {
    const rx = -roofW * 0.5 + 0.15 + (i / Math.max(ribCount, 1)) * (roofW - 0.3);
    const cornerLift = Math.pow(Math.abs(rx / (roofW * 0.5)), 2.4) * (rise * 0.12);
    for (const side of [-1, 1]) {
      _euler.set(side * slopeAng, 0, 0);
      _quat.setFromEuler(_euler);
      _pos.set(rx, eaveY + rise * 0.47 + cornerLift * 0.5 + 0.03, side * (roofD * 0.25));
      _m.compose(_pos, _quat, _scale.set(1, 1, 1)).premultiply(baseMatrix);
      batcher.addBox('tileRidge', 0.042, 0.045, slopeLen * 0.98, _m);
    }
  }

  // 正脊（中部微凹、两端高高起翘 + 鸱吻吻兽）
  const ridgeSegs = 7;
  for (let s = 0; s < ridgeSegs; s++) {
    const t0 = s / ridgeSegs - 0.5;
    const t1 = (s + 1) / ridgeSegs - 0.5;
    const tm = (t0 + t1) * 0.5;
    const segW = roofW / ridgeSegs + 0.03;
    const lift = Math.pow(Math.abs(tm) * 2, 2.4) * (rise * 0.20);
    const tilt = -Math.sign(tm) * Math.pow(Math.abs(tm) * 2, 1.5) * 0.18;
    _euler.set(0, 0, tilt);
    _quat.setFromEuler(_euler);
    _pos.set(tm * roofW, eaveY + rise + 0.09 + lift, 0);
    _m.compose(_pos, _quat, _scale.set(1, 1, 1)).premultiply(baseMatrix);
    batcher.addBox('tileRidge', segW, 0.16, 0.15, _m);
  }

  // 正脊两端起翘鸱吻
  for (const sx of [-1, 1]) {
    _euler.set(0, 0, -sx * 0.35);
    _quat.setFromEuler(_euler);
    _pos.set(sx * (roofW * 0.5 + 0.04), eaveY + rise + rise * 0.22 + 0.22, 0);
    _m.compose(_pos, _quat, _scale.set(1, 1, 1)).premultiply(baseMatrix);
    batcher.addBox('tileRidge', 0.14, 0.34, 0.18, _m);
  }

  // 四角垂脊与檐口飞椽
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      _euler.set(sz * slopeAng, 0, -sx * 0.06);
      _quat.setFromEuler(_euler);
      _pos.set(sx * (roofW * 0.49), eaveY + rise * 0.52 + 0.07, sz * (roofD * 0.25));
      _m.compose(_pos, _quat, _scale.set(1, 1, 1)).premultiply(baseMatrix);
      batcher.addBox('tileRidge', 0.11, 0.12, slopeLen * 1.02, _m);
    }
  }
}

/**
 * 添加精致格子窗构件（窗框 + 密排竖直窗棂 + 横枨）
 */
function addLatticeWindow(
  batcher: StaticGeometryBatcher,
  baseMatrix: THREE.Matrix4,
  cx: number,
  cy: number,
  cz: number,
  w: number,
  h: number,
  rotY = 0,
  woodKey = 'woodDark',
) {
  const winBase = new THREE.Matrix4()
    .makeRotationY(rotY)
    .setPosition(cx, cy, cz)
    .premultiply(baseMatrix);

  // 内衬浅绢纸窗芯
  _m.makeTranslation(0, 0, -0.015).premultiply(winBase);
  batcher.addBox('plasterWall', w - 0.06, h - 0.06, 0.02, _m);

  // 外框上下左右
  _m.makeTranslation(0, h * 0.5 - 0.03, 0).premultiply(winBase);
  batcher.addBox(woodKey, w, 0.06, 0.06, _m);
  _m.makeTranslation(0, -h * 0.5 + 0.03, 0).premultiply(winBase);
  batcher.addBox(woodKey, w, 0.06, 0.06, _m);
  for (const sx of [-1, 1]) {
    _m.makeTranslation(sx * (w * 0.5 - 0.03), 0, 0).premultiply(winBase);
    batcher.addBox(woodKey, 0.06, h, 0.06, _m);
  }

  // 直棂与横格
  const mullions = Math.max(3, Math.floor(w / 0.16));
  for (let i = 1; i < mullions; i++) {
    const mx = -w * 0.5 + (i / mullions) * w;
    _m.makeTranslation(mx, 0, 0.005).premultiply(winBase);
    batcher.addBox('woodLight', 0.024, h - 0.08, 0.035, _m);
  }
  for (const ry of [-h * 0.18, h * 0.18]) {
    _m.makeTranslation(0, ry, 0.005).premultiply(winBase);
    batcher.addBox('woodLight', w - 0.08, 0.024, 0.038, _m);
  }
}

/**
 * 添加宋代二层平座寻杖栏杆（望柱 + 寻杖扶手 + 华板蜀柱）
 */
function addSongBalustrade(
  batcher: StaticGeometryBatcher,
  baseMatrix: THREE.Matrix4,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  y: number,
  woodKey = 'woodLacquer',
) {
  const dx = x1 - x0;
  const dz = z1 - z0;
  const len = Math.hypot(dx, dz);
  if (len < 0.2) return;
  const ang = Math.atan2(dx, dz); // 沿 +Z 展开后转到目标方向

  const railBase = new THREE.Matrix4()
    .makeRotationY(ang)
    .setPosition((x0 + x1) * 0.5, y, (z0 + z1) * 0.5)
    .premultiply(baseMatrix);

  // 上层寻杖扶手 + 中层横木 + 地栿
  _m.makeTranslation(0, 0.88, 0).premultiply(railBase);
  batcher.addBox(woodKey, 0.075, 0.075, len + 0.08, _m);
  _m.makeTranslation(0, 0.54, 0).premultiply(railBase);
  batcher.addBox(woodKey, 0.055, 0.05, len, _m);
  _m.makeTranslation(0, 0.08, 0).premultiply(railBase);
  batcher.addBox(woodKey, 0.08, 0.08, len, _m);

  // 望柱与蜀柱
  const posts = Math.max(2, Math.round(len / 1.15));
  for (let i = 0; i <= posts; i++) {
    const pz = -len * 0.5 + (i / posts) * len;
    _m.makeTranslation(0, 0.50, pz).premultiply(railBase);
    batcher.addBox(woodKey, 0.095, 1.02, 0.095, _m);
  }
  const balusters = Math.max(4, Math.round(len / 0.28));
  for (let i = 1; i < balusters; i++) {
    const pz = -len * 0.5 + (i / balusters) * len;
    _m.makeTranslation(0, 0.46, pz).premultiply(railBase);
    batcher.addBox('woodLight', 0.035, 0.74, 0.035, _m);
  }
}

export interface TiledHouseOptions {
  x: number;
  z: number;
  width: number;
  depth: number;
  yaw?: number;
  stories?: 1 | 2;
  openFront?: boolean;
  hipGable?: boolean;
  lacquerTimber?: boolean;
  hasBalcony?: boolean;
  podiumHeight?: number;
  signText?: string;
  bannerText?: string;
}

/**
 * 建造宋式瓦顶房屋/铺面/二层酒楼（自动压入台基防悬空，配木构架、格子窗、柜台与二层平座栏杆）
 */
export function addTiledBuilding(
  batcher: StaticGeometryBatcher,
  sceneSignParent: THREE.Object3D,
  matLib: MaterialLibrary,
  opts: TiledHouseOptions,
): { floor1Y: number; floor2Y: number; baseMatrix: THREE.Matrix4 } {
  const gy = groundHeightAt(opts.x, opts.z);
  const podiumH = opts.podiumHeight ?? 0.34;
  const baseMatrix = new THREE.Matrix4()
    .makeRotationY(opts.yaw ?? 0)
    .setPosition(opts.x, gy, opts.z);

  const w = opts.width;
  const d = opts.depth;
  const woodKey = opts.lacquerTimber ? 'woodLacquer' : 'woodDark';

  // 1. 石砖台基（向下深扎 1.2m，确保斜坡河岸绝不悬空）+ 正面踏道台阶
  _m.makeTranslation(0, (podiumH - 1.2) * 0.5, 0).premultiply(baseMatrix);
  batcher.addBox('stonePodium', w + 0.44, podiumH + 1.2, d + 0.44, _m, [w * 0.5, 0.6]);

  _m.makeTranslation(0, podiumH * 0.35, d * 0.5 + 0.36).premultiply(baseMatrix);
  batcher.addBox('stonePodium', Math.min(w * 0.55, 2.6), podiumH * 0.7, 0.42, _m);

  const h1 = 2.85;
  const floor1Y = podiumH;
  const bays = Math.max(2, Math.round(w / 2.2));

  // 2. 一层木构架檐柱、阑额与斗拱替木
  for (let ix = 0; ix <= bays; ix++) {
    const cx = -w * 0.5 + (ix / bays) * w;
    for (const cz of [-d * 0.5, d * 0.5]) {
      _m.makeTranslation(cx, floor1Y + h1 * 0.5, cz).premultiply(baseMatrix);
      batcher.addCylinder(woodKey, 0.095, 0.105, h1, 8, _m);

      // 柱础石
      _m.makeTranslation(cx, floor1Y + 0.06, cz).premultiply(baseMatrix);
      batcher.addCylinder('stonePodium', 0.14, 0.16, 0.12, 8, _m);

      // 柱头斗拱块
      _m.makeTranslation(cx, floor1Y + h1 - 0.08, cz).premultiply(baseMatrix);
      batcher.addBox(woodKey, 0.34, 0.16, 0.34, _m);
    }
  }
  // 前后阑额横梁与山面横梁
  for (const cz of [-d * 0.5, d * 0.5]) {
    _m.makeTranslation(0, floor1Y + h1 - 0.18, cz).premultiply(baseMatrix);
    batcher.addBox(woodKey, w + 0.16, 0.14, 0.14, _m);
  }
  for (const cx of [-w * 0.5, w * 0.5]) {
    _m.makeTranslation(cx, floor1Y + h1 - 0.18, 0).premultiply(baseMatrix);
    batcher.addBox(woodKey, 0.14, 0.14, d + 0.16, _m);
  }

  // 3. 一层墙体、敞轩柜台与格子窗
  if (opts.openFront) {
    // 后墙与左右山墙封闭，正门敞开做商业铺面，内设木柜台与桌凳
    _m.makeTranslation(0, floor1Y + h1 * 0.5, -d * 0.48).premultiply(baseMatrix);
    batcher.addBox('plasterWall', w - 0.12, h1 - 0.15, 0.14, _m, [w * 0.3, 0.8]);
    for (const sx of [-1, 1]) {
      _m.makeTranslation(sx * (w * 0.48), floor1Y + h1 * 0.5, 0).premultiply(baseMatrix);
      batcher.addBox('plasterWall', 0.14, h1 - 0.15, d - 0.12, _m, [d * 0.3, 0.8]);
    }
    // 临街半高木柜台 + 酒坛
    _m.makeTranslation(-w * 0.22, floor1Y + 0.48, d * 0.38).premultiply(baseMatrix);
    batcher.addBox('woodLight', w * 0.42, 0.92, 0.48, _m);
    // 室内食桌
    _m.makeTranslation(w * 0.20, floor1Y + 0.38, 0.0).premultiply(baseMatrix);
    batcher.addBox('woodDark', 1.15, 0.72, 0.78, _m);
  } else {
    // 四周粉墙 + 正面木板门与两侧格子窗
    _m.makeTranslation(0, floor1Y + h1 * 0.5, 0).premultiply(baseMatrix);
    batcher.addBox('plasterWall', w - 0.16, h1 - 0.14, d - 0.16, _m, [w * 0.35, 0.85]);

    // 正面双扇木门
    _m.makeTranslation(0, floor1Y + 1.05, d * 0.45).premultiply(baseMatrix);
    batcher.addBox('woodDark', Math.min(1.25, w * 0.32), 2.05, 0.08, _m);

    // 两侧直棂格子窗
    if (w >= 4.0) {
      for (const sx of [-1, 1]) {
        addLatticeWindow(
          batcher,
          baseMatrix,
          sx * (w * 0.31),
          floor1Y + 1.45,
          d * 0.45,
          Math.min(1.25, w * 0.24),
          1.08,
          0,
          woodKey,
        );
      }
    }
  }

  let topEaveY = floor1Y + h1;
  const floor2Y = floor1Y + h1 + 0.18;

  // 4. 二层酒楼结构（外挑腰檐平座 + 二层寻杖栏杆 + 二层木构格子窗敞厅）
  if (opts.stories === 2) {
    const h2 = 2.55;
    const balOut = opts.hasBalcony !== false ? 0.95 : 0.25;

    // 外挑平座木楼板与挑梁斗拱
    _m.makeTranslation(0, floor2Y - 0.08, balOut * 0.45).premultiply(baseMatrix);
    batcher.addBox(woodKey, w + balOut * 0.9, 0.18, d + balOut * 1.1, _m);

    for (let ix = 0; ix <= bays; ix++) {
      const cx = -w * 0.5 + (ix / bays) * w;
      _m.makeTranslation(cx, floor2Y - 0.25, d * 0.5 + balOut * 0.45).premultiply(baseMatrix);
      batcher.addBox(woodKey, 0.16, 0.22, balOut + 0.3, _m);
    }

    // 二层四周平座栏杆
    const rx = (w + balOut * 0.8) * 0.5;
    const rzFront = d * 0.5 + balOut * 0.92;
    const rzBack = -d * 0.5 - 0.08;
    addSongBalustrade(batcher, baseMatrix, -rx, rzFront, rx, rzFront, floor2Y, woodKey);
    addSongBalustrade(batcher, baseMatrix, -rx, rzBack, -rx, rzFront, floor2Y, woodKey);
    addSongBalustrade(batcher, baseMatrix, rx, rzBack, rx, rzFront, floor2Y, woodKey);

    // 二层主体柱网与格子窗雅座
    for (let ix = 0; ix <= bays; ix++) {
      const cx = -w * 0.5 + (ix / bays) * w;
      for (const cz of [-d * 0.46, d * 0.42]) {
        _m.makeTranslation(cx, floor2Y + h2 * 0.5, cz).premultiply(baseMatrix);
        batcher.addCylinder(woodKey, 0.085, 0.095, h2, 8, _m);
      }
    }
    _m.makeTranslation(0, floor2Y + h2 * 0.5, -d * 0.44).premultiply(baseMatrix);
    batcher.addBox('plasterWall', w - 0.2, h2 - 0.14, 0.14, _m);

    for (const sx of [-1, 1]) {
      _m.makeTranslation(sx * (w * 0.46), floor2Y + h2 * 0.5, -0.02).premultiply(baseMatrix);
      batcher.addBox('plasterWall', 0.14, h2 - 0.14, d * 0.86, _m);
      addLatticeWindow(batcher, baseMatrix, sx * (w * 0.49), floor2Y + 1.35, 0, d * 0.48, 1.15, sx * Math.PI * 0.5, woodKey);
    }

    // 二层临街敞窗横楣与雅座食案
    _m.makeTranslation(0, floor2Y + h2 - 0.22, d * 0.42).premultiply(baseMatrix);
    batcher.addBox(woodKey, w + 0.12, 0.36, 0.12, _m);

    for (let ix = 0; ix < bays; ix++) {
      const tx = -w * 0.5 + ((ix + 0.5) / bays) * w;
      _m.makeTranslation(tx, floor2Y + 0.36, d * 0.22).premultiply(baseMatrix);
      batcher.addBox('woodLight', 0.92, 0.66, 0.68, _m);
    }

    topEaveY = floor2Y + h2;
  }

  // 5. 屋顶（举折瓦垄 + 起翘正脊）
  const rise = Math.min(2.35, d * 0.34 + (opts.hipGable ? 0.35 : 0));
  addDetailedTiledRoof(batcher, baseMatrix, topEaveY, w, d, rise, Boolean(opts.hipGable));

  // 6. 门楣牌匾与随风飘动招幌酒旗
  if (opts.signText) {
    const signMat = matLib.getSignMaterial(opts.signText, { vertical: false });
    const plaque = new THREE.Mesh(new THREE.BoxGeometry(Math.min(2.4, w * 0.52), 0.58, 0.08), signMat);
    const py = opts.stories === 2 ? floor2Y - 0.12 : floor1Y + h1 - 0.32;
    const pz = opts.stories === 2 ? d * 0.5 + 1.02 : d * 0.5 + 0.14;
    plaque.position.set(0, py, pz);
    plaque.applyMatrix4(baseMatrix);
    sceneSignParent.add(plaque);
  }

  if (opts.bannerText) {
    // 斜挑竹竿酒旗（望子）
    const poleX = w * 0.46;
    const poleZ = d * 0.5 + 0.85;
    _euler.set(0.32, 0, -0.15);
    _quat.setFromEuler(_euler);
    _pos.set(poleX, floor1Y + 2.8, poleZ);
    _m.compose(_pos, _quat, _scale.set(1, 1, 1)).premultiply(baseMatrix);
    batcher.addCylinder('bambooMat', 0.028, 0.038, 3.6, 6, _m);

    const bannerMat = matLib.getSignMaterial(opts.bannerText, { vertical: true, banner: true });
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 1.55, 2, 6), bannerMat);
    flag.position.set(poleX - 0.18, floor1Y + 3.45, poleZ + 0.52);
    flag.applyMatrix4(baseMatrix);
    sceneSignParent.add(flag);
  }

  return {
    floor1Y: gy + floor1Y,
    floor2Y: gy + floor2Y,
    baseMatrix,
  };
}

/**
 * 建造北宋酒楼门前特有的高耸竹木绑扎“彩楼欢门”（忠实还原原画十千脚店与孙羊正店前尖塔簇拥、花格彩帛高悬奇观！）
 */
export function addCailouHuanmen(
  batcher: StaticGeometryBatcher,
  x: number,
  z: number,
  yaw: number,
  width = 5.4,
  height = 8.4,
) {
  const gy = groundHeightAt(x, z);
  const base = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, gy, z);

  // 左右两座方形多层束竹高塔 + 中间跨门高拱花楼
  const towerOffset = width * 0.39;
  const towerHalf = 0.72;

  for (const side of [-1, 1]) {
    const tx = side * towerOffset;
    // 塔脚稳固抱鼓石础
    _m.makeTranslation(tx, 0.14, 0).premultiply(base);
    batcher.addBox('stonePodium', towerHalf * 2.25, 0.28, towerHalf * 2.25, _m);

    // 四角深色老杉木主柱 + 五根高耸攒尖长竹竿（远近层次皆醒目！）
    const cornerOffsets: Array<[number, number, number, string]> = [
      [-towerHalf, -towerHalf, 0.84, 'woodDark'],
      [towerHalf, -towerHalf, 0.86, 'woodDark'],
      [-towerHalf, towerHalf, 0.83, 'woodDark'],
      [towerHalf, towerHalf, 0.85, 'woodDark'],
      [0, -towerHalf, 0.95, 'bambooMat'],
      [0, towerHalf, 0.94, 'bambooMat'],
      [-towerHalf, 0, 0.92, 'bambooMat'],
      [towerHalf, 0, 0.93, 'bambooMat'],
      [0, 0, 1.08, 'woodLacquer'],
    ];
    for (const [ox, oz, hf, mKey] of cornerOffsets) {
      const ph = height * hf;
      _m.makeTranslation(tx + ox, ph * 0.5, oz).premultiply(base);
      batcher.addCylinder(mKey, 0.036, 0.056, ph, 6, _m);
    }

    // 多层横绑穿枋与四面密织斜交花格（欢门菱花格）
    const tiers = 6;
    for (let t = 1; t <= tiers; t++) {
      const ty = (t / (tiers + 0.5)) * height;
      const shrink = 1 - Math.max(0, t - 4) * 0.13;
      const wSpan = towerHalf * 2.18 * shrink;
      const barKey = t % 2 === 0 ? 'woodDark' : 'bambooMat';
      for (const oz of [-towerHalf * shrink, towerHalf * shrink]) {
        _m.makeTranslation(tx, ty, oz).premultiply(base);
        batcher.addBox(barKey, wSpan, 0.06, 0.06, _m);
      }
      for (const ox of [-towerHalf * shrink, towerHalf * shrink]) {
        _m.makeTranslation(tx + ox, ty, 0).premultiply(base);
        batcher.addBox(barKey, 0.06, 0.06, wSpan, _m);
      }
      // 前后与外侧菱形斜撑花格
      if (t <= tiers - 1) {
        for (const diag of [-1, 1]) {
          for (const faceZ of [-towerHalf * shrink, towerHalf * shrink]) {
            _euler.set(0, 0, diag * 0.64);
            _quat.setFromEuler(_euler);
            _pos.set(tx, ty - height * 0.075, faceZ);
            _m.compose(_pos, _quat, _scale.set(1, 1, 1)).premultiply(base);
            batcher.addBox('bambooMat', wSpan * 1.16, 0.042, 0.042, _m);
          }
          _euler.set(diag * 0.64, 0, 0);
          _quat.setFromEuler(_euler);
          _pos.set(tx + side * towerHalf * shrink, ty - height * 0.075, 0);
          _m.compose(_pos, _quat, _scale.set(1, 1, 1)).premultiply(base);
          batcher.addBox('bambooMat', 0.042, 0.042, wSpan * 1.16, _m);
        }
      }
    }
  }

  // 中央跨门多层花楼横梁、菱格花罩与攒尖群竿
  for (const [hy, mKey] of [
    [3.15, 'woodLacquer'],
    [4.05, 'woodDark'],
    [5.05, 'bambooMat'],
    [6.05, 'woodDark'],
  ] as Array<[number, string]>) {
    _m.makeTranslation(0, hy, 0).premultiply(base);
    batcher.addBox(mKey, width + 0.5, 0.085, 1.05, _m);
  }
  // 门楣上方密集斜交菱花格（原画彩楼正面核心视觉特征）
  const latticeCols = 6;
  const innerSpan = width * 0.62;
  for (let c = 0; c < latticeCols; c++) {
    const lx = -innerSpan * 0.5 + ((c + 0.5) / latticeCols) * innerSpan;
    for (const diag of [-1, 1]) {
      _euler.set(0, 0, diag * 0.68);
      _quat.setFromEuler(_euler);
      _pos.set(lx, 3.60, towerHalf * 0.72);
      _m.compose(_pos, _quat, _scale.set(1, 1, 1)).premultiply(base);
      batcher.addBox('bambooMat', 1.12, 0.04, 0.04, _m);

      _pos.set(lx, 4.55, towerHalf * 0.72);
      _m.compose(_pos, _quat, _scale.set(1, 1, 1)).premultiply(base);
      batcher.addBox('woodLight', 1.12, 0.04, 0.04, _m);
    }
  }

  const centerSpikes = 11;
  for (let i = 0; i < centerSpikes; i++) {
    const u = i / (centerSpikes - 1) - 0.5;
    const sx = u * (width * 0.72);
    const spikeH = 3.4 + (1 - Math.abs(u) * 1.28) * (height * 0.48);
    _m.makeTranslation(sx, 3.15 + spikeH * 0.5, 0).premultiply(base);
    batcher.addCylinder(i % 2 === 0 ? 'bambooMat' : 'woodDark', 0.028, 0.044, spikeH, 5, _m);
  }

  // 欢门暗红与青绿彩绸横披、垂带与红纱灯笼（柔和绢本古色）
  _m.makeTranslation(0, 3.32, towerHalf * 0.88).premultiply(base);
  batcher.addBox('ribbonRed', width * 0.88, 0.38, 0.10, _m);

  _m.makeTranslation(0, 4.35, towerHalf * 0.88).premultiply(base);
  batcher.addBox('ribbonGreen', width * 0.70, 0.30, 0.10, _m);

  _m.makeTranslation(0, 5.35, towerHalf * 0.82).premultiply(base);
  batcher.addBox('ribbonRed', width * 0.46, 0.26, 0.09, _m);

  // 门洞两侧悬垂彩帛飘带与红纱灯笼
  for (const lx of [-width * 0.22, width * 0.22, -towerOffset, towerOffset]) {
    _m.makeTranslation(lx, 2.72, towerHalf * 0.88).premultiply(base);
    batcher.addCylinder('ribbonRed', 0.18, 0.16, 0.42, 8, _m);
    _m.makeTranslation(lx, 2.95, towerHalf * 0.88).premultiply(base);
    batcher.addCylinder('woodDark', 0.12, 0.12, 0.06, 8, _m);
    _m.makeTranslation(lx, 2.49, towerHalf * 0.88).premultiply(base);
    batcher.addCylinder('woodDark', 0.10, 0.10, 0.06, 8, _m);
  }
}

/**
 * 建造郊野与河畔茅草顶农舍/野茶馆（厚重草檐、土坯墙、木立柱、竹篱院落）
 */
export function addThatchedHouse(
  batcher: StaticGeometryBatcher,
  x: number,
  z: number,
  width: number,
  depth: number,
  yaw = 0,
  openShed = false,
) {
  const gy = groundHeightAt(x, z);
  const base = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, gy, z);
  const h = 2.35;

  // 夯土矮台基
  _m.makeTranslation(0, -0.35, 0).premultiply(base);
  batcher.addBox('earthenWall', width + 0.3, 0.95, depth + 0.3, _m);

  // 四周原木柱
  const cols = Math.max(2, Math.round(width / 2.0));
  for (let i = 0; i <= cols; i++) {
    const cx = -width * 0.5 + (i / cols) * width;
    for (const cz of [-depth * 0.5, depth * 0.5]) {
      _m.makeTranslation(cx, 0.1 + h * 0.5, cz).premultiply(base);
      batcher.addCylinder('woodDark', 0.075, 0.09, h, 7, _m);
    }
  }

  if (!openShed) {
    _m.makeTranslation(0, 0.1 + h * 0.5, 0).premultiply(base);
    batcher.addBox('earthenWall', width - 0.14, h - 0.08, depth - 0.14, _m, [width * 0.4, 0.8]);
    // 柴门与小木格窗
    _m.makeTranslation(-width * 0.12, 0.95, depth * 0.45).premultiply(base);
    batcher.addBox('woodDark', 0.92, 1.72, 0.08, _m);
    if (width >= 3.6) {
      addLatticeWindow(batcher, base, width * 0.24, 1.32, depth * 0.45, 0.88, 0.76, 0, 'woodDark');
    }
  } else {
    // 路边野茶棚：仅后侧半墙，内摆木桌条凳
    _m.makeTranslation(0, 0.1 + h * 0.45, -depth * 0.45).premultiply(base);
    batcher.addBox('wovenMat', width - 0.16, h * 0.9, 0.08, _m);
    for (const tx of [-width * 0.22, width * 0.22]) {
      _m.makeTranslation(tx, 0.46, 0.08).premultiply(base);
      batcher.addBox('woodLight', 1.05, 0.66, 0.72, _m);
    }
  }

  // 圆润厚实的四阿/双坡覆茅草屋顶 + 压脊交叉草束
  const roofW = width + 0.95;
  const roofD = depth + 0.95;
  const rise = depth * 0.36 + 0.35;

  for (const side of [-1, 1]) {
    const slopeLen = Math.hypot(roofD * 0.5, rise);
    const ang = Math.atan2(rise, roofD * 0.5);
    _euler.set(side * ang, 0, 0);
    _quat.setFromEuler(_euler);
    _pos.set(0, h + 0.1 + rise * 0.46, side * (roofD * 0.24));
    _m.compose(_pos, _quat, _scale.set(1, 1, 1)).premultiply(base);
    // 分两层叠厚表现茅草蓬松边缘
    batcher.addBox('thatchRoof', roofW, 0.24, slopeLen, _m, [roofW * 0.5, slopeLen * 0.5]);
  }
  // 山墙草坡补齐
  for (const sx of [-1, 1]) {
    const shape = new THREE.Shape();
    shape.moveTo(-depth * 0.48, 0);
    shape.lineTo(0, rise);
    shape.lineTo(depth * 0.48, 0);
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: false });
    g.rotateY(Math.PI / 2);
    g.translate(sx * (width * 0.47) - 0.06, h + 0.08, 0);
    batcher.add('earthenWall', g, base);
    g.dispose();
  }
  // 草脊压木
  _m.makeTranslation(0, h + rise + 0.16, 0).premultiply(base);
  batcher.addCylinder('thatchRoof', 0.16, 0.18, roofW + 0.08, 8, _m.clone().multiply(new THREE.Matrix4().makeRotationZ(Math.PI / 2)));
}

/**
 * 建造竹篱笆段
 */
export function addBambooFence(
  batcher: StaticGeometryBatcher,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
) {
  const len = Math.hypot(x1 - x0, z1 - z0);
  const steps = Math.max(3, Math.round(len / 0.45));
  const ang = Math.atan2(x1 - x0, z1 - z0);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const px = x0 + (x1 - x0) * t;
    const pz = z0 + (z1 - z0) * t;
    const py = groundHeightAt(px, pz);
    _m.makeTranslation(px, py + 0.58, pz);
    batcher.addCylinder('bambooMat', 0.025, 0.032, 1.25, 5, _m);
  }
  const midX = (x0 + x1) * 0.5;
  const midZ = (z0 + z1) * 0.5;
  const midY = groundHeightAt(midX, midZ);
  for (const ry of [0.38, 0.88]) {
    _m.makeRotationY(ang).setPosition(midX, midY + ry, midZ);
    batcher.addBox('bambooMat', 0.035, 0.04, len, _m);
  }
}

/**
 * 建造全卷灵魂地标——斜跨汴河的无柱编木拱“虹桥”
 */
export function addRainbowBridge(batcher: StaticGeometryBatcher) {
  const hw = RAINBOW_BRIDGE.deckHalfWidth; // 3.15m
  const rampS = RAINBOW_BRIDGE.rampHalfSpan; // 17.2m
  const archS = RAINBOW_BRIDGE.archHalfSpan; // 12.2m

  // 桥局部坐标系变换：局部 +X 沿桥跨方向 s，局部 +Z 沿桥宽方向 w
  const bridgeWorld = new THREE.Matrix4()
    .makeRotationY(-RB_YAW)
    .setPosition(RAINBOW_BRIDGE.centerX, 0, RAINBOW_BRIDGE.centerZ);

  // 1. 两岸青石桥台驳岸（严格承托于引桥坡面之下，绝不突兀冒出路面！）与水际护岸木桩
  for (const endSign of [-1, 1]) {
    const abutmentS = endSign * (archS + 1.8);
    // 桥台顶面控制在 +0.98m（低于此处 1.25m..1.70m 的桥面板），向下深扎水底
    _m.makeTranslation(abutmentS, -0.32, 0).premultiply(bridgeWorld);
    batcher.addBox('stonePodium', 4.2, 2.6, hw * 2.28, _m, [1.5, 1.0]);

    // 引桥两侧顺坡石砌雁翅护坡矮栏石，自然衔接河堤土路与木桥面
    const wingS0 = endSign * archS;
    const wingS1 = endSign * rampS;
    const wy0 = rainbowBridgeElevationByS(wingS0);
    const wy1 = rainbowBridgeElevationByS(wingS1);
    const wingLen = Math.hypot(wingS1 - wingS0, wy1 - wy0);
    const wingAng = Math.atan2(wy1 - wy0, wingS1 - wingS0);
    for (const side of [-1, 1]) {
      _euler.set(0, 0, wingAng);
      _quat.setFromEuler(_euler);
      _pos.set((wingS0 + wingS1) * 0.5, (wy0 + wy1) * 0.5 - 0.28, side * (hw + 0.16));
      _m.compose(_pos, _quat, _scale.set(1, 1, 1)).premultiply(bridgeWorld);
      batcher.addBox('stonePodium', wingLen, 0.68, 0.34, _m, [1.8, 0.4]);
    }

    // 岸前排桩（原画桥台水际清晰可见成排护岸圆木桩，顶面齐平桥台石岸）
    for (let w = -hw - 1.3; w <= hw + 1.3; w += 0.52) {
      _m.makeTranslation(endSign * (archS - 0.15), -0.38, w).premultiply(bridgeWorld);
      batcher.addCylinder('woodDark', 0.085, 0.10, 2.75, 7, _m);
    }
    // 横向锁桩木枋
    _m.makeTranslation(endSign * (archS - 0.15), 0.72, 0).premultiply(bridgeWorld);
    batcher.addBox('woodDark', 0.18, 0.16, hw * 2.7, _m);
  }

  // 2. 核心编木拱骨架：两套交替穿插的多折边红褐巨木拱骨 + 横向贯木牛头梁（水中绝无桥墩！）
  const ribCount = 9;
  const sys1Nodes = [-archS, -archS * 0.36, archS * 0.36, archS]; // 三折边系统
  const sys2Nodes = [-archS, -archS * 0.56, 0, archS * 0.56, archS]; // 四折边系统

  const archElevation = (s: number) => rainbowBridgeElevationByS(s) - 0.38;

  for (let r = 0; r < ribCount; r++) {
    const w = -hw + 0.28 + (r / (ribCount - 1)) * (hw * 2 - 0.56);
    const nodes = r % 2 === 0 ? sys1Nodes : sys2Nodes;
    const matKey = r % 2 === 0 ? 'woodLacquer' : 'woodDark';

    for (let k = 0; k < nodes.length - 1; k++) {
      const s0 = nodes[k];
      const s1 = nodes[k + 1];
      const y0 = k === 0 ? -0.35 : archElevation(s0);
      const y1 = k === nodes.length - 2 ? -0.35 : archElevation(s1);
      const segLen = Math.hypot(s1 - s0, y1 - y0) + 0.45;
      const angZ = Math.atan2(y1 - y0, s1 - s0);

      _euler.set(0, 0, angZ);
      _quat.setFromEuler(_euler);
      _pos.set((s0 + s1) * 0.5, (y0 + y1) * 0.5, w);
      _m.compose(_pos, _quat, _scale.set(1, 1, 1)).premultiply(bridgeWorld);
      batcher.addBox(matKey, segLen, 0.26, 0.22, _m);
    }
  }

  // 横贯整座桥宽的横梁（牛头木）
  const crossNodes = [-archS * 0.72, -archS * 0.46, -archS * 0.22, 0, archS * 0.22, archS * 0.46, archS * 0.72];
  for (const cs of crossNodes) {
    const cy = archElevation(cs) - 0.08;
    _m.makeTranslation(cs, cy, 0).premultiply(bridgeWorld);
    batcher.addCylinder('woodDark', 0.14, 0.14, hw * 2.18, 8, _m.clone().multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)));
  }

  // 3. 弧形木桥面板与防滑脚踏木条
  const deckSegs = 28;
  for (let i = 0; i < deckSegs; i++) {
    const s0 = -rampS + (i / deckSegs) * (rampS * 2);
    const s1 = -rampS + ((i + 1) / deckSegs) * (rampS * 2);
    const y0 = rainbowBridgeElevationByS(s0);
    const y1 = rainbowBridgeElevationByS(s1);
    const len = Math.hypot(s1 - s0, y1 - y0) + 0.04;
    const angZ = Math.atan2(y1 - y0, s1 - s0);

    _euler.set(0, 0, angZ);
    _quat.setFromEuler(_euler);
    _pos.set((s0 + s1) * 0.5, (y0 + y1) * 0.5 + 0.06, 0);
    _m.compose(_pos, _quat, _scale.set(1, 1, 1)).premultiply(bridgeWorld);
    batcher.addBox('woodLight', len, 0.14, hw * 2.04, _m, [0.5, 2.0]);

    // 防滑横木条
    _pos.set((s0 + s1) * 0.5, (y0 + y1) * 0.5 + 0.14, 0);
    _m.compose(_pos, _quat, _scale.set(1, 1, 1)).premultiply(bridgeWorld);
    batcher.addBox('woodDark', 0.08, 0.04, hw * 1.96, _m);
  }

  // 4. 桥面两侧宋式木构栏杆（随桥面曲率起伏）
  const railSegs = 22;
  for (const side of [-1, 1]) {
    const rw = side * (hw - 0.12);
    for (let i = 0; i <= railSegs; i++) {
      const s = -rampS * 0.94 + (i / railSegs) * (rampS * 1.88);
      const y = rainbowBridgeElevationByS(s);
      _m.makeTranslation(s, y + 0.58, rw).premultiply(bridgeWorld);
      batcher.addBox('woodDark', 0.11, 1.08, 0.11, _m);

      if (i < railSegs) {
        const sn = -rampS * 0.94 + ((i + 1) / railSegs) * (rampS * 1.88);
        const yn = rainbowBridgeElevationByS(sn);
        const rLen = Math.hypot(sn - s, yn - y);
        const angZ = Math.atan2(yn - y, sn - s);
        _euler.set(0, 0, angZ);
        _quat.setFromEuler(_euler);
        for (const hOff of [0.98, 0.56, 0.20]) {
          _pos.set((s + sn) * 0.5, (y + yn) * 0.5 + hOff, rw);
          _m.compose(_pos, _quat, _scale.set(1, 1, 1)).premultiply(bridgeWorld);
          batcher.addBox('woodLacquer', rLen + 0.04, 0.075, 0.08, _m);
        }
      }
    }
  }

  // 5. 四根高耸桥头望柱（华表云板瑞鹤柱，原画虹桥四角极具辨识度！）
  for (const endSign of [-1, 1]) {
    for (const side of [-1, 1]) {
      const p = fromRainbowBridgeLocal(endSign * (archS + 2.2), side * (hw + 0.45));
      const gy = groundHeightAt(p.x, p.z);
      _m.makeTranslation(p.x, gy + 3.1, p.z);
      batcher.addCylinder('woodLacquer', 0.11, 0.15, 6.2, 8, _m);
      // 云板横翼
      _m.makeRotationY(-RB_YAW).setPosition(p.x, gy + 5.65, p.z);
      batcher.addBox('plasterWall', 0.95, 0.24, 0.08, _m);
      // 柱顶立鹤雕饰
      _m.makeTranslation(p.x, gy + 6.38, p.z);
      batcher.addCylinder('plasterWall', 0.05, 0.12, 0.48, 6, _m);
    }
  }
}

/**
 * 建造护城河平桥与卷首乡间小木桥
 */
export function addSecondaryBridges(batcher: StaticGeometryBatcher) {
  // 1. 护城河木梁平桥（X ≈ -133, Z ≈ 16）
  const mb = MOAT_BRIDGE;
  _m.makeTranslation(mb.centerX, mb.deckY - 0.08, mb.centerZ);
  batcher.addBox('woodLight', mb.halfSpanX * 2.1, 0.18, mb.halfWidthZ * 2, _m, [2, 1]);

  // 桥下排桩桥墩
  for (const px of [mb.centerX - 2.6, mb.centerX + 2.6]) {
    for (const pz of [mb.centerZ - 1.7, mb.centerZ, mb.centerZ + 1.7]) {
      _m.makeTranslation(px, -0.35, pz);
      batcher.addCylinder('woodDark', 0.10, 0.11, 2.2, 7, _m);
    }
  }
  // 两侧木栏杆
  const id = new THREE.Matrix4();
  addSongBalustrade(
    batcher,
    id,
    mb.centerX - mb.halfSpanX,
    mb.centerZ - mb.halfWidthZ + 0.1,
    mb.centerX + mb.halfSpanX,
    mb.centerZ - mb.halfWidthZ + 0.1,
    mb.deckY,
    'woodDark',
  );
  addSongBalustrade(
    batcher,
    id,
    mb.centerX - mb.halfSpanX,
    mb.centerZ + mb.halfWidthZ - 0.1,
    mb.centerX + mb.halfSpanX,
    mb.centerZ + mb.halfWidthZ - 0.1,
    mb.deckY,
    'woodDark',
  );

  // 2. 卷首乡间溪上原木小桥（X ≈ +218, Z ≈ +5.5）
  const rb = RURAL_BRIDGE;
  _m.makeTranslation(rb.centerX, rb.deckY - 0.06, rb.centerZ);
  batcher.addBox('woodDark', rb.halfSpanX * 2.05, 0.14, rb.halfWidthZ * 2, _m);
  for (const px of [rb.centerX - 1.8, rb.centerX + 1.8]) {
    for (const pz of [rb.centerZ - 0.9, rb.centerZ + 0.9]) {
      _m.makeTranslation(px, -0.25, pz);
      batcher.addCylinder('woodDark', 0.08, 0.09, 1.4, 6, _m);
    }
  }
}

/**
 * 建造汴河两岸宋代木桩石砌驳岸、系船桩与下河石埠头台阶（消除沙坡直接入水的松散感，还原原画严谨河岸线！）
 */
export function addRiverEmbankments(batcher: StaticGeometryBatcher) {
  const buildBankRun = (
    xStart: number,
    xEnd: number,
    bankSide: -1 | 1, // -1 = 河北岸, +1 = 河南岸
    withStoneQuay: boolean,
    stepXs: number[] = [],
  ) => {
    const stepLen = 2.4;
    const count = Math.max(2, Math.round((xEnd - xStart) / stepLen));
    for (let i = 0; i < count; i++) {
      const x0 = xStart + (i / count) * (xEnd - xStart);
      const x1 = xStart + ((i + 1) / count) * (xEnd - xStart);
      const xm = (x0 + x1) * 0.5;
      // 跳过虹桥桥台正下方（以免与桥拱穿插）
      if (xm > -7.5 && xm < 13.5) continue;

      const r0 = queryBianRiver(x0, 0);
      const r1 = queryBianRiver(x1, 0);
      const z0 = r0.closestZ + bankSide * (r0.halfWidth - 0.18);
      const z1 = r1.closestZ + bankSide * (r1.halfWidth - 0.18);
      const segLen = Math.hypot(x1 - x0, z1 - z0) + 0.08;
      const yaw = Math.atan2(x1 - x0, z1 - z0);
      const gy = groundHeightAt(xm, (z0 + z1) * 0.5 + bankSide * 1.1);
      const topY = Math.max(0.42, Math.min(0.82, gy * 0.82));

      if (withStoneQuay) {
        // 青石叠涩驳岸墙 + 压顶条石
        _m.makeRotationY(yaw).setPosition(xm, topY - 0.72, (z0 + z1) * 0.5 + bankSide * 0.24);
        batcher.addBox('stonePodium', 0.52, 1.55, segLen, _m, [0.4, segLen * 0.45]);

        _m.makeRotationY(yaw).setPosition(xm, topY + 0.08, (z0 + z1) * 0.5 + bankSide * 0.20);
        batcher.addBox('woodDark', 0.32, 0.12, segLen, _m);
      }

      // 沿水际密排护岸圆木桩（每段 3 根）
      for (let p = 0; p < 3; p++) {
        const pt = (p + 0.5) / 3;
        const px = x0 + (x1 - x0) * pt;
        const pz = z0 + (z1 - z0) * pt;
        _m.makeTranslation(px, topY - 0.55, pz);
        batcher.addCylinder('woodDark', 0.07, 0.085, 1.45, 6, _m);
      }

      // 每隔数段立一根系船木桩（将军柱）
      if (withStoneQuay && i % 4 === 1) {
        _m.makeTranslation(xm, topY + 0.28, (z0 + z1) * 0.5 + bankSide * 0.55);
        batcher.addCylinder('woodDark', 0.095, 0.11, 0.72, 7, _m);
      }
    }

    // 码头下水青石埠头台阶
    for (const sx of stepXs) {
      const r = queryBianRiver(sx, 0);
      const bz = r.closestZ + bankSide * (r.halfWidth - 0.1);
      const yaw = Math.atan2(r.tangentX, r.tangentZ);
      for (let st = 0; st < 4; st++) {
        const drop = st * 0.17;
        const out = -bankSide * (st * 0.34);
        _m.makeRotationY(yaw).setPosition(sx, 0.52 - drop, bz + out);
        batcher.addBox('stonePodium', 0.42, 0.24, 2.6, _m);
      }
    }
  };

  // 河北岸繁华漕运码头与茶肆长堤（X = +16 .. +115）
  buildBankRun(16, 115, -1, true, [53, 65, 76, 88, 102]);
  // 河南岸古柳村舍护岸木桩（X = +15 .. +62）
  buildBankRun(15, 62, 1, false, [32]);
  // 桥西十千脚店与临汴大酒楼南岸石砌驳岸（X = -54 .. -8）
  buildBankRun(-54, -8, 1, true, [-24, -38]);
  // 桥西河北岸驳岸木桩（X = -52 .. -6）
  buildBankRun(-52, -6, -1, false, [-22]);
}

/**
 * 建造高大收分青砖城门城台 + 过梁门洞 + 马道 + 南北夯土城墙 + 歇山顶木构城楼
 */
export function addCityGateComplex(
  batcher: StaticGeometryBatcher,
  sceneSignParent: THREE.Object3D,
  matLib: MaterialLibrary,
) {
  // 城门中心位于 X = -153.5, Z = +4.5，采用微向东南敞开的散点透视偏角（gateYaw = -0.22 rad），
  // 使正街与俯瞰镜头都能一眼同时饱览东立面平棊门洞、穿门驼队与西南侧登城马道，完全契合原画构图！
  const gateX = -153.5;
  const gateZ = 4.5;
  const gateYaw = -0.22;
  const gy = groundHeightAt(gateX, gateZ);
  const base = new THREE.Matrix4().makeRotationY(gateYaw).setPosition(gateX, gy, gateZ);

  const wallThickX = 10.4;
  const bastionSpanZ = 15.2;
  const wallH = 7.2;
  const passageW = 4.8;
  const passageH = 5.2;

  // 1. 门洞南北两侧巨大收分砖砌墩台（上窄下宽梯形断面）
  const pierZLen = (bastionSpanZ - passageW) * 0.5;
  for (const side of [-1, 1]) {
    const cz = side * (passageW * 0.5 + pierZLen * 0.5);
    const layers = 5;
    for (let l = 0; l < layers; l++) {
      const t0 = l / layers;
      const lh = wallH / layers;
      const batter = t0 * 1.25;
      _m.makeTranslation(0, lh * (l + 0.5) - 0.1, cz).premultiply(base);
      batcher.addBox(
        'brickWall',
        wallThickX - batter,
        lh + 0.04,
        pierZLen - batter * 0.42,
        _m,
        [2.4, 0.9],
      );
    }
  }

  // 门洞上方过梁砖墙与排木过梁（北宋汴京城门典型平棊排木门洞）
  const lintelH = wallH - passageH;
  _m.makeTranslation(0, passageH + lintelH * 0.5, 0).premultiply(base);
  batcher.addBox('brickWall', wallThickX - 1.0, lintelH, passageW + 0.4, _m, [2.2, 0.9]);

  for (let lx = -wallThickX * 0.44; lx <= wallThickX * 0.44; lx += 0.62) {
    _m.makeTranslation(lx, passageH - 0.08, 0).premultiply(base);
    batcher.addBox('woodDark', 0.26, 0.22, passageW + 0.2, _m);
  }

  // 门洞内向两侧敞开的朱褐包铁双扇大城门
  for (const side of [-1, 1]) {
    _m.makeTranslation(wallThickX * 0.16, passageH * 0.48, side * (passageW * 0.46)).premultiply(base);
    batcher.addBox('woodLacquer', 2.05, passageH * 0.94, 0.16, _m);
  }

  // 2. 城台顶面青砖地坪与四周雉堞女墙
  const topW = wallThickX - 1.25;
  const topD = bastionSpanZ - 0.55;
  _m.makeTranslation(0, wallH + 0.08, 0).premultiply(base);
  batcher.addBox('brickWall', topW, 0.22, topD, _m, [2.6, 3.6]);

  // 东侧外向雉堞垛口与南北矮宇墙
  for (let pz = -topD * 0.46; pz <= topD * 0.46; pz += 1.28) {
    _m.makeTranslation(topW * 0.48, wallH + 0.56, pz).premultiply(base);
    batcher.addBox('brickWall', 0.34, 0.92, 0.86, _m);
  }
  for (const side of [-1, 1]) {
    _m.makeTranslation(0, wallH + 0.46, side * (topD * 0.48)).premultiply(base);
    batcher.addBox('brickWall', topW, 0.74, 0.34, _m, [2.2, 0.4]);
  }

  // 3. 城台南西侧斜坡登城马道（对照原画：城台近景侧清晰可见斜向上攀的砖砌阶梯马道！）
  const rampSteps = 14;
  for (let i = 0; i < rampSteps; i++) {
    const t = (i + 0.5) / rampSteps;
    const rh = wallH * t;
    const rz = bastionSpanZ * 0.5 + 1.05;
    const rx = -topW * 0.46 + t * (topW * 0.74);
    _m.makeTranslation(rx, rh * 0.5, rz).premultiply(base);
    batcher.addBox('brickWall', (topW * 0.80) / rampSteps + 0.12, rh, 2.05, _m, [0.5, 1.1]);
    // 马道护栏砖壁
    _m.makeTranslation(rx, rh + 0.40, rz + 0.92).premultiply(base);
    batcher.addBox('brickWall', (topW * 0.80) / rampSteps + 0.12, 0.64, 0.22, _m);
  }

  // 4. 城台之上的雄伟歇山顶木构城楼（平座斗拱 + 回廊栏杆 + 五开间朱柱格子门 + 举折飞檐歇山顶）
  const towerW = 7.4; // 沿城台进深
  const towerD = 11.8; // 沿城台面阔
  const pingzuoH = 1.02;
  const towerFloorY = wallH + 0.18 + pingzuoH;

  // 平座斗拱层
  _m.makeTranslation(0, wallH + 0.18 + pingzuoH * 0.5, 0).premultiply(base);
  batcher.addBox('woodLacquer', towerW + 0.55, pingzuoH, towerD + 0.55, _m);
  for (let bz = -towerD * 0.5; bz <= towerD * 0.5; bz += 1.32) {
    for (const bx of [-towerW * 0.5 - 0.32, towerW * 0.5 + 0.32]) {
      _m.makeTranslation(bx, wallH + 0.76, bz).premultiply(base);
      batcher.addBox('woodDark', 0.44, 0.36, 0.34, _m);
    }
  }

  // 城楼平座四周回廊栏杆
  const trx = towerW * 0.5 + 0.42;
  const trz = towerD * 0.5 + 0.42;
  addSongBalustrade(batcher, base, -trx, -trz, trx, -trz, towerFloorY, 'woodLacquer');
  addSongBalustrade(batcher, base, -trx, trz, trx, trz, towerFloorY, 'woodLacquer');
  addSongBalustrade(batcher, base, -trx, -trz, -trx, trz, towerFloorY, 'woodLacquer');
  addSongBalustrade(batcher, base, trx, -trz, trx, trz, towerFloorY, 'woodLacquer');

  // 城楼主体朱柱与四面直棂窗（旋转 PI/2 调用屋面，使正脊沿南北向延伸，与原画完全一致！）
  const towerRotatedBase = new THREE.Matrix4()
    .makeRotationY(Math.PI / 2)
    .premultiply(base);

  const hallH = 3.15;
  const baysZ = 5;
  for (let i = 0; i <= baysZ; i++) {
    const cz = -towerD * 0.42 + (i / baysZ) * (towerD * 0.84);
    for (const cx of [-towerW * 0.38, towerW * 0.38]) {
      _m.makeTranslation(cz, towerFloorY + hallH * 0.5, cx).premultiply(towerRotatedBase);
      batcher.addCylinder('woodLacquer', 0.105, 0.12, hallH, 8, _m);
    }
  }
  _m.makeTranslation(0, towerFloorY + hallH * 0.5, 0).premultiply(towerRotatedBase);
  batcher.addBox('plasterWall', towerD * 0.78, hallH - 0.2, towerW * 0.68, _m);

  // 城楼东西正面成排格子门窗 + 城楼报时大鼓
  for (let i = -1; i <= 1; i++) {
    addLatticeWindow(batcher, towerRotatedBase, i * 2.35, towerFloorY + 1.52, towerW * 0.36, 1.85, 1.8, 0, 'woodLacquer');
    addLatticeWindow(batcher, towerRotatedBase, i * 2.35, towerFloorY + 1.52, -towerW * 0.36, 1.85, 1.8, Math.PI, 'woodLacquer');
  }
  _m.makeTranslation(0, towerFloorY + 0.92, towerW * 0.15).premultiply(towerRotatedBase);
  batcher.addCylinder('ribbonRed', 0.46, 0.46, 0.60, 12, _m.clone().multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)));

  // 城楼大歇山瓦顶（长脊沿南北方向）
  addDetailedTiledRoof(batcher, towerRotatedBase, towerFloorY + hallH, towerD * 0.94, towerW * 0.90, 2.65, true);

  // 门额牌匾
  const gatePlaque = new THREE.Mesh(
    new THREE.BoxGeometry(0.10, 0.66, 2.2),
    matLib.getSignMaterial('东角子门', { vertical: false }),
  );
  gatePlaque.position.set(wallThickX * 0.46, passageH + 0.92, 0);
  gatePlaque.applyMatrix4(base);
  sceneSignParent.add(gatePlaque);

  // 5. 南北两侧蜿蜒低矮夯土旧城垣（原画中城门砖台两侧为风化低缓的斜坡土筑城垣，高约 2.4m..4.2m，绝不遮挡街市视线！）
  for (const dirZ of [-1, 1]) {
    const segments = 7;
    for (let s = 0; s < segments; s++) {
      const localZ = dirZ * (bastionSpanZ * 0.5 + 2.2 + s * 4.8);
      const localX = -1.2 - s * 0.35;
      const hDecay = Math.max(2.2, 4.2 - s * 0.30);
      _m.makeTranslation(localX, hDecay * 0.42, localZ).premultiply(base);
      batcher.addBox('earthenWall', 6.2 - s * 0.25, hDecay + 0.6, 5.2, _m, [1.6, 1.0]);
    }
  }
}

/**
 * 建造卷尾十字街口标志性的宋代“四眼石水井”
 */
export function addFourEyeWell(batcher: StaticGeometryBatcher, x: number, z: number) {
  const gy = groundHeightAt(x, z);
  const base = new THREE.Matrix4().makeTranslation(x, gy, z);
  // 石砌方井台
  _m.makeTranslation(0, 0.16, 0).premultiply(base);
  batcher.addBox('stonePodium', 2.45, 0.34, 2.45, _m);
  // 十字石隔梁形成四个汲水井眼
  _m.makeTranslation(0, 0.36, 0).premultiply(base);
  batcher.addBox('stonePodium', 2.25, 0.18, 0.22, _m);
  _m.makeTranslation(0, 0.36, 0).premultiply(base);
  batcher.addBox('stonePodium', 0.22, 0.18, 2.25, _m);
  for (const side of [-1, 1]) {
    _m.makeTranslation(side * 1.02, 0.36, 0).premultiply(base);
    batcher.addBox('stonePodium', 0.22, 0.18, 2.25, _m);
    _m.makeTranslation(0, 0.36, side * 1.02).premultiply(base);
    batcher.addBox('stonePodium', 2.25, 0.18, 0.22, _m);
  }
  // 井口深暗水影
  _m.makeTranslation(0, 0.28, 0).premultiply(base);
  batcher.addBox('ironFitting', 1.82, 0.06, 1.82, _m);
}

/**
 * 生成自然收分、带凹凸棱线与扭转沧桑感的树干网格（彻底告别等粗圆管感！）
 */
function createGnarledTrunkGeo(
  curve: THREE.CatmullRomCurve3,
  tubularSegs: number,
  radialSegs: number,
  radiusAtT: (t: number, theta: number) => number,
): THREE.BufferGeometry {
  const frames = curve.computeFrenetFrames(tubularSegs, false);
  const verts: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= tubularSegs; i++) {
    const t = i / tubularSegs;
    const pt = curve.getPointAt(t);
    const N = frames.normals[i];
    const B = frames.binormals[i];

    for (let j = 0; j <= radialSegs; j++) {
      const u = j / radialSegs;
      const theta = u * Math.PI * 2;
      const r = radiusAtT(t, theta);
      const cx = Math.cos(theta);
      const sx = Math.sin(theta);
      verts.push(
        pt.x + (cx * N.x + sx * B.x) * r,
        pt.y + (cx * N.y + sx * B.y) * r,
        pt.z + (cx * N.z + sx * B.z) * r,
      );
      uvs.push(u * 1.6, t * 2.2);
    }
  }

  const stride = radialSegs + 1;
  for (let i = 0; i < tubularSegs; i++) {
    for (let j = 0; j < radialSegs; j++) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = (i + 1) * stride + (j + 1);
      const d = i * stride + (j + 1);
      indices.push(a, b, d, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * 树木系统：
 * 1. 老柳（盘根收腰歪斜树干 + 树头截干肿瘤 + 向上向外弧形放射细枝 + GPU 随风摇曳的早春稀疏嫩芽冠）
 * 2. 枯枝杂树（收分曲折主干 + 多级分叉寒林细枝）
 */
export class TreeSystem {
  private willowCards: Array<{ x: number; y: number; z: number; rx: number; ry: number; rz: number; sx: number; sy: number }> = [];
  private dryTwigCards: Array<{ x: number; y: number; z: number; rx: number; ry: number; rz: number; sx: number; sy: number }> = [];
  private rng = createRng(11020309);

  public addPollardedWillow(
    batcher: StaticGeometryBatcher,
    x: number,
    z: number,
    scale = 1.0,
    leanYaw?: number,
  ) {
    const gy = groundHeightAt(x, z);
    const yaw = leanYaw ?? this.rng() * Math.PI * 2;
    const leanDist = (0.58 + this.rng() * 0.62) * scale;
    const trunkH = (2.15 + this.rng() * 0.72) * scale;
    const twistSeed = this.rng() * Math.PI * 2;

    const lx = Math.cos(yaw) * leanDist;
    const lz = Math.sin(yaw) * leanDist;
    const perpX = -Math.sin(yaw) * 0.24 * scale * (this.rng() > 0.5 ? 1 : -1);
    const perpZ = Math.cos(yaw) * 0.24 * scale * (this.rng() > 0.5 ? 1 : -1);

    // 歪斜粗矮苍古主干（根部宽张 -> 腰部收窄扭曲 -> 顶部柳头膨大，完全还原张择端笔下盘根古柳！）
    const p0 = new THREE.Vector3(x, gy - 0.22, z);
    const p1 = new THREE.Vector3(x + lx * 0.34 + perpX, gy + trunkH * 0.42, z + lz * 0.34 + perpZ);
    const p2 = new THREE.Vector3(x + lx * 0.76 - perpX * 0.4, gy + trunkH * 0.78, z + lz * 0.76 - perpZ * 0.4);
    const p3 = new THREE.Vector3(x + lx, gy + trunkH, z + lz);
    const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);

    const trunkGeo = createGnarledTrunkGeo(curve, 9, 8, (t, theta) => {
      // 根部外扩 + 中腰收细 + 树头膨大成瘤 + 纵向树筋凹凸
      const rootFlare = Math.pow(1 - t, 3.0) * 0.16;
      const waist = 0.19 + 0.04 * Math.cos(t * Math.PI);
      const pollardSwell = Math.pow(t, 3.8) * 0.15;
      const fluting = Math.sin(theta * 3 + t * 4.5 + twistSeed) * 0.032 * (1 - t * 0.3);
      return (waist + rootFlare + pollardSwell + fluting) * scale;
    });
    batcher.add('barkTrunk', trunkGeo);
    trunkGeo.dispose();

    // 树根抓地隆起板根
    for (let r = 0; r < 5; r++) {
      const ra = (r / 5) * Math.PI * 2 + this.rng() * 0.5;
      _euler.set(0.68, ra, 0, 'YXZ');
      _quat.setFromEuler(_euler);
      _pos.set(x + Math.sin(ra) * 0.28 * scale, gy + 0.14 * scale, z + Math.cos(ra) * 0.28 * scale);
      _m.compose(_pos, _quat, _scale.set(1, 1, 1));
      batcher.addCylinder('barkTrunk', 0.06 * scale, 0.15 * scale, 0.68 * scale, 5, _m);
    }

    const crownX = p3.x;
    const crownY = p3.y;
    const crownZ = p3.z;

    // 苍古多疙瘩截干柳头树瘤
    for (let b = 0; b < 3; b++) {
      const ba = (b / 3) * Math.PI * 2 + twistSeed;
      const br = b === 0 ? 0 : 0.16 * scale;
      const burl = new THREE.IcosahedronGeometry((b === 0 ? 0.36 : 0.24) * scale, 0);
      burl.scale(1.18, 0.72, 1.12);
      burl.translate(crownX + Math.cos(ba) * br, crownY - 0.04 * b * scale, crownZ + Math.sin(ba) * br);
      batcher.add('barkTrunk', burl);
      burl.dispose();
    }

    // 树头向四面弧形放射出的 18 根柔韧双节细柳枝（先斜向上劲挺伸展，末梢微弧外张）
    const shootCount = 18;
    for (let i = 0; i < shootCount; i++) {
      const ang = (i / shootCount) * Math.PI * 2 + (this.rng() - 0.5) * 0.22;
      const tilt1 = 0.24 + (i % 3) * 0.20 + this.rng() * 0.14;
      const len1 = (0.95 + this.rng() * 0.45) * scale;

      const midX = crownX + Math.sin(ang) * Math.sin(tilt1) * len1;
      const midY = crownY + Math.cos(tilt1) * len1;
      const midZ = crownZ + Math.cos(ang) * Math.sin(tilt1) * len1;

      _euler.set(tilt1, ang, 0, 'YXZ');
      _quat.setFromEuler(_euler);
      _pos.set((crownX + midX) * 0.5, (crownY + midY) * 0.5, (crownZ + midZ) * 0.5);
      _m.compose(_pos, _quat, _scale.set(1, 1, 1));
      batcher.addCylinder('barkTrunk', 0.024 * scale, 0.046 * scale, len1, 5, _m);

      // 外梢柔弧延伸段
      const tilt2 = tilt1 + 0.28 + this.rng() * 0.18;
      const len2 = (0.95 + this.rng() * 0.55) * scale;
      const tipX = midX + Math.sin(ang) * Math.sin(tilt2) * len2;
      const tipY = midY + Math.cos(tilt2) * len2;
      const tipZ = midZ + Math.cos(ang) * Math.sin(tilt2) * len2;

      _euler.set(tilt2, ang, 0, 'YXZ');
      _quat.setFromEuler(_euler);
      _pos.set((midX + tipX) * 0.5, (midY + tipY) * 0.5, (midZ + tipZ) * 0.5);
      _m.compose(_pos, _quat, _scale.set(1, 1, 1));
      batcher.addCylinder('barkTrunk', 0.009 * scale, 0.024 * scale, len2, 4, _m);
    }

    // 统一以柳头树瘤（crownX, crownY, crownZ）为根部枢轴向四周放射出早春柳丝扇面（绝无悬空脱节枝簇！）
    const cardCount = 12;
    for (let c = 0; c < cardCount; c++) {
      const ang = (c / cardCount) * Math.PI * 2 + this.rng() * 0.25;
      const ring = c % 3;
      const outR = (0.06 + ring * 0.08) * scale;
      const pitchOut = (0.18 + ring * 0.18) * (c % 2 === 0 ? 1 : -1);
      this.willowCards.push({
        x: crownX + Math.sin(ang) * outR,
        y: crownY + (0.05 + this.rng() * 0.12) * scale,
        z: crownZ + Math.cos(ang) * outR,
        rx: pitchOut,
        ry: ang,
        rz: (this.rng() - 0.5) * 0.20,
        sx: (2.65 + this.rng() * 0.55) * scale,
        sy: (2.75 + this.rng() * 0.55) * scale,
      });
    }
  }

  public addBareDeciduousTree(
    batcher: StaticGeometryBatcher,
    x: number,
    z: number,
    scale = 1.0,
  ) {
    const gy = groundHeightAt(x, z);
    const h = (4.1 + this.rng() * 2.2) * scale;
    const dx = (this.rng() - 0.5) * 1.05 * scale;
    const dz = (this.rng() - 0.5) * 1.05 * scale;
    const bendX = (this.rng() - 0.5) * 0.45 * scale;
    const bendZ = (this.rng() - 0.5) * 0.45 * scale;

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, gy - 0.2, z),
      new THREE.Vector3(x + dx * 0.42 + bendX, gy + h * 0.48, z + dz * 0.42 + bendZ),
      new THREE.Vector3(x + dx, gy + h, z + dz),
    ]);
    const trunk = createGnarledTrunkGeo(curve, 8, 7, (t, theta) => {
      const taper = THREE.MathUtils.lerp(0.21, 0.065, t);
      const flare = Math.pow(1 - t, 3.2) * 0.08;
      const flute = Math.sin(theta * 3 + t * 3.0) * 0.015 * (1 - t);
      return (taper + flare + flute) * scale;
    });
    batcher.add('barkTrunk', trunk);
    trunk.dispose();

    // 四至五根苍劲分叉大枝 + 蟹爪寒林枯枝冠
    const forks = 5;
    for (let f = 0; f < forks; f++) {
      const ang = (f / forks) * Math.PI * 2 + this.rng() * 0.55;
      const startFrac = 0.55 + (f / forks) * 0.38;
      const pt = curve.getPointAt(Math.min(0.98, startFrac));
      const bLen = (1.5 + this.rng() * 1.05) * scale;
      const tilt = 0.44 + this.rng() * 0.36;

      _euler.set(tilt, ang, 0, 'YXZ');
      _quat.setFromEuler(_euler);
      const tipX = pt.x + Math.sin(ang) * Math.sin(tilt) * bLen;
      const tipY = pt.y + Math.cos(tilt) * bLen;
      const tipZ = pt.z + Math.cos(ang) * Math.sin(tilt) * bLen;
      _pos.set((pt.x + tipX) * 0.5, (pt.y + tipY) * 0.5, (pt.z + tipZ) * 0.5);
      _m.compose(_pos, _quat, _scale.set(1, 1, 1));
      batcher.addCylinder('barkTrunk', 0.022 * scale, 0.068 * scale, bLen, 5, _m);

      // 交叉双面寒林枯枝片
      for (const cross of [0, Math.PI * 0.5]) {
        this.dryTwigCards.push({
          x: tipX,
          y: tipY + 0.48 * scale,
          z: tipZ,
          rx: (this.rng() - 0.5) * 0.24,
          ry: ang + cross,
          rz: (this.rng() - 0.5) * 0.15,
          sx: 2.35 * scale,
          sy: 2.35 * scale,
        });
      }
    }
  }

  public buildCanopyMeshes(parent: THREE.Object3D, matLib: MaterialLibrary) {
    // 柳丝扇面枢轴设在根部（上移 0.34），使每片柳枝精准从柳头树瘤向外生发
    const willowPlane = new THREE.PlaneGeometry(1, 1, 1, 3);
    willowPlane.translate(0, 0.34, 0);

    const twigPlane = new THREE.PlaneGeometry(1, 1, 1, 2);

    if (this.willowCards.length > 0) {
      const imW = new THREE.InstancedMesh(willowPlane, matLib.materials.willowFoliage, this.willowCards.length);
      for (let i = 0; i < this.willowCards.length; i++) {
        const c = this.willowCards[i];
        _pos.set(c.x, c.y, c.z);
        _euler.set(c.rx, c.ry, c.rz, 'YXZ');
        _quat.setFromEuler(_euler);
        _scale.set(c.sx, c.sy, 1);
        _m2.compose(_pos, _quat, _scale);
        imW.setMatrixAt(i, _m2);
      }
      imW.instanceMatrix.needsUpdate = true;
      imW.computeBoundingSphere();
      parent.add(imW);
    }

    if (this.dryTwigCards.length > 0) {
      const imD = new THREE.InstancedMesh(twigPlane, matLib.materials.dryTwigMat, this.dryTwigCards.length);
      for (let i = 0; i < this.dryTwigCards.length; i++) {
        const c = this.dryTwigCards[i];
        _pos.set(c.x, c.y, c.z);
        _euler.set(c.rx, c.ry, c.rz, 'YXZ');
        _quat.setFromEuler(_euler);
        _scale.set(c.sx, c.sy, 1);
        _m2.compose(_pos, _quat, _scale);
        imD.setMatrixAt(i, _m2);
      }
      imD.instanceMatrix.needsUpdate = true;
      imD.computeBoundingSphere();
      parent.add(imD);
    }
  }
}
