"""Soften the bottom of the talent cut-out.

The portrait's subject ends around y=500; below that a dark desk slab runs to
the frame edges, so the photo terminated in a hard horizontal line (and a short
vertical one where the slab reached x=0). Ramping alpha to zero over the bottom
quarter dissolves that into the page background instead.

Masks (the person sits at x 153..444, so these only ever touch the desk):

    bottom  1 -> 0 over y 430..576    smoothstep
    left    0 -> 1 over x   0..64
    right   0 -> 1 over x 560..615

Run:  python3 scripts/cutout.py && python3 scripts/fade.py
Idempotent-ish: it is written to run on the output of cutout.py, not twice.
"""
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "images", "talent-cutout.png")


def smoothstep(t):
    if t <= 0:
        return 0.0
    if t >= 1:
        return 1.0
    return t * t * (3 - 2 * t)


im = Image.open(SRC).convert("RGBA")
w, h = im.size
px = im.load()

Y0 = 430       # bottom fade starts here
LEFT = 64.0    # alpha 1 at x >= 64
RIGHT = 55.0   # alpha 1 at x <= w-1-55, 0 at the far right column

changed = 0
for y in range(h):
    vy = 1.0 - smoothstep((y - Y0) / float(h - Y0)) if y > Y0 else 1.0
    for x in range(w):
        r, g, b, a = px[x, y]
        if a == 0:
            continue
        m = vy
        m *= smoothstep(x / LEFT)
        m *= smoothstep((w - 1 - x) / RIGHT)
        if m >= 1.0:
            continue
        px[x, y] = (r, g, b, int(round(a * m)))
        changed += 1

im.save(SRC)
print("faded %d px, size %s -> %s" % (changed, (w, h), SRC))
