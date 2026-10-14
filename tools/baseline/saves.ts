import type { Fit } from '../../src/garage/catalog';
import type { Save } from '../../src/save/migrate';

export const TODAY = '2026-10-14';
export const NOW = '2026-10-14T12:00:00.000Z';
export const STORAGE_KEY = 'mtm2-save';

const DEFAULT_FIT_EXPECTED: Fit = { tires: 0, paint: 0, decals: 0, lights: 0, horn: 0, engine: 0, grille: 0, exhaust: 0, topper: 0, number: 0, doorNumber: 1, colour: 'red' };

export const FRESH_EXPECTED: Save = {
  version: 4, bolts: 0, body: null,
  ownedBodies: ['pickup', 'bigfoot', 'dragster'], unlocked: [], colours: [], goal: null,
  fitted: {
    pickup: { ...DEFAULT_FIT_EXPECTED }, bigfoot: { ...DEFAULT_FIT_EXPECTED }, dragster: { ...DEFAULT_FIT_EXPECTED }, firetruck: { ...DEFAULT_FIT_EXPECTED },
    schoolbus: { ...DEFAULT_FIT_EXPECTED }, jeep: { ...DEFAULT_FIT_EXPECTED }, towtruck: { ...DEFAULT_FIT_EXPECTED }, dumptruck: { ...DEFAULT_FIT_EXPECTED },
    police: { ...DEFAULT_FIT_EXPECTED }, icecream: { ...DEFAULT_FIT_EXPECTED }, tractor: { ...DEFAULT_FIT_EXPECTED }, racecar: { ...DEFAULT_FIT_EXPECTED },
  },
  modes: {
    learn: { level: 1, window: [], opened: true, starred: false, introPending: false, fresh: false },
    count: { level: 1, window: [], opened: false, starred: false, introPending: false, fresh: false },
    pay: { level: 1, window: [], opened: false, starred: false, introPending: false, fresh: false },
  },
  lastMode: 'learn', trophies: {}, roundsFinished: 0, currentStreak: 0, bestStreak: 0, daysPlayed: 0, lastDay: null,
};

export interface SaveCase {
  id: string;
  raw: unknown;
  expected: Save;
}

const progressedRaw = {
  version: 4, bolts: 46, body: 'jeep', ownedBodies: ['pickup', 'bigfoot', 'dragster', 'jeep', 'racecar'],
  unlocked: ['tires:1', 'tires:2', 'tires:3', 'tires:4', 'paint:2', 'paint:3', 'paint:4', 'decals:1', 'lights:2', 'horn:3', 'engine:1', 'grille:2', 'exhaust:3', 'topper:1', 'number:2'],
  colours: ['teal', 'pink', 'sky'], goal: 'horn:2',
  fitted: {
    pickup: { tires: 4, paint: 2, decals: 1, lights: 2, horn: 3, engine: 1, grille: 2, exhaust: 3, topper: 1, number: 2, doorNumber: 42, colour: 'teal' },
    bigfoot: { tires: 3, paint: 4, decals: 0, lights: 0, horn: 0, engine: 0, grille: 0, exhaust: 0, topper: 0, number: 2, doorNumber: 7, colour: 'pink' },
    dragster: { tires: 2, paint: 3, decals: 0, lights: 0, horn: 0, engine: 1, grille: 0, exhaust: 0, topper: 0, number: 0, doorNumber: 0, colour: 'sky' },
    firetruck: { tires: 1, paint: 0, decals: 0, lights: 2, horn: 0, engine: 0, grille: 0, exhaust: 0, topper: 0, number: 0, doorNumber: 11, colour: 'red' },
    schoolbus: { tires: 0, paint: 2, decals: 1, lights: 0, horn: 0, engine: 0, grille: 0, exhaust: 0, topper: 0, number: 0, doorNumber: 22, colour: 'teal' },
    jeep: { tires: 4, paint: 0, decals: 0, lights: 0, horn: 3, engine: 0, grille: 0, exhaust: 0, topper: 0, number: 2, doorNumber: 99, colour: 'sky' },
    towtruck: { tires: 0, paint: 0, decals: 0, lights: 0, horn: 0, engine: 0, grille: 2, exhaust: 0, topper: 0, number: 0, doorNumber: 33, colour: 'pink' },
    dumptruck: { tires: 0, paint: 0, decals: 0, lights: 0, horn: 0, engine: 0, grille: 0, exhaust: 3, topper: 0, number: 0, doorNumber: 44, colour: 'red' },
    police: { tires: 0, paint: 0, decals: 0, lights: 2, horn: 0, engine: 0, grille: 0, exhaust: 0, topper: 1, number: 0, doorNumber: 55, colour: 'teal' },
    icecream: { tires: 0, paint: 2, decals: 0, lights: 0, horn: 0, engine: 0, grille: 0, exhaust: 0, topper: 1, number: 0, doorNumber: 66, colour: 'pink' },
    tractor: { tires: 3, paint: 0, decals: 1, lights: 0, horn: 0, engine: 0, grille: 0, exhaust: 0, topper: 0, number: 0, doorNumber: 77, colour: 'red' },
    racecar: { tires: 2, paint: 4, decals: 0, lights: 0, horn: 0, engine: 1, grille: 0, exhaust: 0, topper: 0, number: 2, doorNumber: 88, colour: 'sky' },
  },
  modes: {
    learn: { level: 3, window: ['clean', 'missed', 'helped', 'clean'], opened: true, starred: true, introPending: false, fresh: false },
    count: { level: 2, window: ['missed', 'clean', 'helped', 'clean', 'clean'], opened: true, starred: false, introPending: true, fresh: false },
    pay: { level: 1, window: ['helped', 'missed', 'clean'], opened: true, starred: false, introPending: false, fresh: true },
  },
  lastMode: 'pay', trophies: { 'learn:2': '2026-09-01', 'learn:3': '2026-09-03', 'learn:star': '2026-09-05', 'count:2': '2026-09-07', 'streak:5': '2026-09-02', 'streak:10': '2026-09-04', perfect: '2026-09-06', 'rounds:10': '2026-09-08', 'rounds:25': '2026-09-10', 'days:5': '2026-09-09' },
  roundsFinished: 29, currentStreak: 3, bestStreak: 14, daysPlayed: 6, lastDay: '2026-10-13',
};

