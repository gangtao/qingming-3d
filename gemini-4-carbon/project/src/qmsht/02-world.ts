import * as THREE from 'three';
import { SILK_PALETTE } from './01-primitives';

/**
 * 模块二：世界坐标和地形（02-world.ts）
 * 严格按照故宫藏本《清明上河图》全卷比例映射：
 * - u = 1.00 (X = +240) 对应卷首最右端（郊野疏林、小桥驴队）
 * - u = 0.505 (X = +2.5) 对应全卷视觉中心（斜跨汴河的木构虹桥）
 * - u = 0.180 (X = -153.5) 对应砖筑城台与木构城门楼
 * - u = 0.00 (X = -240) 对应卷尾最左端（赵太丞家与十字街西口）
 */

export const WORLD_BOUNDS = {
  scrollMinX: -240,
  scrollMaxX: 240,
  scrollWidth: 480,
  scrollMinZ: -23,
  scrollMaxZ: 23,
  terrainMinX: -315,
  terrainMaxX: 315,
  terrainMinZ: -72,
  terrainMaxZ: 62,
  waterY: -0.42,
};

export function uToWorldX(u: number): number {
  return WORLD_BOUNDS.scrollMinX + THREE.MathUtils.clamp(u, 0, 1) * WORLD_BOUNDS.scrollWidth;
}

export function worldXToU(x: number): number {
  return THREE.MathUtils.clamp(
    (x - WORLD_BOUNDS.scrollMinX) / WORLD_BOUNDS.scrollWidth,
    0,
    1,
  );
}

// 汴河中心线折点 [x, z, halfWidth]
const BIAN_SPLINE_RAW: Array<[number, number, number]> = [
  [158, 42, 8.0],
  [136, 26, 8.5],
  [120, 17.5, 9.4],
  [102, 11.5, 10.4],
  [78, 9.8, 10.8],
  [52, 8.2, 10.2],
  [28, 5.2, 9.0],
  [11, 1.8, 8.3],
  [2.5, 0.0, 8.1], // 虹桥正下方
  [-7, -2.3, 8.3],
  [-20, -5.0, 8.8],
  [-38, -6.8, 9.2],
  [-53, -12.8, 8.6],
  [-66, -24.5, 8.2],
  [-82, -48.0, 8.8],
  [-98, -74.0, 9.5],
];

const bianCurvePoints = BIAN_SPLINE_RAW.map(([x, z]) => new THREE.Vector3(x, 0, z));
export const BIAN_RIVER_CURVE = new THREE.CatmullRomCurve3(bianCurvePoints, false, 'catmullrom', 0.45);

interface RiverSample {
  x: number;
  z: number;
  tx: number;
  tz: number;
  halfWidth: number;
  t: number;
}

const BIAN_SAMPLES: RiverSample[] = [];
const SAMPLE_COUNT = 260;
for (let i = 0; i <= SAMPLE_COUNT; i++) {
  const t = i / SAMPLE_COUNT;
  const pt = BIAN_RIVER_CURVE.getPoint(t);
  const tan = BIAN_RIVER_CURVE.getTangent(t);
  // 插值半宽
  const segF = t * (BIAN_SPLINE_RAW.length - 1);
  const idx = Math.min(Math.floor(segF), BIAN_SPLINE_RAW.length - 2);
  const frac = segF - idx;
  const hw = THREE.MathUtils.lerp(BIAN_SPLINE_RAW[idx][2], BIAN_SPLINE_RAW[idx + 1][2], frac);
  BIAN_SAMPLES.push({
    x: pt.x,
    z: pt.z,
    tx: tan.x,
    tz: tan.z,
    halfWidth: hw,
    t,
  });
}

export function queryBianRiver(x: number, z: number): {
  dist: number;
  halfWidth: number;
  signedSide: number;
  closestX: number;
  closestZ: number;
  tangentX: number;
  tangentZ: number;
  t: number;
} {
  let bestIdx = 0;
  let bestD2 = Infinity;
  for (let i = 0; i < BIAN_SAMPLES.length; i++) {
    const s = BIAN_SAMPLES[i];
    const dx = x - s.x;
    const dz = z - s.z;
    const d2 = dx * dx + dz * dz;
    if (d2 < bestD2) {
      bestD2 = d2;
      bestIdx = i;
    }
  }
  const s = BIAN_SAMPLES[bestIdx];
  const dx = x - s.x;
  const dz = z - s.z;
  const dist = Math.sqrt(bestD2);
  // 叉积判断南北岸
  const cross = s.tx * dz - s.tz * dx;
  return {
    dist,
    halfWidth: s.halfWidth,
    signedSide: cross >= 0 ? 1 : -1,
    closestX: s.x,
    closestZ: s.z,
    tangentX: s.tx,
    tangentZ: s.tz,
    t: s.t,
  };
}

