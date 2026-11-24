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
  key, `time-flies-save`, Chop Chop `chop-chop-save`, Sight Squad `sight-squad-save`, Math Bots `math-bots-save`, Rover Code `rover-code-save`, Treasure Fleet `treasure-fleet-save`, Wild Rescue `wild-rescue-save`, and Purrdoku `purrdoku-save`.
  Sentence Express uses `sentence-express-save` (and `sentence-express-place`), Dino Dig `dino-dig-save` (and `dino-dig-place`),
  Food Truck `food-truck-save` (and `food-truck-place`), Deep Light `deep-light-save` (and `deep-light-place`), Sky Writer `sky-writer-save` (and `sky-writer-place`),
  Skyline `skyline-save` (and `skyline-place`),
  Jetway `jetway-save` (and `jetway-place`),
  Carrier Deck `carrier-deck-save` (and `carrier-deck-place`),
  Cargo Words `cargo-words-save` (and `cargo-words-place`),
  Moon Base Mail `moon-base-mail-save` (and `moon-base-mail-place`),
  Globe Hopper `globe-hopper-save` (and `globe-hopper-place`).
- **Home Screen**: the app already installed from the site root now opens the landing page, which works offline. Each game
  becomes available offline after its first online visit at its new folder.
- **Word Wreckers** (`/word-wreckers/`) has a tile in **Learning Games** and saves under its own key, `word-wreckers-save` (with
  `word-wreckers-place` for the screen and the Round in progress).
- **Turbo Tally** (`/turbo-tally/`) has a tile in **Learning Games**, after Word Wreckers, and saves under its own key, `turbo-tally-save`
  (with `turbo-tally-place` for the screen and the Round in progress).
- **Hook and Ladder** (`/hook-and-ladder/`) has a tile in **Learning Games**, after Hook and Ladder, and saves under its own key,
  `hook-and-ladder-save` (with `hook-and-ladder-place` for the screen and the Round in progress).
- **Jetway** (`/jetway/`) has a tile in **Learning Games**, after Skyline, and saves under its own key, `jetway-save` (with
  `jetway-place` for the screen and the Round in progress). Its voice clips are in `public/jetway-voice/`.
- **Carrier Deck** (`/carrier-deck/`) has a tile in **Learning Games**, after Jetway, and saves under its own key, `carrier-deck-save`
  (with `carrier-deck-place` for the screen and the Round in progress). Its voice clips are in `public/carrier-deck-voice/`.
- **Cargo Words** (`/cargo-words/`) has a tile in **Learning Games**, after Carrier Deck, and saves under its own key, `cargo-words-save`
  (with `cargo-words-place` for the screen and the Round in progress). Its voice clips are in `public/cargo-words-voice/`.
- **Moon Base Mail** (`/moon-base-mail/`) has a tile in **Learning Games**, after Cargo Words, and saves under its own key,
  `moon-base-mail-save` (with `moon-base-mail-place` for the screen and the Round in progress). Its voice clips are in
  `public/moon-base-mail-voice/`.
- **Globe Hopper** (`/globe-hopper/`) has a tile in **Learning Games**, after Moon Base Mail, and saves under its own key, `globe-hopper-save`
  (with `globe-hopper-place` for the screen and the Round in progress). Its voice clips are in `public/globe-hopper-voice/`, and its
  map outlines are a small table made once from Natural Earth's public-domain data (`tools/globe-hopper/outlines.ts`).

## Learning games and games just for fun

The landing page groups its tiles into sections: **Learning Games** (Monster Truck Money, Time Flies, Chop Chop, Sight Squad, Math Bots, Rover Code, Treasure Fleet, Wild Rescue, Sentence Express, Word Wreckers, Turbo Tally, Hook and Ladder, Dino Dig, Food Truck, Deep Light, Sky Writer, Skyline, Jetway, Carrier Deck, Cargo Words) and
**Just for Fun**. A fun game still gets its own folder, manifest, icons and worker, but it doesn't have to use the learning engine,
voice clips or `staticBuild()`. Hunch (`/hunch/`, a five-letter word guessing game) is a plain DOM page with its own
small build (`tools/hunch-build.ts`) and its own save key, `hunch-save`.
Sentence Express (`/sentence-express/`) is a tile in **Learning Games**, after Wild Rescue.
Dino Dig (`/dino-dig/`) is a tile in **Learning Games**, after Hook and Ladder, and saves under `dino-dig-save` (with `dino-dig-place` for
the screen and the Round in progress). It shares Word Wreckers' word list (`src/dino-dig/words/list.ts`) but records its own voice clips
in `public/dino-dig-voice/`.
Food Truck (`/food-truck/`) is a tile in **Learning Games**, after Dino Dig, and saves under `food-truck-save` (with `food-truck-place` for
the screen and the Round in progress). Its voice clips are in `public/food-truck-voice/`.
Deep Light (`/deep-light/`) is a tile in **Learning Games**, after Food Truck, and saves under `deep-light-save` (with `deep-light-place`
for the screen and the Round in progress). Its voice clips are in `public/deep-light-voice/`.
Sky Writer (`/sky-writer/`) is a tile in **Learning Games**, after Deep Light, and saves under `sky-writer-save` (with `sky-writer-place` for
the screen and the Round in progress). It reads Dino Dig's short-vowel words (read only) and records its own voice clips in
`public/sky-writer-voice/`.
Skyline (`/skyline/`) is a tile in **Learning Games**, after Sky Writer, and saves under `skyline-save` (with `skyline-place` for the screen
and the Round in progress). Its voice clips are in `public/skyline-voice/`.