export const PROGRESSED_EXPECTED: Save = {
  version: 4, bolts: 46, body: 'jeep', ownedBodies: ['pickup', 'bigfoot', 'dragster', 'jeep', 'racecar'],
  unlocked: ['tires:1', 'tires:2', 'tires:3', 'tires:4', 'paint:2', 'paint:3', 'paint:4', 'decals:1', 'lights:2', 'horn:3', 'engine:1', 'grille:2', 'exhaust:3', 'topper:1', 'number:2'],
  colours: ['teal', 'pink', 'sky'], goal: 'horn:2',
  fitted: {
    pickup: { tires: 4, paint: 2, decals: 1, lights: 2, horn: 3, engine: 1, grille: 2, exhaust: 3, topper: 1, number: 2, doorNumber: 42, colour: 'teal' },
    bigfoot: { ...DEFAULT_FIT_EXPECTED, tires: 3, paint: 4, number: 2, doorNumber: 7, colour: 'pink' },
    dragster: { ...DEFAULT_FIT_EXPECTED, tires: 2, paint: 3, engine: 1, doorNumber: 0, colour: 'sky' },
    firetruck: { ...DEFAULT_FIT_EXPECTED, tires: 1, lights: 2, doorNumber: 11 },
    schoolbus: { ...DEFAULT_FIT_EXPECTED, paint: 2, decals: 1, doorNumber: 22, colour: 'teal' },
    jeep: { ...DEFAULT_FIT_EXPECTED, tires: 4, horn: 3, number: 2, doorNumber: 99, colour: 'sky' },
    towtruck: { ...DEFAULT_FIT_EXPECTED, grille: 2, doorNumber: 33, colour: 'pink' },
    dumptruck: { ...DEFAULT_FIT_EXPECTED, exhaust: 3, doorNumber: 44 },
    police: { ...DEFAULT_FIT_EXPECTED, lights: 2, topper: 1, doorNumber: 55, colour: 'teal' },
    icecream: { ...DEFAULT_FIT_EXPECTED, paint: 2, topper: 1, doorNumber: 66, colour: 'pink' },
    tractor: { ...DEFAULT_FIT_EXPECTED, tires: 3, decals: 1, doorNumber: 77 },
    racecar: { ...DEFAULT_FIT_EXPECTED, tires: 2, paint: 4, engine: 1, number: 2, doorNumber: 88, colour: 'sky' },
  },
  modes: {
    learn: { level: 3, window: ['clean', 'missed', 'helped', 'clean'], opened: true, starred: true, introPending: false, fresh: false },
    count: { level: 2, window: ['missed', 'clean', 'helped', 'clean', 'clean'], opened: true, starred: false, introPending: true, fresh: false },
    pay: { level: 1, window: ['helped', 'missed', 'clean'], opened: true, starred: false, introPending: false, fresh: true },
  },
  lastMode: 'pay', trophies: { 'learn:2': '2026-09-01', 'learn:3': '2026-09-03', 'learn:star': '2026-09-05', 'count:2': '2026-09-07', 'streak:5': '2026-09-02', 'streak:10': '2026-09-04', perfect: '2026-09-06', 'rounds:10': '2026-09-08', 'rounds:25': '2026-09-10', 'days:5': '2026-09-09' },
  roundsFinished: 29, currentStreak: 3, bestStreak: 14, daysPlayed: 6, lastDay: '2026-10-13',
};

