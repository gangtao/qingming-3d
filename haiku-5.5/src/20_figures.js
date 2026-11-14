/* ===== 20 人物、牲口、车、船：实例化骨架与动画 =====
 * 每一类（人、各种牲口、车、船）共用一套零件网格（InstancedMesh），
 * 每个个体只存一组矩阵，每帧按步态更新。零件之间用“轴点”旋转：腿绕胯转，臂绕肩转。
 * 约定：人和牲口的正面朝 +Z；船和车的正面朝 +X（沿河、沿路前进）。
 */
var WHITE = new THREE.Color(1, 1, 1);
var _o = new THREE.Matrix4(), _a = new THREE.Matrix4(), _b = new THREE.Matrix4(), _c = new THREE.Matrix4();
var ZERO = new THREE.Matrix4().makeScale(0, 0, 0);

var ROBES = ['#7b5a3c', '#5f6e5a', '#8c3b2e', '#3e4b61', '#a6875a', '#4d4238', '#6b4f6e', '#c0a77a', '#2f3a33', '#8a7450', '#9c6a4c'];
var PANTS = ['#3c3530', '#4a4236', '#5b4a3a', '#2e2a26', '#6b5a48'];
var SKINS = ['#e6c3a0', '#d9b08a', '#c99a74', '#e9cba9'];
var COATS = { horse: ['#5b4330', '#2e2620', '#8a6a48', '#6e5638'], donkey: ['#7a6a58', '#8e7d68', '#5e5246'], ox: ['#8a6446', '#5e4632', '#a88a62'] };
var PACKS = ['#b59c6a', '#8a3e2a', '#6c7a5e', '#d8c49a', '#7d6a4a'];

/* 通用的实例化骨架：defs = [{name, geo, mat?, pivot?, axis?}] */
class Rig {
  constructor(defs, count) {
    this.count = count; this.parts = {};
    for (const d of defs) {
      const mesh = new THREE.InstancedMesh(d.geo, d.mat || MAT.vc, Math.max(1, count));
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      for (let i = 0; i < Math.max(1, count); i++) mesh.setColorAt(i, WHITE);
      QM.scene.add(mesh);
      this.parts[d.name] = { mesh, pivot: d.pivot || [0, 0, 0], axis: d.axis || 'x' };
    }
  }
  color(part, i, c) { this.parts[part].mesh.setColorAt(i, c); }
  finishColors() { for (const k in this.parts) this.parts[k].mesh.instanceColor.needsUpdate = true; }
  // 把第 i 个实例的某个零件摆到 base 变换下，并绕轴点转 ang 弧度
  put(part, i, base, ang = 0, hide = false) {
    const p = this.parts[part];
    if (hide) { p.mesh.setMatrixAt(i, ZERO); return; }
    if (ang) {
      const pv = p.pivot;
      _a.makeTranslation(pv[0], pv[1], pv[2]);
      if (p.axis === 'z') _b.makeRotationZ(ang); else _b.makeRotationX(ang);
      _c.makeTranslation(-pv[0], -pv[1], -pv[2]);
      _o.multiplyMatrices(base, _a).multiply(_b).multiply(_c);
      p.mesh.setMatrixAt(i, _o);
    } else {
      p.mesh.setMatrixAt(i, base);
    }
  }
  commit() { for (const k in this.parts) this.parts[k].mesh.instanceMatrix.needsUpdate = true; }
}

