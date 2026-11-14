/* 建筑与街市陈设：房屋（瓦顶/草顶、悬山/庑殿/歇山、楼阁平座）、彩楼欢门、虹桥、平桥、城门城楼、
   招牌旗幌、桌凳摊棚、大伞、井、篱笆等。全部写进静态合并网格。 */
(function () {
  'use strict';
  var Q = window.Q, COL = Q.COL, W = Q.W, UVS = Q.UVS;
  var K = Q.K = {};
  COL.stone = Q.C(0xb5a68a); COL.dark = Q.C(0x2e261e); COL.paper = Q.C(0xe6d9b8);

  // 当前局部坐标 → 世界坐标 / 朝向
  Q.Batch.prototype.world = function (x, y, z) { var m = this.m; return [m[9] + m[0] * x + m[1] * y + m[2] * z, m[10] + m[3] * x + m[4] * y + m[5] * z, m[11] + m[6] * x + m[7] * y + m[8] * z]; };
  Q.Batch.prototype.yaw = function () { return Math.atan2(this.m[2], this.m[8]); };

  // ---------- 招牌文字图集 ----------
  var atlas = null;
  function getAtlas() {
    if (atlas) return atlas;
    var c = Q.canvas(2048, 2048), g = c.getContext('2d');
    g.fillStyle = '#e6d9b8'; g.fillRect(0, 0, 2048, 2048);
    var t = new THREE.CanvasTexture(c); t.anisotropy = 4;
    Q.mats.sign = new THREE.MeshLambertMaterial({ map: t, vertexColors: true, side: THREE.DoubleSide });
    atlas = { c: c, g: g, x: 2, y: 2, rowH: 0, tex: t, cache: {} };
    return atlas;
  }
  K.signTex = function (text, vertical, style) {
    var A = getAtlas(), key = text + '|' + vertical + '|' + style;
    if (A.cache[key]) return A.cache[key];
    var n = text.length, cs = 52, pad = 8;
    var w = vertical ? cs + pad * 2 : n * cs + pad * 2, h = vertical ? n * cs + pad * 2 : cs + pad * 2;
    if (A.x + w > 2046) { A.x = 2; A.y += A.rowH + 4; A.rowH = 0; }
    var x = A.x, y = A.y, g = A.g; A.x += w + 4; A.rowH = Math.max(A.rowH, h);
    var bg = style === 1 ? '#3b2d22' : style === 2 ? '#efe6cf' : style === 3 ? '#8f4a36' : '#e2d3ad';
    var fg = style === 1 ? '#ead9b0' : style === 3 ? '#f0e2c0' : '#2a2018';
    g.fillStyle = bg; g.fillRect(x, y, w, h);
    g.strokeStyle = style === 1 ? '#c9b78c' : '#4a382a'; g.lineWidth = 3; g.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5);
    g.fillStyle = fg; g.font = '46px "QMKai","KaiTi","STKaiti",serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (var i = 0; i < n; i++) {
      if (vertical) g.fillText(text[i], x + w / 2, y + pad + cs * (i + 0.5) + 2);
      else g.fillText(text[i], x + pad + cs * (i + 0.5), y + h / 2 + 2);
    }
    A.tex.needsUpdate = true;
    var r = { u0: x / 2048, u1: (x + w) / 2048, v0: 1 - (y + h) / 2048, v1: 1 - y / 2048, asp: w / h };
    A.cache[key] = r; return r;
  };
  // 招牌：o {vertical, size(字高), style, post(立柱招牌), hang(挂在横杆下)}
  K.sign = function (b, text, x, y, z, ry, o) {
    o = o || {};
    var vert = o.vertical !== false, size = o.size || 0.5, st = o.style || 0;
    var r = K.signTex(text, vert, st), n = text.length;
    var w = vert ? size * 1.25 : size * (n + 0.3), h = vert ? size * (n + 0.3) : size * 1.25;
    b.push(x, y, z, ry || 0);
    var white = [1, 1, 1], wd = Q.COL.woodDark;
    if (o.post) { // 落地立牌：两根立柱夹一块牌
      var ph = h + (o.clear || 1.2);
      b.beam('wood', [-w / 2 - 0.06, 0, 0], [-w / 2 - 0.06, ph + 0.15, 0], 0.09, 0.09, wd);
      b.beam('wood', [w / 2 + 0.06, 0, 0], [w / 2 + 0.06, ph + 0.15, 0], 0.09, 0.09, wd);
      b.beam('wood', [-w / 2 - 0.2, ph + 0.05, 0], [w / 2 + 0.2, ph + 0.05, 0], 0.1, 0.08, wd);
      b.box('stone', 0, 0.1, 0, w + 0.5, 0.2, 0.5, COL.stone);
      b.push(0, ph - h, 0, 0);
    } else b.push(0, 0, 0, 0);
    var uv = [r.u0, r.v0, r.u1, r.v0, r.u1, r.v1, r.u0, r.v1];
    b.quad('sign', [-w / 2, 0, 0.03], [w / 2, 0, 0.03], [w / 2, h, 0.03], [-w / 2, h, 0.03], white, uv);
    b.quad('sign', [w / 2, 0, -0.03], [-w / 2, 0, -0.03], [-w / 2, h, -0.03], [w / 2, h, -0.03], white, uv);
    b.box('plain', 0, h / 2, 0, w + 0.04, h + 0.04, 0.05, wd);
    b.pop(); b.pop();
  };
  // 旗幌：一根高杆挑出横杆，垂下条纹布幅
  K.flag = function (b, x, z, ry, o) {
    o = o || {};
    var H = o.h || 6.5, w = o.w || 1.5, len = o.len || 2.6, bands = o.bands || 3;
    var c1 = o.c1 || Q.shade(COL.blue, 0.95), c2 = o.c2 || COL.white;
    b.push(x, 0, z, ry || 0);
    b.cyl('wood', [0, 0, 0], [0, H, 0], 0.07, 0.045, 5, COL.woodDark);
    b.beam('wood', [-0.15, H - 0.3, 0], [w + 0.25, H - 0.3, 0], 0.05, 0.05, COL.woodDark);
    var rows = 5;
    for (var i = 0; i < bands; i++) {
      var xa = 0.1 + i * w / bands, xb = 0.1 + (i + 1) * w / bands, c = i % 2 ? c2 : c1;
      for (var j = 0; j < rows; j++) {
        var ya = H - 0.34 - j * len / rows, yb = H - 0.34 - (j + 1) * len / rows;
        var s0 = j / rows * 0.9, s1 = (j + 1) / rows * 0.9;
        K._swayQuad(b, [xa, yb, 0], [xb, yb, 0], [xb, ya, 0], [xa, ya, 0], c, s1, s1, s0, s0);
      }
    }
    if (o.text) { b.aux = 0; K.sign(b, o.text, 0.1 + w / 2, H - 0.5 - len * 0.82, 0.03, 0, { vertical: true, size: Math.min(0.42, len * 0.75 / o.text.length), style: 2 }); }
    b.pop();
  };
  // 四角各自摆动权重的布面四边形
  K._swayQuad = function (b, A, B, C, D, col, wa, wb, wc, wd) {
    var buf = b.buf('cloth'), n0 = buf.nv;
    b.aux = 0; b.quad('cloth', A, B, C, D, col);
    buf.aux[n0] = wa * 255; buf.aux[n0 + 1] = wb * 255; buf.aux[n0 + 2] = wc * 255; buf.aux[n0 + 3] = wd * 255;
  };
  // 悬挂的布帘/幌子（宽 w，高 h，顶边固定）
  K.curtain = function (b, x, y, z, ry, w, h, col, sway) {
    b.push(x, y, z, ry || 0);
    var n = Math.max(1, Math.round(w / 0.8));
    for (var i = 0; i < n; i++) {
      var xa = -w / 2 + i * w / n, xb = xa + w / n, c = Q.jit(col, 0.05);
      K._swayQuad(b, [xa, -h, 0], [xb, -h, 0], [xb, 0, 0], [xa, 0, 0], c, sway || 0.25, sway || 0.25, 0, 0);
    }
    b.pop();
  };

  // ---------- 屋顶 ----------
  function profile(n, R, H, p) { var a = []; for (var k = 0; k <= n; k++) { var t = k / n; a.push([t * R, H * Math.pow(1 - t, p), t]); } return a; }
  // 悬山顶（瓦或草）。局部坐标：脊沿 X，前坡朝 +Z。y0 为檐口处墙顶高度。
  K.gableRoof = function (b, w, d, y0, o) {
    o = o || {};
    var thatch = o.roof === 'thatch', matR = thatch ? 'thatch' : (o.roof === 'mat' ? 'mat' : 'tile');
    var ov = o.ov === undefined ? (thatch ? 0.75 : 0.9) : o.ov, gov = o.gov === undefined ? 0.6 : o.gov;
    var R = d / 2 + ov, H = (o.pitch || (thatch ? 0.78 : 0.6)) * R, p = thatch ? 1.12 : 1.3, n = thatch ? 3 : 4;
    var pr = profile(n, R, H, p), tw = (d / 2) / R;
    var Y0 = y0 + 0.1 - H * Math.pow(1 - tw, p);
    var x0 = -w / 2 - gov, x1 = w / 2 + gov, L = x1 - x0;
    var colT = o.roofCol || (thatch ? Q.jit(COL.thatch, 0.1) : Q.jit(COL.tile, 0.08));
    var us = UVS[matR], k, sg;
    for (sg = -1; sg <= 1; sg += 2) {
      var v = 0;
      for (k = 0; k < n; k++) {
        var a = pr[k], c = pr[k + 1], sl = Math.hypot(c[0] - a[0], c[1] - a[1]);
        var sh = 0.92 + 0.08 * (sg > 0 ? 1 : 0.6);
        b.quad(matR, [x0, Y0 + c[1], sg * c[0]], [x1, Y0 + c[1], sg * c[0]], [x1, Y0 + a[1], sg * a[0]], [x0, Y0 + a[1], sg * a[0]], Q.shade(colT, sh),
          [0, (v + sl) * us, L * us, (v + sl) * us, L * us, v * us, 0, v * us]);
        v += sl;
      }
    }
    var eY = Y0 + pr[n][1];
    // 檐下望板
    b.quad('wood', [x0 + 0.05, eY + 0.02, -R + 0.05], [x1 - 0.05, eY + 0.02, -R + 0.05], [x1 - 0.05, eY + 0.02, R - 0.05], [x0 + 0.05, eY + 0.02, R - 0.05], Q.shade(COL.woodDark, 0.8));
    if (thatch) {
      var tc = Q.shade(colT, 0.7);
      for (sg = -1; sg <= 1; sg += 2) {
        b.quad('thatch', [x0, eY - 0.2, sg * (R - 0.05)], [x1, eY - 0.2, sg * (R - 0.05)], [x1, eY, sg * R], [x0, eY, sg * R], tc);
        for (k = 0; k < n; k++) for (var e = 0; e < 2; e++) {
          var xx = e ? x1 : x0, a2 = pr[k], c2 = pr[k + 1];
          b.quad('thatch', [xx, Y0 + c2[1] - 0.2, sg * c2[0]], [xx, Y0 + a2[1] - 0.2, sg * a2[0]], [xx, Y0 + a2[1], sg * a2[0]], [xx, Y0 + c2[1], sg * c2[0]], tc);
        }
      }
      b.cyl('thatch', [x0 - 0.05, Y0 + H + 0.02, 0], [x1 + 0.05, Y0 + H + 0.02, 0], 0.24, 0.24, 6, Q.shade(colT, 0.85), true, true);
      for (var q = 0; q < Math.floor(L / 1.6); q++) { var bx = x0 + 0.8 + q * 1.6; b.box('plain', bx, Y0 + H + 0.03, 0, 0.09, 0.55, 0.62, Q.shade(COL.thatchDark, 0.75)); }
    } else if (matR === 'tile') {
      // 瓦垄：隔一垄起一条筒瓦
      if (o.strips !== false) {
        var hi = Q.shade(colT, 1.22), lo = Q.shade(colT, 0.62);
        for (var sx = x0 + 0.32; sx < x1 - 0.2; sx += 0.6) {
          for (sg = -1; sg <= 1; sg += 2) for (k = 0; k < n; k++) {
            var a3 = pr[k], c3 = pr[k + 1];
            b.quad('plain', [sx - 0.07, Y0 + c3[1] + 0.005, sg * c3[0]], [sx, Y0 + c3[1] + 0.085, sg * c3[0]], [sx, Y0 + a3[1] + 0.085, sg * a3[0]], [sx - 0.07, Y0 + a3[1] + 0.005, sg * a3[0]], hi);
            b.quad('plain', [sx, Y0 + c3[1] + 0.085, sg * c3[0]], [sx + 0.07, Y0 + c3[1] + 0.005, sg * c3[0]], [sx + 0.07, Y0 + a3[1] + 0.005, sg * a3[0]], [sx, Y0 + a3[1] + 0.085, sg * a3[0]], lo);
          }
        }
      }
      var dk = Q.shade(COL.tileDark, 0.85);
      // 正脊与两端起翘
      b.box('plain', 0, Y0 + H + 0.1, 0, L - 0.1, 0.3, 0.26, dk);
      b.box('plain', 0, Y0 + H + 0.28, 0, L - 0.3, 0.07, 0.34, Q.shade(dk, 1.25));
      for (sg = -1; sg <= 1; sg += 2) {
        b.beam('plain', [sg * (L / 2 - 0.35), Y0 + H + 0.2, 0], [sg * (L / 2 + 0.05), Y0 + H + 0.62, 0], 0.22, 0.2, dk, true);
        b.beam('plain', [sg * (L / 2 + 0.03), Y0 + H + 0.58, 0], [sg * (L / 2 - 0.12), Y0 + H + 0.82, 0], 0.16, 0.12, dk, true);
      }
      // 垂脊、博风板、悬鱼
      for (var e2 = -1; e2 <= 1; e2 += 2) {
        var gx = e2 * (L / 2 - 0.14);
        for (sg = -1; sg <= 1; sg += 2) {
          for (k = 0; k < n; k++) {
            var a4 = pr[k], c4 = pr[k + 1];
            b.beam('plain', [gx, Y0 + a4[1] + 0.09, sg * a4[0]], [gx, Y0 + c4[1] + 0.09 + (k === n - 1 ? 0.12 : 0), sg * c4[0]], 0.2, 0.16, dk);
            b.beam('wood', [e2 * (L / 2), Y0 + a4[1] - 0.16, sg * a4[0]], [e2 * (L / 2), Y0 + c4[1] - 0.16, sg * c4[0]], 0.05, 0.3, COL.woodDark);
          }
        }
        b.box('wood', e2 * (L / 2 + 0.01), Y0 + H - 0.5, 0, 0.04, 0.5, 0.26, COL.woodDark);
      }
      // 檐口连檐
      for (sg = -1; sg <= 1; sg += 2) b.beam('wood', [x0, eY - 0.03, sg * (R - 0.04)], [x1, eY - 0.03, sg * (R - 0.04)], 0.1, 0.1, COL.woodDark);
    }
    // 山墙
    if (o.gableWall !== false) {
      var wc = o.wallCol || COL.plaster;
      for (var e3 = -1; e3 <= 1; e3 += 2) {
        var gx2 = e3 * w / 2, pts = [];
        for (k = 0; k <= 8; k++) { var zz = -d / 2 + k * d / 8, t = Math.abs(zz) / R; pts.push([gx2, Y0 + H * Math.pow(1 - t, p) - 0.04, zz]); }
        for (k = 0; k < 8; k++) b.quad(thatch ? 'earth' : 'plaster', [gx2, y0 - 0.02, pts[k][2]], [gx2, y0 - 0.02, pts[k + 1][2]], pts[k + 1], pts[k], wc);
        b.beam('wood', [gx2 + e3 * 0.03, y0, -d / 2], [gx2 + e3 * 0.03, y0, d / 2], 0.08, 0.2, COL.woodDark);
        b.beam('wood', [gx2 + e3 * 0.03, y0, 0], [gx2 + e3 * 0.03, Y0 + H - 0.1, 0], 0.08, 0.16, COL.woodDark);
        if (d > 5) for (sg = -1; sg <= 1; sg += 2) b.beam('wood', [gx2 + e3 * 0.03, y0, sg * d / 4], [gx2 + e3 * 0.03, Y0 + H * Math.pow(1 - (d / 4) / R, p) - 0.1, sg * d / 4], 0.08, 0.12, COL.woodDark);
      }
    }
    return { ridgeY: Y0 + H, eaveY: eY, R: R };
  };

  // 庑殿 / 歇山顶。rh: 正脊半长；tb: 歇山山面起点(0 为庑殿)
  K.hipRoof = function (b, w, d, y0, o) {
    o = o || {};
    var thatch = o.roof === 'thatch', matR = thatch ? 'thatch' : 'tile';
    var ov = o.ov === undefined ? (thatch ? 0.8 : 1.15) : o.ov;
    var R = d / 2 + ov, H = (o.pitch || (thatch ? 0.8 : 0.62)) * R, p = thatch ? 1.1 : 1.38, n = thatch ? 3 : 5;
    var tb = o.tb || 0, XE = w / 2 + ov;
    var rh = o.rh !== undefined ? o.rh : (tb ? w / 2 - 0.35 * d * (1 - tb) : Math.max(0.4, w / 2 - d / 2 * 0.82));
    var lift = o.lift === undefined ? (thatch ? 0 : 0.42) : o.lift, cz = o.cz || 1.5;
    var tw = (d / 2) / R, Y0 = y0 + 0.1 - H * Math.pow(1 - tw, p);
    var colT = o.roofCol || (thatch ? Q.jit(COL.thatch, 0.1) : Q.jit(COL.tile, 0.08));
    var us = UVS[matR], dk = Q.shade(COL.tileDark, 0.85);
    function yT(t) { return Y0 + H * Math.pow(1 - t, p); }
    function hx(t) { return t <= tb ? rh : rh + (XE - rh) * (t - tb) / (1 - tb); }
    // 四个坡面的通用发射：lat(t) 为半宽，pt(t,s) 给出点
    var slopes = [
      { t0: 0, lat: hx, pt: function (t, s, y) { return [s, y, t * R]; }, sh: 1.0 },
      { t0: 0, lat: hx, pt: function (t, s, y) { return [-s, y, -t * R]; }, sh: 0.86 },
      { t0: tb, lat: function (t) { return t * R; }, pt: function (t, s, y) { return [hx(t), y, -s]; }, sh: 0.93 },
      { t0: tb, lat: function (t) { return t * R; }, pt: function (t, s, y) { return [-hx(t), y, s]; }, sh: 0.9 }
    ];
    function liftAt(t, s, lat) { if (!lift) return 0; var c = Math.min(cz, lat * 0.6), f = (Math.abs(s) - (lat - c)) / c; return f > 0 ? lift * f * f * t * t * t : 0; }
    slopes.forEach(function (S, si) {
      var ts = []; var k;
      for (k = 0; k <= n; k++) { var t = S.t0 + (1 - S.t0) * k / n; ts.push(t); }
      var v = 0, col = Q.shade(colT, S.sh);
      for (k = 0; k < n; k++) {
        var ta = ts[k], tc2 = ts[k + 1], la = S.lat(ta), lc = S.lat(tc2), ya = yT(ta), yc = yT(tc2);
        var sl = Math.hypot((tc2 - ta) * R, yc - ya);
        var ca = Math.min(cz, la * 0.6), cc = Math.min(cz, lc * 0.6);
        var sa = [-la, -la + ca, la - ca, la], sc = [-lc, -lc + cc, lc - cc, lc];
        for (var j = 0; j < 3; j++) {
          if (j !== 1 && la < 1e-3 && lc < 1e-3) continue;
          var A = S.pt(tc2, sc[j], yc + liftAt(tc2, sc[j], lc)), B = S.pt(tc2, sc[j + 1], yc + liftAt(tc2, sc[j + 1], lc));
          var C2 = S.pt(ta, sa[j + 1], ya + liftAt(ta, sa[j + 1], la)), D = S.pt(ta, sa[j], ya + liftAt(ta, sa[j], la));
          b.quad(matR, A, B, C2, D, col, [sc[j] * us, (v + sl) * us, sc[j + 1] * us, (v + sl) * us, sa[j + 1] * us, v * us, sa[j] * us, v * us]);
        }
        v += sl;
      }
      // 瓦垄
      if (!thatch && o.strips !== false) {
        var hi = Q.shade(col, 1.22), lo = Q.shade(col, 0.62), le = S.lat(1);
        for (var s = -Math.floor((le - 0.25) / 0.6) * 0.6; s < le - 0.2; s += 0.6) {
          // 这条垄从哪里开始（被戗脊截断）
          var tStart = S.t0;
          for (var q = 0; q <= 20; q++) { var tt = S.t0 + (1 - S.t0) * q / 20; if (S.lat(tt) >= Math.abs(s) + 0.1) { tStart = tt; break; } tStart = 1; }
          if (tStart >= 0.98) continue;
          var prev = null;
          for (k = 0; k <= n; k++) {
            var t2 = tStart + (1 - tStart) * k / n, l2 = S.lat(t2), y2 = yT(t2) + liftAt(t2, s, l2);
            var cur = [S.pt(t2, s - 0.07, y2 + 0.005), S.pt(t2, s, y2 + 0.085), S.pt(t2, s + 0.07, y2 + 0.005)];
            if (prev) { b.quad('plain', cur[0], cur[1], prev[1], prev[0], hi); b.quad('plain', cur[1], cur[2], prev[2], prev[1], lo); }
            prev = cur;
          }
        }
      }
    });
    // 檐下望板
    var eY = yT(1);
    b.quad('wood', [-XE + 0.1, eY + 0.03, -R + 0.1], [XE - 0.1, eY + 0.03, -R + 0.1], [XE - 0.1, eY + 0.03, R - 0.1], [-XE + 0.1, eY + 0.03, R - 0.1], Q.shade(COL.woodDark, 0.8));
    // 正脊、戗脊
    var rc = thatch ? Q.shade(colT, 0.8) : dk, rm = thatch ? 'thatch' : 'plain';
    if (thatch) b.cyl('thatch', [-rh - 0.1, Y0 + H, 0], [rh + 0.1, Y0 + H, 0], 0.26, 0.26, 6, rc, true, true);
    else {
      b.box('plain', 0, Y0 + H + 0.12, 0, rh * 2 + 0.2, 0.34, 0.3, dk);
      for (var sg = -1; sg <= 1; sg += 2) {
        b.beam('plain', [sg * (rh - 0.2), Y0 + H + 0.25, 0], [sg * (rh + 0.12), Y0 + H + 0.75, 0], 0.26, 0.24, dk, true);
        b.beam('plain', [sg * (rh + 0.1), Y0 + H + 0.7, 0], [sg * (rh - 0.1), Y0 + H + 0.98, 0], 0.18, 0.14, dk, true);
      }
    }
    for (var ex = -1; ex <= 1; ex += 2) for (var ez = -1; ez <= 1; ez += 2) {
      var prevP = null;
      for (var k2 = 0; k2 <= n; k2++) {
        var t3 = tb + (1 - tb) * k2 / n, P = [ex * hx(t3), yT(t3) + (lift ? lift * t3 * t3 * t3 : 0) + 0.08, ez * t3 * R];
        if (prevP) { if (thatch) b.cyl('thatch', prevP, P, 0.17, 0.17, 5, rc); else b.beam('plain', prevP, P, 0.2, 0.17, dk); }
        prevP = P;
      }
      if (!thatch) b.beam('plain', prevP, [prevP[0] + ex * 0.22, prevP[1] + 0.3, prevP[2] + ez * 0.22], 0.14, 0.12, dk, true);
      // 歇山：上半段山面与垂脊
      if (tb > 0) {
        var pp = null;
        for (var k3 = 0; k3 <= 3; k3++) {
          var t4 = tb * k3 / 3, P2 = [ex * rh, yT(t4) + 0.08, ez * t4 * R];
          if (pp) { b.beam('plain', pp, P2, 0.2, 0.17, dk); b.beam('wood', [pp[0] + ex * 0.12, pp[1] - 0.26, pp[2]], [P2[0] + ex * 0.12, P2[1] - 0.26, P2[2]], 0.05, 0.3, COL.woodDark); }
          pp = P2;
        }
      }
    }
    if (tb > 0) {
      for (var e4 = -1; e4 <= 1; e4 += 2) {
        var gx = e4 * (rh - 0.08), yb = yT(tb) - 0.02;
        for (var k4 = 0; k4 < 6; k4++) {
          var za = -tb * R + k4 * tb * R / 3, zb = za + tb * R / 3;
          b.quad('plaster', [gx, yb, za], [gx, yb, zb], [gx, yT(Math.abs(zb) / R) - 0.05, zb], [gx, yT(Math.abs(za) / R) - 0.05, za], COL.plasterDark);
        }
        b.box('wood', e4 * (rh + 0.14), Y0 + H - 0.5, 0, 0.04, 0.55, 0.3, COL.woodDark);
        b.beam('wood', [gx + e4 * 0.05, yb + 0.05, -tb * R], [gx + e4 * 0.05, yb + 0.05, tb * R], 0.08, 0.16, COL.woodDark);
        b.beam('wood', [gx + e4 * 0.05, yb, 0], [gx + e4 * 0.05, Y0 + H - 0.1, 0], 0.08, 0.14, COL.woodDark);
      }
    }
    return { ridgeY: Y0 + H, eaveY: eY, R: R };
  };

  // ---------- 墙面开间 ----------
  // 在局部坐标 x∈[0,L]、z=0（+z 朝外）画一个开间
  function panel(b, kind, L, y0, y1, wallC, woodC) {
    var H = y1 - y0, wd = woodC, lat = Q.shade(COL.paper, 1.0);
    switch (kind) {
      case 'plaster':
        b.quad('plaster', [0, y0, 0], [L, y0, 0], [L, y1, 0], [0, y1, 0], wallC);
        b.beam('wood', [0, y0 + H * 0.42, 0.02], [L, y0 + H * 0.42, 0.02], 0.05, 0.1, wd);
        break;
      case 'board':
        b.quad('wood', [0, y0, 0], [L, y0, 0], [L, y1, 0], [0, y1, 0], Q.shade(COL.wood, 0.95));
        break;
      case 'lattice':
        b.quad('wood', [0, y0, 0], [L, y0, 0], [L, y0 + 0.8, 0], [0, y0 + 0.8, 0], Q.shade(COL.wood, 0.9));
        b.beam('wood', [0, y0 + 0.84, 0.03], [L, y0 + 0.84, 0.03], 0.1, 0.09, wd);
        b.quad('lattice', [0.08, y0 + 0.9, 0], [L - 0.08, y0 + 0.9, 0], [L - 0.08, y1 - 0.3, 0], [0.08, y1 - 0.3, 0], lat);
        b.beam('wood', [L / 2, y0 + 0.9, 0.02], [L / 2, y1 - 0.3, 0.02], 0.07, 0.05, wd);
        b.quad('plaster', [0, y1 - 0.3, 0], [L, y1 - 0.3, 0], [L, y1, 0], [0, y1, 0], wallC);
        break;
      case 'window': // 粉墙上开一扇直棂窗
        b.quad('plaster', [0, y0, 0], [L, y0, 0], [L, y0 + 1.0, 0], [0, y0 + 1.0, 0], wallC);
        b.quad('plaster', [0, y1 - 0.5, 0], [L, y1 - 0.5, 0], [L, y1, 0], [0, y1, 0], wallC);
        var m = Math.min(0.5, L * 0.18);
        b.quad('plaster', [0, y0 + 1.0, 0], [m, y0 + 1.0, 0], [m, y1 - 0.5, 0], [0, y1 - 0.5, 0], wallC);
        b.quad('plaster', [L - m, y0 + 1.0, 0], [L, y0 + 1.0, 0], [L, y1 - 0.5, 0], [L - m, y1 - 0.5, 0], wallC);
        b.quad('lattice', [m, y0 + 1.0, -0.02], [L - m, y0 + 1.0, -0.02], [L - m, y1 - 0.5, -0.02], [m, y1 - 0.5, -0.02], lat);
        b.beam('wood', [m, y0 + 1.0, 0.02], [L - m, y0 + 1.0, 0.02], 0.08, 0.08, wd); b.beam('wood', [m, y1 - 0.5, 0.02], [L - m, y1 - 0.5, 0.02], 0.08, 0.08, wd);
        break;
      case 'door': // 关着的板门
        b.quad('plaster', [0, y1 - 0.35, 0], [L, y1 - 0.35, 0], [L, y1, 0], [0, y1, 0], wallC);
        var dw = Math.min(L - 0.3, 1.9), xa = (L - dw) / 2;
        if (xa > 0.05) { b.quad('plaster', [0, y0, 0], [xa, y0, 0], [xa, y1 - 0.35, 0], [0, y1 - 0.35, 0], wallC); b.quad('plaster', [L - xa, y0, 0], [L, y0, 0], [L, y1 - 0.35, 0], [L - xa, y1 - 0.35, 0], wallC); }
        b.quad('wood', [xa, y0, -0.03], [xa + dw / 2 - 0.02, y0, -0.03], [xa + dw / 2 - 0.02, y1 - 0.4, -0.03], [xa, y1 - 0.4, -0.03], Q.shade(COL.woodRed, 0.85));
        b.quad('wood', [xa + dw / 2 + 0.02, y0, -0.03], [xa + dw, y0, -0.03], [xa + dw, y1 - 0.4, -0.03], [xa + dw / 2 + 0.02, y1 - 0.4, -0.03], Q.shade(COL.woodRed, 0.8));
        b.beam('wood', [xa - 0.06, y0, 0.02], [xa - 0.06, y1 - 0.35, 0.02], 0.12, 0.1, wd); b.beam('wood', [xa + dw + 0.06, y0, 0.02], [xa + dw + 0.06, y1 - 0.35, 0.02], 0.12, 0.1, wd);
        b.beam('wood', [xa - 0.12, y1 - 0.38, 0.02], [xa + dw + 0.12, y1 - 0.38, 0.02], 0.12, 0.12, wd);
        b.box('wood', L / 2, y0 + 0.06, 0.05, dw + 0.2, 0.12, 0.14, wd);
        break;
      case 'gate': // 敞开的门：两扇门板向内推开
        b.quad('plaster', [0, y1 - 0.35, 0], [L, y1 - 0.35, 0], [L, y1, 0], [0, y1, 0], wallC);
        var dw2 = Math.min(L - 0.3, 2.0), xb = (L - dw2) / 2;
        if (xb > 0.05) { b.quad('plaster', [0, y0, 0], [xb, y0, 0], [xb, y1 - 0.35, 0], [0, y1 - 0.35, 0], wallC); b.quad('plaster', [L - xb, y0, 0], [L, y0, 0], [L, y1 - 0.35, 0], [L - xb, y1 - 0.35, 0], wallC); }
        b.quad('wood', [xb, y0, 0], [xb + 0.25, y0, -dw2 / 2 + 0.1], [xb + 0.25, y1 - 0.4, -dw2 / 2 + 0.1], [xb, y1 - 0.4, 0], Q.shade(COL.woodRed, 0.8));
        b.quad('wood', [xb + dw2, y0, 0], [xb + dw2 - 0.25, y0, -dw2 / 2 + 0.1], [xb + dw2 - 0.25, y1 - 0.4, -dw2 / 2 + 0.1], [xb + dw2, y1 - 0.4, 0], Q.shade(COL.woodRed, 0.8));
        b.beam('wood', [xb - 0.06, y0, 0.02], [xb - 0.06, y1 - 0.35, 0.02], 0.12, 0.1, wd); b.beam('wood', [xb + dw2 + 0.06, y0, 0.02], [xb + dw2 + 0.06, y1 - 0.35, 0.02], 0.12, 0.1, wd);
        b.beam('wood', [xb - 0.12, y1 - 0.38, 0.02], [xb + dw2 + 0.12, y1 - 0.38, 0.02], 0.12, 0.12, wd);
        break;
      case 'half': // 半截槛墙，上面敞开
        b.quad('wood', [0, y0, 0], [L, y0, 0], [L, y0 + 0.95, 0], [0, y0 + 0.95, 0], Q.shade(COL.wood, 0.9));
        b.box('wood', L / 2, y0 + 0.98, 0, L, 0.07, 0.3, wd);
        break;
      case 'shutter': // 支摘窗：槛墙 + 向外支起的格子窗扇
        b.quad('wood', [0, y0, 0], [L, y0, 0], [L, y0 + 0.9, 0], [0, y0 + 0.9, 0], Q.shade(COL.wood, 0.9));
        b.box('wood', L / 2, y0 + 0.93, 0, L, 0.07, 0.24, wd);
        b.quad('lattice', [0.1, y1 - 0.25, 0.02], [L - 0.1, y1 - 0.25, 0.02], [L - 0.1, y1 - 0.25 - 0.75, 0.95], [0.1, y1 - 0.25 - 0.75, 0.95], lat);
        b.beam('wood', [0.1, y1 - 1.0, 0.95], [L - 0.1, y1 - 1.0, 0.95], 0.05, 0.05, wd);
        b.beam('wood', [L * 0.3, y0 + 0.95, 0.05], [L * 0.3, y1 - 0.98, 0.9], 0.04, 0.04, wd);
        b.quad('plaster', [0, y1 - 0.25, 0], [L, y1 - 0.25, 0], [L, y1, 0], [0, y1, 0], wallC);
        break;
      case 'valance': // 敞开，檐下一条横披窗
        b.quad('lattice', [0.05, y1 - 0.5, 0], [L - 0.05, y1 - 0.5, 0], [L - 0.05, y1 - 0.12, 0], [0.05, y1 - 0.12, 0], lat);
        b.beam('wood', [0, y1 - 0.52, 0.02], [L, y1 - 0.52, 0.02], 0.07, 0.07, wd);
        break;
      case 'fence': // 木栅栏墙
        for (var fx = 0.12; fx < L; fx += 0.24) b.beam('wood', [fx, y0, 0], [fx, y1 - 0.2, 0], 0.07, 0.04, Q.shade(COL.wood, 0.85));
        b.beam('wood', [0, y0 + H * 0.3, 0.03], [L, y0 + H * 0.3, 0.03], 0.05, 0.08, wd); b.beam('wood', [0, y0 + H * 0.75, 0.03], [L, y0 + H * 0.75, 0.03], 0.05, 0.08, wd);
        break;
      case 'earth':
        b.quad('earth', [0, y0, 0], [L, y0, 0], [L, y1, 0], [0, y1, 0], Q.shade(COL.earth, 1.12));
        break;
      default: break; // 'open'
    }
  }
  K.panel = panel;
  // 一圈墙：spec = {front, right, back, left}，每项为种类或按间的数组
  function walls(b, w, d, y0, y1, bays, dbays, spec, wallC, woodC, o) {
    var runs = [
      { k: 'front', p: [-w / 2, d / 2], q: [w / 2, d / 2], n: bays },
      { k: 'right', p: [w / 2, d / 2], q: [w / 2, -d / 2], n: dbays },
      { k: 'back', p: [w / 2, -d / 2], q: [-w / 2, -d / 2], n: bays },
      { k: 'left', p: [-w / 2, -d / 2], q: [-w / 2, d / 2], n: dbays }
    ];
    var pw = (o && o.post) || 0.2;
    runs.forEach(function (r) {
      var kinds = spec[r.k]; if (kinds === 'none') return;
      var dx = r.q[0] - r.p[0], dz = r.q[1] - r.p[1], L = Math.hypot(dx, dz);
      b.push(r.p[0], 0, r.p[1], Math.atan2(-dz, dx));
      var bl = L / r.n;
      for (var i = 0; i < r.n; i++) {
        var kind = Array.isArray(kinds) ? kinds[i % kinds.length] : kinds;
        b.push(i * bl, 0, 0, 0); panel(b, kind, bl, y0, y1, wallC, woodC); b.pop();
        b.beam('wood', [i * bl, y0, 0.01], [i * bl, y1, 0.01], pw, pw, woodC);
      }
      b.beam('wood', [0, y1 - 0.11, 0.02], [L, y1 - 0.11, 0.02], 0.14, 0.22, woodC);
      b.pop();
    });
  }
  K.walls = walls;

  // 栏杆：沿折线，立柱 + 寻杖 + 盆唇 + 交叉棂
  K.railing = function (b, pts, h, col, o) {
    o = o || {}; col = col || COL.woodDark; h = h || 0.9;
    for (var i = 0; i < pts.length - 1; i++) {
      var a = pts[i], c = pts[i + 1], L = Math.hypot(c[0] - a[0], c[1] - a[1], c[2] - a[2]), n = Math.max(1, Math.round(L / (o.span || 1.5)));
      for (var j = 0; j <= n; j++) {
        if (j === n && i < pts.length - 2) continue;
        var t = j / n, x = a[0] + (c[0] - a[0]) * t, y = a[1] + (c[1] - a[1]) * t, z = a[2] + (c[2] - a[2]) * t;
        b.beam('wood', [x, y, z], [x, y + h + 0.1, z], 0.1, 0.1, col, true);
      }
      b.beam('wood', [a[0], a[1] + h, a[2]], [c[0], c[1] + h, c[2]], 0.08, 0.08, col);
      b.beam('wood', [a[0], a[1] + h * 0.55, a[2]], [c[0], c[1] + h * 0.55, c[2]], 0.05, 0.06, col);
      b.beam('wood', [a[0], a[1] + h * 0.12, a[2]], [c[0], c[1] + h * 0.12, c[2]], 0.05, 0.06, col);
      if (o.cross) for (j = 0; j < n; j++) {
        var t0 = j / n, t1 = (j + 1) / n;
        var p0 = [a[0] + (c[0] - a[0]) * t0, a[1] + (c[1] - a[1]) * t0, a[2] + (c[2] - a[2]) * t0], p1 = [a[0] + (c[0] - a[0]) * t1, a[1] + (c[1] - a[1]) * t1, a[2] + (c[2] - a[2]) * t1];
        b.beam('wood', [p0[0], p0[1] + h * 0.14, p0[2]], [p1[0], p1[1] + h * 0.53, p1[2]], 0.03, 0.03, col);
        b.beam('wood', [p0[0], p0[1] + h * 0.53, p0[2]], [p1[0], p1[1] + h * 0.14, p1[2]], 0.03, 0.03, col);
      }
    }
  };

  // ---------- 房屋 ----------
  /* o: {x,z,ry, w,d,h, base, roof:'tile'|'thatch', type:'gable'|'hip'|'xieshan', bays, dbays,
         front/back/left/right: 开间种类或数组, storeys, h2, wallCol, woodCol, awning:{depth,roof,posts}, noStrips } */
  K.house = function (b, o, inside) {
    var w = o.w, d = o.d, h = o.h || 3.0, thatch = o.roof === 'thatch';
    var base = o.base === undefined ? (thatch ? 0.12 : 0.3) : o.base;
    var bays = o.bays || Math.max(1, Math.round(w / 3.1)), dbays = o.dbays || Math.max(1, Math.round(d / 3.4));
    var wallC = o.wallCol || (thatch ? Q.jit(Q.shade(COL.plasterDark, 0.95), 0.06) : Q.jit(COL.plaster, 0.05));
    var woodC = o.woodCol || Q.jit(COL.woodDark, 0.12);
    b.push(o.x, o.y || 0, o.z, o.ry || 0);
    if (base > 0) {
      b.box('stone', 0, base / 2, 0, w + 0.8, base, d + 0.8, Q.jit(COL.stone, 0.05), { noBottom: true });
      if (base > 0.2) b.box('stone', 0, base * 0.25, d / 2 + 0.65, Math.min(w * 0.5, 2.4), base * 0.5, 0.5, COL.stone, { noBottom: true });
    }
    var spec = { front: o.front || 'lattice', back: o.back || 'plaster', left: o.left || o.sides || 'plaster', right: o.right || o.sides || 'plaster' };
    var y0 = base, y1 = base + h, info = { base: base, top: y1 };
    walls(b, w, d, y0, y1, bays, dbays, spec, wallC, woodC, o);
    var st = o.storeys || 1, yTop = y1;
    if (st === 2) {
      var h2 = o.h2 || 2.7, bw = o.balcony === undefined ? 0.95 : o.balcony, fy = y1 + 0.3;
      // 腰檐
      K.skirtRoof(b, w, d, y1 - 0.05, 1.25, o);
      // 平座
      b.box('wood', 0, fy - 0.1, 0, w + bw * 2, 0.2, d + bw * 2, Q.shade(COL.wood, 0.9));
      if (bw > 0.3) {
        var rx = w / 2 + bw - 0.08, rz = d / 2 + bw - 0.08;
        K.railing(b, [[-rx, fy, rz], [rx, fy, rz], [rx, fy, -rz], [-rx, fy, -rz], [-rx, fy, rz]], 0.85, o.railCol || Q.shade(COL.woodRed, 0.9), { cross: true, span: 1.4 });
      }
      var spec2 = { front: o.front2 || 'lattice', back: o.back2 || 'lattice', left: o.left2 || o.sides2 || 'lattice', right: o.right2 || o.sides2 || 'lattice' };
      walls(b, w, d, fy, fy + h2, bays, dbays, spec2, wallC, o.wood2 || woodC, o);
      yTop = fy + h2; info.floor2 = fy;
    }
    var ro = { roof: o.roof, ov: o.ov, gov: o.gov, pitch: o.pitch, wallCol: wallC, strips: !o.noStrips, roofCol: o.roofCol, tb: o.type === 'xieshan' ? (o.tb || 0.42) : 0, lift: o.lift, rh: o.rh };
    info.roof = (o.type === 'hip' || o.type === 'xieshan') ? K.hipRoof(b, w, d, yTop, ro) : K.gableRoof(b, w, d, yTop, ro);
    // 斗栱带（讲究的房子）
    if (o.dougong) {
      var dc = Q.shade(COL.woodRed, 0.9);
      for (var sx = -w / 2; sx <= w / 2 + 0.01; sx += w / Math.round(w / 0.9)) for (var sg = -1; sg <= 1; sg += 2) {
        b.box('plain', sx, yTop - 0.02, sg * (d / 2 + 0.22), 0.26, 0.2, 0.36, dc); b.box('plain', sx, yTop + 0.14, sg * (d / 2 + 0.4), 0.2, 0.14, 0.5, dc);
      }
      for (var sz = -d / 2; sz <= d / 2 + 0.01; sz += d / Math.round(d / 0.9)) for (sg = -1; sg <= 1; sg += 2) {
        b.box('plain', sg * (w / 2 + 0.22), yTop - 0.02, sz, 0.36, 0.2, 0.26, dc); b.box('plain', sg * (w / 2 + 0.4), yTop + 0.14, sz, 0.5, 0.14, 0.2, dc);
      }
    }
    // 前檐凉棚
    if (o.awning) {
      var aw = o.awning, ad = aw.depth || 2.2, ay = base + h - (aw.drop || 0.25), amat = aw.roof || 'mat';
      var ax0 = -(aw.w || w) / 2 + (aw.off || 0), ax1 = (aw.w || w) / 2 + (aw.off || 0), zf = d / 2 + 0.1;
      var ac = amat === 'mat' ? Q.jit(COL.mat, 0.08) : amat === 'thatch' ? Q.jit(COL.thatch, 0.08) : Q.jit(COL.tile, 0.06);
      b.quad(amat, [ax0, ay - 0.55, zf + ad], [ax1, ay - 0.55, zf + ad], [ax1, ay, zf], [ax0, ay, zf], ac);
      b.quad('plain', [ax0, ay - 0.6, zf + ad], [ax1, ay - 0.6, zf + ad], [ax1, ay - 0.05, zf], [ax0, ay - 0.05, zf], Q.shade(ac, 0.6));
      var np = Math.max(2, Math.round((ax1 - ax0) / 3) + 1);
      for (var i = 0; i < np; i++) { var px = ax0 + 0.1 + i * (ax1 - ax0 - 0.2) / (np - 1); b.beam('wood', [px, 0, zf + ad - 0.15], [px, ay - 0.55, zf + ad - 0.15], 0.1, 0.1, woodC); }
      b.beam('wood', [ax0, ay - 0.6, zf + ad - 0.15], [ax1, ay - 0.6, zf + ad - 0.15], 0.08, 0.1, woodC);
      for (i = 0; i < np; i++) { var px2 = ax0 + 0.1 + i * (ax1 - ax0 - 0.2) / (np - 1); b.beam('wood', [px2, ay - 0.08, zf], [px2, ay - 0.6, zf + ad - 0.1], 0.06, 0.07, woodC); }
    }
    if (inside) inside(b, info);
    b.pop();
    return info;
  };
  // 腰檐/披檐：绕屋一圈的短瓦檐
  K.skirtRoof = function (b, w, d, y, run, o) {
    var colT = Q.jit(COL.tile, 0.06), us = UVS.tile, drop = run * 0.42;
    var xi = w / 2, zi = d / 2, xo = w / 2 + run, zo = d / 2 + run, lf = 0.22;
    var segs = [
      [[-xi, y, zi], [xi, y, zi], [xo, y - drop + lf, zo], [-xo, y - drop + lf, zo], 1],
      [[xi, y, zi], [xi, y, -zi], [xo, y - drop + lf, -zo], [xo, y - drop + lf, zo], 0.93],
      [[xi, y, -zi], [-xi, y, -zi], [-xo, y - drop + lf, -zo], [xo, y - drop + lf, -zo], 0.86],
      [[-xi, y, -zi], [-xi, y, zi], [-xo, y - drop + lf, zo], [-xo, y - drop + lf, -zo], 0.9]
    ];
    segs.forEach(function (s) {
      var Li = Math.hypot(s[1][0] - s[0][0], s[1][2] - s[0][2]), Lo = Li + 2 * run, sl = Math.hypot(run, drop);
      // 中段压低，角部起翘：拆成三片
      var a = s[0], c = s[1], e = s[2], f = s[3];
      var dir = [(c[0] - a[0]) / Li, 0, (c[2] - a[2]) / Li];
      var e2 = [e[0] - dir[0] * run * 1.6, y - drop, e[2] - dir[2] * run * 1.6], f2 = [f[0] + dir[0] * run * 1.6, y - drop, f[2] + dir[2] * run * 1.6];
      var col = Q.shade(colT, s[4]);
      b.quad('tile', f2, e2, c, a, col, [run * 0.6 * us, sl * us, (Lo - run * 0.6) * us, sl * us, (Li + run) * us, 0, run * us, 0]);
      b.tri('tile', f, f2, a, col, [0, sl * us, run * 0.6 * us, sl * us, run * us, 0]);
      b.tri('tile', e2, e, c, col, [(Lo - run * 0.6) * us, sl * us, Lo * us, sl * us, (Li + run) * us, 0]);
      if (!o || !o.noStrips) {
        var hi = Q.shade(col, 1.2), lo = Q.shade(col, 0.62), nrm = [-dir[2], 0, dir[0]];
        for (var q = 0.3; q < Li; q += 0.6) {
          var outv = [(e[0] - c[0]) - dir[0] * run, 0, (e[2] - c[2]) - dir[2] * run];
          var p0 = [a[0] + dir[0] * q, y, a[2] + dir[2] * q], p1 = [p0[0] + outv[0], y - drop, p0[2] + outv[2]];
          var sd = [dir[0] * 0.07, 0, dir[2] * 0.07];
          b.quad('plain', [p1[0] - sd[0], p1[1] + 0.005, p1[2] - sd[2]], [p1[0], p1[1] + 0.085, p1[2]], [p0[0], p0[1] + 0.085, p0[2]], [p0[0] - sd[0], p0[1] + 0.005, p0[2] - sd[2]], hi);
          b.quad('plain', [p1[0], p1[1] + 0.085, p1[2]], [p1[0] + sd[0], p1[1] + 0.005, p1[2] + sd[2]], [p0[0] + sd[0], p0[1] + 0.005, p0[2] + sd[2]], [p0[0], p0[1] + 0.085, p0[2]], lo);
        }
      }
      b.beam('plain', a, e, 0.16, 0.14, Q.shade(COL.tileDark, 0.85));
    });
    b.quad('wood', [-xo + 0.1, y - drop + 0.02, -zo + 0.1], [xo - 0.1, y - drop + 0.02, -zo + 0.1], [xo - 0.1, y - drop + 0.02, zo - 0.1], [-xo + 0.1, y - drop + 0.02, zo - 0.1], Q.shade(COL.woodDark, 0.8));
  };

  // 四柱棚子（席棚/草棚/瓦棚），平顶微斜或两坡
  K.shed = function (b, x, z, ry, w, d, h, o) {
    o = o || {};
    var m = o.roof || 'mat', col = m === 'mat' ? Q.jit(COL.mat, 0.1) : m === 'thatch' ? Q.jit(COL.thatch, 0.1) : Q.jit(COL.tile, 0.06);
    b.push(x, 0, z, ry || 0);
    var wc = Q.jit(COL.woodDark, 0.1);
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (c) { b.beam('wood', [c[0] * (w / 2 - 0.1), 0, c[1] * (d / 2 - 0.1)], [c[0] * (w / 2 - 0.1), h + (o.gable ? 0 : (c[1] < 0 ? 0.35 : 0)), c[1] * (d / 2 - 0.1)], 0.1, 0.1, wc); });
    if (o.gable) K.gableRoof(b, w, d, h, { roof: m === 'tile' ? 'tile' : m, ov: 0.5, gov: 0.4, pitch: 0.5, gableWall: false, roofCol: col, strips: false });
    else {
      var ovr = 0.45;
      b.quad(m, [-w / 2 - ovr, h - 0.08, d / 2 + ovr], [w / 2 + ovr, h - 0.08, d / 2 + ovr], [w / 2 + ovr, h + 0.42, -d / 2 - ovr], [-w / 2 - ovr, h + 0.42, -d / 2 - ovr], col);
      b.quad('plain', [-w / 2 - ovr, h - 0.13, d / 2 + ovr], [w / 2 + ovr, h - 0.13, d / 2 + ovr], [w / 2 + ovr, h + 0.37, -d / 2 - ovr], [-w / 2 - ovr, h + 0.37, -d / 2 - ovr], Q.shade(col, 0.6));
      b.beam('wood', [-w / 2, h - 0.05, d / 2 - 0.1], [w / 2, h - 0.05, d / 2 - 0.1], 0.07, 0.08, wc); b.beam('wood', [-w / 2, h + 0.3, -d / 2 + 0.1], [w / 2, h + 0.3, -d / 2 + 0.1], 0.07, 0.08, wc);
    }
    b.pop();
  };

  // ---------- 家具杂物 ----------
  K.table = function (b, x, z, ry, w, d, h, col) {
    w = w || 1.3; d = d || 0.9; h = h || 0.78; col = col || Q.jit(COL.wood, 0.1);
    b.push(x, 0, z, ry || 0);
    b.box('wood', 0, h - 0.04, 0, w, 0.08, d, col);
    var dk = Q.shade(col, 0.75);
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (c) { b.beam('plain', [c[0] * (w / 2 - 0.08), 0, c[1] * (d / 2 - 0.08)], [c[0] * (w / 2 - 0.08), h - 0.08, c[1] * (d / 2 - 0.08)], 0.07, 0.07, dk); });
    b.beam('plain', [-w / 2 + 0.08, h * 0.35, d / 2 - 0.08], [w / 2 - 0.08, h * 0.35, d / 2 - 0.08], 0.04, 0.04, dk); b.beam('plain', [-w / 2 + 0.08, h * 0.35, -d / 2 + 0.08], [w / 2 - 0.08, h * 0.35, -d / 2 + 0.08], 0.04, 0.04, dk);
    b.pop();
  };
  K.bench = function (b, x, z, ry, len, h) {
    len = len || 1.3; h = h || 0.46; var col = Q.jit(COL.wood, 0.12), dk = Q.shade(col, 0.75);
    b.push(x, 0, z, ry || 0);
    b.box('wood', 0, h - 0.03, 0, len, 0.06, 0.28, col);
    for (var s = -1; s <= 1; s += 2) { b.beam('plain', [s * (len / 2 - 0.15), 0, -0.13], [s * (len / 2 - 0.2), h - 0.05, -0.1], 0.05, 0.05, dk); b.beam('plain', [s * (len / 2 - 0.15), 0, 0.13], [s * (len / 2 - 0.2), h - 0.05, 0.1], 0.05, 0.05, dk); }
    b.pop();
  };
  // 桌上的碗盏壶
  K.tableware = function (b, x, y, z) {
    var c = Q.shade(COL.white, 0.95);
    for (var i = 0; i < 3; i++) { var a = Q.rand(6.3), r = Q.rand(0.15, 0.4); b.cyl('plain', [x + Math.cos(a) * r, y, z + Math.sin(a) * r * 0.6], [x + Math.cos(a) * r, y + 0.06, z + Math.sin(a) * r * 0.6], 0.04, 0.07, 6, Q.jit(c, 0.1)); }
    if (Q.chance(0.6)) { b.cyl('plain', [x, y, z], [x, y + 0.16, z], 0.07, 0.04, 6, Q.shade(COL.blue, 0.9), false, true); }
  };
  // 一桌两凳（或四凳），返回座位（世界坐标与朝向）
  K.teaSet = function (b, x, z, ry, o) {
    o = o || {};
    var seats = [];
    b.push(x, 0, z, ry || 0);
    var w = o.w || 1.3, d = o.d || 0.9;
    K.table(b, 0, 0, 0, w, d);
    K.tableware(b, 0, 0.78, 0);
    var yw = b.yaw();
    K.bench(b, 0, d / 2 + 0.32, 0, w); K.bench(b, 0, -d / 2 - 0.32, 0, w);
    seats.push({ p: b.world(-w * 0.22, 0, d / 2 + 0.32), yaw: yw + Math.PI }, { p: b.world(w * 0.22, 0, d / 2 + 0.32), yaw: yw + Math.PI },
      { p: b.world(-w * 0.22, 0, -d / 2 - 0.32), yaw: yw }, { p: b.world(w * 0.22, 0, -d / 2 - 0.32), yaw: yw });
    b.pop();
    return seats;
  };
  K.barrel = function (b, x, z, r, h, col) {
    r = r || 0.35; h = h || 0.7; col = col || Q.jit(COL.wood, 0.12);
    var rings = [], ys = [0, h * 0.5, h], rr = [r * 0.85, r, r * 0.88];
    for (var i = 0; i < 3; i++) { var ring = []; for (var j = 0; j < 8; j++) { var a = j / 8 * 6.283; ring.push([x + Math.cos(a) * rr[i], ys[i], z + Math.sin(a) * rr[i]]); } rings.push(ring); }
    b.loft('wood', rings, { col: col, capB: true });
    b.cyl('plain', [x, h * 0.22, z], [x, h * 0.28, z], r * 0.95, r * 0.97, 8, COL.woodDark); b.cyl('plain', [x, h * 0.74, z], [x, h * 0.8, z], r * 0.96, r * 0.93, 8, COL.woodDark);
  };
  K.basket = function (b, x, y, z, r, h, col, full) {
    col = col || Q.jit(COL.mat, 0.12);
    b.cyl('mat', [x, y, z], [x, y + h, z], r * 0.75, r, 8, col, true, false);
    if (full) b.ball('plain', x, y + h * 0.95, z, r * 0.9, h * 0.35, r * 0.9, 8, 3, full);
  };
  K.sack = function (b, x, y, z, ry, col) {
    col = col || Q.jit(Q.C(0xc9b78e), 0.08);
    b.push(x, y, z, ry || 0); b.ball('plain', 0, 0.2, 0, 0.42, 0.2, 0.26, 7, 4, col); b.pop();
  };
  K.jar = function (b, x, z, s, col) {
    s = s || 1; col = col || Q.jit(Q.C(0x6b5644), 0.15);
    var pr = [[0.16, 0], [0.3, 0.25], [0.32, 0.5], [0.2, 0.72], [0.14, 0.8], [0.17, 0.86]], rings = [];
    pr.forEach(function (p) { var ring = []; for (var j = 0; j < 8; j++) { var a = j / 8 * 6.283; ring.push([x + Math.cos(a) * p[0] * s, p[1] * s, z + Math.sin(a) * p[0] * s]); } rings.push(ring); });
    b.loft('plain', rings, { col: col });
  };
  // 大伞
  K.umbrella = function (b, x, z, r, h, col) {
    r = r || 1.7; h = h || 2.7; col = col || Q.jit(Q.C(0xa58c62), 0.12);
    b.push(x, 0, z, Q.rand(6.3));
    b.cyl('wood', [0, 0, 0], [0, h + 0.25, 0], 0.045, 0.04, 5, COL.woodDark);
    var n = 12, top = [0, h + 0.2, 0], ring = [], ring2 = [];
    for (var j = 0; j < n; j++) { var a = j / n * 6.283; ring.push([Math.cos(a) * r, h - r * 0.22, Math.sin(a) * r]); ring2.push([Math.cos(a) * r * 0.5, h + 0.02, Math.sin(a) * r * 0.5]); }
    for (j = 0; j < n; j++) {
      var j1 = (j + 1) % n, c = Q.shade(col, j % 2 ? 1 : 0.9);
      b.tri('cloth', top, ring2[j], ring2[j1], c); b.quad('cloth', ring2[j], ring[j], ring[j1], ring2[j1], c);
      b.beam('plain', [0, h - r * 0.45, 0], [ring[j][0] * 0.98, ring[j][1] - 0.02, ring[j][2] * 0.98], 0.02, 0.02, COL.woodDark);
    }
    b.pop();
  };
  // 货摊：案板上摆货
  K.stall = function (b, x, z, ry, o) {
    o = o || {};
    var w = o.w || 1.8, d = o.d || 0.9;
    b.push(x, 0, z, ry || 0);
    K.table(b, 0, 0, 0, w, d, 0.7);
    var goods = o.goods || Q.pick(['fruit', 'cake', 'pots', 'cloth']);
    for (var i = 0; i < 5; i++) {
      var gx = -w / 2 + 0.25 + i * (w - 0.5) / 4, gz = Q.rand(-0.2, 0.2);
      if (goods === 'fruit') K.basket(b, gx, 0.7, gz, 0.17, 0.14, null, Q.jit(Q.C(0xa9764a), 0.2));
      else if (goods === 'cake') { b.cyl('plain', [gx, 0.7, gz], [gx, 0.76 + (i % 3) * 0.05, gz], 0.14, 0.14, 7, Q.jit(COL.white, 0.08), false, true); }
      else if (goods === 'pots') { b.push(0, 0.7, 0, 0); K.jar(b, gx, gz, 0.35 + (i % 2) * 0.12); b.pop(); }
      else b.box('plain', gx, 0.76, gz, 0.3, 0.12, 0.5, Q.jit(Q.pick([COL.blue, COL.cloth, COL.red, COL.green]), 0.15));
    }
    b.pop();
  };
  // 篱笆
  K.fence = function (b, pts, h, o) {
    o = o || {}; h = h || 1.1;
    var c = Q.jit(Q.shade(COL.wood, 0.8), 0.1);
    for (var i = 0; i < pts.length - 1; i++) {
      var a = pts[i], e = pts[i + 1], L = Math.hypot(e[0] - a[0], e[1] - a[1]), n = Math.max(1, Math.round(L / (o.gap || 0.28)));
      for (var j = 0; j <= n; j++) {
        var t = j / n, x = a[0] + (e[0] - a[0]) * t, z = a[1] + (e[1] - a[1]) * t, hh = h * Q.rand(0.85, 1.1);
        b.beam('plain', [x, 0, z], [x + Q.rand(-0.05, 0.05), hh, z + Q.rand(-0.05, 0.05)], 0.045, 0.045, Q.jit(c, 0.15));
      }
      b.beam('plain', [a[0], h * 0.35, a[1]], [e[0], h * 0.35, e[1]], 0.04, 0.05, COL.woodDark); b.beam('plain', [a[0], h * 0.75, a[1]], [e[0], h * 0.75, e[1]], 0.04, 0.05, COL.woodDark);
    }
  };
  // 井（四眼井台）
  K.well = function (b, x, z, ry) {
    b.push(x, 0, z, ry || 0);
    b.box('stone', 0, 0.12, 0, 3.2, 0.24, 2.6, COL.stone, { noBottom: true });
    var dk = Q.shade(COL.woodDark, 0.9);
    for (var i = -1; i <= 1; i++) { b.box('wood', i * 0.75, 0.42, 0, 0.14, 0.36, 1.7, COL.wood); }
    for (var j = -1; j <= 1; j++) { b.box('wood', 0, 0.42, j * 0.78, 1.64, 0.36, 0.14, COL.wood); }
    b.quad('plain', [-0.7, 0.27, -0.72], [0.7, 0.27, -0.72], [0.7, 0.27, 0.72], [-0.7, 0.27, 0.72], Q.shade(COL.dark, 0.8));
    K.barrel(b, 1.25, 0.6, 0.2, 0.36); K.barrel(b, -1.3, -0.5, 0.2, 0.36);
    b.pop();
  };

  // ---------- 彩楼欢门 ----------
  function spire(b, x, z, y0, h, wd, col, levels) {
    var top = [x, y0 + h, z], cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (var i = 0; i < 4; i++) b.beam('plain', [x + cs[i][0] * wd, y0, z + cs[i][1] * wd], top, 0.06, 0.06, col);
    for (var l = 0; l < levels; l++) {
      var f = l / levels, f1 = (l + 1) / levels, r0 = wd * (1 - f * 0.92), r1 = wd * (1 - f1 * 0.92), ya = y0 + h * f * 0.92, yb = y0 + h * f1 * 0.92;
      for (i = 0; i < 4; i++) {
        var a = cs[i], c = cs[(i + 1) % 4];
        b.beam('plain', [x + a[0] * r0, ya, z + a[1] * r0], [x + c[0] * r0, ya, z + c[1] * r0], 0.045, 0.045, col);
        b.beam('plain', [x + a[0] * r0, ya, z + a[1] * r0], [x + c[0] * r1, yb, z + c[1] * r1], 0.035, 0.035, col);
        if (l % 2 === 0) b.beam('plain', [x + c[0] * r0, ya, z + c[1] * r0], [x + a[0] * r1, yb, z + a[1] * r1], 0.035, 0.035, col);
      }
    }
    b.beam('plain', top, [x, y0 + h + 0.8, z], 0.04, 0.04, col);
  }
  /* o: {x,z,ry, w, d, h (主体高), spires:[[fx,fz,高,半宽]], deco:'plain'|'flower', valance} */
  K.cailou = function (b, o) {
    var w = o.w || 6.5, d = o.d || 2.6, h = o.h || 5.2, col = o.col || Q.shade(COL.wood, 0.78);
    b.push(o.x, 0, o.z, o.ry || 0);
    // 底层门架：立柱 + 层层横木与斜撑
    var nx = o.nx || 4, i, l;
    for (i = 0; i <= nx; i++) for (var s = -1; s <= 1; s += 2) {
      var px = -w / 2 + i * w / nx;
      if (o.door && Math.abs(px) < w / nx * 0.6) { b.beam('plain', [px, h * 0.52, s * d / 2], [px, h, s * d / 2], 0.09, 0.09, col); continue; }
      b.beam('plain', [px, 0, s * d / 2], [px, h, s * d / 2], 0.1, 0.1, col);
    }
    var lv = [0.52, 0.68, 0.84, 1.0];
    for (l = 0; l < lv.length; l++) {
      var y = h * lv[l];
      for (s = -1; s <= 1; s += 2) b.beam('plain', [-w / 2 - 0.3, y, s * d / 2], [w / 2 + 0.3, y, s * d / 2], 0.08, 0.08, col);
      for (i = 0; i <= nx; i++) b.beam('plain', [-w / 2 + i * w / nx, y, -d / 2 - 0.2], [-w / 2 + i * w / nx, y, d / 2 + 0.2], 0.07, 0.07, col);
      if (l > 0) for (i = 0; i < nx; i++) for (s = -1; s <= 1; s += 2) {
        var xa = -w / 2 + i * w / nx, xb = xa + w / nx, ya = h * lv[l - 1];
        b.beam('plain', [xa, ya, s * d / 2], [xb, y, s * d / 2], 0.04, 0.04, col); b.beam('plain', [xb, ya, s * d / 2], [xa, y, s * d / 2], 0.04, 0.04, col);
      }
    }
    // 檐口垂幔
    if (o.valance !== false) {
      var vc = o.valCol || Q.shade(COL.blue, 0.9);
      for (s = -1; s <= 1; s += 2) for (i = 0; i < nx * 2; i++) {
        var x0 = -w / 2 + i * w / (nx * 2), x1 = x0 + w / (nx * 2);
        K._swayQuad(b, [x0, h * 0.52 - 0.5, s * (d / 2 + 0.06)], [x1, h * 0.52 - 0.5, s * (d / 2 + 0.06)], [x1, h * 0.52, s * (d / 2 + 0.06)], [x0, h * 0.52, s * (d / 2 + 0.06)], i % 2 ? vc : COL.white, 0.2, 0.2, 0, 0);
      }
    }
    // 顶上攒尖的木架
    var sp = o.spires || [[0, 0, 4.6, 1.0], [-0.34, 0, 3.2, 0.8], [0.34, 0, 3.2, 0.8], [-0.17, -0.4, 3.8, 0.7], [0.17, 0.4, 3.8, 0.7]];
    sp.forEach(function (p) { spire(b, p[0] * w, p[1] * d, h, p[2], p[3], col, 5); });
    // 花饰
    if (o.deco === 'flower') {
      var fc = [Q.C(0xa85a44), Q.C(0xb97a58), Q.C(0xd9c9a0), Q.C(0x8c4a3a)];
      for (i = 0; i < 70; i++) {
        var p = Q.pick(sp), f = Q.rand(0.05, 0.95), rr = p[3] * (1 - f * 0.9), a = Q.rand(6.3);
        b.box('plain', p[0] * w + Math.cos(a) * rr, h + p[2] * f * 0.92, p[1] * d + Math.sin(a) * rr, 0.16, 0.16, 0.16, Q.pick(fc), { ry: a });
      }
      for (i = 0; i < nx * 2; i++) { var lx = -w / 2 + (i + 0.5) * w / (nx * 2); b.ball('plain', lx, h * 0.52 - 0.75, d / 2 + 0.1, 0.16, 0.2, 0.16, 6, 3, Q.pick(fc)); }
    }
    b.pop();
  };

  // ---------- 虹桥 ----------
  K.rainbow = function (b) {
    var B = W.bridge, ry = Math.atan2(-B.dz, B.dx), half = B.half, hw = B.hw, N = 28;
    b.push(B.cx, 0, B.cz, ry);
    // 局部：x = 沿桥，z = 横向
    var wood = Q.shade(COL.wood, 0.92), dk = Q.shade(COL.woodDark, 0.95), us = UVS.wood, i;
    function Y(u) { return W.archY(u); }
    for (i = 0; i < N; i++) {
      var u0 = -half + i * 2 * half / N, u1 = u0 + 2 * half / N, y0 = Y(u0), y1 = Y(u1);
      // 桥面（木板横铺）
      b.quad('wood', [u0, y0 + 0.02, hw], [u1, y1 + 0.02, hw], [u1, y1 + 0.02, -hw], [u0, y0 + 0.02, -hw], Q.jit(wood, 0.04), [0, u0 * 0.8, 0, u1 * 0.8, hw * 2 * us, u1 * 0.8, hw * 2 * us, u0 * 0.8]);
      // 拱身侧面与底面
      var th0 = 0.85, yb0 = Math.max(-1.2, y0 - th0), yb1 = Math.max(-1.2, y1 - th0);
      if (Math.abs((u0 + u1) / 2) < 13.6) {
        for (var s = -1; s <= 1; s += 2) {
          b.quad('wood', [u0, yb0, s * (hw + 0.1)], [u1, yb1, s * (hw + 0.1)], [u1, y1 - 0.02, s * (hw + 0.1)], [u0, y0 - 0.02, s * (hw + 0.1)], dk, [u0 * us, 0, u1 * us, 0, u1 * us, 0.28, u0 * us, 0.28]);
          // 拱骨端头
          if (i % 2 === 0) b.box('plain', (u0 + u1) / 2, (y0 + y1) / 2 - 0.45, s * (hw + 0.16), 0.3, 0.3, 0.14, Q.shade(wood, 0.8));
          b.beam('plain', [u0, y0 - 0.12, s * (hw + 0.14)], [u1, y1 - 0.12, s * (hw + 0.14)], 0.05, 0.14, Q.shade(dk, 0.8));
        }
        b.quad('wood', [u0, yb0, -hw], [u1, yb1, -hw], [u1, yb1, hw], [u0, yb0, hw], Q.shade(dk, 0.85), [u0 * us, 0, u1 * us, 0, u1 * us, hw * 2 * us, u0 * us, hw * 2 * us]);
        if (i % 3 === 0) b.beam('plain', [u0, yb0 - 0.1, -hw - 0.1], [u0, yb0 - 0.1, hw + 0.1], 0.22, 0.22, Q.shade(wood, 0.75), true);
      } else {
        // 桥台（条石）
        for (var s2 = -1; s2 <= 1; s2 += 2)
          b.quad('stone', [u0, -1.6, s2 * (hw + 0.25)], [u1, -1.6, s2 * (hw + 0.25)], [u1, y1, s2 * (hw + 0.1)], [u0, y0, s2 * (hw + 0.1)], COL.stone);
      }
    }
    // 桥台朝河的立面
    for (var e = -1; e <= 1; e += 2) b.quad('stone', [e * 13.6, -1.6, -hw - 0.25], [e * 13.6, -1.6, hw + 0.25], [e * 13.6, Y(13.6) - 0.6, hw + 0.1], [e * 13.6, Y(13.6) - 0.6, -hw - 0.1], Q.shade(COL.stone, 0.9));
    // 栏杆
    for (var sd = -1; sd <= 1; sd += 2) {
      var pts = [];
      for (i = 0; i <= 22; i++) { var u = -half + 1.2 + i * (2 * half - 2.4) / 22; pts.push([u, Y(u), sd * (hw - 0.12)]); }
      K.railing(b, pts, 0.92, Q.shade(COL.woodRed, 0.85), { span: 1.6 });
    }
    // 四角表木，顶上立鹤
    [[-half - 0.5, -hw - 1.2], [-half - 0.5, hw + 1.2], [half + 0.5, -hw - 1.2], [half + 0.5, hw + 1.2]].forEach(function (p) {
      b.cyl('wood', [p[0], 0, p[1]], [p[0], 7.2, p[1]], 0.1, 0.06, 6, dk);
      b.beam('plain', [p[0] - 0.7, 6.3, p[1]], [p[0] + 0.7, 6.3, p[1]], 0.06, 0.06, dk, true);
      b.ball('plain', p[0], 7.38, p[1], 0.22, 0.12, 0.1, 6, 3, COL.white);
      b.beam('plain', [p[0] + 0.15, 7.4, p[1]], [p[0] + 0.36, 7.62, p[1]], 0.04, 0.04, COL.white, true);
    });
    b.pop();
  };

  // ---------- 平桥（木桩、木板、栏杆） ----------
  K.flatBridge = function (b, m, o) {
    o = o || {};
    var y = m.y, L = m.x1 - m.x0, wz = m.z1 - m.z0, cx = (m.x0 + m.x1) / 2, cz = (m.z0 + m.z1) / 2;
    b.push(cx, 0, cz, 0);
    var us = UVS.wood, wood = Q.shade(COL.wood, 0.95), dk = COL.woodDark;
    b.quad('wood', [-L / 2, y, wz / 2], [L / 2, y, wz / 2], [L / 2, y, -wz / 2], [-L / 2, y, -wz / 2], wood, [0, 0, 0, L * 0.8, wz * us, L * 0.8, wz * us, 0]);
    for (var s = -1; s <= 1; s += 2) {
      b.beam('wood', [-L / 2, y - 0.14, s * (wz / 2 - 0.05)], [L / 2, y - 0.14, s * (wz / 2 - 0.05)], 0.16, 0.28, dk);
      if (o.rail !== false) K.railing(b, [[-L / 2 + 0.2, y, s * (wz / 2 - 0.15)], [L / 2 - 0.2, y, s * (wz / 2 - 0.15)]], 0.95, Q.shade(COL.wood, 0.8), { span: 1.9, cross: o.cross });
    }
    var np = Math.max(2, Math.round(L / 3.2));
    for (var i = 0; i <= np; i++) {
      var px = -L / 2 + 0.4 + i * (L - 0.8) / np;
      for (s = -1; s <= 1; s += (wz > 5 ? 1 : 2)) b.cyl('wood', [px, -2.2, s * (wz / 2 - 0.35)], [px, y - 0.2, s * (wz / 2 - 0.35)], 0.13, 0.13, 5, dk);
      b.beam('wood', [px, y - 0.36, -wz / 2 + 0.1], [px, y - 0.36, wz / 2 - 0.1], 0.16, 0.18, dk);
    }
    b.pop();
  };

  // ---------- 城门、城楼 ----------
  K.gate = function (b) {
    var G = W.gate, L = G.len, Wd = G.wid, H = G.h, pw = G.passW, ph = G.passH, bt = 1.5;
    var brick = Q.shade(COL.brick, 1.02), us = UVS.brick;
    b.push(G.x, 0, G.z, 0);
    // 城台：南北两墩 + 门洞上方
    function ins(y) { return bt * y / H; }
    for (var s = -1; s <= 1; s += 2) {
      var bot = [[-L / 2, 0, s * pw / 2], [L / 2, 0, s * pw / 2], [L / 2, 0, s * Wd / 2], [-L / 2, 0, s * Wd / 2]];
      var top = [[-L / 2 + bt, H, s * pw / 2], [L / 2 - bt, H, s * pw / 2], [L / 2 - bt, H, s * (Wd / 2 - bt)], [-L / 2 + bt, H, s * (Wd / 2 - bt)]];
      b.loft('brick', [bot, top], { flat: true, col: brick });
    }
    for (var e = -1; e <= 1; e += 2) {
      var i0 = ins(ph);
      b.quad('brick', [e * (L / 2 - i0), ph, -pw / 2], [e * (L / 2 - i0), ph, pw / 2], [e * (L / 2 - bt), H, pw / 2], [e * (L / 2 - bt), H, -pw / 2], brick);
    }
    b.quad('wood', [-L / 2 + 0.6, ph, -pw / 2], [L / 2 - 0.6, ph, -pw / 2], [L / 2 - 0.6, ph, pw / 2], [-L / 2 + 0.6, ph, pw / 2], Q.shade(COL.woodDark, 0.7));
    b.quad('brick', [-L / 2 + bt, H, -Wd / 2 + bt], [L / 2 - bt, H, -Wd / 2 + bt], [L / 2 - bt, H, Wd / 2 - bt], [-L / 2 + bt, H, Wd / 2 - bt], Q.shade(brick, 1.08));
    // 门洞木构：排叉柱与过梁
    var dk = Q.shade(COL.woodRed, 0.75);
    for (var px = -L / 2 + 0.8; px <= L / 2 - 0.7; px += 1.45) for (s = -1; s <= 1; s += 2) {
      b.beam('wood', [px, 0, s * (pw / 2 - 0.1)], [px, ph - 0.25, s * (pw / 2 - 0.1)], 0.22, 0.22, dk);
      if (s < 0) b.beam('wood', [px, ph - 0.14, -pw / 2], [px, ph - 0.14, pw / 2], 0.22, 0.26, dk);
    }
    for (e = -1; e <= 1; e += 2) {
      var fx = e * (L / 2 - ins(ph) * 0.5 + 0.02);
      b.beam('wood', [fx, ph + 0.15, -pw / 2 - 0.5], [fx, ph + 0.15, pw / 2 + 0.5], 0.3, 0.5, dk, true);
      b.beam('wood', [e * (L / 2 + 0.02), 0, -pw / 2 - 0.2], [fx, ph, -pw / 2 - 0.2], 0.3, 0.36, dk, true); b.beam('wood', [e * (L / 2 + 0.02), 0, pw / 2 + 0.2], [fx, ph, pw / 2 + 0.2], 0.3, 0.36, dk, true);
    }
    // 两扇门（向内敞开）
    for (s = -1; s <= 1; s += 2) b.quad('wood', [-L / 2 + 1.2, 0, s * (pw / 2 - 0.25)], [-L / 2 + 3.6, 0, s * (pw / 2 - 0.32)], [-L / 2 + 3.6, ph - 0.5, s * (pw / 2 - 0.32)], [-L / 2 + 1.2, ph - 0.5, s * (pw / 2 - 0.25)], Q.shade(COL.woodRed, 0.7));
    // 台顶女墙栏杆
    var tx = L / 2 - bt - 0.15, tz = Wd / 2 - bt - 0.15;
    K.railing(b, [[-tx, H, -tz], [tx, H, -tz], [tx, H, tz], [-tx, H, tz], [-tx, H, 2.2]], 0.9, Q.shade(COL.woodRed, 0.85), { cross: true, span: 1.5 });
    K.railing(b, [[-tx, H, -tz], [-tx, H, -1.2]], 0.9, Q.shade(COL.woodRed, 0.85), { cross: true, span: 1.5 });
    // 城楼：平座 + 五间殿身 + 单檐庑殿顶
    var tw = 15.5, td = 8.2, py = H + 1.5, wr = Q.shade(COL.woodRed, 0.95);
    b.push(0, 0, 0, Math.PI / 2);   // 城楼面阔沿南北
    // 平座柱与斗栱带
    for (var ix = -3; ix <= 3; ix++) for (s = -1; s <= 1; s += 2) b.beam('wood', [ix * (tw + 1.6) / 6, H, s * (td / 2 + 0.8)], [ix * (tw + 1.6) / 6, py - 0.2, s * (td / 2 + 0.8)], 0.24, 0.24, wr);
    for (var iz = -1; iz <= 1; iz++) for (s = -1; s <= 1; s += 2) b.beam('wood', [s * (tw / 2 + 0.8), H, iz * td / 2], [s * (tw / 2 + 0.8), py - 0.2, iz * td / 2], 0.24, 0.24, wr);
    b.box('wood', 0, H + 0.75, 0, tw - 0.5, 1.5, td - 0.5, Q.shade(COL.plasterDark, 0.85));
    for (ix = -8; ix <= 8; ix++) for (s = -1; s <= 1; s += 2) b.box('plain', ix * (tw + 2.2) / 16, py - 0.42, s * (td / 2 + 1.05), 0.34, 0.3, 0.5, wr);
    for (iz = -4; iz <= 4; iz++) for (s = -1; s <= 1; s += 2) b.box('plain', s * (tw / 2 + 1.05), py - 0.42, iz * (td + 2.2) / 8, 0.5, 0.3, 0.34, wr);
    b.box('wood', 0, py - 0.12, 0, tw + 2.9, 0.24, td + 2.9, Q.shade(COL.wood, 0.9));
    var rx = tw / 2 + 1.3, rz = td / 2 + 1.3;
    K.railing(b, [[-rx, py, rz], [rx, py, rz], [rx, py, -rz], [-rx, py, -rz], [-rx, py, rz]], 0.9, wr, { cross: true, span: 1.5 });
    // 殿身
    walls(b, tw, td, py, py + 3.5, 5, 3, { front: ['lattice', 'lattice', 'gate', 'lattice', 'lattice'], back: ['lattice', 'lattice', 'gate', 'lattice', 'lattice'], left: 'lattice', right: 'lattice' }, Q.shade(COL.plaster, 0.95), wr, { post: 0.3 });
    for (ix = -10; ix <= 10; ix++) for (s = -1; s <= 1; s += 2) { b.box('plain', ix * tw / 20, py + 3.55, s * (td / 2 + 0.25), 0.26, 0.24, 0.4, wr); b.box('plain', ix * tw / 20, py + 3.8, s * (td / 2 + 0.5), 0.2, 0.18, 0.6, wr); }
    for (iz = -5; iz <= 5; iz++) for (s = -1; s <= 1; s += 2) { b.box('plain', s * (tw / 2 + 0.25), py + 3.55, iz * td / 10, 0.4, 0.24, 0.26, wr); b.box('plain', s * (tw / 2 + 0.5), py + 3.8, iz * td / 10, 0.6, 0.18, 0.2, wr); }
    K.hipRoof(b, tw, td, py + 3.95, { ov: 2.0, pitch: 0.56, lift: 0.7, cz: 2.2, rh: tw / 2 - td / 2 * 0.62 });
    b.pop();
    // 登楼的踏道（城内一侧，贴着城台）
    var sx0 = -L / 2 + bt - 0.2, st = Q.shade(brick, 0.95);
    b.quad('brick', [sx0 - 2.6, 0, Wd / 2 + 6], [sx0, 0, Wd / 2 + 6], [sx0 + 0.3, H, Wd / 2 - bt - 0.4], [sx0 - 2.3, H, Wd / 2 - bt - 0.4], st);
    b.quad('brick', [sx0 - 2.6, 0, Wd / 2 + 6], [sx0 - 2.3, H, Wd / 2 - bt - 0.4], [sx0 - 2.3, 0, Wd / 2 - bt - 0.4], [sx0 - 2.6, 0, Wd / 2 - bt - 0.4], st);
    for (var q = 0; q < 16; q++) { var f = q / 16; b.box('plain', sx0 - 1.15 + f * 0.3, H * (1 - f) + 0.02, Wd / 2 - bt - 0.4 + f * (6 + bt + 0.4), 2.5, 0.06, 0.12, Q.shade(brick, 0.7)); }
    K.railing(b, [[sx0 - 2.5, 0, Wd / 2 + 6], [sx0 - 2.25, H, Wd / 2 - bt - 0.4]], 0.9, Q.shade(COL.woodRed, 0.85), { span: 1.6 });
    b.pop();
  };

  // 沿一条线排一溜铺面（背对 back 方向）；返回每间的信息
  K.row = function (b, x0, z0, x1, z1, o, each) {
    o = o || {};
    var L = Math.hypot(x1 - x0, z1 - z0), dx = (x1 - x0) / L, dz = (z1 - z0) / L, ry = Math.atan2(-dz, dx) + (o.flip ? Math.PI : 0);
    var s = 0, i = 0, out = [];
    while (s < L - 2.5) {
      var w = Math.min(L - s, Q.rand(o.wMin || 5, o.wMax || 9)); if (L - s - w < 3) w = L - s;
      var d = Q.rand(o.dMin || 4.5, o.dMax || 6.5), cx = x0 + dx * (s + w / 2), cz = z0 + dz * (s + w / 2);
      // 向后退半个进深
      var bx = cx + Math.sin(ry) * (-d / 2), bz = cz + Math.cos(ry) * (-d / 2);
      var ho = { x: bx, z: bz, ry: ry, w: w - 0.5, d: d, h: Q.rand(2.7, 3.3), roof: Q.chance(o.thatch || 0) ? 'thatch' : 'tile',
        front: Q.pick(o.fronts || [['open'], ['valance'], ['shutter', 'open'], ['lattice', 'gate', 'lattice'], ['half', 'open']]) };
      if (each) { var r = each(ho, i); if (r === false) { s += w; i++; continue; } }
      out.push(ho); K.house(b, ho, ho.inside);
      s += w; i++;
    }
    return out;
  };
})();
