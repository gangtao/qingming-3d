import * as THREE from 'three';

export interface MaterialLibrary {
  silkBgColor: number;
  maxAnisotropy: number;
  ground: THREE.MeshStandardMaterial;
  road: THREE.MeshStandardMaterial;
  riverBank: THREE.MeshStandardMaterial;
  water: THREE.MeshStandardMaterial;
  tileRoof: THREE.MeshStandardMaterial;
  ridgeTile: THREE.MeshStandardMaterial;
  thatch: THREE.MeshStandardMaterial;
  plasterWall: THREE.MeshStandardMaterial;
  brickWall: THREE.MeshStandardMaterial;
  timberDark: THREE.MeshStandardMaterial;
  timberWarm: THREE.MeshStandardMaterial;
  timberBridge: THREE.MeshStandardMaterial;
  bambooMat: THREE.MeshStandardMaterial;
  latticeWindow: THREE.MeshStandardMaterial;
  stoneBase: THREE.MeshStandardMaterial;
  bark: THREE.MeshStandardMaterial;
  willowFoliage: THREE.MeshStandardMaterial;
  clothVermilion: THREE.MeshStandardMaterial;
  clothIndigo: THREE.MeshStandardMaterial;
  clothOchre: THREE.MeshStandardMaterial;
  clothUmbrella: THREE.MeshStandardMaterial;
  hullWood: THREE.MeshStandardMaterial;
  ropeMat: THREE.MeshStandardMaterial;
  contactShadow: THREE.MeshBasicMaterial;
  smokeTex: THREE.CanvasTexture;
  makeSignMaterial: (
    text: string,
    opts?: {
      vertical?: boolean;
      bg?: string;
      fg?: string;
      border?: string;
      width?: number;
      height?: number;
    }
  ) => THREE.MeshStandardMaterial;
  updateWaterTime: (t: number) => void;
  updateWindTime: (t: number) => void;
  dispose: () => void;
}

function seededRand(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  return [c, ctx];
}

function configureTexture(
  canvas: HTMLCanvasElement,
  isColor: boolean,
  anisotropy: number,
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

function createSilkLoamTexture(
  baseHex: string,
  grainHex: string,
  speckHex: string,
  anisotropy: number,
  repeat = 12
): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  const [c, ctx] = makeCanvas(512, 512);
  const [bc, bctx] = makeCanvas(256, 256);
  const rand = seededRand(1087);

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 512, 512);
  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, 256, 256);

  // Subtle woven silk cross-hatch + ink wash mottling
  ctx.strokeStyle = grainHex;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 512; i += 4) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  for (let i = 0; i < 900; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const r = 1 + rand() * 6;
    ctx.globalAlpha = 0.04 + rand() * 0.08;
    ctx.fillStyle = rand() > 0.5 ? speckHex : grainHex;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.4, r * 0.8, rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();

    bctx.globalAlpha = 0.08 + rand() * 0.12;
    bctx.fillStyle = rand() > 0.5 ? '#9c9c9c' : '#646464';
    bctx.beginPath();
    bctx.arc((x * 0.5) | 0, (y * 0.5) | 0, Math.max(1, r * 0.4), 0, Math.PI * 2);
    bctx.fill();
  }
  ctx.globalAlpha = 1;
  bctx.globalAlpha = 1;

  return {
    map: configureTexture(c, true, anisotropy, repeat, repeat),
    bump: configureTexture(bc, false, anisotropy, repeat, repeat),
  };
}

function createRoadTexture(anisotropy: number): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(512, 256);
  const rand = seededRand(2049);
  ctx.fillStyle = '#b4986d';
  ctx.fillRect(0, 0, 512, 256);

  // Subtle longitudinal cart wheel tracks & packed earth texture
  for (let y = 0; y < 256; y += 2) {
    const edgeFade = Math.abs(y - 128) / 128;
    ctx.fillStyle = edgeFade > 0.72 ? '#9d835b' : '#b79c72';
    ctx.globalAlpha = 0.25;
    ctx.fillRect(0, y, 512, 2);
  }
  ctx.strokeStyle = '#7e6645';
  ctx.globalAlpha = 0.16;
  ctx.lineWidth = 4;
  [84, 118, 146, 174].forEach((ry) => {
    ctx.beginPath();
    ctx.moveTo(0, ry);
    ctx.bezierCurveTo(170, ry + 3, 340, ry - 3, 512, ry);
    ctx.stroke();
  });
  for (let i = 0; i < 650; i++) {
    ctx.globalAlpha = 0.06 + rand() * 0.1;
    ctx.fillStyle = rand() > 0.5 ? '#876e4b' : '#c8b087';
    ctx.fillRect(rand() * 512, rand() * 256, 2 + rand() * 5, 1 + rand() * 3);
  }
  ctx.globalAlpha = 1;
  return configureTexture(c, true, anisotropy, 1, 1);
}

