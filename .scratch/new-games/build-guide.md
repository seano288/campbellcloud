# Build guide: a new learning game on the family site

Read this first, then the game's own brief (`.scratch/<game-slug>/brief.md`). This guide holds everything the briefs share: who plays, how the existing games are built, what to wire up, how to verify, and what to report. Where a brief and this guide differ, the brief wins.

Briefs that use this guide: `dino-dig`, `word-wreckers`, `sentence-express`, `treasure-fleet`, `wild-rescue`, and the second batch (2026-11-17): `turbo-tally`, `hook-and-ladder`, `deep-light`, `food-truck`, `sky-writer`, and the third batch (2026-11-23), which steps up to early second-grade work: `jetway`, `skyline`, `carrier-deck`, `cargo-words`, `globe-hopper`, `moon-base-mail`, and the fourth batch (2026-11-24), each with its own currency: `big-air`, `coaster-crew`, `dragon-roost`, `tractor-patch`, `plow-patrol`, `time-garage`, `castle-blocks`, `storm-chaser`.

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
6. **Each finished Round earns the game's currency and one go at the action reward.** The amounts are the same in every game (`boltsFor`: one per first-try answer plus one for finishing). What it is called and how it looks belong to the game: see "Currency" below. Where this guide says Bolts, read the game's own currency. The first go is free so he sees the reward before his first purchase.
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

## Rewards that never run out

This is the parent's biggest complaint about the games so far, so treat it as a requirement on the same footing as the learning. He has emptied every reward ladder on the site, usually within an hour of play and never in more than a day. Turbo Tally's 24 tracks and six Cups lasted about 90 minutes. Rover Code, Treasure Fleet, Wild Rescue, Sentence Express, Deep Light and Hook and Ladder all had their rewards doubled or tripled within days of being built. A game whose rewards can be finished is not done.

Where a brief gives a count or a price limit that is smaller than this section asks for, this section wins. It was written after most of the briefs.

**Build three layers, in this order of importance.**

1. **An endless layer, made by the game.** Something he can keep earning or beating for ever, generated from a number rather than written by hand. Turbo Tally's Mystery Race is the model: each Level's track is generated from the Level number, is the same track every time for that Level, is checked to be playable, gets a little harder each Level and hands out a special part every fifth Level. Every game needs its own version: generated flights, missions, ships, launches or landings, and generated things to own (a building made from parts, a paint made from a colour and a pattern and a trim). Generated content must be seeded so it is the same on a reload, and tested: a few thousand generated in a test, every one playable and winnable.
2. **Things that can be bought again and again.** Land that grows plot by plot, a tower that takes another floor, a part with ranks. The price rises gently and then stays flat, so there is always something to spend Bolts on and it never becomes hopeless. Nothing bought is ever used up or lost.
3. **Sheer quantity.** A large fixed catalogue with real variety: about 250 things at least, including kinds that change how the reward plays, not only paints.

**Tie progress to Rounds, not only to Bolts.** Anything opened by a go at the action reward (a Mission flown, a Route reached) can only be earned one Round at a time, so it cannot be bought out early. Lean on this.

**Do not raise payouts** to make dear things reachable, and do not add ways to earn Bolts without answering questions. Extra Bolts from the action reward stay small (Turbo Tally pays 3 to 8 for a first win).

**Prices.** Up to 100 in ones, then whole tens up to 400, using the clips Turbo Tally added (`PRICE_TENS` in `src/turbo-tally/phrases.ts`, with "You need about 140 more Bolts" for a gap that is not a whole ten). Copy that pattern. Dearer things are welcome, inside these limits, which exist so he is never discouraged:

- His first purchase comes within two Rounds, and through the first hundred Rounds he can always get something new within three.
- Nothing takes more than about 40 Rounds of saving from nothing, and only a handful of things take more than 15.
- A dear thing always sits beside cheap ones in the shop, and the Goal shows a bar filling toward it, so saving up looks like progress.
- A dear thing is worth it: it changes what he can do or how the reward plays. A paint is never the dearest thing.

**Measure it, and put the measurement in a test.** Write an economy test with a scripted child who gets every answer right first try, takes every go at the reward, wins everything he can and always buys the cheapest new thing. Measure how many Bolts a Round really pays, reward payouts included, and how long a Round and its reward take (the tour script can time it; a first guess is about 20 Rounds an hour). The test must show:

- The fixed catalogue lasts that child at least 300 Rounds, which is about 15 hours of play.
- After 2,000 Rounds there is still something new to earn, buy or beat in every Round. No save state reads "all done".
- The pacing limits above hold.

