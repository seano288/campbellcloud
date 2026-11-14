# Spec: Rover Code (early coding and logic, rocket-and-rover reward)

Status: built on 2026-11-13, playable at `/rover-code/` with a tile on the landing page. Every decision below is a **default for the parent to confirm**. Not yet run on a real iPad.

A new learning game on the family site, built the same way as Math Bots (`src/math-bots/`, `.scratch/math-bots/spec.md`), for the same player (6 to 7, reads numbers and short words, leans on the recorded voice, alone on an iPad 9). Short mixed Rounds earn Bolts, spent on rocket parts. Each Round also earns a launch: he flies the rocket himself and drives his rover on the planet it reaches.

## Kinds

Four kinds, three Levels each, with Stretch inside a Level (longer paths, more rocks, longer patterns). Everything is a tap. Programs use screen directions (up, right, down, left), never "turn left", because a first grader reads arrows on a screen, not the rover's own left.

| Kind | Level 1 | Level 2 | Level 3 |
|---|---|---|---|
| **Drive It** `drive`: tap arrows into a program bar, then Go | Straight, 2 to 4 steps, 0 to 2 rocks | One turn, 3 to 6 steps | Two or more turns, 5 to 8 steps, round rocks (a detour from Stretch 1) |
| **Patterns** `pattern`: what comes next | AB, 4 to 6 shown | AAB / ABB, then ABC, then the gap in the middle (Stretch 2) | Arrows turning like a clock hand, then AABB / ABCD / ABBC, then a gap in the middle |
| **Bug Hunt** `bug`: one step of a program is wrong | Watch it run, tap the wrong step; the fix goes in by itself and it drives home | Watch it run, tap the step, then pick the right arrow | No run first: find it by reading, then fix it |
| **Loops** `loop`: a step done again and again | "How many times?": one loop, the arrow given | Two loops round a corner: one count, then both counts, then the arrows too | "Which program gets to the flag?": two loops, then a repeated pair (a staircase) |

- **Any way across is right.** A Drive It program is right if it ends on the flag, however it got there.
- **"The bug" is always one step.** A Bug Hunt is only made when exactly one step can be changed to make the program work, so tapping a different step is never secretly right.
- **The staircase loop has a rock** on the other order's first square, so only one order of the pair works.

**Unlock order.** Drive It and Patterns open at the start. Bug Hunt opens at Drive It Level 2. Loops opens once both Drive It and Patterns reach Level 2.

**Mastery and placement (as Math Bots).** 16 of the last 20 right on the first try, or the last 10 in a row; the first 30 questions of a kind asked at his Level use the quick rule (8 of 10, or 6 in a row). Levels never go down. The first Rounds are a Tune-Up: three probes each of Drive It and Patterns at Level 2, one of each per Round. Three clean probes start that kind at Level 2 (and so can open Bug Hunt); two misses stop the row. No parent setting.

**Rounds.** Five answers, mixed across every open kind, never the same kind twice running while there's another. About one in three, and always the one right after a miss, is easier and doesn't count. A starred kind comes back about once a Round. A miss comes back later as a new puzzle of the same kind and Level, with no Mastery credit. Bolts: one per answer right on the first try, plus one for finishing (shared `boltsFor`). A Round resumes after a reload (shared `place`).

**Meetings.** Before the first Drive It or Bug Hunt, a tiny grid shows the program bar ("Tap the arrows to tell it where to go. Then tap Go!") and he taps Go to watch it drive. Before the first Loop, the loop block is shown driving three squares while the steps are counted.

## Teaching a miss

Never a red X. When he taps Go, his program always drives first, right or wrong, so he sees what it did. Then:

