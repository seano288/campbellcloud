import { MODE_IDS, MODE_NAMES, type ModeId, type ModeName, type RaisedLevel } from '../modes/ids';
import { DAYS, TROPHIES, type RoundsN, type StreakN, type TrophyStep } from './trophies';

// ---------- Trophies ----------
export type TrophyName = `${ModeName} Level ${RaisedLevel}` | `${ModeName} Star` | `${StreakN} in a Row` | 'Perfect Round' | `${RoundsN} Rounds` | `${typeof DAYS} Days`;
/** Read aloud when he taps a trophy he hasn't earned yet. */
type TrophyHint = `Reach Level ${RaisedLevel} in ${ModeName}!` | `Be a ${ModeName} star!` | `Get ${StreakN} right in a row on the first try!`
  | 'Get every answer right on the first try in one Round!' | `Finish ${RoundsN} Rounds!` | `Play on ${typeof DAYS} different days!`;
type TrophyPhrase = 'Trophies!' | TrophyName | TrophyHint | `You earned ${TrophyName}!`;
const modeName = (m: ModeId) => MODE_NAMES[MODE_IDS.indexOf(m)]!;
/** "10 in a Row" */
export function trophyName(s: TrophyStep): TrophyName {
  switch (s.kind) {
    case 'level': return `${modeName(s.mode)} Level ${s.level}`;
    case 'star': return `${modeName(s.mode)} Star`;
    case 'streak': return `${s.n} in a Row`;
    case 'perfect': return 'Perfect Round';
    case 'rounds': return `${s.n} Rounds`;
    case 'days': return `${s.n} Days`;
  }
}
/** "Get 10 right in a row on the first try!" */
export function trophyHint(s: TrophyStep): TrophyHint {
  switch (s.kind) {
    case 'level': return `Reach Level ${s.level} in ${modeName(s.mode)}!`;
    case 'star': return `Be a ${modeName(s.mode)} star!`;
    case 'streak': return `Get ${s.n} right in a row on the first try!`;
    case 'perfect': return 'Get every answer right on the first try in one Round!';
    case 'rounds': return `Finish ${s.n} Rounds!`;
    case 'days': return `Play on ${s.n} different days!`;
  }
}
/** "You earned 10 in a Row!" */
export const earnedTrophy = (s: TrophyStep) => `You earned ${trophyName(s)}!` as const;
export const TROPHY_PHRASES: readonly TrophyPhrase[] = ['Trophies!', ...TROPHIES.flatMap(t => t.steps).flatMap(s => [trophyName(s), trophyHint(s), earnedTrophy(s)])];
