import { defineCollection } from '../voice/collection';
import { SUBJECT_PHRASES } from './phrases';
import { CLIPS } from './voice.gen';

export const subjectVoice = defineCollection('money-subject', SUBJECT_PHRASES, CLIPS);
