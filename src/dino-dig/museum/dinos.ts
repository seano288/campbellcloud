// The dinosaurs, the bones each is found as, the dig sites they're buried at, and the fossils that turn up in a Dig. Plain tables.
//
// Twelve dinosaurs from small to huge, two at each of six sites. A site opens with a dig tool strong enough for its ground (the shop's
// tools, tier 1 to 6), so better tools mean deeper sites and bigger dinosaurs. Each dinosaur is 4 to 6 bones; a Dig finds one or two of
// the first dinosaur at its site still missing some, in the order below (the skull last, the best part). The body's shape (art/dino.ts)
// and the way it moves when it's alive (run/run.ts) are here too, so the one he built is the one he plays.

export const BONE_IDS = ['skull', 'neck', 'ribs', 'legs', 'arms', 'tail', 'plates', 'frill', 'sail', 'club', 'wings'] as const;
export type BoneId = (typeof BONE_IDS)[number];
/** Said when he finds one: "You found the ribs!" */
export const BONE_NAMES = {
  skull: 'the skull', neck: 'the neck bones', ribs: 'the ribs', legs: 'the leg bones', arms: 'the arm bones', tail: 'the tail bones',
  plates: 'the back plates', frill: 'the frill', sail: 'the sail', club: 'the tail club', wings: 'the wing bones',
} as const satisfies Record<BoneId, string>;

/** The head's shape. */
export type Head = 'small' | 'raptor' | 'beak' | 'dome' | 'stego' | 'duck' | 'horns' | 'armor' | 'allo' | 'croc' | 'rex' | 'long';

/** How it moves in the run. */
export interface Moves {
  /** Walking speed, world units a second. */
  speed: number;
  /** Jump speed (how high). */
  jump: number;
  /** It walks straight through rocks, smashing them. */
  smash?: boolean;
  /** Its head reaches the high leaves. */
  reach?: boolean;
  /** It flies: holding jump keeps it up. */
  fly?: boolean;
  /** It can jump again in the air. */
  double?: boolean;
  /** It swims fast through water (everyone else wades slowly). */
  swim?: boolean;
  /** Its roar shakes fruit out of the trees. */
  shake?: boolean;
}

export interface Dino {
  id: string;
  name: string;
  /** Said on its plinth and in the run. */
  line: string;
  site: SiteId;
  /** In the order they're found; the skull last. */
  bones: readonly BoneId[];
  /** Its own colours: skin and belly. */
  skin: string;
  belly: string;
  /** Its size in the Museum and the run: about how many pixels long at scale 1. */
  size: number;
  head: Head;
  /** Body: half length and half height, in a unit where the body is about 1 long. */
  body: { rx: number; ry: number };
  /** Neck length and angle up from level (degrees), and thickness. */
  neck: { len: number; up: number; w: number };
  /** Tail length, thickness at the body, and how much it droops. */
  tail: { len: number; w: number; droop: number };
  /** Back legs and front legs (0: tiny arms off the ground). `stand`: on all fours. */
  legs: { back: number; front: number; w: number; stand: boolean };
  moves: Moves;
}

export const SITE_IDS = ['creek', 'gully', 'canyon', 'badlands', 'volcano', 'cliffs'] as const;
export type SiteId = (typeof SITE_IDS)[number];
/** `floor`: the pale rock under the dirt, where it's been cleared. */
export interface Site { id: SiteId; name: string; tier: number; dirt: string; dirt2: string; deep: string; rock: string; floor: string }
export const SITES = [
  { id: 'creek', floor: '#f6ecd2', name: 'Sandy Creek', tier: 1, dirt: '#e6c78f', dirt2: '#d9b376', deep: '#bf9a5c', rock: '#a39a8c' },
  { id: 'gully', floor: '#e3d6b8', name: 'Fern Gully', tier: 2, dirt: '#9c7b52', dirt2: '#8a6a45', deep: '#6f5435', rock: '#8d8f86' },
  { id: 'canyon', floor: '#f6d6b8', name: 'Red Rock Canyon', tier: 3, dirt: '#d07a4a', dirt2: '#bd6a3c', deep: '#9a5230', rock: '#9a6f5a' },
  { id: 'badlands', floor: '#f1e4cc', name: 'The Badlands', tier: 4, dirt: '#c9a77e', dirt2: '#b59168', deep: '#8f6f4c', rock: '#7d746a' },
  { id: 'volcano', floor: '#b8aca6', name: 'Volcano Ridge', tier: 5, dirt: '#5d5250', dirt2: '#4b4241', deep: '#2f2827', rock: '#3d3a3a' },
  { id: 'cliffs', floor: '#ffffff', name: 'Frozen Cliffs', tier: 6, dirt: '#dfe9f1', dirt2: '#c8d8e6', deep: '#9fb3c6', rock: '#7f8e9c' },
] as const satisfies readonly Site[];
export const site = (id: SiteId): Site => SITES.find(s => s.id === id)!;
export const isSiteId = (x: unknown): x is SiteId => (SITE_IDS as readonly unknown[]).includes(x);

