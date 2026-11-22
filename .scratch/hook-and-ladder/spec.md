# Spec: Hook and Ladder (word meanings; build a fire engine and answer calls)

Status: built on 2026-11-17 (pass 1 of 3: build), playable at `/hook-and-ladder/` with a tile in **Learning Games**. Every decision below is a **default for the parent to confirm**. Not yet run on a real iPad. The name is still the brief's working name.

A new learning game on the family site, built the same way as Rover Code and Sentence Express (`src/sentence-express/` is the closest model: a reading game with Andika and a word clip for every word), for the same player (6 to 7, reads numbers and short words, leans on the recorded voice, alone on an iPad 9). Short mixed Rounds earn Bolts, spent on fire engines and their parts at the Station. Each Round also earns a Call: he drives out, sprays the fires with his hands and raises the ladder, and the Town says thank you.

## What the standards say (researched before the kinds were fixed)

| Skill | Common Core | TEKS (Texas) | So, for a first grader |
|---|---|---|---|
| Compound words | **Grade 2**, L.2.4d: "use knowledge of the meaning of individual words to predict the meaning of compound words" | **Grade 1**, 110.3(b)(2)(B)(iv): "using knowledge of base words to decode common compound words"; Grade 2 decodes and spells them | A stretch in Common Core, on grade in Texas. Kept, with Level 1 all pictures. |
| Opposites (antonyms) | **Kindergarten**, L.K.5b: "relating [verbs and adjectives] to their opposites (antonyms)" | **Grade 2**, 110.4(b)(3)(D): "antonyms, synonyms…"; not named in Grade 1 | Review in Common Core, early in Texas. Kept, open from the start. |
| Sorting into categories | **K**, L.K.5a (sort objects) and **Grade 1**, L.1.5a ("sort words into categories (e.g., colors, clothing)") and L.1.5b ("define words by category and by one or more key attributes (e.g., a duck is a bird that swims)") | **Grade 1**, 110.3(b)(3)(D): "words that name … categories" | On grade in both. Level 3's second form ("Which animal can fly?") is L.1.5b. |
| Endings -s, -ed, -ing | **K**, L.K.4b (inflections as a clue) and **Grade 1**, L.1.4c: "root words (e.g., look) and their inflectional forms (e.g., looks, looked, looking)"; L.1.1c (singular and plural nouns) | **Grade 1**, 110.3(b)(3)(C): "the meaning of words with the affixes -s, -ed, and -ing"; (b)(2)(B)(v) decodes -ed, -s, -es | On grade in both. Every example in the standards is a word that doesn't change its spelling. |
| Shades of meaning | **K**, L.K.5d (verbs, by acting out); **Grade 1**, L.1.5d: "verbs differing in manner (e.g., look, peek, glance, stare…) and adjectives differing in intensity (e.g., large, gigantic)"; **Grade 2**, L.2.5b | Not in Grade 1; Grade 2 has synonyms, and -er/-est | On grade in Common Core. The last kind to open. |

