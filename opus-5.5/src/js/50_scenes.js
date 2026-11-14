// ============================================================
// 50_scenes.js — 各段布景：郊野春色、汴河虹桥、城门街市
// 所有位置都以画卷坐标 (xo, yo) 给出，对照原画逐段摆放。
// ============================================================

const SCN = { skipped: 0 };
const R = makeRng(4321);

// ---------- 布景助手 ----------
function nearestRoad(x, z) {
  let best = { d: 1e9 };
  for (const k in ROADS) {
    const n = ROADS[k].nearest(x, z);
    if (n.d < best.d) {
      ROADS[k].at(n.s, _at);
      best = { d: n.d, key: k, s: n.s, px: _at.x, pz: _at.z, w: ROAD_W[k] };
    }
  }
  return best;
}
function yawToward(x, z, tx, tz) { return Math.atan2(tx - x, tz - z); }
const FACE = { S: 0, N: Math.PI, E: Math.PI / 2, W: -Math.PI / 2 };

// 房屋：以画卷坐标给出，可自动朝向最近的道路并退让出路面
function bld(xo, yo, w, d, o) {
  o = Object.assign({}, o || {});
  let x = PX(xo), z = PZ(yo);
  let yaw;
  const nr = nearestRoad(x, z);
  if (o.face === undefined || o.face === 'road') {
    yaw = yawToward(x, z, nr.px, nr.pz);
    // 对齐到道路法线
    const need = nr.w + d / 2 + 1.2 + (o.porch || 0) + (o.cailou ? 2.6 : 0);
    if (nr.d < need && o.keep !== true) {
      const k = (need - nr.d);
      x -= Math.sin(yaw) * k; z -= Math.cos(yaw) * k;
    }
  } else yaw = typeof o.face === 'number' ? o.face : FACE[o.face];
  if (o.yawAdd) yaw += o.yawAdd;
  // 不建在水里
  for (const [cx, cz] of [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2], [0, 0]]) {
    const wx = x + Math.cos(yaw) * cx + Math.sin(yaw) * cz, wz = z - Math.sin(yaw) * cx + Math.cos(yaw) * cz;
    if (waterDepth(wx, wz) > -0.6 && !o.stilts) { SCN.skipped++; return null; }
  }
  return house(Object.assign({ x, z, yaw, w, d }, o));
}

function W(xo, yo, s, o) { const p = P(xo, yo); if (waterDepth(p.x, p.y) > -0.3) return; willow(p.x, p.y, s, o); }
function T(xo, yo, s, o) { const p = P(xo, yo); if (waterDepth(p.x, p.y) > -0.3) return; bareTree(p.x, p.y, s, o); }
function UMB(xo, yo, r, o) { const p = P(xo, yo); umbrella(p.x, p.y, r || 1.7, (o && o.color) || jit(0xcab792, 0.06), o); }
function SH(xo, yo, w, d, o) { const p = P(xo, yo); const nr = nearestRoad(p.x, p.y); const yaw = (o && o.yaw != null) ? o.yaw : yawToward(p.x, p.y, nr.px, nr.pz); return matShed(p.x, p.y, w, d, yaw, o); }

// 站立的人（群）
function stand(xo, yo, o) {
  const p = P(xo, yo);
  o = o || {};
  const tx = o.lookAt ? P(o.lookAt[0], o.lookAt[1]) : null;
  const yaw = o.yaw != null ? o.yaw : tx ? yawToward(p.x, p.y, tx.x, tx.y) : R() * 6.28;
  return addPerson(Object.assign({ x: p.x + (o.dx || 0), z: p.y + (o.dz || 0), yaw, act: ACT.idle, variant: R.int(0, 3) }, o, { lookAt: undefined, dx: undefined, dz: undefined }));
}
function group(xo, yo, n, rad, o) {
  const c = P(xo, yo);
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 + R() * 0.5, rr = rad * (0.6 + R() * 0.4);
    const x = c.x + Math.cos(a) * rr, z = c.y + Math.sin(a) * rr;
    const yaw = yawToward(x, z, c.x, c.y) + (R() - 0.5) * 0.6;
    out.push(addPerson(Object.assign({ x, z, yaw, act: ACT.idle, variant: R.pick([0, 1, 1, 2, 3]) }, o || {})));
  }
  return out;
}

// 沿路往返的行人与车马
const GAIT_K = 4.9;
function walker(path, s0, span, lat, v, spec) {
  const p = addPerson(Object.assign({ act: ACT.walk }, spec));
  p.gait = v * (p.act === ACT.porter ? 6.0 : p.act === ACT.track ? 5.5 : GAIT_K);
  const m = addMover(path, { s: s0, v, dir: R() < 0.5 ? 1 : -1, members: [{ ent: p, back: 0, lat }] });
  m.lo = Math.max(0.5, s0 - span / 2); m.hi = Math.min(path.total - 0.5, s0 + span / 2);
  return m;
}
function convoy(path, s0, span, v, members, dir) {
  const m = addMover(path, { s: s0, v, dir: dir || (R() < 0.5 ? 1 : -1), members });
  m.lo = Math.max(4, s0 - span / 2); m.hi = Math.min(path.total - 4, s0 + span / 2);
  for (const mb of members) {
    const e = mb.ent;
    if (e.kind === 'person' && e.act !== ACT.ride) e.gait = v * (e.act === ACT.porter ? 6.0 : e.act === ACT.track ? 5.5 : GAIT_K);
    if (e.kind === 'animal') e.gait = v * 3.6 * (e.species === 'ox' ? 1.2 : e.species === 'camel' ? 0.75 : 1);
    if (e.kind === 'person' && e.act === ACT.ride) e.gait = v * 3.6;
  }
  return m;
}
function riderOn(species, opts) {
  const an = addAnimal({ species, act: 1, gear: species === 'horse' ? 'horseSaddle' : 'donkeySaddle' });
  const sp = SPECIES[species], s = sp.scale || 1;
  const hipY = (sp.bodyY + sp.bodyH * 0.5) * s + 0.1;
  const rd = addPerson(Object.assign({ act: ACT.ride, body: R() < 0.7 ? 'robe' : 'short' }, opts || {}));
  return { an, rd, dy: hipY - 0.9 };
}

