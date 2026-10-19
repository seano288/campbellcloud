export const MODE_IDS = ['learn', 'count', 'pay'] as const;
export type ModeId = (typeof MODE_IDS)[number];
export const MODE_NAMES = ['Learn the Coins', 'Count the Cash', 'Pay the Shop'] as const;
export type ModeName = (typeof MODE_NAMES)[number];

export type Level = 1 | 2 | 3 | 4 | 5;
export const LEVELS: readonly Level[] = [1, 2, 3, 4, 5];
/** A Level reached by levelling up. */
export type RaisedLevel = Exclude<Level, 1>;
