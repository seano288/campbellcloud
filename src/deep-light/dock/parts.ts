// Everything at the Dock he can earn, and what each one does. Plain tables: dock.ts holds his save and the buying.
//
// The parts are the lesson: Headlights set how far and how wide his light reaches (he sees only what it touches), Sonar's ping draws
// the outline of things his light can't reach (sound finding what light can't), a stronger Hull goes deeper, the Motor goes faster,
// the Claw reaches further for treasure, and the Camera Flash lights the whole sea for a moment. The rest is how his submarine looks
// and sounds, who rides in the window, and things for the Dock. No price is over 100 Bolts, the most the recorded numbers say.
//
// Since 2026-11-21 he also chooses which submarine he dives in (dock/subs.ts) and builds each one: a nose, a tail, fins and a top,
// each drawn to fit every submarine (art/pieces.ts). Each submarine keeps its own build and its own looks; the parts are shared.
import { SUBS, type SubName } from './subs';

export const TABS = ['sub', 'nose', 'tail', 'fins', 'top', 'hull', 'lights', 'sonar', 'motor', 'claw', 'flash', 'paint', 'stripes', 'beam', 'horn', 'buddy', 'trail', 'dock'] as const;
export type Tab = (typeof TABS)[number];
export const TAB_NAMES = {
  sub: 'Submarines', nose: 'Noses', tail: 'Tails', fins: 'Fins', top: 'Tops',
  hull: 'Hull', lights: 'Headlights', sonar: 'Sonar', motor: 'Motor', claw: 'Claw', flash: 'Camera Flash', paint: 'Paint',
  stripes: 'Glow Stripes', beam: 'Light Colors', horn: 'Horns', buddy: 'Buddy', trail: 'Bubble Trails', dock: 'The Dock',
} as const satisfies Record<Tab, string>;
/** The tabs whose items go on his submarine (one at a time); the Submarines tab picks which one, and the Dock tab collects things. */
export const FITTED = ['nose', 'tail', 'fins', 'top', 'hull', 'lights', 'sonar', 'motor', 'claw', 'flash', 'paint', 'stripes', 'beam', 'horn', 'buddy', 'trail'] as const satisfies readonly Tab[];
export type FitTab = (typeof FITTED)[number];
/** What each submarine keeps for itself (its build and its looks); the rest is shared by all of them. */
export const OWN_TABS = ['nose', 'tail', 'fins', 'top', 'paint', 'stripes', 'beam', 'horn', 'buddy', 'trail'] as const satisfies readonly FitTab[];
export type OwnTab = (typeof OWN_TABS)[number];
/** The parts that change the Dive, in Rungs: 0 is the free starter. */
export const RUNGED = ['hull', 'lights', 'sonar', 'motor', 'claw', 'flash'] as const satisfies readonly Tab[];
export type RungTab = (typeof RUNGED)[number];

export interface ItemDef {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  /** A Rung: 0 is the free starter. */
  readonly rung?: number;
  readonly color?: string;
  readonly color2?: string;
  readonly pattern?: string;
  readonly emoji?: string;
}

/** The submarines, as things to buy (dock/subs.ts says what each does). */
export const SUB_ITEMS = SUBS.map(({ id, name, price }) => ({ id, name, price }));

