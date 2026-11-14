import * as THREE from 'three';
import { MaterialLibrary } from './materials';
import {
  buildCurvedRoofGeometry,
  PrimitiveCache,
  StaticBatcher,
} from './primitives';
import { groundHeightAt } from './world';

export interface SwayingBanner {
  mesh: THREE.Mesh;
  phase: number;
  baseRotZ: number;
}

export interface ChimneyEmitter {
  x: number;
  y: number;
  z: number;
}

export interface ArchContext {
  batcher: StaticBatcher;
  mats: MaterialLibrary;
  prims: PrimitiveCache;
  dynamicParent: THREE.Object3D;
  banners: SwayingBanner[];
  chimneys: ChimneyEmitter[];
  disposables: THREE.BufferGeometry[];
}

function seeded(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Rainbow Bridge geometry constants — spans diagonally from SW (-4, 12) to NE (13, -16)
 */
export const RAINBOW_BRIDGE = {
  x1: -4,
  z1: 12,
  x2: 13,
  z2: -16,
  width: 5.4,
  archRise: 4.9,
  deckBaseY: 0.35,
};

export function rainbowBridgePoint(t: number): {
  x: number;
  y: number;
  z: number;
  angle: number;
} {
  const dx = RAINBOW_BRIDGE.x2 - RAINBOW_BRIDGE.x1;
  const dz = RAINBOW_BRIDGE.z2 - RAINBOW_BRIDGE.z1;
  const x = RAINBOW_BRIDGE.x1 + dx * t;
  const z = RAINBOW_BRIDGE.z1 + dz * t;
  // Smooth arch profile matching Song timber arch bridge
  const y = RAINBOW_BRIDGE.deckBaseY + Math.sin(t * Math.PI) * RAINBOW_BRIDGE.archRise;
  const angle = Math.atan2(dx, dz);
  return { x, y, z, angle };
}

export function addRainbowBridge(ctx: ArchContext): void {
  const { batcher, mats, prims } = ctx;
  const { x1, z1, x2, z2, width, archRise, deckBaseY } = RAINBOW_BRIDGE;
  const dx = x2 - x1;
  const dz = z2 - z1;
  const span = Math.hypot(dx, dz);
  const yaw = Math.atan2(dx, dz); // forward axis along +Z in local frame
  const segs = 26;

  const localMat = new THREE.Matrix4();
  const rootMat = new THREE.Matrix4().compose(
    new THREE.Vector3((x1 + x2) / 2, 0, (z1 + z2) / 2),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)),
    new THREE.Vector3(1, 1, 1)
  );
  const pushLocal = (
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    lx: number,
    ly: number,
    lz: number,
    rx = 0,
    ry = 0,
    rz = 0,
    sx = 1,
    sy = 1,
    sz = 1
  ) => {
    localMat.compose(
      new THREE.Vector3(lx, ly, lz),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
      new THREE.Vector3(sx, sy, sz)
    );
    localMat.premultiply(rootMat);
    batcher.addTransformed(geo, mat, localMat);
  };

  // Brick-and-stone abutments seated cleanly into both riverbanks
  pushLocal(prims.box, mats.brickWall, 0, -0.68, -span / 2 - 0.5, 0, 0, 0, width + 0.8, 1.8, 2.2);
  pushLocal(prims.box, mats.brickWall, 0, -0.68, span / 2 + 0.5, 0, 0, 0, width + 0.8, 1.8, 2.2);

  // 5 parallel interlocking timber arch ribs (拱骨) + cross-beams (横梁) + plank deck
  const ribOffsets = [-width * 0.44, -width * 0.22, 0, width * 0.22, width * 0.44];
  for (let i = 0; i < segs; i++) {
    const t0 = i / segs;
    const t1 = (i + 1) / segs;
    const z0 = (t0 - 0.5) * span;
    const z1p = (t1 - 0.5) * span;
    const y0 = deckBaseY + Math.sin(t0 * Math.PI) * archRise;
    const y1 = deckBaseY + Math.sin(t1 * Math.PI) * archRise;
    const zMid = (z0 + z1p) / 2;
    const yMid = (y0 + y1) / 2;
    const segLen = Math.hypot(z1p - z0, y1 - y0) + 0.08;
    const pitch = -Math.atan2(y1 - y0, z1p - z0);

    // Curved deck planks
    pushLocal(prims.box, mats.timberBridge, 0, yMid - 0.08, zMid, pitch, 0, 0, width, 0.16, segLen);

    // Arch ribs underneath deck
    for (const rxOff of ribOffsets) {
      pushLocal(prims.box, mats.timberDark, rxOff, yMid - 0.34, zMid, pitch, 0, 0, 0.2, 0.32, segLen + 0.15);
    }

    // Secondary lower interlaced scissor-beams (汴河虹桥特有的交织木拱)
    if (i % 2 === 0) {
      pushLocal(prims.box, mats.timberWarm, 0, yMid - 0.52, zMid, 0, 0, 0, width + 0.3, 0.18, 0.22);
    }

    // Railing posts & top/mid rails along both sides
    for (const side of [-1, 1]) {
      const rxPos = side * (width / 2 - 0.14);
      pushLocal(prims.box, mats.clothVermilion, rxPos, yMid + 0.48, zMid, pitch, 0, 0, 0.12, 0.1, segLen);
      pushLocal(prims.box, mats.timberBridge, rxPos, yMid + 0.24, zMid, pitch, 0, 0, 0.08, 0.08, segLen);
      if (i % 2 === 0) {
        pushLocal(prims.box, mats.timberDark, rxPos, y0 + 0.32, z0, 0, 0, 0, 0.14, 0.72, 0.14);
        pushLocal(prims.sphere, mats.clothVermilion, rxPos, y0 + 0.72, z0, 0, 0, 0, 0.18, 0.18, 0.18);
      }
    }
  }
}

/**
 * Flat wooden trestle bridge (卷首小木桥 & 护城河桥).
 */
