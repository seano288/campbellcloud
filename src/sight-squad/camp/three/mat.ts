// The play-mat his army stands on, by Mat Mod: a sandbox in a wooden frame, a lawn, a snowfield, a beach with the sea along
// the back, or the Moon (grey and cratered, under a black sky full of stars, where hops float). Each is a canvas texture
// painted once, a few props, and the sky behind it.
import * as THREE from 'three';

/** The sky, the ground beyond the mat (the sandbox sits in a garden), and how hops fall. */
export interface MatLook { sky: THREE.Color; beyond: THREE.Color; gravity: number }

const LOOKS: readonly MatLook[] = [
  { sky: new THREE.Color('#9fd4f5'), beyond: new THREE.Color('#5f9a3c'), gravity: 9 },
  { sky: new THREE.Color('#9fd4f5'), beyond: new THREE.Color('#4f8a32'), gravity: 9 },
  { sky: new THREE.Color('#c9dcec'), beyond: new THREE.Color('#dfe8f0'), gravity: 9 },
  { sky: new THREE.Color('#8fd0f4'), beyond: new THREE.Color('#d9c08a'), gravity: 9 },
  { sky: new THREE.Color('#05060c'), beyond: new THREE.Color('#7c7e84'), gravity: 2.2 },
];
export const matLook = (rung: number) => LOOKS[rung]!;

function speckle(g: CanvasRenderingContext2D, n: number, colors: readonly string[], r: [number, number], size: number) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = colors[i % colors.length]!;
    g.beginPath(); g.arc(Math.random() * size, Math.random() * size, r[0] + Math.random() * (r[1] - r[0]), 0, Math.PI * 2); g.fill();
  }
}

function paint(rung: number) {
  const size = 1024, c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  switch (rung) {
    case 0: // sand
      g.fillStyle = '#e2c48e'; g.fillRect(0, 0, size, size);
      speckle(g, 9000, ['#d6b57c', '#ecd3a2', '#c9a66c', '#f3dfb6'], [0.6, 1.8], size);
      break;
    case 1: // a mown lawn, in stripes
      for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#64a843' : '#74b84e'; g.fillRect(0, (i * size) / 8, size, size / 8); }
      speckle(g, 7000, ['#5c9c3c', '#86c75c', '#4f8f35'], [0.6, 1.6], size);
      speckle(g, 50, ['#ffffff', '#ffd23f'], [2.5, 4], size); // daisies
      break;
    case 2: // snow
      g.fillStyle = '#eef3f8'; g.fillRect(0, 0, size, size);
      speckle(g, 5000, ['#dfe8f1', '#ffffff', '#d3dfea'], [1, 3], size);
      break;
    case 3: { // a beach: sand in front, the sea along the back
      g.fillStyle = '#ecd5a0'; g.fillRect(0, 0, size, size);
      speckle(g, 8000, ['#e0c58b', '#f4e2b8', '#d9bb7f'], [0.6, 1.8], size);
      const sea = g.createLinearGradient(0, 0, 0, size * 0.22);
      sea.addColorStop(0, '#1f8fd6'); sea.addColorStop(0.8, '#5cc3ef'); sea.addColorStop(1, '#a9e4f7');
      g.fillStyle = sea; g.fillRect(0, 0, size, size * 0.22);
      g.strokeStyle = '#ffffff'; g.lineWidth = 10; g.beginPath();
      for (let x = 0; x <= size; x += 16) g.lineTo(x, size * 0.22 + Math.sin(x / 40) * 8);
      g.stroke();
      speckle(g, 12, ['#ff9a7a', '#ffd6e0'], [5, 8], size); // shells
      break;
    }
    default: { // the Moon
      g.fillStyle = '#9a9ca2'; g.fillRect(0, 0, size, size);
      speckle(g, 7000, ['#8c8e94', '#a8aab0', '#7d7f85'], [0.8, 2.2], size);
      for (let i = 0; i < 40; i++) {
        const x = Math.random() * size, y = Math.random() * size, r = 12 + Math.random() * 46;
        g.fillStyle = '#7f8187'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#8d8f95'; g.beginPath(); g.arc(x + r * 0.12, y + r * 0.12, r * 0.82, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#b3b5bb'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, r, Math.PI * 0.9, Math.PI * 1.7); g.stroke();
      }
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export class Mat {
  readonly group = new THREE.Group();
  private things: THREE.Object3D[] = [];
  private textures: THREE.Texture[] = [];
  rung = -1;
  size = 16;

  /** Lays out the mat for this Mat Mod, `size` across. */
  set(rung: number, size: number) {
    if (rung === this.rung && Math.abs(size - this.size) < 0.01) return;
    this.rung = rung; this.size = size;
    this.clear();
    const tex = paint(rung);
    this.textures.push(tex);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(size, size).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: tex, roughness: rung === 2 ? 0.7 : 0.95 }));
    floor.receiveShadow = true;
    this.add(floor);
    // the ground beyond the mat, so the edge doesn't drop off into the sky
    const beyond = new THREE.Mesh(new THREE.CircleGeometry(size * 4, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: matLook(rung).beyond, roughness: 1 }));
    beyond.position.y = -0.02;
    beyond.receiveShadow = true;
    this.add(beyond);
    if (rung === 0) this.frame(size);
    if (rung === 2) this.mounds(size, 0xffffff, 0.6);
    if (rung === 4) this.stars();
  }

  private add(o: THREE.Object3D) { this.group.add(o); this.things.push(o); }

  /** A sandbox's wooden frame. */
  private frame(size: number) {
    const wood = new THREE.MeshStandardMaterial({ color: 0xa8733f, roughness: 0.8 }), h = 0.45, w = 0.35;
    for (const [x, z, sx, sz] of [[0, size / 2, size + w * 2, w], [0, -size / 2, size + w * 2, w], [size / 2, 0, w, size], [-size / 2, 0, w, size]] as const) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(sx, h, sz), wood);
      b.position.set(x, h / 2 - 0.05, z);
      b.castShadow = b.receiveShadow = true;
      this.add(b);
    }
  }

  /** Snow mounds round the edges. */
  private mounds(size: number, color: number, k: number) {
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.3, r = size * 0.46, m = new THREE.Mesh(new THREE.SphereGeometry(0.8 + Math.random() * 0.7, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat);
      m.scale.y = k;
      m.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      m.receiveShadow = true;
      this.add(m);
    }
  }

  /** The stars over the Moon. */
  private stars() {
    const n = 600, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.8 + 0.05, Math.random() - 0.5).normalize().multiplyScalar(120);
      pos.set([v.x, v.y, v.z], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.6, sizeAttenuation: true, fog: false })));
    const earth = new THREE.Mesh(new THREE.SphereGeometry(6, 32, 16), new THREE.MeshStandardMaterial({ color: 0x3f8fe0, emissive: 0x1a4f8a, emissiveIntensity: 0.6 }));
    earth.position.set(-40, 38, -90);
    this.add(earth);
  }

  private clear() {
    for (const o of this.things) {
      this.group.remove(o);
      o.traverse(x => { if (x instanceof THREE.Mesh || x instanceof THREE.Points) { x.geometry.dispose(); (x.material as THREE.Material).dispose(); } });
    }
    this.things = [];
    for (const t of this.textures) t.dispose();
    this.textures = [];
  }
  dispose() { this.clear(); }
}
