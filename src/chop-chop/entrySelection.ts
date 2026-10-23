import { selectEntry } from '../entry';
import { chopVoice } from './voiceCollection';

export const chopEntry = selectEntry('./src/chop-chop/entry.tsx', chopVoice);
