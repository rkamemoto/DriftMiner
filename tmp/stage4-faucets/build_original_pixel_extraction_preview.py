from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parent
ORIGINAL_PATH = ROOT.parent.parent / "assets" / "stage4" / "level4-bathroom" / "bathroom-background-closed-v2.png"
CLEAN_PATH = ROOT / "bathroom-middle-faucet-removed-preview-v1.png"
SPRITE_PATH = ROOT / "middle-faucet-original-pixels-proposal-v2.png"
PREVIEW_PATH = ROOT / "middle-faucet-original-pixels-preview-v2.png"

original = Image.open(ORIGINAL_PATH).convert("RGBA")
clean = Image.open(CLEAN_PATH).convert("RGBA")

# Tight source-space work area around only the middle faucet. It excludes the
# sink bowl and drain below, and excludes the neighboring countertop objects.
roi = (525, 285, 615, 372)
source = original.crop(roi)
clean_source = clean.crop(roi)
diff = ImageChops.difference(source.convert("RGB"), clean_source.convert("RGB"))
diff_l = ImageOps.grayscale(diff)

# The clean edit retains small painterly changes everywhere. Keep only the
# strong localized difference produced by removal of the opaque faucet.
mask = diff_l.point(lambda p: 255 if p >= 26 else 0)
mask = mask.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(3))

# Hard-limit the mask to the faucet's vertical fixture region so the glowing
# drain and sink edge can never become part of the sprite.
limit = Image.new("L", source.size, 0)
ImageDraw.Draw(limit).polygon(
    [(12, 18), (68, 18), (76, 30), (76, 71), (65, 79), (12, 79), (6, 68), (6, 31)],
    fill=255,
)
mask = ImageChops.multiply(mask, limit)

# Discard isolated changed pixels caused by the generated clean plate. The
# faucet body and its controls form the largest connected alpha component.
pixels = mask.load()
width, height = mask.size
seen = set()
components = []
for yy in range(height):
    for xx in range(width):
        if pixels[xx, yy] == 0 or (xx, yy) in seen:
            continue
        stack = [(xx, yy)]
        seen.add((xx, yy))
        component = []
        while stack:
            cx, cy = stack.pop()
            component.append((cx, cy))
            for ny in range(max(0, cy - 1), min(height, cy + 2)):
                for nx in range(max(0, cx - 1), min(width, cx + 2)):
                    if pixels[nx, ny] and (nx, ny) not in seen:
                        seen.add((nx, ny))
                        stack.append((nx, ny))
        components.append(component)
largest = max(components, key=len) if components else []
connected = Image.new("L", mask.size, 0)
connected_pixels = connected.load()
for xx, yy in largest:
    connected_pixels[xx, yy] = 255
mask = connected
mask = mask.filter(ImageFilter.GaussianBlur(.55))

sprite = source.copy()
sprite.putalpha(mask)
bbox = mask.getbbox()
if bbox:
    padded = (max(0, bbox[0] - 3), max(0, bbox[1] - 3),
              min(source.width, bbox[2] + 3), min(source.height, bbox[3] + 3))
    sprite = sprite.crop(padded)
    sprite_offset = (roi[0] + padded[0], roi[1] + padded[1])
else:
    sprite_offset = (roi[0], roi[1])
sprite.save(SPRITE_PATH)

# Build a local faucet-free base while preserving every original pixel outside
# the small ROI. This is preview-only and is not referenced by the game.
base = original.copy()
base.paste(clean_source, (roi[0], roi[1]))


def room_state(highlight=False):
    image = base.copy()
    if highlight:
        alpha = sprite.getchannel("A")
        expanded = alpha.filter(ImageFilter.MaxFilter(11))
        ring = ImageChops.subtract(expanded, alpha)
        glow = ring.filter(ImageFilter.GaussianBlur(4))
        glow_patch = Image.new("RGBA", sprite.size, (255, 211, 101, 0))
        glow_patch.putalpha(glow.point(lambda p: round(p * .72)))
        image.alpha_composite(glow_patch, sprite_offset)
        ring_patch = Image.new("RGBA", sprite.size, (255, 211, 101, 0))
        ring_patch.putalpha(ring)
        image.alpha_composite(ring_patch, sprite_offset)
    image.alpha_composite(sprite, sprite_offset)
    return image.resize((768, 512), Image.Resampling.LANCZOS)


normal = room_state(False)
hover = room_state(True)

checker = Image.new("RGBA", (360, 348), (44, 49, 58, 255))
checker_draw = ImageDraw.Draw(checker)
for y in range(0, checker.height, 18):
    for x in range(0, checker.width, 18):
        if (x // 18 + y // 18) % 2:
            checker_draw.rectangle((x, y, x + 17, y + 17), fill=(69, 75, 86, 255))
sprite_big = sprite.resize((sprite.width * 5, sprite.height * 5), Image.Resampling.NEAREST)
checker.alpha_composite(sprite_big, ((checker.width - sprite_big.width) // 2,
                                     (checker.height - sprite_big.height) // 2))

crop_big = source.resize((360, 348), Image.Resampling.NEAREST)
header = 52
sheet = Image.new("RGBA", (1536, 512 + header + 348 + 44), (15, 19, 27, 255))
sheet.alpha_composite(normal, (0, header))
sheet.alpha_composite(hover, (768, header))
sheet.alpha_composite(crop_big, (384, header + 512 + 22))
sheet.alpha_composite(checker, (792, header + 512 + 22))
labels = ImageDraw.Draw(sheet)
labels.text((24, 18), "ORIGINAL PIXELS RESTORED AS A SPRITE", fill=(238, 242, 248, 255))
labels.text((792, 18), "SAME ORIGINAL-PIXEL SPRITE + ALPHA HOVER", fill=(255, 211, 101, 255))
labels.text((384, header + 512 + 4), "SOURCE CROP", fill=(238, 242, 248, 255))
labels.text((792, header + 512 + 4), "EXTRACTED ORIGINAL PIXELS", fill=(238, 242, 248, 255))
sheet.save(PREVIEW_PATH)
print(PREVIEW_PATH)
