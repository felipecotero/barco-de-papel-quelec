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
    const path = new THREE.CatmullRomCurve3(points, closed, 'centripetal');
    return add(piece, new THREE.TubeGeometry(path, Math.max(points.length * 4, 20), radius, 8, closed), material);
  }
  function bar(piece, a, b, radius = .009, material = metal) {
    const delta = b.clone().sub(a);
    const mesh = add(piece, new THREE.CylinderGeometry(radius, radius, delta.length(), 10), material);
    mesh.position.copy(a).addScaledVector(delta, .5);
    mesh.quaternion.setFromUnitVectors(v(0, 1, 0), delta.normalize());
    return mesh;
  }
  function surface(piece, shape, map, material, type = 'skins') {
    const geo = new THREE.ShapeGeometry(shape, 18);
    const positions = geo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const p = map(positions.getX(i), positions.getY(i));
      positions.setXYZ(i, p.x, p.y, p.z);
    }
    geo.computeVertexNormals();
    return add(piece, geo, material, type);
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
    const rim = outer.getPoints(32);
    strip(piece, rim, front, back, material);
    if (frame) {
      const center = outer.getPoints(32).reduce((sum, p) => sum.add(p), new THREE.Vector2()).divideScalar(rim.length);
      const inset = rim.map(p => {
        const delta = p.clone().sub(center);
        return p.clone().addScaledVector(delta.normalize(), -.014);
      });
      tube(piece, inset.map(p => mapping(p.x, p.y, 0)), .009, metal, true);
      if (hole) {
        const aperture = hole.getPoints(48);
        strip(piece, aperture, front, back, white);
        for (const z of [-depth / 2, depth / 2]) {
          tube(piece, aperture.map(p => mapping(p.x, p.y, z)), .011, blue, true);
        }
        tube(piece, aperture.map(p => mapping(p.x, p.y, 0)), .008, metal, true);
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
      bar(piece, a, b, .011);
      const c = a.clone().add(v(0, 0, -sign * .19));
      const d = b.clone().add(v(0, 0, -sign * .19));
      bar(piece, a, c, .010);
      bar(piece, b, d, .010);
      bar(piece, c, d, .014, grip);
    }
  }
  const nose = newPiece('nariz', 'Nariz y dos orejas', [-1.15, .90, 0],
    { largo: 1.70, alto: 1.00, ancho: 1.00, oreja: .70 },
    'Nariz roja redondeada y dos orejas blancas de 70 cm con ojos de buey. Dos agarres interiores para un portador. Ancho de 1 m propuesto.', .50);
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
    const mapping = (x, y, z) => v(x, y + noseY, sign * (.465 + z));
    shellPanel(nose, ear, eye, mapping, .046, white);
    const lowerA = v(-.15, .18 + noseY, sign * .25);
    const lowerB = v(.65, .18 + noseY, sign * .25);
    bar(nose, lowerA, lowerB, .012);
    bar(nose, v(.17, .24 + noseY, sign * .46), lowerA, .011);
    bar(nose, v(.68, .24 + noseY, sign * .46), lowerB, .011);
    const start = v(.12, .22 + noseY, sign * .25);
    const end = v(.39, .22 + noseY, sign * .25);
    bar(nose, start, end, .017, grip);
    bar(nose, start, v(.12, .18 + noseY, sign * .25), .012);
    bar(nose, end, v(.39, .18 + noseY, sign * .25), .012);
  }
  function buildDoor(piece, sign, tail) {
    const outer = roundedRect(-.35, 0, .70, 1.10, .115);
    const circular = tail || windowShape === 'circular' || windowShape === 'circle';
    const hole = circular ? circle(0, .705, .195) : roundedRect(-.215, .49, .43, .44, .09);
    const mapping = (x, y, z) => v(x, y - .55, sign * (z + .055 * Math.pow((y - .55) / .55, 2)));
    shellPanel(piece, outer, hole, mapping, .15, white);
    for (const x of [-.29, .29]) bar(piece, mapping(x, .10, 0), mapping(x, 1., 0), .008);
    for (const y of [.14, .37, 1.0]) bar(piece, mapping(-.29, y, 0), mapping(.29, y, 0), .008);
    doorHandles(piece, mapping, sign);
    if (tail) {
      const shape = new THREE.Shape();
      shape.moveTo(-.35, 0);
      shape.lineTo(.35, 0);
      shape.lineTo(.55, .70);
      shape.lineTo(.15, .70);
      shape.closePath();
      const top = (x, s) => v(x, -.015 + s * .045, sign * (.09 + s));
      const lower = (x, s) => v(x, -.021 + s * .045, sign * (.09 + s));
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
      [.48, .95, sign * .67], { alto: 1.10, ancho: .70, espesor: .15 },
      'Compuerta hueca blanca, curvada y redondeada. Ventana intercambiable y dos agarres interiores para un portador.', .55);
    piece.windowDoor = true;
    piece.sideSign = sign;
    buildDoor(piece, sign, false);
  }
  for (const sign of [-1, 1]) {
    const side = sign < 0 ? 'izquierda' : 'derecha';
    const piece = newPiece('aleron-' + side, 'Compuerta y alerón ' + side,
      [1.58, .95, sign * .67], { alto: 1.10, ancho: .70, espesor: .15, salidaAleron: .70, raizAleron: .70, puntaAleron: .40 },
      'Compuerta hueca de 110 × 70 × 15 cm y alerón rojo trapezoidal. Salida 70 cm, raíz 70 cm y extremo 40 cm. Dos agarres para un portador.', .55);
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
    nose: { length: 1.70, height: 1.00, proposedWidth: 1.00, earLength: .70 },
    doors: { height: 1.10, width: .70, thickness: .15 },
    fins: { span: .70, rootChord: .70, tipChord: .40 },
    decisions: ['Se representa 15 cm de espesor de compuerta por la última medida indicada.', 'El ancho exterior de nariz de 1 m es una propuesta de estudio.', 'Los ojos de buey de cola son una interpretación del alerón sobre ventana.', 'El acristalamiento se puede quitar para dejar el hueco abierto.'],
  };
  return { pieces, setWindowShape, setGlazing, specs };
}