// 虹桥几何规范（斜跨汴河：西南岸桥头 (-5.5, +9.2) 至 东北岸桥头 (+10.5, -9.2)）
export const RAINBOW_BRIDGE = {
  swX: -5.5,
  swZ: 9.2,
  neX: 10.5,
  neZ: -9.2,
  centerX: 2.5,
  centerZ: 0.0,
  archHalfSpan: 12.2, // 木拱净跨半长 (~24.4m)
  rampHalfSpan: 17.2, // 含两端引道总半长 (~34.4m)
  deckHalfWidth: 3.15, // 桥面总宽 6.3m
  crownHeight: 4.25, // 桥心桥面标高
};

const rbDx = RAINBOW_BRIDGE.neX - RAINBOW_BRIDGE.swX;
const rbDz = RAINBOW_BRIDGE.neZ - RAINBOW_BRIDGE.swZ;
const rbLen = Math.hypot(rbDx, rbDz);
export const RB_DIR_X = rbDx / rbLen; // +0.656
export const RB_DIR_Z = rbDz / rbLen; // -0.755
export const RB_PERP_X = -RB_DIR_Z; // +0.755 (指向下游东南侧)
export const RB_PERP_Z = RB_DIR_X; // +0.656
export const RB_YAW = Math.atan2(RB_DIR_Z, RB_DIR_X);

/**
 * 将世界坐标投影到虹桥局部坐标系：
 * s: 沿桥长方向距离桥心 (-rampHalfSpan..+rampHalfSpan，负为西南桥头，正为东北桥头)
 * w: 垂直桥长方向偏距 (-deckHalfWidth..+deckHalfWidth，正为下游侧)
 */
export function toRainbowBridgeLocal(x: number, z: number): { s: number; w: number } {
  const dx = x - RAINBOW_BRIDGE.centerX;
  const dz = z - RAINBOW_BRIDGE.centerZ;
  return {
    s: dx * RB_DIR_X + dz * RB_DIR_Z,
    w: dx * RB_PERP_X + dz * RB_PERP_Z,
  };
}

export function fromRainbowBridgeLocal(s: number, w: number): { x: number; z: number } {
  return {
    x: RAINBOW_BRIDGE.centerX + s * RB_DIR_X + w * RB_PERP_X,
    z: RAINBOW_BRIDGE.centerZ + s * RB_DIR_Z + w * RB_PERP_Z,
  };
}

export function rainbowBridgeElevationByS(s: number): number {
  const absS = Math.abs(s);
  if (absS >= RAINBOW_BRIDGE.rampHalfSpan) return 0;
  // 平滑拱形曲线：两端引道缓坡衔接地面，中部圆润拱起
  const u = absS / RAINBOW_BRIDGE.rampHalfSpan;
  const smooth = Math.cos(u * Math.PI * 0.5);
  return RAINBOW_BRIDGE.crownHeight * Math.pow(smooth, 1.55);
}

// 护城河与护城河平桥（位于城门外侧 X ≈ -133）
export const MOAT_BRIDGE = {
  centerX: -133.0,
  centerZ: 16.0,
  halfSpanX: 5.8,
  halfWidthZ: 2.3,
  deckY: 0.62,
};

// 卷首乡间小木桥（位于 X ≈ +218, Z ≈ +5.5）
export const RURAL_BRIDGE = {
  centerX: 218.0,
  centerZ: 5.5,
  halfSpanX: 3.4,
  halfWidthZ: 1.25,
  deckY: 0.42,
};

function queryMoatChannel(x: number, z: number): { dist: number; halfWidth: number } {
  // 护城河南段水渠（z >= 10.5，穿过护城河平桥底部）与北段城墙外侧护城河（z <= -6.5）
  // 中间 z ∈ (-6.5, 10.5) 为进出城门的夯土官道陆桥
  const channelCenterX = -133.0 - z * 0.08;
  if (z >= 10.2) {
    const endFade = THREE.MathUtils.smoothstep(z, 10.2, 12.2);
    return { dist: Math.abs(x - channelCenterX), halfWidth: 4.0 * endFade };
  }
  if (z <= -7.2) {
    const endFade = 1 - THREE.MathUtils.smoothstep(z, -9.5, -7.2);
    return { dist: Math.abs(x - channelCenterX), halfWidth: 4.2 * endFade };
  }
  return { dist: 999, halfWidth: 0 };
}

