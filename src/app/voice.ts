import { garageVoice } from '../garage/voice';
import { subjectVoice } from '../modes/voice';
import { paymentVoice } from '../modes/pay/voice';
import { trophyVoice } from '../trophies/voice';
import { amountVoice } from '../voice/amountVoice';
import { composeVoice } from '../voice/collection';
import { presentationVoice } from './presentationVoice';

export const moneyCollections = [subjectVoice, garageVoice, paymentVoice, amountVoice, trophyVoice, presentationVoice] as const;
export const moneyVoice = composeVoice(...moneyCollections);
