import { selectEntry } from '../entry';
import { moneyVoice } from './voice';

export const moneyEntry = selectEntry('./src/app/entry.tsx', moneyVoice);
