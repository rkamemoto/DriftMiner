from pathlib import Path
from collections import deque

from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[2]
ASSET_DIR = ROOT / "assets" / "stage4" / "level4-bathroom"

MASK_SOURCE = ASSET_DIR / "bathroom-secret-panel-approved-mask-v1.png"
SHEET_SOURCE = ASSET_DIR / "bathroom-secret-panel-animation-approved-v1.png"
TRASH_SOURCE = ASSET_DIR / "bathroom-secret-panel-trash-foreground-v2.png"

MASK_OUTPUT = ASSET_DIR / "bathroom-secret-panel-approved-mask-v6.png"
SHEET_OUTPUT = ASSET_DIR / "bathroom-secret-panel-animation-approved-v6.png"

SOURCE_PANEL_BOX = (581, 71, 654, 249)
PADDING = 1
PANEL_BOX = (
    SOURCE_PANEL_BOX[0] - PADDING,
    SOURCE_PANEL_BOX[1] - PADDING,
    SOURCE_PANEL_BOX[2] + PADDING,
    SOURCE_PANEL_BOX[3] + PADDING,
)
SOURCE_FRAME_WIDTH = 73
SOURCE_FRAME_HEIGHT = 178
FRAME_WIDTH = SOURCE_FRAME_WIDTH + PADDING * 2
FRAME_HEIGHT = SOURCE_FRAME_HEIGHT + PADDING * 2
FRAME_COUNT = 16


def fill_internal_holes(mask: Image.Image) -> Image.Image:
    """Fill only zero-valued regions that cannot reach the image boundary."""
    pixels = mask.load()
    width, height = mask.size
    exterior = set()
    queue = deque()

    for x in range(width):
        if pixels[x, 0] == 0:
            queue.append((x, 0))
        if pixels[x, height - 1] == 0:
            queue.append((x, height - 1))
    for y in range(height):
        if pixels[0, y] == 0:
            queue.append((0, y))
        if pixels[width - 1, y] == 0:
            queue.append((width - 1, y))

    while queue:
        point = queue.popleft()
        if point in exterior:
            continue
        x, y = point
        if pixels[x, y] != 0:
            continue
        exterior.add(point)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in exterior:
                queue.append((nx, ny))

    result = mask.copy()
    output = result.load()
    for y in range(height):
        for x in range(width):
            if pixels[x, y] == 0 and (x, y) not in exterior:
                output[x, y] = 255
    return result


def nearest_visible_color(frame: Image.Image, x: int, y: int, radius: int = 6):
    pixels = frame.load()
    width, height = frame.size
    best = None
    best_distance = 10_000
    for dy in range(-radius, radius + 1):
        for dx in range(-radius, radius + 1):
            sx, sy = x + dx, y + dy
            if not (0 <= sx < width and 0 <= sy < height):
                continue
            color = pixels[sx, sy]
            if color[3] == 0:
                continue
            distance = dx * dx + dy * dy
            if distance < best_distance:
                best = color[:3]
                best_distance = distance
    return best or (0, 0, 0)


def nearest_interior_color(frame: Image.Image, interior: Image.Image, x: int, y: int, radius: int = 7):
    pixels = frame.load()
    interior_pixels = interior.load()
    width, height = frame.size
    best = None
    best_distance = 10_000
    for dy in range(-radius, radius + 1):
        for dx in range(-radius, radius + 1):
            sx, sy = x + dx, y + dy
            if not (0 <= sx < width and 0 <= sy < height):
                continue
            if not interior_pixels[sx, sy] or pixels[sx, sy][3] == 0:
                continue
            distance = dx * dx + dy * dy
            if distance < best_distance:
                best = pixels[sx, sy][:3]
                best_distance = distance
    return best


mask_full = Image.open(MASK_SOURCE).convert("L")
mask_crop = mask_full.crop(PANEL_BOX)

# The original literal trace left its dark outline as transparent pixels. Fill
# only those internal holes. Do not dilate or expand the approved outer edge.
solid_mask = fill_internal_holes(mask_crop)
# One pixel of bleed covers the pale seam immediately outside the approved
# trace. This is antialias cleanup, not the multi-pixel expansion that made the
# earlier opening visibly oversized.
solid_mask = solid_mask.filter(ImageFilter.MaxFilter(3))
solid_mask = solid_mask.point(lambda value: 255 if value else 0)

# Do not redraw the trash can. Remove its exact sprite silhouette (plus one
# safety pixel) from every animation frame, leaving the pristine base-room
# trash art visible throughout the animation.
trash_alpha = Image.open(TRASH_SOURCE).convert("RGBA").getchannel("A")
trash_crop = trash_alpha.crop(PANEL_BOX)
trash_crop = trash_crop.point(lambda value: 255 if value else 0)
solid_mask_pixels = solid_mask.load()
trash_pixels = trash_crop.load()
for y in range(FRAME_HEIGHT):
    for x in range(FRAME_WIDTH):
        if trash_pixels[x, y]:
            solid_mask_pixels[x, y] = 0

mask_output = Image.new("L", mask_full.size, 0)
mask_output.paste(solid_mask, PANEL_BOX[:2])
mask_output.save(MASK_OUTPUT)

source_sheet = Image.open(SHEET_SOURCE).convert("RGBA")
output_sheet = Image.new("RGBA", (FRAME_WIDTH * FRAME_COUNT, FRAME_HEIGHT), (0, 0, 0, 0))
target = solid_mask.load()
interior_mask = solid_mask.filter(ImageFilter.MinFilter(5))
interior = interior_mask.load()

for frame_index in range(FRAME_COUNT):
    source_frame = source_sheet.crop((
        frame_index * SOURCE_FRAME_WIDTH,
        0,
        (frame_index + 1) * SOURCE_FRAME_WIDTH,
        SOURCE_FRAME_HEIGHT,
    ))
    frame = Image.new("RGBA", (FRAME_WIDTH, FRAME_HEIGHT), (0, 0, 0, 0))
    frame.paste(source_frame, (PADDING, PADDING), source_frame)
    original = frame.copy()
    original_pixels = original.load()
    output_pixels = frame.load()

    for y in range(FRAME_HEIGHT):
        for x in range(FRAME_WIDTH):
            if not target[x, y]:
                output_pixels[x, y] = (0, 0, 0, 0)
                continue
            if original_pixels[x, y][3] == 0:
                red, green, blue = nearest_visible_color(original, x, y)
            else:
                red, green, blue = original_pixels[x, y][:3]
            # A hard opaque edge avoids light RGB hidden beneath partially
            # transparent pixels bleeding into the scaled canvas render.
            output_pixels[x, y] = (red, green, blue, 255)

    # In the fully exposed crawlspace frames, replace only the two-pixel inner
    # boundary band with neighboring crawlspace pixels. This removes the pale
    # seam baked into the source art while preserving the approved outer mask
    # footprint exactly—no dilation and no larger hole.
    if frame_index >= 11:
        boundary_updates = []
        for y in range(FRAME_HEIGHT):
            for x in range(FRAME_WIDTH):
                if target[x, y] and not interior[x, y]:
                    color = nearest_interior_color(frame, interior_mask, x, y)
                    if color:
                        boundary_updates.append((x, y, color))
        for x, y, (red, green, blue) in boundary_updates:
            output_pixels[x, y] = (red, green, blue, 255)

    output_sheet.paste(frame, (frame_index * FRAME_WIDTH, 0), frame)

output_sheet.save(SHEET_OUTPUT)
print(MASK_OUTPUT)
print(SHEET_OUTPUT)
