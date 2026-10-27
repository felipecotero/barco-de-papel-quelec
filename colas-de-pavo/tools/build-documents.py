"""CP03: two study sheets and two plain-language prototype sheets, 1000 x 700 mm."""
from pathlib import Path
from math import sin,cos,sqrt,pi
import json
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
P=Path(__file__).resolve().parents[1];O=P/'downloads';O.mkdir(exist_ok=True)
D=json.loads((P/'model.json').read_text());C=D['defaults'];mm=72/25.4;W,H=1000*mm,700*mm
for name,file in [('Arial','Arial.ttf'),('Arial-Bold','Arial Bold.ttf')]:pdfmetrics.registerFont(TTFont(name,'/System/Library/Fonts/Supplemental/'+file))
BLUE='#103657';WHITE='#edf6ff';MUTE='#a9c9dd';GOLD='#f1d08c';INK='#203a3d';PAPER='#eee9db';LILA='#b398ce';GREEN='#80bbaa';RED='#cf8268';WOOD='#ceb390'
# Keep the published documents reproducible without any temporary dependency.
G=D.get('nominalMetrics',{})
# The underlying ellipse is widened so its truncated +/-45-degree outline has the stated width.
rise=C['riseM'];half=C['widthM']/2;ang=C['spreadDeg']*pi/360
edge_y=half/max(1e-9, sin(ang)/cos(ang));ellipse_a=half/sqrt(1-(edge_y/rise)**2)
def r_of(t):return 1/sqrt(sin(t)**2/ellipse_a**2+cos(t)**2/rise**2)
ths=[t*pi/180 for t in D['studyGeometry']['veinAnglesDeg']]
lengths=[r_of(t)for t in ths]
PROJ_LENGTHS=list(lengths)
# Gross envelope only; final geometry supplies sampled scallops. No ventilation force credit.
rawpts=[(r_of(-ang+2*ang*i/720)*sin(-ang+2*ang*i/720),r_of(-ang+2*ang*i/720)*cos(-ang+2*ang*i/720))for i in range(721)]
def polygon_metrics(pts):
 q=[(0,0)]+pts+[(0,0)];a=cy=0
 for (x,y),(xx,yy)in zip(q,q[1:]):cross=x*yy-xx*y;a+=cross;cy+=(y+yy)*cross
 return abs(a/2),cy/(3*a)
fallarea,fallcy=polygon_metrics(rawpts)
AREA=G.get('envelopeAreaM2',fallarea);SKIN=G.get('skinAreaM2',AREA*.88);CP=G.get('cpAbovePivotM',fallcy)
if isinstance(G.get('rodLengthsM'),list) and len(G['rodLengthsM'])==6:lengths=G['rodLengthsM']
if isinstance(G.get('rodProjectedLengthsM'),list) and len(G['rodProjectedLengthsM'])==6:PROJ_LENGTHS=G['rodProjectedLengthsM']
def n(x,k=2):return f'{x:.{k}f}'.replace('.',',')
def text(c,s,x,y,size=24,color=WHITE,bold=False,align='left'):
 c.setFont('Arial-Bold'if bold else'Arial',size);c.setFillColor(HexColor(color));fn=c.drawString if align=='left'else c.drawRightString if align=='right'else c.drawCentredString;fn(x*mm,H-y*mm,s)
def line(c,x,y,xx,yy,color=WHITE,width=1):c.setStrokeColor(HexColor(color));c.setLineWidth(width);c.line(x*mm,H-y*mm,xx*mm,H-yy*mm)
def rect(c,x,y,w,h,fill=None,stroke=WHITE,width=1):
 c.setStrokeColor(HexColor(stroke));c.setLineWidth(width)
 if fill:c.setFillColor(HexColor(fill))
 c.rect(x*mm,H-(y+h)*mm,w*mm,h*mm,stroke=1,fill=int(fill is not None))
def circle(c,x,y,r,fill=None,color=WHITE):
 c.setStrokeColor(HexColor(color));c.setLineWidth(1)
 if fill:c.setFillColor(HexColor(fill))
 c.circle(x*mm,H-y*mm,r*mm,stroke=1,fill=int(fill is not None))
def path(c,pts,stroke=WHITE,fill=None,width=1,close=False):
 p=c.beginPath();p.moveTo(pts[0][0]*mm,H-pts[0][1]*mm)
 for x,y in pts[1:]:p.lineTo(x*mm,H-y*mm)
 if close:p.close()
 c.setStrokeColor(HexColor(stroke));c.setLineWidth(width)
 if fill:c.setFillColor(HexColor(fill))
 c.drawPath(p,stroke=1,fill=int(fill is not None))
