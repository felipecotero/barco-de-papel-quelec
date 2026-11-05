/**
 * F04 geometry/contact and quasi-static mechanism kernel. SI units, array vectors.
 * No hidden mass, stiffness or damping defaults. This is NOT a Cosserat/flex-rod,
 * cloth constitutive solver or certified engineering analysis. A declared motion
 * may advance only through intervals certified by its supplied displacement bound.
 */
export const PHYSICS_SCOPE = Object.freeze({
  units:'m, kg, s, N, N.m', rigidMotion:true, triangleContact:true,
  conservativeAdvancement:true, gravityEquilibrium:true,
  rodTorsion:false, clothConstitutiveModel:false, structuralApproval:false
});
const EPS=1e-12;
const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const mul=(a,s)=>[a[0]*s,a[1]*s,a[2]*s];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm2=a=>dot(a,a),norm=a=>Math.sqrt(norm2(a));
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const unit=a=>{const n=norm(a);if(n<EPS)throw new Error('Axis/vector must have nonzero length.');return mul(a,1/n);};
const vec=v=>Array.isArray(v)||ArrayBuffer.isView(v)?Array.from(v):[v.x,v.y,v.z];
const vertex=(p,i)=>[p[i*3],p[i*3+1],p[i*3+2]];
const validPoint=p=>p&&p.length===3&&p.every(Number.isFinite);
const validateTriangle=t=>{if(!t||t.length!==3||!t.every(validPoint))throw new Error('Triangle coordinates must be finite xyz.');return t;};
function pointSegmentDistanceSquared(p,a,b){const ab=sub(b,a),den=norm2(ab),q=den>EPS?clamp(dot(sub(p,a),ab)/den):0;return norm2(sub(p,add(a,mul(ab,q))));}

