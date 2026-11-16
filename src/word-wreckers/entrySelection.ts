import { selectEntry } from '../entry';
import { wreckersVoice } from './voiceCollection';

export const wreckersEntry = selectEntry('./src/word-wreckers/entry.tsx', wreckersVoice);
