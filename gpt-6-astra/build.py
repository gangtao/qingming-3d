#!/usr/bin/env python3
"""离线拼装单页。运行：python3 build.py。不需要 npm 或网络。"""
from pathlib import Path
import base64, hashlib
ROOT=Path(__file__).resolve().parent
SRC=ROOT/'src'
VENDOR=ROOT.parent/'fable-5.2/src/vendor'
def b64(p): return base64.b64encode(p.read_bytes()).decode('ascii')
parts=sorted(SRC.glob('[0-9][0-9]-*.js'))
js='\n'.join(p.read_text() for p in parts)
font=ROOT/'wenkai-subset.woff2'
if not font.exists():
    raise SystemExit('缺少 wenkai-subset.woff2；请先运行 subset_font.py。')
css=(SRC/'style.css').read_text().replace('__FONT__',b64(font))
html=(SRC/'shell.html').read_text().replace('/*__STYLE__*/',css).replace('__OVERVIEW__',b64(ROOT.parent/'ref/overview.jpg')).replace('/*__THREE__*/',(VENDOR/'three.min.js').read_text()).replace('/*__APP__*/',js)
(ROOT/'index.html').write_text(html)
print(f'已构建 {ROOT / "index.html"} · {len(html.encode())/1024/1024:.2f} MiB · {len(parts)} 个源码模块')
print('SHA256',hashlib.sha256(html.encode()).hexdigest())
