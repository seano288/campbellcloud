// @ts-nocheck: ported from the P7 prototype. Its TSL node graphs and terse maths don't fit the strict compiler flags, so the typed edge is stage.ts.
import * as THREE from 'three/webgpu';
import { uniform, texture, uv, vec2, vec3, vec4, float, mix, smoothstep, color, normalMap, positionWorld, fract, floor, abs, min, max, hash, dot, length, cameraPosition, normalize, pow, sub, step, positionLocal, normalView, positionView, Fn, nodeObject, attribute } from 'three/tsl';
import { Kit, M, rng } from './kit';
import { texture as tx, equirectUV, positionWorld as pw, vec3 as v3 } from 'three/tsl';

export const HALF = 6;
const PI = Math.PI;

// Baked 12 x 12 m wear map: R scorch, G bright gouge, B tyre rubber + a derived normal map.
function bakeFloor() {
  const S = 2048, c = document.createElement('canvas'); c.width = c.height = S;
  const x = c.getContext('2d', { willReadFrequently: true }), r = rng(77);
  x.fillStyle = '#000'; x.fillRect(0, 0, S, S); x.globalCompositeOperation = 'lighter';
  const m = v => (v / 12 + .5) * S;
  // scorches: clusters of soft blobs, heavier mid-arena where fights happen
  for (let i = 0; i < 620; i++) {
    const a = r() * 6.28, d = Math.pow(r(), .7) * 5.4, px = m(Math.cos(a) * d), py = m(Math.sin(a) * d);
    const rad = (8 + r() * r() * 150), g = x.createRadialGradient(px, py, 0, px, py, rad), v = 18 + r() * 60 | 0;
    g.addColorStop(0, `rgb(${v},0,0)`); g.addColorStop(1, 'rgb(0,0,0)');
    x.fillStyle = g; x.save(); x.translate(px, py); x.rotate(r() * 6.28); x.scale(1, .35 + r() * .8); x.translate(-px, -py); x.fillRect(px - rad, py - rad, rad * 2, rad * 2); x.restore();
  }
  // tyre arcs
  for (let i = 0; i < 44; i++) {
    const cx = m((r() - .5) * 9), cy = m((r() - .5) * 9), R = 90 + r() * 420, a0 = r() * 6.28, sp = .4 + r() * 1.6;
    for (const off of [0, 62 + r() * 30]) {
      x.strokeStyle = `rgba(0,0,${60 + r() * 120 | 0},1)`; x.lineWidth = 7 + r() * 8;
      x.beginPath(); x.arc(cx, cy, R + off, a0, a0 + sp); x.stroke();
    }
  }
  // gouges and scratches
  for (let i = 0; i < 620; i++) {
    const big = r() < .12, sx = m((r() - .5) * 11), sy = m((r() - .5) * 11), a = r() * 6.28, L = big ? 40 + r() * 260 : 10 + r() * 150;
    x.strokeStyle = `rgb(0,${big ? 90 + r() * 90 | 0 : 24 + r() * 50 | 0},0)`; x.lineWidth = big ? 1.1 + r() * 1.6 : .5 + r() * .6;
    x.beginPath(); x.moveTo(sx, sy); x.quadraticCurveTo(sx + Math.cos(a) * L * .5 + (r() - .5) * 30, sy + Math.sin(a) * L * .5 + (r() - .5) * 30, sx + Math.cos(a) * L, sy + Math.sin(a) * L); x.stroke();
  }
  // hammer pits: starburst of short gouges
  for (let i = 0; i < 26; i++) {
    const px = m((r() - .5) * 8), py = m((r() - .5) * 8);
    x.fillStyle = 'rgb(70,110,0)'; x.beginPath(); x.ellipse(px, py, 2 + r() * 3, 1.5 + r() * 2, r() * 3, 0, 6.28); x.fill();
    for (let j = 0; j < 9; j++) { const a = r() * 6.28; x.strokeStyle = 'rgb(0,60,0)'; x.lineWidth = .6; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * (8 + r() * 26), py + Math.sin(a) * (8 + r() * 26)); x.stroke(); }
  }
  const img = x.getImageData(0, 0, S, S), d = img.data;
  const n = document.createElement('canvas'); n.width = n.height = S;
  const nx = n.getContext('2d'), out = nx.createImageData(S, S), o = out.data;
  const H = (i, j) => d[(((j + S) % S) * S + ((i + S) % S)) * 4 + 1] / 255;
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const dx = (H(i + 1, j) - H(i - 1, j)) * 2.2, dy = (H(i, j + 1) - H(i, j - 1)) * 2.2, l = Math.hypot(dx, dy, 1), p = (j * S + i) * 4;
    o[p] = (dx / l * .5 + .5) * 255; o[p + 1] = (-dy / l * .5 + .5) * 255; o[p + 2] = (1 / l * .5 + .5) * 255; o[p + 3] = 255;
  }
  nx.putImageData(out, 0, 0);
  const mk = (cv) => { const t = new THREE.CanvasTexture(cv); t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; return t; };
  return { wear: mk(c), normal: mk(n) };
}

