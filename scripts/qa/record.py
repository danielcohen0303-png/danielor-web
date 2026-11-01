# Records a page of the live site at iPhone size, scrolling it slowly like a
# reader: for b-roll in the launch videos (31.10). A real iPhone screen
# recording looks better (60/s, the real Safari); this is the fallback.
#
#   python3 record_site.py /he out.mp4 [seconds-of-scroll] [screens]
#   python3 record_site.py /he/guide guide.mp4 30 12
#
# Pauses on the first screen 3 s, glides `screens` viewport heights over
# `seconds`, holds 2 s. Cookie notice and the guide teaser are pre-answered.
import glob, os, shutil, subprocess, sys, tempfile
from playwright.sync_api import sync_playwright

path = sys.argv[1] if len(sys.argv) > 1 else "/he"
out = sys.argv[2] if len(sys.argv) > 2 else "site.mp4"
secs = float(sys.argv[3]) if len(sys.argv) > 3 else 25
screens = float(sys.argv[4]) if len(sys.argv) > 4 else 10
import os
B = os.environ.get("SITE", "https://ac-holding.co")
GLIDE = "(e,d)=>new Promise(r=>{const s=scrollY,t0=performance.now();function f(t){const k=Math.min(1,(t-t0)/d);const q=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;scrollTo(0,s+(e-s)*q);k<1?requestAnimationFrame(f):r()}requestAnimationFrame(f)})"

tmp = tempfile.mkdtemp()
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome")
    # warm the cache, so the recording isn't the page loading
    c = b.new_context(**p.devices["iPhone 13"]); pg = c.new_page()
    pg.goto(B + path, wait_until="networkidle"); pg.wait_for_timeout(4000); c.close()
    c = b.new_context(**p.devices["iPhone 13"], record_video_dir=tmp, record_video_size={"width": 780, "height": 1688})
    c.add_cookies([{"name": "ac_consent", "value": "essential", "url": B}])
    pg = c.new_page()
    pg.add_init_script("try{localStorage.setItem('guide-teaser-seen','1')}catch(e){}")
    pg.goto(B + path, wait_until="networkidle")
    pg.wait_for_timeout(3000)
    pg.evaluate(f"({GLIDE})(innerHeight*{screens}, {int(secs * 1000)})")
    pg.wait_for_timeout(2000)
    c.close(); b.close()
src = glob.glob(os.path.join(tmp, "*.webm"))[0]
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", "1", "-i", src, "-c:v", "libx264", "-pix_fmt", "yuv420p",
                "-crf", "18", "-movflags", "+faststart", out], check=True)
shutil.rmtree(tmp, ignore_errors=True)
print(out)
