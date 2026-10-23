from pathlib import Path
import re,json,zipfile
P=Path(__file__).resolve().parents[1]
def names(text):
 return ','.join((lambda a:f'{a[-1]}:{a[0]}')(x.strip().split(' as ')) for x in text.split(',') if x.strip())
core=(P/'vendor/three.core.js').read_text();ex=re.search(r'export \{([^}]+)\};',core);core=core[:ex.start()]+'return {'+names(ex.group(1))+'};'+core[ex.end():];core='const __core=(()=>{'+core+'})();\n'
mod=(P/'vendor/three.module.js').read_text();mod=re.sub(r"import \{([^}]+)\} from '[^']+';",lambda m:'const {'+m.group(1).replace(' as ',':')+'}=__core;',mod);mod=re.sub(r"export \{[^}]+\} from '[^']+';",'',mod);ex=re.search(r'export \{([^}]+)\};',mod);mod=mod[:ex.start()]+'return Object.assign({},__core,{'+names(ex.group(1))+'});'+mod[ex.end():];mod='const THREE=(()=>{'+mod+'})();\n'
orb=(P/'vendor/OrbitControls.js').read_text();orb=re.sub(r"import \{([^}]+)\} from '[^']+';",lambda m:'const {'+m.group(1).replace(' as ',':')+'}=THREE;',orb);orb=re.sub(r'export \{ OrbitControls \};','return OrbitControls;',orb);orb='const OrbitControls=(()=>{'+orb+'})();\n'
app=(P/'app.js').read_text();app=re.sub(r'^import .*;\n','',app,flags=re.M);app=app.replace("data=await fetch('./model-r05.json')", "data=window.BARCO_MODEL||await fetch('./model-r05.json')")
html=(P/'index.html').read_text();html=html.replace('<link rel="stylesheet" href="style.css">','<style>'+(P/'style.css').read_text()+'</style>');html=re.sub(r'<script type="importmap">.*?</script>','',html)
bundle=core+mod+orb+'window.BARCO_MODEL='+ (P/'model-r05.json').read_text()+';\n(()=>{'+app+'})();';bundle=bundle.replace('</script','<\\/script')
html=html.replace('<script type="module" src="app.js"></script>','<script>'+bundle+'</script>');(P/'Abrir-Barco.html').write_text(html)
print('Portable HTML:',(P/'Abrir-Barco.html').stat().st_size)

if json.loads((P/"model-r05.json").read_text()).get("auxRevision",{}).get("id")=="M02":
 (P/"Barco-Agarres-M02.html").write_text(html)

if json.loads((P/"model-r05.json").read_text()).get("revision")=="R06":
 (P/"Barco-Agarres-R06.html").write_text(html)
