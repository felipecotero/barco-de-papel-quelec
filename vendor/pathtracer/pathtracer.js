var rs=Object.defineProperty;var is=(o,e)=>{for(var t in e)rs(o,t,{get:e[t],enumerable:!0})};import{PerspectiveCamera as al,Scene as cl,Vector2 as Xn,Clock as ll,NormalBlending as ul,NoBlending as jn,AdditiveBlending as fl}from"three";import{BufferGeometry as Aa}from"three";import{BufferAttribute as Vs,Box3 as To,FrontSide as yo}from"three";var Ii=Math.pow(2,-24),vt=Symbol("SKIP_GENERATION");import{BufferAttribute as os}from"three";function Mr(o){return o.index?o.index.count:o.attributes.position.count}function q(o){return Mr(o)/3}function Pr(o,e=ArrayBuffer){return o>65535?new Uint32Array(new e(4*o)):new Uint16Array(new e(2*o))}function Ri(o,e){if(!o.index){let t=o.attributes.position.count,r=e.useSharedArrayBuffer?SharedArrayBuffer:ArrayBuffer,n=Pr(t,r);o.setIndex(new os(n,1));for(let s=0;s<t;s++)n[s]=s}}function Fr(o,e){let t=q(o),r=e||o.drawRange,n=r.start/3,s=(r.start+r.count)/3,i=Math.max(0,n),c=Math.min(t,s)-i;return[{offset:Math.floor(i),count:Math.floor(c)}]}function Cr(o,e){if(!o.groups||!o.groups.length)return Fr(o,e);let t=[],r=new Set,n=e||o.drawRange,s=n.start/3,i=(n.start+n.count)/3;for(let l of o.groups){let m=l.start/3,f=(l.start+l.count)/3;r.add(Math.max(s,m)),r.add(Math.min(i,f))}let c=Array.from(r.values()).sort((l,m)=>l-m);for(let l=0;l<c.length-1;l++){let m=c[l],f=c[l+1];t.push({offset:Math.floor(m),count:Math.floor(f-m)})}return t}function Mi(o,e){let t=q(o),r=Cr(o,e).sort((i,c)=>i.offset-c.offset),n=r[r.length-1];n.count=Math.min(t-n.offset,n.count);let s=0;return r.forEach(({count:i})=>s+=i),t!==s}function xt(o,e,t,r,n){let s=1/0,i=1/0,c=1/0,l=-1/0,m=-1/0,f=-1/0,u=1/0,a=1/0,d=1/0,g=-1/0,T=-1/0,h=-1/0;for(let y=e*6,v=(e+t)*6;y<v;y+=6){let p=o[y+0],b=o[y+1],x=p-b,w=p+b;x<s&&(s=x),w>l&&(l=w),p<u&&(u=p),p>g&&(g=p);let S=o[y+2],I=o[y+3],A=S-I,R=S+I;A<i&&(i=A),R>m&&(m=R),S<a&&(a=S),S>T&&(T=S);let P=o[y+4],_=o[y+5],M=P-_,F=P+_;M<c&&(c=M),F>f&&(f=F),P<d&&(d=P),P>h&&(h=P)}r[0]=s,r[1]=i,r[2]=c,r[3]=l,r[4]=m,r[5]=f,n[0]=u,n[1]=a,n[2]=d,n[3]=g,n[4]=T,n[5]=h}function Pi(o,e=null,t=null,r=null){let n=o.attributes.position,s=o.index?o.index.array:null,i=q(o),c=n.normalized,l;e===null?l=new Float32Array(i*6):l=e,t=t||0,r=r||i;let m=n.array,f=n.offset||0,u=3;n.isInterleavedBufferAttribute&&(u=n.data.stride);let a=["getX","getY","getZ"];for(let d=t;d<t+r;d++){let g=d*3,T=d*6,h=g+0,y=g+1,v=g+2;s&&(h=s[h],y=s[y],v=s[v]),c||(h=h*u+f,y=y*u+f,v=v*u+f);for(let p=0;p<3;p++){let b,x,w;c?(b=n[a[p]](h),x=n[a[p]](y),w=n[a[p]](v)):(b=m[h+p],x=m[y+p],w=m[v+p]);let S=b;x<S&&(S=x),w<S&&(S=w);let I=b;x>I&&(I=x),w>I&&(I=w);let A=(I-S)/2,R=p*2;l[T+R+0]=S+A,l[T+R+1]=A+(Math.abs(S)+A)*Ii}}return l}function E(o,e,t){return t.min.x=e[o],t.min.y=e[o+1],t.min.z=e[o+2],t.max.x=e[o+3],t.max.y=e[o+4],t.max.z=e[o+5],t}function Dr(o){let e=-1,t=-1/0;for(let r=0;r<3;r++){let n=o[r+3]-o[r];n>t&&(t=n,e=r)}return e}function Br(o,e){e.set(o)}function Er(o,e,t){let r,n;for(let s=0;s<3;s++){let i=s+3;r=o[s],n=e[s],t[s]=r<n?r:n,r=o[i],n=e[i],t[i]=r>n?r:n}}function Qe(o,e,t){for(let r=0;r<3;r++){let n=e[o+2*r],s=e[o+2*r+1],i=n-s,c=n+s;i<t[r]&&(t[r]=i),c>t[r+3]&&(t[r+3]=c)}}function Pe(o){let e=o[3]-o[0],t=o[4]-o[1],r=o[5]-o[2];return 2*(e*t+t*r+r*e)}var ie=32,ss=(o,e)=>o.candidate-e.candidate,ne=new Array(ie).fill().map(()=>({count:0,bounds:new Float32Array(6),rightCacheBounds:new Float32Array(6),leftCacheBounds:new Float32Array(6),candidate:0})),yt=new Float32Array(6);function Bi(o,e,t,r,n,s){let i=-1,c=0;if(s===0)i=Dr(e),i!==-1&&(c=(e[i]+e[i+3])/2);else if(s===1)i=Dr(o),i!==-1&&(c=as(t,r,n,i));else if(s===2){let l=Pe(o),m=1.25*n,f=r*6,u=(r+n)*6;for(let a=0;a<3;a++){let d=e[a],h=(e[a+3]-d)/ie;if(n<ie/4){let y=[...ne];y.length=n;let v=0;for(let b=f;b<u;b+=6,v++){let x=y[v];x.candidate=t[b+2*a],x.count=0;let{bounds:w,leftCacheBounds:S,rightCacheBounds:I}=x;for(let A=0;A<3;A++)I[A]=1/0,I[A+3]=-1/0,S[A]=1/0,S[A+3]=-1/0,w[A]=1/0,w[A+3]=-1/0;Qe(b,t,w)}y.sort(ss);let p=n;for(let b=0;b<p;b++){let x=y[b];for(;b+1<p&&y[b+1].candidate===x.candidate;)y.splice(b+1,1),p--}for(let b=f;b<u;b+=6){let x=t[b+2*a];for(let w=0;w<p;w++){let S=y[w];x>=S.candidate?Qe(b,t,S.rightCacheBounds):(Qe(b,t,S.leftCacheBounds),S.count++)}}for(let b=0;b<p;b++){let x=y[b],w=x.count,S=n-x.count,I=x.leftCacheBounds,A=x.rightCacheBounds,R=0;w!==0&&(R=Pe(I)/l);let P=0;S!==0&&(P=Pe(A)/l);let _=1+1.25*(R*w+P*S);_<m&&(i=a,m=_,c=x.candidate)}}else{for(let p=0;p<ie;p++){let b=ne[p];b.count=0,b.candidate=d+h+p*h;let x=b.bounds;for(let w=0;w<3;w++)x[w]=1/0,x[w+3]=-1/0}for(let p=f;p<u;p+=6){let w=~~((t[p+2*a]-d)/h);w>=ie&&(w=ie-1);let S=ne[w];S.count++,Qe(p,t,S.bounds)}let y=ne[ie-1];Br(y.bounds,y.rightCacheBounds);for(let p=ie-2;p>=0;p--){let b=ne[p],x=ne[p+1];Er(b.bounds,x.rightCacheBounds,b.rightCacheBounds)}let v=0;for(let p=0;p<ie-1;p++){let b=ne[p],x=b.count,w=b.bounds,I=ne[p+1].rightCacheBounds;x!==0&&(v===0?Br(w,yt):Er(w,yt,yt)),v+=x;let A=0,R=0;v!==0&&(A=Pe(yt)/l);let P=n-v;P!==0&&(R=Pe(I)/l);let _=1+1.25*(A*v+R*P);_<m&&(i=a,m=_,c=b.candidate)}}}}else console.warn(`MeshBVH: Invalid build strategy value ${s} used.`);return{axis:i,pos:c}}function as(o,e,t,r){let n=0;for(let s=e,i=e+t;s<i;s++)n+=o[s*6+r*2];return n/t}var Fe=class{constructor(){this.boundingData=new Float32Array(6)}};function Ei(o,e,t,r,n,s){let i=r,c=r+n-1,l=s.pos,m=s.axis*2;for(;;){for(;i<=c&&t[i*6+m]<l;)i++;for(;i<=c&&t[c*6+m]>=l;)c--;if(i<c){for(let f=0;f<3;f++){let u=e[i*3+f];e[i*3+f]=e[c*3+f],e[c*3+f]=u}for(let f=0;f<6;f++){let u=t[i*6+f];t[i*6+f]=t[c*6+f],t[c*6+f]=u}i++,c--}else return i}}function Li(o,e,t,r,n,s){let i=r,c=r+n-1,l=s.pos,m=s.axis*2;for(;;){for(;i<=c&&t[i*6+m]<l;)i++;for(;i<=c&&t[c*6+m]>=l;)c--;if(i<c){let f=o[i];o[i]=o[c],o[c]=f;for(let u=0;u<6;u++){let a=t[i*6+u];t[i*6+u]=t[c*6+u],t[c*6+u]=a}i++,c--}else return i}}function N(o,e){return e[o+15]===65535}function k(o,e){return e[o+6]}function z(o,e){return e[o+14]}function U(o){return o+8}function H(o,e){return e[o+6]}function Ce(o,e){return e[o+7]}var Ni,Ke,bt,ki,cs=Math.pow(2,32);function Tt(o){return"count"in o?1:1+Tt(o.left)+Tt(o.right)}function zi(o,e,t){return Ni=new Float32Array(t),Ke=new Uint32Array(t),bt=new Uint16Array(t),ki=new Uint8Array(t),Lr(o,e)}function Lr(o,e){let t=o/4,r=o/2,n="count"in e,s=e.boundingData;for(let i=0;i<6;i++)Ni[t+i]=s[i];if(n)if(e.buffer){let i=e.buffer;ki.set(new Uint8Array(i),o);for(let c=o,l=o+i.byteLength;c<l;c+=32){let m=c/2;N(m,bt)||(Ke[c/4+6]+=t)}return o+i.byteLength}else{let i=e.offset,c=e.count;return Ke[t+6]=i,bt[r+14]=c,bt[r+15]=65535,o+32}else{let i=e.left,c=e.right,l=e.splitAxis,m;if(m=Lr(o+32,i),m/4>cs)throw new Error("MeshBVH: Cannot store child pointer greater than 32 bits.");return Ke[t+6]=m/4,m=Lr(m,c),Ke[t+7]=l,m}}function ls(o,e){let t=(o.index?o.index.count:o.attributes.position.count)/3,r=t>2**16,n=r?4:2,s=e?new SharedArrayBuffer(t*n):new ArrayBuffer(t*n),i=r?new Uint32Array(s):new Uint16Array(s);for(let c=0,l=i.length;c<l;c++)i[c]=c;return i}function us(o,e,t,r,n){let{maxDepth:s,verbose:i,maxLeafTris:c,strategy:l,onProgress:m,indirect:f}=n,u=o._indirectBuffer,a=o.geometry,d=a.index?a.index.array:null,g=f?Li:Ei,T=q(a),h=new Float32Array(6),y=!1,v=new Fe;return xt(e,t,r,v.boundingData,h),b(v,t,r,h),v;function p(x){m&&m(x/T)}function b(x,w,S,I=null,A=0){if(!y&&A>=s&&(y=!0,i&&(console.warn(`MeshBVH: Max depth of ${s} reached when generating BVH. Consider increasing maxDepth.`),console.warn(a))),S<=c||A>=s)return p(w+S),x.offset=w,x.count=S,x;let R=Bi(x.boundingData,I,e,w,S,l);if(R.axis===-1)return p(w+S),x.offset=w,x.count=S,x;let P=g(u,d,e,w,S,R);if(P===w||P===w+S)p(w+S),x.offset=w,x.count=S;else{x.splitAxis=R.axis;let _=new Fe,M=w,F=P-w;x.left=_,xt(e,M,F,_.boundingData,h),b(_,M,F,h,A+1);let C=new Fe,B=P,V=S-F;x.right=C,xt(e,B,V,C.boundingData,h),b(C,B,V,h,A+1)}return x}}function Oi(o,e){let t=o.geometry;e.indirect&&(o._indirectBuffer=ls(t,e.useSharedArrayBuffer),Mi(t,e.range)&&!e.verbose&&console.warn('MeshBVH: Provided geometry contains groups or a range that do not fully span the vertex contents while using the "indirect" option. BVH may incorrectly report intersections on unrendered portions of the geometry.')),o._indirectBuffer||Ri(t,e);let r=e.useSharedArrayBuffer?SharedArrayBuffer:ArrayBuffer,n=Fr(t,e.range),s=Pi(t,null,n[0].offset,n[0].count),i=e.indirect?n:Cr(t,e.range);o._roots=i.map(c=>{let l=us(o,s,c.offset,c.count,e),m=Tt(l),f=new r(32*m);return zi(0,l,f),f})}import{Vector3 as ae,Matrix4 as Vi,Line3 as Gi}from"three";import{Vector3 as fs}from"three";var $=class{constructor(){this.min=1/0,this.max=-1/0}setFromPointsField(e,t){let r=1/0,n=-1/0;for(let s=0,i=e.length;s<i;s++){let l=e[s][t];r=l<r?l:r,n=l>n?l:n}this.min=r,this.max=n}setFromPoints(e,t){let r=1/0,n=-1/0;for(let s=0,i=t.length;s<i;s++){let c=t[s],l=e.dot(c);r=l<r?l:r,n=l>n?l:n}this.min=r,this.max=n}isSeparated(e){return this.min>e.max||e.min>this.max}};$.prototype.setFromBox=(function(){let o=new fs;return function(t,r){let n=r.min,s=r.max,i=1/0,c=-1/0;for(let l=0;l<=1;l++)for(let m=0;m<=1;m++)for(let f=0;f<=1;f++){o.x=n.x*l+s.x*(1-l),o.y=n.y*m+s.y*(1-m),o.z=n.z*f+s.z*(1-f);let u=t.dot(o);i=Math.min(u,i),c=Math.max(u,c)}this.min=i,this.max=c}})();var Vl=(function(){let o=new $;return function(t,r){let n=t.points,s=t.satAxes,i=t.satBounds,c=r.points,l=r.satAxes,m=r.satBounds;for(let f=0;f<3;f++){let u=i[f],a=s[f];if(o.setFromPoints(a,c),u.isSeparated(o))return!1}for(let f=0;f<3;f++){let u=m[f],a=l[f];if(o.setFromPoints(a,n),u.isSeparated(o))return!1}}})();import{Triangle as gs,Vector3 as J,Vector2 as Ui,Line3 as De,Plane as vs}from"three";import{Vector3 as pe,Vector2 as ms,Plane as hs,Line3 as ds}from"three";var ps=(function(){let o=new pe,e=new pe,t=new pe;return function(n,s,i){let c=n.start,l=o,m=s.start,f=e;t.subVectors(c,m),o.subVectors(n.end,n.start),e.subVectors(s.end,s.start);let u=t.dot(f),a=f.dot(l),d=f.dot(f),g=t.dot(l),h=l.dot(l)*d-a*a,y,v;h!==0?y=(u*a-g*d)/h:y=0,v=(u+y*a)/d,i.x=y,i.y=v}})(),Ze=(function(){let o=new ms,e=new pe,t=new pe;return function(n,s,i,c){ps(n,s,o);let l=o.x,m=o.y;if(l>=0&&l<=1&&m>=0&&m<=1){n.at(l,i),s.at(m,c);return}else if(l>=0&&l<=1){m<0?s.at(0,c):s.at(1,c),n.closestPointToPoint(c,!0,i);return}else if(m>=0&&m<=1){l<0?n.at(0,i):n.at(1,i),s.closestPointToPoint(i,!0,c);return}else{let f;l<0?f=n.start:f=n.end;let u;m<0?u=s.start:u=s.end;let a=e,d=t;if(n.closestPointToPoint(u,!0,e),s.closestPointToPoint(f,!0,t),a.distanceToSquared(u)<=d.distanceToSquared(f)){i.copy(a),c.copy(u);return}else{i.copy(f),c.copy(d);return}}}})(),Hi=(function(){let o=new pe,e=new pe,t=new hs,r=new ds;return function(s,i){let{radius:c,center:l}=s,{a:m,b:f,c:u}=i;if(r.start=m,r.end=f,r.closestPointToPoint(l,!0,o).distanceTo(l)<=c||(r.start=m,r.end=u,r.closestPointToPoint(l,!0,o).distanceTo(l)<=c)||(r.start=f,r.end=u,r.closestPointToPoint(l,!0,o).distanceTo(l)<=c))return!0;let T=i.getPlane(t);if(Math.abs(T.distanceToPoint(l))<=c){let y=T.projectPoint(l,e);if(i.containsPoint(y))return!0}return!1}})();var xs=["x","y","z"],oe=1e-15,Wi=oe*oe;function Q(o){return Math.abs(o)<oe}var W=class extends gs{constructor(...e){super(...e),this.isExtendedTriangle=!0,this.satAxes=new Array(4).fill().map(()=>new J),this.satBounds=new Array(4).fill().map(()=>new $),this.points=[this.a,this.b,this.c],this.plane=new vs,this.isDegenerateIntoSegment=!1,this.isDegenerateIntoPoint=!1,this.degenerateSegment=new De,this.needsUpdate=!0}intersectsSphere(e){return Hi(e,this)}update(){let e=this.a,t=this.b,r=this.c,n=this.points,s=this.satAxes,i=this.satBounds,c=s[0],l=i[0];this.getNormal(c),l.setFromPoints(c,n);let m=s[1],f=i[1];m.subVectors(e,t),f.setFromPoints(m,n);let u=s[2],a=i[2];u.subVectors(t,r),a.setFromPoints(u,n);let d=s[3],g=i[3];d.subVectors(r,e),g.setFromPoints(d,n);let T=m.length(),h=u.length(),y=d.length();this.isDegenerateIntoPoint=!1,this.isDegenerateIntoSegment=!1,T<oe?h<oe||y<oe?this.isDegenerateIntoPoint=!0:(this.isDegenerateIntoSegment=!0,this.degenerateSegment.start.copy(e),this.degenerateSegment.end.copy(r)):h<oe?y<oe?this.isDegenerateIntoPoint=!0:(this.isDegenerateIntoSegment=!0,this.degenerateSegment.start.copy(t),this.degenerateSegment.end.copy(e)):y<oe&&(this.isDegenerateIntoSegment=!0,this.degenerateSegment.start.copy(r),this.degenerateSegment.end.copy(t)),this.plane.setFromNormalAndCoplanarPoint(c,e),this.needsUpdate=!1}};W.prototype.closestPointToSegment=(function(){let o=new J,e=new J,t=new De;return function(n,s=null,i=null){let{start:c,end:l}=n,m=this.points,f,u=1/0;for(let a=0;a<3;a++){let d=(a+1)%3;t.start.copy(m[a]),t.end.copy(m[d]),Ze(t,n,o,e),f=o.distanceToSquared(e),f<u&&(u=f,s&&s.copy(o),i&&i.copy(e))}return this.closestPointToPoint(c,o),f=c.distanceToSquared(o),f<u&&(u=f,s&&s.copy(o),i&&i.copy(c)),this.closestPointToPoint(l,o),f=l.distanceToSquared(o),f<u&&(u=f,s&&s.copy(o),i&&i.copy(l)),Math.sqrt(u)}})();W.prototype.intersectsTriangle=(function(){let o=new W,e=new $,t=new $,r=new J,n=new J,s=new J,i=new J,c=new De,l=new De,m=new J,f=new Ui,u=new Ui;function a(p,b,x,w){let S=r;!p.isDegenerateIntoPoint&&!p.isDegenerateIntoSegment?S.copy(p.plane.normal):S.copy(b.plane.normal);let I=p.satBounds,A=p.satAxes;for(let _=1;_<4;_++){let M=I[_],F=A[_];if(e.setFromPoints(F,b.points),M.isSeparated(e)||(i.copy(S).cross(F),e.setFromPoints(i,p.points),t.setFromPoints(i,b.points),e.isSeparated(t)))return!1}let R=b.satBounds,P=b.satAxes;for(let _=1;_<4;_++){let M=R[_],F=P[_];if(e.setFromPoints(F,p.points),M.isSeparated(e)||(i.crossVectors(S,F),e.setFromPoints(i,p.points),t.setFromPoints(i,b.points),e.isSeparated(t)))return!1}return x&&(w||console.warn("ExtendedTriangle.intersectsTriangle: Triangles are coplanar which does not support an output edge. Setting edge to 0, 0, 0."),x.start.set(0,0,0),x.end.set(0,0,0)),!0}function d(p,b,x,w,S,I,A,R,P,_,M){let F=A/(A-R);_.x=w+(S-w)*F,M.start.subVectors(b,p).multiplyScalar(F).add(p),F=A/(A-P),_.y=w+(I-w)*F,M.end.subVectors(x,p).multiplyScalar(F).add(p)}function g(p,b,x,w,S,I,A,R,P,_,M){if(S>0)d(p.c,p.a,p.b,w,b,x,P,A,R,_,M);else if(I>0)d(p.b,p.a,p.c,x,b,w,R,A,P,_,M);else if(R*P>0||A!=0)d(p.a,p.b,p.c,b,x,w,A,R,P,_,M);else if(R!=0)d(p.b,p.a,p.c,x,b,w,R,A,P,_,M);else if(P!=0)d(p.c,p.a,p.b,w,b,x,P,A,R,_,M);else return!0;return!1}function T(p,b,x,w){let S=b.degenerateSegment,I=p.plane.distanceToPoint(S.start),A=p.plane.distanceToPoint(S.end);return Q(I)?Q(A)?a(p,b,x,w):(x&&(x.start.copy(S.start),x.end.copy(S.start)),p.containsPoint(S.start)):Q(A)?(x&&(x.start.copy(S.end),x.end.copy(S.end)),p.containsPoint(S.end)):p.plane.intersectLine(S,r)!=null?(x&&(x.start.copy(r),x.end.copy(r)),p.containsPoint(r)):!1}function h(p,b,x){let w=b.a;return Q(p.plane.distanceToPoint(w))&&p.containsPoint(w)?(x&&(x.start.copy(w),x.end.copy(w)),!0):!1}function y(p,b,x){let w=p.degenerateSegment,S=b.a;return w.closestPointToPoint(S,!0,r),S.distanceToSquared(r)<Wi?(x&&(x.start.copy(S),x.end.copy(S)),!0):!1}function v(p,b,x,w){if(p.isDegenerateIntoSegment)if(b.isDegenerateIntoSegment){let S=p.degenerateSegment,I=b.degenerateSegment,A=n,R=s;S.delta(A),I.delta(R);let P=r.subVectors(I.start,S.start),_=A.x*R.y-A.y*R.x;if(Q(_))return!1;let M=(P.x*R.y-P.y*R.x)/_,F=-(A.x*P.y-A.y*P.x)/_;if(M<0||M>1||F<0||F>1)return!1;let C=S.start.z+A.z*M,B=I.start.z+R.z*F;return Q(C-B)?(x&&(x.start.copy(S.start).addScaledVector(A,M),x.end.copy(S.start).addScaledVector(A,M)),!0):!1}else return b.isDegenerateIntoPoint?y(p,b,x):T(b,p,x,w);else{if(p.isDegenerateIntoPoint)return b.isDegenerateIntoPoint?b.a.distanceToSquared(p.a)<Wi?(x&&(x.start.copy(p.a),x.end.copy(p.a)),!0):!1:b.isDegenerateIntoSegment?y(b,p,x):h(b,p,x);if(b.isDegenerateIntoPoint)return h(p,b,x);if(b.isDegenerateIntoSegment)return T(p,b,x,w)}}return function(b,x=null,w=!1){this.needsUpdate&&this.update(),b.isExtendedTriangle?b.needsUpdate&&b.update():(o.copy(b),o.update(),b=o);let S=v(this,b,x,w);if(S!==void 0)return S;let I=this.plane,A=b.plane,R=A.distanceToPoint(this.a),P=A.distanceToPoint(this.b),_=A.distanceToPoint(this.c);Q(R)&&(R=0),Q(P)&&(P=0),Q(_)&&(_=0);let M=R*P,F=R*_;if(M>0&&F>0)return!1;let C=I.distanceToPoint(b.a),B=I.distanceToPoint(b.b),V=I.distanceToPoint(b.c);Q(C)&&(C=0),Q(B)&&(B=0),Q(V)&&(V=0);let X=C*B,Z=C*V;if(X>0&&Z>0)return!1;n.copy(I.normal),s.copy(A.normal);let Re=n.cross(s),de=0,Ir=Math.abs(Re.x),Ai=Math.abs(Re.y);Ai>Ir&&(Ir=Ai,de=1),Math.abs(Re.z)>Ir&&(de=2);let Me=xs[de],Qn=this.a[Me],Kn=this.b[Me],Zn=this.c[Me],Jn=b.a[Me],es=b.b[Me],ts=b.c[Me];if(g(this,Qn,Kn,Zn,M,F,R,P,_,f,c))return a(this,b,x,w);if(g(b,Jn,es,ts,X,Z,C,B,V,u,l))return a(this,b,x,w);if(f.y<f.x){let Rr=f.y;f.y=f.x,f.x=Rr,m.copy(c.start),c.start.copy(c.end),c.end.copy(m)}if(u.y<u.x){let Rr=u.y;u.y=u.x,u.x=Rr,m.copy(l.start),l.start.copy(l.end),l.end.copy(m)}return f.y<u.x||u.y<f.x?!1:(x&&(u.x>f.x?x.start.copy(l.start):x.start.copy(c.start),u.y<f.y?x.end.copy(l.end):x.end.copy(c.end)),!0)}})();W.prototype.distanceToPoint=(function(){let o=new J;return function(t){return this.closestPointToPoint(t,o),t.distanceTo(o)}})();W.prototype.distanceToTriangle=(function(){let o=new J,e=new J,t=["a","b","c"],r=new De,n=new De;return function(i,c=null,l=null){let m=c||l?r:null;if(this.intersectsTriangle(i,m))return(c||l)&&(c&&m.getCenter(c),l&&m.getCenter(l)),0;let f=1/0;for(let u=0;u<3;u++){let a,d=t[u],g=i[d];this.closestPointToPoint(g,o),a=g.distanceToSquared(o),a<f&&(f=a,c&&c.copy(o),l&&l.copy(g));let T=this[d];i.closestPointToPoint(T,o),a=T.distanceToSquared(o),a<f&&(f=a,c&&c.copy(T),l&&l.copy(o))}for(let u=0;u<3;u++){let a=t[u],d=t[(u+1)%3];r.set(this[a],this[d]);for(let g=0;g<3;g++){let T=t[g],h=t[(g+1)%3];n.set(i[T],i[h]),Ze(r,n,o,e);let y=o.distanceToSquared(e);y<f&&(f=y,c&&c.copy(o),l&&l.copy(e))}}return Math.sqrt(f)}})();var O=class{constructor(e,t,r){this.isOrientedBox=!0,this.min=new ae,this.max=new ae,this.matrix=new Vi,this.invMatrix=new Vi,this.points=new Array(8).fill().map(()=>new ae),this.satAxes=new Array(3).fill().map(()=>new ae),this.satBounds=new Array(3).fill().map(()=>new $),this.alignedSatBounds=new Array(3).fill().map(()=>new $),this.needsUpdate=!1,e&&this.min.copy(e),t&&this.max.copy(t),r&&this.matrix.copy(r)}set(e,t,r){this.min.copy(e),this.max.copy(t),this.matrix.copy(r),this.needsUpdate=!0}copy(e){this.min.copy(e.min),this.max.copy(e.max),this.matrix.copy(e.matrix),this.needsUpdate=!0}};O.prototype.update=(function(){return function(){let e=this.matrix,t=this.min,r=this.max,n=this.points;for(let m=0;m<=1;m++)for(let f=0;f<=1;f++)for(let u=0;u<=1;u++){let a=1*m|2*f|4*u,d=n[a];d.x=m?r.x:t.x,d.y=f?r.y:t.y,d.z=u?r.z:t.z,d.applyMatrix4(e)}let s=this.satBounds,i=this.satAxes,c=n[0];for(let m=0;m<3;m++){let f=i[m],u=s[m],a=1<<m,d=n[a];f.subVectors(c,d),u.setFromPoints(f,n)}let l=this.alignedSatBounds;l[0].setFromPointsField(n,"x"),l[1].setFromPointsField(n,"y"),l[2].setFromPointsField(n,"z"),this.invMatrix.copy(this.matrix).invert(),this.needsUpdate=!1}})();O.prototype.intersectsBox=(function(){let o=new $;return function(t){this.needsUpdate&&this.update();let r=t.min,n=t.max,s=this.satBounds,i=this.satAxes,c=this.alignedSatBounds;if(o.min=r.x,o.max=n.x,c[0].isSeparated(o)||(o.min=r.y,o.max=n.y,c[1].isSeparated(o))||(o.min=r.z,o.max=n.z,c[2].isSeparated(o)))return!1;for(let l=0;l<3;l++){let m=i[l],f=s[l];if(o.setFromBox(m,t),f.isSeparated(o))return!1}return!0}})();O.prototype.intersectsTriangle=(function(){let o=new W,e=new Array(3),t=new $,r=new $,n=new ae;return function(i){this.needsUpdate&&this.update(),i.isExtendedTriangle?i.needsUpdate&&i.update():(o.copy(i),o.update(),i=o);let c=this.satBounds,l=this.satAxes;e[0]=i.a,e[1]=i.b,e[2]=i.c;for(let a=0;a<3;a++){let d=c[a],g=l[a];if(t.setFromPoints(g,e),d.isSeparated(t))return!1}let m=i.satBounds,f=i.satAxes,u=this.points;for(let a=0;a<3;a++){let d=m[a],g=f[a];if(t.setFromPoints(g,u),d.isSeparated(t))return!1}for(let a=0;a<3;a++){let d=l[a];for(let g=0;g<4;g++){let T=f[g];if(n.crossVectors(d,T),t.setFromPoints(n,e),r.setFromPoints(n,u),t.isSeparated(r))return!1}}return!0}})();O.prototype.closestPointToPoint=(function(){return function(e,t){return this.needsUpdate&&this.update(),t.copy(e).applyMatrix4(this.invMatrix).clamp(this.min,this.max).applyMatrix4(this.matrix),t}})();O.prototype.distanceToPoint=(function(){let o=new ae;return function(t){return this.closestPointToPoint(t,o),t.distanceTo(o)}})();O.prototype.distanceToBox=(function(){let o=["x","y","z"],e=new Array(12).fill().map(()=>new Gi),t=new Array(12).fill().map(()=>new Gi),r=new ae,n=new ae;return function(i,c=0,l=null,m=null){if(this.needsUpdate&&this.update(),this.intersectsBox(i))return(l||m)&&(i.getCenter(n),this.closestPointToPoint(n,r),i.closestPointToPoint(r,n),l&&l.copy(r),m&&m.copy(n)),0;let f=c*c,u=i.min,a=i.max,d=this.points,g=1/0;for(let h=0;h<8;h++){let y=d[h];n.copy(y).clamp(u,a);let v=y.distanceToSquared(n);if(v<g&&(g=v,l&&l.copy(y),m&&m.copy(n),v<f))return Math.sqrt(v)}let T=0;for(let h=0;h<3;h++)for(let y=0;y<=1;y++)for(let v=0;v<=1;v++){let p=(h+1)%3,b=(h+2)%3,x=y<<p|v<<b,w=1<<h|y<<p|v<<b,S=d[x],I=d[w];e[T].set(S,I);let R=o[h],P=o[p],_=o[b],M=t[T],F=M.start,C=M.end;F[R]=u[R],F[P]=y?u[P]:a[P],F[_]=v?u[_]:a[P],C[R]=a[R],C[P]=y?u[P]:a[P],C[_]=v?u[_]:a[P],T++}for(let h=0;h<=1;h++)for(let y=0;y<=1;y++)for(let v=0;v<=1;v++){n.x=h?a.x:u.x,n.y=y?a.y:u.y,n.z=v?a.z:u.z,this.closestPointToPoint(n,r);let p=n.distanceToSquared(r);if(p<g&&(g=p,l&&l.copy(r),m&&m.copy(n),p<f))return Math.sqrt(p)}for(let h=0;h<12;h++){let y=e[h];for(let v=0;v<12;v++){let p=t[v];Ze(y,p,r,n);let b=r.distanceToSquared(n);if(b<g&&(g=b,l&&l.copy(r),m&&m.copy(n),b<f))return Math.sqrt(b)}}return Math.sqrt(g)}})();var ce=class{constructor(e){this._getNewPrimitive=e,this._primitives=[]}getPrimitive(){let e=this._primitives;return e.length===0?this._getNewPrimitive():e.pop()}releasePrimitive(e){this._primitives.push(e)}};var Nr=class extends ce{constructor(){super(()=>new W)}},G=new Nr;import{Box3 as bs}from"three";var kr=class{constructor(){this.float32Array=null,this.uint16Array=null,this.uint32Array=null;let e=[],t=null;this.setBuffer=r=>{t&&e.push(t),t=r,this.float32Array=new Float32Array(r),this.uint16Array=new Uint16Array(r),this.uint32Array=new Uint32Array(r)},this.clearBuffer=()=>{t=null,this.float32Array=null,this.uint16Array=null,this.uint32Array=null,e.length!==0&&this.setBuffer(e.pop())}}},D=new kr;var le,Ee,Be=[],St=new ce(()=>new bs);function qi(o,e,t,r,n,s){le=St.getPrimitive(),Ee=St.getPrimitive(),Be.push(le,Ee),D.setBuffer(o._roots[e]);let i=zr(0,o.geometry,t,r,n,s);D.clearBuffer(),St.releasePrimitive(le),St.releasePrimitive(Ee),Be.pop(),Be.pop();let c=Be.length;return c>0&&(Ee=Be[c-1],le=Be[c-2]),i}function zr(o,e,t,r,n=null,s=0,i=0){let{float32Array:c,uint16Array:l,uint32Array:m}=D,f=o*2;if(N(f,l)){let a=k(o,m),d=z(f,l);return E(o,c,le),r(a,d,!1,i,s+o,le)}else{let R=function(_){let{uint16Array:M,uint32Array:F}=D,C=_*2;for(;!N(C,M);)_=U(_),C=_*2;return k(_,F)},P=function(_){let{uint16Array:M,uint32Array:F}=D,C=_*2;for(;!N(C,M);)_=H(_,F),C=_*2;return k(_,F)+z(C,M)},a=U(o),d=H(o,m),g=a,T=d,h,y,v,p;if(n&&(v=le,p=Ee,E(g,c,v),E(T,c,p),h=n(v),y=n(p),y<h)){g=d,T=a;let _=h;h=y,y=_,v=p}v||(v=le,E(g,c,v));let b=N(g*2,l),x=t(v,b,h,i+1,s+g),w;if(x===2){let _=R(g),F=P(g)-_;w=r(_,F,!0,i+1,s+g,v)}else w=x&&zr(g,e,t,r,n,s,i+1);if(w)return!0;p=Ee,E(T,c,p);let S=N(T*2,l),I=t(p,S,y,i+1,s+T),A;if(I===2){let _=R(T),F=P(T)-_;A=r(_,F,!0,i+1,s+T,p)}else A=I&&zr(T,e,t,r,n,s,i+1);return!!A}}import{Vector3 as $i}from"three";var Je=new $i,Or=new $i;function Yi(o,e,t={},r=0,n=1/0){let s=r*r,i=n*n,c=1/0,l=null;if(o.shapecast({boundsTraverseOrder:f=>(Je.copy(e).clamp(f.min,f.max),Je.distanceToSquared(e)),intersectsBounds:(f,u,a)=>a<c&&a<i,intersectsTriangle:(f,u)=>{f.closestPointToPoint(e,Je);let a=e.distanceToSquared(Je);return a<c&&(Or.copy(Je),c=a,l=u),a<s}}),c===1/0)return null;let m=Math.sqrt(c);return t.point?t.point.copy(Or):t.point=Or.clone(),t.distance=m,t.faceIndex=l,t}import{Vector3 as re,Vector2 as rt,Triangle as et,DoubleSide as Ts,BackSide as ws,REVISION as Ki}from"three";var At=parseInt(Ki)>=169,Ss=parseInt(Ki)<=161,ge=new re,ve=new re,xe=new re,It=new rt,Rt=new rt,Mt=new rt,ji=new re,Xi=new re,Qi=new re,tt=new re;function _s(o,e,t,r,n,s,i,c){let l;if(s===ws?l=o.intersectTriangle(r,t,e,!0,n):l=o.intersectTriangle(e,t,r,s!==Ts,n),l===null)return null;let m=o.origin.distanceTo(n);return m<i||m>c?null:{distance:m,point:n.clone()}}function As(o,e,t,r,n,s,i,c,l,m,f){ge.fromBufferAttribute(e,s),ve.fromBufferAttribute(e,i),xe.fromBufferAttribute(e,c);let u=_s(o,ge,ve,xe,tt,l,m,f);if(u){if(r){It.fromBufferAttribute(r,s),Rt.fromBufferAttribute(r,i),Mt.fromBufferAttribute(r,c),u.uv=new rt;let d=et.getInterpolation(tt,ge,ve,xe,It,Rt,Mt,u.uv);At||(u.uv=d)}if(n){It.fromBufferAttribute(n,s),Rt.fromBufferAttribute(n,i),Mt.fromBufferAttribute(n,c),u.uv1=new rt;let d=et.getInterpolation(tt,ge,ve,xe,It,Rt,Mt,u.uv1);At||(u.uv1=d),Ss&&(u.uv2=u.uv1)}if(t){ji.fromBufferAttribute(t,s),Xi.fromBufferAttribute(t,i),Qi.fromBufferAttribute(t,c),u.normal=new re;let d=et.getInterpolation(tt,ge,ve,xe,ji,Xi,Qi,u.normal);u.normal.dot(o.direction)>0&&u.normal.multiplyScalar(-1),At||(u.normal=d)}let a={a:s,b:i,c,normal:new re,materialIndex:0};if(et.getNormal(ge,ve,xe,a.normal),u.face=a,u.faceIndex=s,At){let d=new re;et.getBarycoord(tt,ge,ve,xe,d),u.barycoord=d}}return u}function Le(o,e,t,r,n,s,i){let c=r*3,l=c+0,m=c+1,f=c+2,u=o.index;o.index&&(l=u.getX(l),m=u.getX(m),f=u.getX(f));let{position:a,normal:d,uv:g,uv1:T}=o.attributes,h=As(t,a,d,g,T,l,m,f,e,s,i);return h?(h.faceIndex=r,n&&n.push(h),h):null}import{Vector2 as xu,Vector3 as yu,Triangle as bu}from"three";function L(o,e,t,r){let n=o.a,s=o.b,i=o.c,c=e,l=e+1,m=e+2;t&&(c=t.getX(c),l=t.getX(l),m=t.getX(m)),n.x=r.getX(c),n.y=r.getY(c),n.z=r.getZ(c),s.x=r.getX(l),s.y=r.getY(l),s.z=r.getZ(l),i.x=r.getX(m),i.y=r.getY(m),i.z=r.getZ(m)}function Zi(o,e,t,r,n,s,i,c){let{geometry:l,_indirectBuffer:m}=o;for(let f=r,u=r+n;f<u;f++)Le(l,e,t,f,s,i,c)}function Ji(o,e,t,r,n,s,i){let{geometry:c,_indirectBuffer:l}=o,m=1/0,f=null;for(let u=r,a=r+n;u<a;u++){let d;d=Le(c,e,t,u,null,s,i),d&&d.distance<m&&(f=d,m=d.distance)}return f}function eo(o,e,t,r,n,s,i){let{geometry:c}=t,{index:l}=c,m=c.attributes.position;for(let f=o,u=e+o;f<u;f++){let a;if(a=f,L(i,a*3,l,m),i.needsUpdate=!0,r(i,a,n,s))return!0}return!1}function to(o,e=null){e&&Array.isArray(e)&&(e=new Set(e));let t=o.geometry,r=t.index?t.index.array:null,n=t.attributes.position,s,i,c,l,m=0,f=o._roots;for(let a=0,d=f.length;a<d;a++)s=f[a],i=new Uint32Array(s),c=new Uint16Array(s),l=new Float32Array(s),u(0,m),m+=s.byteLength;function u(a,d,g=!1){let T=a*2;if(c[T+15]===65535){let y=i[a+6],v=c[T+14],p=1/0,b=1/0,x=1/0,w=-1/0,S=-1/0,I=-1/0;for(let A=3*y,R=3*(y+v);A<R;A++){let P=r[A],_=n.getX(P),M=n.getY(P),F=n.getZ(P);_<p&&(p=_),_>w&&(w=_),M<b&&(b=M),M>S&&(S=M),F<x&&(x=F),F>I&&(I=F)}return l[a+0]!==p||l[a+1]!==b||l[a+2]!==x||l[a+3]!==w||l[a+4]!==S||l[a+5]!==I?(l[a+0]=p,l[a+1]=b,l[a+2]=x,l[a+3]=w,l[a+4]=S,l[a+5]=I,!0):!1}else{let y=a+8,v=i[a+6],p=y+d,b=v+d,x=g,w=!1,S=!1;e?x||(w=e.has(p),S=e.has(b),x=!w&&!S):(w=!0,S=!0);let I=x||w,A=x||S,R=!1;I&&(R=u(y,d,x));let P=!1;A&&(P=u(v,d,x));let _=R||P;if(_)for(let M=0;M<3;M++){let F=y+M,C=v+M,B=l[F],V=l[F+3],X=l[C],Z=l[C+3];l[a+M]=B<X?B:X,l[a+M+3]=V>Z?V:Z}return _}}}function K(o,e,t,r,n){let s,i,c,l,m,f,u=1/t.direction.x,a=1/t.direction.y,d=1/t.direction.z,g=t.origin.x,T=t.origin.y,h=t.origin.z,y=e[o],v=e[o+3],p=e[o+1],b=e[o+3+1],x=e[o+2],w=e[o+3+2];return u>=0?(s=(y-g)*u,i=(v-g)*u):(s=(v-g)*u,i=(y-g)*u),a>=0?(c=(p-T)*a,l=(b-T)*a):(c=(b-T)*a,l=(p-T)*a),s>l||c>i||((c>s||isNaN(s))&&(s=c),(l<i||isNaN(i))&&(i=l),d>=0?(m=(x-h)*d,f=(w-h)*d):(m=(w-h)*d,f=(x-h)*d),s>f||m>i)?!1:((m>s||s!==s)&&(s=m),(f<i||i!==i)&&(i=f),s<=n&&i>=r)}function ro(o,e,t,r,n,s,i,c){let{geometry:l,_indirectBuffer:m}=o;for(let f=r,u=r+n;f<u;f++){let a=m?m[f]:f;Le(l,e,t,a,s,i,c)}}function io(o,e,t,r,n,s,i){let{geometry:c,_indirectBuffer:l}=o,m=1/0,f=null;for(let u=r,a=r+n;u<a;u++){let d;d=Le(c,e,t,l?l[u]:u,null,s,i),d&&d.distance<m&&(f=d,m=d.distance)}return f}function oo(o,e,t,r,n,s,i){let{geometry:c}=t,{index:l}=c,m=c.attributes.position;for(let f=o,u=e+o;f<u;f++){let a;if(a=t.resolveTriangleIndex(f),L(i,a*3,l,m),i.needsUpdate=!0,r(i,a,n,s))return!0}return!1}function no(o,e,t,r,n,s,i){D.setBuffer(o._roots[e]),Hr(0,o,t,r,n,s,i),D.clearBuffer()}function Hr(o,e,t,r,n,s,i){let{float32Array:c,uint16Array:l,uint32Array:m}=D,f=o*2;if(N(f,l)){let a=k(o,m),d=z(f,l);Zi(e,t,r,a,d,n,s,i)}else{let a=U(o);K(a,c,r,s,i)&&Hr(a,e,t,r,n,s,i);let d=H(o,m);K(d,c,r,s,i)&&Hr(d,e,t,r,n,s,i)}}var Is=["x","y","z"];function so(o,e,t,r,n,s){D.setBuffer(o._roots[e]);let i=Ur(0,o,t,r,n,s);return D.clearBuffer(),i}function Ur(o,e,t,r,n,s){let{float32Array:i,uint16Array:c,uint32Array:l}=D,m=o*2;if(N(m,c)){let u=k(o,l),a=z(m,c);return Ji(e,t,r,u,a,n,s)}else{let u=Ce(o,l),a=Is[u],g=r.direction[a]>=0,T,h;g?(T=U(o),h=H(o,l)):(T=H(o,l),h=U(o));let v=K(T,i,r,n,s)?Ur(T,e,t,r,n,s):null;if(v){let x=v.point[a];if(g?x<=i[h+u]:x>=i[h+u+3])return v}let b=K(h,i,r,n,s)?Ur(h,e,t,r,n,s):null;return v&&b?v.distance<=b.distance?v:b:v||b||null}}import{Box3 as Rs,Matrix4 as Ms}from"three";var Pt=new Rs,Ne=new W,ke=new W,it=new Ms,ao=new O,Ft=new O;function co(o,e,t,r){D.setBuffer(o._roots[e]);let n=Wr(0,o,t,r);return D.clearBuffer(),n}function Wr(o,e,t,r,n=null){let{float32Array:s,uint16Array:i,uint32Array:c}=D,l=o*2;if(n===null&&(t.boundingBox||t.computeBoundingBox(),ao.set(t.boundingBox.min,t.boundingBox.max,r),n=ao),N(l,i)){let f=e.geometry,u=f.index,a=f.attributes.position,d=t.index,g=t.attributes.position,T=k(o,c),h=z(l,i);if(it.copy(r).invert(),t.boundsTree)return E(o,s,Ft),Ft.matrix.copy(it),Ft.needsUpdate=!0,t.boundsTree.shapecast({intersectsBounds:v=>Ft.intersectsBox(v),intersectsTriangle:v=>{v.a.applyMatrix4(r),v.b.applyMatrix4(r),v.c.applyMatrix4(r),v.needsUpdate=!0;for(let p=T*3,b=(h+T)*3;p<b;p+=3)if(L(ke,p,u,a),ke.needsUpdate=!0,v.intersectsTriangle(ke))return!0;return!1}});{let y=q(t);for(let v=T*3,p=(h+T)*3;v<p;v+=3){L(Ne,v,u,a),Ne.a.applyMatrix4(it),Ne.b.applyMatrix4(it),Ne.c.applyMatrix4(it),Ne.needsUpdate=!0;for(let b=0,x=y*3;b<x;b+=3)if(L(ke,b,d,g),ke.needsUpdate=!0,Ne.intersectsTriangle(ke))return!0}}}else{let f=o+8,u=c[o+6];return E(f,s,Pt),!!(n.intersectsBox(Pt)&&Wr(f,e,t,r,n)||(E(u,s,Pt),n.intersectsBox(Pt)&&Wr(u,e,t,r,n)))}}import{Matrix4 as Ps,Vector3 as Dt}from"three";var Ct=new Ps,Vr=new O,ot=new O,Fs=new Dt,Cs=new Dt,Ds=new Dt,Bs=new Dt;function lo(o,e,t,r={},n={},s=0,i=1/0){e.boundingBox||e.computeBoundingBox(),Vr.set(e.boundingBox.min,e.boundingBox.max,t),Vr.needsUpdate=!0;let c=o.geometry,l=c.attributes.position,m=c.index,f=e.attributes.position,u=e.index,a=G.getPrimitive(),d=G.getPrimitive(),g=Fs,T=Cs,h=null,y=null;n&&(h=Ds,y=Bs);let v=1/0,p=null,b=null;return Ct.copy(t).invert(),ot.matrix.copy(Ct),o.shapecast({boundsTraverseOrder:x=>Vr.distanceToBox(x),intersectsBounds:(x,w,S)=>S<v&&S<i?(w&&(ot.min.copy(x.min),ot.max.copy(x.max),ot.needsUpdate=!0),!0):!1,intersectsRange:(x,w)=>{if(e.boundsTree)return e.boundsTree.shapecast({boundsTraverseOrder:I=>ot.distanceToBox(I),intersectsBounds:(I,A,R)=>R<v&&R<i,intersectsRange:(I,A)=>{for(let R=I,P=I+A;R<P;R++){L(d,3*R,u,f),d.a.applyMatrix4(t),d.b.applyMatrix4(t),d.c.applyMatrix4(t),d.needsUpdate=!0;for(let _=x,M=x+w;_<M;_++){L(a,3*_,m,l),a.needsUpdate=!0;let F=a.distanceToTriangle(d,g,h);if(F<v&&(T.copy(g),y&&y.copy(h),v=F,p=_,b=R),F<s)return!0}}}});{let S=q(e);for(let I=0,A=S;I<A;I++){L(d,3*I,u,f),d.a.applyMatrix4(t),d.b.applyMatrix4(t),d.c.applyMatrix4(t),d.needsUpdate=!0;for(let R=x,P=x+w;R<P;R++){L(a,3*R,m,l),a.needsUpdate=!0;let _=a.distanceToTriangle(d,g,h);if(_<v&&(T.copy(g),y&&y.copy(h),v=_,p=R,b=I),_<s)return!0}}}}}),G.releasePrimitive(a),G.releasePrimitive(d),v===1/0?null:(r.point?r.point.copy(T):r.point=T.clone(),r.distance=v,r.faceIndex=p,n&&(n.point?n.point.copy(y):n.point=y.clone(),n.point.applyMatrix4(Ct),T.applyMatrix4(Ct),n.distance=T.sub(n.point).length(),n.faceIndex=b),r)}function uo(o,e=null){e&&Array.isArray(e)&&(e=new Set(e));let t=o.geometry,r=t.index?t.index.array:null,n=t.attributes.position,s,i,c,l,m=0,f=o._roots;for(let a=0,d=f.length;a<d;a++)s=f[a],i=new Uint32Array(s),c=new Uint16Array(s),l=new Float32Array(s),u(0,m),m+=s.byteLength;function u(a,d,g=!1){let T=a*2;if(c[T+15]===65535){let y=i[a+6],v=c[T+14],p=1/0,b=1/0,x=1/0,w=-1/0,S=-1/0,I=-1/0;for(let A=y,R=y+v;A<R;A++){let P=3*o.resolveTriangleIndex(A);for(let _=0;_<3;_++){let M=P+_;M=r?r[M]:M;let F=n.getX(M),C=n.getY(M),B=n.getZ(M);F<p&&(p=F),F>w&&(w=F),C<b&&(b=C),C>S&&(S=C),B<x&&(x=B),B>I&&(I=B)}}return l[a+0]!==p||l[a+1]!==b||l[a+2]!==x||l[a+3]!==w||l[a+4]!==S||l[a+5]!==I?(l[a+0]=p,l[a+1]=b,l[a+2]=x,l[a+3]=w,l[a+4]=S,l[a+5]=I,!0):!1}else{let y=a+8,v=i[a+6],p=y+d,b=v+d,x=g,w=!1,S=!1;e?x||(w=e.has(p),S=e.has(b),x=!w&&!S):(w=!0,S=!0);let I=x||w,A=x||S,R=!1;I&&(R=u(y,d,x));let P=!1;A&&(P=u(v,d,x));let _=R||P;if(_)for(let M=0;M<3;M++){let F=y+M,C=v+M,B=l[F],V=l[F+3],X=l[C],Z=l[C+3];l[a+M]=B<X?B:X,l[a+M+3]=V>Z?V:Z}return _}}}function fo(o,e,t,r,n,s,i){D.setBuffer(o._roots[e]),Gr(0,o,t,r,n,s,i),D.clearBuffer()}function Gr(o,e,t,r,n,s,i){let{float32Array:c,uint16Array:l,uint32Array:m}=D,f=o*2;if(N(f,l)){let a=k(o,m),d=z(f,l);ro(e,t,r,a,d,n,s,i)}else{let a=U(o);K(a,c,r,s,i)&&Gr(a,e,t,r,n,s,i);let d=H(o,m);K(d,c,r,s,i)&&Gr(d,e,t,r,n,s,i)}}var Es=["x","y","z"];function mo(o,e,t,r,n,s){D.setBuffer(o._roots[e]);let i=qr(0,o,t,r,n,s);return D.clearBuffer(),i}function qr(o,e,t,r,n,s){let{float32Array:i,uint16Array:c,uint32Array:l}=D,m=o*2;if(N(m,c)){let u=k(o,l),a=z(m,c);return io(e,t,r,u,a,n,s)}else{let u=Ce(o,l),a=Es[u],g=r.direction[a]>=0,T,h;g?(T=U(o),h=H(o,l)):(T=H(o,l),h=U(o));let v=K(T,i,r,n,s)?qr(T,e,t,r,n,s):null;if(v){let x=v.point[a];if(g?x<=i[h+u]:x>=i[h+u+3])return v}let b=K(h,i,r,n,s)?qr(h,e,t,r,n,s):null;return v&&b?v.distance<=b.distance?v:b:v||b||null}}import{Box3 as Ls,Matrix4 as Ns}from"three";var Bt=new Ls,ze=new W,Oe=new W,nt=new Ns,ho=new O,Et=new O;function po(o,e,t,r){D.setBuffer(o._roots[e]);let n=$r(0,o,t,r);return D.clearBuffer(),n}function $r(o,e,t,r,n=null){let{float32Array:s,uint16Array:i,uint32Array:c}=D,l=o*2;if(n===null&&(t.boundingBox||t.computeBoundingBox(),ho.set(t.boundingBox.min,t.boundingBox.max,r),n=ho),N(l,i)){let f=e.geometry,u=f.index,a=f.attributes.position,d=t.index,g=t.attributes.position,T=k(o,c),h=z(l,i);if(nt.copy(r).invert(),t.boundsTree)return E(o,s,Et),Et.matrix.copy(nt),Et.needsUpdate=!0,t.boundsTree.shapecast({intersectsBounds:v=>Et.intersectsBox(v),intersectsTriangle:v=>{v.a.applyMatrix4(r),v.b.applyMatrix4(r),v.c.applyMatrix4(r),v.needsUpdate=!0;for(let p=T,b=h+T;p<b;p++)if(L(Oe,3*e.resolveTriangleIndex(p),u,a),Oe.needsUpdate=!0,v.intersectsTriangle(Oe))return!0;return!1}});{let y=q(t);for(let v=T,p=h+T;v<p;v++){let b=e.resolveTriangleIndex(v);L(ze,3*b,u,a),ze.a.applyMatrix4(nt),ze.b.applyMatrix4(nt),ze.c.applyMatrix4(nt),ze.needsUpdate=!0;for(let x=0,w=y*3;x<w;x+=3)if(L(Oe,x,d,g),Oe.needsUpdate=!0,ze.intersectsTriangle(Oe))return!0}}}else{let f=o+8,u=c[o+6];return E(f,s,Bt),!!(n.intersectsBox(Bt)&&$r(f,e,t,r,n)||(E(u,s,Bt),n.intersectsBox(Bt)&&$r(u,e,t,r,n)))}}import{Matrix4 as ks,Vector3 as Nt}from"three";var Lt=new ks,Yr=new O,st=new O,zs=new Nt,Os=new Nt,Hs=new Nt,Us=new Nt;function go(o,e,t,r={},n={},s=0,i=1/0){e.boundingBox||e.computeBoundingBox(),Yr.set(e.boundingBox.min,e.boundingBox.max,t),Yr.needsUpdate=!0;let c=o.geometry,l=c.attributes.position,m=c.index,f=e.attributes.position,u=e.index,a=G.getPrimitive(),d=G.getPrimitive(),g=zs,T=Os,h=null,y=null;n&&(h=Hs,y=Us);let v=1/0,p=null,b=null;return Lt.copy(t).invert(),st.matrix.copy(Lt),o.shapecast({boundsTraverseOrder:x=>Yr.distanceToBox(x),intersectsBounds:(x,w,S)=>S<v&&S<i?(w&&(st.min.copy(x.min),st.max.copy(x.max),st.needsUpdate=!0),!0):!1,intersectsRange:(x,w)=>{if(e.boundsTree){let S=e.boundsTree;return S.shapecast({boundsTraverseOrder:I=>st.distanceToBox(I),intersectsBounds:(I,A,R)=>R<v&&R<i,intersectsRange:(I,A)=>{for(let R=I,P=I+A;R<P;R++){let _=S.resolveTriangleIndex(R);L(d,3*_,u,f),d.a.applyMatrix4(t),d.b.applyMatrix4(t),d.c.applyMatrix4(t),d.needsUpdate=!0;for(let M=x,F=x+w;M<F;M++){let C=o.resolveTriangleIndex(M);L(a,3*C,m,l),a.needsUpdate=!0;let B=a.distanceToTriangle(d,g,h);if(B<v&&(T.copy(g),y&&y.copy(h),v=B,p=M,b=R),B<s)return!0}}}})}else{let S=q(e);for(let I=0,A=S;I<A;I++){L(d,3*I,u,f),d.a.applyMatrix4(t),d.b.applyMatrix4(t),d.c.applyMatrix4(t),d.needsUpdate=!0;for(let R=x,P=x+w;R<P;R++){let _=o.resolveTriangleIndex(R);L(a,3*_,m,l),a.needsUpdate=!0;let M=a.distanceToTriangle(d,g,h);if(M<v&&(T.copy(g),y&&y.copy(h),v=M,p=R,b=I),M<s)return!0}}}}}),G.releasePrimitive(a),G.releasePrimitive(d),v===1/0?null:(r.point?r.point.copy(T):r.point=T.clone(),r.distance=v,r.faceIndex=p,n&&(n.point?n.point.copy(y):n.point=y.clone(),n.point.applyMatrix4(Lt),T.applyMatrix4(Lt),n.distance=T.sub(n.point).length(),n.faceIndex=b),r)}function vo(){return typeof SharedArrayBuffer<"u"}import{Box3 as ct,Matrix4 as Ws}from"three";var at=new D.constructor,kt=new D.constructor,ue=new ce(()=>new ct),He=new ct,Ue=new ct,jr=new ct,Xr=new ct,Qr=!1;function xo(o,e,t,r){if(Qr)throw new Error("MeshBVH: Recursive calls to bvhcast not supported.");Qr=!0;let n=o._roots,s=e._roots,i,c=0,l=0,m=new Ws().copy(t).invert();for(let f=0,u=n.length;f<u;f++){at.setBuffer(n[f]),l=0;let a=ue.getPrimitive();E(0,at.float32Array,a),a.applyMatrix4(m);for(let d=0,g=s.length;d<g&&(kt.setBuffer(s[d]),i=ee(0,0,t,m,r,c,l,0,0,a),kt.clearBuffer(),l+=s[d].length,!i);d++);if(ue.releasePrimitive(a),at.clearBuffer(),c+=n[f].length,i)break}return Qr=!1,i}function ee(o,e,t,r,n,s=0,i=0,c=0,l=0,m=null,f=!1){let u,a;f?(u=kt,a=at):(u=at,a=kt);let d=u.float32Array,g=u.uint32Array,T=u.uint16Array,h=a.float32Array,y=a.uint32Array,v=a.uint16Array,p=o*2,b=e*2,x=N(p,T),w=N(b,v),S=!1;if(w&&x)f?S=n(k(e,y),z(e*2,v),k(o,g),z(o*2,T),l,i+e,c,s+o):S=n(k(o,g),z(o*2,T),k(e,y),z(e*2,v),c,s+o,l,i+e);else if(w){let I=ue.getPrimitive();E(e,h,I),I.applyMatrix4(t);let A=U(o),R=H(o,g);E(A,d,He),E(R,d,Ue);let P=I.intersectsBox(He),_=I.intersectsBox(Ue);S=P&&ee(e,A,r,t,n,i,s,l,c+1,I,!f)||_&&ee(e,R,r,t,n,i,s,l,c+1,I,!f),ue.releasePrimitive(I)}else{let I=U(e),A=H(e,y);E(I,h,jr),E(A,h,Xr);let R=m.intersectsBox(jr),P=m.intersectsBox(Xr);if(R&&P)S=ee(o,I,t,r,n,s,i,c,l+1,m,f)||ee(o,A,t,r,n,s,i,c,l+1,m,f);else if(R)if(x)S=ee(o,I,t,r,n,s,i,c,l+1,m,f);else{let _=ue.getPrimitive();_.copy(jr).applyMatrix4(t);let M=U(o),F=H(o,g);E(M,d,He),E(F,d,Ue);let C=_.intersectsBox(He),B=_.intersectsBox(Ue);S=C&&ee(I,M,r,t,n,i,s,l,c+1,_,!f)||B&&ee(I,F,r,t,n,i,s,l,c+1,_,!f),ue.releasePrimitive(_)}else if(P)if(x)S=ee(o,A,t,r,n,s,i,c,l+1,m,f);else{let _=ue.getPrimitive();_.copy(Xr).applyMatrix4(t);let M=U(o),F=H(o,g);E(M,d,He),E(F,d,Ue);let C=_.intersectsBox(He),B=_.intersectsBox(Ue);S=C&&ee(A,M,r,t,n,i,s,l,c+1,_,!f)||B&&ee(A,F,r,t,n,i,s,l,c+1,_,!f),ue.releasePrimitive(_)}}return S}var zt=new O,bo=new To,Gs={strategy:0,maxDepth:40,maxLeafTris:10,useSharedArrayBuffer:!1,setBoundingBox:!0,onProgress:null,indirect:!1,verbose:!0,range:null},ye=class o{static serialize(e,t={}){t={cloneBuffers:!0,...t};let r=e.geometry,n=e._roots,s=e._indirectBuffer,i=r.getIndex(),c;return t.cloneBuffers?c={roots:n.map(l=>l.slice()),index:i?i.array.slice():null,indirectBuffer:s?s.slice():null}:c={roots:n,index:i?i.array:null,indirectBuffer:s},c}static deserialize(e,t,r={}){r={setIndex:!0,indirect:!!e.indirectBuffer,...r};let{index:n,roots:s,indirectBuffer:i}=e,c=new o(t,{...r,[vt]:!0});if(c._roots=s,c._indirectBuffer=i||null,r.setIndex){let l=t.getIndex();if(l===null){let m=new Vs(e.index,1,!1);t.setIndex(m)}else l.array!==n&&(l.array.set(n),l.needsUpdate=!0)}return c}get indirect(){return!!this._indirectBuffer}constructor(e,t={}){if(e.isBufferGeometry){if(e.index&&e.index.isInterleavedBufferAttribute)throw new Error("MeshBVH: InterleavedBufferAttribute is not supported for the index attribute.")}else throw new Error("MeshBVH: Only BufferGeometries are supported.");if(t=Object.assign({...Gs,[vt]:!1},t),t.useSharedArrayBuffer&&!vo())throw new Error("MeshBVH: SharedArrayBuffer is not available.");this.geometry=e,this._roots=null,this._indirectBuffer=null,t[vt]||(Oi(this,t),!e.boundingBox&&t.setBoundingBox&&(e.boundingBox=this.getBoundingBox(new To))),this.resolveTriangleIndex=t.indirect?r=>this._indirectBuffer[r]:r=>r}refit(e=null){return(this.indirect?uo:to)(this,e)}traverse(e,t=0){let r=this._roots[t],n=new Uint32Array(r),s=new Uint16Array(r);i(0);function i(c,l=0){let m=c*2,f=s[m+15]===65535;if(f){let u=n[c+6],a=s[m+14];e(l,f,new Float32Array(r,c*4,6),u,a)}else{let u=c+32/4,a=n[c+6],d=n[c+7];e(l,f,new Float32Array(r,c*4,6),d)||(i(u,l+1),i(a,l+1))}}}raycast(e,t=yo,r=0,n=1/0){let s=this._roots,i=this.geometry,c=[],l=t.isMaterial,m=Array.isArray(t),f=i.groups,u=l?t.side:t,a=this.indirect?fo:no;for(let d=0,g=s.length;d<g;d++){let T=m?t[f[d].materialIndex].side:u,h=c.length;if(a(this,d,T,e,c,r,n),m){let y=f[d].materialIndex;for(let v=h,p=c.length;v<p;v++)c[v].face.materialIndex=y}}return c}raycastFirst(e,t=yo,r=0,n=1/0){let s=this._roots,i=this.geometry,c=t.isMaterial,l=Array.isArray(t),m=null,f=i.groups,u=c?t.side:t,a=this.indirect?mo:so;for(let d=0,g=s.length;d<g;d++){let T=l?t[f[d].materialIndex].side:u,h=a(this,d,T,e,r,n);h!=null&&(m==null||h.distance<m.distance)&&(m=h,l&&(h.face.materialIndex=f[d].materialIndex))}return m}intersectsGeometry(e,t){let r=!1,n=this._roots,s=this.indirect?po:co;for(let i=0,c=n.length;i<c&&(r=s(this,i,e,t),!r);i++);return r}shapecast(e){let t=G.getPrimitive(),r=this.indirect?oo:eo,{boundsTraverseOrder:n,intersectsBounds:s,intersectsRange:i,intersectsTriangle:c}=e;if(i&&c){let u=i;i=(a,d,g,T,h)=>u(a,d,g,T,h)?!0:r(a,d,this,c,g,T,t)}else i||(c?i=(u,a,d,g)=>r(u,a,this,c,d,g,t):i=(u,a,d)=>d);let l=!1,m=0,f=this._roots;for(let u=0,a=f.length;u<a;u++){let d=f[u];if(l=qi(this,u,s,i,n,m),l)break;m+=d.byteLength}return G.releasePrimitive(t),l}bvhcast(e,t,r){let{intersectsRanges:n,intersectsTriangles:s}=r,i=G.getPrimitive(),c=this.geometry.index,l=this.geometry.attributes.position,m=this.indirect?g=>{let T=this.resolveTriangleIndex(g);L(i,T*3,c,l)}:g=>{L(i,g*3,c,l)},f=G.getPrimitive(),u=e.geometry.index,a=e.geometry.attributes.position,d=e.indirect?g=>{let T=e.resolveTriangleIndex(g);L(f,T*3,u,a)}:g=>{L(f,g*3,u,a)};if(s){let g=(T,h,y,v,p,b,x,w)=>{for(let S=y,I=y+v;S<I;S++){d(S),f.a.applyMatrix4(t),f.b.applyMatrix4(t),f.c.applyMatrix4(t),f.needsUpdate=!0;for(let A=T,R=T+h;A<R;A++)if(m(A),i.needsUpdate=!0,s(i,f,A,S,p,b,x,w))return!0}return!1};if(n){let T=n;n=function(h,y,v,p,b,x,w,S){return T(h,y,v,p,b,x,w,S)?!0:g(h,y,v,p,b,x,w,S)}}else n=g}return xo(this,e,t,n)}intersectsBox(e,t){return zt.set(e.min,e.max,t),zt.needsUpdate=!0,this.shapecast({intersectsBounds:r=>zt.intersectsBox(r),intersectsTriangle:r=>zt.intersectsTriangle(r)})}intersectsSphere(e){return this.shapecast({intersectsBounds:t=>e.intersectsBox(t),intersectsTriangle:t=>t.intersectsSphere(e)})}closestPointToGeometry(e,t,r={},n={},s=0,i=1/0){return(this.indirect?go:lo)(this,e,t,r,n,s,i)}closestPointToPoint(e,t={},r=0,n=1/0){return Yi(this,e,t,r,n)}getBoundingBox(e){return e.makeEmpty(),this._roots.forEach(r=>{E(0,new Float32Array(r),bo),e.union(bo)}),e}};import{DataTexture as Io,FloatType as ea,UnsignedIntType as ta,RGBAFormat as ra,RGIntegerFormat as ia,NearestFilter as Wt,BufferAttribute as oa}from"three";import{DataTexture as qs,FloatType as Ot,IntType as Kr,UnsignedIntType as Ht,ByteType as wo,UnsignedByteType as So,ShortType as $s,UnsignedShortType as Ys,RedFormat as js,RGFormat as Xs,RGBAFormat as Zr,RedIntegerFormat as Qs,RGIntegerFormat as Ks,RGBAIntegerFormat as Jr,NearestFilter as _o}from"three";function Zs(o){switch(o){case 1:return"R";case 2:return"RG";case 3:return"RGBA";case 4:return"RGBA"}throw new Error}function Js(o){switch(o){case 1:return js;case 2:return Xs;case 3:return Zr;case 4:return Zr}}function Ao(o){switch(o){case 1:return Qs;case 2:return Ks;case 3:return Jr;case 4:return Jr}}var Ut=class extends qs{constructor(){super(),this.minFilter=_o,this.magFilter=_o,this.generateMipmaps=!1,this.overrideItemSize=null,this._forcedType=null}updateFrom(e){let t=this.overrideItemSize,r=e.itemSize,n=e.count;if(t!==null){if(r*n%t!==0)throw new Error("VertexAttributeTexture: overrideItemSize must divide evenly into buffer length.");e.itemSize=t,e.count=n*r/t}let s=e.itemSize,i=e.count,c=e.normalized,l=e.array.constructor,m=l.BYTES_PER_ELEMENT,f=this._forcedType,u=s;if(f===null)switch(l){case Float32Array:f=Ot;break;case Uint8Array:case Uint16Array:case Uint32Array:f=Ht;break;case Int8Array:case Int16Array:case Int32Array:f=Kr;break}let a,d,g,T,h=Zs(s);switch(f){case Ot:g=1,d=Js(s),c&&m===1?(T=l,h+="8",l===Uint8Array?a=So:(a=wo,h+="_SNORM")):(T=Float32Array,h+="32F",a=Ot);break;case Kr:h+=m*8+"I",g=c?Math.pow(2,l.BYTES_PER_ELEMENT*8-1):1,d=Ao(s),m===1?(T=Int8Array,a=wo):m===2?(T=Int16Array,a=$s):(T=Int32Array,a=Kr);break;case Ht:h+=m*8+"UI",g=c?Math.pow(2,l.BYTES_PER_ELEMENT*8-1):1,d=Ao(s),m===1?(T=Uint8Array,a=So):m===2?(T=Uint16Array,a=Ys):(T=Uint32Array,a=Ht);break}u===3&&(d===Zr||d===Jr)&&(u=4);let y=Math.ceil(Math.sqrt(i))||1,v=u*y*y,p=new T(v),b=e.normalized;e.normalized=!1;for(let x=0;x<i;x++){let w=u*x;p[w]=e.getX(x)/g,s>=2&&(p[w+1]=e.getY(x)/g),s>=3&&(p[w+2]=e.getZ(x)/g,u===4&&(p[w+3]=1)),s>=4&&(p[w+3]=e.getW(x)/g)}e.normalized=b,this.internalFormat=h,this.format=d,this.type=a,this.image.width=y,this.image.height=y,this.image.data=p,this.needsUpdate=!0,this.dispose(),e.itemSize=r,e.count=n}},We=class extends Ut{constructor(){super(),this._forcedType=Ht}};var Ve=class extends Ut{constructor(){super(),this._forcedType=Ot}};var Vt=class{constructor(){this.index=new We,this.position=new Ve,this.bvhBounds=new Io,this.bvhContents=new Io,this._cachedIndexAttr=null,this.index.overrideItemSize=3}updateFrom(e){let{geometry:t}=e;if(sa(e,this.bvhBounds,this.bvhContents),this.position.updateFrom(t.attributes.position),e.indirect){let r=e._indirectBuffer;if(this._cachedIndexAttr===null||this._cachedIndexAttr.count!==r.length)if(t.index)this._cachedIndexAttr=t.index.clone();else{let n=Pr(Mr(t));this._cachedIndexAttr=new oa(n,1,!1)}na(t,r,this._cachedIndexAttr),this.index.updateFrom(this._cachedIndexAttr)}else this.index.updateFrom(t.index)}dispose(){let{index:e,position:t,bvhBounds:r,bvhContents:n}=this;e&&e.dispose(),t&&t.dispose(),r&&r.dispose(),n&&n.dispose()}};function na(o,e,t){let r=t.array,n=o.index?o.index.array:null;for(let s=0,i=e.length;s<i;s++){let c=3*s,l=3*e[s];for(let m=0;m<3;m++)r[c+m]=n?n[l+m]:l+m}}function sa(o,e,t){let r=o._roots;if(r.length!==1)throw new Error("MeshBVHUniformStruct: Multi-root BVHs not supported.");let n=r[0],s=new Uint16Array(n),i=new Uint32Array(n),c=new Float32Array(n),l=n.byteLength/32,m=2*Math.ceil(Math.sqrt(l/2)),f=new Float32Array(4*m*m),u=Math.ceil(Math.sqrt(l)),a=new Uint32Array(2*u*u);for(let d=0;d<l;d++){let g=d*32/4,T=g*2,h=g;for(let y=0;y<3;y++)f[8*d+0+y]=c[h+0+y],f[8*d+4+y]=c[h+3+y];if(N(T,s)){let y=z(T,s),v=k(g,i),p=4294901760|y;a[d*2+0]=p,a[d*2+1]=v}else{let y=4*H(g,i)/32,v=Ce(g,i);a[d*2+0]=v,a[d*2+1]=y}}e.image.data=f,e.image.width=m,e.image.height=m,e.format=ra,e.type=ea,e.internalFormat="RGBA32F",e.minFilter=Wt,e.magFilter=Wt,e.generateMipmaps=!1,e.needsUpdate=!0,e.dispose(),t.image.data=a,t.image.width=u,t.image.height=u,t.format=ia,t.type=ta,t.internalFormat="RG32UI",t.minFilter=Wt,t.magFilter=Wt,t.generateMipmaps=!1,t.needsUpdate=!0,t.dispose()}var be={};is(be,{bvh_distance_functions:()=>Ro,bvh_ray_functions:()=>ti,bvh_struct_definitions:()=>Mo,common_functions:()=>ei});var ei=`

// A stack of uint32 indices can can store the indices for
// a perfectly balanced tree with a depth up to 31. Lower stack
// depth gets higher performance.
//
// However not all trees are balanced. Best value to set this to
// is the trees max depth.
#ifndef BVH_STACK_DEPTH
#define BVH_STACK_DEPTH 60
#endif

#ifndef INFINITY
#define INFINITY 1e20
#endif

// Utilities
uvec4 uTexelFetch1D( usampler2D tex, uint index ) {

	uint width = uint( textureSize( tex, 0 ).x );
	uvec2 uv;
	uv.x = index % width;
	uv.y = index / width;

	return texelFetch( tex, ivec2( uv ), 0 );

}

ivec4 iTexelFetch1D( isampler2D tex, uint index ) {

	uint width = uint( textureSize( tex, 0 ).x );
	uvec2 uv;
	uv.x = index % width;
	uv.y = index / width;

	return texelFetch( tex, ivec2( uv ), 0 );

}

vec4 texelFetch1D( sampler2D tex, uint index ) {

	uint width = uint( textureSize( tex, 0 ).x );
	uvec2 uv;
	uv.x = index % width;
	uv.y = index / width;

	return texelFetch( tex, ivec2( uv ), 0 );

}

vec4 textureSampleBarycoord( sampler2D tex, vec3 barycoord, uvec3 faceIndices ) {

	return
		barycoord.x * texelFetch1D( tex, faceIndices.x ) +
		barycoord.y * texelFetch1D( tex, faceIndices.y ) +
		barycoord.z * texelFetch1D( tex, faceIndices.z );

}

void ndcToCameraRay(
	vec2 coord, mat4 cameraWorld, mat4 invProjectionMatrix,
	out vec3 rayOrigin, out vec3 rayDirection
) {

	// get camera look direction and near plane for camera clipping
	vec4 lookDirection = cameraWorld * vec4( 0.0, 0.0, - 1.0, 0.0 );
	vec4 nearVector = invProjectionMatrix * vec4( 0.0, 0.0, - 1.0, 1.0 );
	float near = abs( nearVector.z / nearVector.w );

	// get the camera direction and position from camera matrices
	vec4 origin = cameraWorld * vec4( 0.0, 0.0, 0.0, 1.0 );
	vec4 direction = invProjectionMatrix * vec4( coord, 0.5, 1.0 );
	direction /= direction.w;
	direction = cameraWorld * direction - origin;

	// slide the origin along the ray until it sits at the near clip plane position
	origin.xyz += direction.xyz * near / dot( direction, lookDirection );

	rayOrigin = origin.xyz;
	rayDirection = direction.xyz;

}
`;var Ro=`

float dot2( vec3 v ) {

	return dot( v, v );

}

// https://www.shadertoy.com/view/ttfGWl
vec3 closestPointToTriangle( vec3 p, vec3 v0, vec3 v1, vec3 v2, out vec3 barycoord ) {

    vec3 v10 = v1 - v0;
    vec3 v21 = v2 - v1;
    vec3 v02 = v0 - v2;

	vec3 p0 = p - v0;
	vec3 p1 = p - v1;
	vec3 p2 = p - v2;

    vec3 nor = cross( v10, v02 );

    // method 2, in barycentric space
    vec3  q = cross( nor, p0 );
    float d = 1.0 / dot2( nor );
    float u = d * dot( q, v02 );
    float v = d * dot( q, v10 );
    float w = 1.0 - u - v;

	if( u < 0.0 ) {

		w = clamp( dot( p2, v02 ) / dot2( v02 ), 0.0, 1.0 );
		u = 0.0;
		v = 1.0 - w;

	} else if( v < 0.0 ) {

		u = clamp( dot( p0, v10 ) / dot2( v10 ), 0.0, 1.0 );
		v = 0.0;
		w = 1.0 - u;

	} else if( w < 0.0 ) {

		v = clamp( dot( p1, v21 ) / dot2( v21 ), 0.0, 1.0 );
		w = 0.0;
		u = 1.0 - v;

	}

	barycoord = vec3( u, v, w );
    return u * v1 + v * v2 + w * v0;

}

float distanceToTriangles(
	// geometry info and triangle range
	sampler2D positionAttr, usampler2D indexAttr, uint offset, uint count,

	// point and cut off range
	vec3 point, float closestDistanceSquared,

	// outputs
	inout uvec4 faceIndices, inout vec3 faceNormal, inout vec3 barycoord, inout float side, inout vec3 outPoint
) {

	bool found = false;
	vec3 localBarycoord;
	for ( uint i = offset, l = offset + count; i < l; i ++ ) {

		uvec3 indices = uTexelFetch1D( indexAttr, i ).xyz;
		vec3 a = texelFetch1D( positionAttr, indices.x ).rgb;
		vec3 b = texelFetch1D( positionAttr, indices.y ).rgb;
		vec3 c = texelFetch1D( positionAttr, indices.z ).rgb;

		// get the closest point and barycoord
		vec3 closestPoint = closestPointToTriangle( point, a, b, c, localBarycoord );
		vec3 delta = point - closestPoint;
		float sqDist = dot2( delta );
		if ( sqDist < closestDistanceSquared ) {

			// set the output results
			closestDistanceSquared = sqDist;
			faceIndices = uvec4( indices.xyz, i );
			faceNormal = normalize( cross( a - b, b - c ) );
			barycoord = localBarycoord;
			outPoint = closestPoint;
			side = sign( dot( faceNormal, delta ) );

		}

	}

	return closestDistanceSquared;

}

float distanceSqToBounds( vec3 point, vec3 boundsMin, vec3 boundsMax ) {

	vec3 clampedPoint = clamp( point, boundsMin, boundsMax );
	vec3 delta = point - clampedPoint;
	return dot( delta, delta );

}

float distanceSqToBVHNodeBoundsPoint( vec3 point, sampler2D bvhBounds, uint currNodeIndex ) {

	uint cni2 = currNodeIndex * 2u;
	vec3 boundsMin = texelFetch1D( bvhBounds, cni2 ).xyz;
	vec3 boundsMax = texelFetch1D( bvhBounds, cni2 + 1u ).xyz;
	return distanceSqToBounds( point, boundsMin, boundsMax );

}

// use a macro to hide the fact that we need to expand the struct into separate fields
#define	bvhClosestPointToPoint(		bvh,		point, maxDistance, faceIndices, faceNormal, barycoord, side, outPoint	)	_bvhClosestPointToPoint(		bvh.position, bvh.index, bvh.bvhBounds, bvh.bvhContents,		point, maxDistance, faceIndices, faceNormal, barycoord, side, outPoint	)

float _bvhClosestPointToPoint(
	// bvh info
	sampler2D bvh_position, usampler2D bvh_index, sampler2D bvh_bvhBounds, usampler2D bvh_bvhContents,

	// point to check
	vec3 point, float maxDistance,

	// output variables
	inout uvec4 faceIndices, inout vec3 faceNormal, inout vec3 barycoord,
	inout float side, inout vec3 outPoint
 ) {

	// stack needs to be twice as long as the deepest tree we expect because
	// we push both the left and right child onto the stack every traversal
	int ptr = 0;
	uint stack[ BVH_STACK_DEPTH ];
	stack[ 0 ] = 0u;

	float closestDistanceSquared = maxDistance * maxDistance;
	bool found = false;
	while ( ptr > - 1 && ptr < BVH_STACK_DEPTH ) {

		uint currNodeIndex = stack[ ptr ];
		ptr --;

		// check if we intersect the current bounds
		float boundsHitDistance = distanceSqToBVHNodeBoundsPoint( point, bvh_bvhBounds, currNodeIndex );
		if ( boundsHitDistance > closestDistanceSquared ) {

			continue;

		}

		uvec2 boundsInfo = uTexelFetch1D( bvh_bvhContents, currNodeIndex ).xy;
		bool isLeaf = bool( boundsInfo.x & 0xffff0000u );
		if ( isLeaf ) {

			uint count = boundsInfo.x & 0x0000ffffu;
			uint offset = boundsInfo.y;
			closestDistanceSquared = distanceToTriangles(
				bvh_position, bvh_index, offset, count, point, closestDistanceSquared,

				// outputs
				faceIndices, faceNormal, barycoord, side, outPoint
			);

		} else {

			uint leftIndex = currNodeIndex + 1u;
			uint splitAxis = boundsInfo.x & 0x0000ffffu;
			uint rightIndex = boundsInfo.y;
			bool leftToRight = distanceSqToBVHNodeBoundsPoint( point, bvh_bvhBounds, leftIndex ) < distanceSqToBVHNodeBoundsPoint( point, bvh_bvhBounds, rightIndex );//rayDirection[ splitAxis ] >= 0.0;
			uint c1 = leftToRight ? leftIndex : rightIndex;
			uint c2 = leftToRight ? rightIndex : leftIndex;

			// set c2 in the stack so we traverse it later. We need to keep track of a pointer in
			// the stack while we traverse. The second pointer added is the one that will be
			// traversed first
			ptr ++;
			stack[ ptr ] = c2;
			ptr ++;
			stack[ ptr ] = c1;

		}

	}

	return sqrt( closestDistanceSquared );

}
`;var ti=`

#ifndef TRI_INTERSECT_EPSILON
#define TRI_INTERSECT_EPSILON 1e-5
#endif

// Raycasting
bool intersectsBounds( vec3 rayOrigin, vec3 rayDirection, vec3 boundsMin, vec3 boundsMax, out float dist ) {

	// https://www.reddit.com/r/opengl/comments/8ntzz5/fast_glsl_ray_box_intersection/
	// https://tavianator.com/2011/ray_box.html
	vec3 invDir = 1.0 / rayDirection;

	// find intersection distances for each plane
	vec3 tMinPlane = invDir * ( boundsMin - rayOrigin );
	vec3 tMaxPlane = invDir * ( boundsMax - rayOrigin );

	// get the min and max distances from each intersection
	vec3 tMinHit = min( tMaxPlane, tMinPlane );
	vec3 tMaxHit = max( tMaxPlane, tMinPlane );

	// get the furthest hit distance
	vec2 t = max( tMinHit.xx, tMinHit.yz );
	float t0 = max( t.x, t.y );

	// get the minimum hit distance
	t = min( tMaxHit.xx, tMaxHit.yz );
	float t1 = min( t.x, t.y );

	// set distance to 0.0 if the ray starts inside the box
	dist = max( t0, 0.0 );

	return t1 >= dist;

}

bool intersectsTriangle(
	vec3 rayOrigin, vec3 rayDirection, vec3 a, vec3 b, vec3 c,
	out vec3 barycoord, out vec3 norm, out float dist, out float side
) {

	// https://stackoverflow.com/questions/42740765/intersection-between-line-and-triangle-in-3d
	vec3 edge1 = b - a;
	vec3 edge2 = c - a;
	norm = cross( edge1, edge2 );

	float det = - dot( rayDirection, norm );
	float invdet = 1.0 / det;

	vec3 AO = rayOrigin - a;
	vec3 DAO = cross( AO, rayDirection );

	vec4 uvt;
	uvt.x = dot( edge2, DAO ) * invdet;
	uvt.y = - dot( edge1, DAO ) * invdet;
	uvt.z = dot( AO, norm ) * invdet;
	uvt.w = 1.0 - uvt.x - uvt.y;

	// set the hit information
	barycoord = uvt.wxy; // arranged in A, B, C order
	dist = uvt.z;
	side = sign( det );
	norm = side * normalize( norm );

	// add an epsilon to avoid misses between triangles
	uvt += vec4( TRI_INTERSECT_EPSILON );

	return all( greaterThanEqual( uvt, vec4( 0.0 ) ) );

}

bool intersectTriangles(
	// geometry info and triangle range
	sampler2D positionAttr, usampler2D indexAttr, uint offset, uint count,

	// ray
	vec3 rayOrigin, vec3 rayDirection,

	// outputs
	inout float minDistance, inout uvec4 faceIndices, inout vec3 faceNormal, inout vec3 barycoord,
	inout float side, inout float dist
) {

	bool found = false;
	vec3 localBarycoord, localNormal;
	float localDist, localSide;
	for ( uint i = offset, l = offset + count; i < l; i ++ ) {

		uvec3 indices = uTexelFetch1D( indexAttr, i ).xyz;
		vec3 a = texelFetch1D( positionAttr, indices.x ).rgb;
		vec3 b = texelFetch1D( positionAttr, indices.y ).rgb;
		vec3 c = texelFetch1D( positionAttr, indices.z ).rgb;

		if (
			intersectsTriangle( rayOrigin, rayDirection, a, b, c, localBarycoord, localNormal, localDist, localSide )
			&& localDist < minDistance
		) {

			found = true;
			minDistance = localDist;

			faceIndices = uvec4( indices.xyz, i );
			faceNormal = localNormal;

			side = localSide;
			barycoord = localBarycoord;
			dist = localDist;

		}

	}

	return found;

}

bool intersectsBVHNodeBounds( vec3 rayOrigin, vec3 rayDirection, sampler2D bvhBounds, uint currNodeIndex, out float dist ) {

	uint cni2 = currNodeIndex * 2u;
	vec3 boundsMin = texelFetch1D( bvhBounds, cni2 ).xyz;
	vec3 boundsMax = texelFetch1D( bvhBounds, cni2 + 1u ).xyz;
	return intersectsBounds( rayOrigin, rayDirection, boundsMin, boundsMax, dist );

}

// use a macro to hide the fact that we need to expand the struct into separate fields
#define	bvhIntersectFirstHit(		bvh,		rayOrigin, rayDirection, faceIndices, faceNormal, barycoord, side, dist	)	_bvhIntersectFirstHit(		bvh.position, bvh.index, bvh.bvhBounds, bvh.bvhContents,		rayOrigin, rayDirection, faceIndices, faceNormal, barycoord, side, dist	)

bool _bvhIntersectFirstHit(
	// bvh info
	sampler2D bvh_position, usampler2D bvh_index, sampler2D bvh_bvhBounds, usampler2D bvh_bvhContents,

	// ray
	vec3 rayOrigin, vec3 rayDirection,

	// output variables split into separate variables due to output precision
	inout uvec4 faceIndices, inout vec3 faceNormal, inout vec3 barycoord,
	inout float side, inout float dist
) {

	// stack needs to be twice as long as the deepest tree we expect because
	// we push both the left and right child onto the stack every traversal
	int ptr = 0;
	uint stack[ BVH_STACK_DEPTH ];
	stack[ 0 ] = 0u;

	float triangleDistance = INFINITY;
	bool found = false;
	while ( ptr > - 1 && ptr < BVH_STACK_DEPTH ) {

		uint currNodeIndex = stack[ ptr ];
		ptr --;

		// check if we intersect the current bounds
		float boundsHitDistance;
		if (
			! intersectsBVHNodeBounds( rayOrigin, rayDirection, bvh_bvhBounds, currNodeIndex, boundsHitDistance )
			|| boundsHitDistance > triangleDistance
		) {

			continue;

		}

		uvec2 boundsInfo = uTexelFetch1D( bvh_bvhContents, currNodeIndex ).xy;
		bool isLeaf = bool( boundsInfo.x & 0xffff0000u );

		if ( isLeaf ) {

			uint count = boundsInfo.x & 0x0000ffffu;
			uint offset = boundsInfo.y;

			found = intersectTriangles(
				bvh_position, bvh_index, offset, count,
				rayOrigin, rayDirection, triangleDistance,
				faceIndices, faceNormal, barycoord, side, dist
			) || found;

		} else {

			uint leftIndex = currNodeIndex + 1u;
			uint splitAxis = boundsInfo.x & 0x0000ffffu;
			uint rightIndex = boundsInfo.y;

			bool leftToRight = rayDirection[ splitAxis ] >= 0.0;
			uint c1 = leftToRight ? leftIndex : rightIndex;
			uint c2 = leftToRight ? rightIndex : leftIndex;

			// set c2 in the stack so we traverse it later. We need to keep track of a pointer in
			// the stack while we traverse. The second pointer added is the one that will be
			// traversed first
			ptr ++;
			stack[ ptr ] = c2;

			ptr ++;
			stack[ ptr ] = c1;

		}

	}

	return found;

}
`;var Mo=`
struct BVH {

	usampler2D index;
	sampler2D position;

	sampler2D bvhBounds;
	usampler2D bvhContents;

};
`;var bm=`
	${ei}
	${ti}
`;import{BufferAttribute as Wo,BufferGeometry as Uo,Mesh as ba,MeshBasicMaterial as Ta}from"three";import{BufferAttribute as ca,BufferGeometry as la}from"three";import{BufferAttribute as aa}from"three";function Gt(o,e,t=0){if(o.isInterleavedBufferAttribute){let r=o.itemSize;for(let n=0,s=o.count;n<s;n++){let i=n+t;e.setX(i,o.getX(n)),r>=2&&e.setY(i,o.getY(n)),r>=3&&e.setZ(i,o.getZ(n)),r>=4&&e.setW(i,o.getW(n))}}else{let r=e.array,n=r.constructor,s=r.BYTES_PER_ELEMENT*o.itemSize*t;new n(r.buffer,s,o.array.length).set(o.array)}}function Te(o,e=null){let t=o.array.constructor,r=o.normalized,n=o.itemSize,s=e===null?o.count:e;return new aa(new t(n*s),n,r)}function fe(o,e){if(!o&&!e)return!0;if(!!o!=!!e)return!1;let t=o.count===e.count,r=o.normalized===e.normalized,n=o.array.constructor===e.array.constructor,s=o.itemSize===e.itemSize;return!(!t||!r||!n||!s)}function ua(o){let e=o[0].index!==null,t=new Set(Object.keys(o[0].attributes));if(!o[0].getAttribute("position"))throw new Error("StaticGeometryGenerator: position attribute is required.");for(let r=0;r<o.length;++r){let n=o[r],s=0;if(e!==(n.index!==null))throw new Error("StaticGeometryGenerator: All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them.");for(let i in n.attributes){if(!t.has(i))throw new Error('StaticGeometryGenerator: All geometries must have compatible attributes; make sure "'+i+'" attribute exists among all geometries, or in none of them.');s++}if(s!==t.size)throw new Error("StaticGeometryGenerator: All geometries must have the same number of attributes.")}}function fa(o){let e=0;for(let t=0,r=o.length;t<r;t++)e+=o[t].getIndex().count;return e}function ma(o){let e=0;for(let t=0,r=o.length;t<r;t++)e+=o[t].getAttribute("position").count;return e}function ha(o,e,t){o.index&&o.index.count!==e&&o.setIndex(null);let r=o.attributes;for(let n in r)r[n].count!==t&&o.deleteAttribute(n)}function Po(o,e={},t=new la){let{useGroups:r=!1,forceUpdate:n=!1,skipAssigningAttributes:s=[],overwriteIndex:i=!0}=e;ua(o);let c=o[0].index!==null,l=c?fa(o):-1,m=ma(o);if(ha(t,l,m),r){let u=0;for(let a=0,d=o.length;a<d;a++){let g=o[a],T;c?T=g.getIndex().count:T=g.getAttribute("position").count,t.addGroup(u,T,a),u+=T}}if(c){let u=!1;if(t.index||(t.setIndex(new ca(new Uint32Array(l),1,!1)),u=!0),u||i){let a=0,d=0,g=t.getIndex();for(let T=0,h=o.length;T<h;T++){let y=o[T],v=y.getIndex();if(!(!n&&!u&&s[T]))for(let b=0;b<v.count;++b)g.setX(a+b,v.getX(b)+d);a+=v.count,d+=y.getAttribute("position").count}}}let f=Object.keys(o[0].attributes);for(let u=0,a=f.length;u<a;u++){let d=!1,g=f[u];if(!t.getAttribute(g)){let y=o[0].getAttribute(g);t.setAttribute(g,Te(y,m)),d=!0}let T=0,h=t.getAttribute(g);for(let y=0,v=o.length;y<v;y++){let p=o[y],b=!n&&!d&&s[y],x=p.getAttribute(g);if(!b)if(g==="color"&&h.itemSize!==x.itemSize)for(let w=T,S=x.count;w<S;w++)x.setXYZW(w,h.getX(w),h.getY(w),h.getZ(w),1);else Gt(x,h,T);T+=x.count}}}import{BufferAttribute as lt}from"three";function Fo(o,e,t){let r=o.index,s=o.attributes.position.count,i=r?r.count:s,c=o.groups;c.length===0&&(c=[{count:i,start:0,materialIndex:0}]);let l=o.getAttribute("materialIndex");if(!l||l.count!==s){let f;t.length<=255?f=new Uint8Array(s):f=new Uint16Array(s),l=new lt(f,1,!1),o.deleteAttribute("materialIndex"),o.setAttribute("materialIndex",l)}let m=l.array;for(let f=0;f<c.length;f++){let u=c[f],a=u.start,d=u.count,g=Math.min(d,i-a),T=Array.isArray(e)?e[u.materialIndex]:e,h=t.indexOf(T);for(let y=0;y<g;y++){let v=a+y;r&&(v=r.getX(v)),m[v]=h}}}function Co(o,e){if(!o.index){let t=o.attributes.position.count,r=new Array(t);for(let n=0;n<t;n++)r[n]=n;o.setIndex(r)}if(!o.attributes.normal&&e&&e.includes("normal")&&o.computeVertexNormals(),!o.attributes.uv&&e&&e.includes("uv")){let t=o.attributes.position.count;o.setAttribute("uv",new lt(new Float32Array(t*2),2,!1))}if(!o.attributes.uv2&&e&&e.includes("uv2")){let t=o.attributes.position.count;o.setAttribute("uv2",new lt(new Float32Array(t*2),2,!1))}if(!o.attributes.tangent&&e&&e.includes("tangent"))if(o.attributes.uv&&o.attributes.normal)o.computeTangents();else{let t=o.attributes.position.count;o.setAttribute("tangent",new lt(new Float32Array(t*4),4,!1))}if(!o.attributes.color&&e&&e.includes("color")){let t=o.attributes.position.count,r=new Float32Array(t*4);r.fill(1),o.setAttribute("color",new lt(r,4))}}import{BufferGeometry as ya}from"three";import{Matrix4 as da}from"three";function Ge(o){let e=0;if(o.byteLength!==0){let t=new Uint8Array(o);for(let r=0;r<o.byteLength;r++){let n=t[r];e=(e<<5)-e+n,e|=0}}return e}function Do(o){let e=o.uuid,t=Object.values(o.attributes);o.index&&(t.push(o.index),e+=`index|${o.index.version}`);let r=Object.keys(t).sort();for(let n of r){let s=t[n];e+=`${n}_${s.version}|`}return e}function Bo(o){let e=o.skeleton;return e?(e.boneTexture||e.computeBoneTexture(),`${Ge(e.boneTexture.image.data.buffer)}_${e.boneTexture.uuid}`):null}var qt=class{constructor(e=null){this.matrixWorld=new da,this.geometryHash=null,this.skeletonHash=null,this.primitiveCount=-1,e!==null&&this.updateFrom(e)}updateFrom(e){let t=e.geometry,r=(t.index?t.index.count:t.attributes.position.count)/3;this.matrixWorld.copy(e.matrixWorld),this.geometryHash=Do(t),this.primitiveCount=r,this.skeletonHash=Bo(e)}didChange(e){let t=e.geometry,r=(t.index?t.index.count:t.attributes.position.count)/3;return!(this.matrixWorld.equals(e.matrixWorld)&&this.geometryHash===Do(t)&&this.skeletonHash===Bo(e)&&this.primitiveCount===r)}};import{BufferGeometry as pa,Matrix3 as ga,Matrix4 as Oo,Vector3 as ut,Vector4 as oi}from"three";var we=new ut,Se=new ut,_e=new ut,Eo=new oi,$t=new ut,ri=new ut,Lo=new oi,No=new oi,Yt=new Oo,ko=new Oo;function zo(o,e,t){let r=o.skeleton,n=o.geometry,s=r.bones,i=r.boneInverses;Lo.fromBufferAttribute(n.attributes.skinIndex,e),No.fromBufferAttribute(n.attributes.skinWeight,e),Yt.elements.fill(0);for(let c=0;c<4;c++){let l=No.getComponent(c);if(l!==0){let m=Lo.getComponent(c);ko.multiplyMatrices(s[m].matrixWorld,i[m]),va(Yt,ko,l)}}return Yt.multiply(o.bindMatrix).premultiply(o.bindMatrixInverse),t.transformDirection(Yt),t}function ii(o,e,t,r,n){$t.set(0,0,0);for(let s=0,i=o.length;s<i;s++){let c=e[s],l=o[s];c!==0&&(ri.fromBufferAttribute(l,r),t?$t.addScaledVector(ri,c):$t.addScaledVector(ri.sub(n),c))}n.add($t)}function va(o,e,t){let r=o.elements,n=e.elements;for(let s=0,i=n.length;s<i;s++)r[s]+=n[s]*t}function xa(o){let{index:e,attributes:t}=o;if(e)for(let r=0,n=e.count;r<n;r+=3){let s=e.getX(r),i=e.getX(r+2);e.setX(r,i),e.setX(r+2,s)}else for(let r in t){let n=t[r],s=n.itemSize;for(let i=0,c=n.count;i<c;i+=3)for(let l=0;l<s;l++){let m=n.getComponent(i,l),f=n.getComponent(i+2,l);n.setComponent(i,l,f),n.setComponent(i+2,l,m)}}return o}function Ho(o,e={},t=new pa){e={applyWorldTransforms:!0,attributes:[],...e};let r=o.geometry,n=e.applyWorldTransforms,s=e.attributes.includes("normal"),i=e.attributes.includes("tangent"),c=r.attributes,l=t.attributes;for(let v in t.attributes)(!e.attributes.includes(v)||!(v in r.attributes))&&t.deleteAttribute(v);!t.index&&r.index&&(t.index=r.index.clone()),l.position||t.setAttribute("position",Te(c.position)),s&&!l.normal&&c.normal&&t.setAttribute("normal",Te(c.normal)),i&&!l.tangent&&c.tangent&&t.setAttribute("tangent",Te(c.tangent)),fe(r.index,t.index),fe(c.position,l.position),s&&fe(c.normal,l.normal),i&&fe(c.tangent,l.tangent);let m=c.position,f=s?c.normal:null,u=i?c.tangent:null,a=r.morphAttributes.position,d=r.morphAttributes.normal,g=r.morphAttributes.tangent,T=r.morphTargetsRelative,h=o.morphTargetInfluences,y=new ga;y.getNormalMatrix(o.matrixWorld),r.index&&t.index.array.set(r.index.array);for(let v=0,p=c.position.count;v<p;v++)we.fromBufferAttribute(m,v),f&&Se.fromBufferAttribute(f,v),u&&(Eo.fromBufferAttribute(u,v),_e.fromBufferAttribute(u,v)),h&&(a&&ii(a,h,T,v,we),d&&ii(d,h,T,v,Se),g&&ii(g,h,T,v,_e)),o.isSkinnedMesh&&(o.applyBoneTransform(v,we),f&&zo(o,v,Se),u&&zo(o,v,_e)),n&&we.applyMatrix4(o.matrixWorld),l.position.setXYZ(v,we.x,we.y,we.z),f&&(n&&Se.applyNormalMatrix(y),l.normal.setXYZ(v,Se.x,Se.y,Se.z)),u&&(n&&_e.transformDirection(o.matrixWorld),l.tangent.setXYZW(v,_e.x,_e.y,_e.z,Eo.w));for(let v in e.attributes){let p=e.attributes[v];p==="position"||p==="tangent"||p==="normal"||!(p in c)||(l[p]||t.setAttribute(p,Te(c[p])),fe(c[p],l[p]),Gt(c[p],l[p]))}return o.matrixWorld.determinant()<0&&xa(t),t}var jt=class extends ya{constructor(){super(),this.version=0,this.hash=null,this._diff=new qt}isCompatible(e,t){let r=e.geometry;for(let n=0;n<t.length;n++){let s=t[n],i=r.attributes[s],c=this.attributes[s];if(i&&!fe(i,c))return!1}return!0}updateFrom(e,t){let r=this._diff;return r.didChange(e)?(Ho(e,t,this),r.updateFrom(e),this.version++,this.hash=`${this.uuid}_${this.version}`,!0):!1}};var Qt=0,ni=1,si=2;function wa(o,e){for(let t=0,r=o.length;t<r;t++)o[t].traverseVisible(s=>{s.isMesh&&e(s)})}function Sa(o){let e=[];for(let t=0,r=o.length;t<r;t++){let n=o[t];Array.isArray(n.material)?e.push(...n.material):e.push(n.material)}return e}function _a(o,e,t){if(o.length===0){e.setIndex(null);let r=e.attributes;for(let n in r)e.deleteAttribute(n);for(let n in t.attributes)e.setAttribute(t.attributes[n],new Wo(new Float32Array(0),4,!1))}else Po(o,t,e);for(let r in e.attributes)e.attributes[r].needsUpdate=!0}var Xt=class{constructor(e){this.objects=null,this.useGroups=!0,this.applyWorldTransforms=!0,this.generateMissingAttributes=!0,this.overwriteIndex=!0,this.attributes=["position","normal","color","tangent","uv","uv2"],this._intermediateGeometry=new Map,this._geometryMergeSets=new WeakMap,this._mergeOrder=[],this._dummyMesh=null,this.setObjects(e||[])}_getDummyMesh(){if(!this._dummyMesh){let e=new Ta,t=new Uo;t.setAttribute("position",new Wo(new Float32Array(9),3)),this._dummyMesh=new ba(t,e)}return this._dummyMesh}_getMeshes(){let e=[];return wa(this.objects,t=>{e.push(t)}),e.sort((t,r)=>t.uuid>r.uuid?1:t.uuid<r.uuid?-1:0),e.length===0&&e.push(this._getDummyMesh()),e}_updateIntermediateGeometries(){let{_intermediateGeometry:e}=this,t=this._getMeshes(),r=new Set(e.keys()),n={attributes:this.attributes,applyWorldTransforms:this.applyWorldTransforms};for(let s=0,i=t.length;s<i;s++){let c=t[s],l=c.uuid;r.delete(l);let m=e.get(l);(!m||!m.isCompatible(c,this.attributes))&&(m&&m.dispose(),m=new jt,e.set(l,m)),m.updateFrom(c,n)&&this.generateMissingAttributes&&Co(m,this.attributes)}r.forEach(s=>{e.delete(s)})}setObjects(e){Array.isArray(e)?this.objects=[...e]:this.objects=[e]}generate(e=new Uo){let{useGroups:t,overwriteIndex:r,_intermediateGeometry:n,_geometryMergeSets:s}=this,i=this._getMeshes(),c=[],l=[],m=s.get(e)||[];this._updateIntermediateGeometries();let f=!1;i.length!==m.length&&(f=!0);for(let a=0,d=i.length;a<d;a++){let g=i[a],T=n.get(g.uuid);l.push(T);let h=m[a];!h||h.uuid!==T.uuid?(c.push(!1),f=!0):h.version!==T.version?c.push(!1):c.push(!0)}_a(l,e,{useGroups:t,forceUpdate:f,skipAssigningAttributes:c,overwriteIndex:r}),f&&e.dispose(),s.set(e,l.map(a=>({version:a.version,uuid:a.uuid})));let u=Qt;return f?u=si:c.includes(!1)&&(u=ni),{changeType:u,materials:Sa(i),geometry:e}}};function Ia(o){let e=new Set;for(let t=0,r=o.length;t<r;t++){let n=o[t];for(let s in n){let i=n[s];i&&i.isTexture&&e.add(i)}}return Array.from(e)}function Ra(o){let e=[],t=new Set;for(let n=0,s=o.length;n<s;n++)o[n].traverse(i=>{i.visible&&(i.isRectAreaLight||i.isSpotLight||i.isPointLight||i.isDirectionalLight)&&(e.push(i),i.iesMap&&t.add(i.iesMap))});let r=Array.from(t).sort((n,s)=>n.uuid<s.uuid?1:n.uuid>s.uuid?-1:0);return{lights:e,iesTextures:r}}var Kt=class{get initialized(){return!!this.bvh}constructor(e){this.bvhOptions={},this.attributes=["position","normal","tangent","color","uv","uv2"],this.generateBVH=!0,this.bvh=null,this.geometry=new Aa,this.staticGeometryGenerator=new Xt(e),this._bvhWorker=null,this._pendingGenerate=null,this._buildAsync=!1,this._materialUuids=null}setObjects(e){this.staticGeometryGenerator.setObjects(e)}setBVHWorker(e){this._bvhWorker=e}async generateAsync(e=null){if(!this._bvhWorker)throw new Error('PathTracingSceneGenerator: "setBVHWorker" must be called before "generateAsync" can be called.');if(this.bvh instanceof Promise)return this._pendingGenerate||(this._pendingGenerate=new Promise(async()=>(await this.bvh,this._pendingGenerate=null,this.generateAsync(e)))),this._pendingGenerate;{this._buildAsync=!0;let t=this.generate(e);return this._buildAsync=!1,t.bvh=this.bvh=await t.bvh,t}}generate(e=null){let{staticGeometryGenerator:t,geometry:r,attributes:n}=this,s=t.objects;t.attributes=n,s.forEach(a=>{a.traverse(d=>{d.isSkinnedMesh&&d.skeleton&&d.skeleton.update()})});let i=t.generate(r),c=i.materials,l=i.changeType!==Qt||this._materialUuids===null||this._materialUuids.length!==length;if(!l){for(let a=0,d=c.length;a<d;a++)if(c[a].uuid!==this._materialUuids[a]){l=!0;break}}let m=Ia(c),{lights:f,iesTextures:u}=Ra(s);if(l&&(Fo(r,c,c),this._materialUuids=c.map(a=>a.uuid)),this.generateBVH){if(this.bvh instanceof Promise)throw new Error("PathTracingSceneGenerator: BVH is already building asynchronously.");if(i.changeType===si){let a={strategy:2,maxLeafTris:1,indirect:!0,onProgress:e,...this.bvhOptions};this._buildAsync?this.bvh=this._bvhWorker.generate(r,a):this.bvh=new ye(r,a)}else i.changeType===ni&&this.bvh.refit()}return{bvhChanged:i.changeType!==Qt,bvh:this.bvh,needsMaterialIndexUpdate:l,lights:f,iesTextures:u,geometry:r,materials:c,textures:m,objects:s}}};import{RGBAFormat as vi,FloatType as xi,Color as Nc,Vector2 as kc,WebGLRenderTarget as yi,NoBlending as zc,NormalBlending as Oc,Vector4 as bi,NearestFilter as je}from"three";import{BufferGeometry as Ma,Float32BufferAttribute as Vo,OrthographicCamera as Pa,Mesh as Fa}from"three";var Ca=new Pa(-1,1,1,-1,0,1),ai=class extends Ma{constructor(){super(),this.setAttribute("position",new Vo([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new Vo([0,2,0,0,2,0],2))}},Da=new ai,j=class{constructor(e){this._mesh=new Fa(Da,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,Ca)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}};import{NoBlending as Ea}from"three";import{ShaderMaterial as Ba}from"three";var me=class extends Ba{set needsUpdate(e){super.needsUpdate=!0,this.dispatchEvent({type:"recompilation"})}constructor(e){super(e);for(let t in this.uniforms)Object.defineProperty(this,t,{get(){return this.uniforms[t].value},set(r){this.uniforms[t].value=r}})}setDefine(e,t=void 0){if(t==null){if(e in this.defines)return delete this.defines[e],this.needsUpdate=!0,!0}else if(this.defines[e]!==t)return this.defines[e]=t,this.needsUpdate=!0,!0;return!1}};var Zt=class extends me{constructor(e){super({blending:Ea,uniforms:{target1:{value:null},target2:{value:null},opacity:{value:1}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				uniform float opacity;

				uniform sampler2D target1;
				uniform sampler2D target2;

				varying vec2 vUv;

				void main() {

					vec4 color1 = texture2D( target1, vUv );
					vec4 color2 = texture2D( target2, vUv );

					float invOpacity = 1.0 - opacity;
					float totalAlpha = color1.a * invOpacity + color2.a * opacity;

					if ( color1.a != 0.0 || color2.a != 0.0 ) {

						gl_FragColor.rgb = color1.rgb * ( invOpacity * color1.a / totalAlpha ) + color2.rgb * ( opacity * color2.a / totalAlpha );
						gl_FragColor.a = totalAlpha;

					} else {

						gl_FragColor = vec4( 0.0 );

					}

				}`}),this.setValues(e)}};import{FloatType as La,NearestFilter as $o,NoBlending as Na,RGBAFormat as ka,Vector2 as za,WebGLRenderTarget as Oa}from"three";function Jt(o=1){let e="uint";return o>1&&(e="uvec"+o),`
		${e} sobolReverseBits( ${e} x ) {

			x = ( ( ( x & 0xaaaaaaaau ) >> 1 ) | ( ( x & 0x55555555u ) << 1 ) );
			x = ( ( ( x & 0xccccccccu ) >> 2 ) | ( ( x & 0x33333333u ) << 2 ) );
			x = ( ( ( x & 0xf0f0f0f0u ) >> 4 ) | ( ( x & 0x0f0f0f0fu ) << 4 ) );
			x = ( ( ( x & 0xff00ff00u ) >> 8 ) | ( ( x & 0x00ff00ffu ) << 8 ) );
			return ( ( x >> 16 ) | ( x << 16 ) );

		}

		${e} sobolHashCombine( uint seed, ${e} v ) {

			return seed ^ ( v + ${e}( ( seed << 6 ) + ( seed >> 2 ) ) );

		}

		${e} sobolLaineKarrasPermutation( ${e} x, ${e} seed ) {

			x += seed;
			x ^= x * 0x6c50b47cu;
			x ^= x * 0xb82f1e52u;
			x ^= x * 0xc7afe638u;
			x ^= x * 0x8d22f6e6u;
			return x;

		}

		${e} nestedUniformScrambleBase2( ${e} x, ${e} seed ) {

			x = sobolLaineKarrasPermutation( x, seed );
			x = sobolReverseBits( x );
			return x;

		}
	`}function er(o=1){let e="uint",t="float",r="",n=".r",s="1u";return o>1&&(e="uvec"+o,t="vec"+o,r=o+"",o===2?(n=".rg",s="uvec2( 1u, 2u )"):o===3?(n=".rgb",s="uvec3( 1u, 2u, 3u )"):(n="",s="uvec4( 1u, 2u, 3u, 4u )")),`

		${t} sobol${r}( int effect ) {

			uint seed = sobolGetSeed( sobolBounceIndex, uint( effect ) );
			uint index = sobolPathIndex;

			uint shuffle_seed = sobolHashCombine( seed, 0u );
			uint shuffled_index = nestedUniformScrambleBase2( sobolReverseBits( index ), shuffle_seed );
			${t} sobol_pt = sobolGetTexturePoint( shuffled_index )${n};
			${e} result = ${e}( sobol_pt * 16777216.0 );

			${e} seed2 = sobolHashCombine( seed, ${s} );
			result = nestedUniformScrambleBase2( result, seed2 );

			return SOBOL_FACTOR * ${t}( result >> 8 );

		}
	`}var tr=`

	// Utils
	const float SOBOL_FACTOR = 1.0 / 16777216.0;
	const uint SOBOL_MAX_POINTS = 256u * 256u;

	${Jt(1)}
	${Jt(2)}
	${Jt(3)}
	${Jt(4)}

	uint sobolHash( uint x ) {

		// finalizer from murmurhash3
		x ^= x >> 16;
		x *= 0x85ebca6bu;
		x ^= x >> 13;
		x *= 0xc2b2ae35u;
		x ^= x >> 16;
		return x;

	}

`,Go=`

	const uint SOBOL_DIRECTIONS_1[ 32 ] = uint[ 32 ](
		0x80000000u, 0xc0000000u, 0xa0000000u, 0xf0000000u,
		0x88000000u, 0xcc000000u, 0xaa000000u, 0xff000000u,
		0x80800000u, 0xc0c00000u, 0xa0a00000u, 0xf0f00000u,
		0x88880000u, 0xcccc0000u, 0xaaaa0000u, 0xffff0000u,
		0x80008000u, 0xc000c000u, 0xa000a000u, 0xf000f000u,
		0x88008800u, 0xcc00cc00u, 0xaa00aa00u, 0xff00ff00u,
		0x80808080u, 0xc0c0c0c0u, 0xa0a0a0a0u, 0xf0f0f0f0u,
		0x88888888u, 0xccccccccu, 0xaaaaaaaau, 0xffffffffu
	);

	const uint SOBOL_DIRECTIONS_2[ 32 ] = uint[ 32 ](
		0x80000000u, 0xc0000000u, 0x60000000u, 0x90000000u,
		0xe8000000u, 0x5c000000u, 0x8e000000u, 0xc5000000u,
		0x68800000u, 0x9cc00000u, 0xee600000u, 0x55900000u,
		0x80680000u, 0xc09c0000u, 0x60ee0000u, 0x90550000u,
		0xe8808000u, 0x5cc0c000u, 0x8e606000u, 0xc5909000u,
		0x6868e800u, 0x9c9c5c00u, 0xeeee8e00u, 0x5555c500u,
		0x8000e880u, 0xc0005cc0u, 0x60008e60u, 0x9000c590u,
		0xe8006868u, 0x5c009c9cu, 0x8e00eeeeu, 0xc5005555u
	);

	const uint SOBOL_DIRECTIONS_3[ 32 ] = uint[ 32 ](
		0x80000000u, 0xc0000000u, 0x20000000u, 0x50000000u,
		0xf8000000u, 0x74000000u, 0xa2000000u, 0x93000000u,
		0xd8800000u, 0x25400000u, 0x59e00000u, 0xe6d00000u,
		0x78080000u, 0xb40c0000u, 0x82020000u, 0xc3050000u,
		0x208f8000u, 0x51474000u, 0xfbea2000u, 0x75d93000u,
		0xa0858800u, 0x914e5400u, 0xdbe79e00u, 0x25db6d00u,
		0x58800080u, 0xe54000c0u, 0x79e00020u, 0xb6d00050u,
		0x800800f8u, 0xc00c0074u, 0x200200a2u, 0x50050093u
	);

	const uint SOBOL_DIRECTIONS_4[ 32 ] = uint[ 32 ](
		0x80000000u, 0x40000000u, 0x20000000u, 0xb0000000u,
		0xf8000000u, 0xdc000000u, 0x7a000000u, 0x9d000000u,
		0x5a800000u, 0x2fc00000u, 0xa1600000u, 0xf0b00000u,
		0xda880000u, 0x6fc40000u, 0x81620000u, 0x40bb0000u,
		0x22878000u, 0xb3c9c000u, 0xfb65a000u, 0xddb2d000u,
		0x78022800u, 0x9c0b3c00u, 0x5a0fb600u, 0x2d0ddb00u,
		0xa2878080u, 0xf3c9c040u, 0xdb65a020u, 0x6db2d0b0u,
		0x800228f8u, 0x400b3cdcu, 0x200fb67au, 0xb00ddb9du
	);

	uint getMaskedSobol( uint index, uint directions[ 32 ] ) {

		uint X = 0u;
		for ( int bit = 0; bit < 32; bit ++ ) {

			uint mask = ( index >> bit ) & 1u;
			X ^= mask * directions[ bit ];

		}
		return X;

	}

	vec4 generateSobolPoint( uint index ) {

		if ( index >= SOBOL_MAX_POINTS ) {

			return vec4( 0.0 );

		}

		// NOTE: this sobol "direction" is also available but we can't write out 5 components
		// uint x = index & 0x00ffffffu;
		uint x = sobolReverseBits( getMaskedSobol( index, SOBOL_DIRECTIONS_1 ) ) & 0x00ffffffu;
		uint y = sobolReverseBits( getMaskedSobol( index, SOBOL_DIRECTIONS_2 ) ) & 0x00ffffffu;
		uint z = sobolReverseBits( getMaskedSobol( index, SOBOL_DIRECTIONS_3 ) ) & 0x00ffffffu;
		uint w = sobolReverseBits( getMaskedSobol( index, SOBOL_DIRECTIONS_4 ) ) & 0x00ffffffu;

		return vec4( x, y, z, w ) * SOBOL_FACTOR;

	}

`,qo=`

	// Seeds
	uniform sampler2D sobolTexture;
	uint sobolPixelIndex = 0u;
	uint sobolPathIndex = 0u;
	uint sobolBounceIndex = 0u;

	uint sobolGetSeed( uint bounce, uint effect ) {

		return sobolHash(
			sobolHashCombine(
				sobolHashCombine(
					sobolHash( bounce ),
					sobolPixelIndex
				),
				effect
			)
		);

	}

	vec4 sobolGetTexturePoint( uint index ) {

		if ( index >= SOBOL_MAX_POINTS ) {

			index = index % SOBOL_MAX_POINTS;

		}

		uvec2 dim = uvec2( textureSize( sobolTexture, 0 ).xy );
		uint y = index / dim.x;
		uint x = index - y * dim.x;
		vec2 uv = vec2( x, y ) / vec2( dim );
		return texture( sobolTexture, uv );

	}

	${er(1)}
	${er(2)}
	${er(3)}
	${er(4)}

`;var ci=class extends me{constructor(){super({blending:Na,uniforms:{resolution:{value:new za}},vertexShader:`

				varying vec2 vUv;
				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}
			`,fragmentShader:`

				${tr}
				${Go}

				varying vec2 vUv;
				uniform vec2 resolution;
				void main() {

					uint index = uint( gl_FragCoord.y ) * uint( resolution.x ) + uint( gl_FragCoord.x );
					gl_FragColor = generateSobolPoint( index );

				}
			`})}},rr=class{generate(e,t=256){let r=new Oa(t,t,{type:La,format:ka,minFilter:$o,magFilter:$o,generateMipmaps:!1}),n=e.getRenderTarget();e.setRenderTarget(r);let s=new j(new ci);return s.material.resolution.set(t,t),s.render(e),e.setRenderTarget(n),s.dispose(),r}};import{ClampToEdgeWrapping as Hn,HalfFloatType as Ec,Matrix4 as yr,Vector2 as Lc}from"three";import{PerspectiveCamera as Ha}from"three";var ir=class extends Ha{set bokehSize(e){this.fStop=this.getFocalLength()/e}get bokehSize(){return this.getFocalLength()/this.fStop}constructor(...e){super(...e),this.fStop=1.4,this.apertureBlades=0,this.apertureRotation=0,this.focusDistance=25,this.anamorphicRatio=1}copy(e,t){return super.copy(e,t),this.fStop=e.fStop,this.apertureBlades=e.apertureBlades,this.apertureRotation=e.apertureRotation,this.focusDistance=e.focusDistance,this.anamorphicRatio=e.anamorphicRatio,this}};var or=class{constructor(){this.bokehSize=0,this.apertureBlades=0,this.apertureRotation=0,this.focusDistance=10,this.anamorphicRatio=1}updateFrom(e){e instanceof ir?(this.bokehSize=e.bokehSize,this.apertureBlades=e.apertureBlades,this.apertureRotation=e.apertureRotation,this.focusDistance=e.focusDistance,this.anamorphicRatio=e.anamorphicRatio):(this.bokehSize=0,this.apertureRotation=0,this.apertureBlades=0,this.focusDistance=10,this.anamorphicRatio=1)}};import{DataTexture as li,RedFormat as Yo,LinearFilter as qe,DataUtils as Ae,HalfFloatType as he,Source as Wa,RepeatWrapping as ui,RGBAFormat as Va,FloatType as Ga,ClampToEdgeWrapping as qa}from"three";import{DataUtils as Ua}from"three";function nr(o){let e=new Uint16Array(o.length);for(let t=0,r=o.length;t<r;++t)e[t]=Ua.toHalfFloat(o[t]);return e}function jo(o,e,t=0,r=o.length){let n=t,s=t+r-1;for(;n<s;){let i=n+s>>1;o[i]<e?n=i+1:s=i}return n-t}function $a(o,e,t){return .2126*o+.7152*e+.0722*t}function Ya(o,e=he){let t=o.clone();t.source=new Wa({...t.image});let{width:r,height:n,data:s}=t.image,i=s;if(t.type!==e){e===he?i=new Uint16Array(s.length):i=new Float32Array(s.length);let c;s instanceof Int8Array||s instanceof Int16Array||s instanceof Int32Array?c=2**(8*s.BYTES_PER_ELEMENT-1)-1:c=2**(8*s.BYTES_PER_ELEMENT)-1;for(let l=0,m=s.length;l<m;l++){let f=s[l];t.type===he&&(f=Ae.fromHalfFloat(s[l])),t.type!==Ga&&t.type!==he&&(f/=c),e===he&&(i[l]=Ae.toHalfFloat(f))}t.image.data=i,t.type=e}if(t.flipY){let c=i;i=i.slice();for(let l=0;l<n;l++)for(let m=0;m<r;m++){let f=n-l-1,u=4*(l*r+m),a=4*(f*r+m);i[a+0]=c[u+0],i[a+1]=c[u+1],i[a+2]=c[u+2],i[a+3]=c[u+3]}t.flipY=!1,t.image.data=i}return t}var sr=class{constructor(){let e=new li(nr(new Float32Array([0,0,0,0])),1,1);e.type=he,e.format=Va,e.minFilter=qe,e.magFilter=qe,e.wrapS=ui,e.wrapT=ui,e.generateMipmaps=!1,e.needsUpdate=!0;let t=new li(nr(new Float32Array([0,1])),1,2);t.type=he,t.format=Yo,t.minFilter=qe,t.magFilter=qe,t.generateMipmaps=!1,t.needsUpdate=!0;let r=new li(nr(new Float32Array([0,0,1,1])),2,2);r.type=he,r.format=Yo,r.minFilter=qe,r.magFilter=qe,r.generateMipmaps=!1,r.needsUpdate=!0,this.map=e,this.marginalWeights=t,this.conditionalWeights=r,this.totalSum=0}dispose(){this.marginalWeights.dispose(),this.conditionalWeights.dispose(),this.map.dispose()}updateFrom(e){let t=Ya(e);t.wrapS=ui,t.wrapT=qa;let{width:r,height:n,data:s}=t.image,i=new Float32Array(r*n),c=new Float32Array(r*n),l=new Float32Array(n),m=new Float32Array(n),f=0,u=0;for(let h=0;h<n;h++){let y=0;for(let v=0;v<r;v++){let p=h*r+v,b=Ae.fromHalfFloat(s[4*p+0]),x=Ae.fromHalfFloat(s[4*p+1]),w=Ae.fromHalfFloat(s[4*p+2]),S=$a(b,x,w);y+=S,f+=S,i[p]=S,c[p]=y}if(y!==0)for(let v=h*r,p=h*r+r;v<p;v++)i[v]/=y,c[v]/=y;u+=y,l[h]=y,m[h]=u}if(u!==0)for(let h=0,y=l.length;h<y;h++)l[h]/=u,m[h]/=u;let a=new Uint16Array(n),d=new Uint16Array(r*n);for(let h=0;h<n;h++){let y=(h+1)/n,v=jo(m,y);a[h]=Ae.toHalfFloat((v+.5)/n)}for(let h=0;h<n;h++)for(let y=0;y<r;y++){let v=h*r+y,p=(y+1)/r,b=jo(c,p,h*r,r);d[v]=Ae.toHalfFloat((b+.5)/r)}this.dispose();let{marginalWeights:g,conditionalWeights:T}=this;g.image={width:n,height:1,data:a},g.needsUpdate=!0,T.image={width:r,height:n,data:d},T.needsUpdate=!0,this.totalSum=f,this.map=t}};import{DataTexture as ja,RGBAFormat as Xa,ClampToEdgeWrapping as Xo,FloatType as Qa,Vector3 as ft,Quaternion as Ka,Matrix4 as Za,NearestFilter as Qo}from"three";var fi=6,Ja=0,ec=1,tc=2,rc=3,ic=4,te=new ft,Y=new ft,Ko=new Za,$e=new Ka,Zo=new ft,Ye=new ft,oc=new ft(0,1,0),ar=class{constructor(){let e=new ja(new Float32Array(4),1,1);e.format=Xa,e.type=Qa,e.wrapS=Xo,e.wrapT=Xo,e.generateMipmaps=!1,e.minFilter=Qo,e.magFilter=Qo,this.tex=e,this.count=0}updateFrom(e,t=[]){let r=this.tex,n=Math.max(e.length*fi,1),s=Math.ceil(Math.sqrt(n));r.image.width!==s&&(r.dispose(),r.image.data=new Float32Array(s*s*4),r.image.width=s,r.image.height=s);let i=r.image.data;for(let l=0,m=e.length;l<m;l++){let f=e[l],u=l*fi*4,a=0;for(let g=0;g<fi*4;g++)i[u+g]=0;f.getWorldPosition(Y),i[u+a++]=Y.x,i[u+a++]=Y.y,i[u+a++]=Y.z;let d=Ja;if(f.isRectAreaLight&&f.isCircular?d=ec:f.isSpotLight?d=tc:f.isDirectionalLight?d=rc:f.isPointLight&&(d=ic),i[u+a++]=d,i[u+a++]=f.color.r,i[u+a++]=f.color.g,i[u+a++]=f.color.b,i[u+a++]=f.intensity,f.getWorldQuaternion($e),f.isRectAreaLight)te.set(f.width,0,0).applyQuaternion($e),i[u+a++]=te.x,i[u+a++]=te.y,i[u+a++]=te.z,a++,Y.set(0,f.height,0).applyQuaternion($e),i[u+a++]=Y.x,i[u+a++]=Y.y,i[u+a++]=Y.z,i[u+a++]=te.cross(Y).length()*(f.isCircular?Math.PI/4:1);else if(f.isSpotLight){let g=f.radius||0;Zo.setFromMatrixPosition(f.matrixWorld),Ye.setFromMatrixPosition(f.target.matrixWorld),Ko.lookAt(Zo,Ye,oc),$e.setFromRotationMatrix(Ko),te.set(1,0,0).applyQuaternion($e),i[u+a++]=te.x,i[u+a++]=te.y,i[u+a++]=te.z,a++,Y.set(0,1,0).applyQuaternion($e),i[u+a++]=Y.x,i[u+a++]=Y.y,i[u+a++]=Y.z,i[u+a++]=Math.PI*g*g,i[u+a++]=g,i[u+a++]=f.decay,i[u+a++]=f.distance,i[u+a++]=Math.cos(f.angle),i[u+a++]=Math.cos(f.angle*(1-f.penumbra)),i[u+a++]=f.iesMap?t.indexOf(f.iesMap):-1}else if(f.isPointLight){let g=te.setFromMatrixPosition(f.matrixWorld);i[u+a++]=g.x,i[u+a++]=g.y,i[u+a++]=g.z,a++,a+=4,a+=1,i[u+a++]=f.decay,i[u+a++]=f.distance}else if(f.isDirectionalLight){let g=te.setFromMatrixPosition(f.matrixWorld),T=Y.setFromMatrixPosition(f.target.matrixWorld);Ye.subVectors(g,T).normalize(),i[u+a++]=Ye.x,i[u+a++]=Ye.y,i[u+a++]=Ye.z}}this.count=e.length;let c=Ge(i.buffer);return this.hash!==c?(this.hash=c,r.needsUpdate=!0,!0):!1}};import{DataArrayTexture as nc,FloatType as sc,RGBAFormat as ac}from"three";function Jo(o,e,t,r,n){if(e>r)throw new Error;let s=o.length/e,i=o.constructor.BYTES_PER_ELEMENT*8,c=1;switch(o.constructor){case Uint8Array:case Uint16Array:case Uint32Array:c=2**i-1;break;case Int8Array:case Int16Array:case Int32Array:c=2**(i-1)-1;break}for(let l=0;l<s;l++){let m=4*l,f=e*l;for(let u=0;u<r;u++)t[n+m+u]=e>=u+1?o[f+u]/c:0}}var cr=class extends nc{constructor(){super(),this._textures=[],this.type=sc,this.format=ac,this.internalFormat="RGBA32F"}updateAttribute(e,t){let r=this._textures[e];r.updateFrom(t);let n=r.image,s=this.image;if(n.width!==s.width||n.height!==s.height)throw new Error("FloatAttributeTextureArray: Attribute must be the same dimensions when updating single layer.");let{width:i,height:c,data:l}=s,f=i*c*4*e,u=t.itemSize;u===3&&(u=4),Jo(r.image.data,u,l,4,f),this.dispose(),this.needsUpdate=!0}setAttributes(e){let t=e[0].count,r=e.length;for(let u=0,a=r;u<a;u++)if(e[u].count!==t)throw new Error("FloatAttributeTextureArray: All attributes must have the same item count.");let n=this._textures;for(;n.length<r;){let u=new Ve;n.push(u)}for(;n.length>r;)n.pop();for(let u=0,a=r;u<a;u++)n[u].updateFrom(e[u]);let i=n[0].image,c=this.image;(i.width!==c.width||i.height!==c.height||i.depth!==r)&&(c.width=i.width,c.height=i.height,c.depth=r,c.data=new Float32Array(c.width*c.height*c.depth*4));let{data:l,width:m,height:f}=c;for(let u=0,a=r;u<a;u++){let d=n[u],T=m*f*4*u,h=e[u].itemSize;h===3&&(h=4),Jo(d.image.data,h,l,4,T)}this.dispose(),this.needsUpdate=!0}};var lr=class extends cr{updateNormalAttribute(e){this.updateAttribute(0,e)}updateTangentAttribute(e){this.updateAttribute(1,e)}updateUvAttribute(e){this.updateAttribute(2,e)}updateColorAttribute(e){this.updateAttribute(3,e)}updateFrom(e,t,r,n){this.setAttributes([e,t,r,n])}};import{DataTexture as lc,RGBAFormat as uc,ClampToEdgeWrapping as on,FloatType as fc,FrontSide as mc,BackSide as hc,DoubleSide as dc,NearestFilter as nn}from"three";function mi(o,e){return o.uuid<e.uuid?1:o.uuid>e.uuid?-1:0}function ur(o){return`${o.source.uuid}:${o.colorSpace}`}function cc(o){let e=new Set,t=[];for(let r=0,n=o.length;r<n;r++){let s=o[r],i=ur(s);e.has(i)||(e.add(i),t.push(s))}return t}function en(o){let e=o.map(r=>r.iesMap||null).filter(r=>r),t=new Set(e);return Array.from(t).sort(mi)}function tn(o){let e=new Set;for(let r=0,n=o.length;r<n;r++){let s=o[r];for(let i in s){let c=s[i];c&&c.isTexture&&e.add(c)}}let t=Array.from(e);return cc(t).sort(mi)}function rn(o){let e=[];return o.traverse(t=>{t.visible&&(t.isRectAreaLight||t.isSpotLight||t.isPointLight||t.isDirectionalLight)&&e.push(t)}),e.sort(mi)}var mr=47,sn=mr*4,hi=class{constructor(){this._features={}}isUsed(e){return e in this._features}setUsed(e,t=!0){t===!1?delete this._features[e]:this._features[e]=!0}reset(){this._features={}}},fr=class extends lc{constructor(){super(new Float32Array(4),1,1),this.format=uc,this.type=fc,this.wrapS=on,this.wrapT=on,this.minFilter=nn,this.magFilter=nn,this.generateMipmaps=!1,this.features=new hi}updateFrom(e,t){function r(g,T,h=-1){if(T in g&&g[T]){let y=ur(g[T]);return u[y]}else return h}function n(g,T,h){return T in g?g[T]:h}function s(g,T,h,y){let v=g[T]&&g[T].isTexture?g[T]:null;if(v){v.matrixAutoUpdate&&v.updateMatrix();let p=v.matrix.elements,b=0;h[y+b++]=p[0],h[y+b++]=p[3],h[y+b++]=p[6],b++,h[y+b++]=p[1],h[y+b++]=p[4],h[y+b++]=p[7],b++}return 8}let i=0,c=e.length*mr,l=Math.ceil(Math.sqrt(c))||1,{image:m,features:f}=this,u={};for(let g=0,T=t.length;g<T;g++)u[ur(t[g])]=g;m.width!==l&&(this.dispose(),m.data=new Float32Array(l*l*4),m.width=l,m.height=l);let a=m.data;f.reset();for(let g=0,T=e.length;g<T;g++){let h=e[g];if(h.isFogVolumeMaterial){f.setUsed("FOG");for(let p=0;p<sn;p++)a[i+p]=0;a[i+0+0]=h.color.r,a[i+0+1]=h.color.g,a[i+0+2]=h.color.b,a[i+8+3]=n(h,"emissiveIntensity",0),a[i+12+0]=h.emissive.r,a[i+12+1]=h.emissive.g,a[i+12+2]=h.emissive.b,a[i+52+1]=h.density,a[i+52+3]=0,a[i+56+2]=4,i+=sn;continue}a[i++]=h.color.r,a[i++]=h.color.g,a[i++]=h.color.b,a[i++]=r(h,"map"),a[i++]=n(h,"metalness",0),a[i++]=r(h,"metalnessMap"),a[i++]=n(h,"roughness",0),a[i++]=r(h,"roughnessMap"),a[i++]=n(h,"ior",1.5),a[i++]=n(h,"transmission",0),a[i++]=r(h,"transmissionMap"),a[i++]=n(h,"emissiveIntensity",0),"emissive"in h?(a[i++]=h.emissive.r,a[i++]=h.emissive.g,a[i++]=h.emissive.b):(a[i++]=0,a[i++]=0,a[i++]=0),a[i++]=r(h,"emissiveMap"),a[i++]=r(h,"normalMap"),"normalScale"in h?(a[i++]=h.normalScale.x,a[i++]=h.normalScale.y):(a[i++]=1,a[i++]=1),a[i++]=n(h,"clearcoat",0),a[i++]=r(h,"clearcoatMap"),a[i++]=n(h,"clearcoatRoughness",0),a[i++]=r(h,"clearcoatRoughnessMap"),a[i++]=r(h,"clearcoatNormalMap"),"clearcoatNormalScale"in h?(a[i++]=h.clearcoatNormalScale.x,a[i++]=h.clearcoatNormalScale.y):(a[i++]=1,a[i++]=1),i++,a[i++]=n(h,"sheen",0),"sheenColor"in h?(a[i++]=h.sheenColor.r,a[i++]=h.sheenColor.g,a[i++]=h.sheenColor.b):(a[i++]=0,a[i++]=0,a[i++]=0),a[i++]=r(h,"sheenColorMap"),a[i++]=n(h,"sheenRoughness",0),a[i++]=r(h,"sheenRoughnessMap"),a[i++]=r(h,"iridescenceMap"),a[i++]=r(h,"iridescenceThicknessMap"),a[i++]=n(h,"iridescence",0),a[i++]=n(h,"iridescenceIOR",1.3);let y=n(h,"iridescenceThicknessRange",[100,400]);a[i++]=y[0],a[i++]=y[1],"specularColor"in h?(a[i++]=h.specularColor.r,a[i++]=h.specularColor.g,a[i++]=h.specularColor.b):(a[i++]=1,a[i++]=1,a[i++]=1),a[i++]=r(h,"specularColorMap"),a[i++]=n(h,"specularIntensity",1),a[i++]=r(h,"specularIntensityMap");let v=n(h,"thickness",0)===0&&n(h,"attenuationDistance",1/0)===1/0;if(a[i++]=Number(v),i++,"attenuationColor"in h?(a[i++]=h.attenuationColor.r,a[i++]=h.attenuationColor.g,a[i++]=h.attenuationColor.b):(a[i++]=1,a[i++]=1,a[i++]=1),a[i++]=n(h,"attenuationDistance",1/0),a[i++]=r(h,"alphaMap"),a[i++]=h.opacity,a[i++]=h.alphaTest,!v&&h.transmission>0)a[i++]=0;else switch(h.side){case mc:a[i++]=1;break;case hc:a[i++]=-1;break;case dc:a[i++]=0;break}a[i++]=Number(n(h,"matte",!1)),a[i++]=Number(n(h,"castShadow",!0)),a[i++]=Number(h.vertexColors)|Number(h.flatShading)<<1,a[i++]=Number(h.transparent),i+=s(h,"map",a,i),i+=s(h,"metalnessMap",a,i),i+=s(h,"roughnessMap",a,i),i+=s(h,"transmissionMap",a,i),i+=s(h,"emissiveMap",a,i),i+=s(h,"normalMap",a,i),i+=s(h,"clearcoatMap",a,i),i+=s(h,"clearcoatNormalMap",a,i),i+=s(h,"clearcoatRoughnessMap",a,i),i+=s(h,"sheenColorMap",a,i),i+=s(h,"sheenRoughnessMap",a,i),i+=s(h,"iridescenceMap",a,i),i+=s(h,"iridescenceThicknessMap",a,i),i+=s(h,"specularColorMap",a,i),i+=s(h,"specularIntensityMap",a,i),i+=s(h,"alphaMap",a,i)}let d=Ge(a.buffer);return this.hash!==d?(this.hash=d,this.needsUpdate=!0,!0):!1}};import{WebGLArrayRenderTarget as pc,RGBAFormat as gc,UnsignedByteType as vc,Color as xc,RepeatWrapping as an,LinearFilter as cn,NoToneMapping as yc,ShaderMaterial as bc}from"three";var ln=new xc;function Tc(o){return o?`${o.uuid}:${o.version}`:null}function wc(o,e){for(let t in e)t in o&&(o[t]=e[t])}var mt=class extends pc{constructor(e,t,r){let n={format:gc,type:vc,minFilter:cn,magFilter:cn,wrapS:an,wrapT:an,generateMipmaps:!1,...r};super(e,t,1,n),wc(this.texture,n),this.texture.setTextures=(...i)=>{this.setTextures(...i)},this.hashes=[null];let s=new j(new di);this.fsQuad=s}setTextures(e,t,r=this.width,n=this.height){let s=e.getRenderTarget(),i=e.toneMapping,c=e.getClearAlpha();e.getClearColor(ln);let l=t.length||1;(r!==this.width||n!==this.height||this.depth!==l)&&(this.setSize(r,n,l),this.hashes=new Array(l).fill(null)),e.setClearColor(0,0),e.toneMapping=yc;let m=this.fsQuad,f=this.hashes,u=!1;for(let a=0,d=l;a<d;a++){let g=t[a],T=Tc(g);g&&(f[a]!==T||g.isWebGLRenderTarget)&&(g.matrixAutoUpdate=!1,g.matrix.identity(),m.material.map=g,e.setRenderTarget(this,a),m.render(e),g.updateMatrix(),g.matrixAutoUpdate=!0,f[a]=T,u=!0)}return m.material.map=null,e.setClearColor(ln,c),e.setRenderTarget(s),e.toneMapping=i,u}dispose(){super.dispose(),this.fsQuad.dispose()}},di=class extends bc{get map(){return this.uniforms.map.value}set map(e){this.uniforms.map.value=e}constructor(){super({uniforms:{map:{value:null}},vertexShader:`
				varying vec2 vUv;
				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}
			`,fragmentShader:`
				uniform sampler2D map;
				varying vec2 vUv;
				void main() {

					gl_FragColor = texture2D( map, vUv );

				}
			`})}};import{DataTexture as _c,FloatType as Ac,NearestFilter as un,RGBAFormat as Ic}from"three";function Sc(o,e=Math.random()){for(let t=o.length-1;t>0;t--){let r=Math.floor(e()*(t+1)),n=o[t];o[t]=o[r],o[r]=n}return o}var hr=class{constructor(e,t,r=Math.random){let n=e**t,s=new Uint16Array(n),i=n;for(let c=0;c<n;c++)s[c]=c;this.samples=new Float32Array(t),this.strataCount=e,this.reset=function(){for(let c=0;c<n;c++)s[c]=c;i=0},this.reshuffle=function(){i=0},this.next=function(){let{samples:c}=this;i>=s.length&&(Sc(s,r),this.reshuffle());let l=s[i++];for(let m=0;m<t;m++)c[m]=(l%e+r())/e,l=Math.floor(l/e);return c}}};var dr=class{constructor(e,t,r=Math.random){let n=0;for(let l of t)n+=l;let s=new Float32Array(n),i=[],c=0;for(let l of t){let m=new hr(e,l,r);m.samples=new Float32Array(s.buffer,c,m.samples.length),c+=m.samples.length*4,i.push(m)}this.samples=s,this.strataCount=e,this.next=function(){for(let l of i)l.next();return s},this.reshuffle=function(){for(let l of i)l.reshuffle()},this.reset=function(){for(let l of i)l.reset()}}};var pi=class{constructor(e=0){this.m=2147483648,this.a=1103515245,this.c=12345,this.seed=e}nextInt(){return this.seed=(this.a*this.seed+this.c)%this.m,this.seed}nextFloat(){return this.nextInt()/(this.m-1)}},pr=class extends _c{constructor(e=1,t=1,r=8){super(new Float32Array(1),1,1,Ic,Ac),this.minFilter=un,this.magFilter=un,this.strata=r,this.sampler=null,this.generator=new pi,this.stableNoise=!1,this.random=()=>this.stableNoise?this.generator.nextFloat():Math.random(),this.init(e,t,r)}init(e=this.image.height,t=this.image.width,r=this.strata){let{image:n}=this;if(n.width===t&&n.height===e&&this.sampler!==null)return;let s=new Array(e*t).fill(4),i=new dr(r,s,this.random);n.width=t,n.height=e,n.data=i.samples,this.sampler=i,this.dispose(),this.next()}next(){this.sampler.next(),this.needsUpdate=!0}reset(){this.sampler.reset(),this.generator.seed=0}};import{DataTexture as Rc,FloatType as Mc,NearestFilter as hn,RGBAFormat as dn,RGFormat as Pc,RedFormat as Fc}from"three";function fn(o,e=Math.random){for(let t=o.length-1;t>0;t--){let r=~~((e()-1e-6)*t),n=o[t];o[t]=o[r],o[r]=n}}function mn(o,e){o.fill(0);for(let t=0;t<e;t++)o[t]=1}var ht=class{constructor(e){this.count=0,this.size=-1,this.sigma=-1,this.radius=-1,this.lookupTable=null,this.score=null,this.binaryPattern=null,this.resize(e),this.setSigma(1.5)}findVoid(){let{score:e,binaryPattern:t}=this,r=1/0,n=-1;for(let s=0,i=t.length;s<i;s++){if(t[s]!==0)continue;let c=e[s];c<r&&(r=c,n=s)}return n}findCluster(){let{score:e,binaryPattern:t}=this,r=-1/0,n=-1;for(let s=0,i=t.length;s<i;s++){if(t[s]!==1)continue;let c=e[s];c>r&&(r=c,n=s)}return n}setSigma(e){if(e===this.sigma)return;let t=~~(Math.sqrt(20*e**2)+1),r=2*t+1,n=new Float32Array(r*r),s=e*e;for(let i=-t;i<=t;i++)for(let c=-t;c<=t;c++){let l=(t+c)*r+i+t,m=i*i+c*c;n[l]=Math.E**(-m/(2*s))}this.lookupTable=n,this.sigma=e,this.radius=t}resize(e){this.size!==e&&(this.size=e,this.score=new Float32Array(e*e),this.binaryPattern=new Uint8Array(e*e))}invert(){let{binaryPattern:e,score:t,size:r}=this;t.fill(0);for(let n=0,s=e.length;n<s;n++)if(e[n]===0){let i=~~(n/r),c=n-i*r;this.updateScore(c,i,1),e[n]=1}else e[n]=0}updateScore(e,t,r){let{size:n,score:s,lookupTable:i}=this,c=this.radius,l=2*c+1;for(let m=-c;m<=c;m++)for(let f=-c;f<=c;f++){let u=(c+f)*l+m+c,a=i[u],d=e+m;d=d<0?n+d:d%n;let g=t+f;g=g<0?n+g:g%n;let T=g*n+d;s[T]+=r*a}}addPointIndex(e){this.binaryPattern[e]=1;let t=this.size,r=~~(e/t),n=e-r*t;this.updateScore(n,r,1),this.count++}removePointIndex(e){this.binaryPattern[e]=0;let t=this.size,r=~~(e/t),n=e-r*t;this.updateScore(n,r,-1),this.count--}copy(e){this.resize(e.size),this.score.set(e.score),this.binaryPattern.set(e.binaryPattern),this.setSigma(e.sigma),this.count=e.count}};var gr=class{constructor(){this.random=Math.random,this.sigma=1.5,this.size=64,this.majorityPointsRatio=.1,this.samples=new ht(1),this.savedSamples=new ht(1)}generate(){let{samples:e,savedSamples:t,sigma:r,majorityPointsRatio:n,size:s}=this;e.resize(s),e.setSigma(r);let i=Math.floor(s*s*n),c=e.binaryPattern;mn(c,i),fn(c,this.random);for(let u=0,a=c.length;u<a;u++)c[u]===1&&e.addPointIndex(u);for(;;){let u=e.findCluster();e.removePointIndex(u);let a=e.findVoid();if(u===a){e.addPointIndex(u);break}e.addPointIndex(a)}let l=new Uint32Array(s*s);t.copy(e);let m;for(m=e.count-1;m>=0;){let u=e.findCluster();e.removePointIndex(u),l[u]=m,m--}let f=s*s;for(m=t.count;m<f/2;){let u=t.findVoid();t.addPointIndex(u),l[u]=m,m++}for(t.invert();m<f;){let u=t.findCluster();t.removePointIndex(u),l[u]=m,m++}return{data:l,maxValue:f}}};function Cc(o){return o>=3?4:o}function Dc(o){switch(o){case 1:return Fc;case 2:return Pc;default:return dn}}var vr=class extends Rc{constructor(e=64,t=1){super(new Float32Array(4),1,1,dn,Mc),this.minFilter=hn,this.magFilter=hn,this.size=e,this.channels=t,this.update()}update(){let e=this.channels,t=this.size,r=new gr;r.channels=e,r.size=t;let n=Cc(e),s=Dc(n);(this.image.width!==t||s!==this.format)&&(this.image.width=t,this.image.height=t,this.image.data=new Float32Array(t**2*n),this.format=s,this.dispose());let i=this.image.data;for(let c=0,l=e;c<l;c++){let m=r.generate(),f=m.data,u=m.maxValue;for(let a=0,d=f.length;a<d;a++){let g=f[a]/u;i[a*n+c]=g}}this.needsUpdate=!0}};var pn=`

	struct PhysicalCamera {

		float focusDistance;
		float anamorphicRatio;
		float bokehSize;
		int apertureBlades;
		float apertureRotation;

	};

`;var gn=`

	struct EquirectHdrInfo {

		sampler2D marginalWeights;
		sampler2D conditionalWeights;
		sampler2D map;

		float totalSum;

	};

`;var vn=`

	#define RECT_AREA_LIGHT_TYPE 0
	#define CIRC_AREA_LIGHT_TYPE 1
	#define SPOT_LIGHT_TYPE 2
	#define DIR_LIGHT_TYPE 3
	#define POINT_LIGHT_TYPE 4

	struct LightsInfo {

		sampler2D tex;
		uint count;

	};

	struct Light {

		vec3 position;
		int type;

		vec3 color;
		float intensity;

		vec3 u;
		vec3 v;
		float area;

		// spot light fields
		float radius;
		float near;
		float decay;
		float distance;
		float coneCos;
		float penumbraCos;
		int iesProfile;

	};

	Light readLightInfo( sampler2D tex, uint index ) {

		uint i = index * 6u;

		vec4 s0 = texelFetch1D( tex, i + 0u );
		vec4 s1 = texelFetch1D( tex, i + 1u );
		vec4 s2 = texelFetch1D( tex, i + 2u );
		vec4 s3 = texelFetch1D( tex, i + 3u );

		Light l;
		l.position = s0.rgb;
		l.type = int( round( s0.a ) );

		l.color = s1.rgb;
		l.intensity = s1.a;

		l.u = s2.rgb;
		l.v = s3.rgb;
		l.area = s3.a;

		if ( l.type == SPOT_LIGHT_TYPE || l.type == POINT_LIGHT_TYPE ) {

			vec4 s4 = texelFetch1D( tex, i + 4u );
			vec4 s5 = texelFetch1D( tex, i + 5u );
			l.radius = s4.r;
			l.decay = s4.g;
			l.distance = s4.b;
			l.coneCos = s4.a;

			l.penumbraCos = s5.r;
			l.iesProfile = int( round( s5.g ) );

		} else {

			l.radius = 0.0;
			l.decay = 0.0;
			l.distance = 0.0;

			l.coneCos = 0.0;
			l.penumbraCos = 0.0;
			l.iesProfile = - 1;

		}

		return l;

	}

`;var xn=`

	struct Material {

		vec3 color;
		int map;

		float metalness;
		int metalnessMap;

		float roughness;
		int roughnessMap;

		float ior;
		float transmission;
		int transmissionMap;

		float emissiveIntensity;
		vec3 emissive;
		int emissiveMap;

		int normalMap;
		vec2 normalScale;

		float clearcoat;
		int clearcoatMap;
		int clearcoatNormalMap;
		vec2 clearcoatNormalScale;
		float clearcoatRoughness;
		int clearcoatRoughnessMap;

		int iridescenceMap;
		int iridescenceThicknessMap;
		float iridescence;
		float iridescenceIor;
		float iridescenceThicknessMinimum;
		float iridescenceThicknessMaximum;

		vec3 specularColor;
		int specularColorMap;

		float specularIntensity;
		int specularIntensityMap;
		bool thinFilm;

		vec3 attenuationColor;
		float attenuationDistance;

		int alphaMap;

		bool castShadow;
		float opacity;
		float alphaTest;

		float side;
		bool matte;

		float sheen;
		vec3 sheenColor;
		int sheenColorMap;
		float sheenRoughness;
		int sheenRoughnessMap;

		bool vertexColors;
		bool flatShading;
		bool transparent;
		bool fogVolume;

		mat3 mapTransform;
		mat3 metalnessMapTransform;
		mat3 roughnessMapTransform;
		mat3 transmissionMapTransform;
		mat3 emissiveMapTransform;
		mat3 normalMapTransform;
		mat3 clearcoatMapTransform;
		mat3 clearcoatNormalMapTransform;
		mat3 clearcoatRoughnessMapTransform;
		mat3 sheenColorMapTransform;
		mat3 sheenRoughnessMapTransform;
		mat3 iridescenceMapTransform;
		mat3 iridescenceThicknessMapTransform;
		mat3 specularColorMapTransform;
		mat3 specularIntensityMapTransform;
		mat3 alphaMapTransform;

	};

	mat3 readTextureTransform( sampler2D tex, uint index ) {

		mat3 textureTransform;

		vec4 row1 = texelFetch1D( tex, index );
		vec4 row2 = texelFetch1D( tex, index + 1u );

		textureTransform[0] = vec3(row1.r, row2.r, 0.0);
		textureTransform[1] = vec3(row1.g, row2.g, 0.0);
		textureTransform[2] = vec3(row1.b, row2.b, 1.0);

		return textureTransform;

	}

	Material readMaterialInfo( sampler2D tex, uint index ) {

		uint i = index * uint( MATERIAL_PIXELS );

		vec4 s0 = texelFetch1D( tex, i + 0u );
		vec4 s1 = texelFetch1D( tex, i + 1u );
		vec4 s2 = texelFetch1D( tex, i + 2u );
		vec4 s3 = texelFetch1D( tex, i + 3u );
		vec4 s4 = texelFetch1D( tex, i + 4u );
		vec4 s5 = texelFetch1D( tex, i + 5u );
		vec4 s6 = texelFetch1D( tex, i + 6u );
		vec4 s7 = texelFetch1D( tex, i + 7u );
		vec4 s8 = texelFetch1D( tex, i + 8u );
		vec4 s9 = texelFetch1D( tex, i + 9u );
		vec4 s10 = texelFetch1D( tex, i + 10u );
		vec4 s11 = texelFetch1D( tex, i + 11u );
		vec4 s12 = texelFetch1D( tex, i + 12u );
		vec4 s13 = texelFetch1D( tex, i + 13u );
		vec4 s14 = texelFetch1D( tex, i + 14u );

		Material m;
		m.color = s0.rgb;
		m.map = int( round( s0.a ) );

		m.metalness = s1.r;
		m.metalnessMap = int( round( s1.g ) );
		m.roughness = s1.b;
		m.roughnessMap = int( round( s1.a ) );

		m.ior = s2.r;
		m.transmission = s2.g;
		m.transmissionMap = int( round( s2.b ) );
		m.emissiveIntensity = s2.a;

		m.emissive = s3.rgb;
		m.emissiveMap = int( round( s3.a ) );

		m.normalMap = int( round( s4.r ) );
		m.normalScale = s4.gb;

		m.clearcoat = s4.a;
		m.clearcoatMap = int( round( s5.r ) );
		m.clearcoatRoughness = s5.g;
		m.clearcoatRoughnessMap = int( round( s5.b ) );
		m.clearcoatNormalMap = int( round( s5.a ) );
		m.clearcoatNormalScale = s6.rg;

		m.sheen = s6.a;
		m.sheenColor = s7.rgb;
		m.sheenColorMap = int( round( s7.a ) );
		m.sheenRoughness = s8.r;
		m.sheenRoughnessMap = int( round( s8.g ) );

		m.iridescenceMap = int( round( s8.b ) );
		m.iridescenceThicknessMap = int( round( s8.a ) );
		m.iridescence = s9.r;
		m.iridescenceIor = s9.g;
		m.iridescenceThicknessMinimum = s9.b;
		m.iridescenceThicknessMaximum = s9.a;

		m.specularColor = s10.rgb;
		m.specularColorMap = int( round( s10.a ) );

		m.specularIntensity = s11.r;
		m.specularIntensityMap = int( round( s11.g ) );
		m.thinFilm = bool( s11.b );

		m.attenuationColor = s12.rgb;
		m.attenuationDistance = s12.a;

		m.alphaMap = int( round( s13.r ) );

		m.opacity = s13.g;
		m.alphaTest = s13.b;
		m.side = s13.a;

		m.matte = bool( s14.r );
		m.castShadow = bool( s14.g );
		m.vertexColors = bool( int( s14.b ) & 1 );
		m.flatShading = bool( int( s14.b ) & 2 );
		m.fogVolume = bool( int( s14.b ) & 4 );
		m.transparent = bool( s14.a );

		uint firstTextureTransformIdx = i + 15u;

		// mat3( 1.0 ) is an identity matrix
		m.mapTransform = m.map == - 1 ? mat3( 1.0 ) : readTextureTransform( tex, firstTextureTransformIdx );
		m.metalnessMapTransform = m.metalnessMap == - 1 ? mat3( 1.0 ) : readTextureTransform( tex, firstTextureTransformIdx + 2u );
		m.roughnessMapTransform = m.roughnessMap == - 1 ? mat3( 1.0 ) : readTextureTransform( tex, firstTextureTransformIdx + 4u );
		m.transmissionMapTransform = m.transmissionMap == - 1 ? mat3( 1.0 ) : readTextureTransform( tex, firstTextureTransformIdx + 6u );
		m.emissiveMapTransform = m.emissiveMap == - 1 ? mat3( 1.0 ) : readTextureTransform( tex, firstTextureTransformIdx + 8u );
		m.normalMapTransform = m.normalMap == - 1 ? mat3( 1.0 ) : readTextureTransform( tex, firstTextureTransformIdx + 10u );
		m.clearcoatMapTransform = m.clearcoatMap == - 1 ? mat3( 1.0 ) : readTextureTransform( tex, firstTextureTransformIdx + 12u );
		m.clearcoatNormalMapTransform = m.clearcoatNormalMap == - 1 ? mat3( 1.0 ) : readTextureTransform( tex, firstTextureTransformIdx + 14u );
		m.clearcoatRoughnessMapTransform = m.clearcoatRoughnessMap == - 1 ? mat3( 1.0 ) : readTextureTransform( tex, firstTextureTransformIdx + 16u );
		m.sheenColorMapTransform = m.sheenColorMap == - 1 ? mat3( 1.0 ) : readTextureTransform( tex, firstTextureTransformIdx + 18u );
		m.sheenRoughnessMapTransform = m.sheenRoughnessMap == - 1 ? mat3( 1.0 ) : readTextureTransform( tex, firstTextureTransformIdx + 20u );
		m.iridescenceMapTransform = m.iridescenceMap == - 1 ? mat3( 1.0 ) : readTextureTransform( tex, firstTextureTransformIdx + 22u );
		m.iridescenceThicknessMapTransform = m.iridescenceThicknessMap == - 1 ? mat3( 1.0 ) : readTextureTransform( tex, firstTextureTransformIdx + 24u );
		m.specularColorMapTransform = m.specularColorMap == - 1 ? mat3( 1.0 ) : readTextureTransform( tex, firstTextureTransformIdx + 26u );
		m.specularIntensityMapTransform = m.specularIntensityMap == - 1 ? mat3( 1.0 ) : readTextureTransform( tex, firstTextureTransformIdx + 28u );
		m.alphaMapTransform = m.alphaMap == - 1 ? mat3( 1.0 ) : readTextureTransform( tex, firstTextureTransformIdx + 30u );

		return m;

	}

`;var yn=`

	struct SurfaceRecord {

		// surface type
		bool volumeParticle;

		// geometry
		vec3 faceNormal;
		bool frontFace;
		vec3 normal;
		mat3 normalBasis;
		mat3 normalInvBasis;

		// cached properties
		float eta;
		float f0;

		// material
		float roughness;
		float filteredRoughness;
		float metalness;
		vec3 color;
		vec3 emission;

		// transmission
		float ior;
		float transmission;
		bool thinFilm;
		vec3 attenuationColor;
		float attenuationDistance;

		// clearcoat
		vec3 clearcoatNormal;
		mat3 clearcoatBasis;
		mat3 clearcoatInvBasis;
		float clearcoat;
		float clearcoatRoughness;
		float filteredClearcoatRoughness;

		// sheen
		float sheen;
		vec3 sheenColor;
		float sheenRoughness;

		// iridescence
		float iridescence;
		float iridescenceIor;
		float iridescenceThickness;

		// specular
		vec3 specularColor;
		float specularIntensity;
	};

	struct ScatterRecord {
		float specularPdf;
		float pdf;
		vec3 direction;
		vec3 color;
	};

`;var bn=`

	// samples the the given environment map in the given direction
	vec3 sampleEquirectColor( sampler2D envMap, vec3 direction ) {

		return texture2D( envMap, equirectDirectionToUv( direction ) ).rgb;

	}

	// gets the pdf of the given direction to sample
	float equirectDirectionPdf( vec3 direction ) {

		vec2 uv = equirectDirectionToUv( direction );
		float theta = uv.y * PI;
		float sinTheta = sin( theta );
		if ( sinTheta == 0.0 ) {

			return 0.0;

		}

		return 1.0 / ( 2.0 * PI * PI * sinTheta );

	}

	// samples the color given env map with CDF and returns the pdf of the direction
	float sampleEquirect( vec3 direction, inout vec3 color ) {

		float totalSum = envMapInfo.totalSum;
		if ( totalSum == 0.0 ) {

			color = vec3( 0.0 );
			return 1.0;

		}

		vec2 uv = equirectDirectionToUv( direction );
		color = texture2D( envMapInfo.map, uv ).rgb;

		float lum = luminance( color );
		ivec2 resolution = textureSize( envMapInfo.map, 0 );
		float pdf = lum / totalSum;

		return float( resolution.x * resolution.y ) * pdf * equirectDirectionPdf( direction );

	}

	// samples a direction of the envmap with color and retrieves pdf
	float sampleEquirectProbability( vec2 r, inout vec3 color, inout vec3 direction ) {

		// sample env map cdf
		float v = texture2D( envMapInfo.marginalWeights, vec2( r.x, 0.0 ) ).x;
		float u = texture2D( envMapInfo.conditionalWeights, vec2( r.y, v ) ).x;
		vec2 uv = vec2( u, v );

		vec3 derivedDirection = equirectUvToDirection( uv );
		direction = derivedDirection;
		color = texture2D( envMapInfo.map, uv ).rgb;

		float totalSum = envMapInfo.totalSum;
		float lum = luminance( color );
		ivec2 resolution = textureSize( envMapInfo.map, 0 );
		float pdf = lum / totalSum;

		return float( resolution.x * resolution.y ) * pdf * equirectDirectionPdf( direction );

	}
`;var Tn=`

	float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {

		return smoothstep( coneCosine, penumbraCosine, angleCosine );

	}

	float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {

		// based upon Frostbite 3 Moving to Physically-based Rendering
		// page 32, equation 26: E[window1]
		// https://seblagarde.files.wordpress.com/2015/07/course_notes_moving_frostbite_to_pbr_v32.pdf
		float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), EPSILON );

		if ( cutoffDistance > 0.0 ) {

			distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );

		}

		return distanceFalloff;

	}

	float getPhotometricAttenuation( sampler2DArray iesProfiles, int iesProfile, vec3 posToLight, vec3 lightDir, vec3 u, vec3 v ) {

		float cosTheta = dot( posToLight, lightDir );
		float angle = acos( cosTheta ) / PI;

		return texture2D( iesProfiles, vec3( angle, 0.0, iesProfile ) ).r;

	}

	struct LightRecord {

		float dist;
		vec3 direction;
		float pdf;
		vec3 emission;
		int type;

	};

	bool intersectLightAtIndex( sampler2D lights, vec3 rayOrigin, vec3 rayDirection, uint l, inout LightRecord lightRec ) {

		bool didHit = false;
		Light light = readLightInfo( lights, l );

		vec3 u = light.u;
		vec3 v = light.v;

		// check for backface
		vec3 normal = normalize( cross( u, v ) );
		if ( dot( normal, rayDirection ) > 0.0 ) {

			u *= 1.0 / dot( u, u );
			v *= 1.0 / dot( v, v );

			float dist;

			// MIS / light intersection is not supported for punctual lights.
			if(
				( light.type == RECT_AREA_LIGHT_TYPE && intersectsRectangle( light.position, normal, u, v, rayOrigin, rayDirection, dist ) ) ||
				( light.type == CIRC_AREA_LIGHT_TYPE && intersectsCircle( light.position, normal, u, v, rayOrigin, rayDirection, dist ) )
			) {

				float cosTheta = dot( rayDirection, normal );
				didHit = true;
				lightRec.dist = dist;
				lightRec.pdf = ( dist * dist ) / ( light.area * cosTheta );
				lightRec.emission = light.color * light.intensity;
				lightRec.direction = rayDirection;
				lightRec.type = light.type;

			}

		}

		return didHit;

	}

	LightRecord randomAreaLightSample( Light light, vec3 rayOrigin, vec2 ruv ) {

		vec3 randomPos;
		if( light.type == RECT_AREA_LIGHT_TYPE ) {

			// rectangular area light
			randomPos = light.position + light.u * ( ruv.x - 0.5 ) + light.v * ( ruv.y - 0.5 );

		} else if( light.type == CIRC_AREA_LIGHT_TYPE ) {

			// circular area light
			float r = 0.5 * sqrt( ruv.x );
			float theta = ruv.y * 2.0 * PI;
			float x = r * cos( theta );
			float y = r * sin( theta );

			randomPos = light.position + light.u * x + light.v * y;

		}

		vec3 toLight = randomPos - rayOrigin;
		float lightDistSq = dot( toLight, toLight );
		float dist = sqrt( lightDistSq );
		vec3 direction = toLight / dist;
		vec3 lightNormal = normalize( cross( light.u, light.v ) );

		LightRecord lightRec;
		lightRec.type = light.type;
		lightRec.emission = light.color * light.intensity;
		lightRec.dist = dist;
		lightRec.direction = direction;

		// TODO: the denominator is potentially zero
		lightRec.pdf = lightDistSq / ( light.area * dot( direction, lightNormal ) );

		return lightRec;

	}

	LightRecord randomSpotLightSample( Light light, sampler2DArray iesProfiles, vec3 rayOrigin, vec2 ruv ) {

		float radius = light.radius * sqrt( ruv.x );
		float theta = ruv.y * 2.0 * PI;
		float x = radius * cos( theta );
		float y = radius * sin( theta );

		vec3 u = light.u;
		vec3 v = light.v;
		vec3 normal = normalize( cross( u, v ) );

		float angle = acos( light.coneCos );
		float angleTan = tan( angle );
		float startDistance = light.radius / max( angleTan, EPSILON );

		vec3 randomPos = light.position - normal * startDistance + u * x + v * y;
		vec3 toLight = randomPos - rayOrigin;
		float lightDistSq = dot( toLight, toLight );
		float dist = sqrt( lightDistSq );

		vec3 direction = toLight / max( dist, EPSILON );
		float cosTheta = dot( direction, normal );

		float spotAttenuation = light.iesProfile != - 1 ?
			getPhotometricAttenuation( iesProfiles, light.iesProfile, direction, normal, u, v ) :
			getSpotAttenuation( light.coneCos, light.penumbraCos, cosTheta );

		float distanceAttenuation = getDistanceAttenuation( dist, light.distance, light.decay );
		LightRecord lightRec;
		lightRec.type = light.type;
		lightRec.dist = dist;
		lightRec.direction = direction;
		lightRec.emission = light.color * light.intensity * distanceAttenuation * spotAttenuation;
		lightRec.pdf = 1.0;

		return lightRec;

	}

	LightRecord randomLightSample( sampler2D lights, sampler2DArray iesProfiles, uint lightCount, vec3 rayOrigin, vec3 ruv ) {

		LightRecord result;

		// pick a random light
		uint l = uint( ruv.x * float( lightCount ) );
		Light light = readLightInfo( lights, l );

		if ( light.type == SPOT_LIGHT_TYPE ) {

			result = randomSpotLightSample( light, iesProfiles, rayOrigin, ruv.yz );

		} else if ( light.type == POINT_LIGHT_TYPE ) {

			vec3 lightRay = light.u - rayOrigin;
			float lightDist = length( lightRay );
			float cutoffDistance = light.distance;
			float distanceFalloff = 1.0 / max( pow( lightDist, light.decay ), 0.01 );
			if ( cutoffDistance > 0.0 ) {

				distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDist / cutoffDistance ) ) );

			}

			LightRecord rec;
			rec.direction = normalize( lightRay );
			rec.dist = length( lightRay );
			rec.pdf = 1.0;
			rec.emission = light.color * light.intensity * distanceFalloff;
			rec.type = light.type;
			result = rec;

		} else if ( light.type == DIR_LIGHT_TYPE ) {

			LightRecord rec;
			rec.dist = 1e10;
			rec.direction = light.u;
			rec.pdf = 1.0;
			rec.emission = light.color * light.intensity;
			rec.type = light.type;

			result = rec;

		} else {

			// sample the light
			result = randomAreaLightSample( light, rayOrigin, ruv.yz );

		}

		return result;

	}

