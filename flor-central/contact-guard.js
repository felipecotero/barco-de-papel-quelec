/** F04: exact triangle BVH distance queries plus closed-solid containment.
 * Scope: the declared moving assembly against its declared static world.
 * Display visibility is never used to remove a physical collider.
 * This blocks invalid kinematic requests; it does not simulate rod or cloth forces.
 */
import {triangleTriangleDistanceSquared,triangleBounds,aabbDistanceSquared,conservativeSweep,triangleOBBContact,pointTriangleDistanceSquared} from './physics-core.js';
const sq=x=>x*x,sub=(a,b)=>a.map((v,k)=>v-b[k]),dot=(a,b)=>a.reduce((s,v,k)=>s+v*b[k],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],len=a=>Math.sqrt(dot(a,a));
const union=(a,b)=>({min:a.min.map((v,k)=>Math.min(v,b.min[k])),max:a.max.map((v,k)=>Math.max(v,b.max[k]))});
const midpoint=t=>[0,1,2].map(k=>(t[0][k]+t[1][k]+t[2][k])/3);
const finitePoint=p=>p&&p.length===3&&p.every(Number.isFinite);
const normAxes=[[1,0,0],[0,1,0],[0,0,1]];
function record(t,meshId,label,index){if(!t.every(finitePoint))throw new Error('Nonfinite collision geometry: '+label);return{tri:t,meshId,label,index,bounds:triangleBounds(t)};}
export function buildTriangleBVH(records,{leafSize=8}={}){
 if(!records.length)return null;
 const build=items=>{let bounds=items[0].bounds;for(let i=1;i<items.length;i++)bounds=union(bounds,items[i].bounds);if(items.length<=leafSize)return{...bounds,items};const ext=bounds.max.map((v,k)=>v-bounds.min[k]),axis=ext.indexOf(Math.max(...ext));items.sort((a,b)=>(a.bounds.min[axis]+a.bounds.max[axis])-(b.bounds.min[axis]+b.bounds.max[axis]));const mid=items.length>>1;return{...bounds,left:build(items.slice(0,mid)),right:build(items.slice(mid))};};
 return build(records.slice());
}
function validIgnore(zones,a,b){
 const pair=zones.get(a.meshId+'\0'+b.meshId);if(!pair)return false;
 return pair.some(z=>a.tri.every(p=>dot(sub(p,z.center),sub(p,z.center))<=sq(z.radiusM))&&b.tri.every(p=>dot(sub(p,z.center),sub(p,z.center))<=sq(z.radiusM)));
}
function zoneMap(zones=[]){const m=new Map();for(const z of zones){if(!finitePoint(z.center)||!Number.isFinite(z.radiusM)||z.radiusM<=0||!z.meshId||!z.colliderId)throw new Error('Joint zones need exact pair, finite center and positive radius.');const key=z.meshId+'\0'+z.colliderId;if(!m.has(key))m.set(key,[]);m.get(key).push(z);}return m;}
/** Records retain exact mesh IDs; roots/intersections are never suppressed globally. */
function marginMap(pairMargins=[],defaultMarginM=0){
 const map=new Map();let maxMarginM=defaultMarginM;
 if(!Number.isFinite(defaultMarginM)||defaultMarginM<0)throw new Error('Margins must be finite and nonnegative.');
 for(const m of pairMargins){if(!m.meshId||!m.colliderId||!Number.isFinite(m.marginM)||m.marginM<0)throw new Error('Pair margin requires exact IDs and nonnegative margin.');if(m.marginM<defaultMarginM&&!m.reason)throw new Error('A reduced mating margin needs its explicit mechanical reason.');map.set(m.meshId+'\0'+m.colliderId,m);maxMarginM=Math.max(maxMarginM,m.marginM);}
 return{map,maxMarginM,get:(a,b)=>map.get(a+'\0'+b)||{marginM:defaultMarginM,reason:'declared-free-clearance'}};
}
export function nearestTriangleBVH(movingRecords,staticTree,{jointZones=[],stopAtGapM=-Infinity,pairMargins=[],defaultMarginM=0}={}){
 const zones=zoneMap(jointZones),margins=marginMap(pairMargins,defaultMarginM);let bestResidual=Infinity,bestRaw=Infinity,bestMargin=null,bestA=null,bestB=null,testedPairs=0,visitedNodes=0;
 const lower=(a,b)=>Math.sqrt(aabbDistanceSquared(a,b))-margins.maxMarginM;
 for(const a of movingRecords){const stack=staticTree?[staticTree]:[];while(stack.length){const n=stack.pop();visitedNodes++;if(lower(a.bounds,n)>bestResidual)continue;
   if(n.items){for(const b of n.items){if(lower(a.bounds,b.bounds)>bestResidual||validIgnore(zones,a,b))continue;testedPairs++;const raw=Math.sqrt(triangleTriangleDistanceSquared(a.tri,b.tri)),margin=margins.get(a.meshId,b.meshId),residual=raw-margin.marginM;if(residual<bestResidual){bestResidual=residual;bestRaw=raw;bestMargin=margin;bestA=a;bestB=b;if(residual<=stopAtGapM)return result();}}}
   else{const dl=lower(a.bounds,n.left),dr=lower(a.bounds,n.right);if(dl<dr){if(dr<=bestResidual)stack.push(n.right);if(dl<=bestResidual)stack.push(n.left);}else{if(dl<=bestResidual)stack.push(n.left);if(dr<=bestResidual)stack.push(n.right);}}
 }}
 return result();
 function result(){return{gapM:bestResidual,residualM:bestResidual,rawGapM:bestRaw,physicalGapM:bestRaw,requiredMarginM:bestMargin?.marginM??defaultMarginM,marginReason:bestMargin?.reason||null,pairId:bestA&&bestB?bestA.meshId+' / '+bestB.meshId:null,movingId:bestA?.meshId||null,colliderId:bestB?.meshId||null,movingLabel:bestA?.label||null,colliderLabel:bestB?.label||null,triangleA:bestA?.index??-1,triangleB:bestB?.index??-1,nearestTriangles:bestA&&bestB?[bestA.tri,bestB.tri]:null,testedPairs,visitedNodes,emptyDomain:!staticTree||movingRecords.length===0};}
}
/** Refine only collision triangles crossing a declared joint region. This is
 * exact planar subdivision of the SAME triangle, not a geometry approximation or
 * an enlarged exception: it lets a long tube triangle retain its non-joint area.
 */
