# Brief: Moon Base Mail (reading a short passage for meaning; build a moon base and land its supply ship)

Status: ready-for-agent

Read `.scratch/new-games/build-guide.md` first. It covers the player, the shared engine, wiring, voice, verification and the final report. This brief covers only what is particular to Moon Base Mail. Slug: `moon-base-mail`. The name is a working name for the parent to confirm.

## Why this game

He has mastered most of the first-grade games, and the parent asked for a step up. The reading games take him from the word (Sight Squad, Dino Dig, Word Wreckers) to the sentence (Sentence Express, which ends with a question about two sentences). Nothing asks him to read several sentences and understand them together. That is where first grade ends and second grade begins: answering questions about a text, retelling it in order, saying what it is mostly about and working out what it does not say outright (Common Core RL.1.1 to RL.1.3, RI.1.1, RI.1.2, RL.2.1, RI.2.1 and RI.2.5).

He likes building, and a moon base is a small city. The mail gives the reading a reason: each passage is a letter or a report from the base's crew, and he reads it because it is addressed to him as Commander.

## What he learns

Start the research from the standards above and the matching TEKS Grade 2 comprehension strand. Read Sentence Express's What Happened and Who, What, Where in the code first, so Level 1 here begins where they end, and copy its rule for when a sentence is spoken.

**Every passage must be one he can read.** Each word is in the Sight Squad list, the Dino Dig list, the Word Wreckers tables or the Cargo Words tables if that game exists, or it is in a short list of "base words" (moon, rocket, crew names, dome, rover) that are met first with their picture and the voice. A test enforces this. A passage he cannot read turns the game into a listening game.

## Kinds

Defaults; refine them if the research says otherwise, and record what you chose in the spec.

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **Read the Mail** `ask`: a letter, then a spoken question about it | start | three sentences; who, what or where; picture answers | four or five sentences; when as well; short written answers | why and how, where the answer is said in the letter |
| **What Came Next** `order`: put the story back in order | start | three pictures after reading a three-sentence story | three sentences to put in order, with no pictures | four sentences, with first, next, then and last |
| **Big Idea** `main`: what the letter is mostly about | Read the Mail L2 | pick the picture that fits the whole letter | pick the best title of three | one sentence does not belong: tap it |
| **Clue Finder** `infer`: what the letter does not say outright | Read the Mail L2 | "Ava put on her helmet and her big boots. Where is she going?" picture answers | how does he feel, and which words tell you | what will happen next |
| **Fact File** `fact`: a true report about space with a labelled picture | What Came Next L2 | find a fact said in the report | use the picture's labels: "Which part is the hatch?" | "Does the report say this?" yes, no, or it does not say |

Passages are data, in `src/moon-base-mail/mail/`, free of game code: each with its sentences, its kind, its Level, its questions, and for each question the right answer, the wrong ones and the sentence or sentences that hold the answer.

How the reading works:

- The passage is not spoken when it appears. He reads it. A speaker button beside each sentence reads that sentence, and the game follows the same rule Sentence Express uses for whether a listened-to answer earns Mastery credit.
- The question is spoken, and it is asked only after a "I've read it" tap, so he reads before he sees the choices.
- The passage stays on screen while he answers. This is reading, not memory.
- Written answer choices are short, in words he can read, each with its own speaker button.

Rules the tests must enforce:

- Every word of every passage and every written choice is in an allowed list (see above).
- Exactly one choice is right, and it cannot be picked without reading: the right answer is never the only choice that names something in the passage, and never the longest by a clear margin.
- Wrong choices in Read the Mail are things from the passage that answer a different question. Wrong choices in Clue Finder are sensible guesses that the clues rule out.
- Every question records the sentence that holds its answer. Clue Finder questions record their clue words.
- Passages at one Level stay inside that Level's sentence count, and no sentence is longer than twelve words.
- A passage is not asked again until at least twenty others have been, and never with the same question twice running.
- Fact File reports are true. Each fact is listed in the spec with its source.
- Lowercase and Andika, as the build guide says for reading games, with capitals where a sentence, a name or *I* needs one.

## How many passages

He replays a great deal, and a passage he remembers teaches nothing. Write about 150 passages for the first build, about 30 for each kind spread over the three Levels, each with two or three questions. This is the biggest piece of work in the game and it is writing, not code. Give the crew four or five people with names he can read (Ava, Sam, Kit, Ben, Jo), a robot and a base cat, and let small stories run across several letters: the lost glove, the seeds that would not grow, the dust storm, the day the cat hid in the rover.

## Teaching a miss

- **Read the Mail and Fact File:** the sentence that holds the answer lights up and is read aloud, and then the answer is said with it: "It says: Sam put the box in the dome. So the box is in the dome."
- **What Came Next:** the story plays in order, one picture or sentence at a time, with "first", "next" and "last" said.
- **Big Idea:** each sentence lights in turn and points at the same idea: "This one is about the plants. This one too. And this one. The letter is about the plants."
- **Clue Finder:** the clue words light up one at a time and the thinking is said: "Helmet. Big boots. You need those to go outside."

A second miss gets the fuller lesson: the whole passage read aloud with each word lighting as it is said, and then the question again.

## Voice