`;var wn=`

	vec3 sampleHemisphere( vec3 n, vec2 uv ) {

		// https://www.rorydriscoll.com/2009/01/07/better-sampling/
		// https://graphics.pixar.com/library/OrthonormalB/paper.pdf
		float sign = n.z == 0.0 ? 1.0 : sign( n.z );
		float a = - 1.0 / ( sign + n.z );
		float b = n.x * n.y * a;
		vec3 b1 = vec3( 1.0 + sign * n.x * n.x * a, sign * b, - sign * n.x );
		vec3 b2 = vec3( b, sign + n.y * n.y * a, - n.y );

		float r = sqrt( uv.x );
		float theta = 2.0 * PI * uv.y;
		float x = r * cos( theta );
		float y = r * sin( theta );
		return x * b1 + y * b2 + sqrt( 1.0 - uv.x ) * n;

	}

	vec2 sampleTriangle( vec2 a, vec2 b, vec2 c, vec2 r ) {

		// get the edges of the triangle and the diagonal across the
		// center of the parallelogram
		vec2 e1 = a - b;
		vec2 e2 = c - b;
		vec2 diag = normalize( e1 + e2 );

		// pick the point in the parallelogram
		if ( r.x + r.y > 1.0 ) {

			r = vec2( 1.0 ) - r;

		}

		return e1 * r.x + e2 * r.y;

	}

	vec2 sampleCircle( vec2 uv ) {

		float angle = 2.0 * PI * uv.x;
		float radius = sqrt( uv.y );
		return vec2( cos( angle ), sin( angle ) ) * radius;

	}

	vec3 sampleSphere( vec2 uv ) {

		float u = ( uv.x - 0.5 ) * 2.0;
		float t = uv.y * PI * 2.0;
		float f = sqrt( 1.0 - u * u );

		return vec3( f * cos( t ), f * sin( t ), u );

	}

	vec2 sampleRegularPolygon( int sides, vec3 uvw ) {

		sides = max( sides, 3 );

		vec3 r = uvw;
		float anglePerSegment = 2.0 * PI / float( sides );
		float segment = floor( float( sides ) * r.x );

		float angle1 = anglePerSegment * segment;
		float angle2 = angle1 + anglePerSegment;
		vec2 a = vec2( sin( angle1 ), cos( angle1 ) );
		vec2 b = vec2( 0.0, 0.0 );
		vec2 c = vec2( sin( angle2 ), cos( angle2 ) );

		return sampleTriangle( a, b, c, r.yz );

	}

	// samples an aperture shape with the given number of sides. 0 means circle
	vec2 sampleAperture( int blades, vec3 uvw ) {

		return blades == 0 ?
			sampleCircle( uvw.xy ) :
			sampleRegularPolygon( blades, uvw );

	}


