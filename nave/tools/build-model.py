"""N01: geometric study, EPS staves and independent longitudinal half frames.
Coordinates in mm, X noseward, Y up, Z starboard. No actor-supporting floor.
"""
from pathlib import Path
import sys,json,math,csv,io,zipfile
sys.path.insert(0,'/private/tmp/grulla-libs')
import numpy as np
from shapely.geometry import Polygon,box
from shapely.ops import triangulate
P=Path(__file__).resolve().parents[1];D=P/'downloads';D.mkdir(exist_ok=True)
T=35.;TM=math.radians(120);WC=[-760,760];WX=650;WT=.48;WTH=1.12
windows=[Polygon([(c+WX*math.cos(t),WTH+WT*math.sin(t))for t in np.linspace(0,2*math.pi,97)[:-1]])for c in WC]
def radius(x):
 if x<=-1550:return .92+.08*(x+1720)/170
 if x<=1250:return 1.
 return .07+.93*math.cos((x-1250)/750*math.pi/2)
def pt(x,t,sg):
 r=radius(x);return np.array([x,400*(1-r)+800*r*(math.cos(t)+.5)/1.5,sg*500*r*math.sin(t)])
def norm(x,t,sg):
 dx=pt(min(2000,x+.1),t,sg)-pt(max(-1720,x-.1),t,sg)
 dt=pt(x,min(TM,t+.0001),sg)-pt(x,max(0,t-.0001),sg)
 n=np.cross(dt,dx)*sg;return n/np.linalg.norm(n)
def pieces(g):
 return[g]if g.geom_type=='Polygon'else list(g.geoms)if hasattr(g,'geoms')else[]
def surface(x0,x1,t0,t1,sg):
 domain=box(x0,t0,x1,t1)
 for w in windows:domain=domain.difference(w)
 pos=[];tris=[];uv=[];lookup={};area=0
 def node(q):
  key=tuple(round(float(v),7)for v in q)
  if key not in lookup:lookup[key]=len(pos);pos.append(pt(*q,sg));uv.append([q[0]/1000,q[1]/2])
  return lookup[key]
 xs=np.linspace(x0,x1,max(2,math.ceil((x1-x0)/65)+1));ts=np.linspace(t0,t1,max(2,math.ceil((t1-t0)/.075)+1))
 for a,b in zip(xs,xs[1:]):
  for c,d in zip(ts,ts[1:]):
   cell=domain.intersection(box(a,c,b,d))
   for poly in pieces(cell):
    if poly.area<1e-8:continue
    for tri in triangulate(poly):
     if not poly.covers(tri):continue
     pts=list(tri.exterior.coords)[:3];ids=[node(q)for q in pts];A,B,C=[pos[i]for i in ids];n=norm(sum(q[0]for q in pts)/3,sum(q[1]for q in pts)/3,sg)
     if np.dot(np.cross(B-A,C-A),n)<0:ids[1],ids[2]=ids[2],ids[1]
     tris.append(ids);area+=np.linalg.norm(np.cross(B-A,C-A))/2
 if not pos:return None
 N=len(pos);edges={}
 for tri in tris:
  for a,b in zip(tri,tri[1:]+tri[:1]):
   k=tuple(sorted((a,b)));edges[k]=None if k in edges else(a,b)
 inner=[q-norm(*list(lookup.keys())[i],sg)*min(T,100*radius(q[0]))for i,q in enumerate(pos)]
 # lookup insertion order follows vertex order.
 out=pos+inner;faces=tris+[[a+N,c+N,b+N]for a,b,c in tris]
 for edge in edges.values():
  if edge:
   a,b=edge;faces.extend([[b,a,a+N],[b,a+N,b+N]])
 normalList=[norm(*q,sg).tolist() for q in lookup.keys()];normalList+=(-np.array(normalList)).tolist()
 return {'outerVertexCount':N,'outerTriangleCount':len(tris),'normals':np.array(normalList).flatten().tolist(),'positions':np.round(np.array(out),5).flatten().tolist(),'indices':np.array(faces).flatten().tolist(),'uv':np.array(uv+uv).flatten().tolist(),'areaM2':area/1e6}
