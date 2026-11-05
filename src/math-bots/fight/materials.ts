// @ts-nocheck: ported from the P7 prototype. Its TSL node graphs and terse maths don't fit the strict compiler flags, so the typed edge is stage.ts.
// Materials: P3's CC0 scans in KTX2, driven by P2's layered TSL paint-over-steel logic, plus the damage overlay.
import * as THREE from 'three/webgpu';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { attribute, uv, texture, vec2, vec3, vec4, float, mix, smoothstep, color, normalMap, positionLocal, sqrt, dot, normalize, modelViewMatrix, max, Fn, step, length } from 'three/tsl';

/** The eight files' size. Only the progress bar reads it, so a texture swapped later just makes the bar a little off. */
const TEX_BYTES = 16083099;

/** `onBytes` hears how much of the download is done, 0 to 1. */
export async function loadTextures(renderer, onBytes) {
  const L = new KTX2Loader().detectSupport(renderer);
  const names = ['floor_a', 'floor_n', 'steel_a', 'steel_n', 'paint_p', 'paint_n', 'scratch', 'tyre_n'], T = {}, got = {};
  const heard = n => e => { got[n] = e.loaded; onBytes(Math.min(1, Object.values(got).reduce((a, b) => a + b, 0) / TEX_BYTES)); };
  try {
    await Promise.all(names.map(async n => { const t = await L.loadAsync(new URL(`math-bots-fight/tex/${n}.ktx2`, document.baseURI).href, heard(n)); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; T[n] = t; }));
  } finally { L.dispose(); } // each loader keeps a pool of workers, and a failed attempt must not leave one behind
  const puff = document.createElement('canvas'); puff.width = puff.height = 128; const x = puff.getContext('2d'), g = x.createRadialGradient(64, 64, 2, 64, 64, 62);
  g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(.5, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  x.globalCompositeOperation = 'destination-out'; let s = 11; const r = () => (s = s * 16807 % 2147483647) / 2147483647;
  for (let i = 0; i < 90; i++) { const px = r() * 128, py = r() * 128, R = 3 + r() * 16, h = x.createRadialGradient(px, py, 0, px, py, R); h.addColorStop(0, `rgba(0,0,0,${.05 + r() * .32})`); h.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = h; x.fillRect(px - R, py - R, R * 2, R * 2); }
  T.puff = new THREE.CanvasTexture(puff);
  return T;
}

// nx, ny, rough, ao texture -> a tangent normal for normalMap()
const nrm = (s, k = 1) => { const xy = s.rg.mul(2).sub(1).mul(k); return vec3(xy, sqrt(float(1).sub(dot(xy, xy)).max(.02))).mul(.5).add(.5); };

function bareNodes(T, { tint = 0xb8b8b6, rough = 1, scale = 1.5, grime = .6, scuff = .62, mill = 0x1d1c1b } = {}) {
  const aux = attribute('aux', 'vec3'), edge = aux.x, rnd = aux.y, grimeW = aux.z;
  const u = uv().mul(scale).add(rnd.mul(3.7)), s = texture(T.steel_n, u), a = texture(T.steel_a, u);
  const sc = texture(T.scratch, uv().mul(1.1).add(rnd.mul(2)).yx), sc2 = texture(T.scratch, uv().mul(.8).add(rnd));
  const p = texture(T.paint_p, uv().mul(.8).add(rnd.mul(5.13))), fine = texture(T.paint_p, uv().mul(3.1).add(rnd.mul(2.3)).yx).g;
  const worn = smoothstep(.42, .62, p.g.mul(scuff * .8).add(fine.mul(scuff * .4)).add(sc.r.mul(.5)).add(edge.mul(.55).mul(sc2.b.mul(.7).add(.5))));
  const dirt = smoothstep(.3, .78, sc2.b.mul(.8).add(sc.b.mul(.5))).mul(grimeW).mul(grime);
  const bright = a.rgb.mul(1.7).mul(color(tint)), dark = color(mill).mul(sc.b.mul(.9).add(.55)).mul(rnd.mul(.5).add(.75));
  return { color: mix(dark, bright, worn).mul(float(1).sub(dirt.mul(.7))), rough: mix(float(.54).add(sc2.b.mul(.2)), s.b.mul(.72).mul(rough), worn).add(dirt.mul(.22)).clamp(.14, 1), metal: mix(float(.45), float(.96), worn).sub(dirt.mul(.3)), normal: normalMap(nrm(s), vec2(worn.mul(.45).add(.25))) };
}

// Rainbow Paint: bands of colour running the length of the robot.
const rainbowNode = () => { const t = positionLocal.z.mul(6).add(positionLocal.x.mul(2.5)); return vec3(t.sin(), t.add(2.1).sin(), t.add(4.2).sin()).mul(.5).add(.5); };

function coatNodes(T, hex, { wear = .62, edgeW = .78, rough = .5, grime = .95, chipScale = .9, bareTint = 0xb0aeaa, liv = null, rainbow = false } = {}) {
  const aux = attribute('aux', 'vec3'), edge = aux.x, rnd = aux.y, grimeW = aux.z;
  const u = uv().mul(1.5).add(rnd.mul(3.7)), pu = uv().mul(chipScale).add(rnd.mul(5.13));
  const p = texture(T.paint_p, pu), fine = texture(T.paint_p, uv().mul(chipScale * 4.3).add(rnd.mul(2.3)).yx).g;
  const sc = texture(T.scratch, uv().mul(1.1).add(rnd.mul(2)).yx), sc2 = texture(T.scratch, uv().mul(.8).add(rnd));
  const dmg = p.g.mul(wear).add(fine.mul(wear * .42)).add(edge.mul(edgeW).mul(sc2.b.mul(.7).add(.28))).add(sc.r.mul(.34));
  const isBare = smoothstep(.47, .53, dmg), isPrimer = smoothstep(.37, .44, dmg).mul(float(1).sub(isBare));
  const big = texture(T.scratch, uv().mul(.31).add(rnd.mul(3.1))).b, dirt = smoothstep(.22, .7, sc2.b.mul(.75).add(big.mul(.5))).mul(grimeW).mul(grime);
  let paint = (rainbow ? rainbowNode() : color(hex)).mul(p.r.mul(1.15).add(.42)).mul(rnd.mul(.2).add(.86)).mul(sc.r.mul(.3).add(1)).mul(big.mul(.5).add(.72));
  if (liv) paint = mix(paint, liv.rgb, liv.a);
  const sa = texture(T.steel_a, u).rgb, steel = mix(sa, vec3(dot(sa, vec3(.3, .59, .11))), .75).mul(1.15).mul(color(bareTint));
  return { color: mix(mix(paint, color(0x4b4d4f), isPrimer), steel, isBare).mul(float(1).sub(dirt.mul(.66))), metal: isBare.mul(float(1).sub(dirt.mul(.4))), rough: mix(float(rough).add(p.b.mul(.16)).add(dirt.mul(.3)).add(fine.mul(.12)), texture(T.steel_n, u).b.mul(.72), isBare).clamp(.14, 1), normal: normalMap(texture(T.paint_n, pu).rgb, vec2(.85)), isBare };
}

const set = (m, n) => { m.colorNode = n.color; m.roughnessNode = n.rough; m.metalnessNode = n.metal; if (n.normal) m.normalNode = n.normal; return m; };

/** Overlay: moves vertices by the displacement atlas, and strips, scores, scorches and holes the surface. */
function overlay(n, m, D, T) {
  const auv = attribute('auv', 'vec2'), su = auv.mul(D.m * 4.2), sa = texture(T.steel_a, su).rgb, sn = texture(T.steel_n, su), lumS = dot(sa, vec3(.3, .59, .11));
  m.positionNode = positionLocal.add(texture(D.dispTex, auv).level(0).xyz);
  const S = texture(D.surfTex, auv), off = S.r, gouge = S.g, scorch = S.b, tear = S.a;
  const e = 1 / D.dRes, e2 = 1 / D.sRes, h = (x, y) => texture(D.dispTex, auv.add(vec2(x * e, y * e))).z, g = (x, y) => texture(D.surfTex, auv.add(vec2(x * e2, y * e2))).g;
  const dent = vec2(h(1.5, 0).sub(h(-1.5, 0)), h(0, 1.5).sub(h(0, -1.5))).div(3 * e * D.m);
  const groove = vec2(g(1.3, 0).sub(g(-1.3, 0)), g(0, 1.3).sub(g(0, -1.3))).mul(-.0028 / (2.6 * e2 * D.m));
  const grad = dent.mul(1.3).add(groove);
  const opened = max(smoothstep(.34, .55, S.r), smoothstep(.12, .5, S.g));
  m.normalNode = normalize(mix(n.normal, normalMap(nrm(sn, 1.5), vec2(1)), opened).add(modelViewMatrix.mul(vec4(grad.x.negate(), grad.y.negate(), 0, 0)).xyz));
  const rim = smoothstep(.06, .3, tear), primer = smoothstep(.04, .3, off).mul(float(1).sub(smoothstep(.34, .55, off)));
  const fresh = vec3(.36, .355, .345), hot = mix(vec3(.2, .14, .34), vec3(.42, .3, .14), smoothstep(.4, .9, scorch));
  const pit = texture(D.dispTex, auv).z.negate().mul(26).clamp(0, 1);
  // Where the plate has moved the paint is stretched dead flat: no gloss, no orange peel, no film over the dent.
  const bent = max(pit.mul(2.2), length(dent).mul(7)).clamp(0, 1);
  let c = mix(n.color, vec3(.2, .205, .21), primer).mul(float(1).sub(pit.mul(.16)));
  c = mix(c, vec3(lumS).mul(.62).add(.015), smoothstep(.34, .55, off));
  c = mix(c, c.mul(.16).add(vec3(.012)), smoothstep(.15, .85, scorch).mul(.82));
  c = mix(c, hot.mul(.5), smoothstep(.45, .7, scorch).mul(float(1).sub(smoothstep(.75, 1, scorch))).mul(.15));
  c = mix(c, vec3(lumS).mul(.72).add(.1), smoothstep(.12, .5, gouge));
  c = mix(c, vec3(lumS).mul(.55).add(.3), rim); // the fresh tear is the brightest steel on the bot
  m.colorNode = c;
  const stripped = max(smoothstep(.34, .55, off), max(smoothstep(.12, .5, gouge), rim));
  m.metalnessNode = mix(mix(n.metal, float(.82), stripped), float(.86), rim);
  m.roughnessNode = mix(mix(n.rough, float(.8), bent).add(scorch.mul(.2)), mix(sn.b.mul(.3).add(.5), sn.b.mul(.34).add(.3), smoothstep(.2, .7, max(gouge, rim))), stripped);
  m.opacityNode = float(1).sub(step(.5, tear)); m.alphaTest = .5;
  return m;
}

export function makeMaterials(T, look) {
  const std = () => new THREE.MeshStandardNodeMaterial();
  const plain = (hex, rough, metal, extra = {}) => Object.assign(new THREE.MeshStandardNodeMaterial({ color: hex, roughness: rough, metalness: metal }), extra);
  const coat = (hex, o) => set(std(), coatNodes(T, hex, o)), bare = o => set(std(), bareNodes(T, o));
  const aux = attribute('aux', 'vec3'), rnd = aux.y;
  const rubber = (() => { const m = std(), s = texture(T.tyre_n, uv().mul(4)), sm = texture(T.scratch, uv().mul(1.4).add(rnd)).b;
    m.colorNode = color(0x0c0c0d).add(sm.mul(.02)); m.roughnessNode = s.b.mul(.3).add(.62); m.metalnessNode = float(0); m.normalNode = normalMap(nrm(s), vec2(.7)); return m; })();
  const uhmw = (() => { const m = std(), sc = texture(T.scratch, uv().mul(1.6).add(rnd)); m.colorNode = color(0x77776f).mul(float(1).sub(sc.b.mul(.55))).sub(sc.r.mul(.08)); m.roughnessNode = float(.52).add(sc.r.mul(.3)); m.metalnessNode = float(0); return m; })();
  const weld = (() => { const m = std(), n = texture(T.steel_n, uv().mul(11).add(rnd)), a = texture(T.scratch, uv().mul(14).add(rnd)).b;
    m.colorNode = mix(color(0x2a2522), color(0x7a6a58), a); m.roughnessNode = float(.45).add(n.b.mul(.3)); m.metalnessNode = float(.85); m.normalNode = normalMap(nrm(n, 1.3), vec2(1)); return m; })();
  return {
    T, nodes: { coatNodes: (h, o) => coatNodes(T, h, o), bareNodes: o => bareNodes(T, o) },
    blue: coat(look.paint.number, { wear: .62, rainbow: look.paint.rainbow }), orange: coat(0xff6508, { wear: .62 }),
    red: coat(0xa80e08, { wear: .66, rough: .5, grime: 1 }), black: coat(0x101112, { wear: .54, rough: .5, bareTint: 0x98968f }),
    // TORQUE's Mods: the drum's metal and the wheel hubs
    drumBody: bare({ tint: look.drum.steel, scuff: .78, mill: look.drum.mill, rough: look.drum.glow ? .9 : .7 }),
    drumTooth: look.drum.glow ? new THREE.MeshBasicNodeMaterial({ color: new THREE.Color(look.drum.glow).multiplyScalar(5) }) : bare({ tint: look.drum.steel, rough: .6, grime: .3, scale: 3, scuff: 1.05, mill: look.drum.mill }),
    hub: look.hub.kind === 'glow' ? new THREE.MeshBasicNodeMaterial({ color: new THREE.Color(look.hub.number).multiplyScalar(5) }) : look.hub.kind === 'metal' ? plain(look.hub.number, .3, 1) : coat(look.hub.number, { wear: .62 }),
    steel: bare({ scuff: .78, mill: 0x2c2b2a }), hard: bare({ tint: 0xa3a19c, rough: .95, grime: .95, scale: 1.2 }),
    tooth: bare({ tint: 0xd6d6d2, rough: .6, grime: .3, scale: 3, scuff: 1.05, mill: 0x38342e }), ti: bare({ tint: 0xa8a39c, rough: .9, grime: .6, scale: 2.2, scuff: .85, mill: 0x3a3430 }),
    uhmw, rubber, weld, bolt: bare({ tint: 0x77736e, rough: .7, grime: .5, scale: 4, scuff: .55, mill: 0x121212 }),
    chrome: plain(0xdfe1e3, .13, 1), brass: plain(0xb08a3a, .35, 1), copper: plain(0xa8562c, .36, 1), cable: plain(0x0d0d0e, .55, 0), cableR: plain(0x5a0a0a, .55, 0), hose: plain(0x141415, .62, 0),
    battery: plain(0x2a2c30, .6, .1), pcb: plain(0x0d3a24, .5, .2), cavity: plain(0x050505, .9, .2), belt: plain(0x111112, .8, 0),
    lamp: new THREE.MeshBasicNodeMaterial({ color: new THREE.Color(1, .97, .9).multiplyScalar(26) }), led: new THREE.MeshBasicNodeMaterial({ color: new THREE.Color(.1, 1, .25).multiplyScalar(14) }),
  };
}

/** One bot's damageable material set. */
export function damageMaterials(T, D, livTex, look) {
  const std = () => { const m = new THREE.MeshStandardNodeMaterial(); return m; };
  const liv = texture(livTex, attribute('auv', 'vec2'));
  const c = (hex, o) => overlay(coatNodes(T, hex, { ...o, liv }), std(), D, T), b = o => overlay(bareNodes(T, o), std(), D, T);
  return { blue: c(look?.paint.number ?? 0x0a3fb8, { wear: .62, rainbow: look?.paint.rainbow }), orange: c(0xff6508, { wear: .62 }), red: c(0xa80e08, { wear: .66, rough: .5, grime: 1 }), hard: b({ tint: 0xa3a19c, rough: .95, grime: .95, scale: 1.2 }), bolt: b({ tint: 0x77736e, rough: .7, grime: .5, scale: 4, scuff: .55, mill: 0x121212 }), steel: b({ scuff: .78, mill: 0x2c2b2a }), weld: b({ scuff: .3, mill: 0x2a2522 }) };
}