Aria at -8%, which the build guide says matters most for reading. Every sentence of every passage is a recorded clip, because the speaker button and the lessons need them. That is the most recorded sentences of any game on the site: about 700. Watch the clip count and the precache size against the site's budget of about 50 MB, and report both. If it will not fit, record fewer passages rather than dropping the speaker button. Prices above 100 use the whole-ten clips Turbo Tally added (`PRICE_TENS`). Copy that pattern.

## The reward: the Moon Base, the Landing and the Crew

He builds the base, and he flies the supply ship that brings each new piece and the next bag of mail. Flat 2D, no 3D.

- **The loop.** A finished Round earns Bolts and one Landing. Bolts buy base modules. The Landing delivers the module he bought most recently, or a supply crate if he has not bought one.
- **The Moon Base (from above, with a side view).** It starts as one small dome and a flag. He buys living domes, a greenhouse, a solar field, a rover garage, a landing pad and then a second one, an observatory with a telescope, a radio mast, a workshop, a water plant, an ice mine, a mail room, a gym, a kitchen, a lookout tower and a glass dome with a garden. Tunnels join the modules by themselves. He chooses where each module goes on a grid of plots and can move it at any time.
- **Modules matter.** The greenhouse feeds more crew. The solar field lights the base through the long night. The observatory shows the Earth and the stars. Each living dome adds a crew member, and a new crew member means a new letter-writer in the mail.
- **The Landing (action, 2D canvas, from the side, about 45 seconds).** The supply ship comes down over the Moon's hills. He holds a big button to fire the engine and slow the fall, and a held finger slides the ship left and right toward the pad's lights. Low gravity makes it slow and floaty, which suits a six-year-old's hands.
- **It cannot be failed.** A hard landing only bounces the ship on its legs. Landing away from the pad lets it hop across. It has all the fuel it needs.
- **After the Landing.** He carries the new module to its plot with one finger and watches it unfold. Then the mail bag opens, and the letters inside are the next Round's reading.
- **The Crew and show off.** He can walk an astronaut round his base in long, slow moon hops, tap a crew member for a wave and a line, drive the moon buggy on the open ground and look through the telescope. The base runs by itself: lights come on, the buggy goes out, the Earth rises.
- **Kits.** Suits, helmets, flags, buggy paint, dome colours, garden plants and a set of landers: a small one, a wide cargo one, a tall one and a crane lander.

Plan for at least 250 named things to earn from the first build, as the fixed catalogue under the endless layer described below: about 50 modules, 6 landers with their parts, 30 paints, 24 suits and helmets, 20 flags, 20 garden plants, 30 pieces of base furniture, crew members, buggy parts and badges. Economy defaults for the parent to confirm: one Landing per Round, the first one free; the first new module within two Rounds; prices up to 100 in ones, then whole tens up to 400.

Use the glossary's words where they fit (Slot, Mod, Rung, Goal) and add the new ones (Landing, Module, Crew, Mail) to `GLOSSARY.md`.

## Never running out

The build guide's "Rewards that never run out" and "Competition" sections are requirements here. What follows is this game's own way of meeting them; refine it, but do not ship without an endless layer.

- **The reward must outlast the letters.** About 150 passages is the most that can be written well, and he will meet them all. Passages come round again after a gap (see the rules above), with a different question where there is one. The rewards must still be fresh when the letters are not.
- **The base has no edge.** He can always buy the next patch of ground, with new plots to build on, and the next module to put there. After the named modules, modules are put together from parts (dome shape, colour, windows, a roof fitting), so the shop always has new ones, seeded so a reload shows the same. Prices rise gently and then stay flat. Cap what is drawn at once, not what he owns.
- **Landings made on the spot.** After the first few, every Landing's ground is generated from its number: the hills, the craters, where the pad is, how far he must slide across. The same number always gives the same Landing. Each is a little trickier, and every fifth one carries a crate with something that is never sold.
- **Moon rocks.** Each Landing also brings back one rock for his collection, made from parts (shape, colour, sparkle, size), with rarer ones the further he has got. A shelf in the workshop shows them, and there is no last rock.
- **The garden grows.** Plants in the greenhouse grow a stage for each Round he plays, so there is always something that has changed when he comes back.
- **Competition:** none against a rival. His own best is enough: his softest landing and his closest to the middle of the pad.

## Look

Moon grey ground under a black sky, with the base in warm colours against it: orange suits, yellow light in the dome windows, a green greenhouse and the blue Earth above. The mail is paper: a cream letter with a stamp, set in Andika. Icon: a dome with a lit window and an envelope with a small moon for its stamp.

Keep it apart from Rover Code (other planets, a rover he programs) and from Globe Hopper (a rocket base on Earth and the launch). Here the action is the landing, and the place is the Moon.

## Risks

- The passages decide whether this game is any good. Dull or stilted letters will lose him, and the allowed-word rule makes natural writing hard. Write twenty first, read them aloud and judge them before writing the rest.
- He may tap the speaker for every sentence and never read. Record in the save how often he does, show it on the parent's screen if the game has one, and report what the Mastery rule does about it.
- Comprehension questions are easy to get subtly wrong: two answers that could both be right, or one that can be guessed. Every passage and question needs a second read by someone other than its writer.
- A wrong space fact taught to a six-year-old is worse than a missing one. When unsure, leave it out and list it in the report.
- A long passage on a sideways phone may not fit beside its question. Lay out the phone views first.
- The clip count and size, as above.
