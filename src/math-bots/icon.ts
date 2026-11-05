// The Home Screen icon: Torque, a low boxy wedge robot with a big "+" on its armour, on a workshop floor with a hazard stripe.
// An original robot, not any show's. One 512×512 SVG made in code; tools/icons.ts rasterises it at build time.
const BG = '#1f3a4f';
const O = 'stroke="#111" stroke-width="12" stroke-linejoin="round" stroke-linecap="round"';

/** The robot alone, viewBox 512×512. */
const bot = () => `
  <path d="M86 372 L146 214 H366 L426 372 Z" fill="#e8622c" ${O}/>
  <path d="M176 238 H336 L356 300 H156 Z" fill="#bfe3f7" ${O}/>
  <circle cx="214" cy="270" r="17" fill="#111"/><circle cx="298" cy="270" r="17" fill="#111"/>
  <path d="M250 150 V214 M262 150 V214" stroke="#111" stroke-width="12"/><circle cx="256" cy="132" r="26" fill="#ffd23f" ${O}/>
  <rect x="58" y="362" width="396" height="44" rx="12" fill="#3b424c" ${O}/>
  ${[120, 256, 392].map(x => `<circle cx="${x}" cy="414" r="46" fill="#1a1a1a" ${O}/><circle cx="${x}" cy="414" r="18" fill="#c7ced6"/>`).join('')}
  <g transform="translate(256 336)"><path d="M-30 0 H30 M0 -30 V30" stroke="#fff" stroke-width="20" stroke-linecap="round"/></g>`;

export const botSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="30 90 452 380">${bot()}</svg>`;

const stripes = () => Array.from({ length: 12 }, (_, i) => `<path d="M${i * 60 - 60} 512 L${i * 60} 462 H${i * 60 + 30} L${i * 60 - 30} 512 Z" fill="#111"/>`).join('');

export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${BG}"/><rect y="462" width="512" height="50" fill="#ffd23f"/>${stripes()}<g transform="translate(${off} ${off}) scale(${scale})">${bot()}</g></svg>`;
}
export const ICON_BG = BG;