/** What goes on the front of his submarine. */
export const NOSES = [
  { id: 'round', name: 'Round Nose', price: 0 },
  { id: 'bumper', name: 'Bumper', price: 5 },
  { id: 'pointy', name: 'Pointy Nose', price: 8 },
  { id: 'scoop', name: 'Scoop Net', price: 12 },
  { id: 'drill', name: 'Drill Nose', price: 15 },
  { id: 'saw', name: 'Saw Nose', price: 20 },
  { id: 'narwhal', name: 'Narwhal Tusk', price: 25 },
  { id: 'hammer', name: 'Hammerhead', price: 30 },
  { id: 'rocket', name: 'Rocket Nose', price: 35 },
  { id: 'crystal', name: 'Crystal Nose', price: 45 },
  { id: 'icebreaker', name: 'Ice Breaker', price: 50 },
  { id: 'unicorn', name: 'Unicorn Horn', price: 60 },
] as const satisfies readonly ItemDef[];
/** What pushes him along at the back. */
export const TAILS = [
  { id: 'prop', name: 'Propeller', price: 0 },
  { id: 'twin', name: 'Twin Propellers', price: 8 },
  { id: 'ring', name: 'Ring Propeller', price: 12 },
  { id: 'fish', name: 'Fish Tail', price: 15 },
  { id: 'whale', name: 'Whale Tail', price: 20 },
  { id: 'jet', name: 'Jet Engine', price: 25 },
  { id: 'paddle', name: 'Paddle Wheel', price: 30 },
  { id: 'mermaid', name: 'Mermaid Tail', price: 35 },
  { id: 'bubblejets', name: 'Bubble Jets', price: 40 },
  { id: 'boosters', name: 'Rocket Boosters', price: 50 },
  { id: 'rainbowjet', name: 'Rainbow Jet', price: 65 },
] as const satisfies readonly ItemDef[];
/** The fins at the back, above and below. */
export const FINS = [
  { id: 'little', name: 'Little Fins', price: 0 },
  { id: 'big', name: 'Big Fins', price: 6 },
  { id: 'round', name: 'Round Fins', price: 8 },
  { id: 'wing', name: 'Wing Fins', price: 10 },
  { id: 'spiky', name: 'Spiky Fins', price: 14 },
  { id: 'shark', name: 'Shark Fins', price: 18 },
  { id: 'ray', name: 'Ray Wings', price: 24 },
  { id: 'butterfly', name: 'Butterfly Fins', price: 30 },
  { id: 'dragon', name: 'Dragon Wings', price: 40 },
  { id: 'gold', name: 'Gold Fins', price: 50 },
  { id: 'glow', name: 'Glow Fins', price: 60 },
] as const satisfies readonly ItemDef[];
/** What sits on top (the sonar dish and the camera go on top of it). */
export const TOPS = [
  { id: 'tower', name: 'Tower', price: 0 },
  { id: 'hatch', name: 'Little Hatch', price: 5 },
  { id: 'dome', name: 'Glass Dome', price: 10 },
  { id: 'tall', name: 'Tall Tower', price: 12 },
  { id: 'flag', name: 'Flag Tower', price: 15 },
  { id: 'nest', name: "Crow's Nest", price: 20 },
  { id: 'antenna', name: 'Big Antenna', price: 25 },
  { id: 'castle', name: 'Castle Tower', price: 30 },
  { id: 'lighthouse', name: 'Lighthouse Top', price: 35 },
  { id: 'party', name: 'Party Hat', price: 40 },
  { id: 'crown', name: 'Crown', price: 50 },
] as const satisfies readonly ItemDef[];

const rungs = <const N extends readonly string[]>(names: N, prices: readonly number[]) =>
  names.map((name, i) => ({ id: `r${i}`, name: name as N[number], price: i === 0 ? 0 : prices[i - 1]!, rung: i }));

/** How deep each Hull goes: the zones open to it (sea/zones.ts gives each zone the Hull it needs). */
export const HULLS = rungs(['Starter Hull', 'Strong Hull', 'Steel Hull', 'Deep Hull', 'Titan Hull', 'Super Hull', 'Ultra Hull'], [10, 20, 32, 48, 68, 90]);
/** How far (world units) and how wide (half the cone, in radians) the light reaches. */
export const LIGHT_REACH = [300, 360, 420, 480, 550, 640] as const;
export const LIGHT_HALF = [0.36, 0.41, 0.47, 0.52, 0.58, 0.66] as const;
export const LIGHTS = rungs(['Little Lights', 'Bright Lights', 'Wide Lights', 'Long Lights', 'Super Lights', 'Mega Lights'], [8, 16, 26, 40, 60]);
/** How far a ping reaches, and how often it goes out on its own (seconds). */
export const SONAR_RANGE = [380, 480, 580, 700, 820, 960] as const;
export const SONAR_EVERY = [4.5, 4, 3.5, 3, 2.6, 2.2] as const;
export const SONARS = rungs(['Click Sonar', 'Ping Sonar', 'Echo Sonar', 'Far Sonar', 'Super Sonar', 'Whale Sonar'], [8, 16, 28, 44, 64]);
/** Top speed, world units a second. */
export const MOTOR_SPEED = [230, 270, 310, 350, 400, 450] as const;
export const MOTORS = rungs(['Putt Motor', 'Zoom Motor', 'Fast Motor', 'Jet Motor', 'Turbo Motor', 'Rocket Motor'], [6, 14, 24, 38, 56]);
/** How near treasure must be for the Claw to grab it. */
export const CLAW_REACH = [80, 105, 130, 160, 195, 235] as const;
export const CLAWS = rungs(['Small Claw', 'Grabber Claw', 'Long Claw', 'Big Claw', 'Super Claw', 'Mega Claw'], [6, 12, 22, 34, 50]);
/** Flashes he can use on one Dive: each lights the whole sea for a moment and photographs everything in it. */
export const FLASH_COUNT = [0, 1, 2, 3, 5] as const;
export const FLASHES = rungs(['No Flash', 'Camera Flash', 'Double Flash', 'Triple Flash', 'Super Flash'], [12, 24, 40, 60]);

