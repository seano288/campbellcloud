import { defineCollection } from '../voice/collection';
import { MONEY_INSPECTION_PHRASES } from './phrases';
import { CLIPS } from './voice.gen';

export const moneyInspectionVoice = defineCollection('money-inspection', MONEY_INSPECTION_PHRASES, CLIPS);
