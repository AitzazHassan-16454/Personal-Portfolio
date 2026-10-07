"""Remove the near-black studio background from the talent portrait.

Strategy
--------
1. The background is a very uniform dark colour (~rgb(8,9,13), stdev < 1),
   the person is much brighter / differently hued.
2. Flood-fill from the image border (plus the already-transparent right half)
   with a tight colour tolerance -> only background *connected* to the edge is
   removed, so dark pixels inside hair / clothing are never punched out.
3. Feather the resulting alpha by ~1px so the cut edge is not jagged.

Run from anywhere:  python3 scripts/cutout.py
Next step:          python3 scripts/fade.py
"""
import os
from collections import deque

from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets-src", "talent-transparent.png")
DST = os.path.join(ROOT, "images", "talent-cutout.png")
TOL = 10          # max per-channel distance from the sampled background colour
FEATHER = 0.9     # gaussian radius for the alpha edge

im = Image.open(SRC).convert("RGBA")
w, h = im.size
px = im.load()

# --- 1. sample the background colour from the opaque top-left corner ---------
samples = []
for y in range(0, 40, 2):
    for x in range(0, 40, 2):
        r, g, b, a = px[x, y]
        if a > 200:
            samples.append((r, g, b))
bg = tuple(sorted(s[i] for s in samples)[len(samples) // 2] for i in range(3))
print("background colour:", bg)


def bg_like(x, y):
    r, g, b, a = px[x, y]
    return abs(r - bg[0]) <= TOL and abs(g - bg[1]) <= TOL and abs(b - bg[2]) <= TOL


# --- 2. flood fill ----------------------------------------------------------
mask = bytearray(w * h)          # 1 = background
q = deque()

for x in range(w):
    for y in (0, h - 1):
        if px[x, y][3] < 8 or bg_like(x, y):
            i = y * w + x
            if not mask[i]:
                mask[i] = 1
                q.append((x, y))
for y in range(h):
    for x in (0, w - 1):
        if px[x, y][3] < 8 or bg_like(x, y):
            i = y * w + x
            if not mask[i]:
                mask[i] = 1
                q.append((x, y))

while q:
    x, y = q.popleft()
    for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
        if 0 <= nx < w and 0 <= ny < h:
            i = ny * w + nx
            if not mask[i] and bg_like(nx, ny):
                mask[i] = 1
                q.append((nx, ny))

# --- 3. apply to alpha ------------------------------------------------------
removed = kept = 0
for y in range(h):
    base = y * w
    for x in range(w):
        if mask[base + x]:
            r, g, b, a = px[x, y]
            if a:
                px[x, y] = (r, g, b, 0)
                removed += 1
        elif px[x, y][3]:
            kept += 1
print("pixels made transparent:", removed, "| opaque pixels kept:", kept)

# --- 4. feather -------------------------------------------------------------
alpha = im.getchannel("A").filter(ImageFilter.GaussianBlur(FEATHER))
im.putalpha(alpha)

im.save(DST)
print("wrote", DST, im.size)

# --- 5. report --------------------------------------------------------------
leftover = sum(
    1 for y in range(0, h, 2) for x in range(0, w, 2)
    if px[x, y][3] > 200 and bg_like(x, y)
)
print("opaque bg-coloured pixels left (sampled):", leftover)
