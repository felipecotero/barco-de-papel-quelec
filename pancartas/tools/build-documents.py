"""PA05 alternative portrait, landscape and square sheets; PDF-clipped artwork."""
from pathlib import Path
import json,math,html
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor,Color
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
P=Path(__file__).resolve().parents[1];O=P/'downloads';O.mkdir(exist_ok=True);M=json.loads((P/'model.json').read_text());D=M;mm=72/25.4;W,H=1000*mm,700*mm
REV='PA05';LABEL='Vertical';SUFFIX=f'{REV}-{LABEL}'
PLURALS={'Vertical':'verticales','Horizontal':'horizontales','Cuadrada':'cuadradas'}
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
 txt(c,f'QUELEC / TALLER DE OBJETOS / {REV} / {LABEL.upper()}',30,29,22,color,True);txt(c,title,30,62,56,color,True);txt(c,sub,30,85,25,color)
 line(c,30,103,970,103,color)
 txt(c,f'PROPUESTA {SUFFIX.upper()} - 25 OCT 2026 - COTAS EN MM - PLIEGO 1000 x 700 MM',30,680,18,color);txt(c,'1 / 1',970,680,20,color,align='right')
def face_image(c,face,x,y,w,h,page_h=H):
 # Original pair is embedded unchanged. The PDF viewport selects the approved face.
 crop=face['cropPx'];cx,cy,cw,ch=crop;iw,ih=face['imageSizePx'];sx=w*mm/cw;sy=h*mm/ch
 left=x*mm;bottom=page_h-(y+h)*mm
 c.saveState();p=c.beginPath();p.rect(left,bottom,w*mm,h*mm);c.clipPath(p,stroke=0,fill=0)
 c.drawImage(ImageReader(str(P/face['image'])),left-cx*sx,bottom-(ih-cy-ch)*sy,width=iw*sx,height=ih*sy,mask='auto');c.restoreState()
def dims_value():return D.get('dimensionsMm',{})
def cm(value):return f'{value/10:g}'.replace('.',',')
def output_path(kind,extension='pdf'):return O/f'Pancartas-{kind}-{SUFFIX}.{extension}'
def configure(label):
 global D,LABEL,SUFFIX
 LABEL=label;SUFFIX=f'{REV}-{LABEL}'
 keys={'Horizontal':'landscape','Cuadrada':'square'}
 D=M if label=='Vertical' else {**M,**M['variants'][keys[label]]}
 for face in D['artLibrary']:
  if not (P/face['image']).is_file():raise FileNotFoundError(face['image'])
def draw_nesting(c,x,y,k,light=False,labels=True):
 color=DARK if light else INK;border='#698176' if light else MUTED
 rect(c,x,y,1220*k,2440*k,'#dedccc' if light else None,border)
 for q in D['nesting']['items']:
  xx=x+q['xMm']*k;yy=y+q['yMm']*k;ww=q['widthMm']*k;hh=q['heightMm']*k;band=q.get('kind','').startswith('reinforce') or q['id'].startswith('R')
  rect(c,xx,yy,ww,hh,GREEN if light and band else '#efead9' if light else None,color,.8)
  if labels:
   if band:
    c.saveState();c.translate((xx+ww/2)*mm,H-(yy+hh/2)*mm);c.rotate(90);c.setFillColor(HexColor(color));c.setFont('Arial',17);c.drawCentredString(0,-2*mm,q['id']);c.restoreState()
   else:txt(c,q['id'],xx+ww/2,yy+hh/2+2,20,color,align='center')
