# Brief: Cargo Words (reading longer words; build a container port and work the crane)

Status: ready-for-agent

Read `.scratch/new-games/build-guide.md` first. It covers the player, the shared engine, wiring, voice, verification and the final report. This brief covers only what is particular to Cargo Words. Slug: `cargo-words`. The name is a working name for the parent to confirm.

## Why this game

He has mastered most of the first-grade games, and the parent asked for a step up. Dino Dig and Word Wreckers teach him to sound out and spell short words, mostly of one beat. The next step in reading is the long word: breaking it into syllables, reading each one and putting them back together (Common Core RF.1.3d and RF.1.3e, RF.2.3a to RF.2.3d, L.2.4b). A child who can do this stops guessing at long words from their first letter.

He likes building, and a port is a city of machines. A container is a good picture of a syllable: a long word is a row of containers, and each one can be lifted off and read by itself.

## What he learns

Start the research from RF.1.3d, RF.1.3e and RF.2.3, the six syllable types as they are taught in structured-literacy programmes, and the matching TEKS Grade 2 strand. Read `src/dino-dig/words/`, the Word Wreckers word tables and the Hook and Ladder Endings kind first. Three checks come out of that reading:

- Which vowel teams and digraphs he has already met, so that the syllables here are built from sounds he can read.
- That Bossy R is not already taught in Dino Dig. If it is, drop the kind's Level 1.
- That Add-Ons does not repeat Hook and Ladder's Endings (-s, -ed, -ing). Add-Ons has only the beginnings un- and re- and the endings -ful, -less, -er and -est.

## Kinds

Defaults; refine them if the research says otherwise, and record what you chose in the spec.

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **How Many Containers** `count`: hear a word; how many beats | start | one or two, with its picture | one to three | a written word that is not spoken; one to four |
| **Load the Ship** `build`: hear a word; put its syllable containers in order | start | two containers, exactly the ones needed (*sun-set*) | three, with one spare (*fan-tas-tic*) | a spare that looks or sounds close (*gar-den* with *gra*) |
| **Split It** `split`: a written word; tap where it breaks | How Many Containers L2 | two small words joined, and twin letters (*sun\|set*, *rab\|bit*) | two different letters in the middle (*nap\|kin*, *pic\|nic*) | one letter in the middle, spoken so he can hear the break (*ti\|ger* or *cab\|in*) |
| **Read It** `read`: a written long word that is not spoken; tap its picture | Load the Ship L2 | two syllables, two pictures | two syllables, three pictures, with vowel teams and bossy-r syllables | three syllables |
| **Bossy R** `r`: ar, or, er, ir, ur | Load the Ship L2 | hear a word; tap *card* or *cord* (ar against or) | read an er, ir or ur word; tap its picture | inside a longer word (*garden*, *turtle*, *corner*) |
| **Add-Ons** `addon`: a container bolted on the front or back | Split It L2 | *un* and *lock* are shown and said; tap the picture of *unlock* | "Which word means not happy?" three written words | "Which word is hiding in *careful*?" then -er and -est (*tall, taller, tallest*) |

Build the content as tables in `src/cargo-words/words/`, free of game code: each word with its syllables, its break points, its picture if it has one and the sounds it uses.

Rules the tests must enforce:

- Exactly one choice is right, in every kind.
- Every word has one agreed set of break points in the table, checked against a school dictionary's syllable breaks. A word whose break is argued over (*lemon*, *every*, *family*, *different*) is left out.
- Read It never speaks the word before he answers, and its pictures cannot be mistaken for each other (no *rabbit* beside *bunny*).
- Every syllable in a word is made only of sounds he has met in Dino Dig or in an earlier Level here.
- Split It at Level 3 always speaks the word slowly, because the break cannot be found from the spelling alone.
- Add-Ons words mean what their parts say. *Unhappy* is in. *Uncle* and *under* never appear as un- words, and *refuse* and *really* never appear as re- words.
- Words are lowercase and in Andika, as the build guide says for reading games.
- Nothing rude or frightening hides inside a word or a spare container.

## Teaching a miss

- **How Many Containers:** the word is said slowly and one container drops for each beat. "Rab. Bit. Two."
- **Load the Ship:** the containers lift into place one at a time, each one said, and then the whole word is said at normal speed.
- **Split It:** the word comes apart at its break, each half is read, and the halves slide back together. The reason is said in a short line: "Two letters in the middle. Split between them."
- **Read It:** the word breaks into containers, each lights as it is read, and then the right picture glows.
- **Bossy R:** the vowel and its r light up together as one sound. "A and r say ar."
- **Add-Ons:** the add-on unbolts, the base word is read and the add-on's meaning is said: "Un means not. Unlock means not locked."

A second miss gets the fuller lesson, with him tapping each container to hear it.

## Voice

Aria at -8%, which the build guide says matters most for reading. Every word needs a clip, every syllable needs a clip said alone, and single syllables are where the voice slips most. Listen to a sample, add fixes to `SAID_AS` and `speakable()`, and report any syllable that still sounds wrong. A syllable that cannot be recorded cleanly takes its word out of the game. Report the clip count and size. Prices above 100 use the whole-ten clips Turbo Tally added (`PRICE_TENS`). Copy that pattern.

