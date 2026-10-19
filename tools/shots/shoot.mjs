// Full-page phone screenshots of portfolio sites, taken in real Chrome on a GitHub runner.
import { chromium } from 'playwright';
import fs from 'node:fs';
const req = JSON.parse(fs.readFileSync('tools/shots/request.json', 'utf8'));
fs.mkdirSync('media/sites', { recursive: true });
const diag = {};
const b = await chromium.launch({ channel: 'chrome' });
for (const t of req.targets) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'he-IL',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' });
  const pg = await ctx.newPage();
  const d = diag[t.name] = { failed: [], bad: [], console: [], gap: [] };
  pg.on('requestfailed', r => d.failed.push(r.url().slice(0, 200) + ' ' + (r.failure()?.errorText || '')));
  pg.on('response', r => { if (r.status() >= 400) d.bad.push(r.status() + ' ' + r.url().slice(0, 200)); });
  pg.on('console', m => { if (m.type() === 'error') d.console.push(m.text().slice(0, 200)); });
  await pg.goto(t.url, { waitUntil: 'networkidle', timeout: 60000 });
  await pg.waitForTimeout(2500);
  // decline optional cookies if a consent bar is shown
  for (const txt of ['רק חיוניות', 'רק הכרחיות', 'דחייה']) {
    const btn = pg.getByRole('button', { name: txt });
    if (await btn.count()) { await btn.first().click().catch(() => {}); await pg.waitForTimeout(600); break; }
  }
  const H = await pg.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 300) { await pg.evaluate(v => window.scrollTo(0, v), y); await pg.waitForTimeout(350); }
  await pg.waitForTimeout(2000);
  await pg.evaluate(() => window.scrollTo(0, 0));
  await pg.waitForTimeout(2000);
  d.unsplash = await pg.evaluate(() => [...document.querySelectorAll('*')].filter(e => (e.currentSrc||e.src||'').includes('unsplash') || getComputedStyle(e).backgroundImage.includes('unsplash'))
    .map(e => { const r = e.getBoundingClientRect(); const chain = []; let p = e; for (let i = 0; i < 4 && p; i++, p = p.parentElement) chain.push(p.tagName + '.' + String(p.className).slice(0, 40)); return { url: (e.currentSrc||e.src||getComputedStyle(e).backgroundImage).slice(0, 110), ok: e.tagName === 'IMG' ? e.naturalWidth > 0 : null, top: Math.round(r.top + scrollY), h: Math.round(r.height), chain: chain.join(' < ') }; }));
  if (t.gap) d.gap = await pg.evaluate(([a, z]) => [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); const top = r.top + scrollY; return top >= a && top <= z && r.height > 80; })
    .slice(0, 25).map(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return `${e.tagName}.${e.className}#${e.id} top=${Math.round(r.top + scrollY)} h=${Math.round(r.height)} op=${cs.opacity} vis=${cs.visibility} bg=${cs.backgroundImage.slice(0, 120)} src=${(e.currentSrc || e.src || '').slice(0, 120)}`; }), t.gap);
  // hide floating bars and buttons (fixed near the bottom) so they don't land mid-page in a full-page shot
  d.hidden = await pg.evaluate(() => [...document.querySelectorAll('body *')].filter(e => { const cs = getComputedStyle(e); if (cs.position !== 'fixed') return false; const r = e.getBoundingClientRect(); return r.top > 300 && r.height < 300; })
    .map(e => { e.style.setProperty('display', 'none', 'important'); return e.tagName + '.' + String(e.className).slice(0, 40); }));
  await pg.screenshot({ path: `media/sites/${t.name}.png`, fullPage: true });
  console.log(t.name, H);
  await ctx.close();
}
await b.close();
fs.writeFileSync('media/sites/diag.json', JSON.stringify(diag, null, 1));
