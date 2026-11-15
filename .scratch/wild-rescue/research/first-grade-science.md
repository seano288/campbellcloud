# First-grade science: what Wild Rescue teaches, and where it comes from

Written 2026-11-14 alongside the build. Every fact the game teaches lives in `src/wild-rescue/facts/` (plain data, no game code), so this note and those files are the whole of it. The tests in `src/wild-rescue/facts/facts.test.ts` check the *structure* (one clear home, plainly wrong choices, no penguin beside a polar bear, no trick animals in the questions their trick touches); they can't check that a fact is *true*. That is this note's job, and the parent's.

## The standards it follows

- **1-LS1-1** (how plants and animals use their parts to survive): Animal Parts.
- **1-LS3-1** (young plants and animals are like, but not exactly like, their parents): Babies.
- **K-LS1-1** (what plants and animals need to survive), built on in first grade: Alive or Not. The NGSS clarification is that animals need to take in food and plants do not, and the core idea (LS1.C) is that plants need water and light. So the game never offers "food" for a plant, either as right or as wrong. ([K-LS1-1 at nextgenscience.org](https://nextgenscience.org/pe/k-ls1-1-molecules-organisms-structures-and-processes), [The Wonder of Science, K-LS1-1](https://thewonderofscience.com/kls11))
- **1-ESS1-1** (patterns of the sun, moon and stars) and **1-ESS1-2** (daylight through the year), with **K-ESS2-1** weather as a base: Sky and Seasons.
- Habitats are not a first-grade NGSS standard on their own; the brief asks for them as the frame for the reward. They follow the usual early-grades habitat list (ocean, pond and river, forest, grassland, desert, polar, farm).

## How it stays safe

- **One clear home.** An animal is asked about in Where It Lives, and lives in the Park, only if it has one habitat a first grader would be taught. Animals that live all over (owls, rabbits, snails, eagles, ducks, snakes, foxes) have no habitat and are used only in the other kinds.
- **Plainly wrong.** Each animal lists the habitats where some of its kind also live (`notWrong`), and those are never offered as wrong answers. A frog is never told it's wrong in the forest (tree frogs), a crab never wrong in a pond, a dolphin never wrong in a river, a moose never wrong in a pond, a horse never wrong in a grassland.
- **Hand-picked wrong choices** for every Animal Parts, Babies, Alive or Not and Sky question, rather than any-other-from-a-list.
- **No trick cases.** Bats are not in the game. Whales, dolphins, penguins and ostriches are kept out of every "which animal also..." question. "To fly." is never a wrong choice for a penguin. The penguin's and the ostrich's did-you-know lines don't depend on flying.
- **The moon is never used to mean night.** It's up in the daytime too; night is taught by the dark and the stars.
- **Morning and evening are never told apart by which side of a picture the sun is on**, only by the sun coming up and going down.
- **Cloudy is never asked for**, because the rainy and snowy pictures are cloudy too.

## Facts checked against a source

These were the ones I was not completely sure of, or whose wording I wanted to get right.

| Fact as the game says it | Source |
|---|---|
| Under its white fur, a polar bear has black skin. | [Polar Bears International](https://polarbearsinternational.org/news-media/articles/why-polar-bears-have-black-skin) |
| A walrus uses its long tusks to pull itself out of the water. | [Animal Diversity Web](https://animaldiversity.org/accounts/Odobenus_rosmarus/), [Oceana](https://oceana.org/?p=16171) |
| An arctic fox has fur on the bottom of its paws. | [Columbus Zoo](https://columbuszoo.org/animals/arctic-fox), [San Diego Zoo Kids](https://Kids.sandiegozoo.org/stories/cold-weather-critters) |
| A snowy owl has feathers on its feet to keep them warm. | [Oregon Zoo](https://oregonzoo.org/animals/snowy-owl) |
| A mother crocodile carries her babies in her mouth. | [National Geographic Kids, Nile crocodile](https://kids.nationalgeographic.com/animals/reptiles/nile-crocodile/), [PBS Nature](https://www.pbs.org/wnet/nature/crocodile-mom-scoops-babies-mouth/14901) |
| A fennec fox's big ears help it stay cool. | [Britannica Kids](https://kids.britannica.com/students/article/fennec-fox/323103), [National Geographic](https://www.nationalgeographic.com/animals/mammals/f/fennec-fox/) |
| A desert tortoise digs a burrow to hide from the heat. | [San Diego Zoo](https://animals.sandiegozoo.org/node/116), [U.S. Fish and Wildlife Service](https://www.fws.gov/story/2023-12/slow-and-steady) |
| Meerkats take turns standing guard to watch for danger. | [Britannica](https://www.britannica.com/animal/meerkat) (says "in no particular order"; the game doesn't claim the turns are even) |
| A camel can go a long time without drinking water. / A camel's long eyelashes keep sand out of its eyes. | [Natural History Museum, London](https://www.nhm.ac.uk/discover/how-do-camels-survive-in-deserts.html), [Denver Zoo](https://www.denverzoo.org/animals/bactrian-camel). The game never says the hump stores water (it stores fat). |
| A bison is the biggest land animal in North America. | [National Park Service](https://www.nps.gov/yell/learn/nature/bison.htm), [U.S. Department of the Interior](https://www.doi.gov/blog/15-facts-about-our-national-mammal-american-bison) |
| A horse can sleep standing up. | [Kentucky Equine Research](https://ker.com/?p=4173) (they doze standing; deep sleep needs lying down, which the game doesn't contradict) |
| A rhino's horn is made of the same stuff as your fingernails. | [Save the Rhino](https://www.savetherhino.org/our-work/protecting-rhinos/what-is-rhino-horn-made-of) |
| An ostrich lays the biggest eggs of any bird. | [Guinness World Records](https://www.guinnessworldrecords.com/world-records/384558-largest-egg-from-a-bird-non-extinct-species) (of living birds; the extinct elephant bird's were bigger) |
| A donkey's long ears help it hear and stay cool. | [Smithsonian's National Zoo](https://nationalzoo.si.edu/node/6879) (cooling), [Columbus Zoo](https://columbuszoo.org/animals/donkey) (hearing). One researcher argues cooling matters more than hearing; the line says both. |
| A roadrunner is a bird that would rather run than fly. | [Wikipedia, greater roadrunner](https://en.wikipedia.org/wiki/Greater_roadrunner) (flies only short hops) |

The rest are the common facts of early-grades animal books (an octopus has eight arms, a giraffe is the tallest animal, no two zebras have the same stripes, a joey grows in its mother's pouch, a beaver builds a dam, a caterpillar becomes a butterfly, a tadpole becomes a frog, the seasons go spring, summer, fall, winter).

## Simplifications a parent should know about

Each is a choice made so a six-year-old gets one clear answer. All are defaults to confirm.

1. **"Polar" is one habitat.** It is really the Arctic (polar bears, walruses, arctic foxes, snowy owls) and the Antarctic (penguins). The game never puts a penguin and a polar bear together, and the Park's Polar Ice plot is split by water into North and South.
2. **Penguins live in the polar lands.** Most kinds do, but some live in warmer places (the Galápagos, South Africa, Australia). Penguins are only asked about with habitats that are plainly wrong for every penguin (never the ocean).
3. **The snowy owl lives in the polar lands.** It nests in the Arctic but many spend the winter on open fields and prairies further south, so grassland and farm are never offered as wrong for it.
4. **A brown bear lives in the forest** (the picture is Apple's brown bear face). Bears also live on mountains and tundra, so grassland, polar and pond are never wrong for it.
5. **Sea turtles eat "both".** It depends on the kind (green sea turtles graze on sea grass, others eat jellyfish and crabs). "What it eats" is in the table but not asked; the Park feeds a sea turtle lettuce, which rescue centres do.
6. **Swans eat plants.** Mostly; they also eat a few insects and snails. Not asked.
7. **Seasons as most of the U.S. sees them.** Winter is "cold, and in many places it snows"; fall is "the leaves change color and fall off" (true of the trees that drop leaves). If the family lives somewhere warm, the season pictures may not match what he sees outside.
8. **"What do you need today?"** The rainy-day answer is an umbrella; the wrong ones are a swimsuit and sunglasses.
9. **"Fur" for cows and horses** is avoided: the "same" sentence for a foal and a horse, and a calf and a cow, is "They both have hooves." (and "They both have four legs."). Lambs "both have wool".
10. **A chick grows up to be a chicken**, not "a hen", since a chick can grow into a rooster.

## Facts I'd most like a parent to check

Listed in the order I'm least sure the wording is right for him:

1. "A rhino's horn is made of the same stuff as your fingernails." True, but "stuff" is loose; some books say "hair".
2. "A roadrunner is a bird that would rather run than fly." True to its habits; a child may take it as "can't fly".
3. "A penguin uses its wings like flippers to swim." Fine, but it's the one line that touches the "birds that don't fly" trick.
4. "Every year a male deer grows new antlers." True for deer that grow antlers; female reindeer (not in the game) grow them too.
5. "A shark grows new teeth again and again."
6. "A hippo stays in the water all day to keep cool." They spend most of the day in water and graze at night; "all day" is a little strong.
7. "Many bears sleep through the winter in a den." Deliberately "many", since not all bears do.
8. "A dragonfly is caught in a spider web!" (a rescue call, not a fact) and "A baby dragonfly lives underwater." (nymphs do).
9. "In fall, the leaves change color and fall off." and "In winter, it is cold, and in many places it snows." (see 7 above).
10. "This plant is in a dark box. What does it need?" Sunlight, with water shown being poured. Plants need light; "sunlight" is the first-grade word.
11. The habitat of each animal in the table (`home`), and especially: crocodile (ponds and rivers), hippo (ponds and rivers), kangaroo (grassland), ostrich (grassland), meerkat (desert), roadrunner (desert), rattlesnake (desert), donkey (farm), moose and wolf (forest).
12. Each rescue call is made up but meant to be the kind of thing that happens (a turtle in a net, a cub in a hole, a snake in garden netting).

## Left out on purpose

- Bats, platypuses, seals, otters, owls in a habitat, foxes other than the fennec and arctic fox, cheetahs (Apple's leopard and cheetah emoji are easy to confuse), ducks and geese in a habitat (farm or pond?), zebra stripes' purpose (scientists still argue), the camel's hump, "eats" questions (plants / animals / both) and "covering" questions (fur / feathers / scales), and eggs: none of them is asked.
- Soil for plants, sunlight for animals, food for plants: never offered as right or wrong.
- Fire, clouds, the sun, seeds, dead leaves and robots in Alive or Not.
