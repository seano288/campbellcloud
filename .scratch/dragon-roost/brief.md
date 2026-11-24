# Brief: Dragon Roost (grammar: kinds of words, irregular forms and contractions; hatch, raise and fly dragons)

Status: ready-for-agent

Read `.scratch/new-games/build-guide.md` first. It covers the player, the shared engine, wiring, currency, voice, verification and the final report. This brief covers only what is particular to Dragon Roost. Slug: `dragon-roost`. The name is a working name for the parent to confirm.

## Why this game

The reading games cover the word, the sentence and (once Moon Base Mail is built) the passage. None teaches how the language works: which words name things, which say what happens and which describe; that one mouse becomes two mice; that "run" was "ran" yesterday; and that "do not" squeezes into "don't". That is the Language strand of first and second grade (Common Core L.1.1b to L.1.1f, L.1.2a, L.2.1b, L.2.1d, L.2.1e, L.2.2a and L.2.2c). Hook and Ladder's Endings kind uses regular words only and says so: "No *ran, mice, feet*." Contractions appear nowhere on the site.

The dragon makes grammar something he can see. Describing words change how his dragon looks, and doing words are the tricks it performs.

This is the first game on the site without a vehicle. The parent asked for this brief knowing that. If dragons do not hold him, the kinds can move under a different reward unchanged.

## What he learns

Start the research from the standards above and the matching TEKS Grade 2 conventions strand. Read Hook and Ladder's Endings and Sentence Express's Engine and Caboose and Fix the Train in the code first, so nothing here repeats regular endings, the capital at the start of a sentence or end marks.

The research must settle what the kinds of word are called on screen. Most first-grade classrooms say noun, verb and adjective. The default is to use those words, each met first with its meaning ("A noun names a person, an animal, a place or a thing"), with a Meeting as Math Bots does for a new picture.

**Every word must be one he can read.** Each word in a question is in the Sight Squad list, the Dino Dig list, the Word Wreckers tables or the Cargo Words tables, or it is in a short list of dragon words (dragon, egg, wing, roost, flame) met first with their picture and the voice. A test enforces this.

## Kinds

Defaults; refine them if the research says otherwise, and record what you chose in the spec.

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **Nouns** `noun`: words that name | start | which of three words names something: *run, dog, big* | tap the noun in a short sentence | is it a person, an animal, a place or a thing |
| **Verbs** `verb`: words for what happens | start | which of three words is something you do | tap the verb in a short sentence | the verb that fits: "The dragon ___ over the hill." *fly* or *flies* |
| **Adjectives** `adj`: words that describe | Nouns L2 | which of three words tells what something is like | tap the adjective in a short sentence | two dragons: which sentence describes this one |
| **More Than One** `plural`: plurals that change the word | Nouns L2 | *foot, feet*; *man, men*; *tooth, teeth*; *mouse, mice*; *child, children*: match one to many | the right one for the sentence: "It has four big ___." | words that do not change (*sheep, fish, deer*), mixed with the rest |
| **Yesterday** `past`: the past of a verb | Verbs L2 | which word means it has happened: *jump, jumped*, in a sentence that starts "Yesterday" | verbs that change: *ran, flew, ate, saw, went, came, sat, hid, told* | yesterday, now or tomorrow: pick *flew, flies* or *will fly* from the time word |
| **Squeeze** `squeeze`: contractions | Verbs L2 | which two words made *don't* | the contraction for *is not*, *I am*, *it is*, *can not*, and where the apostrophe goes | *won't*, *I'll*, *we're*, *they're*, *he's*, in a sentence |
| **Big Letters** `capital`: capitals for names | Adjectives L2 | which word needs a capital: a person's or a pet's name | the days and the months | two words to fix in one sentence, with a place name among them |

The words and sentences are data, in `src/dragon-roost/words/`, free of game code: each word with its kind, its plural or past where it has one, and the Levels it may appear at; each sentence with the role of every word in it. About 200 sentences, all about dragons, knights, eggs and the roost where they can be.

Rules the tests must enforce:

- **A word has one job wherever it is asked alone.** Many short words are a noun and a verb (*fly, play, run, jump, water, park*) or a noun and an adjective (*orange, cold*). Each such word is marked in the table and never appears as a choice in a Level 1 question. It may appear in a sentence, where its job is plain and recorded.
- Exactly one choice is right. In "tap the noun" at Level 2, the sentence has one noun, or the question says which ("tap the animal").
- More Than One and Yesterday use only forms nobody disputes. No *fishes*, no *dreamt* or *dreamed*, no *hung* or *hanged*.
- Squeeze never asks *its* against *it's*, or *your* against *you're*. Those belong later.
- Big Letters never repeats Sentence Express: the first word of the sentence is already right in every question.
- A word or sentence is not asked again until at least twenty others have been.
- Lowercase and Andika, as the build guide says for reading games, with capitals where a sentence, a name or *I* needs one.

## Teaching a miss

- **Nouns:** the word's picture appears. "A dog is an animal. It names something, so it is a noun." The others are shown as well: "Run is something you do."
- **Verbs:** the dragon does it. "Fly. That is something the dragon does."
- **Adjectives:** the dragon changes as the word is said: it grows, turns green, sprouts spikes.
- **More Than One:** one becomes two on screen, and the word changes with them, with the changed letters lit.
- **Yesterday:** a calendar page flips back a day, and the verb changes as it lands.
- **Squeeze:** the two words slide together, the letters that drop out fall away, and the apostrophe lands in the gap. "The apostrophe goes where the letter came out."
- **Big Letters:** the name glows and its first letter grows. "Sam is a name. Names start with a big letter."

