# Spec: Treasure Fleet (maps and directions, a pirate ship and a treasure hoard)

Status: built on 2026-11-14 from `brief.md`, playable at `/treasure-fleet/` with a tile on the landing page. Every decision below is a **default for the parent to confirm**. Not yet run on a real iPad.

A new learning game on the family site, built the same way as Rover Code (`src/rover-code/`, `.scratch/rover-code/spec.md`), for the same player (6 to 7, reads numbers and short words, leans on the recorded voice, alone on an iPad 9). Short mixed Rounds earn Bolts, spent on ship parts. Each Round also earns a Voyage: he sails his ship himself, walks his pirate along an island beach and digs up its treasure for his Hoard.

It is kept apart from Rover Code on purpose: there is no program bar, no Go button and no step-by-step run. Every question is about **reading a map and saying where things are**, answered with one tap.

## Kinds

Five kinds, three Levels each, with Stretch inside a Level (more things on the map, longer clues). Everything is a tap on the map, the map key, or one of a few choices. North is always up. Left and right are the screen's.

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **Where Is It** `where`: tap the thing | start | "What is left of / right of / above / below the palm tree?" No compass. | "What is north / south / east / west of the hut?", the rose shown with the asked point lit | Four in ten: a compass question with the rose shown but not lit. Three in ten: "What is between the hut and the cave?" Three in ten: "What is furthest north?" |
| **Map Key** `key`: a map with its key | start | "Tap the symbol for a bridge." (the key rows are the answers) | "Tap the bridge on the map." (exactly one of that kind on the map) | Half "How many huts are there?" (three numbers), half "What is east of the river?" |
| **Grid Square** `grid`: letters along the bottom, numbers up the side | Where Is It L2 | 3×3, "Tap B2" | 5×5, "Tap D4" | "Which square is the cave in?", three squares to pick from |
| **Follow the Clues** `clue`: spoken directions from a ⭐; tap where the treasure is | Where Is It L2 and Map Key L2 | One clue, 1 to 2 squares (4 at full Stretch) | Two clues | Three clues, one of them a landmark ("Go east to the hut"), never the last |
| **From Above** `above`: a beach seen from the side; pick the map that shows it from above | Map Key L2 | 2 maps, the other with different things in another order | 3 maps: one in another order, one with a thing swapped | 3 maps with the same things where only one has moved (so the left-to-right order changes) |

**The rules the tests enforce** (`map/problems.test.ts`, every kind × Level × Stretch × 80 seeds):

- **Exactly one thing answers.** Each map is generated around its question. A thing a question names is the only one of its kind on the map. On Where Is It maps every thing is a different kind.
- **No diagonals.** For left/right/above/below and the compass the answer is in the same row or column as the thing named, *and* it is the only thing anywhere on that side, so the loose reading ("north = anywhere higher up") and the strict one give the same answer. "Between" has nothing else anywhere between the two. "Furthest north" has one thing at least a square nearer the edge than everything else.
- **Grid labels never vary.** Letters A to E along the bottom from the left, numbers 1 up from the bottom, said letter first ("Tap", "B.", "2"). Each letter has its own colour, used again wherever a square is written.
- **No rhyming rivals.** In "Which square is the cave in?" the three choices never use two different letters from B, C, D, E: the other choices share the right letter or use A.
- **Follow the Clues** always ends on a square that is on the map and holds nothing; every clue turns (never back the way it came); nothing stands on the way except the landmark it walks to, and that landmark is the first thing in that direction.
- **From Above** has exactly one map whose things go left to right as the scene does.
- **Map Key** lists every kind on the map, in one fixed order.

**Unlock order.** Where Is It and Map Key open at the start. Grid Square opens at Where Is It Level 2, From Above at Map Key Level 2, Follow the Clues once both reach Level 2.

**Mastery (as Math Bots and Rover Code).** 16 of the last 20 right on the first try, or the last 10 in a row; the first 30 questions of a kind asked at his Level use the quick rule (8 of 10, or 6 in a row). Levels never go down. A star at Level 3.

**No Tune-Up** (a change from Math Bots and Rover Code). A Level 2 probe of Where Is It would put the compass into his first Rounds, and the brief wants those to stay on left, right, above and below. The quick Mastery rule places him instead: six in a row and he's up a Level.

