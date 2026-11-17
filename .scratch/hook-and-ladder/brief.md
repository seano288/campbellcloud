# Brief: Hook and Ladder (word meanings; build a fire engine and answer calls)

Status: ready-for-agent

Read `.scratch/new-games/build-guide.md` first. It covers the player, the shared engine, wiring, voice, verification and the final report. This brief covers only what is particular to Hook and Ladder. Slug: `hook-and-ladder`. The name is a working name for the parent to confirm.

## Why this game

The reading games teach him to recognise words (Sight Squad), spell them (Word Wreckers) and read sentences (Sentence Express). None of them teaches what words mean and how they are built: two words joined into one, opposites, words that belong together, and the endings that change a word. That is the vocabulary strand of first grade (Common Core L.1.4 and L.1.5, and the TEKS Grade 1 vocabulary strand). "Fire truck" is itself a compound word, which is why the theme fits.

## What he learns

Research the standards before fixing the kinds. Compound words and opposites sit in different grades in different standards; note where each one comes from. The skill is meaning, not decoding, so every word is both written and spoken.

## Kinds

Defaults; refine them if the research says otherwise, and record what you chose in the spec.

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **Two Words, One Word** `join`: compound words | start | "fire" and "truck" are shown and said; tap the picture of the word they make (2 pictures) | a compound is shown; tap where it splits | "rain" and what? Pick the second half that makes a real word (bow / dog / cup) |
| **Opposites** `opposite` | start | "Tap the opposite of hot", 2 pictures | 3 spoken words, no pictures | in a sentence: "The soup is not hot. It is..." |
| **Sort It** `sort`: words that belong together | Opposites L2 | "Tap all the animals" among six pictures, then ✓ | "Which one does not belong?" among four | "A dog, a cat and a cow are all..." three choices; then "Which animal can fly?" |
| **Endings** `ending`: -s, -ed, -ing | Two Words L2 | one or more than one: a picture of two dogs, pick "dog" or "dogs" | "Yesterday he..." pick "jump", "jumped" or "jumping" | "Which word is hiding in *jumping*?" three choices |
| **Strong Words** `strong`: words that mean nearly the same, some stronger | Sort It L2 | "Which is bigger, big or huge?" | "Which is the loudest: whisper, talk or shout?" | put three in order, weakest to strongest |

Build the content as tables in `src/hook-and-ladder/words/`, free of game code. Where a word is in the Dino Dig list (`src/dino-dig/words/`) or the Sight Squad list, prefer it, so most of what he sees he can also read.

Rules the tests must enforce:

- Exactly one choice is right, in every kind.
- Compounds are only ones whose meaning comes from their two halves (*fire truck, rainbow, football, bedroom*). Never *butterfly* or *ladybug*. Level 3's wrong halves must not make any real word (*rain* + *coat* is also real, so it is never offered beside *bow*).
- Opposites have one clear opposite. A wrong choice is never a second fair answer (*cold* and *cool* are not offered together).
- Sort It uses only things that belong to one group. No tomato, no bat, no penguin in "can fly".
- Endings uses regular words only. No *ran, mice, feet*. Words that change their spelling (*hop, hopping*; *bake, baked*) appear only at Level 3, or not at all if the research says so.
- Strong Words sets come from a short, hand-checked table. This is the hardest content to get right; the parent should read every set before it ships.
- Pictures are emoji, used only where the emoji is unmistakable, as in the Dino Dig brief.

## Teaching a miss

- **Two Words, One Word:** the two pictures slide together and become the compound's picture while the three words are said: "fire. truck. fire truck."
- **Opposites:** both pictures are shown side by side with the two words said one after the other.
- **Sort It:** the things that belong move into one box, and the group is named: "These are all animals. A shoe is not an animal."
- **Endings:** the ending is shown as a separate tile joining the word, with the picture changing to match (one dog becomes two; the jump is shown finished).
- **Strong Words:** the words sit on a bar that grows from small to big, each said in a matching voice size.

## Voice

Use Aria, as the build guide says for reading games. Every content word is its own clip. Listen to the single words; a lone short word is where the voice goes wrong (`SAID_AS` in `tools/make_voice.py`). Endings need the pairs to sound clearly different (*jump, jumped, jumps*); check those first, because if they don't, that kind cannot ship.

## The reward: the Station, the Call and the Town

- **The loop.** A finished Round earns Bolts and one Call. Bolts buy trucks and parts. A Call he has not answered before opens the next one and adds a badge.
- **The Station.** His fire engines in their bays. Truck kinds, each with its own trick: pumper, ladder truck, tanker, rescue truck, airport crash truck, brush truck, fireboat, fire helicopter. Slots on each: Pump, Hose, Ladder, Tank, Siren, Lights, Paint, and a Crew Buddy (a dalmatian first).
- **Parts matter.** The Pump sets how far the water reaches. The Ladder sets how many floors he can reach. The Tank sets how long he can spray before a short refill. The Hose sets how wide the spray is.
- **The Call (action, 2D canvas, from the side).** A short drive with a big Siren button, then the scene. He drags to aim the hose, and the water flies in an arc and puts out fires in windows. He raises the ladder to bring down people and cats. About 45 seconds. The site already has three side-view drives, so the drive here is short and the hose is the new thing he does with his hands.
- **It cannot be failed.** A fire never spreads, nobody is hurt, and there is no clock. A fire he can't reach yet tells him which part would reach it, and he still finishes the Call.
- **Calls.** Sixteen scenes to start, getting taller and stranger: a bin, a house, a barn, a forest edge, a tall building, a ship at the dock, an airport, a rocket pad.
- **The Town and show off.** Each answered Call puts its building on the Town map with a thank-you sign, and the Station wall fills with badges.

Plan for about 150 things to earn from the first build (see the build guide). Economy defaults for the parent to confirm: one Call per Round, the first one free; no price over 100 Bolts.

## Look

Fire-engine red, brass yellow and night blue, with warm window light. Trucks are drawn in code from their parts, and the one in the Station is the one at the Call. Icon: a ladder truck with its ladder up against a letter tile.

## Risks

- Strong Words and Sort It depend on content with no arguable cases. Budget time for the tables and for the parent's read-through.
- The voice on single short words and on word endings.
- Emoji pictures differ off Apple devices and some are ambiguous. The picture table needs a test and a human look.
- Water as particles on the iPad 9. Cap the drops and check it holds 60 fps.
- Word Wreckers already builds a town and Wild Rescue already drives a rescue truck. Keep this one about the hose and the ladder so it does not feel like either.