// 一条路上的人流：按身份配比
function populate(path, n, o) {
  o = o || {};
  const lo = (o.lo || 0) * path.total, hi = (o.hi == null ? 1 : o.hi) * path.total;
  const latMax = o.lat || 2.5;
  const mix = Object.assign({ walk: 50, porter: 13, back: 7, sack: 4, lead: 6, ride: 6, sedan: 3, barrow: 3, ox: 2, scholar: 6 }, o.mix || {});
  const keys = Object.keys(mix), tot = keys.reduce((a, k) => a + mix[k], 0);
  for (let i = 0; i < n; i++) {
    const s0 = lerp(lo, hi, R());
    const span = o.span || (18 + R() * 40);
    const lat = (R() - 0.5) * 2 * latMax;
    let k = R() * tot, role = keys[0];
    for (const kk of keys) { k -= mix[kk]; if (k <= 0) { role = kk; break; } }
    const v = 0.8 + R() * 0.5;
    switch (role) {
      case 'walk': walker(path, s0, span, lat, v, { prop: R() < 0.15 ? 'bundle' : R() < 0.1 ? 'stick' : undefined, variant: R() < 0.1 ? 2 : 0 }); break;
      case 'scholar': walker(path, s0, span, lat, v * 0.8, { body: 'robe', variant: 1, beard: R() < 0.6 }); break;
      case 'porter': walker(path, s0, span, lat, v * 1.1, { act: ACT.porter, prop: 'pole', body: 'short', hat: R() < 0.3 ? 'douli' : undefined }); break;
      case 'back': walker(path, s0, span, lat, v * 0.9, { act: ACT.backCarry, prop: R() < 0.5 ? 'backBasket' : 'bundle', body: 'short' }); break;
      case 'sack': walker(path, s0, span, lat, v * 0.9, { act: ACT.shoulder, prop: 'sack', body: 'short' }); break;
      case 'lead': {
        const pack = R() < 0.7;
        const an = addAnimal({ species: 'donkey', act: 1, gear: pack ? 'donkeyPack' : null });
        const pp = addPerson({ act: ACT.lead, body: 'short', prop: R() < 0.4 ? 'stick' : undefined });
        convoy(path, s0, span, v * 0.8, [{ ent: pp, back: -1.4, lat }, { ent: an, back: 0, lat }]);
        break;
      }
      case 'ride': {
        const r = riderOn(R() < 0.55 ? 'donkey' : 'horse', { hat: R() < 0.25 ? 'douli' : undefined });
        const mem = [{ ent: r.an, back: 0, lat }, { ent: r.rd, back: 0.08, lat, dy: r.dy }];
        if (R() < 0.6) mem.push({ ent: addPerson({ act: ACT.lead, body: 'short' }), back: -1.6, lat: lat + 0.35 });
        convoy(path, s0, span, v * 0.85, mem);
        break;
      }
      case 'sedan': {
        const sd = addSedan({});
        const b1 = addPerson({ act: ACT.bear, body: 'short' }), b2 = addPerson({ act: ACT.bear, body: 'short' });
        const mem = [{ ent: sd, back: 0, lat }, { ent: b1, back: -1.55, lat }, { ent: b2, back: 1.55, lat }];
        if (R() < 0.6) mem.push({ ent: addPerson({ act: ACT.walk, body: 'short', prop: 'bundle' }), back: 3.0, lat: lat + 0.5 });
        convoy(path, s0, span + 20, v * 0.8, mem);
        break;
      }
      case 'barrow': {
        const c = addCart({ type: 'barrow' });
        const pu = addPerson({ act: ACT.push, body: 'short' });
        const mem = [{ ent: c, back: 0, lat }, { ent: pu, back: 1.75, lat }];
        if (R() < 0.6) mem.push({ ent: addAnimal({ species: 'donkey', act: 2 }), back: -2.2, lat });
        else mem.push({ ent: addPerson({ act: ACT.track, body: 'short', prop: 'rope' }), back: -2.0, lat });
        convoy(path, s0, span + 10, v * 0.65, mem);
        break;
      }
      case 'ox': {
        const c = addCart({ type: 'oxCart' });
        const mem = [{ ent: c, back: 0, lat: lat * 0.5 }];
        const no = R() < 0.5 ? 2 : 4;
        for (let q = 0; q < no; q++) mem.push({ ent: addAnimal({ species: 'ox', act: 2 }), back: -4.6 - Math.floor(q / 2) * 2.0, lat: lat * 0.5 + (q % 2 ? 0.6 : -0.6) });
        mem.push({ ent: addPerson({ act: ACT.lead, body: 'short', prop: 'stick' }), back: -4.0, lat: lat * 0.5 + 1.6 });
        convoy(path, s0, span + 20, v * 0.5, mem);
        break;
      }
      case 'camel': {
        const mem = [];
        const nc = 2 + R.int(0, 2);
        mem.push({ ent: addPerson({ act: ACT.lead, body: 'short', hat: 'douli' }), back: -2.2, lat });
        for (let q = 0; q < nc; q++) mem.push({ ent: addAnimal({ species: 'camel', act: 1, gear: 'camelPack' }), back: q * 3.4, lat });
        convoy(path, s0, span + 15, v * 0.6, mem);
        break;
      }
    }
  }
}

// 小木桥（郊野小溪）
function smallBridge(xo, yo, len, width, yaw) {
  const p = P(xo, yo);
  const B = SB('vc', p.x);
  const f = frame(p.x, 0.25, p.y, yaw);
  B.add(gBox(), f(0, 0.15, 0, 0, 0, 0, width, 0.2, len), 0x7a6448);
  for (const sx of [1, -1]) {
    B.add(gBox(), f(sx * width / 2, 0.75, 0, 0, 0, 0, 0.08, 0.08, len), 0x5a4532);
    for (let k = -2; k <= 2; k++) B.add(gBox(), f(sx * width / 2, 0.45, k * len / 4.4, 0, 0, 0, 0.1, 0.9, 0.1), 0x5a4532);
    for (let k = -2; k <= 2; k++) B.add(gCyl(5), f(sx * width / 2, -0.8, k * len / 4.4, 0, 0, 0, 0.18, 2.0, 0.18), 0x4a3a2c);
  }
  WORLD.flatBridges = WORLD.flatBridges || [];
  const c = Math.abs(Math.cos(yaw)), s = Math.abs(Math.sin(yaw));
  const hx = (width * c + len * s) / 2 + 0.3, hz = (width * s + len * c) / 2 + 0.3;
  WORLD.flatBridges.push({ x0: p.x - hx, x1: p.x + hx, z0: p.y - hz, z1: p.y + hz, y: 0.55 });
}

// 农田：田垄线
function field(xo0, xo1, yo0, yo1, ang) {
  const L = SL(PX(xo0));
  const x0 = PX(xo0), x1 = PX(xo1), z0 = PZ(yo0), z1 = PZ(yo1);
  for (let z = z0; z < z1; z += 0.9) {
    const pts = [];
    for (let x = x0; x <= x1; x += 2) pts.push(V(x, groundY(x, z + (x - x0) * (ang || 0)) + 0.05, z + (x - x0) * (ang || 0)));
    L.poly(pts, 0x6e5e44);
  }
}