const B = (r: number, v: number) => ({ rx: r, ry: v });
export const DINOS = [
  { id: 'compy', name: 'Compsognathus', line: 'Compsognathus! Small and super fast!', site: 'creek', bones: ['legs', 'ribs', 'tail', 'skull'],
    skin: '#7fb24a', belly: '#d8e8a8', size: 120, head: 'small', body: B(.34, .2), neck: { len: .32, up: 50, w: .09 }, tail: { len: 1.0, w: .12, droop: .05 },
    legs: { back: .5, front: 0, w: .07, stand: false }, moves: { speed: 330, jump: 720, double: true } },
  { id: 'raptor', name: 'Velociraptor', line: 'Velociraptor! A fast and clever hunter!', site: 'creek', bones: ['legs', 'ribs', 'arms', 'tail', 'skull'],
    skin: '#c98a3e', belly: '#f1d7a6', size: 150, head: 'raptor', body: B(.36, .2), neck: { len: .3, up: 40, w: .1 }, tail: { len: .95, w: .12, droop: -.05 },
    legs: { back: .52, front: .18, w: .08, stand: false }, moves: { speed: 380, jump: 680 } },
  { id: 'ptero', name: 'Pteranodon', line: 'Pteranodon! It flies with its big wings!', site: 'gully', bones: ['legs', 'ribs', 'wings', 'skull'],
    skin: '#b5845c', belly: '#ecd2b4', size: 150, head: 'beak', body: B(.24, .16), neck: { len: .22, up: 30, w: .08 }, tail: { len: .12, w: .05, droop: .1 },
    legs: { back: .3, front: 0, w: .05, stand: false }, moves: { speed: 300, jump: 640, fly: true } },
  { id: 'pachy', name: 'Pachycephalosaurus', line: 'Pachycephalosaurus! It has a hard bony head!', site: 'gully', bones: ['legs', 'arms', 'ribs', 'tail', 'skull'],
    skin: '#8e9a5a', belly: '#dfe1b4', size: 170, head: 'dome', body: B(.4, .26), neck: { len: .26, up: 30, w: .14 }, tail: { len: .8, w: .15, droop: .05 },
    legs: { back: .5, front: .14, w: .1, stand: false }, moves: { speed: 300, jump: 600, smash: true } },
  { id: 'stego', name: 'Stegosaurus', line: 'Stegosaurus! It has plates on its back!', site: 'canyon', bones: ['legs', 'arms', 'ribs', 'tail', 'plates', 'skull'],
    skin: '#6e9f6b', belly: '#cfe3bf', size: 230, head: 'stego', body: B(.45, .3), neck: { len: .25, up: -15, w: .12 }, tail: { len: .75, w: .16, droop: .12 },
    legs: { back: .46, front: .32, w: .11, stand: true }, moves: { speed: 230, jump: 520, smash: true } },
  { id: 'para', name: 'Parasaurolophus', line: 'Parasaurolophus! It honks through its long crest!', site: 'canyon', bones: ['legs', 'arms', 'ribs', 'tail', 'skull'],
    skin: '#d18a52', belly: '#f3d9b3', size: 230, head: 'duck', body: B(.42, .26), neck: { len: .36, up: 45, w: .13 }, tail: { len: .85, w: .15, droop: .05 },
    legs: { back: .55, front: .3, w: .11, stand: false }, moves: { speed: 280, jump: 600, shake: true } },
  { id: 'trike', name: 'Triceratops', line: 'Triceratops! Three horns and a big frill!', site: 'badlands', bones: ['legs', 'ribs', 'tail', 'frill', 'skull'],
    skin: '#7d8fa8', belly: '#d6dde7', size: 250, head: 'horns', body: B(.46, .3), neck: { len: .16, up: 5, w: .2 }, tail: { len: .55, w: .16, droop: .1 },
    legs: { back: .4, front: .36, w: .13, stand: true }, moves: { speed: 250, jump: 480, smash: true } },
  { id: 'anky', name: 'Ankylosaurus', line: 'Ankylosaurus! Armor and a club on its tail!', site: 'badlands', bones: ['legs', 'ribs', 'tail', 'club', 'skull'],
    skin: '#9b8466', belly: '#e1d3bd', size: 240, head: 'armor', body: B(.48, .24), neck: { len: .14, up: 0, w: .18 }, tail: { len: .7, w: .14, droop: 0 },
    legs: { back: .3, front: .27, w: .13, stand: true }, moves: { speed: 220, jump: 460, smash: true } },
  { id: 'allo', name: 'Allosaurus', line: 'Allosaurus! A big hunter with bumps on its head!', site: 'volcano', bones: ['legs', 'arms', 'ribs', 'tail', 'skull'],
    skin: '#b0533b', belly: '#efc6a6', size: 290, head: 'allo', body: B(.42, .27), neck: { len: .3, up: 30, w: .17 }, tail: { len: .95, w: .18, droop: 0 },
    legs: { back: .58, front: .16, w: .13, stand: false }, moves: { speed: 320, jump: 680 } },
  { id: 'spino', name: 'Spinosaurus', line: 'Spinosaurus! It swims, and it has a sail!', site: 'volcano', bones: ['legs', 'arms', 'ribs', 'tail', 'sail', 'skull'],
    skin: '#4f8a8b', belly: '#c4e2dd', size: 320, head: 'croc', body: B(.44, .26), neck: { len: .34, up: 35, w: .15 }, tail: { len: 1.0, w: .17, droop: 0 },
    legs: { back: .48, front: .22, w: .13, stand: false }, moves: { speed: 290, jump: 600, swim: true } },
  { id: 'rex', name: 'Tyrannosaurus rex', line: 'T. rex! The king of the dinosaurs!', site: 'cliffs', bones: ['legs', 'arms', 'ribs', 'tail', 'neck', 'skull'],
    skin: '#5e7f3c', belly: '#d3dfa8', size: 340, head: 'rex', body: B(.45, .3), neck: { len: .28, up: 25, w: .22 }, tail: { len: 1.0, w: .2, droop: 0 },
    legs: { back: .62, front: .12, w: .16, stand: false }, moves: { speed: 330, jump: 640, smash: true, shake: true } },
  { id: 'brachio', name: 'Brachiosaurus', line: 'Brachiosaurus! Its long neck reaches the tallest trees!', site: 'cliffs', bones: ['legs', 'arms', 'ribs', 'tail', 'neck', 'skull'],
    skin: '#8aa0b7', belly: '#dbe5ee', size: 380, head: 'long', body: B(.5, .3), neck: { len: .88, up: 54, w: .2 }, tail: { len: .7, w: .2, droop: .1 },
    legs: { back: .52, front: .66, w: .17, stand: true }, moves: { speed: 240, jump: 420, reach: true, smash: true } },
] as const satisfies readonly Dino[];
export type DinoId = (typeof DINOS)[number]['id'];
export type DinoName = (typeof DINOS)[number]['name'];
export type DinoLine = (typeof DINOS)[number]['line'];
export const DINO_IDS = DINOS.map(d => d.id) as readonly DinoId[];
export const dino = (id: DinoId): Dino => DINOS.find(d => d.id === id)!;
export const isDinoId = (x: unknown): x is DinoId => (DINO_IDS as readonly unknown[]).includes(x);
export const dinosAt = (s: SiteId) => DINOS.filter(d => d.site === s).map(d => d.id as DinoId);
export const TOTAL_BONES = DINOS.reduce((n, d) => n + d.bones.length, 0);

