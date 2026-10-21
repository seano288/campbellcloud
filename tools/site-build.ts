// Builds the whole family site into dist-site/: the landing page at the root (games grouped into sections) and each game in its own folder, each with
// its own service worker and icons. The landing page's worker never answers a navigation into a game's folder, so a
// worker left over from when Monster Truck Money lived at the root can't shadow a game.
//   npm run build:site
import { resolve } from 'node:path';
import { build, type InlineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { iconSvg as truckIcon } from '../src/icon/icon';
import { iconSvg as fliesIcon } from '../src/time-flies/icon';
import { iconSvg as hunchIcon } from '../src/hunch/icon';
import { hunchBuild } from './hunch-build';
import { iconSvg as purrdokuIcon } from '../src/purrdoku/art';
import { purrdokuBuild } from './purrdoku-build';
import { favicon, homeScreenIcons } from './icons';
import { BRAND, iconSvg as cloudIcon, markSvg } from '../src/brand/mark';
import { moneyBuild } from './money-build';
import { staticBuild } from './static-build';
import { fliesBuild } from './time-flies-build';

// Task Force is hosted on its own site; its tile here just links out to it. The art is its own home-screen icon.
const taskForceIcon = (scale = 1) => {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs>
  <radialGradient id="tf-glow-purple" cx="15%" cy="0%" r="80%"><stop offset="0" stop-color="#7a3cff" stop-opacity=".75"/><stop offset="1" stop-color="#7a3cff" stop-opacity="0"/></radialGradient>
  <radialGradient id="tf-glow-blue" cx="100%" cy="40%" r="70%"><stop offset="0" stop-color="#1ea0ff" stop-opacity=".45"/><stop offset="1" stop-color="#1ea0ff" stop-opacity="0"/></radialGradient>
  <radialGradient id="tf-glow-pink" cx="50%" cy="110%" r="70%"><stop offset="0" stop-color="#ff3c8c" stop-opacity=".4"/><stop offset="1" stop-color="#ff3c8c" stop-opacity="0"/></radialGradient>
</defs><rect width="512" height="512" fill="#070b1e"/><rect width="512" height="512" fill="url(#tf-glow-purple)"/><rect width="512" height="512" fill="url(#tf-glow-blue)"/><rect width="512" height="512" fill="url(#tf-glow-pink)"/><g transform="translate(${off} ${off}) scale(${scale})">
  <g fill="#fff"><circle cx="70" cy="96" r="4"/><circle cx="430" cy="70" r="5"/><circle cx="452" cy="300" r="3"/><circle cx="58" cy="380" r="3"/><circle cx="400" cy="450" r="4" fill="#bfe8ff"/><circle cx="120" cy="470" r="2.5" fill="#ffd9f5"/></g>
  <g transform="translate(101 67) scale(3.1)">
    <ellipse cx="34" cy="104" rx="13" ry="8" fill="rgb(152,141,37)" stroke="#0a0d20" stroke-width="5" stroke-linejoin="round"/>
    <ellipse cx="66" cy="104" rx="13" ry="8" fill="rgb(152,141,37)" stroke="#0a0d20" stroke-width="5" stroke-linejoin="round"/>
    <path d="M18 98 Q12 98 14 86 L20 46 Q24 10 50 10 Q76 10 80 46 L86 86 Q88 98 82 98 Z" fill="#f5e33b"/>
    <path d="M26 74 L23 90" fill="none" stroke="rgb(152,141,37)" stroke-width="5" stroke-linecap="round" opacity=".5"/>
    <rect x="16" y="40" width="68" height="12" fill="#1b2138"/>
    <path d="M18 98 Q12 98 14 86 L20 46 Q24 10 50 10 Q76 10 80 46 L86 86 Q88 98 82 98 Z" fill="none" stroke="#0a0d20" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="36" cy="46" r="13" fill="#9fe0f7" stroke="#0a0d20" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="64" cy="46" r="13" fill="#9fe0f7" stroke="#0a0d20" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="38" cy="48" r="4.5" fill="#0a0d20"/><circle cx="66" cy="48" r="4.5" fill="#0a0d20"/>
    <path d="M29 42 Q31 37 36 37" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M57 42 Q59 37 64 37" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M40 76 Q50 82 60 76" fill="none" stroke="rgb(152,141,37)" stroke-width="4" stroke-linecap="round" opacity=".7"/>
  </g></g></svg>`;
};

// Cash Chaos, the family budget app, is hosted on its own site too. The art is its favicon's three rising bars.
const cashChaosIcon = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g transform="translate(96 96) scale(10)" fill="#0ca30c">
  <rect x="5" y="18" width="6" height="10" rx="1.5"/><rect x="13" y="10" width="6" height="18" rx="1.5"/><rect x="21" y="4" width="6" height="24" rx="1.5"/>
</g></svg>`;

type Tile = { name: string; icon: (scale?: number) => string } & ({ path: string } | { href: string });

export const SITE = 'dist-site';
export const SECTIONS: readonly { title: string; games: readonly Tile[] }[] = [
  { title: 'Learning Games', games: [
    { path: 'monster-truck-money', name: 'Monster Truck Money', icon: truckIcon },
    { path: 'time-flies', name: 'Time Flies', icon: fliesIcon },
  ] },
  { title: 'Just for Fun', games: [
    { path: 'hunch', name: 'Hunch', icon: hunchIcon },
    { path: 'purrdoku', name: 'Purrdoku', icon: purrdokuIcon },
    { href: 'https://playtaskforce.com/', name: 'Task Force', icon: taskForceIcon },
  ] },
  { title: 'Tools', games: [
    { href: 'https://cashchaos.com/', name: 'Cash Chaos', icon: cashChaosIcon },
  ] },
];
// The games this site builds and hosts itself (not the ones it only links out to).
export const GAMES = SECTIONS.flatMap(s => s.games.filter(g => 'path' in g));

function landing(): InlineConfig {
  const tiles: Plugin = {
    name: 'game-tiles',
    transformIndexHtml: html => html
      .replace('%LOGO%', markSvg(32))
      .replace('%SECTIONS%', SECTIONS.map(s =>
        `<section><h2 class="mono"><span>// ${s.title}</span><span>${String(s.games.length).padStart(2, '0')}</span></h2><div class="games">${s.games.map(g =>
          `<a class="game" href="${'path' in g ? `./${g.path}/` : g.href}" aria-label="${g.name}"><div class="art">${g.icon(1).replace('<svg ', '<svg aria-hidden="true" ')}</div><span class="name">${g.name}</span><span class="where mono">${'path' in g ? `/${g.path}` : `↗ ${new URL(g.href).host}`}</span></a>`).join('')}</div></section>`).join('')),
  };
  return {
    configFile: false, root: resolve(import.meta.dirname, '../landing'), base: './', publicDir: false, logLevel: 'warn',
    plugins: [
      tiles, favicon(), homeScreenIcons({ svg: cloudIcon, background: BRAND.icon.bg }),
      VitePWA({
        registerType: 'autoUpdate', injectRegister: false,
        manifest: {
          name: 'Campbell Cloud', short_name: 'Campbell Cloud', start_url: './', scope: './', display: 'standalone', orientation: 'any',
          theme_color: BRAND.dark.bg, background_color: BRAND.dark.bg,
          icons: [
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,png,svg,woff2}'], cleanupOutdatedCaches: true, skipWaiting: true, clientsClaim: true,
          navigateFallbackDenylist: GAMES.map(g => new RegExp(`/${g.path}(/|$)`)),
        },
      }),
    ],
    build: { outDir: resolve(import.meta.dirname, '..', SITE), emptyOutDir: true },
  };
}

await build(landing());
await build({ ...staticBuild({ ...moneyBuild, outDir: `${SITE}/monster-truck-money` }), logLevel: 'warn' });
await build({ ...staticBuild(fliesBuild), logLevel: 'warn' });
await build({ ...hunchBuild(), logLevel: 'warn' });
await build({ ...staticBuild(purrdokuBuild), logLevel: 'warn' });
console.log(`Built ${SITE}/: landing page, ${GAMES.map(g => g.path).join(', ')}`);
