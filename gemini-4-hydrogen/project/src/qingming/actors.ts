import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { MaterialLibrary } from './materials';
import { buildArchedAwningGeometry, buildSpokedWheelGeometry } from './primitives';
import { groundHeightAt, WATER_LEVEL } from './world';

export type HeadType = 'futou' | 'bun' | 'douli' | 'headwrap';
export type PropType = 'none' | 'pole' | 'basket' | 'bundle' | 'boatpole' | 'cup';
export type ActorRole =
  | 'walk'
  | 'porter'
  | 'sedan_bearer'
  | 'tracker'
  | 'boat_pole'
  | 'boat_scull'
  | 'rider'
  | 'driver'
  | 'seated_tea'
  | 'bridge_watch'
  | 'vendor';

export interface HumanSpec {
  x: number;
  z: number;
  yOverride?: number;
  yaw?: number;
  role: ActorRole;
  head?: HeadType;
  prop?: PropType;
  robeColor?: number;
  scale?: number;
  pathEndX?: number;
  pathEndZ?: number;
  speed?: number;
  phase?: number;
  lean?: number;
}

export type AnimalSpecies = 'donkey' | 'horse' | 'ox' | 'camel' | 'pig' | 'dog';

export interface AnimalSpec {
  species: AnimalSpecies;
  x: number;
  z: number;
  yaw?: number;
  pathEndX?: number;
  pathEndZ?: number;
  speed?: number;
  hasPack?: boolean;
  phase?: number;
}

export interface CartSpec {
  kind: 'oxcart' | 'wheelbarrow' | 'sedan';
  x: number;
  z: number;
  yaw?: number;
  pathEndX?: number;
  pathEndZ?: number;
  speed?: number;
  phase?: number;
  willowSprig?: boolean;
}

export interface ActorSystem {
  humanCount: number;
  animalCount: number;
  cartCount: number;
  update: (elapsed: number, dt: number) => void;
  dispose: () => void;
}

function addVertexColor(geo: THREE.BufferGeometry, hex: number): THREE.BufferGeometry {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  if (!g.attributes.normal) g.computeVertexNormals();
  if (!g.attributes.uv) {
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  }
  const c = new THREE.Color(hex);
  const count = g.attributes.position.count;
  const cols = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    cols[i * 3] = c.r;
    cols[i * 3 + 1] = c.g;
    cols[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  for (const k of Object.keys(g.attributes)) {
    if (k !== 'position' && k !== 'normal' && k !== 'uv' && k !== 'color') {
      g.deleteAttribute(k);
    }
  }
  return g;
}

function mergeColored(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const m = mergeGeometries(parts, false)!;
  parts.forEach((p) => p.dispose());
  m.computeBoundingSphere();
  return m;
}

/**
 * Creates sculpted face texture with Song ink-wash eyes, brows, nose shadow, and mouth.
 */
function createFaceTexture(anisotropy: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#d3b289';
  ctx.fillRect(0, 0, 128, 128);

  // Hair cap on back/top
  ctx.fillStyle = '#2e261f';
  ctx.fillRect(0, 0, 128, 38);

  // Eyes, brows, nose & mouth on front (+Z UV center around x=64)
  ctx.fillStyle = '#2a211a';
  // Brows
  ctx.fillRect(46, 56, 12, 3);
  ctx.fillRect(70, 56, 12, 3);
  // Eyes
  ctx.beginPath();
  ctx.arc(52, 64, 3, 0, Math.PI * 2);
  ctx.arc(76, 64, 3, 0, Math.PI * 2);
  ctx.fill();
  // Mouth
  ctx.fillStyle = '#6c493a';
  ctx.fillRect(58, 86, 12, 3);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Builds detailed multi-part Song torso with collar (衣领), waist sash (腰带), and tunic hem.
 */
function buildTorsoGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  // Main robe body (tinted by instance color)
  const body = new THREE.CylinderGeometry(0.16, 0.21, 0.56, 8);
  body.translate(0, 0.92, 0);
  parts.push(addVertexColor(body, 0xffffff));
  body.dispose();

  // Overlapping Song V-collar (交领衣领)
  const collarL = new THREE.BoxGeometry(0.06, 0.22, 0.04);
  collarL.rotateZ(-0.42);
  collarL.translate(-0.04, 1.12, 0.145);
  parts.push(addVertexColor(collarL, 0xe8d9be));
  collarL.dispose();

  const collarR = new THREE.BoxGeometry(0.06, 0.22, 0.04);
  collarR.rotateZ(0.42);
  collarR.translate(0.04, 1.12, 0.15);
  parts.push(addVertexColor(collarR, 0xe8d9be));
  collarR.dispose();

  // Waist belt / sash (腰带)
  const belt = new THREE.CylinderGeometry(0.185, 0.19, 0.075, 8);
  belt.translate(0, 0.85, 0);
  parts.push(addVertexColor(belt, 0x3b2f25));
  belt.dispose();

  // Lower skirt fold / apron
  const skirt = new THREE.CylinderGeometry(0.19, 0.23, 0.24, 8);
  skirt.translate(0, 0.62, 0);
  parts.push(addVertexColor(skirt, 0xd9cbb0));
  skirt.dispose();

  return mergeColored(parts);
}

/**
 * Builds sculpted head + nose bridge + specific headgear (幞头 / 发髻 / 斗笠 / 头巾).
 */
function buildHeadGeometry(kind: HeadType): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const cranium = new THREE.SphereGeometry(0.125, 10, 8);
  cranium.scale(0.92, 1.08, 0.96);
  cranium.rotateY(-Math.PI / 2); // align face texture center (+Z)
  parts.push(addVertexColor(cranium, 0xffffff));
  cranium.dispose();

  // Sculpted nose bridge (五官立体鼻梁)
  const nose = new THREE.BoxGeometry(0.032, 0.055, 0.045);
  nose.translate(0, -0.01, 0.122);
  parts.push(addVertexColor(nose, 0xc9a57b));
  nose.dispose();

  if (kind === 'futou') {
    // Black Song official cap + twin horizontal wings (幞头两翅)
    const cap = new THREE.CylinderGeometry(0.115, 0.128, 0.13, 8);
    cap.translate(0, 0.11, -0.01);
    parts.push(addVertexColor(cap, 0x26211c));
    cap.dispose();
    const wings = new THREE.BoxGeometry(0.48, 0.032, 0.045);
    wings.translate(0, 0.1, -0.05);
    parts.push(addVertexColor(wings, 0x221d18));
    wings.dispose();
  } else if (kind === 'bun') {
    // Topknot hair bun + hairpin (束发髻)
    const hair = new THREE.SphereGeometry(0.128, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55);
    hair.translate(0, 0.03, -0.01);
    parts.push(addVertexColor(hair, 0x2c231c));
    hair.dispose();
    const bun = new THREE.SphereGeometry(0.052, 7, 6);
    bun.translate(0, 0.16, -0.02);
    parts.push(addVertexColor(bun, 0x261e18));
    bun.dispose();
  } else if (kind === 'douli') {
    // Wide conical woven bamboo hat (斗笠)
    const brim = new THREE.ConeGeometry(0.32, 0.14, 12);
    brim.translate(0, 0.13, 0);
    parts.push(addVertexColor(brim, 0xb89a67));
    brim.dispose();
  } else {
    // Cloth headwrap (头巾)
    const wrap = new THREE.CylinderGeometry(0.132, 0.132, 0.09, 8);
    wrap.translate(0, 0.08, 0);
    parts.push(addVertexColor(wrap, 0x5c4f3d));
    wrap.dispose();
  }

  return mergeColored(parts);
}

