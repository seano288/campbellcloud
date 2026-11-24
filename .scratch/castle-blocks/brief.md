# Brief: Castle Blocks (second-grade shapes and solids; build a castle and fire its catapult)

Status: ready-for-agent

Read `.scratch/new-games/build-guide.md` first. It covers the player, the shared engine, wiring, currency, voice, verification and the final report. This brief covers only what is particular to Castle Blocks. Slug: `castle-blocks`. The name is a working name for the parent to confirm.

## Why this game

Math Bots' Shapes is first-grade geometry: the common shapes, their sides, and filling an outline. Second grade asks for more. He should know a shape by how many sides and corners it has, however it is turned or stretched; name a pentagon and a hexagon; know a cube by its faces; and draw a shape to order (Common Core 2.G.A.1, building on 1.G.A.1 and 1.G.A.2). Skyline covers 2.G.A.2 (rows and columns of squares) and Chop Chop covers 2.G.A.3 (halves, thirds and fourths), so neither is repeated here.

A castle is made of solids he can name: cube walls, cylinder towers, cone roofs and a pyramid on the keep.

## What he learns

Start the research from 2.G.A.1, 1.G.A.1 and 1.G.A.2 and the matching TEKS Grade 2 geometry strand (which asks for faces, edges and corners of solids), and confirm the exact standard numbers there rather than from memory. Read Math Bots' Shapes in the code first, so Level 1 here begins where its Level 3 ends, and its Outline is not repeated.

**Mirror is past second grade.** Lines of symmetry sit in fourth grade in Common Core. The kind is here because young children take to it and a castle is full of it. Mark it in the spec as extra, for the parent to confirm, and check where TEKS puts it.

## Kinds

Defaults; refine them if the research says otherwise, and record what you chose in the spec.

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **Sides and Corners** `sides`: knowing a shape by counting | start | how many sides: shapes with 3, 4, 5 and 6, drawn plainly | which is the pentagon, and the hexagon, when they are thin, tilted or lopsided | "Tap every shape with four sides," among eight |
| **Solids** `solid`: cube, box, cylinder, cone, sphere, pyramid | start | tap the one that is named; find it in a picture of a castle | which rolls, which stacks, which does both | how many faces on a cube; what shape is the end of a cylinder |
| **Square Corners** `corner`: sorting shapes by what they have | Sides and Corners L2 | tap the square corner on this shape | which shape has four square corners | which shape has all its sides the same length; which does not belong |
| **Build It** `compose`: putting shapes together | Solids L2 | which two of these make that shape (two triangles make a square) | how many triangles fill the hexagon | which bigger shape can these three pieces not make |
| **Draw It** `draw`: making a shape on a board of dots | Sides and Corners L2 | join the dots to finish a triangle | "Make a shape with five corners." | "Make a shape with four sides and four square corners." |
| **Mirror** `mirror`: the same on both sides | Square Corners L2 | does this shield match on both sides of the line | pick the missing half | tap the line that folds it in half |

Rules the tests must enforce:

- **A shape is known by its sides, not its looks.** From Level 2, at least half the triangles are not sitting on a flat base, and at least half the four-sided shapes are not squares or upright rectangles. Wrong choices include shapes that only look right: an open shape, one with a curved side, a triangle with a corner cut off.
- "Not a shape with four sides" is never a trick about squares being rectangles. That question belongs to third grade and is left out.
- Draw It checks the drawing by its geometry: the number of corners, whether it is closed, whether any sides cross, and for Level 3 whether the corners are square. Any drawing that meets the question is right, wherever it is on the board and whatever its size.
- Solids are drawn so that each can be told apart at 44px, with shading that shows the curved ones as curved.
- Build It pieces need no turning by him. A piece turns itself, as Math Bots' Outline does.
- Counting questions never go past 8 sides or faces.

## Teaching a miss

- **Sides and Corners:** a dot walks round the shape, and each side lights and is counted as it passes. "Five sides. Five sides makes a pentagon."
- **Solids:** the solid turns slowly, and it is rolled or stacked to show what it does. For faces, each one lights and is counted.
- **Square Corners:** a square tile slides into each corner, and it fits or it does not.
- **Build It:** the pieces slide together into the shape.
- **Draw It:** the game draws one right answer on the dots, one side at a time, counting corners.
- **Mirror:** the shape folds along the line, and the halves meet or do not.

A second miss gets the fuller lesson: he traces the shape himself with a finger while the voice counts with him.

## Currency: Crowns

The castle belongs to a king, and the king's mark is a crown. He earns Crowns and spends them at the mason's yard on blocks, towers and flags.

