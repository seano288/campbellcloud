# The family site: a landing page, and one folder per game

The repo became `campbellcloud` to host more than one game. Pages now serves a small landing page at the site root with a
big tile per game, and each game lives in its own folder (`/monster-truck-money/`, `/time-flies/`, `/purrdoku/`) as its own static
build, with its own manifest, Home Screen icons and service worker scoped to that folder. `npm run build:site`
(`tools/site-build.ts`) builds all of it into `dist-site/`, which is deployed (to Cloudflare since ADR 0004); `npx vite build` still builds Monster
Truck Money alone into `dist/` for the existing browser checks.

## Considered Options

- **One app with a game picker inside**: one service worker and one bundle, but every game's assets (voice, 3D, HDRIs)
  would be precached together, and the games would share a build and a save.
- **Separate builds per folder (chosen)**: the shared engine stays shared source (ADR 0001), each game ships only what
  it selects, and one game's update can't disturb another.

## Consequences

- **The old root worker**: Monster Truck Money's worker used to control the whole site and answered navigations with its
  cached page. The landing page's worker replaces it at the same URL (`sw.js`) and never answers a navigation into a game
  folder (`navigateFallbackDenylist`), so the games load from the network until their own workers take over.
- **Saves carry over**: `localStorage` is per origin, so `mtm2-save` is still there at the new path. Time Flies uses its own
  key, `time-flies-save`, Chop Chop `chop-chop-save`, and Purrdoku `purrdoku-save`.
- **Home Screen**: the app already installed from the site root now opens the landing page, which works offline. Each game
  becomes available offline after its first online visit at its new folder.

## Learning games and games just for fun

The landing page groups its tiles into sections: **Learning Games** (Monster Truck Money, Time Flies, Chop Chop) and
**Just for Fun**. A fun game still gets its own folder, manifest, icons and worker, but it doesn't have to use the learning engine,
voice clips or `staticBuild()`. Hunch (`/hunch/`, a five-letter word guessing game) is a plain DOM page with its own
small build (`tools/hunch-build.ts`) and its own save key, `hunch-save`.