def blank(x0,x1,t0,t1,sg):
 mid=((x0+x1)/2,(t0+t1)/2);origin=pt(*mid,sg);n=norm(*mid,sg);u=np.array([1.,0,0]);u-=n*np.dot(u,n);u/=np.linalg.norm(u);v=np.cross(n,u)
 pts=[]
 for x in np.linspace(x0,x1,9):
  for t in np.linspace(t0,t1,9):
   p=pt(x,t,sg);pts.extend([p,p-norm(x,t,sg)*min(T,100*radius(x))])
 a=np.array(pts)-origin;proj=np.c_[a@u,a@v,a@n];lo=proj.min(0);hi=proj.max(0);center=origin+np.column_stack((u,v,n))@((lo+hi)/2)
 return {'sizeMm':[round(hi[0]-lo[0]+4,2),round(hi[1]-lo[1]+4,2),50],'depthNeededMm':float(hi[2]-lo[2]),'centerMm':center.tolist(),'basis':[u.tolist(),v.tolist(),n.tolist()]}
# Each rectangular blank is small enough to fit in a commercial 50mm slab.
xs=[-1720,-900,0,900,1250,1450,1650,1800,1900];bands=np.linspace(0,TM,7);segments=[]
def split(a,b):
 depth=max(blank(a,b,c,d,1)['depthNeededMm']for c,d in zip(bands,bands[1:]))
 if depth>49 and b-a>25:split(a,(a+b)/2);split((a+b)/2,b)
 else:segments.append([a,b])
for a,b in zip(xs,xs[1:]):split(a,b)
parts=[];blanks=[]
for side,sg in [('A',-1),('B',1)]:
 for j,(a,b)in enumerate(segments,1):
  for k,(c,d)in enumerate(zip(bands,bands[1:]),1):
   mesh=surface(a,b,c,d,sg)
   if not mesh:continue
   code=f'{side}-{j:02}-{k}';bl=blank(a,b,c,d,sg);assert bl['depthNeededMm']<=50.01,(code,bl['depthNeededMm'])
   p={'id':code,'name':f'Duela {side}, tramo {j}, banda {k}','side':side,'sign':sg,'category':'skin','xRangeMm':[a,b],'thetaDeg':[math.degrees(c),math.degrees(d)],'blank':bl,**mesh};parts.append(p);blanks.append(p)
extras=[]
for side in ['A','B']:
 extras.append({'id':side+'-F01','name':'Aleta, blanco para esculpir','side':side,'category':'finBlank','blank':{'sizeMm':[864,474,50]}})
 for i in range(1,9):extras.append({'id':f'{side}-P{i:02}','name':'Duela de propulsor','side':side,'category':'thrusterBlank','blank':{'sizeMm':[284,150,50]}})
 for i in range(1,4):extras.append({'id':f'{side}-N{i:02}','name':'Capa de nariz roma','side':side,'category':'noseBlank','blank':{'sizeMm':[140,280,50]}})
allblanks=blanks+extras
# First-fit free-rectangle packing, 5mm tool gap, 10mm slab edge margin.
sheets=[]
for p in sorted(allblanks,key=lambda p:math.prod(p['blank']['sizeMm'][:2]),reverse=True):
 dims=p['blank']['sizeMm'];best=None
 for si,sheet in enumerate(sheets):
  for ri,(x,y,w,h)in enumerate(sheet):
   for rot in [False,True]:
    W,H=(dims[1],dims[0])if rot else dims[:2]
    if W<=w+1e-6 and H<=h+1e-6:
     score=w*h-W*H
     if best is None or score<best[0]:best=(score,si,ri,x,y,w,h,W,H,rot)
 if best is None:
  sheets.append([(10,10,980,980)]);si=len(sheets)-1;w=h=980;x=y=10;W,H=dims[:2];assert W<=980 and H<=980,(p['id'],dims);best=(0,si,0,x,y,w,h,W,H,False)
 _,si,ri,x,y,w,h,W,H,rot=best;sheets[si].pop(ri)
 if w-W-5>1:sheets[si].append((x+W+5,y,w-W-5,H))
 if h-H-5>1:sheets[si].append((x,y+H+5,w,h-H-5))
 p['stock']={'sheet':si+1,'xyMm':[x,y],'rotationDeg':90 if rot else 0,'sizeMm':[W,H]}
