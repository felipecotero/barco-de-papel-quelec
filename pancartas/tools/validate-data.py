"""Check the PA04 inventory, cut layout, approved source images and UV windows."""
from pathlib import Path
import json, hashlib
from PIL import Image
P=Path(__file__).resolve().parents[1]
D=json.loads((P/'model.json').read_text())
assert D['revision']=='PA04' and D['count']==4 and D['facesPerSign']==2
assert D['orientation']=='portrait' and D['textOnFaces'] is False
assert len(D['signs'])==4
codes=[]
for sign in D['signs']:
 assert len(sign['faces'])==2
 image=P/sign['artwork'];im=Image.open(image);size=list(im.size)
 assert hashlib.sha256(image.read_bytes()).hexdigest()==sign['approvedImageSha256']
 for f in sign['faces']:
  codes.append(f['code']);face_path=P/f['image'];size=list(Image.open(face_path).size);assert f['imageSizePx']==size
  assert hashlib.sha256(face_path.read_bytes()).hexdigest()==f['sourceImageSha256']
  x,y,w,h=f['cropPx'];assert x>=0 and y>=0 and w>0 and h>0
  assert x+w<=size[0] and y+h<=size[1]
  assert w*3==h*2 and f['noText'] is True
assert len(set(codes))==8
themes=[f['theme']for s in D['signs']for f in s['faces']]
f=D['signs'][3]['faces'][1]
assert f['strikeColor']=='black' and f['strikeDirection']=='top-left-to-bottom-right' and f['strikeWidthFactor']==2
assert len(set(themes))==8 and themes.count('Jugar')==1 and 'Usar lápices de colores'in themes
n=D['nesting'];W,H,_=n['sheetMm'];gap=n['minimumSeparationMm'];margin=n['minimumMarginMm'];items=n['items']
assert len(items)==12 and sum(x['kind']=='panel' for x in items)==8
for a in items:
 assert a['quantity']==1 and a['sheet']==1
 x,y,w,h=[a[k] for k in ['xMm','yMm','widthMm','heightMm']]
 assert min(x,y,W-(x+w),H-(y+h))>=margin,a['id']
for i,a in enumerate(items):
 for b in items[i+1:]:
  assert (a['xMm']+a['widthMm']+gap<=b['xMm'] or b['xMm']+b['widthMm']+gap<=a['xMm'] or a['yMm']+a['heightMm']+gap<=b['yMm'] or b['yMm']+b['heightMm']+gap<=a['yMm']), (a['id'],b['id'])
net=sum(x['widthMm']*x['heightMm'] for x in items)/1e6
assert abs(net-n['netAreaM2'])<1e-10
assert abs(net/(W*H/1e6)*100-n['utilizationPercent'])<1e-8
q=D['quantities'];assert q['panelsTotal']==8 and q['reinforcements']==4 and q['sheetCount']==1
assert q['poles']==4 and q['spacers']==16 and q['mainBoltsM4x30']==8
assert q['mainWashers18']==16 and q['mainNutsM4']==8 and q['mainSleeves6mm']==8
assert q['woodScrews3x12']==64 and q['woodScrewWashers8']==64 and q['paperFaces']==8
m=D['dimensionsMm'];assert m['panel'][0]<m['panel'][1]
assert m['panelBottom']+m['panel'][1]==m['overallHeight']==2050
assert m['pole'][2]-m['panelBottom']==m['poleOverlap']==350
assert m['boxThickness']==m['panel'][2]+m['innerGap']+m['rearPanel'][2]==36
assert (m['panel'][1]-m['reinforcement'][1])/2==m['reinforcementTopBottomMargin']==20
assert m['holesFromPanelLeft']==m['panel'][0]/2
assert m['holesFromPanelBottom'][1]-m['holesFromPanelBottom'][0]==m['holePitch']==120
assert all(20<y<m['poleOverlap'] for y in m['holesFromPanelBottom'])
assert (P/'downloads/Pancartas-PA04-datos.json').read_bytes()==(P/'model.json').read_bytes()
report={'pass':True,'revision':'PA04','date':'2026-10-25','signs':4,'faces':8,'sourcePngIntact':True,'uvCropWindowsInsideImages':True,'uvAspectRatio':'2:3','textOnFaces':False,'nesting':{'sheetCount':1,'panelCount':8,'reinforcementCount':4,'noOverlap':True,'minimumMarginMm':margin,'minimumSeparationMm':gap,'netAreaM2':net,'utilizationPercent':n['utilizationPercent']},'quantitiesConsistent':True,'dimensionsConsistent':True,'limits':'Data and layout check; physical adhesion, joints, comfort and distance legibility remain to validate in prototype and rehearsal.'}
(P/'verificacion-datos-PA04.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False))
