import { defineCollection } from '../voice/collection';
import { GARAGE_PHRASES } from './phrases';
import { CLIPS } from './voice.gen';

export const garageVoice = defineCollection('garage', GARAGE_PHRASES, CLIPS);
