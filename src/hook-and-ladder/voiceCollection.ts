// Hook and Ladder's recorded phrases and their clips, for the app and the build.
import { defineCollection } from '../voice/collection';
import { PHRASES } from './phrases';
import { CLIPS } from './voice.gen';

export const ladderVoice = defineCollection('hook-and-ladder', PHRASES, CLIPS);
