// ============================================================
// 40_boats.js — 汴河漕船、客船、小船
// 船身两头上翘，拱形席篷、舵楼、大舵、人字桅、摇橹
// ============================================================

const BOATS = [];
const BOAT_MATS = {};

function boatHull(BK, BV, o) {
  const L = o.len, Bm = o.beam, D = o.depth, rise = o.rise;
  const hb = (u) => Bm / 2 * (0.42 + 0.58 * Math.pow(Math.max(0, 1 - u * u), 0.55));
  const sh = (u) => D + rise * Math.pow(Math.abs(u), 2.6) * (u > 0 ? 1.0 : 0.85);
  const kb = (u) => 0.95 * Math.pow(Math.abs(u), 3.2);
  const Nu = 26, Nv = 13;
  const pts = [], uvs = [], cols = [];
  const hullC = o.hullColor || 0x8b6f50;
  for (let i = 0; i < Nu; i++) {
    const u = -1 + 2 * i / (Nu - 1);
    let gir = 0, prev = null;
    for (let j = 0; j < Nv; j++) {
      const ph = Math.PI * j / (Nv - 1);
      const cs = Math.cos(ph);
      const x = hb(u) * Math.sign(cs) * Math.pow(Math.abs(cs), 0.55);
      const y = sh(u) - (sh(u) - kb(u)) * Math.pow(Math.sin(ph), 0.7);
      const p = V(x, y, u * L / 2);
      if (prev) gir += p.distanceTo(prev);
      prev = p;
      pts.push(p);
      uvs.push(u * L / 4, gir / 1.1);
      cols.push(jit(hullC, 0.03));
    }
  }
  BK.grid(pts, Nu, Nv, cols, uvs, null, true);
  // 船头船尾封板
  for (const end of [0, Nu - 1]) {
    const ring = pts.slice(end * Nv, end * Nv + Nv);
    const c = V(0, (ring[0].y + ring[Math.floor(Nv / 2)].y) / 2, ring[0].z);
    for (let j = 0; j < Nv - 1; j++) BV.tri(c, ring[j], ring[j + 1], 0x6e553c);
    BV.tri(ring[0], ring[Nv - 1], c, 0x6e553c);
  }
  // 甲板
  const dp = [], du = [], dc = [];
  for (let i = 0; i < Nu; i++) {
    const u = -1 + 2 * i / (Nu - 1);
    for (let j = 0; j < 2; j++) {
      dp.push(V((j ? 1 : -1) * hb(u) * 0.96, sh(u) - 0.12, u * L / 2));
      du.push(j * 2, u * L / 2);
      dc.push(jit(0xb39a76, 0.03));
    }
  }
  BK.grid(dp, Nu, 2, dc, du, null, true);
  // 舷边护木
  for (const sx of [1, -1]) {
    let prev = null;
    for (let i = 0; i < Nu; i++) {
      const u = -1 + 2 * i / (Nu - 1);
      const p = V(sx * hb(u) * 1.01, sh(u) - 0.05, u * L / 2);
      if (prev) BV.add(gBox(), cylBetween(prev, p).multiply(new THREE.Matrix4().makeScale(0.16, 1.02, 0.2)), 0x4e3c2c);
      prev = p;
    }
    // 第二道腰箍
    prev = null;
    for (let i = 2; i < Nu - 2; i++) {
      const u = -1 + 2 * i / (Nu - 1);
      const y = sh(u) - (sh(u) - kb(u)) * 0.35;
      const cs = Math.cos(Math.asin(Math.pow(0.35, 1 / 0.7)));
      const p = V(sx * hb(u) * Math.pow(cs, 0.55) * 1.02, y, u * L / 2);
      if (prev) BV.add(gBox(), cylBetween(prev, p).multiply(new THREE.Matrix4().makeScale(0.1, 1.02, 0.12)), 0x5a4532);
      prev = p;
    }
  }
  return { hb, sh, kb };
}

// 拱形席篷
function matArch(BM, BV, z, len, r, y, color) {
  const g = new THREE.CylinderGeometry(r, r, len, 12, 1, true, -Math.PI / 2, Math.PI).toNonIndexed();
  BM.add(g, M(0, y, z, -Math.PI / 2, 0, 0, 1, 1, 1), color || 0xdccfb0);
  // 篷骨
  for (const dz of [-len / 2, 0, len / 2]) BV.add(gTorus(1, 0.05, 3, 10, Math.PI), M(0, y, z + dz, 0, 0, 0, r, r, 1), 0x4e3c2c);
}

