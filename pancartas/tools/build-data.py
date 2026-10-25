"""Build PA05 by preserving the PA04 vertical design and adding two formats.

The approved PA04 data file is the immutable baseline. PA05 image manifests
select complete, unmodified image files; no raster editing occurs here.
"""
from pathlib import Path
from copy import deepcopy
import hashlib
import json
from PIL import Image

P=Path(__file__).resolve().parents[1]
BASE=P/'downloads/Pancartas-PA04-datos.json'
MANIFESTS={
 'portrait':P/'assets/extras-portrait-PA05.json',
 'landscape':P/'assets/horizontal-PA05.json',
 'square':P/'assets/square-PA05.json',
}
missing=[str(p.relative_to(P))for p in MANIFESTS.values()if not p.exists()]
if missing:
 raise SystemExit('Esperando los manifiestos de imágenes PA05: '+', '.join(missing))
B=json.loads(BASE.read_text())
assert B['revision']=='PA04'
D=deepcopy(B)
D.update(revision='PA05',verticalRevision='PA04',defaultVariant='portrait',availableVariants=['portrait','landscape','square'])
D['approvalPA05']={
 'date':'2026-10-25',
 'scope':'Conservar las cuatro pancartas verticales y añadir versiones horizontal y cuadrada. Ofrecer diez dibujos seleccionables para las ocho caras: ocho predeterminados y dos adicionales intercambiables, pijamas navideñas y gestos de alegría.',
 'physicalSigns':4,'physicalFaces':8,'availableIllustrations':10,
 'dimensionsStatus':'Los formatos y detalles de taller son propuestas dimensionales para comprobar en prototipo y ensayo.',
}
D['defaultDistinctThemes']=8
D['distinctThemes']=10
D['designStatus']='PA05: cuatro pancartas y ocho caras en el formato elegido; diez dibujos seleccionables. Vertical PA04 conservada, más alternativas horizontal y cuadrada. Comprobar el montaje y la legibilidad en ensayo.'
# The picture is unchanged; only the semantic label is separated from EX02.
f=D['signs'][1]['faces'][0]
f.update(title='Ser feliz',theme='Ser feliz',pages=[3],sourcePages=[3],note='La imagen vertical PA04 se conserva. El tema se identifica como ser feliz; gestos de alegría está disponible como dibujo adicional EX02.')
D['signs'][1]['title']='Ser feliz / Ositos de peluche'

IMAGE_KEYS=('image','imageSizePx','cropPx','cropOrigin','sourceImageSha256','strikeColor','strikeDirection','strikeWidthFactor')

def read_manifest(key):
 raw=json.loads(MANIFESTS[key].read_text())
 faces=raw['faces']
 assert len({f['code']for f in faces})==len(faces),'Códigos duplicados en '+key
 return {f['code']:f for f in faces}

def image_fields(base,override,expected_ratio):
 out=deepcopy(base)
 for k in IMAGE_KEYS:
  if k in override:out[k]=deepcopy(override[k])
 path=P/out['image']
 assert path.exists(),path
 size=list(Image.open(path).size)
 assert out.get('imageSizePx',size)==size,(out['code'],'tamaño de imagen')
 out['imageSizePx']=size
 x,y,w,h=out['cropPx']
 assert min(x,y)>=0 and w>0 and h>0 and x+w<=size[0]and y+h<=size[1],out['code']
 assert w*expected_ratio[1]==h*expected_ratio[0],(out['code'],'proporción de ventana')
 digest=hashlib.sha256(path.read_bytes()).hexdigest()
 if 'sourceImageSha256'in override:assert override['sourceImageSha256']==digest,out['code']
 out['sourceImageSha256']=digest
 out.update(cropOrigin='top-left',noText=True)
 return out

def extra(code,title,pages,note,override,ratio):
 base={'id':code,'code':code,'title':title,'theme':title,'pages':pages,'sourcePages':pages,'noText':True,'note':note,'optional':True,'libraryRole':'intercambiable'}
 return image_fields(base,override,ratio)

def library(signs,manifest,ratio):
 default=[]
 for sign in signs:
  for face in sign['faces']:
   f=deepcopy(face);f.update(optional=False,libraryRole='predeterminado');default.append(f)
 additions=[
  extra('EX01','Pijamas navideñas',[4],'Diseño adicional intercambiable, basado en la prohibición de usar pijamas navideñas.',manifest['EX01'],ratio),
  extra('EX02','Gestos de alegría',[4],'Diseño adicional intercambiable, separado del tema ser feliz por decisión del usuario.',manifest['EX02'],ratio),
 ]
 return default+additions

def printing(source,size,ratio):
 out=deepcopy(source)
 out.update(faceSizeMm=list(size),count=10,pageCount=10,physicalFaces=8,optionalDesigns=2,cropAspectRatio=ratio,
  cropNote='Cada ventana selecciona el dibujo de su formato, sin deformarlo ni estirar la versión vertical.',
  catalogNote='El PDF contiene diez diseños. Elegir ocho para las cuatro pancartas de dos caras; EX01 y EX02 son alternativas intercambiables, no dos pancartas adicionales.')
 return out