`;var Sn=`

	bool totalInternalReflection( float cosTheta, float eta ) {

		float sinTheta = sqrt( 1.0 - cosTheta * cosTheta );
		return eta * sinTheta > 1.0;

	}

	// https://google.github.io/filament/Filament.md.html#materialsystem/diffusebrdf
	float schlickFresnel( float cosine, float f0 ) {

		return f0 + ( 1.0 - f0 ) * pow( 1.0 - cosine, 5.0 );

	}

	vec3 schlickFresnel( float cosine, vec3 f0 ) {

		return f0 + ( 1.0 - f0 ) * pow( 1.0 - cosine, 5.0 );

	}

	vec3 schlickFresnel( float cosine, vec3 f0, vec3 f90 ) {

		return f0 + ( f90 - f0 ) * pow( 1.0 - cosine, 5.0 );

	}

	float dielectricFresnel( float cosThetaI, float eta ) {

		// https://schuttejoe.github.io/post/disneybsdf/
		float ni = eta;
		float nt = 1.0;

		// Check for total internal reflection
		float sinThetaISq = 1.0f - cosThetaI * cosThetaI;
		float sinThetaTSq = eta * eta * sinThetaISq;
		if( sinThetaTSq >= 1.0 ) {

			return 1.0;

		}

		float sinThetaT = sqrt( sinThetaTSq );

		float cosThetaT = sqrt( max( 0.0, 1.0f - sinThetaT * sinThetaT ) );
		float rParallel = ( ( nt * cosThetaI ) - ( ni * cosThetaT ) ) / ( ( nt * cosThetaI ) + ( ni * cosThetaT ) );
		float rPerpendicular = ( ( ni * cosThetaI ) - ( nt * cosThetaT ) ) / ( ( ni * cosThetaI ) + ( nt * cosThetaT ) );
		return ( rParallel * rParallel + rPerpendicular * rPerpendicular ) / 2.0;

	}

	// https://raytracing.github.io/books/RayTracingInOneWeekend.html#dielectrics/schlickapproximation
	float iorRatioToF0( float eta ) {

		return pow( ( 1.0 - eta ) / ( 1.0 + eta ), 2.0 );

	}

	vec3 evaluateFresnel( float cosTheta, float eta, vec3 f0, vec3 f90 ) {

		if ( totalInternalReflection( cosTheta, eta ) ) {

			return f90;

		}

		return schlickFresnel( cosTheta, f0, f90 );

	}

	// TODO: disney fresnel was removed and replaced with this fresnel function to better align with
	// the glTF but is causing blown out pixels. Should be revisited
	// float evaluateFresnelWeight( float cosTheta, float eta, float f0 ) {

	// 	if ( totalInternalReflection( cosTheta, eta ) ) {

	// 		return 1.0;

	// 	}

	// 	return schlickFresnel( cosTheta, f0 );

	// }

	// https://schuttejoe.github.io/post/disneybsdf/
	float disneyFresnel( vec3 wo, vec3 wi, vec3 wh, float f0, float eta, float metalness ) {

		float dotHV = dot( wo, wh );
		if ( totalInternalReflection( dotHV, eta ) ) {

			return 1.0;

		}

		float dotHL = dot( wi, wh );
		float dielectricFresnel = dielectricFresnel( abs( dotHV ), eta );
		float metallicFresnel = schlickFresnel( dotHL, f0 );

		return mix( dielectricFresnel, metallicFresnel, metalness );

	}

