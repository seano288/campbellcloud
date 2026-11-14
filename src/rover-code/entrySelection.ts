import { selectEntry } from '../entry';
import { roverVoice } from './voiceCollection';

export const roverEntry = selectEntry('./src/rover-code/entry.tsx', roverVoice);