export function pointTriangleDistanceSquared(p,a,b,c){
  const ab=sub(b,a),ac=sub(c,a),n=cross(ab,ac);
  if(norm2(n)<EPS*EPS)return Math.min(pointSegmentDistanceSquared(p,a,b),pointSegmentDistanceSquared(p,b,c),pointSegmentDistanceSquared(p,c,a));
  const ap=sub(p,a),d1=dot(ab,ap),d2=dot(ac,ap);
  if(d1<=0&&d2<=0)return norm2(ap);
  const bp=sub(p,b),d3=dot(ab,bp),d4=dot(ac,bp);
  if(d3>=0&&d4<=d3)return norm2(bp);
  const vc=d1*d4-d3*d2;
  if(vc<=0&&d1>=0&&d3<=0){const v=d1/(d1-d3);return norm2(sub(p,add(a,mul(ab,v))));}
  const cp=sub(p,c),d5=dot(ab,cp),d6=dot(ac,cp);
  if(d6>=0&&d5<=d6)return norm2(cp);
  const vb=d5*d2-d1*d6;
  if(vb<=0&&d2>=0&&d6<=0){const w=d2/(d2-d6);return norm2(sub(p,add(a,mul(ac,w))));}
  const va=d3*d6-d5*d4;
  if(va<=0&&(d4-d3)>=0&&(d5-d6)>=0){const w=(d4-d3)/((d4-d3)+(d5-d6));return norm2(sub(p,add(b,mul(sub(c,b),w))));}
  const den=1/(va+vb+vc),v=vb*den,w=vc*den;
  return norm2(sub(p,add(a,add(mul(ab,v),mul(ac,w)))));
}
export function segmentSegmentDistanceSquared(p1,q1,p2,q2){
  const d1=sub(q1,p1),d2=sub(q2,p2),r=sub(p1,p2),a=dot(d1,d1),e=dot(d2,d2),f=dot(d2,r);let s=0,t=0;
  if(a<=EPS&&e<=EPS)return norm2(r);
  if(a<=EPS)t=clamp(f/e);
  else{const c=dot(d1,r);if(e<=EPS)s=clamp(-c/a);else{const b=dot(d1,d2),den=a*e-b*b;s=den!==0?clamp((b*f-c*e)/den):0;t=(b*s+f)/e;if(t<0){t=0;s=clamp(-c/a);}else if(t>1){t=1;s=clamp((b-c)/a);}}}
  return norm2(sub(add(p1,mul(d1,s)),add(p2,mul(d2,t))));
}
/** Segment/triangle crossing; coplanar contact is handled by distances below. */
export function segmentIntersectsTriangle(p,q,a,b,c,tolerance=1e-10){
  const dir=sub(q,p),ab=sub(b,a),ac=sub(c,a),h=cross(dir,ac),det=dot(ab,h);
  if(Math.abs(det)<EPS)return false;
  const inv=1/det,s=sub(p,a),u=inv*dot(s,h);if(u< -tolerance||u>1+tolerance)return false;
  const r=cross(s,ab),v=inv*dot(dir,r);if(v< -tolerance||u+v>1+tolerance)return false;
  const t=inv*dot(ac,r);return t>=-tolerance&&t<=1+tolerance;
}
export function triangleTriangleDistanceSquared(a,b){
  // a and b are arrays of three xyz vectors; edge crossing can occur even when
  // all vertices are outside the other triangle.
  for(let i=0;i<3;i++){if(segmentIntersectsTriangle(a[i],a[(i+1)%3],...b)||segmentIntersectsTriangle(b[i],b[(i+1)%3],...a))return 0;}
  let d=Infinity;
  for(let i=0;i<3;i++){d=Math.min(d,pointTriangleDistanceSquared(a[i],...b),pointTriangleDistanceSquared(b[i],...a));for(let j=0;j<3;j++)d=Math.min(d,segmentSegmentDistanceSquared(a[i],a[(i+1)%3],b[j],b[(j+1)%3]));}
  return Math.max(0,d);
}
export const triangleTriangleDistance=(a,b)=>Math.sqrt(triangleTriangleDistanceSquared(a,b));
export const triangleBounds=t=>({min:[0,1,2].map(k=>Math.min(...t.map(p=>p[k]))),max:[0,1,2].map(k=>Math.max(...t.map(p=>p[k])))});
export function aabbDistanceSquared(a,b){let d=0;for(let k=0;k<3;k++){const s=Math.max(0,a.min[k]-b.max[k],b.min[k]-a.max[k]);d+=s*s;}return d;}
function transformToBox(p,box){const q=sub(p,box.center);return box.axes.map(axis=>dot(q,axis));}
/** OBB axes are three mutually orthonormal world-space column vectors. */
export function validateOBB(box){
  const half=box.halfExtents,axes=box.axes||[[1,0,0],[0,1,0],[0,0,1]];
  if(!Array.isArray(half)||half.length!==3||half.some(x=>!Number.isFinite(x)||x<=0))throw new Error('OBB requires positive halfExtents.');
  if(!validPoint(box.center)||!Array.isArray(axes)||axes.length!==3||!axes.every(validPoint))throw new Error('OBB needs finite center and axes.');
  for(let i=0;i<3;i++){if(Math.abs(norm(axes[i])-1)>1e-7)throw new Error('OBB axes must be normalized.');for(let j=0;j<i;j++)if(Math.abs(dot(axes[i],axes[j]))>1e-7)throw new Error('OBB axes must be orthogonal.');}
  return{...box,center:vec(box.center),halfExtents:half,axes};
}
/** Exact triangle/solid-box SAT, not a vertices-only test. */
export function triangleOBBContact(triangle,inputBox){
  const box=validateOBB(inputBox),tri=triangle.map(p=>transformToBox(p,box)),e=[sub(tri[1],tri[0]),sub(tri[2],tri[1]),sub(tri[0],tri[2])],basis=[[1,0,0],[0,1,0],[0,0,1]],axes=[...basis,cross(e[0],e[1])];
  for(const edge of e)for(const axis of basis)axes.push(cross(edge,axis));
  let minTranslation=Infinity,minAxis=null;
  for(const axis of axes){const n=norm(axis);if(n<EPS)continue;const a=mul(axis,1/n),p=tri.map(v=>dot(a,v)),lo=Math.min(...p),hi=Math.max(...p),r=dot(box.halfExtents,a.map(Math.abs));if(lo>r+1e-10||hi< -r-1e-10)return{intersects:false};const dep=Math.min(r-lo,hi+r);if(dep<minTranslation){minTranslation=Math.max(0,dep);minAxis=a;}}
  return{intersects:true,depthM:Number.isFinite(minTranslation)?minTranslation:0,localAxis:minAxis,colliderId:box.id||null};
}
export function boxTriangles(inputBox){
  const b=validateOBB(inputBox),p=[];for(let i=0;i<8;i++){let q=[...b.center];for(let k=0;k<3;k++)q=add(q,mul(b.axes[k],b.halfExtents[k]*((i>>k)&1?1:-1)));p.push(q);}
  const ids=[[0,2,3],[0,3,1],[4,5,7],[4,7,6],[0,1,5],[0,5,4],[2,6,7],[2,7,3],[0,4,6],[0,6,2],[1,3,7],[1,7,5]];return ids.map(t=>t.map(i=>p[i]));
}
export function triangleOBBClearance(triangle,box){
  const contact=triangleOBBContact(triangle,box);if(contact.intersects)return{gapM:-contact.depthM,...contact};
  let d2=Infinity;for(const tri of boxTriangles(box))d2=Math.min(d2,triangleTriangleDistanceSquared(triangle,tri));return{intersects:false,gapM:Math.sqrt(d2),colliderId:box.id||null};
}
export function meshTriangles(mesh){
  const{positions,indices}=mesh,out=[];
  if(!positions||positions.length%3||!Array.from(positions).every(Number.isFinite))throw new Error('Mesh positions must be finite flat xyz.');
  const ids=indices||Array.from({length:positions.length/3},(_,i)=>i);if(ids.length%3||Array.from(ids).some(i=>!Number.isInteger(i)||i<0||i>=positions.length/3))throw new Error('Mesh requires valid triangle indices.');
  for(let i=0;i<ids.length;i+=3)out.push([vertex(positions,ids[i]),vertex(positions,ids[i+1]),vertex(positions,ids[i+2])]);return out;
}
/** Minimum clearance against declared SOLID boxes, including triangles entirely
 * inside a box. Ignore permits only a declared local joint/attachment region. */
