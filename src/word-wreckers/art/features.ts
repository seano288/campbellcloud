// The things a Road Job puts on the Town's road, drawn in code: an arch he drives under (the Car Wash, the Bubble Arch...), something
// on the road he drives over (the Jump Ramp, the Speed Bumps, the Mud Puddle, the Turbo Pad), the Tunnel he drives through and the
// Loop the Loop he drives round. One SVG each, used by the Job's cards and drawn on the Town's road. The road is at the bottom (y = H).
import type { FeatureId } from '../yard/shop';

export const FEATURE_W = 220, FEATURE_H = 170;
const O = '#1d1d1f';
const L = (w = 4) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const H = FEATURE_H;
const emo = (x: number, y: number, size: number, e: string) => `<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle" class="emo-svg">${e}</text>`;
const pillar = (x: number, fill: string) => `<rect x="${x}" y="40" width="22" height="${H - 40}" rx="4" fill="${fill}" ${L()}/>`;
const RAINBOW = ['#e63946', '#ff9a1f', '#ffd23f', '#2bb673', '#3d9be0', '#7a4fd8'];
const rainbow = (r: number, w: number, colors = RAINBOW) => colors
  .map((c, i) => `<path d="M${110 - r + i * w} ${H} A${r - i * w} ${r - i * w} 0 0 1 ${110 + r - i * w} ${H}" fill="none" stroke="${c}" stroke-width="${w}"/>`).join('');

