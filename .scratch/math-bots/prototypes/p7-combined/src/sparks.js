// GPU spark system. WebGPU: compute shader over a storage buffer with floor + wall bounces.
// WebGL2 fallback: same maths on the CPU with far fewer sparks.
import * as THREE from 'three/webgpu';
import { Fn, If, instanceIndex, instancedArray, instancedBufferAttribute, uniform, uint, float, vec2, vec3, vec4, hash, mix, normalize, positionGeometry, cameraProjectionMatrix, cameraViewMatrix, cameraPosition, length, max, abs, exp, screenSize, uv, smoothstep, sqrt, varyingProperty, min, pow, clamp, select } from 'three/tsl';
import { HALF } from './arena.js';

const G = 9.81, REST = .36, FRIC = .72;

export function makeSparks(renderer, count, useCompute) {
  const uDt = uniform(0), uStart = uniform(0, 'uint'), uCount = uniform(0, 'uint'), uSeed = uniform(0), uOrigin = uniform(new THREE.Vector3()), uDir = uniform(new THREE.Vector3(0, 1, 0)),
    uSpread = uniform(.8), uVmin = uniform(2), uVmax = uniform(10), uCap = uniform(count, 'uint');
  let head = 0, seed = 1, pending = [], pos, vel, computeNode = null, posAttr, velAttr, cpu = null, init = null;
  if (useCompute) {
    const posB = instancedArray(count, 'vec4'), velB = instancedArray(count, 'vec4');
    init = Fn(() => {
      const p = posB.element(instanceIndex), v = velB.element(instanceIndex);
      p.w.assign(-1); v.assign(vec4(0));
    })().compute(count);
    computeNode = Fn(() => {
      const p = posB.element(instanceIndex), v = velB.element(instanceIndex);
      const k = instanceIndex.add(uCap).sub(uStart).mod(uCap);
      If(k.lessThan(uCount), () => {
        const r = i => hash(instanceIndex.add(uint(uSeed)).add(uint(i * 7919)));
        const rv = vec3(r(1).sub(.5), r(2).sub(.5), r(3).sub(.5)).mul(2);
        const dir = normalize(uDir.add(rv.mul(uSpread)));
        const sp = mix(uVmin, uVmax, r(4).mul(r(4)));
        const jit = vec3(r(5).sub(.5), r(6).sub(.5), r(7).sub(.5)).mul(.16);
        p.assign(vec4(uOrigin.add(jit), mix(.25, 1.5, r(8).mul(r(9)))));
        v.assign(vec4(dir.mul(sp), p.w.max(.001)));
      }).Else(() => {
        If(p.w.greaterThan(0), () => {
          const nv = v.xyz.mul(exp(uDt.mul(-.75))).add(vec3(0, uDt.mul(-G), 0)).toVar();
          const np = p.xyz.add(nv.mul(uDt)).toVar();
          If(np.y.lessThan(.008).and(nv.y.lessThan(0)), () => {
            nv.assign(vec3(nv.x.mul(FRIC), nv.y.mul(-REST), nv.z.mul(FRIC))); np.y.assign(.008);
          });
          If(abs(np.x).greaterThan(HALF - .02), () => { nv.x.mulAssign(-.3); np.x.assign(np.x.clamp(-HALF + .02, HALF - .02)); });
          If(abs(np.z).greaterThan(HALF - .02), () => { nv.z.mulAssign(-.3); np.z.assign(np.z.clamp(-HALF + .02, HALF - .02)); });
          p.xyz.assign(np); p.w.subAssign(uDt); v.xyz.assign(nv);
        });
      });
    })().compute(count);
    renderer.compute(init);
    pos = posB.toAttribute(); vel = velB.toAttribute();
  } else {
    posAttr = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4); velAttr = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4);
    for (let i = 0; i < count; i++) posAttr.array[i * 4 + 3] = -1;
    posAttr.setUsage(THREE.DynamicDrawUsage); velAttr.setUsage(THREE.DynamicDrawUsage);
    pos = instancedBufferAttribute(posAttr); vel = instancedBufferAttribute(velAttr);
    cpu = true;
  }
  // Stretched quad along the screen-space motion of one shutter interval.
  const uShutter = uniform(1 / 60), SHUTTER = uShutter;
  const mk = mirror => {
  const mat = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const heat = varyingProperty('vec2', mirror ? 'vSparkHeatM' : 'vSparkHeat'), vz = varyingProperty('float', mirror ? 'vSparkZM' : 'vSparkZ'), hgt = varyingProperty('float', mirror ? 'vSparkHM' : 'vSparkH');
  mat.vertexNode = Fn(() => {
    const flip = vec3(1, mirror ? -1 : 1, 1), Pw = pos.xyz.mul(flip), P = vec4(Pw, 1), Vv = vel.xyz.mul(flip), alive = pos.w;
    const vp = cameraProjectionMatrix.mul(cameraViewMatrix);
    const c0 = vp.mul(P).toVar(), c1 = vp.mul(vec4(Pw.sub(Vv.mul(SHUTTER)), 1)).toVar();
    const aspect = vec2(screenSize.x.div(screenSize.y), 1);
    const s0 = c0.xy.div(c0.w).mul(aspect), s1 = c1.xy.div(c1.w).mul(aspect);
    const d = s1.sub(s0).toVar();
    const l = max(length(d), .0001);
    const dir = d.div(l), perp = vec2(dir.y.negate(), dir.x);
    const w = float(1.9).div(screenSize.y).mul(alive.div(vel.w).mul(.6).add(.5));
    const along = positionGeometry.y.add(.5);
    const c = mix(c0, c1, along).toVar();
    const off = perp.mul(positionGeometry.x).mul(w).div(aspect).mul(c.w).mul(2);
    heat.assign(vec2(clamp(alive.div(vel.w), 0, 1), along));
    hgt.assign(pos.y);
    // mirrored sparks are depth-tested at the floor point the reflection appears on
    { const k = cameraPosition.y.div(cameraPosition.y.sub(Pw.y).max(.001)), F = cameraPosition.add(Pw.sub(cameraPosition).mul(k)); vz.assign(cameraViewMatrix.mul(vec4(mirror ? F : Pw, 1)).z); }
    c.xy.addAssign(off);
    return select(alive.greaterThan(0), c, vec4(0, 0, 2, 0));
  })();
  mat.userData.viewZ = vz;
  const lifeF = heat.x;
  const col = mix(vec3(1, .13, .01), mix(vec3(1, .42, .06), vec3(1, .68, .3), smoothstep(.6, .98, lifeF)), smoothstep(.0, .5, lifeF));
  mat.colorNode = vec4(col.mul(lifeF.mul(lifeF).mul(2.4).add(.8)), 1);
  // Newborn sparks are all in one spot: hold them back so the core stays orange, not a white disc.
  mat.opacityNode = float(1).sub(heat.y.mul(.7)).mul(smoothstep(0, .08, lifeF)).mul(smoothstep(1, .84, lifeF).mul(.82).add(.18)).mul(mirror ? exp(hgt.mul(-1.6)).mul(.34) : 1);
  mat.userData.mirror = mirror;
  return mat; };

  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([-.5, -.5, 0, .5, -.5, 0, .5, .5, 0, -.5, .5, 0], 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  geo.setIndex([0, 1, 2, 0, 2, 3]); geo.instanceCount = count;
  const mesh = new THREE.Mesh(geo, mk(false)); mesh.frustumCulled = false; mesh.name = 'sparks';
  const mirrorMesh = new THREE.Mesh(geo, mk(true)); mirrorMesh.frustumCulled = false; mirrorMesh.name = 'sparksMirror';

  let rs = 1; const r = () => (rs = (rs * 16807) % 2147483647) / 2147483647;
  const cpuEmit = b => {
    const n = Math.min(b.n, count); for (let i = 0; i < n; i++) {
      const j = (head + i) % count, s = .5 * 2, dx = b.dir.x + (r() - .5) * s * b.spread, dy = b.dir.y + (r() - .5) * s * b.spread, dz = b.dir.z + (r() - .5) * s * b.spread, l = Math.hypot(dx, dy, dz) || 1;
      const sp = b.vmin + (b.vmax - b.vmin) * r() * r(), life = .25 + 1.25 * r() * r();
      posAttr.array.set([b.origin.x, b.origin.y, b.origin.z, life], j * 4); velAttr.array.set([dx / l * sp, dy / l * sp, dz / l * sp, life], j * 4);
    }
    head = (head + n) % count;
  };
  const cpuStep = dt => {
    const p = posAttr.array, v = velAttr.array, dr = Math.exp(-.75 * dt);
    for (let i = 0; i < count; i++) {
      const a = i * 4; if (p[a + 3] <= 0) continue;
      v[a] *= dr; v[a + 1] = v[a + 1] * dr - G * dt; v[a + 2] *= dr;
      p[a] += v[a] * dt; p[a + 1] += v[a + 1] * dt; p[a + 2] += v[a + 2] * dt; p[a + 3] -= dt;
      if (p[a + 1] < .008 && v[a + 1] < 0) { p[a + 1] = .008; v[a + 1] *= -REST; v[a] *= FRIC; v[a + 2] *= FRIC; }
    }
    posAttr.needsUpdate = velAttr.needsUpdate = true;
  };
  return {
    mesh, mirrorMesh, count, uShutter,
    clear() { pending.length = 0; if (cpu) { for (let i = 0; i < count; i++) posAttr.array[i * 4 + 3] = -1; posAttr.needsUpdate = true; } else renderer.compute(init); },
    emit(b) { pending.push(b); },
    update(dt) {
      uDt.value = dt;
      if (cpu) { for (const b of pending) cpuEmit(b); pending.length = 0; cpuStep(dt); return; }
      const b = pending.shift();
      if (b) {
        const n = Math.min(b.n, count);
        uStart.value = head; uCount.value = n; uSeed.value = (seed = (seed * 48271) % 2147483647) % 1000000;
        uOrigin.value.copy(b.origin); uDir.value.copy(b.dir); uSpread.value = b.spread; uVmin.value = b.vmin; uVmax.value = b.vmax;
        head = (head + n) % count;
      } else uCount.value = 0;
      renderer.compute(computeNode);
    },
  };
}
