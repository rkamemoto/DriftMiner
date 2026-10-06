from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "stage4" / "assets" / "level1-airlock"
original = Image.open(ASSETS / "airlock-background-v1.png").convert("RGBA")
cleaned = Image.open(ASSETS / "airlock-background-sprites-v3.png").convert("RGBA")

# Full original locker bounds in the 1536x1024 painting. This deliberately
# includes the pink cap, orange outer housing, beige front, and open side door.
box = (360, 240, 625, 690)
source = original.crop(box)
clean = cleaned.crop(box)

# The two paintings are pixel-aligned. Their difference isolates the locker
# structure that was painted out of the cleaned room while leaving the shared
# interior contents transparent so they remain supplied by the background.
difference = ImageChops.difference(source.convert("RGB"), clean.convert("RGB"))
difference = difference.convert("L", matrix=(.333, .333, .333, 0))
alpha = difference.point(lambda value: max(0, min(255, (value - 5) * 22)))

# Exclude neighboring scanner/wall details while following the full locker's
# silhouette. The difference matte supplies the detailed antialiased edge.
silhouette = Image.new("L", source.size, 0)
draw = ImageDraw.Draw(silhouette)
draw.polygon([
    (104, 0), (138, 54), (198, 58), (235, 88), (260, 124),
    (260, 405), (230, 438), (62, 446), (12, 414), (2, 102),
    (28, 68), (82, 54),
], fill=255)
alpha = ImageChops.multiply(alpha, silhouette)
alpha = alpha.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(.55))

# The cleaned room already retains the shelves and their contents. Remove the
# entire open cavity from the sprite so tiny source/cleanup differences cannot
# stack into pale "ghost" artifacts when the layers are recomposited.
interior = Image.new("L", source.size, 0)
interior_draw = ImageDraw.Draw(interior)
interior_draw.polygon([
    (91, 132), (181, 132), (194, 151), (194, 405),
    (67, 405), (67, 169), (78, 146),
], fill=255)
interior = interior.filter(ImageFilter.GaussianBlur(.7))
alpha = ImageChops.subtract(alpha, interior)

# The helmet is its own collectible sprite and must not remain baked into the
# locker after pickup. Remove its overlap at the bottom-left of this crop.
helmet_overlap = Image.new("L", source.size, 0)
helmet_draw = ImageDraw.Draw(helmet_overlap)
# The helmet's tall rear fin reaches farther right than its dome. Trace the
# complete overlap rather than using only a dome-shaped ellipse.
helmet_draw.polygon([
    (0, 385), (32, 370), (78, 365), (119, 375),
    (153, 401), (178, 450), (0, 450),
], fill=255)
helmet_overlap = helmet_overlap.filter(ImageFilter.GaussianBlur(.8))
alpha = ImageChops.subtract(alpha, helmet_overlap)

sprite = source.copy()
sprite.putalpha(alpha)
destination = ASSETS / "locker-sprite-full-v3.png"
sprite.save(destination, optimize=True)

# Verification: the recovered sprite recomposited over the cleaned painting.
reconstructed = cleaned.copy()
reconstructed.alpha_composite(sprite, box[:2])
comparison_box = (350, 205, 635, 710)
left = original.crop(comparison_box).convert("RGB")
right = reconstructed.crop(comparison_box).convert("RGB")
preview = Image.new("RGB", (left.width * 2, left.height + 44), "#090d18")
preview.paste(left, (0, 44))
preview.paste(right, (left.width, 44))
labels = ImageDraw.Draw(preview)
labels.text((12, 14), "ORIGINAL", fill="#ffe29b")
labels.text((left.width + 12, 14), "RECOVERED SPRITE COMPOSITE", fill="#ffe29b")
preview_destination = ASSETS / "locker-full-recovery-comparison-v3.png"
preview.save(preview_destination, optimize=True)

print(destination)
print(preview_destination)
