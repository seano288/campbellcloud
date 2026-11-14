# Build guide: a new learning game on the family site

Read this first, then the game's own brief (`.scratch/<game-slug>/brief.md`). This guide holds everything the five briefs share: who plays, how the existing games are built, what to wire up, how to verify, and what to report. Where a brief and this guide differ, the brief wins.

Briefs that use this guide: `dino-dig`, `word-wreckers`, `sentence-express`, `treasure-fleet`, `wild-rescue`.

Do the work yourself in the current checkout. Don't start subagents. Don't commit, push or open a PR; leave the changes in the working tree.

## The player

One 6-year-old first grader, playing alone on the family iPad (an iPad 9), sometimes an iPhone, usually with the sound on. He reads numbers and short words and leans on the recorded voice for everything else. The game is installed as a PWA from the family site and must work offline.

## Read before you design

- `CLAUDE.md`, `PRODUCT.md`, `DESIGN.md`, `GLOSSARY.md`, `docs/adr/`, `docs/agents/issue-tracker.md`
- `.scratch/rover-code/spec.md` and `src/rover-code/`: the newest game and the closest model for file layout, wiring and the reward he drives. Copy its shape, not its content.
- `.scratch/math-bots/spec.md` and `src/math-bots/`: kinds with three Levels each, Stretch, Mastery, the Tune-Up placement.
- `.scratch/sight-squad/spec.md` and `src/sight-squad/`: the reading game. Its word list, "met before it's asked" rule and per-word strength matter for the three reading briefs.
- The shared engine: `src/learning`, `src/round`, `src/currency`, `src/rewards`, `src/save`, `src/voice`, `src/celebrate`, `src/audio`, `src/ui`, `src/styles.css`.

## What every game must do

1. **Voice first.** Everything he must understand is spoken; text supports it. Answer buttons are not read out unless the brief says so.
2. **Play is the one obvious thing to tap.** He never picks a mode. Rounds are five answers, mixed across every kind he has opened, never the same kind twice running while there is another.
3. **Levels rise by themselves on Mastery and never go down.** Use the Math Bots rules (16 of the last 20 right first try, or 10 in a row; the quick rule for the first 30) unless the brief says otherwise. New kinds open as earlier ones reach Level 2.
4. **Teach a miss, never mark it.** No red X. Show him why on the thing itself, and say it. A second miss gets a fuller worked lesson. A missed question comes back later in the Round as a fresh one with no Mastery credit.
5. **The reward is something he owns, drives with his hands and can show off.** Never a score, never something he can lose. The action part cannot be failed: hazards only wobble or bounce him.
6. **Each finished Round earns Bolts and one go at the action reward.** Bolts use the shared currency (`boltsFor`: one per first-try answer plus one for finishing). The first go is free so he sees the reward before his first purchase.
7. **A Round resumes after a reload.** Saves are versioned, under `<slug>-save` and `<slug>-place`; an unknown version reads as a blank save.

## Build and wiring checklist

Rover Code touched exactly these places. Do the same for the new slug:

- `src/<slug>/`: all game code, with its own CSS file, `phrases.ts`, `voice.gen.ts`, `voiceCollection.ts`, `branding.ts`, `entry.tsx`, `entrySelection.ts`, `icon.ts`
- `vite.<slug>.config.ts` and `tools/<slug>-build.ts` (out dir `dist-site/<slug>`)
- `package.json`: a `dev:<slug>` script on its own port
- `tools/site-build.ts`: import the build, add the tile to the **Learning Games** section, add the build step
- `tools/phrases.ts`: register the phrase collection
- `tools/make_voice.py`: add the usage line and the voice choice
- `public/<slug>-voice/`: the recorded clips
- `GLOSSARY.md`: a section for the game's own terms
- `docs/adr/0002-family-site-one-folder-per-game.md`: add the save key and the tile to the lists there
- `.scratch/<slug>/spec.md`: write it in the style of the Rover Code spec once the design settles. Mark every decision you made as a default for the parent to confirm, and end with open questions and a "Not done" list.

Stack: Preact and Vite, static files, no new runtime dependencies without a strong reason. Art is drawn in code or uses emoji; no downloaded art packs. Keep the precache small (Rover Code's voice is 4.3 MB; the whole site budget is about 50 MB).

## Look

The family look: Bungee for titles, Nunito for reading, 4px black outlines, solid chunky drop shadows. Reading games use Andika for anything he reads (a school font with single-storey *a* and *g*), lowercase except *I*, names and a sentence's first word. Each game gets its own colour world and its own icon drawn in code.

## The action reward

- 2D canvas only. Math Bots dropped three.js and Rapier for a flat 2D fight after its first week; do not bring a 3D or physics library back.
- Hand-rolled movement and collisions, tuned for an iPad 9. Cap moving pieces so it holds 60 fps.
- Keep controls off the screen edges: the bottom band and the sides belong to iPadOS. Buttons sit above a floor of at least 56px and away from the sides.
- Tap targets at least 44pt everywhere. Lay out for iPad portrait and landscape and for an iPhone both ways.
- Don't import from another game's reward folder. Copy a pattern if it helps.

## Voice recording

- Clips are made with edge-tts by `tools/make_voice.py --collection <slug> --out public/<slug>-voice --index src/<slug>/voice.gen.ts`. It needs no credentials. Setup is in the file's docstring. Only missing clips are recorded.
- Every line the game says is one entry in `src/<slug>/phrases.ts`; the build fails if a clip is missing. Numbers and names are separate clips chained into lines, as in Math Bots and Rover Code.
- Use `en-US-AriaNeural` at `-8%`. The default voice (Ava) blurs short vowels ("did" sounds like "dead"), which matters for anything about reading.
- The voice mangles some text. `SAID_AS` and `speakable()` in `make_voice.py` hold the fixes found so far (a lone "cat" comes out as "Kate"; letter names are recorded as "R." not "ar"). Listen to a sample of new clips, especially single words, and add fixes there.
- Report any clip you could not record or that still sounds wrong.

## Bugs the last build hit, so check for them

- After a miss, the question stopped accepting taps because the view did not redraw when the Round moved on. Play a deliberate miss in every kind.
- Layouts that did not fit a sideways phone.
- A screen that turned one solid colour from a CSS rule leaking between kinds.

## Done means

- `npm run typecheck`, `npm run typecheck:pairings`, `npm test` and `npm run build:site` all pass.
- Vitest tests in the style of `src/rover-code/*.test.ts`: every generated question has exactly one right answer and matches its Level; content tables are checked for the ambiguities the brief names; saving, prices and payouts are covered; a scripted child can always finish the action reward.
- A browser tour script like `tools/rover-code/tour.ts` that plays as a child would: a whole Round with one deliberate miss, a purchase, and the action reward to its end. Run it at 810×1080, 1080×810, 390×844 and 844×390, on a new save and on saves with every kind open at Level 2 and Level 3. It should fail on buttons off screen or under 44px.
- On the production build, a Round still starts after going offline (`npm run check:offline` shows how the others check it).

## Final report

Say what you built (kinds, Levels, reward loop), the defaults the parent should confirm, what you verified and how, and what is not done or not verified. Real-iPad and Safari testing will not be possible; say so, and list what most needs checking on the device.
