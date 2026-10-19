// Full-page phone screenshots of portfolio sites, taken in real Chrome on a GitHub runner.
import { chromium } from 'playwright';
import fs from 'node:fs';
const req = JSON.parse(fs.readFileSync('tools/shots/request.json', 'utf8'));
fs.mkdirSync('media/sites', { recursive: true });
const b = await chromium.launch({ channel: 'chrome' });
for (const t of req.targets) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'he-IL',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' });
  const pg = await ctx.newPage();
  await pg.goto(t.url, { waitUntil: 'networkidle', timeout: 60000 });
  await pg.waitForTimeout(2500);
  // walk down the page so lazy images and reveal-on-scroll sections load, then back to the top
  const H = await pg.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 400) { await pg.evaluate(v => window.scrollTo(0, v), y); await pg.waitForTimeout(250); }
  await pg.waitForTimeout(1500);
  await pg.evaluate(() => window.scrollTo(0, 0));
  await pg.waitForTimeout(1500);
  await pg.screenshot({ path: `media/sites/${t.name}.png`, fullPage: true });
  console.log(t.name, H);
  await ctx.close();
}
await b.close();
