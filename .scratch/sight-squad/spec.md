# Spec: Sight Squad (sight words, building a toy army)

Status: built, awaiting iPad acceptance (2026-10-26).

A fourth learning game on the family site, built the same way as Chop Chop and Time Flies, for the same young player (6,
an early reader who leans on the recorded voice). He learns the most common sight words (Dolch pre-primer and primer, Fry's
first hundred), one at a time, and spends the Bolts he earns building an army of green plastic toy soldiers on a play-mat.
The parent chose (2026-10-26): toy soldiers, the name Sight Squad, a Parade *and* a toy Battle, and starting from the very
first word.

Research behind this spec (written by Haiku agents): `research/teaching-sight-words.md` (orthographic mapping, heart
words, question kinds, the word list), `research/army-reward.md` (what makes an army reward work, themes, economy) and
`research/army-display.md` (instanced three.js figures on an iPad).

## Words

- **100 words in 20 sets of 5**, in frequency order, so that confusable words (was/saw, on/no, the/then, of/for,
  there/they, here/where, to/two, run/ran) never sit in the same set: `src/sight-squad/words/list.ts`.
- Each word is marked **regular** or **heart**: a heart word's tricky letters (the *ai* in *said*) get a ❤️ when it is
  taught ("Say it, spell it, say it", with the heart letters shown), the way UFLI and Really Great Reading teach them.
- **Every word is met before it's asked**, one at a time, as Chop Chop meets piece words. The first word is met at the start;
  the next comes after 5 more right on the first try, and waits while more than two words are still shaky. Meeting a word:
  it appears big, "This word is *said*", then "Say it, spell it, say it: *said*, S, A, I, D, *said*!" with each letter lit
  as it's named, its heart part if it has one, a short sentence that uses it (read aloud, the word lit), and he taps it.
- Each word keeps a **strength** (0 to 5): up on a first-try answer, down on a miss. Questions pick weak and new words more
  often, and known ones come back now and then.
- Distractors may be any word on the list (they are only shown, or read aloud), easiest first: Level 1 a very different word,
  Level 3 a look-alike (same first letter, same letters, was/saw). Words that sound the same (to/two) are never offered
  together, since he's matching what he hears.
- **Only one choice ever fits a gap.** Each word has a rough job (who, which, do, helper, like, where, join, say), and Fill
  the Gap's wrong choices come only from jobs that never stand in for the right one's ("Here is my hat" / "This is my hat",
  "She had a hat" / "She saw a hat", "Go up!" / "Go play!"): `NEVER_FITS` in `words/list.ts`, checked by a test that lists
  the sentences a review found ambiguous.
- Lowercase throughout (Andika, a school font with a single-storey *a* and *g*), except *I* and a sentence's first word.

## Learning: six kinds of question, three Levels each

Every Round mixes the kinds he has opened, never the same kind twice in a row, mostly at that kind's Level (which counts
toward Mastery) and about one in three from an easier Level; the one after a miss is always easier. Mastery: 16 of the
last 20 right on the first try, or 10 in a row. Teaching after two misses (or one when struggling): the right word lights
up, is read, spelled letter by letter and read again, with its heart part.

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| 👂 Find It: hear a word, tap it | start | 2 words, very different | 3 words | 4 words, look-alikes |
| 🔎 Word Hunt: tap every copy in a grid | start | 6 cards, 2 to find | 9 cards, 3 | 12 cards, 3 to 4, look-alikes and a capital |
| 🔤 Build It: tap the letters in order | start | the letters shown faintly in the slots | no hints, one spare letter | two spare look-alike letters (b/d, m/n…) |
| 👀 Read It: read the word, pick the one you hear | Find It L2 | 2 read aloud | 3 read aloud | 3 look-alikes |
| 📜 Sentence Hunt: find the word in a sentence | Word Hunt L2 | short sentence | longer | the word starts the sentence, with a capital |
| ✏️ Fill the Gap: which word is missing? | Build It L2 | 2 written choices | 3 | 3 look-alikes |

Sentences use only words he has met plus a few picture nouns (dog, cat, sun, tank, ball…); a kind that can't ask anything
yet sits out.

## Reward: the Camp

- **His army**: green plastic toy soldiers on a play-mat, built in code from primitives (one `InstancedMesh` per part per
  unit type). It starts with three Riflemen. Ten **Squads** (unit types): Rifleman (starter), Scout, Drummer, Medic, Rocket
  Trooper, Army Dog, Paratrooper, Jeep, Cannon, Tank. A Squad is unlocked once with Bolts (10 to 30; the first soldier comes
  with it), then each **Recruit** costs 2 to 12 Bolts and marches onto the mat. Each Squad has a maximum (24 Riflemen, 3
  Tanks…), about 65 figures in all. Each Squad says a true fact when tapped.
- **Gear** for the whole army, Slots as in the other games (free default, three Rungs at 5/15/30 Bolts, a Legendary):
  Helmet, Pack (backpack → radio → jet pack → dragon wings), Flag, Finish (shiny, glitter, glow → Gold Chrome), Mat
  (sandbox, grass, snow, beach → the Moon) and Boom, what they throw in a Battle (foam balls, water balloons, paint, fireworks →
  Rainbow Blaster).
- **Team Colour**: Army Green is free; eleven more at 3 Bolts. All the plastic is one colour, like real army men.
- **Legendaries are in the Password Lock**: once a Slot's top Rung is his, he opens its Legendary by building the
  password, a word he knows, from letter tiles.
- **Goal**: the cheapest locked Squad or Gear (or the one he tapped), a Colour only when nothing else is left.
- The Camp's top corners hold 🏆 (left), 🎺 Parade and 💥 Battle (right); the strip along the bottom opens Squads, each Gear
  Slot and the Colours. Tapping a soldier says its Squad and a true fact, and the whole Squad jumps.
- **Parade** (🎺): the army marches round the mat in a column behind the flag and the drummers. Along the bottom are
  **command words** he has met (go, stop, run, jump, look, come, down, up, play), written only, no pictures: tapping one
  reads it and the army does it. Reading the word is the fun; it never earns or costs anything.
- **Battle** (💥): a troop of wind-up toy robots lines up across the mat. He taps **go**; his army throws its Boom, robots
  that are hit fall over and go *poof* in confetti, his soldiers that are hit fall over and bounce back up. It always ends in
  a win and a cheer. No kill words anywhere: knocked over, poof, bounce back.

## Where it lives

- Game: `src/sight-squad/` (words in `words/`, the Camp in `camp/`, 3D in `camp/three/`). Save key `sight-squad-save`.
- Voice: `src/sight-squad/phrases.ts`; clips in `public/sight-squad-voice/`, recorded with
  `.venv/bin/python tools/make_voice.py --collection sight-squad --out public/sight-squad-voice --index src/sight-squad/voice.gen.ts`.
  Letters are recorded by name ("Letter A" is said "ay").
- Builds: `npm run dev:sight-squad`, `npm run build:site` (`/sight-squad/`). Checks: `tools/sight-squad/tour.ts` (plays Rounds, the Camp, a Parade and a Battle; `LEVEL=2 BOLTS=200` for a big army
  with everything open) and `tools/sight-squad/shots.ts` (meeting a heart word, teaching, the Password Lock, Legendary Gear
  on the Moon, an iPhone).
