"""Bundle CP03 with local Three, anatomical assets and its documented study data."""
from pathlib import Path
import re,json,base64,mimetypes
P=Path(__file__).resolve().parents[1];Q=P.parent

def names(t):return ','.join((lambda a:a[-1]+':'+a[0])(x.strip().split(' as '))for x in t.split(',')if x.strip())
def data_uri(p):return 'data:'+(mimetypes.guess_type(p.name)[0]or'application/octet-stream')+';base64,'+base64.b64encode(p.read_bytes()).decode()
core=(Q/'vendor/three.core.js').read_text();ex=re.search(r'export \{([^}]+)\};',core);core=core[:ex.start()]+'return {'+names(ex.group(1))+'};'+core[ex.end():];core='const __core=(()=>{'+core+'})();\n'
mod=(Q/'vendor/three.module.js').read_text();mod=re.sub(r"import \{([^}]+)\} from '[^']+';",lambda m:'const {'+m.group(1).replace(' as ',':')+'}=__core;',mod);mod=re.sub(r"export \{[^}]+\} from '[^']+';",'',mod);ex=re.search(r'export \{([^}]+)\};',mod);mod=mod[:ex.start()]+'return Object.assign({},__core,{'+names(ex.group(1))+'});'+mod[ex.end():];mod='const THREE=(()=>{'+mod+'})();\n'
orb=(Q/'vendor/OrbitControls.js').read_text();orb=re.sub(r"import \{([^}]+)\} from '[^']+';",lambda m:'const {'+m.group(1).replace(' as ',':')+'}=THREE;',orb);orb=re.sub(r'export \{ OrbitControls \};','return OrbitControls;',orb);orb='const OrbitControls=(()=>{'+orb+'})();\n'
wind=(P/'wind.js').read_text();wind=re.sub(r'\bexport\s+','',wind);wind='const ColasWind=(()=>{'+wind+';return {evaluateWind,estimateRibBending,MATERIALS,DEFAULT_WIND,calibrateCd};})();\n'
geo=(P/'scene.js').read_text();geo=re.sub(r'^import .*;\n','',geo,flags=re.M);geo=re.sub(r'\bexport\s+','',geo);geo='const ColasScene=(()=>{'+geo+';return {createTailScene};})();\n'
app=(P/'app.js').read_text();app=re.sub(r'^import .*;\n','',app,flags=re.M);app='(()=>{const {evaluateWind,estimateRibBending,MATERIALS}=ColasWind;const {createTailScene}=ColasScene;'+app+'})();'
html=(P/'index.html').read_text();html=re.sub(r'<script type="importmap">.*?</script>','',html)
css=(Q/'shared/brand.css').read_text()
for f in(Q/'assets/fonts').glob('*.woff2'):css=css.replace('../assets/fonts/'+f.name,data_uri(f))
for pattern,contents in[(r'<link rel="stylesheet" href="style.css[^"]*">',(P/'style.css').read_text()),(r'<link rel="stylesheet" href="../shared/brand.css[^"]*">',css)]:html=re.sub(pattern,lambda m:'<style>'+contents+'</style>',html)
for f in['obj-export.js','dimensions.js','studio-render.js']:html=re.sub(r'<script src="../shared/'+re.escape(f)+r'[^"]*"></script>',lambda m:'<script>'+(Q/'shared'/f).read_text().replace('</script','<\\/script')+'</script>',html)
html=re.sub(r'<script src="../cauchera/humanos.js[^"]*"></script>',lambda m:'<script>'+(Q/'cauchera/humanos.js').read_text().replace('</script','<\\/script')+'</script>',html)
logo=data_uri(Q/'assets/logo-colas.svg');html=html.replace('../assets/logo-colas.svg',logo)
human=json.loads((Q/'cauchera/assets/personas/human.json').read_text());ht={m['texture']:data_uri(Q/'cauchera'/m['texture'])for m in human['meshes']}
pre='window.COLAS_DATA='+(P/'model.json').read_text()+';window.COLAS_SOURCES='+(P/'sources.json').read_text()+';window.COLAS_ART='+json.dumps({f:data_uri(P/f'assets/orquidea-{f}-CP01.png')for f in['lila','calida']})+';window.COLAS_HUMAN='+json.dumps(human)+';window.COLAS_HUMAN_TEXTURES='+json.dumps(ht)+';\n'
bundle=core+mod+orb+pre+wind+geo+app
html=re.sub(r'<script type="module" src="app.js[^"]*"></script>',lambda m:'<script>'+bundle.replace('</script','<\\/script')+'</script>',html)
site='https://felipecotero.github.io/barco-de-papel-quelec/';html=html.replace('href="../index.html?rev=I10"','href="'+site+'?rev=I10"').replace('href="./"','href="'+site+'colas-de-pavo/?rev=CP03"').replace('href="downloads/','href="'+site+'colas-de-pavo/downloads/').replace('href="model.json"','href="'+site+'colas-de-pavo/model.json"').replace('href="sources.json"','href="'+site+'colas-de-pavo/sources.json"').replace('href="Abrir-Colas.html?rev=CP03"','href="'+site+'colas-de-pavo/Abrir-Colas.html?rev=CP03"')
html+='<!-- Montserrat SIL OFL1.1; anatomical source MakeHuman CC0; Three MIT. '+(Q/'assets/fonts/OFL-Montserrat.txt').read_text().replace('--','- -')+' -->'
(P/'Abrir-Colas.html').write_text(html);print('CP03 sin conexión:',len(html.encode()),'bytes')
