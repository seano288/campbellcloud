import { defineCollection } from './collection';
import { allAmountPieces } from './amount';
import { CLIPS } from './amount.gen';

export const amountVoice = defineCollection('money-amounts', allAmountPieces(), CLIPS);
