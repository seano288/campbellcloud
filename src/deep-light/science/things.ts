// What the questions are about, in plain tables, each line checked against a source (.scratch/deep-light/spec.md, Sources). Every
// name here is said aloud on its own; every sentence is a whole recorded line.
//
// - Light to See: things that make their own light and things that don't. The moon is kept apart (MOON): it is never offered at
//   Levels 1 and 2, right or wrong, and comes at Level 3 with its own lesson.
// - Through or Not: what a beam does at each material, from a hand-checked table. "Lets some light through" uses only the clear cases
//   named in NGSS 1-PS4-3 and the teaching sources (wax paper, frosted glass, tissue paper).
// - Shadows: things with a silhouette class; two things on one screen never share a class, so a shadow can only be one thing's.
// - Shake and Sound: how loud each sound source is (shown by the size of its rings), and what shakes.
// - Signals: what to use to say hello far away, and the flash key.
import type { Pass } from './optics';

// ---------- Light to See ----------

export interface LightThing { readonly id: string; readonly name: string; readonly icon: string; readonly own: boolean }
/** "Tap everything that makes its own light": sources, and things that only show when light shines on them. */
export const LIGHT_THINGS = [
  { id: 'sun', name: 'the sun', icon: '☀️', own: true },
  { id: 'flashlight', name: 'a flashlight', icon: '🔦', own: true },
  { id: 'candle', name: 'a candle', icon: '🕯️', own: true },
  { id: 'fire', name: 'a campfire', icon: '🔥', own: true },
  { id: 'bulb', name: 'a light bulb', icon: '💡', own: true },
  { id: 'angler', name: 'an anglerfish', icon: 'animal:anglerfish', own: true },
  { id: 'lantern', name: 'a lanternfish', icon: 'animal:lanternfish', own: true },
  { id: 'rock', name: 'a rock', icon: '🪨', own: false },
  { id: 'shell', name: 'a shell', icon: '🐚', own: false },
  { id: 'crab', name: 'a crab', icon: '🦀', own: false },
  { id: 'ball', name: 'a ball', icon: '⚽', own: false },
  { id: 'book', name: 'a book', icon: '📕', own: false },
  { id: 'teddy', name: 'a teddy bear', icon: '🧸', own: false },
  { id: 'apple', name: 'an apple', icon: '🍎', own: false },
  { id: 'anchor', name: 'an anchor', icon: '⚓', own: false },
  { id: 'boot', name: 'a boot', icon: '👢', own: false },
] as const satisfies readonly LightThing[];
export type LightId = (typeof LIGHT_THINGS)[number]['id'];
/** The classic mix-up: it shines in the night sky, but only with the sun's light bouncing off it (NASA). Level 3 only. */
export const MOON = { id: 'moon', name: 'the moon', icon: '🌕', own: false } as const;
export const lightThing = (id: string) => (id === MOON.id ? MOON : LIGHT_THINGS.find(t => t.id === id)!);

/** The animal hidden in a cave. */
export const CAVE_ANIMALS = [
  { id: 'crab', name: 'crab', icon: '🦀' },
  { id: 'fish', name: 'fish', icon: '🐠' },
  { id: 'octopus', name: 'octopus', icon: '🐙' },
  { id: 'turtle', name: 'turtle', icon: '🐢' },
  { id: 'shrimp', name: 'shrimp', icon: '🦐' },
] as const;
export type CaveAnimalId = (typeof CAVE_ANIMALS)[number]['id'];