export function addFlatWoodBridge(
  ctx: ArchContext,
  cx: number,
  cz: number,
  length: number,
  width: number,
  yaw: number,
  deckY = 0.25
): void {
  const { batcher, mats, prims } = ctx;
  const rootMat = new THREE.Matrix4().compose(
    new THREE.Vector3(cx, 0, cz),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)),
    new THREE.Vector3(1, 1, 1)
  );
  const localMat = new THREE.Matrix4();
  const push = (
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    lx: number,
    ly: number,
    lz: number,
    sx: number,
    sy: number,
    sz: number
  ) => {
    localMat.compose(new THREE.Vector3(lx, ly, lz), new THREE.Quaternion(), new THREE.Vector3(sx, sy, sz));
    localMat.premultiply(rootMat);
    batcher.addTransformed(geo, mat, localMat);
  };

  // Deck planks
  const planks = Math.max(8, Math.floor(length * 2));
  for (let i = 0; i < planks; i++) {
    const x = -length / 2 + ((i + 0.5) / planks) * length;
    push(prims.box, mats.timberBridge, x, deckY, 0, length / planks - 0.04, 0.14, width);
  }
  // Longitudinal stringers & pilings
  for (const sz of [-width * 0.4, 0, width * 0.4]) {
    push(prims.box, mats.timberDark, 0, deckY - 0.16, sz, length + 0.4, 0.18, 0.18);
  }
  const piers = 4;
  for (let p = 0; p < piers; p++) {
    const px = -length * 0.4 + (p / (piers - 1)) * length * 0.8;
    for (const sz of [-width * 0.42, width * 0.42]) {
      push(prims.cylinder, mats.timberDark, px, deckY - 1.1, sz, 0.2, 2.2, 0.2);
    }
    push(prims.box, mats.timberDark, px, deckY - 0.32, 0, 0.2, 0.2, width + 0.2);
  }
  // Railings
  for (const sz of [-width * 0.46, width * 0.46]) {
    push(prims.box, mats.timberBridge, 0, deckY + 0.55, sz, length, 0.1, 0.1);
    push(prims.box, mats.timberWarm, 0, deckY + 0.3, sz, length, 0.08, 0.08);
    const posts = Math.max(4, Math.floor(length / 2));
    for (let i = 0; i <= posts; i++) {
      const px = -length / 2 + (i / posts) * length;
      push(prims.box, mats.timberDark, px, deckY + 0.34, sz, 0.13, 0.68, 0.13);
    }
  }
}

/**
 * Song-dynasty tiled house or shopfront (瓦顶民居/铺面).
 * Includes plinth (台基), timber frame (木构架), walls, lattice windows (格子窗),
 * curved tiled roof with upturned eaves (起翘), ridge finials, and optional signboard.
 */