A second miss gets the fuller lesson: the rule said in one sentence, then two more examples played before the question comes back.

## Currency: Flames

Dragons make fire, and fire is what keeps an egg warm. He earns Flames, they burn in the roost's hearth, and he spends them on eggs, nests and gear. Dino Dig already pays in Gems, so this game does not.

- One Flame, many Flames. Add `FLAME` to `src/currency/kind.ts`.
- The icon is a small friendly flame: orange outside, yellow inside, with a dark red outline.
- When a Round ends, his dragon flies in and puffs the Flames onto the pile one by one, each with a soft whoosh.
- The hearth in the roost burns brighter the more Flames he has. It never goes out, even at none.
- Flames are never money. Nothing is priced in gold or coins.

## Voice

Aria at -8%, which the build guide says matters most for reading. Every word and sentence in the tables is a recorded clip, since the lessons say them. Single short words are where the voice goes wrong, so listen to a sample of every kind and add fixes to `SAID_AS`. Contractions need the most care (*we're* against *were*, *he's* against *his*). The currency lines are recorded with "Flames" (see the build guide's "Currency").

## The reward: the Roost, the Flight and the Eggs

He hatches dragons, raises them and flies them. Flat 2D. The dragons are friendly: round, bright and never frightening.

- **The loop.** A finished Round earns Flames and one Flight. Flames buy eggs, nests, tricks and gear. Each Round also warms every egg in a nest by one step.
- **Eggs.** An egg hatches after a set number of Rounds, three for the first and more for rarer ones. Hatching is tied to Rounds, so it cannot be bought out early.
- **Dragons.** Each is put together from parts: body, head, horns, wings, tail, colour, pattern and breath (fire, frost, sparks, bubbles, rainbow). When it hatches he names it by picking one describing word and one noun from two short lists (Spiky Storm, Tiny Ember). The words come from the game's tables and he is not tested on them.
- **Growing.** A dragon grows through three stages as he flies it: hatchling, young and great.
- **Tricks.** Each trick is a verb he has met: loop, dive, spin, roar, glide. He buys a trick and it becomes a button in the Flight.
- **The Flight (action, 2D canvas, from the side, about a minute).** A held finger sets the dragon's height as it flies over hills, lakes and castles. He holds a button to breathe and taps a trick button. He lights beacons, pops clouds, races birds and gathers a few Flames.
- **It cannot be failed.** Mountains and towers only bounce the dragon up and over. Nothing hurts it, and it breathes on beacons and clouds, never on people or animals.
- **The Roost.** A mountain with ledges. He buys nests, perches, a hot spring, a waterfall, a slide, a hearth, a treasure cave and a lookout. His dragons sleep, play and fly about.
- **Show off.** "Visit the roost": every dragon he has, wandering. Tap one and it does its tricks and its name is said.

Plan for at least 250 named things to earn from the first build, as the fixed catalogue under the endless layer described below: about 40 named dragons with their eggs, 30 tricks, 40 pieces for the roost, 30 saddles and pieces of gear, 30 colours and patterns for breath and trails, 24 places to fly, 30 toys and treats, and trophies. Economy defaults for the parent to confirm: one Flight per Round, the first one free on a starter dragon; the first egg within two Rounds; prices up to 100 in ones, then whole tens up to 400.

Use the glossary's words where they fit (Slot, Goal) and add the new ones (Flame, Egg, Roost, Flight, Trick, Hearth) to `GLOSSARY.md`.

## Never running out

The build guide's "Rewards that never run out" and "Competition" sections are requirements here. What follows is this game's own way of meeting them; refine it, but do not ship without an endless layer.

- **Wild eggs, made on the spot.** After the named dragons, every egg is generated from its number: eight kinds of part give far more dragons than he can hatch. The same number always gives the same dragon, so a reload shows the same egg. Rarer parts turn up the further he has got, and every fifth wild egg has a part that no bought egg has.
- **Flights made on the spot.** After the first places, each Flight's land is generated from its number: the hills, the weather, where the beacons are, day or night. Each is a little longer or twistier, and a test checks that every one can be finished.
- **The roost has no top.** He can always buy another ledge higher up the mountain, with room for more nests.
- **Dragons keep growing.** After the third stage, a dragon still earns a new mark (a stripe, a horn ring, a star on its wing) every so many Flights, with no last one.
- **Competition, if it is built:** a Dragon Race round a mountain against rival dragons, tuned by the guide's rules. His own best time on each Flight needs no rival.

## Look

A mountain at dawn: warm rock, pink and gold sky, deep green valleys, and dragons in bright single colours with pale bellies. Words in questions sit on stone tablets set in Andika. Icon: a dragon's head peeking from a cracked egg with a small flame above it.

Keep it apart from Sky Writer and Time Flies, where he flies a plane. A dragon flaps, glides and breathes, and it is alive: it grows, sleeps and has a name.

## Risks

- Grammar questions are easy to get subtly wrong, mostly through words with two jobs. The one-job rule and its test matter more than anything else here, and every sentence needs a second read by someone other than its writer.
- The allowed-word rule makes natural sentences hard to write. Write thirty first, read them aloud and judge them before writing the rest.
- If the on-screen terms differ from what his school uses, the game will confuse him. Ask the parent which words his class uses before recording.
- Dragons may not hold him the way vehicles do. The first build should get to a hatched, flying dragon within two Rounds so that is known early.
- Many dragons on the roost at once may be slow on the iPad 9. Cap what is drawn, not what he owns.
- The clip count is high, since every word and sentence is recorded. Report the count and the size against the site's budget of about 50 MB.
