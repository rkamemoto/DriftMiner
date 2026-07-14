from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "stage4" / "level1-airlock"
original = Image.open(ASSETS / "airlock-background-v1.png").convert("RGB")
cleaned = Image.open(ASSETS / "airlock-background-sprites-v3.png").convert("RGB")

# Includes the complete orange outer housing, beige front frame, interior, and
# open orange door—not merely the narrow inner doorway used by the old cutout.
box = (350, 205, 635, 710)
left = original.crop(box)
right = cleaned.crop(box)

header = 44
preview = Image.new("RGB", (left.width * 2, left.height + header), "#090d18")
preview.paste(left, (0, header))
preview.paste(right, (left.width, header))
draw = ImageDraw.Draw(preview)
draw.text((12, 14), "ORIGINAL FULL LOCKER", fill="#ffe29b")
draw.text((left.width + 12, 14), "CLEANED BACKGROUND", fill="#ffe29b")

destination = ASSETS / "locker-full-source-comparison-v1.png"
preview.save(destination, optimize=True)
print(destination)
