from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "stage4" / "assets" / "level1-airlock"
SOURCE = Image.open(ASSETS / "inner-door-markup-sourcea.png").convert("RGBA")
MARKUP = Image.open(ASSETS / "inner-door-markup-highlight.PNG").convert("RGB")


def flood_outside(boundary):
    height, width = boundary.shape
    outside = np.zeros_like(boundary, dtype=bool)
    queue = deque()
    for x in range(width):
        queue.extend(((x, 0), (x, height - 1)))
    for y in range(height):
        queue.extend(((0, y), (width - 1, y)))
    while queue:
        x, y = queue.popleft()
        if outside[y, x] or boundary[y, x]:
            continue
        outside[y, x] = True
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < width and 0 <= ny < height and not outside[ny, nx] and not boundary[ny, nx]:
                queue.append((nx, ny))
    return outside


if MARKUP.size != SOURCE.size:
    raise RuntimeError(f"Markup {MARKUP.size} does not match source {SOURCE.size}")

pixels = np.asarray(MARKUP)
red = pixels[..., 0].astype(np.int16)
green = pixels[..., 1].astype(np.int16)
blue = pixels[..., 2].astype(np.int16)
yellow = (red >= 205) & (green >= 155) & (blue <= 100) & ((red - blue) >= 125)

# Seal only tiny gaps in the hand-drawn loop, then flood from the canvas edge.
boundary_image = Image.fromarray(np.where(yellow, 255, 0).astype(np.uint8), "L")
boundary_image = boundary_image.filter(ImageFilter.MaxFilter(3))
boundary = np.asarray(boundary_image) > 0
inside = ~flood_outside(boundary) & ~boundary

# Recover approximately half of the thick yellow stroke so the cut follows its
# centerline. A light blur removes hand jitter while preserving the traced door.
alpha = Image.fromarray(np.where(inside, 255, 0).astype(np.uint8), "L")
alpha = alpha.filter(ImageFilter.MaxFilter(7))
alpha = alpha.filter(ImageFilter.GaussianBlur(1.25))
alpha = alpha.point(lambda value: 255 if value >= 128 else 0)
alpha = alpha.filter(ImageFilter.GaussianBlur(0.55))

bbox = alpha.getbbox()
if not bbox:
    raise RuntimeError("No closed yellow inner-door boundary was found")

sprite = Image.new("RGBA", SOURCE.size, (0, 0, 0, 0))
sprite.paste(SOURCE, (0, 0), alpha)
sprite = sprite.crop(bbox)

output = ASSETS / "object-inner-door-v3.png"
sprite.save(output, optimize=True)
print(output)
print("source", SOURCE.size, "sprite", sprite.size, "bbox", bbox)
