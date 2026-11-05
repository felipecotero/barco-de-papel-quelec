/**
 * F05: one continuous cable, supported by a sheave and a single-layer grooved drum.
 * SI units. Analytic kinematics, NOT a material/strength or brake-capacity model.
 * The sheave rides a level-wind carriage and self-aligns around the outgoing leg.
 * No unsupported Bezier lead and no floating helix: every curved cable segment has
 * an explicit matching support surface. Drum rotation and reserve are one material.
 */
const TAU=2*Math.PI,EPS=1e-12;
const add=(a,b)=>a.map((x,k)=>x+b[k]),sub=(a,b)=>a.map((x,k)=>x-b[k]),mul=(a,s)=>a.map(x=>x*s),dot=(a,b)=>a.reduce((s,x,k)=>s+x*b[k],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm=a=>Math.hypot(...a),unit=a=>{const n=norm(a);if(n<EPS)throw new Error('Degenerate cable/frame direction.');return mul(a,1/n);};
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x)),mod=(a,b)=>((a%b)+b)%b;
const finitePoint=p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite);
const line=(a,b,t)=>add(a,mul(sub(b,a),t));

export const CABLE_ROUTE_DEFAULTS=Object.freeze({
 drumCenterM:[0,-.25,-.9],drumAxis:[-1,0,0],drumRadialU:[0,0,1],
 drumCableRadiusM:.07,cableRadiusM:.003,groovePitchM:.01,
 helixAxialStartM:-.07,helixEntryAngleRad:0,sheavePitchRadiusM:.09,
 tangentLeadM:.35,totalCableM:4.5,minWrapAngleRad:6*Math.PI,maxWrapAngleRad:24*Math.PI,
 grooveClearanceM:.00024,supportWallM:.004
});

function frame(options={}){
 const c={...CABLE_ROUTE_DEFAULTS,...options};
 if(!finitePoint(c.drumCenterM))throw new Error('Drum center must be finite xyz.');
 const axis=unit(c.drumAxis),u0=sub(c.drumRadialU,mul(axis,dot(c.drumRadialU,axis))),u=unit(u0),v=unit(cross(axis,u));
 for(const k of['drumCableRadiusM','cableRadiusM','groovePitchM','sheavePitchRadiusM','tangentLeadM','totalCableM','maxWrapAngleRad'])if(!Number.isFinite(c[k])||c[k]<=0)throw new Error('Positive finite geometry required: '+k);
 if(c.drumCableRadiusM<=c.cableRadiusM||c.sheavePitchRadiusM<=c.cableRadiusM)throw new Error('Support radii must exceed cable radius.');
 if(c.groovePitchM<=2*c.cableRadiusM)throw new Error('Helix pitch must exceed the cable diameter.');
 if(!Number.isFinite(c.minWrapAngleRad)||c.minWrapAngleRad<0||c.minWrapAngleRad>=c.maxWrapAngleRad)throw new Error('Invalid wrap range.');
 if(!Number.isFinite(c.helixAxialStartM)||!Number.isFinite(c.helixEntryAngleRad))throw new Error('Invalid helix coordinate.');
 c.axis=axis;c.u=u;c.v=v;c.pitchPerRadM=c.groovePitchM/TAU;c.helixSpeedM=Math.hypot(c.drumCableRadiusM,c.pitchPerRadM);
 c.entryRadial=add(mul(u,Math.cos(c.helixEntryAngleRad)),mul(v,Math.sin(c.helixEntryAngleRad)));
 c.entryCircumferential=add(mul(u,-Math.sin(c.helixEntryAngleRad)),mul(v,Math.cos(c.helixEntryAngleRad)));
 c.outgoingTangent=unit(add(mul(axis,c.pitchPerRadM),mul(c.entryCircumferential,c.drumCableRadiusM)));
 return c;
}

