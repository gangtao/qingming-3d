/* ===== 50 各段布景：郊野春色 · 汴河虹桥 · 城门街市 =====
 * 布局依据原画：卷首（X≈0）是郊野与柳树、驮队、村舍；X≈740 是虹桥与桥下漕船；
 * X≈800 以后是城门（X≈1060）、大街、十字街（X≈1340）与几处有名的店铺。
 */
function buildCountryside() {
  // 北岸老柳，沿河排列
  for (let x = 20; x < 740; x += rnd(28, 50)) willow(x, QM.riverZ(x) - QM.riverW(x) / 2 - rnd(1, 4), rnd(0.9, 1.25));
  // 大路南侧的柳
  for (const x of [60, 190, 330, 470, 600, 700]) willow(x, QM.roadZ(x) - 7.5, rnd(0.9, 1.2));
  // 北岸山坡上的枯树
  for (let i = 0; i < 40; i++) deadTree(rnd(0, 720), rnd(-80, -100), rnd(1.2, 2.0));
  for (let i = 0; i < 12; i++) deadTree(rnd(100, 700), rnd(40, 70), rnd(1.0, 1.6));
  // 灌木与草垛
  for (let i = 0; i < 26; i++) sg('vc').box(rnd(20, 720), 0.5, rnd(26, 70), rnd(1.2, 2.2), 1.0, rnd(1.2, 2.0), pick([0x6d6a48, 0x5e6040, 0x7f7650]));
  for (const [x, z] of [[300, 52], [360, 56], [440, 58], [520, 60]]) sg('vc').cyl(x, 1.2, z, 0.2, 1.4, 2.4, 8, 0xb49a5e);
  // 村舍（草顶）
  const huts = [[330, 44], [372, 47], [420, 42], [470, 50], [515, 45]];
  for (const [x, z] of huts) hall({ x, z, w: 9, d: 6, h: 3.2, thatch: true, ry: Math.PI, wall: 0xa4875a });
  // 大路上的驮队：驴与马，各自往返，步伐一致
  for (let i = 0; i < 4; i++) addAnimal('donkey', { x: 120 + 3.2 * i, z: 18.6, dir: 1, speed: 1.0, x0: 40, x1: 640 });
  addPerson({ mode: 'walk', x: 118.5, z: 18.2, dir: 1, speed: 1.0, x0: 40, x1: 640, hat: 'straw', carry: false });
  for (let i = 0; i < 3; i++) addAnimal('horse', { x: 500 - 3.0 * i, z: 22.4, dir: -1, speed: 0.9, x0: 40, x1: 640 });
  addPerson({ mode: 'walk', x: 501.5, z: 22.2, dir: -1, speed: 0.9, x0: 40, x1: 640, hat: 'straw' });
  // 牛车（牛在前）
  const oi = ANIMALS.length;
  addAnimal('ox', { x: 233.6, z: 20.6, dir: 1, speed: 0.7, mode: 'gait', hasPack: false });
  addCart('oxcart', { x: 230, z: 20.6, dir: 1, speed: 0.7, x0: 60, x1: 560, ox: oi });
  // 独轮车与推车的人
  addCart('barrow', { x: 420, z: 19.2, dir: -1, speed: 0.9, x0: 300, x1: 600 });
  addPerson({ mode: 'walk', x: 422.2, z: 19.2, dir: -1, speed: 0.9, x0: 300, x1: 600, hat: 'cap' });
  // 轿子与两个抬轿人
  addCart('sedan', { x: 600, z: 20.4, dir: 1, speed: 0.8, x0: 330, x1: 700 });
  for (const sx of [-2.2, 2.2]) for (const sz of [-0.9, 0.9]) {
    addPerson({ mode: 'walk', carry: true, hat: 'cap', x: 600 + sx, z: 20.4 + sz, dir: 1, speed: 0.8, x0: 330 + sx, x1: 700 + sx });
  }
  // 田里的人：锄地、担水
  for (let i = 0; i < 14; i++) {
    addPerson({ mode: 'work', x: rnd(180, 520), z: rnd(34, 62), hat: pick(['straw', 'straw', 'none']), yaw: pick([0, Math.PI, Math.PI / 2, -Math.PI / 2]), ph: rnd(0, 6) });
  }
  // 北岸：湖边一条小船，船上一人
  const fb = addBoat('small', { x: 90, z: QM.riverZ(90) + 2, dir: 1, speed: 0.25, x0: 40, x1: 180 });
  addPerson({ mode: 'idle', boat: fb, lx: 0.2, ly: 0.9, lz: 0, hat: 'straw', yaw: 0 });
}

