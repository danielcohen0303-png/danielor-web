# The lead form through a stubbed /api/lead (no real lead, ever): an empty
# send is refused, a full one sends every field, the thanks shows.
#   python3 scripts/qa/form.py https://site [--token T] [--path /]
import json
from playwright.sync_api import sync_playwright
from common import args, url
a = args(lambda ap: ap.add_argument("--path", default="/"))
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome")
    ctx = b.new_context(**p.devices["iPhone 13"]); pg = ctx.new_page(); sent = []
    pg.route("**/api/lead", lambda r: (sent.append(json.loads(r.request.post_data)), r.fulfill(status=200, content_type="application/json", body='{"ok":true}')))
    pg.goto(url(a, a.path), wait_until="load", timeout=90000); pg.wait_for_timeout(1500)
    f = pg.locator("form").first; f.scroll_into_view_if_needed()
    f.locator("button[type=submit]").click(); pg.wait_for_timeout(400)
    print("empty send: sent", len(sent), "| marked", pg.locator("form .is-bad").count())
    f.locator("input[name=name]").fill("בדיקה פנימית"); f.locator("input[name=phone]").fill("050-0000000")
    f.locator("input[name=email]").fill("test@example.com"); f.locator("input[name=consent]").check()
    f.locator("button[type=submit]").click(); pg.wait_for_timeout(1200)
    print("sent:", sent[-1] if sent else None)
    print("thanks shown:", pg.locator(".kit-form-done").count() == 1)
    b.close()
