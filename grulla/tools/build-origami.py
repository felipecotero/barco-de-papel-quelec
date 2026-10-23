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
floor=[[-152,190,-152],[152,190,-152],[152,190,152],[-152,190,152]]
face('B01','Suelo útil 300 x300, vacío',floor,'cuerpo',[0,1,0])
for code,name,a,b,n in [('B02','Costado izquierdo',floor[3],floor[0],[-1,0,0]),('B03','Costado derecho',floor[1],floor[2],[1,0,0]),('B04','Frente del hueco',floor[2],floor[3],[0,0,1]),('B05','Trasera del hueco',floor[0],floor[1],[0,0,-1])]:
 aa=np.array(a,float);bb=np.array(b,float);A=aa.copy();B=bb.copy();A[1]=B[1]=280
 face(code,name,[aa,bb,B,A],'cuerpo',n)
for i in range(4):face(f'B{i+6:02}','Pliegue inferior del cuerpo '+str(i+1),[floor[i],floor[(i+1)%4],[0,0,80]],'vientre',center=[0,150,0])
# Broad wings with a single principal ridge and two planar faces on each side.
# Upper/lower folded skins meet at the pointed wing tip; no thick rectangular edge.
for side,sg in enumerate([-1,1]):
 A=np.array([sg*152,280,152.]);B=np.array([sg*152,280,-152.]);M=np.array([sg*152,340,0.]);T=np.array([sg*700,380,0.]);al=A+[0,-35,0];bl=B+[0,-35,0];ml=M+[0,-35,0]
 faces=[(A,T,M),(M,T,B),(al,ml,T),(ml,bl,T),(A,al,T),(B,T,bl),(A,M,B)]
 center=np.mean([A,B,M,T,al,bl,ml],axis=0)
 for i,pts in enumerate(faces):
  target=[0,1,0]if i<2 else[0,-1,0]if i<4 else[0,0,1]if i==4 else[0,0,-1]if i==5 else[-sg,0,0]
  face(f'A{side*7+i+1:02}',('Ala izquierda'if sg<0 else'Ala derecha')+f' / pliegue {i+1}',pts,'alaI'if sg<0 else'alaD',n=target)
# Long, narrow upright tail. Its four facets form a very flat pyramid.
L=np.array([-75,280,-152.]);R=np.array([75,280,-152.]);T=np.array([0,880,-400.]);Q=np.array([0,340,-160.]);center=np.mean([L,R,T,Q],axis=0)
for i,pts in enumerate([(L,T,Q),(Q,T,R),(L,R,T),(L,Q,R)]):face(f'T{i+1:02}','Cola alta / cara '+str(i+1),pts,'cola',center=center)
# Inclined, tapered neck and a short reversed head fold: no horizontal shelf.
L=np.array([-45,280,152.]);R=np.array([45,280,152.]);BL=np.array([-45,190,152.]);BR=np.array([45,190,152.]);B=np.array([0,0,110.]);H=np.array([0,650,450.]);t=(590-280)/(650-280);HL=L+(H-L)*t;HR=R+(H-R)*t;tip=np.array([0,560,600.]);center=np.mean([L,R,B,H],axis=0)
for i,pts in enumerate([(BL,L,HL,H),(BR,H,HR,R),(L,R,HR,HL),(BL,H,B),(BR,B,H),(BL,B,BR)]):face(f'N{i+1:02}','Cuello inclinado / cara '+str(i+1),pts,'cuello',center=center)
center=np.mean([H,HL,HR,tip],axis=0)
for i,pts in enumerate([(H,HL,tip),(H,tip,HR),(HL,HR,tip)]):face(f'P{i+1:02}','Pico / pliegue '+str(i+1),pts,'pico',center=center)
# Internal planar diaphragms follow the original wing envelope, inset 3 mm.
from shapely.geometry import box
for j,(sg,x) in enumerate([(s,x)for s in[-1,1]for x in[330,520]]):
 k=(x-152)/548;Y=340+(380-340)*k;Z=152*(1-k)-3;low=35*(1-k)
 edge=Y-60*(1-k)*Z/(152*(1-k))
 pts=[[sg*x,edge-3,Z],[sg*x,Y-3,0],[sg*x,edge-3,-Z],[sg*x,edge-low+3,-Z],[sg*x,Y-low+3,0],[sg*x,edge-low+3,Z]]
 face(f'R{j+1:02}','Separador interior de ala '+str(j+1),pts,'auxiliares',[sg,0,0])
