import * as THREE from 'three';
import {
  createRng,
  MaterialLibrary,
  StaticGeometryBatcher,
} from './01-primitives';
import {
  fromRainbowBridgeLocal,
  groundHeightAt,
  queryBianRiver,
  RAINBOW_BRIDGE,
  RB_YAW,
  walkableHeightAt,
} from './02-world';
import {
  addMarketUmbrellaAndStall,
  CrowdAndLifeSystem,
  HumanRole,
} from './03-actors';
import {
  addBambooFence,
  addCailouHuanmen,
  addCityGateComplex,
  addFourEyeWell,
  addRainbowBridge,
  addRiverEmbankments,
  addSecondaryBridges,
  addThatchedHouse,
  addTiledBuilding,
  TreeSystem,
} from './04-architecture';
import { BianVesselSystem } from './05-vessels';

/**
 * 模块六：全卷三段逐段布景（06-scenes.ts）
 * 对照故宫博物院藏本《清明上河图》，从卷首（X=+240, u=1.0）至卷尾（X=-240, u=0.0）
 * 按原画次序、比例与方位完整重建“郊野春色”“汴河虹桥”“城门街市”三大段落。
 */

export interface SectionZoneInfo {
  uMin: number;
  uMax: number;
  majorTitle: '郊野春色' | '汴河虹桥' | '城门街市';
  subTitle: string;
  description: string;
}

export const SECTION_ZONES: SectionZoneInfo[] = [
  {
    uMin: 0.87,
    uMax: 1.01,
    majorTitle: '郊野春色',
    subTitle: '郊野春色 · 疏林薄霭',
    description: '晨雾初散，疏林寒树间小桥流水，驮炭驴队踏着乡间土路缓缓向汴京近郊行进。农舍茅檐错落，早春枯木与新柳相映成趣。',
  },
  {
    uMin: 0.74,
    uMax: 0.87,
    majorTitle: '郊野春色',
    subTitle: '郊野春色 · 古柳踏青',
    description: '官道两旁老柳盘根错节、细枝初发鹅黄，扫墓踏青归来的轿马队伍插柳而行。田畴麦场与路边野店渐显京畿生气。',
  },
  {
    uMin: 0.61,
    uMax: 0.74,
    majorTitle: '汴河虹桥',
    subTitle: '汴河虹桥 · 漕船卸粮',
    description: '汴河水道渐宽，河北岸粮仓茶肆鳞次栉比，多艘漕船依岸停泊。挑夫踏跳板往来卸粮，船身皆放下人字桅而无一张帆。',
  },
  {
    uMin: 0.54,
    uMax: 0.61,
    majorTitle: '汴河虹桥',
    subTitle: '汴河虹桥 · 纤夫曳船',
    description: '河面舟楫往来，岸畔五名纤夫俯身弓步、合力曳引客船逆流西上。临水轩亭内茶客凭栏远眺，橹声水影交织。',
  },
  {
    uMin: 0.47,
    uMax: 0.54,
    majorTitle: '汴河虹桥',
    subTitle: '汴河虹桥 · 放桅急渡',
    description: '木构无柱虹桥斜跨汴河，桥面摊贩云集、文武轿马争道。桥下一艘大船正急落人字桅杆，船工撑篙呼号，桥上众人凭栏施援。',
  },
  {
    uMin: 0.34,
    uMax: 0.47,
    majorTitle: '汴河虹桥',
    subTitle: '汴河虹桥 · 十千脚店',
    description: '桥西街市繁华，“十千脚店”门前彩楼欢门高耸，二层平座酒客盈门。汴河自此折向西北远去，岸畔修车木作与车马喧阗。',
  },
  {
    uMin: 0.20,
    uMax: 0.34,
    majorTitle: '城门街市',
    subTitle: '城门街市 · 护城河桥',
    description: '城外大道车水马龙，修车坊与货摊沿街铺开，席篷牛车、独轮车络绎不绝。行人与挑夫跨越护城河平桥，直趋城门。',
  },
  {
    uMin: 0.14,
    uMax: 0.20,
    majorTitle: '城门街市',
    subTitle: '城门街市 · 城楼驼队',
    description: '高大砖砌城台之上歇山顶木构城楼巍然耸立，一队双峰骆驼满载西域货包正穿门洞而出。门内税务官吏查验商旅货担。',
  },
  {
    uMin: -0.01,
    uMax: 0.14,
    majorTitle: '城门街市',
    subTitle: '城门街市 · 十字街口',
    description: '城内大街名铺林立，“孙羊正店”彩楼欢门夺目，“久住王员外家”客舍幽深。十字街口四眼水井汲水繁忙，卷尾“赵太丞家”药牌醒目。',
  },
];

export interface ScenePlaque {
  id: string;
  label: string;
  x: number;
  y: number;
  z: number;
  major?: boolean;
}

export const SCENE_PLAQUES: ScenePlaque[] = [
  { id: 'donkey', label: '驮炭驴队', x: 214, y: 3.0, z: 4.5 },
  { id: 'farm', label: '农家麦场', x: 184, y: 4.4, z: -4.0 },
  { id: 'willow', label: '古柳长堤', x: 156, y: 5.4, z: 4.0 },
  { id: 'qingming', label: '踏青归轿', x: 140, y: 3.4, z: 10.5 },
  { id: 'dock', label: '卸粮码头', x: 78, y: 5.0, z: 1.5 },
  { id: 'teahouse', label: '临水茶肆', x: 53, y: 5.2, z: -2.0 },
  { id: 'trackers', label: '纤夫曳船', x: 38, y: 3.6, z: 0.5 },
  { id: 'heroboat', label: '放桅急渡', x: 11.8, y: 4.2, z: 1.8, major: true },
  { id: 'rainbow', label: '汴河虹桥', x: 2.5, y: 6.8, z: 0.0, major: true },
  { id: 'shiqian', label: '十千脚店', x: -24.0, y: 9.2, z: 8.2, major: true },
  { id: 'riverpav', label: '临河大酒楼', x: -37.5, y: 8.2, z: 9.5 },
  { id: 'wheelshop', label: '修车木作铺', x: -68.0, y: 5.2, z: 1.8 },
  { id: 'moat', label: '护城河桥', x: -133.0, y: 3.4, z: 16.0 },
  { id: 'citygate', label: '砖筑城门楼', x: -153.5, y: 15.2, z: 4.5, major: true },
  { id: 'camels', label: '西域骆驼队', x: -144.0, y: 3.8, z: 4.8 },
  { id: 'tax', label: '城内税务所', x: -169.0, y: 5.2, z: -1.8 },
  { id: 'sunyang', label: '孙羊正店', x: -185.0, y: 10.0, z: -3.2, major: true },
  { id: 'wanginn', label: '久住王员外家', x: -203.0, y: 8.4, z: -4.2, major: true },
  { id: 'crossroad', label: '十字街口', x: -212.0, y: 3.8, z: 4.5 },
  { id: 'well', label: '四眼水井', x: -225.0, y: 2.6, z: 8.5 },
  { id: 'zhaoclinic', label: '赵太丞家', x: -231.0, y: 5.6, z: -2.8, major: true },
];

