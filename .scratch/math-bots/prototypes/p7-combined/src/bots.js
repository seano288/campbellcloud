// TORQUE and ANVIL: P2's part-by-part construction, P1's bevels, welds, tyres and toothed belt, and armour plates
// that are tessellated, separately posed meshes so the damage atlas can deform them.
import * as THREE from 'three/webgpu';
import { Kit, M, rng } from './kit.js';
import { revolve, plate as p1Plate, bolt as p1Bolt, loopPath, mul, T as Tr, RX, RY, RZ, circle, Rng } from './geo.ts';
import { damageMaterials } from './materials.js';
import { PANELS, T_PLATES, TORQUE_DIM, ANVIL_DIM } from './sim.ts';
import { drumShell } from './drum.js';
const PI = Math.PI;

// P1's tyre: chevron lugs as real raised blocks on a shouldered carcass, machined hub, centre cap. Axle along X.
function wheel(mats, r, w, seed, { lugs = 15, hub = 'steel' } = {}) {
  const k = new Kit(seed), F = RY(PI / 2), R = mul(F, RX(PI / 2)), rn = new Rng(seed), body = r - .008;
  revolve(k.gb('rubber'), [[r * .46, -w / 2 - .002], [body - .012, -w / 2], [body, -w / 2 + .012], [body, w / 2 - .012], [body - .012, w / 2], [r * .46, w / 2 + .002]], { M: R, segs: 40, b: .004, band: .005 });
  for (let i = 0; i < lugs; i++) for (const side of [-1, 1]) {
    const a = ((i + (side > 0 ? .5 : 0)) / lugs) * PI * 2, wr = 1 - rn.f() * .14, h = .36 * PI * 2 * r / lugs, l = w * .46, sk = side * h * .9;
    p1Plate(k.gb('rubber'), { poly: [[-l / 2, -h / 2 - sk * .5], [l / 2, -h / 2 + sk * .5], [l / 2, h / 2 + sk * .5], [-l / 2, h / 2 - sk * .5]], t: .010 * wr, b: .0016, cr: .0015, lean: true, wear: 1, M: mul(F, RZ(a), Tr(body + .008 * wr, 0, side * w * .245), RY(PI / 2)) });
  }
  const hw = w / 2 + .005;
  revolve(k.gb(hub), [[r * .47, -hw], [r * .47, hw - .004], [r * .40, hw], [r * .22, hw - .006], [r * .19, hw + .012], [0, hw + .012]], { M: R, segs: 24, b: .0025, band: .006 });
  revolve(k.gb(hub), [[r * .47, hw], [r * .47, -hw + .004], [r * .40, -hw], [r * .22, -hw + .006], [r * .19, -hw - .012], [0, -hw - .012]], { M: mul(R, RX(PI)), segs: 24, b: .0025, band: .006 });
  for (const s of [1, -1]) for (const [y, z] of circle([0, 0], r * .31, 6)) k.bolt([s * hw, y, z], [s, 0, 0], .0065, 'bolt', false);
  return k.build(mats);
}