def front_view(c,x,y,k=.2,internal=False):
 # Drawn top-down from the actual panel top; all dimensions come from its profile.
 d=dims_value();panel_w,panel_h,_=d['panel'];pole_w,_,pole_l=d['pole'];band_w,band_h,_=d['reinforcement']
 pw,ph=panel_w*k,panel_h*k;pole_y=y+(d['overallHeight']-pole_l)*k;pole_h=pole_l*k
 rect(c,x,y,pw,ph,BLUE,INK,1.4)
 if internal:
  rect(c,x+(panel_w-band_w)/2*k,y+d['reinforcementTopBottomMargin']*k,band_w*k,band_h*k,None,GREEN,1)
  block_w,block_h,_=d['spacer']
  for xx,yy in d['spacerCentersFromPanelMm']:
   rect(c,x+(xx-block_w/2)*k,y+(panel_h-yy-block_h/2)*k,block_w*k,block_h*k,None,GOLD,1)
  rect(c,x+(panel_w-pole_w)/2*k,pole_y,pole_w*k,pole_h,None,GOLD,1.1)
  for yy in d['holesFromPanelBottom']:circ(c,x+d['holesFromPanelLeft']*k,y+(panel_h-yy)*k,1.7,GOLD)
 else:
  rect(c,x+(panel_w-pole_w)/2*k,y+panel_h*k,pole_w*k,d['panelBottom']*k,None,INK,1.1)
  # Front art is indicated by diagonal graphic rather than any printed letters.
  line(c,x+9,y+ph-16,x+pw-9,y+16,MUTED,4)
 return y+d['overallHeight']*k

def build_blueprint():
 d=dims_value();pw,ph,pt=d['panel'];bw,bh,bt=d['reinforcement'];horizontal=LABEL=='Horizontal';k=.18 if horizontal else .2;fx,ix=45,215
 c=canvas.Canvas(str(output_path('Blueprints')),pagesize=(W,H));c.setTitle(f'Quelec - Pancartas {PLURALS[LABEL]} de dos caras - Plano {REV}');header(c,f'Pancartas {PLURALS[LABEL]} de dos caras',f'Elige un formato: 4 objetos, 8 caras de {pw} x {ph} mm y 10 diseños disponibles; no sumar los tres juegos')
 txt(c,'A / ALZADOS Y ANCLAJES',30,124,26,INK,True)
 front_view(c,fx,155,k);front_view(c,ix,155,k,internal=True)
 txt(c,'Frente A',fx+pw*k/2,584,22,INK,True,'center');txt(c,'Interior sin tapa B',ix+pw*k/2,584,22,INK,True,'center')
 dim(c,fx,144,fx+pw*k,144,str(pw),dy=-5);dim(c,fx+pw*k+8,155,fx+pw*k+8,155+ph*k,str(ph),dx=11,dy=3);dim(c,ix-25,155,ix-25,155+d['overallHeight']*k,str(d['overallHeight']),dx=-13)
 para(c,f"Borde inferior: Y{d['panelBottom']}. Mango: 1800 de largo; solape {d['poleOverlap']}. Banda PP3 de {bw} x {bh}, centrada; deja 20 arriba y abajo.",30,609,300,23,leading=10)
 para(c,f"M4: X{d['holesFromPanelLeft']}; Y100 / 220 desde abajo. PP + banda: Ø6,2, casquillo Ø6 / 4,3 x 6. Madera: Ø4,5. Paso entre M4: 120.",30,642,300,21,leading=9)
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
 xs=sorted({q[0] for q in d['spacerCentersFromPanelMm']});ys=sorted({q[1] for q in d['spacerCentersFromPanelMm']})
 para(c,f'4 tacos por pancarta: centros X{xs[0]}/{xs[1]} y Y{ys[0]}/{ys[1]} desde abajo. Dos tornillos para madera 3 x 12 por cara y taco, con arandela Ø8.',365,493,320,23,leading=10)
 para(c,'PP: perforación Ø3,2. Madera: piloto Ø2, a confirmar con el tornillo y una probeta. Separación vertical entre tornillos del taco: 25.',365,544,320,23,leading=10)
 para(c,'Lijar, redondear cantos y no hundir el PP. Pegar el papel al final para cubrir cabezas. Probar cinta compatible con PP y revisar agarre y lectura en ensayo.',365,594,320,23,leading=10)
 line(c,710,116,710,659,MUTED)
 txt(c,'C / CORTE Y COMPRA',735,124,26,INK,True)
 draw_nesting(c,763,154,.15);dim(c,763,144,946,144,'1220 x 2440 x 3',dy=-5)
 txt(c,'Una lámina: 8 tableros + 4 bandas',735,540,23,INK,True)
 area=f"{D['nesting']['netAreaM2']:.4f}".replace('.',',')
 canal=str(ph)
 para(c,f'Área neta: {area} m². Tableros {pw} x {ph}; bandas {bw} x {bh}. Canal vertical al montar: paralelo al lado de {canal}.',735,558,235,21,leading=9)
 para(c,'POR JUEGO: 4 mangos; 16 tacos; 8 M4 x 30; 16 arandelas Ø18; 8 tuercas M4; 8 casquillos; 64 tornillos madera 3 x 12 y 64 arandelas Ø8; 8 artes elegidos.',735,605,235,21,leading=9)
 para(c,'Montaje por validar en prototipo y ensayo. Temas: Escenas V2; caras sin texto.',735,651,235,18,leading=8)
 c.showPage();c.save()

