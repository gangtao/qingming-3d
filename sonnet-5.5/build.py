#!/usr/bin/env python3
"""把 src/ 下各模块拼成单页 index.html：内嵌 three.js r128、霞鹜文楷子集字体、全卷缩略图。"""
import base64, io, os, re, subprocess, sys, glob
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(here, 'src')
vendor = '/home/user/vendor'
ref = os.path.join(here, '..', 'ref', 'overview.jpg')
work = os.path.join(here, '.build'); os.makedirs(work, exist_ok=True)

mods = sorted(glob.glob(os.path.join(src, '[0-9][0-9]_*.js')))
app = '\n'.join(open(m, encoding='utf-8').read() for m in mods)
tpl = open(os.path.join(src, 'template.html'), encoding='utf-8').read()

# 字体子集：收集用到的全部非 ASCII 字符 + 常用 ASCII
chars = set(c for c in app + tpl if ord(c) > 127) | set(map(chr, range(32, 127)))
chars |= set('▾▴·、，。：；！？（）“”‘’—…　')
open(os.path.join(work, 'chars.txt'), 'w', encoding='utf-8').write(''.join(sorted(chars)))
out = os.path.join(work, 'wk-subset.woff2')
subprocess.check_call([sys.executable, '-m', 'fontTools.subset', os.path.join(vendor, 'wk-gb2312.woff2'),
    '--text-file=' + os.path.join(work, 'chars.txt'), '--flavor=woff2', '--output-file=' + out, '--layout-features=*'])
font = base64.b64encode(open(out, 'rb').read()).decode()

# 缩略图：裁去两侧裱边，缩到 2400 宽
im = Image.open(ref).convert('RGB')
W, H = im.size
im = im.crop((int(W * 0.0195), 0, int(W * 0.9790), H))
im = im.resize((2400, int(2400 * im.size[1] / im.size[0] * 1.0)), Image.LANCZOS)
buf = io.BytesIO(); im.save(buf, 'JPEG', quality=72, optimize=True)
thumb = base64.b64encode(buf.getvalue()).decode()

three = open(os.path.join(vendor, 'three.min.js'), encoding='utf-8').read()
html = tpl.replace('/*FONT*/', font).replace('/*THUMB*/', thumb).replace('/*THREE*/', three.replace('</script>', '<\\/script>')).replace('/*APP*/', app)
open(os.path.join(here, 'index.html'), 'w', encoding='utf-8').write(html)
print('index.html', round(len(html) / 1e6, 2), 'MB; chars', len(chars), 'font', round(len(font) / 1e3), 'KB')
