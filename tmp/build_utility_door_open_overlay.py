from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

root = Path(__file__).resolve().parents[1]
bg_path = root / "assets/stage4/level3-utility-closet/utility-closet-background-v5.png"
out = root / "assets/stage4/level3-utility-closet/utility-center-door-open-overlay-v2.png"
preview = root / "tmp/utility-center-door-open-overlay-preview-v2.png"

bg = Image.open(bg_path).convert("RGBA")
overlay = Image.new("RGBA", bg.size, (0, 0, 0, 0))
draw = ImageDraw.Draw(overlay)

# Coordinates are in original 1536x1024 source art.
# Paint a recessed dark doorway only inside the lower door aperture. Do not
# paste any part of the closed door slab; that caused the weird cutout shape.
door_inner = (652, 190, 805, 374)
draw.rounded_rectangle(door_inner, radius=26, fill=(6, 8, 14, 242))
draw.rounded_rectangle((672, 210, 787, 352), radius=18, fill=(16, 20, 30, 236))

# Subtle horizontal ridges in the darkness imply a corridor/deck beyond.
for y in range(232, 336, 28):
    draw.line((684, y, 774, y + 3), fill=(57, 70, 84, 120), width=4)

# Add a cyan glint at the top of the opened mechanism.
draw.rounded_rectangle((682, 178, 778, 188), radius=5, fill=(53, 226, 240, 72))
draw.line((670, 378, 790, 378), fill=(58, 210, 224, 110), width=3)

overlay.save(out)

canvas = bg.resize((960, 640), Image.LANCZOS)
canvas.alpha_composite(overlay.resize((960, 640), Image.LANCZOS))
canvas.save(preview)
print(out)
print(preview)
