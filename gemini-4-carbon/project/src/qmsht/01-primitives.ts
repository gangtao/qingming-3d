import * as THREE from 'three';

/**
 * 模块一：基础零件（01-primitives.ts）
 * 包含：确定性随机数、绢本暖褐设色材质库、程序生成贴图（瓦垄、茅草、青砖、席篷、木纹、五官、柳枝、书法匾额）、
 * 静态网格按材质自动合并器（大幅降低 Draw Calls）以及常用复合几何构造器。
 */

export function createRng(seed = 11270405): () => number {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const SILK_PALETTE = {
  skySilk: 0xcbb793,
  fogSilk: 0xcbb793,
  earthBase: 0xb79e75,
  roadClay: 0xc4ad85,
  mudBank: 0x8d7552,
  waterSilt: 0x8d8162,
  tileDark: 0x554d43,
  tileMid: 0x645b4f,
  thatchStraw: 0x9b835b,
  thatchDark: 0x7e6845,
  woodAged: 0x5c432c,
  woodNatural: 0x846645,
  woodLacquer: 0x76402f, // 宋代暗朱褐（城楼、正店梁柱，绝不刺眼）
  bamboo: 0x9c8659,
  bambooRibbonRed: 0x8e4735,
  bambooRibbonGreen: 0x5f6b54,
  plasterWall: 0xd5c5a6,
  earthenWall: 0x9f8863,
  brickRampart: 0x766b5c,
  stoneBase: 0x8b8070,
  matCanopy: 0xa78f65,
  clothUmbrella: 0xc5b28e,
  clothIndigo: 0x5a6368,
  ironDark: 0x3b3631,
  skinWarm: 0xc9a982,
  hairInk: 0x2c2723,
  garments: [
    0xccb997, // 本色麻布
    0xbda783, // 浅褐布衣
    0x60696e, // 靛灰青衫
    0x755c44, // 茶褐短褐
    0x544435, // 皂褐衣袍
    0x7c806f, // 豆青灰衫
    0x875b43, // 赭褐衫子
    0x9b8c74, // 藕荷灰褐
    0x454a4d, // 铁灰直裰
    0xd4c5a8, // 素白文士衫
  ],
};

export interface MaterialLibrary {
  textures: {
    tileColor: THREE.CanvasTexture;
    tileBump: THREE.CanvasTexture;
    thatchColor: THREE.CanvasTexture;
    thatchBump: THREE.CanvasTexture;
    brickColor: THREE.CanvasTexture;
    brickBump: THREE.CanvasTexture;
    woodColor: THREE.CanvasTexture;
    matWeave: THREE.CanvasTexture;
    plaster: THREE.CanvasTexture;
    face: THREE.CanvasTexture;
    willowCanopy: THREE.CanvasTexture;
    dryTwigCanopy: THREE.CanvasTexture;
    contactShadow: THREE.CanvasTexture;
  };
  materials: Record<string, THREE.Material>;
  uTime: { value: number };
  getSignMaterial: (
    text: string,
    opts?: { vertical?: boolean; bg?: string; fg?: string; border?: string; banner?: boolean },
  ) => THREE.MeshStandardMaterial;
  dispose: () => void;
}

function setColorSpaceSRGB(tex: THREE.Texture, maxAniso: number) {
  if ('colorSpace' in tex) {
    (tex as unknown as { colorSpace: string }).colorSpace = THREE.SRGBColorSpace;
  }
  tex.anisotropy = maxAniso;
}

export function createMaterialLibrary(renderer: THREE.WebGLRenderer): MaterialLibrary {
  const maxAniso = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  const uTime = { value: 0 };
  const rng = createRng(9601127);

  // 1. 青灰筒板瓦贴图 + 凹凸贴图（表现清晰瓦垄）
  const tileColorCanvas = document.createElement('canvas');
  tileColorCanvas.width = 256;
  tileColorCanvas.height = 256;
  const tcCtx = tileColorCanvas.getContext('2d')!;

  const tileBumpCanvas = document.createElement('canvas');
  tileBumpCanvas.width = 256;
  tileBumpCanvas.height = 256;
  const tbCtx = tileBumpCanvas.getContext('2d')!;

  const cols = 16;
  const rows = 12;
  const cw = 256 / cols;
  const rh = 256 / rows;
  for (let x = 0; x < cols; x++) {
    for (let px = 0; px < cw; px++) {
      const u = px / cw;
      const ridge = Math.sin(u * Math.PI);
      const groove = Math.pow(ridge, 1.5);
      const base = Math.round(72 + groove * 34 + (rng() - 0.5) * 6);
      tcCtx.fillStyle = `rgb(${base + 6},${base + 1},${base - 6})`;
      tcCtx.fillRect(x * cw + px, 0, 1, 256);
      const bumpVal = Math.round(55 + groove * 185);
      tbCtx.fillStyle = `rgb(${bumpVal},${bumpVal},${bumpVal})`;
      tbCtx.fillRect(x * cw + px, 0, 1, 256);
    }
  }
  for (let y = 0; y < rows; y++) {
    const py = Math.floor(y * rh);
    tcCtx.fillStyle = 'rgba(32,27,22,0.46)';
    tcCtx.fillRect(0, py, 256, 2);
    tbCtx.fillStyle = 'rgb(30,30,30)';
    tbCtx.fillRect(0, py, 256, 2);
  }
  // 局部烟熏与古旧斑驳
  for (let i = 0; i < 180; i++) {
    const x = rng() * 256;
    const y = rng() * 256;
    const r = 4 + rng() * 14;
    tcCtx.fillStyle = rng() > 0.5 ? 'rgba(45,38,30,0.08)' : 'rgba(155,140,110,0.07)';
    tcCtx.beginPath();
    tcCtx.arc(x, y, r, 0, Math.PI * 2);
    tcCtx.fill();
  }
  const tileColor = new THREE.CanvasTexture(tileColorCanvas);
  tileColor.wrapS = tileColor.wrapT = THREE.RepeatWrapping;
  setColorSpaceSRGB(tileColor, maxAniso);

  const tileBump = new THREE.CanvasTexture(tileBumpCanvas);
  tileBump.wrapS = tileBump.wrapT = THREE.RepeatWrapping;
  tileBump.anisotropy = maxAniso;

  // 2. 茅草顶贴图（顺向草茎层次感）
  const thatchCanvas = document.createElement('canvas');
  thatchCanvas.width = 256;
  thatchCanvas.height = 256;
  const thCtx = thatchCanvas.getContext('2d')!;
  thCtx.fillStyle = '#967e56';
  thCtx.fillRect(0, 0, 256, 256);

  const thatchBumpCanvas = document.createElement('canvas');
  thatchBumpCanvas.width = 256;
  thatchBumpCanvas.height = 256;
  const thbCtx = thatchBumpCanvas.getContext('2d')!;
  thbCtx.fillStyle = '#808080';
  thbCtx.fillRect(0, 0, 256, 256);

  // 横向叠草层阴影
  for (let layer = 0; layer < 8; layer++) {
    const y = layer * 32;
    thCtx.fillStyle = 'rgba(58,45,28,0.28)';
    thCtx.fillRect(0, y, 256, 4);
    thbCtx.fillStyle = '#383838';
    thbCtx.fillRect(0, y, 256, 4);
  }
  // 纵向细密茅草茎秆
  for (let i = 0; i < 2200; i++) {
    const x = rng() * 256;
    const y = rng() * 256;
    const len = 12 + rng() * 26;
    const dx = (rng() - 0.5) * 3;
    const shade = Math.round(125 + (rng() - 0.5) * 55);
    thCtx.strokeStyle = `rgba(${shade + 22},${shade + 5},${shade - 26},0.55)`;
    thCtx.lineWidth = 0.8 + rng() * 1.1;
    thCtx.beginPath();
    thCtx.moveTo(x, y);
    thCtx.lineTo(x + dx, y + len);
    thCtx.stroke();

    const bv = Math.round(80 + rng() * 155);
    thbCtx.strokeStyle = `rgb(${bv},${bv},${bv})`;
    thbCtx.lineWidth = 1;
    thbCtx.beginPath();
    thbCtx.moveTo(x, y);
    thbCtx.lineTo(x + dx, y + len);
    thbCtx.stroke();
  }
  const thatchColor = new THREE.CanvasTexture(thatchCanvas);
  thatchColor.wrapS = thatchColor.wrapT = THREE.RepeatWrapping;
  setColorSpaceSRGB(thatchColor, maxAniso);

  const thatchBump = new THREE.CanvasTexture(thatchBumpCanvas);
  thatchBump.wrapS = thatchBump.wrapT = THREE.RepeatWrapping;
  thatchBump.anisotropy = maxAniso;

  // 3. 城台青砖错缝贴图
  const brickCanvas = document.createElement('canvas');
  brickCanvas.width = 256;
  brickCanvas.height = 256;
  const brCtx = brickCanvas.getContext('2d')!;
  brCtx.fillStyle = '#998c77'; // 灰缝
  brCtx.fillRect(0, 0, 256, 256);

  const brickBumpCanvas = document.createElement('canvas');
  brickBumpCanvas.width = 256;
  brickBumpCanvas.height = 256;
  const brbCtx = brickBumpCanvas.getContext('2d')!;
  brbCtx.fillStyle = '#353535';
  brbCtx.fillRect(0, 0, 256, 256);

  const bRows = 16;
  const bCols = 8;
  const bh = 256 / bRows;
  const bw = 256 / bCols;
  for (let r = 0; r < bRows; r++) {
    const offset = (r % 2) * (bw * 0.5);
    for (let c = -1; c <= bCols; c++) {
      const bx = c * bw + offset;
      const by = r * bh;
      const v = Math.round(104 + (rng() - 0.5) * 24);
      brCtx.fillStyle = `rgb(${v + 8},${v + 1},${v - 9})`;
      brCtx.fillRect(bx + 1.2, by + 1.2, bw - 2.4, bh - 2.4);
      const bv = Math.round(175 + (rng() - 0.5) * 45);
      brbCtx.fillStyle = `rgb(${bv},${bv},${bv})`;
      brbCtx.fillRect(bx + 1.2, by + 1.2, bw - 2.4, bh - 2.4);
    }
  }
  const brickColor = new THREE.CanvasTexture(brickCanvas);
  brickColor.wrapS = brickColor.wrapT = THREE.RepeatWrapping;
  setColorSpaceSRGB(brickColor, maxAniso);

  const brickBump = new THREE.CanvasTexture(brickBumpCanvas);
  brickBump.wrapS = brickBump.wrapT = THREE.RepeatWrapping;
  brickBump.anisotropy = maxAniso;

  // 4. 老旧木构纹理
  const woodCanvas = document.createElement('canvas');
  woodCanvas.width = 256;
  woodCanvas.height = 256;
  const wdCtx = woodCanvas.getContext('2d')!;
  wdCtx.fillStyle = '#7b5f42';
  wdCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 420; i++) {
    const y = rng() * 256;
    const shade = Math.round(92 + (rng() - 0.5) * 38);
    wdCtx.strokeStyle = `rgba(${shade + 20},${shade},${shade - 20},0.35)`;
    wdCtx.lineWidth = 1 + rng() * 2.2;
    wdCtx.beginPath();
    wdCtx.moveTo(0, y);
    wdCtx.bezierCurveTo(85, y + (rng() - 0.5) * 6, 170, y + (rng() - 0.5) * 6, 256, y);
    wdCtx.stroke();
  }
  const woodColor = new THREE.CanvasTexture(woodCanvas);
  woodColor.wrapS = woodColor.wrapT = THREE.RepeatWrapping;
  setColorSpaceSRGB(woodColor, maxAniso);

  // 5. 芦席编织贴图（船篷、牛车席篷、摊席）
  const matCanvas = document.createElement('canvas');
  matCanvas.width = 128;
  matCanvas.height = 128;
  const mtCtx = matCanvas.getContext('2d')!;
  mtCtx.fillStyle = '#ab9367';
  mtCtx.fillRect(0, 0, 128, 128);
  const step = 8;
  for (let y = 0; y < 128; y += step) {
    for (let x = 0; x < 128; x += step) {
      const odd = ((x / step + y / step) & 1) === 1;
      mtCtx.fillStyle = odd ? 'rgba(198,175,130,0.42)' : 'rgba(118,95,60,0.36)';
      mtCtx.fillRect(x + 0.5, y + 0.5, step - 1, step - 1);
      mtCtx.strokeStyle = 'rgba(72,56,34,0.28)';
      mtCtx.lineWidth = 0.8;
      mtCtx.strokeRect(x + 0.5, y + 0.5, step - 1, step - 1);
    }
  }
  const matWeave = new THREE.CanvasTexture(matCanvas);
  matWeave.wrapS = matWeave.wrapT = THREE.RepeatWrapping;
  setColorSpaceSRGB(matWeave, maxAniso);

  // 6. 土墙与粉墙斑驳水墨感贴图
  const plasterCanvas = document.createElement('canvas');
  plasterCanvas.width = 256;
  plasterCanvas.height = 256;
  const plCtx = plasterCanvas.getContext('2d')!;
  plCtx.fillStyle = '#d5c6a8';
  plCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 300; i++) {
    const x = rng() * 256;
    const y = rng() * 256;
    const r = 6 + rng() * 24;
    plCtx.fillStyle = rng() > 0.5 ? 'rgba(130,110,80,0.06)' : 'rgba(232,220,196,0.08)';
    plCtx.beginPath();
    plCtx.arc(x, y, r, 0, Math.PI * 2);
    plCtx.fill();
  }
  // 墙根返潮深色渐变
  const dampGrad = plCtx.createLinearGradient(0, 195, 0, 256);
  dampGrad.addColorStop(0, 'rgba(90,74,50,0)');
  dampGrad.addColorStop(1, 'rgba(82,66,44,0.28)');
  plCtx.fillStyle = dampGrad;
  plCtx.fillRect(0, 195, 256, 61);
  const plaster = new THREE.CanvasTexture(plasterCanvas);
  plaster.wrapS = plaster.wrapT = THREE.RepeatWrapping;
  setColorSpaceSRGB(plaster, maxAniso);

  // 7. 人物五官白描设色贴图（球柱面 UV 对准正前方 u=0.25 / u=0.5 兼容，我们在自定义头模把正脸对准 u=0.5）
  const faceCanvas = document.createElement('canvas');
  faceCanvas.width = 256;
  faceCanvas.height = 256;
  const fcCtx = faceCanvas.getContext('2d')!;
  fcCtx.fillStyle = '#cca982';
  fcCtx.fillRect(0, 0, 256, 256);
  // 双颊微暖红晕（极淡绢本赭红）
  fcCtx.fillStyle = 'rgba(168,104,78,0.18)';
  fcCtx.beginPath();
  fcCtx.arc(106, 138, 13, 0, Math.PI * 2);
  fcCtx.arc(150, 138, 13, 0, Math.PI * 2);
  fcCtx.fill();
  // 双眉（宋画细劲墨线）
  fcCtx.strokeStyle = '#2d241d';
  fcCtx.lineWidth = 3.2;
  fcCtx.lineCap = 'round';
  fcCtx.beginPath();
  fcCtx.moveTo(98, 108);
  fcCtx.quadraticCurveTo(108, 103, 118, 107);
  fcCtx.moveTo(138, 107);
  fcCtx.quadraticCurveTo(148, 103, 158, 108);
  fcCtx.stroke();
  // 双眼与瞳仁
  fcCtx.fillStyle = '#231c16';
  fcCtx.beginPath();
  fcCtx.ellipse(109, 120, 6.2, 3.6, 0, 0, Math.PI * 2);
  fcCtx.ellipse(147, 120, 6.2, 3.6, 0, 0, Math.PI * 2);
  fcCtx.fill();
  // 鼻梁与鼻翼淡墨线
  fcCtx.strokeStyle = 'rgba(72,52,36,0.72)';
  fcCtx.lineWidth = 2.2;
  fcCtx.beginPath();
  fcCtx.moveTo(128, 116);
  fcCtx.lineTo(128, 142);
  fcCtx.moveTo(121, 143);
  fcCtx.quadraticCurveTo(128, 147, 135, 143);
  fcCtx.stroke();
  // 唇与胡须微痕
  fcCtx.strokeStyle = '#6c3e31';
  fcCtx.lineWidth = 2.8;
  fcCtx.beginPath();
  fcCtx.moveTo(118, 160);
  fcCtx.quadraticCurveTo(128, 164, 138, 160);
  fcCtx.stroke();
  const face = new THREE.CanvasTexture(faceCanvas);
  setColorSpaceSRGB(face, maxAniso);

  // 8. 早春老柳稀疏细枝嫩芽贴图（扇形放射柔弧墨丝 + 稀疏鹅黄柳眼，四周严格留白渐隐绝无矩形硬边！）
  const willowCanvas = document.createElement('canvas');
  willowCanvas.width = 256;
  willowCanvas.height = 256;
  const wlCtx = willowCanvas.getContext('2d')!;
  wlCtx.clearRect(0, 0, 256, 256);
  wlCtx.lineCap = 'round';

  for (let i = 0; i < 48; i++) {
    const u = i / 47 - 0.5; // -0.5 .. +0.5
    const startX = 128 + u * 22 + (rng() - 0.5) * 8;
    const startY = 216 + (rng() - 0.5) * 10;
    const angle = u * 2.15 + (rng() - 0.5) * 0.16; // 扇形张角约 ±62°
    const radius = 142 + rng() * 44; // 最远约 186，保证落在 [26..230, 22..226] 安全区内
    const endX = THREE.MathUtils.clamp(128 + Math.sin(angle) * radius * 0.62, 24, 232);
    const endY = THREE.MathUtils.clamp(216 - Math.cos(angle * 0.72) * radius + Math.abs(u) * 28, 22, 206);
    const ctrlX = 128 + Math.sin(angle) * radius * 0.34;
    const ctrlY = startY - radius * 0.58;

    // 分两段绘制由粗渐细的柔韧柳丝
    const midX = 0.25 * startX + 0.5 * ctrlX + 0.25 * endX;
    const midY = 0.25 * startY + 0.5 * ctrlY + 0.25 * endY;

    wlCtx.strokeStyle = `rgba(60,48,34,${(0.84 + rng() * 0.14).toFixed(2)})`;
    wlCtx.lineWidth = 2.1 + rng() * 1.0;
    wlCtx.beginPath();
    wlCtx.moveTo(startX, startY);
    wlCtx.quadraticCurveTo((startX + ctrlX) * 0.5, (startY + ctrlY) * 0.5, midX, midY);
    wlCtx.stroke();

    wlCtx.strokeStyle = `rgba(68,54,38,${(0.76 + rng() * 0.18).toFixed(2)})`;
    wlCtx.lineWidth = 1.25 + rng() * 0.75;
    wlCtx.beginPath();
    wlCtx.moveTo(midX, midY);
    wlCtx.quadraticCurveTo((ctrlX + endX) * 0.5, (ctrlY + endY) * 0.5, endX, endY);
    wlCtx.stroke();

    // 早春稀疏鹅黄灰绿芽点（仅点缀在中上段细梢，保持通透疏朗）
    const buds = 5 + Math.floor(rng() * 5);
    for (let b = 1; b <= buds; b++) {
      const t = 0.20 + (b / (buds + 1)) * 0.74;
      const bx = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * ctrlX + t * t * endX;
      const by = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * ctrlY + t * t * endY;
      wlCtx.fillStyle = rng() > 0.38 ? 'rgba(132,128,84,0.92)' : 'rgba(150,138,90,0.88)';
      wlCtx.beginPath();
      wlCtx.ellipse(bx + (rng() - 0.5) * 2.5, by, 2.8, 1.55, rng() * Math.PI, 0, Math.PI * 2);
      wlCtx.fill();
    }
  }
  // 边缘径向与根部柔和遮罩，使细枝从木质柳头自然生发、绝无方框或黑团感
  wlCtx.globalCompositeOperation = 'destination-in';
  const wlMask = wlCtx.createRadialGradient(128, 118, 62, 128, 118, 118);
  wlMask.addColorStop(0, 'rgba(0,0,0,1)');
  wlMask.addColorStop(0.84, 'rgba(0,0,0,0.96)');
  wlMask.addColorStop(1, 'rgba(0,0,0,0)');
  wlCtx.fillStyle = wlMask;
  wlCtx.fillRect(0, 0, 256, 256);

  const stemFade = wlCtx.createLinearGradient(0, 194, 0, 228);
  stemFade.addColorStop(0, 'rgba(0,0,0,1)');
  stemFade.addColorStop(1, 'rgba(0,0,0,0)');
  wlCtx.fillStyle = stemFade;
  wlCtx.fillRect(0, 194, 256, 62);
  wlCtx.globalCompositeOperation = 'source-over';

  const willowCanopy = new THREE.CanvasTexture(willowCanvas);
  setColorSpaceSRGB(willowCanopy, maxAniso);

  // 9. 枯枝杂树贴图（宋画蟹爪寒林墨枝质感，同样严格内缩防方框硬边）
  const twigCanvas = document.createElement('canvas');
  twigCanvas.width = 256;
  twigCanvas.height = 256;
  const twCtx = twigCanvas.getContext('2d')!;
  twCtx.clearRect(0, 0, 256, 256);

  function drawBranch(x: number, y: number, len: number, angle: number, depth: number, width: number) {
    if (depth <= 0 || len < 4.5) return;
    const nx = THREE.MathUtils.clamp(x + Math.sin(angle) * len, 20, 236);
    const ny = THREE.MathUtils.clamp(y - Math.cos(angle) * len, 20, 234);
    twCtx.strokeStyle = `rgba(54,43,31,${(0.68 + depth * 0.06).toFixed(2)})`;
    twCtx.lineWidth = width;
    twCtx.lineCap = 'round';
    twCtx.beginPath();
    twCtx.moveTo(x, y);
    twCtx.quadraticCurveTo(
      (x + nx) * 0.5 + (rng() - 0.5) * 4,
      (y + ny) * 0.5 - rng() * 3,
      nx,
      ny,
    );
    twCtx.stroke();
    const subCount = depth > 3 ? 2 : 3;
    for (let s = 0; s < subCount; s++) {
      const da = (s - (subCount - 1) * 0.5) * (0.50 + rng() * 0.24) + (rng() - 0.5) * 0.18;
      drawBranch(nx, ny, len * (0.62 + rng() * 0.13), angle + da, depth - 1, Math.max(0.75, width * 0.66));
    }
  }
  drawBranch(128, 222, 46, -0.06, 5, 3.6);
  drawBranch(128, 222, 40, 0.30, 4, 3.0);
  drawBranch(128, 222, 38, -0.34, 4, 2.9);

  twCtx.globalCompositeOperation = 'destination-in';
  const twMask = twCtx.createRadialGradient(128, 128, 66, 128, 128, 120);
  twMask.addColorStop(0, 'rgba(0,0,0,1)');
  twMask.addColorStop(0.84, 'rgba(0,0,0,0.95)');
  twMask.addColorStop(1, 'rgba(0,0,0,0)');
  twCtx.fillStyle = twMask;
  twCtx.fillRect(0, 0, 256, 256);
  twCtx.globalCompositeOperation = 'source-over';

  const dryTwigCanopy = new THREE.CanvasTexture(twigCanvas);
  setColorSpaceSRGB(dryTwigCanopy, maxAniso);

  // 9b. 苍古纵裂老柳树皮贴图（灰褐皲裂皴擦质感）
  const willowBarkCanvas = document.createElement('canvas');
  willowBarkCanvas.width = 256;
  willowBarkCanvas.height = 256;
  const wbCtx = willowBarkCanvas.getContext('2d')!;
  wbCtx.fillStyle = '#8b7960';
  wbCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 520; i++) {
    const x = rng() * 256;
    const y = rng() * 256;
    const h = 18 + rng() * 52;
    const dark = rng() > 0.35;
    wbCtx.strokeStyle = dark ? 'rgba(48,38,27,0.42)' : 'rgba(176,158,128,0.30)';
    wbCtx.lineWidth = dark ? 1.2 + rng() * 2.4 : 1.0 + rng() * 1.6;
    wbCtx.beginPath();
    wbCtx.moveTo(x, y);
    wbCtx.bezierCurveTo(
      x + (rng() - 0.5) * 10,
      y + h * 0.35,
      x + (rng() - 0.5) * 10,
      y + h * 0.7,
      x + (rng() - 0.5) * 6,
      y + h,
    );
    wbCtx.stroke();
  }
  for (let k = 0; k < 14; k++) {
    const kx = rng() * 256;
    const ky = rng() * 256;
    wbCtx.strokeStyle = 'rgba(42,32,22,0.45)';
    wbCtx.lineWidth = 2.0;
    wbCtx.beginPath();
    wbCtx.ellipse(kx, ky, 5 + rng() * 6, 8 + rng() * 9, (rng() - 0.5) * 0.5, 0, Math.PI * 2);
    wbCtx.stroke();
  }
  const willowBarkTex = new THREE.CanvasTexture(willowBarkCanvas);
  willowBarkTex.wrapS = willowBarkTex.wrapT = THREE.RepeatWrapping;
  setColorSpaceSRGB(willowBarkTex, maxAniso);

  // 10. 柔和落地接触阴影贴图
  const shCanvas = document.createElement('canvas');
  shCanvas.width = 64;
  shCanvas.height = 64;
  const shCtx = shCanvas.getContext('2d')!;
  const shGrad = shCtx.createRadialGradient(32, 32, 4, 32, 32, 30);
  shGrad.addColorStop(0, 'rgba(42,32,20,0.46)');
  shGrad.addColorStop(0.55, 'rgba(42,32,20,0.20)');
  shGrad.addColorStop(1, 'rgba(42,32,20,0)');
  shCtx.fillStyle = shGrad;
  shCtx.fillRect(0, 0, 64, 64);
  const contactShadow = new THREE.CanvasTexture(shCanvas);

  // 构建统一 PBR 材质池（相邻构件保持不同粗糙度与金属度对比）
  const tileRoof = new THREE.MeshStandardMaterial({
    color: 0xa69b8a,
    map: tileColor,
    bumpMap: tileBump,
    bumpScale: 0.08,
    roughness: 0.78,
    metalness: 0.04,
  });

  const tileRidge = new THREE.MeshStandardMaterial({
    color: SILK_PALETTE.tileDark,
    roughness: 0.52,
    metalness: 0.12,
  });

  const thatchRoof = new THREE.MeshStandardMaterial({
    color: 0xd8c6a3,
    map: thatchColor,
    bumpMap: thatchBump,
    bumpScale: 0.11,
    roughness: 0.95,
    metalness: 0.0,
  });

  const woodDark = new THREE.MeshStandardMaterial({
    color: 0x8b6c4e,
    map: woodColor,
    roughness: 0.74,
    metalness: 0.03,
  });

  const woodLight = new THREE.MeshStandardMaterial({
    color: 0xb89870,
    map: woodColor,
    roughness: 0.68,
    metalness: 0.02,
  });

  const woodLacquer = new THREE.MeshStandardMaterial({
    color: SILK_PALETTE.woodLacquer,
    map: woodColor,
    roughness: 0.44,
    metalness: 0.08,
  });

  const bambooMat = new THREE.MeshStandardMaterial({
    color: SILK_PALETTE.bamboo,
    roughness: 0.56,
    metalness: 0.04,
  });

  const ribbonRed = new THREE.MeshStandardMaterial({
    color: SILK_PALETTE.bambooRibbonRed,
    roughness: 0.82,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  const ribbonGreen = new THREE.MeshStandardMaterial({
    color: SILK_PALETTE.bambooRibbonGreen,
    roughness: 0.82,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  const plasterWall = new THREE.MeshStandardMaterial({
    color: 0xe6dac2,
    map: plaster,
    roughness: 0.88,
    metalness: 0.0,
  });

  const earthenWall = new THREE.MeshStandardMaterial({
    color: 0xb79f79,
    map: plaster,
    roughness: 0.94,
    metalness: 0.0,
  });

  const brickWall = new THREE.MeshStandardMaterial({
    color: 0xbcb09d,
    map: brickColor,
    bumpMap: brickBump,
    bumpScale: 0.07,
    roughness: 0.84,
    metalness: 0.03,
  });

  const stonePodium = new THREE.MeshStandardMaterial({
    color: SILK_PALETTE.stoneBase,
    map: brickBump,
    bumpMap: brickBump,
    bumpScale: 0.03,
    roughness: 0.82,
    metalness: 0.05,
  });

  const wovenMat = new THREE.MeshStandardMaterial({
    color: 0xcab48c,
    map: matWeave,
    bumpMap: matWeave,
    bumpScale: 0.04,
    roughness: 0.86,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  const umbrellaCloth = new THREE.MeshStandardMaterial({
    color: SILK_PALETTE.clothUmbrella,
    roughness: 0.76,
    metalness: 0.01,
    side: THREE.DoubleSide,
  });

  const ironFitting = new THREE.MeshStandardMaterial({
    color: SILK_PALETTE.ironDark,
    roughness: 0.42,
    metalness: 0.62,
  });

  const barkTrunk = new THREE.MeshStandardMaterial({
    color: 0x7d684f,
    map: willowBarkTex,
    bumpMap: willowBarkTex,
    bumpScale: 0.08,
    roughness: 0.93,
    metalness: 0.0,
  });

  // 随风轻摆的早春柳条材质（GPU 顶点摇曳，无透明排序开销）
  const willowFoliage = new THREE.MeshStandardMaterial({
    map: willowCanopy,
    alphaTest: 0.12,
    side: THREE.DoubleSide,
    roughness: 0.88,
    metalness: 0.0,
  });
  willowFoliage.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uTime;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vec4 wp = vec4(transformed, 1.0);
         #ifdef USE_INSTANCING
           wp = instanceMatrix * wp;
         #endif
         float swayMask = clamp(uv.y, 0.0, 1.0);
         float wave = sin(uTime * 1.45 + wp.x * 0.45 + wp.z * 0.35) * 0.14 * swayMask;
         transformed.x += wave;
         transformed.z += cos(uTime * 1.15 + wp.x * 0.3) * 0.08 * swayMask;`,
      );
  };

  const dryTwigMat = new THREE.MeshStandardMaterial({
    map: dryTwigCanopy,
    alphaTest: 0.16,
    side: THREE.DoubleSide,
    roughness: 0.9,
    metalness: 0.0,
  });

  const materials: Record<string, THREE.Material> = {
    tileRoof,
    tileRidge,
    thatchRoof,
    woodDark,
    woodLight,
    woodLacquer,
    bambooMat,
    ribbonRed,
    ribbonGreen,
    plasterWall,
    earthenWall,
    brickWall,
    stonePodium,
    wovenMat,
    umbrellaCloth,
    ironFitting,
    barkTrunk,
    willowFoliage,
    dryTwigMat,
  };

  const signCache = new Map<string, THREE.MeshStandardMaterial>();
  const extraTextures: THREE.Texture[] = [willowBarkTex];

  function getSignMaterial(
    text: string,
    opts: { vertical?: boolean; bg?: string; fg?: string; border?: string; banner?: boolean } = {},
  ): THREE.MeshStandardMaterial {
    const key = `${text}|${opts.vertical ? 'v' : 'h'}|${opts.bg || ''}|${opts.fg || ''}|${opts.banner ? 'b' : 'p'}`;
    const existing = signCache.get(key);
    if (existing) return existing;

    const vertical = opts.vertical ?? true;
    const canvas = document.createElement('canvas');
    canvas.width = vertical ? 128 : 256;
    canvas.height = vertical ? 320 : 96;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = opts.bg || (opts.banner ? '#cbb68e' : '#3a2c20');
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = opts.border || (opts.banner ? '#7f4332' : '#baa070');
    ctx.lineWidth = 6;
    ctx.strokeRect(7, 7, canvas.width - 14, canvas.height - 14);

    ctx.fillStyle = opts.fg || (opts.banner ? '#3b2c20' : '#dec799');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const chars = Array.from(text);
    if (vertical) {
      const fontSize = Math.min(54, Math.floor((canvas.height - 44) / Math.max(chars.length, 1) * 0.86));
      ctx.font = `700 ${fontSize}px "QmshtKaiti", "KaiTi", "STKaiti", serif`;
      const stepY = (canvas.height - 44) / Math.max(chars.length, 1);
      chars.forEach((ch, idx) => {
        ctx.fillText(ch, canvas.width / 2, 22 + stepY * (idx + 0.5));
      });
    } else {
      const fontSize = Math.min(48, Math.floor((canvas.width - 36) / Math.max(chars.length, 1) * 0.88));
      ctx.font = `700 ${fontSize}px "QmshtKaiti", "KaiTi", "STKaiti", serif`;
      ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 2);
    }

    const tex = new THREE.CanvasTexture(canvas);
    setColorSpaceSRGB(tex, maxAniso);
    extraTextures.push(tex);

    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: opts.banner ? 0.85 : 0.48,
      metalness: opts.banner ? 0.0 : 0.14,
      side: THREE.DoubleSide,
    });
    if (opts.banner) {
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = uTime;
        shader.vertexShader = shader.vertexShader
          .replace('#include <common>', '#include <common>\nuniform float uTime;')
          .replace(
            '#include <begin_vertex>',
            `#include <begin_vertex>
             vec4 wp = modelMatrix * vec4(transformed, 1.0);
             float hang = clamp(1.0 - uv.y, 0.0, 1.0);
             transformed.z += sin(uTime * 2.6 + wp.x * 0.7 + uv.y * 4.0) * 0.09 * hang;
             transformed.x += cos(uTime * 1.9 + wp.z * 0.6) * 0.03 * hang;`,
          );
      };
    }

    signCache.set(key, mat);
    return mat;
  }

  return {
    textures: {
      tileColor,
      tileBump,
      thatchColor,
      thatchBump,
      brickColor,
      brickBump,
      woodColor,
      matWeave,
      plaster,
      face,
      willowCanopy,
      dryTwigCanopy,
      contactShadow,
    },
    materials,
    uTime,
    getSignMaterial,
    dispose() {
      Object.values(this.textures).forEach((t) => t.dispose());
      extraTextures.forEach((t) => t.dispose());
      Object.values(materials).forEach((m) => m.dispose());
      signCache.forEach((m) => m.dispose());
    },
  };
}

/**
 * 静态几何体批量合并器：
 * 将各段上千个建筑木构、瓦垄、栏杆、欢门竹竿、桥拱、摊位按材质合并成极少数静态网格，大幅降低绘制调用。
 */
export class StaticGeometryBatcher {
  private buckets = new Map<string, THREE.BufferGeometry[]>();

  public add(materialKey: string, geometry: THREE.BufferGeometry, matrix?: THREE.Matrix4, uvScale?: [number, number]) {
    const g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    if (!g.attributes.normal) {
      g.computeVertexNormals();
    }
    if (!g.attributes.uv) {
      const count = g.attributes.position.count;
      g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
    } else if (uvScale) {
      const uv = g.attributes.uv as THREE.BufferAttribute;
      for (let i = 0; i < uv.count; i++) {
        uv.setXY(i, uv.getX(i) * uvScale[0], uv.getY(i) * uvScale[1]);
      }
    }
    // 清理多余属性以保证合并一致
    for (const attrName of Object.keys(g.attributes)) {
      if (attrName !== 'position' && attrName !== 'normal' && attrName !== 'uv') {
        g.deleteAttribute(attrName);
      }
    }
    if (matrix) {
      g.applyMatrix4(matrix);
    }
    let arr = this.buckets.get(materialKey);
    if (!arr) {
      arr = [];
      this.buckets.set(materialKey, arr);
    }
    arr.push(g);
  }

  public addBox(
    materialKey: string,
    w: number,
    h: number,
    d: number,
    matrix: THREE.Matrix4,
    uvScale?: [number, number],
  ) {
    const box = new THREE.BoxGeometry(w, h, d);
    this.add(materialKey, box, matrix, uvScale);
    box.dispose();
  }

  public addCylinder(
    materialKey: string,
    rt: number,
    rb: number,
    h: number,
    segs: number,
    matrix: THREE.Matrix4,
    uvScale?: [number, number],
  ) {
    const cyl = new THREE.CylinderGeometry(rt, rb, h, segs);
    this.add(materialKey, cyl, matrix, uvScale);
    cyl.dispose();
  }

  public buildAndAddToScene(
    parent: THREE.Object3D,
    materials: Record<string, THREE.Material>,
    castShadowBuckets: Set<string>,
  ): THREE.Mesh[] {
    const created: THREE.Mesh[] = [];
    for (const [matKey, list] of this.buckets.entries()) {
      if (list.length === 0) continue;
      const mat = materials[matKey];
      if (!mat) continue;

      let totalVerts = 0;
      for (const g of list) {
        totalVerts += g.attributes.position.count;
      }
      const posArr = new Float32Array(totalVerts * 3);
      const normArr = new Float32Array(totalVerts * 3);
      const uvArr = new Float32Array(totalVerts * 2);

      let offset = 0;
      for (const g of list) {
        const p = g.attributes.position.array as Float32Array;
        const n = g.attributes.normal.array as Float32Array;
        const u = g.attributes.uv.array as Float32Array;
        posArr.set(p, offset * 3);
        normArr.set(n, offset * 3);
        uvArr.set(u, offset * 2);
        offset += g.attributes.position.count;
        g.dispose();
      }

      const merged = new THREE.BufferGeometry();
      merged.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
      merged.setAttribute('normal', new THREE.BufferAttribute(normArr, 3));
      merged.setAttribute('uv', new THREE.BufferAttribute(uvArr, 2));
      merged.computeBoundingSphere();

      const mesh = new THREE.Mesh(merged, mat);
      mesh.castShadow = castShadowBuckets.has(matKey);
      mesh.receiveShadow = true;
      parent.add(mesh);
      created.push(mesh);
    }
    this.buckets.clear();
    return created;
  }
}

/**
 * 将多个局部几何体直接合并为一个独立 BufferGeometry（用于船体、车轮、人物关节构件复用）
 */
export function mergePartGeometries(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const nonIndexed = parts.map((g) => {
    const c = g.index ? g.toNonIndexed() : g.clone();
    if (!c.attributes.normal) c.computeVertexNormals();
    if (!c.attributes.uv) {
      c.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(c.attributes.position.count * 2), 2));
    }
    return c;
  });
  let total = 0;
  for (const g of nonIndexed) total += g.attributes.position.count;
  const pos = new Float32Array(total * 3);
  const norm = new Float32Array(total * 3);
  const uv = new Float32Array(total * 2);
  let off = 0;
  for (const g of nonIndexed) {
    pos.set(g.attributes.position.array as Float32Array, off * 3);
    norm.set(g.attributes.normal.array as Float32Array, off * 3);
    uv.set(g.attributes.uv.array as Float32Array, off * 2);
    off += g.attributes.position.count;
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(norm, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.computeBoundingSphere();
  return out;
}

/**
 * 零外部依赖程序化柔和摄影棚环境反射场景（兼容任意 Three.js 版本生成 PMREM 环境光）
 */
export function buildSilkStudioEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0xcfbda0);

  const skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(20, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xe6d6b8, side: THREE.BackSide }),
  );
  envScene.add(skyDome);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(20, 20),
    new THREE.MeshBasicMaterial({ color: 0x8d7655 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -2;
  envScene.add(ground);

  const warmPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 8),
    new THREE.MeshBasicMaterial({ color: 0xfff1d4, side: THREE.DoubleSide }),
  );
  warmPanel.position.set(8, 10, 8);
  warmPanel.lookAt(0, 0, 0);
  envScene.add(warmPanel);

  const coolFill = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 8),
    new THREE.MeshBasicMaterial({ color: 0xd0d4cf, side: THREE.DoubleSide }),
  );
  coolFill.position.set(-9, 8, -7);
  coolFill.lookAt(0, 0, 0);
  envScene.add(coolFill);

  const tex = pmrem.fromScene(envScene, 0.05).texture;
  pmrem.dispose();
  skyDome.geometry.dispose();
  (skyDome.material as THREE.Material).dispose();
  ground.geometry.dispose();
  (ground.material as THREE.Material).dispose();
  warmPanel.geometry.dispose();
  (warmPanel.material as THREE.Material).dispose();
  coolFill.geometry.dispose();
  (coolFill.material as THREE.Material).dispose();
  return tex;
}