# Independent members: no bar or rib crosses between A and B.
members=[]
def member(code,side,a,b,kind,section):
 members.append({'id':code,'side':side,'aMm':a,'bMm':b,'kind':kind,'sectionMm':section,'lengthMm':math.dist(a,b)})
for side,sg in [('A',-1),('B',1)]:
 for i,(y,z)in enumerate([(70,400),(220,450),(744,55)],1):member(f'{side}-L{i}',side,[-1550,y,sg*z],[1300,y,sg*z],'square',[20,20,1.5])
 for j,x in enumerate([-1550,0,1300],1):
  points=[(pt(x,t,sg)-norm(x,t,sg)*47).tolist()for t in np.linspace(0,TM,25)]
  members.append({'id':f'{side}-C{j}','side':side,'kind':'halfHoop','sectionMm':[25,3],'pointsMm':points,'lengthMm':sum(math.dist(a,b)for a,b in zip(points,points[1:]))})
 for j,x in enumerate([-760,760],1):
  member(f'{side}-AP{j}',side,[x,120,sg*440],[x,120,sg*690],'grip',[32,1.5])
  member(f'{side}-AC{j}',side,[x+220,320,sg*450],[x+220,320,sg*640],'grip',[32,1.5])
  member(f'{side}-DG{j}',side,[x,85,sg*400],[x+220,290,sg*450],'square',[20,20,1.5])
# Window shape points form a real open aperture, with red/blue EVA rims.
wins=[]
for side,sg in [('A',-1),('B',1)]:
 for i,c in enumerate(WC,1):wins.append({'id':f'{side}-V{i}','side':side,'sign':sg,'centerXmm':c,'widthMm':1300,'thetaCenter':WTH,'thetaRadius':WT,'pointsMm':[pt(c+WX*math.cos(t),WTH+WT*math.sin(t),sg).tolist()for t in np.linspace(0,2*math.pi,81)]})