def para(c,s,x,y,w,size=25,color=WHITE,lead=12,bold=False):
 font='Arial-Bold'if bold else'Arial';row='';rows=[]
 for word in s.split():
  test=(row+' '+word).strip()
  if row and pdfmetrics.stringWidth(test,font,size)>w*mm:rows.append(row);row=word
  else:row=test
 if row:rows.append(row)
 for a in rows:text(c,a,x,y,size,color,bold);y+=lead
 return y

def bullet(c,head,s,x,y,w,color=WHITE,size=25):
 text(c,head,x,y,size,color,True);return para(c,s,x,y+13,w,size,color,11)+9

def dim(c,x,y,xx,yy,label,color=WHITE,dx=0,dy=0,size=23):
 line(c,x,y,xx,yy,color,.7)
 for a,b in [(x,y),(xx,yy)]:line(c,a-2,b+2,a+2,b-2,color,.8)
 text(c,label,(x+xx)/2+dx,(y+yy)/2+dy,size,color,align='center')
def arrow(c,x,y,xx,yy,color=GOLD,width=2):
 line(c,x,y,xx,yy,color,width);dx=xx-x;dy=yy-y;l=sqrt(dx*dx+dy*dy)or 1;ux=dx/l;uy=dy/l
 line(c,xx,yy,xx-ux*6-uy*3,yy-uy*6+ux*3,color,width);line(c,xx,yy,xx-ux*6+uy*3,yy-uy*6-ux*3,color,width)
def header(c,title,sub,page,technical=True):
 bg=BLUE if technical else PAPER;col=WHITE if technical else INK
 c.setFillColor(HexColor(bg));c.rect(0,0,W,H,stroke=0,fill=1)
 if technical:
  c.setStrokeColor(Color(.5,.8,1,alpha=.055));c.setLineWidth(.25)
  for x in range(0,1001,20):c.line(x*mm,0,x*mm,H)
  for y in range(0,701,20):c.line(0,y*mm,W,y*mm)
 text(c,'QUELEC / TALLER DE OBJETOS / COLAS DE PAVO / CP03',30,29,22,col,True)
 text(c,title,30,62,52,col,True);text(c,sub,30,85,25,col);line(c,30,103,970,103,col)
 text(c,'ESTUDIO PARA PROTOTIPO - 27 OCT 2026 - PLIEGO 1000 x 700 MM',30,680,18,col)
 text(c,f'{page} / 2',970,680,20,col,align='right')

def human(c,x,ground,scale,color=WHITE):
 # Measurement figure, not an anatomical layout or body-size prescription.
 h=1.7*scale;head=.105*scale
 circle(c,x,ground-h+head,head,None,color)
 neck=ground-h+2*head;hip=ground-.83*scale;shoulder=ground-1.42*scale
 path(c,[(x,neck),(x,hip)],color,width=2)
 path(c,[(x-.17*scale,shoulder),(x+.17*scale,shoulder)],color,width=2)
 path(c,[(x-.17*scale,shoulder),(x-.21*scale,ground-.93*scale)],color,width=2)
 path(c,[(x+.17*scale,shoulder),(x+.21*scale,ground-.93*scale)],color,width=2)
 for s in[-1,1]:path(c,[(x,hip),(x+s*.10*scale,ground-.40*scale),(x+s*.11*scale,ground)],color,width=2)

def fan(c,x,pivot_y,k=50,opening=1,color=WHITE,fill=None,rods=True,pattern=False):
 raw=D['studyGeometry'].get('restContourRelativeM')
 if not raw:raw=[(r_of(-ang+2*ang*i/360)*sin(-ang+2*ang*i/360),r_of(-ang+2*ang*i/360)*cos(-ang+2*ang*i/360),0)for i in range(361)]
 points=[]
 from math import atan2
 for px,py,*_ in raw:
  theta=atan2(px,py)*opening;radius=sqrt(px*px+py*py);points.append((x+radius*sin(theta)*k,pivot_y-radius*cos(theta)*k))
 path(c,[(x,pivot_y)]+points+[(x,pivot_y)],color,fill,.9,True)
 if rods:
  for original,L in zip(ths,PROJ_LENGTHS):
   t=original*opening;line(c,x,pivot_y,x+L*sin(t)*k,pivot_y-L*cos(t)*k,GOLD if color==WHITE else GREEN,1.5)
 if pattern:
  for i in range(70):
   original=ths[(i*7)%len(ths)] + .025*sin(i*2.1);u=.28+.60*((i*23)%71)/71;radius=r_of(original)*u
   px=x+radius*sin(original*opening)*k;py=pivot_y-radius*cos(original*opening)*k
   circle(c,px,py,.7+(i%3)*.4,'#69457f' if fill==LILA else '#9e3e55',color)
 circle(c,x,pivot_y,2.4,GOLD,color)

