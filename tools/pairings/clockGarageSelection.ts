import { selectEntry } from '../../src/entry';
import { garageVoice } from '../../src/garage/voice';
import { paymentVoice } from '../../src/modes/pay/voice';
import { amountVoice } from '../../src/voice/amountVoice';
import { composeVoice } from '../../src/voice/collection';
import { clockVoice } from './clockVoice';
import { moneyInspectionVoice } from '../../src/money/voice';

export const clockGarageEntry = selectEntry('./tools/pairings/clockGarageEntry.tsx', composeVoice(clockVoice, garageVoice, paymentVoice, amountVoice, moneyInspectionVoice));