**Rounds.** Five answers, mixed across every open kind, never the same kind twice running while there's another. About one in three, and always the one right after a miss, is easier and doesn't count. A starred kind comes back about once a Round. A miss comes back later as a new map of the same kind and Level, with no Mastery credit. Bolts: one per answer right on the first try, plus one for finishing (shared `boltsFor`). A Round resumes after a reload (shared `place`).

**Meetings**, once each, before the first question that needs them:

- **Compass rose** (before the first question with a rose, or the first Follow the Clues): "This is a compass rose. It shows the way on a map." Each point lights as it's said ("North is up. East is this way. South is down. West is this way."), then the rhyme "Never Eat Soggy Waffles!" while the points light round in order, then "Tap north!" A wrong point says its own line and asks again. **The rhyme's wording is a default for the parent.**
- **Map key** (before the first Map Key question): a small map and its key; each key row lights with the same symbols on the map while its name is said; ▶ goes on.
- **Grid squares** (before the first Grid Square): "Letters go along the bottom. Numbers go up the side. Say the letter first." Column B lights ("B."), row 2 lights ("2"), the square where they meet glows; he taps it.

## Teaching a miss

Never a red X: the thing he tapped just fades a little, and the lesson runs on the map itself. The first miss shows the idea; the second (or the first, when he's been missing a lot) goes on to the answer and leaves it there. 🔎 runs the fuller lesson on demand and counts as help.

- **Where Is It:** with a rose, it grows and the asked point lights and is said ("North is up."); without one the direction is said ("Left is this way."). An orange arrow sweeps from the thing named in that direction to the map's edge. Second miss: the arrow stops at the answer, which glows, "It is the hut." "Between" draws a band joining the two things ("Look between them."); "furthest" lights the rose ("Look for the one nearest the edge.").
- **Map Key:** the symbol he tapped pulses in the key together with every matching symbol on the map ("That one means a hut."), then "Look at the map key." Second miss: the asked symbol and its map symbols pulse together ("This one means a bridge." "Here it is!"). Counting: they pulse ("Count them!"), and on the second miss each is counted aloud with a number badge ("1, 2, 3. So there are 3"). River: the river and its key row light, the rose shows the side ("East is this way." "Look across the river.").
- **Grid Square:** the column lights and its letter is said, then the row and its number. On the first miss the lights go off again after; on the second the square where they cross glows ("Here they meet."). For "which square", the thing glows first ("Look down to the letter… Look across to the number… So it is B 3").
- **Follow the Clues:** "Let's follow the clues." A dotted line is drawn square by square from the star, each clue said again as its stretch is drawn and its direction lit on the rose. First miss: the line fades after. Second: the end square glows, "The treasure is here!"
- **From Above:** each thing in the scene lights left to right as it's named ("Hut. Cave. Hill."), then "Look at the order." Second miss: the right map glows, "This map shows it from above."

## The reward: the Ship, the Voyage and the Hoard

**The loop.** A finished Round earns Bolts and one Voyage (⛵). Bolts buy ship parts. Parts add Range. Range reaches islands further out. Each island's treasure goes in his Hoard the first time he digs there. He starts with one free Voyage, to Turtle Island.

**The Ship (`fleet/parts.ts`).** Four slots, each with a free starter and six upgrades, plus a Flag:

| Slot | Starter | Rungs 1 to 3 (Bolts) | Rungs 4 to 6 (Bolts), added 2026-11-14 |
|---|---|---|---|
| Hull | Rowing Boat | Sloop 10, Brig 28, Galleon 60 | Frigate 65 (blue), Battleship 80 (two rows of guns), Ghost Ship 95 (glows) |
| Sails | Bedsheet Sail | Patched Sails 8, Square Sails 25, Royal Sails 55 | Striped Sails 60, Rainbow Sails 75, Dragon Wings 90 |
| Cannons | Little Cannon | Twin Cannons 8, Big Cannons 25, Golden Cannons 55 | Silver Cannons 60, Fire Cannons 75, Thunder Cannons 90 |
| Figurehead | Plain Bow | Seagull 8, Mermaid 22, Sea Serpent 50 | Great Shark 60, Unicorn 75, Phoenix 90 |
| Flag | Skull Flag | Shark Flag 4, Dragon Flag 6 | Anchor 8, Sword 10, Octopus 12, Star 14, Crown 16, Parrot Flag 18 |

Colours (black, red, blue, green, purple, gold) are free.

The hull sets the size and the masts (a rowing boat with one stick, a sloop, a two-masted brig, a three-masted galleon); sails dress each mast; cannons show at the side and fire more shots at sea (1, 2, 2, 3, 3, 4, 5); the figurehead rides the bow. Range is the sum of the four slots' upgrades plus one each (4 to 28). No price is over 100, the most the recorded numbers go. As in Rover Code, a part he hasn't got goes on the ship to try, with Buy beside it; one he can't afford becomes his Goal. Everything together costs 1,269 Bolts (354 for Rungs 1 to 3, 915 for Rungs 4 to 6), the flags 88.

**The islands (`fleet/islands.ts`).** Turtle Island (Range 4, the Golden Compass), Palm Island 5 (the Silver Spyglass), Parrot Island 7 (the Jade Parrot), Skull Rock 9 (the Ruby Skull), Mermaid Lagoon 11 (the Emerald Crown), Volcano Island 13 (the Dragon Egg), Kraken Reef 14 (the Kraken's Pearl), Starfall Island 16 (the Diamond Anchor), then (added 2026-11-14) Seashell Cove 17 (the Magic Conch), Iceberg Island 18 (the Crystal Sword), Banana Island 20 (the Golden Banana), Lighthouse Point 21 (the Lucky Lantern), Shipwreck Bay 23 (the Old Pirate Map), Thunder Isle 24 (the Storm Bell), Ghost Island 26 (the Silver Key), Rainbow Reef 28 (the Rainbow Diamond). Each has its own sand, sea and sky, and most of the new ones a landmark on the sea chart in place of a palm. Set Sail goes to the nearest island he hasn't dug on, if the ship can reach it, otherwise the furthest he's been.

**The sea chart.** The island picker in the Shipyard is itself a map: islands where they lie (further ones further from the port), north up, a compass rose and a key (⚓ port, island, ✕ treasure). The next stop is ringed and joined to the port by a dotted line; islands out of reach are grey with the Range they need ("Build a faster ship to get there!"). It is never a question and can't be got wrong.

**The Voyage (`voyage/`, 2D canvas, no 3D, no physics library).**

1. **At sea, from above.** He taps ⛵ to set sail. He steers by touching where he wants to go: the ship's bow turns toward his finger (it never jumps there, and never turns past a broad reach), and drifts back to north when he lets go. The water pushes it sideways a little. Three barrels float by (a Bolt each). Rocks only bump him aside. Three times a sea monster's tentacle rises; the 💥 cannon button fires and the shot always finds a tentacle that's up, which splashes away; one he ignores sinks again on its own, and sailing into it only wobbles the ship. About 25 seconds, then "Land ho!", the island comes into view and the ship sails in.
2. **The island, from the side.** His pirate (bandana in his flag's colour) steps off at the start of the beach. He holds anywhere on the sand to walk and taps ⤴ to jump. Three crabs pace the beach; walking into one only bumps him back a step, and it ducks into the sand for a moment so nothing can stop him. At the X, he taps ⛏️ three times; the chest rises and opens.
3. **What he found.** "You found the Golden Compass!" (or "Welcome back to Turtle Island! You found gold!"), the Bolts, then 💎 (the Hoard), his ship (the Shipyard), and ⛵ again if he has another Voyage, else ▶.

**The Hoard.** A cave with sixteen ledges (eight to a row on a wide screen). Each treasure he has found sits lit on its own ledge; the rest show the island that holds them ("Sail further to find this one!"). His ship is moored at the cave mouth. Nothing here can be lost.

**Economy defaults, for the parent to confirm.**

- One Voyage per finished Round; one free Voyage to start. Voyages don't expire.
- A Voyage pays at most 6 Bolts: up to 3 barrels plus 3 gold in every chest. A Round pays at most 6, so the reward roughly doubles a Round's Bolts, as Rover Code's does. `BARRELS` and `CHEST_GOLD` in `fleet/fleet.ts` are where to change it.
- Revisiting an island pays the same Bolts but no new treasure.
- The second island needs one upgrade (8 to 10 Bolts, about two Rounds); the last needs every top part.
- **More than doubled on 2026-11-14**, the day it was built, at the parent's request: Rungs 4 to 6 in every slot, six more flags and eight more islands and treasures (22 rewards to 48). Payouts were left as they were, as in Rover Code's doubling. A save that had everything keeps it; the Goal moves to the cheapest Rung 4 part. The sea chart was laid out again for sixteen islands, still roughly further out the more Range they need.
- The Voyage is used, and paid, only when the chest opens. Leaving halfway (🏠 twice) costs nothing and pays nothing. A reload during a Voyage lands at the Shipyard.

**Controls stay off the edges**, as Math Bots' fight learned: the cannon, jump and dig buttons sit at the right, above a floor of at least 56px and 28px in from the side; steering and walking are touches anywhere on the picture.

## Look

The family look in sea blue, parchment and brass: Bungee titles, Nunito for reading, 4px black outlines, solid drop shadows that press in. Question maps are parchment islands on a strip of sea, drawn in code from eight symbols (palm tree, hut, cave, hill, rock, dock, bridge, river) that are also the sea chart's. The ship is drawn in code (SVG from the side in the Shipyard, the end of a Round and the Hoard; canvas from above at sea and small from the side at anchor) from the parts he has fitted, so the ship he built is the one that sails. Treasures are emoji (🧭 🔭 🦜 💀 👑 🥚 🦪 ⚓ 🐚 🗡️ 🍌 🏮 🗺️ 🔔 🗝️ 💎) with a glow in the island's colour. Icon: a little ship under a skull flag sailing toward a red X on a torn scrap of map.

## Voice

Aria at -8%, recorded with `tools/make_voice.py --collection treasure-fleet` (edge-tts): 513 clips in `public/treasure-fleet-voice/`, trimmed as they decode. Questions are whole sentences where there are few enough of them (all 48 "What is left of the palm tree?" lines, the 15 "between" pairs said in one fixed order, and so on), so they sound natural. Directions, clues and grid squares are chained from pieces: "Go", "north", "2", "squares."; "Then go", "east", "to the hut."; "Tap", "B.", "2". Letter names are recorded as the capital and a full stop, Sight Squad's trick, and come out as the very same clips Sight Squad already uses. Answer buttons are never read out (Math Bots' rule).

## Save

`treasure-fleet-save`, version 1 (a version it doesn't know reads as a blank save, like the other games), and `treasure-fleet-place` for the screen and the Round in progress.

## Open questions for the parent

1. Is "Never Eat Soggy Waffles" the rhyme he'll hear at school, or does his class use another (for example "Naughty Elephants Squirt Water")?
2. Grid Square Level 1 is a 3×3 grid lettered A, B, C, and B and C rhyme, so the brief's "no rhyming rivals at Level 1" can't hold for a tap on the grid. Each letter has its own colour (B blue, C green) and the asked square is written in that colour, so he can match by eye as well as by ear. The rule is enforced in full for Level 3's three choices. Is that enough, or should Level 1 use non-rhyming letters (which would break "letters in order")?
3. Should the Voyage pay Bolts at all, or only the treasure for show? (See the economy note.)
4. Should flag colours stay free, or cost a little like Rover Code's paints?
5. Is the 16-of-20 Mastery rule too slow for kinds this short? Math Bots and Rover Code use the same.
6. Is "Range" a word he'll follow? It is shown as 💨 with a number and said aloud; "speed" might be friendlier.

## Not done

- Not run on a real iPad 9 or iPhone, or in Safari. Checked in Chromium at 810×1080, 1080×810, 390×844 and 844×390 (`tools/treasure-fleet/tour.ts`), on a new save and on saves with every kind open at Level 2 and at Level 3, and offline on the production build (`tools/treasure-fleet/offline.ts`). Not in WebKit.
- The voice clips were recorded but not listened to: there was no way to play audio here. The letter and number clips are byte-for-byte the clips Sight Squad and Math Bots already use; the rest (especially the short single words "Hut.", "Rock.", "Dock.", "Hill." and the chained "Go"/"north"/"2"/"squares.") need a listen.
- No Trophies, no Legendaries or vault, no per-fact strength tracking (Sight Squad's): there are no facts to track here.
- From Above's lesson lights the scene but not the matching symbol on each small map.
- Follow the Clues lights every clue chip with the same direction at once while the line is walked.
