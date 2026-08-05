from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

root = Path(__file__).resolve().parents[1]
src = root / "assets/stage4/level3-utility-closet/utility-closet-background-v4.png"
out = root / "assets/stage4/level3-utility-closet/door-blue-button-sprite-v1.png"
preview = root / "tmp/door-blue-button-sprite-preview-v1.png"

im = Image.open(src).convert("RGBA")

# The wall-mounted cyan button/panel just right of the center/back door.
# Coordinates are in the original 1536x1024 background art.
box = (852, 110, 970, 282)
crop = im.crop(box)

mask = Image.new("L", crop.size, 0)
d = ImageDraw.Draw(mask)

# Main metal housing, traced conservatively so wall texture is excluded.
d.rounded_rectangle((24, 16, 94, 98), radius=18, fill=255)
d.polygon([(34, 91), (80, 91), (69, 142), (43, 142)], fill=255)

# Slight soft edge to preserve the painted antialiasing without bringing in the
# rectangular wall chunk.
mask = mask.filter(ImageFilter.GaussianBlur(0.65))
sprite = Image.new("RGBA", crop.size, (0, 0, 0, 0))
sprite.alpha_composite(crop)
sprite.putalpha(mask)

# Trim transparent padding.
alpha_bbox = sprite.getbbox()
sprite = sprite.crop(alpha_bbox)
sprite.save(out)

# Checkerboard preview with scale-up.
scale = 4
checker = Image.new("RGBA", (sprite.width * scale + 80, sprite.height * scale + 80), (25, 25, 30, 255))
cd = ImageDraw.Draw(checker)
tile = 16
for y in range(0, checker.height, tile):
    for x in range(0, checker.width, tile):
        if (x // tile + y // tile) % 2 == 0:
            cd.rectangle((x, y, x + tile - 1, y + tile - 1), fill=(55, 55, 62, 255))
big = sprite.resize((sprite.width * scale, sprite.height * scale), Image.LANCZOS)
checker.alpha_composite(big, (40, 40))
cd.rectangle((39, 39, 40 + big.width, 40 + big.height), outline=(255, 214, 80, 255), width=2)
checker.save(preview)

print(out)
print(preview)
