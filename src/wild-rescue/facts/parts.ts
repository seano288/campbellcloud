// Animal Parts: what a body part is for (NGSS 1-LS1-1). Plain data, no game code.
//
// Level 1 taps the part on a drawn animal (art/diagrams.tsx draws each one with the same part names). Level 2 asks why an animal has
// a part, with three spoken sentence choices. Level 3 names a part and its job and asks which other animal also has one for that job.
//
// Every wrong choice is listed by hand, so each was read as plainly wrong for that animal and part: no elephant is told its trunk is
// not for breathing (elephants snorkel with it), no fennec fox is told its ears are not for hearing, and no penguin's flippers are
// set against flying. Bats, whales and ostriches stay out of this kind altogether.
import type { AnimalId } from './animals';

// ---------- Level 1: tap the part ----------

export interface Diagram {
  readonly animal: AnimalId;
  /** The parts drawn as separate tap targets. */
  readonly parts: readonly string[];
  readonly asks: readonly { readonly q: string; readonly part: string; readonly lesson: string }[];
}

export const DIAGRAMS = [
  { animal: 'bird', parts: ['wings', 'beak', 'feet'], asks: [
    { q: 'What does a bird use to fly?', part: 'wings', lesson: 'A bird uses its wings to fly.' },
    { q: 'What does a bird use to eat?', part: 'beak', lesson: 'A bird uses its beak to eat.' },
    { q: 'What does a bird use to hold on to a branch?', part: 'feet', lesson: 'A bird uses its feet to hold on to a branch.' },
  ] },
  { animal: 'fish', parts: ['gills', 'fins', 'mouth'], asks: [
    { q: 'What does a fish use to breathe?', part: 'gills', lesson: 'A fish uses its gills to breathe underwater.' },
    { q: 'What does a fish use to swim?', part: 'fins', lesson: 'A fish uses its fins to swim.' },
    { q: 'What does a fish use to eat?', part: 'mouth', lesson: 'A fish uses its mouth to eat.' },
  ] },
  { animal: 'elephant', parts: ['trunk', 'ears', 'tail'], asks: [
    { q: 'What does an elephant use to pick up food?', part: 'trunk', lesson: 'An elephant uses its trunk to pick up food.' },
    { q: 'What does an elephant use to hear?', part: 'ears', lesson: 'An elephant uses its big ears to hear.' },
  ] },
  { animal: 'rabbit', parts: ['ears', 'legs', 'nose'], asks: [
    { q: 'What does a rabbit use to hear?', part: 'ears', lesson: 'A rabbit uses its long ears to hear.' },
    { q: 'What does a rabbit use to hop?', part: 'legs', lesson: 'A rabbit uses its strong back legs to hop.' },
    { q: 'What does a rabbit use to smell?', part: 'nose', lesson: 'A rabbit uses its nose to smell.' },
  ] },
  { animal: 'turtle', parts: ['shell', 'legs', 'head'], asks: [
    { q: 'What does a turtle use to stay safe?', part: 'shell', lesson: 'A turtle hides in its shell to stay safe.' },
    { q: 'What does a turtle use to walk?', part: 'legs', lesson: 'A turtle uses its legs to walk.' },
  ] },
  { animal: 'giraffe', parts: ['neck', 'tail', 'legs'], asks: [
    { q: 'What does a giraffe use to reach high leaves?', part: 'neck', lesson: 'A giraffe uses its long neck to reach high leaves.' },
    { q: 'What does a giraffe use to swish flies away?', part: 'tail', lesson: 'A giraffe uses its tail to swish flies away.' },
  ] },
] as const satisfies readonly Diagram[];

// ---------- the jobs a part can do, as the sentence choices of Level 2 ----------

export const JOBS = {
  warm: { said: 'To keep warm.', icon: '🧣' },
  swim: { said: 'To swim.', icon: '🏊' },
  breathe: { said: 'To breathe underwater.', icon: '🫧' },
  pick: { said: 'To pick up food.', icon: '🍎' },
  reach: { said: 'To reach high leaves.', icon: '🌳' },
  hear: { said: 'To hear.', icon: '👂' },
  safe: { said: 'To stay safe.', icon: '🛡️' },
  carry: { said: 'To carry food.', icon: '🧺' },
  night: { said: 'To see at night.', icon: '🌙' },
  chew: { said: 'To chew wood.', icon: '🪵' },
  bugs: { said: 'To catch bugs.', icon: '🪰' },
  sand: { said: 'To keep sand out of its eyes.', icon: '👁️' },
  hop: { said: 'To hop.', icon: '⤴️' },
  grab: { said: 'To grab food.', icon: '🍖' },
  cool: { said: 'To stay cool.', icon: '🧊' },
  fly: { said: 'To fly.', icon: '🪽' },
} as const;
export type JobId = keyof typeof JOBS;
export type JobLine = (typeof JOBS)[JobId]['said'];

// ---------- Level 2: why does it have it? ----------

export interface Why {
  readonly animal: AnimalId;
  readonly q: string;
  readonly right: JobId;
  /** Two of these are offered beside the right one. */
  readonly wrong: readonly JobId[];
  readonly lesson: string;
}