- **Drive It and Loops:** the rover stays where it went wrong (a 💥 at a rock or the edge, or short of the flag, or past it), the step that did it lights up, and the voice says why ("Bump! A rock is in the way." / "Oops! That goes off the map." / "It stopped before the flag." / "It drove past the flag."). The rover goes back and his program stays, so he fixes it rather than starting again (tap a step to take it out, or ⌫).
- **Second miss (or the first when he's been missing a lot):** a way across is drawn square by square while each direction is said, and left on the grid to copy. For a loop, each straight run's squares are counted aloud ("1, 2, 3. So it goes 3 times.") and that count glows.
- **Bug Hunt:** a step that is fine is called fine; the lesson replays the program up to the real bug and lights it. A wrong fix drives to show where that arrow goes.
- **Patterns:** the repeating part is banded, each piece is lit and said ("It goes Star. Moon. again and again."), and on the second miss the gap fills in ("So next comes Moon.").
- **🔎** runs the same lesson on demand and counts as help.

## The reward: the Space Base, a launch, a planet

The known risk is that the puzzles are already game-like, so the reward has to be clearly more fun. So the reward is a real-time action game he drives with his hands, unlike the turn-based puzzles, and it is the payoff of every Round.

**The loop.** A finished Round earns Bolts and one launch (🚀). Bolts buy rocket parts. Parts add Power. Power reaches planets further out. Each new planet gives his rover a gadget. Every trip pays the Bolts he catches in space and the crystals he finds. He starts with one free launch, to the Moon.

**The rocket (`base/parts.ts`).** Four slots, each with a free starter and six Rungs, plus Paint:

| Slot | Starter | Rungs 1 to 3 (Bolts) | Rungs 4 to 6 (Bolts), added 2026-11-14 |
|---|---|---|---|
| Nose | Plain Nose | Bubble Nose 8, Needle Nose 24, Star Nose 50 | Drill Nose 55, Shark Nose 70, Diamond Nose 85 |
| Body | Tin Can | Long Hull 10, Stripe Hull 30, Gold Hull 60 | Armor Hull 65, Lightning Hull 80, Rainbow Hull 95 |
| Fins | Little Fins | Swept Fins 8, Big Fins 24, Wing Fins 50 | Spike Fins 55, Jet Wings 70, Dragon Wings 85 |
| Engine | Puff Engine | Twin Engine 12, Triple Engine 36, Mega Booster 72 | Quad Engine 75, Plasma Engine 90 (blue flames), Hyper Drive 100 |
| Paint | Snow White | Fire Red, Sky Blue, Sunset Orange, Alien Green, Galaxy Purple 4 each; Night Black 6 | Bubblegum Pink, Lemon Yellow, Ocean Teal 8 each; Chrome Silver, Midnight Blue, Cotton Candy 10 each; Glow Lime 12 |

Power is the sum of the four slots' Rungs plus one (4 to 28). Paint adds none. No price is over 100, the most the recorded numbers go. As in Math Bots' Workshop, a part he hasn't got goes on the rocket to try, with its Power and Buy beside it; buying fits it. The Goal is the cheapest part that adds Power, or the one he tapped and couldn't afford. Every part together costs 1,309 Bolts (384 for Rungs 1 to 3, 925 for Rungs 4 to 6), and the paints 92.

**The planets (`base/planets.ts`).** Moon (Power 4), Mars 5, Frosty 7, Ringo 9, Lava World 11, Crystal World 13, Jungle World 14, Rainbow World 16, then (added 2026-11-14) Candy World 17, Bubble World 18 (the floatiest), Ocean World 20, Cactus World 21, Mushroom World 23 (big mushrooms bounce him high), Thunder World 24 (lightning far off), Robot World 26, Star World 28. Launch goes to the nearest new planet the rocket can reach, otherwise the furthest one he's been to. He can tap any planet in reach on the map to go there instead; a planet out of reach says "Build a stronger rocket to get there!" and shows the Power it needs.

**Gadgets, one per first visit, all worn at once:** Antenna (Moon), Big Wheels (Mars, jumps higher), Headlights (Frosty), Solar Wings (Ringo, glides), Jump Booster (Lava World, jumps again in the air), Crystal Magnet (Crystal World, pulls crystals in), Siren Lights (Jungle World), Rainbow Trail (Rainbow World), Confetti Cannon (Candy World, fires with each jump), Bubble Dome (Bubble World), Satellite Dish (Ocean World), Racing Stripes (Cactus World), Gold Wheels (Mushroom World), Turbo Jets (Thunder World, drives a third faster), Robot Arm (Robot World, reaches crystals a little further), Star Shield (Star World).

**The trip (`trip/`), on a 2D canvas, no 3D.** He drives whichever rover he picked, wearing what he switched on.
1. **Launch:** his rocket on the pad. He presses the big red button; "3, 2, 1, Blast off!" with a rumble, smoke and a shake.
2. **Flight (about 22 seconds):** the sky goes from blue to black. He steers by moving a finger anywhere on the screen (or the arrow keys). Three Bolts float down to catch; asteroids drift down to dodge. A bump only wobbles the rocket and knocks it aside. Nothing is lost and the rocket always arrives. The planet rises up and the rocket goes in to land.
3. **The planet:** side view. The rover rolls out past the rocket. He holds ◀ ▶ to drive and taps ⤴ to jump, with the planet's own gravity (the Moon's jumps are slow and floaty, ice is slippery, lava only bounces him up). Five crystals, some low and some up high for a jump. At the far end he stops on the flag spot and taps 🚩 to plant his flag.
4. **What he found:** "You explored Mars!" (or "Welcome back to Mars!"), the crystals, the Bolts, and the new gadget shown on his rover. Then the Space Base, or Launch again if he has another launch, or ▶ Play.