export const PAINTS = [
  { id: 'yellow', name: 'Sub Yellow', price: 0, color: '#ffd23f' },
  /** Each submarine in its own colours (dock/subs.ts): a new submarine wears this. */
  { id: 'own', name: 'Its Own Colors', price: 0, color: '#ffd23f', pattern: 'own' },
  { id: 'orange', name: 'Orange', price: 4, color: '#ff8a1a' },
  { id: 'red', name: 'Red', price: 4, color: '#e8323a' },
  { id: 'lime', name: 'Lime', price: 4, color: '#8fe03a' },
  { id: 'cyan', name: 'Cyan', price: 4, color: '#3ae0f0' },
  { id: 'pink', name: 'Pink', price: 5, color: '#ff6fb5' },
  { id: 'purple', name: 'Purple', price: 5, color: '#9a5aff' },
  { id: 'white', name: 'White', price: 5, color: '#f4f4f0' },
  { id: 'blue', name: 'Ocean Blue', price: 6, color: '#2a6bff' },
  { id: 'teal', name: 'Teal', price: 6, color: '#13a89e' },
  { id: 'black', name: 'Night Black', price: 6, color: '#2a2a34' },
  { id: 'coral', name: 'Coral', price: 7, color: '#ff7a6a' },
  { id: 'mint', name: 'Mint', price: 7, color: '#7be0b5' },
  { id: 'gold', name: 'Gold', price: 8, color: '#e2b007' },
  { id: 'silver', name: 'Silver', price: 8, color: '#b9c2cc' },
  { id: 'magenta', name: 'Magenta', price: 8, color: '#e83ad0' },
  { id: 'stripes', name: 'Stripes', price: 10, color: '#ffd23f', color2: '#e8323a', pattern: 'stripes' },
  { id: 'spots', name: 'Spots', price: 10, color: '#3ae0f0', color2: '#2a6bff', pattern: 'spots' },
  { id: 'checks', name: 'Checks', price: 12, color: '#f4f4f0', color2: '#2a2a34', pattern: 'checks' },
  { id: 'zigzag', name: 'Zigzag', price: 12, color: '#8fe03a', color2: '#13a89e', pattern: 'zigzag' },
  { id: 'shark', name: 'Shark Face', price: 15, color: '#9aa8b4', color2: '#f4f4f0', pattern: 'shark' },
  { id: 'fish', name: 'Fish Scales', price: 15, color: '#ff8a1a', color2: '#ffd23f', pattern: 'scales' },
  { id: 'rainbow', name: 'Rainbow', price: 18, color: '#e8323a', pattern: 'rainbow' },
  { id: 'galaxy', name: 'Galaxy', price: 20, color: '#2a1550', color2: '#ffffff', pattern: 'galaxy' },
  { id: 'chrome', name: 'Chrome', price: 20, color: '#d8dee6', color2: '#7a8a9a', pattern: 'chrome' },
  { id: 'polka', name: 'Polka Dots', price: 12, color: '#ff6fb5', color2: '#ffffff', pattern: 'polka' },
  { id: 'camo', name: 'Camo', price: 16, color: '#6a7a3a', color2: '#3a4a24', pattern: 'camo' },
  { id: 'tiger', name: 'Tiger Stripes', price: 18, color: '#ff8a1a', color2: '#141414', pattern: 'tiger' },
  { id: 'candy', name: 'Candy Cane', price: 20, color: '#ffffff', color2: '#e8323a', pattern: 'candy' },
  { id: 'flames', name: 'Flames', price: 22, color: '#2a2a34', color2: '#ff8a1a', pattern: 'flames' },
  { id: 'sunset', name: 'Sunset', price: 24, color: '#ff8a1a', color2: '#9a5aff', pattern: 'sunset' },
  { id: 'starry', name: 'Starry Night', price: 26, color: '#1a2a6a', color2: '#ffe95a', pattern: 'starry' },
  { id: 'lava', name: 'Lava', price: 30, color: '#3a1410', color2: '#ff5a1a', pattern: 'lava' },
  { id: 'goldchrome', name: 'Gold Chrome', price: 40, color: '#f0c840', color2: '#a07810', pattern: 'chrome' },
  { id: 'diamond', name: 'Diamond', price: 50, color: '#d8f4ff', color2: '#ffffff', pattern: 'diamond' },
] as const satisfies readonly ItemDef[];

