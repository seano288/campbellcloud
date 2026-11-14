import { selectEntry } from '../entry';
import { fleetVoice } from './voiceCollection';

export const fleetEntry = selectEntry('./src/treasure-fleet/entry.tsx', fleetVoice);
