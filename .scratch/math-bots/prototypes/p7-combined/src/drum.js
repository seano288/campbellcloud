// The drum at speed. A camera shutter is open for a large part of a revolution, so the picture is a time average:
// the round core stays sharp, and the teeth become a soft band whose density is how long a tooth covers that spot.
// So this shell does the sum per pixel: it marches the view ray through the drum's tooth rows and uses the exact
// fraction of the shutter a tooth occupies each point (a box the width of a tooth, convolved with the shutter arc).
// It picks tooth or core stochastically per pixel and TRAA resolves that. As the drum slows, the same maths narrows
// the smear into visible passing teeth, with no swap or fade.
import * as THREE from 'three/webgpu';
import { Fn, float, vec2, vec3, vec4, uniform, positionLocal, modelWorldMatrixInverse, cameraPosition, normalize, length, abs, min, max, mod, atan, clamp, select, If, Loop, Break, screenCoordinate, fract, sin, dot, texture, transformNormalToView, mix, smoothstep, sqrt, pow, Discard } from 'three/tsl';

export const TIP = .163, HALF = .243;
const CORE = .105, FLANGE = .123, FLANGE_X = .205, ROWS = [-.135, 0, .135], ROW_W = .033;

export function drumShell(T, N = 8) {
  const uAngle = uniform(0), uArc = uniform(3.3), uFrame = uniform(0);
  const m = new THREE.MeshStandardNodeMaterial();
  const march = Fn(() => {
    const ro = modelWorldMatrixInverse.mul(vec4(cameraPosition, 1)).xyz, p0 = positionLocal.xyz, rd = normalize(p0.sub(ro));
    const sc0 = screenCoordinate.xy.add(uFrame.mod(16).mul(3.1)), n0 = fract(fract(sc0.x.mul(.06711056).add(sc0.y.mul(.00583715))).mul(52.9829189));
    // exit distance of the bounding cylinder, axis X
    const a = rd.y.mul(rd.y).add(rd.z.mul(rd.z)).max(1e-5), b = p0.y.mul(rd.y).add(p0.z.mul(rd.z)), c = p0.y.mul(p0.y).add(p0.z.mul(p0.z)).sub(TIP * TIP * 1.002);
    const tEnd = b.negate().add(sqrt(b.mul(b).sub(a.mul(c)).max(0))).div(a).min(.4), dt = tEnd.div(N);
    const best = float(0).toVar(), bn = vec3(1, 0, 0).toVar(), core = float(0).toVar(), cn = vec3(1, 0, 0).toVar(), cx = float(0).toVar();
    Loop(N, ({ i }) => {
      const q = p0.add(rd.mul(dt.mul(float(i).add(n0)))), r = length(q.yz), x = q.x, ax = abs(x);
      const rc = select(ax.greaterThan(FLANGE_X), float(FLANGE), float(CORE));
      If(r.lessThan(rc).and(ax.lessThan(HALF)), () => { core.assign(1); cn.assign(select(ax.greaterThan(HALF - .006), vec3(x.greaterThan(0).select(1, -1), 0, 0), vec3(0, q.y.div(r), q.z.div(r)))); cx.assign(x); Break(); });
      const th = atan(q.z, q.y);
      for (let k = 0; k < 3; k++) {
        const inRow = abs(x.sub(ROWS[k])).lessThan(ROW_W).and(r.greaterThan(CORE)).and(r.lessThan(TIP));
        If(inRow, () => {
          const w = float(.037).div(r).mul(smoothstep(TIP, TIP - .012, r).mul(.28).add(.72)), s = uArc.mul(.5).min(Math.PI / 2).max(.001);
          const phase = uAngle.add(k === 1 ? Math.PI / 2 : 0), d = abs(mod(th.sub(phase).add(Math.PI / 2), Math.PI).sub(Math.PI / 2));
          const cover = clamp(w.add(s).sub(d).div(min(w, s).mul(2)), 0, 1).mul(min(float(1), w.div(s)));
          If(cover.greaterThan(best), () => { best.assign(cover); bn.assign(vec3(0, q.y.div(r), q.z.div(r))); });
        });
      }
    });
    // In front of the core the sum is a plain blend, so it needs no noise. Only the see-through rim is dithered.
    return vec4(normalize(mix(cn, bn, best)), best.add(core.mul(2)));
  });
  const res = march();
  const hasCore = res.w.greaterThan(1.5), best = select(hasCore, res.w.sub(2), res.w);
  const sc = screenCoordinate.xy.add(uFrame.mod(16).mul(5.588238)), dith = fract(fract(sc.x.mul(.06711056).add(sc.y.mul(.00583715))).mul(52.9829189)); // interleaved gradient noise: resolves cleanly under TRAA
  m.positionNode = positionLocal;
  m.opacityNode = select(hasCore.or(dith.lessThan(best.mul(1.3))), float(1), float(0)); m.alphaTest = .5;
  m.normalNode = normalize(transformNormalToView(res.xyz));
  const x = positionLocal.x, ring = texture(T.scratch, vec2(x.mul(3.1), .37)).r, ring2 = texture(T.scratch, vec2(x.mul(9.7), .71)).b;
  const lathe = sin(x.mul(310)).mul(.5).add(.5), toothK = smoothstep(.0, .3, best).mul(.85); // fine turned rings survive the blur, since they are round
  const toothC = vec3(.062, .06, .057), coreC = mix(vec3(.018, .018, .02), vec3(.055, .055, .054), ring.mul(.35).add(ring2.mul(.15))).mul(lathe.mul(.4).add(.8));
  m.colorNode = mix(coreC, toothC, toothK);
  m.metalnessNode = float(.85); m.roughnessNode = mix(float(.54).add(ring2.mul(.1)).add(lathe.mul(.06)), float(.68), toothK);
  const g = new THREE.CylinderGeometry(TIP, TIP, HALF * 2, 48, 1, false); g.rotateZ(Math.PI / 2);
  const mesh = new THREE.Mesh(g, m); mesh.name = 'drumShell'; mesh.castShadow = true; mesh.receiveShadow = true;
  return { mesh, uAngle, uArc, uFrame };
}