// ============================================================
// 第一段：郊野春色（xo 5873 → 4450）
// ============================================================
function sceneRural() {
  // 卷首疏林：杂树成林，枝如蟹爪
  const treesA = [[5845, 120, 1.0], [5800, 95, 1.1], [5770, 130, 0.9], [5730, 60, 1.2], [5700, 100, 1.0], [5655, 75, 1.1], [5610, 115, 1.0], [5575, 85, 1.2], [5540, 130, 0.9], [5505, 70, 1.15], [5470, 60, 1.2], [5440, 110, 0.9], [5405, 50, 1.25], [5380, 90, 1.0], [5350, 60, 1.1], [5310, 45, 1.2], [5280, 85, 1.0], [5250, 55, 1.15], [5225, 95, 0.9], [5190, 40, 1.1], [5640, 35, 1.0], [5760, 30, 1.0], [5520, 30, 1.1], [5430, 25, 1.0], [5330, 20, 1.0], [5850, 60, 0.9]];
  for (const [xo, yo, s] of treesA) T(xo, yo, s * 1.1);
  // 鸟巢
  // 近景老树
  T(5600, 175, 1.3); T(5560, 185, 1.2); T(5800, 180, 1.0);
  // 村舍：茅屋数间，一座瓦房
  bld(5440, 112, 6, 4.6, { roof: 'thatch', face: 'S', kitchen: true, label: '村舍' });
  bld(5400, 104, 5, 4.2, { roof: 'thatch', face: 'S' });
  bld(5350, 98, 7.5, 5.2, { face: 'S', h: 3.0, lift: 0.25 });
  bld(5300, 110, 5.5, 4.2, { roof: 'thatch', face: 'S', porch: 2.2 });
  bld(5260, 102, 5, 4, { roof: 'thatch', face: 'E' });
  bld(5490, 118, 4.5, 3.6, { roof: 'thatch', face: 'S', kitchen: true });
  fence([P(5500, 125), P(5470, 128), P(5430, 126), P(5395, 123)]);
  fence([P(5320, 122), P(5290, 125), P(5250, 120)]);
  W(5330, 108, 0.9); W(5285, 95, 0.85, { green: true });
  // 驴队驮炭入城（卷首）
  {
    const path = ROADS.rural;
    const mem = [];
    for (let i = 0; i < 5; i++) mem.push({ ent: addAnimal({ species: 'donkey', act: 1, gear: 'donkeyPack', color: ANIMAL_COLORS.donkey[i % 5] }), back: i * 1.9 + (i % 2) * 0.3, lat: (i % 2 ? 0.5 : -0.4) });
    mem.push({ ent: addPerson({ act: ACT.lead, body: 'short', prop: 'stick', hat: 'kerchief' }), back: 10.6, lat: 0.4 });
    convoy(path, 20, 34, 0.75, mem, 1);
  }
  // 小溪木桥
  smallBridge(5690, 140, 7, 2.6, Math.PI / 2 + 0.25);
  // 卷首近景浅水边的柳与树
  W(5150, 205, 1.25, { lean: 0.35 }); W(5110, 225, 1.35, { lean: -0.3 }); W(5075, 200, 1.2); W(5040, 232, 1.3); W(5005, 210, 1.15);
  W(4985, 245, 1.2, { lean: 0.4 });
  // 远处杂树
  for (let i = 0; i < 18; i++) T(5000 + R() * 500, 15 + R() * 50, 0.8 + R() * 0.4);
  // 中段：路边柳林，茅屋茶棚
  W(4930, 150, 1.15); W(4890, 125, 1.2); W(4860, 165, 1.3, { lean: 0.4 }); W(4820, 140, 1.1);
  bld(4925, 175, 6, 4.5, { roof: 'thatch', face: 'N', porch: 2 });
  fence([P(4960, 160), P(4955, 195), P(4900, 200), P(4880, 190)]);
  // 扫墓归来的轿马队伍（清明）
  {
    const path = ROADS.rural;
    const n0 = path.nearest(PX(4830), PZ(70)).s;
    const sd = addSedan({});
    const r1 = riderOn('horse', { body: 'robe', hat: 'futou', beard: true });
    const mem = [
      { ent: r1.an, back: 0, lat: 0 }, { ent: r1.rd, back: 0.1, lat: 0, dy: r1.dy },
      { ent: addPerson({ act: ACT.lead, body: 'short' }), back: -1.8, lat: 0.4 },
      { ent: addPerson({ act: ACT.porter, prop: 'pole', body: 'short' }), back: 3.2, lat: -0.6 },
      { ent: addPerson({ act: ACT.walk, body: 'short', prop: 'stick' }), back: 4.5, lat: 0.7 },
      { ent: sd, back: 8.5, lat: 0 },
      { ent: addPerson({ act: ACT.bear, body: 'short' }), back: 6.95, lat: 0 },
      { ent: addPerson({ act: ACT.bear, body: 'short' }), back: 10.05, lat: 0 },
      { ent: addPerson({ act: ACT.walk, body: 'short', prop: 'bundle' }), back: 12, lat: 0.5 },
      { ent: addPerson({ act: ACT.backCarry, body: 'short', prop: 'backBasket' }), back: 13.2, lat: -0.5 }
    ];
    convoy(path, n0, 40, 0.8, mem, 1);
    STATIC.labels.push({ text: '扫墓归来', pos: V(PX(4830), 8, PZ(70)), minor: true });
  }
  // 低路上骑驴的妇人与随从
  {
    const path = ROADS.ruralLow;
    const r1 = riderOn('donkey', { body: 'robe', hat: null, colA: 0xd9cdb5 });
    const r2 = riderOn('donkey', { body: 'short', hat: 'douli' });
    convoy(path, path.total * 0.45, 30, 0.75, [
      { ent: r1.an, back: 0, lat: 0 }, { ent: r1.rd, back: 0.08, lat: 0, dy: r1.dy },
      { ent: addPerson({ act: ACT.walk, body: 'short', prop: 'stick' }), back: -1.6, lat: 0.5 },
      { ent: r2.an, back: 3.0, lat: 0.2 }, { ent: r2.rd, back: 3.08, lat: 0.2, dy: r2.dy },
      { ent: addPerson({ act: ACT.porter, body: 'short', prop: 'pole' }), back: 5.2, lat: -0.3 }
    ], -1);
  }
  // 农舍与卧牛、石碾
  bld(4705, 150, 6.5, 4.6, { face: 'S', h: 2.9 });
  fence([P(4740, 160), P(4740, 185), P(4680, 188), P(4660, 175)]);
  W(4760, 150, 1.3, { lean: 0.3 }); W(4660, 140, 1.1);
  addAnimal({ x: PX(4600), z: PZ(118), yaw: 0.6, species: 'ox', act: 0 });
  addAnimal({ x: PX(4620), z: PZ(112), yaw: -1.2, species: 'ox', act: 0 });
  { const p = P(4645, 118); SB('vc', p.x).add(gCyl(10), M(p.x, groundY(p.x, p.y) + 0.35, p.y, 0, 0.5, Math.PI / 2, 0.7, 1.3, 0.7), 0x8a8070); }
  stand(4610, 125, { act: ACT.idle, body: 'short', hat: 'douli', lookAt: [4600, 118] });
  // 路边茅草茶棚
  bld(4530, 70, 7, 4.5, { roof: 'thatch', face: 'road', open: true, interior: true, porch: 2.4, porchTables: true, kitchen: true, label: '茶棚' });
  bld(4585, 40, 5, 4, { roof: 'thatch', face: 'S' });
  addAnimal({ x: PX(4560), z: PZ(95), yaw: 1.2, species: 'donkey', act: 0, gear: 'donkeySaddle' });
  stand(4555, 98, { act: ACT.work, body: 'short', lookAt: [4560, 95] });
  // 远处田畴
  field(4520, 4700, 4, 34, 0.05);
  field(4720, 4900, 10, 40, -0.03);
  stand(4620, 20, { act: ACT.lift, body: 'short', hat: 'douli', gait: 1.5 });
  stand(4780, 28, { act: ACT.lift, body: 'short', hat: 'douli', gait: 1.3 });
  // 汴河入画处的大柳树
  W(4560, 190, 1.4, { lean: -0.35 }); W(4505, 225, 1.3, { lean: 0.3 }); W(4600, 215, 1.2);
  T(4470, 55, 1.0); T(4640, 60, 1.1); T(4700, 40, 1.0); T(4860, 30, 1.2); T(4950, 60, 1.0);
  // 行人：村路上零星往来
  populate(ROADS.rural, 22, { lo: 0.02, hi: 0.32, lat: 1.2, mix: { walk: 40, porter: 20, back: 12, lead: 10, ride: 6, scholar: 6, barrow: 3 } });
  populate(ROADS.ruralLow, 6, { lat: 0.8, mix: { walk: 60, porter: 25, back: 15 } });
  // 狗
  addAnimal({ x: PX(5420), z: PZ(132), yaw: 2, species: 'dog', act: 0 });
  addAnimal({ x: PX(4720), z: PZ(195), yaw: -1, species: 'dog', act: 0 });
  // 田间猪群
  for (let i = 0; i < 4; i++) addAnimal({ x: PX(5360 + i * 8), z: PZ(132 + (i % 2) * 4), yaw: R() * 6, species: 'pig', act: 0 });
}

