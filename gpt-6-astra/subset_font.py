#!/usr/bin/env python3
"""仅在更改界面汉字后运行。需要 fonttools[woff]，普通构建不依赖它。"""
from pathlib import Path
import re, sys, ctypes, ctypes.util, types
ROOT=Path(__file__).resolve().parent
try:
    import fontTools
except ImportError:
    candidates=list((Path.home()/'.cache/uv/archive-v0').glob('*/fontTools/subset/__init__.py'))
    if not candidates: raise SystemExit('请安装 fonttools[woff] 后重试；已有字库时可直接运行 build.py。')
    sys.path.insert(0,str(candidates[0].parents[2]))
try:
    import brotli
except ImportError:
    # 可使用系统 Brotli 动态库；不下载依赖。
    def lib(name):
        found=ctypes.util.find_library(name)
        if not found:
            path=Path('/opt/homebrew/opt/brotli/lib')/('lib'+name+'.dylib')
            if path.exists(): found=str(path)
        if not found: raise SystemExit('需要 Brotli 库，或 pip install fonttools[woff]。')
        return ctypes.CDLL(found)
    dec,enc=lib('brotlidec'),lib('brotlienc')
    size=ctypes.c_size_t
    dec.BrotliDecoderDecompress.argtypes=[size,ctypes.c_void_p,ctypes.POINTER(size),ctypes.c_void_p]
    enc.BrotliEncoderCompress.argtypes=[ctypes.c_int,ctypes.c_int,ctypes.c_int,size,ctypes.c_void_p,ctypes.POINTER(size),ctypes.c_void_p]
    def decompress(data):
        for mul in [4,16,64,256]:
            n=size(len(data)*mul);out=ctypes.create_string_buffer(n.value)
            if dec.BrotliDecoderDecompress(len(data),data,ctypes.byref(n),out)==1:return out.raw[:n.value]
        raise ValueError('Brotli 解压失败')
    def compress(data,mode=0,quality=11,lgwin=22):
        n=size(len(data)+len(data)//4+1024);out=ctypes.create_string_buffer(n.value)
        if enc.BrotliEncoderCompress(quality,lgwin,mode,len(data),data,ctypes.byref(n),out)!=1: raise ValueError('Brotli 压缩失败')
        return out.raw[:n.value]
    module=types.ModuleType('brotli');module.decompress=decompress;module.compress=compress;module.MODE_FONT=2;sys.modules['brotli']=module
from fontTools.ttLib import TTFont
from fontTools import subset
html=(ROOT/'src/shell.html').read_text()
text=re.sub(r'<[^>]+>','',html)
for path in sorted((ROOT/'src').glob('*.js')):
    source=re.sub(r'/\*.*?\*/|//[^\n]*','',path.read_text(),flags=re.S)
    text+=''.join(re.findall(r"'([^'\n]*)'|\"([^\"\n]*)\"",source).__str__())
chars=''.join(sorted(set(c for c in text if ord(c)>=0x2e80 or 32<=ord(c)<127)))+'°←⌃◈·壹贰叁'
(ROOT/'glyphs.txt').write_text(''.join(sorted(set(chars))))
font=TTFont(ROOT.parent/'fable-5.2/src/vendor/wk-gb2312.woff2')
options=subset.Options();options.flavor='woff2';options.desubroutinize=True
ss=subset.Subsetter(options=options);ss.populate(text=chars);ss.subset(font);font.flavor='woff2';font.save(ROOT/'wenkai-subset.woff2')
print('字体子集：',len(chars),'字，',(ROOT/'wenkai-subset.woff2').stat().st_size,'字节')