export function addTiledHouse(
  ctx: ArchContext,
  opts: {
    x: number;
    z: number;
    yaw?: number;
    w?: number;
    d?: number;
    h?: number;
    openFront?: boolean;
    stilts?: boolean;
    signText?: string;
    signVertical?: boolean;
    hasSmoke?: boolean;
  }
): void {
  const { batcher, mats, prims, dynamicParent, banners, chimneys, disposables } = ctx;
  const x = opts.x;
  const z = opts.z;
  const yaw = opts.yaw ?? 0;
  const w = opts.w ?? 6.2;
  const d = opts.d ?? 4.6;
  const h = opts.h ?? 3.1;
  const baseGroundY = groundHeightAt(x, z);

  const rootMat = new THREE.Matrix4().compose(
    new THREE.Vector3(x, baseGroundY, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)),
    new THREE.Vector3(1, 1, 1)
  );
  const tmpM = new THREE.Matrix4();
  const push = (
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    lx: number,
    ly: number,
    lz: number,
    rx = 0,
    ry = 0,
    rz = 0,
    sx = 1,
    sy = 1,
    sz = 1
  ) => {
    tmpM.compose(
      new THREE.Vector3(lx, ly, lz),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
      new THREE.Vector3(sx, sy, sz)
    );
    tmpM.premultiply(rootMat);
    batcher.addTransformed(geo, mat, tmpM);
  };

  // 1. Stone/earth plinth (台基) or riverside wooden stilts (吊脚柱)
  const floorY = opts.stilts ? 1.15 : 0.34;
  if (opts.stilts) {
    for (const px of [-w / 2 + 0.2, 0, w / 2 - 0.2]) {
      for (const pz of [-d / 2 + 0.2, d / 2 - 0.2]) {
        push(prims.cylinder, mats.timberDark, px, 0.0, pz, 0, 0, 0, 0.22, 2.4, 0.22);
      }
    }
    push(prims.box, mats.timberWarm, 0, floorY - 0.08, 0, 0, 0, 0, w + 0.3, 0.16, d + 0.3);
  } else {
    push(prims.box, mats.stoneBase, 0, floorY / 2 - 0.15, 0, 0, 0, 0, w + 0.55, floorY + 0.35, d + 0.55);
  }

  // 2. Timber frame (木构柱梁)
  const colsX = [-w / 2 + 0.12, 0, w / 2 - 0.12];
  for (const cx of colsX) {
    for (const cz of [-d / 2 + 0.12, d / 2 - 0.12]) {
      push(prims.cylinder, mats.timberDark, cx, floorY + h / 2, cz, 0, 0, 0, 0.18, h, 0.18);
    }
  }
  // Top tie beams (额枋)
  push(prims.box, mats.timberDark, 0, floorY + h - 0.1, d / 2 - 0.12, 0, 0, 0, w, 0.22, 0.18);
  push(prims.box, mats.timberDark, 0, floorY + h - 0.1, -d / 2 + 0.12, 0, 0, 0, w, 0.22, 0.18);
  for (const sx of [-w / 2 + 0.12, w / 2 - 0.12]) {
    push(prims.box, mats.timberDark, sx, floorY + h - 0.1, 0, 0, 0, 0, 0.18, 0.22, d);
  }

  // 3. Lime plaster walls + gable triangles + lattice windows (格子窗)
  push(prims.box, mats.plasterWall, 0, floorY + h / 2, -d / 2 + 0.16, 0, 0, 0, w - 0.25, h - 0.1, 0.18);
  push(prims.box, mats.plasterWall, -w / 2 + 0.16, floorY + h / 2, 0, 0, 0, 0, 0.18, h - 0.1, d - 0.25);
  push(prims.box, mats.plasterWall, w / 2 - 0.16, floorY + h / 2, 0, 0, 0, 0, 0.18, h - 0.1, d - 0.25);

  if (opts.openFront) {
    // Open shopfront counter (柜台) + low wooden wainscot + lattice upper transoms
    push(prims.box, mats.timberWarm, 0, floorY + 0.46, d / 2 - 0.25, 0, 0, 0, w * 0.72, 0.92, 0.42);
    push(prims.box, mats.latticeWindow, 0, floorY + h - 0.55, d / 2 - 0.14, 0, 0, 0, w - 0.5, 0.85, 0.1);
  } else {
    push(prims.box, mats.plasterWall, 0, floorY + h / 2, d / 2 - 0.16, 0, 0, 0, w - 0.25, h - 0.1, 0.18);
    // Twin lattice windows on front facade
    for (const wx of [-w * 0.24, w * 0.24]) {
      push(prims.box, mats.latticeWindow, wx, floorY + h * 0.54, d / 2 - 0.04, 0, 0, 0, w * 0.28, h * 0.46, 0.12);
    }
  }

  // Gable wall fill under roof ridge (山墙尖)
  const ridgeH = Math.min(2.2, d * 0.36);
  for (const sx of [-w / 2 + 0.18, w / 2 - 0.18]) {
    const gableGeo = new THREE.ConeGeometry(d * 0.52, ridgeH, 4);
    gableGeo.rotateY(Math.PI / 4);
    gableGeo.scale(0.18 / d, 1, 1);
    push(gableGeo, mats.plasterWall, sx, floorY + h + ridgeH * 0.45, 0);
    gableGeo.dispose();
  }

  // 4. Curved upturned tiled roof (瓦顶 + 屋脊起翘)
  const roofGeo = buildCurvedRoofGeometry(w, d, ridgeH, 0.28, 0.55);
  disposables.push(roofGeo);
  push(roofGeo, mats.tileRoof, 0, floorY + h - 0.04, 0);

  // Main ridge beam + upturned ridge ends (正脊与脊端起翘)
  push(prims.box, mats.ridgeTile, 0, floorY + h + ridgeH + 0.04, 0, 0, 0, 0, w + 1.1, 0.2, 0.24);
  for (const sx of [-1, 1]) {
    push(
      prims.box,
      mats.ridgeTile,
      sx * (w / 2 + 0.56),
      floorY + h + ridgeH + 0.18,
      0,
      0,
      0,
      sx * 0.35,
      0.34,
      0.24,
      0.24
    );
  }

  // 5. Optional shopfront wooden awning + signboard / swaying pennant
  if (opts.openFront) {
    push(prims.box, mats.timberWarm, 0, floorY + h * 0.72, d / 2 + 0.55, 0.35, 0, 0, w + 0.2, 0.08, 1.35);
    for (const px of [-w * 0.44, w * 0.44]) {
      push(prims.cylinder, mats.timberDark, px, floorY + h * 0.34, d / 2 + 1.05, 0, 0, 0, 0.1, h * 0.68, 0.1);
    }
  }

  if (opts.signText) {
    const vertical = opts.signVertical ?? true;
    const sMat = mats.makeSignMaterial(opts.signText, { vertical });
    const sw = vertical ? 0.56 : 2.1;
    const sh = vertical ? 1.65 : 0.72;
    const signMesh = new THREE.Mesh(new THREE.BoxGeometry(sw, sh, 0.08), sMat);
    disposables.push(signMesh.geometry);
    const localPos = vertical
      ? new THREE.Vector3(w * 0.46, floorY + h * 0.58, d / 2 + 0.65)
      : new THREE.Vector3(0, floorY + h * 0.88, d / 2 + 0.32);
    localPos.applyMatrix4(rootMat);
    signMesh.position.copy(localPos);
    signMesh.rotation.y = yaw;
    signMesh.castShadow = true;
    dynamicParent.add(signMesh);

    if (vertical) {
      banners.push({ mesh: signMesh, phase: x * 0.3 + z * 0.2, baseRotZ: 0 });
    }
  }

  if (opts.hasSmoke) {
    const chPos = new THREE.Vector3(-w * 0.25, floorY + h + ridgeH + 0.45, -d * 0.2);
    chPos.applyMatrix4(rootMat);
    push(prims.box, mats.brickWall, -w * 0.25, floorY + h + ridgeH * 0.6, -d * 0.2, 0, 0, 0, 0.5, 1.0, 0.5);
    chimneys.push({ x: chPos.x, y: chPos.y, z: chPos.z });
  }
}

/**
 * Thatched rural cottage (茅草农舍) with bamboo fence and optional haystack.
 */
