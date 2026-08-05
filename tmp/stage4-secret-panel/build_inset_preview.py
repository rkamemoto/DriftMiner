from collections import deque
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / "assets" / "stage4" / "level4-bathroom"
VIS = Path(r"C:\Users\RyanKamemoto\.codex\visualizations\2026\07\12\019f55d9-5ed2-77c1-bf66-3d0a3cebfacc")

BASE = ASSETS / "bathroom-background-faucets-clean-v1.png"
MASK = ASSETS / "bathroom-secret-panel-approved-mask-v1.png"
CRAWLSPACE = ASSETS / "bathroom-secret-crawlspace-frameless-v4.png"
TRASH = ASSETS / "bathroom-secret-panel-trash-foreground-v2.png"

FINAL_MASK = ASSETS / "bathroom-secret-panel-approved-inset-mask-preview-v4.png"
FINAL_ROOM = VIS / "secret-panel-inset-edge-preview-v4.png"
COMPARISON = VIS / "secret-panel-reference-vs-inset-preview-v4.png"
ZOOM_COMPARISON = VIS / "secret-panel-reference-vs-inset-zoom-v4.png"

PANEL_BOX = (581, 71, 654, 249)


def fill_internal_holes(mask: Image.Image) -> Image.Image:
    pixels = mask.load()
    width, height = mask.size
    exterior = set()
    queue = deque()
    for x in range(width):
        queue.extend(((x, 0), (x, height - 1)))
    for y in range(height):
        queue.extend(((0, y), (width - 1, y)))
    while queue:
        x, y = queue.popleft()
        if (x, y) in exterior or pixels[x, y] != 0:
            continue
        exterior.add((x, y))
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < width and 0 <= ny < height:
                queue.append((nx, ny))
    result = mask.copy()
    result_pixels = result.load()
    for y in range(height):
        for x in range(width):
            if pixels[x, y] == 0 and (x, y) not in exterior:
                result_pixels[x, y] = 255
    return result


base = Image.open(BASE).convert("RGBA").resize((960, 640), Image.Resampling.LANCZOS)
approved = fill_internal_holes(Image.open(MASK).convert("L"))
trash = Image.open(TRASH).convert("RGBA").getchannel("A")

# Pull the opening inward by exactly two pixels. Near the trash can, retain the
# approved boundary so the darkness reaches the can instead of leaving a pale
# panel wedge between them.
inset = approved.filter(ImageFilter.MinFilter(5))
trash_nearby = trash.filter(ImageFilter.MaxFilter(11))
keep_near_trash = ImageChops.multiply(approved, trash_nearby)
opening = ImageChops.lighter(inset, keep_near_trash)

# The base painting already contains the trash can. Exclude its exact alpha so
# the crawlspace remains behind it and touches its silhouette cleanly.
opening = ImageChops.subtract(opening, trash)
opening = opening.point(lambda value: 255 if value else 0)

# Remove the two isolated dark remnants visible around the trash contact: the
# short ledge above the can before its silhouette begins, and the detached
# bottom pixel cluster beside the can. These edits fill with the untouched base
# panel because they are removed from the crawlspace mask.
opening_pixels = opening.load()
for y in range(193, 204):
    for x in range(582, 588):
        opening_pixels[x, y] = 0
for y in range(236, 243):
    for x in range(601, 611):
        opening_pixels[x, y] = 0
opening.save(FINAL_MASK)

crawlspace = Image.open(CRAWLSPACE).convert("RGBA").resize(
    (PANEL_BOX[2] - PANEL_BOX[0], PANEL_BOX[3] - PANEL_BOX[1]),
    Image.Resampling.LANCZOS,
)
crawl_layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
crawl_layer.paste(crawlspace, PANEL_BOX[:2])
crawl_layer.putalpha(opening)

final_room = Image.alpha_composite(base, crawl_layer)
final_room.save(FINAL_ROOM)

# A direct before/after proof at native game resolution. The left side uses the
# approved literal opening; the right side uses only the two-pixel inward fill.
approved_no_trash = ImageChops.subtract(approved, trash).point(lambda value: 255 if value else 0)
reference_layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
reference_layer.paste(crawlspace, PANEL_BOX[:2])
reference_layer.putalpha(approved_no_trash)
reference_room = Image.alpha_composite(base, reference_layer)

gap = 8
comparison = Image.new("RGB", (base.width * 2 + gap, base.height), "white")
comparison.paste(reference_room.convert("RGB"), (0, 0))
comparison.paste(final_room.convert("RGB"), (base.width + gap, 0))
draw = ImageDraw.Draw(comparison)
try:
    font = ImageFont.truetype("arial.ttf", 24)
except OSError:
    font = ImageFont.load_default()
draw.rounded_rectangle((18, 16, 210, 56), radius=9, fill=(12, 20, 31, 220))
draw.text((31, 23), "APPROVED EDGE", font=font, fill=(255, 238, 174))
draw.rounded_rectangle((base.width + gap + 18, 16, base.width + gap + 235, 56), radius=9, fill=(12, 20, 31, 220))
draw.text((base.width + gap + 31, 23), "2 PX INWARD FILL", font=font, fill=(255, 238, 174))
comparison.save(COMPARISON)

zoom_box = (520, 35, 700, 325)
zoom_reference = reference_room.crop(zoom_box).resize((540, 870), Image.Resampling.NEAREST)
zoom_inset = final_room.crop(zoom_box).resize((540, 870), Image.Resampling.NEAREST)
zoom = Image.new("RGB", (1088, 870), "white")
zoom.paste(zoom_reference.convert("RGB"), (0, 0))
zoom.paste(zoom_inset.convert("RGB"), (548, 0))
zoom_draw = ImageDraw.Draw(zoom)
zoom_draw.rounded_rectangle((14, 12, 270, 54), radius=9, fill=(12, 20, 31))
zoom_draw.text((27, 20), "APPROVED EDGE", font=font, fill=(255, 238, 174))
zoom_draw.rounded_rectangle((562, 12, 865, 54), radius=9, fill=(12, 20, 31))
zoom_draw.text((575, 20), "2 PX INWARD FILL", font=font, fill=(255, 238, 174))
zoom.save(ZOOM_COMPARISON)

print(FINAL_ROOM)
print(COMPARISON)
print(ZOOM_COMPARISON)