`;var _n=`

	// Fast arccos approximation used to remove banding artifacts caused by numerical errors in acos.
	// This is a cubic Lagrange interpolating polynomial for x = [-1, -1/2, 0, 1/2, 1].
	// For more information see: https://github.com/gkjohnson/three-gpu-pathtracer/pull/171#issuecomment-1152275248
	float acosApprox( float x ) {

		x = clamp( x, -1.0, 1.0 );
		return ( - 0.69813170079773212 * x * x - 0.87266462599716477 ) * x + 1.5707963267948966;

	}

	// An acos with input values bound to the range [-1, 1].
	float acosSafe( float x ) {

		return acos( clamp( x, -1.0, 1.0 ) );

	}

	float saturateCos( float val ) {

		return clamp( val, 0.001, 1.0 );

	}

	float square( float t ) {

		return t * t;

	}

	vec2 square( vec2 t ) {

		return t * t;

	}

	vec3 square( vec3 t ) {

		return t * t;

	}

	vec4 square( vec4 t ) {

		return t * t;

	}

	vec2 rotateVector( vec2 v, float t ) {

		float ac = cos( t );
		float as = sin( t );
		return vec2(
			v.x * ac - v.y * as,
			v.x * as + v.y * ac
		);

	}

	// forms a basis with the normal vector as Z
	mat3 getBasisFromNormal( vec3 normal ) {

		vec3 other;
		if ( abs( normal.x ) > 0.5 ) {

			other = vec3( 0.0, 1.0, 0.0 );

		} else {

			other = vec3( 1.0, 0.0, 0.0 );

		}

		vec3 ortho = normalize( cross( normal, other ) );
		vec3 ortho2 = normalize( cross( normal, ortho ) );
		return mat3( ortho2, ortho, normal );

	}

