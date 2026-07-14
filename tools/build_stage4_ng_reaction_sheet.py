from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "stage4" / "level1-airlock"
SOURCE = Image.open(ASSETS / "player-ng-reaction-alpha-v1.png").convert("RGBA")
PLAYER_SHEET = Image.open(ASSETS / "player-sheet-cells-v6.png").convert("RGBA")

FRAME_COUNT = 4
if SOURCE.width % FRAME_COUNT:
    raise RuntimeError(f"Reaction strip width is not divisible by four: {SOURCE.size}")

source_width = SOURCE.width // FRAME_COUNT
cell = 420
reference = PLAYER_SHEET.crop((0, cell * 2, cell, cell * 3))
reference_bbox = reference.getchannel("A").getbbox()
if not reference_bbox:
    raise RuntimeError("Front-facing reference frame is empty")
target_height = reference_bbox[3] - reference_bbox[1]
target_bottom = reference_bbox[3]
output = Image.new("RGBA", (cell * FRAME_COUNT, cell), (0, 0, 0, 0))

for frame_index in range(FRAME_COUNT):
    frame = SOURCE.crop((
        frame_index * source_width,
        0,
        (frame_index + 1) * source_width,
        SOURCE.height,
    ))
    bbox = frame.getchannel("A").getbbox()
    if not bbox:
        raise RuntimeError(f"Reaction frame {frame_index} is empty")
    character = frame.crop(bbox)
    scale = target_height / character.height
    target_width = round(character.width * scale)
    character = character.resize((target_width, target_height), Image.Resampling.LANCZOS)
    x = frame_index * cell + (cell - target_width) // 2
    y = target_bottom - target_height
    output.alpha_composite(character, (x, y))

destination = ASSETS / "player-ng-reaction-cells-v2.png"
output.save(destination, optimize=True)
print(destination)
print(output.size, "cell", cell, "reference", reference_bbox)
