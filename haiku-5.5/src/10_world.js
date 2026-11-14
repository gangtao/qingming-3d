/* ===== 10 世界：坐标、地形、河道、道路、虹桥 =====
 * X 沿卷轴：X=0 是卷首（郊野，画卷最右端），X=L 是卷尾（城门街市）。
 * Z 为纵深：河在北（z 约 -22），大路在南（z 约 20），城市沿街布在路两侧。
 * Y 向上，1 单位约 1 米。
 */
QM.riverZ = (x) => -22 + 3 * Math.sin(x / 150);
QM.riverW = (x) => 30 + 10 * smooth(900, 1150, x);          // 河面宽度，近城处略宽
QM.roadZ = (x) => 20 + 6 * smooth(780, 820, x);              // 大路中心线（进城后移到街心）
QM.roadHW = (x) => (9 + 5 * smooth(800, 860, x)) / 2;        // 路半宽
QM.BR = { x: 740, hw: 6, z0: -54, z1: 20, rise: 15 };       // 虹桥：跨河，拱洞顺河向（X）
QM.bridgeY = (z) => {
  const b = QM.BR, c = (b.z0 + b.z1) / 2, h = (b.z1 - b.z0) / 2;
  const t = clamp((z - c) / h, -1, 1);
  return 0.7 + b.rise * Math.sqrt(1 - t * t);
};

// 沿 X 方向的一条带状面（河、路）
function ribbon(g, x0, x1, step, cz, hw, y, col, uvS = 0) {
  const tris = [];
  for (let x = x0; x < x1; x += step) {
    const xa = x, xb = Math.min(x1, x + step);
    const za = cz(xa), zb = cz(xb), wa = hw(xa), wb = hw(xb);
    const a = [xa, y, za - wa], b = [xb, y, zb - wb], c = [xb, y, zb + wb], d = [xa, y, za + wa];
    tris.push([a, b, c], [a, c, d]);
  }
  g.add(geoFromTris(tris, uvS ? (p) => [p[0] / uvS, p[2] / uvS] : null), null, col);
}

function buildGround() {
  // 大地：一整块绢底
  const g = sg('silk');
  const x0 = -300, x1 = 1900, z0 = -260, z1 = 200;
  g.tri([[[x0, 0, z0], [x1, 0, z0], [x1, 0, z1]], [[x0, 0, z0], [x1, 0, z1], [x0, 0, z1]]],
    0xffffff, (p) => [p[0] / 60, p[2] / 60]);
}

function buildRiverAndRoads() {
  // 河岸线（略深的土色）与河水
  ribbon(sg('vc'), 0, QM.L, 6, QM.riverZ, (x) => QM.riverW(x) / 2 + 1.6, 0.012, 0x7d6b48);
  ribbon(sg('water'), 0, QM.L, 6, QM.riverZ, (x) => QM.riverW(x) / 2, 0.02, 0xffffff, 24);
  // 大路：土路，中间略浅
  ribbon(sg('vc'), 0, QM.L, 6, QM.roadZ, QM.roadHW, 0.03, 0xa58c63);
  ribbon(sg('vc'), 0, QM.L, 6, QM.roadZ, (x) => QM.roadHW(x) * 0.45, 0.035, 0xb89e72);
  // 城内十字街：沿 Z 方向的一条路
  sg('vc').box(1340, 0.05, 40, 9, 0.02, 120, 0xa58c63);
}

function buildHills() {
  // 北岸远山与土丘（淡色，雾化后远去）
  const g = sg('vc');
  for (let i = 0; i < 40; i++) {
    const x = rnd(-100, 1700), z = rnd(-170, -250), r = rnd(50, 95), h = rnd(10, 22);
    g.add(new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), M(x, 0, z, 0, 0, 0, r, h, r * 0.8),
      pick([0x7a6b4c, 0x726446, 0x85765a]));
  }
  for (let i = 0; i < 30; i++) {
    const x = rnd(-80, 1650), z = rnd(-100, -140), r = rnd(10, 20), h = rnd(3, 7);
    g.add(new THREE.SphereGeometry(1, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), M(x, 0, z, 0, 0, 0, r, h, r * 0.7), 0x8a7b58);
  }
  // 田畦：南岸几块较深的地
  for (let i = 0; i < 16; i++) {
    const x = rnd(120, 700), z = rnd(34, 62);
    g.box(x, 0.02, z, rnd(12, 26), 0.03, rnd(6, 10), 0x9a8452, 0, rnd(-0.06, 0.06), 0);
  }
}

function buildBridge() {
  // 虹桥：拱形桥面（一块带厚度的拱板），拱洞顺河向 X 贯通，船从桥下穿过。
  const b = QM.BR, g = sg('vc2');
  const xa = b.x - b.hw, xb = b.x + b.hw, N = 56;
  const zs = []; for (let i = 0; i <= N; i++) zs.push(lerp(b.z0, b.z1, i / N));
  const top = (z) => QM.bridgeY(z), bot = (z) => QM.bridgeY(z) - 1.3;
  const deck = [], soffit = [], sideA = [], sideB = [];
  for (let i = 0; i < N; i++) {
    const za = zs[i], zb = zs[i + 1];
    const ta = top(za), tb = top(zb), ba = bot(za), bb = bot(zb);
    deck.push([[xa, ta, za], [xb, ta, za], [xb, tb, zb]], [[xa, ta, za], [xb, tb, zb], [xa, tb, zb]]);
    soffit.push([[xa, ba, za], [xb, bb, zb], [xb, ba, za]], [[xa, ba, za], [xa, bb, zb], [xb, bb, zb]]);
    sideA.push([[xa, ba, za], [xa, ta, za], [xa, tb, zb]], [[xa, ba, za], [xa, tb, zb], [xa, bb, zb]]);
    sideB.push([[xb, ba, za], [xb, tb, zb], [xb, ta, za]], [[xb, ba, za], [xb, bb, zb], [xb, tb, zb]]);
  }
  g.tri(deck, 0x8e6d48);
  g.tri(soffit, 0x4e3a25);
  g.tri(sideA, 0x6b5238);
  g.tri(sideB, 0x6b5238);
  // 栏杆：望柱 + 扶手（两侧）
  for (const x of [xa + 0.4, xb - 0.4]) {
    let prev = null;
    for (let i = 0; i <= N; i += 2) {
      const z = zs[i], y = top(z);
      g.stick([x, y, z], [x, y + 1.05, z], 0.07, 0.07, 0x3f2c1b, 4);
      const tp = [x, y + 1.05, z];
      if (prev) g.stick(prev, tp, 0.05, 0.05, 0x3f2c1b, 4);
      prev = tp;
    }
  }
  // 桥两端的石台与岸
  const st = sg('vc');
  st.box(b.x, 0.7, b.z0 - 1.4, 14, 2.2, 3, 0x9e9078);
  st.box(b.x, 0.7, b.z1 + 1.4, 14, 2.2, 3, 0x9e9078);
}

function buildWorldStatic() {
  buildGround();
  buildRiverAndRoads();
  buildHills();
  buildBridge();
}
