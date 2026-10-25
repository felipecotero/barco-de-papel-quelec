from pathlib import Path
import re,json,zipfile,base64
P=Path(__file__).resolve().parents[1]
Q=P.parent
def names(text):
 return ','.join((lambda a:f'{a[-1]}:{a[0]}')(x.strip().split(' as ')) for x in text.split(',') if x.strip())

def shared_assets(html,Q,prefix):
 import base64
 from pathlib import Path
 css=(Q/'shared/brand.css').read_text()
 for f in (Q/'assets/fonts').glob('*.woff2'):
  css=css.replace('../assets/fonts/'+f.name,'data:font/woff2;base64,'+base64.b64encode(f.read_bytes()).decode())
 html=re.sub(r'<link rel="stylesheet" href="'+re.escape(prefix)+r'shared/brand.css[^"]*">',lambda m:'<style>'+css+'</style>',html)
 html=re.sub(r'<script src="'+re.escape(prefix)+r'shared/dimensions.js[^"]*"></script>',lambda m:'<script>'+(Q/'shared/dimensions.js').read_text()+'</script>',html)
 html=re.sub(r'<script src="'+re.escape(prefix)+r'shared/studio-render.js[^"]*"></script>',lambda m:'<script>'+(Q/'shared/studio-render.js').read_text().replace('</script','<\\/script')+'</script>',html)
 encrypted=(Q/'private/estimaciones.enc.json').read_text()
 privatejs=(Q/'shared/private-costs.js').read_text().replace('</script','<\\/script')
 html=re.sub(r'<script src="'+re.escape(prefix)+r'shared/private-costs.js[^>]*></script>',lambda m:'<script>window.QUELEC_PRIVATE_ESTIMATE='+encrypted+';'+privatejs+'</script>',html)
 site='https://felipecotero.github.io/barco-de-papel-quelec/'
 html=re.sub(r'href="(?:\.\./)?index.html(?:\?[^"]*)?"',lambda m:'href="'+site+'?rev=I05-C02"',html)
 html=html.replace('href="../index.html"','href="'+site+'?rev=I05-C02"').replace('href="index.html"','href="'+site+'?rev=I05-C02"')
 html=html.replace('href="Abrir-Barco.html"','href="'+site+'Abrir-Barco.html"').replace('href="Abrir-Cauchera.html"','href="'+site+'cauchera/Abrir-Cauchera.html"')
 html=html.replace('href="downloads/','href="'+site+'cauchera/downloads/')
 for f in [Q/'assets/logo-barco.svg',Q/'assets/logo-grulla.svg',Q/'assets/logo-nave.svg',Q/'assets/logo-cauchera.svg']:
  if f.exists():
   uri='data:image/svg+xml;base64,'+base64.b64encode(f.read_bytes()).decode()
   html=html.replace('href="assets/'+f.name+'"','href="'+uri+'"').replace('href="../assets/'+f.name+'"','href="'+uri+'"')
 f=Q/'assets/logo-cauchera.svg'
 html=html.replace('src="../assets/logo-cauchera.svg"','src="data:image/svg+xml;base64,'+base64.b64encode(f.read_bytes()).decode()+'"')
 html+='<!-- Montserrat SIL OFL 1.1: '+(Q/'assets/fonts/OFL-Montserrat.txt').read_text().replace('--','- -')+' -->'
 return html

def inline_path_backend(Q):
 import json
 worker=(Q/'vendor/pathtracer/generateMeshBVH.worker.js').read_text()
 back=(Q/'vendor/pathtracer/pathtracer.js').read_text()
 back=re.sub(r'import\{([^}]+)\}from"three";',lambda m:'const {'+m.group(1).replace(' as ',':')+'}=THREE;',back)
 back=back.replace('new URL("./generateMeshBVH.worker.js",import.meta.url)','__QUELEC_BVH_URL')
 # Chrome rejects module workers from blob:null when opened via file://.
 # This worker is fully bundled, so a classic Blob worker needs no imports.
 back=back.replace('new Worker(__QUELEC_BVH_URL,{type:"module"})','new Worker(__QUELEC_BVH_URL,{type:"classic"})')
 match=re.search(r'export\{([^}]+)\};',back)
 assert match
 exported=','.join((lambda a:a[-1]+':'+a[0])(v.strip().split(' as '))for v in match.group(1).split(','))
 back=back[:match.start()]+'return {'+exported+'};'+back[match.end():]
 assert 'import.meta'not in back
 adapter=(Q/'shared/path-render.js').read_text()
 adapter=adapter.replace("const loadBackend = () => backendPromise ||= import('../vendor/pathtracer/pathtracer.js');","const loadBackend = () => Promise.resolve(__QUELEC_PATH_BACKEND);")
 adapter=re.sub(r'\bexport function\s+', 'function ', adapter)
 licenses=(Q/'vendor/pathtracer/LICENSE-three-gpu-pathtracer.txt').read_text()+(Q/'vendor/pathtracer/LICENSE-three-mesh-bvh.txt').read_text()
 return '/*'+licenses+'*/\nconst __QUELEC_BVH_URL=URL.createObjectURL(new Blob(['+json.dumps(worker)+'],{type:"text/javascript"}));\nconst __QUELEC_PATH_BACKEND=(()=>{'+back+'})();\nconst createPathRenderer=(()=>{'+adapter+';return createPathRenderer;})();\n'

