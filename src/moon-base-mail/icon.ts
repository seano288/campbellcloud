// The Home Screen icon: a moon base dome with a lit window on grey moon ground under a black sky with the blue Earth, and in front of it
// a cream envelope whose stamp is a small moon. Thick dark outlines, like the family's icons. One 512×512 SVG made in code; tools/icons.ts
// rasterises it, and the landing tile uses it. Kept apart from Rover Code (a rover on a planet) and Globe Hopper (a rocket on Earth).
const BG = '#151a2e';
const O = '#14161b';
const line = (w: number) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

const scene = () => `
  <rect width="512" height="512" fill="${BG}"/>
  ${[[60, 70], [140, 40], [220, 96], [300, 52], [470, 150], [40, 200], [420, 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#ffffff"/>`).join('')}
  <circle cx="400" cy="110" r="52" fill="#3a86ff" ${line(10)}/>
  <path d="M372 92 Q392 74 414 88 Q406 112 382 112 Z" fill="#2ec45a"/>
  <path d="M0 330 Q120 300 256 320 T512 310 V512 H0 Z" fill="#8a8f99" ${line(10)}/>`;

const art = () => `
  <path d="M96 330 Q96 176 236 176 Q376 176 376 330 Z" fill="#f4ecd8" ${line(12)}/>
  <rect x="206" y="232" width="60" height="60" rx="10" fill="#ffd23f" ${line(10)}/>
  <path d="M236 176 V132" ${line(10)}/><path d="M236 132 L280 146 L236 160 Z" fill="#e63946" ${line(8)}/>
  <rect x="200" y="300" width="250" height="160" rx="14" fill="#fff6e0" ${line(12)}/>
  <path d="M200 312 L325 392 L450 312" fill="none" ${line(12)}/>
  <rect x="380" y="320" width="54" height="62" rx="6" fill="#ffffff" stroke="#e63946" stroke-width="6" stroke-dasharray="8 6"/>
  <circle cx="407" cy="351" r="18" fill="#ffd23f" ${line(6)}/><circle cx="414" cy="345" r="16" fill="#ffffff"/>`;

/** The icon as SVG. scale shrinks the art (not the background): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${scene()}<g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_BG = BG;