/* ---------- 人 ---------- */
function humanDefs() {
  const leg = (x) => new Geo().box(x, 0.4, 0, 0.13, 0.8, 0.15).build();
  const arm = (x) => new Geo().box(x, 1.07, 0, 0.11, 0.66, 0.11).build();
  const torso = new Geo().cyl(0, 1.15, 0, 0.19, 0.27, 0.7, 7).build();          // 长衫下摆略宽
  const head = new Geo().add(new THREE.SphereGeometry(0.13, 8, 6), M(0, 1.63, 0, 0, 0, 0, 0.92, 1.1, 1)).build();
  const hair = new Geo().box(0, 1.7, -0.07, 0.17, 0.1, 0.12, 0x2a2420).build();  // 发髻
  const cap = new Geo()                                                          // 幞头
    .box(0, 1.76, -0.02, 0.24, 0.1, 0.22, 0x2a2420)
    .box(-0.2, 1.8, -0.02, 0.14, 0.03, 0.04, 0x2a2420)
    .box(0.2, 1.8, -0.02, 0.14, 0.03, 0.04, 0x2a2420).build();
  const straw = new Geo().cyl(0, 1.76, 0, 0.17, 0.52, 0.2, 14, 0xc4a46c).build(); // 斗笠
  const pole = new Geo().box(0, 1.42, 0.08, 1.7, 0.05, 0.05, 0x6d5233)           // 扁担
    .cyl(-0.8, 1.0, 0.08, 0.22, 0.18, 0.28, 8, 0x8a6a40)
    .cyl(0.8, 1.0, 0.08, 0.22, 0.18, 0.28, 8, 0x8a6a40).build();
  return [
    { name: 'legL', geo: leg(-0.09), pivot: [-0.09, 0.8, 0] },
    { name: 'legR', geo: leg(0.09), pivot: [0.09, 0.8, 0] },
    { name: 'torso', geo: torso },
    { name: 'armL', geo: arm(-0.26), pivot: [-0.26, 1.4, 0] },
    { name: 'armR', geo: arm(0.26), pivot: [0.26, 1.4, 0] },
    { name: 'head', geo: head },
    { name: 'hair', geo: hair },
    { name: 'cap', geo: cap },
    { name: 'straw', geo: straw },
    { name: 'pole', geo: pole },
  ];
}

var PEOPLE = [];
function addPerson(o) {
  const e = Object.assign({
    mode: 'idle', dir: 1, speed: 1, ph: rnd(0, 6.3), x: 0, y: 0, z: 0, x0: 0, x1: 0, yaw: 0,
    carry: false, hat: 'cap', robe: pick(ROBES), pants: pick(PANTS), skin: pick(SKINS), boat: null,
  }, o);
  PEOPLE.push(e); return e;
}

/* ---------- 牲口 ---------- */
var ANIMALS = [];
function addAnimal(kind, o) {
  const e = Object.assign({
    kind, mode: 'walk', dir: 1, speed: 1, ph: rnd(0, 6.3), x: 0, y: 0, z: 0, x0: 0, x1: 0, yaw: 0,
    coat: pick(COATS[kind]), pack: pick(PACKS), hasPack: kind !== 'ox',
  }, o);
  ANIMALS.push(e); return e;
}
function animalDefs(kind) {
  const S = {
    horse: { lh: 1.0, bh: 0.72, bw: 0.7, bl: 2.0, hd: 0.85, tail: 0.7 },
    donkey: { lh: 0.8, bh: 0.6, bw: 0.55, bl: 1.7, hd: 0.7, tail: 0.6 },
    ox: { lh: 0.95, bh: 0.9, bw: 0.95, bl: 2.2, hd: 0.9, tail: 0.8 },
  }[kind];
  const { lh, bh, bw, bl } = S, by = lh + bh / 2;
  const body = new Geo().box(0, by, 0, bw, bh, bl).build();
  const neck = new Geo().box(0, lh + bh * 0.85, bl / 2 + 0.15, bw * 0.42, bh * 1.3, 0.5, 0.6).build();
  const headG = new Geo().box(0, lh + bh * 1.2, bl / 2 + 0.55, bw * 0.42, bh * 0.5, S.hd, 0.2);
  if (kind === 'ox') {
    headG.cyl(-0.3, lh + bh * 1.45, bl / 2 + 0.5, 0.03, 0.12, 0.42, 5, 0xe8dcc0, 0, 0, 0.8)
      .cyl(0.3, lh + bh * 1.45, bl / 2 + 0.5, 0.03, 0.12, 0.42, 5, 0xe8dcc0, 0, 0, -0.8);
  }
  const head = headG.build();
  const tail = new Geo().box(0, lh + bh * 0.7, -bl / 2 - 0.1, 0.08, S.tail, 0.08, 0xffffff, -0.4).build();
  const legs = (px, pz) => new Geo().box(px, lh / 2, pz, 0.16, lh, 0.16).build();
  const px = bw * 0.32, pzf = bl * 0.36, pzb = -bl * 0.36;
  const defs = [
    { name: 'body', geo: body }, { name: 'neck', geo: neck }, { name: 'head', geo: head }, { name: 'tail', geo: tail },
    { name: 'legFL', geo: legs(-px, pzf), pivot: [-px, lh, pzf] },
    { name: 'legFR', geo: legs(px, pzf), pivot: [px, lh, pzf] },
    { name: 'legBL', geo: legs(-px, pzb), pivot: [-px, lh, pzb] },
    { name: 'legBR', geo: legs(px, pzb), pivot: [px, lh, pzb] },
    { name: 'pack', geo: new Geo().box(0, by + bh / 2 + 0.25, -0.2, bw * 1.1, 0.55, bl * 0.45).build() },
  ];
  return defs;
}

