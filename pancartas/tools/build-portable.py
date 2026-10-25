from pathlib import Path
import re,json,base64
P=Path(__file__).resolve().parents[1];Q=P.parent

def names(t):return ','.join((lambda a:a[-1]+':'+a[0])(x.strip().split(' as '))for x in t.split(',')if x.strip())
core=(Q/'vendor/three.core.js').read_text();ex=re.search(r'export \{([^}]+)\};',core);core=core[:ex.start()]+'return {'+names(ex.group(1))+'};'+core[ex.end():];core='const __core=(()=>{'+core+'})();\n'
mod=(Q/'vendor/three.module.js').read_text();mod=re.sub(r"import \{([^}]+)\} from '[^']+';",lambda m:'const {'+m.group(1).replace(' as ',':')+'}=__core;',mod);mod=re.sub(r"export \{[^}]+\} from '[^']+';",'',mod);ex=re.search(r'export \{([^}]+)\};',mod);mod=mod[:ex.start()]+'return Object.assign({},__core,{'+names(ex.group(1))+'});'+mod[ex.end():];mod='const THREE=(()=>{'+mod+'})();\n'
orb=(Q/'vendor/OrbitControls.js').read_text();orb=re.sub(r"import \{([^}]+)\} from '[^']+';",lambda m:'const {'+m.group(1).replace(' as ',':')+'}=THREE;',orb);orb=re.sub(r'export \{ OrbitControls \};','return OrbitControls;',orb);orb='const OrbitControls=(()=>{'+orb+'})();\n'
app=(P/'app.js').read_text();app=re.sub(r'^import .*;\n','',app,flags=re.M)
html=(P/'index.html').read_text();html=re.sub(r'<script type="importmap">.*?</script>','',html)
css=(Q/'shared/brand.css').read_text()
for f in(Q/'assets/fonts').glob('*.woff2'):css=css.replace('../assets/fonts/'+f.name,'data:font/woff2;base64,'+base64.b64encode(f.read_bytes()).decode())
for pattern,contents in[(r'<link rel="stylesheet" href="style.css[^"]*">',(P/'style.css').read_text()),(r'<link rel="stylesheet" href="../shared/brand.css[^"]*">',css)]:html=re.sub(pattern,lambda m:'<style>'+contents+'</style>',html)
for f in['obj-export.js','dimensions.js','studio-render.js']:html=re.sub(r'<script src="../shared/'+re.escape(f)+r'[^"]*"></script>',lambda m:'<script>'+(Q/'shared'/f).read_text().replace('</script','<\\/script')+'</script>',html)
logo='data:image/svg+xml;base64,'+base64.b64encode((Q/'assets/logo-pancartas.svg').read_bytes()).decode();html=html.replace('../assets/logo-pancartas.svg',logo)
paths=sorted({f['image']for s in json.loads((P/'model.json').read_text())['signs']for f in s['faces']})
art={path:'data:image/png;base64,'+base64.b64encode((P/path).read_bytes()).decode()for path in paths}
bundle=core+mod+orb+'window.PANCARTAS_DATA='+(P/'model.json').read_text()+';window.PANCARTAS_ART='+json.dumps(art)+';\n(()=>{'+app+'})();'
html=re.sub(r'<script type="module" src="app.js[^"]*"></script>',lambda m:'<script>'+bundle.replace('</script','<\\/script')+'</script>',html)
site='https://felipecotero.github.io/barco-de-papel-quelec/';html=html.replace('href="../index.html?rev=I07"','href="'+site+'?rev=I07"').replace('href="./"','href="'+site+'pancartas/?rev=PA03"').replace('href="downloads/','href="'+site+'pancartas/downloads/').replace('href="Abrir-Pancartas.html?rev=PA03"','href="'+site+'pancartas/Abrir-Pancartas.html?rev=PA03"')
html+='<!-- Montserrat: SIL OFL 1.1. '+(Q/'assets/fonts/OFL-Montserrat.txt').read_text().replace('--','- -')+' -->';(P/'Abrir-Pancartas.html').write_text(html);print('Visor sin conexión:',len(html.encode()),'bytes')
