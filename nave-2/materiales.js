// Quantities are developed mesh areas and actual member centerline lengths, in metres.
// These are preliminary mass estimates, not a structural or handling certification.
export const MATERIALS = Object.freeze({
  pp: { label: 'PP alveolar 2 mm · 350 g/m² por piel', kgM2: .350, source: 'https://www.roplast.com.tr/' },
  fabric: { label: 'Ripstop poliéster PU 200D · 140 g/m²', kgM2: .140, source: 'https://www.ottertex.com/ripstop' },
  aluminum: { label: 'Aluminio 6063 · pared de tubo 1 mm', kgM3: 2700, source: 'https://www.hydro.com/globalassets/08-about-hydro/hydro-worldwide/austria/nenzing/alloy-data-sheets/hydro-en-aw-6063.pdf' },
  glazing: { label: 'A-PET 0,5 mm · 665 g/m²', kgM2: .665, source: 'https://www.display.3acomposites.com/en/products/by-brand/lumex-r/' },
});
const tubeDiameters = [.016, .020, .025];
export function tubeKgM(diameter, wall = .001) {
  return MATERIALS.aluminum.kgM3 * Math.PI / 4 * (diameter ** 2 - (diameter - 2 * wall) ** 2);
}
export function meshArea(mesh) {
  const g = mesh.geometry, p = g.attributes.position, index = g.index;
  let area = 0;
  for (let i = 0, count = index ? index.count : p.count; i < count; i += 3) {
    const a = index ? index.getX(i) : i, b = index ? index.getX(i + 1) : i + 1, c = index ? index.getX(i + 2) : i + 2;
    const ux = p.getX(b) - p.getX(a), uy = p.getY(b) - p.getY(a), uz = p.getZ(b) - p.getZ(a);
    const vx = p.getX(c) - p.getX(a), vy = p.getY(c) - p.getY(a), vz = p.getZ(c) - p.getZ(a);
    area += Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx) / 2;
  }
  return area;
}
function stockDiameter(d) { return tubeDiameters.find(n => n >= d - .00001) || d; }
export function estimateShip(pieces, glazing = true) {
  const result = pieces.map((piece, i) => {
    let ppArea = 0, fabricArea = 0, glazingArea = 0, flatLength = 0, flatMass = 0, plateVolume = 0;
    const tubes = new Map();
    const addTube = (diameter, length) => {
      const d = stockDiameter(diameter);
      tubes.set(d, (tubes.get(d) || 0) + length);
    };
    for (const mesh of piece.skins) {
      const area = meshArea(mesh);
      if (mesh.userData.materialClass === 'ripstop') fabricArea += area;
      else ppArea += area;
    }
    if (glazing) for (const mesh of piece.glazing) glazingArea += meshArea(mesh);
    for (const mesh of piece.frames) {
      const d = mesh.userData;
      if (d.role === 'trim') continue;
      if (d.profile === 'plate') {
        plateVolume += d.materialVolumeM3;
      } else if (d.profile === 'flat' && d.component === 'forearm-cuff') {
        plateVolume += d.lengthM * d.sectionAreaM2;
      } else if (d.profile === 'flat') {
        flatLength += d.lengthM;
        flatMass += d.lengthM * d.sectionAreaM2 * MATERIALS.aluminum.kgM3;
      } else if (d.role === 'carrier-grip') {
        addTube(d.coreOuterDiameterM, d.lengthM);
      } else if (d.role === 'structure' && Number.isFinite(d.lengthM)) {
        addTube(d.outerDiameterM, d.lengthM);
      }
    }
    const tubeItems = [...tubes].sort((a, b) => a[0] - b[0]).map(([diameter, length]) => ({ diameter, length, mass: tubeKgM(diameter) * length }));
    const lines = [
      { id: 'pp', label: 'Dos pieles de PP y remates', quantity: ppArea, unit: 'm²', mass: ppArea * MATERIALS.pp.kgM2 },
      ...(fabricArea ? [{ id: 'fabric', label: 'Funda roja de ripstop por gajos', quantity: fabricArea, unit: 'm²', mass: fabricArea * MATERIALS.fabric.kgM2 }] : []),
      ...tubeItems.map(t => ({ id: 'tube-' + t.diameter, label: 'Aluminio Ø' + Math.round(t.diameter * 1000) + ' × 1 mm', quantity: t.length, unit: 'm', mass: t.mass })),
      ...(flatLength ? [{ id: 'spar', label: 'Largueros de alerón · pletina 15 × 2 mm', quantity: flatLength, unit: 'm', mass: flatMass }] : []),
      ...(plateVolume ? [{ id: 'cradle', label: 'Abrazadera y apoyos de aluminio', quantity: plateVolume * 1e6, unit: 'cm³', mass: plateVolume * MATERIALS.aluminum.kgM3 }] : []),
      ...(glazingArea ? [{ id: 'glazing', label: 'Ventana A-PET de 0,5 mm', quantity: glazingArea, unit: 'm²', mass: glazingArea * MATERIALS.glazing.kgM2 }] : []),
      // Allowances are stated mass budgets, not invented foam/paint densities.
      { id: 'padding', label: i === 0 ? 'Acolchado, ribetes y tapas · provisión' : 'Acolchado, correa, hebilla y tapas · provisión', quantity: 1, unit: 'juego', mass: .12 },
      { id: 'joints', label: 'Uniones, tornillería y placas · provisión', quantity: 1, unit: 'juego', mass: i === 0 ? .30 : i > 2 ? .25 : .22 },
      { id: 'finish', label: 'Acabado, adhesivo y costuras · provisión', quantity: 1, unit: 'juego', mass: i === 0 ? .20 : i > 2 ? .18 : .14 },
    ];
    const subtotal = lines.reduce((n, l) => n + l.mass, 0), reserve = subtotal * .15;
    return { id: piece.id, name: piece.name, lines, ppArea, fabricArea, glazingArea, tubes: tubeItems, subtotal, reserve, total: subtotal + reserve };
  });
  return { pieces: result, total: result.reduce((n, p) => n + p.total, 0), reserveFraction: .15, glazing };
}
