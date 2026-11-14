import * as THREE from 'three';
import {
  createRng,
  MaterialLibrary,
  mergePartGeometries,
  SILK_PALETTE,
  StaticGeometryBatcher,
} from './01-primitives';
import { groundHeightAt, walkableHeightAt } from './02-world';

/**
 * 模块三：人物、牲口、车轿、摊伞、炊烟与飞鸟（03-actors.ts）
 * - 几百名人物采用分部件骨骼实例化（InstancedMesh），近看具备清晰衣领、腰带、衣袖与手、鞋履、五官、
 *   幞头/发髻/斗笠，以及扁担担子、背篓、包袱、粮袋、船篙、茶碗，且人人皆有符合身份的实时动作。
 * - 驴、马、牛、双峰骆驼、猪、狗具备鬃、角、驼峰、蹄、鞍垫与驮包，四肢交替迈步。
 * - 牛车（席篷大车）、独轮车（中间大轮）配备轮辋与十二根辐条并随行进真实转动；轿子带格子窗与轿顶由前后轿夫抬行。
 */

// 复用零 GC 临时矩阵与向量
const _mRoot = new THREE.Matrix4();
const _mPart = new THREE.Matrix4();
const _mLocal = new THREE.Matrix4();
const _pos = new THREE.Vector3();
const _pos2 = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _euler = new THREE.Euler();
const _scale = new THREE.Vector3(1, 1, 1);
const _col = new THREE.Color();

export type HeadgearType = 'futou' | 'topknot' | 'conical' | 'none';
export type CarryPropType = 'none' | 'poleBaskets' | 'backBasket' | 'bundle' | 'grainSack' | 'puntPole' | 'teaCup';
export type HumanRole =
  | 'walker'
  | 'sleeved'
  | 'porter_pole'
  | 'porter_sack'
  | 'tracker'
  | 'sedan_bearer'
  | 'boat_poler'
  | 'boat_sculler'
  | 'rider'
  | 'carter'
  | 'seated_tea'
  | 'bridge_onlooker'
  | 'vendor';

export interface WaypointPath {
  points: Array<[number, number]>;
  closed?: boolean;
  pingPong?: boolean;
  totalLen?: number;
  segLens?: number[];
}

function preparePath(path: WaypointPath): Required<Pick<WaypointPath, 'points' | 'segLens' | 'totalLen'>> & WaypointPath {
  const segLens: number[] = [];
  let totalLen = 0;
  const pts = path.points;
  const count = path.closed ? pts.length : pts.length - 1;
  for (let i = 0; i < count; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    segLens.push(Math.max(l, 0.001));
    totalLen += Math.max(l, 0.001);
  }
  path.segLens = segLens;
  path.totalLen = Math.max(totalLen, 0.01);
  return path as Required<Pick<WaypointPath, 'points' | 'segLens' | 'totalLen'>> & WaypointPath;
}

function sampleWaypointPath(
  path: WaypointPath,
  dist: number,
  out: { x: number; z: number; yaw: number },
) {
  const total = path.totalLen || 1;
  const segs = path.segLens || [1];
  const pts = path.points;
  let d = dist;
  let reverse = false;

  if (path.closed) {
    d = ((d % total) + total) % total;
  } else if (path.pingPong !== false) {
    const period = total * 2;
    const m = ((d % period) + period) % period;
    if (m > total) {
      d = period - m;
      reverse = true;
    } else {
      d = m;
    }
  } else {
    d = ((d % total) + total) % total;
  }

  let acc = 0;
  for (let i = 0; i < segs.length; i++) {
    const sl = segs[i];
    if (d <= acc + sl || i === segs.length - 1) {
      const t = THREE.MathUtils.clamp((d - acc) / sl, 0, 1);
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      out.x = a[0] + (b[0] - a[0]) * t;
      out.z = a[1] + (b[1] - a[1]) * t;
      const dx = reverse ? a[0] - b[0] : b[0] - a[0];
      const dz = reverse ? a[1] - b[1] : b[1] - a[1];
      out.yaw = Math.atan2(dx, dz); // +Z 为角色正前方
      return;
    }
    acc += sl;
  }
}

export interface HumanActorSpec {
  role: HumanRole;
  x?: number;
  y?: number;
  z?: number;
  yaw?: number;
  path?: WaypointPath;
  speed?: number;
  phase?: number;
  headgear?: HeadgearType;
  prop?: CarryPropType;
  garmentColor?: number;
  scale?: number;
  // 若附着在船、坐骑或轿杆上，由外部动态提供世界坐标
  externalAnchor?: {
    x: number;
    y: number;
    z: number;
    yaw: number;
    pitch?: number;
    roll?: number;
  };
}

interface InternalHuman {
  role: HumanRole;
  x: number;
  y: number;
  z: number;
  yaw: number;
  useCustomY: boolean;
  path?: WaypointPath;
  dist: number;
  speed: number;
  phase: number;
  scale: number;
  headgear: HeadgearType;
  headgearIndex: number;
  prop: CarryPropType;
  propIndex: number;
  garmentColor: number;
  externalAnchor?: HumanActorSpec['externalAnchor'];
}

export type AnimalSpecies = 'donkey' | 'horse' | 'ox' | 'camel' | 'pig' | 'dog';

export interface AnimalSpec {
  species: AnimalSpecies;
  path?: WaypointPath;
  x?: number;
  z?: number;
  yaw?: number;
  speed?: number;
  phase?: number;
  hasPack?: boolean;
  hasSaddle?: boolean;
  hasRider?: boolean;
  riderHeadgear?: HeadgearType;
  riderColor?: number;
}

interface InternalAnimal {
  species: AnimalSpecies;
  group: THREE.Group;
  legs: [THREE.Object3D, THREE.Object3D, THREE.Object3D, THREE.Object3D];
  headPivot: THREE.Object3D;
  tailPivot?: THREE.Object3D;
  path?: WaypointPath;
  dist: number;
  x: number;
  z: number;
  yaw: number;
  speed: number;
  phase: number;
  riderAnchor?: NonNullable<HumanActorSpec['externalAnchor']>;
  saddleHeight: number;
}

export interface WheeledVehicleSpec {
  type: 'oxCart' | 'wheelbarrow' | 'flatCart';
  path?: WaypointPath;
  x?: number;
  z?: number;
  yaw?: number;
  speed?: number;
  phase?: number;
}

interface InternalVehicle {
  type: WheeledVehicleSpec['type'];
  group: THREE.Group;
  wheels: THREE.Object3D[];
  wheelRadius: number;
  path?: WaypointPath;
  dist: number;
  x: number;
  z: number;
  yaw: number;
  speed: number;
  carterAnchor?: NonNullable<HumanActorSpec['externalAnchor']>;
  oxRef?: InternalAnimal;
}

export interface SedanChairSpec {
  path?: WaypointPath;
  x?: number;
  z?: number;
  yaw?: number;
  speed?: number;
  phase?: number;
  withWillowTwigs?: boolean; // 郊野春色踏青插柳轿子
}

interface InternalSedan {
  group: THREE.Group;
  path?: WaypointPath;
  dist: number;
  x: number;
  z: number;
  yaw: number;
  speed: number;
  phase: number;
  frontBearer: NonNullable<HumanActorSpec['externalAnchor']>;
  rearBearer: NonNullable<HumanActorSpec['externalAnchor']>;
}

/**
 * 创建带辐条与轮辋的宋代木车轮几何体（中心位于原点，绕 X 轴旋转滚动，轴线沿 X）
 */
export function createSpokedWheelGeometry(radius: number, spokeCount = 12, rimThickness = 0.055): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  // 外圈轮辋（绕 Y-Z 平面，旋转使轴线朝 X）
  const rim = new THREE.TorusGeometry(radius, rimThickness, 8, 24);
  rim.rotateY(Math.PI / 2);
  parts.push(rim);

  // 车毂（中心轴套）
  const hub = new THREE.CylinderGeometry(radius * 0.17, radius * 0.17, rimThickness * 3.4, 10);
  hub.rotateZ(Math.PI / 2);
  parts.push(hub);

  // 放射辐条
  for (let i = 0; i < spokeCount; i++) {
    const ang = (i / spokeCount) * Math.PI * 2;
    const spoke = new THREE.CylinderGeometry(0.016, 0.02, radius * 1.88, 6);
    spoke.rotateX(ang);
    parts.push(spoke);
  }

  return mergePartGeometries(parts);
}

/**
 * 构建人物细部几何体集合（确保衣领、腰带、袖手、鞋、五官、冠帽、随身担篓近看分明）
 */