`;var An=`

	// Finds the point where the ray intersects the plane defined by u and v and checks if this point
	// falls in the bounds of the rectangle on that same plane.
	// Plane intersection: https://lousodrome.net/blog/light/2020/07/03/intersection-of-a-ray-and-a-plane/
	bool intersectsRectangle( vec3 center, vec3 normal, vec3 u, vec3 v, vec3 rayOrigin, vec3 rayDirection, inout float dist ) {

		float t = dot( center - rayOrigin, normal ) / dot( rayDirection, normal );

		if ( t > EPSILON ) {

			vec3 p = rayOrigin + rayDirection * t;
			vec3 vi = p - center;

			// check if p falls inside the rectangle
			float a1 = dot( u, vi );
			if ( abs( a1 ) <= 0.5 ) {

				float a2 = dot( v, vi );
				if ( abs( a2 ) <= 0.5 ) {

					dist = t;
					return true;

				}

			}

		}

		return false;

	}

	// Finds the point where the ray intersects the plane defined by u and v and checks if this point
	// falls in the bounds of the circle on that same plane. See above URL for a description of the plane intersection algorithm.
	bool intersectsCircle( vec3 position, vec3 normal, vec3 u, vec3 v, vec3 rayOrigin, vec3 rayDirection, inout float dist ) {

		float t = dot( position - rayOrigin, normal ) / dot( rayDirection, normal );

		if ( t > EPSILON ) {

			vec3 hit = rayOrigin + rayDirection * t;
			vec3 vi = hit - position;

			float a1 = dot( u, vi );
			float a2 = dot( v, vi );

			if( length( vec2( a1, a2 ) ) <= 0.5 ) {

				dist = t;
				return true;

			}

		}

		return false;

	}

