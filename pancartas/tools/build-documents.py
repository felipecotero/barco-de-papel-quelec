"""PA04 construction sheets and original approved raster artwork, cropped by PDF clipping only."""
from pathlib import Path
import json,math,html
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor,Color
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
P=Path(__file__).resolve().parents[1];O=P/'downloads';O.mkdir(exist_ok=True);D=json.loads((P/'model.json').read_text());mm=72/25.4;W,H=1000*mm,700*mm
pdfmetrics.registerFont(TTFont('Arial','/System/Library/Fonts/Supplemental/Arial.ttf'));pdfmetrics.registerFont(TTFont('Arial-Bold','/System/Library/Fonts/Supplemental/Arial Bold.ttf'))
INK='#edf5fd';BLUE='#12375a';MUTED='#a9c8dd';GOLD='#efd198';WOOD='#caa77b';GREEN='#89bcac';LIGHT='#f3efdf';DARK='#223b3b'
def txt(c,s,x,y,size=24,color=INK,bold=False,align='left'):
 c.setFillColor(HexColor(color));c.setFont('Arial-Bold' if bold else 'Arial',size);fn=c.drawString if align=='left' else c.drawCentredString if align=='center' else c.drawRightString;fn(x*mm,H-y*mm,s)
def line(c,x,y,x2,y2,color=INK,width=1):
 c.setStrokeColor(HexColor(color));c.setLineWidth(width);c.line(x*mm,H-y*mm,x2*mm,H-y2*mm)
def rect(c,x,y,w,h,fill=None,stroke=INK,width=1):
 c.setLineWidth(width);c.setStrokeColor(HexColor(stroke));
 if fill:c.setFillColor(HexColor(fill))
 c.rect(x*mm,H-(y+h)*mm,w*mm,h*mm,stroke=1,fill=bool(fill))
def circ(c,x,y,r,color=INK,fill=False):
 c.setStrokeColor(HexColor(color));c.setFillColor(HexColor(color));c.circle(x*mm,H-y*mm,r*mm,stroke=1,fill=int(fill))
def para(c,s,x,y,w,size=24,color=INK,leading=11,bold=False):
 font='Arial-Bold' if bold else 'Arial';rows=[];row=''
 for word in s.split():
  v=(row+' '+word).strip()
  if pdfmetrics.stringWidth(v,font,size)>w*mm and row:rows.append(row);row=word
  else:row=v
 if row:rows.append(row)
 for v in rows:txt(c,v,x,y,size,color,bold);y+=leading
 return y
def dim(c,x,y,x2,y2,label,dx=0,dy=0,color=INK,size=22):
 line(c,x,y,x2,y2,color,.8)
 for xx,yy in[(x,y),(x2,y2)]:line(c,xx-2,yy+2,xx+2,yy-2,color,.8)
 txt(c,label,(x+x2)/2+dx,(y+y2)/2+dy,size,color,align='center')
def header(c,title,sub,blue=True):
 c.setFillColor(HexColor(BLUE if blue else '#eae7da'));c.rect(0,0,W,H,stroke=0,fill=1)
 if blue:
  c.setStrokeColor(Color(.6,.8,1,alpha=.065));c.setLineWidth(.25)
  for a in range(0,1001,20):c.line(a*mm,0,a*mm,H)
  for a in range(0,701,20):c.line(0,a*mm,W,a*mm)
 color=INK if blue else DARK
 txt(c,'QUELEC / TALLER DE OBJETOS / PA04',30,29,22,color,True);txt(c,title,30,62,56,color,True);txt(c,sub,30,85,25,color)
 line(c,30,103,970,103,color)
 txt(c,'PROPUESTA CONSTRUCTIVA PA04 - 25 OCT 2026 - COTAS EN MM - PLIEGO 1000 x 700 MM',30,680,18,color);txt(c,'1 / 1',970,680,20,color,align='right')
def face_image(c,face,x,y,w,h,page_h=H):
 # Original pair is embedded unchanged. The PDF viewport selects the approved face.
 crop=face['cropPx'];cx,cy,cw,ch=crop;iw,ih=face['imageSizePx'];sx=w*mm/cw;sy=h*mm/ch
 left=x*mm;bottom=page_h-(y+h)*mm
 c.saveState();p=c.beginPath();p.rect(left,bottom,w*mm,h*mm);c.clipPath(p,stroke=0,fill=0)
 c.drawImage(ImageReader(str(P/face['image'])),left-cx*sx,bottom-(ih-cy-ch)*sy,width=iw*sx,height=ih*sy,mask='auto');c.restoreState()
