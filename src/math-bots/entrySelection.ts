import { selectEntry } from '../entry';
import { mathVoice } from './voiceCollection';

export const mathEntry = selectEntry('./src/math-bots/entry.tsx', mathVoice);