`;var In=`

	// add texel fetch functions for texture arrays
	vec4 texelFetch1D( sampler2DArray tex, int layer, uint index ) {

		uint width = uint( textureSize( tex, 0 ).x );
		uvec2 uv;
		uv.x = index % width;
		uv.y = index / width;

		return texelFetch( tex, ivec3( uv, layer ), 0 );

	}

	vec4 textureSampleBarycoord( sampler2DArray tex, int layer, vec3 barycoord, uvec3 faceIndices ) {

		return
			barycoord.x * texelFetch1D( tex, layer, faceIndices.x ) +
			barycoord.y * texelFetch1D( tex, layer, faceIndices.y ) +
			barycoord.z * texelFetch1D( tex, layer, faceIndices.z );

	}

`;var xr=`

	// TODO: possibly this should be renamed something related to material or path tracing logic

	#ifndef RAY_OFFSET
	#define RAY_OFFSET 1e-4
	#endif

	// adjust the hit point by the surface normal by a factor of some offset and the
	// maximum component-wise value of the current point to accommodate floating point
	// error as values increase.
	vec3 stepRayOrigin( vec3 rayOrigin, vec3 rayDirection, vec3 offset, float dist ) {

		vec3 point = rayOrigin + rayDirection * dist;
		vec3 absPoint = abs( point );
		float maxPoint = max( absPoint.x, max( absPoint.y, absPoint.z ) );
		return point + offset * ( maxPoint + 1.0 ) * RAY_OFFSET;

	}

	// https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_volume/README.md#attenuation
	vec3 transmissionAttenuation( float dist, vec3 attColor, float attDist ) {

		vec3 ot = - log( attColor ) / attDist;
		return exp( - ot * dist );

	}

	vec3 getHalfVector( vec3 wi, vec3 wo, float eta ) {

		// get the half vector - assuming if the light incident vector is on the other side
		// of the that it's transmissive.
		vec3 h;
		if ( wi.z > 0.0 ) {

			h = normalize( wi + wo );

		} else {

			// Scale by the ior ratio to retrieve the appropriate half vector
			// From Section 2.2 on computing the transmission half vector:
			// https://blog.selfshadow.com/publications/s2015-shading-course/burley/s2015_pbs_disney_bsdf_notes.pdf
			h = normalize( wi + wo * eta );

		}

		h *= sign( h.z );
		return h;

	}

	vec3 getHalfVector( vec3 a, vec3 b ) {

		return normalize( a + b );

	}

	// The discrepancy between interpolated surface normal and geometry normal can cause issues when a ray
	// is cast that is on the top side of the geometry normal plane but below the surface normal plane. If
	// we find a ray like that we ignore it to avoid artifacts.
	// This function returns if the direction is on the same side of both planes.
	bool isDirectionValid( vec3 direction, vec3 surfaceNormal, vec3 geometryNormal ) {

		bool aboveSurfaceNormal = dot( direction, surfaceNormal ) > 0.0;
		bool aboveGeometryNormal = dot( direction, geometryNormal ) > 0.0;
		return aboveSurfaceNormal == aboveGeometryNormal;

	}

	// ray sampling x and z are swapped to align with expected background view
	vec2 equirectDirectionToUv( vec3 direction ) {

		// from Spherical.setFromCartesianCoords
		vec2 uv = vec2( atan( direction.z, direction.x ), acos( direction.y ) );
		uv /= vec2( 2.0 * PI, PI );

		// apply adjustments to get values in range [0, 1] and y right side up
		uv.x += 0.5;
		uv.y = 1.0 - uv.y;
		return uv;

	}

	vec3 equirectUvToDirection( vec2 uv ) {

		// undo above adjustments
		uv.x -= 0.5;
		uv.y = 1.0 - uv.y;

		// from Vector3.setFromSphericalCoords
		float theta = uv.x * 2.0 * PI;
		float phi = uv.y * PI;

		float sinPhi = sin( phi );

		return vec3( sinPhi * cos( theta ), cos( phi ), sinPhi * sin( theta ) );

	}

	// power heuristic for multiple importance sampling
	float misHeuristic( float a, float b ) {

		float aa = a * a;
		float bb = b * b;
		return aa / ( aa + bb );

	}

	// tentFilter from Peter Shirley's 'Realistic Ray Tracing (2nd Edition)' book, pg. 60
	// erichlof/THREE.js-PathTracing-Renderer/
	float tentFilter( float x ) {

		return x < 0.5 ? sqrt( 2.0 * x ) - 1.0 : 1.0 - sqrt( 2.0 - ( 2.0 * x ) );

	}
`;var gi=`

	// https://www.shadertoy.com/view/wltcRS
	uvec4 WHITE_NOISE_SEED;

	void rng_initialize( vec2 p, int frame ) {

		// white noise seed
		WHITE_NOISE_SEED = uvec4( p, uint( frame ), uint( p.x ) + uint( p.y ) );

	}

	// https://www.pcg-random.org/
	void pcg4d( inout uvec4 v ) {

		v = v * 1664525u + 1013904223u;
		v.x += v.y * v.w;
		v.y += v.z * v.x;
		v.z += v.x * v.y;
		v.w += v.y * v.z;
		v = v ^ ( v >> 16u );
		v.x += v.y*v.w;
		v.y += v.z*v.x;
		v.z += v.x*v.y;
		v.w += v.y*v.z;

	}

	// returns [ 0, 1 ]
	float pcgRand() {

		pcg4d( WHITE_NOISE_SEED );
		return float( WHITE_NOISE_SEED.x ) / float( 0xffffffffu );

	}

	vec2 pcgRand2() {

		pcg4d( WHITE_NOISE_SEED );
		return vec2( WHITE_NOISE_SEED.xy ) / float(0xffffffffu);

	}

	vec3 pcgRand3() {

		pcg4d( WHITE_NOISE_SEED );
		return vec3( WHITE_NOISE_SEED.xyz ) / float( 0xffffffffu );

	}

	vec4 pcgRand4() {

		pcg4d( WHITE_NOISE_SEED );
		return vec4( WHITE_NOISE_SEED ) / float( 0xffffffffu );

	}
`;var Rn=`

	uniform sampler2D stratifiedTexture;
	uniform sampler2D stratifiedOffsetTexture;

	uint sobolPixelIndex = 0u;
	uint sobolPathIndex = 0u;
	uint sobolBounceIndex = 0u;
	vec4 pixelSeed = vec4( 0 );

	vec4 rand4( int v ) {

		ivec2 uv = ivec2( v, sobolBounceIndex );
		vec4 stratifiedSample = texelFetch( stratifiedTexture, uv, 0 );
		return fract( stratifiedSample + pixelSeed.r ); // blue noise + stratified samples

	}

	vec3 rand3( int v ) {

		return rand4( v ).xyz;

	}

	vec2 rand2( int v ) {

		return rand4( v ).xy;

	}

	float rand( int v ) {

		return rand4( v ).x;

	}

	void rng_initialize( vec2 screenCoord, int frame ) {

		// tile the small noise texture across the entire screen
		ivec2 noiseSize = ivec2( textureSize( stratifiedOffsetTexture, 0 ) );
		ivec2 pixel = ivec2( screenCoord.xy ) % noiseSize;
		vec2 pixelWidth = 1.0 / vec2( noiseSize );
		vec2 uv = vec2( pixel ) * pixelWidth + pixelWidth * 0.5;

		// note that using "texelFetch" here seems to break Android for some reason
		pixelSeed = texture( stratifiedOffsetTexture, uv );

	}

`;var Mn=`

	// diffuse
	float diffuseEval( vec3 wo, vec3 wi, vec3 wh, SurfaceRecord surf, inout vec3 color ) {

		// https://schuttejoe.github.io/post/disneybsdf/
		float fl = schlickFresnel( wi.z, 0.0 );
		float fv = schlickFresnel( wo.z, 0.0 );

		float metalFactor = ( 1.0 - surf.metalness );
		float transFactor = ( 1.0 - surf.transmission );
		float rr = 0.5 + 2.0 * surf.roughness * fl * fl;
		float retro = rr * ( fl + fv + fl * fv * ( rr - 1.0f ) );
		float lambert = ( 1.0f - 0.5f * fl ) * ( 1.0f - 0.5f * fv );

		// TODO: subsurface approx?

		// float F = evaluateFresnelWeight( dot( wo, wh ), surf.eta, surf.f0 );
		float F = disneyFresnel( wo, wi, wh, surf.f0, surf.eta, surf.metalness );
		color = ( 1.0 - F ) * transFactor * metalFactor * wi.z * surf.color * ( retro + lambert ) / PI;

		return wi.z / PI;

	}

	vec3 diffuseDirection( vec3 wo, SurfaceRecord surf ) {

		vec3 lightDirection = sampleSphere( rand2( 11 ) );
		lightDirection.z += 1.0;
		lightDirection = normalize( lightDirection );

		return lightDirection;

	}

	// specular
	float specularEval( vec3 wo, vec3 wi, vec3 wh, SurfaceRecord surf, inout vec3 color ) {

		// if roughness is set to 0 then D === NaN which results in black pixels
		float metalness = surf.metalness;
		float roughness = surf.filteredRoughness;

		float eta = surf.eta;
		float f0 = surf.f0;

		vec3 f0Color = mix( f0 * surf.specularColor * surf.specularIntensity, surf.color, surf.metalness );
		vec3 f90Color = vec3( mix( surf.specularIntensity, 1.0, surf.metalness ) );
		vec3 F = evaluateFresnel( dot( wo, wh ), eta, f0Color, f90Color );

		vec3 iridescenceF = evalIridescence( 1.0, surf.iridescenceIor, dot( wi, wh ), surf.iridescenceThickness, f0Color );
		F = mix( F, iridescenceF,  surf.iridescence );

		// PDF
		// See 14.1.1 Microfacet BxDFs in https://www.pbr-book.org/
		float incidentTheta = acos( wo.z );
		float G = ggxShadowMaskG2( wi, wo, roughness );
		float D = ggxDistribution( wh, roughness );
		float G1 = ggxShadowMaskG1( incidentTheta, roughness );
		float ggxPdf = D * G1 * max( 0.0, abs( dot( wo, wh ) ) ) / abs ( wo.z );

		color = wi.z * F * G * D / ( 4.0 * abs( wi.z * wo.z ) );
		return ggxPdf / ( 4.0 * dot( wo, wh ) );

	}

	vec3 specularDirection( vec3 wo, SurfaceRecord surf ) {

		// sample ggx vndf distribution which gives a new normal
		float roughness = surf.filteredRoughness;
		vec3 halfVector = ggxDirection(
			wo,
			vec2( roughness ),
			rand2( 12 )
		);

		// apply to new ray by reflecting off the new normal
		return - reflect( wo, halfVector );

	}


	// transmission
	/*
	float transmissionEval( vec3 wo, vec3 wi, vec3 wh, SurfaceRecord surf, inout vec3 color ) {

		// See section 4.2 in https://www.cs.cornell.edu/~srm/publications/EGSR07-btdf.pdf

		float filteredRoughness = surf.filteredRoughness;
		float eta = surf.eta;
		bool frontFace = surf.frontFace;
		bool thinFilm = surf.thinFilm;

		color = surf.transmission * surf.color;

		float denom = pow( eta * dot( wi, wh ) + dot( wo, wh ), 2.0 );
		return ggxPDF( wo, wh, filteredRoughness ) / denom;

	}

	vec3 transmissionDirection( vec3 wo, SurfaceRecord surf ) {

		float filteredRoughness = surf.filteredRoughness;
		float eta = surf.eta;
		bool frontFace = surf.frontFace;

		// sample ggx vndf distribution which gives a new normal
		vec3 halfVector = ggxDirection(
			wo,
			vec2( filteredRoughness ),
			rand2( 13 )
		);

		vec3 lightDirection = refract( normalize( - wo ), halfVector, eta );
		if ( surf.thinFilm ) {

			lightDirection = - refract( normalize( - lightDirection ), - vec3( 0.0, 0.0, 1.0 ), 1.0 / eta );

		}

		return normalize( lightDirection );

	}
	*/

	// TODO: This is just using a basic cosine-weighted specular distribution with an
	// incorrect PDF value at the moment. Update it to correctly use a GGX distribution
	float transmissionEval( vec3 wo, vec3 wi, vec3 wh, SurfaceRecord surf, inout vec3 color ) {

		color = surf.transmission * surf.color;

		// PDF
		// float F = evaluateFresnelWeight( dot( wo, wh ), surf.eta, surf.f0 );
		// float F = disneyFresnel( wo, wi, wh, surf.f0, surf.eta, surf.metalness );
		// if ( F >= 1.0 ) {

		// 	return 0.0;

		// }

		// return 1.0 / ( 1.0 - F );

		// reverted to previous to transmission. The above was causing black pixels
		float eta = surf.eta;
		float f0 = surf.f0;
		float cosTheta = min( wo.z, 1.0 );
		float sinTheta = sqrt( 1.0 - cosTheta * cosTheta );
		float reflectance = schlickFresnel( cosTheta, f0 );
		bool cannotRefract = eta * sinTheta > 1.0;
		if ( cannotRefract ) {

			return 0.0;

		}

		return 1.0 / ( 1.0 - reflectance );

	}

	vec3 transmissionDirection( vec3 wo, SurfaceRecord surf ) {

		float roughness = surf.filteredRoughness;
		float eta = surf.eta;
		vec3 halfVector = normalize( vec3( 0.0, 0.0, 1.0 ) + sampleSphere( rand2( 13 ) ) * roughness );
		vec3 lightDirection = refract( normalize( - wo ), halfVector, eta );

		if ( surf.thinFilm ) {

			lightDirection = - refract( normalize( - lightDirection ), - vec3( 0.0, 0.0, 1.0 ), 1.0 / eta );

		}
		return normalize( lightDirection );

	}

	// clearcoat
	float clearcoatEval( vec3 wo, vec3 wi, vec3 wh, SurfaceRecord surf, inout vec3 color ) {

		float ior = 1.5;
		float f0 = iorRatioToF0( ior );
		bool frontFace = surf.frontFace;
		float roughness = surf.filteredClearcoatRoughness;

		float eta = frontFace ? 1.0 / ior : ior;
		float G = ggxShadowMaskG2( wi, wo, roughness );
		float D = ggxDistribution( wh, roughness );
		float F = schlickFresnel( dot( wi, wh ), f0 );

		float fClearcoat = F * D * G / ( 4.0 * abs( wi.z * wo.z ) );
		color = color * ( 1.0 - surf.clearcoat * F ) + fClearcoat * surf.clearcoat * wi.z;

		// PDF
		// See equation (27) in http://jcgt.org/published/0003/02/03/
		return ggxPDF( wo, wh, roughness ) / ( 4.0 * dot( wi, wh ) );

	}

	vec3 clearcoatDirection( vec3 wo, SurfaceRecord surf ) {

		// sample ggx vndf distribution which gives a new normal
		float roughness = surf.filteredClearcoatRoughness;
		vec3 halfVector = ggxDirection(
			wo,
			vec2( roughness ),
			rand2( 14 )
		);

		// apply to new ray by reflecting off the new normal
		return - reflect( wo, halfVector );

	}

	// sheen
	vec3 sheenColor( vec3 wo, vec3 wi, vec3 wh, SurfaceRecord surf ) {

		float cosThetaO = saturateCos( wo.z );
		float cosThetaI = saturateCos( wi.z );
		float cosThetaH = wh.z;

		float D = velvetD( cosThetaH, surf.sheenRoughness );
		float G = velvetG( cosThetaO, cosThetaI, surf.sheenRoughness );

		// See equation (1) in http://www.aconty.com/pdf/s2017_pbs_imageworks_sheen.pdf
		vec3 color = surf.sheenColor;
		color *= D * G / ( 4.0 * abs( cosThetaO * cosThetaI ) );
		color *= wi.z;

		return color;

	}

	// bsdf
	void getLobeWeights(
		vec3 wo, vec3 wi, vec3 wh, vec3 clearcoatWo, SurfaceRecord surf,
		inout float diffuseWeight, inout float specularWeight, inout float transmissionWeight, inout float clearcoatWeight
	) {

		float metalness = surf.metalness;
		float transmission = surf.transmission;
		// float fEstimate = evaluateFresnelWeight( dot( wo, wh ), surf.eta, surf.f0 );
		float fEstimate = disneyFresnel( wo, wi, wh, surf.f0, surf.eta, surf.metalness );

		float transSpecularProb = mix( max( 0.25, fEstimate ), 1.0, metalness );
		float diffSpecularProb = 0.5 + 0.5 * metalness;

		diffuseWeight = ( 1.0 - transmission ) * ( 1.0 - diffSpecularProb );
		specularWeight = transmission * transSpecularProb + ( 1.0 - transmission ) * diffSpecularProb;
		transmissionWeight = transmission * ( 1.0 - transSpecularProb );
		clearcoatWeight = surf.clearcoat * schlickFresnel( clearcoatWo.z, 0.04 );

		float totalWeight = diffuseWeight + specularWeight + transmissionWeight + clearcoatWeight;
		diffuseWeight /= totalWeight;
		specularWeight /= totalWeight;
		transmissionWeight /= totalWeight;
		clearcoatWeight /= totalWeight;
	}

	float bsdfEval(
		vec3 wo, vec3 clearcoatWo, vec3 wi, vec3 clearcoatWi, SurfaceRecord surf,
		float diffuseWeight, float specularWeight, float transmissionWeight, float clearcoatWeight, inout float specularPdf, inout vec3 color
	) {

		float metalness = surf.metalness;
		float transmission = surf.transmission;

		float spdf = 0.0;
		float dpdf = 0.0;
		float tpdf = 0.0;
		float cpdf = 0.0;
		color = vec3( 0.0 );

		vec3 halfVector = getHalfVector( wi, wo, surf.eta );

		// diffuse
		if ( diffuseWeight > 0.0 && wi.z > 0.0 ) {

			dpdf = diffuseEval( wo, wi, halfVector, surf, color );
			color *= 1.0 - surf.transmission;

		}

		// ggx specular
		if ( specularWeight > 0.0 && wi.z > 0.0 ) {

			vec3 outColor;
			spdf = specularEval( wo, wi, getHalfVector( wi, wo ), surf, outColor );
			color += outColor;

		}

		// transmission
		if ( transmissionWeight > 0.0 && wi.z < 0.0 ) {

			tpdf = transmissionEval( wo, wi, halfVector, surf, color );

		}

		// sheen
		color *= mix( 1.0, sheenAlbedoScaling( wo, wi, surf ), surf.sheen );
		color += sheenColor( wo, wi, halfVector, surf ) * surf.sheen;

		// clearcoat
		if ( clearcoatWi.z >= 0.0 && clearcoatWeight > 0.0 ) {

			vec3 clearcoatHalfVector = getHalfVector( clearcoatWo, clearcoatWi );
			cpdf = clearcoatEval( clearcoatWo, clearcoatWi, clearcoatHalfVector, surf, color );

		}

		float pdf =
			dpdf * diffuseWeight
			+ spdf * specularWeight
			+ tpdf * transmissionWeight
			+ cpdf * clearcoatWeight;

		// retrieve specular rays for the shadows flag
		specularPdf = spdf * specularWeight + cpdf * clearcoatWeight;

		return pdf;

	}

	float bsdfResult( vec3 worldWo, vec3 worldWi, SurfaceRecord surf, inout vec3 color ) {

		if ( surf.volumeParticle ) {

			color = surf.color / ( 4.0 * PI );
			return 1.0 / ( 4.0 * PI );

		}

		vec3 wo = normalize( surf.normalInvBasis * worldWo );
		vec3 wi = normalize( surf.normalInvBasis * worldWi );

		vec3 clearcoatWo = normalize( surf.clearcoatInvBasis * worldWo );
		vec3 clearcoatWi = normalize( surf.clearcoatInvBasis * worldWi );

		vec3 wh = getHalfVector( wo, wi, surf.eta );
		float diffuseWeight;
		float specularWeight;
		float transmissionWeight;
		float clearcoatWeight;
		getLobeWeights( wo, wi, wh, clearcoatWo, surf, diffuseWeight, specularWeight, transmissionWeight, clearcoatWeight );

		float specularPdf;
		return bsdfEval( wo, clearcoatWo, wi, clearcoatWi, surf, diffuseWeight, specularWeight, transmissionWeight, clearcoatWeight, specularPdf, color );

	}

	ScatterRecord bsdfSample( vec3 worldWo, SurfaceRecord surf ) {

		if ( surf.volumeParticle ) {

			ScatterRecord sampleRec;
			sampleRec.specularPdf = 0.0;
			sampleRec.pdf = 1.0 / ( 4.0 * PI );
			sampleRec.direction = sampleSphere( rand2( 16 ) );
			sampleRec.color = surf.color / ( 4.0 * PI );
			return sampleRec;

		}

		vec3 wo = normalize( surf.normalInvBasis * worldWo );
		vec3 clearcoatWo = normalize( surf.clearcoatInvBasis * worldWo );
		mat3 normalBasis = surf.normalBasis;
		mat3 invBasis = surf.normalInvBasis;
		mat3 clearcoatNormalBasis = surf.clearcoatBasis;
		mat3 clearcoatInvBasis = surf.clearcoatInvBasis;

		float diffuseWeight;
		float specularWeight;
		float transmissionWeight;
		float clearcoatWeight;
		// using normal and basically-reflected ray since we don't have proper half vector here
		getLobeWeights( wo, wo, vec3( 0, 0, 1 ), clearcoatWo, surf, diffuseWeight, specularWeight, transmissionWeight, clearcoatWeight );

		float pdf[4];
		pdf[0] = diffuseWeight;
		pdf[1] = specularWeight;
		pdf[2] = transmissionWeight;
		pdf[3] = clearcoatWeight;

		float cdf[4];
		cdf[0] = pdf[0];
		cdf[1] = pdf[1] + cdf[0];
		cdf[2] = pdf[2] + cdf[1];
		cdf[3] = pdf[3] + cdf[2];

		if( cdf[3] != 0.0 ) {

			float invMaxCdf = 1.0 / cdf[3];
			cdf[0] *= invMaxCdf;
			cdf[1] *= invMaxCdf;
			cdf[2] *= invMaxCdf;
			cdf[3] *= invMaxCdf;

		} else {

			cdf[0] = 1.0;
			cdf[1] = 0.0;
			cdf[2] = 0.0;
			cdf[3] = 0.0;

		}

		vec3 wi;
		vec3 clearcoatWi;

		float r = rand( 15 );
		if ( r <= cdf[0] ) { // diffuse

			wi = diffuseDirection( wo, surf );
			clearcoatWi = normalize( clearcoatInvBasis * normalize( normalBasis * wi ) );

		} else if ( r <= cdf[1] ) { // specular

			wi = specularDirection( wo, surf );
			clearcoatWi = normalize( clearcoatInvBasis * normalize( normalBasis * wi ) );

		} else if ( r <= cdf[2] ) { // transmission / refraction

			wi = transmissionDirection( wo, surf );
			clearcoatWi = normalize( clearcoatInvBasis * normalize( normalBasis * wi ) );

		} else if ( r <= cdf[3] ) { // clearcoat

			clearcoatWi = clearcoatDirection( clearcoatWo, surf );
			wi = normalize( invBasis * normalize( clearcoatNormalBasis * clearcoatWi ) );

		}

		ScatterRecord result;
		result.pdf = bsdfEval( wo, clearcoatWo, wi, clearcoatWi, surf, diffuseWeight, specularWeight, transmissionWeight, clearcoatWeight, result.specularPdf, result.color );
		result.direction = normalize( surf.normalBasis * wi );

		return result;

	}

`;var Pn=`

	// returns the hit distance given the material density
	float intersectFogVolume( Material material, float u ) {

		// https://raytracing.github.io/books/RayTracingTheNextWeek.html#volumes/constantdensitymediums
		return material.opacity == 0.0 ? INFINITY : ( - 1.0 / material.opacity ) * log( u );

	}

	ScatterRecord sampleFogVolume( SurfaceRecord surf, vec2 uv ) {

		ScatterRecord sampleRec;
		sampleRec.specularPdf = 0.0;
		sampleRec.pdf = 1.0 / ( 2.0 * PI );
		sampleRec.direction = sampleSphere( uv );
		sampleRec.color = surf.color;
		return sampleRec;

	}

`;var Fn=`

	// The GGX functions provide sampling and distribution information for normals as output so
	// in order to get probability of scatter direction the half vector must be computed and provided.
	// [0] https://www.cs.cornell.edu/~srm/publications/EGSR07-btdf.pdf
	// [1] https://hal.archives-ouvertes.fr/hal-01509746/document
	// [2] http://jcgt.org/published/0007/04/01/
	// [4] http://jcgt.org/published/0003/02/03/

	// trowbridge-reitz === GGX === GTR

	vec3 ggxDirection( vec3 incidentDir, vec2 roughness, vec2 uv ) {

		// TODO: try GGXVNDF implementation from reference [2], here. Needs to update ggxDistribution
		// function below, as well

		// Implementation from reference [1]
		// stretch view
		vec3 V = normalize( vec3( roughness * incidentDir.xy, incidentDir.z ) );

		// orthonormal basis
		vec3 T1 = ( V.z < 0.9999 ) ? normalize( cross( V, vec3( 0.0, 0.0, 1.0 ) ) ) : vec3( 1.0, 0.0, 0.0 );
		vec3 T2 = cross( T1, V );

		// sample point with polar coordinates (r, phi)
		float a = 1.0 / ( 1.0 + V.z );
		float r = sqrt( uv.x );
		float phi = ( uv.y < a ) ? uv.y / a * PI : PI + ( uv.y - a ) / ( 1.0 - a ) * PI;
		float P1 = r * cos( phi );
		float P2 = r * sin( phi ) * ( ( uv.y < a ) ? 1.0 : V.z );

		// compute normal
		vec3 N = P1 * T1 + P2 * T2 + V * sqrt( max( 0.0, 1.0 - P1 * P1 - P2 * P2 ) );

		// unstretch
		N = normalize( vec3( roughness * N.xy, max( 0.0, N.z ) ) );

		return N;

	}

	// Below are PDF and related functions for use in a Monte Carlo path tracer
	// as specified in Appendix B of the following paper
	// See equation (34) from reference [0]
	float ggxLamda( float theta, float roughness ) {

		float tanTheta = tan( theta );
		float tanTheta2 = tanTheta * tanTheta;
		float alpha2 = roughness * roughness;

		float numerator = - 1.0 + sqrt( 1.0 + alpha2 * tanTheta2 );
		return numerator / 2.0;

	}

	// See equation (34) from reference [0]
	float ggxShadowMaskG1( float theta, float roughness ) {

		return 1.0 / ( 1.0 + ggxLamda( theta, roughness ) );

	}

	// See equation (125) from reference [4]
	float ggxShadowMaskG2( vec3 wi, vec3 wo, float roughness ) {

		float incidentTheta = acos( wi.z );
		float scatterTheta = acos( wo.z );
		return 1.0 / ( 1.0 + ggxLamda( incidentTheta, roughness ) + ggxLamda( scatterTheta, roughness ) );

	}

	// See equation (33) from reference [0]
	float ggxDistribution( vec3 halfVector, float roughness ) {

		float a2 = roughness * roughness;
		a2 = max( EPSILON, a2 );
		float cosTheta = halfVector.z;
		float cosTheta4 = pow( cosTheta, 4.0 );

		if ( cosTheta == 0.0 ) return 0.0;

		float theta = acosSafe( halfVector.z );
		float tanTheta = tan( theta );
		float tanTheta2 = pow( tanTheta, 2.0 );

		float denom = PI * cosTheta4 * pow( a2 + tanTheta2, 2.0 );
		return ( a2 / denom );

	}

	// See equation (3) from reference [2]
	float ggxPDF( vec3 wi, vec3 halfVector, float roughness ) {

		float incidentTheta = acos( wi.z );
		float D = ggxDistribution( halfVector, roughness );
		float G1 = ggxShadowMaskG1( incidentTheta, roughness );

		return D * G1 * max( 0.0, dot( wi, halfVector ) ) / wi.z;

	}

