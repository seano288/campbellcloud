import { selectEntry } from '../../src/entry';
import { selectedVoice } from './selectedVoice';

export const fixtureEntry = selectEntry('./tools/fixtures/selected.tsx', selectedVoice);