export function addThatchedCottage(
  ctx: ArchContext,
  x: number,
  z: number,
  yaw = 0,
  w = 5.2,
  d = 4.0,
  hasSmoke = true
): void {
  const { batcher, mats, prims, chimneys, disposables } = ctx;
  const gy = groundHeightAt(x, z);
  const h = 2.4;
  const rootMat = new THREE.Matrix4().compose(
    new THREE.Vector3(x, gy, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)),
    new THREE.Vector3(1, 1, 1)
  );
  const tmpM = new THREE.Matrix4();
  const push = (
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    lx: number,
    ly: number,
    lz: number,
    rx = 0,
    ry = 0,
    rz = 0,
    sx = 1,
    sy = 1,
    sz = 1
  ) => {
    tmpM.compose(
      new THREE.Vector3(lx, ly, lz),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
      new THREE.Vector3(sx, sy, sz)
    );
    tmpM.premultiply(rootMat);
    batcher.addTransformed(geo, mat, tmpM);
  };

  // Packed earthen base + timber posts + mud walls
  push(prims.box, mats.riverBank, 0, 0.08, 0, 0, 0, 0, w + 0.4, 0.35, d + 0.4);
  push(prims.box, mats.plasterWall, 0, h / 2 + 0.15, 0, 0, 0, 0, w - 0.15, h, d - 0.15);
  for (const cx of [-w / 2 + 0.1, w / 2 - 0.1]) {
    for (const cz of [-d / 2 + 0.1, d / 2 - 0.1]) {
      push(prims.cylinder, mats.timberDark, cx, h / 2 + 0.15, cz, 0, 0, 0, 0.16, h, 0.16);
    }
  }
  // Door & lattice window
  push(prims.box, mats.timberDark, -w * 0.18, 1.0, d / 2 - 0.02, 0, 0, 0, 0.95, 1.75, 0.1);
  push(prims.box, mats.latticeWindow, w * 0.22, 1.35, d / 2 - 0.02, 0, 0, 0, 1.0, 0.85, 0.1);

  // Thick thatched roof (茅草顶)
  const ridgeH = 1.65;
  const roofGeo = buildCurvedRoofGeometry(w, d, ridgeH, 0.06, 0.62);
  disposables.push(roofGeo);
  push(roofGeo, mats.thatch, 0, h + 0.12, 0);
  // Hip-cap thatch cones on ends
  for (const sx of [-w / 2 - 0.15, w / 2 + 0.15]) {
    push(prims.cone, mats.thatch, sx, h + ridgeH * 0.42, 0, 0, 0, sx * 0.4, d * 0.9, ridgeH * 1.15, d * 0.9);
  }
  push(prims.cylinder, mats.thatch, 0, h + ridgeH + 0.05, 0, 0, 0, Math.PI / 2, 0.36, w + 0.8, 0.36);

  // Bamboo courtyard fence in front-side
  for (let i = -3; i <= 3; i++) {
    push(prims.cylinder, mats.bambooMat, i * 0.85, 0.55, d / 2 + 2.2, 0, 0, 0, 0.07, 1.1, 0.07);
  }
  push(prims.box, mats.bambooMat, 0, 0.72, d / 2 + 2.2, 0, 0, 0, 5.4, 0.06, 0.06);
  push(prims.box, mats.bambooMat, 0, 0.34, d / 2 + 2.2, 0, 0, 0, 5.4, 0.06, 0.06);

  if (hasSmoke) {
    const chPos = new THREE.Vector3(w * 0.28, h + ridgeH + 0.35, -d * 0.15).applyMatrix4(rootMat);
    chimneys.push({ x: chPos.x, y: chPos.y, z: chPos.z });
  }
}

/**
 * Festive Song-dynasty scaffolding gateway (彩楼欢门) placed before major wine taverns
 * like 十千脚店 and 孙羊正店.
 */
export function addCailouHuanmen(
  ctx: ArchContext,
  x: number,
  z: number,
  yaw: number,
  width = 5.4,
  height = 8.4
): void {
  const { batcher, mats, prims, dynamicParent, banners, disposables } = ctx;
  const gy = groundHeightAt(x, z);
  const rootMat = new THREE.Matrix4().compose(
    new THREE.Vector3(x, gy, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)),
    new THREE.Vector3(1, 1, 1)
  );
  const tmpM = new THREE.Matrix4();
  const push = (
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    lx: number,
    ly: number,
    lz: number,
    rx = 0,
    ry = 0,
    rz = 0,
    sx = 1,
    sy = 1,
    sz = 1
  ) => {
    tmpM.compose(
      new THREE.Vector3(lx, ly, lz),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
      new THREE.Vector3(sx, sy, sz)
    );
    tmpM.premultiply(rootMat);
    batcher.addTransformed(geo, mat, tmpM);
  };

  // Multi-pole lashed vertical spires (characteristic bristling silhouette from the painting!)
  const cols = [-width * 0.48, -width * 0.24, 0, width * 0.24, width * 0.48];
  const depthOffs = [-0.75, 0.75];
  cols.forEach((cx, ci) => {
    const spireH = height - Math.abs(ci - 2) * 0.95;
    for (const cz of depthOffs) {
      push(prims.cylinder, mats.bambooMat, cx, spireH / 2, cz, 0, 0, 0, 0.12, spireH, 0.12);
      // Decorative finial tuft at spire top
      push(prims.cone, mats.clothVermilion, cx, spireH + 0.25, cz, 0, 0, 0, 0.22, 0.5, 0.22);
    }
    // Cross tie beams
    for (const hLevel of [2.8, 4.4, 5.8]) {
      if (hLevel < spireH - 0.5) {
        push(prims.box, mats.timberDark, cx, hLevel, 0, 0, 0, 0, 0.1, 0.1, 1.65);
      }
    }
  });

  // Horizontal festive cross-tiers & sloped canopy lintels
  for (const hLevel of [3.2, 4.7, 6.1]) {
    const tierW = width * (1.06 - (hLevel - 3.2) * 0.05);
    push(prims.box, mats.timberWarm, 0, hLevel, 0.75, 0, 0, 0, tierW, 0.14, 0.14);
    push(prims.box, mats.timberWarm, 0, hLevel, -0.75, 0, 0, 0, tierW, 0.14, 0.14);
    push(prims.box, mats.clothVermilion, 0, hLevel + 0.22, 0, 0, 0, 0, tierW * 0.94, 0.34, 1.2);
  }

  // Hanging swaying silk banners (旗幌)
  for (const bx of [-width * 0.36, width * 0.36]) {
    const bGeo = new THREE.BoxGeometry(0.42, 2.2, 0.05);
    bGeo.translate(0, -1.1, 0);
    disposables.push(bGeo);
    const bMesh = new THREE.Mesh(bGeo, mats.clothVermilion);
    const p = new THREE.Vector3(bx, 5.0, 0.88).applyMatrix4(rootMat);
    bMesh.position.copy(p);
    bMesh.rotation.y = yaw;
    bMesh.castShadow = true;
    dynamicParent.add(bMesh);
    banners.push({ mesh: bMesh, phase: x * 0.2 + bx, baseRotZ: 0 });
  }
}

/**
 * Grand two-story Song Wine Pavilion (酒楼: 十千脚店 / 孙羊正店)
 * with second-floor wrap-around balcony (二层平座栏杆), open gallery, and signboard.
 */
