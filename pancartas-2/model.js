/* Quelec · Carteles 2 · organic two-sided sign study. All model units are metres.
 * The graphic on each side is the same upright image. The rear has its own
 * outward winding and reversed U coordinates; it is not a mirrored backface.
 */
export const DEFAULT_DESIGNS = Object.freeze([
  { id: 'osito', code: 'C2-01', name: 'Osito de peluche', orientation: 'portrait', artUrl: 'assets/01-osito.jpg', paperColor: '#f6f4ef', profile: 0 },
  { id: 'lapices', code: 'C2-02', name: 'Lápices de colores', orientation: 'landscape', artUrl: 'assets/02-lapices.jpg', paperColor: '#f3f2ed', profile: 1 },
  { id: 'balon', code: 'C2-03', name: 'Balón de fútbol', orientation: 'portrait', artUrl: 'assets/03-balon.jpg', paperColor: '#f4f3ef', profile: 2 },
  { id: 'tiempo', code: 'C2-04', name: 'Reloj de arena', orientation: 'portrait', artUrl: 'assets/04-tiempo.jpg', paperColor: '#681126', profile: 3 },
  { id: 'sonrisa', code: 'C2-05', name: 'Sonrisa', orientation: 'landscape', artUrl: 'assets/05-sonrisa.jpg', paperColor: '#f6f4ef', profile: 4 },
]);

// Five shallow, asymmetric offcuts. Coordinates run around each boundary;
// their inward bends are broad and blunt, rather than points or sharp hooks.
const PROFILES = [
  [[.09,.03],[.40,.07],[.88,.01],[.98,.14],[.94,.42],[1,.76],[.88,.96],[.60,.98],[.29,.94],[.05,1],[0,.76],[.04,.47],[.01,.19]],
  [[.03,.04],[.27,.09],[.53,.13],[.91,.03],[.99,.13],[.96,.40],[.99,.78],[.89,.96],[.58,.99],[.32,.94],[.06,.97],[.01,.79],[.07,.51],[0,.24]],
  [[.11,0],[.40,.04],[.69,.01],[.91,.09],[.99,.35],[.95,.61],[1,.85],[.84,.99],[.57,.94],[.30,1],[.07,.87],[0,.65],[.05,.36]],
  [[.01,.07],[.29,.02],[.60,.09],[.95,0],[.99,.27],[.94,.52],[.98,.86],[.84,.99],[.54,.95],[.25,1],[.03,.87],[.07,.58],[0,.29]],
  [[.08,0],[.39,.07],[.66,.03],[.98,.08],[.93,.39],[1,.69],[.90,.94],[.62,.99],[.36,.94],[.03,1],[.07,.71],[0,.42]],
];

function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}

export function createOutline(THREE, width, height, profile = 0) {
  const points = PROFILES[((profile % PROFILES.length) + PROFILES.length) % PROFILES.length];
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p[0], p[1], 0)), true, 'centripetal');
  const samples = curve.getPoints(240).slice(0, -1);
  const box = new THREE.Box3().setFromPoints(samples), size = box.getSize(new THREE.Vector3());
  const outline = samples.map(p => [(p.x - box.min.x) / size.x * width - width / 2, (p.y - box.min.y) / size.y * height - height / 2]);
  const shape = new THREE.Shape();
  outline.forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y));
  shape.closePath();
  // Expose a genuinely contained rectangle for displaying the complete source.
  // No source image pixels need to be cropped to fit an irregular corner.
  let inset = .10;
  for (; inset <= .25; inset += .005) {
    let contained = true;
    for (let a = 0; a <= 16 && contained; a++) for (let b = 0; b <= 16; b++) {
      const x = (-.5 + inset + (1 - 2 * inset) * a / 16) * width;
      const y = (-.5 + inset + (1 - 2 * inset) * b / 16) * height;
      if (!pointInPolygon([x, y], outline)) { contained = false; break; }
    }
    if (contained) break;
  }
  inset = Math.min(.25, Math.ceil(inset * 1000) / 1000);
  return { shape, outline, artSafeRect: { x: inset, y: inset, width: 1 - inset * 2, height: 1 - inset * 2 }, artInset: inset };
}