function floorMaterial(T) {
  const { wear, normal } = bakeFloor();
  const m = new THREE.MeshStandardNodeMaterial();
  const w = positionWorld.xz, size = vec2(2.4, 1.2);
  const cellRaw = w.div(size);
  const cell = floor(cellRaw), f = fract(cellRaw);
  const pr = hash(cell.x.mul(13.1).add(cell.y.mul(71.7)));
  const seam = min(min(f.x, float(1).sub(f.x)).mul(size.x), min(f.y, float(1).sub(f.y)).mul(size.y));
  const line = smoothstep(.0, .0045, seam);
  const lip = smoothstep(.004, .03, seam);
  const u = w.div(4.8), mu = w.div(HALF * 2).add(.5);
  const W = texture(wear, mu), fn = texture(T.floor_n, u), rough = fn.b, col = texture(T.floor_a, u).rgb, hz = texture(T.scratch, w.mul(.11).add(pr)), s1 = texture(T.scratch, w.mul(.5).add(pr.mul(4)).yx), s2 = texture(T.scratch, w.mul(.63).add(pr.mul(7)));
  const big = hz.b, fine = s1.r, fine2 = s2.r;
  const lum = dot(col, vec3(.3, .59, .11));
  const scorch = W.r.mul(1.7).add(big.mul(.34)).sub(.14).clamp(0, 1);
  const tyre = W.b.mul(.5);
  const steel = mix(vec3(lum), col, .3).mul(vec3(.92, .93, .96)).mul(.17).mul(pr.mul(.3).add(.75));
  const burnt = mix(steel, steel.mul(.12).add(vec3(.012, .009, .007)), scorch);
  const rubbed = mix(burnt, vec3(.012), tyre);
  const gouge = W.g.mul(.13).add(fine.mul(.03)).add(fine2.mul(.024));
  m.colorNode = mix(rubbed, vec3(.3, .3, .295), gouge.clamp(0, 1)).mul(line.mul(.9).add(.1)).mul(lip.mul(.25).add(.75));
  m.metalnessNode = float(.6).sub(scorch.mul(.14)).add(gouge.mul(.3));
  m.roughnessNode = rough.mul(.4).add(.42).add(scorch.mul(.08)).add(tyre.mul(.25)).sub(gouge.mul(.2)).add(big.mul(.04)).clamp(.14, 1);
  const axy = fn.rg.mul(2).sub(1), a = vec3(axy, 1), b = texture(normal, mu).rgb.mul(2).sub(1);
  m.normalNode = normalMap(normalize(vec3(a.xy.mul(.45).add(b.xy), a.z.mul(b.z))).mul(.5).add(.5), vec2(1));
  return m;
}

