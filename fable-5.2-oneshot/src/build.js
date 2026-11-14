#!/usr/bin/env node
/* 把 src/ 下各模块拼成独立的 index.html（内嵌 three.js r128、子集化的霞鹜文楷、全卷缩略图）。
   用法：node src/build.js
   环境变量：QM_VENDOR（three.min.js 和 wk-gb2312.woff2 所在目录，默认 /home/user/vendor）
             QM_REF（原画参照图目录，默认 ../ref） */
const fs = require('fs'), path = require('path'), cp = require('child_process');
const SRC = __dirname, OUT = path.join(SRC, '..', 'index.html');
const VENDOR = process.env.QM_VENDOR || '/home/user/vendor';
const REF = process.env.QM_REF || path.join(SRC, '..', '..', 'ref');
const ASSETS = path.join(SRC, 'assets');
fs.mkdirSync(ASSETS, { recursive: true });

const mods = fs.readdirSync(SRC).filter(f => /^\d\d-.*\.js$/.test(f)).sort();
const js = mods.map(f => '// ===== ' + f + ' =====\n' + fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n');
const tpl = fs.readFileSync(path.join(SRC, 'index.template.html'), 'utf8');
const css = fs.readFileSync(path.join(SRC, 'style.css'), 'utf8');

// 1. three.js
const threePath = fs.existsSync(path.join(VENDOR, 'three.min.js')) ? path.join(VENDOR, 'three.min.js') : path.join(ASSETS, 'three.min.js');
const three = fs.readFileSync(threePath, 'utf8');
if (!fs.existsSync(path.join(ASSETS, 'three.min.js'))) fs.copyFileSync(threePath, path.join(ASSETS, 'three.min.js'));

// 2. 全卷缩略图（裁去两端裱边，只留画心）
const thumb = path.join(ASSETS, 'thumb.jpg');
if (!fs.existsSync(thumb)) {
  cp.execFileSync('python3', ['-c', `
from PIL import Image
im = Image.open(r'${path.join(REF, 'overview.jpg')}').convert('RGB')
im = im.crop((136, 4, 5866, 277)).resize((2600, 124), Image.LANCZOS)
im.save(r'${thumb}', quality=62, optimize=True)
`]);
}
const thumbB64 = 'data:image/jpeg;base64,' + fs.readFileSync(thumb).toString('base64');

// 3. 字体子集：只收界面和招牌实际用到的字
const chars = new Set();
for (const ch of (js + tpl + css)) { if (ch.codePointAt(0) > 0x2000) chars.add(ch); }
'0123456789·、，。；：“”‘’—…　▾°'.split('').forEach(c => chars.add(c));
const text = [...chars].sort().join('');
const textFile = path.join(ASSETS, 'chars.txt');
const fontOut = path.join(ASSETS, 'font-subset.woff2');
const prev = fs.existsSync(textFile) ? fs.readFileSync(textFile, 'utf8') : '';
const fontSrc = path.join(VENDOR, 'wk-gb2312.woff2');
if ((prev !== text || !fs.existsSync(fontOut)) && fs.existsSync(fontSrc)) {
  fs.writeFileSync(textFile, text);
  cp.execFileSync('pyftsubset', [fontSrc, '--text-file=' + textFile, '--flavor=woff2', '--output-file=' + fontOut, '--no-hinting', '--desubroutinize']);
}
const fontCss = fs.existsSync(fontOut)
  ? '@font-face{font-family:"QMKai";src:url(data:font/woff2;base64,' + fs.readFileSync(fontOut).toString('base64') + ') format("woff2");font-display:block}'
  : '';

const html = tpl
  .replace('/*__FONT__*/', () => fontCss)
  .replace('/*__CSS__*/', () => css)
  .replace('/*__THREE__*/', () => three)
  .replace('/*__THUMB__*/', () => thumbB64)
  .replace('/*__JS__*/', () => js.replace(/<\/script/g, '<\\/script'));
fs.writeFileSync(OUT, html);
console.log('index.html', (html.length / 1024).toFixed(0) + ' KB;', mods.length, 'modules;', chars.size, 'glyphs');