export function refineTrianglesAtJointZones(records,zones=[],{maxDepth=16}={}){
 const byMesh=new Map();for(const z of zones){for(const id of[z.meshId,z.colliderId]){if(!byMesh.has(id))byMesh.set(id,[]);byMesh.get(id).push(z);}}
 const out=[];
 for(const r of records){const relevant=byMesh.get(r.meshId)||[];if(!relevant.length){out.push(r);continue;}const stack=[{r,depth:0}];
  while(stack.length){const item=stack.pop(),t=item.r.tri;let target=Infinity;
   for(const z of relevant){if(t.every(p=>dot(sub(p,z.center),sub(p,z.center))<=sq(z.radiusM)))continue;if(pointTriangleDistanceSquared(z.center,...t)<=sq(z.radiusM))target=Math.min(target,z.radiusM/3);}
   const edges=[[0,1],[1,2],[2,0]],lengths=edges.map(([a,b])=>len(sub(t[a],t[b]))),long=lengths.indexOf(Math.max(...lengths));
   if(item.depth>=maxDepth||lengths[long]<=target||target===Infinity){out.push(item.r);continue;}
   const[i,j]=edges[long],k=3-i-j,mid=t[i].map((v,a)=>(v+t[j][a])/2),t1=[t[i],mid,t[k]],t2=[mid,t[j],t[k]];
   stack.push({r:record(t1,r.meshId,r.label,r.index),depth:item.depth+1},{r:record(t2,r.meshId,r.label,r.index),depth:item.depth+1});
  }
 }
 return out;
}
function rayBox(origin,direction,box){let tmin=0,tmax=Infinity;for(let k=0;k<3;k++){if(Math.abs(direction[k])<1e-14){if(origin[k]<box.min[k]||origin[k]>box.max[k])return false;}else{let a=(box.min[k]-origin[k])/direction[k],b=(box.max[k]-origin[k])/direction[k];if(a>b)[a,b]=[b,a];tmin=Math.max(tmin,a);tmax=Math.min(tmax,b);if(tmax<tmin)return false;}}return true;}
function rayTriangle(origin,dir,t){const e1=sub(t[1],t[0]),e2=sub(t[2],t[0]),h=cross(dir,e2),det=dot(e1,h);if(Math.abs(det)<1e-13)return null;const inv=1/det,s=sub(origin,t[0]),u=inv*dot(s,h);if(u< -1e-10||u>1+1e-10)return null;const q=cross(s,e1),v=inv*dot(dir,q);if(v< -1e-10||u+v>1+1e-10)return null;const d=inv*dot(e2,q);return d>1e-9?d:null;}
/** Closed-solid parity, not for thin cloth or an open tube/cylinder. */
export function pointInsideClosedBVH(point,tree){
 if(!tree||point.some((v,k)=>v<=tree.min[k]+1e-8||v>=tree.max[k]-1e-8))return false;
 const direction=[.912817249,.327139241,.244972391],stack=[tree],hits=[];
 while(stack.length){const n=stack.pop();if(!rayBox(point,direction,n))continue;if(n.items){for(const r of n.items){const t=rayTriangle(point,direction,r.tri);if(t!==null)hits.push(t);}}else stack.push(n.left,n.right);}
 hits.sort((a,b)=>a-b);let count=0,last=-Infinity;for(const t of hits)if(t-last>1e-7){count++;last=t;}return(count&1)===1;
}
function descriptor(item){return item?.mesh?item:{mesh:item,id:item?.uuid,label:item?.name||item?.uuid};}
function worldData(item){
 const d=descriptor(item),o=d.mesh;if(!o?.isMesh||!o.geometry?.attributes?.position)throw new Error('Every collider must refer to an actual THREE.Mesh.');
 const p=o.geometry.attributes.position,ids=o.geometry.index,m=o.matrixWorld.elements,points=[];
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),w=1/(m[3]*x+m[7]*y+m[11]*z+m[15]);points.push([(m[0]*x+m[4]*y+m[8]*z+m[12])*w,(m[1]*x+m[5]*y+m[9]*z+m[13])*w,(m[2]*x+m[6]*y+m[10]*z+m[14])*w]);}
 const id=d.id||o.uuid,label=d.label||o.name||id,records=[];let triIndex=0;
 const count=ids?ids.count:p.count;
 for(let i=0;i<count;i+=3){const a=ids?ids.getX(i):i,b=ids?ids.getX(i+1):i+1,c=ids?ids.getX(i+2):i+2,t=[points[a],points[b],points[c]];if(!t.every(finitePoint))throw new Error('Nonfinite collision mesh '+label);if(dot(cross(sub(t[1],t[0]),sub(t[2],t[0])),cross(sub(t[1],t[0]),sub(t[2],t[0])))>1e-24)records.push(record(t,id,label,triIndex));triIndex++;}
 const type=o.geometry.type,params=o.geometry.parameters||{},closed=d.solid!==undefined?!!d.solid:type==='BoxGeometry'||type==='SphereGeometry'&&Math.abs((params.phiLength??2*Math.PI)-2*Math.PI)<1e-9&&Math.abs((params.thetaLength??Math.PI)-Math.PI)<1e-9||type==='CylinderGeometry'&&!params.openEnded||type==='TubeGeometry'&&params.closed;
 let obb=null;
 if(type==='BoxGeometry'){
  o.geometry.computeBoundingBox();const b=o.geometry.boundingBox,localCenter=[(b.min.x+b.max.x)/2,(b.min.y+b.max.y)/2,(b.min.z+b.max.z)/2],center=[m[0]*localCenter[0]+m[4]*localCenter[1]+m[8]*localCenter[2]+m[12],m[1]*localCenter[0]+m[5]*localCenter[1]+m[9]*localCenter[2]+m[13],m[2]*localCenter[0]+m[6]*localCenter[1]+m[10]*localCenter[2]+m[14]],columns=[[m[0],m[1],m[2]],[m[4],m[5],m[6]],[m[8],m[9],m[10]]],scales=columns.map(len),axes=columns.map((v,k)=>v.map(x=>x/scales[k])),halfExtents=[(b.max.x-b.min.x)/2*scales[0],(b.max.y-b.min.y)/2*scales[1],(b.max.z-b.min.z)/2*scales[2]];
  if(scales.every(x=>x>0)&&axes.every((a,k)=>axes.every((b,j)=>j===k||Math.abs(dot(a,b))<1e-7)))obb={id,center,halfExtents,axes};
 }
 return{id,label,mesh:o,points,records,closed,obb,tree:null,motionBoundMPerOpening:d.collisionMotionBoundMPerOpening,motionReason:d.collisionMotionBoundReason||null,sweptEnvelope:d.sweptEnvelope||null};
}
function normalizedAxis(a){const n=len(a);if(!finitePoint(a)||n<1e-12)throw new Error('Envelope axis invalid.');return a.map(x=>x/n);}
function envelopeContains(points,e,toleranceM=1e-6){const axis=normalizedAxis(e.axis);return points.every(p=>{const d=sub(p,e.origin),axial=dot(d,axis),radial=len(sub(d,axis.map(x=>x*axial)));return axial>=e.minAxialM-toleranceM&&axial<=e.maxAxialM+toleranceM&&radial>=e.innerRadiusM-toleranceM&&radial<=e.outerRadiusM+toleranceM;});}
/** Conservative all-angle annular enclosure. The outer polygon circumscribes its
 * circle; the inner polygon is inside its hole circle. Thus no untested crescent
 * is silently removed between tessellation vertices. */
