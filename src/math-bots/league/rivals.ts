// The League: twelve rivals in a row, each built from the same parts he is, each with a part he can win nowhere else. Rivals teach by what
// they bring: Brick has to be beaten from behind, Prickles punishes ramming, and so on. `tip` is what the voice says after a loss.
import type { Build } from '../bot/build';
import type { PartKey } from '../bot/parts';

export type Style = 'rush' | 'circle' | 'guard' | 'dart';
export type ArenaId = 'yard' | 'saws' | 'vents' | 'pit';
export interface Rival {
  id: string; name: string; build: Build; style: Style; arena: ArenaId;
  /** Scales on what its parts give it: 1 plays fair; less is easier. */
  hp: number; speed: number; hit: number;
  /** 0 slow to react, 1 as sharp as they come. */
  skill: number; prize: PartKey; bolts: number; tip: string;
}
export const RIVALS = [
  { id: 'rusty', name: 'Rusty', build: { body: 'box', wheels: 'small', adds: { front: 'bumper' }, paint: 'orange', face: 'cyclops' }, style: 'rush', arena: 'yard', hp: .4, speed: .5, hit: .4, skill: 0, prize: 'add:rusty', bolts: 5, tip: 'Hit it with your front!' },
  { id: 'anvil', name: 'Anvil', build: { body: 'box', wheels: 'small', adds: { front: 'hammer' }, paint: 'black', face: 'angry' }, style: 'rush', arena: 'yard', hp: .5, speed: .55, hit: .25, skill: .05, prize: 'add:anvil', bolts: 6, tip: 'Hit it, then back away!' },
  { id: 'pancake', name: 'Pancake', build: { body: 'wedge', wheels: 'big', adds: { front: 'flipper' }, paint: 'yellow', face: 'happy' }, style: 'rush', arena: 'yard', hp: .6, speed: .6, hit: .35, skill: .1, prize: 'add:launch', bolts: 7, tip: 'Hit it from the side!' },
  { id: 'brick', name: 'Brick', build: { body: 'box', wheels: 'grip', adds: { front: 'brick', back: 'spike' }, paint: 'red', face: 'angry' }, style: 'guard', arena: 'saws', hp: .75, speed: .6, hit: .4, skill: .18, prize: 'add:brick', bolts: 8, tip: 'Go round. Hit it from behind!' },
  { id: 'whirly', name: 'Whirly', build: { body: 'wedge', wheels: 'big', adds: { front: 'whirly', left: 'shield' }, paint: 'ocean', face: 'cool' }, style: 'rush', arena: 'saws', hp: .85, speed: .7, hit: .45, skill: .28, prize: 'add:whirly', bolts: 9, tip: 'Put a shield on your front!' },
  { id: 'zip', name: 'Zip', build: { body: 'dart', wheels: 'race', adds: { front: 'saw', back: 'booster' }, paint: 'green', face: 'visor' }, style: 'dart', arena: 'saws', hp: 1.1, speed: .95, hit: 1.2, skill: .38, prize: 'wheels:zip', bolts: 10, tip: 'Grab faster wheels!' },
  { id: 'pincer', name: 'Pincer', build: { body: 'shell', wheels: 'grip', adds: { front: 'claw', left: 'thorn', right: 'thorn' }, paint: 'pink', face: 'shark' }, style: 'circle', arena: 'vents', hp: 1.2, speed: .9, hit: 1.1, skill: .5, prize: 'add:claw', bolts: 11, tip: 'Stay away from the fire!' },
  { id: 'prickles', name: 'Prickles', build: { body: 'shell', wheels: 'tread', adds: { front: 'prickle', left: 'prickle', right: 'prickle', back: 'prickle' }, paint: 'green', face: 'cat' }, style: 'guard', arena: 'vents', hp: 1.3, speed: .9, hit: 1.1, skill: .55, prize: 'add:prickle', bolts: 12, tip: 'Use a long weapon, not a bump!' },
  { id: 'boulder', name: 'Boulder', build: { body: 'boulder', wheels: 'tread', adds: { front: 'gianth', back: 'shield' }, paint: 'black', face: 'angry' }, style: 'rush', arena: 'vents', hp: 1.15, speed: .9, hit: .95, skill: .6, prize: 'body:boulder', bolts: 13, tip: 'Build a bigger Body!' },
  { id: 'shocker', name: 'Shocker', build: { body: 'tank', wheels: 'race', adds: { front: 'prod', left: 'gold', right: 'gold', back: 'repair' }, paint: 'purple', face: 'visor' }, style: 'circle', arena: 'pit', hp: 1, speed: .9, hit: .85, skill: .68, prize: 'add:prod', bolts: 14, tip: 'Push it in the pit!' },
  { id: 'fang', name: 'Fang', build: { body: 'titan', wheels: 'race', adds: { front: 'twin', left: 'bigsaw', right: 'bigsaw', back: 'gold' }, paint: 'flame', face: 'shark' }, style: 'dart', arena: 'pit', hp: 1, speed: .95, hit: 1, skill: .78, prize: 'add:twin', bolts: 16, tip: 'Put shields on every side!' },
  { id: 'king', name: 'King Gear', build: { body: 'hull', wheels: 'hover', adds: { front: 'mega', left: 'gianth', right: 'gianth', back: 'gold' }, paint: 'gold', face: 'crown' }, style: 'circle', arena: 'pit', hp: 1, speed: .95, hit: .88, skill: .9, prize: 'body:hull', bolts: 20, tip: 'Build your very best robot!' },
] as const satisfies readonly Rival[];
export type RivalId = (typeof RIVALS)[number]['id'];
export type RivalName = (typeof RIVALS)[number]['name'];
export type RivalTip = (typeof RIVALS)[number]['tip'];
export const rival = (id: RivalId): Rival & { id: RivalId; name: RivalName; tip: RivalTip } => RIVALS.find(r => r.id === id)!;
export const prizeFrom = (k: PartKey): Rival | null => RIVALS.find(r => r.prize === k) ?? null;
/** The Crown isn't a Rival's own prize: it comes with beating the whole League a second way, three stars on King Gear. */
export const CROWN: PartKey = 'face:crown';
