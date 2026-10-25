"""Build PA03 metadata without modifying the approved raster images."""
from pathlib import Path
import json, shutil, hashlib
from PIL import Image
P=Path(__file__).resolve().parents[1]
S=P.parent.parent/'pancartas-propuestas-PA02'
rows=[
 ('01-sonar-imaginacion.png',[(20,26,688,1032),(743,26,688,1032)], [('Soñar',[3,37],'La orden de no soñar aparece al presentar la ciudad y vuelve cuando crece la flor.'),('Usar la imaginación',[3],'La orden prohíbe usar la imaginación.')]),
 ('02-alegria-ositos.png',[(22,26,688,1032),(739,26,688,1032)],[('Felicidad y gestos de alegría',[3,4],'Se combinan ser feliz y los gestos de alegría en una sola imagen, según decisión del usuario.'),('Ositos de peluche',[4],'La orden prohíbe los ositos de peluche.')]),
 ('03-helado-jugar.png',[(20,26,688,1032),(740,26,688,1032)],[('Comer helado',[4,5],'La orden incluye cualquier sabor y presentación.'),('Jugar',[15,20],'La prohibición de jugar se explica como parte del orden de la ciudad.')]),
 ('04-tiempo-jugar.png',[(20,26,688,1032),(742,26,688,1032)],[('Perder el tiempo',[5],'El reloj de arena y el niño sin prisa son la traducción gráfica aprobada del tema.'),('Jugar',[15,20],'El tema jugar se repite en la octava cara con la ilustración aprobada de esta pareja.')])]
signs=[]
for i,(source,crops,themes) in enumerate(rows,1):
 target=P/f'assets/pareja-{i:02}.png';shutil.copyfile(S/source,target)
 im=Image.open(target);size=list(im.size);faces=[]
 for letter,crop,(title,pages,note) in zip('AB',crops,themes):
  faces.append({'id':letter,'code':f'P{i:02}{letter}','title':title,'theme':title,'pages':pages,'sourcePages':pages,'image':f'assets/pareja-{i:02}.png','imageSizePx':size,'cropPx':list(crop),'cropOrigin':'top-left','noText':True,'note':note})
 signs.append({'id':f'P{i:02}','title':themes[0][0]+' / '+themes[1][0],'faces':faces,'artwork':f'assets/pareja-{i:02}.png','approvedImageSha256':hashlib.sha256(target.read_bytes()).hexdigest()})
override=json.loads((P/'assets/color-PA03.json').read_text())
signs[3]['faces'][1].update(override)
signs[3]['title']='Perder el tiempo / Usar lápices de colores'
signs[3]['artwork']=override['image']
signs[3]['approvedImageSha256']=override['sourceImageSha256']
for sign in signs:
 for face in sign['faces']:face['sourceImageSha256']=hashlib.sha256((P/face['image']).read_bytes()).hexdigest()