function buildHumanPartGeometries() {
  // 1. 躯干袍服（上窄下宽交领宋衫轮廓，原点在地面脚底基准 y=0 对应全身时，躯干位于 y=0.58..1.30）
  const torsoPts = [
    new THREE.Vector2(0.01, 0.56),
    new THREE.Vector2(0.21, 0.58),
    new THREE.Vector2(0.18, 0.84),
    new THREE.Vector2(0.145, 0.96), // 束腰处收窄
    new THREE.Vector2(0.185, 1.24),
    new THREE.Vector2(0.11, 1.32),
    new THREE.Vector2(0.01, 1.33),
  ];
  const torsoLathe = new THREE.LatheGeometry(torsoPts, 12);
  torsoLathe.scale(1.05, 1.0, 0.72); // 前后略扁符合人体胸厚

  // 2. 交领白色内领 + 束腰带（独立浅麻/深褐对比构件）
  const collarLeft = new THREE.BoxGeometry(0.055, 0.22, 0.04);
  collarLeft.rotateZ(-0.38);
  collarLeft.translate(-0.035, 1.23, 0.115);

  const collarRight = new THREE.BoxGeometry(0.055, 0.22, 0.04);
  collarRight.rotateZ(0.38);
  collarRight.translate(0.035, 1.23, 0.122);

  const beltRing = new THREE.CylinderGeometry(0.158, 0.162, 0.068, 12);
  beltRing.scale(1.06, 1.0, 0.75);
  beltRing.translate(0, 0.96, 0);

  const beltKnot = new THREE.BoxGeometry(0.065, 0.16, 0.045);
  beltKnot.translate(0.0, 0.89, 0.125);
  const collarBeltGeo = mergePartGeometries([collarLeft, collarRight, beltRing, beltKnot]);

  // 3. 头部 + 立体鼻梁 + 双耳（UV 校准使正前方 +Z 恰对准贴图 u=0.5 五官中心）
  const headSphere = new THREE.SphereGeometry(0.125, 16, 14);
  headSphere.scale(0.92, 1.08, 0.96);
  // Three.js SphereGeometry 默认 +Z 对应 u = 0.75，旋转 -PI/2 后 +Z 对应 u = 0.5！
  headSphere.rotateY(-Math.PI / 2);

  const nose = new THREE.ConeGeometry(0.022, 0.052, 6);
  nose.rotateX(Math.PI * 0.48);
  nose.translate(0, -0.005, 0.125);
  // 鼻子的 UV 设为皮肤纯色区 (0.1, 0.2)
  const noseUv = nose.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < noseUv.count; i++) noseUv.setXY(i, 0.12, 0.2);

  const earL = new THREE.BoxGeometry(0.024, 0.055, 0.032);
  earL.translate(-0.115, 0.0, 0.0);
  const earLUv = earL.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < earLUv.count; i++) earLUv.setXY(i, 0.12, 0.2);

  const earR = earL.clone();
  earR.translate(0.23, 0, 0);

  const neck = new THREE.CylinderGeometry(0.058, 0.068, 0.1, 8);
  neck.translate(0, -0.13, 0);
  const neckUv = neck.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < neckUv.count; i++) neckUv.setXY(i, 0.12, 0.2);

  const headGeo = mergePartGeometries([headSphere, nose, earL, earR, neck]);

  // 4. 冠帽一：北宋展脚幞头（乌纱帽身 + 后部高冠 + 左右长展脚）
  const futouCap = new THREE.BoxGeometry(0.22, 0.11, 0.22);
  futouCap.translate(0, 0.08, -0.01);
  const futouBack = new THREE.BoxGeometry(0.18, 0.13, 0.11);
  futouBack.translate(0, 0.12, -0.05);
  const wingBar = new THREE.BoxGeometry(0.56, 0.024, 0.036);
  wingBar.translate(0, 0.105, -0.08);
  const futouGeo = mergePartGeometries([futouCap, futouBack, wingBar]);

  // 5. 冠帽二：束发髻与发簪（劳作者、妇人、船夫）
  const hairBase = new THREE.SphereGeometry(0.126, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.58);
  hairBase.scale(0.94, 1.05, 0.98);
  hairBase.translate(0, 0.015, -0.008);
  const bun = new THREE.SphereGeometry(0.062, 10, 8);
  bun.translate(0, 0.155, -0.03);
  const pin = new THREE.CylinderGeometry(0.008, 0.008, 0.19, 6);
  pin.rotateZ(Math.PI / 2);
  pin.translate(0, 0.155, -0.03);
  const topknotGeo = mergePartGeometries([hairBase, bun, pin]);

  // 6. 冠帽三：竹编斗笠（行旅、挑夫、驼夫、渔船工）
  const douliPts = [
    new THREE.Vector2(0.005, 0.21),
    new THREE.Vector2(0.12, 0.16),
    new THREE.Vector2(0.29, 0.065),
    new THREE.Vector2(0.30, 0.052),
    new THREE.Vector2(0.11, 0.145),
    new THREE.Vector2(0.005, 0.19),
  ];
  const conicalGeo = new THREE.LatheGeometry(douliPts, 16);

  // 7. 手臂（枢轴在肩关节 (0,0,0)：上臂 + 微曲前臂 + 宽袖口 + 手掌）
  const upperArm = new THREE.CylinderGeometry(0.048, 0.058, 0.25, 8);
  upperArm.translate(0, -0.12, 0);
  const foreArm = new THREE.CylinderGeometry(0.068, 0.052, 0.24, 8);
  foreArm.rotateX(-0.32);
  foreArm.translate(0, -0.31, 0.045);
  const sleeveCuff = new THREE.CylinderGeometry(0.072, 0.078, 0.07, 8);
  sleeveCuff.rotateX(-0.32);
  sleeveCuff.translate(0, -0.39, 0.075);
  const armGeo = mergePartGeometries([upperArm, foreArm, sleeveCuff]);

  // 独立手部（暖肤色，在袖口前端）
  const handGeo = new THREE.SphereGeometry(0.038, 8, 6);
  handGeo.scale(0.85, 1.15, 0.95);
  handGeo.translate(0, -0.45, 0.095);

  // 8. 腿部 + 宋式翘头布鞋（枢轴在髋关节 (0,0,0)，腿长 0.58m 落至地面）
  const legShaft = new THREE.CylinderGeometry(0.068, 0.048, 0.49, 8);
  legShaft.translate(0, -0.255, 0);
  const shoeBody = new THREE.BoxGeometry(0.092, 0.075, 0.195);
  shoeBody.translate(0, -0.54, 0.035);
  const shoeToe = new THREE.ConeGeometry(0.045, 0.06, 6);
  shoeToe.rotateX(Math.PI * 0.36);
  shoeToe.translate(0, -0.525, 0.135);
  const legShoeGeo = mergePartGeometries([legShaft, shoeBody, shoeToe]);

  // 9. 随身道具一：弹性弯曲竹扁担 + 前后双绳吊竹筐（枢轴在右肩上方）
  const polePts = [
    new THREE.Vector3(0, 0.02, -0.78),
    new THREE.Vector3(0, 0.06, 0.0),
    new THREE.Vector3(0, 0.02, 0.78),
  ];
  const poleTube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(polePts), 12, 0.022, 6, false);
  const basketF = new THREE.CylinderGeometry(0.21, 0.15, 0.24, 10);
  basketF.translate(0, -0.46, 0.74);
  const basketB = new THREE.CylinderGeometry(0.21, 0.15, 0.24, 10);
  basketB.translate(0, -0.46, -0.74);
  // 吊绳
  const ropeParts: THREE.BufferGeometry[] = [poleTube, basketF, basketB];
  for (const bz of [-0.74, 0.74]) {
    for (const rx of [-0.12, 0.12]) {
      const rp = new THREE.CylinderGeometry(0.007, 0.007, 0.42, 4);
      rp.rotateZ(rx > 0 ? 0.26 : -0.26);
      rp.translate(rx * 0.5, -0.2, bz);
      ropeParts.push(rp);
    }
  }
  const poleBasketsGeo = mergePartGeometries(ropeParts);

  // 10. 随身道具二：竹编背篓
  const backBasketBody = new THREE.CylinderGeometry(0.17, 0.12, 0.38, 10);
  backBasketBody.translate(0, 1.08, -0.21);
  const backGoods = new THREE.SphereGeometry(0.14, 8, 6);
  backGoods.scale(1, 0.65, 1);
  backGoods.translate(0, 1.27, -0.21);
  const backBasketGeo = mergePartGeometries([backBasketBody, backGoods]);

  // 11. 随身道具三：斜挎布包袱
  const bundleBag = new THREE.SphereGeometry(0.15, 10, 8);
  bundleBag.scale(1.1, 0.85, 0.88);
  bundleBag.translate(-0.14, 1.05, -0.14);
  const bundleSling = new THREE.TorusGeometry(0.21, 0.028, 6, 14);
  bundleSling.rotateY(0.65);
  bundleSling.rotateX(0.55);
  bundleSling.translate(0.0, 1.12, 0.0);
  const bundleGeo = mergePartGeometries([bundleBag, bundleSling]);

  // 12. 随身道具四：码头扛粮大麻袋（横搭肩背）
  const grainSackGeo = new THREE.CapsuleGeometry(0.15, 0.36, 6, 10);
  grainSackGeo.rotateX(Math.PI * 0.44);
  grainSackGeo.translate(0.06, 1.34, -0.06);

  // 13. 随身道具五：长竹船篙（供船工撑船）
  const puntPoleGeo = new THREE.CylinderGeometry(0.018, 0.022, 3.8, 6);
  puntPoleGeo.rotateX(0.95);
  puntPoleGeo.translate(0.14, 0.75, 1.15);

  // 14. 随身道具六：茶酒碗（店中坐客手持）
  const teaCupGeo = new THREE.CylinderGeometry(0.055, 0.032, 0.055, 8);

  return {
    torsoLathe,
    collarBeltGeo,
    headGeo,
    futouGeo,
    topknotGeo,
    conicalGeo,
    armGeo,
    handGeo,
    legShoeGeo,
    poleBasketsGeo,
    backBasketGeo,
    bundleGeo,
    grainSackGeo,
    puntPoleGeo,
    teaCupGeo,
  };
}

/**
 * 构建单只牲口精细多部件模型（含鬃、角、双驼峰、四蹄、鞍垫与驮包）
 */
