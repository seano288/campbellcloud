# Static stack options that keep a native app possible

Research for [.scratch/monster-truck-garage/issues/02-static-stack-options.md](../.scratch/monster-truck-garage/issues/02-static-stack-options.md). This file lists facts and trade-offs only. The decision belongs to "Choose the stack" (issue 05).

Researched 2026-09-29. Every claim links to its source, listed at the end. Bundle sizes marked "measured" come from building the stock `create-vite` templates on this machine (Vite 8.3.1, Node 22.23.2) and are not from any documentation.

## The current approach

- `monster-truck-money.html` is one 1,145,749-byte file: about 800 lines of HTML, CSS and JS, plus two very long lines.
  - Line 357, `const COIN_IMG = {...}`: 187,684 characters of base64 PNG coin images, about 137 KB as binary.
  - Line 359, `const VOICE = {...}`: 919,120 characters of base64 MP3 clips, about 670 KB as binary.
  - Base64 is "typically roughly a third larger than its source" [MDN-B64], so about 0.3 MB of the file is encoding overhead.
- Voice clips are `data:audio/mpeg;base64,...` URLs. `clip()` calls `fetch()` on each one, then `decodeAudioData`, and decodes every clip at startup. `decodeAudioData` accepts an `ArrayBuffer` from `fetch()` whatever the URL [MDN-DAD], so the same code would work with real file URLs such as `/voice/tap-the-penny.mp3`.
- `tools/make_voice.py` generates the MP3s with `edge-tts`, base64-encodes them, and uses a regex to overwrite the single `const VOICE = ...` line in the HTML. Phrases are keyed by exact text, and a phrase with no clip falls back to `speechSynthesis`.
- The truck and the car are inline SVG. The wheels spin with CSS keyframes on `<g class="wheel">` (`transform-box: fill-box`).
- The layout uses `100dvh`, `env(safe-area-inset-bottom)`, `clamp()`, CSS custom properties and `@media` height/orientation queries.
- The fonts load from `fonts.googleapis.com`. There is no web app manifest and no service worker, so the file has no offline support today, and the fonts need the network.
- Deploy: `.github/workflows/pages.yml` copies the HTML to `_site/index.html` and uploads it with `actions/upload-pages-artifact@v3` / `deploy-pages@v4` (checkout `@v4`). GitHub's current docs list checkout v6, upload-pages-artifact v4, deploy-pages v4 and configure-pages v5 [GH-CW].
- The repo is `seano288/monster-truck-money`, so Pages serves it from a project path (`/monster-truck-money/`), which matters for Vite's `base` (see below).

## Facts that apply to every option

**Layout (no scrolling, portrait and landscape).** None of the candidates adds layout ability that plain CSS lacks. Safari 15.4 added `svh`/`lvh`/`dvh` [WK-154]. Safari 16 added container size queries and `cqw`/`cqh`/`cqi`/`cqb`/`cqmin`/`cqmax` units [WK-16]. Whichever stack is chosen, the no-scroll layout is CSS work. Container queries let a component such as a truck panel or a coin tray size itself to its box rather than to the viewport, and that works the same in plain HTML and in any framework.

**Home Screen and offline.** A Home Screen web app needs a manifest with `display` set to `standalone` or `fullscreen` [WK-PUSH]. Offline support needs a service worker. The storage and offline behaviour on iPadOS is the subject of issue 01 and is not repeated here.

**GitHub Pages.** A published site can be up to 1 GB, the soft bandwidth limit is 100 GB/month, and a deployment times out after 10 minutes. The 10-builds-per-hour soft limit does not apply to custom Actions workflows [GH-LIM]. The artifact must be a gzip'd tar under 10 GB with no symbolic or hard links [GH-CW]. GitHub recommends a custom Actions workflow when you use a build step other than Jekyll [GH-SRC]. 1–5 MB of assets is far below every limit.