def dims_value():return D.get('dimensionsMm',{})
def draw_nesting(c,x,y,k,light=False,labels=True):
 color=DARK if light else INK;border='#698176' if light else MUTED
 rect(c,x,y,1220*k,2440*k,'#dedccc' if light else None,border)
 for q in D['nesting']['items']:
  xx=x+q['xMm']*k;yy=y+q['yMm']*k;ww=q['widthMm']*k;hh=q['heightMm']*k;band=q.get('kind','').startswith('reinforce') or q['id'].startswith('R')
  rect(c,xx,yy,ww,hh,GREEN if light and band else '#efead9' if light else None,color,.8)
  if labels:txt(c,q['id'],xx+ww/2,yy+hh/2+2,17 if band else 20,color,align='center')
def front_view(c,x,y,k=.2,internal=False):
 # Actual panel at Y1450..2050, stake 0..1800. Drawn top-down from panel top.
 pw,ph=400*k,600*k;pole_y=y+250*k;pole_h=1800*k
 rect(c,x,y,pw,ph,BLUE,INK,1.4)
 if internal:
  rect(c,x+170*k,y+20*k,60*k,560*k,None,GREEN,1)
  for xx in[30,370]:
   for yy in[40,560]:
    rect(c,x+(xx-7.5)*k,y+(600-yy-25)*k,15*k,50*k,None,GOLD,1)
  rect(c,x+187.5*k,pole_y,25*k,pole_h,None,GOLD,1.1)
  for yy in[100,220]:circ(c,x+200*k,y+(600-yy)*k,1.7,GOLD)
 else:
  rect(c,x+187.5*k,y+600*k,25*k,1450*k,None,INK,1.1)
  # Front art is indicated by diagonal graphic rather than any printed letters.
  line(c,x+9,y+ph-16,x+pw-9,y+16,MUTED,4)
 return y+2050*k