const DRAW: Record<FeatureId, () => string> = {
  carwash: () => `${pillar(14, '#3d9be0')}${pillar(184, '#3d9be0')}<rect x="6" y="18" width="208" height="34" rx="8" fill="#bfe6f5" ${L()}/>` +
    `<text x="110" y="43" font-size="22" font-weight="900" font-family="Nunito,sans-serif" text-anchor="middle" fill="${O}">WASH</text>` +
    [42, 170].map(x => `<rect x="${x - 8}" y="56" width="16" height="${H - 64}" rx="8" fill="#7a4fd8" ${L(3)}/>${[0, 1, 2, 3].map(i => `<path d="M${x - 8} ${70 + i * 22} h16" stroke="#c3a8f0" stroke-width="4"/>`).join('')}`).join('') +
    emo(14, 22, 20, '🫧') + emo(206, 22, 20, '🫧'),
  ramp: () => `<path d="M30 ${H} L170 ${H - 46} L190 ${H - 46} L190 ${H} Z" fill="#ffd23f" ${L()}/>${[0, 1, 2, 3].map(i => `<path d="M${60 + i * 30} ${H - 10 - i * 9} l14 -5" stroke="${O}" stroke-width="6"/>`).join('')}` +
    `<path d="M178 ${H - 46} V${H - 80}" stroke="${O}" stroke-width="4"/><path d="M178 ${H - 80} L200 ${H - 72} L178 ${H - 64} Z" fill="#e63946" ${L(2.5)}/>`,
  bumps: () => [40, 110, 180].map(x => `<path d="M${x - 26} ${H} Q${x} ${H - 26} ${x + 26} ${H} Z" fill="#ffd23f" ${L()}/><path d="M${x - 10} ${H - 6} l8 -10 M${x + 4} ${H - 4} l8 -10" stroke="${O}" stroke-width="4"/>`).join(''),
  tunnel: () => `<path d="M0 ${H} Q10 30 110 22 Q210 30 220 ${H} Z" fill="#6fae4a" ${L()}/><path d="M36 ${H} V88 Q36 52 110 52 Q184 52 184 88 V${H} Z" fill="#2a2d33" ${L()}/>` +
    `<path d="M30 ${H} V86 Q30 46 110 46 Q190 46 190 86 V${H}" fill="none" stroke="#a9adb2" stroke-width="10"/>${emo(60, 30, 22, '🌳')}${emo(170, 34, 18, '🌼')}`,
  mud: () => `<ellipse cx="110" cy="${H - 6}" rx="92" ry="14" fill="#7a4a2a" ${L()}/><ellipse cx="80" cy="${H - 9}" rx="22" ry="4" fill="#a8743f"/><ellipse cx="140" cy="${H - 5}" rx="16" ry="3" fill="#a8743f"/>`,
  loop: () => `<circle cx="110" cy="${H - 76}" r="70" fill="none" stroke="${O}" stroke-width="20"/><circle cx="110" cy="${H - 76}" r="70" fill="none" stroke="#e63946" stroke-width="12"/>` +
    `<circle cx="110" cy="${H - 76}" r="70" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="10 12"/><path d="M60 ${H} L110 ${H - 6} L160 ${H}" fill="none" stroke="${O}" stroke-width="8"/>`,
  bubbles: () => `${rainbow(96, 8, ['#bfe6f5', '#c3a8f0', '#ffc4e0', '#bfe6f5', '#c3a8f0', '#ffc4e0'])}` +
    [[40, 60, 12], [80, 30, 9], [150, 34, 14], [184, 70, 10], [110, 14, 8]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#bfe6f5" fill-opacity=".6" ${L(2.5)}/><circle cx="${x! - r! * .35}" cy="${y! - r! * .35}" r="${r! * .25}" fill="#fff"/>`).join(''),
  confetti: () => `${pillar(14, '#ff7ac0')}${pillar(184, '#ff7ac0')}<rect x="6" y="22" width="208" height="26" rx="6" fill="#ffd23f" ${L()}/>` +
    Array.from({ length: 8 }, (_, i) => `<path d="M${28 + i * 24} 48 q6 30 -2 54" fill="none" stroke="${['#e63946', '#3d9be0', '#2bb673', '#7a4fd8'][i % 4]}" stroke-width="5" stroke-linecap="round"/>`).join('') + emo(110, 44, 20, '🎉'),
  sprinkler: () => [44, 176].map(x => `<rect x="${x - 7}" y="${H - 22}" width="14" height="22" rx="3" fill="#8a929b" ${L(3)}/><path d="M${x} ${H - 22} Q${x + (x < 110 ? 50 : -50)} ${H - 120} ${x + (x < 110 ? 80 : -80)} ${H - 30}" fill="none" stroke="#3d9be0" stroke-width="5" stroke-dasharray="8 6" stroke-linecap="round"/>`).join(''),
  rainbowarch: () => `${rainbow(100, 12)}<path d="M2 ${H} A108 108 0 0 1 218 ${H}" fill="none" ${L(3)}/><path d="M38 ${H} A72 72 0 0 1 182 ${H}" fill="none" ${L(3)}/>${emo(14, H - 4, 26, '☁️')}${emo(206, H - 4, 26, '☁️')}`,
  turbo: () => `<rect x="20" y="${H - 14}" width="180" height="14" rx="4" fill="#2bb673" ${L(3)}/>${[0, 1, 2, 3].map(i => `<path d="M${46 + i * 38} ${H - 12} l14 5 l-14 5" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}`,
  fireworkpad: () => `<rect x="70" y="${H - 34}" width="80" height="34" rx="5" fill="#3a3f7a" ${L()}/>${[86, 110, 134].map((x, i) => `<path d="M${x} ${H - 34} V${H - 70 + i * 6}" stroke="${['#e63946', '#ffd23f', '#3d9be0'][i]}" stroke-width="9" stroke-linecap="round"/><path d="M${x - 5} ${H - 70 + i * 6} L${x} ${H - 84 + i * 6} L${x + 5} ${H - 70 + i * 6} Z" fill="#c9d1d9" ${L(2)}/>`).join('')}${emo(110, 40, 30, '🎆')}`,
};

/** The feature as an SVG document, FEATURE_W wide and FEATURE_H tall, its foot on the road. */
export const featureSvg = (id: FeatureId) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -6 ${FEATURE_W + 12} ${FEATURE_H + 10}">${DRAW[id]()}</svg>`;
export const FEATURE_VIEW = { x: -6, y: -6, w: FEATURE_W + 12, h: FEATURE_H + 10 };
/** Which features are drawn over his machine as it passes (it goes inside). */
export const IN_FRONT: ReadonlySet<FeatureId> = new Set(['tunnel']);
