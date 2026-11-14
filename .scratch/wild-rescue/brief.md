# Brief: Wild Rescue (first-grade science, a rescue truck and a wildlife park)

Status: ready-for-agent

Read `.scratch/new-games/build-guide.md` first. It covers the player, the shared engine, wiring, voice, verification and the final report. This brief covers only what is particular to Wild Rescue. Slug: `wild-rescue`.

## Why this game

The site has no science. First-grade science is mostly about living things and the sky: how animals use their body parts, how young animals resemble their parents, what living things need, and the patterns of the sun, the seasons and the weather (NGSS 1-LS1-1, 1-LS1-2, 1-LS3-1, 1-ESS1-1, 1-ESS1-2, with K-ESS2-1 weather as a base).

## What makes this game different

Every other game on the site generates its questions from rules. This one asks about facts, so it runs on a curated table of facts that must be true and unambiguous. Getting that table right is most of the work.

Build `src/wild-rescue/facts/` as plain data with no game code:

- **About 40 animals**, each with: its habitat (one of ocean, pond and river, forest, grassland, desert, polar, farm), what it eats (plants, animals or both), how it moves, its covering (fur, feathers, scales, skin, shell), its baby's name where the baby looks different, and two or three body parts with the job each does.
- **A needs table** (food, water, air, shelter; sunlight for plants) and a **living / not living** list.
- **Seasons and weather:** what each season looks like, what people wear, what the sky does through a day.

Accuracy rules, each checked by a test or a written review in the spec:

- An animal is only used for a habitat question if it has one clear habitat. Leave out animals that live in several, or keep them out of that kind.
- Polar is one habitat for this age, but penguins and polar bears are never shown as neighbours or offered as "lives with".
- Wrong choices must be plainly wrong, not arguable. "Which animal has fur?" never offers two mammals.
- No trick cases: bats, whales, platypuses and penguins stay out of "does it fly / is it a fish / does it lay eggs" questions until Level 3, and only where the lesson explains them.
- Write a short `research/first-grade-science.md` in `.scratch/wild-rescue/` listing your sources for anything you were not certain of. Flag every fact you would want a parent to check.

## Kinds

Defaults; refine and record in the spec.

| Kind | Opens | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| **Where It Lives** `home`: an animal; tap its habitat | start | 2 habitats, very different (ocean / desert) | 3 to 4 habitats | "Which of these also lives in the forest?" |
| **Animal Parts** `parts`: what a body part is for | start | "What does a bird use to fly?" tap the part | "Why does a polar bear have thick fur?" 3 spoken choices | "Which animal also uses claws to climb?" |
| **Alive or Not** `alive`: living things and what they need | Where It Lives L2 | tap the living thing (a frog / a rock) | "What does a plant need?" tap all that apply, then Done | "This fish has no water. What is missing?" |
| **Babies** `baby`: young animals and their parents | Animal Parts L2 | match a baby to its parent where they look alike (kitten / cat) | where they look different (tadpole / frog, caterpillar / butterfly) | "How are the puppy and the dog the same? How are they different?" spoken choices |
| **Sky and Seasons** `sky`: sun, weather and the year | Where It Lives L2 | "Is it day or night?" / tap the rainy picture | which season is this; what would you wear | what comes after winter; where is the sun at noon |

This is the one game where answer choices that are sentences must be read out, because he cannot read them yet. Each choice has a picture and a speaker button, and the choices are read once in order when the question appears, each lighting as it is spoken.

## Teaching a miss

A miss always teaches the fact with a picture and one plain sentence, never just the right answer:

- **Where It Lives:** the animal moves into its habitat and the reason is spoken ("A camel lives in the desert. It can go a long time without water.").
- **Animal Parts:** the part lights up on the animal and is shown doing its job.
- **Babies:** the baby grows into the parent in three steps.
- **Sky and Seasons:** the sun moves across the sky, or the tree changes through the four seasons, stopping on the answer.

Each animal carries one "did you know" line, spoken when he first meets it and again in a lesson. Keep them short and true.

## Voice

Aria at -8%. This game has the most spoken sentences of any on the site (roughly one lesson line per animal and per fact), so watch the clip count and the precache size and report both. Animal names are single-word clips; listen to them alone, since single words are where the voice slips (a lone "cat" comes out as "Kate" without the fix in `SAID_AS`).

## The reward: the Rescue and the Park

- **The loop.** A finished Round earns Bolts and one Rescue call. A Rescue brings a new animal home. Bolts build the habitats the animals live in and upgrade his rescue truck so it can reach harder places.
- **The call.** The radio crackles: "A sea turtle is stuck on the beach!" A picture shows the animal and where it is.
- **The Rescue (action, 2D canvas, side view).** He drives the rescue truck over the ground between the Park and the animal: hold to drive, tap to jump gaps, with mud, hills, streams and logs that slow or bounce him but never stop him. At the end he does one hands-on job for that animal (drag the net off the turtle, lift the cub out of the hole with the winch, guide the duckling back to its mother), loads it into the crate and drives home.
- **The truck.** Four slots with a free starter and three upgrades each: tires (mud, then snow), winch, lights and siren, crate size. Upgrades open terrain: the desert needs sand tires, the polar rescue needs snow tracks, the pond needs the boat trailer.
- **The Park (show off).** A top-down park of habitats he buys with Bolts: pond, forest, grassland, desert, polar, reef, barn. When he brings an animal home he carries it to a habitat. The right one glows faintly after a moment, and a wrong one just has the animal shake its head and hop back into his hands, so placing it uses what he learned without ever being a test. Animals wander their habitats; tapping one plays its sound and its "did you know" line, and he can feed them.
- **About 24 rescued animals**, three or four to a habitat, so the Park fills over many weeks.

Economy defaults for the parent to confirm: one Rescue per Round, one free Rescue to start (an animal for the free starting habitat); a Rescue pays up to 4 Bolts for things collected on the drive; habitats cost roughly 15, 30, 45, 60, 80 and 100; a Rescue call is only for an animal whose habitat he already owns, so no animal is ever left without a home.

## Look

Ranger green and khaki with a bright orange truck. Animals are emoji where the Apple emoji is clear and friendly, and drawn in code where it is not; keep a table of which is which and test that every animal has one. Icon: the orange truck with a paw print on the door and a small animal looking out of the crate.

## Risks

- A wrong fact taught to a six-year-old is worse than a missing game. When unsure, leave the fact out and list it in the report.
- Emoji animals differ across devices, and several are easy to confuse (seal / otter, leopard / cheetah). Use the family iPad's Apple set as the reference.
- The Rescue has a drive and a hands-on job per animal, which could grow without limit. Build three job types (pull off, lift out, lead back) and reuse them.