export const WHYS = [
  { animal: 'polarbear', q: 'Why does a polar bear have thick fur?', right: 'warm', wrong: ['fly', 'breathe', 'chew'], lesson: 'A polar bear\'s thick fur keeps it warm.' },
  { animal: 'duck', q: 'Why does a duck have webbed feet?', right: 'swim', wrong: ['hear', 'night', 'chew'], lesson: 'A duck\'s webbed feet help it swim.' },
  { animal: 'fish', q: 'Why does a fish have gills?', right: 'breathe', wrong: ['hear', 'reach', 'fly'], lesson: 'A fish\'s gills let it breathe underwater.' },
  { animal: 'elephant', q: 'Why does an elephant have a trunk?', right: 'pick', wrong: ['fly', 'night', 'chew'], lesson: 'An elephant\'s trunk can pick up food.' },
  { animal: 'giraffe', q: 'Why does a giraffe have a long neck?', right: 'reach', wrong: ['swim', 'breathe', 'fly'], lesson: 'A giraffe\'s long neck helps it reach high leaves.' },
  { animal: 'rabbit', q: 'Why does a rabbit have long ears?', right: 'hear', wrong: ['swim', 'fly', 'chew'], lesson: 'A rabbit\'s long ears help it hear.' },
  { animal: 'turtle', q: 'Why does a turtle have a shell?', right: 'safe', wrong: ['fly', 'hear', 'night'], lesson: 'A turtle\'s shell keeps it safe.' },
  { animal: 'chipmunk', q: 'Why does a chipmunk have cheek pouches?', right: 'carry', wrong: ['fly', 'hear', 'night'], lesson: 'A chipmunk carries food in its cheek pouches.' },
  { animal: 'owl', q: 'Why does an owl have big eyes?', right: 'night', wrong: ['swim', 'chew', 'carry'], lesson: 'An owl\'s big eyes help it see at night.' },
  { animal: 'beaver', q: 'Why does a beaver have big front teeth?', right: 'chew', wrong: ['fly', 'hear', 'night'], lesson: 'A beaver\'s big front teeth can chew wood.' },
  { animal: 'frog', q: 'Why does a frog have a long sticky tongue?', right: 'bugs', wrong: ['hear', 'fly', 'warm'], lesson: 'A frog\'s long sticky tongue catches bugs.' },
  { animal: 'camel', q: 'Why does a camel have long eyelashes?', right: 'sand', wrong: ['swim', 'fly', 'hear'], lesson: 'A camel\'s long eyelashes keep sand out of its eyes.' },
  { animal: 'kangaroo', q: 'Why does a kangaroo have strong back legs?', right: 'hop', wrong: ['hear', 'breathe', 'fly'], lesson: 'A kangaroo\'s strong back legs help it hop.' },
  { animal: 'eagle', q: 'Why does an eagle have sharp claws?', right: 'grab', wrong: ['swim', 'hear', 'warm'], lesson: 'An eagle\'s sharp claws grab its food.' },
  { animal: 'fennec', q: 'Why does a fennec fox have big ears?', right: 'cool', wrong: ['swim', 'fly', 'chew'], lesson: 'A fennec fox\'s big ears help it stay cool.' },
  { animal: 'penguin', q: 'Why does a penguin have flippers?', right: 'swim', wrong: ['hear', 'chew', 'night'], lesson: 'A penguin\'s flippers help it swim.' },
  { animal: 'hedgehog', q: 'Why does a hedgehog have spines?', right: 'safe', wrong: ['fly', 'swim', 'hear'], lesson: 'A hedgehog\'s spines keep it safe.' },
] as const satisfies readonly Why[];

// ---------- Level 3: which animal also uses that part for that job? ----------

export interface AlsoUses {
  readonly shown: AnimalId;
  readonly q: string;
  readonly right: AnimalId;
  /** Two of these are offered beside the right one: none has that part for that job. */
  readonly wrong: readonly AnimalId[];
  readonly lesson: string;
}

export const ALSO_USES = [
  { shown: 'bird', q: 'A bird uses its wings to fly. Which animal also uses wings to fly?', right: 'butterfly', wrong: ['fish', 'cow', 'snail'], lesson: 'A butterfly uses its wings to fly too.' },
  { shown: 'duck', q: 'A duck has webbed feet to swim. Which animal also has webbed feet?', right: 'frog', wrong: ['horse', 'chicken', 'cow'], lesson: 'A frog has webbed feet to swim too.' },
  { shown: 'raccoon', q: 'A raccoon uses its claws to climb. Which animal also uses claws to climb?', right: 'koala', wrong: ['fish', 'cow', 'snail'], lesson: 'A koala uses its claws to climb too.' },
  { shown: 'fish', q: 'A fish breathes underwater with gills. Which animal also has gills?', right: 'shark', wrong: ['dog', 'cow', 'bird'], lesson: 'A shark has gills too.' },
  { shown: 'turtle', q: 'A turtle has a shell to stay safe. Which animal also has a shell?', right: 'snail', wrong: ['dog', 'rabbit', 'cow'], lesson: 'A snail has a shell too.' },
  { shown: 'kangaroo', q: 'A kangaroo uses its strong back legs to hop. Which animal also hops?', right: 'rabbit', wrong: ['snake', 'cow', 'worm'], lesson: 'A rabbit hops too.' },
  { shown: 'eagle', q: 'An eagle catches food with its sharp claws. Which animal also does?', right: 'owl', wrong: ['cow', 'sheep', 'fish'], lesson: 'An owl catches food with its sharp claws too.' },
  { shown: 'hedgehog', q: 'A hedgehog has spines to stay safe. Which animal also has spines?', right: 'pufferfish', wrong: ['cow', 'horse', 'sheep'], lesson: 'A pufferfish has spines too.' },
  { shown: 'polarbear', q: 'A polar bear has thick fur to keep warm. Which animal also has thick fur to keep warm?', right: 'arcticfox', wrong: ['snake', 'fish', 'worm'], lesson: 'An arctic fox has thick fur to keep warm too.' },
] as const satisfies readonly AlsoUses[];