function queryRuralBrook(x: number, z: number): { dist: number; halfWidth: number } {
  if (x < 168 || x > 265) return { dist: 999, halfWidth: 0 };
  // 卷首前景浅滩与蜿蜒溪水：从 (250, 2) 经小木桥 (218, 5.5) 流向 (182, 15)
  const brookZ =
    x > 218
      ? 5.5 - (x - 218) * 0.12 + Math.sin(x * 0.12) * 1.1
      : 5.5 + (218 - x) * 0.27 + Math.sin(x * 0.1) * 1.4;
  const hw = x < 204 ? 5.8 : 2.3;
  return { dist: Math.abs(z - brookZ), halfWidth: hw };
}

/**
 * 计算自然地面标高（不含木桥桥面，用于建筑地基、树根与地形网格）
 */
export function groundHeightAt(x: number, z: number): number {
  // 1. 汴河河槽下挖
  if (x > -115 && x < 175) {
    const r = queryBianRiver(x, z);
    if (r.dist < r.halfWidth + 3.2) {
      const bankT = THREE.MathUtils.smoothstep(r.dist, r.halfWidth - 1.2, r.halfWidth + 2.8);
      const bedY = -1.85;
      const bankTopY = 0.22;
      return THREE.MathUtils.lerp(bedY, bankTopY, bankT);
    }
  }

  // 2. 护城河槽
  if (x > -148 && x < -118) {
    const m = queryMoatChannel(x, z);
    if (m.halfWidth > 0.2 && m.dist < m.halfWidth + 2.0) {
      const bankT = THREE.MathUtils.smoothstep(m.dist, m.halfWidth - 0.6, m.halfWidth + 1.8);
      return THREE.MathUtils.lerp(-1.35, 0.14, bankT);
    }
  }

  // 3. 卷首乡间溪流浅滩
  if (x > 168) {
    const b = queryRuralBrook(x, z);
    if (b.halfWidth > 0.2 && b.dist < b.halfWidth + 2.2) {
      const bankT = THREE.MathUtils.smoothstep(b.dist, b.halfWidth - 0.8, b.halfWidth + 2.0);
      return THREE.MathUtils.lerp(-0.92, 0.12, bankT);
    }
  }

  // 4. 柔和自然微地形起伏（郊野农庄土台略高，城内十字街平坦微拱）
  let h = 0.12;
  if (x > 118) {
    const ruralFactor = THREE.MathUtils.smoothstep(x, 118, 155);
    const mound =
      Math.sin(x * 0.045) * Math.cos(z * 0.08) * 0.34 +
      (z < 2 ? 0.28 : 0.0) +
      Math.sin(x * 0.11 + z * 0.09) * 0.1;
    h += mound * ruralFactor;
  } else {
    h += Math.sin(x * 0.03 + z * 0.05) * 0.06;
  }

  // 远景南北边界柔和隆起，避免生硬切边
  if (z < -28) {
    h += THREE.MathUtils.smoothstep(-z, 28, 68) * 1.65 + Math.sin(x * 0.05) * 0.25;
  } else if (z > 28) {
    h += THREE.MathUtils.smoothstep(z, 28, 58) * 0.9;
  }

  return h;
}

/**
 * 计算行人、车马可行走标高（自动识别虹桥桥面、护城河平桥、乡间小木桥）
 */