// ============================================================
// 第二段：汴河虹桥（xo 4450 → 2250）
// ============================================================
function sceneRiver(scene) {
  // ---- 北岸（远岸）店铺、茶肆 ----
  bld(4430, 22, 5.2, 5.2, { face: 'S', stories: 2, h: 2.8, h2: 2.4, type: 'xieshan', upPatrons: true, label: '临河亭' });
  bld(4380, 52, 9, 5, { face: 'road', open: true, interior: true, porch: 2.6, porchTables: true, kitchen: true, label: '茶肆' });
  bld(4320, 45, 8, 5, { face: 'road', roof: 'thatch', open: true, interior: true, porch: 2.4, porchTables: true });
  bld(4255, 38, 10, 5.5, { face: 'road', open: true, interior: true, porch: 2.8, porchTables: true, kitchen: true, label: '饮食店' });
  bld(4180, 30, 8, 5, { face: 'road', open: true, interior: false });
  bld(4115, 22, 14, 7, { face: 'road', h: 3.6, label: '货栈' });
  bld(4040, 18, 9, 6, { face: 'road', open: true, interior: true, porch: 2.4 });
  bld(3975, 14, 10, 6, { face: 'road' });
  bld(3900, 10, 16, 8, { face: 'road', h: 3.8, type: 'hip', label: '院落' });
  bld(3820, 8, 9, 6, { face: 'road', open: true, interior: true, porch: 2.2, porchTables: true, kitchen: true });
  bld(3755, 6, 8, 5, { face: 'road', roof: 'thatch', open: true });
  bld(3690, 4, 10, 6, { face: 'road', open: true, interior: true, porch: 2.6, porchTables: true, label: '酒肆' });
  bld(3600, 0, 9, 6, { face: 'road', open: true, interior: true });
  bld(3525, -4, 11, 6, { face: 'road', h: 3.4 });
  bld(3450, -6, 9, 5.5, { face: 'road', roof: 'thatch', open: true, porch: 2.0 });
  bld(3370, -10, 10, 6, { face: 'road', open: true, interior: true });
  bld(3290, -14, 9, 6, { face: 'road' });
  bld(3220, -16, 9, 5.5, { face: 'road', open: true, interior: true, porch: 2 });
  bld(3160, -18, 8, 5, { face: 'road', open: true });
  // 北岸临水的二层茶楼（架在河岸上）
  bld(3560, 62, 9, 5, { face: 'N', stories: 2, h: 2.6, h2: 2.4, upPatrons: true, keep: true, label: '临河茶楼' });
  // 北岸后排
  for (let k = 0; k < 12; k++) bld(4300 - k * 95 + R() * 30, -30 + R() * 14, 9 + R() * 5, 6, { face: 'S', h: 3.2, interior: false });
  // 北岸柳树
  W(4460, 95, 1.3); W(4200, 105, 1.25, { lean: 0.35 }); W(4150, 95, 1.1); W(3860, 70, 1.2); W(3760, 72, 1.15); W(3650, 55, 1.2);
  W(3480, 40, 1.3); W(3400, 35, 1.1); W(3300, 32, 1.2); W(4010, 80, 1.2);
  T(4060, 60, 1.1, { leafy: 0x6c7058 }); T(3940, 55, 1.0); T(3720, 40, 1.0, { leafy: 0x6c7058 });
  // 卸货：扛包的力夫
  cargoPile(PX(4290), PZ(130), 10);
  for (let i = 0; i < 5; i++) {
    const p0 = P(4300 + i * 4, 165), p1 = P(4285 + i * 3, 128);
    const path = new Path2([p0, p1]);
    const pp = addPerson({ act: ACT.shoulder, prop: 'sack', body: 'short', colA: R() < 0.4 ? PAL.skin : undefined });
    pp.gait = 0.8 * GAIT_K;
    const m = addMover(path, { s: R() * path.total, v: 0.8, members: [{ ent: pp, back: 0, lat: 0 }] });
    m.lo = 0.2; m.hi = path.total - 0.2;
  }
  stand(4275, 130, { act: ACT.sit, body: 'robe', hat: 'futou', beard: true, yaw: 0.8, y: groundY(PX(4275), PZ(130)) + 0.05 });
  stand(4310, 128, { act: ACT.lift, body: 'short', gait: 2 });
  stand(4318, 132, { act: ACT.idle, variant: 1, body: 'robe' });
  // ---- 河中的船 ----
  const boat = (xo, frac, o) => { const s = riverSpot(xo, frac); if (o.drift && !o.drift.s0) o.drift.s0 = s.s; return makeBoat(scene, Object.assign({ x: s.x, z: s.z, yaw: s.yaw + (o.flip ? Math.PI : 0) + (o.dyaw || 0) }, o)); };
  boat(4335, 0.55, { type: 'cargo', len: 16, mast: 'down', crew: 3, label: '漕船' });
  boat(4248, 0.6, { type: 'small', len: 10, crew: 2 });
  boat(4085, 0.7, { type: 'cargo', len: 21, mast: 'down', crew: 3, flip: true });
  boat(3935, 0.72, { type: 'cargo', len: 17, crew: 2 });
  boat(3790, 0.66, { type: 'cargo', len: 20, mast: 'up', crew: 4, flip: true });
  // 纤夫拉的大船
  const towed = boat(3830, 0.05, { type: 'cargo', len: 22, mast: 'up', mastH: 13, crew: 6, underway: true, yuloh: 1, label: '纤夫拉船' });
  const pass1 = boat(3600, 0.42, { type: 'passenger', len: 19, crew: 3, yuloh: -1, flip: true, label: '客船' });
  void pass1;
  boat(3495, 0.08, { type: 'small', len: 9, crew: 4, underway: true, flip: true, drift: { s0: 0, w: 0.04, amp: 6, lat: 0.08 } });
  boat(3540, -0.78, { type: 'small', len: 9, crew: 2 });
  boat(3470, -0.8, { type: 'small', len: 7, crew: 1, flip: true });
  // 纤夫：北岸拉纤
  {
    const tp = new Path2([[3440, 52], [3500, 60], [3560, 64]]);
    for (let i = 0; i < 5; i++) {
      const pp = addPerson({ act: ACT.track, prop: 'rope', body: 'short', colA: R() < 0.5 ? PAL.skin : undefined, x: 0, z: 0 });
      pp.gait = 3.2;
      const m = addMover(tp, { s: 4 + i * 2.2, v: 0.0, dir: -1, members: [{ ent: pp, back: 0, lat: (i % 2) * 0.6 }] });
      m.lo = 0; m.hi = tp.total;
      // 原地踏步拉纤：位置固定、腿在动
      pp.trackTo = towed;
    }
    STATIC.towRope = { boat: towed, from: P(3450, 54) };
  }
  // ---- 南岸（近岸）屋舍：从背后看屋顶 ----
  bld(3460, 252, 10, 6, { face: 'N', h: 3.2 });
  bld(3380, 245, 9, 6, { face: 'road', open: true, interior: true });
  bld(3300, 236, 12, 7, { face: 'road', open: true, interior: true, porch: 2.4, porchTables: true, kitchen: true });
  bld(3215, 232, 10, 6.5, { face: 'road', open: true, interior: true, porch: 2.2 });
  bld(3140, 228, 11, 7, { face: 'road', h: 3.4 });
  bld(3060, 225, 12, 7, { face: 'road', open: true, interior: true, porch: 2.6, porchTables: true, label: '桥头饮子铺' });
  for (let k = 0; k < 6; k++) bld(3460 - k * 75, 275, 10, 6, { face: 'N', h: 3.0, keep: true });
  UMB(3020, 200, 1.8, { yaw: 0 }); UMB(3100, 205, 1.6); UMB(3170, 200, 1.7);
  W(3330, 200, 1.35, { lean: -0.4 }); W(3260, 210, 1.2); W(3420, 215, 1.3, { lean: 0.5 }); W(3180, 215, 1.0);
  // 南岸东段的路人
  populate(ROADS.nearBankE, 22, { lat: 1.6, mix: { walk: 45, porter: 20, back: 10, sack: 8, scholar: 10, lead: 7 } });
  // 北岸大路行人
  populate(ROADS.rural, 45, { lo: 0.36, hi: 0.99, lat: 1.5 });
  // 南岸停船
  boat(3110, -0.72, { type: 'cargo', len: 16, crew: 2, dyaw: 0.1 });
  boat(3210, -0.7, { type: 'small', len: 9, crew: 1 });
  // ---- 虹桥 ----
  buildBridge();
  // 桥下险情：大船正放倒桅杆过桥
  const bb = boat(3140, 0.1, { type: 'cargo', len: 21, mast: 'lowering', mastH: 12, crew: 0, underway: true, flip: true, dyaw: -0.12, label: '船过虹桥' });
  {
    const L = bb.L;
    const spots = [[-1.2, L * 0.38, ACT.punt, 'punt'], [1.2, L * 0.36, ACT.punt, 'punt'], [-1.0, L * 0.3, ACT.punt, 'punt'], [1.1, L * 0.25, ACT.wave], [0, L * 0.2, ACT.pull], [0.5, L * 0.12, ACT.pull], [-0.5, L * 0.05, ACT.wave],
      [1.3, -L * 0.1, ACT.punt, 'punt'], [-1.3, -L * 0.15, ACT.punt, 'punt'], [0.2, -L * 0.25, ACT.wave], [0, -L * 0.35, ACT.scull], [-0.8, L * 0.42, ACT.wave], [0.6, -L * 0.42, ACT.idle]];
    for (const [lx, lz, act, prop] of spots) crewMember(bb, lx, lz, act, act === ACT.punt ? (lx > 0 ? Math.PI / 2 : -Math.PI / 2) : (R() - 0.5) * 2, { prop, gait: 1.4 + R() * 0.6, hat: R() < 0.3 ? 'douli' : 'kerchief' });
    // 舱顶上站着喊话的人
    crewMember(bb, 0, -L * 0.05, ACT.wave, 0, { dyLocal: 1.6, gait: 2.2 });
  }
  boat(3010, 0.62, { type: 'cargo', len: 14, crew: 1, flip: true });
  boat(3310, 0.75, { type: 'passenger', len: 18, crew: 2 });
  boat(3330, -0.15, { type: 'cargo', len: 14, crew: 3, underway: true, yuloh: 1, drift: { s0: 0, w: 0.03, amp: 8, lat: -0.15 } });
  // 桥上人群：凭栏看船、指点呼喊
  {
    const { f, L, deck, HW } = BRIDGE;
    for (let i = 0; i < 34; i++) {
      const t = 0.22 + R() * 0.56;
      const side = R() < 0.62 ? 1 : -1; // +x 侧朝东（船来的方向）
      const lx = side * (HW - 0.6);
      const p = f.pt(lx, 0, (t - 0.5) * L);
      addPerson({ x: p.x, z: p.z, y: deck(t) + 0.12, yaw: BRIDGE.yaw + side * Math.PI / 2, act: ACT.rail, variant: R() < 0.35 ? 1 : 0, phase: R() * 30 });
    }
    // 桥面摊贩：伞与席棚
    for (const [t, sx] of [[0.12, 1], [0.16, -1], [0.85, 1], [0.9, -1], [0.3, -1], [0.72, 1]]) {
      const p = f.pt(sx * (HW - 1.4), 0, (t - 0.5) * L);
      umbrella(p.x, p.z, 1.5, jit(0xc8b48c, 0.06), { y: deck(t) + 0.12, h: 2.3, stall: false });
      const st = f.pt(sx * (HW - 1.2), 0, (t - 0.5) * L + 0.5);
      const sf = frame(st.x, deck(t) + 0.12, st.z, BRIDGE.yaw);
      const SBv = SB('vc', st.x);
      SBv.add(gBox(), sf(0, 0.7, 0, 0, 0, 0, 0.8, 0.06, 1.4), 0x6a5038);
      for (let k = 0; k < 5; k++) SBv.add(gSphere(6, 4), sf((R() - 0.5) * 0.5, 0.8, (R() - 0.5) * 1.1, 0, 0, 0, 0.2, 0.14, 0.2), jit(R.pick([0xc9b48a, 0x9a6a48, 0x7a8a6a, 0xd8ccb0]), 0.1));
      const vp = f.pt(sx * (HW - 2.1), 0, (t - 0.5) * L + 0.4);
      addPerson({ x: vp.x, z: vp.z, y: deck(t) + 0.12, yaw: BRIDGE.yaw + sx * Math.PI / 2, act: ACT.work, body: 'short' });
    }
    // 过桥的行人、轿子与骑马者（桥上“争道”）
    const bp = new Path2([P(2855, 206), BRIDGE.A, BRIDGE.Bf, P(3180, 30)]);
    populate(bp, 30, { lat: 2.0, span: 60, mix: { walk: 50, porter: 20, back: 10, scholar: 8, sack: 5, lead: 4, ride: 3 } });
    const sd = addSedan({}), r1 = riderOn('horse', { body: 'robe', hat: 'futouWing', beard: true });
    const s0 = bp.nearest(BRIDGE.cx, BRIDGE.cz).s;
    convoy(bp, s0 - 6, 50, 0.6, [{ ent: sd, back: 0, lat: -1.2 }, { ent: addPerson({ act: ACT.bear, body: 'short' }), back: -1.55, lat: -1.2 }, { ent: addPerson({ act: ACT.bear, body: 'short' }), back: 1.55, lat: -1.2 }], 1);
    convoy(bp, s0 + 6, 50, 0.6, [{ ent: r1.an, back: 0, lat: 1.3 }, { ent: r1.rd, back: 0.08, lat: 1.3, dy: r1.dy }, { ent: addPerson({ act: ACT.lead, body: 'short' }), back: -1.6, lat: 1.7 }, { ent: addPerson({ act: ACT.wave, body: 'short' }), back: 1.8, lat: 1.0 }], -1);
  }
  // 北桥头
  bld(3150, 8, 8, 5, { face: 'road', open: true, interior: true, porch: 2 });
  UMB(3125, 20, 1.6); UMB(3090, 12, 1.5);
  // ---- 南桥头至十千脚店 ----
  bld(2965, 245, 13, 8, { face: 'road', h: 3.8, type: 'xieshan', open: true, interior: true, label: '桥头酒店' });
  // 河边摊棚
  SH(2885, 150, 3.2, 2.6, { yaw: BRIDGE.yaw + Math.PI }); SH(2850, 140, 3.4, 2.6); SH(2815, 135, 3.0, 2.4);
  UMB(2860, 165, 1.8); UMB(2830, 158, 1.7); UMB(2905, 228, 1.8); UMB(2885, 238, 1.7);
  // 望杆：杆上横木，顶上立鸟
  {
    const p = P(2772, 190);
    const y = groundY(p.x, p.y);
    const B = SB('vc', p.x);
    B.add(gCyl(6), M(p.x, y + 6, p.y, 0, 0, 0, 0.22, 12, 0.22), 0x4a3a2c);
    B.add(gBox(), M(p.x, y + 10.2, p.y, 0, 0.4, 0, 1.8, 0.12, 0.12), 0x4a3a2c);
    B.add(gSphere(6, 4), M(p.x, y + 12.2, p.y, 0, 0, 0, 0.26, 0.24, 0.5), 0xe8e0d0);
  }
  // 十千脚店：门前彩楼欢门
  bld(2700, 258, 11, 8, { face: 'road', h: 3.8, open: true, interior: true, cailou: { h: 9.5, w: 10, levels: 6, dz: 1.6 }, kitchen: true, label: '十千脚店', major: true });
  {
    const nr = nearestRoad(PX(2700), PZ(258));
    const yaw = yawToward(PX(2700), PZ(258), nr.px, nr.pz);
    const p = P(2688, 236);
    signBoard(p.x + 3.6, groundY(p.x, p.y) + 2.3, p.y + 1.0, yaw, '十千脚店', { h: 2.3, w: 0.55 });
    winePole(PX(2735), PZ(228), 7, yaw + Math.PI / 2);
  }
  bld(2600, 252, 9, 7, { face: 'road', open: true, interior: true, porch: 2.2 });
  bld(2510, 230, 12, 8, { face: 'road', stories: 2, h: 3.2, h2: 2.8, open: true, interior: true, upPatrons: true, label: '酒楼' });
  bld(2420, 222, 9, 6, { face: 'road', open: true, interior: true });
  bld(2340, 220, 10, 7, { face: 'road', h: 3.4 });
  // 后排屋顶
  for (let k = 0; k < 7; k++) bld(2980 - k * 95 + R() * 25, 280, 11, 7, { face: 'N', keep: true });
  // 河岸边临水的饮食店（南岸，面向河）
  bld(2330, 128, 10, 6, { face: 'N', open: true, interior: true, porch: 2.4, porchTables: true, keep: true, kitchen: true, label: '临河食店' });
  bld(2255, 120, 9, 5.5, { face: 'N', open: true, interior: true, keep: true });
  T(2440, 140, 1.2, { leafy: 0x5e624c }); T(2395, 150, 1.0);
  W(2600, 160, 1.2); W(2780, 155, 1.15, { lean: -0.3 });
  // 远岸（北岸，桥西）店铺一排
  for (let k = 0; k < 9; k++) bld(2930 - k * 62, 0, 9 + R() * 3, 5.5, { face: 'road', open: R() < 0.6, interior: R() < 0.5 });
  W(2900, 26, 1.1); W(2700, 22, 1.2); W(2520, 18, 1.1);
  // 桥西的船
  boat(2790, 0.78, { type: 'passenger', len: 22, crew: 2 });
  boat(2625, 0.8, { type: 'passenger', len: 20, crew: 2, flip: true });
  boat(2405, -0.55, { type: 'cargo', len: 17, crew: 2 });
  boat(2380, -0.1, { type: 'cargo', len: 15, crew: 2, flip: true });
  boat(2355, -0.72, { type: 'small', len: 11, crew: 1 });
  boat(2460, 0.05, { type: 'cargo', len: 12, crew: 4, underway: true, yuloh: 1, drift: { s0: 0, w: 0.035, amp: 7, lat: 0.05 } });
  boat(2505, 0.6, { type: 'small', len: 10, mast: 'up', mastH: 7, crew: 2, yuloh: -1 });
  // 南岸街市人流（桥头到城郊）
  populate(ROADS.town, 70, { lo: 0.0, hi: 0.22, lat: 3.6, mix: { walk: 40, porter: 15, back: 6, sack: 4, lead: 7, ride: 6, sedan: 4, barrow: 5, ox: 2, scholar: 8 } });
  // 桥头摊贩与围观
  group(2840, 205, 5, 1.8, {});
  group(2760, 205, 4, 1.4, {});
  stand(2850, 190, { act: ACT.work, body: 'short' }); stand(2826, 182, { act: ACT.work, body: 'short' });
  populate(ROADS.farBankW, 14, { lat: 1.4 });
}