# A shallow triangular spacer in the upright tail, inset from all edges.
y=360;t=(y-280)/600;x=75*(1-t);z=-152-248*t;zb=-160-240*(y-340)/540
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
# Paired seam schedule: same-edge intervals in 3D, independent from render triangles.
joints=[]
edges=[]
for p in parts[:36]:
 for i,a in enumerate(p['vertices']):
  b=p['vertices'][(i+1)%len(p['vertices'])];edges.append((p['id'],i,np.array(a),np.array(b)))
for k,(pa,ia,a,b)in enumerate(edges):
 d=b-a;L=np.linalg.norm(d);u=d/L
 for pb,ib,c,e in edges[k+1:]:
  if pa==pb:continue
  if max(np.linalg.norm(np.cross(c-a,u)),np.linalg.norm(np.cross(e-a,u)))>1e-5:continue
  lo=max(0,min((c-a)@u,(e-a)@u));hi=min(L,max((c-a)@u,(e-a)@u))
  if hi-lo>5:joints.append({'id':f'J{len(joints)+1:02}','parts':[pa,pb],'lengthMm':float(hi-lo),'aMm':(a+lo*u).tolist(),'bMm':(a+hi*u).tolist(),'tapeMm':25,'method':'A tope; cinta flexible interior 25 mm centrada en la junta. Ensayar adhesión sobre PP.'})
anchors=[[x,300,z]for x in[-152,152]for z in[-152,152]]
master=[0,960,0];L=math.dist(anchors[0],master);angle=math.degrees(math.atan(math.hypot(152,152)/660))
# The hollow seed is NOT rendered. Conical envelope only checks rope clearance.
clearance=[]
for y in np.linspace(300,540,100):
 radial=math.sqrt(2)*152*(960-y)/660;coneR=150*max(0,1-(y-190)/350);clearance.append(radial-coneR-1.5)
