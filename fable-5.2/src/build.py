import re,base64,subprocess,os,sys
D=os.path.dirname(os.path.abspath(__file__))+'/'
page=open(D+'page.html',encoding='utf-8').read();js='\n'.join(open(D+f,encoding='utf-8').read() for f in ['e1.js','detail.js','world.js','e2.js','boat.js','fx.js','lab.js','layoutA.js','layoutB.js','ui.js'])
s=page.replace('/*MAIN*/',js)
chars=set(chr(c) for c in range(0x20,0x7f))|set(ch for ch in s if ord(ch)>0x7f)
open('/tmp/qm-chars.txt','w',encoding='utf-8').write(''.join(sorted(chars)))
subprocess.run(['pyftsubset',D+'vendor/wk-gb2312.woff2','--text-file=/tmp/qm-chars.txt','--flavor=woff2','--output-file=/tmp/qm.woff2','--no-hinting'],check=True)
b=open('/tmp/qm.woff2','rb').read();print('font',len(b))
s=s.replace('/*FONT*/','/* 霞鹜文楷 LXGW WenKai（SIL OFL 1.1），只嵌入本页用到的字 */\n@font-face{font-family:"LXGW WenKai";font-weight:400 900;src:url(data:font/woff2;base64,'+base64.b64encode(b).decode()+') format("woff2")}')
s=s.replace('/*MINIMAP*/','url(data:image/jpeg;base64,'+base64.b64encode(open(D+'minimap.jpg','rb').read()).decode()+')')
art=s.replace('<!--THREE-->','<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>')
open(D+'../qingming-3d-artifact.html','w',encoding='utf-8').write(art)
three=open(D+'vendor/three.min.js',encoding='utf-8').read()
alone='<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>'+s.replace('<!--THREE-->','<script>'+three+'</script>')+'</body></html>'
open(D+'../index.html','w',encoding='utf-8').write(alone);print(len(art),len(alone))
