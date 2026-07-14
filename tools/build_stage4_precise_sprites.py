from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "stage4" / "level1-airlock"
SOURCE = Image.open(ASSETS / "airlock-background-clean-v2.png").convert("RGBA")
CLEAN = Image.open(ASSETS / "airlock-background-sprites-v3.png").convert("RGBA")

source_rgb = np.asarray(SOURCE, dtype=np.int16)[..., :3]
clean_rgb = np.asarray(CLEAN, dtype=np.int16)[..., :3]
pixel_difference = np.max(np.abs(source_rgb - clean_rgb), axis=2)


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


def remove_small_components(binary, minimum_size):
    height, width = binary.shape
    seen = np.zeros_like(binary, dtype=bool)
    result = np.zeros_like(binary, dtype=bool)
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
            if len(component) >= minimum_size:
                for px, py in component:
                    result[py, px] = True
    return result


def fill_holes(mask):
    height, width = mask.shape
    outside = np.zeros_like(mask, dtype=bool)
    queue = deque()
    for x in range(width):
        if not mask[0, x]:
            queue.append((x, 0))
        if not mask[height - 1, x]:
            queue.append((x, height - 1))
    for y in range(height):
        if not mask[y, 0]:
            queue.append((0, y))
        if not mask[y, width - 1]:
            queue.append((width - 1, y))
    while queue:
        x, y = queue.popleft()
        if outside[y, x] or mask[y, x]:
            continue
        outside[y, x] = True
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < width and 0 <= ny < height and not outside[ny, nx] and not mask[ny, nx]:
                queue.append((nx, ny))
    return mask | (~mask & ~outside)


def build_sprite(name, roi, threshold, close_size, fill_object, envelope_painter,
                 color_selector=None, use_envelope_only=False):
    left, top, right, bottom = roi
    diff = pixel_difference[top:bottom, left:right]
    binary = Image.fromarray(np.where(diff >= threshold, 255, 0).astype(np.uint8), "L")
    if close_size > 1:
        binary = binary.filter(ImageFilter.MaxFilter(close_size)).filter(ImageFilter.MinFilter(close_size))
    component = largest_component(np.asarray(binary) > 0)

    envelope = Image.new("L", SOURCE.size, 0)
    envelope_painter(ImageDraw.Draw(envelope))
    envelope_array = np.asarray(envelope.crop(roi)) > 0
    component &= envelope_array
    if use_envelope_only:
        component = envelope_array
    elif fill_object:
        # The three solid fixtures use a tight outer silhouette. Keeping the
        # complete interior avoids transparent bites where the repaired plate
        # happens to share a dark color with the original artwork.
        component = envelope_array
    elif color_selector is not None:
        roi_rgb = source_rgb[top:bottom, left:right]
        component &= color_selector(roi_rgb)
        component_image = Image.fromarray(np.where(component, 255, 0).astype(np.uint8), "L")
        component_image = component_image.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))
        component = remove_small_components(np.asarray(component_image) > 0, minimum_size=16)
    if fill_object:
        component = fill_holes(component)

    alpha = Image.fromarray(np.where(component, 255, 0).astype(np.uint8), "L")
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.7))
    alpha_array = np.asarray(alpha)
    bbox = Image.fromarray(alpha_array, "L").getbbox()
    if not bbox:
        raise RuntimeError(f"No sprite pixels found for {name}")

    source_crop = SOURCE.crop(roi)
    sprite = Image.new("RGBA", source_crop.size, (0, 0, 0, 0))
    sprite.paste(source_crop, (0, 0), alpha)
    sprite = sprite.crop(bbox)
    output = ASSETS / f"object-{name}-v2.png"
    sprite.save(output, optimize=True)
    global_bbox = (left + bbox[0], top + bbox[1], left + bbox[2], top + bbox[3])
    print(name, global_bbox, sprite.size)


def ladder_envelope(draw):
    draw.line([(752, 216), (744, 646)], fill=255, width=30)
    draw.line([(817, 214), (828, 646)], fill=255, width=30)
    for y in (301, 354, 410, 466, 523, 582, 635):
        draw.line([(744, y), (829, y)], fill=255, width=22)
    draw.ellipse((716, 635, 773, 663), fill=255)
    draw.ellipse((801, 635, 855, 663), fill=255)


def leak_envelope(draw):
    draw.ellipse((592, 77, 921, 228), fill=255)


def scanner_envelope(draw):
    draw.ellipse((1088, 408, 1204, 561), fill=255)


def inner_door_envelope(draw):
    draw.polygon([(1339, 292), (1474, 292), (1516, 333), (1518, 624),
                  (1493, 661), (1354, 661), (1327, 624), (1327, 333)], fill=255)


def warm_metal(rgb):
    red = rgb[..., 0]
    green = rgb[..., 1]
    blue = rgb[..., 2]
    return (red > 46) & ((red - blue) > 16) & ((green - blue) > 1)


build_sprite("ladder", (680, 180, 870, 690), threshold=24, close_size=5, fill_object=False,
             envelope_painter=ladder_envelope, color_selector=warm_metal, use_envelope_only=True)
build_sprite("leak", (570, 60, 940, 240), threshold=30, close_size=7, fill_object=True,
             envelope_painter=leak_envelope)
build_sprite("scanner", (1070, 390, 1220, 580), threshold=30, close_size=7, fill_object=True,
             envelope_painter=scanner_envelope)
build_sprite("inner-door", (1300, 270, 1536, 690), threshold=30, close_size=9, fill_object=True,
             envelope_painter=inner_door_envelope)
