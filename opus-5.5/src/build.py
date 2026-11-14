#!/usr/bin/env python3
"""把 src/ 下的模块拼成一个独立的 index.html。

用法： python3 src/build.py
- three.js r128 内嵌（默认取 /home/user/vendor/three.min.js，可用环境变量 THREE_JS 指定）
- 霞鹜文楷按页面实际用到的汉字子集化后以 base64 内嵌（需要 fonttools + brotli）
- 导航条的全卷缩略图由 ref/overview.jpg 裁去裱边后生成（需要 Pillow）
"""
import base64, io, os, re, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
REPO = os.path.dirname(ROOT)
THREE = os.environ.get('THREE_JS', '/home/user/vendor/three.min.js')
FONT = os.environ.get('WK_FONT', '/home/user/vendor/wk-gb2312.woff2')
OVERVIEW = os.environ.get('OVERVIEW', os.path.join(REPO, 'ref', 'overview.jpg'))
JS_DIR = os.path.join(HERE, 'js')

MODULES = ['00_base.js', '10_world.js', '20_figures.js', '30_architecture.js', '40_boats.js', '50_scenes.js', '60_camera_ui.js', '99_main.js']


def read(p):
    with open(p, encoding='utf-8') as f:
        return f.read()


def thumb_b64():
    from PIL import Image
    im = Image.open(OVERVIEW).convert('RGB')
    # 画心范围（缩略图坐标 127..5873），与 world.js 的 SCROLL 一致
    sx = im.width / 6000.0
    im = im.crop((int(127 * sx), 0, int(5873 * sx), im.height))
    im = im.resize((2400, int(2400 * im.height / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, 'JPEG', quality=80, optimize=True)
    return base64.b64encode(buf.getvalue()).decode('ascii')


def font_b64(text):
    chars = sorted(set(ch for ch in text if ord(ch) > 0x2000))
    chars += list('0123456789·…，。、：；“”（）《》—')
    with tempfile.TemporaryDirectory() as td:
        out = os.path.join(td, 'sub.woff2')
        cmd = [sys.executable, '-m', 'fontTools.subset', FONT, '--text=' + ''.join(sorted(set(chars))),
               '--flavor=woff2', '--output-file=' + out, '--layout-features=*', '--no-hinting']
        subprocess.check_call(cmd)
        with open(out, 'rb') as f:
            data = f.read()
    print('font subset: %d glyph chars, %d KB' % (len(set(chars)), len(data) // 1024))
    return base64.b64encode(data).decode('ascii')


def main():
    app = '\n'.join('// ---- %s ----\n%s' % (m, read(os.path.join(JS_DIR, m))) for m in MODULES)
    tpl = read(os.path.join(HERE, 'template.html'))
    font = font_b64(tpl + app)
    html = tpl.replace('%%FONT%%', font).replace('%%THUMB%%', thumb_b64())
    html = html.replace('%%APP%%', app)
    three = read(THREE)
    html = html.replace('%%THREE%%', three.replace('</script', '<\\/script'))
    out = os.path.join(ROOT, 'index.html')
    with open(out, 'w', encoding='utf-8') as f:
        f.write(html)
    print('wrote %s (%.1f MB)' % (out, os.path.getsize(out) / 1e6))


if __name__ == '__main__':
    main()
