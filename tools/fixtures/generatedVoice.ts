import { selectEntry } from '../../src/entry';
import { defineCollection } from '../../src/voice/collection';

export const generatedEntry = selectEntry('./tools/fixtures/generated.ts', defineCollection('generated-fixture', [
  '25 cents', '42!', 'You need 30 more Bolts.', 'You earned 6 Bolts!',
], {
  '25 cents': '96a962509c87.mp3',
  '42!': 'a38239e92cea.mp3',
  'You need 30 more Bolts.': '11b233dccf81.mp3',
  'You earned 6 Bolts!': '18f20d66b2ad.mp3',
}));