function createRoofTileTextures(anisotropy: number): {
  map: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
} {
  const [c, ctx] = makeCanvas(256, 256);
  const [bc, bctx] = makeCanvas(256, 256);
  const rand = seededRand(311);

  ctx.fillStyle = '#4e453b';
  ctx.fillRect(0, 0, 256, 256);
  bctx.fillStyle = '#606060';
  bctx.fillRect(0, 0, 256, 256);

  const cols = 16;
  const colW = 256 / cols;
  for (let i = 0; i < cols; i++) {
    const x = i * colW;
    const g = ctx.createLinearGradient(x, 0, x + colW, 0);
    g.addColorStop(0, '#363029');
    g.addColorStop(0.35, '#594f44');
    g.addColorStop(0.65, '#64594d');
    g.addColorStop(1, '#363029');
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, colW, 256);

    const bg = bctx.createLinearGradient(x, 0, x + colW, 0);
    bg.addColorStop(0, '#303030');
    bg.addColorStop(0.5, '#d8d8d8');
    bg.addColorStop(1, '#303030');
    bctx.fillStyle = bg;
    bctx.fillRect(x, 0, colW, 256);
  }

  // Horizontal overlapping tile courses
  const rows = 12;
  const rowH = 256 / rows;
  for (let r = 0; r < rows; r++) {
    const y = r * rowH;
    ctx.fillStyle = 'rgba(28,24,20,0.45)';
    ctx.fillRect(0, y, 256, 2.5);
    bctx.fillStyle = '#202020';
    bctx.fillRect(0, y, 256, 2);
  }

  for (let i = 0; i < 300; i++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(130,115,96,0.12)' : 'rgba(30,26,22,0.14)';
    ctx.fillRect(rand() * 256, rand() * 256, 4 + rand() * 6, 3 + rand() * 8);
  }

  return {
    map: configureTexture(c, true, anisotropy, 2, 2),
    bump: configureTexture(bc, false, anisotropy, 2, 2),
  };
}

function createThatchTextures(anisotropy: number): {
  map: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
} {
  const [c, ctx] = makeCanvas(256, 256);
  const [bc, bctx] = makeCanvas(256, 256);
  const rand = seededRand(409);

  ctx.fillStyle = '#927b55';
  ctx.fillRect(0, 0, 256, 256);
  bctx.fillStyle = '#707070';
  bctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 900; i++) {
    const x = rand() * 256;
    const y = rand() * 256;
    const len = 14 + rand() * 26;
    const dx = (rand() - 0.5) * 4;
    ctx.strokeStyle = rand() > 0.45 ? '#a99168' : '#6f5b3d';
    ctx.globalAlpha = 0.45 + rand() * 0.4;
    ctx.lineWidth = 1 + rand() * 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx, y + len);
    ctx.stroke();

    bctx.strokeStyle = rand() > 0.5 ? '#c4c4c4' : '#424242';
    bctx.globalAlpha = 0.55;
    bctx.lineWidth = 1.2;
    bctx.beginPath();
    bctx.moveTo(x, y);
    bctx.lineTo(x + dx, y + len);
    bctx.stroke();
  }
  ctx.globalAlpha = 1;
  bctx.globalAlpha = 1;

  return {
    map: configureTexture(c, true, anisotropy, 2, 2),
    bump: configureTexture(bc, false, anisotropy, 2, 2),
  };
}

function createBrickTextures(anisotropy: number): {
  map: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
} {
  const [c, ctx] = makeCanvas(256, 256);
  const [bc, bctx] = makeCanvas(256, 256);
  const rand = seededRand(503);

  ctx.fillStyle = '#7f7262';
  ctx.fillRect(0, 0, 256, 256);
  bctx.fillStyle = '#505050';
  bctx.fillRect(0, 0, 256, 256);

  const rows = 16;
  const cols = 8;
  const rowH = 256 / rows;
  const colW = 256 / cols;

  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (colW * 0.5);
    for (let k = -1; k <= cols; k++) {
      const bx = k * colW + offset;
      const by = r * rowH;
      const shade = Math.floor((rand() - 0.5) * 22);
      ctx.fillStyle = `rgb(${118 + shade},${106 + shade},${92 + shade})`;
      ctx.fillRect(bx + 1.5, by + 1.5, colW - 3, rowH - 3);
      bctx.fillStyle = `rgb(${155 + shade},${155 + shade},${155 + shade})`;
      bctx.fillRect(bx + 1.5, by + 1.5, colW - 3, rowH - 3);
    }
  }

  return {
    map: configureTexture(c, true, anisotropy, 3, 2),
    bump: configureTexture(bc, false, anisotropy, 3, 2),
  };
}

