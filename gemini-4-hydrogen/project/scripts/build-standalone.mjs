import { build } from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const entry = path.join(rootDir, 'src/qingming/standaloneEntry.ts');
const outDir = path.join(rootDir, 'standalone');
const outFile = path.join(outDir, 'index.html');

fs.mkdirSync(outDir, { recursive: true });

const result = await build({
  entryPoints: [entry],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020'],
  write: false,
  legalComments: 'none',
});

const jsCode = result.outputFiles[0].text;
// Escape closing script tags if any exist in bundled JS literals
const safeJs = jsCode.replace(/<\/script>/gi, '<\\/script>');

const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>清明上河图 · 三维长卷</title>
  <style>
    html, body, #app {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background-color: #bfa77f;
      user-select: none;
      -webkit-user-select: none;
      touch-action: none;
    }
  </style>
</head>
<body>
  <div id="app"></div>
  <script>${safeJs}</script>
</body>
</html>
`;

fs.writeFileSync(outFile, html, 'utf8');
const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
console.log(`Built standalone offline file: ${outFile} (${kb} KB)`);