**Capacitor (current major: v8).** An existing project needs a `package.json`, a directory of built web assets, and an `index.html` at the root of that directory "with a `<head>` tag (critical for plugin functionality)". Capacitor "was designed to drop into any modern JavaScript web app" [CAP-GS]. `webDir` is "the directory of your compiled web assets" and must contain the final `index.html` [CAP-CFG]. The iOS requirements are iOS 15+ and Xcode 26.0+. It uses WKWebView [CAP-IOS]. On iOS the app is served from `capacitor://localhost` by default (`server.iosScheme` defaults to `capacitor`, `server.hostname` to `localhost`) [CAP-CFG]. That is a different origin from the GitHub Pages site. Capacitor's own docs say `localStorage` "must be considered transient" and flag IndexedDB as a problem on iOS. They recommend the Preferences API or SQLite for data the app depends on [CAP-STORE]. Every option therefore gains from having one storage module that can be swapped later.

**Service worker inside a native wrapper.** Inside Capacitor the web files are bundled into the app [CAP-UPD], so the wrapper does not need a service worker for offline use. I found no primary Apple or Capacitor page saying whether service workers run in Capacitor's WKWebView. Third-party reports link them to App-Bound Domains, but the WebKit App-Bound Domains post [WK-ABD] does not mention service workers. Treat this as unverified. The safe pattern is to register the service worker only when the page is served over `https:`.

## Option A: one self-contained HTML file (current)

- **Performance:** there is no framework runtime. The whole file must be downloaded and parsed before anything runs. Base64 assets inside JS are parsed as string literals and then decoded, and each costs about 33% more bytes than the binary [MDN-B64]. At 1.1 MB this is manageable. At 5 MB, every edit and every first load carries the whole payload. The HTTP cache or a service worker can only store the file as one unit, so changing one line invalidates all the audio and images too.
- **Layout:** same CSS abilities as any option.
- **1–5 MB assets:** everything is inline, and the file grows about 1.33 MB for each 1 MB of media.
- **GitHub Pages:** the simplest option, and the current workflow already works.
- **Agent ergonomics:** one file means no module boundaries, and two lines of about 1 MB make ordinary `Read`/`grep` on the file risky (the reason for the warning in this ticket). An agent has to know to skip those lines. There are no types and no tests. Everything shares one global scope.
- **Native path:** works. Put the file at `www/index.html`, add a `package.json`, and run `npx cap init` / `cap add ios` [CAP-GS]. There is no build step to wire in.
- **Offline:** a manifest and a small hand-written service worker that caches one HTML file plus self-hosted fonts would be enough. There is no tooling to generate either.
- **Hybrid variant:** Vite + `vite-plugin-singlefile` builds from separate source files and inlines all JS and CSS into one HTML. Its README calls this "isn't recommended for most situations" for performance on ordinary web servers, and aims it at offline and `file://` uses [SINGLEFILE]. Source code stays modular while the output is still one file.

## Option B: Vite + vanilla TypeScript, assets as separate files

- **Performance:** the measured `vanilla-ts` template JS is 4.49 kB (2.02 kB gzip). Vite's default production target is `'baseline-widely-available'` (browsers from about mid-2023 for Vite 8) [VITE-BUILD][VITE-GUIDE]. Images and audio become separate files that the browser can cache one by one.
- **Assets:** an imported asset returns a URL, and the production build hashes it (`/assets/img.2d8efhg.png`). Files in `public/` are copied as they are, with no hashing [VITE-ASSETS]. Assets under `build.assetsInlineLimit` (default 4096 bytes) are inlined as base64. `?url`, `?raw`, `?inline` and `?no-inline` override this per import [VITE-BUILD][VITE-ASSETS].
- **GitHub Pages:** Vite documents an official Pages workflow that sets up Node `lts/*`, runs `npm run build` and uploads `./dist` [VITE-DEPLOY]. For a project page, set `base: '/<REPO>/'` [VITE-DEPLOY]. `base` also accepts `''` or `./` "for embedded deployment" [VITE-BASE]. A relative base serves both Pages and Capacitor's `capacitor://localhost/` root. Node 20.19+ or 22.12+ is required [VITE-GUIDE].
- **Offline:** `vite-plugin-pwa` generates the manifest and a Workbox service worker, and supports vanilla, React, Preact, Svelte and Solid [PWA-GUIDE]. Its default precache pattern is `**/*.{js,css,html}` only. Images and audio must be added through `includeAssets` (for `public/`) or `globPatterns`. A custom `globPatterns` must still include js/css/html, or the service worker breaks [PWA-ASSETS]. Workbox skips files larger than `maximumFileSizeToCacheInBytes` (default 2,097,152 bytes) [WB-BUILD]. Each file here is well under that, but a single bundled audio sprite could exceed it.
- **Agent ergonomics:** small modules and TypeScript types, with no framework rules to learn. UI updates are hand-written DOM code (much like the current `innerHTML` approach), so an agent has to keep DOM state and game state in sync itself. Vite publishes `llms.txt` docs (checked 2026-09-29).
- **Native path:** `webDir: 'dist'`, and `npm run build && npx cap sync` [CAP-GS][CAP-CFG].

