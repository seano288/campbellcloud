import { selectEntry } from '../entry';
import { defineCollection } from '../voice/collection';

// Cat Nap is a plain puzzle with no recorded voice, so its collection is empty.
export const napVoice = defineCollection('cat-nap', [], {});
export const napEntry = selectEntry('./src/cat-nap/entry.tsx', napVoice);