function createLatticeTexture(anisotropy: number): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(256, 256);
  // Warm oiled paper backing behind dark Song timber lattice
  ctx.fillStyle = '#c8b48e';
  ctx.fillRect(0, 0, 256, 256);

  // Subtle warm interior depth gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, 'rgba(65,48,34,0.35)');
  grad.addColorStop(1, 'rgba(120,96,68,0.12)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#4f3a28';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, 246, 246);

  ctx.lineWidth = 5;
  for (let i = 1; i < 6; i++) {
    const p = (i * 256) / 6;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, 256);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(256, p);
    ctx.stroke();
  }
  return configureTexture(c, true, anisotropy, 1, 1);
}

function createWoodTexture(baseHex: string, darkHex: string, anisotropy: number): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(256, 256);
  const rand = seededRand(773);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = darkHex;
  for (let i = 0; i < 70; i++) {
    const x = rand() * 256;
    ctx.globalAlpha = 0.08 + rand() * 0.16;
    ctx.lineWidth = 1 + rand() * 2.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + (rand() - 0.5) * 8, 85, x + (rand() - 0.5) * 8, 170, x, 256);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return configureTexture(c, true, anisotropy, 1, 1);
}

function createBambooMatTexture(anisotropy: number): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(256, 256);
  const rand = seededRand(881);
  ctx.fillStyle = '#977e57';
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 8) {
    ctx.fillStyle = y % 16 === 0 ? '#7d6644' : '#aa9169';
    ctx.fillRect(0, y, 256, 4);
  }
  for (let x = 0; x < 256; x += 24) {
    ctx.fillStyle = 'rgba(58,45,30,0.28)';
    ctx.fillRect(x, 0, 3, 256);
  }
  for (let i = 0; i < 200; i++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(60,46,30,0.12)' : 'rgba(200,178,136,0.12)';
    ctx.fillRect(rand() * 256, rand() * 256, 8, 3);
  }
  return configureTexture(c, true, anisotropy, 2, 2);
}

function createWaterTexture(anisotropy: number): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(512, 256);
  const rand = seededRand(997);
  ctx.fillStyle = '#8b7b5b';
  ctx.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 280; i++) {
    const x = rand() * 512;
    const y = rand() * 256;
    const w = 18 + rand() * 52;
    ctx.strokeStyle = rand() > 0.45 ? 'rgba(182,165,130,0.22)' : 'rgba(92,80,58,0.24)';
    ctx.lineWidth = 1.2 + rand() * 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + w * 0.5, y + (rand() - 0.5) * 4, x + w, y);
    ctx.stroke();
  }
  return configureTexture(c, true, anisotropy, 16, 4);
}

