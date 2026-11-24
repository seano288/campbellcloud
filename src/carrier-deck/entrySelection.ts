import { selectEntry } from '../entry';
import { deckVoice } from './voiceCollection';

export const deckEntry = selectEntry('./src/carrier-deck/entry.tsx', deckVoice);
