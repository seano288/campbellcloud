import { describe, expect, it } from 'vitest';
import { packClips } from './voice-packs';

const clip = (seed: number, length: number) => Uint8Array.from({ length }, (_, i) => (seed * 31 + i * 7) % 256);
const CLIPS = new Map([
  ['a1b2c3d4e5f6.mp3', clip(1, 40)],
  ['0f0f0f0f0f0f.mp3', clip(2, 17)],
  ['a0000000000a.mp3', clip(3, 25)],
  ['f00000000000.mp3', clip(4, 3)],
  ['0a0a0a0a0a0a.mp3', clip(5, 64)],
]);

describe('voice packs', () => {
  it('gives back every clip byte for byte from its pack', () => {
    const { packs, index } = packClips(CLIPS);
    expect(Object.keys(index.clips).sort()).toEqual([...CLIPS.keys()].sort());
    for (const [file, bytes] of CLIPS) {
      const [pack, offset, length] = index.clips[file]!;
      expect(Buffer.from(packs[pack]!.bytes.subarray(offset, offset + length)).equals(Buffer.from(bytes))).toBe(true);
    }
    expect(index.packs).toEqual(packs.map(pack => ({ file: pack.file, bytes: pack.bytes.length })));
  });

  it('puts each clip in the pack for the first hex digit of its name, in name order, with nothing else in the pack', () => {
    const { packs, index } = packClips(CLIPS);
    expect(packs.map(pack => pack.file[0])).toEqual(['0', 'a', 'f']);
    for (const pack of packs) expect(pack.file).toMatch(/^[0-9a-f]-[0-9a-f]{10}\.bin$/);
    expect(index.clips['0a0a0a0a0a0a.mp3']).toEqual([0, 0, 64]);
    expect(index.clips['0f0f0f0f0f0f.mp3']).toEqual([0, 64, 17]);
    expect(index.clips['a0000000000a.mp3']).toEqual([1, 0, 25]);
    expect(index.clips['a1b2c3d4e5f6.mp3']).toEqual([1, 25, 40]);
    expect(index.clips['f00000000000.mp3']).toEqual([2, 0, 3]);
    expect(packs.map(pack => pack.bytes.length)).toEqual([81, 65, 3]);
  });

  it('makes the same bytes and names from the same clips, whatever order they come in', () => {
    const once = packClips(CLIPS), again = packClips(new Map([...CLIPS].reverse()));
    expect(again.index).toEqual(once.index);
    expect(again.packs.map(pack => pack.bytes.toString('hex'))).toEqual(once.packs.map(pack => pack.bytes.toString('hex')));
  });

  it('changes only the pack a changed clip is in', () => {
    const before = packClips(CLIPS), after = packClips(new Map([...CLIPS, ['a0000000000a.mp3', clip(9, 25)]]));
    expect(after.index.packs.map(pack => pack.file === before.index.packs.find(old => old.file[0] === pack.file[0])!.file)).toEqual([true, false, true]);
  });

  it('fails the build when a pack would be too big for Cloudflare', () => {
    expect(() => packClips(CLIPS, 80)).toThrow(/Voice pack 0 would be 81 bytes/);
    expect(() => packClips(CLIPS, 81)).not.toThrow();
  });

  it('refuses a clip whose name does not start with a hex digit', () => {
    expect(() => packClips(new Map([['hello.mp3', clip(1, 4)]]))).toThrow(/hello\.mp3/);
  });
});
