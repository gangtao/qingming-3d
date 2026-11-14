// ============================================================================
// 05-boats.js — 北宋汴河漕船（两头上翘、拱形席篷、舵楼大舵、可放倒人字桅，全画无帆）
// ============================================================================
(function (QM) {
  'use strict';

  function buildBoatGeo(type, mastTilt) {
    // 原画无一条船张着帆！仅配可放倒的人字桅（或已放倒卧于篷顶）
    const parts = [];
    const sc = type === 'grain' ? 1.0 : (type === 'passenger' ? 0.88 : 0.55);
    const L = 13.8 * sc;
    const W = 3.3 * sc;

    // 1. 两头上翘的船身（分段船壳拼合，呈现鲜明宋代漕船翘首翘尾）
    const segs = 7;
    for (let i = 0; i < segs; i++) {
      const t = -1 + (2 * (i + 0.5)) / segs; // -1 船尾 .. +1 船首
      const sx = t * L * 0.48;
      const widthScale = Math.max(0.32, 1 - t * t * 0.72);
      const liftY = Math.pow(Math.abs(t), 2.1) * 1.25 * sc;
      const pitch = t * 0.34 * sc;

      const hullSeg = new THREE.BoxGeometry((L / segs) * 1.08, 0.95 * sc, W * widthScale);
      hullSeg.rotateZ(pitch);
      hullSeg.translate(sx, 0.25 * sc + liftY, 0);
      parts.push(QM.prepareGeo(hullSeg, QM.PAL.woodMid));

      // 甲板边沿护舷
      const deckSeg = new THREE.BoxGeometry((L / segs) * 1.05, 0.12 * sc, W * widthScale * 0.95);
      deckSeg.rotateZ(pitch);
      deckSeg.translate(sx, 0.74 * sc + liftY, 0);
      parts.push(QM.prepareGeo(deckSeg, QM.PAL.woodLight));
    }

    // 2. 拱形席篷（主货舱 / 客舱）
    if (type !== 'skiff') {
      const cabinLen = L * 0.48;
      const cabinR = W * 0.44;
      const canopy = new THREE.CylinderGeometry(cabinR, cabinR, cabinLen, 12, 1, false, 0, Math.PI);
      canopy.rotateZ(Math.PI / 2);
      canopy.translate(-L * 0.03, 0.82 * sc, 0);
      parts.push(QM.prepareGeo(canopy, type === 'passenger' ? 0x9b8359 : 0xb59c6c));

      // 席篷竹箍肋条
      for (let b = -2; b <= 2; b++) {
        const hoop = new THREE.TorusGeometry(cabinR + 0.03, 0.045 * sc, 5, 12, Math.PI);
        hoop.rotateY(Math.PI / 2);
        hoop.translate(-L * 0.03 + b * (cabinLen * 0.2), 0.82 * sc, 0);
        parts.push(QM.prepareGeo(hoop, 0x4b3826));
      }

      // 船尾舵楼（高出船尾的小木屋）
      const rudderHouse = new THREE.BoxGeometry(2.1 * sc, 1.35 * sc, W * 0.65);
      rudderHouse.translate(-L * 0.33, 1.45 * sc, 0);
      parts.push(QM.prepareGeo(rudderHouse, QM.PAL.woodDark));
      const rhRoof = new THREE.BoxGeometry(2.3 * sc, 0.14 * sc, W * 0.72);
      rhRoof.translate(-L * 0.33, 2.18 * sc, 0);
      parts.push(QM.prepareGeo(rhRoof, 0x8e7955));
    } else {
      // 小家船低矮竹篷
      const canopy = new THREE.CylinderGeometry(W * 0.42, W * 0.42, L * 0.40, 10, 1, false, 0, Math.PI);
      canopy.rotateZ(Math.PI / 2);
      canopy.translate(0, 0.65 * sc, 0);
      parts.push(QM.prepareGeo(canopy, 0xa89164));
    }

    // 3. 船尾大舵（长舵叶 + 舵柄）
    const rudderBlade = new THREE.BoxGeometry(1.4 * sc, 1.1 * sc, 0.14 * sc);
    rudderBlade.translate(-L * 0.52, 0.25 * sc, 0);
    parts.push(QM.prepareGeo(rudderBlade, 0x3f2d1d));
    const tiller = new THREE.CylinderGeometry(0.05 * sc, 0.06 * sc, 2.2 * sc, 6);
    tiller.rotateZ(Math.PI / 2 - 0.18);
    tiller.translate(-L * 0.44, 1.65 * sc, 0);
    parts.push(QM.prepareGeo(tiller, 0x6b4e34));

    // 4. 船头粮袋货堆（仅漕船）
    if (type === 'grain') {
      for (let s = 0; s < 4; s++) {
        const sack = new THREE.BoxGeometry(0.95, 0.38, 0.62);
        sack.translate(L * 0.28 + (s % 2) * 0.65, 1.02 + Math.floor(s / 2) * 0.3, (s % 2 - 0.5) * 0.7);
        parts.push(QM.prepareGeo(sack, 0xc3b08b));
      }
    }

    // 5. 可放倒的人字桅（A-frame mast，绝对没有帆布！）
    if (type !== 'skiff') {
      const mH = 5.4 * sc;
      // mastTilt: 0 = 竖直，~1.35 = 已放倒卧在篷顶，~0.62 = 过虹桥紧急放倒中！
      const tilt = mastTilt !== undefined ? mastTilt : 1.38;
      [-0.55 * sc, 0.55 * sc].forEach((mz) => {
        const leg = new THREE.CylinderGeometry(0.065 * sc, 0.095 * sc, mH, 6);
        // 双腿向中央合拢成“人”字
        leg.rotateX(mz > 0 ? 0.11 : -0.11);
        leg.translate(0, mH * 0.5, mz * 0.5);
        leg.rotateZ(tilt); // 向船尾放倒
        leg.translate(L * 0.16, 1.0 * sc, 0);
        parts.push(QM.prepareGeo(leg, 0x5c422a));
      });
    }

    return QM.mergeGeometries(parts);
  }

  QM.BoatManager = function (scene) {
    this.scene = scene;
    this.boats = [];
    this.oarGeo = QM.prepareGeo(new THREE.BoxGeometry(0.10, 0.10, 4.2), 0x765738);
    this.plankGeo = QM.prepareGeo(new THREE.BoxGeometry(0.95, 0.12, 4.6), 0x82623f);
  };

  QM.BoatManager.prototype.addBoat = function (cfg) {
    // cfg: { x, z, yaw, type, mastTilt, hasOar, hasPlank, isClimax, bobAmp }
    const geo = buildBoatGeo(cfg.type || 'grain', cfg.mastTilt);
    const mesh = new THREE.Mesh(geo, QM.MAT.entity);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const group = new THREE.Group();
    group.add(mesh);
    group.position.set(cfg.x, QM.WATER_LEVEL + 0.05, cfg.z);
    group.rotation.y = cfg.yaw || 0;

    let oarMesh = null;
    if (cfg.hasOar) {
      oarMesh = new THREE.Mesh(this.oarGeo, QM.MAT.entity);
      oarMesh.position.set(-4.2, 1.1, 1.35);
      oarMesh.rotation.x = 0.35;
      group.add(oarMesh);
    }

    if (cfg.hasPlank) {
      const plank = new THREE.Mesh(this.plankGeo, QM.MAT.entity);
      plank.position.set(1.2, 0.55, cfg.plankSide ? cfg.plankSide * 2.8 : 2.8);
      plank.rotation.x = cfg.plankSide ? -cfg.plankSide * 0.16 : -0.16;
      group.add(plank);
    }

    this.scene.add(group);
    this.boats.push({
      group,
      oarMesh,
      baseX: cfg.x,
      baseZ: cfg.z,
      baseY: QM.WATER_LEVEL + 0.05,
      baseYaw: cfg.yaw || 0,
      phase: QM.rand() * Math.PI * 2,
      bobAmp: cfg.bobAmp || 0.06,
      isClimax: !!cfg.isClimax
    });
  };

  QM.BoatManager.prototype.update = function (t) {
    for (let i = 0; i < this.boats.length; i++) {
      const b = this.boats[i];
      const w = Math.sin(t * 1.35 + b.phase);
      const r = Math.cos(t * 1.05 + b.phase * 1.3);
      b.group.position.y = b.baseY + w * b.bobAmp;
      b.group.rotation.x = r * (b.isClimax ? 0.032 : 0.018);
      b.group.rotation.z = w * (b.isClimax ? 0.028 : 0.012);
      if (b.isClimax) {
        // 过虹桥大漕船在激流中微微横摆搏浪
        b.group.rotation.y = b.baseYaw + Math.sin(t * 1.6) * 0.035;
      }
      if (b.oarMesh) {
        // 摇橹摆动
        b.oarMesh.rotation.y = Math.sin(t * 2.6 + b.phase) * 0.42;
        b.oarMesh.rotation.z = Math.cos(t * 2.6 + b.phase) * 0.12;
      }
    }
  };
})(window.QM = window.QM || {});
