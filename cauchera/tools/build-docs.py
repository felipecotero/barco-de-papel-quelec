from pathlib import Path
import math,json,shutil
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import simpleSplit
P=Path(__file__).resolve().parents[1];R=P.parents[2];OUT=R/'output/pdf';TMP=R/'tmp/pdfs/cauchera-C01';OUT.mkdir(exist_ok=True);TMP.mkdir(parents=True,exist_ok=True)
D=json.loads((P/'model.json').read_text());F=Path('/Users/felipecamachootero/Library/Fonts')
for n,p in [('Q',F/'QuicheDisplay-Regular.ttf'),('M',F/'Montserrat-SemiBold.ttf'),('A',Path('/System/Library/Fonts/Supplemental/Arial.ttf'))]:pdfmetrics.registerFont(TTFont(n,str(p)))
CHECK=[];C=None;PAGE=0;TECH=True;FILE=''
def txt(x,y,s,size=25,font='A',color=None,align='left'):
 C.setFillColor(HexColor(color or INK));C.setFont(font,size);ww=pdfmetrics.stringWidth(s,font,size)/mm;left=x-(ww if align=='right'else ww/2 if align=='center'else 0);CHECK.append({'file':FILE,'page':PAGE,'x':left,'right':left+ww,'top':y-size/mm*.8,'bottom':y+size/mm*.2,'text':s,'pt':size});getattr(C,{'left':'drawString','right':'drawRightString','center':'drawCentredString'}[align])(x*mm,(700-y)*mm,s)
def para(x,y,w,s,size=25):
 for line in simpleSplit(s,'A',size,w*mm):txt(x,y,line,size);y+=size/mm*1.32
 return y+4

def line(a,b,w=.5,color=None):
 C.setStrokeColor(HexColor(color or INK));C.setLineWidth(w*mm);C.setLineCap(1);C.line(a[0]*mm,(700-a[1])*mm,b[0]*mm,(700-b[1])*mm)
def rect(x,y,w,h,fill=None):
 C.setStrokeColor(HexColor(LINE));C.setFillColor(HexColor(fill or BG));C.setLineWidth(.4*mm);C.roundRect(x*mm,(700-y-h)*mm,w*mm,h*mm,4*mm,fill=1,stroke=1)
def path(points,width=1,color=None):
 C.setStrokeColor(HexColor(color or INK));C.setLineWidth(width*mm);C.setLineCap(1);C.setLineJoin(1);p=C.beginPath();p.moveTo(points[0][0]*mm,(700-points[0][1])*mm)
 for x,y in points[1:]:p.lineTo(x*mm,(700-y)*mm)
 C.drawPath(p)
def dim(a,b,label,vertical=False):
 line(a,b,.4)
 for x,y in [a,b]:line((x-2,y-2),(x+2,y+2),.5)
 txt((a[0]+b[0])/2+(6 if vertical else 0),(a[1]+b[1])/2+(2 if vertical else -4),label,24,align='left'if vertical else'center')
def branch(cx,base,s=1,skin=True,foot=True,band=True,handles=True,study=False):
 # front elevation: exact nominal centres, width 800, height 2000
 def xy(x,y):return(cx+x*s,base-y*s)
 color=INK if TECH else ('#b7cd93'if study and skin else '#b0804e'if skin else '#7eb6c9');width=(95 if skin else 25.4)*s
 path([xy(0,50),xy(0,1340)],width,color)
 pts=[]
 for i in range(81):
  t=-math.pi/2+math.pi*i/80;pts.append(xy(350*math.sin(t),1340+610*(1-math.cos(t))))
 path(pts,width,INK if TECH else ('#e4bc8e'if study else color))
 for sg in ([-1,1]if handles else []):path([xy(sg*15,1275),xy(sg*170,1270),xy(sg*215,1225),xy(sg*215,1055),xy(sg*150,1010),xy(sg*15,1010)],max(1,25.4*s),INK if TECH else '#d3b1dd');path([xy(sg*215,1075),xy(sg*215,1215)],40*s,INK if TECH else '#514942')
 if foot:line(xy(-100,80),xy(100,80),max(2,18*s),INK if TECH else '#e4bd88')
 if band:path([xy(-350,1860),xy(-70,1730),xy(70,1730),xy(350,1860)],max(1.5,25*s),INK if TECH else '#b85f54')
 if skin and not TECH:
  for y in [280,650,940]:path([xy(-15,y-45),xy(-23,y),xy(-12,y+48)],.7,'#d6b387')