export function annularEnvelopeRecords(id,label,e,{sides=48,reserveM=1e-6}={}){
 if(e.kind!=='annular-cylinder'||!finitePoint(e.origin)||!e.reason||![e.innerRadiusM,e.outerRadiusM,e.minAxialM,e.maxAxialM].every(Number.isFinite)||e.innerRadiusM<=0||e.outerRadiusM<=e.innerRadiusM||e.maxAxialM<=e.minAxialM)throw new Error('Annular swept enclosure requires explicit positive radii/height and analytic reason.');
 const axis=normalizedAxis(e.axis),ref=Math.abs(axis[1])<.9?[0,1,0]:[1,0,0],raw=cross(axis,ref),u=raw.map(x=>x/len(raw)),v=cross(axis,u),outer=(e.outerRadiusM+reserveM)/Math.cos(Math.PI/sides),inner=e.innerRadiusM-reserveM,p=[];
 for(const y of[e.minAxialM-reserveM,e.maxAxialM+reserveM])for(const r of[inner,outer])for(let k=0;k<sides;k++){const a=k/sides*Math.PI*2;p.push(e.origin.map((x,j)=>x+axis[j]*y+r*(u[j]*Math.cos(a)+v[j]*Math.sin(a))));}
 const tri=[],ix=(level,radial,k)=>(level*2+radial)*sides+(k%sides),add=(a,b,c)=>tri.push(record([p[a],p[b],p[c]],id,label,tri.length));
 for(let k=0;k<sides;k++){const n=k+1;for(const r of[0,1]){const a=ix(0,r,k),b=ix(0,r,n),c=ix(1,r,k),d=ix(1,r,n);add(a,b,c);add(b,d,c);}for(const level of[0,1]){const a=ix(level,0,k),b=ix(level,0,n),c=ix(level,1,k),d=ix(level,1,n);add(a,c,b);add(b,c,d);}}
 return tri;
}
function envelopeData(d){if(!envelopeContains(d.points,d.sweptEnvelope))throw new Error('Actual coil left its declared swept annulus: '+d.label);const records=annularEnvelopeRecords(d.id,d.label+' [envolvente anular conservadora]',d.sweptEnvelope);return{...d,points:records.flatMap(r=>r.tri),records,closed:true,obb:null,invariantEnclosure:true};}
function meshKey(item){const d=descriptor(item),o=d.mesh;return[d.id||o.uuid,o.geometry.id,o.geometry.attributes.position.version,...o.matrixWorld.elements].join(',');}
/** Required scene contract:
 * contactSnapshot()=>{moving:[Mesh|{mesh,id,label,solid?}], static:[...],
 *  jointZones:[{meshId,colliderId,center:[xyz],radiusM}],staticKey:string,
 *  coverage:{scope:string,complete:boolean,unresolved:[]}}
 * staticKey MUST change whenever ANY static geometry or transform changes.
 */
