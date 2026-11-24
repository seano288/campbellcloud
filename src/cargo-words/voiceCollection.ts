// Cargo Words' recorded phrases and their clips, for the app and the build.
import { defineCollection } from '../voice/collection';
import { PHRASES } from './phrases';
import { CLIPS } from './voice.gen';

export const cargoVoice = defineCollection('cargo-words', PHRASES, CLIPS);
