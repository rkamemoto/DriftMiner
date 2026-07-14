from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "stage4" / "level1-airlock"
SOURCE = Image.open(ASSETS / "player-sheet-cells-v6.png").convert("RGBA")

CELL = 420
UP_ROW = 2
DOWN_ROW = 0
reference = SOURCE.crop((0, UP_ROW * CELL, CELL, (UP_ROW + 1) * CELL))
reference_bbox = reference.getchannel("A").getbbox()
if not reference_bbox:
    raise RuntimeError("Up-facing reference frame is empty")
target_height = reference_bbox[3] - reference_bbox[1]
target_bottom = reference_bbox[3]

output = SOURCE.copy()
for column in range(3):
    source_frame = SOURCE.crop((
        column * CELL,
        DOWN_ROW * CELL,
        (column + 1) * CELL,
        (DOWN_ROW + 1) * CELL,
    ))
    bbox = source_frame.getchannel("A").getbbox()
    if not bbox:
        raise RuntimeError(f"Down-facing frame {column} is empty")
    character = source_frame.crop(bbox)
    scale = target_height / character.height
    width = round(character.width * scale)
    character = character.resize((width, target_height), Image.Resampling.LANCZOS)
    cell_image = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    cell_image.alpha_composite(character, ((CELL - width) // 2, target_bottom - target_height))
    output.paste(cell_image, (column * CELL, DOWN_ROW * CELL))

destination = ASSETS / "player-sheet-cells-v7.png"
output.save(destination, optimize=True)
print(destination)
print(output.size, "target", reference_bbox)
