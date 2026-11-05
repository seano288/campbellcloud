# Robot-combat reward: rendering prototype brief (shared by all prototypes)

The user is building a new first-grade math game for campbellcloud (family site; a child ~6-7 plays on an iPad as an offline PWA).
The reward is robot combat: the child's bot fights a computer-controlled bot. This is the part the user most wants to improve.
**Goal: a big jump in detail and real-world look and feel over the existing games.** It should read at a glance as TV footage or a
photo of a real robot in a real arena, not as a toy or a video game from 2010. Each prototype takes a different technical route;
the user will review them side by side and pick a direction.

## Existing baseline to beat
`src/garage/three/`, `src/time-flies/hangar/three/`, `src/chop-chop/hangar/three/`, `src/sight-squad/camp/three/` (three.js r186 WebGL, procedural
primitives, canvas textures). Prior research: `.scratch/airplane-clock/research/rendering-{realism,modeling,stage-effects}.md`. Skim before researching
so you add to it instead of repeating it.

## Same subject in every prototype (so they compare fairly)
Original bots only. Do NOT reproduce any real competitor's robot, or the BattleBots / Robot Wars show, names, logos, or arena branding. Say "robot combat", never the trademark.
- **TORQUE** (the child's bot, blue and orange): ~250 lb class, ~1 m long, low 4-wheel-drive wedge chassis of bare and powder-coated steel, with a heavy spinning vertical drum weapon at the front.
- **ANVIL** (computer-controlled, red and black): ~1 m, tall armoured box on 6 wheels with a pneumatic overhead hammer-axe.
- **Arena**: steel plate floor with scorch marks and gouges, thick scratched polycarbonate walls with steel posts, overhead lighting truss, dim crowd-free surroundings.

Reference the real thing: search for how real combat robots are built and how they look on camera (AR500/Hardox plate, titanium, UHMW, weld seams, bolts, exposed chains/belts/wheels,
chipped paint, grease, gouges; TV lighting, sparks, smoke). Add fine detail a camera would catch. Fake-clean surfaces are the main thing to avoid.

## The fight (required)
A ~30 s self-playing loop, no input needed: face-off, drive and circle, drum spin-up, first hit with sparks and knockback, hammer strike on TORQUE, armour panel torn off ANVIL,
smoke, KO, TORQUE wins. TORQUE wins every time (it is a reward). ANVIL is the computer-controlled bot. One big optional "FIRE" button a child can tap to trigger TORQUE's next attack is welcome but
second priority. No sound required. No people, no blood. Keep the arena and bots the star; minimal UI (a replay button and a small quality/fps readout).

## Constraints
- Target: iPad Safari, installed offline PWA. Sustained >=30 fps on a recent-ish iPad at a sensible resolution for anything real-time. No CDN at runtime.
- Budget: <= ~30 MB of total assets; state what you used. three.js r186 is in the repo; other libraries are allowed if justified.
- Licences: only assets you can legally ship on a public site (CC0 preferred). Record source + licence for each in NOTES.md.
- Stay inside `.scratch/math-bots/prototypes/<your folder>/`. Do NOT touch `src/`, root `package.json`, `package-lock.json`, or other prototypes. Do NOT commit. Do not install system-wide software; large downloads go in your folder or the scratchpad. Install extra npm packages only in your own folder (its own package.json). The repo root `node_modules` is installed and has three, vite, and playwright.
- Use your assigned port for local servers and kill them when done.

## Deliverables in your folder
- `dist/index.html` + assets: fully static build, relative paths, works from any sub-path on any static server, no network at runtime. Add `?shot=<seconds>` to freeze at a given fight time, and set `window.__ready = true` when rendered, so the shots are reproducible. (Pure video routes: seek the video.)
- `shots/01-faceoff.png`, `02-impact.png`, `03-closeup.png` (close enough to judge surface detail), `04-ko.png`, all 1600x900, plus `shots/clip.webm` (10-30 s of the fight).
- `NOTES.md`: the technique in plain language; what was researched, with source URLs; assets + licences; measured numbers (fps, resolution, draw calls, triangles, total download size); how it would fare on an iPad and why; what it would take to reach production and integrate into a repo game; honest weak points.

## How to work
1. Research your route with web search first, briefly. Prefer primary sources.
2. Build it. Use a real GPU: run Playwright Chromium **headed** with `--use-angle=metal --enable-gpu --ignore-gpu-blocklist --enable-unsafe-webgpu` (Apple M3 MacBook Air). The default headless SwiftShader gives ~1 fps and misleading results. The machine is shared with other prototypes building at once, so fps numbers may read low; note it.
3. **Look at your own screenshots with the Read tool and iterate at least 3 rounds.** Critique them as a harsh art director against a real photo: where does it look fake? Fix the worst thing first. Do not stop at "it renders".
4. Report honestly. If something does not work or does not look real, say so. We cannot test on an iPad here, so an iPad claim is an estimate unless you say otherwise; say what it is based on.
5. Final reply (under 200 words): what the route is, how real it looks by your honest judgment 1-10, fps measured, download size, biggest weakness, and the paths to your deliverables.
