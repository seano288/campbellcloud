import { selectEntry } from '../entry';
import { ladderVoice } from './voiceCollection';

export const ladderEntry = selectEntry('./src/hook-and-ladder/entry.tsx', ladderVoice);
