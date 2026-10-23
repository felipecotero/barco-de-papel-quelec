from pathlib import Path
import sys,json,math
sys.path.insert(0,'/private/tmp/grulla-libs')
import numpy as np
from shapely.geometry import Polygon
from shapely import affinity
P=Path(__file__).resolve().parents[1]
parts=[]
def face(code,name,pts,group,n=None,center=None):
 a=np.array(pts,float);normal=next(q for q in [np.cross(a[1]-a[0],v-a[0])for v in a[2:]]if np.linalg.norm(q)>1e-8);normal/=np.linalg.norm(normal)
 if center is not None and normal@(a.mean(0)-np.array(center))<0:a=a[::-1];normal=-normal
 if n is not None and normal@np.array(n)<0:a=a[::-1];normal=-normal
 u=a[1]-a[0];u/=np.linalg.norm(u);v=np.cross(normal,u)
 assert abs((a-a[0])@normal).max()<1e-6,(code,'non-planar')
 flat=np.c_[(a-a[0])@u,(a-a[0])@v];flat-=flat.min(0);poly=Polygon(flat);assert poly.is_valid and poly.area>1
 parts.append(dict(id=code,name=name,group=group,vertices=a.tolist(),normal=normal.tolist(),flat=flat.tolist(),areaM2=poly.area/1e6,thicknessMm=2,center=a.mean(0).tolist()))
# A square, shallow opening replaces only the traditional crane's inflated back.
# The surrounding outside reads as a tapered, pointed bird body, not a box.
floor=[[-202,190,-202],[202,190,-202],[202,190,202],[-202,190,202]]
face('B01','Suelo útil 400 x400, vacío',floor,'cuerpo',[0,1,0])
for code,name,a,b,n in [('B02','Costado izquierdo',floor[3],floor[0],[-1,0,0]),('B03','Costado derecho',floor[1],floor[2],[1,0,0]),('B04','Frente del hueco',floor[2],floor[3],[0,0,1]),('B05','Trasera del hueco',floor[0],floor[1],[0,0,-1])]:
 aa=np.array(a,float);bb=np.array(b,float);A=aa.copy();B=bb.copy();A[1]=B[1]=280
 face(code,name,[aa,bb,B,A],'cuerpo',n)
for i in range(4):face(f'B{i+6:02}','Pliegue inferior del cuerpo '+str(i+1),[floor[i],floor[(i+1)%4],[0,0,80]],'vientre',center=[0,150,0])
# Broad wings with a single principal ridge and two planar faces on each side.
# Upper/lower folded skins meet at the pointed wing tip; no thick rectangular edge.
for side,sg in enumerate([-1,1]):
 A=np.array([sg*202,280,202.]);B=np.array([sg*202,280,-202.]);M=np.array([sg*202,340,0.]);T=np.array([sg*600,380,0.]);al=A+[0,-35,0];bl=B+[0,-35,0];ml=M+[0,-35,0]
 faces=[(A,T,M),(M,T,B),(al,ml,T),(ml,bl,T),(A,al,T),(B,T,bl),(A,M,B)]
 center=np.mean([A,B,M,T,al,bl,ml],axis=0)
 for i,pts in enumerate(faces):face(f'A{side*7+i+1:02}',('Ala izquierda'if sg<0 else'Ala derecha')+f' / pliegue {i+1}',pts,'alaI'if sg<0 else'alaD',center=center)
