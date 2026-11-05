from pathlib import Path
import re,json,base64,subprocess,argparse,tempfile,shutil
parser=argparse.ArgumentParser();parser.add_argument('--qa-directory');parser.add_argument('--node');args=parser.parse_args()
P=Path(__file__).resolve().parents[1];Q=P.parent;D=Path(args.qa_directory)if args.qa_directory else Path(tempfile.gettempdir())/'quelec-flor-F03-qa';D.mkdir(parents=True,exist_ok=True)
def data(path,mime):return 'data:'+mime+';base64,'+base64.b64encode(path.read_bytes()).decode()
def names(text):return ','.join((lambda a:f'{a[-1]}:{a[0]}')(x.strip().split(' as '))for x in text.split(',')if x.strip())
core=(Q/'vendor/three.core.js').read_text();ex=re.search(r'export \{([^}]+)\};',core);core=core[:ex.start()]+'return {'+names(ex.group(1))+'};'+core[ex.end():];core='const __core=(()=>{'+core+'})();\n'
mod=(Q/'vendor/three.module.js').read_text();mod=re.sub(r"import \{([^}]+)\} from '[^']+';",lambda m:'const {'+m.group(1).replace(' as ',':')+'}=__core;',mod);mod=re.sub(r"export \{[^}]+\} from '[^']+';",'',mod);ex=re.search(r'export \{([^}]+)\};',mod);mod=mod[:ex.start()]+'return Object.assign({},__core,{'+names(ex.group(1))+'});'+mod[ex.end():];mod='const THREE=(()=>{'+mod+'})();\n'
orb=(Q/'vendor/OrbitControls.js').read_text();orb=re.sub(r"import \{([^}]+)\} from '[^']+';",lambda m:'const {'+m.group(1).replace(' as ',':')+'}=THREE;',orb);orb=re.sub(r'export \{ OrbitControls \};','return OrbitControls;',orb);orb='const OrbitControls=(()=>{'+orb+'})();\n'
stage=(P/'stage-trap.js').read_text();stage=re.sub(r'^import .*;\n','',stage,flags=re.M).replace('export function createStageTrap','function createStageTrap');stage='const createStageTrap=(()=>{'+stage+';return createStageTrap;})();\n'
scene=(P/'scene.js').read_text();scene=re.sub(r'^import .*;\n','',scene,flags=re.M).replace('export function createFlowerStudy','function createFlowerStudy');scene='const createFlowerStudy=(()=>{'+scene+';return createFlowerStudy;})();\n'
sim=(P/'simulation.js').read_text();sim=re.sub(r'\bexport (const|function) ',r'\1 ',sim);sim='const {DEFAULT_CONFIG,evaluateClearance,evaluateWind,evaluateStageLayout,evaluateHeightComparison,ensureLiftInterlock}=(()=>{'+sim+';return{DEFAULT_CONFIG,evaluateClearance,evaluateWind,evaluateStageLayout,evaluateHeightComparison,ensureLiftInterlock};})();\n'
app=(P/'app.js').read_text();app=re.sub(r'^import .*;\n','',app,flags=re.M)
textures={key:data(P/'assets'/f'{key}.jpg','image/jpeg')for key in['cream','copper','magenta']}
app=app.replace("loader.loadAsync('assets/'+key+'.jpg')","loader.loadAsync(__FLOR_TEXTURES[key])")
app=app.replace("await fetch('sources.json').then(r=>r.json())",'__FLOR_SOURCES')
bundle=core+mod+orb+stage+scene+sim+'const __FLOR_TEXTURES='+json.dumps(textures)+';const __FLOR_SOURCES='+(P/'sources.json').read_text()+';\n(()=>{'+app+'})();'
html=(P/'index.html').read_text();html=re.sub(r'<script type="importmap">.*?</script>','',html)
html=re.sub(r'<link rel="stylesheet" href="style.css[^"]*">',lambda m:'<style>'+(P/'style.css').read_text()+'</style>',html)
brand=(Q/'shared/brand.css').read_text()
for f in(Q/'assets/fonts').glob('*.woff2'):brand=brand.replace('../assets/fonts/'+f.name,data(f,'font/woff2'))
html=re.sub(r'<link rel="stylesheet" href="../shared/brand.css[^"]*">',lambda m:'<style>'+brand+'</style>',html)
html=html.replace('src="assets/referencia-tallo-ui.jpg"','src="'+data(P/'assets/referencia-tallo-ui.jpg','image/jpeg')+'"')
html=html.replace('href="favicon.svg?v=F03"','href="'+data(P/'favicon.svg','image/svg+xml')+'"')
for filename in['model.json','sources.json','mecanismo.json']:html=html.replace('href="'+filename+'" download','href="'+data(P/filename,'application/json')+'" download="Flor-F03-'+filename+'"')
html=re.sub(r'<script src="../shared/obj-export.js[^"]*"></script>',lambda m:'<script>'+(Q/'shared/obj-export.js').read_text().replace('</script','<\\/script')+'</script>',html)
html=re.sub(r'<script src="../shared/studio-render.js[^"]*"></script>',lambda m:'<script>'+(Q/'shared/studio-render.js').read_text().replace('</script','<\\/script')+'</script>',html)
html=re.sub(r'<script type="module" src="app.js[^"]*"></script>',lambda m:'<script>'+bundle.replace('</script','<\\/script')+'</script>',html)
html+='\n<!-- Three.js license: '+(Q/'vendor/LICENSE-three.txt').read_text().replace('--','- -')+' -->\n<!-- Montserrat SIL OFL: '+(Q/'assets/fonts/OFL-Montserrat.txt').read_text().replace('--','- -')+' -->\n'
html=html.replace('href="../index.html?rev=I20"','href="https://felipecotero.github.io/barco-de-papel-quelec/?rev=I20"')
out=P/'Abrir-Flor-Central-F03.html';out.write_text(html)
scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,flags=re.S)
node=args.node or shutil.which('node');assert node,'Node is required to verify the portable scripts'
checks=[]
for i,s in enumerate(scripts):
 f=D/f'portable-script-{i}.js';f.write_text(s);r=subprocess.run([node,'--check',str(f)],capture_output=True,text=True);checks.append({'script':i,'pass':r.returncode==0,'error':r.stderr[:500]})
report={'bytes':out.stat().st_size,'scripts':len(scripts),'checks':checks,'externalScriptTags':bool(re.search(r'<script[^>]+src=',html)),'allPass':all(c['pass']for c in checks)}
(D/'portable-source-qa.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report));assert report['allPass']and not report['externalScriptTags']