export function minimumMeshOBBClearance(mesh,boxes,{ignoreTriangle=null,stopAtGapM=-Infinity}={}){
  const triangles=(mesh.triangles||meshTriangles(mesh)).map(validateTriangle);let result={emptyDomain:boxes.length===0,gapM:Infinity,meshId:mesh.id||null,colliderId:null,triangleIndex:-1,testedTriangles:0};
  for(const box0 of boxes){const box=validateOBB(box0),faceTris=boxTriangles(box);for(let i=0;i<triangles.length;i++){
    const tri=triangles[i];if(ignoreTriangle&&ignoreTriangle({meshId:mesh.id,colliderId:box.id,triangle:tri,triangleIndex:i}))continue;
    const contact=triangleOBBContact(tri,box);let gapM;
    if(contact.intersects)gapM=-contact.depthM;else{let d2=Infinity;for(const face of faceTris)d2=Math.min(d2,triangleTriangleDistanceSquared(tri,face));gapM=Math.sqrt(d2);}
    result.testedTriangles++;if(gapM<result.gapM)result={...result,...contact,gapM,colliderId:box.id||null,triangleIndex:i};if(gapM<=stopAtGapM)return result;
  }}return result;
}
/** Explicit connection-zone helper. Entire triangle must be within the declared
 * spherical joint zone, and the exact pair must match. Never ignore whole objects. */
export function makeJointZoneIgnore(zones=[]){
 return({meshId,colliderId,triangle})=>zones.some(z=>z.meshId===meshId&&z.colliderId===colliderId&&Number.isFinite(z.radiusM)&&z.radiusM>0&&triangle.every(p=>norm(sub(p,z.center))<=z.radiusM));
}
/** Surface-vs-surface clearance. Closed-solid containment must be checked by an
 * appropriate solid test (OBB above, convex SDF or winding test), not inferred. */
export function minimumTriangleMeshClearance(meshA,meshB,{ignorePair=null,stopAtGapM=-Infinity}={}){
 const A=(meshA.triangles||meshTriangles(meshA)).map(validateTriangle),B=(meshB.triangles||meshTriangles(meshB)).map(validateTriangle),boundsB=B.map(triangleBounds);let min2=Infinity,result={gapM:Infinity,pairId:(meshA.id||'a')+' / '+(meshB.id||'b'),triangleA:-1,triangleB:-1,testedPairs:0};
 for(let i=0;i<A.length;i++){const ba=triangleBounds(A[i]);for(let j=0;j<B.length;j++){
  if(aabbDistanceSquared(ba,boundsB[j])>min2)continue;if(ignorePair&&ignorePair({triangleA:A[i],triangleB:B[j],indexA:i,indexB:j}))continue;
  result.testedPairs++;const d2=triangleTriangleDistanceSquared(A[i],B[j]);if(d2<min2){min2=d2;result={...result,gapM:Math.sqrt(d2),triangleA:i,triangleB:j};if(result.gapM<=stopAtGapM)return result;}
 }}return result;
}
/** A path is approved only over intervals bounded by clearance(t)-L*dt >= margin.
 * L MUST bound the relative displacement of EVERY point in every tested pair.
 * Unknown/invalid L fails closed. This is a conservative geometric guard, not CCD
 * contact impulses or deformable-body dynamics. maxIterations fails closed too. */
