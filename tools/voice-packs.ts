// Packs a game's selected voice clips into at most 16 files, so the site's file count doesn't grow with its phrases
// (Cloudflare's free plan takes at most 20,000 files, and one clip a file came to more than that). A clip goes in the
// pack for the first hex digit of its file name, so a new or changed clip changes only that one pack and the iPad
// downloads about a sixteenth of the game's voice again, not all of it. Inside a pack the clips are in file-name order,
// their bytes laid end to end: each is a whole mp3 on its own, so a slice at its offset and length is the original
// file. Same clips in, same bytes out. The game finds its clips with src/audio/packs.ts.
import { createHash } from 'node:crypto';
import type { VoicePackIndex } from '../src/audio/packs';

/** Cloudflare serves no file over 25 MiB. */
export const PACK_LIMIT = 25 * 1024 * 1024;

export interface VoicePack { file: string; bytes: Buffer }

export function packClips(clips: ReadonlyMap<string, Uint8Array>, limit = PACK_LIMIT): { packs: VoicePack[]; index: VoicePackIndex } {
  const buckets = new Map<string, string[]>();
  for (const name of [...clips.keys()].sort()) {
    const bucket = name[0]?.toLowerCase() ?? '';
    if (!/^[0-9a-f]$/.test(bucket)) throw new Error(`Voice clip ${name} doesn't start with a hex digit, so it has no pack`);
    buckets.set(bucket, [...buckets.get(bucket) ?? [], name]);
  }
  const packs: VoicePack[] = [], index: { packs: VoicePackIndex['packs'][number][]; clips: Record<string, [number, number, number]> } = { packs: [], clips: {} };
  for (const [bucket, names] of [...buckets].sort(([a], [b]) => a < b ? -1 : 1)) {
    const parts = names.map(name => clips.get(name)!);
    const size = parts.reduce((total, part) => total + part.length, 0);
    if (size > limit) throw new Error(`Voice pack ${bucket} would be ${size} bytes, over the ${limit} a file can be on Cloudflare`);
    const bytes = Buffer.concat(parts);
    let offset = 0;
    names.forEach((name, i) => { index.clips[name] = [packs.length, offset, parts[i]!.length]; offset += parts[i]!.length; });
    // the name changes with the contents, so a page still running the last version never slices the wrong bytes
    const file = `${bucket}-${createHash('sha256').update(bytes).digest('hex').slice(0, 10)}.bin`;
    index.packs.push({ file, bytes: bytes.length });
    packs.push({ file, bytes });
  }
  return { packs, index };
}
