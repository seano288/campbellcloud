// The hand-checked table of real things Best Guess and Two Units talk about. Only things whose size nobody would argue about: a typical
// one, measured along its length, with a round "about" number a teacher would accept. Anything in between (a skateboard at two and a half
// feet, a guitar, a dog) is left out, so "inches or feet?" always has one plain answer. Sizes are checked in the spec's table.
//
// `inches`: its real length, for drawing things side by side at the same scale and for the which-is-longer test.
// `about`: the round number Best Guess Level 2 offers as the right estimate, in the unit he would measure it with.
// `cm`: its about-length in centimetres, for the few things Best Guess asks in centimetres.

export type Unit = 'in' | 'ft' | 'cm';
export interface Thing {
  readonly id: string;
  /** Said and written with its article: "a crayon". */
  readonly name: string;
  readonly emoji: string;
  readonly inches: number;
  readonly about: { readonly unit: 'in' | 'ft'; readonly n: number };
  readonly cm?: number;
}

const t = <const N extends string>(id: string, name: N, emoji: string, inches: number, unit: 'in' | 'ft', n: number, cm?: number) =>
  ({ id, name, emoji, inches, about: { unit, n }, ...(cm && { cm }) }) as Thing & { readonly name: N };

/** Small things: measured in inches. All are under a foot. */
export const SMALL = [
  t('crayon', 'a crayon', '🖍️', 3.5, 'in', 4, 9),
  t('pencil', 'a pencil', '✏️', 7.5, 'in', 7, 19),
  t('clip', 'a paper clip', '📎', 1.25, 'in', 1, 3),
  t('spoon', 'a spoon', '🥄', 6, 'in', 6, 15),
  t('key', 'a key', '🔑', 2.25, 'in', 2, 6),
  t('toycar', 'a toy car', '🚗', 3, 'in', 3, 8),
  t('banana', 'a banana', '🍌', 7, 'in', 7, 18),
  t('toothbrush', 'a toothbrush', '🪥', 7, 'in', 7, 18),
  t('marker', 'a marker', '🖊️', 5.5, 'in', 5, 14),
  t('eraser', 'an eraser', '🧽', 2, 'in', 2, 5),
  t('fork', 'a fork', '🍴', 7, 'in', 7, 18),
  t('book', 'a book', '📘', 10, 'in', 10, 25),
] as const;

/** Big things: measured in feet. All are at least four feet long. */
export const BIG = [
  t('bike', 'a bike', '🚲', 66, 'ft', 5),
  t('car', 'a car', '🚙', 180, 'ft', 15),
  t('bus', 'a school bus', '🚌', 480, 'ft', 40),
  t('bed', 'a bed', '🛏️', 78, 'ft', 6),
  t('pickup', 'a pickup truck', '🛻', 228, 'ft', 20),
  t('canoe', 'a canoe', '🛶', 192, 'ft', 16),
  t('couch', 'a couch', '🛋️', 84, 'ft', 7),
  t('table', 'a dinner table', '🍽️', 72, 'ft', 6),
  t('surfboard', 'a surfboard', '🏄', 84, 'ft', 7),
  t('limo', 'a limo', '🚘', 240, 'ft', 20),
] as const;

export const THINGS: readonly Thing[] = [...SMALL, ...BIG];
export type ThingName = (typeof SMALL)[number]['name'] | (typeof BIG)[number]['name'];
export const thingOf = (id: string): Thing => { const x = THINGS.find(th => th.id === id); if (!x) throw new Error(`no thing ${id}`); return x; };
/** The unit he would measure it with. */
export const unitFor = (th: Thing): 'in' | 'ft' => th.about.unit;
/** A child stands beside things in the Best Guess lesson: about 4 feet tall. */
export const CHILD_INCHES = 46;