export const SEE_Q = {
  crab: 'In which cave can you see the crab?', fish: 'In which cave can you see the fish?', octopus: 'In which cave can you see the octopus?',
  turtle: 'In which cave can you see the turtle?', shrimp: 'In which cave can you see the shrimp?',
} as const satisfies Record<CaveAnimalId, string>;
export const WHY_Q = {
  crab: "Why can't you see the crab?", fish: "Why can't you see the fish?", octopus: "Why can't you see the octopus?",
  turtle: "Why can't you see the turtle?", shrimp: "Why can't you see the shrimp?",
} as const satisfies Record<CaveAnimalId, string>;
/** "Why can't you see it?": one reason is the science; the others are plainly not why. */
export const WHY_CHOICES = [
  { id: 'dark', said: 'There is no light on it.', icon: '🌑', right: true },
  { id: 'quiet', said: 'It is too quiet.', icon: '🤫', right: false },
  { id: 'asleep', said: 'It is asleep.', icon: '😴', right: false },
  { id: 'wet', said: 'It is wet.', icon: '💧', right: false },
] as const;
export const OWN_ASK = 'Tap everything that makes its own light. Then tap the check.';
export const SUN_MOON_Q = 'Which one makes its own light?';
export const SEE_LINES = {
  lamp: 'We see things when light shines on them.',
  own: 'These make their own light.',
  dark: 'With no light on it, we cannot see it.',
  moon: 'The moon does not make its own light. Light from the sun bounces off it.',
  sun: 'The sun makes its own light.',
} as const;

// ---------- Through or Not ----------

export interface Material { readonly id: string; readonly name: string; readonly pass: Pass; readonly look: 'glass' | 'plastic' | 'wax' | 'frost' | 'tissue' | 'wood' | 'card' | 'metal' | 'brick' | 'rock' }
/** Hand-checked: only clear cases. All the light: clear glass and plastic. Some: wax paper (NGSS 1-PS4-3's own example), frosted
 *  glass and tissue paper. None: thick, solid things. */
export const MATERIALS = [
  { id: 'glass', name: 'clear glass', pass: 'all', look: 'glass' },
  { id: 'plastic', name: 'clear plastic', pass: 'all', look: 'plastic' },
  { id: 'wax', name: 'wax paper', pass: 'some', look: 'wax' },
  { id: 'frosted', name: 'frosted glass', pass: 'some', look: 'frost' },
  { id: 'tissue', name: 'tissue paper', pass: 'some', look: 'tissue' },
  { id: 'wood', name: 'wood', pass: 'none', look: 'wood' },
  { id: 'cardboard', name: 'cardboard', pass: 'none', look: 'card' },
  { id: 'metal', name: 'metal', pass: 'none', look: 'metal' },
  { id: 'brick', name: 'a brick', pass: 'none', look: 'brick' },
  { id: 'stone', name: 'a stone', pass: 'none', look: 'rock' },
] as const satisfies readonly Material[];
export type MaterialId = (typeof MATERIALS)[number]['id'];
export const material = (id: string) => MATERIALS.find(m => m.id === id)!;

export const THROUGH_Q = { all: 'Which one lets the light through?', none: 'Which one blocks the light?' } as const;
export const SORT_ASK = 'Put each one where it goes. Then tap the check.';
export const WALL_Q = 'What will the wall look like?';
/** The three bins of a sort, and the three looks of the wall, said as they light. */
export const PASS_SAID = { all: 'Lets all the light through.', some: 'Lets some light through.', none: 'Blocks the light.' } as const satisfies Record<Pass, string>;
export const WALL_SAID = { bright: 'A bright spot.', dim: 'A dim glow.', shadow: 'A shadow.' } as const;
/** Level 3 meets the school words (NGSS 1-PS4-3 names them for first grade). */
export const SCHOOL_WORD = {
  all: 'It lets all the light through. It is transparent.',
  some: 'It lets some light through. It is translucent.',
  none: 'It blocks the light. It is opaque.',
} as const satisfies Record<Pass, string>;
export const THROUGH_LINES = { stops: 'The light stops.', goes: 'The light goes through.', some: 'Only some light gets through.' } as const;

// ---------- Mirrors ----------

/** "Which one bounces the light?": a mirror, and things that stop the beam (never glass, which bounces a little). */
export const BOUNCE_OTHERS = ['wood', 'cardboard', 'brick', 'stone'] as const satisfies readonly MaterialId[];
export const MIRROR_Q = {
  which: 'Which one bounces the light?',
  turn: 'Tap the mirror to turn it. Make the light hit the gem! Then tap the check.',
  two: 'Turn the mirrors so the light hits the gem! Then tap the check.',
  spot: 'Where should the mirror go, so the light hits the gem?',
} as const;
export const MIRROR_LINES = { bounces: 'A mirror bounces the light.', turn: 'Turn the mirror, and the light turns too.', yourTurn: 'Now you turn it!' } as const;

