import * as THREE from 'three';

const turn = 2 * Math.PI;
const lerp = THREE.MathUtils.lerp;
const clamp01 = x => THREE.MathUtils.clamp(x, 0, 1);
// Six oval sections from the complete-flower study, ordered from the foot to the crown.
const hoops = [
  [1.80, 1.06, -.035, .025, -.04], [1.67, 1.40, .055, -.045, .05],
  [1.64, 1.56, -.065, .035, -.02], [1.84, 1.11, .065, .025, .055],
  [1.71, 1.43, -.025, -.025, -.035], [1.80, 1.19, 0, 0, 0],
];

function oval(profile, angle, offset = 0) {
  const [a,b,cx,cz,yaw] = profile;
  const x = (a + offset) * Math.sin(angle);
  const z = (b + offset) * Math.cos(angle);
  return new THREE.Vector3(cx + x * Math.cos(yaw) + z * Math.sin(yaw), 0,
    cz - x * Math.sin(yaw) + z * Math.cos(yaw));
}

function makeCloth(columns, rows, positionAt, uvAt, material) {
  const geo = new THREE.PlaneGeometry(1, 1, columns, rows);
  const position = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let row = 0; row <= rows; row++) {
    for (let col = 0; col <= columns; col++) {
      const i = row * (columns + 1) + col;
      const u = col / columns, v = row / rows;
      const p = positionAt(u, v);
      position.setXYZ(i, p.x, p.y, p.z);
      const [x,y] = uvAt(u, v);
      uv.setXY(i,x,y);
    }
  }
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, material);
}

const leafWidth = v => Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(v,.66))), .67);
function midribU(v, index) {
  // Centre of the painted vein in the two full-bleed print masters, measured from the top.
  const s = (360 + 1100 * v) / 1810;
  return (index ? .521 : .496) + (index ? -.035 : .030) * Math.sin(7.2*s+.42*index)
    + (index ? .015 : .012) * Math.sin(3.4*s+1.12);
}

