"""Validate PA05 formats, optional art libraries and preserved PA04 geometry."""
from pathlib import Path
import hashlib
import json
from PIL import Image

P=Path(__file__).resolve().parents[1]
D=json.loads((P/'model.json').read_text())
B=json.loads((P/'downloads/Pancartas-PA04-datos.json').read_text())
assert D['revision']=='PA05' and D['count']==4 and D['facesPerSign']==2
assert D['defaultVariant']=='portrait' and D['orientation']=='portrait'
assert D['textOnFaces'] is False
assert set(D['variants'])=={'landscape','square'}


def face_check(face,ratio):
 path=P/face['image'];assert path.exists(),path
 size=list(Image.open(path).size)
 assert face['imageSizePx']==size,face['code']
 assert hashlib.sha256(path.read_bytes()).hexdigest()==face['sourceImageSha256'],face['code']
 x,y,w,h=face['cropPx']
 assert x>=0 and y>=0 and w>0 and h>0
 assert x+w<=size[0] and y+h<=size[1],face['code']
 assert w*ratio[1]==h*ratio[0],(face['code'],ratio)
 assert face['noText'] is True
 assert face['cropOrigin']=='top-left'


def nesting_check(n):
 W,H,T=n['sheetMm'];gap=n['minimumSeparationMm'];margin=n['minimumMarginMm'];items=n['items']
 assert T==3 and n['sheetCount']==1
 assert len(items)==12 and sum(x['kind']=='panel'for x in items)==8
 assert sum(x['kind']=='reinforcement'for x in items)==4
 assert gap>=5 and margin>=5
 for a in items:
  assert a['quantity']==1 and a['sheet']==1
  x,y,w,h=[a[k]for k in['xMm','yMm','widthMm','heightMm']]
  assert min(x,y,W-(x+w),H-(y+h))>=margin,a['id']
 for i,a in enumerate(items):
  for b in items[i+1:]:
   assert (a['xMm']+a['widthMm']+gap<=b['xMm'] or b['xMm']+b['widthMm']+gap<=a['xMm'] or a['yMm']+a['heightMm']+gap<=b['yMm'] or b['yMm']+b['heightMm']+gap<=a['yMm']),(a['id'],b['id'])
 net=sum(x['widthMm']*x['heightMm']for x in items)/1e6
 assert abs(net-n['netAreaM2'])<1e-10
 assert abs(net/(W*H/1e6)*100-n['utilizationPercent'])<1e-8
 return {'sheetCount':1,'panels':8,'reinforcements':4,'noOverlap':True,'minimumMarginMm':margin,'minimumSeparationMm':gap,'netAreaM2':net,'utilizationPercent':n['utilizationPercent']}


def profile_check(profile,orientation,ratio):
 assert profile['orientation']==orientation
 assert len(profile['signs'])==4
 defaults=[]
 for sign in profile['signs']:
  assert len(sign['faces'])==2
  for f in sign['faces']:
   face_check(f,ratio);defaults.append(f['code'])
 assert len(set(defaults))==8
 art=profile['artLibrary'];assert len(art)==10 and len({f['code']for f in art})==10
 assert {f['code']for f in art}==set(defaults)|{'EX01','EX02'}
 for f in art:face_check(f,ratio)
 assert sum(bool(f['optional'])for f in art)==2
 assert next(f for f in art if f['code']=='EX01')['theme']=='Pijamas navideñas'
 assert next(f for f in art if f['code']=='EX02')['theme']=='Gestos de alegría'
 assert profile['signs'][1]['faces'][0]['theme']=='Ser feliz'
 themes=[f['theme']for f in art]
 assert len(set(themes))==10 and themes.count('Jugar')==1
 pencil=next(f for f in art if f['code']=='P04B')
 assert pencil['strikeColor']=='black' and pencil['strikeDirection']=='top-left-to-bottom-right' and pencil['strikeWidthFactor']==2
 printing=profile['printing'];assert printing['count']==printing['pageCount']==10 and printing['physicalFaces']==8 and printing['optionalDesigns']==2
 m=profile['dimensionsMm'];width,height,thick=m['panel']
 assert printing['faceSizeMm']==[width,height]
 assert m['panelBottom']+height==m['overallHeight']
 assert m['panelBottom']+height/2==m['panelCenterHeight']==1750
 assert m['pole'][2]-m['panelBottom']==m['poleOverlap']
 assert m['boxThickness']==thick+m['innerGap']+m['rearPanel'][2]==36
 assert (height-m['reinforcement'][1])/2==m['reinforcementTopBottomMargin']==20
 assert m['holesFromPanelLeft']==width/2
 assert m['holesFromPanelBottom'][1]-m['holesFromPanelBottom'][0]==m['holePitch']==120
 assert min(m['holesFromPanelBottom'])>20 and max(m['holesFromPanelBottom'])<=m['poleOverlap']-30
 assert m['spacerCentersFromPanelMm']==[[30,40],[width-30,40],[30,height-40],[width-30,height-40]]
 for i in profile['nesting']['items']:
  assert [i['widthMm'],i['heightMm']]==(m['panel'][:2]if i['kind']=='panel'else m['reinforcement'][:2])
 return {'orientation':orientation,'signs':4,'physicalFaces':8,'availableArt':10,'optionalArt':2,'artworkWindowsInsideSources':True,'artworkAspectRatio':f'{ratio[0]}:{ratio[1]}','dimensionsMm':{'panel':m['panel'],'overallHeight':m['overallHeight'],'poleOverlap':m['poleOverlap']},'nesting':nesting_check(profile['nesting'])}

for key in['dimensionsMm','nesting','materials','assembly','construction','fasteners','quantities']:
 assert D[key]==B[key],('Vertical PA04 modificada',key)
image_keys=('image','imageSizePx','cropPx','cropOrigin','sourceImageSha256','strikeColor','strikeDirection','strikeWidthFactor')
for a,b in zip(D['signs'],B['signs']):
 for x,y in zip(a['faces'],b['faces']):
  for key in image_keys:assert x.get(key)==y.get(key),('Arte vertical modificado',x['code'],key)
q=D['quantities']
assert q['panelsTotal']==8 and q['reinforcements']==4 and q['sheetCount']==1
assert q['poles']==4 and q['spacers']==16 and q['mainBoltsM4x30']==8
assert q['mainWashers18']==16 and q['mainNutsM4']==q['mainSleeves6mm']==8
assert q['woodScrews3x12']==q['woodScrewWashers8']==64 and q['paperFaces']==8
profiles={'portrait':D,'landscape':{**D,**D['variants']['landscape']},'square':{**D,**D['variants']['square']}}
reports={k:profile_check(p,k,{'portrait':(2,3),'landscape':(3,2),'square':(1,1)}[k])for k,p in profiles.items()}
assert D['dimensionsMm']['panel']==[400,600,3]
assert profiles['landscape']['dimensionsMm']['panel']==[600,400,3]
assert profiles['square']['dimensionsMm']['panel']==[450,450,3]
assert (P/'downloads/Pancartas-PA05-datos.json').read_bytes()==(P/'model.json').read_bytes()
report={'pass':True,'revision':'PA05','date':'2026-10-25','defaultFormat':'portrait','verticalPA04GeometryPreserved':True,'verticalPA04ArtworkPreserved':True,'physicalSignsPerFormat':4,'physicalFacesPerFormat':8,'availableIllustrationsPerFormat':10,'quantitiesConsistent':True,'profiles':reports,'limits':'Data and layout check; physical adhesion, joints, comfort and distance legibility remain to validate in prototype and rehearsal.'}
(P/'verificacion-datos-PA05.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False))
