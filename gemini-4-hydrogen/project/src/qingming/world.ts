import * as THREE from 'three';
import { MaterialLibrary } from './materials';

export const SCROLL_LENGTH = 480;
export const SCROLL_HALF_LENGTH = SCROLL_LENGTH / 2; // +240 (卷首 right) to -240 (卷尾 left)
export const WATER_LEVEL = -0.78;

export interface SectionInfo {
  id: 'suburbs' | 'bridge' | 'city';
  title: string;
  subtitle: string;
  uStart: number;
  uEnd: number;
}

export const SECTIONS: SectionInfo[] = [
  {
    id: 'suburbs',
    title: '郊野春色',
    subtitle: '卷首从京郊荒坡村野起笔，柳色初萌，溪桥蜿蜒。赶集的炭驴队、踏青扫墓归来的轿马仪仗与茅舍农家错落其间。',
    uStart: 0.0,
    uEnd: 0.26,
  },
  {
    id: 'bridge',
    title: '汴河虹桥',
    subtitle: '汴河斜穿画卷，漕船列岸，纤夫逆水拉纤。木拱虹桥凌空跨河，桥上车马行人摩肩接踵，桥下大船急忙放倒人字桅过桥。',
    uStart: 0.26,
    uEnd: 0.58,
  },
  {
    id: 'city',
    title: '城门街市',
    subtitle: '高耸的砖砌城台与木构城楼连通城外与汴京内城，驼队与大车川流不息。城内十字街口酒楼林立，彩楼欢门与市井百态尽收眼底。',
    uStart: 0.58,
    uEnd: 1.0,
  },
];

export interface LandmarkLabel {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
}

export function uToX(u: number): number {
  return SCROLL_HALF_LENGTH - u * SCROLL_LENGTH;
}

export function xToU(x: number): number {
  return THREE.MathUtils.clamp((SCROLL_HALF_LENGTH - x) / SCROLL_LENGTH, 0, 1);
}

export function getSectionAtU(u: number): SectionInfo {
  if (u < SECTIONS[0].uEnd) return SECTIONS[0];
  if (u < SECTIONS[1].uEnd) return SECTIONS[1];
  return SECTIONS[2];
}

/**
 * Center Z of the main Bian River (汴河) as a function of world X.
 * River enters foreground-right around x = +145 (z = +34), sweeps through
 * Rainbow Bridge at x = +4 (z = -2), and curves up-left toward x = -110 (z = -46).
 */
export function riverCenterZ(x: number): number {
  // Smooth S-curve matching slices 4, 3, 2
  const t = THREE.MathUtils.clamp((150 - x) / 270, 0, 1);
  return 34 - t * 80 + Math.sin(t * Math.PI * 1.35) * 4.5;
}

export function riverHalfWidth(x: number): number {
  if (x > 152 || x < -118) return 0;
  // Fade smoothly at entry/exit ends
  let edge = 1;
  if (x > 130) edge = THREE.MathUtils.smoothstep(152 - x, 0, 22);
  if (x < -90) edge = Math.min(edge, THREE.MathUtils.smoothstep(x + 118, 0, 28));
  // Widest around Rainbow Bridge (x ~ 0..35)
  const widen = Math.exp(-Math.pow((x - 16) / 48, 2)) * 3.5;
  return (9.8 + widen) * edge;
}

/**
 * Rural shallow creek at 卷首 (u = 0.00..0.14, x = +240..+172)
 */
export function creekCenterZ(x: number): number {
  return 20 + Math.sin((x - 175) * 0.06) * 3.5;
}

export function creekHalfWidth(x: number): number {
  if (x < 172 || x > 246) return 0;
  const fade = THREE.MathUtils.smoothstep(x - 172, 0, 14);
  return 4.5 * fade;
}

/**
 * City Moat (护城河) outside Bianjing Gate around x = -102..-140
 */
export function moatCenterX(z: number): number {
  return -121 - (z - 18) * 0.36;
}

/**
 * Main avenue Z coordinate outside and inside the city gate.
 */