def mech(c,x,y,k=1,col=WHITE):
 # Exploded schematic: pad -> load plate -> cassette / radial stack -> guarded axle end.
 rect(c,x,y,20*k,72*k,'#536e7c',col)
 rect(c,x+32*k,y+6*k,10*k,60*k,GREEN,col)
 rect(c,x+66*k,y+12*k,8*k,48*k,None,col)
 line(c,x+12*k,y+36*k,x+184*k,y+36*k,GOLD,2)
 for i in range(6):
  xx=x+(86+i*12)*k;rect(c,xx,y+20*k,4*k,32*k,WOOD,col)
  line(c,xx+2*k,y+20*k,xx+(i-2.5)*5*k,y-30*k,col,1.1)
 rect(c,x+166*k,y+12*k,8*k,48*k,None,col)
 rect(c,x+184*k,y+20*k,9*k,32*k,GOLD,col)
 text(c,'BAS',x+8*k,y+88*k,21,col,align='center');text(c,'ARN',x+38*k,y+88*k,21,col,align='center');text(c,'EJE / separadores / 6 venas',x+115*k,y+102*k,21,col,align='center')

def latch(c,x,y,open_state,col=WHITE,k=1):
 # One clear geometric hook held closed; separate stop/pin at the open limit.
 rect(c,x,y,64*k,42*k,None,col)
 circle(c,x+16*k,y+21*k,5*k,None,col)
 path(c,[(x+16*k,y+21*k),(x+40*k,y+14*k),(x+45*k,y+21*k),(x+36*k,y+28*k)],RED,width=3)
 line(c,x+40*k,y+14*k,x+(57 if open_state else 43)*k,y+(3 if open_state else 11)*k,RED,2)
 circle(c,x+50*k,y+24*k,6*k,None,col)
 if open_state:arrow(c,x+44*k,y+10*k,x+63*k,y-8*k,RED)

def retainer(c,x,y,col=WHITE,k=1):
 rect(c,x,y,55*k,26*k,None,col);circle(c,x+10*k,y+19*k,3*k,None,col)
 line(c,x+10*k,y+19*k,x+44*k,y+4*k,GREEN,3)
 rect(c,x+40*k,y+2*k,9*k,15*k,GREEN,col)
 line(c,x+44.5*k,y-5*k,x+44.5*k,y+17*k,GOLD,3);circle(c,x+44.5*k,y-5*k,3*k,GOLD,col)

def references(c):
 labels=[('NASA / viento','https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/drag-equation/'),('MIT / viga equivalente','https://ocw.mit.edu/courses/1-050-solid-mechanics-fall-2004/fd4eff39aec922b8c07660006f40686e_pset04_11.pdf'),('ShowTex / tejido','https://www.showtex.com/en/products/soft-goods/backdrops-ceilings/printables-lasercut/voile-cs-print'),('RBTR / malla y tafetán','https://ripstopbytheroll.com/products/0-5-oz-ns50-noseeum-mesh'),('Mylar / película','https://mylar.com/wp-content/uploads/2025/08/mylar_a_12-75_micron_made_in_usa-1.pdf')]
 for i,(label,url)in enumerate(labels):
  x=30+i*188;text(c,label,x,661,17,MUTE)
  c.linkURL(url,(x*mm,H-664*mm,(x+175)*mm,H-653*mm),relative=0,thickness=0)

