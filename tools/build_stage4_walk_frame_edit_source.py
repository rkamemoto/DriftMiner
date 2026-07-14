from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "stage4" / "level1-airlock"
SHEET = Image.open(ASSETS / "player-sheet-cells-v4.png").convert("RGBA")
CELL = 420

if SHEET.size != (CELL * 3, CELL * 4):
    raise RuntimeError(f"Unexpected player sheet size: {SHEET.size}")

preview = Image.new("RGBA", (CELL * 2, CELL), (0, 255, 0, 255))

# Third animation frame only: right-facing row 1, then left-facing row 3.
right = SHEET.crop((CELL * 2, CELL, CELL * 3, CELL * 2))
left = SHEET.crop((CELL * 2, CELL * 3, CELL * 3, CELL * 4))
preview.alpha_composite(right, (0, 0))
preview.alpha_composite(left, (CELL, 0))

destination = ASSETS / "player-side-third-frame-edit-source-v1.png"
preview.convert("RGB").save(destination, optimize=True)
print(destination)