// ---------- Shadows ----------

export interface ShadowThing { readonly id: string; readonly name: string; readonly icon: string; readonly shape: string }
/** `shape`: things in the same class could cast shadows that look alike, so a question never shows two from one class. */
export const SHADOW_THINGS = [
  { id: 'fish', name: 'a fish', icon: '🐟', shape: 'fish' },
  { id: 'whale', name: 'a whale', icon: '🐳', shape: 'fish' },
  { id: 'dolphin', name: 'a dolphin', icon: '🐬', shape: 'fish' },
  { id: 'crab', name: 'a crab', icon: '🦀', shape: 'claws' },
  { id: 'lobster', name: 'a lobster', icon: '🦞', shape: 'claws' },
  { id: 'octopus', name: 'an octopus', icon: '🐙', shape: 'arms' },
  { id: 'squid', name: 'a squid', icon: '🦑', shape: 'arms' },
  { id: 'turtle', name: 'a turtle', icon: '🐢', shape: 'turtle' },
  { id: 'anchor', name: 'an anchor', icon: '⚓', shape: 'anchor' },
  { id: 'shell', name: 'a shell', icon: '🐚', shape: 'spiral' },
  { id: 'snail', name: 'a snail', icon: '🐌', shape: 'spiral' },
  { id: 'duck', name: 'a duck', icon: '🦆', shape: 'bird' },
  { id: 'penguin', name: 'a penguin', icon: '🐧', shape: 'bird' },
  { id: 'key', name: 'a key', icon: '🔑', shape: 'key' },
  { id: 'umbrella', name: 'an umbrella', icon: '☂️', shape: 'umbrella' },
  { id: 'bell', name: 'a bell', icon: '🔔', shape: 'bell' },
  { id: 'boot', name: 'a boot', icon: '👢', shape: 'boot' },
  { id: 'cactus', name: 'a cactus', icon: '🌵', shape: 'cactus' },
] as const satisfies readonly ShadowThing[];
export type ShadowId = (typeof SHADOW_THINGS)[number]['id'];
export const shadowThing = (id: string) => SHADOW_THINGS.find(t => t.id === id)!;
export const SHADOW_Q = {
  match: 'Which shadow belongs to it?',
  where: 'Tap where the shadow will be.',
  lamp: 'Which lamp made this shadow?',
} as const;
export const SHADOW_LINES = {
  match: 'The shadow has the same shape.',
  away: 'The shadow falls on the side away from the lamp.',
  swing: 'Move the lamp, and the shadow moves too.',
  yourTurn: 'Now you move the lamp!',
} as const;

// ---------- Shake and Sound ----------

