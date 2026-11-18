import { selectEntry } from '../entry';
import { truckVoice } from './voiceCollection';

export const truckEntry = selectEntry('./src/food-truck/entry.tsx', truckVoice);
