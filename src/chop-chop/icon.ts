// The Home Screen icon: a pizza cut into quarters, one slice lifted away by a helicopter on a sunburst. One 512×512 SVG
// made in code; tools/icons.ts rasterises it at build time.
const SKY = '#1f8fd6';
const rays = () => Array.from({ length: 12 }, (_, i) => {
  const a0 = ((i * 30 - 7) * Math.PI) / 180, a1 = ((i * 30 + 7) * Math.PI) / 180, r = 520;
  return `<path d="M256 256 L${256 + r * Math.cos(a0)} ${256 + r * Math.sin(a0)} L${256 + r * Math.cos(a1)} ${256 + r * Math.sin(a1)} Z" fill="#4fb0ea"/>`;
}).join('');
const wedge = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const p = (a: number) => `${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`;
  return `M${cx} ${cy}L${p(a0)}A${r} ${r} 0 0 1 ${p(a1)}Z`;
};
const pepperoni = (pts: [number, number][]) => pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="17" fill="#d9442b"/>`).join('');
const art = () => {
  const cx = 230, cy = 330, r = 150, q = Math.PI / 2;
  // three quarters on the plate; the fourth lifted up and away under the helicopter
  const pizza = [0, 1, 2].map(k => `<path d="${wedge(cx, cy, r, k * q, (k + 1) * q)}" fill="#ffd36e" stroke="#d68a3c" stroke-width="16" stroke-linejoin="round"/>`).join('');
  const slice = `<g transform="translate(70 -150)"><path d="${wedge(cx, cy, r, 3 * q, 4 * q)}" fill="#ffd36e" stroke="#d68a3c" stroke-width="16" stroke-linejoin="round"/>${pepperoni([[300, 250], [335, 300]])}</g>`;
  const heli = `<g transform="translate(330 70)" stroke="#111" stroke-width="7" stroke-linejoin="round">
    <path d="M-110 0 H110" stroke-width="12" stroke-linecap="round"/><rect x="-8" y="0" width="16" height="22" fill="#2a2f36"/>
    <path d="M-60 22 Q-75 70 -30 82 L60 82 Q85 82 90 60 L150 50 L160 30 L172 30 L168 64 L95 82 Q80 104 40 104 L-30 104 Q-80 100 -60 22 Z" fill="#3d6b3a"/>
    <path d="M-52 34 Q-62 66 -28 74 L0 74 L0 34 Z" fill="#7cc8ff" stroke-width="5"/>
    <path d="M-40 118 H70 M-20 104 V118 M50 104 V118" fill="none" stroke-width="8" stroke-linecap="round"/>
    <path d="M10 104 L20 168" fill="none" stroke-width="4" stroke-dasharray="6 6"/>
  </g>`;
  return `<circle cx="${cx}" cy="${cy}" r="${r + 20}" fill="#f4f4f0" stroke="#111" stroke-width="10"/>${pizza}${pepperoni([[160, 380], [210, 430], [280, 395], [175, 300], [140, 250]])}${slice}${heli}`;
};

export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${SKY}"/>${rays()}<g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_SKY = SKY;