export function mainRoadZ(x: number): number {
  if (x >= 120) {
    // Rural winding dirt path (郊野大路)
    return 4 + Math.sin((240 - x) * 0.045) * 3.5;
  }
  if (x >= 12) {
    // South riverside road leading toward Rainbow Bridge south approach
    return riverCenterZ(x) + riverHalfWidth(x) + 7.5;
  }
  if (x >= -10) {
    // Transition around Rainbow Bridge west square
    const t = THREE.MathUtils.smoothstep(12 - x, 0, 22);
    return THREE.MathUtils.lerp(13, 10, t);
  }
  if (x >= -150) {
    // Suburban avenue from bridgehead past 王员外家, Moat Bridge to City Gate
    const t = THREE.MathUtils.smoothstep(-10 - x, 0, 140);
    return 10 + Math.sin(t * Math.PI) * 5.0 - t * 4.0;
  }
  // Inside city avenue (城内大街)
  return 6 + Math.sin((-150 - x) * 0.05) * 1.2;
}

/**
 * Analytical terrain elevation at any (x, z).
 * Ensures every building, tree, character, and cart sits flush on the ground.
 */
export function groundHeightAt(x: number, z: number): number {
  let y = 0.0;

  // Gentle rural rolling hills in the far background (north, z < -34)
  if (z < -34) {
    const d = (-34 - z) / 50;
    y += d * d * 4.2 + Math.sin(x * 0.05) * 0.45 * d;
  }

  // Rural eastern knolls near 卷首 (x > 140)
  if (x > 135) {
    const east = THREE.MathUtils.smoothstep(x - 135, 0, 60);
    y += east * (0.35 + Math.sin(x * 0.08 + z * 0.07) * 0.42);
  }

  // Carve Bian River channel
  const rw = riverHalfWidth(x);
  if (rw > 0.1) {
    const dist = Math.abs(z - riverCenterZ(x));
    if (dist < rw + 4.5) {
      const bankT = THREE.MathUtils.clamp((dist - (rw - 1.5)) / 6.0, 0, 1);
      const riverDepth = -2.35;
      const factor = 1 - THREE.MathUtils.smoothstep(bankT, 0, 1);
      y = THREE.MathUtils.lerp(y, riverDepth, factor);
    }
  }

  // Carve 卷首 rural creek
  const cw = creekHalfWidth(x);
  if (cw > 0.1) {
    const dist = Math.abs(z - creekCenterZ(x));
    if (dist < cw + 3.0) {
      const bankT = THREE.MathUtils.clamp((dist - (cw - 1.0)) / 4.0, 0, 1);
      const factor = 1 - THREE.MathUtils.smoothstep(bankT, 0, 1);
      y = Math.min(y, THREE.MathUtils.lerp(y, -1.55, factor));
    }
  }

  // Carve City Moat (护城河) near x ~ -121
  if (x > -145 && x < -98) {
    const mx = moatCenterX(z);
    const mDist = Math.abs(x - mx);
    if (mDist < 8.5) {
      const bankT = THREE.MathUtils.clamp((mDist - 3.6) / 4.9, 0, 1);
      const factor = 1 - THREE.MathUtils.smoothstep(bankT, 0, 1);
      y = Math.min(y, THREE.MathUtils.lerp(y, -1.75, factor));
    }
  }

  // Flatten main road surface softly when not over river/moat
  const rz = mainRoadZ(x);
  if (Math.abs(z - rz) < 4.5 && y > -0.25) {
    y = Math.max(0.0, y * 0.25);
  }

  return y;
}

/**
 * Generates the terrain mesh (with vertex colors for aged-silk subtle tonal gradation),
 * the Bian River & creek water surfaces, and road ribbons.
 */