def tech_one(c):
 header(c,'Cinco abanicos dorsales, una cola de prueba','Curva de reposo, membrana libre y cesión elástica suave de estudio. Cotas propuestas.',1)
 line(c,480,117,480,650,MUTE,.7)
 x=195;k=60;floor=626;py=floor-C['pivotHeightM']*k
 fan(c,x,py,k,color=WHITE);human(c,x,floor,k,MUTE);line(c,40,floor,465,floor,MUTE)
 text(c,'ALZADO / TELA 90° / VENAS 75°',195,131,25,WHITE,True,'center')
 dim(c,39,floor,39,floor-(rise+C['pivotHeightM'])*k,'6,05 m*',dx=0,dy=-7,color=GOLD,size=22)
 dim(c,353,py,353,py-rise*k,'5,00 m',dy=-8,color=GOLD,size=22)
 dim(c,x-half*k,646,x+half*k,646,'4,80 m propuestos',color=WHITE)
 text(c,'L1 / pivote',x+12,py+6,22,GOLD,True);text(c,'45°',x-40,py-45,22,GOLD);text(c,'45°',x+32,py-45,22,GOLD)
 para(c,'* L1 a 1,05 m y figura de 1,70 m son referencias. Medir en cada intérprete; 6,05 m es la altura total derivada.',45,155,315,21,MUTE,10)
 text(c,'Oro: seis venas. Blanco: borde textil.',45,190,20,GOLD)
 # Actual representative vein at theta=-7.5 degrees. There is no centre vein.
 text(c,'PERFIL',414,131,24,WHITE,True,'center')
 para(c,'Vena más alta a -7,5°. Curva de reposo hacia +Z.',382,155,88,20,MUTE,9)
 profile=D['studyGeometry']['representativeVeinPolyline'];px=393;basez=profile[0][2]
 points=[(px+(q[2]-basez)*k,floor-q[1]*k)for q in profile]
 path(c,points,GOLD,width=2)
 # Illustrative small-load equivalent-beam response, distinct from the permanent curve.
 f=.5*.9*3*3*1.28*AREA;L=max(lengths);delta=(f/6)*L**3/(8*1000)
 ghost=[]
 for i,q in enumerate(profile):
  t=i/(len(profile)-1);g=t*t*(6-4*t+t*t)/3
  ghost.append((px+(q[2]-basez+delta*g)*k,floor-q[1]*k))
 c.saveState();c.setDash(3,2);path(c,ghost,GREEN,width=1.4);c.restoreState()
 tx=px+C['backCurveM']*k;ty=py-rise*k
 line(c,points[-1][0],points[-1][1],tx,ty,WHITE,1.3);circle(c,tx,ty,1.4,WHITE,WHITE)
 human(c,px-7,floor,k,MUTE)
 dim(c,px,245,px+C['backCurveM']*k,245,'0,35 m*',dy=-5,color=GOLD,size=19)
 text(c,'Tela libre',tx+7,ty-3,18,WHITE)
 text(c,'Vena',points[-1][0]+7,points[-1][1]+5,18,GOLD)
 para(c,'* Curva posterior: 35 cm propuestos. Sobrante: 25 cm de patrón, dentro de los 5 m finales.',382,184,88,18,MUTE,8)
 text(c,'Trazo verde: cesión de ejemplo a 3 m/s, EI supuesto.',45,225,19,GREEN)
 y=130;y=bullet(c,'CONFIRMADO POR EL USUARIO','5 colas. L1 y 5 m hasta la punta final de tela, incluido el sobrante. Seis venas curvas con rigidez y pequeña cesión; la membrana se mueve con mayor libertad.',510,y,450,size=27)
 y=bullet(c,'GEOMETRÍA PROPUESTA','Ancho 4,80 m. Centros cada 15°: cinco intervalos suman 75°. Tela de 90°, bordes libres de 7,5° por lado y sin vena central. Curva de reposo posterior y punta textil libre.',510,y,450,size=26)
 y=bullet(c,'DOS ÁREAS CON FUNCIONES DISTINTAS',f'Aref frontal proyectada XY: {n(AREA)} m² para viento. Piel real curva 3D: {n(SKIN)} m² para masa, sin huecos. Las áreas corresponden a la forma nominal sin viento.',510,y,450,size=26)
 text(c,'VAR / LONGITUDES DE ARCO EN REPOSO',510,y,25,WHITE,True);y+=15
 halfs=lengths[:3]
 para(c,'Vena exterior a la más próxima al centro: '+ ' / '.join(n(v)for v in halfs)+' m; la otra mitad es simétrica. No hay vena en 0°. Son recorridos de arco, no largos de corte aprobados.',510,y,450,24,WHITE,11)
 text(c,'Centros: -37,5° / -22,5° / -7,5° / +7,5° / +22,5° / +37,5°',510,y+35,21,MUTE);y+=54
 text(c,'MEM / MUESTRAS A COMPARAR',510,y,27,WHITE,True);y+=16
 for title,gsm,note in [('Voile CS Print',50,'Tejido de impresión; sublimación solo versión imprimible de 3 m.'),('NS50 malla',16.95,'Nylon muy ligero; impresión del arte por comprobar.'),('MEMBRANE 10 tafetán',22.4,'Calandrado y DWR; la ficha lo describe resistente al viento. Impresión por comprobar.'),('Mylar A 12 µm',17.013,'Película PET; gramaje derivado de ficha. Impresión por comprobar.')]:
  text(c,title,510,y,24,GOLD,True);text(c,f'{n(gsm)} g/m²',960,y,24,WHITE,align='right');y=para(c,note,510,y+12,450,22,WHITE,10)+9
 para(c,'Masa neta de piel = área real 3D × gramaje. No incluye venas, arnés, herrajes, mangas, tinta ni remates. No hay peso total aprobado.',510,630,450,22,GOLD,10)
 c.showPage()

