from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
root=Path(__file__).parent
out=root.parent
with ZipFile(out/'Yevamos-Family-0.5.1.otzplugin','w',ZIP_DEFLATED) as z:
 for p in sorted((root/'plugin').glob('*')):z.write(p,p.name)
s=(root/'plugin/index.html').read_text().replace('<link rel="stylesheet" href="style.css">','<style>'+(root/'plugin/style.css').read_text()+'</style>')
for name in ['model.js','app.js']:s=s.replace('<script src="'+name+'"></script>','<script>'+(root/'plugin'/name).read_text()+'</script>')
(out/'Yevamos-Family-Preview-0.5.1.html').write_text(s)
with ZipFile(out/'Yevamos-Family-source-0.5.1.zip','w',ZIP_DEFLATED) as z:
 for p in sorted(root.rglob('*')):
  if p.is_file() and p.suffix!='.png':z.write(p,p.relative_to(root))
print('Built Otzaria package, standalone HTML and source archive')