/**
 * Builds articulated sleeve + hand (袖手) pivoted at shoulder (0,0,0).
 */
function buildArmGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const sleeve = new THREE.CylinderGeometry(0.055, 0.075, 0.34, 6);
  sleeve.translate(0, -0.17, 0);
  parts.push(addVertexColor(sleeve, 0xffffff));
  sleeve.dispose();

  const cuff = new THREE.CylinderGeometry(0.07, 0.06, 0.08, 6);
  cuff.translate(0, -0.35, 0);
  parts.push(addVertexColor(cuff, 0xdfd0b4));
  cuff.dispose();

  const hand = new THREE.SphereGeometry(0.044, 6, 5);
  hand.translate(0, -0.41, 0);
  parts.push(addVertexColor(hand, 0xd3b289));
  hand.dispose();

  return mergeColored(parts);
}

/**
 * Builds articulated trouser leg + cloth shoe (裤腿与鞋) pivoted at hip (0,0,0).
 */
function buildLegGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const leg = new THREE.CylinderGeometry(0.068, 0.052, 0.56, 6);
  leg.translate(0, -0.28, 0);
  parts.push(addVertexColor(leg, 0x52463a));
  leg.dispose();

  const shoe = new THREE.BoxGeometry(0.085, 0.07, 0.17);
  shoe.translate(0, -0.56, 0.04);
  parts.push(addVertexColor(shoe, 0x26201a));
  shoe.dispose();

  return mergeColored(parts);
}

/**
 * Builds carried prop geometries: 担子(pole), 背篓(basket), 包袱(bundle), 长篙(boatpole), 茶盏(cup).
 */
function buildPropGeometry(kind: PropType): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  if (kind === 'pole') {
    const pole = new THREE.CylinderGeometry(0.025, 0.025, 1.85, 6);
    pole.rotateX(Math.PI / 2);
    pole.translate(0.18, 1.26, 0);
    parts.push(addVertexColor(pole, 0x7b5d3e));
    pole.dispose();
    for (const sz of [-0.78, 0.78]) {
      const rope = new THREE.CylinderGeometry(0.01, 0.01, 0.56, 4);
      rope.translate(0.18, 0.98, sz);
      parts.push(addVertexColor(rope, 0x5c4a35));
      rope.dispose();
      const bsk = new THREE.CylinderGeometry(0.22, 0.16, 0.28, 8);
      bsk.translate(0.18, 0.68, sz);
      parts.push(addVertexColor(bsk, 0xa88b5b));
      bsk.dispose();
    }
  } else if (kind === 'basket') {
    const bsk = new THREE.CylinderGeometry(0.2, 0.14, 0.42, 8);
    bsk.translate(0, 1.0, -0.24);
    parts.push(addVertexColor(bsk, 0x9b7f50));
    bsk.dispose();
  } else if (kind === 'bundle') {
    const bag = new THREE.SphereGeometry(0.18, 7, 6);
    bag.scale(1.1, 0.85, 0.9);
    bag.translate(0, 1.05, -0.22);
    parts.push(addVertexColor(bag, 0x4b5563));
    bag.dispose();
  } else if (kind === 'boatpole') {
    const gp = new THREE.CylinderGeometry(0.022, 0.028, 3.2, 5);
    gp.rotateX(0.45);
    gp.translate(0.22, 1.1, 0.55);
    parts.push(addVertexColor(gp, 0x8b6e46));
    gp.dispose();
  } else if (kind === 'cup') {
    const cup = new THREE.CylinderGeometry(0.055, 0.035, 0.07, 7);
    cup.translate(0.16, 1.05, 0.28);
    parts.push(addVertexColor(cup, 0x8f7e62));
    cup.dispose();
  }
  return mergeColored(parts);
}