/* ---------- 车：牛车、独轮车、轿子 ---------- */
var CARTS = [];
function addCart(kind, o) {
  const e = Object.assign({ kind, mode: 'walk', dir: 1, speed: 1, ph: 0, spin: 0, x: 0, y: 0, z: 0, x0: 0, x1: 0, yaw: 0, ox: -1 }, o);
  CARTS.push(e); return e;
}
function wheelGeo(x, y, z, r, th = 0.16) {
  const g = new Geo();
  g.cyl(x, y, z, r, r, th, 16, 0x6d5233, Math.PI / 2, 0, 0);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2;
    g.stick([x, y, z], [x, y + Math.sin(a) * r * 0.92, z + 0.0], 0.05, 0.05, 0x3f2c1b, 4);
    g.stick([x, y, z], [x + Math.cos(a) * r * 0.92, y, z], 0.0, 0.0, 0x3f2c1b, 4);
  }
  return g.build();
}
function cartDefs(kind) {
  if (kind === 'oxcart') {
    const b = new Geo();
    b.box(0, 1.15, 0, 3.0, 0.25, 2.0, 0x6d5233);                              // 车床
    b.box(0, 1.5, -1.0, 3.0, 0.55, 0.1, 0x6d5233).box(0, 1.5, 1.0, 3.0, 0.55, 0.1, 0x6d5233);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cyl(sx * 1.3, 1.9, sz * 1.0, 0.07, 0.07, 1.5, 5, 0x4a3524);
    b.tri(roofTris(3.6, 2.6, 2.6, 0.9, 0.4, 0.3), 0xcdbb8e);                 // 席篷
    b.stick([1.5, 1.1, -0.45], [3.9, 0.8, -0.45], 0.07, 0.06, 0x4a3524);      // 车辕
    b.stick([1.5, 1.1, 0.45], [3.9, 0.8, 0.45], 0.07, 0.06, 0x4a3524);
    return [
      { name: 'body', geo: b.build(), mat: MAT.vc2 },
      { name: 'wheelL', geo: wheelGeo(0, 1.0, -1.1, 1.0), pivot: [0, 1.0, -1.1], axis: 'z', mat: MAT.vc2 },
      { name: 'wheelR', geo: wheelGeo(0, 1.0, 1.1, 1.0), pivot: [0, 1.0, 1.1], axis: 'z', mat: MAT.vc2 },
    ];
  }
  if (kind === 'barrow') {
    const b = new Geo();
    b.box(-0.2, 0.62, 0, 1.2, 0.36, 0.9, 0x6d5233);                           // 车斗
    b.stick([-0.8, 0.6, -0.45], [-1.9, 0.9, -0.45], 0.05, 0.05, 0x4a3524);
    b.stick([-0.8, 0.6, 0.45], [-1.9, 0.9, 0.45], 0.05, 0.05, 0x4a3524);
    return [
      { name: 'body', geo: b.build(), mat: MAT.vc2 },
      { name: 'wheel', geo: wheelGeo(0.45, 0.45, 0, 0.45, 0.1), pivot: [0.45, 0.45, 0], axis: 'z', mat: MAT.vc2 },
    ];
  }
  // 轿子：红漆轿身，顶为小歇山，前后有两根抬杠
  const s = new Geo();
  s.box(0, 1.2, 0, 1.6, 0.8, 1.2, 0x7a2c1e);
  s.tri(roofTris(1.9, 1.5, 1.6, 0.6, 0.25, 0.1), 0x3e2a1c);
  s.stick([-2.2, 1.0, -0.5], [2.2, 1.0, -0.5], 0.06, 0.06, 0x4a3524);
  s.stick([-2.2, 1.0, 0.5], [2.2, 1.0, 0.5], 0.06, 0.06, 0x4a3524);
  return [{ name: 'body', geo: s.build(), mat: MAT.vc2 }];
}

