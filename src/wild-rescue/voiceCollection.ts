// Wild Rescue's recorded phrases and their clips, for the app and the build.
import { defineCollection } from '../voice/collection';
import { PHRASES } from './phrases';
import { CLIPS } from './voice.gen';

export const rescueVoice = defineCollection('wild-rescue', PHRASES, CLIPS);
