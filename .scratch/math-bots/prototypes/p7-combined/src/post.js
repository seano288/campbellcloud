// Frame graph. Every effect is a line that can be toggled, so per-effect cost can be measured.
import * as THREE from 'three/webgpu';
import { pass, mrt, output, normalView, metalness, roughness, diffuseColor, velocity, screenUV, sample, packNormalToRGB, unpackRGBToNormal,
  vec2, vec3, vec4, float, uniform, add, renderOutput, convertToTexture, Fn, perspectiveDepthToViewZ, cameraNear, cameraFar, positionView, smoothstep, length, dot, fract, sin, mix, texture3D, exp, max, step, screenCoordinate, uv as uvN, pow, min, luminance } from 'three/tsl';
import { ssgi } from 'three/addons/tsl/display/SSGINode.js';
import { ssr } from 'three/addons/tsl/display/SSRNode.js';
import { ao as gtao } from 'three/addons/tsl/display/GTAONode.js';
import { traa } from 'three/addons/tsl/display/TRAANode.js';
import { motionBlur } from 'three/addons/tsl/display/MotionBlur.js';
import { dof } from 'three/addons/tsl/display/DepthOfFieldNode.js';
import { sharpen } from 'three/addons/tsl/display/SharpenNode.js';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { fxaa } from 'three/addons/tsl/display/FXAANode.js';
import { gaussianBlur } from 'three/addons/tsl/display/GaussianBlurNode.js';
import { bayer16 } from 'three/addons/tsl/math/Bayer.js';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';

function noise3D(size = 64) {
  const d = new Uint8Array(size ** 3), p = new ImprovedNoise(); let i = 0;
  const per = (x, y, z, f) => { // tileable blend
    const n = (a, b, c) => p.noise(a * f, b * f, c * f);
    return (n(x, y, z) * (1 - x) + n(x - 1, y, z) * x);
  };
  for (let z = 0; z < size; z++) for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / size, v = y / size, w = z / size;
    d[i++] = THREE.MathUtils.clamp(128 + 150 * (per(u, v, w, 4) * .6 + per(u, v, w, 8) * .3 + per(u, v, w, 16) * .15), 0, 255);
  }
  const t = new THREE.Data3DTexture(d, size, size, size); t.format = THREE.RedFormat; t.minFilter = t.magFilter = THREE.LinearFilter; t.wrapS = t.wrapT = t.wrapR = THREE.RepeatWrapping; t.unpackAlignment = 1; t.needsUpdate = true;
  return t;
}

