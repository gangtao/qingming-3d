// build.js  —  在项目根目录运行：node build.js
const fs = require('fs');
const path = require('path');
const https = require('https');

const SRC = path.join(__dirname, 'index.html');
const OUT = path.join(__dirname, 'dist', 'index.html');
const THREE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

(async () => {
  let html = fs.readFileSync(SRC, 'utf8');

  // 1. 下载 three r128（如果本地有缓存则用缓存）
  const cacheDir = path.join(__dirname, 'vendor');
  const cachePath = path.join(cacheDir, 'three.r128.min.js');
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
  let threeCode;
  if (fs.existsSync(cachePath)) {
    threeCode = fs.readFileSync(cachePath, 'utf8');
    console.log('使用缓存 three r128');
  } else {
    console.log('下载 three r128 ...');
    threeCode = await download(THREE_CDN);
    fs.writeFileSync(cachePath, threeCode);
    console.log('已缓存到 vendor/three.r128.min.js');
  }

  // 2. 把 <script src="...three.min.js"></script> 替换为内联
  const scriptTagRe = /<script\s+src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js\/r128\/three\.min\.js"><\/script>/;
  if (!scriptTagRe.test(html)) {
    console.error('未找到 three r128 的 script 标签，请检查 index.html');
    process.exit(1);
  }
  html = html.replace(scriptTagRe, `<script>\n${threeCode}\n</script>`);

  // 3. 输出
  if (!fs.existsSync(path.dirname(OUT))) fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, html);
  console.log('已生成 dist/index.html，大小 ' + (Buffer.byteLength(html) / 1024).toFixed(1) + ' KB');
})();