function polyMaterial(T) {
  const m = new THREE.MeshStandardNodeMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const u = uv(), sc = texture(T.scratch, u.mul(.37).add(vec2(u.y.mul(.11), 0))).r, sc2 = texture(T.scratch, u.mul(.53).yx.add(vec2(u.x.mul(.2), .31))).g, sm = texture(T.scratch, u.mul(.07)).b;
  const scuff = sc.mul(.32).add(sc2.mul(.2)).add(smoothstep(.55, .95, sm).mul(.14));
  const low = smoothstep(1.6, .4, positionWorld.y);
  m.colorNode = vec3(.82, .86, .88).mul(.6);
  m.roughnessNode = float(.06).add(scuff.mul(.7));
  m.metalnessNode = float(0);
  m.opacityNode = float(.025).add(scuff.mul(.075)).add(low.mul(scuff).mul(.1));
  return m;
}

function truss(k, a, b, s = .42, y = 6.6) {
  const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, px = -uz, pz = ux, n = Math.round(L / s);
  const pt = (t, sx, sy) => [a[0] + ux * t + px * sx * s / 2, y + sy * s / 2, a[1] + uz * t + pz * sx * s / 2];
  const rod = (p, q, r) => {
    const P = new THREE.Vector3(...p), Q = new THREE.Vector3(...q), d = Q.clone().sub(P), l = d.length();
    const m = new THREE.Matrix4().compose(P, new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()), new THREE.Vector3(1, 1, 1));
    k.lathe('truss', [[r, 0], [r, l]], 6, m, { wear: 0, grime: .7 });
  };
  for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) rod(pt(0, sx, sy), pt(L, sx, sy), .024);
  for (let i = 0; i < n; i++) {
    const t0 = i / n * L, t1 = (i + 1) / n * L, t = i % 2;
    for (const [c0, c1] of [[[1, 1], [-1, 1]], [[1, -1], [-1, -1]], [[1, 1], [1, -1]], [[-1, 1], [-1, -1]]]) {
      rod(pt(t ? t0 : t1, ...c0), pt(t ? t1 : t0, ...c1), .011);
    }
    rod(pt(t0, 1, 1), pt(t0, -1, 1), .009); rod(pt(t0, 1, -1), pt(t0, -1, -1), .009);
  }
}