export function walkableHeightAt(x: number, z: number): number {
  const g = groundHeightAt(x, z);

  // 虹桥桥面判定
  if (x > -24 && x < 29 && z > -24 && z < 24) {
    const { s, w } = toRainbowBridgeLocal(x, z);
    if (Math.abs(s) <= RAINBOW_BRIDGE.rampHalfSpan && Math.abs(w) <= RAINBOW_BRIDGE.deckHalfWidth + 0.3) {
      return Math.max(g, rainbowBridgeElevationByS(s) + 0.12);
    }
  }

  // 护城河平桥判定
  if (
    Math.abs(x - MOAT_BRIDGE.centerX) <= MOAT_BRIDGE.halfSpanX + 1.6 &&
    Math.abs(z - MOAT_BRIDGE.centerZ) <= MOAT_BRIDGE.halfWidthZ + 0.25
  ) {
    const ramp =
      1 -
      THREE.MathUtils.smoothstep(
        Math.abs(x - MOAT_BRIDGE.centerX),
        MOAT_BRIDGE.halfSpanX - 0.6,
        MOAT_BRIDGE.halfSpanX + 1.6,
      );
    return Math.max(g, THREE.MathUtils.lerp(0.14, MOAT_BRIDGE.deckY, ramp));
  }

  // 乡间小木桥判定
  if (
    Math.abs(x - RURAL_BRIDGE.centerX) <= RURAL_BRIDGE.halfSpanX + 1.2 &&
    Math.abs(z - RURAL_BRIDGE.centerZ) <= RURAL_BRIDGE.halfWidthZ + 0.25
  ) {
    const ramp =
      1 -
      THREE.MathUtils.smoothstep(
        Math.abs(x - RURAL_BRIDGE.centerX),
        RURAL_BRIDGE.halfSpanX - 0.5,
        RURAL_BRIDGE.halfSpanX + 1.2,
      );
    return Math.max(g, THREE.MathUtils.lerp(0.12, RURAL_BRIDGE.deckY, ramp));
  }

  return g;
}

/**
 * 判断某坐标是否处于主干街路或乡间土路上，用于地形顶点设色
 */
function roadFactorAt(x: number, z: number): number {
  let f = 0;

  // 1. 城内东大街至卷尾十字街（X: -245..-148, Z ≈ +4.5）
  if (x >= -255 && x <= -146) {
    f = Math.max(f, 1 - THREE.MathUtils.smoothstep(Math.abs(z - 4.5), 3.4, 6.2));
  }
  // 城内十字街南北向横街（X ≈ -212 和 X ≈ -185）
  if (Math.abs(x - -212) < 6) {
    f = Math.max(f, 1 - THREE.MathUtils.smoothstep(Math.abs(x - -212), 2.5, 4.8));
  }

  // 2. 城门外大道经修车坊至虹桥西南桥头（X: -148..-6）
  if (x > -148 && x <= -5) {
    const targetZ = THREE.MathUtils.lerp(5.2, 9.2, THREE.MathUtils.clamp((x + 148) / 142, 0, 1));
    f = Math.max(f, 1 - THREE.MathUtils.smoothstep(Math.abs(z - targetZ), 3.2, 6.0));
  }

  // 3. 护城河平桥前景支路（X: -150..-108, Z ≈ 16）
  if (x > -150 && x < -105) {
    f = Math.max(f, 1 - THREE.MathUtils.smoothstep(Math.abs(z - 16.0), 2.2, 4.2));
  }

  // 4. 虹桥东北岸接河北岸码头与纤道（X: +8..+125）
  if (x >= 7 && x <= 126) {
    const r = queryBianRiver(x, z);
    const northRoadZ = r.closestZ - r.halfWidth - 3.6;
    f = Math.max(f, 1 - THREE.MathUtils.smoothstep(Math.abs(z - northRoadZ), 2.2, 4.6));
  }

  // 5. 郊野春色两条乡间土路（前景踏青路与中景驮炭路）
  if (x > 112 && x < 248) {
    const southLaneZ = 12.0 - THREE.MathUtils.clamp((x - 120) / 110, 0, 1) * 6.5 + Math.sin(x * 0.06) * 1.4;
    f = Math.max(f, (1 - THREE.MathUtils.smoothstep(Math.abs(z - southLaneZ), 1.6, 3.5)) * 0.85);

    const northLaneZ = -3.5 + Math.cos(x * 0.05) * 2.2;
    f = Math.max(f, (1 - THREE.MathUtils.smoothstep(Math.abs(z - northLaneZ), 1.4, 3.2)) * 0.75);
  }

  return THREE.MathUtils.clamp(f, 0, 1);
}

/**
 * 构建整幅绢本大地与汴河、护城河、郊野溪流水面
 */
