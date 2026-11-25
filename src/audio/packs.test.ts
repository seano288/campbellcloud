import { describe, expect, it } from 'vitest';
import { packedClips, type VoicePackIndex } from './packs';

const PACKS = [Uint8Array.from([1, 2, 3, 4, 5, 6]), Uint8Array.from([7, 8, 9])];
const INDEX: VoicePackIndex = {
  packs: [{ file: '0-aaaaaaaaaa.bin', bytes: 6 }, { file: 'a-bbbbbbbbbb.bin', bytes: 3 }],
  clips: { '0aaa.mp3': [0, 0, 2], '0bbb.mp3': [0, 2, 3], '0ccc.mp3': [0, 5, 1], 'aaaa.mp3': [1, 0, 3] },
};

function server() {
  const requests: string[] = [];
  let down = false;
  return {
    requests,
    set down(value: boolean) { down = value; },
    get: async (url: string) => {
      requests.push(url);
      if (down) throw new TypeError('Failed to fetch');
      const pack = INDEX.packs.findIndex(p => url === `./voice/${p.file}`);
      return pack < 0 ? new Response('not found', { status: 404 }) : new Response(PACKS[pack]);
    },
  };
}
const bytes = (buffer: ArrayBuffer | null) => buffer && [...new Uint8Array(buffer)];

describe('packed clips', () => {
  it('fetches a pack once for all its clips, even when they are asked for at the same time, and slices each clip out', async () => {
    const host = server(), clip = packedClips(INDEX, host.get);
    const clips = await Promise.all(['0aaa.mp3', '0bbb.mp3', '0ccc.mp3', '0aaa.mp3'].map(clip));
    expect(clips.map(bytes)).toEqual([[1, 2], [3, 4, 5], [6], [1, 2]]);
    expect(host.requests).toEqual(['./voice/0-aaaaaaaaaa.bin']);
    expect(bytes(await clip('aaaa.mp3'))).toEqual([7, 8, 9]);
    expect(bytes(await clip('0bbb.mp3'))).toEqual([3, 4, 5]);
    expect(host.requests).toEqual(['./voice/0-aaaaaaaaaa.bin', './voice/a-bbbbbbbbbb.bin']);
  });

  it('gives null for a clip in no pack, without fetching anything', async () => {
    const host = server();
    expect(await packedClips(INDEX, host.get)('ffff.mp3')).toBeNull();
    expect(host.requests).toEqual([]);
  });

  it('fetches a pack again after the network failed, so the clip plays next time', async () => {
    const host = server(), clip = packedClips(INDEX, host.get);
    host.down = true;
    expect(await clip('0aaa.mp3')).toBeNull();
    expect(await clip('0bbb.mp3')).toBeNull();
    host.down = false;
    expect(bytes(await clip('0aaa.mp3'))).toEqual([1, 2]);
    expect(bytes(await clip('0bbb.mp3'))).toEqual([3, 4, 5]);
    expect(host.requests).toEqual(Array(3).fill('./voice/0-aaaaaaaaaa.bin'));
  });

  it('does not keep a pack that came back as an error or the wrong size', async () => {
    const statuses = [503, 200, 200];
    const requests: string[] = [];
    const clip = packedClips(INDEX, async url => {
      requests.push(url);
      const status = statuses.shift()!;
      // the second answer is a page, not the pack
      return requests.length === 2 ? new Response('<!doctype html>') : new Response(status === 200 ? PACKS[0] : null, { status });
    });
    expect(await clip('0aaa.mp3')).toBeNull();
    expect(await clip('0aaa.mp3')).toBeNull();
    expect(bytes(await clip('0aaa.mp3'))).toEqual([1, 2]);
    expect(requests).toHaveLength(3);
  });
});
