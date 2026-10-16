"""Use the manifest as the only version source for every deliverable."""
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
import json,hashlib,base64
root=Path(__file__).parent
out=root.parent
version=json.loads((root/'plugin/manifest.json').read_text())['version']
with ZipFile(out/f'Yevamos-Family-{version}.otzplugin','w',ZIP_DEFLATED) as z:
 for p in sorted((root/'plugin').rglob('*')):
  if p.is_file():z.write(p,p.relative_to(root/'plugin'))
s=(root/'plugin/index.html').read_text().replace('<link rel="stylesheet" href="style.css">','<style>'+(root/'plugin/style.css').read_text()+'</style>')
hashes=[]
for name in ['model.js','app.js']:
 code=(root/'plugin'/name).read_text();assert '</script' not in code.lower()
 hashes.append("'sha256-"+base64.b64encode(hashlib.sha256(code.encode()).digest()).decode()+"'")
 s=s.replace('<script src="'+name+'"></script>','<script>'+code+'</script>')
s=s.replace("script-src 'self'",'script-src '+' '.join(hashes))
(out/f'Yevamos-Family-Preview-{version}.html').write_text(s)
with ZipFile(out/f'Yevamos-Family-source-{version}.zip','w',ZIP_DEFLATED) as z:
 for p in sorted(root.rglob('*')):
  if p.is_file() and not (p.parent==root and p.suffix=='.png' and p.name.startswith(('preview','review'))) and not any(x in p.parts for x in ['__pycache__','.git','node_modules']):z.write(p,p.relative_to(root))
print(f'Built matching {version} Otzaria package, standalone HTML and source archive')