function createAnimalGroup(
  species: AnimalSpecies,
  matLib: MaterialLibrary,
  hasPack: boolean,
  hasSaddle: boolean,
  rng: () => number,
): {
  group: THREE.Group;
  legs: [THREE.Object3D, THREE.Object3D, THREE.Object3D, THREE.Object3D];
  headPivot: THREE.Object3D;
  tailPivot: THREE.Object3D;
  saddleHeight: number;
} {
  const group = new THREE.Group();

  const coatPalette: Record<AnimalSpecies, number[]> = {
    donkey: [0x6e655b, 0x7b7166, 0x5f574e],
    horse: [0x744d36, 0x5c3e2b, 0xa8967a, 0x8b6244],
    ox: [0x68523d, 0x7d654b, 0x524234],
    camel: [0xa6855b, 0x97774e, 0xb29268],
    pig: [0x8b7362, 0x66564b],
    dog: [0x9d7f58, 0x5c4a38, 0xb69c77],
  };
  const choices = coatPalette[species];
  const coatHex = choices[Math.floor(rng() * choices.length)];

  const coatMat = new THREE.MeshStandardMaterial({
    color: coatHex,
    roughness: 0.86,
    metalness: 0.0,
  });
  const darkHairMat = new THREE.MeshStandardMaterial({
    color: 0x332920,
    roughness: 0.9,
    metalness: 0.0,
  });
  const hoofMat = new THREE.MeshStandardMaterial({
    color: 0x26201b,
    roughness: 0.55,
    metalness: 0.08,
  });
  const hornMat = new THREE.MeshStandardMaterial({
    color: 0xcab998,
    roughness: 0.45,
    metalness: 0.05,
  });

  // 物种体型参数
  const cfg = {
    donkey: { bodyL: 1.18, bodyR: 0.28, legH: 0.66, neckL: 0.42, headL: 0.34, earL: 0.24 },
    horse: { bodyL: 1.56, bodyR: 0.35, legH: 0.88, neckL: 0.58, headL: 0.42, earL: 0.11 },
    ox: { bodyL: 1.68, bodyR: 0.43, legH: 0.76, neckL: 0.40, headL: 0.40, earL: 0.12 },
    camel: { bodyL: 1.82, bodyR: 0.42, legH: 1.18, neckL: 0.82, headL: 0.42, earL: 0.08 },
    pig: { bodyL: 0.82, bodyR: 0.24, legH: 0.30, neckL: 0.16, headL: 0.24, earL: 0.10 },
    dog: { bodyL: 0.66, bodyR: 0.14, legH: 0.34, neckL: 0.20, headL: 0.20, earL: 0.08 },
  }[species];

  const bodyY = cfg.legH + cfg.bodyR * 0.78;

  // 躯干（带胸腹弧度）
  const barrel = new THREE.Mesh(
    new THREE.CapsuleGeometry(cfg.bodyR, cfg.bodyL - cfg.bodyR * 1.3, 6, 12),
    coatMat,
  );
  barrel.rotation.x = Math.PI / 2;
  barrel.scale.set(0.88, 1.0, 1.06);
  barrel.position.set(0, bodyY, 0);
  barrel.castShadow = true;
  group.add(barrel);

  // 牛肩峰或双峰骆驼驼峰
  if (species === 'camel') {
    for (const hz of [0.34, -0.34]) {
      const hump = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.42, 10), coatMat);
      hump.position.set(0, bodyY + cfg.bodyR + 0.12, hz);
      hump.scale.set(0.85, 1, 1.1);
      hump.castShadow = true;
      group.add(hump);
    }
  } else if (species === 'ox') {
    const withers = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 8), coatMat);
    withers.position.set(0, bodyY + cfg.bodyR * 0.75, cfg.bodyL * 0.28);
    group.add(withers);
  }

  // 颈与头部枢轴
  const headPivot = new THREE.Group();
  headPivot.position.set(0, bodyY + cfg.bodyR * 0.35, cfg.bodyL * 0.42);
  group.add(headPivot);

  if (species === 'camel') {
    // 骆驼特征性 S 形长弯颈
    const neckCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -0.18, 0.32),
      new THREE.Vector3(0, 0.38, 0.56),
      new THREE.Vector3(0, 0.68, 0.62),
    ]);
    const neckMesh = new THREE.Mesh(new THREE.TubeGeometry(neckCurve, 10, 0.14, 8, false), coatMat);
    neckMesh.castShadow = true;
    headPivot.add(neckMesh);

    const headBox = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.20, 0.38), coatMat);
    headBox.position.set(0, 0.74, 0.76);
    headBox.rotation.x = 0.18;
    headPivot.add(headBox);

    // 颈下长毛簇
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.28, 6), darkHairMat);
    tuft.rotation.x = Math.PI;
    tuft.position.set(0, -0.05, 0.42);
    headPivot.add(tuft);
  } else {
    const neckAngle = species === 'pig' ? 1.25 : species === 'ox' ? 1.05 : 0.68;
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(cfg.bodyR * 0.42, cfg.bodyR * 0.58, cfg.neckL, 8),
      coatMat,
    );
    neck.rotation.x = neckAngle;
    neck.position.set(0, Math.cos(neckAngle) * cfg.neckL * 0.5, Math.sin(neckAngle) * cfg.neckL * 0.5);
    neck.castShadow = true;
    headPivot.add(neck);

    const hx = 0;
    const hy = Math.cos(neckAngle) * cfg.neckL;
    const hz = Math.sin(neckAngle) * cfg.neckL + cfg.headL * 0.32;

    const headMesh = new THREE.Mesh(
      new THREE.BoxGeometry(cfg.bodyR * 0.58, cfg.bodyR * 0.62, cfg.headL),
      coatMat,
    );
    headMesh.position.set(hx, hy, hz);
    headMesh.rotation.x = species === 'pig' ? 0.15 : 0.48;
    headPivot.add(headMesh);

    // 深色鼻吻
    const muzzle = new THREE.Mesh(
      new THREE.BoxGeometry(cfg.bodyR * 0.44, cfg.bodyR * 0.44, cfg.headL * 0.36),
      species === 'pig' ? coatMat : darkHairMat,
    );
    muzzle.position.set(hx, hy - cfg.headL * 0.15, hz + cfg.headL * 0.42);
    headPivot.add(muzzle);

    // 鬃毛（马、驴）
    if (species === 'horse' || species === 'donkey') {
      const mane = new THREE.Mesh(
        new THREE.BoxGeometry(0.045, cfg.neckL * 0.92, 0.11),
        darkHairMat,
      );
      mane.rotation.x = neckAngle;
      mane.position.set(
        0,
        Math.cos(neckAngle) * cfg.neckL * 0.52 + 0.08,
        Math.sin(neckAngle) * cfg.neckL * 0.52 - 0.07,
      );
      headPivot.add(mane);
    }

    // 双耳（驴为醒目长耳）
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(
        new THREE.ConeGeometry(cfg.earL * 0.24, cfg.earL, 6),
        coatMat,
      );
      ear.position.set(side * cfg.bodyR * 0.24, hy + cfg.bodyR * 0.36, hz - cfg.headL * 0.18);
      ear.rotation.z = -side * (species === 'pig' ? 0.85 : 0.25);
      headPivot.add(ear);
    }

    // 牛的双弯角
    if (species === 'ox') {
      for (const side of [-1, 1]) {
        const hornCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(side * 0.11, hy + 0.12, hz - 0.06),
          new THREE.Vector3(side * 0.28, hy + 0.20, hz + 0.02),
          new THREE.Vector3(side * 0.24, hy + 0.32, hz + 0.12),
        ]);
        const horn = new THREE.Mesh(new THREE.TubeGeometry(hornCurve, 8, 0.032, 6, false), hornMat);
        headPivot.add(horn);
      }
    }
  }

  // 尾巴枢轴
  const tailPivot = new THREE.Group();
  tailPivot.position.set(0, bodyY + cfg.bodyR * 0.3, -cfg.bodyL * 0.48);
  const tailLen = species === 'pig' ? 0.16 : species === 'dog' ? 0.26 : 0.46;
  const tailMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.032, tailLen, 6),
    species === 'horse' || species === 'donkey' ? darkHairMat : coatMat,
  );
  tailMesh.position.set(0, -tailLen * 0.45, -0.06);
  tailMesh.rotation.x = species === 'dog' ? -2.2 : 0.28;
  tailPivot.add(tailMesh);
  group.add(tailPivot);

  // 鞍垫与驮包
  if (hasSaddle) {
    const pad = new THREE.Mesh(
      new THREE.BoxGeometry(cfg.bodyR * 1.92, 0.14, cfg.bodyL * 0.42),
      matLib.materials.ribbonRed as THREE.MeshStandardMaterial,
    );
    pad.position.set(0, bodyY + cfg.bodyR * 0.86, 0.04);
    group.add(pad);
  }
  if (hasPack) {
    for (const side of [-1, 1]) {
      const pack = new THREE.Mesh(
        new THREE.CapsuleGeometry(cfg.bodyR * 0.56, cfg.bodyL * 0.34, 5, 8),
        matLib.materials.wovenMat as THREE.MeshStandardMaterial,
      );
      pack.rotation.x = Math.PI / 2;
      pack.position.set(side * (cfg.bodyR * 0.92), bodyY + cfg.bodyR * 0.35, 0);
      pack.castShadow = true;
      group.add(pack);
    }
    // 捆绳横梁
    const strap = new THREE.Mesh(
      new THREE.BoxGeometry(cfg.bodyR * 2.1, 0.06, 0.14),
      matLib.materials.woodDark as THREE.MeshStandardMaterial,
    );
    strap.position.set(0, bodyY + cfg.bodyR * 0.95, 0);
    group.add(strap);
  }

  // 四条独立关节腿 + 分明深色蹄子（顺序：左前、右前、左后、右后）
  const legPositions: [
    [number, number],
    [number, number],
    [number, number],
    [number, number],
  ] = [
    [-cfg.bodyR * 0.52, cfg.bodyL * 0.30],
    [cfg.bodyR * 0.52, cfg.bodyL * 0.30],
    [-cfg.bodyR * 0.52, -cfg.bodyL * 0.32],
    [cfg.bodyR * 0.52, -cfg.bodyL * 0.32],
  ];
  const legs = legPositions.map(([lx, lz]) => {
    const pivot = new THREE.Group();
    pivot.position.set(lx, cfg.legH, lz);

    const upper = new THREE.Mesh(
      new THREE.CylinderGeometry(cfg.bodyR * 0.24, cfg.bodyR * 0.17, cfg.legH * 0.86, 7),
      coatMat,
    );
    upper.position.y = -cfg.legH * 0.43;
    upper.castShadow = true;
    pivot.add(upper);

    const hoofH = Math.max(0.06, cfg.legH * 0.14);
    const hoof = new THREE.Mesh(
      new THREE.CylinderGeometry(cfg.bodyR * 0.17, cfg.bodyR * 0.21, hoofH, 7),
      hoofMat,
    );
    hoof.position.y = -cfg.legH + hoofH * 0.5;
    pivot.add(hoof);

    group.add(pivot);
    return pivot as THREE.Object3D;
  }) as unknown as [THREE.Object3D, THREE.Object3D, THREE.Object3D, THREE.Object3D];

  return {
    group,
    legs,
    headPivot,
    tailPivot,
    saddleHeight: bodyY + cfg.bodyR * 0.72,
  };
}

