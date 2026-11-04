"""PA07 pliego viewer profile; keeps the published PA05 data and artwork unchanged."""
from pathlib import Path
import json, copy, hashlib

P=Path(__file__).resolve().parents[1]
source=P/'downloads/Pancartas-PA05-datos.json'
old=json.loads(source.read_text())
assert old['revision']=='PA05'
base={k:copy.deepcopy(v) for k,v in old.items() if k!='variants'}
profiles={'portrait':copy.deepcopy(base)}
for key,variant in old['variants'].items():profiles[key]={**copy.deepcopy(base),**copy.deepcopy(variant)}
for profile in profiles.values():
    profile.pop('availableVariants',None)
    profile.pop('defaultVariant',None)
    profile['constructionDocumentFamily']='PA05'
    profile['viewerNewFormat']=False

D=copy.deepcopy(base)
D.update(revision='PA07',date='2026-11-04',orientation='pliego',defaultVariant='pliego',
    availableVariants=['pliego','portrait','landscape','square'],
    artBaseRevision='PA05',printArtRevision='PA06',viewerNewFormat=True,
    sourcePA05SHA256=hashlib.sha256(source.read_bytes()).hexdigest())
d=D['dimensionsMm']
d.update(panel=[700,1000,3],rearPanel=[700,1000,3],reinforcement=[60,960,3],
    overallHeight=2300,panelBottom=1300,panelCenterHeight=1800,poleOverlap=500,
    holesFromPanelLeft=350,spacerCentersFromPanelMm=[[30,40],[670,40],[30,960],[670,960]])
items=[]
codes=[f'P{i:02d}{face}' for i in range(1,5) for face in 'AB']
for i,code in enumerate(codes):
    sheet=i//3+1;row=i%3
    items.append({'id':code,'kind':'panel','role':'tablero portante' if code.endswith('A') else 'tapa posterior',
        'xMm':5,'yMm':5+row*705,'widthMm':1000,'heightMm':700,
        'finishedSizeMm':[700,1000],'rotated90':True,'quantity':1,'sheet':sheet})
for i in range(4):
    items.append({'id':f'R{i+1:02d}','kind':'reinforcement','role':'banda posterior del tablero portante',
        'xMm':1010+(i%3)*65,'yMm':5,'widthMm':60,'heightMm':960,'quantity':1,'sheet':1 if i<3 else 2})
net=sum(q['widthMm']*q['heightMm'] for q in items)/1e6
D['nesting']={
    'sheetMm':[1220,2440,3],'sheetCount':3,'panelCount':8,'reinforcementCount':4,
    'netAreaM2':net,'utilizationPercent':net/(3*1.22*2.44)*100,
    'minimumMarginMm':5,'minimumSeparationMm':5,'items':items,
    'panelDistribution':[3,3,2],
    'note':'Distribución geométrica de referencia: ocho paneles girados de 1000 x 700 mm y cuatro bandas de 60 x 960 mm en tres láminas. Los canales quedan paralelos al ancho de 700 mm al montar el panel; revisar rigidez y orientación antes de fabricar. No sustituye un plano constructivo validado.',
    'minimumSheetsReason':'En 1220 mm no caben dos paneles en paralelo: el ancho mínimo de cada uno es 700 mm. La altura mínima de cada panel girado es 700 mm, de modo que cuatro no caben en 2440 mm. Tres láminas son el mínimo para los ocho paneles enteros de este estudio.'}
D['printing']={**D['printing'],'faceSizeMm':[700,1000],'pageCount':10,'count':10,
    'cropAspectRatio':'2:3 contenido en página 7:10','artFit':'contain',
    'artRectangleMm':[16.6666666667,0,666.6666666667,1000],
    'whiteSideMarginMm':16.6666666667,
    'cropNote':'La ventana PA05 completa se centra sin deformación en 700 x 1000 mm; franjas blancas laterales de 16,667 mm. Misma composición que los artes PA06.',
    'resolutionNote':'Originales efectivos de 26,21 a 26,52 ppp al imprimir 70 x 100 cm. No son archivos nativos de 300 ppp; revisar muestra a distancia real.'}
D['quantities']['sheetCount']=3
D['quantitiesStatus']='Cantidades geométricas del formato de pliego; herrajes PA05 mostrados como referencia, pendientes de redimensionamiento del formato mayor.'
D['materials']['sheet']='3 láminas de Cartón Plast de 1220 x 2440 x 3 mm, distribución geométrica 3 + 3 + 2 paneles; orientación de canales por revisar'
D['materials']['faces']='8 artes elegidos de 10 diseños, papel mate de 700 x 1000 mm, sin texto visible'
D['construction']['validation']='PA07 es referencia de volumen: tablero 700 x 1000, mango de 1800 y solape de 500 mm. Revisar mango, refuerzos, uniones, rigidez del PP, viento y manipulación antes de fabricar. Los M4 y tacos dibujados se heredan de PA05 y no están dimensionados para el formato mayor.'
D['assembly']=[
    'Estudio geométrico: presentar ocho paneles de 700 x 1000 mm y cuatro bandas de 60 x 960 mm en tres láminas, con los paneles girados. Revisar la orientación del canal.',
    'Referencia visual: mango de 25 x 15 x 1800 mm, solape de 500 mm y altura total de 2300 mm. El diseño del mango y sus fijaciones para el formato mayor queda pendiente.',
    'El visor conserva por comparación la cámara de 30 mm, los cuatro tacos y dos M4 del montaje PA05. No fabricar el formato de pliego a partir de esos herrajes sin revisión.',
    'Usar los artes PA06 completos de 700 x 1000 mm; se conserva la proporción de los dibujos y las franjas blancas laterales. Elegir ocho imágenes entre diez.']
D['designStatus']='PA07: pliego vertical 700 x 1000 mm por defecto; cuatro pancartas de dos caras y diez dibujos intercambiables. Tres formatos PA05 conservados. Propuesta geométrica de montaje mayor, pendiente de revisión de mango, refuerzos, fijaciones y manejo con viento.'
D['constructionDocumentFamily']='PA07-referencia-geometrica-sin-planos-de-fabricacion'
D['costEstimateRevision']='PC02-corresponde-a-PA05-no-a-pliego-PA07'
D['approvalPA07']={'date':'2026-11-04','scope':'Usuario solicita que el modelo 3D use las imágenes en tamaño de pliego. Se conserva el catálogo y se añaden proporciones físicas de 700 x 1000 mm.','constructionApproved':False}
D['variants']=profiles
for p in [P/'model.json',P/'downloads/Pancartas-PA07-datos.json']:
    p.write_text(json.dumps(D,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'revision':'PA07','default':'pliego','panelsMm':d['panel'],'overallHeightMm':d['overallHeight'],'sheetCount':3,'netAreaM2':net,'alternatives':list(profiles),'unchangedPA05SHA256':D['sourcePA05SHA256']},ensure_ascii=False,indent=2))
