# Brief: Treasure Fleet (maps and directions, a pirate ship and a treasure hoard)

Status: ready-for-agent

Read `.scratch/new-games/build-guide.md` first. It covers the player, the shared engine, wiring, voice, verification and the final report. This brief covers only what is particular to Treasure Fleet. Slug: `treasure-fleet`.

## Why this game

First-grade social studies asks him to read a simple map: where things are, the four directions, what the symbols mean, and how to name a square on a grid. Nothing on the site teaches it.

**Keep it apart from Rover Code.** Rover Code is about writing a program of arrows. Treasure Fleet is about reading a map and saying where things are. No program bar, no Go button, no step-by-step run. If a screen starts to look like Rover Code's grid, it is the wrong screen.

## What he learns

- Position words: *left, right, above, below, next to, between*
- The four directions and the compass rose: *north, south, east, west* (north is always up on these maps)
- The map key: a symbol stands for a real thing
- Grid squares: a letter and a number name a square (*B3*)
- Following spoken directions across a map

## Kinds

Defaults; refine and record in the spec.

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **Where Is It** `where`: a small island map; a spoken question; tap the thing | start | *left / right / above / below* ("What is left of the palm tree?") | *north / south / east / west*, the compass rose shown and lit | the rose shown but not lit; "between" and "furthest north" |
| **Map Key** `key`: a map with a key | start | tap the symbol that means *bridge* | "Tap a bridge on the map" | "How many huts are there?" / "What is east of the river?" using the key |
| **Grid Square** `grid`: a lettered and numbered grid over the map | Where Is It L2 | 3×3, "Tap B2" | 5×5, "Tap D4" | "Which square is the cave in?" with three choices |
| **Follow the Clues** `clue`: spoken treasure directions from a start mark; tap where the treasure is | Where Is It L2 and Map Key L2 | one clue ("Go north 2 squares") | two clues | three clues, one of them a landmark ("Go east to the river") |
| **From Above** `above`: a little scene from the side; pick the map that shows it from above | Map Key L2 | 2 maps, very different | 3 maps | 3 maps that differ in one thing's position |

Rules the tests must enforce:

- Exactly one thing on the map answers the question. If two palm trees are on the map, the question never says "the palm tree".
- Compass questions never depend on a diagonal. "North of the hut" means in the same column and above, or the map is laid out so only one thing is anywhere north.
- Grid labels: letters along the bottom, numbers up the side, said letter first. Pick this once and never vary it.
- Follow the Clues always ends on a square that exists and holds nothing else.
- Left and right are the screen's left and right, never a character's.

## Teaching a miss

- **Where Is It:** the compass rose grows, the direction asked for lights and is spoken ("North is up."), and an arrow sweeps from the named thing in that direction to the answer.
- **Map Key:** the symbol in the key and every matching symbol on the map pulse together.
- **Grid Square:** the column lights and its letter is spoken, then the row and its number, and the square where they cross glows.
- **Follow the Clues:** a dotted line is drawn one clue at a time from the start, each clue spoken again as its stretch is drawn.
- Teach the directions once, at the first compass question, with a rhyme for the order round the rose (the usual one is "Never Eat Soggy Waffles"). Mark the wording as a default for the parent.

## Voice

Aria at -8%. Directions and grid squares are chained clips, as numbers are in Math Bots: "Go", "north", "2", "squares." Letter names are recorded as the capital and a full stop ("B."), the trick Sight Squad uses, because spelled-out names misfire. Listen to "B", "D", "E" and "C" side by side; they are the ones a child confuses, and Grid Square should avoid offering two rhyming letters as rival answers at Level 1.

## The reward: the Ship, the Voyage and the Hoard

- **The loop.** A finished Round earns Bolts and one Voyage. Bolts buy ship parts. Better parts give the ship Range. Range reaches islands further out. Each island's treasure goes in his Hoard.
- **The Ship.** Four slots with a free starter and three upgrades each: hull, sails, cannons, figurehead. Plus flags he chooses (skull, shark, dragon, his own colours). It starts as a rowing boat with a bedsheet sail and ends as a galleon.
- **The Voyage (action, 2D canvas, top-down).** He steers by touching where he wants to go; the ship turns toward his finger. Barrels float by to pick up (each is a Bolt, capped). Rocks only bump him aside. A sea monster's tentacles rise now and then; tapping the cannon button fires and they splash away. About 25 seconds, then the island comes into view.
- **The Island (action, side view).** He walks his pirate along the beach (hold to walk, tap to jump over crabs), reaches the X, and taps to dig. The chest opens on one named treasure (the Golden Compass, the Ruby Skull, the Kraken's Pearl).
- **The Hoard (show off).** A cave where every treasure sits where he can see it, with the ship moored outside. Eight islands, eight treasures; revisiting an island pays Bolts but no new treasure.
- **The sea chart.** The island picker is itself a map with a compass rose and a key, so the reward quietly uses what he has just learned. It is never a question and cannot be got wrong.

Economy defaults for the parent to confirm: one Voyage per Round, one free Voyage to start; a Voyage pays at most 6 Bolts; ship parts cost roughly 8, 25 and 55 by step; the second island needs one upgrade.

This loop has the same outline as Rover Code's trip (travel, then land and walk). That is fine, but it must feel different in the hand: top-down steering toward a finger, a cannon, water that pushes the ship. Do not import from `src/rover-code/`.

## Look

Parchment maps, sea blue and brass. Question maps are drawn in code from a small set of symbols (palm tree, hut, cave, bridge, river, hill, rock, dock), which are also the symbols of the sea chart. Icon: a ship under a skull flag sailing toward an X on a scrap of map.

## Risks

- Ambiguity. "Left of the palm tree" has more than one answer the moment a map is generated carelessly. Generate maps to fit the question, and test every generated question for a single answer.
- Cardinal directions are abstract at six. The first Rounds stay on left, right, above and below, and the compass arrives through the meeting.
- Keep any fighting to splashes. No ships sink and nobody is hurt.
