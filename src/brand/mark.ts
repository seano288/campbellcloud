// The Campbell Cloud mark ("Horizon"): one unbroken line that rises out of the horizon into a cloud, with a small sun.
// Drawn on a 64-unit square. See docs/brand/README.md for the colours and type that go with it.
const HORIZON = 'M4 46 H15 A7 7 0 0 1 20 34 A12 12 0 0 1 43 32 A8 8 0 0 1 49 46 H60';
const SUN = { cx: 50, cy: 20, r: 3.5 };

export const BRAND = {
  light: { bg: '#ffffff', fg: '#0e0e10', accent: '#2f5bff' },
  dark: { bg: '#0b0c0f', fg: '#f2f2f2', accent: '#7c9bff' },
  icon: { bg: '#0e0e10', fg: '#ffffff', sun: '#5c7dff' },
} as const;

// For inline use in a page: the line takes the text colour and the sun the page's --accent.
export const markSvg = (size = 28) =>
  `<svg class="mark" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"><path d="${HORIZON}" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${SUN.cx}" cy="${SUN.cy}" r="${SUN.r}" style="fill:var(--accent)"/></svg>`;

// The Home Screen icon, on a 512 square: the mark in white on ink. scale shrinks it toward the centre for maskable icons.
export function iconSvg(scale = 1): string {
  const s = 5.6 * scale, off = 256 - 32 * s;
  const { bg, fg, sun } = BRAND.icon;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${bg}"/><g transform="translate(${off} ${off}) scale(${s})"><path d="${HORIZON}" fill="none" stroke="${fg}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${SUN.cx}" cy="${SUN.cy}" r="${SUN.r}" fill="${sun}"/></g></svg>`;
}

// The browser-tab icon: the bare mark, a heavier line so it holds up at 16px, ink on light tabs and white on dark ones.
export const faviconSvg = () =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><style>path{stroke:${BRAND.light.fg}}circle{fill:${BRAND.light.accent}}@media (prefers-color-scheme:dark){path{stroke:${BRAND.dark.fg}}circle{fill:${BRAND.dark.accent}}}</style><path d="${HORIZON}" fill="none" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${SUN.cx}" cy="${SUN.cy - 2}" r="6"/></svg>`;
