// Chop Chop's recorded phrases and their clips, for the app and the build.
import { defineCollection } from '../voice/collection';
import { PHRASES } from './phrases';
import { CLIPS } from './voice.gen';

export const chopVoice = defineCollection('chop-chop', PHRASES, CLIPS);