function buildBridgeCrowd() {
  // 桥上看热闹的人：站在拱背上，俯身向河
  const b = QM.BR;
  for (let i = 0; i < 46; i++) {
    const z = rnd(b.z0 + 4, b.z1 - 4);
    const x = rnd(b.x - b.hw + 1.2, b.x + b.hw - 1.2);
    addPerson({ mode: 'idle', x, y: QM.bridgeY(z) + 0.02, z, yaw: pick([Math.PI / 2, -Math.PI / 2, 0, Math.PI]), hat: pick(['cap', 'cap', 'none', 'straw']) });
  }
}

function buildRiver() {
  // 漕船：大船上有人，在河中来回；小船在岸边
  const cargoX = [40, 200, 360, 980, 1150, 1420];
  for (let i = 0; i < cargoX.length; i++) {
    const x = cargoX[i];
    const b = addBoat('cargo', { x, z: QM.riverZ(x) + rnd(-4, 4), dir: i % 2 ? -1 : 1, speed: rnd(0.5, 0.9), x0: 20, x1: 1560 });
    for (let k = 0; k < 3; k++) {
      addPerson({ mode: 'idle', boat: b, lx: -4.5 + k * 4, ly: 2.2, lz: rnd(-0.8, 0.8), hat: pick(['cap', 'none', 'straw']), yaw: pick([0, Math.PI]) });
    }
  }
  for (const x of [120, 560, 1060, 1280, 1500]) {
    const b = addBoat('small', { x, z: QM.riverZ(x) - 4, dir: pick([1, -1]), speed: rnd(0.3, 0.5), x0: x - 90, x1: x + 90 });
    addPerson({ mode: 'idle', boat: b, lx: 0, ly: 0.8, lz: 0, hat: 'straw', yaw: 0 });
  }
}

function buildCity() {
  buildGate();
  buildCaiLou(1355);
  // 有名的店铺（名称随墙挂牌）
  hall({ x: 1310, z: 11, w: 26, d: 14, h: 8, floors: 2, name: '孙羊正店', shop: true, wall: 0xcbb78e, labelH: 5.2 });
  hall({ x: 1410, z: 11.5, w: 22, d: 13, h: 8.5, floors: 2, balcony: true, name: '十千脚店', shop: true, wall: 0xd0bc90, labelH: 5.2 });
  hall({ x: 1475, z: 38.5, ry: Math.PI, w: 14, d: 9, h: 5.2, floors: 1, name: '赵太丞家', shop: true, wall: 0xc4ae84, labelH: 4.2 });
  hall({ x: 1550, z: 10, w: 30, d: 16, h: 7.5, floors: 1, name: '久住王员外家', wall: 0xc9b48b, labelH: 4.4 });
  // 旗幌与大伞
  flagPole(1297, 0, 19.2, 0xb03a2a);
  flagPole(1428, 0, 19.2, 0x6d7a4e);
  flagPole(1475, 0, 33.2, 0xb03a2a, Math.PI);
  for (const x of [1001, 1190, 1400, 1500, 1520]) {
    sg('vc').cyl(x, 3.3, 27, 2.6, 0.1, 0.6, 8, 0xb8945c).cyl(x, 1.5, 27, 0.06, 0.06, 3.0, 5, 0x4a3524);
  }
  // 街两侧的民居（跳过店铺与城门）
  const RES = [[1036, 1094], [1280, 1372], [1383, 1437], [1462, 1490], [1520, 1580]];
  const free = (x0, x1) => !RES.some(([a, b]) => x1 > a && x0 < b);
  for (let side of [-1, 1]) {
    for (let x = 812; x < 1600;) {
      const w = rnd(10, 14);
      if (free(x, x + w) && x + w < 1600) {
        const d = rnd(8, 10), h = rnd(4.5, 6.5), th = RND() < 0.1;
        const wall = pick([0xc9b48b, 0xb89e74, 0xd6c39a, 0xa88c64]);
        if (side < 0) hall({ x: x + w / 2, z: 18 - d / 2, w, d, h, floors: RND() < 0.35 ? 2 : 1, wall, thatch: th });
        else hall({ x: x + w / 2, z: 34 + d / 2, w, d, h, floors: 1, wall, thatch: th, ry: Math.PI });
      }
      x += w + rnd(1, 3);
    }
  }
  // 城内的老柳与大树
  willow(1200, -3.5, 1.1); willow(1480, -2.5, 1.0); willow(1620, -4, 1.2);
  for (const x of [880, 1100, 1480]) deadTree(x, 56, 1.4);
}

