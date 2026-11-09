/**
 * F06 — one continuous petal folded into a smooth U, metres/radians.
 * Material coordinates are(s longitudinal metres, y transverse metres).
 * Output frame is[transverseX,upY,outwardZ]. Root material point stays fixed.
 *
 * The shape is an isometric cylindrical/developable surface. Its prescribed
 * curvature is continuous, with continuous first derivative, across the two
 * shoulders of the fold: there is NO mechanical hinge or changing panel size.
 * A real fleje/cloth combination and its release force remain unselected.
 */
const TAU=2*Math.PI,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
function gaussLegendre(n){const x=[],w=[];for(let i=0;i<Math.ceil(n/2);i++){let z=Math.cos(Math.PI*(i+.75)/(n+.5)),pp=0;for(let j=0;j<20;j++){let p1=1,p2=0;for(let k=1;k<=n;k++){const p3=p2;p2=p1;p1=((2*k-1)*z*p2-(k-1)*p3)/k;}pp=n*(z*p1-p2)/(z*z-1);const next=z-p1/pp;if(Math.abs(next-z)<1e-16){z=next;break;}z=next;}const wi=2/((1-z*z)*pp*pp);x[i]=-z;x[n-1-i]=z;w[i]=wi;w[n-1-i]=wi;}return{x,w};}
const G32=gaussLegendre(32),G64=gaussLegendre(64);
export function createUFoldPetal(options={}){
 const cfg={lengthM:4,widthM:3.5,minBendRadiusM:.2,openCurvaturePerM:.07,fabricEdgeInsetM:.003,nx:256,ny:64,perimeterSamples:1024,skinHalfThicknessM:.0001,hoopEnvelopeRadiusM:.002,...options};
 if(options.bendRadiusM!==undefined&&options.minBendRadiusM===undefined)cfg.minBendRadiusM=options.bendRadiusM;
 const L=cfg.lengthM,W=cfg.widthM,ell=TAU*cfg.minBendRadiusM,arm=cfg.foldStartM??(L-ell)/2,K=cfg.openCurvaturePerM,d=cfg.fabricEdgeInsetM,FL=L-2*d,FW=W-2*d;
 if(!(L>0&&W>0&&ell>0&&ell<L&&K>=0&&K*L<Math.PI/2&&d>=0&&FL>0&&FW>0))throw Error('Use positive sizes,0<2πR<L,valid fixed fabric inset,and nonnegative open camber below90degrees.');
 if(!(arm>=0&&arm+ell<=L))throw Error('The continuous fold band must stay inside the material length.');
 const outlineAt=t=>[L/2*(1-Math.cos(t)),W/2*Math.sin(t)],halfWidth=s=>W/2*Math.sqrt(Math.max(0,1-(2*clamp(s,0,L)/L-1)**2));
 // The membrane is one FIXED, slightly smaller ellipse. Its edge stops before
 // the steel envelope instead of slicing through the centre of the metal.
 // The flexible hem joining this edge to the hoop is a separate physical part.
 const fabricOutlineAt=t=>[L/2-FL/2*Math.cos(t),FW/2*Math.sin(t)],fabricHalfWidth=s=>s<d||s>L-d?0:FW/2*Math.sqrt(Math.max(0,1-(2*(s-d)/FL-1)**2)),fabricAreaM2=Math.PI*FL*FW/4,nominalAreaM2=Math.PI*L*W/4;
 let hoopLengthM=0;for(let j=0;j<G64.x.length;j++){const t=Math.PI*(G64.x[j]+1);hoopLengthM+=G64.w[j]*Math.hypot(L/2*Math.sin(t),W/2*Math.cos(t))*Math.PI;}
 function constArc(length,k,angle){if(length<=0)return[0,0];if(Math.abs(k)<1e-10)return[length*Math.cos(angle),length*Math.sin(angle)];return[(Math.sin(angle+k*length)-Math.sin(angle))/k,(Math.cos(angle)-Math.cos(angle+k*length))/k];}
 function state(progress=0){
  const q=clamp(Number(progress)||0),baseK=K*q,foldAngle=Math.PI*(1-q),maxFoldK=2*foldAngle/ell;
  function angleAt(s){s=clamp(s,0,L);const u=clamp((s-arm)/ell);return baseK*s+foldAngle*(u-Math.sin(TAU*u)/TAU);}
  function curvatureAt(s){s=clamp(s,0,L);if(s<arm||s>arm+ell)return baseK;const u=(s-arm)/ell;return baseK+maxFoldK*Math.sin(Math.PI*u)**2;}
  const A=constArc(arm,baseK,0),angleA=baseK*arm;
  function foldIntegral(v,G=G32){if(v<=0)return[0,0];let px=0,py=0;for(let j=0;j<G.x.length;j++){const t=v*(G.x[j]+1)/2,u=t/ell,ang=angleA+baseK*t+foldAngle*(u-Math.sin(TAU*u)/TAU);px+=G.w[j]*Math.cos(ang);py+=G.w[j]*Math.sin(ang);}return[px*v/2,py*v/2];}
  const B=foldIntegral(ell),endFold=[A[0]+B[0],A[1]+B[1]],angleB=angleAt(arm+ell);
  function sectionAt(s,{precise=false}={}){s=clamp(s,0,L);let p;if(s<=arm)p=constArc(s,baseK,0);else if(s<=arm+ell){const b=foldIntegral(s-arm,precise?G64:G32);p=[A[0]+b[0],A[1]+b[1]];}else{const c=constArc(s-arm-ell,baseK,angleB);p=[endFold[0]+c[0],endFold[1]+c[1]];}return{point:p,angleRad:angleAt(s),curvaturePerM:curvatureAt(s)};}
  function pointAt(s,y=0,opts){const p=sectionAt(s,opts).point;return[y,p[1],p[0]];}
  const tangentAt=s=>{const a=angleAt(s);return[0,Math.sin(a),Math.cos(a)];},normalAt=s=>{const a=angleAt(s);return[0,Math.cos(a),-Math.sin(a)];},path=t=>pointAt(clamp(t)*L);
  const positions=[],uv=[],indices=[],centers=[];
  for(let i=0;i<=cfg.nx;i++){const u=i/cfg.nx,s=d+FL*u,h=FW/2*Math.sqrt(Math.max(0,1-(2*u-1)**2)),p=sectionAt(s).point;for(let j=0;j<=cfg.ny;j++){const y=h*(2*j/cfg.ny-1);positions.push(y,p[1],p[0]);uv.push(s/L,.5+y/W);}}
  for(let i=0;i<=cfg.nx;i++){const p=sectionAt(L*i/cfg.nx).point;centers.push([0,p[1],p[0]]);}
  const row=cfg.ny+1;for(let i=0;i<cfg.nx;i++)for(let j=0;j<cfg.ny;j++){const n=i*row+j;indices.push(n,n+row,n+1,n+1,n+row,n+row+1);}
  const hoop=[],fabricPerimeterPointsM=[];for(let j=0;j<=cfg.perimeterSamples;j++){const t=TAU*j/cfg.perimeterSamples,[s,y]=outlineAt(t),[fs,fy]=fabricOutlineAt(t);hoop.push(pointAt(s,y));fabricPerimeterPointsM.push(pointAt(fs,fy));}
  const all=[...hoop,...centers],min=[0,1,2].map(n=>Math.min(...all.map(p=>p[n]))),max=[0,1,2].map(n=>Math.max(...all.map(p=>p[n]))),tipM=pointAt(L),rootM=[0,0,0];
  return{progress:q,pointAt,path,sectionAt,angleAt,curvatureAt,tangentAt,normalAt,positions,uv,indices,hoop,perimeterPointsM:hoop,fabricPerimeterPointsM,centerlinePointsM:centers,rootM,rootMaterialPointM:rootM,rootTangentM:[0,0,1],rootNormalM:[0,1,0],tipM,tipMaterialPointM:tipM,rootRotorRad:0,rotorAngleRad:0,foldAngleRad:foldAngle,foldBandM:[arm,arm+ell],bendLengthM:ell,armLengthM:arm,totalLengthM:L,deployedFraction:q,materialAreaM2:fabricAreaM2,nominalAreaM2,fabricPatternM:[FL,FW],hoopLengthM,bounds:{min,max,size:max.map((v,i)=>v-min[i])},metrics:{surfaceMetric:[[1,0],[0,1]],analyticLongitudinalLengthM:L,analyticHoopLengthM:hoopLengthM,analyticFabricAreaM2:fabricAreaM2,fabricEdgeInsetM:d,clothPassesThroughHoop:false,flexibleHemStillRequired:true,materialStretch:0,metalSectionScale:1,continuousSheet:true,mechanicalPetalHinges:0,petalMotors:0,rootFixed:true,maxCurvaturePerM:baseK+maxFoldK,minInstantaneousRadiusM:baseK+maxFoldK>0?1/(baseK+maxFoldK):Infinity,curvatureAtFoldShouldersMInv:baseK,curvatureFirstDerivativeAtFoldShoulders:0,gaussianCurvature:0,openCamberPerM:K,constitutiveMaterialModel:false,releaseEnergyKnown:false,forcesKnown:false,openingTimePrescribed:true,scope:'Continuous-sheet smooth-U kinematic candidate, not a calibrated spring/cloth dynamics solution.'}};
 }
 return{config:cfg,state,halfWidth,outlineAt,fabricHalfWidth,fabricOutlineAt,design:{foldBandLengthM:ell,armLengthM:arm,nominalPatternM:[L,W],fabricPatternM:[FL,FW],fabricEdgeInsetM:d,roundedEllipse:true,rootMaterialFixed:true,materialAreaM2:fabricAreaM2,nominalAreaM2,hoopLengthM,curvatureProfile:'k=K*q+[2*pi*(1-q)/ell]*sin²(pi*u) on central band; k=K*q elsewhere.',continuousIdealInjectivity:'At q>0,0<angle(s)<pi for interior material points, hence height strictly increases with material s. At q=0 the two straight arms lie at distinct heights and join one convex smooth U. Extrusion in transverse coordinate preserves injectivity. Removing the fixed3mm material-edge inset cannot add intersections.',materialResponseValidated:false}};
}
