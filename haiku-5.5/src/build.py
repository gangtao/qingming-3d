#!/usr/bin/env python3
"""把 src/ 下的模块拼成单页 index.html（离线可开）。

用法：python3 src/build.py   （在 haiku-5.5/ 目录下执行，或任意目录）
做的事：
  1. 按文件名顺序拼接 src/*.js 为一个 <script>；three.js r128 内联（src/lib/three.min.js）。
  2. 从 src/lib/wk-gb2312.woff2 里只抽出页面用到的字（pyftsubset），内嵌为 base64。
  3. 把原画全卷（../ref/overview.jpg）缩成一条 JPEG，内嵌作导航条底图。
需要：python3、Pillow、fonttools（含 brotli，用于 woff2）。
"""
import base64, glob, io, os, re, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(HERE, '..', 'index.html'))
LIB = os.path.join(HERE, 'lib')
OVERVIEW = os.path.abspath(os.path.join(HERE, '..', '..', 'ref', 'overview.jpg'))


def read(p):
    with open(p, encoding='utf8') as f:
        return f.read()


def cjk_chars(text):
    # 中文、全角标点、常用符号
    return set(re.findall(r'[　-〿＀-￯ -⁯‐-‧·•…℃°▾一-鿿]', text))


def build_font(chars):
    src = os.path.join(LIB, 'wk-gb2312.woff2')
    with tempfile.TemporaryDirectory() as td:
        out = os.path.join(td, 'sub.woff2')
        text = ''.join(sorted(chars)) + ''.join(chr(c) for c in range(0x20, 0x7f))
        text_file = os.path.join(td, 'text.txt')
        with open(text_file, 'w', encoding='utf8') as f:
            f.write(text)
        subprocess.run([sys.executable, '-m', 'fontTools.subset', src, f'--text-file={text_file}',
                        f'--output-file={out}', '--flavor=woff2', '--layout-features=*'],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        with open(out, 'rb') as f:
            return base64.b64encode(f.read()).decode('ascii')


def build_nav():
    from PIL import Image
    im = Image.open(OVERVIEW).convert('RGB')
    im = im.resize((1600, 75), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, 'JPEG', quality=84, optimize=True)
    return base64.b64encode(buf.getvalue()).decode('ascii')


def main():
    modules = sorted(glob.glob(os.path.join(HERE, '[0-9][0-9]_*.js')))
    app = '\n'.join(read(m) for m in modules)
    html = read(os.path.join(HERE, 'index.html'))
    three = read(os.path.join(LIB, 'three.min.js'))

    # 字：扫描所有源码与模板里的中文字符
    chars = set()
    for p in modules + [os.path.join(HERE, 'index.html')]:
        chars |= cjk_chars(read(p))
    font_b64 = build_font(chars)
    nav_b64 = build_nav()

    html = html.replace('/*FONT*/', font_b64)
    html = html.replace('<script>/*THREE*/</script>', '<script>\n' + three + '\n</script>')
    html = html.replace('/*APP*/', app.replace('/*NAV*/', nav_b64))
    html = html.replace('/*NAV*/', nav_b64)
    with open(OUT, 'w', encoding='utf8') as f:
        f.write(html)
    print(f'wrote {OUT}  ({len(html) / 1e6:.2f} MB, {len(chars)} CJK chars in font)')


if __name__ == '__main__':
    main()