// ---------- fossils: found in every other Dig ----------

export const FOSSILS = [
  { id: 'ammonite', name: 'Ammonite', pic: '🐚' }, { id: 'tooth', name: 'Dino Tooth', pic: '🦷' }, { id: 'egg', name: 'Dino Egg', pic: '🥚' },
  { id: 'footprint', name: 'Footprint', pic: '🐾' }, { id: 'amber', name: 'Amber', pic: '🟠' }, { id: 'fern', name: 'Fern Fossil', pic: '🌿' },
  { id: 'fish', name: 'Fish Fossil', pic: '🐟' }, { id: 'feather', name: 'Feather Fossil', pic: '🪶' }, { id: 'trilobite', name: 'Trilobite', pic: '🪲' },
  { id: 'geode', name: 'Crystal Geode', pic: '💎' }, { id: 'wood', name: 'Stone Wood', pic: '🪵' }, { id: 'shark', name: 'Shark Tooth', pic: '🦈' },
  { id: 'crab', name: 'Crab Fossil', pic: '🦀' }, { id: 'snail', name: 'Snail Fossil', pic: '🐌' }, { id: 'starfish', name: 'Starfish Fossil', pic: '⭐' },
  { id: 'coral', name: 'Coral', pic: '🪸' }, { id: 'leaf', name: 'Leaf Fossil', pic: '🍂' }, { id: 'meteor', name: 'Meteorite', pic: '☄️' },
  { id: 'gold', name: 'Gold Nugget', pic: '🪙' }, { id: 'claw', name: 'Dino Claw', pic: '🦅' }, { id: 'nest', name: 'Dino Nest', pic: '🪺' },
  { id: 'dragonfly', name: 'Dragonfly Fossil', pic: '🐉' }, { id: 'turtle', name: 'Turtle Shell', pic: '🐢' }, { id: 'croc', name: 'Croc Tooth', pic: '🐊' },
  { id: 'mammoth', name: 'Mammoth Tusk', pic: '🦣' }, { id: 'pinecone', name: 'Stone Pinecone', pic: '🌰' }, { id: 'shell', name: 'Sea Shell', pic: '🐙' },
  { id: 'crystal', name: 'Purple Crystal', pic: '🔮' }, { id: 'bug', name: 'Bug in Amber', pic: '🐞' }, { id: 'tiny', name: 'Tiny Bone', pic: '🦴' },
] as const;
export type FossilId = (typeof FOSSILS)[number]['id'];
export type FossilName = (typeof FOSSILS)[number]['name'];
export const fossil = (id: FossilId) => FOSSILS.find(f => f.id === id)!;
export const isFossilId = (x: unknown): x is FossilId => FOSSILS.some(f => f.id === x);
