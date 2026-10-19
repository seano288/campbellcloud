import { selectEntry } from '../entry';
import { defineCollection } from '../voice/collection';

// Purrdoku is a plain puzzle with no recorded voice, so its collection is empty.
export const purrdokuVoice = defineCollection('purrdoku', [], {});
export const purrdokuEntry = selectEntry('./src/purrdoku/entry.tsx', purrdokuVoice);
