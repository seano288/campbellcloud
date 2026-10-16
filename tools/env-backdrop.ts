// Turns an equirectangular .hdr into a tone-mapped JPEG backdrop for Time Flies' Hangar and sky, with the same Khronos
// PBR Neutral curve the renderer uses, so the backdrop and the lit aircraft match.
//   npx tsx tools/env-backdrop.ts <in.hdr> <out.jpg> <width> [exposure]
// Sources are CC0 HDRIs from Poly Haven (see public/time-flies-assets/env/SOURCES.md).
import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import { FloatType } from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

const [input, output, width = '4096', exposure = '1'] = process.argv.slice(2);
if (!input || !output) throw new Error('Usage: tools/env-backdrop.ts <in.hdr> <out.jpg> <width> [exposure]');

const bytes = readFileSync(input);
const loader = new HDRLoader();
loader.setDataType(FloatType);
const hdr = loader.parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const w = hdr.width!, h = hdr.height!;
const data = hdr.data as Float32Array;

/** Khronos PBR Neutral tone mapping, as three.js's NeutralToneMapping. */
function neutral(rgb: [number, number, number]): [number, number, number] {
  const startCompression = 0.8 - 0.04, desaturation = 0.15;
  let [r, g, b] = rgb;
  const x = Math.min(r, g, b), offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
  r -= offset; g -= offset; b -= offset;
  const peak = Math.max(r, g, b);
  if (peak < startCompression) return [r, g, b];
  const d = 1 - startCompression, newPeak = 1 - (d * d) / (peak + d - startCompression);
  r *= newPeak / peak; g *= newPeak / peak; b *= newPeak / peak;
  const t = 1 - 1 / (desaturation * (peak - newPeak) + 1);
  return [r * (1 - t) + newPeak * t, g * (1 - t) + newPeak * t, b * (1 - t) + newPeak * t];
}
const srgb = (c: number) => Math.round(255 * Math.min(1, Math.max(0, c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055)));

const out = Buffer.alloc(w * h * 3), k = Number(exposure);
for (let i = 0; i < w * h; i++) {
  const [r, g, b] = neutral([data[i * 4]! * k, data[i * 4 + 1]! * k, data[i * 4 + 2]! * k]);
  out[i * 3] = srgb(r); out[i * 3 + 1] = srgb(g); out[i * 3 + 2] = srgb(b);
}
await sharp(out, { raw: { width: w, height: h, channels: 3 } }).resize(Number(width)).jpeg({ quality: 82, mozjpeg: true }).toFile(output);
console.log(`${output}: ${w}×${h} → ${width} wide, exposure ${k}`);