# Long, narrow upright tail. Its four facets form a very flat pyramid.
L=np.array([-75,280,-202.]);R=np.array([75,280,-202.]);T=np.array([0,880,-400.]);Q=np.array([0,340,-210.]);center=np.mean([L,R,T,Q],axis=0)
for i,pts in enumerate([(L,T,Q),(Q,T,R),(L,R,T),(L,Q,R)]):face(f'T{i+1:02}','Cola alta / cara '+str(i+1),pts,'cola',center=center)
# Inclined, tapered neck and a short reversed head fold: no horizontal shelf.
L=np.array([-55,280,202.]);R=np.array([55,280,202.]);BL=np.array([-55,190,202.]);BR=np.array([55,190,202.]);B=np.array([0,0,160.]);H=np.array([0,650,450.]);t=(590-280)/(650-280);HL=L+(H-L)*t;HR=R+(H-R)*t;tip=np.array([0,560,600.]);center=np.mean([L,R,B,H],axis=0)
for i,pts in enumerate([(BL,L,HL,H),(BR,H,HR,R),(L,R,HR,HL),(BL,H,B),(BR,B,H),(BL,B,BR)]):face(f'N{i+1:02}','Cuello inclinado / cara '+str(i+1),pts,'cuello',center=center)
center=np.mean([H,HL,HR,tip],axis=0)
for i,pts in enumerate([(H,HL,tip),(H,tip,HR),(HL,HR,tip)]):face(f'P{i+1:02}','Pico / pliegue '+str(i+1),pts,'pico',center=center)
# Internal planar diaphragms follow the original wing envelope, inset 3 mm.
from shapely.geometry import box
for j,(sg,x) in enumerate([(s,x)for s in[-1,1]for x in[300,450]]):
 k=(x-202)/398;Y=340+(380-340)*k;Z=202*(1-k)-3;low=35*(1-k)
 edge=Y-60*(1-k)*Z/(202*(1-k))
 pts=[[sg*x,edge-3,Z],[sg*x,Y-3,0],[sg*x,edge-3,-Z],[sg*x,edge-low+3,-Z],[sg*x,Y-low+3,0],[sg*x,edge-low+3,Z]]
 face(f'R{j+1:02}','Separador interior de ala '+str(j+1),pts,'auxiliares',[sg,0,0])
# A shallow triangular spacer in the upright tail, inset from all edges.
y=360;t=(y-280)/600;x=75*(1-t);z=-202-198*t;zb=-210-190*(y-340)/540
small=Polygon([[-x,z],[x,z],[0,zb]]).buffer(-3,join_style=2)
face('R05','Separador interior de cola',[[x,y,z]for x,z in list(small.exterior.coords)[:-1]],'auxiliares',[0,1,0])
# Every PP blank is included. Butt joints use flexible tape from a roll, not
# unlisted PP tabs. The metal load frame and cross are separate purchased stock.
SHEET=box(10,10,2430,1210);placed=[]
for p in sorted(parts,key=lambda p:-Polygon(p['flat']).area):
 g=Polygon(p['flat']);opts=[]
 for angle in [0,90,180,270]:
  q=affinity.rotate(g,angle,origin=(0,0));a,b,c,d=q.bounds;q=affinity.translate(q,-a,-b);opts.append((angle,q,c-a,d-b))
 best=None
 # 10 mm candidate grid gives repeatable positions and leaves a 6 mm kerf gap.
 for angle,q,w,h in opts:
  for y in range(10,int(1210-h)+1,10):
   if best and y>best[0]:break
   for x in range(10,int(2430-w)+1,10):
    qq=affinity.translate(q,x,y)
    if all(qq.distance(o)>=6-1e-7 for o in placed):
     val=(y,x,angle);best=min(best,(y,x,angle,qq),key=lambda v:v[:3])if best else(y,x,angle,qq);break
 if best is None:raise RuntimeError('One sheet nesting failed at '+p['id'])
 y,x,angle,q=best;p['stock']={'sheet':1,'angle':angle,'xy':[x,y]};placed.append(q)
