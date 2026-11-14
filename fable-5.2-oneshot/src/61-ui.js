/* 界面：全卷缩略导航条、视角面板、段落标题与说明、题签、操作提示 */
(function () {
  'use strict';
  var Q = window.Q, W = Q.W, T = THREE;
  var $ = function (id) { return document.getElementById(id); };
  var ui = Q.ui = { labelsOn: true };
  // 三大段（按底稿横坐标分界）
  var SECS = [
    { name: '城门街市', ox0: 136, ox1: 2500 },
    { name: '汴河虹桥', ox0: 2500, ox1: 4300 },
    { name: '郊野春色', ox0: 4300, ox1: 5866 }
  ];
  var ZONES = [
    [5400, 9999, '郊野春色', '卷首 · 疏林薄雾', '薄雾笼着疏林与溪塘。几匹驮炭的毛驴由脚夫赶着，过了小板桥，沿土路往城里去。'],
    [4950, 5400, '郊野春色', '村舍老柳', '茅檐农舍掩在枯树之间，打麦场上搁着石碾；水边几株老柳，才抽出稀疏的新条。'],
    [4300, 4950, '郊野春色', '踏青归来', '扫墓的一行人抬着插满柳枝的轿子回城，路旁茶棚里有人歇脚，前面渐近汴河码头。'],
    [3800, 4300, '汴河虹桥', '汴河码头', '漕船靠岸卸粮，脚夫扛着麻袋上岸，货主坐在粮包上发签；沿河是饭铺酒肆。'],
    [3250, 3800, '汴河虹桥', '漕船往来', '大船首尾相接泊在北岸；一队纤夫弓着身子，拉着逆水的船缓缓上行。'],
    [2850, 3250, '汴河虹桥', '虹桥', '一艘大船放倒了桅杆正要过桥，船工撑篙呼喊，桥上桥下挤满了看热闹的人。'],
    [2500, 2850, '汴河虹桥', '桥南脚店', '桥头摊贩云集，伞棚相接；“十千脚店”门前扎着高高的彩楼欢门。'],
    [1900, 2500, '城门街市', '十字路口', '车铺里木匠正在修车轮，棚下围着一圈听书的人；席篷牛车缓缓走过街口。'],
    [1250, 1900, '城门街市', '护城河外', '老柳夹道，轿子、牛车、驮队往来不绝；平桥栏杆上倚着看水的闲人。'],
    [950, 1250, '城门街市', '城门', '砖砌城台上是木构城楼，一队骆驼正穿过门洞，驼铃声里出城而去。'],
    [480, 950, '城门街市', '孙羊正店', '城内最大的酒楼，彩楼欢门高耸，楼上有人凭栏对饮，门前车马喧阗。'],
    [-999, 480, '城门街市', '卷尾 · 街市', '“赵太丞家”医铺与“久住王员外家”客店隔街相望，街口有人围着听书问卦。']
  ];
  var labs = [];
  Q.label = function (text, x, y, z, big) {
    var el = document.createElement('div'); el.className = 'lab' + (big ? ' big' : ''); el.textContent = text; el.style.display = 'none';
    $('labels').appendChild(el);
    labs.push({ el: el, x: x, y: y, z: z, big: big, on: false });
  };

  ui.init = function () {
    var nav = $('nav'), navH;
    $('navImg').style.backgroundImage = 'url(' + window.QM_THUMB + ')';
    function layout() {
      navH = Q.clamp(Math.round(window.innerWidth / 20.46), 36, 96);
      document.documentElement.style.setProperty('--navh', navH + 'px');
      nav.style.height = navH + 'px';
    }
    layout(); window.addEventListener('resize', layout);
    var secEls = [];
    SECS.forEach(function (s) {
      var e = document.createElement('span'); e.textContent = s.name;
      e.style.left = ((s.ox0 - 136) / (5866 - 136) * 100) + '%'; e.style.width = ((s.ox1 - s.ox0) / (5866 - 136) * 100) + '%';
      $('navSecs').appendChild(e); secEls.push(e);
    });
    ui.secEls = secEls;
    // 导航条：点击或拖动跳转
    var dragging = false;
    function jump(e) {
      var r = nav.getBoundingClientRect(), f = Q.clamp((e.clientX - r.left) / r.width, 0, 1);
      Q.cam.x = W.xMin + f * (W.xMax - W.xMin);
      if (!Q.cam.moved) { Q.cam.moved = true; Q.cam.onFirst && Q.cam.onFirst(); }
    }
    nav.addEventListener('pointerdown', function (e) { dragging = true; nav.setPointerCapture && nav.setPointerCapture(e.pointerId); jump(e); e.preventDefault(); });
    nav.addEventListener('pointermove', function (e) { if (dragging) jump(e); });
    nav.addEventListener('pointerup', function () { dragging = false; });
    nav.addEventListener('pointercancel', function () { dragging = false; });
    // 面板
    var panel = $('panel');
    if (window.innerWidth < 720) panel.classList.add('closed');
    $('panelHead').addEventListener('click', function () { panel.classList.toggle('closed'); });
    var sZ = $('sZoom'), sP = $('sPitch'), sY = $('sYaw'), busy = null;
    function bind(el, fn) {
      el.addEventListener('input', function () { busy = el; fn(+el.value); if (!Q.cam.moved) { Q.cam.moved = true; Q.cam.onFirst && Q.cam.onFirst(); } });
      el.addEventListener('change', function () { busy = null; });
      el.addEventListener('pointerup', function () { busy = null; });
    }
    bind(sZ, function (v) { var p = Q.cam.getPitchDeg(), keep = Math.abs(Q.cam.pitchOff) > 1e-3; Q.cam.zoom = 1 - v / 1000; if (keep) Q.cam.setPitchDeg(p); Q.cam.set({}); });
    bind(sP, function (v) { Q.cam.setPitchDeg(v); Q.cam.set({}); });
    bind(sY, function (v) { Q.cam.yaw = v * Math.PI / 180; Q.cam.cyaw = ((Q.cam.cyaw + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; });
    ui.syncSliders = function () {
      var c = Q.cam;
      if (busy !== sZ) sZ.value = Math.round((1 - c.zoom) * 1000);
      if (busy !== sP) sP.value = Math.round(c.getPitchDeg());
      if (busy !== sY) { var d = c.yaw * 180 / Math.PI; d = ((d + 180) % 360 + 360) % 360 - 180; sY.value = Math.round(d); }
    };
    $('bLabels').addEventListener('click', function () { ui.labelsOn = !ui.labelsOn; this.classList.toggle('on', ui.labelsOn); });
    $('bReset').addEventListener('click', function () { Q.cam.reset(); });
    // 提示
    var touch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    $('hint').innerHTML = touch && window.innerWidth < 900
      ? '单指拖动平移　双指捏合缩放<br>双指扭转旋转　双指上下推改俯仰<br>底部长卷可点按跳转'
      : '左键拖动平移　滚轮缩放<br>右键或 Shift 加拖动转视角与俯仰<br>方向键、加减号亦可　底部长卷可点按跳转';
    Q.cam.onFirst = function () { setTimeout(function () { $('hint').classList.add('gone'); }, 900); };
  };

  var v = new T.Vector3(), lastZone = -1, lastSec = -1, frame = 0;
  ui.update = function () {
    var c = Q.cam, cw = window.innerWidth, chh = window.innerHeight;
    // 导航框
    var span = W.xMax - W.xMin;
    var a = Q.clamp((c.cx - c.viewHalf - W.xMin) / span, 0, 1), b = Q.clamp((c.cx + c.viewHalf - W.xMin) / span, 0, 1);
    var box = $('navBox');
    box.style.left = (a * 100) + '%'; box.style.width = Math.max(0.6, (b - a) * 100) + '%';
    // 段落
    var ox = W.OX(c.cx), zi = 0;
    for (var i = 0; i < ZONES.length; i++) if (ox >= ZONES[i][0] && ox < ZONES[i][1]) { zi = i; break; }
    if (zi !== lastZone) {
      lastZone = zi; var z = ZONES[zi];
      $('sec').textContent = z[2]; $('sub').textContent = z[3]; $('desc').textContent = z[4];
      var si = z[2] === '城门街市' ? 0 : z[2] === '汴河虹桥' ? 1 : 2;
      if (si !== lastSec) { lastSec = si; ui.secEls.forEach(function (e, k) { e.classList.toggle('cur', k === si); }); }
    }
    if ((frame++ & 7) === 0) ui.syncSliders();
    // 题签
    var cam = c.camera, near = c.dist;
    for (var k = 0; k < labs.length; k++) {
      var L = labs[k], show = ui.labelsOn;
      if (show) {
        v.set(L.x, L.y, L.z).project(cam);
        if (v.z > 1 || v.z < -1 || v.x < -1.1 || v.x > 1.1 || v.y < -1.1 || v.y > 1.1) show = false;
        else {
          var d = Math.hypot(L.x - cam.position.x, L.y - cam.position.y, L.z - cam.position.z);
          var maxD = L.big ? 520 : 260;
          if (d > maxD) show = false;
          else {
            var sx = (v.x * 0.5 + 0.5) * cw, sy = (-v.y * 0.5 + 0.5) * chh;
            var sc = Q.clamp(70 / d, 0.62, 1.25);
            L.el.style.transform = 'translate(' + sx.toFixed(1) + 'px,' + (sy - 12).toFixed(1) + 'px) translate(-50%,-100%) scale(' + sc.toFixed(3) + ')';
            L.el.style.opacity = Q.clamp((maxD - d) / (maxD * 0.25), 0, 1).toFixed(2);
          }
        }
      }
      if (show !== L.on) { L.on = show; L.el.style.display = show ? 'block' : 'none'; }
    }
  };
})();
