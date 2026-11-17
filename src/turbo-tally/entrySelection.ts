import { selectEntry } from '../entry';
import { tallyVoice } from './voiceCollection';

export const tallyEntry = selectEntry('./src/turbo-tally/entry.tsx', tallyVoice);
