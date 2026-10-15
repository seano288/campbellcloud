import { defineCollection } from '../voice/collection';
import { PRESENTATION_PHRASES } from './presentationPhrases';
import { CLIPS } from './voice.gen';

export const presentationVoice = defineCollection('truck-money-presentation', PRESENTATION_PHRASES, CLIPS);