def build_blueprint():
 c=canvas.Canvas(str(O/'Pancartas-Blueprints-PA04.pdf'),pagesize=(W,H));c.setTitle('Quelec - Pancartas verticales de dos caras - Plano PA04');header(c,'Cuatro pancartas, ocho caras ilustradas','Tableros 400 x 600 x 3 - mango oculto entre caras - una sola lámina de PP3')
 txt(c,'A / ALZADOS Y ANCLAJES',30,124,26,INK,True)
 front_view(c,50,155);front_view(c,225,155,internal=True)
 txt(c,'Frente A',90,584,22,INK,True,'center');txt(c,'Interior sin tapa B',265,584,22,INK,True,'center')
 dim(c,50,144,130,144,'400',dy=-5);dim(c,143,155,143,275,'600',dx=12,dy=3);dim(c,165,155,165,565,'2050',dx=15)
 para(c,'Tablero inferior: Y1450. Mango: 1800 de largo; solape 350. Banda PP3 de 60 x 560, centrada; deja 20 arriba y abajo.',30,609,300,23,leading=10)
 para(c,'M4: X200; Y100 / 220 desde abajo. PP + banda: Ø6,2, casquillo Ø6 / 4,3 x 6. Madera: Ø4,5. Paso entre M4: 120.',30,642,300,21,leading=9)
 line(c,340,116,340,659,MUTED)
 txt(c,'B / SECCIONES DE LA CAJA',365,124,26,INK,True)
 txt(c,'Por el mango y los dos M4',365,147,23,INK,True)
 # Transverse section at the central stake, scale 5:1 horizontally.
 x=412;y=180;k=5
 rect(c,x,y,3*k,66,None,INK,1.4);rect(c,x+3*k,y,3*k,66,None,GREEN,1.2);rect(c,x+6*k,y,15*k,66,None,GOLD,1.4);rect(c,x+33*k,y,3*k,66,None,INK,1.4)
 line(c,x-8,y-2,x-8,y+68,MUTED,1.2);line(c,x+36*k+6,y-2,x+36*k+6,y+68,MUTED,1.2)
 line(c,x-7,y+33,x+29*k,y+33,INK,2)
 rect(c,x+21.7*k,y+27,4.8*k,12,None,INK,1.1);circ(c,x-7,y+33,3,INK)
 for xx in[x-1.2*k,x+21*k]:rect(c,xx,y+23,1.0*k,20,None,INK,.8)
 # A sleeve spans the two PP3 layers and is not through the wood.
 rect(c,x,y+28,6*k,10,None,GOLD,1.1)
 dim(c,x+3*k,y+81,x+33*k,y+81,'30 entre caras interiores de PP',dy=11,size=21)
 dim(c,x,y+110,x+36*k,y+110,'36 de caja (sin papel ni cabezas)',dy=11,size=21)
 txt(c,'A',x-8,y-11,22,INK,True,'center');txt(c,'B',x+36*k+6,y-11,22,INK,True,'center')
 txt(c,'PP3',x+1.5*k,y-8,19,INK,align='center');txt(c,'PP3',x+34.5*k,y-8,19,INK,align='center');txt(c,'mango 15',x+13.5*k,y-8,20,GOLD,align='center')
 para(c,'Afuera: papel A y B. Dentro: mango, banda y dos M4 x 30 con arandelas Ø18, tuerca autofrenante y punta protegida. La tapa B oculta el mango sin tapar la imagen.',365,328,320,23,leading=10)
 txt(c,'Por un taco separador de 30',365,387,23,INK,True)
 y=409;rect(c,x,y,15,43,None,INK,1.4);rect(c,x+15,y,150,43,None,GOLD,1.4);rect(c,x+165,y,15,43,None,INK,1.4)
 for yy in[y+13,y+30]:
  line(c,x-5,yy,x+60,yy,INK,1.4);line(c,x+120,yy,x+185,yy,INK,1.4);circ(c,x-5,yy,1.8,INK);circ(c,x+185,yy,1.8,INK)
 txt(c,'Taco: 15 ancho x 50 alto x 30 fondo',365,470,21,GOLD,True)
 para(c,'4 tacos por pancarta: centros X30/370 y Y40/560 desde abajo. Dos tornillos para madera 3 x 12 por cara y taco, con arandela Ø8.',365,493,320,23,leading=10)
 para(c,'PP: perforación Ø3,2. Madera: piloto Ø2, a confirmar con el tornillo y una probeta. Separación vertical entre tornillos del taco: 25.',365,544,320,23,leading=10)
 para(c,'Lijar, redondear cantos y no hundir el PP. Pegar el papel al final para cubrir cabezas. Probar cinta compatible con PP y revisar agarre y lectura en ensayo.',365,594,320,23,leading=10)
 line(c,710,116,710,659,MUTED)
 txt(c,'C / CORTE Y COMPRA',735,124,26,INK,True)
 draw_nesting(c,763,154,.15);dim(c,763,144,946,144,'1220 x 2440 x 3',dy=-5)
 txt(c,'Una lámina: 8 tableros + 4 bandas',735,540,23,INK,True)
 para(c,'Área neta: 2,0544 m². Tableros 400 x 600; bandas 60 x 560. Canal paralelo al lado de 600.',735,558,235,21,leading=9)
 para(c,'TOTAL: 4 mangos; 16 tacos; 8 M4 x 30; 16 arandelas Ø18; 8 tuercas M4; 8 casquillos; 64 tornillos madera 3 x 12 y 64 arandelas Ø8; 8 artes.',735,605,235,21,leading=9)
 para(c,'Temas: Escenas V2, 07/10/26. Arte aprobado el 25/10/26, sin texto en las caras.',735,651,235,18,leading=8)
 c.showPage();c.save()

def guide_diagram(c,n,x,y):
 if n==1:draw_nesting(c,x+22,y+64,.06,light=True,labels=False)
 elif n==2:
  rect(c,x+26,y+72,123,166,'#e4ddc8','#607a6b');rect(c,x+78,y+77,18,155,GREEN,'#607a6b');rect(c,x+84,y+140,7,102,WOOD,'#607a6b')
  for yy in[y+181,y+214]:circ(c,x+87.5,yy,2.4,'#546966',True)
  txt(c,'35 cm de solape',x+88,y+254,20,DARK,align='center')
 elif n==3:
  # Simple exploded edge diagram: front, spacers, back; arrows close the cover.
  rect(c,x+20,y+73,8,158,'#e4ddc8','#607a6b')
  for yy in[y+86,y+195]:rect(c,x+47,yy,34,24,WOOD,'#607a6b')
  rect(c,x+118,y+73,8,158,'#e4ddc8','#607a6b')
  for yy in[y+98,y+207]:
   line(c,x+112,yy,x+86,yy,'#536f65',2);line(c,x+86,yy,x+92,yy-4,'#536f65',2);line(c,x+86,yy,x+92,yy+4,'#536f65',2)
  txt(c,'30 mm dentro',x+76,y+254,20,DARK,align='center')
 else:
  faces=D['signs'][0]['faces'];face_image(c,faces[0],x+18,y+82,65,97.5);face_image(c,faces[1],x+94,y+82,65,97.5)
  for xx in[x+49,x+125]:rect(c,xx,y+180,4,61,WOOD,'#607a6b')
  txt(c,'A y B sin palabras',x+88,y+254,20,DARK,align='center')

