// The real animals he can photograph on a Dive and keep in his Logbook: a name said aloud and one true fact, each checked against the
// page in `source` (fetched and read on 2026-11-18; .scratch/deep-light/spec.md lists them). `glow` is the colour of an animal's own
// light (bioluminescence): on a Dive it shows in the dark even where his headlights don't reach, which is the science of the kind
// Light to See. `art` is how it's drawn in code (art/creatures.ts): friendly, with round eyes and no sharp teeth.
import type { ZoneId } from './zones';

export type Shape =
  | 'fish' | 'angler' | 'eel' | 'jelly' | 'comb' | 'squid' | 'octopus' | 'crab' | 'shrimp' | 'lobster' | 'turtle' | 'whale' | 'seal'
  | 'penguin' | 'ray' | 'seahorse' | 'clam' | 'anemone' | 'worm' | 'snail' | 'urchin' | 'cucumber' | 'isopod' | 'shark' | 'narwhal';
/** How an animal is drawn: its shape, body and second colour, and a few extras the shape knows how to draw. */
export interface Art {
  readonly shape: Shape;
  readonly body: string;
  readonly accent: string;
  /** fish: round, long, tall, tiny, thin; whale: big; squid: long; jelly: bell, wide */
  readonly form?: string;
  readonly stripes?: boolean;
  readonly spots?: boolean;
  readonly lights?: boolean;
  readonly teeth?: boolean;
  readonly spines?: boolean;
  readonly see?: boolean;
}

export interface Animal {
  readonly id: string;
  readonly name: string;
  readonly zone: ZoneId;
  readonly fact: string;
  readonly source: string;
  readonly art: Art;
  /** Its own light's colour, if it makes light. */
  readonly glow?: string;
  /** How big it is on a Dive, 1 a hand-sized fish. */
  readonly size: number;
  /** How it moves on a Dive. */
  readonly moves: 'swim' | 'drift' | 'crawl' | 'still';
}

