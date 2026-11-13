// Materials for the Aircraft. Paint is a clear-coated physical material that reads its colour from the livery atlas by
// projection (see livery.ts): from above or below on surfaces that face up or down, from the side on surfaces that
// face sideways, blended between. It uses the mesh's own coordinates, so a moving part keeps its paint as it turns.
import * as THREE from 'three';
import type { Rung } from '../catalog';
import { ATLAS } from './livery';
import type { Finish } from './spec';
import { patchAO } from './ao';

/** Cheap 3D value noise (0..1) in aircraft metres, for paint that isn't perfectly even. */
const NOISE = `
float lvHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float lvNoise(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(lvHash(i), lvHash(i + vec3(1, 0, 0)), f.x), mix(lvHash(i + vec3(0, 1, 0)), lvHash(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(lvHash(i + vec3(0, 0, 1)), lvHash(i + vec3(1, 0, 1)), f.x), mix(lvHash(i + vec3(0, 1, 1)), lvHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}`;

/**
 * The paint. `ao` makes it read the baked occlusion each vertex carries (ao.ts); every mesh it's on must then have one.
 * Its roughness and clear coat vary a little over the surface, as real paint does, so reflections don't look like
 * plastic.
 */
export function paintMaterial(atlas: THREE.Texture, min: THREE.Vector3, max: THREE.Vector3, finish: 'matte' | 'satin' | 'gloss' | 'metal', o: { ao?: boolean } = {}) {
  const look = {
    matte: { roughness: 0.62, metalness: 0, clearcoat: 0.08, clearcoatRoughness: 0.6 },
    satin: { roughness: 0.42, metalness: 0, clearcoat: 0.45, clearcoatRoughness: 0.25 },
    gloss: { roughness: 0.28, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06 },
    metal: { roughness: 0.22, metalness: 1, clearcoat: 0.6, clearcoatRoughness: 0.1 },
  }[finish];
  const m = new THREE.MeshPhysicalMaterial({ color: 0xffffff, ...look });
  const half = 0.5 / ATLAS;
  m.onBeforeCompile = shader => {
    if (o.ao) patchAO(shader);
    shader.uniforms.liveryMap = { value: atlas };
    shader.uniforms.lvMin = { value: min };
    shader.uniforms.lvMax = { value: max };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vAirPos;\nvarying vec3 vAirNormal;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvAirPos = position;\nvAirNormal = objectNormal;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
uniform sampler2D liveryMap;
uniform vec3 lvMin;
uniform vec3 lvMax;
varying vec3 vAirPos;
varying vec3 vAirNormal;
vec4 atlasAt(vec2 corner, vec2 f) { return texture2D(liveryMap, corner + clamp(f, vec2(${half}), vec2(1.0 - ${half})) * 0.5); }
${NOISE}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
float lvVar = lvNoise(vAirPos * 0.7) * 0.65 + lvNoise(vAirPos * 3.1) * 0.35;
// (not on chrome: a mirror finish should stay a clean mirror)
float lvAmount = 1.0 - 0.85 * metalness;
roughnessFactor = clamp(roughnessFactor + (lvVar - 0.5) * 0.14 * lvAmount, 0.05, 1.0);`)
      .replace('#include <lights_physical_fragment>', `#include <lights_physical_fragment>
#ifdef USE_CLEARCOAT
material.clearcoatRoughness = clamp(material.clearcoatRoughness * mix(1.0, 0.55 + 0.9 * lvVar, lvAmount), 0.0, 1.0);
material.clearcoat *= mix(1.0, 0.8 + 0.2 * lvVar, lvAmount);
#endif`)
      .replace('#include <map_fragment>', `
vec3 an = normalize(vAirNormal);
vec3 rel = clamp((vAirPos - lvMin) / (lvMax - lvMin), 0.0, 1.0);
float wy = pow(abs(an.y), 4.0), wz = pow(abs(an.z), 4.0) + 0.25 * pow(abs(an.x), 4.0) + 1e-4;
vec4 fromAbove = an.y >= 0.0 ? atlasAt(vec2(0.0, 0.0), rel.xz) : atlasAt(vec2(0.5, 0.0), rel.xz);
vec4 fromSide = an.z >= 0.0 ? atlasAt(vec2(0.0, 0.5), vec2(rel.x, 1.0 - rel.y)) : atlasAt(vec2(0.5, 0.5), vec2(rel.x, 1.0 - rel.y));
diffuseColor *= (fromAbove * wy + fromSide * wz) / (wy + wz);`);
  };
  m.customProgramCacheKey = () => (o.ao ? 'livery+ao' : 'livery');
  return m;
}