area=sum(p['areaM2']for p in parts);sqL=sum(m['lengthMm']/1000 for m in members if m['kind']=='square');hoopL=sum(m['lengthMm']/1000 for m in members if m['kind']=='halfHoop');gripL=sum(m['lengthMm']/1000 for m in members if m['kind']=='grip')
# Quantities are allowances for a prototype; this is not a load rating.
lines=[('EPS esculpido, 35mm nominal',area*.035*20),('Bastidores Al20x20x1,5',sqL*.2997),('Mediacostillas Al25x3',hoopL*.2025),('Agarres tuboAl32x1,5',gripL*.3881),('Aletas, propulsor y nariz EPS con cubiertaEVA',.90),('Peines PEHD6, topes y cinchas',.65),('Consolas, placas, tornillos, casquillos y cola',2.00),('Tela y recubrimiento seco, limite de compra',area*.30),('Pintura, aros EVA y acolchados',1.05)]
base=sum(m for _,m in lines);model={'revision':'N01','date':'2026-10-24','documentsReady':(D/'Blueprints-N01.pdf').exists() and (D/'Guia-visual-N01.pdf').exists(),'title':'Nave de Quelec','status':'Propuesta de prototipo; no liberar fabricación definitiva antes de prueba de paso, controles y apertura con reparto real.','axes':['largo X hacia nariz','alto Y desde borde inferior de fuselaje','ancho Z'],'sizeMm':[4000,800,1000],'overallFinTopMm':1230,'stageLiftMm':1000,'thicknessMm':35,'slabThicknessMm':50,'foamDensityKgM3':20,'parts':parts,'blanks':[{'id':p['id'],'name':p['name'],'side':p['side'],'category':p['category'],'blank':p['blank'],'stock':p['stock']}for p in allblanks],'accessories':{'fin':{'profileXyMm':[[-1650,760],[-1690,930],[-1910,1190],[-1900,1230],[-1550,1190],[-1260,1060],[-1050,790]],'halfThicknessMm':30},'thruster':{'xMm':[-2000,-1720],'centerYmm':400,'outerRadiusMm':[310,340],'wallMm':30},'nose':{'xMm':[1900,2000],'rearRadiusMm':132,'roundRadiusMm':35,'EPSCoreBlankMm':[140,280,50],'EVACoverMm':10}},'windows':wins,'members':members,'segmentsMm':segments,'bandsDeg':list(map(float,np.degrees(bands))),'stock':{'sheetMm':[1000,1000,50],'sheets':len(sheets),'blankCount':len(allblanks),'marginMm':10,'gapMm':5,'stockAreaM2':sum(math.prod(p['blank']['sizeMm'][:2])for p in allblanks)/1e6,'finishedAreaM2':area,'method':'Duelas de plancha50; biselar, unir sobre plantilla, esculpir y recortar ventanas una vez fijadas. No cortar el PDF en escala de presentación.','proposal':'Formato1x1m publicado en comercio; confirmar disponibilidad/densidad con proveedor. Bloque2x4m no confirmado.'},'actors':{'count':4,'heightMm':1700,'stationsMm':[-1250,-400,400,1250],'bodyDepthMm':260,'shoulderMm':440,'standingOn':'piso del escenario, nunca sobre la nave','notes':'Estaciones orientativas, no prueba de ergonomía. Vestuario, manos y recorrido de cauchera deben comprobarse en maqueta a escala real.'},'cauchera':{'lengthMm':2000,'forkWidthMm':800,'orientation':'horizontal, eje X','centerYmm':400,'referenceOnly':True,'notes':'Se dibuja gálibo orientativo, no diseño de la cauchera. Mover y ensayar la pieza real; la holgura lateral es reducida.'},'sectionStationsMm':sorted(set(x for pair in segments for x in pair)),'grips':{'carrierCount':4,'stationsXmm':[-760,760],'main':{'heightMm':120,'outerEndZmm':690,'paddedLengthMm':120,'tubeMm':[32,1.5]},'control':{'offsetXmm':220,'heightMm':320,'outerEndZmm':640,'paddedLengthMm':100},'mount':'Consolas: placa frontalAl80x120x3, base80x80x3 y cartelasAl3. DosM6x35verticalesporbase (largueroY70principal/Y220control). PlacasAl80x120x3, M6x35, arandelasØ18 y tuercasautoblocantes; casquillosØ8/6,5x17 en tubo20. Replantear y validar herraje real. EVA10 y tapones redondos. Ninguna barra cruza a la otra mitad.'},'seam':{'plane':'Z=0, longitudinal','guides':[{'id':'G1','xMm':-1150,'type':'maestro','toothOffsetsMm':{'A':[-56,-28,0,28],'B':[-42,-14,14,42]},'freeXmm':2},{'id':'G2','xMm':0,'type':'aliviadoX4mm','toothOffsetsMm':{'A':[-14,14],'B':[0]},'freeXmm':4},{'id':'G3','xMm':1150,'type':'guia suaveX6mm','toothOffsetsMm':{'A':[-16,16],'B':[0]},'freeXmm':6}],'comb':{'material':'PEHD','thicknessMm':6,'bodyMm':[150,30],'toothWidthMm':10,'toothLengthMm':70,'tipRadiusMm':5,'pitchSameSideMm':28,'interleavedGapMm':4,'withdrawalMm':60,'mountYmm':825,'fixings':'Peine a alaAl3:2M4x20+arandelasØ12+tuercaautoblocante. SoporteAl al tubo20:2M4x35+casquilloØ6/4,5x17precolocado. TaladrosØ4,5; alivioX por separación de dientes. NO pegar PEHD al EPS.','protection':'Dos cubiertas blandas superpuestas, una por mitad, sobre dientes y raíces. No dejar un fuelle que mantenga las mitades unidas. Topes solo entre bastidores.'},'closures':{'count':2,'xMm':[-760,760],'webbingWidthMm':50,'strapLengthMm':250,'hookLoopOverlapMm':[50,100],'releaseTailMm':450,'notes':'Velcro cosido sobre cinta; no adhesivo sobre EPS. Pelado dirigido desde fuera por tiradores guardados junto al agarre de control. Coordinación única de amboscierres; nunca usarúltimocierrecomobisagra. Modelo/producto y esfuerzo de apertura por ensayar.'}},'nose':{'endXmm':2000,'softCapLengthMm':100,'planRadiusMinMm':35,'notes':'NúcleosEPS140x280x50, tresporhalf; cubiertaEVA10mm y últimos35mm redondeadosR35. Sin metal en la nariz.'},'finish':{'base':'EPS35 sobre bastidores independientes. Tela ligera y recubrimiento acuoso compatibleEPS, no portantes.','look':'papel/tela mate, blanco-plata, rojo y azul; metal de fantasía opcional','test':'Probeta de adhesión, golpes y temperatura antes del acabado completo. Confirmar comportamiento al fuego requerido por producción; el recubrimiento no vuelve incombustible al EPS.'},'lighting':{'optional':True,'count':4,'voltageV':5,'moduleMaxW':.5,'battery':'Dos powerbankscomerciales protegidos5V/2A, uno porhalf. Cada uno lleva fusible1A e interruptor y alimentados módulos en paralelo. Ningún cable entre mitades. Recargar fuera.','notes':'Luz difusa hacia rostros desde borde superior de ventanas; sin deslumbrar ni tocar espuma. Confirmar posición con reparto.'},'massBudget':{'items':[{'name':n,'kg':round(v,4)}for n,v in lines],'baseKg':round(base,3),'contingencyFraction':.15,'withReserveKg':round(base*1.15,3),'optionalLEDAllowanceKg':.4,'withLEDAndReserveKg':round((base+.4)*1.15,3),'status':'Estimación por área/perfiles y reservas, no pesaje ni certificación. Pesar cada mitad y conjunto con acabado seco.'},'constructionOrder':['Replantear estaciones y comprobar paso de cuatro intérpretes/cauchera en maqueta de cartón.','Armar bastidoresA/B independientes, mediosaros y agarres con casquillos; probar sin EPS.','Cortar duelas50mm segúnCSV/SVG; ensamblar sobre gálibos de sección, biselar cantos.','Esculpir35mm nominal y recortarventanas; proteger cantos con EVA, no afinar a cero.','Colocarpeines/raíces/topes al bastidor y cinchas con retorno; cubrir todo el encaje.','Aplicartela y recubrimientoEPScompatible; secar, lijarsuave y pintarblanco/rojo/azul.','Añadiraletas/propulsor ligeros; montarLEDopcionales con bateríaextraíble.','Ensayo progresivo con carga propiaal rasdelpiso y después con reparto/cauchera, recorrido y aperturadirigida.']}
(P/'model.json').write_text(json.dumps(model,ensure_ascii=False,separators=(',',':')))
buf=io.StringIO();w=csv.writer(buf);w.writerow(['ID','Mitad','Xinicio_mm','Xfin_mm','Banda_ini_grados','Banda_fin_grados','Rectangulo_L_mm','Rectangulo_W_mm','Espesor_compra_mm','Profundidad_necesaria_mm','Plancha','Xplancha_mm','Yplancha_mm','Rotacion_grados'])
for p in parts:w.writerow([p['id'],p['side'],*p['xRangeMm'],*p['thetaDeg'],*p['blank']['sizeMm'],round(p['blank']['depthNeededMm'],3),p['stock']['sheet'],*p['stock']['xyMm'],p['stock']['rotationDeg']])
(D/'Duelas-N01.csv').write_text(buf.getvalue(),encoding='utf-8-sig')
buf=io.StringIO();w=csv.writer(buf);w.writerow(['ID','Mitad','Tipo','Seccion_mm','Largo_mm','A_mm','B_mm'])
for m in members:w.writerow([m['id'],m['side'],m['kind'],m['sectionMm'],round(m['lengthMm'],2),m.get('aMm',m.get('pointsMm',[None])[0]),m.get('bMm',m.get('pointsMm',[None])[-1])])
(D/'Bastidores-N01.csv').write_text(buf.getvalue(),encoding='utf-8-sig')
# Stock SVGs at1:1; rectangles are rough blanks, NOT flattened curved finished parts.
for i in range(len(sheets)):
 svg=['<svg xmlns="http://www.w3.org/2000/svg" width="1000mm" height="1000mm" viewBox="0 0 1000 1000"><rect width="1000" height="1000" fill="white" stroke="black"/>']
 for p in allblanks:
  s=p['stock']
  if s['sheet']!=i+1:continue
  x,y=s['xyMm'];W,H=s['sizeMm'];svg.append(f'<rect x="{x}" y="{y}" width="{W}" height="{H}" fill="#c9dce4" stroke="#222" stroke-width=".4"/><text x="{x+4}" y="{y+12}" font-family="Arial" font-size="8">{p["id"]} {W:.1f}x{H:.1f}</text>')
 svg.append('</svg>');(D/f'EPS-N01-plancha-{i+1:02}.svg').write_text(''.join(svg))
