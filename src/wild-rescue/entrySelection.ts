import { selectEntry } from '../entry';
import { rescueVoice } from './voiceCollection';

export const rescueEntry = selectEntry('./src/wild-rescue/entry.tsx', rescueVoice);
