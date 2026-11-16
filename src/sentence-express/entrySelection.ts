import { selectEntry } from '../entry';
import { expressVoice } from './voiceCollection';

export const expressEntry = selectEntry('./src/sentence-express/entry.tsx', expressVoice);