/** How loud: 1 quiet, 3 loud. Its rings on screen grow with it, so the picture says how loud even with the sound off. */
export const SOUNDS = [
  { id: 'drumBig', name: 'a big drum bang', icon: '🥁', loud: 3 },
  { id: 'drumTap', name: 'a little drum tap', icon: '🥁', loud: 1 },
  { id: 'lion', name: 'a lion roar', icon: '🦁', loud: 3 },
  { id: 'kitten', name: 'a kitten meowing', icon: '🐱', loud: 1 },
  { id: 'siren', name: 'a fire truck siren', icon: '🚒', loud: 3 },
  { id: 'whisper', name: 'a whisper', icon: '🤫', loud: 1 },
  { id: 'thunder', name: 'thunder', icon: '⛈️', loud: 3 },
  { id: 'drip', name: 'a drip of water', icon: '💧', loud: 1 },
  { id: 'horn', name: 'a ship horn', icon: '🚢', loud: 3 },
  { id: 'clock', name: 'a clock ticking', icon: '⏰', loud: 1 },
] as const;
export type SoundId = (typeof SOUNDS)[number]['id'];
export const sound = (id: string) => SOUNDS.find(s => s.id === id)!;
/** Pairs that are plainly one loud and one quiet. */
export const LOUD_PAIRS = [['drumBig', 'drumTap'], ['lion', 'kitten'], ['siren', 'whisper'], ['thunder', 'drip'], ['horn', 'clock']] as const satisfies readonly (readonly [SoundId, SoundId])[];
export const LOUD_Q = { loud: 'Which one is loud?', quiet: 'Which one is quiet?' } as const;
/** What can shake: drawn shaking (blurred, with rings), or still. */
export const SHAKERS = [
  { id: 'drum', name: 'a drum', icon: '🥁' },
  { id: 'string', name: 'a string', icon: 'string' },
  { id: 'bell', name: 'a bell', icon: '🔔' },
  { id: 'guitar', name: 'a guitar', icon: '🎸' },
] as const;
export type ShakerId = (typeof SHAKERS)[number]['id'];
export const SHAKE_Q = 'Tap the one that is shaking.';
export const SOUND_Q3 = {
  stop: { q: 'The string stops shaking. What happens to the sound?', right: 'The sound stops.', wrong: ['The sound gets louder.', 'The sound keeps going.'] },
  harder: { q: 'You hit the drum harder. What happens to the sound?', right: 'The sound gets louder.', wrong: ['The sound stops.', 'The sound gets quieter.'] },
  paper: { q: 'The speaker plays a loud sound. What does the paper next to it do?', right: 'The paper shakes.', wrong: ['The paper stays still.', 'The paper glows.'] },
} as const;
export type SoundForm3 = keyof typeof SOUND_Q3;
export const SOUND3_ICONS: Record<string, string> = {
  'The sound stops.': '🔇', 'The sound gets louder.': '🔊', 'The sound keeps going.': '🔁', 'The sound gets quieter.': '🔈',
  'The paper shakes.': '〰️', 'The paper stays still.': '📄', 'The paper glows.': '✨',
};
export const SOUND_LINES = {
  loud: 'Big rings mean a loud sound.', quiet: 'Small rings mean a quiet sound.',
  shake: 'Things that make a sound are shaking.', stop: 'When the shaking stops, the sound stops.',
  harder: 'A bigger shake makes a louder sound.', paper: 'Sound can make things shake too.',
  pluck: 'Pluck it!', yourTurn: 'Now you try!',
} as const;

// ---------- Signals ----------

export const SIGNAL_ITEMS = [
  { id: 'flashlight', said: 'A flashlight.', icon: '🔦' },
  { id: 'wave', said: 'Wave your hand.', icon: '👋' },
  { id: 'whisper', said: 'Whisper.', icon: '🤫' },
  { id: 'horn', said: 'Blow a horn.', icon: '📯' },
] as const;
export type SignalItem = (typeof SIGNAL_ITEMS)[number]['id'];
/** The scene, and the one thing that works there: in the dark only light is seen; behind a rock only sound gets round. */
export const HELLO = {
  dark: { q: 'It is dark, and your friend is far away. What can you use to say hello?', right: 'flashlight', wrong: ['wave', 'whisper'], lesson: 'In the dark, your friend can see a light far away.' },
  rock: { q: 'Your friend is far away, behind a big rock. What can you use to say hello?', right: 'horn', wrong: ['flashlight', 'wave'], lesson: 'Light cannot get through the rock, but a loud sound can be heard.' },
} as const satisfies Record<string, { q: string; right: SignalItem; wrong: readonly SignalItem[]; lesson: string }>;
export type HelloScene = keyof typeof HELLO;
export const COPY_Q = 'Watch the lighthouse. Then copy its flashes! Tap the check when you are done.';
export const FLASH_SAID = { s: 'Short.', l: 'Long.' } as const;
/** Level 3's key: how many flashes mean what. */
export const KEY = [
  { n: 1, said: 'Hello!', icon: '👋' },
  { n: 2, said: 'Come here!', icon: '➡️' },
  { n: 3, said: 'Stop!', icon: '🛑' },
] as const;
export const KEY_Q = 'Count the flashes. What did the lighthouse say?';
export const KEY_LINE = 'One flash says hello. Two flashes say come here. Three flashes say stop.';
export const SIGNAL_LINES = { watch: 'Watch again.', count: 'Count with me.' } as const;