/* ---------- 船 ---------- */
var BOATS = [];
function addBoat(kind, o) {
  const e = Object.assign({ kind, mode: 'walk', dir: 1, speed: 0.6, ph: rnd(0, 6), x: 0, y: 0, z: 0, x0: 0, x1: 0, yaw: 0, mat: null, tint: pick(['#ffffff', '#f0e6d0', '#d8ccb0', '#e8dcc4']) }, o);
  BOATS.push(e); return e;
}

/* ---------- 人物的基座矩阵与动画 ---------- */
var _bt = new THREE.Matrix4(), _tmp = new THREE.Matrix4(), _rot = new THREE.Matrix4();
var HUMAN = null, ANIM = {}, CART = {}, BOATR = {};

function pingPong(e, dt) {
  e.x += e.dir * e.speed * dt;
  if (e.x > e.x1) { e.x = e.x1; e.dir = -1; }
  else if (e.x < e.x0) { e.x = e.x0; e.dir = 1; }
  e.ph += dt * e.speed * (e.gait || 4.2);
}

function updateMoving(dt) {
  QM.t = (QM.t || 0) + dt;
  // 船：先算船身矩阵，船上的人跟着它走
  for (const b of BOATS) {
    if (b.mode === 'walk') pingPong(b, dt);
    b.ph += dt;
    b.yaw = b.dir > 0 ? 0 : Math.PI;
    const bob = Math.sin(b.ph * 1.7 + b.x * 0.05) * 0.09;
    const roll = Math.sin(b.ph * 1.1) * 0.035, pitch = Math.sin(b.ph * 0.8) * 0.02;
    b.mat = M(b.x, bob, b.z, pitch, b.yaw, roll);
    BOATR[b.kind].put('hull', b.i, b.mat);
  }
  // 车（牛车带着牛走）
  for (const c of CARTS) {
    if (c.mode === 'walk') pingPong(c, dt);
    c.yaw = c.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    c.spin += c.dir * c.speed * dt / 1.0;
    _bt.makeRotationY(c.yaw); _bt.setPosition(c.x, 0, c.z);
    const r = CART[c.kind];
    r.put('body', c.i, _bt);
    if (r.parts.wheelL) { r.put('wheelL', c.i, _bt, c.spin); r.put('wheelR', c.i, _bt, c.spin); }
    if (r.parts.wheel) r.put('wheel', c.i, _bt, c.spin);
    if (c.ox >= 0) {                                     // 牛在车前，同步步态
      const a = ANIMALS[c.ox];
      a.x = c.x + c.dir * 3.6; a.z = c.z; a.yaw = c.yaw; a.ph = c.ph; a.mode = 'gait';
      a.dir = c.dir;
    }
    if (c.mode === 'walk') c.ph += 0;                    // 相位由 pingPong 推进
  }
  // 牲口
  for (const a of ANIMALS) {
    if (a.mode === 'walk') { pingPong(a, dt); }
    if (a.mode === 'walk' || a.mode === 'gait') a.yaw = a.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    const moving = a.mode === 'walk' || a.mode === 'gait';
    const sw = moving ? Math.sin(a.ph) * 0.45 : 0;
    const bob = moving ? Math.abs(Math.sin(a.ph)) * 0.03 : 0;
    _bt.makeRotationY(a.yaw); _bt.setPosition(a.x, a.y + bob, a.z);
    const r = ANIM[a.kind], i = a.i;
    r.put('body', i, _bt); r.put('neck', i, _bt); r.put('head', i, _bt); r.put('tail', i, _bt);
    r.put('legFL', i, _bt, sw); r.put('legFR', i, _bt, -sw);
    r.put('legBL', i, _bt, -sw); r.put('legBR', i, _bt, sw);
    r.put('pack', i, _bt, 0, !a.hasPack);
  }
  // 人
  for (let i = 0; i < PEOPLE.length; i++) {
    const p = PEOPLE[i];
    const sit = p.mode === 'sit';
    let swing = 0, bob = 0;
    if (p.mode === 'walk') {
      pingPong(p, dt);
      p.yaw = p.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      swing = Math.sin(p.ph) * 0.5;
      bob = Math.abs(Math.sin(p.ph)) * 0.035;
    } else if (p.mode === 'work') {
      p.ph += dt * 1.5;
      bob = Math.abs(Math.sin(p.ph)) * 0.02;
    } else {
      p.ph += dt * 0.6;
      bob = Math.sin(p.ph) * 0.006;
    }
    _rot.makeRotationY(p.yaw);
    if (p.boat) {
      _tmp.makeTranslation(p.lx, p.ly, p.lz);
      _bt.multiplyMatrices(p.boat.mat, _tmp).multiply(_rot);
    } else {
      _bt.copy(_rot);
      _bt.setPosition(p.x, p.y + bob + (sit ? -0.42 : 0), p.z);
    }
    let legA = sit ? -1.45 : swing, legB = sit ? -1.45 : -swing;
    let aL = p.carry ? -1.1 : -swing * 0.8, aR = p.carry ? -1.1 : swing * 0.8;
    if (p.mode === 'work') { aR = -0.9 + Math.sin(p.ph) * 0.6; aL = -0.25; }
    if (p.mode === 'idle' || sit) { aL = 0; aR = 0; }
    const H = HUMAN;
    H.put('legL', i, _bt, legA); H.put('legR', i, _bt, legB);
    H.put('torso', i, _bt);
    H.put('armL', i, _bt, aL); H.put('armR', i, _bt, aR);
    H.put('head', i, _bt);
    H.put('hair', i, _bt, 0, p.hat !== 'none');
    H.put('cap', i, _bt, 0, p.hat !== 'cap');
    H.put('straw', i, _bt, 0, p.hat !== 'straw');
    H.put('pole', i, _bt, 0, !p.carry);
  }
  // 提交
  if (HUMAN) HUMAN.commit();
  for (const k in ANIM) ANIM[k].commit();
  for (const k in CART) CART[k].commit();
  for (const k in BOATR) BOATR[k].commit();
}