function makeBoat(scene, o) {
  const type = o.type || 'cargo';
  const L = o.len || 18;
  const beam = o.beam || (type === 'small' ? L * 0.26 : L * 0.24);
  const depth = o.depth || (type === 'small' ? 0.9 : 1.6);
  const rise = o.rise || (type === 'small' ? 0.6 : 1.5);
  const BK = new GeoBuilder(), BV = new GeoBuilder(), BM = new GeoBuilder(), BL = new GeoBuilder();
  const H = boatHull(BK, BV, { len: L, beam, depth, rise, hullColor: o.hullColor });
  const shAt = (z) => H.sh(z / (L / 2));
  const hbAt = (z) => H.hb(z / (L / 2));
  const r = makeRng(Math.floor((o.x || 0) * 10 + L * 7));
  // 舵：大舵叶、舵杆、舵柄
  const sz = -L / 2;
  const sy = shAt(sz * 0.98);
  if (type !== 'small') {
    BV.add(gCyl(6), M(0, sy - 0.6, sz - 0.25, 0, 0, 0, 0.2, 3.0, 0.2), 0x3e3024);
    BV.add(gBox(), M(0, sy - 2.2, sz - 0.9, 0.12, 0, 0, 0.12, 2.0, 1.5), 0x4a3a2c);
    BV.add(gBox(), M(0, sy + 0.9, sz + 1.0, -0.08, 0, 0, 0.1, 0.1, 2.6), 0x3e3024);
    // 舵楼
    const z0 = -L * 0.42, z1 = -L * 0.27;
    const hh = 1.9, ww = hbAt((z0 + z1) / 2) * 1.6;
    const cy = shAt((z0 + z1) / 2) - 0.1;
    BV.add(gBox(), M(0, cy + hh / 2, (z0 + z1) / 2, 0, 0, 0, ww, hh, z1 - z0), 0x5d4632);
    for (const sx of [1, -1]) BL.add(gPlane(), M(sx * (ww / 2 + 0.01), cy + hh * 0.6, (z0 + z1) / 2, 0, sx * Math.PI / 2, 0, (z1 - z0) * 0.8, hh * 0.5, 1), 0xd8ccb0);
    matArch(BM, BV, (z0 + z1) / 2, (z1 - z0) + 0.6, ww * 0.62, cy + hh - 0.2, 0xcfc0a0);
    // 船尾栏杆与晾挂
    for (const sx of [1, -1]) BV.add(gBox(), M(sx * hbAt(-L * 0.46) * 0.9, shAt(-L * 0.46) + 0.45, -L * 0.46, 0, 0, 0, 0.06, 0.9, 1.6), 0x4e3c2c);
  }
  if (type === 'cargo') {
    // 货舱上一串拱形席篷，高低错落
    const n = Math.max(2, Math.round(L / 5.5));
    const za = -L * 0.25, zb = L * 0.22;
    for (let i = 0; i < n; i++) {
      const z = lerp(za, zb, (i + 0.5) / n);
      const rr = hbAt(z) * (0.78 + r() * 0.12);
      matArch(BM, BV, z, (zb - za) / n * 0.95, rr, shAt(z) + 0.15 + r() * 0.25, jit(0xdccfb0, 0.05, r));
    }
    // 舱壁板
    for (const sx of [1, -1]) BV.add(gBox(), M(sx * hbAt(0) * 0.86, shAt(0) + 0.35, (za + zb) / 2, 0, 0, 0, 0.08, 0.7, zb - za), 0x6a5038);
    // 船头：绞盘与缆绳
    const bz = L * 0.4;
    BV.add(gCyl(8), M(0, shAt(bz) + 0.35, bz, 0, 0, Math.PI / 2, 0.4, hbAt(bz) * 1.4, 0.4), 0x4e3c2c);
    BV.add(gTorus(1, 0.12, 4, 10), M(hbAt(bz) * 0.4, shAt(bz) + 0.08, bz - 0.8, Math.PI / 2, 0, 0, 0.35, 0.35, 0.35), 0x6a5a44);
  } else if (type === 'passenger') {
    // 客船：通长的舱房，两侧格子窗
    const za = -L * 0.26, zb = L * 0.28;
    const ww = hbAt(0) * 1.75, hh = 1.9, cy = shAt(0) - 0.1;
    BV.add(gBox(), M(0, cy + 0.25, (za + zb) / 2, 0, 0, 0, ww, 0.5, zb - za), 0x5d4632);
    const nw = Math.round((zb - za) / 1.3);
    for (const sx of [1, -1]) {
      for (let k = 0; k < nw; k++) {
        const z = lerp(za, zb, (k + 0.5) / nw);
        BL.add(gPlane(), M(sx * ww / 2, cy + 1.15, z, 0, sx * Math.PI / 2, 0, (zb - za) / nw * 0.85, 1.1, 1), 0xd9ceb4);
        BV.add(gBox(), M(sx * ww / 2, cy + 1.15, lerp(za, zb, k / nw), 0, 0, 0, 0.1, 1.3, 0.1), 0x4e3a28);
      }
    }
    const g = new THREE.CylinderGeometry(ww * 0.72, ww * 0.72, zb - za + 1.2, 14, 1, true, -Math.PI / 2, Math.PI).toNonIndexed();
    BM.add(g, M(0, cy + hh - 0.25, (za + zb) / 2, -Math.PI / 2, 0, 0, 1, 1, 0.38), 0xbfae8a);
    BV.add(gBox(), M(0, cy + hh - 0.3, (za + zb) / 2, 0, 0, 0, ww + 0.3, 0.12, zb - za + 1.0), 0x4a3a2c);
    // 前舱遮阳棚
    BM.add(gPlane(), M(0, cy + hh + 0.05, zb + 1.4, -Math.PI / 2 + 0.12, 0, 0, ww, 2.2, 1), 0xcfc0a0);
    for (const sx of [1, -1]) BV.add(gCyl(5), M(sx * ww * 0.45, cy + hh / 2 + 0.1, zb + 2.3, 0, 0, 0, 0.08, hh, 0.08), 0x4e3a28);
  } else if (type === 'small') {
    const z = -L * 0.05;
    matArch(BM, BV, z, L * 0.35, hbAt(z) * 0.95, shAt(z) - 0.05, 0xd2c4a2);
    // 船舱里的杂物
    BV.add(gBox(), M(0, shAt(L * 0.25), L * 0.25, 0, 0.3, 0, 0.6, 0.3, 0.5), 0x8a7a5a);
  }
  // 拼装
  const group = new THREE.Group();
  const mk = (b, mat) => { if (!b.empty) { const m = new THREE.Mesh(b.build(), mat); group.add(m); } };
  mk(BK, MAT.plank); mk(BV, MAT.vcDouble); mk(BM, MAT.mat); mk(BL, MAT.lattice);
  // 人字桅：两根桅杆在顶端相交，底部铰接在甲板，可放倒
  if (o.mast) {
    const mz = L * 0.18, my = shAt(mz) - 0.05;
    const mh = o.mastH || L * 0.55;
    const piv = new THREE.Object3D();
    piv.position.set(0, my, mz);
    const MB = new GeoBuilder();
    const sp = hbAt(mz) * 0.75;
    const apex = V(0, mh, -0.4);
    MB.add(gCyl(6), cylBetween(V(sp, 0, 0), apex).multiply(new THREE.Matrix4().makeScale(0.22, 1, 0.22)), 0x5a4330);
    MB.add(gCyl(6), cylBetween(V(-sp, 0, 0), apex).multiply(new THREE.Matrix4().makeScale(0.22, 1, 0.22)), 0x5a4330);
    for (let k = 1; k < 7; k++) {
      const t = k / 8;
      MB.add(gBox(), M(0, mh * t, -0.4 * t, 0, 0, 0, sp * 2 * (1 - t), 0.06, 0.06), 0x4a3828);
    }
    MB.add(gBox(), M(0, mh + 0.2, -0.4, 0, 0, 0, 0.3, 0.4, 0.3), 0x3a2c22);
    // 稳索
    for (const [a, b] of [[apex, V(0, -0.2, mz > 0 ? L * 0.3 : 3)], [apex, V(0, -0.5, -L * 0.45)], [apex, V(sp * 1.4, -0.2, -2)], [apex, V(-sp * 1.4, -0.2, -2)]]) {
      MB.add(gCyl(3), cylBetween(a, b).multiply(new THREE.Matrix4().makeScale(0.03, 1, 0.03)), 0x3a3026);
    }
    const mm = new THREE.Mesh(MB.build(), MAT.vcDouble);
    piv.add(mm);
    group.add(piv);
    if (o.mast === 'down') piv.rotation.x = -1.35;
    group.userData.mast = piv;
    group.userData.mastApex = apex;
  }
  // 橹
  if (o.yuloh) {
    const piv = new THREE.Object3D();
    const yz = -L * 0.36;
    piv.position.set(hbAt(yz) * 0.95 * o.yuloh, shAt(yz) + 0.2, yz);
    const OB = new GeoBuilder();
    OB.add(gCyl(5), cylBetween(V(0, 0.6, 1.6), V(o.yuloh * 1.5, -1.9, -4.2)).multiply(new THREE.Matrix4().makeScale(0.1, 1, 0.1)), 0x5a4330);
    OB.add(gBox(), M(o.yuloh * 1.35, -1.75, -3.9, 0.55, 0, 0, 0.06, 0.35, 1.3), 0x4a3828);
    piv.add(new THREE.Mesh(OB.build(), MAT.vcDouble));
    group.add(piv);
    group.userData.yuloh = piv;
  }
  const y = WATER_Y - 0.62 - (o.load || 0);
  group.position.set(o.x, y, o.z);
  group.rotation.y = o.yaw || 0;
  scene.add(group);
  const boat = { group, o, L, beam, shAt, hbAt, baseY: y, phase: r() * 10, yaw: o.yaw || 0 };
  BOATS.push(boat);
  // 船工
  crew(boat, o);
  if (o.label) STATIC.labels.push({ text: o.label, pos: new THREE.Vector3(o.x, 8, o.z), minor: true });
  return boat;
}

