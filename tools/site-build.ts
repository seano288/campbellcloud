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
import { homeScreenIcons } from './icons';
import { BRAND, faviconSvg, iconSvg as cloudIcon, markSvg } from '../src/brand/mark';
import { moneyBuild } from './money-build';
import { staticBuild } from './static-build';
import { fliesBuild } from './time-flies-build';

// Task Force is hosted on its own site; its tile here just links out to it. The art is its own home-screen icon.
const taskForceIcon = (scale = 1) => {
  const off = 256 * (1 - scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#e3fa56"/><g transform="translate(${off} ${off}) scale(${scale})"><g transform="translate(86 86) scale(3.4)">
  <path fill="#24291f" fill-rule="evenodd" d="M30 14h40l18 22-7 37-18 13H37L19 73l-7-37Zm-4 28 4 17 40-7 4-17Zm12 27v6h8v-6Zm16 0v6h8v-6Z"/></g></g></svg>`;
};

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
];
// The games this site builds and hosts itself (not the ones it only links out to).
export const GAMES = SECTIONS.flatMap(s => s.games.filter(g => 'path' in g));

function landing(): InlineConfig {
  const tiles: Plugin = {
    name: 'game-tiles',
    transformIndexHtml: html => html
      .replace('%LOGO%', markSvg(32))
      .replace('%FAVICON%', `data:image/svg+xml,${encodeURIComponent(faviconSvg())}`)
      .replace('%SECTIONS%', SECTIONS.map(s =>
        `<section><h2 class="mono"><span>// ${s.title}</span><span>${String(s.games.length).padStart(2, '0')}</span></h2><div class="games">${s.games.map(g =>
          `<a class="game" href="${'path' in g ? `./${g.path}/` : g.href}" aria-label="${g.name}"><div class="art">${g.icon(1).replace('<svg ', '<svg aria-hidden="true" ')}</div><span class="name">${g.name}</span><span class="where mono">${'path' in g ? `/${g.path}` : `↗ ${new URL(g.href).host}`}</span></a>`).join('')}</div></section>`).join('')),
  };
  return {
    configFile: false, root: resolve(import.meta.dirname, '../landing'), base: './', publicDir: false, logLevel: 'warn',
    plugins: [
      tiles, homeScreenIcons({ svg: cloudIcon, background: BRAND.icon.bg }),
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