export function conservativeSweep({evaluate,t0=0,t1=1,speedBoundMPerT,marginM=0,numericalReserveM=1e-7,minParameterStep=1e-8,maxIterations=256,safetyFactor=.8,blockingRetreatM=1e-4}={}){
 const fail=(reason,extra={})=>({allowed:false,reason,t:t0,lastCertifiedT:t0,requestedT:t1,certified:false,...extra});
 if(typeof evaluate!=='function'||![t0,t1,speedBoundMPerT,marginM,numericalReserveM].every(Number.isFinite)||speedBoundMPerT<0||marginM<0||numericalReserveM<0)return fail('invalid-or-unknown-motion-bound');
 const dir=Math.sign(t1-t0)||1,L=speedBoundMPerT,required=marginM+numericalReserveM,intervals=[];let t=t0,iterations=0;
 const sample=t=>{try{const r=evaluate(t);return typeof r==='number'?{gapM:r}:r;}catch(error){return{gapM:NaN,error:String(error.message||error)};}};
 const validQuery=r=>r&&(Number.isFinite(r.gapM)||r.gapM===Infinity&&r.emptyDomain===true);let current=sample(t);
 if(!validQuery(current))return fail('invalid-clearance-query',{query:current});
 if(current.gapM<required)return fail('initial-contact-or-insufficient-clearance',{query:current,collisionId:current.colliderId||current.pairId||null});
 while(t!==t1){
  if(iterations++>=maxIterations)return fail('iteration-budget-no-proof',{t,lastCertifiedT:t,query:current,intervals,iterations,collisionId:current.colliderId||current.pairId||null});
  const remaining=Math.abs(t1-t),available=current.gapM-required;
  let dt=L===0||current.gapM===Infinity?remaining:Math.min(remaining,Math.max(0,available/L)*clamp(safetyFactor,.05,.95));
  // If the full remaining interval is bounded, do not asymptotically stop short.
  if(L===0||current.gapM-L*remaining>=required)dt=remaining;
  if(dt<minParameterStep)return fail('blocked-before-contact',{t,lastCertifiedT:t,query:current,intervals,iterations,collisionId:current.colliderId||current.pairId||null,unresolvedInterval:[t,t1]});
  const nextT=dt===remaining?t1:t+dir*dt,next=sample(nextT);if(!validQuery(next))return fail('invalid-clearance-query',{t,lastCertifiedT:t,query:next,intervals,iterations});
  if(next.gapM<required-1e-10||Math.abs(next.gapM-current.gapM)>L*dt+1e-7&&Number.isFinite(next.gapM)&&Number.isFinite(current.gapM))return fail('supplied-motion-bound-violated',{t,lastCertifiedT:t,attemptedT:nextT,query:next,intervals,iterations,collisionId:next.colliderId||next.pairId||null});
  if(next.gapM<current.gapM&&next.gapM<required+Math.max(0,blockingRetreatM))return fail('blocked-before-contact',{t,lastCertifiedT:t,query:current,attemptedT:nextT,intervals,iterations,collisionId:next.colliderId||next.pairId||null,blockingRetreatM});
  intervals.push({from:t,to:nextT,clearanceLowerBoundM:current.gapM-L*dt,requiredMarginM:marginM});t=nextT;current=next;
 }
 return{allowed:true,reason:'intervals-certified-under-declared-bound',t:t1,lastCertifiedT:t1,requestedT:t1,query:current,intervals,iterations,certified:true,scope:'geometric-contact-guard',speedBoundMPerT,marginM};
}
export function rotateAroundAxis(point,root,axis,angleRad){const u=unit(axis),p=sub(point,root),c=Math.cos(angleRad),s=Math.sin(angleRad);return add(root,add(add(mul(p,c),mul(cross(u,p),s)),mul(u,dot(u,p)*(1-c))));}
export function rigidAngularMotionBound(points,root,axis,deltaAngleRad){const u=unit(axis);let radius=0;for(const p of points){const r=sub(p,root),perp=sub(r,mul(u,dot(r,u)));radius=Math.max(radius,norm(perp));}return{maxRadiusM:radius,angleRad:Math.abs(deltaAngleRad),speedBoundMPerT:radius*Math.abs(deltaAngleRad),assumption:'Linear angle in normalized parameter; add translation and other-body motion bounds if present.'};}
export function inspectRestLengths(referenceSegments,currentSegments,{absoluteToleranceM=1e-7,relativeTolerance=1e-8}={}){
 if(referenceSegments.length!==currentSegments.length)throw new Error('Segment sets must match.');let maxAbsoluteErrorM=0,maxRelativeError=0,firstViolation=-1;
 for(let i=0;i<referenceSegments.length;i++){const r=norm(sub(...referenceSegments[i])),c=norm(sub(...currentSegments[i])),e=Math.abs(r-c),rel=e/Math.max(r,EPS);maxAbsoluteErrorM=Math.max(maxAbsoluteErrorM,e);maxRelativeError=Math.max(maxRelativeError,rel);if(firstViolation<0&&e>absoluteToleranceM+relativeTolerance*r)firstViolation=i;}
 return{preserved:firstViolation<0,maxAbsoluteErrorM,maxRelativeError,firstViolation};
}
/** Geometry only; mass is deliberately not guessed from volume or visual material. */
export function uniformSurfaceProperties(mesh){
 const triangles=mesh.triangles||meshTriangles(mesh);let areaM2=0,weighted=[0,0,0];for(const[a,b,c]of triangles){const A=norm(cross(sub(b,a),sub(c,a)))/2;areaM2+=A;weighted=add(weighted,mul(add(add(a,b),c),A/3));}
 return{areaM2,centroidM:areaM2>EPS?mul(weighted,1/areaM2):null,assumption:'Uniform area density; NOT measured real mass distribution.'};
}
export function uniformLineProperties(segments){let lengthM=0,weighted=[0,0,0];for(const[a,b]of segments){const L=norm(sub(b,a));lengthM+=L;weighted=add(weighted,mul(add(a,b),L/2));}return{lengthM,centroidM:lengthM>EPS?mul(weighted,1/lengthM):null,assumption:'Uniform line density; NOT measured hardware or real center of mass.'};}
export function cableConstraint({attachment,guide,paidOutM,toleranceM=1e-6}={}){
 const requiredLengthM=norm(sub(guide,attachment));if(!Number.isFinite(paidOutM)||paidOutM<0)return{known:false,requiredLengthM,status:'paid-out-length-unmeasured'};
 const slackM=paidOutM-requiredLengthM;return{known:true,requiredLengthM,paidOutM,slackM,violationM:Math.max(0,-slackM),admissible:slackM>=-toleranceM,status:slackM< -toleranceM?'too-short':slackM>toleranceM?'slack':'taut',unilateral:true};
}
/** Quasi-static gravity balance about ONE hinge axis. Does not integrate motion,
 * spring recovery, motor torque, inertia, friction, wind or stop impacts. */
