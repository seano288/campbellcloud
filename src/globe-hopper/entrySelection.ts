import { selectEntry } from '../entry';
import { globeVoice } from './voiceCollection';

export const globeEntry = selectEntry('./src/globe-hopper/entry.tsx', globeVoice);
