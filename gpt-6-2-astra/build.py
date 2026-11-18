"""Rebuild the offline scroll with the repository's bundled Three.js and WenKai."""
import base64
from pathlib import Path

here = Path(__file__).resolve().parent
repo = here.parent
src = here / 'src'
def encoded(path):
    return base64.b64encode(path.read_bytes()).decode()

modules = ['core', 'terrain', 'architecture', 'life', 'boats', 'scenes', 'view']
page = (src / 'page.html').read_text()
page = page.replace('FONT', encoded(repo / 'gpt-6-astra/wenkai-subset.woff2'))
page = page.replace('SCROLL', encoded(repo / 'ref/overview.jpg'))
page = page.replace('THREELIB', (repo / 'fable-5.2-oneshot/src/assets/three.min.js').read_text())
page = page.replace('MODULES', '\n'.join((src / f'{name}.js').read_text() for name in modules))
(here / 'index.html').write_text(page)
