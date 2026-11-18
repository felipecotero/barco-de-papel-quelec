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
    if (type === 'frames') {
      mesh.userData.role = material === grip ? 'carrier-grip' : material === blue ? 'trim' : 'structure';
    }
    parent.add(mesh);
    piece[type].push(mesh);
    return mesh;
  }
  function tube(piece, points, radius = .009, material = metal, closed = false) {
    const curvePoints = closed && points[0].distanceToSquared(points[points.length - 1]) < 1e-12
      ? points.slice(0, -1) : points;
    const path = new THREE.CatmullRomCurve3(curvePoints, closed, 'centripetal');
    const mesh = add(piece, new THREE.TubeGeometry(path, Math.max(points.length * 4, 20), radius, 8, closed), material);
    mesh.userData.lengthM = path.getLength();
    mesh.userData.outerDiameterM = radius * 2;
    return mesh;
  }
  function bar(piece, a, b, radius = .009, material = metal) {
    const delta = b.clone().sub(a);
    const mesh = add(piece, new THREE.CylinderGeometry(radius, radius, delta.length(), 10), material);
    mesh.userData.lengthM = delta.length();
    mesh.userData.outerDiameterM = radius * 2;
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
    // A shield support keeps the panel beside the carrier, who faces -X.
    // The forearm rests in an open cuff; a releasable strap closes over it.
    const handY = piece.windowDoor ? .10 : .15;
    const innerSkinZ = mapping(0, .60, -panelDepth / 2).z;
    const armZ = innerSkinZ - sign * .16;
    const bodyZ = innerSkinZ - sign * .32;
    const gripX = -.20;
    const cuffX = .035;
    const cuffLift = piece.windowDoor ? .030 : 0;
    const cuffTilt = piece.windowDoor ? THREE.MathUtils.degToRad(10) : 0;
    const cuffRotation = new THREE.Quaternion().setFromAxisAngle(v(0, 0, 1), cuffTilt);
    const cuffCenter = v(cuffX, handY + cuffLift, armZ);
    const cuffPoint = (x, y, z) => v(x, y, z).applyQuaternion(cuffRotation).add(cuffCenter);
    const supportLengths = [];
    function support(a, b) {
      const mesh = bar(piece, a, b, .010);
      mesh.userData.component = 'carrier-support';
      mesh.userData.proposedTubeWallM = .001;
      supportLengths.push(mesh.userData.lengthM);
    }
    for (const x of [gripX, cuffX]) {
      // Both nodes land on the real lower cross member, below the aperture.
      const anchor = mapping(x, .37, 0);
      const elbow = v(x, anchor.y, armZ);
      const top = x === cuffX ? cuffPoint(0, -.065, 0) : v(x, handY - .065, armZ);
      support(anchor, elbow);
      support(elbow, top);
      support(anchor, top);
    }
    const primary = add(piece, new THREE.CapsuleGeometry(.016, .088, 4, 10), grip);
    primary.position.set(gripX, handY, armZ);
    Object.assign(primary.userData, {
      component: 'shield-hand-grip', lengthM: .12, outerDiameterM: .032,
      coreOuterDiameterM: .020, proposedTubeWallM: .001,
    });
    // A real bent plate under the padding, not a large structural arm loop.
    function halfRing(outerRadius, innerRadius, width, upper, material) {
      const shape = new THREE.Shape();
      const a = upper ? 0 : Math.PI, b = a + Math.PI;
      shape.absarc(0, 0, outerRadius, a, b, false);
      shape.lineTo(innerRadius * Math.cos(b), innerRadius * Math.sin(b));
      shape.absarc(0, 0, innerRadius, b, a, true);
      shape.closePath();
      const geometry = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false, curveSegments: 24, steps: 1 });
      const mesh = add(piece, geometry, material);
      mesh.rotation.y = Math.PI / 2;
      mesh.quaternion.premultiply(cuffRotation);
      mesh.position.copy(cuffPoint(-width / 2, 0, 0));
      return mesh;
    }
    const cuff = halfRing(.065, .063, .070, false, metal);
    Object.assign(cuff.userData, {
      component: 'forearm-cuff', profile: 'flat',
      lengthM: Math.PI * .064, sectionAreaM2: .070 * .002,
    });
    const pad = halfRing(.063, .053, .070, false, grip);
    Object.assign(pad.userData, { role: 'padding', component: 'forearm-cuff-padding', materialClass: 'foam' });
    const strapMaterial = new THREE.MeshStandardMaterial({ color: '#846c50', roughness: .94, side: THREE.DoubleSide });
    const strap = halfRing(.058, .055, .050, true, strapMaterial);
    Object.assign(strap.userData, {
      role: 'trim', component: 'releasable-cuff-strap', materialClass: 'webbing',
      widthM: .050, lengthM: Math.PI * .0565,
    });
    const buckle = add(piece, new THREE.BoxGeometry(.056, .016, .026), blue);
    buckle.position.copy(cuffPoint(0, .060, -sign * .022));
    buckle.quaternion.copy(cuffRotation);
    Object.assign(buckle.userData, { role: 'trim', component: 'cuff-release-buckle', materialClass: 'buckle' });
    const releaseMaterial = new THREE.MeshStandardMaterial({ color: '#d8774d', roughness: .8 });
    const release = add(piece, new THREE.BoxGeometry(.045, .007, .042), releaseMaterial);
    release.position.copy(cuffPoint(0, .071, -sign * .046));
    release.quaternion.copy(cuffRotation);
    Object.assign(release.userData, { role: 'trim', component: 'cuff-release-tab', materialClass: 'webbing' });
    // Small padded rear rest can be taken with the opposite hand temporarily.
    const rearCenter = v(cuffX + .11, handY - .11, armZ + sign * .06);
    for (const z of [-.060, .060]) {
      support(cuffPoint(.035, -.040, z), rearCenter.clone().add(v(0, 0, z)));
    }
    const rear = bar(piece, rearCenter.clone().add(v(0, 0, -.060)), rearCenter.clone().add(v(0, 0, .060)), .016, grip);
    Object.assign(rear.userData, {
      component: 'rear-cuff-grip', coreOuterDiameterM: .020, proposedTubeWallM: .001,
    });
    const carryingArm = sign < 0 ? 'R' : 'L';
    const hand = [gripX, handY, armZ];
    const freeHand = [.13, -.18, bodyZ - sign * .18];
    const shieldHands = carryingArm === 'L' ? [hand, freeHand] : [freeHand, hand];
    const twoHands = carryingArm === 'L' ? [hand, rearCenter.toArray()] : [rearCenter.toArray(), hand];
    piece.handleLengths = [.12, .12];
    piece.carrier = {
      position: [.10, -piece.home.position[1], bodyZ],
      facing: [-1, 0, 0],
      carryingArm, supportArm: carryingArm,
      hands: shieldHands,
      shieldHands,
      twoHandPositions: twoHands,
      handPosition: hand,
      freeHand,
      cuffPosition: cuffCenter.toArray(),
      cuffAxis: v(1, 0, 0).applyQuaternion(cuffRotation).toArray(),
      cuffInclinationRad: cuffTilt,
      cuffLiftM: cuffLift,
      cuffHeightWorldM: piece.home.position[1] + cuffCenter.y,
      rearGripPosition: rearCenter.toArray(),
      gripAxis: [0, 1, 0], rearGripAxis: [0, 0, 1],
      referenceHeightM: 1.70,
      gripHeightLocalM: handY,
      gripHeightWorldM: piece.home.position[1] + handY,
      gripLengthM: .12,
      gripOuterDiameterM: .032,
      cuffInnerDiameterM: .106,
      cuffWidthM: .070,
      cuffToHandDistanceM: Math.hypot(cuffX - gripX, cuffLift),
      minimumFingerClearanceM: .070,
      supportTubeLengthsM: supportLengths,
      loadPath: 'Puño y brazalete a dos nudos del travesaño inferior del bastidor; la piel no recibe el agarre.',
      status: 'Prototipo de escudo con brazalete abierto, correa liberable y mano contraria libre; apoyo opcional sobre el respaldo. Ajustar a cada intérprete y ensayar antes de fabricar. No certifica resistencia.',
    };
  }
  const nose = newPiece('nariz', 'Nariz y dos orejas', [-1.15, 1.36, 0],
    { largo: 1.70, alto: .90, ancho: 1.00, oreja: .70, espesorOreja: panelDepth },
    'Dos orejas curvas elevadas 10 cm, abiertas arriba y abajo, de 3,5 cm de espesor total. Dos agarres al bastidor. Ancho de 1 m propuesto.', .50);
  const noseY = -.5;
  const noseGripY = 1.05 - nose.home.position[1];
  const noseLowerRailY = -.40;
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
  add(nose, cone, red, 'skins').userData.materialClass = 'ripstop';
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
      const angle = Math.asin(THREE.MathUtils.clamp((y + noseY + .10) / .5, -1, 1));
      const radius = .5 - panelDepth / 2 + z;
      return v(x, radius * Math.sin(angle), sign * radius * Math.cos(angle));
    };
    shellPanel(nose, ear, eye, mapping, panelDepth, white);
    const lowerA = v(-.15, noseLowerRailY, sign * .25);
    const lowerB = v(.65, noseLowerRailY, sign * .25);
    bar(nose, lowerA, lowerB, .012);
    // The lower ear cross member carries both links into the perimeter frame.
    bar(nose, mapping(.17, .08, 0), mapping(.83, .08, 0), .008);
    bar(nose, mapping(.17, .08, 0), lowerA, .009);
    bar(nose, mapping(.68, .08, 0), lowerB, .009);
    // Grips sit near the ear's lower edge while the upper rim clears the head.
    const start = v(.12, noseGripY, sign * .25);
    const end = v(.39, noseGripY, sign * .25);
    const handle = bar(nose, start, end, .017, grip);
    handle.userData.component = 'padded-longitudinal-grip';
    handle.userData.coreOuterDiameterM = .024;
    handle.userData.proposedTubeWallM = .001;
    bar(nose, start, v(.12, noseLowerRailY, sign * .25), .012);
    bar(nose, end, v(.39, noseLowerRailY, sign * .25), .012);
  }
  nose.handleLengths = [.27, .27];
  nose.carrier = {
    position: [.43, -nose.home.position[1], 0],
    facing: [-1, 0, 0],
    hands: [[.255, noseGripY, -.25], [.255, noseGripY, .25]],
    referenceHeightM: 1.70,
    gripHeightLocalM: noseGripY,
    gripHeightWorldM: nose.home.position[1] + noseGripY,
    gripLengthM: .27,
    gripOuterDiameterM: .034,
    handSeparationM: .50,
    minimumFingerClearanceM: .061,
    referenceHeadTopM: 1.70,
    earUpperOuterAtHomeM: 1.76,
    earUpperInnerAtHomeM: 1.732,
    nominalHeadClearanceToEarRimM: .032,
    noseRoofAtHomeM: 1.86,
    status: 'Posición de transporte elevada: remate de orejas por encima de una referencia adulta de 1,70 m y dos agarres a 1,05 m del suelo, junto al borde inferior de las orejas. Ajustar y ensayar con el portador real.',
  };
  function buildDoor(piece, sign, tail) {
    const outer = roundedRect(-.35, 0, .70, 1.10, .115);
    const circular = windowShape === 'circular' || windowShape === 'circle';
    const hole = tail ? null : circular ? circle(0, .91, .13) : roundedRect(-.215, .78, .43, .26, .065);
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
    for (const y of [.14, .37, tail ? 1.0 : 1.075]) bar(piece, mapping(-.29, y, 0), mapping(.29, y, 0), .008);
    doorHandles(piece, mapping, sign);
    const supportBox = new THREE.Box3();
    for (const mesh of piece.frames.filter(mesh => mesh.userData.component)) {
      mesh.geometry.computeBoundingBox();
      mesh.updateMatrix();
      supportBox.union(mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrix));
    }
    piece.carrier.supportEnvelope = { min: supportBox.min.toArray(), max: supportBox.max.toArray() };
    if (hole) {
      const apertureBox = new THREE.Box3();
      for (const p of sampleBoundary(hole, .008)) {
        for (const z of [-panelDepth / 2, panelDepth / 2]) apertureBox.expandByPoint(mapping(p.x, p.y, z));
      }
      piece.windowDimensions = { width: circular ? .26 : .43, height: .26 };
      piece.windowOpening = {
        shape: circular ? 'circular' : 'rounded',
        widthM: circular ? .26 : .43, heightM: .26,
        bottomInputM: .78, topInputM: 1.04,
        localBounds: { min: apertureBox.min.toArray(), max: apertureBox.max.toArray() },
        bottomAtHomeM: piece.home.position[1] + apertureBox.min.y,
      };
      piece.carrier.apertureClearanceNominalM = .055 - piece.carrier.cuffLiftM;
      piece.carrier.apertureClearanceM = apertureBox.min.y - supportBox.max.y;
    }
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
      // Two thin aluminum straps fit inside the 6 mm fin sandwich.
      for (const [rootX, tipX] of [[-.24, .20], [.24, .50]]) {
        const a = top(rootX, 0).add(v(0, -.003, 0));
        const b = top(tipX, .70).add(v(0, -.003, 0));
        const delta = b.clone().sub(a);
        const mesh = add(piece, new THREE.BoxGeometry(.015, .002, delta.length()), metal);
        mesh.position.copy(a).addScaledVector(delta, .5);
        mesh.quaternion.setFromUnitVectors(v(0, 0, 1), delta.clone().normalize());
        Object.assign(mesh.userData, { component: 'fin-spar', profile: 'flat', lengthM: delta.length(), sectionAreaM2: .015 * .002 });
      }
      // Two light root brackets tie the fin skin into the door frame.
      for (const [rootX, tipX] of [[-.24, .20], [.24, .50]]) {
        const s = .04, t = s / .70;
        const node = top(rootX + (tipX - rootX) * t, s).add(v(0, -.003, 0));
        bar(piece, mapping(rootX, .37, 0), node, .008);
        const plate = add(piece, new THREE.BoxGeometry(.05, .002, .07), metal);
        plate.position.copy(node);
        // Plates/fasteners are included in the explicit joint mass allowance.
        plate.userData.role = 'joint-allowance';
        plate.userData.component = 'fin-root-plate';
        plate.userData.attachmentNode = node.toArray();
      }
    }
  }
  for (const sign of [-1, 1]) {
    const side = sign < 0 ? 'izquierda' : 'derecha';
    const piece = newPiece('ventana-' + side, 'Compuerta con ventana ' + side,
      [.48, .95, sign * .67], { alto: 1.10, ancho: .70, espesor: panelDepth },
      'Compuerta curva de 110 × 70 × 3,5 cm, hueca y redondeada. Ventana intercambiable y apoyo de medio antebrazo y empuñadura tipo escudo; el respaldo admite la otra mano. El portador camina hacia la nariz con el panel a su costado.', .55);
    piece.windowDoor = true;
    piece.sideSign = sign;
    buildDoor(piece, sign, false);
  }
  for (const sign of [-1, 1]) {
    const side = sign < 0 ? 'izquierda' : 'derecha';
    const piece = newPiece('aleron-' + side, 'Compuerta y alerón ' + side,
      [1.58, .95, sign * .67], { alto: 1.10, ancho: .70, espesor: panelDepth, salidaAleron: .70, raizAleron: .70, puntaAleron: .40 },
      'Compuerta curva, cerrada y hueca de 110 × 70 × 3,5 cm y alerón rojo trapezoidal. Salida 70 cm, raíz 70 cm y extremo 40 cm. Apoyo de medio antebrazo y empuñadura tipo escudo, con respaldo para la otra mano. El portador mira hacia la nariz y lleva el panel al costado.', .55);
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
    carriers: 5, pieces: 5, skins: 'Dos pieles de PP alveolar de 2 mm y 350 g/m² en compuertas y orejas; funda de poliéster ripstop de 140 g/m² por gajos en la nariz roja.',
    structure: 'Aluminio 6063 tubular de pared 1 mm; agarres fijados al bastidor. Diámetros y fijaciones propuestos para prototipo, pendientes de comprobación con el constructor.',
    nose: { length: 1.70, height: .90, proposedWidth: 1.00, earLength: .70, earThickness: panelDepth, earOuterRadius: .50, earLift: .10, earEndClearance: .558 },
    doors: { height: 1.10, width: .70, thickness: panelDepth, outerRadius: fuselageRadius, outerSag: fuselageRadius - Math.sqrt(fuselageRadius ** 2 - .55 ** 2) },
    fins: { span: .70, rootChord: .70, tipChord: .40 },
    decisions: ['Las orejas y las cuatro compuertas tienen 3,5 cm de espesor exterior total en sus paneles curvos por la última medida indicada.', 'El ancho exterior de nariz de 1 m es una propuesta de estudio.', 'Las compuertas con alerones tienen pieles cerradas por indicación del usuario.', 'El acristalamiento de las ventanas se puede quitar para dejar el hueco abierto.'],
  };
  return { pieces, setWindowShape, setGlazing, specs };
}
