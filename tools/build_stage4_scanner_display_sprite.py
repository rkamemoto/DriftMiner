from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "stage4" / "level1-airlock"
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


source_rgb = np.asarray(SOURCE, dtype=np.int16)[..., :3]
clean_rgb = np.asarray(CLEAN, dtype=np.int16)[..., :3]
difference = np.max(np.abs(source_rgb - clean_rgb), axis=2)
red, green, blue = source_rgb[..., 0], source_rgb[..., 1], source_rgb[..., 2]

# Restrict extraction to the aqua glass insert. The purple bezel, gold side
# hardware, pink lower button, and the rest of the scanner body stay baked into
# the room/background layers.
yy, xx = np.ogrid[:SOURCE.height, :SOURCE.width]
oval_limit = ((xx - 1148) / 55) ** 2 + ((yy - 484) / 78) ** 2 <= 1
aqua_glass = (
    (difference >= 12)
    & (green >= red + 7)
    & (blue >= red + 7)
    & (green >= 42)
    & oval_limit
)

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
    ((1148, 407), (1135, 407), (1124, 411), (1117, 418)),
    ((1117, 418), (1108, 428), (1104, 441), (1105, 455)),
    ((1105, 455), (1104, 476), (1105, 495), (1110, 505)),
    ((1110, 505), (1119, 521), (1131, 530), (1144, 530)),
    ((1144, 530), (1157, 530), (1168, 524), (1174, 517)),
    ((1174, 517), (1185, 504), (1191, 490), (1191, 475)),
    ((1191, 475), (1191, 453), (1186, 437), (1177, 428)),
    ((1177, 428), (1168, 416), (1158, 409), (1148, 407)),
]
path = []
for segment in segments:
    path.extend(cubic(*segment))

scale = 4
alpha = Image.new("L", (SOURCE.width * scale, SOURCE.height * scale), 0)
draw = ImageDraw.Draw(alpha)
draw.polygon([(round(x * scale), round(y * scale)) for x, y in path], fill=255)
alpha = alpha.resize(SOURCE.size, Image.Resampling.LANCZOS)

bbox = alpha.getbbox()
if not bbox:
    raise RuntimeError("Could not isolate the aqua scanner display")

sprite = Image.new("RGBA", SOURCE.size, (0, 0, 0, 0))
sprite.paste(SOURCE, (0, 0), alpha)
sprite = sprite.crop(bbox)

output = ASSETS / "object-scanner-display-v3.png"
sprite.save(output, optimize=True)
print(output)
print("source bbox", bbox, "sprite size", sprite.size)