def build_guide():
 c=canvas.Canvas(str(O/'Pancartas-Guia-visual-PA04.pdf'),pagesize=(W,H));c.setTitle('Quelec - Pancartas - Guia de armado PA04');header(c,'Cuatro pancartas, el mismo montaje','Dos caras verticales por pancarta - el mango y las tuercas quedan por dentro',False)
 positions=[(30,122),(520,122),(30,396),(520,396)]
 titles=['Corta las parejas','Sujeta el mango','Pon la tapa de atrás','Pega las imágenes']
 bodies=[
 'Corta ocho tableros de 40 x 60 cm: dos por pancarta. Corta también cuatro bandas de 6 x 56 cm. Marca las parejas A/B por dentro, donde no se vean.',
 'Centra la banda detras del frente A y deja 2 cm arriba y abajo. El liston sube 35 cm. Une con dos M4 a 10 y 22 cm desde abajo. Los casquillos de 6 mm evitan aplastar el PP.',
 'Pon cuatro tacos de 3 cm de fondo, uno cerca de cada esquina. Atornilla el frente y la tapa a los tacos. El hueco esconde mango y tuercas. No aprietes hasta hundir el plástico.',
 'Imprime las ocho caras al 100 %: cada página mide 40 x 60 cm. Pega el papel mate despues de atornillar, cubriendo las cabezas. Revisa puntas, agarre y lectura con el equipo.'
 ]
 notes=['Una lámina de 122 x 244 cm alcanza','Mango: 180 cm; altura total: 205 cm','16 tornillos pequeños por pancarta','Una imagen distinta por cada lado']
 for i,(x,y) in enumerate(positions):
  rect(c,x,y,450,252,'#f8f4e9','#bfc9bd');txt(c,str(i+1),x+17,y+28,47,'#a14437',True);txt(c,titles[i],x+49,y+29,34,DARK,True)
  guide_diagram(c,i+1,x,y-17)
  para(c,bodies[i],x+180,y+72,246,27,DARK,leading=13)
  txt(c,notes[i],x+180,y+230,20,DARK,True)
 c.showPage();c.save()

def build_art():
 pw,ph=400*mm,600*mm;c=canvas.Canvas(str(O/'Pancartas-Artes-PA04.pdf'),pagesize=(pw,ph));c.setTitle('Quelec - Pancartas PA04 - Ocho caras 400 x 600 mm sin texto')
 for sign in D['signs']:
  for face in sign['faces']:
   code=face.get('code',sign['id']+face['id']);c.bookmarkPage(code);c.addOutlineEntry(code+' '+face.get('theme',face.get('title','')),code,0,False);face_image(c,face,0,0,400,600,page_h=ph);c.showPage()
 c.save()

def build_cut_svg():
 svg=['<svg xmlns="http://www.w3.org/2000/svg" width="1220mm" height="2440mm" viewBox="0 0 1220 2440"><title>PA04 - cortes 1:1 - ocho tableros y cuatro bandas</title><rect width="1220" height="2440" fill="white" stroke="#577067" stroke-width=".4"/>']
 for q in D['nesting']['items']:
  x,y,w,h=[q[k] for k in ['xMm','yMm','widthMm','heightMm']];svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="none" stroke="black" stroke-width=".3"/><text x="{x+w/2}" y="{y+h/2}" font-family="Arial" font-size="13" text-anchor="middle">{html.escape(q["id"])} - {w} x {h}</text>')
 svg.append('</svg>');(O/'Pancartas-Cortes-PA04.svg').write_text('\n'.join(svg))
if __name__=='__main__':
 build_blueprint();build_guide();build_art();build_cut_svg();print('PA04: 1 plano 1000x700; 1 guia 1000x700; 8 artes 400x600; corte SVG 1:1')