## Option C: Vite + a light UI library

All three have official `create-vite` templates (`preact-ts`, `svelte-ts`, `solid-ts`) [VITE-GUIDE]. The asset, Pages, PWA and Capacitor facts are the same as Option B.

| | Preact | Svelte | Solid |
|---|---|---|---|
| Model | React-style API with a virtual DOM. "Fast 3kB alternative to React with the same modern API" [PREACT-HOME] | Compiler that turns components into "lean, tightly optimized JavaScript" [SVELTE-OV]. Svelte 5 uses runes | Fine-grained reactivity, no virtual DOM, JSX [SOLID-DOCS] |
| Measured template JS (min / gzip) | 17.91 kB / 7.29 kB (preact 10.29.8) | 30.68 kB / 12.34 kB (svelte 5.57.0) | 14.98 kB / 5.71 kB (solid-js 1.9.15) |
| Version status | v10 current, v11 in preview (11.0.0-rc.2) [PREACT-GS] | Svelte 5 [SVELTE-OV] | 1.9.x on npm (the docs site also covers SolidStart v2) [SOLID-DOCS] |
| React ecosystem | `preact/compat` aliasing, set up automatically by `@preact/preset-vite` [PREACT-GS] | No | No |
| No-build use | Yes, via ESM CDN + HTM [PREACT-GS] | No (needs the compiler) | Not as a documented default |
| `llms.txt` docs | Yes (v10) | Yes | Yes |

The measured template sizes include each template's demo component and logo, so they are ballpark figures, not the bare runtime cost.

Agent trade-offs:
- Preact looks like React, which models see most in their training data. The traps are the React-vs-Preact differences, and v11 being in preview.
- Svelte 5 runes replaced older syntax (`$:`, `export let`) [SVELTE-OV]. Models trained on older code may write Svelte 4 patterns. The official `llms.txt` exists partly for this.
- Solid's JSX looks like React but behaves differently: components run once and props must not be destructured. Models used to React can write code that compiles but doesn't update. (This is well-known Solid behaviour, but I did not re-check it against the Solid docs in this pass.)

## Option D: Vite + React

- **Performance:** the measured `react-ts` template JS is 222.52 kB (69.27 kB gzip), about 10–35 times the others. On an iPad from the last few years that parses fast, and it caches after the first load. It is still the largest fixed cost of the options.
- **Versions:** react.dev lists React 19.3 (2026-09-09) as the latest [REACT-VER]. The Vite template currently installs 19.2.x (measured).
- **Tooling:** react.dev lists Vite, Parcel and Rsbuild for a from-scratch client-only SPA [REACT-SCRATCH].
- **Agent ergonomics:** the most familiar stack for coding agents, with the most examples and libraries. React adds hooks rules and re-render thinking that a small game doesn't need.
- **Native path:** same as B. React has the most Capacitor example material, but Capacitor itself is framework-agnostic [CAP-GS].

## Layered truck art: SVG vs PNG sprites vs canvas

Issue 06 designs the art. These are the fit facts.