export function buildTerrainAndWater(
  parent: THREE.Object3D,
  mats: MaterialLibrary
): { disposables: THREE.BufferGeometry[] } {
  const disposables: THREE.BufferGeometry[] = [];

  // 1. Continuous terrain heightfield
  const width = 540;
  const depth = 170;
  const segX = 240;
  const segZ = 76;
  const terrainGeo = new THREE.PlaneGeometry(width, depth, segX, segZ);
  terrainGeo.rotateX(-Math.PI / 2);

  const pos = terrainGeo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const cLoam = new THREE.Color(0xc5ad84);
  const cBank = new THREE.Color(0x9a805a);
  const cHill = new THREE.Color(0xb29970);
  const cCity = new THREE.Color(0xbda782);
  const tmp = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i) - 8; // center around z = -8 (-93..+77)
    pos.setZ(i, z);
    const y = groundHeightAt(x, z);
    pos.setY(i, y);

    if (y < -0.3) {
      tmp.copy(cBank);
    } else if (x < -148) {
      tmp.copy(cCity);
    } else if (z < -30) {
      tmp.copy(cHill);
    } else {
      tmp.copy(cLoam);
    }
    // Subtle aged-silk warmth variation
    const n = Math.sin(x * 0.07) * Math.cos(z * 0.09) * 0.04;
    colors[i * 3] = THREE.MathUtils.clamp(tmp.r + n, 0, 1);
    colors[i * 3 + 1] = THREE.MathUtils.clamp(tmp.g + n, 0, 1);
    colors[i * 3 + 2] = THREE.MathUtils.clamp(tmp.b + n * 0.8, 0, 1);
  }
  terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  terrainGeo.computeVertexNormals();
  disposables.push(terrainGeo);

  const terrainMesh = new THREE.Mesh(terrainGeo, mats.ground);
  terrainMesh.receiveShadow = true;
  parent.add(terrainMesh);

  // 2. Water plane covering Bian River, 卷首 creek, and City Moat
  const waterGeo = new THREE.PlaneGeometry(540, 160, 180, 48);
  waterGeo.rotateX(-Math.PI / 2);
  waterGeo.translate(0, WATER_LEVEL, -5);
  disposables.push(waterGeo);

  const waterMesh = new THREE.Mesh(waterGeo, mats.water);
  waterMesh.receiveShadow = true;
  parent.add(waterMesh);

  // 3. Main road ribbon mesh (slightly raised +0.03 above terrain to avoid Z-fighting)
  const roadSegs = 160;
  const roadHalfW = 3.4;
  const rPos: number[] = [];
  const rUvs: number[] = [];
  const rIdx: number[] = [];

  for (let i = 0; i <= roadSegs; i++) {
    const t = i / roadSegs;
    const x = 236 - t * 474;
    // Skip across Rainbow Bridge river gap (x between 13 and -4)
    const zCenter = mainRoadZ(x);
    const w = x < -150 ? 4.4 : x < -10 ? 3.8 : 3.0;
    const yL = Math.max(0.03, groundHeightAt(x, zCenter - w) + 0.035);
    const yR = Math.max(0.03, groundHeightAt(x, zCenter + w) + 0.035);
    // Keep road ribbon submerged under river if crossing water channel
    const rw = riverHalfWidth(x);
    const inRiver = rw > 0.5 && Math.abs(zCenter - riverCenterZ(x)) < rw + 1.5;
    const inMoat = x > -136 && x < -108 && Math.abs(x - moatCenterX(zCenter)) < 5.0;
    const yOffset = inRiver || inMoat ? -1.4 : 0;

    rPos.push(x, yL + yOffset, zCenter - (w || roadHalfW));
    rPos.push(x, yR + yOffset, zCenter + (w || roadHalfW));
    rUvs.push(t * 24, 0);
    rUvs.push(t * 24, 1);

    if (i < roadSegs) {
      const a = i * 2;
      rIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(rPos, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(rUvs, 2));
  roadGeo.setIndex(rIdx);
  roadGeo.computeVertexNormals();
  disposables.push(roadGeo);

  const roadMesh = new THREE.Mesh(roadGeo, mats.road);
  roadMesh.receiveShadow = true;
  parent.add(roadMesh);

  // 4. Crossroads N-S street at 十字街口 (x = -182)
  const crossGeo = new THREE.PlaneGeometry(7.2, 68, 2, 16);
  crossGeo.rotateX(-Math.PI / 2);
  crossGeo.translate(-182, 0.04, 2);
  disposables.push(crossGeo);
  const crossMesh = new THREE.Mesh(crossGeo, mats.road);
  crossMesh.receiveShadow = true;
  parent.add(crossMesh);

  return { disposables };
}