const practice: Save = {
  ...FRESH_EXPECTED, body: 'pickup',
  modes: {
    learn: { ...FRESH_EXPECTED.modes.learn, level: 2 },
    count: { ...FRESH_EXPECTED.modes.count, opened: true },
    pay: { ...FRESH_EXPECTED.modes.pay, opened: true },
  },
};

export const JOURNEY_SAVES = {
  fresh: FRESH_EXPECTED,
  progressed: PROGRESSED_EXPECTED,
  practice,
  milestones: {
    ...FRESH_EXPECTED, body: 'pickup', roundsFinished: 9, daysPlayed: 4, lastDay: '2026-10-13', currentStreak: 4, bestStreak: 4,
    modes: { ...FRESH_EXPECTED.modes, learn: { ...FRESH_EXPECTED.modes.learn, window: ['clean', 'clean', 'clean', 'clean', 'clean', 'clean', 'clean'] } },
  },
  star: {
    ...practice,
    modes: { ...practice.modes, learn: { level: 3, window: ['clean', 'clean', 'clean', 'clean', 'clean', 'clean', 'clean'], opened: true, starred: false, introPending: false, fresh: false } },
  },
  garage: {
    ...FRESH_EXPECTED, body: 'pickup', bolts: 50, unlocked: ['paint:3', 'number:2'], goal: 'tires:2',
    fitted: { ...FRESH_EXPECTED.fitted, pickup: { ...FRESH_EXPECTED.fitted.pickup, paint: 3, number: 2, doorNumber: 42 } },
  },
  'checkout-2': {
    ...practice, bolts: 16, unlocked: ['tires:3', 'horn:3'],
    modes: { ...practice.modes, pay: { ...practice.modes.pay, level: 2 } },
    fitted: { ...FRESH_EXPECTED.fitted, pickup: { ...FRESH_EXPECTED.fitted.pickup, tires: 3, horn: 3 } },
  },
  'checkout-3': {
    ...practice, bolts: 16, unlocked: ['tires:3', 'horn:3'],
    modes: { ...practice.modes, pay: { ...practice.modes.pay, level: 3 } },
    fitted: { ...FRESH_EXPECTED.fitted, pickup: { ...FRESH_EXPECTED.fitted.pickup, tires: 3, horn: 3 } },
  },
} satisfies Record<string, Save>;

export const UNSAFE_BALANCE_CASE: SaveCase = {
  id: 'unsafe-balance-future',
  raw: { ...progressedRaw, bolts: 9007199254740992 },
  expected: { ...PROGRESSED_EXPECTED, bolts: 0 },
};

