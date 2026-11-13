// Ambient occlusion baked once when an Aircraft is built, so parts sit together instead of floating: wing roots, intake
// ducts, nozzle liners, wheel wells and the gear under the wings darken where the hangar's light can't reach. It costs
// nothing per frame: each vertex carries its occlusion (`aoOcc`, 0 open to 1 buried) and the materials dim their
// reflected hangar light by it (`withAO`).
//
// The bake: the airframe is rasterised in software (no GPU readback) into small depth maps looking along a few dozen
// directions spread over the sphere, the way a shadow map is. A vertex is occluded in a direction when the depth map
// has something nearer the "light" than the vertex. Directions are weighted by how squarely the vertex faces them. The
// same rasteriser, looking straight down, gives the soft contact shadow under the Aircraft.
import * as THREE from 'three';

export interface BakeOptions {
  /** Directions sampled over the sphere (default 40). */
  dirs?: number;
  /** Depth map size in texels (default 160). */
  res?: number;
}

interface Tris { pos: Float32Array; count: number }

/** Every triangle of the meshes, in the coordinates of `space`. */
function gather(meshes: readonly THREE.Mesh[], space: THREE.Object3D): Tris {
  const inv = new THREE.Matrix4().copy(space.matrixWorld).invert(), m = new THREE.Matrix4(), v = new THREE.Vector3();
  let n = 0;
  for (const mesh of meshes) { const g = mesh.geometry; n += g.index ? g.index.count : g.attributes.position!.count; }
  const pos = new Float32Array(n * 3);
  let o = 0;
  for (const mesh of meshes) {
    m.multiplyMatrices(inv, mesh.matrixWorld);
    const g = mesh.geometry, p = g.attributes.position!, ix = g.index, cnt = ix ? ix.count : p.count;
    for (let i = 0; i < cnt; i++) {
      v.fromBufferAttribute(p, ix ? ix.getX(i) : i).applyMatrix4(m);
      pos[o++] = v.x; pos[o++] = v.y; pos[o++] = v.z;
    }
  }
  return { pos, count: n / 3 };
}

function splat(hi: Float32Array, lo: Float32Array | null, res: number, x: number, y: number, z: number) {
  const i = x | 0, j = y | 0;
  if (i < 0 || j < 0 || i >= res || j >= res) return;
  const k = j * res + i;
  if (z > hi[k]!) hi[k] = z;
  if (lo && z < lo[k]!) lo[k] = z;
}

/**
 * Rasterises triangles projected onto (a, b) axes into depth maps of the largest c (`hi`: the nearest to a viewer
 * looking back along +c) and, optionally, the smallest (`lo`: nearest looking along -c), so one pass serves a pair of
 * opposite directions. Coordinates are already in texels.
 */
function rasterise(tri: Float32Array, count: number, res: number, hi: Float32Array, lo: Float32Array | null) {
  hi.fill(-1e9);
  lo?.fill(1e9);
  for (let t = 0; t < count; t++) {
    const o = t * 9;
    const ax = tri[o]!, ay = tri[o + 1]!, az = tri[o + 2]!, bx = tri[o + 3]!, by = tri[o + 4]!, bz = tri[o + 5]!, cx = tri[o + 6]!, cy = tri[o + 7]!, cz = tri[o + 8]!;
    // the corners themselves, so slivers thinner than a texel still occlude
    splat(hi, lo, res, ax, ay, az); splat(hi, lo, res, bx, by, bz); splat(hi, lo, res, cx, cy, cz);
    const minX = Math.min(ax, bx, cx), maxX = Math.max(ax, bx, cx), minY = Math.min(ay, by, cy), maxY = Math.max(ay, by, cy);
    if (maxX - minX < 1.2 && maxY - minY < 1.2) continue; // a triangle within a texel or so: its corners did it
    const area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    if (Math.abs(area) < 1e-6) continue;
    const x0 = Math.max(0, Math.floor(minX)), x1 = Math.min(res - 1, Math.ceil(maxX)), y0 = Math.max(0, Math.floor(minY)), y1 = Math.min(res - 1, Math.ceil(maxY));
    const inv = 1 / area;
    for (let j = y0; j <= y1; j++) {
      const py = j + 0.5;
      for (let i = x0; i <= x1; i++) {
        const px = i + 0.5;
        const w0 = ((bx - px) * (cy - py) - (by - py) * (cx - px)) * inv;
        if (w0 < 0) continue;
        const w1 = ((cx - px) * (ay - py) - (cy - py) * (ax - px)) * inv, w2 = 1 - w0 - w1;
        if (w1 < 0 || w2 < 0) continue;
        const z = w0 * az + w1 * bz + w2 * cz, k = j * res + i;
        if (z > hi[k]!) hi[k] = z;
        if (lo && z < lo[k]!) lo[k] = z;
      }
    }
  }
}