export function addWinePavilion(
  ctx: ArchContext,
  opts: {
    x: number;
    z: number;
    yaw?: number;
    w?: number;
    d?: number;
    signText: string;
    withCailou?: boolean;
  }
): void {
  const { batcher, mats, prims, dynamicParent, banners, disposables } = ctx;
  const x = opts.x;
  const z = opts.z;
  const yaw = opts.yaw ?? 0;
  const w = opts.w ?? 10.5;
  const d = opts.d ?? 6.4;
  const h1 = 3.2;
  const h2 = 2.9;
  const gy = groundHeightAt(x, z);

  const rootMat = new THREE.Matrix4().compose(
    new THREE.Vector3(x, gy, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)),
    new THREE.Vector3(1, 1, 1)
  );
  const tmpM = new THREE.Matrix4();
  const push = (
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    lx: number,
    ly: number,
    lz: number,
    rx = 0,
    ry = 0,
    rz = 0,
    sx = 1,
    sy = 1,
    sz = 1
  ) => {
    tmpM.compose(
      new THREE.Vector3(lx, ly, lz),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
      new THREE.Vector3(sx, sy, sz)
    );
    tmpM.premultiply(rootMat);
    batcher.addTransformed(geo, mat, tmpM);
  };

  // Stone plinth
  push(prims.box, mats.stoneBase, 0, 0.22, 0, 0, 0, 0, w + 0.9, 0.6, d + 0.9);
  const y1 = 0.52;

  // Ground floor arcade columns + back/side walls + counters
  for (let i = 0; i <= 4; i++) {
    const cx = -w / 2 + 0.2 + (i / 4) * (w - 0.4);
    push(prims.cylinder, mats.timberDark, cx, y1 + h1 / 2, d / 2 - 0.2, 0, 0, 0, 0.22, h1, 0.22);
    push(prims.cylinder, mats.timberDark, cx, y1 + h1 / 2, -d / 2 + 0.2, 0, 0, 0, 0.22, h1, 0.22);
  }
  push(prims.box, mats.plasterWall, 0, y1 + h1 / 2, -d / 2 + 0.22, 0, 0, 0, w - 0.4, h1, 0.22);
  push(prims.box, mats.plasterWall, -w / 2 + 0.22, y1 + h1 / 2, 0, 0, 0, 0, 0.22, h1, d - 0.4);
  push(prims.box, mats.plasterWall, w / 2 - 0.22, y1 + h1 / 2, 0, 0, 0, 0, 0.22, h1, d - 0.4);

  // Projecting second-floor balcony platform (二层平座) & carved balustrade (栏杆)
  const y2 = y1 + h1;
  const balW = w + 1.4;
  const balD = d + 1.4;
  push(prims.box, mats.timberWarm, 0, y2, 0, 0, 0, 0, balW, 0.22, balD);
  // Balcony railings on front & sides
  push(prims.box, mats.clothVermilion, 0, y2 + 0.72, balD / 2 - 0.08, 0, 0, 0, balW, 0.1, 0.1);
  push(prims.box, mats.timberWarm, 0, y2 + 0.42, balD / 2 - 0.08, 0, 0, 0, balW, 0.08, 0.08);
  for (let i = 0; i <= 10; i++) {
    const px = -balW / 2 + 0.12 + (i / 10) * (balW - 0.24);
    push(prims.box, mats.timberDark, px, y2 + 0.42, balD / 2 - 0.08, 0, 0, 0, 0.1, 0.65, 0.1);
  }
  for (const sx of [-balW / 2 + 0.08, balW / 2 - 0.08]) {
    push(prims.box, mats.clothVermilion, sx, y2 + 0.72, 0, 0, 0, 0, 0.1, 0.1, balD);
  }

  // Second floor walls, open lattice gallery & columns
  const w2 = w * 0.92;
  const d2 = d * 0.88;
  for (let i = 0; i <= 3; i++) {
    const cx = -w2 / 2 + 0.2 + (i / 3) * (w2 - 0.4);
    push(prims.cylinder, mats.clothVermilion, cx, y2 + h2 / 2, d2 / 2 - 0.15, 0, 0, 0, 0.18, h2, 0.18);
  }
  push(prims.box, mats.plasterWall, 0, y2 + h2 / 2, -d2 / 2 + 0.2, 0, 0, 0, w2, h2, 0.2);
  push(prims.box, mats.latticeWindow, 0, y2 + h2 * 0.56, d2 / 2 - 0.18, 0, 0, 0, w2 - 0.6, h2 * 0.62, 0.1);
  push(prims.box, mats.plasterWall, -w2 / 2 + 0.2, y2 + h2 / 2, 0, 0, 0, 0, 0.2, h2, d2);
  push(prims.box, mats.plasterWall, w2 / 2 - 0.2, y2 + h2 / 2, 0, 0, 0, 0, 0.2, h2, d2);

  // Grand upturned tiled roof
  const ridgeH = 2.25;
  const roofGeo = buildCurvedRoofGeometry(w2 + 0.4, d2 + 0.4, ridgeH, 0.36, 0.75);
  disposables.push(roofGeo);
  push(roofGeo, mats.tileRoof, 0, y2 + h2, 0);
  push(prims.box, mats.ridgeTile, 0, y2 + h2 + ridgeH + 0.05, 0, 0, 0, 0, w2 + 1.5, 0.24, 0.26);

  // Wine jars stacked outside
  for (let j = 0; j < 4; j++) {
    push(prims.sphere, mats.timberDark, -w * 0.34 + j * 0.55, y1 + 0.35, d / 2 + 0.55, 0, 0, 0, 0.46, 0.65, 0.46);
  }

  // Horizontal plaque on balcony + vertical hanging tavern pennant
  const hSignMat = mats.makeSignMaterial(opts.signText, { vertical: false, width: 280, height: 112 });
  const hSign = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.85, 0.1), hSignMat);
  disposables.push(hSign.geometry);
  const hp = new THREE.Vector3(0, y2 + h2 - 0.25, balD / 2 + 0.15).applyMatrix4(rootMat);
  hSign.position.copy(hp);
  hSign.rotation.y = yaw;
  dynamicParent.add(hSign);

  const vSignMat = mats.makeSignMaterial(opts.signText, { vertical: true });
  const vSign = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.9, 0.08), vSignMat);
  disposables.push(vSign.geometry);
  const vp = new THREE.Vector3(w * 0.48, y2 + 0.4, balD / 2 + 0.55).applyMatrix4(rootMat);
  vSign.position.copy(vp);
  vSign.rotation.y = yaw;
  dynamicParent.add(vSign);
  banners.push({ mesh: vSign, phase: x * 0.15, baseRotZ: 0 });

  if (opts.withCailou) {
    const cPos = new THREE.Vector3(0, 0, d / 2 + 2.4).applyMatrix4(rootMat);
    addCailouHuanmen(ctx, cPos.x, cPos.z, yaw, 5.6, 8.6);
  }
}