export const ANIMALS = [
  // ---------- The Sunlit Reef ----------
  { id: 'clownfish', name: 'Clownfish', zone: 'reef', fact: 'A clownfish lives safe inside a sea anemone.', source: 'https://oceana.org/marine-life/common-clownfish/', art: { shape: 'fish', body: '#ff7a1a', accent: '#ffffff', form: 'round', stripes: true }, size: 0.8, moves: 'swim' },
  { id: 'turtle', name: 'Green Sea Turtle', zone: 'reef', fact: 'A green sea turtle eats sea grass and seaweed.', source: 'https://oceana.org/marine-life/green-turtle/', art: { shape: 'turtle', body: '#5aa04a', accent: '#8a6a3a' }, size: 1.8, moves: 'swim' },
  { id: 'parrotfish', name: 'Parrotfish', zone: 'reef', fact: 'A parrotfish chews up coral, and its poop makes sand!', source: 'https://oceana.org/marine-life/queen-parrotfish/', art: { shape: 'fish', body: '#2ec4a8', accent: '#ff7ab6', form: 'tall' }, size: 1.2, moves: 'swim' },
  { id: 'seahorse', name: 'Seahorse', zone: 'reef', fact: 'The dad seahorse carries the eggs in his pouch.', source: 'https://oceana.org/marine-life/longsnout-seahorse/', art: { shape: 'seahorse', body: '#ffb02e', accent: '#ff7a1a' }, size: 0.8, moves: 'drift' },
  { id: 'manta', name: 'Manta Ray', zone: 'reef', fact: 'A manta ray eats tiny food by swimming with its big mouth open.', source: 'https://oceana.org/marine-life/giant-manta-ray/', art: { shape: 'ray', body: '#3d64a8', accent: '#e8eef4' }, size: 2.4, moves: 'swim' },
  { id: 'clam', name: 'Giant Clam', zone: 'reef', fact: 'A giant clam can live for more than one hundred years.', source: 'https://en.wikipedia.org/wiki/Giant_clam', art: { shape: 'clam', body: '#c9b48a', accent: '#3fb8e0' }, size: 1.4, moves: 'still' },
  { id: 'tang', name: 'Blue Tang', zone: 'reef', fact: 'A blue tang has a sharp spine by its tail.', source: 'https://oceana.org/marine-life/blue-tang/', art: { shape: 'fish', body: '#2a6bff', accent: '#ffd23f', form: 'tall' }, size: 0.9, moves: 'swim' },
  { id: 'reefoctopus', name: 'Reef Octopus', zone: 'reef', fact: 'A reef octopus can change its color in an instant.', source: 'https://oceana.org/marine-life/caribbean-reef-octopus/', art: { shape: 'octopus', body: '#4fb8a8', accent: '#a6f0e0' }, size: 1.2, moves: 'crawl' },

  // ---------- The Twilight Zone ----------
  { id: 'lanternfish', name: 'Lanternfish', zone: 'twilight', fact: 'A lanternfish has rows of little lights on its body.', source: 'https://en.wikipedia.org/wiki/Lanternfish', art: { shape: 'fish', body: '#5a7cc0', accent: '#9ff3ff', form: 'long', lights: true }, glow: '#7ff7ff', size: 0.7, moves: 'swim' },
  { id: 'hatchetfish', name: 'Hatchetfish', zone: 'twilight', fact: 'A hatchetfish has lights on its belly that help it hide from fish below.', source: 'https://en.wikipedia.org/wiki/Marine_hatchetfish', art: { shape: 'fish', body: '#c8d4e4', accent: '#7ff7ff', form: 'hatchet', lights: true }, glow: '#9ffbff', size: 0.7, moves: 'swim' },
  { id: 'combjelly', name: 'Comb Jelly', zone: 'twilight', fact: "A comb jelly's tiny combs make rainbow colors as they move.", source: 'https://en.wikipedia.org/wiki/Ctenophora', art: { shape: 'comb', body: '#e8f4ff', accent: '#ff7af0' }, size: 0.9, moves: 'drift' },
  { id: 'fireflysquid', name: 'Firefly Squid', zone: 'twilight', fact: 'A firefly squid is smaller than a crayon, and it glows blue.', source: 'https://en.wikipedia.org/wiki/Firefly_squid', art: { shape: 'squid', body: '#a8406a', accent: '#5ad0ff', lights: true }, glow: '#4fb8ff', size: 0.6, moves: 'swim' },
  { id: 'crystaljelly', name: 'Crystal Jelly', zone: 'twilight', fact: 'When something bumps a crystal jelly, it glows green and blue.', source: 'https://www.montereybayaquarium.org/animals-the-ocean/animals-a-to-z/crystal-jelly', art: { shape: 'jelly', body: '#dff8ff', accent: '#5aff9a', form: 'wide' }, glow: '#5affb0', size: 1, moves: 'drift' },
  { id: 'barreleye', name: 'Barreleye Fish', zone: 'twilight', fact: 'A barreleye fish has a see-through head, and its eyes look up through it.', source: 'https://www.mbari.org/animal/barreleye-fish/', art: { shape: 'fish', body: '#5f7a94', accent: '#bff6ff', form: 'long', see: true }, size: 0.9, moves: 'drift' },
  { id: 'spermwhale', name: 'Sperm Whale', zone: 'twilight', fact: 'A sperm whale dives down deep to hunt for squid.', source: 'https://www.fisheries.noaa.gov/species/sperm-whale', art: { shape: 'whale', body: '#6a6e78', accent: '#9aa0aa', form: 'big' }, size: 4, moves: 'swim' },
  { id: 'swordfish', name: 'Swordfish', zone: 'twilight', fact: 'A swordfish has special parts that keep its eyes warm in the cold, deep water.', source: 'https://en.wikipedia.org/wiki/Swordfish', art: { shape: 'fish', body: '#5a6e9a', accent: '#c8d0e0', form: 'sword' }, size: 2.2, moves: 'swim' },

  // ---------- The Midnight Zone ----------
  { id: 'anglerfish', name: 'Anglerfish', zone: 'midnight', fact: 'An anglerfish has a glowing lure on its head to bring food close.', source: 'https://oceana.org/marine-life/deep-sea-anglerfish/', art: { shape: 'angler', body: '#5a4a7a', accent: '#ffe95a' }, glow: '#fff27a', size: 1.2, moves: 'drift' },
  { id: 'vampiresquid', name: 'Vampire Squid', zone: 'midnight', fact: 'A vampire squid eats bits of food that sink down like snow.', source: 'https://www.mbari.org/animal/vampire-squid/', art: { shape: 'octopus', body: '#c23a5e', accent: '#5ad0ff', form: 'vampire', lights: true }, glow: '#5ab8ff', size: 1.1, moves: 'drift' },
  { id: 'gulper', name: 'Gulper Eel', zone: 'midnight', fact: 'A gulper eel has a giant mouth to swallow any food it finds.', source: 'https://www.mbari.org/animal/whiptail-gulper-eel/', art: { shape: 'eel', body: '#5c4c94', accent: '#ff7ad0', form: 'gulper' }, glow: '#ff7ad0', size: 1.6, moves: 'swim' },
  { id: 'viperfish', name: 'Viperfish', zone: 'midnight', fact: 'A viperfish has front teeth so long they stick out of its mouth.', source: 'https://www.mbari.org/animal/pacific-viperfish/', art: { shape: 'fish', body: '#3f7fc0', accent: '#9ff3ff', form: 'viper', teeth: true, lights: true }, glow: '#8ff0ff', size: 1, moves: 'swim' },
  { id: 'loosejaw', name: 'Stoplight Loosejaw', zone: 'midnight', fact: 'A stoplight loosejaw makes red light that most deep sea animals cannot see.', source: 'https://en.wikipedia.org/wiki/Malacosteus_niger', art: { shape: 'fish', body: '#6e3e8e', accent: '#ff4a4a', form: 'loosejaw' }, glow: '#ff4a4a', size: 0.9, moves: 'swim' },
  { id: 'atolla', name: 'Atolla Jelly', zone: 'midnight', fact: 'When something grabs an atolla jelly, it flashes blue lights like an alarm.', source: 'https://en.wikipedia.org/wiki/Atolla_wyvillei', art: { shape: 'jelly', body: '#c8303a', accent: '#5ab8ff', form: 'crown' }, glow: '#4fa8ff', size: 1, moves: 'drift' },
  { id: 'giantsquid', name: 'Giant Squid', zone: 'midnight', fact: 'A giant squid has some of the biggest eyes of any animal.', source: 'https://en.wikipedia.org/wiki/Giant_squid', art: { shape: 'squid', body: '#d06a4a', accent: '#ffb08a', form: 'long' }, size: 3.4, moves: 'swim' },
  { id: 'bristlemouth', name: 'Bristlemouth', zone: 'midnight', fact: 'There may be more bristlemouths than any other animal with a backbone.', source: 'https://oceana.org/marine-life/tan-bristlemouth/', art: { shape: 'fish', body: '#8a7a5a', accent: '#9ff3ff', form: 'thin', lights: true }, glow: '#9ff3ff', size: 0.6, moves: 'swim' },
  { id: 'phantomjelly', name: 'Giant Phantom Jelly', zone: 'midnight', fact: "A giant phantom jelly's arms can be longer than two cars.", source: 'https://www.mbari.org/animal/giant-phantom-jelly/', art: { shape: 'jelly', body: '#a8244e', accent: '#e0507a', form: 'phantom' }, size: 2.6, moves: 'drift' },

  // ---------- The Shipwreck ----------
  { id: 'grouper', name: 'Goliath Grouper', zone: 'wreck', fact: 'A goliath grouper can grow longer than a grown-up is tall.', source: 'https://oceana.org/marine-life/atlantic-goliath-grouper/', art: { shape: 'fish', body: '#8a7a5a', accent: '#5a4a3a', form: 'round', spots: true }, size: 2.6, moves: 'swim' },
  { id: 'moray', name: 'Green Moray Eel', zone: 'wreck', fact: 'A green moray eel is not really green. Yellow slime on its brown skin makes it look green.', source: 'https://oceana.org/marine-life/green-moray-eel/', art: { shape: 'eel', body: '#6a9a3a', accent: '#c8e05a' }, size: 1.8, moves: 'swim' },
  { id: 'lobster', name: 'Spiny Lobster', zone: 'wreck', fact: 'Hundreds of spiny lobsters sometimes line up and march across the sea floor.', source: 'https://en.wikipedia.org/wiki/Caribbean_spiny_lobster', art: { shape: 'lobster', body: '#c86a3a', accent: '#ffd28a', spines: true }, size: 1.1, moves: 'crawl' },
  { id: 'anemone', name: 'Sea Anemone', zone: 'wreck', fact: 'A sea anemone looks like a flower, but it is an animal.', source: 'https://en.wikipedia.org/wiki/Sea_anemone', art: { shape: 'anemone', body: '#ff7ab6', accent: '#ffd0e8' }, size: 1, moves: 'still' },
  { id: 'nudibranch', name: 'Nudibranch', zone: 'wreck', fact: 'A nudibranch is a sea slug that loses its shell when it is a baby.', source: 'https://en.wikipedia.org/wiki/Nudibranch', art: { shape: 'snail', body: '#9a5aff', accent: '#ffb02e', form: 'slug' }, size: 0.7, moves: 'crawl' },
  { id: 'gpo', name: 'Giant Pacific Octopus', zone: 'wreck', fact: 'The giant Pacific octopus is the biggest octopus in the world.', source: 'https://en.wikipedia.org/wiki/Giant_Pacific_octopus', art: { shape: 'octopus', body: '#d0503a', accent: '#ffb08a' }, size: 2.2, moves: 'crawl' },
  { id: 'lionfish', name: 'Lionfish', zone: 'wreck', fact: 'A lionfish has thirteen spines along its back.', source: 'https://oceana.org/marine-life/red-lionfish/', art: { shape: 'fish', body: '#e0603a', accent: '#fff4e0', form: 'round', stripes: true, spines: true }, size: 1, moves: 'drift' },

  // ---------- The Crystal Cave ----------
  { id: 'flashlightfish', name: 'Flashlight Fish', zone: 'cave', fact: 'A flashlight fish has lights under its eyes that it can blink on and off.', source: 'https://oceana.org/marine-life/flashlight-fish/', art: { shape: 'fish', body: '#3d4f9e', accent: '#c8fbff', form: 'flashlight' }, glow: '#c8fbff', size: 0.8, moves: 'swim' },
  { id: 'pineconefish', name: 'Pinecone Fish', zone: 'cave', fact: 'A pinecone fish has a little light on each side of its jaw.', source: 'https://en.wikipedia.org/wiki/Monocentridae', art: { shape: 'fish', body: '#ffd23f', accent: '#3a2a1a', form: 'round', spots: true, lights: true }, glow: '#a8ff7a', size: 0.7, moves: 'drift' },
  { id: 'cleanershrimp', name: 'Cleaner Shrimp', zone: 'cave', fact: "A cleaner shrimp cleans other fish, even inside a moray eel's mouth.", source: 'https://en.wikipedia.org/wiki/Cleaner_shrimp', art: { shape: 'shrimp', body: '#ff5a4a', accent: '#ffffff', stripes: true }, size: 0.6, moves: 'crawl' },
  { id: 'urchin', name: 'Sea Urchin', zone: 'cave', fact: 'A sea urchin moves on tiny tube feet hidden under its spines.', source: 'https://oceana.org/marine-life/pacific-purple-sea-urchin/', art: { shape: 'urchin', body: '#7a3aa8', accent: '#c88aff' }, size: 0.7, moves: 'still' },
  { id: 'seacucumber', name: 'Sea Cucumber', zone: 'cave', fact: 'A sea cucumber breathes through its bottom!', source: 'https://en.wikipedia.org/wiki/Sea_cucumber', art: { shape: 'cucumber', body: '#8a5a3a', accent: '#ffb07a' }, size: 1, moves: 'crawl' },
  { id: 'bobtail', name: 'Bobtail Squid', zone: 'cave', fact: 'A bobtail squid glows with help from tiny living things inside it.', source: 'https://oceana.org/marine-life/hawaiian-bobtail-squid/', art: { shape: 'squid', body: '#e0a07a', accent: '#a8f0ff', form: 'bob' }, glow: '#a8e8ff', size: 0.6, moves: 'swim' },
  { id: 'cardinalfish', name: 'Cardinalfish', zone: 'cave', fact: 'A dad cardinalfish keeps the eggs safe in his mouth.', source: 'https://en.wikipedia.org/wiki/Cardinalfish', art: { shape: 'fish', body: '#ff5a5a', accent: '#ffd0c0', form: 'round' }, size: 0.6, moves: 'swim' },

  // ---------- The Hot Vents ----------
  { id: 'tubeworm', name: 'Giant Tube Worm', zone: 'vents', fact: 'A giant tube worm has no mouth and no stomach.', source: 'https://en.wikipedia.org/wiki/Riftia_pachyptila', art: { shape: 'worm', body: '#f4f0e8', accent: '#e8303a', form: 'tube' }, size: 1.6, moves: 'still' },
  { id: 'yeticrab', name: 'Yeti Crab', zone: 'vents', fact: 'A yeti crab has hairy arms with tiny living things growing on them.', source: 'https://en.wikipedia.org/wiki/Kiwa_hirsuta', art: { shape: 'crab', body: '#f4ece0', accent: '#d8c8b0', form: 'yeti' }, size: 0.9, moves: 'crawl' },
  { id: 'pompeii', name: 'Pompeii Worm', zone: 'vents', fact: 'The Pompeii worm lives in some of the hottest places any animal can.', source: 'https://www.mbari.org/animal/pompeii-worm/', art: { shape: 'worm', body: '#ffb0a0', accent: '#ff5a3a', form: 'fuzzy' }, size: 0.8, moves: 'still' },
  { id: 'ventshrimp', name: 'Vent Shrimp', zone: 'vents', fact: 'A vent shrimp has no eyes on its head, but a spot on its back can sense light.', source: 'https://en.wikipedia.org/wiki/Rimicaris_exoculata', art: { shape: 'shrimp', body: '#f0c8a8', accent: '#ffe0c8' }, size: 0.6, moves: 'swim' },
  { id: 'scalyfoot', name: 'Scaly-Foot Snail', zone: 'vents', fact: 'A scaly-foot snail has iron in its shell.', source: 'https://en.wikipedia.org/wiki/Chrysomallon_squamiferum', art: { shape: 'snail', body: '#6a7084', accent: '#ff8a4a' }, size: 0.6, moves: 'crawl' },
  { id: 'ventmussel', name: 'Vent Mussel', zone: 'vents', fact: 'A vent mussel has tiny living things inside it that make its food.', source: 'https://en.wikipedia.org/wiki/Bathymodiolus', art: { shape: 'clam', body: '#6a5a3a', accent: '#c8b080', form: 'mussel' }, size: 0.7, moves: 'still' },

  // ---------- Under the Ice ----------
  { id: 'narwhal', name: 'Narwhal', zone: 'ice', fact: "A narwhal's long horn is really a tooth!", source: 'https://oceana.org/marine-life/narwhal/', art: { shape: 'narwhal', body: '#9aa8b4', accent: '#f4f0e0', spots: true }, size: 3, moves: 'swim' },
  { id: 'beluga', name: 'Beluga Whale', zone: 'ice', fact: 'A beluga makes so many sounds that it is called the canary of the sea.', source: 'https://oceana.org/marine-life/beluga-whale/', art: { shape: 'whale', body: '#f4f8fc', accent: '#c8d8e4' }, size: 2.8, moves: 'swim' },
  { id: 'krill', name: 'Antarctic Krill', zone: 'ice', fact: 'A krill is tiny, and it has little lights on its body.', source: 'https://en.wikipedia.org/wiki/Antarctic_krill', art: { shape: 'shrimp', body: '#ff8a6a', accent: '#ffd0b0', lights: true }, glow: '#7ff7d0', size: 0.5, moves: 'swim' },
  { id: 'weddell', name: 'Weddell Seal', zone: 'ice', fact: 'A Weddell seal can stay under the ice for up to an hour.', source: 'https://en.wikipedia.org/wiki/Weddell_seal', art: { shape: 'seal', body: '#6b7790', accent: '#a8b0c4', spots: true }, size: 2.2, moves: 'swim' },
  { id: 'emperor', name: 'Emperor Penguin', zone: 'ice', fact: 'An emperor penguin can stay underwater for about twenty minutes while it hunts.', source: 'https://en.wikipedia.org/wiki/Emperor_penguin', art: { shape: 'penguin', body: '#34425e', accent: '#ffc83a' }, size: 1.2, moves: 'swim' },
  { id: 'icefish', name: 'Icefish', zone: 'ice', fact: 'An icefish has blood with no color in it.', source: 'https://en.wikipedia.org/wiki/Channichthyidae', art: { shape: 'fish', body: '#d8e4ec', accent: '#a8c0d0', form: 'long', see: true }, size: 1.1, moves: 'drift' },
  { id: 'seaangel', name: 'Sea Angel', zone: 'ice', fact: 'A sea angel is a tiny sea slug that flaps two wings to swim.', source: 'https://en.wikipedia.org/wiki/Clione_limacina', art: { shape: 'snail', body: '#e8f4ff', accent: '#ff8a5a', form: 'angel' }, size: 0.5, moves: 'drift' },
  { id: 'greenlandshark', name: 'Greenland Shark', zone: 'ice', fact: 'A Greenland shark may live for more than one hundred years.', source: 'https://oceana.org/marine-life/greenland-shark/', art: { shape: 'shark', body: '#6c7486', accent: '#a8b0bc' }, size: 3.2, moves: 'swim' },

  // ---------- The Deep Trench ----------
  { id: 'snailfish', name: 'Snailfish', zone: 'trench', fact: 'Snailfish have been seen deeper than any other fish.', source: 'https://en.wikipedia.org/wiki/Snailfish', art: { shape: 'fish', body: '#f0d8e0', accent: '#ffb0c8', form: 'tadpole', see: true }, size: 0.9, moves: 'drift' },
  { id: 'dumbo', name: 'Dumbo Octopus', zone: 'trench', fact: 'A dumbo octopus has fins that look like big ears.', source: 'https://oceana.org/marine-life/dumbo-octopus/', art: { shape: 'octopus', body: '#ff9a7a', accent: '#ffd0b8', form: 'dumbo' }, size: 0.9, moves: 'drift' },
  { id: 'seapig', name: 'Sea Pig', zone: 'trench', fact: 'A sea pig is a kind of sea cucumber that walks on the sea floor.', source: 'https://www.mbari.org/animal/sea-pig/', art: { shape: 'cucumber', body: '#ffc0c8', accent: '#ff8aa0', form: 'pig' }, size: 0.9, moves: 'crawl' },
  { id: 'amphipod', name: 'Supergiant Amphipod', zone: 'trench', fact: 'A supergiant amphipod can grow longer than a ruler.', source: 'https://en.wikipedia.org/wiki/Alicella_gigantea', art: { shape: 'isopod', body: '#f4f0f0', accent: '#d8d0d4', form: 'amphipod' }, size: 1, moves: 'swim' },
  { id: 'tripodfish', name: 'Tripod Fish', zone: 'trench', fact: 'A tripod fish stands on three long fins and waits for food.', source: 'https://en.wikipedia.org/wiki/Bathypterois_grallator', art: { shape: 'fish', body: '#8a9ab0', accent: '#c8d0dc', form: 'tripod' }, size: 1, moves: 'still' },
  { id: 'isopod', name: 'Giant Isopod', zone: 'trench', fact: 'A giant isopod is a big cousin of the little roly-poly bugs on land.', source: 'https://en.wikipedia.org/wiki/Giant_isopod', art: { shape: 'isopod', body: '#c8b8a8', accent: '#a8988a' }, size: 1.2, moves: 'crawl' },
  { id: 'grenadier', name: 'Grenadier', zone: 'trench', fact: 'A grenadier fish has a long thin tail, so it is also called a rattail.', source: 'https://en.wikipedia.org/wiki/Macrouridae', art: { shape: 'fish', body: '#8a8aa4', accent: '#c0c6d6', form: 'rattail' }, size: 1.3, moves: 'swim' },
] as const satisfies readonly Animal[];

export type AnimalId = (typeof ANIMALS)[number]['id'];
export type AnimalName = (typeof ANIMALS)[number]['name'];
export type AnimalFact = (typeof ANIMALS)[number]['fact'];
export const animal = (id: string): Animal => ANIMALS.find(a => a.id === id)!;
export const isAnimalId = (x: unknown): x is AnimalId => typeof x === 'string' && ANIMALS.some(a => a.id === x);
export const animalsIn = (z: ZoneId): readonly Animal[] => ANIMALS.filter(a => a.zone === z);