/**
 * 动态众生总控引擎：统一管理全卷人物、牲口、车轿、飞鸟与炊烟
 */
export class CrowdAndLifeSystem {
  private humans: InternalHuman[] = [];
  private animals: InternalAnimal[] = [];
  private vehicles: InternalVehicle[] = [];
  private sedans: InternalSedan[] = [];
  private matLib: MaterialLibrary;
  private parent: THREE.Object3D;
  private rng = createRng(10851120);

  // 人物部件 InstancedMesh 引用
  private imTorso!: THREE.InstancedMesh;
  private imCollarBelt!: THREE.InstancedMesh;
  private imHead!: THREE.InstancedMesh;
  private imArmL!: THREE.InstancedMesh;
  private imArmR!: THREE.InstancedMesh;
  private imHandL!: THREE.InstancedMesh;
  private imHandR!: THREE.InstancedMesh;
  private imLegL!: THREE.InstancedMesh;
  private imLegR!: THREE.InstancedMesh;

  private imFutou!: THREE.InstancedMesh;
  private imTopknot!: THREE.InstancedMesh;
  private imConical!: THREE.InstancedMesh;

  private imPoleBaskets!: THREE.InstancedMesh;
  private imBackBasket!: THREE.InstancedMesh;
  private imBundle!: THREE.InstancedMesh;
  private imGrainSack!: THREE.InstancedMesh;
  private imPuntPole!: THREE.InstancedMesh;
  private imTeaCup!: THREE.InstancedMesh;

  // 飞鸟与炊烟
  private imBirds?: THREE.InstancedMesh;
  private birdCenters: Array<{ cx: number; cz: number; y: number; r: number; speed: number; phase: number }> = [];
  private imSmoke?: THREE.InstancedMesh;
  private smokePuffs: Array<{ x: number; y0: number; z: number; phase: number; scale: number }> = [];

  private wheelSharedLarge: THREE.BufferGeometry;
  private wheelSharedMedium: THREE.BufferGeometry;

  constructor(parent: THREE.Object3D, matLib: MaterialLibrary) {
    this.parent = parent;
    this.matLib = matLib;
    this.wheelSharedLarge = createSpokedWheelGeometry(0.58, 12, 0.05);
    this.wheelSharedMedium = createSpokedWheelGeometry(0.42, 10, 0.042);
  }

  public addHuman(spec: HumanActorSpec): InternalHuman {
    const headgear =
      spec.headgear ||
      (spec.role === 'porter_pole' || spec.role === 'tracker' || spec.role === 'boat_poler'
        ? this.rng() > 0.45
          ? 'conical'
          : 'topknot'
        : this.rng() > 0.35
          ? 'futou'
          : 'topknot');

    const prop =
      spec.prop ||
      (spec.role === 'porter_pole'
        ? 'poleBaskets'
        : spec.role === 'porter_sack'
          ? 'grainSack'
          : spec.role === 'boat_poler'
            ? 'puntPole'
            : spec.role === 'seated_tea'
              ? 'teaCup'
              : spec.role === 'walker' && this.rng() < 0.18
                ? this.rng() > 0.5
                  ? 'bundle'
                  : 'backBasket'
                : 'none');

    const path = spec.path ? preparePath(spec.path) : undefined;
    const garmentColor =
      spec.garmentColor ??
      SILK_PALETTE.garments[Math.floor(this.rng() * SILK_PALETTE.garments.length)];

    const h: InternalHuman = {
      role: spec.role,
      x: spec.x ?? (path ? path.points[0][0] : 0),
      y: spec.y ?? 0,
      z: spec.z ?? (path ? path.points[0][1] : 0),
      yaw: spec.yaw ?? this.rng() * Math.PI * 2,
      useCustomY: spec.y !== undefined,
      path,
      dist: (spec.phase ?? this.rng()) * (path?.totalLen ?? 10),
      speed: spec.speed ?? (path ? 0.85 + this.rng() * 0.45 : 0),
      phase: (spec.phase ?? this.rng()) * Math.PI * 2,
      scale: spec.scale ?? 0.94 + this.rng() * 0.11,
      headgear,
      headgearIndex: -1,
      prop,
      propIndex: -1,
      garmentColor,
      externalAnchor: spec.externalAnchor,
    };
    this.humans.push(h);
    return h;
  }

  public addAnimal(spec: AnimalSpec): InternalAnimal {
    const path = spec.path ? preparePath(spec.path) : undefined;
    const built = createAnimalGroup(
      spec.species,
      this.matLib,
      Boolean(spec.hasPack),
      Boolean(spec.hasSaddle || spec.hasRider),
      this.rng,
    );
    this.parent.add(built.group);

    const a: InternalAnimal = {
      species: spec.species,
      group: built.group,
      legs: built.legs,
      headPivot: built.headPivot,
      tailPivot: built.tailPivot,
      path,
      dist: (spec.phase ?? this.rng()) * (path?.totalLen ?? 12),
      x: spec.x ?? (path ? path.points[0][0] : 0),
      z: spec.z ?? (path ? path.points[0][1] : 0),
      yaw: spec.yaw ?? 0,
      speed: spec.speed ?? (path ? (spec.species === 'horse' ? 1.55 : 0.95) : 0),
      phase: (spec.phase ?? this.rng()) * Math.PI * 2,
      saddleHeight: built.saddleHeight,
    };

    if (spec.hasRider) {
      const anchor = { x: a.x, y: 0, z: a.z, yaw: a.yaw };
      a.riderAnchor = anchor;
      this.addHuman({
        role: 'rider',
        headgear: spec.riderHeadgear ?? 'futou',
        garmentColor: spec.riderColor,
        externalAnchor: anchor,
      });
    }

    this.animals.push(a);
    return a;
  }

  public addVehicle(spec: WheeledVehicleSpec): void {
    const path = spec.path ? preparePath(spec.path) : undefined;
    const group = new THREE.Group();
    const wheels: THREE.Object3D[] = [];
    const woodMat = this.matLib.materials.woodDark as THREE.MeshStandardMaterial;
    const lightWood = this.matLib.materials.woodLight as THREE.MeshStandardMaterial;
    const matCanopy = this.matLib.materials.wovenMat as THREE.MeshStandardMaterial;

    let wheelRadius = 0.58;
    let carterAnchor: NonNullable<HumanActorSpec['externalAnchor']> | undefined;
    let oxRef: InternalAnimal | undefined;

    if (spec.type === 'oxCart') {
      // 宋代席篷大牛车：双大辐条轮 + 车舆底盘 + 拱形芦席车篷 + 双辕木 + 前方拉车黄牛
      wheelRadius = 0.58;
      for (const side of [-1, 1]) {
        const wMesh = new THREE.Mesh(this.wheelSharedLarge, woodMat);
        wMesh.position.set(side * 0.78, wheelRadius, 0);
        wMesh.castShadow = true;
        group.add(wMesh);
        wheels.push(wMesh);
      }
      // 车轴与车厢底板
      const bed = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.14, 2.25), woodMat);
      bed.position.set(0, wheelRadius + 0.08, 0.05);
      bed.castShadow = true;
      group.add(bed);

