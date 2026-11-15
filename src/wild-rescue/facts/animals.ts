// The animals table. Plain data, no game code: every fact Wild Rescue teaches about an animal is here, in one place, so a parent can
// read it through. The sources for anything not common knowledge are in .scratch/wild-rescue/research/first-grade-science.md.
//
// The accuracy rules (each checked by facts.test.ts):
// - `home` is set only when the animal has one clear habitat for a first grader. Animals that live in many places (owls, rabbits,
//   snails, eagles) have `home: null` and never appear in Where It Lives or the Park.
// - `notWrong` lists habitats where some of these animals also live. They are never offered as a wrong answer for it, so a wrong
//   choice is always plainly wrong (a frog is never "wrong" in the forest, because tree frogs live there).
// - Polar animals carry `pole`. A penguin (south) and a polar bear (north) are never neighbours or "lives with" answers.
// - `trick` marks the animals that break a rule a child might have learned (a bird that cannot fly, a sea animal that is not a fish).
//   They stay out of the questions those tricks touch.
//
// `art`: an Apple emoji where it is clear and friendly on the family iPad, otherwise drawn in code (art/drawn.tsx). The test checks
// every animal has one, and every drawn one has a drawing.
import type { HabitatId } from './habitats';

export type Covering = 'fur' | 'feathers' | 'scales' | 'skin' | 'shell';
export type Eats = 'plants' | 'animals' | 'both';
export type Size = 'small' | 'medium' | 'large' | 'giant';
/** The hands-on job at the end of a Rescue: drag the net off, winch it out of a hole, lead it to the crate with treats. */
export type Job = 'pull' | 'lift' | 'lead';
export type Art = { readonly emoji: string } | { readonly drawn: string };

export interface Animal {
  readonly id: string;
  /** Lower case, as said in the middle of a sentence. */
  readonly name: string;
  readonly a: 'A' | 'An';
  readonly home: HabitatId | null;
  readonly notWrong?: readonly HabitatId[];
  readonly pole?: 'north' | 'south';
  readonly eats: Eats;
  readonly moves: readonly string[];
  readonly covering: Covering;
  readonly size: Size;
  readonly art: Art;
  /** Two or three body parts and the job each does. */
  readonly parts: readonly { readonly part: string; readonly job: string }[];
  /** The one "did you know" line: said when it comes home to the Park, when he taps it there, and in a lesson. */
  readonly fact: string;
  /** What it is fed in the Park: a real food for it. */
  readonly snack: string;
  /** The Rescue call and its job; only animals with a clear home can be rescued. */
  readonly rescue?: { readonly call: string; readonly job: Job };
  readonly trick?: 'not-a-fish' | 'cannot-fly' | 'flies-but-not-a-bird';
}

