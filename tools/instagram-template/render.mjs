// Danielor slide renderer: node render.mjs <page.html> <outdir> [seconds=8] [fps=60]
// Then: ffmpeg -framerate 60 -i <outdir>/f%04d.png -vf "scale=1080:1350:flags=lanczos,tmix=frames=2:weights='1 1',fps=30,format=yuv420p" -c:v libx264 -preset slow -crf 16 -movflags +faststart slide.mp4
// (tmix adds a light motion blur to anything flying in). Stills: node render.mjs page.html outdir still 0.5,2,7.5
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
const [, , page, out, a = '8', b = '60'] = process.argv;
const br = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const p = await br.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: a === 'still' ? 1 : 1.5 });
p.on('pageerror', e => console.log('pageerror:', e.message));
await p.goto('file://' + path.resolve(page));
await p.waitForFunction(() => window.__ready === true); await p.waitForTimeout(300);
fs.mkdirSync(out, { recursive: true });
if (a === 'still') {
  for (const t of b.split(',').map(Number)) { await p.evaluate(async t => await seek(t), t); await p.screenshot({ path: `${out}/t${t}.png` }); }
} else {
  const dur = +a, fps = +b;
  for (let i = 0; i < dur * fps; i++) {
    await p.evaluate(async t => await seek(t), i / fps);
    await p.screenshot({ path: `${out}/f${String(i).padStart(4, '0')}.png` });
  }
}
await br.close();
