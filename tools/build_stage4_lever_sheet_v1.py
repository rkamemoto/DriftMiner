from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "stage4" / "assets" / "level1-airlock"
UP = Image.open(ASSETS / "lever-sprite-v1.png").convert("RGBA")
DOWN = Image.open(ASSETS / "lever-down-alpha-v1.png").convert("RGBA")

if DOWN.size != UP.size:
    raise RuntimeError(f"Lever frames must share one cell size: {UP.size} != {DOWN.size}")

sheet = Image.new("RGBA", (UP.width * 2, UP.height), (0, 0, 0, 0))
sheet.alpha_composite(UP, (0, 0))
sheet.alpha_composite(DOWN, (UP.width, 0))

destination = ASSETS / "lever-sheet-v1.png"
sheet.save(destination, optimize=True)
print(destination)
print(sheet.size, "cell", UP.size)
