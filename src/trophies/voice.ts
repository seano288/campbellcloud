import { defineCollection } from '../voice/collection';
import { TROPHY_PHRASES } from './phrases';
import { CLIPS } from './voice.gen';

export const trophyVoice = defineCollection('money-trophies', TROPHY_PHRASES, CLIPS);
