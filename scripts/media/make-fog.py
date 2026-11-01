"""A fogged-glass version of a film's first frame, for the steam gate.

The gate cuts the written words out of this image, and through them the film
shows sharp: so the fog must be made from the very same frame, blurred,
lifted towards white, and beaded with droplets (sharper and darker at their
lower edge, with a bright spot of light at the top, like real condensation).

usage: python3 make-fog.py <frame.png> <out.webp>
"""
import sys, random
from PIL import Image, ImageFilter, ImageDraw, ImageChops

src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB")
W, H = im.size
random.seed(7)

# the fog: a heavy blur, lifted towards a warm white, denser near the edges
fog = im.filter(ImageFilter.GaussianBlur(W * 0.03))
white = Image.new("RGB", (W, H), (248, 241, 239))
fog = Image.blend(fog, white, 0.5)
edges = Image.radial_gradient("L").resize((W, H)).point(lambda v: int(min(255, v * 0.55)))
fog = Image.composite(white, fog, edges)

# fine grain of the condensation, centred so it neither lightens nor darkens
grain = Image.effect_noise((W, H), 10)
fog = ImageChops.add(fog, Image.merge("RGB", [grain] * 3), scale=1.0, offset=-128)

# droplets: each a small lens of the sharp frame, a darker rim below and a highlight above
drops = ImageDraw.Draw(fog, "RGBA")
for _ in range(int(W * H / 3200)):
    r = random.choice([1, 1, 1.5, 2, 2, 2.5, 3, 4, 6])
    x, y = random.uniform(0, W), random.uniform(0, H)
    box = [x - r, y - r, x + r, y + r]
    # the clear lens: the sharp image under the drop, a touch darker
    patch = im.crop((int(x - r), int(y - r), int(x + r) + 1, int(y + r) + 1)).point(lambda v: int(v * 0.9))
    mask = Image.new("L", patch.size, 0)
    ImageDraw.Draw(mask).ellipse([0, 0, patch.size[0] - 1, patch.size[1] - 1], fill=210)
    fog.paste(patch, (int(x - r), int(y - r)), mask)
    drops.arc(box, 20, 160, fill=(120, 85, 95, 55), width=max(1, int(r / 3)))
    if r >= 2:
        hr = max(1, r * 0.3)
        drops.ellipse([x - r * 0.35 - hr, y - r * 0.4 - hr, x - r * 0.35 + hr, y - r * 0.4 + hr], fill=(255, 255, 255, 170))

fog.save(out, "WEBP", quality=84)
print(out, W, H)
