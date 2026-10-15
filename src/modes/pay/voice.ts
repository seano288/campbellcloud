import { defineCollection } from '../../voice/collection';
import { PAYMENT_PHRASES } from './phrases';
import { CLIPS } from './voice.gen';

export const paymentVoice = defineCollection('exact-money-checkout', PAYMENT_PHRASES, CLIPS);