Sources: [CCSS Language K](https://www.thecorestandards.org/ELA-Literacy/L/K/), [Grade 1](https://www.thecorestandards.org/ELA-Literacy/L/1/), [Grade 2](https://www.thecorestandards.org/ELA-Literacy/L/2/); [19 TAC §110.3 (Grade 1)](https://www.law.cornell.edu/regulations/texas/19-Tex-Admin-Code-SS-110-3), [§110.4 (Grade 2)](https://www.law.cornell.edu/regulations/texas/19-Tex-Admin-Code-SS-110-4).

What the research changed: Endings uses **no word that changes its spelling at any Level** (the brief allowed hop/hopping or bake/baked at Level 3 "or not at all if the research says so": no first-grade standard asks for them, and doubling and dropping e are spelling rules that come later), and no -es (box, boxes) either. The kinds and Levels are otherwise the brief's.

## Kinds

Five kinds, three Levels each. Every word he sees is in Andika on a cream tile and is also said: the prompt as it appears, then each choice in turn, lit orange while it's read (the brief says the skill is meaning, not decoding, so word choices are read aloud here, unlike Math Bots).

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **Two Words, One Word** `join` | start | "fire" + "truck" shown and said; tap the picture of the word they make (2 pictures; 3 at Stretch 2). The wrong picture shares no half with the right one. | A compound in big letters; tap where it splits (the gap nearest his finger). | "rain and what makes a real word?": bow, or two **silly halves** (dog, cup) |
| **Opposites** `opposite` | start | "Tap the opposite of hot", 2 pictures (3 at Stretch 2) | "What is the opposite of hot?", 3 spoken words, no pictures | "The soup is not hot. It is... Tap the opposite of hot.", 3 words that each describe something (without the last part, "The towel is not wet. It is... soft" was true too) |
| **Sort It** `sort` | Opposites L2 | "Tap all the animals!" among six pictures (2 to 3 belong; up to 4 at Stretch 2), then ✓ | "Which one does not belong?" among four | "A dog, a cat and a cow are all...": animals / food / clothes; or a question about one thing in a group: "Which animal can fly?" |
| **Endings** `ending` | Two Words L2 | One dog, or two or three: "dog" or "dogs" | "Yesterday he ___." / "Right now he is ___." / "Every day he ___.": jump, jumped or jumping | "Which word is hiding in jumping?": jump, and two other words that aren't in it |
| **Strong Words** `strong` | Sort It L2 | "Which is bigger, big or huge?" | "Which is the loudest: whisper, talk or shout?" | Put three in order, from a little to a lot (tap them into three slots that grow); the instruction never names a word in the set ("from warmest to coldest", not "from cool to freezing") |

The content is in `src/hook-and-ladder/words/`, plain tables with no game code: `compounds.ts` (44 compounds, 26 with a picture), `opposites.ts` (70 one-way entries, 20 with pictures, 26 with a sentence), `sorting.ts` (5 groups, 77 things, 17 questions about one thing), `endings.ts` (22 things to count, 18 actions), `strong.ts` (8 three-word sets and 8 pairs), `pictures.ts` (one emoji per word). Where a word is on the Dino Dig or Sight Squad list it was preferred (dog, cat, cup, hen, bug, pig, jump, look, help, play, big, little, up, down...).

### Rules the tests enforce (`words/words.test.ts`, `quiz/problems.test.ts`)

- **Exactly one choice is right**, in every kind, Level and Stretch, over 300 seeds each; every choice is an answer; a stray tap isn't.
- **Compounds** are only ones made of their two halves (fire truck, rainbow, football, bedroom); a list of misleading ones (butterfly, ladybug, hot dog, starfish, pineapple, cupboard...) can't appear. **Level 2** uses only compounds that split one way into two real words (seashell is out: "seas" + "hell"; sunglasses: "sung" + "lasses"). **Level 3**'s silly halves never make a real word with the first half: `ALSO_REAL` lists the real words a first half makes beyond the table (rain + coat, sun + hat, pop + gun, bed + bug...), and every offer is checked against it.
- **Opposites** have one clear opposite, written one way round; the other way round is its own entry only when it's clear too (short, light, right and old are never asked). A wrong choice comes only from another **group** that isn't **kin** (the opposite of high is low, so up and down never sit beside it), and never from the entry's **fair opposites** (cool and chilly for hot are never offered). A group can be kin to several others, and a word in any kin group is kept out even when another group has it too (light is dark's opposite and heavy's). The review pass added kin for near misses a child could fairly pick (float: heavy or down; day and night: dark or light; tall: low; long: near; sit and asleep: up; laugh: quiet; happy: bad; on: out or under; yes: never; win and front: last), and a test lists them.
- **Sort It** uses only things in exactly one group: no tomato, bat, penguin, fish, chicken, orange, corn, nut. A question about one thing lists what it's true of and what it's clearly false of; only those are offered (no penguin, bat, chicken or duck in "can fly").
- **Endings** uses regular words only: nothing irregular, no -es, nothing that doubles, drops an e or changes y to i; "Every day he ___" and "Right now he is ___" never offer the -ed form ("Every day he jumped" and "Right now he is kicked" can both be fair sentences).
- **Strong Words** sets are three different words weakest first, from a short hand-checked table; no pair says the opposite of another.
- **Pictures**: no two words share an emoji, and none is newer than Emoji 14 (iPadOS 15 on the iPad 9 draws them all), and none is a joined emoji.

**The parent should read the Strong Words table** (`words/strong.ts`) and the opposites' fair-answer lists before this ships: they are the arguable content. Sets dropped while building because they were arguable: giggle/laugh (louder?), drip/pour, big/huge/giant (huge vs giant), glad/happy/thrilled.

## Mastery, Rounds and unlocking (as Sentence Express)

16 of the last 20 right on the first try, or 10 in a row; the first 30 questions of a kind use the quick rule (8 of 10, or 6 in a row). Levels never go down. No Tune-Up: the quick rule places him. Rounds are five answers mixed across every open kind, never the same kind twice running while there's another; about one in three, and always the one after a miss, is easier and doesn't count; a starred kind comes back about once a Round; a missed question comes back later as a fresh one of the same kind and Level with no credit. Bolts: one per answer right first try plus one for finishing (shared `boltsFor`). A Round resumes after a reload (shared `place`).

## Teaching a miss

Never a red X (the wrong choice greys and shakes, as in every game). First miss: "Not quite!", the lesson, "Try again!". Second miss (or the first when he's been missing a lot): "Let's look together." and a fuller lesson that leaves the answer glowing. 🔎 runs the fuller lesson and counts as help.

- **Two Words, One Word**: the two halves (with their pictures where they have one) slide together and the compound's picture pops up beside them while "fire. truck. fire truck." is said; the fuller lesson adds "Two words make one word!" and "rain and bow make rainbow". At Level 2 the word comes apart at the right gap ("It splits here."). At Level 3 his wrong half is tried first ("rain dog is not a word.").
- **Opposites**: the word and its opposite side by side, with pictures where they have them, said one after the other; fuller: "hot and cold are opposites."
- **Sort It**: the things that belong drop into a box and the group is named ("These are all animals."), then the one that doesn't belong ("shoe is not an animal."). For a question about one thing, the right one glows: "owl. It can fly!"
- **Endings**: the word, then the ending as its own yellow tile joining it ("dog" + "s"), with the picture showing one or more and "Just one." / "More than one."; for a sentence, a ✅ (it already happened), ▶️ (it is happening now) or 📅 (it happens every day) with its line; for "hiding in", "jumping has jump hiding in it."
- **Strong Words**: "From a little to a lot!", then the words appear on a bar that grows from small to big, weakest first, each said in a matching voice size (the clip plays at 30%, 60% and 100% volume, and the word grows); fuller: "huge is bigger than big."

## The reward: the Station, the Call and the Town

**The loop.** A finished Round earns Bolts and one Call (🚒). Bolts buy trucks, parts and things. A Call he hasn't answered before adds its badge to the Station wall and its building to the Town, and the next Call is the next new scene. He starts with one free Call (the Trash Bin), so he sees the reward before his first purchase.

**The Station (`station/StationScreen.tsx`).** His truck in its bay (drawn in code from its parts, the same drawing as the Call), the wall of 16 badges, the things he's bought for the Station, the big red Call button (with the next scene's badge and his Calls), 🏙️ Town and ▶ Play. Twelve tabs: Trucks, Pump, Hose, Ladder, Tank, Nozzle, Siren, Lights, Paint, Crew Buddy, Station, Town. As in Rover Code's Space Base, a tile he hasn't got goes on the truck to try, with its name, what it does and its price said, and Buy beside it; buying fits it. The Goal is the cheapest part that helps at the Call (a Rung or a truck), or the one he tapped and couldn't afford.

| What | How many to buy | Prices (Bolts) | Does |
|---|---|---|---|
| Trucks | 7 (+ the Pumper free) | 25 to 100 | each has a trick at the Call: Ladder Truck (+2 floors of ladder), Tanker (twice the water), Rescue Truck (ladder 2.5× faster), Brush Truck (grass and tree fires go out 4× faster), Airport Crash Truck (foam, every fire twice as fast), Fireboat (never runs dry), Fire Helicopter (a 🪣 Drop button puts out the highest fire every 4 seconds, and its rope ladder reaches any floor) |
| Pump | 5 Rungs | 8 to 75 | how high the water reaches: floors 3, 4, 5, 6, 7, 9 at the far side of a building |
| Hose | 5 | 6 to 64 | how wide the spray is and how much water a second |
| Ladder | 6 | 10 to 100 | how many floors it climbs: 2 to 8 |
| Tank | 5 | 6 to 64 | seconds of spray before a 1.6-second refill: 4 to 18 |
| Nozzle | 7 | 12 to 60 | Fan (wider), Foam (35% faster), Twin (two streams), and Bubbles, Rainbow, Glitter, Snow (look only) |
| Siren | 7 | 5 to 30 | Wail, Yelp, Hi-Lo, Whoop, Air Horn, Fire Bell, Big Horn, Silly Honk (made in code) |
| Lights | 9 | 5 to 40 | the light bar's colour and flashing (rainbow and disco cycle) |
| Paint | 24 | 4 to 20 | 14 colours and 10 patterns (racing stripes, dalmatian spots, candy stripe, tiger, zebra, camo, flames, rainbow, galaxy, lava) |
| Crew Buddy | 14 (+ the dalmatian free) | 8 to 90 | who rides in the cab window (the dalmatian is drawn; the rest are emoji) |
| Station things | 26 | 5 to 60 | on the Station wall |
| Town things | 18 | 5 to 85 | in the Town's park |

That is **133 things to buy for 3,496 Bolts, plus 16 badges and 16 buildings from Calls: about 150 things to earn.** No price is over 100 (the most the recorded numbers say).

**The Call (`call/`, a 2D canvas, from the side).**
1. **The drive** (4 seconds): his truck rolls along a street that scrolls past, lights flashing, with a big red 🚨 Siren button (his own siren sound; cars ahead pull over while it sounds). "Wee-oo! Off to the Barn! Tap the siren!"
2. **The scene**: his truck parks on the left; the scene stands on the right. "Drag your finger to spray!" He holds a finger anywhere and the hose aims at it: the water leaves the nozzle at the Pump's speed on the flattest arc that passes through his finger, as a stream of drops, and a fire it lands on shrinks and goes out with steam. A ring shows where it's going (yellow when it can't get there). The tank gauge runs down while he sprays and refills by itself. "Tap them to send the ladder!": tapping someone at a window swings the ladder up to them; they hop in the basket, ride down and join the cheering crowd ("Thank you!").
3. **It can't be failed.** Fires never spread, nobody is hurt, there's no clock. A fire the water can't reach yet says so once ("A stronger Pump will reach that one!"), and so does someone the ladder can't reach ("A longer Ladder will reach them!"), and an empty tank the first time ("A bigger Tank sprays longer!"). Once everything his parts reach is done, "Here comes help!": a helper helicopter puts out the rest and lifts the rest down, one a second, and he still finishes.
4. **The thank-you**: "All the fires are out!", the scene's badge, a Thank you! sign, 3 Bolts, and for a new scene "You got a new badge! It is in your Town now!" Then the Station, Call again (if he has another) or ▶ Play.

**The sixteen scenes** (`call/scenes.ts`), taller and stranger: the Trash Bin, the Little House, the Barn, the Car, the Forest Edge, the Bakery, the School, the Tree House, the Ship at the Dock, the Tall Building, the Castle, the Airport, the Lighthouse (at night), the Hotel (7 floors), the Skyscraper (8, at night), the Rocket Pad. The first four need nothing he has to buy; the best parts reach every fire and everyone in all sixteen (tested). With starter parts a real child's Call should take roughly 30 to 60 seconds (a scripted perfect player takes 3 to 12 seconds of spraying).

**The Town (`station/TownScreen.tsx`)**: a lot for each scene; one he has answered stands there as its badge with a Thank you! sign; the rest are building sites. Tapping a building says its thank-you and makes it his next Call ("Next call: the Barn"). Town things stand in the park along the bottom.

**Water on the iPad 9.** The drops are a fixed pool of 220 (`MAX_DROPS`), drawn as one path; smoke is worked out from the clock, not kept; splashes are capped at 40; the still part of the scene is drawn once per size. Chromium holds 60 fps (worst frame 17 ms) on every scene in the tour; see "Not done" for the iPad.

**Economy defaults, for the parent to confirm.**
- One Call per finished Round; one free Call to start. Calls don't expire.
- A Call pays 3 Bolts (`CALL_BOLTS` in `station/station.ts`), new scene or not. A Round pays at most 6. A Call is used, and paid, only when it's finished: leaving halfway (🏠 twice) costs nothing and pays nothing; a reload during one lands at the Station with the Call still his.
- After all sixteen, Call goes round them again (or to the one he picks in the Town).
- Parts never gate a scene: every scene is reachable from the start, and the helpers finish what he can't reach yet. The pull to buy parts is doing it all himself, and the line that names the part.

## Look

Fire-engine red, brass yellow and night blue, with warm window light: the family look (Bungee titles, Nunito, 4px black outlines, chunky drop shadows). Home's Play is a red FIRE call box whose big green button is ▶; the Station tile shows his truck in its bay; the Town tile his last few badges. Question screens are a warm cream card. Icon: a red ladder truck with its ladder up against a cream letter tile with a lowercase "a", on night blue with a warm glow. Trucks are drawn in code from their parts (`art/truck.ts`), and the one in the Station is the one at the Call.

## Voice

Aria at -8%, as the guide says for reading games, recorded with `tools/make_voice.py --collection hook-and-ladder`: 933 clips (12 MB) in `public/hook-and-ladder-voice/`, trimmed as they decode and chained as in Sentence Express. Every content word is its own clip (432 single words). Fixes found by transcribing every single word with Whisper small.en (`COLLECTION_SPEECH['hook-and-ladder']` in `make_voice.py`): **cat, key, duck, before, bear, grapes** (and **cats, keys, ducks**, so each Endings pair is one voice) are said in Jenny's voice, because Aria's came back "Kate", "he", "dack", "the four", "there", "crepes" however they were written (Word Wreckers did the same for cat); **bow** is recorded as "beau", because alone Aria rhymes it with cow and the bow in rainbow rhymes with go; **owl** as "owl." so it keeps its l. Every other single word came back as written or as a homophone (sea/C, weak/week, pear/pair, eye/I, peek/peak, bee/B, high/hi). **ant** was taken out of Sort It (heard as "and" in nearly every spelling in both voices, and a six-year-old may not call it an animal). The review pass checked the single words again with Whisper large-v3-turbo as well as small.en; see its report for the clips still worth a listen.

**The Endings check** (the brief's go/no-go): every form of every action (jump, jumps, jumped, jumping...) and every thing and its plural was transcribed with Whisper small.en: all 116 came back as written except homophones and the three words above (rolls → "Roles", pulls → "Polls", ducks → "Dux", hens → "Henz", talked → "Tocked"). The pairs sound clearly different, so the kind ships. See the report for the rest of the single words.

## Save

`hook-and-ladder-save`, version 1 (a version it doesn't know reads as a blank save; anything fitted he doesn't own falls back to the starter), and `hook-and-ladder-place` for the screen and the Round in progress (the shared `src/save/place.ts`, as every game; it is not versioned itself, but anything in it that doesn't read is dropped).

## Open questions for the parent

1. Is one Call per Round right, and should a Call pay Bolts at all (3 now)? A Round and a Call together pay at most 9.
2. Should parts gate the taller scenes (as Rover Code's Power gates planets), instead of the helpers finishing what he can't reach?
3. Are the Strong Words sets right (`words/strong.ts`)? Especially walk/jog/run ("fastest"), peek/look/stare ("longest") and tap/knock/bang ("loudest"). And is "From a little to a lot!" the right instruction for putting them in order?
4. Should word choices be read aloud (they are now, every one, because the skill is meaning)? It makes each question longer to hear.
5. Compound words are Grade 2 in Common Core. Keep the kind open from the start, or open it after Opposites?
6. The name "Hook and Ladder".

## Not done

- Not run on a real iPad 9 or iPhone, nor in Safari or WebKit. Checked in Chromium at 810×1080, 1080×810, 390×844 and 844×390 (`tools/hook-and-ladder/tour.ts`), on a new save and on saves with every kind open at Level 2 and at Level 3.
- The 60 fps is Chromium on a Mac, not the iPad 9; most needs checking there: the Call with the Super Hose on the Skyscraper (the most drops and fires at once).
- The voice clips have not been listened to by a person; single words were checked by speech-to-text only.
- No Trophies, no Legendaries, no per-word strength (Sight Squad's) or "met before it's asked" rule: words are chosen at random within a Level.
- The Town is the badges on lots, not drawn buildings; the Station things are emoji on the wall. Both are for the design pass.

## More to earn (2026-11-21)

He had maxed out everything: every truck and part, all sixteen Calls. The parent asked for better rewards, different fire trucks, engines and features, more fires (made on the fly, or the old ones again), and other firefighting vehicles such as planes and helicopters. As with Rover Code, Deep Light and Turbo Tally, that meant **more to earn, not bigger pay**: Round pay, Call pay and every old price are unchanged, and every price stays at or under 100 (the recorded numbers).

- **Vehicles, 8 → 25**, one at a time, each with a trick (`call/sim.ts` TRICKS). **Trucks** (15): Mini Pumper (refills in a blink), Quint (+1 floor of ladder, 1.5× water), Steam Engine (water 1.6× as strong), Tower Truck (sprays from the top of its boom), Monster Fire Truck (two hoses), Robot Truck (sprays by itself when he isn't), Jet Truck (a giant wide spray), Fire Train (three tanks), as well as the eight he had. **Aircraft** (a new tab, sharing the vehicle's place): hovering ones hang beside the scene, as high as the screen allows, spray from there (so they reach higher than a truck with the same Pump), and their rope ladder reaches any floor: Fire Drone (closer in), Fire Blimp (higher, 2.5× water), Jet Pack (rescues 3× as fast), Twin Rotor Helicopter (🪣 Drop puts out the two highest fires), Sky Crane (three), Fire Helicopter (one; moved here from Trucks, and an old save keeps it). **Planes** fly wherever his finger is and drop the water, which falls down the front of a building onto every fire under it; tapping someone sends a parachute: Water Bomber, Air Tanker (a giant wall of water). 
- **Engine** (a new Rung, 6 to buy, 10 to 100): a quicker drive, a faster ladder, and its exhaust on the drive (puffs, a blue flame, a jet flame, a rocket, a rainbow).
- **More Rungs**: Pump to 12 floors (Rocket, Thunder, Sky), Ladder to 10 (Cloud, Space), Hose (Mega, Giant), Tank (Whale, Planet).
- **Gadgets** (a new tab, 10 to buy, 8 to 70), switched on or off with no limit, on every vehicle: Brass Bell, Fire Flag, Spotlight (a beam at night), Smoke Fan (no smoke), Party Popper (more confetti), Turbo Ladder (twice as fast), Water Trailer (1.5× water), Rescue Drone (flies down someone the ladder can't reach), Roof Cannon (another stream), Hydrant Hookup (the water never runs out).
- **More looks**: 8 nozzles (hearts, stars, confetti, slime, chocolate, sprinkler, a Water Cannon 1.7× as strong, triple), 5 sirens (robot, train whistle, laser, tune, spooky), 6 lights, 14 paints (7 new patterns), 15 buddies, 13 Station things, 15 Town things.
- **16 more Calls** (32): the Campfire, the Hay Field, the Pizza Shop, the Toy Store, the Library, the Zoo, the Train Station, the Windmill, the Mountain Cabin, the Hospital, the Dinosaur Museum, the Circus, the Stadium, the Big Forest Fire, the Giant Tower (10 floors) and the Volcano Island, with new people to save (a chef, a teddy, a monkey, a penguin, a clown, a bear cub...). The best parts still reach everything in every one (tested).
- **Star Calls** (going back): tapping a building in the Town makes it the next Call, one star hotter than he has won there (`heated()`): each star adds two fires (windows, roofs, trees, then the ground, spreading the scene along the street if it must); the second adds someone to save; the third is at night with fires that come back once. A new star pays 3 + 2 Bolts. 96 stars in all, shown on the badges and the Town's lots.
- **Mystery Call** (made on the fly): opens after sixteen Calls, and Call goes there when there are no new ones. An endless ladder of streets made up from the Level (`mysteryCall()`): one building at first, up to three of ten floors, more fires and people, night every third Level, flaring fires from Level 4. Pays 4 Bolts; every fifth Level wins one of **ten prizes** that can't be bought (Fireworks Lights, Super Hero buddy, Diamond paint, Golden Nozzle, Hero Horn, Golden Fire Engine, Golden Crown, Hero Hall, Super Jet, Hero Cape), shown in the tray as ❓ and the Level.
- **Totals**: the shop is 246 things for 8,039 Bolts (was 133 for 3,496), plus 32 badges, 96 stars, 10 prizes and the endless Mystery Call.
- **Save** stays version 1 with additive fields (`gadgets`, `stars`, `mystery`; `next` is now `{id, heat}`, and an old scene id reads as heat 0). `truck:heli` reads as `air:heli`.
- **Voice**: 198 new clips (1,129 phrases), transcribed with Whisper small.en: all came back as written except spacing ("Jetpack", "Superjet"), homophones (canon, Flickr) and two that were fixed: **Grape** (heard "crepe", now Jenny's voice like grapes) and the Tower Truck's line (heard "host", reworded to "It sprays water from way up high!").
- **Checks**: a test plays every vehicle on every Call with the starter parts and with the best parts and every gadget; every Star Call at every heat with a truck, a plane and a helicopter; Mystery Levels 1 to 60. `tools/hook-and-ladder/vehicles-sheet.ts`, `scenes-sheet.ts` and `ui-shots.ts` draw every vehicle, every scene and the screens. The tour passes in all four views at 60 fps in Chromium.

**Open questions for the parent**
1. Should the Mystery Call open sooner than sixteen Calls (it opens at once for him, since he has answered all sixteen)?
2. Are the planes too strong? They reach every fire and everyone, whatever the Pump and Ladder.
3. Prices are still capped at 100. Turbo Tally went above 100 (whole tens, with a clip each) when asked; the same could be done here for the top vehicles.
