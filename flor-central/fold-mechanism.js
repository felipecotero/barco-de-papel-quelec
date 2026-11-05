/**
 * F05 candidate: one-DOF Miura articulated petal, metres/radians.
 * This is an ALTERNATIVE to a continuous spring-steel flex, not its recovery model.
 * Each face is moved by an exact isometry; no animated scaling is used.
 * The fabric is separate planar panels with true hinge slots and a root notch.
 * Reference frame sections/offsets are geometry, not selected structural sections.
 * Finite hinge hardware, material forces and support/drive design remain separate.
 * Geometry basis: Schenk & Guest, PNAS 2013, doi:10.1073/pnas.1217998110.
 */
export const MIURA_SCOPE=Object.freeze({model:'rigid-facet-articulated-alternative',continuousFlex:false,faceIsometry:true,idealSurfaceInjective:true,constitutiveMaterialModel:false,hardwareApproved:false});
const EPS=1e-10,rad=d=>d*Math.PI/180,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const sub=(a,b)=>a.map((v,k)=>v-b[k]),add=(a,b)=>a.map((v,k)=>v+b[k]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a.reduce((s,v,k)=>s+v*b[k],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],len=a=>Math.hypot(...a),unit=a=>mul(a,1/len(a));
const cross2=(a,b)=>a[0]*b[1]-a[1]*b[0],sub2=(a,b)=>[a[0]-b[0],a[1]-b[1]];
function cleanPolygon(poly){const out=[];for(const p of poly)if(!out.length||Math.hypot(...sub2(p,out.at(-1)))>1e-9)out.push(p);if(out.length>1&&Math.hypot(...sub2(out[0],out.at(-1)))<1e-9)out.pop();return out;}
function area2(poly){let a=0;for(let i=0;i<poly.length;i++)a+=cross2(poly[i],poly[(i+1)%poly.length]);return a/2;}
function clipHalfplane(subject,a,b,inset=0){if(!subject.length)return[];const e=sub2(b,a),L=Math.hypot(...e),D=p=>cross2(e,sub2(p,a))-inset*L,out=[];let prev=subject.at(-1),dp=D(prev);for(const cur of subject){const dc=D(cur),pin=dp>=-EPS,cin=dc>=-EPS;if(pin!==cin){const t=dp/(dp-dc);out.push([prev[0]+(cur[0]-prev[0])*t,prev[1]+(cur[1]-prev[1])*t]);}if(cin)out.push([...cur]);prev=cur;dp=dc;}return cleanPolygon(out);}
function clipConvex(subject,clip){let p=subject;for(let j=0;j<clip.length&&p.length;j++)p=clipHalfplane(p,clip[j],clip[(j+1)%clip.length]);return p;}
function insetConvex(poly,d){let p=poly.map(v=>[...v]);for(let j=0;j<poly.length&&p.length;j++)p=clipHalfplane(p,poly[j],poly[(j+1)%poly.length],d);return p;}
function bounds(points){const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(const p of points)for(let k=0;k<3;k++){min[k]=Math.min(min[k],p[k]);max[k]=Math.max(max[k],p[k]);}return{min,max,size:max.map((v,k)=>v-min[k])};}
const pointKey=p=>p.map(v=>Math.round(v*1e8)).join(',');
export function createMiuraPetal(options={}){
 const cfg={lengthM:4,widthM:3.5,nx:8,ny:4,alphaDeg:80,openPhiDeg:12,storedPhiDeg:79,outlinePower:.68,outlineSamples:24,heightSign:1,frameInsetM:.065,framePlaneOffsetM:-.0022,frameRadiusM:.002,fabricGapInsetM:.030,rootNeckM:.12,anchorServiceNotchM:.050,omitUnframedFaces:true,...options};
 const {lengthM,widthM,nx,ny,outlinePower}=cfg;
 if(!Number.isInteger(nx)||nx<2||nx%2||!Number.isInteger(ny)||ny<2||ny%2||!(lengthM>0&&widthM>0)||!(outlinePower>0&&outlinePower<=1))throw new Error('Use positive dimensions, even grid counts and convex leaf exponent0<p<=1.');
 if(![1,-1].includes(cfg.heightSign))throw new Error('heightSign must be1 or-1: mirror choice is fixed at design time.');
 const alpha=rad(cfg.alphaDeg),openPhi=rad(cfg.openPhiDeg),storedPhi=rad(cfg.storedPhiDeg);
 if(!(0<=openPhi&&openPhi<storedPhi&&storedPhi<alpha&&alpha<Math.PI/2))throw new Error('Require0<=openPhi<storedPhi<alpha<90degrees; flat folding/contact is deliberately not used.');
 const transverseFactor=Math.sqrt(1-(Math.cos(alpha)/Math.cos(openPhi))**2),b=widthM/(ny*transverseFactor),Vopen=b*Math.cos(alpha)/Math.cos(openPhi),a=(lengthM+Vopen)/(nx*Math.cos(openPhi));
 // The complete crease grid contains the entire projected4x3.5leaf in its open state.
 const offsetX=-Vopen,offsetY=-widthM/2;
 function parameters(phi){const L=a*Math.cos(phi),H=cfg.heightSign*a*Math.sin(phi),V=b*Math.cos(alpha)/Math.cos(phi),W=Math.sqrt(Math.max(0,b*b-V*V));return{L,H,V,W,a,b,alphaRad:alpha,phiRad:phi};}
 const opened=parameters(openPhi);
 function node(i,j,g){return[i*g.L+(j%2)*g.V+offsetX,j*g.W+offsetY,(i%2)*g.H];}
 function basis(i,j,g){return{A:node(i,j,g),U:[g.L,0,(i%2?-1:1)*g.H],V:[(j%2?-1:1)*g.V,g.W,0]};}
 function projectedUV(p,i,j,g=opened){const z=basis(i,j,g),v=(p[1]-z.A[1])/g.W,u=(p[0]-z.A[0]-v*z.V[0])/g.L;return[u,v];}
 function localPoint(uv,i,j,g){const z=basis(i,j,g);return add(z.A,add(mul(z.U,uv[0]),mul(z.V,uv[1])));}
 const midRow=ny/2,rootUV=projectedUV([0,0],0,midRow),rootAt=g=>localPoint(rootUV,0,midRow,g);
 function placed(uv,i,j,g){return sub(localPoint(uv,i,j,g),rootAt(g));}
 const leaf=[];for(let k=0;k<=cfg.outlineSamples;k++){const x=lengthM*k/cfg.outlineSamples,y=widthM/2*Math.sin(Math.PI*k/cfg.outlineSamples)**outlinePower;leaf.push([x,-y]);}for(let k=cfg.outlineSamples-1;k>0;k--){const x=lengthM*k/cfg.outlineSamples,y=widthM/2*Math.sin(Math.PI*k/cfg.outlineSamples)**outlinePower;leaf.push([x,y]);}
 if(area2(leaf)<0)leaf.reverse();
 const allFacets=[];
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
  const z=basis(i,j,opened),quad=[z.A,add(z.A,z.U),add(add(z.A,z.U),z.V),add(z.A,z.V)].map(p=>p.slice(0,2)),polygon=clipConvex(quad,leaf);
  if(polygon.length<3||area2(polygon)<1e-9)continue;
  const uv=polygon.map(p=>projectedUV(p,i,j)),materialPolygon2D=uv.map(q=>localPoint(q,i,j,parameters(0)).slice(0,2));
  allFacets.push({id:'MF_'+i+'_'+j,cell:[i,j],openPolygon2D:polygon,materialPolygon2D,uv,materialAreaM2:area2(materialPolygon2D)});
 }
 // These notches are cut out of the FIXED pattern, not hidden as the fold moves.
 // Omitting the two acute default-grid root tips removes frames which cannot fit.
 const omittedFacets=cfg.omitUnframedFaces?allFacets.filter(f=>insetConvex(f.materialPolygon2D,cfg.frameInsetM).length<3):[];
 const omittedIds=new Set(omittedFacets.map(f=>f.id)),facets=allFacets.filter(f=>!omittedIds.has(f.id));
 const edgeMap=new Map();
 for(const f of facets)for(let k=0;k<f.uv.length;k++){
  const v1=f.openPolygon2D[k],v2=f.openPolygon2D[(k+1)%f.uv.length],key=[pointKey(v1),pointKey(v2)].sort().join('|');
  if(!edgeMap.has(key))edgeMap.set(key,[]);edgeMap.get(key).push({faceId:f.id,uv:[f.uv[k],f.uv[(k+1)%f.uv.length]],referenceEndpoints:[v1,v2]});
 }
 const hinges=[],boundarySegments=[];
 for(const entries of edgeMap.values())if(entries.length===2){const a=entries[0],b=entries[1];hinges.push({id:'MH_'+hinges.length,faceIds:[a.faceId,b.faceId],sides:entries,referenceEndpoints:a.referenceEndpoints});}else if(entries.length===1)boundarySegments.push({id:'MB_'+boundarySegments.length,...entries[0]});else throw new Error('Nonmanifold crease graph.');
 const facetMap=new Map(facets.map(f=>[f.id,f]));
 const creaseKeys=new Set(hinges.map(h=>h.referenceEndpoints.map(pointKey).sort().join('|')));
 const g0=parameters(0);
 for(const f of facets){
  let fabric=f.materialPolygon2D.map(p=>[...p]);
  const sharedMaterialEdges=[];
  for(let k=0;k<f.uv.length;k++){
   const next=(k+1)%f.uv.length,key=[pointKey(f.openPolygon2D[k]),pointKey(f.openPolygon2D[next])].sort().join('|');
   if(creaseKeys.has(key)){
    const e=[f.materialPolygon2D[k],f.materialPolygon2D[next]];
    sharedMaterialEdges.push(e);fabric=clipHalfplane(fabric,...e,Math.max(0,cfg.fabricGapInsetM));
   }
  }
  // A real, fixed opening leaves the root cardan outside the fabric, not in it.
  // Transform this open-projection cut line into this facet's material plane.
  if(cfg.rootNeckM>0){const neckLine=[[cfg.rootNeckM,widthM/2+1],[cfg.rootNeckM,-widthM/2-1]].map(p=>localPoint(projectedUV(p,...f.cell),...f.cell,g0).slice(0,2));fabric=clipHalfplane(fabric,...neckLine);}
  // Real service clearance for the two-axis terminal at fixed material Q.
  // Q lies about26mm outside the default perimeter; this removes about24mm
  // extra from that panel edge, rather than letting a ring pierce the cloth.
  if(f.id==='MF_3_3'&&cfg.anchorServiceNotchM>0){const y=1.7782921918309074-cfg.anchorServiceNotchM;fabric=clipHalfplane(fabric,[lengthM+1,y],[-1,y]);}
  const z0=basis(...f.cell,g0),toUV=p=>{const v=(p[1]-z0.A[1])/g0.W,u=(p[0]-z0.A[0]-v*z0.V[0])/g0.L;return[u,v];};
  f.fabricPolygon2D=fabric;f.fabricUV=fabric.map(toUV);f.fabricAreaM2=area2(fabric);f.sharedMaterialEdges=sharedMaterialEdges;
 }
 const rootFacetId='MF_0_'+midRow,rootFacet=facetMap.get(rootFacetId);if(!rootFacet)throw new Error('Root material point needs an existing facet.');
 const driveHinge=hinges.find(h=>h.faceIds.includes(rootFacetId)&&h.faceIds.some(id=>facetMap.get(id).cell[0]===1&&facetMap.get(id).cell[1]===midRow))||hinges.find(h=>h.faceIds.includes(rootFacetId));
 if(!driveHinge)throw new Error('No root-adjacent drive hinge exists.');
 function mapEdge(e,g){const f=facetMap.get(e.faceId);return e.uv.map(p=>placed(p,...f.cell,g));}
 function cardanAt(g,leafPitchRad){
  if(!Number.isFinite(leafPitchRad))throw new Error('Cardan leaf pitch must be finite radians.');
  const rowSign=midRow%2?-1:1,outerYRad=-cfg.heightSign*g.phiRad-leafPitchRad,innerXRad=Math.atan2(-cfg.heightSign*rowSign*g.V*Math.sin(g.phiRad),g.W),c=Math.cos(outerYRad),s=Math.sin(outerYRad),cb=Math.cos(innerXRad),sb=Math.sin(innerXRad);
  return{outerYRad,innerXRad,outerYDeg:outerYRad*180/Math.PI,innerXDeg:innerXRad*180/Math.PI,leafPitchRad,phiRad:g.phiRad,rootFacetId,xAxis:[c,0,-s],yAxis:[s*sb,cb,c*sb],zAxis:[s*cb,-sb,c*cb],outerAxis:[0,1,0],innerAxis:[c,0,-s],jointOrder:'Ry(outerYRad) then Rx(innerXRad), about intersecting Y/X axes at the fixed root point',requiresPositiveActuation:true};
 }
 function rootCardanAngles(progress=1,leafPitchRad=0){const q=clamp(Number(progress)||0);return cardanAt(parameters(storedPhi+(openPhi-storedPhi)*q),leafPitchRad);}
 function state(progress=1,{frameInsetM=cfg.frameInsetM,framePlaneOffsetM=cfg.framePlaneOffsetM,pinSetbackM=.04,leafPitchRad=0}={}){
  const q=clamp(Number(progress)||0),phi=storedPhi+(openPhi-storedPhi)*q,g=parameters(phi),positions=[],indices=[],textureUV=[],facePolygons=[],idealFacePolygons=[],framePolygons=[],frameBraceSegments=[],faceTransforms=[];
  for(const f of facets){const [i,j]=f.cell,start=positions.length/3,points=f.fabricUV.map(p=>placed(p,i,j,g)),idealPoints=f.uv.map(p=>placed(p,i,j,g)),normal=unit(cross(basis(i,j,g).U,basis(i,j,g).V));
   for(let k=0;k<points.length;k++){positions.push(...points[k]);const p=localPoint(f.fabricUV[k],i,j,opened);textureUV.push(p[0]/lengthM,.5+p[1]/widthM);}for(let k=1;k<points.length-1;k++)indices.push(start,start+k,start+k+1);
   facePolygons.push({id:f.id,cell:f.cell,points,normal,materialAreaM2:f.fabricAreaM2});
   idealFacePolygons.push({id:f.id,cell:f.cell,points:idealPoints,normal,materialAreaM2:f.materialAreaM2});
   // A constant material-plane mesh can use this rigid body transform directly.
   // No per-vertex deformation, scale or animated cutting is needed in a renderer.
   const current=basis(i,j,g),flat=basis(i,j,g0),rowSign=j%2?-1:1,ex=mul(current.U,1/a),ey=mul(sub(current.V,mul(current.U,rowSign*b*Math.cos(alpha)/a)),1/(b*Math.sin(alpha))),ez=cross(ex,ey),translationM=sub(placed([0,0],i,j,g),add(mul(ex,flat.A[0]),mul(ey,flat.A[1])));
   faceTransforms.push({faceId:f.id,translationM,rotationColumns:[ex,ey,ez],materialPlaneZ:0});
   const inset=insetConvex(f.materialPolygon2D,Math.max(0,frameInsetM)),z0=basis(i,j,g0);
   const pointsInset=inset.map(p=>{const v=(p[1]-z0.A[1])/g0.W,u=(p[0]-z0.A[0]-v*z0.V[0])/g0.L;return add(placed([u,v],i,j,g),mul(normal,framePlaneOffsetM));});
   if(pointsInset.length>=3){framePolygons.push({id:f.id+'_frame',faceId:f.id,points:pointsInset,normal,planeOffsetM:framePlaneOffsetM,radiusM:cfg.frameRadiusM});for(let k=2;k<pointsInset.length-1;k++)frameBraceSegments.push({id:f.id+'_brace_'+k,faceId:f.id,points:[pointsInset[0],pointsInset[k]],radiusM:cfg.frameRadiusM});}
  }
  const faceById=new Map(facePolygons.map(f=>[f.id,f]));
  const hingeSegments=hinges.map(h=>{const points=mapEdge(h.sides[0],g),mid=mul(add(...points),.5),direction=unit(sub(points[1],points[0])),edgeLength=len(sub(points[1],points[0])),actualSetback=Math.min(pinSetbackM,.2*edgeLength),half=Math.max(0,Math.min(.05,edgeLength/2-actualSetback));const na=faceById.get(h.faceIds[0]).normal,nb=faceById.get(h.faceIds[1]).normal,dihedralRad=Math.atan2(dot(direction,cross(na,nb)),clamp(dot(na,nb),-1,1));return{id:h.id,faceIds:h.faceIds,points,axisM:direction,dihedralRad,dihedralDeg:dihedralRad*180/Math.PI,pinEnds:[add(mid,mul(direction,-half)),add(mid,mul(direction,half))],pinLengthM:half*2,pinSetbackM:actualSetback};});
  const border=boundarySegments.map(e=>({id:e.id,faceId:e.faceId,points:mapEdge(e,g)}));
  const flatPoints=[];for(let k=0;k<positions.length;k+=3)flatPoints.push(positions.slice(k,k+3));const box=bounds(flatPoints);
  const rb=basis(...rootFacet.cell,g),rootX=unit(rb.U),rootZ=unit(cross(rb.U,rb.V)),rootY=cross(rootZ,rootX),rootFacetFrame={origin:[0,0,0],xAxis:rootX,yAxis:rootY,zAxis:rootZ,faceId:rootFacetId,meaning:'Material frame of the root facet; a fixed clamp with only whole-petal pitch cannot follow this orientation while Miura folds.'};
  const unframedFaceIds=facePolygons.filter(f=>!framePolygons.some(p=>p.faceId===f.id)).map(f=>f.id);
  return{progress:q,phiDeg:phi*180/Math.PI,parameters:g,positions,indices,uv:textureUV,facePolygons,idealFacePolygons,faceTransforms,framePolygons,frameBraceSegments,hingeSegments,boundarySegments:border,bounds:box,rootMaterialPoint:[0,0,0],rootFacetFrame,rootCardanAngles:cardanAt(g,leafPitchRad),driveHinge:hingeSegments.find(h=>h.id===driveHinge.id),unframedFaceIds,scope:MIURA_SCOPE,metrics:{faceCount:facets.length,hingeCount:hinges.length,materialAreaM2:facets.reduce((n,f)=>n+f.fabricAreaM2,0),idealMaterialAreaM2:facets.reduce((n,f)=>n+f.materialAreaM2,0),omittedFaceIds:omittedFacets.map(f=>f.id),omittedIdealAreaM2:omittedFacets.reduce((n,f)=>n+f.materialAreaM2,0),fabricGapInsetM:cfg.fabricGapInsetM,rootNeckM:cfg.rootNeckM,L:g.L,W:g.W,positiveProjectionJacobian:g.L*g.W,idealSurfaceNoCrossing:g.L>0&&g.W>0,continuousProof:'The uncut crease grid projects bijectively onto consecutive y-bands and consecutive x-cells at each y. L>0 and W>0 throughout the prescribed interval. Fixed notches and hinge slots remove material; trimming to a subset cannot create an overlap.',frameInsetM,framePlaneOffsetM,frameRadiusM:cfg.frameRadiusM,braceCount:frameBraceSegments.length,pinSetbackM,finiteHingeHardwareValidated:false,rootCarrierOrientationFreedomRequired:true,positiveMiuraActuatorRequired:true,unframedFaceIds,localReinforcementRequired:unframedFaceIds.length>0,zeroRadiusClothCreaseAssumption:false,fabricPanelsSeparateAtHinges:true}};
 }
 return{config:cfg,design:{a,b,alphaRad:alpha,openPhiRad:openPhi,storedPhiRad:storedPhi,rootCell:[0,midRow],rootUV,rootFacetId,driveHingeId:driveHinge.id,coordinateOrder:'longitudinal,lateral,height',outlineInOpenProjection:leaf,omittedFaceIds:omittedFacets.map(f=>f.id),omittedIdealAreaM2:omittedFacets.reduce((n,f)=>n+f.materialAreaM2,0)},facets,omittedFacets,hinges,boundarySegments,state,rootCardanAngles,scope:MIURA_SCOPE};
}