/* 按类型建立实例化骨架，并把每个个体的下标写回 */
function buildRigs() {
  HUMAN = new Rig(humanDefs(), PEOPLE.length);
  PEOPLE.forEach((p, i) => {
    const robe = new THREE.Color(p.robe), pants = new THREE.Color(p.pants), skin = new THREE.Color(p.skin);
    HUMAN.color('torso', i, robe); HUMAN.color('armL', i, robe); HUMAN.color('armR', i, robe);
    HUMAN.color('legL', i, pants); HUMAN.color('legR', i, pants);
    HUMAN.color('head', i, skin);
    HUMAN.color('hair', i, WHITE); HUMAN.color('cap', i, WHITE); HUMAN.color('straw', i, WHITE); HUMAN.color('pole', i, WHITE);
  });
  HUMAN.finishColors();

  for (const kind of ['horse', 'donkey', 'ox']) {
    const list = ANIMALS.filter((a) => a.kind === kind);
    list.forEach((a, i) => { a.i = i; });
    if (!list.length) continue;
    const r = new Rig(animalDefs(kind), list.length);
    list.forEach((a, i) => {
      const c = new THREE.Color(a.coat);
      for (const part of ['body', 'neck', 'head', 'tail', 'legFL', 'legFR', 'legBL', 'legBR']) r.color(part, i, c);
      r.color('pack', i, new THREE.Color(a.pack));
    });
    r.finishColors();
    ANIM[kind] = r;
  }
  for (const kind of ['oxcart', 'barrow', 'sedan']) {
    const list = CARTS.filter((c) => c.kind === kind);
    list.forEach((c, i) => { c.i = i; });
    if (!list.length) continue;
    CART[kind] = new Rig(cartDefs(kind), list.length);
    CART[kind].finishColors();
  }
  // 牛车的牛需要知道自己在 ANIMALS 里的位置
  for (const c of CARTS) c.ox = -1;
  for (const kind of ['cargo', 'small']) {
    const list = BOATS.filter((b) => b.kind === kind);
    list.forEach((b, i) => { b.i = i; });
    if (!list.length) continue;
    const r = new Rig([{ name: 'hull', geo: boatGeo(kind), mat: MAT.vc2 }], list.length);
    list.forEach((b, i) => r.color('hull', i, new THREE.Color(b.tint)));
    r.finishColors();
    BOATR[kind] = r;
  }
}