- One Crown, many Crowns. Add `CROWN` to `src/currency/kind.ts`.
- The icon is a small gold crown with three points and a red jewel, seen from the front. It is the same on both sides, which Mirror can point out.
- When a Round ends, a herald unrolls a scroll and the Crowns are stamped onto the pile one by one, each with a short trumpet note.
- A crown is the name of an old coin, but here it is the king's mark and nothing more. It is never drawn as a coin, never given a value and never counted as money.

## Voice

Every question is spoken. Shape names are written as well as said, since reading "hexagon" is part of knowing it. New clips: the kind names, the shape and solid names, the castle's pieces and the counting lines. The currency lines are recorded with "Crowns" (see the build guide's "Currency").

## The reward: the Castle, the Catapult and the Tournament

He builds a castle from solids and tests its catapult on practice towers. Flat 2D, from the side.

- **The loop.** A finished Round earns Crowns and one Volley. Crowns buy blocks and castle pieces. Knocking down a tower he has not beaten opens the next.
- **The Castle.** He builds on a grid: cube and box blocks for walls, cylinders for towers, cones and pyramids for roofs, arches for gates, and then the pieces that make it a castle: a drawbridge, a moat, battlements, a keep, a great hall, stables, a well, a market and flags. Blocks snap to the grid and nothing falls down. He can move any piece at any time.
- **The Volley (action, 2D canvas, from the side, about 45 seconds).** His catapult faces a practice tower built of blocks in a field. He pulls the arm back with a finger and lets go, and a dotted line shows where the stone will fly. Blocks tumble when they are hit. He has as many stones as he needs.
- **It cannot be failed.** A miss thuds into the grass and he pulls again. After a few misses the dotted line grows longer. Nobody is in the tower, and nothing ever attacks his castle.
- **Catapults.** A small one to start, then a trebuchet, a ballista and a cannon, each with a different arc. Stones come in kinds: a round stone, a bundle that splits in three, a heavy one that drops straight.
- **Life in the castle.** Knights, horses, a jester, a cook and a king or queen walk about. A shield over the gate carries a coat of arms he designs.
- **Show off.** "Visit the castle": a walk along the walls from one end to the other, with the flags flying.

Plan for at least 250 named things to earn from the first build, as the fixed catalogue under the endless layer described below: about 60 blocks in several stones (grey, sandstone, white, mossy, ice), 50 castle pieces, 8 catapults with 30 parts and stones, 30 flags and banners, 30 shield parts, 24 people and animals, 24 towers to knock down, and trophies. Economy defaults for the parent to confirm: one Volley per Round, the first one free; the first new block within two Rounds; prices up to 100 in ones, then whole tens up to 400.

Use the glossary's words where they fit (Slot, Mod, Goal) and add the new ones (Crown, Block, Volley, Tower, Coat of Arms) to `GLOSSARY.md`.

## Never running out

The build guide's "Rewards that never run out" and "Competition" sections are requirements here. What follows is this game's own way of meeting them; refine it, but do not ship without an endless layer.

- **Towers made on the spot.** After the fixed towers, a new one is always on offer. Each is generated from its number: its height, its shape, its blocks, how far away it stands and the wind. The same number always gives the same tower, each is a little taller or farther, and a test checks that every one can be knocked down with a catapult he could own by then. Every fifth one hides a chest with a block that is never sold.
- **The castle has no last wall.** He can always buy more ground to build on and another block to put there. The price rises gently and then stays flat. Cap what is drawn at once, not what he owns.
- **Coats of arms made from parts.** A shield's shape, how it is divided, its two colours and its emblem are chosen separately, which gives thousands. Most are the same on both sides, and that is the game's own subject.
- **Fewest stones.** His best on each tower is a personal best, shown beside it.
- **Competition, if it is built:** a Tournament where rival lords take turns at the same tower, tuned by the guide's rules, so that he wins about two times in three and is never last.

## Look

A bright storybook castle: warm grey stone, red and blue banners, green hills and a clear sky. Solids are shaded so they look round or flat as they should. The dot board in Draw It looks like a mason's plan on parchment. Icon: a tower made of a cylinder and a cone, with a crown on a flag.

Keep it apart from Word Wreckers, where he wrecks buildings and rebuilds a town, and from Skyline, where the city is made of rows of squares. Here every piece is a named solid, and what gets knocked down is only ever a practice tower.

## Risks

- Tumbling blocks without a physics library is the hard part of the build. Blocks fall, slide and settle by simple hand-rolled rules; they need not be realistic, but the same shot must always give the same result, or the generated-tower test means nothing.
- Pulling back and letting go may be hard for small hands. Try it on the iPad 9 early. The fallback is two big buttons: one sets how far, the other fires.
- Draw It on a sideways phone needs a dot board big enough for a finger. Lay out the phone first.
- Solids drawn flat are hard to tell apart, and a cylinder seen from the side is a rectangle. Draw twenty and test them at a small size before settling the style.
- Mirror may not belong in a second-grade game. Say in the report what the research found.
