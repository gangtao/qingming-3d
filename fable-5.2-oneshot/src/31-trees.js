/* 树木：老柳（粗矮歪斜的树干、瘤状树头、放射的细枝，早春枝叶稀疏）、枯枝杂树、灌丛、芦苇 */
(function () {
  'use strict';
  var Q = window.Q, COL = Q.COL, K = Q.K;
  function add(a, b, s) { return [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s]; }
  function nrm(a) { var l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
  // 一根下垂的细枝（折线），由 base 朝 dir 伸出
  function twig(tw, base, dir, len, segs, c0, c1, droop, w0) {
    var p = base, d = nrm(dir), sl = len / segs;
    for (var i = 0; i < segs; i++) {
      var f0 = i / segs, f1 = (i + 1) / segs;
      d = nrm([d[0] + Q.rand(-0.1, 0.1), d[1] - droop * (0.25 + f0), d[2] + Q.rand(-0.1, 0.1)]);
      var q = add(p, d, sl);
      tw.seg(p, q, Q.mix(c0, c1, f0), Q.mix(c0, c1, f1), w0 + f0 * (1 - w0), w0 + f1 * (1 - w0));
      p = q;
    }
    return p;
  }
  /* 老柳。o: {h 树干高, r 根部半径, lean 倾斜, twigs 细枝数, spread, green 新绿程度} */
  K.willow = function (b, tw, x, z, o) {
    o = o || {};
    var h = o.h || Q.rand(2.3, 3.6), r = o.r || Q.rand(0.42, 0.7), s = o.s || 1;
    var la = o.leanA !== undefined ? o.leanA : Q.rand(6.3), lean = o.lean !== undefined ? o.lean : Q.rand(0.25, 0.9);
    var bark = Q.jit(COL.bark, 0.12), dark = Q.shade(bark, 0.7);
    b.push(x, 0, z, 0, s);
    var heads = [];
    function trunk(base, h2, r0, la2, ln) {
      var pts = [], rad = [], n = 6;
      for (var i = 0; i <= n; i++) {
        var f = i / n, wob = Math.sin(f * 5 + la2 * 3) * 0.16 * (1 - f * 0.4);
        pts.push([base[0] + Math.cos(la2) * (ln * f * f + wob), base[1] + h2 * f, base[2] + Math.sin(la2) * (ln * f * f) + Math.cos(f * 4 + la2) * 0.14]);
        var bulge = 1 + 0.22 * Math.sin(f * 9 + la2 * 5) * (f > 0.1 ? 1 : 0);
        rad.push((i === 0 ? r0 * 1.5 : r0 * (1 - f * 0.34) * bulge));
      }
      var cols = pts.map(function (_, i) { return Q.shade(bark, 0.82 + 0.3 * (i / n)); });
      b.tube('bark', pts, rad, 7, bark, cols);
      // 树根隆起
      for (i = 0; i < 4; i++) { var a = la2 + i * 1.57 + Q.rand(-0.4, 0.4); b.cyl('bark', [base[0] + Math.cos(a) * r0 * 1.7, base[1] - 0.15, base[2] + Math.sin(a) * r0 * 1.7], [base[0] + Math.cos(a) * r0 * 0.7, base[1] + 0.5, base[2] + Math.sin(a) * r0 * 0.7], r0 * 0.22, r0 * 0.42, 5, Q.shade(bark, 0.85)); }
      var top = pts[n];
      // 瘤状树头
      b.ball('bark', top[0], top[1] + r0 * 0.15, top[2], r0 * 1.05, r0 * 0.85, r0 * 1.0, 7, 4, Q.shade(bark, 0.95));
      for (i = 0; i < 3; i++) { var a2 = Q.rand(6.3); b.ball('bark', top[0] + Math.cos(a2) * r0 * 0.8, top[1] + Q.rand(-0.3, 0.3), top[2] + Math.sin(a2) * r0 * 0.8, r0 * 0.42, r0 * 0.4, r0 * 0.42, 5, 3, dark); }
      // 树洞
      var mid = pts[2]; b.ball('plain', mid[0] + Math.cos(la2 + 1.3) * rad[2] * 0.8, mid[1], mid[2] + Math.sin(la2 + 1.3) * rad[2] * 0.8, 0.12 * r0 / 0.5, 0.22, 0.1, 5, 3, Q.shade(COL.barkDark, 0.6));
      heads.push({ p: top, r: r0, la: la2 });
    }
    if (o.fork || (o.fork === undefined && Q.chance(0.3))) {
      trunk([0, 0, 0], h, r, la, lean); trunk([Math.cos(la + 2.4) * r * 0.9, 0, Math.sin(la + 2.4) * r * 0.9], h * Q.rand(0.7, 0.95), r * 0.8, la + Q.rand(2, 3.4), lean * Q.rand(0.8, 1.5));
    } else trunk([0, 0, 0], h, r, la, lean);
    var nT = o.twigs || 170, green = o.green === undefined ? Q.rand(0.35, 0.7) : o.green;
    var cb = Q.shade(COL.bark, 0.75), ct = Q.mix(Q.shade(COL.bark, 1.1), COL.willow, green);
    heads.forEach(function (hd) {
      var nl = Q.randi(5, 8), tips = [];
      for (var i = 0; i < nl; i++) {
        var a = i / nl * 6.283 + Q.rand(-0.3, 0.3), el = Q.rand(0.5, 1.25), L = Q.rand(1.6, 3.2) * (o.spread || 1);
        var d = [Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)];
        var p0 = add(hd.p, d, hd.r * 0.5), p1 = add(p0, [d[0], d[1] + 0.25, d[2]], L * 0.5), p2 = add(p1, [d[0] * 1.1, d[1] * 0.8, d[2] * 1.1], L * 0.5);
        b.tube('bark', [p0, p1, p2], [0.1 * hd.r / 0.5, 0.06 * hd.r / 0.5, 0.025], 5, Q.shade(bark, 0.8));
        tips.push([p1, d], [p2, d], [p0, d]);
      }
      var per = Math.round(nT / heads.length);
      for (i = 0; i < per; i++) {
        var t = Q.pick(tips), a3 = Q.rand(6.3), up = Q.rand(0.15, 1.0);
        var dir = [t[1][0] * 0.6 + Math.cos(a3) * 0.7, t[1][1] * 0.4 + up, t[1][2] * 0.6 + Math.sin(a3) * 0.7];
        twig(tw, b.world(t[0][0], t[0][1], t[0][2]), dir, Q.rand(2.0, 4.6) * (o.spread || 1) * s, 5, cb, ct, Q.rand(0.12, 0.3), 0.08);
      }
    });
    b.pop();
  };
  /* 枯枝杂树。o: {h, r, levels, lean} */
  K.bareTree = function (b, tw, x, z, o) {
    o = o || {};
    var h = o.h || Q.rand(3.2, 5.5), r = o.r || Q.rand(0.16, 0.3), s = o.s || 1;
    var bark = Q.jit(Q.shade(COL.bark, 0.9), 0.15), ctw = Q.shade(COL.barkDark, 0.9);
    b.push(x, 0, z, 0, s);
    function branch(p, d, len, rad, lvl) {
      d = nrm(d);
      var mid = add(p, [d[0] + Q.rand(-0.15, 0.15), d[1] + Q.rand(-0.05, 0.15), d[2] + Q.rand(-0.15, 0.15)], len * 0.5);
      var end = add(mid, [d[0] + Q.rand(-0.25, 0.25), d[1] + Q.rand(0, 0.3), d[2] + Q.rand(-0.25, 0.25)], len * 0.5);
      if (lvl <= 0) {
        // 蟹爪枝：短促转折的细枝
        var wp = b.world(p[0], p[1], p[2]), wm = b.world(mid[0], mid[1], mid[2]), we = b.world(end[0], end[1], end[2]);
        tw.seg(wp, wm, ctw, ctw, 0.02, 0.05); tw.seg(wm, we, ctw, ctw, 0.05, 0.1);
        for (var i = 0; i < 5; i++) {
          var base = i < 3 ? wm : we, a = Q.rand(6.3), q = [base[0] + Math.cos(a) * Q.rand(0.2, 0.6) * s, base[1] + Q.rand(0.05, 0.5) * s, base[2] + Math.sin(a) * Q.rand(0.2, 0.6) * s];
          tw.seg(base, q, ctw, ctw, 0.06, 0.14);
          tw.seg(q, [q[0] + Q.rand(-0.25, 0.25) * s, q[1] - Q.rand(0.0, 0.25) * s, q[2] + Q.rand(-0.25, 0.25) * s], ctw, ctw, 0.14, 0.2);
        }
        return;
      }
      var sides = lvl >= 2 ? 6 : 4;
      b.tube('bark', [p, mid, end], [rad, rad * 0.8, rad * 0.58], sides, Q.shade(bark, 0.85 + lvl * 0.06));
      var n = lvl >= 2 ? Q.randi(2, 3) : Q.randi(2, 3);
      for (var k = 0; k < n; k++) {
        var a2 = Q.rand(6.3), sp = Q.rand(0.5, 1.0);
        var nd = [d[0] * 0.7 + Math.cos(a2) * sp, d[1] * 0.7 + Q.rand(0.1, 0.6), d[2] * 0.7 + Math.sin(a2) * sp];
        branch(k === 0 ? end : (Q.chance(0.5) ? mid : end), nd, len * Q.rand(0.55, 0.78), rad * 0.55, lvl - 1);
      }
    }
    var la = Q.rand(6.3), ln = o.lean === undefined ? Q.rand(0.05, 0.35) : o.lean;
    b.cyl('bark', [0, -0.1, 0], [0, 0.4, 0], r * 1.7, r * 1.05, 6, Q.shade(bark, 0.8));
    branch([0, 0.3, 0], [Math.cos(la) * ln, 1, Math.sin(la) * ln], h, r, o.levels || 3);
    b.pop();
  };
  // 灌丛
  K.shrub = function (tw, x, z, r, h, col) {
    col = col || Q.shade(COL.barkDark, 1.1); var c2 = Q.mix(col, COL.willow, 0.4);
    for (var i = 0; i < 14; i++) {
      var a = Q.rand(6.3), d = Q.rand(r), bx = x + Math.cos(a) * d * 0.4, bz = z + Math.sin(a) * d * 0.4;
      var tx = x + Math.cos(a) * d, tz = z + Math.sin(a) * d, hh = h * Q.rand(0.5, 1);
      tw.seg([bx, 0, bz], [tx, hh * 0.6, tz], col, col, 0, 0.1);
      tw.seg([tx, hh * 0.6, tz], [tx + Q.rand(-0.3, 0.3), hh, tz + Q.rand(-0.3, 0.3)], col, c2, 0.1, 0.25);
      tw.seg([tx, hh * 0.6, tz], [tx + Q.rand(-0.4, 0.4), hh * 0.85, tz + Q.rand(-0.4, 0.4)], col, c2, 0.1, 0.25);
    }
  };
  // 水边芦苇
  K.reeds = function (tw, x, z, r, n) {
    var c0 = Q.shade(COL.thatchDark, 0.8), c1 = Q.mix(COL.thatch, COL.willow, 0.4);
    for (var i = 0; i < (n || 16); i++) {
      var a = Q.rand(6.3), d = Q.rand(r), bx = x + Math.cos(a) * d, bz = z + Math.sin(a) * d, h = Q.rand(0.6, 1.4), lx = Q.rand(-0.35, 0.35), lz = Q.rand(-0.2, 0.2);
      tw.seg([bx, -0.5, bz], [bx + lx * 0.4, h * 0.6, bz + lz * 0.4], c0, c1, 0, 0.2);
      tw.seg([bx + lx * 0.4, h * 0.6, bz + lz * 0.4], [bx + lx, h, bz + lz], c1, c1, 0.2, 0.5);
    }
  };
})();
