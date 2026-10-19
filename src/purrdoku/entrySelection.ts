import { selectEntry } from '../entry';
import { defineCollection } from '../voice/collection';
import { PHRASES } from './phrases';
import { CLIPS } from './voice.gen';

// Purrdoku's cheeky narrator, recorded in its own voice (tools/make_voice.py).
export const purrdokuVoice = defineCollection('purrdoku', PHRASES, CLIPS);
export const purrdokuEntry = selectEntry('./src/purrdoku/entry.tsx', purrdokuVoice);
