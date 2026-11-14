import esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

/**
 * 单页独立离线包构建脚本（scripts/build-standalone.mjs）
 * 将按模块拆分的全部源码（00~07 模块）与 Three.js 核心库、子集化霞鹜文楷字体、
 * 原画全卷缩略图打包合并为一个可直接双击离线打开的独立 index.html。
 */

async function buildStandaloneHtml() {
  const result = await esbuild.build({
    entryPoints: ['src/qmsht/standalone-entry.ts'],
    bundle: true,
    minify: true,
    format: 'iife',
    target: ['es2020'],
    write: false,
  });

  const bundledJs = result.outputFiles[0].text;
  // 防止脚本内出现 </script> 提前闭合标签
  const safeJs = bundledJs.replace(/<\/script>/gi, '<\\/script>');

  const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>清明上河图 · 三维长卷</title>
  <meta name="description" content="基于北宋张择端《清明上河图》（故宫博物院藏本）逐段重建的三维交互式数字长卷，完整呈现郊野春色、汴河虹桥、城门街市三大段落与百态市井人物。" />
  <style>
    html, body, #root {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #cbb793;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>${safeJs}</script>
</body>
</html>
`;

  const standaloneDir = path.resolve('standalone');
  fs.mkdirSync(standaloneDir, { recursive: true });
  const standalonePath = path.join(standaloneDir, 'index.html');
  fs.writeFileSync(standalonePath, html, 'utf8');

  // 若存在 dist 目录（vite build 产物），同步写入单文件版 dist/index.html 以便部署与下载直接离线可用
  const distDir = path.resolve('dist');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'index.html'), html, 'utf8');
  }

  const sizeKb = (fs.statSync(standalonePath).size / 1024).toFixed(1);
  console.log(`[build-standalone] 已生成离线独立单页 standalone/index.html (${sizeKb} KB)`);
}

buildStandaloneHtml().catch((err) => {
  console.error(err);
  process.exit(1);
});