/** Canopy glass, by Canopy Mod: Clear, Smoke Tint, Gold Tint, Blue Mirror, Diamond. */
export function glassMaterial(rung: Rung) {
  const looks = [
    { color: 0x5d7380, metalness: 0.2, roughness: 0.02, iridescence: 0.15, opacity: 0.38 },
    { color: 0x14171a, metalness: 0.4, roughness: 0.03, iridescence: 0.1, opacity: 0.72 },
    { color: 0xc8962a, metalness: 0.9, roughness: 0.05, iridescence: 0.45, opacity: 0.8 },
    { color: 0x2a62d8, metalness: 0.95, roughness: 0.03, iridescence: 0.85, opacity: 0.85 },
    { color: 0xe8fbff, metalness: 1, roughness: 0.0, iridescence: 1, opacity: 0.7 },
  ] as const;
  const l = looks[rung];
  // see-through, so the pilot shows; no transmission pass, which is costly on an iPad
  const m = new THREE.MeshPhysicalMaterial({
    color: l.color, metalness: l.metalness, roughness: l.roughness, clearcoat: 1, clearcoatRoughness: 0.02, transparent: true, opacity: l.opacity, depthWrite: false,
    iridescence: l.iridescence, iridescenceIOR: 1.6, iridescenceThicknessRange: [200, 600], envMapIntensity: 1.6,
  });
  // real glass reflects more, and lets less through, the more side-on it's seen (Fresnel): the canopy's curve reads
  m.onBeforeCompile = shader => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
float glassFres = pow(1.0 - saturate(abs(dot(normalize(normal), normalize(vViewPosition)))), 3.0);
diffuseColor.a = mix(diffuseColor.a, 1.0, glassFres * 0.75);
outgoingLight += reflectedLight.indirectSpecular * glassFres * 0.6;
#include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => 'fresnel-glass';
  return m;
}

export const FIXED: Record<Exclude<Finish, 'paint' | 'glass'>, THREE.Material> = {
  dark: new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.85, metalness: 0.2 }),
  metal: new THREE.MeshStandardMaterial({ color: 0xa9afb6, roughness: 0.32, metalness: 1 }),
  nozzle: new THREE.MeshPhysicalMaterial({ color: 0x5f5d5a, roughness: 0.45, metalness: 1, iridescence: 0.18, iridescenceIOR: 1.8, iridescenceThicknessRange: [250, 420] }),
  gear: new THREE.MeshStandardMaterial({ color: 0xdfe2e6, roughness: 0.38, metalness: 0.55 }),
  black: new THREE.MeshStandardMaterial({ color: 0x1a1b1d, roughness: 0.55, metalness: 0.1 }),
};
export const RUBBER = new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.92 });
export const HUB = new THREE.MeshStandardMaterial({ color: 0xc9ccd1, roughness: 0.3, metalness: 0.9 });
/** The small parts the builder adds to every Aircraft: landing gear, intakes, nozzles, propellers. */
export const DETAIL = {
  /** The polished piston of an oleo strut. */
  chrome: new THREE.MeshStandardMaterial({ color: 0xe4e8ec, roughness: 0.12, metalness: 1 }),
  /** Intake ducts are painted white or light grey inside. */
  duct: new THREE.MeshStandardMaterial({ color: 0xb4b6b2, roughness: 0.6, metalness: 0.05 }),
  /** An engine's fan or turbine face, deep in a duct or a nozzle. */
  fan: new THREE.MeshStandardMaterial({ color: 0x2a2c2f, roughness: 0.45, metalness: 0.85 }),
  /** Propeller blades: satin black, with yellow tips. */
  blade: new THREE.MeshStandardMaterial({ color: 0x18191b, roughness: 0.42, metalness: 0.25 }),
  tip: new THREE.MeshStandardMaterial({ color: 0xf2c230, roughness: 0.45, metalness: 0.05 }),
  /** Rubber seals, hoses and the like. */
  rubber: new THREE.MeshStandardMaterial({ color: 0x2a2b2d, roughness: 0.8 }),
};

/** A nozzle's inner liner: scorched metal that glows when the engine runs (set `emissiveIntensity`); one per Aircraft. */
export function linerMaterial() {
  const m = new THREE.MeshStandardMaterial({ color: 0x6e675f, roughness: 0.6, metalness: 0.7, emissive: 0xff6a1a, emissiveIntensity: 0 });
  m.onBeforeCompile = patchAO;
  m.customProgramCacheKey = () => 'bakedAO';
  return m;
}

export const SHARED = new Set<THREE.Material>([...Object.values(FIXED), RUBBER, HUB, ...Object.values(DETAIL)]);
