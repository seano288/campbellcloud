# Spec: Chop Chop (fractions, building helicopters)

Status: built, awaiting iPad acceptance (2026-10-23).

A third learning game on the family site, built the same way as Time Flies, for the same young player (6, not yet
reading, so everything is spoken from recorded clips). He learns what fractions *are* (fair pieces, what a piece is
called, parts of a whole, bigger and smaller pieces, sharing) before any notation: pizzas, cakes, chocolate bars and
cookies, and words like "one quarter" and "three of the four equal pieces". Only once he can name pieces does he meet the
numbers a part is written with (Top and Bottom, 2026-10-26). He spends the Bolts he earns building a helicopter in the 3D
hangar.

Research behind this spec: `research/BRIEF.md`, `research/beginner-fractions.md` (teaching a total beginner) and one note per
helicopter in `research/helis/` (written by Haiku agents).

## Learning: seven kinds of question, three Levels each

Every Round mixes all the kinds he has opened (as Time Flies does), never the same kind twice in a row. Most questions
are at that kind's Level and count toward Mastery; about one in three, and always the one right after a miss, comes from
an easier Level. When he has been missing a lot, help steps in after a single miss. Mastery is 16 of the last 20 right on
the first try without help, **or 10 in a row** (so a child who clearly has it isn't held back).

**Every word is met before it's asked (2026-10-23).** He didn't know what "one quarter" meant, so no question uses a piece
word he hasn't met. The words come one at a time, in this order: half, quarter, third, eighth, sixth. Half comes first.
Each later word comes after 8 more questions right on the first try. When a question is about to use the next word, he
meets the word first. A food appears whole and is cut while he watches: a quarter is a half cut in half again, an eighth
is a quarter cut in half, and a sixth is a third cut in half. The pieces are counted and named ("So one piece is one
quarter. Half of a half is one quarter! Four quarters make the whole pizza!"). Then he taps any one piece ("Tap one
quarter!"), and the question is asked. A kind that can't ask anything with his words yet sits out, so Name the Piece waits
until he knows half and quarter. Before he knows a second word, Find the Part shows one half left beside the whole thing
and an empty plate.

**A part is the food that's left (2026-10-23).** Pink crayon over the food read as an empty gap, so Find the Part, Bigger
Piece and Name the Piece show a part as the pieces left on a plate: the eaten pieces leave the empty plate with a dashed
outline and a few crumbs. Find the Part asks "Find the pizza with one half left!". Color the Part's crayon is see-through,
so a coloured piece still shows the food under it.

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| ⚖️ Fair Shares: which one is cut into equal pieces? | start | halves | thirds, quarters | quarters, sixths, eighths |
| 🍕 Name the Piece: what is one piece called? | Fair Shares L2 | half or quarter (only those two offered) | + third | + sixth, eighth |
| 🍰 Bigger Piece: which is bigger? | Name the Piece L2 | half vs quarter, pictures | half/eighth, thirds/sixths, quarters/eighths…, pictures | words only, and "the same" (two quarters = one half) |
| 🔎 Find the Part: "Find the pizza with one half left!" | start | one half, one quarter | any unit part | "three quarters", "two thirds", "five eighths"… |
| 🖍️ Color the Part: colour one half of the cake | Find the Part L2 | half of 2 or 4, quarter of 4 | thirds, three quarters, half of 6 or 8 | two thirds, three eighths, five sixths… |
| 🍪 Share It | start | N friends share a pizza: how many pieces? | half of a pile of cookies | a quarter or a third of a pile |
| 🔢 Top and Bottom | Name the Piece L2 | one piece left: tap its numbers (1/2, 1/3, 1/4…) | read the numbers, tap the food (one piece, any word) | either way, "3/4", "2/3", "5/8"…, with one choice cut the same way |

Teaching (after two misses, or one when struggling, or 🔎 Help) speaks while the picture shows it: pieces glow and are
counted with numbers on them ("Let's count the pieces. One, two, three, four. Four equal pieces are quarters. So one
piece is one quarter."), unfair pieces are pointed out, the right number of pieces colours itself in, cookies are dealt
onto plates one at a time.

**Writing it with numbers (2026-10-26).** The user asked for real fraction notation once the ideas are in place. It
is its own kind, Top and Bottom, opening with Bigger Piece when Name the Piece reaches Level 2. Before its first question
he meets writing, the way he meets a word: one piece of a food is left, "We write one quarter like this", the numbers
appear, the bottom number glows while the pieces are counted ("The bottom number says how many equal pieces"), then the
top number while the pieces left are counted ("The top number says how many pieces are left"), and he taps the numbers.
The question never says the part, so he has to read it; a miss says what the tapped numbers (or food) show, and help
counts the pieces against the glowing numbers again. A written part is always read with the words he knows ("three
quarters"), never "three over four". Once he has met writing, the numbers are shown beside the words in Name the Piece,
Bigger Piece, Find the Part, Color the Part and the Fuel Lock.

## Reward: the Helipad

- **Helicopters** (the Body): 17. Starters: UH-60 Black Hawk, MH-6 Little Bird, AH-1Z Viper. The rest cost 30 Bolts:
  UH-1 Huey, Lynx, Tiger, AH-64 Apache, Mi-24 Hind, Ka-52 Alligator, CH-47 Chinook, CH-53E Super Stallion, Mi-26 Halo,
  RAH-66 Comanche, Bell 360 Invictus, Raider X, Blue Thunder, Airwolf. Each says a true fact when picked.
- **Slots** as in Time Flies, with Engine replaced by **Rotor** (Striped Tips, Glow Tips, Fire Ring, Rainbow Rotor: the
  spinning tips draw a ring) and Landing Lights by a **Searchlight**. Weapons hang on the stub wings: rocket pods,
  missiles, Mega Load, Firework Rockets.
- **Legendaries are in the Fuel Lock.** Once a Slot's top Rung is his, he opens its Legendary by filling a fuel tank to a
  part he hears ("Fill the tank three quarters full!"), at his Color the Part Level.
- **Lift Off** (the Show Off): rotors spin up, it lifts straight off a helipad in a ring of dust, noses down into the
  sky; tap for a pirouette, roll or loop; 🔫 and 🚀; 🛬 sinks back onto the pad and the rotors wind down.

## Where it lives

- Game: `src/chop-chop/` (fractions in `fractions/`, Helipad in `hangar/`, 3D in `hangar/three/`, one spec per
  helicopter in `hangar/helis/`). It reuses Time Flies' 3D primitives, paint, materials, stores and weapons
  (`src/time-flies/hangar/three/`) and its CSS, plus the shared engine modules.
- Voice: `src/chop-chop/phrases.ts`; clips in `public/chop-chop-voice/`, recorded with
  `.venv/bin/python tools/make_voice.py --collection chop-chop --out public/chop-chop-voice --index src/chop-chop/voice.gen.ts`.
- Builds: `npm run dev:chop-chop`, `npm run build:site` (`/chop-chop/`, save key `chop-chop-save`). Checks:
  `tools/chop-chop/tour.ts` (plays a Round and flies), `tools/heli-preview/` (one helicopter, screenshots).