export const SAVE_CASES: SaveCase[] = [
  {
    id: 'v1',
    raw: { version: 1, bolts: 40, body: 'dragster', unlocked: ['tires:3'], fitted: { dragster: { tires: 3 } } },
    expected: {
      ...FRESH_EXPECTED, bolts: 40, body: 'dragster', unlocked: ['tires:3'],
      fitted: { ...FRESH_EXPECTED.fitted, dragster: { ...DEFAULT_FIT_EXPECTED, tires: 3 } },
    },
  },
  {
    id: 'v2',
    raw: {
      version: 2, bolts: 140, body: 'jeep', ownedBodies: ['jeep'], unlocked: ['tires:1', 'paint:3'],
      fitted: { jeep: { tires: 1, paint: 3 } }, goal: 'body:firetruck',
      modes: { learn: { level: 3, starred: true, opened: true }, count: { level: 2, opened: true } },
      trophies: { 'learn:2': '2026-09-01' },
    },
    expected: {
      ...FRESH_EXPECTED, bolts: 140, body: 'jeep', ownedBodies: ['pickup', 'bigfoot', 'dragster', 'jeep'],
      unlocked: ['tires:1', 'paint:3'], fitted: { ...FRESH_EXPECTED.fitted, jeep: { ...DEFAULT_FIT_EXPECTED, tires: 1, paint: 3 } }, goal: 'body:firetruck',
      modes: {
        learn: { level: 3, window: [], opened: true, starred: true, introPending: false, fresh: false },
        count: { level: 2, window: [], opened: true, starred: false, introPending: false, fresh: false },
        pay: { level: 1, window: [], opened: false, starred: false, introPending: false, fresh: false },
      },
      trophies: { 'learn:2': '2026-09-01', 'learn:3': TODAY, 'learn:star': TODAY, 'count:2': TODAY },
    },
  },
  {
    id: 'v3',
    raw: {
      version: 3, bolts: 9, body: 'pickup', unlocked: ['paint:2'], fitted: { pickup: { paint: 2, doorNumber: 8 } },
      modes: { learn: { level: 2, opened: true } }, trophies: { 'streak:5': '2026-09-01', perfect: '2026-09-02' },
      roundsFinished: 12, currentStreak: 2, bestStreak: 6, daysPlayed: 3, lastDay: '2026-09-02',
    },
    expected: {
      ...FRESH_EXPECTED, bolts: 9, body: 'pickup', unlocked: ['paint:2'],
      fitted: { ...FRESH_EXPECTED.fitted, pickup: { ...DEFAULT_FIT_EXPECTED, paint: 2, doorNumber: 8 } },
      modes: { ...FRESH_EXPECTED.modes, learn: { level: 2, window: [], opened: true, starred: false, introPending: false, fresh: false } },
      trophies: { 'streak:5': '2026-09-01', perfect: '2026-09-02' },
      roundsFinished: 12, currentStreak: 2, bestStreak: 6, daysPlayed: 3, lastDay: '2026-09-02',
    },
  },
  { id: 'v4-mod', raw: progressedRaw, expected: PROGRESSED_EXPECTED },
  { id: 'v4-body', raw: { ...progressedRaw, goal: 'body:firetruck' }, expected: { ...PROGRESSED_EXPECTED, goal: 'body:firetruck' } },
  { id: 'v4-colour', raw: { ...progressedRaw, goal: 'colour:lime' }, expected: { ...PROGRESSED_EXPECTED, goal: 'colour:lime' } },
  { id: 'v4-auto', raw: { ...progressedRaw, goal: null }, expected: { ...PROGRESSED_EXPECTED, goal: null } },
  { id: 'v4-null-body', raw: { version: 4, body: null }, expected: FRESH_EXPECTED },
  {
    id: 'recoverable',
    raw: {
      version: 4, bolts: 'broken', body: 'firetruck', ownedBodies: ['jeep', 'jeep', 'tank'],
      unlocked: ['paint:2', 'paint:2', 'wings:9'], colours: ['teal', 'teal', 'plaid', 'red'],
      fitted: { pickup: { paint: 2, tires: 4, colour: 'navy', doorNumber: 100 }, jeep: { paint: 2, colour: 'teal', doorNumber: 0 } },
      goal: 'paint:4', lastMode: 'race',
      modes: {
        learn: { level: 2, window: ['clean', 'missed', 'clean', 'helped', 'clean', 'bad', 'missed', 'clean', 'helped', 'clean', 'missed', 'helped', 'clean'], opened: true, introPending: true, fresh: 'yes' },
        count: { level: 9, window: 'bad', opened: 'yes', starred: 1 },
        pay: { level: 1, window: ['helped'], opened: true, fresh: true },
      },
      trophies: { 'learn:2': '2026-09-03', 'streak:5': '2026-09-02', 'wings:9': '2026-09-01', perfect: 7 },
      roundsFinished: 12, currentStreak: -1, bestStreak: 6, daysPlayed: 3.5, lastDay: '2026-09-03',
    },
    expected: {
      ...FRESH_EXPECTED, body: 'pickup', ownedBodies: ['pickup', 'bigfoot', 'dragster', 'jeep'], unlocked: ['paint:2'], colours: ['teal'],
      fitted: { ...FRESH_EXPECTED.fitted, pickup: { ...DEFAULT_FIT_EXPECTED, paint: 2 }, jeep: { ...DEFAULT_FIT_EXPECTED, paint: 2, colour: 'teal', doorNumber: 0 } },
      modes: {
        learn: { level: 2, window: ['clean', 'helped', 'clean', 'missed', 'clean', 'helped', 'clean', 'missed', 'helped', 'clean'], opened: true, starred: false, introPending: true, fresh: false },
        count: { level: 1, window: [], opened: false, starred: false, introPending: false, fresh: false },
        pay: { level: 1, window: ['helped'], opened: true, starred: false, introPending: false, fresh: true },
      },
      trophies: { 'learn:2': '2026-09-03', 'streak:5': '2026-09-02' }, roundsFinished: 12, bestStreak: 6, lastDay: '2026-09-03',
    },
  },
  { id: 'owned-goal', raw: { ...progressedRaw, goal: 'tires:4' }, expected: { ...PROGRESSED_EXPECTED, goal: null } },
  { id: 'unknown-goal', raw: { ...progressedRaw, goal: 'wings:9' }, expected: { ...PROGRESSED_EXPECTED, goal: null } },
  { id: 'newer', raw: { version: 99, bolts: 7, futureField: { keep: 'unknown' } }, expected: { ...FRESH_EXPECTED, bolts: 7 } },
];
