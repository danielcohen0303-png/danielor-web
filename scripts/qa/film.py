# The film on an emulated iPhone with the CPU slowed 4x: the whole page at a
# screen a second; frame times, long tasks (with where they fell), videos
# attached at once, and the Instagram test (50 px of bar must not move the
# page). Chrome is not an iPhone (seeks take 5-15 ms here, 50-450 there):
# use it to compare versions, and confirm on the phone.
#   python3 scripts/qa/film.py https://site [--token T] [--path /]
import json
from playwright.sync_api import sync_playwright
from common import args, url
a = args(lambda ap: ap.add_argument("--path", default="/"))
RUN = """async () => { const fr=[]; const lt=[]; let t0=null,last=null; let maxV=0;
  const po=new PerformanceObserver(l=>{for(const e of l.getEntries()) lt.push([+((e.startTime-t0)/1000).toFixed(1), Math.round(e.duration)])}); po.observe({type:'longtask'});
  const H=innerHeight, end=document.documentElement.scrollHeight-H;
  await new Promise(res=>{const f=(t)=>{ if(t0===null){t0=t;last=t} fr.push(t-last); last=t;
    const n=[...document.querySelectorAll('video')].filter(v=>v.getAttribute('src')).length; if(n>maxV) maxV=n;
    const y=(t-t0)/1000*H; scrollTo(0,Math.min(end,y)); y<end?requestAnimationFrame(f):res(); }; requestAnimationFrame(f);});
  po.disconnect(); fr.shift(); const s=[...fr].sort((x,y)=>x-y); const q=v=>+s[Math.floor(v*(s.length-1))].toFixed(1);
  return {screens:+(end/H).toFixed(1), p50:q(.5), p95:q(.95), max:q(1), over50:fr.filter(x=>x>50).length, longtasks:lt, videosAttachedMax:maxV}; }"""
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome")
    ctx = b.new_context(**p.devices["iPhone 13"]); pg = ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(url(a, a.path), wait_until="networkidle", timeout=120000); pg.wait_for_timeout(3000)
    cdp = ctx.new_cdp_session(pg); cdp.send("Emulation.setCPUThrottlingRate", {"rate": 4})
    r = pg.evaluate(RUN); cdp.send("Emulation.setCPUThrottlingRate", {"rate": 1})
    pg.evaluate("scrollTo(0, document.documentElement.scrollHeight*0.8)"); pg.wait_for_timeout(800)
    before = pg.evaluate("document.documentElement.scrollHeight")
    pg.set_viewport_size({"width": 390, "height": 714}); pg.wait_for_timeout(800)
    r["instagramBarMovesPagePx"] = pg.evaluate("document.documentElement.scrollHeight") - before
    r["errors"] = errs[:5]
    r["pageHeightPx"] = pg.evaluate("document.documentElement.scrollHeight"); print(json.dumps(r, ensure_ascii=False, indent=1)); b.close()
