/* 世界坐标和地形：以原画全卷缩略图的像素 (ox, oy) 为底稿坐标，换算到三维世界。
   画右（卷首）= +X，画上（北）= -Z。X = (ox-3000)*0.1，Z = (oy-140)*0.2。 */
(function () {
  'use strict';
  var T = THREE, Q = window.Q;
  var W = Q.W = {};
  W.X = function (ox) { return (ox - 3000) * 0.1; };
  W.Z = function (oy) { return (oy - 140) * 0.2; };
  W.P = function (ox, oy) { return [(ox - 3000) * 0.1, (oy - 140) * 0.2]; };
  W.OX = function (x) { return x * 10 + 3000; };
  W.OY = function (z) { return z * 5 + 140; };
  W.xMin = W.X(136); W.xMax = W.X(5866);       // 画心左右边
  W.zMin = W.Z(0); W.zMax = W.Z(281);
  W.G = { x0: -372, x1: 372, z0: -150, z1: 84 };  // 地面范围

  // ---------- 折线平滑并等距重采样 ----------
  function cr(p0, p1, p2, p3, t) {
    var t2 = t * t, t3 = t2 * t;
    return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
  }
  function smoothLine(pts, step) {
    var dense = [], n = pts.length, i, k, d = pts[0].length;
    for (i = 0; i < n - 1; i++) {
      var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
      var L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), m = Math.max(2, Math.ceil(L / (step * 0.5)));
      for (k = 0; k < m; k++) {
        var t = k / m, q = [];
        for (var c = 0; c < d; c++) q.push(c < 2 ? cr(p0[c], p1[c], p2[c], p3[c], t) : p1[c] + (p2[c] - p1[c]) * t);
        dense.push(q);
      }
    }
    dense.push(pts[n - 1].slice());
    // 等距
    var out = [dense[0].slice()], acc = 0, target = step;
    for (i = 1; i < dense.length; i++) {
      var a = dense[i - 1], b = dense[i], seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
      while (acc + seg >= target) {
        var f = (target - acc) / seg, q2 = [];
        for (var c2 = 0; c2 < d; c2++) q2.push(a[c2] + (b[c2] - a[c2]) * f);
        out.push(q2); target += step;
      }
      acc += seg;
    }
    return out;
  }
  W.smoothLine = smoothLine;

  // ---------- 水系（世界坐标：x, z, 半宽） ----------
  var waterDef = {
    // 汴河：自画右下入画，贴北岸西行，过虹桥后折向西北出画
    river: [[215, 110, 12], [190, 78, 12], [170, 60, 12], [160, 46, 12.5], [152, 34, 12.5], [145, 26, 13.5], [134, 20.5, 14], [125, 17.5, 14],
      [110, 13, 19], [90, 11.5, 19], [70, 11, 18.6], [50, 3.5, 16.5], [30, 2, 13.5], [12.5, 3.6, 12], [2, -4, 12], [-7.6, -11.2, 11.5],
      [-20, -9.6, 10], [-35, -9.4, 9.5], [-47, -11, 10], [-54.5, -18, 11], [-56, -28, 11], [-56, -46, 11], [-58, -80, 11], [-60, -160, 11]],
    // 城门外护城河（南北向）
    moat: [[-160, -160, 6.5], [-161, -60, 6.5], [-160, -20, 6.5], [-160, 11, 6.5], [-160.5, 40, 6.5], [-161, 90, 6.5]],
    // 卷首郊野的溪塘
    creek: [[330, 22, 9], [305, 20, 9], [280, 19.2, 9], [260, 18.4, 9.5], [240, 16.4, 11], [225, 19, 10.5], [215, 24.5, 9], [205, 32, 9], [190, 48, 9], [182, 62, 10]],
    inlet: [[266, 14, 2.6], [266.2, 8, 2.4], [265.6, 3.5, 2.0], [265, 1, 1.2]]
  };
  var waters = W.waters = [];
  Object.keys(waterDef).forEach(function (k) {
    var d = smoothLine(waterDef[k], 1.0), x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    d.forEach(function (p) { x0 = Math.min(x0, p[0] - p[2]); x1 = Math.max(x1, p[0] + p[2]); z0 = Math.min(z0, p[1] - p[2]); z1 = Math.max(z1, p[1] + p[2]); });
    waters.push({ name: k, pts: d, x0: x0, x1: x1, z0: z0, z1: z1 });
  });
  // 到水面边缘的距离（水中为负）
  W.waterD = function (x, z, only) {
    var best = 1e9;
    for (var w = 0; w < waters.length; w++) {
      var ww = waters[w];
      if (only && ww.name !== only) continue;
      if (x < ww.x0 - 12 || x > ww.x1 + 12 || z < ww.z0 - 12 || z > ww.z1 + 12) continue;
      var p = ww.pts;
      for (var i = 0; i < p.length; i++) {
        var dx = x - p[i][0], dz = z - p[i][1];
        var d = Math.sqrt(dx * dx + dz * dz) - p[i][2];
        if (d < best) best = d;
      }
    }
    return best;
  };
  // 河中心线上的点与切向（放船用）：t 为沿河弧长
  W.riverAt = function (name, s) {
    var ww = waters.filter(function (w) { return w.name === name; })[0], p = ww.pts;
    var i = Q.clamp(Math.floor(s), 0, p.length - 2);
    var a = p[i], b = p[i + 1];
    return { x: a[0], z: a[1], hw: a[2], tx: b[0] - a[0], tz: b[1] - a[1] };
  };
  W.WATER_Y = -0.5;

  // ---------- 城墙土垣、城门 ----------
  W.gate = { x: W.X(1105), z: W.Z(190), len: 15, wid: 26, h: 8.5, passW: 5.6, passH: 5.2 };
  W.rampartH = function (x, z) {
    var g = W.gate, dx = Math.abs(x - g.x), dz = Math.abs(z - g.z);
    if (dx > 12) return 0;
    var prof = Q.smooth(11, 4.5, dx) * 6.2;
    var gap = Q.smooth(g.wid / 2 - 2.5, g.wid / 2 + 1.5, dz);
    return prof * gap;
  };

  // ---------- 桥 ----------
  W.bridge = { cx: 2, cz: -4, dx: 0.6, dz: -0.8, half: 17.5, hw: 3.9, rise: 4.5 };
  W.bridgeUV = function (x, z) {
    var b = W.bridge, px = x - b.cx, pz = z - b.cz;
    return [px * b.dx + pz * b.dz, px * (-b.dz) + pz * b.dx];
  };
  W.bridgeXZ = function (u, v) { var b = W.bridge; return [b.cx + u * b.dx - v * b.dz, b.cz + u * b.dz + v * b.dx]; };
  W.archY = function (u) { var b = W.bridge, t = u / b.half; return Math.abs(t) >= 1 ? 0 : b.rise * (1 - t * t) * (1 - 0.18 * t * t) / 1; };
  W.moatBridge = { x0: -169.6, x1: -150.4, z0: 5.0, z1: 17.8, y: 0.38 };
  W.footBridge = { x0: 261.4, x1: 270.6, z0: 6.6, z1: 9.0, y: 0.3 };
  // 行人脚下的高度（路面为 0，桥面抬高）
  W.deckY = function (x, z) {
    var b = W.bridge;
    if (x > -22 && x < 26 && z > -24 && z < 16) {
      var uv = W.bridgeUV(x, z);
      if (Math.abs(uv[1]) < b.hw + 0.4 && Math.abs(uv[0]) < b.half) return W.archY(uv[0]);
    }
    var m = W.moatBridge;
    if (x > m.x0 - 2 && x < m.x1 + 2 && z > m.z0 && z < m.z1) return m.y * Q.smooth(m.x0 - 2, m.x0, x) * Q.smooth(m.x1 + 2, m.x1, x);
    var f = W.footBridge;
    if (x > f.x0 - 1 && x < f.x1 + 1 && z > f.z0 - 0.5 && z < f.z1 + 0.5) return f.y;
    return 0;
  };
  // 地形高度
  W.height = function (x, z) {
    var d = W.waterD(x, z);
    var y = d >= 1.0 ? 0 : -3 * Q.smooth(1.0, -1.5, d);
    y += W.rampartH(x, z);
    return y;
  };

  // ---------- 道路（底稿坐标 ox, oy, 半宽） ----------
  var roadDef = {
    // 主路：卷首郊野小径 → 汴河北岸街 → 虹桥 → 桥南街 → 十字路口 → 护城河桥 → 城门 → 城内大街
    east: [[6080, 100, 1.5], [5900, 118, 1.5], [5760, 146, 1.5], [5712, 172, 1.3], [5660, 178, 1.2], [5606, 180, 1.4], [5540, 172, 1.6], [5450, 161, 1.8], [5250, 164, 1.8], [5110, 196, 1.8],
      [4950, 224, 2], [4790, 233, 2.2], [4660, 224, 2.4], [4565, 186, 3], [4500, 146, 4], [4425, 120, 5], [4330, 70, 3.4], [4215, 40, 3.2], [4010, 20, 3.2],
      [3860, 22, 3.2], [3760, 14, 3.2], [3560, 2, 3.2], [3400, 2, 3.2], [3270, 8, 3.2], [3180, 20, 3.4], [3134, 40, 3.6], [3122, 52, 3.6]],
    bridge: [[3122, 52, 3.6], [3020, 120, 3.6], [2918, 188, 3.6]],
    west: [[2918, 188, 3.8], [2870, 216, 4.2], [2780, 242, 4.4], [2660, 258, 4.4], [2500, 268, 4], [2300, 268, 4], [2170, 262, 4], [2100, 240, 4.4], [2080, 196, 5],
      [2040, 162, 6], [1950, 152, 6.4], [1800, 152, 6.6], [1650, 160, 6.4], [1545, 182, 5.8], [1500, 196, 5.6], [1400, 197, 5.6], [1305, 197, 5.6], [1250, 194, 5.4],
      [1180, 190, 2.6], [1105, 190, 2.6], [1030, 190, 2.8], [980, 188, 6], [850, 186, 7.4], [700, 180, 8], [560, 174, 9.4], [420, 172, 8], [300, 174, 6.6], [200, 178, 6], [100, 180, 6], [20, 182, 6]],
    north: [[2080, 196, 4], [2105, 136, 3.8], [2150, 84, 3.6], [2205, 32, 3.4], [2250, -30, 3.4], [2290, -120, 3.4]],
    lane: [[1662, 152, 2.6], [1652, 92, 2.4], [1644, 30, 2.4], [1636, -40, 2.4]],
    cityN: [[575, 168, 4.6], [572, 104, 4.4], [576, 36, 4.2], [582, -40, 4.2], [586, -140, 4.2]],
    cityS: [[424, 186, 4.4], [414, 240, 4.2], [404, 310, 4.2], [398, 400, 4.2]],
    tomb: [[4930, -90, 1.4], [4900, -20, 1.4], [4866, 34, 1.5], [4806, 108, 1.5], [4710, 150, 1.6], [4620, 170, 1.8], [4565, 186, 2]],
    bankN: [[3134, 40, 2.4], [3080, 14, 2.6], [3050, -30, 2.6], [3040, -100, 2.6]],
    shore: [[4425, 120, 3], [4390, 150, 2.4], [4350, 160, 2]]
  };
  function Path(pts, step) {
    this.step = step || 0.5;
    this.p = smoothLine(pts, this.step);
    this.n = this.p.length;
    this.len = (this.n - 1) * this.step;
  }
  // s: 弧长；lat: 向行进方向右侧的偏移；dir: ±1
  Path.prototype.at = function (s, lat, dir, out) {
    var L = this.len;
    if (dir < 0) s = L - s;
    if (s < 0) s = 0; else if (s > L - 0.001) s = L - 0.001;
    var f = s / this.step, i = Math.floor(f); f -= i;
    var a = this.p[i], b = this.p[i + 1];
    var tx = b[0] - a[0], tz = b[1] - a[1], l = Math.sqrt(tx * tx + tz * tz) || 1;
    tx /= l; tz /= l;
    if (dir < 0) { tx = -tx; tz = -tz; }
    // 右手侧法向：(-tz, tx) 旋转……行进方向 (tx,tz) 的右侧是 (-tz, tx) 取反 → (tz? ) 见下
    var x = a[0] + (b[0] - a[0]) * f, z = a[1] + (b[1] - a[1]) * f;
    out.x = x - tz * lat; out.z = z + tx * lat;
    out.yaw = Math.atan2(tx, tz);
    out.hw = a[2] || 2;
    out.y = W.deckY(out.x, out.z);
    return out;
  };
  W.Path = Path;
  W.roads = {};
  Object.keys(roadDef).forEach(function (k) {
    var pts = roadDef[k].map(function (p) { return [W.X(p[0]), W.Z(p[1]), p[2]]; });
    W.roads[k] = new Path(pts, 0.5);
  });
  // 把几段接成整条主路
  function joinPaths(names) {
    var all = [];
    names.forEach(function (n, i) { var p = W.roads[n].p; for (var j = (i ? 1 : 0); j < p.length; j++) all.push(p[j]); });
    var P = Object.create(Path.prototype); P.step = 0.5; P.p = all; P.n = all.length; P.len = (all.length - 1) * 0.5; return P;
  }
  W.roads.main = joinPaths(['east', 'bridge', 'west']);
  W.makePath = function (oxy, step) { return new Path(oxy.map(function (p) { return [W.X(p[0]), W.Z(p[1]), p[2] || 2]; }), step || 0.5); };
  W.makePathW = function (pts, step) { return new Path(pts, step || 0.5); };

  // ---------- 田畦 ----------
  W.fields = [
    { ox: [4530, 4640], oy: [-40, 40], ang: 0.1 }, { ox: [4650, 4800], oy: [-30, 60], ang: -0.5 },
    { ox: [4560, 4700], oy: [44, 88], ang: 0.05 }, { ox: [4940, 5120], oy: [-60, 40], ang: 0.4 }, { ox: [5150, 5330], oy: [-80, 0], ang: -0.15 },
    { ox: [5560, 5800], oy: [-70, 30], ang: 0.2 }, { ox: [4720, 4810], oy: [70, 118], ang: -0.45 }
  ];

  // ---------- 地面大贴图 ----------
  function paintGround() {
    var G = W.G, cw = 4096, ch = 1280;
    var c = Q.canvas(cw, ch), g = c.getContext('2d');
    var sx = cw / (G.x1 - G.x0), sz = ch / (G.z1 - G.z0);
    var r = Q.mulberry(4242), COL = Q.COL;
    g.fillStyle = Q.css(COL.silk); g.fillRect(0, 0, cw, ch);
    g.setTransform(sx, 0, 0, sz, -G.x0 * sx, -G.z0 * sz);
    var i, k;
    // 大块晕染
    for (i = 0; i < 1400; i++) {
      var x = G.x0 + r() * (G.x1 - G.x0), z = G.z0 + r() * (G.z1 - G.z0), rad = 4 + r() * 24;
      var gr = g.createRadialGradient(x, z, 0, x, z, rad);
      gr.addColorStop(0, r() > 0.5 ? 'rgba(232,210,160,0.10)' : 'rgba(120,92,48,0.085)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(x - rad, z - rad, rad * 2, rad * 2);
    }
    // 城内地面略亮略平
    var cg = g.createLinearGradient(-200, 0, -170, 0); cg.addColorStop(0, 'rgba(214,190,138,0.35)'); cg.addColorStop(1, 'rgba(214,190,138,0)');
    g.fillStyle = 'rgba(214,190,138,0.35)'; g.fillRect(G.x0, G.z0, -200 - G.x0, G.z1 - G.z0);
    // 田畦
    W.fields.forEach(function (f) {
      var x0 = W.X(f.ox[0]), x1 = W.X(f.ox[1]), z0 = W.Z(f.oy[0]), z1 = W.Z(f.oy[1]);
      var cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, hw = (x1 - x0) / 2, hd = (z1 - z0) / 2;
      g.save(); g.translate(cx, cz); g.rotate(f.ang);
      var rows = Math.max(2, Math.round(hd * 2 / 3.2));
      for (var j = 0; j < rows; j++) {
        var zz = -hd + j * (2 * hd / rows), hh = 2 * hd / rows - 0.5;
        g.fillStyle = j % 2 ? 'rgba(128,128,82,0.20)' : 'rgba(150,130,80,0.16)';
        g.fillRect(-hw, zz, 2 * hw, hh);
        g.strokeStyle = 'rgba(70,58,38,0.35)'; g.lineWidth = 0.14; g.strokeRect(-hw, zz, 2 * hw, hh);
        for (var q = 0; q < hw * 2 / 0.45; q++) {
          g.strokeStyle = 'rgba(80,84,50,' + (0.14 + r() * 0.18) + ')'; g.lineWidth = 0.09;
          g.beginPath(); g.moveTo(-hw + q * 0.45 + r() * 0.1, zz + 0.15); g.lineTo(-hw + q * 0.45 + r() * 0.1, zz + hh - 0.15); g.stroke();
        }
      }
      g.restore();
    });
    // 水岸的水墨晕
    W.waters.forEach(function (w) {
      var p = w.pts;
      [[4.2, 0.035], [2.4, 0.06], [1.0, 0.10]].forEach(function (lv) {
        g.fillStyle = 'rgba(96,74,42,' + lv[1] + ')';
        for (i = 0; i < p.length; i += 2) { g.beginPath(); g.arc(p[i][0], p[i][1], p[i][2] + lv[0], 0, 6.3); g.fill(); }
      });
      g.fillStyle = 'rgba(120,100,60,0.55)';
      for (i = 0; i < p.length; i++) { g.beginPath(); g.arc(p[i][0], p[i][1], Math.max(0.5, p[i][2] - 0.2), 0, 6.3); g.fill(); }
    });
    // 道路：三层由宽到窄叠出软边
    var layer = Q.canvas(cw, ch), lg = layer.getContext('2d');
    var names = ['east', 'west', 'north', 'lane', 'cityN', 'cityS', 'tomb', 'bankN', 'shore'];
    [[1.6, 0.20], [0.5, 0.26], [-0.7, 0.30]].forEach(function (lv) {
      lg.setTransform(1, 0, 0, 1, 0, 0); lg.clearRect(0, 0, cw, ch);
      lg.setTransform(sx, 0, 0, sz, -G.x0 * sx, -G.z0 * sz);
      lg.fillStyle = Q.css(Q.COL.silkLight);
      names.forEach(function (n) {
        var p = W.roads[n].p;
        for (i = 0; i < p.length; i += 2) { lg.beginPath(); lg.arc(p[i][0], p[i][1], Math.max(0.3, p[i][2] + lv[0]), 0, 6.3); lg.fill(); }
      });
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = lv[1]; g.drawImage(layer, 0, 0); g.globalAlpha = 1;
      g.setTransform(sx, 0, 0, sz, -G.x0 * sx, -G.z0 * sz);
    });
    // 车辙、足迹
    names.forEach(function (n) {
      var P = W.roads[n], o = {};
      for (k = 0; k < 7; k++) {
        var lat = (r() - 0.5) * 1.5, s = 0;
        while (s < P.len) {
          var l = 3 + r() * 14;
          P.at(s, lat * (P.p[Math.min(P.n - 1, Math.floor(s * 2))][2] || 2), 1, o);
          g.strokeStyle = 'rgba(92,70,40,' + (0.07 + r() * 0.11) + ')'; g.lineWidth = 0.12 + r() * 0.14;
          g.beginPath(); g.moveTo(o.x, o.z);
          for (var q = 1; q <= 5; q++) { P.at(s + l * q / 5, lat * (o.hw), 1, o); g.lineTo(o.x, o.z); }
          g.stroke(); s += l + 2 + r() * 10;
        }
      }
    });
    // 岸线勾勒与皴擦
    W.waters.forEach(function (w) {
      var p = w.pts;
      for (var side = -1; side <= 1; side += 2) {
        for (var pass = 0; pass < 3; pass++) {
          var off = [0.5, 1.5, 2.8][pass];
          g.strokeStyle = 'rgba(58,44,26,' + [0.5, 0.22, 0.13][pass] + ')'; g.lineWidth = [0.2, 0.16, 0.14][pass];
          g.beginPath(); var pen = false;
          for (i = 1; i < p.length - 1; i++) {
            var tx = p[i + 1][0] - p[i - 1][0], tz = p[i + 1][1] - p[i - 1][1], l = Math.hypot(tx, tz) || 1;
            var wob = Math.sin(i * 0.37 + pass * 2 + side) * 0.35 + Math.sin(i * 0.11 + pass) * 0.5;
            var px = p[i][0] + side * (-tz / l) * (p[i][2] + off + wob), pz = p[i][1] + side * (tx / l) * (p[i][2] + off + wob);
            if (W.waterD(px, pz) < 0.2 || (pass > 0 && r() < 0.12)) { pen = false; continue; }
            if (!pen) { g.moveTo(px, pz); pen = true; } else g.lineTo(px, pz);
          }
          g.stroke();
        }
      }
    });
    // 草点、碎石
    for (i = 0; i < 9000; i++) {
      var gx = G.x0 + r() * (G.x1 - G.x0), gz = G.z0 + r() * (G.z1 - G.z0);
      var inCity = gx < -200, a = inCity ? 0.10 : 0.22;
      g.strokeStyle = r() > 0.4 ? 'rgba(76,74,42,' + a + ')' : 'rgba(70,52,30,' + a + ')'; g.lineWidth = 0.07;
      g.beginPath();
      for (k = 0; k < 3; k++) { g.moveTo(gx + k * 0.12, gz); g.lineTo(gx + k * 0.12 + (r() - 0.5) * 0.2, gz - 0.25 - r() * 0.3); }
      g.stroke();
    }
    var t = new T.CanvasTexture(c);
    t.anisotropy = 8; t.wrapS = t.wrapT = T.ClampToEdgeWrapping;
    return t;
  }

  W.build = function (scene) {
    var G = W.G, step = 2.4;
    var nx = Math.round((G.x1 - G.x0) / step), nz = Math.round((G.z1 - G.z0) / step);
    var geo = new T.PlaneBufferGeometry(G.x1 - G.x0, G.z1 - G.z0, nx, nz);
    geo.rotateX(-Math.PI / 2);
    geo.translate((G.x0 + G.x1) / 2, 0, (G.z0 + G.z1) / 2);
    var pos = geo.attributes.position;
    for (var i = 0; i < pos.count; i++) pos.setY(i, W.height(pos.getX(i), pos.getZ(i)));
    geo.computeVertexNormals();
    var mat = new T.MeshLambertMaterial({ map: paintGround() });
    var detail = Q.texs.silk;
    mat.onBeforeCompile = function (sh) {
      sh.uniforms.detailMap = { value: detail };
      sh.fragmentShader = 'uniform sampler2D detailMap;\n' + sh.fragmentShader.replace('#include <map_fragment>',
        '#include <map_fragment>\n diffuseColor.rgb *= texture2D(detailMap, vUv * vec2(331.0, 104.0)).rgb * 1.03;');
    };
    var ground = new T.Mesh(geo, mat); ground.matrixAutoUpdate = false;
    scene.add(ground); W.ground = ground;
    // 岸坡：沿水系中心线两侧的细网格带，盖住粗网格在岸边的锯齿
    (function () {
      var ds = [3.8, 2.5, 1.3, 0.8, 0.3, -0.3, -1.0, -2.2, -3.8], P = [], U = [], I = [], OK = [];
      function prof(d) { return 0.035 - 2.2 * Q.smooth(1.3, -3.4, d); }
      W.waters.forEach(function (w) {
        var p = w.pts;
        for (var side = -1; side <= 1; side += 2) {
          var base = P.length / 3;
          for (var i = 0; i < p.length; i++) {
            var a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)];
            var tx = b[0] - a[0], tz = b[1] - a[1], l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
            for (var k = 0; k < ds.length; k++) {
              var off = (p[i][2] + ds[k]) * side;
              var x = p[i][0] - tz * off, z = p[i][1] + tx * off;
              var d = Math.min(ds[k], W.waterD(x, z));
              // 急弯内侧偏移线会交叠：与真实距离不符的点作废
              OK.push(Math.abs(W.waterD(x, z, w.name) - ds[k]) < 0.45 ? 1 : 0);
              P.push(x, prof(d) + W.rampartH(x, z), z);
              U.push((x - G.x0) / (G.x1 - G.x0), 1 - (z - G.z0) / (G.z1 - G.z0));
              if (i > 0 && k > 0) {
                var q = base + i * ds.length + k, q0 = q - ds.length;
                if (OK[q] && OK[q0] && OK[q - 1] && OK[q0 - 1]) { if (side > 0) I.push(q0 - 1, q0, q, q0 - 1, q, q - 1); else I.push(q0 - 1, q, q0, q0 - 1, q - 1, q); }
              }
            }
          }
        }
      });
      var sg = new T.BufferGeometry();
      sg.setAttribute('position', new T.Float32BufferAttribute(P, 3));
      sg.setAttribute('uv', new T.Float32BufferAttribute(U, 2));
      sg.setIndex(I); sg.computeVertexNormals();
      var shore = new T.Mesh(sg, mat); shore.matrixAutoUpdate = false; scene.add(shore);
    })();
    // 更远处的绢底
    var far = new T.Mesh(new T.PlaneBufferGeometry(3000, 1600), new T.MeshBasicMaterial({ color: new T.Color(Q.COL.silk[0], Q.COL.silk[1], Q.COL.silk[2]) }));
    far.rotation.x = -Math.PI / 2; far.position.set(0, -0.6, -200); far.updateMatrix(); far.matrixAutoUpdate = false;
    far.material.color.multiplyScalar(0.93);
    scene.add(far);

    // 水面：沿中心线的带状网格
    var wt = Q.texs.water; wt.repeat.set(1, 1);
    var wmat = new T.MeshLambertMaterial({ map: wt, color: new T.Color(Q.COL.water[0], Q.COL.water[1], Q.COL.water[2]) });
    W.waterMat = wmat;
    var P = [], U = [], I = [];
    W.waters.forEach(function (w) {
      var p = w.pts, base = P.length / 3;
      for (var i = 0; i < p.length; i++) {
        var a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)];
        var tx = b[0] - a[0], tz = b[1] - a[1], l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
        var hw = p[i][2] + 1.2;
        var xa = p[i][0] - tz * hw, za = p[i][1] + tx * hw, xb = p[i][0] + tz * hw, zb = p[i][1] - tx * hw;
        P.push(xa, W.WATER_Y, za, xb, W.WATER_Y, zb);
        U.push(xa / 9, za / 9, xb / 9, zb / 9);
        if (i > 0) { var k = base + i * 2; I.push(k - 2, k, k - 1, k - 1, k, k + 1); }
      }
    });
    var wg = new T.BufferGeometry();
    wg.setAttribute('position', new T.Float32BufferAttribute(P, 3));
    wg.setAttribute('uv', new T.Float32BufferAttribute(U, 2));
    wg.setIndex(I);
    var nrm = new Float32Array(P.length); for (var q = 1; q < nrm.length; q += 3) nrm[q] = 1;
    wg.setAttribute('normal', new T.BufferAttribute(nrm, 3));
    var water = new T.Mesh(wg, wmat); water.matrixAutoUpdate = false;
    wmat.side = T.DoubleSide;
    scene.add(water); W.water = water;
  };
  W.tick = function (t) {
    var wt = Q.texs.water;
    wt.offset.x = t * 0.012; wt.offset.y = Math.sin(t * 0.25) * 0.015 + t * 0.004;
  };
})();
