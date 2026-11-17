import { selectEntry } from '../entry';
import { dinoVoice } from './voiceCollection';

export const dinoEntry = selectEntry('./src/dino-dig/entry.tsx', dinoVoice);
