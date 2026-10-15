import { selectEntry } from '../../src/entry';
import { subjectVoice } from '../../src/modes/voice';
import { trophyVoice } from '../../src/trophies/voice';
import { amountVoice } from '../../src/voice/amountVoice';
import { composeVoice } from '../../src/voice/collection';
import { clockVoice } from './clockVoice';

export const moneyRepeatEntry = selectEntry('./tools/pairings/moneyRepeatEntry.tsx', composeVoice(subjectVoice, trophyVoice, amountVoice, clockVoice));
