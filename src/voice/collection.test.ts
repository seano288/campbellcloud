import { describe, expect, it } from 'vitest';
import { composeVoice, defineCollection } from './collection';
import { missingClips } from '../../tools/voice-check';
import { moneyVoice } from '../app/voice';
import { CLIPS } from './voice.gen';

describe('selected recorded collections', () => {
  it('identifies missing mappings separately from missing generated clip files', () => {
    const collection = defineCollection('fixture', ['42!', '25 cents'], { '42!': 'number.mp3', '25 cents': 'amount.mp3' });
    const broken = { ...collection, clips: { '42!': 'number.mp3' } };
    expect(missingClips('/no-selected-recordings', broken)).toEqual([
      { collection: 'fixture', phrase: '42!', kind: 'file', file: '/no-selected-recordings/number.mp3' },
      { collection: 'fixture', phrase: '25 cents', kind: 'mapping' },
    ]);
    expect(composeVoice(collection).phrases).toEqual(['42!', '25 cents']);
  });

  it('selects every existing money recording including amounts, earned Bolts, prices and Door Numbers', () => {
    expect(moneyVoice.clips).toEqual(CLIPS);
    expect(moneyVoice.phrases).toEqual(expect.arrayContaining(['25 cents', '9 dollars', 'You earned 6 Bolts!', 'You need 30 more Bolts.', '0!', '99!']));
  });
});