export function createContactGuard({model,THREE,marginM=.005,numericalReserveM=1e-5,getSnapshot=null}={}){
 if(!model)throw new Error('A physical scene model is required.');
 let staticKey=null,cache=null,last=null,invariantBaseline=null,invariantStaticKey=null,activeEnvelopes=null;
 const snapshot=()=>{model.root?.updateMatrixWorld(true);const s=getSnapshot?getSnapshot():model.contactSnapshot?.();if(!s||!Array.isArray(s.moving)||!Array.isArray(s.static))throw new Error('Scene has no declared physical contact snapshot.');return s;};
 function rebuild(s){const key=(s.staticKey??s.static.map(meshKey).join('|'))+'|joints:'+JSON.stringify(s.jointZones||[]);if(key===staticKey&&cache)return;const data=s.static.map(worldData);for(const d of data)d.records=refineTrianglesAtJointZones(d.records,s.jointZones||[]);const records=data.flatMap(d=>d.records);for(const d of data)if(d.closed)d.tree=buildTriangleBVH(d.records);cache={data,tree:buildTriangleBVH(records),records};staticKey=key;}
 function query({stopAtMargin=true,invariantMode='all'}={}){
  let s;try{
   s=snapshot();rebuild(s);const allMoving=s.moving.map(worldData);
   if(invariantBaseline){if(staticKey!==invariantStaticKey)throw new Error('Static-world contract changed during sweep.');for(const d of allMoving.filter(d=>d.motionBoundMPerOpening===0)){const before=invariantBaseline.get(d.id);if(!before||!d.motionReason||before.length!==d.points.length||d.points.some((p,i)=>p.some((v,k)=>Math.abs(v-before[i][k])>1e-9)))throw new Error('Declared invariant collision geometry moved: '+d.label);}}
   if(activeEnvelopes)for(const d of allMoving.filter(d=>activeEnvelopes.has(d.id))){const original=activeEnvelopes.get(d.id);if(JSON.stringify(d.sweptEnvelope)!==JSON.stringify(original)||!envelopeContains(d.points,original))throw new Error('Analytic swept-envelope contract violated: '+d.label);}
   const isInvariant=d=>d.motionBoundMPerOpening===0||!!d.sweptEnvelope;
   const moving=allMoving.filter(d=>invariantMode==='only'?isInvariant(d):invariantMode==='exclude'?!isInvariant(d):true).map(d=>invariantMode==='only'&&d.sweptEnvelope?envelopeData(d):d),records=refineTrianglesAtJointZones(moving.flatMap(d=>d.records),s.jointZones||[]);
   if(!records.length||!cache.records.length){if(invariantMode!=='all'&&cache.records.length)return last={gapM:Infinity,residualM:Infinity,rawGapM:Infinity,physicalGapM:Infinity,emptyDomain:true,verified:s.coverage?.complete===true,geometryClear:true,coverage:s.coverage,movingMeshes:0,staticMeshes:cache.data.length};return last={gapM:NaN,verified:false,reason:'physical-collider-coverage-empty',coverage:s.coverage||null};}
   const zones=s.jointZones||[],ignored=zoneMap(zones);let result=nearestTriangleBVH(records,cache.tree,{jointZones:zones,pairMargins:s.pairMargins||[],defaultMarginM:marginM,stopAtGapM:stopAtMargin?numericalReserveM:-Infinity});
   // Relative bodies inside the moving mechanism are NOT one rigid assembly.
   // Only explicitly declared welded/rigid members omit internal tests; flexible
   // line-vs-cloth/frame pairs remain in this list and are queried at each pose.
   const movingById=new Map(allMoving.map(d=>[d.id,d])),pairTrees=new Map();
   for(const pair of s.movingPairs||[]){const a0=movingById.get(pair.meshId),b0=movingById.get(pair.colliderId);if(!a0||!b0)throw new Error('Internal moving pair refers to absent mesh: '+pair.meshId+' / '+pair.colliderId);const ia=isInvariant(a0),ib=isInvariant(b0);if(invariantMode==='only'&&!(ia&&ib)||invariantMode==='exclude'&&ia&&ib)continue;
     const a=invariantMode!=='all'&&a0.sweptEnvelope?envelopeData(a0):a0,b=invariantMode!=='all'&&b0.sweptEnvelope?envelopeData(b0):b0;
     const ar=refineTrianglesAtJointZones(a.records,zones),br=refineTrianglesAtJointZones(b.records,zones);if(!pairTrees.has(b.id))pairTrees.set(b.id,buildTriangleBVH(br));
     let q=nearestTriangleBVH(ar,pairTrees.get(b.id),{jointZones:zones,pairMargins:s.pairMargins||[],defaultMarginM:marginM,stopAtGapM:stopAtMargin?numericalReserveM:-Infinity});
     if(q.gapM>numericalReserveM){let enclosed=false;for(const[source,target,reverse]of[[a,b,false],[b,a,true]]){if(!target.closed)continue;const tree=target.tree||buildTriangleBVH(target.records);if(!tree)continue;for(const r of source.records){if(aabbDistanceSquared(r.bounds,tree)>0)continue;const inside=target.obb?triangleOBBContact(r.tri,target.obb).intersects:r.tri.some(p=>pointInsideClosedBVH(p,tree));if(!inside)continue;const permitted=target.records.some(t=>reverse?validIgnore(ignored,t,r):validIgnore(ignored,r,t));if(!permitted){const m=marginMap(s.pairMargins||[],marginM).get(a.id,b.id);q={...q,gapM:-numericalReserveM-m.marginM,residualM:-numericalReserveM-m.marginM,rawGapM:-numericalReserveM,physicalGapM:-numericalReserveM,requiredMarginM:m.marginM,containment:true,containmentKind:'internal-relative-solid'};enclosed=true;break;}}if(enclosed)break;}}
     if(q.gapM<result.gapM)result={...q,internalMovingPair:true,conservativeEnclosurePair:!!(a.invariantEnclosure||b.invariantEnclosure)};
   }
   // Surface distance alone misses a complete triangle enclosed inside a solid.
   // Inspect solid boxes by SAT and other explicitly closed meshes by parity.
   if(result.gapM>numericalReserveM){outer:for(const a of records)for(const b of cache.data){
     if(!b.closed||!b.tree||aabbDistanceSquared(a.bounds,b.tree)>0)continue;
     if(b.obb){const contact=triangleOBBContact(a.tri,b.obb);if(contact.intersects){
       // A zone is only allowed if the complete moving triangle and the relevant
       // solid-box face triangle lie in that local region. Do not ignore the body.
       const allowed=b.records.some(r=>validIgnore(ignored,a,r));if(!allowed){result={...result,gapM:-Math.max(contact.depthM,0)-marginMap(s.pairMargins||[],marginM).get(a.meshId,b.id).marginM,residualM:-Math.max(contact.depthM,0)-marginMap(s.pairMargins||[],marginM).get(a.meshId,b.id).marginM,rawGapM:-Math.max(contact.depthM,0),physicalGapM:-Math.max(contact.depthM,0),requiredMarginM:marginMap(s.pairMargins||[],marginM).get(a.meshId,b.id).marginM,pairId:a.meshId+' / '+b.id,movingId:a.meshId,colliderId:b.id,movingLabel:a.label,colliderLabel:b.label,triangleA:a.index,triangleB:-1,containment:true};break outer;}
     }}else for(const p of a.tri)if(pointInsideClosedBVH(p,b.tree)){
       const allowed=b.records.some(r=>validIgnore(ignored,a,r));if(!allowed){result={...result,gapM:-numericalReserveM-marginMap(s.pairMargins||[],marginM).get(a.meshId,b.id).marginM,residualM:-numericalReserveM-marginMap(s.pairMargins||[],marginM).get(a.meshId,b.id).marginM,rawGapM:-numericalReserveM,physicalGapM:-numericalReserveM,requiredMarginM:marginMap(s.pairMargins||[],marginM).get(a.meshId,b.id).marginM,pairId:a.meshId+' / '+b.id,movingId:a.meshId,colliderId:b.id,movingLabel:a.label,colliderLabel:b.label,triangleA:a.index,triangleB:-1,containment:true};break outer;}
     }
   }}
   if(result.gapM>numericalReserveM){outerReverse:for(const a of moving){if(!a.closed)continue;a.tree=buildTriangleBVH(a.records);if(!a.tree)continue;for(const b of cache.data){for(const r of b.records){if(aabbDistanceSquared(r.bounds,a.tree)>0)continue;for(const p of r.tri)if(pointInsideClosedBVH(p,a.tree)){const allowed=a.records.some(m=>validIgnore(ignored,m,r));if(!allowed){result={...result,gapM:-numericalReserveM-marginMap(s.pairMargins||[],marginM).get(a.id,b.id).marginM,residualM:-numericalReserveM-marginMap(s.pairMargins||[],marginM).get(a.id,b.id).marginM,rawGapM:-numericalReserveM,physicalGapM:-numericalReserveM,requiredMarginM:marginMap(s.pairMargins||[],marginM).get(a.id,b.id).marginM,pairId:a.id+' / '+b.id,movingId:a.id,colliderId:b.id,movingLabel:a.label,colliderLabel:b.label,triangleA:-1,triangleB:r.index,containment:true,containmentKind:'static-inside-moving'};break outerReverse;}}}}}}
   const coverage=s.coverage||{complete:false,scope:'undeclared',unresolved:['Coverage declaration missing.']};
   return last={...result,verified:coverage.complete===true,scope:coverage.scope||'declared-moving-vs-static',coverage,geometryClear:result.gapM>=numericalReserveM,defaultFreeMarginM:marginM,marginM,numericalReserveM,movingMeshes:moving.length,staticMeshes:cache.data.length,movingTriangles:records.length,staticTriangles:cache.records.length,relativeMovingPairs:(s.movingPairs||[]).length,staticKey};
  }catch(error){return last={gapM:NaN,verified:false,reason:'invalid-contact-query',error:String(error.message||error),coverage:s?.coverage||null};}
 }
 function sweep({t0,t1,apply,speedBoundMPerT,maxIterations=256,requireCompleteCoverage=true}={}){
   if(typeof apply!=='function')return{allowed:false,reason:'motion-application-missing',lastCertifiedT:t0};let coverage;
   apply(t0);let invariantProof=null;
   try{const initial=snapshot(),initialData=initial.moving.map(worldData),invariants=initialData.filter(d=>d.motionBoundMPerOpening===0||d.sweptEnvelope);
     for(const d of invariants.filter(d=>d.sweptEnvelope)){const range=d.sweptEnvelope.parameterRange;if(!Array.isArray(range)||range.length!==2||Math.min(t0,t1)<range[0]||Math.max(t0,t1)>range[1])throw new Error('Requested motion exceeds the declared swept-enclosure domain.');envelopeData(d);}
     if(invariants.some(d=>!d.sweptEnvelope&&!d.motionReason))throw new Error('A zero collision-motion bound needs its analytic reason.');
     if(invariants.length){invariantProof=query({invariantMode:'only',stopAtMargin:false});if(!invariantProof.geometryClear||requireCompleteCoverage&&!invariantProof.verified)return{allowed:false,reason:'invariant-body-contact-or-unverified',lastCertifiedT:t0,t:t0,query:invariantProof,scope:'declared-pair-contact-admissibility'};
       invariantBaseline=new Map(invariants.filter(d=>!d.sweptEnvelope).map(d=>[d.id,d.points]));activeEnvelopes=new Map(invariants.filter(d=>d.sweptEnvelope).map(d=>[d.id,d.sweptEnvelope]));invariantStaticKey=staticKey;}
     const evaluate=t=>{apply(t);const r=query({invariantMode:invariants.length?'exclude':'all'});coverage=r.coverage;if(requireCompleteCoverage&&!r.verified)return{...r,gapM:NaN};return r;};
     const r=conservativeSweep({evaluate,t0,t1,speedBoundMPerT,marginM:0,numericalReserveM,maxIterations});apply(r.lastCertifiedT);
     return{...r,coverage,scope:'declared-pair-contact-admissibility',invariantProof:invariantProof?{meshIds:invariants.map(d=>d.id),reasons:invariants.map(d=>d.sweptEnvelope?d.sweptEnvelope.reason:d.motionReason),conservativeEnclosures:invariants.filter(d=>d.sweptEnvelope).map(d=>({meshId:d.id,...d.sweptEnvelope})),rawGapM:invariantProof.rawGapM,requiredMarginM:invariantProof.requiredMarginM,residualM:invariantProof.residualM,staticWorldUnchanged:true}:null};
   }catch(error){apply(t0);return{allowed:false,reason:'invalid-invariant-contract',error:String(error.message||error),t:t0,lastCertifiedT:t0};}
   finally{invariantBaseline=null;invariantStaticKey=null;activeEnvelopes=null;}
 }
 return{query,sweep,refresh(){staticKey=null;cache=null;},getLast:()=>last,getCoverage:()=>last?.coverage||null,marginM,numericalReserveM};
}
