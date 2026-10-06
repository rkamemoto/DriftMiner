from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "stage4" / "assets" / "level1-airlock"
BASE = Image.open(ASSETS / "player-sheet-cells-v4.png").convert("RGBA")
SIDE_CYCLES = Image.open(ASSETS / "player-left-right-walk-alpha-v5.png").convert("RGBA")

CELL = 420
SOURCE_CELL = 512
if BASE.size != (CELL * 3, CELL * 4):
    raise RuntimeError(f"Unexpected base sheet size: {BASE.size}")
if SIDE_CYCLES.size != (SOURCE_CELL * 3, SOURCE_CELL * 2):
    raise RuntimeError(f"Unexpected side-cycle sheet size: {SIDE_CYCLES.size}")

output = BASE.copy()


def replace_row(source_row, target_row):
    for column in range(3):
        frame = SIDE_CYCLES.crop((
            column * SOURCE_CELL,
            source_row * SOURCE_CELL,
            (column + 1) * SOURCE_CELL,
            (source_row + 1) * SOURCE_CELL,
        )).resize((CELL, CELL), Image.Resampling.LANCZOS)
        output.paste(frame, (column * CELL, target_row * CELL))


# Game direction rows: down=0, right=1, up=2, left=3.
replace_row(source_row=1, target_row=1)
replace_row(source_row=0, target_row=3)

destination = ASSETS / "player-sheet-cells-v5.png"
output.save(destination, optimize=True)
print(destination)
print(output.size)
