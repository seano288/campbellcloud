import { describe, expect, expectTypeOf, it } from 'vitest';
import { createMoneyVoice, type Item } from './say';
import { CLIPS } from './voice.gen';

describe('money recorded voice', () => {
  it('expands amounts into recorded typed pieces while retaining group highlighting', async () => {
    const played: { file: string; light: string | null }[] = [];
    const voice = createMoneyVoice({
      load: async file => file,
      play(file) {
        played.push({ file, light: voice.speaking.value });
        return { done: Promise.resolve(), stop() {} };
      },
    });
    await voice.scope().say('It costs', { parts: [{ cents: 225 }], light: 'price' }, { cents: 101 }, { cents: 0 });
    expect(played).toEqual([
      { file: CLIPS['It costs'], light: null },
      { file: CLIPS['2 dollars'], light: 'price' },
      { file: CLIPS['25 cents'], light: 'price' },
      { file: CLIPS['1 dollar'], light: null },
      { file: CLIPS['1 cent'], light: null },
    ]);
    expect(voice.speaking.value).toBeNull();
    expectTypeOf<string>().not.toExtend<Item>();
  });

  it('appends expanded money amounts and ignores a cancelled facade without hushing its replacement', async () => {
    const played: string[] = [];
    const voice = createMoneyVoice({
      load: async file => file,
      play(file) { played.push(file); return { done: Promise.resolve(), stop() {} }; },
    });
    const old = voice.scope(), next = voice.scope();
    const first = old.say({ cents: 100 });
    const appended = old.sayMore({ cents: 25 });
    await Promise.all([first, appended]);
    expect(played).toEqual([CLIPS['1 dollar'], CLIPS['25 cents']]);
    old.cancel();
    const said = next.say('It costs', { cents: 335 });
    await old.say({ cents: -1 });
    await old.sayMore('Wow!');
    old.hush();
    await said;
    expect(played).toEqual([CLIPS['1 dollar'], CLIPS['25 cents'], CLIPS['It costs'], CLIPS['3 dollars'], CLIPS['35 cents']]);
  });
});