model={'revision':'G04','date':'2026-10-23','title':'Grulla / canasta 30 y argolla única','status':'Geometría y anidado para prototipo; validar uniones y cuelgue con materiales reales.','sizeMm':[1400,1000,1000],'sizeAxes':['envergadura X','alto total Y','cabeza-cola Z'],'birdHeightMm':880,'floorYmm':190,'clearSpaceMm':[300,300],'payloadEnvelope':{'shape':'capuchón cónico, no representado','baseDiameterMm':280,'maxNominalDiameterMm':300,'heightMm':350,'baseYmm':190,'tipYmm':540,'recommendedRadialClearanceMm':10},'payloadKg':3,'parts':parts,'joints':joints,'stock':{'sheets':1,'sheetMm':[2440,1220],'parts':len(parts),'areaM2':area,'marginMm':10,'gapMm':6,'status':'Una lámina: 36 caras y 5 separadores interiores. Perfiles, contraplacas metálicas, cinta y papel se compran aparte.','fluteDirection':'Rotaciones libres para piel no portante; comprobar rigidez y acabado de PP2 con muestra.'},'material':{'shellThicknessMm':2,'proposal':'Cartón Plast natural translúcido 2 mm en alas + papel fino no opaco; resto con acabado mate de papel. Validar transmisión en probeta','reference':'https://www.coroplast.com/products/coroplast-print/'},'hanging':{'anchorsMm':anchors,'upperPointsMm':[master]*4,'masterPointMm':master,'ringCenterMm':[0,980,0],'ringOuterMm':40,'spreader':False,'ropeNominalEyeToEyeMm':L,'angleFromVerticalDeg':angle,'minClearanceConeMm':min(clearance),'cornerPosts':'4 ángulos aluminio 15×15×1,5 mm, L108 mm; bastidor inferior y cerco plano superior independientes del PP.','rope':'4 ramales de cuerda poliéster trenzada Ø3 mm; terminales y anilla con capacidad declarada para suspensión; largo entre ojos 694,1 mm nominal, ajustar en plantilla. No fijar con nudo improvisado.','eyes':'4 ojos M6 articulados aptos para tiro oblicuo, con contraplaca aluminio 25×25×3, arandela Ø18 y tuerca autoblocante. Elegir herraje de capacidad declarada y validar conjunto.','loadRating':None,'status':'4 esquinas de canasta a una sola argolla; sin cruceta y sin tomar carga de alas.'},'frame':{'plateMm':[304,304,1],'plateYmm':187.5,'squareProfileMm':[15,15,1],'perimeterMembers':{'longXQuantity':2,'longXLengthMm':295,'shortZQuantity':2,'shortZLengthMm':265,'axisOffsetMm':140,'outerSizeMm':[295,295],'Ymm':179.5,'joint':'Corte recto a tope: dos piezas Z entre las dos piezas X, sin solapes.'},'crossMembers':{'quantity':2,'lengthMm':265,'zOffsetsMm':[-65,65],'Ymm':179.5},'cornerPosts':{'quantity':4,'profileMm':[15,15,1.5],'lengthMm':108,'bottomYmm':179.5},'upperFlatRing':{'quantity':4,'sectionMm':[15,1.5],'lengthMm':304,'centerYmm':272.5,'outboardOffsetMm':153.5},'floorFixings':{'quantity':4,'type':'M4×12 nylon, arandelas Ø18','holesMm':4.5,'holesPPMm':6.2,'holesPlateMm':4.5,'sleeveMm':[6,4.3,2],'positionsMm':[[x,190,z]for x in[-120,120]for z in[-120,120]]},'metalFixings':{'type':'M4×25 inox + arandela Ø9 y tuerca autoblocante','sleeve':'En tubo hueco: casquillo Ø6 exterior/4,3 interior ×13 mm, taladro6,2 para evitar aplastamiento','gussets':'Escuadras Al20×20×1,5, L35 mm; dos taladros por ala a10 y25 mm del extremo (paso15); centrados a10 mm en ala20. Replantear según herraje real.','longitudinalMinEdgeMm':8,'tubeTransverseCenterMm':7.5,'pitchMm':15},'loadPath':'Carga → bandeja → bastidor cerrado → montantes/cerco superior → ojos → cuatro ramales → anilla. El PP y la cinta no reciben el cuelgue.'},'lighting':{'voltageV':5,'type':'2 focos puntuales USB 5 V, driver integrado, difusor opal y base disipadora; sin LED desnudo directo a batería','moduleCount':2,'moduleMaxPowerW':1,'powerBudgetW':3.2,'colorTemperatureK':3000,'fuseA':1,'batteryEnvelopeMm':[110,75,35],'battery':'Power bank comercial protegido, salida5V/2A, extraíble; cargar fuera de la pieza con cargador compatible5V/2A.','modules':[{'id':f'L{i+1}','centerMm':[sg*290,305+75*((290-152)/548)-60*30/152,30],'face':'A03'if sg<0 else'A10','fixings':'2 M3×16 nylon + arandelas Ø12 + contraplaca Al25×25×1; taladros3,2 a20 mm. Separadores interiores2 mm. Ajustar largo al módulo comercial sin aplastar PP.','heatSinkMm':[25,25,3],'lensDiameterMm':18,'mountDirection':'interior: opuesto a normal exterior de cara inferior','innerSpacerMm':2,'lensInwardMm':14,'pointInwardMm':18}for i,sg in enumerate([-1,1])],'notes':'Los módulos se fijan al INTERIOR de las caras inferiores A03/A10, en dirección opuesta a su normal exterior. Luz puntual difusa dentro del volumen, sin haz al suelo. Alas de PP natural translúcido y papel fino no opaco; validar transmisión, temperatura y fijación en muestra. Cableado por interior de alas y bajo cuerpo sin invadir la reserva.'},'sources':{'crane':'https://home.nps.gov/articles/000/origami-cranes.htm','material':'https://www.coroplast.com/products/coroplast-print/','adhesive':'https://www.3m.com/3M/en_US/p/d/b5005321032/','rigging':'https://www.hse.gov.uk/work-equipment-machinery/lift-equipment.htm'},'massBudget':None,'documentation':{'current':'G04: tres blueprints y tres pliegos de guía visual; plantillas nominales 1:1','obsolete':'No fabricar con G01/G03; canasta, alas y cuelgue cambiaron.'}}
(P/'model.json').write_text(json.dumps(model,ensure_ascii=False,separators=(',',':')))
import csv,io,zipfile,html
D=P/'downloads';D.mkdir(exist_ok=True)
colors={'cuerpo':'#91bfc4','vientre':'#c5b3d9','alaI':'#d9ac7f','alaD':'#96c5b2','cola':'#d9ce91','cuello':'#92b4d1','pico':'#c9a3b5','auxiliares':'#b3cbb9'}
svg=['<svg xmlns="http://www.w3.org/2000/svg" width="2440mm" height="1220mm" viewBox="0 0 2440 1220">','<rect width="2440" height="1220" fill="white" stroke="black"/>','<rect x="10" y="10" width="2420" height="1200" fill="none" stroke="#999" stroke-dasharray="5 5"/>']
T=D/'plantillas';T.mkdir(exist_ok=True)
for p in parts:
 q=Polygon(p['flat']);xs,ys=np.array(p['flat']).T
 pts=' '.join(f'{x:.3f},{y:.3f}'for x,y in p['flat']);w=xs.max()+20;h=ys.max()+20
 (T/(p['id']+'.svg')).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w:.3f}mm" height="{h:.3f}mm" viewBox="-10 -10 {w:.3f} {h:.3f}"><polygon points="{pts}" fill="none" stroke="black" stroke-width=".3"/><text x="{q.representative_point().x}" y="{q.representative_point().y}" font-size="8" text-anchor="middle">{p["id"]}</text></svg>')
 q=affinity.rotate(q,p['stock']['angle'],origin=(0,0));a,b,_,_=q.bounds;q=affinity.translate(q,p['stock']['xy'][0]-a,p['stock']['xy'][1]-b);pts=' '.join(f'{x:.3f},{y:.3f}'for x,y in list(q.exterior.coords)[:-1]);c=q.representative_point();svg.append(f'<polygon points="{pts}" fill="{colors[p["group"]]}" fill-opacity=".4" stroke="#183e5b" stroke-width=".4"/><text x="{c.x:.2f}" y="{c.y:.2f}" text-anchor="middle" font-family="sans-serif" font-size="9">{p["id"]}</text>')
