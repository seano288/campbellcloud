# Brief: Sky Writer (handwriting; build a stunt plane that writes in smoke)

Status: ready-for-agent

Read `.scratch/new-games/build-guide.md` first. It covers the player, the shared engine, wiring, voice, verification and the final report. This brief covers only what is particular to Sky Writer. Slug: `sky-writer`. The name is a working name for the parent to confirm.

## Why this game

Every game on the site is answered by tapping. None asks him to form a letter. First graders are expected to print all the upper- and lowercase letters (Common Core L.1.1a) and to write numbers, and this is the age of backwards letters and numbers: b and d, p and q, 2, 5, 3, 7, S. Reversals mostly come from starting a letter in the wrong place or going the wrong way, and that is something a touch screen can see and teach.

## What it can and cannot teach

A finger on glass teaches where a letter starts, which way each stroke goes, their order, and how tall the letter is. It does not teach how to hold a pencil. Say so in the spec. An Apple Pencil works on the iPad 9, so take pointer input from a finger or a pencil alike.

## What he learns

Letters are taught in groups that share a first stroke, which is how handwriting is usually taught. Each group is a **Family**, met before it is asked, as Sight Squad's word sets are:

1. Straight-line capitals: L, T, I, H, E, F
2. The c family: c, a, d, g, o, q
3. Tall lines and tails: l, t, i, j, k
4. Bumps: r, n, m, h, b, p
5. Slants: v, w, x, y, z
6. The rest of the lowercase letters: s, e, f, u
7. Numbers 0 to 9
8. The rest of the capitals

Research the order and the letter shapes before fixing this. The big open question is which handwriting style his school teaches (a ball-and-stick style such as Zaner-Bloser, or a slanted one such as D'Nealian). Default to ball-and-stick shapes that match Andika, the site's reading font, and ask the parent.

## Kinds

Defaults; refine them if the research says otherwise, and record what you chose in the spec.

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **Trace It** `trace` | start | a dotted letter with a start dot and an arrow, a wide lane | the start dot only, a narrower lane | just the writing lines and a faint letter that fades as he starts |
| **Where to Start** `start` | start | a letter with three dots; tap the one it starts at | "Which way does it go first?" pick an arrow | "Which line comes second?" tap it |
| **Which Way** `flip`: backwards letters | Trace It L2 | hear "b"; tap the right one of b and d | pick it from four (b, d, p, q) | a short word with one backwards letter; tap it |
| **Tall, Small, Tail** `size` | Where to Start L2 | sort letters: tall (b, d, h), small (a, c, e), tail (g, j, p) | "Which word sits on the line the right way?" three drawings | tap the letter that floats or sinks |
| **Write It** `write`: from memory, no guide | Trace It L2 and Where to Start L2 | hear a lowercase letter; the letter flashes for a second, then he writes it on empty lines | no flash | capitals and numbers too: "Write 15" |
| **Write a Word** `word` | Write It L2 | a three-letter word, one box per letter, the word shown above | the word is said and shown briefly, then hidden | the word is only said |

Write a Word uses short-vowel words from the Dino Dig list (`src/dino-dig/words/`, read only).

## How a stroke is checked

No handwriting recogniser. Each letter is data: its strokes in order, each a path with a start, checkpoints and an end. A stroke passes when the finger starts near its start, goes through the checkpoints in order while staying in the lane, and ends near its end. The lane narrows with the Level. Write It uses the same checker with the lanes hidden and wide.

Rules the tests must enforce:

- Every letter, capital and number has stroke data, and each one's strokes can be drawn by a scripted finger at every Level's lane width.
- Only two things count as a miss: starting in the wrong place, and going the wrong way. A wobble out of the lane is not a miss; the stroke just rubs out and he tries again. A miss the checker invents would teach him the game is unfair.
- Where to Start, Which Way and Tall, Small, Tail have exactly one right choice.
- Which Way at Level 3 uses only words where the flipped letter does not make another real word (*bad* with a flipped b reads *dad*; leave it out).
- A question only uses letters from Families he has met.

## Teaching a miss

A small plane flies the stroke the right way, leaving smoke, while the voice says the letter's words: "Start at the top. Pull down. Back up and around." Then he traces over the smoke. For b and d, the two are drawn side by side from their different starts: "b starts with the tall line. d starts with the round part." A second miss holds the start dot lit and walks one stroke at a time.

## Voice

Use Aria, as the build guide says for reading games. New clips: a short line of stroke words for each of the 62 letters, capitals and numbers, built from a small set of shared phrases (pull down, around, slant, lift, cross) so they stay consistent. Letter names are already known to need recording as "R." rather than "ar" (`SAID_AS` in `tools/make_voice.py`).

## The reward: the Airfield, the Show and the Wall

- **The loop.** A finished Round earns Bolts and one Show. Bolts buy planes, smoke and parts. A Show he has not flown before opens the next one.
- **The Airfield.** Flat 2D stunt planes drawn in code, about twelve kinds: biplane, racer, jet, glider, seaplane, a dragon. Slots on each: Engine, Wings, Smoke Tank, Smoke Colour, Smoke Shape (plain, stars, bubbles, rainbow), Propeller, Paint, and a Pilot.
- **Parts matter.** The Engine sets speed. The Wings set how tightly it turns. The Smoke Tank sets how long a trail he can lay.
- **The Show (action, 2D canvas).** A held finger leads the plane and it leaves smoke behind. He flies through rings, and Loop and Roll buttons do the tricks. About 45 seconds. Bumping a cloud or a balloon only wobbles him.
- **Free Sky.** After the rings the sky is his: he draws whatever he likes in smoke. He can keep it as a postcard.
- **Shows.** Sixteen places to start: the beach, the city, a canyon, the mountains, a stadium, a night sky with fireworks.
- **The Wall and show off.** His postcards and his planes. The Wall is the screen he shows people.

Time Flies already has a 3D Hangar of real aircraft. This one is flat, made up and about the smoke; do not import from `src/time-flies/` and do not rebuild the Hangar.

Plan for about 150 things to earn from the first build (see the build guide). Economy defaults for the parent to confirm: one Show per Round, the first one free; no price over 100 Bolts.

## Look

Sky blue, cloud white and stunt-plane red, with the three writing lines (top, middle, bottom) drawn as contrails. Icon: a red biplane finishing a smoke letter "a".

## Risks

- The stroke checker. Too strict and he is told he is wrong when he is right; too loose and it teaches nothing. Build Trace It for six letters first and tune it with the parent watching him use it.
- Stroke data for 62 shapes is a large hand-made table, and it must match the style his school teaches.
- Finger writing is not pencil writing. The parent should know what the game does not cover.
- A long smoke trail is many points to draw each frame. Cap its length and check it holds 60 fps on the iPad 9.
- A second plane game on the site. If the parent would rather not, the same kinds work with a spray-paint robot or a laser cutter.