export const ANIMALS = [
  // ---------- ocean ----------
  { id: 'seaturtle', name: 'sea turtle', a: 'A', home: 'ocean', eats: 'both', moves: ['swims'], covering: 'shell', size: 'medium', art: { drawn: 'seaturtle' },
    parts: [{ part: 'flippers', job: 'swim' }, { part: 'shell', job: 'stay safe' }], fact: 'A sea turtle lays its eggs on a sandy beach.', snack: '🥬',
    rescue: { call: 'A sea turtle is caught in a fishing net!', job: 'pull' } },
  { id: 'octopus', name: 'octopus', a: 'An', home: 'ocean', eats: 'animals', moves: ['swims', 'crawls'], covering: 'skin', size: 'small', art: { emoji: '🐙' },
    parts: [{ part: 'arms', job: 'grab food' }], fact: 'An octopus has eight arms.', snack: '🦀',
    rescue: { call: 'An octopus is tangled in a fishing line!', job: 'pull' } },
  { id: 'crab', name: 'crab', a: 'A', home: 'ocean', notWrong: ['pond'], eats: 'both', moves: ['walks', 'swims'], covering: 'shell', size: 'small', art: { emoji: '🦀' },
    parts: [{ part: 'claws', job: 'grab food' }, { part: 'shell', job: 'stay safe' }], fact: 'A crab walks sideways.', snack: '🦐',
    rescue: { call: 'A crab is stuck in a deep hole in the sand!', job: 'lift' } },
  { id: 'shark', name: 'shark', a: 'A', home: 'ocean', eats: 'animals', moves: ['swims'], covering: 'skin', size: 'large', art: { emoji: '🦈' },
    parts: [{ part: 'gills', job: 'breathe underwater' }, { part: 'fins', job: 'swim' }], fact: 'A shark grows new teeth again and again.', snack: '🐟',
    rescue: { call: 'A little shark is stuck in a tide pool!', job: 'lift' } },
  { id: 'dolphin', name: 'dolphin', a: 'A', home: 'ocean', notWrong: ['pond'], eats: 'animals', moves: ['swims'], covering: 'skin', size: 'large', art: { emoji: '🐬' },
    parts: [{ part: 'blowhole', job: 'breathe air' }, { part: 'flippers', job: 'steer' }], fact: 'Dolphins talk to each other with clicks and whistles.', snack: '🐟',
    rescue: { call: 'A dolphin is caught in a fishing net!', job: 'pull' }, trick: 'not-a-fish' },
  { id: 'pufferfish', name: 'pufferfish', a: 'A', home: 'ocean', notWrong: ['pond'], eats: 'both', moves: ['swims'], covering: 'skin', size: 'small', art: { emoji: '🐡' },
    parts: [{ part: 'spines', job: 'stay safe' }, { part: 'fins', job: 'swim' }], fact: 'A pufferfish puffs up like a ball to stay safe.', snack: '🦐',
    rescue: { call: 'A pufferfish is lost in shallow water!', job: 'lead' } },
  { id: 'whale', name: 'whale', a: 'A', home: 'ocean', eats: 'animals', moves: ['swims'], covering: 'skin', size: 'giant', art: { emoji: '🐳' },
    parts: [{ part: 'blowhole', job: 'breathe air' }, { part: 'tail', job: 'swim' }], fact: 'A whale breathes air through a blowhole on its head.', snack: '🦐',
    trick: 'not-a-fish' },
  { id: 'jellyfish', name: 'jellyfish', a: 'A', home: 'ocean', notWrong: ['pond'], eats: 'animals', moves: ['swims'], covering: 'skin', size: 'small', art: { emoji: '🪼' },
    parts: [{ part: 'tentacles', job: 'catch food' }], fact: 'A jellyfish has no bones and no brain.', snack: '🦐' },

  // ---------- ponds and rivers ----------
  { id: 'frog', name: 'frog', a: 'A', home: 'pond', notWrong: ['forest'], eats: 'animals', moves: ['hops', 'swims'], covering: 'skin', size: 'small', art: { emoji: '🐸' },
    parts: [{ part: 'long sticky tongue', job: 'catch bugs' }, { part: 'strong back legs', job: 'hop' }, { part: 'webbed feet', job: 'swim' }],
    fact: 'A frog catches bugs with its long, sticky tongue.', snack: '🪰', rescue: { call: 'A frog is lost far from its pond!', job: 'lead' } },
  { id: 'beaver', name: 'beaver', a: 'A', home: 'pond', notWrong: ['forest'], eats: 'plants', moves: ['swims', 'walks'], covering: 'fur', size: 'medium', art: { emoji: '🦫' },
    parts: [{ part: 'big front teeth', job: 'chew wood' }, { part: 'flat tail', job: 'swim' }], fact: 'A beaver builds a dam with sticks and mud.', snack: '🌿',
    rescue: { call: 'A beaver is tangled in an old rope!', job: 'pull' } },
  { id: 'swan', name: 'swan', a: 'A', home: 'pond', notWrong: ['ocean', 'farm'], eats: 'plants', moves: ['swims', 'flies', 'walks'], covering: 'feathers', size: 'medium', art: { emoji: '🦢' },
    parts: [{ part: 'webbed feet', job: 'swim' }, { part: 'wings', job: 'fly' }], fact: 'A baby swan is called a cygnet.', snack: '🌿',
    rescue: { call: 'A swan is tangled in fishing line!', job: 'pull' } },
  { id: 'hippo', name: 'hippo', a: 'A', home: 'pond', notWrong: ['grassland'], eats: 'plants', moves: ['walks'], covering: 'skin', size: 'giant', art: { emoji: '🦛' },
    parts: [{ part: 'big mouth', job: 'eat grass' }], fact: 'A hippo stays in the water all day to keep cool.', snack: '🌾',
    rescue: { call: 'A hippo is stuck in thick mud!', job: 'lift' } },
  { id: 'crocodile', name: 'crocodile', a: 'A', home: 'pond', notWrong: ['ocean', 'grassland'], eats: 'animals', moves: ['swims', 'walks'], covering: 'scales', size: 'large', art: { emoji: '🐊' },
    parts: [{ part: 'strong tail', job: 'swim' }, { part: 'sharp teeth', job: 'catch food' }], fact: 'A mother crocodile carries her babies in her mouth.', snack: '🐟',
    rescue: { call: 'A crocodile wandered far from its river!', job: 'lead' } },
  { id: 'dragonfly', name: 'dragonfly', a: 'A', home: 'pond', notWrong: ['forest', 'grassland', 'farm'], eats: 'animals', moves: ['flies'], covering: 'skin', size: 'small', art: { drawn: 'dragonfly' },
    parts: [{ part: 'four wings', job: 'fly' }, { part: 'big eyes', job: 'see' }], fact: 'A baby dragonfly lives underwater.', snack: '🦟',
    rescue: { call: 'A dragonfly is caught in a spider web!', job: 'pull' } },

  // ---------- forest ----------
  { id: 'bear', name: 'bear', a: 'A', home: 'forest', notWrong: ['grassland', 'polar', 'pond'], eats: 'both', moves: ['walks', 'climbs', 'swims'], covering: 'fur', size: 'large', art: { emoji: '🐻' },
    parts: [{ part: 'claws', job: 'dig' }, { part: 'nose', job: 'smell' }], fact: 'Many bears sleep through the winter in a den.', snack: '🫐',
    rescue: { call: 'A bear cub fell into a deep hole!', job: 'lift' } },
  { id: 'chipmunk', name: 'chipmunk', a: 'A', home: 'forest', notWrong: ['grassland', 'farm'], eats: 'both', moves: ['runs', 'climbs'], covering: 'fur', size: 'small', art: { emoji: '🐿️' },
    parts: [{ part: 'cheek pouches', job: 'carry food' }, { part: 'claws', job: 'dig' }], fact: 'A chipmunk carries food in its cheek pouches.', snack: '🌰',
    rescue: { call: 'A chipmunk is stuck in a drain pipe!', job: 'lift' } },
  { id: 'deer', name: 'deer', a: 'A', home: 'forest', notWrong: ['grassland', 'farm'], eats: 'plants', moves: ['walks', 'runs'], covering: 'fur', size: 'large', art: { emoji: '🦌' },
    parts: [{ part: 'antlers', job: 'push other deer' }, { part: 'big ears', job: 'hear' }], fact: 'Every year a male deer grows new antlers.', snack: '🍃',
    rescue: { call: 'A deer is tangled in a fence!', job: 'pull' } },
  { id: 'raccoon', name: 'raccoon', a: 'A', home: 'forest', notWrong: ['farm', 'pond'], eats: 'both', moves: ['walks', 'climbs'], covering: 'fur', size: 'medium', art: { emoji: '🦝' },
    parts: [{ part: 'front paws', job: 'grab food' }, { part: 'claws', job: 'climb' }], fact: 'A raccoon uses its front paws like hands.', snack: '🍇',
    rescue: { call: 'A raccoon is stuck in a garbage can!', job: 'lift' } },
  { id: 'moose', name: 'moose', a: 'A', home: 'forest', notWrong: ['pond', 'polar'], eats: 'plants', moves: ['walks', 'swims'], covering: 'fur', size: 'large', art: { emoji: '🫎' },
    parts: [{ part: 'long legs', job: 'walk in deep snow' }], fact: 'A moose is the biggest kind of deer.', snack: '🍃',
    rescue: { call: 'A moose is stuck in deep mud!', job: 'lift' } },
  { id: 'wolf', name: 'wolf', a: 'A', home: 'forest', notWrong: ['grassland', 'polar', 'desert'], eats: 'animals', moves: ['runs'], covering: 'fur', size: 'medium', art: { emoji: '🐺' },
    parts: [{ part: 'nose', job: 'smell' }, { part: 'ears', job: 'hear' }], fact: 'Wolves live together in a family called a pack.', snack: '🍖',
    rescue: { call: 'A wolf pup is lost from its pack!', job: 'lead' } },
  { id: 'woodpecker', name: 'woodpecker', a: 'A', home: 'forest', notWrong: ['farm'], eats: 'both', moves: ['flies', 'climbs'], covering: 'feathers', size: 'small', art: { drawn: 'woodpecker' },
    parts: [{ part: 'strong beak', job: 'peck holes' }, { part: 'stiff tail', job: 'lean on the tree' }], fact: 'A woodpecker pecks holes in trees to find bugs.', snack: '🐛',
    rescue: { call: 'A woodpecker is tangled in kite string!', job: 'pull' } },

  // ---------- grassland ----------
  { id: 'lion', name: 'lion', a: 'A', home: 'grassland', notWrong: ['desert', 'forest'], eats: 'animals', moves: ['walks', 'runs'], covering: 'fur', size: 'large', art: { emoji: '🦁' },
    parts: [{ part: 'sharp claws', job: 'catch food' }, { part: 'sharp teeth', job: 'eat meat' }], fact: 'Lions live together in a family called a pride.', snack: '🍖',
    rescue: { call: 'A lion cub is lost in the tall grass!', job: 'lead' } },
  { id: 'zebra', name: 'zebra', a: 'A', home: 'grassland', eats: 'plants', moves: ['walks', 'runs'], covering: 'fur', size: 'large', art: { emoji: '🦓' },
    parts: [{ part: 'hooves', job: 'run' }], fact: 'No two zebras have the same stripes.', snack: '🌾',
    rescue: { call: 'A zebra is stuck in a muddy water hole!', job: 'lift' } },
  { id: 'giraffe', name: 'giraffe', a: 'A', home: 'grassland', notWrong: ['forest'], eats: 'plants', moves: ['walks', 'runs'], covering: 'fur', size: 'giant', art: { emoji: '🦒' },
    parts: [{ part: 'long neck', job: 'reach high leaves' }, { part: 'long tongue', job: 'grab leaves' }], fact: 'A giraffe is the tallest animal in the world.', snack: '🍃',
    rescue: { call: 'A giraffe is tangled in a wire fence!', job: 'pull' } },
  { id: 'elephant', name: 'elephant', a: 'An', home: 'grassland', notWrong: ['forest', 'desert'], eats: 'plants', moves: ['walks'], covering: 'skin', size: 'giant', art: { emoji: '🐘' },
    parts: [{ part: 'trunk', job: 'pick up food' }, { part: 'big ears', job: 'hear' }], fact: 'An elephant uses its trunk to smell, drink and pick up food.', snack: '🍉',
    rescue: { call: 'A baby elephant is stuck in a mud hole!', job: 'lift' } },
  { id: 'rhino', name: 'rhino', a: 'A', home: 'grassland', notWrong: ['forest'], eats: 'plants', moves: ['walks', 'runs'], covering: 'skin', size: 'giant', art: { emoji: '🦏' },
    parts: [{ part: 'horn', job: 'stay safe' }], fact: 'A rhino\'s horn is made of the same stuff as your fingernails.', snack: '🌾',
    rescue: { call: 'A rhino is lost far from its herd!', job: 'lead' } },
  { id: 'bison', name: 'bison', a: 'A', home: 'grassland', notWrong: ['forest'], eats: 'plants', moves: ['walks', 'runs'], covering: 'fur', size: 'large', art: { emoji: '🦬' },
    parts: [{ part: 'thick fur', job: 'keep warm' }], fact: 'A bison is the biggest land animal in North America.', snack: '🌾',
    rescue: { call: 'A bison is stuck in a ditch!', job: 'lift' } },
  { id: 'kangaroo', name: 'kangaroo', a: 'A', home: 'grassland', notWrong: ['desert', 'forest'], eats: 'plants', moves: ['hops'], covering: 'fur', size: 'large', art: { emoji: '🦘' },
    parts: [{ part: 'strong back legs', job: 'hop' }, { part: 'pouch', job: 'carry its baby' }], fact: 'A baby kangaroo, called a joey, grows in its mother\'s pouch.', snack: '🌾',
    rescue: { call: 'A kangaroo is tangled in a fence!', job: 'pull' } },
  { id: 'ostrich', name: 'ostrich', a: 'An', home: 'grassland', notWrong: ['desert'], eats: 'both', moves: ['runs', 'walks'], covering: 'feathers', size: 'large', art: { drawn: 'ostrich' },
    parts: [{ part: 'long legs', job: 'run fast' }], fact: 'An ostrich lays the biggest eggs of any bird.', snack: '🌱',
    rescue: { call: 'An ostrich is lost on a busy road!', job: 'lead' }, trick: 'cannot-fly' },

  // ---------- desert ----------
  { id: 'camel', name: 'camel', a: 'A', home: 'desert', eats: 'plants', moves: ['walks'], covering: 'fur', size: 'large', art: { emoji: '🐪' },
    parts: [{ part: 'long eyelashes', job: 'keep sand out of its eyes' }, { part: 'wide feet', job: 'walk on sand' }], fact: 'A camel can go a long time without drinking water.', snack: '🌿',
    rescue: { call: 'A camel is lost in a sandstorm!', job: 'lead' } },
  { id: 'fennec', name: 'fennec fox', a: 'A', home: 'desert', eats: 'both', moves: ['runs', 'digs'], covering: 'fur', size: 'small', art: { drawn: 'fennec' },
    parts: [{ part: 'big ears', job: 'stay cool' }], fact: 'A fennec fox\'s big ears help it stay cool.', snack: '🦗',
    rescue: { call: 'A fennec fox is stuck in a deep hole!', job: 'lift' } },
  { id: 'roadrunner', name: 'roadrunner', a: 'A', home: 'desert', notWrong: ['grassland'], eats: 'both', moves: ['runs'], covering: 'feathers', size: 'small', art: { drawn: 'roadrunner' },
    parts: [{ part: 'long legs', job: 'run fast' }], fact: 'A roadrunner is a bird that would rather run than fly.', snack: '🦗',
    rescue: { call: 'A roadrunner is tangled in some old string!', job: 'pull' } },
  { id: 'meerkat', name: 'meerkat', a: 'A', home: 'desert', notWrong: ['grassland'], eats: 'both', moves: ['runs', 'digs'], covering: 'fur', size: 'small', art: { drawn: 'meerkat' },
    parts: [{ part: 'claws', job: 'dig' }], fact: 'Meerkats take turns standing guard to watch for danger.', snack: '🪲',
    rescue: { call: 'A meerkat is lost far from its burrow!', job: 'lead' } },
  { id: 'rattlesnake', name: 'rattlesnake', a: 'A', home: 'desert', notWrong: ['grassland', 'forest'], eats: 'animals', moves: ['slithers'], covering: 'scales', size: 'medium', art: { drawn: 'rattlesnake' },
    parts: [{ part: 'rattle', job: 'warn others away' }, { part: 'tongue', job: 'smell' }], fact: 'A rattlesnake shakes its rattle to say stay away.', snack: '🥚',
    rescue: { call: 'A rattlesnake is tangled in a garden net!', job: 'pull' } },
  { id: 'tortoise', name: 'desert tortoise', a: 'A', home: 'desert', eats: 'plants', moves: ['walks', 'digs'], covering: 'shell', size: 'medium', art: { drawn: 'tortoise' },
    parts: [{ part: 'shell', job: 'stay safe' }, { part: 'strong front legs', job: 'dig' }], fact: 'A desert tortoise digs a burrow to hide from the heat.', snack: '🌸',
    rescue: { call: 'A desert tortoise is stuck in a ditch!', job: 'lift' } },

  // ---------- polar ----------
  { id: 'polarbear', name: 'polar bear', a: 'A', home: 'polar', notWrong: ['ocean'], pole: 'north', eats: 'animals', moves: ['walks', 'swims'], covering: 'fur', size: 'large', art: { emoji: '🐻‍❄️' },
    parts: [{ part: 'thick fur', job: 'keep warm' }, { part: 'big paws', job: 'swim' }], fact: 'Under its white fur, a polar bear has black skin.', snack: '🐟',
    rescue: { call: 'A polar bear cub fell through a crack in the ice!', job: 'lift' } },
  { id: 'penguin', name: 'penguin', a: 'A', home: 'polar', notWrong: ['ocean'], pole: 'south', eats: 'animals', moves: ['swims', 'waddles'], covering: 'feathers', size: 'medium', art: { emoji: '🐧' },
    parts: [{ part: 'flippers', job: 'swim' }], fact: 'A penguin uses its wings like flippers to swim.', snack: '🐟',
    rescue: { call: 'A penguin is lost far from the other penguins!', job: 'lead' }, trick: 'cannot-fly' },
  { id: 'walrus', name: 'walrus', a: 'A', home: 'polar', notWrong: ['ocean'], pole: 'north', eats: 'animals', moves: ['swims'], covering: 'skin', size: 'large', art: { drawn: 'walrus' },
    parts: [{ part: 'long tusks', job: 'pull itself onto the ice' }, { part: 'whiskers', job: 'find food' }], fact: 'A walrus uses its long tusks to pull itself out of the water.', snack: '🦪',
    rescue: { call: 'A walrus is tangled in a fishing net!', job: 'pull' } },
  { id: 'arcticfox', name: 'arctic fox', a: 'An', home: 'polar', pole: 'north', eats: 'both', moves: ['runs'], covering: 'fur', size: 'small', art: { drawn: 'arcticfox' },
    parts: [{ part: 'thick fur', job: 'keep warm' }, { part: 'furry paws', job: 'walk on ice' }], fact: 'An arctic fox has fur on the bottom of its paws.', snack: '🫐',
    rescue: { call: 'An arctic fox is stuck in a snowdrift!', job: 'lift' } },
  { id: 'snowyowl', name: 'snowy owl', a: 'A', home: 'polar', notWrong: ['grassland', 'farm'], pole: 'north', eats: 'animals', moves: ['flies'], covering: 'feathers', size: 'small', art: { drawn: 'snowyowl' },
    parts: [{ part: 'sharp claws', job: 'catch food' }, { part: 'big eyes', job: 'see' }], fact: 'A snowy owl has feathers on its feet to keep them warm.', snack: '🐁',
    rescue: { call: 'A snowy owl is tangled in an old fence!', job: 'pull' } },

  // ---------- farm ----------
  { id: 'sheep', name: 'sheep', a: 'A', home: 'farm', eats: 'plants', moves: ['walks'], covering: 'fur', size: 'medium', art: { emoji: '🐑' },
    parts: [{ part: 'woolly coat', job: 'keep warm' }], fact: 'We use a sheep\'s wool to make warm clothes.', snack: '🌾',
    rescue: { call: 'A sheep is stuck in a fence!', job: 'pull' } },
  { id: 'chicken', name: 'chicken', a: 'A', home: 'farm', eats: 'both', moves: ['walks', 'flaps'], covering: 'feathers', size: 'small', art: { emoji: '🐔' },
    parts: [{ part: 'beak', job: 'peck food' }], fact: 'A chicken hatches from an egg.', snack: '🌽',
    rescue: { call: 'A chicken is lost in the cornfield!', job: 'lead' } },
  { id: 'pig', name: 'pig', a: 'A', home: 'farm', eats: 'both', moves: ['walks'], covering: 'skin', size: 'medium', art: { emoji: '🐖' },
    parts: [{ part: 'snout', job: 'dig and smell' }], fact: 'Pigs roll in mud to keep cool.', snack: '🍎',
    rescue: { call: 'A pig is lost far from the barn!', job: 'lead' } },
  { id: 'goat', name: 'goat', a: 'A', home: 'farm', eats: 'plants', moves: ['walks', 'climbs'], covering: 'fur', size: 'medium', art: { emoji: '🐐' },
    parts: [{ part: 'hooves', job: 'climb' }], fact: 'Goats are great climbers.', snack: '🥕',
    rescue: { call: 'A goat is tangled in a rope!', job: 'pull' } },
  { id: 'cow', name: 'cow', a: 'A', home: 'farm', eats: 'plants', moves: ['walks'], covering: 'fur', size: 'large', art: { emoji: '🐄' },
    parts: [{ part: 'flat teeth', job: 'chew grass' }], fact: 'We get milk from cows.', snack: '🌾',
    rescue: { call: 'A cow is stuck in a muddy ditch!', job: 'lift' } },
  { id: 'horse', name: 'horse', a: 'A', home: 'farm', notWrong: ['grassland'], eats: 'plants', moves: ['walks', 'runs'], covering: 'fur', size: 'large', art: { emoji: '🐎' },
    parts: [{ part: 'hooves', job: 'run' }, { part: 'long tail', job: 'swish flies away' }], fact: 'A horse can sleep standing up.', snack: '🥕',
    rescue: { call: 'A horse is lost in the storm!', job: 'lead' } },
  { id: 'donkey', name: 'donkey', a: 'A', home: 'farm', notWrong: ['desert'], eats: 'plants', moves: ['walks'], covering: 'fur', size: 'large', art: { emoji: '🫏' },
    parts: [{ part: 'long ears', job: 'hear and stay cool' }], fact: 'A donkey\'s long ears help it hear and stay cool.', snack: '🥕',
    rescue: { call: 'A donkey is stuck in deep mud!', job: 'lift' } },

  // ---------- no one home: used in Animal Parts, Babies and Alive or Not, never in Where It Lives or the Park ----------
  { id: 'cat', name: 'cat', a: 'A', home: null, eats: 'animals', moves: ['walks', 'climbs'], covering: 'fur', size: 'small', art: { emoji: '🐈' }, parts: [{ part: 'whiskers', job: 'feel' }], fact: 'A cat uses its whiskers to feel its way.', snack: '🐟' },
  { id: 'dog', name: 'dog', a: 'A', home: null, eats: 'both', moves: ['walks', 'runs'], covering: 'fur', size: 'medium', art: { emoji: '🐕' }, parts: [{ part: 'nose', job: 'smell' }], fact: 'A dog has a very good nose.', snack: '🦴' },
  { id: 'bird', name: 'bird', a: 'A', home: null, eats: 'both', moves: ['flies'], covering: 'feathers', size: 'small', art: { emoji: '🐦' }, parts: [{ part: 'wings', job: 'fly' }, { part: 'beak', job: 'eat' }], fact: 'A bird has feathers.', snack: '🌻' },
  { id: 'fish', name: 'fish', a: 'A', home: null, eats: 'both', moves: ['swims'], covering: 'scales', size: 'small', art: { emoji: '🐟' }, parts: [{ part: 'gills', job: 'breathe underwater' }, { part: 'fins', job: 'swim' }], fact: 'A fish breathes underwater with gills.', snack: '🦐' },
  { id: 'rabbit', name: 'rabbit', a: 'A', home: null, eats: 'plants', moves: ['hops'], covering: 'fur', size: 'small', art: { emoji: '🐇' }, parts: [{ part: 'long ears', job: 'hear' }, { part: 'strong back legs', job: 'hop' }], fact: 'A rabbit hops on its strong back legs.', snack: '🥕' },
  { id: 'turtle', name: 'turtle', a: 'A', home: null, eats: 'both', moves: ['walks', 'swims'], covering: 'shell', size: 'small', art: { emoji: '🐢' }, parts: [{ part: 'shell', job: 'stay safe' }], fact: 'A turtle can pull its head into its shell.', snack: '🥬' },
  { id: 'duck', name: 'duck', a: 'A', home: null, eats: 'both', moves: ['swims', 'flies', 'walks'], covering: 'feathers', size: 'small', art: { emoji: '🦆' }, parts: [{ part: 'webbed feet', job: 'swim' }], fact: 'A duck paddles with its webbed feet.', snack: '🌿' },
  { id: 'owl', name: 'owl', a: 'An', home: null, eats: 'animals', moves: ['flies'], covering: 'feathers', size: 'small', art: { emoji: '🦉' }, parts: [{ part: 'big eyes', job: 'see at night' }, { part: 'sharp claws', job: 'catch food' }], fact: 'An owl has big eyes to see at night.', snack: '🐁' },
  { id: 'eagle', name: 'eagle', a: 'An', home: null, eats: 'animals', moves: ['flies'], covering: 'feathers', size: 'medium', art: { emoji: '🦅' }, parts: [{ part: 'sharp claws', job: 'catch food' }], fact: 'An eagle catches food with its sharp claws.', snack: '🐟' },
  { id: 'butterfly', name: 'butterfly', a: 'A', home: null, eats: 'plants', moves: ['flies'], covering: 'skin', size: 'small', art: { emoji: '🦋' }, parts: [{ part: 'wings', job: 'fly' }], fact: 'A butterfly starts life as a caterpillar.', snack: '🌸', trick: 'flies-but-not-a-bird' },
  { id: 'snail', name: 'snail', a: 'A', home: null, eats: 'plants', moves: ['slides'], covering: 'shell', size: 'small', art: { emoji: '🐌' }, parts: [{ part: 'shell', job: 'stay safe' }], fact: 'A snail carries its shell on its back.', snack: '🥬' },
  { id: 'koala', name: 'koala', a: 'A', home: null, eats: 'plants', moves: ['climbs'], covering: 'fur', size: 'small', art: { emoji: '🐨' }, parts: [{ part: 'sharp claws', job: 'climb' }], fact: 'A koala climbs trees with its sharp claws.', snack: '🍃' },
  { id: 'hedgehog', name: 'hedgehog', a: 'A', home: null, eats: 'animals', moves: ['walks'], covering: 'fur', size: 'small', art: { emoji: '🦔' }, parts: [{ part: 'spines', job: 'stay safe' }], fact: 'A hedgehog rolls into a spiky ball to stay safe.', snack: '🐛' },
  { id: 'snake', name: 'snake', a: 'A', home: null, eats: 'animals', moves: ['slithers'], covering: 'scales', size: 'small', art: { emoji: '🐍' }, parts: [{ part: 'tongue', job: 'smell' }], fact: 'A snake smells with its tongue.', snack: '🥚' },
  { id: 'ant', name: 'ant', a: 'An', home: null, eats: 'both', moves: ['walks'], covering: 'shell', size: 'small', art: { emoji: '🐜' }, parts: [{ part: 'feelers', job: 'feel' }], fact: 'An ant can carry things much heavier than itself.', snack: '🍯' },
  { id: 'worm', name: 'worm', a: 'A', home: null, eats: 'plants', moves: ['wiggles'], covering: 'skin', size: 'small', art: { emoji: '🪱' }, parts: [{ part: 'body', job: 'wiggle' }], fact: 'A worm has no legs.', snack: '🍂' },
] as const satisfies readonly Animal[];