/** Solve the pulley path for a declared amount w of supported helix. */
function atWrap(endpoint,w,c){
 const T=add(add(c.drumCenterM,mul(c.axis,c.helixAxialStartM+c.pitchPerRadM*w)),mul(c.entryRadial,c.drumCableRadiusM));
 const t=c.outgoingTangent,B=add(T,mul(t,c.tangentLeadM)),q=sub(endpoint,B),qPerp=sub(q,mul(t,dot(q,t)));
 const h=norm(qPerp);if(h<1e-8)return{valid:false,reason:'incoming-leg-collinear-with-swivel-axis'};
 const toward=mul(qPerp,1/h),G=add(B,mul(toward,c.sheavePitchRadiusM));
 const U=mul(toward,-1),V=mul(t,-1),N=unit(cross(U,V)),eg=sub(endpoint,G),ex=dot(eg,U),ey=dot(eg,V),d=Math.hypot(ex,ey),r=c.sheavePitchRadiusM;
 if(d<=r+c.cableRadiusM)return{valid:false,reason:'endpoint-inside-sheave-envelope'};
 const phi=Math.atan2(ey,ex),beta=Math.acos(clamp(r/d,-1,1));
 let selected=null;
 for(const alpha of[phi-beta,phi+beta]){
  const radial=add(mul(U,Math.cos(alpha)),mul(V,Math.sin(alpha))),A=add(G,mul(radial,r));
  const tangent=add(mul(U,-Math.sin(alpha)),mul(V,Math.cos(alpha)));
  if(dot(sub(A,endpoint),tangent)<=0)continue;
  const delta=mod(-alpha,TAU);
  const candidate={A,alpha,delta,incomingLengthM:norm(sub(A,endpoint)),incomingTangent:tangent};
  if(!selected||candidate.delta<selected.delta)selected=candidate;
 }
 if(!selected)return{valid:false,reason:'no-consistent-sheave-tangent'};
 const reserveM=c.helixSpeedM*w,arcM=r*selected.delta,activeM=selected.incomingLengthM+arcM+c.tangentLeadM;
 return{valid:true,...selected,B,T,G,U,V,N,w,reserveM,arcM,activeM,totalM:activeM+reserveM,
  drumRotationRad:c.helixEntryAngleRad-w,levelWindAxialM:c.helixAxialStartM+c.pitchPerRadM*w,
  tangentAtDrum:t,swivelAxis:{originM:B,direction:t},carriageNominalPointM:B};
}

/**
 * The root is bracketed by physical reserve capacity. The two tangent branches
 * are not blended: a singular or over-wrapped path fails instead of teleporting.
 */