export function buildArena(scene, mats, T) {
  const g = new THREE.Group(); scene.add(g);
  const floorM = new THREE.Mesh(new THREE.PlaneGeometry(HALF * 2, HALF * 2), floorMaterial(T));
  floorM.rotation.x = -PI / 2; floorM.receiveShadow = true; floorM.name = 'floor'; g.add(floorM);

  const k = new Kit(91);
  mats.truss = new THREE.MeshStandardNodeMaterial({ color: 0x33353a, roughness: .55, metalness: .85 });
  // Walls: kick plate, steel posts, rails.
  const H = 3.2, step = 2.0;
  const posts = [];
  for (let i = -3; i <= 3; i++) for (const s of [-1, 1]) { posts.push([i * step, s * HALF, 0]); if (Math.abs(i) < 3) posts.push([s * HALF, i * step, PI / 2]); }
  for (const [x, z, ry] of posts) {
    const n = ry ? [-Math.sign(x), 0, 0] : [0, 0, -Math.sign(z)];
    k.box('black', [x, H / 2, z], [.13, H, .13], [0, 0, 0], { ring: .025, grime: .9 });
    k.box('hard', [x + n[0] * .075, H / 2, z + n[2] * .075], ry ? [.012, H, .24] : [.24, H, .012], [0, 0, 0], { ring: .03 });
    for (let y = .35; y < H; y += .55) for (const o of [-.09, .09]) k.bolt([x + n[0] * .082 + (ry ? 0 : o), y, z + n[2] * .082 + (ry ? o : 0)], n, .0095);
  }
  for (const s of [-1, 1]) {
    for (const [c, sz] of [[[0, .28, s * HALF], [HALF * 2, .56, .03]], [[s * HALF, .28, 0], [.03, .56, HALF * 2]]]) {
      const rot = sz[0] > 1 ? [PI / 2, 0, 0] : [0, 0, PI / 2];
      k.box('hard', c, sz[0] > 1 ? [sz[0], .03, sz[1]] : [sz[1], .03, sz[2]], rot, { ring: .05, grime: 1 });
    }
    k.box('black', [0, H, s * HALF], [HALF * 2, .1, .12], [0, 0, 0], { ring: .02 });
    k.box('black', [s * HALF, H, 0], [.12, .1, HALF * 2], [0, 0, 0], { ring: .02 });
    k.box('black', [0, .6, s * HALF], [HALF * 2, .07, .12], [0, 0, 0], { ring: .02 });
    k.box('black', [s * HALF, .6, 0], [.12, .07, HALF * 2], [0, 0, 0], { ring: .02 });
  }
  // Truss + cans
  for (const s of [-1, 1]) { truss(k, [-5, s * 5], [5, s * 5]); truss(k, [s * 5, -5], [s * 5, 5]); }
  truss(k, [-5, 0], [5, 0]); truss(k, [0, -5], [0, 5]);
  const cans = [];
  for (const x of [-4.5, -3, -1.5, 1.5, 3, 4.5]) for (const z of [-5, 0, 5]) cans.push([x, z]);
  for (const z of [-3.2, -1.6, 1.6, 3.2]) for (const x of [-5, 0, 5]) cans.push([x, z]);
  for (const [x, z] of cans) {
    const tx = x * .25, tz = z * .25, q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), new THREE.Vector3(tx - x, -6, tz - z).normalize());
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x, 6.28, z), q, new THREE.Vector3(1, 1, 1));
    k.lathe('truss', [[.0001, .16], [.09, .16], [.11, .10], [.12, -.14], [.135, -.17], [.12, -.17]], 12, m, { wear: 0 });
    k.lathe('lamp', [[.0001, -.172], [.115, -.172]], 12, m);
  }
  mats.dark = new THREE.MeshStandardNodeMaterial({ color: 0x0b0c0f, roughness: .8, metalness: 0 });
  const built = k.build(mats); g.add(built);
  built.children.forEach(m => { if (['lamp', 'dark', 'cavity'].includes(m.name)) { m.castShadow = false; } });

  // Polycarbonate
  const pg = [];
  const glass = new THREE.BufferGeometry();
  const pos = [], uvs = [], idx = []; let vi = 0;
  const add = (x0, z0, x1, z1) => {
    const L = Math.hypot(x1 - x0, z1 - z0), y0 = .6, y1 = H;
    pos.push(x0, y0, z0, x1, y0, z1, x1, y1, z1, x0, y1, z0); uvs.push(x0 + z0, y0, x0 + z0 + L, y0, x0 + z0 + L, y1, x0 + z0, y1);
    idx.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3); vi += 4;
  };
  for (const s of [-1, 1]) { add(-HALF, s * (HALF - .01), HALF, s * (HALF - .01)); add(s * (HALF - .01), -HALF, s * (HALF - .01), HALF); }
  glass.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); glass.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); glass.setIndex(idx); glass.computeVertexNormals();
  const poly = new THREE.Mesh(glass, polyMaterial(T)); poly.name = 'polycarbonate'; poly.renderOrder = 5; g.add(poly);
  return { group: g, floor: floorM, poly };
}

