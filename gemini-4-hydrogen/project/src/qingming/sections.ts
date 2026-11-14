import {
  addBareTree,
  addCityGate,
  addFlatWoodBridge,
  addMarketStall,
  addOldWillow,
  addRainbowBridge,
  addReedClump,
  addRiverPilings,
  addThatchedCottage,
  addTiledHouse,
  addWinePavilion,
  ArchContext,
  rainbowBridgePoint,
} from './architecture';
import { AnimalSpec, CartSpec, HumanSpec } from './actors';
import { BoatSpec } from './boats';
import {
  creekCenterZ,
  groundHeightAt,
  LandmarkLabel,
  mainRoadZ,
  moatCenterX,
  riverCenterZ,
  riverHalfWidth,
  WATER_LEVEL,
} from './world';

export interface ScenePopulation {
  humans: HumanSpec[];
  animals: AnimalSpec[];
  carts: CartSpec[];
  boats: BoatSpec[];
  landmarks: LandmarkLabel[];
}

function seededRand(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function addCourtyardFence(
  arch: ArchContext,
  x: number,
  z: number,
  length: number,
  yaw = 0
): void {
  const posts = Math.max(3, Math.floor(length / 1.4));
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  for (let i = 0; i < posts; i++) {
    const off = (i / (posts - 1) - 0.5) * length;
    const px = x + off * cos;
    const pz = z + off * sin;
    const py = groundHeightAt(px, pz);
    arch.batcher.add(arch.prims.cylinder, arch.mats.bambooMat, px, py + 0.45, pz, 0, 0, 0, 0.08, 0.95, 0.08);
  }
  const cy = groundHeightAt(x, z);
  arch.batcher.add(arch.prims.box, arch.mats.bambooMat, x, cy + 0.65, z, 0, -yaw, 0, length, 0.07, 0.06);
  arch.batcher.add(arch.prims.box, arch.mats.bambooMat, x, cy + 0.35, z, 0, -yaw, 0, length, 0.07, 0.06);
}

function addHaystack(arch: ArchContext, x: number, z: number, scale = 1): void {
  const gy = groundHeightAt(x, z);
  arch.batcher.add(arch.prims.cylinder, arch.mats.thatch, x, gy + 0.48 * scale, z, 0, 0, 0, 1.45 * scale, 0.96 * scale, 1.45 * scale);
  arch.batcher.add(arch.prims.cone, arch.mats.thatch, x, gy + 1.32 * scale, z, 0, 0, 0, 1.62 * scale, 0.85 * scale, 1.62 * scale);
}

export function buildAllSections(arch: ArchContext): ScenePopulation {
  const rand = seededRand(1105);
  const humans: HumanSpec[] = [];
  const animals: AnimalSpec[] = [];
  const carts: CartSpec[] = [];
  const boats: BoatSpec[] = [];
  const landmarks: LandmarkLabel[] = [];

  const robeColors = [0x9c896c, 0x56626e, 0x8a6446, 0xa89268, 0x764f3c, 0x6a7258, 0xb8a37e, 0x4c453c];
  const pickColor = () => robeColors[Math.floor(rand() * robeColors.length)];

  // =========================================================================
  // 第一段：郊野春色 (x = +240 -> +115, u = 0.00 -> 0.26)
  // =========================================================================

  // 1. 卷首溪桥与枯枝荒坡 (x = 236..210)
  addFlatWoodBridge(arch, 220, creekCenterZ(220), 9.5, 2.8, 0.28, 0.12);
  landmarks.push({ id: 'creek_bridge', name: '卷首溪桥', x: 220, y: 3.0, z: creekCenterZ(220) });

  // Gnarled bare early-spring trees on eastern slopes
  [
    [234, -8, 7.2], [229, -16, 8.4], [224, 4, 6.8], [218, -12, 7.8],
    [212, -22, 8.8], [206, 8, 6.4], [202, -14, 7.5], [195, -24, 8.2],
  ].forEach(([tx, tz, th], i) => addBareTree(arch, tx, tz, th, i + 1));

  // 驮炭驴队 (5 pack donkeys + 2 drivers in bamboo hats walking from right toward village)
  landmarks.push({ id: 'donkey_caravan', name: '驮炭驴队', x: 222, y: 2.8, z: 6 });
  for (let i = 0; i < 5; i++) {
    const dx = 232 - i * 3.4;
    const dz = mainRoadZ(dx) + (i % 2 === 0 ? -0.5 : 0.6);
    animals.push({
      species: 'donkey',
      x: dx,
      z: dz,
      pathEndX: dx - 18,
      pathEndZ: mainRoadZ(dx - 18) + (i % 2 === 0 ? -0.4 : 0.5),
      speed: 0.72,
      hasPack: true,
      phase: i * 0.4,
    });
  }
  humans.push(
    { x: 234, z: mainRoadZ(234), role: 'walk', head: 'douli', prop: 'bundle', pathEndX: 216, pathEndZ: mainRoadZ(216), speed: 0.72 },
    { x: 218, z: mainRoadZ(218) + 0.8, role: 'walk', head: 'douli', prop: 'none', pathEndX: 200, pathEndZ: mainRoadZ(200) + 0.8, speed: 0.72 }
  );

  // Creek reed clumps & wooden bank pilings at 卷首
  for (let rx = 236; rx >= 184; rx -= 8) {
    const cz = creekCenterZ(rx);
    addReedClump(arch, rx, cz + 4.4, rx + 5);
    if (rx % 16 === 0) addReedClump(arch, rx - 3, cz - 4.2, rx + 11);
  }

  // 2. 茅草农舍村落与畜禽 (x = 212..182)
  landmarks.push({ id: 'village', name: '茅草农舍', x: 198, y: 4.5, z: -8 });
  addThatchedCottage(arch, 206, -9, 0.12, 5.4, 4.0, true);
  addThatchedCottage(arch, 198, -11, -0.08, 6.0, 4.2, false);
  addThatchedCottage(arch, 190, -7, 0.18, 4.8, 3.8, true);
  addThatchedCottage(arch, 184, -14, -0.1, 5.2, 4.0, false);
  addCourtyardFence(arch, 202, -5.8, 7.5, 0.08);
  addCourtyardFence(arch, 190, -4.2, 6.2, -0.1);
  addHaystack(arch, 211, -11.5, 1.05);
  addHaystack(arch, 209.5, -13.2, 0.82);
  addHaystack(arch, 181, -10.5, 0.95);
  // Village trees & animals (pigs, dogs, ox, villagers)
  [
    [203, -3, 7.6], [193, -2, 8.2], [186, -4, 7.4], [178, -16, 8.0], [172, -8, 7.2],
  ].forEach(([tx, tz, th], i) => addBareTree(arch, tx, tz, th, i + 20));
  animals.push(
    { species: 'pig', x: 201, z: -4, pathEndX: 197, pathEndZ: -3, speed: 0.45 },
    { species: 'pig', x: 199, z: -3.2, pathEndX: 203, pathEndZ: -4.2, speed: 0.42 },
    { species: 'pig', x: 195, z: -5.2, pathEndX: 192, pathEndZ: -4.4, speed: 0.4 },
    { species: 'dog', x: 191, z: -2.5, pathEndX: 187, pathEndZ: -1.5, speed: 0.8 },
    { species: 'dog', x: 204, z: -2.0, pathEndX: 200, pathEndZ: -1.2, speed: 0.75 },
    { species: 'ox', x: 186, z: -10.5, pathEndX: 182, pathEndZ: -11.5, speed: 0.35 }
  );
  for (let i = 0; i < 8; i++) {
    const hx = 205 - i * 3.1;
    const hz = -3 + (i % 3) * 1.8;
    humans.push({
      x: hx,
      z: hz,
      role: i % 3 === 0 ? 'porter' : 'walk',
      head: i % 2 === 0 ? 'headwrap' : 'bun',
      prop: i % 3 === 0 ? 'pole' : 'basket',
      pathEndX: hx - 8,
      pathEndZ: hz + 1.5,
      speed: 0.7,
      robeColor: pickColor(),
    });
  }

  // 3. 粗矮歪斜老柳林 (x = 180..158)
  landmarks.push({ id: 'willows', name: '老柳村径', x: 170, y: 5.5, z: 12 });
  [
    [180, 14, 1.25], [175, 19, 1.38], [169, 13, 1.18], [163, 21, 1.32],
    [157, 15, 1.1], [172, -12, 1.05], [164, -18, 1.15],
  ].forEach(([wx, wz, ws], i) => addOldWillow(arch, wx, wz, ws, i + 1));

  // 4. 踏青扫墓归来轿马仪仗 & 王家小院 (x = 158..122)
  landmarks.push({ id: 'sedan_party', name: '踏青轿队', x: 146, y: 3.5, z: 5 });
  addTiledHouse(arch, { x: 148, z: -13, yaw: 0.08, w: 7.4, d: 4.8, h: 3.1, hasSmoke: true });
  addThatchedCottage(arch, 138, -11, -0.15, 5.0, 3.8, false);
  addTiledHouse(arch, { x: 132, z: 19, yaw: Math.PI - 0.12, w: 5.6, d: 4.0, h: 2.7, openFront: true, signText: '茶肆' });
  addOldWillow(arch, 140, 16, 1.15, 21);
  addOldWillow(arch, 128, 12, 1.22, 22);
  addBareTree(arch, 154, -18, 8.2, 41);
  addBareTree(arch, 130, -18, 7.6, 42);

  // Returning Qingming sedan chair (decorated with willow sprigs!) + 4 bearers + horse rider + attendants
  const sedX = 148;
  const sedZ = mainRoadZ(sedX);
  carts.push({
    kind: 'sedan',
    x: sedX,
    z: sedZ,
    pathEndX: sedX - 18,
    pathEndZ: mainRoadZ(sedX - 18),
    speed: 0.75,
    willowSprig: true,
    phase: 0.2,
  });
  for (const [ox, oz] of [[1.4, -0.5], [1.4, 0.5], [-1.4, -0.5], [-1.4, 0.5]]) {
    humans.push({
      x: sedX + ox,
      z: sedZ + oz,
      role: 'sedan_bearer',
      head: 'headwrap',
      pathEndX: sedX - 18 + ox,
      pathEndZ: mainRoadZ(sedX - 18) + oz,
      speed: 0.75,
      phase: 0.2,
      robeColor: 0x5c6670,
    });
  }
  // Gentleman on horseback behind sedan + attendants
  animals.push({
    species: 'horse',
    x: sedX + 4.2,
    z: sedZ + 0.3,
    pathEndX: sedX - 13.8,
    pathEndZ: mainRoadZ(sedX - 13.8) + 0.3,
    speed: 0.75,
    hasPack: true,
    phase: 0.2,
  });
  humans.push({
    x: sedX + 4.2,
    z: sedZ + 0.3,
    role: 'rider',
    head: 'futou',
    pathEndX: sedX - 13.8,
    pathEndZ: mainRoadZ(sedX - 13.8) + 0.3,
    speed: 0.75,
    phase: 0.2,
    robeColor: 0x764f3c,
  });
  for (let a = 0; a < 10; a++) {
    const px = 158 - a * 3.8;
    const pz = mainRoadZ(px) + (a % 2 === 0 ? -1.1 : 1.1);
    humans.push({
      x: px,
      z: pz,
      role: a % 3 === 0 ? 'porter' : 'walk',
      head: a % 2 === 0 ? 'douli' : 'bun',
      prop: a % 3 === 0 ? 'pole' : 'bundle',
      pathEndX: px - 12,
      pathEndZ: mainRoadZ(px - 12) + (a % 2 === 0 ? -1.1 : 1.1),
      speed: 0.78,
      robeColor: pickColor(),
    });
  }
  // Seated tea drinkers at roadside shelter (x = 132, z = 19)
  for (let d = 0; d < 4; d++) {
    humans.push({
      x: 130.5 + d * 1.0,
      z: 16.5 + (d % 2) * 0.7,
      yaw: d % 2 === 0 ? 0.2 : Math.PI - 0.2,
      role: 'seated_tea',
      head: d % 2 === 0 ? 'bun' : 'douli',
      prop: 'cup',
      robeColor: pickColor(),
    });
  }

  // =========================================================================
  // 第二段：汴河虹桥 (x = +115 -> -38, u = 0.26 -> 0.58)
  // =========================================================================

  // 1. 汴河码头与北岸临河铺面 (x = 115..45)
  landmarks.push({ id: 'wharf', name: '汴河码头', x: 96, y: 4.5, z: -2 });
  landmarks.push({ id: 'paper_horse', name: '王家纸马', x: 102, y: 5.0, z: -12 });

  // North bank stilt houses & granaries (north of riverCenterZ)
  [
    { x: 108, zOff: -16.5, w: 6.8, d: 4.6, sign: '王家纸马', open: true, stilts: true },
    { x: 98, zOff: -16.0, w: 6.2, d: 4.4, sign: '茶肆', open: true, stilts: true },
    { x: 86, zOff: -16.5, w: 7.4, d: 4.8, sign: '面', open: true, stilts: false },
    { x: 64, zOff: -17.0, w: 7.2, d: 4.6, sign: '解库', open: true, stilts: true },
    { x: 52, zOff: -17.5, w: 6.5, d: 4.5, sign: '香饮', open: true, stilts: false },
  ].forEach((b) => {
    const bz = riverCenterZ(b.x) + b.zOff;
    addTiledHouse(arch, {
      x: b.x,
      z: bz,
      yaw: -0.25,
      w: b.w,
      d: b.d,
      openFront: b.open,
      stilts: b.stilts,
      signText: b.sign,
      hasSmoke: b.sign === '面',
    });
  });

  // South bank willows, riverside pilings, reeds & mid-ground dwellings
  for (let wx = 122; wx >= -78; wx -= 14) {
    const rz = riverCenterZ(wx);
    const rw = riverHalfWidth(wx);
    if (rw < 1.5) continue;
    if (wx >= 28 || wx <= -14) {
      addRiverPilings(arch, wx, rz - rw - 0.35, 6, -0.25);
      addRiverPilings(arch, wx - 5, rz + rw + 0.35, 5, -0.25);
    }
    if (wx % 28 === 0) {
      addReedClump(arch, wx + 4, rz + rw + 0.6, Math.abs(wx) + 3);
      addReedClump(arch, wx - 4, rz - rw - 0.6, Math.abs(wx) + 7);
    }
    if (wx >= 30) {
      addOldWillow(arch, wx, rz + rw + 3.2, 1.1 + (wx % 3) * 0.08, Math.abs(wx));
      if (wx % 28 === 0) addBareTree(arch, wx - 5, rz - rw - 6.5, 7.6, Math.abs(wx) + 9);
    }
  }
  // Mid-ground north bank granary & riverside cottages behind Rainbow Bridge so skyline feels layered
  addTiledHouse(arch, { x: 26, z: -26, yaw: 0.14, w: 7.4, d: 4.8, openFront: false, hasSmoke: true });
  addThatchedCottage(arch, 14, -29, -0.1, 5.2, 3.8, false);
  addTiledHouse(arch, { x: -24, z: -30, yaw: 0.2, w: 6.8, d: 4.4, openFront: false });
  addOldWillow(arch, 20, -24, 1.15, 311);
  addOldWillow(arch, -6, -24, 1.12, 312);
  addBareTree(arch, 34, -28, 7.8, 313);
  addBareTree(arch, -18, -32, 8.0, 314);
  // Grain sacks stacked on north wharf (x = 96..70)
  for (let s = 0; s < 5; s++) {
    const sx = 96 - s * 5.5;
    const sz = riverCenterZ(sx) - riverHalfWidth(sx) - 2.2;
    const sy = groundHeightAt(sx, sz);
    arch.batcher.add(arch.prims.box, arch.mats.bambooMat, sx, sy + 0.28, sz, 0, 0.2, 0, 0.9, 0.55, 0.6);
    arch.batcher.add(arch.prims.box, arch.mats.bambooMat, sx + 0.35, sy + 0.68, sz, 0, -0.1, 0, 0.72, 0.42, 0.52);
  }

  // Boat Trackers (纤夫拉纤) straining along north riverbank (x = 82..58)
  landmarks.push({ id: 'trackers', name: '纤夫拉纤', x: 72, y: 3.2, z: riverCenterZ(72) - 13 });
  for (let i = 0; i < 6; i++) {
    const tx = 79 - i * 2.2;
    const tz = riverCenterZ(tx) - riverHalfWidth(tx) - 2.6;
    humans.push({
      x: tx,
      z: tz,
      role: 'tracker',
      head: 'headwrap',
      pathEndX: tx - 10,
      pathEndZ: riverCenterZ(tx - 10) - riverHalfWidth(tx - 10) - 2.6,
      speed: 0.45,
      phase: i * 0.28,
      robeColor: 0x8a785c,
    });
  }

  // Unloading grain porters & riverside pedestrians along Bian River (x = 112..25)
  for (let i = 0; i < 28; i++) {
    const px = 110 - i * 3.1;
    const onSouth = i % 2 === 0;
    const pz = onSouth
      ? mainRoadZ(px) + (rand() - 0.5) * 2.5
      : riverCenterZ(px) - riverHalfWidth(px) - 2.8;
    humans.push({
      x: px,
      z: pz,
      role: i % 3 === 0 ? 'porter' : 'walk',
      head: i % 4 === 0 ? 'douli' : i % 3 === 0 ? 'headwrap' : 'bun',
      prop: i % 3 === 0 ? 'pole' : i % 5 === 0 ? 'bundle' : 'none',
      pathEndX: px - 10,
      pathEndZ: onSouth ? mainRoadZ(px - 10) : riverCenterZ(px - 10) - riverHalfWidth(px - 10) - 2.8,
      speed: 0.78 + rand() * 0.25,
      robeColor: pickColor(),
    });
  }

  // 2. 汴河漕船船队 (17 boats total along the river — ZERO sails!)
  landmarks.push({ id: 'cargo_fleet', name: '汴河漕船', x: 52, y: 4.5, z: riverCenterZ(52) });
  const boatList: BoatSpec[] = [
    // Downstream moored barges (x = 122..84)
    { x: 118, zOffset: 1.5, yaw: 1.38, kind: 'barge', mastState: 'raised' },
    { x: 103, zOffset: -4.8, yaw: 1.44, kind: 'barge', mastState: 'raised' },
    { x: 93, zOffset: 3.6, yaw: 1.32, kind: 'barge', mastState: 'lowered' },
    { x: 82, zOffset: -5.4, yaw: 1.48, kind: 'barge', mastState: 'raised' },
    // Mid-river moored cluster & ferry (x = 68..35)
    { x: 68, zOffset: -4.2, yaw: 1.4, kind: 'barge', mastState: 'raised' },
    { x: 56, zOffset: -5.5, yaw: 1.42, kind: 'barge', mastState: 'raised' },
    { x: 47, zOffset: 4.4, yaw: 1.25, kind: 'ferry', mastState: 'none', isMoving: true, driftSpeed: 0.4, driftRange: 5 },
    { x: 35, zOffset: -4.0, yaw: 1.36, kind: 'barge', mastState: 'raised' },
    { x: 32, zOffset: 5.2, yaw: 1.28, kind: 'skiff', mastState: 'none', isMoving: true, driftSpeed: 0.55, driftRange: 4 },
    // DRAMATIC BRIDGE-PASSING BARGE actively lowering A-frame mast (放倒人字桅过虹桥!)
    { x: 14, zOffset: 0.8, yaw: 1.28, kind: 'barge', length: 14.5, beam: 3.6, mastState: 'lowering', isMoving: true, driftSpeed: 0.25, driftRange: 2.8 },
    // Upstream barges past Rainbow Bridge (x = -12..-85)
    { x: -12, zOffset: 2.0, yaw: 1.25, kind: 'barge', mastState: 'lowered' },
    { x: -24, zOffset: -4.2, yaw: 1.35, kind: 'barge', mastState: 'raised' },
    { x: -34, zOffset: 3.5, yaw: 1.3, kind: 'ferry', mastState: 'none', isMoving: true, driftSpeed: 0.36, driftRange: 4.5 },
    { x: -46, zOffset: -3.2, yaw: 1.34, kind: 'barge', mastState: 'raised' },
    { x: -58, zOffset: 2.4, yaw: 1.28, kind: 'barge', mastState: 'lowered' },
    { x: -72, zOffset: -2.0, yaw: 1.38, kind: 'barge', mastState: 'raised' },
    { x: -86, zOffset: 1.2, yaw: 1.32, kind: 'skiff', mastState: 'none' },
  ];
  boats.push(...boatList);

  // Crew (船工) on every boat: scullers & pole-men
  boatList.forEach((b, bi) => {
    const bz = riverCenterZ(b.x) + (b.zOffset ?? 0);
    const count = b.kind === 'barge' ? 3 : 2;
    for (let c = 0; c < count; c++) {
      humans.push({
        x: b.x + (c - 1) * 2.2,
        z: bz + (c % 2 === 0 ? -0.6 : 0.6),
        yOverride: WATER_LEVEL + 0.92,
        yaw: (b.yaw ?? 1.35) + (c === 0 ? 0.3 : -0.2),
        role: c === 0 ? 'boat_scull' : 'boat_pole',
        head: 'headwrap',
        prop: c === 0 ? 'none' : 'boatpole',
        phase: bi + c * 0.7,
        robeColor: 0x87775d,
      });
    }
  });

  // 3. 虹桥 (Rainbow Bridge at x = -4..+13) & Crowds on the Arch!
  addRainbowBridge(arch);
  landmarks.push({ id: 'rainbow_bridge', name: '虹桥', x: 4.5, y: 7.4, z: -2 });
  landmarks.push({ id: 'lowering_mast', name: '过桥漕船', x: 14, y: 4.2, z: riverCenterZ(14) + 1.5 });

  // ~38 animated people crowded on Rainbow Bridge: walkers, porters, riders, and railing onlookers!
  for (let i = 0; i < 24; i++) {
    const t = 0.08 + (i / 23) * 0.84;
    const pt = rainbowBridgePoint(t);
    const sideOff = ((i % 3) - 1) * 1.1;
    const nx = Math.cos(pt.angle) * sideOff;
    const nz = -Math.sin(pt.angle) * sideOff;
    const isOnlooker = i % 3 !== 1 && t > 0.22 && t < 0.78;
    humans.push({
      x: pt.x + nx,
      z: pt.z + nz,
      yOverride: pt.y + 0.06,
      yaw: isOnlooker ? pt.angle + (sideOff > 0 ? Math.PI / 2 : -Math.PI / 2) : pt.angle + (i % 2 === 0 ? 0 : Math.PI),
      role: isOnlooker ? 'bridge_watch' : i % 4 === 0 ? 'porter' : 'walk',
      head: i % 5 === 0 ? 'futou' : i % 3 === 0 ? 'douli' : 'bun',
      prop: !isOnlooker && i % 4 === 0 ? 'pole' : 'none',
      robeColor: pickColor(),
    });
  }

  // 4. 桥头市集、十千脚店与彩楼欢门 (x = +12 -> -38)
  landmarks.push({ id: 'shiqian_tavern', name: '十千脚店', x: -16, y: 8.6, z: 21 });
  landmarks.push({ id: 'cailou', name: '彩楼欢门', x: -12, y: 9.2, z: 16 });

  addWinePavilion(arch, {
    x: -17,
    z: 22,
    yaw: Math.PI - 0.16,
    w: 9.8,
    d: 5.8,
    signText: '十千脚店',
    withCailou: true,
  });
  // Surrounding south-bank & north-bank shops around Rainbow Bridge approach
  addTiledHouse(arch, { x: 24, z: 22, yaw: Math.PI + 0.1, w: 6.4, d: 4.5, openFront: true, signText: '茶肆', hasSmoke: true });
  addTiledHouse(arch, { x: 14, z: 24, yaw: Math.PI + 0.05, w: 6.0, d: 4.4, openFront: true });
  addTiledHouse(arch, { x: -29, z: 22, yaw: Math.PI - 0.08, w: 7.2, d: 4.6, openFront: true, signText: '食铺', hasSmoke: true });
  addTiledHouse(arch, { x: -37, z: 20, yaw: Math.PI - 0.05, w: 6.2, d: 4.2, openFront: true });
  // North bank opposite Rainbow Bridge
  addTiledHouse(arch, { x: 2, z: -22, yaw: 0.18, w: 7.0, d: 4.6, openFront: true, signText: '茶肆', stilts: true });
  addTiledHouse(arch, { x: -12, z: -26, yaw: 0.22, w: 6.4, d: 4.4, openFront: true });

  // Market stalls & large umbrellas crowding the Rainbow Bridge south square
  [
    [-2, 16.5, 'ochre'], [-7, 17.2, 'vermilion'], [4, 17.5, 'indigo'],
    [-23, 15.8, 'ochre'], [-27, 16.5, 'ochre'], [10, 18.2, 'vermilion'],
  ].forEach(([sx, sz, col]) => {
    addMarketStall(arch, sx as number, sz as number, 0.1, true, col as 'ochre' | 'vermilion' | 'indigo');
    humans.push({
      x: (sx as number) + 0.4,
      z: (sz as number) - 0.9,
      yaw: 0.2,
      role: 'vendor',
      head: 'headwrap',
      robeColor: pickColor(),
    });
  });

  // Diners seated at 十千脚店 & busy market crowd
  for (let i = 0; i < 6; i++) {
    humans.push({
      x: -20 + i * 1.2,
      z: 18.2 + (i % 2) * 0.9,
      yaw: i % 2 === 0 ? 0.1 : Math.PI - 0.1,
      role: 'seated_tea',
      head: i % 3 === 0 ? 'futou' : 'bun',
      prop: 'cup',
      robeColor: pickColor(),
    });
  }
  for (let i = 0; i < 36; i++) {
    const px = 18 - i * 1.55;
    const pz = mainRoadZ(px) + (rand() - 0.5) * 4.5;
    humans.push({
      x: px,
      z: pz,
      role: i % 4 === 0 ? 'porter' : 'walk',
      head: i % 5 === 0 ? 'futou' : i % 3 === 0 ? 'douli' : 'bun',
      prop: i % 4 === 0 ? 'pole' : i % 6 === 0 ? 'basket' : 'none',
      pathEndX: px + (i % 2 === 0 ? -9 : 9),
      pathEndZ: pz + (rand() - 0.5) * 2.5,
      speed: 0.65 + rand() * 0.3,
      robeColor: pickColor(),
    });
  }

  // =========================================================================
  // 第三段：城门街市 (x = -38 -> -240, u = 0.58 -> 1.00)
  // =========================================================================

  // 1. 郊区官道、久住王员外家与车队 (x = -40 -> -112)
  landmarks.push({ id: 'wang_inn', name: '久住王员外家', x: -84, y: 5.5, z: -4 });
  addTiledHouse(arch, { x: -50, z: 22, yaw: Math.PI, w: 6.8, d: 4.6, openFront: true });
  addTiledHouse(arch, { x: -64, z: 24, yaw: Math.PI, w: 7.2, d: 4.8, openFront: true, signText: '酒' });
  addTiledHouse(arch, { x: -78, z: 22, yaw: Math.PI, w: 6.2, d: 4.4, openFront: true });
  // Famous inn courtyard on north side of suburban road
  addTiledHouse(arch, { x: -84, z: -5, yaw: 0.08, w: 9.2, d: 5.2, h: 3.3, openFront: true, signText: '久住王员外家', hasSmoke: true });
  addTiledHouse(arch, { x: -96, z: -7, yaw: 0.08, w: 6.4, d: 4.4, openFront: true });
  addTiledHouse(arch, { x: -102, z: 20, yaw: Math.PI, w: 6.6, d: 4.4, openFront: true, signText: '香饮' });

  [
    [-46, 15, 1.15], [-60, -8, 1.2], [-72, 16, 1.1], [-92, 18, 1.22], [-108, -10, 1.15],
  ].forEach(([wx, wz, ws], i) => addOldWillow(arch, wx, wz, ws, i + 40));
  [
    [-55, -14, 7.6], [-70, -16, 8.2], [-88, -18, 7.8], [-105, -20, 8.0],
  ].forEach(([tx, tz, th], i) => addBareTree(arch, tx, tz, th, i + 60));

  // Ox-carts (席篷大牛车), Wheelbarrows (独轮车) & Pack Donkeys along suburban avenue
  for (let c = 0; c < 4; c++) {
    const cx = -48 - c * 18;
    const cz = mainRoadZ(cx) + (c % 2 === 0 ? -0.9 : 1.0);
    const endX = cx - 18;
    const endZ = mainRoadZ(endX) + (c % 2 === 0 ? -0.9 : 1.0);
    carts.push({ kind: 'oxcart', x: cx, z: cz, pathEndX: endX, pathEndZ: endZ, speed: 0.58, phase: c * 0.6 });
    animals.push({ species: 'ox', x: cx - 2.3, z: cz, pathEndX: endX - 2.3, pathEndZ: endZ, speed: 0.58, phase: c * 0.6 });
    humans.push({
      x: cx - 1.4,
      z: cz + 1.1,
      role: 'driver',
      head: 'douli',
      pathEndX: endX - 1.4,
      pathEndZ: endZ + 1.1,
      speed: 0.58,
      phase: c * 0.6,
      robeColor: 0x7a654a,
    });
  }
  for (let w = 0; w < 5; w++) {
    const wx = -36 - w * 18;
    const wz = mainRoadZ(wx) + (w % 2 === 0 ? 1.4 : -1.5);
    const endX = wx - 16;
    const endZ = mainRoadZ(endX) + (w % 2 === 0 ? 1.4 : -1.5);
    carts.push({ kind: 'wheelbarrow', x: wx, z: wz, pathEndX: endX, pathEndZ: endZ, speed: 0.72, phase: w * 0.8 });
    humans.push({
      x: wx + 1.1,
      z: wz,
      role: 'driver',
      head: 'headwrap',
      pathEndX: endX + 1.1,
      pathEndZ: endZ,
      speed: 0.72,
      phase: w * 0.8,
      robeColor: 0x625341,
    });
  }
  // Extra suburban pack donkeys & horse riders
  for (let d = 0; d < 3; d++) {
    const dx = -56 - d * 22;
    const dz = mainRoadZ(dx) + 0.4;
    animals.push({ species: 'donkey', x: dx, z: dz, pathEndX: dx - 16, pathEndZ: mainRoadZ(dx - 16) + 0.4, speed: 0.74, hasPack: true, phase: d * 0.5 });
  }
  animals.push({ species: 'horse', x: -72, z: mainRoadZ(-72) - 0.5, pathEndX: -94, pathEndZ: mainRoadZ(-94) - 0.5, speed: 0.86, hasPack: true });
  humans.push({ x: -72, z: mainRoadZ(-72) - 0.5, role: 'rider', head: 'futou', pathEndX: -94, pathEndZ: mainRoadZ(-94) - 0.5, speed: 0.86, robeColor: 0x56626e });
  addReedClump(arch, moatCenterX(18) + 4.5, 18, 501);
  addReedClump(arch, moatCenterX(-6) - 4.5, -6, 502);

  // 2. 护城河桥 (Moat Bridge at x = -121) & 汴京城门城楼 (City Gate at x = -148)
  const moatBridgeZ = mainRoadZ(-121);
  addFlatWoodBridge(arch, moatCenterX(moatBridgeZ), moatBridgeZ, 12.5, 4.6, -0.15, 0.35);
  landmarks.push({ id: 'moat_bridge', name: '护城河桥', x: moatCenterX(moatBridgeZ), y: 3.4, z: moatBridgeZ });
  // Spectators leaning on moat bridge railings
  for (let i = 0; i < 8; i++) {
    const mx = moatCenterX(moatBridgeZ) - 4 + i * 1.15;
    humans.push({
      x: mx,
      z: moatBridgeZ + (i % 2 === 0 ? 1.8 : -1.8),
      yOverride: 0.42,
      yaw: i % 2 === 0 ? 0 : Math.PI,
      role: 'bridge_watch',
      head: i % 3 === 0 ? 'futou' : 'bun',
      robeColor: pickColor(),
    });
  }

  addCityGate(arch, -148, 6, -0.22);
  landmarks.push({ id: 'city_gate', name: '汴京城门', x: -148, y: 14.5, z: 6 });

  // Willows flanking the City Gate outside and inside
  [
    [-136, 18, 1.25], [-134, -8, 1.2], [-156, 20, 1.2], [-158, -10, 1.18], [-140, -24, 1.15],
  ].forEach(([wx, wz, ws], i) => addOldWillow(arch, wx, wz, ws, i + 70));

  // Camel Caravan (商旅驼队) passing near/through the City Gate!
  landmarks.push({ id: 'camels', name: '商旅驼队', x: -138, y: 3.5, z: 8 });
  for (let c = 0; c < 4; c++) {
    const cx = -132 - c * 3.8;
    const cz = mainRoadZ(cx) + (c % 2 === 0 ? -0.4 : 0.4);
    animals.push({
      species: 'camel',
      x: cx,
      z: cz,
      pathEndX: cx - 26,
      pathEndZ: mainRoadZ(cx - 26),
      speed: 0.62,
      hasPack: true,
      phase: c * 0.5,
    });
  }
  humans.push({
    x: -130,
    z: mainRoadZ(-130),
    role: 'walk',
    head: 'headwrap',
    pathEndX: -156,
    pathEndZ: mainRoadZ(-156),
    speed: 0.62,
    robeColor: 0x6f553c,
  });

  // Crowds outside & pouring through Bianjing Gate
  for (let i = 0; i < 34; i++) {
    const px = -108 - i * 1.45;
    const pz = mainRoadZ(px) + (rand() - 0.5) * 3.6;
    humans.push({
      x: px,
      z: pz,
      role: i % 4 === 0 ? 'porter' : 'walk',
      head: i % 5 === 0 ? 'futou' : i % 3 === 0 ? 'douli' : 'bun',
      prop: i % 4 === 0 ? 'pole' : i % 7 === 0 ? 'bundle' : 'none',
      pathEndX: px - 10,
      pathEndZ: mainRoadZ(px - 10) + (rand() - 0.5) * 2.5,
      speed: 0.72 + rand() * 0.25,
      robeColor: pickColor(),
    });
  }

  // 3. 城内大街、十字街口与孙羊正店 (x = -158 -> -202)
  landmarks.push({ id: 'crossroads', name: '十字街口', x: -182, y: 4.5, z: 6 });
  landmarks.push({ id: 'sunyang_tavern', name: '孙羊正店', x: -172, y: 10.2, z: -6 });

  // Tax station inside gate
  addTiledHouse(arch, { x: -158, z: -4, yaw: 0.05, w: 6.4, d: 4.4, openFront: true, signText: '税务所' });
  // Grand Sunyang Zhengdian (孙羊正店) with ornate 彩楼欢门 facing the avenue & crossroads!
  addWinePavilion(arch, {
    x: -172,
    z: -7,
    yaw: 0.0,
    w: 11.4,
    d: 6.6,
    signText: '孙羊正店',
    withCailou: true,
  });

  // North-South crossroads shopfronts (十字街口两侧商铺)
  addTiledHouse(arch, { x: -192, z: -6, yaw: 0.0, w: 7.4, d: 4.8, openFront: true, signText: '刘家上色沉檀拣香', hasSmoke: true });
  addTiledHouse(arch, { x: -189, z: -18, yaw: Math.PI / 2, w: 6.4, d: 4.2, openFront: true });
  addTiledHouse(arch, { x: -175, z: -19, yaw: -Math.PI / 2, w: 6.4, d: 4.2, openFront: true });
  // Foreground south-side urban shops
  addTiledHouse(arch, { x: -164, z: 20, yaw: Math.PI, w: 7.6, d: 4.8, openFront: true, signText: '绸缎庄' });
  addTiledHouse(arch, { x: -175, z: 21, yaw: Math.PI, w: 6.6, d: 4.6, openFront: true, signText: '茶肆' });
  addTiledHouse(arch, { x: -193, z: 21, yaw: Math.PI, w: 7.2, d: 4.6, openFront: true, signText: '解库' });

  // Urban market umbrellas & stalls at 十字街口
  [
    [-168, 1.5, 'vermilion'], [-176, 1.8, 'ochre'], [-188, 12.2, 'indigo'], [-194, 1.6, 'ochre'],
  ].forEach(([sx, sz, col]) => {
    addMarketStall(arch, sx as number, sz as number, 0, true, col as 'ochre' | 'vermilion' | 'indigo');
    humans.push({ x: (sx as number) - 0.3, z: (sz as number) - 0.8, role: 'vendor', head: 'bun', robeColor: pickColor() });
  });

  // Two sedan chairs & horses meeting near 十字街口
  carts.push({ kind: 'sedan', x: -179, z: 8.5, yaw: Math.PI / 2, pathEndX: -168, pathEndZ: 8.5, speed: 0.68 });
  for (const [ox, oz] of [[1.4, -0.5], [1.4, 0.5], [-1.4, -0.5], [-1.4, 0.5]]) {
    humans.push({
      x: -179 + ox,
      z: 8.5 + oz,
      role: 'sedan_bearer',
      head: 'headwrap',
      pathEndX: -168 + ox,
      pathEndZ: 8.5 + oz,
      speed: 0.68,
      robeColor: 0x45515e,
    });
  }
  carts.push({ kind: 'wheelbarrow', x: -183, z: -2, yaw: 0, pathEndX: -183, pathEndZ: 16, speed: 0.65 });
  humans.push({ x: -183, z: -3.1, role: 'driver', head: 'headwrap', pathEndX: -183, pathEndZ: 14.9, speed: 0.65, robeColor: 0x76503c });

  // Seated guests inside 孙羊正店
  for (let i = 0; i < 6; i++) {
    humans.push({
      x: -176 + i * 1.4,
      z: -3.0,
      yaw: i % 2 === 0 ? 0.3 : -0.3,
      role: 'seated_tea',
      head: i % 2 === 0 ? 'futou' : 'bun',
      prop: 'cup',
      robeColor: pickColor(),
    });
  }

  // 4. 赵太丞家与卷尾官宅街市 (x = -202 -> -240)
  landmarks.push({ id: 'zhao_clinic', name: '赵太丞家', x: -214, y: 5.5, z: -4 });
  landmarks.push({ id: 'scroll_end', name: '官宅卷尾', x: -233, y: 5.5, z: -5 });

  addTiledHouse(arch, { x: -204, z: -5, yaw: 0, w: 6.8, d: 4.5, openFront: true, signText: '杨家应症' });
  addTiledHouse(arch, { x: -214, z: -5, yaw: 0, w: 8.2, d: 5.0, h: 3.3, openFront: true, signText: '赵太丞家', hasSmoke: true });
  addTiledHouse(arch, { x: -226, z: -6, yaw: 0, w: 7.4, d: 4.8, openFront: true, signText: '药' });
  addTiledHouse(arch, { x: -235, z: -6, yaw: 0, w: 8.6, d: 5.6, h: 3.4, openFront: false }); // 卷尾官宅大门
  addTiledHouse(arch, { x: -206, z: 20, yaw: Math.PI, w: 7.0, d: 4.6, openFront: true, signText: '面', hasSmoke: true });
  addTiledHouse(arch, { x: -219, z: 21, yaw: Math.PI, w: 7.4, d: 4.6, openFront: true, signText: '当' });
  addTiledHouse(arch, { x: -232, z: 20, yaw: Math.PI, w: 6.8, d: 4.5, openFront: false });

  [
    [-168, 12, 1.15], [-199, 13, 1.2], [-222, 14, 1.15], [-236, 12, 1.1],
  ].forEach(([wx, wz, ws], i) => addOldWillow(arch, wx, wz, ws, i + 90));
  [
    [-165, -22, 8.2], [-180, -28, 8.6], [-200, -20, 7.8], [-224, -18, 8.2], [-238, -16, 7.5],
  ].forEach(([tx, tz, th], i) => addBareTree(arch, tx, tz, th, i + 100));

  [
    [-208, 11.8, 'ochre'], [-212, 12.2, 'vermilion'], [-225, 2.0, 'indigo'],
  ].forEach(([sx, sz, col]) => {
    addMarketStall(arch, sx as number, sz as number, 0, true, col as 'ochre' | 'vermilion' | 'indigo');
    humans.push({ x: (sx as number) + 0.3, z: (sz as number) - 0.8, role: 'vendor', head: 'bun', robeColor: pickColor() });
  });

  // Pack mules / riders / dogs / urban ox-cart / sedan / bustling street crowd inside the city (x = -156 -> -238)
  carts.push({ kind: 'oxcart', x: -206, z: 7.5, pathEndX: -224, pathEndZ: 7.5, speed: 0.52 });
  animals.push({ species: 'ox', x: -208.3, z: 7.5, pathEndX: -226.3, pathEndZ: 7.5, speed: 0.52 });
  humans.push({ x: -207.4, z: 8.6, role: 'driver', head: 'douli', pathEndX: -225.4, pathEndZ: 8.6, speed: 0.52, robeColor: 0x7a654a });
  carts.push({ kind: 'sedan', x: -219, z: 4.5, pathEndX: -204, pathEndZ: 4.5, speed: 0.66 });
  for (const [ox, oz] of [[1.4, -0.5], [1.4, 0.5], [-1.4, -0.5], [-1.4, 0.5]]) {
    humans.push({
      x: -219 + ox,
      z: 4.5 + oz,
      role: 'sedan_bearer',
      head: 'headwrap',
      pathEndX: -204 + ox,
      pathEndZ: 4.5 + oz,
      speed: 0.66,
      robeColor: 0x5c6670,
    });
  }

  animals.push(
    { species: 'horse', x: -178, z: 6, pathEndX: -196, pathEndZ: 6, speed: 0.9, hasPack: true },
    { species: 'horse', x: -162, z: 7.5, pathEndX: -176, pathEndZ: 7.5, speed: 0.82, hasPack: true },
    { species: 'donkey', x: -212, z: 7.2, pathEndX: -228, pathEndZ: 7.2, speed: 0.72, hasPack: true },
    { species: 'donkey', x: -190, z: 9.0, pathEndX: -204, pathEndZ: 9.0, speed: 0.7, hasPack: true },
    { species: 'dog', x: -200, z: 9, pathEndX: -195, pathEndZ: 10.5, speed: 0.75 },
    { species: 'dog', x: -223, z: 4, pathEndX: -218, pathEndZ: 5, speed: 0.68 },
    { species: 'pig', x: -231, z: -2.2, pathEndX: -227, pathEndZ: -1.6, speed: 0.4 }
  );
  humans.push(
    { x: -178, z: 6, role: 'rider', head: 'futou', pathEndX: -196, pathEndZ: 6, speed: 0.9, robeColor: 0x45515e },
    { x: -162, z: 7.5, role: 'rider', head: 'futou', pathEndX: -176, pathEndZ: 7.5, speed: 0.82, robeColor: 0x764f3c },
    { x: -212, z: 7.2, role: 'rider', head: 'douli', pathEndX: -228, pathEndZ: 7.2, speed: 0.72, robeColor: 0x8b6748 }
  );

  // Dense urban crowd filling 十字街口 -> 赵太丞家 -> 卷尾
  for (let i = 0; i < 68; i++) {
    const px = -158 - i * 1.18;
    const pz = (i % 5 === 0 ? -15 + (i % 7) * 5 : mainRoadZ(px)) + (rand() - 0.5) * 5.2;
    const endX = Math.max(-237, Math.min(-156, px + (i % 2 === 0 ? -8 : 8)));
    humans.push({
      x: px,
      z: pz,
      role: i % 5 === 0 ? 'porter' : i % 7 === 0 ? 'vendor' : 'walk',
      head: i % 4 === 0 ? 'futou' : i % 3 === 0 ? 'douli' : i % 2 === 0 ? 'bun' : 'headwrap',
      prop: i % 5 === 0 ? 'pole' : i % 6 === 0 ? 'basket' : i % 8 === 0 ? 'bundle' : 'none',
      pathEndX: endX,
      pathEndZ: pz + (rand() - 0.5) * 2.0,
      speed: 0.68 + rand() * 0.3,
      robeColor: pickColor(),
    });
  }

  // Background & mid-ground horizon groves (soft ink-wash layered trees so skyline never looks empty)
  for (let bx = 235; bx >= -235; bx -= 14) {
    const bz = -33 - (Math.abs(bx * 7) % 20);
    if (rand() > 0.35) addBareTree(arch, bx, bz, 8.5 + rand() * 3.0, Math.abs(bx) + 300);
    else addOldWillow(arch, bx, bz, 1.15, Math.abs(bx) + 400);
  }

  // Contact shadows under key stalls/structures aren't needed individually when PCFSoftShadowMap is on,
  // and on software WebGL we still keep subtle ambient grounding via vertex colors and bank slopes.
  void groundHeightAt;

  return {
    humans,
    animals,
    carts,
    boats,
    landmarks,
  };
}