/** Build one armour plate as its own posed group. fn(kit, hz) adds bolts and backing in plate space. */
function plateMesh(atlas, i, pl, mats, key, poly, fn, { pitch = .014 } = {}) {
  const k = new Kit(100 + i * 7); k.plateMode = true;
  k.grid(key, poly, pl.t, { pitch });
  fn?.(k, pl.t / 2);
  return k.build(mats, { plateAtlasUV: (x, y) => atlas.uv(i, x, y) });
}
const chamfered = (hw, hh, c) => [[-hw + c, -hh], [hw - c, -hh], [hw, -hh + c], [hw, hh - c], [hw - c, hh], [-hw + c, hh], [-hw, hh - c], [-hw, -hh + c]];
const perimeterBolts = (k, hw, hh, hz, nx, ny, r, ins = .03) => {
  for (const s of [-1, 1]) { k.boltRow([-hw + ins + .02, s * (hh - ins), hz], [hw - ins - .02, s * (hh - ins), hz], nx, [0, 0, 1], r, 'bolt'); if (ny > 2) k.boltRow([s * (hw - ins), -hh + ins + .06, hz], [s * (hw - ins), hh - ins - .06, hz], ny - 2, [0, 0, 1], r, 'bolt'); }
};
/** Painted art on the plates, drawn upright in plate space, in the atlas's own layout. */
export function livery(atlas, draw) {
  const c = document.createElement('canvas'), S = 1024; c.width = c.height = S;
  const x = c.getContext('2d');
  const on = (i, fn) => { const r = atlas.rects[i], s = S / atlas.m; x.save(); x.beginPath(); x.rect(r.x * s, r.y * s, r.w * s, r.h * s); x.clip(); x.translate((r.x + r.w / 2) * s, (r.y + r.h / 2) * s); x.scale(s, s); fn(x); x.restore(); };
  draw(on);
  const t = new THREE.CanvasTexture(c); t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = 8;
  return t;
}
const stencil = (x, text, h, col, cx = 0, cy = 0, rot = 0) => { x.save(); x.translate(cx, cy); x.rotate(rot); x.scale(1, -1); x.fillStyle = col; x.font = `900 ${h}px "Arial Black","Helvetica Neue",Arial,sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 0, 0); x.restore(); };
const hazard = (x, a, b, w, h, c0, c1) => { x.fillStyle = c0; x.fillRect(a, b, w, h); x.fillStyle = c1; x.beginPath(); for (let u = -h * 2; u < w + h; u += h * 1.5) { x.moveTo(a + u, b); x.lineTo(a + u + h * .75, b); x.lineTo(a + u + h * .75 + h, b + h); x.lineTo(a + u + h, b + h); } x.fill(); };

export function buildTorque(mats, T, atlas) {
  const root = new THREE.Group(); root.name = 'TORQUE';
  const model = new THREE.Group(); model.position.y = -TORQUE_DIM.y0; root.add(model);
  const k = new Kit(11);
  // Belly and rails
  k.box('hard', [0, .052, -.04], [.70, .012, .84], [0, 0, 0], { chamfer: .04 });
  const rail = [[-.50, .055], [.36, .055], [.44, .10], [.40, .225], [-.28, .30], [-.50, .245]];
  k.side('blue', .345, .022, rail, { ring: .05 }); k.side('blue', -.345, .022, rail, { ring: .05 });
  // Slab side armour: straight-topped Hardox strips and uprights leaving windows on wheel and chain
  for (const s of [1, -1]) {
    const x = s * .505, n = [s, 0, 0];
    k.box('blue', [x, .232, -.05], [.022, .05, 1.0], [0, 0, 0], { ring: .025, grime: .9 });
    k.box('hard', [x, .052, -.05], [.022, .034, 1.0], [0, 0, 0], { ring: .02, grime: 1 });
    for (const z of [-.54, -.04, .44]) { k.box('orange', [x, .14, z], [.024, .15, .075], [0, 0, 0], { ring: .02 }); k.boltRow([x + s * .014, .09, z], [x + s * .014, .19, z], 3, n, .0085); }
    k.boltRow([x + s * .012, .232, -.5], [x + s * .012, .232, .4], 11, n, .0085);
    // standoffs tying the slab to the inner rail
    for (const z of [-.42, -.04, .36]) k.box('steel', [s * .43, .232, z], [.13, .03, .03], [0, 0, 0], { ring: .008 });
    k.weld([[x - s * .011, .208, -.54], [x - s * .011, .208, .44]]);
    // front corner cheek
    k.side('hard', x, .022, [[.44, .035], [.62, .05], [.62, .13], [.44, .257]], { ring: .03 });
  }
  // Forward weapon forks, bright orange, thick and chewed
  const fork = [[-.08, .075], [.50, .095], [.635, .165], [.615, .25], [.50, .295], [-.08, .262]];
  for (const x of [.262, -.262]) {
    k.side('hard', x + Math.sign(x) * .024, .012, [[.42, .11], [.60, .135], [.61, .24], [.42, .27]], { ring: .03 });
    for (const [z, y] of [[.45, .13], [.45, .24], [.56, .16], [.56, .225]]) k.bolt([x + Math.sign(x) * .03, y, z], [Math.sign(x), 0, 0], .0085);
    for (const z of [-.04, .08, .2, .32]) k.bolt([x + Math.sign(x) * .018, .09 + (z + .08) * .03, z], [Math.sign(x), 0, 0], .007);
    // pillow block
    k.box('steel', [x, .18, .515], [.078, .10, .10], [0, 0, 0], { chamfer: .012, ring: .012 });
    for (const [y, z] of [[.145, .485], [.145, .545], [.215, .485], [.215, .545]]) k.bolt([x + Math.sign(x) * .04, y, z], [Math.sign(x), 0, 0], .0065, 'bolt', false);
  }
  // Decks
  const tiltF = Math.atan2(.30 - .232, .46);
  // Wedge lip under the drum: scarred Hardox
  k.box('hard', [0, .052, .545], [.46, .014, .26], [.42, 0, 0], { chamfer: .02, ring: .05, grime: .9 });
  for (let i = 0; i < 6; i++) k.bolt([-.18 + i * .072, .096, .435], [0, .93, -.3], .0075);
  k.weld([[-.225, .082, .43], [.225, .082, .43]]);
  const N2 = [0, .99, .11];
  // Titanium hatch, scorched, with quarter-turn fasteners
  k.box('ti', [-.11, .308, -.3], [.3, .007, .26], [-.11, 0, 0], { chamfer: .02, ring: .02 });
  k.boltRow([-.24, .318, -.2], [.02, .318, -.2], 5, N2, .0065); k.boltRow([-.24, .294, -.41], [.02, .294, -.41], 5, N2, .0065);
  // Vent: bars over a black cavity
  k.box('cavity', [.2, .304, -.3], [.2, .004, .2], [-.11, 0, 0], { bevel: .001, ring: .002 });
  for (let i = 0; i < 9; i++) k.box('steel', [.2, .315, -.385 + i * .0212], [.2, .009, .0085], [-.11, 0, 0], { bevel: .001, ring: .002 });
  // Removable link and lifting eye
  k.lathe('bolt', [[.03, 0], [.03, .018], [.024, .022], [.001, .022]], 16, M(.24, .279, .12, tiltF));
  k.lathe('cableR', [[.0001, .05], [.008, .05], [.008, .02]], 8, M(.24, .279, .12, tiltF));
  k.tube('cableR', [[.215, .335, .12], [.24, .35, .12], [.265, .335, .12]], .0075, { step: .01 });
  k.lathe('led', [[.0001, .012], [.011, .01], [.011, 0]], 10, M(-.24, .275, .125, tiltF));
  k.lathe('steel', [[.016, 0], [.016, .006], [.012, .012]], 10, M(-.24, .269, .125, tiltF));
  // Rear UHMW bumper block with bolted bar
  k.box('hard', [0, .17, -.522], [.70, .012, .15], [PI / 2, 0, 0], { ring: .035, chamfer: .014 });
  k.box('uhmw', [0, .085, -.53], [.58, .036, .03], [0, 0, 0], { bevel: .004, ring: .008, wear: 0 });
  k.boltRow([-.3, .225, -.53], [.3, .225, -.53], 7, [0, 0, -1], .0085); k.boltRow([-.3, .118, -.53], [.3, .118, -.53], 7, [0, 0, -1], .0085);
  // Drive chain and sprockets on each flank (exposed)
  for (const x of [.378, -.378]) {
    const sx = Math.sign(x);
    for (const z of [.22, -.30]) {
      k.lathe('steel', [[.012, -.004], [.052, -.004], [.052, .004], [.012, .004]], 18, M(x, .105, z, 0, 0, PI / 2));
      for (let i = 0; i < 18; i++) { const a = i / 18 * PI * 2; k.box('steel', [x, .105 + Math.cos(a) * .056, z + Math.sin(a) * .056], [.007, .01, .0085], [a + PI / 2, 0, 0], { bevel: .0012, ring: .001 }); }
    }
    const pitch = .0128, top = .162, bot = .048;
    for (const y of [top, bot]) for (let i = 0; i < 40; i++) {
      const z = -.30 + i / 39 * .52;
      k.box('bolt', [x, y, z], [.012, .009, pitch * .92], [0, 0, 0], { bevel: .0012, ring: .0008, grime: 1 });
      if (i % 2 === 0) k.lathe('steel', [[.0001, -.0078], [.0027, -.0078], [.0027, .0078], [.0001, .0078]], 5, M(x, y, z, 0, 0, PI / 2));
    }
    k.box('uhmw', [x - sx * .013, .105, -.04], [.012, .075, .30], [0, 0, 0], { ring: .008, bevel: .002, wear: 0 });
    // Bearing plates through rail
    for (const z of [.22, -.30]) { k.box('steel', [x - sx * .022, .105, z], [.004, .1, .1], [0, 0, 0], { chamfer: .018, ring: .01, bevel: .0015 });
      for (let a = 0; a < 4; a++) k.bolt([x - sx * .02, .105 + Math.cos(a * PI / 2 + PI / 4) * .04, z + Math.sin(a * PI / 2 + PI / 4) * .04], [sx, 0, 0], .0055, 'bolt', false); }
  }
  // Weapon motor on the front deck and exposed V-belt to the drum pulley
  const mz = .17, my = .335, mx = .205;
  k.lathe('black', [[.0001, -.085], [.05, -.085], [.056, -.08], [.056, .075], [.05, .082], [.02, .082], [.02, .105], [.0001, .105]], 24, M(mx - .035, my, mz, 0, 0, -PI / 2));
  for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; k.box('black', [mx - .035, my + Math.cos(a) * .06, mz + Math.sin(a) * .06], [.13, .01, .0035], [a, 0, 0], { bevel: .0008, ring: .0008, wear: 1.5 }); }
  k.box('steel', [mx - .035, .293, mz], [.12, .022, .10], [tiltF, 0, 0], { ring: .012, chamfer: .012 });
  k.lathe('steel', [[.045, -.014], [.045, .014]], 22, M(mx + .07, my, mz, 0, 0, PI / 2));
  for (const c of [.0, 1]) k.bolt([mx - .08 + c * .09, .305, mz + .042], [0, 1, 0], .0065); 
  // P1's toothed drive belt, walked around both pulleys
  { const path = loopPath([mz, my], .049, [.515, .18], .049), n = Math.round(path.total / .0095);
    for (let i = 0; i < n; i++) { const q = path.at(i / n * path.total), bx = mx + .07; k.box('belt', [bx, q.p[1], q.p[0]], [.021, .0095, .0098], [q.a, 0, 0], { bevel: .001, ring: .001, wear: 0, grime: .9 }); if (i % 2 === 0) k.box('belt', [bx, q.p[1] + Math.cos(q.a) * .0065 * Math.sign(.2), q.p[0] - Math.sin(q.a) * .0065], [.021, .004, .005], [q.a, 0, 0], { bevel: .0006, ring: .0006, wear: 0 }); } }
  // Cable run from speed controller to motor
  k.tube('cable', [[.1, .305, .02], [.11, .335, .08], [.11, .35, .12], [.14, .35, .15]], .0075, { step: .015 });
  k.tube('cableR', [[.08, .3, .02], [.09, .33, .08], [.1, .345, .13], [.14, .335, .18]], .0075, { step: .015 });
  k.tube('cable', [[.06, .297, .02], [.07, .325, .09], [.08, .33, .15], [.14, .322, .19]], .0075, { step: .015 });
  for (const z of [.075]) k.box('bolt', [.09, .322, z], [.09, .01, .012], [0, 0, 0], { ring: .002, bevel: .001 });
  // Welds around rails
  k.weld([[.335, .058, -.46], [.335, .058, .34]]); k.weld([[-.335, .058, -.46], [-.335, .058, .34]]);
  k.weld([[.335, .228, .385], [.335, .30, -.26]]); k.weld([[-.335, .228, .385], [-.335, .30, -.26]]);
  model.add(k.build(mats));

  // Armour plates: dentable, painted through the livery atlas
  const dm = damageMaterials(T, atlas, livery(atlas, on => {
    on(0, x => { hazard(x, -.334, -.2375, .668, .05, '#0000', '#d9480a'); stencil(x, 'TORQUE', .105, '#b8b4a8', -.04, .01); });
    on(1, x => { x.fillStyle = '#d9480a'; x.fillRect(-.334, .1, .668, .05); stencil(x, '07', .17, '#b8b4a8', .15, -.06); });
    for (const i of [2, 3]) on(i, x => { stencil(x, '07', .1, '#10151f', 0, -.015); });
  }));
  const plates = T_PLATES.map((pl, i) => {
    const fork = [[-.08, .075], [.50, .095], [.635, .165], [.615, .25], [.50, .295], [-.08, .262]].map(([z, y]) => [(i === 2 ? -1 : 1) * (z - .28), y - .2]);
    const g = i < 2 ? plateMesh(atlas, i, pl, dm, 'blue', chamfered(pl.hw, pl.hh, .016), (k, hz) => { perimeterBolts(k, pl.hw, pl.hh, hz, 9, 5, .0085); if (i === 1) { k.grid('steel', [[-.11 - .15, -.13 + .02], [-.11 + .15, -.13 + .02], [-.11 + .15, .13 + .02], [-.11 - .15, .13 + .02]].map(p => [p[0], p[1] - .02]), .004, { pitch: .03 }); } })
      : plateMesh(atlas, i, pl, dm, 'orange', fork, (k, hz) => { for (const [u, v] of [[-.26, -.05], [-.26, .08], [-.05, -.08], [-.05, .08], [.16, -.075], [.16, .05], [.3, -.075]]) k.bolt([u, v, hz], [0, 0, 1], .008); });
    g.position.copy(pl.c).setY(pl.c.y); g.quaternion.copy(pl.q); root.add(g); return g;
  });

  // Drum
  const drum = new THREE.Group(); drum.position.set(0, .18, .515); drum.name = 'drum';
  const d = new Kit(23), ax = M(0, 0, 0, 0, 0, PI / 2);
  const R = .105;
  const rows = [];
  for (let i = -5; i <= 5; i++) { const y = i * .0385; rows.push([R, y - .017], [R, y - .012], [R - .006, y - .010], [R - .006, y + .010], [R, y + .012], [R, y + .017]); }
  d.lathe('steel', [[.018, -.235], [R + .012, -.235], [R + .018, -.228], [R + .018, -.215], ...rows, [R + .018, .215], [R + .018, .228], [R + .012, .235], [.018, .235]], 40, ax, { u: 1, grime: .3 });
  for (let i = 0; i < 2; i++) {
    const base = i * PI;
    for (const off of [-.135, 0, .135]) {
      const a = base + (off === 0 ? PI / 2 : 0);
      const cy = Math.cos(a) * (R + .027), cz = Math.sin(a) * (R + .027);
      // Hardened tooth block: bevelled wedge
      d.box('tooth', [off, cy, cz], [.066, .058, .074], [a - PI / 2 + .0, 0, 0], { bevel: .005, ring: .012, chamfer: .009, wear: 1.3 });
      const ct = Math.cos(a + .5) * (R + .012), st = Math.sin(a + .5) * (R + .012);
      d.bolt([off - .018, ct, st], [0, Math.cos(a + .5), Math.sin(a + .5)], .0075); d.bolt([off + .018, ct, st], [0, Math.cos(a + .5), Math.sin(a + .5)], .0075);
      d.weld([[off - .033, Math.cos(a - .34) * (R + .004), Math.sin(a - .34) * (R + .004)], [off + .033, Math.cos(a - .34) * (R + .004), Math.sin(a - .34) * (R + .004)]], .005);
    }
  }
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; d.bolt([.235, Math.cos(a) * .07, Math.sin(a) * .07], [1, 0, 0], .007); d.bolt([-.235, Math.cos(a) * .07, Math.sin(a) * .07], [-1, 0, 0], .007); }
  d.lathe('steel', [[.0001, .305], [.02, .305], [.02, -.305], [.0001, -.305]], 14, ax);
  // pulley on shaft outboard
  d.lathe('steel', [[.012, -.018], [.05, -.018], [.05, -.012], [.04, 0], [.05, .012], [.05, .018], [.012, .018]], 24, M(.235, 0, 0, 0, 0, PI / 2));
  drum.add(d.build(mats));
  model.add(drum);

  const shell = drumShell(T); shell.mesh.position.copy(drum.position); shell.mesh.visible = false; model.add(shell.mesh);

  const wheels = [], wg = wheel(mats, .108, .09, 5, { hub: 'orange' });
  for (const [x, z] of [[.442, .22], [-.442, .22], [.442, -.30], [-.442, -.30]]) { const w = wg.clone(); w.position.set(x, .108, z); model.add(w); wheels.push(w); }
  return { root, model, drum, shell, wheels, plates, atlas, r: .108 };
}
export function buildAnvil(mats, T, atlas) {
  const root = new THREE.Group(); root.name = 'ANVIL';
  const model = new THREE.Group(); model.position.y = -ANVIL_DIM.y0; root.add(model);
  const k = new Kit(31);
  const W = .33, H0 = .08, H1 = .62;
  // Black box-section frame
  k.box('hard', [0, .07, 0], [.68, .014, 1.0], [0, 0, 0], { chamfer: .03 });
  for (const x of [W, -W]) for (const z of [.46, -.46]) { k.box('black', [x, (H0 + H1) / 2, z], [.05, H1 - H0, .05], [0, 0, 0], { ring: .012, bevel: .003 }); }
  for (const x of [W, -W]) { k.box('black', [x, H1, 0], [.05, .05, .97], [0, 0, 0], { ring: .012 }); k.box('black', [x, H0 + .04, 0], [.05, .05, .97], [0, 0, 0], { ring: .012 }); }
  for (const z of [.46, -.46]) k.box('black', [0, H1, z], [.66, .05, .05], [0, 0, 0], { ring: .012 });
  // Corner gussets + welds
  for (const x of [W, -W]) for (const z of [.46, -.46]) {
    const sx = Math.sign(x), sz = Math.sign(z);
    k.weld([[x - sx * .028, H1 - .028, z - sz * .1], [x - sx * .028, H1 - .028, z - sz * .028]]);
    k.weld([[x - sx * .028, H1 - .19, z - sz * .028], [x - sx * .028, H1 - .03, z - sz * .028]]);
  }
  // Side armour: three bolted red plates per side with gaps showing frame
  for (const x of [.362, -.362]) {
    const sx = Math.sign(x);
    // Skirt plates in black, down to just over the wheels
    k.box('black', [x - sx * .012, .26, 0], [.012, .34, .98], [0, 0, 0], { ring: .05 });
    // Outer wheel guard: heavy lower strip and gussets, wheels show only through the gaps
    const gx = x + sx * .135;
    k.box('hard', [gx, .205, 0], [.02, .07, 1.06], [0, 0, 0], { ring: .025, grime: 1 });
    k.box('hard', [gx, .045, 0], [.02, .03, 1.06], [0, 0, 0], { ring: .015, grime: 1 });
    for (const z of [-.52, -.17, .17, .52]) { k.box('black', [gx, .125, z], [.022, .10, .06], [0, 0, 0], { ring: .018 }); k.boltRow([gx + sx * .012, .165, z], [gx + sx * .012, .085, z], 2, [sx, 0, 0], .0085); }
    k.boltRow([gx + sx * .011, .205, -.5], [gx + sx * .011, .205, .5], 10, [sx, 0, 0], .0085);
    for (const z of [-.45, 0, .45]) k.box('steel', [x + sx * .07, .205, z], [.12, .04, .04], [0, 0, 0], { ring: .01 });
    k.weld([[gx - sx * .011, .17, -.5], [gx - sx * .011, .17, .5]]);
    k.boltRow([x - sx * .004, .395, -.45], [x - sx * .004, .395, .45], 12, [sx, 0, 0], .007);
    // Axle bearing plates
    for (const z of [-.335, 0, .335]) { k.box('steel', [x - sx * .002, .10, z], [.008, .12, .13], [0, 0, 0], { ring: .012, chamfer: .02 });
      for (const [dy, dz] of [[-.04, -.05], [-.04, .05], [.04, -.05], [.04, .05]]) k.bolt([x + sx * .002, .10 + dy, z + dz], [sx, 0, 0], .006, 'bolt', false); }
    // Ti scuff rail low down
    
  }
  // Rear deck: exposed pneumatics
  k.box('black', [0, .635, -.37], [.66, .012, .22], [0, 0, 0], { ring: .03 });
  k.lathe('steel', [[.0001, -.20], [.055, -.20], [.075, -.17], [.075, .17], [.055, .20], [.0001, .20]], 28, M(-.0, .715, -.40, 0, 0, PI / 2));
  for (const x of [-.13, .13]) { k.box('hose', [x, .69, -.4], [.022, .02, .17], [0, 0, 0], { bevel: .004, ring: .004 }); }
  k.tube('hose', [[.2, .72, -.40], [.26, .74, -.36], [.27, .70, -.26], [.18, .69, -.21], [.09, .70, -.20]], .011, { step: .02 });
  k.tube('hose', [[-.2, .72, -.40], [-.26, .75, -.34], [-.25, .72, -.24], [-.09, .70, -.20]], .011, { step: .02 });
  k.lathe('brass', [[.0001, .05], [.016, .05], [.016, 0]], 6, M(.2, .72, -.4, 0, 0, -PI / 2));
  k.lathe('brass', [[.0001, .05], [.016, .05], [.016, 0]], 6, M(-.2, .72, -.4, 0, 0, PI / 2));
  // Hammer pivot towers
  const tower = [[-.30, .62], [-.08, .62], [-.14, .80], [-.20, .83], [-.27, .80]];
  for (const x of [.095, -.095]) { k.side('hard', x, .024, tower, { ring: .03 }); k.weld([[x + .014, .63, -.30], [x + .014, .63, -.08]]); k.weld([[x - .014, .63, -.30], [x - .014, .63, -.08]]);
    k.bolt([x + Math.sign(x) * .012, .775, -.20], [Math.sign(x), 0, 0], .013); }
  k.lathe('chrome', [[.0001, -.13], [.019, -.13], [.019, .13], [.0001, .13]], 14, M(0, .775, -.20, 0, 0, PI / 2));
  // Front inner bucket: the guts revealed when the armour panel tears off.
  k.box('cavity', [0, .36, .405], [.6, .4, .012], [0, 0, 0], { ring: .01, wear: 0 });
  k.box('black', [0, .36, .43], [.04, .42, .03], [0, 0, 0], { ring: .01 });
  k.box('black', [0, .30, .43], [.62, .03, .03], [0, 0, 0], { ring: .01 });
  for (const [x, c] of [[-.17, 'battery'], [.17, 'battery']]) { k.box(c, [x, .42, .42], [.24, .15, .08], [0, 0, 0], { bevel: .006, ring: .01, wear: 0 });
    for (const dx of [-.07, .07]) k.lathe('brass', [[.0001, .012], [.009, .012], [.009, 0]], 8, M(x + dx, .50, .42)); }
  k.box('pcb', [-.14, .22, .425], [.26, .11, .01], [0, 0, 0], { bevel: .001, ring: .002, wear: 0 });
  k.box('steel', [.16, .22, .43], [.24, .1, .03], [0, 0, 0], { ring: .01 });
  for (let i = 0; i < 12; i++) k.box('steel', [.05 + i * .02, .22, .452], [.006, .1, .016], [0, 0, 0], { bevel: .001, ring: .001 });
  for (let i = 0; i < 7; i++) {
    const r = k.r, key = i % 3 === 0 ? 'cableR' : 'cable';
    k.tube(key, [[-.24 + r() * .48, .5, .42], [-.2 + r() * .4, .36 + r() * .1, .47 + r() * .03], [-.2 + r() * .4, .29, .455], [-.2 + r() * .4, .2, .44]], .0065, { step: .015 });
  }
  k.box('copper', [0, .335, .46], [.3, .006, .025], [0, 0, 0], { bevel: .001, ring: .002 });
  // Front lower plow: thick black plate that survives
  // Bays behind the side, top and rear plates, so a hole shows the inside of a machine
  for (const s of [1, -1]) { k.box('cavity', [s * .33, .42, 0], [.01, .36, .9], [0, 0, 0], { ring: .01, wear: 0 });
    for (const z of [-.3, 0, .3]) k.box('black', [s * .345, .46, z], [.03, .34, .03], [0, 0, 0], { ring: .01 });
    for (let i = 0; i < 4; i++) k.tube(i % 2 ? 'cable' : 'cableR', [[s * .325, .55 - i * .04, -.4], [s * .34, .5 - i * .03, -.1], [s * .335, .52 - i * .05, .2], [s * .325, .47 - i * .03, .4]], .0065, { step: .03 }); }
  k.box('cavity', [0, .625, .13], [.6, .01, .66], [0, 0, 0], { ring: .01, wear: 0 });
  k.box('cavity', [0, .36, -.47], [.6, .42, .01], [0, 0, 0], { ring: .01, wear: 0 });
  model.add(k.build(mats));

  // The six armour plates: each its own posed group, on a rigid body once it comes loose
  const dm = damageMaterials(T, atlas, livery(atlas, on => {
    on(0, x => { hazard(x, -.35, -.205, .7, .055, '#0000', '#111'); stencil(x, '13', .2, '#b8b4a8', 0, .03); });
    for (const i of [2, 3]) on(i, x => { stencil(x, 'ANVIL', .14, '#121212', 0, .0); });
    on(5, x => { stencil(x, 'ANVIL', .1, '#121212', 0, .05); });
  }));
  const panels = PANELS.map((pl, i) => {
    const key = i === 1 ? 'hard' : 'red', hard = i === 1;
    const g = plateMesh(atlas, i, pl, dm, key, chamfered(pl.hw, pl.hh, .024), (k, hz) => perimeterBolts(k, pl.hw, pl.hh, hz, hard ? 7 : i === 4 ? 8 : 7, hard ? 3 : 4, .0095, .028));
    const o = new THREE.Group(); g.quaternion.copy(pl.q); o.add(g); o.userData.q = pl.q; return o;
  });

  // Hammer: pivot group rotates about X. Arm built along +Z from the pivot.
  const hammer = new THREE.Group(); hammer.position.set(0, .775, -.20); hammer.name = 'hammer';
  const h = new Kit(53), LEN = 1.33;
  h.box('black', [0, 0, LEN / 2 - .03], [.075, .095, LEN], [0, 0, 0], { ring: .02, bevel: .004 });
  for (const x of [.044, -.044]) { h.box('hard', [x, 0, .10], [.012, .13, .27], [0, 0, 0], { ring: .02 });
    h.weld([[x * .9, .048, .0], [x * .9, .048, .24]]); h.weld([[x * .9, -.048, .0], [x * .9, -.048, .24]]); }
  h.lathe('steel', [[.0001, -.058], [.042, -.058], [.042, .058], [.0001, .058]], 18, M(0, 0, 0, 0, 0, PI / 2));
  // Axe head
  const headZ = LEN - .02;
  h.side('red', 0, .05, [[headZ - .10, -.10], [headZ + .10, -.10], [headZ + .10, .12], [headZ - .10, .12]], { ring: .04 });
  h.side('hard', .032, .014, [[headZ - .09, -.09], [headZ + .09, -.09], [headZ + .09, .11], [headZ - .09, .11]], { ring: .02 });
  h.side('hard', -.032, .014, [[headZ - .09, -.09], [headZ + .09, -.09], [headZ + .09, .11], [headZ - .09, .11]], { ring: .02 });
  h.side('tooth', 0, .035, [[headZ - .085, -.095], [headZ + .085, -.095], [headZ + .03, -.27], [headZ + .005, -.285]], { ring: .03, wear: 1.2 });
  for (const [z, y] of [[-.06, -.05], [.06, -.05], [-.06, .06], [.06, .06]]) for (const x of [.04, -.04]) h.bolt([x, y, headZ + z], [Math.sign(x), 0, 0], .01);
  hammer.add(h.build(mats));

  // Pneumatic ram (two moving parts aimed each frame)
  const rk = new Kit(61);
  rk.lathe('black', [[.0001, 0], [.048, 0], [.052, .01], [.052, .29], [.048, .30], [.024, .30], [.024, .32], [.0001, .32]], 22, M());
  for (const y of [.03, .28]) rk.lathe('steel', [[.056, y - .012], [.056, y + .012]], 22, M());
  const ramBody = rk.build(mats); model.add(ramBody);
  const rk2 = new Kit(62);
  rk2.lathe('chrome', [[.0001, 0], [.017, 0], [.017, .5], [.0001, .5]], 16, M());
  const ramRod = rk2.build(mats); model.add(ramRod);

  const wheels = [], wg = wheel(mats, .1, .075, 7, { lugs: 14 });
  for (const x of [.43, -.43]) for (const z of [.335, 0, -.335]) { const w = wg.clone(); w.position.set(x, .1, z); model.add(w); wheels.push(w); }
  const shed = [0, 1].map(() => { const w = wg.clone(); const o = new THREE.Group(); w.rotation.z = PI / 2; o.add(w); o.visible = false; return o; });
  return { root, model, hammer, panels, shed, ramBody, ramRod, wheels, atlas, r: .1, ramBase: new THREE.Vector3(0, .63, -.03), ramTip: new THREE.Vector3(0, -.06, .32) };
}

// Small steel shards (bolts, plate fragments) for impacts.
export function buildDebris(mats, n) {
  const k = new Kit(71), r = rng(9), geo = [];
  k.box('steel', [0, 0, 0], [.03, .006, .02], [0, 0, 0], { ring: .002, bevel: .001 });
  k.box('steel', [.01, .004, .006], [.02, .006, .012], [.4, .4, 0], { ring: .002, bevel: .001 });
  const g = k.build({ steel: mats.hard }).children[0];
  const im = new THREE.InstancedMesh(g.geometry, mats.hard, n);
  im.castShadow = true; im.frustumCulled = false; im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  return im;
}
