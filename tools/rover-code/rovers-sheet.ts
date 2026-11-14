// Draws every rover, plain and wearing everything, and each gadget on the Scout, to one sheet, for checking how they look.
//   npm run dev:rover-code   (in another shell)
//   npx tsx tools/rover-code/rovers-sheet.ts <url> <out.png>
import { chromium } from 'playwright';

const [url = 'http://localhost:5198/', out = '/tmp/rovers.png'] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1500, height: 1700 } });
await page.goto(url);
// a string, so the bundler's helpers stay out of the page
await page.evaluate(`(async () => {
  const { drawRover, roverSpan } = await import('/src/rover-code/art/draw.ts');
  const { ROVER_IDS, FEATURE_IDS } = await import('/src/rover-code/base/rovers.ts');
  document.body.innerHTML = '';
  document.body.style.background = '#1b2a6b';
  const cell = (look, label, opts = {}) => {
    const c = document.createElement('canvas'); c.width = 240; c.height = 200;
    const x = c.getContext('2d'), span = roverSpan(look), k = Math.min(240 / (span.right - span.left + 60), 200 / (span.bottom - span.top + (opts.chute ? 130 : 0))) * .95;
    x.fillStyle = '#2a2160'; x.fillRect(0, 0, 240, 200);
    x.translate(120, 200 - (span.bottom * k) - 4); x.scale(k, k); drawRover(x, look, { t: .6, spin: .4, go: 1, ...opts });
    const w = document.createElement('figure'); w.style.cssText = 'display:inline-block;margin:4px;color:#fff;font:12px sans-serif';
    w.append(c, Object.assign(document.createElement('figcaption'), { textContent: label }));
    document.body.append(w);
  };
  for (const kind of ROVER_IDS) cell({ kind, kit: [] }, kind);
  for (const kind of ROVER_IDS) cell({ kind, kit: FEATURE_IDS }, \`\${kind} + everything\`);
  for (const kind of ROVER_IDS) cell({ kind, kit: ['chute', 'alien', 'flames', 'plow', 'wheels', 'gold'] }, \`\${kind} chute open\`, { chute: true });
  for (const f of FEATURE_IDS) cell({ kind: 'scout', kit: [f] }, f);

})()`);
const clip = process.env.CLIP?.split(',').map(Number); // x,y,w,h: just part of the sheet
await page.screenshot({ path: out, fullPage: !clip, ...(clip ? { clip: { x: clip[0]!, y: clip[1]!, width: clip[2]!, height: clip[3]! } } : {}) });
await browser.close();
