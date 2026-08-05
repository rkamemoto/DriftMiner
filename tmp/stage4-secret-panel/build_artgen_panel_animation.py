from collections import deque
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / "assets" / "stage4" / "level4-bathroom"
VIS = Path(r"C:\Users\RyanKamemoto\.codex\visualizations\2026\07\12\019f55d9-5ed2-77c1-bf66-3d0a3cebfacc")

BASE_PATH = ASSETS / "bathroom-background-faucets-clean-v1.png"
GENERATED_PATH = ASSETS / "bathroom-secret-panel-open-artgen-v1.png"
OLD_SHEET_PATH = ASSETS / "bathroom-secret-panel-animation-approved-v6.png"
TRASH_PATH = ASSETS / "bathroom-secret-panel-trash-foreground-v2.png"

OPEN_FRAME_PATH = ASSETS / "bathroom-secret-panel-open-artgen-local-v1.png"
OPEN_MASK_PATH = ASSETS / "bathroom-secret-panel-open-artgen-mask-v1.png"
SHEET_PATH = ASSETS / "bathroom-secret-panel-animation-artgen-clean-v1.png"
PROOF_PATH = VIS / "secret-panel-artgen-localized-proof-v1.png"

CANVAS_SIZE = (960, 640)
ROI = (565, 55, 670, 265)
SEED = (620, 145)
OLD_BOX = (580, 70, 655, 250)
OLD_FRAME_SIZE = (75, 180)
FRAME_COUNT = 16


def color_distance(left, right):
    return sum(abs(left[index] - right[index]) for index in range(3))


base = Image.open(BASE_PATH).convert("RGBA").resize(CANVAS_SIZE, Image.Resampling.LANCZOS)
generated = Image.open(GENERATED_PATH).convert("RGBA").resize(CANVAS_SIZE, Image.Resampling.LANCZOS)

base_pixels = base.load()
generated_pixels = generated.load()
x0, y0, x1, y1 = ROI

# Identify only the newly generated dark cavity. The connected-component test
# prevents nearby door shadows and pipes from entering the mask.
candidate = set()
for y in range(y0, y1):
    for x in range(x0, x1):
        source = base_pixels[x, y]
        edited = generated_pixels[x, y]
        luminance = edited[0] * .2126 + edited[1] * .7152 + edited[2] * .0722
        source_luminance = source[0] * .2126 + source[1] * .7152 + source[2] * .0722
        difference = color_distance(source, edited)
        if luminance < 142 and (difference > 82 or source_luminance - luminance > 35):
            candidate.add((x, y))

# Find the candidate pixel nearest the center seed, then retain its component.
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

mask = Image.new("L", CANVAS_SIZE, 0)
mask_pixels = mask.load()
for x, y in component:
    mask_pixels[x, y] = 255

# Close tiny detection gaps and fill the interior so the generated cyan screen
# and pipes remain part of the opening. Keep the exterior silhouette produced
# by the art generator.
mask = mask.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
component_box = mask.getbbox()
if component_box is None:
    raise RuntimeError("Could not isolate the generated crawlspace opening")

local = mask.crop(component_box)
local_pixels = local.load()
width, height = local.size
outside = set()
queue = deque()
for x in range(width):
    queue.extend(((x, 0), (x, height - 1)))
for y in range(height):
    queue.extend(((0, y), (width - 1, y)))
while queue:
    x, y = queue.popleft()
    if (x, y) in outside or local_pixels[x, y] != 0:
        continue
    outside.add((x, y))
    for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
        if 0 <= nx < width and 0 <= ny < height:
            queue.append((nx, ny))
for y in range(height):
    for x in range(width):
        if local_pixels[x, y] == 0 and (x, y) not in outside:
            local_pixels[x, y] = 255
mask.paste(local, component_box[:2])

# Remove the thin generated metal fringe that carried a few top bolts and the
# one-pixel right-side seam. The opening itself continues underneath the trash
# can; the original extracted trash sprite is composited back above it later.
component_box = mask.getbbox()
mask_draw = ImageDraw.Draw(mask)
mask_draw.rectangle(
    (component_box[0], component_box[1], component_box[2] - 1, component_box[1] + 3),
    fill=0,
)
mask_draw.rectangle(
    (component_box[2] - 2, component_box[1], component_box[2] - 1, component_box[3] - 1),
    fill=0,
)
component_box = mask.getbbox()

open_layer = generated.copy()
open_layer.putalpha(mask)
open_layer.save(OPEN_FRAME_PATH)
mask.save(OPEN_MASK_PATH)

# Union the existing animation area with the generated final opening.
union_box = (
    min(OLD_BOX[0], component_box[0]),
    min(OLD_BOX[1], component_box[1]),
    max(OLD_BOX[2], component_box[2]),
    max(OLD_BOX[3], component_box[3]),
)
frame_width = union_box[2] - union_box[0]
frame_height = union_box[3] - union_box[1]
sheet = Image.new("RGBA", (frame_width * FRAME_COUNT, frame_height), (0, 0, 0, 0))
old_sheet = Image.open(OLD_SHEET_PATH).convert("RGBA")
generated_patch = open_layer.crop(union_box)
trash_clear_mask = (
    Image.open(TRASH_PATH)
    .convert("RGBA")
    .getchannel("A")
    .crop(union_box)
    .filter(ImageFilter.MaxFilter(7))
)

for index in range(FRAME_COUNT):
    frame = Image.new("RGBA", (frame_width, frame_height), (0, 0, 0, 0))
    if index < 11:
        old_frame = old_sheet.crop((index * OLD_FRAME_SIZE[0], 0, (index + 1) * OLD_FRAME_SIZE[0], OLD_FRAME_SIZE[1]))
        frame.alpha_composite(old_frame, (OLD_BOX[0] - union_box[0], OLD_BOX[1] - union_box[1]))
        # Remove the old transition artwork around the can, including its
        # three-pixel antialias fringe. The exact original trash sprite is
        # drawn as foreground by the game for every animation frame.
        frame.putalpha(ImageChops.subtract(frame.getchannel("A"), trash_clear_mask))
    else:
        frame.alpha_composite(generated_patch)
    sheet.paste(frame, (index * frame_width, 0), frame)

sheet.save(SHEET_PATH)

proof = Image.alpha_composite(base, open_layer)
proof = Image.alpha_composite(proof, Image.open(TRASH_PATH).convert("RGBA"))
draw = ImageDraw.Draw(proof)
draw.rectangle((component_box[0], component_box[1], component_box[2] - 1, component_box[3] - 1), outline=(255, 211, 101), width=1)
proof.save(PROOF_PATH)

print("opening_bbox", component_box)
print("animation_bbox", union_box)
print("frame_size", (frame_width, frame_height))
print(OPEN_FRAME_PATH)
print(SHEET_PATH)
print(PROOF_PATH)
