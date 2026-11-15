# Spec: Wild Rescue (first-grade science, a rescue truck and a wildlife park)

Status: built on 2026-11-14 from `brief.md`, playable at `/wild-rescue/` with a tile on the landing page. Every decision below is a **default for the parent to confirm**. Not yet run on a real iPad.

A new learning game on the family site, built the same way as Rover Code and Treasure Fleet (`src/rover-code/`, `src/treasure-fleet/`), for the same player (6 to 7, reads numbers and short words, leans on the recorded voice, alone on an iPad 9). Short mixed Rounds earn Bolts, spent on his rescue truck and his wildlife park. Each Round also earns a Rescue call: he drives the truck out himself, does a hands-on job for the animal, and carries it home to its habitat in the Park.

It is the site's first science game, and the first that asks about **facts** rather than generating questions from rules. Every question is made from a hand-checked facts table (`src/wild-rescue/facts/`, plain data), and the research behind it is in `research/first-grade-science.md`, with a list of the facts a parent should check.

## Kinds

Five kinds, three Levels each. Stretch inside a Level is mostly how many choices there are. Everything is one tap, except "what does a plant need?", which is tap-all-then-Done.

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **Where It Lives** `home` | start | An animal; two habitats that are very different (ocean / desert) | Three habitats (four at full Stretch) | "A deer lives in the forest. Which of these also lives in the forest?" three animals |
| **Animal Parts** `parts` | start | "What does a bird use to fly?" Tap the part on a drawn animal (bird, fish, elephant, rabbit, turtle, giraffe; 15 questions) | "Why does a polar bear have thick fur?" three spoken sentence choices (17 animals) | "A raccoon uses its claws to climb. Which animal also uses claws to climb?" three animals (9 questions) |
| **Alive or Not** `alive` | Where It Lives L2 | "Tap the living thing!" one living thing among one to three that aren't | "What does a plant need to live?" / "...an animal...?" Tap all that apply, then Done | "This fish's bowl has no water. What does it need?" (6 scenes), three spoken choices |
| **Babies** `baby` | Animal Parts L2 | "This is a kitten. What will it grow up to be?" babies that look like their parents (9) | Babies that look different: tadpole, caterpillar, chick, cygnet | "How are the puppy and the dog the same?" / "...different?" three spoken sentences (7 pairs) |
| **Sky and Seasons** `sky` | Where It Lives L2 | "Is it day or night?" / "Tap the rainy picture!" | "Which season is this?" (a tree through the year) / "What do you need today?" (snowy, hot, rainy) | "What season comes after winter?" / "Where is the sun at noon?" / "When does the sun come up?" |

The brief's L1 for Babies says "match a baby to its parent"; it is asked as "What will it grow up to be?", which teaches the same thing in words a six-year-old uses.

**Choices are read out.** This is the one game where answer choices that are words or sentences are said: after the question, each one lights in turn as it's read ("Ocean." "Desert."; "To keep warm."), and each has its own 🔊. Pictures (animals, things, weather pictures, sun pictures) are not read. Taps wait until it has all been said.

**The rules the tests enforce** (`facts/facts.test.ts`, `science/problems.test.ts`, every kind × Level × Stretch × 200 seeds):

