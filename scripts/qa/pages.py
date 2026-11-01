# Every page on a phone and a computer: status, page errors, failed requests
# on the site, and sideways scroll down the whole page.
#   python3 scripts/qa/pages.py https://site [--token T] [--pages / /privacy ...]
from playwright.sync_api import sync_playwright
from common import args, url
a = args(lambda ap: ap.add_argument("--pages", nargs="*", default=["/", "/privacy", "/accessibility"]))
bad = []
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome")
    for dev, kw in [("phone", p.devices["iPhone 13"]), ("desk", {"viewport": {"width": 1440, "height": 900}})]:
        ctx = b.new_context(**kw); pg = ctx.new_page(); errs, fails = [], []
        pg.route("**/api/lead", lambda r: r.fulfill(status=200, content_type="application/json", body='{"ok":true}'))
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("response", lambda r: fails.append(f"{r.status} {r.url}") if r.status >= 400 and a.base in r.url else None)
        for path in a.pages:
            errs.clear(); fails.clear()
            resp = pg.goto(url(a, path), wait_until="load", timeout=90000); pg.wait_for_timeout(1200)
            over = 0; h = pg.evaluate("document.documentElement.scrollHeight")
            for y in range(0, min(h, 80000), 2500):
                pg.evaluate(f"scrollTo(0,{y})"); pg.wait_for_timeout(50)
                over = max(over, pg.evaluate("document.documentElement.scrollWidth - innerWidth"))
            line = f"{dev} {path}: {resp.status if resp else 0} sideways={over} errors={len(errs)} failed={len(fails)}"
            print(line)
            if (resp and resp.status != 200) or over or errs or fails: bad.append((line, errs[:3], fails[:3]))
        ctx.close()
    b.close()
print("PROBLEMS:", bad or "none")