def guide_diagram(c,n,x,y):
 d=dims_value();pw,ph,_=d['panel'];horizontal=LABEL=='Horizontal'
 if n==1:draw_nesting(c,x+22,y+64,.06,light=True,labels=False)
 elif n==2:
  k=min(140/pw,166/ph);left=x+88-pw*k/2;top=y+72
  rect(c,left,top,pw*k,ph*k,'#e4ddc8','#607a6b');rect(c,left+(pw-60)*k/2,top+20*k,60*k,d['reinforcement'][1]*k,GREEN,'#607a6b')
  pole_top=top+(ph-d['poleOverlap'])*k;rect(c,x+88-12.5*k,pole_top,25*k,240-pole_top+y,WOOD,'#607a6b')
  for yy in d['holesFromPanelBottom']:circ(c,x+88,top+(ph-yy)*k,2.4,'#546966',True)
  txt(c,f"{cm(d['poleOverlap'])} cm de solape",x+88,y+254,20,DARK,align='center')
 elif n==3:
  # Simple exploded edge diagram: front, spacers, back; arrows close the cover.
  rect(c,x+20,y+73,8,158,'#e4ddc8','#607a6b')
  for yy in[y+86,y+195]:rect(c,x+47,yy,34,24,WOOD,'#607a6b')
  rect(c,x+118,y+73,8,158,'#e4ddc8','#607a6b')
  for yy in[y+98,y+207]:
   line(c,x+112,yy,x+86,yy,'#536f65',2);line(c,x+86,yy,x+92,yy-4,'#536f65',2);line(c,x+86,yy,x+92,yy+4,'#536f65',2)
  txt(c,'30 mm dentro',x+76,y+254,20,DARK,align='center')
 else:
  faces=D['signs'][0]['faces'];aw=72 if ph<=pw else 65;ah=aw*ph/pw;top=y+82+(97.5-ah)/2
  face_image(c,faces[0],x+12,top,aw,ah);face_image(c,faces[1],x+94,top,aw,ah)
  for xx in[x+12+aw/2,x+94+aw/2]:rect(c,xx-2,top+ah,4,241-(top-y)-ah,WOOD,'#607a6b')
  txt(c,'A y B sin palabras',x+88,y+254,20,DARK,align='center')