/**
 * Bianjing City Gate & Double-Eave Watchtower (砖砌城台 + 城门洞 + 重檐木构城楼).
 */
export function addCityGate(ctx: ArchContext, x: number, z: number, yaw = -0.32): void {
  const { batcher, mats, prims, disposables } = ctx;
  const gy = groundHeightAt(x, z);
  const rootMat = new THREE.Matrix4().compose(
    new THREE.Vector3(x, gy, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)),
    new THREE.Vector3(1, 1, 1)
  );
  const tmpM = new THREE.Matrix4();
  const push = (
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    lx: number,
    ly: number,
    lz: number,
    rx = 0,
    ry = 0,
    rz = 0,
    sx = 1,
    sy = 1,
    sz = 1
  ) => {
    tmpM.compose(
      new THREE.Vector3(lx, ly, lz),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
      new THREE.Vector3(sx, sy, sz)
    );
    tmpM.premultiply(rootMat);
    batcher.addTransformed(geo, mat, tmpM);
  };

  const gateH = 7.2;
  const wallThick = 9.0;
  const tunnelW = 5.4;
  const tunnelH = 4.6;

  // Battered brick gate piers flanking the central tunnel (left and right wall sections)
  // Using tapered frustum shapes via scaled cubes + angled buttresses
  for (const side of [-1, 1]) {
    // Inner pier flanking gate tunnel
    push(prims.box, mats.brickWall, 0, gateH / 2, side * (tunnelW / 2 + 4.8), 0, 0, 0, wallThick, gateH, 9.6);
    // Battered outer slope on front/back of wall
    push(prims.box, mats.brickWall, 1.0, gateH * 0.42, side * (tunnelW / 2 + 4.8), 0, 0, -0.18, wallThick * 0.85, gateH * 0.86, 9.5);
    // Extending city wall wings (north & south)
    push(prims.box, mats.brickWall, 0, (gateH - 1.0) / 2, side * 26, 0, 0, 0, 6.8, gateH - 1.0, 34);
    push(prims.box, mats.brickWall, 0.8, (gateH - 1.2) / 2, side * 26, 0, 0, -0.16, 6.2, gateH - 1.2, 34);
    // Battlements (女墙垛口)
    for (let k = -12; k <= 12; k += 2) {
      push(prims.box, mats.brickWall, wallThick * 0.46, gateH + 0.55, side * 14 + k, 0, 0, 0, 0.65, 1.1, 1.1);
    }
  }

  // Gate arch lintel & barrel vault ceiling above tunnel
  push(
    prims.box,
    mats.brickWall,
    0,
    tunnelH + (gateH - tunnelH) / 2,
    0,
    0,
    0,
    0,
    wallThick + 0.6,
    gateH - tunnelH,
    tunnelW + 0.4
  );
  // Heavy timber gate doors swung open inside tunnel
  for (const side of [-1, 1]) {
    push(
      prims.box,
      mats.clothVermilion,
      wallThick * 0.3,
      tunnelH * 0.48,
      side * (tunnelW / 2 - 0.25),
      0,
      0,
      0,
      2.4,
      tunnelH * 0.94,
      0.24
    );
  }

  // Stepped brick ramp (登城马道) visible on the foreground side of the gate (exact match to slice_1!)
  const steps = 12;
  for (let s = 0; s < steps; s++) {
    const t = s / steps;
    push(
      prims.box,
      mats.brickWall,
      wallThick * 0.52 + (1 - t) * 4.5,
      (t * gateH) / 2,
      tunnelW / 2 + 5.5 + (1 - t) * 5.0,
      0,
      0,
      0,
      2.2,
      t * gateH + 0.5,
      1.8
    );
  }

  // Top parapet terrace
  push(prims.box, mats.stoneBase, 0, gateH + 0.15, 0, 0, 0, 0, wallThick + 1.0, 0.35, 18.5);

  // Double-eave Timber Gatehouse Tower (重檐木构城楼) atop the brick platform!
  const ty = gateH + 0.32;
  const tw = 6.0;
  const td = 11.8;
  // Lower gallery columns
  for (const lx of [-tw / 2 + 0.25, tw / 2 - 0.25]) {
    for (let i = 0; i <= 4; i++) {
      const lz = -td / 2 + 0.3 + (i / 4) * (td - 0.6);
      push(prims.cylinder, mats.clothVermilion, lx, ty + 1.3, lz, 0, 0, 0, 0.22, 2.6, 0.22);
    }
  }
  push(prims.box, mats.timberDark, 0, ty + 1.25, 0, 0, 0, 0, tw - 0.7, 2.5, td - 0.7);
  push(prims.box, mats.latticeWindow, tw / 2 - 0.28, ty + 1.3, 0, 0, 0, 0, 0.2, 2.0, td - 1.4);

  // Lower eave roof
  const r1 = buildCurvedRoofGeometry(td + 1.4, tw + 1.4, 1.25, 0.42, 0.85);
  r1.rotateY(Math.PI / 2);
  disposables.push(r1);
  push(r1, mats.tileRoof, 0, ty + 2.5, 0);

  // Upper tower story + main upturned roof
  const ty2 = ty + 3.1;
  push(prims.box, mats.plasterWall, 0, ty2 + 0.9, 0, 0, 0, 0, tw * 0.74, 1.8, td * 0.78);
  push(prims.box, mats.latticeWindow, tw * 0.37, ty2 + 0.9, 0, 0, 0, 0, 0.14, 1.3, td * 0.66);
  const r2 = buildCurvedRoofGeometry(td * 0.86, tw * 0.82, 1.75, 0.46, 0.85);
  r2.rotateY(Math.PI / 2);
  disposables.push(r2);
  push(r2, mats.tileRoof, 0, ty2 + 1.8, 0);
  push(prims.box, mats.ridgeTile, 0, ty2 + 3.6, 0, 0, 0, 0, 0.3, 0.32, td * 0.86);
}