- **Inline SVG (what the game uses now).** Each Mod can be a `<g>` layer toggled by class or attribute, and CSS animations work on parts, as the wheels do today. It scales sharply at any size. In a single HTML file every layer is inline markup, which is easy for an agent to edit but adds to the file. Vite can import `.svg` files as URLs [VITE-ASSETS] or as strings with `?raw` for inline injection. Preact, Svelte, Solid and React can all write SVG directly in components, where each Mod is a conditional element.
- **PNG (or WebP) sprites.** Stacked `<img>` elements or CSS background layers. Good for painted or detailed art that SVG handles poorly. On an iPad (devicePixelRatio 2) each layer needs 2x-resolution assets to look sharp, which is where the 1–5 MB budget goes. In Option A each sprite is base64 (+33%) [MDN-B64]. In B–D they are hashed files, or files in `public/` for code that builds paths at runtime [VITE-ASSETS], and must be added to the service worker's precache list [PWA-ASSETS].
- **Canvas.** One `<canvas>` that composites layers. MDN's tips: scale the backing store by `devicePixelRatio`, pre-render static layers to an offscreen canvas, use layered canvases so only the changing layer redraws, avoid scaling inside `drawImage`, and use CSS transforms to fit the stage [MDN-CANVAS]. It adds a render loop and loses the DOM's built-in tapping and accessibility. For a garage screen that changes only when a Mod is swapped, most of canvas's benefit (many objects moving every frame) doesn't apply. Canvas behaves the same in every option, and no framework helps or hurts it.
- **Which option fits:** SVG layers match a component model well (one component per Mod, with props for colour). PNG layers work equally in all options, but only B–D make them separate cacheable files. None of the four options excludes any art technique.

## How `tools/make_voice.py` fits each option

The script's core (edge-tts, the `speakable()` rewrites, the phrase list) stays the same in every option. Only the output step changes.

- **A (single file):** unchanged. It rewrites the `const VOICE = ...` line. Each new phrase adds its MP3 size plus about 33% to the HTML [MDN-B64]. The phrase list lives in Python, separate from the JS that calls `say()`, so the two can drift apart. A missing clip falls back to `speechSynthesis`, which hides the drift.
- **B–D (Vite):** the script writes `public/voice/<slug>.mp3` (or `src/assets/voice/`) and a `voice.json` manifest that maps phrase text to file. The game `fetch()`es the file URL instead of a data URL, and `decodeAudioData` works the same [MDN-DAD]. Files in `public/` keep predictable names that code can build at runtime. Files under `src/` get hashed names and must be imported, for example through a generated TS module [VITE-ASSETS]. The service worker precache must include `mp3` through `includeAssets`/`globPatterns` [PWA-ASSETS]. Each clip is well under Workbox's 2 MB per-file default [WB-BUILD]. A generated TS module also lets a type check catch a `say('...')` call with no clip, which Option A can't do.
- **Where it runs:** edge-tts needs network access to Microsoft's service, so in every option the clips are best generated locally and committed, not generated in the Pages workflow. This is an inference from how the script works, not from a documented constraint.
- **Hybrid A (singlefile plugin):** the script could write files as in B, and the plugin would inline them at build time, but only if they are imported as assets under the inline limit or with `?inline` [VITE-ASSETS][SINGLEFILE].

## Comparison

| | A: single HTML | B: Vite + vanilla TS | C: Vite + Preact / Svelte / Solid | D: Vite + React |
|---|---|---|---|---|
| Framework JS (measured gzip) | 0 | ~2 kB | ~6–12 kB | ~69 kB |
| iPad Safari runtime cost | Lowest JS, but a large base64 parse at every load | Lowest | Low | Highest of the four, cached after first load |
| No-scroll portrait/landscape layout | Plain CSS (`dvh`, container queries) | Same | Same, plus scoped component CSS (built into Svelte) | Same |
| 1–5 MB images and audio | All inline, +33% base64, all-or-nothing caching | Separate hashed or `public/` files, cached per file | Same as B | Same as B |
| Offline tooling | Hand-written manifest + service worker | `vite-plugin-pwa` (add media globs) | Same as B | Same as B |
| GitHub Pages deploy | Current workflow, no build | Build step, `base` set to repo path or `./` | Same as B | Same as B |
| Coding agent ergonomics | One file, no types, 1 MB lines to avoid | Modules + TS, hand-written DOM updates | Components + TS. Svelte 5 / Solid syntax traps for models | Components + TS, most familiar to models, most boilerplate |
| Capacitor path | Copy the file to `www/`, add `package.json` | `webDir: 'dist'`, `cap sync` after build | Same as B | Same as B |
| Layered truck art | Inline SVG or base64 sprites | SVG files or `?raw`, sprite files | SVG as components, sprite files | SVG as components, sprite files |
| `make_voice.py` change | None | Write files + manifest | Same as B | Same as B |