assert all(SHEET.covers(g)for g in placed)
assert all(a.distance(b)>=6-1e-7 for i,a in enumerate(placed)for b in placed[i+1:])
area=sum(p['areaM2']for p in parts)
model={'revision':'G03','title':'Grulla de origami / cuatro esquinas y una lámina','date':'2026-10-23','status':'Silueta G02 conservada. Despiece geométrico verificado; validar material, uniones y cuelgue mediante prototipo antes de suspender carga.','sizeMm':[1200,1000,1000],'sizeAxes':['envergadura X','alto total Y','cabeza-cola Z'],'birdHeightMm':880,'floorYmm':190,'clearSpaceMm':[400,400],'payloadEnvelopeMm':[350,350,350],'payloadKg':3,'parts':parts,'joints':{'method':'Unión a tope de caras nominales; cinta flexible blanca 25 mm por dentro y acabado de papel por fuera. Sin pestañas añadidas al contorno. Prueba de adherencia en PP obligatoria; la cinta no transmite carga de cuelgue.','loadPath':'Bandeja metálica → bastidor → cuatro montantes de esquina → ojos → ramales verticales → cruceta → anilla'},'stock':{'sheets':1,'sheetMm':[2440,1220],'parts':len(parts),'areaM2':area,'marginMm':10,'gapMm':6,'status':'Anidado poligonal verificado: 36 caras + 5 separadores, sin solapes; todos los blancos PP incluidos. Cinta, papel de acabado y perfiles metálicos se compran aparte.','fluteDirection':'Las rotaciones de anidado no fijan una dirección estructural de canales: la piel no recibe la carga. Validar curvatura y rigidez en muestra de PP2.'},'material':{'shellThicknessMm':2,'proposal':'Cartón Plast blanco o natural de 2 mm para piel y separadores; bandeja y cuelgue metálicos independientes','reference':'https://www.coroplast.com/products/coroplast-print/'},'hanging':{'anchorsMm':[[x,300,z]for x in[-202,202]for z in[-202,202]],'upperPointsMm':[[x,928 if x*z>0 else 943,z]for x in[-202,202]for z in[-202,202]],'masterPointMm':[0,960,0],'ringCenterMm':[0,980,0],'ringOuterMm':40,'spreader':True,'spreaderBarsMm':[[[-202,928,-202],[202,928,202]],[[-202,943,202],[202,943,-202]]],'spreaderProfile':'Aluminio 15×15×1 mm; 2 diagonales nominales de 571,34 mm. Propuesta pendiente de validación de fijaciones y carga.','cornerPosts':'4 montantes en L de aluminio 15×15×1,5 mm entre bastidor y esquina; ojos M6 con contraplaca y tuerca autoblocante, fijados a metal, nunca solo al PP.','loadRating':None,'status':'Cuatro ramales verticales desde las esquinas de la canasta. Cruceta superior evita cables en la reserva de carga. Capacidad no certificada.'},'lighting':{'voltageV':5,'stripCount':2,'stripLengthMm':200,'powerBudgetW':3.2,'batteryEnvelopeMm':[110,75,35]},'sources':{'crane':'https://origamiusa.org/diagrams/crane','folding':'https://home.nps.gov/articles/000/origami-cranes.htm','material':'https://www.coroplast.com/products/coroplast-print/'},'massBudget':None,'documentation':{'current':'G03: modelo y plantillas nominales 1:1 con inventario de piezas','obsolete':'No utilizar planos G01 para esta geometría'}}
(P/'model.json').write_text(json.dumps(model,ensure_ascii=False,separators=(',',':')))
# Fabrication vectors in mm, not screenshots. Dimensions of stock are exact.
import csv,io,zipfile,html
D=P/'downloads';D.mkdir(exist_ok=True)
colors={'cuerpo':'#91bfc4','vientre':'#c5b3d9','alaI':'#d9ac7f','alaD':'#96c5b2','cola':'#d9ce91','cuello':'#92b4d1','pico':'#c9a3b5','auxiliares':'#b3cbb9'}
svg=['<svg xmlns="http://www.w3.org/2000/svg" width="2440mm" height="1220mm" viewBox="0 0 2440 1220">','<rect width="2440" height="1220" fill="white" stroke="black"/>','<rect x="10" y="10" width="2420" height="1200" fill="none" stroke="#999" stroke-dasharray="5 5"/>']
for p in parts:
 q=Polygon(p['flat']);q=affinity.rotate(q,p['stock']['angle'],origin=(0,0));a,b,_,_=q.bounds;q=affinity.translate(q,p['stock']['xy'][0]-a,p['stock']['xy'][1]-b)
 pts=' '.join(f'{x:.3f},{y:.3f}'for x,y in list(q.exterior.coords)[:-1]);c=q.representative_point()
 svg.append(f'<polygon points="{pts}" fill="{colors[p["group"]]}" fill-opacity=".25" stroke="#183e5b" stroke-width=".4"/><text x="{c.x:.2f}" y="{c.y:.2f}" text-anchor="middle" font-family="sans-serif" font-size="9">{p["id"]}</text>')
