from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "stage4" / "assets" / "level1-airlock"
SOURCE = Image.open(ASSETS / "player-sheet-cells-v7.png").convert("RGBA")

CELL = 420
UP_ROW = 2
SIDE_ROWS = (1, 3)

reference = SOURCE.crop((0, UP_ROW * CELL, CELL, (UP_ROW + 1) * CELL))
reference_bbox = reference.getchannel("A").getbbox()
if not reference_bbox:
    raise RuntimeError("Up-facing reference frame is empty")

target_height = reference_bbox[3] - reference_bbox[1]
target_bottom = reference_bbox[3]
output = SOURCE.copy()

for row in SIDE_ROWS:
    for column in range(3):
        frame = SOURCE.crop((
            column * CELL,
            row * CELL,
            (column + 1) * CELL,
            (row + 1) * CELL,
        ))
        bbox = frame.getchannel("A").getbbox()
        if not bbox:
            raise RuntimeError(f"Side frame {row}:{column} is empty")
        character = frame.crop(bbox)
        scale = target_height / character.height
        target_width = round(character.width * scale)
        character = character.resize(
            (target_width, target_height), Image.Resampling.LANCZOS
        )
        normalized = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
        normalized.alpha_composite(
            character,
            ((CELL - target_width) // 2, target_bottom - target_height),
        )
        output.paste(normalized, (column * CELL, row * CELL))

destination = ASSETS / "player-sheet-cells-v8.png"
output.save(destination, optimize=True)
print(destination)
print(output.size, "target", reference_bbox)
