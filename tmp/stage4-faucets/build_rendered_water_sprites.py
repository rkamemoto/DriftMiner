from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parent
PROJECT = ROOT.parent.parent
ASSETS = PROJECT / "assets" / "stage4" / "level4-bathroom"
SOURCE = ASSETS / "bathroom-faucets-water-on-source-v1.png"
PREVIEW = ROOT / "rendered-water-sprites-preview-v1.png"

# Tight patches include the painted faucet, stream, contained basin ripple, and
# enough of the sink rim to blend seamlessly over the normal/off artwork.
PATCHES = {
    "left": (365, 300, 470, 410),
    "middle": (520, 285, 620, 390),
    "right": (655, 265, 770, 375),
}

source = Image.open(SOURCE).convert("RGBA")
sprites = {}
for name, box in PATCHES.items():
    sprite = source.crop(box)
    inset = 5
    alpha = Image.new("L", sprite.size, 0)
    ImageDraw.Draw(alpha).rounded_rectangle(
        (inset, inset, sprite.width - inset - 1, sprite.height - inset - 1),
        radius=12,
        fill=255,
    )
    alpha = alpha.filter(ImageFilter.GaussianBlur(5))
    sprite.putalpha(alpha)
    out = ASSETS / f"faucet-water-{name}-art-v1.png"
    sprite.save(out)
    sprites[name] = (sprite, box)

# Preview at the exact 960x640 game resolution.
room = Image.open(ASSETS / "bathroom-background-closed-v2.png").convert("RGBA")
for sprite, box in sprites.values():
    room.alpha_composite(sprite, (box[0], box[1]))
room = room.resize((960, 640), Image.Resampling.LANCZOS)
room.save(PREVIEW)

for name, (sprite, box) in sprites.items():
    x1, y1, x2, y2 = box
    print(
        f"{name}: source=({x1},{y1},{x2-x1},{y2-y1}) "
        f"canvas=({x1*.625:.3f},{y1*.625:.3f},{(x2-x1)*.625:.3f},{(y2-y1)*.625:.3f})"
    )
print(PREVIEW)