      // 左右车栏板
      for (const side of [-1, 1]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.46, 2.05), lightWood);
        rail.position.set(side * 0.64, wheelRadius + 0.36, 0.02);
        group.add(rail);
      }

      // 拱形席篷顶（半圆柱壳）
      const hoodGeo = new THREE.CylinderGeometry(0.72, 0.72, 2.15, 14, 1, true, -Math.PI * 0.52, Math.PI * 1.04);
      hoodGeo.rotateZ(Math.PI / 2);
      hoodGeo.rotateY(Math.PI / 2);
      const hood = new THREE.Mesh(hoodGeo, matCanopy);
      hood.position.set(0, wheelRadius + 0.56, 0.02);
      hood.castShadow = true;
      group.add(hood);

      // 前帘与双辕木
      const curtain = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.62, 0.04), matCanopy);
      curtain.position.set(0, wheelRadius + 0.68, 1.06);
      group.add(curtain);

      for (const side of [-1, 1]) {
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.95, 6), woodMat);
        shaft.rotation.x = Math.PI / 2;
        shaft.position.set(side * 0.38, wheelRadius + 0.12, 1.92);
        group.add(shaft);
      }

      if (path) {
        // 前方套辕黄牛与车旁赶车夫
        oxRef = this.addAnimal({
          species: 'ox',
          x: spec.x,
          z: spec.z,
          speed: 0,
        });
        carterAnchor = { x: 0, y: 0, z: 0, yaw: 0 };
        this.addHuman({
          role: 'carter',
          headgear: 'conical',
          externalAnchor: carterAnchor,
        });
      }
    } else if (spec.type === 'wheelbarrow') {
      // 北宋独轮车（串车/江州车）：正中一个大辐条轮 + 两侧载货木架 + 粮袋货包 + 推车夫
      wheelRadius = 0.42;
      const wMesh = new THREE.Mesh(this.wheelSharedMedium, woodMat);
      wMesh.position.set(0, wheelRadius, 0.12);
      wMesh.castShadow = true;
      group.add(wMesh);
      wheels.push(wMesh);

      // 两侧纵梁与把手
      for (const side of [-1, 1]) {
        const beam = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.065, 1.88), woodMat);
        beam.position.set(side * 0.28, wheelRadius + 0.08, -0.12);
        beam.rotation.x = 0.08;
        group.add(beam);

        // 支腿
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.44, 5), woodMat);
        leg.position.set(side * 0.28, 0.24, -0.58);
        group.add(leg);
      }

      // 护轮木框与两侧捆绑麻袋货包
      const archBox = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.32, 0.92), lightWood);
      archBox.position.set(0, wheelRadius + 0.24, 0.12);
      archBox.castShadow = true;
      group.add(archBox);

      for (const side of [-1, 1]) {
        const sack = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.46, 5, 8), matCanopy);
        sack.rotation.x = Math.PI / 2;
        sack.position.set(side * 0.34, wheelRadius + 0.28, 0.12);
        sack.castShadow = true;
        group.add(sack);
      }

      if (path) {
        carterAnchor = { x: 0, y: 0, z: 0, yaw: 0 };
        this.addHuman({
          role: 'carter',
          headgear: this.rng() > 0.5 ? 'topknot' : 'conical',
          externalAnchor: carterAnchor,
        });
      }
    } else {
      // 双轮太平平板货车（修车铺或城外大车）
      wheelRadius = 0.58;
      for (const side of [-1, 1]) {
        const wMesh = new THREE.Mesh(this.wheelSharedLarge, woodMat);
        wMesh.position.set(side * 0.82, wheelRadius, 0);
        wMesh.castShadow = true;
        group.add(wMesh);
        wheels.push(wMesh);
      }
      const deck = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.14, 2.5), woodMat);
      deck.position.set(0, wheelRadius + 0.08, 0);
      deck.castShadow = true;
      group.add(deck);
      for (const side of [-1, 1]) {
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.6, 6), woodMat);
        shaft.rotation.x = Math.PI / 2;
        shaft.position.set(side * 0.42, wheelRadius + 0.08, 1.85);
        group.add(shaft);
      }
    }

    this.parent.add(group);
    this.vehicles.push({
      type: spec.type,
      group,
      wheels,
      wheelRadius,
      path,
      dist: (spec.phase ?? this.rng()) * (path?.totalLen ?? 10),
      x: spec.x ?? (path ? path.points[0][0] : 0),
      z: spec.z ?? (path ? path.points[0][1] : 0),
      yaw: spec.yaw ?? 0,
      speed: spec.speed ?? (path ? 0.82 + this.rng() * 0.22 : 0),
      carterAnchor,
      oxRef,
    });
  }

  public addSedanChair(spec: SedanChairSpec): void {
    const path = spec.path ? preparePath(spec.path) : undefined;
    const group = new THREE.Group();
    const woodDark = this.matLib.materials.woodDark as THREE.MeshStandardMaterial;
    const woodLight = this.matLib.materials.woodLight as THREE.MeshStandardMaterial;
    const matWoven = this.matLib.materials.wovenMat as THREE.MeshStandardMaterial;

    // 轿厢底座与四角立柱（悬空于 y=0.52m 处，由前后轿夫肩扛长轿杆）
    const baseY = 0.52;
    const floor = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.08, 0.96), woodDark);
    floor.position.set(0, baseY, 0);
    floor.castShadow = true;
    group.add(floor);

    // 下半围板 + 上半精细格子窗框
    const lowerWall = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.52, 0.90), woodLight);
    lowerWall.position.set(0, baseY + 0.28, 0);
    lowerWall.castShadow = true;
    group.add(lowerWall);

    for (const side of [-1, 1]) {
      // 两侧格子窗立棂与横棂
      for (let k = -2; k <= 2; k++) {
        const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.48, 0.025), woodDark);
        mullion.position.set(side * 0.405, baseY + 0.78, k * 0.16);
        group.add(mullion);
      }
      for (const hy of [0.64, 0.80, 0.98]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.028, 0.88), woodDark);
        rail.position.set(side * 0.405, baseY + hy, 0);
        group.add(rail);
      }
      // 长轿杆（全长 3.5m）
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 3.55, 6), woodDark);
      pole.rotation.x = Math.PI / 2;
      pole.position.set(side * 0.45, baseY + 0.46, 0);
      group.add(pole);
    }

    // 背板与前竹帘
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(0.80, 1.02, 0.05), woodLight);
    backWall.position.set(0, baseY + 0.52, -0.44);
    group.add(backWall);

    const blind = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.88, 0.03), matWoven);
    blind.position.set(0, baseY + 0.56, 0.45);
    group.add(blind);

    // 攒尖微翘轿顶 + 宝顶
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.74, 0.36, 4), woodDark);
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(0.95, 1, 1.06);
    roof.position.set(0, baseY + 1.20, 0);
    roof.castShadow = true;
    group.add(roof);

    const finial = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 8, 8),
      this.matLib.materials.ironFitting as THREE.MeshStandardMaterial,
    );
    finial.position.set(0, baseY + 1.40, 0);
    group.add(finial);

    // 若为郊野清明踏青归轿，四角檐下插新柳枝（忠实还原原画著名细节！）
    if (spec.withWillowTwigs) {
      for (const sx of [-0.38, 0.38]) {
        for (const sz of [-0.42, 0.42]) {
          const twig = new THREE.Mesh(
            new THREE.PlaneGeometry(0.45, 0.45),
            this.matLib.materials.willowFoliage,
          );
          twig.position.set(sx * 1.15, baseY + 0.98, sz);
          twig.rotation.z = sx > 0 ? -0.35 : 0.35;
          group.add(twig);
        }
      }
    }

    this.parent.add(group);

    const frontBearer = { x: 0, y: 0, z: 0, yaw: 0 };
    const rearBearer = { x: 0, y: 0, z: 0, yaw: 0 };
    this.addHuman({ role: 'sedan_bearer', headgear: 'topknot', externalAnchor: frontBearer });
    this.addHuman({ role: 'sedan_bearer', headgear: 'topknot', externalAnchor: rearBearer });

    this.sedans.push({
      group,
      path,
      dist: (spec.phase ?? this.rng()) * (path?.totalLen ?? 12),
      x: spec.x ?? (path ? path.points[0][0] : 0),
      z: spec.z ?? (path ? path.points[0][1] : 0),
      yaw: spec.yaw ?? 0,
      speed: spec.speed ?? 0.92,
      phase: (spec.phase ?? this.rng()) * Math.PI * 2,
      frontBearer,
      rearBearer,
    });
  }

  public addBirdFlock(cx: number, cz: number, count: number, radius = 14, baseY = 13) {
    for (let i = 0; i < count; i++) {
      this.birdCenters.push({
        cx: cx + (this.rng() - 0.5) * radius * 0.5,
        cz: cz + (this.rng() - 0.5) * radius * 0.5,
        y: baseY + this.rng() * 6.5,
        r: 4.5 + this.rng() * radius,
        speed: 0.38 + this.rng() * 0.32,
        phase: this.rng() * Math.PI * 2,
      });
    }
  }

  public addChimneySmoke(x: number, y0: number, z: number) {
    for (let k = 0; k < 5; k++) {
      this.smokePuffs.push({
        x,
        y0,
        z,
        phase: k / 5 + this.rng() * 0.12,
        scale: 0.25 + this.rng() * 0.15,
      });
    }
  }

  /**
   * 所有人物与飞鸟炊烟注册完毕后，一次性生成GPU实例化网格池
   */
  public buildInstancedMeshes(): void {
    const n = this.humans.length;
    if (n === 0) return;

    const geos = buildHumanPartGeometries();

    const robeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.86,
      metalness: 0.0,
    });
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0xd8cab0,
      roughness: 0.82,
      metalness: 0.0,
    });
    const faceMat = new THREE.MeshStandardMaterial({
      map: this.matLib.textures.face,
      roughness: 0.78,
      metalness: 0.0,
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: SILK_PALETTE.skinWarm,
      roughness: 0.78,
      metalness: 0.0,
    });
    const shoeMat = new THREE.MeshStandardMaterial({
      color: 0x453b31,
      roughness: 0.85,
      metalness: 0.02,
    });
    const hairCapMat = new THREE.MeshStandardMaterial({
      color: SILK_PALETTE.hairInk,
      roughness: 0.72,
      metalness: 0.04,
    });

    const mkIM = (geo: THREE.BufferGeometry, mat: THREE.Material, count: number, shadow = true) => {
      const im = new THREE.InstancedMesh(geo, mat, Math.max(count, 1));
      im.count = count;
      im.castShadow = shadow;
      im.receiveShadow = true;
      im.frustumCulled = false; // 动态全卷人物每帧实时驱动，禁用默认原点视锥误裁
      this.parent.add(im);
      return im;
    };

    this.imTorso = mkIM(geos.torsoLathe, robeMat, n);
    this.imCollarBelt = mkIM(geos.collarBeltGeo, collarMat, n, false);
    this.imHead = mkIM(geos.headGeo, faceMat, n);
    this.imArmL = mkIM(geos.armGeo, robeMat, n, false);
    this.imArmR = mkIM(geos.armGeo, robeMat, n, false);
    this.imHandL = mkIM(geos.handGeo, skinMat, n, false);
    this.imHandR = mkIM(geos.handGeo, skinMat, n, false);
    this.imLegL = mkIM(geos.legShoeGeo, shoeMat, n, false);
    this.imLegR = mkIM(geos.legShoeGeo, shoeMat, n, false);

    // 统计各冠帽与随身物件数量并建立索引
    let nFutou = 0;
    let nTopknot = 0;
    let nConical = 0;
    let nPole = 0;
    let nBack = 0;
    let nBundle = 0;
    let nSack = 0;
    let nPunt = 0;
    let nCup = 0;

    for (let i = 0; i < n; i++) {
      const h = this.humans[i];
      _col.setHex(h.garmentColor);
      this.imTorso.setColorAt(i, _col);
      this.imArmL.setColorAt(i, _col);
      this.imArmR.setColorAt(i, _col);

      if (h.headgear === 'futou') h.headgearIndex = nFutou++;
      else if (h.headgear === 'topknot') h.headgearIndex = nTopknot++;
      else if (h.headgear === 'conical') h.headgearIndex = nConical++;

      if (h.prop === 'poleBaskets') h.propIndex = nPole++;
      else if (h.prop === 'backBasket') h.propIndex = nBack++;
      else if (h.prop === 'bundle') h.propIndex = nBundle++;
      else if (h.prop === 'grainSack') h.propIndex = nSack++;
      else if (h.prop === 'puntPole') h.propIndex = nPunt++;
      else if (h.prop === 'teaCup') h.propIndex = nCup++;
    }

    if (this.imTorso.instanceColor) this.imTorso.instanceColor.needsUpdate = true;
    if (this.imArmL.instanceColor) this.imArmL.instanceColor.needsUpdate = true;
    if (this.imArmR.instanceColor) this.imArmR.instanceColor.needsUpdate = true;

    this.imFutou = mkIM(geos.futouGeo, hairCapMat, nFutou, false);
    this.imTopknot = mkIM(geos.topknotGeo, hairCapMat, nTopknot, false);
    this.imConical = mkIM(geos.conicalGeo, this.matLib.materials.wovenMat, nConical, true);

    this.imPoleBaskets = mkIM(geos.poleBasketsGeo, this.matLib.materials.wovenMat, nPole, true);
    this.imBackBasket = mkIM(geos.backBasketGeo, this.matLib.materials.wovenMat, nBack, false);
    this.imBundle = mkIM(geos.bundleGeo, this.matLib.materials.umbrellaCloth, nBundle, false);
    this.imGrainSack = mkIM(geos.grainSackGeo, this.matLib.materials.wovenMat, nSack, true);
    this.imPuntPole = mkIM(geos.puntPoleGeo, this.matLib.materials.bambooMat, nPunt, false);
    this.imTeaCup = mkIM(geos.teaCupGeo, this.matLib.materials.plasterWall, nCup, false);

    // 飞鸟实例化网格（双翼 V 字水墨飞鸟）
    if (this.birdCenters.length > 0) {
      const wingL = new THREE.BoxGeometry(0.28, 0.018, 0.10);
      wingL.rotateZ(0.24);
      wingL.translate(-0.13, 0, 0);
      const wingR = new THREE.BoxGeometry(0.28, 0.018, 0.10);
      wingR.rotateZ(-0.24);
      wingR.translate(0.13, 0, 0);
      const birdBody = new THREE.ConeGeometry(0.035, 0.22, 5);
      birdBody.rotateX(Math.PI / 2);
      const birdGeo = mergePartGeometries([wingL, wingR, birdBody]);
      const birdMat = new THREE.MeshStandardMaterial({ color: 0x3b3329, roughness: 0.85 });
      this.imBirds = mkIM(birdGeo, birdMat, this.birdCenters.length, false);
    }

    // 袅袅炊烟实例化网格
    if (this.smokePuffs.length > 0) {
      const smokeGeo = new THREE.IcosahedronGeometry(0.42, 1);
      const smokeMat = new THREE.MeshStandardMaterial({
        color: 0xdcd0b8,
        transparent: true,
        opacity: 0.26,
        depthWrite: false,
        roughness: 1.0,
      });
      this.imSmoke = mkIM(smokeGeo, smokeMat, this.smokePuffs.length, false);
    }
  }

  /**
   * 每帧推进全卷几百个人物、牲口、车轮、轿子、飞鸟与炊烟的细腻动态
   */
  public update(elapsed: number, dt: number): void {
    const pathOut = { x: 0, z: 0, yaw: 0 };

    // 1. 先更新车辆（牛车、独轮车：转动车轮，同步前方拉牛与后方车夫锚点）
    for (let i = 0; i < this.vehicles.length; i++) {
      const v = this.vehicles[i];
      if (v.path && v.speed > 0) {
        const step = v.speed * dt;
        v.dist += step;
        sampleWaypointPath(v.path, v.dist, pathOut);
        v.x = pathOut.x;
        v.z = pathOut.z;
        v.yaw = pathOut.yaw;
        // 车轮按真实线速度连续滚动
        const dAngle = step / v.wheelRadius;
        for (const w of v.wheels) {
          w.rotation.x += dAngle;
        }
      }
      const gy = walkableHeightAt(v.x, v.z);
      v.group.position.set(v.x, gy, v.z);
      v.group.rotation.set(0, v.yaw, 0);

      const sinY = Math.sin(v.yaw);
      const cosY = Math.cos(v.yaw);

      if (v.oxRef) {
        const oxX = v.x + sinY * 2.45;
        const oxZ = v.z + cosY * 2.45;
        v.oxRef.x = oxX;
        v.oxRef.z = oxZ;
        v.oxRef.yaw = v.yaw;
        v.oxRef.speed = v.speed;
      }
      if (v.carterAnchor) {
        if (v.type === 'wheelbarrow') {
          v.carterAnchor.x = v.x - sinY * 1.12;
          v.carterAnchor.z = v.z - cosY * 1.12;
          v.carterAnchor.y = walkableHeightAt(v.carterAnchor.x, v.carterAnchor.z);
          v.carterAnchor.yaw = v.yaw;
        } else {
          // 牛车车夫走在牛侧前方牵引
          v.carterAnchor.x = v.x + sinY * 2.0 + cosY * 0.92;
          v.carterAnchor.z = v.z + cosY * 2.0 - sinY * 0.92;
          v.carterAnchor.y = walkableHeightAt(v.carterAnchor.x, v.carterAnchor.z);
          v.carterAnchor.yaw = v.yaw;
        }
      }
    }

    // 2. 更新轿子（双轿夫前后抬行，轿身微颤起伏）
    for (let i = 0; i < this.sedans.length; i++) {
      const s = this.sedans[i];
      if (s.path && s.speed > 0) {
        s.dist += s.speed * dt;
        sampleWaypointPath(s.path, s.dist, pathOut);
        s.x = pathOut.x;
        s.z = pathOut.z;
        s.yaw = pathOut.yaw;
      }
      const baseY = walkableHeightAt(s.x, s.z);
      const bounce = Math.abs(Math.sin(elapsed * 5.2 + s.phase)) * 0.035;
      s.group.position.set(s.x, baseY + bounce, s.z);
      s.group.rotation.set(Math.sin(elapsed * 2.6 + s.phase) * 0.015, s.yaw, 0);

      const sinY = Math.sin(s.yaw);
      const cosY = Math.cos(s.yaw);
      s.frontBearer.x = s.x + sinY * 1.38;
      s.frontBearer.z = s.z + cosY * 1.38;
      s.frontBearer.y = walkableHeightAt(s.frontBearer.x, s.frontBearer.z);
      s.frontBearer.yaw = s.yaw;

      s.rearBearer.x = s.x - sinY * 1.38;
      s.rearBearer.z = s.z - cosY * 1.38;
      s.rearBearer.y = walkableHeightAt(s.rearBearer.x, s.rearBearer.z);
      s.rearBearer.yaw = s.yaw;
    }

    // 3. 更新牲口（四蹄对角交替迈步、点头与摆尾，同步背上骑手位置）
    for (let i = 0; i < this.animals.length; i++) {
      const a = this.animals[i];
      if (a.path && a.speed > 0) {
        a.dist += a.speed * dt;
        sampleWaypointPath(a.path, a.dist, pathOut);
        a.x = pathOut.x;
        a.z = pathOut.z;
        a.yaw = pathOut.yaw;
      }
      const gy = walkableHeightAt(a.x, a.z);
      const moving = a.speed > 0.05 || Boolean(a.path);
      const freq = a.species === 'pig' || a.species === 'dog' ? 7.5 : 4.6;
      const cyc = elapsed * freq + a.phase;
      const strideAmp = moving ? 0.42 : 0.04;
      const bob = moving ? Math.abs(Math.sin(cyc)) * 0.035 : 0;

      a.group.position.set(a.x, gy + bob, a.z);
      a.group.rotation.set(0, a.yaw, 0);

      // 对角四拍步态：左前与右后同相，右前与左后反相
      a.legs[0].rotation.x = Math.sin(cyc) * strideAmp;
      a.legs[3].rotation.x = Math.sin(cyc + 0.35) * strideAmp;
      a.legs[1].rotation.x = Math.sin(cyc + Math.PI) * strideAmp;
      a.legs[2].rotation.x = Math.sin(cyc + Math.PI + 0.35) * strideAmp;

      a.headPivot.rotation.x = Math.sin(cyc * 0.9) * (moving ? 0.09 : 0.05);
      a.headPivot.rotation.y = moving ? 0 : Math.sin(elapsed * 1.2 + a.phase) * 0.16;
      if (a.tailPivot) {
        a.tailPivot.rotation.z = Math.sin(elapsed * 3.8 + a.phase) * 0.24;
      }

      if (a.riderAnchor) {
        a.riderAnchor.x = a.x;
        a.riderAnchor.z = a.z;
        a.riderAnchor.y = gy + a.saddleHeight - 0.86 + bob * 1.15;
        a.riderAnchor.yaw = a.yaw;
      }
    }

    // 4. 更新全部几百名人物的关节矩阵
    if (!this.imTorso) return;

    for (let i = 0; i < this.humans.length; i++) {
      const h = this.humans[i];

      if (h.externalAnchor) {
        h.x = h.externalAnchor.x;
        h.y = h.externalAnchor.y;
        h.z = h.externalAnchor.z;
        h.yaw = h.externalAnchor.yaw;
      } else if (h.path && h.speed > 0) {
        h.dist += h.speed * dt;
        sampleWaypointPath(h.path, h.dist, pathOut);
        h.x = pathOut.x;
        h.z = pathOut.z;
        h.yaw = pathOut.yaw;
        h.y = walkableHeightAt(h.x, h.z);
      } else if (!h.useCustomY) {
        h.y = walkableHeightAt(h.x, h.z);
      }

      // 依角色身份计算步态、躯干前倾、四肢摆动与头部神态
      const t = elapsed * 4.6 + h.phase;
      let torsoLeanX = 0;
      let bodyBobY = 0;
      let headYaw = 0;
      let headPitch = 0;
      let armLX = 0;
      let armLZ = 0.08;
      let armRX = 0;
      let armRZ = -0.08;
      let legLX = 0;
      let legRX = 0;
      let legSpreadX = 0.075;

      switch (h.role) {
        case 'walker': {
          const w = Math.sin(t);
          bodyBobY = Math.abs(w) * 0.025;
          torsoLeanX = 0.04;
          legLX = w * 0.46;
          legRX = -w * 0.46;
          armLX = -w * 0.36;
          armRX = w * 0.36;
          headYaw = Math.sin(elapsed * 0.9 + h.phase) * 0.16;
          break;
        }
        case 'sleeved': {
          // 宋代文士商贾拱手/袖手漫步或驻足交谈
          const moving = Boolean(h.path && h.speed > 0.05);
          const w = moving ? Math.sin(t * 0.82) : 0;
          bodyBobY = Math.abs(w) * 0.018;
          legLX = w * 0.32;
          legRX = -w * 0.32;
          armLX = -0.78 + Math.sin(elapsed * 1.8 + h.phase) * 0.06;
          armRX = -0.78 - Math.sin(elapsed * 1.8 + h.phase) * 0.06;
          armLZ = -0.26;
          armRZ = 0.26;
          headYaw = Math.sin(elapsed * 1.1 + h.phase) * 0.22;
          headPitch = Math.sin(elapsed * 1.6 + h.phase) * 0.06;
          break;
        }
        case 'porter_pole': {
          // 挑夫小碎步弹动，右手扶扁担，左手摆动平衡
          const w = Math.sin(t * 1.32);
          bodyBobY = Math.abs(w) * 0.035;
          torsoLeanX = 0.11;
          legLX = w * 0.52;
          legRX = -w * 0.52;
          armRX = -0.95 + w * 0.06;
          armRZ = -0.18;
          armLX = -w * 0.32;
          break;
        }
        case 'porter_sack': {
          // 码头扛大包苦力：俯身弓背稳步登跳板
          const w = Math.sin(t * 1.1);
          bodyBobY = Math.abs(w) * 0.03;
          torsoLeanX = 0.34;
          legLX = w * 0.48;
          legRX = -w * 0.48;
          armLX = -1.05;
          armRX = -1.12;
          headPitch = -0.18;
          break;
        }
        case 'tracker': {
          // 汴河纤夫：用力前倾弓步曳船！
          const w = Math.sin(t * 0.92);
          torsoLeanX = 0.62 + Math.sin(t * 1.84) * 0.05;
          bodyBobY = -0.06 + Math.abs(w) * 0.025;
          legLX = w * 0.56 - 0.15;
          legRX = -w * 0.56 - 0.15;
          armLX = -0.45 + w * 0.22;
          armRX = -0.45 - w * 0.22;
          headPitch = -0.28;
          break;
        }
        case 'sedan_bearer':
        case 'carter': {
          const w = Math.sin(t * 1.18);
          bodyBobY = Math.abs(w) * 0.028;
          torsoLeanX = h.role === 'carter' ? 0.22 : 0.08;
          legLX = w * 0.48;
          legRX = -w * 0.48;
          armLX = -0.62;
          armRX = -0.62;
          break;
        }
        case 'boat_poler': {
          // 船工持长篙用力撑抵推送
          const push = Math.sin(elapsed * 2.1 + h.phase);
          torsoLeanX = 0.28 + push * 0.24;
          legLX = 0.22;
          legRX = -0.28;
          armLX = -1.05 + push * 0.32;
          armRX = -1.25 + push * 0.35;
          headPitch = -0.1;
          break;
        }
        case 'boat_sculler': {
          // 船尾摇橹往复推挽
          const row = Math.sin(elapsed * 2.6 + h.phase);
          torsoLeanX = 0.18 + row * 0.22;
          legLX = 0.16;
          legRX = -0.18;
          armLX = -0.88 + row * 0.38;
          armRX = -0.88 + row * 0.38;
          break;
        }
        case 'rider': {
          // 骑马骑驴者双腿跨鞍，手持缰绳随坐骑起伏
          bodyBobY = 0;
          legSpreadX = 0.19;
          legLX = -0.42;
          legRX = -0.42;
          armLX = -0.58;
          armRX = -0.52;
          headYaw = Math.sin(elapsed * 0.9 + h.phase) * 0.18;
          break;
        }
        case 'seated_tea': {
          // 酒楼茶肆坐客：屈膝而坐，举碗品茗交谈
          bodyBobY = -0.28;
          legLX = -1.25;
          legRX = -1.25;
          const sip = Math.max(0, Math.sin(elapsed * 0.95 + h.phase));
          armRX = -0.65 - sip * 0.65;
          armLX = -0.48 + Math.sin(elapsed * 1.5 + h.phase) * 0.12;
          headYaw = Math.sin(elapsed * 1.1 + h.phase) * 0.25;
          headPitch = -sip * 0.18;
          break;
        }
        case 'bridge_onlooker': {
          // 虹桥桥上凭栏俯看、挥手呼喊施援
          torsoLeanX = 0.32 + Math.sin(elapsed * 2.4 + h.phase) * 0.06;
          const wave = Math.sin(elapsed * 4.2 + h.phase);
          armRX = -1.65 + wave * 0.42;
          armRZ = -0.25;
          armLX = -0.75;
          headPitch = 0.32;
          headYaw = Math.sin(elapsed * 1.6 + h.phase) * 0.2;
          break;
        }
        case 'vendor': {
          // 摊贩与跑堂伙计招呼客人
          const gesture = Math.sin(elapsed * 2.8 + h.phase);
          torsoLeanX = 0.08;
          armRX = -0.75 + gesture * 0.32;
          armLX = -0.42 - gesture * 0.15;
          headYaw = Math.sin(elapsed * 1.4 + h.phase) * 0.32;
          break;
        }
      }

      const s = h.scale;
      _pos.set(h.x, h.y + bodyBobY * s, h.z);
      _euler.set(torsoLeanX, h.yaw, 0, 'YXZ');
      _quat.setFromEuler(_euler);
      _scale.setScalar(s);
      _mRoot.compose(_pos, _quat, _scale);

      // 躯干与交领腰带
      this.imTorso.setMatrixAt(i, _mRoot);
      this.imCollarBelt.setMatrixAt(i, _mRoot);

      // 头部（位于局部 y=1.45m）
      _pos2.set(0, 1.45, 0);
      _euler.set(headPitch, headYaw, 0, 'YXZ');
      _quat.setFromEuler(_euler);
      _scale.setScalar(1);
      _mLocal.compose(_pos2, _quat, _scale);
      _mPart.multiplyMatrices(_mRoot, _mLocal);
      this.imHead.setMatrixAt(i, _mPart);

      if (h.headgearIndex >= 0) {
        if (h.headgear === 'futou') this.imFutou.setMatrixAt(h.headgearIndex, _mPart);
        else if (h.headgear === 'topknot') this.imTopknot.setMatrixAt(h.headgearIndex, _mPart);
        else if (h.headgear === 'conical') this.imConical.setMatrixAt(h.headgearIndex, _mPart);
      }

      // 左臂与左手（肩枢轴 (-0.195, 1.24, 0)）
      _pos2.set(-0.195, 1.24, 0);
      _euler.set(armLX, 0, armLZ, 'YXZ');
      _quat.setFromEuler(_euler);
      _mLocal.compose(_pos2, _quat, _scale);
      _mPart.multiplyMatrices(_mRoot, _mLocal);
      this.imArmL.setMatrixAt(i, _mPart);
      this.imHandL.setMatrixAt(i, _mPart);

      // 右臂与右手（肩枢轴 (+0.195, 1.24, 0)）
      _pos2.set(0.195, 1.24, 0);
      _euler.set(armRX, 0, armRZ, 'YXZ');
      _quat.setFromEuler(_euler);
      _mLocal.compose(_pos2, _quat, _scale);
      _mPart.multiplyMatrices(_mRoot, _mLocal);
      this.imArmR.setMatrixAt(i, _mPart);
      this.imHandR.setMatrixAt(i, _mPart);

      // 茶碗随右手举起
      if (h.prop === 'teaCup' && h.propIndex >= 0) {
        _pos2.set(0, -0.45, 0.13);
        _quat.identity();
        _mLocal.compose(_pos2, _quat, _scale);
        _mPart.multiply(_mLocal);
        this.imTeaCup.setMatrixAt(h.propIndex, _mPart);
      }

      // 双腿与鞋履（不随重度俯身弯曲离地，只跟随位置与朝向）
      _pos.set(h.x, h.y + (h.role === 'seated_tea' ? -0.18 : bodyBobY) * s, h.z);
      _euler.set(0, h.yaw, 0, 'YXZ');
      _quat.setFromEuler(_euler);
      _scale.setScalar(s);
      _mRoot.compose(_pos, _quat, _scale);

      _pos2.set(-legSpreadX, 0.58, 0);
      _euler.set(legLX, 0, 0, 'YXZ');
      _quat.setFromEuler(_euler);
      _scale.setScalar(1);
      _mLocal.compose(_pos2, _quat, _scale);
      _mPart.multiplyMatrices(_mRoot, _mLocal);
      this.imLegL.setMatrixAt(i, _mPart);

      _pos2.set(legSpreadX, 0.58, 0);
      _euler.set(legRX, 0, 0, 'YXZ');
      _quat.setFromEuler(_euler);
      _mLocal.compose(_pos2, _quat, _scale);
      _mPart.multiplyMatrices(_mRoot, _mLocal);
      this.imLegR.setMatrixAt(i, _mPart);

      // 随身担子、背篓、包袱、粮袋、船篙
      if (h.propIndex >= 0 && h.prop !== 'teaCup') {
        if (h.prop === 'poleBaskets') {
          const wobble = Math.sin(t * 2.64) * 0.045;
          _pos2.set(0.12, 1.30 + wobble * 0.4, 0);
          _euler.set(wobble, 0.12, 0, 'YXZ');
          _quat.setFromEuler(_euler);
          _mLocal.compose(_pos2, _quat, _scale);
          _mPart.multiplyMatrices(_mRoot, _mLocal);
          this.imPoleBaskets.setMatrixAt(h.propIndex, _mPart);
        } else {
          // 其余道具跟随上身俯仰矩阵
          _pos.set(h.x, h.y + bodyBobY * s, h.z);
          _euler.set(torsoLeanX, h.yaw, 0, 'YXZ');
          _quat.setFromEuler(_euler);
          _scale.setScalar(s);
          _mPart.compose(_pos, _quat, _scale);
          if (h.prop === 'backBasket') this.imBackBasket.setMatrixAt(h.propIndex, _mPart);
          else if (h.prop === 'bundle') this.imBundle.setMatrixAt(h.propIndex, _mPart);
          else if (h.prop === 'grainSack') this.imGrainSack.setMatrixAt(h.propIndex, _mPart);
          else if (h.prop === 'puntPole') this.imPuntPole.setMatrixAt(h.propIndex, _mPart);
        }
      }
    }

    const mark = (im?: THREE.InstancedMesh) => {
      if (im && im.count > 0) im.instanceMatrix.needsUpdate = true;
    };
    mark(this.imTorso);
    mark(this.imCollarBelt);
    mark(this.imHead);
    mark(this.imArmL);
    mark(this.imArmR);
    mark(this.imHandL);
    mark(this.imHandR);
    mark(this.imLegL);
    mark(this.imLegR);
    mark(this.imFutou);
    mark(this.imTopknot);
    mark(this.imConical);
    mark(this.imPoleBaskets);
    mark(this.imBackBasket);
    mark(this.imBundle);
    mark(this.imGrainSack);
    mark(this.imPuntPole);
    mark(this.imTeaCup);

    // 5. 更新盘旋飞鸟（展翅上下扑翼 + 环绕滑翔）
    if (this.imBirds && this.birdCenters.length > 0) {
      for (let i = 0; i < this.birdCenters.length; i++) {
        const b = this.birdCenters[i];
        const ang = elapsed * b.speed + b.phase;
        const bx = b.cx + Math.cos(ang) * b.r;
        const bz = b.cz + Math.sin(ang * 0.85) * b.r * 0.65;
        const by = b.y + Math.sin(elapsed * 1.4 + b.phase) * 0.8;
        const dx = -Math.sin(ang) * b.r * b.speed;
        const dz = Math.cos(ang * 0.85) * b.r * 0.65 * b.speed * 0.85;
        const yaw = Math.atan2(dx, dz);
        const flap = 0.72 + Math.sin(elapsed * 9.5 + b.phase * 3) * 0.35;

        _pos.set(bx, by, bz);
        _euler.set(0, yaw, Math.sin(ang) * 0.18, 'YXZ');
        _quat.setFromEuler(_euler);
        _scale.set(1.15, flap, 1.15);
        _mPart.compose(_pos, _quat, _scale);
        this.imBirds.setMatrixAt(i, _mPart);
      }
      this.imBirds.instanceMatrix.needsUpdate = true;
    }

    // 6. 更新屋顶与食摊袅袅炊烟
    if (this.imSmoke && this.smokePuffs.length > 0) {
      for (let i = 0; i < this.smokePuffs.length; i++) {
        const sp = this.smokePuffs[i];
        const life = (elapsed * 0.22 + sp.phase) % 1.0;
        const sy = sp.y0 + life * 4.2;
        const sx = sp.x + Math.sin(life * 5.0 + sp.phase * 6) * 0.45 + life * 0.65;
        const sz = sp.z + Math.cos(life * 4.0 + sp.phase * 5) * 0.28;
        const sc = sp.scale * (0.45 + Math.sin(life * Math.PI) * 1.45);
        _pos.set(sx, sy, sz);
        _quat.identity();
        _scale.setScalar(Math.max(sc, 0.02));
        _mPart.compose(_pos, _quat, _scale);
        this.imSmoke.setMatrixAt(i, _mPart);
      }
      this.imSmoke.instanceMatrix.needsUpdate = true;
    }
  }
}