def heading(title,sub):
 global PAGE
 if PAGE:C.showPage()
 PAGE+=1;C.setFillColor(HexColor(BG));C.rect(0,0,1000*mm,700*mm,fill=1,stroke=0);txt(28,30,'QUELEC / TALLER DE OBJETOS',24,'M');txt(972,30,('BLUEPRINTS'if TECH else'GUÍA VISUAL')+f' / C01 / {PAGE} DE 2',24,'M',align='right');txt(28,70,title,53,'Q');para(28,94,944,sub,25);line((28,116),(972,116),.5);line((28,665),(972,665),.5);txt(28,686,'1000 × 700 mm / C01 / 24.10.2026 / estudio para prototipo / cotas en mm',23);txt(972,686,('B'if TECH else'G')+f'-{PAGE:02}',23,'M',align='right')
def panel(x,y,w,h,title):rect(x,y,w,h);txt(x+12,y+22,title,29,'M')
def begin(name,tech):
 global C,PAGE,TECH,BG,INK,LINE,FILE
 TECH=tech;PAGE=0;FILE=name;BG,INK,LINE=('#123a6d','#ffffff','#7796ba')if TECH else('#f4f0e7','#243c47','#b8c9c6');C=canvas.Canvas(str(OUT/name),pagesize=(1000*mm,700*mm));C.setTitle('Quelec / Cauchera C01 / '+('Planos técnicos'if TECH else'Guía visual')+' / 2 pliegos100×70cm');C.setAuthor('Quelec / Taller de objetos')

def technical():
 heading('Una horqueta en U, de dos metros.','Núcleo continuo, apariencia blanda de rama y dos manos bajo la U. Selección preliminar; no capacidad de lanzamiento validada.')
 panel(28,130,400,515,'FORMA Y MEDIDAS NOMINALES')
 branch(210,610,.205);dim((108,195),(108,605),'2000',True);dim((128,180),(292,180),'800');txt(325,233,'C05',25,'M');line((319,235),(278,260));txt(306,377,'C02',25,'M');line((304,379),(253,384));txt(271,480,'C04',25,'M');line((266,477),(213,477));txt(278,590,'C03',25,'M');line((271,586),(230,594));txt(52,632,'Frente / esquema a escala gráfica 1:4,88',23)
 panel(444,130,528,250,'C01 + C02 / METAL Y MANOS')
 para(458,177,497,'Vena recta: Ø exterior real 25,4 × pared 1,5. Longitud de eje: 1290. U: ancho entre centros 700; raíz a 1340 y puntas a 1950. Desarrollo aproximado de eje: 1536.',26)
 para(458,244,497,'Dos asas cerradas bajo la horqueta. Centros de mano: ±215 respecto al eje; zona de mano entre 1075 y 1215 de alto. Acolchar a Ø40 aproximado. Sin extremos de tubo expuestos.',26)
 para(458,315,497,'El taller define el curvado, las uniones y su comprobación a partir de la tracción real. No sustituir por PVC o tubo cortinero sin revisión.',25)
 panel(444,395,528,250,'C03 / APOYO DESMONTABLE')
 para(458,443,300,'Apoyo 200 × 120; cota superior aproximada 90 sobre el escenario. Brazo y diagonal al núcleo, mediante dos abrazaderas bipartidas de taller.',25)
 para(458,512,300,'Placa de estudio de acero de 2 mm, antideslizante y cantos blandos. Fijaciones y carga: pendientes del prototipo. No es un escalón para subirse.',25)
 # side profile of foot, 1:2, trunk + diagonal + plate
 path([(833,470),(833,600)],4);path([(833,527),(880,584),(833,584)],3);line((868,584),(917,584),5);dim((858,614),(918,614),'120');txt(856,632,'Perfil / apoyo bajo',23)
 heading('Capas, montaje y comprobaciones.','La espuma construye la forma; asas y apoyo se unen al núcleo. El elástico se seleccionará después de definir las bolas.')
 panel(28,130,455,285,'C04 + C05 / UNA LÁMINA DE ESPUMA')
 # stock map 1:8
 x,y,w,h=49,178,125,250;h=220;s=.11;rect(x,y,1000*s,2000*s)
 blanks=[('U-A',5,5,800,720),('U-B',5,730,800,720),('M-A1',5,1460,650,100),('M-A2',5,1570,690,100),('M-B1',5,1680,690,100),('M-B2',5,1790,650,100)]
 for code,bx,by,bw,bh in blanks:
  rect(x+bx*s,y+by*s,bw*s,bh*s);txt(x+bx*s+4,y+by*s+min(bh*s-2,15),code,22)
 txt(185,188,'1000 × 2000 × 50',26,'M');para(185,210,282,'PU flexible: una lámina nominal. Confirmar espesor y densidad con el proveedor.',25);para(185,256,282,'2 blancos U: 800 × 720 × 50. Mango: 2 de 100 × 650 y 2 de 100 × 690 × 50.',25);para(185,312,282,'Son blancos para tallar. Alternar juntas del mango blando entre caras; el núcleo metálico no se corta en esas juntas.',25);para(185,371,282,'Acabado exterior irregular: Ø80–100.',25)
 panel(500,130,472,285,'ORDEN DE TRABAJO / CINCO PASOS')
 y=177
 for n,s in enumerate(['Presentar núcleo y U en plantilla a tamaño real.','Unir asas y apoyo; comprobar manos y pie.','Tallado de espuma flexible, sin bordes duros.','Tela fina, pintura flexible y remates blandos.','Inspección, pesaje y ensayo con el elenco.'],1):y=para(514,y,442,f'{n}. {s}',26)+7
 panel(28,432,455,213,'C06 / ELÁSTICO PENDIENTE')
 para(42,478,425,'Solicitud: 2,5 m de estiramiento y poca rigidez. Confirmar si son recorrido o longitud total estirada. Faltan masa, material y distancia escénica de las bolas.',26)
 para(42,550,425,'Los TDR mencionan bolas luminosas de 50 cm. Este juego no define sección del elástico, fuerza, anclajes ni lanzamiento. La animación solo muestra espacio.',25)
 panel(500,432,472,213,'ANTES DE USAR EN ESCENA')
 para(514,478,442,'Revisar núcleo y uniones antes de forrar. Conservar accesos de servicio. Ensayar pie, manos y transporte horizontal de 200 × 80 cm en la nave, sin el módulo del pie.',25)
 para(514,550,442,f'Masa de planeación con reserva 15%: {D["massBudget"]["withReserve15Kg"]:.1f} kg. No es pesaje ni resistencia acreditada. Los TDR piden revisión por profesional idóneo de la cauchera.',25)

