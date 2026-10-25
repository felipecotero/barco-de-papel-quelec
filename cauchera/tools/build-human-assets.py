"""Prepare CC0 MakeHuman assets as local browser data; no MakeHuman program code is shipped."""
from pathlib import Path
import json,math,re,base64,hashlib,shutil
import numpy as np
from PIL import Image
P=Path(__file__).resolve().parents[1];S=P.parents[2]/'tmp/personas-C03';O=P/'assets/personas';O.mkdir(parents=True,exist_ok=True)

def obj(p):
 v=[];uv=[];faces=[];group=''
 for l in p.read_text().splitlines():
  a=l.split()
  if not a:continue
  if a[0]=='v':v.append(list(map(float,a[1:4])))
  elif a[0]=='vt':uv.append(list(map(float,a[1:3])))
  elif a[0]=='g':group=a[1]
  elif a[0]=='f':faces.append((group,[tuple(int(n)-1 if n else -1 for n in x.split('/'))for x in a[1:]]))
 return np.array(v),np.array(uv),faces
v0,_,_=obj(S/'base.obj');v=v0.copy()
for l in(S/'caucasian-male-young.target').read_text().splitlines():
 a=l.split()
 if a and not a[0].startswith('#')and len(a)==4:v[int(a[0])]+=np.array(list(map(float,a[1:])))
# Scale the actual body, excluding MakeHuman's invisible helper geometry.
_,_,f0=obj(S/'base.obj');bodyids=sorted({a[0]for g,f in f0 if g=='body'for a in f});bottom=v[bodyids,1].min();height=v[bodyids,1].max()-bottom;scale=1.7/height
norm=lambda a:(np.asarray(a)-np.array([0,bottom,0]))*scale
sk=json.loads((S/'default.mhskel').read_text());j={k:v[ix].mean(0)for k,ix in sk['joints'].items()};j={k:norm(x)for k,x in j.items()};rb={n:{'head':j[b['head']].tolist(),'tail':j[b['tail']].tolist()}for n,b in sk['bones'].items()}
semantic=['hip','torso','head'];
for sd in ['L','R']:
 semantic += [f'{n}.{sd}'for n in ['clavicle','upperarm','lowerarm','hand','thigh','shin','foot']]
 semantic += [f'finger{f}-{k}.{sd}'for f in range(1,6)for k in range(1,4)]
idx={n:i for i,n in enumerate(semantic)}
def sem(b):
 if b in idx:return b
 if b=='root'or b.startswith('pelvis'):return'hip'
 if b.startswith(('spine','breast')):return'torso'
 for sd in ['L','R']:
  if b.endswith('.'+sd):
   for pre,to in [('shoulder','upperarm'),('upperarm','upperarm'),('lowerarm','lowerarm'),('wrist','hand'),('metacarpal','hand'),('upperleg','thigh'),('lowerleg','shin'),('toe','foot')]:
    if b.startswith(pre):return to+'.'+sd
 return'head'

def weights(raw,N):
 out=[{}for _ in range(N)]
 for bone,pairs in raw['weights'].items():
  k=idx[sem(bone)]
  for vi,w in pairs:
   if vi<N:out[vi][k]=out[vi].get(k,0)+w
 return out
bw=weights(json.loads((S/'default_weights.mhw').read_text()),len(v))

def proxy(path):
 refs=[];delete=set();scales=np.ones(3);mode=None;info={}
 for l in path.read_text().splitlines():
  a=l.split()
  if not a or a[0].startswith('#'):continue
  if a[0]in['x_scale','y_scale','z_scale']:
   axis='xyz'.index(a[0][0]);scales[axis]=abs(v[int(a[1]),axis]-v[int(a[2]),axis])/float(a[3]);continue
  if a[0]=='verts':mode='v';continue
  if a[0]=='delete_verts':mode='d';continue
  if a[0]in['obj_file','material']:info[a[0]]=a[1];continue
  if mode=='v':
   if len(a)==1 and a[0].lstrip('-').isdigit():refs.append(([int(a[0])],[1.],np.zeros(3)))
   elif len(a)==9:refs.append((list(map(int,a[:3])),list(map(float,a[3:6])),np.array(list(map(float,a[6:])))))
  elif mode=='d':
   for match in re.finditer(r'(\d+)\s*-\s*(\d+)|(\d+)',l):
    if match.group(3):delete.add(int(match.group(3)))
    else:delete.update(range(int(match.group(1)),int(match.group(2))+1))
 pos=np.array([(v[ix]*np.array(ww)[:,None]).sum(0)+off*scales for ix,ww,off in refs]);w=[]
 for ix,ww,off in refs:
  d={}
  for vi,b in zip(ix,ww):
   for k,c in bw[vi].items():d[k]=d.get(k,0)+c*b
  w.append(d)
 return norm(pos),w,delete,info

