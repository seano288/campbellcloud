// The airfield under Take Off: grass to the horizon and a long runway with its white lines, drawn in code. The Aircraft
// stays put while the world moves, so the field scrolls by as fast as the air, fading out at its edges and as he climbs.
import * as THREE from 'three';

const SIZE = 2400, RUNWAY_W = 46, GRASS_TILE = 40, RUNWAY_TILE = 60;

function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat = true) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; }
  return t;
}

const speckle = (g: CanvasRenderingContext2D, w: number, h: number, n: number, colours: string[], r: number) => {
  for (let i = 0; i < n; i++) { g.fillStyle = colours[i % colours.length]!; g.fillRect(Math.random() * w, Math.random() * h, r, r); }
};

export class Airfield {
  readonly group = new THREE.Group();
  private grass: THREE.MeshStandardMaterial;
  private runway: THREE.MeshStandardMaterial;

  constructor() {
    const grassMap = canvasTexture(256, 256, g => {
      g.fillStyle = '#5f8f3e'; g.fillRect(0, 0, 256, 256);
      speckle(g, 256, 256, 2600, ['#6e9c48', '#527f35', '#78a650', '#4c7630'], 3);
    });
    grassMap.repeat.set(SIZE / GRASS_TILE, SIZE / GRASS_TILE);
    const fade = canvasTexture(128, 128, g => { // the field fades into the sky at its edge
      const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      r.addColorStop(0, '#fff'); r.addColorStop(0.55, '#fff'); r.addColorStop(1, '#000');
      g.fillStyle = r; g.fillRect(0, 0, 128, 128);
    }, false);
    this.grass = new THREE.MeshStandardMaterial({ map: grassMap, alphaMap: fade, transparent: true, depthWrite: false, roughness: 1 });
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE).rotateX(-Math.PI / 2), this.grass);
    grass.position.y = -0.03;

    const runwayMap = canvasTexture(512, 384, g => { // one length of runway: asphalt, edge lines and a centre dash
      g.fillStyle = '#3d4044'; g.fillRect(0, 0, 512, 384);
      speckle(g, 512, 384, 5000, ['#45484d', '#34373b', '#4c4f53'], 2);
      g.fillStyle = '#eef0ee';
      g.fillRect(0, 10, 512, 10); g.fillRect(0, 364, 512, 10);
      g.fillRect(0, 186, 256, 12);
    });
    runwayMap.repeat.set(SIZE / RUNWAY_TILE, 1);
    const ends = canvasTexture(256, 1, g => {
      const l = g.createLinearGradient(0, 0, 256, 0);
      l.addColorStop(0, '#000'); l.addColorStop(0.3, '#fff'); l.addColorStop(0.7, '#fff'); l.addColorStop(1, '#000');
      g.fillStyle = l; g.fillRect(0, 0, 256, 1);
    }, false);
    this.runway = new THREE.MeshStandardMaterial({ map: runwayMap, alphaMap: ends, transparent: true, depthWrite: false, roughness: 0.9 });
    const runway = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, RUNWAY_W).rotateX(-Math.PI / 2), this.runway);
    runway.position.y = 0;
    runway.renderOrder = 1;

    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(120, 120).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ opacity: 0.45 }));
    shadow.receiveShadow = true;
    shadow.position.y = 0.02;
    shadow.renderOrder = 2;
    this.group.add(grass, runway, shadow);
  }

  /** Scrolls the field by the distance flown and lowers it to the Aircraft's height above it, fading it out up high. */
  update(dist: number, altitude: number) {
    this.group.position.y = -altitude;
    this.grass.map!.offset.x -= dist / GRASS_TILE;
    this.runway.map!.offset.x -= dist / RUNWAY_TILE;
    this.grass.map!.offset.x %= 1; this.runway.map!.offset.x %= 1;
    const o = 1 - THREE.MathUtils.smoothstep(altitude, 25, 110);
    this.grass.opacity = this.runway.opacity = o;
    this.group.visible = o > 0.01;
  }

  dispose() {
    this.group.traverse(o => {
      if (!(o instanceof THREE.Mesh)) return;
      o.geometry.dispose();
      const m = o.material as THREE.MeshStandardMaterial;
      m.map?.dispose(); m.alphaMap?.dispose(); m.dispose();
    });
  }
}