def guide():
 heading('Una rama gigante, por capas.','Esta guía explica el objeto de estudio C01. Cada color corresponde a un conjunto del visor; el acabado final es color rama.')
 panel(28,130,300,515,'1 / EL CORAZÓN')
 branch(179,550,.16,False,False,False,handles=False);para(44,586,268,'Primero se presenta el metal. Una vara recta sostiene una U; el taller comprueba las uniones.',28)
 panel(350,130,300,515,'2 / DÓNDE SE SUJETA')
 branch(500,550,.16,False,True,False);para(366,586,268,'Dos manos toman las asas acolchadas. El pie ayuda a posicionar desde abajo. No subirse al apoyo.',28)
 panel(672,130,300,515,'3 / DARLE VOLUMEN')
 branch(822,550,.16,True,False,False,study=True);para(688,586,268,'La espuma flexible hace la rama de 8–10 cm. Se talla irregular y se dejan las puntas redondas.',28)
 heading('Acabar, probar y guardar.','La forma, las manos y el transporte se comprueban antes de resolver el juego del lanzamiento.')
 panel(28,130,360,515,'4 / PARECE UNA RAMA')
 branch(205,552,.165,True,True,True);para(44,586,328,'Tela fina y pintura flexible mate. Vetas suaves y tonos cálidos; nada de una costra rígida sobre la espuma.',28)
 panel(410,130,562,230,'5 / HACER LA PRUEBA COMPLETA')
 para(426,180,530,'Una persona sostiene y otra hace el gesto. Antes de elegir el elástico hay que saber cuánto pesa cada bola, de qué está hecha y a qué distancia está el barco.',29)
 para(426,265,530,'El visor no muestra una bola en vuelo: el deslizador solo ayuda a reservar el espacio del gesto.',28)
 panel(410,377,562,268,'GUARDARLA Y ENTRAR EN LA NAVE')
 para(426,425,530,'Retirar el módulo del pie. Recoger el elástico. Acostar la rama: conserva los 2 m de largo y 80 cm de ancho. Probar el paso con los cuatro gruñones y su vestuario.',28)
 para(426,510,530,'Después de cada ensayo: mirar metal, acolchados y remates. La tela debe poder abrirse junto a las uniones para revisarlas.',28)
 para(426,588,530,'Los planos técnicos acompañan estas instrucciones. Este primer diseño necesita una prueba de taller antes de fabricar la versión de escena.',26)

for name,tech,fn in [('Cauchera-Blueprints-C01-2-pliegos-100x70.pdf',True,technical),('Cauchera-Guia-visual-C01-2-pliegos-100x70.pdf',False,guide)]:
 begin(name,tech);fn();C.save();shutil.copyfile(OUT/name,P/'downloads'/('Blueprints-C01.pdf'if tech else'Guia-visual-C01.pdf'))
(TMP/'layout.json').write_text(json.dumps(CHECK,ensure_ascii=False,indent=2));print('Dos juegos C01 creados: 2 + 2 pliegos de100×70cm.')