/**
 * Market stall with wooden trestle, wares (jars/cloth/baskets), and large umbrella (大伞).
 */
export function addMarketStall(
  ctx: ArchContext,
  x: number,
  z: number,
  yaw = 0,
  withUmbrella = true,
  umbrellaColor: 'ochre' | 'vermilion' | 'indigo' = 'ochre'
): void {
  const { batcher, mats, prims } = ctx;
  const gy = groundHeightAt(x, z);
  const rootMat = new THREE.Matrix4().compose(
    new THREE.Vector3(x, gy, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)),
    new THREE.Vector3(1, 1, 1)
  );
  const tmpM = new THREE.Matrix4();
  const push = (
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    lx: number,
    ly: number,
    lz: number,
    rx = 0,
    ry = 0,
    rz = 0,
    sx = 1,
    sy = 1,
    sz = 1
  ) => {
    tmpM.compose(
      new THREE.Vector3(lx, ly, lz),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
      new THREE.Vector3(sx, sy, sz)
    );
    tmpM.premultiply(rootMat);
    batcher.addTransformed(geo, mat, tmpM);
  };

  // Wooden counter + 4 legs
  push(prims.box, mats.timberWarm, 0, 0.78, 0, 0, 0, 0, 2.1, 0.08, 1.05);
  for (const lx of [-0.9, 0.9]) {
    for (const lz of [-0.42, 0.42]) {
      push(prims.box, mats.timberDark, lx, 0.39, lz, 0, 0, 0, 0.09, 0.78, 0.09);
    }
  }
  // Wares on counter: jars, baskets, folded cloth bolts
  push(prims.sphere, mats.timberDark, -0.55, 0.98, 0, 0, 0, 0, 0.34, 0.42, 0.34);
  push(prims.cylinder, mats.bambooMat, 0.05, 0.96, 0.08, 0, 0, 0, 0.42, 0.28, 0.42);
  push(prims.box, mats.clothIndigo, 0.62, 0.92, -0.1, 0, 0.2, 0, 0.44, 0.18, 0.28);

  if (withUmbrella) {
    const uMat =
      umbrellaColor === 'vermilion'
        ? mats.clothVermilion
        : umbrellaColor === 'indigo'
          ? mats.clothIndigo
          : mats.clothUmbrella;
    push(prims.cylinder, mats.bambooMat, 0, 1.38, -0.35, 0, 0, 0, 0.08, 2.75, 0.08);
    push(prims.cone, uMat, 0, 2.72, -0.35, 0, 0, 0, 2.7, 0.62, 2.7);
    // Radial umbrella ribs underneath
    for (let r = 0; r < 6; r++) {
      const a = (r / 6) * Math.PI;
      push(prims.box, mats.bambooMat, 0, 2.52, -0.35, 0, a, 0, 2.5, 0.03, 0.03);
    }
  }
}

/**
 * Gnarled Song-dynasty Old Willow (粗矮歪斜老柳) with thick crooked trunk,
 * radiating slender twigs (放射细枝), and sparse early-spring bud clusters.
 */
export function addOldWillow(ctx: ArchContext, x: number, z: number, scale = 1.0, seed = 1): void {
  const { batcher, mats, prims } = ctx;
  const rand = seeded(seed * 733 + Math.round(x * 13 + z * 7));
  const gy = groundHeightAt(x, z);
  const leanX = (rand() - 0.5) * 0.42;
  const leanZ = (rand() - 0.5) * 0.34;
  const up = new THREE.Vector3(0, 1, 0);
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();

  // Thick, squat, gnarled leaning trunk (粗矮歪斜老柳干)
  let curX = x;
  let curY = gy - 0.25;
  let curZ = z;
  const trunkSegs = 4;
  for (let i = 0; i < trunkSegs; i++) {
    const segH = (0.76 - i * 0.08) * scale;
    const rBot = (0.58 - i * 0.1) * scale;
    const rTop = (0.46 - i * 0.08) * scale;
    const dir = new THREE.Vector3(
      leanX + (rand() - 0.5) * 0.26,
      1.0,
      leanZ + (rand() - 0.5) * 0.26
    ).normalize();
    const nx = curX + dir.x * segH;
    const ny = curY + dir.y * segH;
    const nz = curZ + dir.z * segH;
    q.setFromUnitVectors(up, dir);
    e.setFromQuaternion(q);
    const segGeo = new THREE.CylinderGeometry(rTop, rBot, segH * 1.12, 7);
    batcher.add(segGeo, mats.bark, (curX + nx) / 2, (curY + ny) / 2, (curZ + nz) / 2, e.x, e.y, e.z);
    segGeo.dispose();

    if (i === 1) {
      batcher.add(
        prims.sphere,
        mats.bark,
        curX + rBot * 0.45,
        (curY + ny) / 2,
        curZ,
        0,
        0,
        0,
        rBot * 0.95,
        rBot * 0.85,
        rBot * 0.95
      );
    }
    curX = nx;
    curY = ny;
    curZ = nz;
  }

  // Radiating crooked boughs & dense broom-like radiating slender spring twigs (放射状细枝)
  const boughCount = 7;
  for (let b = 0; b < boughCount; b++) {
    const yaw = (b / boughCount) * Math.PI * 2 + (rand() - 0.5) * 0.45;
    const pitch = 0.45 + rand() * 0.48;
    const bLen = (1.65 + rand() * 0.85) * scale;
    const bDir = new THREE.Vector3(
      Math.cos(yaw) * Math.sin(pitch),
      Math.cos(pitch),
      Math.sin(yaw) * Math.sin(pitch)
    ).normalize();
    const endX = curX + bDir.x * bLen;
    const endY = curY + bDir.y * bLen;
    const endZ = curZ + bDir.z * bLen;
    q.setFromUnitVectors(up, bDir);
    e.setFromQuaternion(q);
    const bGeo = new THREE.CylinderGeometry(0.055 * scale, 0.145 * scale, bLen * 1.05, 5);
    batcher.add(bGeo, mats.bark, (curX + endX) / 2, (curY + endY) / 2, (curZ + endZ) / 2, e.x, e.y, e.z);
    bGeo.dispose();

    // 2-stage arching fine willow twigs radiating upward then drooping gently
    const twigCount = 6;
    for (let t = 0; t < twigCount; t++) {
      const tyaw = yaw + (rand() - 0.5) * 1.1;
      const tpitch = 0.22 + rand() * 0.65;
      const tLen1 = (1.15 + rand() * 0.75) * scale;
      const dir1 = new THREE.Vector3(
        Math.cos(tyaw) * Math.sin(tpitch),
        Math.cos(tpitch),
        Math.sin(tyaw) * Math.sin(tpitch)
      ).normalize();
      const mx = endX + dir1.x * tLen1;
      const my = endY + dir1.y * tLen1;
      const mz = endZ + dir1.z * tLen1;
      q.setFromUnitVectors(up, dir1);
      e.setFromQuaternion(q);
      batcher.add(
        prims.cylinder,
        mats.bark,
        (endX + mx) / 2,
        (endY + my) / 2,
        (endZ + mz) / 2,
        e.x,
        e.y,
        e.z,
        0.042 * scale,
        tLen1,
        0.042 * scale
      );

      // Drooping outer fine shoot
      const tLen2 = (1.1 + rand() * 0.85) * scale;
      const dir2 = new THREE.Vector3(
        Math.cos(tyaw) * 0.62,
        -0.38 - rand() * 0.35,
        Math.sin(tyaw) * 0.62
      ).normalize();
      const tx = mx + dir2.x * tLen2;
      const ty = my + dir2.y * tLen2;
      const tz = mz + dir2.z * tLen2;
      q.setFromUnitVectors(up, dir2);
      e.setFromQuaternion(q);
      batcher.add(
        prims.cylinder,
        mats.bark,
        (mx + tx) / 2,
        (my + ty) / 2,
        (mz + tz) / 2,
        e.x,
        e.y,
        e.z,
        0.024 * scale,
        tLen2,
        0.024 * scale
      );

      // Delicate early-spring tender willow bud wisps along outer twig (sparse, wispy — NOT balls)
      if (rand() > 0.35) {
        batcher.add(
          prims.cone,
          mats.willowFoliage,
          (mx + tx) * 0.5,
          (my + ty) * 0.5 - 0.1 * scale,
          (mz + tz) * 0.5,
          Math.PI,
          tyaw,
          0.18,
          0.14 * scale,
          0.62 * scale,
          0.08 * scale,
          false,
          true
        );
      }
    }
  }
}