/**
 * 向静态网格合并器添加街市大油布伞与琳琅满目的货摊（供各段布景复用）
 */
export function addMarketUmbrellaAndStall(
  batcher: StaticGeometryBatcher,
  x: number,
  z: number,
  yaw: number,
  opts: {
    onBridge?: boolean;
    umbrella?: boolean;
    goodsType?: 'pots' | 'cloth' | 'buns' | 'tools';
  } = {},
) {
  const y = opts.onBridge ? walkableHeightAt(x, z) : groundHeightAt(x, z);
  const mBase = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, y, z);
  const m = new THREE.Matrix4();

  // 货台木案或地席
  if (opts.goodsType === 'tools') {
    // 铺地芦席摊（如虹桥卖刀剪杂货摊）
    m.makeTranslation(0, 0.03, 0).premultiply(mBase);
    batcher.addBox('wovenMat', 1.75, 0.04, 1.15, m);
    for (let k = -3; k <= 3; k++) {
      m.makeTranslation(k * 0.21, 0.07, (k % 2) * 0.18).premultiply(mBase);
      batcher.addBox('ironFitting', 0.12, 0.03, 0.34, m);
    }
  } else {
    // 四腿货案与横撑
    m.makeTranslation(0, 0.74, 0).premultiply(mBase);
    batcher.addBox('woodLight', 1.72, 0.07, 0.92, m);
    for (const lx of [-0.74, 0.74]) {
      for (const lz of [-0.36, 0.36]) {
        m.makeTranslation(lx, 0.37, lz).premultiply(mBase);
        batcher.addBox('woodDark', 0.07, 0.74, 0.07, m);
      }
    }

    // 案上货物细节
    if (opts.goodsType === 'pots') {
      for (const px of [-0.52, -0.16, 0.22, 0.54]) {
        m.makeTranslation(px, 0.93, 0).premultiply(mBase);
        batcher.addCylinder('tileRidge', 0.11, 0.14, 0.32, 8, m);
      }
    } else if (opts.goodsType === 'buns') {
      for (const px of [-0.36, 0.26]) {
        for (let stack = 0; stack < 3; stack++) {
          m.makeTranslation(px, 0.84 + stack * 0.13, 0).premultiply(mBase);
          batcher.addCylinder('bambooMat', 0.24, 0.24, 0.12, 10, m);
        }
      }
    } else {
      // 绸布匹与杂货匣
      for (let k = -2; k <= 2; k++) {
        m.makeRotationZ(Math.PI / 2);
        m.setPosition(k * 0.28, 0.86, 0);
        m.premultiply(mBase);
        batcher.addCylinder(k % 2 === 0 ? 'ribbonRed' : 'umbrellaCloth', 0.09, 0.09, 0.56, 8, m);
      }
    }
  }

  // 北宋街市标志性大伞（立柱 + 石础 + 十二棱伞盖 + 放射竹伞骨）
  if (opts.umbrella !== false) {
    const ux = 0.22;
    const uz = -0.35;
    m.makeTranslation(ux, 0.10, uz).premultiply(mBase);
    batcher.addBox('stonePodium', 0.32, 0.20, 0.32, m);

    m.makeTranslation(ux, 1.38, uz).premultiply(mBase);
    batcher.addCylinder('woodDark', 0.036, 0.045, 2.55, 7, m);

    const canopy = new THREE.ConeGeometry(1.52, 0.42, 12, 1, true);
    m.makeTranslation(ux, 2.52, uz).premultiply(mBase);
    batcher.add('umbrellaCloth', canopy, m);
    canopy.dispose();

    // 伞下放射竹骨
    for (let r = 0; r < 8; r++) {
      const ang = (r / 8) * Math.PI * 2;
      const rib = new THREE.BoxGeometry(0.025, 0.025, 1.48);
      rib.rotateX(0.26);
      rib.translate(0, -0.18, 0.72);
      rib.rotateY(ang);
      rib.translate(ux, 2.68, uz);
      batcher.add('bambooMat', rib, mBase);
      rib.dispose();
    }
  }
}
