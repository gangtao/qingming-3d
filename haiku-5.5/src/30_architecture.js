/* ===== 30 建筑：屋顶、民居、酒楼、城门、彩楼欢门、店名题签 =====
 * 建筑在局部坐标里搭好（台基在地面 y=0，正面朝 +Z），再用矩阵放到世界里。
 */

// 庑殿/歇山式的四坡屋顶，屋脊沿 X，四角翘起（curl），檐口略挑出（ov）
function roofTris(w, d, y0, rise, ov, curl) {
  const E = w / 2 + ov, F = d / 2 + ov, rx = Math.max(0, E - F) * 0.9;
  const yr = y0 + rise, yc = y0 + curl;
  const C = (sx, sz) => [sx * E, yc, sz * F];
  const Mid = (sz) => [0, y0, sz * F];          // 檐口中点略低，形成“凹”的檐线
  const R = (sx) => [sx * rx, yr, 0];
  const t = [];
  for (const sz of [1, -1]) {
    t.push([C(-1, sz), Mid(sz), R(-1)], [Mid(sz), C(1, sz), R(1)], [Mid(sz), R(1), R(-1)]);
  }
  t.push([C(-1, -1), C(-1, 1), R(-1)], [C(1, 1), C(1, -1), R(1)]);
  return t;
}
const ROOF_UV = (p) => [p[0] * 0.3, (p[2] + p[1]) * 0.3];

// 民居 / 酒楼 / 草屋。o: {x,z,w,d,h,ry,y0,floors,thatch,wall,balcony,name,shop}
function hall(o) {
  QM.halls = (QM.halls || 0) + 1;
  const w = o.w, d = o.d, h = o.h, y0 = o.y0 || 0, fl = o.floors || 1;
  const T = M(o.x, y0, o.z, 0, o.ry || 0, 0);
  const lw = new Geo(), lr = new Geo();
  const base = o.thatch ? 0 : 0.6;
  const tim = 0x4a3422, wall = o.wall ?? 0xc9b48b;
  if (!o.thatch) lw.box(0, 0.3, 0, w + 1.6, 0.6, d + 1.6, 0xa39a88);             // 台基
  const fh = h / fl;
  for (let f = 0; f < fl; f++) {
    const ins = f === 0 ? 0 : 0.8;
    const ww = w - 2 * ins, dd = d - 2 * ins, yb = base + f * fh;
    lw.box(0, yb + fh / 2, 0, ww, fh, dd, o.thatch ? 0xa98c5e : wall);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) lw.cyl(sx * ww / 2, yb + fh / 2, sz * dd / 2, 0.16, 0.16, fh, 6, tim);
    const fz = dd / 2 + 0.04;
    if (f === 0 && !o.thatch) {
      if (o.shop) {                                                  // 铺面：敞开的门面 + 柜台
        lw.box(0, yb + fh * 0.42, fz, ww * 0.8, fh * 0.8, 0.05, 0x2a1d12);
        lw.box(0, yb + 0.5, fz + 0.5, ww * 0.7, 0.9, 0.9, 0x6d5233);
      } else {
        lw.box(0, yb + fh * 0.38, fz, ww * 0.34, fh * 0.76, 0.06, 0x2c2016);
      }
    } else if (f === 0 && o.thatch) {
      lw.box(0, yb + 1.0, fz, 1.0, 1.9, 0.05, 0x2c2016);
    }
    if (!o.thatch) {
      for (const sx of [-1, 1]) {
        if (f === 0 && !o.shop && sx < 0) continue;
        const wx = sx * ww * 0.3;
        lw.box(wx, yb + fh * 0.6, fz, ww * 0.22, fh * 0.42, 0.05, 0x3d2c1b);     // 窗框
        lw.box(wx, yb + fh * 0.6, fz + 0.03, ww * 0.18, fh * 0.36, 0.04, 0x9a8a66); // 窗纸
        lw.box(wx, yb + fh * 0.6, fz + 0.05, 0.05, fh * 0.36, 0.03, 0x3d2c1b);   // 格子
        lw.box(wx, yb + fh * 0.6, fz + 0.05, ww * 0.18, 0.05, 0.03, 0x3d2c1b);
      }
    }
    if (o.balcony && f === 0 && fl > 1) {                           // 二层平座 + 栏杆
      const by = yb + fh;
      lw.box(0, by + 0.08, 0, w + 2.4, 0.16, d + 2.4, 0x6d5233);
      const rh = 1.0;
      for (const sz of [-1, 1]) lw.box(0, by + rh / 2 + 0.16, sz * (d / 2 + 1.1), w + 2.4, 0.08, 0.08, 0x3f2c1b)
        .box(0, by + 0.5 + 0.16, sz * (d / 2 + 1.1), w + 2.4, 0.06, 0.06, 0x3f2c1b);
      for (const sx of [-1, 1]) lw.box(sx * (w / 2 + 1.1), by + rh / 2 + 0.16, 0, 0.08, 0.08, d + 2.4, 0x3f2c1b);
      for (let k = 0; k <= 6; k++) {
        const px = -w / 2 - 1.1 + (w + 2.4) * k / 6;
        lw.cyl(px, by + 0.16 + rh / 2, d / 2 + 1.1, 0.04, 0.04, rh, 4, 0x3f2c1b)
          .cyl(px, by + 0.16 + rh / 2, -d / 2 - 1.1, 0.04, 0.04, rh, 4, 0x3f2c1b);
      }
    }
  }
  // 屋顶
  const top = base + h;
  const rise = o.thatch ? Math.min(w, d) * 0.55 : Math.min(w, d) * 0.28 + 0.6;
  const ov = o.thatch ? 1.4 : 1.1;
  lr.tri(roofTris(w, d, top, rise, ov, o.thatch ? 0.5 : 0.9), 0xffffff, ROOF_UV);
  if (!o.thatch) lw.box(0, top + rise + 0.05, 0, Math.max(0.3, w - d), 0.16, 0.36, 0x3b3026);   // 屋脊
  sgMerge('vc', lw, T);
  sgMerge(o.thatch ? 'thatch' : 'roof', lr, T);
  if (o.name) {
    const p = new THREE.Vector3(0, y0 + (o.balcony ? h * 0.55 : Math.min(h, 4.5)), d / 2 + 0.7).applyMatrix4(T);
    label(o.name, p.x, p.y, p.z, o.ry || 0, o.labelH || 4.6);
  }
  return T;
}