core=(Q/'vendor/three.core.js').read_text();ex=re.search(r'export \{([^}]+)\};',core);core=core[:ex.start()]+'return {'+names(ex.group(1))+'};'+core[ex.end():];core='const __core=(()=>{'+core+'})();\n'
mod=(Q/'vendor/three.module.js').read_text();mod=re.sub(r"import \{([^}]+)\} from '[^']+';",lambda m:'const {'+m.group(1).replace(' as ',':')+'}=__core;',mod);mod=re.sub(r"export \{[^}]+\} from '[^']+';",'',mod);ex=re.search(r'export \{([^}]+)\};',mod);mod=mod[:ex.start()]+'return Object.assign({},__core,{'+names(ex.group(1))+'});'+mod[ex.end():];mod='const THREE=(()=>{'+mod+'})();\n'
orb=(Q/'vendor/OrbitControls.js').read_text();orb=re.sub(r"import \{([^}]+)\} from '[^']+';",lambda m:'const {'+m.group(1).replace(' as ',':')+'}=THREE;',orb);orb=re.sub(r'export \{ OrbitControls \};','return OrbitControls;',orb);orb='const OrbitControls=(()=>{'+orb+'})();\n'
app=(P/'app.js').read_text();app=re.sub(r'^import .*;\n','',app,flags=re.M);assert 'window.CAUCHERA_DATA' in app
html=(P/'index.html').read_text();html=re.sub(r'<link rel="stylesheet" href="style.css[^"]*">',lambda m:'<style>'+(P/'style.css').read_text()+'</style>',html);html=re.sub(r'<script type="importmap">.*?</script>','',html)
for name,f in [('../assets/tdr-cauchera.jpg',Q/'assets/tdr-cauchera.jpg')]:
 html=html.replace('src="'+name+'"','src="data:image/jpeg;base64,'+base64.b64encode(f.read_bytes()).decode()+'"')
Q=P.parent if (P.parent/'shared/obj-export.js').exists() else P.parent/'barco-github'
bundle=core+mod+orb+'window.CAUCHERA_DATA='+ (P/'model.json').read_text()+';\n(()=>{'+app+'})();';bundle=bundle.replace('</script','<\\/script')
Q=P.parent if (P.parent/'shared/obj-export.js').exists() else P.parent/'barco-github'
html=re.sub(r'<script src="../shared/obj-export.js[^"]*"></script>',lambda m:'<script>'+(Q/'shared/obj-export.js').read_text()+'</script>',html)
html=shared_assets(html,Q,'../')
html=re.sub(r'<script src="../shared/cauchera-model.js[^"]*"></script>',lambda m:'<script>'+(Q/'shared/cauchera-model.js').read_text().replace('</script','<\\/script')+'</script>',html)
human=json.loads((P/'assets/personas/human.json').read_text())
for m in human['meshes']:
 f=P/m['texture'];mime='image/png' if f.suffix=='.png' else 'image/jpeg'
 m['texture']='data:'+mime+';base64,'+base64.b64encode(f.read_bytes()).decode()
humanjs='window.QUELEC_HUMAN_ASSET='+json.dumps(human,separators=(',',':'))+';'+(P/'humanos.js').read_text()
html=re.sub(r'<script src="humanos.js[^"]*"></script>',lambda m:'<script>'+humanjs.replace('</script','<\\/script')+'</script>',html)
html+='<!-- Human assets: MakeHuman core CC0 1.0. '+(P/'assets/personas/NOTICE.md').read_text().replace('--','- -')+' -->'
html=re.sub(r'<script src="posturas.js[^"]*"></script>',lambda m:'<script>'+(P/'posturas.js').read_text().replace('</script','<\\/script')+'</script>',html)
html=html.replace('href="referencia-C02.png"','href="https://felipecotero.github.io/barco-de-papel-quelec/cauchera/referencia-C02.png"')
html=re.sub(r'<script type="module" src="app.js[^"]*"></script>',lambda m:'<script>'+bundle+'</script>',html);html='\n'.join(re.sub(r'^([ \t]+)',lambda m:re.sub(r' +\t','\t',m.group(1)),line).rstrip() for line in html.splitlines())+'\n';(P/'Abrir-Cauchera.html').write_text(html)
print('Portable HTML:',(P/'Abrir-Cauchera.html').stat().st_size)