# Exact half-section templates fit on1000x700mm sheets after a90degree rotation.
for old in D.glob('Galibo-*-N01-1a1.svg'):old.unlink()
stationList=sorted(set(x for pair in segments for x in pair))
for i,x in enumerate(stationList,1):
 for side,sg in [('A',-1),('B',1)]:
  svg=['<svg xmlns="http://www.w3.org/2000/svg" width="1000mm" height="700mm" viewBox="0 0 1000 700"><rect width="1000" height="700" fill="white"/><text x="40" y="28" font-family="Arial" font-size="13">S'+f'{i:02}-{side} / X={x:g}mm / exterior continuo / interior discontinuo / imprimir100%</text>']
  for inner in[False,True]:
   qs=[]
   for t in np.linspace(0,TM,161):
    q=pt(x,t,sg)
    if inner:q-=norm(x,t,sg)*min(T,100*radius(x))
    qs.append([70+q[1],80+abs(q[2])])
   svg.append('<polyline points="'+' '.join(f'{a:.3f},{b:.3f}'for a,b in qs)+'" fill="none" stroke="'+('#777'if inner else'#111')+'" stroke-width=".5"'+(' stroke-dasharray="5 3"'if inner else'')+'/>')
  svg.append('<line x1="70" y1="640" x2="170" y2="640" stroke="black"/><text x="70" y="665" font-family="Arial" font-size="13">Control100mm</text></svg>')
  (D/f'Galibo-S{i:02}-{side}-N01-1a1.svg').write_text(''.join(svg))
