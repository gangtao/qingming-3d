#!/usr/bin/env node
/**
 * 《清明上河图》三维版 —— 模块化源码拆分与单页构建脚本
 * 用法：
 *   1. 从单页提取分模块源码： node build.js --split
 *   2. 将各模块拼合为单页：   node build.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC_DIR = path.join(ROOT, 'src');
const DIST_HTML = path.join(ROOT, 'index.html');
const TEMPLATE_FILE = path.join(SRC_DIR, 'template.html');

const MODULES = [
  '01-parts.js',
  '02-world-terrain.js',
  '03-crowd-vehicles.js',
  '04-buildings-trees.js',
  '05-boats.js',
  '06-scenes.js',
  '07-camera-ui.js'
];

const PLACEHOLDER = '/* __QINGMING_MODULES_BUNDLE__ */';

function splitFromSingleHtml() {
  if (!fs.existsSync(DIST_HTML)) {
    console.error('未找到 index.html，无法拆分。');
    process.exit(1);
  }
  fs.mkdirSync(SRC_DIR, { recursive: true });
  const html = fs.readFileSync(DIST_HTML, 'utf8');

  const modRegex = /\/\/ === MODULE: ([\w.-]+) ===\n([\s\S]*?)\/\/ === END MODULE: \1 ===/g;
  let match;
  let count = 0;
  while ((match = modRegex.exec(html)) !== null) {
    const [, name, body] = match;
    const outPath = path.join(SRC_DIR, name);
    fs.writeFileSync(outPath, body.trim() + '\n', 'utf8');
    console.log(`已提取模块: src/${name}`);
    count++;
  }

  if (count === 0) {
    console.error('未在 index.html 中找到模块标记。');
    process.exit(1);
  }

  const firstMarker = '// === MODULE: ' + MODULES[0] + ' ===';
  const lastMarker = '// === END MODULE: ' + MODULES[MODULES.length - 1] + ' ===';
  const startIdx = html.indexOf(firstMarker);
  const endIdx = html.indexOf(lastMarker) + lastMarker.length;

  const template = html.slice(0, startIdx) + PLACEHOLDER + html.slice(endIdx);
  fs.writeFileSync(TEMPLATE_FILE, template, 'utf8');
  console.log('已生成壳模板: src/template.html');
}

function bundleToSingleHtml() {
  if (!fs.existsSync(TEMPLATE_FILE)) {
    console.error('未找到 src/template.html，请先运行 `node build.js --split` 初始化模块目录。');
    process.exit(1);
  }
  const template = fs.readFileSync(TEMPLATE_FILE, 'utf8');
  const chunks = MODULES.map((name) => {
    const file = path.join(SRC_DIR, name);
    if (!fs.existsSync(file)) {
      throw new Error(`缺少模块文件: src/${name}`);
    }
    const content = fs.readFileSync(file, 'utf8').trim();
    return `// === MODULE: ${name} ===\n${content}\n// === END MODULE: ${name} ===`;
  });

  const output = template.replace(PLACEHOLDER, chunks.join('\n\n\n'));
  fs.writeFileSync(DIST_HTML, output, 'utf8');
  console.log(`已成功打包生成独立单页: index.html (${(Buffer.byteLength(output) / 1024).toFixed(1)} KB)`);
}

if (process.argv.includes('--split')) {
  splitFromSingleHtml();
} else {
  bundleToSingleHtml();
}