export function populateFullScrollScene(
  root: THREE.Object3D,
  matLib: MaterialLibrary,
): {
  crowd: CrowdAndLifeSystem;
  vessels: BianVesselSystem;
} {
  const rng = createRng(11142026);
  const batcher = new StaticGeometryBatcher();
  const signGroup = new THREE.Group();
  root.add(signGroup);

  const trees = new TreeSystem();
  const crowd = new CrowdAndLifeSystem(root, matLib);
  const vessels = new BianVesselSystem(root, matLib);

  // =========================================================================
  // 第一段：郊野春色（X = +118 .. +240，卷首右段）
  // =========================================================================

  // 1. 卷首小木桥、护城河桥、汴河两岸木桩石砌驳岸与虹桥本体
  addSecondaryBridges(batcher);
  addRiverEmbankments(batcher);
  addRainbowBridge(batcher);

  // 2. 卷首疏林薄雾（多为枯枝杂树，夹杂早春老柳）
  for (let i = 0; i < 28; i++) {
    const tx = 196 + rng() * 52;
    const tz = -18 + rng() * 34;
    if (Math.abs(tz - 5.5) < 2.6 && Math.abs(tx - 218) < 6) continue;
    if (rng() > 0.25) {
      trees.addBareDeciduousTree(batcher, tx, tz, 0.85 + rng() * 0.45);
    } else {
      trees.addPollardedWillow(batcher, tx, tz, 0.85 + rng() * 0.25);
    }
  }

  // 驮炭驴队（5 头驮包毛驴踏过小木桥向西进发 + 3 名戴斗笠赶驴汉子）
  const donkeyTrail = {
    points: [
      [235, 3.2],
      [223, 5.4],
      [213, 5.6],
      [198, 6.8],
      [182, 8.2],
    ] as Array<[number, number]>,
  };
  for (let d = 0; d < 5; d++) {
    crowd.addAnimal({
      species: 'donkey',
      path: { ...donkeyTrail },
      phase: d * 0.14,
      speed: 0.78,
      hasPack: true,
    });
  }
  for (let g = 0; g < 3; g++) {
    crowd.addHuman({
      role: 'walker',
      headgear: 'conical',
      prop: g === 0 ? 'bundle' : 'none',
      path: { ...donkeyTrail },
      phase: g * 0.26 + 0.06,
      speed: 0.78,
    });
  }

  // 3. 农家茅草院落与石磙麦场（X = +172 .. +196, Z = -9 .. +2）
  addThatchedHouse(batcher, 192, -6.5, 5.4, 3.8, 0.12);
  addThatchedHouse(batcher, 184, -8.2, 6.2, 4.2, -0.06);
  addThatchedHouse(batcher, 176, -5.8, 4.8, 3.6, 0.28);
  addThatchedHouse(batcher, 188, -1.8, 4.2, 3.2, -1.45, true); // 农具草棚
  addBambooFence(batcher, 172, -2.5, 181, 0.8);
  addBambooFence(batcher, 186, 0.8, 196, -2.2);
  crowd.addChimneySmoke(184.5, 4.2, -8.2);
  crowd.addChimneySmoke(192.2, 3.9, -6.5);

  // 麦场石磙
  const rollerY = groundHeightAt(183, -3.5);
  batcher.addCylinder(
    'stonePodium',
    0.26,
    0.26,
    0.85,
    10,
    new THREE.Matrix4().makeRotationZ(Math.PI / 2).setPosition(183, rollerY + 0.26, -3.5),
  );

  // 农舍周边农夫、挑夫、散养猪狗与耕牛
  crowd.addAnimal({ species: 'ox', x: 179.5, z: -2.2, yaw: 1.1, speed: 0 });
  crowd.addAnimal({
    species: 'pig',
    path: { points: [[174, 1.5], [180, 2.2], [178, -0.5]], closed: true },
    speed: 0.48,
  });
  crowd.addAnimal({
    species: 'dog',
    path: { points: [[185, 1.2], [191, 0.5], [188, 3.2]], closed: true },
    speed: 0.85,
  });
  for (let i = 0; i < 8; i++) {
    crowd.addHuman({
      role: i % 3 === 0 ? 'porter_pole' : 'walker',
      path: {
        points: [
          [195 - i * 2.2, 2.5 + (i % 2) * 1.4],
          [170 - i * 1.5, 5.8 + (i % 3) * 0.9],
        ],
      },
      speed: 0.72 + rng() * 0.25,
      phase: rng(),
    });
  }

  // 4. 古柳长堤（原画卷首极具神韵的一排歪斜盘根老柳！X = +136 .. +172）
  const willowCoords: Array<[number, number, number, number]> = [
    [169, 4.2, 1.15, 0.4],
    [164, 7.8, 1.22, -0.5],
    [160, 2.6, 1.08, 0.9],
    [156, 6.8, 1.28, -0.3],
    [152, 1.8, 1.12, 1.2],
    [148, 8.2, 1.18, -0.8],
    [143, 3.2, 1.05, 0.5],
    [138, 13.5, 1.20, -1.1],
    [132, 15.2, 1.15, 0.7],
    [126, 4.8, 1.02, -0.4],
  ];
  for (const [wx, wz, ws, wyaw] of willowCoords) {
    trees.addPollardedWillow(batcher, wx, wz, ws, wyaw);
  }
  for (let i = 0; i < 12; i++) {
    trees.addBareDeciduousTree(batcher, 128 + rng() * 44, -16 + rng() * 11, 0.8 + rng() * 0.35);
  }

  // 5. 清明扫墓踏青归来队伍（插柳小轿 + 骑马文士 + 骑驴妇人/随从 + 挑担仆役）
  const qingmingPath = {
    points: [
      [166, 9.4],
      [150, 10.6],
      [134, 11.4],
      [118, 9.8],
    ] as Array<[number, number]>,
  };
  crowd.addSedanChair({
    path: { ...qingmingPath },
    phase: 0.32,
    speed: 0.84,
    withWillowTwigs: true,
  });
  crowd.addAnimal({
    species: 'horse',
    path: { ...qingmingPath },
    phase: 0.16,
    speed: 0.84,
    hasRider: true,
    riderHeadgear: 'futou',
  });
  crowd.addAnimal({
    species: 'donkey',
    path: { ...qingmingPath },
    phase: 0.48,
    speed: 0.84,
    hasRider: true,
    riderHeadgear: 'topknot',
  });
  for (let s = 0; s < 5; s++) {
    crowd.addHuman({
      role: s % 2 === 0 ? 'porter_pole' : 'walker',
      prop: s % 2 === 1 ? 'bundle' : 'poleBaskets',
      headgear: 'topknot',
      path: { ...qingmingPath },
      phase: 0.08 + s * 0.11,
      speed: 0.84,
    });
  }

  // 北侧田间小径奔马与追赶马夫（原画近郊受惊马细节！）
  const northHorsePath = {
    points: [
      [162, -6.5],
      [142, -5.2],
      [124, -4.5],
    ] as Array<[number, number]>,
  };
  crowd.addAnimal({ species: 'horse', path: { ...northHorsePath }, speed: 1.75, phase: 0.1, hasSaddle: true });
  crowd.addHuman({ role: 'walker', headgear: 'topknot', path: { ...northHorsePath }, speed: 1.45, phase: 0.22 });

  // 郊野与河岸交界茅草野茶馆与村舍（X = +120 .. +145）
  addThatchedHouse(batcher, 144, 6.2, 5.0, 3.6, 0.08);
  addTiledBuilding(batcher, signGroup, matLib, {
    x: 136,
    z: 6.5,
    width: 5.4,
    depth: 4.0,
    yaw: 0.05,
    openFront: true,
    bannerText: '野店清茶',
  });
  addThatchedHouse(batcher, 123, -1.8, 5.8, 4.0, 0.18, true);
  crowd.addChimneySmoke(136, 4.6, 6.5);
  for (let k = 0; k < 4; k++) {
    crowd.addHuman({
      role: 'seated_tea',
      x: 122.2 + (k % 2) * 1.4,
      z: -1.6 + Math.floor(k / 2) * 0.9,
      yaw: k % 2 === 0 ? 1.5 : -1.5,
    });
  }

  crowd.addBirdFlock(208, 4, 16, 16, 12.5);
  crowd.addBirdFlock(148, 2, 10, 12, 13.5);

  // =========================================================================
  // 第二段：汴河虹桥（X = -82 .. +118，中段汴河漕运、虹桥奇观、十千脚店）
  // =========================================================================

  // 1. 河北岸（Z < 河中心）鳞次栉比的粮仓、面食店与临水轩亭茶肆（X = +42 .. +114）
  const eastNorthShops: Array<{ x: number; w: number; d: number; stories?: 1 | 2; sign?: string; banner?: string }> = [
    { x: 112, w: 6.2, d: 4.4, banner: '茶坊' },
    { x: 103, w: 7.4, d: 4.8, sign: '广济粮行' },
    { x: 93, w: 6.8, d: 4.6, banner: '粗细面食' },
    { x: 83, w: 8.2, d: 5.2, sign: '丰储仓廒' },
    { x: 72, w: 7.6, d: 5.0 },
    { x: 63, w: 6.4, d: 4.5, banner: '河鲜酒肆' },
    { x: 53, w: 7.2, d: 5.0, stories: 2, sign: '临水轩', banner: '清茶细点' },
  ];
  for (const sh of eastNorthShops) {
    const r = queryBianRiver(sh.x, 0);
    const sz = r.closestZ - r.halfWidth - 4.4;
    const b = addTiledBuilding(batcher, signGroup, matLib, {
      x: sh.x,
      z: sz,
      width: sh.w,
      depth: sh.d,
      yaw: 0.06,
      stories: sh.stories ?? 1,
      openFront: true,
      signText: sh.sign,
      bannerText: sh.banner,
    });
    if (sh.stories === 2) {
      for (let g = 0; g < 4; g++) {
        crowd.addHuman({
          role: 'seated_tea',
          x: sh.x - 1.8 + g * 1.2,
          y: b.floor2Y,
          z: sz + 1.2,
          yaw: 0.1,
        });
      }
    } else {
      crowd.addHuman({ role: 'vendor', x: sh.x - 1.0, z: sz + 1.8, yaw: 0 });
      crowd.addHuman({ role: 'seated_tea', x: sh.x + 1.2, z: sz + 0.4, yaw: -1.4 });
    }
  }
  crowd.addChimneySmoke(93, 4.8, -4.5);
  crowd.addChimneySmoke(63, 4.8, -6.2);

  // 河南岸（Z > 河中心）老柳、屋舍与停泊小舟（X = +16 .. +58）
  addTiledBuilding(batcher, signGroup, matLib, { x: 32, z: 18.2, width: 7.2, depth: 4.8, yaw: 2.95 });
  addTiledBuilding(batcher, signGroup, matLib, { x: 22, z: 16.8, width: 6.4, depth: 4.4, yaw: 2.88, openFront: true });
  trees.addPollardedWillow(batcher, 44, 17.5, 1.26, -1.2);
  trees.addPollardedWillow(batcher, 27, 14.5, 1.32, -1.5);
  trees.addPollardedWillow(batcher, 118, 22.5, 1.25, -0.8);

  // 2. 汴河东段停泊的 8 艘大型漕船与客船（全数放倒人字桅，仅 74m 处一艘立光杆吊粮，绝无一张帆！）
  const mooredEastXs = [110, 99, 88, 76, 65, 55];
  mooredEastXs.forEach((bx, idx) => {
    const r = queryBianRiver(bx, 8);
    const bz = r.closestZ - r.halfWidth + 2.4 + (idx % 2) * 1.8;
    const byaw = Math.atan2(-r.tangentX, -r.tangentZ) + (idx % 2 === 0 ? 0.04 : -0.05);
    vessels.addVessel(
      {
        kind: idx % 3 === 1 ? 'passengerBoat' : 'grainBarge',
        x: bx,
        z: bz,
        yaw: byaw,
        mastState: bx === 76 ? 'derrickBare' : 'lowered',
        hasGangplankToNorth: bx === 88 || bx === 76 || bx === 65,
      },
      crowd,
      batcher,
    );
  });

  // 河南岸浅滩系泊船只与渡船
  vessels.addVessel({ kind: 'grainBarge', x: 112, z: 16.8, yaw: -1.85, mastState: 'lowered' }, crowd);
  vessels.addVessel({ kind: 'skiff', x: 48, z: 15.2, yaw: -1.45, mastState: 'none' }, crowd);

  // 卸粮码头挑夫扛大麻袋往返船舷与粮仓（12 名忙碌苦力）
  for (let p = 0; p < 12; p++) {
    const dockX = 64 + (p % 3) * 11.5 + (rng() - 0.5) * 1.5;
    const r = queryBianRiver(dockX, 8);
    crowd.addHuman({
      role: p % 4 === 0 ? 'porter_pole' : 'porter_sack',
      path: {
        points: [
          [dockX, r.closestZ - r.halfWidth + 0.2],
          [dockX + (rng() - 0.5) * 2.5, r.closestZ - r.halfWidth - 4.2],
        ],
      },
      speed: 0.76 + rng() * 0.22,
      phase: p * 0.17,
    });
  }

  // 河北岸沿河大道行人与挑夫（28 人）
  for (let i = 0; i < 28; i++) {
    const x0 = 14 + rng() * 98;
    const x1 = Math.max(12, Math.min(116, x0 + (rng() > 0.5 ? 24 : -24)));
    const r0 = queryBianRiver(x0, 0);
    const r1 = queryBianRiver(x1, 0);
    crowd.addHuman({
      role: i % 5 === 0 ? 'porter_pole' : i % 4 === 1 ? 'sleeved' : 'walker',
      path: {
        points: [
          [x0, r0.closestZ - r0.halfWidth - 2.2 - rng() * 1.8],
          [x1, r1.closestZ - r1.halfWidth - 2.2 - rng() * 1.8],
        ],
      },
      speed: 0.8 + rng() * 0.35,
      phase: rng(),
    });
  }

  // 3. 汴河中游：五名纤夫合力拉纤逆流客船 + 河心摇橹舟楫
  vessels.addVessel(
    {
      kind: 'passengerBoat',
      riverTStart: 0.31,
      riverTEnd: 0.42,
      speedT: 0.0045,
      lateralOffset: -2.2,
      mastState: 'lowered',
    },
    crowd,
  );
  vessels.addVessel(
    {
      kind: 'skiff',
      riverTStart: 0.26,
      riverTEnd: 0.38,
      speedT: 0.0075,
      lateralOffset: 2.8,
      mastState: 'none',
    },
    crowd,
  );

  // 4. 全卷戏剧中心：汴河虹桥与急落人字桅大客船！
  vessels.addVessel(
    {
      kind: 'rainbowHero',
      x: 11.8,
      z: 1.8,
      yaw: -1.86, // 船首斜对虹桥拱门
      mastState: 'lowering',
    },
    crowd,
  );

  // 虹桥桥面两侧大伞与货摊（完全踩在弧形桥面板上）
  const bridgeStallS = [-11.5, -7.2, -3.2, 3.4, 7.6, 11.2];
  bridgeStallS.forEach((bs, idx) => {
    const side = idx % 2 === 0 ? -1 : 1;
    const p = fromRainbowBridgeLocal(bs, side * 2.15);
    addMarketUmbrellaAndStall(batcher, p.x, p.z, -RB_YAW + (side > 0 ? Math.PI : 0), {
      onBridge: true,
      umbrella: idx % 3 !== 2,
      goodsType: idx % 3 === 0 ? 'buns' : idx % 3 === 1 ? 'tools' : 'cloth',
    });
    const pv = fromRainbowBridgeLocal(bs, side * 2.45);
    crowd.addHuman({
      role: 'vendor',
      x: pv.x,
      z: pv.z,
      yaw: -RB_YAW + (side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5),
    });
  });

  // 虹桥下游侧（w = +2.65）18 名凭栏俯身呼救、指点大船的市民！
  for (let k = 0; k < 18; k++) {
    const s = -9.5 + (k / 17) * 19.0 + (rng() - 0.5) * 0.4;
    const p = fromRainbowBridgeLocal(s, 2.62);
    crowd.addHuman({
      role: 'bridge_onlooker',
      x: p.x,
      z: p.z,
      yaw: Math.atan2(11.8 - p.x, 1.8 - p.z),
      phase: k * 0.37,
    });
  }

  // 虹桥桥心著名典故：“文武轿马争道”（一乘官轿与一匹高头官马在桥顶相对驻足理论 + 随从护卫）
  const sedanBridgePos = fromRainbowBridgeLocal(-2.2, -0.2);
  const horseBridgePos = fromRainbowBridgeLocal(2.4, 0.2);
  const bridgeApproachDir = Math.atan2(RAINBOW_BRIDGE.neX - RAINBOW_BRIDGE.swX, RAINBOW_BRIDGE.neZ - RAINBOW_BRIDGE.swZ);
  crowd.addSedanChair({
    x: sedanBridgePos.x,
    z: sedanBridgePos.z,
    yaw: bridgeApproachDir,
    speed: 0,
  });
  crowd.addAnimal({
    species: 'horse',
    x: horseBridgePos.x,
    z: horseBridgePos.z,
    yaw: bridgeApproachDir + Math.PI,
    speed: 0,
    hasRider: true,
    riderHeadgear: 'futou',
  });
  // 轿前与马前争执开道的随从
  for (const sOff of [-0.6, 0.6]) {
    const pArg = fromRainbowBridgeLocal(sOff, sOff * 0.4);
    crowd.addHuman({
      role: 'vendor',
      headgear: 'futou',
      x: pArg.x,
      z: pArg.z,
      yaw: sOff < 0 ? bridgeApproachDir : bridgeApproachDir + Math.PI,
    });
  }

  // 跨越虹桥往返的大量行人、挑夫、推独轮车夫与驮驴（38 人 + 2 独轮车 + 2 毛驴）
  const bridgeCrossPathA = {
    points: [
      [-10.5, 13.8],
      [-5.5, 9.2],
      [2.5, 0.0],
      [10.5, -9.2],
      [15.5, -12.2],
    ] as Array<[number, number]>,
  };
  for (let i = 0; i < 34; i++) {
    const wOff = (rng() - 0.5) * 2.4;
    const customPts = bridgeCrossPathA.points.map(([px, pz]) => [px + wOff * 0.65, pz + wOff * 0.65] as [number, number]);
    crowd.addHuman({
      role: i % 4 === 0 ? 'porter_pole' : i % 5 === 1 ? 'sleeved' : 'walker',
      path: { points: customPts },
      speed: 0.72 + rng() * 0.35,
      phase: i / 34,
    });
  }
  crowd.addVehicle({ type: 'wheelbarrow', path: { ...bridgeCrossPathA }, phase: 0.18, speed: 0.68 });
  crowd.addAnimal({ species: 'donkey', path: { ...bridgeCrossPathA }, phase: 0.74, speed: 0.75, hasPack: true });

  // 5. 桥西繁华街市：“十千脚店”与高耸彩楼欢门、临河二层大酒楼、西北河湾舟楫（X = -82 .. -12）
  // 桥头南北铺面
  addTiledBuilding(batcher, signGroup, matLib, {
    x: -11.5,
    z: 16.5,
    width: 8.2,
    depth: 5.4,
    yaw: 2.65,
    openFront: true,
    bannerText: '桥头饮子',
  });
  addTiledBuilding(batcher, signGroup, matLib, {
    x: 16.5,
    z: -13.8,
    width: 7.4,
    depth: 4.8,
    yaw: -0.52,
    openFront: true,
    signText: '汴北脚店',
  });

  // 著名“十千脚店” + 门前高大彩楼欢门！
  const shiqian = addTiledBuilding(batcher, signGroup, matLib, {
    x: -24.5,
    z: 12.2,
    width: 9.2,
    depth: 5.8,
    yaw: Math.PI, // 面朝北侧河岸街市广场
    stories: 2,
    openFront: true,
    hipGable: true,
    lacquerTimber: true,
    signText: '十千脚店',
    bannerText: '天之美禄',
  });
  addCailouHuanmen(batcher, -23.2, 6.6, Math.PI, 5.2, 8.6);
  for (let g = 0; g < 6; g++) {
    crowd.addHuman({
      role: 'seated_tea',
      x: -27.2 + g * 1.1,
      y: shiqian.floor2Y,
      z: 10.6,
      yaw: Math.PI,
    });
  }

  // 紧邻十千脚店西侧的二层临水大酒楼与前景连绵青瓦院落（精准对应原画 seg3 中下部屋顶群）
  const riverPav = addTiledBuilding(batcher, signGroup, matLib, {
    x: -37.5,
    z: 10.2,
    width: 9.6,
    depth: 6.0,
    yaw: Math.PI,
    stories: 2,
    openFront: true,
    hipGable: true,
    signText: '临汴酒楼',
  });
  for (let g = 0; g < 6; g++) {
    crowd.addHuman({
      role: 'seated_tea',
      x: -40.5 + g * 1.2,
      y: riverPav.floor2Y,
      z: 8.6,
      yaw: Math.PI + (g % 2 === 0 ? 0.3 : -0.3),
    });
  }

  // 前景错落青瓦民居群（Z = 16.5 .. 21.5）
  addTiledBuilding(batcher, signGroup, matLib, { x: -29, z: 19.2, width: 7.4, depth: 4.8, yaw: 0.08 });
  addTiledBuilding(batcher, signGroup, matLib, { x: -42, z: 18.6, width: 8.4, depth: 5.2, yaw: -0.12 });
  addTiledBuilding(batcher, signGroup, matLib, { x: -53, z: 18.2, width: 7.8, depth: 5.0, yaw: 0.25 });
  addTiledBuilding(batcher, signGroup, matLib, { x: -64, z: 19.0, width: 7.2, depth: 4.8, yaw: -0.05 });

  // 汴河上游西北转弯段停泊与摇橹远去的船只（X = -18 .. -68，无一船张帆！）
  vessels.addVessel({ kind: 'grainBarge', x: -22, z: -8.2, yaw: 1.38, mastState: 'lowered' }, crowd);
  vessels.addVessel({ kind: 'passengerBoat', x: -35, z: -10.2, yaw: 1.45, mastState: 'lowered' }, crowd);
  vessels.addVessel({ kind: 'grainBarge', x: -46, z: -3.2, yaw: -2.15, mastState: 'lowered' }, crowd);
  vessels.addVessel({ kind: 'grainBarge', x: -49, z: -7.5, yaw: -2.25, mastState: 'lowered' }, crowd);
  vessels.addVessel(
    {
      kind: 'passengerBoat',
      riverTStart: 0.66,
      riverTEnd: 0.84,
      speedT: 0.0055,
      lateralOffset: 0.5,
      mastState: 'lowered',
    },
    crowd,
  );
  vessels.addVessel(
    {
      kind: 'skiff',
      riverTStart: 0.72,
      riverTEnd: 0.89,
      speedT: 0.0085,
      lateralOffset: -2.0,
      mastState: 'none',
    },
    crowd,
  );

  // 河北岸上游远景屋宇与古柳
  addTiledBuilding(batcher, signGroup, matLib, { x: -12, z: -14.8, width: 8.6, depth: 4.8, yaw: 0.15, openFront: true });
  addTiledBuilding(batcher, signGroup, matLib, { x: -28, z: -16.5, width: 9.0, depth: 5.0, yaw: 0.08, openFront: true });
  trees.addPollardedWillow(batcher, -31, 4.2, 1.12, 0.5);
  trees.addPollardedWillow(batcher, -45, 3.8, 1.18, -0.7);
  trees.addBareDeciduousTree(batcher, -56, 2.2, 1.15);

  // 桥西修车木作坊与大道车马（X = -82 .. -52）
  addThatchedHouse(batcher, -54, 4.2, 6.8, 4.6, 0.35, true);
  addThatchedHouse(batcher, -68, 1.2, 8.2, 5.2, 0.06, true); // 修车大草棚
  crowd.addVehicle({ type: 'flatCart', x: -67.5, z: 3.6, yaw: 0.35, speed: 0 }); // 正在修理的大车
  for (let w = 0; w < 3; w++) {
    crowd.addHuman({ role: 'vendor', headgear: 'topknot', x: -68.8 + w * 1.3, z: 3.9, yaw: 0.2 });
  }

  const bridgeWestRoad = {
    points: [
      [-14, 8.4],
      [-34, 6.2],
      [-58, 8.8],
      [-86, 7.6],
    ] as Array<[number, number]>,
  };
  crowd.addVehicle({ type: 'oxCart', path: { ...bridgeWestRoad }, phase: 0.15, speed: 0.74 });
  crowd.addVehicle({ type: 'oxCart', path: { ...bridgeWestRoad }, phase: 0.62, speed: 0.72 });
  crowd.addVehicle({ type: 'wheelbarrow', path: { ...bridgeWestRoad }, phase: 0.40, speed: 0.86 });

  for (let s = 0; s < 5; s++) {
    addMarketUmbrellaAndStall(batcher, -18 - s * 11, 8.8 + (s % 2) * 3.2, 0.2, {
      goodsType: s % 2 === 0 ? 'buns' : 'pots',
    });
  }
  crowd.addBirdFlock(4, -2, 12, 18, 14.5);

  // =========================================================================
  // 第三段：城门街市（X = -240 .. -82，卷尾左段：护城河桥、城门城楼、孙羊正店、十字街口、赵太丞家）
  // =========================================================================

  // 1. 城门外街市、林木广场与护城河平桥（X = -144 .. -82）
  const outerSouthShops = [-88, -98, -108, -118];
  outerSouthShops.forEach((sx, idx) => {
    addTiledBuilding(batcher, signGroup, matLib, {
      x: sx,
      z: 16.8,
      width: 8.2,
      depth: 5.2,
      yaw: Math.PI,
      openFront: true,
      bannerText: idx % 2 === 0 ? '歇马客店' : '香饮汤茶',
    });
    crowd.addChimneySmoke(sx, 4.8, 17.2);
  });
  addTiledBuilding(batcher, signGroup, matLib, { x: -94, z: -6.5, width: 7.8, depth: 4.8, yaw: 0, openFront: true });
  addTiledBuilding(batcher, signGroup, matLib, { x: -108, z: -8.2, width: 8.4, depth: 5.0, yaw: 0.08, openFront: true });

  // 城门外高大老树群（精准还原原画 seg4 城门右侧浓密高耸树丛！）
  const outerGateTrees: Array<[number, number, boolean, number]> = [
    [-98, 1.5, true, 1.2],
    [-106, -1.8, false, 1.15],
    [-114, 2.2, true, 1.25],
    [-122, -2.5, false, 1.22],
    [-136, -3.2, false, 1.32],
    [-141, 0.8, true, 1.28],
    [-142, -7.8, false, 1.25],
    [-126, 12.2, true, 1.10],
    [-142, 13.5, true, 1.18],
    [-156, 14.8, false, 1.25], // 城台南侧古树
    [-155, -7.5, false, 1.20], // 城台北侧古树
  ];
  for (const [tx, tz, isW, sc] of outerGateTrees) {
    if (isW) trees.addPollardedWillow(batcher, tx, tz, sc);
    else trees.addBareDeciduousTree(batcher, tx, tz, sc);
  }

  // 城外大道牛车、独轮车、马匹与散养猪狗
  const outerGateRoad = {
    points: [
      [-84, 7.2],
      [-108, 6.4],
      [-128, 5.4],
      [-144, 4.8],
    ] as Array<[number, number]>,
  };
  crowd.addVehicle({ type: 'oxCart', path: { ...outerGateRoad }, phase: 0.22, speed: 0.72 });
  crowd.addVehicle({ type: 'wheelbarrow', path: { ...outerGateRoad }, phase: 0.55, speed: 0.88 });
  crowd.addVehicle({ type: 'wheelbarrow', path: { ...outerGateRoad }, phase: 0.82, speed: 0.84 });
  crowd.addAnimal({ species: 'horse', path: { ...outerGateRoad }, phase: 0.36, speed: 1.35, hasRider: true });
  crowd.addAnimal({ species: 'donkey', path: { ...outerGateRoad }, phase: 0.68, speed: 0.85, hasPack: true });
  crowd.addAnimal({
    species: 'pig',
    path: { points: [[-102, 11.5], [-110, 12.2], [-106, 9.8]], closed: true },
    speed: 0.5,
  });
  crowd.addAnimal({
    species: 'dog',
    path: { points: [[-118, 8.2], [-126, 9.0], [-122, 6.5]], closed: true },
    speed: 0.95,
  });

  // 护城河平桥过桥行人、挑夫与凭栏观水者（X ≈ -133, Z ≈ 16）
  const moatBridgePath = {
    points: [
      [-122, 16.0],
      [-133, 16.0],
      [-144, 15.8],
    ] as Array<[number, number]>,
  };
  for (let m = 0; m < 14; m++) {
    crowd.addHuman({
      role: m % 3 === 0 ? 'porter_pole' : 'walker',
      path: { points: moatBridgePath.points.map(([px, pz]) => [px, pz + (rng() - 0.5) * 1.8] as [number, number]) },
      speed: 0.76 + rng() * 0.25,
      phase: m / 14,
    });
  }
  for (let w = 0; w < 4; w++) {
    crowd.addHuman({
      role: 'bridge_onlooker',
      x: -135.5 + w * 1.6,
      z: 14.1,
      yaw: Math.PI,
      phase: w * 0.6,
    });
  }

  // 2. 雄伟砖筑城门城楼 + 穿城门而出的西域双峰骆驼商队！
  addCityGateComplex(batcher, signGroup, matLib);

  // 城楼平座回廊上瞭望与击鼓的守城兵丁
  crowd.addHuman({ role: 'vendor', headgear: 'futou', x: -151.2, y: groundHeightAt(-153.5, 4.5) + 8.65, z: 4.5, yaw: Math.PI * 0.5 });
  crowd.addHuman({ role: 'sleeved', headgear: 'futou', x: -153.5, y: groundHeightAt(-153.5, 4.5) + 8.65, z: 11.2, yaw: 0 });

  // 双峰骆驼队穿行城门洞（5 峰满载西域白麻货包的双峰驼 + 3 名胡帽/斗笠驼夫，沿门洞轴线穿门而出）
  const camelGatePath = {
    points: [
      [-168, 2.2],
      [-159.4, 3.2],
      [-153.5, 4.5],
      [-147.6, 5.8],
      [-134, 6.2],
      [-116, 6.5],
    ] as Array<[number, number]>,
  };
  for (let c = 0; c < 5; c++) {
    crowd.addAnimal({
      species: 'camel',
      path: { ...camelGatePath },
      phase: c * 0.11,
      speed: 0.76,
      hasPack: true,
    });
  }
  for (let d = 0; d < 3; d++) {
    crowd.addHuman({
      role: 'walker',
      headgear: 'conical',
      prop: 'bundle',
      path: { ...camelGatePath },
      phase: d * 0.22 + 0.04,
      speed: 0.76,
    });
  }

  // 3. 城内东大街：税务所、“孙羊正店”（带巨型彩楼欢门与二层平座酒客）、香药铺、弓箭铺（X = -196 .. -164）
  // 税务所（X = -169, Z = -2.4）
  addTiledBuilding(batcher, signGroup, matLib, {
    x: -169,
    z: -2.4,
    width: 7.8,
    depth: 5.0,
    yaw: 0,
    openFront: true,
    lacquerTimber: true,
    signText: '税务所',
  });
  for (let t = 0; t < 6; t++) {
    crowd.addHuman({
      role: t === 0 ? 'sleeved' : t % 2 === 1 ? 'vendor' : 'porter_pole',
      headgear: t < 2 ? 'futou' : 'topknot',
      x: -171.5 + t * 1.1,
      z: 0.8 + (t % 2) * 0.9,
      yaw: t % 2 === 0 ? 0.2 : 3.0,
    });
  }

  // “孙羊正店”——城内最宏丽的二层官营大酒楼 + 九米高彩楼欢门！
  const sunYang = addTiledBuilding(batcher, signGroup, matLib, {
    x: -185.0,
    z: -4.8,
    width: 11.4,
    depth: 6.6,
    yaw: 0,
    stories: 2,
    openFront: true,
    hipGable: true,
    lacquerTimber: true,
    signText: '孙羊正店',
    bannerText: '孙羊香醪',
  });
  addCailouHuanmen(batcher, -185.0, 0.2, 0, 6.2, 9.2);
  crowd.addChimneySmoke(-188.5, 8.2, -7.2);

  // 孙羊正店二层平座与一层堂内饮酒茶客（10 人）
  for (let g = 0; g < 7; g++) {
    crowd.addHuman({
      role: 'seated_tea',
      headgear: 'futou',
      x: -189.2 + g * 1.4,
      y: sunYang.floor2Y,
      z: -2.6,
      yaw: (g % 2 === 0 ? 0.25 : -0.25),
    });
  }
  for (let g = 0; g < 3; g++) {
    crowd.addHuman({
      role: 'vendor',
      x: -187 + g * 2.2,
      z: -0.2,
      yaw: 0,
    });
  }

  // 大街南侧成排铺面：茶坊、弓箭铺、刘家上色沉檀拣香铺
  addTiledBuilding(batcher, signGroup, matLib, {
    x: -171,
    z: 13.8,
    width: 7.8,
    depth: 5.0,
    yaw: Math.PI,
    openFront: true,
    signText: '精造弓箭',
  });
  addTiledBuilding(batcher, signGroup, matLib, {
    x: -183,
    z: 14.2,
    width: 9.2,
    depth: 5.4,
    yaw: Math.PI,
    stories: 2,
    openFront: true,
    signText: '沉檀拣香',
    bannerText: '刘家香药',
  });
  addTiledBuilding(batcher, signGroup, matLib, {
    x: -195,
    z: 13.8,
    width: 8.4,
    depth: 5.2,
    yaw: Math.PI,
    openFront: true,
    bannerText: '万家生佛',
  });

  // 4. “久住王员外家”、十字街口大伞货摊、四眼水井与卷尾“赵太丞家”（X = -240 .. -196）
  const wangInn = addTiledBuilding(batcher, signGroup, matLib, {
    x: -203.0,
    z: -4.4,
    width: 9.8,
    depth: 5.8,
    yaw: 0,
    stories: 2,
    openFront: true,
    signText: '久住王员外家',
    bannerText: '久住客店',
  });
  // 二层读书应举书生
  crowd.addHuman({
    role: 'seated_tea',
    headgear: 'futou',
    x: -203.0,
    y: wangInn.floor2Y,
    z: -2.4,
    yaw: 0,
  });

  // 十字街口南北向纵深店铺
  addTiledBuilding(batcher, signGroup, matLib, {
    x: -218.5,
    z: -12.5,
    width: 7.6,
    depth: 5.0,
    yaw: Math.PI * 0.5,
    openFront: true,
  });
  addTiledBuilding(batcher, signGroup, matLib, {
    x: -219.5,
    z: 15.2,
    width: 8.2,
    depth: 5.2,
    yaw: Math.PI,
    openFront: true,
    signText: '绒线绸缎',
  });

  // 十字街口大油布伞阵与“神课看命”摊
  const crossUmbrellas: Array<[number, number, 'buns' | 'cloth' | 'pots' | 'tools']> = [
    [-177, 8.2, 'buns'],
    [-192, 8.4, 'cloth'],
    [-206, 1.2, 'pots'],
    [-209, 8.6, 'tools'],
    [-215, 1.5, 'buns'],
    [-217, 8.8, 'cloth'],
  ];
  for (const [ux, uz, gt] of crossUmbrellas) {
    addMarketUmbrellaAndStall(batcher, ux, uz, rng() * Math.PI, { umbrella: true, goodsType: gt });
    crowd.addHuman({ role: 'vendor', x: ux + 0.6, z: uz - 0.6, yaw: 0.4 });
  }
  // 神课看命竖招旗
  const fortuneSign = new THREE.Mesh(
    new THREE.PlaneGeometry(0.55, 1.6, 2, 5),
    matLib.getSignMaterial('神课看命', { vertical: true, banner: true }),
  );
  fortuneSign.position.set(-208.2, groundHeightAt(-208.2, 8.6) + 2.2, 8.6);
  signGroup.add(fortuneSign);

  // 四眼石水井及汲水挑夫（X = -225, Z = +8.5）
  addFourEyeWell(batcher, -225.0, 8.5);
  for (let w = 0; w < 4; w++) {
    const ang = (w / 4) * Math.PI * 2 + 0.4;
    crowd.addHuman({
      role: w % 2 === 0 ? 'porter_pole' : 'carter',
      headgear: 'topknot',
      x: -225.0 + Math.cos(ang) * 1.55,
      z: 8.5 + Math.sin(ang) * 1.55,
      yaw: Math.atan2(-Math.cos(ang), -Math.sin(ang)),
    });
  }

  // 卷尾名铺：“赵太丞家”医馆与门前两块高竖药牌（X = -231, Z = -2.8）
  addTiledBuilding(batcher, signGroup, matLib, {
    x: -231.0,
    z: -2.8,
    width: 8.6,
    depth: 5.4,
    yaw: 0,
    openFront: true,
    lacquerTimber: true,
    signText: '赵太丞家',
  });
  // 原画卷尾著名的两座直立木柱竖匾：“治酒所伤真方集香丸”“太医出丸医肠胃药”
  const zhaoPillars: Array<[number, string]> = [
    [-227.2, '治酒所伤真方集香丸'],
    [-234.8, '太医出丸医肠胃药'],
  ];
  for (const [px, text] of zhaoPillars) {
    const py = groundHeightAt(px, 0.8);
    batcher.addBox('stonePodium', 0.48, 0.28, 0.48, new THREE.Matrix4().makeTranslation(px, py + 0.14, 0.8));
    batcher.addBox('woodDark', 0.14, 3.3, 0.14, new THREE.Matrix4().makeTranslation(px, py + 1.65, 0.8));
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 2.35, 0.08),
      matLib.getSignMaterial(text, { vertical: true, bg: '#dfd1b4', fg: '#2b2118', border: '#6b4d32' }),
    );
    board.position.set(px, py + 1.95, 0.86);
    signGroup.add(board);
  }
  // 医馆内问诊妇人与医官
  crowd.addHuman({ role: 'sleeved', headgear: 'futou', x: -231.5, z: -1.8, yaw: 0.2 });
  crowd.addHuman({ role: 'walker', headgear: 'topknot', x: -230.4, z: -0.9, yaw: -2.8 });

  // 卷尾庭院与高树收束（X = -239 .. -205）
  addTiledBuilding(batcher, signGroup, matLib, { x: -234, z: 14.5, width: 7.4, depth: 4.8, yaw: Math.PI });
  trees.addPollardedWillow(batcher, -209, -1.2, 1.25, 0.4);
  trees.addBareDeciduousTree(batcher, -221, -2.5, 1.22);
  trees.addBareDeciduousTree(batcher, -238, -4.2, 1.30);
  trees.addPollardedWillow(batcher, -237, 9.8, 1.18, -0.6);

  // 城内主街车轿与密集熙攘人群（席篷牛车、士绅小轿、独轮车及 180+ 名各色市井人物！）
  const innerAvenuePath = {
    points: [
      [-160, 5.6],
      [-185, 5.2],
      [-212, 4.8],
      [-236, 4.6],
    ] as Array<[number, number]>,
  };
  crowd.addVehicle({ type: 'oxCart', path: { ...innerAvenuePath }, phase: 0.28, speed: 0.68 });
  crowd.addVehicle({ type: 'wheelbarrow', path: { ...innerAvenuePath }, phase: 0.14, speed: 0.82 });
  crowd.addVehicle({ type: 'wheelbarrow', path: { ...innerAvenuePath }, phase: 0.66, speed: 0.85 });
  crowd.addSedanChair({ path: { ...innerAvenuePath }, phase: 0.52, speed: 0.88 });
  crowd.addSedanChair({
    path: {
      points: [
        [-212, -14],
        [-212, 4.5],
        [-212, 18],
      ],
    },
    phase: 0.35,
    speed: 0.84,
  });
  crowd.addAnimal({ species: 'horse', path: { ...innerAvenuePath }, phase: 0.81, speed: 1.25, hasRider: true });
  crowd.addAnimal({ species: 'donkey', path: { ...innerAvenuePath }, phase: 0.43, speed: 0.82, hasRider: true, riderHeadgear: 'conical' });
  crowd.addAnimal({
    species: 'dog',
    path: { points: [[-188, 2.5], [-198, 3.2], [-194, 7.2]], closed: true },
    speed: 0.9,
  });

  // 全卷大规模市井人群加密（使总人数达到约 560 人，重现摩肩接踵的北宋东京盛景！）
  const rolesPool: HumanRole[] = ['walker', 'walker', 'sleeved', 'porter_pole', 'walker', 'sleeved'];
  // 城内大街与十字街密集人流（190 人）
  for (let i = 0; i < 190; i++) {
    const isCrossNS = i % 6 === 0;
    if (isCrossNS) {
      const z0 = -14 + rng() * 30;
      const z1 = Math.max(-15, Math.min(18, z0 + (rng() > 0.5 ? 14 : -14)));
      const laneX = -212 + (rng() - 0.5) * 4.5;
      crowd.addHuman({
        role: rolesPool[i % rolesPool.length],
        path: { points: [[laneX, z0], [laneX + (rng() - 0.5) * 1.5, z1]] },
        speed: 0.68 + rng() * 0.42,
        phase: rng(),
      });
    } else {
      const x0 = -238 + rng() * 78;
      const x1 = Math.max(-239, Math.min(-159, x0 + (rng() > 0.5 ? 22 : -22)));
      const laneZ = 1.6 + rng() * 7.2;
      crowd.addHuman({
        role: rolesPool[i % rolesPool.length],
        path: { points: [[x0, laneZ], [x1, laneZ + (rng() - 0.5) * 2.2]] },
        speed: 0.68 + rng() * 0.42,
        phase: rng(),
      });
    }
  }

  // 城门外至桥西十千脚店沿街人流（135 人）
  for (let i = 0; i < 135; i++) {
    const x0 = -146 + rng() * 134;
    const x1 = Math.max(-148, Math.min(-10, x0 + (rng() > 0.5 ? 24 : -24)));
    const zBase0 = THREE.MathUtils.lerp(5.2, 8.8, THREE.MathUtils.clamp((x0 + 148) / 138, 0, 1));
    const zBase1 = THREE.MathUtils.lerp(5.2, 8.8, THREE.MathUtils.clamp((x1 + 148) / 138, 0, 1));
    const offsetZ = (rng() - 0.5) * 5.6;
    crowd.addHuman({
      role: rolesPool[(i + 2) % rolesPool.length],
      path: { points: [[x0, zBase0 + offsetZ], [x1, zBase1 + offsetZ * 0.8]] },
      speed: 0.72 + rng() * 0.42,
      phase: rng(),
    });
  }

  // 远景南北边界自然疏林衬托（消除人工切割边缘，融入暖褐绢雾）
  for (let i = 0; i < 36; i++) {
    const bx = -245 + (i / 35) * 500 + (rng() - 0.5) * 8;
    const bz = i % 3 === 0 ? 25 + rng() * 9 : -24 - rng() * 14;
    if (bx > -90 && bx < -55 && bz < -18) continue; // 避开汴河西北出水口
    if (rng() > 0.45) trees.addBareDeciduousTree(batcher, bx, bz, 0.9 + rng() * 0.4);
    else trees.addPollardedWillow(batcher, bx, bz, 0.9 + rng() * 0.3);
  }

  crowd.addBirdFlock(-152, 4, 10, 15, 19.5);

  // 一次性提交合并静态网格、树冠实例化网格与全部人物实例化骨骼池
  const shadowBuckets = new Set([
    'tileRoof',
    'thatchRoof',
    'woodDark',
    'woodLight',
    'woodLacquer',
    'bambooMat',
    'plasterWall',
    'earthenWall',
    'brickWall',
  ]);
  batcher.buildAndAddToScene(root, matLib.materials, shadowBuckets);
  trees.buildCanopyMeshes(root, matLib);
  crowd.buildInstancedMeshes();

  return { crowd, vessels };
}
