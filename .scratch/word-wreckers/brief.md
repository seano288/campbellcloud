# Brief: Word Wreckers (spelling, a yard of construction machines)

Status: ready-for-agent

Read `.scratch/new-games/build-guide.md` first. It covers the player, the shared engine, wiring, voice, verification and the final report. This brief covers only what is particular to Word Wreckers. Slug: `word-wreckers`.

## Why this game

Spelling by sound: he hears a word and builds it. This is the other half of phonics (encoding; Common Core L.1.2d and L.1.2e, RF.1.2). Sight Squad's Build It shows him a sight word to copy and remember. Here the word is never shown; he works it out from its sounds.

## What he learns

The same Pattern order as Dino Dig: short-vowel CVC, digraphs, blends, magic e, vowel teams, r-controlled vowels. Patterns are met before they are asked and each keeps a strength, as in Sight Squad's word sets.

**Word list.** If `src/dino-dig/words/` exists, use it read-only and do not fork it. If it does not, create the list there anyway (about 150 to 200 phonetically regular words tagged by Pattern, no game code in the folder) so Dino Dig can share it later. Read `.scratch/dino-dig/brief.md` for the list's rules.

## Kinds

Defaults; refine and record in the spec.

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **Build It** `build`: hear a word (with its picture if it has one); tap letter tiles into the slots | start | exactly the tiles needed | one or two spare tiles | spare tiles that look or sound alike (*b/d, c/k, e/i*) |
| **Missing Sound** `gap`: the word with one slot empty (*c_t*); pick the tile | start | the first sound | the last sound | the middle vowel |
| **Chunks** `chunk`: build a word from sound chunks (*sh, ck, ee, a_e*) rather than single letters | Build It L2 | 2 chunks | 3 chunks, one spare | spare chunks for the same sound (*ai / ay / a_e*) |
| **Fix It** `fix`: a word spelled wrong, heard right ("*kat*", hear *cat*); tap the wrong tile, then pick the right one | Missing Sound L2 | the wrong tile is marked | he finds it | the mistake is a missing or extra letter |
| **Which Looks Right** `pick`: hear a word; tap the right spelling of three (*rane / rain / rayn*) | Chunks L2 | 2 choices | 3 choices | 3 choices in a short phrase |

Rules the tests must enforce:

- A word is right only when spelled the conventional way. Where a sound has several spellings (*ai / ay / a_e*), the question only appears once that Pattern is met, and the wrong choices must not be real words.
- Tiles are lowercase Andika. Tiles for *b, d, p, q* are never rotatable or mirrored.
- Words that sound the same but are spelled differently (*sea / see*) are left out unless the picture or phrase makes the one meant unmistakable.
- A word he hears can be heard again any number of times by tapping the speaker, with no penalty.

## Teaching a miss

- Sound boxes: one box per sound. The word is spoken slowly, each box lights in turn, and the right tile drops into it. His wrong tile wobbles and slides back to the rack.
- In Chunks, the chunk is shown as one tile so he sees that two letters make one sound.
- A second miss builds the whole word for him, box by box, then clears it so he can build it himself.

## Voice

Read the voice section of the Dino Dig brief; the same limit applies. edge-tts will not reliably say a lone sound, and it cannot say a misspelling as spelled. So Fix It never "reads" the wrong word aloud; it speaks the intended word and shows the wrong spelling. Record every list word alone with Aria and listen to a sample; fix mangled ones in `SAID_AS`. If Dino Dig has already recorded the list words, check whether the clips can be shared before recording them twice, and say what you did.

## The reward: the Yard and the Town

- **The loop.** A finished Round earns Bolts and one Job. A Job is a demolition followed by a build. Each finished Job adds a building to his Town. Bolts buy machines and upgrades, which open bigger Jobs.
- **Demolition (action, 2D canvas, side view).** An old building made of chunky bricks. He drives a machine at it: pull back and release the wrecking ball, push with the bulldozer, bite with the excavator's bucket. Bricks tumble with simple hand-rolled falling (no physics library; cap the brick count for the iPad 9). The Job is done when the lot is clear. It cannot go wrong.
- **Build.** A crane lowers the new building's pieces; he moves the crane with his finger and taps to drop each one. Pieces snap into place, so a sloppy drop still lands. He picks which of two or three buildings goes up (fire station, tower, bridge, stadium, rocket pad).
- **The Yard.** His machines, parked: wrecking-ball crane (the free starter), bulldozer, excavator, dump truck, tower crane, giant excavator. Each has two or three upgrades (bigger ball, stronger blade) and paint colours. Stronger machines are needed for brick, then concrete, then steel buildings.
- **The Town (show off).** A street that grows a lot at a time with everything he has built. He can drive any machine along it and honk.

Economy defaults for the parent to confirm: one Job per Round, one free Job to start; machines cost roughly 15, 30, 50, 80 and 120 Bolts; about 20 buildings before the Town is full.

## Look

Hi-vis yellow, asphalt grey and hazard stripes. Machines and buildings are drawn in code and shared by the Yard, the Job and the Town. Icon: a wrecking ball swinging into a wall of letter tiles.

## Risks

- Overlap with Dino Dig. The two share a word list and a Pattern order on purpose, but every screen here is about producing a spelling, never recognising one. If both are being built at once, do not edit `src/dino-dig/`.
- Falling bricks are the performance risk. Measure on a throttled CPU and cap pieces.
- Spelling has more than one defensible answer more often than you would expect. The curated list and its tests matter more than the generator.
