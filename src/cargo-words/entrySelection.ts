import { selectEntry } from '../entry';
import { cargoVoice } from './voiceCollection';

export const cargoEntry = selectEntry('./src/cargo-words/entry.tsx', cargoVoice);
