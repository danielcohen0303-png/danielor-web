"""Turn a still-camera clip into a test clip with a continuous camera move.

A scroll film shows judder best on a steady push-in, and our free test clip
(AI Adele in the clinic) has a still camera. Each frame is resampled with a
sub-pixel affine (bicubic), so the move itself adds no stepping of its own.

usage: python3 make-test-clip.py <src.mp4> <out.mp4>
"""
import subprocess, sys, tempfile, pathlib
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
W, H = 1080, 1920
tmp = pathlib.Path(tempfile.mkdtemp())
subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-vf", f"scale={W}:{H}", str(tmp / "s%04d.png")], check=True)
frames = sorted(tmp.glob("s*.png"))
n = len(frames)
ease = lambda x: x * x * (3 - 2 * x)
for i, f in enumerate(frames):
    t = ease(i / (n - 1))
    z = 1 + 0.42 * t                    # push in 42%
    cx = W / 2 + 70 * t                 # drift toward her face
    cy = H * (0.5 - 0.17 * t)
    # output pixel (x, y) samples source (cx + (x - W/2)/z, cy + (y - H/2)/z)
    a, e = 1 / z, 1 / z
    c, fy = cx - W / 2 / z, cy - H / 2 / z
    im = Image.open(f).convert("RGB").transform((W, H), Image.AFFINE, (a, 0, c, 0, e, fy), Image.BICUBIC)
    im.save(tmp / f"o{i:04d}.png")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", "24", "-i", str(tmp / "o%04d.png"),
                "-c:v", "libx264", "-crf", "12", "-preset", "slow", "-pix_fmt", "yuv420p", out], check=True)
print(out, n, "frames")
