// Materials for the Aircraft. Paint is a clear-coated physical material that reads its colour from the livery atlas by
// projection (see livery.ts): from above or below on surfaces that face up or down, from the side on surfaces that
// face sideways, blended between. It uses the mesh's own coordinates, so a moving part keeps its paint as it turns.
import * as THREE from 'three';
import type { Rung } from '../catalog';
import { ATLAS } from './livery';
import type { Finish } from './spec';

export function paintMaterial(atlas: THREE.Texture, min: THREE.Vector3, max: THREE.Vector3, finish: 'matte' | 'satin' | 'gloss' | 'metal') {
  const look = {
    matte: { roughness: 0.62, metalness: 0, clearcoat: 0.08, clearcoatRoughness: 0.6 },
    satin: { roughness: 0.42, metalness: 0, clearcoat: 0.45, clearcoatRoughness: 0.25 },
    gloss: { roughness: 0.28, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06 },
    metal: { roughness: 0.22, metalness: 1, clearcoat: 0.6, clearcoatRoughness: 0.1 },
  }[finish];
  const m = new THREE.MeshPhysicalMaterial({ color: 0xffffff, ...look });
  const half = 0.5 / ATLAS;
  m.onBeforeCompile = shader => {
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
vec4 atlasAt(vec2 corner, vec2 f) { return texture2D(liveryMap, corner + clamp(f, vec2(${half}), vec2(1.0 - ${half})) * 0.5); }`)
      .replace('#include <map_fragment>', `
vec3 an = normalize(vAirNormal);
vec3 rel = clamp((vAirPos - lvMin) / (lvMax - lvMin), 0.0, 1.0);
float wy = pow(abs(an.y), 4.0), wz = pow(abs(an.z), 4.0) + 0.25 * pow(abs(an.x), 4.0) + 1e-4;
vec4 fromAbove = an.y >= 0.0 ? atlasAt(vec2(0.0, 0.0), rel.xz) : atlasAt(vec2(0.5, 0.0), rel.xz);
vec4 fromSide = an.z >= 0.0 ? atlasAt(vec2(0.0, 0.5), vec2(rel.x, 1.0 - rel.y)) : atlasAt(vec2(0.5, 0.5), vec2(rel.x, 1.0 - rel.y));
diffuseColor *= (fromAbove * wy + fromSide * wz) / (wy + wz);`);
  };
  m.customProgramCacheKey = () => 'livery';
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
  return new THREE.MeshPhysicalMaterial({
    color: l.color, metalness: l.metalness, roughness: l.roughness, clearcoat: 1, clearcoatRoughness: 0.02, transparent: true, opacity: l.opacity, depthWrite: false,
    iridescence: l.iridescence, iridescenceIOR: 1.6, iridescenceThicknessRange: [200, 600], envMapIntensity: 1.6,
  });
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
export const SHARED = new Set<THREE.Material>([...Object.values(FIXED), RUBBER, HUB]);