// ============================================================
// 第三段：城门街市（xo 2250 → 127）
// ============================================================
function sceneCity() {
  // ---- 城郊（2250 → 1365）----
  bld(2190, 215, 12, 7, { face: 'road', open: true, interior: true, porch: 2.4, porchTables: true, label: '茶坊' });
  bld(2090, 225, 10, 7, { face: 'road', h: 3.4 });
  bld(2000, 222, 13, 8, { face: 'road', open: true, interior: true, type: 'xieshan' });
  bld(1910, 220, 10, 7, { face: 'road', open: true, interior: true, porch: 2.2, porchTables: true });
  bld(1800, 228, 14, 8, { face: 'road', h: 3.6, open: true, interior: true, porch: 2.6, porchTables: true, kitchen: true, label: '脚店' });
  bld(1700, 222, 11, 7, { face: 'road' });
  bld(1615, 225, 10, 7, { face: 'road', open: true, interior: true });
  for (let k = 0; k < 8; k++) bld(2200 - k * 95 + R() * 30, 272, 11, 7, { face: 'N', keep: true });
  // 北侧
  bld(2160, 110, 9, 6, { face: 'road', open: true, interior: true, porch: 2.2 });
  bld(2080, 100, 10, 6, { face: 'road', roof: 'thatch', open: true, interior: true, porch: 2.6, porchTables: true, label: '茶棚' });
  bld(1960, 108, 9, 6, { face: 'road', open: true, interior: true });
  bld(1880, 104, 10, 6, { face: 'road', h: 3.3 });
  bld(1820, 70, 12, 7, { face: 'road', h: 3.6, type: 'xieshan', label: '宅院' });
  fence([P(1860, 105), P(1790, 108)]);
  bld(1720, 100, 9, 6, { face: 'road', open: true, interior: true, porch: 2 });
  bld(1640, 98, 10, 6, { face: 'road', open: true, interior: true });
  bld(1560, 110, 8, 5.5, { face: 'road', roof: 'thatch', open: true, porch: 2.2, porchTables: true });
  for (let k = 0; k < 8; k++) bld(2240 - k * 100 + R() * 30, 30, 10, 6, { face: 'S' });
  // 修车的、水井
  { const p = P(2135, 128); well(p.x, p.y); stand(2132, 132, { act: ACT.work, body: 'short' }); stand(2140, 124, { act: ACT.idle, variant: 1 }); }
  { const p = P(2105, 140); const B = SB('vc', p.x); const y = groundY(p.x, p.y); B.add(new THREE.TorusGeometry(0.75, 0.06, 4, 16).toNonIndexed(), M(p.x, y + 0.08, p.y, Math.PI / 2, 0, 0, 1, 1, 1), 0x4e3a28); stand(2108, 143, { act: ACT.squat, body: 'short' }); }
  UMB(1560, 150, 1.9); SH(1590, 148, 3.2, 2.4);
  // 树木：城郊多柳、杂树
  W(1985, 90, 1.3); W(1940, 150, 1.2); W(2225, 140, 1.25); T(2215, 60, 1.2, { leafy: 0x6c7058 });
  W(1765, 100, 1.4, { lean: 0.3 }); W(1720, 70, 1.3); W(1680, 140, 1.2); T(1600, 60, 1.1, { leafy: 0x5e624c });
  T(1840, 140, 1.0); T(1530, 140, 1.15, { leafy: 0x5e624c }); W(1650, 180, 1.0);
  for (let i = 0; i < 10; i++) T(1520 + R() * 700, 240 + R() * 35, 0.9 + R() * 0.3, { leafy: R() < 0.5 ? 0x5e624c : null });
  // 城郊大路上的人流、牛车
  populate(ROADS.town, 70, { lo: 0.22, hi: 0.5, lat: 4.2, mix: { walk: 38, porter: 14, back: 6, sack: 3, lead: 8, ride: 6, sedan: 4, barrow: 5, ox: 5, scholar: 8, camel: 1 } });
  group(1760, 170, 4, 1.5, {}); group(1880, 160, 3, 1.2, {});
  // ---- 城门 ----
  buildGate();
  // 城濠上的平桥（两侧栏杆，有人倚栏看水）
  {
    const x0 = PX(1300), x1 = PX(1352), z0 = PZ(168), z1 = PZ(236);
    const B = SB('vc', x0);
    B.add(gBox(), M((x0 + x1) / 2, 0.3, (z0 + z1) / 2, 0, 0, 0, x1 - x0, 0.25, z1 - z0), 0x8a7458);
    for (const z of [z0, z1]) {
      B.add(gBox(), M((x0 + x1) / 2, 1.2, z, 0, 0, 0, x1 - x0, 0.1, 0.12), 0x5a4532);
      B.add(gBox(), M((x0 + x1) / 2, 0.75, z, 0, 0, 0, x1 - x0, 0.06, 0.06), 0x5a4532);
      for (let x = x0; x <= x1 + 0.01; x += 1.25) B.add(gBox(), M(x, 0.75, z, 0, 0, 0, 0.12, 1.0, 0.12), 0x5a4532);
      for (let x = x0; x <= x1 + 0.01; x += 3.1) B.add(gCyl(6), M(x, -0.9, z, 0, 0, 0, 0.3, 2.4, 0.3), 0x4a3a2c);
    }
    WORLD.flatBridges = WORLD.flatBridges || [];
    WORLD.flatBridges.push({ x0, x1, z0, z1, y: 0.45 });
    for (let i = 0; i < 9; i++) {
      const x = lerp(x0 + 0.5, x1 - 0.5, R());
      addPerson({ x, z: z1 - 0.55, y: 0.45, yaw: 0, act: ACT.rail, variant: R() < 0.2 ? 1 : 0 });
    }
    for (let i = 0; i < 5; i++) addPerson({ x: lerp(x0 + 0.5, x1 - 0.5, R()), z: z0 + 0.55, y: 0.45, yaw: Math.PI, act: ACT.rail });
  }
  // 城门前后的树
  for (const [xo, yo, s] of [[1210, 80, 1.2], [1260, 40, 1.3], [1330, 100, 1.2], [1390, 60, 1.25], [1430, 120, 1.1], [1240, 130, 1.1], [1190, 240, 1.2], [1240, 260, 1.3], [1400, 250, 1.2], [1460, 270, 1.1], [1150, 50, 1.0], [1380, 15, 1.1]]) T(xo, yo, s, { leafy: R() < 0.6 ? 0x5a604a : null });
  W(1300, 135, 1.3); W(1440, 225, 1.2, { lean: 0.3 }); W(1170, 120, 1.1);
  // 出城的驼队
  {
    const path = ROADS.town;
    const s0 = path.nearest(PX(1080), PZ(182)).s;
    const mem = [{ ent: addPerson({ act: ACT.lead, body: 'short', hat: 'douli' }), back: -2.4, lat: 0.5 }];
    for (let q = 0; q < 4; q++) mem.push({ ent: addAnimal({ species: 'camel', act: 1, gear: 'camelPack' }), back: q * 3.5, lat: 0.5 });
    convoy(path, s0, 90, 0.55, mem, -1);
    STATIC.labels.push({ text: '驼队出城', pos: V(PX(1150), 9, PZ(180)), minor: true });
  }
  // 歇脚的独轮车、挑夫
  stand(1320, 205, { act: ACT.squat, body: 'short' }); stand(1326, 200, { act: ACT.idle, variant: 1, body: 'short' });
  populate(ROADS.gateN, 6, { lat: 1.0, mix: { walk: 60, porter: 25, back: 15 } });
  // ---- 城内：孙羊正店一带（1000 → 650）----
  // 门内税务所（城门内侧小屋）
  bld(1010, 235, 8, 6, { face: 'road', open: true, interior: true, label: '税务所' });
  group(1000, 215, 4, 1.4, {});
  bld(960, 110, 10, 7, { face: 'road', open: true, interior: true, porch: 2.4, porchTables: true, label: '饮子铺' });
  bld(905, 115, 9, 7, { face: 'road', open: true, counter: false });
  // 酒桶
  for (let i = 0; i < 6; i++) { const p = P(895 + i * 4, 140); SB('vc', p.x).add(gCyl(10), M(p.x, groundY(p.x, p.y) + 0.55, p.y, 0, 0, 0, 0.9, 1.1, 0.9), 0x6a5038); }
  // 孙羊正店：二层大酒楼 + 彩楼欢门
  bld(820, 85, 22, 12, { face: 'road', stories: 2, h: 4.0, h2: 3.4, open: true, interior: true, upPatrons: true, type: 'xieshan', cailou: { h: 11, w: 12, levels: 7, dz: 2.0 }, kitchen: true, label: '孙羊正店', major: true });
  {
    const p = P(765, 140), y = groundY(p.x, p.y);
    signBoard(p.x, y + 2.4, p.y, 0, '正店', { h: 1.4, w: 0.7 });
    const p2 = P(860, 140);
    signBoard(p2.x, groundY(p2.x, p2.y) + 2.0, p2.y, 0, '香', { h: 0.9, w: 0.7 });
    winePole(PX(745), PZ(150), 9, Math.PI / 2, null);
    winePole(PX(890), PZ(152), 8, -Math.PI / 2, null);
    // 店前栀子灯
    for (const xo of [780, 800, 840]) { const q = P(xo, 150); SB('vc', q.x).add(gSphere(8, 6), M(q.x, groundY(q.x, q.y) + 2.0, q.y, 0, 0, 0, 0.5, 0.6, 0.5), 0xd9c69e); }
  }
  bld(740, 98, 9, 7, { face: 'road', open: true, interior: true });
  bld(690, 100, 10, 7, { face: 'road', open: true, counter: true, label: '匹帛铺' });
  // 南侧
  bld(930, 245, 13, 8, { face: 'road', open: true, interior: true, porch: 2.6, porchTables: true });
  bld(850, 248, 11, 8, { face: 'road', h: 3.5, type: 'xieshan' });
  bld(770, 242, 10, 7, { face: 'road', open: true, interior: true });
  // 牲口、驮货
  for (let i = 0; i < 4; i++) addAnimal({ x: PX(870 + i * 9), z: PZ(158 + (i % 2) * 6), yaw: 1.6 + R() * 0.4, species: i < 3 ? 'donkey' : 'horse', act: 0, gear: i < 3 ? 'donkeyPack' : 'horseSaddle' });
  stand(880, 168, { act: ACT.idle, variant: 1, body: 'short' }); stand(905, 162, { act: ACT.work, body: 'short' });
  // 正店门前人群
  group(790, 165, 7, 2.2, {}); group(840, 170, 5, 1.8, {});
  // ---- 十字街口（650 → 400）----
  // 说书人与听众
  {
    const c = P(620, 135);
    addPerson({ x: c.x, z: c.y, yaw: Math.PI, act: ACT.idle, variant: 1, body: 'robe', beard: true, gait: 3, label: '说书' });
    group(620, 135, 11, 2.6, { act: ACT.idle });
    STATIC.labels.push({ text: '说书', pos: V(c.x, 6, c.y), minor: true });
  }
  bld(600, 70, 10, 7, { face: 'road', open: true, interior: true, label: '王家罗明匹帛铺' });
  bld(520, 55, 10, 7, { face: 'road', open: true, interior: false, label: '刘家上色沉檀拣香' });
  { const p = P(536, 95); signBoard(p.x + 2.5, groundY(p.x, p.y) + 2.2, p.y, -Math.PI / 2, '刘家上色沉檀拣香', { h: 3.6, w: 0.5 }); }
  { const p = P(598, 95); signBoard(p.x - 2.8, groundY(p.x, p.y) + 2.2, p.y, Math.PI / 2, '王家罗明匹帛铺', { h: 3.4, w: 0.5 }); }
  bld(660, 60, 9, 6, { face: 'road', open: true, interior: true });
  bld(480, 100, 9, 7, { face: 'road', open: true, interior: true, porch: 2 });
  bld(600, 15, 10, 6, { face: 'road' }); bld(545, 0, 9, 6, { face: 'road', open: true });
  // 南：久住王员外家（客店，楼上有人读书）
  bld(560, 240, 14, 8, { face: 'road', stories: 2, h: 3.4, h2: 2.8, open: true, interior: true, upPatrons: true, label: '久住王员外家', major: true });
  { const p = P(545, 200); signBoard(p.x - 4.5, groundY(p.x, p.y) + 2.0, p.y, 0, '久住王员外家', { h: 3.2, w: 0.5 }); }
  bld(640, 245, 10, 7, { face: 'road', open: true, interior: true, porch: 2.2 });
  bld(470, 240, 10, 7, { face: 'road', open: true, interior: true, label: '酒肆' });
  bld(510, 278, 9, 6, { face: 'road' });
  // 驴拉酒桶车
  {
    const c = addCart({ type: 'handCart' });
    const path = ROADS.town;
    const s0 = path.nearest(PX(520), PZ(200)).s;
    convoy(path, s0, 40, 0.5, [{ ent: c, back: 0, lat: 2.5 }, { ent: addAnimal({ species: 'donkey', act: 2 }), back: -3.3, lat: 2.2 }, { ent: addAnimal({ species: 'donkey', act: 2 }), back: -3.3, lat: 2.9 }, { ent: addPerson({ act: ACT.lead, body: 'short', prop: 'stick' }), back: -2.5, lat: 3.6 }], -1);
  }
  // 街口伞摊
  UMB(480, 125, 2.0); UMB(440, 130, 1.8); UMB(505, 140, 1.7); UMB(420, 140, 1.9);
  stand(478, 132, { act: ACT.work, body: 'short' }); stand(440, 138, { act: ACT.work, body: 'short' });
  // ---- 卷尾：赵太丞家（400 → 127）----
  bld(235, 95, 12, 8, { face: 'road', open: true, interior: true, counter: true, label: '赵太丞家', major: true });
  { const p = P(235, 120); signBoard(p.x, groundY(p.x, p.y) + 3.3, p.y + 0.3, 0, '赵太丞家', { vertical: false, w: 2.6, h: 0.7 }); }
  group(240, 128, 4, 1.2, {});
  { const p = P(300, 145); well(p.x, p.y); stand(296, 140, { act: ACT.work, body: 'short' }); stand(305, 150, { act: ACT.lift, body: 'short', gait: 1.8 }); stand(309, 142, { act: ACT.idle, body: 'short', variant: 1 }); }
  bld(320, 90, 10, 7, { face: 'road', open: true, interior: true });
  bld(160, 92, 10, 8, { face: 'road', h: 3.4 });
  bld(380, 95, 9, 7, { face: 'road', open: true, interior: true, porch: 2.2, porchTables: true });
  bld(240, 30, 18, 10, { face: 'S', h: 4.4, type: 'hip', lift: 0.6, label: '寺观' });
  bld(330, 40, 10, 7, { face: 'S' }); bld(160, 40, 10, 7, { face: 'S' });
  UMB(360, 130, 1.9); UMB(385, 128, 1.8); UMB(345, 140, 1.7);
  // 南：解库
  bld(300, 245, 12, 8, { face: 'road', open: true, interior: true, label: '解库' });
  { const p = P(300, 212); signBoard(p.x + 3.5, groundY(p.x, p.y) + 1.8, p.y, 0, '解', { h: 0.8, w: 0.7 }); }
  bld(380, 240, 10, 7, { face: 'road', open: true, interior: true, porch: 2.2 });
  bld(210, 240, 10, 7, { face: 'road', h: 3.3 });
  bld(140, 245, 9, 7, { face: 'road', open: true });
  W(150, 70, 1.2, { green: true }); T(190, 150, 1.0); T(400, 270, 1.1, { leafy: 0x5e624c }); T(120, 250, 1.0);
  // 城内街市人流
  populate(ROADS.town, 150, { lo: 0.5, hi: 1.0, lat: 4.8, mix: { walk: 40, porter: 12, back: 5, sack: 3, lead: 6, ride: 6, sedan: 5, barrow: 4, ox: 1, scholar: 14 } });
  populate(ROADS.crossN, 16, { lat: 1.8 });
  populate(ROADS.crossS, 10, { lat: 1.8 });
  // 路边闲谈的人
  for (const [xo, yo, n] of [[700, 190, 4], [655, 200, 3], [450, 175, 5], [380, 190, 4], [300, 180, 3], [200, 185, 4], [980, 190, 3]]) group(xo, yo, n, 1.3, {});
  // 狗
  addAnimal({ x: PX(560), z: PZ(170), yaw: 1, species: 'dog', act: 0 });
  addAnimal({ x: PX(1600), z: PZ(160), yaw: 2.4, species: 'dog', act: 1, phase: 0 });
}

function buildScenes(scene) {
  sceneRural();
  sceneRiver(scene);
  sceneCity();
}
