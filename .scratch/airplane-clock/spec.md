# Spec: Time Flies (telling time, building aircraft)

Status: built, awaiting iPad acceptance (2026-10-16). Follow-ups in `issues/`.

A second game on the family site, for the same young player as Monster Truck Money (not yet reading fluently, so
everything is spoken from recorded clips). He practises reading an analog clock and spends the Bolts he earns building
a realistic aircraft in a 3D hangar. It reuses the extracted learning, Round, currency, purchase, save, voice and
celebration seams; the subject (clocks) and the reward (the Hangar) are new.

Research behind this spec: `research/` (three rendering notes and one note per aircraft in `research/jets/`).

## The site

- `seano288.github.io/campbellcloud/` becomes a landing page with one big tile per game. It has its own manifest,
  icons and service worker, so the Home Screen app that already points at the site root keeps working offline: it
  opens the landing page and he taps the truck.
- Monster Truck Money moves to `/monster-truck-money/` and Time Flies lives at `/time-flies/`. Each game has its own
  service worker scoped to its folder. The landing page's worker never answers navigations into a game folder, so the
  old root worker's cached Monster Truck page cannot shadow the games after the update.
- Saves are per origin, so the Monster Truck save (`mtm2-save`) carries over unchanged. Time Flies saves under its own
  key, `time-flies-save`.
- `npx vite build` still builds only Monster Truck Money into `dist/` (the browser checks use it). `npm run build:site`
  builds the whole site into `dist-site/`, which Pages deploys.

## Learning: the clock

Three Game Modes, opened in order (each opens when the previous one reaches Level 2), each with the three Levels the
brief asked for: **Level 1** whole hours, **Level 2** quarter hours, **Level 3** every five minutes. Mastery and Levels
work exactly as in Monster Truck Money (8 of the last 10 right on the first try without help).

1. **Find the Clock** — he hears a time ("Find this time! Three fifteen.") and taps the one of three clocks that shows it.
   No reading at all.
2. **Read the Clock** — one clock; three answers, each read aloud while it lights up, shown as digital times.
3. **Set the Clock** — he hears a time and drags the hands (they are geared like a real clock) and taps ✓. The hands
   snap to the Level's step: hours, quarters, then five minutes.

Help and teaching (after two misses, or one when he's struggling) speak and light up the hands: the short hand shows
the hour, the long hand shows the minutes, count by fives around the dial, and "the short hand is between the 3 and the
4, so the hour is 3." Times are spoken the way they are written: "three o'clock", "three fifteen", "three oh five".

## Reward: the Hangar

- **Aircraft** (the Body equivalent): 14, from the brief. Starters: P-51 Mustang, F-16 Viper, F/A-18 Super Hornet. The
  other eleven cost 30 Bolts each.
- **Slots**, each with a free default, three Bolt Rungs (5, 15, 30) and a Legendary: Paint, Nose Art, Tail Art,
  Weapons, Engine, Smoke, Canopy, Lights, Tail Number. Each aircraft draws each Mod its own way (Weapons hang on that
  aircraft's real hardpoints; the Air Show paint is that aircraft's demo team or most famous scheme).
- **Colours**: Factory (the aircraft's real scheme, free) plus eleven colours at 3 Bolts, shown with the Plain paint.
- **Legendaries are in the Time Lock vault.** Once the top Rung of a Slot is his, tapping its Legendary asks him to
  set the clock to a time; the vault opens when he does. This is the learning-to-reward link, as Legendary checkout is
  in Monster Truck Money.
- **Take Off** (the Show Off equivalent): the aircraft flies through the sky with its Smoke and Engine; tapping it
  does a roll, a loop, or fires its Legendary fireworks.

## 3D rendering (more realistic than the truck)

From `research/rendering-*.md`:

- Aircraft are built in code from per-aircraft data specs (metres, from published dimensions) by a shared builder:
  lofted fuselages with superellipse sections (chines and flat bellies included), NACA-section wings and tails, lathe
  nacelles, nozzles, stores and propellers, landing gear, and pivot groups for moving parts (F-14 sweep, V-22
  nacelles). No third-party meshes, so there is nothing to license and nothing to download.
- Liveries are painted with Canvas 2D in aircraft coordinates onto a top/underside/left/right projection atlas, so
  camo, stripes, nose art and tail numbers line up across every part of every aircraft.
- Hangar stage: procedural hangar, image-based lighting from a CC0 Poly Haven HDRI, Neutral tone mapping, clearcoat
  physical paint, a soft contact shadow, PCF shadows (PCFSoft was removed in r186), additive afterburner plumes with
  shock diamonds, frame-on-demand rendering.

## Where it lives

- Game: `src/time-flies/` (App, Home, Rounds, clock lessons in `clock/`, Hangar in `hangar/`, 3D in `hangar/three/`,
  one spec per aircraft in `hangar/jets/`). Shared engine modules are imported from `src/learning`, `src/round`,
  `src/currency`, `src/save`, `src/voice`, `src/audio`, `src/celebrate`, `src/trophies`, `src/app/coordination.ts`.
- Voice: `src/time-flies/phrases.ts` lists every phrase; clips in `public/time-flies-voice/`, recorded with
  `.venv/bin/python tools/make_voice.py --collection time-flies --out public/time-flies-voice --index src/time-flies/voice.gen.ts`.
- Environment maps: `public/time-flies-assets/env/` (CC0, see SOURCES.md).
- Builds: `npm run dev:time-flies`, `npm run build:site`. Checks: `tools/time-flies/tour.ts`, `tour-modes.ts`,
  `site-offline.ts` (headless walk-throughs with screenshots).
- Decisions: ADR 0002 (one folder per game) and ADR 0003 (aircraft built in code).
