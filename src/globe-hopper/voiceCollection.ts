// Globe Hopper's recorded phrases and their clips, for the app and the build.
import { defineCollection } from '../voice/collection';
import { PHRASES } from './phrases';
import { CLIPS } from './voice.gen';

export const globeVoice = defineCollection('globe-hopper', PHRASES, CLIPS);
