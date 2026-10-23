// The Home Screen icon: a pizza cut into quarters, one slice carried off on a sling by a red helicopter, on a sunburst. One 512×512 SVG
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
const CRUST = 'fill="#ffd36e" stroke="#d68a3c" stroke-width="16" stroke-linejoin="round"';
const art = () => {
  const cx = 190, cy = 340, r = 130, q = Math.PI / 2;
  // three quarters left on the plate; the empty quarter is where the slice came from
  const pizza = [0, 1, 2].map(k => `<path d="${wedge(cx, cy, r, k * q, (k + 1) * q)}" ${CRUST}/>`).join('');
  const plate = `<circle cx="${cx}" cy="${cy}" r="${r + 20}" fill="#f4f4f0" stroke="#111" stroke-width="10"/>${pizza}${pepperoni([[250, 390], [218, 437], [130, 395], [160, 440], [150, 245], [108, 298]])}`;
  // the fourth quarter hangs tip down on a sling from the helicopter's belly hook, out to the right of its gap
  const sx = 386, sy = 312, sr = 118, c = sr * Math.SQRT1_2;
  const slice = `<path d="M${sx - c} ${sy - c} L${sx} 130 L${sx + c} ${sy - c}" fill="none" stroke="#111" stroke-width="5" stroke-linejoin="round"/>
    <path d="${wedge(sx, sy, sr, -3 * q / 2, -q / 2)}" ${CRUST}/>${pepperoni([[sx - 26, sy - 82], [sx + 24, sy - 70], [sx, sy - 38]])}`;
  // a red chopper side on, drawn nose left and flipped to face right: rotor, cabin, tail boom and fin, tail rotor, skids
  const heli = `<g transform="translate(380 60) scale(-.64 .64)" stroke="#111" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <path d="M-150 0 H150" stroke-width="14"/><rect x="-12" y="0" width="24" height="20" fill="#2a2f36"/>
    <path d="M196 4 L214 -8 L228 52 L208 62 Z" fill="#e23b3b"/>
    <circle cx="214" cy="26" r="26" fill="#ffffff66" stroke-width="6"/>
    <path d="M-30 20 H40 Q78 20 84 52 L200 40 L204 64 L84 84 Q72 108 30 108 H-70 Q-124 108 -126 64 Q-124 20 -30 20 Z" fill="#e23b3b"/>
    <path d="M84 62 L200 52" fill="none" stroke="#fff" stroke-width="7"/>
    <path d="M-40 34 H6 V74 H-110 Q-106 38 -40 34 Z" fill="#bfe6ff" stroke-width="7"/>
    <path d="M-110 140 Q-104 150 -88 150 H74 M-64 108 V150 M36 108 V150" fill="none" stroke-width="10"/>
  </g>`;
  return `${plate}${slice}${heli}`;
};

export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${SKY}"/>${rays()}<g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_SKY = SKY;
