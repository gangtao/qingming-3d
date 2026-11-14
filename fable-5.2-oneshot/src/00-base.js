/* 基础零件：随机数、颜色、网格合并器（Batch）、程序贴图、材质、实例池、小矩阵库 */
(function () {
  'use strict';
  var T = THREE;
  var Q = window.Q = {};

  // ---------- 随机数（固定种子，每次打开布局一致） ----------
  function mulberry(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  var R0 = mulberry(1085);
  Q.mulberry = mulberry;
  Q.reseed = function (s) { R0 = mulberry(s); };
  Q.rand = function (a, b) { if (a === undefined) return R0(); if (b === undefined) return R0() * a; return a + R0() * (b - a); };
  Q.randi = function (a, b) { return Math.floor(Q.rand(a, b + 1)); };
  Q.pick = function (arr) { return arr[Math.floor(R0() * arr.length)]; };
  Q.chance = function (p) { return R0() < p; };

  // ---------- 颜色 ----------
  Q.C = function (hex) { return [(hex >> 16 & 255) / 255, (hex >> 8 & 255) / 255, (hex & 255) / 255]; };
  Q.mix = function (a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; };
  Q.shade = function (c, f) { return [c[0] * f, c[1] * f, c[2] * f]; };
  Q.jit = function (c, a) { var f = 1 + (R0() - 0.5) * 2 * a; return [c[0] * f, c[1] * f, c[2] * f]; };
  Q.css = function (c, a) {
    var r = Math.round(Math.min(1, c[0]) * 255), g = Math.round(Math.min(1, c[1]) * 255), b = Math.round(Math.min(1, c[2]) * 255);
    return a === undefined ? 'rgb(' + r + ',' + g + ',' + b + ')' : 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  };
  // 绢本色系
  var C = Q.C;
  Q.COL = {
    silk: C(0xc3a56d), silkLight: C(0xd3ba88), silkDark: C(0xa68a58),
    ink: C(0x3a2f24), inkSoft: C(0x5c4b38),
    wood: C(0x8a6a48), woodDark: C(0x5e4630), woodLight: C(0xa98a62), woodRed: C(0x8c5a40),
    plaster: C(0xd8c69c), plasterDark: C(0xbfa97c),
    tile: C(0x7d7262), tileDark: C(0x5f564a),
    thatch: C(0xa58a55), thatchDark: C(0x7f6a44),
    brick: C(0x8d7d68), earth: C(0xa88a58),
    mat: C(0xb59a66), rope: C(0x6e5a40),
    skin: C(0xd9b088), skinDark: C(0xb98c64), hair: C(0x2b2520),
    white: C(0xe9dfc6), cloth: C(0xd9cdb0), blue: C(0x6f8088), green: C(0x7c8460),
    red: C(0x9a5540), bark: C(0x8a745c), barkDark: C(0x574838),
    willow: C(0x7f8356), water: C(0xa59468)
  };

  // ---------- 可增长缓冲 ----------
  function Buf() {
    this.cap = 2048; this.icap = 4096;
    this.pos = new Float32Array(this.cap * 3);
    this.uv = new Float32Array(this.cap * 2);
    this.nor = new Int8Array(this.cap * 3);
    this.col = new Uint8Array(this.cap * 3);
    this.aux = new Uint8Array(this.cap);
    this.idx = new Uint32Array(this.icap);
    this.nv = 0; this.ni = 0;
  }
  function grow(old, n) { var a = new old.constructor(n); a.set(old); return a; }
  Buf.prototype.ensure = function (nv, ni) {
    if (this.nv + nv > this.cap) {
      while (this.nv + nv > this.cap) this.cap *= 2;
      this.pos = grow(this.pos, this.cap * 3); this.uv = grow(this.uv, this.cap * 2);
      this.nor = grow(this.nor, this.cap * 3); this.col = grow(this.col, this.cap * 3);
      this.aux = grow(this.aux, this.cap);
    }
    if (this.ni + ni > this.icap) {
      while (this.ni + ni > this.icap) this.icap *= 2;
      this.idx = grow(this.idx, this.icap);
    }
  };

  // 每种贴图材质：一个世界单位对应多少次重复
  var UVS = { plain: 1, tile: 1 / 2.4, thatch: 1 / 3, wood: 1 / 2, brick: 1 / 2, plaster: 1 / 4, mat: 1 / 1.6, bark: 1 / 1.5, lattice: 1 / 0.9, earth: 1 / 5, cloth: 1, sign: 1, twig: 1, stone: 1 / 2.5 };
  Q.UVS = UVS;

  // ---------- 网格合并器 ----------
  function Batch(chunkW) {
    this.bufs = {};
    this.m = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
    this.stack = [];
    this.chunkW = chunkW || 0;
    this.chunk = '';
    this.aux = 0;      // 当前附加属性（静态物：摆动权重；实例零件：染色权重）
  }
  var BP = Batch.prototype;
  BP.buf = function (mat) {
    var k = mat + this.chunk;
    var b = this.bufs[k];
    if (!b) { b = this.bufs[k] = new Buf(); b.mat = mat; }
    return b;
  };
  // 进入局部坐标：平移 + 绕Y旋转 + 等比缩放
  BP.push = function (x, y, z, ry, s) {
    var m = this.m;
    this.stack.push(m);
    var c = Math.cos(ry || 0), sn = Math.sin(ry || 0); s = s || 1;
    var n = new Array(12);
    // n.R = m.R * Ry * s
    n[0] = (m[0] * c - m[2] * sn) * s; n[1] = m[1] * s; n[2] = (m[0] * sn + m[2] * c) * s;
    n[3] = (m[3] * c - m[5] * sn) * s; n[4] = m[4] * s; n[5] = (m[3] * sn + m[5] * c) * s;
    n[6] = (m[6] * c - m[8] * sn) * s; n[7] = m[7] * s; n[8] = (m[6] * sn + m[8] * c) * s;
    n[9] = m[9] + m[0] * x + m[1] * y + m[2] * z;
    n[10] = m[10] + m[3] * x + m[4] * y + m[5] * z;
    n[11] = m[11] + m[6] * x + m[7] * y + m[8] * z;
    this.m = n;
    if (this.chunkW && this.stack.length === 1) this.chunk = '|' + Math.floor((n[9] + 1000) / this.chunkW);
  };
  // 一般旋转（欧拉XYZ）进入
  BP.pushR = function (x, y, z, rx, ry, rz) {
    var m = this.m; this.stack.push(m);
    var cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry), cz = Math.cos(rz), sz = Math.sin(rz);
    // R = Ry * Rx * Rz
    var r = [cy * cz + sy * sx * sz, -cy * sz + sy * sx * cz, sy * cx,
      cx * sz, cx * cz, -sx,
      -sy * cz + cy * sx * sz, sy * sz + cy * sx * cz, cy * cx];
    var n = new Array(12);
    for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++)
      n[i * 3 + j] = m[i * 3] * r[j] + m[i * 3 + 1] * r[3 + j] + m[i * 3 + 2] * r[6 + j];
    n[9] = m[9] + m[0] * x + m[1] * y + m[2] * z;
    n[10] = m[10] + m[3] * x + m[4] * y + m[5] * z;
    n[11] = m[11] + m[6] * x + m[7] * y + m[8] * z;
    this.m = n;
    if (this.chunkW && this.stack.length === 1) this.chunk = '|' + Math.floor((n[9] + 1000) / this.chunkW);
  };
  BP.pop = function () { this.m = this.stack.pop(); };
  BP.setChunk = function (x) { if (this.chunkW) this.chunk = '|' + Math.floor((x + 1000) / this.chunkW); };
  BP.at = function (x, y, z, ry, fn, s) { this.push(x, y, z, ry, s); fn(this); this.pop(); };

  function vert(self, b, p, nx, ny, nz, u, v, col) {
    var m = self.m, i = b.nv++;
    var x = p[0], y = p[1], z = p[2];
    b.pos[i * 3] = m[9] + m[0] * x + m[1] * y + m[2] * z;
    b.pos[i * 3 + 1] = m[10] + m[3] * x + m[4] * y + m[5] * z;
    b.pos[i * 3 + 2] = m[11] + m[6] * x + m[7] * y + m[8] * z;
    var wx = m[0] * nx + m[1] * ny + m[2] * nz, wy = m[3] * nx + m[4] * ny + m[5] * nz, wz = m[6] * nx + m[7] * ny + m[8] * nz;
    var l = Math.sqrt(wx * wx + wy * wy + wz * wz) || 1;
    b.nor[i * 3] = Math.round(wx / l * 127); b.nor[i * 3 + 1] = Math.round(wy / l * 127); b.nor[i * 3 + 2] = Math.round(wz / l * 127);
    b.uv[i * 2] = u; b.uv[i * 2 + 1] = v;
    b.col[i * 3] = col[0] >= 1 ? 255 : col[0] <= 0 ? 0 : col[0] * 255;
    b.col[i * 3 + 1] = col[1] >= 1 ? 255 : col[1] <= 0 ? 0 : col[1] * 255;
    b.col[i * 3 + 2] = col[2] >= 1 ? 255 : col[2] <= 0 ? 0 : col[2] * 255;
    b.aux[i] = self.aux * 255;
    return i;
  }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function len(a) { return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]); }
  function norm(a) { var l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
  Q.v3 = { sub: sub, cross: cross, len: len, norm: norm };

  // 四边形 A-B-C-D（逆时针），uv 可给 [u0,v0,u1,v1] 或四角数组；默认按边长铺贴图
  BP.quad = function (mat, A, B, C, D, col, uv, cols) {
    var b = this.buf(mat); b.ensure(4, 6);
    var e1 = sub(B, A), e2 = sub(D, A), n = norm(cross(e1, e2));
    var s = UVS[mat] || 1, u0 = 0, v0 = 0, u1, v1;
    var i0;
    if (uv && uv.length === 8) {
      i0 = vert(this, b, A, n[0], n[1], n[2], uv[0], uv[1], cols ? cols[0] : col);
      vert(this, b, B, n[0], n[1], n[2], uv[2], uv[3], cols ? cols[1] : col);
      vert(this, b, C, n[0], n[1], n[2], uv[4], uv[5], cols ? cols[2] : col);
      vert(this, b, D, n[0], n[1], n[2], uv[6], uv[7], cols ? cols[3] : col);
    } else {
      if (uv) { u0 = uv[0]; v0 = uv[1]; u1 = uv[2]; v1 = uv[3]; }
      else { u1 = len(e1) * s; v1 = len(e2) * s; }
      i0 = vert(this, b, A, n[0], n[1], n[2], u0, v0, cols ? cols[0] : col);
      vert(this, b, B, n[0], n[1], n[2], u1, v0, cols ? cols[1] : col);
      vert(this, b, C, n[0], n[1], n[2], u1, v1, cols ? cols[2] : col);
      vert(this, b, D, n[0], n[1], n[2], u0, v1, cols ? cols[3] : col);
    }
    var ix = b.idx, k = b.ni;
    ix[k] = i0; ix[k + 1] = i0 + 1; ix[k + 2] = i0 + 2; ix[k + 3] = i0; ix[k + 4] = i0 + 2; ix[k + 5] = i0 + 3;
    b.ni += 6;
  };
  BP.tri = function (mat, A, B, C, col, uv) {
    var b = this.buf(mat); b.ensure(3, 3);
    var n = norm(cross(sub(B, A), sub(C, A)));
    var s = UVS[mat] || 1;
    uv = uv || [0, 0, len(sub(B, A)) * s, 0, len(sub(B, A)) * s * 0.5, len(sub(C, A)) * s];
    var i0 = vert(this, b, A, n[0], n[1], n[2], uv[0], uv[1], col);
    vert(this, b, B, n[0], n[1], n[2], uv[2], uv[3], col);
    vert(this, b, C, n[0], n[1], n[2], uv[4], uv[5], col);
    b.idx[b.ni++] = i0; b.idx[b.ni++] = i0 + 1; b.idx[b.ni++] = i0 + 2;
  };
  // 长方体：中心 (cx,cy,cz)，尺寸 sx,sy,sz；opt: {ry, noTop, noBottom, topCol}
  BP.box = function (mat, cx, cy, cz, sx, sy, sz, col, opt) {
    opt = opt || {};
    if (opt.ry) this.push(cx, cy, cz, opt.ry); else this.push(cx, cy, cz, 0);
    var x = sx / 2, y = sy / 2, z = sz / 2;
    this.quad(mat, [-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z], col);
    this.quad(mat, [x, -y, -z], [-x, -y, -z], [-x, y, -z], [x, y, -z], col);
    this.quad(mat, [x, -y, z], [x, -y, -z], [x, y, -z], [x, y, z], col);
    this.quad(mat, [-x, -y, -z], [-x, -y, z], [-x, y, z], [-x, y, -z], col);
    if (!opt.noTop) this.quad(mat, [-x, y, z], [x, y, z], [x, y, -z], [-x, y, -z], opt.topCol || col);
    if (!opt.noBottom) this.quad(mat, [-x, -y, -z], [x, -y, -z], [x, -y, z], [-x, -y, z], col);
    this.pop();
  };
  // 底面在 y0 的长方体
  BP.boxB = function (mat, cx, y0, cz, sx, sy, sz, col, opt) { this.box(mat, cx, y0 + sy / 2, cz, sx, sy, sz, col, opt); };
  // 两点之间的方木（截面 w×h），不封端
  BP.beam = function (mat, P, Pb, w, h, col, cap) {
    var d = sub(Pb, P), L = len(d); if (L < 1e-6) return;
    d = [d[0] / L, d[1] / L, d[2] / L];
    var up = Math.abs(d[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0];
    var s = norm(cross(d, up)), u = cross(s, d);
    h = h === undefined ? w : h;
    var a = w / 2, bb = h / 2;
    function pt(base, i, j) { return [base[0] + s[0] * a * i + u[0] * bb * j, base[1] + s[1] * a * i + u[1] * bb * j, base[2] + s[2] * a * i + u[2] * bb * j]; }
    var c = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (var i = 0; i < 4; i++) {
      var c0 = c[i], c1 = c[(i + 1) % 4];
      this.quad(mat, pt(P, c0[0], c0[1]), pt(P, c1[0], c1[1]), pt(Pb, c1[0], c1[1]), pt(Pb, c0[0], c0[1]), col);
    }
    if (cap) {
      this.quad(mat, pt(Pb, -1, -1), pt(Pb, 1, -1), pt(Pb, 1, 1), pt(Pb, -1, 1), col);
      this.quad(mat, pt(P, -1, 1), pt(P, 1, 1), pt(P, 1, -1), pt(P, -1, -1), col);
    }
  };
  // 放样：rings[i][j] = [x,y,z]；opt: {closed, col, cols(每圈颜色), capA, capB, flat, uLen}
  BP.loft = function (mat, rings, opt) {
    opt = opt || {};
    var nr = rings.length, np = rings[0].length, closed = opt.closed !== false;
    var b = this.buf(mat);
    var cols = opt.cols, col = opt.col || [1, 1, 1];
    var s = UVS[mat] || 1;
    var i, j;
    if (opt.flat) {
      for (i = 0; i < nr - 1; i++) {
        var m = closed ? np : np - 1;
        for (j = 0; j < m; j++) {
          var j1 = (j + 1) % np;
          this.quad(mat, rings[i][j], rings[i][j1], rings[i + 1][j1], rings[i + 1][j], cols ? cols[i] : col);
        }
      }
    } else {
      var cnt = closed ? np + 1 : np;
      b.ensure(nr * cnt, (nr - 1) * (cnt - 1) * 6);
      var base = b.nv, vlen = 0;
      var ulen = opt.uLen || 0;
      if (!ulen) { var mr = rings[nr >> 1]; for (j = 0; j < np - 1; j++) ulen += len(sub(mr[j + 1], mr[j])); if (closed) ulen += len(sub(mr[0], mr[np - 1])); }
      var norms = [];
      for (i = 0; i < nr; i++) {
        var ip = rings[Math.max(0, i - 1)], inx = rings[Math.min(nr - 1, i + 1)];
        for (j = 0; j < np; j++) {
          var ja = closed ? (j + np - 1) % np : Math.max(0, j - 1), jb = closed ? (j + 1) % np : Math.min(np - 1, j + 1);
          var du = sub(rings[i][jb], rings[i][ja]), dv = sub(inx[j], ip[j]);
          var n = cross(du, dv), l = len(n);
          norms.push(l < 1e-9 ? null : [n[0] / l, n[1] / l, n[2] / l]);
        }
      }
      for (i = 0; i < nr; i++) for (j = 0; j < np; j++) {
        if (norms[i * np + j]) continue;
        var alt = norms[(i === 0 ? 1 : i - 1) * np + j] || norms[Math.min(nr - 1, i + 1) * np + j];
        norms[i * np + j] = alt || [0, 1, 0];
      }
      for (i = 0; i < nr; i++) {
        if (i > 0) vlen += len(sub(rings[i][0], rings[i - 1][0]));
        var cc = cols ? cols[i] : col;
        for (j = 0; j < cnt; j++) {
          var jm = j % np, nn2 = norms[i * np + jm];
          vert(this, b, rings[i][jm], nn2[0], nn2[1], nn2[2], j / (cnt - 1) * ulen * s, vlen * s, cc);
        }
      }
      for (i = 0; i < nr - 1; i++) for (j = 0; j < cnt - 1; j++) {
        var a = base + i * cnt + j, c2 = a + cnt;
        var ix = b.idx, k = b.ni;
        ix[k] = a; ix[k + 1] = a + 1; ix[k + 2] = c2 + 1; ix[k + 3] = a; ix[k + 4] = c2 + 1; ix[k + 5] = c2;
        b.ni += 6;
      }
    }
    if (opt.capA) this.fan(mat, rings[0], cols ? cols[0] : col, true);
    if (opt.capB) this.fan(mat, rings[nr - 1], cols ? cols[nr - 1] : col, false);
  };
  // 多边形扇面（凸）
  BP.fan = function (mat, ring, col, flip) {
    var n = ring.length, c = [0, 0, 0], i;
    for (i = 0; i < n; i++) { c[0] += ring[i][0] / n; c[1] += ring[i][1] / n; c[2] += ring[i][2] / n; }
    for (i = 0; i < n; i++) {
      var a = ring[i], b2 = ring[(i + 1) % n];
      if (flip) this.tri(mat, c, b2, a, col); else this.tri(mat, c, a, b2, col);
    }
  };
  // 圆台：P→Pb，半径 r1→r2，n 边
  function ringAt(P, s, u, r, n, phase) {
    var out = [];
    for (var j = 0; j < n; j++) {
      var a = j / n * Math.PI * 2 + (phase || 0), c = Math.cos(a) * r, sn = Math.sin(a) * r;
      out.push([P[0] + s[0] * c + u[0] * sn, P[1] + s[1] * c + u[1] * sn, P[2] + s[2] * c + u[2] * sn]);
    }
    return out;
  }
  function basis(d) {
    var up = Math.abs(d[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0];
    var s = norm(cross(d, up)), u = cross(s, d);
    return [s, u];
  }
  Q.ringAt = ringAt; Q.basis = basis;
  BP.cyl = function (mat, P, Pb, r1, r2, n, col, capA, capB) {
    var d = norm(sub(Pb, P)), bs = basis(d);
    if (r2 === undefined) r2 = r1;
    this.loft(mat, [ringAt(P, bs[0], bs[1], r1, n), ringAt(Pb, bs[0], bs[1], r2, n)], { col: col, capA: capA, capB: capB });
  };
  // 沿折线的变径管（树干、绳索等）；pts:[[x,y,z]], radii:[r]
  BP.tube = function (mat, pts, radii, n, col, cols) {
    var rings = [], prevS = null;
    for (var i = 0; i < pts.length; i++) {
      var a = pts[Math.max(0, i - 1)], c = pts[Math.min(pts.length - 1, i + 1)];
      var d = norm(sub(c, a)), s, u;
      if (prevS) { u = norm(cross(prevS, d)); s = cross(d, u); }
      else { var bs = basis(d); s = bs[0]; u = bs[1]; }
      prevS = s;
      rings.push(ringAt(pts[i], s, u, typeof radii === 'number' ? radii : radii[i], n));
    }
    this.loft(mat, rings, { col: col, cols: cols });
  };
  // 椭球
  BP.ball = function (mat, cx, cy, cz, rx, ry, rz, nu, nv, col, cols) {
    var rings = [];
    for (var i = 0; i <= nv; i++) {
      var t = i / nv * Math.PI, y = -Math.cos(t), r = Math.sin(t), ring = [];
      for (var j = 0; j < nu; j++) { var a = j / nu * Math.PI * 2; ring.push([cx + Math.cos(a) * r * rx, cy + y * ry, cz + Math.sin(a) * r * rz]); }
      rings.push(ring);
    }
    this.loft(mat, rings, { col: col, cols: cols });
  };
  // 圆盘（朝上）
  BP.disc = function (mat, cx, cy, cz, r, n, col) {
    var ring = []; for (var j = 0; j < n; j++) { var a = j / n * Math.PI * 2; ring.push([cx + Math.cos(a) * r, cy, cz + Math.sin(a) * r]); }
    this.fan(mat, ring, col, true);
  };

  // 生成 BufferGeometry
  function toGeom(b) {
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(b.pos.slice(0, b.nv * 3), 3));
    g.setAttribute('normal', new T.BufferAttribute(b.nor.slice(0, b.nv * 3), 3, true));
    g.setAttribute('uv', new T.BufferAttribute(b.uv.slice(0, b.nv * 2), 2));
    g.setAttribute('color', new T.BufferAttribute(b.col.slice(0, b.nv * 3), 3, true));
    g.setAttribute('aux', new T.BufferAttribute(b.aux.slice(0, b.nv), 1, true));
    g.setIndex(new T.BufferAttribute(b.nv > 65535 ? b.idx.slice(0, b.ni) : new Uint16Array(b.idx.subarray(0, b.ni)), 1));
    return g;
  }
  Q.stats = { tris: 0, meshes: 0 };
  BP.build = function () {
    var grp = new T.Group();
    for (var k in this.bufs) {
      var b = this.bufs[k]; if (!b.nv) continue;
      var g = toGeom(b); g.computeBoundingSphere(); g.computeBoundingBox();
      var mesh = new T.Mesh(g, Q.mats[b.mat]);
      mesh.matrixAutoUpdate = false;
      grp.add(mesh);
      Q.stats.tris += b.ni / 3; Q.stats.meshes++;
    }
    this.bufs = {};
    return grp;
  };
  BP.triCount = function () { var n = 0; for (var k in this.bufs) n += this.bufs[k].ni / 3; return n; };
  Q.Batch = Batch;
  Q.geomFrom = function (fn) {
    var b = new Batch(); fn(b);
    var buf = b.bufs.plain; var g = toGeom(buf);
    g.computeBoundingSphere();
    return g;
  };

  // ---------- 线段合并器（柳条、枯枝梢、绳索） ----------
  function Lines(chunkW) { this.chunks = {}; this.chunkW = chunkW || 0; }
  Lines.prototype.seg = function (a, b, ca, cb, wa, wb) {
    var k = this.chunkW ? Math.floor((a[0] + 1000) / this.chunkW) : 0;
    var c = this.chunks[k] || (this.chunks[k] = { p: [], c: [], w: [] });
    c.p.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    c.c.push(ca[0], ca[1], ca[2], cb[0], cb[1], cb[2]);
    c.w.push(wa || 0, wb || 0);
  };
  Lines.prototype.build = function (material) {
    var grp = new T.Group();
    for (var k in this.chunks) {
      var c = this.chunks[k];
      var g = new T.BufferGeometry();
      g.setAttribute('position', new T.BufferAttribute(new Float32Array(c.p), 3));
      g.setAttribute('color', new T.BufferAttribute(new Float32Array(c.c), 3));
      g.setAttribute('aux', new T.BufferAttribute(new Float32Array(c.w), 1));
      g.computeBoundingSphere();
      var l = new T.LineSegments(g, material); l.matrixAutoUpdate = false;
      grp.add(l); Q.stats.meshes++;
    }
    return grp;
  };
  Q.Lines = Lines;

  // ---------- 程序贴图 ----------
  function canvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  Q.canvas = canvas;
  function tex(w, h, fn, opt) {
    var c = canvas(w, h), g = c.getContext('2d');
    fn(g, w, h);
    var t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.anisotropy = 4;
    if (opt && opt.nomip) { t.generateMipmaps = false; t.minFilter = T.LinearFilter; }
    return t;
  }
  Q.tex = tex;
  function speckle(g, w, h, n, colFn, sMin, sMax, rnd) {
    for (var i = 0; i < n; i++) {
      g.fillStyle = colFn(rnd());
      var s = sMin + rnd() * (sMax - sMin);
      g.fillRect(rnd() * w, rnd() * h, s, s * (0.5 + rnd()));
    }
  }
  Q.makeTextures = function () {
    var r = mulberry(77), X = {};
    // 瓦：8 垄 × 8 行
    X.tile = tex(256, 256, function (g, w, h) {
      g.fillStyle = '#b3aa98'; g.fillRect(0, 0, w, h);
      var i, j;
      for (i = 0; i < 8; i++) {
        var x = i * 32;
        // 板瓦沟
        var gr = g.createLinearGradient(x, 0, x + 32, 0);
        gr.addColorStop(0, '#f2ebdc'); gr.addColorStop(0.22, '#e6dcc8'); gr.addColorStop(0.34, '#6e665a'); gr.addColorStop(0.5, '#9a917f');
        gr.addColorStop(0.78, '#8a8172'); gr.addColorStop(0.9, '#5d564b'); gr.addColorStop(1, '#f2ebdc');
        g.fillStyle = gr; g.fillRect(x, 0, 32, h);
      }
      for (j = 0; j < 8; j++) for (i = 0; i < 8; i++) {
        var y = j * 32 + (r() * 3 - 1.5);
        g.strokeStyle = 'rgba(50,42,34,' + (0.35 + r() * 0.3) + ')'; g.lineWidth = 1.6;
        g.beginPath(); g.moveTo(i * 32 + 10, y); g.quadraticCurveTo(i * 32 + 20, y + 5, i * 32 + 29, y); g.stroke();
        g.strokeStyle = 'rgba(60,50,40,0.35)'; g.lineWidth = 1;
        g.beginPath(); g.moveTo(i * 32 - 4, y + 14); g.lineTo(i * 32 + 8, y + 14); g.stroke();
      }
      speckle(g, w, h, 500, function (t) { return t > 0.5 ? 'rgba(255,245,220,0.10)' : 'rgba(40,30,20,0.12)'; }, 1, 5, r);
    });
    // 茅草
    X.thatch = tex(256, 256, function (g, w, h) {
      g.fillStyle = '#d9cfb4'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 2600; i++) {
        var x = r() * w, y = r() * h, l = 10 + r() * 34, t = r();
        g.strokeStyle = t > 0.6 ? 'rgba(255,248,225,0.5)' : t > 0.25 ? 'rgba(110,88,55,0.5)' : 'rgba(60,45,28,0.55)';
        g.lineWidth = 0.7 + r() * 1.2;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 5, y + l); g.stroke();
        if (y + l > h) { g.beginPath(); g.moveTo(x, y - h); g.lineTo(x + (r() - 0.5) * 5, y + l - h); g.stroke(); }
      }
      for (var j = 0; j < 4; j++) { g.fillStyle = 'rgba(70,52,30,0.22)'; g.fillRect(0, j * 64 + 58, w, 5); }
    });
    // 木板
    X.wood = tex(256, 256, function (g, w, h) {
      g.fillStyle = '#e6dcc6'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 900; i++) {
        var y = r() * h, x = r() * w, l = 20 + r() * 90;
        g.strokeStyle = r() > 0.5 ? 'rgba(90,65,40,0.22)' : 'rgba(255,250,235,0.25)'; g.lineWidth = 0.6 + r();
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + (r() - 0.5) * 2); g.stroke();
      }
      for (var j = 0; j < 8; j++) {
        g.fillStyle = 'rgba(50,36,22,0.55)'; g.fillRect(0, j * 32, w, 1.6);
        g.fillStyle = 'rgba(255,250,235,0.25)'; g.fillRect(0, j * 32 + 2, w, 1);
        for (var k = 0; k < 4; k++) { g.fillStyle = 'rgba(45,32,20,0.6)'; g.fillRect(((k * 64 + j * 23) % 256), j * 32 + 14, 2.2, 2.2); }
      }
    });
    // 砖
    X.brick = tex(256, 256, function (g, w, h) {
      g.fillStyle = '#cfc5b0'; g.fillRect(0, 0, w, h);
      for (var j = 0; j < 16; j++) for (var i = 0; i < 5; i++) {
        var x = i * 64 - (j % 2) * 32, y = j * 16, t = r();
        g.fillStyle = 'rgba(' + (t > 0.5 ? '255,245,225' : '70,55,40') + ',' + (r() * 0.16) + ')';
        g.fillRect(x + 1, y + 1, 62, 14);
        g.strokeStyle = 'rgba(55,44,34,0.55)'; g.lineWidth = 1.2; g.strokeRect(x + 0.5, y + 0.5, 64, 16);
      }
      speckle(g, w, h, 300, function (t) { return 'rgba(50,40,30,0.12)'; }, 1, 4, r);
    });
    // 粉墙
    X.plaster = tex(256, 256, function (g, w, h) {
      g.fillStyle = '#f4ecd8'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 60; i++) {
        var x = r() * w, y = r() * h, rad = 20 + r() * 60;
        var gr = g.createRadialGradient(x, y, 0, x, y, rad);
        gr.addColorStop(0, r() > 0.5 ? 'rgba(120,95,60,0.10)' : 'rgba(255,255,245,0.14)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
      speckle(g, w, h, 900, function (t) { return 'rgba(90,70,45,' + (0.05 + t * 0.08) + ')'; }, 1, 3, r);
      for (var k = 0; k < 14; k++) { g.strokeStyle = 'rgba(90,70,45,0.16)'; g.lineWidth = 1; var x2 = r() * w; g.beginPath(); g.moveTo(x2, r() * h); g.lineTo(x2 + (r() - 0.5) * 8, r() * h); g.stroke(); }
    });
    // 芦席（斜纹编织）
    X.mat = tex(128, 128, function (g, w, h) {
      g.fillStyle = '#e4d8b8'; g.fillRect(0, 0, w, h);
      for (var j = 0; j < 16; j++) for (var i = 0; i < 16; i++) {
        var d = (i + j) % 4 < 2;
        g.fillStyle = d ? 'rgba(120,95,55,0.42)' : 'rgba(255,248,225,0.3)';
        if (d) g.fillRect(i * 8, j * 8 + 1, 8, 6); else g.fillRect(i * 8 + 1, j * 8, 6, 8);
        g.strokeStyle = 'rgba(60,45,25,0.35)'; g.lineWidth = 0.6; g.strokeRect(i * 8 + 0.5, j * 8 + 0.5, 8, 8);
      }
    });
    // 树皮
    X.bark = tex(256, 256, function (g, w, h) {
      g.fillStyle = '#cdbfa6'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 700; i++) {
        var x = r() * w, y = r() * h, l = 14 + r() * 50;
        g.strokeStyle = r() > 0.35 ? 'rgba(40,30,22,' + (0.25 + r() * 0.35) + ')' : 'rgba(255,245,220,0.3)';
        g.lineWidth = 0.8 + r() * 2.4;
        g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + (r() - 0.5) * 16, y + l * 0.3, x + (r() - 0.5) * 16, y + l * 0.6, x + (r() - 0.5) * 10, y + l); g.stroke();
      }
      for (var k = 0; k < 26; k++) {
        var cx = r() * w, cy = r() * h, rr = 4 + r() * 10;
        g.strokeStyle = 'rgba(35,26,18,0.5)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(cx, cy, rr, rr * 1.4, 0, 0, 6.3); g.stroke();
        g.fillStyle = 'rgba(35,26,18,0.25)'; g.beginPath(); g.ellipse(cx, cy, rr * 0.5, rr * 0.7, 0, 0, 6.3); g.fill();
      }
    });
    // 格子窗
    X.lattice = tex(128, 128, function (g, w, h) {
      g.fillStyle = '#e9dfc4'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#4a3a2a'; g.lineWidth = 3;
      for (var i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 16, 0); g.lineTo(i * 16, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 16); g.lineTo(w, i * 16); g.stroke(); }
      g.strokeStyle = 'rgba(255,250,235,0.35)'; g.lineWidth = 1;
      for (i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 16 + 2.5, 0); g.lineTo(i * 16 + 2.5, h); g.stroke(); }
    });
    // 夯土、土坡
    X.earth = tex(256, 256, function (g, w, h) {
      g.fillStyle = '#e9dfc8'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 90; i++) {
        var x = r() * w, y = r() * h, rad = 10 + r() * 50;
        var gr = g.createRadialGradient(x, y, 0, x, y, rad);
        gr.addColorStop(0, r() > 0.5 ? 'rgba(95,72,42,0.16)' : 'rgba(255,250,230,0.16)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
      for (var k = 0; k < 500; k++) { g.strokeStyle = 'rgba(70,52,32,' + (0.08 + r() * 0.14) + ')'; g.lineWidth = 0.8; var x2 = r() * w, y2 = r() * h; g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 + 6 + r() * 16, y2 + (r() - 0.5) * 3); g.stroke(); }
    });
    // 条石
    X.stone = tex(256, 256, function (g, w, h) {
      g.fillStyle = '#d8cfbc'; g.fillRect(0, 0, w, h);
      for (var j = 0; j < 6; j++) for (var i = 0; i < 4; i++) {
        var x = i * 86 - (j % 2) * 43, y = j * 43;
        g.fillStyle = 'rgba(' + (r() > 0.5 ? '255,250,235' : '80,65,48') + ',' + (r() * 0.14) + ')'; g.fillRect(x, y, 86, 43);
        g.strokeStyle = 'rgba(60,48,36,0.5)'; g.lineWidth = 1.5; g.strokeRect(x + 0.5, y + 0.5, 86, 43);
      }
      speckle(g, w, h, 500, function () { return 'rgba(60,48,36,0.1)'; }, 1, 4, r);
    });
    // 布（旗幌、伞面）
    X.cloth = tex(64, 64, function (g, w, h) {
      g.fillStyle = '#f4eede'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 64; i += 2) { g.fillStyle = 'rgba(120,100,70,0.07)'; g.fillRect(i, 0, 1, h); g.fillRect(0, i, w, 1); }
    });
    // 水纹
    X.water = tex(512, 512, function (g, w, h) {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 46; i++) {
        var x = r() * w, y = r() * h, rr = 14 + r() * 26;
        for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++) {
          g.strokeStyle = 'rgba(70,58,38,' + (0.20 + r() * 0.12) + ')'; g.lineWidth = 1.3;
          g.beginPath();
          // 画里那种一圈圈的涡纹
          var px = x + dx * w, py = y + dy * h;
          g.moveTo(px - rr, py);
          g.bezierCurveTo(px - rr * 0.5, py - rr * 0.35, px + rr * 0.3, py - rr * 0.3, px + rr * 0.6, py);
          g.bezierCurveTo(px + rr * 0.7, py + rr * 0.25, px + rr * 0.1, py + rr * 0.3, px, py + rr * 0.05);
          g.stroke();
        }
      }
      for (var k = 0; k < 160; k++) {
        var x2 = r() * w, y2 = r() * h, l = 20 + r() * 50;
        g.strokeStyle = r() > 0.5 ? 'rgba(80,66,44,0.16)' : 'rgba(255,250,230,0.25)'; g.lineWidth = 1;
        g.beginPath(); g.moveTo(x2, y2); g.quadraticCurveTo(x2 + l * 0.5, y2 + (r() - 0.5) * 8, x2 + l, y2); g.stroke();
      }
    });
    // 绢底细纹（地面细节，乘在大地图上）
    X.silk = tex(256, 256, function (g, w, h) {
      g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, w, h);
      var i;
      for (i = 0; i < w; i += 2) { g.fillStyle = 'rgba(90,70,40,' + (0.03 + r() * 0.05) + ')'; g.fillRect(i, 0, 1, h); }
      for (i = 0; i < h; i += 2) { g.fillStyle = 'rgba(90,70,40,' + (0.03 + r() * 0.05) + ')'; g.fillRect(0, i, w, 1); }
      speckle(g, w, h, 2600, function (t) { return t > 0.55 ? 'rgba(255,255,255,0.14)' : 'rgba(70,50,25,0.10)'; }, 1, 4, r);
    });
    Q.texs = X;
    return X;
  };

  // ---------- 材质 ----------
  Q.uTime = { value: 0 };
  function swayPatch(mat, amp) {
    mat.onBeforeCompile = function (sh) {
      sh.uniforms.uTime = Q.uTime;
      sh.vertexShader = 'attribute float aux;\nuniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>',
        '#include <begin_vertex>\n float sw = aux * ' + amp.toFixed(3) + ';\n transformed.x += sw * sin(uTime*1.3 + position.x*0.31 + position.y*0.8 + position.z*0.27);\n transformed.z += sw * 0.7 * cos(uTime*1.05 + position.x*0.43 + position.y*0.6);\n transformed.y += sw * 0.25 * sin(uTime*1.7 + position.z*0.5 + position.x*0.2);');
    };
  }
  function tintPatch(mat) {
    mat.onBeforeCompile = function (sh) {
      sh.vertexShader = 'attribute float aux;\n' + sh.vertexShader.replace('vColor.xyz *= instanceColor.xyz;', 'vColor.xyz *= mix(vec3(1.0), instanceColor.xyz, aux);');
    };
  }
  Q.makeMaterials = function () {
    var X = Q.makeTextures(), M = {};
    function L(map, extra) {
      var o = { vertexColors: true, side: T.DoubleSide };
      if (map) o.map = map;
      if (extra) for (var k in extra) o[k] = extra[k];
      return new T.MeshLambertMaterial(o);
    }
    M.plain = L(null); M.tile = L(X.tile); M.thatch = L(X.thatch); M.wood = L(X.wood); M.brick = L(X.brick);
    M.plaster = L(X.plaster); M.mat = L(X.mat); M.bark = L(X.bark); M.lattice = L(X.lattice); M.earth = L(X.earth); M.stone = L(X.stone);
    M.cloth = L(X.cloth); swayPatch(M.cloth, 0.22);
    M.inst = L(null); tintPatch(M.inst);
    M.twig = new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85 }); swayPatch(M.twig, 0.5);
    M.rope = new T.LineBasicMaterial({ vertexColors: true });
    Q.mats = M;
    return M;
  };

  // ---------- 实例池 ----------
  Q.pools = {};
  Q.pool = function (name, fn) {
    var p = Q.pools[name];
    if (!p) { p = Q.pools[name] = { name: name, geom: Q.geomFrom(fn), need: 0, n: 0, max: 0 }; }
    return p;
  };
  Q.finalizePools = function (scene) {
    var total = 0;
    for (var k in Q.pools) {
      var p = Q.pools[k]; if (!p.need) continue;
      p.max = p.need;
      var mesh = new T.InstancedMesh(p.geom, Q.mats.inst, p.max);
      mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
      mesh.instanceColor = new T.InstancedBufferAttribute(new Float32Array(p.max * 3), 3);
      mesh.instanceColor.setUsage(T.DynamicDrawUsage);
      mesh.frustumCulled = false; mesh.count = 0; mesh.matrixAutoUpdate = false;
      p.mesh = mesh; p.ma = mesh.instanceMatrix.array; p.ca = mesh.instanceColor.array;
      p.tris = p.geom.index.count / 3;
      scene.add(mesh); total++;
    }
    return total;
  };
  Q.put = function (p, m, c) {
    var i = p.n; if (i >= p.max) return; p.n = i + 1;
    var a = p.ma, o = i * 16;
    a[o] = m[0]; a[o + 1] = m[3]; a[o + 2] = m[6]; a[o + 3] = 0;
    a[o + 4] = m[1]; a[o + 5] = m[4]; a[o + 6] = m[7]; a[o + 7] = 0;
    a[o + 8] = m[2]; a[o + 9] = m[5]; a[o + 10] = m[8]; a[o + 11] = 0;
    a[o + 12] = m[9]; a[o + 13] = m[10]; a[o + 14] = m[11]; a[o + 15] = 1;
    var ca = p.ca, k = i * 3; ca[k] = c[0]; ca[k + 1] = c[1]; ca[k + 2] = c[2];
  };
  Q.flushPools = function () {
    var tris = 0, calls = 0;
    for (var k in Q.pools) {
      var p = Q.pools[k]; if (!p.mesh) continue;
      p.mesh.count = p.n; p.mesh.visible = p.n > 0;
      if (p.n) { p.mesh.instanceMatrix.needsUpdate = true; p.mesh.instanceColor.needsUpdate = true; tris += p.n * p.tris; calls++; }
      p.n = 0;
    }
    Q.stats.instTris = tris; Q.stats.instCalls = calls;
  };

  // ---------- 3×4 仿射矩阵小库（关节动画用，避免每帧分配对象） ----------
  // m = [r00,r01,r02, r10,r11,r12, r20,r21,r22, tx,ty,tz]
  var M = Q.M = {
    make: function () { return [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]; },
    ident: function (o) { o[0] = 1; o[1] = 0; o[2] = 0; o[3] = 0; o[4] = 1; o[5] = 0; o[6] = 0; o[7] = 0; o[8] = 1; o[9] = 0; o[10] = 0; o[11] = 0; return o; },
    copy: function (o, a) { for (var i = 0; i < 12; i++) o[i] = a[i]; return o; },
    // o = a * T(x,y,z)
    tr: function (o, a, x, y, z) {
      if (o !== a) for (var i = 0; i < 9; i++) o[i] = a[i];
      var tx = a[9] + a[0] * x + a[1] * y + a[2] * z, ty = a[10] + a[3] * x + a[4] * y + a[5] * z, tz = a[11] + a[6] * x + a[7] * y + a[8] * z;
      o[9] = tx; o[10] = ty; o[11] = tz; return o;
    },
    rx: function (o, a, t) {
      var c = Math.cos(t), s = Math.sin(t);
      for (var i = 0; i < 3; i++) { var p = a[i * 3 + 1], q = a[i * 3 + 2]; o[i * 3] = a[i * 3]; o[i * 3 + 1] = p * c + q * s; o[i * 3 + 2] = -p * s + q * c; }
      o[9] = a[9]; o[10] = a[10]; o[11] = a[11]; return o;
    },
    ry: function (o, a, t) {
      var c = Math.cos(t), s = Math.sin(t);
      for (var i = 0; i < 3; i++) { var p = a[i * 3], q = a[i * 3 + 2]; o[i * 3 + 1] = a[i * 3 + 1]; o[i * 3] = p * c - q * s; o[i * 3 + 2] = p * s + q * c; }
      o[9] = a[9]; o[10] = a[10]; o[11] = a[11]; return o;
    },
    rz: function (o, a, t) {
      var c = Math.cos(t), s = Math.sin(t);
      for (var i = 0; i < 3; i++) { var p = a[i * 3], q = a[i * 3 + 1]; o[i * 3 + 2] = a[i * 3 + 2]; o[i * 3] = p * c + q * s; o[i * 3 + 1] = -p * s + q * c; }
      o[9] = a[9]; o[10] = a[10]; o[11] = a[11]; return o;
    },
    sc: function (o, a, s) { for (var i = 0; i < 9; i++) o[i] = a[i] * s; o[9] = a[9]; o[10] = a[10]; o[11] = a[11]; return o; },
    // o = a * b
    mul: function (o, a, b) {
      var r = new Array(12);
      for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 3; j++) r[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
        r[9 + i] = a[9 + i] + a[i * 3] * b[9] + a[i * 3 + 1] * b[10] + a[i * 3 + 2] * b[11];
      }
      for (var k = 0; k < 12; k++) o[k] = r[k]; return o;
    },
    // 由 THREE.Matrix4 取
    from4: function (o, e) { o[0] = e[0]; o[1] = e[4]; o[2] = e[8]; o[3] = e[1]; o[4] = e[5]; o[5] = e[9]; o[6] = e[2]; o[7] = e[6]; o[8] = e[10]; o[9] = e[12]; o[10] = e[13]; o[11] = e[14]; return o; },
    // 位置+朝向
    pose: function (o, x, y, z, yaw, s) {
      var c = Math.cos(yaw), sn = Math.sin(yaw); s = s || 1;
      o[0] = c * s; o[1] = 0; o[2] = sn * s; o[3] = 0; o[4] = s; o[5] = 0; o[6] = -sn * s; o[7] = 0; o[8] = c * s; o[9] = x; o[10] = y; o[11] = z; return o;
    },
    pt: function (a, x, y, z) { return [a[9] + a[0] * x + a[1] * y + a[2] * z, a[10] + a[3] * x + a[4] * y + a[5] * z, a[11] + a[6] * x + a[7] * y + a[8] * z]; }
  };

  Q.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  Q.lerp = function (a, b, t) { return a + (b - a) * t; };
  Q.smooth = function (a, b, x) { var t = Q.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  // 动态实体表
  Q.ents = [];
  Q.scenes = []; Q.tickers = [];
  Q.addEnt = function (e) { Q.ents.push(e); return e; };
})();
