// Cuts the silence off the end of Dragon Roost's recorded clips, without re-encoding them. edge-tts ends every clip with most of a
// second of quiet room noise (41% of all the audio in pass 2), and the game throws it away as it decodes a clip anyway (voice.tsx keeps
// 0.24 s after the last sound of a sentence, 0.03 s after a piece), so what he hears is unchanged and the voice packs are about a third
// smaller.
//
// Each clip is decoded in a headless browser (as the iPad does) to find its last sound; then whole MP3 frames after that, plus TAIL_S of
// air, are dropped. Frames are only ever dropped from the end, so the frames that are kept decode exactly as before (a frame borrows bits
// from the frames before it, never after). The clips are 24 kHz mono MPEG-2 Layer III at 48 kbps with no tags, which the parser checks.
// It changes only clips that still have a long tail, so it is safe to run again after tools/make_voice.py records new ones:
//   npx tsx tools/dragon-roost/trim-voice.ts [public/dragon-roost-voice]
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const DIR = resolve(process.argv[2] ?? 'public/dragon-roost-voice');
/** Louder than this is sound (voice.tsx's QUIET). */
const QUIET = 0.002;
/** Air kept after the last sound: more than the 0.24 s the game keeps after a sentence. */
const TAIL_S = 0.35;

/** The byte offset of each frame. Throws on anything but the CBR MPEG Layer III edge-tts writes. */
export function frames(b: Uint8Array): { at: number[]; samples: number; rate: number } {
  const at: number[] = [];
  let rate = 0, samples = 0;
  for (let i = 0; i < b.length;) {
    if (b[i] !== 0xff || (b[i + 1]! & 0xe0) !== 0xe0) throw new Error(`no frame at byte ${i}`);
    const version = (b[i + 1]! >> 3) & 3, layer = (b[i + 1]! >> 1) & 3, brIndex = b[i + 2]! >> 4, srIndex = (b[i + 2]! >> 2) & 3, pad = (b[i + 2]! >> 1) & 1;
    if (layer !== 1 || srIndex === 3 || brIndex === 0 || brIndex === 15) throw new Error(`not an MPEG Layer III frame at byte ${i}`);
    const mpeg1 = version === 3;
    const kbps = (mpeg1 ? [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320] : [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160])[brIndex]!;
    const hz = ({ 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] } as Record<number, number[]>)[version]![srIndex]!;
    rate = hz;
    const perFrame = mpeg1 ? 1152 : 576, size = Math.floor(((perFrame / 8) * kbps * 1000) / hz) + pad;
    at.push(i);
    samples += perFrame;
    i += size;
  }
  return { at, samples, rate };
}

async function main() {
  const files = readdirSync(DIR).filter(f => f.endsWith('.mp3')).sort();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('about:blank');
  /** The time of the last sound in a clip, in seconds, and its length, as a browser decodes it. */
  const lastSound = (bytes: number[]) => page.evaluate(async ({ bytes, quiet }) => {
    const ctx = new OfflineAudioContext(1, 1, 24000), buf = await ctx.decodeAudioData(new Uint8Array(bytes).buffer);
    const s = buf.getChannelData(0);
    let last = s.length - 1;
    while (last > 0 && Math.abs(s[last]!) <= quiet) last--;
    return { last: last / buf.sampleRate, length: buf.duration };
  }, { bytes, quiet: QUIET });
  let before = 0, after = 0, cut = 0;
  for (const f of files) {
    const path = resolve(DIR, f), b = new Uint8Array(readFileSync(path));
    before += b.length;
    const { at, samples, rate } = frames(b), { last } = await lastSound([...b]);
    const perFrame = samples / at.length, keep = Math.ceil(((last + TAIL_S) * rate) / perFrame) + 1;
    if (keep >= at.length) { after += b.length; continue; }
    const out = b.subarray(0, at[keep]);
    // the kept part must decode to the same last sound
    const check = await lastSound([...out]);
    if (Math.abs(check.last - last) > 0.002 || check.length < last + TAIL_S * 0.9) throw new Error(`${f}: last sound ${last.toFixed(3)} s became ${check.last.toFixed(3)} s`);
    writeFileSync(path, out);
    after += out.length;
    cut++;
  }
  await browser.close();
  console.log(`${files.length} clips, ${cut} trimmed: ${(before / 1048576).toFixed(1)} MiB to ${(after / 1048576).toFixed(1)} MiB`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