items=[]
for i in range(8):
 board=i//2+1;side='AB'[i%2]
 items.append({'id':f'P{board:02}{side}','kind':'panel','role':'tablero portante' if side=='A' else 'tapa posterior','xMm':5+(i%3)*405,'yMm':5+(i//3)*605,'widthMm':400,'heightMm':600,'quantity':1,'sheet':1})
for i in range(4):items.append({'id':f'R{i+1:02}','kind':'reinforcement','role':'banda posterior del tablero portante','xMm':5+i*65,'yMm':1820,'widthMm':60,'heightMm':560,'quantity':1,'sheet':1})
net=sum(q['widthMm']*q['heightMm'] for q in items)/1e6
D={
'revision':'PA03','title':'Pancartas de los Gruñones','count':4,'facesPerSign':2,'distinctThemes':8,'orientation':'portrait','textOnFaces':False,
'approval':{'date':'2026-10-25','userStatement':'pongamos una ilustración de prohibido usar lápices de colores','scope':'Aplicar las cuatro parejas de imágenes aprobadas a cuatro pancartas verticales de dos caras, sin texto en los frentes. La segunda imagen de jugar se sustituye por lápices de colores y trazos de color tachados.','dimensionsStatus':'Medidas y detalles de montaje propuestos por el taller para comprobar en prototipo y ensayo.'},
'source':{'title':'Quelec y la semilla del futuro - Escenas V2','date':'2026-10-07','pages':40,'scope':'Las páginas respaldan los temas prohibidos del diálogo. La forma, cantidad de pancartas y traducción visual son decisiones del diseño, no acotaciones literales del libreto.','imageStatus':'Siete caras conservan las imágenes originales PA02. P04B usa la ilustración de lápices de colores creada para la sustitución solicitada. Los PNG completos se conservan intactos; cada cara se selecciona por UV o ventana de impresión.','fullScriptPublished':False},
'dimensionsMm':{'panel':[400,600,3],'rearPanel':[400,600,3],'reinforcement':[60,560,3],'pole':[25,15,1800],'spacer':[15,50,30],'innerGap':30,'boxThickness':36,'overallHeight':2050,'panelBottom':1450,'panelCenterHeight':1750,'poleOverlap':350,'edgeRadius':6,'reinforcementTopBottomMargin':20,'holesFromPanelBottom':[100,220],'holesFromPanelLeft':200,'holePitch':120,'holeDiameter':6.2,'poleHoleDiameter':4.5,'spacerCentersFromPanelMm':[[30,40],[370,40],[30,560],[370,560]],'spacerScrewOffsetY':12.5,'spacerScrewDiameter':3,'spacerScrewLength':12},
'construction':{'principle':'El mango y sus dos uniones quedan en el interior de una caja ligera de doble cara; la tapa posterior conserva su imagen completa.','layerOrderFrontToBack':['Papel ilustrado de cara A, sin texto','Tablero portante PP 3 mm','Banda central PP 3 mm','Mango 15 mm de espesor con dos fijaciones M4','Espacio libre para las tuercas y extremos protegidos','Tapa posterior PP 3 mm, a 30 mm de la cara interior del tablero delantero','Papel ilustrado de cara B, sin texto'],'spacers':'Cuatro tacos de madera de 15 × 50 × 30 mm, uno cerca de cada esquina, mantienen la cámara de 30 mm. Los tornillos de fijación se cubren con el papel.','rearPanel':'La tapa es un cierre ligero. El listón y los herrajes permanecen dentro; no se montan sobre la ilustración trasera.','validation':'Comprobar prototipo, adherencia del papel al PP, ajuste sin aplastar, holgura de las tuercas bajo la tapa, agarre, balance y lectura en ensayo. Las pancartas no son soportes para personas.'},
'fasteners':{'perSign':2,'bolt':'M4 × 30, cabeza redondeada','washers':'Ø18 mm, una por cara de la unión principal','sleeve':'Ø exterior 6 / interior 4,3 × largo 6 mm','sleevePurpose':'Limita el aplastamiento del tablero PP3 y su banda PP3. No apretar hasta hundir las caras.','nut':'M4 autofrenante; proteger el extremo y comprobar que no roce la tapa posterior','spacerScrews':'Tornillos para madera Ø3 × 12 mm, cabeza baja, con arandelas Ø8 mm','spacerScrewsPerBlockPerFace':2,'spacerScrewsPerSign':16,'spacerNotes':'Marcar en cada taco dos centros separados 25 mm, a ±12,5 mm de su centro. Fijar por ambas caras; las dos entradas de 12 mm no deben encontrarse dentro del taco de 30 mm.'},
'quantities':{'sheetCount':1,'frontPanels':4,'rearPanels':4,'panelsTotal':8,'reinforcements':4,'poles':4,'spacers':16,'mainBoltsM4x30':8,'mainWashers18':16,'mainNutsM4':8,'mainSleeves6mm':8,'protectedMainEnds':8,'woodScrews3x12':64,'woodScrewWashers8':64,'paperFaces':8},
'materials':{'sheet':'1 lámina de Cartón Plast 1220 × 2440 × 3 mm','poles':'4 listones rectos de pino de 25 × 15 × 1800 mm, lijados y rematados','spacers':'16 tacos de madera de 15 × 50 × 30 mm','faces':'8 caras ilustradas sobre papel mate de 400 × 600 mm, sin palabras','bond':'Cinta fina de doble cara o adhesivo específico compatible con PP; comprobar la adherencia con una probeta antes de aplicar el arte','finish':'Apariencia de papel y siluetas de color con tachadura roja; no añadir nombres, códigos o leyendas sobre las imágenes'},
'nesting':{'sheetMm':[1220,2440,3],'sheetCount':1,'panelCount':8,'reinforcementCount':4,'netAreaM2':net,'utilizationPercent':net/(1.22*2.44)*100,'minimumMarginMm':5,'minimumSeparationMm':5,'items':items,'note':'Rectángulos de corte, sin solapamientos. Ocho paneles y cuatro bandas. Redondear después las esquinas R6. Orientar el canal paralelo al lado de 600 mm del panel.'},
'printing':{'faceSizeMm':[400,600],'count':8,'scale':'100 %, sin ajustar a página','sourceImagesIntact':True,'cropAspectRatio':'2:3','cropNote':'Los rectángulos de 688 × 1032 px excluyen el margen azul y el medianil de las imágenes de propuesta. No se repinta ni se deforma el motivo aprobado.','resolutionNote':'Los artes conservan los píxeles aprobados. Revisar la muestra impresa a escala real antes de producir las ocho caras.'},
'signs':signs,
'assembly':['Cortar los ocho tableros verticales y las cuatro bandas de la lámina. Marcar las piezas únicamente por dentro.','Presentar el listón centrado con 350 mm de solape y la banda de 60 × 560 mm. Marcar los dos centros, a 100 y 220 mm desde abajo.','Perforar tablero y banda a Ø6,2, y madera a Ø4,5. Colocar los casquillos de 6 mm, dos M4 × 30 y arandelas Ø18. Ajustar sin hundir el PP y proteger los extremos.','Poner cuatro tacos separadores de 30 mm de profundidad. Fijar cada taco con dos tornillos para madera Ø3 × 12 y arandelas Ø8 desde el tablero delantero. Presentar y fijar la tapa trasera del mismo modo.','Aplicar las ilustraciones A y B en papel mate cubriendo las cabezas. Comprobar que el mango, tuercas y fijaciones quedan dentro y no rozan la tapa. Revisar lectura, balance y manipulación en ensayo.'],
'designStatus':'PA03: ocho temas sin repetir jugar; sustitución gráfica solicitada; dimensiones y montaje son propuesta de construcción para validar con prototipo.'
}
(P/'model.json').write_text(json.dumps(D,ensure_ascii=False,indent=2)+'\n')
(P/'downloads/Pancartas-PA03-datos.json').write_text((P/'model.json').read_text())
print('PA03:',len(signs),'pancartas; 8 caras; neto',net,'m²; una lámina; imágenes completas intactas')