/**
 * Builds sculpted quadruped animal body (donkey/horse/ox/camel/pig/dog) with hooves/mane/horns/humps/saddle/packs.
 */
function buildAnimalBody(species: AnimalSpecies, hasPack: boolean): {
  body: THREE.BufferGeometry;
  leg: THREE.BufferGeometry;
  shoulderH: number;
  strideLen: number;
  baseColor: number;
} {
  const parts: THREE.BufferGeometry[] = [];
  const scaleMap: Record<AnimalSpecies, { l: number; h: number; w: number; color: number }> = {
    donkey: { l: 1.05, h: 0.78, w: 0.36, color: 0x7c7063 },
    horse: { l: 1.38, h: 1.05, w: 0.44, color: 0x73523b },
    ox: { l: 1.48, h: 1.02, w: 0.58, color: 0x5c4938 },
    camel: { l: 1.55, h: 1.32, w: 0.52, color: 0x9b7e58 },
    pig: { l: 0.68, h: 0.38, w: 0.3, color: 0x5e4d42 },
    dog: { l: 0.58, h: 0.36, w: 0.2, color: 0x876c4d },
  };
  const cfg = scaleMap[species];

  // Barrel torso
  const torso = new THREE.CylinderGeometry(cfg.w * 0.48, cfg.w * 0.52, cfg.l, 8);
  torso.rotateX(Math.PI / 2);
  torso.translate(0, cfg.h, 0);
  parts.push(addVertexColor(torso, cfg.color));
  torso.dispose();

  // Neck + Head
  const neckLen = species === 'camel' ? 0.75 : species === 'horse' ? 0.52 : 0.36;
  const neckPitch = species === 'camel' ? 0.38 : species === 'ox' ? 1.15 : 0.68;
  const neck = new THREE.CylinderGeometry(cfg.w * 0.24, cfg.w * 0.34, neckLen, 7);
  neck.rotateX(neckPitch);
  neck.translate(0, cfg.h + (species === 'ox' ? 0.05 : 0.26), cfg.l * 0.46);
  parts.push(addVertexColor(neck, cfg.color));
  neck.dispose();

  const head = new THREE.BoxGeometry(cfg.w * 0.44, cfg.w * 0.42, cfg.w * 0.85);
  const headY = cfg.h + (species === 'camel' ? 0.62 : species === 'ox' ? 0.08 : 0.42);
  const headZ = cfg.l * 0.58 + (species === 'camel' ? 0.22 : 0.14);
  head.rotateX(0.35);
  head.translate(0, headY, headZ);
  parts.push(addVertexColor(head, cfg.color));
  head.dispose();

  // Species traits: Mane (horse/donkey), Long ears (donkey), Horns (ox), Twin humps (camel), Tail
  if (species === 'horse' || species === 'donkey') {
    const mane = new THREE.BoxGeometry(0.06, neckLen * 0.75, 0.12);
    mane.rotateX(neckPitch);
    mane.translate(0, cfg.h + 0.32, cfg.l * 0.41);
    parts.push(addVertexColor(mane, 0x2c231c));
    mane.dispose();
  }
  if (species === 'donkey') {
    for (const s of [-0.07, 0.07]) {
      const ear = new THREE.ConeGeometry(0.035, 0.18, 5);
      ear.translate(s, headY + 0.18, headZ - 0.08);
      parts.push(addVertexColor(ear, cfg.color));
      ear.dispose();
    }
  }
  if (species === 'ox') {
    for (const s of [-1, 1]) {
      const horn = new THREE.ConeGeometry(0.035, 0.26, 6);
      horn.rotateZ(-s * 0.95);
      horn.translate(s * 0.22, headY + 0.14, headZ - 0.02);
      parts.push(addVertexColor(horn, 0xdfd3ba));
      horn.dispose();
    }
  }
  if (species === 'camel') {
    for (const hz of [-0.22, 0.22]) {
      const hump = new THREE.ConeGeometry(0.18, 0.36, 7);
      hump.translate(0, cfg.h + 0.28, hz);
      parts.push(addVertexColor(hump, 0x8a6d48));
      hump.dispose();
    }
  }

  // Saddle blanket (鞍垫) & cargo pack panniers (驮包)
  if (hasPack && (species === 'donkey' || species === 'horse' || species === 'camel')) {
    const saddle = new THREE.BoxGeometry(cfg.w * 1.05, 0.08, cfg.l * 0.42);
    saddle.translate(0, cfg.h + cfg.w * 0.46, 0);
    parts.push(addVertexColor(saddle, 0x7c3e2e));
    saddle.dispose();
    for (const sx of [-1, 1]) {
      const bag = new THREE.BoxGeometry(0.22, 0.32, 0.44);
      bag.translate(sx * (cfg.w * 0.62), cfg.h + 0.05, 0);
      parts.push(addVertexColor(bag, 0xa88f63));
      bag.dispose();
    }
  }

  // Tail
  const tail = new THREE.CylinderGeometry(0.025, 0.015, cfg.h * 0.55, 5);
  tail.rotateX(-0.35);
  tail.translate(0, cfg.h - 0.1, -cfg.l * 0.54);
  parts.push(addVertexColor(tail, 0x382c22));
  tail.dispose();

  // Leg geometry with dark hoof (蹄)
  const legParts: THREE.BufferGeometry[] = [];
  const legLen = cfg.h * 0.88;
  const upper = new THREE.CylinderGeometry(cfg.w * 0.12, cfg.w * 0.09, legLen, 6);
  upper.translate(0, -legLen / 2, 0);
  legParts.push(addVertexColor(upper, cfg.color));
  upper.dispose();

  const hoof = new THREE.CylinderGeometry(cfg.w * 0.1, cfg.w * 0.12, 0.07, 6);
  hoof.translate(0, -legLen + 0.03, 0);
  legParts.push(addVertexColor(hoof, 0x26201a));
  hoof.dispose();

  return {
    body: mergeColored(parts),
    leg: mergeColored(legParts),
    shoulderH: cfg.h * 0.88,
    strideLen: cfg.l * 0.34,
    baseColor: cfg.color,
  };
}

