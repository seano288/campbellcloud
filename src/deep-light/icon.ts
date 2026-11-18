// The Home Screen icon: his yellow submarine low on the left of a near-black sea, its headlight beam cutting a warm cone up to the
// right where it picks out a glowing fish, cyan and friendly. Little bubbles rise behind the sub. One 512×512 SVG made in code;
// tools/icons.ts rasterises it at build time.
const BG = '#04102a', O = '#141414', SUB = '#ffd23f', SUB2 = '#e8a800', FISH = '#5af0ff';

const art = () => `
  <!-- the beam, from the headlight to the fish: lighter where it starts -->
  <path d="M300 330 L520 140 L520 380 Z" fill="url(#beam)"/>
  <!-- the fish in the light, glowing -->
  <circle cx="400" cy="250" r="96" fill="url(#glow)"/>
  <g transform="translate(400 250) rotate(-8)">
    <path d="M-42 0 L-88 -34 Q-74 0 -88 34 Z" fill="${FISH}" stroke="${O}" stroke-width="10" stroke-linejoin="round"/>
    <ellipse cx="0" cy="0" rx="58" ry="40" fill="${FISH}" stroke="${O}" stroke-width="11"/>
    <path d="M-20 -36 Q0 -62 22 -38" fill="${FISH}" stroke="${O}" stroke-width="9" stroke-linejoin="round"/>
    <circle cx="24" cy="-8" r="14" fill="#fff" stroke="${O}" stroke-width="6"/>
    <circle cx="28" cy="-7" r="8" fill="#1b1530"/>
    <circle cx="24" cy="-11" r="3" fill="#fff"/>
    <path d="M30 14 Q40 22 50 12" fill="none" stroke="${O}" stroke-width="6" stroke-linecap="round"/>
    <circle cx="-20" cy="18" r="6" fill="#fff8" /><circle cx="-2" cy="22" r="6" fill="#fff8"/><circle cx="-38" cy="12" r="5" fill="#fff8"/>
  </g>
  <!-- bubbles -->
  ${[[70, 210, 12], [96, 168, 8], [64, 132, 10], [110, 110, 6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#9fd8ff" stroke-width="5"/>`).join('')}
  <!-- the submarine -->
  <g transform="translate(176 360)">
    <path d="M-150 0 L-176 -34 L-176 34 Z" fill="${SUB2}" stroke="${O}" stroke-width="11" stroke-linejoin="round"/>
    <rect x="-56" y="-108" width="96" height="62" rx="18" fill="${SUB}" stroke="${O}" stroke-width="12"/>
    <path d="M-6 -108 V-140 H30" fill="none" stroke="${O}" stroke-width="12" stroke-linecap="round"/>
    <ellipse cx="0" cy="0" rx="152" ry="74" fill="${SUB}" stroke="${O}" stroke-width="13"/>
    <path d="M-120 30 Q0 66 120 30" fill="none" stroke="${SUB2}" stroke-width="12" stroke-linecap="round"/>
    ${[-74, -8, 58].map(x => `<circle cx="${x}" cy="-8" r="25" fill="#9fe6ff" stroke="${O}" stroke-width="10"/><circle cx="${x - 8}" cy="-16" r="7" fill="#fff"/>`).join('')}
    <!-- the headlight -->
    <circle cx="134" cy="-24" r="24" fill="#fff6c8" stroke="${O}" stroke-width="10"/>
  </g>`;

/** The icon as SVG. scale shrinks the art (not the background): 0.8 keeps it inside a maskable icon's safe zone. */
export function iconSvg(scale = 1): string {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs>`
    + `<linearGradient id="beam" x1="300" y1="330" x2="520" y2="260" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff2b0" stop-opacity=".95"/><stop offset="1" stop-color="#ffd23f" stop-opacity=".25"/></linearGradient>`
    + `<radialGradient id="glow"><stop offset="0" stop-color="${FISH}" stop-opacity=".9"/><stop offset=".55" stop-color="${FISH}" stop-opacity=".35"/><stop offset="1" stop-color="${FISH}" stop-opacity="0"/></radialGradient>`
    + `<radialGradient id="sea" cx=".3" cy=".2" r=".9"><stop offset="0" stop-color="#0d2a5a"/><stop offset="1" stop-color="${BG}"/></radialGradient>`
    + `</defs><rect width="512" height="512" fill="url(#sea)"/><g transform="translate(${off} ${off}) scale(${scale})">${art()}</g></svg>`;
}
export const ICON_BG = BG;