**Economy defaults, for the parent to confirm.**
- One launch per finished Round; one free launch to start. Launches don't expire.
- A trip pays at most 3 Bolts caught in space plus at most 5 crystals (1 Bolt each), so at most 8. A Round pays at most 6. So the reward roughly doubles a Round's Bolts. That's deliberate, so the trip is worth doing, but it may be too generous: `SPACE_BOLTS` and `CRYSTALS` in `base/base.ts` are where to change it.
- The launch is used, and the trip paid, only when the flag is planted. Leaving halfway (🏠 twice) costs nothing and pays nothing. A reload during a trip lands at the Base.
- Revisiting a planet pays the same Bolts but gives no gadget.
- Mars needs one upgrade (8 to 12 Bolts, about two Rounds), so the first new planet comes quickly; the last needs every top part.
- **Doubled on 2026-11-14.** He had bought every part and been to every planet within a day, so the reward was doubled: Rungs 4 to 6 in every slot, seven more paints, eight more planets and eight more gadgets. Payouts were left as they were, so the new half takes him roughly two and a half times as long as the first. A save that had everything keeps it; the Goal moves to Drill Nose.
- No Legendary or vault in this game (Math Bots' Balance Lock and the others are not copied). Could be added later.

**Rovers and gadgets (added 2026-11-14, `base/rovers.ts`).** The parent asked for "different kinds of rovers" and a way "to equip them with various features". Two more tabs at the Space Base, 🚙 Rover and 🧰 Gadgets, after Paint. On those tabs the pad shows his rover big with the rocket small behind it.

| Rover | Bolts | Trick (said when tapped) |
|---|---|---|
| Scout Rover | free | none: the all-rounder he had |
| Dune Buggy | 20 | "It goes extra fast!": top speed ×1.3 |
| Monster Truck | 40 | "It jumps extra high!": jump height ×1.45 |
| Tank Crawler | 60 | "It never slips on ice!": a little slower |
| Spider Walker | 80 | "It can jump in the air!": one mid-air jump (two with the Jump Booster) |
| Hover Rover | 100 | "It floats!": a bit faster, never slips, lava can't bounce it, comes down slowly |

- **One rover at a time.** Tapping a rover he owns drives it (with a honk). Tapping one he hasn't got parks it on the pad to try, with Buy, like a part. Buying it drives it.
- **Gadgets are switched on and off per rover.** The Gadgets tab lists every gadget: the ones he has first (✓ on, "Off" off; a tap flips it and says "On!" or "Off!"), then the Kit to buy, then the planets' gadgets he hasn't found yet (faded, with the planet's globe; a tap says "Explore a new planet to find it!"). Each rover keeps its own set. A gadget is on unless he switched it off on that rover, so a new one goes on every rover, and a save from before this keeps everything on the Scout.
- **No limit on how many a rover wears.** He had sixteen on at once and liked it; a slot limit would have taken things away. The choice is in switching off what he doesn't want (Solar Wings' glide, say).
- **The Kit, bought with Bolts:** Spoiler 10, Flame Decals 15, Snow Plow 25 (never slips on ice), Bubble Blower 35 (bubbles as he drives), Parachute 45 (opens as he falls and holds the fall to a float), Disco Ball 55 (turns on the camera, throwing sparkles), Fireworks 70 (five bursts over the flag when he plants it, with pops; the end card waits for them), Alien Pal 85 (an alien rides along in the window).
- **Every gadget fits every rover.** Each rover is drawn from a frame (body, roof, cab, mast, window), and the gadgets hang off the frame, so the Turbo Jets sit on any rover's back and the Alien Pal looks out of any rover's window. With everything on it's busy, as the Scout was.
- **The Goal** is still the cheapest part that adds Power first; once the rocket is done it is the cheapest rover or Kit gadget (the Spoiler).
- **Content added:** 300 Bolts of rovers and 340 of Kit, all at or under 100. 59 new clips (the names, the tricks, the bare gadget names, "Rover", "Gadgets", "On!", "Off!").
- Checked with `tools/rover-code/garage-tour.ts` (buys the Monster Truck, switches the Antenna off, tries the Spoiler, taps an unfound gadget, drives to the flag with Fireworks) at all four sizes, and `tools/rover-code/rovers-sheet.ts` (every rover plain, with everything, and with the Parachute open).

**Controls stay off the edges**, as Math Bots' fight learned: the bottom band and the sides belong to iPadOS, so ◀ ▶, ⤴ and the big buttons sit above a floor of at least 56px and away from the sides.

## Look

The family look in deep-space navy and violet: Bungee titles, Nunito for reading, 4px black outlines, solid drop shadows that press in. Question screens are a plain light card with the grid on it. The grid is a top-down rover on purple tiles. The rocket, rover and planets are drawn in code (`art/draw.ts`) and shared by the Base, the flight and the drive, so the rocket he built is the one that flies. Icon: his starter rocket blasting off over a little planet with the rover and a ➡ step. Pattern pieces are emoji (⭐ 🌙 🪐 🚀 👽 ☀️) and drawn arrows.

## Voice

Aria at -8%, recorded with `tools/make_voice.py --collection rover-code` (edge-tts), 301 clips in `public/rover-code-voice/`, trimmed as they decode and chained like Math Bots' ("It costs", "12", "Bolts."). Answer buttons are never read out (Math Bots' rule); every question, lesson, purchase and trip line is. All phrases are recorded; none is pending.

