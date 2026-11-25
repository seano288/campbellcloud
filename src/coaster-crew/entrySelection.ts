import { selectEntry } from '../entry';
import { coasterVoice } from './voiceCollection';

export const coasterEntry = selectEntry('./src/coaster-crew/entry.tsx', coasterVoice);