function crewMember(boat, lx, lz, act, yaw, extra) {
  const p = addPerson(Object.assign({ act, body: 'short', yaw: 0 }, extra || {}));
  const ly = boat.shAt(lz) - 0.12 + (extra && extra.dyLocal || 0);
  attachTo(p, boat.group, V(lx, ly, lz), yaw || 0);
  return p;
}

function crew(boat, o) {
  const L = boat.L;
  const r = makeRng(Math.floor(o.x * 7 + 3));
  if (o.yuloh) crewMember(boat, boat.hbAt(-L * 0.36) * 0.5 * o.yuloh, -L * 0.36 + 1.6, ACT.scull, Math.PI, { gait: 1.6 + r() * 0.3 });
  const n = o.crew != null ? o.crew : (o.type === 'small' ? 1 : 3);
  for (let i = 0; i < n; i++) {
    const lz = lerp(-L * 0.4, L * 0.4, r());
    const lx = (r() - 0.5) * boat.hbAt(lz) * 1.1;
    const k = r();
    if (o.underway && k < 0.5) crewMember(boat, boat.hbAt(lz) * 0.8 * (r() < 0.5 ? 1 : -1), lz, ACT.punt, r() < 0.5 ? 0 : Math.PI, { prop: 'punt', gait: 1.2 + r() * 0.4 });
    else if (k < 0.7) crewMember(boat, lx, lz, ACT.work, r() * 6, { gait: 2 + r() });
    else crewMember(boat, lx, lz, r() < 0.5 ? ACT.idle : ACT.squat, r() * 6, { variant: r.int(0, 2) });
  }
  // 舵手
  if (o.type !== 'small' && r() < 0.7) crewMember(boat, 0, -L * 0.4 + 1.2, ACT.idle, 0, { variant: 0 });
}