## Sounds

Made in code (shared `src/audio/sfx.ts`, plus `trip/sounds.ts`), no files. Puzzles: a clink per tap, a tick per square driven, a thud at a rock, the shared right and wrong sounds. The trip has two sounds that run the whole time: the rocket's roar through the flight (louder and deeper with each Engine Rung, building through the countdown and easing off to land) and the rover's motor on the planet, which revs with his speed. Also countdown beeps, ignition, a clunk off an asteroid, touchdown, a bump when the rover lands, a lava sizzle, a Jump Booster puff, and the siren when the rover rolls out with Siren Lights. Tapping an engine at the Space Base plays a burst of its roar.

## Save

`rover-code-save`, version 1 (the rover he drives, `rover`, and what's switched off on each, `off`, were added without a version change: a save without them reads as the Scout with everything on) (a version it doesn't know reads as a blank save, like the other games), and `rover-code-place` for the screen and the Round in progress.

## Open questions for the parent

1. Is one launch per Round right, or should a trip need a few Rounds' worth of fuel?
2. Should trips pay Bolts at all, or only crystals for show? (See the economy note above.)
3. Are absolute arrows right, or does he already know "turn left/right" from school coding (Bee-Bot, ScratchJr)? A relative-turn kind could be a fifth kind later.
4. Should Patterns use colours and shapes rather than emoji (emoji look different on other devices)?
5. Is the 16-of-20 Mastery rule too slow for kinds this short? Math Bots uses the same.

## Not done

- Not run on a real iPad 9 or iPhone. Checked in Chromium at 810×1080, 1080×810, 390×844 and 844×390 (`tools/rover-code/tour.ts`), not in WebKit.
- No Trophies, no Legendaries, no tracking of strong and weak facts (there are no facts here).