/** Glow Stripes: lines on his submarine that glow in the dark sea. */
export const STRIPES = [
  { id: 'none', name: 'No Stripes', price: 0 },
  { id: 'cyan', name: 'Cyan Stripe', price: 5, color: '#5af0ff', pattern: 'band' },
  { id: 'lime', name: 'Lime Stripe', price: 5, color: '#9aff5a', pattern: 'band' },
  { id: 'pink', name: 'Pink Stripe', price: 5, color: '#ff5ad8', pattern: 'band' },
  { id: 'double', name: 'Double Stripe', price: 8, color: '#5af0ff', pattern: 'double' },
  { id: 'dots', name: 'Glow Dots', price: 8, color: '#ffe95a', pattern: 'dots' },
  { id: 'wave', name: 'Glow Wave', price: 10, color: '#9aff5a', pattern: 'wave' },
  { id: 'zigzag', name: 'Glow Zigzag', price: 10, color: '#ff5ad8', pattern: 'zigzag' },
  { id: 'stars', name: 'Glow Stars', price: 12, color: '#fff27a', pattern: 'stars' },
  { id: 'bolt', name: 'Lightning Bolt', price: 12, color: '#5af0ff', pattern: 'bolt' },
  { id: 'hearts', name: 'Glow Hearts', price: 14, color: '#ff7a9a', pattern: 'hearts' },
  { id: 'lantern', name: 'Lanternfish Lights', price: 16, color: '#7ff7ff', pattern: 'portholes' },
  { id: 'jelly', name: 'Jelly Glow', price: 18, color: '#5affb0', pattern: 'wave' },
  { id: 'rainbow', name: 'Rainbow Glow', price: 22, color: '#ff5a5a', pattern: 'rainbow' },
  { id: 'firefly', name: 'Firefly Sparkle', price: 25, color: '#c8ff5a', pattern: 'sparkle' },
  { id: 'aurora', name: 'Aurora', price: 30, color: '#5affb0', pattern: 'aurora' },
  { id: 'gold', name: 'Gold Stripe', price: 20, color: '#ffd23f', pattern: 'band' },
  { id: 'icewave', name: 'Ice Wave', price: 24, color: '#d8f4ff', pattern: 'wave' },
  { id: 'purpledots', name: 'Purple Dots', price: 26, color: '#c89aff', pattern: 'dots' },
  { id: 'redbolt', name: 'Red Lightning', price: 35, color: '#ff5a5a', pattern: 'bolt' },
] as const satisfies readonly ItemDef[];

