from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "stage4" / "assets" / "level1-airlock"
SOURCE = Image.open(ASSETS / "airlock-background-clean-v2.png").convert("RGBA")
CLEAN = Image.open(ASSETS / "airlock-background-sprites-v3.png").convert("RGBA")


def largest_component(binary):
    height, width = binary.shape
    seen = np.zeros_like(binary, dtype=bool)
    largest = []
    for y in range(height):
        for x in range(width):
            if not binary[y, x] or seen[y, x]:
                continue
            queue = deque([(x, y)])
            seen[y, x] = True
            component = []
            while queue:
                px, py = queue.popleft()
                component.append((px, py))
                for nx, ny in ((px - 1, py), (px + 1, py), (px, py - 1), (px, py + 1)):
                    if 0 <= nx < width and 0 <= ny < height and binary[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        queue.append((nx, ny))
            if len(component) > len(largest):
                largest = component
    result = np.zeros_like(binary, dtype=bool)
    for x, y in largest:
        result[y, x] = True
    return result


def fill_holes(mask):
    height, width = mask.shape
    outside = np.zeros_like(mask, dtype=bool)
    queue = deque()
    for x in range(width):
        queue.extend(((x, 0), (x, height - 1)))
    for y in range(height):
        queue.extend(((0, y), (width - 1, y)))
    while queue:
        x, y = queue.popleft()
        if outside[y, x] or mask[y, x]:
            continue
        outside[y, x] = True
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < width and 0 <= ny < height and not outside[ny, nx] and not mask[ny, nx]:
                queue.append((nx, ny))
    return mask | (~mask & ~outside)


# Locate pixels that are both part of the removed fixture and purple rather
# than brown/gold. Their convex outer boundary follows the painted oval instead
# of imposing a guessed geometric ellipse.
source_rgb = np.asarray(SOURCE, dtype=np.int16)[..., :3]
clean_rgb = np.asarray(CLEAN, dtype=np.int16)[..., :3]
difference = np.max(np.abs(source_rgb - clean_rgb), axis=2)
red, green, blue = source_rgb[..., 0], source_rgb[..., 1], source_rgb[..., 2]

left, top, right, bottom = (570, 60, 940, 220)
yy, xx = np.ogrid[:SOURCE.height, :SOURCE.width]
center_x, center_y = 756.5, 141.5
oval_limit = ((xx - center_x) / 172) ** 2 + ((yy - center_y) / 70) ** 2 <= 1
purple_rim = (
    (difference >= 18)
    & (blue >= green + 5)
    & (red >= green - 12)
    & (blue >= 28)
    & oval_limit
)
purple_rim[:top, :] = False
purple_rim[bottom:, :] = False
purple_rim[:, :left] = False
purple_rim[:, right:] = False

# Hand-fit a smooth closed path to the visible purple housing. The asymmetric
# lower curve deliberately rises before the brown ladder mounts begin.
def cubic(start, control_a, control_b, end, steps=24):
    points = []
    for index in range(steps):
        t = index / steps
        one_minus_t = 1 - t
        x = (one_minus_t ** 3 * start[0]
             + 3 * one_minus_t ** 2 * t * control_a[0]
             + 3 * one_minus_t * t ** 2 * control_b[0]
             + t ** 3 * end[0])
        y = (one_minus_t ** 3 * start[1]
             + 3 * one_minus_t ** 2 * t * control_a[1]
             + 3 * one_minus_t * t ** 2 * control_b[1]
             + t ** 3 * end[1])
        points.append((x, y))
    return points


segments = [
    ((756, 76), (700, 74), (650, 82), (620, 105)),
    ((620, 105), (600, 118), (590, 132), (592, 148)),
    ((592, 148), (594, 164), (610, 176), (640, 187)),
    ((640, 187), (680, 201), (720, 205), (756, 205)),
    ((756, 205), (800, 205), (842, 198), (876, 184)),
    ((876, 184), (898, 172), (910, 157), (909, 140)),
    ((909, 140), (908, 123), (896, 108), (874, 96)),
    ((874, 96), (842, 80), (800, 76), (756, 76)),
]
path = []
for segment in segments:
    path.extend(cubic(*segment))

SCALE = 4
mask = Image.new("L", (SOURCE.width * SCALE, SOURCE.height * SCALE), 0)
draw = ImageDraw.Draw(mask)
draw.polygon([(round(x * SCALE), round(y * SCALE)) for x, y in path], fill=255)
mask = mask.resize(SOURCE.size, Image.Resampling.LANCZOS)

bbox = mask.getbbox()
sprite = Image.new("RGBA", SOURCE.size, (0, 0, 0, 0))
sprite.paste(SOURCE, (0, 0), mask)
sprite = sprite.crop(bbox)

output = ASSETS / "object-leak-v7.png"
sprite.save(output, optimize=True)
print(output)
print("source bbox", bbox, "sprite size", sprite.size)