Put the three numbers (currency earned a Round, Rounds to finish the catalogue, the longest gap between new things) in the spec and in the final report.

## Currency

Most games so far pay in Bolts. That suits a garage, a hangar or a robot workshop, and it does not suit a farm or a dragon's cave. The parent asked on 2026-11-24 for each game to pay in something that belongs to its world. Every brief from the fourth batch on names its currency in a "Currency" section. An older brief that says Bolts keeps them unless the parent says otherwise.

- **Add it as a kind, not as a rename.** `src/currency/kind.ts` holds each currency's name for one and for many (`BOLT`, `AMMO`). Add the new one there, draw its icon in `src/ui/currency.tsx`, and export it from the game's `branding.ts` as Sight Squad does with Ammo. Sight Squad is the model: read how its Camp, Goal bar, end overlay and phrases use `SQUAD_CURRENCY`.
- **Only the name and the picture change.** Earning, spending, prices, the save and every rule in "Rewards that never run out" stay as they are.
- **It is never money.** No dollars, cents or coins with values. Bolts were made "deliberately not money" so that spending never asks him to count cash, and that still holds. Monster Truck Money and Food Truck own real money.
- **It is said aloud.** The earned line, the need line, "It costs" and the whole-ten prices are recorded with this currency's word. Nothing in the game says or shows "Bolt", including the Round-done celebration, which flies Bolts today (`flyBolt` in `src/celebrate/effects.ts`): make it fly the game's own icon. A test fails if the word Bolt appears in the game's phrases or its screens.
- **Listen to the word.** A short word can come out wrong from the voice by itself (see `SAID_AS`). Record "1 Seed" and "5 Seeds" early and listen.
- **Add it to `GLOSSARY.md`** in the game's section, the way Ammo is there, with "Avoid: Bolt".

## Competition

Some rewards have a rival: a race, a league, a contest. Balance is hard, and both ways of getting it wrong have happened here. In Math Bots and the first Turbo Tally he won everything at the first try and was finished in an afternoon. When Turbo Tally was made harder on 2026-11-21 he came last, and it had to be retuned the same day. Aim between the two:

- **He wins most of the time, not all of the time.** With the car, plane or part a child would plausibly own at that point, he should win about two tries in three. A rival he beats at the first try every time is too easy. A rival he cannot beat in three tries is too hard.
- **Losing never sticks.** A rival who beats him gets a little easier each time until he wins (Turbo Tally's mercy step). Winning easily makes the next one a little harder. Rivals ease off when he is far behind, so he is never alone at the back.
- **In a pack he is rarely last.** Put slower rivals in the field as well as faster ones. Coming third of six feels fine; coming sixth does not. Every finish is cheered and pays something, and he never loses anything he owns.
- **Better parts must matter but not decide it.** If the dearest part wins everything, the contest is over once he buys it. If parts do nothing, there is no reason to buy them. Harder tiers should need both a better build and better hands.
- **Keep all the tuning in one table**, and test it with three scripted children: one who does nothing, one who is clumsy and one who is skilled. Doing nothing wins only the very first contest. The clumsy child wins every contest within three tries. The skilled child does not win the later tiers at the first try. Record the measured win rates in the spec.
- **A personal best is competition too**, and it never needs balancing: his fastest lap, his longest flight, his best landing. Show it and cheer when he beats it.

Competition is optional. A reward he builds and plays with does not need a rival to be good.

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
- Vitest tests in the style of `src/rover-code/*.test.ts`: every generated question has exactly one right answer and matches its Level; content tables are checked for the ambiguities the brief names; saving, prices and payouts are covered; a scripted child can always finish the action reward; the economy test and the generated-content test from "Rewards that never run out" pass; where there is a rival, the three scripted children from "Competition" get the results it asks for.
- A browser tour script like `tools/rover-code/tour.ts` that plays as a child would: a whole Round with one deliberate miss, a purchase, and the action reward to its end. Run it at 810×1080, 1080×810, 390×844 and 844×390, on a new save and on saves with every kind open at Level 2 and Level 3. It should fail on buttons off screen or under 44px.
- On the production build, a Round still starts after going offline (`npm run check:offline` shows how the others check it).

## Final report

Say what you built (kinds, Levels, reward loop), how long the rewards last (the three measured numbers, and what the endless layer is), the win rates against any rival, the defaults the parent should confirm, what you verified and how, and what is not done or not verified. Real-iPad and Safari testing will not be possible; say so, and list what most needs checking on the device.
