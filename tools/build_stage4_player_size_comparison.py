from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "stage4" / "assets" / "level1-airlock"
PLAYER = Image.open(ASSETS / "player-sheet-cells-v8.png").convert("RGBA")
REACTION = Image.open(ASSETS / "player-ng-reaction-cells-v2.png").convert("RGBA")

CELL = 420
HEADER = 54
comparison = Image.new("RGBA", (CELL * 5, CELL + HEADER), (11, 18, 34, 255))

frames = [
    ("LEFT", PLAYER.crop((0, CELL * 3, CELL, CELL * 4))),
    ("RIGHT", PLAYER.crop((0, CELL, CELL, CELL * 2))),
    ("UP", PLAYER.crop((0, CELL * 2, CELL, CELL * 3))),
    ("DOWN", PLAYER.crop((0, 0, CELL, CELL))),
    ("SHRUG", REACTION.crop((CELL * 3, 0, CELL * 4, CELL))),
]

for index, (label, frame) in enumerate(frames):
    x = index * CELL
    comparison.alpha_composite(frame, (x, HEADER))

draw = ImageDraw.Draw(comparison)
font = ImageFont.load_default(size=24)
for index, (label, _) in enumerate(frames):
    left = index * CELL
    box = draw.textbbox((0, 0), label, font=font)
    width = box[2] - box[0]
    draw.text((left + (CELL - width) / 2, 15), label, fill=(255, 232, 157, 255), font=font)
    if index:
        draw.line((left, 0, left, CELL + HEADER), fill=(75, 101, 134, 255), width=2)

# All three cells use the same original player foot anchor/baseline.
baseline_y = HEADER + 398
draw.line((0, baseline_y, CELL * 5, baseline_y), fill=(117, 245, 238, 180), width=2)

destination = ASSETS / "player-size-comparison-v3.png"
comparison.convert("RGB").save(destination, optimize=True)
print(destination)