export function buildPlacards(THREE, options = {}) {
  const designs = options.designs || DEFAULT_DESIGNS;
  const textures = options.textures || new Map();
  const root = new THREE.Group(); root.name = 'Carteles_2_cinco_doble_cara';
  const boards = [];
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const partColors = { panel: '#dfd2ad', art: '#d8e5eb', band: '#84b6ab', pole: '#b88e61', spacers: '#c4a5d1', edge: '#dec49b', hardware: '#9eaeb5' };
  const paper = new THREE.MeshStandardMaterial({ color: '#e9e4d6', roughness: .96 });
  const edgeMaterial = new THREE.MeshStandardMaterial({ color: '#c7b48f', roughness: 1, side: THREE.DoubleSide });
  const wood = new THREE.MeshStandardMaterial({ color: '#b99b70', roughness: .89 });
  const metal = new THREE.MeshStandardMaterial({ color: '#9eabad', roughness: .45, metalness: .55 });

  function faceGeometry(shape, width, height, rear = false) {
    const g = new THREE.ShapeGeometry(shape);
    const p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const u = (p.getX(i) + width / 2) / width;
      uv.setXY(i, rear ? 1 - u : u, (p.getY(i) + height / 2) / height);
    }
    if (rear) {
      const index = g.index;
      for (let i = 0; i < index.count; i += 3) {
        const b = index.getX(i + 1); index.setX(i + 1, index.getX(i + 2)); index.setX(i + 2, b);
      }
      g.computeVertexNormals();
    }
    return g;
  }
  function plateGeometry(shape, depth) {
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 1, steps: 1 });
    g.translate(0, 0, -depth / 2); return g;
  }
  function cylinderBetween(radius, length) { return new THREE.CylinderGeometry(radius, radius, length, 12); }

  for (let index = 0; index < designs.length; index++) {
    const design = { ...DEFAULT_DESIGNS[index % DEFAULT_DESIGNS.length], ...designs[index] };
    const orientation = design.orientation === 'landscape' ? 'landscape' : 'portrait';
    const width = design.width || (orientation === 'landscape' ? .90 : .70);
    const height = design.height || (orientation === 'landscape' ? .70 : 1.00);
    const panelBottom = 1.20, panelCenterY = panelBottom + height / 2;
    const poleHeight = 1.80, panelThickness = .003, cavity = .021, shellDepth = .027;
    const geometry = createOutline(THREE, width, height, design.profile);
    const group = new THREE.Group(); group.name = design.code + '_' + design.id;
    group.position.set((index - (designs.length - 1) / 2) * 1.14, 0, (index % 2) * .05);
    group.userData.boardId = design.id; root.add(group);
    const board = {
      id: design.id, name: design.name, code: design.code, root: group, group,
      skins: [], faceMeshes: [], groups: [], width, height, totalHeight: panelBottom + height,
      panelBottom, panelCenterY, artUrl: design.artUrl, orientation, outline: geometry.outline,
      artSafeRect: geometry.artSafeRect, artInset: geometry.artInset,
      design: { ...design, orientation, width, height, artSafeRect: geometry.artSafeRect, artInset: geometry.artInset },
      dimensions: { width, height, totalHeight: panelBottom + height, panelThickness, cavity, shellDepth, pole: [.025, .015, poleHeight] },
      description: 'Retazo de contorno irregular, dos caras con la misma ilustración derecha y mango oculto entre pieles. Envolvente nominal propuesta; no es patrón de corte ni montaje aprobado.',
      home: { position: group.position.toArray(), rotation: [0, 0, 0] },
    };
    boards.push(board);
    const makePart = (id, title, type, minStage, offset) => {
      const g = new THREE.Group(); g.name = design.code + '_' + id;
      g.userData = { title, type, minStage, offset }; group.add(g); board.groups.push(g); return g;
    };
    const add = (parent, geo, material, pos, surface = false) => {
      const m = new THREE.Mesh(geo, material); m.name = parent.name + '_' + parent.children.length;
      m.position.copy(V(...pos)); m.castShadow = true; m.receiveShadow = true;
      m.userData = { boardId: design.id, basePosition: [...pos], baseMaterial: material, surfaceTransparency: surface };
      parent.add(m); if (surface) board.skins.push(m); return m;
    };
    const front = makePart('panel_A', 'Primera piel · PP alveolar de 3 mm', 'panel', 1, [0, 0, 0]);
    add(front, plateGeometry(geometry.shape, panelThickness), paper, [0, panelCenterY, 0], true);
    const band = makePart('banda', 'Banda interior · 60 × 3 mm', 'band', 1, [0, 0, -.07]);
    const bandBottom = panelBottom + height * .21, bandTop = Math.min(poleHeight - .04, panelBottom + height * .82);
    add(band, new THREE.BoxGeometry(.060, bandTop - bandBottom, .003), paper, [0, (bandTop + bandBottom) / 2, -.003], true);
    const pole = makePart('mango', 'Mango · listón 25 × 15 × 1800 mm', 'pole', 2, [.10, 0, -.16]);
    add(pole, new THREE.BoxGeometry(.025, poleHeight, .015), wood, [0, poleHeight / 2, -.012]);
    // Compact double-headed through connections fit inside the 21 mm cavity.
    // They explain a load path, not an approved catalogue fastener or capacity.
    const hardware = makePart('uniones', 'Dos uniones pasantes compactas · propuesta para prototipo', 'hardware', 2, [0, 0, 0]);
    for (const y of [panelBottom + .30, panelBottom + .45]) {
      const shaft = add(hardware, cylinderBetween(.002, .021), metal, [0, y, -.009]);
      shaft.rotation.x = Math.PI / 2; shaft.userData.explodeZ = .07;
      const head = add(hardware, cylinderBetween(.005, .0015), metal, [0, y, .00075]);
      head.rotation.x = Math.PI / 2; head.userData.explodeZ = .09;
      const rearHead = add(hardware, cylinderBetween(.005, .0015), metal, [0, y, -.02025]);
      rearHead.rotation.x = Math.PI / 2; rearHead.userData.explodeZ = -.12;
    }
    const spacers = makePart('separadores', 'Cuatro separadores · cámara de 21 mm', 'spacers', 3, [0, 0, -.045]);
    for (const x of [-width * .13, width * .13]) for (const y of [-height * .25, height * .25]) {
      add(spacers, new THREE.BoxGeometry(.015, .045, cavity), wood, [x, panelCenterY + y, -.012], false);
    }
    // A thin perimeter strip gives the offcut its cardboard-like edge. Its
    // bottom slot stays open for the listón, so the pole does not pierce it.
    const edge = makePart('canto', 'Cierre del canto · ranura inferior para el mango', 'edge', 3, [0, 0, -.045]);
    const vertices = [], indices = [];
    for (let i = 0; i < geometry.outline.length; i++) {
      const a = geometry.outline[i], b = geometry.outline[(i + 1) % geometry.outline.length];
      if (Math.abs((a[0] + b[0]) / 2) < .018 && (a[1] + b[1]) / 2 < -height * .25) continue;
      const n = vertices.length / 3;
      vertices.push(a[0], a[1], -.0015, a[0], a[1], -.0225, b[0], b[1], -.0015, b[0], b[1], -.0225);
      indices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
    }
    const edgeGeo = new THREE.BufferGeometry(); edgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); edgeGeo.setIndex(indices); edgeGeo.computeVertexNormals();
    add(edge, edgeGeo, edgeMaterial, [0, panelCenterY, 0], true);
    const back = makePart('panel_B', 'Segunda piel · PP alveolar de 3 mm', 'panel', 4, [-.09, 0, -.16]);
    add(back, plateGeometry(geometry.shape, panelThickness), paper, [0, panelCenterY, -.024], true);
    const tx = textures instanceof Map ? textures.get(design.id) || textures.get(design.artUrl) : Array.isArray(textures) ? textures[index] : textures[design.id];
    for (let face = 0; face < 2; face++) {
      const part = makePart('arte_' + (face ? 'B' : 'A'), 'Cara ' + (face ? 'B' : 'A') + ' · ' + design.name, 'art', 4, face ? [-.09, 0, -.25] : [.10, 0, .14]);
      const material = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .97, map: tx || null, side: THREE.FrontSide });
      const m = add(part, faceGeometry(geometry.shape, width, height, face === 1), material, [0, panelCenterY, face ? -.0257 : .0017], true);
      m.userData.face = face ? 'B' : 'A'; m.userData.artUrl = design.artUrl; m.name = design.code + '_Cara_' + m.userData.face + '_' + design.id;
      board.faceMeshes.push(m);
    }
    function setState(explode = 0, stage = 4, colors = false) {
      const e = Math.max(0, Math.min(1, Number(explode) || 0));
      const s = Math.max(1, Math.min(4, Number(stage) || 4));
      for (const part of board.groups) {
        part.visible = part.userData.minStage <= s;
        part.position.copy(V(...part.userData.offset).multiplyScalar(e));
        part.traverse(m => {
          if (!m.isMesh) return;
          m.position.copy(V(...m.userData.basePosition)); m.position.z += (m.userData.explodeZ || 0) * e;
          if (colors) {
            if (!m.userData.studyMaterial) {
              m.userData.studyMaterial = m.userData.baseMaterial.clone();
              m.userData.studyMaterial.map = null;
              m.userData.studyMaterial.color.set(partColors[part.userData.type] || '#c7c7b8');
            }
            m.material = m.userData.studyMaterial;
          } else m.material = m.userData.baseMaterial;
        });
      }
      group.updateMatrixWorld(true);
    }
    board.setState = setState; setState();
  }
  const setState = (explode = 0, stage = 4, colors = false) => boards.forEach(board => board.setState(explode, stage, colors));
  const specs = {
    revision: 'Carteles 2 · PA2-01', units: 'm', count: boards.length, facesPerBoard: 2,
    sameUprightArtworkBothSides: true, oldModuleRetained: true,
    panelThicknessM: .003, cavityM: .021, nominalShellDepthM: .027, overallDepthWithArtworkM: .0274,
    construction: 'Dos pieles de PP de 3 mm, cámara de 21 mm, banda interior y listón de 25 × 15 × 1800 mm. Uniones pasantes compactas dibujadas como propuesta; confirmar herrajes, estabilidad y manejo en prototipo.',
    dimensionsStatus: 'Envolventes nominales de estudio; no son patrones de corte ni una aprobación de fabricación.',
  };
  return { root, boards, pieces: boards, setState, specs };
}