/** The colour of his headlight beam. */
export const BEAMS = [
  { id: 'warm', name: 'Warm Light', price: 0, color: '#fff2b0' },
  { id: 'white', name: 'White Light', price: 4, color: '#ffffff' },
  { id: 'yellow', name: 'Yellow Light', price: 5, color: '#ffe95a' },
  { id: 'cyan', name: 'Cyan Light', price: 6, color: '#7ff7ff' },
  { id: 'lime', name: 'Lime Light', price: 6, color: '#b8ff7a' },
  { id: 'pink', name: 'Pink Light', price: 6, color: '#ff9ae0' },
  { id: 'blue', name: 'Blue Light', price: 8, color: '#8ab8ff' },
  { id: 'green', name: 'Green Light', price: 8, color: '#7aff9a' },
  { id: 'purple', name: 'Purple Light', price: 10, color: '#c89aff' },
  { id: 'orange', name: 'Orange Light', price: 10, color: '#ffb07a' },
  { id: 'red', name: 'Red Light', price: 12, color: '#ff7a7a' },
  { id: 'gold', name: 'Gold Light', price: 14, color: '#ffd27a' },
  { id: 'ice', name: 'Ice Light', price: 16, color: '#d8f4ff' },
  { id: 'rainbow', name: 'Rainbow Light', price: 25, color: '#ffb0f0', pattern: 'rainbow' },
  { id: 'mint', name: 'Mint Light', price: 18, color: '#b0ffe0' },
  { id: 'sunset', name: 'Sunset Light', price: 20, color: '#ff9a6a' },
  { id: 'moon', name: 'Moon Light', price: 22, color: '#e8e8ff' },
  { id: 'lava', name: 'Lava Light', price: 28, color: '#ff6a3a' },
] as const satisfies readonly ItemDef[];

/** His horn: what it sounds like (dive/sounds.ts plays each). On a Dive a toot makes the animals near him wiggle: sound makes things move. */
export const HORNS = [
  { id: 'toot', name: 'Toot Horn', price: 0 },
  { id: 'beep', name: 'Beep Horn', price: 4 },
  { id: 'honk', name: 'Honk Horn', price: 6 },
  { id: 'foghorn', name: 'Foghorn', price: 8 },
  { id: 'whale', name: 'Whale Song', price: 10 },
  { id: 'bubble', name: 'Bubble Horn', price: 10 },
  { id: 'dolphin', name: 'Dolphin Click', price: 12 },
  { id: 'trumpet', name: 'Trumpet', price: 14 },
  { id: 'duck', name: 'Duck Quack', price: 16 },
  { id: 'robot', name: 'Robot Beeps', price: 18 },
  { id: 'tune', name: 'Sea Tune', price: 22 },
  { id: 'silly', name: 'Silly Horn', price: 25 },
  { id: 'siren', name: 'Siren', price: 28 },
  { id: 'laser', name: 'Laser Zap', price: 30 },
  { id: 'drum', name: 'Drum Roll', price: 32 },
  { id: 'sealion', name: 'Sea Lion Bark', price: 35 },
  { id: 'icecream', name: 'Ice Cream Song', price: 40 },
] as const satisfies readonly ItemDef[];

/** Who rides in the window. */
export const BUDDIES = [
  { id: 'fish', name: 'Goldfish', price: 0, emoji: '🐠' },
  { id: 'crab', name: 'Crab', price: 6, emoji: '🦀' },
  { id: 'octopus', name: 'Octopus', price: 8, emoji: '🐙' },
  { id: 'turtle', name: 'Turtle', price: 10, emoji: '🐢' },
  { id: 'penguin', name: 'Penguin', price: 12, emoji: '🐧' },
  { id: 'dolphin', name: 'Dolphin', price: 15, emoji: '🐬' },
  { id: 'otter', name: 'Otter', price: 18, emoji: '🦦' },
  { id: 'seal', name: 'Seal', price: 20, emoji: '🦭' },
  { id: 'puffer', name: 'Pufferfish', price: 22, emoji: '🐡' },
  { id: 'shark', name: 'Shark', price: 25, emoji: '🦈' },
  { id: 'whale', name: 'Whale', price: 30, emoji: '🐳' },
  { id: 'frog', name: 'Frog', price: 32, emoji: '🐸' },
  { id: 'cat', name: 'Kitty', price: 35, emoji: '🐱' },
  { id: 'dog', name: 'Puppy', price: 35, emoji: '🐶' },
  { id: 'robot', name: 'Robot', price: 45, emoji: '🤖' },
  { id: 'alien', name: 'Alien', price: 55, emoji: '👽' },
  { id: 'dragon', name: 'Dragon', price: 75, emoji: '🐲' },
  { id: 'bunny', name: 'Bunny', price: 36, emoji: '🐰' },
  { id: 'fox', name: 'Fox', price: 40, emoji: '🦊' },
  { id: 'panda', name: 'Panda', price: 45, emoji: '🐼' },
  { id: 'koala', name: 'Koala', price: 48, emoji: '🐨' },
  { id: 'monkey', name: 'Monkey', price: 50, emoji: '🐵' },
  { id: 'owl', name: 'Owl', price: 55, emoji: '🦉' },
  { id: 'lion', name: 'Lion', price: 60, emoji: '🦁' },
  { id: 'tiger', name: 'Tiger', price: 65, emoji: '🐯' },
  { id: 'dino', name: 'Dinosaur', price: 80, emoji: '🦖' },
  { id: 'unicorn', name: 'Unicorn', price: 90, emoji: '🦄' },
] as const satisfies readonly ItemDef[];