/** Axes spread evenly over a hemisphere (a Fibonacci spiral): with their opposites, the whole sphere. */
function hemisphereAxes(n: number) {
  const out: THREE.Vector3[] = [], golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i + 0.5) / n, r = Math.sqrt(1 - y * y), a = i * golden;
    out.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
  }
  return out;
}

/**
 * Bakes occlusion into each target mesh's `aoOcc` attribute, from the occluders (the targets usually among them).
 * All meshes must be in `space`'s subtree with their world matrices current. Returns the time taken in ms.
 */
export function bakeAO(targets: readonly THREE.Mesh[], occluders: readonly THREE.Mesh[], space: THREE.Object3D, o: BakeOptions = {}) {
  const t0 = performance.now(), res = o.res ?? 160, axes = hemisphereAxes(Math.ceil((o.dirs ?? 40) / 2));
  const occ = gather(occluders, space);
  // receivers: every vertex of every target, with its normal, in the same space
  const inv = new THREE.Matrix4().copy(space.matrixWorld).invert(), m = new THREE.Matrix4(), nm = new THREE.Matrix3();
  // creased meshes repeat each corner once per triangle: bake each distinct point once, with its normals averaged
  let total = 0;
  for (const t of targets) total += t.geometry.attributes.position!.count;
  const P = new Float32Array(total * 3), N = new Float32Array(total * 3), slot = new Int32Array(total), v = new THREE.Vector3();
  const seen = new Map<number, number>();
  let k = 0, nv = 0;
  for (const t of targets) {
    m.multiplyMatrices(inv, t.matrixWorld); nm.getNormalMatrix(m);
    const p = t.geometry.attributes.position!, n = t.geometry.attributes.normal;
    seen.clear();
    for (let i = 0; i < p.count; i++, k++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const key = Math.round(x * 2000) * 73856093 ^ Math.round(y * 2000) * 19349663 ^ Math.round(z * 2000) * 83492791;
      let at = seen.get(key);
      if (at === undefined || Math.abs(P[at * 3]! - v.set(x, y, z).applyMatrix4(m).x) > 1e-3) {
        at = nv++;
        seen.set(key, at);
        v.set(x, y, z).applyMatrix4(m); P[at * 3] = v.x; P[at * 3 + 1] = v.y; P[at * 3 + 2] = v.z;
      }
      slot[k] = at;
      if (n) { v.fromBufferAttribute(n, i).applyMatrix3(nm).normalize(); N[at * 3] = N[at * 3]! + v.x; N[at * 3 + 1] = N[at * 3 + 1]! + v.y; N[at * 3 + 2] = N[at * 3 + 2]! + v.z; }
    }
  }
  for (let i = 0; i < nv; i++) {
    const l = Math.hypot(N[i * 3]!, N[i * 3 + 1]!, N[i * 3 + 2]!) || 1;
    N[i * 3] = N[i * 3]! / l; N[i * 3 + 1] = N[i * 3 + 1]! / l; N[i * 3 + 2] = N[i * 3 + 2]! / l;
  }
  // the bounds the depth maps cover: a sphere round everything
  const box = new THREE.Box3();
  for (let i = 0; i < occ.pos.length; i += 3) box.expandByPoint(v.set(occ.pos[i]!, occ.pos[i + 1]!, occ.pos[i + 2]!));
  for (let i = 0; i < nv * 3; i += 3) box.expandByPoint(v.set(P[i]!, P[i + 1]!, P[i + 2]!));
  const c = box.getCenter(new THREE.Vector3()), R = box.getSize(new THREE.Vector3()).length() / 2 + 0.05;
  const scale = res / (2 * R), texel = (2 * R) / res;
  const proj = new Float32Array(occ.pos.length), hi = new Float32Array(res * res), lo = new Float32Array(res * res);
  const hit = new Float32Array(nv), sum = new Float32Array(nv);
  const u = new THREE.Vector3(), w = new THREE.Vector3();
  for (const d of axes) {
    // a basis with d as the depth axis
    u.set(Math.abs(d.y) < 0.9 ? 0 : 1, Math.abs(d.y) < 0.9 ? 1 : 0, 0).cross(d).normalize();
    w.crossVectors(d, u);
    for (let i = 0; i < occ.pos.length; i += 3) {
      const x = occ.pos[i]! - c.x, y = occ.pos[i + 1]! - c.y, z = occ.pos[i + 2]! - c.z;
      proj[i] = (x * u.x + y * u.y + z * u.z) * scale + res / 2;
      proj[i + 1] = (x * w.x + y * w.y + z * w.z) * scale + res / 2;
      proj[i + 2] = x * d.x + y * d.y + z * d.z;
    }
    rasterise(proj, occ.count, res, hi, lo);
    for (let i = 0; i < nv; i++) {
      const nx = N[i * 3]!, ny = N[i * 3 + 1]!, nz = N[i * 3 + 2]!, along = nx * d.x + ny * d.y + nz * d.z;
      // facing +d, look in the hi map for anything nearer +d; facing -d, in the lo map for anything nearer -d
      const sgn = along >= 0 ? 1 : -1, cos = along * sgn;
      if (cos <= 0.08) continue; // side-on to this axis: it has no say
      // lift the sample off its own surface by about a texel (more at grazing angles), like a shadow map's bias
      const lift = texel * (1.2 + 0.6 / cos);
      const x = P[i * 3]! + nx * lift - c.x, y = P[i * 3 + 1]! + ny * lift - c.y, z = P[i * 3 + 2]! + nz * lift - c.z;
      const a = (x * u.x + y * u.y + z * u.z) * scale + res / 2 - 0.5, b = (x * w.x + y * w.y + z * w.z) * scale + res / 2 - 0.5;
      const dz = x * d.x + y * d.y + z * d.z + sgn * texel * 0.5, map = sgn > 0 ? hi : lo;
      // 2×2 texels, so the result is soft rather than stair-stepped
      const i0 = Math.floor(a), j0 = Math.floor(b), fa = a - i0, fb = b - j0;
      let blocked = 0;
      for (let jj = 0; jj < 2; jj++) for (let ii = 0; ii < 2; ii++) {
        const ti = i0 + ii, tj = j0 + jj;
        if (ti < 0 || tj < 0 || ti >= res || tj >= res) continue;
        if ((map[tj * res + ti]! - dz) * sgn > 0) blocked += (ii ? fa : 1 - fa) * (jj ? fb : 1 - fb);
      }
      hit[i] = hit[i]! + blocked * cos;
      sum[i] = sum[i]! + cos;
    }
  }
  k = 0;
  for (const t of targets) {
    const count = t.geometry.attributes.position!.count, out = new Float32Array(count);
    for (let i = 0; i < count; i++, k++) { const q = slot[k]!; out[i] = sum[q]! > 0 ? hit[q]! / sum[q]! : 0; }
    t.geometry.setAttribute('aoOcc', new THREE.BufferAttribute(out, 1));
  }
  return performance.now() - t0;
}