export function buildLights(scene, Q) {
  const L = [], VOL = 10;
  const spot = (x, y, z, tx, tz, cd, col, ang, shadow, vol) => {
    const s = new THREE.SpotLight(col, cd, 0, ang, .55, 2);
    s.position.set(x, y, z); s.target.position.set(tx, 0, tz); scene.add(s, s.target);
    if (shadow) { s.castShadow = true; s.shadow.mapSize.setScalar(Q.shadowSize); s.shadow.camera.near = 2; s.shadow.camera.far = 13; s.shadow.bias = -.0006; s.shadow.normalBias = .012; s.shadow.radius = 2.5; }
    if (vol) s.layers.enable(VOL);
    L.push(s); return s;
  };
  // Key lights hang from the truss so the truss shadows them.
  const K = 760; // TV rig: the arena is the brightest thing in the building
  spot(-3.2, 8.4, -3.0, -1.2, -.9, K, 0xfff3e4, .66, Q.shadowLights >= 1, true);
  spot(3.4, 8.4, 3.0, 1.2, .9, K * .9, 0xeef3ff, .66, Q.shadowLights >= 2, true);
  spot(3.2, 8.4, -3.4, 2.7, -2.2, K * .6, 0xfff6ec, .6, Q.shadowLights >= 3, Q.shadowLights >= 3);
  spot(-3.4, 8.4, 3.4, -2.6, 2.4, K * .6, 0xf2f6ff, .6, Q.shadowLights >= 4, false);
  spot(0, 7.5, 0, 0, 0, 540, 0xf4f4ff, 1.25, false, false);
  // Colour accents, low, no shadow: the blue/amber look of TV sports lighting.
  spot(-5.4, 2.8, 5.4, 0, 0, 34, 0x2a6bff, .7, false, false);
  spot(5.4, 2.8, -5.4, 0, 0, 28, 0xff7a24, .7, false, false);
  // Impact flash
  const flash = new THREE.PointLight(0xff9a4a, 0, 8, 2); flash.position.set(0, .5, 0); scene.add(flash);
  const fill = new THREE.PointLight(0xfff4e8, 0, 6, 2); scene.add(fill);
  return { lights: L, flash, fill, VOL };
}

// P3's photographed warehouse: log-encoded JPEG, decoded to linear HDR in the shader.
export async function loadBackdrop() {
  const t = await new THREE.TextureLoader().loadAsync(new URL('math-bots-fight/env/warehouse_log.jpg', document.baseURI).href);
  const meta = await (await fetch(new URL('math-bots-fight/env/warehouse.json', document.baseURI))).json();
  t.colorSpace = THREE.NoColorSpace; t.mapping = THREE.EquirectangularReflectionMapping; t.wrapS = THREE.RepeatWrapping; t.generateMipmaps = false; t.minFilter = t.magFilter = THREE.LinearFilter;
  return { t, K: meta.K, R: Math.log2(1 + meta.MAX * meta.K) };
}
function backdropMesh(b, gain) {
  const m = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide, depthWrite: false, fog: false });
  const e = tx(b.t, equirectUV(normalize(pw))).rgb;
  m.colorNode = float(2).pow(e.mul(b.R)).sub(1).div(b.K).mul(gain);
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(40, 48, 24), m); mesh.name = 'backdrop'; return mesh;
}
export function buildBackdrop(scene, b) { const m = backdropMesh(b, uniform(.085)); m.renderOrder = -1; scene.add(m); return m; }

// Reflection probe: the real warehouse plus emissive strips matching the truss lights.
export function buildEnvironment(renderer, scene, b) {
  const rig = new THREE.Scene(); rig.add(backdropMesh(b, uniform(.55)));
  const lamp = (x, y, z, w, d, i, c = [1, .97, .93]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, .1, d), new THREE.MeshBasicMaterial({ color: new THREE.Color(c[0] * i, c[1] * i, c[2] * i) })); m.position.set(x, y, z); rig.add(m); };
  for (const x of [-5, -2.6, 0, 2.6, 5]) lamp(x, 7, 0, .5, 10, 5);
  for (const z of [-5, 0, 5]) lamp(0, 6.8, z, 11, .22, 4);
  rig.add((() => { const f = new THREE.Mesh(new THREE.BoxGeometry(14, .1, 14), new THREE.MeshBasicMaterial({ color: new THREE.Color(.07, .07, .075) })); f.position.y = -.5; return f; })());
  const p = new THREE.PMREMGenerator(renderer);
  scene.environment = p.fromScene(rig, .012, .1, 45).texture; scene.environmentIntensity = .8; p.dispose();
}