export function createActorSystem(
  parent: THREE.Object3D,
  mats: MaterialLibrary,
  humanSpecs: HumanSpec[],
  animalSpecs: AnimalSpec[],
  cartSpecs: CartSpec[],
  chimneys: { x: number; y: number; z: number }[]
): ActorSystem {
  const disposables: THREE.BufferGeometry[] = [];
  const texDisposables: THREE.Texture[] = [];
  const matDisposables: THREE.Material[] = [];

  // 1. Shared Actor Materials (vertex-colored PBR so per-instance colors combine cleanly!)
  const faceTex = createFaceTexture(mats.maxAnisotropy);
  texDisposables.push(faceTex);

  const actorBodyMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.88,
    metalness: 0.0,
  });
  const actorHeadMat = new THREE.MeshStandardMaterial({
    map: faceTex,
    vertexColors: true,
    roughness: 0.82,
    metalness: 0.0,
  });
  matDisposables.push(actorBodyMat, actorHeadMat);

  // 2. Build InstancedMeshes for Humans
  const robePalette = [0x9c896c, 0x5c6670, 0x8b6748, 0xa89268, 0x76503c, 0x6c735a, 0xb8a37e, 0x4f473e];
  const nH = Math.max(1, humanSpecs.length);

  const torsoGeo = buildTorsoGeometry();
  const armGeo = buildArmGeometry();
  const legGeo = buildLegGeometry();
  disposables.push(torsoGeo, armGeo, legGeo);

  const torsoInst = new THREE.InstancedMesh(torsoGeo, actorBodyMat, nH);
  const armLInst = new THREE.InstancedMesh(armGeo, actorBodyMat, nH);
  const armRInst = new THREE.InstancedMesh(armGeo, actorBodyMat, nH);
  const legLInst = new THREE.InstancedMesh(legGeo, actorBodyMat, nH);
  const legRInst = new THREE.InstancedMesh(legGeo, actorBodyMat, nH);

  [torsoInst, armLInst, armRInst, legLInst, legRInst].forEach((m) => {
    m.castShadow = true;
    m.receiveShadow = true;
    m.frustumCulled = false;
    parent.add(m);
  });

  // Group humans by head variant (4 InstancedMeshes) & prop variant (5 InstancedMeshes)
  const headGroups: Record<HeadType, number[]> = { futou: [], bun: [], douli: [], headwrap: [] };
  const propGroups: Record<Exclude<PropType, 'none'>, number[]> = {
    pole: [],
    basket: [],
    bundle: [],
    boatpole: [],
    cup: [],
  };

  humanSpecs.forEach((h, i) => {
    const col = new THREE.Color(h.robeColor ?? robePalette[i % robePalette.length]);
    torsoInst.setColorAt(i, col);
    armLInst.setColorAt(i, col);
    armRInst.setColorAt(i, col);
    legLInst.setColorAt(i, new THREE.Color(0xffffff));
    legRInst.setColorAt(i, new THREE.Color(0xffffff));

    const headKey: HeadType = h.head ?? (i % 4 === 0 ? 'douli' : i % 3 === 0 ? 'futou' : i % 2 === 0 ? 'bun' : 'headwrap');
    headGroups[headKey].push(i);
    if (h.prop && h.prop !== 'none') {
      propGroups[h.prop].push(i);
    }
  });
  [torsoInst, armLInst, armRInst, legLInst, legRInst].forEach((m) => {
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  const headInstMap: { inst: THREE.InstancedMesh; indices: number[] }[] = [];
  (Object.keys(headGroups) as HeadType[]).forEach((ht) => {
    const list = headGroups[ht];
    if (list.length === 0) return;
    const g = buildHeadGeometry(ht);
    disposables.push(g);
    const inst = new THREE.InstancedMesh(g, actorHeadMat, list.length);
    inst.castShadow = true;
    inst.frustumCulled = false;
    parent.add(inst);
    headInstMap.push({ inst, indices: list });
  });

  const propInstMap: { inst: THREE.InstancedMesh; indices: number[] }[] = [];
  (Object.keys(propGroups) as Exclude<PropType, 'none'>[]).forEach((pt) => {
    const list = propGroups[pt];
    if (list.length === 0) return;
    const g = buildPropGeometry(pt);
    disposables.push(g);
    const inst = new THREE.InstancedMesh(g, actorBodyMat, list.length);
    inst.castShadow = true;
    inst.frustumCulled = false;
    parent.add(inst);
    propInstMap.push({ inst, indices: list });
  });

  // Precompute human runtime state
  const humanState = humanSpecs.map((h, i) => ({
    x: h.x,
    z: h.z,
    yOverride: h.yOverride,
    yaw: h.yaw ?? 0,
    scale: h.scale ?? 0.96 + ((i * 37) % 13) * 0.01,
    phase: h.phase ?? (i * 1.37) % (Math.PI * 2),
    speed: h.speed ?? 0.9,
    hasPath: h.pathEndX !== undefined && h.pathEndZ !== undefined,
    startX: h.x,
    startZ: h.z,
    endX: h.pathEndX ?? h.x,
    endZ: h.pathEndZ ?? h.z,
    role: h.role,
    lean: h.lean ?? 0,
  }));

  // 3. Build InstancedMeshes for Animals per species
  const animalGroups: Record<AnimalSpecies, AnimalSpec[]> = {
    donkey: [],
    horse: [],
    ox: [],
    camel: [],
    pig: [],
    dog: [],
  };
  animalSpecs.forEach((a) => animalGroups[a.species].push(a));

  const animalBatches: {
    specs: AnimalSpec[];
    bodyInst: THREE.InstancedMesh;
    legs: THREE.InstancedMesh[];
    shoulderH: number;
    strideLen: number;
  }[] = [];

  (Object.keys(animalGroups) as AnimalSpecies[]).forEach((sp) => {
    const list = animalGroups[sp];
    if (list.length === 0) return;
    const pack = sp === 'donkey' || sp === 'camel' || sp === 'horse';
    const built = buildAnimalBody(sp, pack);
    disposables.push(built.body, built.leg);
    const bodyInst = new THREE.InstancedMesh(built.body, actorBodyMat, list.length);
    bodyInst.castShadow = true;
    bodyInst.receiveShadow = true;
    bodyInst.frustumCulled = false;
    parent.add(bodyInst);

    const legs: THREE.InstancedMesh[] = [];
    for (let l = 0; l < 4; l++) {
      const li = new THREE.InstancedMesh(built.leg, actorBodyMat, list.length);
      li.castShadow = true;
      li.frustumCulled = false;
      parent.add(li);
      legs.push(li);
    }
    animalBatches.push({
      specs: list,
      bodyInst,
      legs,
      shoulderH: built.shoulderH,
      strideLen: built.strideLen,
    });
  });

  // 4. Build Carts & Sedans (multi-part Groups with rotating spoked wheels!)
  const wheelBigGeo = buildSpokedWheelGeometry(0.68, 0.048, 10);
  const wheelMidGeo = buildSpokedWheelGeometry(0.56, 0.045, 8);
  const cartAwningGeo = buildArchedAwningGeometry(1.32, 2.2, 0.95, 0.05);
  disposables.push(wheelBigGeo, wheelMidGeo, cartAwningGeo);

  const carts: {
    group: THREE.Group;
    wheels: THREE.Mesh[];
    spec: CartSpec;
    wheelRadius: number;
  }[] = [];

  cartSpecs.forEach((cs) => {
    const g = new THREE.Group();
    const wheels: THREE.Mesh[] = [];
    let wheelRadius = 0.68;

    if (cs.kind === 'oxcart') {
      // Wooden bed, shafts, arched mat canopy (席篷大车), and twin spoked wheels
      const bed = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.16, 2.5), mats.timberWarm);
      bed.position.y = 0.72;
      bed.castShadow = true;
      disposables.push(bed.geometry);
      g.add(bed);

      const canopy = new THREE.Mesh(cartAwningGeo, mats.bambooMat);
      canopy.position.set(0, 0.8, -0.1);
      canopy.castShadow = true;
      g.add(canopy);

      for (const sx of [-0.52, 0.52]) {
        const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.8), mats.timberDark);
        shaft.position.set(sx, 0.76, 1.85);
        disposables.push(shaft.geometry);
        g.add(shaft);
      }

      for (const sx of [-0.82, 0.82]) {
        const w = new THREE.Mesh(wheelBigGeo, mats.timberBridge);
        w.position.set(sx, 0.68, -0.1);
        w.castShadow = true;
        g.add(w);
        wheels.push(w);
      }
      wheelRadius = 0.68;
    } else if (cs.kind === 'wheelbarrow') {
      // Central big spoked wheel (独轮车中间一个大轮) + twin cargo racks + handles
      wheelRadius = 0.56;
      const w = new THREE.Mesh(wheelMidGeo, mats.timberBridge);
      w.position.set(0, 0.56, 0);
      w.castShadow = true;
      g.add(w);
      wheels.push(w);

      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.1, 1.5), mats.timberWarm);
      frame.position.set(0, 0.68, -0.15);
      disposables.push(frame.geometry);
      g.add(frame);

      for (const sx of [-0.32, 0.32]) {
        const cargo = new THREE.Mesh(new THREE.SphereGeometry(0.28, 7, 6), mats.clothOchre);
        cargo.scale.set(0.9, 0.8, 1.4);
        cargo.position.set(sx, 0.92, -0.05);
        cargo.castShadow = true;
        disposables.push(cargo.geometry);
        g.add(cargo);

        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.85), mats.timberDark);
        handle.position.set(sx * 0.9, 0.78, -1.15);
        disposables.push(handle.geometry);
        g.add(handle);
      }
    } else {
      // Sedan chair (轿子) with lattice windows, curved roof, carrying poles, and willow sprigs
      const cab = new THREE.Mesh(new THREE.BoxGeometry(0.96, 1.25, 1.05), mats.clothIndigo);
      cab.position.y = 1.15;
      cab.castShadow = true;
      disposables.push(cab.geometry);
      g.add(cab);

      const lat = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.55, 0.68), mats.latticeWindow);
      lat.position.y = 1.32;
      disposables.push(lat.geometry);
      g.add(lat);

      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.84, 0.36, 4), mats.clothVermilion);
      roof.rotation.y = Math.PI / 4;
      roof.position.y = 1.94;
      roof.castShadow = true;
      disposables.push(roof.geometry);
      g.add(roof);

      for (const sx of [-0.56, 0.56]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 3.6, 6), mats.bambooMat);
        pole.rotation.x = Math.PI / 2;
        pole.position.set(sx, 0.92, 0);
        disposables.push(pole.geometry);
        g.add(pole);
      }

      if (cs.willowSprig) {
        const sprig = new THREE.Mesh(new THREE.SphereGeometry(0.24, 6, 5), mats.willowFoliage);
        sprig.position.set(0, 2.15, 0.25);
        disposables.push(sprig.geometry);
        g.add(sprig);
      }
    }

    g.position.set(cs.x, groundHeightAt(cs.x, cs.z), cs.z);
    g.rotation.y = cs.yaw ?? 0;
    parent.add(g);
    carts.push({ group: g, wheels, spec: cs, wheelRadius });
  });

  // 5. Cooking smoke (炊烟) & Wheeling Birds (飞鸟)
  const smokeMat = new THREE.SpriteMaterial({
    map: mats.smokeTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.48,
  });
  matDisposables.push(smokeMat);

  const smokeSprites: {
    sprite: THREE.Sprite;
    cx: number;
    cy: number;
    cz: number;
    offset: number;
  }[] = [];

  chimneys.forEach((ch, ci) => {
    for (let k = 0; k < 5; k++) {
      const sp = new THREE.Sprite(smokeMat);
      sp.position.set(ch.x, ch.y, ch.z);
      parent.add(sp);
      smokeSprites.push({ sprite: sp, cx: ch.x, cy: ch.y, cz: ch.z, offset: ci * 0.4 + k * 0.2 });
    }
  });

  // Small ink-brown Song swallows/sparrows wheeling gently above the scroll
  const birdCount = 26;
  const birdGeo = new THREE.BufferGeometry();
  const bVerts = new Float32Array([
    0, 0, 0.16, -0.28, 0.05, -0.05, 0, 0, -0.1,
    0, 0, 0.16, 0, 0, -0.1, 0.28, 0.05, -0.05,
  ]);
  birdGeo.setAttribute('position', new THREE.BufferAttribute(bVerts, 3));
  birdGeo.computeVertexNormals();
  disposables.push(birdGeo);
  const birdMat = new THREE.MeshBasicMaterial({ color: 0x3b3025, side: THREE.DoubleSide });
  matDisposables.push(birdMat);
  const birdInst = new THREE.InstancedMesh(birdGeo, birdMat, birdCount);
  birdInst.frustumCulled = false;
  parent.add(birdInst);

  const birdOrbits = Array.from({ length: birdCount }, (_, i) => ({
    cx: 195 - i * 16,
    cy: 11 + (i % 4) * 2.5,
    cz: -12 + ((i * 19) % 28),
    r: 5 + (i % 5) * 2.2,
    speed: 0.28 + (i % 3) * 0.1,
    phase: i * 0.9,
  }));

  // Pre-allocated scratch math helpers (ZERO GC in loop!)
  const _m = new THREE.Matrix4();
  const _subM = new THREE.Matrix4();
  const _pos = new THREE.Vector3();
  const _quat = new THREE.Quaternion();
  const _euler = new THREE.Euler();
  const _scale = new THREE.Vector3();

  // Cache human world transforms per frame so head/prop InstancedMeshes reuse them cleanly
  const hWorldPos = humanState.map(() => new THREE.Vector3());
  const hWorldYaw = new Float32Array(nH);
  const hWorldLean = new Float32Array(nH);
  const hWorldScale = new Float32Array(nH);

  const update = (elapsed: number, _dt: number) => {
    // --- A. Update Humans ---
    for (let i = 0; i < nH; i++) {
      const h = humanState[i];
      let x = h.x;
      let z = h.z;
      let yaw = h.yaw;
      let isMoving = false;

      if (h.hasPath) {
        const dx = h.endX - h.startX;
        const dz = h.endZ - h.startZ;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.2) {
          isMoving = true;
          const period = dist / Math.max(0.25, h.speed);
          const cyc = ((elapsed / period + h.phase * 0.15) % 2 + 2) % 2;
          const t = cyc <= 1 ? cyc : 2 - cyc;
          x = h.startX + dx * t;
          z = h.startZ + dz * t;
          yaw = cyc <= 1 ? Math.atan2(dx, dz) : Math.atan2(-dx, -dz);
        }
      }

      const y = h.yOverride !== undefined ? h.yOverride : groundHeightAt(x, z);
      const s = h.scale;
      const ph = h.phase;

      let lean = h.lean;
      let bob = 0;
      let armLAng = 0;
      let armRAng = 0;
      let legLAng = 0;
      let legRAng = 0;
      let torsoYOffset = 0;

      if (h.role === 'walk' || h.role === 'porter' || h.role === 'sedan_bearer' || h.role === 'driver') {
        const freq = h.role === 'porter' ? 4.8 : 3.8;
        const stride = isMoving ? 0.45 : 0.08;
        const wSin = Math.sin(elapsed * freq + ph);
        bob = Math.abs(wSin) * 0.035;
        legLAng = wSin * stride;
        legRAng = -wSin * stride;
        if (h.role === 'porter') {
          armLAng = -0.38 + wSin * 0.08;
          armRAng = -1.15; // one hand steadying shoulder pole
        } else if (h.role === 'sedan_bearer') {
          armLAng = -0.42;
          armRAng = -0.42;
        } else if (h.role === 'driver') {
          armLAng = -0.8 + wSin * 0.1;
          armRAng = -0.8 - wSin * 0.1;
        } else {
          armLAng = -wSin * stride * 0.85;
          armRAng = wSin * stride * 0.85;
        }
      } else if (h.role === 'tracker') {
        // Leaning steeply forward pulling towline!
        lean = 0.54;
        const wSin = Math.sin(elapsed * 2.6 + ph);
        bob = Math.abs(wSin) * 0.03;
        legLAng = wSin * 0.48;
        legRAng = -wSin * 0.48;
        armLAng = -0.75 + wSin * 0.12;
        armRAng = -0.75 - wSin * 0.12;
      } else if (h.role === 'boat_pole') {
        const thrust = Math.sin(elapsed * 1.9 + ph);
        lean = 0.18 + thrust * 0.22;
        armLAng = -0.9 + thrust * 0.45;
        armRAng = -1.1 + thrust * 0.45;
        legLAng = -0.15;
        legRAng = 0.15;
      } else if (h.role === 'boat_scull') {
        const row = Math.sin(elapsed * 2.4 + ph);
        lean = row * 0.24;
        armLAng = -0.85 + row * 0.35;
        armRAng = -0.85 + row * 0.35;
      } else if (h.role === 'seated_tea') {
        torsoYOffset = -0.26;
        legLAng = -1.35;
        legRAng = -1.35;
        armLAng = -0.55;
        armRAng = -0.75 + Math.sin(elapsed * 1.3 + ph) * 0.28; // raising cup!
      } else if (h.role === 'rider') {
        torsoYOffset = 0.26 + Math.abs(Math.sin(elapsed * 4.2 + ph)) * 0.04;
        legLAng = -0.55;
        legRAng = -0.55;
        armLAng = -0.6;
        armRAng = -0.65;
      } else if (h.role === 'bridge_watch') {
        lean = 0.28;
        armLAng = -0.7 + Math.sin(elapsed * 2.4 + ph) * 0.22;
        armRAng = -1.2 + Math.cos(elapsed * 2.8 + ph) * 0.35;
      } else if (h.role === 'vendor') {
        armLAng = -0.3 + Math.sin(elapsed * 2.1 + ph) * 0.25;
        armRAng = -0.6 + Math.cos(elapsed * 1.8 + ph) * 0.32;
      }

      const wy = y + bob + torsoYOffset * s;
      hWorldPos[i].set(x, wy, z);
      hWorldYaw[i] = yaw;
      hWorldLean[i] = lean;
      hWorldScale[i] = s;

      // Torso matrix
      _euler.set(lean, yaw, 0, 'YXZ');
      _quat.setFromEuler(_euler);
      _scale.set(s, s, s);
      _m.compose(hWorldPos[i], _quat, _scale);
      torsoInst.setMatrixAt(i, _m);

      // Helper for child limb offset in character local frame
      const setLimb = (inst: THREE.InstancedMesh, lx: number, ly: number, lz: number, rx: number) => {
        _pos.set(lx, ly, lz);
        _euler.set(rx, 0, 0);
        _subM.compose(_pos, _quat.setFromEuler(_euler), _scale.set(1, 1, 1));
        _subM.premultiply(_m);
        inst.setMatrixAt(i, _subM);
      };

      setLimb(armLInst, -0.21, 1.15, 0, armLAng);
      setLimb(armRInst, 0.21, 1.15, 0, armRAng);
      setLimb(legLInst, -0.09, 0.58, 0, legLAng);
      setLimb(legRInst, 0.09, 0.58, 0, legRAng);
    }

    torsoInst.instanceMatrix.needsUpdate = true;
    armLInst.instanceMatrix.needsUpdate = true;
    armRInst.instanceMatrix.needsUpdate = true;
    legLInst.instanceMatrix.needsUpdate = true;
    legRInst.instanceMatrix.needsUpdate = true;

    // Update Head InstancedMeshes
    for (const hg of headInstMap) {
      for (let k = 0; k < hg.indices.length; k++) {
        const i = hg.indices[k];
        const s = hWorldScale[i];
        _euler.set(hWorldLean[i], hWorldYaw[i], 0, 'YXZ');
        _quat.setFromEuler(_euler);
        _scale.set(s, s, s);
        _m.compose(hWorldPos[i], _quat, _scale);
        _pos.set(0, 1.35, 0);
        const headTurn = Math.sin(elapsed * 1.1 + i) * 0.14;
        _euler.set(0, headTurn, 0);
        _subM.compose(_pos, _quat.setFromEuler(_euler), _scale.set(1, 1, 1));
        _subM.premultiply(_m);
        hg.inst.setMatrixAt(k, _subM);
      }
      hg.inst.instanceMatrix.needsUpdate = true;
    }

    // Update Prop InstancedMeshes
    for (const pg of propInstMap) {
      for (let k = 0; k < pg.indices.length; k++) {
        const i = pg.indices[k];
        const s = hWorldScale[i];
        _euler.set(hWorldLean[i], hWorldYaw[i], 0, 'YXZ');
        _quat.setFromEuler(_euler);
        _scale.set(s, s, s);
        _m.compose(hWorldPos[i], _quat, _scale);
        pg.inst.setMatrixAt(k, _m);
      }
      pg.inst.instanceMatrix.needsUpdate = true;
    }

    // --- B. Update Animals ---
    for (const batch of animalBatches) {
      batch.specs.forEach((a, idx) => {
        let ax = a.x;
        let az = a.z;
        let yaw = a.yaw ?? 0;
        let moving = false;

        if (a.pathEndX !== undefined && a.pathEndZ !== undefined) {
          const dx = a.pathEndX - a.x;
          const dz = a.pathEndZ - a.z;
          const dist = Math.hypot(dx, dz);
          if (dist > 0.2) {
            moving = true;
            const speed = a.speed ?? 0.8;
            const period = dist / speed;
            const cyc = ((elapsed / period + (a.phase ?? idx * 0.3)) % 2 + 2) % 2;
            const t = cyc <= 1 ? cyc : 2 - cyc;
            ax = a.x + dx * t;
            az = a.z + dz * t;
            yaw = cyc <= 1 ? Math.atan2(dx, dz) : Math.atan2(-dx, -dz);
          }
        }

        const ay = groundHeightAt(ax, az);
        const gait = elapsed * (moving ? 4.4 : 1.2) + (a.phase ?? idx);
        const bob = moving ? Math.abs(Math.sin(gait)) * 0.03 : 0;

        _pos.set(ax, ay + bob, az);
        _euler.set(0, yaw, 0);
        _quat.setFromEuler(_euler);
        _scale.set(1, 1, 1);
        _m.compose(_pos, _quat, _scale);
        batch.bodyInst.setMatrixAt(idx, _m);

        const legOffsets: [number, number, number][] = [
          [-0.14, batch.shoulderH, batch.strideLen],
          [0.14, batch.shoulderH, batch.strideLen],
          [-0.14, batch.shoulderH, -batch.strideLen],
          [0.14, batch.shoulderH, -batch.strideLen],
        ];
        const legPhases = [0, Math.PI, Math.PI * 0.85, Math.PI * 1.85];
        const swing = moving ? 0.38 : 0.03;

        for (let l = 0; l < 4; l++) {
          _pos.set(legOffsets[l][0], legOffsets[l][1], legOffsets[l][2]);
          _euler.set(Math.sin(gait + legPhases[l]) * swing, 0, 0);
          _subM.compose(_pos, _quat.setFromEuler(_euler), _scale);
          _subM.premultiply(_m);
          batch.legs[l].setMatrixAt(idx, _subM);
        }
      });

      batch.bodyInst.instanceMatrix.needsUpdate = true;
      batch.legs.forEach((l) => (l.instanceMatrix.needsUpdate = true));
    }

    // --- C. Update Carts & Sedans ---
    for (const c of carts) {
      const sp = c.spec;
      let cx = sp.x;
      let cz = sp.z;
      let yaw = sp.yaw ?? 0;
      let distMoved = 0;

      if (sp.pathEndX !== undefined && sp.pathEndZ !== undefined) {
        const dx = sp.pathEndX - sp.x;
        const dz = sp.pathEndZ - sp.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.2) {
          const speed = sp.speed ?? 0.85;
          const period = dist / speed;
          const cyc = ((elapsed / period + (sp.phase ?? 0)) % 2 + 2) % 2;
          const t = cyc <= 1 ? cyc : 2 - cyc;
          cx = sp.x + dx * t;
          cz = sp.z + dz * t;
          yaw = cyc <= 1 ? Math.atan2(dx, dz) : Math.atan2(-dx, -dz);
          distMoved = (cyc <= 1 ? t : -t) * dist;
        }
      }

      const cy = groundHeightAt(cx, cz);
      const bob = sp.kind === 'sedan' ? Math.abs(Math.sin(elapsed * 4.2 + (sp.phase ?? 0))) * 0.05 : 0;
      c.group.position.set(cx, cy + bob, cz);
      c.group.rotation.y = yaw;

      for (const w of c.wheels) {
        w.rotation.x = distMoved / c.wheelRadius;
      }
    }

    // --- D. Update Smoke & Birds ---
    for (const sm of smokeSprites) {
      const life = ((elapsed * 0.22 + sm.offset) % 1 + 1) % 1;
      sm.sprite.position.set(
        sm.cx + life * 1.4 + Math.sin(elapsed * 0.9 + sm.offset * 6) * 0.28,
        sm.cy + life * 4.8,
        sm.cz + life * 0.4
      );
      const sc = 0.7 + life * 2.2;
      sm.sprite.scale.set(sc, sc, 1);
      sm.sprite.material.opacity = (1 - life) * 0.35;
    }

    for (let i = 0; i < birdCount; i++) {
      const b = birdOrbits[i];
      const ang = elapsed * b.speed + b.phase;
      const bx = b.cx + Math.cos(ang) * b.r;
      const bz = b.cz + Math.sin(ang) * b.r * 0.65;
      const by = b.cy + Math.sin(elapsed * 1.6 + b.phase) * 0.8;
      const flap = 0.55 + Math.sin(elapsed * 11 + i) * 0.45;
      _pos.set(bx, by, bz);
      _euler.set(0, -ang, Math.sin(elapsed * 1.5 + i) * 0.12);
      _scale.set(1, flap, 1);
      _m.compose(_pos, _quat.setFromEuler(_euler), _scale);
      birdInst.setMatrixAt(i, _m);
    }
    birdInst.instanceMatrix.needsUpdate = true;
  };

  return {
    humanCount: humanSpecs.length,
    animalCount: animalSpecs.length,
    cartCount: cartSpecs.length,
    update,
    dispose: () => {
      disposables.forEach((g) => g.dispose());
      texDisposables.forEach((t) => t.dispose());
      matDisposables.forEach((m) => m.dispose());
    },
  };
}
