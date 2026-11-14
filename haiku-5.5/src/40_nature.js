/* ===== 40 树木与船体 =====
 * 老柳：粗矮歪斜的主干，放射出细枝，早春枝叶稀疏。
 * 枯树：多枝杈的杂树。船：两头上翘的漕船、带席篷与舵楼的船身。
 */

function willow(x, z, s = 1) {
  QM.willows = (QM.willows || 0) + 1;
  const G = sg('vc'), trunk = 0x5a4530, leaf = 0xa5a878;
  const base = [x, 0, z];
  const top = [x + rnd(-0.4, 0.4) * s, 4.0 * s, z + rnd(-0.3, 0.3) * s];
  G.stick(base, top, 0.42 * s, 0.22 * s, trunk, 5);
  G.stick([x, 2.2 * s, z], [x - 0.9 * s, 3.9 * s, z + 0.6 * s], 0.14 * s, 0.07 * s, trunk, 4);
  const n = rint(15, 21);
  for (let i = 0; i < n; i++) {
    const a = rnd(0, Math.PI * 2), L = rnd(3.5, 5.6) * s;
    const ca = Math.cos(a), sa = Math.sin(a);
    const p0 = [x + ca * 0.3 * s, rnd(2.8, 4.2) * s, z + sa * 0.3 * s];
    const p1 = [p0[0] + ca * L * 0.6, p0[1] + rnd(0.3, 0.9) * s, p0[2] + sa * L * 0.6];
    const p2 = [p1[0] + ca * L * 0.5, p1[1] - L * 0.8 * s, p1[2] + sa * L * 0.5];
    const p3 = [p2[0] + ca * 0.3, p2[1] - L * 0.6 * s, p2[2] + sa * 0.3];
    G.stick(p0, p1, 0.12 * s, 0.08 * s, trunk, 4);
    G.stick(p1, p2, 0.08 * s, 0.045 * s, trunk, 4);
    G.stick(p2, p3, 0.045 * s, 0.015 * s, trunk, 3);
    // 早春：只在枝梢点几片新叶
    for (const p of [p2, p3]) if (RND() < 0.75) G.box(p[0], p[1], p[2], 0.4 * s, 0.12 * s, 0.28 * s, leaf, rnd(0, 3), rnd(0, 3), 0);
    if (RND() < 0.5) G.stick(p2, [p2[0] + ca * 0.5, p2[1] - 1.1 * s, p2[2] + sa * 0.5], 0.03 * s, 0.01 * s, trunk, 3);
  }
}

function deadTree(x, z, s = 1, depth = 3) {
  QM.deadTrees = (QM.deadTrees || 0) + 1;
  const G = sg('vc'), col = 0x4a3d2e;
  G.stick([x, 0, z], [x + rnd(-0.3, 0.3), 3.5 * s, z], 0.5 * s, 0.28 * s, col, 6);
  const branch = (p, dir, len, r, dpt) => {
    if (dpt === 0 || len < 0.3) return;
    const q = [p[0] + dir[0] * len, p[1] + dir[1] * len, p[2] + dir[2] * len];
    G.stick(p, q, r, r * 0.7, col, 4);
    const k = rint(2, 3);
    for (let i = 0; i < k; i++) {
      const nd = nrm3([dir[0] + rnd(-0.8, 0.8), dir[1] + rnd(-0.1, 0.5), dir[2] + rnd(-0.8, 0.8)]);
      branch(q, nd, len * rnd(0.6, 0.78), r * 0.7, dpt - 1);
    }
  };
  for (let i = 0; i < 4; i++) {
    const a = rnd(0, Math.PI * 2);
    const dir = nrm3([Math.cos(a) * 0.8, rnd(0.3, 0.7), Math.sin(a) * 0.8]);
    branch([x, 3 * s, z], dir, rnd(1.6, 2.4) * s, 0.22 * s, depth);
  }
}

// 船体几何（局部坐标：船头朝 +X，水面在 y=0）
function boatGeo(kind) {
  const g = new Geo();
  if (kind === 'cargo') {
    const Lh = 11;
    const hull = new THREE.BoxGeometry(22, 2.2, 5.4, 16, 1, 3);
    const p = hull.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const u = x / Lh;
      const nz = y > 0 ? z * (1 - 0.35 * u * u) : z * (1 - 0.15 * u * u);   // 两端收窄
      const lift = 1.4 * Math.pow(Math.abs(u), 3) * (y > 0 ? 1 : 0.6);      // 首尾上翘
      p.setXYZ(i, x, y + lift, nz);
    }
    g.add(hull, M(0, 1.1, 0), 0x6b4d2c);
    // 席篷：半圆拱，跨在船身中段
    const cover = [];
    const xA = -7, xB = 7, N = 8;
    for (let i = 0; i < N; i++) {
      const a0 = i / N * Math.PI, a1 = (i + 1) / N * Math.PI;
      const P = (xx, a) => [xx, 2.2 + 1.8 * Math.sin(a), 2.3 * Math.cos(a)];
      cover.push([P(xA, a0), P(xB, a0), P(xB, a1)], [P(xA, a0), P(xB, a1), P(xA, a1)]);
    }
    g.tri(cover, 0xcdbb8e);
    // 货物：舱中的包裹
    g.box(-3, 1.9, 0, 4.2, 1.2, 3.6, 0xa58d5e).box(2.8, 1.9, 0, 3.0, 1.2, 3.6, 0x8c7048);
    // 舵楼与大舵
    g.box(Lh - 3.2, 3.0, 0, 3.4, 1.6, 3.6, 0x5a4a34);
    g.tri(roofTris(3.8, 3.4, 3.8, 0.7, 0.3, 0.2), 0x4a3a28);
    g.stick([Lh - 1.2, 1.0, 0], [Lh + 1.2, -1.2, 0], 0.12, 0.1, 0x4a3524, 4);
    g.box(Lh + 1.0, -0.6, 0, 0.2, 2.2, 1.4, 0x3f2c1b);
    // 人字桅（立起的一根桅杆，不张帆）
    g.stick([-4, 2.2, 0], [-4.6, 11.5, 0], 0.13, 0.08, 0x4a3524, 5);
  } else {
    const hull = new THREE.BoxGeometry(9, 1.0, 2.2, 10, 1, 2);
    const p = hull.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const u = x / 4.5;
      p.setXYZ(i, x, y + 0.5 * Math.pow(Math.abs(u), 3) * (y > 0 ? 1 : 0.6), z * (1 - 0.2 * u * u));
    }
    g.add(hull, M(0, 0.5, 0), 0x6e5030);
    g.stick([-1.0, 0.7, 1.2], [-2.8, 0.2, 2.4], 0.05, 0.04, 0x4a3524, 4);   // 橹
    g.stick([-1.0, 0.7, -1.2], [-2.8, 0.2, -2.4], 0.05, 0.04, 0x4a3524, 4);
  }
  return g.build();
}
