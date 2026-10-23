from pathlib import Path
import re,json,zipfile,base64
P=Path(__file__).resolve().parents[1]
def names(text):
 return ','.join((lambda a:f'{a[-1]}:{a[0]}')(x.strip().split(' as ')) for x in text.split(',') if x.strip())
core=(P/'vendor/three.core.js').read_text();ex=re.search(r'export \{([^}]+)\};',core);core=core[:ex.start()]+'return {'+names(ex.group(1))+'};'+core[ex.end():];core='const __core=(()=>{'+core+'})();\n'
mod=(P/'vendor/three.module.js').read_text();mod=re.sub(r"import \{([^}]+)\} from '[^']+';",lambda m:'const {'+m.group(1).replace(' as ',':')+'}=__core;',mod);mod=re.sub(r"export \{[^}]+\} from '[^']+';",'',mod);ex=re.search(r'export \{([^}]+)\};',mod);mod=mod[:ex.start()]+'return Object.assign({},__core,{'+names(ex.group(1))+'});'+mod[ex.end():];mod='const THREE=(()=>{'+mod+'})();\n'
orb=(P/'vendor/OrbitControls.js').read_text();orb=re.sub(r"import \{([^}]+)\} from '[^']+';",lambda m:'const {'+m.group(1).replace(' as ',':')+'}=THREE;',orb);orb=re.sub(r'export \{ OrbitControls \};','return OrbitControls;',orb);orb='const OrbitControls=(()=>{'+orb+'})();\n'
app=(P/'app.js').read_text();app=re.sub(r'^import .*;\n','',app,flags=re.M);app=app.replace("data=await fetch(", "data=window.GRULLA_MODEL||await fetch(")
html=(P/'index.html').read_text();html=re.sub(r'<link rel="stylesheet" href="style.css[^"]*">',lambda m:'<style>'+(P/'style.css').read_text()+'</style>',html);html=re.sub(r'<script type="importmap">.*?</script>','',html)
html=html.replace('src="referencia-boceto.png"','src="data:image/png;base64,'+base64.b64encode((P/'referencia-boceto.png').read_bytes()).decode()+'"')
bundle=core+mod+orb+'window.GRULLA_MODEL='+ (P/'model.json').read_text()+';\n(()=>{'+app+'})();';bundle=bundle.replace('</script','<\\/script')
Q=P.parent if (P.parent/'shared/obj-export.js').exists() else P.parent/'barco-github'
html=re.sub(r'<script src="../shared/obj-export.js[^"]*"></script>',lambda m:'<script>'+(Q/'shared/obj-export.js').read_text()+'</script>',html)
html=re.sub(r'<script type="module" src="app.js[^"]*"></script>',lambda m:'<script>'+bundle+'</script>',html);(P/'Abrir-Grulla.html').write_text(html)
print('Portable HTML:',(P/'Abrir-Grulla.html').stat().st_size)
