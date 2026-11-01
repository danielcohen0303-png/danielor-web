# The share card a link shows in WhatsApp, Facebook, iMessage: 1200x630 JPEG
# under 300KB (WhatsApp's limit), a picture beside the name. Chrome renders
# the Hebrew, so the bidi is right (from the AC site's guide card, 30.10).
#
#   python3 scripts/og/make-og.py --title "שם העסק" --sub "שורה אחת" \
#     --kicker "SCROLL FILM" --image public/film/x/v1/poster.webp \
#     --bg "#1d1a17" --ink "#f8f5f0" --accent "#b08a4a"
#
# Writes public/og.jpg (the layout points at it). Then check it: send the
# link to yourself in WhatsApp, wait for the card before sending.
import argparse, base64, io, mimetypes, pathlib
from playwright.sync_api import sync_playwright
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument("--title", required=True); ap.add_argument("--sub", default=""); ap.add_argument("--kicker", default="")
ap.add_argument("--image", required=True); ap.add_argument("--bg", default="#1d1a17"); ap.add_argument("--ink", default="#f8f5f0")
ap.add_argument("--accent", default="#b08a4a"); ap.add_argument("--out", default="public/og.jpg")
a = ap.parse_args()
img = pathlib.Path(a.image)
uri = f"data:{mimetypes.guess_type(img.name)[0] or 'image/webp'};base64,{base64.b64encode(img.read_bytes()).decode()}"
html = f"""<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Rubik:wght@500;700&display=block" rel="stylesheet">
<style>html,body{{margin:0;width:1200px;height:630px;overflow:hidden}}
body{{font-family:Rubik,sans-serif;background:{a.bg};color:{a.ink};display:flex;align-items:center;gap:60px;padding:0 80px;box-sizing:border-box}}
.pic{{flex:none;width:300px;height:533px;border-radius:18px;object-fit:cover;box-shadow:0 30px 60px rgba(0,0,0,.45)}}
.k{{font-size:24px;letter-spacing:.3em;color:{a.accent}}} h1{{font-size:92px;line-height:.95;margin:16px 0 22px;font-weight:700}}
.s{{font-size:30px;line-height:1.4;opacity:.85}}</style></head><body>
<img class="pic" src="{uri}"><div><div class="k" dir="ltr">{a.kicker}</div><h1>{a.title}</h1><div class="s">{a.sub}</div></div></body></html>"""
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome"); pg = b.new_page(viewport={"width": 1200, "height": 630})
    pg.set_content(html); pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(500)
    png = pg.screenshot(); b.close()
out = pathlib.Path(a.out); out.parent.mkdir(parents=True, exist_ok=True)
Image.open(io.BytesIO(png)).convert("RGB").save(out, "JPEG", quality=86, optimize=True, progressive=True)
print(out, out.stat().st_size // 1024, "KB")