assets=[('clothes','clothes/male_casualsuit06/male_casualsuit06.mhclo','male_casualsuit06_diffuse.png'),('shoes','clothes/shoes02/shoes02.mhclo','shoes02_diffuse.png'),('hair','hair/short02/short02.mhclo','short02_diffuse.png'),('eyes','eyes/low-poly/low-poly.mhclo','../materials/brown_eye.png')]
prepared=[];deleted=set()
for role,rel,tex in assets:
 path=S/'pack'/rel;pos,w,mask,info=proxy(path);source=path.parent/info['obj_file'];unused,uv,faces=obj(source);assert len(pos)==len(unused),(role,len(pos),len(unused))
 if role in['hair','eyes']:w=[{idx['head']:1.}for _ in pos]
 if role in['clothes','shoes']:
  direct=source.with_suffix('.mhw')
  if direct.exists():w=weights(json.loads(direct.read_text()),len(pos))
 deleted|=mask;prepared.append((role,pos,uv,faces,w,path.parent/tex))
# Keep only exposed skin: head/neck and arms below the T-shirt cuffs.
# Garments provide the covered torso/legs, preventing pose-time skin pokethrough.
visible=set()
for vi in bodyids:
 d=bw[vi];headw=d.get(idx['head'],0)
 if headw>.15:visible.add(vi);continue
 for sd in ['L','R']:
  head=norm(v[sk['joints'][sk['bones']['shoulder01.'+sd]['head']]].mean(0));elbow=norm(v[sk['joints'][sk['bones']['lowerarm01.'+sd]['head']]].mean(0));q=norm(v[vi]);t=np.dot(q-head,elbow-head)/np.dot(elbow-head,elbow-head)
  exposed=d.get(idx['lowerarm.'+sd],0)+d.get(idx['hand.'+sd],0)+sum(ww for kk,ww in d.items()if semantic[kk].startswith('finger')and semantic[kk].endswith('.'+sd))
  if exposed>.08 or(d.get(idx['upperarm.'+sd],0)>.15 and t>.50):visible.add(vi)
bodyfaces=[(g,f)for g,f in f0 if g=='body'and all(a[0]in visible for a in f)and not any(a[0]in deleted for a in f)]
prepared.insert(0,('skin',norm(v),obj(S/'base.obj')[1],bodyfaces,bw,S/'pack/skins/young_caucasian_male/young_lightskinned_male_diffuse.png'))