/** What streams out behind him. */
export const TRAILS = [
  { id: 'bubbles', name: 'Bubbles', price: 0, color: '#cfefff' },
  { id: 'big', name: 'Big Bubbles', price: 4, color: '#cfefff' },
  { id: 'glow', name: 'Glow Bubbles', price: 6, color: '#7ff7ff' },
  { id: 'pink', name: 'Pink Bubbles', price: 6, color: '#ff9ae0' },
  { id: 'lime', name: 'Lime Bubbles', price: 6, color: '#b8ff7a' },
  { id: 'hearts', name: 'Heart Bubbles', price: 10, color: '#ff7a9a', pattern: 'hearts' },
  { id: 'stars', name: 'Star Trail', price: 12, color: '#fff27a', pattern: 'stars' },
  { id: 'sparkle', name: 'Sparkle Trail', price: 14, color: '#ffffff', pattern: 'sparkle' },
  { id: 'rainbow', name: 'Rainbow Bubbles', price: 18, color: '#ff5a5a', pattern: 'rainbow' },
  { id: 'notes', name: 'Music Notes', price: 20, color: '#c89aff', pattern: 'notes' },
  { id: 'fish', name: 'Little Fish', price: 25, color: '#ffb02e', pattern: 'fish' },
  { id: 'comet', name: 'Comet Tail', price: 30, color: '#ffe95a', pattern: 'comet' },
  { id: 'gold', name: 'Gold Bubbles', price: 22, color: '#ffd23f', pattern: 'sparkle' },
  { id: 'purple', name: 'Purple Bubbles', price: 16, color: '#c89aff' },
  { id: 'ice', name: 'Ice Bubbles', price: 18, color: '#e8f8ff', pattern: 'sparkle' },
  { id: 'fire', name: 'Fire Bubbles', price: 35, color: '#ff7a3a', pattern: 'comet' },
] as const satisfies readonly ItemDef[];

