# Brief: Dino Dig (phonics, a fossil dig and dinosaur museum)

Status: ready-for-agent

Read `.scratch/new-games/build-guide.md` first. It covers the player, the shared engine, wiring, voice, verification and the final report. This brief covers only what is particular to Dino Dig. Slug: `dino-dig`.

## Why this game

Sight Squad teaches words he memorises. Nothing on the site teaches him to sound out a word he has not seen, which is the main reading skill of first grade (Common Core RF.1.2 and RF.1.3). Dino Dig is that game.

## What he learns

Decoding phonetically regular words, in this order. Each step is a **Pattern**:

1. Short-vowel CVC words: *cat, hen, pig, dog, bug*
2. Digraphs: *sh, ch, th, wh, ck*
3. Blends at the start and end: *st, bl, tr, fr, -nd, -mp, -st*
4. Magic e: *cake, bike, bone, cube*
5. Vowel teams: *ee, ea, ai, ay, oa, ow*
6. R-controlled vowels: *ar, or, er/ir/ur*

Patterns work the way Sight Squad's word sets do: each Pattern is **met before it is asked** (a short spoken introduction with two or three example words, the pattern's letters lit), the next one opens after enough first-try answers on the current ones, and each Pattern keeps a strength so weak ones come back more often. A Level is how hard the question is, not which Pattern it uses.

Build a curated word list of about 150 to 200 words, each tagged with its Pattern, in `src/dino-dig/words/`. Word Wreckers (the spelling game) will reuse this list, so keep it free of game code and export it cleanly. Leave out sight words that break the rules (*said, was, the*); Sight Squad owns those.

## Kinds

Defaults; refine them if the research says otherwise, and record what you chose in the spec.

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **Read It** `read`: a word is shown (not spoken); tap its picture | start | 2 pictures, very different words | 3 pictures | 3 pictures whose words differ by one sound (*ship / shop / chip*) |
| **Hear It** `hear`: hear a word; tap the written word | start | 2 words, very different | 3 words | 3 words one sound apart |
| **Sound Swap** `swap`: "This says *cat*. Make it say *cot*." Tap the letter to change, then pick the new one | Hear It L2 | the letter to change is marked | he finds the letter | the change is a digraph or vowel team |
| **Real or Silly** `real`: two words; tap the real one (*hat / zat*) | Read It L2 | very different | same pattern | the silly one is one letter off a real word |
| **Read and Find** `sentence`: a short decodable sentence; tap the picture that matches | Read It L2 and Hear It L2 | 3 words | 4 to 5 words | two pictures that differ by one word of the sentence |

Rules the tests must enforce:

- A question only uses words from Patterns he has met.
- Exactly one choice is right. Homophones and near-homophones are never offered together in Hear It.
- Every silly word is checked against a block list: not a real word, not a name, not rude, and pronounceable under the Pattern.
- Read It and Read and Find use only words with a clear picture. Pictures are emoji; keep a table of word to emoji and only use words where the emoji is unmistakable (🐷 *pig* yes, *lid* no). Other words appear only in Hear It, Sound Swap and Real or Silly.
- Read and Find sentences use met Patterns plus the first Sight Squad sets (`src/sight-squad/words/list.ts`, read only).

## Teaching a miss

- The right word's letters light up sound by sound (each sound's letters in one box, so *sh* is one box and magic *e* is linked to its vowel), then the whole word is spoken.
- For a one-sound-apart miss, the two words are shown stacked with the differing box lit, and both are spoken: "*ship*. *shop*."
- A second miss walks the Pattern's introduction again with this word.

## Voice: the hard part

edge-tts speaks words and sentences well and isolated speech sounds badly. Before building any kind that depends on audio, record a test batch and listen (or check durations and transcribe them back if you can):

- every word in the list, alone, with Aria. Fix the ones that come out wrong through `SAID_AS` (a lone "cat" already needs it).
- a few attempts at isolated sounds (/sh/, /a/, /t/).

Default design, which assumes isolated sounds are **not** usable: the game never plays a lone sound. It lights the sound boxes while the whole word is spoken slowly and then normally, and teaches by contrast between whole words. If your test shows clean isolated sounds, say so in the report and leave them as an open question rather than rebuilding around them.

Every word clip must be listened to by the parent on the iPad before the game is trusted. List in the report the words you were least sure of.

## The reward: the Dig and the Museum

- **The loop.** A finished Round earns Bolts and one Dig. A Dig uncovers bones. Bones complete a dinosaur's skeleton. A complete skeleton comes alive, and he gets to be that dinosaur. Bolts buy better dig tools, which open deeper dig sites with bigger dinosaurs.
- **The Dig (action, 2D canvas).** A patch of ground. He rubs the dirt away with his finger to find the bones, taps rocks to crack them, and drags each bone out to the crate. About 30 seconds. Better tools (brush, trowel, shovel, jackhammer, digger) clear more dirt per stroke and break harder rock. Nothing can be broken or lost.
- **The Museum.** A hall with a plinth for each dinosaur. Bones snap onto the skeleton as he finds them, so a half-built dinosaur shows what is still missing. Eight dinosaurs, four to six bones each, from small (Compsognathus) to huge (T. rex, Brachiosaurus). Names are spoken; he is not asked to read them.
- **Alive (action, 2D canvas).** When a skeleton is complete it grows skin and he plays as that dinosaur in a side-view run: hold to walk, tap to jump, a big ROAR button, things to stomp or eat. Each dinosaur moves differently (the long-neck reaches high leaves, the T. rex smashes rocks, the Pteranodon glides). He can replay any dinosaur he has brought to life.
- **Bolts also buy** skin colours, patterns and roar sounds for living dinosaurs.
- **Show off.** The Museum hall with his living dinosaurs walking in it is the screen he shows people.

Economy defaults for the parent to confirm: one Dig per Round, one free Dig to start; a Dig gives one or two bones; the first dinosaur completes within about three Rounds; tools cost roughly 10, 30, 60 and 100 Bolts.

## Look

Warm sandstone, bone white and fern green. The dinosaurs are drawn in code and shared by the Museum and the run, so the one he built is the one he plays. Icon: a T. rex skull half out of the dirt with a letter tile beside it.

## Risks

- The voice, as above. This is the one that can sink the game.
- Emoji pictures look different off Apple devices and some are ambiguous. The picture table needs a test and a human look.
- Rubbing dirt away is a canvas erase over a large area; check it stays smooth on the iPad 9.
