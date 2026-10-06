from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "stage4" / "assets" / "level1-airlock"
SOURCE = Image.open(ASSETS / "scanner-console-markup-source.png").convert("RGBA")
MARKUP = Image.open(ASSETS / "scanner-console-markup-highlight.png").convert("RGB")


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


pixels = np.asarray(MARKUP)
non_white = np.any(pixels < 245, axis=2)
ys, xs = np.where(non_white)
if not len(xs):
    raise RuntimeError("Markup image is empty")

# The pasted console occupies the top-left non-white rectangle; the remaining
# canvas is blank white. Crop to that pasted image before reading the markup.
content_right = int(xs.max()) + 1
content_bottom = int(ys.max()) + 1
content = MARKUP.crop((0, 0, content_right, content_bottom))
content_pixels = np.asarray(content)

red = content_pixels[..., 0]
green = content_pixels[..., 1]
blue = content_pixels[..., 2]
yellow = (red >= 205) & (green >= 165) & (blue <= 95) & ((red - blue) >= 130)

# Close tiny brush gaps so the user's yellow loop is a reliable flood barrier.
boundary_image = Image.fromarray(np.where(yellow, 255, 0).astype(np.uint8), "L")
boundary_image = boundary_image.filter(ImageFilter.MaxFilter(3))
boundary = np.asarray(boundary_image) > 0
outside = flood_outside(boundary)
inside = ~outside & ~boundary

# Expand to approximately the centerline of the thick yellow brush stroke.
inside_image = Image.fromarray(np.where(inside, 255, 0).astype(np.uint8), "L")
inside_image = inside_image.filter(ImageFilter.MaxFilter(5))

# Map the user's scaled markup back to the untouched full-resolution crop.
alpha = inside_image.resize(SOURCE.size, Image.Resampling.LANCZOS)
# Smooth freehand brush wobble without changing the marked object. Rebuild a
# clean binary contour, then add a narrow antialiased fringe like the other
# standalone sprites.
smoothed = alpha.filter(ImageFilter.GaussianBlur(1.8))
smoothed = smoothed.point(lambda value: 255 if value >= 128 else 0)
alpha = smoothed.filter(ImageFilter.GaussianBlur(0.65))
bbox = alpha.getbbox()
if not bbox:
    raise RuntimeError("No closed yellow scanner boundary was found")

sprite = Image.new("RGBA", SOURCE.size, (0, 0, 0, 0))
sprite.paste(SOURCE, (0, 0), alpha)
sprite = sprite.crop(bbox)

output = ASSETS / "object-scanner-display-v5.png"
sprite.save(output, optimize=True)
print(output)
print("markup content", content.size, "source", SOURCE.size, "sprite", sprite.size, "bbox", bbox)
