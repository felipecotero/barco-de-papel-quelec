export function buildShip(THREE, options = {}) {
  const { Vector3, Group, Mesh } = THREE;
  const pieces = [];
  const red = new THREE.MeshStandardMaterial({ color: '#c74b44', roughness: .69, side: THREE.DoubleSide });
  const white = new THREE.MeshStandardMaterial({ color: '#e8e6d9', roughness: .79, side: THREE.DoubleSide });
  const blue = new THREE.MeshStandardMaterial({ color: '#628fa4', metalness: .3, roughness: .41, side: THREE.DoubleSide });
  const metal = new THREE.MeshStandardMaterial({ color: '#c6a96f', metalness: .67, roughness: .36 });
  const grip = new THREE.MeshStandardMaterial({ color: '#364950', roughness: .94 });
  const glass = new THREE.MeshPhysicalMaterial({ color: '#add5de', roughness: .13, metalness: 0, transparent: true, opacity: .28, side: THREE.DoubleSide, depthWrite: false });
  let windowShape = options.windowShape || 'rounded';
  let glazingOn = options.glazing !== false;
  const panelDepth = .035;
  const fuselageRadius = 1.10;
  const v = (x, y, z) => new Vector3(x, y, z);
  function roundedRect(x, y, width, height, radius) {
    const s = new THREE.Shape();
    s.moveTo(x + radius, y);
    s.lineTo(x + width - radius, y);
    s.quadraticCurveTo(x + width, y, x + width, y + radius);
    s.lineTo(x + width, y + height - radius);
    s.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    s.lineTo(x + radius, y + height);
    s.quadraticCurveTo(x, y + height, x, y + height - radius);
    s.lineTo(x, y + radius);
    s.quadraticCurveTo(x, y, x + radius, y);
    return s;
  }
  function circle(x, y, radius) {
    const shape = new THREE.Shape();
    shape.absarc(x, y, radius, 0, Math.PI * 2);
    return shape;
  }
  function add(piece, geometry, material, type = 'frames', parent = piece.group) {
    const mesh = new Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.pieceId = piece.id;
    mesh.userData.surface = type;
    parent.add(mesh);
    piece[type].push(mesh);
    return mesh;
  }
  function tube(piece, points, radius = .009, material = metal, closed = false) {
    const curvePoints = closed && points[0].distanceToSquared(points[points.length - 1]) < 1e-12
      ? points.slice(0, -1) : points;
    const path = new THREE.CatmullRomCurve3(curvePoints, closed, 'centripetal');
    return add(piece, new THREE.TubeGeometry(path, Math.max(points.length * 4, 20), radius, 8, closed), material);
  }
  function bar(piece, a, b, radius = .009, material = metal) {
    const delta = b.clone().sub(a);
    const mesh = add(piece, new THREE.CylinderGeometry(radius, radius, delta.length(), 10), material);
    mesh.position.copy(a).addScaledVector(delta, .5);
    mesh.quaternion.setFromUnitVectors(v(0, 1, 0), delta.normalize());
    return mesh;
  }
  function sampleBoundary(shape, step = .025) {
    const coarse = shape.getPoints(32);
    const points = [];
    for (let i = 0; i < coarse.length - 1; i++) {
      const a = coarse[i], b = coarse[i + 1];
      const count = Math.max(1, Math.ceil(a.distanceTo(b) / step));
      for (let k = 0; k < count; k++) points.push(a.clone().lerp(b, k / count));
    }
    points.push(coarse[coarse.length - 1].clone());
    return points;
  }
  function subdividedSurface(shape, map) {
    const source = new THREE.ShapeGeometry(shape, 24);
    const positions = source.attributes.position;
    const vertices = Array.from({ length: positions.count }, (_, i) =>
      new THREE.Vector2(positions.getX(i), positions.getY(i)));
    let indices = Array.from(source.index.array);
    const maximumEdge = .05;
    for (let pass = 0; pass < 10; pass++) {
      const midpoints = new Map();
      const edgeKey = (a, b) => a < b ? a + '/' + b : b + '/' + a;
      for (let i = 0; i < indices.length; i += 3) {
        const tri = indices.slice(i, i + 3);
        for (let j = 0; j < 3; j++) {
          const a = tri[j], b = tri[(j + 1) % 3], key = edgeKey(a, b);
          if (!midpoints.has(key) && vertices[a].distanceToSquared(vertices[b]) > maximumEdge ** 2) {
            midpoints.set(key, vertices.length);
            vertices.push(vertices[a].clone().lerp(vertices[b], .5));
          }
        }
      }
      if (!midpoints.size) break;
      const next = [];
      for (let i = 0; i < indices.length; i += 3) {
        const [a, b, d] = indices.slice(i, i + 3);
        const ab = midpoints.get(edgeKey(a, b));
        const bd = midpoints.get(edgeKey(b, d));
        const da = midpoints.get(edgeKey(d, a));
        const splits = Number(ab !== undefined) + Number(bd !== undefined) + Number(da !== undefined);
        if (splits === 0) next.push(a, b, d);
        else if (splits === 3) next.push(a, ab, da, ab, b, bd, da, bd, d, ab, bd, da);
        else if (splits === 1) {
          if (ab !== undefined) next.push(a, ab, d, ab, b, d);
          else if (bd !== undefined) next.push(b, bd, a, bd, d, a);
          else next.push(d, da, b, da, a, b);
        } else if (da === undefined) next.push(b, bd, ab, a, ab, d, ab, bd, d);
        else if (ab === undefined) next.push(d, da, bd, b, bd, a, bd, da, a);
        else next.push(a, ab, da, d, da, b, da, ab, b);
      }
      indices = next;
    }
    source.dispose();
    const mapped = [];
    for (const point of vertices) {
      const p = map(point.x, point.y);
      mapped.push(p.x, p.y, p.z);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(mapped, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }
  function surface(piece, shape, map, material, type = 'skins') {
    return add(piece, subdividedSurface(shape, map), material, type);
  }
  function strip(piece, points, mapA, mapB, material, type = 'skins') {
    const vertices = [], indices = [];
    for (const p of points) {
      for (const map of [mapA, mapB]) {
        const q = map(p.x, p.y);
        vertices.push(q.x, q.y, q.z);
      }
    }
    for (let i = 0; i < points.length - 1; i++) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return add(piece, geo, material, type);
  }
  function newPiece(id, name, position, dimensions, description, centerY) {
    const group = new Group();
    group.name = name;
    group.userData.pieceId = id;
    const piece = { id, name, group, skins: [], frames: [], glazing: [], dimensions, description,
      home: { position, rotation: [0, 0, 0] }, centerY };
    pieces.push(piece);
    return piece;
  }
  function shellPanel(piece, outer, hole, mapping, depth, material, frame = true) {
    const perforated = outer.clone();
    if (hole) perforated.holes.push(new THREE.Path(hole.getPoints(36)));
    const front = (x, y) => mapping(x, y, depth / 2);
    const back = (x, y) => mapping(x, y, -depth / 2);
    surface(piece, perforated, front, material);
    surface(piece, perforated, back, material);
    const rim = sampleBoundary(outer);
    strip(piece, rim, front, back, material);
    if (frame) {
      const center = rim.reduce((sum, p) => sum.add(p), new THREE.Vector2()).divideScalar(rim.length);
      const inset = rim.map(p => {
        const delta = p.clone().sub(center);
        return p.clone().addScaledVector(delta.normalize(), -.014);
      });
      tube(piece, inset.map(p => mapping(p.x, p.y, 0)), .008, metal, true);
      if (hole) {
        const aperture = sampleBoundary(hole, .018);
        strip(piece, aperture, front, back, white);
        for (const z of [-depth / 2 + .006, depth / 2 - .006]) {
          tube(piece, aperture.map(p => mapping(p.x, p.y, z)), .006, blue, true);
        }
        tube(piece, aperture.map(p => mapping(p.x, p.y, 0)), .007, metal, true);
      }
    }
    if (hole) {
      const mesh = surface(piece, hole, (x, y) => mapping(x, y, 0), glass, 'glazing');
      mesh.visible = glazingOn;
    }
  }
  function doorHandles(piece, mapping, sign) {
    for (const x of [-.205, .205]) {
      const a = mapping(x, .18, 0);
      const b = mapping(x, .42, 0);
      tube(piece, Array.from({ length: 13 }, (_, i) => mapping(x, .18 + .24 * i / 12, 0)), .008);
      const c = a.clone().add(v(0, 0, -sign * .19));
      const d = b.clone().add(v(0, 0, -sign * .19));
      bar(piece, a, c, .010);
      bar(piece, b, d, .010);
      bar(piece, c, d, .014, grip);
    }
  }
  const nose = newPiece('nariz', 'Nariz y dos orejas', [-1.15, .90, 0],
    { largo: 1.70, alto: 1.00, ancho: 1.00, oreja: .70, espesorOreja: panelDepth },
    'Nariz roja redondeada y dos orejas curvas blancas de 70 cm y 3,5 cm de espesor con ojos de buey. Dos agarres interiores para un portador. Ancho de 1 m propuesto.', .50);
  const noseY = -.5;
  const sectors = 44, rings = 30;
  const pts = [], indices = [];
  function nosePoint(t, a) {
    const r = .5 * Math.pow(Math.sin(Math.PI * .5 * t), .82);
    return v(-.85 + t, .5 + r * Math.cos(a) + noseY, r * Math.sin(a));
  }
  function innerNosePoint(t, a) {
    const point = nosePoint(t, a);
    const radius = Math.hypot(point.y, point.z);
    const inset = Math.max(0, radius - .035) / radius;
    point.y *= inset;
    point.z *= inset;
    return point;
  }
  for (let j = 0; j <= rings; j++) {
    for (let k = 0; k <= sectors; k++) {
      const p = nosePoint(j / rings, (-.74 + k / sectors * 1.48) * Math.PI);
      pts.push(p.x, p.y, p.z);
    }
  }
  for (let j = 0; j < rings; j++) for (let k = 0; k < sectors; k++) {
    const a = j * (sectors + 1) + k;
    indices.push(a, a + sectors + 1, a + 1, a + 1, a + sectors + 1, a + sectors + 2);
  }
  const cone = new THREE.BufferGeometry();
  cone.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  cone.setIndex(indices);
  cone.computeVertexNormals();
  add(nose, cone, red, 'skins');
  for (const t of [.27, .57, .98]) {
    tube(nose, Array.from({ length: 37 }, (_, k) => innerNosePoint(t, (-.74 + k / 36 * 1.48) * Math.PI)), .010);
  }
  for (const a of [-.65, -.34, .34, .65]) {
    tube(nose, Array.from({ length: 21 }, (_, j) => innerNosePoint(.04 + .94 * j / 20, a * Math.PI)), .008);
  }
  for (const sign of [-1, 1]) {
    const ear = roundedRect(.15, 0, .70, .80, .14);
    const eye = circle(.505, .44, .185);
    const mapping = (x, y, z) => {
      const angle = Math.asin(THREE.MathUtils.clamp((y + noseY) / .5, -1, 1));
      const radius = .5 - panelDepth / 2 + z;
      return v(x, radius * Math.sin(angle), sign * radius * Math.cos(angle));
    };
    shellPanel(nose, ear, eye, mapping, panelDepth, white);
    const lowerA = v(-.15, .18 + noseY, sign * .25);
    const lowerB = v(.65, .18 + noseY, sign * .25);
    bar(nose, lowerA, lowerB, .012);
    bar(nose, mapping(.17, .24, 0), lowerA, .009);
    bar(nose, mapping(.68, .24, 0), lowerB, .009);
    const start = v(.12, .22 + noseY, sign * .25);
    const end = v(.39, .22 + noseY, sign * .25);
    bar(nose, start, end, .017, grip);
    bar(nose, start, v(.12, .18 + noseY, sign * .25), .012);
    bar(nose, end, v(.39, .18 + noseY, sign * .25), .012);
  }
  function buildDoor(piece, sign, tail) {
    const outer = roundedRect(-.35, 0, .70, 1.10, .115);
    const circular = windowShape === 'circular' || windowShape === 'circle';
    const hole = tail ? null : circular ? circle(0, .705, .195) : roundedRect(-.215, .49, .43, .44, .09);
    const mapping = (x, y, z) => {
      const angle = Math.asin((y - .55) / fuselageRadius);
      const middleRadius = fuselageRadius - panelDepth / 2;
      const radius = middleRadius + z;
      return v(x, radius * Math.sin(angle), sign * (radius * Math.cos(angle) - middleRadius));
    };
    shellPanel(piece, outer, hole, mapping, panelDepth, white);
    for (const x of [-.29, .29]) {
      tube(piece, Array.from({ length: 37 }, (_, i) => mapping(x, .10 + .90 * i / 36, 0)), .008);
    }
    for (const y of [.14, .37, 1.0]) bar(piece, mapping(-.29, y, 0), mapping(.29, y, 0), .008);
    doorHandles(piece, mapping, sign);
    if (tail) {
      const shape = new THREE.Shape();
      shape.moveTo(-.35, 0);
      shape.lineTo(.35, 0);
      shape.lineTo(.55, .70);
      shape.lineTo(.15, .70);
      shape.closePath();
      const top = (x, s) => v(x, -.015 + s * .045, sign * (.025 + s));
      const lower = (x, s) => v(x, -.021 + s * .045, sign * (.025 + s));
      surface(piece, shape, top, red);
      surface(piece, shape, lower, red);
      strip(piece, shape.getPoints(), top, lower, red);
      // Two light root brackets tie the fin skin into the door frame.
      for (const x of [-.24, .24]) {
        bar(piece, mapping(x, .37, 0), v(x + .025, -.015, sign * .20), .008);
      }
    }
  }
  for (const sign of [-1, 1]) {
    const side = sign < 0 ? 'izquierda' : 'derecha';
    const piece = newPiece('ventana-' + side, 'Compuerta con ventana ' + side,
      [.48, .95, sign * .67], { alto: 1.10, ancho: .70, espesor: panelDepth },
      'Compuerta curva de 110 × 70 × 3,5 cm, hueca y redondeada. Ventana intercambiable y dos agarres interiores para un portador.', .55);
    piece.windowDoor = true;
    piece.sideSign = sign;
    buildDoor(piece, sign, false);
  }
  for (const sign of [-1, 1]) {
    const side = sign < 0 ? 'izquierda' : 'derecha';
    const piece = newPiece('aleron-' + side, 'Compuerta y alerón ' + side,
      [1.58, .95, sign * .67], { alto: 1.10, ancho: .70, espesor: panelDepth, salidaAleron: .70, raizAleron: .70, puntaAleron: .40 },
      'Compuerta curva, cerrada y hueca de 110 × 70 × 3,5 cm y alerón rojo trapezoidal. Salida 70 cm, raíz 70 cm y extremo 40 cm. Dos agarres para un portador.', .55);
    piece.sideSign = sign;
    buildDoor(piece, sign, true);
  }
  function setWindowShape(shape) {
    windowShape = shape;
    for (const piece of pieces.filter(p => p.windowDoor)) {
      while (piece.group.children.length) {
        const mesh = piece.group.children[0];
        piece.group.remove(mesh);
        mesh.geometry?.dispose();
      }
      piece.skins.length = piece.frames.length = piece.glazing.length = 0;
      buildDoor(piece, piece.sideSign, false);
    }
  }
  function setGlazing(enabled) {
    glazingOn = enabled;
    pieces.forEach(p => p.glazing.forEach(mesh => { mesh.visible = enabled; }));
  }
  pieces.forEach(piece => {
    piece.group.position.fromArray(piece.home.position);
    piece.group.rotation.fromArray(piece.home.rotation);
  });
  const specs = {
    revision: 'Nave 2.0 · estudio de cinco piezas', units: 'm',
    carriers: 5, pieces: 5, skins: 'Piel delgada de Cartón Plast de 2 mm como propuesta de estudio.',
    structure: 'Bastidores tubulares ligeros y asas fijadas al bastidor. Perfiles y fijaciones por validar con el constructor.',
    nose: { length: 1.70, height: 1.00, proposedWidth: 1.00, earLength: .70, earThickness: panelDepth, earOuterRadius: .50 },
    doors: { height: 1.10, width: .70, thickness: panelDepth, outerRadius: fuselageRadius, outerSag: fuselageRadius - Math.sqrt(fuselageRadius ** 2 - .55 ** 2) },
    fins: { span: .70, rootChord: .70, tipChord: .40 },
    decisions: ['Las orejas y las cuatro compuertas tienen 3,5 cm entre sus dos pieles curvas por la última medida indicada.', 'El ancho exterior de nariz de 1 m es una propuesta de estudio.', 'Las compuertas con alerones tienen pieles cerradas por indicación del usuario.', 'El acristalamiento de las ventanas se puede quitar para dejar el hueco abierto.'],
  };
  return { pieces, setWindowShape, setGlazing, specs };
}
