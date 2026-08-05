from pathlib import Path
from PIL import Image, ImageEnhance

root = Path(__file__).resolve().parent.parent
assets = root / "assets/stage4/level3-utility-closet"
src = assets / "stuck-cable-end-v2.png"
out = assets / "stuck-cable-end-v3.png"

img = Image.open(src).convert("RGBA")
px = img.load()
w, h = img.size

# The braided cable exits into the dark wall recess on the right. Soften and
# darken that end, with a small feather on the opposite prongs as well.
right_fade_start = int(w * 0.68)
left_fade_width = int(w * 0.16)

for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        if a == 0:
            continue

        fade = 1.0
        darken = 1.0

        if x >= right_fade_start:
            t = (x - right_fade_start) / max(1, w - right_fade_start - 1)
            fade *= max(0.12, 1.0 - t * 0.88)
            darken *= max(0.28, 1.0 - t * 0.72)

        if x < left_fade_width:
            t = 1.0 - (x / max(1, left_fade_width))
            fade *= max(0.58, 1.0 - t * 0.42)
            darken *= max(0.70, 1.0 - t * 0.30)

        # Extra soft alpha near top/bottom of right cable edge so it feels
        # swallowed by the dark recess instead of rectangularly clipped.
        if x >= right_fade_start:
            edge_y = min(y, h - 1 - y) / max(1, h * 0.28)
            edge_y = min(1.0, edge_y)
            fade *= 0.72 + 0.28 * edge_y

        px[x, y] = (
            int(r * darken),
            int(g * darken),
            int(b * darken),
            int(a * fade),
        )

out.parent.mkdir(parents=True, exist_ok=True)
img.save(out)
print(out)