- **Exactly one right answer** among distinct choices.
- **One clear home.** Only animals with one clear habitat are asked about or live in the Park; habitats where some of an animal's kind also live (`notWrong`) are never offered as wrong (tree frogs, river dolphins, freshwater crabs...). Level 1 offers only a habitat from a "very different" table (symmetric).
- **Penguins and polar bears are never neighbours.** Polar animals carry a pole; "which also lives in the polar lands" only pairs animals from the same end of the Earth. In the Park the Polar Ice plot is split by water into North and South.
- **No trick cases.** No bats. Whales, dolphins, penguins and ostriches are kept out of every "which animal also..." question, and "To fly." is never a wrong choice for a bird that can't.
- **Hand-picked wrong choices** for every Animal Parts, Alive or Not, Babies and Sky question (the elephant is never told its trunk isn't for breathing; it snorkels with it).
- **A baby name belongs to one parent** ("calf" is only the cow's; "cub" only the lion's).
- **Needs**: a plant needs sunlight, water, air; an animal food, water, air, shelter. Food and shelter are never offered for a plant, sunlight never for an animal, soil never at all.
- **Cloudy is never asked for** (rainy and snowy pictures are cloudy too). The moon never means night. Morning and evening are never told apart by which side the sun is on.
- **A picture for every animal**: Apple emoji where it is clear and friendly, drawn in code otherwise. The table (`facts/animals.ts`, `art`) is tested: every animal has its own picture and every drawn one has a drawing. Drawn: sea turtle, dragonfly, woodpecker, ostrich, fennec fox, roadrunner, meerkat, rattlesnake, desert tortoise, walrus, arctic fox, snowy owl, plus the baby stages (tadpole, froglet, chrysalis, cygnet, young swan, pullet). Emoji: the other 50.

**Unlock order.** Where It Lives and Animal Parts open at the start. Alive or Not and Sky and Seasons open at Where It Lives Level 2, Babies at Animal Parts Level 2.

**Mastery (as Math Bots, Rover Code and Treasure Fleet).** 16 of the last 20 right on the first try, or the last 10 in a row; the first 30 questions of a kind asked at his Level use the quick rule (8 of 10, or 6 in a row). Levels never go down. A star at Level 3. **No Tune-Up and no Meetings**: the quick rule places him.

**Rounds.** Five answers, mixed across every open kind, never the same kind twice running while there's another. About one in three, and always the one right after a miss, is easier and doesn't count. A starred kind comes back about once a Round. A miss comes back later as a fresh question of the same kind and Level, with no Mastery credit. The same animal or picture is rarely asked twice in one Round. Bolts: one per answer right on the first try, plus one for finishing (shared `boltsFor`). A Round resumes after a reload (shared `place`).

## Teaching a miss

Never a red X: what he tapped just fades a little. Every miss teaches the fact with a picture and one plain sentence (`science/teach.ts`); the second miss (or the first, when he's been missing a lot) says a little more and leaves the answer glowing. 🔎 runs the fuller lesson on demand and counts as help.

- **Where It Lives:** the habitat he tapped is described ("A desert is hot and dry."), then the animal hops into its own habitat's picture: "A camel lives in the desert." The fuller lesson adds its did-you-know ("A camel can go a long time without drinking water.").
- **Which also lives there:** the animal he tapped appears with its home line ("A shark lives in the ocean."), then the right one joins the first.
- **Animal Parts:** the part lights up on the drawing and does its job (wings flap, fins wave, ears turn, legs hop): "A bird uses its wings to fly." A wrong part he tapped is shown doing its own job first. For "why", the job's picture pops beside the animal while the sentence is said.
- **Alive or Not:** "A rock is not living. It does not grow, and it does not need water or air." then "A frog is living." For needs, each need lights in turn while "A plant needs sunlight, water and air." is said. For the scenes, what was missing comes back into the picture (the bowl fills, the box opens to the sun).
- **Babies:** the baby grows into its parent in three steps (for a tadpole: tadpole, froglet, frog; for a caterpillar: caterpillar, chrysalis, butterfly), then "A tadpole grows up to be a frog."
- **Sky and Seasons:** the tree turns through the seasons and stops on the answer; the sun comes up, rises to noon and goes down, stopping on the answer, with a sentence at each step.

## The reward: the truck, the Rescue and the Park

**The loop.** A finished Round earns Bolts and one Rescue call (📻). Bolts build habitats in the Park and upgrade the truck; some upgrades open new terrain and bigger animals. A call is only ever for an animal whose habitat he owns and whose terrain and size his truck can manage, so no animal is ever left without a home. He starts with one free call, for a sheep for the free Barn.

**The truck (`park/shop.ts`).** Four slots, each a free starter and six upgrades, plus Paint. Every price is at most 100.

| Slot | Starter | Rungs 1 to 3 | Rungs 4 to 6 |
|---|---|---|---|
| Tires | Street Tires | Mud Tires 8 (forest), Sand Tires 20 (desert), Snow Tracks 35 (polar) | Big Tires 55, Monster Tires 75, Golden Tires 95 |
| Winch | Rope Winch | Steel Winch 8, Power Winch 22, Crane Arm 45 | Super Winch 60, Turbo Winch 75, Mega Crane 90 |
| Lights | Headlights | Roof Light 6, Light Bar 18, Big Siren 35 | Spotlight 55, Rainbow Lights 70, Star Beacon 85 |
| Carrier | Little Crate | Big Crate 10 (large animals), Boat Trailer 25 (ponds and rivers), Water Tank 45 (ocean animals) | Giant Trailer 65 (the biggest: elephant, giraffe, rhino, hippo), Animal Ambulance 80, Super Hauler 100 |
| Paint | Rescue Orange | Ranger Green, Sky Blue, Sunny Yellow, Fire Red 4; Grape Purple, Snow White, Night Black 6; Bubblegum Pink, Ocean Teal 8 | Zebra Stripes 10, Giraffe Spots 12, Jungle Camo 12 |

A better tire does the job of the ones before (Snow Tracks drive in the forest). The gear a call needs goes on the truck for that trip if he owns it but has something else fitted. Better tires drive a little faster; a better winch lifts in fewer taps (5 down to 2). The rest are for looks: the truck in the Garage, on the Home tile and on the Rescue canvas is one drawing (`art/truck.ts`) of what he fitted. As in the other games, a part he hasn't got goes on the truck to try, with Buy beside it; one he can't afford becomes his Goal. A part that opens rescues says so ("They can drive in the desert!").

**The Park (`park/Park.tsx`).** A map of seven habitat plots: Barn (free), Grassland 15, Forest 30, Pond 45, Desert 60, Ocean Pool 80, Polar Ice 100 (the brief's prices). Each has two Extras for looks (14 in all, 8 to 30 Bolts: Hay Bales, Tractor, Water Hole, Acacia Tree, Hollow Log, Mushroom Ring, Lily Pads, Cattail Reeds, Cactus Garden, Oasis, Coral Reef, Seashells, Ice Cave, Northern Lights), and the path takes 11 Decorations (4 to 80: Flower Beds, Benches, Lamp Posts, Picnic Tables, Fountain, Butterfly Garden, Gift Shop, Animal Hospital, Lookout Tower, Park Train, Hot Air Balloon). His animals wander their plots; tapping one plays a little made-up sound and its did-you-know line; with 🧺 Feed on, a tap gives it its snack (a real food for it). Tapping a habitat says what it is like, "Rescue animals to fill it!", or, if the truck can't reach its animals yet, "Your truck needs Sand Tires." Nothing here can be lost.

**45 animals to rescue**, five to eight a habitat (the brief's 24, doubled): sheep, chicken, pig, goat, cow, horse, donkey (farm); lion, zebra, giraffe, elephant, rhino, bison, kangaroo, ostrich (grassland); bear, chipmunk, deer, raccoon, moose, wolf, woodpecker (forest); frog, beaver, swan, hippo, crocodile, dragonfly (pond); camel, fennec fox, roadrunner, meerkat, rattlesnake, desert tortoise (desert); sea turtle, octopus, crab, shark, dolphin, pufferfish (ocean); polar bear, penguin, walrus, arctic fox, snowy owl (polar). The whale and the jellyfish are asked about but not rescued.

**The call.** The radio crackles over a siren: "Calling all rangers!" and the animal's own call ("A sea turtle is caught in a fishing net!"), with a picture of the animal in its habitat. He taps Go. The next call is from the habitat with the fewest animals so far, so a newly bought habitat fills first.

**The Rescue (`rescue/`, 2D canvas, no 3D, no physics library).**

1. **The drive, from the side.** Hold anywhere on the picture to drive; ⤴ (at the right, above the bottom band) jumps. Each habitat lays its own road (mud and a log on the farm, rocks and a stream in the grassland, logs and mud in the forest, streams in the pond, sand and dunes in the desert, sand and a tide pool on the beach, snow and a crack in the ice in the polar lands). Mud, sand and snow slow the truck to half, a stream to a third with a splash, a log or a rock bounces it and slows it, but while he holds, it always moves. Four Bolts hang over the road, two low and two for a jump. About 9 seconds holding on.
2. **The job, close up.** Pull: drag the net (or string, or web) off; each tap on it pulls it a quarter, so a drag isn't needed. Lift: tap the winch until the animal is out (5 taps with the rope winch, 2 with the Mega Crane). Lead: tap the animal's three treats in order and it walks to each and eats it. Nothing can be failed; a wrong tap just does nothing.
3. **Home.** "Into the crate! You did it!", the Bolts, and the truck turns round and drives home on its own with the animal riding in the crate. The Park opens with the animal in his hands: "Carry it to its home!"

**Placing it.** He taps a habitat. After four seconds the right one starts to glow, softly. A wrong one (or one he hasn't bought) just has the animal shake its head and stay in his hands: "Not here!" The right one takes it: "Welcome home! A camel lives in the desert. A camel can go a long time without drinking water." It's never a test: no misses are counted. An animal in his hands stays there through a reload (it's in the save), and the Start tap takes him straight to the Park.

**Release.** Once every animal his truck can reach is home, a call is a release: the same call, drive and job, then "This one is going back to the wild." and it runs off. It pays the same; the Park keeps what it has. (With everything bought, all 45 are home and every call is a release.)

**Economy defaults, for the parent to confirm.**

- One call per finished Round; one free call to start. Calls don't expire.
- A Rescue pays at most 4 Bolts, for the Bolts picked up on the drive (`DRIVE_BOLTS` in `park/rescue.ts`). A Round pays at most 6.
- The call is used, and the Bolts paid, only when the animal is in the crate. Leaving halfway (🏠 twice) costs nothing and pays nothing. A reload during a Rescue lands at the Garage with the call still there.
- **Everything together costs 2,145 Bolts**: truck parts 1,182 (tires 288, winch 300, lights 269, carrier 325), paints 84, habitats 330, extras 252, decorations 297. Reaching all 45 animals needs the six habitats and seven pieces of gear: 538 Bolts, roughly 55 Rounds and Rescues. The rest is more to earn, not bigger payouts, as the parent asked after Rover Code.
- **The first steps:** the free call (a sheep), then the farm's small animals; the cow, horse and donkey need the Big Crate (10, the first Goal), then the Grassland (15). The Goal is always the cheapest thing that brings the nearest new animal closer.

**Controls stay off the edges**, as Math Bots' fight learned: the jump and winch buttons sit at the right above a floor of at least 56px and 28px in from the side; driving is a hold anywhere on the picture.

## Look

Ranger green and khaki with a bright orange truck, in the family look: Bungee titles, Nunito for reading, 4px black outlines, solid drop shadows that press in. Habitats, the sky, the seasons and the needs scenes are small SVG scenes drawn in code (`art/Pics.tsx`); the six part diagrams are drawn with each part a separate tap target (`art/Diagram.tsx`). Icon: the orange truck with its light bar on and a paw print on the door, a fennec fox looking out of the crate, on a ranger-green sunburst.

## Voice

Aria at -8%, recorded with `tools/make_voice.py --collection wild-rescue` (edge-tts): **734 clips, 11.6 MB** in `public/wild-rescue-voice/` (the most sentences of any game; Treasure Fleet has 513 clips and 7.6 MB, Sight Squad 30 MB). Questions, lessons, did-you-know lines and calls are whole sentences from the facts tables (so a fact is worded once). Prices and counts are chained from number clips ("It costs", "45", "Bolts."), a bought thing from "You got" and its name.

## Save

`wild-rescue-save`, version 1 (a version it doesn't know reads as a blank save), and `wild-rescue-place` for the screen and the Round in progress.

## Open questions for the parent

1. The facts: please read `research/first-grade-science.md`, especially "Facts I'd most like a parent to check" and the simplifications (one Polar habitat, penguins and snowy owls in it, seasons as most of the U.S. sees them).
2. Does his class say "fall" or "autumn"? "Grassland" or "savanna"? "Polar" or "Arctic"?
3. Should a Rescue pay Bolts at all, or just bring the animal home?
4. Is 2,145 Bolts of content the right size, given he bought everything in Rover Code within a day? It's about 215 Round-and-Rescues at full pay.
5. Should he choose which animal to rescue (a list of calls), rather than the game picking the habitat with the fewest animals?
6. Are made-up animal sounds right in the Park, or should tapping only say the did-you-know line?
7. Is the 16-of-20 Mastery rule too slow for kinds this short? The other games use the same.

## Not done

- Not run on a real iPad 9 or iPhone, or in Safari. Checked in Chromium at 810×1080, 1080×810, 390×844 and 844×390 (`tools/wild-rescue/tour.ts`), on a new save and on saves with every kind open at Level 2 and at Level 3, and offline on the production build (`tools/wild-rescue/offline.ts`). Not in WebKit.
- The voice clips were recorded but not listened to: there was no way to play audio here. The single words most likely to slip are listed in the report.
- Emoji were seen as Apple draws them (Chromium on a Mac uses Apple's set), but 🫎 moose, 🫏 donkey and 🪼 jellyfish need iPadOS 16.4 or later.
- No Trophies, no Legendaries, no per-fact strength tracking (Sight Squad's per-word strength), no real animal sounds.
- "What it eats", "how it moves" and "its covering" are in the animals table but not asked by any kind (the brief's kinds don't ask them).
- Releases don't remove the animal from the Park, by design; there is no "visit" to a specific animal.
