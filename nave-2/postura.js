import { prepareNaveHumanFigures } from './humanos-nave.js?v=N20-3';

// Anatomy from the workshop's existing MakeHuman CC0 assets. This is a
// dimensional carrying study, not a motion-capture animation or load approval.
export async function createCarrierStudy(THREE, pieces, invalidate = () => {}) {
  const figures = await prepareNaveHumanFigures({ THREE });
  const figure = figures.create('Portador_nave', '#8ca69c');
  const root = new THREE.Group();
  root.name = 'Referencia humana · pieza seleccionada';
  root.userData.isCarrierStudy = true;
  root.visible = false;
  root.add(figure.root);
  let selected = 0;
  let poseIndex = -1;
  let info = null;
  let holdMode = 'shield';

  function poseSelected() {
    if (poseIndex === selected) return;
    const piece = pieces[selected];
    const cfg = piece.carrier;
    if (!cfg || !Array.isArray(cfg.hands) || cfg.hands.length !== 2) {
      throw new Error('Falta la posición de los dos agarres de esta pieza.');
    }
    const isShield = piece.id !== 'nariz' && Boolean(cfg.carryingArm || cfg.supportArm);
    const bodyOffsetM = isShield && holdMode === 'two-hands' ? .22 : 0;
    const height = cfg.referenceHeightM || 1.70;
    const s = height / 1.70;
    const base = [...cfg.position];
    base[0] += bodyOffsetM;
    const ground = base[1];
    const crouch = cfg.gripHeightWorldM < .95 ? .065 : 0;
    const hip = [base[0], ground + .91 * s - crouch, base[2]];
    const shoulder = [base[0], ground + 1.40 * s - crouch, base[2]];
    const head = [base[0] - .015, ground + 1.625 * s - crouch, base[2]];
    // Facing -X: anatomical left is +Z. Keep the same mapping on both sides.
    const arm = cfg.carryingArm || cfg.supportArm;
    const rawHands = isShield
      ? holdMode === 'two-hands' ? cfg.twoHandPositions : cfg.shieldHands || cfg.hands
      : cfg.hands.map(a => [...a]).sort((a, b) => b[2] - a[2]);
    if (!Array.isArray(rawHands) || rawHands.length !== 2) throw new Error('Faltan las posiciones de este modo de agarre.');
    const hands = rawHands.map(a => [...a]);
    const holders = isShield
      ? { L: arm === 'L' || holdMode === 'two-hands', R: arm === 'R' || holdMode === 'two-hands' }
      : { L: true, R: true };
    const handDirections = {}, elbowHints = {}, palmSideOffsets = {}, gripAxes = {};
    if (isShield) {
      handDirections[arm] = [-1, 0, 0];
      elbowHints[arm] = [1, 0, 0];
      palmSideOffsets[arm] = 0;
      gripAxes[arm] = [0, 1, 0];
      const freeArm = arm === 'L' ? 'R' : 'L';
      if (holdMode === 'shield') {
        handDirections[freeArm] = [0, -1, 0];
        gripAxes[freeArm] = [1, 0, 0];
      } else {
        gripAxes[freeArm] = cfg.rearGripAxis || [0, 1, 0];
      }
    } else {
      // Longitudinal nose grips: keep the elbows beside the torso, below
      // the portholes, with the wrists above the padded rail.
      for (const side of ['L', 'R']) {
        handDirections[side] = [-.35, -.94, 0];
        elbowHints[side] = [1, -.5, 0];
        palmSideOffsets[side] = 0;
        gripAxes[side] = [1, 0, 0];
      }
    }
    const feet = {};
    for (const side of ['L', 'R']) {
      const sign = side === 'L' ? 1 : -1;
      const x = base[0] - .02 + sign * .035;
      const z = base[2] + sign * .14 * s;
      feet[side] = {
        center: [x, ground + .02925, z],
        ankle: [x + .055, ground + .07 * s, z],
      };
    }
    info = figure.pose({
      height, hip, shoulder, head,
      face: cfg.facing || [-1, 0, 0],
      arms: { L: hands[0], R: hands[1] }, feet,
      holder: holders, gripAxis: [1, 0, 0],
      handDirections, elbowHints, palmSideOffsets, gripAxes,
    });
    info.carrierPose = { bodyOffsetM, groundPosition: [...base], holdMode: isShield ? holdMode : 'two-hands', carryingArm: arm || null };
    root.userData.pieceId = piece.id;
    root.userData.referenceHeightM = height;
    root.userData.gripHeightWorldM = cfg.gripHeightWorldM;
    poseIndex = selected;
  }

  // Root stays outside piece.group: it is neither a skin, a construction
  // member, a selectable part, nor an addition to the calculated mass.
  function update() {
    if (!root.visible) return;
    const piece = pieces[selected];
    poseSelected();
    piece.group.updateWorldMatrix(true, false);
    piece.group.matrixWorld.decompose(root.position, root.quaternion, root.scale);
    root.updateMatrixWorld(true);
  }
  function setSelected(index) {
    if (!Number.isInteger(index) || index < 0 || index >= pieces.length) return;
    selected = index;
    if (root.visible) { poseSelected(); update(); }
    invalidate();
  }
  function setVisible(value) {
    root.visible = Boolean(value);
    if (root.visible) { poseSelected(); update(); }
    invalidate();
  }
  function setHoldMode(value) {
    if (!['shield', 'two-hands'].includes(value)) return;
    if (holdMode !== value) { holdMode = value; poseIndex = -1; }
    if (root.visible) { poseSelected(); update(); }
    invalidate();
  }
  function getInfo() {
    return { selected, pieceId: pieces[selected].id, visible: root.visible, holdMode, ...info };
  }
  function dispose() {
    root.removeFromParent();
    const geometries = new Set(), materials = new Set(), textures = new Set();
    figure.meshes.forEach(mesh => {
      geometries.add(mesh.geometry);
      (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(material => {
        materials.add(material);
        if (material.map) textures.add(material.map);
      });
    });
    materials.forEach(material => material.dispose());
    textures.forEach(texture => texture.dispose());
    geometries.forEach(geometry => geometry.dispose());
    figure.skeleton.dispose();
  }
  return { root, setSelected, setVisible, setHoldMode, update, getInfo, dispose };
}
