"""Check physical PA07 sheet packing and immutable PA05 alternative profiles."""
from pathlib import Path
import json,hashlib
from PIL import Image

P=Path(__file__).resolve().parents[1]
D=json.loads((P/'model.json').read_text())
B=json.loads((P/'downloads/Pancartas-PA05-datos.json').read_text())
assert D['revision']=='PA07' and D['defaultVariant']==D['orientation']=='pliego'
assert D['count']==4 and D['facesPerSign']==2 and D['textOnFaces'] is False
assert set(D['variants'])=={'portrait','landscape','square'}
assert D['availableVariants']==['pliego','portrait','landscape','square']
assert (P/'model.json').read_bytes()==(P/'downloads/Pancartas-PA07-datos.json').read_bytes()
assert D['sourcePA05SHA256']==hashlib.sha256((P/'downloads/Pancartas-PA05-datos.json').read_bytes()).hexdigest()

keys=['dimensionsMm','nesting','materials','assembly','construction','fasteners','quantities','printing','signs','artLibrary']
for key,profile in D['variants'].items():
    old=B if key=='portrait' else {**B,**B['variants'][key]}
    for field in keys:assert profile[field]==old[field],(key,field)

d=D['dimensionsMm']
assert d['panel']==d['rearPanel']==[700,1000,3]
assert d['reinforcement']==[60,960,3] and d['pole']==[25,15,1800]
assert d['panelBottom']==1300 and d['overallHeight']==2300 and d['panelCenterHeight']==1800
assert d['poleOverlap']==500==d['pole'][2]-d['panelBottom']
assert d['panelBottom']+d['panel'][1]==d['overallHeight']
assert (d['panel'][1]-d['reinforcement'][1])/2==20
assert d['innerGap']==30 and d['boxThickness']==36
assert d['holesFromPanelLeft']==350
assert max(d['holesFromPanelBottom'])<d['poleOverlap']
assert d['spacerCentersFromPanelMm']==[[30,40],[670,40],[30,960],[670,960]]

n=D['nesting'];W,H,T=n['sheetMm'];items=n['items'];gap=n['minimumSeparationMm'];margin=n['minimumMarginMm']
assert [W,H,T]==[1220,2440,3] and n['sheetCount']==D['quantities']['sheetCount']==3
assert len(items)==12 and len({q['id'] for q in items})==12
assert sum(q['kind']=='panel' for q in items)==8
assert sum(q['kind']=='reinforcement' for q in items)==4
counts=[]
for sheet in range(1,4):
    current=[q for q in items if q['sheet']==sheet]
    counts.append(sum(q['kind']=='panel' for q in current))
    for q in current:
        x,y,w,h=[q[k] for k in ['xMm','yMm','widthMm','heightMm']]
        assert min(x,y,W-x-w,H-y-h)>=margin,q['id']
        if q['kind']=='panel':assert [w,h]==[1000,700] and q['rotated90'] is True and q['finishedSizeMm']==[700,1000]
        else:assert [w,h]==[60,960]
    for i,a in enumerate(current):
        for b in current[i+1:]:
            assert a['xMm']+a['widthMm']+gap<=b['xMm'] or b['xMm']+b['widthMm']+gap<=a['xMm'] or a['yMm']+a['heightMm']+gap<=b['yMm'] or b['yMm']+b['heightMm']+gap<=a['yMm'],(a['id'],b['id'])
assert counts==[3,3,2]==n['panelDistribution']
assert 2*700>W and 4*700>H # At most three entire panels in one sheet, even when rotated.
net=sum(q['widthMm']*q['heightMm'] for q in items)/1e6
assert abs(net-5.8304)<1e-10 and abs(net-n['netAreaM2'])<1e-10
assert abs(n['utilizationPercent']-net/(W*H*3/1e6)*100)<1e-8

assert D['artLibrary']==B['artLibrary'] and D['signs']==B['signs']
assert len(D['artLibrary'])==10 and sum(q.get('optional',False) for q in D['artLibrary'])==2
for f in D['artLibrary']:
    path=P/f['image'];im=Image.open(path)
    assert list(im.size)==f['imageSizePx']
    assert hashlib.sha256(path.read_bytes()).hexdigest()==f['sourceImageSha256']
    x,y,w,h=f['cropPx'];assert x>=0 and y>=0 and x+w<=im.width and y+h<=im.height
    assert w*3==h*2
pencil=next(f for f in D['artLibrary'] if f['code']=='P04B')
assert [pencil[k] for k in ['strikeColor','strikeDirection','strikeWidthFactor']]==['black','top-left-to-bottom-right',2]
fit=D['printing']['artRectangleMm']
assert abs(fit[0]-1000/60)<1e-9 and abs(fit[2]-2000/3)<1e-9 and fit[3]==1000
assert D['approvalPA07']['constructionApproved'] is False
report={'revision':'PA07','date':'2026-11-04','pass':True,'default':'pliego','pageAndPanelMm':[700,1000],
    'physicalSigns':4,'physicalFaces':8,'illustrations':10,'sourceArtworkPixelsUnchanged':True,
    'P04BBlackDescendingDoubleWidthPreserved':True,'PA05ThreeAlternativeGeometryAndArtworkExact':True,
    'viewerCanvasPx':[700,1000],'artRectangleMm':fit,'uniformArtScale':True,
    'nominalHeightMm':2300,'poleOverlapMm':500,'reinforcementMm':[60,960,3],
    'sheetCount':3,'minimumSheetCountGeometric':3,'panelDistribution':counts,'netAreaM2':net,
    'noOverlap':True,'minimumGapMm':gap,'minimumMarginMm':margin,
    'constructionStatus':'Referencia de volumen y ensamble, herrajes PA05 sin dimensionar para el formato mayor.',
    'PDFPA05NotForPliego':True}
(P/'verificacion-datos-PA07.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2))