portrait=read_manifest('portrait')
assert {'EX01','EX02'}<=portrait.keys()
D['artLibrary']=library(D['signs'],portrait,(2,3))
D['printing']=printing(B['printing'],[400,600],'2:3')


def nest(panel,band,square=False):
 items=[]
 for i in range(8):
  board=i//2+1;side='AB'[i%2]
  x=5+(i%2)*(455 if square else 610)
  y=5+(i//2)*(455 if square else 405)
  items.append({'id':f'P{board:02}{side}','kind':'panel','role':'tablero portante'if side=='A'else'tapa posterior','xMm':x,'yMm':y,'widthMm':panel[0],'heightMm':panel[1],'quantity':1,'sheet':1})
 for i in range(4):
  items.append({'id':f'R{i+1:02}','kind':'reinforcement','role':'banda posterior del tablero portante','xMm':5+i*65,'yMm':1830 if square else 1640,'widthMm':band[0],'heightMm':band[1],'quantity':1,'sheet':1})
 net=sum(i['widthMm']*i['heightMm']for i in items)/1e6
 return {'sheetMm':[1220,2440,3],'sheetCount':1,'panelCount':8,'reinforcementCount':4,'netAreaM2':net,'utilizationPercent':net/(1.22*2.44)*100,'minimumMarginMm':5,'minimumSeparationMm':5,'items':items,
  'note':f'Rectángulos de corte, sin solapamientos. Ocho paneles y cuatro bandas. Redondear después las esquinas R6. Los canales siguen el alto de {panel[1]} mm de la pancarta montada, paralelo al lado largo de 2440 mm de la lámina en esta disposición.'}


def variant(key,panel,band,bottom,top,overlap,centers,ratio):
 manifest=read_manifest(key)
 expected={f'P{i:02}{s}'for i in range(1,5)for s in'AB'}|{'EX01','EX02'}
 assert manifest.keys()>=expected,(key,'faltan ilustraciones')
 dims=deepcopy(B['dimensionsMm'])
 dims.update(panel=list(panel),rearPanel=list(panel),reinforcement=list(band),panelBottom=bottom,overallHeight=top,panelCenterHeight=1750,poleOverlap=overlap,holesFromPanelLeft=panel[0]/2,spacerCentersFromPanelMm=centers)
 signs=deepcopy(D['signs'])
 for sign in signs:
  sign['faces']=[image_fields(f,manifest[f['code']],ratio)for f in sign['faces']]
  sign['artwork']=sign['faces'][0]['image']
  sign['approvedImageSha256']=sign['faces'][0]['sourceImageSha256']
 materials=deepcopy(B['materials'])
 materials['faces']=f'8 caras ilustradas elegidas de un catálogo de 10, sobre papel mate de {panel[0]} × {panel[1]} mm, sin palabras'
 orientation_name='horizontales'if key=='landscape'else'cuadrados'
 assembly=deepcopy(B['assembly'])
 assembly[0]=f'Cortar los ocho tableros {orientation_name} y las cuatro bandas de la lámina. Marcar las piezas únicamente por dentro.'
 assembly[1]=f'Presentar el listón centrado con {overlap} mm de solape y la banda de {band[0]} × {band[1]} mm. Marcar los dos centros, a 100 y 220 mm desde abajo.'
 return {'revision':'PA05','orientation':key,'dimensionsMm':dims,'nesting':nest(panel,band,key=='square'),'printing':printing(B['printing'],panel[:2],f'{ratio[0]}:{ratio[1]}'),'materials':materials,'assembly':assembly,'signs':signs,'artLibrary':library(signs,manifest,ratio),'imageManifest':str(MANIFESTS[key].relative_to(P)),'designStatus':f'Alternativa {key} PA05. Cuatro pancartas de dos caras; ocho ilustraciones elegidas de diez. El montaje mantiene la caja interior y el mango oculto de la versión vertical.'}

D['variants']={
 'landscape':variant('landscape',[600,400,3],[60,360,3],1550,1950,250,[[30,40],[570,40],[30,360],[570,360]],(3,2)),
 'square':variant('square',[450,450,3],[60,410,3],1525,1975,275,[[30,40],[420,40],[30,410],[420,410]],(1,1)),
}
# These are the technical fields whose values must remain exactly PA04.
for key in['dimensionsMm','nesting','materials','assembly','construction','fasteners','quantities']:
 assert D[key]==B[key],key
for a,b in zip(D['signs'],B['signs']):
 for x,y in zip(a['faces'],b['faces']):
  for key in IMAGE_KEYS:
   assert x.get(key)==y.get(key),(x['code'],key)
(P/'model.json').write_text(json.dumps(D,ensure_ascii=False,indent=2)+'\n')
(P/'downloads/Pancartas-PA05-datos.json').write_text((P/'model.json').read_text())
print('PA05: vertical PA04 conservada; alternativas horizontal y cuadrada; cuatro pancartas, ocho caras y diez dibujos por formato.')
