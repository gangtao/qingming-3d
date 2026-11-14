// ============================================================================
// 01-primitives.js — 基础几何零件、静态网格合并器、程序化贴图与宋代设色材质
// ============================================================================
(function (QM) {
  'use strict';

  // 确定性伪随机数（保证每次打开场景布局完全一致）
  QM.createRNG = function (seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  QM.rand = QM.createRNG(11200405);

  // 暖褐色绢本基调色板
  QM.PAL = {
    silkBg: 0xd6c4a2,
    earthLight: 0xc2ab84,
    earthMid: 0xab9168,
    earthDark: 0x8c724d,
    grassEarly: 0x8a895c,
    grassMuted: 0x777c52,
    street: 0xb59e77,
    riverBed: 0x5c5844,
    water: 0x78765c,
    woodDark: 0x4f3926,
    woodMid: 0x6b4e34,
    woodLight: 0x8b6a48,
    bamboo: 0x9b8352,
    plaster: 0xd9cbb0,
    plasterWarm: 0xcab999,
    tileGrey: 0x4a4843,
    tileDark: 0x3b3934,
    thatch: 0x9f8759,
    brick: 0x756b5d,
    stone: 0x8f8574,
    cinnabar: 0x8c3c2d,
    tealMuted: 0x496356,
    indigo: 0x3b4c5c,
    ochre: 0xb68e52,
    hemp: 0xc9b99c,
    foliageWillow: 0x828c56,
    foliageDry: 0x6c5a42,
    bambooLeaf: 0x5d6e47,
    skinLight: 0xd3ad87,
    skinTan: 0xbc9169,
    hairDark: 0x26211d
  };

  // 确保 BufferGeometry 为非索引并拥有 position / normal / uv / color
  QM.prepareGeo = function (geo, hexColor, shadeFn) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (!g.attributes.normal) g.computeVertexNormals();
    const pos = g.attributes.position;
    const count = pos.count;
    if (!g.attributes.uv) {
      const uvs = new Float32Array(count * 2);
      for (let i = 0; i < count; i++) {
        uvs[i * 2] = pos.getX(i) * 0.25 + 0.5;
        uvs[i * 2 + 1] = pos.getY(i) * 0.25 + pos.getZ(i) * 0.25 + 0.5;
      }
      g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    }
    const base = new THREE.Color(hexColor !== undefined ? hexColor : 0xffffff);
    const cols = new Float32Array(count * 3);
    const tmp = new THREE.Color();
    for (let i = 0; i < count; i++) {
      tmp.copy(base);
      if (shadeFn) {
        const mult = shadeFn(pos.getX(i), pos.getY(i), pos.getZ(i));
        tmp.multiplyScalar(mult);
      }
      cols[i * 3] = tmp.r;
      cols[i * 3 + 1] = tmp.g;
      cols[i * 3 + 2] = tmp.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    return g;
  };

  // 零依赖静态几何合并器（大幅减少 Draw Calls）
  QM.mergeGeometries = function (geos) {
    if (!geos || geos.length === 0) return null;
    let totalVerts = 0;
    const prepped = [];
    for (let i = 0; i < geos.length; i++) {
      const g = geos[i];
      if (!g || !g.attributes.position) continue;
      const ng = g.index ? g.toNonIndexed() : g;
      if (!ng.attributes.normal) ng.computeVertexNormals();
      if (!ng.attributes.uv) QM.prepareGeo(ng, 0xffffff);
      if (!ng.attributes.color) {
        const c = new Float32Array(ng.attributes.position.count * 3);
        c.fill(1);
        ng.setAttribute('color', new THREE.BufferAttribute(c, 3));
      }
      totalVerts += ng.attributes.position.count;
      prepped.push(ng);
    }
    if (totalVerts === 0) return null;

    const positions = new Float32Array(totalVerts * 3);
    const normals = new Float32Array(totalVerts * 3);
    const uvs = new Float32Array(totalVerts * 2);
    const colors = new Float32Array(totalVerts * 3);

    let offset = 0;
    for (let i = 0; i < prepped.length; i++) {
      const g = prepped[i];
      const count = g.attributes.position.count;
      positions.set(g.attributes.position.array, offset * 3);
      normals.set(g.attributes.normal.array, offset * 3);
      uvs.set(g.attributes.uv.array, offset * 2);
      colors.set(g.attributes.color.array, offset * 3);
      offset += count;
    }

    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    merged.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    merged.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    merged.computeBoundingSphere();
    return merged;
  };

  // --------------------------------------------------------------------------
  // 程序化 Canvas2D 纹理库（零外部图片依赖）
  // --------------------------------------------------------------------------
  function makeCanvas(w, h, drawFn) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    drawFn(ctx, w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  QM.initMaterials = function () {
    const rng = QM.createRNG(9901);

    // 1. 绢本与泥土肌理
    const texSilk = makeCanvas(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#ddd0b6';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(120, 96, 65, 0.08)';
      ctx.lineWidth = 1;
      for (let i = 0; i < w; i += 4) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
      }
      for (let i = 0; i < 1600; i++) {
        const x = rng() * w, y = rng() * h;
        const v = rng() > 0.5 ? 'rgba(92,70,42,0.08)' : 'rgba(245,235,212,0.1)';
        ctx.fillStyle = v;
        ctx.fillRect(x, y, 2 + rng() * 4, 1 + rng() * 3);
      }
    });
    texSilk.repeat.set(36, 12);

    // 2. 瓦垄纹理（瓦顶质感）
    const texTile = makeCanvas(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#bcb4a7';
      ctx.fillRect(0, 0, w, h);
      const cols = 16;
      const cw = w / cols;
      for (let c = 0; c < cols; c++) {
        const grad = ctx.createLinearGradient(c * cw, 0, (c + 1) * cw, 0);
        grad.addColorStop(0, '#6a655c');
        grad.addColorStop(0.45, '#dad4c8');
        grad.addColorStop(0.85, '#928c80');
        grad.addColorStop(1, '#58534a');
        ctx.fillStyle = grad;
        ctx.fillRect(c * cw, 0, cw, h);
      }
      ctx.strokeStyle = 'rgba(40,36,30,0.35)';
      ctx.lineWidth = 2;
      for (let y = 0; y < h; y += 22) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
    });
    texTile.repeat.set(3, 2);

    // 3. 茅草纹理
    const texThatch = makeCanvas(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#c4ae80';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 1400; i++) {
        const x = rng() * w, y = rng() * h;
        ctx.strokeStyle = rng() > 0.45 ? 'rgba(105,82,42,0.42)' : 'rgba(225,204,158,0.45)';
        ctx.lineWidth = 1 + rng() * 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (rng() - 0.5) * 6, y + 14 + rng() * 16);
        ctx.stroke();
      }
    });
    texThatch.repeat.set(2, 2);

    // 4. 青砖砌筑纹理（城台与台基）
    const texBrick = makeCanvas(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#afa696';
      ctx.fillRect(0, 0, w, h);
      const rows = 12, cols = 6;
      const rh = h / rows, cw = w / cols;
      for (let r = 0; r < rows; r++) {
        const shift = (r % 2) * (cw * 0.5);
        for (let c = -1; c <= cols; c++) {
          const shade = 155 + Math.floor(rng() * 40);
          ctx.fillStyle = `rgb(${shade}, ${shade - 8}, ${shade - 18})`;
          ctx.fillRect(c * cw + shift + 1, r * rh + 1, cw - 2, rh - 2);
        }
      }
    });
    texBrick.repeat.set(3, 2);

    // 5. 木纹纹理
    const texWood = makeCanvas(128, 128, (ctx, w, h) => {
      ctx.fillStyle = '#c7b08f';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 90; i++) {
        const x = rng() * w;
        ctx.strokeStyle = `rgba(74, 48, 24, ${0.12 + rng() * 0.22})`;
        ctx.lineWidth = 1 + rng() * 2;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + (rng() - 0.5) * 5, h); ctx.stroke();
      }
    });

    // 6. 格子窗纹理
    const texLattice = makeCanvas(128, 128, (ctx, w, h) => {
      ctx.fillStyle = '#6b533b';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#cab795';
      const pad = 10;
      ctx.fillRect(pad, pad, w - pad * 2, h - pad * 2);
      ctx.strokeStyle = '#57402a';
      ctx.lineWidth = 4;
      for (let i = 0; i <= 4; i++) {
        const p = pad + ((w - pad * 2) / 4) * i;
        ctx.beginPath(); ctx.moveTo(p, pad); ctx.lineTo(p, h - pad); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pad, p); ctx.lineTo(w - pad, p); ctx.stroke();
      }
    });

    // 7. 汴河水波水墨纹理
    const texWater = makeCanvas(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#8b886b';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 220; i++) {
        const x = rng() * w, y = rng() * h, len = 18 + rng() * 34;
        ctx.strokeStyle = rng() > 0.35 ? 'rgba(62,59,44,0.22)' : 'rgba(218,205,172,0.18)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + len * 0.5, y + (rng() - 0.5) * 6, x + len, y);
        ctx.stroke();
      }
    });
    texWater.repeat.set(28, 4);

    QM.textures = { texSilk, texTile, texThatch, texBrick, texWood, texLattice, texWater };

    QM.MAT = {
      ground: new THREE.MeshLambertMaterial({ map: texSilk, vertexColors: true }),
      wood: new THREE.MeshLambertMaterial({ map: texWood, vertexColors: true }),
      plaster: new THREE.MeshLambertMaterial({ map: texSilk, vertexColors: true }),
      tile: new THREE.MeshLambertMaterial({ map: texTile, vertexColors: true }),
      thatch: new THREE.MeshLambertMaterial({ map: texThatch, vertexColors: true }),
      brick: new THREE.MeshLambertMaterial({ map: texBrick, vertexColors: true }),
      lattice: new THREE.MeshLambertMaterial({ map: texLattice, vertexColors: true }),
      stone: new THREE.MeshLambertMaterial({ vertexColors: true }),
      foliage: new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }),
      water: new THREE.MeshLambertMaterial({
        map: texWater,
        color: 0xb8b295,
        transparent: true,
        opacity: 0.90
      }),
      entity: new THREE.MeshLambertMaterial({ vertexColors: true }),
      entityDouble: new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })
    };
  };

  // 动态生成店铺匾额 / 招幌贴图
  QM.makeSignMaterial = function (text, opts) {
    const o = opts || {};
    const vertical = !!o.vertical;
    const w = vertical ? 96 : 256;
    const h = vertical ? 280 : 96;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');

    ctx.fillStyle = o.bg || '#d8c5a0';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = o.border || '#4b3621';
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, w - 8, h - 8);

    ctx.fillStyle = o.fg || '#2a1f16';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (vertical) {
      const chars = Array.from(text);
      const fs = Math.min(46, Math.floor((h - 24) / Math.max(1, chars.length)));
      ctx.font = `bold ${fs}px "LXGW WenKai", "STKaiti", "KaiTi", serif`;
      const step = (h - 28) / chars.length;
      chars.forEach((ch, idx) => {
        ctx.fillText(ch, w / 2, 14 + step * (idx + 0.5));
      });
    } else {
      const fs = Math.min(48, Math.floor((w - 28) / Math.max(2, text.length * 0.95)));
      ctx.font = `bold ${fs}px "LXGW WenKai", "STKaiti", "KaiTi", serif`;
      ctx.fillText(text, w / 2, h / 2);
    }

    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide });
  };

  // --------------------------------------------------------------------------
  // 静态网格批处理器
  // --------------------------------------------------------------------------
  QM.StaticBatcher = function () {
    this.buckets = {};
    this.singles = [];
  };

  QM.StaticBatcher.prototype.add = function (matKey, rawGeo, matrix, hexColor, shadeFn) {
    const g = QM.prepareGeo(rawGeo, hexColor, shadeFn);
    if (matrix) g.applyMatrix4(matrix);
    if (!this.buckets[matKey]) this.buckets[matKey] = [];
    this.buckets[matKey].push(g);
  };

  QM.StaticBatcher.prototype.addBox = function (matKey, w, h, d, x, y, z, rx, ry, rz, hexColor, shadeFn) {
    const g = new THREE.BoxGeometry(w, h, d);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0));
    m.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(1, 1, 1));
    this.add(matKey, g, m, hexColor, shadeFn);
  };

  QM.StaticBatcher.prototype.addCyl = function (matKey, rt, rb, h, segs, x, y, z, rx, ry, rz, hexColor) {
    const g = new THREE.CylinderGeometry(rt, rb, h, segs || 8);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0));
    m.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(1, 1, 1));
    this.add(matKey, g, m, hexColor);
  };

  QM.StaticBatcher.prototype.buildInto = function (parent) {
    const group = new THREE.Group();
    Object.keys(this.buckets).forEach((key) => {
      const merged = QM.mergeGeometries(this.buckets[key]);
      if (merged && QM.MAT[key]) {
        const mesh = new THREE.Mesh(merged, QM.MAT[key]);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
      }
    });
    this.singles.forEach((m) => group.add(m));
    parent.add(group);
    this.buckets = {};
    this.singles = [];
    return group;
  };
})(window.QM = window.QM || {});