def encoded(a,dtype):return base64.b64encode(np.asarray(a,dtype=dtype).tobytes()).decode()
def mesh(role,pos,uv,faces,w,texture):
 normals=np.zeros_like(pos);tris=[];parent=list(range(len(pos)))
 def find(x):
  while parent[x]!=x:parent[x]=parent[parent[x]];x=parent[x]
  return x
 for group,f in faces:
  for a in f[1:]:parent[find(a[0])]=find(f[0][0])
 comps={}
 for vi in range(len(pos)):comps.setdefault(find(vi),[]).append(vi)
 means={k:float(pos[ids,1].mean())for k,ids in comps.items()}

 for group,f in faces:
  for k in range(1,len(f)-1):
   t=[f[0],f[k],f[k+1]];a,b,c=[pos[x[0]]for x in t];n=np.cross(b-a,c-a)
   for x in t:normals[x[0]]+=n
   tris.append(t)
 normals/=np.maximum(np.linalg.norm(normals,axis=1)[:,None],1e-20);verts={};p=[];n=[];u=[];sw=[];si=[];ix=[];groups=[];current=None
 for t in tris:
  material=1 if role=='clothes'and means[find(t[0][0])]>.95 else 0
  if current!=material:groups.append({'start':len(ix),'count':0,'materialIndex':material});current=material
  groups[-1]['count']+=3
  for q in t:
   key=q[:2]
   if key not in verts:
    vi,ti=key;verts[key]=len(p)//3;p.extend(pos[vi]);n.extend(normals[vi]);u.extend(uv[ti]if ti>=0 else[0,0]);pairs=sorted(((k,max(0,vv))for k,vv in w[vi].items()),key=lambda t:-t[1])[:4]
    if not pairs:pairs=[(idx['head']if role in['hair','eyes']else idx['hip'],1)]
    den=sum(x[1]for x in pairs)or 1;si.extend([x[0]for x in pairs]+[0]*(4-len(pairs)));sw.extend([x[1]/den for x in pairs]+[0]*(4-len(pairs)))
   ix.append(verts[key])
 # Keep local texture copies, modest enough for mobile and offline use.
 im=Image.open(texture).convert('RGBA');im.thumbnail((1024,1024));alpha=im.getextrema()[-1][0]<255
 name=role+('.png'if alpha else'.jpg')
 if alpha:im.save(O/name,optimize=True)
 else:im.convert('RGB').save(O/name,quality=88,optimize=True)
 return {'name':role,'groups':groups,'vertices':len(p)//3,'triangles':len(ix)//3,'position':encoded(p,'<f4'),'normal':encoded(n,'<f4'),'uv':encoded(u,'<f4'),'skinIndex':encoded(si,'<u2'),'skinWeight':encoded(sw,'<f4'),'index':encoded(ix,'<u4'),'texture':'assets/personas/'+name,'alpha':alpha,'bounds':[pos.min(0).tolist(),pos.max(0).tolist()]}
M=[]
for args in prepared:
 m=mesh(*args);M.append(m);print(m['name'],m['vertices'],m['triangles'])
r={};
for sd in['L','R']:
 r[sd]={'shoulder':rb['shoulder01.'+sd]['head'],'elbow':rb['lowerarm01.'+sd]['head'],'wrist':rb['wrist.'+sd]['head'],'hip':rb['upperleg01.'+sd]['head'],'knee':rb['lowerleg01.'+sd]['head'],'ankle':rb['foot.'+sd]['head'],'middle':rb['finger3-1.'+sd]['head'],'index':rb['finger2-1.'+sd]['head'],'pinky':rb['finger5-1.'+sd]['head']}
center=lambda a,b:((np.array(a)+np.array(b))/2).tolist()
rest={'sides':r,'hip':center(r['L']['hip'],r['R']['hip']),'shoulder':center(r['L']['shoulder'],r['R']['shoulder']),'headCenter':center(rb['head']['head'],rb['head']['tail']),'headAxis':rb['head'],'fingers':{k:b for k,b in rb.items()if k.startswith('finger')}}
data={'version':'C03','source':'MakeHuman core assets','license':'CC0-1.0','sourceURL':'https://www.makehumancommunity.org/about/license.html','heightM':1.7,'bones':semantic,'rest':rest,'meshes':M}
(O/'human.json').write_text(json.dumps(data,separators=(',',':')));shutil.copyfile(S/'LICENSE-CC0.txt',O/'LICENSE-CC0.txt');(O/'NOTICE.md').write_text('MakeHuman core assets, CC0 1.0.\n\nGeometry, weights and morph: https://github.com/makehumancommunity/makehuman\nSystem clothes, shoes, hair, skin and eyes: https://files.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip\nLicense: https://www.makehumancommunity.org/about/license.html\n\nPrepared for Quelec: adult body morph, normalized to 1.70 m; hidden body under clothes removed; weights consolidated; local textures resized. No MakeHuman application code is included.\n')
print('Prepared',sum(m['triangles']for m in M),'triangles; data bytes',(O/'human.json').stat().st_size)