const _bq = new THREE.Quaternion();
function updateBoats(t) {
  for (const b of BOATS) {
    const g = b.group;
    const ph = b.phase;
    g.position.y = b.baseY + 0.05 * Math.sin(t * 1.1 + ph) + 0.02 * Math.sin(t * 2.3 + ph * 2);
    g.rotation.set(0.008 * Math.sin(t * 0.7 + ph), b.yaw, 0.022 * Math.sin(t * 0.9 + ph * 1.3));
    if (b.o.drift) {
      // 行进中的船：沿河道缓缓往返
      const d = b.o.drift;
      const s = d.s0 + Math.sin(t * d.w + ph) * d.amp;
      RIVER.at(s, _at);
      const nx = -_at.dz, nz = _at.dx;
      const hw = riverHalfWidthAt(s);
      g.position.x = _at.x + nx * hw * d.lat;
      g.position.z = _at.z + nz * hw * d.lat;
    }
    if (g.userData.yuloh) {
      const yl = g.userData.yuloh;
      yl.rotation.y = 0.35 * Math.sin(t * 1.7 + ph);
      yl.rotation.z = 0.12 * Math.cos(t * 1.7 + ph);
    }
    if (b.o.mast === 'lowering' && g.userData.mast) {
      // 正在放倒桅杆：缓慢往复
      g.userData.mast.rotation.x = -0.15 - 0.55 * (0.5 + 0.5 * Math.sin(t * 0.25 + ph));
    }
  }
}

// 根据画卷位置在河道里放船：side 为相对河宽的横向位置（+ 偏远岸，- 偏近岸）
function riverSpot(xo, frac) {
  const x = PX(xo);
  // 在河道中心线上找最接近该 x 的点
  let best = 0, bd = 1e9;
  for (let s = 0; s <= RIVER.total; s += 0.5) {
    RIVER.at(s, _at);
    const d = Math.abs(_at.x - x);
    if (d < bd) { bd = d; best = s; }
  }
  RIVER.at(best, _at);
  const hw = riverHalfWidthAt(best);
  const nx = -_at.dz, nz = _at.dx;
  return { x: _at.x + nx * hw * frac, z: _at.z + nz * hw * frac, yaw: Math.atan2(_at.dx, _at.dz), s: best, hw };
}