## Gaps and open questions

- Service workers inside Capacitor's WKWebView: no primary source found (see above).
- Real iPad frame timing for SVG vs PNG vs canvas was not measured, and I found no WebKit page that compares them. A prototype on the target iPad would settle it.
- Measured bundle sizes are for the stock templates, not for this game.
- Storage durability for the Home Screen app, and what carries over to a Capacitor origin, is issue 01's job.

## Sources

- [MDN-B64] MDN, Base64: https://developer.mozilla.org/en-US/docs/Glossary/Base64
- [MDN-DAD] MDN, `BaseAudioContext.decodeAudioData()`: https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData
- [MDN-CANVAS] MDN, Optimizing canvas: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
- [WK-154] WebKit, New WebKit Features in Safari 15.4: https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/
- [WK-16] WebKit, WebKit Features in Safari 16.0: https://webkit.org/blog/13152/webkit-features-in-safari-16-0/
- [WK-PUSH] WebKit, Web Push for Web Apps on iOS and iPadOS: https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
- [WK-ABD] WebKit, App-Bound Domains: https://webkit.org/blog/10882/app-bound-domains/
- [GH-LIM] GitHub Docs, GitHub Pages limits: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- [GH-CW] GitHub Docs, Using custom workflows with GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- [GH-SRC] GitHub Docs, Configuring a publishing source: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- [VITE-GUIDE] Vite, Getting Started: https://vite.dev/guide/
- [VITE-ASSETS] Vite, Static Asset Handling: https://vite.dev/guide/assets
- [VITE-BUILD] Vite, Build Options: https://vite.dev/config/build-options
- [VITE-BASE] Vite, Shared Options (`base`): https://vite.dev/config/shared-options
- [VITE-DEPLOY] Vite, Deploying a Static Site: https://vite.dev/guide/static-deploy
- [PWA-GUIDE] Vite PWA, Getting Started: https://vite-pwa-org.netlify.app/guide/
- [PWA-ASSETS] Vite PWA, Static assets handling: https://vite-pwa-org.netlify.app/guide/static-assets
- [WB-BUILD] Chrome for Developers, workbox-build: https://developer.chrome.com/docs/workbox/modules/workbox-build
- [SINGLEFILE] vite-plugin-singlefile README: https://github.com/richardtallent/vite-plugin-singlefile
- [CAP-GS] Capacitor, Installing Capacitor: https://capacitorjs.com/docs/getting-started
- [CAP-IOS] Capacitor, iOS: https://capacitorjs.com/docs/ios
- [CAP-CFG] Capacitor, Configuration: https://capacitorjs.com/docs/config
- [CAP-STORE] Capacitor, Storage: https://capacitorjs.com/docs/guides/storage
- [CAP-UPD] Capacitor, Deploying updates: https://capacitorjs.com/docs/guides/deploying-updates
- [PREACT-HOME] Preact: https://preactjs.com/
- [PREACT-GS] Preact, Getting Started: https://preactjs.com/guide/v10/getting-started
- [SVELTE-OV] Svelte, Overview: https://svelte.dev/docs/svelte/overview
- [SOLID-DOCS] Solid docs: https://docs.solidjs.com/
- [REACT-VER] React, Versions: https://react.dev/versions
- [REACT-SCRATCH] React, Build a React app from scratch: https://react.dev/learn/build-a-react-app-from-scratch
- `llms.txt` availability checked directly: https://vite.dev/llms.txt, https://preactjs.com/llms.txt, https://svelte.dev/llms.txt, https://docs.solidjs.com/llms.txt, https://react.dev/llms.txt