export function makeVolume(scene, Q, VOL) {
  const noise = noise3D(), u = { t: uniform(0), plume: uniform(new THREE.Vector3(2, .3, 0)), amt: uniform(0), puff: uniform(new THREE.Vector4(0, .3, 0, 0)), haze: uniform(.05) };
  const m = new THREE.VolumeNodeMaterial();
  m.steps = Q.vol.steps; m.offsetNode = bayer16(screenCoordinate);
  const plumeAt = Fn(([p]) => {
    const wind = vec3(.05, -.18, .03).mul(u.t);
    const n = texture3D(noise, p.add(wind).mul(.3)).r, n2 = texture3D(noise, p.add(wind.mul(1.9)).mul(1.15)).r;
    const y0 = u.plume.y, dy = p.y.sub(y0).max(0);
    const axis = u.plume.xz.add(vec2(-.32, .12).mul(dy)).add(vec2(n.sub(.5), n2.sub(.5)).mul(dy.mul(1.5).add(.2)));
    const d = p.xz.sub(axis), r = dy.mul(.26).add(.2);
    const pl = exp(dot(d, d).div(r.mul(r)).negate()).mul(smoothstep(y0.sub(.4), y0, p.y)).mul(exp(dy.mul(-.2)));
    return pl.mul(smoothstep(.38, .72, n.mul(.62).add(n2.mul(.5))).mul(2.2).add(exp(dy.mul(-1.6)).mul(1.4)));
  });
  // Smoke keeps a little self-lit scatter so it never vanishes outside a spot cone.
  m.scatteringEmissiveNode = Fn(({ positionRay: p }) => plumeAt(p).mul(u.amt).mul(vec3(.5, .5, .54)).mul(.34));
  m.scatteringNode = Fn(({ positionRay: p }) => {
    const wind = vec3(.05, -.18, .03).mul(u.t);
    const n = texture3D(noise, p.add(wind).mul(.3)).r, n2 = texture3D(noise, p.add(wind.mul(1.9)).mul(1.15)).r;
    const y0 = u.plume.y, dy = p.y.sub(y0).max(0);
    const axis = u.plume.xz.add(vec2(-.32, .12).mul(dy)).add(vec2(n.sub(.5), n2.sub(.5)).mul(dy.mul(1.5).add(.2)));
    const d = p.xz.sub(axis), r = dy.mul(.26).add(.2);
    const pl = exp(dot(d, d).div(r.mul(r)).negate()).mul(smoothstep(y0.sub(.4), y0, p.y)).mul(exp(dy.mul(-.2)));
    const pd = p.sub(u.puff.xyz), pr = u.puff.w.mul(.3).add(.5);
    const puff = exp(dot(pd, pd).div(pr.mul(pr)).negate()).mul(u.puff.w);
    const dens = smoothstep(.38, .72, n.mul(.62).add(n2.mul(.5))).mul(2.2);
    const hazeFall = smoothstep(9, 3, p.y);
    return u.haze.mul(hazeFall).mul(n.mul(.9).add(.3)).add(pl.mul(u.amt).mul(dens.add(exp(dy.mul(-1.6)).mul(1.4))).mul(3.2)).add(puff.mul(dens).mul(.4));
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(15, 8.2, 15), m);
  mesh.position.y = 4.1; mesh.receiveShadow = true; mesh.layers.disableAll(); mesh.layers.enable(VOL); mesh.name = 'volume';
  scene.add(mesh);
  return { mesh, material: m, u };
}

export function makePipeline(renderer, scene, camera, Q, { volume, sparksMesh, mirrorMesh, smoke, VOL }) {
  const on = k => Q[k] && !Q.off.has(k);
  const pipe = new THREE.RenderPipeline(renderer); pipe.outputColorTransform = false;
  const u = { focus: uniform(4), aperture: uniform(1.2), mb: uniform(.5), expo: uniform(1), grain: uniform(0), flash: uniform(0) };
  const sp = pass(scene, camera);
  const needGI = on('ssgi'), needSSR = on('ssr');
  // WebGPU's default maxColorAttachmentBytesPerSample is 32 and rgba8unorm/rgba16float each cost 8:
  // five full targets = 40 and fails. rg16f velocity (4) + rg8 metal/rough (2) = 30 fits with no extra limit.
  const targets = { output, velocity, normal: packNormalToRGB(normalView) };
  if (needSSR) targets.metalrough = vec2(metalness, roughness);
  if (needGI) targets.diffuse = diffuseColor;
  sp.setMRT(mrt(targets));
  const col = sp.getTextureNode('output'), depth = sp.getTextureNode('depth'), vel = sp.getTextureNode('velocity'), nrm = sp.getTextureNode('normal');
  sp.getTexture('normal').type = THREE.UnsignedByteType;
  sp.getTexture('velocity').format = THREE.RGFormat;
  if (needSSR) { const t = sp.getTexture('metalrough'); t.type = THREE.UnsignedByteType; t.format = THREE.RGFormat; }
  if (needGI) sp.getTexture('diffuse').type = THREE.UnsignedByteType;
  const sceneN = sample(uv => unpackRGBToNormal(nrm.sample(uv)));
  let lit = col.rgb, gi = null, ref = null;
  if (needGI) {
    gi = ssgi(col, depth, sceneN, camera); gi.sliceCount.value = Q.ssgi[0]; gi.stepCount.value = Q.ssgi[1];
    gi.radius.value = 8; gi.giIntensity.value = 8; gi.aoIntensity.value = 1.1; gi.thickness.value = .35; gi.expFactor.value = 1.4;
    gi.useTemporalFiltering = !!on('traa');
    lit = lit.mul(gi.getAONode()).add(sp.getTextureNode('diffuse').rgb.mul(gi.getGINode().rgb));
  } else if (on('gtao')) {
    const a = gtao(depth, sceneN, camera); a.radius.value = .35; a.distanceExponent.value = 1.1; a.samples.value = Q.gtaoSamples ?? 8;
    if (Q.gtaoRes) a.resolutionScale = Q.gtaoRes;
    lit = lit.mul(a.getTextureNode().r);
  }
  if (needSSR) {
    const mr = sp.getTextureNode('metalrough');
    ref = ssr(col, depth, sceneN, { metalnessNode: mr.r, roughnessNode: mr.g, stochastic: !!Q.ssrStochastic, camera });
    ref.quality.value = Q.ssrQ ?? .5; ref.maxDistance.value = 6; ref.thickness.value = .12; ref.resolutionScale = Q.ssrRes ?? .5; ref.blurQuality = Q.ssrBlur ?? 2;
    lit = lit.add(ref.rgb);
  }
  if (on('vol')) {
    const vd = depth.sample(screenUV); volume.material.depthNode = vd;
    const vp = pass(scene, camera, { depthBuffer: false }); vp.name = 'Volumetric'; const L = new THREE.Layers(); L.disableAll(); L.enable(VOL); vp.setLayers(L); vp.setResolutionScale(Q.vol.res);
    lit = lit.add(gaussianBlur(vp, .7).rgb.mul((Q.vol.gain ?? 1) * .45));
  }
  let img = vec4(lit, 1);
  if (on('traa')) { const t = traa(img, depth, vel, camera); t.depthThreshold = .0008; img = t.getTextureNode(); }
  else if (on('fxaa')) img = fxaa(convertToTexture(renderOutput(img))); // kept linear-ish: only used in last-resort tier
  if (on('sharpen') !== false && !Q.off.has('sharpen') && on('traa')) img = sharpen(convertToTexture(img), Q.sharp ?? 1.05);
  if (on('mb')) {
    // Half-frame shutter, clamped so a fast wheel never exceeds ~1.5% of the screen; ghost-free on few samples.
    const v = vel.rg.mul(vec2(.5, -.5)).mul(u.mb.mul(2)), l = length(v), cl = v.mul(min(l, float(.015)).div(max(l, float(1e-5))));
    img = motionBlur(convertToTexture(img), cl, Q.mbSamples);
  }
  if (on('dof')) img = dof(convertToTexture(img), sp.getViewZNode(), u.focus, u.aperture, Q.bokeh ?? 1);
  const sceneZ = perspectiveDepthToViewZ(depth.sample(screenUV).r, cameraNear, cameraFar);
  if (smoke) {
    // Billboard smoke, half res, composited "over": this is what lets smoke darken the picture.
    const m = smoke.mesh.material, soft = m.userData.viewZ.sub(sceneZ).div(.22).clamp(0, 1), a = m.userData.alpha.mul(soft);
    m.colorNode = m.userData.col.mul(a); m.opacityNode = a; m.needsUpdate = true;
    const sc = new THREE.Scene(); sc.add(smoke.mesh);
    const sm = pass(sc, camera, { depthBuffer: false }); sm.setResolutionScale(Q.smokeRes ?? .5);
    img = vec4(vec3(img.rgb).mul(float(1).sub(sm.a)).add(sm.rgb), 1);
  }
  if (on('sparks')) {
    const fx = new THREE.Scene(); fx.add(sparksMesh, mirrorMesh);
    const m = sparksMesh.material, o = m.opacityNode, mm = mirrorMesh.material, om = mm.opacityNode;
    // manual depth test against the jittered scene depth; the mirror layer only shows where the floor is visible
    m.opacityNode = o.mul(step(sceneZ.sub(.04), m.userData.viewZ));
    mm.opacityNode = om.mul(step(sceneZ.sub(.1), mm.userData.viewZ)).mul(step(mm.userData.viewZ.sub(.1), sceneZ));
    m.needsUpdate = true; mm.needsUpdate = true;
    const fp = pass(fx, camera, { depthBuffer: false });
    img = vec4(vec3(img.rgb).add(fp.rgb.min(vec3(1.8, .62, .13))), 1);
  }
  if (on('bloom')) {
    const b = bloom(vec4(img.rgb, 1), Q.bloomS ?? .09, .5, 1.5);
    img = vec4(vec3(img.rgb).add(b.rgb), 1);
  }
  // Camera response in display space: lens vignette, sensor noise.
  const graded = Fn(() => {
    const c = renderOutput(img).rgb.toVar();
    // Broadcast contrast: gentle S-curve around mid grey, slight black crush, cooled shadows.
    const luma = luminance(c), s = c.sub(.5).mul(1.1).add(.5).clamp(0, 1);
    c.assign(mix(c, s.mul(s).mul(s.mul(-2).add(3)), .55));
    c.assign(mix(vec3(luminance(c)), c, .98).sub(.012).clamp(0, 1).mul(vec3(.985, 1, 1.03)).clamp(0, 1));
    const d = screenUV.sub(.5).mul(vec2(1.15, 1)), v = float(1).sub(dot(d, d).mul(.72));
    c.mulAssign(v.clamp(0, 1));
    const g = fract(sin(dot(screenCoordinate.xy.add(u.grain), vec2(12.9898, 78.233))).mul(43758.5453)).sub(.5);
    const lum = luminance(c);
    c.addAssign(g.mul(.022).mul(float(1).sub(lum.mul(.65))));
    return vec4(c, 1);
  })();
  pipe.outputNode = graded;
  return { pipe, u, gi, ref };
}
