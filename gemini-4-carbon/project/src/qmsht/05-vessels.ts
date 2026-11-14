import * as THREE from 'three';
import { CrowdAndLifeSystem, HumanActorSpec } from './03-actors';
import {
  createRng,
  MaterialLibrary,
  mergePartGeometries,
  StaticGeometryBatcher,
} from './01-primitives';
import { BIAN_RIVER_CURVE, groundHeightAt, WORLD_BOUNDS } from './02-world';

/**
 * 模块五：汴河船只（05-vessels.ts）
 * 严格依据《清明上河图》原画汴河船制建模：
 * - 两头上翘的平底方首翘尾船身（附护舷木与两侧走舸跳板）
 * - 中舱带格子船窗与拱形芦席船篷
 * - 船尾设高起舵楼与深入水中的巨型升降大舵
 * - 船前甲板设铰接“可放倒的人字桅”及船尾桅架 —— 全卷绝无任何一条船张帆！
 * - 每条船随水波轻晃，行进船只持续摇橹，虹桥下大船动态演示急落人字桅与撑篙施救场面。
 */

const _v = new THREE.Vector3();
const _m = new THREE.Matrix4();

/**
 * 放样生成北宋汴河漕船两头上翘船壳几何体（Z 轴为船长方向，+Z 为船首，-Z 为高翘船尾）
 */