export function buildCinemaTextiles({loader, anisotropy, platformHigh}) {
  const group = new THREE.Group();
  group.name = 'Telas de la flor central';
  const material = color => new THREE.MeshStandardMaterial({color, side:THREE.DoubleSide, roughness:.93});
  const sleeveMat = material(0x518978);
  const hoopMat = new THREE.MeshStandardMaterial({color:0x416a5e, roughness:.86});
  const sources = {};
  let selection = 'fibras';
  const load = (id, repeated, apply) => loader.load('artes-preview/textiles-'+id+'.webp', map => {
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = anisotropy;
    if (repeated) map.wrapS = map.wrapT = THREE.RepeatWrapping;
    apply(map);
  });
  function assign(mat,map) {
    mat.map = map;
    mat.color.set(0xffffff);
    mat.needsUpdate = true;
  }
  for(const id of ['fibras','bambu']) {
    load(id,true,map => {
      sources[id]=map;
      if(id===selection) assign(sleeveMat,map);
    });
  }

  const base = 1.37;
  const belowPlatform = .18;
  const restHeight = platformHigh - belowPlatform - base;
  const around = 84, rows = 100;
  const packedRow = [];
  const sleeve = makeCloth(around, rows, (u,v) => {
    const station = Math.min(4, Math.floor(v*5)), t=v*5-station;
    const smooth = t*t*(3-2*t);
    const ring = hoops[station].map((value,i) => lerp(value,hoops[station+1][i],smooth));
    const a = u*turn;
    const easing = Math.sin(Math.PI*t)**2;
    const pleat = easing * (.064+.037*Math.cos(a*15+v*3)+.033*Math.sin(a*7+v*4));
    const p = oval(ring,a,pleat);
    const outward = oval(ring,a,1).sub(oval(ring,a));
    // In storage the excess length collects in shallow horizontal folds between each pair of hoops.
    const packed = .105 * (1 - Math.cos(v*50*turn)) / 2;
    packedRow.push([p.x,p.z,outward.x*packed,outward.z*packed,v]);
    p.y = base + restHeight*v;
    return p;
  }, (u,v) => [u*6,v*restHeight/3], sleeveMat);
  sleeve.name = 'Manga textil de seis aros';
  sleeve.geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
  group.add(sleeve);
  const rings = hoops.map((profile,i) => {
    const curve = new THREE.Curve();
    curve.getPoint = t => oval(profile,t*turn,-.017);
    const ring = new THREE.Mesh(new THREE.TubeGeometry(curve,84,.018,8,true),hoopMat);
    ring.name='Aro del tallo '+(i+1);
    group.add(ring);
    return ring;
  });
  const leafRows=38, leafColumns=24;
  const leaves = [
    {length:3,width:2.25,station:3,angle:-1.36},
    {length:2.75,width:2.15,station:4,angle:1.10},
  ].map((d,i) => {
    const mat = material(0x518265);
    const id = i===0?'bore-mayor':'bore-menor';
    load(id,false,map=>assign(mat,map));
    const mesh = makeCloth(leafColumns,leafRows,()=>new THREE.Vector3(),(u,v)=>{
      const center = midribU(v,i);
      const extent = u<.5?center:1-center;
      return [center+(2*u-1)*leafWidth(v)*extent,1-v];
    },mat);
    mesh.geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
    mesh.name = i===0?'Hoja de bore mayor':'Hoja de bore menor';
    group.add(mesh);
    return {...d,mesh,material:mat};
  });

  function drape(leaf, height, deckY) {
    const {mesh,angle,station,width,length} = leaf;
    const pos = mesh.geometry.attributes.position;
    const rootY = base + height*station/5;
    // The fabric stays wrapped along the outside until it is high enough to hang clear of the deck.
    const released = clamp01((rootY-deckY-.35)/length);
    const ring=hoops[station];
    let az=angle, radial=.08, y=rootY;
    for(let row=0;row<=leafRows;row++){
      const v=row/leafRows;
      const arch = Math.cos(Math.PI*v);
      if(row) {
        const ds=length/leafRows;
        const outward = .23 + .55*arch;
        const vertical = -Math.sqrt(1-outward*outward);
        const speed = Math.hypot((ring[0]+radial)*Math.cos(az),(ring[1]+radial)*Math.sin(az));
        az += ds*Math.sqrt(1-released*released)/speed;
        radial += ds*released*outward;
        y += ds*released*vertical;
      }
      const center = oval(ring,az,radial);
      const normal = oval(ring,az,1).sub(oval(ring,az));
      const across = oval(ring,az+.0001,radial).sub(center).normalize();
      // Turn the two laminae slightly towards the front of the stage as they unfurl.
      const facing = (angle < 0 ? .60 : -.50) * released;
      across.applyAxisAngle(THREE.Object3D.DEFAULT_UP, facing);
      const wing = leafWidth(v);
      for(let col=0;col<=leafColumns;col++){
        const s = 2*col/leafColumns-1;
        const half = s*wing*width*.5;
        const cupping = wing*(.19*s*s + .075*(1-Math.abs(s)) + .027*Math.cos(5*s-7*v));
        const gathered = (1-released)*.085*(1-Math.cos(s*6*Math.PI))*wing;
        const along = released*half;
        const bulge = released*(cupping+.38*Math.abs(along))+gathered;
        const x = center.x + across.x*along + normal.x*bulge;
        const z = center.z + across.z*along + normal.z*bulge;
        const shoulders = .32 * (s*s) * Math.sin(Math.PI*v)*Math.exp(-4*v);
        pos.setXYZ(row*(leafColumns+1)+col,x,
          y + released*(shoulders+.10*wing*s*s) + (1-released)*.13*half,z);
      }
    }
    pos.needsUpdate=true;
    mesh.geometry.computeVertexNormals();
    mesh.geometry.computeBoundingSphere();
  }
  let previousY;
  function update(platformY,deckY) {
    if(platformY===previousY)return;
    previousY=platformY;
    const height=platformY-belowPlatform-base;
    const packed=1-clamp01(height/restHeight);
    const pos=sleeve.geometry.attributes.position;
    packedRow.forEach(([x,z,dx,dz,v],i)=>pos.setXYZ(i,x+dx*packed,base+v*height,z+dz*packed));
    pos.needsUpdate=true;
    sleeve.geometry.computeVertexNormals();
    sleeve.geometry.computeBoundingSphere();
    rings.forEach((ring,i)=>ring.position.y=base+i*height/5);
    leaves.forEach(leaf=>drape(leaf,height,deckY));
  }
  return {group,sleeve,rings,leaves,update,
    select(id) {
      selection=id==='bambu'?'bambu':'fibras';
      if(sources[selection])assign(sleeveMat,sources[selection]);
    },
    opacity(value) {
      for(const mesh of [sleeve,...leaves.map(leaf=>leaf.mesh)]) {
        mesh.visible=value>0;
        mesh.material.opacity=value;
        mesh.material.transparent=value<1;
        mesh.material.depthWrite=value===1;
        mesh.material.needsUpdate=true;
      }
    },
  };
}
