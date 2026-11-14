# Brief: Sentence Express (sentences, a train set he builds and drives)

Status: ready-for-agent

Read `.scratch/new-games/build-guide.md` first. It covers the player, the shared engine, wiring, voice, verification and the final report. This brief covers only what is particular to Sentence Express. Slug: `sentence-express`.

## Why this game

Sight Squad and the phonics games stop at the word. This one is about the sentence: word order, the capital letter at the start, the mark at the end, and reading a sentence for what it means (Common Core RF.1.1a, RF.1.4, L.1.1, L.1.2a and L.1.2b).

## The central picture

A sentence is a train. The first word is the **engine** and carries the capital letter. Each word after it is a **car**. The end mark (*. ? !*) is the **caboose**. Use this picture in every kind and in every lesson, so the rules have something to hang on.

## What he reads

- Sentences are curated, not generated: about 120 to 150, in `src/sentence-express/sentences/`, each tagged with its length, its end mark and what it can be used for.
- Vocabulary: Sight Squad's 100 words (`src/sight-squad/words/list.ts`, read only), short decodable words, and a few picture nouns (*dog, cat, sun, train, ball*). If `src/dino-dig/words/` exists, draw decodable words from it.
- Every sentence is recorded as one whole clip. Each word is also a clip, so tapping a car says its word.

## Kinds

Defaults; refine and record in the spec.

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **Build the Train** `order`: hear a sentence; drag or tap its word cars into order | start | 3 words | 4 to 5 words | 5 to 6 words, some of them questions |
| **Engine and Caboose** `marks`: a sentence missing its capital or its end mark; pick the right piece | start | which word is the engine (the capital) | *.* or *?* for the caboose | *.* *?* or *!*, and the capital on *I* and on names |
| **What Happened** `mean`: read a sentence (not spoken until he asks); tap the picture it describes | Build the Train L2 | 2 pictures | 3 pictures | pictures that differ by one word (*on / under*, *big / little*) |
| **Who, What, Where** `ask`: a sentence, then a spoken question about it ("Where is the dog?"); tap the answer | What Happened L2 | who | what or where | two sentences, the answer in one of them |
| **Fix the Train** `fix`: a sentence with one mistake; tap the bad car, then fix it | Engine and Caboose L2 | a missing capital or end mark | two cars swapped | any one of: capital, end mark, order, a word that does not belong |

Rules the tests must enforce:

- **One right order.** A Build the Train sentence must have exactly one grammatical order of its words. Keep a list of the traps (*the cat and the dog* / *the dog and the cat*; *Is it big* / *It is big*) and leave such sentences out, or make them a question only where the end mark settles it.
- **One right picture.** In What Happened, no wrong picture may also be true of the sentence.
- **Fix the Train has exactly one mistake**, and the fixed sentence is one of the curated sentences.
- The engine tile shows its capital and the caboose shows its mark from Level 1. Those are honest clues: noticing them is the skill.
- What Happened is not read aloud unless he taps the speaker, and tapping it counts as help. It is the one kind where he must read alone.

## Teaching a miss

- **Order:** the train couples up car by car in the right order while each word is spoken, then the whole sentence is spoken at normal speed. His cars stay where he put them, with the first wrong one lit, so he can fix it.
- **Marks:** the engine's capital or the caboose's mark glows, with one line: "A sentence starts with a capital letter." / "This one asks something, so it ends with a question mark."
- **Meaning:** the words that decide the answer light up in the sentence (*under*), and the matching part of the picture lights with them.

## Voice

Aria at -8%. Whole sentences are natural speech, which edge-tts does well; single words are where it slips, so listen to a sample of the word clips and use `SAID_AS` for fixes. Questions must sound like questions; check that a sentence ending in *?* is recorded with rising speech and not flattened.

## The reward: the Train Set

- **The loop.** A finished Round earns Bolts and one Delivery. Bolts buy engines, cars, track pieces and scenery. A Delivery is a run he drives; finishing it opens the next station on the line.
- **The Layout (build, top-down, 2D canvas).** A table-top grid. He lays track by dragging a finger across squares; corners, crossings and joins are worked out for him, and a loose end is closed up by itself so the train always has somewhere to go. He drops scenery (tunnel, bridge, station, level crossing, trees, a water tower) anywhere it fits. His Layout is saved and is the thing he shows off.
- **The Delivery (action).** He drives his own train on his own Layout: a throttle he slides, a whistle, a bell, and points he taps to switch. He picks up cargo at one station and takes it to another. Going too fast into a bend only makes the train lean and squeal; it never derails. Eight stations open one at a time (farm, quarry, port, city and so on), each with its own cargo and a gift piece of scenery on the first delivery.
- **The Shed.** Engines (little steam tank engine free, then a big steam engine, a diesel, a bullet train), cars (coal, logs, animals, tanker, passenger, a caboose) and paint. A longer train carries more and pays a little more.

If free-form track drawing proves too much to get solid, fall back to a set of growing pre-built layouts he unlocks and decorates freely, and say so in the report. Driving the train himself is the part that must not be cut.

Economy defaults for the parent to confirm: one Delivery per Round, one free Delivery to start; a Delivery pays up to 6 Bolts by train length; track pieces are cheap (2 to 5 Bolts) so he can always buy something; engines cost roughly 30, 60 and 100.

## Look

Wooden-toy colours: bright red, blue and green on a pale wood table, with the black outlines of the family look. The train in a question and the train in the reward are drawn by the same code, so the word cars and his own cars are plainly the same toy. Icon: a little steam engine with a capital letter on its side, pulling two word cars and a caboose with a full stop.

## Risks

- The track editor is the largest piece of new interface on the site. Build the driving first against a fixed loop, then the editor.
- "One right order" is easy to get wrong. The curated list and its trap tests are the protection.
- This is the most reading-heavy game. Keep the first Rounds to three-word sentences made of Sight Squad's first sets.