## The reward: the Port, the Crane and the Ships

He wants to build, so the port is the main reward. The crane is the action, and it is unlike anything else on the site: every other game drives or flies. Flat 2D, no 3D.

- **The loop.** A finished Round earns Bolts and one Ship to load. Bolts buy port pieces, cranes and ships. Each loaded Ship sails to a new harbour and brings something back.
- **The Port (from above, with a side view of the quay).** It starts as one wooden pier. He buys berths, the container yard, warehouses, a rail line and its engine, a lorry gate, a lighthouse, a harbour office, a fuel dock, a dry dock, a ferry pier, a fish market, a breakwater, harbour lights, flags and fog horns. Pieces go in fixed places, so the layout always works.
- **Pieces matter.** Each berth holds one more ship. The rail line and the lorry gate carry containers away, so the yard never fills. The lighthouse opens night ships, and the dry dock lets him repaint a ship's hull.
- **Cranes.** A small dock crane to start, then a taller one, a gantry crane on rails, a floating crane and a giant gantry. Slots on each: the grab (holds one container, then two), the cable (how fast it lifts), the trolley (how fast it slides), lights, paint and a horn.
- **The Crane (action, 2D canvas, from the side, about a minute).** A ship is at the quay and a row of containers waits on the dock. He drags the trolley along the boom, taps to lower the grab, and it locks on by itself when it is close. He carries the container over and sets it down on the ship. Containers stack, the ship sits lower in the water as it fills, and when it is full the horn sounds and it sails. The containers carry the syllables of words from his Round, so a stack he builds reads as a word.
- **It cannot be failed.** A container set down crooked straightens itself. A swinging container never hits anything hard. There is no clock.
- **Ships.** A tug, a feeder ship, a big container ship, a car carrier, a tanker, a ferry, a fishing boat, a research ship, an icebreaker and a cruise liner. Each has hull paint, a funnel mark and a name he picks.
- **Harbours.** Twenty-four places his ships sail to on a sea chart. A ship comes back with a crate from that place: a decoration for the port, a new container colour or a flag.
- **Show off.** "Watch it run": his port working by itself, with his ships arriving, his cranes unloading, and the train and the lorries leaving.

Plan for at least 250 named things to earn from the first build, as the fixed catalogue under the endless layer described below: about 50 port pieces, 5 cranes with their parts, 10 ships, 30 paints, 24 funnel marks, 24 Harbours with a crate each, container colours and flags. Economy defaults for the parent to confirm: one Ship per Round, the first one free; the first new piece within two Rounds; prices up to 100 in ones, then whole tens up to 400.

Use the glossary's words where they fit (Slot, Mod, Rung, Goal) and add the new ones (Port, Berth, Crane, Harbour) to `GLOSSARY.md`.

## Never running out

The build guide's "Rewards that never run out" and "Competition" sections are requirements here. What follows is this game's own way of meeting them; refine it, but do not ship without an endless layer.

- **Ships made on the spot.** After the named ships, every arriving ship is generated from its number: its kind, its length, how many stacks it takes, its colours and its funnel mark, and where it is bound. The same number always gives the same ship. Bigger ships arrive as his cranes get better, and every fifth one brings a crate with something that is never sold.
- **The sea chart never ends.** New Harbours keep appearing past the first twenty-four, generated from the chart number, each with its own flag made from parts (colours, stripes, a symbol) for his flag wall.
- **The port keeps growing.** He can always buy another berth, another yard block, another warehouse or another length of rail, and another crane to stand on it. Prices rise gently and then stay flat. Cap what is drawn at once, not what he owns.
- **Containers made from parts.** A container's look is a colour, a stripe and a company mark, chosen separately, so the yard he stacks never looks the same twice.
- **The tonnage counter.** Every container he loads adds to a running total on the harbour office, with a new port rank at each milestone, without end.
- **Competition:** none against a rival. His own bests are enough: his tallest stack and his quickest loading of each size of ship, shown and cheered when beaten, never timed against a clock he can lose to.

## Look

Port colours: sea green water, rust-red and bright blue containers, safety yellow cranes and a concrete grey quay. Containers are the game's signature shape, and the same container appears in the questions and in the reward. Icon: a crane's grab holding one container with a syllable on its side.

Keep it apart from Treasure Fleet (a pirate ship and maps) and Carrier Deck (aircraft at sea). This one is about the dock and the crane; he never steers a ship.

## Risks

- Syllable breaks are argued over, even between dictionaries. The table and its test are the guard. When unsure, leave the word out and list it in the report.
- Recorded single syllables are the weakest thing the voice does. This could decide how many words the game can have.
- Picture choices for long words are harder to draw clearly than for short ones. Keep a table of which words have a clear emoji or drawing, and use only those in Read It.
- The crane's feel on the iPad 9: the drag, the swing and the automatic lock. Build it first with plain boxes and get it into his hands before building the port.