buf=io.StringIO();w=csv.writer(buf);w.writerow(['ID','Mitad','Tipo','Largo_mm','Ancho_mm','Espesor_mm','Plancha','X_mm','Y_mm','Rotacion'])
for p in allblanks:w.writerow([p['id'],p['side'],p['category'],*p['blank']['sizeMm'],p['stock']['sheet'],*p['stock']['xyMm'],p['stock']['rotationDeg']])
(D/'Blancos-N01-completo.csv').write_text(buf.getvalue(),encoding='utf-8-sig')
(D/'LEER-N01.txt').write_text(f"""QUELEC / NAVE N01 / 24.10.2026 / PROTOTIPO

Fuselaje de4000mm de largo x1000mm de ancho x800mm de alto. Aleta hasta1230mm. Cuatro portadores externos sostienen la nave; cuatro gruñones caminan sobre el escenario con una cauchera horizontal de2000x800mm. No hay plataforma para personas.

CORTES Y GÁLIBOS
Doce planchas EPS de1000x1000x50mm, con178blancos rectangulares. Margen10mm y separación5mm. Los154blancos de duelas se biselan y esculpen: no son piezas planas terminadas. Los otros24 forman aletas, propulsor y núcleos de nariz. Espesor nominal del cuerpo35mm. Nariz: tres núcleos140x280x50 por mitad y cubiertaEVA10; redondeoR35 en planta, sin metal.

Blancos-N01-completo.csv contiene las178piezas; Duelas-N01.csv detalla los154paños de talla. Bastidores-N01.csv reúne los perfiles. Cada EPS-N01-plancha-*.svg está a1:1 en milímetros, sobre1000x1000mm. Los28SVG Galibo-S01-A aS14-B tienen formato1000x700mm y control de100mm. Imprimir al100%, sin ajustar, y comprobar la regla antes de cortar. No hace falta imprimir todos: A/B son espejos y S04-S09 tienen la misma sección; reutilizar el gálibo del cuerpo.

MONTAJE
1. Hacer maqueta de paso con el reparto, vestuario y cauchera reales.
2. Armar los bastidoresA/B y sus consolas; comprobar agarres antes de ponerEPS.
3. Cortar blancos, biselar y ensamblar sobre los gálibos; esculpir y después rematar ventanas.
4. Atornillar raíces de guías y topes al metal, colocar cinchas y cubiertas blandas.
5. Aplicar tela y recubrimiento acuoso compatible conEPS tras una probeta. Secar, dar acabado blanco/plata, rojo y azul, y proteger los cantos.
6. Colocar accesorios y LED opcionales independientes por mitad.
7. Pesar cada mitad y ensayar progresivamente los controles y la apertura con señal común. Liberar ambos cierres antes de desplazarlas.

FIJACIONES
Consolas: baseAl80x80x3, frontal80x120x3 y cartelas3. DosM6x35verticales por base; casquillos17mm precargados en tubo20x20x1,5, agujero6,5. Los peinesPEHD6 son guías, no portadores: M4x20 y arandelas12 al alaAl3. El soporte al tubo lleva M4x35 y casquillo17, agujero4,5. G1 centra; G2 permite desplazamientoX de+/-4mm; G3 de+/-6mm. Dos cinchas50 conVelcrocosido, solape50x100; cubiertas separadas por mitad protegen dientes/raíces.

MASA Y LUZ
Masa con reserva15%:{base*1.15:.3f}kg; conLED y reserva:{(base+.4)*1.15:.3f}kg. Es cálculo por cantidades y reservas, no pesaje ni capacidad certificada. Cada conjunto de dos portadores debe probar su mitad: no asumir que siempre recibe exactamente un cuarto de la masa.
Cuatro LED5V/0,5W máximo, con driver y difusor; dos por mitad. Dos baterías comerciales protegidas e independientes, cada una con fusible1A e interruptor. No hay cable entre mitades. Extraer para recargar; comprobar temperatura y visibilidad con el reparto.

PLANOS
Blueprints-N01.pdf y Guia-visual-N01.pdf: cuatro pliegos cada uno, de1000x700mm. Son instrucciones de montaje. Para corte a tamaño real usarSVG y sus cotas. Antes de fabricación definitiva: validar materiales, paso, controles y trayectoria de apertura con el responsable del prototipo.
""")
with zipfile.ZipFile(D/'Paquete-taller-N01.zip','w',zipfile.ZIP_DEFLATED)as z:
 for f in sorted(D.iterdir()):
  if f.suffix in['.svg','.csv','.txt']:z.write(f,f.name)
print(json.dumps({'parts':len(parts),'slabs':len(sheets),'segments':len(segments),'areaM2':area,'stockM2':model['stock']['stockAreaM2'],'massKg':base*1.15,'blanks':len(allblanks),'jsonMB':(P/'model.json').stat().st_size/1e6}))