`;var Cn=`

	// XYZ to sRGB color space
	const mat3 XYZ_TO_REC709 = mat3(
		3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);

	vec3 fresnel0ToIor( vec3 fresnel0 ) {

		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );

	}

	// Conversion FO/IOR
	vec3 iorToFresnel0( vec3 transmittedIor, float incidentIor ) {

		return square( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );

	}

	// ior is a value between 1.0 and 3.0. 1.0 is air interface
	float iorToFresnel0( float transmittedIor, float incidentIor ) {

		return square( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ) );

	}

	// Fresnel equations for dielectric/dielectric interfaces. See https://belcour.github.io/blog/research/2017/05/01/brdf-thin-film.html
	vec3 evalSensitivity( float OPD, vec3 shift ) {

		float phase = 2.0 * PI * OPD * 1.0e-9;

		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );

		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - square( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * square( phase ) );
		xyz /= 1.0685e-7;

		vec3 srgb = XYZ_TO_REC709 * xyz;
		return srgb;

	}

	// See Section 4. Analytic Spectral Integration, A Practical Extension to Microfacet Theory for the Modeling of Varying Iridescence, https://hal.archives-ouvertes.fr/hal-01518344/document
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {

		vec3 I;

		// Force iridescenceIor -> outsideIOR when thinFilmThickness -> 0.0
		float iridescenceIor = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );

		// Evaluate the cosTheta on the base layer (Snell law)
		float sinTheta2Sq = square( outsideIOR / iridescenceIor ) * ( 1.0 - square( cosTheta1 ) );

		// Handle TIR:
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {

			return vec3( 1.0 );

		}

		float cosTheta2 = sqrt( cosTheta2Sq );

		// First interface
		float R0 = iorToFresnel0( iridescenceIor, outsideIOR );
		float R12 = schlickFresnel( cosTheta1, R0 );
		float R21 = R12;
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIor < outsideIOR ) {

			phi12 = PI;

		}

		float phi21 = PI - phi12;

		// Second interface
		vec3 baseIOR = fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) ); // guard against 1.0
		vec3 R1 = iorToFresnel0( baseIOR, iridescenceIor );
		vec3 R23 = schlickFresnel( cosTheta2, R1 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[0] < iridescenceIor ) {

			phi23[ 0 ] = PI;

		}

		if ( baseIOR[1] < iridescenceIor ) {

			phi23[ 1 ] = PI;

		}

		if ( baseIOR[2] < iridescenceIor ) {

			phi23[ 2 ] = PI;

		}

		// Phase shift
		float OPD = 2.0 * iridescenceIor * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;

		// Compound terms
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = square( T121 ) * R23 / ( vec3( 1.0 ) - R123 );

		// Reflectance term for m = 0 (DC term amplitude)
		vec3 C0 = R12 + Rs;
		I = C0;

		// Reflectance term for m > 0 (pairs of diracs)
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {

			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;

		}

		// Since out of gamut colors might be produced, negative color values are clamped to 0.
		return max( I, vec3( 0.0 ) );

	}

`;var Dn=`

	// See equation (2) in http://www.aconty.com/pdf/s2017_pbs_imageworks_sheen.pdf
	float velvetD( float cosThetaH, float roughness ) {

		float alpha = max( roughness, 0.07 );
		alpha = alpha * alpha;

		float invAlpha = 1.0 / alpha;

		float sqrCosThetaH = cosThetaH * cosThetaH;
		float sinThetaH = max( 1.0 - sqrCosThetaH, 0.001 );

		return ( 2.0 + invAlpha ) * pow( sinThetaH, 0.5 * invAlpha ) / ( 2.0 * PI );

	}

	float velvetParamsInterpolate( int i, float oneMinusAlphaSquared ) {

		const float p0[5] = float[5]( 25.3245, 3.32435, 0.16801, -1.27393, -4.85967 );
		const float p1[5] = float[5]( 21.5473, 3.82987, 0.19823, -1.97760, -4.32054 );

		return mix( p1[i], p0[i], oneMinusAlphaSquared );

	}

	float velvetL( float x, float alpha ) {

		float oneMinusAlpha = 1.0 - alpha;
		float oneMinusAlphaSquared = oneMinusAlpha * oneMinusAlpha;

		float a = velvetParamsInterpolate( 0, oneMinusAlphaSquared );
		float b = velvetParamsInterpolate( 1, oneMinusAlphaSquared );
		float c = velvetParamsInterpolate( 2, oneMinusAlphaSquared );
		float d = velvetParamsInterpolate( 3, oneMinusAlphaSquared );
		float e = velvetParamsInterpolate( 4, oneMinusAlphaSquared );

		return a / ( 1.0 + b * pow( abs( x ), c ) ) + d * x + e;

	}

	// See equation (3) in http://www.aconty.com/pdf/s2017_pbs_imageworks_sheen.pdf
	float velvetLambda( float cosTheta, float alpha ) {

		return abs( cosTheta ) < 0.5 ? exp( velvetL( cosTheta, alpha ) ) : exp( 2.0 * velvetL( 0.5, alpha ) - velvetL( 1.0 - cosTheta, alpha ) );

	}

	// See Section 3, Shadowing Term, in http://www.aconty.com/pdf/s2017_pbs_imageworks_sheen.pdf
	float velvetG( float cosThetaO, float cosThetaI, float roughness ) {

		float alpha = max( roughness, 0.07 );
		alpha = alpha * alpha;

		return 1.0 / ( 1.0 + velvetLambda( cosThetaO, alpha ) + velvetLambda( cosThetaI, alpha ) );

	}

	float directionalAlbedoSheen( float cosTheta, float alpha ) {

		cosTheta = saturate( cosTheta );

		float c = 1.0 - cosTheta;
		float c3 = c * c * c;

		return 0.65584461 * c3 + 1.0 / ( 4.16526551 + exp( -7.97291361 * sqrt( alpha ) + 6.33516894 ) );

	}

	float sheenAlbedoScaling( vec3 wo, vec3 wi, SurfaceRecord surf ) {

		float alpha = max( surf.sheenRoughness, 0.07 );
		alpha = alpha * alpha;

		float maxSheenColor = max( max( surf.sheenColor.r, surf.sheenColor.g ), surf.sheenColor.b );

		float eWo = directionalAlbedoSheen( saturateCos( wo.z ), alpha );
		float eWi = directionalAlbedoSheen( saturateCos( wi.z ), alpha );

		return min( 1.0 - maxSheenColor * eWo, 1.0 - maxSheenColor * eWi );

	}

	// See Section 5, Layering, in http://www.aconty.com/pdf/s2017_pbs_imageworks_sheen.pdf
	float sheenAlbedoScaling( vec3 wo, SurfaceRecord surf ) {

		float alpha = max( surf.sheenRoughness, 0.07 );
		alpha = alpha * alpha;

		float maxSheenColor = max( max( surf.sheenColor.r, surf.sheenColor.g ), surf.sheenColor.b );

		float eWo = directionalAlbedoSheen( saturateCos( wo.z ), alpha );

		return 1.0 - maxSheenColor * eWo;

	}

`;var Bn=`

#ifndef FOG_CHECK_ITERATIONS
#define FOG_CHECK_ITERATIONS 30
#endif

// returns whether the given material is a fog material or not
bool isMaterialFogVolume( sampler2D materials, uint materialIndex ) {

	uint i = materialIndex * uint( MATERIAL_PIXELS );
	vec4 s14 = texelFetch1D( materials, i + 14u );
	return bool( int( s14.b ) & 4 );

}

// returns true if we're within the first fog volume we hit
bool bvhIntersectFogVolumeHit(
	vec3 rayOrigin, vec3 rayDirection,
	usampler2D materialIndexAttribute, sampler2D materials,
	inout Material material
) {

	material.fogVolume = false;

	for ( int i = 0; i < FOG_CHECK_ITERATIONS; i ++ ) {

		// find nearest hit
		uvec4 faceIndices = uvec4( 0u );
		vec3 faceNormal = vec3( 0.0, 0.0, 1.0 );
		vec3 barycoord = vec3( 0.0 );
		float side = 1.0;
		float dist = 0.0;
		bool hit = bvhIntersectFirstHit( bvh, rayOrigin, rayDirection, faceIndices, faceNormal, barycoord, side, dist );
		if ( hit ) {

			// if it's a fog volume return whether we hit the front or back face
			uint materialIndex = uTexelFetch1D( materialIndexAttribute, faceIndices.x ).r;
			if ( isMaterialFogVolume( materials, materialIndex ) ) {

				material = readMaterialInfo( materials, materialIndex );
				return side == - 1.0;

			} else {

				// move the ray forward
				rayOrigin = stepRayOrigin( rayOrigin, rayDirection, - faceNormal, dist );

			}

		} else {

			return false;

		}

	}

	return false;

}

`;var En=`

	// step through multiple surface hits and accumulate color attenuation based on transmissive surfaces
	// returns true if a solid surface was hit
	bool attenuateHit(
		RenderState state,
		Ray ray, float rayDist,
		out vec3 color
	) {

		// store the original bounce index so we can reset it after
		uint originalBounceIndex = sobolBounceIndex;

		int traversals = state.traversals;
		int transmissiveTraversals = state.transmissiveTraversals;
		bool isShadowRay = state.isShadowRay;
		Material fogMaterial = state.fogMaterial;

		vec3 startPoint = ray.origin;

		// hit results
		SurfaceHit surfaceHit;

		color = vec3( 1.0 );

		bool result = true;
		for ( int i = 0; i < traversals; i ++ ) {

			sobolBounceIndex ++;

			int hitType = traceScene( ray, fogMaterial, surfaceHit );

			if ( hitType == FOG_HIT ) {

				result = true;
				break;

			} else if ( hitType == SURFACE_HIT ) {

				float totalDist = distance( startPoint, ray.origin + ray.direction * surfaceHit.dist );
				if ( totalDist > rayDist ) {

					result = false;
					break;

				}

				// TODO: attenuate the contribution based on the PDF of the resulting ray including refraction values
				// Should be able to work using the material BSDF functions which will take into account specularity, etc.
				// TODO: should we account for emissive surfaces here?

				uint materialIndex = uTexelFetch1D( materialIndexAttribute, surfaceHit.faceIndices.x ).r;
				Material material = readMaterialInfo( materials, materialIndex );

				// adjust the ray to the new surface
				bool isEntering = surfaceHit.side == 1.0;
				ray.origin = stepRayOrigin( ray.origin, ray.direction, - surfaceHit.faceNormal, surfaceHit.dist );

				#if FEATURE_FOG

				if ( material.fogVolume ) {

					fogMaterial = material;
					fogMaterial.fogVolume = surfaceHit.side == 1.0;
					i -= sign( transmissiveTraversals );
					transmissiveTraversals --;
					continue;

				}

				#endif

				if ( ! material.castShadow && isShadowRay ) {

					continue;

				}

				vec2 uv = textureSampleBarycoord( attributesArray, ATTR_UV, surfaceHit.barycoord, surfaceHit.faceIndices.xyz ).xy;
				vec4 vertexColor = textureSampleBarycoord( attributesArray, ATTR_COLOR, surfaceHit.barycoord, surfaceHit.faceIndices.xyz );

				// albedo
				vec4 albedo = vec4( material.color, material.opacity );
				if ( material.map != - 1 ) {

					vec3 uvPrime = material.mapTransform * vec3( uv, 1 );
					albedo *= texture2D( textures, vec3( uvPrime.xy, material.map ) );

				}

				if ( material.vertexColors ) {

					albedo *= vertexColor;

				}

				// alphaMap
				if ( material.alphaMap != - 1 ) {

					vec3 uvPrime = material.alphaMapTransform * vec3( uv, 1 );
					albedo.a *= texture2D( textures, vec3( uvPrime.xy, material.alphaMap ) ).x;

				}

				// transmission
				float transmission = material.transmission;
				if ( material.transmissionMap != - 1 ) {

					vec3 uvPrime = material.transmissionMapTransform * vec3( uv, 1 );
					transmission *= texture2D( textures, vec3( uvPrime.xy, material.transmissionMap ) ).r;

				}

				// metalness
				float metalness = material.metalness;
				if ( material.metalnessMap != - 1 ) {

					vec3 uvPrime = material.metalnessMapTransform * vec3( uv, 1 );
					metalness *= texture2D( textures, vec3( uvPrime.xy, material.metalnessMap ) ).b;

				}

				float alphaTest = material.alphaTest;
				bool useAlphaTest = alphaTest != 0.0;
				float transmissionFactor = ( 1.0 - metalness ) * transmission;
				if (
					transmissionFactor < rand( 9 ) && ! (
						// material sidedness
						material.side != 0.0 && surfaceHit.side == material.side

						// alpha test
						|| useAlphaTest && albedo.a < alphaTest

						// opacity
						|| material.transparent && ! useAlphaTest && albedo.a < rand( 10 )
					)
				) {

					result = true;
					break;

				}

				if ( surfaceHit.side == 1.0 && isEntering ) {

					// only attenuate by surface color on the way in
					color *= mix( vec3( 1.0 ), albedo.rgb, transmissionFactor );

				} else if ( surfaceHit.side == - 1.0 ) {

					// attenuate by medium once we hit the opposite side of the model
					color *= transmissionAttenuation( surfaceHit.dist, material.attenuationColor, material.attenuationDistance );

				}

				bool isTransmissiveRay = dot( ray.direction, surfaceHit.faceNormal * surfaceHit.side ) < 0.0;
				if ( ( isTransmissiveRay || isEntering ) && transmissiveTraversals > 0 ) {

					i -= sign( transmissiveTraversals );
					transmissiveTraversals --;

				}

			} else {

				result = false;
				break;

			}

		}

		// reset the bounce index
		sobolBounceIndex = originalBounceIndex;
		return result;

	}

`;var Ln=`

	vec3 ndcToRayOrigin( vec2 coord ) {

		vec4 rayOrigin4 = cameraWorldMatrix * invProjectionMatrix * vec4( coord, - 1.0, 1.0 );
		return rayOrigin4.xyz / rayOrigin4.w;
	}

	Ray getCameraRay() {

		vec2 ssd = vec2( 1.0 ) / resolution;

		// Jitter the camera ray by finding a uv coordinate at a random sample
		// around this pixel's UV coordinate for AA
		vec2 ruv = rand2( 0 );
		vec2 jitteredUv = vUv + vec2( tentFilter( ruv.x ) * ssd.x, tentFilter( ruv.y ) * ssd.y );
		Ray ray;

		#if CAMERA_TYPE == 2

			// Equirectangular projection
			vec4 rayDirection4 = vec4( equirectUvToDirection( jitteredUv ), 0.0 );
			vec4 rayOrigin4 = vec4( 0.0, 0.0, 0.0, 1.0 );

			rayDirection4 = cameraWorldMatrix * rayDirection4;
			rayOrigin4 = cameraWorldMatrix * rayOrigin4;

			ray.direction = normalize( rayDirection4.xyz );
			ray.origin = rayOrigin4.xyz / rayOrigin4.w;

		#else

			// get [- 1, 1] normalized device coordinates
			vec2 ndc = 2.0 * jitteredUv - vec2( 1.0 );
			ray.origin = ndcToRayOrigin( ndc );

			#if CAMERA_TYPE == 1

				// Orthographic projection
				ray.direction = ( cameraWorldMatrix * vec4( 0.0, 0.0, - 1.0, 0.0 ) ).xyz;
				ray.direction = normalize( ray.direction );

			#else

				// Perspective projection
				ray.direction = normalize( mat3( cameraWorldMatrix ) * ( invProjectionMatrix * vec4( ndc, 0.0, 1.0 ) ).xyz );

			#endif

		#endif

		#if FEATURE_DOF
		{

			// depth of field
			vec3 focalPoint = ray.origin + normalize( ray.direction ) * physicalCamera.focusDistance;

			// get the aperture sample
			// if blades === 0 then we assume a circle
			vec3 shapeUVW= rand3( 1 );
			int blades = physicalCamera.apertureBlades;
			float anamorphicRatio = physicalCamera.anamorphicRatio;
			vec2 apertureSample = sampleAperture( blades, shapeUVW );
			apertureSample *= physicalCamera.bokehSize * 0.5 * 1e-3;

			// rotate the aperture shape
			apertureSample =
				rotateVector( apertureSample, physicalCamera.apertureRotation ) *
				saturate( vec2( anamorphicRatio, 1.0 / anamorphicRatio ) );

			// create the new ray
			ray.origin += ( cameraWorldMatrix * vec4( apertureSample, 0.0, 0.0 ) ).xyz;
			ray.direction = focalPoint - ray.origin;

		}
		#endif

		ray.direction = normalize( ray.direction );

		return ray;

	}

`;var Nn=`

	vec3 directLightContribution( vec3 worldWo, SurfaceRecord surf, RenderState state, vec3 rayOrigin ) {

		vec3 result = vec3( 0.0 );

		// uniformly pick a light or environment map
		if( lightsDenom != 0.0 && rand( 5 ) < float( lights.count ) / lightsDenom ) {

			// sample a light or environment
			LightRecord lightRec = randomLightSample( lights.tex, iesProfiles, lights.count, rayOrigin, rand3( 6 ) );

			bool isSampleBelowSurface = ! surf.volumeParticle && dot( surf.faceNormal, lightRec.direction ) < 0.0;
			if ( isSampleBelowSurface ) {

				lightRec.pdf = 0.0;

			}

			// check if a ray could even reach the light area
			Ray lightRay;
			lightRay.origin = rayOrigin;
			lightRay.direction = lightRec.direction;
			vec3 attenuatedColor;
			if (
				lightRec.pdf > 0.0 &&
				isDirectionValid( lightRec.direction, surf.normal, surf.faceNormal ) &&
				! attenuateHit( state, lightRay, lightRec.dist, attenuatedColor )
			) {

				// get the material pdf
				vec3 sampleColor;
				float lightMaterialPdf = bsdfResult( worldWo, lightRec.direction, surf, sampleColor );
				bool isValidSampleColor = all( greaterThanEqual( sampleColor, vec3( 0.0 ) ) );
				if ( lightMaterialPdf > 0.0 && isValidSampleColor ) {

					// weight the direct light contribution
					float lightPdf = lightRec.pdf / lightsDenom;
					float misWeight = lightRec.type == SPOT_LIGHT_TYPE || lightRec.type == DIR_LIGHT_TYPE || lightRec.type == POINT_LIGHT_TYPE ? 1.0 : misHeuristic( lightPdf, lightMaterialPdf );
					result = attenuatedColor * lightRec.emission * state.throughputColor * sampleColor * misWeight / lightPdf;

				}

			}

		} else if ( envMapInfo.totalSum != 0.0 && environmentIntensity != 0.0 ) {

			// find a sample in the environment map to include in the contribution
			vec3 envColor, envDirection;
			float envPdf = sampleEquirectProbability( rand2( 7 ), envColor, envDirection );
			envDirection = invEnvRotation3x3 * envDirection;

			// this env sampling is not set up for transmissive sampling and yields overly bright
			// results so we ignore the sample in this case.
			// TODO: this should be improved but how? The env samples could traverse a few layers?
			bool isSampleBelowSurface = ! surf.volumeParticle && dot( surf.faceNormal, envDirection ) < 0.0;
			if ( isSampleBelowSurface ) {

				envPdf = 0.0;

			}

			// check if a ray could even reach the surface
			Ray envRay;
			envRay.origin = rayOrigin;
			envRay.direction = envDirection;
			vec3 attenuatedColor;
			if (
				envPdf > 0.0 &&
				isDirectionValid( envDirection, surf.normal, surf.faceNormal ) &&
				! attenuateHit( state, envRay, INFINITY, attenuatedColor )
			) {

				// get the material pdf
				vec3 sampleColor;
				float envMaterialPdf = bsdfResult( worldWo, envDirection, surf, sampleColor );
				bool isValidSampleColor = all( greaterThanEqual( sampleColor, vec3( 0.0 ) ) );
				if ( envMaterialPdf > 0.0 && isValidSampleColor ) {

					// weight the direct light contribution
					envPdf /= lightsDenom;
					float misWeight = misHeuristic( envPdf, envMaterialPdf );
					result = attenuatedColor * environmentIntensity * envColor * state.throughputColor * sampleColor * misWeight / envPdf;

				}

			}

		}

		// Function changed to have a single return statement to potentially help with crashes on Mac OS.
		// See issue #470
		return result;

	}

`;var kn=`

	#define SKIP_SURFACE 0
	#define HIT_SURFACE 1
	int getSurfaceRecord(
		Material material, SurfaceHit surfaceHit, sampler2DArray attributesArray,
		float accumulatedRoughness,
		inout SurfaceRecord surf
	) {

		if ( material.fogVolume ) {

			vec3 normal = vec3( 0, 0, 1 );

			SurfaceRecord fogSurface;
			fogSurface.volumeParticle = true;
			fogSurface.color = material.color;
			fogSurface.emission = material.emissiveIntensity * material.emissive;
			fogSurface.normal = normal;
			fogSurface.faceNormal = normal;
			fogSurface.clearcoatNormal = normal;

			surf = fogSurface;
			return HIT_SURFACE;

		}

		// uv coord for textures
		vec2 uv = textureSampleBarycoord( attributesArray, ATTR_UV, surfaceHit.barycoord, surfaceHit.faceIndices.xyz ).xy;
		vec4 vertexColor = textureSampleBarycoord( attributesArray, ATTR_COLOR, surfaceHit.barycoord, surfaceHit.faceIndices.xyz );

		// albedo
		vec4 albedo = vec4( material.color, material.opacity );
		if ( material.map != - 1 ) {

			vec3 uvPrime = material.mapTransform * vec3( uv, 1 );
			albedo *= texture2D( textures, vec3( uvPrime.xy, material.map ) );

		}

		if ( material.vertexColors ) {

			albedo *= vertexColor;

		}

		// alphaMap
		if ( material.alphaMap != - 1 ) {

			vec3 uvPrime = material.alphaMapTransform * vec3( uv, 1 );
			albedo.a *= texture2D( textures, vec3( uvPrime.xy, material.alphaMap ) ).x;

		}

		// possibly skip this sample if it's transparent, alpha test is enabled, or we hit the wrong material side
		// and it's single sided.
		// - alpha test is disabled when it === 0
		// - the material sidedness test is complicated because we want light to pass through the back side but still
		// be able to see the front side. This boolean checks if the side we hit is the front side on the first ray
		// and we're rendering the other then we skip it. Do the opposite on subsequent bounces to get incoming light.
		float alphaTest = material.alphaTest;
		bool useAlphaTest = alphaTest != 0.0;
		if (
			// material sidedness
			material.side != 0.0 && surfaceHit.side != material.side

			// alpha test
			|| useAlphaTest && albedo.a < alphaTest

			// opacity
			|| material.transparent && ! useAlphaTest && albedo.a < rand( 3 )
		) {

			return SKIP_SURFACE;

		}

		// fetch the interpolated smooth normal
		vec3 normal = normalize( textureSampleBarycoord(
			attributesArray,
			ATTR_NORMAL,
			surfaceHit.barycoord,
			surfaceHit.faceIndices.xyz
		).xyz );

		// roughness
		float roughness = material.roughness;
		if ( material.roughnessMap != - 1 ) {

			vec3 uvPrime = material.roughnessMapTransform * vec3( uv, 1 );
			roughness *= texture2D( textures, vec3( uvPrime.xy, material.roughnessMap ) ).g;

		}

		// metalness
		float metalness = material.metalness;
		if ( material.metalnessMap != - 1 ) {

			vec3 uvPrime = material.metalnessMapTransform * vec3( uv, 1 );
			metalness *= texture2D( textures, vec3( uvPrime.xy, material.metalnessMap ) ).b;

		}

		// emission
		vec3 emission = material.emissiveIntensity * material.emissive;
		if ( material.emissiveMap != - 1 ) {

			vec3 uvPrime = material.emissiveMapTransform * vec3( uv, 1 );
			emission *= texture2D( textures, vec3( uvPrime.xy, material.emissiveMap ) ).xyz;

		}

		// transmission
		float transmission = material.transmission;
		if ( material.transmissionMap != - 1 ) {

			vec3 uvPrime = material.transmissionMapTransform * vec3( uv, 1 );
			transmission *= texture2D( textures, vec3( uvPrime.xy, material.transmissionMap ) ).r;

		}

		// normal
		if ( material.flatShading ) {

			// if we're rendering a flat shaded object then use the face normals - the face normal
			// is provided based on the side the ray hits the mesh so flip it to align with the
			// interpolated vertex normals.
			normal = surfaceHit.faceNormal * surfaceHit.side;

		}

		vec3 baseNormal = normal;
		if ( material.normalMap != - 1 ) {

			vec4 tangentSample = textureSampleBarycoord(
				attributesArray,
				ATTR_TANGENT,
				surfaceHit.barycoord,
				surfaceHit.faceIndices.xyz
			);

			// some provided tangents can be malformed (0, 0, 0) causing the normal to be degenerate
			// resulting in NaNs and slow path tracing.
			if ( length( tangentSample.xyz ) > 0.0 ) {

				vec3 tangent = normalize( tangentSample.xyz );
				vec3 bitangent = normalize( cross( normal, tangent ) * tangentSample.w );
				mat3 vTBN = mat3( tangent, bitangent, normal );

				vec3 uvPrime = material.normalMapTransform * vec3( uv, 1 );
				vec3 texNormal = texture2D( textures, vec3( uvPrime.xy, material.normalMap ) ).xyz * 2.0 - 1.0;
				texNormal.xy *= material.normalScale;
				normal = vTBN * texNormal;

			}

		}

		normal *= surfaceHit.side;

		// clearcoat
		float clearcoat = material.clearcoat;
		if ( material.clearcoatMap != - 1 ) {

			vec3 uvPrime = material.clearcoatMapTransform * vec3( uv, 1 );
			clearcoat *= texture2D( textures, vec3( uvPrime.xy, material.clearcoatMap ) ).r;

		}

		// clearcoatRoughness
		float clearcoatRoughness = material.clearcoatRoughness;
		if ( material.clearcoatRoughnessMap != - 1 ) {

			vec3 uvPrime = material.clearcoatRoughnessMapTransform * vec3( uv, 1 );
			clearcoatRoughness *= texture2D( textures, vec3( uvPrime.xy, material.clearcoatRoughnessMap ) ).g;

		}

		// clearcoatNormal
		vec3 clearcoatNormal = baseNormal;
		if ( material.clearcoatNormalMap != - 1 ) {

			vec4 tangentSample = textureSampleBarycoord(
				attributesArray,
				ATTR_TANGENT,
				surfaceHit.barycoord,
				surfaceHit.faceIndices.xyz
			);

			// some provided tangents can be malformed (0, 0, 0) causing the normal to be degenerate
			// resulting in NaNs and slow path tracing.
			if ( length( tangentSample.xyz ) > 0.0 ) {

				vec3 tangent = normalize( tangentSample.xyz );
				vec3 bitangent = normalize( cross( clearcoatNormal, tangent ) * tangentSample.w );
				mat3 vTBN = mat3( tangent, bitangent, clearcoatNormal );

				vec3 uvPrime = material.clearcoatNormalMapTransform * vec3( uv, 1 );
				vec3 texNormal = texture2D( textures, vec3( uvPrime.xy, material.clearcoatNormalMap ) ).xyz * 2.0 - 1.0;
				texNormal.xy *= material.clearcoatNormalScale;
				clearcoatNormal = vTBN * texNormal;

			}

		}

		clearcoatNormal *= surfaceHit.side;

		// sheenColor
		vec3 sheenColor = material.sheenColor;
		if ( material.sheenColorMap != - 1 ) {

			vec3 uvPrime = material.sheenColorMapTransform * vec3( uv, 1 );
			sheenColor *= texture2D( textures, vec3( uvPrime.xy, material.sheenColorMap ) ).rgb;

		}

		// sheenRoughness
		float sheenRoughness = material.sheenRoughness;
		if ( material.sheenRoughnessMap != - 1 ) {

			vec3 uvPrime = material.sheenRoughnessMapTransform * vec3( uv, 1 );
			sheenRoughness *= texture2D( textures, vec3( uvPrime.xy, material.sheenRoughnessMap ) ).a;

		}

		// iridescence
		float iridescence = material.iridescence;
		if ( material.iridescenceMap != - 1 ) {

			vec3 uvPrime = material.iridescenceMapTransform * vec3( uv, 1 );
			iridescence *= texture2D( textures, vec3( uvPrime.xy, material.iridescenceMap ) ).r;

		}

		// iridescence thickness
		float iridescenceThickness = material.iridescenceThicknessMaximum;
		if ( material.iridescenceThicknessMap != - 1 ) {

			vec3 uvPrime = material.iridescenceThicknessMapTransform * vec3( uv, 1 );
			float iridescenceThicknessSampled = texture2D( textures, vec3( uvPrime.xy, material.iridescenceThicknessMap ) ).g;
			iridescenceThickness = mix( material.iridescenceThicknessMinimum, material.iridescenceThicknessMaximum, iridescenceThicknessSampled );

		}

		iridescence = iridescenceThickness == 0.0 ? 0.0 : iridescence;

		// specular color
		vec3 specularColor = material.specularColor;
		if ( material.specularColorMap != - 1 ) {

			vec3 uvPrime = material.specularColorMapTransform * vec3( uv, 1 );
			specularColor *= texture2D( textures, vec3( uvPrime.xy, material.specularColorMap ) ).rgb;

		}

		// specular intensity
		float specularIntensity = material.specularIntensity;
		if ( material.specularIntensityMap != - 1 ) {

			vec3 uvPrime = material.specularIntensityMapTransform * vec3( uv, 1 );
			specularIntensity *= texture2D( textures, vec3( uvPrime.xy, material.specularIntensityMap ) ).a;

		}

		surf.volumeParticle = false;

		surf.faceNormal = surfaceHit.faceNormal;
		surf.normal = normal;

		surf.metalness = metalness;
		surf.color = albedo.rgb;
		surf.emission = emission;

		surf.ior = material.ior;
		surf.transmission = transmission;
		surf.thinFilm = material.thinFilm;
		surf.attenuationColor = material.attenuationColor;
		surf.attenuationDistance = material.attenuationDistance;

		surf.clearcoatNormal = clearcoatNormal;
		surf.clearcoat = clearcoat;

		surf.sheen = material.sheen;
		surf.sheenColor = sheenColor;

		surf.iridescence = iridescence;
		surf.iridescenceIor = material.iridescenceIor;
		surf.iridescenceThickness = iridescenceThickness;

		surf.specularColor = specularColor;
		surf.specularIntensity = specularIntensity;

		// apply perceptual roughness factor from gltf. sheen perceptual roughness is
		// applied by its brdf function
		// https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#microfacet-surfaces
		surf.roughness = roughness * roughness;
		surf.clearcoatRoughness = clearcoatRoughness * clearcoatRoughness;
		surf.sheenRoughness = sheenRoughness;

		// frontFace is used to determine transmissive properties and PDF. If no transmission is used
		// then we can just always assume this is a front face.
		surf.frontFace = surfaceHit.side == 1.0 || transmission == 0.0;
		surf.eta = material.thinFilm || surf.frontFace ? 1.0 / material.ior : material.ior;
		surf.f0 = iorRatioToF0( surf.eta );

		// Compute the filtered roughness value to use during specular reflection computations.
		// The accumulated roughness value is scaled by a user setting and a "magic value" of 5.0.
		// If we're exiting something transmissive then scale the factor down significantly so we can retain
		// sharp internal reflections
		surf.filteredRoughness = applyFilteredGlossy( surf.roughness, accumulatedRoughness );
		surf.filteredClearcoatRoughness = applyFilteredGlossy( surf.clearcoatRoughness, accumulatedRoughness );

		// get the normal frames
		surf.normalBasis = getBasisFromNormal( surf.normal );
		surf.normalInvBasis = inverse( surf.normalBasis );

		surf.clearcoatBasis = getBasisFromNormal( surf.clearcoatNormal );
		surf.clearcoatInvBasis = inverse( surf.clearcoatBasis );

		return HIT_SURFACE;

	}
`;var zn=`

	struct Ray {

		vec3 origin;
		vec3 direction;

	};

	struct SurfaceHit {

		uvec4 faceIndices;
		vec3 barycoord;
		vec3 faceNormal;
		float side;
		float dist;

	};

	struct RenderState {

		bool firstRay;
		bool transmissiveRay;
		bool isShadowRay;
		float accumulatedRoughness;
		int transmissiveTraversals;
		int traversals;
		uint depth;
		vec3 throughputColor;
		Material fogMaterial;

	};

	RenderState initRenderState() {

		RenderState result;
		result.firstRay = true;
		result.transmissiveRay = true;
		result.isShadowRay = false;
		result.accumulatedRoughness = 0.0;
		result.transmissiveTraversals = 0;
		result.traversals = 0;
		result.throughputColor = vec3( 1.0 );
		result.depth = 0u;
		result.fogMaterial.fogVolume = false;
		return result;

	}

`;var On=`

	#define NO_HIT 0
	#define SURFACE_HIT 1
	#define LIGHT_HIT 2
	#define FOG_HIT 3

	// Passing the global variable 'lights' into this function caused shader program errors.
	// So global variables like 'lights' and 'bvh' were moved out of the function parameters.
	// For more information, refer to: https://github.com/gkjohnson/three-gpu-pathtracer/pull/457
	int traceScene(
		Ray ray, Material fogMaterial, inout SurfaceHit surfaceHit
	) {

		int result = NO_HIT;
		bool hit = bvhIntersectFirstHit( bvh, ray.origin, ray.direction, surfaceHit.faceIndices, surfaceHit.faceNormal, surfaceHit.barycoord, surfaceHit.side, surfaceHit.dist );

		#if FEATURE_FOG

		if ( fogMaterial.fogVolume ) {

			// offset the distance so we don't run into issues with particles on the same surface
			// as other objects
			float particleDist = intersectFogVolume( fogMaterial, rand( 1 ) );
			if ( particleDist + RAY_OFFSET < surfaceHit.dist ) {

				surfaceHit.side = 1.0;
				surfaceHit.faceNormal = normalize( - ray.direction );
				surfaceHit.dist = particleDist;
				return FOG_HIT;

			}

		}

		#endif

		if ( hit ) {

			result = SURFACE_HIT;

		}

		return result;

	}

