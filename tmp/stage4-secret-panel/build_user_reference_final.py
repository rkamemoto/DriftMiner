from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / "assets" / "stage4" / "level4-bathroom"
REFERENCE = Path(r"C:\Users\RYANKA~1\AppData\Local\Temp\codex-clipboard-17ce5072-dd6b-48b0-a77b-f6a4d2613446.png")
BASE = ASSETS / "bathroom-background-faucets-clean-v1.png"
OUTPUT = ASSETS / "bathroom-secret-panel-open-user-reference-v1.png"

SIZE = (960, 640)
ROI = (560, 55, 675, 270)
SEED = (620, 150)


reference = Image.open(REFERENCE).convert("RGBA").resize(SIZE, Image.Resampling.LANCZOS)
base = Image.open(BASE).convert("RGBA").resize(SIZE, Image.Resampling.LANCZOS)
pixels = reference.load()

# Locate the actual dark crawlspace in the supplied approved image. This is
# used only to identify the exact top and right edges for the requested
# one-pixel removal; the rest of the reference is preserved literally.
candidate = set()
for y in range(ROI[1], ROI[3]):
    for x in range(ROI[0], ROI[2]):
        red, green, blue, _ = pixels[x, y]
        luminance = red * .2126 + green * .7152 + blue * .0722
        if luminance < 105:
            candidate.add((x, y))

start = min(candidate, key=lambda point: (point[0] - SEED[0]) ** 2 + (point[1] - SEED[1]) ** 2)
component = set()
queue = deque([start])
while queue:
    point = queue.popleft()
    if point in component or point not in candidate:
        continue
    component.add(point)
    x, y = point
    queue.extend(((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)))

left = min(x for x, _ in component)
top = min(y for _, y in component)
right = max(x for x, _ in component)
bottom = max(y for _, y in component)

reference_pixels = reference.load()
base_pixels = base.load()

# Remove five pixel lines total from the top (the prior three plus the two
# additional requested lines) and one line from the right side by restoring
# matching closed-wall pixels only on those detected boundaries.
for x in range(left, right + 1):
    for y in range(top, top + 5):
        reference_pixels[x, y] = base_pixels[x, y]
for y in range(top, bottom + 1):
    reference_pixels[right, y] = base_pixels[right, y]

reference.save(OUTPUT)
print("opening_bbox", (left, top, right + 1, bottom + 1))
print(OUTPUT)
