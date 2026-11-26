// The Home Screen icon: a loud orange monster truck flying high, nose up, over a yellow tape measure pulled out of its case, with black
// ticks and numbers. Behind it the night arena: floodlight rays fanning from behind the truck (the sunburst every sibling icon has, here
// in night navy), the stands as a dark band with coloured crowd and camera flashes, and the dirt floor. Thick dark outlines throughout.
// Apart from Monster Truck Money's front-on red truck on yellow and Turbo Tally's race car on a track: this one is side-on, in the air,
// and measured. One 512×512 SVG made in code; tools/icons.ts rasterises it, and the landing tile uses it.

const BG = '#141838';
const O = '#0d0a05';
const line = (w: number) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

/** Floodlight rays fanning out from behind the truck. */
const rays = (cx: number, cy: number) => {
  let out = '';
  for (let i = 0; i < 16; i++) {
    const a0 = (i / 16) * Math.PI * 2, a1 = a0 + Math.PI / 16, R = 760;
    out += `<path d="M${cx} ${cy}L${(cx + Math.cos(a0) * R).toFixed(1)} ${(cy + Math.sin(a0) * R).toFixed(1)}L${(cx + Math.cos(a1) * R).toFixed(1)} ${(cy + Math.sin(a1) * R).toFixed(1)}Z" fill="#232a63"/>`;
  }
  return out;
};

/** The night arena: sky and rays, a glow, the stands with crowd and flashes, the dirt. */
const scene = () => {
  let crowd = '';
  const cols = ['#e63946', '#ffd23f', '#2f8fe8', '#2fa84f', '#ff7aa8', '#f6f8fb', '#ff7a00'];
  for (let r = 0; r < 3; r++) for (let i = 0; i < 18; i++) {
    const x = 14 + i * 29 + (r % 2) * 14, y = 330 + r * 20;
    if ((i * 7 + r * 3) % 5 === 0) continue;
    crowd += `<circle cx="${x}" cy="${y}" r="6.5" fill="${cols[(i + r * 2) % cols.length]}" opacity=".85"/>`;
  }
  const flash = (x: number, y: number, s: number) => `<path d="M${x - s} ${y}L${x} ${y - s * .25}L${x + s} ${y}L${x} ${y + s * .25}ZM${x} ${y - s}L${x + s * .25} ${y}L${x} ${y + s}L${x - s * .25} ${y}Z" fill="#fff"/>`;
  return `<rect width="512" height="512" fill="${BG}"/>${rays(290, 190)}
  <circle cx="290" cy="190" r="150" fill="#fff6c4" opacity=".14"/><circle cx="290" cy="190" r="90" fill="#fff6c4" opacity=".16"/>
  <rect x="0" y="312" width="512" height="80" fill="#1c1a26"/>${crowd}${flash(96, 334, 16)}${flash(402, 352, 13)}${flash(250, 330, 10)}
  <rect x="0" y="384" width="512" height="16" fill="#ffd23f"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => `<rect x="${i * 52}" y="384" width="26" height="16" fill="#1b1e24"/>`).join('')}
  <rect x="0" y="400" width="512" height="112" fill="#6b4226"/><rect x="0" y="400" width="512" height="10" fill="#8b5a2b"/>`;
};

/** The tape measure: the yellow case at the left, the tape pulled out to the right edge, ticks every quarter, numbers 0 to 3. */
const tape = () => {
  let ticks = '';
  for (let i = 0; i <= 15; i++) {
    const x = 176 + i * 24, big = i % 4 === 0;
    ticks += `<path d="M${x} 422V${big ? 452 : 438}" ${line(big ? 7 : 5)}/>`;
    if (big) ticks += `<text x="${x}" y="494" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="42" text-anchor="middle" fill="${O}">${i / 4}</text>`;
  }
  return `<path d="M132 420H530V502H132Z" fill="#ffd23f" ${line(9)}/>${ticks}
  <rect x="22" y="398" width="132" height="112" rx="26" fill="#ffd23f" ${line(10)}/>
  <circle cx="84" cy="454" r="34" fill="#1b1e24" ${line(6)}/><circle cx="84" cy="454" r="12" fill="#ffd23f"/>`;
};

/** The truck, side-on and centred on (0, 0): fat lugged tyres with yellow rims, shocks, an orange body with a yellow flame. */
const tyre = (cx: number) => {
  let lugs = '';
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * 360;
    lugs += `<rect x="${cx - 7}" y="-18" width="14" height="20" rx="3" fill="#1b1e24" ${line(5)} transform="rotate(${a} ${cx} 40)"/>`;
  }
  return `${lugs}<circle cx="${cx}" cy="40" r="50" fill="#1b1e24" ${line(8)}/><circle cx="${cx}" cy="40" r="36" fill="none" stroke="#3a3f47" stroke-width="4"/>
  <circle cx="${cx}" cy="40" r="24" fill="#ffd23f" ${line(6)}/><circle cx="${cx}" cy="40" r="8" fill="${O}"/>`;
};
const truck = () => `
  <path d="M-78 30 L-70 -18 M86 30 L78 -18" stroke="${O}" stroke-width="16" stroke-linecap="round"/>
  <path d="M-78 30 L-70 -18 M86 30 L78 -18" stroke="#c9d1da" stroke-width="8" stroke-linecap="round"/>
  <rect x="-104" y="-26" width="212" height="16" rx="4" fill="#2a2f36" ${line(6)}/>
  ${tyre(-78)}${tyre(86)}
  <path d="M-128 -18 L-128 -74 L104 -66 L132 -44 L132 -18 Z" fill="#ff7a00" ${line(10)}/>
  <path d="M-34 -72 L-26 -128 L50 -128 L70 -68 Z" fill="#ff7a00" ${line(10)}/>
  <path d="M-16 -78 L-11 -116 L40 -116 L52 -78 Z" fill="#bfe6ff" ${line(6)}/><path d="M14 -116 L28 -116 L10 -78 L-4 -78 Z" fill="#fff" opacity=".7"/>
  <path d="M132 -58 L70 -54 L92 -44 L20 -46 L44 -36 L-40 -38 L60 -24 L40 -32 L132 -28 Z" fill="#ffd23f" ${line(4)}/>
  <rect x="-128" y="-30" width="260" height="12" fill="#000" opacity=".22"/>
  <circle cx="122" cy="-52" r="8" fill="#fff6c4" ${line(4)}/>`;

const art = () => `${tape()}
  <path d="M28 318 Q90 196 168 200" fill="none" stroke="#fff" stroke-width="9" stroke-dasharray="4 20" stroke-linecap="round" opacity=".8"/>
  <g transform="translate(290 200) rotate(-15) scale(1.2)">${truck()}</g>`;

/** The icon as SVG. scale shrinks the art (not the background): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${scene()}<g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_BG = BG;