// 城门：墙台、拱形门洞（上方砖拱）、木构城楼
function buildGate() {
  const gx = 1060, zA = 19, zB = 33;
  const walls = sg('brick');
  walls.box(gx, 4.5, (zA - 6) / 2, 10, 9, zA + 6, 0xffffff);
  walls.box(gx, 4.5, (zB + 62) / 2, 10, 9, 62 - zB, 0xffffff);
  walls.box(gx, 6.9, (zA + zB) / 2, 10, 4.8, zB - zA, 0xffffff);          // 门洞上方砖拱
  walls.box(gx, 4.5 + 4.5, zA - 0.5, 11, 1.2, 1.2, 0xffffff);
  walls.box(gx, 4.5 + 4.5, zB + 0.5, 11, 1.2, 1.2, 0xffffff);
  hall({ x: gx, z: (zA + zB) / 2, y0: 9.5, w: 12, d: 12, h: 6.5, floors: 2, wall: 0x7a4a2c, labelH: 0 });
}

// 彩楼欢门：横跨大街的木构牌楼，两根红柱 + 横梁 + 小屋顶 + 彩幡
function buildCaiLou(x) {
  const lw = new Geo(), lr = new Geo();
  const z0 = 18.2, z1 = 33.8;
  lw.cyl(x, 4.2, z0, 0.3, 0.3, 8.4, 8, 0x8a2c1e).cyl(x, 4.2, z1, 0.3, 0.3, 8.4, 8, 0x8a2c1e);
  lw.box(x, 8.0, (z0 + z1) / 2, 1.0, 0.9, z1 - z0 + 1.2, 0x7a2a1c);
  lw.box(x, 7.1, (z0 + z1) / 2, 0.6, 0.6, z1 - z0 + 0.4, 0x5b3a22);
  for (const sx of [-1, 1]) lw.box(x + sx * 0.9, 9.5, (z0 + z1) / 2, 0.14, 2.0, 6, 0xc03a22);   // 彩幡
  // 小屋顶（沿 Z 方向）
  const T = M(x, 8.5, (z0 + z1) / 2, 0, Math.PI / 2, 0);
  lr.tri(roofTris(z1 - z0 + 3, 4.0, 0, 1.6, 0.8, 0.5), 0x7a6040, ROOF_UV);
  sgMerge('vc', lw, null);
  sgMerge('roof', lr, T);
}

// 招牌题签（竖排字）：name 为店名；(x,y,z) 为挂牌中心；ry 为朝向
var LABELS = [];
function label(name, x, y, z, ry, h) {
  LABELS.push({ name, x, y, z, ry, h });
}
function buildLabels(group) {
  for (const l of LABELS) {
    const chars = [...l.name];
    const cw = 96, ch = 96;
    const cv = document.createElement('canvas');
    cv.width = cw; cv.height = ch * chars.length + 24;
    const g = cv.getContext('2d');
    g.fillStyle = '#eadbb0'; g.fillRect(0, 0, cv.width, cv.height);
    g.strokeStyle = '#4a2c18'; g.lineWidth = 6; g.strokeRect(3, 3, cv.width - 6, cv.height - 6);
    g.fillStyle = '#3a2412'; g.font = '70px WK, KaiTi, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    chars.forEach((c, i) => g.fillText(c, cw / 2, 12 + ch * i + ch / 2));
    const tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = 4;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.0, cv.height / cw), new THREE.MeshBasicMaterial({ map: tex }));
    const hs = l.h / (cv.height / cw);
    mesh.scale.set(hs, hs, hs);
    mesh.position.set(l.x, l.y, l.z);
    mesh.rotation.y = l.ry;
    group.add(mesh);
  }
}

// 幌子（酒旗、布招）：细竿 + 一面布
function flagPole(x, y, z, col, ry = 0) {
  const g = sg('vc');
  const T = new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z);
  const lw = new Geo();
  lw.cyl(0, 2.6, 0, 0.06, 0.06, 5.2, 5, 0x4a3524);
  lw.box(0.7, 4.4, 0.02, 1.2, 1.4, 0.04, col);
  sgMerge('vc', lw, T);
}