svg.append('</svg>');(D/'Grulla-G04-lamina-1a1.svg').write_text(''.join(svg))
buf=io.StringIO();w=csv.writer(buf);w.writerow(['ID','Pieza','Grupo','PP mm','Área m²','Ángulo °','X mm','Y mm','Lados mm'])
for p in parts:
 pts=p['flat'];w.writerow([p['id'],p['name'],p['group'],2,round(p['areaM2'],6),p['stock']['angle'],*p['stock']['xy'],' / '.join(f'{math.dist(a,b):.2f}'for a,b in zip(pts,pts[1:]+pts[:1]))])
(D/'Grulla-G04-inventario.csv').write_text(buf.getvalue(),encoding='utf-8-sig')
buf=io.StringIO();w=csv.writer(buf);w.writerow(['Junta','Piezas','Largo mm','Ancho cinta mm','A XYZ mm','B XYZ mm'])
for j in joints:w.writerow([j['id'],' / '.join(j['parts']),round(j['lengthMm'],2),25,j['aMm'],j['bMm']])
(D/'Grulla-G04-juntas.csv').write_text(buf.getvalue(),encoding='utf-8-sig')
notes=f"""QUELEC / GRULLA G04
1400 mm envergadura ×1000 cabeza-cola ×1000 alto con anilla. Canasta útil300×300 mm. Semilla no representada; carga prevista3kg. Base recomendadaØ280, máxima nominalØ300 sin holgura, altura350mm y puntaY540.
Una lámina2440×1220×2mm:36caras y5separadores, área{area:.6f}m², margen10mm y separación6mm. Rotaciones sin criterio estructural de canal; ensayar PP real. Cinta y papel de acabado en rollo; perfiles, bandeja, focos y herrajes aparte.
SVG1:1 enmm. Imprimir100%, sin ajustar y medir borde exterior antes de cortar. Cortar solo contornos continuos. Códigos iguales al visor. Las41plantillas individuales están en plantillas/.
Fijación suelo:PPØ6,2 con casquilloØ6/4,3×2mm, aluminioØ4,5, tornilloM4×12nylon y arandelasØ18.\nUniones a tope: cinta flexible blanca25mm centrada,12,5mm por cada cara; probar sobre PP y acabado. No usar cinta para cuelgue. JuntasCSV localiza bordes coincidentes; raíces de alas se fijan al canto superior del cuerpo, con cierre en carasA07/A14. CostillasR01-R04 dentro de alas, R05 en cola. B01 sobre bandeja, B02-B05 paredes, B06-B09 vientre. A01-A07alaizquierda/A08-A14aladerecha. T01-T04cola, N01-N06cuello, P01-P03pico.
Cuelgue:4esquinas[±152,Y300,±152] a[0,960,0]. Ramales nominales entre ojos{L:.2f}mm; ángulo{angle:.2f}° a vertical. Sin cruceta. Ojos/articulaciones/terminales de capacidad declarada; no nudos improvisados. Ajustar largo al herraje comercial y nivelar en plantilla.
Cálculo geométrico: holgura mínima radial respecto capuchón cónicoØ300×350mm, en tramo de cables: {min(clearance):.2f}mm. No equivale a validar oscilación ni resistencia; no usar con carga de forma cilíndrica de35×35×35cm de versiones antiguas.
BandejaAl304×304×1mm bajoPP, bastidorAl15×15×1:2largosX295+2cortosZ265y2travesañosX265, marcoexterior295×295. MontantesL15×15×1,5,L108. Cerco superior4pletinasAl15×1,5,L304, aY272,5 y fuera del hueco. FijacionesM4metálicas con arandelas y tuercaautoblocante; casquillo13mm dentro de tubos para no aplastar. OjosM6concontraplacas25×25×3. Elegir el conjunto comercial y validar esfuerzos y estabilidad antes de carga en alto.
Luz INTERIOR de alas translúcidas:2focos puntualesUSB5Vcon driverintegrado,1Wmáx cadauno, ópticaopalØ18ybaseAl25×25×3; Batería5V/2Acomercialprotegida → fusible1A → interruptor → dos focos paralelo. Presupuestomáx3,2W. Cargar bateríaextraíblefuera delave. Montaje interior en A03/A10 con separadores2mm, 2M3×16nylon a20mm y contraplaca exterior25×25×1mm; ajustar al módulo real. PP natural2mm y papel fino NOopaco. Verplanospara conexiones y probar temperatura/acabado.
Tresblueprints técnicos y trespliegos guía visual a100×70cm. Dibujos ilustrativos a escalas declaradas: no usar PDF para cortar salvo cotejo; usar SVG1:1. PlanosG01/G03anteriores no corresponden aG04.
"""
(D/'LEER-G04.txt').write_text(notes)
with zipfile.ZipFile(D/'Despiece-Grulla-G04.zip','w',zipfile.ZIP_DEFLATED)as z:
 for f in sorted(D.rglob('*')):
  if f.is_file()and f.suffix in['.svg','.csv','.txt']:z.write(f,f.relative_to(D))
print('G04',len(parts),'PP blanks; area',area,'m²; ONE SHEET; rope',L,'mm; angle',angle,'deg; cone clearance',min(clearance),'mm;',len(joints),'edge joints')