def tech_two(c):
 header(c,'Gancho, retén y viento: funciones distintas','Mecanismo conceptual ampliado, sin escala. Detallar y ensayar antes de fabricar la serie.',2)
 for xx in[350,665]:line(c,xx,118,xx,648,MUTE,.7)
 text(c,'A / CARGA Y MECANISMO',30,133,29,WHITE,True);mech(c,48,175,1.35)
 para(c,'ARN recibe la carga; BAS da apoyo acolchado. EJE sujeta las raíces de seis venas curvas y permite abrir. La cubierta protege el giro. Casete, eje y anclajes: pendientes.',30,335,295,26,WHITE,12)
 text(c,'GAN / SOLO MANTIENE CERRADO',30,420,25,WHITE,True);latch(c,55,444,False,k=1.1);arrow(c,180,465,225,465,RED);latch(c,243,444,True,k=1.1)
 para(c,'El gancho cautivo se retira con un tirador. Libera una asistencia de apertura amortiguada por definir; no se asigna fuerza de resorte en este estudio.',30,518,295,25,WHITE,12)
 text(c,'RET / MANTIENE ABIERTO',30,574,25,GOLD,True);retainer(c,45,595)
 para(c,'Retén independiente y topes de abierto. Se recoge y rearma fuera de escena; sin sostener una palanca.',124,595,200,24,GOLD,11)
 text(c,'B / PIEL Y RIGIDEZ',375,133,29,WHITE,True)
 for i in range(3):
  xx=395+i*75
  path(c,[(xx,270),(xx-20,190),(xx+22,182)],WHITE,'#415d71',1,True)
  line(c,xx,270,xx-20,190,GOLD,3);circle(c,xx-20,190,3,WHITE,WHITE)
 text(c,'Mangas / remates / bordes textiles libres',375,294,22,WHITE)
 para(c,'Piel inicial continua: 0 % de huecos. Mangas y refuerzos unen los paños a las venas; no atornillar la tela directamente. La piel ondula más; las venas ceden poco y recuperan.',375,320,265,24,WHITE,11)
 text(c,'VIGA EQUIVALENTE / EXPLORACIÓN',375,413,24,GOLD,True)
 text(c,'δpunta = Fi L³ / (8 EI)',375,441,29,GOLD,True)
 para(c,'Fi = F/6 supone reparto uniforme. EI = 1000 N·m² es un valor editable de estudio, no de fabricante. L es el arco de la vena usado como viga recta equivalente; no resuelve una viga curva real.',375,468,265,23,WHITE,11)
 para(c,'La pantalla limita la cesión visible a 8 % de L; no es un tope físico. Una δ calculada >10 % de L señala la salida del supuesto lineal, no un límite seguro de uso.',375,556,265,23,WHITE,11)
 text(c,'C / ESTUDIO DE VIENTO',690,133,29,WHITE,True)
 text(c,'F = ½ ρ V² Cd Aref',690,164,35,GOLD,True)
 para(c,'Aref: envolvente proyectada XY, sin descontar huecos. ρ = 0,90 kg/m³ y Cd = 1,28 son supuestos; Cd toma una placa plana NASA como referencia, no esta piel curva.',690,191,280,25,WHITE,12)
 para(c,'Para viento horizontal: Msuelo = F × altura CP. Mpivote = F × distancia vertical CP-L1. El CP mostrado es centro geométrico, no un resultado de CFD.',690,278,280,25,WHITE,12)
 text(c,'EJEMPLOS FRONTALES / SIN RÁFAGA',690,369,24,WHITE,True)
 text(c,'Viento',690,390,22,MUTE,True);text(c,'Fuerza',812,390,22,MUTE,True);text(c,'Momento suelo',970,390,22,MUTE,True,'right')
 for i,v in enumerate([3,5,10]):
  y=411+i*25;f=.5*.9*v*v*1.28*AREA;mom=f*(CP+C['pivotHeightM']);line(c,690,y+8,970,y+8,MUTE,.4);text(c,f'{v} m/s',690,y,24,WHITE);text(c,f'{n(f,0)} N',812,y,24,WHITE);text(c,f'{n(mom,0)} N·m',970,y,24,WHITE,align='right')
 para(c,'Si V se duplica, la fuerza calculada se cuadruplica. Barrido Cd 0,8-1,8: sensibilidad a supuestos, no intervalo de confianza. Las ráfagas se estudian por separado.',690,506,280,24,WHITE,11)
 para(c,'No se obtiene aquí equilibrio humano, capacidad estructural ni límite seguro de viento. La ligereza reduce peso propio; no garantiza poca carga aerodinámica.',690,595,280,24,GOLD,11)
 references(c)
 c.showPage()