def build_guide():
 d=dims_value();pw,ph,_=d['panel'];bw,bh,_=d['reinforcement'];c=canvas.Canvas(str(output_path('Guia-visual')),pagesize=(W,H));c.setTitle(f'Quelec - Pancartas {PLURALS[LABEL]} - Guia {REV}');header(c,f'Armado de pancartas {PLURALS[LABEL]}','Elige un formato para 4 objetos: 8 caras instaladas de 10 diseños; no sumar los tres juegos',False)
 positions=[(30,122),(520,122),(30,396),(520,396)]
 titles=['Corta las parejas','Sujeta el mango','Pon la tapa de atrás','Pega las imágenes']
 bodies=[
 f'Corta ocho tableros de {cm(pw)} x {cm(ph)} cm: dos por pancarta. Corta también cuatro bandas de {cm(bw)} x {cm(bh)} cm. Marca las parejas A/B por dentro, donde no se vean.',
 f"Centra la banda detrás del frente A y deja 2 cm arriba y abajo. El listón sube {cm(d['poleOverlap'])} cm. Une con dos M4 a 10 y 22 cm desde abajo. Los casquillos de 6 mm evitan aplastar el PP.",
 'Pon cuatro tacos de 3 cm de fondo, uno cerca de cada esquina. Atornilla el frente y la tapa a los tacos. El hueco esconde mango y tuercas. No aprietes hasta hundir el plástico.',
 f'Elige 8 de los 10 diseños e imprime al 100 %: cada página mide {cm(pw)} x {cm(ph)} cm. Pega en papel mate después de atornillar y cubre las cabezas. Revisa puntas, agarre y lectura en ensayo.'
 ]
 notes=['Una lámina por juego de cuatro',f"Mango 180 cm; alto total {cm(d['overallHeight'])} cm",'16 tornillos pequeños por pancarta','8 caras instaladas; 2 diseños opcionales']
 for i,(x,y) in enumerate(positions):
  rect(c,x,y,450,252,'#f8f4e9','#bfc9bd');txt(c,str(i+1),x+17,y+28,47,'#a14437',True);txt(c,titles[i],x+49,y+29,34,DARK,True)
  guide_diagram(c,i+1,x,y-17)
  para(c,bodies[i],x+180,y+72,246,27,DARK,leading=13)
  txt(c,notes[i],x+180,y+230,20,DARK,True)
 c.showPage();c.save()

def build_art():
 fw,fh=D['printing']['faceSizeMm'];pw,ph=fw*mm,fh*mm;c=canvas.Canvas(str(output_path('Artes')),pagesize=(pw,ph));c.setTitle(f'Quelec - Pancartas {SUFFIX} - Diez diseños {fw} x {fh} mm sin texto; elegir ocho')
 for face in D['artLibrary']:
  code=face['code'];c.bookmarkPage(code);c.addOutlineEntry(code+' '+face.get('theme',face.get('title','')),code,0,False);face_image(c,face,0,0,fw,fh,page_h=ph);c.showPage()
 c.save()

def build_cut_svg():
 svg=[f'<svg xmlns="http://www.w3.org/2000/svg" width="1220mm" height="2440mm" viewBox="0 0 1220 2440"><title>{SUFFIX} - cortes 1:1 - ocho tableros y cuatro bandas</title><rect width="1220" height="2440" fill="white" stroke="#577067" stroke-width=".4"/>']
 for q in D['nesting']['items']:
  x,y,w,h=[q[k] for k in ['xMm','yMm','widthMm','heightMm']];svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="none" stroke="black" stroke-width=".3"/><text x="{x+w/2}" y="{y+h/2}" font-family="Arial" font-size="13" text-anchor="middle">{html.escape(q["id"])} - {w} x {h}</text>')
 svg.append('</svg>');output_path('Cortes','svg').write_text('\n'.join(svg))
if __name__=='__main__':
 for label in ['Vertical','Horizontal','Cuadrada']:
  configure(label);build_blueprint();build_guide();build_art();build_cut_svg();print(f'{SUFFIX}: 1 plano 1000x700; 1 guía 1000x700; 10 diseños {D["printing"]["faceSizeMm"]}, elegir 8; corte SVG 1:1')