/** A zero `aoOcc` for a mesh left out of the bake, so a material reading it still works. */
export function noAO(g: THREE.BufferGeometry) {
  if (!g.attributes.aoOcc) g.setAttribute('aoOcc', new THREE.BufferAttribute(new Float32Array(g.attributes.position!.count), 1));
}

/**
 * The soft shadow right under an Aircraft where it nearly touches the floor: dark under the tyres, a broad soft shade
 * under the fuselage and wings. Rasterised from below (in `space`, whose y = 0 is the floor), blurred, and drawn on a
 * flat black-with-alpha plane. Returns the plane, centred under the Aircraft at y = 0.
 */
export function contactShadow(occluders: readonly THREE.Mesh[], space: THREE.Object3D, res = 256) {
  const occ = gather(occluders, space), box = new THREE.Box3(), v = new THREE.Vector3();
  for (let i = 0; i < occ.pos.length; i += 3) box.expandByPoint(v.set(occ.pos[i]!, occ.pos[i + 1]!, occ.pos[i + 2]!));
  const margin = 2.2, x0 = box.min.x - margin, z0 = box.min.z - margin, sx = box.max.x - box.min.x + margin * 2, sz = box.max.z - box.min.z + margin * 2;
  const size = Math.max(sx, sz), k = res / size;
  const proj = new Float32Array(occ.pos.length), depth = new Float32Array(res * res);
  const ox = x0 - (size - sx) / 2, oz = z0 - (size - sz) / 2;
  for (let i = 0; i < occ.pos.length; i += 3) { // looking up from under the floor: keep the lowest point (largest -y)
    proj[i] = (occ.pos[i]! - ox) * k; proj[i + 1] = (occ.pos[i + 2]! - oz) * k; proj[i + 2] = -occ.pos[i + 1]!;
  }
  rasterise(proj, occ.count, res, depth, null);
  const near = new Float32Array(res * res), far = new Float32Array(res * res);
  for (let i = 0; i < res * res; i++) {
    const h = -depth[i]!;
    if (h > 1e8 || h < -1) continue;
    const hh = Math.max(h, 0);
    near[i] = Math.exp(-hh / 0.3);
    far[i] = Math.exp(-hh / 2.5);
  }
  const blur = (a: Float32Array, r: number) => { // separable box blur, three passes ≈ a gaussian
    const tmp = new Float32Array(a.length);
    for (let pass = 0; pass < 3; pass++) {
      for (let j = 0; j < res; j++) { let s = 0; for (let i = -r; i <= r; i++) s += a[j * res + Math.min(Math.max(i, 0), res - 1)]!; for (let i = 0; i < res; i++) { tmp[j * res + i] = s / (2 * r + 1); s += a[j * res + Math.min(i + r + 1, res - 1)]! - a[j * res + Math.max(i - r, 0)]!; } }
      for (let i = 0; i < res; i++) { let s = 0; for (let j = -r; j <= r; j++) s += tmp[Math.min(Math.max(j, 0), res - 1) * res + i]!; for (let j = 0; j < res; j++) { a[j * res + i] = s / (2 * r + 1); s += tmp[Math.min(j + r + 1, res - 1) * res + i]! - tmp[Math.max(j - r, 0) * res + i]!; } }
    }
    return a;
  };
  blur(near, Math.max(1, Math.round(0.07 * k)));
  blur(far, Math.max(2, Math.round(0.5 * k)));
  const data = new Uint8Array(res * res * 4);
  for (let i = 0; i < res * res; i++) {
    const a = Math.min(1, near[i]! * 1.6 + far[i]! * 0.7);
    data[i * 4 + 3] = Math.round(a * 255);
  }
  const tex = new THREE.DataTexture(data, res, res, THREE.RGBAFormat);
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter; tex.needsUpdate = true;
  const geo = new THREE.PlaneGeometry(size, size).rotateX(-Math.PI / 2);
  // the texture's rows run along z and its columns along x, from (ox, oz)
  const uv = geo.attributes.uv!, p = geo.attributes.position!;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + size / 2) / size, (p.getZ(i) + size / 2) / size);
  geo.translate(ox + size / 2, 0, oz + size / 2);
  const mat = new THREE.MeshBasicMaterial({ color: 0x000000, alphaMap: tex, transparent: true, depthWrite: false, opacity: 0.6, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 });
  // the alpha map reads the green channel: put the shade there too
  for (let i = 0; i < res * res; i++) data[i * 4 + 1] = data[i * 4 + 3]!;
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 1;
  mesh.name = 'contact-shadow';
  return mesh;
}