def card(c,x,y,w,h,num,title):
 rect(c,x,y,w,h,'#f8f4e8','#9caaa0',.65);text(c,str(num),x+17,y+28,45,RED,True);text(c,title,x+48,y+27,33,INK,True)

def guide_one(c):
 header(c,'Arma primero una cola de prueba','Cinco colas finales. Una muestra completa decide materiales, mecanismo, medidas y peso.',1,False)
 for args in [(30,122,455,250,1,'Mide y presenta el arnés'),(515,122,455,250,2,'Prepara la columna del abanico'),(30,392,455,250,3,'Prueba las pieles pequeñas'),(515,392,455,250,4,'Une paños y nervaduras')]:card(c,*args)
 human(c,110,341,86,INK);rect(c,94,244,32,20,GREEN,INK);line(c,94,254,126,254,GOLD,3)
 para(c,'Localiza L1 sobre cada intérprete. Ajusta soporte acolchado, cintura, pecho y tirantes. El pivote usa esa referencia; el arnés distribuye el contacto.',180,188,280,28,INK,14)
 para(c,'5 m arriba de la cintura. Ancho 4,80 m propuesto. Mide a la persona; 6,05 m de alto total solo corresponde al ejemplo del visor.',180,292,280,25,INK,12)
 mech(c,542,201,.9,INK)
 para(c,'Primero un casete de prueba: eje, separadores para seis venas, apoyos, topes y cubierta. Las venas tienen una curva de reposo hacia atrás; con viento ceden un poco y recuperan.',747,188,200,26,INK,13)
 para(c,'Hay tres longitudes de arco y su simetría, sin vena central. Los 5 m incluyen la tela libre superior: no sumar 25 cm. Secciones y cortes se resuelven en el prototipo.',747,293,200,25,INK,12)
 for i,(col,title)in enumerate([(LILA,'Voile'),('#a8c9b7','Malla'),('#c7bd9a','Tafetán'),('#cdd4cf','Película')]):
  rect(c,50+i*36,463,29,77,col,INK);text(c,title,64.5+i*36,559,18,INK,align='center')
 para(c,'Estampa una muestra. Compara luz, movimiento, hinchado, ruido y remates. Pesa un área conocida y prueba la unión a una manga. La película y la malla requieren comprobar el sistema de impresión.',208,458,250,27,INK,13)
 para(c,'Guarda nombre, gramaje y resultado de cada muestra. El material más ligero no siempre deja pasar más aire.',208,578,250,24,INK,11)
 for i in range(3):
  xx=545+i*49;path(c,[(xx+28,581),(xx+2,459),(xx+37,454)],INK,LILA,1,True);line(c,xx+28,581,xx+2,459,GREEN,3)
 para(c,'Remata siete paños: cinco entre venas y dos laterales. Une la piel con mangas y refuerzos, dejando sobrante textil arriba. Los anclajes de tela acompañan la pequeña cesión de las venas.',728,458,215,27,INK,13)
 para(c,'El punto de partida es continuo. La tela y sus bordes se mueven más; las venas curvas mantienen rigidez y ceden de forma suave.',728,581,215,24,INK,11)
 c.showPage()

