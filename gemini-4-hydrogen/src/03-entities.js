// ============================================================================
// 03-entities.js — 高细度人物（衣领腰带袖手鞋五官冠帽行囊）、六畜与车轿动画系统
// ============================================================================
(function (QM) {
  'use strict';

  // --------------------------------------------------------------------------
  // 人物各部位高细度几何体构建（全部带有顶点色以区分衣领、腰带、鞋履、五官）
  // --------------------------------------------------------------------------
  function buildPersonPartGeos() {
    // 1. 躯干（交领上衣 + 腰带 + 下摆；中心在腰部 y=0.88，高约0.78）
    const torsoParts = [];
    // 上身衣袍
    torsoParts.push(QM.prepareGeo(new THREE.BoxGeometry(0.36, 0.44, 0.22), 0xffffff, (x, y, z) => {
      // 交领斜襟暗线
      if (z > 0.08 && y > 0.02 && Math.abs(x - (0.14 - y) * 0.5) < 0.03) return 0.72;
      return 0.96;
    }));
    // 领口白色内衬
    const collar = new THREE.BoxGeometry(0.16, 0.07, 0.18);
    collar.translate(0, 0.21, 0.03);
    torsoParts.push(QM.prepareGeo(collar, 0xe8dec8));
    // 束腰带（深色皮革/布带）
    const belt = new THREE.BoxGeometry(0.38, 0.065, 0.24);
    belt.translate(0, -0.06, 0);
    torsoParts.push(QM.prepareGeo(belt, 0x3b2b1d));
    // 长袍下摆
    const skirt = new THREE.CylinderGeometry(0.16, 0.22, 0.34, 8);
    skirt.translate(0, -0.25, 0);
    torsoParts.push(QM.prepareGeo(skirt, 0xffffff, () => 0.92));
    const torsoGeo = QM.mergeGeometries(torsoParts);

    // 2. 头部 + 五官（原点在颈部，头顶 +0.26）
    const headParts = [];
    const neck = new THREE.CylinderGeometry(0.06, 0.07, 0.09, 6);
    neck.translate(0, 0.04, 0);
    headParts.push(QM.prepareGeo(neck, 0xffffff, () => 0.9));
    const skull = new THREE.SphereGeometry(0.125, 10, 8);
    skull.scale(0.92, 1.08, 0.96);
    skull.translate(0, 0.16, 0);
    headParts.push(QM.prepareGeo(skull, 0xffffff));
    // 鼻梁
    const nose = new THREE.BoxGeometry(0.028, 0.055, 0.035);
    nose.translate(0, 0.155, 0.115);
    headParts.push(QM.prepareGeo(nose, 0xffffff, () => 0.92));
    // 双眼（深墨点）
    [-0.042, 0.042].forEach((ex) => {
      const eye = new THREE.BoxGeometry(0.022, 0.016, 0.02);
      eye.translate(ex, 0.185, 0.108);
      headParts.push(QM.prepareGeo(eye, 0x261d17));
    });
    const headGeo = QM.mergeGeometries(headParts);

    // 3. 四种宋代冠帽（原点在头顶基准 y=0.22）
    // (a) 宋代直脚幞头（官吏/书生）
    const putouParts = [];
    const cap = new THREE.CylinderGeometry(0.11, 0.125, 0.11, 8);
    cap.translate(0, 0.04, 0);
    putouParts.push(QM.prepareGeo(cap, 0x2a2420));
    [-1, 1].forEach((s) => {
      const wing = new THREE.BoxGeometry(0.24, 0.022, 0.035);
      wing.translate(s * 0.18, 0.04, -0.02);
      putouParts.push(QM.prepareGeo(wing, 0x241e1a));
    });
    const hatPutouGeo = QM.mergeGeometries(putouParts);

    // (b) 束发发髻（平民/力夫）
    const bunParts = [];
    const hairBase = new THREE.SphereGeometry(0.128, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55);
    hairBase.translate(0, -0.02, -0.01);
    bunParts.push(QM.prepareGeo(hairBase, 0x2c251f));
    const topBun = new THREE.SphereGeometry(0.052, 6, 6);
    topBun.translate(0, 0.10, -0.01);
    bunParts.push(QM.prepareGeo(topBun, 0x261f1a));
    const hatBunGeo = QM.mergeGeometries(bunParts);

    // (c) 竹编斗笠（赶路/纤夫/行商）
    const douliGeo = QM.prepareGeo(
      new THREE.ConeGeometry(0.28, 0.13, 12),
      0xb69963,
      (x, y, z) => 0.85 + 0.15 * Math.sin((x + z) * 18)
    );
    douliGeo.translate(0, 0.06, 0);

    // (d) 巾帻头巾（小贩/店伙计）
    const scarf = new THREE.CylinderGeometry(0.12, 0.13, 0.09, 8);
    scarf.translate(0, 0.03, 0);
    const hatScarfGeo = QM.prepareGeo(scarf, 0x695a46);

    // 4. 手臂（袖手 + 手腕；轴心在肩部 y=0）
    const armParts = [];
    const sleeve = new THREE.CylinderGeometry(0.065, 0.085, 0.34, 6);
    sleeve.translate(0, -0.17, 0);
    armParts.push(QM.prepareGeo(sleeve, 0xffffff, () => 0.94));
    const hand = new THREE.SphereGeometry(0.045, 6, 5);
    hand.translate(0, -0.37, 0);
    armParts.push(QM.prepareGeo(hand, 0xd1ab84));
    const armGeo = QM.mergeGeometries(armParts);

    // 5. 腿与布履（轴心在胯部 y=0）
    const legParts = [];
    const trouser = new THREE.CylinderGeometry(0.068, 0.055, 0.48, 6);
    trouser.translate(0, -0.24, 0);
    legParts.push(QM.prepareGeo(trouser, 0x4e463c));
    const shoe = new THREE.BoxGeometry(0.09, 0.07, 0.17);
    shoe.translate(0, -0.50, 0.03);
    legParts.push(QM.prepareGeo(shoe, 0x2b231c));
    const legGeo = QM.mergeGeometries(legParts);

    // 6. 随身道具
    // (a) 扁担挑箩筐（挑夫）
    const poleParts = [];
    const pole = new THREE.BoxGeometry(0.04, 0.04, 1.45);
    poleParts.push(QM.prepareGeo(pole, 0x8d6c43));
    [-0.64, 0.64].forEach((pz) => {
      const rope = new THREE.CylinderGeometry(0.01, 0.01, 0.34, 4);
      rope.translate(0, -0.17, pz);
      poleParts.push(QM.prepareGeo(rope, 0x5c4730));
      const basket = new THREE.CylinderGeometry(0.18, 0.12, 0.24, 8);
      basket.translate(0, -0.38, pz);
      poleParts.push(QM.prepareGeo(basket, 0xa88b58));
    });
    const propPoleGeo = QM.mergeGeometries(poleParts);

    // (b) 背篓（背米/货包力夫）
    const sackGeo = QM.prepareGeo(new THREE.BoxGeometry(0.28, 0.36, 0.22), 0xb8a37e);
    sackGeo.translate(0, 0, -0.18);

    // (c) 手提/肩扛包袱
    const bundleGeo = QM.prepareGeo(new THREE.SphereGeometry(0.16, 7, 6), 0x7c664e);

    return {
      torsoGeo, headGeo,
      hatPutouGeo, hatBunGeo, hatDouliGeo, hatScarfGeo,
      armGeo, legGeo,
      propPoleGeo, sackGeo, bundleGeo
    };
  }

  // --------------------------------------------------------------------------
  // 牲口模型零件构建（驴、马、牛、骆驼、猪、狗）
  // --------------------------------------------------------------------------
  function buildAnimalBodyGeo(species) {
    const parts = [];
    if (species === 'donkey' || species === 'horse') {
      const isHorse = species === 'horse';
      const sc = isHorse ? 1.24 : 0.92;
      const bodyCol = isHorse ? 0x6b4730 : 0x7c7469;
      // 身躯
      const body = new THREE.BoxGeometry(0.46 * sc, 0.44 * sc, 1.05 * sc);
      parts.push(QM.prepareGeo(body, bodyCol));
      // 颈与头
      const neck = new THREE.BoxGeometry(0.24 * sc, 0.46 * sc, 0.28 * sc);
      neck.rotateX(0.42);
      neck.translate(0, 0.34 * sc, 0.52 * sc);
      parts.push(QM.prepareGeo(neck, bodyCol));
      const head = new THREE.BoxGeometry(0.20 * sc, 0.20 * sc, 0.40 * sc);
      head.rotateX(0.35);
      head.translate(0, 0.50 * sc, 0.72 * sc);
      parts.push(QM.prepareGeo(head, bodyCol));
      // 耳朵（驴长耳、马短耳）
      [-0.07 * sc, 0.07 * sc].forEach((ex) => {
        const ear = new THREE.ConeGeometry(0.035 * sc, (isHorse ? 0.11 : 0.21) * sc, 5);
        ear.translate(ex, (isHorse ? 0.64 : 0.68) * sc, 0.62 * sc);
        parts.push(QM.prepareGeo(ear, bodyCol));
      });
      // 鬃毛
      const mane = new THREE.BoxGeometry(0.07 * sc, 0.36 * sc, 0.14 * sc);
      mane.rotateX(0.42);
      mane.translate(0, 0.42 * sc, 0.46 * sc);
      parts.push(QM.prepareGeo(mane, 0x2d231c));
      // 鞍垫与驮包
      const saddle = new THREE.BoxGeometry(0.50 * sc, 0.08 * sc, 0.45 * sc);
      saddle.translate(0, 0.24 * sc, 0.05 * sc);
      parts.push(QM.prepareGeo(saddle, isHorse ? 0x8a3d2d : 0x8d7654));
      if (!isHorse) {
        // 驮炭袋
        [-0.28, 0.28].forEach((px) => {
          const bag = new THREE.BoxGeometry(0.18, 0.30, 0.52);
          bag.translate(px, 0.05, 0.02);
          parts.push(QM.prepareGeo(bag, 0x4b4238));
        });
      }
      // 尾巴
      const tail = new THREE.CylinderGeometry(0.03 * sc, 0.02 * sc, 0.42 * sc, 5);
      tail.rotateX(-0.35);
      tail.translate(0, -0.04 * sc, -0.58 * sc);
      parts.push(QM.prepareGeo(tail, 0x2f251d));
    } else if (species === 'ox') {
      const body = new THREE.BoxGeometry(0.66, 0.62, 1.32);
      parts.push(QM.prepareGeo(body, 0x5c4734));
      const neck = new THREE.BoxGeometry(0.42, 0.52, 0.36);
      neck.translate(0, 0.16, 0.66);
      parts.push(QM.prepareGeo(neck, 0x54402e));
      const head = new THREE.BoxGeometry(0.32, 0.30, 0.38);
      head.translate(0, 0.18, 0.90);
      parts.push(QM.prepareGeo(head, 0x4a3828));
      // 牛角
      [-0.18, 0.18].forEach((hx) => {
        const horn = new THREE.ConeGeometry(0.04, 0.26, 6);
        horn.rotateZ(hx < 0 ? 0.8 : -0.8);
        horn.translate(hx, 0.36, 0.84);
        parts.push(QM.prepareGeo(horn, 0xcab998));
      });
      // 木牛轭
      const yoke = new THREE.BoxGeometry(0.56, 0.10, 0.12);
      yoke.translate(0, 0.44, 0.62);
      parts.push(QM.prepareGeo(yoke, 0x7c5a37));
    } else if (species === 'camel') {
      const col = 0xab8c60;
      const body = new THREE.BoxGeometry(0.58, 0.58, 1.36);
      parts.push(QM.prepareGeo(body, col));
      // 双驼峰
      [-0.28, 0.28].forEach((hz) => {
        const hump = new THREE.ConeGeometry(0.24, 0.38, 7);
        hump.translate(0, 0.44, hz);
        parts.push(QM.prepareGeo(hump, 0x997a4e));
      });
      // 弯颈与长头
      const neck = new THREE.CylinderGeometry(0.13, 0.17, 0.84, 7);
      neck.rotateX(0.48);
      neck.translate(0, 0.44, 0.78);
      parts.push(QM.prepareGeo(neck, col));
      const head = new THREE.BoxGeometry(0.22, 0.22, 0.38);
      head.translate(0, 0.82, 1.08);
      parts.push(QM.prepareGeo(head, col));
      // 驼鞍货包
      [-0.38, 0.38].forEach((px) => {
        const pack = new THREE.BoxGeometry(0.24, 0.40, 0.72);
        pack.translate(px, 0.12, 0);
        parts.push(QM.prepareGeo(pack, 0x6f573d));
      });
    } else if (species === 'pig') {
      const body = new THREE.BoxGeometry(0.32, 0.28, 0.62);
      parts.push(QM.prepareGeo(body, 0x5c534a));
      const head = new THREE.BoxGeometry(0.22, 0.20, 0.24);
      head.translate(0, -0.02, 0.36);
      parts.push(QM.prepareGeo(head, 0x524940));
    } else {
      // dog
      const body = new THREE.BoxGeometry(0.20, 0.22, 0.52);
      parts.push(QM.prepareGeo(body, 0x9c7b52));
      const head = new THREE.BoxGeometry(0.15, 0.16, 0.20);
      head.translate(0, 0.10, 0.28);
      parts.push(QM.prepareGeo(head, 0x92714a));
      const tail = new THREE.CylinderGeometry(0.02, 0.015, 0.24, 5);
      tail.rotateX(0.7);
      tail.translate(0, 0.12, -0.28);
      parts.push(QM.prepareGeo(tail, 0x82633e));
    }
    return QM.mergeGeometries(parts);
  }

  function buildAnimalLegGeo(len, radius, hoofColor) {
    const p = [];
    const leg = new THREE.CylinderGeometry(radius, radius * 0.85, len, 6);
    leg.translate(0, -len * 0.5, 0);
    p.push(QM.prepareGeo(leg, 0xffffff));
    const hoof = new THREE.CylinderGeometry(radius * 0.9, radius * 1.05, 0.08, 6);
    hoof.translate(0, -len + 0.04, 0);
    p.push(QM.prepareGeo(hoof, hoofColor || 0x29211a));
    return QM.mergeGeometries(p);
  }

  // --------------------------------------------------------------------------
  // 车辆与轿子零件（带轮辋辐条的车轮、席篷牛车、独轮车、格子窗轿子）
  // --------------------------------------------------------------------------
  function buildSpokedWheelGeo(radius, spokes) {
    const parts = [];
    const rim = new THREE.TorusGeometry(radius, 0.045, 6, 16);
    rim.rotateY(Math.PI / 2);
    parts.push(QM.prepareGeo(rim, 0x5a4028));
    const hub = new THREE.CylinderGeometry(0.09, 0.09, 0.14, 8);
    hub.rotateZ(Math.PI / 2);
    parts.push(QM.prepareGeo(hub, 0x3f2c1b));
    for (let i = 0; i < spokes; i++) {
      const a = (i / spokes) * Math.PI * 2;
      const sp = new THREE.CylinderGeometry(0.022, 0.022, radius * 1.9, 5);
      sp.rotateX(a);
      parts.push(QM.prepareGeo(sp, 0x735435));
    }
    return QM.mergeGeometries(parts);
  }

  function buildCartBodyGeo(type) {
    const parts = [];
    if (type === 'covered') {
      // 席篷牛车
      const bed = new THREE.BoxGeometry(1.42, 0.14, 2.30);
      parts.push(QM.prepareGeo(bed, 0x694b30));
      const canopy = new THREE.CylinderGeometry(0.72, 0.72, 2.18, 10, 1, false, 0, Math.PI);
      canopy.rotateZ(Math.PI / 2);
      canopy.rotateY(Math.PI / 2);
      canopy.translate(0, 0.56, -0.04);
      parts.push(QM.prepareGeo(canopy, 0xa88f60));
      // 车辕
      [-0.48, 0.48].forEach((sx) => {
        const shaft = new THREE.BoxGeometry(0.08, 0.08, 1.85);
        shaft.translate(sx, 0.0, 1.75);
        parts.push(QM.prepareGeo(shaft, 0x5b4129));
      });
    } else if (type === 'flat') {
      // 平头货车
      const bed = new THREE.BoxGeometry(1.36, 0.14, 2.40);
      parts.push(QM.prepareGeo(bed, 0x6b4d31));
      const cargo = new THREE.BoxGeometry(1.12, 0.52, 1.75);
      cargo.translate(0, 0.33, -0.1);
      parts.push(QM.prepareGeo(cargo, 0xb29d76));
      [-0.45, 0.45].forEach((sx) => {
        const shaft = new THREE.BoxGeometry(0.07, 0.07, 1.7);
        shaft.translate(sx, 0.0, 1.75);
        parts.push(QM.prepareGeo(shaft, 0x573e27));
      });
    } else {
      // 独轮手推车
      const frame = new THREE.BoxGeometry(0.76, 0.10, 1.55);
      parts.push(QM.prepareGeo(frame, 0x694c31));
      const load = new THREE.BoxGeometry(0.68, 0.38, 0.72);
      load.translate(0, 0.24, 0.15);
      parts.push(QM.prepareGeo(load, 0xac956c));
    }
    return QM.mergeGeometries(parts);
  }

  function buildSedanGeo() {
    const parts = [];
    // 轿厢主体
    const box = new THREE.BoxGeometry(0.95, 1.24, 1.05);
    box.translate(0, 0.72, 0);
    parts.push(QM.prepareGeo(box, 0x5c422c));
    // 两侧与前窗格子纹
    const win = new THREE.BoxGeometry(0.98, 0.46, 0.62);
    win.translate(0, 0.90, 0);
    parts.push(QM.prepareGeo(win, 0xa8926d, (x, y, z) => (Math.sin(y * 36) > 0 || Math.sin(z * 36) > 0) ? 0.68 : 1.0));
    // 轿顶
    const roof = new THREE.ConeGeometry(0.84, 0.26, 4);
    roof.rotateY(Math.PI / 4);
    roof.translate(0, 1.44, 0);
    parts.push(QM.prepareGeo(roof, 0x413224));
    // 两根长抬杠
    [-0.54, 0.54].forEach((sx) => {
      const pole = new THREE.BoxGeometry(0.06, 0.07, 3.6);
      pole.translate(sx, 0.46, 0);
      parts.push(QM.prepareGeo(pole, 0x6f5133));
    });
    return QM.mergeGeometries(parts);
  }

  // --------------------------------------------------------------------------
  // EntityManager：管理所有动态人物、牲口、车轿
  // --------------------------------------------------------------------------
  QM.EntityManager = function (scene) {
    this.scene = scene;
    this.people = [];
    this.animals = [];
    this.carts = [];
    this.sedans = [];
    this.pGeos = buildPersonPartGeos();
    this.dummy = new THREE.Object3D();
  };

  QM.EntityManager.prototype.addPerson = function (cfg) {
    // cfg: { x, z, yaw, shirt, pants, hat, prop, action, path, speed, phase, yOffset }
    this.people.push({
      x: cfg.x,
      z: cfg.z,
      baseX: cfg.x,
      baseZ: cfg.z,
      yOffset: cfg.yOffset || 0,
      yaw: cfg.yaw || 0,
      shirt: cfg.shirt || QM.PAL.hemp,
      skin: cfg.skin || (QM.rand() > 0.4 ? QM.PAL.skinLight : QM.PAL.skinTan),
      hat: cfg.hat || 'bun', // 'putou' | 'bun' | 'douli' | 'scarf'
      prop: cfg.prop || 'none', // 'pole' | 'sack' | 'bundle' | 'none'
      action: cfg.action || 'idle', // 'walk' | 'sit' | 'haul' | 'row' | 'talk' | 'nap' | 'ride' | 'idle'
      path: cfg.path || null, // { x0, z0, x1, z1, t }
      speed: cfg.speed || 1.2,
      phase: cfg.phase !== undefined ? cfg.phase : QM.rand() * Math.PI * 2,
      scale: cfg.scale || (0.94 + QM.rand() * 0.12)
    });
  };

  QM.EntityManager.prototype.addAnimal = function (cfg) {
    this.animals.push({
      species: cfg.species, // 'donkey'|'horse'|'ox'|'camel'|'pig'|'dog'
      x: cfg.x,
      z: cfg.z,
      yaw: cfg.yaw || 0,
      path: cfg.path || null,
      speed: cfg.speed || 1.1,
      phase: cfg.phase !== undefined ? cfg.phase : QM.rand() * Math.PI * 2,
      yOffset: cfg.yOffset || 0
    });
  };

  QM.EntityManager.prototype.addCart = function (cfg) {
    this.carts.push({
      type: cfg.type || 'covered', // 'covered'|'flat'|'barrow'
      x: cfg.x,
      z: cfg.z,
      yaw: cfg.yaw || 0,
      path: cfg.path || null,
      speed: cfg.speed || 0.9,
      wheelAngle: 0,
      yOffset: cfg.yOffset || 0
    });
  };

  QM.EntityManager.prototype.addSedan = function (cfg) {
    this.sedans.push({
      x: cfg.x,
      z: cfg.z,
      yaw: cfg.yaw || 0,
      path: cfg.path || null,
      speed: cfg.speed || 1.15,
      phase: cfg.phase !== undefined ? cfg.phase : QM.rand() * Math.PI * 2,
      yOffset: cfg.yOffset || 0,
      flower: !!cfg.flower // 踏青归来轿顶插柳枝杂花
    });
  };

  // 构建所有 InstancedMesh（大幅压缩绘制调用）
  QM.EntityManager.prototype.finalize = function () {
    const N = this.people.length;
    const mat = QM.MAT.entity;
    const p = this.pGeos;

    const makeIM = (geo, count) => {
      const im = new THREE.InstancedMesh(geo, mat, Math.max(1, count));
      im.castShadow = true;
      im.receiveShadow = true;
      im.frustumCulled = false;
      this.scene.add(im);
      return im;
    };

    this.imTorso = makeIM(p.torsoGeo, N);
    this.imHead = makeIM(p.headGeo, N);
    this.imArmL = makeIM(p.armGeo, N);
    this.imArmR = makeIM(p.armGeo, N);
    this.imLegL = makeIM(p.legGeo, N);
    this.imLegR = makeIM(p.legGeo, N);

    // 冠帽按类型分组索引
    this.hatGroups = { putou: [], bun: [], douli: [], scarf: [] };
    this.propGroups = { pole: [], sack: [], bundle: [] };
    for (let i = 0; i < N; i++) {
      this.hatGroups[this.people[i].hat || 'bun'].push(i);
      const pr = this.people[i].prop;
      if (pr && pr !== 'none' && this.propGroups[pr]) this.propGroups[pr].push(i);
    }

    this.imHats = {
      putou: makeIM(p.hatPutouGeo, this.hatGroups.putou.length),
      bun: makeIM(p.hatBunGeo, this.hatGroups.bun.length),
      douli: makeIM(p.hatDouliGeo, this.hatGroups.douli.length),
      scarf: makeIM(p.hatScarfGeo, this.hatGroups.scarf.length)
    };
    this.imProps = {
      pole: makeIM(p.propPoleGeo, this.propGroups.pole.length),
      sack: makeIM(p.sackGeo, this.propGroups.sack.length),
      bundle: makeIM(p.bundleGeo, this.propGroups.bundle.length)
    };

    // 设置人物固有色（只设一次）
    const c = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const pe = this.people[i];
      c.setHex(pe.shirt);
      this.imTorso.setColorAt(i, c);
      this.imArmL.setColorAt(i, c);
      this.imArmR.setColorAt(i, c);
      c.setHex(pe.skin);
      this.imHead.setColorAt(i, c);
      c.setHex(0xffffff);
      this.imLegL.setColorAt(i, c);
      this.imLegR.setColorAt(i, c);
    }
    [this.imTorso, this.imArmL, this.imArmR, this.imHead, this.imLegL, this.imLegR].forEach((im) => {
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
    });
    Object.keys(this.imHats).forEach((k) => {
      const im = this.imHats[k];
      for (let i = 0; i < this.hatGroups[k].length; i++) im.setColorAt(i, new THREE.Color(0xffffff));
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
      im.count = this.hatGroups[k].length;
    });
    Object.keys(this.imProps).forEach((k) => {
      const im = this.imProps[k];
      for (let i = 0; i < this.propGroups[k].length; i++) im.setColorAt(i, new THREE.Color(0xffffff));
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
      im.count = this.propGroups[k].length;
    });

    // 牲口分组实例化
    this.animalSpecs = {
      donkey: { len: 0.56, r: 0.055, bodyY: 0.72, lx: 0.14, lz: 0.36, col: 0x6f685e },
      horse:  { len: 0.78, r: 0.065, bodyY: 0.96, lx: 0.18, lz: 0.44, col: 0x5c3c27 },
      ox:     { len: 0.68, r: 0.085, bodyY: 0.88, lx: 0.22, lz: 0.46, col: 0x4f3d2c },
      camel:  { len: 0.96, r: 0.075, bodyY: 1.18, lx: 0.19, lz: 0.48, col: 0x997c52 },
      pig:    { len: 0.24, r: 0.045, bodyY: 0.34, lx: 0.10, lz: 0.20, col: 0x4f463d },
      dog:    { len: 0.28, r: 0.032, bodyY: 0.34, lx: 0.07, lz: 0.18, col: 0x876a45 }
    };
    this.animalBySpec = {};
    this.imAnimals = {};
    Object.keys(this.animalSpecs).forEach((sp) => {
      const list = this.animals.filter((a) => a.species === sp);
      this.animalBySpec[sp] = list;
      if (list.length === 0) return;
      const spec = this.animalSpecs[sp];
      const bGeo = buildAnimalBodyGeo(sp);
      const lGeo = buildAnimalLegGeo(spec.len, spec.r);
      const bodyIM = makeIM(bGeo, list.length);
      const legsIM = [0, 1, 2, 3].map(() => makeIM(lGeo, list.length));
      for (let i = 0; i < list.length; i++) {
        bodyIM.setColorAt(i, new THREE.Color(0xffffff));
        legsIM.forEach((lm) => lm.setColorAt(i, new THREE.Color(spec.col)));
      }
      if (bodyIM.instanceColor) bodyIM.instanceColor.needsUpdate = true;
      legsIM.forEach((lm) => { if (lm.instanceColor) lm.instanceColor.needsUpdate = true; });
      this.imAnimals[sp] = { bodyIM, legsIM, spec, list };
    });

    // 车辆与轿子实体网格（数量约 28 辆，单独 Mesh 便于车轮独立旋转）
    const wheelBig = buildSpokedWheelGeo(0.56, 10);
    const wheelSmall = buildSpokedWheelGeo(0.46, 8);
    const bodyGeos = {
      covered: buildCartBodyGeo('covered'),
      flat: buildCartBodyGeo('flat'),
      barrow: buildCartBodyGeo('barrow')
    };
    this.cartMeshes = this.carts.map((ct) => {
      const g = new THREE.Group();
      const bm = new THREE.Mesh(bodyGeos[ct.type], mat);
      bm.castShadow = true; bm.receiveShadow = true;
      g.add(bm);
      ct.wheels = [];
      if (ct.type === 'barrow') {
        const w = new THREE.Mesh(wheelSmall, mat);
        w.position.set(0, 0.0, 0.2);
        bm.position.y = 0.48;
        w.position.y = 0.46;
        g.add(w);
        ct.wheels.push(w);
      } else {
        bm.position.y = 0.56;
        [-0.78, 0.78].forEach((wx) => {
          const w = new THREE.Mesh(wheelBig, mat);
          w.position.set(wx, 0.56, 0);
          g.add(w);
          ct.wheels.push(w);
        });
      }
      this.scene.add(g);
      return g;
    });

    const sedanGeo = buildSedanGeo();
    this.sedanMeshes = this.sedans.map((sd) => {
      const g = new THREE.Group();
      const sm = new THREE.Mesh(sedanGeo, mat);
      sm.castShadow = true; sm.receiveShadow = true;
      g.add(sm);
      if (sd.flower) {
        // 轿顶插柳枝杂花
        const twig = new THREE.Mesh(QM.prepareGeo(new THREE.ConeGeometry(0.28, 0.38, 6), 0x7c8e50), mat);
        twig.position.set(0, 1.58, 0);
        g.add(twig);
      }
      this.scene.add(g);
      return g;
    });
  };

  // 每帧更新所有动态生物与车辆（零内存分配）
  QM.EntityManager.prototype.update = function (t, dt) {
    const d = this.dummy;
    const N = this.people.length;

    const placeLimb = (im, idx, wx, wy, wz, yaw, rx, rz, sx, sy, sz) => {
      d.position.set(wx, wy, wz);
      d.rotation.set(0, yaw, 0);
      d.rotateX(rx);
      d.rotateZ(rz);
      d.scale.set(sx, sy, sz);
      d.updateMatrix();
      im.setMatrixAt(idx, d.matrix);
    };

    // 更新全部人物
    for (let i = 0; i < N; i++) {
      const pe = this.people[i];
      let yaw = pe.yaw;
      let movePhase = t * 4.2 + pe.phase;

      if (pe.path) {
        const pt = pe.path;
        pt.t = (pt.t + dt * pe.speed * 0.045) % 1;
        // 往返或循环：使用 ping-pong 或循环（街头人流往返循环）
        const u = pt.loop ? pt.t : (pt.t < 0.5 ? pt.t * 2 : 2 - pt.t * 2);
        const dir = pt.loop ? 1 : (pt.t < 0.5 ? 1 : -1);
        pe.x = pt.x0 + (pt.x1 - pt.x0) * u;
        pe.z = pt.z0 + (pt.z1 - pt.z0) * u;
        yaw = Math.atan2((pt.x1 - pt.x0) * dir, (pt.z1 - pt.z0) * dir);
      }

      const gy = pe.yOffset ? pe.yOffset(pe.x, pe.z) : QM.groundHeight(pe.x, pe.z);
      const sc = pe.scale;

      let stride = 0;
      let armL = 0, armR = 0, armRz = 0.08, armLz = -0.08;
      let lean = 0, bob = 0, hipY = 0.50 * sc;

      if (pe.action === 'walk') {
        stride = Math.sin(movePhase) * 0.48;
        bob = Math.abs(Math.cos(movePhase)) * 0.035;
        if (pe.prop === 'pole') {
          armL = -0.55; armR = -0.55;
        } else {
          armL = -stride * 0.7;
          armR = stride * 0.7;
        }
      } else if (pe.action === 'haul') {
        // 纤夫拉纤：身躯大幅前倾，步履沉重
        lean = 0.46;
        stride = Math.sin(t * 2.5 + pe.phase) * 0.35;
        armL = -0.95; armR = -0.95;
        bob = -0.06;
      } else if (pe.action === 'row') {
        // 船工摇橹 / 撑篙
        const sw = Math.sin(t * 2.8 + pe.phase);
        lean = 0.22 + sw * 0.14;
        armL = -0.8 + sw * 0.45;
        armR = -0.8 + sw * 0.45;
      } else if (pe.action === 'sit') {
        // 坐姿喝茶/看病/算命
        hipY = 0.28 * sc;
        armL = -0.45 + Math.sin(t * 1.4 + pe.phase) * 0.12;
        armR = -0.55 + Math.cos(t * 1.7 + pe.phase) * 0.18;
      } else if (pe.action === 'nap') {
        // 税务所外打盹兵丁
        hipY = 0.28 * sc;
        lean = 0.35 + Math.sin(t * 0.9 + pe.phase) * 0.05;
        armL = -0.5; armR = -0.5;
      } else if (pe.action === 'talk') {
        // 桥上看热闹/街头招揽/听书指点
        armR = -0.75 + Math.sin(t * 3.1 + pe.phase) * 0.35;
        armL = -0.25 + Math.cos(t * 2.2 + pe.phase) * 0.15;
        bob = Math.sin(t * 2.5 + pe.phase) * 0.015;
      } else if (pe.action === 'ride') {
        // 骑马骑驴
        hipY = 0.78 * sc;
        bob = Math.sin(t * 5.0 + pe.phase) * 0.03;
        armL = -0.6; armR = -0.6;
      } else {
        // 站立微动
        armR = -0.15 + Math.sin(t * 1.3 + pe.phase) * 0.08;
        armL = -0.10 - Math.sin(t * 1.3 + pe.phase) * 0.06;
      }

      const sinY = Math.sin(yaw), cosY = Math.cos(yaw);
      const torsoY = gy + hipY + 0.38 * sc + bob;
      const shoulderY = torsoY + 0.20 * sc;
      const headY = torsoY + 0.23 * sc;

      // 躯干
      placeLimb(this.imTorso, i, pe.x, torsoY, pe.z, yaw, lean, 0, sc, sc, sc);
      // 头部（前倾微随）
      const headOffZ = Math.sin(lean) * 0.16 * sc;
      const headRot = pe.action === 'talk' ? Math.sin(t * 1.8 + pe.phase) * 0.18 : 0;
      placeLimb(this.imHead, i, pe.x + sinY * headOffZ, headY, pe.z + cosY * headOffZ, yaw + headRot, lean * 0.5, 0, sc, sc, sc);

      // 左右手臂（挂在肩两侧）
      const shOff = 0.21 * sc;
      placeLimb(this.imArmL, i, pe.x + cosY * shOff + sinY * headOffZ, shoulderY, pe.z - sinY * shOff + cosY * headOffZ, yaw, armL, armLz, sc, sc, sc);
      placeLimb(this.imArmR, i, pe.x - cosY * shOff + sinY * headOffZ, shoulderY, pe.z + sinY * shOff + cosY * headOffZ, yaw, armR, armRz, sc, sc, sc);

      // 左右腿
      const legOff = 0.095 * sc;
      const legRxL = pe.action === 'sit' || pe.action === 'nap' ? -1.35 : (pe.action === 'ride' ? -0.9 : stride);
      const legRxR = pe.action === 'sit' || pe.action === 'nap' ? -1.35 : (pe.action === 'ride' ? -0.9 : -stride);
      placeLimb(this.imLegL, i, pe.x + cosY * legOff, gy + hipY + bob, pe.z - sinY * legOff, yaw, legRxL, 0, sc, sc, sc);
      placeLimb(this.imLegR, i, pe.x - cosY * legOff, gy + hipY + bob, pe.z + sinY * legOff, yaw, legRxR, 0, sc, sc, sc);

      pe._headPos = { x: pe.x + sinY * headOffZ, y: headY + 0.22 * sc, z: pe.z + cosY * headOffZ, yaw: yaw + headRot, sc };
      pe._propPos = { x: pe.x, y: shoulderY, z: pe.z, yaw, sc };
    }

    // 冠帽位置同步
    Object.keys(this.hatGroups).forEach((k) => {
      const idxs = this.hatGroups[k];
      const im = this.imHats[k];
      for (let j = 0; j < idxs.length; j++) {
        const hp = this.people[idxs[j]]._headPos;
        placeLimb(im, j, hp.x, hp.y, hp.z, hp.yaw, 0, 0, hp.sc, hp.sc, hp.sc);
      }
      im.instanceMatrix.needsUpdate = true;
    });

    // 随身担子/背篓/包袱位置同步
    Object.keys(this.propGroups).forEach((k) => {
      const idxs = this.propGroups[k];
      const im = this.imProps[k];
      for (let j = 0; j < idxs.length; j++) {
        const pp = this.people[idxs[j]]._propPos;
        const py = k === 'pole' ? pp.y + 0.04 : (k === 'sack' ? pp.y - 0.14 : pp.y - 0.28);
        placeLimb(im, j, pp.x, py, pp.z, pp.yaw, 0, 0, pp.sc, pp.sc, pp.sc);
      }
      im.instanceMatrix.needsUpdate = true;
    });

    [this.imTorso, this.imHead, this.imArmL, this.imArmR, this.imLegL, this.imLegR].forEach((im) => {
      im.instanceMatrix.needsUpdate = true;
    });

    // 更新六畜（驴、马、牛、骆驼、猪、狗）
    Object.keys(this.imAnimals).forEach((sp) => {
      const grp = this.imAnimals[sp];
      const list = grp.list;
      const spec = grp.spec;
      for (let i = 0; i < list.length; i++) {
        const an = list[i];
        let yaw = an.yaw;
        let moving = false;
        if (an.path) {
          const pt = an.path;
          pt.t = (pt.t + dt * an.speed * 0.04) % 1;
          const u = pt.loop ? pt.t : (pt.t < 0.5 ? pt.t * 2 : 2 - pt.t * 2);
          const dir = pt.loop ? 1 : (pt.t < 0.5 ? 1 : -1);
          an.x = pt.x0 + (pt.x1 - pt.x0) * u;
          an.z = pt.z0 + (pt.z1 - pt.z0) * u;
          yaw = Math.atan2((pt.x1 - pt.x0) * dir, (pt.z1 - pt.z0) * dir);
          moving = true;
        }
        const gy = an.yOffset ? an.yOffset(an.x, an.z) : QM.groundHeight(an.x, an.z);
        const ph = t * (moving ? 5.2 : 1.5) + an.phase;
        const bob = moving ? Math.abs(Math.sin(ph)) * 0.04 : 0;
        placeLimb(grp.bodyIM, i, an.x, gy + spec.bodyY + bob, an.z, yaw, 0, 0, 1, 1, 1);

        const sinY = Math.sin(yaw), cosY = Math.cos(yaw);
        const offsets = [
          [-spec.lx,  spec.lz,  1],
          [ spec.lx,  spec.lz, -1],
          [-spec.lx, -spec.lz, -1],
          [ spec.lx, -spec.lz,  1]
        ];
        for (let l = 0; l < 4; l++) {
          const ox = offsets[l][0], oz = offsets[l][1], sgn = offsets[l][2];
          const wx = an.x + ox * cosY + oz * sinY;
          const wz = an.z - ox * sinY + oz * cosY;
          const swing = moving ? Math.sin(ph) * 0.42 * sgn : 0;
          placeLimb(grp.legsIM[l], i, wx, gy + spec.len + bob * 0.4, wz, yaw, swing, 0, 1, 1, 1);
        }
      }
      grp.bodyIM.instanceMatrix.needsUpdate = true;
      grp.legsIM.forEach((lm) => { lm.instanceMatrix.needsUpdate = true; });
    });

    // 更新车辆与车轮转动
    for (let i = 0; i < this.carts.length; i++) {
      const ct = this.carts[i];
      const gm = this.cartMeshes[i];
      let yaw = ct.yaw;
      if (ct.path) {
        const pt = ct.path;
        pt.t = (pt.t + dt * ct.speed * 0.032) % 1;
        const u = pt.loop ? pt.t : (pt.t < 0.5 ? pt.t * 2 : 2 - pt.t * 2);
        const dir = pt.loop ? 1 : (pt.t < 0.5 ? 1 : -1);
        const nx = pt.x0 + (pt.x1 - pt.x0) * u;
        const nz = pt.z0 + (pt.z1 - pt.z0) * u;
        const dist = Math.hypot(nx - ct.x, nz - ct.z);
        ct.wheelAngle += dist * 1.9;
        ct.x = nx; ct.z = nz;
        yaw = Math.atan2((pt.x1 - pt.x0) * dir, (pt.z1 - pt.z0) * dir);
      }
      const gy = ct.yOffset ? ct.yOffset(ct.x, ct.z) : QM.groundHeight(ct.x, ct.z);
      gm.position.set(ct.x, gy, ct.z);
      gm.rotation.set(0, yaw, 0);
      for (let w = 0; w < ct.wheels.length; w++) {
        ct.wheels[w].rotation.x = ct.wheelAngle;
      }
    }

    // 更新轿子
    for (let i = 0; i < this.sedans.length; i++) {
      const sd = this.sedans[i];
      const gm = this.sedanMeshes[i];
      let yaw = sd.yaw;
      let sway = 0;
      if (sd.path) {
        const pt = sd.path;
        pt.t = (pt.t + dt * sd.speed * 0.038) % 1;
        const u = pt.loop ? pt.t : (pt.t < 0.5 ? pt.t * 2 : 2 - pt.t * 2);
        const dir = pt.loop ? 1 : (pt.t < 0.5 ? 1 : -1);
        sd.x = pt.x0 + (pt.x1 - pt.x0) * u;
        sd.z = pt.z0 + (pt.z1 - pt.z0) * u;
        yaw = Math.atan2((pt.x1 - pt.x0) * dir, (pt.z1 - pt.z0) * dir);
        sway = Math.sin(t * 5.2 + sd.phase) * 0.04;
      }
      const gy = sd.yOffset ? sd.yOffset(sd.x, sd.z) : QM.groundHeight(sd.x, sd.z);
      gm.position.set(sd.x, gy + Math.abs(sway) * 0.5, sd.z);
      gm.rotation.set(sway * 0.4, yaw, sway);
    }
  };
})(window.QM = window.QM || {});