/** Things for the Dock, where his submarine waits. */
export const DOCK_THINGS = [
  { id: 'buoy', name: 'Buoy', price: 4, emoji: '🛟' },
  { id: 'flag', name: 'Flag', price: 4, emoji: '🚩' },
  { id: 'crate', name: 'Crate', price: 5, emoji: '📦' },
  { id: 'lantern', name: 'Lantern', price: 5, emoji: '🏮' },
  { id: 'net', name: 'Fishing Net', price: 6, emoji: '🥅' },
  { id: 'anchor', name: 'Anchor', price: 6, emoji: '⚓' },
  { id: 'gull', name: 'Seagull', price: 8, emoji: '🐦' },
  { id: 'shells', name: 'Shells', price: 8, emoji: '🐚' },
  { id: 'starfish', name: 'Star', price: 8, emoji: '⭐' },
  { id: 'toolbox', name: 'Toolbox', price: 10, emoji: '🧰' },
  { id: 'map', name: 'Treasure Map', price: 10, emoji: '🗺️' },
  { id: 'compass', name: 'Compass', price: 10, emoji: '🧭' },
  { id: 'telescope', name: 'Telescope', price: 12, emoji: '🔭' },
  { id: 'microscope', name: 'Microscope', price: 12, emoji: '🔬' },
  { id: 'globe', name: 'Globe', price: 12, emoji: '🌍' },
  { id: 'umbrella', name: 'Beach Umbrella', price: 14, emoji: '⛱️' },
  { id: 'boat', name: 'Little Boat', price: 14, emoji: '⛵' },
  { id: 'camera', name: 'Camera', price: 15, emoji: '📷' },
  { id: 'aquarium', name: 'Fish Tank', price: 16, emoji: '🐟' },
  { id: 'bell', name: 'Ship Bell', price: 16, emoji: '🔔' },
  { id: 'wheel', name: 'Ship Wheel', price: 18, emoji: '☸️' },
  { id: 'palm', name: 'Palm Tree', price: 18, emoji: '🌴' },
  { id: 'crane', name: 'Crane', price: 20, emoji: '🏗️' },
  { id: 'lighthouse', name: 'Lighthouse', price: 25, emoji: '🗼' },
  { id: 'radio', name: 'Radio', price: 25, emoji: '📻' },
  { id: 'trophy', name: 'Trophy', price: 30, emoji: '🏆' },
  { id: 'medal', name: 'Gold Medal', price: 30, emoji: '🏅' },
  { id: 'rocket', name: 'Rocket', price: 40, emoji: '🚀' },
  { id: 'ship', name: 'Big Ship', price: 50, emoji: '🚢' },
  { id: 'castle', name: 'Sand Castle', price: 60, emoji: '🏰' },
  { id: 'stonehead', name: 'Stone Head', price: 35, emoji: '🗿' },
  { id: 'island', name: 'Little Island', price: 40, emoji: '🏝️' },
  { id: 'heli', name: 'Helicopter', price: 45, emoji: '🚁' },
  { id: 'tent', name: 'Circus Tent', price: 50, emoji: '🎪' },
  { id: 'volcano', name: 'Volcano', price: 55, emoji: '🌋' },
  { id: 'cruise', name: 'Cruise Ship', price: 65, emoji: '🛳️' },
  { id: 'carousel', name: 'Carousel', price: 70, emoji: '🎠' },
  { id: 'ufo', name: 'Flying Saucer', price: 75, emoji: '🛸' },
  { id: 'ferris', name: 'Ferris Wheel', price: 85, emoji: '🎡' },
  { id: 'coaster', name: 'Roller Coaster', price: 100, emoji: '🎢' },
] as const satisfies readonly ItemDef[];

export const CATALOGUE: Readonly<Record<Tab, readonly ItemDef[]>> = {
  sub: SUB_ITEMS, nose: NOSES, tail: TAILS, fins: FINS, top: TOPS,
  hull: HULLS, lights: LIGHTS, sonar: SONARS, motor: MOTORS, claw: CLAWS, flash: FLASHES, paint: PAINTS, stripes: STRIPES, beam: BEAMS,
  horn: HORNS, buddy: BUDDIES, trail: TRAILS, dock: DOCK_THINGS,
};

export type ItemKey = `${Tab}:${string}`;
export const keyOf = (tab: Tab, id: string) => `${tab}:${id}` as ItemKey;
export const tabOf = (k: ItemKey) => k.slice(0, k.indexOf(':')) as Tab;
export const idOf = (k: ItemKey) => k.slice(k.indexOf(':') + 1);
export const ALL_KEYS: readonly ItemKey[] = TABS.flatMap(t => CATALOGUE[t].map(i => keyOf(t, i.id)));
const BY_KEY = new Map(TABS.flatMap(t => CATALOGUE[t].map(i => [keyOf(t, i.id), i] as const)));
export const isItemKey = (x: unknown): x is ItemKey => typeof x === 'string' && BY_KEY.has(x as ItemKey);
export const infoOf = (k: ItemKey): ItemDef => BY_KEY.get(k)!;
/** What he starts with: every free thing. */
export const STARTERS: readonly ItemKey[] = ALL_KEYS.filter(k => infoOf(k).price === 0);
type Named = typeof HULLS | typeof LIGHTS | typeof SONARS | typeof MOTORS | typeof CLAWS | typeof FLASHES;
export type ItemName = SubName | (typeof NOSES | typeof TAILS | typeof FINS | typeof TOPS)[number]['name'] | (typeof PAINTS | typeof STRIPES | typeof BEAMS | typeof HORNS | typeof BUDDIES | typeof TRAILS | typeof DOCK_THINGS)[number]['name'] | Named[number]['name'];
export const ALL_NAMES = ALL_KEYS.map(k => infoOf(k).name);