export function solveCableRoute(endpoint,options={}){
 if(!finitePoint(endpoint))return{valid:false,reason:'endpoint-not-finite'};
 let c;try{c=frame(options);}catch(error){return{valid:false,reason:error.message};}
 let lo=c.minWrapAngleRad,hi=c.maxWrapAngleRad,a=atWrap(endpoint,lo,c),b=atWrap(endpoint,hi,c);
 if(!a.valid||!b.valid)return{valid:false,reason:a.reason||b.reason};
 if(a.totalM>c.totalCableM+1e-10)return{valid:false,reason:'cable-too-short-at-minimum-reserve',requiredAtMinimumM:a.totalM,totalCableM:c.totalCableM};
 if(b.totalM<c.totalCableM-1e-10)return{valid:false,reason:'single-layer-drum-capacity-exceeded',availableAtMaximumM:b.totalM,totalCableM:c.totalCableM};
 for(let k=0;k<80;k++){
  const w=(lo+hi)/2,s=atWrap(endpoint,w,c);if(!s.valid)return{valid:false,reason:s.reason};
  if(s.totalM<c.totalCableM)lo=w;else hi=w;
 }
 const r=atWrap(endpoint,(lo+hi)/2,c);if(!r.valid)return r;
 const lengths=[r.incomingLengthM,r.arcM,c.tangentLeadM,r.reserveM],edges=[0];for(const L of lengths)edges.push(edges.at(-1)+L);
 function stockPoint(f){const materialPhi=r.w*(1-f),theta=materialPhi+r.drumRotationRad;return add(add(c.drumCenterM,mul(c.axis,c.helixAxialStartM+c.pitchPerRadM*materialPhi)),add(mul(c.u,c.drumCableRadiusM*Math.cos(theta)),mul(c.v,c.drumCableRadiusM*Math.sin(theta))));}
 function arcPoint(f){const theta=r.alpha+r.delta*f;return add(r.G,add(mul(r.U,c.sheavePitchRadiusM*Math.cos(theta)),mul(r.V,c.sheavePitchRadiusM*Math.sin(theta))));}
 function pointAtDistance(s){s=clamp(s,0,c.totalCableM);if(s<=edges[1])return line(endpoint,r.A,edges[1]>0?s/edges[1]:0);if(s<=edges[2])return arcPoint((s-edges[1])/lengths[1]);if(s<=edges[3])return line(r.B,r.T,(s-edges[2])/lengths[2]);return stockPoint((s-edges[3])/lengths[3]);}
 const grooveRadiusM=c.cableRadiusM+c.grooveClearanceM,grooveCenterRadiusM=c.drumCableRadiusM+c.grooveClearanceM;
 function drumGroovePoint(materialPhi,profileAngleRad,outer=false){
  const theta=materialPhi+r.drumRotationRad,radial=add(mul(c.u,Math.cos(theta)),mul(c.v,Math.sin(theta))),circ=add(mul(c.u,-Math.sin(theta)),mul(c.v,Math.cos(theta)));
  const tangent=unit(add(mul(c.axis,c.pitchPerRadM),mul(circ,c.drumCableRadiusM))),binormal=unit(cross(tangent,radial));
  const center=add(add(c.drumCenterM,mul(c.axis,c.helixAxialStartM+c.pitchPerRadM*materialPhi)),mul(radial,grooveCenterRadiusM));
  const radius=grooveRadiusM+(outer?c.supportWallM:0);return add(center,add(mul(radial,radius*Math.cos(profileAngleRad)),mul(binormal,radius*Math.sin(profileAngleRad))));
 }
 function sheaveGroovePoint(theta,profileAngleRad,outer=false){
  const radial=add(mul(r.U,Math.cos(theta)),mul(r.V,Math.sin(theta))),center=add(r.G,mul(radial,c.sheavePitchRadiusM+c.grooveClearanceM)),radius=grooveRadiusM+(outer?c.supportWallM:0);
  return add(center,add(mul(radial,radius*Math.cos(profileAngleRad)),mul(r.N,radius*Math.sin(profileAngleRad))));
 }
 return{valid:true,scope:'single-layer-supported-cable-kinematics',endpointM:[...endpoint],entryPointM:r.T,
  sheaveCenterM:r.G,sheaveAxis:r.N,sheaveEntryM:r.A,sheaveExitM:r.B,sheaveBasisU:r.U,sheaveBasisV:r.V,
  sheaveEntryAngleRad:r.alpha,sheaveWrapAngleRad:r.delta,sheavePitchRadiusM:c.sheavePitchRadiusM,
  drumCenterM:c.drumCenterM,drumAxis:c.axis,drumRadialU:c.u,drumRadialV:c.v,drumCableRadiusM:c.drumCableRadiusM,drumCoreRadiusM:c.drumCableRadiusM-c.cableRadiusM,
  drumRotationRad:r.drumRotationRad,stockWrapAngleRad:r.w,stockTurns:r.w/TAU,stockAnchorM:stockPoint(1),stockEntryM:stockPoint(0),
  levelWindAxialM:r.levelWindAxialM,carriagePointM:r.B,swivelAxis:r.swivelAxis,
  levelWindScrewLeadMPerDrumRevolution:-c.groovePitchM,sheaveRotationRad:r.reserveM/c.sheavePitchRadiusM,
  anchorForceDirection:unit(sub(r.A,endpoint)),sheaveReactionPerUnitT:add(unit(sub(endpoint,r.A)),unit(sub(r.T,r.B))),
  drumTorqueLeverM:c.drumCableRadiusM*c.drumCableRadiusM/c.helixSpeedM,drumAxialForcePerUnitT:c.pitchPerRadM/c.helixSpeedM,
  forceDirectionGeometryDefined:true,actualFrictionMeasured:false,
  cableRadiusM:c.cableRadiusM,groovePitchM:c.groovePitchM,grooveRadiusM,grooveCenterRadiusM,grooveMaterialPhiRange:[0,c.maxWrapAngleRad],
  length:{incomingM:lengths[0],sheaveContactM:lengths[1],toDrumM:lengths[2],reserveM:lengths[3],totalM:edges.at(-1),declaredTotalM:c.totalCableM,errorM:edges.at(-1)-c.totalCableM},
  pieceRangesM:edges,pointAtDistance,pointAt:t=>pointAtDistance(clamp(t,0,1)*c.totalCableM),arcPoint,stockPoint,drumGroovePoint,sheaveGroovePoint,
  mechanicalDegreesOfFreedom:['Drum rotates about its fixed axle.','Level-wind carriage translates along drum axis.','Sheave block self-aligns around the outgoing tangent leg.'],
  noUnsupportedCurve:true,materialResponseValidated:false,hardwareSelected:false,
  support:{drum:'Cable touches the core and supported U-groove; groove and core rotate with the anchored cable end.',sheave:'Entry and exit are exact tangents to the pitch circle; the intermediate arc is supported by a real grooved wheel.',levelWind:'The sheave carriage must follow the declared axial coordinate; it is not a floating guide.'}
 };
}