/** How strongly baked occlusion dims reflected light (1 would black out a fully buried vertex). */
const AO_STRENGTH = 0.9;

/** The GLSL that reads `aoOcc` and dims the hangar's light by it; patched into a material's shader. */
export function patchAO(shader: { vertexShader: string; fragmentShader: string }) {
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nattribute float aoOcc;\nvarying float vAoOcc;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvAoOcc = aoOcc;');
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nvarying float vAoOcc;')
    .replace('#include <aomap_fragment>', `#include <aomap_fragment>
{
  float bakedAO = 1.0 - ${AO_STRENGTH.toFixed(2)} * smoothstep(0.0, 0.85, vAoOcc);
  reflectedLight.indirectDiffuse *= bakedAO;
  // deep in a duct or a well the key light is mostly blocked too, beyond what its shadow map resolves
  reflectedLight.directDiffuse *= mix(1.0, bakedAO, 0.35);
  #if defined( USE_CLEARCOAT )
    clearcoatSpecularIndirect *= bakedAO;
  #endif
  #if defined( USE_ENVMAP ) && defined( STANDARD )
    reflectedLight.indirectSpecular *= computeSpecularOcclusion( saturate( dot( geometryNormal, geometryViewDir ) ), bakedAO, material.roughness );
  #else
    reflectedLight.indirectSpecular *= bakedAO;
  #endif
}`);
}

const variants = new WeakMap<THREE.Material, THREE.Material>();
/** All the variants made by `withAO`: shared between Aircraft, so never disposed with one. */
export const AO_SHARED = new Set<THREE.Material>();

/** A copy of a shared material that reads baked occlusion (cached, so every Aircraft shares one copy). */
export function withAO<M extends THREE.Material>(base: M): M {
  let m = variants.get(base) as M | undefined;
  if (!m) {
    m = base.clone() as M;
    m.onBeforeCompile = patchAO;
    m.customProgramCacheKey = () => 'bakedAO';
    variants.set(base, m);
    AO_SHARED.add(m);
  }
  return m;
}