def guide_two(c):
 header(c,'Soltar una vez, permanecer abierto','Operación del efecto y pruebas antes de producir las otras cuatro.',2,False)
 for args in [(30,122,455,250,5,'Distingue los dos retenes'),(515,122,455,250,6,'Ensaya la secuencia'),(30,392,455,250,7,'Mira y mide el viento'),(515,392,455,250,8,'Registra y repite la serie')]:card(c,*args)
 latch(c,55,198,False,INK,1.15);text(c,'GAN',91,271,25,RED,True,'center');retainer(c,59,292,INK,1.1);text(c,'RET',92,336,25,INK,True,'center')
 para(c,'GAN mantiene cerrado. Al tirar de su gancho cautivo se libera la apertura controlada. RET es otro elemento: toma el tope y mantiene abierto sin esfuerzo continuo.',175,185,280,28,INK,14)
 para(c,'Asistencia, amortiguador, topes y retén se eligen y prueban juntos. No se fija aquí una fuerza de resorte.',175,303,280,24,INK,11)
 for i,opening in enumerate([.07,.48,1]):
  xx=566+i*125;fan(c,xx,286,22,opening,INK,LILA if i==2 else None,pattern=i==2);text(c,['Cerrada','Soltar','Abierta'][i],xx,322,23,INK,True,'center')
 para(c,'Entra cerrada. Retira el gancho. Abre con recorrido amortiguado y queda retenida: tela 90°, venas extremas 75°. Se rearma fuera de escena.',540,342,405,23,INK,11)
 # Separate graphics of membrane motion and force, no automatic performer lean.
 fan(c,108,583,22,1,INK,LILA);arrow(c,56,475,160,475,RED,3)
 para(c,'Cambia velocidad, dirección, ráfaga y rigidez de estudio. La tela se mueve libremente; las venas ceden poco, sobre todo en puntas y las más largas, y recuperan. No se predice el equilibrio del intérprete.',200,458,255,27,INK,13)
 para(c,'El ensayo físico debe medir cargas y comprobar el conjunto. No elegir un límite de uso mirando solo la animación.',200,579,255,25,INK,12)
 text(c,'1',545,470,27,GREEN,True);text(c,'2',545,512,27,GREEN,True);text(c,'3',545,554,27,GREEN,True);text(c,'4',545,596,27,GREEN,True)
 para(c,'Anota medidas de los cinco intérpretes y ajustes de arnés.',567,470,375,27,INK,13)
 para(c,'Pesa la cola completa y comprueba apertura, retén y recogida.',567,512,375,27,INK,13)
 para(c,'Comprueba paños, mangas, varas y puntos de giro después del ensayo.',567,554,375,27,INK,13)
 para(c,'Con el prototipo revisado, fabrica las otras cuatro con las mismas piezas y registros.',567,596,375,27,INK,13)
 c.showPage()

def write():
 for name,functions in [('Blueprints-CP03.pdf',[tech_one,tech_two]),('Guia-visual-CP03.pdf',[guide_one,guide_two])]:
  c=canvas.Canvas(str(O/name),pagesize=(W,H));c.setTitle('Quelec - Colas de pavo CP03 - '+('Planos de estudio'if name.startswith('Blueprints')else'Guía de prototipo'));c.setAuthor('Taller Quelec')
  for fn in functions:fn(c)
  c.save();print(name)
 (O/'Colas-de-pavo-CP03-datos.json').write_text((P/'model.json').read_text())
 (O/'LEER-CP03.txt').write_text('CP03 / 27 OCT 2026\nDos PDF de dos pliegos de 1000 x 700 mm cada uno.\nEstudio de geometría, prototipo y operación. No libera fabricación de serie ni fija un límite seguro de viento.\nLa cota confirmada es 5 m por encima de L1. La altura total depende de cada intérprete.\nTela de 90 grados. Seis venas curvas con rigidez y pequeña cesión elástica: centros a -37,5/-22,5/-7,5/+7,5/+22,5/+37,5 grados. Curva posterior propuesta de 35 cm y sobrante de patrón de 25 cm incluido en los 5 m finales.\nFuentes técnicas y materiales: sources.json y materiales-research.json en la sección del visor.\n')
 print('Envolvente',AREA,'m²; piel',SKIN,'m²; centro sobre pivote',CP,'m')
if __name__=='__main__':write()
