// Checks every recorded clip the way the game plays it, in a real browser: it decodes (decodeAudioData, as on the iPad), isn't
// silent or clipped, is a sane length for its words, and the game's own trim (voice.tsx keepRange) keeps all of its speech. Writes
// one row per clip to <out>.json and prints the ones that need a listen.
//   npm run dev:sentence-express   (in another shell)
//   npx tsx tools/sentence-express/clips.ts [url] [out.json]
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import type { VoicePackIndex } from '../../src/audio/packs';
import { CLIPS } from '../../src/sentence-express/voice.gen';
import { expressBuild } from '../sentence-express-build';
import { packVoice, selectedVoice } from '../static-build';

const [url = 'http://localhost:5194/', out = 'clips.json'] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(url);
await page.evaluate('window.__name = f => f'); // tsx names the helpers inside evaluate()
const { index } = packVoice(selectedVoice(expressBuild));
const rows = await page.evaluate(async ({ clips, index }: { clips: [string, string][]; index: VoicePackIndex }) => {
  const ctx = new OfflineAudioContext(1, 1, 44100);
  // the game's trim (src/sentence-express/voice.tsx): the speech, 20 ms before it, and a gap after it
  const QUIET = 0.002, LEAD_S = 0.02, GAP = { piece: 0.03, sentence: 0.24 };
  const out = [];
  // the clips come in packs (tools/voice-packs.ts), as the game fetches them: each pack once, each clip a slice of it
  const packs = new Map<string, Blob>();
  for (const [text, file] of clips) {
    const at = index.clips[file];
    if (!at) { out.push({ text, file, error: 'not in a voice pack' }); continue; }
    const pack = index.packs[at[0]]!.file;
    if (!packs.has(pack)) {
      const res = await fetch(`./voice/${pack}`);
      if (!res.ok) { out.push({ text, file, error: `HTTP ${res.status} for ${pack}` }); continue; }
      packs.set(pack, await res.blob());
    }
    let buf: AudioBuffer;
    try { buf = await ctx.decodeAudioData(await packs.get(pack)!.slice(at[1], at[1] + at[2]).arrayBuffer()); } catch (e) { out.push({ text, file, error: String(e) }); continue; }
    const s = buf.getChannelData(0), n = s.length, rate = buf.sampleRate;
    let first = 0, last = n - 1, peak = 0, clipped = 0, sum = 0;
    for (let i = 0; i < n; i++) { const a = Math.abs(s[i]!); if (a > peak) peak = a; if (a >= 0.99) clipped++; sum += a * a; }
    while (first < n && Math.abs(s[first]!) <= QUIET) first++;
    while (last > first && Math.abs(s[last]!) <= QUIET) last--;
    const end = /[.?!]$/.test(text) ? 'sentence' : 'piece';
    const keep: [number, number] = first >= n ? [0, n] : [Math.max(0, first - Math.round(LEAD_S * rate)), Math.min(n, last + Math.round(GAP[end] * rate))];
    // the loudest the trimmed clip gets in its first and last 10 ms: speech cut off would be loud at the edge
    const edge = (a: number, b: number) => { let m = 0; for (let i = Math.max(0, a); i < Math.min(n, b); i++) m = Math.max(m, Math.abs(s[i]!)); return m; };
    const ms10 = Math.round(rate / 100);
    // speech: 20 ms windows louder than -40 dB, so the length of what's said is measured without the voice's own pauses
    const win = Math.round(rate / 50); let voiced = 0;
    for (let i = 0; i + win <= n; i += win) { let e = 0; for (let k = i; k < i + win; k++) e += s[k]! * s[k]!; if (Math.sqrt(e / win) > 0.01) voiced++; }
    out.push({
      text, file, dur: n / rate, kept: (keep[1] - keep[0]) / rate, lead: first / rate, tail: (n - 1 - last) / rate, voiced: voiced * win / rate,
      peak, clipped, rms: Math.sqrt(sum / n), startEdge: edge(keep[0], keep[0] + ms10), endEdge: edge(keep[1] - ms10, keep[1]),
    });
  }
  return out;
}, { clips: Object.entries(CLIPS) as [string, string][], index });
await browser.close();
writeFileSync(out, JSON.stringify(rows, null, 1));

type Row = (typeof rows)[number] & { dur?: number; kept?: number; voiced?: number; peak?: number; clipped?: number; startEdge?: number; endEdge?: number; error?: string };
const words = (t: string) => (/^\d+$/.test(t) ? Number(t) < 20 || Number(t) % 10 === 0 ? 1 : 2 : t.split(/\s+/).length);
const flags: string[] = [];
for (const r of rows as Row[]) {
  if (r.error) { flags.push(`does not decode: "${r.text}" ${r.error}`); continue; }
  const w = words(r.text), per = r.voiced! / w;
  if (r.peak! < 0.05) flags.push(`nearly silent (peak ${r.peak!.toFixed(3)}): "${r.text}"`);
  if (r.clipped! > 3) flags.push(`clipped (${r.clipped} samples): "${r.text}"`);
  if (r.startEdge! > 0.05 || r.endEdge! > 0.05) flags.push(`trim cuts speech (edges ${r.startEdge!.toFixed(3)} / ${r.endEdge!.toFixed(3)}): "${r.text}"`);
  if (w === 1 ? r.voiced! < 0.15 || r.voiced! > 1.2 : per < 0.12 || per > 0.7) flags.push(`odd length: ${r.voiced!.toFixed(2)}s of speech for ${w} word(s): "${r.text}"`);
}
const ok = (rows as Row[]).filter(r => !r.error);
const sum = (f: (r: Row) => number) => ok.reduce((a, r) => a + f(r), 0);
console.log(`${rows.length} clips, ${ok.length} decode; ${sum(r => r.dur!).toFixed(0)}s recorded, ${sum(r => r.kept!).toFixed(0)}s kept after trimming; peak ${Math.min(...ok.map(r => r.peak!)).toFixed(2)} to ${Math.max(...ok.map(r => r.peak!)).toFixed(2)}`);
console.log(flags.length ? `NEEDS A LISTEN:\n${flags.join('\n')}` : 'every clip looks fine');