export type AnimalDef = (typeof ANIMALS)[number];
export type AnimalId = AnimalDef['id'];
export type AnimalName = AnimalDef['name'];
export type AnimalFact = AnimalDef['fact'];
export type RescueCall = Extract<AnimalDef, { rescue: object }>['rescue']['call'];
export const animal = (id: AnimalId): AnimalDef => ANIMALS.find(a => a.id === id)!;
export const isAnimalId = (x: unknown): x is AnimalId => ANIMALS.some(a => a.id === x);
/** Animals with one clear home: Where It Lives asks only about these, and the Park holds only these. */
export const HOMED = ANIMALS.filter((a): a is Extract<AnimalDef, { home: HabitatId }> => a.home !== null);
/** Animals that can be rescued and live in the Park. */
export const RESCUABLE = ANIMALS.filter((a): a is Extract<AnimalDef, { rescue: object }> => 'rescue' in a);
export type RescueId = (typeof RESCUABLE)[number]['id'];
export const rescuable = (id: RescueId) => RESCUABLE.find(a => a.id === id)!;
export const isRescueId = (x: unknown): x is RescueId => RESCUABLE.some(a => a.id === x);
export const notWrongFor = (a: AnimalDef): readonly HabitatId[] => ('notWrong' in a ? a.notWrong : []) as readonly HabitatId[];
export const poleOf = (a: AnimalDef): 'north' | 'south' | null => ('pole' in a ? a.pole : null);
export const trickOf = (a: AnimalDef) => ('trick' in a ? a.trick : null);
/** Can a child be told, without argument, that this animal lives in that habitat? */
export const livesIn = (a: AnimalDef, h: HabitatId) => a.home === h;
/** Would offering this habitat as a wrong answer for this animal be arguable? */
export const arguable = (a: AnimalDef, h: HabitatId) => a.home === h || notWrongFor(a).includes(h);