export function buildWorldTerrainAndWater(
  parent: THREE.Object3D,
  uTime: { value: number },
): { terrainMesh: THREE.Mesh; waterMesh: THREE.Mesh } {
  const width = WORLD_BOUNDS.terrainMaxX - WORLD_BOUNDS.terrainMinX;
  const depth = WORLD_BOUNDS.terrainMaxZ - WORLD_BOUNDS.terrainMinZ;
  const segX = 420;
  const segZ = 96;

  const geo = new THREE.PlaneGeometry(width, depth, segX, segZ);
  geo.rotateX(-Math.PI / 2);
  geo.translate(
    (WORLD_BOUNDS.terrainMinX + WORLD_BOUNDS.terrainMaxX) * 0.5,
    0,
    (WORLD_BOUNDS.terrainMinZ + WORLD_BOUNDS.terrainMaxZ) * 0.5,
  );

  const pos = geo.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);

  const cEarth = new THREE.Color(SILK_PALETTE.earthBase);
  const cRoad = new THREE.Color(SILK_PALETTE.roadClay);
  const cMud = new THREE.Color(SILK_PALETTE.mudBank);
  const cSpringMoss = new THREE.Color(0x9e956d); // 极淡早春草色（融入暖褐绢底）
  const cField = new THREE.Color(0xad976f);
  const tmpColor = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = groundHeightAt(x, z);
    pos.setY(i, y);

    tmpColor.copy(cEarth);

    // 田畴纹理（郊野北侧阡陌）
    if (x > 118 && x < 215 && z < -2 && y > 0.05) {
      const furrow = 0.5 + 0.5 * Math.sin(z * 2.4 + x * 0.15);
      tmpColor.lerp(cField, 0.45 * furrow);
      tmpColor.lerp(cSpringMoss, 0.18);
    } else if (x > 130 && y > 0.1) {
      const grassPatch = 0.5 + 0.5 * Math.sin(x * 0.17 + z * 0.23);
      tmpColor.lerp(cSpringMoss, 0.22 * grassPatch);
    }

    // 道路浅黄夯土色
    const rf = roadFactorAt(x, z);
    if (rf > 0.01 && y > -0.1) {
      tmpColor.lerp(cRoad, rf * 0.72);
    }

    // 临水湿泥驳岸深褐色
    if (y < 0.08) {
      const mudT = THREE.MathUtils.clamp((0.08 - y) / 0.85, 0, 1);
      tmpColor.lerp(cMud, mudT * 0.88);
    }

    // 细微绢本颗粒明暗
    const grain = (Math.sin(x * 1.9 + z * 2.3) * 0.5 + Math.cos(x * 0.7 - z * 1.3) * 0.5) * 0.025;
    colors[i * 3] = THREE.MathUtils.clamp(tmpColor.r + grain, 0, 1);
    colors[i * 3 + 1] = THREE.MathUtils.clamp(tmpColor.g + grain, 0, 1);
    colors[i * 3 + 2] = THREE.MathUtils.clamp(tmpColor.b + grain, 0, 1);
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.93,
    metalness: 0.0,
  });

  const terrainMesh = new THREE.Mesh(geo, terrainMat);
  terrainMesh.receiveShadow = true;
  parent.add(terrainMesh);

  // 水面网格：仅在有水区域覆盖或低于陆地自然裁剪，同时附加微波光与水流纹理
  const waterGeo = new THREE.PlaneGeometry(width, depth, 240, 64);
  waterGeo.rotateX(-Math.PI / 2);
  waterGeo.translate(
    (WORLD_BOUNDS.terrainMinX + WORLD_BOUNDS.terrainMaxX) * 0.5,
    WORLD_BOUNDS.waterY,
    (WORLD_BOUNDS.terrainMinZ + WORLD_BOUNDS.terrainMaxZ) * 0.5,
  );

  const waterMat = new THREE.MeshStandardMaterial({
    color: SILK_PALETTE.waterSilt,
    roughness: 0.24,
    metalness: 0.12,
    transparent: true,
    opacity: 0.88,
  });

  waterMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uTime;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nvarying vec3 vWorldPosW;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vec4 wpW = modelMatrix * vec4(transformed, 1.0);
         float ripple = sin(wpW.x * 1.35 + uTime * 1.8) * cos(wpW.z * 1.65 - uTime * 1.3) * 0.028;
         transformed.y += ripple;
         vWorldPosW = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nvarying vec3 vWorldPosW;')
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         float shimmer = sin(vWorldPosW.x * 3.4 + uTime * 2.4 + sin(vWorldPosW.z * 2.2)) * 0.5 + 0.5;
         diffuseColor.rgb += vec3(0.055, 0.048, 0.032) * pow(shimmer, 3.0);`,
      );
  };

  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.receiveShadow = true;
  parent.add(waterMesh);

  return { terrainMesh, waterMesh };
}