`;var br=class extends me{onBeforeRender(){this.setDefine("FEATURE_DOF",this.physicalCamera.bokehSize===0?0:1),this.setDefine("FEATURE_BACKGROUND_MAP",this.backgroundMap?1:0),this.setDefine("FEATURE_FOG",this.materials.features.isUsed("FOG")?1:0)}constructor(e){super({transparent:!0,depthWrite:!1,defines:{FEATURE_MIS:1,FEATURE_RUSSIAN_ROULETTE:1,FEATURE_DOF:1,FEATURE_BACKGROUND_MAP:0,FEATURE_FOG:1,RANDOM_TYPE:2,CAMERA_TYPE:0,DEBUG_MODE:0,ATTR_NORMAL:0,ATTR_TANGENT:1,ATTR_UV:2,ATTR_COLOR:3,MATERIAL_PIXELS:mr},uniforms:{resolution:{value:new Lc},opacity:{value:1},bounces:{value:10},transmissiveBounces:{value:10},filterGlossyFactor:{value:0},physicalCamera:{value:new or},cameraWorldMatrix:{value:new yr},invProjectionMatrix:{value:new yr},bvh:{value:new Vt},attributesArray:{value:new lr},materialIndexAttribute:{value:new We},materials:{value:new fr},textures:{value:new mt().texture},lights:{value:new ar},iesProfiles:{value:new mt(360,180,{type:Ec,wrapS:Hn,wrapT:Hn}).texture},environmentIntensity:{value:1},environmentRotation:{value:new yr},envMapInfo:{value:new sr},backgroundBlur:{value:0},backgroundMap:{value:null},backgroundAlpha:{value:1},backgroundIntensity:{value:1},backgroundRotation:{value:new yr},seed:{value:0},sobolTexture:{value:null},stratifiedTexture:{value:new pr},stratifiedOffsetTexture:{value:new vr(64,1)}},vertexShader:`

				varying vec2 vUv;
				void main() {

					vec4 mvPosition = vec4( position, 1.0 );
					mvPosition = modelViewMatrix * mvPosition;
					gl_Position = projectionMatrix * mvPosition;

					vUv = uv;

				}

			`,fragmentShader:`
				#define RAY_OFFSET 1e-4
				#define INFINITY 1e20

				precision highp isampler2D;
				precision highp usampler2D;
				precision highp sampler2DArray;
				vec4 envMapTexelToLinear( vec4 a ) { return a; }
				#include <common>

				// bvh intersection
				${be.common_functions}
				${be.bvh_struct_definitions}
				${be.bvh_ray_functions}

				// uniform structs
				${pn}
				${vn}
				${gn}
				${xn}
				${yn}

				// random
				#if RANDOM_TYPE == 2 	// Stratified List

					${Rn}

				#elif RANDOM_TYPE == 1 	// Sobol

					${gi}
					${tr}
					${qo}

					#define rand(v) sobol(v)
					#define rand2(v) sobol2(v)
					#define rand3(v) sobol3(v)
					#define rand4(v) sobol4(v)

				#else 					// PCG

				${gi}

					// Using the sobol functions seems to break the the compiler on MacOS
					// - specifically the "sobolReverseBits" function.
					uint sobolPixelIndex = 0u;
					uint sobolPathIndex = 0u;
					uint sobolBounceIndex = 0u;

					#define rand(v) pcgRand()
					#define rand2(v) pcgRand2()
					#define rand3(v) pcgRand3()
					#define rand4(v) pcgRand4()

				#endif

				// common
				${In}
				${Sn}
				${xr}
				${_n}
				${An}

				// environment
				uniform EquirectHdrInfo envMapInfo;
				uniform mat4 environmentRotation;
				uniform float environmentIntensity;

				// lighting
				uniform sampler2DArray iesProfiles;
				uniform LightsInfo lights;

				// background
				uniform float backgroundBlur;
				uniform float backgroundAlpha;
				#if FEATURE_BACKGROUND_MAP

				uniform sampler2D backgroundMap;
				uniform mat4 backgroundRotation;
				uniform float backgroundIntensity;

				#endif

				// camera
				uniform mat4 cameraWorldMatrix;
				uniform mat4 invProjectionMatrix;
				#if FEATURE_DOF

				uniform PhysicalCamera physicalCamera;

				#endif

				// geometry
				uniform sampler2DArray attributesArray;
				uniform usampler2D materialIndexAttribute;
				uniform sampler2D materials;
				uniform sampler2DArray textures;
				uniform BVH bvh;

				// path tracer
				uniform int bounces;
				uniform int transmissiveBounces;
				uniform float filterGlossyFactor;
				uniform int seed;

				// image
				uniform vec2 resolution;
				uniform float opacity;

				varying vec2 vUv;

				// globals
				mat3 envRotation3x3;
				mat3 invEnvRotation3x3;
				float lightsDenom;

				// sampling
				${wn}
				${bn}
				${Tn}

				${Bn}
				${Fn}
				${Dn}
				${Cn}
				${Pn}
				${Mn}

				float applyFilteredGlossy( float roughness, float accumulatedRoughness ) {

					return clamp(
						max(
							roughness,
							accumulatedRoughness * filterGlossyFactor * 5.0 ),
						0.0,
						1.0
					);

				}

				vec3 sampleBackground( vec3 direction, vec2 uv ) {

					vec3 sampleDir = sampleHemisphere( direction, uv ) * 0.5 * backgroundBlur;

					#if FEATURE_BACKGROUND_MAP

					sampleDir = normalize( mat3( backgroundRotation ) * direction + sampleDir );
					return backgroundIntensity * sampleEquirectColor( backgroundMap, sampleDir );

					#else

					sampleDir = normalize( envRotation3x3 * direction + sampleDir );
					return environmentIntensity * sampleEquirectColor( envMapInfo.map, sampleDir );

					#endif

				}

				${zn}
				${Ln}
				${On}
				${En}
				${Nn}
				${kn}

				void main() {

					// init
					rng_initialize( gl_FragCoord.xy, seed );
					sobolPixelIndex = ( uint( gl_FragCoord.x ) << 16 ) | uint( gl_FragCoord.y );
					sobolPathIndex = uint( seed );

					// get camera ray
					Ray ray = getCameraRay();

					// inverse environment rotation
					envRotation3x3 = mat3( environmentRotation );
					invEnvRotation3x3 = inverse( envRotation3x3 );
					lightsDenom =
						( environmentIntensity == 0.0 || envMapInfo.totalSum == 0.0 ) && lights.count != 0u ?
							float( lights.count ) :
							float( lights.count + 1u );

					// final color
					gl_FragColor = vec4( 0, 0, 0, 1 );

					// surface results
					SurfaceHit surfaceHit;
					ScatterRecord scatterRec;

					// path tracing state
					RenderState state = initRenderState();
					state.transmissiveTraversals = transmissiveBounces;
					#if FEATURE_FOG

					state.fogMaterial.fogVolume = bvhIntersectFogVolumeHit(
						ray.origin, - ray.direction,
						materialIndexAttribute, materials,
						state.fogMaterial
					);

					#endif

					for ( int i = 0; i < bounces; i ++ ) {

						sobolBounceIndex ++;

						state.depth ++;
						state.traversals = bounces - i;
						state.firstRay = i == 0 && state.transmissiveTraversals == transmissiveBounces;

						int hitType = traceScene( ray, state.fogMaterial, surfaceHit );

						// check if we intersect any lights and accumulate the light contribution
						// TODO: we can add support for light surface rendering in the else condition if we
						// add the ability to toggle visibility of the the light
						if ( ! state.firstRay && ! state.transmissiveRay ) {

							LightRecord lightRec;
							float lightDist = hitType == NO_HIT ? INFINITY : surfaceHit.dist;
							for ( uint i = 0u; i < lights.count; i ++ ) {

								if (
									intersectLightAtIndex( lights.tex, ray.origin, ray.direction, i, lightRec ) &&
									lightRec.dist < lightDist
								) {

									#if FEATURE_MIS

									// weight the contribution
									// NOTE: Only area lights are supported for forward sampling and can be hit
									float misWeight = misHeuristic( scatterRec.pdf, lightRec.pdf / lightsDenom );
									gl_FragColor.rgb += lightRec.emission * state.throughputColor * misWeight;

									#else

									gl_FragColor.rgb += lightRec.emission * state.throughputColor;

									#endif

								}

							}

						}

						if ( hitType == NO_HIT ) {

							if ( state.firstRay || state.transmissiveRay ) {

								gl_FragColor.rgb += sampleBackground( ray.direction, rand2( 2 ) ) * state.throughputColor;
								gl_FragColor.a = backgroundAlpha;

							} else {

								#if FEATURE_MIS

								// get the PDF of the hit envmap point
								vec3 envColor;
								float envPdf = sampleEquirect( envRotation3x3 * ray.direction, envColor );
								envPdf /= lightsDenom;

								// and weight the contribution
								float misWeight = misHeuristic( scatterRec.pdf, envPdf );
								gl_FragColor.rgb += environmentIntensity * envColor * state.throughputColor * misWeight;

								#else

								gl_FragColor.rgb +=
									environmentIntensity *
									sampleEquirectColor( envMapInfo.map, envRotation3x3 * ray.direction ) *
									state.throughputColor;

								#endif

							}
							break;

						}

						uint materialIndex = uTexelFetch1D( materialIndexAttribute, surfaceHit.faceIndices.x ).r;
						Material material = readMaterialInfo( materials, materialIndex );

						#if FEATURE_FOG

						if ( hitType == FOG_HIT ) {

							material = state.fogMaterial;
							state.accumulatedRoughness += 0.2;

						} else if ( material.fogVolume ) {

							state.fogMaterial = material;
							state.fogMaterial.fogVolume = surfaceHit.side == 1.0;

							ray.origin = stepRayOrigin( ray.origin, ray.direction, - surfaceHit.faceNormal, surfaceHit.dist );

							i -= sign( state.transmissiveTraversals );
							state.transmissiveTraversals -= sign( state.transmissiveTraversals );
							continue;

						}

						#endif

						// early out if this is a matte material
						if ( material.matte && state.firstRay ) {

							gl_FragColor = vec4( 0.0 );
							break;

						}

						// if we've determined that this is a shadow ray and we've hit an item with no shadow casting
						// then skip it
						if ( ! material.castShadow && state.isShadowRay ) {

							ray.origin = stepRayOrigin( ray.origin, ray.direction, - surfaceHit.faceNormal, surfaceHit.dist );
							continue;

						}

						SurfaceRecord surf;
						if (
							getSurfaceRecord(
								material, surfaceHit, attributesArray, state.accumulatedRoughness,
								surf
							) == SKIP_SURFACE
						) {

							// only allow a limited number of transparency discards otherwise we could
							// crash the context with too long a loop.
							i -= sign( state.transmissiveTraversals );
							state.transmissiveTraversals -= sign( state.transmissiveTraversals );

							ray.origin = stepRayOrigin( ray.origin, ray.direction, - surfaceHit.faceNormal, surfaceHit.dist );
							continue;

						}

						scatterRec = bsdfSample( - ray.direction, surf );
						state.isShadowRay = scatterRec.specularPdf < rand( 4 );

						bool isBelowSurface = ! surf.volumeParticle && dot( scatterRec.direction, surf.faceNormal ) < 0.0;
						vec3 hitPoint = stepRayOrigin( ray.origin, ray.direction, isBelowSurface ? - surf.faceNormal : surf.faceNormal, surfaceHit.dist );

						// next event estimation
						#if FEATURE_MIS

						gl_FragColor.rgb += directLightContribution( - ray.direction, surf, state, hitPoint );

						#endif

						// accumulate a roughness value to offset diffuse, specular, diffuse rays that have high contribution
						// to a single pixel resulting in fireflies
						// TODO: handle transmissive surfaces
						if ( ! surf.volumeParticle && ! isBelowSurface ) {

							// determine if this is a rough normal or not by checking how far off straight up it is
							vec3 halfVector = normalize( - ray.direction + scatterRec.direction );
							state.accumulatedRoughness += max(
								sin( acosApprox( dot( halfVector, surf.normal ) ) ),
								sin( acosApprox( dot( halfVector, surf.clearcoatNormal ) ) )
							);

							state.transmissiveRay = false;

						}

						// accumulate emissive color
						gl_FragColor.rgb += ( surf.emission * state.throughputColor );

						// skip the sample if our PDF or ray is impossible
						if ( scatterRec.pdf <= 0.0 || ! isDirectionValid( scatterRec.direction, surf.normal, surf.faceNormal ) ) {

							break;

						}

						// if we're bouncing around the inside a transmissive material then decrement
						// perform this separate from a bounce
						bool isTransmissiveRay = ! surf.volumeParticle && dot( scatterRec.direction, surf.faceNormal * surfaceHit.side ) < 0.0;
						if ( ( isTransmissiveRay || isBelowSurface ) && state.transmissiveTraversals > 0 ) {

							state.transmissiveTraversals --;
							i --;

						}

						//

						// handle throughput color transformation
						// attenuate the throughput color by the medium color
						if ( ! surf.frontFace ) {

							state.throughputColor *= transmissionAttenuation( surfaceHit.dist, surf.attenuationColor, surf.attenuationDistance );

						}

						#if FEATURE_RUSSIAN_ROULETTE

						// russian roulette path termination
						// https://www.arnoldrenderer.com/research/physically_based_shader_design_in_arnold.pdf
						uint minBounces = 3u;
						float depthProb = float( state.depth < minBounces );

						float rrProb = luminance( state.throughputColor * scatterRec.color / scatterRec.pdf );
						rrProb /= luminance( state.throughputColor );
						rrProb = sqrt( rrProb );
						rrProb = max( rrProb, depthProb );
						rrProb = min( rrProb, 1.0 );
						if ( rand( 8 ) > rrProb ) {

							break;

						}

						// perform sample clamping here to avoid bright pixels
						state.throughputColor *= min( 1.0 / rrProb, 20.0 );

						#endif

						// adjust the throughput and discard and exit if we find discard the sample if there are any NaNs
						state.throughputColor *= scatterRec.color / scatterRec.pdf;
						if ( any( isnan( state.throughputColor ) ) || any( isinf( state.throughputColor ) ) ) {

							break;

						}

						//

						// prepare for next ray
						ray.direction = scatterRec.direction;
						ray.origin = hitPoint;

					}

					gl_FragColor.a *= opacity;

					#if DEBUG_MODE == 1

					// output the number of rays checked in the path and number of
					// transmissive rays encountered.
					gl_FragColor.rgb = vec3(
						float( state.depth ),
						transmissiveBounces - state.transmissiveTraversals,
						0.0
					);
					gl_FragColor.a = 1.0;

					#endif

				}

			`}),this.setValues(e)}};function*Hc(){let{_renderer:o,_fsQuad:e,_blendQuad:t,_primaryTarget:r,_blendTargets:n,_sobolTarget:s,_subframe:i,alpha:c,material:l}=this,m=new bi,f=new bi,u=t.material,[a,d]=n;for(;;){c?(u.opacity=this._opacityFactor/(this.samples+1),l.blending=zc,l.opacity=1):(l.opacity=this._opacityFactor/(this.samples+1),l.blending=Oc);let[g,T,h,y]=i,v=r.width,p=r.height;l.resolution.set(v*h,p*y),l.sobolTexture=s.texture,l.stratifiedTexture.init(20,l.bounces+l.transmissiveBounces+5),l.stratifiedTexture.next(),l.seed++;let b=this.tiles.x||1,x=this.tiles.y||1,w=b*x,S=Math.ceil(v*h),I=Math.ceil(p*y),A=Math.floor(g*v),R=Math.floor(T*p),P=Math.ceil(S/b),_=Math.ceil(I/x);for(let M=0;M<x;M++)for(let F=0;F<b;F++){let C=o.getRenderTarget(),B=o.autoClear,V=o.getScissorTest();o.getScissor(m),o.getViewport(f);let X=F,Z=M;if(!this.stableTiles){let de=this._currentTile%(b*x);X=de%b,Z=~~(de/b),this._currentTile=de+1}let Re=x-Z-1;r.scissor.set(A+X*P,R+Re*_,Math.min(P,S-X*P),Math.min(_,I-Re*_)),r.viewport.set(A,R,S,I),o.setRenderTarget(r),o.setScissorTest(!0),o.autoClear=!1,e.render(o),o.setViewport(f),o.setScissor(m),o.setScissorTest(V),o.setRenderTarget(C),o.autoClear=B,c&&(u.target1=a.texture,u.target2=r.texture,o.setRenderTarget(d),t.render(o),o.setRenderTarget(C)),this.samples+=1/w,F===b-1&&M===x-1&&(this.samples=Math.round(this.samples)),yield}[a,d]=[d,a]}}var Un=new Nc,dt=class{get material(){return this._fsQuad.material}set material(e){this._fsQuad.material.removeEventListener("recompilation",this._compileFunction),e.addEventListener("recompilation",this._compileFunction),this._fsQuad.material=e}get target(){return this._alpha?this._blendTargets[1]:this._primaryTarget}set alpha(e){this._alpha!==e&&(e||(this._blendTargets[0].dispose(),this._blendTargets[1].dispose()),this._alpha=e,this.reset())}get alpha(){return this._alpha}get isCompiling(){return!!this._compilePromise}constructor(e){this.camera=null,this.tiles=new kc(3,3),this.stableNoise=!1,this.stableTiles=!0,this.samples=0,this._subframe=new bi(0,0,1,1),this._opacityFactor=1,this._renderer=e,this._alpha=!1,this._fsQuad=new j(new br),this._blendQuad=new j(new Zt),this._task=null,this._currentTile=0,this._compilePromise=null,this._sobolTarget=new rr().generate(e),this._primaryTarget=new yi(1,1,{format:vi,type:xi,magFilter:je,minFilter:je}),this._blendTargets=[new yi(1,1,{format:vi,type:xi,magFilter:je,minFilter:je}),new yi(1,1,{format:vi,type:xi,magFilter:je,minFilter:je})],this._compileFunction=()=>{let t=this.compileMaterial(this._fsQuad._mesh);t.then(()=>{this._compilePromise===t&&(this._compilePromise=null)}),this._compilePromise=t},this.material.addEventListener("recompilation",this._compileFunction)}compileMaterial(){return this._renderer.compileAsync(this._fsQuad._mesh)}setCamera(e){let{material:t}=this;t.cameraWorldMatrix.copy(e.matrixWorld),t.invProjectionMatrix.copy(e.projectionMatrixInverse),t.physicalCamera.updateFrom(e);let r=0;e.projectionMatrix.elements[15]>0&&(r=1),e.isEquirectCamera&&(r=2),t.setDefine("CAMERA_TYPE",r),this.camera=e}setSize(e,t){e=Math.ceil(e),t=Math.ceil(t),!(this._primaryTarget.width===e&&this._primaryTarget.height===t)&&(this._primaryTarget.setSize(e,t),this._blendTargets[0].setSize(e,t),this._blendTargets[1].setSize(e,t),this.reset())}getSize(e){e.x=this._primaryTarget.width,e.y=this._primaryTarget.height}dispose(){this._primaryTarget.dispose(),this._blendTargets[0].dispose(),this._blendTargets[1].dispose(),this._sobolTarget.dispose(),this._fsQuad.dispose(),this._blendQuad.dispose(),this._task=null}reset(){let{_renderer:e,_primaryTarget:t,_blendTargets:r}=this,n=e.getRenderTarget(),s=e.getClearAlpha();e.getClearColor(Un),e.setRenderTarget(t),e.setClearColor(0,0),e.clearColor(),e.setRenderTarget(r[0]),e.setClearColor(0,0),e.clearColor(),e.setRenderTarget(r[1]),e.setClearColor(0,0),e.clearColor(),e.setClearColor(Un,s),e.setRenderTarget(n),this.samples=0,this._task=null,this.material.stratifiedTexture.stableNoise=this.stableNoise,this.stableNoise&&(this.material.seed=0,this.material.stratifiedTexture.reset())}update(){this.material.onBeforeRender(),!this.isCompiling&&(this._task||(this._task=Hc.call(this)),this._task.next())}};import{Color as qn,Vector3 as Xc}from"three";import{ClampToEdgeWrapping as Uc,Color as Wc,DataTexture as Vc,EquirectangularReflectionMapping as Gc,LinearFilter as Wn,RepeatWrapping as qc,RGBAFormat as $c,Spherical as Yc,Vector2 as Gn,FloatType as jc}from"three";var Ie=new Gn,Vn=new Gn,Tr=new Yc,wr=new Wc,Sr=class extends Vc{constructor(e=512,t=512){super(new Float32Array(e*t*4),e,t,$c,jc,Gc,qc,Uc,Wn,Wn),this.generationCallback=null}update(){this.dispose(),this.needsUpdate=!0;let{data:e,width:t,height:r}=this.image;for(let n=0;n<t;n++)for(let s=0;s<r;s++){Vn.set(t,r),Ie.set(n/t,s/r),Ie.x-=.5,Ie.y=1-Ie.y,Tr.theta=Ie.x*2*Math.PI,Tr.phi=Ie.y*Math.PI,Tr.radius=1,this.generationCallback(Tr,Ie,Vn,wr);let c=4*(s*t+n);e[c+0]=wr.r,e[c+1]=wr.g,e[c+2]=wr.b,e[c+3]=1}}copy(e){return super.copy(e),this.generationCallback=e.generationCallback,this}};var $n=new Xc,pt=class extends Sr{constructor(e=512){super(e,e),this.topColor=new qn().set(16777215),this.bottomColor=new qn().set(0),this.exponent=2,this.generationCallback=(t,r,n,s)=>{$n.setFromSpherical(t);let i=$n.y*.5+.5;s.lerpColors(this.bottomColor,this.topColor,i**this.exponent)}}copy(e){return super.copy(e),this.topColor.copy(e.topColor),this.bottomColor.copy(e.bottomColor),this}};import{ShaderMaterial as Qc}from"three";var _r=class extends Qc{get map(){return this.uniforms.map.value}set map(e){this.uniforms.map.value=e}get opacity(){return this.uniforms.opacity.value}set opacity(e){this.uniforms&&(this.uniforms.opacity.value=e)}constructor(e){super({uniforms:{map:{value:null},opacity:{value:1}},vertexShader:`
				varying vec2 vUv;
				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}
			`,fragmentShader:`
				uniform sampler2D map;
				uniform float opacity;
				varying vec2 vUv;

				vec4 clampedTexelFatch( sampler2D map, ivec2 px, int lod ) {

					vec4 res = texelFetch( map, ivec2( px.x, px.y ), 0 );

					#if defined( TONE_MAPPING )

					res.xyz = toneMapping( res.xyz );

					#endif

			  		return linearToOutputTexel( res );

				}

				void main() {

					vec2 size = vec2( textureSize( map, 0 ) );
					vec2 pxUv = vUv * size;
					vec2 pxCurr = floor( pxUv );
					vec2 pxFrac = fract( pxUv ) - 0.5;
					vec2 pxOffset;
					pxOffset.x = pxFrac.x > 0.0 ? 1.0 : - 1.0;
					pxOffset.y = pxFrac.y > 0.0 ? 1.0 : - 1.0;

					vec2 pxNext = clamp( pxOffset + pxCurr, vec2( 0.0 ), size - 1.0 );
					vec2 alpha = abs( pxFrac );

					vec4 p1 = mix(
						clampedTexelFatch( map, ivec2( pxCurr.x, pxCurr.y ), 0 ),
						clampedTexelFatch( map, ivec2( pxNext.x, pxCurr.y ), 0 ),
						alpha.x
					);

					vec4 p2 = mix(
						clampedTexelFatch( map, ivec2( pxCurr.x, pxNext.y ), 0 ),
						clampedTexelFatch( map, ivec2( pxNext.x, pxNext.y ), 0 ),
						alpha.x
					);

					gl_FragColor = mix( p1, p2, alpha.y );
					gl_FragColor.a *= opacity;
					#include <premultiplied_alpha_fragment>

				}
			`}),this.setValues(e)}};import{DataTexture as Kc,DataUtils as Zc,EquirectangularReflectionMapping as Jc,FloatType as el,HalfFloatType as tl,LinearFilter as rl,LinearMipMapLinearFilter as il,RGBAFormat as ol,RepeatWrapping as Yn,ShaderMaterial as nl,WebGLRenderTarget as sl}from"three";var Ti=class extends nl{constructor(){super({uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:`
				varying vec2 vUv;
				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`
				#define ENVMAP_TYPE_CUBE_UV

				uniform samplerCube envMap;
				uniform float flipEnvMap;
				varying vec2 vUv;

				#include <common>
				#include <cube_uv_reflection_fragment>

				${xr}

				void main() {

					vec3 rayDirection = equirectUvToDirection( vUv );
					rayDirection.x *= flipEnvMap;
					gl_FragColor = textureCube( envMap, rayDirection );

				}`}),this.depthWrite=!1,this.depthTest=!1}},gt=class{constructor(e){this._renderer=e,this._quad=new j(new Ti)}generate(e,t=null,r=null){if(!e.isCubeTexture)throw new Error("CubeToEquirectMaterial: Source can only be cube textures.");let n=e.images[0],s=this._renderer,i=this._quad;t===null&&(t=4*n.height),r===null&&(r=2*n.height);let c=new sl(t,r,{type:el,colorSpace:n.colorSpace}),l=n.height,m=Math.log2(l)-2,f=1/l,u=1/(3*Math.max(Math.pow(2,m),112));i.material.defines.CUBEUV_MAX_MIP=`${m}.0`,i.material.defines.CUBEUV_TEXEL_WIDTH=u,i.material.defines.CUBEUV_TEXEL_HEIGHT=f,i.material.uniforms.envMap.value=e,i.material.uniforms.flipEnvMap.value=e.isRenderTargetTexture?1:-1,i.material.needsUpdate=!0;let a=s.getRenderTarget(),d=s.autoClear;s.autoClear=!0,s.setRenderTarget(c),i.render(s),s.setRenderTarget(a),s.autoClear=d;let g=new Uint16Array(t*r*4),T=new Float32Array(t*r*4);s.readRenderTargetPixels(c,0,0,t,r,T),c.dispose();for(let y=0,v=T.length;y<v;y++)g[y]=Zc.toHalfFloat(T[y]);let h=new Kc(g,t,r,ol,tl);return h.minFilter=il,h.magFilter=rl,h.wrapS=Yn,h.wrapT=Yn,h.mapping=Jc,h.needsUpdate=!0,h}dispose(){this._quad.dispose()}};function ml(o){return o.extensions.get("EXT_float_blend")}var Xe=new Xn,wi=class{get multipleImportanceSampling(){return!!this._pathTracer.material.defines.FEATURE_MIS}set multipleImportanceSampling(e){this._pathTracer.material.setDefine("FEATURE_MIS",e?1:0)}get transmissiveBounces(){return this._pathTracer.material.transmissiveBounces}set transmissiveBounces(e){this._pathTracer.material.transmissiveBounces=e}get bounces(){return this._pathTracer.material.bounces}set bounces(e){this._pathTracer.material.bounces=e}get filterGlossyFactor(){return this._pathTracer.material.filterGlossyFactor}set filterGlossyFactor(e){this._pathTracer.material.filterGlossyFactor=e}get samples(){return this._pathTracer.samples}get target(){return this._pathTracer.target}get tiles(){return this._pathTracer.tiles}get stableNoise(){return this._pathTracer.stableNoise}set stableNoise(e){this._pathTracer.stableNoise=e}get isCompiling(){return!!this._pathTracer.isCompiling}constructor(e){this._renderer=e,this._generator=new Kt,this._pathTracer=new dt(e),this._queueReset=!1,this._clock=new ll,this._compilePromise=null,this._lowResPathTracer=new dt(e),this._lowResPathTracer.tiles.set(1,1),this._quad=new j(new _r({map:null,transparent:!0,blending:jn,premultipliedAlpha:e.getContextAttributes().premultipliedAlpha})),this._materials=null,this._previousEnvironment=null,this._previousBackground=null,this._internalBackground=null,this.renderDelay=100,this.minSamples=5,this.fadeDuration=500,this.enablePathTracing=!0,this.pausePathTracing=!1,this.dynamicLowRes=!1,this.lowResScale=.25,this.renderScale=1,this.synchronizeRenderSize=!0,this.rasterizeScene=!0,this.renderToCanvas=!0,this.textureSize=new Xn(1024,1024),this.rasterizeSceneCallback=(t,r)=>{this._renderer.render(t,r)},this.renderToCanvasCallback=(t,r,n)=>{let s=r.autoClear;r.autoClear=!1,n.render(r),r.autoClear=s},this.setScene(new cl,new al)}setBVHWorker(e){this._generator.setBVHWorker(e)}setScene(e,t,r={}){e.updateMatrixWorld(!0),t.updateMatrixWorld();let n=this._generator;if(n.setObjects(e),this._buildAsync)return n.generateAsync(r.onProgress).then(s=>this._updateFromResults(e,t,s));{let s=n.generate();return this._updateFromResults(e,t,s)}}setSceneAsync(...e){this._buildAsync=!0;let t=this.setScene(...e);return this._buildAsync=!1,t}setCamera(e){this.camera=e,this.updateCamera()}updateCamera(){let e=this.camera;e.updateMatrixWorld(),this._pathTracer.setCamera(e),this._lowResPathTracer.setCamera(e),this.reset()}updateMaterials(){let e=this._pathTracer.material,t=this._renderer,r=this._materials,n=this.textureSize,s=tn(r);e.textures.setTextures(t,s,n.x,n.y),e.materials.updateFrom(r,s),this.reset()}updateLights(){let e=this.scene,t=this._renderer,r=this._pathTracer.material,n=rn(e),s=en(n);r.lights.updateFrom(n,s),r.iesProfiles.setTextures(t,s),this.reset()}updateEnvironment(){let e=this.scene,t=this._pathTracer.material;if(this._internalBackground&&(this._internalBackground.dispose(),this._internalBackground=null),t.backgroundBlur=e.backgroundBlurriness,t.backgroundIntensity=e.backgroundIntensity??1,t.backgroundRotation.makeRotationFromEuler(e.backgroundRotation).invert(),e.background===null)t.backgroundMap=null,t.backgroundAlpha=0;else if(e.background.isColor){this._colorBackground=this._colorBackground||new pt(16);let r=this._colorBackground;r.topColor.equals(e.background)||(r.topColor.set(e.background),r.bottomColor.set(e.background),r.update()),t.backgroundMap=r,t.backgroundAlpha=1}else if(e.background.isCubeTexture){if(e.background!==this._previousBackground){let r=new gt(this._renderer).generate(e.background);this._internalBackground=r,t.backgroundMap=r,t.backgroundAlpha=1}}else t.backgroundMap=e.background,t.backgroundAlpha=1;if(t.environmentIntensity=e.environment!==null?e.environmentIntensity??1:0,t.environmentRotation.makeRotationFromEuler(e.environmentRotation).invert(),this._previousEnvironment!==e.environment&&e.environment!==null)if(e.environment.isCubeTexture){let r=new gt(this._renderer).generate(e.environment);t.envMapInfo.updateFrom(r)}else t.envMapInfo.updateFrom(e.environment);this._previousEnvironment=e.environment,this._previousBackground=e.background,this.reset()}_updateFromResults(e,t,r){let{materials:n,geometry:s,bvh:i,bvhChanged:c,needsMaterialIndexUpdate:l}=r;this._materials=n;let f=this._pathTracer.material;return c&&(f.bvh.updateFrom(i),f.attributesArray.updateFrom(s.attributes.normal,s.attributes.tangent,s.attributes.uv,s.attributes.color)),l&&f.materialIndexAttribute.updateFrom(s.attributes.materialIndex),this._previousScene=e,this.scene=e,this.camera=t,this.updateCamera(),this.updateMaterials(),this.updateEnvironment(),this.updateLights(),r}renderSample(){let e=this._lowResPathTracer,t=this._pathTracer,r=this._renderer,n=this._clock,s=this._quad;this._updateScale(),this._queueReset&&(t.reset(),e.reset(),this._queueReset=!1,s.material.opacity=0,n.start());let i=n.getDelta()*1e3,c=n.getElapsedTime()*1e3;if(!this.pausePathTracing&&this.enablePathTracing&&this.renderDelay<=c&&!this.isCompiling&&t.update(),t.alpha=t.material.backgroundAlpha!==1||!ml(r),e.alpha=t.alpha,this.renderToCanvas){let l=this._renderer,m=this.minSamples;if(c>=this.renderDelay&&this.samples>=this.minSamples&&(this.fadeDuration!==0?s.material.opacity=Math.min(s.material.opacity+i/this.fadeDuration,1):s.material.opacity=1),!this.enablePathTracing||this.samples<m||s.material.opacity<1){if(this.dynamicLowRes&&!this.isCompiling){e.samples<1&&(e.material=t.material,e.update());let f=s.material.opacity;s.material.opacity=1-s.material.opacity,s.material.map=e.target.texture,s.render(l),s.material.opacity=f}(!this.dynamicLowRes&&this.rasterizeScene||this.dynamicLowRes&&this.isCompiling)&&this.rasterizeSceneCallback(this.scene,this.camera)}this.enablePathTracing&&s.material.opacity>0&&(s.material.opacity<1&&(s.material.blending=this.dynamicLowRes?fl:ul),s.material.map=t.target.texture,this.renderToCanvasCallback(t.target,l,s),s.material.blending=jn)}}reset(){this._queueReset=!0,this._pathTracer.samples=0}dispose(){this._quad.dispose(),this._quad.material.dispose(),this._pathTracer.dispose()}_updateScale(){if(this.synchronizeRenderSize){this._renderer.getDrawingBufferSize(Xe);let e=Math.floor(this.renderScale*Xe.x),t=Math.floor(this.renderScale*Xe.y);if(this._pathTracer.getSize(Xe),Xe.x!==e||Xe.y!==t){let r=this.lowResScale;this._pathTracer.setSize(e,t),this._lowResPathTracer.setSize(Math.floor(e*r),Math.floor(t*r))}}}};import{SpotLight as hl}from"three";var Si=class extends hl{constructor(...e){super(...e),this.iesMap=null,this.radius=0}copy(e,t){return super.copy(e,t),this.iesMap=e.iesMap,this.radius=e.radius,this}};import{Box3 as dl,BufferAttribute as pl}from"three";var Ar=class{constructor(e){this.name="WorkerBase",this.running=!1,this.worker=e,this.worker.onerror=t=>{throw t.message?new Error(`${this.name}: Could not create Web Worker with error "${t.message}"`):new Error(`${this.name}: Could not create Web Worker.`)}}runTask(){}generate(...e){if(this.running)throw new Error("GenerateMeshBVHWorker: Already running job.");if(this.worker===null)throw new Error("GenerateMeshBVHWorker: Worker has been disposed.");this.running=!0;let t=this.runTask(this.worker,...e);return t.finally(()=>{this.running=!1}),t}dispose(){this.worker.terminate(),this.worker=null}};var _i=class extends Ar{constructor(){let e=new Worker(new URL("./generateMeshBVH.worker.js",import.meta.url),{type:"module"});super(e),this.name="GenerateMeshBVHWorker"}runTask(e,t,r={}){return new Promise((n,s)=>{if(t.getAttribute("position").isInterleavedBufferAttribute||t.index&&t.index.isInterleavedBufferAttribute)throw new Error("GenerateMeshBVHWorker: InterleavedBufferAttribute are not supported for the geometry attributes.");e.onerror=m=>{s(new Error(`GenerateMeshBVHWorker: ${m.message}`))},e.onmessage=m=>{let{data:f}=m;if(f.error)s(new Error(f.error)),e.onmessage=null;else if(f.serialized){let{serialized:u,position:a}=f,d=ye.deserialize(u,t,{setIndex:!1}),g=Object.assign({setBoundingBox:!0},r);if(t.attributes.position.array=a,u.index)if(t.index)t.index.array=u.index;else{let T=new pl(u.index,1,!1);t.setIndex(T)}g.setBoundingBox&&(t.boundingBox=d.getBoundingBox(new dl)),r.onProgress&&r.onProgress(f.progress),n(d),e.onmessage=null}else r.onProgress&&r.onProgress(f.progress)};let i=t.index?t.index.array:null,c=t.attributes.position.array,l=[c];i&&l.push(i),e.postMessage({index:i,position:c,options:{...r,onProgress:null,includedProgressCallback:!!r.onProgress,groups:[...t.groups]}},l.map(m=>m.buffer).filter(m=>typeof SharedArrayBuffer>"u"||!(m instanceof SharedArrayBuffer)))})}};export{_i as GenerateMeshBVHWorker,pt as GradientEquirectTexture,Si as PhysicalSpotLight,wi as WebGLPathTracer};