function createRadialTexture(inner: string, mid: string, outer: string, size = 128): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(0.55, mid);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createMaterialLibrary(renderer: THREE.WebGLRenderer): MaterialLibrary {
  const maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy() || 1);
  const textures: THREE.Texture[] = [];
  const materials: THREE.Material[] = [];

  const trackTex = <T extends THREE.Texture>(t: T): T => {
    textures.push(t);
    return t;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  const loam = createSilkLoamTexture('#ae9369', '#8a714d', '#c5ad84', maxAnisotropy, 28);
  trackTex(loam.map);
  trackTex(loam.bump);

  const bankLoam = createSilkLoamTexture('#957b56', '#725d3f', '#a88d65', maxAnisotropy, 16);
  trackTex(bankLoam.map);
  trackTex(bankLoam.bump);

  const roadTex = trackTex(createRoadTexture(maxAnisotropy));
  roadTex.repeat.set(36, 1);

  const roof = createRoofTileTextures(maxAnisotropy);
  trackTex(roof.map);
  trackTex(roof.bump);

  const thatchTex = createThatchTextures(maxAnisotropy);
  trackTex(thatchTex.map);
  trackTex(thatchTex.bump);

  const brickTex = createBrickTextures(maxAnisotropy);
  trackTex(brickTex.map);
  trackTex(brickTex.bump);

  const woodDarkTex = trackTex(createWoodTexture('#5c432e', '#382719', maxAnisotropy));
  const woodWarmTex = trackTex(createWoodTexture('#7c5c3e', '#523a25', maxAnisotropy));
  const bambooTex = trackTex(createBambooMatTexture(maxAnisotropy));
  const latticeTex = trackTex(createLatticeTexture(maxAnisotropy));
  const waterTex = trackTex(createWaterTexture(maxAnisotropy));

  const ground = trackMat(
    new THREE.MeshStandardMaterial({
      map: loam.map,
      bumpMap: loam.bump,
      bumpScale: 0.08,
      roughness: 0.94,
      metalness: 0.0,
      vertexColors: true,
    })
  );

  const road = trackMat(
    new THREE.MeshStandardMaterial({
      map: roadTex,
      color: 0xb29870,
      roughness: 0.94,
      metalness: 0.0,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );

  const riverBank = trackMat(
    new THREE.MeshStandardMaterial({
      map: bankLoam.map,
      bumpMap: bankLoam.bump,
      bumpScale: 0.1,
      roughness: 0.92,
      metalness: 0.0,
    })
  );

  const waterUniforms = { uTime: { value: 0 } };
  const water = trackMat(
    new THREE.MeshStandardMaterial({
      map: waterTex,
      color: 0x8a7958,
      roughness: 0.78,
      metalness: 0.01,
      envMapIntensity: 0.22,
    })
  );
  water.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = waterUniforms.uTime;
    shader.vertexShader =
      `uniform float uTime;\n` +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float wave = sin(position.x * 0.35 + uTime * 1.4) * 0.045 + cos(position.z * 0.55 - uTime * 1.1) * 0.035;
        transformed.y += wave;`
      );
    shader.fragmentShader =
      `uniform float uTime;\n` +
      shader.fragmentShader.replace(
        '#include <map_fragment>',
        `vec2 flowUv = vMapUv + vec2(uTime * 0.018, sin(vMapUv.x * 12.0 + uTime * 0.7) * 0.008);
        vec4 sampledDiffuseColor = texture2D( map, flowUv );
        diffuseColor *= sampledDiffuseColor;`
      );
  };

  const tileRoof = trackMat(
    new THREE.MeshStandardMaterial({
      map: roof.map,
      bumpMap: roof.bump,
      bumpScale: 0.09,
      roughness: 0.78,
      metalness: 0.04,
    })
  );

  const ridgeTile = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x3b342d,
      roughness: 0.65,
      metalness: 0.06,
    })
  );

  const thatch = trackMat(
    new THREE.MeshStandardMaterial({
      map: thatchTex.map,
      bumpMap: thatchTex.bump,
      bumpScale: 0.12,
      roughness: 0.96,
      metalness: 0.0,
    })
  );

  const plasterWall = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xc2af8d,
      bumpMap: loam.bump,
      bumpScale: 0.04,
      roughness: 0.9,
      metalness: 0.0,
    })
  );

  const brickWall = trackMat(
    new THREE.MeshStandardMaterial({
      map: brickTex.map,
      bumpMap: brickTex.bump,
      bumpScale: 0.09,
      roughness: 0.88,
      metalness: 0.02,
    })
  );

  const timberDark = trackMat(
    new THREE.MeshStandardMaterial({
      map: woodDarkTex,
      roughness: 0.76,
      metalness: 0.02,
    })
  );

  const timberWarm = trackMat(
    new THREE.MeshStandardMaterial({
      map: woodWarmTex,
      roughness: 0.72,
      metalness: 0.02,
    })
  );

  const timberBridge = trackMat(
    new THREE.MeshStandardMaterial({
      map: woodWarmTex,
      color: 0x8d6342,
      roughness: 0.68,
      metalness: 0.03,
    })
  );

  const bambooMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: bambooTex,
      roughness: 0.84,
      metalness: 0.0,
    })
  );

  const latticeWindow = trackMat(
    new THREE.MeshStandardMaterial({
      map: latticeTex,
      roughness: 0.68,
      metalness: 0.02,
    })
  );

  const stoneBase = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x8e8270,
      bumpMap: brickTex.bump,
      bumpScale: 0.05,
      roughness: 0.86,
      metalness: 0.03,
    })
  );

  const bark = trackMat(
    new THREE.MeshStandardMaterial({
      map: woodDarkTex,
      color: 0x5c4c3b,
      roughness: 0.92,
      metalness: 0.0,
    })
  );

  const windUniforms = { uWindTime: { value: 0 } };
  const willowFoliage = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x7c7b55,
      roughness: 0.88,
      metalness: 0.0,
    })
  );
  willowFoliage.onBeforeCompile = (shader) => {
    shader.uniforms.uWindTime = windUniforms.uWindTime;
    shader.vertexShader =
      `uniform float uWindTime;\n` +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float sway = sin(uWindTime * 1.6 + position.x * 0.4 + position.z * 0.3) * 0.08 * max(0.0, position.y);
        transformed.x += sway;`
      );
  };

  const clothVermilion = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x8c4432,
      roughness: 0.86,
      metalness: 0.0,
      side: THREE.DoubleSide,
    })
  );

  const clothIndigo = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x45515e,
      roughness: 0.88,
      metalness: 0.0,
      side: THREE.DoubleSide,
    })
  );

  const clothOchre = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xa68349,
      roughness: 0.86,
      metalness: 0.0,
      side: THREE.DoubleSide,
    })
  );

  const clothUmbrella = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x8d724c,
      roughness: 0.82,
      metalness: 0.0,
      side: THREE.DoubleSide,
    })
  );

  const hullWood = trackMat(
    new THREE.MeshStandardMaterial({
      map: woodWarmTex,
      color: 0x7a5b3d,
      roughness: 0.72,
      metalness: 0.03,
      side: THREE.DoubleSide,
    })
  );

  const ropeMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x62513b,
      roughness: 0.94,
      metalness: 0.0,
    })
  );

  const shadowTex = trackTex(
    createRadialTexture('rgba(34,26,18,0.46)', 'rgba(34,26,18,0.18)', 'rgba(34,26,18,0.0)', 128)
  );
  const contactShadow = trackMat(
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    })
  );

  const smokeTex = trackTex(
    createRadialTexture('rgba(215,201,175,0.45)', 'rgba(196,180,152,0.18)', 'rgba(186,170,142,0.0)', 128)
  );

  const makeSignMaterial = (
    text: string,
    opts?: {
      vertical?: boolean;
      bg?: string;
      fg?: string;
      border?: string;
      width?: number;
      height?: number;
    }
  ): THREE.MeshStandardMaterial => {
    const vertical = opts?.vertical ?? true;
    const w = opts?.width ?? (vertical ? 128 : 256);
    const h = opts?.height ?? (vertical ? 320 : 128);
    const [c, ctx] = makeCanvas(w, h);
    ctx.fillStyle = opts?.bg ?? '#c4ad84';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = opts?.border ?? '#4d3926';
    ctx.lineWidth = 6;
    ctx.strokeRect(5, 5, w - 10, h - 10);

    ctx.fillStyle = opts?.fg ?? '#2d2219';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const fontStack = '"QingmingWenKai", "Kaiti SC", "STKaiti", "KaiTi", serif';
    if (vertical) {
      const chars = Array.from(text);
      const fontSize = Math.min(40, Math.floor((h - 36) / Math.max(1, chars.length)));
      ctx.font = `600 ${fontSize}px ${fontStack}`;
      const step = (h - 28) / Math.max(1, chars.length);
      chars.forEach((ch, idx) => {
        ctx.fillText(ch, w / 2, 14 + step * (idx + 0.5));
      });
    } else {
      const fontSize = Math.min(44, Math.floor((w - 28) / Math.max(1, text.length)));
      ctx.font = `600 ${fontSize}px ${fontStack}`;
      ctx.fillText(text, w / 2, h / 2);
    }

    const tex = trackTex(configureTexture(c, true, maxAnisotropy, 1, 1));
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return trackMat(
      new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.74,
        metalness: 0.02,
        side: THREE.DoubleSide,
      })
    );
  };

  return {
    silkBgColor: 0xc2ab83,
    maxAnisotropy,
    ground,
    road,
    riverBank,
    water,
    tileRoof,
    ridgeTile,
    thatch,
    plasterWall,
    brickWall,
    timberDark,
    timberWarm,
    timberBridge,
    bambooMat,
    latticeWindow,
    stoneBase,
    bark,
    willowFoliage,
    clothVermilion,
    clothIndigo,
    clothOchre,
    clothUmbrella,
    hullWood,
    ropeMat,
    contactShadow,
    smokeTex,
    makeSignMaterial,
    updateWaterTime: (t: number) => {
      waterUniforms.uTime.value = t;
    },
    updateWindTime: (t: number) => {
      windUniforms.uWindTime.value = t;
    },
    dispose: () => {
      textures.forEach((t) => t.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}
