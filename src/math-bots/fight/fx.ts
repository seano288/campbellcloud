// @ts-nocheck: ported from the P7 prototype. Its TSL node graphs and terse maths don't fit the strict compiler flags, so the typed edge is stage.ts.
// Billboard smoke (works on every tier and can darken what is behind it, which the additive volume cannot),
// floor scorch decals, and a mirrored spark layer for the steel floor. Smoke is closed-form in sim time, so replay rewinds it.
import * as THREE from 'three/webgpu';
import { Fn, uniform, instancedBufferAttribute, float, vec2, vec3, vec4, sin, cos, exp, smoothstep, select, cameraProjectionMatrix, cameraViewMatrix, positionGeometry, varyingProperty, texture, mix } from 'three/tsl';

export class Smoke {
  constructor(T, max = 900) {
    this.max = max; this.n = 0; this.A = ['b0', 'b1', 'b2'].map(() => { const a = new THREE.InstancedBufferAttribute(new Float32Array(max * 4), 4); a.setUsage(THREE.DynamicDrawUsage); return a; });
    this.A[0].array.fill(-999); this.uT = uniform(0); this.uFlash = uniform(0);
    const [b0, b1, b2] = this.A.map(a => instancedBufferAttribute(a)), uT = this.uT;
    const m = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, depthTest: false, premultipliedAlpha: true, side: THREE.DoubleSide });
    const vUv = varyingProperty('vec2', 'vSUv'), vK = varyingProperty('vec3', 'vSK'), vz = varyingProperty('float', 'vSZ');
    m.vertexNode = Fn(() => {
      const age = uT.sub(b0.w), life = b1.w, k = age.div(life), e = float(1).sub(exp(age.mul(-1.6))).div(1.6);
      const p = b0.xyz.add(b1.xyz.mul(e)).add(vec3(sin(age.mul(1.7).add(b2.y.mul(6))).mul(.12).mul(age), age.mul(age).mul(.32).add(age.mul(.15)), cos(age.mul(1.3).add(b2.y.mul(9))).mul(.12).mul(age)));
      const size = b2.x.mul(age.mul(1.5).add(1)), mv = cameraViewMatrix.mul(vec4(p, 1)).toVar(), a = b2.y.mul(6.28).add(age.mul(.5).mul(b2.y.sub(.5)));
      const q = positionGeometry.xy; mv.xy.addAssign(vec2(q.x.mul(cos(a)).sub(q.y.mul(sin(a))), q.x.mul(sin(a)).add(q.y.mul(cos(a)))).mul(size));
      vUv.assign(q.mul(.5).add(.5)); vK.assign(vec3(smoothstep(0, .08, k).mul(float(1).sub(k)).mul(float(1).sub(k)), b2.z, q.y.mul(.5).add(.5))); vz.assign(mv.z);
      return select(age.greaterThan(0).and(age.lessThan(life)), cameraProjectionMatrix.mul(mv), vec4(0, 0, 2, 0));
    })();
    m.userData.viewZ = vz;
    const tx = texture(T.puff, vUv).a;
    this.alpha = smoothstep(.02, .9, tx).mul(vK.x).mul(.3);
    const col = mix(vec3(.3, .29, .27), vec3(.075, .072, .07), vK.y).mul(vK.z.mul(.95).add(.55)).add(vec3(1, .45, .14).mul(this.uFlash).mul(.5));
    m.colorNode = col.mul(this.alpha); m.opacityNode = this.alpha; m.userData.alpha = this.alpha; m.userData.col = col;
    const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2)); g.setIndex([0, 1, 2, 0, 2, 3]); g.instanceCount = max;
    this.mesh = new THREE.Mesh(g, m); this.mesh.frustumCulled = false; this.mesh.name = 'smoke';
  }
  add(s) { const o = (this.n++ % this.max) * 4, [a, b, c] = this.A.map(x => x.array); a[o] = s.p.x; a[o + 1] = s.p.y; a[o + 2] = s.p.z; a[o + 3] = s.t; b[o] = s.v.x; b[o + 1] = s.v.y; b[o + 2] = s.v.z; b[o + 3] = s.life; c[o] = s.size; c[o + 1] = (this.n * .6180339) % 1; c[o + 2] = s.dark; for (const x of this.A) x.needsUpdate = true; }
  reset() { this.n = 0; this.A[0].array.fill(-999); this.A[0].needsUpdate = true; }
}

export class Scorch {
  constructor(max = 200) {
    const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); let s = 5; const r = () => (s = s * 16807 % 2147483647) / 2147483647;
    const g = x.createRadialGradient(128, 128, 4, 128, 128, 120); g.addColorStop(0, 'rgba(0,0,0,.92)'); g.addColorStop(.45, 'rgba(0,0,0,.5)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    x.strokeStyle = 'rgba(170,170,165,.75)'; for (let i = 0; i < 14; i++) { const a = r() * 6.28, b = 8 + r() * 24, l = 30 + r() * 80; x.lineWidth = .6 + r() * 1.4; x.beginPath(); x.moveTo(128 + Math.cos(a) * b, 128 + Math.sin(a) * b); x.lineTo(128 + Math.cos(a) * (b + l), 128 + Math.sin(a) * (b + l)); x.stroke(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.MeshStandardNodeMaterial({ map: t, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, roughness: .7, metalness: .35 });
    const g2 = new THREE.PlaneGeometry(1, 1); g2.rotateX(-Math.PI / 2);
    this.mesh = new THREE.InstancedMesh(g2, m, max); this.mesh.count = 0; this.mesh.frustumCulled = false; this.mesh.receiveShadow = true; this.mesh.renderOrder = 1; this.list = []; this.max = max;
  }
  update(t) { const m = new THREE.Matrix4(), q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0), s = new THREE.Vector3(); let n = 0;
    for (const d of this.list) { if (d.t > t || n >= this.max) continue; q.setFromAxisAngle(Y, d.rot); s.set(d.size, 1, d.size * (d.kind === 2 ? .3 : 1)); m.compose(d.p, q, s); this.mesh.setMatrixAt(n++, m); }
    if (n !== this.mesh.count) { this.mesh.count = n; this.mesh.instanceMatrix.needsUpdate = true; } }
}
