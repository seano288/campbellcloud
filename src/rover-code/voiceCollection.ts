// Rover Code's recorded phrases and their clips, for the app and the build.
import { defineCollection } from '../voice/collection';
import { PHRASES } from './phrases';
import { CLIPS } from './voice.gen';

export const roverVoice = defineCollection('rover-code', PHRASES, CLIPS);