svg.append('</svg>');(D/'Grulla-G03-lamina-1a1.svg').write_text(''.join(svg))
buf=io.StringIO();w=csv.writer(buf);w.writerow(['ID','Pieza','Grupo','PP mm','Área m²','Ángulo °','X mm','Y mm','Lados mm'])
for p in parts:
 q=Polygon(p['flat']);pts=p['flat'];lens=[math.dist(a,b)for a,b in zip(pts,pts[1:]+pts[:1])];w.writerow([p['id'],p['name'],p['group'],2,round(p['areaM2'],6),p['stock']['angle'],*p['stock']['xy'],' / '.join(f'{v:.2f}'for v in lens)])
(D/'Grulla-G03-inventario.csv').write_text(buf.getvalue(),encoding='utf-8-sig')
notes=f"""GRULLA QUELEC G03 — PLANTILLAS NOMINALES
Una lámina 2440 × 1220 × 2 mm. 36 caras + 5 separadores internos.
Área neta PP: {area:.6f} m². Margen mínimo 10 mm. Separación mínima entre contornos 6 mm.
SVG en milímetros a escala 1:1. Imprimir al 100 %, sin ajustar. Comprobar que el borde exterior mide 2440 × 1220 mm.
Línea continua = corte del contorno. Etiquetas = códigos del visor. No cortar letras ni margen punteado.
No hay pestañas: las caras se juntan a tope con cinta flexible blanca de 25 mm por dentro. Las costillas R01–R04 mantienen las alas y R05 la cola. Probar adhesión en PP2 y comportamiento del acabado de papel antes del montaje completo. La cinta no es elemento de suspensión.
El SVG corta caras planas, no es un desarrollo de papel que se pliegue de una sola pieza. Las triangulaciones de render no son cortes.
B01 suelo. B02–B05 paredes. B06–B09 vientre. A01–A07 ala izquierda. A08–A14 ala derecha. T01–T04 cola. N01–N06 cuello. P01–P03 pico. R01–R05 separadores.
Secuencia: identificar todas las piezas; armar cuerpo alrededor de la bandeja independiente; fijar los separadores dentro de las alas/cola y cerrar sus caras; unir cuello y pico; unir alas/cola al cuerpo; colocar sistema de luz bajo el suelo; fijar los cuatro montantes y ojos a metal en las esquinas; conectar cuatro ramales verticales a cruceta y anilla.
Todos los blancos PP están en la lámina. Papel de acabado, cinta flexible, bastidor, bandeja, montantes, cruceta, cables, ojos y sistema eléctrico son materiales separados. No añadir piezas PP fuera de este inventario sin revisar el anidado.
La orientación de canales no se usa como criterio de capacidad: la piel no lleva la carga. Verificar la rigidez de la referencia real y no cambiar geometría para forzar pliegues.
La forma nominal exterior es 1200 × 1000 × 1000 mm con cuelgue. Hueco útil 400 × 400 mm, reserva interior 350 × 350 × 350 mm, semilla no representada.
Cuelgue conceptual para carga prevista de 3 kg, sin capacidad certificada. Validación de herrajes, uniones, estabilidad y carga del prototipo antes de suspender. Los planos G01 están obsoletos para esta forma.
"""
(D/'LEER-G03.txt').write_text(notes)
with zipfile.ZipFile(D/'Despiece-Grulla-G03.zip','w',zipfile.ZIP_DEFLATED)as z:
 for f in D.iterdir():
  if f.suffix in['.svg','.csv','.txt']:z.write(f,f.name)
print('G03:',len(parts),'PP blanks;',round(area,4),'m²;',round(area/(2.44*1.22)*100,1),'% net occupancy; ONE SHEET, verified 6 mm gap')