function buildPeopleCity() {
  // 大街上的行人：在各自的路段里来回走，分两个车道
  for (let i = 0; i < 170; i++) {
    const x0 = rnd(812, 1500), x1 = Math.min(1592, x0 + rnd(60, 260));
    addPerson({ mode: 'walk', x: rnd(x0, x1), z: rnd(21, 31), x0, x1, dir: RND() < 0.5 ? 1 : -1, speed: rnd(0.7, 1.5), hat: pick(['cap', 'cap', 'straw', 'none']) });
  }
  // 挑夫：扁担担着货
  for (let i = 0; i < 24; i++) {
    const x0 = rnd(812, 1500), x1 = Math.min(1592, x0 + rnd(60, 220));
    addPerson({ mode: 'walk', x: rnd(x0, x1), z: rnd(21, 31), x0, x1, dir: RND() < 0.5 ? 1 : -1, speed: rnd(0.9, 1.4), carry: true, hat: 'cap' });
  }
  // 摊前的人：站着
  for (let i = 0; i < 34; i++) {
    addPerson({ mode: 'idle', x: rnd(830, 1560), z: rnd(20, 31), yaw: pick([Math.PI / 2, -Math.PI / 2]), hat: pick(['cap', 'none', 'straw']) });
  }
  // 店里喝茶的客人：坐在铺前
  const seats = [
    [1296, 1324, 17.0, 0, 9], [1396, 1424, 16.6, 0, 6], [1466, 1484, 34.6, Math.PI, 4], [1534, 1566, 18.0, 0, 7],
  ];
  for (const [x0, x1, z, yaw, n] of seats) {
    for (let k = 0; k < n; k++) addPerson({ mode: 'sit', x: rnd(x0, x1), z: z + rnd(-0.4, 0.4), yaw, hat: pick(['cap', 'none']) });
  }
  // 酒楼二层平座上看街的人
  for (let k = 0; k < 10; k++) {
    addPerson({ mode: 'idle', x: rnd(1398, 1424), y: 5.0, z: 18.4, yaw: 0, hat: pick(['cap', 'none']) });
  }
  // 城门前看热闹的人
  for (let k = 0; k < 20; k++) {
    addPerson({ mode: 'idle', x: rnd(1040, 1082), z: rnd(20.5, 31), yaw: pick([Math.PI / 2, -Math.PI / 2]), hat: pick(['cap', 'none']) });
  }
  // 街上的驴、牛车
  for (let i = 0; i < 8; i++) addAnimal('donkey', { x: 830 + i * 7, z: 24 + (i % 2) * 2.5, dir: i % 2 ? -1 : 1, speed: 1.0, x0: 800, x1: 1520 });
  const oi = ANIMALS.length;
  addAnimal('ox', { x: 903.6, z: 27, dir: 1, speed: 0.6, mode: 'gait', hasPack: false });
  addCart('oxcart', { x: 900, z: 27, dir: 1, speed: 0.6, x0: 830, x1: 1000, ox: oi });
}

function buildScene() {
  buildWorldStatic();
  buildCountryside();
  buildRiver();
  buildBridgeCrowd();
  buildCity();
  buildPeopleCity();
}