export function sampleCableRoute(route,{lineSegments=1,sheaveSegments=64,stockSegments=1024}={}){
 if(!route.valid)throw new Error('Cannot sample an invalid route.');
 const points=[],parts=[],n=[lineSegments,sheaveSegments,lineSegments,stockSegments];
 for(let k=0;k<4;k++){const begin=route.pieceRangesM[k],end=route.pieceRangesM[k+1],part=[];for(let j=0;j<=n[k];j++){const p=route.pointAtDistance(begin+(end-begin)*j/n[k]);part.push(p);if(k===0||j>0)points.push(p);}parts.push(part);}
 let polylineLengthM=0;for(let i=1;i<points.length;i++)polylineLengthM+=norm(sub(points[i],points[i-1]));
 return{points,parts,polylineLengthM,analyticLengthM:route.length.totalM,chordDeficitM:route.length.totalM-polylineLengthM,scope:'Rendering chords approximate the exact continuous cable; material length is the analytic supported path.'};
}

/** Geometric checks only. Capacities, friction, D/d and bend life require the
 * actual selected cable and manufacturer data; no generic safe load is assigned. */
export function inspectCableRoute(route){
 if(!route.valid)return{valid:false,reason:route.reason};
 const start=route.pointAtDistance(0),end=route.pointAtDistance(route.length.totalM),radA=sub(route.sheaveEntryM,route.sheaveCenterM),radB=sub(route.sheaveExitM,route.sheaveCenterM),inT=unit(sub(route.sheaveEntryM,route.endpointM)),outT=unit(sub(route.entryPointM,route.sheaveExitM));
 const h=1e-6,stockT=unit(sub(route.stockPoint(h),route.stockPoint(0))),arcInT=unit(sub(route.arcPoint(h),route.arcPoint(0))),arcOutT=unit(sub(route.arcPoint(1),route.arcPoint(1-h)));
 return{valid:true,totalLengthErrorM:Math.abs(route.length.errorM),sheaveEntryTangencyM:Math.abs(dot(radA,inT)),sheaveExitTangencyM:Math.abs(dot(radB,outT)),
  stockEntryTangentMismatch:1-dot(outT,stockT),sheaveEntryTangentMismatch:1-dot(inT,arcInT),sheaveExitTangentMismatch:1-dot(outT,arcOutT),
  startErrorM:norm(sub(start,route.endpointM)),endErrorM:norm(sub(end,route.stockAnchorM)),helixPitchClearanceM:route.groovePitchM-2*route.cableRadiusM,
  coreContactRadialErrorM:Math.abs(route.drumCableRadiusM-route.cableRadiusM-route.drumCoreRadiusM),
  finite:[...route.sheaveCenterM,...route.sheaveAxis,...route.entryPointM,...route.stockAnchorM].every(Number.isFinite)};
}