function createSongHullGeometry(length: number, beam: number, depth: number): THREE.BufferGeometry {
  const segZ = 18;
  // 横截面采样点（从右舷甲板 -> 右舷舭部 -> 平底右 -> 平底左 -> 左舷舭部 -> 左舷甲板 -> 封顶甲板）
  const profileTemplate: Array<[number, number]> = [
    [0.50, 1.0],
    [0.44, 0.35],
    [0.34, 0.0],
    [-0.34, 0.0],
    [-0.44, 0.35],
    [-0.50, 1.0],
  ];
  const ringCount = profileTemplate.length;
  const verts: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let iz = 0; iz <= segZ; iz++) {
    const t = iz / segZ; // 0 = 船尾 (-L/2), 1 = 船首 (+L/2)
    const s = t * 2 - 1; // -1..+1
    const z = s * (length * 0.5);

    // 船宽收束：中部饱满，首尾收窄为北宋平头方首（非尖刺首）
    const widthFactor =
      s >= 0
        ? 1 - Math.pow(s, 2.2) * 0.56 // 方首保留 0.44 宽度
        : 1 - Math.pow(-s, 2.0) * 0.48; // 船尾保留 0.52 宽度

    // 两头上翘曲线：船尾高翘，船首昂起
    const sheerLift =
      s >= 0
        ? Math.pow(Math.max(0, s - 0.25) / 0.75, 2.1) * (depth * 0.85)
        : Math.pow(Math.max(0, -s - 0.18) / 0.82, 2.0) * (depth * 1.25);

    const localDepth = depth * (1 - Math.pow(Math.abs(s), 2.6) * 0.32);

    for (let ip = 0; ip < ringCount; ip++) {
      const [px, py] = profileTemplate[ip];
      verts.push(px * beam * widthFactor, sheerLift + py * localDepth - depth * 0.42, z);
      uvs.push(t * (length * 0.35), ip / (ringCount - 1));
    }
  }

  // 连接船壳外侧与底板面片
  for (let iz = 0; iz < segZ; iz++) {
    for (let ip = 0; ip < ringCount - 1; ip++) {
      const a = iz * ringCount + ip;
      const b = a + 1;
      const c = (iz + 1) * ringCount + ip;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
    // 铺设甲板面（连接左舷顶 ringCount-1 与右舷顶 0）
    const r0 = iz * ringCount + 0;
    const l0 = iz * ringCount + (ringCount - 1);
    const r1 = (iz + 1) * ringCount + 0;
    const l1 = (iz + 1) * ringCount + (ringCount - 1);
    indices.push(l0, l1, r0, r0, l1, r1);
  }

  // 封闭方首与方尾封板
  for (const endIz of [0, segZ]) {
    const base = endIz * ringCount;
    if (endIz === segZ) {
      indices.push(base + 0, base + 5, base + 1, base + 1, base + 5, base + 4, base + 1, base + 4, base + 2, base + 2, base + 4, base + 3);
    } else {
      indices.push(base + 0, base + 1, base + 5, base + 1, base + 4, base + 5, base + 1, base + 2, base + 4, base + 2, base + 3, base + 4);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export interface VesselSpec {
  kind: 'grainBarge' | 'passengerBoat' | 'rainbowHero' | 'skiff';
  length?: number;
  beam?: number;
  // 静态系泊位置或沿汴河曲线航行参数
  x?: number;
  z?: number;
  yaw?: number;
  riverTStart?: number;
  riverTEnd?: number;
  speedT?: number;
  lateralOffset?: number;
  // 桅杆状态：'lowered' 平放桅架 | 'lowering' 虹桥下急落中 | 'derrickBare' 码头立杆卸货（无帆！） | 'none' 小舟无桅
  mastState?: 'lowered' | 'lowering' | 'derrickBare' | 'none';
  hasGangplankToNorth?: boolean;
  towTargets?: Array<{ x: number; z: number }>; // 纤夫拉纤连接点
}

interface CrewSlot {
  localPos: THREE.Vector3;
  localYaw: number;
  anchor: NonNullable<HumanActorSpec['externalAnchor']>;
}

interface InternalVessel {
  spec: VesselSpec;
  group: THREE.Group;
  mastPivot?: THREE.Object3D;
  rudderPivot?: THREE.Object3D;
  oars: Array<{ pivot: THREE.Object3D; side: number; phase: number }>;
  crewSlots: CrewSlot[];
  baseX: number;
  baseZ: number;
  baseYaw: number;
  phase: number;
  towLine?: THREE.Line;
  towTrackers?: Array<{ anchor: NonNullable<HumanActorSpec['externalAnchor']>; offset: number }>;
}

export class BianVesselSystem {
  private vessels: InternalVessel[] = [];
  private parent: THREE.Object3D;
  private matLib: MaterialLibrary;
  private rng = createRng(11190618);

  constructor(parent: THREE.Object3D, matLib: MaterialLibrary) {
    this.parent = parent;
    this.matLib = matLib;
  }

  public addVessel(
    spec: VesselSpec,
    crowd: CrowdAndLifeSystem,
    staticBatcher?: StaticGeometryBatcher,
  ): void {
    const isSkiff = spec.kind === 'skiff';
    const L = spec.length ?? (spec.kind === 'rainbowHero' ? 14.2 : isSkiff ? 6.6 : 12.6);
    const B = spec.beam ?? (spec.kind === 'rainbowHero' ? 3.45 : isSkiff ? 1.75 : 3.05);
    const D = isSkiff ? 0.68 : 1.12;

    const group = new THREE.Group();
    const woodDark = this.matLib.materials.woodDark as THREE.MeshStandardMaterial;
    const woodLight = this.matLib.materials.woodLight as THREE.MeshStandardMaterial;
    const matWoven = this.matLib.materials.wovenMat as THREE.MeshStandardMaterial;
    const ironMat = this.matLib.materials.ironFitting as THREE.MeshStandardMaterial;

    // 1. 船壳主体 + 两侧护舷木与走舸外挑踏板（合并为单一木材质网格减少 Draw Calls）
    const hullParts: THREE.BufferGeometry[] = [createSongHullGeometry(L, B, D)];

    for (const side of [-1, 1]) {
      const wale = new THREE.BoxGeometry(0.11, 0.12, L * 0.78);
      wale.translate(side * (B * 0.49), D * 0.48, 0);
      hullParts.push(wale);

      if (!isSkiff) {
        // 船工撑篙走道（走舸板）
        const catwalk = new THREE.BoxGeometry(0.28, 0.06, L * 0.62);
        catwalk.translate(side * (B * 0.54), D * 0.56, 0.02);
        hullParts.push(catwalk);
      }
    }

    // 船头系缆桩与桅夹木座
    if (!isSkiff) {
      for (const side of [-1, 1]) {
        const bitt = new THREE.BoxGeometry(0.12, 0.48, 0.14);
        bitt.translate(side * 0.42, D * 0.75, L * 0.24);
        hullParts.push(bitt);
      }
    }

    const hullMerged = mergePartGeometries(hullParts);
    const hullMesh = new THREE.Mesh(hullMerged, woodDark);
    hullMesh.castShadow = true;
    hullMesh.receiveShadow = true;
    group.add(hullMesh);

    // 2. 中部船舱木构格子窗与拱形芦席船篷
    const cabinLen = L * (isSkiff ? 0.44 : 0.48);
    const cabinW = B * 0.76;
    const cabinH = isSkiff ? 0.72 : 1.12;
    const deckY = D * 0.56;

    const cabinPartsLight: THREE.BufferGeometry[] = [];
    const cabinWall = new THREE.BoxGeometry(cabinW, cabinH, cabinLen);
    cabinWall.translate(0, deckY + cabinH * 0.5, -L * 0.03);
    cabinPartsLight.push(cabinWall);

    // 舱壁外凸格子窗框条
    if (!isSkiff) {
      const winCount = 5;
      for (const side of [-1, 1]) {
        for (let w = 0; w < winCount; w++) {
          const wz = -L * 0.03 - cabinLen * 0.38 + (w / (winCount - 1)) * (cabinLen * 0.76);
          const frame = new THREE.BoxGeometry(0.05, cabinH * 0.58, 0.08);
          frame.translate(side * (cabinW * 0.51), deckY + cabinH * 0.58, wz);
          cabinPartsLight.push(frame);
        }
      }
    }

    // 船尾高起舵楼（非小舟均有）
    const sternZ = -L * 0.34;
    if (!isSkiff) {
      const sternHouse = new THREE.BoxGeometry(cabinW * 0.88, cabinH * 1.12, L * 0.18);
      sternHouse.translate(0, deckY + 0.32 + cabinH * 0.56, sternZ);
      cabinPartsLight.push(sternHouse);

      // 船尾承接放倒人字桅的 X 形木桅架
      for (const side of [-1, 1]) {
        const leg = new THREE.CylinderGeometry(0.04, 0.045, 1.55, 6);
        leg.rotateZ(side * 0.28);
        leg.translate(side * 0.18, deckY + cabinH + 0.55, -L * 0.26);
        cabinPartsLight.push(leg);
      }
      const crossBar = new THREE.CylinderGeometry(0.045, 0.045, 1.1, 6);
      crossBar.rotateZ(Math.PI / 2);
      crossBar.translate(0, deckY + cabinH + 0.92, -L * 0.26);
      cabinPartsLight.push(crossBar);
    }

    const cabinMesh = new THREE.Mesh(mergePartGeometries(cabinPartsLight), woodLight);
    cabinMesh.castShadow = true;
    cabinMesh.receiveShadow = true;
    group.add(cabinMesh);

    // 拱形席篷（中舱与舵楼顶面）
    const matParts: THREE.BufferGeometry[] = [];
    const mainCanopy = new THREE.CylinderGeometry(
      cabinW * 0.58,
      cabinW * 0.58,
      cabinLen + 0.36,
      12,
      1,
      true,
      -Math.PI * 0.52,
      Math.PI * 1.04,
    );
    mainCanopy.rotateZ(Math.PI / 2);
    mainCanopy.rotateY(Math.PI / 2);
    mainCanopy.scale(1.0, 0.68, 1.0);
    mainCanopy.translate(0, deckY + cabinH * 0.92, -L * 0.03);
    matParts.push(mainCanopy);

    if (!isSkiff) {
      const sternCanopy = new THREE.CylinderGeometry(
        cabinW * 0.52,
        cabinW * 0.52,
        L * 0.21,
        10,
        1,
        true,
        -Math.PI * 0.5,
        Math.PI,
      );
      sternCanopy.rotateZ(Math.PI / 2);
      sternCanopy.rotateY(Math.PI / 2);
      sternCanopy.scale(1.0, 0.58, 1.0);
      sternCanopy.translate(0, deckY + 0.34 + cabinH * 1.05, sternZ);
      matParts.push(sternCanopy);
    }

    const matCanopyMesh = new THREE.Mesh(mergePartGeometries(matParts), matWoven);
    matCanopyMesh.castShadow = true;
    matCanopyMesh.receiveShadow = true;
    group.add(matCanopyMesh);

    // 3. 船尾巨型平衡大舵（含粗舵杆、水下宽大舵叶与舵柄）
    let rudderPivot: THREE.Object3D | undefined;
    if (!isSkiff) {
      rudderPivot = new THREE.Group();
      rudderPivot.position.set(0, deckY + 0.65, -L * 0.47);
      const rudderParts: THREE.BufferGeometry[] = [];

      const post = new THREE.CylinderGeometry(0.065, 0.075, 2.35, 8);
      post.rotateX(-0.26);
      post.translate(0, -0.55, -0.25);
      rudderParts.push(post);

      const blade = new THREE.BoxGeometry(0.08, 1.15, 1.45);
      blade.rotateX(-0.18);
      blade.translate(0, -1.25, -0.72);
      rudderParts.push(blade);

      const tiller = new THREE.BoxGeometry(0.08, 0.08, 1.45);
      tiller.translate(0, 0.42, 0.65);
      rudderParts.push(tiller);

      const rudderMesh = new THREE.Mesh(mergePartGeometries(rudderParts), woodDark);
      rudderPivot.add(rudderMesh);
      group.add(rudderPivot);
    }

    // 4. 可放倒的人字桅（双脚木桅杆 + 顶端滑轮横担，绝不挂帆！）
    let mastPivot: THREE.Object3D | undefined;
    const mastMode = spec.mastState ?? (isSkiff ? 'none' : 'lowered');
    if (mastMode !== 'none') {
      mastPivot = new THREE.Group();
      mastPivot.position.set(0, deckY + 0.25, L * 0.24);

      const mastLen = L * 0.64;
      const legSpan = B * 0.28;
      const mastParts: THREE.BufferGeometry[] = [];

      for (const side of [-1, 1]) {
        const spar = new THREE.CylinderGeometry(0.042, 0.078, mastLen, 8);
        spar.translate(0, mastLen * 0.5, 0);
        spar.rotateZ(side * Math.atan2(legSpan, mastLen));
        spar.translate(side * legSpan, 0, 0);
        mastParts.push(spar);
      }
      // 桅顶横担与铁箍滑车
      const topCross = new THREE.BoxGeometry(0.56, 0.09, 0.09);
      topCross.translate(0, mastLen * 0.95, 0);
      mastParts.push(topCross);

      const mastMesh = new THREE.Mesh(mergePartGeometries(mastParts), woodDark);
      mastMesh.castShadow = true;
      mastPivot.add(mastMesh);

      const pulley = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.03, 6, 12), ironMat);
      pulley.position.set(0, mastLen * 0.98, 0);
      mastPivot.add(pulley);

      // 旋转 X：0 为竖直向上，-PI/2 附近为向船尾平放倒在桅架上！
      if (mastMode === 'lowered') {
        mastPivot.rotation.x = -Math.PI * 0.43; // 平卧在船篷上方船尾桅架上
      } else if (mastMode === 'lowering') {
        mastPivot.rotation.x = -Math.PI * 0.27; // 过虹桥前夕正在紧急放倒半途！
      } else if (mastMode === 'derrickBare') {
        mastPivot.rotation.x = -0.06; // 码头卸粮漕船：光杆立桅做滑车吊杆，绝无风帆
      }
      group.add(mastPivot);
    }

    // 5. 摇橹装置（长曲柄木橹）
    const oars: InternalVessel['oars'] = [];
    const oarSides = isSkiff ? [1] : [-1, 1];
    for (const side of oarSides) {
      const oarPivot = new THREE.Group();
      oarPivot.position.set(side * (B * 0.46), deckY + 0.16, -L * 0.32);

      const shaft = new THREE.CylinderGeometry(0.028, 0.035, 3.6, 6);
      shaft.rotateX(-1.12);
      shaft.rotateZ(-side * 0.35);
      shaft.translate(side * 0.65, -0.58, -1.25);

      const oarBlade = new THREE.BoxGeometry(0.16, 0.035, 1.15);
      oarBlade.rotateX(-1.12);
      oarBlade.rotateZ(-side * 0.35);
      oarBlade.translate(side * 0.95, -0.98, -2.15);

      const oarMesh = new THREE.Mesh(mergePartGeometries([shaft, oarBlade]), woodLight);
      oarPivot.add(oarMesh);
      group.add(oarPivot);
      oars.push({ pivot: oarPivot, side, phase: this.rng() * Math.PI * 2 });
    }

    // 计算初始位置与朝向
    let initX = spec.x ?? 0;
    let initZ = spec.z ?? 0;
    let initYaw = spec.yaw ?? 0;

    if (spec.riverTStart !== undefined) {
      const pt = BIAN_RIVER_CURVE.getPoint(spec.riverTStart);
      const tan = BIAN_RIVER_CURVE.getTangent(spec.riverTStart);
      const perpX = -tan.z;
      const perpZ = tan.x;
      const lat = spec.lateralOffset ?? 0;
      initX = pt.x + perpX * lat;
      initZ = pt.z + perpZ * lat;
      // 逆流西上或顺流朝向
      const dirSign = (spec.riverTEnd ?? spec.riverTStart) >= spec.riverTStart ? 1 : -1;
      initYaw = Math.atan2(tan.x * dirSign, tan.z * dirSign);
    }

    group.position.set(initX, WORLD_BOUNDS.waterY + 0.08, initZ);
    group.rotation.y = initYaw;
    this.parent.add(group);

    // 6. 甲板船工配置（摇橹工、撑篙工、船顶急落桅杆船夫）
    const crewSlots: CrewSlot[] = [];
    const addCrew = (lx: number, ly: number, lz: number, lyaw: number, role: HumanActorSpec['role'], headgear?: HumanActorSpec['headgear']) => {
      const anchor = { x: initX, y: WORLD_BOUNDS.waterY + ly, z: initZ, yaw: initYaw + lyaw };
      crewSlots.push({
        localPos: new THREE.Vector3(lx, ly, lz),
        localYaw: lyaw,
        anchor,
      });
      crowd.addHuman({
        role,
        headgear: headgear ?? 'topknot',
        externalAnchor: anchor,
      });
    };

    // 船尾摇橹船工
    addCrew(0.18, deckY + 0.02, -L * 0.28, Math.PI, 'boat_sculler', 'topknot');

    if (spec.kind === 'rainbowHero') {
      // 虹桥下焦点大船：船头瞭望呼喊者、两侧走舸撑篙船工 4 人、席篷顶上合力扳倒桅杆船工 3 人！
      addCrew(0, deckY + 0.34, L * 0.38, 0, 'bridge_onlooker', 'topknot');
      addCrew(-B * 0.50, deckY + 0.04, L * 0.16, -0.2, 'boat_poler', 'conical');
      addCrew(B * 0.50, deckY + 0.04, L * 0.12, 0.2, 'boat_poler', 'topknot');
      addCrew(-B * 0.50, deckY + 0.04, -L * 0.14, -0.25, 'boat_poler', 'topknot');
      addCrew(B * 0.50, deckY + 0.04, -L * 0.16, 0.25, 'boat_poler', 'conical');
      // 站在拱形席篷顶上仰首扶桅杆的船工
      addCrew(-0.32, deckY + cabinH + 0.26, 0.4, 0.15, 'carter', 'topknot');
      addCrew(0.32, deckY + cabinH + 0.26, -0.2, -0.15, 'carter', 'topknot');
    } else if (!isSkiff) {
      // 普通漕船与客船：船头撑篙工与舱前船员
      addCrew(B * 0.48, deckY + 0.04, L * 0.18, 0.15, 'boat_poler', 'conical');
      if (this.rng() > 0.35) {
        addCrew(-0.22, deckY + 0.18, L * 0.33, 0, 'sleeved', 'futou');
      }
    }

    // 7. 靠岸卸粮跳板（连接船舷与河北岸码头）
    if (spec.hasGangplankToNorth && staticBatcher) {
      const bankZ = initZ - B * 0.5 - 2.6;
      const bankY = groundHeightAt(initX, bankZ);
      const midZ = (initZ - B * 0.45 + bankZ) * 0.5;
      const midY = (WORLD_BOUNDS.waterY + deckY + bankY) * 0.5 + 0.08;
      const plankLen = Math.hypot(bankZ - (initZ - B * 0.45), bankY - (WORLD_BOUNDS.waterY + deckY)) + 0.5;
      const angX = Math.atan2(bankY - (WORLD_BOUNDS.waterY + deckY), -(bankZ - (initZ - B * 0.45)));
      _m.makeRotationX(angX).setPosition(initX, midY, midZ);
      staticBatcher.addBox('woodLight', 0.72, 0.07, plankLen, _m);
    }

    // 8. 若为纤夫曳引逆流客船，生成动态纤绳与岸上弓步纤夫队列！
    let towLine: THREE.Line | undefined;
    let towTrackers: InternalVessel['towTrackers'];
    if (spec.riverTStart !== undefined && spec.kind === 'passengerBoat' && (spec.speedT ?? 0) > 0) {
      towTrackers = [];
      for (let k = 0; k < 5; k++) {
        const anchor = { x: initX, y: 0.2, z: initZ - 8, yaw: initYaw };
        towTrackers.push({ anchor, offset: 5.5 + k * 1.45 });
        crowd.addHuman({
          role: 'tracker',
          headgear: k % 2 === 0 ? 'topknot' : 'conical',
          externalAnchor: anchor,
        });
      }
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ]);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x5c4932 });
      towLine = new THREE.Line(lineGeo, lineMat);
      towLine.frustumCulled = false;
      this.parent.add(towLine);
    }

    this.vessels.push({
      spec,
      group,
      mastPivot,
      rudderPivot,
      oars,
      crewSlots,
      baseX: initX,
      baseZ: initZ,
      baseYaw: initYaw,
      phase: this.rng() * Math.PI * 2,
      towLine,
      towTrackers,
    });
  }

  public update(elapsed: number): void {
    for (let i = 0; i < this.vessels.length; i++) {
      const v = this.vessels[i];
      let x = v.baseX;
      let z = v.baseZ;
      let yaw = v.baseYaw;
      const isMoving = v.spec.riverTStart !== undefined && v.spec.riverTEnd !== undefined && (v.spec.speedT ?? 0) > 0;

      if (isMoving) {
        const t0 = v.spec.riverTStart!;
        const t1 = v.spec.riverTEnd!;
        const span = Math.abs(t1 - t0);
        const raw = ((elapsed * (v.spec.speedT ?? 0.008) + v.phase * 0.1) % (span * 2));
        const ping = raw > span ? span * 2 - raw : raw;
        const forward = raw <= span;
        const curT = t0 + Math.sign(t1 - t0) * ping;

        const pt = BIAN_RIVER_CURVE.getPoint(THREE.MathUtils.clamp(curT, 0.01, 0.99));
        const tan = BIAN_RIVER_CURVE.getTangent(THREE.MathUtils.clamp(curT, 0.01, 0.99));
        const lat = v.spec.lateralOffset ?? 0;
        x = pt.x - tan.z * lat;
        z = pt.z + tan.x * lat;
        const dir = (t1 >= t0 ? 1 : -1) * (forward ? 1 : -1);
        yaw = Math.atan2(tan.x * dir, tan.z * dir);

        // 同步岸上拉纤纤夫队列与绷紧纤绳
        if (v.towTrackers && v.towLine) {
          const dirX = Math.sin(yaw);
          const dirZ = Math.cos(yaw);
          for (const tr of v.towTrackers) {
            const tx = x + dirX * tr.offset + tan.z * 7.6;
            const tz = z + dirZ * tr.offset - tan.x * 7.6;
            tr.anchor.x = tx;
            tr.anchor.z = tz;
            tr.anchor.y = groundHeightAt(tx, tz);
            tr.anchor.yaw = yaw;
          }
          const lead = v.towTrackers[v.towTrackers.length - 1].anchor;
          const posAttr = v.towLine.geometry.attributes.position as THREE.BufferAttribute;
          posAttr.setXYZ(0, x + dirX * 2.2, WORLD_BOUNDS.waterY + 1.65, z + dirZ * 2.2);
          posAttr.setXYZ(1, (x + lead.x) * 0.5, (WORLD_BOUNDS.waterY + 1.65 + lead.y + 0.95) * 0.5 - 0.32, (z + lead.z) * 0.5);
          posAttr.setXYZ(2, lead.x, lead.y + 0.98, lead.z);
          posAttr.needsUpdate = true;
        }
      } else if (v.spec.kind === 'rainbowHero') {
        // 虹桥下焦点大船：在湍急水势中微幅前后推挽挣扎，极富戏剧张力！
        x = v.baseX + Math.sin(elapsed * 0.85) * 0.38;
        z = v.baseZ + Math.cos(elapsed * 0.72) * 0.22;
        yaw = v.baseYaw + Math.sin(elapsed * 0.62) * 0.045;
      }

      // 船身随水波轻微横摇与纵摇
      const roll = Math.sin(elapsed * 1.65 + v.phase) * (v.spec.kind === 'rainbowHero' ? 0.042 : 0.024);
      const pitch = Math.cos(elapsed * 1.32 + v.phase) * 0.018;
      const heave = Math.sin(elapsed * 1.9 + v.phase) * 0.035;

      v.group.position.set(x, WORLD_BOUNDS.waterY + 0.08 + heave, z);
      v.group.rotation.set(pitch, yaw, roll, 'YXZ');
      v.group.updateMatrixWorld();

      // 虹桥下大船：人字桅动态缓慢起伏演示“正在紧急放倒过桥”
      if (v.mastPivot && v.spec.mastState === 'lowering') {
        v.mastPivot.rotation.x = -Math.PI * 0.28 + Math.sin(elapsed * 1.1) * 0.085;
      }

      // 大舵微摆控制航向
      if (v.rudderPivot) {
        v.rudderPivot.rotation.y = Math.sin(elapsed * 1.2 + v.phase) * 0.16;
      }

      // 摇橹动作（水下八字推挽拨水）
      const oarAmp = isMoving || v.spec.kind === 'rainbowHero' || v.spec.kind === 'skiff' ? 0.32 : 0.06;
      for (const oar of v.oars) {
        const ot = elapsed * 2.6 + oar.phase;
        oar.pivot.rotation.y = Math.sin(ot) * oarAmp;
        oar.pivot.rotation.z = Math.cos(ot) * oarAmp * 0.45;
      }

      // 更新船上所有船工的世界锚点
      for (const slot of v.crewSlots) {
        _v.copy(slot.localPos).applyMatrix4(v.group.matrixWorld);
        slot.anchor.x = _v.x;
        slot.anchor.y = _v.y;
        slot.anchor.z = _v.z;
        slot.anchor.yaw = yaw + slot.localYaw;
      }
    }
  }
}