/**
 * Leafless early-spring deciduous tree (枯枝杂树) with 3-level crooked fork branches.
 */
export function addBareTree(ctx: ArchContext, x: number, z: number, height = 7.5, seed = 1): void {
  const { batcher, mats, prims } = ctx;
  const rand = seeded(seed * 911 + Math.round(x * 11 + z * 5));
  const gy = groundHeightAt(x, z);
  const up = new THREE.Vector3(0, 1, 0);
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();

  const growBranch = (
    sx: number,
    sy: number,
    sz: number,
    dx: number,
    dy: number,
    dz: number,
    len: number,
    rad: number,
    depth: number
  ) => {
    const ex = sx + dx * len;
    const ey = sy + dy * len;
    const ez = sz + dz * len;
    const segLen = Math.hypot(ex - sx, ey - sy, ez - sz);
    q.setFromUnitVectors(up, new THREE.Vector3(ex - sx, ey - sy, ez - sz).normalize());
    e.setFromQuaternion(q);
    batcher.add(
      prims.cylinder,
      mats.bark,
      (sx + ex) / 2,
      (sy + ey) / 2,
      (sz + ez) / 2,
      e.x,
      e.y,
      e.z,
      rad * 2,
      segLen * 1.04,
      rad * 2
    );

    if (depth <= 0) return;
    const forks = depth >= 2 ? 3 : 2;
    for (let f = 0; f < forks; f++) {
      const yaw = rand() * Math.PI * 2;
      const spread = 0.42 + rand() * 0.42;
      const nd = new THREE.Vector3(
        dx + Math.cos(yaw) * spread,
        Math.max(0.28, dy + (rand() - 0.35) * 0.38),
        dz + Math.sin(yaw) * spread
      ).normalize();
      growBranch(ex, ey, ez, nd.x, nd.y, nd.z, len * (0.64 + rand() * 0.14), rad * 0.58, depth - 1);
    }
  };

  const leanX = (rand() - 0.5) * 0.22;
  const leanZ = (rand() - 0.5) * 0.22;
  const dir = new THREE.Vector3(leanX, 1, leanZ).normalize();
  growBranch(x, gy - 0.2, z, dir.x, dir.y, dir.z, height * 0.38, height * 0.036, 3);
}

/**
 * Timber bank pilings (河岸护坡木桩) & reed clumps along Bian River and rural creek.
 */
export function addRiverPilings(ctx: ArchContext, x: number, z: number, count = 6, yaw = 0): void {
  const { batcher, mats, prims } = ctx;
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  for (let i = 0; i < count; i++) {
    const off = (i - (count - 1) / 2) * 0.72;
    const px = x + off * cos;
    const pz = z + off * sin;
    const py = groundHeightAt(px, pz);
    batcher.add(prims.cylinder, mats.timberDark, px, py + 0.35, pz, 0, 0, 0, 0.18, 1.3, 0.18);
  }
  batcher.add(prims.box, mats.timberWarm, x, groundHeightAt(x, z) + 0.65, z, 0, -yaw, 0, count * 0.72, 0.14, 0.14);
}

export function addReedClump(ctx: ArchContext, x: number, z: number, seed = 1): void {
  const { batcher, mats, prims } = ctx;
  const rand = seeded(seed * 317 + Math.round(x * 7));
  const gy = groundHeightAt(x, z);
  for (let i = 0; i < 6; i++) {
    const rx = x + (rand() - 0.5) * 0.9;
    const rz = z + (rand() - 0.5) * 0.9;
    const h = 0.7 + rand() * 0.65;
    batcher.add(
      prims.cone,
      mats.willowFoliage,
      rx,
      gy + h * 0.45,
      rz,
      (rand() - 0.5) * 0.35,
      0,
      (rand() - 0.5) * 0.35,
      0.08,
      h,
      0.08,
      false,
      true
    );
  }
}
