# Crop each before/after pair so the eye sits in the same place and at the same size
# (Daniel, 30.10: "the eye at the same height, not one up and one down").
# Eye centre and corner-to-corner width as fractions of the photo, read off a grid by hand.
import os, sys, subprocess
from PIL import Image, ImageOps
src, heic, out, sheet = sys.argv[1:5]
EYES = {  # name: (before x, y, width), (after x, y, width)
 "lash-1": ((0.30,0.51,0.25),(0.45,0.41,0.32)), "lash-2": ((0.45,0.31,0.38),(0.55,0.375,0.42)),
 "lash-3": ((0.47,0.36,0.40),(0.60,0.43,0.38)), "lash-4": ((0.52,0.45,0.43),(0.65,0.36,0.40)),
 "lash-5": ((0.50,0.44,0.55),(0.52,0.61,0.52)), "lash-6": ((0.50,0.46,0.32),(0.53,0.45,0.32)),
 "lash-7": ((0.48,0.37,0.30),(0.43,0.44,0.37)), "lash-8": ((0.42,0.33,0.28),(0.38,0.47,0.38)),
 "brow-1": ((0.40,0.64,0.52),(0.43,0.50,0.45)), "brow-2": ((0.55,0.61,0.28),(0.55,0.49,0.33)),
 "brow-3": ((0.53,0.44,0.45),(0.45,0.47,0.47)), "brow-4": ((0.50,0.56,0.42),(0.45,0.66,0.50)),
}
OW, OH = 900, 1200
def load(name, kk):
    t, i = name.split("-"); i = int(i)
    d = "לפני ואחרי - ריסים" if t == "lash" else "לפני ואחרי - גבות"; k = "לפני" if kk == "before" else "אחרי"
    p = os.path.join(heic, f"brow_{k} {i}.jpg") if (t == "brow" and i in (2, 3)) else os.path.join(src, d, [x for x in os.listdir(os.path.join(src, d)) if x.startswith(f"{k} {i}.")][0])
    return ImageOps.exif_transpose(Image.open(p)).convert("RGB")
def box(im, e, E, ty):
    W, H = im.size; cx, cy, w = e[0]*W, e[1]*H, e[2]*W
    s = E / w  # output px per source px
    bw, bh = OW / s, OH / s
    return (cx - OW/2/s, cy - ty*OH/s, cx - OW/2/s + bw, cy - ty*OH/s + bh), W, H
thumbs = []
for name, (eb, ea) in EYES.items():
    ty = 0.5 if name.startswith("lash") else 0.58   # brows: the eye a little low, room for the brow above
    ims = [load(name, "before"), load(name, "after")]
    E = 0.40 * OW
    while True:  # zoom in until both crops fit inside their photos, so neither has to shift
        boxes = [box(im, e, E, ty) for im, e in zip(ims, (eb, ea))]
        if all(b[0] >= 0 and b[1] >= 0 and b[2] <= W and b[3] <= H for b, W, H in boxes) or E > 0.9 * OW: break
        E *= 1.03
    pair = []
    for im, (b, W, H), kk in zip(ims, boxes, ("before", "after")):
        b = (max(0, b[0]), max(0, b[1]), min(W, b[2]), min(H, b[3]))
        c = im.crop(tuple(round(v) for v in b)).resize((OW, OH), Image.LANCZOS)
        clean = Image.new("RGB", c.size); clean.paste(c)
        clean.save("/tmp/_ba.png")
        subprocess.run(["cwebp", "-quiet", "-q", "82", "-m", "6", "-metadata", "none", "/tmp/_ba.png", "-o", f"{out}/{name}-{kk}.webp"], check=True)
        pair.append(clean.resize((180, 240)))
    print(name, f"eye {E/OW:.2f} of width")
    t = Image.new("RGB", (366, 240), "white"); t.paste(pair[0], (0, 0)); t.paste(pair[1], (186, 0))
    from PIL import ImageDraw
    dr = ImageDraw.Draw(t); y = round(ty*240); dr.line([(0, y), (366, y)], fill=(255, 0, 0)); dr.line([(90, 0), (90, 240)], fill=(255, 0, 0)); dr.line([(276, 0), (276, 240)], fill=(255, 0, 0))
    thumbs.append(t)
s = Image.new("RGB", (4*372, 3*246), "white")
for j, t in enumerate(thumbs): s.paste(t, ((j % 4)*372, (j//4)*246))
s.save(sheet, quality=88)
