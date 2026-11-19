// Las marcas viven en coordenadas locales de la maleta. Un segmento pertenece
// a una sola superficie continua; el papel de fondo y la sombra quedan fuera.
export function instalarMarcas({THREE, renderer, camera, model, orbit, draw, onChange}) {
  const canvas = renderer.domElement;
  const surfaces = [];
  model.traverse(object => { if (object.isMesh) surfaces.push(object); });
  const layer = new THREE.Group();
  layer.name = 'Marcas de revisión';
  model.add(layer);

  const radius = .00145, lift = .00020;
  const samplePx = 3, maxSteps = 64, maxStrokes = 256, maxPoints = 18000;
  function solidHex(value) {
    if (typeof value !== 'string') return null;
    if (/^#[a-f\d]{6}$/i.test(value)) return value;
    if (/^#[a-f\d]{3}$/i.test(value)) return '#'+[...value.slice(1)].map(c=>c+c).join('');
    return null;
  }
  let color = '#e03949', drawing = false, active = null, count = 0;
  let originalCursor = '', orbitWasEnabled = true;
  const strokes = [];
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const normalMatrix = new THREE.Matrix3(), toLocalNormal = new THREE.Matrix3();
  const a = new THREE.Vector3(), b = new THREE.Vector3(), delta = new THREE.Vector3();
  const n = new THREE.Vector3(), m = new THREE.Vector3();
  const sideA = new THREE.Vector3(), sideB = new THREE.Vector3();
  const east = new THREE.Vector3(), north = new THREE.Vector3();
  const discSides = 10, tau = Math.PI * 2;
  const circle = Array.from({length:discSides+1}, (_,i) => [
    Math.cos(i*tau/discSides)*radius, Math.sin(i*tau/discSides)*radius
  ]);

  function newStroke(ink) {
    const material = new THREE.MeshBasicMaterial({
      color:ink, side:THREE.DoubleSide, toneMapped:false,
      polygonOffset:true, polygonOffsetFactor:-1, polygonOffsetUnits:-1
    });
    const group = new THREE.Group();
    group.name = 'Trazo';
    layer.add(group);
    return {data:{color:ink, segments:[]}, group, material, chunk:null, points:0};
  }

  function newChunk(stroke) {
    // Reserve a small first block, since single taps are common. Long lines
    // continue into fixed-size buffers without rebuilding previous geometry.
    const capacity = (stroke.chunk ? 96 : 8) * (discSides*3 + 6);
    const positions = new THREE.BufferAttribute(new Float32Array(capacity*3), 3);
    positions.setUsage(THREE.DynamicDrawUsage);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', positions);
    geometry.setDrawRange(0,0);
    const mesh = new THREE.Mesh(geometry, stroke.material);
    mesh.frustumCulled = false;
    stroke.group.add(mesh);
    return stroke.chunk = {positions, geometry, vertices:0};
  }

  function append(stroke, segment, p) {
    const previous = segment.at(-1);
    segment.push(p);
    stroke.points++;
    count++;
    const needed = discSides*3 + (previous ? 6 : 0);
    let chunk = stroke.chunk;
    if (!chunk || chunk.vertices+needed > chunk.positions.count) chunk = newChunk(stroke);
    const {positions, geometry} = chunk;
    const vertex = (x,y,z) => positions.setXYZ(chunk.vertices++,x,y,z);
    b.fromArray(p);
    n.fromArray(p,3);
    b.addScaledVector(n,lift);
    if (previous) {
      a.fromArray(previous); m.fromArray(previous,3);
      a.addScaledVector(m,lift);
      delta.subVectors(b,a);
      sideA.crossVectors(m,delta).normalize().multiplyScalar(radius);
      sideB.crossVectors(n,delta).normalize().multiplyScalar(radius);
      const corner = (center,side,sign) => vertex(center.x+side.x*sign,center.y+side.y*sign,center.z+side.z*sign);
      corner(a,sideA,1); corner(a,sideA,-1); corner(b,sideB,-1);
      corner(a,sideA,1); corner(b,sideB,-1); corner(b,sideB,1);
    }
    east.set(Math.abs(n.x)<.8?1:0,Math.abs(n.x)<.8?0:1,0);
    east.cross(n).normalize(); north.crossVectors(n,east);
    const rim = ([x,y]) => vertex(b.x+x*east.x+y*north.x,b.y+x*east.y+y*north.y,b.z+x*east.z+y*north.z);
    for (let i=0;i<discSides;i++) {
      vertex(b.x,b.y,b.z); rim(circle[i]); rim(circle[i+1]);
    }
    geometry.setDrawRange(0,chunk.vertices);
    positions.needsUpdate = true;
  }

  function dispose(stroke) {
    layer.remove(stroke.group);
    for (const mesh of stroke.group.children) mesh.geometry.dispose();
    stroke.material.dispose();
    count -= stroke.points;
  }

  function snapshot() {
    return strokes.map(({data}) => ({
      color:data.color,
      // A millionth of a metre is far below a screen pixel even at maximum zoom.
      segments:data.segments.map(segment => segment.map(point => point.map(v=>Math.round(v*1e6)/1e6)))
    }));
  }
  function changed() { draw(); if (onChange) onChange(snapshot()); }

  function opaqueHit(hit) {
    const mat = Array.isArray(hit.object.material) ? hit.object.material[hit.face.materialIndex] : hit.object.material;
    if (!mat || !mat.visible || (mat.transparent && mat.opacity<=.01)) return false;
    for (let p=hit.object;p;p=p.parent) if (!p.visible) return false;
    return true;
  }
  function pick(x,y,rect) {
    if (x<rect.left || x>rect.right || y<rect.top || y>rect.bottom || !rect.width || !rect.height) return null;
    ndc.set((x-rect.left)/rect.width*2-1, 1-(y-rect.top)/rect.height*2);
    ray.setFromCamera(ndc,camera);
    const hit = ray.intersectObjects(surfaces,false).find(opaqueHit);
    if (!hit) return null;
    const normal = (hit.normal || hit.face.normal).clone().applyNormalMatrix(normalMatrix.getNormalMatrix(hit.object.matrixWorld));
    if (normal.dot(ray.ray.direction)>0) normal.negate();
    const local = model.worldToLocal(hit.point.clone());
    normal.applyNormalMatrix(toLocalNormal.setFromMatrix4(model.matrixWorld).transpose());
    return {object:hit.object, depth:hit.distance, p:[...local.toArray(),...normal.toArray()]};
  }

  function nearSurface(hit,previous,step,rect) {
    if (hit.object!==previous.object) return false;
    a.fromArray(previous.p); b.fromArray(hit.p); delta.subVectors(b,a);
    m.fromArray(previous.p,3); n.fromArray(hit.p,3);
    // Detect an occluding edge within a single mesh, including jumps between
    // nearly parallel surfaces. The threshold tracks the current view scale.
    const travel = delta.length();
    const metresPerPixel = 2*hit.depth*Math.tan(THREE.MathUtils.degToRad(camera.fov*.5))/rect.height;
    return travel<Math.min(.015,.001+step*metresPerPixel*3.5) && m.dot(n)>.45 &&
      Math.max(Math.abs(delta.dot(m)),Math.abs(delta.dot(n))) < .00055+.26*travel;
  }
  function sample(x,y,step,rect) {
    if (count>=maxPoints) return;
    const hit=pick(x,y,rect);
    if (!hit) { active.previous=null; return; }
    const previous=active.previous;
    if (!active.stroke) active.stroke=newStroke(color);
    let segment=active.stroke.data.segments.at(-1);
    if (!previous || !nearSurface(hit,previous,step,rect)) {
      segment=[]; active.stroke.data.segments.push(segment);
    } else if (a.distanceToSquared(b)<.00017**2) {
      return;
    }
    append(active.stroke,segment,hit.p);
    active.previous=hit;
  }
  function moveTo(x,y) {
    const rect=canvas.getBoundingClientRect();
    const dx=x-active.x, dy=y-active.y, distance=Math.hypot(dx,dy);
    if (!distance) return;
    const steps=Math.ceil(distance/samplePx);
    if (steps>maxSteps) {
      active.previous=null;
      sample(x,y,0,rect);
    } else {
      for(let i=1;i<=steps;i++) sample(active.x+dx*i/steps,active.y+dy*i/steps,distance/steps,rect);
    }
    active.x=x;active.y=y;
    draw();
  }
  function finish(commit,notify=true) {
    if (!active) return;
    const {id,stroke}=active;
    active=null;
    if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
    if (!stroke) return;
    if (commit) {
      strokes.push(stroke);
      if (notify) changed();
    } else {
      dispose(stroke); draw();
    }
  }
  function consume(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
  canvas.addEventListener('pointerdown',event => {
    if (!drawing || !layer.visible || !event.isPrimary || event.button!==0 || active) return;
    consume(event);
    if (strokes.length>=maxStrokes || count>=maxPoints) return;
    active={id:event.pointerId,x:event.clientX,y:event.clientY,previous:null,stroke:null};
    canvas.setPointerCapture(event.pointerId);
    sample(active.x,active.y,0,canvas.getBoundingClientRect()); draw();
  },true);
  canvas.addEventListener('pointermove',event => {
    if (!active || active.id!==event.pointerId) return;
    consume(event);
    moveTo(event.clientX,event.clientY);
  },true);
  canvas.addEventListener('pointerup',event => {
    if (!active || active.id!==event.pointerId) return;
    consume(event);
    moveTo(event.clientX,event.clientY); finish(true);
  },true);
  for (const type of ['pointercancel','lostpointercapture']) {
    canvas.addEventListener(type,event => { if (active?.id===event.pointerId) finish(true); },true);
  }

  function setDrawing(value) {
    value=Boolean(value);
    if (drawing===value) return;
    if (value) {
      originalCursor=canvas.style.cursor; orbitWasEnabled=orbit.enabled;
      orbit.enabled=false; canvas.style.cursor='crosshair';
    } else {
      finish(true); orbit.enabled=orbitWasEnabled; canvas.style.cursor=originalCursor;
    }
    drawing=value;
  }
  function setVisible(value) {
    if (!value) finish(true);
    layer.visible=Boolean(value);draw();
  }
  function undo() {
    finish(true,false);
    const stroke=strokes.pop();
    if (stroke) { dispose(stroke); changed(); }
  }
  function clear() {
    finish(true,false);
    if (!strokes.length) return;
    while(strokes.length) dispose(strokes.pop());
    changed();
  }
  function restore(input) {
    finish(false);
    while(strokes.length) dispose(strokes.pop());
    let inspected=0, inspectedSegments=0;
    if (Array.isArray(input)) for (const data of input.slice(0,maxStrokes)) {
      const ink=solidHex(data?.color);
      if (!ink || !Array.isArray(data.segments)) continue;
      let stroke=null;
      for(const values of data.segments) {
        if (++inspectedSegments>maxPoints) break;
        if (!Array.isArray(values)) continue;
        let segment=null;
        for(const value of values) {
          if (++inspected>maxPoints || count>=maxPoints) break;
          if (!Array.isArray(value) || value.length!==6 || !value.every(Number.isFinite) ||
              value.slice(0,3).some(v=>Math.abs(v)>1)) { segment=null;continue; }
          n.fromArray(value,3);
          if (n.lengthSq()<.2 || n.lengthSq()>4) { segment=null;continue; }
          if (Math.abs(n.lengthSq()-1)>.00001) n.normalize();
          const p=[value[0],value[1],value[2],n.x,n.y,n.z];
          if (!stroke) { stroke=newStroke(ink); strokes.push(stroke); }
          if (segment) {
            a.fromArray(segment.at(-1)); b.fromArray(p);
            if (a.distanceToSquared(b)>.015**2) segment=null;
          }
          if (!segment) { segment=[];stroke.data.segments.push(segment); }
          append(stroke,segment,p);
        }
        if (inspected>=maxPoints || count>=maxPoints) break;
      }
      if (inspected>=maxPoints || count>=maxPoints || inspectedSegments>=maxPoints) break;
    }
    draw();
  }
  function setColor(value) {
    const ink=solidHex(value);
    if (ink) color=ink;
  }
  return {setDrawing,setColor,undo,clear,restore,snapshot,setVisible};
}