export function evaluateHingeEquilibrium({axis,root,com,massKg,attachment,guide,gravityMps2=[0,-9.80665,0],leverToleranceM=1e-8}={}){
 const u=unit(axis),r=sub(com,root),tauPerKg=dot(u,cross(r,gravityMps2)),rope=sub(guide,attachment),L=norm(rope);
 const lever=L>EPS?dot(u,cross(sub(attachment,root),mul(rope,1/L))):0;
 const known=Number.isFinite(massKg)&&massKg>0;
 const out={scope:'quasi-static-single-axis',idealGuideAssumption:true,forceRoutingValidated:false,physicalTensionPrediction:false,requiredPhysicalChecks:['Real rope contact/tangency or attachment must provide the guide reaction.','Reel support, brake, friction and take-up path must be selected and checked.','Mass and center of mass must be measured or explicitly treated as a scenario.'],massKnown:known,massKg:known?massKg:null,gravityTorquePerKgNm:tauPerKg,ropeLeverArmM:lever,requiredLengthM:L,gravityTorqueNm:known?tauPerKg*massKg:null,tensionN:null,feasibleWithTension:null};
 if(!known)return{...out,status:'mass-and-center-of-mass-require-measurement'};
 if(Math.abs(lever)<leverToleranceM)return{...out,status:'rope-dead-center-no-useful-lever',feasibleWithTension:Math.abs(out.gravityTorqueNm)<1e-9};
 const T=-out.gravityTorqueNm/lever;if(T< -1e-9)return{...out,status:'rope-would-have-to-push',feasibleWithTension:false,requiredSignedForceN:T};
 return{...out,status:'positive-tension-equilibrium-only',feasibleWithTension:true,tensionN:Math.max(0,T)};
}
